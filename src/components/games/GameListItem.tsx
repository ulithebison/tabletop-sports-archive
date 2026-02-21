import Link from "next/link";
import Image from "next/image";
import { cn, getSportColor, getGameImage, complexityClass, truncate, splitSemicolon } from "@/lib/utils";
import type { Game } from "@/lib/types";

interface GameListItemProps {
  game: Game;
}

export function GameListItem({ game }: GameListItemProps) {
  const sports = splitSemicolon(game.sport);
  const sportColor = getSportColor(sports[0] ?? game.sport);
  const image = getGameImage(game);

  return (
    <Link href={`/games/${game.id}`} className="group block">
      <article
        className="flex items-center gap-4 p-3 rounded-md transition-colors"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        {/* Thumbnail */}
        <div
          className="relative flex-shrink-0 rounded overflow-hidden bg-ink-800"
          style={{ width: 60, height: 60 }}
        >
          {image ? (
            <Image
              src={image}
              alt={game.name}
              fill
              sizes="60px"
              className="object-cover"
              unoptimized={image.includes("geekdo-images.com")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span
                className="font-heading font-bold text-xl"
                style={{ color: sportColor, opacity: 0.4 }}
              >
                {game.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-heading font-semibold text-sm leading-snug group-hover:text-gold-400 transition-colors truncate"
            style={{ color: "var(--color-text-primary)" }}
          >
            {game.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {sports.map((s, i) => {
              const c = getSportColor(s);
              return (
                <span key={s} className="text-xs" style={{ color: c }}>
                  {i > 0 && <span className="mr-1" style={{ color: "var(--color-text-faint)" }}>·</span>}
                  {s}
                </span>
              );
            })}
            {game.type && (
              <span
                className="text-xs"
                style={{ color: "var(--color-text-faint)" }}
              >
                · {game.type}
              </span>
            )}
            {game.year && (
              <span
                className="text-xs font-mono"
                style={{ color: "var(--color-text-faint)" }}
              >
                · {game.year}
              </span>
            )}
          </div>
          {game.description && (
            <p
              className="text-xs mt-1 line-clamp-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              {truncate(game.description, 100)}
            </p>
          )}
        </div>

        {/* Right meta */}
        <div className="flex-shrink-0 text-right space-y-1">
          {game.community_avg && game.community_avg > 0 && (
            <div className="flex items-center gap-1 justify-end">
              <span style={{ color: "var(--raw-gold-450)", fontSize: "0.7rem" }}>★</span>
              <span className="font-mono text-xs" style={{ color: "var(--color-text-primary)" }}>
                {game.community_avg.toFixed(1)}
              </span>
            </div>
          )}
          {game.complexity && (
            <div>
              <span
                className={cn("text-2xs px-1 py-0.5 rounded", complexityClass(game.complexity))}
                style={{ fontSize: "0.6rem" }}
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
