import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn cn helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ================================================================
// SPORT COLOR MAPPING
// ================================================================

const SPORT_COLORS: Record<string, string> = {
  "American Football": "#d4531a",
  "Football": "#d4531a",
  "Baseball": "#c44b3b",
  "Basketball": "#e07b39",
  "Ice Hockey": "#4a84b8",
  "Hockey": "#4a84b8",
  "Soccer": "#4d8464",
  "Tennis": "#c8b83a",
  "Golf": "#5a7c42",
  "Auto Racing": "#d4a843",
  "Racing": "#d4a843",
  "Cricket": "#b5863a",
  "Rugby": "#8b5e3c",
  "Cycling": "#4a84b8",
  "Boxing": "#c44b3b",
};

export function getSportColor(sport: string | null | undefined): string {
  if (!sport) return "#d4a843";
  return SPORT_COLORS[sport] ?? "#d4a843";
}

// ================================================================
// PLAYTIME PARSING
// ================================================================

export function parsePlaytime(playtime: string | null | undefined): string {
  if (!playtime) return "—";
  // Already has "min" or "hour" text
  if (/min|hour|hr/i.test(playtime)) return playtime;
  // Pure number → assume minutes
  const num = parseInt(playtime, 10);
  if (isNaN(num)) return playtime;
  if (num >= 60) {
    const h = Math.floor(num / 60);
    const m = num % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${num} min`;
}

// ================================================================
// TEXT HELPERS
// ================================================================

/** Split semicolon-separated strings into arrays */
export function splitSemicolon(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Truncate text to max chars, adding ellipsis */
export function truncate(text: string | null | undefined, max = 150): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

/** Format a number with commas */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

/** Format a rating to 1 decimal */
export function formatRating(n: number | null | undefined): string {
  if (n == null || n === 0) return "—";
  return n.toFixed(1);
}

// ================================================================
// URL / SLUG HELPERS
// ================================================================

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Get a game's best display image (fallback chain) */
export function getGameImage(game: {
  image_url?: string | null;
  top_image_url?: string | null;
  thumbnail_url?: string | null;
  image_1_url?: string | null;
}): string | null {
  return (
    game.top_image_url ??
    game.image_url ??
    game.image_1_url ??
    game.thumbnail_url ??
    null
  );
}

// ================================================================
// DATE FORMATTING
// ================================================================

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatYear(year: number | null | undefined): string {
  if (!year) return "—";
  return String(year);
}

// ================================================================
// COMPLEXITY DISPLAY
// ================================================================

export function complexityLabel(c: string | null | undefined): string {
  return c ?? "Unknown";
}

export function complexityClass(c: string | null | undefined): string {
  switch (c) {
    case "Simple":  return "badge-simple";
    case "Medium":  return "badge-medium";
    case "Complex": return "badge-complex";
    case "Expert":  return "badge-expert";
    default:        return "badge-medium";
  }
}
