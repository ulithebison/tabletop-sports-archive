import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getGameCount, getNews, getTopGames, getRecentGames } from "@/lib/queries";
import { formatDate, getGameImage, getSportColor } from "@/lib/utils";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import type { Game, NewsItem } from "@/lib/types";
import { ArrowRight, Trophy, Clock, Tags, Layers } from "lucide-react";

export const revalidate = 3600;

async function GameCount() {
  try {
    const count = await getGameCount();
    return (
      <span className="font-mono text-gold-300 tabular-nums">
        {count.toLocaleString()}
      </span>
    );
  } catch {
    return <span className="font-mono text-gold-300">6,800+</span>;
  }
}

async function NewsFeed() {
  try {
    const items = await getNews(2);
    if (items.length === 0) return null;
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="accent-rule" />
            <h2 className="font-heading font-bold text-xl uppercase tracking-widest" style={{ color: "var(--color-text-accent)" }}>
              Latest News
            </h2>
          </div>
          <Link href="/news" className="flex items-center gap-1 text-sm transition-colors" style={{ color: "var(--color-text-link)" }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item: NewsItem) => (
            <article key={item.id} className="p-5 rounded-md" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}>
              <Link href="/news" className="block group">
                <h3 className="font-heading font-semibold text-base mb-2 group-hover:text-gold-300 transition-colors" style={{ color: "var(--color-text-primary)" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--color-text-muted)" }}>{item.body}</p>
                <p className="text-xs mt-3" style={{ color: "var(--color-text-faint)" }}>{formatDate(item.created_at)}</p>
                <span className="inline-flex items-center gap-1 text-xs mt-2 transition-colors" style={{ color: "var(--color-text-link)" }}>
                  Read more <ArrowRight size={12} />
                </span>
              </Link>
            </article>
          ))}
        </div>
      </section>
    );
  } catch {
    return null;
  }
}

async function PopularGames() {
  try {
    const games = await getTopGames(8);
    if (games.length === 0) return null;
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="accent-rule" />
            <h2 className="font-heading font-bold text-xl uppercase tracking-widest" style={{ color: "var(--color-text-accent)" }}>Most Viewed</h2>
          </div>
          <Link href="/games" className="flex items-center gap-1 text-sm transition-colors" style={{ color: "var(--color-text-link)" }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {games.map((game: Game & { view_count: number }) => {
            const img = getGameImage(game);
            const sportColor = getSportColor(game.sport);
            return (
              <Link key={game.id} href={`/games/${game.id}`} className="group">
                <div className="rounded-md overflow-hidden pb-card" style={{ borderTopColor: sportColor, borderTopWidth: "2px" }}>
                  <div className="relative bg-ink-800" style={{ height: "120px" }}>
                    {img ? (
                      <Image src={img} alt={game.name} fill sizes="120px" className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-heading text-2xl font-bold" style={{ color: sportColor, opacity: 0.3 }}>{game.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-heading font-semibold leading-tight line-clamp-2 group-hover:text-gold-400 transition-colors" style={{ color: "var(--color-text-primary)" }}>{game.name}</p>
                    {game.year && <p className="text-xs font-mono mt-0.5" style={{ color: "var(--color-text-faint)" }}>{game.year}</p>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  } catch {
    return null;
  }
}

async function RecentGames() {
  try {
    const games = await getRecentGames(6);
    if (games.length === 0) return null;
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="accent-rule" />
            <h2 className="font-heading font-bold text-xl uppercase tracking-widest" style={{ color: "var(--color-text-accent)" }}>Recently Added</h2>
          </div>
          <Link href="/recent" className="flex items-center gap-1 text-sm transition-colors" style={{ color: "var(--color-text-link)" }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game: Game) => {
            const sportColor = getSportColor(game.sport);
            const img = getGameImage(game);
            return (
              <Link key={game.id} href={`/games/${game.id}`} className="group flex gap-3 p-3 rounded-md transition-colors" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}>
                <div className="relative flex-shrink-0 rounded bg-ink-800 overflow-hidden" style={{ width: 56, height: 56 }}>
                  {img ? <Image src={img} alt={game.name} fill sizes="56px" className="object-cover" unoptimized /> : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-heading font-bold text-xl" style={{ color: sportColor, opacity: 0.4 }}>{game.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-sm leading-tight line-clamp-2 group-hover:text-gold-400 transition-colors" style={{ color: "var(--color-text-primary)" }}>{game.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {game.sport && <span className="text-xs" style={{ color: sportColor }}>{game.sport}</span>}
                    {game.year && <span className="text-xs font-mono" style={{ color: "var(--color-text-faint)" }}>· {game.year}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  } catch {
    return null;
  }
}

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "The definitive database of physical sports simulation games — board games, card games, dice games, and more.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/games?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-base)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #18150f 0%, #0d0b08 60%, #0d0b08 100%)", borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(212,168,67,0.3) 40px, rgba(212,168,67,0.3) 41px)" }} />
        <div className="relative max-w-[1200px] mx-auto px-5 py-20 md:py-28">
          <div className="flex items-center gap-3 mb-6">
            <span className="accent-rule" />
            <span className="section-label">The Press Box</span>
          </div>
          <h1 className="font-heading font-bold leading-none mb-6" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            TABLETOP SPORTS<br />
            <span style={{ color: "var(--color-accent-primary)" }}>GAMES ARCHIVE</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl mb-10" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-lora)" }}>
            The definitive database of physical sports simulation games — board games, card games, dice games, and more. Over{" "}
            <Suspense fallback={<span className="font-mono text-gold-300">6,800</span>}>
              <GameCount />
            </Suspense>{" "}
            games catalogued across every sport.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/games" className="inline-flex items-center gap-2 px-6 py-3 rounded font-heading font-semibold text-sm uppercase tracking-wider transition-all" style={{ background: "var(--raw-gold-450)", color: "var(--raw-black)", boxShadow: "0 2px 8px rgba(212,168,67,0.35)" }}>
              Browse All Games <ArrowRight size={16} />
            </Link>
            <Link href="/browse/sport" className="inline-flex items-center gap-2 px-6 py-3 rounded font-heading font-semibold text-sm uppercase tracking-wider transition-all border" style={{ background: "transparent", borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>
              Browse by Sport
            </Link>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-[1200px] mx-auto px-5 py-16">
        {/* Quick browse cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {[
            { icon: Layers, href: "/games", label: "All Games", sub: "Complete database", color: "var(--raw-gold-450)" },
            { icon: Tags, href: "/browse/sport", label: "By Sport", sub: "Filter by sport", color: "var(--raw-amber-400)" },
            { icon: Trophy, href: "/browse/type", label: "By Type", sub: "Dice, Card, Board…", color: "var(--raw-red-400)" },
            { icon: Clock, href: "/recent", label: "Recent Additions", sub: "Latest entries", color: "var(--raw-blue-400)" },
          ].map(({ icon: Icon, href, label, sub, color }) => (
            <Link key={href} href={href} className="group pb-card p-5 flex flex-col gap-3" style={{ borderTopColor: color, borderTopWidth: "2px" }}>
              <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: `${color}22` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base uppercase tracking-wide group-hover:text-gold-400 transition-colors" style={{ color: "var(--color-text-primary)" }}>{label}</h3>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* About the Archive */}
        <section
          className="mb-16 rounded-lg p-8"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
            borderLeft: "3px solid var(--raw-gold-450)",
          }}
        >
          <h2
            className="font-heading font-bold text-xl uppercase tracking-wide mb-5"
            style={{ color: "var(--color-text-primary)" }}
          >
            What Is This Place?
          </h2>
          <div className="space-y-4" style={{ fontFamily: "var(--font-lora)" }}>
            <p className="text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              This archive started because sports tabletop games deserve a home. Thousands of games exist across dozens of
              sports &mdash; from classic baseball simulations to obscure curling card games &mdash; and there&rsquo;s
              never been one place to find them all.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Most of our catalog comes from BoardGameGeek, but we know there are plenty of gems out there that
              BGG doesn&rsquo;t cover. That&rsquo;s where you come in. If you know a game that&rsquo;s missing &mdash;
              something your family plays, a local favorite, an indie release &mdash; submit it. Every game matters here.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Rate games, write reviews, help other fans find their next favorite. This is a community project and it
              grows with your contributions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-heading font-semibold text-sm uppercase tracking-wider transition-all border"
              style={{
                background: "transparent",
                borderColor: "var(--color-border-default)",
                color: "var(--color-text-secondary)",
              }}
            >
              Learn More
            </Link>
            <Link
              href="/submit/game"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-heading font-semibold text-sm uppercase tracking-wider transition-all"
              style={{
                background: "var(--raw-gold-450)",
                color: "var(--raw-black)",
              }}
            >
              Submit a Game <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        <Suspense fallback={null}><PopularGames /></Suspense>
        <Suspense fallback={null}><NewsFeed /></Suspense>
        <Suspense fallback={null}><RecentGames /></Suspense>

        {/* Submit CTA */}
        <section className="rounded-lg p-8 text-center" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}>
          <h2 className="font-heading font-bold text-2xl uppercase tracking-wide mb-3" style={{ color: "var(--color-text-primary)" }}>Know a game we&rsquo;re missing?</h2>
          <p className="text-base mb-6 max-w-lg mx-auto" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-lora)" }}>Help us grow the archive. Submit a game and our team will review and add it.</p>
          <Link href="/submit/game" className="inline-flex items-center gap-2 px-6 py-3 rounded font-heading font-semibold text-sm uppercase tracking-wider" style={{ background: "var(--raw-gold-450)", color: "var(--raw-black)" }}>
            Submit a Game
          </Link>
        </section>
      </section>
    </div>
  );
}
