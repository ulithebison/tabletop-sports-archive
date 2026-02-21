"use client";

import React, { useState, useTransition } from "react";
import type { GameSubmission } from "@/lib/types";
import { Loader2, AlertCircle, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ----------------------------------------------------------------
// Shared input styles (matches submit/game/page.tsx)
// ----------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-bg-input)",
  border: "1px solid rgba(212,168,67,0.18)",
  borderRadius: 4,
  color: "var(--color-text-primary)",
  fontSize: "0.875rem",
  padding: "0.5rem 0.65rem",
  outline: "none",
  transition: "border-color 150ms ease",
  fontFamily: "var(--font-body)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-heading)",
  fontSize: "0.7rem",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginBottom: "0.3rem",
};

// ----------------------------------------------------------------
// Focus-aware sub-components
// ----------------------------------------------------------------

function FocusInput({
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        ...inputStyle,
        borderColor: focused ? "var(--raw-gold-450)" : "rgba(212,168,67,0.18)",
        boxShadow: focused ? "0 0 0 2px rgba(212,168,67,0.12)" : "none",
      }}
    />
  );
}

function FocusTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      rows={rows}
      style={{
        ...inputStyle,
        resize: "vertical",
        borderColor: focused ? "var(--raw-gold-450)" : "rgba(212,168,67,0.18)",
        boxShadow: focused ? "0 0 0 2px rgba(212,168,67,0.12)" : "none",
      }}
    />
  );
}

function FocusSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle,
        cursor: "pointer",
        borderColor: focused ? "var(--raw-gold-450)" : "rgba(212,168,67,0.18)",
        boxShadow: focused ? "0 0 0 2px rgba(212,168,67,0.12)" : "none",
        colorScheme: "dark",
      }}
    >
      {children}
    </select>
  );
}

// ----------------------------------------------------------------
// Edit Dialog
// ----------------------------------------------------------------

const COMPLEXITY_OPTIONS = ["", "Simple", "Medium", "Complex", "Expert"] as const;
const TYPE_OPTIONS = ["", "Dice", "Card", "Board", "Tabletop"] as const;

interface EditSubmissionDialogProps {
  submission: GameSubmission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: number, data: Partial<GameSubmission>) => Promise<{ error?: string }>;
}

function EditSubmissionDialog({
  submission,
  open,
  onOpenChange,
  onSave,
}: EditSubmissionDialogProps) {
  const [form, setForm] = useState(() => ({
    name: submission.name ?? "",
    subtitle: submission.subtitle ?? "",
    sport: submission.sport ?? "",
    year: submission.year != null ? String(submission.year) : "",
    type: submission.type ?? "",
    complexity: submission.complexity ?? "",
    players: submission.players ?? "",
    playtime: submission.playtime ?? "",
    description: submission.description ?? "",
    publisher_name: submission.publisher_name ?? "",
    publisher_website: submission.publisher_website ?? "",
    bgg_url: submission.bgg_url ?? "",
    image_url: submission.image_url ?? "",
  }));
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form) {
    return (value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    setError(null);
    if (!form.name.trim()) {
      setError("Game name is required.");
      return;
    }
    startSave(async () => {
      const payload: Partial<GameSubmission> = {
        name: form.name.trim(),
        subtitle: form.subtitle.trim() || null,
        sport: form.sport.trim() || null,
        year: form.year ? Number(form.year) : null,
        type: form.type || null,
        complexity: form.complexity || null,
        players: form.players.trim() || null,
        playtime: form.playtime.trim() || null,
        description: form.description.trim() || null,
        publisher_name: form.publisher_name.trim() || null,
        publisher_website: form.publisher_website.trim() || null,
        bgg_url: form.bgg_url.trim() || null,
        image_url: form.image_url.trim() || null,
      };
      const result = await onSave(submission.id, payload);
      if (result?.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          padding: 0,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Gold accent bar */}
        <div
          className="h-0.5 flex-shrink-0 rounded-t-lg"
          style={{ background: "var(--color-accent-primary)" }}
        />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle
            className="font-heading font-bold text-lg uppercase tracking-wide"
            style={{ color: "var(--color-text-primary)" }}
          >
            Edit Submission
          </DialogTitle>
          <DialogDescription
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Update game details before approving. Changes are saved to the
            submission only.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div
          className="px-6 py-4 overflow-y-auto flex-1"
          style={{ minHeight: 0 }}
        >
          <div style={{ display: "grid", gap: "0.875rem" }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>Game Name</label>
              <FocusInput
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Strat-O-Matic Baseball"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label style={labelStyle}>Subtitle</label>
              <FocusInput
                value={form.subtitle}
                onChange={set("subtitle")}
                placeholder="Optional subtitle or edition"
              />
            </div>

            {/* Sport + Year */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div>
                <label style={labelStyle}>Sport</label>
                <FocusInput
                  value={form.sport}
                  onChange={set("sport")}
                  placeholder="e.g. Baseball; Football"
                />
              </div>
              <div>
                <label style={labelStyle}>Year Published</label>
                <FocusInput
                  type="number"
                  value={form.year}
                  onChange={set("year")}
                  placeholder="e.g. 1961"
                />
              </div>
            </div>

            {/* Type + Complexity */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div>
                <label style={labelStyle}>Game Type</label>
                <FocusSelect value={form.type} onChange={set("type")}>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t || "Select type\u2026"}
                    </option>
                  ))}
                </FocusSelect>
              </div>
              <div>
                <label style={labelStyle}>Complexity</label>
                <FocusSelect
                  value={form.complexity}
                  onChange={set("complexity")}
                >
                  {COMPLEXITY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c || "Select complexity\u2026"}
                    </option>
                  ))}
                </FocusSelect>
              </div>
            </div>

            {/* Players + Playtime */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div>
                <label style={labelStyle}>Players</label>
                <FocusInput
                  value={form.players}
                  onChange={set("players")}
                  placeholder="e.g. 2-4"
                />
              </div>
              <div>
                <label style={labelStyle}>Playtime</label>
                <FocusInput
                  value={form.playtime}
                  onChange={set("playtime")}
                  placeholder="e.g. 60-90 min"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <FocusTextarea
                value={form.description}
                onChange={set("description")}
                placeholder="Brief description of the game"
                rows={4}
              />
            </div>

            {/* Publisher */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div>
                <label style={labelStyle}>Publisher Name</label>
                <FocusInput
                  value={form.publisher_name}
                  onChange={set("publisher_name")}
                  placeholder="e.g. Strat-O-Matic"
                />
              </div>
              <div>
                <label style={labelStyle}>Publisher Website</label>
                <FocusInput
                  type="url"
                  value={form.publisher_website}
                  onChange={set("publisher_website")}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* BGG URL + Image URL */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div>
                <label style={labelStyle}>BoardGameGeek URL</label>
                <FocusInput
                  type="url"
                  value={form.bgg_url}
                  onChange={set("bgg_url")}
                  placeholder="https://boardgamegeek.com/…"
                />
              </div>
              <div>
                <label style={labelStyle}>Image URL</label>
                <FocusInput
                  type="url"
                  value={form.image_url}
                  onChange={set("image_url")}
                  placeholder="https://…/image.jpg"
                />
              </div>
            </div>

            {/* Submitter info (read-only) */}
            <div
              className="rounded mt-1"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--color-border-faint)",
                padding: "0.75rem",
              }}
            >
              <p
                className="font-heading text-[0.65rem] uppercase tracking-widest mb-2"
                style={{ color: "var(--color-text-faint)" }}
              >
                Submitted by
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {submission.submitter_name ?? "Anonymous"}
                {submission.submitter_email && (
                  <span
                    className="font-mono text-xs ml-2"
                    style={{ color: "var(--color-text-faint)" }}
                  >
                    ({submission.submitter_email})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="flex items-start gap-2 rounded mt-4"
              style={{
                background: "rgba(196,75,59,0.1)",
                border: "1px solid rgba(196,75,59,0.35)",
                padding: "0.625rem 0.75rem",
                color: "var(--raw-red-300)",
                fontSize: "0.85rem",
              }}
            >
              <AlertCircle
                size={16}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter
          className="px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--color-border-faint)" }}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="px-4 py-2 rounded text-xs font-heading font-semibold uppercase tracking-wide transition-colors"
            style={{
              background: "transparent",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded text-xs font-heading font-bold uppercase tracking-wide transition-colors inline-flex items-center gap-2"
            style={{
              background: saving ? "rgba(212,168,67,0.55)" : "#d4a843",
              color: "#080705",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving && (
              <Loader2
                size={14}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
            )}
            {saving ? "Saving\u2026" : "Save Changes"}
          </button>
        </DialogFooter>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// Submission Actions (wraps Edit + Approve + Reject)
// ----------------------------------------------------------------

interface SubmissionActionsProps {
  submission: GameSubmission;
  approveAction: (id: number) => Promise<void>;
  rejectAction: (id: number) => Promise<void>;
  updateAction: (
    id: number,
    data: Partial<GameSubmission>
  ) => Promise<{ error?: string }>;
}

export function SubmissionActions({
  submission,
  approveAction,
  rejectAction,
  updateAction,
}: SubmissionActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Edit */}
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="px-3 py-1 rounded text-xs font-heading font-semibold uppercase tracking-wide transition-all inline-flex items-center gap-1.5"
          style={{
            background: "rgba(212,168,67,0.12)",
            border: "1px solid rgba(212,168,67,0.3)",
            color: "var(--raw-gold-300)",
            cursor: "pointer",
          }}
        >
          <Pencil size={12} />
          Edit
        </button>

        {/* Approve */}
        <button
          type="button"
          disabled={approvePending}
          onClick={() => {
            startApprove(async () => {
              await approveAction(submission.id);
            });
          }}
          className="px-3 py-1 rounded text-xs font-heading font-semibold uppercase tracking-wide transition-all"
          style={{
            background: "rgba(77,132,100,0.14)",
            border: "1px solid rgba(77,132,100,0.3)",
            color: "var(--raw-green-300)",
            cursor: approvePending ? "not-allowed" : "pointer",
            opacity: approvePending ? 0.6 : 1,
          }}
        >
          {approvePending ? "Approving\u2026" : "Approve"}
        </button>

        {/* Reject */}
        <button
          type="button"
          disabled={rejectPending}
          onClick={() => {
            startReject(async () => {
              await rejectAction(submission.id);
            });
          }}
          className="px-3 py-1 rounded text-xs font-heading font-semibold uppercase tracking-wide transition-all"
          style={{
            background: "rgba(196,75,59,0.12)",
            border: "1px solid rgba(196,75,59,0.3)",
            color: "var(--raw-red-300)",
            cursor: rejectPending ? "not-allowed" : "pointer",
            opacity: rejectPending ? 0.6 : 1,
          }}
        >
          {rejectPending ? "Rejecting\u2026" : "Reject"}
        </button>
      </div>

      <EditSubmissionDialog
        submission={submission}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={updateAction}
      />
    </>
  );
}
