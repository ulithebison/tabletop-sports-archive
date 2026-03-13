"use client";

import { useState } from "react";
import { Dice6, SkipForward } from "lucide-react";

interface SevenPlusMinutePromptProps {
  onResult: (newTicks: number) => void;
  onSkip: () => void;
}

export function SevenPlusMinutePrompt({ onResult, onSkip }: SevenPlusMinutePromptProps) {
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  const handleRoll = () => {
    setRolling(true);
    setTimeout(() => {
      const result = Math.floor(Math.random() * 6) + 1;
      setRollResult(result);
      setRolling(false);
      // Auto-apply after brief display
      setTimeout(() => {
        onResult(result === 6 ? 6 : 4);
      }, 1200);
    }, 300);
  };

  const isDouble6 = rollResult === 6;

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: "var(--fdf-bg-elevated)",
        border: `2px solid ${rollResult !== null ? (isDouble6 ? "#22c55e" : "var(--fdf-border)") : "var(--fdf-accent)"}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Dice6 size={16} style={{ color: "var(--fdf-accent)" }} />
        <span
          className="text-xs font-bold font-fdf-mono uppercase tracking-wider"
          style={{ color: "var(--fdf-accent)" }}
        >
          7+ Minute Drive?
        </span>
      </div>

      {rollResult === null ? (
        <>
          <p className="text-xs mb-3" style={{ color: "var(--fdf-text-muted)" }}>
            Timing die showed 6 (4 ticks). Roll again — if 6, drive extends to 6 ticks (7:30).
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRoll}
              disabled={rolling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-fdf-mono font-bold text-white transition-all"
              style={{ backgroundColor: "var(--fdf-accent)", opacity: rolling ? 0.5 : 1 }}
            >
              <Dice6 size={14} className={rolling ? "animate-spin" : ""} />
              {rolling ? "Rolling..." : "Roll Timing Die"}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-fdf-mono font-medium transition-all"
              style={{ color: "var(--fdf-text-muted)", border: "1px solid var(--fdf-border)" }}
            >
              <SkipForward size={14} />
              Skip
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-md text-lg font-fdf-mono font-bold"
            style={{
              backgroundColor: isDouble6 ? "rgba(34,197,94,0.15)" : "var(--fdf-bg-card)",
              color: isDouble6 ? "#22c55e" : "var(--fdf-text-muted)",
              border: `2px solid ${isDouble6 ? "#22c55e" : "var(--fdf-border)"}`,
            }}
          >
            {rollResult}
          </div>
          <p className="text-xs font-fdf-mono font-bold" style={{ color: isDouble6 ? "#22c55e" : "var(--fdf-text-muted)" }}>
            {isDouble6
              ? "Double 6! Drive extended to 6 ticks (7:30)"
              : `Result: ${rollResult} — drive stays at 4 ticks`}
          </p>
        </div>
      )}
    </div>
  );
}
