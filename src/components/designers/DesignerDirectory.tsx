"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

const PER_PAGE = 60;

interface DesignerDirectoryProps {
  designers: { designer: string; count: number }[];
}

export function DesignerDirectory({ designers }: DesignerDirectoryProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return designers;
    const q = search.toLowerCase();
    return designers.filter((d) => d.designer.toLowerCase().includes(q));
  }, [designers, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-6 max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-text-faint)" }}
        />
        <input
          type="text"
          placeholder="Search designers..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-md text-sm font-heading"
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-default)",
            color: "var(--color-text-primary)",
            outline: "none",
          }}
        />
      </div>

      {/* Result count */}
      <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        <span className="font-mono" style={{ color: "var(--color-text-accent)" }}>
          {filtered.length.toLocaleString()}
        </span>{" "}
        {filtered.length === 1 ? "designer" : "designers"}
        {search.trim() ? " found" : " in the archive"}
      </p>

      {/* Designer grid */}
      {paginated.length === 0 ? (
        <div className="py-16 text-center">
          <p
            className="font-heading text-lg font-bold mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            No designers found
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>
            Try a different search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {paginated.map(({ designer, count }) => (
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
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 font-heading font-bold text-sm"
                  style={{
                    background: "rgba(212,168,67,0.12)",
                    color: "var(--raw-gold-450)",
                  }}
                >
                  {designer.charAt(0).toUpperCase()}
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded text-sm font-heading uppercase tracking-wider transition-colors disabled:opacity-30"
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-secondary)",
            }}
          >
            Prev
          </button>
          <span className="text-sm font-mono" style={{ color: "var(--color-text-muted)" }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded text-sm font-heading uppercase tracking-wider transition-colors disabled:opacity-30"
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-secondary)",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
