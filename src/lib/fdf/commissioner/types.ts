// ============================================================
// FDF Commissioner Module — Types
// ============================================================

// === SHARED TYPES (both modes) ===

export type CommissionerMode = "classic" | "player";

export type LeaguePhase =
  | "setup"
  | "regular_season"
  | "postseason"
  | "offseason_coaching"      // Classic: Coach adjustment + carousel
  | "offseason_ownership"     // Classic: Ownership impact + FP
  | "offseason_draft"         // Both: Annual draft
  | "offseason_training"      // Classic: Training camp qualities
  | "offseason_development"   // Player: Development + retirement
  | "offseason_retirement"    // Player: Retirement checks
  | "offseason_quality_changes" // Player: Quality changes
  | "offseason_free_agency"   // Player: Free agency
  | "offseason_preseason"     // Both: Kicker/Returner ranges
  | "completed";

// === CLASSIC MODE TYPES (V1.5) ===

export type OwnershipLoyalty = "LOYAL" | "NEUTRAL" | "SELFISH";
export type OwnershipCompetence = "SAVVY" | "NEUTRAL" | "MEDDLING";
export type FrontOfficeGrade = "A" | "B" | "C" | "D" | "F";
export type HeadCoachGrade = "A" | "B" | "C" | "D" | "F";

export interface ClassicTeamData {
  ownership: {
    loyalty: OwnershipLoyalty;
    competence: OwnershipCompetence;
  };
  frontOfficeGrade: FrontOfficeGrade;
  headCoachGrade: HeadCoachGrade;
  headCoachName: string;
  franchisePoints: number;
  hotSeat: boolean;
  // Tracking
  seasonsWithCoach: number;
  consecutiveLosingSeasons: number;
  hasWonChampionship: boolean;
}

// === PLAYER MODE TYPES (Draft Edition V1.0) — Stubs ===

export type CareerPhase = "young" | "prime" | "veteran" | "elder";

export type PlayerPosition =
  | "QB" | "RB" | "WR" | "TE" | "OL"
  | "DT" | "DE" | "LB" | "CB" | "SS" | "FS"
  | "K" | "KR" | "PR";

export type DefenseScheme = "3-4" | "4-3";
export type SpecialTeamsGrade = "A" | "B" | "C" | "D";
export type CoachFocus = "offense" | "defense";

export type GameDayQuality =
  | "EFFICIENT"
  | "EFFICIENT_SEMI"
  | "none"
  | "INEFFICIENT_SEMI"
  | "INEFFICIENT";

export type OffensiveQualityName =
  | "Dynamic" | "Erratic"
  | "Evasive" | "Hesitant"
  | "Efficient" | "Inefficient"
  | "Reliable" | "Shaky"
  | "Solid" | "Porous"
  | "Secure" | "Clumsy"
  | "Disciplined" | "Undisciplined";

export type DefensiveQualityName =
  | "Stiff" | "Soft"
  | "Punishing" | "Mild"
  | "Aggressive" | "Meek"
  | "Active" | "Passive"
  | "Disciplined" | "Undisciplined";

export type SpecialTeamsQualityName = "Electric";

export type PlayerQualityName =
  | OffensiveQualityName
  | DefensiveQualityName
  | SpecialTeamsQualityName;

export interface PlayerQuality {
  name: PlayerQualityName;
  isSemi: boolean;
  isTemporary?: boolean;
  expiresAfterWeeks?: number;
}

export interface CommissionerPlayer {
  id: string;
  name: string;
  position: PlayerPosition;
  age: number;
  passRating: number;
  runRating: number;
  grade?: SpecialTeamsGrade;
  qualities: PlayerQuality[];
  isBackup: boolean;
  injuredWeeksRemaining: number;
  status: PlayerStatus;
}

export interface PlayerStatus {
  risingStar: boolean;
  risingStarRollsRemaining: number;
  retirementResistance: boolean;
  developmentModifier: number;
  forcedRetirement: boolean;
}

export type CoachSpecialtyType =
  | "talent_spotter_offense"
  | "qb_development"
  | "ol_guru"
  | "rb_development"
  | "receivers_coach"
  | "special_teams_offense"
  | "talent_spotter_defense"
  | "dl_guru"
  | "lb_development"
  | "secondary_coach"
  | "special_teams_defense";

export interface CoachSpecialty {
  type: CoachSpecialtyType;
  description: string;
}

export interface HeadCoach {
  id: string;
  name: string;
  age: number;
  focus: CoachFocus;
  specialty: CoachSpecialty;
  gameDayQuality: GameDayQuality;
  yearsWithTeam: number;
  seasonRecord: { wins: number; losses: number; ties: number };
  careerRecord: { wins: number; losses: number; ties: number };
  consecutiveLosingSeasons: number;
  hasWonChampionship: boolean;
}

// === TEMPORARY MODIFIERS ===

export type ModifierType =
  | "quality_add"
  | "quality_remove"
  | "rating_change"
  | "team_quality_override"
  | "fp_change";

export interface TemporaryModifier {
  id: string;
  description: string;
  type: ModifierType;
  target: "team" | "player";
  targetPlayerId?: string;
  data: Record<string, unknown>;
  weeksRemaining: number; // 0 = permanent for rest of season
  source: string;
}

// === HEADLINE TYPES ===

export type HeadlineCategory =
  | "player_performance"
  | "team_chemistry"
  | "coaching_development"
  | "individual_storylines"
  | "season_defining_moments"
  // Classic Mode
  | "injury"
  | "improvement"
  | "unexpected_event";

export interface HeadlineRecord {
  id: string;
  season: number;
  week: number;
  teamId: string;
  category: HeadlineCategory;
  eventRoll: string;
  title: string;
  description: string;
  effects: string[];
  appliedModifiers: TemporaryModifier[];
  createdAt: string;
}

// === DRAFT TYPES ===

export type DraftNeedPriority = "primary" | "secondary" | "tertiary" | "depth";
export type DraftSuccess = "big_bust" | "weak_draft" | "solid_draft" | "draft_steal";

export interface DraftPick {
  position: PlayerPosition;
  priority: DraftNeedPriority;
  player: CommissionerPlayer;
}

export interface DraftRecord {
  season: number;
  teamId: string;
  success: DraftSuccess;
  picks: DraftPick[];
}

// === COMMISSIONER TEAM ===

export interface CommissionerTeam {
  id: string;
  teamStoreId: string; // Reference to FdfTeam in team-store
  leagueId: string;
  // Classic Mode data
  classicData?: ClassicTeamData;
  // Player Mode data
  roster?: CommissionerPlayer[];
  headCoach?: HeadCoach;
  // Temporary modifications (Weekly Headlines, Breaking News)
  temporaryModifiers: TemporaryModifier[];
}

// === LEAGUE SETTINGS ===

export interface LeagueSettings {
  defenseScheme: DefenseScheme;
  era: string;
  seasonLength: number;
  playoffTeams: number;
  // Classic Mode specific
  xpFrom2YardLine?: boolean; // Use 2-yard XP table
}

// === COMMISSIONER LEAGUE ===

export interface CommissionerLeague {
  id: string;
  name: string;
  mode: CommissionerMode;
  currentSeason: number;
  currentWeek: number;
  currentPhase: LeaguePhase;
  teams: CommissionerTeam[];
  // Player Mode
  freeAgents: CommissionerPlayer[];
  draftHistory: DraftRecord[];
  // Shared
  headlineHistory: HeadlineRecord[];
  settings: LeagueSettings;
  // Season linkage
  seasonIds: string[]; // References to FdfSeason in season-store
  // Classic Mode tracking
  qv?: number; // Quality Values per team
  cdv?: number; // Card Draw Values
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// === COMMISSIONER STORE STATE ===

export interface CommissionerState {
  leagues: Record<string, CommissionerLeague>;
  activeLeagueId: string | null;
}
