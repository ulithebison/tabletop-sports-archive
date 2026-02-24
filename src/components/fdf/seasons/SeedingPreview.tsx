"use client";

import { Trophy, Award } from "lucide-react";
import type { FdfTeam } from "@/lib/fdf/types";
import type { PlayoffSeed } from "@/lib/fdf/playoff-seeding";

interface SeedingPreviewProps {
  seeds: PlayoffSeed[];
  getTeam: (id: string) => FdfTeam | undefined;
  onConfirm: () => void;
}

export function SeedingPreview({ seeds, getTeam, onConfirm }: SeedingPreviewProps) {
  return (
    <div
      className="rounded-lg p-5 space-y-4"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      <div className="flex items-center gap-2">
        <Trophy size={16} style={{ color: "#a855f7" }} />
        <h3 className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
          Playoff Seeds
        </h3>
      </div>

      <div className="space-y-1.5">
        {seeds.map((seed) => {
          const team = getTeam(seed.teamId);
          return (
            <div
              key={seed.seed}
              className="flex items-center gap-3 px-3 py-2 rounded"
              style={{ backgroundColor: "var(--fdf-bg-primary)", border: "1px solid var(--fdf-border)" }}
            >
              <span
                className="text-sm font-fdf-mono font-bold w-6 text-center"
                style={{ color: "var(--fdf-accent)" }}
              >
                {seed.seed}
              </span>
              <span
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: team?.primaryColor || "#666" }}
              />
              <span className="text-xs font-fdf-mono font-bold flex-1" style={{ color: "var(--fdf-text-primary)" }}>
                {team?.abbreviation || "???"} — {team?.name || "Unknown"}
              </span>
              <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                {seed.standing.wins}-{seed.standing.losses}
                {seed.standing.ties > 0 ? `-${seed.standing.ties}` : ""}
              </span>
              {seed.isDivisionWinner && (
                <span className="flex items-center gap-0.5">
                  <Award size={10} style={{ color: "#f59e0b" }} />
                  <span className="text-[9px] font-fdf-mono font-bold" style={{ color: "#f59e0b" }}>
                    DIV
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onConfirm}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-sm font-bold text-white"
        style={{ backgroundColor: "#a855f7" }}
      >
        <Trophy size={16} />
        Confirm & Start Playoffs
      </button>
    </div>
  );
}
