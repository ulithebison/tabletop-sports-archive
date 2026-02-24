import type { FdfSeason, TeamStanding, Division } from "./types";

function emptyRecord() {
  return { wins: 0, losses: 0, ties: 0 };
}

function emptyStanding(teamId: string): TeamStanding {
  return {
    teamId,
    wins: 0,
    losses: 0,
    ties: 0,
    winPct: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDiff: 0,
    streak: "",
    divisionRecord: emptyRecord(),
    homeRecord: emptyRecord(),
    awayRecord: emptyRecord(),
    last5: [],
  };
}

/** Build a map of teamId → divisionIndex for division record tracking */
function buildDivisionMap(divisions: Division[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < divisions.length; i++) {
    for (const teamId of divisions[i].teamIds) {
      map.set(teamId, i);
    }
  }
  return map;
}

/**
 * Calculate standings from a season's completed schedule games.
 */
export function calculateStandings(season: FdfSeason): TeamStanding[] {
  const standingsMap = new Map<string, TeamStanding>();
  const divMap = buildDivisionMap(season.divisions);

  // Initialize all teams
  for (const teamId of season.teamIds) {
    standingsMap.set(teamId, emptyStanding(teamId));
  }

  // Track results in order for streak calculation
  const teamResults = new Map<string, ("W" | "L" | "T")[]>();
  for (const teamId of season.teamIds) {
    teamResults.set(teamId, []);
  }

  // Process completed regular-season games in week order
  const completedGames = season.schedule
    .filter((g) => g.result && !g.isBye && !g.isPlayoff)
    .sort((a, b) => a.week - b.week);

  for (const game of completedGames) {
    const result = game.result!;
    const home = standingsMap.get(game.homeTeamId);
    const away = standingsMap.get(game.awayTeamId);
    if (!home || !away) continue;

    const homeDiv = divMap.get(game.homeTeamId);
    const awayDiv = divMap.get(game.awayTeamId);
    const isDivGame = homeDiv !== undefined && awayDiv !== undefined && homeDiv === awayDiv;

    // Points
    home.pointsFor += result.homeScore;
    home.pointsAgainst += result.awayScore;
    away.pointsFor += result.awayScore;
    away.pointsAgainst += result.homeScore;

    if (result.winner === "home") {
      home.wins++;
      away.losses++;
      home.homeRecord.wins++;
      away.awayRecord.losses++;
      if (isDivGame) {
        home.divisionRecord.wins++;
        away.divisionRecord.losses++;
      }
      teamResults.get(game.homeTeamId)!.push("W");
      teamResults.get(game.awayTeamId)!.push("L");
    } else if (result.winner === "away") {
      away.wins++;
      home.losses++;
      away.awayRecord.wins++;
      home.homeRecord.losses++;
      if (isDivGame) {
        away.divisionRecord.wins++;
        home.divisionRecord.losses++;
      }
      teamResults.get(game.homeTeamId)!.push("L");
      teamResults.get(game.awayTeamId)!.push("W");
    } else {
      // Tie
      home.ties++;
      away.ties++;
      home.homeRecord.ties++;
      away.awayRecord.ties++;
      if (isDivGame) {
        home.divisionRecord.ties++;
        away.divisionRecord.ties++;
      }
      teamResults.get(game.homeTeamId)!.push("T");
      teamResults.get(game.awayTeamId)!.push("T");
    }
  }

  // Calculate derived stats
  for (const standing of standingsMap.values()) {
    const totalGames = standing.wins + standing.losses + standing.ties;
    standing.winPct = totalGames > 0
      ? (standing.wins + standing.ties * 0.5) / totalGames
      : 0;
    standing.pointDiff = standing.pointsFor - standing.pointsAgainst;

    // Last 5
    const results = teamResults.get(standing.teamId) || [];
    standing.last5 = results.slice(-5) as ("W" | "L" | "T")[];

    // Streak
    if (results.length > 0) {
      const lastResult = results[results.length - 1];
      let count = 0;
      for (let i = results.length - 1; i >= 0; i--) {
        if (results[i] === lastResult) count++;
        else break;
      }
      standing.streak = `${lastResult}${count}`;
    }
  }

  return Array.from(standingsMap.values());
}

/**
 * Sort standings with tiebreakers:
 * 1. Win PCT
 * 2. Head-to-head (not implemented — would need game lookup)
 * 3. Division record
 * 4. Point differential
 * 5. Points for
 */
export function sortStandings(standings: TeamStanding[]): TeamStanding[] {
  return [...standings].sort((a, b) => {
    // 1. Win PCT (higher is better)
    if (b.winPct !== a.winPct) return b.winPct - a.winPct;

    // 2. Division record win pct
    const aDivGames = a.divisionRecord.wins + a.divisionRecord.losses + a.divisionRecord.ties;
    const bDivGames = b.divisionRecord.wins + b.divisionRecord.losses + b.divisionRecord.ties;
    const aDivPct = aDivGames > 0 ? (a.divisionRecord.wins + a.divisionRecord.ties * 0.5) / aDivGames : 0;
    const bDivPct = bDivGames > 0 ? (b.divisionRecord.wins + b.divisionRecord.ties * 0.5) / bDivGames : 0;
    if (bDivPct !== aDivPct) return bDivPct - aDivPct;

    // 3. Point differential
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;

    // 4. Points for
    return b.pointsFor - a.pointsFor;
  });
}

/**
 * Get standings grouped by division
 */
export function getStandingsByDivision(
  standings: TeamStanding[],
  divisions: Division[]
): { division: Division; standings: TeamStanding[] }[] {
  return divisions.map((div) => {
    const divStandings = standings.filter((s) => div.teamIds.includes(s.teamId));
    return { division: div, standings: sortStandings(divStandings) };
  });
}
