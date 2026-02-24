"use client";

import { useState, useRef } from "react";
import type { FinderRoster, FinderPlayer } from "@/lib/fdf/types";
import { generateId } from "@/lib/fdf/id";
import { parseTeamFile } from "@/lib/fdf/team-file-parser";
import { FinderRosterImport } from "./FinderRosterImport";
import { ChevronDown, ChevronRight, Plus, Trash2, Upload, FileUp, Pencil, AlertTriangle } from "lucide-react";

export const EMPTY_FINDER_ROSTER: FinderRoster = {
  rushingTD: [],
  passingTD: [],
  receivingTD: [],
  kickingFGXP: [],
};

type FinderCategory = keyof FinderRoster;

const CATEGORY_CONFIG: { key: FinderCategory; label: string; shortLabel: string }[] = [
  { key: "rushingTD", label: "Rushing TD", shortLabel: "Rush" },
  { key: "passingTD", label: "Passing TD", shortLabel: "Pass" },
  { key: "receivingTD", label: "Receiving TD", shortLabel: "Rec" },
  { key: "kickingFGXP", label: "FG & XP", shortLabel: "Kick" },
];

interface FinderRosterEditorProps {
  finderRoster: FinderRoster;
  onChange: (roster: FinderRoster) => void;
}

/**
 * Find an existing player across all categories by matching name + number.
 * Returns the existing player ID if found, to ensure the same physical player
 * shares an ID across categories for stat tracking.
 */
function findExistingPlayerId(roster: FinderRoster, name: string, number?: number): string | undefined {
  const allPlayers = [
    ...roster.rushingTD,
    ...roster.passingTD,
    ...roster.receivingTD,
    ...roster.kickingFGXP,
  ];
  const match = allPlayers.find(
    (p) => p.name.toLowerCase() === name.toLowerCase() && p.number === number
  );
  return match?.id;
}

function totalPlayers(roster: FinderRoster): number {
  const uniqueIds = new Set<string>();
  for (const cat of Object.values(roster)) {
    for (const p of cat as FinderPlayer[]) {
      if (p.name.trim()) uniqueIds.add(p.id);
    }
  }
  return uniqueIds.size;
}

interface CategorySectionProps {
  config: (typeof CATEGORY_CONFIG)[number];
  players: FinderPlayer[];
  roster: FinderRoster;
  onChange: (updated: FinderRoster) => void;
  onOpenImport: (category: FinderCategory) => void;
}

function CategorySection({ config, players, roster, onChange, onOpenImport }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newRange, setNewRange] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const num = newNumber ? parseInt(newNumber, 10) : undefined;
    const existingId = findExistingPlayerId(roster, newName.trim(), isNaN(num ?? NaN) ? undefined : num);
    const player: FinderPlayer = {
      id: existingId || generateId(),
      name: newName.trim(),
      number: num && !isNaN(num) ? num : undefined,
      finderRange: newRange.trim() || undefined,
    };
    onChange({ ...roster, [config.key]: [...roster[config.key], player] });
    setNewName("");
    setNewNumber("");
    setNewRange("");
    // Keep adding open, focus name input
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const handleRemove = (playerId: string) => {
    onChange({ ...roster, [config.key]: roster[config.key].filter(p => p.id !== playerId || p.name !== roster[config.key].find(x => x.id === playerId)?.name) });
    // More precise: filter by array index since same ID can appear
    const idx = roster[config.key].findIndex(p => p.id === playerId);
    if (idx >= 0) {
      const newArr = [...roster[config.key]];
      newArr.splice(idx, 1);
      onChange({ ...roster, [config.key]: newArr });
    }
  };

  const handleUpdate = (index: number, updated: FinderPlayer) => {
    const newArr = [...roster[config.key]];
    newArr[index] = updated;
    onChange({ ...roster, [config.key]: newArr });
    setEditingId(null);
  };

  const inputStyle = {
    backgroundColor: "var(--fdf-bg-elevated)",
    color: "var(--fdf-text-primary)",
    border: "1px solid var(--fdf-border)",
  };

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 flex-1 text-left py-1"
        >
          {expanded
            ? <ChevronDown size={14} style={{ color: "var(--fdf-accent)" }} />
            : <ChevronRight size={14} style={{ color: "var(--fdf-text-muted)" }} />}
          <span className="text-xs font-bold font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
            {config.label}
          </span>
          <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            ({players.length})
          </span>
        </button>
        <button
          type="button"
          onClick={() => onOpenImport(config.key)}
          className="p-1 rounded transition-colors"
          style={{ color: "var(--fdf-text-muted)" }}
          title="Import from text"
        >
          <Upload size={12} />
        </button>
      </div>

      {expanded && (
        <div className="ml-5 mt-1">
          {/* Existing players */}
          {players.map((player, idx) => (
            <div key={`${player.id}-${idx}`} className="flex items-center gap-1.5 py-0.5 group">
              {editingId === `${player.id}-${idx}` ? (
                <EditPlayerInline
                  player={player}
                  onSave={(updated) => handleUpdate(idx, updated)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
                    {player.number != null ? `#${player.number} ` : ""}
                    {player.name}
                  </span>
                  {player.finderRange && (
                    <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                      [{player.finderRange}]
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingId(`${player.id}-${idx}`)}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--fdf-text-muted)" }}
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(player.id)}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#ef4444" }}
                  >
                    <Trash2 size={10} />
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Add player row */}
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 text-[10px] font-fdf-mono mt-1 py-0.5 px-1 rounded transition-colors"
              style={{ color: "var(--fdf-text-muted)" }}
            >
              <Plus size={10} /> Add Player
            </button>
          ) : (
            <div className="mt-1">
              <div className="flex items-center gap-1.5">
                <input
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="#"
                  className="w-10 rounded px-1.5 py-1 text-xs font-fdf-mono text-center"
                  style={inputStyle}
                />
                <input
                  ref={nameInputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Player name"
                  className="flex-1 rounded px-2 py-1 text-xs"
                  style={inputStyle}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                    if (e.key === "Escape") {
                      setAdding(false);
                      setNewName("");
                      setNewNumber("");
                      setNewRange("");
                    }
                  }}
                />
                <input
                  value={newRange}
                  onChange={(e) => setNewRange(e.target.value)}
                  placeholder="11-66"
                  className="w-16 rounded px-1.5 py-1 text-[10px] font-fdf-mono text-center"
                  style={inputStyle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                    if (e.key === "Escape") {
                      setAdding(false);
                      setNewName("");
                      setNewNumber("");
                      setNewRange("");
                    }
                  }}
                />
                <button type="button" onClick={handleAdd} className="p-1 rounded" style={{ color: "#22c55e" }}>
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setNewName(""); setNewNumber(""); setNewRange(""); }}
                  className="p-1 rounded text-sm"
                  style={{ color: "var(--fdf-text-muted)" }}
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditPlayerInline({
  player,
  onSave,
  onCancel,
}: {
  player: FinderPlayer;
  onSave: (updated: FinderPlayer) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(player.name);
  const [number, setNumber] = useState(player.number?.toString() ?? "");
  const [range, setRange] = useState(player.finderRange ?? "");

  const inputStyle = {
    backgroundColor: "var(--fdf-bg-elevated)",
    color: "var(--fdf-text-primary)",
    border: "1px solid var(--fdf-border)",
  };

  const handleSave = () => {
    const num = number ? parseInt(number, 10) : undefined;
    onSave({
      ...player,
      name: name.trim() || player.name,
      number: num && !isNaN(num) ? num : undefined,
      finderRange: range.trim() || undefined,
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="#" className="w-10 rounded px-1.5 py-0.5 text-xs font-fdf-mono text-center" style={inputStyle} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded px-2 py-0.5 text-xs"
        style={inputStyle}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); handleSave(); }
          if (e.key === "Escape") onCancel();
        }}
      />
      <input value={range} onChange={(e) => setRange(e.target.value)} placeholder="11-66" className="w-16 rounded px-1.5 py-0.5 text-[10px] font-fdf-mono text-center" style={inputStyle}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); handleSave(); }
          if (e.key === "Escape") onCancel();
        }}
      />
      <button type="button" onClick={handleSave} className="text-[10px] font-bold" style={{ color: "#22c55e" }}>OK</button>
      <button type="button" onClick={onCancel} className="text-[10px]" style={{ color: "var(--fdf-text-muted)" }}>×</button>
    </div>
  );
}

export function FinderRosterEditor({ finderRoster, onChange }: FinderRosterEditorProps) {
  const [importCategory, setImportCategory] = useState<FinderCategory | null>(null);
  const [fileImportPending, setFileImportPending] = useState<{ roster: FinderRoster; warnings: string[] } | null>(null);
  const [fileImportWarnings, setFileImportWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (category: FinderCategory, players: FinderPlayer[]) => {
    // Match imported players by name+number to reuse IDs
    const resolved = players.map((p) => {
      const existingId = findExistingPlayerId(finderRoster, p.name, p.number);
      return existingId ? { ...p, id: existingId } : p;
    });
    onChange({ ...finderRoster, [category]: [...finderRoster[category], ...resolved] });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const result = parseTeamFile(text);
      const newTotal = totalPlayers(result.roster);
      if (newTotal === 0) {
        setFileImportWarnings(["No players found in file. Check the file format."]);
        return;
      }
      const existingTotal = totalPlayers(finderRoster);
      if (existingTotal > 0) {
        // Show confirmation dialog
        setFileImportPending(result);
      } else {
        // No existing players — apply directly
        onChange(result.roster);
        setFileImportWarnings(result.warnings);
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const confirmFileImport = () => {
    if (!fileImportPending) return;
    onChange(fileImportPending.roster);
    setFileImportWarnings(fileImportPending.warnings);
    setFileImportPending(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
          {totalPlayers(finderRoster)} unique player{totalPlayers(finderRoster) !== 1 ? "s" : ""} on roster
        </span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold font-fdf-mono uppercase tracking-wider transition-colors"
          style={{ color: "var(--fdf-accent)", border: "1px solid var(--fdf-border)" }}
        >
          <FileUp size={12} />
          Import Team File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File import warnings */}
      {fileImportWarnings.length > 0 && (
        <div
          className="mb-3 rounded px-3 py-2 text-[10px] font-fdf-mono"
          style={{ backgroundColor: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", color: "#eab308" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={10} />
            <span className="font-bold uppercase">Import Warnings</span>
          </div>
          {fileImportWarnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
          <button
            type="button"
            onClick={() => setFileImportWarnings([])}
            className="mt-1 underline"
            style={{ color: "var(--fdf-text-muted)" }}
          >
            dismiss
          </button>
        </div>
      )}

      {/* File import confirmation dialog */}
      {fileImportPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="w-full max-w-sm rounded-lg p-4 mx-4"
            style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
          >
            <h3 className="text-sm font-bold font-fdf-mono uppercase tracking-wider mb-2" style={{ color: "var(--fdf-accent)" }}>
              Replace Roster?
            </h3>
            <p className="text-xs mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
              Replace {totalPlayers(finderRoster)} existing player{totalPlayers(finderRoster) !== 1 ? "s" : ""} with{" "}
              {totalPlayers(fileImportPending.roster)} player{totalPlayers(fileImportPending.roster) !== 1 ? "s" : ""} from file?
            </p>
            {fileImportPending.warnings.length > 0 && (
              <div
                className="mb-3 rounded px-2 py-1.5 text-[10px] font-fdf-mono"
                style={{ backgroundColor: "rgba(234,179,8,0.1)", color: "#eab308" }}
              >
                {fileImportPending.warnings.map((w, i) => (
                  <div key={i}>{w}</div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmFileImport}
                className="px-4 py-2 rounded-md text-xs font-bold text-white"
                style={{ backgroundColor: "var(--fdf-accent)" }}
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => setFileImportPending(null)}
                className="px-4 py-2 rounded-md text-xs font-medium"
                style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {CATEGORY_CONFIG.map((config) => (
        <CategorySection
          key={config.key}
          config={config}
          players={finderRoster[config.key]}
          roster={finderRoster}
          onChange={onChange}
          onOpenImport={setImportCategory}
        />
      ))}

      {importCategory && (
        <FinderRosterImport
          category={CATEGORY_CONFIG.find(c => c.key === importCategory)?.label || importCategory}
          onImport={(players) => handleImport(importCategory, players)}
          onClose={() => setImportCategory(null)}
        />
      )}
    </div>
  );
}
