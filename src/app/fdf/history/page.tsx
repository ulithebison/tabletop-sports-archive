"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { History } from "lucide-react";

export default function HistoryPage() {
  const [hydrated, setHydrated] = useState(false);
  const gamesMap = useGameStore((s) => s.games);
  const completedGames = useMemo(
    () => Object.values(gamesMap)
      .filter((g) => g.status === "completed")
      .sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)),
    [gamesMap]
  );
  const getTeam = useTeamStore((s) => s.getTeam);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold font-fdf-mono mb-6" style={{ color: "var(--fdf-text-primary)" }}>
        Game History
      </h1>

      {completedGames.length === 0 ? (
        <div
          className="text-center py-16 rounded-lg"
          style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
        >
          <History size={32} className="mx-auto mb-3" style={{ color: "var(--fdf-text-muted)" }} />
          <p className="text-lg font-medium" style={{ color: "var(--fdf-text-secondary)" }}>
            No completed games yet
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--fdf-text-muted)" }}>
            Completed games will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {completedGames.map((game) => {
            const home = getTeam(game.homeTeamId);
            const away = getTeam(game.awayTeamId);
            const date = game.completedAt
              ? new Date(game.completedAt).toLocaleDateString()
              : "Unknown";

            return (
              <Link
                key={game.id}
                href={`/fdf/history/${game.id}`}
                className="flex items-center gap-4 p-4 rounded-lg transition-all hover:scale-[1.005]"
                style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
              >
                <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                  {date}
                </span>

                <div className="flex items-center gap-3 flex-1">
                  <span className="font-fdf-mono font-bold text-sm" style={{ color: away?.primaryColor || "var(--fdf-text-primary)" }}>
                    {away?.abbreviation || "???"}
                  </span>
                  <span className="font-fdf-mono font-bold text-lg" style={{ color: "var(--fdf-scoreboard-text)" }}>
                    {game.score.away.total}
                  </span>
                  <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>@</span>
                  <span className="font-fdf-mono font-bold text-lg" style={{ color: "var(--fdf-scoreboard-text)" }}>
                    {game.score.home.total}
                  </span>
                  <span className="font-fdf-mono font-bold text-sm" style={{ color: home?.primaryColor || "var(--fdf-text-primary)" }}>
                    {home?.abbreviation || "???"}
                  </span>
                </div>

                <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
                  {game.drives.length} drives
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
