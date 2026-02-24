"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { PlayerSeasonStats, FdfTeam } from "@/lib/fdf/types";

interface PlayerDetailViewProps {
  player: PlayerSeasonStats;
  getTeam: (id: string) => FdfTeam | undefined;
  onClose: () => void;
}

export function PlayerDetailView({ player, getTeam, onClose }: PlayerDetailViewProps) {
  const team = getTeam(player.teamId);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const statBlocks = [
    { label: "Games", value: player.gamesPlayed },
    { label: "Total TD", value: player.totalTouchdowns },
    { label: "Points", value: player.pointsResponsibleFor },
    { label: "Pass TD", value: player.passingTD },
    { label: "INT", value: player.interceptions },
    { label: "Rush TD", value: player.rushingTD },
    { label: "Rec TD", value: player.receivingTD },
    { label: "FG", value: `${player.fieldGoalsMade}/${player.fieldGoalsMade + player.fieldGoalsMissed}` },
    { label: "XP", value: `${player.extraPointsMade}/${player.extraPointsMade + player.extraPointsMissed}` },
    { label: "TD:INT", value: player.tdIntRatio.toFixed(1) },
    { label: "Kick Pts", value: player.kickingPoints },
    { label: "Fumbles", value: player.fumbles },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg"
        style={{ backgroundColor: "var(--fdf-bg)", border: "1px solid var(--fdf-border)" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-4"
          style={{
            backgroundColor: "var(--fdf-bg)",
            borderBottom: `2px solid ${team?.primaryColor || "var(--fdf-border)"}`,
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-5 h-5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: team?.primaryColor || "#666" }}
            />
            <div>
              <div className="flex items-center gap-2">
                {player.playerNumber !== undefined && (
                  <span className="text-sm font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                    #{player.playerNumber}
                  </span>
                )}
                <h2 className="text-lg font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                  {player.playerName}
                </h2>
              </div>
              <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
                {team?.abbreviation || "???"} · {team?.name || "Unknown Team"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--fdf-text-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Season totals grid */}
        <div className="p-4">
          <h3 className="text-[10px] font-fdf-mono uppercase tracking-wider mb-2" style={{ color: "var(--fdf-accent)" }}>
            Season Totals
          </h3>
          <div
            className="grid grid-cols-4 sm:grid-cols-6 gap-px rounded overflow-hidden"
            style={{ backgroundColor: "var(--fdf-border)" }}
          >
            {statBlocks.map((stat) => (
              <div
                key={stat.label}
                className="p-2 text-center"
                style={{ backgroundColor: "var(--fdf-bg-card)" }}
              >
                <p className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                  {stat.value}
                </p>
                <p className="text-[8px] font-fdf-mono uppercase" style={{ color: "var(--fdf-text-muted)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Game log */}
        <div className="p-4 pt-0">
          <h3 className="text-[10px] font-fdf-mono uppercase tracking-wider mb-2" style={{ color: "var(--fdf-accent)" }}>
            Game Log
          </h3>
          {player.gameLog.length === 0 ? (
            <p className="text-xs font-fdf-mono py-4 text-center" style={{ color: "var(--fdf-text-muted)" }}>
              No game log entries.
            </p>
          ) : (
            <div className="overflow-x-auto rounded" style={{ border: "1px solid var(--fdf-border)" }}>
              <table className="w-full" style={{ backgroundColor: "var(--fdf-bg-card)" }}>
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--fdf-border)" }}>
                    {["WK", "OPP", "RES", "PTD", "INT", "RTD", "REC", "FG", "XP", "PTS"].map((h) => (
                      <th
                        key={h}
                        className="px-2 py-1 text-[8px] font-fdf-mono uppercase text-center"
                        style={{ color: "var(--fdf-text-muted)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {player.gameLog.map((gl, idx) => {
                    const oppTeam = getTeam(gl.opponentTeamId);
                    return (
                      <tr
                        key={idx}
                        className="border-b hover:bg-white/5"
                        style={{ borderColor: "var(--fdf-border)" }}
                      >
                        <td className="px-2 py-1 text-[10px] font-fdf-mono text-center" style={{ color: "var(--fdf-text-muted)" }}>
                          {gl.week}
                        </td>
                        <td className="px-2 py-1 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[9px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                              {gl.isHome ? "vs" : "@"}
                            </span>
                            <span
                              className="w-2.5 h-2.5 rounded-sm"
                              style={{ backgroundColor: oppTeam?.primaryColor || "#666" }}
                            />
                            <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
                              {oppTeam?.abbreviation || "???"}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-1 text-[10px] font-fdf-mono text-center font-bold" style={{
                          color: gl.result === "W" ? "#22c55e" : gl.result === "L" ? "#ef4444" : "#f59e0b",
                        }}>
                          {gl.result}
                        </td>
                        <td className="px-2 py-1 text-[10px] font-fdf-mono text-center" style={{ color: "var(--fdf-text-primary)" }}>
                          {gl.passingTD || "—"}
                        </td>
                        <td className="px-2 py-1 text-[10px] font-fdf-mono text-center" style={{
                          color: gl.interceptions > 0 ? "#ef4444" : "var(--fdf-text-muted)",
                        }}>
                          {gl.interceptions || "—"}
                        </td>
                        <td className="px-2 py-1 text-[10px] font-fdf-mono text-center" style={{ color: "var(--fdf-text-primary)" }}>
                          {gl.rushingTD || "—"}
                        </td>
                        <td className="px-2 py-1 text-[10px] font-fdf-mono text-center" style={{ color: "var(--fdf-text-primary)" }}>
                          {gl.receivingTD || "—"}
                        </td>
                        <td className="px-2 py-1 text-[10px] font-fdf-mono text-center" style={{ color: "var(--fdf-text-primary)" }}>
                          {gl.fieldGoalsMade || "—"}
                        </td>
                        <td className="px-2 py-1 text-[10px] font-fdf-mono text-center" style={{ color: "var(--fdf-text-primary)" }}>
                          {gl.extraPointsMade || "—"}
                        </td>
                        <td className="px-2 py-1 text-[10px] font-fdf-mono text-center font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                          {gl.pointsResponsibleFor}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
