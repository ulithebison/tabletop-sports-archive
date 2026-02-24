"use client";

import Link from "next/link";
import type { FdfSeason } from "@/lib/fdf/types";
import { LEAGUE_TYPE_LABELS } from "@/lib/fdf/constants";

interface SeasonCardProps {
  season: FdfSeason;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  setup: { label: "Setup", color: "#f59e0b" },
  regular_season: { label: "Regular Season", color: "#3b82f6" },
  playoffs: { label: "Playoffs", color: "#a855f7" },
  completed: { label: "Completed", color: "#22c55e" },
};

export function SeasonCard({ season }: SeasonCardProps) {
  const status = STATUS_LABELS[season.status] || STATUS_LABELS.setup;

  const completedGames = season.schedule.filter((g) => g.result && !g.isBye).length;
  const totalGames = season.schedule.filter((g) => !g.isBye).length;

  return (
    <Link
      href={`/fdf/seasons/${season.id}`}
      className="block rounded-lg p-4 transition-all hover:scale-[1.01]"
      style={{
        backgroundColor: "var(--fdf-bg-card)",
        border: "1px solid var(--fdf-border)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-sm font-bold truncate"
          style={{ color: "var(--fdf-text-primary)" }}
        >
          {season.name}
        </h3>
        <span
          className="text-[10px] font-fdf-mono font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: status.color + "20", color: status.color }}
        >
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--fdf-text-muted)" }}>
        <span className="font-fdf-mono">{season.year}</span>
        <span
          className="px-1.5 py-0.5 rounded font-fdf-mono font-bold text-[10px]"
          style={{
            backgroundColor: "var(--fdf-accent)" + "20",
            color: "var(--fdf-accent)",
          }}
        >
          {LEAGUE_TYPE_LABELS[season.leagueType]}
        </span>
        <span>{season.teamIds.length} teams</span>
        {totalGames > 0 && (
          <span>
            Week {season.currentWeek} · {completedGames}/{totalGames} games
          </span>
        )}
      </div>
    </Link>
  );
}
