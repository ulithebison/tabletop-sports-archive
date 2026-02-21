import Link from "next/link";
import type { Metadata } from "next";
import { getTopGames } from "@/lib/queries";
import { GameCard } from "@/components/games/GameCard";
import { TrendingUp } from "lucide-react";
import type { Game } from "@/lib/types";

export const metadata: Metadata = {
  title: "Most Popular",
  description:
    "The most-viewed tabletop sports games in the archive — board games, dice games, card games, and more.",
};

export const dynamic = "force-dynamic";

export default async function PopularPage() {
  const games = await getTopGames(48);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-base)" }}>
      {/* Page header */}
      <div
        style={{
          background: "linear-gradient(180deg, var(--raw-ink-800) 0%, var(--raw-ink-950) 100%)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        {/* Gold accent line */}
        <div
          className="h-1 w-full"
          style={{ background: "var(--raw-gold-450)" }}
        />

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
            <span style={{ color: "var(--color-text-muted)" }}>
              Most Popular
            </span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="accent-rule" />
            <span className="section-label">Trending Now</span>
          </div>

          <div className="flex items-start gap-4">
            <div>
              <h1
                className="font-heading font-bold text-4xl uppercase tracking-wide"
                style={{
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                Most Popular
              </h1>
              <p
                className="text-sm mt-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                The most-viewed games in the archive, ranked by page visits
              </p>
            </div>

            <div
              className="hidden sm:flex w-12 h-12 rounded-md items-center justify-center flex-shrink-0 mt-1"
              style={{ background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.2)" }}
            >
              <TrendingUp size={22} style={{ color: "var(--raw-gold-450)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Games grid */}
      <div className="max-w-[1200px] mx-auto px-5 py-10">
        {games.length === 0 ? (
          <div className="py-24 text-center">
            <TrendingUp
              size={48}
              className="mx-auto mb-4"
              style={{ color: "var(--color-text-faint)", opacity: 0.4 }}
            />
            <p
              className="font-heading text-xl font-bold mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              No view data yet
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-faint)" }}>
              Start browsing games and the most popular ones will appear here.
            </p>
            <Link
              href="/games"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-heading font-semibold text-sm uppercase tracking-wider"
              style={{
                background: "var(--raw-gold-450)",
                color: "var(--raw-black)",
              }}
            >
              Browse All Games
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <span className="accent-rule" />
              <h2
                className="font-heading font-bold text-sm uppercase tracking-widest"
                style={{ color: "var(--color-text-accent)" }}
              >
                Top {games.length} Games
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {games.map((game: Game & { view_count: number }) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>

            <div className="mt-12 pt-8 text-center" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>
                Ranked by total page views.{" "}
                <Link
                  href="/games"
                  className="transition-colors"
                  style={{ color: "var(--color-text-link)" }}
                >
                  Browse the full archive
                </Link>{" "}
                to discover more games.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
