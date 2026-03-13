"use client";

import { useState, useCallback } from "react";
import { X, Play, Coins, Sparkles, Dice5, Layers, Timer } from "lucide-react";
import { useSettingsStore } from "@/lib/fdf/stores/settings-store";
import type { ScheduleGame, FdfTeam, GameMode } from "@/lib/fdf/types";

interface PreGameModalProps {
  game: ScheduleGame;
  homeTeam: FdfTeam | undefined;
  awayTeam: FdfTeam | undefined;
  onStart: (enhancedMode: boolean, receivingTeam: "home" | "away", gameMode?: GameMode, sevenPlusMinuteDrive?: boolean) => void;
  onCancel: () => void;
}

export function PreGameModal({ game, homeTeam, awayTeam, onStart, onCancel }: PreGameModalProps) {
  const globalEnhanced = useSettingsStore((s) => s.enhancedMode);
  const globalGameMode = useSettingsStore((s) => s.defaultGameMode);
  const global7Plus = useSettingsStore((s) => s.sevenPlusMinuteDriveRule);
  const [enhancedMode, setEnhancedMode] = useState(globalEnhanced);
  const [gameMode, setGameMode] = useState<GameMode>(globalGameMode);
  const [sevenPlusMinute, setSevenPlusMinute] = useState(global7Plus);
  const [receivingTeam, setReceivingTeam] = useState<"home" | "away">("away");
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<"home" | "away" | null>(null);

  const rosterWarning = enhancedMode && (
    !(awayTeam?.finderRoster || awayTeam?.roster) ||
    !(homeTeam?.finderRoster || homeTeam?.roster)
  );

  const handleCoinToss = useCallback(() => {
    setCoinFlipping(true);
    setCoinResult(null);
    setTimeout(() => {
      const result: "home" | "away" = Math.random() < 0.5 ? "home" : "away";
      setCoinResult(result);
      setReceivingTeam(result);
      setCoinFlipping(false);
    }, 600);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
      <div
        className="w-full max-w-sm rounded-lg p-5 relative"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1 rounded hover:bg-white/10"
          style={{ color: "var(--fdf-text-muted)" }}
        >
          <X size={16} />
        </button>

        <h2 className="text-sm font-fdf-mono font-bold mb-4" style={{ color: "var(--fdf-text-primary)" }}>
          Game Setup
        </h2>

        {/* Teams display */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: awayTeam?.primaryColor || "#666" }} />
            <span className="text-xs font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
              {awayTeam?.abbreviation || "AWY"}
            </span>
          </div>
          <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>@</span>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: homeTeam?.primaryColor || "#666" }} />
            <span className="text-xs font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
              {homeTeam?.abbreviation || "HME"}
            </span>
          </div>
        </div>

        {/* Enhanced Mode Toggle */}
        <div
          className="rounded-md p-3 mb-4"
          style={{ backgroundColor: "var(--fdf-bg-elevated)", border: "1px solid var(--fdf-border)" }}
        >
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={enhancedMode}
              onChange={(e) => setEnhancedMode(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <Sparkles size={14} style={{ color: enhancedMode ? "var(--fdf-accent)" : "var(--fdf-text-muted)" }} />
            <span className="text-xs font-bold" style={{ color: enhancedMode ? "var(--fdf-accent)" : "var(--fdf-text-secondary)" }}>
              Enhanced Mode
            </span>
          </label>
          <p className="text-[10px] mt-1.5 ml-[26px]" style={{ color: "var(--fdf-text-muted)" }}>
            Track players per drive, auto play-by-play, box scores
          </p>
          {rosterWarning && (
            <p className="text-[10px] mt-1.5 ml-[26px] font-medium" style={{ color: "#f59e0b" }}>
              Warning: {
                !(awayTeam?.finderRoster || awayTeam?.roster) && !(homeTeam?.finderRoster || homeTeam?.roster)
                  ? "Both teams need"
                  : !(awayTeam?.finderRoster || awayTeam?.roster)
                    ? (awayTeam?.name || "Away") + " needs"
                    : (homeTeam?.name || "Home") + " needs"
              } a roster for Enhanced Mode.
            </p>
          )}
        </div>

        {/* Game Mode Toggle */}
        <div
          className="rounded-md p-3 mb-4"
          style={{ backgroundColor: "var(--fdf-bg-elevated)", border: "1px solid var(--fdf-border)" }}
        >
          <span className="text-[10px] font-bold font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-text-secondary)" }}>
            Game Mode
          </span>
          <div className="flex gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => setGameMode("dice")}
              className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded text-xs font-bold font-fdf-mono transition-all"
              style={{
                backgroundColor: gameMode === "dice" ? "var(--fdf-accent)" : "var(--fdf-bg-card)",
                color: gameMode === "dice" ? "#000" : "var(--fdf-text-secondary)",
                border: `1px solid ${gameMode === "dice" ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
              }}
            >
              <Dice5 size={12} />
              Dice
            </button>
            <button
              type="button"
              onClick={() => setGameMode("fac")}
              className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded text-xs font-bold font-fdf-mono transition-all"
              style={{
                backgroundColor: gameMode === "fac" ? "var(--fdf-accent)" : "var(--fdf-bg-card)",
                color: gameMode === "fac" ? "#000" : "var(--fdf-text-secondary)",
                border: `1px solid ${gameMode === "fac" ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
              }}
            >
              <Layers size={12} />
              FAC
            </button>
          </div>
        </div>

        {/* 7+ Minute Drive Toggle — only in Dice mode */}
        {gameMode === "dice" && (
          <div
            className="rounded-md p-3 mb-4"
            style={{ backgroundColor: "var(--fdf-bg-elevated)", border: "1px solid var(--fdf-border)" }}
          >
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sevenPlusMinute}
                onChange={(e) => setSevenPlusMinute(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <Timer size={14} style={{ color: sevenPlusMinute ? "var(--fdf-accent)" : "var(--fdf-text-muted)" }} />
              <span className="text-xs font-bold" style={{ color: sevenPlusMinute ? "var(--fdf-accent)" : "var(--fdf-text-secondary)" }}>
                7+ Minute Drive
              </span>
            </label>
            <p className="text-[10px] mt-1.5 ml-[26px]" style={{ color: "var(--fdf-text-muted)" }}>
              Roll 6 on timing die → re-roll → if 6 again: 6 ticks (7:30)
            </p>
          </div>
        )}

        {/* Coin Toss button */}
        <div className="flex justify-center mb-3">
          <button
            onClick={handleCoinToss}
            disabled={coinFlipping}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-fdf-mono font-bold transition-all"
            style={{
              color: "var(--fdf-accent)",
              border: "1px solid var(--fdf-accent)",
              opacity: coinFlipping ? 0.5 : 0.9,
            }}
          >
            <Coins size={14} className={coinFlipping ? "animate-spin" : ""} />
            {coinFlipping ? "Flipping..." : "Coin Toss"}
          </button>
        </div>

        {coinResult && (
          <p className="text-xs font-fdf-mono mb-3 text-center font-bold" style={{ color: "var(--fdf-accent)" }}>
            {coinResult === "away"
              ? (awayTeam?.name || "Away") + " receives!"
              : (homeTeam?.name || "Home") + " receives!"}
          </p>
        )}

        {/* Manual receiving team selection */}
        <div className="flex gap-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="radio"
              name="pregame-receiving"
              checked={receivingTeam === "away"}
              onChange={() => { setReceivingTeam("away"); setCoinResult(null); }}
              className="accent-blue-500"
            />
            <span className="text-sm" style={{ color: receivingTeam === "away" ? "var(--fdf-text-primary)" : "var(--fdf-text-muted)" }}>
              {awayTeam?.abbreviation || "Away"} receives
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="radio"
              name="pregame-receiving"
              checked={receivingTeam === "home"}
              onChange={() => { setReceivingTeam("home"); setCoinResult(null); }}
              className="accent-blue-500"
            />
            <span className="text-sm" style={{ color: receivingTeam === "home" ? "var(--fdf-text-primary)" : "var(--fdf-text-muted)" }}>
              {homeTeam?.abbreviation || "Home"} receives
            </span>
          </label>
        </div>

        <button
          onClick={() => onStart(enhancedMode, receivingTeam, gameMode, gameMode === "dice" ? sevenPlusMinute || undefined : undefined)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: "var(--fdf-accent)" }}
        >
          <Play size={16} />
          Start Game
        </button>
      </div>
    </div>
  );
}
