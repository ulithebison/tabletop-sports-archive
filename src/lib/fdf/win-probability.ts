import type { FdfGame, WinProbabilitySnapshot, WPAnalytics } from "./types";
import { TICKS_PER_OT_PERIOD } from "./constants";

/**
 * Logistic win probability model.
 * k increases as the game progresses (late-game score diffs matter more).
 */
export function calculateWinProbability(
  scoreDiff: number,
  ticksRemaining: number,
  homePossession: boolean,
): number {
  const k = 0.15 + (1 - ticksRemaining / 48) * 0.35;
  const possessionBonus = homePossession ? 1.5 : -1.5;
  const homeFieldAdv = 1.5;
  const adjustedDiff = scoreDiff + possessionBonus + homeFieldAdv;
  const wp = 1 / (1 + Math.exp(-k * adjustedDiff));
  return Math.max(0.01, Math.min(0.99, wp));
}

/**
 * Total ticks remaining in the game given quarter and ticks left in that quarter.
 * Q1-4: (4 - quarter) * 12 + ticksInQuarter
 * Q5 (OT): just ticksInQuarter (no further quarters)
 */
export function totalTicksRemaining(
  quarter: 1 | 2 | 3 | 4 | 5,
  ticksInQuarter: number,
): number {
  if (quarter === 5) return ticksInQuarter;
  return (4 - quarter) * 12 + ticksInQuarter;
}

/**
 * Compute win probability history from a game's drives.
 * Returns one snapshot per drive plus an initial pre-game snapshot.
 */
export function computeWPHistory(game: FdfGame): WinProbabilitySnapshot[] {
  const snapshots: WinProbabilitySnapshot[] = [];

  // Snapshot 0: pre-game (home has ~53% WP from home field advantage)
  const initialHomePossession = game.currentPossession === "home" ||
    (game.drives.length > 0 && game.drives[0].teamId === game.awayTeamId);
  // At game start, away typically receives — so first drive possession is away
  const firstDriveIsHome = game.drives.length > 0
    ? game.drives[0].teamId === game.homeTeamId
    : game.currentPossession === "home";

  snapshots.push({
    afterDriveNumber: 0,
    quarter: 1,
    ticksRemaining: 48,
    homeScore: 0,
    awayScore: 0,
    scoreDifferential: 0,
    homeWinProbability: calculateWinProbability(0, 48, firstDriveIsHome),
    possessionTeamId: game.drives.length > 0 ? game.drives[0].teamId : game.homeTeamId,
  });

  // Track ticks consumed per quarter to compute remaining ticks
  const ticksConsumedPerQuarter: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (let i = 0; i < game.drives.length; i++) {
    const drive = game.drives[i];

    // Accumulate ticks
    ticksConsumedPerQuarter[drive.quarter] += drive.driveTicks;
    const maxTicksForQuarter = drive.quarter === 5 ? TICKS_PER_OT_PERIOD : 12;
    const ticksInQuarter = Math.max(0, maxTicksForQuarter - ticksConsumedPerQuarter[drive.quarter]);
    const totalTicks = totalTicksRemaining(drive.quarter, ticksInQuarter);

    // Parse score from scoreAfterDrive (format: "away-home")
    const [awayStr, homeStr] = drive.scoreAfterDrive.split("-");
    const homeScore = parseInt(homeStr, 10) || 0;
    const awayScore = parseInt(awayStr, 10) || 0;
    const scoreDiff = homeScore - awayScore;

    // Next possession: look at next drive, or toggle current
    const nextDrive = game.drives[i + 1];
    const nextPossessionTeamId = nextDrive
      ? nextDrive.teamId
      : (drive.teamId === game.homeTeamId ? game.awayTeamId : game.homeTeamId);
    const nextIsHomePossession = nextPossessionTeamId === game.homeTeamId;

    // If game is over after this drive, WP is 0 or 1 based on score
    let wp: number;
    if (game.gameClock.isGameOver && i === game.drives.length - 1) {
      if (scoreDiff > 0) wp = 0.99;
      else if (scoreDiff < 0) wp = 0.01;
      else wp = 0.50;
    } else {
      wp = calculateWinProbability(scoreDiff, totalTicks, nextIsHomePossession);
    }

    snapshots.push({
      afterDriveNumber: drive.driveNumber,
      quarter: drive.quarter,
      ticksRemaining: totalTicks,
      homeScore,
      awayScore,
      scoreDifferential: scoreDiff,
      homeWinProbability: wp,
      possessionTeamId: nextPossessionTeamId,
    });
  }

  return snapshots;
}

/**
 * Compute analytics from WP snapshots.
 */
export function computeWPAnalytics(
  snapshots: WinProbabilitySnapshot[],
  homeTeamId: string,
): WPAnalytics {
  let keyPlay: WPAnalytics["keyPlay"] = null;
  let biggestLead: WPAnalytics["biggestLead"] = null;
  let leadChanges = 0;
  let biggestSwingDelta = 0;

  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];
    const delta = Math.abs(curr.homeWinProbability - prev.homeWinProbability);

    // Key play: biggest single-drive WP swing
    if (delta > biggestSwingDelta) {
      biggestSwingDelta = delta;
      keyPlay = { snapshot: curr, delta };
    }

    // Biggest lead: furthest from 50%
    const deviation = Math.abs(curr.homeWinProbability - 0.5);
    const currentBiggestDeviation = biggestLead
      ? Math.abs(biggestLead.snapshot.homeWinProbability - 0.5)
      : 0;
    if (deviation > currentBiggestDeviation) {
      const leadTeamId = curr.homeWinProbability > 0.5 ? homeTeamId : curr.possessionTeamId;
      // Determine which team has the lead based on score
      const actualLeadTeamId = curr.scoreDifferential > 0
        ? homeTeamId
        : curr.scoreDifferential < 0
          ? (curr.possessionTeamId === homeTeamId ? curr.possessionTeamId : snapshots[0].possessionTeamId)
          : homeTeamId;
      biggestLead = {
        snapshot: curr,
        teamId: curr.homeWinProbability > 0.5 ? homeTeamId : actualLeadTeamId,
        wpPct: curr.homeWinProbability > 0.5
          ? curr.homeWinProbability
          : 1 - curr.homeWinProbability,
      };
    }

    // Lead changes: WP line crosses 50%
    if (
      (prev.homeWinProbability > 0.5 && curr.homeWinProbability < 0.5) ||
      (prev.homeWinProbability < 0.5 && curr.homeWinProbability > 0.5)
    ) {
      leadChanges++;
    }
  }

  return { keyPlay, biggestLead, leadChanges, biggestSwingDelta };
}
