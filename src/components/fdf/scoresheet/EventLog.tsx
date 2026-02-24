"use client";

import type { DriveEntry, FdfTeam } from "@/lib/fdf/types";
import { isTouchdown, isReturnTD, isScoringPlay } from "@/lib/fdf/scoring";

interface EventLogProps {
  drives: DriveEntry[];
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
}

function getResultLabel(result: string): string {
  return result
    .replace(/_/g, " ")
    .replace(/\bFGA\b/, "FG")
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function getEventColor(result: string): string {
  if (result.startsWith("KICK_PUNT_")) return "#ef4444";
  if (result.includes("TD") || result === "TD_RUN" || result === "TD_PASS") return "#22c55e";
  if (result === "INTERCEPTION" || result === "FUMBLE" || result === "TURNOVER_ON_DOWNS") return "#ef4444";
  if (result === "FGA_GOOD" || result === "DESPERATION_FGA") return "#3b82f6";
  if (result === "FGA_MISSED") return "#f59e0b";
  if (result === "SAFETY") return "#a855f7";
  if (result.includes("PUNT")) return "#3b82f6";
  if (result === "END_OF_HALF" || result === "END_OF_GAME") return "var(--fdf-accent)";
  if (result === "KNEEL_DOWN") return "var(--fdf-text-muted)";
  return "var(--fdf-border)";
}

export function EventLog({ drives, homeTeam, awayTeam }: EventLogProps) {
  if (drives.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
          No events yet
        </p>
      </div>
    );
  }

  const teamMap: Record<string, FdfTeam> = {
    [homeTeam.id]: homeTeam,
    [awayTeam.id]: awayTeam,
  };

  // Newest first
  const reversed = [...drives].reverse();

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      <div
        className="px-3 py-1.5 text-xs font-fdf-mono uppercase tracking-wider font-bold"
        style={{
          color: "var(--fdf-accent)",
          borderBottom: "1px solid var(--fdf-border)",
          backgroundColor: "var(--fdf-bg-elevated)",
        }}
      >
        Event Log
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {reversed.map((drive) => {
          const team = teamMap[drive.teamId];
          const color = getEventColor(drive.result);
          const scoring = isScoringPlay(drive.result);
          const td = isTouchdown(drive.result) || isReturnTD(drive.result);

          return (
            <div
              key={drive.id}
              className="px-2.5 py-1.5 text-sm"
              style={{
                borderLeft: `3px solid ${color}`,
                borderBottom: "1px solid var(--fdf-border)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-fdf-mono text-xs font-bold" style={{ color: "var(--fdf-text-muted)" }}>
                  Q{drive.quarter}
                </span>
                <span className="font-fdf-mono text-xs font-bold" style={{ color: team?.primaryColor }}>
                  {team?.abbreviation}
                </span>
                <span
                  className="font-fdf-mono text-xs font-bold uppercase"
                  style={{ color }}
                >
                  {getResultLabel(drive.result)}
                </span>
                {scoring && (
                  <span className="ml-auto font-fdf-mono text-xs font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>
                    {drive.scoreAfterDrive}
                  </span>
                )}
              </div>
              {drive.summary && (
                <p className="text-xs truncate" style={{ color: "var(--fdf-text-muted)" }}>
                  {drive.summary}
                </p>
              )}
              {drive.diceValues && drive.diceValues.length > 0 && (
                <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                  {td ? "🎲" : ""} {drive.diceValues.join("-")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
