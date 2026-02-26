// ============================================================
// FDF Team Import — Text & JSON parser
// ============================================================

import type {
  FdfTeam,
  TeamQualities,
  TeamKicking,
  FinderRoster,
  FinderPlayer,
  ClockQualityLevel,
} from "./types";
import { generateId } from "./id";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface ParsedTeamImport {
  name: string;
  abbreviation: string;
  season: number;
  league: FdfTeam["league"];
  conference?: string;
  division?: string;
  record?: string;
  headCoach?: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  notes?: string;
  qualities: TeamQualities;
  kicking: TeamKicking;
  finderRoster?: FinderRoster;
}

export interface TeamImportResult {
  teams: ParsedTeamImport[];
  errors: string[];
  warnings: string[];
}

// ------------------------------------------------------------
// Defaults
// ------------------------------------------------------------

function defaultQualities(): TeamQualities {
  return {
    offense: {
      scoring: null, scoringSemi: false,
      yards: null, yardsSemi: false,
      protection: null, protectionSemi: false,
      ballSecurity: null, ballSecuritySemi: false,
      fumbles: null, fumblesSemi: false,
      discipline: null, disciplineSemi: false,
      clockManagement: null, clockManagementLevel: null,
      scoringTendency: null,
    },
    defense: {
      scoring: null, scoringSemi: false,
      yards: null, yardsSemi: false,
      passRush: null, passRushSemi: false,
      coverage: null, coverageSemi: false,
      fumbleRecovery: null, fumbleRecoverySemi: false,
      discipline: null, disciplineSemi: false,
    },
    specialTeams: {
      kickReturn: null, kickReturnSemi: false,
      puntReturn: null, puntReturnSemi: false,
    },
  };
}

function defaultKicking(): TeamKicking {
  return { fgRange: "", xpRange: "" };
}

// ------------------------------------------------------------
// Quality value parsing
// ------------------------------------------------------------

const VALID_OFFENSE_SCORING = ["PROLIFIC", "DULL"] as const;
const VALID_OFFENSE_YARDS = ["DYNAMIC", "ERRATIC"] as const;
const VALID_OFFENSE_PROTECTION = ["SOLID", "POROUS"] as const;
const VALID_OFFENSE_BALL_SECURITY = ["RELIABLE", "SHAKY"] as const;
const VALID_OFFENSE_FUMBLES = ["SECURE", "CLUMSY"] as const;
const VALID_DISCIPLINE = ["DISCIPLINED", "UNDISCIPLINED"] as const;
const VALID_DEFENSE_SCORING = ["STAUNCH", "INEPT"] as const;
const VALID_DEFENSE_YARDS = ["STIFF", "SOFT"] as const;
const VALID_DEFENSE_PASS_RUSH = ["PUNISHING", "MILD"] as const;
const VALID_DEFENSE_COVERAGE = ["AGGRESSIVE", "MEEK"] as const;
const VALID_DEFENSE_FUMBLE_RECOVERY = ["ACTIVE", "PASSIVE"] as const;
const VALID_TENDENCY = ["P+", "P", "R", "R+"] as const;

function parseQualityValue(raw: string): { quality: string | null; semi: boolean } {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "—" || trimmed === "-" || trimmed.toLowerCase() === "none") {
    return { quality: null, semi: false };
  }
  // Check for semi markers: trailing * or bullet
  if (trimmed.endsWith("*") || trimmed.endsWith("\u2022")) {
    return { quality: trimmed.slice(0, -1).trim().toUpperCase(), semi: true };
  }
  return { quality: trimmed.toUpperCase(), semi: false };
}

function parseClockValue(raw: string): { quality: "EFFICIENT" | "INEFFICIENT" | null; level: ClockQualityLevel } {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "—" || trimmed === "-" || trimmed.toLowerCase() === "none") {
    return { quality: null, level: null };
  }

  const upper = trimmed.toUpperCase().replace(/[*\u2022]$/, "");
  const hasSemi = trimmed.endsWith("*") || trimmed.endsWith("\u2022");
  const hasSuper = upper.startsWith("SUPER ");

  const base = upper.replace(/^SUPER\s+/, "");
  // Normalize
  if (base === "EFFICIENT" || base === "INEFFICIENT") {
    const quality = base as "EFFICIENT" | "INEFFICIENT";
    let level: ClockQualityLevel;
    if (hasSuper) level = "super";
    else if (hasSemi) level = "semi";
    else level = "full";
    return { quality, level };
  }

  return { quality: null, level: null };
}

function isValidIn<T extends string>(value: string, valid: readonly T[]): value is T {
  return (valid as readonly string[]).includes(value);
}

// ------------------------------------------------------------
// Roster line parsing (Name, Range)
// ------------------------------------------------------------

function parseRosterLine(line: string): FinderPlayer | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(",").map(s => s.trim());
  if (!parts[0]) return null;

  return {
    id: generateId(),
    name: parts[0],
    number: undefined,
    finderRange: parts[1] || undefined,
  };
}

// ------------------------------------------------------------
// Text block parser — state machine
// ------------------------------------------------------------

type ParseMode = "metadata" | "offense" | "defense" | "specialTeams" | "rushingTD" | "passingTD" | "receivingTD" | "kickingFGXP";

const SECTION_HEADERS: Record<string, ParseMode> = {
  "OFFENSE": "offense",
  "DEFENSE": "defense",
  "SPECIAL TEAMS": "specialTeams",
  "RUSHING TD": "rushingTD",
  "PASSING TD": "passingTD",
  "RECEIVING TD": "receivingTD",
  "FG & XP": "kickingFGXP",
  "FG AND XP": "kickingFGXP",
  "FG&XP": "kickingFGXP",
  "KICKING": "kickingFGXP",
};

interface ParseBlockResult {
  team: Partial<ParsedTeamImport>;
  blockErrors: string[];
  blockWarnings: string[];
}

function parseTeamBlock(lines: string[], blockIndex: number): ParseBlockResult {
  const label = blockIndex > 0 ? ` (team #${blockIndex + 1})` : "";
  const errors: string[] = [];
  const warnings: string[] = [];

  let mode: ParseMode = "metadata";
  const qualities = defaultQualities();
  const kicking = defaultKicking();
  const roster: FinderRoster = { rushingTD: [], passingTD: [], receivingTD: [], kickingFGXP: [] };

  let name = "";
  let abbreviation = "";
  let season = 2024;
  let league: FdfTeam["league"] = "NFL";
  let conference: string | undefined;
  let division: string | undefined;
  let record: string | undefined;
  let headCoach: string | undefined;
  let primaryColor = "#3b82f6";
  let secondaryColor = "#ffffff";
  let logoUrl: string | undefined;
  let notes: string | undefined;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for section header
    const upperLine = line.toUpperCase();
    if (SECTION_HEADERS[upperLine] !== undefined) {
      mode = SECTION_HEADERS[upperLine];
      continue;
    }

    // Metadata mode — KEY: VALUE
    if (mode === "metadata") {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const key = line.slice(0, colonIdx).trim().toUpperCase();
      const value = line.slice(colonIdx + 1).trim();

      switch (key) {
        case "NAME": name = value; break;
        case "ABR":
        case "ABBREVIATION": abbreviation = value.toUpperCase(); break;
        case "SEASON":
        case "YEAR": {
          const n = parseInt(value, 10);
          if (!isNaN(n)) season = n;
          break;
        }
        case "LEAGUE": {
          const ul = value.toUpperCase();
          const validLeagues: FdfTeam["league"][] = ["NFL", "AFL", "USFL", "XFL", "AAF", "WFL", "Custom"];
          const found = validLeagues.find(l => l.toUpperCase() === ul);
          if (found) league = found;
          else { league = "Custom"; warnings.push(`Unknown league "${value}"${label}, defaulting to Custom`); }
          break;
        }
        case "CONFERENCE": conference = value; break;
        case "DIVISION": division = value; break;
        case "RECORD": record = value; break;
        case "HEAD COACH":
        case "COACH": headCoach = value; break;
        case "COLOR":
        case "COLOR1":
        case "PRIMARY COLOR": primaryColor = value; break;
        case "COLOR2":
        case "SECONDARY COLOR": secondaryColor = value; break;
        case "LOGO":
        case "LOGO URL": logoUrl = value; break;
        case "NOTES": notes = value; break;
        case "FG": kicking.fgRange = value; break;
        case "XP": kicking.xpRange = value; break;
        default:
          // Might be an unrecognized metadata key — ignore silently
          break;
      }
      continue;
    }

    // Quality sections
    if (mode === "offense" || mode === "defense" || mode === "specialTeams") {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const qualLabel = line.slice(0, colonIdx).trim().toUpperCase();
      const qualRaw = line.slice(colonIdx + 1).trim();

      if (mode === "offense") {
        switch (qualLabel) {
          case "SCORING": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_OFFENSE_SCORING)) {
              qualities.offense.scoring = quality;
              qualities.offense.scoringSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown offense scoring quality "${qualRaw}"${label}`);
            }
            break;
          }
          case "YARDS": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_OFFENSE_YARDS)) {
              qualities.offense.yards = quality;
              qualities.offense.yardsSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown offense yards quality "${qualRaw}"${label}`);
            }
            break;
          }
          case "PROTECTION": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_OFFENSE_PROTECTION)) {
              qualities.offense.protection = quality;
              qualities.offense.protectionSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown offense protection quality "${qualRaw}"${label}`);
            }
            break;
          }
          case "BALL SECURITY": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_OFFENSE_BALL_SECURITY)) {
              qualities.offense.ballSecurity = quality;
              qualities.offense.ballSecuritySemi = semi;
            } else if (quality) {
              warnings.push(`Unknown offense ball security quality "${qualRaw}"${label}`);
            }
            break;
          }
          case "FUMBLES": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_OFFENSE_FUMBLES)) {
              qualities.offense.fumbles = quality;
              qualities.offense.fumblesSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown offense fumbles quality "${qualRaw}"${label}`);
            }
            break;
          }
          case "DISCIPLINE": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_DISCIPLINE)) {
              qualities.offense.discipline = quality;
              qualities.offense.disciplineSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown offense discipline quality "${qualRaw}"${label}`);
            }
            break;
          }
          case "CLOCK":
          case "CLOCK MANAGEMENT": {
            const { quality, level } = parseClockValue(qualRaw);
            if (quality) {
              qualities.offense.clockManagement = quality;
              qualities.offense.clockManagementLevel = level;
            } else if (qualRaw && qualRaw !== "—" && qualRaw !== "-") {
              warnings.push(`Unknown clock management value "${qualRaw}"${label}`);
            }
            break;
          }
          case "TENDENCY":
          case "SCORING TENDENCY": {
            const val = qualRaw.toUpperCase().trim();
            if (isValidIn(val, VALID_TENDENCY)) {
              qualities.offense.scoringTendency = val;
            } else if (val && val !== "—" && val !== "-") {
              warnings.push(`Unknown scoring tendency "${qualRaw}"${label}`);
            }
            break;
          }
          default:
            warnings.push(`Unknown offense quality "${qualLabel}"${label}`);
        }
      } else if (mode === "defense") {
        switch (qualLabel) {
          case "SCORING": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_DEFENSE_SCORING)) {
              qualities.defense.scoring = quality;
              qualities.defense.scoringSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown defense scoring quality "${qualRaw}"${label}`);
            }
            break;
          }
          case "YARDS": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_DEFENSE_YARDS)) {
              qualities.defense.yards = quality;
              qualities.defense.yardsSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown defense yards quality "${qualRaw}"${label}`);
            }
            break;
          }
          case "PASS RUSH": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_DEFENSE_PASS_RUSH)) {
              qualities.defense.passRush = quality;
              qualities.defense.passRushSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown defense pass rush quality "${qualRaw}"${label}`);
            }
            break;
          }
          case "COVERAGE": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_DEFENSE_COVERAGE)) {
              qualities.defense.coverage = quality;
              qualities.defense.coverageSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown defense coverage quality "${qualRaw}"${label}`);
            }
            break;
          }
          case "FUMBLE RECOVERY": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_DEFENSE_FUMBLE_RECOVERY)) {
              qualities.defense.fumbleRecovery = quality;
              qualities.defense.fumbleRecoverySemi = semi;
            } else if (quality) {
              warnings.push(`Unknown defense fumble recovery quality "${qualRaw}"${label}`);
            }
            break;
          }
          case "DISCIPLINE": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality && isValidIn(quality, VALID_DISCIPLINE)) {
              qualities.defense.discipline = quality;
              qualities.defense.disciplineSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown defense discipline quality "${qualRaw}"${label}`);
            }
            break;
          }
          default:
            warnings.push(`Unknown defense quality "${qualLabel}"${label}`);
        }
      } else {
        // specialTeams
        switch (qualLabel) {
          case "KR":
          case "KICK RETURN": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality === "ELECTRIC") {
              qualities.specialTeams.kickReturn = "ELECTRIC";
              qualities.specialTeams.kickReturnSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown KR quality "${qualRaw}"${label} (only ELECTRIC is valid)`);
            }
            break;
          }
          case "PR":
          case "PUNT RETURN": {
            const { quality, semi } = parseQualityValue(qualRaw);
            if (quality === "ELECTRIC") {
              qualities.specialTeams.puntReturn = "ELECTRIC";
              qualities.specialTeams.puntReturnSemi = semi;
            } else if (quality) {
              warnings.push(`Unknown PR quality "${qualRaw}"${label} (only ELECTRIC is valid)`);
            }
            break;
          }
          default:
            warnings.push(`Unknown special teams quality "${qualLabel}"${label}`);
        }
      }
      continue;
    }

    // Roster modes
    if (mode === "rushingTD" || mode === "passingTD" || mode === "receivingTD" || mode === "kickingFGXP") {
      const player = parseRosterLine(line);
      if (player) {
        roster[mode].push(player);
      }
      continue;
    }
  }

  // Validation
  if (!name) errors.push(`Missing NAME${label}`);
  if (!abbreviation) errors.push(`Missing ABR${label}`);

  const hasRoster = roster.rushingTD.length > 0 || roster.passingTD.length > 0
    || roster.receivingTD.length > 0 || roster.kickingFGXP.length > 0;

  if (!hasRoster) {
    warnings.push(`No roster players found${label}`);
  }

  const team: ParsedTeamImport = {
    name,
    abbreviation,
    season,
    league,
    conference,
    division,
    record,
    headCoach,
    primaryColor,
    secondaryColor,
    logoUrl,
    notes,
    qualities,
    kicking,
    finderRoster: hasRoster ? roster : undefined,
  };

  return { team, blockErrors: errors, blockWarnings: warnings };
}

// ------------------------------------------------------------
// JSON fallback parser
// ------------------------------------------------------------

function parseJsonImport(text: string): TeamImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { teams: [], errors: ["Invalid JSON: " + (text.slice(0, 60) + "...")], warnings: [] };
  }

  const arr = Array.isArray(parsed) ? parsed : [parsed];
  const teams: ParsedTeamImport[] = [];

  for (let i = 0; i < arr.length; i++) {
    const obj = arr[i];
    const label = arr.length > 1 ? ` (team #${i + 1})` : "";

    if (!obj || typeof obj !== "object") {
      errors.push(`Invalid team object${label}`);
      continue;
    }

    const t = obj as Record<string, unknown>;

    if (!t.name || typeof t.name !== "string") {
      errors.push(`Missing name${label}`);
      continue;
    }
    if (!t.abbreviation || typeof t.abbreviation !== "string") {
      errors.push(`Missing abbreviation${label}`);
      continue;
    }

    teams.push({
      name: t.name,
      abbreviation: (t.abbreviation as string).toUpperCase(),
      season: typeof t.season === "number" ? t.season : 2024,
      league: (typeof t.league === "string" && ["NFL", "AFL", "USFL", "XFL", "AAF", "WFL", "Custom"].includes(t.league))
        ? t.league as FdfTeam["league"]
        : "NFL",
      conference: typeof t.conference === "string" ? t.conference : undefined,
      division: typeof t.division === "string" ? t.division : undefined,
      record: typeof t.record === "string" ? t.record : undefined,
      headCoach: typeof t.headCoach === "string" ? t.headCoach : undefined,
      primaryColor: typeof t.primaryColor === "string" ? t.primaryColor : "#3b82f6",
      secondaryColor: typeof t.secondaryColor === "string" ? t.secondaryColor : "#ffffff",
      logoUrl: typeof t.logoUrl === "string" ? t.logoUrl : undefined,
      notes: typeof t.notes === "string" ? t.notes : undefined,
      qualities: (t.qualities && typeof t.qualities === "object") ? t.qualities as TeamQualities : defaultQualities(),
      kicking: (t.kicking && typeof t.kicking === "object") ? t.kicking as TeamKicking : defaultKicking(),
      finderRoster: (t.finderRoster && typeof t.finderRoster === "object") ? t.finderRoster as FinderRoster : undefined,
    });
  }

  return { teams, errors, warnings };
}

// ------------------------------------------------------------
// Main entry point
// ------------------------------------------------------------

export function parseTeamImport(text: string): TeamImportResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { teams: [], errors: ["No input provided"], warnings: [] };
  }

  // Auto-detect JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseJsonImport(trimmed);
  }

  // Text format — split on --- separator
  const blocks = trimmed.split(/^---+$/m).map(b => b.trim()).filter(Boolean);

  const allTeams: ParsedTeamImport[] = [];
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split("\n");
    const { team, blockErrors, blockWarnings } = parseTeamBlock(lines, i);
    allErrors.push(...blockErrors);
    allWarnings.push(...blockWarnings);

    // Only add team if it has name + abbreviation
    if (team.name && team.abbreviation) {
      allTeams.push(team as ParsedTeamImport);
    }
  }

  return { teams: allTeams, errors: allErrors, warnings: allWarnings };
}

// ------------------------------------------------------------
// Transform to addTeam()-compatible data
// ------------------------------------------------------------

export function toTeamData(parsed: ParsedTeamImport): Omit<FdfTeam, "id" | "createdAt" | "updatedAt"> {
  return {
    name: parsed.name,
    abbreviation: parsed.abbreviation,
    season: parsed.season,
    league: parsed.league,
    conference: parsed.conference,
    division: parsed.division,
    record: parsed.record,
    headCoach: parsed.headCoach,
    primaryColor: parsed.primaryColor,
    secondaryColor: parsed.secondaryColor,
    logoUrl: parsed.logoUrl,
    notes: parsed.notes,
    qualities: parsed.qualities,
    kicking: parsed.kicking,
    finderRoster: parsed.finderRoster,
  };
}
