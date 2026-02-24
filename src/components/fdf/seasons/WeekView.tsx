"use client";

import { Zap } from "lucide-react";
import type { FdfSeason, ScheduleGame, FdfTeam } from "@/lib/fdf/types";
import { SeasonGameRow } from "./SeasonGameRow";

interface WeekViewProps {
  season: FdfSeason;
  week: number;
  getTeam: (id: string) => FdfTeam | undefined;
  onPlay: (game: ScheduleGame) => void;
  onSimulate: (gameId: string) => void;
  onSimulateWeek: () => void;
}

export function WeekView({
  season,
  week,
  getTeam,
  onPlay,
  onSimulate,
  onSimulateWeek,
}: WeekViewProps) {
  const weekGames = season.schedule.filter((g) => g.week === week);
  const playableGames = weekGames.filter((g) => !g.result && !g.isBye);
  const isPlayoffWeek = weekGames.some((g) => g.isPlayoff);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-fdf-mono font-bold uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
          {isPlayoffWeek
            ? `Playoff Round`
            : `Week ${week}`}
        </h3>
        {playableGames.length > 1 && (
          <button
            onClick={onSimulateWeek}
            className="flex items-center gap-1 text-[10px] font-fdf-mono font-bold px-2.5 py-1 rounded"
            style={{ color: "#a855f7", backgroundColor: "#a855f720" }}
          >
            <Zap size={10} />
            Simulate Week
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {weekGames.map((game) => (
          <SeasonGameRow
            key={game.id}
            game={game}
            homeTeam={getTeam(game.homeTeamId)}
            awayTeam={getTeam(game.awayTeamId)}
            seasonId={season.id}
            onPlay={onPlay}
            onSimulate={onSimulate}
          />
        ))}
      </div>

      {weekGames.length === 0 && (
        <p className="text-xs text-center py-6" style={{ color: "var(--fdf-text-muted)" }}>
          No games scheduled for this week
        </p>
      )}
    </div>
  );
}
