import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-16 border-t"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        borderColor: "var(--color-border-subtle)",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0"
                style={{ background: "var(--raw-gold-450)" }}
              >
                <span
                  className="font-heading font-bold text-sm"
                  style={{ color: "var(--raw-black)" }}
                >
                  TS
                </span>
              </div>
              <div>
                <div
                  className="font-heading font-bold text-sm"
                  style={{ color: "var(--color-text-primary)", letterSpacing: "0.04em" }}
                >
                  TABLETOP SPORTS GAMES ARCHIVE
                </div>
              </div>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              The definitive database of physical sports simulation games. From vintage
              baseball card games to modern football simulations — every game, catalogued.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h3
              className="section-label mb-4"
            >
              Browse
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/games", label: "All Games" },
                { href: "/browse/sport", label: "By Sport" },
                { href: "/browse/type", label: "By Game Type" },
                { href: "/designers", label: "By Designer" },
                { href: "/recent", label: "Recent Additions" },
                { href: "/stats", label: "Stats & Insights" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Site */}
          <div>
            <h3 className="section-label mb-4">Site</h3>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "About" },
                { href: "/blog", label: "Blog" },
                { href: "/news", label: "News" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="section-label mb-4">Community</h3>
            <ul className="space-y-2">
              {[
                { href: "/submit/game", label: "Submit a Game" },
                { href: "/contact", label: "Contact Us" },
                { href: "/admin", label: "Admin Login" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          style={{ borderColor: "var(--color-border-faint)" }}
        >
          <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
            &copy; {year} Tabletop Sports Games Archive. Game data sourced from BoardGameGeek.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs transition-colors"
              style={{ color: "var(--color-text-faint)" }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs transition-colors"
              style={{ color: "var(--color-text-faint)" }}
            >
              Terms of Use
            </Link>
            <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
              Built with Next.js &amp; Supabase
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
