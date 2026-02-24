"use client";

import type { FieldPosition } from "@/lib/fdf/types";
import { FIELD_POSITIONS } from "@/lib/fdf/constants";

interface FieldPositionSelectorProps {
  value: FieldPosition | null;
  onChange: (fp: FieldPosition) => void;
}

export function FieldPositionSelector({ value, onChange }: FieldPositionSelectorProps) {
  return (
    <div>
      <label
        className="block text-xs font-bold font-fdf-mono uppercase tracking-wider mb-1.5"
        style={{ color: "var(--fdf-text-secondary)" }}
      >
        Field Position
      </label>
      <div className="flex gap-2">
        {FIELD_POSITIONS.map((fp) => {
          const active = value === fp.value;
          return (
            <button
              key={fp.value}
              type="button"
              onClick={() => onChange(fp.value)}
              className="flex-1 py-2 rounded-md text-xs font-fdf-mono font-bold uppercase tracking-wider transition-all"
              style={{
                backgroundColor: active ? fp.color : "var(--fdf-bg-elevated)",
                color: active ? "#000" : fp.color,
                border: `1px solid ${active ? fp.color : "var(--fdf-border)"}`,
                opacity: active ? 1 : 0.7,
              }}
            >
              {fp.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
