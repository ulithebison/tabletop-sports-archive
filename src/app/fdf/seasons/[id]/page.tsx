"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Play, Settings, Zap, BarChart3, Trophy, BookOpen } from "lucide-react";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { LEAGUE_TYPE_LABELS } from "@/lib/fdf/constants";
import { ScheduleImport } from "@/components/fdf/seasons/ScheduleImport";
import { WeekNavigation } from "@/components/fdf/seasons/WeekNavigation";
import { WeekView } from "@/components/fdf/seasons/WeekView";
import { StandingsTable } from "@/components/fdf/seasons/StandingsTable";
import { SimulationModal } from "@/components/fdf/seasons/SimulationModal";
import { SeedingPreview } from "@/components/fdf/seasons/SeedingPreview";
import { PlayoffBracket } from "@/components/fdf/seasons/PlayoffBracket";
import { SeasonComplete } from "@/components/fdf/seasons/SeasonComplete";
import { PreGameModal } from "@/components/fdf/seasons/PreGameModal";
import { simulateInstantResult } from "@/lib/fdf/instant-results";
import { calculateStandings, sortStandings, getStandingsByDivision } from "@/lib/fdf/standings";
import { generatePlayoffSeeds, generatePlayoffSchedule, advancePlayoffWinner, revertPlayoffResult, getPlayoffRoundsFromSchedule } from "@/lib/fdf/playoff-seeding";
import { calculateSeasonPlayerStats, calculateTeamSeasonStats, calculateSeasonAwards } from "@/lib/fdf/season-stats";
import type { ScheduleGame, SeasonGameResult, GameMode } from "@/lib/fdf/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  setup: { label: "Setup", color: "#f59e0b" },
  regular_season: { label: "Regular Season", color: "#3b82f6" },
  playoffs: { label: "Playoffs", color: "#a855f7" },
  completed: { label: "Completed", color: "#22c55e" },
};

export default function SeasonDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "week" | "remaining">(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showStandings, setShowStandings] = useState(false);
  const [showSeeding, setShowSeeding] = useState(false);
  const [simResult, setSimResult] = useState<{
    result: SeasonGameResult;
    scheduleGameId: string;
  } | null>(null);
  const [pendingGame, setPendingGame] = useState<ScheduleGame | null>(null);
  const [resetTarget, setResetTarget] = useState<ScheduleGame | null>(null);

  const seasonId = params.id as string;
  const season = useSeasonStore((s) => s.getSeason(seasonId));
  const deleteSeason = useSeasonStore((s) => s.deleteSeason);
  const setSeasonStatus = useSeasonStore((s) => s.setSeasonStatus);
  const setSchedule = useSeasonStore((s) => s.setSchedule);
  const recordGameResult = useSeasonStore((s) => s.recordGameResult);
  const simulateRemainingGames = useSeasonStore((s) => s.simulateRemainingGames);
  const startPlayoffs = useSeasonStore((s) => s.startPlayoffs);
  const completeSeason = useSeasonStore((s) => s.completeSeason);
  const resetGameResult = useSeasonStore((s) => s.resetGameResult);
  const getTeam = useTeamStore((s) => s.getTeam);
  const teamsMap = useTeamStore((s) => s.teams);
  const createGame = useGameStore((s) => s.createGame);
  const deleteGame = useGameStore((s) => s.deleteGame);
  const gamesMap = useGameStore((s) => s.games);

  const allTeams = useMemo(() => Object.values(teamsMap), [teamsMap]);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && !season) {
      router.push("/fdf/seasons");
    }
  }, [hydrated, season, router]);

  useEffect(() => {
    if (season && selectedWeek === null) {
      setSelectedWeek(season.currentWeek);
    }
  }, [season, selectedWeek]);

  // Auto-repair: detect completed playoff games whose winners were never advanced
  useEffect(() => {
    if (!hydrated || !season || season.status !== "playoffs") return;
    const playoffGames = season.schedule.filter((g) => g.isPlayoff);
    const rounds = getPlayoffRoundsFromSchedule(playoffGames);

    let needsRepair = false;
    for (const game of playoffGames) {
      if (!game.result || !game.playoffRound) continue;
      const roundIdx = rounds.indexOf(game.playoffRound);
      const nextRound = rounds[roundIdx + 1];
      if (!nextRound) continue; // final round, no next

      const winnerId = game.result.winner === "home" ? game.homeTeamId : game.awayTeamId;
      const nextRoundGames = playoffGames.filter((g) => g.playoffRound === nextRound);
      const winnerPlaced = nextRoundGames.some(
        (g) => g.homeTeamId === winnerId || g.awayTeamId === winnerId
      );
      if (!winnerPlaced) {
        needsRepair = true;
        break;
      }
    }

    if (needsRepair) {
      // Re-advance all completed playoff games in round order
      let currentSchedule = [...season.schedule];
      for (const round of rounds) {
        const roundGames = currentSchedule.filter(
          (g) => g.isPlayoff && g.playoffRound === round && g.result
        );
        for (const game of roundGames) {
          currentSchedule = advancePlayoffWinner(
            { ...season, schedule: currentSchedule },
            game.id
          );
        }
      }
      setSchedule(seasonId, currentSchedule);

      // Check if championship is now complete
      const finalGame = currentSchedule.find((g) => g.playoffRound === "super_bowl" && g.result);
      if (finalGame) {
        completeSeason(seasonId);
      }
    }
  }, [hydrated, season, seasonId, setSchedule, completeSeason]);

  // Calculate standings
  const standings = useMemo(() => {
    if (!season) return [];
    const raw = calculateStandings(season);
    return sortStandings(raw);
  }, [season]);

  const divisionStandings = useMemo(() => {
    if (!season || season.divisions.length === 0) return null;
    const raw = calculateStandings(season);
    return getStandingsByDivision(raw, season.divisions);
  }, [season]);

  const playoffSeeds = useMemo(() => {
    if (!season) return [];
    return generatePlayoffSeeds(standings, season);
  }, [standings, season]);

  // Detect in-progress games that haven't been completed
  const activeGameIds = useMemo(() => {
    if (!season) return new Set<string>();
    const ids = new Set<string>();
    for (const sg of season.schedule) {
      if (sg.gameId && !sg.result && gamesMap[sg.gameId]?.status === "in_progress") {
        ids.add(sg.id);
      }
    }
    return ids;
  }, [season, gamesMap]);

  // Awards for completed season display
  const seasonAwards = useMemo(() => {
    if (!season || season.status !== "completed") return [];
    const playerStats = calculateSeasonPlayerStats(season, gamesMap, teamsMap);
    const teamStats = calculateTeamSeasonStats(season, gamesMap);
    return calculateSeasonAwards(playerStats, teamStats);
  }, [season, gamesMap, teamsMap]);

  const handleStartPlayoffs = useCallback(() => {
    if (!season || playoffSeeds.length === 0) return;
    const playoffSchedule = generatePlayoffSchedule(playoffSeeds, season);
    startPlayoffs(seasonId, playoffSchedule);
    setShowSeeding(false);
  }, [season, playoffSeeds, startPlayoffs, seasonId]);

  // Handle advancing playoff winners after sim
  const handlePlayoffAdvance = useCallback((scheduleGameId: string) => {
    const currentSeason = useSeasonStore.getState().getSeason(seasonId);
    if (!currentSeason) return;
    const advanced = advancePlayoffWinner(currentSeason, scheduleGameId);
    setSchedule(seasonId, advanced);

    // Check if championship is done
    const finalGame = advanced.find((g) => g.playoffRound === "super_bowl" && g.result);
    if (finalGame) {
      completeSeason(seasonId);
    }
  }, [seasonId, setSchedule, completeSeason]);

  const handleDelete = () => {
    if (confirmDelete) {
      deleteSeason(seasonId);
      router.push("/fdf/seasons");
    } else {
      setConfirmDelete(true);
    }
  };

  const handleStartSeason = () => {
    if (!season || season.schedule.length === 0) return;
    setSeasonStatus(seasonId, "regular_season");
  };

  const handleApplySchedule = useCallback((games: ScheduleGame[]) => {
    setSchedule(seasonId, games);
  }, [setSchedule, seasonId]);

  const handleResume = useCallback((game: ScheduleGame) => {
    if (game.gameId) {
      router.push(`/fdf/game/${game.gameId}?seasonId=${seasonId}&scheduleGameId=${game.id}`);
    }
  }, [router, seasonId]);

  const handlePlay = useCallback((game: ScheduleGame) => {
    // If there's an active in-progress game, resume it instead
    if (game.gameId && activeGameIds.has(game.id)) {
      handleResume(game);
      return;
    }
    setPendingGame(game);
  }, [activeGameIds, handleResume]);

  const handleStartPendingGame = useCallback((enhancedMode: boolean, receivingTeam: "home" | "away", gameMode?: GameMode) => {
    if (!pendingGame) return;
    const gameId = createGame(pendingGame.homeTeamId, pendingGame.awayTeamId, enhancedMode || undefined, receivingTeam, gameMode);
    const updateSchedule = useSeasonStore.getState().setSchedule;
    const currentSeason = useSeasonStore.getState().getSeason(seasonId);
    if (currentSeason) {
      const updatedSchedule = currentSeason.schedule.map((g) =>
        g.id === pendingGame.id ? { ...g, gameId } : g
      );
      updateSchedule(seasonId, updatedSchedule);
    }
    setPendingGame(null);
    router.push(`/fdf/game/${gameId}?seasonId=${seasonId}&scheduleGameId=${pendingGame.id}`);
  }, [pendingGame, createGame, seasonId, router]);

  const handleConfirmReset = useCallback(() => {
    if (!resetTarget || !season) return;

    if (resetTarget.isPlayoff) {
      // Playoff: cascade revert
      const { updatedSchedule, cascadedGameIds } = revertPlayoffResult(season.schedule, resetTarget.id);

      // Delete FdfGames for all affected games
      if (resetTarget.gameId) deleteGame(resetTarget.gameId);
      for (const cId of cascadedGameIds) {
        const cGame = season.schedule.find((g) => g.id === cId);
        if (cGame?.gameId) deleteGame(cGame.gameId);
      }

      setSchedule(seasonId, updatedSchedule);

      // If season was completed, reopen to playoffs
      if (season.status === "completed") {
        useSeasonStore.getState().setSeasonStatus(seasonId, "playoffs");
      }
    } else {
      // Regular season: simple reset
      if (resetTarget.gameId) deleteGame(resetTarget.gameId);
      resetGameResult(seasonId, resetTarget.id);
    }

    setResetTarget(null);
  }, [resetTarget, season, seasonId, deleteGame, resetGameResult, setSchedule]);

  const handleSimulate = useCallback((scheduleGameId: string) => {
    if (!season) return;
    const game = season.schedule.find((g) => g.id === scheduleGameId);
    if (!game || game.result || game.isBye) return;

    const homeTeam = getTeam(game.homeTeamId);
    const awayTeam = getTeam(game.awayTeamId);
    if (!homeTeam || !awayTeam) return;

    const result = simulateInstantResult(homeTeam, awayTeam, season.overtimeRules);
    setSimResult({ result, scheduleGameId });
  }, [season, getTeam]);

  const handleAcceptSimResult = useCallback(() => {
    if (!simResult) return;
    recordGameResult(seasonId, simResult.scheduleGameId, simResult.result);

    // If it's a playoff game, advance the winner
    const currentSeason = useSeasonStore.getState().getSeason(seasonId);
    const game = currentSeason?.schedule.find((g) => g.id === simResult.scheduleGameId);
    if (game?.isPlayoff) {
      handlePlayoffAdvance(simResult.scheduleGameId);
    }

    setSimResult(null);
  }, [simResult, seasonId, recordGameResult, handlePlayoffAdvance]);

  const handleSimulateWeek = useCallback(() => {
    if (!season) return;
    const currentWeek = selectedWeek ?? season.currentWeek;
    const weekGames = season.schedule.filter(
      (g) => g.week === currentWeek && !g.result && !g.isBye && !activeGameIds.has(g.id)
    );

    for (const game of weekGames) {
      const homeTeam = getTeam(game.homeTeamId);
      const awayTeam = getTeam(game.awayTeamId);
      if (!homeTeam || !awayTeam) continue;
      const result = simulateInstantResult(homeTeam, awayTeam, season.overtimeRules);
      recordGameResult(seasonId, game.id, result);
    }
  }, [season, selectedWeek, getTeam, recordGameResult, seasonId, activeGameIds]);

  const handleSimulateRemaining = useCallback(() => {
    if (!season) return;
    simulateRemainingGames(seasonId, (game) => {
      const homeTeam = getTeam(game.homeTeamId);
      const awayTeam = getTeam(game.awayTeamId);
      if (!homeTeam || !awayTeam) {
        return { homeScore: 0, awayScore: 0, winner: "tie", isOvertime: false, isSimulated: true };
      }
      return simulateInstantResult(homeTeam, awayTeam, season.overtimeRules);
    }, activeGameIds);
  }, [season, seasonId, simulateRemainingGames, getTeam, activeGameIds]);

  if (!hydrated) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
        <div className="h-64 rounded-lg animate-pulse mt-4" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  if (!season) {
    return null;
  }

  const status = STATUS_LABELS[season.status] || STATUS_LABELS.setup;
  const completedGames = season.schedule.filter((g) => g.result && !g.isBye && !g.isPlayoff).length;
  const totalRegGames = season.schedule.filter((g) => !g.isBye && !g.isPlayoff).length;
  const canStartSeason = season.status === "setup" && season.schedule.length > 0;
  const allRegularSeasonDone =
    season.status === "regular_season" &&
    totalRegGames > 0 &&
    completedGames === totalRegGames;

  const seasonTeams = allTeams.filter((t) => season.teamIds.includes(t.id));
  const currentWeek = selectedWeek ?? season.currentWeek;

  // Find teams for sim modal
  const simGame = simResult ? season.schedule.find((g) => g.id === simResult.scheduleGameId) : null;
  const simHomeTeam = simGame ? getTeam(simGame.homeTeamId) : undefined;
  const simAwayTeam = simGame ? getTeam(simGame.awayTeamId) : undefined;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Simulation Modal */}
      {simResult && simHomeTeam && simAwayTeam && (
        <SimulationModal
          result={simResult.result}
          homeTeam={simHomeTeam}
          awayTeam={simAwayTeam}
          onAccept={handleAcceptSimResult}
          onClose={() => setSimResult(null)}
        />
      )}

      {/* Bulk Simulation Confirmation Modal */}
      {confirmAction && (() => {
        const weekGamesCount = season.schedule.filter(
          (g) => g.week === currentWeek && !g.result && !g.isBye && !activeGameIds.has(g.id)
        ).length;
        const remainingGamesCount = season.schedule.filter(
          (g) => !g.result && !g.isBye && !g.isPlayoff && !activeGameIds.has(g.id)
        ).length;
        const count = confirmAction === "week" ? weekGamesCount : remainingGamesCount;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <div
              className="w-full max-w-sm rounded-lg p-5"
              style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} style={{ color: "#a855f7" }} />
                <h2 className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                  Confirm Simulation
                </h2>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--fdf-text-secondary)" }}>
                {confirmAction === "week"
                  ? `Simulate all ${count} unplayed game${count !== 1 ? "s" : ""} in Week ${currentWeek}?`
                  : `Simulate all ${count} remaining regular season game${count !== 1 ? "s" : ""}? This cannot be undone.`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirmAction === "week") handleSimulateWeek();
                    else handleSimulateRemaining();
                    setConfirmAction(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded text-sm font-bold text-white transition-colors"
                  style={{ backgroundColor: "#a855f7" }}
                >
                  <Zap size={14} />
                  Simulate
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-4 py-2 rounded text-sm font-bold transition-colors"
                  style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Pre-Game Modal */}
      {pendingGame && (
        <PreGameModal
          game={pendingGame}
          homeTeam={getTeam(pendingGame.homeTeamId)}
          awayTeam={getTeam(pendingGame.awayTeamId)}
          onStart={handleStartPendingGame}
          onCancel={() => setPendingGame(null)}
        />
      )}

      {/* Reset Confirmation Modal */}
      {resetTarget && (() => {
        const rtHome = getTeam(resetTarget.homeTeamId);
        const rtAway = getTeam(resetTarget.awayTeamId);
        const isPlayoff = !!resetTarget.isPlayoff;
        const cascadeCount = isPlayoff
          ? revertPlayoffResult(season.schedule, resetTarget.id).cascadedGameIds.length
          : 0;
        const isCompleted = season.status === "completed";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <div
              className="w-full max-w-sm rounded-lg p-5"
              style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
            >
              <h2 className="text-sm font-fdf-mono font-bold mb-3" style={{ color: "var(--fdf-text-primary)" }}>
                Reset Game Result
              </h2>
              <p className="text-sm mb-2" style={{ color: "var(--fdf-text-secondary)" }}>
                Reset {rtAway?.abbreviation || "AWY"} @ {rtHome?.abbreviation || "HME"} result
                {resetTarget.result && ` (${resetTarget.result.awayScore}-${resetTarget.result.homeScore})`}?
              </p>
              {cascadeCount > 0 && (
                <p className="text-xs mb-2 font-medium" style={{ color: "#f59e0b" }}>
                  This will also clear {cascadeCount} downstream playoff matchup{cascadeCount !== 1 ? "s" : ""}.
                </p>
              )}
              {isCompleted && (
                <p className="text-xs mb-2 font-medium" style={{ color: "#f59e0b" }}>
                  This will reopen the season.
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleConfirmReset}
                  className="flex-1 px-4 py-2 rounded text-sm font-bold text-white transition-colors"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  Reset
                </button>
                <button
                  onClick={() => setResetTarget(null)}
                  className="flex-1 px-4 py-2 rounded text-sm font-bold transition-colors"
                  style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/fdf/seasons"
          className="p-1.5 rounded hover:bg-white/5"
          style={{ color: "var(--fdf-text-muted)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-fdf-mono truncate" style={{ color: "var(--fdf-text-primary)" }}>
              {season.name}
            </h1>
            <span
              className="text-[10px] font-fdf-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: status.color + "20", color: status.color }}
            >
              {status.label}
            </span>
          </div>
          <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            {season.year} {LEAGUE_TYPE_LABELS[season.leagueType]} · {season.teamIds.length} teams
            {totalRegGames > 0 && ` · ${completedGames}/${totalRegGames} games`}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 rounded hover:bg-red-500/20 transition-colors"
          title={confirmDelete ? "Click again to confirm" : "Delete season"}
        >
          <Trash2 size={16} style={{ color: confirmDelete ? "#ef4444" : "var(--fdf-text-muted)" }} />
        </button>
      </div>

      {/* Setup phase */}
      {season.status === "setup" && (
        <div className="space-y-4">
          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Settings size={16} style={{ color: "var(--fdf-accent)" }} />
              <h2 className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                Schedule
              </h2>
            </div>

            {season.schedule.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: "var(--fdf-text-secondary)" }}>
                  {season.schedule.filter((g) => !g.isBye).length} games scheduled across{" "}
                  {new Set(season.schedule.map((g) => g.week)).size} weeks.
                </p>
                <button
                  onClick={() => setSchedule(seasonId, [])}
                  className="text-[10px] font-fdf-mono px-2 py-1 rounded"
                  style={{ color: "#ef4444", backgroundColor: "#ef444420" }}
                >
                  Clear Schedule
                </button>
              </div>
            ) : (
              <ScheduleImport
                season={season}
                teams={seasonTeams}
                onApply={handleApplySchedule}
              />
            )}
          </div>

          <button
            onClick={handleStartSeason}
            disabled={!canStartSeason}
            className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-bold text-white disabled:opacity-40 transition-colors"
            style={{ backgroundColor: "var(--fdf-accent)" }}
          >
            <Play size={16} />
            Start Season
          </button>
        </div>
      )}

      {/* Regular Season / Playoffs — Week View */}
      {(season.status === "regular_season" || season.status === "playoffs") && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowStandings(!showStandings)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-fdf-mono font-bold transition-colors"
              style={{
                backgroundColor: showStandings ? "var(--fdf-accent)" : "var(--fdf-bg-card)",
                color: showStandings ? "#fff" : "var(--fdf-text-secondary)",
                border: `1px solid ${showStandings ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
              }}
            >
              <BarChart3 size={12} />
              Standings
            </button>
            <Link
              href={`/fdf/seasons/${seasonId}/stats`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-fdf-mono font-bold transition-colors"
              style={{ backgroundColor: "var(--fdf-bg-card)", color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
            >
              <BarChart3 size={12} />
              Stats
            </Link>
            <Link
              href={`/fdf/seasons/${seasonId}/awards`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-fdf-mono font-bold transition-colors"
              style={{ backgroundColor: "var(--fdf-bg-card)", color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
            >
              <Trophy size={12} />
              Awards
            </Link>
            <Link
              href={`/fdf/seasons/${seasonId}/recap`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-fdf-mono font-bold transition-colors"
              style={{ backgroundColor: "var(--fdf-bg-card)", color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
            >
              <BookOpen size={12} />
              Recap
            </Link>
            {season.status === "regular_season" && completedGames < totalRegGames && (
              <button
                onClick={() => setConfirmAction("remaining")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-fdf-mono font-bold"
                style={{ color: "#a855f7", backgroundColor: "#a855f720", border: "1px solid #a855f740" }}
              >
                <Zap size={12} />
                Simulate Remaining
              </button>
            )}
          </div>

          {/* Standings */}
          {showStandings && (
            <div>
              <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-2" style={{ color: "var(--fdf-accent)" }}>
                Standings
              </h2>
              {divisionStandings ? (
                <div className="space-y-4">
                  {divisionStandings.map(({ division, standings: divStands }) => (
                    <div key={division.name}>
                      <StandingsTable
                        standings={sortStandings(divStands)}
                        getTeam={getTeam}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <StandingsTable standings={standings} getTeam={getTeam} />
              )}
            </div>
          )}

          <WeekNavigation
            season={season}
            selectedWeek={currentWeek}
            onSelectWeek={setSelectedWeek}
          />

          <WeekView
            season={season}
            week={currentWeek}
            getTeam={getTeam}
            onPlay={handlePlay}
            onSimulate={handleSimulate}
            onSimulateWeek={() => setConfirmAction("week")}
            onResume={handleResume}
            onReset={setResetTarget}
            activeGameIds={activeGameIds}
          />

          {allRegularSeasonDone && season.status === "regular_season" && (
            <div className="space-y-4">
              {!showSeeding ? (
                <div
                  className="rounded-lg p-4 text-center"
                  style={{ backgroundColor: "#a855f720", border: "1px solid #a855f740" }}
                >
                  <p className="text-sm font-bold font-fdf-mono mb-3" style={{ color: "#a855f7" }}>
                    Regular season complete!
                  </p>
                  <button
                    onClick={() => setShowSeeding(true)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded text-sm font-bold text-white"
                    style={{ backgroundColor: "#a855f7" }}
                  >
                    <Trophy size={16} />
                    Enter Playoffs
                  </button>
                </div>
              ) : (
                <SeedingPreview
                  seeds={playoffSeeds}
                  getTeam={getTeam}
                  onConfirm={handleStartPlayoffs}
                />
              )}
            </div>
          )}

          {/* Playoff bracket when in playoffs */}
          {season.status === "playoffs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
                  Playoff Bracket
                </h2>
                <Link
                  href={`/fdf/seasons/${seasonId}/playoffs`}
                  className="text-xs font-fdf-mono px-3 py-1 rounded"
                  style={{ color: "var(--fdf-accent)", backgroundColor: "var(--fdf-accent)" + "15" }}
                >
                  Full Bracket
                </Link>
              </div>
              <PlayoffBracket
                season={season}
                seeds={playoffSeeds}
                getTeam={getTeam}
                onPlay={handlePlay}
                onSimulate={handleSimulate}
                onResume={handleResume}
                onReset={setResetTarget}
                activeGameIds={activeGameIds}
              />
            </div>
          )}
        </div>
      )}

      {/* Completed */}
      {season.status === "completed" && (
        <div className="space-y-4">
          <SeasonComplete season={season} standings={standings} getTeam={getTeam} seasonId={seasonId} awards={seasonAwards} />

          {/* Final bracket */}
          {season.schedule.some((g) => g.isPlayoff) && (
            <PlayoffBracket
              season={season}
              seeds={playoffSeeds}
              getTeam={getTeam}
              onPlay={() => {}}
              onSimulate={() => {}}
              onReset={setResetTarget}
            />
          )}

          <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
            Final Standings
          </h2>
          <StandingsTable
            standings={standings}
            getTeam={getTeam}
            divisions={season.divisions.length > 0 ? season.divisions : undefined}
          />

          {/* Season Review — browse past weeks */}
          <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
            Season Review
          </h2>
          <WeekNavigation
            season={season}
            selectedWeek={currentWeek}
            onSelectWeek={setSelectedWeek}
          />
          <WeekView
            season={season}
            week={currentWeek}
            getTeam={getTeam}
            onPlay={() => {}}
            onSimulate={() => {}}
          />
        </div>
      )}

      {/* Teams roster */}
      <div className="mt-6">
        <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
          Teams
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {season.teamIds.map((teamId) => {
            const team = getTeam(teamId);
            if (!team) return null;
            return (
              <div
                key={teamId}
                className="flex items-center gap-2 px-3 py-2 rounded"
                style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
              >
                <span
                  className="w-4 h-4 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: team.primaryColor }}
                />
                <span className="text-xs font-fdf-mono truncate" style={{ color: "var(--fdf-text-primary)" }}>
                  {team.abbreviation}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divisions */}
      {season.divisions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
            Divisions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {season.divisions.map((div, idx) => (
              <div
                key={idx}
                className="rounded-lg p-3"
                style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
              >
                <h3 className="text-xs font-fdf-mono font-bold mb-2" style={{ color: "var(--fdf-text-primary)" }}>
                  {div.name}
                </h3>
                <div className="space-y-1">
                  {div.teamIds.map((teamId) => {
                    const team = getTeam(teamId);
                    if (!team) return null;
                    return (
                      <div key={teamId} className="flex items-center gap-2 text-xs" style={{ color: "var(--fdf-text-secondary)" }}>
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: team.primaryColor }} />
                        {team.abbreviation} — {team.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
