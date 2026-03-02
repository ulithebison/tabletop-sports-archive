"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FdfGame, FdfTeam, DriveInput } from "@/lib/fdf/types";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { calculatePlayerGameStats, getGameMVP } from "@/lib/fdf/player-stats";
import { computeWPHistory, computeWPAnalytics } from "@/lib/fdf/win-probability";
import { Scoreboard } from "./Scoreboard";
import { WinProbabilityChart } from "./WinProbabilityChart";
import { GameClockWidget } from "./GameClockWidget";
import { DiceRoller } from "./DiceRoller";
import { TimingDieReference } from "./TimingDieReference";
import { TeamQualityCard } from "./TeamQualityCard";
import { DriveEntryForm } from "./DriveEntryForm";
import { DriveLog } from "./DriveLog";
import { GameBoxScore } from "./GameBoxScore";
import { TeamStatsTable } from "./GameSummary";
import { OTCoinToss } from "./OTCoinToss";
import { Trophy, BarChart3, Clock, ArrowLeftRight } from "lucide-react";

interface ScoresheetProps {
  game: FdfGame;
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
  onGameComplete?: () => void;
}

export function Scoresheet({ game, homeTeam, awayTeam, onGameComplete }: ScoresheetProps) {
  const { addDrive, undoLastDrive, completeGame, endHalf, endGame, switchPossession } = useGameStore();
  const getTeam = useTeamStore((s) => s.getTeam);
  const searchParams = useSearchParams();
  const seasonId = searchParams.get("seasonId");
  const season = useSeasonStore((s) => seasonId ? s.getSeason(seasonId) : undefined);
  const [showStats, setShowStats] = useState(false);
  const [lastDice, setLastDice] = useState<number[]>([]);
  const [lastDecider, setLastDecider] = useState(0);

  const offenseTeam = game.currentPossession === "home" ? homeTeam : awayTeam;
  const defenseTeam = game.currentPossession === "home" ? awayTeam : homeTeam;

  const handleDrive = (input: DriveInput) => {
    // Attach dice values if available
    const driveInput: DriveInput = {
      ...input,
      ...(lastDice.some(v => v > 0) ? { diceValues: lastDice } : {}),
      ...(lastDecider > 0 ? { deciderDieValue: lastDecider } : {}),
    };
    addDrive(game.id, driveInput);
  };

  const handleUndo = () => {
    undoLastDrive(game.id);
  };

  const handleEndGame = () => {
    completeGame(game.id);
    onGameComplete?.();
  };

  const handleEndHalf = () => {
    endHalf(game.id);
  };

  const handleEndGameAction = () => {
    endGame(game.id);
  };

  // Live stats for stats toggle
  const homeRoster = getTeam(game.homeTeamId)?.finderRoster;
  const awayRoster = getTeam(game.awayTeamId)?.finderRoster;
  const liveStats = game.enhancedMode && showStats
    ? calculatePlayerGameStats(game, homeRoster, awayRoster)
    : [];
  const liveMvp = liveStats.length > 0 ? getGameMVP(liveStats) : null;

  const isFirstHalf = game.gameClock.quarter <= 2;
  const isSecondHalf = game.gameClock.quarter >= 3 && game.gameClock.quarter <= 4;
  const isOT = game.gameClock.quarter === 5;

  // Detect waiting-for-OT-coin-toss state
  const isWaitingForOTCoinToss = !game.gameClock.isGameOver
    && game.gameClock.quarter === 4
    && game.gameClock.ticksRemaining === 0
    && game.score.home.total === game.score.away.total
    && !game.overtimeState;

  // Determine season canEndInTie (playoffs never allow ties)
  const scheduleGameId = searchParams.get("scheduleGameId");
  const scheduleGame = season?.schedule.find(g => g.id === scheduleGameId);
  const isPlayoffGame = scheduleGame?.isPlayoff ?? false;
  const seasonCanEndInTie = season
    ? (isPlayoffGame ? false : season.overtimeRules.canEndInTie)
    : undefined;

  // OT phase display
  const getOTPhaseLabel = () => {
    if (!game.overtimeState) return "OVERTIME";
    const ot = game.overtimeState;
    const periodPrefix = ot.period > 1 ? `OT P${ot.period}` : "OT";
    if (ot.phase === "guaranteed_possession") return `${periodPrefix} — GUARANTEED`;
    if (ot.phase === "sudden_death") return `${periodPrefix} — SUDDEN DEATH`;
    return periodPrefix;
  };

  return (
    <div className="space-y-4">
      {/* Team Quality Cards + Scoreboard */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-start">
        <TeamQualityCard team={awayTeam} side="away" />
        <div className="min-w-[300px]">
          <Scoreboard
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeScore={game.score.home}
            awayScore={game.score.away}
            clock={game.gameClock}
            possession={game.currentPossession}
          />
        </div>
        <TeamQualityCard team={homeTeam} side="home" />
      </div>

      {/* Stats toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-fdf-mono font-medium transition-colors"
          style={{
            backgroundColor: showStats ? "var(--fdf-accent)" : "var(--fdf-bg-card)",
            color: showStats ? "#000" : "var(--fdf-text-secondary)",
            border: `1px solid ${showStats ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
          }}
        >
          <BarChart3 size={12} />
          {showStats ? "Hide Stats" : "Live Stats"}
        </button>
      </div>

      {/* Live Box Score */}
      {showStats && liveStats.length > 0 && (
        <GameBoxScore
          stats={liveStats}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          mvp={null}
        />
      )}

      {/* Live Team Stats */}
      {showStats && (
        <TeamStatsTable game={game} homeTeam={homeTeam} awayTeam={awayTeam} />
      )}

      {/* Main layout: Drive form + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        {/* Left: Drive entry or OT Coin Toss */}
        <div className="space-y-4">
          {isWaitingForOTCoinToss ? (
            <OTCoinToss
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              gameId={game.id}
              seasonCanEndInTie={seasonCanEndInTie}
            />
          ) : !game.gameClock.isGameOver ? (
            <>
              {/* Switch Possession Button */}
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-fdf-mono uppercase tracking-wider"
                  style={{ color: "var(--fdf-text-muted)" }}
                >
                  <span style={{ color: offenseTeam.primaryColor }}>{offenseTeam.abbreviation}</span> has the ball
                </span>
                <button
                  type="button"
                  onClick={() => switchPossession(game.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-fdf-mono font-medium transition-colors"
                  style={{
                    color: "var(--fdf-text-secondary)",
                    border: "1px solid var(--fdf-border)",
                    backgroundColor: "var(--fdf-bg-card)",
                  }}
                >
                  <ArrowLeftRight size={12} />
                  Switch
                </button>
              </div>
              <DriveEntryForm
                offenseTeam={offenseTeam}
                defenseTeam={defenseTeam}
                ticksRemaining={game.gameClock.ticksRemaining}
                quarter={game.gameClock.quarter}
                hasDrives={game.drives.length > 0}
                enhancedMode={game.enhancedMode}
                gameMode={game.gameMode}
                offenseFinderRoster={offenseTeam.finderRoster}
                defenseFinderRoster={defenseTeam.finderRoster}
                onSubmit={handleDrive}
                onUndo={handleUndo}
              />
            </>
          ) : (
            <div
              className="text-center py-8 rounded-lg"
              style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
            >
              <Trophy size={32} className="mx-auto mb-2" style={{ color: "var(--fdf-scoreboard-text)" }} />
              <p className="text-lg font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
                Game Over
              </p>
              <p className="text-sm mt-1 mb-4" style={{ color: "var(--fdf-text-secondary)" }}>
                {game.score.away.total} – {game.score.home.total}
              </p>
              {game.status !== "completed" && (
                <button
                  onClick={handleEndGame}
                  className="px-6 py-2.5 rounded-md text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--fdf-accent)" }}
                >
                  Complete Game
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-3">
          {/* Half / OT phase indicator */}
          <div
            className="rounded-lg p-2 text-center"
            style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
          >
            <span className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>
              {game.gameClock.isGameOver
                ? "FINAL"
                : isWaitingForOTCoinToss
                ? "OT COIN TOSS"
                : isOT
                ? getOTPhaseLabel()
                : isFirstHalf
                ? "1ST HALF"
                : "2ND HALF"}
            </span>
          </div>

          {/* Clock Widget */}
          <GameClockWidget clock={game.gameClock} overtimeState={game.overtimeState} gameMode={game.gameMode} />

          {/* Dice Roller */}
          <DiceRoller onRoll={(values, deciderValue) => { setLastDice(values); setLastDecider(deciderValue); }} />

          {/* Timing Die Reference — only shown in Dice mode */}
          {game.gameMode !== "fac" && <TimingDieReference />}

          {/* End Half / End Game / End OT Period buttons */}
          {!game.gameClock.isGameOver && !isWaitingForOTCoinToss && (
            <div className="space-y-2">
              {isFirstHalf && game.drives.length > 0 && (
                <button
                  type="button"
                  onClick={handleEndHalf}
                  className="w-full py-2 rounded-md text-sm font-fdf-mono font-bold transition-colors flex items-center justify-center gap-1.5"
                  style={{
                    color: "var(--fdf-accent)",
                    border: "1px solid var(--fdf-accent)",
                    backgroundColor: "rgba(59,130,246,0.08)",
                  }}
                >
                  <Clock size={14} />
                  End 1st Half
                </button>
              )}
              {isSecondHalf && game.drives.length > 0 && (
                <button
                  type="button"
                  onClick={handleEndGameAction}
                  className="w-full py-2 rounded-md text-sm font-fdf-mono font-bold transition-colors flex items-center justify-center gap-1.5"
                  style={{
                    color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.4)",
                    backgroundColor: "rgba(239,68,68,0.08)",
                  }}
                >
                  <Clock size={14} />
                  End Game
                </button>
              )}
              {isOT && game.drives.length > 0 && (
                <button
                  type="button"
                  onClick={handleEndGameAction}
                  className="w-full py-2 rounded-md text-sm font-fdf-mono font-bold transition-colors flex items-center justify-center gap-1.5"
                  style={{
                    color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.4)",
                    backgroundColor: "rgba(239,68,68,0.08)",
                  }}
                >
                  <Clock size={14} />
                  End OT Period
                </button>
              )}
              {game.drives.length > 0 && (
                <button
                  onClick={handleEndGame}
                  className="w-full py-1.5 rounded-md text-xs font-fdf-mono font-medium transition-colors"
                  style={{ color: "var(--fdf-text-muted)", border: "1px solid var(--fdf-border)" }}
                >
                  Finish Game Early
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drive Log — full width below */}
      <DriveLog
        drives={game.drives}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />

      {/* Win Probability Chart — collapsible, shows after 2+ drives */}
      {game.drives.length >= 2 && (() => {
        const wpSnapshots = computeWPHistory(game);
        return (
          <WinProbabilityChart
            snapshots={wpSnapshots}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            analytics={computeWPAnalytics(wpSnapshots, game.homeTeamId)}
            isCollapsible={true}
          />
        );
      })()}
    </div>
  );
}
