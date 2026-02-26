"use client";

import { useState, useCallback } from "react";
import { Coins, Zap } from "lucide-react";
import type { FdfTeam } from "@/lib/fdf/types";
import { useGameStore } from "@/lib/fdf/stores/game-store";

interface OTCoinTossProps {
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
  gameId: string;
  seasonCanEndInTie?: boolean;
}

export function OTCoinToss({ homeTeam, awayTeam, gameId, seasonCanEndInTie }: OTCoinTossProps) {
  const initOvertime = useGameStore((s) => s.initOvertime);
  const [coinTossWinner, setCoinTossWinner] = useState<"home" | "away" | null>(null);
  const [canEndInTie, setCanEndInTie] = useState(seasonCanEndInTie ?? false);
  const [flipping, setFlipping] = useState(false);

  const handleCoinToss = useCallback(() => {
    setFlipping(true);
    setCoinTossWinner(null);
    setTimeout(() => {
      const result: "home" | "away" = Math.random() < 0.5 ? "home" : "away";
      setCoinTossWinner(result);
      setFlipping(false);
    }, 600);
  }, []);

  const handleStartOT = () => {
    if (!coinTossWinner) return;
    initOvertime(gameId, coinTossWinner, canEndInTie);
  };

  const winnerTeam = coinTossWinner === "home" ? homeTeam : coinTossWinner === "away" ? awayTeam : null;

  return (
    <div
      className="rounded-lg p-5"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h2
          className="text-lg font-bold font-fdf-mono uppercase tracking-wider"
          style={{ color: "var(--fdf-scoreboard-text)" }}
        >
          Overtime
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--fdf-text-muted)" }}>
          NFL overtime rules — each team guaranteed at least one possession
        </p>
      </div>

      {/* Coin Toss */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-bold font-fdf-mono uppercase tracking-wider"
            style={{ color: "var(--fdf-text-secondary)" }}
          >
            Coin Toss Winner (Receives)
          </span>
          <button
            type="button"
            onClick={handleCoinToss}
            disabled={flipping}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-fdf-mono font-bold transition-all"
            style={{
              color: "var(--fdf-accent)",
              border: "1px solid var(--fdf-accent)",
              opacity: flipping ? 0.5 : 0.9,
            }}
          >
            <Coins size={14} className={flipping ? "animate-spin" : ""} />
            {flipping ? "Flipping..." : "Coin Toss"}
          </button>
        </div>

        {coinTossWinner && winnerTeam && (
          <p
            className="text-xs font-fdf-mono mb-2 text-center font-bold"
            style={{ color: "var(--fdf-accent)" }}
          >
            {winnerTeam.name} wins the toss and receives!
          </p>
        )}

        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="radio"
              name="ot-receiver"
              checked={coinTossWinner === "away"}
              onChange={() => setCoinTossWinner("away")}
              className="accent-blue-500"
            />
            <span
              className="text-sm"
              style={{
                color: coinTossWinner === "away" ? "var(--fdf-text-primary)" : "var(--fdf-text-muted)",
              }}
            >
              {awayTeam.abbreviation} receives
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="radio"
              name="ot-receiver"
              checked={coinTossWinner === "home"}
              onChange={() => setCoinTossWinner("home")}
              className="accent-blue-500"
            />
            <span
              className="text-sm"
              style={{
                color: coinTossWinner === "home" ? "var(--fdf-text-primary)" : "var(--fdf-text-muted)",
              }}
            >
              {homeTeam.abbreviation} receives
            </span>
          </label>
        </div>
      </div>

      {/* Can End in Tie toggle (only if not provided by season) */}
      {seasonCanEndInTie === undefined && (
        <div
          className="mb-4 rounded-md p-3"
          style={{ backgroundColor: "var(--fdf-bg-elevated)", border: "1px solid var(--fdf-border)" }}
        >
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={canEndInTie}
              onChange={(e) => setCanEndInTie(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span
              className="text-sm font-bold"
              style={{ color: canEndInTie ? "var(--fdf-accent)" : "var(--fdf-text-secondary)" }}
            >
              Can end in tie
            </span>
          </label>
          <p className="text-xs mt-1.5 ml-[26px]" style={{ color: "var(--fdf-text-muted)" }}>
            {canEndInTie
              ? "Regular season rules — game ends as tie if still tied after OT period"
              : "Playoff rules — additional OT periods until a winner"}
          </p>
        </div>
      )}

      {seasonCanEndInTie !== undefined && (
        <div className="mb-4">
          <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            {seasonCanEndInTie
              ? "Regular season — game can end as a tie"
              : "Playoff rules — no ties allowed"}
          </p>
        </div>
      )}

      {/* Start OT button */}
      <button
        onClick={handleStartOT}
        disabled={!coinTossWinner}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-md text-sm font-bold text-white transition-colors disabled:opacity-40"
        style={{ backgroundColor: "var(--fdf-accent)" }}
      >
        <Zap size={18} />
        Start Overtime
      </button>
    </div>
  );
}
