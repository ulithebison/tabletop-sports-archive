"use client";

import Link from "next/link";
import { Play, Zap, RotateCcw } from "lucide-react";
import type { ScheduleGame, FdfTeam } from "@/lib/fdf/types";

interface SeasonGameRowProps {
  game: ScheduleGame;
  homeTeam: FdfTeam | undefined;
  awayTeam: FdfTeam | undefined;
  seasonId: string;
  onSimulate?: (gameId: string) => void;
  onPlay?: (game: ScheduleGame) => void;
  onResume?: (game: ScheduleGame) => void;
  onReset?: (game: ScheduleGame) => void;
  isActiveGame?: boolean;
  teamLinkFn?: (teamStoreId: string) => string;
}

export function SeasonGameRow({
  game,
  homeTeam,
  awayTeam,
  seasonId,
  onSimulate,
  onPlay,
  onResume,
  onReset,
  isActiveGame,
  teamLinkFn,
}: SeasonGameRowProps) {
  if (game.isBye) {
    const byeContent = (
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: homeTeam?.primaryColor || "#666" }}
        />
        <span className="text-xs font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
          {homeTeam?.abbreviation || "???"}
        </span>
        {homeTeam?.name && (
          <span className="text-[10px] font-fdf-mono truncate" style={{ color: "var(--fdf-text-muted)" }}>
            {homeTeam.name}
          </span>
        )}
      </div>
    );
    return (
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)", opacity: 0.6 }}
      >
        {teamLinkFn && homeTeam ? (
          <Link href={teamLinkFn(game.homeTeamId)} className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
            {byeContent}
          </Link>
        ) : byeContent}
        <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
          BYE
        </span>
      </div>
    );
  }

  const hasResult = !!game.result;
  const isSimulated = game.result?.isSimulated;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      {/* Away team */}
      {(() => {
        const awayBlock = (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: awayTeam?.primaryColor || "#666" }}
            />
            <span
              className="text-xs font-fdf-mono font-bold flex-shrink-0"
              style={{
                color: hasResult && game.result!.winner === "away"
                  ? "var(--fdf-text-primary)"
                  : "var(--fdf-text-secondary)",
              }}
            >
              {awayTeam?.abbreviation || "???"}
            </span>
            {awayTeam?.name && (
              <span className="text-[10px] font-fdf-mono truncate" style={{ color: "var(--fdf-text-muted)" }}>
                {awayTeam.name}
              </span>
            )}
          </div>
        );
        return teamLinkFn && awayTeam ? (
          <Link href={teamLinkFn(game.awayTeamId)} className="flex items-center gap-1.5 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            {awayBlock}
          </Link>
        ) : awayBlock;
      })()}

      {/* Score / Status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {hasResult ? (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-scoreboard-text, var(--fdf-text-primary))" }}>
              {game.result!.awayScore}
            </span>
            <span className="text-[10px]" style={{ color: "var(--fdf-text-muted)" }}>-</span>
            <span className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-scoreboard-text, var(--fdf-text-primary))" }}>
              {game.result!.homeScore}
            </span>
            {game.result!.isOvertime && (
              <span className="text-[9px] font-fdf-mono font-bold px-1 py-0.5 rounded" style={{ color: "#f59e0b", backgroundColor: "#f59e0b20" }}>
                OT
              </span>
            )}
            {isSimulated && (
              <span className="text-[9px] font-fdf-mono font-bold px-1 py-0.5 rounded" style={{ color: "#a855f7", backgroundColor: "#a855f720" }}>
                SIM
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            @
          </span>
        )}
      </div>

      {/* Home team */}
      {(() => {
        const homeBlock = (
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            {homeTeam?.name && (
              <span className="text-[10px] font-fdf-mono truncate" style={{ color: "var(--fdf-text-muted)" }}>
                {homeTeam.name}
              </span>
            )}
            <span
              className="text-xs font-fdf-mono font-bold flex-shrink-0"
              style={{
                color: hasResult && game.result!.winner === "home"
                  ? "var(--fdf-text-primary)"
                  : "var(--fdf-text-secondary)",
              }}
            >
              {homeTeam?.abbreviation || "???"}
            </span>
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: homeTeam?.primaryColor || "#666" }}
            />
          </div>
        );
        return teamLinkFn && homeTeam ? (
          <Link href={teamLinkFn(game.homeTeamId)} className="flex items-center gap-1.5 flex-1 min-w-0 justify-end hover:opacity-80 transition-opacity">
            {homeBlock}
          </Link>
        ) : homeBlock;
      })()}

      {/* Actions */}
      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
        {hasResult && game.gameId ? (
          <>
            <Link
              href={`/fdf/game/${game.gameId}`}
              className="text-[10px] font-fdf-mono px-2 py-1 rounded"
              style={{ color: "var(--fdf-accent)", backgroundColor: "var(--fdf-accent)" + "15" }}
            >
              View
            </Link>
            {onReset && (
              <button
                onClick={() => onReset(game)}
                className="text-[10px] font-fdf-mono font-bold px-2 py-1 rounded"
                style={{ color: "#ef4444", backgroundColor: "#ef444415" }}
                title="Reset game result"
              >
                Reset
              </button>
            )}
          </>
        ) : hasResult && !game.gameId ? (
          <>
            {onReset && (
              <button
                onClick={() => onReset(game)}
                className="text-[10px] font-fdf-mono font-bold px-2 py-1 rounded"
                style={{ color: "#ef4444", backgroundColor: "#ef444415" }}
                title="Reset game result"
              >
                Reset
              </button>
            )}
          </>
        ) : isActiveGame && game.gameId && !hasResult ? (
          <button
            onClick={() => onResume?.(game)}
            className="flex items-center gap-1 text-[10px] font-fdf-mono font-bold px-2 py-1 rounded text-white"
            style={{ backgroundColor: "#f59e0b" }}
            title="Resume in-progress game"
          >
            <RotateCcw size={10} />
            Resume
          </button>
        ) : !hasResult ? (
          <>
            <button
              onClick={() => onPlay?.(game)}
              className="flex items-center gap-1 text-[10px] font-fdf-mono font-bold px-2 py-1 rounded text-white"
              style={{ backgroundColor: "var(--fdf-accent)" }}
              title="Play this game"
            >
              <Play size={10} />
              Play
            </button>
            <button
              onClick={() => onSimulate?.(game.id)}
              className="flex items-center gap-1 text-[10px] font-fdf-mono font-bold px-2 py-1 rounded"
              style={{ color: "#a855f7", backgroundColor: "#a855f720" }}
              title="Simulate this game"
            >
              <Zap size={10} />
              Sim
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
