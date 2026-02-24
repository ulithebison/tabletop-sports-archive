"use client";

import { useState, useRef } from "react";
import { Download, Upload, AlertTriangle, CheckCircle, FileJson } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/fdf/constants";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useGameStore } from "@/lib/fdf/stores/game-store";
import { useSeasonStore } from "@/lib/fdf/stores/season-store";

const EXPORT_VERSION = 1;

interface FdfBackup {
  version: number;
  exportedAt: string;
  teams: Record<string, unknown>;
  games: Record<string, unknown>;
  seasons: Record<string, unknown>;
  settings: unknown;
}

interface ImportPreview {
  teamCount: number;
  gameCount: number;
  seasonCount: number;
  hasSettings: boolean;
  raw: FdfBackup;
}

function validateBackup(data: unknown): data is FdfBackup {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.version !== "number") return false;
  if (typeof obj.exportedAt !== "string") return false;
  if (!obj.teams || typeof obj.teams !== "object") return false;
  if (!obj.games || typeof obj.games !== "object") return false;
  if (!obj.seasons || typeof obj.seasons !== "object") return false;
  return true;
}

export default function DataPage() {
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const teamCount = Object.keys(useTeamStore((s) => s.teams)).length;
  const gameCount = Object.keys(useGameStore((s) => s.games)).length;
  const seasonCount = Object.keys(useSeasonStore((s) => s.seasons)).length;

  const handleExport = () => {
    const teams = useTeamStore.getState().teams;
    const games = useGameStore.getState().games;
    const seasons = useSeasonStore.getState().seasons;

    // Read settings directly from localStorage (no dedicated store)
    let settings: unknown = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) settings = JSON.parse(raw);
    } catch { /* ignore */ }

    const backup: FdfBackup = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      teams,
      games,
      seasons,
      settings,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fdf-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    setImportPreview(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!validateBackup(data)) {
          setImportError("Invalid backup file. Missing required fields (version, teams, games, seasons).");
          return;
        }
        setImportPreview({
          teamCount: Object.keys(data.teams).length,
          gameCount: Object.keys(data.games).length,
          seasonCount: Object.keys(data.seasons).length,
          hasSettings: data.settings != null,
          raw: data,
        });
      } catch {
        setImportError("Could not parse file. Make sure it is a valid JSON backup.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importPreview) return;
    const { raw } = importPreview;

    // Replace all stores via setState — Zustand persist middleware auto-writes to localStorage
    useTeamStore.setState({ teams: raw.teams as ReturnType<typeof useTeamStore.getState>["teams"] });
    useGameStore.setState({ games: raw.games as ReturnType<typeof useGameStore.getState>["games"] });
    useSeasonStore.setState({ seasons: raw.seasons as ReturnType<typeof useSeasonStore.getState>["seasons"] });

    // Write settings directly to localStorage
    if (raw.settings != null) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(raw.settings));
    }

    setImportSuccess(true);
    setImportPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancel = () => {
    setImportPreview(null);
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
          Data Management
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--fdf-text-muted)" }}>
          Export your data as a backup or import from a previous backup file.
        </p>
      </div>

      {/* Current Data Summary */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <h2
          className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-3"
          style={{ color: "var(--fdf-accent)" }}
        >
          Current Data
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Teams", count: teamCount },
            { label: "Games", count: gameCount },
            { label: "Seasons", count: seasonCount },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-2xl font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
                {item.count}
              </p>
              <p className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Export Section */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <h2
          className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-2"
          style={{ color: "var(--fdf-accent)" }}
        >
          Export
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--fdf-text-secondary)" }}>
          Download all teams, games, seasons, and settings as a single JSON file.
        </p>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: "var(--fdf-accent)" }}
        >
          <Download size={16} />
          Export All Data
        </button>
      </div>

      {/* Import Section */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <h2
          className="text-xs font-bold font-fdf-mono uppercase tracking-wider mb-2"
          style={{ color: "var(--fdf-accent)" }}
        >
          Import
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--fdf-text-secondary)" }}>
          Restore from a previously exported backup file. This will replace all current data.
        </p>

        <label
          className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-colors w-fit"
          style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
        >
          <FileJson size={16} />
          Choose Backup File
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>

        {/* Error */}
        {importError && (
          <div
            className="flex items-start gap-2 mt-4 p-3 rounded-md text-sm"
            style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
          >
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            {importError}
          </div>
        )}

        {/* Preview */}
        {importPreview && (
          <div className="mt-4 space-y-3">
            <div
              className="p-3 rounded-md"
              style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}
            >
              <p className="text-xs font-fdf-mono font-bold mb-2" style={{ color: "var(--fdf-text-primary)" }}>
                Backup Contents:
              </p>
              <div className="space-y-1 text-xs font-fdf-mono" style={{ color: "var(--fdf-text-secondary)" }}>
                <p>{importPreview.teamCount} team{importPreview.teamCount !== 1 ? "s" : ""}</p>
                <p>{importPreview.gameCount} game{importPreview.gameCount !== 1 ? "s" : ""}</p>
                <p>{importPreview.seasonCount} season{importPreview.seasonCount !== 1 ? "s" : ""}</p>
                {importPreview.hasSettings && <p>Settings included</p>}
              </div>
            </div>

            <div
              className="flex items-start gap-2 p-3 rounded-md text-sm"
              style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }}
            >
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              This will replace all current data. This cannot be undone.
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: "#dc2626" }}
              >
                <Upload size={16} />
                Replace All Data
              </button>
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
                style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {importSuccess && (
          <div
            className="flex items-start gap-2 mt-4 p-3 rounded-md text-sm"
            style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}
          >
            <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
            Data imported successfully. All stores have been updated.
          </div>
        )}
      </div>
    </div>
  );
}
