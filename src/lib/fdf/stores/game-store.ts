import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FdfGame,
  DriveInput,
  DriveEntry,
  DriveResultType,
  QuarterScore,
  GameClock,
  GameMode,
  OvertimeState,
} from "../types";
import { generateId } from "../id";
import { STORAGE_KEYS, getTimingConfig } from "../constants";
import { consumeTicks, startOvertime, startNewOTPeriod } from "../game-clock";
import { getPointsForResult, addToQuarterScore, isDefenseScoringTD, isScoringPlay } from "../scoring";

function emptyQuarterScore(): QuarterScore {
  return { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0, total: 0 };
}

function initialClock(mode?: GameMode): GameClock {
  const config = getTimingConfig(mode);
  return { quarter: 1, ticksRemaining: config.ticksPerQuarter, isHalftime: false, isGameOver: false };
}

/**
 * Returns true if the drive result does NOT change possession.
 * KICK_PUNT_KICK_TD and KICK_PUNT_REC_RECOVERS keep possession with the current team.
 */
function doesDriveEndPossession(result: DriveResultType): boolean {
  if (isDefenseScoringTD(result) || result === "KICK_PUNT_REC_RECOVERS"
      || result === "ONSIDE_KICK_FAIL") {
    return false; // no possession change
  }
  return true;
}

/**
 * Recompute overtime state by replaying OT drives from scratch.
 * Used after undo to rebuild possession tracking.
 */
function recomputeOvertimeState(
  game: FdfGame,
  otState: OvertimeState,
): OvertimeState | undefined {
  const otDrives = game.drives.filter(d => d.driveNumber >= otState.otStartDriveNumber);

  if (otDrives.length === 0) {
    // No OT drives left — still at start of OT
    return {
      ...otState,
      phase: "guaranteed_possession",
      firstTeamPossessionComplete: false,
      secondTeamPossessionComplete: false,
    };
  }

  const receivingTeamId = otState.receivingTeam === "home" ? game.homeTeamId : game.awayTeamId;
  const kickingTeamId = otState.receivingTeam === "home" ? game.awayTeamId : game.homeTeamId;

  let firstComplete = false;
  let secondComplete = false;

  for (const drive of otDrives) {
    const isFirstTeamDrive = drive.teamId === receivingTeamId;
    const isSecondTeamDrive = drive.teamId === kickingTeamId;

    // Safety on first possession by first team → game over immediately (not tracked here)
    // Just track possession completions
    if (isFirstTeamDrive && !firstComplete && doesDriveEndPossession(drive.result)) {
      firstComplete = true;
    } else if (isSecondTeamDrive && firstComplete && !secondComplete && doesDriveEndPossession(drive.result)) {
      secondComplete = true;
    }
  }

  const phase = (firstComplete && secondComplete) ? "sudden_death" : "guaranteed_possession";

  return {
    ...otState,
    phase,
    firstTeamPossessionComplete: firstComplete,
    secondTeamPossessionComplete: secondComplete,
  };
}

/**
 * Evaluate OT state after a drive is added. Returns updated game fields.
 */
function evaluateOTAfterDrive(
  game: FdfGame,
  driveEntry: DriveEntry,
  homeScore: QuarterScore,
  awayScore: QuarterScore,
  clockExpired: boolean,
): {
  overtimeState: OvertimeState;
  isGameOver: boolean;
  newClock?: GameClock;
} {
  const ot = game.overtimeState!;
  const receivingTeamId = ot.receivingTeam === "home" ? game.homeTeamId : game.awayTeamId;
  const kickingTeamId = ot.receivingTeam === "home" ? game.awayTeamId : game.homeTeamId;
  const scoreDiff = homeScore.total - awayScore.total;
  const isTied = scoreDiff === 0;

  const isFirstTeamDrive = driveEntry.teamId === receivingTeamId;
  const isSecondTeamDrive = driveEntry.teamId === kickingTeamId;
  const possessionEnded = doesDriveEndPossession(driveEntry.result);

  let firstComplete = ot.firstTeamPossessionComplete;
  let secondComplete = ot.secondTeamPossessionComplete;

  // Track possession completions
  if (isFirstTeamDrive && !firstComplete && possessionEnded) {
    firstComplete = true;
  } else if (isSecondTeamDrive && firstComplete && !secondComplete && possessionEnded) {
    secondComplete = true;
  }

  // --- Safety on first possession: immediate game over ---
  if (driveEntry.result === "SAFETY" && !ot.firstTeamPossessionComplete && isFirstTeamDrive) {
    return {
      overtimeState: { ...ot, firstTeamPossessionComplete: true, phase: "sudden_death" },
      isGameOver: true,
    };
  }

  // --- Guaranteed possession phase ---
  if (!firstComplete || !secondComplete) {
    // Still in guaranteed possession phase
    const updatedOt: OvertimeState = {
      ...ot,
      phase: "guaranteed_possession",
      firstTeamPossessionComplete: firstComplete,
      secondTeamPossessionComplete: secondComplete,
    };

    if (clockExpired) {
      // Clock expired but guaranteed possessions not complete → keep playing
      if (!firstComplete || !secondComplete) {
        return {
          overtimeState: updatedOt,
          isGameOver: false,
          // Override clock: keep it at 0 ticks but not game over
          newClock: { quarter: 5, ticksRemaining: 0, isHalftime: false, isGameOver: false },
        };
      }
    }

    return {
      overtimeState: updatedOt,
      isGameOver: false,
    };
  }

  // --- Both teams had a possession ---
  // Check if score is different after both teams had their possession
  if (!isTied) {
    // Someone is ahead → game over
    return {
      overtimeState: { ...ot, firstTeamPossessionComplete: firstComplete, secondTeamPossessionComplete: secondComplete, phase: "sudden_death" },
      isGameOver: true,
    };
  }

  // Both had a possession and still tied → sudden death
  const suddenDeathOt: OvertimeState = {
    ...ot,
    phase: "sudden_death",
    firstTeamPossessionComplete: firstComplete,
    secondTeamPossessionComplete: secondComplete,
  };

  // In sudden death, any scoring play with score difference → game over
  if (isScoringPlay(driveEntry.result) && !isTied) {
    return {
      overtimeState: suddenDeathOt,
      isGameOver: true,
    };
  }

  if (clockExpired) {
    if (ot.canEndInTie) {
      // Regular season: tie
      return {
        overtimeState: suddenDeathOt,
        isGameOver: true,
      };
    } else {
      // Playoffs: new OT period
      const newPeriod = ot.period + 1;
      // Alternate receiver
      const newReceiver: "home" | "away" = ot.receivingTeam === "home" ? "away" : "home";
      return {
        overtimeState: {
          ...ot,
          phase: "guaranteed_possession",
          receivingTeam: newReceiver,
          firstTeamPossessionComplete: false,
          secondTeamPossessionComplete: false,
          period: newPeriod,
          otStartDriveNumber: driveEntry.driveNumber + 1,
        },
        isGameOver: false,
        newClock: startNewOTPeriod(),
      };
    }
  }

  return {
    overtimeState: suddenDeathOt,
    isGameOver: false,
  };
}

interface GameState {
  games: Record<string, FdfGame>;
  createGame: (homeTeamId: string, awayTeamId: string, enhancedMode?: boolean, receivingTeam?: "home" | "away", gameMode?: GameMode) => string;
  addDrive: (gameId: string, input: DriveInput) => void;
  undoLastDrive: (gameId: string) => void;
  completeGame: (gameId: string) => void;
  switchPossession: (gameId: string) => void;
  endHalf: (gameId: string) => void;
  endGame: (gameId: string) => void;
  initOvertime: (gameId: string, coinTossWinner: "home" | "away", canEndInTie: boolean) => void;
  deleteGame: (gameId: string) => void;
  getGame: (id: string) => FdfGame | undefined;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      games: {},

      createGame: (homeTeamId, awayTeamId, enhancedMode, receivingTeam, gameMode) => {
        const id = generateId();
        const game: FdfGame = {
          id,
          homeTeamId,
          awayTeamId,
          status: "in_progress",
          score: { home: emptyQuarterScore(), away: emptyQuarterScore() },
          gameClock: initialClock(gameMode),
          drives: [],
          currentPossession: receivingTeam || "away", // receiving team gets first offensive drive
          openingKickoffReceiver: receivingTeam || "away",
          enhancedMode: enhancedMode || undefined,
          gameMode: gameMode || undefined,
          startedAt: new Date().toISOString(),
        };
        set((state) => ({ games: { ...state.games, [id]: game } }));
        return id;
      },

      initOvertime: (gameId, coinTossWinner, canEndInTie) => {
        set((state) => {
          const game = state.games[gameId];
          if (!game || game.status !== "in_progress") return state;

          // Coin toss winner elects to receive (standard NFL)
          const receivingTeam = coinTossWinner;
          const config = getTimingConfig(game.gameMode);
          const otClock = startOvertime(config);
          const otState: OvertimeState = {
            phase: "guaranteed_possession",
            coinTossWinner,
            receivingTeam,
            firstTeamPossessionComplete: false,
            secondTeamPossessionComplete: false,
            period: 1,
            canEndInTie,
            otStartDriveNumber: game.drives.length + 1,
          };

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                gameClock: otClock,
                currentPossession: receivingTeam,
                overtimeState: otState,
              },
            },
          };
        });
      },

      addDrive: (gameId, input) => {
        set((state) => {
          const game = state.games[gameId];
          if (!game || game.status !== "in_progress") return state;

          const { offensePoints, defensePoints } = getPointsForResult(input.result, input.patResult);

          // Determine which team is on offense for this drive
          const offenseTeamId = game.currentPossession === "home" ? game.homeTeamId : game.awayTeamId;

          // Consume clock ticks FIRST to determine which quarter the drive ends in
          const config = getTimingConfig(game.gameMode);
          const clockResult = consumeTicks(game.gameClock, input.driveTicks, config);
          let newClock = clockResult.newClock;

          // Effective quarter: where the drive result actually occurs.
          // - Quarter crossed (Q1→Q2, Q3→Q4): score in the new quarter (overflow carried)
          // - Halftime (Q2→Q3): score in Q2 (half ended, overflow discarded)
          // - Game ended (Q4/Q5): score in the original quarter
          // - No change: score in the current quarter
          const effectiveQuarter: 1 | 2 | 3 | 4 | 5 = (
            clockResult.quarterChanged && !clockResult.halfEnded && !clockResult.gameEnded
              ? newClock.quarter
              : game.gameClock.quarter
          ) as 1 | 2 | 3 | 4 | 5;

          // Attribution: offense points go to offense team, defense points to other team
          let homeScore = { ...game.score.home };
          let awayScore = { ...game.score.away };

          if (game.currentPossession === "home") {
            homeScore = addToQuarterScore(homeScore, effectiveQuarter, offensePoints);
            awayScore = addToQuarterScore(awayScore, effectiveQuarter, defensePoints);
          } else {
            awayScore = addToQuarterScore(awayScore, effectiveQuarter, offensePoints);
            homeScore = addToQuarterScore(homeScore, effectiveQuarter, defensePoints);
          }

          // Q4 ends tied: set up "waiting for OT coin toss" state instead of auto-starting OT
          if (clockResult.gameEnded && game.gameClock.quarter === 4 && homeScore.total === awayScore.total) {
            newClock = {
              quarter: 4,
              ticksRemaining: 0,
              isHalftime: false,
              isGameOver: false,
            };
          }

          // Build score-after-drive string
          const scoreAfterDrive = `${awayScore.total}-${homeScore.total}`;

          const driveEntry: DriveEntry = {
            id: generateId(),
            driveNumber: game.drives.length + 1,
            quarter: effectiveQuarter,
            teamId: offenseTeamId,
            fieldPosition: input.fieldPosition,
            driveTicks: input.driveTicks,
            result: input.result,
            patResult: input.patResult,
            offensePoints,
            defensePoints,
            summary: input.summary,
            scoreAfterDrive,
            playerInvolvement: input.playerInvolvement,
            diceValues: input.diceValues,
            deciderDieValue: input.deciderDieValue,
            createdAt: new Date().toISOString(),
          };

          // Toggle possession
          let nextPossession: "home" | "away";
          if (isDefenseScoringTD(input.result) || input.result === "KICK_PUNT_REC_RECOVERS"
              || input.result === "ONSIDE_KICK_FAIL") {
            // Defense scored TD, receiving team recovered fumble, or onside kick failed → no possession change
            nextPossession = game.currentPossession;
          } else if (input.result === "ONSIDE_KICK_SUCCESS") {
            // Onside kick recovered: possession switches back to kicking team
            nextPossession = game.currentPossession === "home" ? "away" : "home";
          } else {
            // Normal toggle
            nextPossession = game.currentPossession === "home" ? "away" : "home";
          }

          // After halftime, the team that kicked off at game start receives
          if (clockResult.halfEnded) {
            nextPossession = game.openingKickoffReceiver === "home" ? "away" : "home";
          }

          const updatedGame: FdfGame = {
            ...game,
            score: { home: homeScore, away: awayScore },
            gameClock: newClock,
            drives: [...game.drives, driveEntry],
            currentPossession: nextPossession,
          };

          // --- OT logic ---
          if (game.gameClock.quarter === 5 && game.overtimeState) {
            const otResult = evaluateOTAfterDrive(
              updatedGame,
              driveEntry,
              homeScore,
              awayScore,
              clockResult.gameEnded,
            );

            updatedGame.overtimeState = otResult.overtimeState;

            if (otResult.newClock) {
              updatedGame.gameClock = otResult.newClock;
            }

            if (otResult.isGameOver) {
              updatedGame.gameClock = {
                ...updatedGame.gameClock,
                isGameOver: true,
              };
              updatedGame.status = "completed";
              updatedGame.completedAt = new Date().toISOString();
            }
          } else if (!game.overtimeState) {
            // Non-OT: auto-complete if game ended and score is different
            if (newClock.isGameOver && homeScore.total !== awayScore.total) {
              updatedGame.status = "completed";
              updatedGame.completedAt = new Date().toISOString();
            }
          }

          return { games: { ...state.games, [gameId]: updatedGame } };
        });
      },

      undoLastDrive: (gameId) => {
        set((state) => {
          const game = state.games[gameId];
          if (!game || game.drives.length === 0) return state;

          const lastDrive = game.drives[game.drives.length - 1];
          const newDrives = game.drives.slice(0, -1);

          // Reverse the score
          let homeScore = { ...game.score.home };
          let awayScore = { ...game.score.away };

          // Figure out who got what points
          const wasHomePossession = lastDrive.teamId === game.homeTeamId;
          if (wasHomePossession) {
            homeScore = addToQuarterScore(homeScore, lastDrive.quarter, -lastDrive.offensePoints);
            awayScore = addToQuarterScore(awayScore, lastDrive.quarter, -lastDrive.defensePoints);
          } else {
            awayScore = addToQuarterScore(awayScore, lastDrive.quarter, -lastDrive.offensePoints);
            homeScore = addToQuarterScore(homeScore, lastDrive.quarter, -lastDrive.defensePoints);
          }

          // Restore clock: add the ticks back to the quarter the drive was in
          const undoConfig = getTimingConfig(game.gameMode);
          let ticksForQuarter = undoConfig.ticksPerQuarter;
          if (lastDrive.quarter === 5) {
            ticksForQuarter = undoConfig.ticksPerOTPeriod;
          }
          const restoredClock: GameClock = {
            quarter: lastDrive.quarter,
            ticksRemaining: Math.min(
              ticksForQuarter,
              (game.gameClock.quarter === lastDrive.quarter
                ? game.gameClock.ticksRemaining
                : 0) + lastDrive.driveTicks,
            ),
            isHalftime: false,
            isGameOver: false,
          };

          // Restore possession to whoever had it for the undone drive
          const restoredPossession: "home" | "away" = wasHomePossession ? "home" : "away";

          // Recompute OT state if we have one
          let restoredOT = game.overtimeState;
          if (restoredOT) {
            const tempGame: FdfGame = {
              ...game,
              drives: newDrives,
              gameClock: restoredClock,
            };
            restoredOT = recomputeOvertimeState(tempGame, restoredOT);
          }

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                status: "in_progress",
                completedAt: undefined,
                score: { home: homeScore, away: awayScore },
                gameClock: restoredClock,
                drives: newDrives,
                currentPossession: restoredPossession,
                overtimeState: restoredOT,
              },
            },
          };
        });
      },

      completeGame: (gameId) => {
        set((state) => {
          const game = state.games[gameId];
          if (!game) return state;
          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                status: "completed",
                completedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      switchPossession: (gameId) => {
        set((state) => {
          const game = state.games[gameId];
          if (!game || game.status !== "in_progress" || game.gameClock.isGameOver) return state;
          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                currentPossession: game.currentPossession === "home" ? "away" : "home",
              },
            },
          };
        });
      },

      endHalf: (gameId) => {
        set((state) => {
          const game = state.games[gameId];
          if (!game || game.status !== "in_progress") return state;
          // Only works in first half (Q1 or Q2)
          if (game.gameClock.quarter > 2) return state;
          const halfConfig = getTimingConfig(game.gameMode);
          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                gameClock: {
                  quarter: 3,
                  ticksRemaining: halfConfig.ticksPerQuarter,
                  isHalftime: false,
                  isGameOver: false,
                },
                currentPossession: game.openingKickoffReceiver === "home" ? "away" : "home",
              },
            },
          };
        });
      },

      endGame: (gameId) => {
        set((state) => {
          const game = state.games[gameId];
          if (!game || game.status !== "in_progress") return state;

          // In OT (Q5)
          if (game.gameClock.quarter === 5 && game.overtimeState) {
            const isTied = game.score.home.total === game.score.away.total;
            if (isTied && game.overtimeState.canEndInTie) {
              // Regular season: end as tie
              return {
                games: {
                  ...state.games,
                  [gameId]: {
                    ...game,
                    gameClock: { ...game.gameClock, ticksRemaining: 0, isGameOver: true },
                    status: "completed",
                    completedAt: new Date().toISOString(),
                  },
                },
              };
            } else if (isTied && !game.overtimeState.canEndInTie) {
              // Playoffs: new OT period
              const newPeriod = game.overtimeState.period + 1;
              const newReceiver: "home" | "away" = game.overtimeState.receivingTeam === "home" ? "away" : "home";
              const otConfig = getTimingConfig(game.gameMode);
              return {
                games: {
                  ...state.games,
                  [gameId]: {
                    ...game,
                    gameClock: startNewOTPeriod(otConfig),
                    overtimeState: {
                      ...game.overtimeState,
                      phase: "guaranteed_possession",
                      receivingTeam: newReceiver,
                      firstTeamPossessionComplete: false,
                      secondTeamPossessionComplete: false,
                      period: newPeriod,
                      otStartDriveNumber: game.drives.length + 1,
                    },
                    currentPossession: newReceiver,
                  },
                },
              };
            } else {
              // Not tied: end game
              return {
                games: {
                  ...state.games,
                  [gameId]: {
                    ...game,
                    gameClock: { ...game.gameClock, ticksRemaining: 0, isGameOver: true },
                    status: "completed",
                    completedAt: new Date().toISOString(),
                  },
                },
              };
            }
          }

          // Q3 or Q4 (non-OT)
          if (game.gameClock.quarter < 3) return state;

          // If tied at end of Q4, go to OT waiting state (coin toss)
          if (game.score.home.total === game.score.away.total) {
            return {
              games: {
                ...state.games,
                [gameId]: {
                  ...game,
                  gameClock: {
                    quarter: 4,
                    ticksRemaining: 0,
                    isHalftime: false,
                    isGameOver: false,
                  },
                },
              },
            };
          }

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                gameClock: {
                  ...game.gameClock,
                  ticksRemaining: 0,
                  isGameOver: true,
                },
                status: "completed",
                completedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      deleteGame: (gameId) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [gameId]: _removed, ...rest } = state.games;
          return { games: rest };
        });
      },

      getGame: (id) => get().games[id],
    }),
    {
      name: STORAGE_KEYS.GAMES,
      version: 1,
      migrate: (persisted, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as any;
        // v0 → v1: add openingKickoffReceiver (default "away" for existing games)
        if (version === 0 && state?.games) {
          for (const game of Object.values(state.games)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const g = game as any;
            if (!g.openingKickoffReceiver) {
              g.openingKickoffReceiver = "away";
            }
          }
        }
        return state;
      },
    }
  )
);
