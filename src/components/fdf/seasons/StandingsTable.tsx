"use client";

import type { TeamStanding, FdfTeam, Division } from "@/lib/fdf/types";

interface StandingsTableProps {
  standings: TeamStanding[];
  getTeam: (id: string) => FdfTeam | undefined;
  divisions?: Division[];
}

function formatRecord(r: { wins: number; losses: number; ties: number }) {
  return r.ties > 0 ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;
}

function StandingsRow({
  standing,
  rank,
  team,
}: {
  standing: TeamStanding;
  rank: number;
  team: FdfTeam | undefined;
}) {
  return (
    <tr
      className="border-b transition-colors hover:bg-white/5"
      style={{ borderColor: "var(--fdf-border)" }}
    >
      <td className="px-2 py-1.5 text-[10px] font-fdf-mono text-center" style={{ color: "var(--fdf-text-muted)" }}>
        {rank}
      </td>
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
        {standing.wins}
      </td>
      <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{ color: "var(--fdf-text-primary)" }}>
        {standing.losses}
      </td>
      <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{ color: "var(--fdf-text-primary)" }}>
        {standing.ties}
      </td>
      <td className="px-2 py-1.5 text-xs font-fdf-mono text-center font-bold" style={{ color: "var(--fdf-text-primary)" }}>
        {standing.winPct.toFixed(3).replace(/^0/, "")}
      </td>
      <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{ color: "var(--fdf-text-secondary)" }}>
        {standing.pointsFor}
      </td>
      <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{ color: "var(--fdf-text-secondary)" }}>
        {standing.pointsAgainst}
      </td>
      <td className="px-2 py-1.5 text-xs font-fdf-mono text-center" style={{
        color: standing.pointDiff > 0 ? "#22c55e" : standing.pointDiff < 0 ? "#ef4444" : "var(--fdf-text-muted)",
      }}>
        {standing.pointDiff > 0 ? "+" : ""}{standing.pointDiff}
      </td>
      <td className="px-2 py-1.5 text-[10px] font-fdf-mono text-center" style={{
        color: standing.streak.startsWith("W") ? "#22c55e" : standing.streak.startsWith("L") ? "#ef4444" : "var(--fdf-text-muted)",
      }}>
        {standing.streak || "—"}
      </td>
      {/* Hidden on mobile */}
      <td className="px-2 py-1.5 text-[10px] font-fdf-mono text-center hidden md:table-cell" style={{ color: "var(--fdf-text-muted)" }}>
        {formatRecord(standing.homeRecord)}
      </td>
      <td className="px-2 py-1.5 text-[10px] font-fdf-mono text-center hidden md:table-cell" style={{ color: "var(--fdf-text-muted)" }}>
        {formatRecord(standing.awayRecord)}
      </td>
      <td className="px-2 py-1.5 text-[10px] font-fdf-mono text-center hidden md:table-cell" style={{ color: "var(--fdf-text-muted)" }}>
        {formatRecord(standing.divisionRecord)}
      </td>
      <td className="px-2 py-1.5 hidden lg:table-cell">
        <div className="flex gap-0.5 justify-center">
          {standing.last5.map((r, i) => (
            <span
              key={i}
              className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-fdf-mono font-bold"
              style={{
                backgroundColor: r === "W" ? "#22c55e20" : r === "L" ? "#ef444420" : "#f59e0b20",
                color: r === "W" ? "#22c55e" : r === "L" ? "#ef4444" : "#f59e0b",
              }}
            >
              {r}
            </span>
          ))}
        </div>
      </td>
    </tr>
  );
}

function TableHeader() {
  return (
    <thead>
      <tr className="border-b" style={{ borderColor: "var(--fdf-border)" }}>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase" style={{ color: "var(--fdf-text-muted)" }}>#</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-left" style={{ color: "var(--fdf-text-muted)" }}>Team</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase" style={{ color: "var(--fdf-text-muted)" }}>W</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase" style={{ color: "var(--fdf-text-muted)" }}>L</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase" style={{ color: "var(--fdf-text-muted)" }}>T</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase" style={{ color: "var(--fdf-text-muted)" }}>PCT</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase" style={{ color: "var(--fdf-text-muted)" }}>PF</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase" style={{ color: "var(--fdf-text-muted)" }}>PA</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase" style={{ color: "var(--fdf-text-muted)" }}>DIFF</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase" style={{ color: "var(--fdf-text-muted)" }}>STRK</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase hidden md:table-cell" style={{ color: "var(--fdf-text-muted)" }}>HOME</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase hidden md:table-cell" style={{ color: "var(--fdf-text-muted)" }}>AWAY</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase hidden md:table-cell" style={{ color: "var(--fdf-text-muted)" }}>DIV</th>
        <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase hidden lg:table-cell" style={{ color: "var(--fdf-text-muted)" }}>L5</th>
      </tr>
    </thead>
  );
}

export function StandingsTable({ standings, getTeam, divisions }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: "var(--fdf-text-muted)" }}>
        No standings data yet. Play some games first.
      </p>
    );
  }

  // If divisions exist, group by division
  if (divisions && divisions.length > 0) {
    return (
      <div className="space-y-4">
        {divisions.map((div) => {
          const divStandings = standings.filter((s) => div.teamIds.includes(s.teamId));
          if (divStandings.length === 0) return null;
          return (
            <div key={div.name}>
              <h4 className="text-[10px] font-fdf-mono font-bold uppercase tracking-wider mb-1" style={{ color: "var(--fdf-accent)" }}>
                {div.name}
              </h4>
              <div className="overflow-x-auto rounded" style={{ border: "1px solid var(--fdf-border)" }}>
                <table className="w-full" style={{ backgroundColor: "var(--fdf-bg-card)" }}>
                  <TableHeader />
                  <tbody>
                    {divStandings.map((s, i) => (
                      <StandingsRow key={s.teamId} standing={s} rank={i + 1} team={getTeam(s.teamId)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // No divisions: single table
  return (
    <div className="overflow-x-auto rounded" style={{ border: "1px solid var(--fdf-border)" }}>
      <table className="w-full" style={{ backgroundColor: "var(--fdf-bg-card)" }}>
        <TableHeader />
        <tbody>
          {standings.map((s, i) => (
            <StandingsRow key={s.teamId} standing={s} rank={i + 1} team={getTeam(s.teamId)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
