import Link from "next/link";
import type { Metadata } from "next";
import { getDesigners } from "@/lib/queries";
import { DesignerDirectory } from "@/components/designers/DesignerDirectory";

export const metadata: Metadata = {
  title: "Browse by Designer",
  description:
    "Browse the Tabletop Sports Games Archive by game designer. Discover prolific designers and explore their games.",
};

export const dynamic = "force-dynamic";

export default async function DesignersPage() {
  const designers = await getDesigners();

  // Top 20 designers by game count
  const topDesigners = [...designers]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

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
        <div className="h-1 w-full" style={{ background: "var(--raw-gold-450)" }} />

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
            <span style={{ color: "var(--color-text-muted)" }}>Designers</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="accent-rule" />
            <span className="section-label">Browse</span>
          </div>
          <h1
            className="font-heading font-bold text-4xl uppercase tracking-wide"
            style={{
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Browse by Designer
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
            <span
              className="font-mono"
              style={{ color: "var(--color-text-accent)" }}
            >
              {designers.length.toLocaleString()}
            </span>{" "}
            designers in the archive
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-5 py-10">
        {/* Top 20 designers */}
        {topDesigners.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="accent-rule" />
              <h2
                className="font-heading font-bold text-xl uppercase tracking-wide"
                style={{ color: "var(--color-text-primary)" }}
              >
                Top Designers
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {topDesigners.map(({ designer, count }, i) => (
                <Link
                  key={designer}
                  href={`/designers/${encodeURIComponent(designer)}`}
                  className="group block"
                >
                  <div
                    className="pb-card h-full flex flex-col p-5 gap-3"
                    style={{
                      borderTopColor: "var(--raw-gold-450)",
                      borderTopWidth: "2px",
                    }}
                  >
                    {/* Rank + initial */}
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-xs"
                        style={{ color: "var(--color-text-faint)" }}
                      >
                        #{i + 1}
                      </span>
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 font-heading font-bold text-sm"
                        style={{
                          background: "rgba(212,168,67,0.12)",
                          color: "var(--raw-gold-450)",
                        }}
                      >
                        {designer.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between gap-2">
                      <h3
                        className="font-heading font-bold text-sm leading-tight group-hover:text-gold-400 transition-colors line-clamp-2"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {designer}
                      </h3>
                      <div>
                        <span
                          className="inline-flex items-center h-5 px-2 rounded font-mono text-xs"
                          style={{
                            background: "rgba(212,168,67,0.10)",
                            border: "1px solid rgba(212,168,67,0.28)",
                            color: "var(--raw-gold-450)",
                            fontSize: "0.7rem",
                          }}
                        >
                          {count.toLocaleString()} {count === 1 ? "game" : "games"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Full A-Z directory */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="accent-rule" />
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide"
              style={{ color: "var(--color-text-primary)" }}
            >
              All Designers
            </h2>
          </div>
          <DesignerDirectory designers={designers} />
        </section>
      </div>
    </div>
  );
}
