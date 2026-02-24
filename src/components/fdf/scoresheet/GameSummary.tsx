"use client";

import { useState } from "react";
import Link from "next/link";
import type { FdfGame, FdfTeam } from "@/lib/fdf/types";
import { isScoringPlay, isReturnTD } from "@/lib/fdf/scoring";
import { calculatePlayerGameStats, getGameMVP } from "@/lib/fdf/player-stats";
import { computeWPHistory, computeWPAnalytics } from "@/lib/fdf/win-probability";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useRouter } from "next/navigation";
import { Trophy, ArrowLeft, RotateCcw, Share2 } from "lucide-react";
import { GameBoxScore } from "./GameBoxScore";
import { WinProbabilityChart } from "./WinProbabilityChart";
import { GameCardExport } from "./GameCardExport";
import { DriveLog } from "./DriveLog";

interface GameSummaryProps {
  game: FdfGame;
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
  seasonId?: string;
}

function getResultLabel(result: string): string {
  return result
    .replace(/_/g, " ")
    .replace(/\bFGA\b/, "FG")
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function TeamStatsTable({ game, homeTeam, awayTeam }: { game: FdfGame; homeTeam: FdfTeam; awayTeam: FdfTeam }) {
  const homeDrives = game.drives.filter((d) => d.teamId === homeTeam.id);
  const awayDrives = game.drives.filter((d) => d.teamId === awayTeam.id);

  const homeScoringDrives = homeDrives.filter((d) => isScoringPlay(d.result) && !isReturnTD(d.result)).length
    + awayDrives.filter((d) => isReturnTD(d.result)).length;
  const awayScoringDrives = awayDrives.filter((d) => isScoringPlay(d.result) && !isReturnTD(d.result)).length
    + homeDrives.filter((d) => isReturnTD(d.result)).length;

  const homeInterceptions = homeDrives.filter((d) => d.result === "INTERCEPTION" || d.result === "INTERCEPTION_RETURN_TD").length;
  const awayInterceptions = awayDrives.filter((d) => d.result === "INTERCEPTION" || d.result === "INTERCEPTION_RETURN_TD").length;
  const homeFumbles = homeDrives.filter((d) => d.result === "FUMBLE" || d.result === "FUMBLE_RETURN_TD").length;
  const awayFumbles = awayDrives.filter((d) => d.result === "FUMBLE" || d.result === "FUMBLE_RETURN_TD").length;
  const homeTurnovers = homeInterceptions + homeFumbles;
  const awayTurnovers = awayInterceptions + awayFumbles;

  const homePassingTDs = homeDrives.filter((d) => d.result === "TD_PASS").length;
  const awayPassingTDs = awayDrives.filter((d) => d.result === "TD_PASS").length;
  const homeRushingTDs = homeDrives.filter((d) => d.result === "TD_RUN").length;
  const awayRushingTDs = awayDrives.filter((d) => d.result === "TD_RUN").length;

  const homeFGMade = homeDrives.filter((d) => d.result === "FGA_GOOD" || d.result === "DESPERATION_FGA").length;
  const homeFGAtt = homeFGMade + homeDrives.filter((d) => d.result === "FGA_MISSED").length;
  const awayFGMade = awayDrives.filter((d) => d.result === "FGA_GOOD" || d.result === "DESPERATION_FGA").length;
  const awayFGAtt = awayFGMade + awayDrives.filter((d) => d.result === "FGA_MISSED").length;

  type StatRow = { label: string; away: string | number; home: string | number; indent?: boolean };

  const rows: StatRow[] = [
    { label: "Total Drives", away: awayDrives.length, home: homeDrives.length },
    { label: "Scoring Drives", away: awayScoringDrives, home: homeScoringDrives },
    { label: "Turnovers", away: awayTurnovers, home: homeTurnovers },
    { label: "Interceptions", away: awayInterceptions, home: homeInterceptions, indent: true },
    { label: "Fumbles Lost", away: awayFumbles, home: homeFumbles, indent: true },
    { label: "Passing TD", away: awayPassingTDs, home: homePassingTDs },
    { label: "Rushing TD", away: awayRushingTDs, home: homeRushingTDs },
    { label: "Field Goals", away: `${awayFGMade}-${awayFGAtt}`, home: `${homeFGMade}-${homeFGAtt}` },
  ];

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      <h3
        className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3"
        style={{ color: "var(--fdf-accent)" }}
      >
        Team Stats
      </h3>
      <table className="w-full text-sm font-fdf-mono">
        <thead>
          <tr>
            <th className="text-left pb-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--fdf-text-muted)" }}></th>
            <th className="text-right pb-1.5 text-[10px] font-bold uppercase tracking-wider w-14" style={{ color: awayTeam.primaryColor }}>
              {awayTeam.abbreviation}
            </th>
            <th className="text-right pb-1.5 text-[10px] font-bold uppercase tracking-wider w-14" style={{ color: homeTeam.primaryColor }}>
              {homeTeam.abbreviation}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} style={{ borderTop: "1px solid var(--fdf-border)" }}>
              <td
                className="py-1.5 text-xs"
                style={{
                  color: row.indent ? "var(--fdf-text-muted)" : "var(--fdf-text-secondary)",
                  paddingLeft: row.indent ? "12px" : "0px",
                }}
              >
                {row.label}
              </td>
              <td className="py-1.5 text-right text-xs font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                {row.away}
              </td>
              <td className="py-1.5 text-right text-xs font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                {row.home}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WPSection({ game, homeTeam, awayTeam }: { game: FdfGame; homeTeam: FdfTeam; awayTeam: FdfTeam }) {
  const wpSnapshots = computeWPHistory(game);
  const wpAnalytics = computeWPAnalytics(wpSnapshots, game.homeTeamId);

  const getTeamAbbr = (teamId: string) =>
    teamId === homeTeam.id ? homeTeam.abbreviation : awayTeam.abbreviation;

  return (
    <>
      <WinProbabilityChart
        snapshots={wpSnapshots}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        analytics={wpAnalytics}
        isCollapsible={false}
      />
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <h3
          className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3"
          style={{ color: "var(--fdf-accent)" }}
        >
          WP Summary
        </h3>
        <div className="space-y-1.5 text-xs font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
          {wpAnalytics.keyPlay && (
            <p>
              <span style={{ color: "var(--fdf-text-primary)" }}>Key Play:</span>{" "}
              Drive {wpAnalytics.keyPlay.snapshot.afterDriveNumber} shifted WP by{" "}
              <span style={{ color: "var(--fdf-accent)" }}>
                {Math.round(wpAnalytics.keyPlay.delta * 100)}%
              </span>
            </p>
          )}
          {wpAnalytics.biggestLead && (
            <p>
              <span style={{ color: "var(--fdf-text-primary)" }}>Biggest Lead:</span>{" "}
              <span style={{ color: wpAnalytics.biggestLead.teamId === homeTeam.id ? homeTeam.primaryColor : awayTeam.primaryColor }}>
                {getTeamAbbr(wpAnalytics.biggestLead.teamId)}
              </span>{" "}
              led with {Math.round(wpAnalytics.biggestLead.wpPct * 100)}% WP
            </p>
          )}
          <p>
            <span style={{ color: "var(--fdf-text-primary)" }}>Biggest Swing:</span>{" "}
            {Math.round(wpAnalytics.biggestSwingDelta * 100)}% on Drive{" "}
            {wpAnalytics.keyPlay?.snapshot.afterDriveNumber ?? "—"}
          </p>
          <p>
            <span style={{ color: "var(--fdf-text-primary)" }}>Lead Changes:</span>{" "}
            {wpAnalytics.leadChanges}
          </p>
        </div>
      </div>
    </>
  );
}

export function GameSummary({ game, homeTeam, awayTeam, seasonId }: GameSummaryProps) {
  const router = useRouter();
  const createGame = useGameStore((s) => s.createGame);
  const getTeam = useTeamStore((s) => s.getTeam);
  const [showCard, setShowCard] = useState(false);

  // Enhanced mode: calculate player stats (prefer FinderRoster, fall back to TeamRoster)
  const homeTeamData = getTeam(game.homeTeamId);
  const awayTeamData = getTeam(game.awayTeamId);
  const homeRoster = homeTeamData?.finderRoster || homeTeamData?.roster;
  const awayRoster = awayTeamData?.finderRoster || awayTeamData?.roster;
  const playerStats = game.enhancedMode
    ? calculatePlayerGameStats(game, homeRoster, awayRoster)
    : [];
  const mvp = game.enhancedMode ? getGameMVP(playerStats) : null;

  // WP data for game card export
  const wpSnapshots = computeWPHistory(game);
  const wpAnalytics = computeWPAnalytics(wpSnapshots, game.homeTeamId);

  const winner = game.score.home.total > game.score.away.total ? homeTeam : awayTeam;
  const winScore = Math.max(game.score.home.total, game.score.away.total);
  const loseScore = Math.min(game.score.home.total, game.score.away.total);
  const isTie = game.score.home.total === game.score.away.total;

  const scoringDrives = game.drives.filter((d) => isScoringPlay(d.result));

  const handleRematch = () => {
    const newGameId = createGame(game.homeTeamId, game.awayTeamId, game.enhancedMode || undefined);
    router.push(`/fdf/game/${newGameId}`);
  };

  return (
    <div className="space-y-4">
      {/* Final Score Header */}
      <div
        className="rounded-lg p-6 text-center"
        style={{ backgroundColor: "var(--fdf-scoreboard-bg)", border: "1px solid var(--fdf-border)" }}
      >
        <p className="text-xs font-fdf-mono uppercase tracking-widest mb-3" style={{ color: "var(--fdf-text-muted)" }}>
          Final
        </p>
        <div className="flex items-center justify-center gap-6">
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: awayTeam.primaryColor }}>{awayTeam.name}</p>
            <p className="text-3xl font-fdf-mono font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>
              {game.score.away.total}
            </p>
          </div>
          <span className="text-lg font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>—</span>
          <div className="text-left">
            <p className="text-sm font-bold" style={{ color: homeTeam.primaryColor }}>{homeTeam.name}</p>
            <p className="text-3xl font-fdf-mono font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>
              {game.score.home.total}
            </p>
          </div>
        </div>
        {!isTie && (
          <p className="mt-2 text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            <Trophy size={12} className="inline mr-1" />
            {winner.name} wins {winScore}–{loseScore}
          </p>
        )}
      </div>

      {/* Quarter by Quarter */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <h3 className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
          Score by Quarter
        </h3>
        <table className="w-full text-center font-fdf-mono text-sm">
          <thead>
            <tr>
              <th className="text-left py-1 text-xs" style={{ color: "var(--fdf-text-muted)" }}>Team</th>
              <th className="py-1 text-xs w-12" style={{ color: "var(--fdf-text-muted)" }}>Q1</th>
              <th className="py-1 text-xs w-12" style={{ color: "var(--fdf-text-muted)" }}>Q2</th>
              <th className="py-1 text-xs w-12" style={{ color: "var(--fdf-text-muted)" }}>Q3</th>
              <th className="py-1 text-xs w-12" style={{ color: "var(--fdf-text-muted)" }}>Q4</th>
              {(game.score.home.ot > 0 || game.score.away.ot > 0) && (
                <th className="py-1 text-xs w-12" style={{ color: "var(--fdf-text-muted)" }}>OT</th>
              )}
              <th className="py-1 text-xs w-14 font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: "1px solid var(--fdf-border)" }}>
              <td className="text-left py-1 font-bold" style={{ color: awayTeam.primaryColor }}>{awayTeam.abbreviation}</td>
              <td className="py-1" style={{ color: "var(--fdf-text-primary)" }}>{game.score.away.q1}</td>
              <td className="py-1" style={{ color: "var(--fdf-text-primary)" }}>{game.score.away.q2}</td>
              <td className="py-1" style={{ color: "var(--fdf-text-primary)" }}>{game.score.away.q3}</td>
              <td className="py-1" style={{ color: "var(--fdf-text-primary)" }}>{game.score.away.q4}</td>
              {(game.score.home.ot > 0 || game.score.away.ot > 0) && (
                <td className="py-1" style={{ color: "var(--fdf-text-primary)" }}>{game.score.away.ot}</td>
              )}
              <td className="py-1 font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>{game.score.away.total}</td>
            </tr>
            <tr style={{ borderTop: "1px solid var(--fdf-border)" }}>
              <td className="text-left py-1 font-bold" style={{ color: homeTeam.primaryColor }}>{homeTeam.abbreviation}</td>
              <td className="py-1" style={{ color: "var(--fdf-text-primary)" }}>{game.score.home.q1}</td>
              <td className="py-1" style={{ color: "var(--fdf-text-primary)" }}>{game.score.home.q2}</td>
              <td className="py-1" style={{ color: "var(--fdf-text-primary)" }}>{game.score.home.q3}</td>
              <td className="py-1" style={{ color: "var(--fdf-text-primary)" }}>{game.score.home.q4}</td>
              {(game.score.home.ot > 0 || game.score.away.ot > 0) && (
                <td className="py-1" style={{ color: "var(--fdf-text-primary)" }}>{game.score.home.ot}</td>
              )}
              <td className="py-1 font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>{game.score.home.total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Team Stats — ESPN-style comparison table */}
      <TeamStatsTable game={game} homeTeam={homeTeam} awayTeam={awayTeam} />

      {/* Box Score (Enhanced Mode) */}
      {game.enhancedMode && playerStats.length > 0 && (
        <GameBoxScore
          stats={playerStats}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          mvp={mvp}
        />
      )}

      {/* Scoring Plays */}
      {scoringDrives.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
        >
          <h3 className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
            Scoring Plays
          </h3>
          <div className="space-y-1.5">
            {scoringDrives.map((d) => {
              const team = d.teamId === homeTeam.id ? homeTeam : awayTeam;
              // For return TDs, the scoring team is the defense
              const scoringTeam = isReturnTD(d.result)
                ? (d.teamId === homeTeam.id ? awayTeam : homeTeam)
                : team;
              return (
                <div key={d.id} className="flex items-center gap-2 text-xs">
                  <span className="font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>Q{d.quarter}</span>
                  <span className="font-bold" style={{ color: scoringTeam.primaryColor }}>{scoringTeam.abbreviation}</span>
                  <span className="font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
                    {getResultLabel(d.result)}
                    {d.patResult && ` (${d.patResult === "XP_GOOD" ? "XP" : d.patResult === "2PT_GOOD" ? "2PT" : d.patResult === "XP_MISSED" ? "XP✗" : "2PT✗"})`}
                  </span>
                  {d.summary && (
                    <span className="truncate" style={{ color: "var(--fdf-text-muted)" }}>— {d.summary}</span>
                  )}
                  <span className="ml-auto font-fdf-mono font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>
                    {d.scoreAfterDrive}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Win Probability Chart + Analytics */}
      {game.drives.length >= 2 && <WPSection game={game} homeTeam={homeTeam} awayTeam={awayTeam} />}

      {/* All Drives */}
      {game.drives.length > 0 && (
        <DriveLog drives={game.drives} homeTeam={homeTeam} awayTeam={awayTeam} />
      )}

      {/* Share Game Card */}
      {game.drives.length >= 2 && (
        <>
          {!showCard ? (
            <button
              type="button"
              onClick={() => setShowCard(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-fdf-mono font-bold transition-colors"
              style={{
                color: "var(--fdf-accent)",
                border: "1px solid var(--fdf-accent)",
                backgroundColor: "rgba(59,130,246,0.08)",
              }}
            >
              <Share2 size={16} />
              Share Game Card
            </button>
          ) : (
            <GameCardExport
              game={game}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              playerStats={playerStats}
              wpSnapshots={wpSnapshots}
              wpAnalytics={wpAnalytics}
              mvp={mvp}
            />
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={seasonId ? `/fdf/seasons/${seasonId}` : "/fdf"}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
          style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
        >
          <ArrowLeft size={16} />
          {seasonId ? "Back to Season" : "Dashboard"}
        </Link>
        <button
          onClick={handleRematch}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: "var(--fdf-accent)" }}
        >
          <RotateCcw size={16} />
          Rematch
        </button>
      </div>
    </div>
  );
}
