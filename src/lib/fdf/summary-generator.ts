import type {
  DriveResultType,
  DrivePlayerInvolvement,
  TeamRoster,
  PlayerEntry,
  FinderRoster,
  FieldPosition,
} from "./types";
import { findPlayerInFinderRoster } from "./player-mapping";
import { SUMMARY_TEMPLATES } from "./summary-templates";

export interface SummaryContext {
  result: DriveResultType;
  playerInvolvement: DrivePlayerInvolvement;
  offenseTeamName: string;
  defenseTeamName: string;
  fieldPosition: FieldPosition;
  offenseRoster?: TeamRoster;
  defenseRoster?: TeamRoster;
  offenseFinderRoster?: FinderRoster;
  defenseFinderRoster?: FinderRoster;
}

function findPlayerById(roster: TeamRoster | undefined, playerId: string | undefined): PlayerEntry | undefined {
  if (!roster || !playerId) return undefined;
  const allPlayers: (PlayerEntry | undefined)[] = [
    ...roster.quarterbacks,
    ...roster.runningBacks,
    ...roster.receivers,
    roster.kicker,
    roster.punter,
    ...roster.defensiveBacks,
    ...roster.linebackers,
    ...roster.defensiveLinemen,
    roster.kickReturner,
    roster.puntReturner,
  ];
  return allPlayers.find((p) => p?.id === playerId);
}

function playerLabel(player: { name: string; number?: number } | undefined): string {
  if (!player || !player.name.trim()) return "Unknown";
  return player.number != null ? `${player.name} (#${player.number})` : player.name;
}

/**
 * Resolve a player name from FinderRoster first, then legacy TeamRoster.
 */
function resolvePlayerName(
  ctx: SummaryContext,
  playerId: string | undefined,
  side: "offense" | "defense"
): { name: string; number?: number } | undefined {
  if (!playerId) return undefined;

  // Try FinderRoster first
  const finderRoster = side === "offense" ? ctx.offenseFinderRoster : ctx.defenseFinderRoster;
  if (finderRoster) {
    const fp = findPlayerInFinderRoster(finderRoster, playerId);
    if (fp) return fp;
  }

  // Fallback to legacy TeamRoster
  const legacyRoster = side === "offense" ? ctx.offenseRoster : ctx.defenseRoster;
  return findPlayerById(legacyRoster, playerId);
}

function resolveVariables(
  template: string,
  ctx: SummaryContext
): string {
  const inv = ctx.playerInvolvement;

  const qbPlayer = resolvePlayerName(ctx, inv.quarterback, "offense");
  const scorerPlayer = resolvePlayerName(ctx, inv.scorer, "offense");
  const kickerPlayer = resolvePlayerName(ctx, inv.kicker, "offense");

  // Defensive players
  const interceptedByPlayer = resolvePlayerName(ctx, inv.interceptedBy, "defense");
  const fumbleRecByPlayer = resolvePlayerName(ctx, inv.fumbleRecoveredBy, "defense");
  const sackByPlayer = resolvePlayerName(ctx, inv.sackBy, "defense");
  // Return TD returners are on the offense side (drive team = scoring team)
  const returnedByPlayer = resolvePlayerName(ctx, inv.returnedBy, "offense");
  const defender = interceptedByPlayer || fumbleRecByPlayer || sackByPlayer || returnedByPlayer;

  return template
    .replace(/\{qb\}/g, playerLabel(qbPlayer))
    .replace(/\{receiver\}/g, playerLabel(scorerPlayer))
    .replace(/\{rb\}/g, playerLabel(scorerPlayer || qbPlayer))
    .replace(/\{kicker\}/g, playerLabel(kickerPlayer))
    .replace(/\{defender\}/g, playerLabel(defender))
    .replace(/\{returner\}/g, playerLabel(returnedByPlayer))
    .replace(/\{team\}/g, ctx.offenseTeamName)
    .replace(/\{opponent\}/g, ctx.defenseTeamName)
    .replace(/\{fieldpos\}/g, ctx.fieldPosition.toLowerCase());
}

/**
 * Generate a summary string from a template for the given context.
 */
export function generateSummary(ctx: SummaryContext): string {
  const templates = SUMMARY_TEMPLATES[ctx.result];
  if (!templates || templates.length === 0) {
    return "";
  }
  const idx = Math.floor(Math.random() * templates.length);
  return resolveVariables(templates[idx], ctx);
}

/**
 * Generate a summary that differs from the excluded text.
 */
export function shuffleSummary(ctx: SummaryContext, exclude: string): string {
  const templates = SUMMARY_TEMPLATES[ctx.result];
  if (!templates || templates.length <= 1) {
    return generateSummary(ctx);
  }

  // Try a few times to get a different one
  for (let i = 0; i < 10; i++) {
    const idx = Math.floor(Math.random() * templates.length);
    const candidate = resolveVariables(templates[idx], ctx);
    if (candidate !== exclude) return candidate;
  }
  return generateSummary(ctx);
}
