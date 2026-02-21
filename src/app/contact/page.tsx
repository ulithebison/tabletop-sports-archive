"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2, AlertCircle, Mail } from "lucide-react";
// ----------------------------------------------------------------
// Note: metadata is handled by the parent layout's title template.
// If you need
// per-page meta for this route, move the page to a server wrapper.
// ----------------------------------------------------------------

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY_FORM: ContactForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

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

// ----------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof ContactForm) {
    return (value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Your name is required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Your email address is required.");
      return;
    }
    if (!form.subject.trim()) {
      setError("A subject is required.");
      return;
    }
    if (!form.message.trim()) {
      setError("Please enter a message.");
      return;
    }

    // Simulate a short processing delay then show success
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    setSuccess(true);
    setForm(EMPTY_FORM);
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
            Message Received
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
            Thank you for your message. We&rsquo;ll get back to you as soon as we can.
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
              href="/"
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
              Back to Home
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
              Send Another
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
            <span style={{ color: "var(--color-text-muted)" }}>Contact</span>
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
              Get in Touch
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
            Contact Us
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              marginTop: "0.625rem",
              fontSize: "0.9375rem",
              fontFamily: "var(--font-lora)",
            }}
          >
            Have a question, correction, or suggestion? We&rsquo;d love to hear from you.
          </p>
        </div>
      </div>

      {/* Two-column layout: form + sidebar */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "2.5rem 1.25rem 4rem",
          display: "grid",
          gridTemplateColumns: "1fr minmax(0, 260px)",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* ── Form column ────────────────────────────────────── */}
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
                Send a Message
              </h2>
            </div>

            <div style={{ display: "grid", gap: "1.125rem" }}>
              {/* Name + Email */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <FieldGroup>
                  <label style={labelStyle}>
                    Name<span style={requiredDotStyle}>*</span>
                  </label>
                  <FocusInput
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Your name"
                    required
                  />
                </FieldGroup>

                <FieldGroup>
                  <label style={labelStyle}>
                    Email<span style={requiredDotStyle}>*</span>
                  </label>
                  <FocusInput
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@example.com"
                    required
                  />
                </FieldGroup>
              </div>

              {/* Subject */}
              <FieldGroup>
                <label style={labelStyle}>
                  Subject<span style={requiredDotStyle}>*</span>
                </label>
                <FocusInput
                  value={form.subject}
                  onChange={set("subject")}
                  placeholder="What's this about?"
                  required
                />
              </FieldGroup>

              {/* Message */}
              <FieldGroup>
                <label style={labelStyle}>
                  Message<span style={requiredDotStyle}>*</span>
                </label>
                <FocusTextarea
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Tell us what's on your mind…"
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
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                  Sending…
                </>
              ) : (
                <>
                  <Mail size={15} />
                  Send Message
                </>
              )}
            </button>

            <p style={{ fontSize: "0.8rem", color: "var(--color-text-faint)", margin: 0 }}>
              Fields marked <span style={{ color: "var(--color-text-accent)" }}>*</span> are
              required.
            </p>
          </div>
        </form>

        {/* ── Sidebar ──────────────────────────────────────── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Reasons to contact */}
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 8,
              padding: "1.5rem",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: "0.8125rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-accent)",
                marginBottom: "1rem",
                marginTop: 0,
              }}
            >
              Common Enquiries
            </h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              {[
                "Game data correction",
                "Missing game report",
                "Image or copyright issue",
                "Partnership or press",
                "General feedback",
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--color-accent-primary)",
                      flexShrink: 0,
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Submit game shortcut */}
          <div
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 8,
              padding: "1.25rem",
            }}
          >
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                fontFamily: "var(--font-lora)",
                lineHeight: 1.55,
                marginTop: 0,
                marginBottom: "0.875rem",
              }}
            >
              Want to add a game to the archive? Use the dedicated submission form.
            </p>
            <Link
              href="/submit/game"
              style={{
                display: "inline-block",
                background: "transparent",
                border: "1px solid var(--color-border-default)",
                borderRadius: 4,
                color: "var(--color-text-accent)",
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "0.5rem 1rem",
                textDecoration: "none",
                transition: "border-color 150ms ease",
              }}
            >
              Submit a Game
            </Link>
          </div>
        </aside>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
