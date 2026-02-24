"use client";

import { Trophy, Star, Shield, Zap, Target } from "lucide-react";
import type { SeasonAward, SeasonAwardType, PlayerOfTheWeek, FdfTeam } from "@/lib/fdf/types";

interface SeasonAwardsViewProps {
  awards: SeasonAward[];
  playersOfTheWeek: PlayerOfTheWeek[];
  getTeam: (id: string) => FdfTeam | undefined;
}

const AWARD_CONFIG: Record<SeasonAwardType, {
  label: string;
  icon: typeof Trophy;
  borderColor: string;
  bgColor: string;
}> = {
  MVP: { label: "Most Valuable Player", icon: Trophy, borderColor: "#f59e0b", bgColor: "#f59e0b15" },
  OPOY: { label: "Offensive Player of the Year", icon: Star, borderColor: "#3b82f6", bgColor: "#3b82f615" },
  DPOY: { label: "Defensive Player of the Year", icon: Shield, borderColor: "#ef4444", bgColor: "#ef444415" },
  CLUTCH: { label: "Clutch Performer", icon: Zap, borderColor: "#a855f7", bgColor: "#a855f715" },
  BEST_TURNOVER_TEAM: { label: "Turnover Battle", icon: Target, borderColor: "#22c55e", bgColor: "#22c55e15" },
};

export function SeasonAwardsView({ awards, playersOfTheWeek, getTeam }: SeasonAwardsViewProps) {
  if (awards.length === 0 && playersOfTheWeek.length === 0) {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <Trophy size={24} className="mx-auto mb-2" style={{ color: "var(--fdf-text-muted)" }} />
        <p className="text-sm font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
          No awards to display.
        </p>
        <p className="text-xs font-fdf-mono mt-1" style={{ color: "var(--fdf-text-muted)" }}>
          Awards are determined from manually played games only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Major awards */}
      {awards.length > 0 && (
        <div>
          <h3 className="text-[10px] font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
            Season Awards
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {awards.map((award) => {
              const config = AWARD_CONFIG[award.type];
              const Icon = config.icon;
              const team = getTeam(award.teamId);

              return (
                <div
                  key={award.type}
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: config.bgColor,
                    border: `1px solid ${config.borderColor}40`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} style={{ color: config.borderColor }} />
                    <span className="text-[10px] font-fdf-mono font-bold uppercase tracking-wider" style={{ color: config.borderColor }}>
                      {config.label}
                    </span>
                  </div>
                  {award.isTeamAward ? (
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-3.5 h-3.5 rounded-sm"
                        style={{ backgroundColor: team?.primaryColor || "#666" }}
                      />
                      <span className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                        {team?.name || team?.abbreviation || "???"}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        {award.playerNumber !== undefined && (
                          <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                            #{award.playerNumber}
                          </span>
                        )}
                        <span className="text-sm font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                          {award.playerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ backgroundColor: team?.primaryColor || "#666" }}
                        />
                        <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
                          {team?.abbreviation || "???"}
                        </span>
                      </div>
                    </>
                  )}
                  <p className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                    {award.statLine}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Players of the Week */}
      {playersOfTheWeek.length > 0 && (
        <div>
          <h3 className="text-[10px] font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
            Player of the Week
          </h3>
          <div className="space-y-1">
            {playersOfTheWeek.map((potw) => {
              const team = getTeam(potw.teamId);
              return (
                <div
                  key={potw.week}
                  className="flex items-center gap-3 px-3 py-2 rounded"
                  style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
                >
                  <span className="text-[10px] font-fdf-mono font-bold w-10 flex-shrink-0" style={{ color: "var(--fdf-text-muted)" }}>
                    Wk {potw.week}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: team?.primaryColor || "#666" }}
                  />
                  <span className="text-xs font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                    {potw.playerName}
                  </span>
                  <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
                    ({team?.abbreviation || "???"})
                  </span>
                  <span className="text-[10px] font-fdf-mono ml-auto" style={{ color: "var(--fdf-text-muted)" }}>
                    {potw.statLine}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
