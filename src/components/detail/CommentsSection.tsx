"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import type { Comment } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface CommentsSectionProps {
  comments: Comment[];
  gameId?: number;
  blogPostId?: number;
}

export function CommentsSection({ comments: initialComments, gameId, blogPostId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const mountTime = useRef(0);

  useEffect(() => {
    mountTime.current = Date.now();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!author.trim() || !body.trim()) {
      setError("Name and comment are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(gameId ? { game_id: gameId } : { blog_post_id: blogPostId }),
          author: author.trim(),
          body: body.trim(),
          _hp: honeypot,
          _t: mountTime.current,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit comment.");
        return;
      }

      // Optimistic add
      const newComment: Comment = data.comment ?? {
        id: Date.now(),
        game_id: gameId ?? null,
        blog_post_id: blogPostId ?? null,
        author: author.trim(),
        body: body.trim(),
        created_at: new Date().toISOString(),
      };

      setComments((prev) => [newComment, ...prev]);
      setAuthor("");
      setBody("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <span className="accent-rule" />
        <h2
          className="font-heading font-bold text-xl uppercase tracking-wide"
          style={{ color: "var(--color-text-primary)" }}
        >
          Comments
        </h2>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{
            background: "rgba(212,168,67,0.1)",
            color: "var(--raw-gold-300)",
          }}
        >
          {comments.length}
        </span>
      </div>

      {/* Comment form */}
      <form
        onSubmit={handleSubmit}
        className="p-5 rounded-md mb-6"
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        {/* Honeypot — hidden from humans, bots will fill it */}
        <div
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px" }}
        >
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="text"
            placeholder="Your name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={80}
            className="flex-1 h-9 px-3 rounded text-sm outline-none"
            style={{
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border-input)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-inter)",
            }}
          />
        </div>
        <textarea
          placeholder="Write a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={3}
          className="w-full px-3 py-2 rounded text-sm outline-none resize-y mb-3"
          style={{
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border-input)",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-lora)",
          }}
        />
        <div className="flex items-center justify-between">
          <div>
            {error && (
              <p className="text-xs" style={{ color: "var(--raw-red-300)" }}>
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs" style={{ color: "var(--raw-green-300)" }}>
                Comment posted!
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-heading uppercase tracking-wider transition-colors disabled:opacity-50"
            style={{
              background: "var(--raw-gold-450)",
              color: "var(--raw-black)",
              fontWeight: 600,
            }}
          >
            <MessageCircle size={14} />
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>

      {/* Comment list */}
      {comments.length === 0 ? (
        <div
          className="py-10 text-center rounded-md"
          style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-faint)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="p-5 rounded-md"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-heading font-bold text-sm"
                  style={{
                    background: "var(--color-bg-muted)",
                    color: "var(--color-text-accent)",
                  }}
                >
                  {comment.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p
                    className="font-heading font-semibold text-sm"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {comment.author}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                    {formatDate(comment.created_at)}
                  </p>
                </div>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-lora)" }}
              >
                {comment.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
