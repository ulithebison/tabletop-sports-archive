import type {
  FdfSeason,
  TeamStanding,
  ScheduleGame,
  Division,
  PlayoffRound,
} from "./types";
import { generateId } from "./id";
import { calculateStandings, sortStandings, getStandingsByDivision } from "./standings";
import { ALL_PLAYOFF_ROUNDS } from "./constants";

export interface PlayoffSeed {
  seed: number;
  teamId: string;
  standing: TeamStanding;
  isDivisionWinner: boolean;
}

/**
 * Generate playoff seeds from standings.
 * Division winners get top seeds (sorted by record).
 * Remaining slots filled by best remaining records (wild cards).
 */
export function generatePlayoffSeeds(
  standings: TeamStanding[],
  season: FdfSeason
): PlayoffSeed[] {
  const numTeams = season.config.playoffTeams;
  const seeds: PlayoffSeed[] = [];

  if (season.divisions.length > 0) {
    // Get division winners
    const divStandings = getStandingsByDivision(standings, season.divisions);
    const divWinners: TeamStanding[] = [];

    for (const { standings: divStands } of divStandings) {
      const sorted = sortStandings(divStands);
      if (sorted.length > 0) {
        divWinners.push(sorted[0]);
      }
    }

    // Sort division winners by record
    const sortedDivWinners = sortStandings(divWinners);

    // Add division winners as top seeds
    for (const standing of sortedDivWinners) {
      seeds.push({
        seed: seeds.length + 1,
        teamId: standing.teamId,
        standing,
        isDivisionWinner: true,
      });
    }

    // Fill remaining spots with wild cards
    const divWinnerIds = new Set(divWinners.map((s) => s.teamId));
    const wildCards = sortStandings(
      standings.filter((s) => !divWinnerIds.has(s.teamId))
    );

    for (const standing of wildCards) {
      if (seeds.length >= numTeams) break;
      seeds.push({
        seed: seeds.length + 1,
        teamId: standing.teamId,
        standing,
        isDivisionWinner: false,
      });
    }
  } else {
    // No divisions: top N by standings
    const sorted = sortStandings(standings);
    for (const standing of sorted) {
      if (seeds.length >= numTeams) break;
      seeds.push({
        seed: seeds.length + 1,
        teamId: standing.teamId,
        standing,
        isDivisionWinner: false,
      });
    }
  }

  return seeds;
}

/**
 * Map # of playoff teams to round structure.
 * Supports up to 64 teams (6 rounds).
 */
function getPlayoffRounds(numTeams: number): PlayoffRound[] {
  if (numTeams <= 2) return ["super_bowl"];
  if (numTeams <= 4) return ["conference", "super_bowl"];
  if (numTeams <= 8) return ["wild_card", "conference", "super_bowl"];
  if (numTeams <= 16) return ["wild_card", "divisional", "conference", "super_bowl"];
  if (numTeams <= 32) return ["round_of_32", "wild_card", "divisional", "conference", "super_bowl"];
  return ["round_of_64", "round_of_32", "wild_card", "divisional", "conference", "super_bowl"];
}

/**
 * Extract the playoff rounds present in existing schedule data.
 * Useful when rounds need to be derived from a saved season.
 */
export function getPlayoffRoundsFromSchedule(schedule: ScheduleGame[]): PlayoffRound[] {
  const presentRounds = new Set<PlayoffRound>();
  for (const game of schedule) {
    if (game.isPlayoff && game.playoffRound) {
      presentRounds.add(game.playoffRound);
    }
  }
  return ALL_PLAYOFF_ROUNDS.filter((r) => presentRounds.has(r));
}

/**
 * Generate first-round playoff schedule from seeds.
 * Higher seeds play lower seeds, home field to higher seed if configured.
 */
export function generatePlayoffSchedule(
  seeds: PlayoffSeed[],
  season: FdfSeason
): ScheduleGame[] {
  const games: ScheduleGame[] = [];
  const numTeams = seeds.length;
  const rounds = getPlayoffRounds(numTeams);
  const baseWeek = season.config.totalRegularSeasonWeeks + 1;

  // Determine first-round matchups
  // Standard seeding: 1 vs N, 2 vs N-1, etc.
  // Handle byes for formats with non-power-of-2 teams
  const firstRound = rounds[0];

  // Calculate which seeds get byes (for 6, 7, 12, 14 team formats)
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numTeams)));
  const numByes = nextPowerOf2 - numTeams;
  const numFirstRoundGames = (numTeams - numByes) / 2;

  // Seeds 1..numByes get byes
  // Seeds (numByes+1)..numTeams play first round
  const playingSeeds = seeds.slice(numByes);

  for (let i = 0; i < numFirstRoundGames; i++) {
    const highSeed = playingSeeds[i];
    const lowSeed = playingSeeds[playingSeeds.length - 1 - i];

    if (!highSeed || !lowSeed) continue;

    const homeTeamId = season.config.homeFieldInPlayoffs ? highSeed.teamId : highSeed.teamId;
    const awayTeamId = season.config.homeFieldInPlayoffs ? lowSeed.teamId : lowSeed.teamId;

    games.push({
      id: generateId(),
      week: baseWeek,
      homeTeamId,
      awayTeamId,
      isPlayoff: true,
      playoffRound: firstRound,
    });
  }

  // Create placeholder games for subsequent rounds
  // Pre-fill bye teams into the second round so they appear in the bracket
  let currentWeek = baseWeek + 1;
  for (let roundIdx = 1; roundIdx < rounds.length; roundIdx++) {
    const round = rounds[roundIdx];
    // Number of games in this round
    const prevGames = roundIdx === 1
      ? numFirstRoundGames + numByes
      : Math.pow(2, rounds.length - roundIdx);
    const gamesInRound = Math.floor(prevGames / 2);

    if (roundIdx === 1 && numByes > 0) {
      // Build slot pairs for the second round, then fill bye teams in
      const slots: { home: string; away: string }[] = [];
      for (let i = 0; i < gamesInRound; i++) {
        slots.push({ home: "__TBD__", away: "__TBD__" });
      }

      // Place bye teams: home slots first (game 0, 1, ...), then away
      // slots from the last game back to first (keeps top seeds apart)
      let byeIdx = 0;
      for (let i = 0; i < gamesInRound && byeIdx < numByes; i++, byeIdx++) {
        slots[i].home = seeds[byeIdx].teamId;
      }
      for (let i = gamesInRound - 1; i >= 0 && byeIdx < numByes; i--, byeIdx++) {
        slots[i].away = seeds[byeIdx].teamId;
      }

      for (const slot of slots) {
        games.push({
          id: generateId(),
          week: currentWeek,
          homeTeamId: slot.home,
          awayTeamId: slot.away,
          isPlayoff: true,
          playoffRound: round,
        });
      }
    } else {
      for (let i = 0; i < gamesInRound; i++) {
        games.push({
          id: generateId(),
          week: currentWeek,
          homeTeamId: "__TBD__",
          awayTeamId: "__TBD__",
          isPlayoff: true,
          playoffRound: round,
        });
      }
    }
    currentWeek++;
  }

  return games;
}

/**
 * After a playoff game is completed, advance the winner to the next round.
 */
export function advancePlayoffWinner(
  season: FdfSeason,
  completedGameId: string
): ScheduleGame[] {
  const schedule = [...season.schedule];
  const completedGame = schedule.find((g) => g.id === completedGameId);
  if (!completedGame || !completedGame.result || !completedGame.isPlayoff) return schedule;

  const winnerId = completedGame.result.winner === "home"
    ? completedGame.homeTeamId
    : completedGame.awayTeamId;

  // Derive round ordering from actual schedule
  const rounds = getPlayoffRoundsFromSchedule(schedule);
  const currentRoundIdx = rounds.indexOf(completedGame.playoffRound!);
  if (currentRoundIdx < 0) return schedule;

  // Find next round's TBD games
  const nextRound = rounds[currentRoundIdx + 1];
  if (!nextRound) return schedule; // Was the final

  const nextRoundGames = schedule
    .filter((g) => g.isPlayoff && g.playoffRound === nextRound)
    .sort((a, b) => a.week - b.week);

  // Find first TBD slot
  for (const game of nextRoundGames) {
    if (game.homeTeamId === "__TBD__") {
      game.homeTeamId = winnerId;
      return schedule;
    }
    if (game.awayTeamId === "__TBD__") {
      game.awayTeamId = winnerId;
      return schedule;
    }
  }

  return schedule;
}

/**
 * Revert a playoff game result and cascade-clear any downstream matchups
 * that depend on the winner of this game.
 */
export function revertPlayoffResult(
  schedule: ScheduleGame[],
  resetGameId: string
): { updatedSchedule: ScheduleGame[]; cascadedGameIds: string[] } {
  const updated = schedule.map((g) => ({ ...g }));
  const cascadedGameIds: string[] = [];

  // Derive round ordering from actual schedule
  const rounds = getPlayoffRoundsFromSchedule(updated);

  function revertGame(gameId: string) {
    const game = updated.find((g) => g.id === gameId);
    if (!game || !game.result || !game.isPlayoff) return;

    const winnerId = game.result.winner === "home" ? game.homeTeamId : game.awayTeamId;

    // Find next-round game where this winner was placed
    const currentRoundIdx = rounds.indexOf(game.playoffRound!);
    if (currentRoundIdx >= 0) {
      const nextRound = rounds[currentRoundIdx + 1];
      if (nextRound) {
        for (const nextGame of updated) {
          if (nextGame.isPlayoff && nextGame.playoffRound === nextRound) {
            if (nextGame.homeTeamId === winnerId || nextGame.awayTeamId === winnerId) {
              // If the next-round game also has a result, cascade-revert it first
              if (nextGame.result) {
                cascadedGameIds.push(nextGame.id);
                revertGame(nextGame.id);
              }
              // Clear the winner's slot back to TBD
              if (nextGame.homeTeamId === winnerId) nextGame.homeTeamId = "__TBD__";
              if (nextGame.awayTeamId === winnerId) nextGame.awayTeamId = "__TBD__";
              break;
            }
          }
        }
      }
    }

    // Clear this game's result and gameId
    game.result = undefined;
    game.gameId = undefined;
  }

  revertGame(resetGameId);

  return { updatedSchedule: updated, cascadedGameIds };
}
