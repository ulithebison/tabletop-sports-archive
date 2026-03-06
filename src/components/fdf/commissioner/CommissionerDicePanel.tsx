"use client";

import { useState, useCallback } from "react";
import { Dices, Hand, Monitor } from "lucide-react";
import { randomD6, formatDiceResult } from "@/lib/fdf/commissioner/dice-engine";

export type DiceMode = "auto" | "manual" | "digital";

// ── Mode Toggle ─────────────────────────────────────────────

interface DiceModeToggleProps {
  mode: DiceMode;
  onChange: (mode: DiceMode) => void;
  showDigital?: boolean; // hide digital mode for card-draw-only steps
}

export function DiceModeToggle({ mode, onChange, showDigital = true }: DiceModeToggleProps) {
  const modes: { value: DiceMode; label: string; icon: React.ReactNode }[] = [
    { value: "auto", label: "Auto", icon: <Dices size={12} /> },
    { value: "manual", label: "Manual", icon: <Hand size={12} /> },
    ...(showDigital ? [{ value: "digital" as DiceMode, label: "Dice", icon: <Monitor size={12} /> }] : []),
  ];

  return (
    <div className="inline-flex rounded-md overflow-hidden" style={{ border: "1px solid var(--fdf-border)" }}>
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-fdf-mono font-bold transition-colors"
          style={{
            backgroundColor: mode === m.value ? "var(--fdf-accent)" : "var(--fdf-bg-secondary)",
            color: mode === m.value ? "#fff" : "var(--fdf-text-muted)",
            borderRight: "1px solid var(--fdf-border)",
          }}
          type="button"
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}

// ── Digital Dice Panel ──────────────────────────────────────

interface DigitalDieProp {
  value: number;
  rolling: boolean;
  onClick: () => void;
}

function DigitalDie({ value, rolling, onClick }: DigitalDieProp) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 ${rolling ? "animate-bounce" : ""}`}
      style={{
        backgroundColor: "#1a1a2e",
        border: "2px solid var(--fdf-accent)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
      type="button"
      title="Click to roll"
    >
      <span
        className="text-2xl font-bold font-fdf-mono"
        style={{ color: "var(--fdf-text-primary)" }}
      >
        {rolling ? "?" : value}
      </span>
    </button>
  );
}

interface DigitalDicePanelProps {
  diceCount: 1 | 2;
  onResult: (result: string) => void;
  teams: { name: string; abbreviation: string; primaryColor: string }[];
  selectedTeamIndex: number;
  onSelectTeam: (index: number) => void;
  label?: string;
}

export function DigitalDicePanel({
  diceCount,
  onResult,
  teams,
  selectedTeamIndex,
  onSelectTeam,
  label,
}: DigitalDicePanelProps) {
  const [die1, setDie1] = useState(1);
  const [die2, setDie2] = useState(1);
  const [rolling1, setRolling1] = useState(false);
  const [rolling2, setRolling2] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const rollDie = useCallback((setter: (v: number) => void, setRolling: (v: boolean) => void) => {
    setRolling(true);
    setTimeout(() => {
      const v = randomD6();
      setter(v);
      setRolling(false);
      return v;
    }, 250);
  }, []);

  const rollAll = useCallback(() => {
    setRolling1(true);
    setRolling2(true);
    setTimeout(() => {
      const v1 = randomD6();
      const v2 = randomD6();
      setDie1(v1);
      setDie2(v2);
      setRolling1(false);
      setRolling2(false);
      const result = diceCount === 1 ? String(v1) : formatDiceResult(v1, v2);
      setLastResult(result);
    }, 300);
  }, [diceCount]);

  const handleApply = useCallback(() => {
    const result = diceCount === 1 ? String(die1) : formatDiceResult(die1, die2);
    onResult(result);
    setLastResult(null);
  }, [die1, die2, diceCount, onResult]);

  return (
    <div
      className="rounded-lg p-3 space-y-3"
      style={{ backgroundColor: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)" }}
    >
      {label && (
        <span className="text-xs font-fdf-mono font-bold" style={{ color: "var(--fdf-text-muted)" }}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-4">
        {/* Dice */}
        <div className="flex items-center gap-2">
          <DigitalDie value={die1} rolling={rolling1} onClick={() => rollDie(setDie1, setRolling1)} />
          {diceCount === 2 && (
            <DigitalDie value={die2} rolling={rolling2} onClick={() => rollDie(setDie2, setRolling2)} />
          )}
        </div>

        {/* Result */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-lg font-fdf-mono font-bold px-3 py-1 rounded"
            style={{ backgroundColor: "var(--fdf-accent)", color: "#fff" }}
          >
            {rolling1 || rolling2
              ? "..."
              : diceCount === 1
                ? die1
                : `${die1}-${die2}`}
          </span>
          <button
            onClick={rollAll}
            disabled={rolling1 || rolling2}
            className="text-[10px] font-fdf-mono px-2 py-0.5 rounded transition-colors"
            style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-secondary)" }}
            type="button"
          >
            Roll All
          </button>
        </div>

        {/* Team selector + Apply */}
        <div className="flex items-center gap-2 ml-auto">
          <select
            value={selectedTeamIndex}
            onChange={(e) => onSelectTeam(Number(e.target.value))}
            className="px-2 py-1 rounded text-xs font-fdf-mono"
            style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
          >
            {teams.map((t, i) => (
              <option key={i} value={i}>{t.abbreviation}</option>
            ))}
          </select>
          <button
            onClick={handleApply}
            disabled={rolling1 || rolling2}
            className="px-3 py-1.5 rounded text-xs font-fdf-mono font-bold text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: "#22c55e" }}
            type="button"
          >
            Apply
          </button>
        </div>
      </div>
      {lastResult && (
        <div className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
          Last roll: {lastResult}
        </div>
      )}
    </div>
  );
}
