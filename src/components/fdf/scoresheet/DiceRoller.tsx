"use client";

import { useState, useEffect, useRef } from "react";
import { Dices, Undo2 } from "lucide-react";

const DICE_COLORS = [
  { bg: "#1a1a1a", text: "#ffffff" }, // black bg, white text
  { bg: "#ffffff", text: "#1a1a1a" }, // white bg, black text
  { bg: "#dc2626", text: "#ffffff" }, // red bg, white text
];

interface DiceRollerProps {
  onRoll?: (values: number[]) => void;
}

export function DiceRoller({ onRoll }: DiceRollerProps) {
  const [dice, setDice] = useState<number[]>([0, 0, 0]);
  const [prevDice, setPrevDice] = useState<number[] | null>(null);
  const [rolling, setRolling] = useState<boolean[]>([false, false, false]);
  const onRollRef = useRef(onRoll);
  onRollRef.current = onRoll;
  const isInitial = useRef(true);

  // Notify parent of dice changes via useEffect to avoid setState-in-render
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    if (dice.some(v => v > 0)) {
      onRollRef.current?.(dice);
    }
  }, [dice]);

  const rollDie = (index: number) => {
    setPrevDice([...dice]);
    setRolling((prev) => { const n = [...prev]; n[index] = true; return n; });
    setTimeout(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      setDice((prev) => {
        const n = [...prev];
        n[index] = value;
        return n;
      });
      setRolling((prev) => { const n = [...prev]; n[index] = false; return n; });
    }, 200);
  };

  const rollAll = () => {
    setPrevDice([...dice]);
    setRolling([true, true, true]);
    setTimeout(() => {
      const values = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ];
      setDice(values);
      setRolling([false, false, false]);
    }, 300);
  };

  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-sm font-bold font-fdf-mono uppercase tracking-wider"
          style={{ color: "var(--fdf-accent)" }}
        >
          Dice
        </h3>
        <button
          type="button"
          onClick={rollAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-fdf-mono font-bold transition-colors"
          style={{ color: "var(--fdf-accent)", border: "1px solid var(--fdf-accent)", opacity: 0.8 }}
        >
          <Dices size={12} />
          Roll All
        </button>
      </div>
      <div className="flex gap-2 justify-center">
        {dice.map((value, i) => (
          <button
            key={i}
            type="button"
            onClick={() => rollDie(i)}
            className="w-14 h-14 rounded-md flex items-center justify-center text-xl font-fdf-mono font-bold transition-all active:scale-95"
            style={{
              backgroundColor: value > 0 ? DICE_COLORS[i].bg : "rgba(148,163,184,0.08)",
              color: value > 0 ? DICE_COLORS[i].text : "var(--fdf-text-muted)",
              border: value > 0 && i === 0 ? "1px solid rgba(148,163,184,0.3)" : "1px solid var(--fdf-border)",
              transform: rolling[i] ? "rotate(180deg)" : undefined,
            }}
          >
            {rolling[i] ? "?" : value > 0 ? value : "—"}
          </button>
        ))}
      </div>
      {dice.some(v => v > 0) && (
        <div className="mt-1.5 flex flex-col items-center gap-1">
          <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            {dice.filter(v => v > 0).sort((a, b) => a - b).join("-")}
          </p>
          {prevDice !== null && prevDice.some(v => v > 0) && (
            <button
              type="button"
              onClick={() => {
                setDice(prevDice);
                setPrevDice(null);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-fdf-mono transition-colors"
              style={{ color: "var(--fdf-text-muted)", opacity: 0.7 }}
            >
              <Undo2 size={10} />
              Undo Roll
            </button>
          )}
        </div>
      )}
    </div>
  );
}
