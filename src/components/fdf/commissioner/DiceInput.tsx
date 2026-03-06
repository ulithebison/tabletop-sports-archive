"use client";

import { useState, useCallback } from "react";
import { Dices } from "lucide-react";
import { randomD6, formatDiceResult } from "@/lib/fdf/commissioner/dice-engine";

interface DiceInputProps {
  value: string; // DiceResult "11"-"66" or single "1"-"6"
  onChange: (value: string) => void;
  label?: string;
  diceCount?: 1 | 2;
  disabled?: boolean;
}

export function DiceInput({
  value,
  onChange,
  label,
  diceCount = 2,
  disabled = false,
}: DiceInputProps) {
  const [isRolling, setIsRolling] = useState(false);

  const die1 = diceCount === 2 ? parseInt(value[0] || "1", 10) : parseInt(value || "1", 10);
  const die2 = diceCount === 2 ? parseInt(value[1] || "1", 10) : 0;

  const handleDie1Change = useCallback(
    (val: number) => {
      if (diceCount === 1) {
        onChange(String(val));
      } else {
        onChange(formatDiceResult(val, die2 || 1));
      }
    },
    [diceCount, die2, onChange]
  );

  const handleDie2Change = useCallback(
    (val: number) => {
      onChange(formatDiceResult(die1, val));
    },
    [die1, onChange]
  );

  const handleAutoRoll = useCallback(() => {
    setIsRolling(true);
    // Brief animation delay
    setTimeout(() => {
      if (diceCount === 1) {
        onChange(String(randomD6()));
      } else {
        onChange(formatDiceResult(randomD6(), randomD6()));
      }
      setIsRolling(false);
    }, 200);
  }, [diceCount, onChange]);

  const displayValue = diceCount === 2 ? `${die1}-${die2} = ${value}` : `${die1}`;

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span
          className="text-xs font-fdf-mono font-bold whitespace-nowrap"
          style={{ color: "var(--fdf-text-muted)" }}
        >
          {label}
        </span>
      )}

      <div className="flex items-center gap-1">
        {/* Die 1 */}
        <select
          value={die1}
          onChange={(e) => handleDie1Change(Number(e.target.value))}
          disabled={disabled || isRolling}
          className="px-2 py-1 rounded text-sm font-fdf-mono font-bold text-center appearance-none cursor-pointer"
          style={{
            backgroundColor: "var(--fdf-bg-secondary)",
            border: "1px solid var(--fdf-border)",
            color: "var(--fdf-text-primary)",
            width: "3rem",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        {/* Die 2 (only for 2d6) */}
        {diceCount === 2 && (
          <>
            <span
              className="text-xs font-fdf-mono"
              style={{ color: "var(--fdf-text-muted)" }}
            >
              -
            </span>
            <select
              value={die2}
              onChange={(e) => handleDie2Change(Number(e.target.value))}
              disabled={disabled || isRolling}
              className="px-2 py-1 rounded text-sm font-fdf-mono font-bold text-center appearance-none cursor-pointer"
              style={{
                backgroundColor: "var(--fdf-bg-secondary)",
                border: "1px solid var(--fdf-border)",
                color: "var(--fdf-text-primary)",
                width: "3rem",
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Result display */}
      <span
        className="text-sm font-fdf-mono font-bold px-2 py-0.5 rounded"
        style={{
          backgroundColor: "var(--fdf-accent)",
          color: "#fff",
          minWidth: diceCount === 2 ? "4.5rem" : "2rem",
          textAlign: "center",
        }}
      >
        {isRolling ? "..." : displayValue}
      </span>

      {/* Auto-Roll button */}
      <button
        onClick={handleAutoRoll}
        disabled={disabled || isRolling}
        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors"
        style={{
          backgroundColor: "var(--fdf-bg-secondary)",
          border: "1px solid var(--fdf-border)",
          color: "var(--fdf-text-secondary)",
        }}
        title="Auto-Roll"
      >
        <Dices size={14} className={isRolling ? "animate-spin" : ""} />
        Roll
      </button>
    </div>
  );
}
