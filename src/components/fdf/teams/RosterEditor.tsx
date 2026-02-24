"use client";

import { useState } from "react";
import type { PlayerEntry, TeamRoster, RosterPosition, PlayerFinderRanges } from "@/lib/fdf/types";
import { ROSTER_POSITIONS, POSITION_LABELS } from "@/lib/fdf/constants";
import { generateId } from "@/lib/fdf/id";
import { getFinderRangeLabelsForPosition } from "@/lib/fdf/player-mapping";
import { PlayerEntryRow } from "./PlayerEntryRow";
import { ChevronDown, ChevronRight, Plus, Wand2 } from "lucide-react";

interface RosterEditorProps {
  roster: TeamRoster;
  onChange: (roster: TeamRoster) => void;
}

const EMPTY_ROSTER: TeamRoster = {
  quarterbacks: [],
  runningBacks: [],
  receivers: [],
  kicker: undefined,
  punter: undefined,
  defensiveBacks: [],
  linebackers: [],
  defensiveLinemen: [],
  kickReturner: undefined,
  puntReturner: undefined,
};

type RosterGroup = "quarterbacks" | "runningBacks" | "receivers" | "defensiveBacks" | "linebackers" | "defensiveLinemen";
type RosterSingle = "kicker" | "punter" | "kickReturner" | "puntReturner";

const POSITION_TO_GROUP: Record<RosterPosition, { key: RosterGroup | RosterSingle; isSingle: boolean }> = {
  QB: { key: "quarterbacks", isSingle: false },
  RB: { key: "runningBacks", isSingle: false },
  WR: { key: "receivers", isSingle: false },
  TE: { key: "receivers", isSingle: false },
  K: { key: "kicker", isSingle: true },
  P: { key: "punter", isSingle: true },
  CB: { key: "defensiveBacks", isSingle: false },
  S: { key: "defensiveBacks", isSingle: false },
  LB: { key: "linebackers", isSingle: false },
  DL: { key: "defensiveLinemen", isSingle: false },
  KR: { key: "kickReturner", isSingle: true },
  PR: { key: "puntReturner", isSingle: true },
};

interface PositionSectionProps {
  title: string;
  positions: RosterPosition[];
  roster: TeamRoster;
  onChange: (roster: TeamRoster) => void;
}

function getPlayersForPosition(roster: TeamRoster, pos: RosterPosition): PlayerEntry[] {
  const mapping = POSITION_TO_GROUP[pos];
  if (mapping.isSingle) {
    const player = roster[mapping.key as RosterSingle];
    return player ? [player] : [];
  }
  return (roster[mapping.key as RosterGroup] as PlayerEntry[]).filter(p => p.position === pos);
}

function addPlayerToRoster(roster: TeamRoster, player: PlayerEntry): TeamRoster {
  const mapping = POSITION_TO_GROUP[player.position];
  if (mapping.isSingle) {
    return { ...roster, [mapping.key]: player };
  }
  const key = mapping.key as RosterGroup;
  return { ...roster, [key]: [...roster[key], player] };
}

function updatePlayerInRoster(roster: TeamRoster, updated: PlayerEntry): TeamRoster {
  const newRoster = { ...roster };
  // Check single slots
  for (const singleKey of ["kicker", "punter", "kickReturner", "puntReturner"] as RosterSingle[]) {
    if (newRoster[singleKey]?.id === updated.id) {
      return { ...newRoster, [singleKey]: updated };
    }
  }
  // Check group arrays
  for (const groupKey of ["quarterbacks", "runningBacks", "receivers", "defensiveBacks", "linebackers", "defensiveLinemen"] as RosterGroup[]) {
    const arr = newRoster[groupKey];
    const idx = arr.findIndex(p => p.id === updated.id);
    if (idx >= 0) {
      const newArr = [...arr];
      newArr[idx] = updated;
      return { ...newRoster, [groupKey]: newArr };
    }
  }
  return newRoster;
}

function removePlayerFromRoster(roster: TeamRoster, playerId: string): TeamRoster {
  const newRoster = { ...roster };
  for (const singleKey of ["kicker", "punter", "kickReturner", "puntReturner"] as RosterSingle[]) {
    if (newRoster[singleKey]?.id === playerId) {
      return { ...newRoster, [singleKey]: undefined };
    }
  }
  for (const groupKey of ["quarterbacks", "runningBacks", "receivers", "defensiveBacks", "linebackers", "defensiveLinemen"] as RosterGroup[]) {
    const arr = newRoster[groupKey];
    if (arr.some(p => p.id === playerId)) {
      return { ...newRoster, [groupKey]: arr.filter(p => p.id !== playerId) };
    }
  }
  return newRoster;
}

function PositionSection({ title, positions, roster, onChange }: PositionSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [addingPos, setAddingPos] = useState<RosterPosition | null>(null);
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newFinderRanges, setNewFinderRanges] = useState<PlayerFinderRanges>({});

  const allPlayers = positions.flatMap(pos => getPlayersForPosition(roster, pos));

  const addRangeLabels = addingPos ? getFinderRangeLabelsForPosition(addingPos) : [];

  const handleAdd = () => {
    if (!addingPos || !newName.trim()) return;
    const hasRanges = Object.values(newFinderRanges).some(v => v);
    const player: PlayerEntry = {
      id: generateId(),
      name: newName.trim(),
      number: newNumber ? parseInt(newNumber, 10) : undefined,
      position: addingPos,
      finderRanges: hasRanges ? newFinderRanges : undefined,
    };
    onChange(addPlayerToRoster(roster, player));
    setNewName("");
    setNewNumber("");
    setNewFinderRanges({});
    setAddingPos(null);
  };

  const inputStyle = {
    backgroundColor: "var(--fdf-bg-elevated)",
    color: "var(--fdf-text-primary)",
    border: "1px solid var(--fdf-border)",
  };

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full text-left py-1"
      >
        {expanded ? <ChevronDown size={14} style={{ color: "var(--fdf-accent)" }} /> : <ChevronRight size={14} style={{ color: "var(--fdf-text-muted)" }} />}
        <span className="text-xs font-bold font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
          {title}
        </span>
        <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
          ({allPlayers.length})
        </span>
      </button>

      {expanded && (
        <div className="ml-5 mt-1">
          {positions.map(pos => {
            const players = getPlayersForPosition(roster, pos);
            const mapping = POSITION_TO_GROUP[pos];
            const isFull = mapping.isSingle && players.length >= 1;

            return (
              <div key={pos} className="mb-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-fdf-mono font-bold" style={{ color: "var(--fdf-text-secondary)" }}>
                    {pos}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--fdf-text-muted)" }}>
                    {POSITION_LABELS[pos]}
                  </span>
                </div>
                {players.map(player => (
                  <PlayerEntryRow
                    key={player.id}
                    player={player}
                    onUpdate={(updated) => onChange(updatePlayerInRoster(roster, updated))}
                    onDelete={() => onChange(removePlayerFromRoster(roster, player.id))}
                  />
                ))}
                {!isFull && addingPos !== pos && (
                  <button
                    type="button"
                    onClick={() => setAddingPos(pos)}
                    className="flex items-center gap-1 text-[10px] font-fdf-mono mt-0.5 py-0.5 px-1 rounded transition-colors"
                    style={{ color: "var(--fdf-text-muted)" }}
                  >
                    <Plus size={10} /> Add {pos}
                  </button>
                )}
                {addingPos === pos && (
                  <div className="mt-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        value={newNumber}
                        onChange={(e) => setNewNumber(e.target.value)}
                        placeholder="#"
                        className="w-12 rounded px-1.5 py-1 text-xs font-fdf-mono text-center"
                        style={inputStyle}
                      />
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Player name"
                        className="flex-1 rounded px-2 py-1 text-xs"
                        style={inputStyle}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAddingPos(null); }}
                      />
                      <button type="button" onClick={handleAdd} className="p-1 rounded" style={{ color: "#22c55e" }}>
                        <Plus size={14} />
                      </button>
                      <button type="button" onClick={() => setAddingPos(null)} className="p-1 rounded" style={{ color: "var(--fdf-text-muted)" }}>
                        ×
                      </button>
                    </div>
                    {addRangeLabels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1.5 ml-14">
                        {addRangeLabels.map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-1">
                            <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                              {label}:
                            </span>
                            <input
                              value={newFinderRanges[key] ?? ""}
                              onChange={(e) => setNewFinderRanges(prev => ({ ...prev, [key]: e.target.value || undefined }))}
                              placeholder="11-66"
                              className="w-16 rounded px-1.5 py-0.5 text-[10px] font-fdf-mono text-center"
                              style={inputStyle}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RosterEditor({ roster, onChange }: RosterEditorProps) {
  const handleQuickSetup = () => {
    const template: TeamRoster = {
      ...EMPTY_ROSTER,
      quarterbacks: [{ id: generateId(), name: "", position: "QB" }],
      runningBacks: [{ id: generateId(), name: "", position: "RB" }],
      receivers: [
        { id: generateId(), name: "", position: "WR" },
        { id: generateId(), name: "", position: "WR" },
        { id: generateId(), name: "", position: "TE" },
      ],
      kicker: { id: generateId(), name: "", position: "K" },
      punter: { id: generateId(), name: "", position: "P" },
      defensiveBacks: [
        { id: generateId(), name: "", position: "CB" },
        { id: generateId(), name: "", position: "CB" },
        { id: generateId(), name: "", position: "S" },
      ],
      linebackers: [
        { id: generateId(), name: "", position: "LB" },
        { id: generateId(), name: "", position: "LB" },
      ],
      defensiveLinemen: [
        { id: generateId(), name: "", position: "DL" },
        { id: generateId(), name: "", position: "DL" },
      ],
      kickReturner: { id: generateId(), name: "", position: "KR" },
      puntReturner: { id: generateId(), name: "", position: "PR" },
    };
    onChange(template);
  };

  const totalPlayers = [
    ...roster.quarterbacks,
    ...roster.runningBacks,
    ...roster.receivers,
    ...(roster.kicker ? [roster.kicker] : []),
    ...(roster.punter ? [roster.punter] : []),
    ...roster.defensiveBacks,
    ...roster.linebackers,
    ...roster.defensiveLinemen,
    ...(roster.kickReturner ? [roster.kickReturner] : []),
    ...(roster.puntReturner ? [roster.puntReturner] : []),
  ].filter(p => p.name.trim() !== "");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
          {totalPlayers.length} player{totalPlayers.length !== 1 ? "s" : ""} on roster
        </span>
        <button
          type="button"
          onClick={handleQuickSetup}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors"
          style={{ color: "var(--fdf-accent)", border: "1px solid var(--fdf-accent)", opacity: 0.8 }}
        >
          <Wand2 size={12} /> Quick Setup
        </button>
      </div>

      <PositionSection
        title="Offense"
        positions={ROSTER_POSITIONS.offense}
        roster={roster}
        onChange={onChange}
      />
      <PositionSection
        title="Defense"
        positions={ROSTER_POSITIONS.defense}
        roster={roster}
        onChange={onChange}
      />
      <PositionSection
        title="Special Teams"
        positions={ROSTER_POSITIONS.specialTeams}
        roster={roster}
        onChange={onChange}
      />
    </div>
  );
}

export { EMPTY_ROSTER };
