"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { WeekView } from "@/components/fdf/seasons/WeekView";
import { WeekNavigation } from "@/components/fdf/seasons/WeekNavigation";
import { SimulationModal } from "@/components/fdf/seasons/SimulationModal";
import { simulateInstantResult } from "@/lib/fdf/instant-results";
import type { ScheduleGame, SeasonGameResult } from "@/lib/fdf/types";

export default function WeekDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [simResult, setSimResult] = useState<{
    result: SeasonGameResult;
    scheduleGameId: string;
  } | null>(null);

  const seasonId = params.id as string;
  const weekNum = parseInt(params.week as string, 10);

  const season = useSeasonStore((s) => s.getSeason(seasonId));
  const recordGameResult = useSeasonStore((s) => s.recordGameResult);
  const getTeam = useTeamStore((s) => s.getTeam);
  const createGame = useGameStore((s) => s.createGame);

  useEffect(() => setHydrated(true), []);

  const handlePlay = useCallback((game: ScheduleGame) => {
    const gameId = createGame(game.homeTeamId, game.awayTeamId);
    const updateSchedule = useSeasonStore.getState().setSchedule;
    const currentSeason = useSeasonStore.getState().getSeason(seasonId);
    if (currentSeason) {
      const updatedSchedule = currentSeason.schedule.map((g) =>
        g.id === game.id ? { ...g, gameId } : g
      );
      updateSchedule(seasonId, updatedSchedule);
    }
    router.push(`/fdf/game/${gameId}?seasonId=${seasonId}&scheduleGameId=${game.id}`);
  }, [createGame, seasonId, router]);

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
      (g) => g.week === weekNum && !g.result && !g.isBye
    );
    for (const game of weekGames) {
      const homeTeam = getTeam(game.homeTeamId);
      const awayTeam = getTeam(game.awayTeamId);
      if (!homeTeam || !awayTeam) continue;
      const result = simulateInstantResult(homeTeam, awayTeam, season.overtimeRules);
      recordGameResult(seasonId, game.id, result);
    }
  }, [season, weekNum, getTeam, recordGameResult, seasonId]);

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
        onSimulateWeek={handleSimulateWeek}
      />
    </div>
  );
}
