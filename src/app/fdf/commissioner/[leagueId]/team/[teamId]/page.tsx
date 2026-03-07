"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, ChevronDown, ChevronRight } from "lucide-react";
import { useCommissionerStore } from "@/lib/fdf/commissioner/commissioner-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import { ClassicTeamView } from "@/components/fdf/commissioner/ClassicTeamView";
import type { FdfSeason, TeamQualities } from "@/lib/fdf/types";
import type { CommissionerTeam } from "@/lib/fdf/commissioner/types";

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

// ── Quality table helper ────────────────────────────
function QualityBadges({ q }: { q: TeamQualities }) {
  type Row = { group: string; category: string; value: string; semi: boolean };
  const rows: Row[] = [];

  // Offense
  if (q.offense.scoring) rows.push({ group: "OFF", category: "Scoring", value: q.offense.scoring, semi: q.offense.scoringSemi });
  if (q.offense.yards) rows.push({ group: "OFF", category: "Yards", value: q.offense.yards, semi: q.offense.yardsSemi });
  if (q.offense.protection) rows.push({ group: "OFF", category: "Protection", value: q.offense.protection, semi: q.offense.protectionSemi });
  if (q.offense.ballSecurity) rows.push({ group: "OFF", category: "Ball Sec.", value: q.offense.ballSecurity, semi: q.offense.ballSecuritySemi });
  if (q.offense.fumbles) rows.push({ group: "OFF", category: "Fumbles", value: q.offense.fumbles, semi: q.offense.fumblesSemi });
  if (q.offense.discipline) rows.push({ group: "OFF", category: "Discipline", value: q.offense.discipline, semi: q.offense.disciplineSemi });
  if (q.offense.clockManagement) rows.push({ group: "OFF", category: "Clock Mgmt", value: q.offense.clockManagement, semi: false });

  // Defense
  if (q.defense.scoring) rows.push({ group: "DEF", category: "Scoring", value: q.defense.scoring, semi: q.defense.scoringSemi });
  if (q.defense.yards) rows.push({ group: "DEF", category: "Yards", value: q.defense.yards, semi: q.defense.yardsSemi });
  if (q.defense.passRush) rows.push({ group: "DEF", category: "Pass Rush", value: q.defense.passRush, semi: q.defense.passRushSemi });
  if (q.defense.coverage) rows.push({ group: "DEF", category: "Coverage", value: q.defense.coverage, semi: q.defense.coverageSemi });
  if (q.defense.fumbleRecovery) rows.push({ group: "DEF", category: "Fumble Rec.", value: q.defense.fumbleRecovery, semi: q.defense.fumbleRecoverySemi });
  if (q.defense.discipline) rows.push({ group: "DEF", category: "Discipline", value: q.defense.discipline, semi: q.defense.disciplineSemi });

  // Special Teams
  if (q.specialTeams.kickReturn) rows.push({ group: "ST", category: "Kick Ret.", value: q.specialTeams.kickReturn, semi: q.specialTeams.kickReturnSemi });
  if (q.specialTeams.puntReturn) rows.push({ group: "ST", category: "Punt Ret.", value: q.specialTeams.puntReturn, semi: q.specialTeams.puntReturnSemi });

  if (rows.length === 0) {
    return <span className="text-[10px] italic" style={{ color: "var(--fdf-text-muted)" }}>No qualities</span>;
  }

  let lastGroup = "";
  return (
    <table className="mt-1" style={{ borderSpacing: 0 }}>
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

// ── Season history with expandable qualities ─────────
function SeasonHistorySection({ history, ct }: {
  history: { season: FdfSeason; wins: number; losses: number; ties: number; isChampion: boolean }[];
  ct: CommissionerTeam;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="mt-6">
      <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
        Season History
      </h2>
      <div className="space-y-1.5">
        {history.map(({ season: s, wins, losses, ties, isChampion }) => {
          const snapshot = ct.qualitySnapshots?.[s.id];
          const isExpanded = expanded[s.id] ?? false;
          return (
            <div
              key={s.id}
              className="rounded-lg"
              style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                {snapshot && (
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                    className="p-0.5 rounded hover:bg-white/5 shrink-0"
                    style={{ color: "var(--fdf-text-muted)" }}
                    type="button"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
                <Link
                  href={`/fdf/seasons/${s.id}`}
                  className="min-w-0 flex-1 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                      {s.name} ({s.year})
                    </p>
                    {isChampion && (
                      <span className="flex items-center gap-1 text-[10px] font-fdf-mono font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#eab30820", color: "#eab308" }}>
                        <Trophy size={10} /> CHAMPION
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                    {wins}W-{losses}L{ties > 0 ? `-${ties}T` : ""}
                  </p>
                </Link>
              </div>
              {isExpanded && snapshot && (
                <div className="px-3 pb-2.5 pt-0 border-t" style={{ borderColor: "var(--fdf-border)" }}>
                  <p className="text-[10px] font-fdf-mono font-bold uppercase tracking-wider mt-2 mb-1" style={{ color: "var(--fdf-text-muted)" }}>
                    Team Qualities
                  </p>
                  <QualityBadges q={snapshot} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CommissionerTeamPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  const searchParams = useSearchParams();
  const leagueId = params.leagueId as string;
  const teamId = params.teamId as string;
  const returnTo = searchParams.get("from");

  const league = useCommissionerStore((s) => s.leagues[leagueId]);
  const getTeam = useTeamStore((s) => s.getTeam);
  const seasons = useSeasonStore((s) => s.seasons);

  useEffect(() => setHydrated(true), []);

  const ct = league?.teams.find((t) => t.id === teamId);
  const team = ct ? getTeam(ct.teamStoreId) : null;

  // Build season history for this team
  const teamSeasonHistory = useMemo(() => {
    if (!league || !ct) return [];
    return league.seasonIds
      .map((sid) => seasons[sid])
      .filter((s): s is FdfSeason => !!s && s.status === "completed")
      .map((s) => {
        const teamStoreId = ct.teamStoreId;
        // Count W-L-T from schedule
        let wins = 0, losses = 0, ties = 0;
        for (const g of s.schedule) {
          if (g.isBye || !g.result) continue;
          const isHome = g.homeTeamId === teamStoreId;
          const isAway = g.awayTeamId === teamStoreId;
          if (!isHome && !isAway) continue;
          if (g.result.winner === "tie") { ties++; continue; }
          const won = (isHome && g.result.winner === "home") || (isAway && g.result.winner === "away");
          if (won) wins++; else losses++;
        }
        // Check if champion
        const playoffGames = s.schedule.filter((g) => g.isPlayoff && g.result);
        let isChampion = false;
        if (playoffGames.length > 0) {
          const finalGame = playoffGames[playoffGames.length - 1];
          const winnerTeamId = finalGame.result!.winner === "home" ? finalGame.homeTeamId : finalGame.awayTeamId;
          isChampion = winnerTeamId === teamStoreId;
        }
        return { season: s, wins, losses, ties, isChampion };
      })
      .reverse();
  }, [league, ct, seasons]);

  if (!hydrated) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-10 w-48 rounded animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  if (!league) {
    router.push("/fdf/commissioner");
    return null;
  }

  if (!ct || !team) {
    router.push(`/fdf/commissioner/${leagueId}`);
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={returnTo || `/fdf/commissioner/${leagueId}`}
          className="p-1.5 rounded hover:bg-white/5"
          style={{ color: "var(--fdf-text-muted)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
            {team.name}
          </h1>
          <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            {league.name} · Season {league.currentSeason}
          </p>
        </div>
      </div>

      {ct.classicData ? (
        <ClassicTeamView team={team} classicData={ct.classicData} />
      ) : (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--fdf-text-muted)" }}>
            No classic data available for this team.
          </p>
        </div>
      )}

      {/* Season History */}
      {teamSeasonHistory.length > 0 && (
        <SeasonHistorySection history={teamSeasonHistory} ct={ct} />
      )}
    </div>
  );
}
