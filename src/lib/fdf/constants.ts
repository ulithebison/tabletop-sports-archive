import type { DriveResultType, PATResult, FieldPosition, RosterPosition, LeagueType, PlayoffRound, GameMode } from "./types";

// Timing die: face value → ticks consumed
export const TIMING_DIE_MAP: Record<number, number> = {
  1: 1,
  2: 2,
  3: 2,
  4: 2,
  5: 3,
  6: 4,
};

// Drive result definitions organized by category
export const DRIVE_RESULT_CATEGORIES = {
  scoring: [
    { value: "TD_RUN" as DriveResultType, label: "TD Run", points: 6 },
    { value: "TD_PASS" as DriveResultType, label: "TD Pass", points: 6 },
    { value: "FGA_GOOD" as DriveResultType, label: "FG Good", points: 3 },
    { value: "FGA_MISSED" as DriveResultType, label: "FG Missed", points: 0 },
    { value: "SAFETY" as DriveResultType, label: "Safety", points: 2 },
  ],
  turnover: [
    { value: "INTERCEPTION" as DriveResultType, label: "Interception", points: 0 },
    { value: "FUMBLE" as DriveResultType, label: "Fumble", points: 0 },
    { value: "TURNOVER_ON_DOWNS" as DriveResultType, label: "Turnover on Downs", points: 0 },
  ],
  special: [
    { value: "KNEEL_DOWN" as DriveResultType, label: "Kneel Down", points: 0 },
    { value: "DESPERATION_PLAY" as DriveResultType, label: "Desperation Play", points: 0 },
    { value: "DESPERATION_TD" as DriveResultType, label: "Desperation TD", points: 6 },
    { value: "DESPERATION_FGA" as DriveResultType, label: "Desperation FGA", points: 3 },
    { value: "UNUSUAL_RESULT" as DriveResultType, label: "Unusual Result", points: 0 },
    { value: "END_OF_HALF" as DriveResultType, label: "End of Half", points: 0 },
    { value: "END_OF_GAME" as DriveResultType, label: "End of Game", points: 0 },
  ],
  returnTDs: [
    { value: "KICKOFF_RETURN_TD" as DriveResultType, label: "Kickoff Return TD", points: 6 },
    { value: "PUNT_RETURN_TD" as DriveResultType, label: "Punt Return TD", points: 6 },
    { value: "FUMBLE_RETURN_TD" as DriveResultType, label: "Fumble Return TD", points: 6 },
    { value: "INTERCEPTION_RETURN_TD" as DriveResultType, label: "INT Return TD", points: 6 },
    { value: "BLOCKED_FG_RETURN_TD" as DriveResultType, label: "Blocked FG Return TD", points: 6 },
    { value: "BLOCKED_PUNT_TD" as DriveResultType, label: "Blocked Punt TD", points: 6 },
    { value: "FREE_KICK_RETURN_TD" as DriveResultType, label: "Free Kick Return TD", points: 6 },
  ],
  kickPunt: [
    { value: "PUNT" as DriveResultType, label: "Punt", points: 0 },
    { value: "PUNT_BU" as DriveResultType, label: "Punt-BU", points: 0 },
    { value: "PUNT_CO" as DriveResultType, label: "Punt-CO", points: 0 },
    { value: "KICK_PUNT_REC_RECOVERS" as DriveResultType, label: "Recv. Team Recovers", points: 0 },
    { value: "KICK_PUNT_KICK_RECOVERS" as DriveResultType, label: "Kick. Team Recovers", points: 0 },
    { value: "KICK_PUNT_KICK_TD" as DriveResultType, label: "Kick. Team TD", points: 6 },
  ],
} as const;

// PAT options after a touchdown
export const PAT_OPTIONS: { value: PATResult; label: string; points: number }[] = [
  { value: "XP_GOOD", label: "XP Good", points: 1 },
  { value: "XP_MISSED", label: "XP Missed", points: 0 },
  { value: "2PT_GOOD", label: "2-PT Good", points: 2 },
  { value: "2PT_FAILED", label: "2-PT Failed", points: 0 },
];

// Field position definitions
export const FIELD_POSITIONS: { value: FieldPosition; label: string; color: string }[] = [
  { value: "POOR", label: "POOR", color: "var(--fdf-fp-poor, #ef4444)" },
  { value: "AVERAGE", label: "AVERAGE", color: "var(--fdf-fp-average, #f59e0b)" },
  { value: "GREAT", label: "GREAT", color: "var(--fdf-fp-great, #22c55e)" },
];

// Clock constants (Dice defaults — kept for backward compat)
export const TICKS_PER_QUARTER = 12;
export const TICKS_PER_OT_PERIOD = 8; // 10 minutes (600s / 75s per tick)
export const TOTAL_TICKS = 48;

// ── Timing Config (Dice vs FAC) ─────────────────────────────
export interface TimingConfig {
  ticksPerQuarter: number;
  ticksPerOTPeriod: number;
  totalTicks: number;
  secondsPerTick: number;
  warningZoneTicks: number;  // EFFICIENT/INEFFICIENT threshold
  maxDriveTicks: number;
}

const DICE_TIMING: TimingConfig = {
  ticksPerQuarter: 12,
  ticksPerOTPeriod: 8,
  totalTicks: 48,
  secondsPerTick: 75,
  warningZoneTicks: 4,
  maxDriveTicks: 4,
};

const FAC_TIMING: TimingConfig = {
  ticksPerQuarter: 30,
  ticksPerOTPeriod: 20,
  totalTicks: 120,
  secondsPerTick: 30,
  warningZoneTicks: 10,
  maxDriveTicks: 10,
};

export function getTimingConfig(mode?: GameMode): TimingConfig {
  return mode === "fac" ? FAC_TIMING : DICE_TIMING;
}

// LocalStorage keys
export const STORAGE_KEYS = {
  TEAMS: "fdf_teams",
  GAMES: "fdf_games",
  SETTINGS: "fdf_settings",
  SEASONS: "fdf_seasons",
} as const;

// ============================================================
// Sprint 2 — Roster Positions
// ============================================================

export const ROSTER_POSITIONS = {
  offense: ["QB", "RB", "WR", "TE", "K", "P"] as RosterPosition[],
  defense: ["CB", "S", "LB", "DL"] as RosterPosition[],
  specialTeams: ["KR", "PR"] as RosterPosition[],
} as const;

export const POSITION_LABELS: Record<RosterPosition, string> = {
  QB: "Quarterback",
  RB: "Running Back",
  WR: "Wide Receiver",
  TE: "Tight End",
  K: "Kicker",
  P: "Punter",
  CB: "Cornerback",
  S: "Safety",
  LB: "Linebacker",
  DL: "Defensive Lineman",
  KR: "Kick Returner",
  PR: "Punt Returner",
};

// ============================================================
// Sprint 5 — Season Replay
// ============================================================

export const LEAGUE_TYPE_LABELS: Record<LeagueType, string> = {
  NFL: "NFL",
  USFL: "USFL",
  AFL: "AFL",
  CFL: "CFL",
  XFL: "XFL",
  Custom: "Custom",
};

export const PLAYOFF_FORMAT_OPTIONS = [
  { value: 2, label: "2 teams" },
  { value: 4, label: "4 teams" },
  { value: 6, label: "6 teams" },
  { value: 7, label: "7 teams (NFL)" },
  { value: 8, label: "8 teams" },
  { value: 12, label: "12 teams" },
  { value: 14, label: "14 teams" },
  { value: 18, label: "18 teams" },
  { value: 24, label: "24 teams" },
  { value: 32, label: "32 teams" },
  { value: 36, label: "36 teams" },
  { value: 64, label: "64 teams" },
];

/** Canonical round ordering from earliest to final */
export const ALL_PLAYOFF_ROUNDS: PlayoffRound[] = [
  "round_of_64",
  "round_of_32",
  "wild_card",
  "divisional",
  "conference",
  "super_bowl",
];
