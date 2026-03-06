// ============================================================
// FDF Commissioner — Classic Mode Engine (V1.5)
// ============================================================
// All functions for:
// - League Creation (Steps 1-14)
// - Off-Season (Steps 1-8)
// - Training Camp (Steps 1-9)
// - Breaking News (In-Season)
// - FP Spending

import type { TeamQualities, TeamKicking } from "../types";
import type {
  DiceResult,
} from "./dice-engine";
import {
  randomD6,
  randomDiceResult,
  lookupTable,
  lookupSimpleTable,
  pairedCardDraw,
} from "./dice-engine";
import type {
  ClassicTeamData,
  FrontOfficeGrade,
  HeadCoachGrade,
  OwnershipLoyalty,
  OwnershipCompetence,
} from "./types";
import {
  OWNERSHIP_COMPETENCE_TABLE,
  OWNERSHIP_LOYALTY_TABLE,
  FO_GRADE_CREATION_TABLE,
  TABLE_A_HEAD_COACH_GRADE,
  FRANCHISE_POINTS_MATRIX,
  getQVandCDV,
  TABLE_B_OWNERSHIP_IMPACT,
  TABLE_C_OFFENSE_PROLIFIC,
  TABLE_C_OFFENSE_PROLIFIC_SEMI,
  TABLE_C_OFFENSE_DULL,
  TABLE_C_OFFENSE_DULL_SEMI,
  TABLE_D_DEFENSE_STAUNCH,
  TABLE_D_DEFENSE_STAUNCH_SEMI,
  TABLE_D_DEFENSE_INEPT,
  TABLE_D_DEFENSE_INEPT_SEMI,
  TABLE_E_KICK_RETURN,
  TABLE_E_PUNT_RETURN,
  TABLE_E_FG_RANGE,
  TABLE_E_XP_RANGE,
  TABLE_E_XP_RANGE_2YD,
  TABLE_F_COACHING_CAROUSEL,
  TABLE_J_ANNUAL_DRAFT_OFFENSE,
  TABLE_L_ANNUAL_DRAFT_DEFENSE,
  TABLE_N_INJURY,
  TABLE_O_IMPROVEMENT,
  TABLE_U_UNEXPECTED_EVENTS,
  COACH_GRADE_ADJUSTMENTS,
  FRANCHISE_POINTS_MATRIX as FP_MATRIX,
  SCORING_TENDENCY_TABLE,
  adjustGrade,
  type OwnershipImpactResult,
  type OffenseProfileResult,
  type DefenseProfileResult,
  type OffenseDraftProfile,
  type DefenseDraftProfile,
} from "./dice-tables";

// ============================================================
// League Creation — Steps 1-6
// ============================================================

/** Step 3: Create Ownership (1d6 each for competence and loyalty) */
export function createOwnership(
  competenceRoll: number,
  loyaltyRoll: number
): { competence: OwnershipCompetence; loyalty: OwnershipLoyalty } {
  return {
    competence: lookupSimpleTable(competenceRoll, OWNERSHIP_COMPETENCE_TABLE),
    loyalty: lookupSimpleTable(loyaltyRoll, OWNERSHIP_LOYALTY_TABLE),
  };
}

/** Step 4: Create Front Office Grade (1d6) */
export function createFrontOfficeGrade(roll: number): FrontOfficeGrade {
  return lookupSimpleTable(roll, FO_GRADE_CREATION_TABLE);
}

/** Step 5: Create Head Coach Grade (2d6, dependent on FO Grade and Ownership) */
export function createHeadCoachGrade(
  roll: DiceResult,
  foGrade: FrontOfficeGrade,
  ownership: OwnershipCompetence
): HeadCoachGrade {
  const resolver = lookupTable(roll, TABLE_A_HEAD_COACH_GRADE);
  return resolver(foGrade, ownership);
}

/** Step 6: Calculate Franchise Points */
export function calculateFranchisePoints(
  foGrade: FrontOfficeGrade,
  coachGrade: HeadCoachGrade
): number {
  return FRANCHISE_POINTS_MATRIX[foGrade][coachGrade];
}

/** Step 7: Get QV and CDV for team count */
export { getQVandCDV };

// ============================================================
// League Creation — Steps 8-14: Inaugural Draft
// ============================================================

/** Create empty TeamQualities */
export function emptyQualities(): TeamQualities {
  return {
    offense: {
      scoring: null,
      scoringSemi: false,
      yards: null,
      yardsSemi: false,
      protection: null,
      protectionSemi: false,
      ballSecurity: null,
      ballSecuritySemi: false,
      fumbles: null,
      fumblesSemi: false,
      discipline: null,
      disciplineSemi: false,
      clockManagement: null,
      clockManagementLevel: null,
      scoringTendency: null,
    },
    defense: {
      scoring: null,
      scoringSemi: false,
      yards: null,
      yardsSemi: false,
      passRush: null,
      passRushSemi: false,
      coverage: null,
      coverageSemi: false,
      fumbleRecovery: null,
      fumbleRecoverySemi: false,
      discipline: null,
      disciplineSemi: false,
    },
    specialTeams: {
      kickReturn: null,
      kickReturnSemi: false,
      puntReturn: null,
      puntReturnSemi: false,
    },
  };
}

/** Create empty kicking */
export function emptyKicking(): TeamKicking {
  return { fgRange: "", xpRange: "" };
}

/**
 * Step 9: Offense Scoring — CDV teams get PROLIFIC, CDV get DULL, rest neutral.
 * Returns array of indices for PROLIFIC and DULL teams.
 */
export function drawOffenseScoring(
  teamCount: number,
  cdv: number
): { prolific: number[]; dull: number[] } {
  const result = pairedCardDraw(teamCount, cdv);
  return { prolific: result.positive, dull: result.negative };
}

/**
 * Step 9A-D: Roll on Table C for each PROLIFIC/DULL team.
 * Returns offense profile result based on scoring type.
 */
export function rollOffenseProfile(
  roll: DiceResult,
  scoring: "PROLIFIC" | "DULL",
  semi: boolean
): OffenseProfileResult {
  if (scoring === "PROLIFIC") {
    return semi
      ? lookupTable(roll, TABLE_C_OFFENSE_PROLIFIC_SEMI)
      : lookupTable(roll, TABLE_C_OFFENSE_PROLIFIC);
  }
  return semi
    ? lookupTable(roll, TABLE_C_OFFENSE_DULL_SEMI)
    : lookupTable(roll, TABLE_C_OFFENSE_DULL);
}

/**
 * Step 10: Draw offense quality pairs.
 * Each pair: CDV teams get positive, CDV teams get negative.
 */
export interface QualityPairDraw {
  positive: number[];
  negative: number[];
}

export function drawOffenseQualityPairs(
  teamCount: number,
  cdv: number
): {
  ballSecurity: QualityPairDraw; // RELIABLE / SHAKY
  fumbles: QualityPairDraw; // SECURE / CLUMSY
  discipline: QualityPairDraw; // DISCIPLINED / UNDISCIPLINED
} {
  return {
    ballSecurity: pairedCardDraw(teamCount, cdv),
    fumbles: pairedCardDraw(teamCount, cdv),
    discipline: pairedCardDraw(teamCount, cdv),
  };
}

/**
 * Step 11: EFFICIENT / INEFFICIENT.
 * 2×QV teams get EFFICIENT, QV teams get S-EFFICIENT (super).
 * Coach Grade modifies: A/B coaches can improve; D/F coaches can worsen.
 */
export function drawClockManagement(
  teamCount: number,
  qv: number
): {
  efficient: number[];
  superEfficient: number[];
  inefficient: number[];
  superInefficient: number[];
} {
  // Shuffle indices
  const indices = Array.from({ length: teamCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  let pos = 0;
  const superEfficient = indices.slice(pos, pos + qv);
  pos += qv;
  const efficient = indices.slice(pos, pos + qv * 2);
  pos += qv * 2;
  const superInefficient = indices.slice(pos, pos + qv);
  pos += qv;
  const inefficient = indices.slice(pos, pos + qv * 2);

  return { efficient, superEfficient, inefficient, superInefficient };
}

/**
 * Step 12: Defense Scoring — CDV teams get STAUNCH, CDV get INEPT, rest neutral.
 */
export function drawDefenseScoring(
  teamCount: number,
  cdv: number
): { staunch: number[]; inept: number[] } {
  const result = pairedCardDraw(teamCount, cdv);
  return { staunch: result.positive, inept: result.negative };
}

/**
 * Step 12A-D: Roll on Table D for each STAUNCH/INEPT team.
 */
export function rollDefenseProfile(
  roll: DiceResult,
  scoring: "STAUNCH" | "INEPT",
  semi: boolean
): DefenseProfileResult {
  if (scoring === "STAUNCH") {
    return semi
      ? lookupTable(roll, TABLE_D_DEFENSE_STAUNCH_SEMI)
      : lookupTable(roll, TABLE_D_DEFENSE_STAUNCH);
  }
  return semi
    ? lookupTable(roll, TABLE_D_DEFENSE_INEPT_SEMI)
    : lookupTable(roll, TABLE_D_DEFENSE_INEPT);
}

/**
 * Step 13: Draw defense quality pairs.
 */
export function drawDefenseQualityPairs(
  teamCount: number,
  cdv: number
): {
  coverage: QualityPairDraw; // AGGRESSIVE / MEEK
  fumbleRecovery: QualityPairDraw; // ACTIVE / PASSIVE
  discipline: QualityPairDraw; // DISCIPLINED / UNDISCIPLINED
} {
  return {
    coverage: pairedCardDraw(teamCount, cdv),
    fumbleRecovery: pairedCardDraw(teamCount, cdv),
    discipline: pairedCardDraw(teamCount, cdv),
  };
}

/**
 * Step 14: Special Teams — roll Table E for each team.
 */
export function rollSpecialTeams(
  krRoll: DiceResult,
  prRoll: DiceResult,
  fgRoll: DiceResult,
  xpRoll: DiceResult,
  xpFrom2YardLine: boolean
): {
  kickReturn: { electric: boolean; semi: boolean };
  puntReturn: { electric: boolean; semi: boolean };
  fgRange: string;
  xpRange: string;
} {
  return {
    kickReturn: lookupTable(krRoll, TABLE_E_KICK_RETURN),
    puntReturn: lookupTable(prRoll, TABLE_E_PUNT_RETURN),
    fgRange: lookupTable(fgRoll, TABLE_E_FG_RANGE),
    xpRange: xpFrom2YardLine
      ? lookupTable(xpRoll, TABLE_E_XP_RANGE_2YD)
      : lookupTable(xpRoll, TABLE_E_XP_RANGE),
  };
}

/** Step 14 helper: Roll scoring tendency (1d6) */
export function rollScoringTendency(roll: number): "P+" | "P" | null | "R" | "R+" {
  return lookupSimpleTable(roll, SCORING_TENDENCY_TABLE);
}

// ============================================================
// Apply qualities to a TeamQualities object
// ============================================================

export function applyOffenseScoring(
  q: TeamQualities,
  scoring: "PROLIFIC" | "DULL" | null,
  semi: boolean
): TeamQualities {
  return {
    ...q,
    offense: { ...q.offense, scoring, scoringSemi: semi },
  };
}

export function applyOffenseProfile(
  q: TeamQualities,
  profile: OffenseProfileResult
): TeamQualities {
  return {
    ...q,
    offense: {
      ...q.offense,
      yards: profile.yards ?? q.offense.yards,
      yardsSemi: profile.yardsSemi ?? q.offense.yardsSemi,
      protection: profile.protection ?? q.offense.protection,
      protectionSemi: profile.protectionSemi ?? q.offense.protectionSemi,
    },
  };
}

export function applyDefenseScoring(
  q: TeamQualities,
  scoring: "STAUNCH" | "INEPT" | null,
  semi: boolean
): TeamQualities {
  return {
    ...q,
    defense: { ...q.defense, scoring, scoringSemi: semi },
  };
}

export function applyDefenseProfile(
  q: TeamQualities,
  profile: DefenseProfileResult
): TeamQualities {
  return {
    ...q,
    defense: {
      ...q.defense,
      yards: profile.yards ?? q.defense.yards,
      yardsSemi: profile.yardsSemi ?? q.defense.yardsSemi,
      passRush: profile.passRush ?? q.defense.passRush,
      passRushSemi: profile.passRushSemi ?? q.defense.passRushSemi,
    },
  };
}

export function applySpecialTeams(
  q: TeamQualities,
  st: {
    kickReturn: { electric: boolean; semi: boolean };
    puntReturn: { electric: boolean; semi: boolean };
  }
): TeamQualities {
  return {
    ...q,
    specialTeams: {
      kickReturn: st.kickReturn.electric ? "ELECTRIC" : null,
      kickReturnSemi: st.kickReturn.semi,
      puntReturn: st.puntReturn.electric ? "ELECTRIC" : null,
      puntReturnSemi: st.puntReturn.semi,
    },
  };
}

// ============================================================
// Off-Season — Steps 1-8
// ============================================================

/** Step 1: Coach Grade Adjustment */
export function adjustCoachGrade(
  grade: HeadCoachGrade,
  outcome: "champion" | "winning" | "losing"
): HeadCoachGrade {
  const adj = COACH_GRADE_ADJUSTMENTS[outcome];
  return adjustGrade(grade, adj.gradeChange, adj.minGrade as HeadCoachGrade, adj.maxGrade as HeadCoachGrade);
}

/** Step 2: Check Hot Seat — remove hot seat if winning season */
export function checkHotSeat(
  classicData: ClassicTeamData,
  hadWinningSeason: boolean
): ClassicTeamData {
  if (hadWinningSeason && classicData.hotSeat) {
    return { ...classicData, hotSeat: false };
  }
  return classicData;
}

/** Step 3: Coaching Carousel (1d6) */
export function processCoachingCarousel(
  classicData: ClassicTeamData,
  roll: number
): {
  classicData: ClassicTeamData;
  fired: boolean;
  narrative: string;
} {
  const result = lookupSimpleTable(roll, TABLE_F_COACHING_CAROUSEL);

  if (classicData.hotSeat && result.hotSeatFired) {
    return {
      classicData: { ...classicData, hotSeat: false, headCoachName: "", headCoachGrade: "C" as HeadCoachGrade },
      fired: true,
      narrative: "Head Coach on the Hot Seat — He's Fired!",
    };
  }

  const gradeOk =
    result.hotSeatCondition === "D_OR_F"
      ? classicData.headCoachGrade === "D" || classicData.headCoachGrade === "F"
      : classicData.headCoachGrade === "F";

  if (!classicData.hotSeat && gradeOk && result.newHotSeat) {
    return {
      classicData: { ...classicData, hotSeat: true },
      fired: false,
      narrative: `Coach (Grade ${classicData.headCoachGrade}) placed on the Hot Seat.`,
    };
  }

  return {
    classicData,
    fired: false,
    narrative: "No coaching changes.",
  };
}

/** Step 4: Calculate Off-Season Franchise Points */
export function calculateOffSeasonFP(
  foGrade: FrontOfficeGrade,
  coachGrade: HeadCoachGrade
): number {
  return FP_MATRIX[foGrade][coachGrade];
}

/** Step 4b: Calculate Bonus FP from standings */
export function calculateBonusFP(
  standingPct: number,
  teamCount: number,
  rank: number
): number {
  if (rank === teamCount) return 3; // Worst record
  if (rank > teamCount * 0.85) return 2; // Bottom 15%
  if (rank > teamCount * 0.7) return 1; // Bottom 30%
  return 0;
}

/** Step 5: Ownership Impact (2d6) */
export function processOwnershipImpact(
  classicData: ClassicTeamData,
  roll: DiceResult
): {
  classicData: ClassicTeamData;
  result: OwnershipImpactResult;
  applied: boolean;
  narrative: string;
} {
  const entry = lookupTable(roll, TABLE_B_OWNERSHIP_IMPACT);
  const own = classicData.ownership;

  // Check if should be ignored
  if (entry.ignoreCondition === "SAVVY" && own.competence === "SAVVY") {
    return { classicData, result: entry, applied: false, narrative: `${entry.narrative} (Ignored — SAVVY ownership)` };
  }
  if (entry.ignoreCondition === "SELFISH" && own.loyalty === "SELFISH") {
    return { classicData, result: entry, applied: false, narrative: `${entry.narrative} (Ignored — SELFISH ownership)` };
  }

  // Check condition
  let conditionMet = true;
  if (entry.condition) {
    switch (entry.condition) {
      case "MEDDLING": conditionMet = own.competence === "MEDDLING"; break;
      case "SELFISH": conditionMet = own.loyalty === "SELFISH"; break;
      case "SAVVY": conditionMet = own.competence === "SAVVY"; break;
      case "LOYAL": conditionMet = own.loyalty === "LOYAL"; break;
      case "MEDDLING_OR_SELFISH": conditionMet = own.competence === "MEDDLING" || own.loyalty === "SELFISH"; break;
      case "SAVVY_OR_LOYAL": conditionMet = own.competence === "SAVVY" || own.loyalty === "LOYAL"; break;
      case "NOT_SAVVY": conditionMet = own.competence !== "SAVVY"; break;
      case "NOT_SELFISH": conditionMet = own.loyalty !== "SELFISH"; break;
    }
  }

  if (!conditionMet) {
    return { classicData, result: entry, applied: false, narrative: `${entry.narrative} (Condition not met)` };
  }

  // Apply effects
  let updated = { ...classicData };
  updated.franchisePoints += entry.fpChange;
  if (entry.ownershipChange) {
    updated = {
      ...updated,
      ownership: {
        ...updated.ownership,
        ...(entry.ownershipChange.loyalty ? { loyalty: entry.ownershipChange.loyalty } : {}),
        ...(entry.ownershipChange.competence ? { competence: entry.ownershipChange.competence } : {}),
      },
    };
  }
  if (entry.foGradeSet) {
    updated.frontOfficeGrade = entry.foGradeSet;
  }

  return {
    classicData: updated,
    result: entry,
    applied: true,
    narrative: `${entry.narrative} (FP ${entry.fpChange >= 0 ? "+" : ""}${entry.fpChange})`,
  };
}

/** Steps 6-7: Annual Draft Offense/Defense */
export function getOffenseDraftProfile(q: TeamQualities): OffenseDraftProfile {
  if (q.offense.scoring === "PROLIFIC") return q.offense.scoringSemi ? "PROLIFIC_SEMI" : "PROLIFIC";
  if (q.offense.scoring === "DULL") return q.offense.scoringSemi ? "DULL_SEMI" : "DULL";
  return "NEUTRAL";
}

export function getDefenseDraftProfile(q: TeamQualities): DefenseDraftProfile {
  if (q.defense.scoring === "STAUNCH") return q.defense.scoringSemi ? "STAUNCH_SEMI" : "STAUNCH";
  if (q.defense.scoring === "INEPT") return q.defense.scoringSemi ? "INEPT_SEMI" : "INEPT";
  return "NEUTRAL";
}

export function rollAnnualDraftOffense(
  roll: DiceResult,
  profile: OffenseDraftProfile
): { scoringChange: "improve" | "diminish" | null; tendencyShift: "pass" | "run" | null; narrative: string } {
  const table = TABLE_J_ANNUAL_DRAFT_OFFENSE[profile];
  return lookupTable(roll, table);
}

export function rollAnnualDraftDefense(
  roll: DiceResult,
  profile: DefenseDraftProfile
): { scoringChange: "improve" | "diminish" | null; narrative: string } {
  const table = TABLE_L_ANNUAL_DRAFT_DEFENSE[profile];
  return lookupTable(roll, table);
}

/** Apply scoring change from annual draft */
export function applyScoringChange(
  current: "PROLIFIC" | "DULL" | null,
  currentSemi: boolean,
  change: "improve" | "diminish"
): { scoring: "PROLIFIC" | "DULL" | null; semi: boolean } {
  // Levels: DULL → DULL_SEMI → neutral → PROLIFIC_SEMI → PROLIFIC
  const levels: { scoring: "PROLIFIC" | "DULL" | null; semi: boolean }[] = [
    { scoring: "DULL", semi: false },
    { scoring: "DULL", semi: true },
    { scoring: null, semi: false },
    { scoring: "PROLIFIC", semi: true },
    { scoring: "PROLIFIC", semi: false },
  ];

  let idx = levels.findIndex(
    (l) => l.scoring === current && l.semi === currentSemi
  );
  if (idx === -1) idx = 2; // neutral

  if (change === "improve") idx = Math.min(idx + 1, levels.length - 1);
  else idx = Math.max(idx - 1, 0);

  return levels[idx];
}

/** Same for defense */
export function applyDefenseScoringChange(
  current: "STAUNCH" | "INEPT" | null,
  currentSemi: boolean,
  change: "improve" | "diminish"
): { scoring: "STAUNCH" | "INEPT" | null; semi: boolean } {
  const levels: { scoring: "STAUNCH" | "INEPT" | null; semi: boolean }[] = [
    { scoring: "INEPT", semi: false },
    { scoring: "INEPT", semi: true },
    { scoring: null, semi: false },
    { scoring: "STAUNCH", semi: true },
    { scoring: "STAUNCH", semi: false },
  ];

  let idx = levels.findIndex(
    (l) => l.scoring === current && l.semi === currentSemi
  );
  if (idx === -1) idx = 2;

  if (change === "improve") idx = Math.min(idx + 1, levels.length - 1);
  else idx = Math.max(idx - 1, 0);

  return levels[idx];
}

// ============================================================
// Training Camp — Steps 7-9
// ============================================================

/** FO Grade Adjustment based on Draft results */
export function adjustFOGrade(
  foGrade: FrontOfficeGrade,
  offenseChanged: "improve" | "diminish" | null,
  defenseChanged: "improve" | "diminish" | null
): FrontOfficeGrade {
  const bothImproved = offenseChanged === "improve" && defenseChanged === "improve";
  const bothDiminished = offenseChanged === "diminish" && defenseChanged === "diminish";
  const oneImproved =
    (offenseChanged === "improve" && defenseChanged !== "diminish") ||
    (defenseChanged === "improve" && offenseChanged !== "diminish");
  const oneDiminished =
    (offenseChanged === "diminish" && defenseChanged !== "improve") ||
    (defenseChanged === "diminish" && offenseChanged !== "improve");

  if (bothImproved) return adjustGrade(foGrade, 2);
  if (oneImproved) return adjustGrade(foGrade, 1);
  if (bothDiminished) return adjustGrade(foGrade, -2);
  if (oneDiminished) return adjustGrade(foGrade, -1);
  return foGrade;
}

// ============================================================
// Breaking News
// ============================================================

/** Check if Breaking News occurs (1d6: 5-6 = yes) */
export function checkBreakingNews(roll: number): boolean {
  return roll >= 5;
}

/** Determine Breaking News type (1d6: 1-4 = injury, 5-6 = improvement) */
export function getBreakingNewsType(roll: number): "injury" | "improvement" {
  return roll <= 4 ? "injury" : "improvement";
}

/** Process Breaking News Injury */
export function processBreakingNewsInjury(roll: DiceResult) {
  return lookupTable(roll, TABLE_N_INJURY);
}

/** Process Breaking News Improvement */
export function processBreakingNewsImprovement(roll: DiceResult) {
  return lookupTable(roll, TABLE_O_IMPROVEMENT);
}

// ============================================================
// Unexpected Events (Table U)
// ============================================================

export function processUnexpectedEvent(roll: DiceResult) {
  return lookupTable(roll, TABLE_U_UNEXPECTED_EVENTS);
}

/** Check Franchise Movement (SELFISH ownership only, 2d6) */
export function checkFranchiseMovement(
  roll: DiceResult,
  isSelfish: boolean
): { event: "sale" | "relocation" | null; narrative: string } {
  if (!isSelfish) return { event: null, narrative: "" };
  if (roll === "11") return { event: "sale", narrative: "Owner sells the team!" };
  if (roll === "66") return { event: "relocation", narrative: "Team relocates to a new city!" };
  return { event: null, narrative: "No franchise movement." };
}

// ============================================================
// FP Spending
// ============================================================

export function spendFP(
  classicData: ClassicTeamData,
  cost: number
): ClassicTeamData | null {
  if (classicData.franchisePoints < cost) return null;
  return {
    ...classicData,
    franchisePoints: classicData.franchisePoints - cost,
  };
}

// ============================================================
// Auto-Generate a complete team (for quick setup)
// ============================================================

export function autoGenerateClassicTeamData(): ClassicTeamData {
  const ownership = createOwnership(randomD6(), randomD6());
  const foGrade = createFrontOfficeGrade(randomD6());
  const coachGrade = createHeadCoachGrade(
    randomDiceResult(),
    foGrade,
    ownership.competence
  );
  const fp = calculateFranchisePoints(foGrade, coachGrade);

  return {
    ownership,
    frontOfficeGrade: foGrade,
    headCoachGrade: coachGrade,
    headCoachName: "",
    franchisePoints: fp,
    hotSeat: false,
    seasonsWithCoach: 0,
    consecutiveLosingSeasons: 0,
    hasWonChampionship: false,
  };
}

export function autoGenerateTeamQualities(xpFrom2YardLine: boolean): {
  qualities: TeamQualities;
  kicking: TeamKicking;
} {
  const q = emptyQualities();

  // Offense scoring: 1d6 to decide (1-2 = PROLIFIC_SEMI, 3-4 = neutral, 5-6 = DULL_SEMI)
  // Simplified auto-gen since card-draw is for multi-team context
  const offRoll = randomD6();
  let offQ = q;
  if (offRoll <= 1) {
    offQ = applyOffenseScoring(q, "PROLIFIC", false);
    const profile = rollOffenseProfile(randomDiceResult(), "PROLIFIC", false);
    offQ = applyOffenseProfile(offQ, profile);
  } else if (offRoll <= 3) {
    offQ = applyOffenseScoring(q, "PROLIFIC", true);
    const profile = rollOffenseProfile(randomDiceResult(), "PROLIFIC", true);
    offQ = applyOffenseProfile(offQ, profile);
  } else if (offRoll <= 5) {
    offQ = applyOffenseScoring(q, "DULL", true);
    const profile = rollOffenseProfile(randomDiceResult(), "DULL", true);
    offQ = applyOffenseProfile(offQ, profile);
  } else {
    offQ = applyOffenseScoring(q, "DULL", false);
    const profile = rollOffenseProfile(randomDiceResult(), "DULL", false);
    offQ = applyOffenseProfile(offQ, profile);
  }

  // Offense qualities
  const bsRoll = randomD6();
  offQ = {
    ...offQ,
    offense: {
      ...offQ.offense,
      ballSecurity: bsRoll <= 2 ? "RELIABLE" : bsRoll >= 5 ? "SHAKY" : null,
      ballSecuritySemi: bsRoll === 2 || bsRoll === 5,
      fumbles: randomD6() <= 2 ? "SECURE" : randomD6() >= 5 ? "CLUMSY" : null,
      fumblesSemi: false,
      discipline: randomD6() <= 2 ? "DISCIPLINED" : randomD6() >= 5 ? "UNDISCIPLINED" : null,
      disciplineSemi: false,
      clockManagement: randomD6() <= 2 ? "EFFICIENT" : randomD6() >= 5 ? "INEFFICIENT" : null,
      clockManagementLevel: randomD6() <= 2 ? "full" : randomD6() >= 5 ? "full" : null,
      scoringTendency: rollScoringTendency(randomD6()),
    },
  };

  // Defense scoring
  const defRoll = randomD6();
  let defQ = offQ;
  if (defRoll <= 1) {
    defQ = applyDefenseScoring(offQ, "STAUNCH", false);
    const profile = rollDefenseProfile(randomDiceResult(), "STAUNCH", false);
    defQ = applyDefenseProfile(defQ, profile);
  } else if (defRoll <= 3) {
    defQ = applyDefenseScoring(offQ, "STAUNCH", true);
    const profile = rollDefenseProfile(randomDiceResult(), "STAUNCH", true);
    defQ = applyDefenseProfile(defQ, profile);
  } else if (defRoll <= 5) {
    defQ = applyDefenseScoring(offQ, "INEPT", true);
    const profile = rollDefenseProfile(randomDiceResult(), "INEPT", true);
    defQ = applyDefenseProfile(defQ, profile);
  } else {
    defQ = applyDefenseScoring(offQ, "INEPT", false);
    const profile = rollDefenseProfile(randomDiceResult(), "INEPT", false);
    defQ = applyDefenseProfile(defQ, profile);
  }

  // Defense qualities
  defQ = {
    ...defQ,
    defense: {
      ...defQ.defense,
      coverage: randomD6() <= 2 ? "AGGRESSIVE" : randomD6() >= 5 ? "MEEK" : null,
      coverageSemi: false,
      fumbleRecovery: randomD6() <= 2 ? "ACTIVE" : randomD6() >= 5 ? "PASSIVE" : null,
      fumbleRecoverySemi: false,
      discipline: randomD6() <= 2 ? "DISCIPLINED" : randomD6() >= 5 ? "UNDISCIPLINED" : null,
      disciplineSemi: false,
    },
  };

  // Special Teams
  const st = rollSpecialTeams(
    randomDiceResult(),
    randomDiceResult(),
    randomDiceResult(),
    randomDiceResult(),
    xpFrom2YardLine
  );
  const finalQ = applySpecialTeams(defQ, st);

  return {
    qualities: finalQ,
    kicking: { fgRange: st.fgRange, xpRange: st.xpRange },
  };
}
