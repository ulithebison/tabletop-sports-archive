"use client";

import { useState, useCallback } from "react";
import { X, Trophy } from "lucide-react";
import type { CommissionerLeague } from "@/lib/fdf/commissioner/types";

interface SeasonSettings {
  name: string;
  year: number;
  regularSeasonWeeks: number;
  playoffTeams: number;
  hasByeWeeks: boolean;
  homeFieldInPlayoffs: boolean;
  canEndInTie: boolean;
}

interface SeasonSettingsModalProps {
  league: CommissionerLeague;
  onConfirm: (settings: SeasonSettings) => void;
  onClose: () => void;
}

export function SeasonSettingsModal({ league, onConfirm, onClose }: SeasonSettingsModalProps) {
  const [settings, setSettings] = useState<SeasonSettings>({
    name: `${league.name} Season ${league.currentSeason}`,
    year: new Date().getFullYear(),
    regularSeasonWeeks: league.settings.seasonLength || 17,
    playoffTeams: league.settings.playoffTeams || 6,
    hasByeWeeks: true,
    homeFieldInPlayoffs: true,
    canEndInTie: true,
  });

  const update = useCallback(<K extends keyof SeasonSettings>(key: K, value: SeasonSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-md mx-4 rounded-lg shadow-xl"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--fdf-border)" }}>
          <div className="flex items-center gap-2">
            <Trophy size={16} style={{ color: "var(--fdf-accent)" }} />
            <h3 className="text-sm font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
              Season Settings
            </h3>
          </div>
          <button onClick={onClose} type="button" style={{ color: "var(--fdf-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-4">
          {/* Season Name */}
          <div>
            <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-muted)" }}>
              Season Name
            </label>
            <input
              value={settings.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-muted)" }}>
              Year
            </label>
            <input
              type="number"
              value={settings.year}
              onChange={(e) => update("year", Number(e.target.value))}
              className="w-28 px-3 py-2 rounded text-sm"
              style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
            />
          </div>

          {/* Regular Season Weeks + Playoff Teams */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-muted)" }}>
                Regular Season Weeks
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.regularSeasonWeeks}
                onChange={(e) => update("regularSeasonWeeks", Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                className="w-full px-3 py-2 rounded text-sm"
                style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-muted)" }}>
                Playoff Teams
              </label>
              <select
                value={settings.playoffTeams}
                onChange={(e) => update("playoffTeams", Number(e.target.value))}
                className="w-full px-3 py-2 rounded text-sm"
                style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
              >
                {[2, 4, 6, 7, 8, 12, 14, 16].map((n) => (
                  <option key={n} value={n}>{n} teams</option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.hasByeWeeks}
                onChange={(e) => update("hasByeWeeks", e.target.checked)}
              />
              <span className="text-sm" style={{ color: "var(--fdf-text-secondary)" }}>Bye Weeks</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.homeFieldInPlayoffs}
                onChange={(e) => update("homeFieldInPlayoffs", e.target.checked)}
              />
              <span className="text-sm" style={{ color: "var(--fdf-text-secondary)" }}>Home Field Advantage in Playoffs</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.canEndInTie}
                onChange={(e) => update("canEndInTie", e.target.checked)}
              />
              <span className="text-sm" style={{ color: "var(--fdf-text-secondary)" }}>Regular Season OT Can End in Tie</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3" style={{ borderTop: "1px solid var(--fdf-border)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(settings)}
            className="px-4 py-2 rounded text-sm font-bold text-white"
            style={{ backgroundColor: "var(--fdf-accent)" }}
            type="button"
          >
            Create Season
          </button>
        </div>
      </div>
    </div>
  );
}
