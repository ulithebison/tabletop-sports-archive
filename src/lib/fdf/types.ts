// ============================================================
// FDF Companion App — Types (Sprint 1 + Sprint 2 Enhanced Mode)
// ============================================================

// Game mode: "dice" = Chartbook + 3 dice, "fac" = Fast Action Cards
export type GameMode = "dice" | "fac";

// Quality level: "full" = always active, "semi" (•) = 1d6 check needed, null = not present
export type QualityLevel = "full" | "semi" | null;

// Clock management has a "super" variant (underlined on card)
export type ClockQualityLevel = "super" | "full" | "semi" | null;

export interface TeamQualities {
  offense: {
    scoring: "PROLIFIC" | "DULL" | null;
    scoringSemi: boolean;
    yards: "DYNAMIC" | "ERRATIC" | null;
    yardsSemi: boolean;
    protection: "SOLID" | "POROUS" | null;
    protectionSemi: boolean;
    ballSecurity: "RELIABLE" | "SHAKY" | null;
    ballSecuritySemi: boolean;
    fumbles: "SECURE" | "CLUMSY" | null;
    fumblesSemi: boolean;
    discipline: "DISCIPLINED" | "UNDISCIPLINED" | null;
    disciplineSemi: boolean;
    clockManagement: "EFFICIENT" | "INEFFICIENT" | null;
    clockManagementLevel: ClockQualityLevel;
    scoringTendency: "P+" | "P" | "R" | "R+" | null;
  };
  defense: {
    scoring: "STAUNCH" | "INEPT" | null;
    scoringSemi: boolean;
    yards: "STIFF" | "SOFT" | null;
    yardsSemi: boolean;
    passRush: "PUNISHING" | "MILD" | null;
    passRushSemi: boolean;
    coverage: "AGGRESSIVE" | "MEEK" | null;
    coverageSemi: boolean;
    fumbleRecovery: "ACTIVE" | "PASSIVE" | null;
    fumbleRecoverySemi: boolean;
    discipline: "DISCIPLINED" | "UNDISCIPLINED" | null;
    disciplineSemi: boolean;
  };
  specialTeams: {
    kickReturn: "ELECTRIC" | null;
    kickReturnSemi: boolean;
    puntReturn: "ELECTRIC" | null;
    puntReturnSemi: boolean;
  };
}

export interface TeamKicking {
  fgRange: string; // e.g. "11-62"
  xpRange: string; // e.g. "11-63"
}

// ============================================================
// Sprint 3 — Finder-Category Roster (Enhanced Team Card layout)
// ============================================================

export interface FinderPlayer {
  id: string;
  name: string;
  number?: number;
  finderRange?: string; // e.g. "11-34"
}

export interface FinderRoster {
  rushingTD: FinderPlayer[];    // Ball carriers
  passingTD: FinderPlayer[];   // Quarterbacks
  receivingTD: FinderPlayer[]; // Receivers
  kickingFGXP: FinderPlayer[]; // Kickers
}

// ============================================================
// Sprint 2 — Enhanced Mode: Player & Roster Types
// ============================================================

export type RosterPosition =
  | "QB" | "RB" | "WR" | "TE" | "K" | "P"
  | "CB" | "S" | "LB" | "DL"
  | "KR" | "PR";

export interface PlayerFinderRanges {
  rushingTD?: string;   // e.g. "11-34"
  passingTD?: string;   // e.g. "11-66"
  receivingTD?: string; // e.g. "65-66"
  kickingFGXP?: string; // e.g. "11-66"
}

export interface PlayerEntry {
  id: string;
  name: string;
  number?: number;
  position: RosterPosition;
  finderRange?: string;              // DEPRECATED — kept for old localStorage compat
  finderRanges?: PlayerFinderRanges; // Per-category finder ranges from Enhanced Team Cards
}

export interface TeamRoster {
  quarterbacks: PlayerEntry[];
  runningBacks: PlayerEntry[];
  receivers: PlayerEntry[];       // WR + TE
  kicker?: PlayerEntry;
  punter?: PlayerEntry;
  defensiveBacks: PlayerEntry[];  // CB + S
  linebackers: PlayerEntry[];
  defensiveLinemen: PlayerEntry[];
  kickReturner?: PlayerEntry;
  puntReturner?: PlayerEntry;
}

export interface DrivePlayerInvolvement {
  quarterback?: string;       // player ID
  scorer?: string;            // player ID (rusher, receiver, returner)
  scorerPosition?: RosterPosition;
  kicker?: string;            // player ID
  interceptedBy?: string;     // player ID (defender)
  fumbleRecoveredBy?: string; // player ID (defender)
  sackBy?: string;            // player ID (defender)
  returnedBy?: string;        // player ID (returner on return TDs)
  // Sprint 3 — PAT player tracking
  patKicker?: string;         // player ID — kicker for XP
  patPasser?: string;         // player ID — QB for 2PT
  patReceiver?: string;       // player ID — receiver/runner for 2PT
}

export interface PlayerGameStats {
  playerId: string;
  playerName: string;
  playerNumber?: number;
  teamId: string;
  position: RosterPosition;
  passing: {
    touchdowns: number;
    interceptions: number;
    sacks: number;
  };
  rushing: {
    touchdowns: number;
    fumbles: number;
  };
  receiving: {
    touchdowns: number;
  };
  kicking: {
    fieldGoalsMade: number;
    fieldGoalsMissed: number;
    extraPointsMade: number;
    extraPointsMissed: number;
  };
  defense: {
    interceptions: number;
    fumbleRecoveries: number;
    sacks: number;
    returnTouchdowns: number;
  };
  specialTeams: {
    kickReturnTouchdowns: number;
    puntReturnTouchdowns: number;
  };
  totalTouchdowns: number;
  pointsResponsibleFor: number;
}

// ============================================================
// Team
// ============================================================

export interface FdfTeam {
  id: string;
  name: string;
  abbreviation: string;
  season: number;
  league: "NFL" | "AFL" | "USFL" | "XFL" | "AAF" | "WFL" | "Custom";
  conference?: string;
  division?: string;
  record?: string;
  headCoach?: string;
  qualities: TeamQualities;
  kicking: TeamKicking;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  notes?: string;
  roster?: TeamRoster;
  finderRoster?: FinderRoster;
  createdAt: string;
  updatedAt: string;
}

// Field position on the drive
export type FieldPosition = "POOR" | "AVERAGE" | "GREAT";

// All possible drive result types
export type DriveResultType =
  // Scoring
  | "TD_RUN"
  | "TD_PASS"
  | "FGA_GOOD"
  | "FGA_MISSED"
  | "SAFETY"
  // Non-Scoring
  | "PUNT"
  | "PUNT_BU"
  | "PUNT_CO"
  | "INTERCEPTION"
  | "FUMBLE"
  | "TURNOVER_ON_DOWNS"
  // Special
  | "KNEEL_DOWN"
  | "DESPERATION_PLAY"
  | "DESPERATION_TD"
  | "DESPERATION_FGA"
  | "UNUSUAL_RESULT"
  | "END_OF_HALF"
  | "END_OF_GAME"
  // Return TDs (scored by offense = the drive team)
  | "KICKOFF_RETURN_TD"
  | "PUNT_RETURN_TD"
  | "FUMBLE_RETURN_TD"
  | "INTERCEPTION_RETURN_TD"
  | "BLOCKED_FG_RETURN_TD"
  | "BLOCKED_PUNT_TD"
  | "FREE_KICK_RETURN_TD"
  // Kick-Off/Punt fumble outcomes
  | "KICK_PUNT_REC_RECOVERS"
  | "KICK_PUNT_KICK_RECOVERS"
  | "KICK_PUNT_KICK_TD"
  // Onside kick
  | "ONSIDE_KICK_SUCCESS"
  | "ONSIDE_KICK_FAIL";

// PAT result after a touchdown
export type PATResult = "XP_GOOD" | "XP_MISSED" | "2PT_GOOD" | "2PT_FAILED";

// What the user enters for a drive
export interface DriveInput {
  fieldPosition: FieldPosition;
  driveTicks: number;
  result: DriveResultType;
  patResult?: PATResult;
  summary: string;
  playerInvolvement?: DrivePlayerInvolvement;
  diceValues?: number[];
  deciderDieValue?: number;
}

// Full drive entry stored in game
export interface DriveEntry {
  id: string;
  driveNumber: number;
  quarter: 1 | 2 | 3 | 4 | 5;
  teamId: string;
  fieldPosition: FieldPosition;
  driveTicks: number;
  result: DriveResultType;
  patResult?: PATResult;
  offensePoints: number;
  defensePoints: number;
  summary: string;
  scoreAfterDrive: string;
  playerInvolvement?: DrivePlayerInvolvement;
  diceValues?: number[];
  deciderDieValue?: number;
  createdAt: string;
}

export interface QuarterScore {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  ot: number;
  total: number;
}

export interface GameClock {
  quarter: 1 | 2 | 3 | 4 | 5;
  ticksRemaining: number;
  isHalftime: boolean;
  isGameOver: boolean;
}

// ============================================================
// NFL Overtime State
// ============================================================

export type OvertimePhase = "coin_toss" | "guaranteed_possession" | "sudden_death";

export interface OvertimeState {
  phase: OvertimePhase;
  coinTossWinner: "home" | "away";
  receivingTeam: "home" | "away";
  firstTeamPossessionComplete: boolean;
  secondTeamPossessionComplete: boolean;
  period: number;          // 1-based, playoffs can have multiple
  canEndInTie: boolean;    // false for playoffs
  otStartDriveNumber: number;
}

export type GameStatus = "in_progress" | "completed";

export interface FdfGame {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  status: GameStatus;
  score: {
    home: QuarterScore;
    away: QuarterScore;
  };
  gameClock: GameClock;
  drives: DriveEntry[];
  currentPossession: "home" | "away";
  openingKickoffReceiver: "home" | "away";
  enhancedMode?: boolean;
  gameMode?: GameMode;
  sevenPlusMinuteDrive?: boolean;
  overtimeState?: OvertimeState;
  startedAt: string;
  completedAt?: string;
}

// ============================================================
// Sprint 3a — Win Probability
// ============================================================

export interface WinProbabilitySnapshot {
  afterDriveNumber: number;   // 0 = game start (pre-drive)
  quarter: 1 | 2 | 3 | 4 | 5;
  ticksRemaining: number;     // Total ticks remaining in game (0-48)
  homeScore: number;
  awayScore: number;
  scoreDifferential: number;  // home - away
  homeWinProbability: number; // 0.0-1.0
  possessionTeamId: string;
}

export interface WPAnalytics {
  keyPlay: { snapshot: WinProbabilitySnapshot; delta: number } | null;
  biggestLead: { snapshot: WinProbabilitySnapshot; teamId: string; wpPct: number } | null;
  leadChanges: number;
  biggestSwingDelta: number;
}

// ============================================================
// Sprint 5 — Season Replay
// ============================================================

export type SeasonStatus = "setup" | "regular_season" | "playoffs" | "completed";

export type LeagueType = "NFL" | "USFL" | "AFL" | "CFL" | "XFL" | "Custom";

export type OvertimeType = "sudden_death" | "modified_sudden_death" | "guaranteed_possession";

export type PlayoffRound = "round_of_64" | "round_of_32" | "wild_card" | "divisional" | "conference" | "super_bowl";

export interface SeasonConfig {
  totalRegularSeasonWeeks: number;
  playoffTeams: number;
  hasByeWeeks: boolean;
  homeFieldInPlayoffs: boolean;
}

export interface OvertimeConfig {
  type: OvertimeType;
  canEndInTie: boolean;
}

export interface Division {
  name: string;
  teamIds: string[];
}

export interface ScheduleGame {
  id: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  result?: SeasonGameResult;
  gameId?: string;
  isBye?: boolean;
  isPlayoff?: boolean;
  playoffRound?: PlayoffRound;
}

export interface SeasonGameResult {
  homeScore: number;
  awayScore: number;
  winner: "home" | "away" | "tie";
  isOvertime: boolean;
  isSimulated: boolean;
  instantResultData?: InstantResultData;
}

export interface InstantResultData {
  homeTeamRating: number;
  awayTeamRating: number;
  pointDifferential: number;
  winRangeMax: number;
  rollResult: number;
  otRollResult?: number;
  winnerScoringQuality: "PROLIFIC" | "PROLIFIC_SEMI" | "NEUTRAL" | "DULL_SEMI" | "DULL";
  winnerScoreRoll: number;
  loserClosenessRoll: number;
  loserFormulaRoll: number;
}

export interface FdfSeason {
  id: string;
  name: string;
  year: number;
  leagueType: LeagueType;
  config: SeasonConfig;
  overtimeRules: OvertimeConfig;
  currentWeek: number;
  status: SeasonStatus;
  teamIds: string[];
  divisions: Division[];
  schedule: ScheduleGame[];
  commissionerLeagueId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamStanding {
  teamId: string;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  streak: string;
  divisionRecord: { wins: number; losses: number; ties: number };
  homeRecord: { wins: number; losses: number; ties: number };
  awayRecord: { wins: number; losses: number; ties: number };
  last5: ("W" | "L" | "T")[];
}

// ============================================================
// Sprint 6 — Season Stats & Awards
// ============================================================

export interface PlayerGameLogEntry {
  week: number;
  opponentTeamId: string;
  isHome: boolean;
  result: "W" | "L" | "T";
  score: string; // e.g. "24-17"
  passingTD: number;
  interceptions: number;
  rushingTD: number;
  receivingTD: number;
  fieldGoalsMade: number;
  extraPointsMade: number;
  pointsResponsibleFor: number;
}

export interface PlayerSeasonStats {
  playerId: string;
  playerName: string;
  playerNumber?: number;
  teamId: string;
  gamesPlayed: number;
  // Passing
  passingTD: number;
  interceptions: number;
  sacks: number;
  // Rushing
  rushingTD: number;
  fumbles: number;
  // Receiving
  receivingTD: number;
  // Kicking
  fieldGoalsMade: number;
  fieldGoalsMissed: number;
  extraPointsMade: number;
  extraPointsMissed: number;
  // Defense
  defensiveInterceptions: number;
  fumbleRecoveries: number;
  defensiveSacks: number;
  returnTouchdowns: number;
  // Special Teams
  kickReturnTD: number;
  puntReturnTD: number;
  // Totals
  totalTouchdowns: number;
  pointsResponsibleFor: number;
  // Derived
  tdIntRatio: number; // (passingTD + rushingTD + receivingTD) / max(1, interceptions)
  kickingPoints: number; // FG*3 + XP*1
  // Game log
  gameLog: PlayerGameLogEntry[];
}

export interface TeamSeasonStats {
  teamId: string;
  gamesPlayed: number;
  manualGamesPlayed: number;
  simulatedGamesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  pointDiff: number;
  // Drive-based (manual games only)
  fieldPositionPoor: number;   // percentage 0-100
  fieldPositionAvg: number;
  fieldPositionGreat: number;
  turnoversCommitted: number;
  turnoversForced: number;
  turnoverDiff: number;
}

export type SeasonAwardType = "MVP" | "OPOY" | "DPOY" | "CLUTCH" | "BEST_TURNOVER_TEAM";

export interface SeasonAward {
  type: SeasonAwardType;
  playerId: string;
  playerName: string;
  playerNumber?: number;
  teamId: string;
  statLine: string;
  isTeamAward?: boolean;
}

export interface PlayerOfTheWeek {
  week: number;
  playerId: string;
  playerName: string;
  playerNumber?: number;
  teamId: string;
  statLine: string;
  pointsResponsibleFor: number;
}

export type SeasonMomentType =
  | "biggest_wp_swing"
  | "closest_game"
  | "blowout"
  | "comeback"
  | "shutout"
  | "highest_scoring"
  | "overtime";

export interface SeasonMoment {
  type: SeasonMomentType;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  headline: string;
  gameId?: string;
  wpSwing?: number;
}
