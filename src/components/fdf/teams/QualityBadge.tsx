"use client";

interface QualityBadgeProps {
  label: string;
  type: "positive" | "negative" | "semi" | "neutral";
}

export function QualityBadge({ label, type }: QualityBadgeProps) {
  const colors: Record<string, { bg: string; text: string }> = {
    positive: { bg: "rgba(34,197,94,0.15)", text: "var(--fdf-quality-positive, #22c55e)" },
    negative: { bg: "rgba(239,68,68,0.15)", text: "var(--fdf-quality-negative, #ef4444)" },
    semi: { bg: "rgba(245,158,11,0.15)", text: "var(--fdf-quality-semi, #f59e0b)" },
    neutral: { bg: "rgba(148,163,184,0.1)", text: "var(--fdf-text-muted, #64748b)" },
  };

  const c = colors[type];

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-fdf-mono font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {label}
    </span>
  );
}
