"use client";

import { Play, Zap } from "lucide-react";
import type { ScheduleGame, FdfTeam } from "@/lib/fdf/types";
import type { PlayoffSeed } from "@/lib/fdf/playoff-seeding";

interface PlayoffMatchupProps {
  game: ScheduleGame;
  homeTeam: FdfTeam | undefined;
  awayTeam: FdfTeam | undefined;
  seeds: PlayoffSeed[];
  onPlay?: (game: ScheduleGame) => void;
  onSimulate?: (gameId: string) => void;
}

function getSeed(teamId: string, seeds: PlayoffSeed[]): number | undefined {
  return seeds.find((s) => s.teamId === teamId)?.seed;
}

function TeamSlot({
  teamId,
  team,
  seeds,
  isWinner,
  score,
}: {
  teamId: string;
  team: FdfTeam | undefined;
  seeds: PlayoffSeed[];
  isWinner: boolean;
  score?: number;
}) {
  const seed = getSeed(teamId, seeds);
  const isTBD = teamId === "__TBD__";

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm"
      style={{
        backgroundColor: isWinner ? "var(--fdf-accent)" + "15" : "transparent",
      }}
    >
      {seed && (
        <span
          className="text-[9px] font-fdf-mono font-bold w-4 text-center"
          style={{ color: "var(--fdf-text-muted)" }}
        >
          {seed}
        </span>
      )}
      {!isTBD && team ? (
        <>
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: team.primaryColor }}
          />
          <span
            className="text-[11px] font-fdf-mono font-bold flex-1 truncate"
            style={{ color: isWinner ? "var(--fdf-text-primary)" : "var(--fdf-text-secondary)" }}
          >
            {team.abbreviation}
          </span>
        </>
      ) : (
        <span className="text-[11px] font-fdf-mono flex-1" style={{ color: "var(--fdf-text-muted)" }}>
          TBD
        </span>
      )}
      {score !== undefined && (
        <span className="text-[11px] font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
          {score}
        </span>
      )}
    </div>
  );
}

export function PlayoffMatchup({
  game,
  homeTeam,
  awayTeam,
  seeds,
  onPlay,
  onSimulate,
}: PlayoffMatchupProps) {
  const hasResult = !!game.result;
  const isTBD = game.homeTeamId === "__TBD__" || game.awayTeamId === "__TBD__";
  const canPlay = !hasResult && !isTBD;

  return (
    <div
      className="rounded-md overflow-hidden w-44"
      style={{
        backgroundColor: "var(--fdf-bg-card)",
        border: `1px solid ${hasResult ? "var(--fdf-accent)" + "40" : "var(--fdf-border)"}`,
      }}
    >
      {/* Away team (top) */}
      <TeamSlot
        teamId={game.awayTeamId}
        team={awayTeam}
        seeds={seeds}
        isWinner={hasResult && game.result!.winner === "away"}
        score={hasResult ? game.result!.awayScore : undefined}
      />

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "var(--fdf-border)" }} />

      {/* Home team (bottom) */}
      <TeamSlot
        teamId={game.homeTeamId}
        team={homeTeam}
        seeds={seeds}
        isWinner={hasResult && game.result!.winner === "home"}
        score={hasResult ? game.result!.homeScore : undefined}
      />

      {/* Actions */}
      {canPlay && (
        <div
          className="flex gap-1 p-1"
          style={{ borderTop: "1px solid var(--fdf-border)" }}
        >
          <button
            onClick={() => onPlay?.(game)}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-fdf-mono font-bold text-white"
            style={{ backgroundColor: "var(--fdf-accent)" }}
          >
            <Play size={8} />
            Play
          </button>
          <button
            onClick={() => onSimulate?.(game.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-fdf-mono font-bold"
            style={{ color: "#a855f7", backgroundColor: "#a855f720" }}
          >
            <Zap size={8} />
            Sim
          </button>
        </div>
      )}

      {/* OT badge */}
      {hasResult && game.result!.isOvertime && (
        <div className="text-center py-0.5" style={{ backgroundColor: "#f59e0b10" }}>
          <span className="text-[8px] font-fdf-mono font-bold" style={{ color: "#f59e0b" }}>OT</span>
        </div>
      )}
    </div>
  );
}
