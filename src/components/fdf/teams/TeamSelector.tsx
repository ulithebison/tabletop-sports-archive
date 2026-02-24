"use client";

import type { FdfTeam } from "@/lib/fdf/types";

interface TeamSelectorProps {
  label: string;
  teams: FdfTeam[];
  value: string;
  onChange: (teamId: string) => void;
  excludeId?: string;
}

export function TeamSelector({ label, teams, value, onChange, excludeId }: TeamSelectorProps) {
  const filtered = excludeId ? teams.filter((t) => t.id !== excludeId) : teams;

  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: "var(--fdf-text-secondary)" }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md px-3 py-2.5 text-sm font-medium"
        style={{
          backgroundColor: "var(--fdf-bg-elevated)",
          color: "var(--fdf-text-primary)",
          border: "1px solid var(--fdf-border)",
        }}
      >
        <option value="">Select a team...</option>
        {filtered.map((team) => (
          <option key={team.id} value={team.id}>
            {team.abbreviation} — {team.name} ({team.season})
          </option>
        ))}
      </select>
    </div>
  );
}
