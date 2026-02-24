"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, Target, Flame, Shield, Clock, Zap } from "lucide-react";
import type { SeasonMoment, SeasonMomentType, FdfTeam } from "@/lib/fdf/types";

interface SeasonRecapProps {
  moments: SeasonMoment[];
  getTeam: (id: string) => FdfTeam | undefined;
}

type FilterType = "all" | SeasonMomentType;

const FILTER_PILLS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "comeback", label: "Comebacks" },
  { key: "blowout", label: "Blowouts" },
  { key: "closest_game", label: "Close" },
  { key: "shutout", label: "Shutouts" },
  { key: "overtime", label: "Overtime" },
];

const MOMENT_CONFIG: Record<SeasonMomentType, {
  label: string;
  icon: typeof TrendingUp;
  color: string;
}> = {
  biggest_wp_swing: { label: "Momentum Shift", icon: TrendingUp, color: "#a855f7" },
  closest_game: { label: "Nail-Biter", icon: Target, color: "#3b82f6" },
  blowout: { label: "Blowout", icon: Flame, color: "#ef4444" },
  comeback: { label: "Comeback", icon: TrendingUp, color: "#f59e0b" },
  shutout: { label: "Shutout", icon: Shield, color: "#22c55e" },
  highest_scoring: { label: "Highest Scoring", icon: Zap, color: "#f97316" },
  overtime: { label: "Overtime", icon: Clock, color: "#8b5cf6" },
};

export function SeasonRecap({ moments, getTeam }: SeasonRecapProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return moments;
    return moments.filter((m) => m.type === filter);
  }, [moments, filter]);

  if (moments.length === 0) {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <p className="text-sm font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
          No season moments to display.
        </p>
        <p className="text-xs font-fdf-mono mt-1" style={{ color: "var(--fdf-text-muted)" }}>
          Season moments come from manually played games only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-1">
        {FILTER_PILLS.map((pill) => {
          const count = pill.key === "all"
            ? moments.length
            : moments.filter((m) => m.type === pill.key).length;
          if (count === 0 && pill.key !== "all") return null;
          return (
            <button
              key={pill.key}
              onClick={() => setFilter(pill.key)}
              className="px-3 py-1 rounded-full text-[10px] font-fdf-mono font-bold transition-colors"
              style={{
                backgroundColor: filter === pill.key ? "var(--fdf-accent)" : "var(--fdf-bg-card)",
                color: filter === pill.key ? "#fff" : "var(--fdf-text-secondary)",
                border: `1px solid ${filter === pill.key ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
              }}
            >
              {pill.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-4 top-0 bottom-0 w-px"
          style={{ backgroundColor: "var(--fdf-border)" }}
        />

        <div className="space-y-3">
          {filtered.map((moment, idx) => {
            const config = MOMENT_CONFIG[moment.type];
            const Icon = config.icon;
            const homeTeam = getTeam(moment.homeTeamId);
            const awayTeam = getTeam(moment.awayTeamId);

            return (
              <div key={idx} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className="absolute left-2.5 top-3 w-3 h-3 rounded-full border-2"
                  style={{
                    backgroundColor: config.color + "30",
                    borderColor: config.color,
                  }}
                />

                <div
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: "var(--fdf-bg-card)",
                    border: `1px solid var(--fdf-border)`,
                    borderLeft: `3px solid ${config.color}`,
                  }}
                >
                  {/* Top row: badge + week */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} style={{ color: config.color }} />
                      <span className="text-[10px] font-fdf-mono font-bold uppercase" style={{ color: config.color }}>
                        {config.label}
                      </span>
                      {moment.wpSwing !== undefined && (
                        <span className="text-[9px] font-fdf-mono px-1.5 py-0.5 rounded-full" style={{
                          backgroundColor: config.color + "20",
                          color: config.color,
                        }}>
                          {moment.wpSwing}% swing
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                      Week {moment.week}
                    </span>
                  </div>

                  {/* Headline */}
                  <p className="text-xs font-fdf-mono mb-2" style={{ color: "var(--fdf-text-primary)" }}>
                    {moment.headline}
                  </p>

                  {/* Score with team swatches */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: awayTeam?.primaryColor || "#666" }}
                      />
                      <span className="text-[10px] font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                        {awayTeam?.abbreviation || "???"} {moment.awayScore}
                      </span>
                    </div>
                    <span className="text-[9px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>@</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: homeTeam?.primaryColor || "#666" }}
                      />
                      <span className="text-[10px] font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                        {homeTeam?.abbreviation || "???"} {moment.homeScore}
                      </span>
                    </div>

                    {moment.gameId && (
                      <Link
                        href={`/fdf/game/${moment.gameId}`}
                        className="ml-auto text-[9px] font-fdf-mono px-2 py-0.5 rounded"
                        style={{ color: "var(--fdf-accent)", backgroundColor: "var(--fdf-accent)" + "15" }}
                      >
                        View Game
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
