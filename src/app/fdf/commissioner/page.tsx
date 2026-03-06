"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Shield, ChevronRight, Trash2 } from "lucide-react";
import { useCommissionerStore } from "@/lib/fdf/commissioner/commissioner-store";

const PHASE_LABELS: Record<string, string> = {
  setup: "Setup",
  regular_season: "Regular Season",
  postseason: "Postseason",
  offseason_coaching: "Off-Season: Coaching",
  offseason_ownership: "Off-Season: Ownership",
  offseason_draft: "Off-Season: Draft",
  offseason_training: "Off-Season: Training",
  offseason_development: "Off-Season: Development",
  offseason_retirement: "Off-Season: Retirement",
  offseason_quality_changes: "Off-Season: Qualities",
  offseason_free_agency: "Off-Season: Free Agency",
  offseason_preseason: "Off-Season: Preseason",
  completed: "Completed",
};

export default function CommissionerPage() {
  const [hydrated, setHydrated] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const leagues = useCommissionerStore((s) => s.leagues);
  const deleteLeague = useCommissionerStore((s) => s.deleteLeague);

  useEffect(() => setHydrated(true), []);

  const leagueList = useMemo(
    () => Object.values(leagues).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [leagues]
  );

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-10 w-64 rounded animate-pulse mb-8" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Shield size={24} style={{ color: "var(--fdf-accent)" }} />
            <h1 className="text-2xl font-bold font-fdf-mono tracking-tight" style={{ color: "var(--fdf-text-primary)" }}>
              Commissioner
            </h1>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--fdf-text-secondary)" }}>
            Manage franchise leagues across multiple seasons
          </p>
        </div>
        <Link
          href="/fdf/commissioner/setup"
          className="flex items-center gap-1 px-4 py-2 rounded-md text-sm font-bold text-white"
          style={{ backgroundColor: "var(--fdf-accent)" }}
        >
          <Plus size={16} /> New League
        </Link>
      </div>

      {leagueList.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
        >
          <Shield size={48} className="mx-auto mb-3 opacity-30" style={{ color: "var(--fdf-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--fdf-text-muted)" }}>
            No leagues yet. Create your first league to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leagueList.map((league) => (
            <div
              key={league.id}
              className="flex items-center gap-3 p-4 rounded-lg transition-colors"
              style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
            >
              <Link
                href={`/fdf/commissioner/${league.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div>
                  <h3 className="font-bold text-sm" style={{ color: "var(--fdf-text-primary)" }}>
                    {league.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                      {league.mode === "classic" ? "Classic" : "Player"} Mode
                    </span>
                    <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                      Season {league.currentSeason}
                    </span>
                    <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                      {league.teams.length} teams
                    </span>
                  </div>
                </div>
                <span
                  className="ml-auto text-xs font-fdf-mono px-2 py-0.5 rounded"
                  style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "var(--fdf-accent)" }}
                >
                  {PHASE_LABELS[league.currentPhase] || league.currentPhase}
                </span>
                <ChevronRight size={14} style={{ color: "var(--fdf-text-muted)" }} />
              </Link>
              <button
                onClick={() => {
                  if (confirmDeleteId === league.id) {
                    deleteLeague(league.id);
                    setConfirmDeleteId(null);
                  } else {
                    setConfirmDeleteId(league.id);
                  }
                }}
                className="p-1.5 rounded transition-colors hover:bg-red-500/20"
                title={confirmDeleteId === league.id ? "Click again to confirm" : "Delete league"}
              >
                <Trash2
                  size={14}
                  style={{ color: confirmDeleteId === league.id ? "#ef4444" : "var(--fdf-text-muted)" }}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
