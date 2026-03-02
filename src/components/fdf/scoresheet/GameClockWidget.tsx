"use client";

import type { GameClock, GameMode, OvertimeState } from "@/lib/fdf/types";
import { getTimingConfig } from "@/lib/fdf/constants";
import { getClockDisplayTime, isTimingWarningZone } from "@/lib/fdf/game-clock";

interface GameClockWidgetProps {
  clock: GameClock;
  overtimeState?: OvertimeState;
  gameMode?: GameMode;
}

export function GameClockWidget({ clock, overtimeState, gameMode }: GameClockWidgetProps) {
  const config = getTimingConfig(gameMode);
  const quarterLabels = ["Q1", "Q2", "Q3", "Q4"];
  const isFAC = gameMode === "fac";

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
            color: isTimingWarningZone(clock.ticksRemaining, config.warningZoneTicks) && !clock.isGameOver
              ? "#ef4444"
              : "var(--fdf-scoreboard-text)",
          }}
        >
          {clock.isGameOver ? "FINAL" : `${quarterLabels[clock.quarter - 1] || "OT"} ${getClockDisplayTime(clock.ticksRemaining, config.secondsPerTick)}`}
        </span>
      </div>

      <div className="space-y-1.5">
        {quarterLabels.map((label, qi) => {
          const quarterNum = qi + 1;
          const isCurrent = clock.quarter === quarterNum;
          const isPast = clock.quarter > quarterNum;
          const elapsed = isPast
            ? config.ticksPerQuarter
            : isCurrent
            ? config.ticksPerQuarter - clock.ticksRemaining
            : 0;
          const pct = (elapsed / config.ticksPerQuarter) * 100;
          const warningPct = ((config.ticksPerQuarter - config.warningZoneTicks) / config.ticksPerQuarter) * 100;

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
              {isFAC ? (
                /* FAC: progress bar */
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden relative"
                  style={{ backgroundColor: "rgba(148,163,184,0.12)" }}
                >
                  {/* Warning zone indicator */}
                  {isCurrent && (
                    <div
                      className="absolute top-0 bottom-0 rounded-r-full"
                      style={{
                        left: `${warningPct}%`,
                        right: 0,
                        backgroundColor: "rgba(239,68,68,0.15)",
                      }}
                    />
                  )}
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= warningPct && isCurrent
                        ? "#ef4444"
                        : "var(--fdf-accent)",
                    }}
                  />
                </div>
              ) : (
                /* Dice: dot indicators */
                <div className="flex gap-[3px]">
                  {Array.from({ length: config.ticksPerQuarter }, (_, ti) => {
                    const isFilled = ti < elapsed;
                    const isWarning = isCurrent && config.ticksPerQuarter - ti <= config.warningZoneTicks && ti >= elapsed;
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
              )}
              {isFAC && (
                <span
                  className="text-[10px] font-fdf-mono w-5 text-right"
                  style={{ color: "var(--fdf-text-muted)" }}
                >
                  {isPast ? 0 : isCurrent ? clock.ticksRemaining : config.ticksPerQuarter}
                </span>
              )}
            </div>
          );
        })}

        {/* OT row — shown when in OT (Q5) or game completed with OT */}
        {(clock.quarter === 5 || overtimeState) && (() => {
          const otTicks = config.ticksPerOTPeriod;
          const isOTCurrent = clock.quarter === 5;
          const isOTPast = clock.isGameOver && clock.quarter === 5;
          const otElapsed = isOTPast
            ? otTicks
            : isOTCurrent
            ? otTicks - clock.ticksRemaining
            : 0;
          const otPct = (otElapsed / otTicks) * 100;
          const otWarningPct = ((otTicks - config.warningZoneTicks) / otTicks) * 100;

          return (
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-fdf-mono font-bold w-6"
                style={{
                  color: clock.quarter === 5 ? "var(--fdf-accent)" : "var(--fdf-text-muted)",
                }}
              >
                OT
              </span>
              {isFAC ? (
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden relative"
                  style={{ backgroundColor: "rgba(148,163,184,0.12)" }}
                >
                  {isOTCurrent && (
                    <div
                      className="absolute top-0 bottom-0 rounded-r-full"
                      style={{
                        left: `${otWarningPct}%`,
                        right: 0,
                        backgroundColor: "rgba(239,68,68,0.15)",
                      }}
                    />
                  )}
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${otPct}%`,
                      backgroundColor: otPct >= otWarningPct && isOTCurrent
                        ? "#ef4444"
                        : "var(--fdf-accent)",
                    }}
                  />
                </div>
              ) : (
                <div className="flex gap-[3px]">
                  {Array.from({ length: otTicks }, (_, ti) => {
                    const isFilled = ti < otElapsed;
                    const isWarning = isOTCurrent && otTicks - ti <= config.warningZoneTicks && ti >= otElapsed;
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
                          border: (ti === 3) && !isFilled
                            ? "1px solid rgba(148,163,184,0.2)"
                            : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              )}
              {isFAC && (
                <span
                  className="text-[10px] font-fdf-mono w-5 text-right"
                  style={{ color: "var(--fdf-text-muted)" }}
                >
                  {isOTPast ? 0 : isOTCurrent ? clock.ticksRemaining : otTicks}
                </span>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
