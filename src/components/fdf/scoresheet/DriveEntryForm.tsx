"use client";

import { useState, useEffect, useRef } from "react";
import type { FieldPosition, DriveResultType, PATResult, DriveInput, FdfTeam, FinderRoster, DrivePlayerInvolvement } from "@/lib/fdf/types";
import { needsPAT, isInstantResult, isNoClockPlay } from "@/lib/fdf/scoring";
import { isTimingWarningZone } from "@/lib/fdf/game-clock";
import { getFinderPlayerFieldsForResult } from "@/lib/fdf/player-mapping";
import { generateSummary, type SummaryContext } from "@/lib/fdf/summary-generator";
import { FieldPositionSelector } from "./FieldPositionSelector";
import { DriveTimeSelector } from "./DriveTimeSelector";
import { DriveResultPicker } from "./DriveResultPicker";
import { PATSelector } from "./PATSelector";
import { TimingWarning } from "./TimingWarning";
import { PlayerSelector, isPlayerSelectionValid } from "./PlayerSelector";
import { AutoSummaryPreview } from "./AutoSummaryPreview";
import { Undo2 } from "lucide-react";

interface DriveEntryFormProps {
  offenseTeam: FdfTeam;
  defenseTeam: FdfTeam;
  ticksRemaining: number;
  quarter: 1 | 2 | 3 | 4 | 5;
  hasDrives: boolean;
  enhancedMode?: boolean;
  offenseFinderRoster?: FinderRoster;
  defenseFinderRoster?: FinderRoster;
  onSubmit: (input: DriveInput) => void;
  onUndo: () => void;
}

export function DriveEntryForm(props: DriveEntryFormProps) {
  const {
    offenseTeam,
    defenseTeam,
    ticksRemaining,
    quarter,
    hasDrives,
    enhancedMode,
    offenseFinderRoster,
    defenseFinderRoster,
    onSubmit,
    onUndo,
  } = props;
  const [fieldPosition, setFieldPosition] = useState<FieldPosition | null>(null);
  const [driveTicks, setDriveTicks] = useState<number>(0);
  const [result, setResult] = useState<DriveResultType | null>(null);
  const [patResult, setPatResult] = useState<PATResult | null>(null);
  const [summary, setSummary] = useState("");
  const [playerInvolvement, setPlayerInvolvement] = useState<DrivePlayerInvolvement>({});
  const [generatedSummaryText, setGeneratedSummaryText] = useState("");
  const [summaryContext, setSummaryContext] = useState<SummaryContext | null>(null);
  const prevInvolvementRef = useRef<string>("");

  // Auto-generate summary when player involvement is complete in enhanced mode
  useEffect(() => {
    if (!enhancedMode || !result || !fieldPosition) return;

    const fields = getFinderPlayerFieldsForResult(result);
    const requiredFilled = fields
      .filter(f => f.required)
      .every(f => !!(playerInvolvement[f.key as keyof DrivePlayerInvolvement]));

    const invKey = JSON.stringify(playerInvolvement);
    if (requiredFilled && invKey !== prevInvolvementRef.current && fields.length > 0) {
      prevInvolvementRef.current = invKey;

      const ctx: SummaryContext = {
        result,
        playerInvolvement,
        offenseTeamName: offenseTeam.abbreviation,
        defenseTeamName: defenseTeam.abbreviation,
        fieldPosition,
        offenseRoster: offenseTeam.roster,
        defenseRoster: defenseTeam.roster,
        offenseFinderRoster,
        defenseFinderRoster,
      };
      const text = generateSummary(ctx);
      setSummary(text);
      setGeneratedSummaryText(text);
      setSummaryContext(ctx);
    }
  }, [playerInvolvement, result, fieldPosition, enhancedMode, offenseTeam, defenseTeam, offenseFinderRoster, defenseFinderRoster]);

  const isInstant = result ? isInstantResult(result) : false;
  const noClockPlay = result ? isNoClockPlay(result) : false;

  // Auto-set field position and ticks when selecting an instant result
  useEffect(() => {
    if (isInstant) {
      setFieldPosition("AVERAGE");
      setDriveTicks(0);
    }
  }, [isInstant]);

  // Auto-set ticks to 0 for no-clock plays (need FP but no ticks)
  useEffect(() => {
    if (noClockPlay) {
      setDriveTicks(0);
    }
  }, [noClockPlay]);

  const showPAT = result && needsPAT(result);
  const playerValid = !enhancedMode || !result || isPlayerSelectionValid(result, playerInvolvement);
  const isValid =
    (isInstant || fieldPosition !== null) &&
    (isInstant || noClockPlay || driveTicks > 0) &&
    result !== null &&
    (!showPAT || patResult !== null) &&
    playerValid;

  // Show timing warning only in Q2 and Q4
  const showTimingWarning = isTimingWarningZone(ticksRemaining) && (quarter === 2 || quarter === 4);

  const handleSubmit = () => {
    if (!isValid || !result) return;
    if (!isInstant && !fieldPosition) return;

    onSubmit({
      fieldPosition: isInstant ? "AVERAGE" : fieldPosition!,
      driveTicks: (isInstant || noClockPlay) ? 0 : driveTicks,
      result,
      patResult: showPAT ? patResult! : undefined,
      summary,
      playerInvolvement: enhancedMode ? playerInvolvement : undefined,
    });

    // Reset form
    setFieldPosition(null);
    setDriveTicks(0);
    setResult(null);
    setPatResult(null);
    setSummary("");
    setPlayerInvolvement({});
    setGeneratedSummaryText("");
    setSummaryContext(null);
    prevInvolvementRef.current = "";
  };

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-bold font-fdf-mono uppercase tracking-wider"
          style={{ color: "var(--fdf-accent)" }}
        >
          New Drive —{" "}
          <span style={{ color: offenseTeam.primaryColor || "var(--fdf-text-primary)" }}>
            {offenseTeam.abbreviation}
          </span>{" "}
          Offense
        </h3>
        {hasDrives && (
          <button
            type="button"
            onClick={onUndo}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
            style={{ color: "var(--fdf-text-muted)", border: "1px solid var(--fdf-border)" }}
          >
            <Undo2 size={12} />
            Undo
          </button>
        )}
      </div>

      {/* Timing warning — only Q2/Q4 */}
      {showTimingWarning && (
        <div className="mb-3">
          <TimingWarning ticksRemaining={ticksRemaining} offenseTeam={offenseTeam} />
        </div>
      )}

      <div className="space-y-4">
        {!isInstant && (
          <>
            <FieldPositionSelector value={fieldPosition} onChange={setFieldPosition} />
            {!noClockPlay && (
              <DriveTimeSelector value={driveTicks} onChange={setDriveTicks} />
            )}
          </>
        )}
        <DriveResultPicker value={result} onChange={(r) => { setResult(r); setPatResult(null); setPlayerInvolvement({}); }} />
        {showPAT && (
          <PATSelector
            value={patResult}
            onChange={setPatResult}
            enhancedMode={enhancedMode}
            offenseFinderRoster={offenseFinderRoster}
            playerInvolvement={playerInvolvement}
            onPlayerChange={setPlayerInvolvement}
          />
        )}

        {enhancedMode && result && offenseFinderRoster && (
          <PlayerSelector
            result={result}
            offenseFinderRoster={offenseFinderRoster}
            value={playerInvolvement}
            onChange={setPlayerInvolvement}
          />
        )}

        {enhancedMode && generatedSummaryText && summaryContext ? (
          <AutoSummaryPreview
            generatedText={generatedSummaryText}
            context={summaryContext}
            onAccept={(text) => setSummary(text)}
          />
        ) : (
          <div>
            <label
              className="block text-sm font-bold font-fdf-mono uppercase tracking-wider mb-1.5"
              style={{ color: "var(--fdf-text-secondary)" }}
            >
              Summary (optional)
            </label>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Drive summary..."
              className="w-full rounded px-2.5 py-2 text-sm"
              style={{
                backgroundColor: "var(--fdf-bg-elevated)",
                color: "var(--fdf-text-primary)",
                border: "1px solid var(--fdf-border)",
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full py-2.5 rounded-md text-base font-bold font-fdf-mono uppercase tracking-wider text-white transition-colors disabled:opacity-30"
          style={{ backgroundColor: "var(--fdf-accent)" }}
        >
          Log Drive
        </button>
      </div>
    </div>
  );
}
