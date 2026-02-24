"use client";

import { useState } from "react";
import { Plus, X, ChevronRight } from "lucide-react";
import type { Division, FdfTeam } from "@/lib/fdf/types";

interface DivisionEditorProps {
  divisions: Division[];
  onChange: (divisions: Division[]) => void;
  availableTeams: FdfTeam[];
  selectedTeamIds: string[];
}

export function DivisionEditor({
  divisions,
  onChange,
  availableTeams,
  selectedTeamIds,
}: DivisionEditorProps) {
  const [newDivName, setNewDivName] = useState("");

  // Teams already assigned to a division
  const assignedTeamIds = new Set(divisions.flatMap((d) => d.teamIds));

  // Teams selected for the season but not yet assigned
  const unassignedTeams = availableTeams.filter(
    (t) => selectedTeamIds.includes(t.id) && !assignedTeamIds.has(t.id)
  );

  const addDivision = () => {
    const name = newDivName.trim();
    if (!name) return;
    onChange([...divisions, { name, teamIds: [] }]);
    setNewDivName("");
  };

  const removeDivision = (idx: number) => {
    onChange(divisions.filter((_, i) => i !== idx));
  };

  const renameDivision = (idx: number, name: string) => {
    const updated = [...divisions];
    updated[idx] = { ...updated[idx], name };
    onChange(updated);
  };

  const assignTeam = (divIdx: number, teamId: string) => {
    const updated = [...divisions];
    updated[divIdx] = {
      ...updated[divIdx],
      teamIds: [...updated[divIdx].teamIds, teamId],
    };
    onChange(updated);
  };

  const unassignTeam = (divIdx: number, teamId: string) => {
    const updated = [...divisions];
    updated[divIdx] = {
      ...updated[divIdx],
      teamIds: updated[divIdx].teamIds.filter((id) => id !== teamId),
    };
    onChange(updated);
  };

  const teamById = (id: string) => availableTeams.find((t) => t.id === id);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newDivName}
          onChange={(e) => setNewDivName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addDivision()}
          placeholder="Division name..."
          className="flex-1 px-3 py-1.5 rounded text-sm font-fdf-mono"
          style={{
            backgroundColor: "var(--fdf-bg-primary)",
            border: "1px solid var(--fdf-border)",
            color: "var(--fdf-text-primary)",
          }}
        />
        <button
          onClick={addDivision}
          disabled={!newDivName.trim()}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-bold text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--fdf-accent)" }}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {divisions.map((div, divIdx) => (
        <div
          key={divIdx}
          className="rounded-lg p-3"
          style={{
            backgroundColor: "var(--fdf-bg-primary)",
            border: "1px solid var(--fdf-border)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <input
              type="text"
              value={div.name}
              onChange={(e) => renameDivision(divIdx, e.target.value)}
              className="bg-transparent font-fdf-mono text-sm font-bold"
              style={{ color: "var(--fdf-text-primary)" }}
            />
            <button
              onClick={() => removeDivision(divIdx)}
              className="p-1 rounded hover:bg-red-500/20"
            >
              <X size={14} style={{ color: "#ef4444" }} />
            </button>
          </div>

          {/* Assigned teams */}
          <div className="space-y-1 mb-2">
            {div.teamIds.map((teamId) => {
              const team = teamById(teamId);
              if (!team) return null;
              return (
                <div
                  key={teamId}
                  className="flex items-center justify-between px-2 py-1 rounded text-xs"
                  style={{ backgroundColor: "var(--fdf-bg-secondary)" }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: team.primaryColor }}
                    />
                    <span style={{ color: "var(--fdf-text-primary)" }}>
                      {team.abbreviation} — {team.name}
                    </span>
                  </span>
                  <button
                    onClick={() => unassignTeam(divIdx, teamId)}
                    className="p-0.5 hover:bg-red-500/20 rounded"
                  >
                    <X size={12} style={{ color: "var(--fdf-text-muted)" }} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add team to division */}
          {unassignedTeams.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {unassignedTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => assignTeam(divIdx, team.id)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-fdf-mono transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: "var(--fdf-border)",
                    color: "var(--fdf-text-secondary)",
                  }}
                >
                  <ChevronRight size={10} />
                  {team.abbreviation}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
