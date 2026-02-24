"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { TeamList } from "@/components/fdf/teams/TeamList";

export default function TeamsPage() {
  const [hydrated, setHydrated] = useState(false);
  const teamsMap = useTeamStore((s) => s.teams);
  const teams = useMemo(
    () => Object.values(teamsMap).sort((a, b) => a.name.localeCompare(b.name)),
    [teamsMap]
  );

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
          Teams
        </h1>
        <Link
          href="/fdf/teams/new"
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: "var(--fdf-accent)" }}
        >
          <Plus size={16} />
          New Team
        </Link>
      </div>

      {teams.length === 0 ? (
        <div
          className="text-center py-16 rounded-lg"
          style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
        >
          <p className="text-lg font-medium mb-2" style={{ color: "var(--fdf-text-secondary)" }}>
            No teams yet
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--fdf-text-muted)" }}>
            Create your first FDF team to get started
          </p>
          <Link
            href="/fdf/teams/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold text-white"
            style={{ backgroundColor: "var(--fdf-accent)" }}
          >
            <Plus size={16} />
            Create Team
          </Link>
        </div>
      ) : (
        <TeamList teams={teams} />
      )}
    </div>
  );
}
