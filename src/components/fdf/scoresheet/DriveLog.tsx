"use client";

import type { DriveEntry, FdfTeam } from "@/lib/fdf/types";
import { isDefenseScoringTD } from "@/lib/fdf/scoring";
import { DriveRow } from "./DriveRow";

interface DriveLogProps {
  drives: DriveEntry[];
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
}

export function DriveLog({ drives, homeTeam, awayTeam }: DriveLogProps) {
  if (drives.length === 0) {
    return (
      <div
        className="text-center py-8 rounded-lg"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <p className="text-sm font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
          No drives yet — enter the first drive above
        </p>
      </div>
    );
  }

  const teamMap: Record<string, FdfTeam> = {
    [homeTeam.id]: homeTeam,
    [awayTeam.id]: awayTeam,
  };

  // Show newest first
  const reversed = [...drives].reverse();

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-fdf-mono uppercase tracking-wider"
        style={{
          color: "var(--fdf-text-muted)",
          borderBottom: "1px solid var(--fdf-border)",
          backgroundColor: "var(--fdf-bg-elevated)",
        }}
      >
        <span className="w-6 text-center">QTR</span>
        <span className="w-10">TEAM</span>
        <span className="w-8 text-center">FP</span>
        <span className="w-14">TIME</span>
        <span className="flex-shrink-0">RESULT</span>
        <span className="flex-1 ml-1">SUMMARY</span>
        <span className="flex-shrink-0">SCORE</span>
      </div>

      {/* Drive rows */}
      <div>
        {reversed.map((drive) => {
          // Muffed TDs: defense scored, so flip to show the defending team
          const displayTeam = isDefenseScoringTD(drive.result)
            ? (drive.teamId === homeTeam.id ? awayTeam : homeTeam)
            : teamMap[drive.teamId];
          return (
            <DriveRow
              key={drive.id}
              drive={drive}
              team={displayTeam}
            />
          );
        })}
      </div>
    </div>
  );
}
