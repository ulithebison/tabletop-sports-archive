"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

// ── Grade Dropdown ──────────────────────────────────────────

interface EditableGradeProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  colorMap?: Record<string, string>;
}

const GRADE_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444",
};

export function EditableGrade({ value, options, onChange, colorMap }: EditableGradeProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const colors = colorMap || GRADE_COLORS;

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing]);

  if (editing) {
    return (
      <div ref={ref} className="relative inline-flex">
        <select
          value={value}
          onChange={(e) => { onChange(e.target.value); setEditing(false); }}
          autoFocus
          className="px-2 py-0.5 rounded text-xs font-fdf-mono font-bold appearance-none cursor-pointer"
          style={{
            backgroundColor: "var(--fdf-bg-secondary)",
            border: "1px solid var(--fdf-accent)",
            color: "var(--fdf-text-primary)",
          }}
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-fdf-mono font-bold transition-colors group"
      style={{ color: colors[value] || "var(--fdf-text-secondary)" }}
      title="Click to edit"
      type="button"
    >
      {value}
      <Pencil size={8} className="opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

// ── Quality Dropdown ────────────────────────────────────────

interface EditableQualityProps {
  value: string | null;
  options: (string | null)[];
  labels?: Record<string, string>;
  onChange: (value: string | null) => void;
  positiveValues?: string[];
  negativeValues?: string[];
}

export function EditableQuality({ value, options, labels, onChange, positiveValues = [], negativeValues = [] }: EditableQualityProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing]);

  const color = value
    ? positiveValues.includes(value) ? "#22c55e"
    : negativeValues.includes(value) ? "#ef4444"
    : "var(--fdf-text-secondary)"
    : "var(--fdf-text-muted)";

  if (editing) {
    return (
      <div ref={ref} className="relative inline-flex">
        <select
          value={value || "__null__"}
          onChange={(e) => { onChange(e.target.value === "__null__" ? null : e.target.value); setEditing(false); }}
          autoFocus
          className="px-2 py-0.5 rounded text-xs font-fdf-mono font-bold appearance-none cursor-pointer"
          style={{
            backgroundColor: "var(--fdf-bg-secondary)",
            border: "1px solid var(--fdf-accent)",
            color: "var(--fdf-text-primary)",
          }}
        >
          {options.map((o) => (
            <option key={o || "__null__"} value={o || "__null__"}>
              {o ? (labels?.[o] || o) : "Neutral"}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-fdf-mono font-bold transition-colors group"
      style={{ color }}
      title="Click to edit"
      type="button"
    >
      {value || "Neutral"}
      <Pencil size={8} className="opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

// ── Number Input ────────────────────────────────────────────

interface EditableNumberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}

export function EditableNumber({ value, onChange, min = 0, max = 99, suffix }: EditableNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        commit();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing, draft]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
    setEditing(false);
  };

  if (editing) {
    return (
      <div ref={ref} className="inline-flex items-center gap-1">
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
          min={min}
          max={max}
          className="w-14 px-2 py-0.5 rounded text-xs font-fdf-mono font-bold text-center"
          style={{
            backgroundColor: "var(--fdf-bg-secondary)",
            border: "1px solid var(--fdf-accent)",
            color: "var(--fdf-text-primary)",
          }}
        />
        {suffix && <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>{suffix}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-fdf-mono font-bold transition-colors group"
      style={{ color: "var(--fdf-accent)" }}
      title="Click to edit"
      type="button"
    >
      {value}{suffix ? ` ${suffix}` : ""}
      <Pencil size={8} className="opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

// ── Text Input ──────────────────────────────────────────────

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function EditableText({ value, onChange, placeholder }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onChange(draft);
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing, draft]);

  if (editing) {
    return (
      <div ref={ref} className="inline-flex">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { onChange(draft); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
          autoFocus
          placeholder={placeholder}
          className="px-2 py-0.5 rounded text-xs font-fdf-mono"
          style={{
            backgroundColor: "var(--fdf-bg-secondary)",
            border: "1px solid var(--fdf-accent)",
            color: "var(--fdf-text-primary)",
            width: `${Math.max(8, draft.length + 2)}ch`,
          }}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-fdf-mono transition-colors group"
      style={{ color: "var(--fdf-text-secondary)" }}
      title="Click to edit"
      type="button"
    >
      {value || placeholder || "—"}
      <Pencil size={8} className="opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

// ── SEMI Toggle ─────────────────────────────────────────────

interface SemiToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SemiToggle({ checked, onChange, disabled }: SemiToggleProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-fdf-mono font-bold transition-colors"
      style={{
        backgroundColor: checked ? "rgba(245,158,11,0.2)" : "transparent",
        border: `1px solid ${checked ? "#f59e0b" : "var(--fdf-border)"}`,
        color: checked ? "#f59e0b" : "var(--fdf-text-muted)",
        opacity: disabled ? 0.4 : 1,
      }}
      title="Toggle SEMI status (situational — 1d6 per drive)"
      type="button"
    >
      SEMI{checked ? " •" : ""}
    </button>
  );
}
