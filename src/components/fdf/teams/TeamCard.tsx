"use client";

import Link from "next/link";
import type { FdfTeam } from "@/lib/fdf/types";
import { QualityBadge } from "./QualityBadge";

interface TeamCardProps {
  team: FdfTeam;
}

function getQualityBadgeType(semi: boolean): "positive" | "semi" {
  return semi ? "semi" : "positive";
}

function getNegBadgeType(semi: boolean): "negative" | "semi" {
  return semi ? "semi" : "negative";
}

export function TeamCard({ team }: TeamCardProps) {
  const q = team.qualities;

  // Collect key qualities for display
  const badges: { label: string; type: "positive" | "negative" | "semi" }[] = [];

  if (q.offense.scoring === "PROLIFIC") badges.push({ label: "PROLIFIC" + (q.offense.scoringSemi ? "•" : ""), type: getQualityBadgeType(q.offense.scoringSemi) });
  if (q.offense.scoring === "DULL") badges.push({ label: "DULL" + (q.offense.scoringSemi ? "•" : ""), type: getNegBadgeType(q.offense.scoringSemi) });
  if (q.defense.scoring === "STAUNCH") badges.push({ label: "STAUNCH" + (q.defense.scoringSemi ? "•" : ""), type: getQualityBadgeType(q.defense.scoringSemi) });
  if (q.defense.scoring === "INEPT") badges.push({ label: "INEPT" + (q.defense.scoringSemi ? "•" : ""), type: getNegBadgeType(q.defense.scoringSemi) });
  if (q.offense.clockManagement === "EFFICIENT") badges.push({ label: q.offense.clockManagementLevel === "super" ? "SUPER EFF" : "EFFICIENT", type: "positive" });
  if (q.offense.clockManagement === "INEFFICIENT") badges.push({ label: q.offense.clockManagementLevel === "super" ? "SUPER INEFF" : "INEFFICIENT", type: "negative" });

  return (
    <Link
      href={`/fdf/teams/${team.id}`}
      className="block rounded-lg p-4 transition-all hover:scale-[1.01]"
      style={{
        backgroundColor: "var(--fdf-bg-card)",
        border: "1px solid var(--fdf-border)",
      }}
    >
      {/* Team color stripe */}
      <div className="flex items-center gap-3 mb-3">
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={team.name}
            className="w-10 h-10 object-cover rounded-md flex-shrink-0"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center font-fdf-mono text-sm font-bold flex-shrink-0"
            style={{
              backgroundColor: team.primaryColor || "#3b82f6",
              color: team.secondaryColor || "#fff",
            }}
          >
            {team.abbreviation.slice(0, 3)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3
            className="text-sm font-bold truncate"
            style={{ color: "var(--fdf-text-primary)" }}
          >
            {team.name}
          </h3>
          <p className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
            {team.season} {team.league}
            {team.record ? ` · ${team.record}` : ""}
          </p>
        </div>
      </div>

      {/* Quality badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {badges.slice(0, 4).map((b, i) => (
            <QualityBadge key={i} label={b.label} type={b.type} />
          ))}
        </div>
      )}
    </Link>
  );
}
