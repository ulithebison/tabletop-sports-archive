import Link from "next/link";
import Image from "next/image";
import { cn, getSportColor, getGameImage, complexityClass, splitSemicolon } from "@/lib/utils";
import type { Game } from "@/lib/types";

interface GameCardProps {
  game: Game;
  className?: string;
}

export function GameCard({ game, className }: GameCardProps) {
  const sports = splitSemicolon(game.sport).slice(0, 2);
  const sportColor = getSportColor(sports[0] ?? game.sport);
  const image = getGameImage(game);


  return (
    <Link
      href={`/games/${game.id}`}
      className={cn("group block", className)}
    >
      <article
        className="pb-card h-full flex flex-col overflow-hidden"
        style={{ borderTopColor: sportColor, borderTopWidth: "2px" }}
      >
        {/* Cover image */}
        <div className="relative bg-ink-800 overflow-hidden" style={{ height: "200px" }}>
          {image ? (
            <Image
              src={image}
              alt={game.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={image.includes("geekdo-images.com")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span
                className="font-heading font-bold text-4xl"
                style={{ color: sportColor, opacity: 0.3 }}
              >
                {game.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Source badge */}
          {game.source === "bgg" && (
            <div className="absolute top-2 right-2">
              <span
                className="text-2xs font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: "rgba(77,132,100,0.85)",
                  color: "#b5d9c4",
                  fontSize: "0.65rem",
                  letterSpacing: "0.06em",
                }}
              >
                BGG
              </span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="flex flex-col flex-1 p-4 gap-2">
          {/* Sport badges */}
          {sports.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sports.map((s) => {
                const c = getSportColor(s);
                return (
                  <span key={s} className="sport-badge" style={{ borderColor: `${c}44`, color: c }}>
                    {s}
                  </span>
                );
              })}
            </div>
          )}

          {/* Title */}
          <h3
            className="font-heading font-semibold text-base leading-tight line-clamp-2 group-hover:text-gold-400 transition-colors"
            style={{ color: "var(--color-text-primary)" }}
          >
            {game.name}
          </h3>

          {/* Meta strip */}
          <div className="mt-auto pt-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {game.type && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
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
              {game.year && (
                <span
                  className="font-mono text-xs"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  {game.year}
                </span>
              )}
            </div>

            {/* Community Rating */}
            {game.community_avg && game.community_avg > 0 && (
              <div className="flex items-center gap-1">
                <span style={{ color: "var(--raw-gold-450)", fontSize: "0.75rem" }}>★</span>
                <span
                  className="font-mono text-xs"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {game.community_avg.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Complexity */}
          {game.complexity && (
            <div>
              <span
                className={cn(
                  "text-2xs px-1.5 py-0.5 rounded",
                  complexityClass(game.complexity)
                )}
                style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}
              >
                {game.complexity}
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
