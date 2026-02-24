import type { FdfGame, FdfTeam, WPAnalytics } from "./types";

const blowoutTemplates = [
  (w: string, l: string, ws: number, ls: number) =>
    `${w} dominates ${l}, ${ws}-${ls}.`,
  (w: string, l: string, ws: number, ls: number) =>
    `${w} cruises past ${l}, ${ws}-${ls}.`,
  (w: string, l: string, ws: number, ls: number) =>
    `${w} rolls over ${l} in a ${ws}-${ls} rout.`,
];

const nailbiterTemplates = [
  (w: string, l: string, ws: number, ls: number) =>
    `${w} edges ${l} in a thrilling ${ws}-${ls} finish.`,
  (w: string, l: string, ws: number, ls: number) =>
    `${w} survives ${l} in a nail-biter, ${ws}-${ls}.`,
  (w: string, l: string, ws: number, ls: number) =>
    `${w} holds on to beat ${l}, ${ws}-${ls}.`,
];

const comebackTemplates = [
  (w: string, l: string, ws: number, ls: number) =>
    `${w} stuns ${l} on a late comeback, ${ws}-${ls}.`,
  (w: string, l: string, ws: number, ls: number) =>
    `${w} rallies from behind to shock ${l}, ${ws}-${ls}.`,
  (w: string, l: string, ws: number, ls: number) =>
    `${w} completes an incredible comeback over ${l}, ${ws}-${ls}.`,
];

const defaultTemplates = [
  (w: string, l: string, ws: number, ls: number) =>
    `${w} defeats ${l}, ${ws}-${ls}.`,
  (w: string, l: string, ws: number, ls: number) =>
    `${w} takes down ${l}, ${ws}-${ls}.`,
  (w: string, l: string, ws: number, ls: number) =>
    `${w} wins over ${l}, ${ws}-${ls}.`,
];

const tieTemplates = [
  (a: string, b: string, s: number) =>
    `${a} and ${b} battle to a ${s}-${s} tie.`,
  (a: string, b: string, s: number) =>
    `${a} and ${b} play to a ${s}-${s} draw.`,
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a game headline based on the final score and WP analytics.
 */
export function generateGameHeadline(
  game: FdfGame,
  homeTeam: FdfTeam,
  awayTeam: FdfTeam,
  analytics: WPAnalytics,
): string {
  const homeScore = game.score.home.total;
  const awayScore = game.score.away.total;

  // Tie
  if (homeScore === awayScore) {
    return pickRandom(tieTemplates)(homeTeam.abbreviation, awayTeam.abbreviation, homeScore);
  }

  const isHomeWinner = homeScore > awayScore;
  const winner = isHomeWinner ? homeTeam.abbreviation : awayTeam.abbreviation;
  const loser = isHomeWinner ? awayTeam.abbreviation : homeTeam.abbreviation;
  const winScore = Math.max(homeScore, awayScore);
  const loseScore = Math.min(homeScore, awayScore);
  const margin = winScore - loseScore;

  // Check for comeback: winner's WP was below 20% at some point
  const winnerIsHome = isHomeWinner;
  const hadComeback = analytics.keyPlay && (() => {
    // Find if the winner's WP was ever < 0.20
    // We can check biggestLead for the losing team
    if (analytics.biggestLead) {
      const losingTeamHadBigLead = winnerIsHome
        ? analytics.biggestLead.teamId !== homeTeam.id && analytics.biggestLead.wpPct > 0.80
        : analytics.biggestLead.teamId !== awayTeam.id && analytics.biggestLead.wpPct > 0.80;
      return losingTeamHadBigLead;
    }
    return false;
  })();

  // Blowout: margin >= 17
  if (margin >= 17) {
    return pickRandom(blowoutTemplates)(winner, loser, winScore, loseScore);
  }

  // Comeback
  if (hadComeback) {
    return pickRandom(comebackTemplates)(winner, loser, winScore, loseScore);
  }

  // Nailbiter: margin <= 3 and at least 1 lead change
  if (margin <= 3 && analytics.leadChanges >= 1) {
    return pickRandom(nailbiterTemplates)(winner, loser, winScore, loseScore);
  }

  // Default
  return pickRandom(defaultTemplates)(winner, loser, winScore, loseScore);
}
