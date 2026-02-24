import type { DriveResultType, TeamRoster, PlayerEntry, RosterPosition, PlayerFinderRanges, FinderRoster, FinderPlayer, PATResult } from "./types";

/**
 * Describes which player fields to show for a given drive result.
 * Each field has a label, an "isRequired" flag, and which roster side / positions to pull from.
 */
export interface PlayerField {
  key: string;
  label: string;
  required: boolean;
  side: "offense" | "defense";
  positions: RosterPosition[];
}

/**
 * Returns the player-involvement fields that should be shown for a given drive result type.
 */
export function getPlayerFieldsForResult(result: DriveResultType): PlayerField[] {
  switch (result) {
    // Passing touchdowns
    case "TD_PASS":
      return [
        { key: "quarterback", label: "Quarterback", required: true, side: "offense", positions: ["QB"] },
        { key: "scorer", label: "Receiver", required: true, side: "offense", positions: ["WR", "TE", "RB"] },
      ];

    // Rushing touchdowns
    case "TD_RUN":
      return [
        { key: "quarterback", label: "Quarterback", required: false, side: "offense", positions: ["QB"] },
        { key: "scorer", label: "Ball Carrier", required: true, side: "offense", positions: ["RB", "QB", "WR"] },
      ];

    // Field goal attempts
    case "FGA_GOOD":
    case "FGA_MISSED":
    case "DESPERATION_FGA":
      return [
        { key: "kicker", label: "Kicker", required: true, side: "offense", positions: ["K"] },
      ];

    // Interception (offense threw it, defense caught it)
    case "INTERCEPTION":
      return [
        { key: "quarterback", label: "Quarterback", required: false, side: "offense", positions: ["QB"] },
        { key: "interceptedBy", label: "Intercepted By", required: false, side: "defense", positions: ["CB", "S", "LB"] },
      ];

    // Fumble
    case "FUMBLE":
      return [
        { key: "fumbleRecoveredBy", label: "Recovered By", required: false, side: "defense", positions: ["DL", "LB", "CB", "S"] },
      ];

    // Safety
    case "SAFETY":
      return [
        { key: "sackBy", label: "Sack By", required: false, side: "defense", positions: ["DL", "LB"] },
      ];

    // Return TDs — scored by the offense (drive team = scoring team)
    case "KICKOFF_RETURN_TD":
      return [
        { key: "returnedBy", label: "Returner", required: true, side: "offense", positions: ["KR", "WR", "RB"] },
      ];
    case "PUNT_RETURN_TD":
      return [
        { key: "returnedBy", label: "Returner", required: true, side: "offense", positions: ["PR", "WR", "RB"] },
      ];
    case "INTERCEPTION_RETURN_TD":
      return [
        { key: "returnedBy", label: "Returned By", required: false, side: "offense", positions: ["CB", "S", "LB"] },
      ];
    case "FUMBLE_RETURN_TD":
      return [
        { key: "returnedBy", label: "Returned By", required: false, side: "offense", positions: ["DL", "LB", "CB", "S"] },
      ];
    case "BLOCKED_FG_RETURN_TD":
    case "BLOCKED_PUNT_TD":
      return [
        { key: "returnedBy", label: "Returned By", required: false, side: "offense", positions: ["DL", "LB", "CB", "S"] },
      ];
    case "FREE_KICK_RETURN_TD":
      return [
        { key: "returnedBy", label: "Returner", required: true, side: "offense", positions: ["KR", "WR", "RB"] },
      ];

    // Kick-Off/Punt fumble outcomes — no player fields
    case "KICK_PUNT_REC_RECOVERS":
    case "KICK_PUNT_KICK_RECOVERS":
    case "KICK_PUNT_KICK_TD":
      return [];

    // Desperation TDs
    case "DESPERATION_TD":
      return [
        { key: "quarterback", label: "Quarterback", required: false, side: "offense", positions: ["QB"] },
        { key: "scorer", label: "Scorer", required: false, side: "offense", positions: ["WR", "TE", "RB", "QB"] },
      ];

    // Punt variants, kneel down, turnover on downs, end-of-half/game, unusual — no player fields
    default:
      return [];
  }
}

/**
 * Gets all players from a roster that match any of the given positions.
 */
export function getPlayersForPositions(roster: TeamRoster, positions: RosterPosition[]): PlayerEntry[] {
  const players: PlayerEntry[] = [];
  const seen = new Set<string>();

  const addIfMatch = (player: PlayerEntry | undefined) => {
    if (player && positions.includes(player.position) && player.name.trim() && !seen.has(player.id)) {
      seen.add(player.id);
      players.push(player);
    }
  };

  // Check all roster slots
  roster.quarterbacks.forEach(addIfMatch);
  roster.runningBacks.forEach(addIfMatch);
  roster.receivers.forEach(addIfMatch);
  addIfMatch(roster.kicker);
  addIfMatch(roster.punter);
  roster.defensiveBacks.forEach(addIfMatch);
  roster.linebackers.forEach(addIfMatch);
  roster.defensiveLinemen.forEach(addIfMatch);
  addIfMatch(roster.kickReturner);
  addIfMatch(roster.puntReturner);

  return players;
}

// ============================================================
// Per-category finder range helpers (Enhanced Team Cards)
// ============================================================

/**
 * Returns the relevant finder-range categories for a given roster position.
 * Each entry has a key (into PlayerFinderRanges) and a display label.
 */
export function getFinderRangeLabelsForPosition(
  position: RosterPosition
): { key: keyof PlayerFinderRanges; label: string }[] {
  switch (position) {
    case "QB":
      return [
        { key: "passingTD", label: "Pass TD" },
        { key: "rushingTD", label: "Rush TD" },
      ];
    case "RB":
      return [
        { key: "rushingTD", label: "Rush TD" },
        { key: "receivingTD", label: "Rec TD" },
      ];
    case "WR":
    case "TE":
      return [
        { key: "receivingTD", label: "Rec TD" },
        { key: "rushingTD", label: "Rush TD" },
      ];
    case "K":
      return [{ key: "kickingFGXP", label: "FG/XP" }];
    default:
      return [];
  }
}

/**
 * Returns the most relevant finder range string for a player given a drive result.
 * Falls back to legacy `finderRange` if `finderRanges` is not set.
 */
export function getFinderRangeForContext(
  player: PlayerEntry,
  result: DriveResultType
): string | undefined {
  const ranges = player.finderRanges;
  if (ranges) {
    switch (result) {
      case "TD_RUN":
        return ranges.rushingTD;
      case "TD_PASS":
      case "DESPERATION_TD":
        // QB gets passingTD; receivers get receivingTD
        if (player.position === "QB") return ranges.passingTD;
        return ranges.receivingTD;
      case "FGA_GOOD":
      case "FGA_MISSED":
      case "DESPERATION_FGA":
        return ranges.kickingFGXP;
      default:
        return undefined;
    }
  }
  // Legacy fallback
  return player.finderRange;
}

/**
 * Compact display string showing all non-empty finder ranges for a player.
 * Example: "[Rush:11-34 Rec:65-66]"
 */
export function getFinderRangesDisplay(player: PlayerEntry): string | undefined {
  const ranges = player.finderRanges;
  if (!ranges) {
    return player.finderRange ? `[${player.finderRange}]` : undefined;
  }
  const parts: string[] = [];
  if (ranges.rushingTD) parts.push(`Rush:${ranges.rushingTD}`);
  if (ranges.passingTD) parts.push(`Pass:${ranges.passingTD}`);
  if (ranges.receivingTD) parts.push(`Rec:${ranges.receivingTD}`);
  if (ranges.kickingFGXP) parts.push(`FG:${ranges.kickingFGXP}`);
  return parts.length > 0 ? `[${parts.join(" ")}]` : undefined;
}

// ============================================================
// Sprint 3 — FinderRoster-based player field mapping
// ============================================================

export type FinderCategory = "rushingTD" | "passingTD" | "receivingTD" | "kickingFGXP";

/**
 * Describes a player field for FinderRoster-based selection.
 * Each field references one or more FinderRoster categories.
 */
export interface FinderPlayerField {
  key: string;
  label: string;
  required: boolean;
  categories: FinderCategory[];
}

/**
 * Returns the player-involvement fields for a drive result, sourced from
 * FinderRoster categories (no defense players).
 */
export function getFinderPlayerFieldsForResult(result: DriveResultType): FinderPlayerField[] {
  switch (result) {
    case "TD_PASS":
      return [
        { key: "quarterback", label: "Quarterback", required: true, categories: ["passingTD"] },
        { key: "scorer", label: "Receiver", required: true, categories: ["receivingTD"] },
      ];

    case "TD_RUN":
      return [
        { key: "scorer", label: "Ball Carrier", required: true, categories: ["rushingTD"] },
      ];

    case "FGA_GOOD":
    case "FGA_MISSED":
    case "DESPERATION_FGA":
      return [
        { key: "kicker", label: "Kicker", required: true, categories: ["kickingFGXP"] },
      ];

    case "INTERCEPTION":
      return [
        { key: "quarterback", label: "Quarterback", required: false, categories: ["passingTD"] },
      ];

    case "FUMBLE":
      return [
        { key: "scorer", label: "Ball Carrier", required: false, categories: ["rushingTD", "receivingTD"] },
      ];

    case "DESPERATION_TD":
      return [
        { key: "quarterback", label: "Quarterback", required: false, categories: ["passingTD"] },
        { key: "scorer", label: "Scorer", required: false, categories: ["receivingTD"] },
      ];

    // No defense players for return TDs, safeties, punts, etc.
    default:
      return [];
  }
}

/**
 * Returns FinderPlayerField for PAT player selection.
 */
export function getFinderPATFieldsForResult(patResult: PATResult): FinderPlayerField[] {
  switch (patResult) {
    case "XP_GOOD":
    case "XP_MISSED":
      return [
        { key: "patKicker", label: "Kicker", required: false, categories: ["kickingFGXP"] },
      ];
    case "2PT_GOOD":
    case "2PT_FAILED":
      return [
        { key: "patPasser", label: "QB", required: false, categories: ["passingTD"] },
        { key: "patReceiver", label: "Receiver/Runner", required: false, categories: ["receivingTD", "rushingTD"] },
      ];
    default:
      return [];
  }
}

/**
 * Gets all FinderPlayers from the specified categories, deduped by ID.
 */
export function getFinderPlayersForCategories(
  roster: FinderRoster,
  categories: FinderCategory[]
): FinderPlayer[] {
  const seen = new Set<string>();
  const players: FinderPlayer[] = [];
  for (const cat of categories) {
    for (const player of roster[cat]) {
      if (player.name.trim() && !seen.has(player.id)) {
        seen.add(player.id);
        players.push(player);
      }
    }
  }
  return players;
}

/**
 * Get all unique players across all FinderRoster categories.
 */
export function getAllFinderPlayers(roster: FinderRoster): FinderPlayer[] {
  return getFinderPlayersForCategories(roster, ["rushingTD", "passingTD", "receivingTD", "kickingFGXP"]);
}

/**
 * Find a player in a FinderRoster by ID, searching all categories.
 */
export function findPlayerInFinderRoster(roster: FinderRoster, playerId: string): FinderPlayer | undefined {
  for (const cat of ["rushingTD", "passingTD", "receivingTD", "kickingFGXP"] as FinderCategory[]) {
    const player = roster[cat].find(p => p.id === playerId);
    if (player) return player;
  }
  return undefined;
}
