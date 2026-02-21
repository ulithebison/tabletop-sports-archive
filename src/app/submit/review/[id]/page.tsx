"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { Star, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface ReviewForm {
  author: string;
  email: string;
  stars: number;
  body: string;
}

const EMPTY_FORM: ReviewForm = {
  author: "",
  email: "",
  stars: 0,
  body: "",
};

const MIN_BODY_LENGTH = 20;

// ----------------------------------------------------------------
// Shared input styles
// ----------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-bg-input)",
  border: "1px solid rgba(212,168,67,0.18)",
  borderRadius: 4,
  color: "var(--color-text-primary)",
  fontSize: "0.9375rem",
  padding: "0.6rem 0.75rem",
  outline: "none",
  transition: "border-color 150ms ease",
  fontFamily: "var(--font-body)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-heading)",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginBottom: "0.4rem",
};

const requiredDotStyle: React.CSSProperties = {
  color: "var(--color-text-accent)",
  marginLeft: 3,
};

// ----------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>{children}</div>;
}

function FocusInput({
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      required={required}
      style={{
        ...inputStyle,
        borderColor: focused
          ? "var(--raw-gold-450)"
          : required && !value
          ? "rgba(212,168,67,0.35)"
          : "rgba(212,168,67,0.18)",
        boxShadow: focused ? "0 0 0 2px rgba(212,168,67,0.12)" : "none",
      }}
    />
  );
}

function FocusTextarea({
  value,
  onChange,
  placeholder,
  rows = 6,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      style={{
        ...inputStyle,
        resize: "vertical",
        borderColor: focused
          ? "var(--raw-gold-450)"
          : required && !value
          ? "rgba(212,168,67,0.35)"
          : "rgba(212,168,67,0.18)",
        boxShadow: focused ? "0 0 0 2px rgba(212,168,67,0.12)" : "none",
      }}
    />
  );
}

// ── Star Picker ─────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (stars: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
        onMouseLeave={() => setHovered(0)}
        role="group"
        aria-label="Star rating"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= (hovered || value);
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n !== 1 ? "s" : ""}`}
              onClick={() => onChange(n)}
              onMouseEnter={() => setHovered(n)}
              style={{
                background: "none",
                border: "none",
                padding: "0.125rem",
                cursor: "pointer",
                lineHeight: 1,
                transition: "transform 100ms ease",
                transform: hovered === n ? "scale(1.15)" : "scale(1)",
              }}
            >
              <Star
                size={30}
                fill={active ? "var(--raw-gold-450)" : "transparent"}
                color={active ? "var(--raw-gold-450)" : "rgba(212,168,67,0.3)"}
                strokeWidth={1.5}
              />
            </button>
          );
        })}

        {(hovered || value) > 0 && (
          <span
            style={{
              marginLeft: "0.5rem",
              fontFamily: "var(--font-heading)",
              fontSize: "0.8125rem",
              color: "var(--color-text-accent)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {labels[hovered || value]}
          </span>
        )}
      </div>

      {value === 0 && (
        <p style={{ fontSize: "0.78rem", color: "var(--color-text-faint)", margin: 0 }}>
          Click a star to rate this game (optional)
        </p>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default function SubmitReviewPage({ params }: ReviewPageProps) {
  const { id } = use(params);

  const [form, setForm] = useState<ReviewForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ReviewForm>(field: K) {
    return (value: ReviewForm[K]) => setForm((prev) => ({ ...prev, [field]: value }));
  }

  const bodyCharsRemaining = Math.max(0, MIN_BODY_LENGTH - form.body.trim().length);
  const bodyValid = form.body.trim().length >= MIN_BODY_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.author.trim()) {
      setError("Your name is required.");
      return;
    }
    if (!bodyValid) {
      setError(`Your review must be at least ${MIN_BODY_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      const payload = {
        game_id: Number(id),
        author: form.author.trim(),
        email: form.email.trim() || null,
        stars: form.stars > 0 ? form.stars : null,
        body: form.body.trim(),
        status: "pending" as const,
      };

      const { error: sbError } = await supabase.from("reviews").insert(payload);
      if (sbError) throw new Error(sbError.message);

      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────
  if (success) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "var(--color-bg-base)",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-default)",
            borderRadius: 8,
            padding: "2.5rem 2rem",
          }}
        >
          <CheckCircle
            size={48}
            style={{ color: "var(--raw-green-400)", margin: "0 auto 1.25rem" }}
          />
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
              marginBottom: "0.75rem",
            }}
          >
            Review Submitted!
          </h2>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              fontFamily: "var(--font-lora)",
              marginBottom: "1.75rem",
            }}
          >
            Thanks for sharing your experience. Your review will appear on the game page once it
            has been approved.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href={`/games/${id}`}
              style={{
                display: "inline-block",
                background: "#d4a843",
                borderRadius: 4,
                color: "#080705",
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: "0.8125rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "0.6rem 1.25rem",
                textDecoration: "none",
              }}
            >
              Back to Game
            </Link>
            <button
              onClick={() => setSuccess(false)}
              style={{
                background: "transparent",
                border: "1px solid var(--color-border-default)",
                borderRadius: 4,
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: "0.8125rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "0.6rem 1.25rem",
                cursor: "pointer",
              }}
            >
              Write Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div style={{ background: "var(--color-bg-base)", minHeight: "100vh" }}>
      {/* Page header */}
      <div
        style={{
          borderBottom: "1px solid var(--color-border-subtle)",
          background: "linear-gradient(180deg, var(--raw-ink-800) 0%, var(--raw-ink-950) 100%)",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "2.5rem 1.25rem 2rem" }}>
          {/* Breadcrumb */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.75rem",
              color: "var(--color-text-faint)",
              marginBottom: "1.25rem",
            }}
          >
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
              Home
            </Link>
            <span>/</span>
            <Link href={`/games/${id}`} style={{ color: "inherit", textDecoration: "none" }}>
              Game #{id}
            </Link>
            <span>/</span>
            <span style={{ color: "var(--color-text-muted)" }}>Submit a Review</span>
          </nav>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                display: "block",
                width: 48,
                height: 3,
                background: "var(--color-accent-primary)",
                borderRadius: 2,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--color-text-accent)",
              }}
            >
              Community
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Submit a Review
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              marginTop: "0.625rem",
              fontSize: "0.9375rem",
              fontFamily: "var(--font-lora)",
            }}
          >
            Share your experience with this game. All reviews are moderated before publishing.
          </p>
        </div>
      </div>

      {/* Form body */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
        <form onSubmit={handleSubmit} noValidate>
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 8,
              padding: "1.75rem",
              marginBottom: "1.25rem",
            }}
          >
            {/* About you */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: 36,
                  height: 3,
                  background: "var(--color-accent-primary)",
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--color-text-accent)",
                  margin: 0,
                }}
              >
                About You
              </h2>
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <FieldGroup>
                  <label style={labelStyle}>
                    Your Name<span style={requiredDotStyle}>*</span>
                  </label>
                  <FocusInput
                    value={form.author}
                    onChange={set("author")}
                    placeholder="How you'd like to appear"
                    required
                  />
                </FieldGroup>

                <FieldGroup>
                  <label style={labelStyle}>Email (optional)</label>
                  <FocusInput
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="Not published"
                  />
                </FieldGroup>
              </div>
            </div>
          </div>

          {/* Review content */}
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 8,
              padding: "1.75rem",
              marginBottom: "1.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: 36,
                  height: 3,
                  background: "var(--color-accent-primary)",
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--color-text-accent)",
                  margin: 0,
                }}
              >
                Your Review
              </h2>
            </div>

            <div style={{ display: "grid", gap: "1.25rem" }}>
              {/* Star picker */}
              <FieldGroup>
                <label style={labelStyle}>Rating</label>
                <StarPicker value={form.stars} onChange={set("stars")} />
              </FieldGroup>

              {/* Review body */}
              <FieldGroup>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <label style={labelStyle}>
                    Review<span style={requiredDotStyle}>*</span>
                  </label>
                  {bodyCharsRemaining > 0 && form.body.length > 0 && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-faint)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {bodyCharsRemaining} more chars needed
                    </span>
                  )}
                  {bodyValid && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--raw-green-400)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {form.body.trim().length} chars
                    </span>
                  )}
                </div>
                <FocusTextarea
                  value={form.body}
                  onChange={set("body")}
                  placeholder={`Share your honest thoughts about this game. What did you enjoy? What could be better? Minimum ${MIN_BODY_LENGTH} characters.`}
                  rows={7}
                  required
                />
              </FieldGroup>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.625rem",
                background: "rgba(196,75,59,0.1)",
                border: "1px solid rgba(196,75,59,0.35)",
                borderRadius: 6,
                padding: "0.875rem 1rem",
                marginBottom: "1.25rem",
                color: "var(--raw-red-300)",
                fontSize: "0.9rem",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: loading ? "rgba(212,168,67,0.55)" : "#d4a843",
                color: "#080705",
                border: "none",
                borderRadius: 4,
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: "0.875rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.75rem 1.75rem",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 150ms ease",
              }}
            >
              {loading && (
                <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
              )}
              {loading ? "Submitting…" : "Submit Review"}
            </button>

            <p style={{ fontSize: "0.8rem", color: "var(--color-text-faint)", margin: 0 }}>
              Fields marked <span style={{ color: "var(--color-text-accent)" }}>*</span> are
              required.
            </p>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
