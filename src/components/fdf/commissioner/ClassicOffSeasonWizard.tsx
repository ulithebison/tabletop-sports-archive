"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Zap, Check, CheckCircle, AlertCircle } from "lucide-react";
import { FdfCard } from "../shared/FdfCard";
import { NarrativeBox } from "./NarrativeBox";
import { DiceModeToggle, DigitalDicePanel } from "./CommissionerDicePanel";
import type { DiceMode } from "./CommissionerDicePanel";
import { DiceInput } from "./DiceInput";
import { EditableGrade, EditableQuality, EditableNumber } from "./EditableValue";
import { EXPLANATIONS } from "@/lib/fdf/commissioner/explanations";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useCommissionerStore } from "@/lib/fdf/commissioner/commissioner-store";
import {
  adjustCoachGrade,
  checkHotSeat,
  processCoachingCarousel,
  calculateOffSeasonFP,
  calculateBonusFP,
  processOwnershipImpact,
  getOffenseDraftProfile,
  getDefenseDraftProfile,
  rollAnnualDraftOffense,
  rollAnnualDraftDefense,
  applyScoringChange,
  applyDefenseScoringChange,
  adjustFOGrade,
  rollOffenseProfile,
  rollDefenseProfile,
  rollSpecialTeams,
  rollScoringTendency,
  applyOffenseProfile,
  applyDefenseProfile,
  applySpecialTeams,
  drawOffenseQualityPairs,
  drawDefenseQualityPairs,
  drawClockManagement,
  processUnexpectedEvent,
  getQVandCDV,
} from "@/lib/fdf/commissioner/classic-mode";
import { randomD6, randomDiceResult } from "@/lib/fdf/commissioner/dice-engine";
import { generateCoachName } from "@/lib/fdf/commissioner/name-generator";
import type { CommissionerLeague, ClassicTeamData, FrontOfficeGrade, HeadCoachGrade } from "@/lib/fdf/commissioner/types";
import type { TeamQualities, TeamKicking } from "@/lib/fdf/types";

const OFF_SEASON_STEPS = [
  "Coach Adjustment",
  "Coaching Carousel",
  "Franchise Points",
  "Ownership Impact",
  "Annual Draft: Offense",
  "Annual Draft: Defense",
  "FO Grade Adjustment",
  "Training Camp: Qualities",
  "Special Teams",
  "Unexpected Events",
  "Summary",
];

// Steps that need dice rolls vs auto-calculated
const ROLL_STEPS = new Set([1, 3, 4, 5, 8, 9]);
const AUTO_STEPS = new Set([0, 2, 6, 7]);

interface TeamOffSeasonState {
  teamId: string;
  classicData: ClassicTeamData;
  qualities: TeamQualities;
  kicking: TeamKicking;
  narratives: string[];
  offenseChanged: "improve" | "diminish" | null;
  defenseChanged: "improve" | "diminish" | null;
  hadUnexpectedEvent: boolean;
}

interface ClassicOffSeasonWizardProps {
  league: CommissionerLeague;
  standings: { teamId: string; wins: number; losses: number; rank: number }[];
  onComplete: () => void;
  onCancel: () => void;
}

export function ClassicOffSeasonWizard({
  league,
  standings,
  onComplete,
  onCancel,
}: ClassicOffSeasonWizardProps) {
  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [diceMode, setDiceMode] = useState<DiceMode>("auto");
  const [digitalTeamIdx, setDigitalTeamIdx] = useState(0);
  const [processedSteps, setProcessedSteps] = useState<Set<number>>(new Set([0]));

  const updateTeamInLeague = useCommissionerStore((s) => s.updateTeamInLeague);
  const updateLeague = useCommissionerStore((s) => s.updateLeague);
  const advanceSeason = useCommissionerStore((s) => s.advanceSeason);
  const updateTeam = useTeamStore((s) => s.updateTeam);
  const getTeam = useTeamStore((s) => s.getTeam);

  // Initialize team states
  const [teamStates, setTeamStates] = useState<TeamOffSeasonState[]>(() =>
    league.teams.map((ct) => {
      const team = getTeam(ct.teamStoreId);
      return {
        teamId: ct.id,
        classicData: ct.classicData!,
        qualities: team?.qualities ?? {
          offense: { scoring: null, scoringSemi: false, yards: null, yardsSemi: false, protection: null, protectionSemi: false, ballSecurity: null, ballSecuritySemi: false, fumbles: null, fumblesSemi: false, discipline: null, disciplineSemi: false, clockManagement: null, clockManagementLevel: null, scoringTendency: null },
          defense: { scoring: null, scoringSemi: false, yards: null, yardsSemi: false, passRush: null, passRushSemi: false, coverage: null, coverageSemi: false, fumbleRecovery: null, fumbleRecoverySemi: false, discipline: null, disciplineSemi: false },
          specialTeams: { kickReturn: null, kickReturnSemi: false, puntReturn: null, puntReturnSemi: false },
        },
        kicking: team?.kicking ?? { fgRange: "", xpRange: "" },
        narratives: [],
        offenseChanged: null,
        defenseChanged: null,
        hadUnexpectedEvent: false,
      };
    })
  );

  const teamCount = teamStates.length;

  // Team info for dice panel
  const teamInfos = teamStates.map((ts) => {
    const ct = league.teams.find((t) => t.id === ts.teamId);
    const team = ct ? getTeam(ct.teamStoreId) : null;
    return {
      name: team?.name || "???",
      abbreviation: team?.abbreviation || "???",
      primaryColor: team?.primaryColor || "#666",
    };
  });

  // Helper to get standing for a team
  const getStanding = (teamId: string) => {
    const ct = league.teams.find((t) => t.id === teamId);
    return standings.find((s) => s.teamId === ct?.teamStoreId) ?? { wins: 0, losses: 0, rank: teamCount };
  };

  // Update a single team state
  const updateTeamState = useCallback((index: number, updater: (ts: TeamOffSeasonState) => TeamOffSeasonState) => {
    setTeamStates((prev) => prev.map((ts, i) => i === index ? updater(ts) : ts));
  }, []);

  // ── Step processors ─────────────────────────────────────

  const processStep0CoachAdjust = useCallback(() => {
    setTeamStates((prev) =>
      prev.map((ts) => {
        const standing = getStanding(ts.teamId);
        const hadWinning = standing.wins > standing.losses;
        const isChampion = standing.rank === 1;
        const outcome = isChampion ? "champion" : hadWinning ? "winning" : "losing";
        const newGrade = adjustCoachGrade(ts.classicData.headCoachGrade, outcome);
        const newData = checkHotSeat({ ...ts.classicData, headCoachGrade: newGrade }, hadWinning);
        const narrative = `Coach grade: ${ts.classicData.headCoachGrade} → ${newGrade} (${outcome})`;
        return { ...ts, classicData: newData, narratives: [...ts.narratives, narrative] };
      })
    );
    setProcessedSteps((prev) => new Set([...prev, 0]));
  }, [standings, league.teams]);

  const processStep1Carousel = useCallback(() => {
    setTeamStates((prev) =>
      prev.map((ts) => {
        const roll = randomD6();
        const { classicData, fired, narrative } = processCoachingCarousel(ts.classicData, roll);
        let updated = classicData;
        if (fired) {
          updated = { ...updated, headCoachName: generateCoachName(), seasonsWithCoach: 0 };
        }
        return { ...ts, classicData: updated, narratives: [...ts.narratives, narrative] };
      })
    );
    setProcessedSteps((prev) => new Set([...prev, 1]));
  }, []);

  const processStep2FP = useCallback(() => {
    setTeamStates((prev) =>
      prev.map((ts) => {
        const fp = calculateOffSeasonFP(ts.classicData.frontOfficeGrade, ts.classicData.headCoachGrade);
        const standing = getStanding(ts.teamId);
        const bonus = calculateBonusFP(0, teamCount, standing.rank);
        const total = fp + bonus;
        const narrative = `FP: ${fp} base${bonus > 0 ? ` + ${bonus} bonus` : ""} = ${total}`;
        return { ...ts, classicData: { ...ts.classicData, franchisePoints: total }, narratives: [...ts.narratives, narrative] };
      })
    );
    setProcessedSteps((prev) => new Set([...prev, 2]));
  }, [teamCount, standings, league.teams]);

  const processStep3Ownership = useCallback(() => {
    setTeamStates((prev) =>
      prev.map((ts) => {
        const roll = randomDiceResult();
        const { classicData, narrative } = processOwnershipImpact(ts.classicData, roll);
        return { ...ts, classicData, narratives: [...ts.narratives, narrative] };
      })
    );
    setProcessedSteps((prev) => new Set([...prev, 3]));
  }, []);

  const processStep4DraftOffense = useCallback(() => {
    setTeamStates((prev) =>
      prev.map((ts) => {
        const profile = getOffenseDraftProfile(ts.qualities);
        const roll = randomDiceResult();
        const result = rollAnnualDraftOffense(roll, profile);
        let q = ts.qualities;
        if (result.scoringChange) {
          const newScoring = applyScoringChange(q.offense.scoring, q.offense.scoringSemi, result.scoringChange);
          q = { ...q, offense: { ...q.offense, scoring: newScoring.scoring, scoringSemi: newScoring.semi } };
        }
        return { ...ts, qualities: q, offenseChanged: result.scoringChange, narratives: [...ts.narratives, `OFF Draft: ${result.narrative}`] };
      })
    );
    setProcessedSteps((prev) => new Set([...prev, 4]));
  }, []);

  const processStep5DraftDefense = useCallback(() => {
    setTeamStates((prev) =>
      prev.map((ts) => {
        const profile = getDefenseDraftProfile(ts.qualities);
        const roll = randomDiceResult();
        const result = rollAnnualDraftDefense(roll, profile);
        let q = ts.qualities;
        if (result.scoringChange) {
          const newScoring = applyDefenseScoringChange(q.defense.scoring, q.defense.scoringSemi, result.scoringChange);
          q = { ...q, defense: { ...q.defense, scoring: newScoring.scoring, scoringSemi: newScoring.semi } };
        }
        return { ...ts, qualities: q, defenseChanged: result.scoringChange, narratives: [...ts.narratives, `DEF Draft: ${result.narrative}`] };
      })
    );
    setProcessedSteps((prev) => new Set([...prev, 5]));
  }, []);

  const processStep6FOAdjust = useCallback(() => {
    setTeamStates((prev) =>
      prev.map((ts) => {
        const newFO = adjustFOGrade(ts.classicData.frontOfficeGrade, ts.offenseChanged, ts.defenseChanged);
        const narrative = `FO Grade: ${ts.classicData.frontOfficeGrade} → ${newFO}`;
        return { ...ts, classicData: { ...ts.classicData, frontOfficeGrade: newFO }, narratives: [...ts.narratives, narrative] };
      })
    );
    setProcessedSteps((prev) => new Set([...prev, 6]));
  }, []);

  const processStep7TrainingCamp = useCallback(() => {
    const { qv, cdv } = getQVandCDV(teamCount);
    const offPairs = drawOffenseQualityPairs(teamCount, cdv);
    const defPairs = drawDefenseQualityPairs(teamCount, cdv);
    const clock = drawClockManagement(teamCount, qv);

    setTeamStates((prev) =>
      prev.map((ts, i) => {
        let q = ts.qualities;
        if (ts.offenseChanged && q.offense.scoring) {
          const profile = rollOffenseProfile(randomDiceResult(), q.offense.scoring as "PROLIFIC" | "DULL", q.offense.scoringSemi);
          q = applyOffenseProfile(q, profile);
        }
        if (ts.defenseChanged && q.defense.scoring) {
          const profile = rollDefenseProfile(randomDiceResult(), q.defense.scoring as "STAUNCH" | "INEPT", q.defense.scoringSemi);
          q = applyDefenseProfile(q, profile);
        }
        q = {
          ...q,
          offense: {
            ...q.offense,
            ballSecurity: offPairs.ballSecurity.positive.includes(i) ? "RELIABLE" : offPairs.ballSecurity.negative.includes(i) ? "SHAKY" : null,
            ballSecuritySemi: false,
            fumbles: offPairs.fumbles.positive.includes(i) ? "SECURE" : offPairs.fumbles.negative.includes(i) ? "CLUMSY" : null,
            fumblesSemi: false,
            discipline: offPairs.discipline.positive.includes(i) ? "DISCIPLINED" : offPairs.discipline.negative.includes(i) ? "UNDISCIPLINED" : null,
            disciplineSemi: false,
            clockManagement: clock.efficient.includes(i) || clock.superEfficient.includes(i) ? "EFFICIENT" : clock.inefficient.includes(i) || clock.superInefficient.includes(i) ? "INEFFICIENT" : null,
            clockManagementLevel: clock.superEfficient.includes(i) || clock.superInefficient.includes(i) ? "super" : clock.efficient.includes(i) || clock.inefficient.includes(i) ? "full" : null,
            scoringTendency: rollScoringTendency(randomD6()),
          },
          defense: {
            ...q.defense,
            coverage: defPairs.coverage.positive.includes(i) ? "AGGRESSIVE" : defPairs.coverage.negative.includes(i) ? "MEEK" : null,
            coverageSemi: false,
            fumbleRecovery: defPairs.fumbleRecovery.positive.includes(i) ? "ACTIVE" : defPairs.fumbleRecovery.negative.includes(i) ? "PASSIVE" : null,
            fumbleRecoverySemi: false,
            discipline: defPairs.discipline.positive.includes(i) ? "DISCIPLINED" : defPairs.discipline.negative.includes(i) ? "UNDISCIPLINED" : null,
            disciplineSemi: false,
          },
        };
        return { ...ts, qualities: q, narratives: [...ts.narratives, "Training camp qualities assigned."] };
      })
    );
    setProcessedSteps((prev) => new Set([...prev, 7]));
  }, [teamCount]);

  const processStep8SpecialTeams = useCallback(() => {
    const xp2yd = league.settings.xpFrom2YardLine ?? false;
    setTeamStates((prev) =>
      prev.map((ts) => {
        const st = rollSpecialTeams(randomDiceResult(), randomDiceResult(), randomDiceResult(), randomDiceResult(), xp2yd);
        const q = applySpecialTeams(ts.qualities, st);
        return { ...ts, qualities: q, kicking: { fgRange: st.fgRange, xpRange: st.xpRange }, narratives: [...ts.narratives, "Special teams rolled."] };
      })
    );
    setProcessedSteps((prev) => new Set([...prev, 8]));
  }, [league.settings.xpFrom2YardLine]);

  const processStep9Unexpected = useCallback(() => {
    setTeamStates((prev) =>
      prev.map((ts) => {
        if (Math.random() > 0.33) return ts;
        const roll = randomDiceResult();
        const event = processUnexpectedEvent(roll);
        let data = { ...ts.classicData };
        data.franchisePoints += event.fpChange;
        if (event.ownershipEffect?.loyalty) {
          data = { ...data, ownership: { ...data.ownership, loyalty: event.ownershipEffect.loyalty } };
        }
        return {
          ...ts, classicData: data, hadUnexpectedEvent: true,
          narratives: [...ts.narratives, `Unexpected: ${event.narrative} (FP ${event.fpChange >= 0 ? "+" : ""}${event.fpChange})`],
        };
      })
    );
    setProcessedSteps((prev) => new Set([...prev, 9]));
  }, []);

  const autoProcess = useCallback(
    (s: number) => {
      switch (s) {
        case 0: processStep0CoachAdjust(); break;
        case 1: processStep1Carousel(); break;
        case 2: processStep2FP(); break;
        case 3: processStep3Ownership(); break;
        case 4: processStep4DraftOffense(); break;
        case 5: processStep5DraftDefense(); break;
        case 6: processStep6FOAdjust(); break;
        case 7: processStep7TrainingCamp(); break;
        case 8: processStep8SpecialTeams(); break;
        case 9: processStep9Unexpected(); break;
      }
    },
    [processStep0CoachAdjust, processStep1Carousel, processStep2FP, processStep3Ownership, processStep4DraftOffense, processStep5DraftDefense, processStep6FOAdjust, processStep7TrainingCamp, processStep8SpecialTeams, processStep9Unexpected]
  );

  // ── Apply and finish ────────────────────────────────────
  const handleComplete = useCallback(() => {
    setProcessing(true);
    for (const ts of teamStates) {
      const ct = league.teams.find((t) => t.id === ts.teamId);
      if (!ct) continue;
      updateTeamInLeague(league.id, ts.teamId, { classicData: ts.classicData });
      updateTeam(ct.teamStoreId, { qualities: ts.qualities, kicking: ts.kicking });
    }
    advanceSeason(league.id);
    updateLeague(league.id, { currentPhase: "regular_season" });
    setProcessing(false);
    onComplete();
  }, [teamStates, league, updateTeamInLeague, updateTeam, advanceSeason, updateLeague, onComplete]);

  // ── Navigation ──────────────────────────────────────────
  const next = () => {
    if (step < OFF_SEASON_STEPS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep < OFF_SEASON_STEPS.length - 1 && !processedSteps.has(nextStep)) {
        autoProcess(nextStep);
      }
    }
  };
  const prev = () => { if (step > 0) setStep(step - 1); };

  // Auto-process first step on mount
  useState(() => { autoProcess(0); });

  // ── Step status badge ─────────────────────────────────────
  const renderStepStatus = (s: number) => {
    const isProcessed = processedSteps.has(s);
    const isAutoStep = AUTO_STEPS.has(s);
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-fdf-mono px-1.5 py-0.5 rounded"
        style={{
          backgroundColor: isProcessed ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
          color: isProcessed ? "#22c55e" : "#f59e0b",
        }}
      >
        {isProcessed ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
        {isProcessed ? "Calculated" : isAutoStep ? "Auto" : "Roll needed"}
      </span>
    );
  };

  // ── Step narrative text ───────────────────────────────────
  const stepExplanations: Record<number, string> = {
    0: EXPLANATIONS.coachAdjustment,
    1: EXPLANATIONS.coachingCarousel,
    2: EXPLANATIONS.bonusFP,
    3: EXPLANATIONS.ownershipImpact,
    4: EXPLANATIONS.annualDraft,
    5: EXPLANATIONS.annualDraft,
    6: "FO Grade adjusts based on draft outcomes: two improvements → upgrade, two diminishments → downgrade.",
    7: EXPLANATIONS.trainingCamp,
    8: "Fresh Table E rolls for KR, PR, FG range, and XP range.",
    9: EXPLANATIONS.unexpectedEvents,
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-fdf-mono font-bold" style={{ color: "var(--fdf-accent)" }}>
            Step {step + 1} of {OFF_SEASON_STEPS.length}
          </span>
          <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            {OFF_SEASON_STEPS[step]}
          </span>
        </div>
        <div className="h-1 rounded-full" style={{ backgroundColor: "var(--fdf-bg-secondary)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${((step + 1) / OFF_SEASON_STEPS.length) * 100}%`, backgroundColor: "var(--fdf-accent)" }}
          />
        </div>
      </div>

      <FdfCard className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold font-fdf-mono" style={{ color: "var(--fdf-text-primary)" }}>
            {OFF_SEASON_STEPS[step]}
          </h2>
          {step < OFF_SEASON_STEPS.length - 1 && renderStepStatus(step)}
        </div>

        {/* Step explanation */}
        {step < OFF_SEASON_STEPS.length - 1 && stepExplanations[step] && (
          <div className="flex items-start gap-2 mb-3">
            <NarrativeBox text={stepExplanations[step]} type="info" className="flex-1" />
          </div>
        )}

        {/* Dice mode toggle for roll steps */}
        {step < OFF_SEASON_STEPS.length - 1 && ROLL_STEPS.has(step) && (
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <DiceModeToggle mode={diceMode} onChange={setDiceMode} showDigital={[3, 4, 5, 9].includes(step)} />
            <button
              onClick={() => autoProcess(step)}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold text-white"
              style={{ backgroundColor: "var(--fdf-accent)" }}
              type="button"
            >
              <Zap size={12} /> {processedSteps.has(step) ? "Re-Roll All" : "Roll All"}
            </button>
          </div>
        )}

        {/* Auto steps: just show re-calculate */}
        {step < OFF_SEASON_STEPS.length - 1 && AUTO_STEPS.has(step) && (
          <button
            onClick={() => autoProcess(step)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold text-white mb-3"
            style={{ backgroundColor: "var(--fdf-accent)" }}
            type="button"
          >
            <Zap size={12} /> {processedSteps.has(step) ? "Recalculate" : "Calculate"}
          </button>
        )}

        {/* Digital dice panel for applicable steps */}
        {diceMode === "digital" && ROLL_STEPS.has(step) && [3, 4, 5, 9].includes(step) && (
          <DigitalDicePanel
            diceCount={2}
            onResult={() => { /* individual team apply via manual mode */ }}
            teams={teamInfos}
            selectedTeamIndex={digitalTeamIdx}
            onSelectTeam={setDigitalTeamIdx}
            label={OFF_SEASON_STEPS[step]}
          />
        )}

        {/* Team list */}
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {teamStates.map((ts, idx) => {
            const ct = league.teams.find((t) => t.id === ts.teamId);
            const team = ct ? getTeam(ct.teamStoreId) : null;
            const lastNarrative = ts.narratives[ts.narratives.length - 1] || "";
            return (
              <div
                key={ts.teamId}
                className="px-3 py-2 rounded text-xs"
                style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-fdf-mono font-bold w-12" style={{ color: team?.primaryColor }}>
                    {team?.abbreviation || "???"}
                  </span>
                  <span className="flex-1" style={{ color: "var(--fdf-text-secondary)" }}>
                    {lastNarrative}
                  </span>

                  {/* Editable values based on step */}
                  {step === 0 && (
                    <EditableGrade
                      value={ts.classicData.headCoachGrade}
                      options={["A", "B", "C", "D", "F"]}
                      onChange={(v) => updateTeamState(idx, (s) => ({ ...s, classicData: { ...s.classicData, headCoachGrade: v as HeadCoachGrade } }))}
                    />
                  )}

                  {step === 2 && (
                    <EditableNumber
                      value={ts.classicData.franchisePoints}
                      onChange={(v) => updateTeamState(idx, (s) => ({ ...s, classicData: { ...s.classicData, franchisePoints: v } }))}
                      max={20}
                      suffix="FP"
                    />
                  )}

                  {step === 3 && (
                    <EditableNumber
                      value={ts.classicData.franchisePoints}
                      onChange={(v) => updateTeamState(idx, (s) => ({ ...s, classicData: { ...s.classicData, franchisePoints: v } }))}
                      max={20}
                      suffix="FP"
                    />
                  )}

                  {step === 4 && ts.qualities.offense.scoring && (
                    <EditableQuality
                      value={ts.qualities.offense.scoring}
                      options={[null, "PROLIFIC", "DULL"]}
                      onChange={(v) => updateTeamState(idx, (s) => ({
                        ...s, qualities: { ...s.qualities, offense: { ...s.qualities.offense, scoring: v as typeof s.qualities.offense.scoring } },
                      }))}
                      positiveValues={["PROLIFIC"]}
                      negativeValues={["DULL"]}
                    />
                  )}

                  {step === 5 && ts.qualities.defense.scoring && (
                    <EditableQuality
                      value={ts.qualities.defense.scoring}
                      options={[null, "STAUNCH", "INEPT"]}
                      onChange={(v) => updateTeamState(idx, (s) => ({
                        ...s, qualities: { ...s.qualities, defense: { ...s.qualities.defense, scoring: v as typeof s.qualities.defense.scoring } },
                      }))}
                      positiveValues={["STAUNCH"]}
                      negativeValues={["INEPT"]}
                    />
                  )}

                  {step === 6 && (
                    <EditableGrade
                      value={ts.classicData.frontOfficeGrade}
                      options={["A", "B", "C", "D", "F"]}
                      onChange={(v) => updateTeamState(idx, (s) => ({ ...s, classicData: { ...s.classicData, frontOfficeGrade: v as FrontOfficeGrade } }))}
                    />
                  )}

                  {step !== 0 && step !== 2 && step !== 3 && step !== 4 && step !== 5 && step !== 6 && (
                    <span className="font-fdf-mono" style={{ color: "var(--fdf-accent)" }}>
                      {ts.classicData.franchisePoints} FP
                    </span>
                  )}

                  {/* Manual dice input for roll steps */}
                  {diceMode === "manual" && step === 1 && (
                    <DiceInput value="1" onChange={(roll) => {
                      const r = parseInt(roll, 10);
                      const { classicData, fired, narrative } = processCoachingCarousel(ts.classicData, r);
                      let updated = classicData;
                      if (fired) updated = { ...updated, headCoachName: generateCoachName(), seasonsWithCoach: 0 };
                      updateTeamState(idx, (s) => ({ ...s, classicData: updated, narratives: [...s.narratives, narrative] }));
                    }} diceCount={1} />
                  )}

                  {diceMode === "manual" && step === 3 && (
                    <DiceInput value="11" onChange={(roll) => {
                      const { classicData, narrative } = processOwnershipImpact(ts.classicData, roll);
                      updateTeamState(idx, (s) => ({ ...s, classicData, narratives: [...s.narratives, narrative] }));
                    }} diceCount={2} />
                  )}

                  {diceMode === "manual" && step === 4 && (
                    <DiceInput value="11" onChange={(roll) => {
                      const profile = getOffenseDraftProfile(ts.qualities);
                      const result = rollAnnualDraftOffense(roll, profile);
                      let q = ts.qualities;
                      if (result.scoringChange) {
                        const newScoring = applyScoringChange(q.offense.scoring, q.offense.scoringSemi, result.scoringChange);
                        q = { ...q, offense: { ...q.offense, scoring: newScoring.scoring, scoringSemi: newScoring.semi } };
                      }
                      updateTeamState(idx, (s) => ({ ...s, qualities: q, offenseChanged: result.scoringChange, narratives: [...s.narratives, `OFF Draft: ${result.narrative}`] }));
                    }} diceCount={2} />
                  )}

                  {diceMode === "manual" && step === 5 && (
                    <DiceInput value="11" onChange={(roll) => {
                      const profile = getDefenseDraftProfile(ts.qualities);
                      const result = rollAnnualDraftDefense(roll, profile);
                      let q = ts.qualities;
                      if (result.scoringChange) {
                        const newScoring = applyDefenseScoringChange(q.defense.scoring, q.defense.scoringSemi, result.scoringChange);
                        q = { ...q, defense: { ...q.defense, scoring: newScoring.scoring, scoringSemi: newScoring.semi } };
                      }
                      updateTeamState(idx, (s) => ({ ...s, qualities: q, defenseChanged: result.scoringChange, narratives: [...s.narratives, `DEF Draft: ${result.narrative}`] }));
                    }} diceCount={2} />
                  )}

                  {diceMode === "manual" && step === 8 && (
                    <DiceInput value="11" onChange={(roll) => {
                      const xp2yd = league.settings.xpFrom2YardLine ?? false;
                      const st = rollSpecialTeams(roll, randomDiceResult(), randomDiceResult(), randomDiceResult(), xp2yd);
                      const q = applySpecialTeams(ts.qualities, st);
                      updateTeamState(idx, (s) => ({ ...s, qualities: q, kicking: { fgRange: st.fgRange, xpRange: st.xpRange }, narratives: [...s.narratives, "Special teams rolled."] }));
                    }} diceCount={2} />
                  )}

                  {diceMode === "manual" && step === 9 && (
                    <DiceInput value="11" onChange={(roll) => {
                      const event = processUnexpectedEvent(roll);
                      let data = { ...ts.classicData };
                      data.franchisePoints += event.fpChange;
                      if (event.ownershipEffect?.loyalty) {
                        data = { ...data, ownership: { ...data.ownership, loyalty: event.ownershipEffect.loyalty } };
                      }
                      updateTeamState(idx, (s) => ({
                        ...s, classicData: data, hadUnexpectedEvent: true,
                        narratives: [...s.narratives, `Unexpected: ${event.narrative} (FP ${event.fpChange >= 0 ? "+" : ""}${event.fpChange})`],
                      }));
                    }} diceCount={2} />
                  )}
                </div>

                {/* Step 7+8: show qualities inline for editing */}
                {step === 7 && (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <EditableQuality value={ts.qualities.offense.ballSecurity} options={[null, "RELIABLE", "SHAKY"]}
                      onChange={(v) => updateTeamState(idx, (s) => ({ ...s, qualities: { ...s.qualities, offense: { ...s.qualities.offense, ballSecurity: v as typeof s.qualities.offense.ballSecurity } } }))}
                      positiveValues={["RELIABLE"]} negativeValues={["SHAKY"]}
                    />
                    <EditableQuality value={ts.qualities.offense.fumbles} options={[null, "SECURE", "CLUMSY"]}
                      onChange={(v) => updateTeamState(idx, (s) => ({ ...s, qualities: { ...s.qualities, offense: { ...s.qualities.offense, fumbles: v as typeof s.qualities.offense.fumbles } } }))}
                      positiveValues={["SECURE"]} negativeValues={["CLUMSY"]}
                    />
                    <EditableQuality value={ts.qualities.offense.scoringTendency} options={[null, "P+", "P", "R", "R+"]}
                      onChange={(v) => updateTeamState(idx, (s) => ({ ...s, qualities: { ...s.qualities, offense: { ...s.qualities.offense, scoringTendency: v as typeof s.qualities.offense.scoringTendency } } }))}
                      positiveValues={["P+", "P"]} negativeValues={["R+", "R"]}
                    />
                  </div>
                )}

                {step === 8 && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                      FG: {ts.kicking.fgRange || "—"} · XP: {ts.kicking.xpRange || "—"}
                      {ts.qualities.specialTeams.kickReturn && " · KR: ELECTRIC"}
                      {ts.qualities.specialTeams.puntReturn && " · PR: ELECTRIC"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </FdfCard>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={step === 0 ? onCancel : prev}
          className="flex items-center gap-1 px-4 py-2 rounded text-sm font-medium"
          style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
          type="button"
        >
          <ChevronLeft size={14} />
          {step === 0 ? "Cancel" : "Back"}
        </button>

        {step < OFF_SEASON_STEPS.length - 1 ? (
          <button
            onClick={next}
            className="flex items-center gap-1 px-4 py-2 rounded text-sm font-bold text-white"
            style={{ backgroundColor: "var(--fdf-accent)" }}
            type="button"
          >
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={processing}
            className="flex items-center gap-1 px-5 py-2 rounded text-sm font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: "#22c55e" }}
            type="button"
          >
            <Check size={14} />
            {processing ? "Saving..." : "Complete Off-Season"}
          </button>
        )}
      </div>
    </div>
  );
}
