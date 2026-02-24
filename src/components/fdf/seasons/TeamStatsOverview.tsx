"use client";

import type { TeamSeasonStats, FdfTeam } from "@/lib/fdf/types";

interface TeamStatsOverviewProps {
  teamStats: TeamSeasonStats[];
  getTeam: (id: string) => FdfTeam | undefined;
}

export function TeamStatsOverview({ teamStats, getTeam }: TeamStatsOverviewProps) {
  if (teamStats.length === 0) {
    return (
      <p className="text-xs text-center py-4 font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
        No team stats available yet.
      </p>
    );
  }

  const hasManualGames = teamStats.some((ts) => ts.manualGamesPlayed > 0);

  return (
    <div className="overflow-x-auto rounded" style={{ border: "1px solid var(--fdf-border)" }}>
      <table className="w-full" style={{ backgroundColor: "var(--fdf-bg-card)" }}>
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--fdf-border)" }}>
            <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-left" style={{ color: "var(--fdf-text-muted)" }}>Team</th>
            <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center" style={{ color: "var(--fdf-text-muted)" }}>GP</th>
            <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center" style={{ color: "var(--fdf-text-muted)" }}>PLY</th>
            <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center" style={{ color: "var(--fdf-text-muted)" }}>SIM</th>
            <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center" style={{ color: "var(--fdf-text-muted)" }}>PF</th>
            <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center" style={{ color: "var(--fdf-text-muted)" }}>PA</th>
            <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center" style={{ color: "var(--fdf-text-muted)" }}>AVG PF</th>
            <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center" style={{ color: "var(--fdf-text-muted)" }}>AVG PA</th>
            <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center" style={{ color: "var(--fdf-text-muted)" }}>DIFF</th>
            {hasManualGames && (
              <>
                <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center hidden md:table-cell" style={{ color: "var(--fdf-text-muted)" }}>TO+</th>
                <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center hidden md:table-cell" style={{ color: "var(--fdf-text-muted)" }}>TO-</th>
                <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center hidden md:table-cell" style={{ color: "var(--fdf-text-muted)" }}>TO±</th>
                <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center hidden lg:table-cell" style={{ color: "var(--fdf-text-muted)" }}>FP%</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {teamStats.map((ts) => {
            const team = getTeam(ts.teamId);
            return (
              <tr
                key={ts.teamId}
                className="border-b hover:bg-white/5"
                style={{ borderColor: "var(--fdf-border)" }}
              >
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: team?.primaryColor || "#666" }}
                    />
                    <span className="text-xs font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                      {team?.abbreviation || "???"}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{ color: "var(--fdf-text-primary)" }}>
                  {ts.gamesPlayed}
                </td>
                <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{ color: "var(--fdf-text-secondary)" }}>
                  {ts.manualGamesPlayed}
                </td>
                <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{ color: "var(--fdf-text-muted)" }}>
                  {ts.simulatedGamesPlayed}
                </td>
                <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{ color: "var(--fdf-text-primary)" }}>
                  {ts.pointsFor}
                </td>
                <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{ color: "var(--fdf-text-primary)" }}>
                  {ts.pointsAgainst}
                </td>
                <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{ color: "var(--fdf-text-secondary)" }}>
                  {ts.avgPointsFor.toFixed(1)}
                </td>
                <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{ color: "var(--fdf-text-secondary)" }}>
                  {ts.avgPointsAgainst.toFixed(1)}
                </td>
                <td className="px-2 py-1.5 text-xs font-fdf-mono text-center font-bold" style={{
                  color: ts.pointDiff > 0 ? "#22c55e" : ts.pointDiff < 0 ? "#ef4444" : "var(--fdf-text-muted)",
                }}>
                  {ts.pointDiff > 0 ? "+" : ""}{ts.pointDiff}
                </td>
                {hasManualGames && (
                  <>
                    <td className="px-2 py-1.5 text-xs font-fdf-mono text-center hidden md:table-cell" style={{ color: "#22c55e" }}>
                      {ts.turnoversForced}
                    </td>
                    <td className="px-2 py-1.5 text-xs font-fdf-mono text-center hidden md:table-cell" style={{ color: "#ef4444" }}>
                      {ts.turnoversCommitted}
                    </td>
                    <td className="px-2 py-1.5 text-xs font-fdf-mono text-center font-bold hidden md:table-cell" style={{
                      color: ts.turnoverDiff > 0 ? "#22c55e" : ts.turnoverDiff < 0 ? "#ef4444" : "var(--fdf-text-muted)",
                    }}>
                      {ts.turnoverDiff > 0 ? "+" : ""}{ts.turnoverDiff}
                    </td>
                    <td className="px-2 py-1.5 hidden lg:table-cell">
                      {ts.manualGamesPlayed > 0 ? (
                        <div className="flex gap-0.5 justify-center">
                          <span className="text-[8px] font-fdf-mono px-1 rounded" style={{ backgroundColor: "#ef444420", color: "#ef4444" }}>
                            P{ts.fieldPositionPoor}%
                          </span>
                          <span className="text-[8px] font-fdf-mono px-1 rounded" style={{ backgroundColor: "#f59e0b20", color: "#f59e0b" }}>
                            A{ts.fieldPositionAvg}%
                          </span>
                          <span className="text-[8px] font-fdf-mono px-1 rounded" style={{ backgroundColor: "#22c55e20", color: "#22c55e" }}>
                            G{ts.fieldPositionGreat}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-fdf-mono text-center block" style={{ color: "var(--fdf-text-muted)" }}>—</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
