import type { FinderRoster, FinderPlayer } from "./types";
import { generateId } from "./id";

type FinderCategory = keyof FinderRoster;

const SECTION_HEADERS: Record<string, FinderCategory> = {
  "RUSHING TD": "rushingTD",
  "PASSING TD": "passingTD",
  "RECEIVING TD": "receivingTD",
  "FG & XP": "kickingFGXP",
};

/** Lines matching any of these patterns are noise (not player names). */
const NOISE_PATTERNS: RegExp[] = [
  // Conference / division
  /^(NFC|AFC)\s+(North|South|East|West)$/i,
  // Team record like 13-4, 8-9
  /^\d{1,2}-\d{1,2}$/,
  // Head Coach line
  /^Head Coach:/i,
  // Team Rating
  /^TR:\s*/i,
  // Offense / Defense labels
  /^OFFENSE\b/i,
  /^DEFENSE\b/i,
  // Special teams labels (standalone)
  /^KR(\s|$)/i,
  /^PR(\s|$)/i,
  // FG / XP range lines (team-level, e.g. "FG 11-62")
  /^FG\s+\d+-\d+$/i,
  /^XP\s+\d+-\d+$/i,
  // Product name
  /^Fast Drive Football$/i,
  // Division champions
  /^Division Champions$/i,
  // Year + team name (e.g. "2024 Arizona")
  /^\d{4}\s+\w/,
  // Quality words (with optional bullet • and optional semi •)
  /^(PROLIFIC|DULL|DYNAMIC|ERRATIC|SOLID|POROUS|RELIABLE|SHAKY|SECURE|CLUMSY|DISCIPLINED|UNDISCIPLINED|EFFICIENT|INEFFICIENT|STAUNCH|INEPT|STIFF|SOFT|PUNISHING|MILD|AGGRESSIVE|MEEK|ACTIVE|PASSIVE|ELECTRIC)•?$/i,
  // Scoring tendency labels
  /^\[?[PR]\+?\]?$/i,
];

/** Matches a finder range line: two numbers separated by whitespace (e.g. "11 34"). */
const RANGE_PATTERN = /^(\d+)\s+(\d+)$/;

function isNoiseLine(line: string): boolean {
  return NOISE_PATTERNS.some((p) => p.test(line));
}

function isSectionHeader(line: string): FinderCategory | null {
  return SECTION_HEADERS[line] ?? null;
}

function isRangeLine(line: string): string | null {
  const m = line.match(RANGE_PATTERN);
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
}

interface SectionData {
  category: FinderCategory;
  playerNames: string[];
  ranges: string[];
}

/**
 * Parse a team file in the FDF Enhanced format.
 *
 * Format per section:
 *   SECTION HEADER (e.g. "RUSHING TD")
 *   Player Name 1
 *   Player Name 2
 *   ...
 *   (blank line)
 *   11 34          ← range for player 1
 *   35 52          ← range for player 2
 *   ...
 *
 * Returns a FinderRoster with deduplicated player IDs and any warnings.
 */
export function parseTeamFile(text: string): { roster: FinderRoster; warnings: string[] } {
  const lines = text.split(/\r?\n/);
  const warnings: string[] = [];
  const sections: SectionData[] = [];

  type State = "idle" | "players" | "ranges";
  let state: State = "idle";
  let current: SectionData | null = null;

  const finalizeSection = () => {
    if (current && current.playerNames.length > 0) {
      sections.push(current);
    }
    current = null;
    state = "idle";
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Check for section header
    const headerCat = isSectionHeader(line);
    if (headerCat !== null) {
      // Finalize previous section if any
      if (current) finalizeSection();
      current = { category: headerCat, playerNames: [], ranges: [] };
      state = "players";
      continue;
    }

    if (state === "idle") {
      // Skip everything until next section header
      continue;
    }

    if (state === "players") {
      if (line === "") {
        // Blank line: transition to ranges
        if (current && current.playerNames.length > 0) {
          state = "ranges";
        }
        continue;
      }

      // Check if this is actually a range line (player section ended without blank line)
      const range = isRangeLine(line);
      if (range !== null) {
        state = "ranges";
        current!.ranges.push(range);
        continue;
      }

      // Skip noise lines
      if (isNoiseLine(line)) continue;

      // It's a player name
      current!.playerNames.push(line);
      continue;
    }

    if (state === "ranges") {
      if (line === "") {
        // Blank line: end of ranges for this section
        finalizeSection();
        continue;
      }

      const range = isRangeLine(line);
      if (range !== null) {
        current!.ranges.push(range);
        continue;
      }

      // Non-range, non-blank line: end of this section
      finalizeSection();
      // Don't lose this line — but it's either noise or will be caught as a header
      // on the next iteration (we already checked headerCat above)
      continue;
    }
  }

  // Finalize last section if file ends mid-section
  if (current) finalizeSection();

  // Build the roster from parsed sections
  const roster: FinderRoster = {
    rushingTD: [],
    passingTD: [],
    receivingTD: [],
    kickingFGXP: [],
  };

  // Track player IDs by name (lowercase) for deduplication across categories
  const idMap = new Map<string, string>();

  for (const section of sections) {
    const { category, playerNames, ranges } = section;

    if (ranges.length > 0 && ranges.length !== playerNames.length) {
      warnings.push(
        `${category}: ${playerNames.length} player${playerNames.length !== 1 ? "s" : ""} but ${ranges.length} range${ranges.length !== 1 ? "s" : ""}`
      );
    }

    const players: FinderPlayer[] = playerNames.map((name, idx) => {
      const nameKey = name.toLowerCase();
      let id = idMap.get(nameKey);
      if (!id) {
        id = generateId();
        idMap.set(nameKey, id);
      }

      return {
        id,
        name,
        finderRange: idx < ranges.length ? ranges[idx] : undefined,
      };
    });

    // If category already has entries (duplicate section in file), append
    roster[category] = [...roster[category], ...players];
  }

  return { roster, warnings };
}
