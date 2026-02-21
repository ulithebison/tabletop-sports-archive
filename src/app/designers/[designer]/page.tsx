import { Suspense, Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGames, getDesignerStats } from "@/lib/queries";
import { getSportColor } from "@/lib/utils";
import { GameCard } from "@/components/games/GameCard";
import { Pagination } from "@/components/games/Pagination";
import type { Game } from "@/lib/types";

interface DesignerPageProps {
  params: Promise<{ designer: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: DesignerPageProps): Promise<Metadata> {
  const { designer } = await params;
  const name = decodeURIComponent(designer);
  return {
    title: `${name} — Designer`,
    description: `Browse all tabletop sports games designed by ${name}.`,
  };
}

export const dynamic = "force-dynamic";

export default async function DesignerDetailPage({
  params,
  searchParams,
}: DesignerPageProps) {
  const { designer: rawDesigner } = await params;
  const { page: pageParam } = await searchParams;

  const name = decodeURIComponent(rawDesigner);
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  const [{ data: games, count, perPage, totalPages }, stats] =
    await Promise.all([
      getGames({ designer: name, page, sort: "name" }),
      getDesignerStats(name),
    ]);

  // If no games on page 1, treat as not found
  if (games.length === 0 && page === 1 && count === 0) {
    notFound();
  }

  const yearRange =
    stats.yearMin && stats.yearMax
      ? stats.yearMin === stats.yearMax
        ? String(stats.yearMin)
        : `${stats.yearMin}–${stats.yearMax}`
      : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-base)" }}>
      {/* Page header */}
      <div
        style={{
          background:
            "linear-gradient(180deg, var(--raw-ink-800) 0%, var(--raw-ink-950) 100%)",
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
            <Link
              href="/designers"
              className="hover:text-gold-400 transition-colors"
            >
              Designers
            </Link>
            <span>/</span>
            <span style={{ color: "var(--color-text-muted)" }}>{name}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="accent-rule" />
            <span className="section-label">Designer</span>
          </div>

          <h1
            className="font-heading font-bold text-4xl uppercase tracking-wide"
            style={{
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {name}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
            <span
              className="font-mono"
              style={{ color: "var(--raw-gold-450)" }}
            >
              {count.toLocaleString()}
            </span>{" "}
            {count === 1 ? "game" : "games"} in the archive
          </p>

          {/* Stats bar */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-md mt-6"
            style={{
              background: "var(--color-bg-muted)",
              border: "1px solid var(--color-border-faint)",
            }}
          >
            {/* Total Games */}
            <div className="text-center">
              <p
                className="uppercase tracking-widest mb-1"
                style={{
                  color: "var(--color-text-faint)",
                  fontSize: "0.65rem",
                }}
              >
                Total Games
              </p>
              <p
                className="font-mono font-bold text-lg"
                style={{ color: "var(--color-text-primary)" }}
              >
                {stats.totalGames}
              </p>
            </div>

            {/* Year Range */}
            <div className="text-center">
              <p
                className="uppercase tracking-widest mb-1"
                style={{
                  color: "var(--color-text-faint)",
                  fontSize: "0.65rem",
                }}
              >
                Years Active
              </p>
              <p
                className="font-mono font-bold text-lg"
                style={{ color: "var(--color-text-primary)" }}
              >
                {yearRange ?? "—"}
              </p>
            </div>

            {/* Top Sports */}
            <div className="text-center">
              <p
                className="uppercase tracking-widest mb-1"
                style={{
                  color: "var(--color-text-faint)",
                  fontSize: "0.65rem",
                }}
              >
                Top Sports
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {stats.topSports.length > 0 ? (
                  stats.topSports.map((s) => {
                    const c = getSportColor(s);
                    return (
                      <span key={s} className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ background: c }}
                        />
                        <span
                          className="text-xs font-heading"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {s}
                        </span>
                      </span>
                    );
                  })
                ) : (
                  <span
                    className="font-mono font-bold text-lg"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    —
                  </span>
                )}
              </div>
            </div>

            {/* Top Type */}
            <div className="text-center">
              <p
                className="uppercase tracking-widest mb-1"
                style={{
                  color: "var(--color-text-faint)",
                  fontSize: "0.65rem",
                }}
              >
                Top Type
              </p>
              <p
                className="font-mono font-bold text-lg"
                style={{ color: "var(--color-text-primary)" }}
              >
                {stats.topType ?? "—"}
              </p>
            </div>
          </div>
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
            <p
              className="text-sm mb-6"
              style={{ color: "var(--color-text-faint)" }}
            >
              No games on this page.
            </p>
            <Link
              href="/designers"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-heading font-semibold text-sm uppercase tracking-wider transition-all"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
                color: "var(--color-text-secondary)",
              }}
            >
              Back to Designers
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
