"use client";

import type { DriveEntry, FdfTeam } from "@/lib/fdf/types";
import { TickCircles } from "@/components/fdf/shared/TickCircles";
import { isScoringPlay } from "@/lib/fdf/scoring";

interface DriveRowProps {
  drive: DriveEntry;
  team: FdfTeam | undefined;
}

function getResultColor(result: string): string {
  if (result.startsWith("TD_") || result === "DESPERATION_TD") return "var(--fdf-td)";
  if (result.startsWith("FGA_GOOD") || result === "DESPERATION_FGA") return "var(--fdf-fg)";
  if (result === "FGA_MISSED") return "var(--fdf-text-muted)";
  if (result === "SAFETY") return "var(--fdf-safety)";
  if (result.startsWith("KICK_PUNT_")) return "var(--fdf-turnover)";
  if (result === "INTERCEPTION" || result === "FUMBLE" || result === "TURNOVER_ON_DOWNS") return "var(--fdf-turnover)";
  if (result.startsWith("PUNT")) return "var(--fdf-punt)";
  if (result.includes("RETURN_TD") || result === "BLOCKED_PUNT_TD") return "#ec4899";
  if (result === "UNUSUAL_RESULT") return "var(--fdf-unusual)";
  return "var(--fdf-text-muted)";
}

function getResultLabel(result: string): string {
  return result
    .replace(/_/g, " ")
    .replace(/\bFGA\b/, "FG")
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function getFPColor(fp: string): string {
  if (fp === "POOR") return "var(--fdf-fp-poor)";
  if (fp === "GREAT") return "var(--fdf-fp-great)";
  return "var(--fdf-fp-average)";
}

export function DriveRow({ drive, team }: DriveRowProps) {
  const resultColor = getResultColor(drive.result);
  const scoring = isScoringPlay(drive.result);

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-xs"
      style={{
        borderBottom: "1px solid var(--fdf-border)",
        backgroundColor: scoring ? "rgba(34,197,94,0.03)" : undefined,
      }}
    >
      {/* Quarter */}
      <span className="font-fdf-mono font-bold w-6 text-center" style={{ color: "var(--fdf-text-muted)" }}>
        Q{drive.quarter}
      </span>

      {/* Team */}
      <span
        className="font-fdf-mono font-bold w-10"
        style={{ color: team?.primaryColor || "var(--fdf-text-primary)" }}
      >
        {team?.abbreviation || "???"}
      </span>

      {/* Field Position */}
      <span
        className="font-fdf-mono text-[10px] font-bold w-8 text-center"
        style={{ color: getFPColor(drive.fieldPosition) }}
      >
        {drive.fieldPosition.slice(0, 3)}
      </span>

      {/* Drive Time */}
      <div className="w-14 flex-shrink-0">
        <TickCircles filled={drive.driveTicks} total={5} size={6} />
      </div>

      {/* Result */}
      <span className="font-fdf-mono font-bold flex-shrink-0" style={{ color: resultColor }}>
        {getResultLabel(drive.result)}
        {drive.patResult && (
          <span className="ml-1 opacity-70">
            ({drive.patResult === "XP_GOOD" ? "XP" : drive.patResult === "2PT_GOOD" ? "2PT" : drive.patResult === "XP_MISSED" ? "XP✗" : "2PT✗"})
          </span>
        )}
      </span>

      {/* Summary */}
      <span className="flex-1 truncate ml-1" style={{ color: "var(--fdf-text-muted)" }}>
        {drive.summary}
      </span>

      {/* Score */}
      <span className="font-fdf-mono font-bold flex-shrink-0" style={{ color: "var(--fdf-scoreboard-text)" }}>
        {drive.scoreAfterDrive}
      </span>
    </div>
  );
}
