"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ReviewVoteButtonsProps {
  reviewId: number;
  initialScore: number;
}

type VoteState = 1 | -1 | 0;

const STORAGE_KEY = "ttsa_review_votes";

function getStoredVotes(): Record<string, VoteState> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setStoredVote(reviewId: number, vote: VoteState) {
  const votes = getStoredVotes();
  if (vote === 0) {
    delete votes[String(reviewId)];
  } else {
    votes[String(reviewId)] = vote;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
}

export function ReviewVoteButtons({
  reviewId,
  initialScore,
}: ReviewVoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<VoteState>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = getStoredVotes();
    const v = stored[String(reviewId)];
    if (v === 1 || v === -1) setUserVote(v);
  }, [reviewId]);

  const handleVote = useCallback(
    async (vote: 1 | -1) => {
      if (loading) return;

      // Optimistic update
      const prevScore = score;
      const prevVote = userVote;

      let newVote: VoteState;
      let scoreDelta: number;

      if (userVote === vote) {
        // Toggle off
        newVote = 0;
        scoreDelta = -vote;
      } else if (userVote === 0) {
        // New vote
        newVote = vote;
        scoreDelta = vote;
      } else {
        // Switch vote
        newVote = vote;
        scoreDelta = vote * 2; // remove old + add new
      }

      setUserVote(newVote);
      setScore((s) => s + scoreDelta);
      setStoredVote(reviewId, newVote);
      setLoading(true);

      try {
        const res = await fetch("/api/reviews/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ review_id: reviewId, vote }),
        });

        if (res.ok) {
          const data = await res.json();
          setScore(data.score);
        } else {
          // Revert on error
          setScore(prevScore);
          setUserVote(prevVote);
          setStoredVote(reviewId, prevVote);
        }
      } catch {
        // Revert on error
        setScore(prevScore);
        setUserVote(prevVote);
        setStoredVote(reviewId, prevVote);
      } finally {
        setLoading(false);
      }
    },
    [loading, score, userVote, reviewId]
  );

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className="p-0.5 rounded transition-colors"
        style={{
          color:
            userVote === 1
              ? "var(--raw-gold-450)"
              : "var(--color-text-faint)",
        }}
        aria-label="Upvote"
      >
        <ChevronUp size={16} />
      </button>
      <span
        className="font-mono text-xs min-w-[1.5rem] text-center"
        style={{
          color:
            score > 0
              ? "var(--raw-gold-450)"
              : score < 0
                ? "var(--raw-ember-400)"
                : "var(--color-text-faint)",
        }}
      >
        {score}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className="p-0.5 rounded transition-colors"
        style={{
          color:
            userVote === -1
              ? "var(--raw-ember-400)"
              : "var(--color-text-faint)",
        }}
        aria-label="Downvote"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
