"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center text-center px-5"
      style={{ background: "var(--color-bg-base)" }}
    >
      <p
        className="font-mono text-7xl font-bold mb-4"
        style={{ color: "var(--color-border-strong)" }}
      >
        500
      </p>
      <h1
        className="font-heading font-bold text-3xl uppercase tracking-wide mb-4"
        style={{ color: "var(--color-text-primary)" }}
      >
        Something Went Wrong
      </h1>
      <p className="text-base mb-8 max-w-md" style={{ color: "var(--color-text-muted)" }}>
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-3 rounded font-heading font-semibold text-sm uppercase tracking-wider cursor-pointer"
          style={{ background: "var(--raw-gold-450)", color: "var(--raw-black)" }}
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded font-heading font-semibold text-sm uppercase tracking-wider border"
          style={{
            background: "transparent",
            borderColor: "var(--color-border-default)",
            color: "var(--color-text-secondary)",
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
