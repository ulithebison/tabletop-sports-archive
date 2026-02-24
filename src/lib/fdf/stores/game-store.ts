import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FdfGame,
  DriveInput,
  DriveEntry,
  QuarterScore,
  GameClock,
} from "../types";
import { generateId } from "../id";
import { STORAGE_KEYS, TICKS_PER_QUARTER } from "../constants";
import { consumeTicks, startOvertime } from "../game-clock";
import { getPointsForResult, addToQuarterScore, isDefenseScoringTD } from "../scoring";

function emptyQuarterScore(): QuarterScore {
  return { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0, total: 0 };
}

function initialClock(): GameClock {
  return { quarter: 1, ticksRemaining: TICKS_PER_QUARTER, isHalftime: false, isGameOver: false };
}

interface GameState {
  games: Record<string, FdfGame>;
  createGame: (homeTeamId: string, awayTeamId: string, enhancedMode?: boolean, receivingTeam?: "home" | "away") => string;
  addDrive: (gameId: string, input: DriveInput) => void;
  undoLastDrive: (gameId: string) => void;
  completeGame: (gameId: string) => void;
  switchPossession: (gameId: string) => void;
  endHalf: (gameId: string) => void;
  endGame: (gameId: string) => void;
  deleteGame: (gameId: string) => void;
  getGame: (id: string) => FdfGame | undefined;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      games: {},

      createGame: (homeTeamId, awayTeamId, enhancedMode, receivingTeam) => {
        const id = generateId();
        const game: FdfGame = {
          id,
          homeTeamId,
          awayTeamId,
          status: "in_progress",
          score: { home: emptyQuarterScore(), away: emptyQuarterScore() },
          gameClock: initialClock(),
          drives: [],
          currentPossession: receivingTeam || "away", // receiving team gets first offensive drive
          enhancedMode: enhancedMode || undefined,
          startedAt: new Date().toISOString(),
        };
        set((state) => ({ games: { ...state.games, [id]: game } }));
        return id;
      },

      addDrive: (gameId, input) => {
        set((state) => {
          const game = state.games[gameId];
          if (!game || game.status !== "in_progress") return state;

          const { offensePoints, defensePoints } = getPointsForResult(input.result, input.patResult);

          // Determine which team is on offense for this drive
          const offenseTeamId = game.currentPossession === "home" ? game.homeTeamId : game.awayTeamId;

          // Attribution: offense points go to offense team, defense points to other team
          let homeScore = { ...game.score.home };
          let awayScore = { ...game.score.away };

          if (game.currentPossession === "home") {
            homeScore = addToQuarterScore(homeScore, game.gameClock.quarter, offensePoints);
            awayScore = addToQuarterScore(awayScore, game.gameClock.quarter, defensePoints);
          } else {
            awayScore = addToQuarterScore(awayScore, game.gameClock.quarter, offensePoints);
            homeScore = addToQuarterScore(homeScore, game.gameClock.quarter, defensePoints);
          }

          // Consume clock ticks
          const clockResult = consumeTicks(game.gameClock, input.driveTicks);
          let newClock = clockResult.newClock;

          // Check for overtime: if game would end but score is tied
          if (clockResult.gameEnded && game.gameClock.quarter === 4 && homeScore.total === awayScore.total) {
            newClock = startOvertime();
          }

          // Build score-after-drive string
          const scoreAfterDrive = `${awayScore.total}-${homeScore.total}`;

          const driveEntry: DriveEntry = {
            id: generateId(),
            driveNumber: game.drives.length + 1,
            quarter: game.gameClock.quarter,
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
            createdAt: new Date().toISOString(),
          };

          // Toggle possession
          let nextPossession: "home" | "away";
          if (isDefenseScoringTD(input.result) || input.result === "KICK_PUNT_REC_RECOVERS") {
            // Defense scored TD or receiving team recovered fumble → no possession change
            nextPossession = game.currentPossession;
          } else {
            // Normal toggle (including Return TDs, KICK_PUNT_KICK_RECOVERS)
            nextPossession = game.currentPossession === "home" ? "away" : "home";
          }

          // After halftime, away team receives (reset to "away")
          if (clockResult.halfEnded) {
            nextPossession = "home"; // home team gets ball to start 2nd half
          }

          const updatedGame: FdfGame = {
            ...game,
            score: { home: homeScore, away: awayScore },
            gameClock: newClock,
            drives: [...game.drives, driveEntry],
            currentPossession: nextPossession,
          };

          // Auto-complete if game ended
          if (newClock.isGameOver && homeScore.total !== awayScore.total) {
            updatedGame.status = "completed";
            updatedGame.completedAt = new Date().toISOString();
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
          const restoredClock: GameClock = {
            quarter: lastDrive.quarter,
            ticksRemaining: (game.gameClock.quarter === lastDrive.quarter
              ? game.gameClock.ticksRemaining
              : 0) + lastDrive.driveTicks,
            isHalftime: false,
            isGameOver: false,
          };

          // Restore possession to whoever had it for the undone drive
          const restoredPossession: "home" | "away" = wasHomePossession ? "home" : "away";

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
          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                gameClock: {
                  quarter: 3,
                  ticksRemaining: TICKS_PER_QUARTER,
                  isHalftime: false,
                  isGameOver: false,
                },
                currentPossession: "home", // home gets ball to start 2nd half
              },
            },
          };
        });
      },

      endGame: (gameId) => {
        set((state) => {
          const game = state.games[gameId];
          if (!game || game.status !== "in_progress") return state;
          // Only works in second half (Q3 or Q4)
          if (game.gameClock.quarter < 3) return state;
          // If tied, start overtime instead
          if (game.score.home.total === game.score.away.total) {
            return {
              games: {
                ...state.games,
                [gameId]: {
                  ...game,
                  gameClock: startOvertime(),
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
    { name: STORAGE_KEYS.GAMES }
  )
);
