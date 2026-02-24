"use client";

import { useState, useEffect } from "react";
import { X, Zap, Check } from "lucide-react";
import type { SeasonGameResult, FdfTeam } from "@/lib/fdf/types";

interface SimulationModalProps {
  result: SeasonGameResult;
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
  onAccept: () => void;
  onClose: () => void;
}

export function SimulationModal({
  result,
  homeTeam,
  awayTeam,
  onAccept,
  onClose,
}: SimulationModalProps) {
  const [step, setStep] = useState(0);
  const data = result.instantResultData;

  // Auto-advance steps
  useEffect(() => {
    if (step < 5) {
      const timer = setTimeout(() => setStep((s) => s + 1), 600);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const winnerName = result.winner === "home" ? homeTeam.name : awayTeam.name;
  const winnerTeam = result.winner === "home" ? homeTeam : awayTeam;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-lg p-5 space-y-4"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: "#a855f7" }} />
            <h3 className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
              Instant Result
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X size={16} style={{ color: "var(--fdf-text-muted)" }} />
          </button>
        </div>

        {/* Matchup header */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: awayTeam.primaryColor }} />
            <span className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
              {awayTeam.abbreviation}
            </span>
          </div>
          <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>@</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
              {homeTeam.abbreviation}
            </span>
            <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: homeTeam.primaryColor }} />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {/* Step 1: Ratings */}
          {step >= 1 && data && (
            <div
              className="rounded p-2.5 text-xs font-fdf-mono"
              style={{ backgroundColor: "var(--fdf-bg-primary)", border: "1px solid var(--fdf-border)" }}
            >
              <p className="font-bold mb-1" style={{ color: "var(--fdf-accent)" }}>1. Team Ratings</p>
              <div className="flex justify-between">
                <span style={{ color: "var(--fdf-text-secondary)" }}>
                  {awayTeam.abbreviation}: {data.awayTeamRating > 0 ? "+" : ""}{data.awayTeamRating}
                </span>
                <span style={{ color: "var(--fdf-text-secondary)" }}>
                  {homeTeam.abbreviation}: {data.homeTeamRating > 0 ? "+" : ""}{data.homeTeamRating}
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Point Differential */}
          {step >= 2 && data && (
            <div
              className="rounded p-2.5 text-xs font-fdf-mono"
              style={{ backgroundColor: "var(--fdf-bg-primary)", border: "1px solid var(--fdf-border)" }}
            >
              <p className="font-bold mb-1" style={{ color: "var(--fdf-accent)" }}>2. Point Differential</p>
              <span style={{ color: "var(--fdf-text-secondary)" }}>
                Home advantage: {data.pointDifferential > 0 ? "+" : ""}{data.pointDifferential} → Win range 11-{data.winRangeMax}
              </span>
            </div>
          )}

          {/* Step 3: Roll */}
          {step >= 3 && data && (
            <div
              className="rounded p-2.5 text-xs font-fdf-mono"
              style={{ backgroundColor: "var(--fdf-bg-primary)", border: "1px solid var(--fdf-border)" }}
            >
              <p className="font-bold mb-1" style={{ color: "var(--fdf-accent)" }}>3. Win Roll</p>
              <span style={{ color: "var(--fdf-text-secondary)" }}>
                Roll: {data.rollResult} {data.rollResult <= data.winRangeMax ? "→ Home range" : "→ Away upset"}
                {result.isOvertime && ` → OT! (Roll: ${data.otRollResult})`}
              </span>
            </div>
          )}

          {/* Step 4: Winner Score */}
          {step >= 4 && data && (
            <div
              className="rounded p-2.5 text-xs font-fdf-mono"
              style={{ backgroundColor: "var(--fdf-bg-primary)", border: "1px solid var(--fdf-border)" }}
            >
              <p className="font-bold mb-1" style={{ color: "var(--fdf-accent)" }}>4. Scores</p>
              <span style={{ color: "var(--fdf-text-secondary)" }}>
                {winnerTeam.abbreviation} ({data.winnerScoringQuality.replace("_", " ")}) scored via roll {data.winnerScoreRoll}
              </span>
            </div>
          )}

          {/* Step 5: Final Score */}
          {step >= 5 && (
            <div
              className="rounded p-3 text-center"
              style={{ backgroundColor: result.winner === "tie" ? "#f59e0b15" : "#22c55e15", border: `1px solid ${result.winner === "tie" ? "#f59e0b40" : "#22c55e40"}` }}
            >
              <div className="flex items-center justify-center gap-4 mb-1">
                <div className="text-center">
                  <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                    {awayTeam.abbreviation}
                  </span>
                  <p className="text-2xl font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                    {result.awayScore}
                  </p>
                </div>
                <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>-</span>
                <div className="text-center">
                  <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                    {homeTeam.abbreviation}
                  </span>
                  <p className="text-2xl font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                    {result.homeScore}
                  </p>
                </div>
              </div>
              {result.winner !== "tie" && (
                <p className="text-xs font-fdf-mono font-bold" style={{ color: "#22c55e" }}>
                  {winnerName} wins{result.isOvertime ? " in OT" : ""}!
                </p>
              )}
              {result.winner === "tie" && (
                <p className="text-xs font-fdf-mono font-bold" style={{ color: "#f59e0b" }}>
                  Tie game in overtime!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Accept button */}
        {step >= 5 && (
          <button
            onClick={onAccept}
            className="w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-bold text-white"
            style={{ backgroundColor: "#22c55e" }}
          >
            <Check size={16} />
            Accept Result
          </button>
        )}
      </div>
    </div>
  );
}
