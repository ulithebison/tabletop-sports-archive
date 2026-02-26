"use client";

import { useState, useRef } from "react";
import { X, Upload, ChevronLeft, AlertTriangle, FileText } from "lucide-react";
import { parseTeamImport, toTeamData } from "@/lib/fdf/team-import";
import type { ParsedTeamImport } from "@/lib/fdf/team-import";
import { useTeamStore } from "@/lib/fdf/stores/team-store";

interface TeamImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}

export function TeamImportModal({ isOpen, onClose, onImported }: TeamImportModalProps) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedTeamImport[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTeam = useTeamStore((s) => s.addTeam);
  const existingTeams = useTeamStore((s) => s.teams);
  const existingAbbreviations = new Set(Object.values(existingTeams).map(t => t.abbreviation));

  if (!isOpen) return null;

  const handleParse = () => {
    const result = parseTeamImport(text);
    setErrors(result.errors);
    setWarnings(result.warnings);
    if (result.teams.length > 0 && result.errors.length === 0) {
      setPreview(result.teams);
    } else {
      setPreview(null);
    }
  };

  const handleImport = () => {
    if (!preview) return;
    let count = 0;
    for (const team of preview) {
      addTeam(toTeamData(team));
      count++;
    }
    onImported(count);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setPreview(null);
    setErrors([]);
    setWarnings([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === "string") {
        setText(content);
        setPreview(null);
        setErrors([]);
        setWarnings([]);
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be re-selected
    e.target.value = "";
  };

  const handleClose = () => {
    setText("");
    handleReset();
    onClose();
  };

  const countQualities = (team: ParsedTeamImport): number => {
    const q = team.qualities;
    let count = 0;
    if (q.offense.scoring) count++;
    if (q.offense.yards) count++;
    if (q.offense.protection) count++;
    if (q.offense.ballSecurity) count++;
    if (q.offense.fumbles) count++;
    if (q.offense.discipline) count++;
    if (q.offense.clockManagement) count++;
    if (q.offense.scoringTendency) count++;
    if (q.defense.scoring) count++;
    if (q.defense.yards) count++;
    if (q.defense.passRush) count++;
    if (q.defense.coverage) count++;
    if (q.defense.fumbleRecovery) count++;
    if (q.defense.discipline) count++;
    if (q.specialTeams.kickReturn) count++;
    if (q.specialTeams.puntReturn) count++;
    return count;
  };

  const countRoster = (team: ParsedTeamImport): number => {
    if (!team.finderRoster) return 0;
    const r = team.finderRoster;
    return r.rushingTD.length + r.passingTD.length + r.receivingTD.length + r.kickingFGXP.length;
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--fdf-bg-elevated)",
    color: "var(--fdf-text-primary)",
    border: "1px solid var(--fdf-border)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-xl rounded-lg p-5 mx-4 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {preview && (
              <button
                type="button"
                onClick={handleReset}
                className="p-1 rounded hover:opacity-80"
                style={{ color: "var(--fdf-text-muted)" }}
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <h3
              className="text-sm font-bold font-fdf-mono uppercase tracking-wider"
              style={{ color: "var(--fdf-accent)" }}
            >
              {preview ? "Preview Import" : "Import Teams"}
            </h3>
          </div>
          <button type="button" onClick={handleClose} className="p-1 rounded" style={{ color: "var(--fdf-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Input view */}
        {!preview && (
          <>
            <p className="text-xs mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
              Paste team data or upload a <span className="font-fdf-mono">.txt</span> file. Separate multiple teams with <span className="font-fdf-mono">---</span>
            </p>

            {/* Format guide */}
            <details
              open={guideOpen}
              onToggle={(e) => setGuideOpen((e.target as HTMLDetailsElement).open)}
              className="mb-3"
            >
              <summary
                className="text-[11px] font-fdf-mono uppercase tracking-wider cursor-pointer select-none"
                style={{ color: "var(--fdf-text-muted)" }}
              >
                Format Guide
              </summary>
              <pre
                className="text-[10px] font-fdf-mono mt-2 p-3 rounded overflow-x-auto whitespace-pre leading-relaxed"
                style={{
                  backgroundColor: "var(--fdf-bg-elevated)",
                  color: "var(--fdf-text-secondary)",
                  border: "1px solid var(--fdf-border)",
                }}
              >{`NAME: Green Bay Packers
ABR: GB
SEASON: 2024
LEAGUE: NFL
CONFERENCE: NFC
DIVISION: North
RECORD: 12-5
HEAD COACH: Matt LaFleur
COLOR: #203731
COLOR2: #FFB612
FG: 11-62
XP: 11-63

OFFENSE
Scoring: PROLIFIC
Yards: DYNAMIC*
Tendency: P

DEFENSE
Scoring: STAUNCH*
Yards: STIFF

SPECIAL TEAMS
KR: ELECTRIC*

RUSHING TD
Josh Jacobs, 11-40
Emanuel Wilson, 41-55

PASSING TD
Jordan Love, 11-66

RECEIVING TD
Jayden Reed, 11-33
Romeo Doubs, 34-55

FG & XP
Brayden Narveson, 11-62`}</pre>
              <p
                className="text-[10px] mt-1.5 font-fdf-mono"
                style={{ color: "var(--fdf-text-muted)" }}
              >
                * = semi quality | — = none | Only NAME &amp; ABR required
              </p>
            </details>

            {/* Textarea + file picker */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder={"NAME: Team Name\nABR: TM\n\nOFFENSE\nScoring: PROLIFIC\n...\n\nRUSHING TD\nPlayer Name, 11-40"}
              className="w-full rounded px-3 py-2.5 text-xs font-fdf-mono mb-3 resize-y"
              style={inputStyle}
              autoFocus
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json,.text"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Errors */}
            {errors.length > 0 && (
              <div
                className="rounded p-3 mb-3 text-xs"
                style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                {errors.map((err, i) => (
                  <p key={i} className="font-fdf-mono" style={{ color: "#ef4444" }}>
                    {err}
                  </p>
                ))}
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div
                className="rounded p-3 mb-3 text-xs"
                style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                {warnings.map((w, i) => (
                  <p key={i} className="font-fdf-mono" style={{ color: "#f59e0b" }}>
                    {w}
                  </p>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleParse}
                disabled={!text.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: "var(--fdf-accent)" }}
              >
                Parse &amp; Preview
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium"
                style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
              >
                <FileText size={12} />
                Upload File
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-md text-xs font-medium ml-auto"
                style={{ color: "var(--fdf-text-muted)" }}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Preview view */}
        {preview && (
          <>
            {/* Warnings in preview */}
            {warnings.length > 0 && (
              <div
                className="rounded p-3 mb-3 text-xs"
                style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                {warnings.map((w, i) => (
                  <p key={i} className="font-fdf-mono" style={{ color: "#f59e0b" }}>
                    {w}
                  </p>
                ))}
              </div>
            )}

            {/* Team preview cards */}
            <div className="space-y-2 mb-4">
              {preview.map((team, i) => {
                const isDuplicate = existingAbbreviations.has(team.abbreviation);
                const qualityCount = countQualities(team);
                const rosterCount = countRoster(team);

                return (
                  <div
                    key={i}
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: "var(--fdf-bg-elevated)",
                      border: "1px solid var(--fdf-border)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color swatches */}
                      <div className="flex gap-1 shrink-0">
                        <div
                          className="w-5 h-5 rounded"
                          style={{ backgroundColor: team.primaryColor, border: "1px solid rgba(255,255,255,0.15)" }}
                        />
                        <div
                          className="w-5 h-5 rounded"
                          style={{ backgroundColor: team.secondaryColor, border: "1px solid rgba(255,255,255,0.15)" }}
                        />
                      </div>

                      {/* Name + abbreviation */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-fdf-mono truncate" style={{ color: "var(--fdf-text-primary)" }}>
                            {team.name}
                          </span>
                          <span
                            className="text-[10px] font-fdf-mono px-1.5 py-0.5 rounded shrink-0"
                            style={{ backgroundColor: "var(--fdf-bg-card)", color: "var(--fdf-text-muted)" }}
                          >
                            {team.abbreviation}
                          </span>
                        </div>
                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className="text-[10px] font-fdf-mono px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "var(--fdf-accent)" }}
                          >
                            {team.league}
                          </span>
                          {team.season && (
                            <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                              {team.season}
                            </span>
                          )}
                          <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                            {qualityCount} qualities
                          </span>
                          <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                            {rosterCount} players
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Duplicate warning */}
                    {isDuplicate && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-fdf-mono" style={{ color: "#f59e0b" }}>
                        <AlertTriangle size={10} />
                        Team with abbreviation &quot;{team.abbreviation}&quot; already exists
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Import actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleImport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold text-white"
                style={{ backgroundColor: "var(--fdf-accent)" }}
              >
                <Upload size={12} />
                Import {preview.length} Team{preview.length !== 1 ? "s" : ""}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-md text-xs font-medium ml-auto"
                style={{ color: "var(--fdf-text-muted)" }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
