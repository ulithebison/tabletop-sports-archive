"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { Scoresheet } from "@/components/fdf/scoresheet/Scoresheet";
import { GameSummary } from "@/components/fdf/scoresheet/GameSummary";
import { advancePlayoffWinner } from "@/lib/fdf/playoff-seeding";
import type { SeasonGameResult } from "@/lib/fdf/types";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hydrated, setHydrated] = useState(false);

  const gameId = params.id as string;
  const seasonId = searchParams.get("seasonId");
  const scheduleGameId = searchParams.get("scheduleGameId");

  const game = useGameStore((s) => s.getGame(gameId));
  const getTeam = useTeamStore((s) => s.getTeam);
  const recordGameResult = useSeasonStore((s) => s.recordGameResult);

  useEffect(() => setHydrated(true), []);

  // When the game completes, write the result back to the season
  const handleGameComplete = useCallback(() => {
    if (!seasonId || !scheduleGameId) return;

    const completedGame = useGameStore.getState().getGame(gameId);
    if (!completedGame || completedGame.status !== "completed") return;

    const homeScore = completedGame.score.home.total;
    const awayScore = completedGame.score.away.total;
    const isOvertime = completedGame.gameClock.quarter === 5;

    const result: SeasonGameResult = {
      homeScore,
      awayScore,
      winner: homeScore > awayScore ? "home" : homeScore < awayScore ? "away" : "tie",
      isOvertime,
      isSimulated: false,
    };

    recordGameResult(seasonId, scheduleGameId, result, gameId);

    // Advance playoff bracket if this was a playoff game
    const currentSeason = useSeasonStore.getState().getSeason(seasonId);
    const schedGame = currentSeason?.schedule.find((g) => g.id === scheduleGameId);
    if (schedGame?.isPlayoff && currentSeason) {
      const advanced = advancePlayoffWinner(currentSeason, scheduleGameId);
      useSeasonStore.getState().setSchedule(seasonId, advanced);

      // Check if championship game is complete → finish season
      const finalGame = advanced.find((g) => g.playoffRound === "super_bowl" && g.result);
      if (finalGame) {
        useSeasonStore.getState().completeSeason(seasonId);
      }
    }
  }, [seasonId, scheduleGameId, gameId, recordGameResult]);

  // Auto-detect game completion and write result
  useEffect(() => {
    if (game?.status === "completed" && seasonId && scheduleGameId) {
      // Check if result is already recorded
      const season = useSeasonStore.getState().getSeason(seasonId);
      const scheduleGame = season?.schedule.find((g) => g.id === scheduleGameId);
      if (scheduleGame && !scheduleGame.result) {
        handleGameComplete();
      }
    }
  }, [game?.status, seasonId, scheduleGameId, handleGameComplete]);

  if (!hydrated) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
        <div className="h-64 rounded-lg animate-pulse mt-4" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  if (!game) {
    router.push("/fdf");
    return null;
  }

  const homeTeam = getTeam(game.homeTeamId);
  const awayTeam = getTeam(game.awayTeamId);

  if (!homeTeam || !awayTeam) {
    router.push("/fdf");
    return null;
  }

  if (game.status === "completed") {
    return (
      <div className="max-w-5xl mx-auto">
        <GameSummary game={game} homeTeam={homeTeam} awayTeam={awayTeam} seasonId={seasonId ?? undefined} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Scoresheet
        game={game}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        onGameComplete={handleGameComplete}
      />
    </div>
  );
}
