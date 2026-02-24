"use client";

import type { QuarterScore, GameClock } from "@/lib/fdf/types";
import type { FdfTeam } from "@/lib/fdf/types";

interface ScoreboardProps {
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
  homeScore: QuarterScore;
  awayScore: QuarterScore;
  clock: GameClock;
  possession: "home" | "away";
}

export function Scoreboard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  clock,
  possession,
}: ScoreboardProps) {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const hasOT = homeScore.ot > 0 || awayScore.ot > 0 || clock.quarter === 5;

  const getQuarterScore = (score: QuarterScore, q: number) => {
    switch (q) {
      case 0: return score.q1;
      case 1: return score.q2;
      case 2: return score.q3;
      case 3: return score.q4;
      case 4: return score.ot;
      default: return 0;
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: "var(--fdf-scoreboard-bg)", border: "1px solid var(--fdf-border)" }}
    >
      <table className="w-full text-center font-fdf-mono">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 text-xs" style={{ color: "var(--fdf-text-muted)" }}>TEAM</th>
            {quarters.map((q, i) => (
              <th
                key={q}
                className="px-2 py-2 text-xs w-10"
                style={{
                  color: clock.quarter === i + 1 ? "var(--fdf-scoreboard-text)" : "var(--fdf-text-muted)",
                }}
              >
                {q}
              </th>
            ))}
            {hasOT && (
              <th className="px-2 py-2 text-xs w-10" style={{ color: clock.quarter === 5 ? "var(--fdf-scoreboard-text)" : "var(--fdf-text-muted)" }}>
                OT
              </th>
            )}
            <th className="px-3 py-2 text-xs w-14" style={{ color: "var(--fdf-scoreboard-text)" }}>
              TOTAL
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Away team row */}
          <tr style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <td className="text-left px-3 py-2">
              <div className="flex items-center gap-2">
                {possession === "away" && (
                  <span className="text-xs" style={{ color: "var(--fdf-scoreboard-text)" }}>&#9654;</span>
                )}
                <span
                  className="text-sm font-bold"
                  style={{ color: awayTeam.primaryColor || "var(--fdf-text-primary)" }}
                >
                  {awayTeam.abbreviation}
                </span>
              </div>
            </td>
            {quarters.map((_, i) => (
              <td key={i} className="px-2 py-2 text-sm" style={{ color: "var(--fdf-scoreboard-text)" }}>
                {getQuarterScore(awayScore, i) || (clock.quarter > i + 1 ? "0" : "-")}
              </td>
            ))}
            {hasOT && (
              <td className="px-2 py-2 text-sm" style={{ color: "var(--fdf-scoreboard-text)" }}>
                {awayScore.ot || (clock.quarter > 5 ? "0" : "-")}
              </td>
            )}
            <td className="px-3 py-2 text-lg font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>
              {awayScore.total}
            </td>
          </tr>
          {/* Home team row */}
          <tr style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <td className="text-left px-3 py-2">
              <div className="flex items-center gap-2">
                {possession === "home" && (
                  <span className="text-xs" style={{ color: "var(--fdf-scoreboard-text)" }}>&#9654;</span>
                )}
                <span
                  className="text-sm font-bold"
                  style={{ color: homeTeam.primaryColor || "var(--fdf-text-primary)" }}
                >
                  {homeTeam.abbreviation}
                </span>
              </div>
            </td>
            {quarters.map((_, i) => (
              <td key={i} className="px-2 py-2 text-sm" style={{ color: "var(--fdf-scoreboard-text)" }}>
                {getQuarterScore(homeScore, i) || (clock.quarter > i + 1 ? "0" : "-")}
              </td>
            ))}
            {hasOT && (
              <td className="px-2 py-2 text-sm" style={{ color: "var(--fdf-scoreboard-text)" }}>
                {homeScore.ot || (clock.quarter > 5 ? "0" : "-")}
              </td>
            )}
            <td className="px-3 py-2 text-lg font-bold" style={{ color: "var(--fdf-scoreboard-text)" }}>
              {homeScore.total}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
