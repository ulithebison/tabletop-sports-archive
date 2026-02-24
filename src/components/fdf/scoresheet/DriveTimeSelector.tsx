"use client";

interface DriveTimeSelectorProps {
  value: number;
  onChange: (ticks: number) => void;
  maxTicks?: number;
}

export function DriveTimeSelector({ value, onChange, maxTicks = 4 }: DriveTimeSelectorProps) {
  return (
    <div>
      <label
        className="block text-xs font-bold font-fdf-mono uppercase tracking-wider mb-1.5"
        style={{ color: "var(--fdf-text-secondary)" }}
      >
        Drive Time (Ticks)
      </label>
      <div className="flex gap-2">
        {Array.from({ length: maxTicks }, (_, i) => {
          const ticks = i + 1;
          const active = value === ticks;
          return (
            <button
              key={ticks}
              type="button"
              onClick={() => onChange(ticks)}
              className="flex items-center justify-center gap-0.5 px-2.5 py-2 rounded-md transition-all"
              style={{
                backgroundColor: active ? "var(--fdf-accent)" : "var(--fdf-bg-elevated)",
                border: `1px solid ${active ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
              }}
            >
              {Array.from({ length: ticks }, (_, j) => (
                <div
                  key={j}
                  className="rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: active ? "#fff" : "var(--fdf-accent)",
                  }}
                />
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
