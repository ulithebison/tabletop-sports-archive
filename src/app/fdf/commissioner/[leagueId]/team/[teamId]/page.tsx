"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { useCommissionerStore } from "@/lib/fdf/commissioner/commissioner-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { ClassicTeamView } from "@/components/fdf/commissioner/ClassicTeamView";
import type { FdfSeason } from "@/lib/fdf/types";

export default function CommissionerTeamPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  const leagueId = params.leagueId as string;
  const teamId = params.teamId as string;

  const league = useCommissionerStore((s) => s.leagues[leagueId]);
  const getTeam = useTeamStore((s) => s.getTeam);
  const seasons = useSeasonStore((s) => s.seasons);

  useEffect(() => setHydrated(true), []);

  const ct = league?.teams.find((t) => t.id === teamId);
  const team = ct ? getTeam(ct.teamStoreId) : null;

  // Build season history for this team
  const teamSeasonHistory = useMemo(() => {
    if (!league || !ct) return [];
    return league.seasonIds
      .map((sid) => seasons[sid])
      .filter((s): s is FdfSeason => !!s && s.status === "completed")
      .map((s) => {
        const teamStoreId = ct.teamStoreId;
        // Count W-L-T from schedule
        let wins = 0, losses = 0, ties = 0;
        for (const g of s.schedule) {
          if (g.isBye || !g.result) continue;
          const isHome = g.homeTeamId === teamStoreId;
          const isAway = g.awayTeamId === teamStoreId;
          if (!isHome && !isAway) continue;
          if (g.result.winner === "tie") { ties++; continue; }
          const won = (isHome && g.result.winner === "home") || (isAway && g.result.winner === "away");
          if (won) wins++; else losses++;
        }
        // Check if champion
        const playoffGames = s.schedule.filter((g) => g.isPlayoff && g.result);
        let isChampion = false;
        if (playoffGames.length > 0) {
          const finalGame = playoffGames[playoffGames.length - 1];
          const winnerTeamId = finalGame.result!.winner === "home" ? finalGame.homeTeamId : finalGame.awayTeamId;
          isChampion = winnerTeamId === teamStoreId;
        }
        return { season: s, wins, losses, ties, isChampion };
      })
      .reverse();
  }, [league, ct, seasons]);

  if (!hydrated) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-10 w-48 rounded animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  if (!league) {
    router.push("/fdf/commissioner");
    return null;
  }

  if (!ct || !team) {
    router.push(`/fdf/commissioner/${leagueId}`);
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/fdf/commissioner/${leagueId}`}
          className="p-1.5 rounded hover:bg-white/5"
          style={{ color: "var(--fdf-text-muted)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
            {team.name}
          </h1>
          <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            {league.name} · Season {league.currentSeason}
          </p>
        </div>
      </div>

      {ct.classicData ? (
        <ClassicTeamView team={team} classicData={ct.classicData} />
      ) : (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--fdf-text-muted)" }}>
            No classic data available for this team.
          </p>
        </div>
      )}

      {/* Season History */}
      {teamSeasonHistory.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
            Season History
          </h2>
          <div className="space-y-1.5">
            {teamSeasonHistory.map(({ season: s, wins, losses, ties, isChampion }) => (
              <Link
                key={s.id}
                href={`/fdf/seasons/${s.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:scale-[1.005]"
                style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                      {s.name} ({s.year})
                    </p>
                    {isChampion && (
                      <span className="flex items-center gap-1 text-[10px] font-fdf-mono font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#eab30820", color: "#eab308" }}>
                        <Trophy size={10} /> CHAMPION
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                    {wins}W-{losses}L{ties > 0 ? `-${ties}T` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
