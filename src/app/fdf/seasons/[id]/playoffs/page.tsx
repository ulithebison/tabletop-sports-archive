"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { PlayoffBracket } from "@/components/fdf/seasons/PlayoffBracket";
import { SimulationModal } from "@/components/fdf/seasons/SimulationModal";
import { PreGameModal } from "@/components/fdf/seasons/PreGameModal";
import { useCommissionerStore } from "@/lib/fdf/commissioner/commissioner-store";
import { getTeamLink } from "@/lib/fdf/team-link";
import { simulateInstantResult } from "@/lib/fdf/instant-results";
import { calculateStandings, sortStandings } from "@/lib/fdf/standings";
import { generatePlayoffSeeds, advancePlayoffWinner, revertPlayoffResult } from "@/lib/fdf/playoff-seeding";
import type { ScheduleGame, SeasonGameResult, GameMode } from "@/lib/fdf/types";
import type { PlayoffSeed } from "@/lib/fdf/playoff-seeding";

export default function PlayoffsPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [simResult, setSimResult] = useState<{
    result: SeasonGameResult;
    scheduleGameId: string;
  } | null>(null);
  const [pendingGame, setPendingGame] = useState<ScheduleGame | null>(null);
  const [resetTarget, setResetTarget] = useState<ScheduleGame | null>(null);

  const seasonId = params.id as string;
  const season = useSeasonStore((s) => s.getSeason(seasonId));
  const recordGameResult = useSeasonStore((s) => s.recordGameResult);
  const setSchedule = useSeasonStore((s) => s.setSchedule);
  const completeSeason = useSeasonStore((s) => s.completeSeason);
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

  const standings = useMemo(() => {
    if (!season) return [];
    return sortStandings(calculateStandings(season));
  }, [season]);

  const seeds: PlayoffSeed[] = useMemo(() => {
    if (!season) return [];
    return generatePlayoffSeeds(standings, season);
  }, [standings, season]);

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

  const handleStartPendingGame = useCallback((enhancedMode: boolean, receivingTeam: "home" | "away", gameMode?: GameMode, sevenPlusMinuteDrive?: boolean) => {
    if (!pendingGame) return;
    const gameId = createGame(pendingGame.homeTeamId, pendingGame.awayTeamId, enhancedMode || undefined, receivingTeam, gameMode, sevenPlusMinuteDrive);
    const currentSeason = useSeasonStore.getState().getSeason(seasonId);
    if (currentSeason) {
      const updatedSchedule = currentSeason.schedule.map((g) =>
        g.id === pendingGame.id ? { ...g, gameId } : g
      );
      setSchedule(seasonId, updatedSchedule);
    }
    setPendingGame(null);
    router.push(`/fdf/game/${gameId}?seasonId=${seasonId}&scheduleGameId=${pendingGame.id}`);
  }, [pendingGame, createGame, seasonId, router, setSchedule]);

  const handleSimulate = useCallback((scheduleGameId: string) => {
    if (!season) return;
    const game = season.schedule.find((g) => g.id === scheduleGameId);
    if (!game || game.result || game.homeTeamId === "__TBD__" || game.awayTeamId === "__TBD__") return;

    const homeTeam = getTeam(game.homeTeamId);
    const awayTeam = getTeam(game.awayTeamId);
    if (!homeTeam || !awayTeam) return;

    // Playoff games can't end in tie
    const playoffOT = { ...season.overtimeRules, canEndInTie: false };
    const result = simulateInstantResult(homeTeam, awayTeam, playoffOT);
    setSimResult({ result, scheduleGameId });
  }, [season, getTeam]);

  const handleAcceptSimResult = useCallback(() => {
    if (!simResult || !season) return;

    // Record the result
    recordGameResult(seasonId, simResult.scheduleGameId, simResult.result);

    // Advance winner to next round
    const updatedSeason = useSeasonStore.getState().getSeason(seasonId);
    if (updatedSeason) {
      const advanced = advancePlayoffWinner(updatedSeason, simResult.scheduleGameId);
      setSchedule(seasonId, advanced);

      // Check if all playoff games are complete (super_bowl done)
      const playoffGames = advanced.filter((g) => g.isPlayoff);
      const allDone = playoffGames.every((g) => g.result || g.homeTeamId === "__TBD__" || g.awayTeamId === "__TBD__");
      const finalGame = playoffGames.find((g) => g.playoffRound === "super_bowl");
      if (allDone && finalGame?.result) {
        completeSeason(seasonId);
      }
    }

    setSimResult(null);
  }, [simResult, season, seasonId, recordGameResult, setSchedule, completeSeason]);

  const handleConfirmReset = useCallback(() => {
    if (!resetTarget || !season) return;

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

    setResetTarget(null);
  }, [resetTarget, season, seasonId, deleteGame, setSchedule]);

  if (!hydrated) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  if (!season) {
    router.push("/fdf/seasons");
    return null;
  }

  const simGame = simResult ? season.schedule.find((g) => g.id === simResult.scheduleGameId) : null;
  const simHomeTeam = simGame ? getTeam(simGame.homeTeamId) : undefined;
  const simAwayTeam = simGame ? getTeam(simGame.awayTeamId) : undefined;

  // Calculate cascade info for reset modal
  const cascadeCount = resetTarget
    ? revertPlayoffResult(season.schedule, resetTarget.id).cascadedGameIds.length
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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

      {/* Reset Confirmation Modal */}
      {resetTarget && (() => {
        const rtHome = getTeam(resetTarget.homeTeamId);
        const rtAway = getTeam(resetTarget.awayTeamId);
        const isCompleted = season.status === "completed";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <div
              className="w-full max-w-sm rounded-lg p-5"
              style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
            >
              <h2 className="text-sm font-fdf-mono font-bold mb-3" style={{ color: "var(--fdf-text-primary)" }}>
                Reset Playoff Result
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
      <div className="flex items-center gap-3">
        <Link
          href={`/fdf/seasons/${seasonId}`}
          className="p-1.5 rounded hover:bg-white/5"
          style={{ color: "var(--fdf-text-muted)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Trophy size={20} style={{ color: "#a855f7" }} />
          <h1 className="text-2xl font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
            {season.name} — Playoffs
          </h1>
        </div>
      </div>

      {/* Bracket */}
      <PlayoffBracket
        season={season}
        seeds={seeds}
        getTeam={getTeam}
        onPlay={handlePlay}
        onSimulate={handleSimulate}
        onResume={handleResume}
        onReset={setResetTarget}
        activeGameIds={activeGameIds}
        teamLinkFn={teamLinkFn}
      />

      {/* Seeds reference */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <h3 className="text-xs font-fdf-mono font-bold uppercase tracking-wider mb-2" style={{ color: "var(--fdf-accent)" }}>
          Seeds
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
          {seeds.map((seed) => {
            const team = getTeam(seed.teamId);
            return (
              <div key={seed.seed} className="flex items-center gap-1.5 text-xs">
                <span className="font-fdf-mono font-bold w-4 text-center" style={{ color: "var(--fdf-accent)" }}>
                  {seed.seed}
                </span>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: team?.primaryColor || "#666" }} />
                <span className="font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
                  {team?.abbreviation || "???"} ({seed.standing.wins}-{seed.standing.losses})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
