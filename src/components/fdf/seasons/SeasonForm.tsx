"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { DivisionEditor } from "./DivisionEditor";
import { LEAGUE_TYPE_LABELS, PLAYOFF_FORMAT_OPTIONS } from "@/lib/fdf/constants";
import type {
  LeagueType,
  Division,
  SeasonConfig,
  OvertimeConfig,
} from "@/lib/fdf/types";

const LEAGUE_OPTIONS = Object.entries(LEAGUE_TYPE_LABELS) as [LeagueType, string][];

export function SeasonForm() {
  const router = useRouter();
  const teamsMap = useTeamStore((s) => s.teams);
  const createSeason = useSeasonStore((s) => s.createSeason);

  const allTeams = useMemo(
    () => Object.values(teamsMap).sort((a, b) => a.name.localeCompare(b.name)),
    [teamsMap]
  );

  // Form state
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [leagueType, setLeagueType] = useState<LeagueType>("NFL");
  const [totalWeeks, setTotalWeeks] = useState(17);
  const [playoffTeams, setPlayoffTeams] = useState(7);
  const [hasByeWeeks, setHasByeWeeks] = useState(true);
  const [homeFieldInPlayoffs, setHomeFieldInPlayoffs] = useState(true);
  const [canEndInTie, setCanEndInTie] = useState(true);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
    // Also remove from divisions if deselected
    if (selectedTeamIds.includes(teamId)) {
      setDivisions((prev) =>
        prev.map((d) => ({
          ...d,
          teamIds: d.teamIds.filter((id) => id !== teamId),
        }))
      );
    }
  };

  const selectAll = () => setSelectedTeamIds(allTeams.map((t) => t.id));
  const selectNone = () => {
    setSelectedTeamIds([]);
    setDivisions((prev) => prev.map((d) => ({ ...d, teamIds: [] })));
  };

  const canSubmit = name.trim() && selectedTeamIds.length >= 2;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const config: SeasonConfig = {
      totalRegularSeasonWeeks: totalWeeks,
      playoffTeams,
      hasByeWeeks,
      homeFieldInPlayoffs,
    };
    const overtimeRules: OvertimeConfig = { type: "guaranteed_possession", canEndInTie };

    const id = createSeason({
      name: name.trim(),
      year,
      leagueType,
      config,
      overtimeRules,
      teamIds: selectedTeamIds,
      divisions,
    });

    router.push(`/fdf/seasons/${id}`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Name & Year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-secondary)" }}>
            Season Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 1966 AFL Season"
            className="w-full px-3 py-2 rounded text-sm"
            style={{
              backgroundColor: "var(--fdf-bg-card)",
              border: "1px solid var(--fdf-border)",
              color: "var(--fdf-text-primary)",
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-secondary)" }}>
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full px-3 py-2 rounded text-sm font-fdf-mono"
            style={{
              backgroundColor: "var(--fdf-bg-card)",
              border: "1px solid var(--fdf-border)",
              color: "var(--fdf-text-primary)",
            }}
          />
        </div>
      </div>

      {/* League Type */}
      <div>
        <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-secondary)" }}>
          League
        </label>
        <div className="flex flex-wrap gap-2">
          {LEAGUE_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setLeagueType(value)}
              className="px-3 py-1.5 rounded text-sm font-fdf-mono font-bold transition-colors"
              style={{
                backgroundColor: leagueType === value ? "var(--fdf-accent)" : "var(--fdf-bg-card)",
                color: leagueType === value ? "#fff" : "var(--fdf-text-secondary)",
                border: `1px solid ${leagueType === value ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Season Config */}
      <div
        className="rounded-lg p-4 space-y-4"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <h3 className="text-xs font-fdf-mono font-bold uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
          Season Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-fdf-mono mb-1" style={{ color: "var(--fdf-text-secondary)" }}>
              Regular Season Weeks
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={totalWeeks}
              onChange={(e) => setTotalWeeks(Number(e.target.value))}
              className="w-full px-3 py-2 rounded text-sm font-fdf-mono"
              style={{
                backgroundColor: "var(--fdf-bg-primary)",
                border: "1px solid var(--fdf-border)",
                color: "var(--fdf-text-primary)",
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-fdf-mono mb-1" style={{ color: "var(--fdf-text-secondary)" }}>
              Playoff Teams
            </label>
            <select
              value={playoffTeams}
              onChange={(e) => setPlayoffTeams(Number(e.target.value))}
              className="w-full px-3 py-2 rounded text-sm font-fdf-mono"
              style={{
                backgroundColor: "var(--fdf-bg-primary)",
                border: "1px solid var(--fdf-border)",
                color: "var(--fdf-text-primary)",
              }}
            >
              {PLAYOFF_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasByeWeeks}
              onChange={(e) => setHasByeWeeks(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
              Bye Weeks
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={homeFieldInPlayoffs}
              onChange={(e) => setHomeFieldInPlayoffs(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
              Home Field in Playoffs
            </span>
          </label>
        </div>
      </div>

      {/* Overtime Rules */}
      <div
        className="rounded-lg p-4 space-y-3"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <h3 className="text-xs font-fdf-mono font-bold uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
          Overtime Rules
        </h3>

        <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
          NFL Overtime Rules (guaranteed possession)
        </p>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={canEndInTie}
            onChange={(e) => setCanEndInTie(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
            Regular season games can end in a tie
          </span>
        </label>
      </div>

      {/* Team Selection */}
      <div
        className="rounded-lg p-4 space-y-3"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-fdf-mono font-bold uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
            Teams ({selectedTeamIds.length} selected)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-[10px] font-fdf-mono px-2 py-0.5 rounded"
              style={{ color: "var(--fdf-accent)", backgroundColor: "var(--fdf-accent)" + "15" }}
            >
              All
            </button>
            <button
              onClick={selectNone}
              className="text-[10px] font-fdf-mono px-2 py-0.5 rounded"
              style={{ color: "var(--fdf-text-muted)", backgroundColor: "var(--fdf-border)" }}
            >
              None
            </button>
          </div>
        </div>

        {allTeams.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
            No teams created yet. Create teams first.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto">
            {allTeams.map((team) => {
              const selected = selectedTeamIds.includes(team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors"
                  style={{
                    backgroundColor: selected ? "var(--fdf-accent)" + "20" : "var(--fdf-bg-primary)",
                    border: `1px solid ${selected ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
                    color: selected ? "var(--fdf-text-primary)" : "var(--fdf-text-secondary)",
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: team.primaryColor }}
                  />
                  <span className="truncate font-fdf-mono">{team.abbreviation}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Divisions (optional) */}
      <div
        className="rounded-lg p-4 space-y-3"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <h3 className="text-xs font-fdf-mono font-bold uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
          Divisions (Optional)
        </h3>
        <p className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
          Add divisions to organize teams and track division records.
        </p>
        <DivisionEditor
          divisions={divisions}
          onChange={setDivisions}
          availableTeams={allTeams}
          selectedTeamIds={selectedTeamIds}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => router.push("/fdf/seasons")}
          className="px-4 py-2 rounded text-sm font-fdf-mono"
          style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-5 py-2 rounded text-sm font-bold text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--fdf-accent)" }}
        >
          Create Season
        </button>
      </div>
    </div>
  );
}
