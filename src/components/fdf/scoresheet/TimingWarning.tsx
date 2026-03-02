"use client";

import type { FdfTeam, GameMode } from "@/lib/fdf/types";
import { AlertTriangle } from "lucide-react";

interface TimingWarningProps {
  ticksRemaining: number;
  offenseTeam: FdfTeam;
  gameMode?: GameMode;
}

export function TimingWarning({ ticksRemaining, offenseTeam, gameMode }: TimingWarningProps) {
  const clockQuality = offenseTeam.qualities.offense.clockManagement;
  const clockLevel = offenseTeam.qualities.offense.clockManagementLevel;
  const isFAC = gameMode === "fac";

  let status: string;
  let detail: string;

  if (clockQuality === "EFFICIENT") {
    status = clockLevel === "super" ? "SUPER EFFICIENT" : "EFFICIENT";
    if (isFAC) {
      const cards = clockLevel === "super" ? 5 : "1-3";
      detail = `May adjust timing by ${cards} card${clockLevel === "super" ? "s" : "(s)"} up or down (gamer's choice, min 1 card). Does not apply on turnovers.`;
    } else {
      const ticks = clockLevel === "super" ? 2 : 1;
      detail = `May adjust timing die by ${ticks} tick${ticks > 1 ? "s" : ""} up or down (gamer's choice, min 1 tick). Does not apply on turnovers.`;
    }
  } else if (clockQuality === "INEFFICIENT") {
    status = clockLevel === "super" ? "SUPER INEFFICIENT" : "INEFFICIENT";
    if (isFAC) {
      const cards = clockLevel === "super" ? 5 : 3;
      detail = `Increase timing by ${cards} card${cards > 1 ? "s" : ""} — only applies when this team is losing.`;
    } else {
      const ticks = clockLevel === "super" ? 2 : 1;
      detail = `Increase timing die by ${ticks} tick${ticks > 1 ? "s" : ""} — only applies when this team is losing.`;
    }
  } else {
    status = "NEUTRAL";
    detail = "No clock management modifier";
  }

  const unitLabel = isFAC ? "card" : "tick";

  return (
    <div
      className="flex items-start gap-2 rounded-md px-3 py-2 text-xs"
      style={{
        backgroundColor: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.3)",
      }}
    >
      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
      <div>
        <span className="font-fdf-mono font-bold" style={{ color: "#ef4444" }}>
          {ticksRemaining} {unitLabel}{ticksRemaining !== 1 ? "s" : ""} remaining
        </span>
        <span className="mx-1.5" style={{ color: "var(--fdf-text-muted)" }}>·</span>
        <span className="font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
          {status}
        </span>
        <p className="mt-0.5" style={{ color: "var(--fdf-text-muted)" }}>{detail}</p>
      </div>
    </div>
  );
}
