"use client";

import { useState, useEffect } from "react";
import { Check, RefreshCw, Pencil } from "lucide-react";
import type { SummaryContext } from "@/lib/fdf/summary-generator";
import { shuffleSummary } from "@/lib/fdf/summary-generator";

interface AutoSummaryPreviewProps {
  generatedText: string;
  context: SummaryContext;
  onAccept: (text: string) => void;
}

export function AutoSummaryPreview({
  generatedText,
  context,
  onAccept,
}: AutoSummaryPreviewProps) {
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [text, setText] = useState(generatedText);
  const [previewText, setPreviewText] = useState(generatedText);

  // Sync when parent generates a new summary (e.g. player change)
  useEffect(() => {
    setPreviewText(generatedText);
    setText(generatedText);
    setMode("preview");
  }, [generatedText]);

  const handleShuffle = () => {
    const newText = shuffleSummary(context, previewText);
    setPreviewText(newText);
    setText(newText);
    onAccept(newText);
  };

  const handleEdit = () => {
    setMode("edit");
    setText(previewText);
  };

  const handleAccept = () => {
    onAccept(previewText);
  };

  if (mode === "edit") {
    return (
      <div>
        <label
          className="block text-xs font-bold font-fdf-mono uppercase tracking-wider mb-1.5"
          style={{ color: "var(--fdf-text-secondary)" }}
        >
          Summary
        </label>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onAccept(e.target.value);
          }}
          className="w-full rounded px-2.5 py-2 text-sm"
          style={{
            backgroundColor: "var(--fdf-bg-elevated)",
            color: "var(--fdf-text-primary)",
            border: "1px solid var(--fdf-border)",
          }}
          autoFocus
        />
        <button
          type="button"
          onClick={() => { setMode("preview"); setPreviewText(text); }}
          className="mt-1 text-[10px] font-fdf-mono"
          style={{ color: "var(--fdf-accent)" }}
        >
          Back to preview
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        className="block text-xs font-bold font-fdf-mono uppercase tracking-wider mb-1.5"
        style={{ color: "var(--fdf-text-secondary)" }}
      >
        Auto Summary
      </label>
      <div
        className="rounded px-3 py-2 text-sm italic"
        style={{
          backgroundColor: "var(--fdf-bg-elevated)",
          color: "var(--fdf-text-primary)",
          border: "1px solid var(--fdf-border)",
          minHeight: "2.25rem",
        }}
      >
        {previewText || <span style={{ color: "var(--fdf-text-muted)" }}>No template available...</span>}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <button
          type="button"
          onClick={handleAccept}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-fdf-mono font-bold"
          style={{ color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
        >
          <Check size={10} /> Accept
        </button>
        <button
          type="button"
          onClick={handleShuffle}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-fdf-mono font-bold"
          style={{ color: "var(--fdf-accent)", border: "1px solid var(--fdf-border)" }}
        >
          <RefreshCw size={10} /> Shuffle
        </button>
        <button
          type="button"
          onClick={handleEdit}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-fdf-mono font-bold"
          style={{ color: "var(--fdf-text-muted)", border: "1px solid var(--fdf-border)" }}
        >
          <Pencil size={10} /> Edit
        </button>
      </div>
    </div>
  );
}
