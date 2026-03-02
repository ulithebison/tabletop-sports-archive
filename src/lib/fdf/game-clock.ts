import type { GameClock } from "./types";
import type { TimingConfig } from "./constants";
import { TICKS_PER_QUARTER, TICKS_PER_OT_PERIOD } from "./constants";

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
export function consumeTicks(clock: GameClock, ticks: number, config?: TimingConfig): ClockResult {
  const ticksPerQ = config?.ticksPerQuarter ?? TICKS_PER_QUARTER;
  let remaining = clock.ticksRemaining - ticks;
  let quarter = clock.quarter;
  let quarterChanged = false;
  let halfEnded = false;
  let gameEnded = false;
  const isHalftime = false;

  if (remaining <= 0) {
    // Quarter ended — capture overflow for within-half carry
    const overflow = -remaining;
    remaining = 0;
    quarterChanged = true;

    if (quarter === 1) {
      quarter = 2;
      remaining = ticksPerQ - overflow;
    } else if (quarter === 2) {
      quarter = 3;
      remaining = ticksPerQ; // halftime: no overflow
      halfEnded = true;
    } else if (quarter === 3) {
      quarter = 4;
      remaining = ticksPerQ - overflow;
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
 * Each tick = secondsPerTick (default 75 for Dice, 30 for FAC).
 */
export function getClockDisplayTime(ticksRemaining: number, secondsPerTick?: number): string {
  const totalSeconds = ticksRemaining * (secondsPerTick ?? 75);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * True when ticks remaining ≤ threshold (the EFFICIENT/INEFFICIENT zone).
 * Default threshold = 4 (Dice). FAC = 10.
 */
export function isTimingWarningZone(ticksRemaining: number, threshold?: number): boolean {
  return ticksRemaining <= (threshold ?? 4);
}

/**
 * Start a new OT period.
 */
export function startOvertime(config?: TimingConfig): GameClock {
  return {
    quarter: 5,
    ticksRemaining: config?.ticksPerOTPeriod ?? TICKS_PER_OT_PERIOD,
    isHalftime: false,
    isGameOver: false,
  };
}

/**
 * Start an additional OT period (playoffs only).
 * Same clock as startOvertime — separate function for clarity.
 */
export function startNewOTPeriod(config?: TimingConfig): GameClock {
  return startOvertime(config);
}
