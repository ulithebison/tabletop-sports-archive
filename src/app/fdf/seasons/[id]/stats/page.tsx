"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { calculateSeasonPlayerStats, calculateTeamSeasonStats } from "@/lib/fdf/season-stats";
import { SeasonLeaderboard } from "@/components/fdf/seasons/SeasonLeaderboard";
import { PlayerDetailView } from "@/components/fdf/seasons/PlayerDetailView";
import { TeamStatsOverview } from "@/components/fdf/seasons/TeamStatsOverview";
import type { PlayerSeasonStats } from "@/lib/fdf/types";

export default function SeasonStatsPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSeasonStats | null>(null);

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

  const handleSelectPlayer = useCallback((player: PlayerSeasonStats) => {
    setSelectedPlayer(player);
  }, []);

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
    <div className="max-w-5xl mx-auto">
      {selectedPlayer && (
        <PlayerDetailView
          player={selectedPlayer}
          getTeam={getTeam}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/fdf/seasons/${seasonId}`}
          className="p-1.5 rounded hover:bg-white/5"
          style={{ color: "var(--fdf-text-muted)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
            Season Stats
          </h1>
          <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            {season.name} · {season.year}
          </p>
        </div>
      </div>

      <SeasonLeaderboard
        playerStats={playerStats}
        getTeam={getTeam}
        onSelectPlayer={handleSelectPlayer}
      />

      {teamStats.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[10px] font-fdf-mono uppercase tracking-wider mb-2" style={{ color: "var(--fdf-accent)" }}>
            Team Statistics
          </h2>
          <TeamStatsOverview teamStats={teamStats} getTeam={getTeam} />
        </div>
      )}
    </div>
  );
}
