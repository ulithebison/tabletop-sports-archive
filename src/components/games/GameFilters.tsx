"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameFiltersProps {
  sports: { sport: string; count: number }[];
  types: { type: string; count: number }[];
}

const COMPLEXITIES = ["Simple", "Medium", "Complex", "Expert"];
const SORT_OPTIONS = [
  { value: "name", label: "A–Z" },
  { value: "year_desc", label: "Year (Newest)" },
  { value: "views", label: "Most Popular" },
];
const PLAYER_OPTIONS = [
  { value: "solo", label: "Solo (1 Player)" },
  { value: "2", label: "2 Players" },
  { value: "3-4", label: "3–4 Players" },
  { value: "5+", label: "5+ Players" },
];
const PLAYTIME_OPTIONS = [
  { value: "quick", label: "< 30 min" },
  { value: "short", label: "30–60 min" },
  { value: "medium", label: "1–2 hours" },
  { value: "long", label: "2+ hours" },
];

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b" style={{ borderColor: "var(--color-border-faint)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span
          className="section-label"
          style={{ fontSize: "0.7rem" }}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp size={14} style={{ color: "var(--color-text-faint)" }} />
        ) : (
          <ChevronDown size={14} style={{ color: "var(--color-text-faint)" }} />
        )}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

export function GameFilters({ sports, types }: GameFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSports = new Set(
    (searchParams.get("sport") ?? "").split(",").filter(Boolean)
  );
  const currentTypes = new Set(
    (searchParams.get("type") ?? "").split(",").filter(Boolean)
  );
  const currentComplexity = searchParams.get("complexity") ?? "";
  const currentSort = searchParams.get("sort") ?? "name";
  const currentSource = searchParams.get("source") ?? "";
  const currentPlayers = searchParams.get("players") ?? "";
  const currentPlaytime = searchParams.get("playtimeRange") ?? "";
  const currentYearMin = searchParams.get("yearMin") ?? "";
  const currentYearMax = searchParams.get("yearMax") ?? "";

  const hasFilters =
    currentSports.size > 0 ||
    currentTypes.size > 0 ||
    currentComplexity ||
    currentSource ||
    currentPlayers ||
    currentPlaytime ||
    currentYearMin ||
    currentYearMax;

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // reset to page 1
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  function toggleSport(sport: string) {
    const next = new Set(currentSports);
    if (next.has(sport)) {
      next.delete(sport);
    } else {
      next.add(sport);
    }
    updateParam("sport", Array.from(next).join(","));
  }

  function toggleType(type: string) {
    const next = new Set(currentTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    updateParam("type", Array.from(next).join(","));
  }

  function clearFilters() {
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    const search = searchParams.get("search");
    if (search) params.set("search", search);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const optionClass = (active: boolean) =>
    cn(
      "flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer text-sm transition-colors",
      active
        ? "text-gold-300 bg-gold-950/40"
        : "text-ink-200 hover:text-ink-50 hover:bg-ink-700"
    );

  return (
    <aside
      className="flex flex-col gap-0"
      style={{
        background: "var(--color-bg-sidebar)",
        borderRight: "1px solid var(--color-border-subtle)",
        padding: "20px 16px",
        minHeight: "100%",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="font-heading font-bold text-sm uppercase tracking-widest"
          style={{ color: "var(--color-text-accent)" }}
        >
          Filters
        </span>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: "var(--color-text-faint)" }}
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Sort */}
      <FilterSection title="Sort By">
        <div className="flex flex-col gap-0.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam("sort", opt.value === "name" ? "" : opt.value)}
              className={optionClass(currentSort === opt.value || (opt.value === "name" && !currentSort))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Sport — multi-select */}
      <FilterSection title="Sport" defaultOpen={true}>
        <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto pr-1">
          {sports.map(({ sport, count }) => (
            <button
              key={sport}
              onClick={() => toggleSport(sport)}
              className={optionClass(currentSports.has(sport))}
            >
              <span className="flex-1 text-left truncate">{sport}</span>
              <span
                className="font-mono text-xs flex-shrink-0"
                style={{ color: "var(--color-text-faint)" }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Game Type — multi-select */}
      <FilterSection title="Game Type">
        <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto pr-1">
          {types.map(({ type, count }) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={optionClass(currentTypes.has(type))}
            >
              <span className="flex-1 text-left">{type}</span>
              <span
                className="font-mono text-xs flex-shrink-0"
                style={{ color: "var(--color-text-faint)" }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Year range */}
      <FilterSection title="Year" defaultOpen={false}>
        <div className="flex items-center gap-2 px-2">
          <input
            type="number"
            placeholder="From"
            defaultValue={currentYearMin}
            key={`yearMin-${currentYearMin}`}
            className="w-20 px-2 py-1.5 rounded text-sm outline-none"
            style={{
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border-input)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-dm-mono)",
            }}
            onBlur={(e) => updateParam("yearMin", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                updateParam("yearMin", (e.target as HTMLInputElement).value);
            }}
          />
          <span style={{ color: "var(--color-text-faint)" }}>–</span>
          <input
            type="number"
            placeholder="To"
            defaultValue={currentYearMax}
            key={`yearMax-${currentYearMax}`}
            className="w-20 px-2 py-1.5 rounded text-sm outline-none"
            style={{
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border-input)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-dm-mono)",
            }}
            onBlur={(e) => updateParam("yearMax", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                updateParam("yearMax", (e.target as HTMLInputElement).value);
            }}
          />
        </div>
      </FilterSection>

      {/* Players */}
      <FilterSection title="Players" defaultOpen={false}>
        <div className="flex flex-col gap-0.5">
          {PLAYER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam("players", currentPlayers === opt.value ? "" : opt.value)}
              className={optionClass(currentPlayers === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Playtime */}
      <FilterSection title="Playtime" defaultOpen={false}>
        <div className="flex flex-col gap-0.5">
          {PLAYTIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                updateParam("playtimeRange", currentPlaytime === opt.value ? "" : opt.value)
              }
              className={optionClass(currentPlaytime === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Complexity */}
      <FilterSection title="Complexity">
        <div className="flex flex-col gap-0.5">
          {COMPLEXITIES.map((c) => (
            <button
              key={c}
              onClick={() => updateParam("complexity", currentComplexity === c ? "" : c)}
              className={optionClass(currentComplexity === c)}
            >
              {c}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Source */}
      <FilterSection title="Source" defaultOpen={false}>
        <div className="flex flex-col gap-0.5">
          {[
            { value: "bgg", label: "BoardGameGeek" },
            { value: "manual", label: "Hidden Games" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam("source", currentSource === opt.value ? "" : opt.value)}
              className={optionClass(currentSource === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}
