import Link from "next/link";
import type { Metadata } from "next";
import { getSports } from "@/lib/queries";
import { getSportColor } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Browse by Sport",
  description:
    "Browse the Tabletop Sports Games Archive by sport. Find board games, dice games, and card games for every sport.",
};

export const dynamic = "force-dynamic";

export default async function BrowseBySportPage() {
  const sports = await getSports();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-base)" }}>
      {/* Page header */}
      <div
        style={{
          background: "linear-gradient(180deg, var(--raw-ink-800) 0%, var(--raw-ink-950) 100%)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
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
            <span style={{ color: "var(--color-text-muted)" }}>Browse by Sport</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="accent-rule" />
            <span className="section-label">Browse</span>
          </div>
          <h1
            className="font-heading font-bold text-4xl uppercase tracking-wide"
            style={{ color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}
          >
            Browse by Sport
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
            <span
              className="font-mono"
              style={{ color: "var(--color-text-accent)" }}
            >
              {sports.length}
            </span>{" "}
            sports in the archive
          </p>
        </div>
      </div>

      {/* Sport grid */}
      <div className="max-w-[1200px] mx-auto px-5 py-10">
        {sports.length === 0 ? (
          <div className="py-24 text-center">
            <p
              className="font-heading text-xl font-bold mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              No sports found
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>
              The archive is being populated. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sports.map(({ sport, count }) => {
              const color = getSportColor(sport);
              return (
                <Link
                  key={sport}
                  href={`/browse/sport/${encodeURIComponent(sport)}`}
                  className="group block"
                >
                  <div
                    className="pb-card h-full flex flex-col p-5 gap-3"
                    style={{ borderTopColor: color, borderTopWidth: "2px" }}
                  >
                    {/* Color accent bar */}
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}22` }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: color }}
                      />
                    </div>

                    {/* Sport name */}
                    <div className="flex-1 flex flex-col justify-between gap-2">
                      <h2
                        className="font-heading font-bold text-base uppercase tracking-wide leading-tight group-hover:text-gold-400 transition-colors"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {sport}
                      </h2>

                      {/* Count badge */}
                      <div>
                        <span
                          className="inline-flex items-center h-5 px-2 rounded font-mono text-xs"
                          style={{
                            background: `${color}1a`,
                            border: `1px solid ${color}44`,
                            color: color,
                            fontSize: "0.7rem",
                          }}
                        >
                          {count.toLocaleString()}{" "}
                          {count === 1 ? "game" : "games"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
