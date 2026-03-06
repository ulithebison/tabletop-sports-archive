// ============================================================
// FDF Commissioner — Dice Tables (V1.5 Classic Mode)
// ============================================================
// All tables from the FDF Commissioner Expansion V1.5 PDF.
// Each table is a typed array of entries for use with dice-engine lookupTable().

import type { TableEntry, SimpleTableEntry } from "./dice-engine";
import type {
  FrontOfficeGrade,
  HeadCoachGrade,
  OwnershipLoyalty,
  OwnershipCompetence,
} from "./types";

// ============================================================
// Ownership Creation Tables (1d6 each)
// ============================================================

export const OWNERSHIP_COMPETENCE_TABLE: SimpleTableEntry<OwnershipCompetence>[] = [
  { min: 1, max: 1, result: "MEDDLING" },
  { min: 2, max: 5, result: "NEUTRAL" },
  { min: 6, max: 6, result: "SAVVY" },
];

export const OWNERSHIP_LOYALTY_TABLE: SimpleTableEntry<OwnershipLoyalty>[] = [
  { min: 1, max: 1, result: "SELFISH" },
  { min: 2, max: 5, result: "NEUTRAL" },
  { min: 6, max: 6, result: "LOYAL" },
];

// ============================================================
// Front Office Grade Creation Table (1d6)
// ============================================================

export const FO_GRADE_CREATION_TABLE: SimpleTableEntry<FrontOfficeGrade>[] = [
  { min: 1, max: 1, result: "D" },
  { min: 2, max: 3, result: "C" },
  { min: 4, max: 5, result: "B" },
  { min: 6, max: 6, result: "A" },
];

// ============================================================
// Table A — Head Coach Grade (2d6 tens+ones)
// Result depends on FO Grade and Ownership Competence.
// Each entry returns a function that takes (foGrade, ownership) and returns HeadCoachGrade.
// ============================================================

export type CoachGradeResolver = (
  foGrade: FrontOfficeGrade,
  ownership: OwnershipCompetence
) => HeadCoachGrade;

function foIs(grade: FrontOfficeGrade, ...targets: FrontOfficeGrade[]): boolean {
  return targets.includes(grade);
}

function foBetterOrEqual(grade: FrontOfficeGrade, threshold: FrontOfficeGrade): boolean {
  const order: FrontOfficeGrade[] = ["F", "D", "C", "B", "A"];
  return order.indexOf(grade) >= order.indexOf(threshold);
}

function foWorseOrEqual(grade: FrontOfficeGrade, threshold: FrontOfficeGrade): boolean {
  const order: FrontOfficeGrade[] = ["F", "D", "C", "B", "A"];
  return order.indexOf(grade) <= order.indexOf(threshold);
}

export const TABLE_A_HEAD_COACH_GRADE: TableEntry<CoachGradeResolver>[] = [
  { min: "11", max: "11", result: (fo, own) => own === "SAVVY" ? "B" : "D" },
  { min: "12", max: "12", result: (fo) => foIs(fo, "A") ? "C" : "D" },
  { min: "13", max: "13", result: (fo) => foBetterOrEqual(fo, "B") ? "C" : "D" },
  { min: "14", max: "14", result: (_fo, own) => own === "SAVVY" ? "A" : "C" },
  { min: "15", max: "15", result: () => "C" },
  { min: "16", max: "16", result: (fo) => foWorseOrEqual(fo, "C") ? "D" : "C" },
  { min: "22", max: "22", result: () => "C" },
  { min: "23", max: "23", result: (fo) => foIs(fo, "A") ? "B" : "C" },
  { min: "24", max: "24", result: (fo) => foIs(fo, "D", "F") ? "D" : "C" },
  { min: "25", max: "25", result: (fo) => foBetterOrEqual(fo, "B") ? "B" : "C" },
  { min: "26", max: "26", result: (_fo, own) => own === "MEDDLING" ? "D" : "B" },
  { min: "33", max: "33", result: () => "B" },
  { min: "34", max: "34", result: (fo) => foIs(fo, "A") ? "A" : "B" },
  { min: "35", max: "35", result: (fo) => foIs(fo, "D", "F") ? "C" : "B" },
  { min: "36", max: "36", result: () => "B" },
  { min: "44", max: "44", result: (_fo, own) => own === "MEDDLING" ? "C" : "A" },
  { min: "45", max: "45", result: () => "B" },
  { min: "46", max: "46", result: (fo) => foWorseOrEqual(fo, "C") ? "C" : "B" },
  { min: "55", max: "55", result: () => "A" },
  { min: "56", max: "56", result: (fo) => foIs(fo, "D", "F") ? "B" : "A" },
  { min: "66", max: "66", result: () => "A" },
];

// ============================================================
// Franchise Points Matrix (FO Grade × Coach Grade → FP)
// ============================================================

export const FRANCHISE_POINTS_MATRIX: Record<FrontOfficeGrade, Record<HeadCoachGrade, number>> = {
  A: { A: 12, B: 10, C: 8, D: 6, F: 4 },
  B: { A: 10, B: 8, C: 7, D: 5, F: 3 },
  C: { A: 8, B: 7, C: 6, D: 4, F: 2 },
  D: { A: 6, B: 5, C: 4, D: 3, F: 1 },
  F: { A: 4, B: 3, C: 2, D: 1, F: 0 },
};

// ============================================================
// QV/CDV Table (Team Count → Quality Values / Card Draw Values)
// ============================================================

export interface QVCDVEntry {
  qv: number;
  cdv: number;
}

export const QV_CDV_TABLE: { minTeams: number; maxTeams: number; qv: number; cdv: number }[] = [
  { minTeams: 8, maxTeams: 18, qv: 2, cdv: 1 },
  { minTeams: 19, maxTeams: 31, qv: 4, cdv: 2 },
  { minTeams: 32, maxTeams: 43, qv: 6, cdv: 3 },
  { minTeams: 44, maxTeams: 56, qv: 8, cdv: 4 },
];

export function getQVandCDV(teamCount: number): QVCDVEntry {
  for (const entry of QV_CDV_TABLE) {
    if (teamCount >= entry.minTeams && teamCount <= entry.maxTeams) {
      return { qv: entry.qv, cdv: entry.cdv };
    }
  }
  // Fallback for < 8 teams
  return { qv: 2, cdv: 1 };
}

// ============================================================
// Table B — Ownership Impact (2d6 tens+ones)
// Result: FP change + narrative + optional ownership change
// ============================================================

export interface OwnershipImpactResult {
  fpChange: number;
  narrative: string;
  ownershipChange?: {
    loyalty?: OwnershipLoyalty;
    competence?: OwnershipCompetence;
  };
  foGradeChange?: number; // e.g., -Infinity means "set to D"
  foGradeSet?: FrontOfficeGrade;
  condition?: "MEDDLING" | "SELFISH" | "SAVVY" | "LOYAL" | "MEDDLING_OR_SELFISH" | "SAVVY_OR_LOYAL" | "NOT_SAVVY" | "NOT_SELFISH" | null;
  ignoreCondition?: "SAVVY" | "SELFISH" | null;
}

export const TABLE_B_OWNERSHIP_IMPACT: TableEntry<OwnershipImpactResult>[] = [
  { min: "11", max: "11", result: { fpChange: -2, narrative: "Team signs overpriced, aging free-agent.", ignoreCondition: "SAVVY" } },
  { min: "12", max: "12", result: { fpChange: -2, narrative: "Ownership refuses to increase budget for player signings.", condition: "MEDDLING_OR_SELFISH" } },
  { min: "13", max: "13", result: { fpChange: -1, narrative: "Ownership stipulates Front Office re-draft board.", condition: "MEDDLING" } },
  { min: "14", max: "14", result: { fpChange: -1, narrative: "Ownership refuses to sign star free-agent.", condition: "SELFISH" } },
  { min: "15", max: "15", result: { fpChange: -1, narrative: "Ownership brings in consultant to help with draft.", condition: "MEDDLING" } },
  { min: "16", max: "16", result: { fpChange: -1, narrative: "Ownership interferes in off-season negotiations.", condition: "MEDDLING" } },
  { min: "22", max: "22", result: { fpChange: 0, narrative: "Ownership growing unhappy with city leaders.", ownershipChange: { loyalty: "SELFISH" }, condition: "MEDDLING" } },
  { min: "23", max: "23", result: { fpChange: -1, narrative: "Ownership refuses to improve locker room.", condition: "MEDDLING_OR_SELFISH" } },
  { min: "24", max: "24", result: { fpChange: 1, narrative: "Ownership invests in all-new training facilities." } },
  { min: "25", max: "25", result: { fpChange: -1, narrative: "Ownership forces GM to make unbalanced trade.", condition: "MEDDLING" } },
  { min: "26", max: "26", result: { fpChange: 1, narrative: "Ownership increases budget to keep talented coordinator.", condition: "SAVVY" } },
  { min: "33", max: "33", result: { fpChange: -2, narrative: "Ownership fires GM days before the draft!", foGradeSet: "D", condition: "SELFISH" } },
  { min: "34", max: "34", result: { fpChange: 1, narrative: "Ownership works with GM for extra first-round pick.", condition: "SAVVY" } },
  { min: "35", max: "35", result: { fpChange: -1, narrative: "Ownership brings in consultant for draft preparations.", condition: "LOYAL" } },
  { min: "36", max: "36", result: { fpChange: 1, narrative: "Ownership funds state-of-the-art analytics department.", condition: "SAVVY" } },
  { min: "44", max: "44", result: { fpChange: 2, narrative: "Ownership restructures star-QB contract, freeing cap-room.", condition: "SAVVY" } },
  { min: "45", max: "45", result: { fpChange: 1, narrative: "Ownership helps negotiate new deal with star-holdout.", condition: "SAVVY" } },
  { min: "46", max: "46", result: { fpChange: 1, narrative: "Ownership announces training facility upgrades.", condition: "SAVVY" } },
  { min: "55", max: "55", result: { fpChange: 0, narrative: "Ownership makes long-term commitment to city.", ownershipChange: { loyalty: "LOYAL" }, condition: "SAVVY" } },
  { min: "56", max: "56", result: { fpChange: 2, narrative: "Ownership agrees to expand budget for player signings.", condition: "SAVVY_OR_LOYAL" } },
  { min: "66", max: "66", result: { fpChange: 2, narrative: "Team signs young superstar looking for a second chance.", ignoreCondition: "SELFISH" } },
];

// ============================================================
// Table C — Offense Profile (2d6 tens+ones)
// 4 columns: PROLIFIC, PROLIFIC-SEMI, DULL, DULL-SEMI
// Each result is a partial quality set for offense
// ============================================================

export interface OffenseProfileResult {
  yards?: "DYNAMIC" | "ERRATIC" | null;
  yardsSemi?: boolean;
  protection?: "SOLID" | "POROUS" | null;
  protectionSemi?: boolean;
}

function opR(
  yards?: "DYNAMIC" | "ERRATIC" | null,
  yardsSemi?: boolean,
  protection?: "SOLID" | "POROUS" | null,
  protectionSemi?: boolean
): OffenseProfileResult {
  return { yards: yards ?? null, yardsSemi: yardsSemi ?? false, protection: protection ?? null, protectionSemi: protectionSemi ?? false };
}

export const TABLE_C_OFFENSE_PROLIFIC: TableEntry<OffenseProfileResult>[] = [
  { min: "11", max: "12", result: opR("DYNAMIC", false, "SOLID", false) },
  { min: "13", max: "14", result: opR("DYNAMIC", false, null, false) },
  { min: "15", max: "16", result: opR("DYNAMIC", true, "SOLID", true) },
  { min: "22", max: "23", result: opR("DYNAMIC", false, "POROUS", true) },
  { min: "24", max: "25", result: opR(null, false, "SOLID", false) },
  { min: "26", max: "33", result: opR("DYNAMIC", true, null, false) },
  { min: "34", max: "35", result: opR(null, false, "SOLID", true) },
  { min: "36", max: "44", result: opR(null, false, null, false) },
  { min: "45", max: "46", result: opR("ERRATIC", true, "SOLID", true) },
  { min: "55", max: "56", result: opR(null, false, "POROUS", true) },
  { min: "66", max: "66", result: opR("ERRATIC", true, "POROUS", true) },
];

export const TABLE_C_OFFENSE_PROLIFIC_SEMI: TableEntry<OffenseProfileResult>[] = [
  { min: "11", max: "12", result: opR("DYNAMIC", true, "SOLID", true) },
  { min: "13", max: "14", result: opR("DYNAMIC", true, null, false) },
  { min: "15", max: "16", result: opR("DYNAMIC", true, "POROUS", true) },
  { min: "22", max: "23", result: opR(null, false, "SOLID", true) },
  { min: "24", max: "25", result: opR(null, false, "SOLID", false) },
  { min: "26", max: "33", result: opR(null, false, null, false) },
  { min: "34", max: "44", result: opR(null, false, null, false) },
  { min: "45", max: "46", result: opR("ERRATIC", true, null, false) },
  { min: "55", max: "56", result: opR(null, false, "POROUS", true) },
  { min: "66", max: "66", result: opR("ERRATIC", true, "POROUS", true) },
];

export const TABLE_C_OFFENSE_DULL: TableEntry<OffenseProfileResult>[] = [
  { min: "11", max: "11", result: opR("ERRATIC", true, "POROUS", true) },
  { min: "12", max: "13", result: opR("ERRATIC", true, "POROUS", false) },
  { min: "14", max: "15", result: opR(null, false, "POROUS", false) },
  { min: "16", max: "22", result: opR("ERRATIC", true, null, false) },
  { min: "23", max: "24", result: opR("ERRATIC", false, null, false) },
  { min: "25", max: "33", result: opR(null, false, "POROUS", true) },
  { min: "34", max: "35", result: opR(null, false, null, false) },
  { min: "36", max: "44", result: opR(null, false, null, false) },
  { min: "45", max: "55", result: opR("DYNAMIC", true, "POROUS", true) },
  { min: "56", max: "56", result: opR(null, false, "SOLID", true) },
  { min: "66", max: "66", result: opR("DYNAMIC", true, "SOLID", true) },
];

export const TABLE_C_OFFENSE_DULL_SEMI: TableEntry<OffenseProfileResult>[] = [
  { min: "11", max: "12", result: opR("ERRATIC", true, "POROUS", true) },
  { min: "13", max: "14", result: opR("ERRATIC", true, null, false) },
  { min: "15", max: "16", result: opR(null, false, "POROUS", true) },
  { min: "22", max: "23", result: opR("ERRATIC", true, "SOLID", true) },
  { min: "24", max: "33", result: opR(null, false, null, false) },
  { min: "34", max: "35", result: opR(null, false, null, false) },
  { min: "36", max: "44", result: opR("DYNAMIC", true, null, false) },
  { min: "45", max: "55", result: opR(null, false, "SOLID", true) },
  { min: "56", max: "56", result: opR("DYNAMIC", true, "POROUS", true) },
  { min: "66", max: "66", result: opR("DYNAMIC", true, "SOLID", true) },
];

// ============================================================
// Table D — Defense Profile (2d6 tens+ones)
// 4 columns: STAUNCH, STAUNCH-SEMI, INEPT, INEPT-SEMI
// ============================================================

export interface DefenseProfileResult {
  yards?: "STIFF" | "SOFT" | null;
  yardsSemi?: boolean;
  passRush?: "PUNISHING" | "MILD" | null;
  passRushSemi?: boolean;
}

function dpR(
  yards?: "STIFF" | "SOFT" | null,
  yardsSemi?: boolean,
  passRush?: "PUNISHING" | "MILD" | null,
  passRushSemi?: boolean
): DefenseProfileResult {
  return { yards: yards ?? null, yardsSemi: yardsSemi ?? false, passRush: passRush ?? null, passRushSemi: passRushSemi ?? false };
}

export const TABLE_D_DEFENSE_STAUNCH: TableEntry<DefenseProfileResult>[] = [
  { min: "11", max: "12", result: dpR("STIFF", false, "PUNISHING", false) },
  { min: "13", max: "14", result: dpR("STIFF", false, null, false) },
  { min: "15", max: "16", result: dpR("STIFF", true, "PUNISHING", true) },
  { min: "22", max: "23", result: dpR("STIFF", false, "MILD", true) },
  { min: "24", max: "25", result: dpR(null, false, "PUNISHING", false) },
  { min: "26", max: "33", result: dpR("STIFF", true, null, false) },
  { min: "34", max: "35", result: dpR(null, false, "PUNISHING", true) },
  { min: "36", max: "44", result: dpR(null, false, null, false) },
  { min: "45", max: "46", result: dpR("SOFT", true, "PUNISHING", true) },
  { min: "55", max: "56", result: dpR(null, false, "MILD", true) },
  { min: "66", max: "66", result: dpR("SOFT", true, "MILD", true) },
];

export const TABLE_D_DEFENSE_STAUNCH_SEMI: TableEntry<DefenseProfileResult>[] = [
  { min: "11", max: "12", result: dpR("STIFF", true, "PUNISHING", true) },
  { min: "13", max: "14", result: dpR("STIFF", true, null, false) },
  { min: "15", max: "16", result: dpR("STIFF", true, "MILD", true) },
  { min: "22", max: "23", result: dpR(null, false, "PUNISHING", true) },
  { min: "24", max: "25", result: dpR(null, false, "PUNISHING", false) },
  { min: "26", max: "33", result: dpR(null, false, null, false) },
  { min: "34", max: "44", result: dpR(null, false, null, false) },
  { min: "45", max: "46", result: dpR("SOFT", true, null, false) },
  { min: "55", max: "56", result: dpR(null, false, "MILD", true) },
  { min: "66", max: "66", result: dpR("SOFT", true, "MILD", true) },
];

export const TABLE_D_DEFENSE_INEPT: TableEntry<DefenseProfileResult>[] = [
  { min: "11", max: "11", result: dpR("SOFT", true, "MILD", true) },
  { min: "12", max: "13", result: dpR("SOFT", true, "MILD", false) },
  { min: "14", max: "15", result: dpR(null, false, "MILD", false) },
  { min: "16", max: "22", result: dpR("SOFT", true, null, false) },
  { min: "23", max: "24", result: dpR("SOFT", false, null, false) },
  { min: "25", max: "33", result: dpR(null, false, "MILD", true) },
  { min: "34", max: "35", result: dpR(null, false, null, false) },
  { min: "36", max: "44", result: dpR(null, false, null, false) },
  { min: "45", max: "55", result: dpR("STIFF", true, "MILD", true) },
  { min: "56", max: "56", result: dpR(null, false, "PUNISHING", true) },
  { min: "66", max: "66", result: dpR("STIFF", true, "PUNISHING", true) },
];

export const TABLE_D_DEFENSE_INEPT_SEMI: TableEntry<DefenseProfileResult>[] = [
  { min: "11", max: "12", result: dpR("SOFT", true, "MILD", true) },
  { min: "13", max: "14", result: dpR("SOFT", true, null, false) },
  { min: "15", max: "16", result: dpR(null, false, "MILD", true) },
  { min: "22", max: "23", result: dpR("SOFT", true, "PUNISHING", true) },
  { min: "24", max: "33", result: dpR(null, false, null, false) },
  { min: "34", max: "35", result: dpR(null, false, null, false) },
  { min: "36", max: "44", result: dpR("STIFF", true, null, false) },
  { min: "45", max: "55", result: dpR(null, false, "PUNISHING", true) },
  { min: "56", max: "56", result: dpR("STIFF", true, "MILD", true) },
  { min: "66", max: "66", result: dpR("STIFF", true, "PUNISHING", true) },
];

// ============================================================
// Table E — Special Teams (2d6 tens+ones)
// ============================================================

// Kick Return: ELECTRIC or null
export const TABLE_E_KICK_RETURN: TableEntry<{ electric: boolean; semi: boolean }>[] = [
  { min: "11", max: "55", result: { electric: false, semi: false } },
  { min: "56", max: "56", result: { electric: true, semi: true } },
  { min: "66", max: "66", result: { electric: true, semi: false } },
];

// Punt Return: ELECTRIC or null
export const TABLE_E_PUNT_RETURN: TableEntry<{ electric: boolean; semi: boolean }>[] = [
  { min: "11", max: "44", result: { electric: false, semi: false } },
  { min: "45", max: "55", result: { electric: true, semi: true } },
  { min: "56", max: "66", result: { electric: true, semi: false } },
];

// FG Success Range
export const TABLE_E_FG_RANGE: TableEntry<string>[] = [
  { min: "11", max: "12", result: "11-45" },
  { min: "13", max: "14", result: "11-46" },
  { min: "15", max: "16", result: "11-51" },
  { min: "22", max: "23", result: "11-52" },
  { min: "24", max: "25", result: "11-53" },
  { min: "26", max: "33", result: "11-54" },
  { min: "34", max: "35", result: "11-55" },
  { min: "36", max: "44", result: "11-56" },
  { min: "45", max: "46", result: "11-61" },
  { min: "55", max: "56", result: "11-62" },
  { min: "66", max: "66", result: "11-65" },
];

// XP Success Range
export const TABLE_E_XP_RANGE: TableEntry<string>[] = [
  { min: "11", max: "11", result: "11-56" },
  { min: "12", max: "13", result: "11-61" },
  { min: "14", max: "22", result: "11-62" },
  { min: "23", max: "33", result: "11-63" },
  { min: "34", max: "44", result: "11-64" },
  { min: "45", max: "55", result: "11-65" },
  { min: "56", max: "66", result: "11-66" },
];

// XP Success Range (2-yard line era)
export const TABLE_E_XP_RANGE_2YD: TableEntry<string>[] = [
  { min: "11", max: "13", result: "11-63" },
  { min: "14", max: "25", result: "11-64" },
  { min: "26", max: "44", result: "11-65" },
  { min: "45", max: "66", result: "11-66" },
];

// ============================================================
// Table F — Coaching Carousel (1d6)
// ============================================================

export interface CoachingCarouselResult {
  hotSeatFired: boolean;    // If on hot seat, fired
  newHotSeat: boolean;      // If not on hot seat, put on hot seat
  hotSeatCondition: "D_OR_F" | "F_ONLY"; // Grade condition for new hot seat
}

export const TABLE_F_COACHING_CAROUSEL: SimpleTableEntry<CoachingCarouselResult>[] = [
  { min: 1, max: 1, result: { hotSeatFired: true, newHotSeat: true, hotSeatCondition: "D_OR_F" } },
  { min: 2, max: 2, result: { hotSeatFired: true, newHotSeat: true, hotSeatCondition: "D_OR_F" } },
  { min: 3, max: 3, result: { hotSeatFired: true, newHotSeat: true, hotSeatCondition: "F_ONLY" } },
  { min: 4, max: 4, result: { hotSeatFired: false, newHotSeat: true, hotSeatCondition: "D_OR_F" } },
  { min: 5, max: 5, result: { hotSeatFired: false, newHotSeat: true, hotSeatCondition: "D_OR_F" } },
  { min: 6, max: 6, result: { hotSeatFired: false, newHotSeat: true, hotSeatCondition: "F_ONLY" } },
];

// ============================================================
// Table G — Special Results (1d6 per category)
// Used during actual gameplay for special card results
// ============================================================

export interface SpecialResultEntry {
  roll: number;
  result: string;
}

export const TABLE_G_PROLIFIC_OFFENSE: SpecialResultEntry[] = [
  { roll: 1, result: "Automatic TD PASS" },
  { roll: 2, result: "Automatic TD PASS" },
  { roll: 3, result: "Automatic TD PASS" },
  { roll: 4, result: "Re-roll drive result" },
  { roll: 5, result: "Re-roll drive result" },
  { roll: 6, result: "Automatic TD RUN" },
];

export const TABLE_G_DULL_OFFENSE: SpecialResultEntry[] = [
  { roll: 1, result: "Re-roll drive result" },
  { roll: 2, result: "Re-roll drive result" },
  { roll: 3, result: "Automatic PUNT" },
  { roll: 4, result: "Automatic PUNT" },
  { roll: 5, result: "Automatic PUNT" },
  { roll: 6, result: "Automatic PUNT" },
];

export const TABLE_G_STAUNCH_DEFENSE: SpecialResultEntry[] = [
  { roll: 1, result: "Automatic PUNT" },
  { roll: 2, result: "Automatic PUNT" },
  { roll: 3, result: "Automatic PUNT" },
  { roll: 4, result: "Automatic PUNT" },
  { roll: 5, result: "Re-roll drive result" },
  { roll: 6, result: "Re-roll drive result" },
];

export const TABLE_G_INEPT_DEFENSE: SpecialResultEntry[] = [
  { roll: 1, result: "Automatic TD PASS" },
  { roll: 2, result: "Automatic TD PASS" },
  { roll: 3, result: "Automatic TD PASS" },
  { roll: 4, result: "Re-roll drive result" },
  { roll: 5, result: "Re-roll drive result" },
  { roll: 6, result: "Automatic TD RUN" },
];

// ============================================================
// Tables J/K — Annual Draft Offense (2d6 tens+ones)
// Table J: 5 columns based on current offense scoring profile
// Table K: Same as Table C structure (for Off-Season Step C)
// ============================================================

export type OffenseDraftProfile = "PROLIFIC" | "PROLIFIC_SEMI" | "NEUTRAL" | "DULL_SEMI" | "DULL";

export interface AnnualDraftOffenseResult {
  scoringChange: "improve" | "diminish" | null;
  tendencyShift: "pass" | "run" | null;
  narrative: string;
}

export const TABLE_J_ANNUAL_DRAFT_OFFENSE: Record<OffenseDraftProfile, TableEntry<AnnualDraftOffenseResult>[]> = {
  PROLIFIC: [
    { min: "11", max: "13", result: { scoringChange: null, tendencyShift: "pass", narrative: "Draft adds receiving talent." } },
    { min: "14", max: "22", result: { scoringChange: null, tendencyShift: null, narrative: "Solid draft class maintains offensive output." } },
    { min: "23", max: "33", result: { scoringChange: null, tendencyShift: "run", narrative: "Draft adds rushing depth." } },
    { min: "34", max: "44", result: { scoringChange: null, tendencyShift: null, narrative: "Draft maintains team identity." } },
    { min: "45", max: "55", result: { scoringChange: "diminish", tendencyShift: null, narrative: "Key departures weaken offense." } },
    { min: "56", max: "66", result: { scoringChange: "diminish", tendencyShift: "pass", narrative: "Running game talent departs." } },
  ],
  PROLIFIC_SEMI: [
    { min: "11", max: "14", result: { scoringChange: "improve", tendencyShift: null, narrative: "Draft bolsters offense to elite level." } },
    { min: "15", max: "25", result: { scoringChange: null, tendencyShift: "pass", narrative: "Pass catchers added in draft." } },
    { min: "26", max: "35", result: { scoringChange: null, tendencyShift: null, narrative: "Offensive roster maintained." } },
    { min: "36", max: "45", result: { scoringChange: null, tendencyShift: "run", narrative: "Running backs drafted." } },
    { min: "46", max: "55", result: { scoringChange: "diminish", tendencyShift: null, narrative: "Veteran departures take a toll." } },
    { min: "56", max: "66", result: { scoringChange: "diminish", tendencyShift: null, narrative: "Offense slips to average." } },
  ],
  NEUTRAL: [
    { min: "11", max: "14", result: { scoringChange: "improve", tendencyShift: "pass", narrative: "Star QB prospect elevates offense." } },
    { min: "15", max: "22", result: { scoringChange: "improve", tendencyShift: null, narrative: "Draft class improves offensive potential." } },
    { min: "23", max: "35", result: { scoringChange: null, tendencyShift: null, narrative: "Offense stays at current level." } },
    { min: "36", max: "44", result: { scoringChange: null, tendencyShift: "run", narrative: "Ground game gets boost." } },
    { min: "45", max: "55", result: { scoringChange: "diminish", tendencyShift: null, narrative: "Offense loses key contributors." } },
    { min: "56", max: "66", result: { scoringChange: "diminish", tendencyShift: "pass", narrative: "Rushing talent departs in free agency." } },
  ],
  DULL_SEMI: [
    { min: "11", max: "16", result: { scoringChange: "improve", tendencyShift: null, narrative: "Draft injects life into struggling offense." } },
    { min: "22", max: "25", result: { scoringChange: "improve", tendencyShift: "run", narrative: "Franchise RB drafted." } },
    { min: "26", max: "35", result: { scoringChange: null, tendencyShift: null, narrative: "Offense stays below average." } },
    { min: "36", max: "44", result: { scoringChange: null, tendencyShift: "pass", narrative: "Receiving corps gets minor boost." } },
    { min: "45", max: "55", result: { scoringChange: "diminish", tendencyShift: null, narrative: "More talent exits." } },
    { min: "56", max: "66", result: { scoringChange: null, tendencyShift: null, narrative: "Status quo for struggling offense." } },
  ],
  DULL: [
    { min: "11", max: "16", result: { scoringChange: "improve", tendencyShift: null, narrative: "Franchise QB drafted — hope on the horizon." } },
    { min: "22", max: "26", result: { scoringChange: "improve", tendencyShift: "run", narrative: "Major draft investment in offense pays off." } },
    { min: "33", max: "35", result: { scoringChange: "improve", tendencyShift: "pass", narrative: "Draft adds elite receiving talent." } },
    { min: "36", max: "44", result: { scoringChange: null, tendencyShift: null, narrative: "Offense remains challenged." } },
    { min: "45", max: "55", result: { scoringChange: null, tendencyShift: "run", narrative: "Focus shifts to ground game." } },
    { min: "56", max: "66", result: { scoringChange: null, tendencyShift: "pass", narrative: "Front office tries to build through the air." } },
  ],
};

// Table K: same structure as Table C — used in Off-Season Training Camp
// Re-use TABLE_C_OFFENSE_* tables for Training Camp Step C

// ============================================================
// Tables L/M — Annual Draft Defense (2d6 tens+ones)
// ============================================================

export type DefenseDraftProfile = "STAUNCH" | "STAUNCH_SEMI" | "NEUTRAL" | "INEPT_SEMI" | "INEPT";

export interface AnnualDraftDefenseResult {
  scoringChange: "improve" | "diminish" | null;
  narrative: string;
}

export const TABLE_L_ANNUAL_DRAFT_DEFENSE: Record<DefenseDraftProfile, TableEntry<AnnualDraftDefenseResult>[]> = {
  STAUNCH: [
    { min: "11", max: "14", result: { scoringChange: null, narrative: "Defense maintains elite status." } },
    { min: "15", max: "25", result: { scoringChange: null, narrative: "Solid depth added on defense." } },
    { min: "26", max: "35", result: { scoringChange: null, narrative: "Defense stays strong." } },
    { min: "36", max: "45", result: { scoringChange: "diminish", narrative: "Key defenders depart in free agency." } },
    { min: "46", max: "55", result: { scoringChange: "diminish", narrative: "Defensive stars age out." } },
    { min: "56", max: "66", result: { scoringChange: "diminish", narrative: "Defense regresses significantly." } },
  ],
  STAUNCH_SEMI: [
    { min: "11", max: "16", result: { scoringChange: "improve", narrative: "Defense elevates to elite." } },
    { min: "22", max: "25", result: { scoringChange: null, narrative: "Defense holds steady." } },
    { min: "26", max: "35", result: { scoringChange: null, narrative: "Defensive roster maintained." } },
    { min: "36", max: "44", result: { scoringChange: null, narrative: "Status quo on defense." } },
    { min: "45", max: "55", result: { scoringChange: "diminish", narrative: "Defense slips." } },
    { min: "56", max: "66", result: { scoringChange: "diminish", narrative: "Key departures weaken defense." } },
  ],
  NEUTRAL: [
    { min: "11", max: "14", result: { scoringChange: "improve", narrative: "Draft class transforms defense." } },
    { min: "15", max: "22", result: { scoringChange: "improve", narrative: "Defensive talent infusion." } },
    { min: "23", max: "35", result: { scoringChange: null, narrative: "Defense stays average." } },
    { min: "36", max: "44", result: { scoringChange: null, narrative: "No major changes on defense." } },
    { min: "45", max: "55", result: { scoringChange: "diminish", narrative: "Defense gets worse." } },
    { min: "56", max: "66", result: { scoringChange: "diminish", narrative: "Defensive talent erodes." } },
  ],
  INEPT_SEMI: [
    { min: "11", max: "16", result: { scoringChange: "improve", narrative: "Draft injects talent into porous defense." } },
    { min: "22", max: "26", result: { scoringChange: "improve", narrative: "Defensive line gets help." } },
    { min: "33", max: "35", result: { scoringChange: null, narrative: "Defense remains below average." } },
    { min: "36", max: "44", result: { scoringChange: null, narrative: "Little change on defense." } },
    { min: "45", max: "55", result: { scoringChange: "diminish", narrative: "Defense drops to worst tier." } },
    { min: "56", max: "66", result: { scoringChange: null, narrative: "Defense stays subpar." } },
  ],
  INEPT: [
    { min: "11", max: "16", result: { scoringChange: "improve", narrative: "Major defensive overhaul in draft." } },
    { min: "22", max: "26", result: { scoringChange: "improve", narrative: "Draft class brings defensive hope." } },
    { min: "33", max: "36", result: { scoringChange: "improve", narrative: "Free agent signings help defense." } },
    { min: "44", max: "45", result: { scoringChange: null, narrative: "Defense still struggling." } },
    { min: "46", max: "55", result: { scoringChange: null, narrative: "No improvement on defense." } },
    { min: "56", max: "66", result: { scoringChange: null, narrative: "Defensive rebuild continues." } },
  ],
};

// ============================================================
// Table N — In-Season Injury (Breaking News) (2d6 tens+ones)
// ============================================================

export interface InjuryResult {
  narrative: string;
  qualityEffect: "lose_positive" | "gain_negative" | "downgrade" | "no_quality_change";
  durationWeeks: number; // 0 = rest of season
  affectsScoring: boolean;
}

export const TABLE_N_INJURY: TableEntry<InjuryResult>[] = [
  { min: "11", max: "12", result: { narrative: "Star player suffers season-ending injury!", qualityEffect: "lose_positive", durationWeeks: 0, affectsScoring: true } },
  { min: "13", max: "14", result: { narrative: "Key contributor tears ligament. Out for the season.", qualityEffect: "lose_positive", durationWeeks: 0, affectsScoring: false } },
  { min: "15", max: "16", result: { narrative: "Starter breaks bone. Out 6 weeks.", qualityEffect: "downgrade", durationWeeks: 6, affectsScoring: false } },
  { min: "22", max: "23", result: { narrative: "Veteran suffers concussion. Out 4 weeks.", qualityEffect: "downgrade", durationWeeks: 4, affectsScoring: false } },
  { min: "24", max: "25", result: { narrative: "Player sprains ankle badly. Out 3 weeks.", qualityEffect: "no_quality_change", durationWeeks: 3, affectsScoring: false } },
  { min: "26", max: "33", result: { narrative: "Hamstring injury sidelines player for 2 weeks.", qualityEffect: "no_quality_change", durationWeeks: 2, affectsScoring: false } },
  { min: "34", max: "35", result: { narrative: "Shoulder injury to key defender. Out 4 weeks.", qualityEffect: "gain_negative", durationWeeks: 4, affectsScoring: false } },
  { min: "36", max: "44", result: { narrative: "Minor injury to reserve player. Minimal impact.", qualityEffect: "no_quality_change", durationWeeks: 1, affectsScoring: false } },
  { min: "45", max: "46", result: { narrative: "Starter suffers knee sprain. Out 3 weeks.", qualityEffect: "downgrade", durationWeeks: 3, affectsScoring: false } },
  { min: "55", max: "56", result: { narrative: "Offensive lineman injured. Protection suffers.", qualityEffect: "gain_negative", durationWeeks: 4, affectsScoring: false } },
  { min: "66", max: "66", result: { narrative: "Franchise player suffers serious injury. Season in jeopardy.", qualityEffect: "lose_positive", durationWeeks: 0, affectsScoring: true } },
];

// ============================================================
// Table O — In-Season Improvements (Breaking News) (2d6 tens+ones)
// ============================================================

export interface ImprovementResult {
  narrative: string;
  qualityEffect: "gain_positive" | "upgrade" | "remove_negative" | "no_quality_change";
  durationWeeks: number; // 0 = rest of season
  affectsScoring: boolean;
}

export const TABLE_O_IMPROVEMENT: TableEntry<ImprovementResult>[] = [
  { min: "11", max: "12", result: { narrative: "Breakout performance from young player!", qualityEffect: "gain_positive", durationWeeks: 0, affectsScoring: true } },
  { min: "13", max: "14", result: { narrative: "Mid-season trade brings impact player.", qualityEffect: "gain_positive", durationWeeks: 0, affectsScoring: false } },
  { min: "15", max: "16", result: { narrative: "Injured star returns ahead of schedule!", qualityEffect: "remove_negative", durationWeeks: 0, affectsScoring: false } },
  { min: "22", max: "23", result: { narrative: "New offensive scheme clicks perfectly.", qualityEffect: "upgrade", durationWeeks: 0, affectsScoring: false } },
  { min: "24", max: "25", result: { narrative: "Free agent signing makes immediate impact.", qualityEffect: "gain_positive", durationWeeks: 0, affectsScoring: false } },
  { min: "26", max: "33", result: { narrative: "Players rally around team culture.", qualityEffect: "upgrade", durationWeeks: 4, affectsScoring: false } },
  { min: "34", max: "35", result: { narrative: "Defensive coordinator makes halftime adjustments.", qualityEffect: "upgrade", durationWeeks: 3, affectsScoring: false } },
  { min: "36", max: "44", result: { narrative: "Team chemistry improves after team building.", qualityEffect: "no_quality_change", durationWeeks: 0, affectsScoring: false } },
  { min: "45", max: "46", result: { narrative: "Special teams unit gels.", qualityEffect: "upgrade", durationWeeks: 0, affectsScoring: false } },
  { min: "55", max: "56", result: { narrative: "Practice squad player earns starting role.", qualityEffect: "gain_positive", durationWeeks: 0, affectsScoring: false } },
  { min: "66", max: "66", result: { narrative: "Everything comes together — team hits its stride!", qualityEffect: "gain_positive", durationWeeks: 0, affectsScoring: true } },
];

// ============================================================
// Table U — Unexpected Events (2d6 tens+ones)
// ============================================================

export interface UnexpectedEventResult {
  narrative: string;
  fpChange: number;
  qualityEffect?: string;
  ownershipEffect?: { loyalty?: OwnershipLoyalty };
  franchiseMovement?: "sale" | "relocation" | null;
}

export const TABLE_U_UNEXPECTED_EVENTS: TableEntry<UnexpectedEventResult>[] = [
  { min: "11", max: "11", result: { narrative: "Owner sells the team! New ownership takes over.", fpChange: 0, franchiseMovement: "sale" } },
  { min: "12", max: "13", result: { narrative: "Stadium funding dispute threatens franchise.", fpChange: -2, ownershipEffect: { loyalty: "SELFISH" } } },
  { min: "14", max: "15", result: { narrative: "Player holdout disrupts training camp.", fpChange: -1 } },
  { min: "16", max: "16", result: { narrative: "Coaching staff feud spills into the media.", fpChange: -1, qualityEffect: "coaching_disruption" } },
  { min: "22", max: "23", result: { narrative: "Free agent signing bonus drains cap space.", fpChange: -2 } },
  { min: "24", max: "25", result: { narrative: "Team wins offseason award for best facilities.", fpChange: 1 } },
  { min: "26", max: "26", result: { narrative: "Community outreach program wins fans' hearts.", fpChange: 1, ownershipEffect: { loyalty: "LOYAL" } } },
  { min: "33", max: "34", result: { narrative: "Scandal rocks front office.", fpChange: -2 } },
  { min: "35", max: "36", result: { narrative: "TV deal brings extra revenue.", fpChange: 2 } },
  { min: "44", max: "44", result: { narrative: "Sponsorship deal falls through.", fpChange: -1 } },
  { min: "45", max: "46", result: { narrative: "Draft pick trade nets extra picks.", fpChange: 1 } },
  { min: "55", max: "55", result: { narrative: "International game brings global exposure.", fpChange: 1 } },
  { min: "56", max: "56", result: { narrative: "New stadium approved! Franchise secured.", fpChange: 2, ownershipEffect: { loyalty: "LOYAL" } } },
  { min: "66", max: "66", result: { narrative: "Team relocates to new city!", fpChange: 0, franchiseMovement: "relocation" } },
];

// ============================================================
// Coach Grade Adjustment Table (Post-Season)
// ============================================================

export interface CoachGradeAdjustment {
  description: string;
  gradeChange: number; // +2, +1, 0, -1
  maxGrade?: HeadCoachGrade;
  minGrade?: HeadCoachGrade;
}

export const COACH_GRADE_ADJUSTMENTS: Record<string, CoachGradeAdjustment> = {
  champion: { description: "Won Championship", gradeChange: 2, maxGrade: "A" },
  winning: { description: "Winning Season", gradeChange: 1, maxGrade: "B" },
  losing: { description: "Losing Season", gradeChange: -1, minGrade: "F" },
};

// ============================================================
// FO Grade Adjustment (Training Camp)
// ============================================================

export interface FOGradeAdjustment {
  description: string;
  gradeChange: number;
}

export const FO_GRADE_ADJUSTMENTS = {
  bothImproved: { description: "Both OFF & DEF improved", gradeChange: 2 },
  oneImproved: { description: "OFF or DEF improved", gradeChange: 1 },
  noChange: { description: "No scoring changes", gradeChange: 0 },
  oneDiminished: { description: "OFF or DEF diminished", gradeChange: -1 },
  bothDiminished: { description: "Both OFF & DEF diminished", gradeChange: -2 },
};

// ============================================================
// FP Spending Options
// ============================================================

export interface FPSpendOption {
  cost: number;
  description: string;
  action: string;
}

export const FP_SPEND_OPTIONS: FPSpendOption[] = [
  { cost: 3, description: "Re-roll any single quality result", action: "reroll_quality" },
  { cost: 3, description: "Upgrade a Semi quality to Full", action: "upgrade_semi" },
  { cost: 2, description: "Re-roll a single Table C/D result", action: "reroll_profile" },
  { cost: 2, description: "Re-roll Special Teams result", action: "reroll_special_teams" },
  { cost: 1, description: "Re-roll Scoring Tendency", action: "reroll_tendency" },
  { cost: 1, description: "Minor adjustment to any quality", action: "minor_adjustment" },
];

// ============================================================
// Scoring Tendency Table (for Classic Mode)
// Based on aggregate tendency across the roster
// ============================================================

export const SCORING_TENDENCY_TABLE: SimpleTableEntry<"P+" | "P" | null | "R" | "R+">[] = [
  { min: 1, max: 1, result: "P+" },
  { min: 2, max: 2, result: "P" },
  { min: 3, max: 4, result: null },
  { min: 5, max: 5, result: "R" },
  { min: 6, max: 6, result: "R+" },
];

// ============================================================
// Bonus FP Table (Post-Season Standings)
// ============================================================

export interface BonusFPEntry {
  condition: string;
  bonusFP: number;
}

export const BONUS_FP_TABLE: BonusFPEntry[] = [
  { condition: "Worst record in league", bonusFP: 3 },
  { condition: "Bottom 15% of standings", bonusFP: 2 },
  { condition: "Bottom 30% of standings", bonusFP: 1 },
];

// ============================================================
// Grade ordering utility
// ============================================================

const GRADE_ORDER: (FrontOfficeGrade | HeadCoachGrade)[] = ["F", "D", "C", "B", "A"];

export function adjustGrade<T extends FrontOfficeGrade | HeadCoachGrade>(
  grade: T,
  change: number,
  min?: T,
  max?: T
): T {
  let idx = GRADE_ORDER.indexOf(grade) + change;
  if (min) idx = Math.max(idx, GRADE_ORDER.indexOf(min));
  if (max) idx = Math.min(idx, GRADE_ORDER.indexOf(max));
  idx = Math.max(0, Math.min(GRADE_ORDER.length - 1, idx));
  return GRADE_ORDER[idx] as T;
}
