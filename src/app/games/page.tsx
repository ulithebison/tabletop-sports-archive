import { Suspense } from "react";
import { getGames, getSports, getTypes } from "@/lib/queries";
import { GameCard } from "@/components/games/GameCard";
import { GameListItem } from "@/components/games/GameListItem";
import { GameFilters } from "@/components/games/GameFilters";
import { Pagination } from "@/components/games/Pagination";
import { Search, LayoutGrid, List, X } from "lucide-react";
import Link from "next/link";
import type { Game } from "@/lib/types";

export const dynamic = "force-dynamic";

const PLAYER_LABELS: Record<string, string> = {
  solo: "Solo (1 Player)",
  "2": "2 Players",
  "3-4": "3–4 Players",
  "5+": "5+ Players",
};

const PLAYTIME_LABELS: Record<string, string> = {
  quick: "< 30 min",
  short: "30–60 min",
  medium: "1–2 hours",
  long: "2+ hours",
};

interface SearchParams {
  sport?: string;
  type?: string;
  complexity?: string;
  source?: string;
  yearMin?: string;
  yearMax?: string;
  search?: string;
  sort?: string;
  page?: string;
  view?: string;
  players?: string;
  playtimeRange?: string;
}

interface GamesPageProps {
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const sport = params.sport;
  const search = params.search;
  return {
    title: sport
      ? `${sport} Games`
      : search
      ? `Search: "${search}"`
      : "All Games",
  };
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;

  const filters = {
    sport: params.sport,
    type: params.type,
    complexity: params.complexity,
    source: params.source,
    yearMin: params.yearMin ? Number(params.yearMin) : undefined,
    yearMax: params.yearMax ? Number(params.yearMax) : undefined,
    search: params.search,
    sort: (params.sort as "name" | "year_desc" | "views") || "name",
    page: params.page ? Number(params.page) : 1,
    players: params.players || undefined,
    playtimeRange: params.playtimeRange,
  };

  const viewMode = params.view === "list" ? "list" : "grid";

  const [{ data: games, count, page, perPage, totalPages }, sports, types] =
    await Promise.all([getGames(filters), getSports(), getTypes()]);

  // Build URL helpers for view toggle
  function viewHref(v: string) {
    const p = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, val]) => val !== undefined)
      ) as Record<string, string>
    );
    p.set("view", v);
    return `/games?${p.toString()}`;
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--color-bg-base)" }}
    >
      {/* Sidebar filters — desktop */}
      <div className="hidden lg:block w-[280px] flex-shrink-0 min-h-screen">
        <Suspense fallback={null}>
          <GameFilters sports={sports} types={types} />
        </Suspense>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="px-5 py-8 max-w-[1280px]">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1
                className="font-heading font-bold text-3xl uppercase tracking-wide"
                style={{ color: "var(--color-text-primary)" }}
              >
                {params.sport
                  ? params.sport
                  : params.search
                  ? `Search: "${params.search}"`
                  : "All Games"}
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                <span className="font-mono text-gold-300">{count.toLocaleString()}</span>{" "}
                {count === 1 ? "game" : "games"} found
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Search box (quick inline) */}
              <Suspense fallback={null}>
                <SearchBox defaultValue={params.search} params={params} />
              </Suspense>

              {/* View toggle */}
              <div className="flex items-center border rounded overflow-hidden" style={{ borderColor: "var(--color-border-subtle)" }}>
                <Link
                  href={viewHref("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-gold-450/10 text-gold-450" : "text-ink-300 hover:text-ink-50"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={16} />
                </Link>
                <Link
                  href={viewHref("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-gold-450/10 text-gold-450" : "text-ink-300 hover:text-ink-50"}`}
                  aria-label="List view"
                >
                  <List size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Active filters display */}
          {(params.sport || params.type || params.complexity || params.search ||
            params.yearMin || params.yearMax || params.players || params.playtimeRange) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {params.sport &&
                params.sport.split(",").filter(Boolean).map((s) => (
                  <FilterTagMulti
                    key={`sport-${s}`}
                    label={`Sport: ${s}`}
                    paramKey="sport"
                    removeValue={s}
                    currentValue={params.sport!}
                    params={params}
                  />
                ))}
              {params.type &&
                params.type.split(",").filter(Boolean).map((t) => (
                  <FilterTagMulti
                    key={`type-${t}`}
                    label={`Type: ${t}`}
                    paramKey="type"
                    removeValue={t}
                    currentValue={params.type!}
                    params={params}
                  />
                ))}
              {params.complexity && (
                <FilterTag label={`Complexity: ${params.complexity}`} removeKey="complexity" params={params} />
              )}
              {(params.yearMin || params.yearMax) && (
                <FilterTag
                  label={`Year: ${params.yearMin ?? "∞"}–${params.yearMax ?? "∞"}`}
                  removeKey="yearMin"
                  params={params}
                  extraRemoveKeys={["yearMax"]}
                />
              )}
              {params.players && (
                <FilterTag label={`Players: ${PLAYER_LABELS[params.players] ?? params.players}`} removeKey="players" params={params} />
              )}
              {params.playtimeRange && (
                <FilterTag
                  label={`Playtime: ${PLAYTIME_LABELS[params.playtimeRange] ?? params.playtimeRange}`}
                  removeKey="playtimeRange"
                  params={params}
                />
              )}
              {params.search && (
                <FilterTag label={`Search: "${params.search}"`} removeKey="search" params={params} />
              )}
              {/* Reset All Filters */}
              <Link
                href={`/games?${new URLSearchParams(
                  Object.fromEntries(
                    Object.entries(params)
                      .filter(([k, v]) => (k === "sort" || k === "view") && v !== undefined)
                  ) as Record<string, string>
                ).toString()}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-heading font-semibold uppercase tracking-wide transition-colors"
                style={{
                  background: "transparent",
                  border: "1px solid var(--raw-gold-450)",
                  color: "var(--raw-gold-450)",
                }}
              >
                <X size={12} />
                Reset All Filters
              </Link>
            </div>
          )}

          {/* Mobile filters (collapsed) */}
          <div className="lg:hidden mb-6">
            <details className="rounded-md overflow-hidden" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}>
              <summary className="px-4 py-3 cursor-pointer font-heading text-sm uppercase tracking-widest" style={{ color: "var(--color-text-accent)" }}>
                Filters &amp; Sort
              </summary>
              <div>
                <Suspense fallback={null}>
                  <GameFilters sports={sports} types={types} />
                </Suspense>
              </div>
            </details>
          </div>

          {/* Games grid / list */}
          {games.length === 0 ? (
            <div className="py-24 text-center">
              <Search size={48} className="mx-auto mb-4 opacity-20" style={{ color: "var(--color-text-muted)" }} />
              <h2 className="font-heading text-xl font-bold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                No games found
              </h2>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {games.map((game: Game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {games.map((game: Game) => (
                <GameListItem key={game.id} game={game} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Suspense fallback={null}>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={count}
              perPage={perPage}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Filter Tag — client removal
// ----------------------------------------------------------------
function FilterTag({
  label,
  removeKey,
  params,
  extraRemoveKeys = [],
}: {
  label: string;
  removeKey: string;
  params: SearchParams;
  extraRemoveKeys?: string[];
}) {
  const keysToRemove = new Set([removeKey, ...extraRemoveKeys]);
  const newParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([k, v]) => !keysToRemove.has(k) && v !== undefined)
    ) as Record<string, string>
  );
  newParams.delete("page");

  return (
    <Link
      href={`/games?${newParams.toString()}`}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors"
      style={{
        background: "rgba(212,168,67,0.1)",
        border: "1px solid rgba(212,168,67,0.3)",
        color: "var(--raw-gold-300)",
      }}
    >
      {label}
      <span className="text-gold-500 ml-1">×</span>
    </Link>
  );
}

// Multi-value filter tag — removes one value from a comma-separated param
function FilterTagMulti({
  label,
  paramKey,
  removeValue,
  currentValue,
  params,
}: {
  label: string;
  paramKey: string;
  removeValue: string;
  currentValue: string;
  params: SearchParams;
}) {
  const remaining = currentValue
    .split(",")
    .filter((v) => v.trim() !== removeValue.trim())
    .join(",");
  const newParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([k, v]) => k !== paramKey && v !== undefined)
    ) as Record<string, string>
  );
  if (remaining) newParams.set(paramKey, remaining);
  newParams.delete("page");

  return (
    <Link
      href={`/games?${newParams.toString()}`}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors"
      style={{
        background: "rgba(212,168,67,0.1)",
        border: "1px solid rgba(212,168,67,0.3)",
        color: "var(--raw-gold-300)",
      }}
    >
      {label}
      <span className="text-gold-500 ml-1">×</span>
    </Link>
  );
}

// ----------------------------------------------------------------
// Search Box (client component not needed — just a form)
// ----------------------------------------------------------------
function SearchBox({
  defaultValue,
  params,
}: {
  defaultValue?: string;
  params: SearchParams;
}) {
  const formParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([k, v]) => k !== "search" && k !== "page" && v !== undefined)
    ) as Record<string, string>
  );

  return (
    <form method="GET" action="/games" className="relative">
      {/* Pass through other params as hidden inputs */}
      {Array.from(formParams.entries()).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-faint)" }} />
        <input
          name="search"
          defaultValue={defaultValue}
          placeholder="Search games…"
          className="h-9 pl-8 pr-3 rounded text-sm outline-none w-48"
          style={{
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border-input)",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-inter)",
          }}
        />
      </div>
    </form>
  );
}
