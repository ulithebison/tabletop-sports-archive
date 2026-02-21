"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSportColor } from "@/lib/utils";

interface SearchResult {
  id: number;
  name: string;
  sport: string | null;
  year: number | null;
  thumbnail_url: string | null;
}

export function SearchAutocomplete() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const showDropdown = open && query.length >= 2;

  // Fetch results with debounce
  const fetchResults = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(term)}&limit=8`
      );
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetchResults(value.trim());
    }, 300);
  }

  function navigateToGame(id: number) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/games/${id}`);
  }

  function submitSearch() {
    if (query.trim()) {
      setOpen(false);
      setResults([]);
      router.push(`/games?search=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!showDropdown || results.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          navigateToGame(results[activeIndex].id);
        } else {
          submitSearch();
        }
        break;
    }
  }

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-ink-300 hover:text-gold-450 transition-colors"
        aria-label="Search games"
      >
        <Search size={18} />
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search games..."
            role="combobox"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-controls="search-listbox"
            aria-activedescendant={
              activeIndex >= 0 ? `search-option-${activeIndex}` : undefined
            }
            className={cn(
              "h-9 w-48 md:w-64 pl-8 pr-3 rounded text-sm outline-none",
              "bg-ink-800 border border-gold-450/30 text-ink-50 placeholder:text-ink-300",
              "focus:border-gold-450 transition-colors"
            )}
            style={{ fontFamily: "var(--font-inter)" }}
          />
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400"
          />
          {loading && (
            <Loader2
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 animate-spin"
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setQuery("");
            setResults([]);
          }}
          className="p-1.5 text-ink-300 hover:text-ink-50 transition-colors"
          aria-label="Close search"
        >
          <X size={18} />
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          id="search-listbox"
          role="listbox"
          className="absolute right-0 top-full mt-2 w-72 md:w-80 rounded-md overflow-hidden shadow-xl z-50"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          {loading && results.length === 0 ? (
            <div
              className="px-4 py-6 text-center text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              <Loader2
                size={16}
                className="inline animate-spin mr-2 text-gold-450"
              />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div
              className="px-4 py-6 text-center text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              No games found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {results.map((game, index) => {
                const sportColor = getSportColor(
                  game.sport?.split(";")[0]?.trim()
                );
                return (
                  <button
                    key={game.id}
                    id={`search-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      index === activeIndex
                        ? "bg-gold-950/50"
                        : "hover:bg-ink-700/50"
                    )}
                    onClick={() => navigateToGame(game.id)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    {/* Thumbnail */}
                    <div
                      className="relative flex-shrink-0 rounded overflow-hidden bg-ink-800"
                      style={{ width: 32, height: 32 }}
                    >
                      {game.thumbnail_url ? (
                        <Image
                          src={game.thumbnail_url}
                          alt=""
                          fill
                          sizes="32px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ color: sportColor, opacity: 0.4 }}
                        >
                          <span className="font-heading text-xs font-bold">
                            {game.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-heading font-medium leading-tight truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {game.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {game.sport && (
                          <span
                            className="text-xs truncate"
                            style={{ color: sportColor }}
                          >
                            {game.sport.split(";")[0]?.trim()}
                          </span>
                        )}
                        {game.year && (
                          <span
                            className="text-xs font-mono"
                            style={{ color: "var(--color-text-faint)" }}
                          >
                            {game.year}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Footer: full search link */}
              <button
                className="w-full px-3 py-2.5 text-left text-xs font-heading uppercase tracking-wider border-t transition-colors hover:bg-ink-700/50"
                style={{
                  color: "var(--color-text-link)",
                  borderColor: "var(--color-border-faint)",
                }}
                onClick={submitSearch}
              >
                View all results for &ldquo;{query}&rdquo;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
