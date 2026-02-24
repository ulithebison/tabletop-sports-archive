"use client";

import { useState } from "react";
import type { PlayerEntry, PlayerFinderRanges } from "@/lib/fdf/types";
import { POSITION_LABELS } from "@/lib/fdf/constants";
import { getFinderRangeLabelsForPosition, getFinderRangesDisplay } from "@/lib/fdf/player-mapping";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface PlayerEntryRowProps {
  player: PlayerEntry;
  onUpdate: (updated: PlayerEntry) => void;
  onDelete: () => void;
}

const inputStyle = {
  backgroundColor: "var(--fdf-bg-elevated)",
  color: "var(--fdf-text-primary)",
  border: "1px solid var(--fdf-border)",
};

export function PlayerEntryRow({ player, onUpdate, onDelete }: PlayerEntryRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player.name);
  const [number, setNumber] = useState(player.number?.toString() ?? "");
  const [ranges, setRanges] = useState<PlayerFinderRanges>(player.finderRanges ?? {});

  const rangeLabels = getFinderRangeLabelsForPosition(player.position);

  const handleSave = () => {
    if (!name.trim()) return;
    const hasRanges = Object.values(ranges).some(v => v);
    onUpdate({
      ...player,
      name: name.trim(),
      number: number ? parseInt(number, 10) : undefined,
      finderRange: undefined, // Clear legacy field on save
      finderRanges: hasRanges ? ranges : undefined,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setName(player.name);
    setNumber(player.number?.toString() ?? "");
    setRanges(player.finderRanges ?? {});
    setEditing(false);
  };

  const updateRange = (key: keyof PlayerFinderRanges, val: string) => {
    setRanges(prev => ({ ...prev, [key]: val || undefined }));
  };

  if (editing) {
    return (
      <div className="py-1.5">
        <div className="flex items-center gap-2">
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="#"
            className="w-12 rounded px-1.5 py-1 text-xs font-fdf-mono text-center"
            style={inputStyle}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Player name"
            className="flex-1 rounded px-2 py-1 text-xs"
            style={inputStyle}
            autoFocus
          />
          <button onClick={handleSave} className="p-1 rounded" style={{ color: "#22c55e" }}>
            <Check size={14} />
          </button>
          <button onClick={handleCancel} className="p-1 rounded" style={{ color: "var(--fdf-text-muted)" }}>
            <X size={14} />
          </button>
        </div>
        {rangeLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1.5 ml-14">
            {rangeLabels.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-1">
                <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                  {label}:
                </span>
                <input
                  value={ranges[key] ?? ""}
                  onChange={(e) => updateRange(key, e.target.value)}
                  placeholder="11-66"
                  className="w-16 rounded px-1.5 py-0.5 text-[10px] font-fdf-mono text-center"
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const displayRanges = getFinderRangesDisplay(player);

  return (
    <div className="flex items-center gap-2 py-1 group">
      <span className="w-12 text-xs font-fdf-mono text-center font-bold" style={{ color: "var(--fdf-accent)" }}>
        {player.number != null ? `#${player.number}` : "—"}
      </span>
      <span className="flex-1 text-xs" style={{ color: "var(--fdf-text-primary)" }}>
        {player.name}
      </span>
      <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
        {POSITION_LABELS[player.position]?.slice(0, 2) || player.position}
      </span>
      {displayRanges && (
        <span className="text-[10px] font-fdf-mono px-1 rounded" style={{ color: "var(--fdf-text-muted)", backgroundColor: "var(--fdf-bg-elevated)" }}>
          {displayRanges}
        </span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--fdf-text-muted)" }}
      >
        <Pencil size={12} />
      </button>
      <button
        onClick={onDelete}
        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "#ef4444" }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
