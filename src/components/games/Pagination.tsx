"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

export function Pagination({ page, totalPages, totalCount, perPage }: PaginationProps) {
  const searchParams = useSearchParams();

  function buildHref(targetPage: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    return `?${params.toString()}`;
  }

  if (totalPages <= 1) return null;

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalCount);

  // Build page number array (show up to 7 around current)
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btnBase =
    "w-9 h-9 flex items-center justify-center rounded text-sm font-mono transition-colors";
  const btnDefault =
    "bg-ink-800 border border-gold-450/20 text-ink-200 hover:border-gold-450/50 hover:text-ink-50";
  const btnActive = "bg-gold-450 text-black font-bold border border-gold-450";
  const btnDisabled = "opacity-30 cursor-not-allowed bg-ink-800 border border-gold-450/10 text-ink-400";

  return (
    <div className="flex flex-col items-center gap-4 mt-10">
      {/* Results count */}
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Showing{" "}
        <span style={{ color: "var(--color-text-primary)" }} className="font-mono">
          {start.toLocaleString()}–{end.toLocaleString()}
        </span>{" "}
        of{" "}
        <span style={{ color: "var(--color-text-primary)" }} className="font-mono">
          {totalCount.toLocaleString()}
        </span>{" "}
        games
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        {page > 1 ? (
          <Link href={buildHref(page - 1)} className={cn(btnBase, btnDefault)} aria-label="Previous">
            <ChevronLeft size={16} />
          </Link>
        ) : (
          <span className={cn(btnBase, btnDisabled)} aria-disabled>
            <ChevronLeft size={16} />
          </span>
        )}

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className={cn(btnBase, "text-ink-400 border-transparent bg-transparent")}
            >
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              className={cn(btnBase, p === page ? btnActive : btnDefault)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Link>
          )
        )}

        {/* Next */}
        {page < totalPages ? (
          <Link href={buildHref(page + 1)} className={cn(btnBase, btnDefault)} aria-label="Next">
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span className={cn(btnBase, btnDisabled)} aria-disabled>
            <ChevronRight size={16} />
          </span>
        )}
      </div>
    </div>
  );
}
