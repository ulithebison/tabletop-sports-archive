"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Users, Sparkles, Coins, Dice5, Layers, Timer } from "lucide-react";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { useSettingsStore } from "@/lib/fdf/stores/settings-store";
import type { GameMode } from "@/lib/fdf/types";
import { TeamSelector } from "@/components/fdf/teams/TeamSelector";

export default function QuickGamePage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const teamsMap = useTeamStore((s) => s.teams);
  const teams = useMemo(
    () => Object.values(teamsMap).sort((a, b) => a.name.localeCompare(b.name)),
    [teamsMap]
  );
  const createGame = useGameStore((s) => s.createGame);
  const globalEnhanced = useSettingsStore((s) => s.enhancedMode);
  const globalGameMode = useSettingsStore((s) => s.defaultGameMode);
  const global7Plus = useSettingsStore((s) => s.sevenPlusMinuteDriveRule);

  const [awayTeamId, setAwayTeamId] = useState("");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [enhancedMode, setEnhancedMode] = useState(globalEnhanced);
  const [gameMode, setGameMode] = useState<GameMode>(globalGameMode);
  const [sevenPlusMinute, setSevenPlusMinute] = useState(global7Plus);
  const [receivingTeam, setReceivingTeam] = useState<"home" | "away">("away");
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<"home" | "away" | null>(null);

  useEffect(() => setHydrated(true), []);

  const handleCoinToss = useCallback(() => {
    setCoinFlipping(true);
    setCoinResult(null);
    // Brief animation delay
    setTimeout(() => {
      const result: "home" | "away" = Math.random() < 0.5 ? "home" : "away";
      setCoinResult(result);
      setReceivingTeam(result);
      setCoinFlipping(false);
    }, 600);
  }, []);

  if (!hydrated) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  const canStart = awayTeamId && homeTeamId && awayTeamId !== homeTeamId;

  const awayTeam = awayTeamId ? teamsMap[awayTeamId] : null;
  const homeTeam = homeTeamId ? teamsMap[homeTeamId] : null;
  const rosterWarning = enhancedMode && canStart && (
    !(awayTeam?.finderRoster || awayTeam?.roster) || !(homeTeam?.finderRoster || homeTeam?.roster)
  );

  const handleStart = () => {
    if (!canStart) return;
    const gameId = createGame(homeTeamId, awayTeamId, enhancedMode || undefined, receivingTeam, gameMode, gameMode === "dice" ? sevenPlusMinute || undefined : undefined);
    router.push(`/fdf/game/${gameId}`);
  };

  if (teams.length < 2) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold font-fdf-mono mb-6" style={{ color: "var(--fdf-text-primary)" }}>
          Quick Game
        </h1>
        <div
          className="text-center py-16 rounded-lg"
          style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
        >
          <Users size={32} className="mx-auto mb-3" style={{ color: "var(--fdf-text-muted)" }} />
          <p className="text-lg font-medium mb-2" style={{ color: "var(--fdf-text-secondary)" }}>
            Need at least 2 teams
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--fdf-text-muted)" }}>
            Create some teams before starting a game
          </p>
          <Link
            href="/fdf/teams/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold text-white"
            style={{ backgroundColor: "var(--fdf-accent)" }}
          >
            Create Team
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold font-fdf-mono mb-6" style={{ color: "var(--fdf-text-primary)" }}>
        Quick Game
      </h1>

      <div
        className="rounded-lg p-6"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <div className="space-y-4">
          <TeamSelector
            label="Away Team"
            teams={teams}
            value={awayTeamId}
            onChange={setAwayTeamId}
            excludeId={homeTeamId}
          />
          <div className="flex items-center justify-center">
            <span className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-muted)" }}>
              @
            </span>
          </div>
          <TeamSelector
            label="Home Team"
            teams={teams}
            value={homeTeamId}
            onChange={setHomeTeamId}
            excludeId={awayTeamId}
          />
        </div>

        {awayTeamId && homeTeamId && awayTeamId === homeTeamId && (
          <p className="mt-3 text-sm" style={{ color: "#ef4444" }}>
            Away and Home teams must be different
          </p>
        )}

        {/* Enhanced Mode Toggle */}
        <div
          className="mt-4 rounded-md p-3"
          style={{ backgroundColor: "var(--fdf-bg-elevated)", border: "1px solid var(--fdf-border)" }}
        >
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={enhancedMode}
              onChange={(e) => setEnhancedMode(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <Sparkles size={16} style={{ color: enhancedMode ? "var(--fdf-accent)" : "var(--fdf-text-muted)" }} />
            <span className="text-sm font-bold" style={{ color: enhancedMode ? "var(--fdf-accent)" : "var(--fdf-text-secondary)" }}>
              Enhanced Mode
            </span>
          </label>
          <p className="text-xs mt-1.5 ml-[26px]" style={{ color: "var(--fdf-text-muted)" }}>
            Track players per drive, auto-generate play-by-play, and get post-game box scores
          </p>
          {rosterWarning && (
            <p className="text-xs mt-2 ml-[26px] font-medium" style={{ color: "#f59e0b" }}>
              Warning: {!(awayTeam?.finderRoster || awayTeam?.roster) && !(homeTeam?.finderRoster || homeTeam?.roster) ? "Both teams need" : (!(awayTeam?.finderRoster || awayTeam?.roster) ? awayTeam?.name + " needs" : homeTeam?.name + " needs")} a roster for Enhanced Mode. Player tracking will be limited.
            </p>
          )}
        </div>

        {/* Game Mode Toggle */}
        <div
          className="mt-4 rounded-md p-3"
          style={{ backgroundColor: "var(--fdf-bg-elevated)", border: "1px solid var(--fdf-border)" }}
        >
          <span className="text-xs font-bold font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-text-secondary)" }}>
            Game Mode
          </span>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setGameMode("dice")}
              className="flex items-center gap-2 flex-1 px-3 py-2 rounded-md text-sm font-bold font-fdf-mono transition-all"
              style={{
                backgroundColor: gameMode === "dice" ? "var(--fdf-accent)" : "var(--fdf-bg-card)",
                color: gameMode === "dice" ? "#000" : "var(--fdf-text-secondary)",
                border: `1px solid ${gameMode === "dice" ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
              }}
            >
              <Dice5 size={16} />
              Dice
            </button>
            <button
              type="button"
              onClick={() => setGameMode("fac")}
              className="flex items-center gap-2 flex-1 px-3 py-2 rounded-md text-sm font-bold font-fdf-mono transition-all"
              style={{
                backgroundColor: gameMode === "fac" ? "var(--fdf-accent)" : "var(--fdf-bg-card)",
                color: gameMode === "fac" ? "#000" : "var(--fdf-text-secondary)",
                border: `1px solid ${gameMode === "fac" ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
              }}
            >
              <Layers size={16} />
              FAC
            </button>
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--fdf-text-muted)" }}>
            {gameMode === "fac"
              ? "Fast Action Cards — 30 cards/quarter, no timing die"
              : "Chartbook + 3 dice — 12 ticks/quarter, timing die"}
          </p>
        </div>

        {/* 7+ Minute Drive Toggle — only in Dice mode */}
        {gameMode === "dice" && (
          <div
            className="mt-4 rounded-md p-3"
            style={{ backgroundColor: "var(--fdf-bg-elevated)", border: "1px solid var(--fdf-border)" }}
          >
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sevenPlusMinute}
                onChange={(e) => setSevenPlusMinute(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <Timer size={16} style={{ color: sevenPlusMinute ? "var(--fdf-accent)" : "var(--fdf-text-muted)" }} />
              <span className="text-sm font-bold" style={{ color: sevenPlusMinute ? "var(--fdf-accent)" : "var(--fdf-text-secondary)" }}>
                7+ Minute Drive Rule
              </span>
            </label>
            <p className="text-xs mt-1.5 ml-[26px]" style={{ color: "var(--fdf-text-muted)" }}>
              After rolling 6 on timing die, re-roll — if 6 again, drive uses 6 ticks (7:30). Recommended for POOR/AVERAGE field position only.
            </p>
          </div>
        )}

        {/* Kickoff — Coin Toss / Receiver Selection */}
        <div
          className="mt-4 rounded-md p-3"
          style={{ backgroundColor: "var(--fdf-bg-elevated)", border: "1px solid var(--fdf-border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-text-secondary)" }}>
              Kickoff
            </span>
            <button
              type="button"
              onClick={handleCoinToss}
              disabled={coinFlipping}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-fdf-mono font-bold transition-all"
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
            <p className="text-xs font-fdf-mono mb-2 text-center font-bold" style={{ color: "var(--fdf-accent)" }}>
              {coinResult === "away"
                ? (awayTeam?.name || "Away") + " receives!"
                : (homeTeam?.name || "Home") + " receives!"}
            </p>
          )}

          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input
                type="radio"
                name="receiving"
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
                name="receiving"
                checked={receivingTeam === "home"}
                onChange={() => { setReceivingTeam("home"); setCoinResult(null); }}
                className="accent-blue-500"
              />
              <span className="text-sm" style={{ color: receivingTeam === "home" ? "var(--fdf-text-primary)" : "var(--fdf-text-muted)" }}>
                {homeTeam?.abbreviation || "Home"} receives
              </span>
            </label>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-md text-sm font-bold text-white transition-colors disabled:opacity-40"
          style={{ backgroundColor: "var(--fdf-accent)" }}
        >
          <Zap size={18} />
          Start Game
        </button>
      </div>
    </div>
  );
}
