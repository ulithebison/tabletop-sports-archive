"use client";

import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { PLAYOFF_FORMAT_OPTIONS } from "@/lib/fdf/constants";
import type { FdfSeason } from "@/lib/fdf/types";

function generateNextSeasonName(previousName: string): string {
  const match = previousName.match(/^(.*\s)Season\s+(\d+)$/i);
  if (match) {
    return `${match[1]}Season ${Number(match[2]) + 1}`;
  }
  return `${previousName} Season 2`;
}

interface NewSeasonModalProps {
  previousSeason: FdfSeason;
  onConfirm: (seasonId: string) => void;
  onClose: () => void;
}

export function NewSeasonModal({ previousSeason, onConfirm, onClose }: NewSeasonModalProps) {
  const createSeason = useSeasonStore((s) => s.createSeason);
  const getTeam = useTeamStore((s) => s.getTeam);

  const [name, setName] = useState(generateNextSeasonName(previousSeason.name));
  const [year, setYear] = useState(previousSeason.year + 1);
  const [regularSeasonWeeks, setRegularSeasonWeeks] = useState(
    previousSeason.config.totalRegularSeasonWeeks
  );
  const [playoffTeams, setPlayoffTeams] = useState(previousSeason.config.playoffTeams);
  const [hasByeWeeks, setHasByeWeeks] = useState(previousSeason.config.hasByeWeeks);
  const [homeFieldInPlayoffs, setHomeFieldInPlayoffs] = useState(
    previousSeason.config.homeFieldInPlayoffs
  );
  const [canEndInTie, setCanEndInTie] = useState(previousSeason.overtimeRules.canEndInTie);

  const teamCount = previousSeason.teamIds.length;
  const divisionCount = previousSeason.divisions.length;

  const handleCreate = () => {
    if (!name.trim()) return;

    const id = createSeason({
      name: name.trim(),
      year,
      leagueType: previousSeason.leagueType,
      config: {
        totalRegularSeasonWeeks: regularSeasonWeeks,
        playoffTeams,
        hasByeWeeks,
        homeFieldInPlayoffs,
      },
      overtimeRules: { type: "guaranteed_possession", canEndInTie },
      teamIds: [...previousSeason.teamIds],
      divisions: previousSeason.divisions.map((d) => ({ ...d })),
    });

    onConfirm(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-md mx-4 rounded-lg shadow-xl"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--fdf-border)" }}>
          <div className="flex items-center gap-2">
            <RefreshCw size={16} style={{ color: "#22c55e" }} />
            <h3 className="text-sm font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
              New Season
            </h3>
          </div>
          <button onClick={onClose} type="button" style={{ color: "var(--fdf-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-4">
          {/* Season Name */}
          <div>
            <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-muted)" }}>
              Season Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-muted)" }}>
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-28 px-3 py-2 rounded text-sm"
              style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
            />
          </div>

          {/* Regular Season Weeks + Playoff Teams */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-muted)" }}>
                Regular Season Weeks
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={regularSeasonWeeks}
                onChange={(e) => setRegularSeasonWeeks(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                className="w-full px-3 py-2 rounded text-sm"
                style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-muted)" }}>
                Playoff Teams
              </label>
              <select
                value={playoffTeams}
                onChange={(e) => setPlayoffTeams(Number(e.target.value))}
                className="w-full px-3 py-2 rounded text-sm"
                style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
              >
                {PLAYOFF_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasByeWeeks}
                onChange={(e) => setHasByeWeeks(e.target.checked)}
              />
              <span className="text-sm" style={{ color: "var(--fdf-text-secondary)" }}>Bye Weeks</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={homeFieldInPlayoffs}
                onChange={(e) => setHomeFieldInPlayoffs(e.target.checked)}
              />
              <span className="text-sm" style={{ color: "var(--fdf-text-secondary)" }}>Home Field Advantage in Playoffs</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={canEndInTie}
                onChange={(e) => setCanEndInTie(e.target.checked)}
              />
              <span className="text-sm" style={{ color: "var(--fdf-text-secondary)" }}>Regular Season OT Can End in Tie</span>
            </label>
          </div>

          {/* Teams info (read-only) */}
          <div
            className="rounded p-3"
            style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}
          >
            <p className="text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-muted)" }}>
              Teams
            </p>
            <p className="text-sm font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
              {teamCount} teams{divisionCount > 0 ? `, ${divisionCount} divisions` : ""}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {previousSeason.teamIds.slice(0, 12).map((teamId) => {
                const team = getTeam(teamId);
                if (!team) return null;
                return (
                  <span
                    key={teamId}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-fdf-mono"
                    style={{ backgroundColor: "var(--fdf-bg-card)", color: "var(--fdf-text-secondary)" }}
                  >
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: team.primaryColor }} />
                    {team.abbreviation}
                  </span>
                );
              })}
              {teamCount > 12 && (
                <span className="text-[10px] font-fdf-mono px-1.5 py-0.5" style={{ color: "var(--fdf-text-muted)" }}>
                  +{teamCount - 12} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3" style={{ borderTop: "1px solid var(--fdf-border)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-2 rounded text-sm font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: "#22c55e" }}
            type="button"
          >
            Create Season
          </button>
        </div>
      </div>
    </div>
  );
}
