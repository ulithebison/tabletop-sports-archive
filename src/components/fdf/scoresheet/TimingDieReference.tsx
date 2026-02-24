"use client";

import { TIMING_DIE_MAP } from "@/lib/fdf/constants";

export function TimingDieReference() {
  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      <h3
        className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-2"
        style={{ color: "var(--fdf-accent)" }}
      >
        Timing Die
      </h3>
      <div className="grid grid-cols-3 gap-x-3 gap-y-1">
        {Object.entries(TIMING_DIE_MAP).map(([face, ticks]) => (
          <div key={face} className="flex items-center gap-1.5">
            <span
              className="text-xs font-fdf-mono font-bold w-3 text-center"
              style={{ color: "var(--fdf-text-primary)" }}
            >
              {face}
            </span>
            <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>→</span>
            <div className="flex gap-0.5">
              {Array.from({ length: ticks }, (_, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{ width: 6, height: 6, backgroundColor: "var(--fdf-accent)" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
