"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Zap, Users, History, ChevronRight, Trash2 } from "lucide-react";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useGameStore } from "@/lib/fdf/stores/game-store";

export default function FdfDashboard() {
  const [hydrated, setHydrated] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const teamsMap = useTeamStore((s) => s.teams);
  const gamesMap = useGameStore((s) => s.games);
  const deleteGame = useGameStore((s) => s.deleteGame);
  const getTeam = useTeamStore((s) => s.getTeam);

  const teams = useMemo(
    () => Object.values(teamsMap).sort((a, b) => a.name.localeCompare(b.name)),
    [teamsMap]
  );
  const activeGames = useMemo(
    () => Object.values(gamesMap)
      .filter((g) => g.status === "in_progress")
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [gamesMap]
  );
  const completedGames = useMemo(
    () => Object.values(gamesMap)
      .filter((g) => g.status === "completed")
      .sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)),
    [gamesMap]
  );
  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-10 w-64 rounded animate-pulse mb-8" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-lg animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
          ))}
        </div>
      </div>
    );
  }

  const recentGames = completedGames.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold font-fdf-mono tracking-tight"
          style={{ color: "var(--fdf-text-primary)" }}
        >
          Fast Drive Football
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fdf-text-secondary)" }}>
          Digital Companion for FDF Tabletop Football
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/fdf/quick-game"
          className="group rounded-lg p-5 transition-all hover:scale-[1.01]"
          style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
        >
          <Zap size={24} className="mb-2" style={{ color: "var(--fdf-accent)" }} />
          <h2 className="text-base font-bold mb-0.5" style={{ color: "var(--fdf-text-primary)" }}>
            Quick Game
          </h2>
          <p className="text-xs" style={{ color: "var(--fdf-text-secondary)" }}>
            Select two teams and play
          </p>
        </Link>

        <Link
          href="/fdf/teams"
          className="group rounded-lg p-5 transition-all hover:scale-[1.01]"
          style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
        >
          <Users size={24} className="mb-2" style={{ color: "var(--fdf-accent)" }} />
          <h2 className="text-base font-bold mb-0.5" style={{ color: "var(--fdf-text-primary)" }}>
            Teams
            <span className="ml-2 text-xs font-normal font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
              {teams.length}
            </span>
          </h2>
          <p className="text-xs" style={{ color: "var(--fdf-text-secondary)" }}>
            Create and manage FDF teams
          </p>
        </Link>

        <Link
          href="/fdf/history"
          className="group rounded-lg p-5 transition-all hover:scale-[1.01]"
          style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
        >
          <History size={24} className="mb-2" style={{ color: "var(--fdf-accent)" }} />
          <h2 className="text-base font-bold mb-0.5" style={{ color: "var(--fdf-text-primary)" }}>
            History
            <span className="ml-2 text-xs font-normal font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
              {completedGames.length}
            </span>
          </h2>
          <p className="text-xs" style={{ color: "var(--fdf-text-secondary)" }}>
            View completed games
          </p>
        </Link>
      </div>

      {/* Active Games */}
      {activeGames.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
            Active Games
          </h2>
          <div className="space-y-2">
            {activeGames.map((game) => {
              const home = getTeam(game.homeTeamId);
              const away = getTeam(game.awayTeamId);
              return (
                <div
                  key={game.id}
                  className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                  style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
                >
                  <Link
                    href={`/fdf/game/${game.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <span className="flex items-center gap-2 flex-1">
                      <span className="font-fdf-mono font-bold text-sm" style={{ color: away?.primaryColor }}>
                        {away?.abbreviation || "???"}
                      </span>
                      <span className="font-fdf-mono font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>
                        {game.score.away.total}
                      </span>
                      <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>@</span>
                      <span className="font-fdf-mono font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>
                        {game.score.home.total}
                      </span>
                      <span className="font-fdf-mono font-bold text-sm" style={{ color: home?.primaryColor }}>
                        {home?.abbreviation || "???"}
                      </span>
                    </span>
                    <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                      Q{game.gameClock.quarter} · {game.drives.length} drives
                    </span>
                    <ChevronRight size={14} style={{ color: "var(--fdf-text-muted)" }} />
                  </Link>
                  <button
                    onClick={() => {
                      if (confirmDeleteId === game.id) {
                        deleteGame(game.id);
                        setConfirmDeleteId(null);
                      } else {
                        setConfirmDeleteId(game.id);
                      }
                    }}
                    className="p-1.5 rounded transition-colors hover:bg-red-500/20"
                    title={confirmDeleteId === game.id ? "Click again to confirm" : "Delete game"}
                  >
                    <Trash2
                      size={14}
                      style={{ color: confirmDeleteId === game.id ? "#ef4444" : "var(--fdf-text-muted)" }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent completed games */}
      {recentGames.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
              Recent Games
            </h2>
            <Link href="/fdf/history" className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentGames.map((game) => {
              const home = getTeam(game.homeTeamId);
              const away = getTeam(game.awayTeamId);
              const date = game.completedAt ? new Date(game.completedAt).toLocaleDateString() : "";
              return (
                <div
                  key={game.id}
                  className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                  style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
                >
                  <Link
                    href={`/fdf/history/${game.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                      {date}
                    </span>
                    <span className="flex items-center gap-2 flex-1">
                      <span className="font-fdf-mono font-bold text-sm" style={{ color: away?.primaryColor }}>
                        {away?.abbreviation || "???"}
                      </span>
                      <span className="font-fdf-mono font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>
                        {game.score.away.total}–{game.score.home.total}
                      </span>
                      <span className="font-fdf-mono font-bold text-sm" style={{ color: home?.primaryColor }}>
                        {home?.abbreviation || "???"}
                      </span>
                    </span>
                    <ChevronRight size={14} style={{ color: "var(--fdf-text-muted)" }} />
                  </Link>
                  <button
                    onClick={() => {
                      if (confirmDeleteId === game.id) {
                        deleteGame(game.id);
                        setConfirmDeleteId(null);
                      } else {
                        setConfirmDeleteId(game.id);
                      }
                    }}
                    className="p-1.5 rounded transition-colors hover:bg-red-500/20"
                    title={confirmDeleteId === game.id ? "Click again to confirm" : "Delete game"}
                  >
                    <Trash2
                      size={14}
                      style={{ color: confirmDeleteId === game.id ? "#ef4444" : "var(--fdf-text-muted)" }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
