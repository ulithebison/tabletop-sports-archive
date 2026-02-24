"use client";

import type { SeasonGameResult, FdfTeam } from "@/lib/fdf/types";

interface InstantResultCardProps {
  result: SeasonGameResult;
  homeTeam: FdfTeam | undefined;
  awayTeam: FdfTeam | undefined;
}

export function InstantResultCard({ result, homeTeam, awayTeam }: InstantResultCardProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      {/* Away */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: awayTeam?.primaryColor || "#666" }} />
        <span
          className="text-xs font-fdf-mono font-bold"
          style={{ color: result.winner === "away" ? "var(--fdf-text-primary)" : "var(--fdf-text-secondary)" }}
        >
          {awayTeam?.abbreviation || "???"}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
          {result.awayScore}
        </span>
        <span className="text-[10px]" style={{ color: "var(--fdf-text-muted)" }}>-</span>
        <span className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
          {result.homeScore}
        </span>
        {result.isOvertime && (
          <span className="text-[9px] font-fdf-mono font-bold px-1 py-0.5 rounded" style={{ color: "#f59e0b", backgroundColor: "#f59e0b20" }}>
            OT
          </span>
        )}
        <span className="text-[9px] font-fdf-mono font-bold px-1 py-0.5 rounded" style={{ color: "#a855f7", backgroundColor: "#a855f720" }}>
          SIM
        </span>
      </div>

      {/* Home */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span
          className="text-xs font-fdf-mono font-bold"
          style={{ color: result.winner === "home" ? "var(--fdf-text-primary)" : "var(--fdf-text-secondary)" }}
        >
          {homeTeam?.abbreviation || "???"}
        </span>
        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: homeTeam?.primaryColor || "#666" }} />
      </div>
    </div>
  );
}
