"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { WeekView } from "@/components/fdf/seasons/WeekView";
import { WeekNavigation } from "@/components/fdf/seasons/WeekNavigation";
import { SimulationModal } from "@/components/fdf/seasons/SimulationModal";
import { PreGameModal } from "@/components/fdf/seasons/PreGameModal";
import { useCommissionerStore } from "@/lib/fdf/commissioner/commissioner-store";
import { getTeamLink } from "@/lib/fdf/team-link";
import { simulateInstantResult } from "@/lib/fdf/instant-results";
import type { ScheduleGame, SeasonGameResult, GameMode } from "@/lib/fdf/types";

export default function WeekDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [simResult, setSimResult] = useState<{
    result: SeasonGameResult;
    scheduleGameId: string;
  } | null>(null);
  const [confirmSimWeek, setConfirmSimWeek] = useState(false);
  const [pendingGame, setPendingGame] = useState<ScheduleGame | null>(null);
  const [resetTarget, setResetTarget] = useState<ScheduleGame | null>(null);

  const seasonId = params.id as string;
  const weekNum = parseInt(params.week as string, 10);

  const season = useSeasonStore((s) => s.getSeason(seasonId));
  const recordGameResult = useSeasonStore((s) => s.recordGameResult);
  const resetGameResult = useSeasonStore((s) => s.resetGameResult);
  const getTeam = useTeamStore((s) => s.getTeam);
  const createGame = useGameStore((s) => s.createGame);
  const deleteGame = useGameStore((s) => s.deleteGame);
  const gamesMap = useGameStore((s) => s.games);
  const commissionerLeagues = useCommissionerStore((s) => s.leagues);

  useEffect(() => setHydrated(true), []);

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

  const pathname = usePathname();

  const teamLinkFn = useMemo(() => {
    if (!season) return undefined;
    const leagueId = season.commissionerLeagueId;
    const league = leagueId ? commissionerLeagues[leagueId] : undefined;
    const commTeams = league?.teams.map((t) => ({ id: t.id, teamStoreId: t.teamStoreId }));
    return (teamStoreId: string) => getTeamLink(teamStoreId, leagueId, commTeams, pathname);
  }, [season, commissionerLeagues, pathname]);

  const handleResume = useCallback((game: ScheduleGame) => {
    if (game.gameId) {
      router.push(`/fdf/game/${game.gameId}?seasonId=${seasonId}&scheduleGameId=${game.id}`);
    }
  }, [router, seasonId]);

  const handlePlay = useCallback((game: ScheduleGame) => {
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
    setSimResult(null);
  }, [simResult, seasonId, recordGameResult]);

  const handleSimulateWeek = useCallback(() => {
    if (!season) return;
    const weekGames = season.schedule.filter(
      (g) => g.week === weekNum && !g.result && !g.isBye && !activeGameIds.has(g.id)
    );
    for (const game of weekGames) {
      const homeTeam = getTeam(game.homeTeamId);
      const awayTeam = getTeam(game.awayTeamId);
      if (!homeTeam || !awayTeam) continue;
      const result = simulateInstantResult(homeTeam, awayTeam, season.overtimeRules);
      recordGameResult(seasonId, game.id, result);
    }
  }, [season, weekNum, getTeam, recordGameResult, seasonId, activeGameIds]);

  const handleConfirmReset = useCallback(() => {
    if (!resetTarget) return;
    if (resetTarget.gameId) deleteGame(resetTarget.gameId);
    resetGameResult(seasonId, resetTarget.id);
    setResetTarget(null);
  }, [resetTarget, seasonId, deleteGame, resetGameResult]);

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 rounded animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  if (!season || isNaN(weekNum)) {
    router.push("/fdf/seasons");
    return null;
  }

  const simGame = simResult ? season.schedule.find((g) => g.id === simResult.scheduleGameId) : null;
  const simHomeTeam = simGame ? getTeam(simGame.homeTeamId) : undefined;
  const simAwayTeam = simGame ? getTeam(simGame.awayTeamId) : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
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

      {/* Bulk Simulation Confirmation Modal */}
      {confirmSimWeek && (() => {
        const count = season.schedule.filter(
          (g) => g.week === weekNum && !g.result && !g.isBye && !activeGameIds.has(g.id)
        ).length;
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
                Simulate all {count} unplayed game{count !== 1 ? "s" : ""} in Week {weekNum}?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleSimulateWeek();
                    setConfirmSimWeek(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded text-sm font-bold text-white transition-colors"
                  style={{ backgroundColor: "#a855f7" }}
                >
                  <Zap size={14} />
                  Simulate
                </button>
                <button
                  onClick={() => setConfirmSimWeek(false)}
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

      {/* Reset Confirmation Modal */}
      {resetTarget && (() => {
        const rtHome = getTeam(resetTarget.homeTeamId);
        const rtAway = getTeam(resetTarget.awayTeamId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <div
              className="w-full max-w-sm rounded-lg p-5"
              style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
            >
              <h2 className="text-sm font-fdf-mono font-bold mb-3" style={{ color: "var(--fdf-text-primary)" }}>
                Reset Game Result
              </h2>
              <p className="text-sm mb-4" style={{ color: "var(--fdf-text-secondary)" }}>
                Reset {rtAway?.abbreviation || "AWY"} @ {rtHome?.abbreviation || "HME"} result
                {resetTarget.result && ` (${resetTarget.result.awayScore}-${resetTarget.result.homeScore})`}?
              </p>
              <div className="flex gap-2">
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
      <div className="flex items-center gap-3">
        <Link
          href={`/fdf/seasons/${seasonId}`}
          className="p-1.5 rounded hover:bg-white/5"
          style={{ color: "var(--fdf-text-muted)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
          {season.name} — Week {weekNum}
        </h1>
      </div>

      <WeekNavigation
        season={season}
        selectedWeek={weekNum}
        onSelectWeek={(w) => router.push(`/fdf/seasons/${seasonId}/week/${w}`)}
      />

      <WeekView
        season={season}
        week={weekNum}
        getTeam={getTeam}
        onPlay={handlePlay}
        onSimulate={handleSimulate}
        onSimulateWeek={() => setConfirmSimWeek(true)}
        onResume={handleResume}
        onReset={setResetTarget}
        activeGameIds={activeGameIds}
        teamLinkFn={teamLinkFn}
      />
    </div>
  );
}
