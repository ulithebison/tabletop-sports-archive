"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Shield, Newspaper, ArrowRight, Trophy, Play, Calendar } from "lucide-react";
import { useCommissionerStore } from "@/lib/fdf/commissioner/commissioner-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";
import type { FdfSeason } from "@/lib/fdf/types";

const BreakingNewsGenerator = dynamic(
  () => import("@/components/fdf/commissioner/BreakingNewsGenerator").then((m) => m.BreakingNewsGenerator),
  { ssr: false }
);
const SeasonSettingsModal = dynamic(
  () => import("@/components/fdf/commissioner/SeasonSettingsModal").then((m) => m.SeasonSettingsModal),
  { ssr: false }
);

const PHASE_LABELS: Record<string, string> = {
  setup: "Setup",
  regular_season: "Regular Season",
  postseason: "Postseason",
  offseason_coaching: "Off-Season",
  offseason_ownership: "Off-Season",
  offseason_draft: "Off-Season",
  offseason_training: "Off-Season",
  completed: "Completed",
};

export default function LeagueDashboard() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [showBreakingNews, setShowBreakingNews] = useState(false);
  const [showSeasonSettings, setShowSeasonSettings] = useState(false);

  const leagueId = params.leagueId as string;
  const league = useCommissionerStore((s) => s.leagues[leagueId]);
  const setActiveLeague = useCommissionerStore((s) => s.setActiveLeague);
  const addSeasonId = useCommissionerStore((s) => s.addSeasonId);
  const getTeam = useTeamStore((s) => s.getTeam);
  const seasons = useSeasonStore((s) => s.seasons);
  const createSeason = useSeasonStore((s) => s.createSeason);

  useEffect(() => {
    setHydrated(true);
    if (leagueId) setActiveLeague(leagueId);
  }, [leagueId, setActiveLeague]);

  // Find the active (non-completed) season linked to this league
  const activeSeason: FdfSeason | null = useMemo(() => {
    if (!league) return null;
    for (const sid of league.seasonIds) {
      const s = seasons[sid];
      if (s && s.status !== "completed") return s;
    }
    return null;
  }, [league, seasons]);

  const hasActiveSeason = activeSeason !== null;

  // Season progress stats
  const seasonProgress = useMemo(() => {
    if (!activeSeason) return null;
    const totalGames = activeSeason.schedule.filter((g) => !g.isBye && !g.isPlayoff).length;
    const completedGames = activeSeason.schedule.filter((g) => g.result && !g.isBye && !g.isPlayoff).length;
    return { totalGames, completedGames };
  }, [activeSeason]);

  // Completed seasons with champion info
  const completedSeasons = useMemo(() => {
    if (!league) return [];
    return league.seasonIds
      .map((sid) => seasons[sid])
      .filter((s): s is FdfSeason => !!s && s.status === "completed")
      .map((s) => {
        // Find champion from last playoff game
        let championName = "—";
        const playoffGames = s.schedule.filter((g) => g.isPlayoff && g.result);
        if (playoffGames.length > 0) {
          const finalGame = playoffGames[playoffGames.length - 1];
          const winnerTeamId = finalGame.result!.winner === "home" ? finalGame.homeTeamId : finalGame.awayTeamId;
          const winnerTeam = getTeam(winnerTeamId);
          if (winnerTeam) championName = winnerTeam.name;
        }
        const totalGames = s.schedule.filter((g) => !g.isBye && g.result).length;
        return { season: s, championName, totalGames };
      })
      .reverse();
  }, [league, seasons, getTeam]);

  const handleStartSeason = useCallback((settings: {
    name: string;
    year: number;
    regularSeasonWeeks: number;
    playoffTeams: number;
    hasByeWeeks: boolean;
    homeFieldInPlayoffs: boolean;
    canEndInTie: boolean;
  }) => {
    if (!league) return;

    const teamIds = league.teams.map((ct) => ct.teamStoreId);
    if (teamIds.length < 2) return;

    const seasonId = createSeason({
      name: settings.name,
      year: settings.year,
      leagueType: "NFL",
      config: {
        totalRegularSeasonWeeks: settings.regularSeasonWeeks,
        playoffTeams: settings.playoffTeams,
        hasByeWeeks: settings.hasByeWeeks,
        homeFieldInPlayoffs: settings.homeFieldInPlayoffs,
      },
      overtimeRules: { type: "guaranteed_possession", canEndInTie: settings.canEndInTie },
      teamIds,
      divisions: [],
      commissionerLeagueId: leagueId,
    });

    addSeasonId(leagueId, seasonId);
    setShowSeasonSettings(false);
    router.push(`/fdf/seasons/${seasonId}`);
  }, [league, leagueId, createSeason, addSeasonId, router]);

  if (!hydrated || !league) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-10 w-64 rounded animate-pulse" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  const isRegularSeason = league.currentPhase === "regular_season";
  const isPostseason = league.currentPhase === "postseason";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield size={20} style={{ color: "var(--fdf-accent)" }} />
            <h1 className="text-xl font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
              {league.name}
            </h1>
          </div>
          <p className="text-xs font-fdf-mono mt-0.5" style={{ color: "var(--fdf-text-muted)" }}>
            {league.mode === "classic" ? "Classic" : "Player"} Mode · Season {league.currentSeason}
            {activeSeason ? ` · Week ${activeSeason.currentWeek}` : ` · Week ${league.currentWeek}`}
          </p>
        </div>
        <span
          className="text-xs font-fdf-mono px-3 py-1 rounded-md"
          style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "var(--fdf-accent)" }}
        >
          {PHASE_LABELS[league.currentPhase] || league.currentPhase}
        </span>
      </div>

      {/* Active Season Card */}
      {activeSeason && (
        <Link
          href={`/fdf/seasons/${activeSeason.id}`}
          className="block rounded-lg p-4 transition-all hover:scale-[1.005]"
          style={{
            backgroundColor: "var(--fdf-bg-card)",
            border: "1px solid var(--fdf-accent)",
            boxShadow: "0 0 12px rgba(59,130,246,0.1)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar size={16} style={{ color: "var(--fdf-accent)" }} />
              <h3 className="text-sm font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
                Active Season
              </h3>
            </div>
            <span
              className="text-[10px] font-fdf-mono font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: activeSeason.status === "playoffs" ? "#a855f720" : "#3b82f620",
                color: activeSeason.status === "playoffs" ? "#a855f7" : "#3b82f6",
              }}
            >
              {activeSeason.status === "playoffs" ? "Playoffs" : activeSeason.status === "setup" ? "Setup" : "Regular Season"}
            </span>
          </div>
          <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
            {activeSeason.name} · Week {activeSeason.currentWeek}
            {seasonProgress && seasonProgress.totalGames > 0 && (
              <> · {seasonProgress.completedGames}/{seasonProgress.totalGames} games</>
            )}
          </p>
          {seasonProgress && seasonProgress.totalGames > 0 && (
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--fdf-border)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(seasonProgress.completedGames / seasonProgress.totalGames) * 100}%`,
                  backgroundColor: "var(--fdf-accent)",
                }}
              />
            </div>
          )}
          <p className="text-[10px] font-fdf-mono mt-2 flex items-center gap-1" style={{ color: "var(--fdf-accent)" }}>
            <Play size={10} /> Continue Season
          </p>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(isRegularSeason || isPostseason) && (
          <button
            onClick={() => setShowBreakingNews(true)}
            className="p-4 rounded-lg text-left transition-all hover:scale-[1.01]"
            style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
          >
            <Newspaper size={20} className="mb-1.5" style={{ color: "#f59e0b" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--fdf-text-primary)" }}>Breaking News</h3>
            <p className="text-xs" style={{ color: "var(--fdf-text-secondary)" }}>Check for in-season events</p>
          </button>
        )}

        {isPostseason && (
          <Link
            href={`/fdf/commissioner/${leagueId}/offseason`}
            className="p-4 rounded-lg text-left transition-all hover:scale-[1.01]"
            style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
          >
            <ArrowRight size={20} className="mb-1.5" style={{ color: "#22c55e" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--fdf-text-primary)" }}>Start Off-Season</h3>
            <p className="text-xs" style={{ color: "var(--fdf-text-secondary)" }}>Begin off-season process</p>
          </Link>
        )}

        {isRegularSeason && !hasActiveSeason && (
          <button
            onClick={() => setShowSeasonSettings(true)}
            className="p-4 rounded-lg text-left transition-all hover:scale-[1.01]"
            style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
          >
            <Trophy size={20} className="mb-1.5" style={{ color: "var(--fdf-accent)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--fdf-text-primary)" }}>Start Season</h3>
            <p className="text-xs" style={{ color: "var(--fdf-text-secondary)" }}>Configure and start a new season</p>
          </button>
        )}
      </div>

      {/* Breaking News Modal */}
      {showBreakingNews && (
        <BreakingNewsGenerator league={league} onClose={() => setShowBreakingNews(false)} />
      )}

      {/* Season Settings Modal */}
      {showSeasonSettings && (
        <SeasonSettingsModal
          league={league}
          onConfirm={handleStartSeason}
          onClose={() => setShowSeasonSettings(false)}
        />
      )}

      {/* Teams Grid */}
      <div>
        <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
          Teams ({league.teams.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {league.teams.map((ct) => {
            const team = getTeam(ct.teamStoreId);
            if (!team) return null;
            const cd = ct.classicData;
            return (
              <Link
                key={ct.id}
                href={`/fdf/commissioner/${leagueId}/team/${ct.id}`}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:scale-[1.005]"
                style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center font-fdf-mono text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: team.primaryColor, color: team.secondaryColor || "#fff" }}
                >
                  {team.abbreviation}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate" style={{ color: "var(--fdf-text-primary)" }}>
                    {team.name}
                  </p>
                  {cd && (
                    <p className="text-xs truncate" style={{ color: "var(--fdf-text-muted)" }}>
                      FO: {cd.frontOfficeGrade} · HC: {cd.headCoachGrade} · {cd.franchisePoints} FP
                      {cd.hotSeat && " · \u{1F525}"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {cd && (
                    <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                      {cd.ownership.competence}/{cd.ownership.loyalty}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Season History */}
      {completedSeasons.length > 0 && (
        <div>
          <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
            Season History ({completedSeasons.length})
          </h2>
          <div className="space-y-1.5">
            {completedSeasons.map(({ season: s, championName, totalGames }) => (
              <Link
                key={s.id}
                href={`/fdf/seasons/${s.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:scale-[1.005]"
                style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
              >
                <Trophy size={16} style={{ color: "#eab308" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--fdf-text-primary)" }}>
                    {s.name}
                  </p>
                  <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                    {s.year} · {totalGames} games · Champion: {championName}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Headline History */}
      {league.headlineHistory.length > 0 && (
        <div>
          <h2 className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
            News History
          </h2>
          <div className="space-y-1.5">
            {league.headlineHistory.slice(-10).reverse().map((h) => {
              const ct = league.teams.find((t) => t.id === h.teamId);
              const team = ct ? getTeam(ct.teamStoreId) : null;
              return (
                <div
                  key={h.id}
                  className="flex items-center gap-2 px-3 py-2 rounded text-xs"
                  style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}
                >
                  <span className="font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                    W{h.week}
                  </span>
                  <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>
                    {team?.abbreviation}
                  </span>
                  <span style={{ color: "var(--fdf-text-secondary)" }}>{h.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
