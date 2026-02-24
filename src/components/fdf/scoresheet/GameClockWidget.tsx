"use client";

import type { GameClock } from "@/lib/fdf/types";
import { TICKS_PER_QUARTER } from "@/lib/fdf/constants";
import { getClockDisplayTime, isTimingWarningZone } from "@/lib/fdf/game-clock";

interface GameClockWidgetProps {
  clock: GameClock;
}

export function GameClockWidget({ clock }: GameClockWidgetProps) {
  const quarterLabels = ["Q1", "Q2", "Q3", "Q4"];

  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-xs font-bold font-fdf-mono uppercase tracking-wider"
          style={{ color: "var(--fdf-accent)" }}
        >
          Game Clock
        </h3>
        <span
          className="text-sm font-fdf-mono font-bold"
          style={{
            color: isTimingWarningZone(clock.ticksRemaining) && !clock.isGameOver
              ? "#ef4444"
              : "var(--fdf-scoreboard-text)",
          }}
        >
          {clock.isGameOver ? "FINAL" : `${quarterLabels[clock.quarter - 1] || "OT"} ${getClockDisplayTime(clock.ticksRemaining)}`}
        </span>
      </div>

      <div className="space-y-1.5">
        {quarterLabels.map((label, qi) => {
          const quarterNum = qi + 1;
          const isCurrent = clock.quarter === quarterNum;
          const isPast = clock.quarter > quarterNum;
          const elapsed = isPast
            ? TICKS_PER_QUARTER
            : isCurrent
            ? TICKS_PER_QUARTER - clock.ticksRemaining
            : 0;

          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className="text-xs font-fdf-mono font-bold w-6"
                style={{
                  color: isCurrent ? "var(--fdf-accent)" : "var(--fdf-text-muted)",
                }}
              >
                {label}
              </span>
              <div className="flex gap-[3px]">
                {Array.from({ length: TICKS_PER_QUARTER }, (_, ti) => {
                  const isFilled = ti < elapsed;
                  const isWarning = isCurrent && TICKS_PER_QUARTER - ti <= 4 && ti >= elapsed;
                  return (
                    <div
                      key={ti}
                      className="rounded-full"
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: isFilled
                          ? "var(--fdf-accent)"
                          : isWarning
                          ? "rgba(239,68,68,0.25)"
                          : "rgba(148,163,184,0.12)",
                        border: (ti === 3 || ti === 7) && !isFilled
                          ? "1px solid rgba(148,163,184,0.2)"
                          : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
