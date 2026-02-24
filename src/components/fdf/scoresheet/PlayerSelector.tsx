"use client";

import { useEffect } from "react";
import type { DriveResultType, FinderRoster, DrivePlayerInvolvement } from "@/lib/fdf/types";
import {
  getFinderPlayerFieldsForResult,
  getFinderPlayersForCategories,
} from "@/lib/fdf/player-mapping";

interface PlayerSelectorProps {
  result: DriveResultType;
  offenseFinderRoster: FinderRoster;
  value: DrivePlayerInvolvement;
  onChange: (involvement: DrivePlayerInvolvement) => void;
}

const selectStyle = {
  backgroundColor: "var(--fdf-bg-elevated)",
  color: "var(--fdf-text-primary)",
  border: "1px solid var(--fdf-border)",
};

export function PlayerSelector({
  result,
  offenseFinderRoster,
  value,
  onChange,
}: PlayerSelectorProps) {
  const fields = getFinderPlayerFieldsForResult(result);

  // Auto-select when there's exactly one option
  useEffect(() => {
    const updated = { ...value };
    let changed = false;

    for (const field of fields) {
      const players = getFinderPlayersForCategories(offenseFinderRoster, field.categories);
      const currentVal = updated[field.key as keyof DrivePlayerInvolvement];

      if (players.length === 1 && !currentVal) {
        (updated as Record<string, string | undefined>)[field.key] = players[0].id;
        changed = true;
      }
    }

    if (changed) {
      onChange(updated);
    }
    // Only run on result change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (fields.length === 0) return null;

  return (
    <div>
      <label
        className="block text-xs font-bold font-fdf-mono uppercase tracking-wider mb-1.5"
        style={{ color: "var(--fdf-text-secondary)" }}
      >
        Players
      </label>
      <div className="space-y-2">
        {fields.map((field) => {
          const players = getFinderPlayersForCategories(offenseFinderRoster, field.categories);
          const currentValue = (value[field.key as keyof DrivePlayerInvolvement] as string) || "";

          return (
            <div key={field.key} className="flex items-center gap-2">
              <span
                className="text-[10px] font-fdf-mono font-bold w-24 flex-shrink-0"
                style={{ color: "var(--fdf-text-muted)" }}
              >
                {field.label}
                {field.required && <span style={{ color: "var(--fdf-accent)" }}> *</span>}
              </span>
              <select
                value={currentValue}
                onChange={(e) => {
                  const newVal = { ...value };
                  (newVal as Record<string, string | undefined>)[field.key] = e.target.value || undefined;
                  onChange(newVal);
                }}
                className="flex-1 rounded px-2 py-1.5 text-xs"
                style={selectStyle}
              >
                <option value="">
                  {players.length === 0 ? "No players available" : "Select player..."}
                </option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.number != null ? `#${player.number} ` : ""}{player.name}
                    {player.finderRange ? ` [${player.finderRange}]` : ""}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Checks if all required player fields are filled (FinderRoster version).
 */
export function isPlayerSelectionValid(
  result: DriveResultType,
  involvement: DrivePlayerInvolvement
): boolean {
  const fields = getFinderPlayerFieldsForResult(result);
  return fields
    .filter((f) => f.required)
    .every((f) => !!(involvement[f.key as keyof DrivePlayerInvolvement]));
}
