"use client";

import type { FdfTeam, TeamQualities } from "@/lib/fdf/types";
import type { ClassicTeamData } from "@/lib/fdf/commissioner/types";
import { FdfCard } from "../shared/FdfCard";

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
        {team.qualities.offense.scoringTendency && (
          <p className="text-[10px] font-fdf-mono mb-2" style={{ color: "var(--fdf-text-muted)" }}>
            Scoring Tendency: <span className="font-bold" style={{ color: "var(--fdf-accent)" }}>{team.qualities.offense.scoringTendency}</span>
          </p>
        )}
        <QualityCategoryTable q={team.qualities} />
        <div className="flex gap-3 pt-2 mt-2" style={{ borderTop: "1px solid var(--fdf-border)" }}>
          <span className="font-fdf-mono text-xs" style={{ color: "var(--fdf-text-muted)" }}>
            FG: <span style={{ color: "var(--fdf-text-primary)" }}>{team.kicking.fgRange || "—"}</span>
          </span>
          <span className="font-fdf-mono text-xs" style={{ color: "var(--fdf-text-muted)" }}>
            XP: <span style={{ color: "var(--fdf-text-primary)" }}>{team.kicking.xpRange || "—"}</span>
          </span>
        </div>
      </FdfCard>
    </div>
  );
}

const POSITIVE_QUALITIES = new Set([
  "PROLIFIC", "DYNAMIC", "SOLID", "RELIABLE", "SECURE", "DISCIPLINED", "EFFICIENT",
  "STAUNCH", "STIFF", "PUNISHING", "AGGRESSIVE", "ACTIVE", "ELECTRIC",
]);
const NEGATIVE_QUALITIES = new Set([
  "DULL", "ERRATIC", "POROUS", "SHAKY", "CLUMSY", "UNDISCIPLINED", "INEFFICIENT",
  "INEPT", "SOFT", "MILD", "MEEK", "PASSIVE",
]);

function qualityType(value: string, semi: boolean): "positive" | "negative" | "semi" {
  if (semi) return "semi";
  if (POSITIVE_QUALITIES.has(value)) return "positive";
  if (NEGATIVE_QUALITIES.has(value)) return "negative";
  return "semi";
}

const QUALITY_COLORS = {
  positive: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
  negative: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
  semi: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
};

function QualityCategoryTable({ q }: { q: TeamQualities }) {
  type Row = { group: string; category: string; value: string; semi: boolean };
  const rows: Row[] = [];

  if (q.offense.scoring) rows.push({ group: "OFF", category: "Scoring", value: q.offense.scoring, semi: q.offense.scoringSemi });
  if (q.offense.yards) rows.push({ group: "OFF", category: "Yards", value: q.offense.yards, semi: q.offense.yardsSemi });
  if (q.offense.protection) rows.push({ group: "OFF", category: "Protection", value: q.offense.protection, semi: q.offense.protectionSemi });
  if (q.offense.ballSecurity) rows.push({ group: "OFF", category: "Ball Sec.", value: q.offense.ballSecurity, semi: q.offense.ballSecuritySemi });
  if (q.offense.fumbles) rows.push({ group: "OFF", category: "Fumbles", value: q.offense.fumbles, semi: q.offense.fumblesSemi });
  if (q.offense.discipline) rows.push({ group: "OFF", category: "Discipline", value: q.offense.discipline, semi: q.offense.disciplineSemi });
  if (q.offense.clockManagement) {
    const prefix = q.offense.clockManagementLevel === "super" ? "S-" : "";
    rows.push({ group: "OFF", category: "Clock Mgmt", value: `${prefix}${q.offense.clockManagement}`, semi: false });
  }

  if (q.defense.scoring) rows.push({ group: "DEF", category: "Scoring", value: q.defense.scoring, semi: q.defense.scoringSemi });
  if (q.defense.yards) rows.push({ group: "DEF", category: "Yards", value: q.defense.yards, semi: q.defense.yardsSemi });
  if (q.defense.passRush) rows.push({ group: "DEF", category: "Pass Rush", value: q.defense.passRush, semi: q.defense.passRushSemi });
  if (q.defense.coverage) rows.push({ group: "DEF", category: "Coverage", value: q.defense.coverage, semi: q.defense.coverageSemi });
  if (q.defense.fumbleRecovery) rows.push({ group: "DEF", category: "Fumble Rec.", value: q.defense.fumbleRecovery, semi: q.defense.fumbleRecoverySemi });
  if (q.defense.discipline) rows.push({ group: "DEF", category: "Discipline", value: q.defense.discipline, semi: q.defense.disciplineSemi });

  if (q.specialTeams.kickReturn) rows.push({ group: "ST", category: "Kick Ret.", value: "ELECTRIC", semi: q.specialTeams.kickReturnSemi });
  if (q.specialTeams.puntReturn) rows.push({ group: "ST", category: "Punt Ret.", value: "ELECTRIC", semi: q.specialTeams.puntReturnSemi });

  if (rows.length === 0) {
    return <span className="text-[10px] italic" style={{ color: "var(--fdf-text-muted)" }}>No qualities</span>;
  }

  let lastGroup = "";
  return (
    <table style={{ borderSpacing: 0 }}>
      <tbody>
        {rows.map((r, i) => {
          const showGroup = r.group !== lastGroup;
          lastGroup = r.group;
          const qt = qualityType(r.value, r.semi);
          const c = QUALITY_COLORS[qt];
          return (
            <tr key={i}>
              <td className="text-[10px] font-fdf-mono font-bold pr-2 align-top" style={{ color: showGroup ? "var(--fdf-accent)" : "transparent", userSelect: showGroup ? "auto" : "none" }}>
                {r.group}
              </td>
              <td className="text-[10px] font-fdf-mono pr-2 align-top" style={{ color: "var(--fdf-text-muted)" }}>
                {r.category}:
              </td>
              <td className="align-top py-px">
                <span
                  className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-fdf-mono font-medium"
                  style={{ backgroundColor: c.bg, color: c.text }}
                >
                  {r.value}{r.semi ? "~" : ""}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
