import type { Metadata } from "next";
import {
  getGameCount,
  getSports,
  getTypes,
  getGamesByDecade,
  getComplexityDistribution,
  getTopPublishers,
  getPlayerCountDistribution,
  getYearRange,
} from "@/lib/queries";
import { getSportColor } from "@/lib/utils";
import { BarChart3, Gamepad2, Calendar, Users } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Stats & Insights — Tabletop Sports Games Archive",
  description:
    "Explore statistics and infographics across 6,800+ tabletop sports games — by decade, sport, complexity, publisher, and more.",
};

function BarChart({
  data,
  color,
  getColor,
}: {
  data: { label: string; value: number }[];
  color?: string;
  getColor?: (label: string) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-2">
      {data.map(({ label, value }) => {
        const barColor = getColor ? getColor(label) : color ?? "var(--raw-gold-450)";
        return (
          <div key={label} className="flex items-center gap-3">
            <span
              className="text-xs font-heading uppercase tracking-wide flex-shrink-0 text-right"
              style={{ color: "var(--color-text-secondary)", width: 120 }}
            >
              {label}
            </span>
            <div className="flex-1 h-6 rounded-sm overflow-hidden" style={{ background: "var(--color-bg-muted)" }}>
              <div
                className="h-full rounded-sm transition-all"
                style={{
                  width: `${(value / max) * 100}%`,
                  background: barColor,
                  minWidth: value > 0 ? 4 : 0,
                }}
              />
            </div>
            <span
              className="font-mono text-xs tabular-nums flex-shrink-0"
              style={{ color: "var(--color-text-primary)", width: 48, textAlign: "right" }}
            >
              {value.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default async function StatsPage() {
  const [
    totalGames,
    sports,
    types,
    byDecade,
    complexity,
    publishers,
    playerCounts,
    yearRange,
  ] = await Promise.all([
    getGameCount(),
    getSports(),
    getTypes(),
    getGamesByDecade(),
    getComplexityDistribution(),
    getTopPublishers(15),
    getPlayerCountDistribution(),
    getYearRange(),
  ]);

  const totalSports = sports.length;
  const totalTypes = types.length;
  const yearRangeStr =
    yearRange.min && yearRange.max ? `${yearRange.min}–${yearRange.max}` : "—";

  const complexityColors: Record<string, string> = {
    Simple: "#4d8464",
    Medium: "#d4a843",
    Complex: "#d4531a",
    Expert: "#c44b3b",
  };

  // Top 12 sports by count
  const topSports = [...sports].sort((a, b) => b.count - a.count).slice(0, 12);

  // Top 10 types by count
  const topTypes = types.slice(0, 10);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-base)" }}>
      {/* Hero */}
      <section
        className="border-b"
        style={{
          background:
            "linear-gradient(180deg, #18150f 0%, #0d0b08 60%, #0d0b08 100%)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-5 py-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="accent-rule" />
            <span className="section-label">The Numbers</span>
          </div>
          <h1
            className="font-heading font-bold text-4xl md:text-5xl uppercase tracking-tight mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            Stats & Insights
          </h1>
          <p
            className="text-lg max-w-2xl"
            style={{
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-lora)",
            }}
          >
            A data-driven look at the world of tabletop sports games — decades
            of design, thousands of titles, and the publishers who made them.
          </p>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 py-12 flex flex-col gap-14">
        {/* Hero stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Gamepad2,
              value: totalGames.toLocaleString(),
              label: "Total Games",
              color: "var(--raw-gold-450)",
            },
            {
              icon: BarChart3,
              value: String(totalSports),
              label: "Sports Covered",
              color: "var(--raw-amber-400)",
            },
            {
              icon: Users,
              value: String(totalTypes),
              label: "Game Types",
              color: "var(--raw-red-400)",
            },
            {
              icon: Calendar,
              value: yearRangeStr,
              label: "Year Range",
              color: "var(--raw-blue-400)",
            },
          ].map(({ icon: Icon, value, label, color }) => (
            <div
              key={label}
              className="pb-card p-5 flex flex-col items-center text-center gap-2"
              style={{ borderTopColor: color, borderTopWidth: "2px" }}
            >
              <div
                className="w-10 h-10 rounded flex items-center justify-center mb-1"
                style={{ background: `${color}22` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <span
                className="font-mono font-bold text-2xl md:text-3xl tabular-nums"
                style={{ color: "var(--color-text-primary)" }}
              >
                {value}
              </span>
              <span
                className="text-xs font-heading uppercase tracking-widest"
                style={{ color: "var(--color-text-muted)" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Games by Decade */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="accent-rule" />
            <h2
              className="font-heading font-bold text-xl uppercase tracking-widest"
              style={{ color: "var(--color-text-accent)" }}
            >
              Games by Decade
            </h2>
          </div>
          <BarChart
            data={byDecade.map((d) => ({ label: d.decade, value: d.count }))}
            color="var(--raw-gold-450)"
          />
        </section>

        {/* Top Sports */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="accent-rule" />
            <h2
              className="font-heading font-bold text-xl uppercase tracking-widest"
              style={{ color: "var(--color-text-accent)" }}
            >
              Top Sports
            </h2>
          </div>
          <BarChart
            data={topSports.map((s) => ({ label: s.sport, value: s.count }))}
            getColor={(label) => getSportColor(label)}
          />
        </section>

        {/* Game Types */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="accent-rule" />
            <h2
              className="font-heading font-bold text-xl uppercase tracking-widest"
              style={{ color: "var(--color-text-accent)" }}
            >
              Game Types
            </h2>
          </div>
          <BarChart
            data={topTypes.map((t) => ({ label: t.type, value: t.count }))}
            color="var(--raw-amber-400)"
          />
        </section>

        {/* Complexity Breakdown */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="accent-rule" />
            <h2
              className="font-heading font-bold text-xl uppercase tracking-widest"
              style={{ color: "var(--color-text-accent)" }}
            >
              Complexity Breakdown
            </h2>
          </div>
          <BarChart
            data={complexity.map((c) => ({
              label: c.complexity,
              value: c.count,
            }))}
            getColor={(label) => complexityColors[label] ?? "var(--raw-gold-450)"}
          />
        </section>

        {/* Top Publishers */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="accent-rule" />
            <h2
              className="font-heading font-bold text-xl uppercase tracking-widest"
              style={{ color: "var(--color-text-accent)" }}
            >
              Top Publishers
            </h2>
          </div>
          <BarChart
            data={publishers.map((p) => ({
              label: p.publisher,
              value: p.count,
            }))}
            color="var(--raw-gold-450)"
          />
        </section>

        {/* Player Count */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="accent-rule" />
            <h2
              className="font-heading font-bold text-xl uppercase tracking-widest"
              style={{ color: "var(--color-text-accent)" }}
            >
              Player Count Support
            </h2>
          </div>
          <p
            className="text-sm mb-4"
            style={{
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-lora)",
            }}
          >
            How many games support each player count range (games can appear in
            multiple categories).
          </p>
          <BarChart
            data={playerCounts.map((p) => ({
              label: p.category,
              value: p.count,
            }))}
            color="var(--raw-blue-400)"
          />
        </section>
      </div>
    </div>
  );
}
