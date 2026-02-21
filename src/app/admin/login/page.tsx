"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded mb-4"
            style={{ background: "var(--raw-gold-450)" }}
          >
            <span
              className="font-heading font-bold text-lg"
              style={{ color: "var(--raw-black)", letterSpacing: "0.05em" }}
            >
              TS
            </span>
          </div>
          <h1
            className="font-heading font-bold text-2xl uppercase tracking-wider"
            style={{ color: "var(--color-text-primary)" }}
          >
            Press Box Admin
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            Sign in to manage the archive
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-7"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Gold top accent */}
          <div
            className="h-0.5 -mt-7 mx-0 mb-6 rounded-t-lg"
            style={{ background: "var(--color-accent-primary)" }}
          />

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="font-heading text-xs uppercase tracking-widest"
                style={{ color: "var(--color-text-accent)" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="h-10 px-3 rounded text-sm outline-none transition-colors"
                style={{
                  background: "var(--color-bg-input)",
                  border: "1px solid var(--color-border-subtle)",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-inter)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-border-strong)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-border-subtle)";
                }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="font-heading text-xs uppercase tracking-widest"
                style={{ color: "var(--color-text-accent)" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 px-3 rounded text-sm outline-none transition-colors"
                style={{
                  background: "var(--color-bg-input)",
                  border: "1px solid var(--color-border-subtle)",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-inter)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-border-strong)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-border-subtle)";
                }}
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                className="px-3 py-2.5 rounded text-sm"
                style={{
                  background: "rgba(196,75,59,0.12)",
                  border: "1px solid rgba(196,75,59,0.3)",
                  color: "var(--raw-red-300)",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-10 rounded font-heading font-semibold text-sm uppercase tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? "var(--raw-gold-700)"
                  : "var(--raw-gold-450)",
                color: "var(--raw-black)",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--color-text-faint)" }}
        >
          Tabletop Sports Games Archive &mdash; Admin Access Only
        </p>
      </div>
    </div>
  );
}
