"use client";

import type { GameMode } from "@/lib/fdf/types";
import { Minus, Plus } from "lucide-react";

interface DriveTimeSelectorProps {
  value: number;
  onChange: (ticks: number) => void;
  maxTicks?: number;
  gameMode?: GameMode;
  sevenPlusMinuteDrive?: boolean;
}

export function DriveTimeSelector({ value, onChange, maxTicks = 4, gameMode, sevenPlusMinuteDrive }: DriveTimeSelectorProps) {
  const isFAC = gameMode === "fac";

  return (
    <div>
      <label
        className="block text-xs font-bold font-fdf-mono uppercase tracking-wider mb-1.5"
        style={{ color: "var(--fdf-text-secondary)" }}
      >
        Drive Time ({isFAC ? "Cards" : "Ticks"})
      </label>
      {isFAC ? (
        /* FAC: numeric stepper */
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, value - 1))}
            disabled={value <= 0}
            className="flex items-center justify-center w-9 h-9 rounded-md transition-all disabled:opacity-30"
            style={{
              backgroundColor: "var(--fdf-bg-elevated)",
              border: "1px solid var(--fdf-border)",
              color: "var(--fdf-text-primary)",
            }}
          >
            <Minus size={16} />
          </button>
          <span
            className="text-2xl font-fdf-mono font-bold w-10 text-center"
            style={{ color: value > 0 ? "var(--fdf-accent)" : "var(--fdf-text-muted)" }}
          >
            {value}
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(maxTicks, value + 1))}
            disabled={value >= maxTicks}
            className="flex items-center justify-center w-9 h-9 rounded-md transition-all disabled:opacity-30"
            style={{
              backgroundColor: "var(--fdf-bg-elevated)",
              border: "1px solid var(--fdf-border)",
              color: "var(--fdf-text-primary)",
            }}
          >
            <Plus size={16} />
          </button>
          <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            / {maxTicks}
          </span>
        </div>
      ) : (
        /* Dice: tick buttons */
        <div className="flex gap-2 items-center">
          {Array.from({ length: maxTicks }, (_, i) => {
            const ticks = i + 1;
            const active = value === ticks;
            return (
              <button
                key={ticks}
                type="button"
                onClick={() => onChange(ticks)}
                className="flex items-center justify-center gap-0.5 px-2.5 py-2 rounded-md transition-all"
                style={{
                  backgroundColor: active ? "var(--fdf-accent)" : "var(--fdf-bg-elevated)",
                  border: `1px solid ${active ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
                }}
              >
                {Array.from({ length: ticks }, (_, j) => (
                  <div
                    key={j}
                    className="rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: active ? "#fff" : "var(--fdf-accent)",
                    }}
                  />
                ))}
              </button>
            );
          })}
          {sevenPlusMinuteDrive && (
            <>
              <div className="w-px h-6 mx-0.5" style={{ backgroundColor: "var(--fdf-border)" }} />
              <button
                type="button"
                onClick={() => onChange(6)}
                className="flex flex-col items-center justify-center px-3 py-1.5 rounded-md transition-all"
                style={{
                  backgroundColor: value === 6 ? "#22c55e" : "var(--fdf-bg-elevated)",
                  border: `1px solid ${value === 6 ? "#22c55e" : "var(--fdf-border)"}`,
                }}
              >
                <span
                  className="text-sm font-fdf-mono font-bold leading-none"
                  style={{ color: value === 6 ? "#fff" : "#22c55e" }}
                >
                  6
                </span>
                <span
                  className="text-[9px] font-fdf-mono font-bold leading-none mt-0.5"
                  style={{ color: value === 6 ? "rgba(255,255,255,0.8)" : "rgba(34,197,94,0.7)" }}
                >
                  7+
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
