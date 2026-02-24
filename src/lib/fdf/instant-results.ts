import type {
  FdfTeam,
  TeamQualities,
  SeasonGameResult,
  InstantResultData,
  OvertimeConfig,
} from "./types";

// ============================================================
// Dice helpers
// ============================================================

/** Roll a single d6 (1-6) */
function d6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/** Roll 2d6 and return the sum (2-12) */
function twoD6Sum(): number {
  return d6() + d6();
}

/** Roll 2d6 as tens+ones (range 11-66) */
function twoD6TensOnes(): number {
  return d6() * 10 + d6();
}

// ============================================================
// Step 1: Team Rating
// ============================================================

function calculateOffenseRating(q: TeamQualities): number {
  let rating = 0;

  // Scoring: PROLIFIC +4 / DULL -4
  if (q.offense.scoring === "PROLIFIC") rating += q.offense.scoringSemi ? 2 : 4;
  if (q.offense.scoring === "DULL") rating -= q.offense.scoringSemi ? 2 : 4;

  // Clock management: EFFICIENT +2 / INEFFICIENT -2
  if (q.offense.clockManagement === "EFFICIENT") rating += q.offense.clockManagementLevel === "semi" ? 1 : 2;
  if (q.offense.clockManagement === "INEFFICIENT") rating -= q.offense.clockManagementLevel === "semi" ? 1 : 2;

  // Yards: DYNAMIC +1 / ERRATIC -1
  if (q.offense.yards === "DYNAMIC") rating += q.offense.yardsSemi ? 0.5 : 1;
  if (q.offense.yards === "ERRATIC") rating -= q.offense.yardsSemi ? 0.5 : 1;

  // Protection: SOLID +1 / POROUS -1
  if (q.offense.protection === "SOLID") rating += q.offense.protectionSemi ? 0.5 : 1;
  if (q.offense.protection === "POROUS") rating -= q.offense.protectionSemi ? 0.5 : 1;

  // Ball security: RELIABLE +1 / SHAKY -1
  if (q.offense.ballSecurity === "RELIABLE") rating += q.offense.ballSecuritySemi ? 0.5 : 1;
  if (q.offense.ballSecurity === "SHAKY") rating -= q.offense.ballSecuritySemi ? 0.5 : 1;

  // Fumbles: SECURE +1 / CLUMSY -1
  if (q.offense.fumbles === "SECURE") rating += q.offense.fumblesSemi ? 0.5 : 1;
  if (q.offense.fumbles === "CLUMSY") rating -= q.offense.fumblesSemi ? 0.5 : 1;

  // Discipline: DISCIPLINED +1 / UNDISCIPLINED -1
  if (q.offense.discipline === "DISCIPLINED") rating += q.offense.disciplineSemi ? 0.5 : 1;
  if (q.offense.discipline === "UNDISCIPLINED") rating -= q.offense.disciplineSemi ? 0.5 : 1;

  return rating;
}

function calculateDefenseRating(q: TeamQualities): number {
  let rating = 0;

  // Scoring: STAUNCH +4 / INEPT -4
  if (q.defense.scoring === "STAUNCH") rating += q.defense.scoringSemi ? 2 : 4;
  if (q.defense.scoring === "INEPT") rating -= q.defense.scoringSemi ? 2 : 4;

  // Yards: STIFF +1 / SOFT -1
  if (q.defense.yards === "STIFF") rating += q.defense.yardsSemi ? 0.5 : 1;
  if (q.defense.yards === "SOFT") rating -= q.defense.yardsSemi ? 0.5 : 1;

  // Pass rush: PUNISHING +1 / MILD -1
  if (q.defense.passRush === "PUNISHING") rating += q.defense.passRushSemi ? 0.5 : 1;
  if (q.defense.passRush === "MILD") rating -= q.defense.passRushSemi ? 0.5 : 1;

  // Coverage: AGGRESSIVE +1 / MEEK -1
  if (q.defense.coverage === "AGGRESSIVE") rating += q.defense.coverageSemi ? 0.5 : 1;
  if (q.defense.coverage === "MEEK") rating -= q.defense.coverageSemi ? 0.5 : 1;

  // Fumble recovery: ACTIVE +1 / PASSIVE -1
  if (q.defense.fumbleRecovery === "ACTIVE") rating += q.defense.fumbleRecoverySemi ? 0.5 : 1;
  if (q.defense.fumbleRecovery === "PASSIVE") rating -= q.defense.fumbleRecoverySemi ? 0.5 : 1;

  // Discipline: DISCIPLINED +1 / UNDISCIPLINED -1
  if (q.defense.discipline === "DISCIPLINED") rating += q.defense.disciplineSemi ? 0.5 : 1;
  if (q.defense.discipline === "UNDISCIPLINED") rating -= q.defense.disciplineSemi ? 0.5 : 1;

  return rating;
}

function isSuperEfficient(q: TeamQualities): boolean {
  return q.offense.clockManagement === "EFFICIENT" && q.offense.clockManagementLevel === "super";
}

export function calculateTeamRating(team: FdfTeam): number {
  const off = calculateOffenseRating(team.qualities);
  const def = calculateDefenseRating(team.qualities);
  const raw = (off + def) / 2;

  // Super EFFICIENT → always round UP
  if (isSuperEfficient(team.qualities)) {
    return Math.ceil(raw);
  }
  return Math.round(raw);
}

// ============================================================
// Step 2: Point Differential
// ============================================================

function calculatePointDifferential(homeRating: number, awayRating: number): number {
  return homeRating - awayRating;
}

// ============================================================
// Step 3: Win Range Table & Roll
// ============================================================

/** Win range max for given point differential (2d6 tens+ones, range 11-66) */
function getWinRangeMax(diff: number): number {
  if (diff >= 7) return 66; // off the chart high → almost guaranteed
  if (diff >= 6) return 65;
  if (diff === 5) return 63;
  if (diff === 4) return 56;
  if (diff === 3) return 53;
  if (diff === 2) return 46;
  if (diff === 1) return 44;
  if (diff === 0) return 42;
  if (diff === -1) return 36;
  if (diff === -2) return 34;
  if (diff === -3) return 31;
  if (diff === -4) return 24;
  if (diff === -5) return 21;
  if (diff === -6) return 13;
  return 11; // diff <= -7
}

interface WinRollResult {
  roll: number;
  homeWins: boolean;
  isOvertime: boolean;
  otRoll?: number;
  otHomeWins?: boolean;
  isTie?: boolean;
}

function rollForWinner(diff: number, otConfig: OvertimeConfig): WinRollResult {
  const winRangeMax = getWinRangeMax(diff);
  const roll = twoD6TensOnes();

  // Check if exact match for OT trigger
  if (roll === winRangeMax) {
    // Overtime: re-roll using Home Team Rating as the diff
    const otRoll = twoD6TensOnes();
    const otWinRangeMax = getWinRangeMax(diff); // re-use home diff as specified
    if (otRoll === otWinRangeMax && otConfig.canEndInTie) {
      return { roll, homeWins: false, isOvertime: true, otRoll, isTie: true };
    }
    const otHomeWins = otRoll <= otWinRangeMax;
    return { roll, homeWins: otHomeWins, isOvertime: true, otRoll, otHomeWins };
  }

  const homeWins = roll <= winRangeMax;
  return { roll, homeWins, isOvertime: false };
}

// ============================================================
// Step 4: Winner Score
// ============================================================

type ScoringQuality = "PROLIFIC" | "PROLIFIC_SEMI" | "NEUTRAL" | "DULL_SEMI" | "DULL";

function getWinnerScoringQuality(team: FdfTeam): ScoringQuality {
  const q = team.qualities.offense;
  if (q.scoring === "PROLIFIC") return q.scoringSemi ? "PROLIFIC_SEMI" : "PROLIFIC";
  if (q.scoring === "DULL") return q.scoringSemi ? "DULL_SEMI" : "DULL";
  return "NEUTRAL";
}

// Score tables indexed by 2d6 sum (2-12)
// †: re-roll 2d6, if 2-4 subtract 3
// *: re-roll 2d6, if 10-12 add 7
const SCORE_TABLES: Record<ScoringQuality, number[]> = {
  //              index: 0=unused, 1=unused, 2, 3, 4, 5,  6,  7,  8,  9, 10, 11, 12
  PROLIFIC:       [0, 0, 17, 21, 24, 27, 28, 31, 33, 35, 38, 42, 45],
  PROLIFIC_SEMI:  [0, 0, 14, 17, 21, 24, 27, 28, 31, 33, 35, 38, 42],
  NEUTRAL:        [0, 0, 10, 13, 17, 20, 21, 24, 27, 28, 31, 34, 38],
  DULL_SEMI:      [0, 0,  7, 10, 13, 17, 20, 21, 23, 24, 27, 31, 34],
  DULL:           [0, 0,  3,  7, 10, 13, 14, 17, 20, 21, 24, 27, 31],
};

// Dagger (†) applies to sum 2 for all categories
// Star (*) applies to sum 12 for all categories
function calculateWinnerScore(quality: ScoringQuality, rollSum: number): number {
  const table = SCORE_TABLES[quality];
  let score = table[rollSum];

  // †: re-roll 2d6, if 2-4 subtract 3
  if (rollSum === 2) {
    const reroll = twoD6Sum();
    if (reroll >= 2 && reroll <= 4) {
      score -= 3;
    }
  }

  // *: re-roll 2d6, if 10-12 add 7
  if (rollSum === 12) {
    const reroll = twoD6Sum();
    if (reroll >= 10 && reroll <= 12) {
      score += 7;
    }
  }

  return Math.max(0, score);
}

// ============================================================
// Step 5: Loser Score
// ============================================================

function calculateLoserScore(winnerScore: number, isOvertimeLoss: boolean): {
  score: number;
  closenessRoll: number;
  formulaRoll: number;
} {
  // OT loss override
  if (isOvertimeLoss) {
    const otRoll = d6();
    const score = otRoll <= 4 ? winnerScore - 3 : winnerScore - 6;
    return { score: Math.max(0, score), closenessRoll: otRoll, formulaRoll: 0 };
  }

  // 1d6 closeness: 1-2 close, 3-4 moderate, 5-6 blowout
  const closenessRoll = d6();
  const formulaRoll = d6();

  let score: number;
  if (closenessRoll <= 2) {
    // Close: WinnerScore - (1d6 + 0)
    score = winnerScore - formulaRoll;
  } else if (closenessRoll <= 4) {
    // Moderate: WinnerScore - (1d6 + 6)
    score = winnerScore - (formulaRoll + 6);
  } else {
    // Blowout: WinnerScore - (1d6 + 13)
    score = winnerScore - (formulaRoll + 13);
  }

  // Score <= 1 → 0
  if (score <= 1) {
    score = 0;
  }

  // Score exactly 4 → 2d6, only "2" keeps it at 4, else 3
  if (score === 4) {
    const checkRoll = twoD6Sum();
    if (checkRoll !== 2) {
      score = 3;
    }
  }

  return { score: Math.max(0, score), closenessRoll, formulaRoll };
}

// ============================================================
// Main Engine
// ============================================================

export function simulateInstantResult(
  homeTeam: FdfTeam,
  awayTeam: FdfTeam,
  overtimeConfig: OvertimeConfig
): SeasonGameResult {
  // Step 1: Team ratings
  const homeRating = calculateTeamRating(homeTeam);
  const awayRating = calculateTeamRating(awayTeam);

  // Step 2: Point differential
  const pointDiff = calculatePointDifferential(homeRating, awayRating);

  // Step 3: Win range & roll
  const winRangeMax = getWinRangeMax(pointDiff);
  const winResult = rollForWinner(pointDiff, overtimeConfig);

  // Handle tie
  if (winResult.isTie) {
    // Both teams get same score via neutral scoring
    const tieScoreRoll = twoD6Sum();
    const tieScore = SCORE_TABLES.NEUTRAL[tieScoreRoll];
    return {
      homeScore: tieScore,
      awayScore: tieScore,
      winner: "tie",
      isOvertime: true,
      isSimulated: true,
      instantResultData: {
        homeTeamRating: homeRating,
        awayTeamRating: awayRating,
        pointDifferential: pointDiff,
        winRangeMax,
        rollResult: winResult.roll,
        otRollResult: winResult.otRoll,
        winnerScoringQuality: "NEUTRAL",
        winnerScoreRoll: tieScoreRoll,
        loserClosenessRoll: 0,
        loserFormulaRoll: 0,
      },
    };
  }

  // Step 4: Winner score
  const winnerTeam = winResult.homeWins ? homeTeam : awayTeam;
  const scoringQuality = getWinnerScoringQuality(winnerTeam);
  const winnerScoreRoll = twoD6Sum();
  const winnerScore = calculateWinnerScore(scoringQuality, winnerScoreRoll);

  // Step 5: Loser score
  const { score: loserScore, closenessRoll, formulaRoll } = calculateLoserScore(
    winnerScore,
    winResult.isOvertime
  );

  const homeScore = winResult.homeWins ? winnerScore : loserScore;
  const awayScore = winResult.homeWins ? loserScore : winnerScore;

  return {
    homeScore,
    awayScore,
    winner: winResult.homeWins ? "home" : "away",
    isOvertime: winResult.isOvertime,
    isSimulated: true,
    instantResultData: {
      homeTeamRating: homeRating,
      awayTeamRating: awayRating,
      pointDifferential: pointDiff,
      winRangeMax,
      rollResult: winResult.roll,
      otRollResult: winResult.otRoll,
      winnerScoringQuality: scoringQuality,
      winnerScoreRoll,
      loserClosenessRoll: closenessRoll,
      loserFormulaRoll: formulaRoll,
    },
  };
}
