import { Fragment } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getGame,
  getRelatedGames,
  getApprovedReviews,
  getComments,
  getGameRating,
  incrementViewCount,
} from "@/lib/queries";
import {
  getSportColor,
  getGameImage,
  splitSemicolon,
  parsePlaytime,
  complexityClass,
  formatYear,
} from "@/lib/utils";
import { SITE_URL } from "@/lib/constants";
import { RatingWidget } from "@/components/detail/RatingWidget";
import { ReviewsSection } from "@/components/detail/ReviewsSection";
import { CommentsSection } from "@/components/detail/CommentsSection";
import { DownloadLinks } from "@/components/detail/DownloadLinks";
import { YouTubeEmbed } from "@/components/detail/YouTubeEmbed";
import { GameCard } from "@/components/games/GameCard";
import { ExternalLink } from "lucide-react";
import type { Game } from "@/lib/types";

export const revalidate = 3600;

interface GameDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: GameDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(Number(id));
  if (!game) return { title: "Game Not Found" };
  return {
    title: game.name,
    description: game.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: game.name,
      description: game.description?.slice(0, 160) ?? undefined,
      images: game.image_url ? [game.image_url] : undefined,
    },
  };
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { id } = await params;
  const gameId = Number(id);

  if (isNaN(gameId)) notFound();

  const game = await getGame(gameId);
  if (!game) notFound();

  // Increment view count (fire-and-forget)
  incrementViewCount(gameId).catch(() => {});

  const sports = splitSemicolon(game.sport);
  const primarySport = sports[0] ?? "";
  const sportColor = getSportColor(primarySport || game.sport);

  const [relatedGames, reviews, comments, { avg: ratingAvg, count: ratingCount }] =
    await Promise.all([
      primarySport ? getRelatedGames(primarySport, gameId) : Promise.resolve([]),
      getApprovedReviews(gameId),
      getComments(gameId),
      getGameRating(gameId),
    ]);
  const mainImage = getGameImage(game);
  const designers = splitSemicolon(game.authors);
  const artists = splitSemicolon(game.artists);

  // Build JSON-LD structured data
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BoardGame",
    name: game.name,
    url: `${SITE_URL}/games/${gameId}`,
  };
  if (game.description) jsonLd.description = game.description.slice(0, 500);
  if (game.image_url) jsonLd.image = game.image_url;
  if (game.publisher_name) {
    jsonLd.publisher = { "@type": "Organization", name: game.publisher_name };
  }
  if (game.year) jsonLd.datePublished = String(game.year);

  // Community rating (1-5) takes priority, fallback to BGG rating (1-10 scale)
  if (ratingCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingAvg,
      bestRating: 5,
      worstRating: 1,
      ratingCount,
    };
  } else if (game.average_rating && game.users_rated) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: game.average_rating,
      bestRating: 10,
      worstRating: 1,
      ratingCount: game.users_rated,
    };
  }

  return (
    <div style={{ background: "var(--color-bg-base)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section
        className="relative"
        style={{
          borderBottom: "1px solid var(--color-border-subtle)",
          background: "linear-gradient(180deg, var(--raw-ink-800) 0%, var(--raw-ink-950) 100%)",
        }}
      >
        {/* Sport color bar */}
        <div className="h-1 w-full" style={{ background: sportColor }} />

        <div className="max-w-[1200px] mx-auto px-5 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs mb-6" style={{ color: "var(--color-text-faint)" }}>
            <Link href="/" className="hover:text-gold-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/games" className="hover:text-gold-400 transition-colors">Games</Link>
            {primarySport && (
              <>
                <span>/</span>
                <Link href={`/browse/sport/${encodeURIComponent(primarySport)}`} className="hover:text-gold-400 transition-colors">
                  {primarySport}
                </Link>
              </>
            )}
            <span>/</span>
            <span style={{ color: "var(--color-text-muted)" }}>{game.name}</span>
          </nav>

          {/* Two-column hero */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            {/* Cover image */}
            <div className="flex justify-center lg:justify-start">
              <div
                className="relative rounded-md overflow-hidden flex-shrink-0"
                style={{
                  width: 260,
                  height: 340,
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border-subtle)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={game.name}
                    fill
                    sizes="260px"
                    className="object-cover"
                    priority
                    unoptimized={mainImage.includes("geekdo-images.com")}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span
                      className="font-heading font-bold text-6xl"
                      style={{ color: sportColor, opacity: 0.2 }}
                    >
                      {game.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Game info */}
            <div className="flex flex-col gap-4">
              {/* Sport / Type badges */}
              <div className="flex flex-wrap gap-2">
                {sports.map((s) => {
                  const c = getSportColor(s);
                  return (
                    <Link key={s} href={`/browse/sport/${encodeURIComponent(s)}`}>
                      <span className="sport-badge" style={{ borderColor: `${c}44`, color: c }}>
                        {s}
                      </span>
                    </Link>
                  );
                })}
                {game.type && (
                  <span
                    className="inline-flex items-center h-5 px-2 rounded"
                    style={{
                      background: "rgba(232,133,26,0.10)",
                      border: "1px solid rgba(232,133,26,0.28)",
                      color: "var(--raw-amber-300)",
                      fontSize: "0.7rem",
                      fontFamily: "var(--font-heading)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {game.type}
                  </span>
                )}
                {game.source === "bgg" && (
                  <span
                    className="inline-flex items-center h-5 px-2 rounded"
                    style={{
                      background: "rgba(77,132,100,0.12)",
                      border: "1px solid rgba(77,132,100,0.32)",
                      color: "var(--raw-green-300)",
                      fontSize: "0.7rem",
                      fontFamily: "var(--font-heading)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    BGG
                  </span>
                )}
              </div>

              {/* Title */}
              <div>
                <h1
                  className="font-heading font-bold leading-tight"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}
                >
                  {game.name}
                </h1>
                {game.subtitle && (
                  <p className="text-base mt-1" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-lora)", fontStyle: "italic" }}>
                    {game.subtitle}
                  </p>
                )}
              </div>

              {/* Stat strip */}
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-md"
                style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border-faint)" }}
              >
                {[
                  { label: "Year", value: formatYear(game.year) },
                  { label: "Players", value: game.players ?? "—" },
                  { label: "Playtime", value: parsePlaytime(game.playtime) },
                  { label: "Min. Age", value: game.min_age ? `${game.min_age}+` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xs uppercase tracking-widest mb-1" style={{ color: "var(--color-text-faint)", fontSize: "0.65rem" }}>
                      {label}
                    </p>
                    <p className="font-mono font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Complexity */}
              {game.complexity && (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>Complexity:</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${complexityClass(game.complexity)}`}>
                    {game.complexity}
                  </span>
                </div>
              )}

              {/* Publisher + BGG link */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {game.publisher_name && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>Publisher:</span>
                    {game.publisher_website ? (
                      <a href={game.publisher_website} target="_blank" rel="noopener noreferrer" className="text-sm font-heading transition-colors" style={{ color: "var(--color-text-link)" }}>
                        {game.publisher_name}
                      </a>
                    ) : (
                      <span className="text-sm font-heading" style={{ color: "var(--color-text-secondary)" }}>{game.publisher_name}</span>
                    )}
                  </div>
                )}
                {game.bgg_url && (
                  <a
                    href={game.bgg_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-heading uppercase tracking-wider transition-colors"
                    style={{ color: "var(--raw-green-300)" }}
                  >
                    <ExternalLink size={12} />
                    View on BGG
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          BODY — two-column layout
          ============================================================ */}
      <div className="max-w-[1200px] mx-auto px-5 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Left column: Description, Credits, Reviews, Related */}
          <div className="flex flex-col gap-10">
            {/* Description */}
            {game.description && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="accent-rule" />
                  <h2 className="font-heading font-bold text-xl uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
                    About This Game
                  </h2>
                </div>
                <div className="prose-custom">
                  {game.description.split("\n\n").map((para, i) => (
                    <p key={i} className="text-base leading-relaxed mb-4 last:mb-0" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-lora)" }}>
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* Pre-written review */}
            {game.review && (
              <section
                className="p-6 rounded-md border-l-4"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderLeftColor: "var(--color-accent-primary)",
                  border: "1px solid var(--color-border-subtle)",
                  borderLeft: `4px solid ${sportColor}`,
                }}
              >
                <h3 className="font-heading font-bold text-base uppercase tracking-wide mb-3" style={{ color: "var(--color-text-accent)" }}>
                  Editorial Review
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-lora)", fontStyle: "italic" }}>
                  {game.review}
                </p>
              </section>
            )}

            {/* Credits */}
            {(designers.length > 0 || artists.length > 0 || game.publisher_name) && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="accent-rule" />
                  <h2 className="font-heading font-bold text-xl uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
                    Credits
                  </h2>
                </div>
                <div
                  className="p-5 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-4"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
                >
                  {game.publisher_name && (
                    <div>
                      <p className="section-label mb-1" style={{ fontSize: "0.65rem" }}>Publisher</p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{game.publisher_name}</p>
                    </div>
                  )}
                  {designers.length > 0 && (
                    <div>
                      <p className="section-label mb-1" style={{ fontSize: "0.65rem" }}>Designer{designers.length > 1 ? "s" : ""}</p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {designers.map((d, i) => (
                          <Fragment key={d}>
                            {i > 0 && ", "}
                            <Link
                              href={`/designers/${encodeURIComponent(d)}`}
                              className="hover:text-gold-400 transition-colors"
                              style={{ color: "var(--color-text-link)" }}
                            >
                              {d}
                            </Link>
                          </Fragment>
                        ))}
                      </p>
                    </div>
                  )}
                  {artists.length > 0 && (
                    <div>
                      <p className="section-label mb-1" style={{ fontSize: "0.65rem" }}>Artist{artists.length > 1 ? "s" : ""}</p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{artists.join(", ")}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* YouTube Embed */}
            {game.video_url && <YouTubeEmbed url={game.video_url} />}

            {/* Reviews */}
            <ReviewsSection reviews={reviews} gameId={gameId} />

            {/* Comments */}
            <CommentsSection comments={comments} gameId={gameId} />

            {/* Related Games */}
            {relatedGames.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="accent-rule" />
                  <h2 className="font-heading font-bold text-xl uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
                    More {primarySport} Games
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {relatedGames.map((g: Game) => (
                    <GameCard key={g.id} game={g} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="flex flex-col gap-4">
            {/* Community Rating */}
            <RatingWidget
              gameId={gameId}
              initialAvg={ratingAvg}
              initialCount={ratingCount}
            />

            {/* Downloads */}
            <DownloadLinks game={game} />

          </aside>
        </div>
      </div>
    </div>
  );
}
