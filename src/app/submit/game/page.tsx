"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface GameSubmissionForm {
  name: string;
  sport: string;
  year: string;
  type: string;
  description: string;
  players: string;
  playtime: string;
  complexity: string;
  publisher_name: string;
  publisher_website: string;
  bgg_url: string;
  submitter_name: string;
  submitter_email: string;
}

const EMPTY_FORM: GameSubmissionForm = {
  name: "",
  sport: "",
  year: "",
  type: "",
  description: "",
  players: "",
  playtime: "",
  complexity: "",
  publisher_name: "",
  publisher_website: "",
  bgg_url: "",
  submitter_name: "",
  submitter_email: "",
};

const COMPLEXITY_OPTIONS = ["", "Simple", "Medium", "Complex", "Expert"] as const;
const TYPE_OPTIONS = ["", "Dice", "Card", "Board", "Tabletop"] as const;

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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
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
        {children}
      </h2>
    </div>
  );
}

function FocusInput({
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  name,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  name?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      name={name}
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
  rows = 4,
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
        borderColor: focused ? "var(--raw-gold-450)" : "rgba(212,168,67,0.18)",
        boxShadow: focused ? "0 0 0 2px rgba(212,168,67,0.12)" : "none",
      }}
    />
  );
}

function FocusSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle,
        cursor: "pointer",
        borderColor: focused ? "var(--raw-gold-450)" : "rgba(212,168,67,0.18)",
        boxShadow: focused ? "0 0 0 2px rgba(212,168,67,0.12)" : "none",
        // Needed for dark option backgrounds in most browsers
        colorScheme: "dark",
      }}
    >
      {children}
    </select>
  );
}

// ----------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------

export default function SubmitGamePage() {
  const [form, setForm] = useState<GameSubmissionForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof GameSubmissionForm) {
    return (value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation of required fields
    if (!form.name.trim()) {
      setError("Game name is required.");
      return;
    }
    if (!form.submitter_name.trim()) {
      setError("Your name is required.");
      return;
    }
    if (!form.submitter_email.trim()) {
      setError("Your email address is required.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      const payload = {
        name: form.name.trim(),
        sport: form.sport.trim() || null,
        year: form.year ? Number(form.year) : null,
        type: form.type || null,
        description: form.description.trim() || null,
        players: form.players.trim() || null,
        playtime: form.playtime.trim() || null,
        complexity: form.complexity || null,
        publisher_name: form.publisher_name.trim() || null,
        publisher_website: form.publisher_website.trim() || null,
        bgg_url: form.bgg_url.trim() || null,
        submitter_name: form.submitter_name.trim(),
        submitter_email: form.submitter_email.trim(),
        status: "pending" as const,
      };

      const { error: sbError } = await supabase.from("game_submissions").insert(payload);

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
            Submission Received!
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
            Thank you for contributing to the archive. We&rsquo;ll review your game submission and
            add it once approved.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
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
              Submit Another
            </button>
            <Link
              href="/games"
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
              Browse Games
            </Link>
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
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 1.25rem 2rem" }}>
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
            <span style={{ color: "var(--color-text-muted)" }}>Submit a Game</span>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
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
            Submit a Game
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              marginTop: "0.625rem",
              fontSize: "0.9375rem",
              fontFamily: "var(--font-lora)",
            }}
          >
            Know a tabletop sports game we&rsquo;re missing? Fill in as much detail as you can and
            we&rsquo;ll review it for the archive.
          </p>
        </div>
      </div>

      {/* Form body */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
        <form onSubmit={handleSubmit} noValidate>
          {/* ── Game Details ─────────────────────────────────── */}
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 8,
              padding: "1.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <SectionHeading>Game Details</SectionHeading>

            <div style={{ display: "grid", gap: "1.125rem" }}>
              {/* Name */}
              <FieldGroup>
                <label style={labelStyle}>
                  Game Name<span style={requiredDotStyle}>*</span>
                </label>
                <FocusInput
                  value={form.name}
                  onChange={set("name")}
                  placeholder="e.g. Strat-O-Matic Baseball"
                  required
                />
              </FieldGroup>

              {/* Sport + Year */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <FieldGroup>
                  <label style={labelStyle}>Sport</label>
                  <FocusInput
                    value={form.sport}
                    onChange={set("sport")}
                    placeholder="e.g. Baseball, Football"
                  />
                </FieldGroup>
                <FieldGroup>
                  <label style={labelStyle}>Year Published</label>
                  <FocusInput
                    type="number"
                    value={form.year}
                    onChange={set("year")}
                    placeholder="e.g. 1961"
                  />
                </FieldGroup>
              </div>

              {/* Type + Complexity */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <FieldGroup>
                  <label style={labelStyle}>Game Type</label>
                  <FocusSelect value={form.type} onChange={set("type")}>
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t || "Select type…"}
                      </option>
                    ))}
                  </FocusSelect>
                </FieldGroup>
                <FieldGroup>
                  <label style={labelStyle}>Complexity</label>
                  <FocusSelect value={form.complexity} onChange={set("complexity")}>
                    {COMPLEXITY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c || "Select complexity…"}
                      </option>
                    ))}
                  </FocusSelect>
                </FieldGroup>
              </div>

              {/* Players + Playtime */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <FieldGroup>
                  <label style={labelStyle}>Players</label>
                  <FocusInput
                    value={form.players}
                    onChange={set("players")}
                    placeholder="e.g. 2-4"
                  />
                </FieldGroup>
                <FieldGroup>
                  <label style={labelStyle}>Playtime</label>
                  <FocusInput
                    value={form.playtime}
                    onChange={set("playtime")}
                    placeholder="e.g. 60-90 min"
                  />
                </FieldGroup>
              </div>

              {/* Description */}
              <FieldGroup>
                <label style={labelStyle}>Description</label>
                <FocusTextarea
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Brief description of the game — how it's played, what makes it special, etc."
                  rows={4}
                />
              </FieldGroup>
            </div>
          </div>

          {/* ── Publisher & Links ─────────────────────────────── */}
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 8,
              padding: "1.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <SectionHeading>Publisher &amp; Links</SectionHeading>

            <div style={{ display: "grid", gap: "1.125rem" }}>
              <FieldGroup>
                <label style={labelStyle}>Publisher Name</label>
                <FocusInput
                  value={form.publisher_name}
                  onChange={set("publisher_name")}
                  placeholder="e.g. Strat-O-Matic Game Company"
                />
              </FieldGroup>

              <FieldGroup>
                <label style={labelStyle}>Publisher Website</label>
                <FocusInput
                  type="url"
                  value={form.publisher_website}
                  onChange={set("publisher_website")}
                  placeholder="https://example.com"
                />
              </FieldGroup>

              <FieldGroup>
                <label style={labelStyle}>BoardGameGeek URL</label>
                <FocusInput
                  type="url"
                  value={form.bgg_url}
                  onChange={set("bgg_url")}
                  placeholder="https://boardgamegeek.com/boardgame/…"
                />
              </FieldGroup>
            </div>
          </div>

          {/* ── About You ────────────────────────────────────── */}
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 8,
              padding: "1.75rem",
              marginBottom: "1.75rem",
            }}
          >
            <SectionHeading>About You</SectionHeading>

            <div style={{ display: "grid", gap: "1.125rem" }}>
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
                    value={form.submitter_name}
                    onChange={set("submitter_name")}
                    placeholder="Full name"
                    required
                  />
                </FieldGroup>
                <FieldGroup>
                  <label style={labelStyle}>
                    Email Address<span style={requiredDotStyle}>*</span>
                  </label>
                  <FocusInput
                    type="email"
                    value={form.submitter_email}
                    onChange={set("submitter_email")}
                    placeholder="you@example.com"
                    required
                  />
                </FieldGroup>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-text-faint)",
                  margin: 0,
                }}
              >
                Your email is used only for follow-up if we need more information about your
                submission. It will not be published.
              </p>
            </div>
          </div>

          {/* ── Error banner ──────────────────────────────────── */}
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

          {/* ── Submit ───────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
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
              {loading && <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />}
              {loading ? "Submitting…" : "Submit Game"}
            </button>

            <p style={{ fontSize: "0.8rem", color: "var(--color-text-faint)", margin: 0 }}>
              Fields marked <span style={{ color: "var(--color-text-accent)" }}>*</span> are
              required.
            </p>
          </div>
        </form>
      </div>

      {/* Inline spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
