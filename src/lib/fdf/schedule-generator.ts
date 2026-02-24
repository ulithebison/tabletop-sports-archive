import type { ScheduleGame, Division } from "./types";
import { generateId } from "./id";

/**
 * Generate a round-robin schedule using the circle method.
 * If odd number of teams, one team gets a bye each week.
 */
export function generateRoundRobinSchedule(
  teamIds: string[],
  weeks: number,
  includeByes: boolean
): ScheduleGame[] {
  const n = teamIds.length;
  if (n < 2) return [];

  const games: ScheduleGame[] = [];

  // For circle method: if odd, add a ghost "BYE" team
  const ids = [...teamIds];
  const hasGhost = n % 2 !== 0;
  if (hasGhost) ids.push("__BYE__");

  const half = ids.length / 2;
  // Fixed position: first team stays, rest rotate
  const fixed = ids[0];
  const rotating = ids.slice(1);

  let round = 0;
  let week = 1;

  // Generate enough rounds to fill requested weeks
  while (week <= weeks) {
    const currentRotating = [...rotating];
    // Rotate for this round
    for (let r = 0; r < round % rotating.length; r++) {
      currentRotating.push(currentRotating.shift()!);
    }

    const roundTeams = [fixed, ...currentRotating];

    for (let i = 0; i < half; i++) {
      const team1 = roundTeams[i];
      const team2 = roundTeams[roundTeams.length - 1 - i];

      if (team1 === "__BYE__" || team2 === "__BYE__") {
        if (includeByes) {
          const realTeam = team1 === "__BYE__" ? team2 : team1;
          games.push({
            id: generateId(),
            week,
            homeTeamId: realTeam,
            awayTeamId: realTeam,
            isBye: true,
          });
        }
        continue;
      }

      // Alternate home/away across rounds
      const homeTeam = round % 2 === 0 ? team1 : team2;
      const awayTeam = round % 2 === 0 ? team2 : team1;

      games.push({
        id: generateId(),
        week,
        homeTeamId: homeTeam,
        awayTeamId: awayTeam,
      });
    }

    round++;
    week++;
  }

  return games;
}

/**
 * Generate a division-weighted schedule.
 * Division opponents play more frequently (2-3x), cross-division less.
 */
export function generateDivisionSchedule(
  divisions: Division[],
  allTeamIds: string[],
  weeks: number,
  includeByes: boolean
): ScheduleGame[] {
  const games: ScheduleGame[] = [];
  const matchups: { home: string; away: string }[] = [];

  // Build division membership map
  const teamDivision = new Map<string, number>();
  for (let i = 0; i < divisions.length; i++) {
    for (const teamId of divisions[i].teamIds) {
      teamDivision.set(teamId, i);
    }
  }

  // Generate intra-division matchups (home & away for each pair)
  for (const div of divisions) {
    for (let i = 0; i < div.teamIds.length; i++) {
      for (let j = i + 1; j < div.teamIds.length; j++) {
        matchups.push({ home: div.teamIds[i], away: div.teamIds[j] });
        matchups.push({ home: div.teamIds[j], away: div.teamIds[i] });
      }
    }
  }

  // Generate cross-division matchups (one game each pair)
  for (let i = 0; i < allTeamIds.length; i++) {
    for (let j = i + 1; j < allTeamIds.length; j++) {
      const divI = teamDivision.get(allTeamIds[i]);
      const divJ = teamDivision.get(allTeamIds[j]);
      if (divI !== undefined && divJ !== undefined && divI === divJ) continue; // already covered
      matchups.push({ home: allTeamIds[i], away: allTeamIds[j] });
    }
  }

  // Shuffle matchups
  for (let i = matchups.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [matchups[i], matchups[j]] = [matchups[j], matchups[i]];
  }

  // Distribute matchups across weeks
  const teamsPerWeek = Math.floor(allTeamIds.length / 2);
  let week = 1;
  let weekGames = 0;
  const usedTeamsThisWeek = new Set<string>();

  for (const matchup of matchups) {
    if (week > weeks) break;

    if (usedTeamsThisWeek.has(matchup.home) || usedTeamsThisWeek.has(matchup.away)) {
      continue; // Team already playing this week — skip (simple approach)
    }

    games.push({
      id: generateId(),
      week,
      homeTeamId: matchup.home,
      awayTeamId: matchup.away,
    });

    usedTeamsThisWeek.add(matchup.home);
    usedTeamsThisWeek.add(matchup.away);
    weekGames++;

    if (weekGames >= teamsPerWeek) {
      // Add bye weeks for teams not playing
      if (includeByes) {
        for (const teamId of allTeamIds) {
          if (!usedTeamsThisWeek.has(teamId)) {
            games.push({
              id: generateId(),
              week,
              homeTeamId: teamId,
              awayTeamId: teamId,
              isBye: true,
            });
          }
        }
      }
      week++;
      weekGames = 0;
      usedTeamsThisWeek.clear();
    }
  }

  // Fill remaining weeks with re-matchups if needed
  if (week <= weeks && games.length > 0) {
    const existingMatchups = games.filter((g) => !g.isBye);
    let matchupIdx = 0;

    while (week <= weeks) {
      usedTeamsThisWeek.clear();
      weekGames = 0;

      for (let attempt = 0; attempt < existingMatchups.length && weekGames < teamsPerWeek; attempt++) {
        const ref = existingMatchups[(matchupIdx + attempt) % existingMatchups.length];
        // Flip home/away for re-matchup
        const home = ref.awayTeamId;
        const away = ref.homeTeamId;

        if (usedTeamsThisWeek.has(home) || usedTeamsThisWeek.has(away)) continue;

        games.push({
          id: generateId(),
          week,
          homeTeamId: home,
          awayTeamId: away,
        });

        usedTeamsThisWeek.add(home);
        usedTeamsThisWeek.add(away);
        weekGames++;
        matchupIdx++;
      }

      if (includeByes) {
        for (const teamId of allTeamIds) {
          if (!usedTeamsThisWeek.has(teamId)) {
            games.push({
              id: generateId(),
              week,
              homeTeamId: teamId,
              awayTeamId: teamId,
              isBye: true,
            });
          }
        }
      }

      week++;
    }
  }

  return games;
}
