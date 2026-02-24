"use client";

import { useState } from "react";
import type { FinderPlayer } from "@/lib/fdf/types";
import { generateId } from "@/lib/fdf/id";
import { X, Upload } from "lucide-react";

interface FinderRosterImportProps {
  category: string;
  onImport: (players: FinderPlayer[]) => void;
  onClose: () => void;
}

/**
 * Dialog for importing players from pasted text.
 * Format per line: Name, Range (e.g. "D. Henry, 11-40")
 */
export function FinderRosterImport({ category, onImport, onClose }: FinderRosterImportProps) {
  const [text, setText] = useState("");

  const handleImport = () => {
    const lines = text.split("\n").filter(l => l.trim());
    const players: FinderPlayer[] = [];

    for (const line of lines) {
      const parts = line.split(",").map(s => s.trim());
      if (parts.length === 0 || !parts[0]) continue;

      const name = parts[0];
      const finderRange = parts[1] || undefined;

      players.push({
        id: generateId(),
        name,
        number: undefined,
        finderRange,
      });
    }

    if (players.length > 0) {
      onImport(players);
    }
    onClose();
  };

  const inputStyle = {
    backgroundColor: "var(--fdf-bg-elevated)",
    color: "var(--fdf-text-primary)",
    border: "1px solid var(--fdf-border)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-md rounded-lg p-4 mx-4"
        style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
            Import {category}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded" style={{ color: "var(--fdf-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <p className="text-xs mb-2" style={{ color: "var(--fdf-text-muted)" }}>
          One player per line: <span className="font-fdf-mono">Name, Range</span>
        </p>
        <p className="text-[10px] mb-3 font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
          Example: D. Henry, 11-40
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={"D. Henry, 11-40\nJ. Mixon, 41-55\nD. Cook, 56-66"}
          className="w-full rounded px-2.5 py-2 text-xs font-fdf-mono mb-3"
          style={inputStyle}
          autoFocus
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleImport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: "var(--fdf-accent)" }}
          >
            <Upload size={12} />
            Import
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-medium"
            style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
