import type {
  FdfGame,
  TeamRoster,
  FinderRoster,
  FinderPlayer,
  PlayerEntry,
  PlayerGameStats,
  RosterPosition,
} from "./types";
import { isTouchdown, isReturnTD } from "./scoring";
import { findPlayerInFinderRoster } from "./player-mapping";

function emptyStatsFromFinder(player: FinderPlayer, teamId: string): PlayerGameStats {
  return {
    playerId: player.id,
    playerName: player.name,
    playerNumber: player.number,
    teamId,
    position: "QB" as RosterPosition, // Finder rosters don't have positions
    passing: { touchdowns: 0, interceptions: 0, sacks: 0 },
    rushing: { touchdowns: 0, fumbles: 0 },
    receiving: { touchdowns: 0 },
    kicking: { fieldGoalsMade: 0, fieldGoalsMissed: 0, extraPointsMade: 0, extraPointsMissed: 0 },
    defense: { interceptions: 0, fumbleRecoveries: 0, sacks: 0, returnTouchdowns: 0 },
    specialTeams: { kickReturnTouchdowns: 0, puntReturnTouchdowns: 0 },
    totalTouchdowns: 0,
    pointsResponsibleFor: 0,
  };
}

function emptyStats(player: PlayerEntry, teamId: string): PlayerGameStats {
  return {
    playerId: player.id,
    playerName: player.name,
    playerNumber: player.number,
    teamId,
    position: player.position,
    passing: { touchdowns: 0, interceptions: 0, sacks: 0 },
    rushing: { touchdowns: 0, fumbles: 0 },
    receiving: { touchdowns: 0 },
    kicking: { fieldGoalsMade: 0, fieldGoalsMissed: 0, extraPointsMade: 0, extraPointsMissed: 0 },
    defense: { interceptions: 0, fumbleRecoveries: 0, sacks: 0, returnTouchdowns: 0 },
    specialTeams: { kickReturnTouchdowns: 0, puntReturnTouchdowns: 0 },
    totalTouchdowns: 0,
    pointsResponsibleFor: 0,
  };
}

function getAllPlayers(roster: TeamRoster): PlayerEntry[] {
  return [
    ...roster.quarterbacks,
    ...roster.runningBacks,
    ...roster.receivers,
    ...(roster.kicker ? [roster.kicker] : []),
    ...(roster.punter ? [roster.punter] : []),
    ...roster.defensiveBacks,
    ...roster.linebackers,
    ...roster.defensiveLinemen,
    ...(roster.kickReturner ? [roster.kickReturner] : []),
    ...(roster.puntReturner ? [roster.puntReturner] : []),
  ].filter(p => p.name.trim() !== "");
}

function findPlayerInRoster(roster: TeamRoster, playerId: string): PlayerEntry | undefined {
  return getAllPlayers(roster).find(p => p.id === playerId);
}

/**
 * Calculate per-player game stats from enhanced drive data.
 * Supports both FinderRoster (Sprint 3) and legacy TeamRoster.
 */
export function calculatePlayerGameStats(
  game: FdfGame,
  homeRoster: FinderRoster | TeamRoster | undefined,
  awayRoster: FinderRoster | TeamRoster | undefined,
): PlayerGameStats[] {
  if (!homeRoster && !awayRoster) return [];

  const statsMap = new Map<string, PlayerGameStats>();

  const isFinderRoster = (r: FinderRoster | TeamRoster | undefined): r is FinderRoster => {
    if (!r) return false;
    return "rushingTD" in r && "passingTD" in r;
  };

  const getOrCreate = (playerId: string, teamId: string, roster: FinderRoster | TeamRoster): PlayerGameStats => {
    if (statsMap.has(playerId)) return statsMap.get(playerId)!;

    if (isFinderRoster(roster)) {
      const player = findPlayerInFinderRoster(roster, playerId);
      if (!player) {
        const placeholder = emptyStatsFromFinder({ id: playerId, name: "Unknown" }, teamId);
        statsMap.set(playerId, placeholder);
        return placeholder;
      }
      const stats = emptyStatsFromFinder(player, teamId);
      statsMap.set(playerId, stats);
      return stats;
    } else {
      const player = findPlayerInRoster(roster, playerId);
      if (!player) {
        const placeholder = emptyStats({ id: playerId, name: "Unknown", position: "QB" as RosterPosition }, teamId);
        statsMap.set(playerId, placeholder);
        return placeholder;
      }
      const stats = emptyStats(player, teamId);
      statsMap.set(playerId, stats);
      return stats;
    }
  };

  for (const drive of game.drives) {
    const inv = drive.playerInvolvement;
    if (!inv) continue;

    const isHome = drive.teamId === game.homeTeamId;
    const offenseTeamId = drive.teamId;
    const offRoster = isHome ? homeRoster : awayRoster;

    if (!offRoster) continue;

    // QB stats
    if (inv.quarterback && offRoster) {
      const qbStats = getOrCreate(inv.quarterback, offenseTeamId, offRoster);
      if (drive.result === "TD_PASS") qbStats.passing.touchdowns++;
      if (drive.result === "INTERCEPTION" || drive.result === "INTERCEPTION_RETURN_TD") qbStats.passing.interceptions++;
      if (drive.result === "SAFETY" && inv.sackBy) qbStats.passing.sacks++;
    }

    // Scorer stats (offense)
    if (inv.scorer && offRoster) {
      const scorerStats = getOrCreate(inv.scorer, offenseTeamId, offRoster);
      if (isTouchdown(drive.result)) {
        if (drive.result === "TD_PASS") {
          scorerStats.receiving.touchdowns++;
        } else if (drive.result === "TD_RUN") {
          scorerStats.rushing.touchdowns++;
        } else {
          scorerStats.rushing.touchdowns++;
        }
      }
      if (drive.result === "FUMBLE") {
        scorerStats.rushing.fumbles++;
      }
    }

    // Kicker stats
    if (inv.kicker && offRoster) {
      const kickerStats = getOrCreate(inv.kicker, offenseTeamId, offRoster);
      if (drive.result === "FGA_GOOD" || drive.result === "DESPERATION_FGA") {
        kickerStats.kicking.fieldGoalsMade++;
      }
      if (drive.result === "FGA_MISSED") {
        kickerStats.kicking.fieldGoalsMissed++;
      }
    }

    // PAT player stats (Sprint 3)
    if (inv.patKicker && offRoster) {
      const patKickerStats = getOrCreate(inv.patKicker, offenseTeamId, offRoster);
      if (drive.patResult === "XP_GOOD") patKickerStats.kicking.extraPointsMade++;
      if (drive.patResult === "XP_MISSED") patKickerStats.kicking.extraPointsMissed++;
    } else if (inv.kicker && offRoster) {
      // Legacy: PAT stats on the drive kicker
      const kickerStats = getOrCreate(inv.kicker, offenseTeamId, offRoster);
      if (drive.patResult === "XP_GOOD") kickerStats.kicking.extraPointsMade++;
      if (drive.patResult === "XP_MISSED") kickerStats.kicking.extraPointsMissed++;
    }

    // PAT passer (2PT)
    if (inv.patPasser && offRoster && (drive.patResult === "2PT_GOOD")) {
      const patPasserStats = getOrCreate(inv.patPasser, offenseTeamId, offRoster);
      patPasserStats.passing.touchdowns++; // Credit 2PT pass as passing TD
    }

    // Return TD returner — attributed to the offense (drive team = scoring team)
    if (inv.returnedBy && isReturnTD(drive.result) && offRoster) {
      const retStats = getOrCreate(inv.returnedBy, drive.teamId, offRoster);
      if (drive.result === "KICKOFF_RETURN_TD" || drive.result === "FREE_KICK_RETURN_TD") {
        retStats.specialTeams.kickReturnTouchdowns++;
      } else if (drive.result === "PUNT_RETURN_TD") {
        retStats.specialTeams.puntReturnTouchdowns++;
      } else {
        retStats.defense.returnTouchdowns++;
      }
    }

    // Note: Defense stats are not tracked with FinderRoster (no defense players)
    // Legacy defense stats
    if (!isFinderRoster(offRoster)) {
      const defenseTeamId = isHome ? game.awayTeamId : game.homeTeamId;
      const defRoster = isHome ? awayRoster : homeRoster;
      if (defRoster && !isFinderRoster(defRoster)) {
        if (inv.interceptedBy) {
          const defStats = getOrCreate(inv.interceptedBy, defenseTeamId, defRoster);
          defStats.defense.interceptions++;
        }
        if (inv.fumbleRecoveredBy) {
          const defStats = getOrCreate(inv.fumbleRecoveredBy, defenseTeamId, defRoster);
          defStats.defense.fumbleRecoveries++;
        }
        if (inv.sackBy) {
          const defStats = getOrCreate(inv.sackBy, defenseTeamId, defRoster);
          defStats.defense.sacks++;
        }
      }
    }
  }

  // Calculate totals
  for (const stats of statsMap.values()) {
    stats.totalTouchdowns =
      stats.passing.touchdowns +
      stats.rushing.touchdowns +
      stats.receiving.touchdowns +
      stats.defense.returnTouchdowns +
      stats.specialTeams.kickReturnTouchdowns +
      stats.specialTeams.puntReturnTouchdowns;

    stats.pointsResponsibleFor =
      stats.passing.touchdowns * 6 +
      stats.rushing.touchdowns * 6 +
      stats.receiving.touchdowns * 6 +
      stats.defense.returnTouchdowns * 6 +
      (stats.specialTeams.kickReturnTouchdowns + stats.specialTeams.puntReturnTouchdowns) * 6 +
      stats.kicking.fieldGoalsMade * 3 +
      stats.kicking.extraPointsMade * 1;
  }

  return Array.from(statsMap.values())
    .filter(s => s.pointsResponsibleFor > 0 || s.totalTouchdowns > 0 ||
      s.defense.interceptions > 0 || s.defense.fumbleRecoveries > 0 ||
      s.defense.sacks > 0 || s.kicking.fieldGoalsMade > 0 || s.kicking.fieldGoalsMissed > 0)
    .sort((a, b) => b.pointsResponsibleFor - a.pointsResponsibleFor);
}

/**
 * Returns the MVP — player with the highest pointsResponsibleFor.
 */
export function getGameMVP(stats: PlayerGameStats[]): PlayerGameStats | null {
  if (stats.length === 0) return null;
  return stats[0]; // Already sorted by pointsResponsibleFor desc
}
