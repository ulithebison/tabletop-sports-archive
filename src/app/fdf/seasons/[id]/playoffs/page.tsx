"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { PlayoffBracket } from "@/components/fdf/seasons/PlayoffBracket";
import { SimulationModal } from "@/components/fdf/seasons/SimulationModal";
import { simulateInstantResult } from "@/lib/fdf/instant-results";
import { calculateStandings, sortStandings } from "@/lib/fdf/standings";
import { generatePlayoffSeeds, advancePlayoffWinner } from "@/lib/fdf/playoff-seeding";
import type { ScheduleGame, SeasonGameResult } from "@/lib/fdf/types";
import type { PlayoffSeed } from "@/lib/fdf/playoff-seeding";

export default function PlayoffsPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [simResult, setSimResult] = useState<{
    result: SeasonGameResult;
    scheduleGameId: string;
  } | null>(null);

  const seasonId = params.id as string;
  const season = useSeasonStore((s) => s.getSeason(seasonId));
  const recordGameResult = useSeasonStore((s) => s.recordGameResult);
  const setSchedule = useSeasonStore((s) => s.setSchedule);
  const completeSeason = useSeasonStore((s) => s.completeSeason);
  const getTeam = useTeamStore((s) => s.getTeam);
  const createGame = useGameStore((s) => s.createGame);

  useEffect(() => setHydrated(true), []);

  const standings = useMemo(() => {
    if (!season) return [];
    return sortStandings(calculateStandings(season));
  }, [season]);

  const seeds: PlayoffSeed[] = useMemo(() => {
    if (!season) return [];
    return generatePlayoffSeeds(standings, season);
  }, [standings, season]);

  const handlePlay = useCallback((game: ScheduleGame) => {
    const gameId = createGame(game.homeTeamId, game.awayTeamId);
    const currentSeason = useSeasonStore.getState().getSeason(seasonId);
    if (currentSeason) {
      const updatedSchedule = currentSeason.schedule.map((g) =>
        g.id === game.id ? { ...g, gameId } : g
      );
      setSchedule(seasonId, updatedSchedule);
    }
    router.push(`/fdf/game/${gameId}?seasonId=${seasonId}&scheduleGameId=${game.id}`);
  }, [createGame, seasonId, router, setSchedule]);

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
