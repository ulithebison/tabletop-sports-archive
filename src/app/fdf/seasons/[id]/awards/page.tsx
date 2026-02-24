"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import {
  calculateSeasonPlayerStats,
  calculateTeamSeasonStats,
  calculateSeasonAwards,
  calculatePlayersOfTheWeek,
} from "@/lib/fdf/season-stats";
import { SeasonAwardsView } from "@/components/fdf/seasons/SeasonAwardsView";

export default function SeasonAwardsPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  const seasonId = params.id as string;
  const season = useSeasonStore((s) => s.getSeason(seasonId));
  const teamsMap = useTeamStore((s) => s.teams);
  const gamesMap = useGameStore((s) => s.games);
  const getTeam = useTeamStore((s) => s.getTeam);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && !season) {
      router.push("/fdf/seasons");
    }
  }, [hydrated, season, router]);

  const playerStats = useMemo(() => {
    if (!season) return [];
    return calculateSeasonPlayerStats(season, gamesMap, teamsMap);
  }, [season, gamesMap, teamsMap]);

  const teamStats = useMemo(() => {
    if (!season) return [];
    return calculateTeamSeasonStats(season, gamesMap);
  }, [season, gamesMap]);

  const awards = useMemo(() => calculateSeasonAwards(playerStats, teamStats), [playerStats, teamStats]);

  const playersOfTheWeek = useMemo(() => {
    if (!season) return [];
    return calculatePlayersOfTheWeek(season, gamesMap, teamsMap);
  }, [season, gamesMap, teamsMap]);

  if (!hydrated) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
        <div className="h-64 rounded-lg animate-pulse mt-4" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  if (!season) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/fdf/seasons/${seasonId}`}
          className="p-1.5 rounded hover:bg-white/5"
          style={{ color: "var(--fdf-text-muted)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
            Awards
          </h1>
          <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            {season.name} · {season.year}
          </p>
        </div>
      </div>

      {/* Awards */}
      <SeasonAwardsView
        awards={awards}
        playersOfTheWeek={playersOfTheWeek}
        getTeam={getTeam}
      />
    </div>
  );
}
