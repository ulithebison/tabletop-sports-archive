"use client";

interface NarrativeBoxProps {
  text: string;
  type?: "info" | "positive" | "negative" | "neutral";
  className?: string;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  info: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", text: "#93c5fd" },
  positive: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", text: "#86efac" },
  negative: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#fca5a5" },
  neutral: { bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.3)", text: "#d1d5db" },
};

export function NarrativeBox({ text, type = "neutral", className = "" }: NarrativeBoxProps) {
  const style = TYPE_STYLES[type];
  return (
    <div
      className={`px-3 py-2 rounded-md text-sm italic ${className}`}
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
      }}
    >
      {text}
    </div>
  );
}
