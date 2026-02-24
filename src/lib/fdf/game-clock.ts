import type { GameClock } from "./types";
import { TICKS_PER_QUARTER } from "./constants";

export interface ClockResult {
  newClock: GameClock;
  quarterChanged: boolean;
  halfEnded: boolean;
  gameEnded: boolean;
}

/**
 * Consume ticks from the game clock, handling quarter and half transitions.
 * Q1→Q2→halftime→Q3→Q4→end (or OT if tied, handled at game level)
 */
export function consumeTicks(clock: GameClock, ticks: number): ClockResult {
  let remaining = clock.ticksRemaining - ticks;
  let quarter = clock.quarter;
  let quarterChanged = false;
  let halfEnded = false;
  let gameEnded = false;
  const isHalftime = false;

  if (remaining <= 0) {
    // Quarter ended
    remaining = 0;
    quarterChanged = true;

    if (quarter === 1) {
      quarter = 2;
      remaining = TICKS_PER_QUARTER;
    } else if (quarter === 2) {
      quarter = 3;
      remaining = TICKS_PER_QUARTER;
      halfEnded = true;
    } else if (quarter === 3) {
      quarter = 4;
      remaining = TICKS_PER_QUARTER;
    } else if (quarter === 4) {
      gameEnded = true;
    } else if (quarter === 5) {
      // OT ended
      gameEnded = true;
    }
  }

  return {
    newClock: {
      quarter: quarter as GameClock["quarter"],
      ticksRemaining: remaining,
      isHalftime: isHalftime || (halfEnded && !gameEnded),
      isGameOver: gameEnded,
    },
    quarterChanged,
    halfEnded,
    gameEnded,
  };
}

/**
 * Convert ticks remaining to display time (MM:SS).
 * Each tick = 75 seconds (1m15s). 12 ticks = 15:00 (full quarter).
 */
export function getClockDisplayTime(ticksRemaining: number): string {
  const totalSeconds = ticksRemaining * 75;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * True when ≤4 ticks remain in the current quarter (the EFFICIENT/INEFFICIENT zone).
 */
export function isTimingWarningZone(ticksRemaining: number): boolean {
  return ticksRemaining <= 4;
}

/**
 * Start a new OT period.
 */
export function startOvertime(): GameClock {
  return {
    quarter: 5,
    ticksRemaining: TICKS_PER_QUARTER,
    isHalftime: false,
    isGameOver: false,
  };
}
