"use client";

import React from "react";
import type { FdfGame, FdfTeam, PlayerGameStats } from "@/lib/fdf/types";

interface ShareableGameCardProps {
  game: FdfGame;
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
  headline: string;
  topPlayers: { home: PlayerGameStats[]; away: PlayerGameStats[] };
  wpMiniData: { driveNumber: number; homeWP: number }[];
  mvp: PlayerGameStats | null;
  format?: "social" | "instagram";
}

function formatPlayerLine(p: PlayerGameStats): string {
  const parts: string[] = [];
  if (p.passing.touchdowns > 0) parts.push(`${p.passing.touchdowns} Pass TD`);
  if (p.rushing.touchdowns > 0) parts.push(`${p.rushing.touchdowns} Rush TD`);
  if (p.receiving.touchdowns > 0) parts.push(`${p.receiving.touchdowns} Rec TD`);
  if (p.kicking.fieldGoalsMade > 0) parts.push(`${p.kicking.fieldGoalsMade} FG`);
  if (p.kicking.extraPointsMade > 0) parts.push(`${p.kicking.extraPointsMade} XP`);
  if (p.specialTeams.kickReturnTouchdowns > 0) parts.push(`${p.specialTeams.kickReturnTouchdowns} KR TD`);
  if (p.specialTeams.puntReturnTouchdowns > 0) parts.push(`${p.specialTeams.puntReturnTouchdowns} PR TD`);
  if (p.defense.returnTouchdowns > 0) parts.push(`${p.defense.returnTouchdowns} DEF TD`);
  if (parts.length === 0) parts.push(`${p.pointsResponsibleFor} pts`);
  return parts.join(", ");
}

/** Render a team logo or a colored circle fallback with abbreviation. */
function TeamLogo({ team, size, isSocial }: { team: FdfTeam; size: number; isSocial: boolean }) {
  if (team.logoUrl) {
    return (
      <img
        src={team.logoUrl}
        crossOrigin="anonymous"
        alt={team.abbreviation}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: `2px solid rgba(255,255,255,0.2)`,
        }}
      />
    );
  }
  // Fallback: colored circle with abbreviation
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: team.primaryColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid rgba(255,255,255,0.2)",
      }}
    >
      <span
        style={{
          fontSize: isSocial ? "14px" : "20px",
          fontWeight: 900,
          color: "#fff",
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          letterSpacing: "0.02em",
        }}
      >
        {team.abbreviation}
      </span>
    </div>
  );
}

export const ShareableGameCard = React.forwardRef<HTMLDivElement, ShareableGameCardProps>(
  function ShareableGameCard(
    { game, homeTeam, awayTeam, headline, topPlayers, wpMiniData, mvp, format = "social" },
    ref,
  ) {
    const isSocial = format === "social";
    const cardWidth = isSocial ? 1200 : 1080;
    const cardHeight = isSocial ? 630 : 1080;
    const logoSize = isSocial ? 48 : 64;

    const homeScore = game.score.home.total;
    const awayScore = game.score.away.total;
    const hasOT = game.score.home.ot > 0 || game.score.away.ot > 0;
    const isTie = homeScore === awayScore;

    const quarterScores = [
      { label: "Q1", away: game.score.away.q1, home: game.score.home.q1 },
      { label: "Q2", away: game.score.away.q2, home: game.score.home.q2 },
      { label: "Q3", away: game.score.away.q3, home: game.score.home.q3 },
      { label: "Q4", away: game.score.away.q4, home: game.score.home.q4 },
      ...(hasOT ? [{ label: "OT", away: game.score.away.ot, home: game.score.home.ot }] : []),
    ];

    // Derive final WP from last entry
    const finalHomeWP = wpMiniData.length > 0 ? wpMiniData[wpMiniData.length - 1].homeWP : 0.5;
    const winnerIsHome = homeScore > awayScore;
    const winnerTeam = winnerIsHome ? homeTeam : awayTeam;
    const winnerWP = winnerIsHome ? finalHomeWP : 1 - finalHomeWP;
    const wpPct = Math.round(winnerWP * 100);

    return (
      <div
        ref={ref}
        style={{
          width: cardWidth,
          height: cardHeight,
          backgroundColor: "#0f0f14",
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          color: "#e8e6e3",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Score Header — subtle gradient with team color edges */}
        <div
          style={{
            background: `linear-gradient(135deg, ${awayTeam.primaryColor}22 0%, #0f0f14 30%, #0f0f14 70%, ${homeTeam.primaryColor}22 100%)`,
            padding: isSocial ? "32px 40px" : "48px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isSocial ? "24px" : "36px",
            borderBottom: "1px solid #2a2a35",
          }}
        >
          {/* Away side: logo + name + score */}
          <div style={{ display: "flex", alignItems: "center", gap: isSocial ? "16px" : "20px", flex: 1, justifyContent: "flex-end" }}>
            <div style={{ textAlign: "right", minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: isSocial ? "16px" : "22px",
                  fontWeight: 700,
                  color: awayTeam.primaryColor,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {awayTeam.name}
              </div>
              <div
                style={{
                  fontSize: isSocial ? "52px" : "72px",
                  fontWeight: 900,
                  color: "#e8e6e3",
                  lineHeight: 1,
                  marginTop: "2px",
                }}
              >
                {awayScore}
              </div>
            </div>
            <TeamLogo team={awayTeam} size={logoSize} isSocial={isSocial} />
          </div>

          {/* Center: FINAL label */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: isSocial ? "13px" : "16px",
                fontWeight: 700,
                color: "#888",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              FINAL
            </div>
            <div
              style={{
                fontSize: isSocial ? "20px" : "28px",
                color: "#555",
                lineHeight: 1,
                marginTop: "4px",
              }}
            >
              &middot;
            </div>
          </div>

          {/* Home side: score + name + logo */}
          <div style={{ display: "flex", alignItems: "center", gap: isSocial ? "16px" : "20px", flex: 1, justifyContent: "flex-start" }}>
            <TeamLogo team={homeTeam} size={logoSize} isSocial={isSocial} />
            <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: isSocial ? "16px" : "22px",
                  fontWeight: 700,
                  color: homeTeam.primaryColor,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {homeTeam.name}
              </div>
              <div
                style={{
                  fontSize: isSocial ? "52px" : "72px",
                  fontWeight: 900,
                  color: "#e8e6e3",
                  lineHeight: 1,
                  marginTop: "2px",
                }}
              >
                {homeScore}
              </div>
            </div>
          </div>
        </div>

        {/* Quarter Scores */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: isSocial ? "2px" : "4px",
            padding: isSocial ? "10px 40px" : "14px 48px",
            backgroundColor: "#1a1a22",
            borderBottom: "1px solid #2a2a35",
          }}
        >
          {quarterScores.map((q, i) => (
            <div
              key={q.label}
              style={{
                textAlign: "center",
                padding: isSocial ? "4px 14px" : "6px 20px",
                borderRight: i < quarterScores.length - 1 ? "1px solid #2a2a35" : "none",
              }}
            >
              <div
                style={{
                  fontSize: isSocial ? "10px" : "12px",
                  color: "#888",
                  letterSpacing: "0.1em",
                  marginBottom: "2px",
                }}
              >
                {q.label}
              </div>
              <div style={{ fontSize: isSocial ? "13px" : "16px", fontWeight: 700 }}>
                <span style={{ color: awayTeam.primaryColor }}>{q.away}</span>
                <span style={{ color: "#555", margin: "0 4px" }}>-</span>
                <span style={{ color: homeTeam.primaryColor }}>{q.home}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Key Players — full-width 2-column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            padding: isSocial ? "16px 40px" : "24px 48px",
            gap: isSocial ? "32px" : "48px",
            minHeight: 0,
          }}
        >
          {/* Away Key Players */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: isSocial ? "10px" : "12px",
                fontWeight: 700,
                color: awayTeam.primaryColor,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              KEY PLAYERS
            </div>
            {topPlayers.away.slice(0, isSocial ? 3 : 5).map((p) => (
              <div
                key={p.playerId}
                style={{
                  fontSize: isSocial ? "11px" : "13px",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {mvp && mvp.playerId === p.playerId && (
                  <span style={{ color: "#fbbf24", fontSize: isSocial ? "12px" : "14px" }}>★</span>
                )}
                <span style={{ fontWeight: 700, color: "#e8e6e3" }}>
                  {p.playerNumber ? `#${p.playerNumber} ` : ""}
                  {p.playerName}
                </span>
                <span style={{ color: "#888", fontSize: isSocial ? "10px" : "12px" }}>
                  {formatPlayerLine(p)}
                </span>
              </div>
            ))}
            {topPlayers.away.length === 0 && (
              <div style={{ fontSize: isSocial ? "11px" : "13px", color: "#555" }}>—</div>
            )}
          </div>

          {/* Home Key Players */}
          <div style={{ flex: 1, textAlign: "right" }}>
            <div
              style={{
                fontSize: isSocial ? "10px" : "12px",
                fontWeight: 700,
                color: homeTeam.primaryColor,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              KEY PLAYERS
            </div>
            {topPlayers.home.slice(0, isSocial ? 3 : 5).map((p) => (
              <div
                key={p.playerId}
                style={{
                  fontSize: isSocial ? "11px" : "13px",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "6px",
                }}
              >
                <span style={{ color: "#888", fontSize: isSocial ? "10px" : "12px" }}>
                  {formatPlayerLine(p)}
                </span>
                <span style={{ fontWeight: 700, color: "#e8e6e3" }}>
                  {p.playerName}
                  {p.playerNumber ? ` #${p.playerNumber}` : ""}
                </span>
                {mvp && mvp.playerId === p.playerId && (
                  <span style={{ color: "#fbbf24", fontSize: isSocial ? "12px" : "14px" }}>★</span>
                )}
              </div>
            ))}
            {topPlayers.home.length === 0 && (
              <div style={{ fontSize: isSocial ? "11px" : "13px", color: "#555" }}>—</div>
            )}
          </div>
        </div>

        {/* Headline + WP Bar + Footer */}
        <div
          style={{
            padding: isSocial ? "12px 40px 16px" : "16px 48px 24px",
            backgroundColor: "#1a1a22",
            borderTop: "1px solid #2a2a35",
          }}
        >
          {/* Headline */}
          <p
            style={{
              fontSize: isSocial ? "14px" : "18px",
              fontWeight: 600,
              color: "#e8e6e3",
              marginBottom: isSocial ? "10px" : "14px",
              fontStyle: "italic",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            &ldquo;{headline}&rdquo;
          </p>

          {/* WP horizontal bar — only for non-ties */}
          {!isTie && wpMiniData.length >= 2 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: isSocial ? "10px" : "14px",
                marginBottom: isSocial ? "10px" : "14px",
              }}
            >
              {/* Bar track */}
              <div
                style={{
                  flex: 1,
                  height: isSocial ? "6px" : "8px",
                  backgroundColor: "#2a2a35",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${wpPct}%`,
                    height: "100%",
                    backgroundColor: winnerTeam.primaryColor,
                    borderRadius: "3px",
                  }}
                />
              </div>
              {/* WP label */}
              <span
                style={{
                  fontSize: isSocial ? "11px" : "13px",
                  fontWeight: 700,
                  color: winnerTeam.primaryColor,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {wpPct}% WP — {winnerTeam.abbreviation}
              </span>
            </div>
          )}

          {/* Branding */}
          <p
            style={{
              fontSize: isSocial ? "10px" : "12px",
              color: "#555",
              letterSpacing: "0.1em",
            }}
          >
            Made with FDF Companion App
          </p>
        </div>
      </div>
    );
  },
);
