import type { ScheduleGame, FdfTeam } from "./types";
import { generateId } from "./id";

export interface ParsedScheduleRow {
  week: number;
  away: string;
  home: string;
}

export interface ScheduleParseResult {
  games: ScheduleGame[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse CSV text with format: Week,Away,Home
 * Returns parsed rows. Header row is optional (auto-detected).
 */
export function parseScheduleCSV(csv: string): { rows: ParsedScheduleRow[]; errors: string[] } {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ["No data found"] };
  }

  const rows: ParsedScheduleRow[] = [];
  const errors: string[] = [];

  // Detect header row
  const firstLine = lines[0].toLowerCase();
  const startIdx =
    firstLine.includes("week") && (firstLine.includes("away") || firstLine.includes("home"))
      ? 1
      : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim());
    if (parts.length < 3) {
      errors.push(`Line ${i + 1}: Expected 3 columns (Week,Away,Home), got ${parts.length}`);
      continue;
    }

    const week = parseInt(parts[0], 10);
    if (isNaN(week) || week < 1) {
      errors.push(`Line ${i + 1}: Invalid week number "${parts[0]}"`);
      continue;
    }

    const away = parts[1];
    const home = parts[2];
    if (!away || !home) {
      errors.push(`Line ${i + 1}: Missing team name`);
      continue;
    }

    rows.push({ week, away, home });
  }

  return { rows, errors };
}

/**
 * Match parsed schedule rows to actual team IDs.
 * Matches by abbreviation or name (case-insensitive).
 */
export function matchTeamsToSchedule(
  rows: ParsedScheduleRow[],
  teams: FdfTeam[]
): ScheduleParseResult {
  const games: ScheduleGame[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Build lookup maps
  const byAbbr = new Map<string, FdfTeam>();
  const byName = new Map<string, FdfTeam>();
  for (const team of teams) {
    byAbbr.set(team.abbreviation.toLowerCase(), team);
    byName.set(team.name.toLowerCase(), team);
  }

  const findTeam = (input: string): FdfTeam | undefined => {
    const lower = input.toLowerCase();
    return byAbbr.get(lower) || byName.get(lower);
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Check for BYE
    if (row.away.toLowerCase() === "bye" || row.home.toLowerCase() === "bye") {
      const teamName = row.away.toLowerCase() === "bye" ? row.home : row.away;
      const team = findTeam(teamName);
      if (!team) {
        errors.push(`Row ${i + 1}: Team "${teamName}" not found`);
        continue;
      }
      games.push({
        id: generateId(),
        week: row.week,
        homeTeamId: team.id,
        awayTeamId: team.id,
        isBye: true,
      });
      continue;
    }

    const awayTeam = findTeam(row.away);
    const homeTeam = findTeam(row.home);

    if (!awayTeam) {
      errors.push(`Row ${i + 1}: Away team "${row.away}" not found`);
    }
    if (!homeTeam) {
      errors.push(`Row ${i + 1}: Home team "${row.home}" not found`);
    }
    if (!awayTeam || !homeTeam) continue;

    if (awayTeam.id === homeTeam.id) {
      warnings.push(`Row ${i + 1}: Team "${row.away}" plays itself — skipped`);
      continue;
    }

    games.push({
      id: generateId(),
      week: row.week,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
    });
  }

  return { games, errors, warnings };
}
