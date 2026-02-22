"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchAutocomplete } from "./SearchAutocomplete";

const NAV_LINKS = [
  { href: "/games", label: "All Games" },
  { href: "/browse/sport", label: "By Sport" },
  { href: "/browse/type", label: "By Type" },
  { href: "/designers", label: "Designers" },
  { href: "/popular", label: "Popular" },
  { href: "/recent", label: "Recent" },
  { href: "/stats", label: "Stats" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/news", label: "News" },
  { href: "/submit/game", label: "Submit Game" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "var(--color-bg-nav)",
        borderColor: "var(--color-border-subtle)",
        height: "var(--nav-height)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-5 h-full flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div
            className="w-8 h-8 flex items-center justify-center rounded"
            style={{ background: "var(--raw-gold-450)" }}
          >
            <span
              className="font-heading font-bold text-sm"
              style={{ color: "var(--raw-black)", letterSpacing: "0.05em" }}
            >
              TS
            </span>
          </div>
          <div className="hidden sm:block">
            <div
              className="font-heading font-bold text-sm leading-none"
              style={{ color: "var(--color-text-primary)", letterSpacing: "0.04em" }}
            >
              TABLETOP SPORTS
            </div>
            <div
              className="font-heading text-xs leading-none mt-0.5"
              style={{ color: "var(--color-text-accent)", letterSpacing: "0.08em" }}
            >
              GAMES ARCHIVE
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-heading font-medium transition-colors",
                "tracking-wide uppercase",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-gold-450 bg-gold-950/40"
                  : "text-ink-200 hover:text-ink-50 hover:bg-ink-700"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <SearchAutocomplete />

          {/* Admin link (subtle) */}
          <Link
            href="/admin"
            className="hidden md:block px-3 py-1.5 rounded text-xs font-heading uppercase tracking-wider text-ink-400 hover:text-ink-200 transition-colors"
          >
            Admin
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-ink-300 hover:text-ink-50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden border-t"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <nav className="flex flex-col p-3 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-4 py-2.5 rounded text-sm font-heading uppercase tracking-wide transition-colors",
                  pathname === link.href
                    ? "text-gold-450 bg-gold-950/40"
                    : "text-ink-200 hover:text-ink-50 hover:bg-ink-700"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded text-sm font-heading uppercase tracking-wide text-ink-400 hover:text-ink-200 hover:bg-ink-700 transition-colors"
            >
              Admin
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
