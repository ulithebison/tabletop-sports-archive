export default function Loading() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--color-border-subtle)",
            borderTopColor: "var(--raw-gold-450)",
          }}
        />
        <p
          className="font-heading text-sm uppercase tracking-widest"
          style={{ color: "var(--color-text-faint)" }}
        >
          Loading…
        </p>
      </div>
    </div>
  );
}
