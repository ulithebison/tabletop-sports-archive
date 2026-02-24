import type {
  FdfSeason,
  FdfGame,
  FdfTeam,
  PlayerSeasonStats,
  PlayerGameLogEntry,
  TeamSeasonStats,
  PlayerOfTheWeek,
  SeasonAward,
  SeasonAwardType,
  SeasonMoment,
  SeasonMomentType,
  ScheduleGame,
  FinderRoster,
  TeamRoster,
} from "./types";
import { calculatePlayerGameStats } from "./player-stats";
import { computeWPHistory, computeWPAnalytics } from "./win-probability";
import { generateGameHeadline } from "./headline-generator";

// ============================================================
// 1. Season Player Stats
// ============================================================

export function calculateSeasonPlayerStats(
  season: FdfSeason,
  games: Record<string, FdfGame>,
  teams: Record<string, FdfTeam>,
): PlayerSeasonStats[] {
  const statsMap = new Map<string, PlayerSeasonStats>();

  // Only process played (non-simulated) games with a gameId
  const playedScheduleGames = season.schedule.filter(
    (sg) => sg.result && !sg.result.isSimulated && sg.gameId && games[sg.gameId]
  );

  for (const sg of playedScheduleGames) {
    const game = games[sg.gameId!];
    if (!game || game.status !== "completed") continue;

    const homeTeam = teams[sg.homeTeamId];
    const awayTeam = teams[sg.awayTeamId];
    if (!homeTeam || !awayTeam) continue;

    const homeRoster: FinderRoster | TeamRoster | undefined =
      homeTeam.finderRoster || homeTeam.roster;
    const awayRoster: FinderRoster | TeamRoster | undefined =
      awayTeam.finderRoster || awayTeam.roster;

    const gameStats = calculatePlayerGameStats(game, homeRoster, awayRoster);

    // Determine winner for game log
    const homeScore = game.score.home.total;
    const awayScore = game.score.away.total;
    const scoreStr = `${awayScore}-${homeScore}`;

    for (const gs of gameStats) {
      let ps = statsMap.get(gs.playerId);
      if (!ps) {
        ps = {
          playerId: gs.playerId,
          playerName: gs.playerName,
          playerNumber: gs.playerNumber,
          teamId: gs.teamId,
          gamesPlayed: 0,
          passingTD: 0,
          interceptions: 0,
          sacks: 0,
          rushingTD: 0,
          fumbles: 0,
          receivingTD: 0,
          fieldGoalsMade: 0,
          fieldGoalsMissed: 0,
          extraPointsMade: 0,
          extraPointsMissed: 0,
          defensiveInterceptions: 0,
          fumbleRecoveries: 0,
          defensiveSacks: 0,
          returnTouchdowns: 0,
          kickReturnTD: 0,
          puntReturnTD: 0,
          totalTouchdowns: 0,
          pointsResponsibleFor: 0,
          tdIntRatio: 0,
          kickingPoints: 0,
          gameLog: [],
        };
        statsMap.set(gs.playerId, ps);
      }

      ps.gamesPlayed++;
      ps.passingTD += gs.passing.touchdowns;
      ps.interceptions += gs.passing.interceptions;
      ps.sacks += gs.passing.sacks;
      ps.rushingTD += gs.rushing.touchdowns;
      ps.fumbles += gs.rushing.fumbles;
      ps.receivingTD += gs.receiving.touchdowns;
      ps.fieldGoalsMade += gs.kicking.fieldGoalsMade;
      ps.fieldGoalsMissed += gs.kicking.fieldGoalsMissed;
      ps.extraPointsMade += gs.kicking.extraPointsMade;
      ps.extraPointsMissed += gs.kicking.extraPointsMissed;
      ps.defensiveInterceptions += gs.defense.interceptions;
      ps.fumbleRecoveries += gs.defense.fumbleRecoveries;
      ps.defensiveSacks += gs.defense.sacks;
      ps.returnTouchdowns += gs.defense.returnTouchdowns;
      ps.kickReturnTD += gs.specialTeams.kickReturnTouchdowns;
      ps.puntReturnTD += gs.specialTeams.puntReturnTouchdowns;
      ps.totalTouchdowns += gs.totalTouchdowns;
      ps.pointsResponsibleFor += gs.pointsResponsibleFor;

      // Game log entry
      const isHome = gs.teamId === sg.homeTeamId;
      const opponentTeamId = isHome ? sg.awayTeamId : sg.homeTeamId;
      const teamScore = isHome ? homeScore : awayScore;
      const oppScore = isHome ? awayScore : homeScore;
      const result: "W" | "L" | "T" =
        teamScore > oppScore ? "W" : teamScore < oppScore ? "L" : "T";

      ps.gameLog.push({
        week: sg.week,
        opponentTeamId,
        isHome,
        result,
        score: scoreStr,
        passingTD: gs.passing.touchdowns,
        interceptions: gs.passing.interceptions,
        rushingTD: gs.rushing.touchdowns,
        receivingTD: gs.receiving.touchdowns,
        fieldGoalsMade: gs.kicking.fieldGoalsMade,
        extraPointsMade: gs.kicking.extraPointsMade,
        pointsResponsibleFor: gs.pointsResponsibleFor,
      });
    }
  }

  // Derive totals
  for (const ps of statsMap.values()) {
    const offTDs = ps.passingTD + ps.rushingTD + ps.receivingTD;
    ps.tdIntRatio = offTDs / Math.max(1, ps.interceptions);
    ps.kickingPoints = ps.fieldGoalsMade * 3 + ps.extraPointsMade;
    // Sort game log by week
    ps.gameLog.sort((a, b) => a.week - b.week);
  }

  return Array.from(statsMap.values()).sort(
    (a, b) => b.pointsResponsibleFor - a.pointsResponsibleFor
  );
}

// ============================================================
// 2. Team Season Stats
// ============================================================

export function calculateTeamSeasonStats(
  season: FdfSeason,
  games: Record<string, FdfGame>,
): TeamSeasonStats[] {
  const statsMap = new Map<string, TeamSeasonStats>();

  const getOrCreate = (teamId: string): TeamSeasonStats => {
    if (statsMap.has(teamId)) return statsMap.get(teamId)!;
    const stats: TeamSeasonStats = {
      teamId,
      gamesPlayed: 0,
      manualGamesPlayed: 0,
      simulatedGamesPlayed: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      avgPointsFor: 0,
      avgPointsAgainst: 0,
      pointDiff: 0,
      fieldPositionPoor: 0,
      fieldPositionAvg: 0,
      fieldPositionGreat: 0,
      turnoversCommitted: 0,
      turnoversForced: 0,
      turnoverDiff: 0,
    };
    statsMap.set(teamId, stats);
    return stats;
  };

  // Track raw FP counts for percentage calculation
  const fpCounts = new Map<string, { poor: number; avg: number; great: number; total: number }>();
  const getFPCounts = (teamId: string) => {
    if (!fpCounts.has(teamId)) fpCounts.set(teamId, { poor: 0, avg: 0, great: 0, total: 0 });
    return fpCounts.get(teamId)!;
  };

  // All games with results (both sim and manual)
  const completedGames = season.schedule.filter((sg) => sg.result && !sg.isBye);

  for (const sg of completedGames) {
    const homeStats = getOrCreate(sg.homeTeamId);
    const awayStats = getOrCreate(sg.awayTeamId);

    const r = sg.result!;
    homeStats.gamesPlayed++;
    awayStats.gamesPlayed++;

    homeStats.pointsFor += r.homeScore;
    homeStats.pointsAgainst += r.awayScore;
    awayStats.pointsFor += r.awayScore;
    awayStats.pointsAgainst += r.homeScore;

    if (r.isSimulated) {
      homeStats.simulatedGamesPlayed++;
      awayStats.simulatedGamesPlayed++;
    } else {
      homeStats.manualGamesPlayed++;
      awayStats.manualGamesPlayed++;

      // Drive-based stats from played games
      const game = sg.gameId ? games[sg.gameId] : undefined;
      if (game) {
        for (const drive of game.drives) {
          const isHomeDrive = drive.teamId === game.homeTeamId;
          const offenseStats = isHomeDrive ? homeStats : awayStats;
          const defenseStats = isHomeDrive ? awayStats : homeStats;
          const offenseFP = getFPCounts(offenseStats.teamId);

          // Field position
          if (drive.fieldPosition === "POOR") offenseFP.poor++;
          else if (drive.fieldPosition === "AVERAGE") offenseFP.avg++;
          else if (drive.fieldPosition === "GREAT") offenseFP.great++;
          offenseFP.total++;

          // Turnovers
          if (
            drive.result === "INTERCEPTION" ||
            drive.result === "FUMBLE" ||
            drive.result === "INTERCEPTION_RETURN_TD" ||
            drive.result === "FUMBLE_RETURN_TD"
          ) {
            offenseStats.turnoversCommitted++;
            defenseStats.turnoversForced++;
          }
        }
      }
    }
  }

  // Compute averages and percentages
  for (const stats of statsMap.values()) {
    stats.avgPointsFor = stats.gamesPlayed > 0 ? Math.round((stats.pointsFor / stats.gamesPlayed) * 10) / 10 : 0;
    stats.avgPointsAgainst = stats.gamesPlayed > 0 ? Math.round((stats.pointsAgainst / stats.gamesPlayed) * 10) / 10 : 0;
    stats.pointDiff = stats.pointsFor - stats.pointsAgainst;
    stats.turnoverDiff = stats.turnoversForced - stats.turnoversCommitted;

    const fp = fpCounts.get(stats.teamId);
    if (fp && fp.total > 0) {
      stats.fieldPositionPoor = Math.round((fp.poor / fp.total) * 100);
      stats.fieldPositionAvg = Math.round((fp.avg / fp.total) * 100);
      stats.fieldPositionGreat = Math.round((fp.great / fp.total) * 100);
    }
  }

  return Array.from(statsMap.values()).sort(
    (a, b) => b.pointDiff - a.pointDiff
  );
}

// ============================================================
// 3. Players of the Week
// ============================================================

export function calculatePlayersOfTheWeek(
  season: FdfSeason,
  games: Record<string, FdfGame>,
  teams: Record<string, FdfTeam>,
): PlayerOfTheWeek[] {
  const weeks = new Set(season.schedule.map((sg) => sg.week));
  const potw: PlayerOfTheWeek[] = [];

  for (const week of weeks) {
    const weekGames = season.schedule.filter(
      (sg) =>
        sg.week === week &&
        sg.result &&
        !sg.result.isSimulated &&
        sg.gameId &&
        games[sg.gameId] &&
        !sg.isPlayoff
    );

    let bestPlayer: { stats: ReturnType<typeof calculatePlayerGameStats>[0]; teamId: string } | null = null;

    for (const sg of weekGames) {
      const game = games[sg.gameId!];
      if (!game || game.status !== "completed") continue;

      const homeTeam = teams[sg.homeTeamId];
      const awayTeam = teams[sg.awayTeamId];
      if (!homeTeam || !awayTeam) continue;

      const homeRoster = homeTeam.finderRoster || homeTeam.roster;
      const awayRoster = awayTeam.finderRoster || awayTeam.roster;

      const gameStats = calculatePlayerGameStats(game, homeRoster, awayRoster);
      for (const gs of gameStats) {
        if (!bestPlayer || gs.pointsResponsibleFor > bestPlayer.stats.pointsResponsibleFor) {
          bestPlayer = { stats: gs, teamId: gs.teamId };
        }
      }
    }

    if (bestPlayer) {
      const gs = bestPlayer.stats;
      potw.push({
        week,
        playerId: gs.playerId,
        playerName: gs.playerName,
        playerNumber: gs.playerNumber,
        teamId: gs.teamId,
        pointsResponsibleFor: gs.pointsResponsibleFor,
        statLine: formatPlayerStatLine(gs),
      });
    }
  }

  return potw.sort((a, b) => a.week - b.week);
}

function formatPlayerStatLine(gs: {
  passing: { touchdowns: number; interceptions: number };
  rushing: { touchdowns: number };
  receiving: { touchdowns: number };
  kicking: { fieldGoalsMade: number; extraPointsMade: number };
  pointsResponsibleFor: number;
}): string {
  const parts: string[] = [];
  if (gs.passing.touchdowns > 0) parts.push(`${gs.passing.touchdowns} Pass TD`);
  if (gs.rushing.touchdowns > 0) parts.push(`${gs.rushing.touchdowns} Rush TD`);
  if (gs.receiving.touchdowns > 0) parts.push(`${gs.receiving.touchdowns} Rec TD`);
  if (gs.kicking.fieldGoalsMade > 0) parts.push(`${gs.kicking.fieldGoalsMade} FG`);
  if (gs.kicking.extraPointsMade > 0) parts.push(`${gs.kicking.extraPointsMade} XP`);
  if (gs.passing.interceptions > 0) parts.push(`${gs.passing.interceptions} INT`);
  parts.push(`${gs.pointsResponsibleFor} pts`);
  return parts.join(", ");
}

// ============================================================
// 4. Season Awards
// ============================================================

export function calculateSeasonAwards(
  playerStats: PlayerSeasonStats[],
  teamStats?: TeamSeasonStats[],
): SeasonAward[] {
  if (playerStats.length === 0) return [];

  const awards: SeasonAward[] = [];

  // MVP: highest pointsResponsibleFor
  const mvp = playerStats[0]; // already sorted by PRF
  if (mvp) {
    awards.push({
      type: "MVP",
      playerId: mvp.playerId,
      playerName: mvp.playerName,
      playerNumber: mvp.playerNumber,
      teamId: mvp.teamId,
      statLine: `${mvp.pointsResponsibleFor} pts, ${mvp.totalTouchdowns} TD in ${mvp.gamesPlayed} games`,
    });
  }

  // OPOY: most offensive TDs (passing + rushing + receiving)
  const opoy = [...playerStats].sort(
    (a, b) => (b.passingTD + b.rushingTD + b.receivingTD) - (a.passingTD + a.rushingTD + a.receivingTD)
  )[0];
  if (opoy && (opoy.passingTD + opoy.rushingTD + opoy.receivingTD) > 0) {
    const offTDs = opoy.passingTD + opoy.rushingTD + opoy.receivingTD;
    awards.push({
      type: "OPOY",
      playerId: opoy.playerId,
      playerName: opoy.playerName,
      playerNumber: opoy.playerNumber,
      teamId: opoy.teamId,
      statLine: `${offTDs} off. TD (${opoy.passingTD} pass, ${opoy.rushingTD} rush, ${opoy.receivingTD} rec)`,
    });
  }

  // DPOY: most defensive plays (INT + fumble recoveries + sacks)
  const dpoy = [...playerStats].sort(
    (a, b) =>
      (b.defensiveInterceptions + b.fumbleRecoveries + b.defensiveSacks) -
      (a.defensiveInterceptions + a.fumbleRecoveries + a.defensiveSacks)
  )[0];
  if (dpoy && (dpoy.defensiveInterceptions + dpoy.fumbleRecoveries + dpoy.defensiveSacks) > 0) {
    const defPlays = dpoy.defensiveInterceptions + dpoy.fumbleRecoveries + dpoy.defensiveSacks;
    awards.push({
      type: "DPOY",
      playerId: dpoy.playerId,
      playerName: dpoy.playerName,
      playerNumber: dpoy.playerNumber,
      teamId: dpoy.teamId,
      statLine: `${defPlays} def. plays (${dpoy.defensiveInterceptions} INT, ${dpoy.fumbleRecoveries} FR, ${dpoy.defensiveSacks} sacks)`,
    });
  }

  // CLUTCH: best single-game performance (highest PRF in any one game)
  let clutchPlayer: PlayerSeasonStats | null = null;
  let clutchPRF = 0;
  let clutchWeek = 0;
  for (const ps of playerStats) {
    for (const gl of ps.gameLog) {
      if (gl.pointsResponsibleFor > clutchPRF) {
        clutchPRF = gl.pointsResponsibleFor;
        clutchPlayer = ps;
        clutchWeek = gl.week;
      }
    }
  }
  if (clutchPlayer && clutchPRF > 0) {
    awards.push({
      type: "CLUTCH",
      playerId: clutchPlayer.playerId,
      playerName: clutchPlayer.playerName,
      playerNumber: clutchPlayer.playerNumber,
      teamId: clutchPlayer.teamId,
      statLine: `${clutchPRF} pts in Week ${clutchWeek}`,
    });
  }

  // BEST TURNOVER TEAM: team with the best turnover differential
  if (teamStats && teamStats.length > 0) {
    const teamsWithManual = teamStats.filter((t) => t.manualGamesPlayed > 0);
    if (teamsWithManual.length > 0) {
      const best = [...teamsWithManual].sort((a, b) => b.turnoverDiff - a.turnoverDiff)[0];
      if (best && best.turnoverDiff !== 0) {
        const diffStr = best.turnoverDiff > 0 ? `+${best.turnoverDiff}` : `${best.turnoverDiff}`;
        awards.push({
          type: "BEST_TURNOVER_TEAM",
          playerId: best.teamId,
          playerName: best.teamId, // Will be resolved to team name in display
          teamId: best.teamId,
          statLine: `${diffStr} turnover diff (${best.turnoversForced} forced, ${best.turnoversCommitted} lost)`,
          isTeamAward: true,
        });
      }
    }
  }

  return awards;
}

// ============================================================
// 5. Season Moments
// ============================================================

export function calculateSeasonMoments(
  season: FdfSeason,
  games: Record<string, FdfGame>,
  teams: Record<string, FdfTeam>,
): SeasonMoment[] {
  const moments: SeasonMoment[] = [];

  // Only played games (non-simulated) with drive data
  const playedGames = season.schedule.filter(
    (sg) =>
      sg.result &&
      !sg.result.isSimulated &&
      sg.gameId &&
      games[sg.gameId] &&
      !sg.isBye
  );

  interface GameData {
    sg: ScheduleGame;
    game: FdfGame;
    homeTeam: FdfTeam;
    awayTeam: FdfTeam;
    margin: number;
    totalPoints: number;
    wpSwing: number;
    headline: string;
  }

  const gameDataList: GameData[] = [];

  for (const sg of playedGames) {
    const game = games[sg.gameId!];
    if (!game || game.status !== "completed") continue;

    const homeTeam = teams[sg.homeTeamId];
    const awayTeam = teams[sg.awayTeamId];
    if (!homeTeam || !awayTeam) continue;

    const homeScore = game.score.home.total;
    const awayScore = game.score.away.total;
    const margin = Math.abs(homeScore - awayScore);
    const totalPoints = homeScore + awayScore;

    const wpHistory = computeWPHistory(game);
    const wpAnalytics = computeWPAnalytics(wpHistory, game.homeTeamId);
    const headline = generateGameHeadline(game, homeTeam, awayTeam, wpAnalytics);

    gameDataList.push({
      sg,
      game,
      homeTeam,
      awayTeam,
      margin,
      totalPoints,
      wpSwing: wpAnalytics.biggestSwingDelta,
      headline,
    });
  }

  if (gameDataList.length === 0) return moments;

  // Biggest WP swing
  const bySwing = [...gameDataList].sort((a, b) => b.wpSwing - a.wpSwing);
  if (bySwing[0] && bySwing[0].wpSwing > 0.1) {
    const gd = bySwing[0];
    moments.push({
      type: "biggest_wp_swing",
      week: gd.sg.week,
      homeTeamId: gd.sg.homeTeamId,
      awayTeamId: gd.sg.awayTeamId,
      homeScore: gd.game.score.home.total,
      awayScore: gd.game.score.away.total,
      headline: gd.headline,
      gameId: gd.sg.gameId,
      wpSwing: Math.round(gd.wpSwing * 100),
    });
  }

  // Closest game
  const byMargin = [...gameDataList].sort((a, b) => a.margin - b.margin);
  if (byMargin[0]) {
    const gd = byMargin[0];
    moments.push({
      type: "closest_game",
      week: gd.sg.week,
      homeTeamId: gd.sg.homeTeamId,
      awayTeamId: gd.sg.awayTeamId,
      homeScore: gd.game.score.home.total,
      awayScore: gd.game.score.away.total,
      headline: gd.headline,
      gameId: gd.sg.gameId,
    });
  }

  // Biggest blowout
  const byBlowout = [...gameDataList].sort((a, b) => b.margin - a.margin);
  if (byBlowout[0] && byBlowout[0].margin >= 14) {
    const gd = byBlowout[0];
    moments.push({
      type: "blowout",
      week: gd.sg.week,
      homeTeamId: gd.sg.homeTeamId,
      awayTeamId: gd.sg.awayTeamId,
      homeScore: gd.game.score.home.total,
      awayScore: gd.game.score.away.total,
      headline: gd.headline,
      gameId: gd.sg.gameId,
    });
  }

  // Comebacks (WP swing > 40%)
  for (const gd of gameDataList) {
    if (gd.wpSwing > 0.4 && !moments.some((m) => m.type === "biggest_wp_swing" && m.gameId === gd.sg.gameId)) {
      moments.push({
        type: "comeback",
        week: gd.sg.week,
        homeTeamId: gd.sg.homeTeamId,
        awayTeamId: gd.sg.awayTeamId,
        homeScore: gd.game.score.home.total,
        awayScore: gd.game.score.away.total,
        headline: gd.headline,
        gameId: gd.sg.gameId,
        wpSwing: Math.round(gd.wpSwing * 100),
      });
    }
  }

  // Shutouts
  for (const gd of gameDataList) {
    if (gd.game.score.home.total === 0 || gd.game.score.away.total === 0) {
      moments.push({
        type: "shutout",
        week: gd.sg.week,
        homeTeamId: gd.sg.homeTeamId,
        awayTeamId: gd.sg.awayTeamId,
        homeScore: gd.game.score.home.total,
        awayScore: gd.game.score.away.total,
        headline: gd.headline,
        gameId: gd.sg.gameId,
      });
    }
  }

  // Highest scoring
  const byPoints = [...gameDataList].sort((a, b) => b.totalPoints - a.totalPoints);
  if (byPoints[0] && byPoints[0].totalPoints >= 40) {
    const gd = byPoints[0];
    moments.push({
      type: "highest_scoring",
      week: gd.sg.week,
      homeTeamId: gd.sg.homeTeamId,
      awayTeamId: gd.sg.awayTeamId,
      homeScore: gd.game.score.home.total,
      awayScore: gd.game.score.away.total,
      headline: gd.headline,
      gameId: gd.sg.gameId,
    });
  }

  // Overtime games
  for (const gd of gameDataList) {
    if (gd.sg.result?.isOvertime) {
      moments.push({
        type: "overtime",
        week: gd.sg.week,
        homeTeamId: gd.sg.homeTeamId,
        awayTeamId: gd.sg.awayTeamId,
        homeScore: gd.game.score.home.total,
        awayScore: gd.game.score.away.total,
        headline: gd.headline,
        gameId: gd.sg.gameId,
      });
    }
  }

  // Sort by week
  moments.sort((a, b) => a.week - b.week);

  return moments;
}
