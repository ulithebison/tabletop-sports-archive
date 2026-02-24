"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { SeasonCard } from "@/components/fdf/seasons/SeasonCard";

export default function SeasonsPage() {
  const [hydrated, setHydrated] = useState(false);
  const seasonsMap = useSeasonStore((s) => s.seasons);
  const seasons = useMemo(
    () => Object.values(seasonsMap).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [seasonsMap]
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
          Seasons
        </h1>
        <Link
          href="/fdf/seasons/new"
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: "var(--fdf-accent)" }}
        >
          <Plus size={16} />
          New Season
        </Link>
      </div>

      {seasons.length === 0 ? (
        <div
          className="text-center py-16 rounded-lg"
          style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
        >
          <p className="text-lg font-medium mb-2" style={{ color: "var(--fdf-text-secondary)" }}>
            No seasons yet
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--fdf-text-muted)" }}>
            Create a season to start a full replay campaign
          </p>
          <Link
            href="/fdf/seasons/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold text-white"
            style={{ backgroundColor: "var(--fdf-accent)" }}
          >
            <Plus size={16} />
            Create Season
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {seasons.map((season) => (
            <SeasonCard key={season.id} season={season} />
          ))}
        </div>
      )}
    </div>
  );
}
