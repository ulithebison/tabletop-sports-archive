"use client";

import { useState, useMemo } from "react";
import type { PlayerSeasonStats, FdfTeam } from "@/lib/fdf/types";

type Category = "passing" | "rushing" | "receiving" | "kicking" | "all_purpose";

interface SeasonLeaderboardProps {
  playerStats: PlayerSeasonStats[];
  getTeam: (id: string) => FdfTeam | undefined;
  onSelectPlayer: (player: PlayerSeasonStats) => void;
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all_purpose", label: "All-Purpose" },
  { key: "passing", label: "Passing" },
  { key: "rushing", label: "Rushing" },
  { key: "receiving", label: "Receiving" },
  { key: "kicking", label: "Kicking" },
];

type SortConfig = { key: string; desc: boolean };

function getSortedPlayers(
  players: PlayerSeasonStats[],
  category: Category,
  sort: SortConfig,
): PlayerSeasonStats[] {
  const filtered = players.filter((p) => {
    switch (category) {
      case "passing": return p.passingTD > 0 || p.interceptions > 0;
      case "rushing": return p.rushingTD > 0 || p.fumbles > 0;
      case "receiving": return p.receivingTD > 0 || p.fumbles > 0;
      case "kicking": return p.fieldGoalsMade > 0 || p.extraPointsMade > 0;
      default: return true;
    }
  });

  return [...filtered].sort((a, b) => {
    const aVal = getStatValue(a, sort.key);
    const bVal = getStatValue(b, sort.key);
    return sort.desc ? bVal - aVal : aVal - bVal;
  });
}

function getStatValue(p: PlayerSeasonStats, key: string): number {
  switch (key) {
    case "gp": return p.gamesPlayed;
    case "prf": return p.pointsResponsibleFor;
    case "td": return p.totalTouchdowns;
    case "passTD": return p.passingTD;
    case "int": return p.interceptions;
    case "sacks": return p.sacks;
    case "tdInt": return p.tdIntRatio;
    case "rushTD": return p.rushingTD;
    case "fumbles": return p.fumbles;
    case "recTD": return p.receivingTD;
    case "fg": return p.fieldGoalsMade;
    case "fgMiss": return p.fieldGoalsMissed;
    case "xp": return p.extraPointsMade;
    case "kickPts": return p.kickingPoints;
    case "defINT": return p.defensiveInterceptions;
    case "fr": return p.fumbleRecoveries;
    case "defSacks": return p.defensiveSacks;
    case "retTD": return p.returnTouchdowns;
    default: return 0;
  }
}

function getDefaultSort(category: Category): SortConfig {
  switch (category) {
    case "passing": return { key: "passTD", desc: true };
    case "rushing": return { key: "rushTD", desc: true };
    case "receiving": return { key: "recTD", desc: true };
    case "kicking": return { key: "kickPts", desc: true };
    default: return { key: "prf", desc: true };
  }
}

interface Column {
  key: string;
  label: string;
  sortable: boolean;
}

function getColumns(category: Category): Column[] {
  const base: Column[] = [
    { key: "gp", label: "GP", sortable: true },
  ];

  switch (category) {
    case "passing":
      return [...base,
        { key: "passTD", label: "TD", sortable: true },
        { key: "int", label: "INT", sortable: true },
        { key: "prf", label: "PTS", sortable: true },
      ];
    case "rushing":
      return [...base,
        { key: "rushTD", label: "TD", sortable: true },
        { key: "fumbles", label: "FUM", sortable: true },
        { key: "prf", label: "PTS", sortable: true },
      ];
    case "receiving":
      return [...base,
        { key: "recTD", label: "TD", sortable: true },
        { key: "fumbles", label: "FUM", sortable: true },
        { key: "prf", label: "PTS", sortable: true },
      ];
    case "kicking":
      return [...base,
        { key: "fg", label: "FG", sortable: true },
        { key: "fgMiss", label: "FGM", sortable: true },
        { key: "xp", label: "XP", sortable: true },
        { key: "kickPts", label: "PTS", sortable: true },
      ];
    default:
      return [...base,
        { key: "td", label: "TD", sortable: true },
        { key: "passTD", label: "PTD", sortable: true },
        { key: "rushTD", label: "RTD", sortable: true },
        { key: "recTD", label: "REC", sortable: true },
        { key: "prf", label: "PTS", sortable: true },
      ];
  }
}

export function SeasonLeaderboard({ playerStats, getTeam, onSelectPlayer }: SeasonLeaderboardProps) {
  const [category, setCategory] = useState<Category>("all_purpose");
  const [sort, setSort] = useState<SortConfig>(getDefaultSort("all_purpose"));
  const [showAll, setShowAll] = useState(false);

  const columns = useMemo(() => getColumns(category), [category]);
  const sorted = useMemo(() => getSortedPlayers(playerStats, category, sort), [playerStats, category, sort]);
  const displayed = showAll ? sorted : sorted.slice(0, 20);

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setSort(getDefaultSort(cat));
    setShowAll(false);
  };

  const handleSort = (key: string) => {
    setSort((prev) =>
      prev.key === key ? { key, desc: !prev.desc } : { key, desc: true }
    );
  };

  if (playerStats.length === 0) {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <p className="text-sm font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
          No player stats available.
        </p>
        <p className="text-xs font-fdf-mono mt-1" style={{ color: "var(--fdf-text-muted)" }}>
          Player stats are only tracked for manually played games.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleCategoryChange(cat.key)}
            className="px-3 py-1.5 rounded text-[11px] font-fdf-mono font-bold transition-colors"
            style={{
              backgroundColor: category === cat.key ? "var(--fdf-accent)" : "var(--fdf-bg-card)",
              color: category === cat.key ? "#fff" : "var(--fdf-text-secondary)",
              border: `1px solid ${category === cat.key ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded" style={{ border: "1px solid var(--fdf-border)" }}>
        <table className="w-full" style={{ backgroundColor: "var(--fdf-bg-card)" }}>
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--fdf-border)" }}>
              <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center" style={{ color: "var(--fdf-text-muted)" }}>#</th>
              <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-left" style={{ color: "var(--fdf-text-muted)" }}>Player</th>
              <th className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center" style={{ color: "var(--fdf-text-muted)" }}>Team</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-1 text-[9px] font-fdf-mono uppercase text-center"
                  style={{
                    color: sort.key === col.key ? "var(--fdf-accent)" : "var(--fdf-text-muted)",
                    cursor: col.sortable ? "pointer" : "default",
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}
                  {sort.key === col.key && (sort.desc ? " \u25BC" : " \u25B2")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((ps, idx) => {
              const team = getTeam(ps.teamId);
              return (
                <tr
                  key={ps.playerId}
                  className="border-b transition-colors hover:bg-white/5 cursor-pointer"
                  style={{ borderColor: "var(--fdf-border)" }}
                  onClick={() => onSelectPlayer(ps)}
                >
                  <td className="px-2 py-1.5 text-[10px] font-fdf-mono text-center" style={{ color: "var(--fdf-text-muted)" }}>
                    {idx + 1}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      {ps.playerNumber !== undefined && (
                        <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                          #{ps.playerNumber}
                        </span>
                      )}
                      <span className="text-xs font-fdf-mono font-bold" style={{ color: "var(--fdf-accent)" }}>
                        {ps.playerName}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: team?.primaryColor || "#666" }}
                      />
                      <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
                        {team?.abbreviation || "???"}
                      </span>
                    </div>
                  </td>
                  {columns.map((col) => {
                    const val = getStatValue(ps, col.key);
                    return (
                      <td
                        key={col.key}
                        className="px-2 py-1.5 text-xs font-fdf-mono text-center"
                        style={{
                          color: sort.key === col.key ? "var(--fdf-text-primary)" : "var(--fdf-text-secondary)",
                          fontWeight: sort.key === col.key ? 700 : 400,
                        }}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show all toggle */}
      {sorted.length > 20 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[11px] font-fdf-mono px-3 py-1 rounded transition-colors"
          style={{ color: "var(--fdf-accent)", backgroundColor: "var(--fdf-accent)" + "15" }}
        >
          {showAll ? "Show Top 20" : `Show All (${sorted.length})`}
        </button>
      )}
    </div>
  );
}
