"use client";

interface TickCirclesProps {
  filled: number;
  total: number;
  filledColor?: string;
  emptyColor?: string;
  size?: number;
}

export function TickCircles({
  filled,
  total,
  filledColor = "var(--fdf-accent, #3b82f6)",
  emptyColor = "rgba(148,163,184,0.2)",
  size = 10,
}: TickCirclesProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="rounded-full flex-shrink-0"
          style={{
            width: size,
            height: size,
            backgroundColor: i < filled ? filledColor : emptyColor,
          }}
        />
      ))}
    </div>
  );
}
