// ============================================================
// FDF Commissioner — Dice Engine (Base-6 Arithmetic)
// ============================================================
//
// FDF uses a 2d6 "tens-ones" system: die1 is the tens digit, die2 is the ones digit.
// So rolling a 3 and a 5 gives "35", NOT 8 (the sum).
// Valid results: "11" through "66" (36 possible outcomes).
// Base-6 arithmetic: after "16" comes "21", not "17".

export type DiceResult = string; // "11" through "66"

/** Roll a single d6 (1-6) */
export function randomD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/** Roll 2d6 as tens+ones and return a DiceResult string */
export function randomDiceResult(): DiceResult {
  return formatDiceResult(randomD6(), randomD6());
}

/** Format two die values into a DiceResult string */
export function formatDiceResult(die1: number, die2: number): DiceResult {
  return `${die1}${die2}`;
}

/**
 * Convert a DiceResult to a linear 0-35 index.
 * "11" → 0, "12" → 1, ..., "16" → 5, "21" → 6, ..., "66" → 35
 */
export function diceResultToLinear(roll: DiceResult): number {
  const tens = parseInt(roll[0], 10);
  const ones = parseInt(roll[1], 10);
  return (tens - 1) * 6 + (ones - 1);
}

/**
 * Convert a linear 0-35 index back to a DiceResult.
 * 0 → "11", 5 → "16", 6 → "21", 35 → "66"
 */
export function linearToDiceResult(linear: number): DiceResult {
  const clamped = Math.max(0, Math.min(35, linear));
  const tens = Math.floor(clamped / 6) + 1;
  const ones = (clamped % 6) + 1;
  return formatDiceResult(tens, ones);
}

/**
 * Apply a modifier to a DiceResult using Base-6 arithmetic.
 * "16" + 1 = "21", "21" - 1 = "16"
 * Clamped to [11, 66].
 */
export function applyModifier(roll: DiceResult, modifier: number): DiceResult {
  const linear = diceResultToLinear(roll) + modifier;
  return linearToDiceResult(linear);
}

/**
 * Compare two DiceResults. Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareDiceResults(a: DiceResult, b: DiceResult): number {
  return diceResultToLinear(a) - diceResultToLinear(b);
}

// ============================================================
// Table Lookup
// ============================================================

export interface TableEntry<T> {
  min: DiceResult;
  max: DiceResult;
  result: T;
}

/**
 * Look up a DiceResult in a table of ranges.
 * Each entry has a min and max (inclusive). The roll must fall within [min, max].
 */
export function lookupTable<T>(roll: DiceResult, table: TableEntry<T>[]): T {
  const rollLinear = diceResultToLinear(roll);
  for (const entry of table) {
    const minLinear = diceResultToLinear(entry.min);
    const maxLinear = diceResultToLinear(entry.max);
    if (rollLinear >= minLinear && rollLinear <= maxLinear) {
      return entry.result;
    }
  }
  // Fallback: return last entry if somehow out of range
  return table[table.length - 1].result;
}

// ============================================================
// Simple 1d6 Table Lookup
// ============================================================

export interface SimpleTableEntry<T> {
  min: number;
  max: number;
  result: T;
}

/**
 * Look up a single d6 roll (1-6) in a simple table.
 */
export function lookupSimpleTable<T>(roll: number, table: SimpleTableEntry<T>[]): T {
  for (const entry of table) {
    if (roll >= entry.min && roll <= entry.max) {
      return entry.result;
    }
  }
  return table[table.length - 1].result;
}

// ============================================================
// Card Draw Simulation
// ============================================================

/**
 * Simulate a "card draw" — pick N random teams from a list to receive a quality.
 * CDV = Card Draw Value = how many teams get the positive/negative quality.
 * Returns indices of selected teams.
 */
export function cardDraw(teamCount: number, drawCount: number): number[] {
  const indices = Array.from({ length: teamCount }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, drawCount);
}

/**
 * Simulate a "paired card draw" — for qualities that come in positive/negative pairs.
 * CDV teams get the positive quality, CDV teams get the negative, rest get nothing.
 * Returns { positive: number[], negative: number[] } with team indices.
 */
export function pairedCardDraw(
  teamCount: number,
  drawCount: number
): { positive: number[]; negative: number[] } {
  const indices = Array.from({ length: teamCount }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    positive: indices.slice(0, drawCount),
    negative: indices.slice(drawCount, drawCount * 2),
  };
}

// ============================================================
// Utility
// ============================================================

/**
 * Roll 2d6 and return the sum (2-12).
 */
export function rollD6Sum(): number {
  return randomD6() + randomD6();
}

/**
 * Get the percentage probability of rolling this result or lower.
 * "11" = 2.78%, "66" = 100%
 */
export function rollToPercentage(roll: DiceResult): number {
  return ((diceResultToLinear(roll) + 1) / 36) * 100;
}
