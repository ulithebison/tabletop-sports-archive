import Link from "next/link";
import { Star, MessageSquare } from "lucide-react";
import type { Review } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ReviewsSectionProps {
  reviews: Review[];
  gameId: number;
}

export function ReviewsSection({ reviews, gameId }: ReviewsSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="accent-rule" />
          <h2
            className="font-heading font-bold text-xl uppercase tracking-wide"
            style={{ color: "var(--color-text-primary)" }}
          >
            Reviews
          </h2>
        </div>
        <Link
          href={`/submit/review/${gameId}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-heading uppercase tracking-wider transition-colors"
          style={{
            background: "transparent",
            border: "1px solid var(--color-border-default)",
            color: "var(--color-text-secondary)",
          }}
        >
          <MessageSquare size={14} />
          Write a Review
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div
          className="py-10 text-center rounded-md"
          style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-faint)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No reviews yet.{" "}
            <Link
              href={`/submit/review/${gameId}`}
              style={{ color: "var(--color-text-link)" }}
            >
              Be the first to review this game.
            </Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="p-5 rounded-md"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-heading font-bold text-sm"
                    style={{
                      background: "var(--color-bg-muted)",
                      color: "var(--color-text-accent)",
                    }}
                  >
                    {review.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p
                      className="font-heading font-semibold text-sm"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {review.author}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>

                {/* Stars */}
                {review.stars && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        fill={s <= review.stars! ? "var(--raw-gold-450)" : "none"}
                        color={s <= review.stars! ? "var(--raw-gold-450)" : "var(--color-text-faint)"}
                      />
                    ))}
                  </div>
                )}
              </div>

              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-lora)" }}
              >
                {review.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
