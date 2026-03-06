"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCommissionerStore } from "@/lib/fdf/commissioner/commissioner-store";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { calculateStandings, sortStandings } from "@/lib/fdf/standings";
import { ClassicOffSeasonWizard } from "@/components/fdf/commissioner/ClassicOffSeasonWizard";

export default function OffSeasonPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  const leagueId = params.leagueId as string;
  const league = useCommissionerStore((s) => s.leagues[leagueId]);
  const getSeason = useSeasonStore((s) => s.getSeason);

  useEffect(() => setHydrated(true), []);

  // Derive standings from the most recent linked season (if any)
  const standings = useMemo(() => {
    if (!league || league.seasonIds.length === 0) {
      // No season linked — generate placeholder standings (all teams equal)
      return (league?.teams ?? []).map((ct, i) => ({
        teamId: ct.teamStoreId,
        wins: 0,
        losses: 0,
        rank: i + 1,
      }));
    }
    const latestSeasonId = league.seasonIds[league.seasonIds.length - 1];
    const season = getSeason(latestSeasonId);
    if (!season) {
      return (league?.teams ?? []).map((ct, i) => ({
        teamId: ct.teamStoreId,
        wins: 0,
        losses: 0,
        rank: i + 1,
      }));
    }
    const sorted = sortStandings(calculateStandings(season));
    return sorted.map((s, i) => ({
      teamId: s.teamId,
      wins: s.wins,
      losses: s.losses,
      rank: i + 1,
    }));
  }, [league, getSeason]);

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-10 w-64 rounded animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  if (!league) {
    router.push("/fdf/commissioner");
    return null;
  }

  return (
    <div className="py-4">
      <ClassicOffSeasonWizard
        league={league}
        standings={standings}
        onComplete={() => router.push(`/fdf/commissioner/${leagueId}`)}
        onCancel={() => router.push(`/fdf/commissioner/${leagueId}`)}
      />
    </div>
  );
}
