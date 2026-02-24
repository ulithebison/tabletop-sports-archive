"use client";

import type { PlayerGameStats, FdfTeam } from "@/lib/fdf/types";
import { Star } from "lucide-react";

interface GameBoxScoreProps {
  stats: PlayerGameStats[];
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
  mvp: PlayerGameStats | null;
}

// --- Category filter helpers ---

type CategoryKey = "passing" | "rushing" | "receiving" | "kicking" | "fumbles" | "defense" | "specialTeams";

function hasPassingStats(s: PlayerGameStats): boolean {
  return s.passing.touchdowns > 0 || s.passing.interceptions > 0;
}

function hasRushingStats(s: PlayerGameStats): boolean {
  return s.rushing.touchdowns > 0;
}

function hasReceivingStats(s: PlayerGameStats): boolean {
  return s.receiving.touchdowns > 0;
}

function hasKickingStats(s: PlayerGameStats): boolean {
  return (
    s.kicking.fieldGoalsMade > 0 ||
    s.kicking.fieldGoalsMissed > 0 ||
    s.kicking.extraPointsMade > 0 ||
    s.kicking.extraPointsMissed > 0
  );
}

function hasFumbleStats(s: PlayerGameStats): boolean {
  return s.rushing.fumbles > 0;
}

function hasDefenseStats(s: PlayerGameStats): boolean {
  return (
    s.defense.interceptions > 0 ||
    s.defense.fumbleRecoveries > 0 ||
    s.defense.returnTouchdowns > 0
  );
}

function hasSpecialTeamsStats(s: PlayerGameStats): boolean {
  return s.specialTeams.kickReturnTouchdowns > 0 || s.specialTeams.puntReturnTouchdowns > 0;
}

const categoryFilters: Record<CategoryKey, (s: PlayerGameStats) => boolean> = {
  passing: hasPassingStats,
  rushing: hasRushingStats,
  receiving: hasReceivingStats,
  kicking: hasKickingStats,
  fumbles: hasFumbleStats,
  defense: hasDefenseStats,
  specialTeams: hasSpecialTeamsStats,
};

// --- Column definitions per category ---

interface ColumnDef {
  label: string;
  getValue: (s: PlayerGameStats) => string | number;
  getTeamTotal: (players: PlayerGameStats[]) => string | number;
}

const categoryColumns: Record<CategoryKey, ColumnDef[]> = {
  passing: [
    { label: "TD", getValue: (s) => s.passing.touchdowns, getTeamTotal: (ps) => ps.reduce((a, p) => a + p.passing.touchdowns, 0) },
    { label: "INT", getValue: (s) => s.passing.interceptions, getTeamTotal: (ps) => ps.reduce((a, p) => a + p.passing.interceptions, 0) },
  ],
  rushing: [
    { label: "TD", getValue: (s) => s.rushing.touchdowns, getTeamTotal: (ps) => ps.reduce((a, p) => a + p.rushing.touchdowns, 0) },
  ],
  receiving: [
    { label: "TD", getValue: (s) => s.receiving.touchdowns, getTeamTotal: (ps) => ps.reduce((a, p) => a + p.receiving.touchdowns, 0) },
  ],
  kicking: [
    {
      label: "FG",
      getValue: (s) => `${s.kicking.fieldGoalsMade}/${s.kicking.fieldGoalsMade + s.kicking.fieldGoalsMissed}`,
      getTeamTotal: (ps) => {
        const made = ps.reduce((a, p) => a + p.kicking.fieldGoalsMade, 0);
        const att = ps.reduce((a, p) => a + p.kicking.fieldGoalsMade + p.kicking.fieldGoalsMissed, 0);
        return `${made}/${att}`;
      },
    },
    {
      label: "XP",
      getValue: (s) => `${s.kicking.extraPointsMade}/${s.kicking.extraPointsMade + s.kicking.extraPointsMissed}`,
      getTeamTotal: (ps) => {
        const made = ps.reduce((a, p) => a + p.kicking.extraPointsMade, 0);
        const att = ps.reduce((a, p) => a + p.kicking.extraPointsMade + p.kicking.extraPointsMissed, 0);
        return `${made}/${att}`;
      },
    },
  ],
  fumbles: [
    { label: "FUM", getValue: (s) => s.rushing.fumbles, getTeamTotal: (ps) => ps.reduce((a, p) => a + p.rushing.fumbles, 0) },
  ],
  defense: [
    { label: "INT", getValue: (s) => s.defense.interceptions, getTeamTotal: (ps) => ps.reduce((a, p) => a + p.defense.interceptions, 0) },
    { label: "FR", getValue: (s) => s.defense.fumbleRecoveries, getTeamTotal: (ps) => ps.reduce((a, p) => a + p.defense.fumbleRecoveries, 0) },
    { label: "TD", getValue: (s) => s.defense.returnTouchdowns, getTeamTotal: (ps) => ps.reduce((a, p) => a + p.defense.returnTouchdowns, 0) },
  ],
  specialTeams: [
    { label: "KR TD", getValue: (s) => s.specialTeams.kickReturnTouchdowns, getTeamTotal: (ps) => ps.reduce((a, p) => a + p.specialTeams.kickReturnTouchdowns, 0) },
    { label: "PR TD", getValue: (s) => s.specialTeams.puntReturnTouchdowns, getTeamTotal: (ps) => ps.reduce((a, p) => a + p.specialTeams.puntReturnTouchdowns, 0) },
  ],
};

const categoryLabels: Record<CategoryKey, string> = {
  passing: "Passing",
  rushing: "Rushing",
  receiving: "Receiving",
  kicking: "Kicking",
  fumbles: "Fumbles",
  defense: "Defense",
  specialTeams: "Special Teams",
};

// --- Sub-components ---

function PlayerName({ stat, isMvp, teamColor }: { stat: PlayerGameStats; isMvp: boolean; teamColor: string }) {
  return (
    <span className="flex items-center gap-1 min-w-0">
      {isMvp && <Star size={11} fill="var(--fdf-accent)" style={{ color: "var(--fdf-accent)" }} className="shrink-0" />}
      <span className="truncate" style={{ color: teamColor }}>
        {stat.playerName}
      </span>
      {stat.playerNumber != null && (
        <span className="shrink-0" style={{ color: "var(--fdf-text-muted)" }}>
          #{stat.playerNumber}
        </span>
      )}
    </span>
  );
}

function TeamStatTable({
  team,
  players,
  columns,
  mvpId,
}: {
  team: FdfTeam;
  players: PlayerGameStats[];
  columns: ColumnDef[];
  mvpId: string | null;
}) {
  if (players.length === 0) {
    return (
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-fdf-mono font-bold uppercase tracking-wider mb-1.5 px-1" style={{ color: team.primaryColor }}>
          {team.abbreviation}
        </div>
        <div className="text-xs px-1" style={{ color: "var(--fdf-text-muted)" }}>—</div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Team header */}
      <table className="w-full text-xs font-fdf-mono">
        <thead>
          <tr>
            <th
              className="text-left text-[10px] font-bold uppercase tracking-wider pb-1 pr-2"
              style={{ color: team.primaryColor }}
            >
              {team.abbreviation}
            </th>
            {columns.map((col) => (
              <th
                key={col.label}
                className="text-right text-[10px] font-bold uppercase tracking-wider pb-1 w-10"
                style={{ color: "var(--fdf-text-muted)" }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.playerId} style={{ borderTop: "1px solid var(--fdf-border)" }}>
              <td className="py-1 pr-2 text-xs">
                <PlayerName stat={p} isMvp={mvpId === p.playerId} teamColor="var(--fdf-text-primary)" />
              </td>
              {columns.map((col) => (
                <td
                  key={col.label}
                  className="py-1 text-right text-xs font-bold"
                  style={{ color: "var(--fdf-text-primary)" }}
                >
                  {col.getValue(p)}
                </td>
              ))}
            </tr>
          ))}
          {/* Team total row */}
          <tr style={{ borderTop: "1px solid var(--fdf-border)" }}>
            <td className="py-1 pr-2 text-xs font-bold" style={{ color: "var(--fdf-text-muted)" }}>
              TEAM
            </td>
            {columns.map((col) => (
              <td
                key={col.label}
                className="py-1 text-right text-xs font-bold"
                style={{ color: "var(--fdf-text-primary)" }}
              >
                {col.getTeamTotal(players)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function StatCategory({
  category,
  allStats,
  homeTeam,
  awayTeam,
  mvpId,
}: {
  category: CategoryKey;
  allStats: PlayerGameStats[];
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
  mvpId: string | null;
}) {
  const filter = categoryFilters[category];
  const columns = categoryColumns[category];

  const awayPlayers = allStats.filter((s) => s.teamId === awayTeam.id && filter(s));
  const homePlayers = allStats.filter((s) => s.teamId === homeTeam.id && filter(s));

  // Don't render if no players in this category
  if (awayPlayers.length === 0 && homePlayers.length === 0) return null;

  return (
    <div>
      {/* Category header */}
      <div
        className="text-[11px] font-fdf-mono font-bold uppercase tracking-widest mb-2 pb-1"
        style={{ color: "var(--fdf-accent)", borderBottom: "1px solid var(--fdf-border)" }}
      >
        {categoryLabels[category]}
      </div>

      {/* Side-by-side tables */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <TeamStatTable team={awayTeam} players={awayPlayers} columns={columns} mvpId={mvpId} />
        <TeamStatTable team={homeTeam} players={homePlayers} columns={columns} mvpId={mvpId} />
      </div>
    </div>
  );
}

// --- Main Component ---

export function GameBoxScore({ stats, homeTeam, awayTeam, mvp }: GameBoxScoreProps) {
  if (stats.length === 0) return null;

  const mvpId = mvp?.playerId ?? null;

  const categories: CategoryKey[] = [
    "passing",
    "rushing",
    "receiving",
    "kicking",
    "fumbles",
    "defense",
    "specialTeams",
  ];

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h3
          className="text-xs font-bold font-fdf-mono uppercase tracking-wider"
          style={{ color: "var(--fdf-accent)" }}
        >
          Box Score
        </h3>
        {mvp && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-fdf-mono px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: "rgba(59,130,246,0.15)",
              color: "var(--fdf-accent)",
              border: "1px solid rgba(59,130,246,0.3)",
            }}
          >
            <Star size={10} fill="var(--fdf-accent)" style={{ color: "var(--fdf-accent)" }} />
            MVP: {mvp.playerName}
          </span>
        )}
      </div>

      {/* Category sections */}
      <div className="space-y-5">
        {categories.map((cat) => (
          <StatCategory
            key={cat}
            category={cat}
            allStats={stats}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            mvpId={mvpId}
          />
        ))}
      </div>
    </div>
  );
}
