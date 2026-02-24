"use client";

import type { FdfTeam } from "@/lib/fdf/types";
import { QualityBadge } from "../teams/QualityBadge";

interface TeamQualityCardProps {
  team: FdfTeam;
  side: "home" | "away";
}

function getBadgeType(semi: boolean, positive: boolean): "positive" | "negative" | "semi" {
  if (semi) return "semi";
  return positive ? "positive" : "negative";
}

interface Badge {
  label: string;
  type: "positive" | "negative" | "semi";
}

function getOffenseBadges(team: FdfTeam): Badge[] {
  const q = team.qualities.offense;
  const badges: Badge[] = [];

  if (q.scoring) badges.push({ label: q.scoring + (q.scoringSemi ? "•" : ""), type: getBadgeType(q.scoringSemi, q.scoring === "PROLIFIC") });
  if (q.yards) badges.push({ label: q.yards + (q.yardsSemi ? "•" : ""), type: getBadgeType(q.yardsSemi, q.yards === "DYNAMIC") });
  if (q.protection) badges.push({ label: q.protection + (q.protectionSemi ? "•" : ""), type: getBadgeType(q.protectionSemi, q.protection === "SOLID") });
  if (q.ballSecurity) badges.push({ label: q.ballSecurity + (q.ballSecuritySemi ? "•" : ""), type: getBadgeType(q.ballSecuritySemi, q.ballSecurity === "RELIABLE") });
  if (q.fumbles) badges.push({ label: q.fumbles + (q.fumblesSemi ? "•" : ""), type: getBadgeType(q.fumblesSemi, q.fumbles === "SECURE") });
  if (q.discipline) badges.push({ label: q.discipline + (q.disciplineSemi ? "•" : ""), type: getBadgeType(q.disciplineSemi, q.discipline === "DISCIPLINED") });
  if (q.clockManagement) {
    const isEff = q.clockManagement === "EFFICIENT";
    const label = q.clockManagementLevel === "super"
      ? (isEff ? "S-EFFICIENT" : "S-INEFFICIENT")
      : q.clockManagement;
    badges.push({ label, type: isEff ? "positive" : "negative" });
  }
  // scoringTendency is now shown as a designator, not as a badge

  return badges;
}

function getDefenseBadges(team: FdfTeam): Badge[] {
  const q = team.qualities.defense;
  const badges: Badge[] = [];

  if (q.scoring) badges.push({ label: q.scoring + (q.scoringSemi ? "•" : ""), type: getBadgeType(q.scoringSemi, q.scoring === "STAUNCH") });
  if (q.yards) badges.push({ label: q.yards + (q.yardsSemi ? "•" : ""), type: getBadgeType(q.yardsSemi, q.yards === "STIFF") });
  if (q.passRush) badges.push({ label: q.passRush + (q.passRushSemi ? "•" : ""), type: getBadgeType(q.passRushSemi, q.passRush === "PUNISHING") });
  if (q.coverage) badges.push({ label: q.coverage + (q.coverageSemi ? "•" : ""), type: getBadgeType(q.coverageSemi, q.coverage === "AGGRESSIVE") });
  if (q.fumbleRecovery) badges.push({ label: q.fumbleRecovery + (q.fumbleRecoverySemi ? "•" : ""), type: getBadgeType(q.fumbleRecoverySemi, q.fumbleRecovery === "ACTIVE") });
  if (q.discipline) badges.push({ label: q.discipline + (q.disciplineSemi ? "•" : ""), type: getBadgeType(q.disciplineSemi, q.discipline === "DISCIPLINED") });

  return badges;
}

function getSTBadges(team: FdfTeam): Badge[] {
  const q = team.qualities.specialTeams;
  const badges: Badge[] = [];
  if (q.kickReturn) badges.push({ label: "KR " + q.kickReturn + (q.kickReturnSemi ? "•" : ""), type: getBadgeType(q.kickReturnSemi, true) });
  if (q.puntReturn) badges.push({ label: "PR " + q.puntReturn + (q.puntReturnSemi ? "•" : ""), type: getBadgeType(q.puntReturnSemi, true) });
  return badges;
}

export function TeamQualityCard({ team, side }: TeamQualityCardProps) {
  const offBadges = getOffenseBadges(team);
  const defBadges = getDefenseBadges(team);
  const stBadges = getSTBadges(team);
  const tendency = team.qualities.offense.scoringTendency;

  return (
    <div
      className="rounded-lg p-2.5 text-xs"
      style={{
        backgroundColor: "var(--fdf-bg-card)",
        border: "1px solid var(--fdf-border)",
        borderTopColor: team.primaryColor || "var(--fdf-border)",
        borderTopWidth: 2,
      }}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 mb-1.5 ${side === "away" ? "" : "flex-row-reverse"}`}>
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={team.name}
            className="w-7 h-7 object-cover rounded flex-shrink-0"
          />
        ) : (
          <div
            className="w-7 h-7 rounded flex items-center justify-center font-fdf-mono text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: team.primaryColor, color: team.secondaryColor || "#fff" }}
          >
            {team.abbreviation.slice(0, 3)}
          </div>
        )}
        <div className={`min-w-0 ${side === "away" ? "" : "text-right"}`}>
          <p className="font-bold truncate text-sm" style={{ color: "var(--fdf-text-primary)" }}>{team.name}</p>
          <p className="text-[10px] truncate" style={{ color: "var(--fdf-text-muted)" }}>
            {team.division && `${team.division} · `}{team.headCoach && `HC: ${team.headCoach}`}
          </p>
        </div>
      </div>

      {/* OFF */}
      <div className="mb-1">
        <span className="font-fdf-mono font-bold text-xs mr-1" style={{ color: "var(--fdf-text-muted)" }}>OFF</span>
        {tendency && (
          <span
            className="font-fdf-mono font-bold text-xs mr-1.5"
            style={{ color: "var(--fdf-accent)" }}
          >
            [{tendency}]
          </span>
        )}
        {offBadges.length > 0 ? (
          <span className="inline-flex flex-wrap gap-0.5">
            {offBadges.map((b, i) => <QualityBadge key={i} label={b.label} type={b.type} />)}
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>—</span>
        )}
      </div>

      {/* DEF */}
      <div className="mb-1">
        <span className="font-fdf-mono font-bold text-xs mr-1.5" style={{ color: "var(--fdf-text-muted)" }}>DEF</span>
        {defBadges.length > 0 ? (
          <span className="inline-flex flex-wrap gap-0.5">
            {defBadges.map((b, i) => <QualityBadge key={i} label={b.label} type={b.type} />)}
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>—</span>
        )}
      </div>

      {/* ST */}
      <div className="mb-1">
        <span className="font-fdf-mono font-bold text-xs mr-1.5" style={{ color: "var(--fdf-text-muted)" }}>ST</span>
        {stBadges.length > 0 ? (
          <span className="inline-flex flex-wrap gap-0.5">
            {stBadges.map((b, i) => <QualityBadge key={i} label={b.label} type={b.type} />)}
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>—</span>
        )}
      </div>

      {/* FG/XP ranges */}
      <div className="flex gap-3 pt-1" style={{ borderTop: "1px solid var(--fdf-border)" }}>
        <span className="font-fdf-mono text-xs" style={{ color: "var(--fdf-text-muted)" }}>
          FG: <span style={{ color: "var(--fdf-text-primary)" }}>{team.kicking.fgRange || "—"}</span>
        </span>
        <span className="font-fdf-mono text-xs" style={{ color: "var(--fdf-text-muted)" }}>
          XP: <span style={{ color: "var(--fdf-text-primary)" }}>{team.kicking.xpRange || "—"}</span>
        </span>
      </div>
    </div>
  );
}
