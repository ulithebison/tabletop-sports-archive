"use client";

import type { FdfTeam } from "@/lib/fdf/types";
import type { ClassicTeamData } from "@/lib/fdf/commissioner/types";
import { FdfCard } from "../shared/FdfCard";
import { QualityBadge } from "../teams/QualityBadge";

interface ClassicTeamViewProps {
  team: FdfTeam;
  classicData: ClassicTeamData;
}

function GradeBadge({ label, grade }: { label: string; grade: string }) {
  const color =
    grade === "A" ? "#22c55e" :
    grade === "B" ? "#3b82f6" :
    grade === "C" ? "#f59e0b" :
    grade === "D" ? "#f97316" :
    "#ef4444";
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>{label}</span>
      <span
        className="font-fdf-mono font-bold text-sm px-1.5 py-0.5 rounded"
        style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
      >
        {grade}
      </span>
    </div>
  );
}

function OwnershipBadge({ value, type }: { value: string; type: "positive" | "negative" | "neutral" }) {
  const color = type === "positive" ? "#22c55e" : type === "negative" ? "#ef4444" : "var(--fdf-text-secondary)";
  return (
    <span
      className="text-xs font-fdf-mono px-1.5 py-0.5 rounded"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {value}
    </span>
  );
}

export function ClassicTeamView({ team, classicData }: ClassicTeamViewProps) {
  const loyaltyType = classicData.ownership.loyalty === "LOYAL" ? "positive" : classicData.ownership.loyalty === "SELFISH" ? "negative" : "neutral";
  const competenceType = classicData.ownership.competence === "SAVVY" ? "positive" : classicData.ownership.competence === "MEDDLING" ? "negative" : "neutral";

  return (
    <div className="space-y-4">
      {/* Header */}
      <FdfCard>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center font-fdf-mono text-lg font-bold"
            style={{ backgroundColor: team.primaryColor, color: team.secondaryColor || "#fff" }}
          >
            {team.abbreviation}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--fdf-text-primary)" }}>{team.name}</h2>
            <p className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
              HC: {classicData.headCoachName || "TBD"}
            </p>
          </div>
          {classicData.hotSeat && (
            <span className="ml-auto text-xs font-fdf-mono font-bold px-2 py-1 rounded" style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
              HOT SEAT
            </span>
          )}
        </div>
      </FdfCard>

      {/* Management */}
      <FdfCard>
        <h3 className="text-xs font-fdf-mono font-bold uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
          Management
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--fdf-text-muted)" }}>Ownership</p>
            <div className="flex gap-1.5">
              <OwnershipBadge value={classicData.ownership.competence} type={competenceType} />
              <OwnershipBadge value={classicData.ownership.loyalty} type={loyaltyType} />
            </div>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--fdf-text-muted)" }}>Grades</p>
            <div className="flex gap-3">
              <GradeBadge label="FO" grade={classicData.frontOfficeGrade} />
              <GradeBadge label="HC" grade={classicData.headCoachGrade} />
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--fdf-border)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>Franchise Points</span>
            <span className="font-fdf-mono font-bold text-lg" style={{ color: "var(--fdf-accent)" }}>
              {classicData.franchisePoints}
            </span>
          </div>
        </div>
      </FdfCard>

      {/* Qualities */}
      <FdfCard>
        <h3 className="text-xs font-fdf-mono font-bold uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
          Team Qualities
        </h3>
        <div className="space-y-2">
          {/* Offense */}
          <div>
            <span className="font-fdf-mono font-bold text-xs mr-1.5" style={{ color: "var(--fdf-text-muted)" }}>OFF</span>
            {team.qualities.offense.scoringTendency && (
              <span className="font-fdf-mono font-bold text-xs mr-1.5" style={{ color: "var(--fdf-accent)" }}>
                [{team.qualities.offense.scoringTendency}]
              </span>
            )}
            {renderOffenseBadges(team)}
          </div>
          {/* Defense */}
          <div>
            <span className="font-fdf-mono font-bold text-xs mr-1.5" style={{ color: "var(--fdf-text-muted)" }}>DEF</span>
            {renderDefenseBadges(team)}
          </div>
          {/* Special Teams */}
          <div>
            <span className="font-fdf-mono font-bold text-xs mr-1.5" style={{ color: "var(--fdf-text-muted)" }}>ST</span>
            {team.qualities.specialTeams.kickReturn && (
              <QualityBadge label={`KR ELECTRIC${team.qualities.specialTeams.kickReturnSemi ? "•" : ""}`} type="positive" />
            )}
            {team.qualities.specialTeams.puntReturn && (
              <QualityBadge label={`PR ELECTRIC${team.qualities.specialTeams.puntReturnSemi ? "•" : ""}`} type="positive" />
            )}
            {!team.qualities.specialTeams.kickReturn && !team.qualities.specialTeams.puntReturn && (
              <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>—</span>
            )}
          </div>
          {/* Kicking */}
          <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid var(--fdf-border)" }}>
            <span className="font-fdf-mono text-xs" style={{ color: "var(--fdf-text-muted)" }}>
              FG: <span style={{ color: "var(--fdf-text-primary)" }}>{team.kicking.fgRange || "—"}</span>
            </span>
            <span className="font-fdf-mono text-xs" style={{ color: "var(--fdf-text-muted)" }}>
              XP: <span style={{ color: "var(--fdf-text-primary)" }}>{team.kicking.xpRange || "—"}</span>
            </span>
          </div>
        </div>
      </FdfCard>
    </div>
  );
}

function renderOffenseBadges(team: FdfTeam) {
  const q = team.qualities.offense;
  const badges: { label: string; type: "positive" | "negative" | "semi" }[] = [];

  if (q.scoring) badges.push({ label: `${q.scoring}${q.scoringSemi ? "•" : ""}`, type: q.scoring === "PROLIFIC" ? (q.scoringSemi ? "semi" : "positive") : (q.scoringSemi ? "semi" : "negative") });
  if (q.yards) badges.push({ label: `${q.yards}${q.yardsSemi ? "•" : ""}`, type: q.yards === "DYNAMIC" ? (q.yardsSemi ? "semi" : "positive") : (q.yardsSemi ? "semi" : "negative") });
  if (q.protection) badges.push({ label: `${q.protection}${q.protectionSemi ? "•" : ""}`, type: q.protection === "SOLID" ? (q.protectionSemi ? "semi" : "positive") : (q.protectionSemi ? "semi" : "negative") });
  if (q.ballSecurity) badges.push({ label: `${q.ballSecurity}${q.ballSecuritySemi ? "•" : ""}`, type: q.ballSecurity === "RELIABLE" ? "positive" : "negative" });
  if (q.fumbles) badges.push({ label: `${q.fumbles}${q.fumblesSemi ? "•" : ""}`, type: q.fumbles === "SECURE" ? "positive" : "negative" });
  if (q.discipline) badges.push({ label: `${q.discipline}${q.disciplineSemi ? "•" : ""}`, type: q.discipline === "DISCIPLINED" ? "positive" : "negative" });
  if (q.clockManagement) {
    const prefix = q.clockManagementLevel === "super" ? "S-" : "";
    badges.push({ label: `${prefix}${q.clockManagement}`, type: q.clockManagement === "EFFICIENT" ? "positive" : "negative" });
  }

  if (badges.length === 0) return <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>—</span>;
  return (
    <span className="inline-flex flex-wrap gap-0.5">
      {badges.map((b, i) => <QualityBadge key={i} label={b.label} type={b.type} />)}
    </span>
  );
}

function renderDefenseBadges(team: FdfTeam) {
  const q = team.qualities.defense;
  const badges: { label: string; type: "positive" | "negative" | "semi" }[] = [];

  if (q.scoring) badges.push({ label: `${q.scoring}${q.scoringSemi ? "•" : ""}`, type: q.scoring === "STAUNCH" ? (q.scoringSemi ? "semi" : "positive") : (q.scoringSemi ? "semi" : "negative") });
  if (q.yards) badges.push({ label: `${q.yards}${q.yardsSemi ? "•" : ""}`, type: q.yards === "STIFF" ? (q.yardsSemi ? "semi" : "positive") : (q.yardsSemi ? "semi" : "negative") });
  if (q.passRush) badges.push({ label: `${q.passRush}${q.passRushSemi ? "•" : ""}`, type: q.passRush === "PUNISHING" ? (q.passRushSemi ? "semi" : "positive") : (q.passRushSemi ? "semi" : "negative") });
  if (q.coverage) badges.push({ label: `${q.coverage}${q.coverageSemi ? "•" : ""}`, type: q.coverage === "AGGRESSIVE" ? "positive" : "negative" });
  if (q.fumbleRecovery) badges.push({ label: `${q.fumbleRecovery}${q.fumbleRecoverySemi ? "•" : ""}`, type: q.fumbleRecovery === "ACTIVE" ? "positive" : "negative" });
  if (q.discipline) badges.push({ label: `${q.discipline}${q.disciplineSemi ? "•" : ""}`, type: q.discipline === "DISCIPLINED" ? "positive" : "negative" });

  if (badges.length === 0) return <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>—</span>;
  return (
    <span className="inline-flex flex-wrap gap-0.5">
      {badges.map((b, i) => <QualityBadge key={i} label={b.label} type={b.type} />)}
    </span>
  );
}
