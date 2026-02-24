"use client";

import { useState } from "react";
import type { DriveResultType } from "@/lib/fdf/types";
import { DRIVE_RESULT_CATEGORIES } from "@/lib/fdf/constants";

interface DriveResultPickerProps {
  value: DriveResultType | null;
  onChange: (result: DriveResultType) => void;
}

type CategoryKey = "scoring" | "turnover" | "special" | "returnTDs" | "kickPunt";

const CATEGORY_META: { key: CategoryKey; label: string; color: string }[] = [
  { key: "scoring", label: "Scoring", color: "var(--fdf-td)" },
  { key: "turnover", label: "Turnover", color: "var(--fdf-turnover)" },
  { key: "kickPunt", label: "Kick-Off/Punt", color: "var(--fdf-punt, var(--fdf-text-secondary))" },
  { key: "returnTDs", label: "Return TDs", color: "var(--fdf-desperation, #ec4899)" },
  { key: "special", label: "Special", color: "var(--fdf-unusual)" },
];

function getResultColor(result: DriveResultType): string {
  if (result.startsWith("TD_") || result === "DESPERATION_TD") return "var(--fdf-td)";
  if (result.startsWith("FGA_") || result === "DESPERATION_FGA") return "var(--fdf-fg)";
  if (result === "SAFETY") return "var(--fdf-safety)";
  if (result.startsWith("KICK_PUNT_")) return "var(--fdf-turnover)";
  if (result === "INTERCEPTION" || result === "FUMBLE" || result === "TURNOVER_ON_DOWNS") return "var(--fdf-turnover)";
  if (result.startsWith("PUNT")) return "var(--fdf-punt)";
  if (result.includes("RETURN_TD") || result === "BLOCKED_PUNT_TD") return "var(--fdf-desperation, #ec4899)";
  if (result === "DESPERATION_PLAY" || result === "UNUSUAL_RESULT") return "var(--fdf-unusual)";
  return "var(--fdf-text-muted)";
}

export function DriveResultPicker({ value, onChange }: DriveResultPickerProps) {
  const [activeTab, setActiveTab] = useState<CategoryKey>("scoring");
  const [kickPuntStep, setKickPuntStep] = useState<"choose" | "kickRecoversSub">("choose");

  const isKickPuntTab = activeTab === "kickPunt";

  const handleTabChange = (key: CategoryKey) => {
    setActiveTab(key);
    if (key === "kickPunt") {
      setKickPuntStep("choose");
    }
  };

  const handleKickPuntSelect = (result: DriveResultType) => {
    onChange(result);
    setKickPuntStep("choose");
  };

  return (
    <div>
      <label
        className="block text-xs font-bold font-fdf-mono uppercase tracking-wider mb-1.5"
        style={{ color: "var(--fdf-text-secondary)" }}
      >
        Drive Result
      </label>

      {/* Category tabs */}
      <div className="flex gap-1 mb-2">
        {CATEGORY_META.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => handleTabChange(cat.key)}
            className="px-2.5 py-1 rounded text-xs font-fdf-mono font-medium transition-colors"
            style={{
              backgroundColor: activeTab === cat.key ? "var(--fdf-bg-elevated)" : "transparent",
              color: activeTab === cat.key ? cat.color : "var(--fdf-text-muted)",
              border: activeTab === cat.key ? `1px solid var(--fdf-border)` : "1px solid transparent",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Kick-Off/Punt hybrid: standard punt buttons + multi-step fumble recovery */}
      {isKickPuntTab ? (
        <div className="space-y-3">
          {/* Standard punt buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            {DRIVE_RESULT_CATEGORIES.kickPunt
              .filter((r) => !r.value.startsWith("KICK_PUNT_"))
              .map((r) => {
                const active = value === r.value;
                const color = getResultColor(r.value);
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => onChange(r.value)}
                    className="px-2 py-1.5 rounded text-xs font-fdf-mono font-medium transition-all text-left"
                    style={{
                      backgroundColor: active ? color : "var(--fdf-bg-elevated)",
                      color: active ? "#000" : color,
                      border: `1px solid ${active ? color : "var(--fdf-border)"}`,
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--fdf-border)" }} />
            <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>Fumble Recovery</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--fdf-border)" }} />
          </div>

          {/* Multi-step fumble recovery flow */}
          {kickPuntStep === "choose" && (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleKickPuntSelect("KICK_PUNT_REC_RECOVERS")}
                className="px-3 py-2.5 rounded text-xs font-fdf-mono font-medium transition-all text-left"
                style={{
                  backgroundColor: value === "KICK_PUNT_REC_RECOVERS" ? "var(--fdf-turnover)" : "var(--fdf-bg-elevated)",
                  color: value === "KICK_PUNT_REC_RECOVERS" ? "#000" : "var(--fdf-turnover)",
                  border: `1px solid ${value === "KICK_PUNT_REC_RECOVERS" ? "var(--fdf-turnover)" : "var(--fdf-border)"}`,
                }}
              >
                Recv. Team Recovers
              </button>
              <button
                type="button"
                onClick={() => setKickPuntStep("kickRecoversSub")}
                className="px-3 py-2.5 rounded text-xs font-fdf-mono font-medium transition-all text-left"
                style={{
                  backgroundColor: (value === "KICK_PUNT_KICK_RECOVERS" || value === "KICK_PUNT_KICK_TD")
                    ? "var(--fdf-turnover)" : "var(--fdf-bg-elevated)",
                  color: (value === "KICK_PUNT_KICK_RECOVERS" || value === "KICK_PUNT_KICK_TD")
                    ? "#000" : "var(--fdf-turnover)",
                  border: `1px solid ${(value === "KICK_PUNT_KICK_RECOVERS" || value === "KICK_PUNT_KICK_TD") ? "var(--fdf-turnover)" : "var(--fdf-border)"}`,
                }}
              >
                Kick. Team Recovers →
              </button>
            </div>
          )}

          {kickPuntStep === "kickRecoversSub" && (
            <>
              <button
                type="button"
                onClick={() => setKickPuntStep("choose")}
                className="text-xs font-fdf-mono font-medium px-2 py-1 rounded transition-colors"
                style={{ color: "var(--fdf-text-muted)", border: "1px solid var(--fdf-border)" }}
              >
                ← Back
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleKickPuntSelect("KICK_PUNT_KICK_RECOVERS")}
                  className="px-3 py-2.5 rounded text-xs font-fdf-mono font-medium transition-all text-left"
                  style={{
                    backgroundColor: value === "KICK_PUNT_KICK_RECOVERS" ? "var(--fdf-turnover)" : "var(--fdf-bg-elevated)",
                    color: value === "KICK_PUNT_KICK_RECOVERS" ? "#000" : "var(--fdf-turnover)",
                    border: `1px solid ${value === "KICK_PUNT_KICK_RECOVERS" ? "var(--fdf-turnover)" : "var(--fdf-border)"}`,
                  }}
                >
                  Field Position
                </button>
                <button
                  type="button"
                  onClick={() => handleKickPuntSelect("KICK_PUNT_KICK_TD")}
                  className="px-3 py-2.5 rounded text-xs font-fdf-mono font-medium transition-all text-left"
                  style={{
                    backgroundColor: value === "KICK_PUNT_KICK_TD" ? "var(--fdf-td)" : "var(--fdf-bg-elevated)",
                    color: value === "KICK_PUNT_KICK_TD" ? "#000" : "var(--fdf-td)",
                    border: `1px solid ${value === "KICK_PUNT_KICK_TD" ? "var(--fdf-td)" : "var(--fdf-border)"}`,
                  }}
                >
                  Touchdown +6
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Standard result buttons */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {DRIVE_RESULT_CATEGORIES[activeTab].map((r) => {
            const active = value === r.value;
            const color = getResultColor(r.value);
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => onChange(r.value)}
                className="px-2 py-1.5 rounded text-xs font-fdf-mono font-medium transition-all text-left"
                style={{
                  backgroundColor: active ? color : "var(--fdf-bg-elevated)",
                  color: active ? "#000" : color,
                  border: `1px solid ${active ? color : "var(--fdf-border)"}`,
                }}
              >
                {r.label}
                {r.points > 0 && (
                  <span className="ml-1 opacity-60">+{r.points}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
