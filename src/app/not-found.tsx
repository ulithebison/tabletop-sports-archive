import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center text-center px-5"
      style={{ background: "var(--color-bg-base)" }}
    >
      <p
        className="font-mono text-7xl font-bold mb-4"
        style={{ color: "var(--color-border-strong)" }}
      >
        404
      </p>
      <h1
        className="font-heading font-bold text-3xl uppercase tracking-wide mb-4"
        style={{ color: "var(--color-text-primary)" }}
      >
        Game Not Found
      </h1>
      <p className="text-base mb-8 max-w-md" style={{ color: "var(--color-text-muted)" }}>
        This game doesn&apos;t appear to be in our archive. It may have been removed or the link is incorrect.
      </p>
      <div className="flex gap-4">
        <Link
          href="/games"
          className="px-6 py-3 rounded font-heading font-semibold text-sm uppercase tracking-wider"
          style={{ background: "var(--raw-gold-450)", color: "var(--raw-black)" }}
        >
          Browse All Games
        </Link>
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
