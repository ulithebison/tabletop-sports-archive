"use client";

import { useState, useCallback } from "react";
import { Newspaper, Zap, ChevronRight, Check } from "lucide-react";
import { DiceInput } from "./DiceInput";
import { NarrativeBox } from "./NarrativeBox";
import { FdfCard } from "../shared/FdfCard";
import {
  checkBreakingNews,
  getBreakingNewsType,
  processBreakingNewsInjury,
  processBreakingNewsImprovement,
} from "@/lib/fdf/commissioner/classic-mode";
import { randomD6 } from "@/lib/fdf/commissioner/dice-engine";
import { generateId } from "@/lib/fdf/id";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useCommissionerStore } from "@/lib/fdf/commissioner/commissioner-store";
import type { CommissionerLeague, HeadlineRecord } from "@/lib/fdf/commissioner/types";

type Phase = "check" | "type" | "team" | "details" | "applied";

interface BreakingNewsGeneratorProps {
  league: CommissionerLeague;
  onClose: () => void;
}

export function BreakingNewsGenerator({ league, onClose }: BreakingNewsGeneratorProps) {
  const [phase, setPhase] = useState<Phase>("check");
  const [checkRoll, setCheckRoll] = useState("1");
  const [hasNews, setHasNews] = useState(false);
  const [typeRoll, setTypeRoll] = useState("1");
  const [newsType, setNewsType] = useState<"injury" | "improvement">("injury");
  const [selectedTeamIdx, setSelectedTeamIdx] = useState(0);
  const [detailRoll, setDetailRoll] = useState("11");
  const [detailResult, setDetailResult] = useState<{ narrative: string; qualityEffect: string; durationWeeks: number; affectsScoring: boolean } | null>(null);

  const getTeam = useTeamStore((s) => s.getTeam);
  const addHeadline = useCommissionerStore((s) => s.addHeadline);

  const handleCheck = useCallback(() => {
    const roll = parseInt(checkRoll, 10);
    setHasNews(checkBreakingNews(roll));
    setPhase("type");
  }, [checkRoll]);

  const handleAutoCheck = useCallback(() => {
    const roll = randomD6();
    setCheckRoll(String(roll));
    setHasNews(checkBreakingNews(roll));
    setPhase("type");
  }, []);

  const handleType = useCallback(() => {
    const roll = parseInt(typeRoll, 10);
    setNewsType(getBreakingNewsType(roll));
    setPhase("team");
  }, [typeRoll]);

  const handleRandomTeam = useCallback(() => {
    setSelectedTeamIdx(Math.floor(Math.random() * league.teams.length));
  }, [league.teams.length]);

  const handleRollDetails = useCallback(() => {
    const result = newsType === "injury"
      ? processBreakingNewsInjury(detailRoll)
      : processBreakingNewsImprovement(detailRoll);
    setDetailResult(result);
    setPhase("details");
  }, [newsType, detailRoll]);

  const handleApply = useCallback(() => {
    const ct = league.teams[selectedTeamIdx];
    const headline: HeadlineRecord = {
      id: generateId(),
      season: league.currentSeason,
      week: league.currentWeek,
      teamId: ct.id,
      category: newsType === "injury" ? "injury" : "improvement",
      eventRoll: detailRoll,
      title: newsType === "injury" ? "Breaking News: Injury Report" : "Breaking News: Improvement",
      description: detailResult?.narrative || "",
      effects: [detailResult?.qualityEffect || "no change"],
      appliedModifiers: [],
      createdAt: new Date().toISOString(),
    };
    addHeadline(league.id, headline);
    setPhase("applied");
  }, [league, selectedTeamIdx, newsType, detailRoll, detailResult, addHeadline]);

  const selectedTeam = league.teams[selectedTeamIdx];
  const selectedFdfTeam = selectedTeam ? getTeam(selectedTeam.teamStoreId) : null;

  return (
    <FdfCard>
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={18} style={{ color: "var(--fdf-accent)" }} />
        <h2 className="text-sm font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
          Breaking News
        </h2>
      </div>

      {/* Phase: Check */}
      {phase === "check" && (
        <div className="space-y-3">
          <NarrativeBox text="Roll 1d6: On a 5 or 6, the phone rings — Breaking News!" type="info" />
          <div className="flex items-center gap-3">
            <DiceInput value={checkRoll} onChange={setCheckRoll} diceCount={1} label="1d6" />
            <button
              onClick={handleCheck}
              className="px-3 py-1.5 rounded text-xs font-bold text-white"
              style={{ backgroundColor: "var(--fdf-accent)" }}
            >
              Check
            </button>
            <button
              onClick={handleAutoCheck}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
              style={{ border: "1px solid var(--fdf-border)", color: "var(--fdf-text-secondary)" }}
            >
              <Zap size={12} /> Auto
            </button>
          </div>
        </div>
      )}

      {/* Phase: Type */}
      {phase === "type" && !hasNews && (
        <div className="space-y-3">
          <NarrativeBox text="No news today. The phone stays quiet." type="neutral" />
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ border: "1px solid var(--fdf-border)", color: "var(--fdf-text-secondary)" }}
          >
            Close
          </button>
        </div>
      )}

      {phase === "type" && hasNews && (
        <div className="space-y-3">
          <NarrativeBox text="The phone rings! Roll 1d6: 1-4 = Injury, 5-6 = Improvement." type="info" />
          <div className="flex items-center gap-3">
            <DiceInput value={typeRoll} onChange={setTypeRoll} diceCount={1} label="1d6" />
            <button
              onClick={handleType}
              className="px-3 py-1.5 rounded text-xs font-bold text-white"
              style={{ backgroundColor: "var(--fdf-accent)" }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Phase: Team */}
      {phase === "team" && (
        <div className="space-y-3">
          <NarrativeBox
            text={`Breaking News: ${newsType === "injury" ? "Injury Report" : "Improvement"} — Select a team.`}
            type={newsType === "injury" ? "negative" : "positive"}
          />
          <div className="flex items-center gap-3">
            <select
              value={selectedTeamIdx}
              onChange={(e) => setSelectedTeamIdx(Number(e.target.value))}
              className="px-3 py-2 rounded text-sm"
              style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
            >
              {league.teams.map((ct, i) => {
                const t = getTeam(ct.teamStoreId);
                return <option key={ct.id} value={i}>{t?.abbreviation} — {t?.name}</option>;
              })}
            </select>
            <button
              onClick={handleRandomTeam}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
              style={{ border: "1px solid var(--fdf-border)", color: "var(--fdf-text-secondary)" }}
            >
              <Zap size={12} /> Random
            </button>
          </div>
          <div className="flex items-center gap-3">
            <DiceInput value={detailRoll} onChange={setDetailRoll} diceCount={2} label="2d6" />
            <button
              onClick={handleRollDetails}
              className="px-3 py-1.5 rounded text-xs font-bold text-white"
              style={{ backgroundColor: "var(--fdf-accent)" }}
            >
              Roll Details
            </button>
          </div>
        </div>
      )}

      {/* Phase: Details */}
      {phase === "details" && detailResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: selectedFdfTeam?.primaryColor }} />
            <span className="font-bold text-sm" style={{ color: "var(--fdf-text-primary)" }}>
              {selectedFdfTeam?.name}
            </span>
          </div>
          <NarrativeBox
            text={detailResult.narrative}
            type={newsType === "injury" ? "negative" : "positive"}
          />
          <div className="text-xs space-y-1" style={{ color: "var(--fdf-text-secondary)" }}>
            <p>Effect: {detailResult.qualityEffect.replace(/_/g, " ")}</p>
            <p>Duration: {detailResult.durationWeeks === 0 ? "Rest of season" : `${detailResult.durationWeeks} weeks`}</p>
            {detailResult.affectsScoring && <p className="font-bold" style={{ color: "#f59e0b" }}>Affects Scoring Quality!</p>}
          </div>
          <button
            onClick={handleApply}
            className="flex items-center gap-1 px-4 py-2 rounded text-sm font-bold text-white"
            style={{ backgroundColor: "#22c55e" }}
          >
            <Check size={14} /> Apply
          </button>
        </div>
      )}

      {/* Phase: Applied */}
      {phase === "applied" && (
        <div className="space-y-3">
          <NarrativeBox text="Breaking News applied and recorded in league history." type="positive" />
          <div className="flex gap-3">
            <button
              onClick={() => setPhase("check")}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ border: "1px solid var(--fdf-border)", color: "var(--fdf-text-secondary)" }}
            >
              Check Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm font-bold text-white"
              style={{ backgroundColor: "var(--fdf-accent)" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </FdfCard>
  );
}
