"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import type { FdfTeam, WinProbabilitySnapshot, WPAnalytics } from "@/lib/fdf/types";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";

interface WinProbabilityChartProps {
  snapshots: WinProbabilitySnapshot[];
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
  analytics: WPAnalytics;
  isCollapsible?: boolean;
}

interface ChartDataPoint {
  drive: number;
  homeWP: number;
  quarter: number;
  homeScore: number;
  awayScore: number;
}

function WPTooltip({
  active,
  payload,
  homeTeam,
  awayTeam,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: "var(--fdf-bg-elevated)",
        border: "1px solid var(--fdf-border)",
        borderRadius: "6px",
        padding: "8px 12px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
      }}
    >
      <div style={{ color: "var(--fdf-text-muted)", marginBottom: "4px" }}>
        Q{data.quarter} &middot; Drive {data.drive}
      </div>
      <div style={{ color: "var(--fdf-text-primary)", marginBottom: "2px" }}>
        <span style={{ color: awayTeam.primaryColor }}>{awayTeam.abbreviation} {data.awayScore}</span>
        {" — "}
        <span style={{ color: homeTeam.primaryColor }}>{homeTeam.abbreviation} {data.homeScore}</span>
      </div>
      <div style={{ color: "var(--fdf-accent)" }}>
        {homeTeam.abbreviation} WP: {Math.round(data.homeWP * 100)}%
      </div>
    </div>
  );
}

export function WinProbabilityChart({
  snapshots,
  homeTeam,
  awayTeam,
  analytics,
  isCollapsible = false,
}: WinProbabilityChartProps) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(isCollapsible);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const chartData: ChartDataPoint[] = snapshots.map((s) => ({
    drive: s.afterDriveNumber,
    homeWP: s.homeWinProbability,
    quarter: s.quarter,
    homeScore: s.homeScore,
    awayScore: s.awayScore,
  }));

  // Find quarter boundaries for vertical reference lines
  const quarterBoundaries: number[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    if (snapshots[i].quarter !== snapshots[i - 1].quarter) {
      quarterBoundaries.push(snapshots[i].afterDriveNumber);
    }
  }

  const chartHeight = isCollapsible ? 200 : 260;
  const gradientId = `wpGradient-${homeTeam.id}-${awayTeam.id}`;

  return (
    <div
      className="rounded-lg"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--fdf-border)" }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: "var(--fdf-accent)" }} />
          <h3
            className="text-xs font-bold font-fdf-mono uppercase tracking-wider"
            style={{ color: "var(--fdf-accent)" }}
          >
            Win Probability
          </h3>
        </div>
        {isCollapsible && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-fdf-mono"
            style={{ color: "var(--fdf-text-muted)" }}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            {collapsed ? "Show" : "Hide"}
          </button>
        )}
      </div>

      {/* Chart */}
      {!collapsed && (
        <div className="px-4 pb-4">
          {/* Team labels */}
          <div className="flex justify-between mb-1">
            <span
              className="text-[10px] font-fdf-mono font-bold uppercase"
              style={{ color: homeTeam.primaryColor }}
            >
              {homeTeam.abbreviation} 100%
            </span>
            <span
              className="text-[10px] font-fdf-mono font-bold uppercase"
              style={{ color: awayTeam.primaryColor }}
            >
              {awayTeam.abbreviation} 100%
            </span>
          </div>

          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={homeTeam.primaryColor} />
                  <stop offset="50%" stopColor={homeTeam.primaryColor} />
                  <stop offset="50%" stopColor={awayTeam.primaryColor} />
                  <stop offset="100%" stopColor={awayTeam.primaryColor} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="drive"
                tick={{ fontSize: 10, fill: "var(--fdf-text-muted)", fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={{ stroke: "var(--fdf-border)" }}
                tickLine={false}
                label={{
                  value: "Drive",
                  position: "insideBottom",
                  offset: -2,
                  style: { fontSize: 10, fill: "var(--fdf-text-muted)", fontFamily: "'JetBrains Mono', monospace" },
                }}
              />
              <YAxis
                domain={[0, 1]}
                ticks={[0, 0.25, 0.5, 0.75, 1]}
                tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                tick={{ fontSize: 10, fill: "var(--fdf-text-muted)", fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={{ stroke: "var(--fdf-border)" }}
                tickLine={false}
                width={36}
              />

              {/* 50% reference line */}
              <ReferenceLine
                y={0.5}
                stroke="var(--fdf-text-muted)"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />

              {/* Quarter boundaries */}
              {quarterBoundaries.map((drive) => (
                <ReferenceLine
                  key={`q-${drive}`}
                  x={drive}
                  stroke="var(--fdf-text-muted)"
                  strokeDasharray="2 4"
                  strokeOpacity={0.3}
                  label={{
                    value: `Q${snapshots.find((s) => s.afterDriveNumber === drive)?.quarter || ""}`,
                    position: "top",
                    style: { fontSize: 9, fill: "var(--fdf-text-muted)", fontFamily: "'JetBrains Mono', monospace" },
                  }}
                />
              ))}

              <Tooltip
                content={
                  <WPTooltip homeTeam={homeTeam} awayTeam={awayTeam} />
                }
              />

              <Line
                type="monotone"
                dataKey="homeWP"
                stroke={`url(#${gradientId})`}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: "var(--fdf-accent)",
                  strokeWidth: 2,
                  fill: "var(--fdf-bg-card)",
                }}
              />

              {/* Key play marker */}
              {analytics.keyPlay && (
                <ReferenceDot
                  x={analytics.keyPlay.snapshot.afterDriveNumber}
                  y={analytics.keyPlay.snapshot.homeWinProbability}
                  r={6}
                  fill="var(--fdf-accent)"
                  stroke="var(--fdf-bg-card)"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>

          {/* Key Play annotation */}
          {analytics.keyPlay && (
            <div className="mt-2 text-center">
              <span
                className="text-[10px] font-fdf-mono"
                style={{ color: "var(--fdf-text-muted)" }}
              >
                &#9733; Key Play: Drive {analytics.keyPlay.snapshot.afterDriveNumber} &middot;{" "}
                {Math.round(analytics.keyPlay.delta * 100)}% WP swing
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
