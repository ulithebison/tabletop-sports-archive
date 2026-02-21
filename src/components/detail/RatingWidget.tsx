"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";

const RATINGS_KEY = "ttsa_ratings";

function getSavedRating(gameId: number): number | null {
  try {
    const stored = localStorage.getItem(RATINGS_KEY);
    if (!stored) return null;
    const map = JSON.parse(stored) as Record<string, number>;
    return map[String(gameId)] ?? null;
  } catch {
    return null;
  }
}

function saveRating(gameId: number, stars: number) {
  try {
    const stored = localStorage.getItem(RATINGS_KEY);
    const map = stored ? (JSON.parse(stored) as Record<string, number>) : {};
    map[String(gameId)] = stars;
    localStorage.setItem(RATINGS_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable
  }
}

interface RatingWidgetProps {
  gameId: number;
  initialAvg: number;
  initialCount: number;
}

export function RatingWidget({ gameId, initialAvg, initialCount }: RatingWidgetProps) {
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const prev = getSavedRating(gameId);
    if (prev) {
      setSelected(prev);
      setSubmitted(true);
    }
  }, [gameId]);

  async function submitRating(stars: number) {
    if (loading || submitted) return;
    setLoading(true);
    setSelected(stars);
    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: gameId, stars }),
      });
      if (res.ok) {
        const data = await res.json();
        setAvg(data.avg ?? avg);
        setCount(data.count ?? count);
        setSubmitted(true);
        saveRating(gameId, stars);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="p-5 rounded-md"
      style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
    >
      <h3
        className="section-label mb-4"
        style={{ fontSize: "0.7rem" }}
      >
        Community Rating
      </h3>

      {/* Current average */}
      <div className="flex items-baseline gap-2 mb-4">
        <span
          className="font-mono text-3xl font-bold"
          style={{ color: avg > 0 ? "var(--raw-gold-400)" : "var(--color-text-faint)" }}
        >
          {avg > 0 ? avg.toFixed(1) : "—"}
        </span>
        {count > 0 && (
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            / 5 ({count} rating{count !== 1 ? "s" : ""})
          </span>
        )}
      </div>

      {/* Star display (average) */}
      {avg > 0 && (
        <div className="flex gap-0.5 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={16}
              fill={s <= Math.round(avg) ? "var(--raw-gold-450)" : "none"}
              color={s <= Math.round(avg) ? "var(--raw-gold-450)" : "var(--color-text-faint)"}
            />
          ))}
        </div>
      )}

      {/* Interactive stars */}
      {submitted ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          You rated this {selected} star{selected !== 1 ? "s" : ""}. Thanks!
        </p>
      ) : (
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--color-text-faint)" }}>
            Rate this game:
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                disabled={loading}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => submitRating(s)}
                className="transition-transform hover:scale-125"
                aria-label={`Rate ${s} star${s !== 1 ? "s" : ""}`}
              >
                <Star
                  size={24}
                  fill={s <= (hover || selected) ? "var(--raw-gold-450)" : "none"}
                  color={s <= (hover || selected) ? "var(--raw-gold-450)" : "var(--color-text-faint)"}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
