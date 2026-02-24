"use client";

import { useRef, useEffect } from "react";
import { Check } from "lucide-react";
import type { FdfSeason } from "@/lib/fdf/types";

interface WeekNavigationProps {
  season: FdfSeason;
  selectedWeek: number;
  onSelectWeek: (week: number) => void;
}

export function WeekNavigation({ season, selectedWeek, onSelectWeek }: WeekNavigationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Gather all unique weeks
  const weeks = [...new Set(season.schedule.map((g) => g.week))].sort((a, b) => a - b);

  // Check if all games in a week are completed
  const isWeekComplete = (week: number) => {
    const weekGames = season.schedule.filter((g) => g.week === week && !g.isBye);
    return weekGames.length > 0 && weekGames.every((g) => g.result);
  };

  // Scroll active week into view
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedWeek]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin"
      style={{ scrollbarColor: "var(--fdf-border) transparent" }}
    >
      {weeks.map((week) => {
        const isActive = week === selectedWeek;
        const complete = isWeekComplete(week);
        const isPlayoff = season.schedule.some((g) => g.week === week && g.isPlayoff);

        return (
          <button
            key={week}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelectWeek(week)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-fdf-mono font-bold whitespace-nowrap transition-colors flex-shrink-0"
            style={{
              backgroundColor: isActive ? "var(--fdf-accent)" : "var(--fdf-bg-card)",
              color: isActive ? "#fff" : "var(--fdf-text-secondary)",
              border: `1px solid ${isActive ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
            }}
          >
            {complete && <Check size={12} className="text-green-400" />}
            {isPlayoff ? `PO ${week - season.config.totalRegularSeasonWeeks}` : `W${week}`}
          </button>
        );
      })}
    </div>
  );
}
