"use client";

import type { FdfSeason, ScheduleGame, PlayoffRound, FdfTeam } from "@/lib/fdf/types";
import type { PlayoffSeed } from "@/lib/fdf/playoff-seeding";
import { PlayoffMatchup } from "./PlayoffMatchup";

interface PlayoffBracketProps {
  season: FdfSeason;
  seeds: PlayoffSeed[];
  getTeam: (id: string) => FdfTeam | undefined;
  onPlay: (game: ScheduleGame) => void;
  onSimulate: (gameId: string) => void;
  onResume?: (game: ScheduleGame) => void;
  onReset?: (game: ScheduleGame) => void;
  activeGameIds?: Set<string>;
}

const ROUND_LABELS: Record<PlayoffRound, string> = {
  wild_card: "Wild Card",
  divisional: "Divisional",
  conference: "Conference",
  super_bowl: "Championship",
};

const ROUND_ORDER: PlayoffRound[] = ["wild_card", "divisional", "conference", "super_bowl"];

export function PlayoffBracket({
  season,
  seeds,
  getTeam,
  onPlay,
  onSimulate,
  onResume,
  onReset,
  activeGameIds,
}: PlayoffBracketProps) {
  // Group playoff games by round
  const playoffGames = season.schedule.filter((g) => g.isPlayoff);
  const roundMap = new Map<PlayoffRound, ScheduleGame[]>();

  for (const game of playoffGames) {
    if (!game.playoffRound) continue;
    const existing = roundMap.get(game.playoffRound) || [];
    existing.push(game);
    roundMap.set(game.playoffRound, existing);
  }

  // Get active rounds (in order)
  const activeRounds = ROUND_ORDER.filter((r) => roundMap.has(r));

  if (activeRounds.length === 0) {
    return (
      <p className="text-xs text-center py-6" style={{ color: "var(--fdf-text-muted)" }}>
        No playoff games scheduled yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max py-2">
        {activeRounds.map((round, roundIdx) => {
          const games = roundMap.get(round) || [];
          // Calculate spacing based on round depth
          const gapMultiplier = Math.pow(2, roundIdx);

          return (
            <div key={round} className="flex flex-col">
              {/* Round header */}
              <h3
                className="text-[10px] font-fdf-mono font-bold uppercase tracking-wider text-center mb-3"
                style={{ color: "var(--fdf-accent)" }}
              >
                {ROUND_LABELS[round]}
              </h3>

              {/* Matchups */}
              <div
                className="flex flex-col justify-around flex-1"
                style={{ gap: `${gapMultiplier * 12}px` }}
              >
                {games.map((game) => (
                  <div key={game.id} className="flex items-center">
                    <PlayoffMatchup
                      game={game}
                      homeTeam={getTeam(game.homeTeamId)}
                      awayTeam={getTeam(game.awayTeamId)}
                      seeds={seeds}
                      onPlay={onPlay}
                      onSimulate={onSimulate}
                      onResume={onResume}
                      onReset={onReset}
                      isActiveGame={!!game.gameId && (activeGameIds?.has(game.id) ?? false)}
                    />
                    {/* Connector line to next round */}
                    {roundIdx < activeRounds.length - 1 && (
                      <div
                        className="w-6 h-px"
                        style={{ backgroundColor: "var(--fdf-border)" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
