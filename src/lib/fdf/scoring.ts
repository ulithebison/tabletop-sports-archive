import type { DriveResultType, PATResult, QuarterScore } from "./types";

/**
 * Calculate points for a drive result.
 * Returns separate offense and defense points.
 * - Return TDs: offense (drive team) scored → offensePoints = 6+PAT
 * - Kick/Punt TDs: defense scored on offense's drive → defensePoints = 6+PAT
 * - Safety: 2 to defense
 */
export function getPointsForResult(
  result: DriveResultType,
  patResult?: PATResult
): { offensePoints: number; defensePoints: number } {
  const patPoints = patResult ? getPATPoints(patResult) : 0;

  // Return TDs — scored by the offense (drive team = scoring team)
  if (isReturnTD(result)) {
    return { offensePoints: 6 + patPoints, defensePoints: 0 };
  }

  // Kick/Punt TDs — defense scored on offense's drive
  if (isDefenseScoringTD(result)) {
    return { offensePoints: 0, defensePoints: 6 + patPoints };
  }

  // Safety — 2 points to the defense
  if (result === "SAFETY") {
    return { offensePoints: 0, defensePoints: 2 };
  }

  // Regular touchdowns
  if (isTouchdown(result)) {
    return { offensePoints: 6 + patPoints, defensePoints: 0 };
  }

  // Field goals
  if (result === "FGA_GOOD" || result === "DESPERATION_FGA") {
    return { offensePoints: 3, defensePoints: 0 };
  }

  // Everything else: no points (includes KICK_PUNT_REC_RECOVERS, KICK_PUNT_KICK_RECOVERS)
  return { offensePoints: 0, defensePoints: 0 };
}

function getPATPoints(patResult: PATResult): number {
  switch (patResult) {
    case "XP_GOOD": return 1;
    case "2PT_GOOD": return 2;
    default: return 0;
  }
}

export function isTouchdown(result: DriveResultType): boolean {
  return (
    result === "TD_RUN" ||
    result === "TD_PASS" ||
    result === "DESPERATION_TD" ||
    result === "HAIL_MARY_TD" as DriveResultType
  );
}

export function isReturnTD(result: DriveResultType): boolean {
  return (
    result === "KICKOFF_RETURN_TD" ||
    result === "PUNT_RETURN_TD" ||
    result === "FUMBLE_RETURN_TD" ||
    result === "INTERCEPTION_RETURN_TD" ||
    result === "BLOCKED_FG_RETURN_TD" ||
    result === "BLOCKED_PUNT_TD" ||
    result === "FREE_KICK_RETURN_TD"
  );
}

/**
 * Whether a result is a defense-scoring TD (kick/punt fumble recovered for TD).
 * Defense scored on the offense's drive — points go to defensePoints.
 */
export function isDefenseScoringTD(result: DriveResultType): boolean {
  return result === "KICK_PUNT_KICK_TD";
}

/**
 * Whether a result is an instant play (no field position or drive time needed).
 * Return TDs and some kick/punt fumbles happen instantly — no FP, no time consumed, 0 ticks.
 */
export function isInstantResult(result: DriveResultType): boolean {
  return isReturnTD(result) || isDefenseScoringTD(result) || result === "KICK_PUNT_REC_RECOVERS"
    || result === "ONSIDE_KICK_SUCCESS" || result === "ONSIDE_KICK_FAIL"
    || result === "UNUSUAL_RESULT";
}

/**
 * Whether a result requires field position but no clock ticks.
 * KICK_PUNT_KICK_RECOVERS: kicking team recovers the fumble at a field position, no time consumed.
 */
export function isNoClockPlay(result: DriveResultType): boolean {
  return result === "KICK_PUNT_KICK_RECOVERS";
}

export function isScoringPlay(result: DriveResultType): boolean {
  return (
    isTouchdown(result) ||
    isReturnTD(result) ||
    isDefenseScoringTD(result) ||
    result === "SAFETY" ||
    result === "FGA_GOOD" ||
    result === "DESPERATION_FGA"
  );
}

/**
 * Whether a PAT selection is needed after this result.
 */
export function needsPAT(result: DriveResultType): boolean {
  return isTouchdown(result) || isReturnTD(result) || isDefenseScoringTD(result);
}

/**
 * Immutable update to a quarter score.
 */
export function addToQuarterScore(
  score: QuarterScore,
  quarter: 1 | 2 | 3 | 4 | 5,
  points: number
): QuarterScore {
  const updated = { ...score };
  switch (quarter) {
    case 1: updated.q1 += points; break;
    case 2: updated.q2 += points; break;
    case 3: updated.q3 += points; break;
    case 4: updated.q4 += points; break;
    case 5: updated.ot += points; break;
  }
  updated.total = updated.q1 + updated.q2 + updated.q3 + updated.q4 + updated.ot;
  return updated;
}
