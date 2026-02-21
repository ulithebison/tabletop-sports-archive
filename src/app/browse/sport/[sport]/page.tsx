import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGames } from "@/lib/queries";
import { getSportColor } from "@/lib/utils";
import { GameCard } from "@/components/games/GameCard";
import { Pagination } from "@/components/games/Pagination";
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
  return {
    title: sportName,
    description: `Browse all tabletop games for ${sportName} — board games, dice games, card games, and more.`,
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

  const { data: games, count, perPage, totalPages } = await getGames({
    sport,
    page,
    sort: "name",
  });

  // If the sport slug resolves to zero games and it's page 1, treat as not found
  if (games.length === 0 && page === 1 && count === 0) {
    notFound();
  }

  const sportColor = getSportColor(sport);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-base)" }}>
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

      {/* Games grid */}
      <div className="max-w-[1200px] mx-auto px-5 py-10">
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
