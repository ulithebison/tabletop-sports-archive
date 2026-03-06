"use client";

import Link from "next/link";
import { Trophy, BarChart3, BookOpen, Shield, RefreshCw } from "lucide-react";
import { useCommissionerStore } from "@/lib/fdf/commissioner/commissioner-store";
import type { FdfSeason, FdfTeam, TeamStanding, SeasonAward } from "@/lib/fdf/types";

interface SeasonCompleteProps {
  season: FdfSeason;
  standings: TeamStanding[];
  getTeam: (id: string) => FdfTeam | undefined;
  seasonId: string;
  awards?: SeasonAward[];
  onNewSeason?: () => void;
}

export function SeasonComplete({ season, standings, getTeam, seasonId, awards, onNewSeason }: SeasonCompleteProps) {
  const setLeaguePhase = useCommissionerStore((s) => s.setLeaguePhase);
  const commissionerLeague = useCommissionerStore((s) =>
    season.commissionerLeagueId ? s.leagues[season.commissionerLeagueId] : undefined
  );

  // Ensure league is in postseason when season is completed
  const needsPhaseTransition = commissionerLeague && commissionerLeague.currentPhase === "regular_season";
  if (needsPhaseTransition && season.commissionerLeagueId) {
    setLeaguePhase(season.commissionerLeagueId, "postseason");
  }

  // Find champion (winner of the last playoff game)
  const playoffGames = season.schedule
    .filter((g) => g.isPlayoff && g.result)
    .sort((a, b) => b.week - a.week);

  const finalGame = playoffGames[0];
  const championId = finalGame
    ? finalGame.result!.winner === "home"
      ? finalGame.homeTeamId
      : finalGame.awayTeamId
    : standings[0]?.teamId;

  const champion = championId ? getTeam(championId) : undefined;
  const championStanding = standings.find((s) => s.teamId === championId);

  const totalGamesPlayed = season.schedule.filter((g) => g.result && !g.isBye).length;
  const playoffGamesPlayed = season.schedule.filter((g) => g.isPlayoff && g.result).length;
  const simulatedGames = season.schedule.filter((g) => g.result?.isSimulated).length;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--fdf-border)" }}
    >
      {/* Champion banner */}
      {champion && (
        <div
          className="p-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${champion.primaryColor}30, ${champion.primaryColor}10)`,
            borderBottom: `2px solid ${champion.primaryColor}`,
          }}
        >
          <Trophy size={32} className="mx-auto mb-2" style={{ color: "#f59e0b" }} />
          <p className="text-xs font-fdf-mono uppercase tracking-wider mb-1" style={{ color: "var(--fdf-text-muted)" }}>
            {season.year} {season.leagueType} Champion
          </p>
          <h2 className="text-xl font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
            {champion.name}
          </h2>
          {championStanding && (
            <p className="text-sm font-fdf-mono mt-1" style={{ color: "var(--fdf-text-secondary)" }}>
              {championStanding.wins}-{championStanding.losses}
              {championStanding.ties > 0 ? `-${championStanding.ties}` : ""}
              {" · "}PF {championStanding.pointsFor} · PA {championStanding.pointsAgainst}
            </p>
          )}
          {finalGame && (
            <p className="text-xs font-fdf-mono mt-2" style={{ color: "var(--fdf-text-muted)" }}>
              Championship: {finalGame.result!.awayScore} - {finalGame.result!.homeScore}
              {finalGame.result!.isOvertime ? " (OT)" : ""}
            </p>
          )}
        </div>
      )}

      {/* Season summary stats */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-px"
        style={{ backgroundColor: "var(--fdf-border)" }}
      >
        {[
          { label: "Total Games", value: totalGamesPlayed },
          { label: "Playoff Games", value: playoffGamesPlayed },
          { label: "Simulated", value: simulatedGames },
          { label: "Played", value: totalGamesPlayed - simulatedGames },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3 text-center"
            style={{ backgroundColor: "var(--fdf-bg-card)" }}
          >
            <p className="text-lg font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
              {stat.value}
            </p>
            <p className="text-[9px] font-fdf-mono uppercase" style={{ color: "var(--fdf-text-muted)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick awards summary */}
      {awards && awards.length > 0 && (
        <div className="p-4" style={{ backgroundColor: "var(--fdf-bg-card)" }}>
          <div className="flex flex-wrap gap-3 justify-center">
            {awards.slice(0, 3).map((award) => {
              const team = getTeam(award.teamId);
              return (
                <div key={award.type} className="flex items-center gap-1.5">
                  <span className="text-[9px] font-fdf-mono font-bold uppercase" style={{ color: "var(--fdf-text-muted)" }}>
                    {award.type}:
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: team?.primaryColor || "#666" }}
                  />
                  <span className="text-[11px] font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                    {award.playerName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation links */}
      <div
        className="flex items-center justify-center gap-2 p-3"
        style={{ backgroundColor: "var(--fdf-bg-card)" }}
      >
        <Link
          href={`/fdf/seasons/${seasonId}/stats`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-fdf-mono font-bold transition-colors hover:bg-white/5"
          style={{ color: "var(--fdf-accent)", backgroundColor: "var(--fdf-accent)" + "15" }}
        >
          <BarChart3 size={12} />
          Full Stats
        </Link>
        <Link
          href={`/fdf/seasons/${seasonId}/awards`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-fdf-mono font-bold transition-colors hover:bg-white/5"
          style={{ color: "var(--fdf-accent)", backgroundColor: "var(--fdf-accent)" + "15" }}
        >
          <Trophy size={12} />
          All Awards
        </Link>
        <Link
          href={`/fdf/seasons/${seasonId}/recap`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-fdf-mono font-bold transition-colors hover:bg-white/5"
          style={{ color: "var(--fdf-accent)", backgroundColor: "var(--fdf-accent)" + "15" }}
        >
          <BookOpen size={12} />
          Season Recap
        </Link>
        {!season.commissionerLeagueId && onNewSeason && (
          <button
            onClick={onNewSeason}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-fdf-mono font-bold transition-colors hover:bg-white/5"
            style={{ color: "#22c55e", backgroundColor: "#22c55e15" }}
          >
            <RefreshCw size={12} />
            New Season
          </button>
        )}
        {season.commissionerLeagueId && (
          <Link
            href={`/fdf/commissioner/${season.commissionerLeagueId}/offseason`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-fdf-mono font-bold transition-colors hover:bg-white/5"
            style={{ color: "#22c55e", backgroundColor: "#22c55e15" }}
          >
            <Shield size={12} />
            Start Off-Season
          </Link>
        )}
      </div>
    </div>
  );
}
