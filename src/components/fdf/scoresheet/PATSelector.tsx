"use client";

import type { PATResult, FinderRoster, DrivePlayerInvolvement } from "@/lib/fdf/types";
import { PAT_OPTIONS } from "@/lib/fdf/constants";
import { getFinderPATFieldsForResult, getFinderPlayersForCategories } from "@/lib/fdf/player-mapping";

interface PATSelectorProps {
  value: PATResult | null;
  onChange: (pat: PATResult) => void;
  // Sprint 3: PAT player selection
  enhancedMode?: boolean;
  offenseFinderRoster?: FinderRoster;
  playerInvolvement?: DrivePlayerInvolvement;
  onPlayerChange?: (involvement: DrivePlayerInvolvement) => void;
}

const selectStyle = {
  backgroundColor: "var(--fdf-bg-elevated)",
  color: "var(--fdf-text-primary)",
  border: "1px solid var(--fdf-border)",
};

export function PATSelector({ value, onChange, enhancedMode, offenseFinderRoster, playerInvolvement, onPlayerChange }: PATSelectorProps) {
  const patFields = value && enhancedMode && offenseFinderRoster
    ? getFinderPATFieldsForResult(value)
    : [];

  return (
    <div>
      <label
        className="block text-xs font-bold font-fdf-mono uppercase tracking-wider mb-1.5"
        style={{ color: "var(--fdf-text-secondary)" }}
      >
        PAT / 2-Point Conversion
      </label>
      <div className="flex gap-2">
        {PAT_OPTIONS.map((opt) => {
          const active = value === opt.value;
          const isGood = opt.points > 0;
          const color = isGood ? "var(--fdf-td)" : "var(--fdf-turnover)";
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="flex-1 py-2 rounded-md text-xs font-fdf-mono font-bold transition-all"
              style={{
                backgroundColor: active ? color : "var(--fdf-bg-elevated)",
                color: active ? "#000" : color,
                border: `1px solid ${active ? color : "var(--fdf-border)"}`,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* PAT player selection (Enhanced Mode) */}
      {patFields.length > 0 && playerInvolvement && onPlayerChange && (
        <div className="mt-2 space-y-1.5">
          {patFields.map((field) => {
            const players = getFinderPlayersForCategories(offenseFinderRoster!, field.categories);
            const currentValue = (playerInvolvement[field.key as keyof DrivePlayerInvolvement] as string) || "";

            return (
              <div key={field.key} className="flex items-center gap-2">
                <span
                  className="text-[10px] font-fdf-mono font-bold w-24 flex-shrink-0"
                  style={{ color: "var(--fdf-text-muted)" }}
                >
                  {field.label}
                </span>
                <select
                  value={currentValue}
                  onChange={(e) => {
                    const newVal = { ...playerInvolvement };
                    (newVal as Record<string, string | undefined>)[field.key] = e.target.value || undefined;
                    onPlayerChange(newVal);
                  }}
                  className="flex-1 rounded px-2 py-1 text-xs"
                  style={selectStyle}
                >
                  <option value="">
                    {players.length === 0 ? "No players" : "Select..."}
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
      )}
    </div>
  );
}
