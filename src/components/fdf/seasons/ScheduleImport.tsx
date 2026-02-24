"use client";

import { useState } from "react";
import { Upload, Cpu, FileText } from "lucide-react";
import type { FdfSeason, FdfTeam, ScheduleGame } from "@/lib/fdf/types";
import { parseScheduleCSV, matchTeamsToSchedule } from "@/lib/fdf/schedule-parser";
import { generateRoundRobinSchedule, generateDivisionSchedule } from "@/lib/fdf/schedule-generator";

type Tab = "csv" | "generate" | "manual";

interface ScheduleImportProps {
  season: FdfSeason;
  teams: FdfTeam[];
  onApply: (games: ScheduleGame[]) => void;
}

export function ScheduleImport({ season, teams, onApply }: ScheduleImportProps) {
  const [tab, setTab] = useState<Tab>("generate");
  const [csvText, setCsvText] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [previewGames, setPreviewGames] = useState<ScheduleGame[] | null>(null);

  const seasonTeams = teams.filter((t) => season.teamIds.includes(t.id));

  const handleParseCSV = () => {
    setParseErrors([]);
    setParseWarnings([]);
    setPreviewGames(null);

    const { rows, errors: parseErrs } = parseScheduleCSV(csvText);
    if (parseErrs.length > 0) {
      setParseErrors(parseErrs);
      return;
    }

    const { games, errors, warnings } = matchTeamsToSchedule(rows, seasonTeams);
    if (errors.length > 0) {
      setParseErrors(errors);
    }
    if (warnings.length > 0) {
      setParseWarnings(warnings);
    }
    if (games.length > 0) {
      setPreviewGames(games);
    }
  };

  const handleGenerate = () => {
    setParseErrors([]);
    setParseWarnings([]);

    let games: ScheduleGame[];
    if (season.divisions.length > 0) {
      games = generateDivisionSchedule(
        season.divisions,
        season.teamIds,
        season.config.totalRegularSeasonWeeks,
        season.config.hasByeWeeks
      );
    } else {
      games = generateRoundRobinSchedule(
        season.teamIds,
        season.config.totalRegularSeasonWeeks,
        season.config.hasByeWeeks
      );
    }

    if (games.length === 0) {
      setParseErrors(["Could not generate schedule — need at least 2 teams"]);
      return;
    }

    setPreviewGames(games);
  };

  const handleApply = () => {
    if (previewGames && previewGames.length > 0) {
      onApply(previewGames);
      setPreviewGames(null);
      setCsvText("");
    }
  };

  const tabs: { value: Tab; label: string; icon: typeof Upload }[] = [
    { value: "generate", label: "Auto Generate", icon: Cpu },
    { value: "csv", label: "Import CSV", icon: Upload },
    { value: "manual", label: "Manual", icon: FileText },
  ];

  const previewWeeks = previewGames
    ? [...new Set(previewGames.map((g) => g.week))].sort((a, b) => a - b)
    : [];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setPreviewGames(null); setParseErrors([]); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-fdf-mono font-bold transition-colors"
              style={{
                backgroundColor: tab === t.value ? "var(--fdf-accent)" : "var(--fdf-bg-primary)",
                color: tab === t.value ? "#fff" : "var(--fdf-text-secondary)",
              }}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* CSV Import */}
      {tab === "csv" && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
            Paste CSV with format: <code className="font-fdf-mono">Week,Away,Home</code>.
            Teams are matched by abbreviation or name. Use &quot;BYE&quot; for bye weeks.
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Week,Away,Home\n1,NYG,DAL\n1,CHI,GB\n1,BYE,MIN`}
            rows={8}
            className="w-full px-3 py-2 rounded text-xs font-fdf-mono resize-y"
            style={{
              backgroundColor: "var(--fdf-bg-primary)",
              border: "1px solid var(--fdf-border)",
              color: "var(--fdf-text-primary)",
            }}
          />
          <button
            onClick={handleParseCSV}
            disabled={!csvText.trim()}
            className="px-4 py-1.5 rounded text-xs font-fdf-mono font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--fdf-accent)" }}
          >
            Parse & Preview
          </button>
        </div>
      )}

      {/* Auto Generate */}
      {tab === "generate" && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
            Auto-generate a {season.config.totalRegularSeasonWeeks}-week schedule for {seasonTeams.length} teams.
            {season.divisions.length > 0
              ? " Division opponents play more frequently."
              : " Uses round-robin scheduling."}
          </p>
          <button
            onClick={handleGenerate}
            disabled={seasonTeams.length < 2}
            className="px-4 py-1.5 rounded text-xs font-fdf-mono font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--fdf-accent)" }}
          >
            Generate Schedule
          </button>
        </div>
      )}

      {/* Manual placeholder */}
      {tab === "manual" && (
        <p className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
          Manual game-by-game entry coming soon. Use CSV import or auto-generate for now.
        </p>
      )}

      {/* Errors */}
      {parseErrors.length > 0 && (
        <div className="rounded p-3 space-y-1" style={{ backgroundColor: "#ef444420", border: "1px solid #ef4444" }}>
          {parseErrors.map((e, i) => (
            <p key={i} className="text-xs font-fdf-mono" style={{ color: "#ef4444" }}>{e}</p>
          ))}
        </div>
      )}

      {/* Warnings */}
      {parseWarnings.length > 0 && (
        <div className="rounded p-3 space-y-1" style={{ backgroundColor: "#f59e0b20", border: "1px solid #f59e0b" }}>
          {parseWarnings.map((w, i) => (
            <p key={i} className="text-xs font-fdf-mono" style={{ color: "#f59e0b" }}>{w}</p>
          ))}
        </div>
      )}

      {/* Preview */}
      {previewGames && previewGames.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-fdf-mono font-bold" style={{ color: "var(--fdf-text-primary)" }}>
              Preview: {previewGames.filter((g) => !g.isBye).length} games across {previewWeeks.length} weeks
            </h4>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 rounded text-xs font-fdf-mono font-bold text-white"
              style={{ backgroundColor: "#22c55e" }}
            >
              Apply Schedule
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto rounded p-2 space-y-0.5" style={{ backgroundColor: "var(--fdf-bg-primary)" }}>
            {previewWeeks.slice(0, 5).map((week) => {
              const weekGames = previewGames.filter((g) => g.week === week);
              return (
                <div key={week}>
                  <p className="text-[10px] font-fdf-mono font-bold mb-0.5" style={{ color: "var(--fdf-accent)" }}>
                    Week {week}
                  </p>
                  {weekGames.map((g) => {
                    if (g.isBye) {
                      const team = teams.find((t) => t.id === g.homeTeamId);
                      return (
                        <p key={g.id} className="text-[10px] font-fdf-mono ml-2" style={{ color: "var(--fdf-text-muted)" }}>
                          {team?.abbreviation || "???"} — BYE
                        </p>
                      );
                    }
                    const away = teams.find((t) => t.id === g.awayTeamId);
                    const home = teams.find((t) => t.id === g.homeTeamId);
                    return (
                      <p key={g.id} className="text-[10px] font-fdf-mono ml-2" style={{ color: "var(--fdf-text-secondary)" }}>
                        {away?.abbreviation || "???"} @ {home?.abbreviation || "???"}
                      </p>
                    );
                  })}
                </div>
              );
            })}
            {previewWeeks.length > 5 && (
              <p className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                + {previewWeeks.length - 5} more weeks...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
