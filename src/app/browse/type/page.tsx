import Link from "next/link";
import type { Metadata } from "next";
import { getTypes } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Browse by Type",
  description:
    "Browse the Tabletop Sports Games Archive by game type — board games, dice games, card games, simulation games, and more.",
};

export const dynamic = "force-dynamic";

// A fixed palette of accent colours for type cards, cycling through them
const TYPE_COLORS = [
  "var(--raw-gold-450)",
  "var(--raw-amber-400)",
  "var(--raw-red-400)",
  "var(--raw-blue-400)",
  "var(--raw-green-400)",
  "var(--raw-amber-300)",
  "var(--raw-gold-300)",
  "var(--raw-blue-300)",
];

function getTypeColor(index: number): string {
  return TYPE_COLORS[index % TYPE_COLORS.length];
}

export default async function BrowseByTypePage() {
  const types = await getTypes();

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
            <span style={{ color: "var(--color-text-muted)" }}>Browse by Type</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="accent-rule" />
            <span className="section-label">Browse</span>
          </div>
          <h1
            className="font-heading font-bold text-4xl uppercase tracking-wide"
            style={{ color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}
          >
            Browse by Type
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
            <span
              className="font-mono"
              style={{ color: "var(--color-text-accent)" }}
            >
              {types.length}
            </span>{" "}
            game types in the archive
          </p>
        </div>
      </div>

      {/* Type grid */}
      <div className="max-w-[1200px] mx-auto px-5 py-10">
        {types.length === 0 ? (
          <div className="py-24 text-center">
            <p
              className="font-heading text-xl font-bold mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              No game types found
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>
              The archive is being populated. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {types.map(({ type, count }, index) => {
              const color = getTypeColor(index);
              return (
                <Link
                  key={type}
                  href={`/browse/type/${encodeURIComponent(type)}`}
                  className="group block"
                >
                  <div
                    className="pb-card h-full flex flex-col p-5 gap-3"
                    style={{ borderTopColor: color, borderTopWidth: "2px" }}
                  >
                    {/* Icon placeholder dot */}
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
                    >
                      <div
                        className="w-3 h-3 rounded"
                        style={{ background: color, opacity: 0.8 }}
                      />
                    </div>

                    {/* Type name */}
                    <div className="flex-1 flex flex-col justify-between gap-2">
                      <h2
                        className="font-heading font-bold text-base uppercase tracking-wide leading-tight group-hover:text-gold-400 transition-colors"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {type}
                      </h2>

                      {/* Count badge */}
                      <div>
                        <span
                          className="inline-flex items-center h-5 px-2 rounded font-mono text-xs"
                          style={{
                            background: "rgba(212,168,67,0.10)",
                            border: "1px solid rgba(212,168,67,0.28)",
                            color: "var(--raw-gold-300)",
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
