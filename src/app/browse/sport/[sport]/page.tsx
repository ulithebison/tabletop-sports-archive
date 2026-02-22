import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGames, getSportStats } from "@/lib/queries";
import { getSportColor, complexityClass } from "@/lib/utils";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { GameCard } from "@/components/games/GameCard";
import { Pagination } from "@/components/games/Pagination";
import { Trophy, Calendar, BarChart3, Building2 } from "lucide-react";
import type { Game } from "@/lib/types";

interface SportGamesPageProps {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: SportGamesPageProps): Promise<Metadata> {
  const { sport } = await params;
  const sportName = decodeURIComponent(sport);
  const desc = `Browse all ${sportName} tabletop games — board games, dice games, card games, and simulations. Discover top-rated titles, stats, and more.`;
  return {
    title: `${sportName} Tabletop Games`,
    description: desc,
    openGraph: {
      title: `${sportName} Tabletop Games — ${SITE_NAME}`,
      description: desc,
      url: `${SITE_URL}/browse/sport/${encodeURIComponent(sportName)}`,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function SportGamesPage({
  params,
  searchParams,
}: SportGamesPageProps) {
  const { sport: rawSport } = await params;
  const { page: pageParam } = await searchParams;

  const sport = decodeURIComponent(rawSport);
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  const [
    { data: games, count, perPage, totalPages },
    stats,
  ] = await Promise.all([
    getGames({ sport, page, sort: "name" }),
    getSportStats(sport),
  ]);

  // If the sport slug resolves to zero games and it's page 1, treat as not found
  if (games.length === 0 && page === 1 && count === 0) {
    notFound();
  }

  const sportColor = getSportColor(sport);

  // JSON-LD BreadcrumbList
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Sports",
        item: `${SITE_URL}/browse/sport`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: sport,
        item: `${SITE_URL}/browse/sport/${encodeURIComponent(sport)}`,
      },
    ],
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-base)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Page header */}
      <div
        style={{
          background: "linear-gradient(180deg, var(--raw-ink-800) 0%, var(--raw-ink-950) 100%)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        {/* Sport color accent line */}
        <div className="h-1 w-full" style={{ background: sportColor }} />

        <div className="max-w-[1200px] mx-auto px-5 py-10">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-2 text-xs mb-6"
            style={{ color: "var(--color-text-faint)" }}
          >
            <Link href="/" className="hover:text-gold-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/browse/sport"
              className="hover:text-gold-400 transition-colors"
            >
              Sports
            </Link>
            <span>/</span>
            <span style={{ color: "var(--color-text-muted)" }}>{sport}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="accent-rule" style={{ background: sportColor }} />
            <span className="section-label">Sport</span>
          </div>

          <h1
            className="font-heading font-bold text-4xl uppercase tracking-wide"
            style={{
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {sport}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
            <span
              className="font-mono"
              style={{ color: sportColor }}
            >
              {count.toLocaleString()}
            </span>{" "}
            {count === 1 ? "game" : "games"} in the archive
          </p>
        </div>
      </div>

      {/* Enriched content area */}
      <div className="max-w-[1200px] mx-auto px-5 py-10">
        {/* Stats bar */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10"
        >
          {[
            {
              label: "Total Games",
              value: stats.totalGames.toLocaleString(),
              icon: Trophy,
            },
            {
              label: "Earliest Year",
              value: stats.yearMin ? String(stats.yearMin) : "—",
              icon: Calendar,
            },
            {
              label: "Latest Year",
              value: stats.yearMax ? String(stats.yearMax) : "—",
              icon: Calendar,
            },
            {
              label: "Top Publisher",
              value: stats.topPublishers[0]?.name ?? "—",
              icon: Building2,
              sub: stats.topPublishers[0]
                ? `${stats.topPublishers[0].count} games`
                : undefined,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-md text-center"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              <stat.icon
                size={18}
                className="mx-auto mb-2"
                style={{ color: sportColor }}
              />
              <p
                className="text-2xs uppercase tracking-widest mb-1"
                style={{ color: "var(--color-text-faint)", fontSize: "0.65rem" }}
              >
                {stat.label}
              </p>
              <p
                className="font-mono font-bold text-lg truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {stat.value}
              </p>
              {stat.sub && (
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-faint)" }}>
                  {stat.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Description paragraph */}
        <div
          className="rounded-md p-6 mb-10"
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-subtle)",
            borderLeft: `3px solid ${sportColor}`,
          }}
        >
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-lora)" }}
          >
            {sport} has{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {stats.totalGames.toLocaleString()}
            </strong>{" "}
            tabletop games in the archive
            {stats.yearMin && stats.yearMax && stats.yearMin !== stats.yearMax
              ? `, spanning from ${stats.yearMin} to ${stats.yearMax}`
              : stats.yearMin
                ? `, dating back to ${stats.yearMin}`
                : ""}
            .{" "}
            {stats.topPublishers.length > 0 && (
              <>
                The most prolific publisher is{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {stats.topPublishers[0].name}
                </strong>{" "}
                with {stats.topPublishers[0].count} titles.{" "}
              </>
            )}
            Browse the full collection below or use the filters on the{" "}
            <Link href="/games" style={{ color: "var(--color-text-link)" }}>
              main games page
            </Link>{" "}
            for advanced search.
          </p>
        </div>

        {/* Complexity breakdown */}
        {stats.complexityDistribution.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap mb-8">
            <BarChart3
              size={14}
              style={{ color: "var(--color-text-faint)" }}
            />
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--color-text-faint)" }}
            >
              Complexity:
            </span>
            {stats.complexityDistribution.map((c) => (
              <span
                key={c.complexity}
                className={`text-xs px-2 py-0.5 rounded ${complexityClass(c.complexity)}`}
              >
                {c.complexity}{" "}
                <span className="font-mono opacity-70">({c.count})</span>
              </span>
            ))}
          </div>
        )}

        {/* Top Rated section */}
        {stats.topRated.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="accent-rule" style={{ background: sportColor }} />
              <h2
                className="font-heading font-bold text-xl uppercase tracking-wide"
                style={{ color: "var(--color-text-primary)" }}
              >
                Top Rated {sport} Games
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.topRated.map((game: Game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* All games header */}
        <div className="flex items-center gap-3 mb-5">
          <span className="accent-rule" style={{ background: sportColor }} />
          <h2
            className="font-heading font-bold text-xl uppercase tracking-wide"
            style={{ color: "var(--color-text-primary)" }}
          >
            All {sport} Games
          </h2>
        </div>

        {/* Games grid */}
        {games.length === 0 ? (
          <div className="py-24 text-center">
            <p
              className="font-heading text-xl font-bold mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              No games found
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-faint)" }}>
              There are no games listed for this sport yet.
            </p>
            <Link
              href="/browse/sport"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-heading font-semibold text-sm uppercase tracking-wider transition-all"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
                color: "var(--color-text-secondary)",
              }}
            >
              Back to Sports
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {games.map((game: Game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>

            <Suspense fallback={null}>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalCount={count}
                perPage={perPage}
              />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}
