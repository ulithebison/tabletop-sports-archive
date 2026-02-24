"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { GameSummary } from "@/components/fdf/scoresheet/GameSummary";

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  const game = useGameStore((s) => s.getGame(params.id as string));
  const getTeam = useTeamStore((s) => s.getTeam);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-32 rounded-lg animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  if (!game || game.status !== "completed") {
    router.push("/fdf/history");
    return null;
  }

  const homeTeam = getTeam(game.homeTeamId);
  const awayTeam = getTeam(game.awayTeamId);

  if (!homeTeam || !awayTeam) {
    router.push("/fdf/history");
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <GameSummary game={game} homeTeam={homeTeam} awayTeam={awayTeam} />
    </div>
  );
}
