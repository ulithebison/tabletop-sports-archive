"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Zap, Check, CheckCircle, AlertCircle, Trophy } from "lucide-react";
import { FdfCard } from "../shared/FdfCard";
import { NarrativeBox } from "./NarrativeBox";
import { InfoTooltip } from "./InfoTooltip";
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
  createHeadCoachGrade,
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
  "Annual Draft / Free Agency: Offense",
  "Annual Draft / Free Agency: Defense",
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
  championTeamId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function ClassicOffSeasonWizard({
  league,
  standings,
  championTeamId,
  onComplete,
  onCancel,
}: ClassicOffSeasonWizardProps) {
  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [diceMode, setDiceMode] = useState<DiceMode>("auto");
  const [digitalTeamIdx, setDigitalTeamIdx] = useState(0);
  const [processedSteps, setProcessedSteps] = useState<Set<number>>(new Set([0]));
  const [lastRolls, setLastRolls] = useState<Record<string, string>>({});

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
        const ct = league.teams.find((t) => t.id === ts.teamId);
        const hadWinning = standing.wins > standing.losses;
        const isChampion = championTeamId ? ct?.teamStoreId === championTeamId : standing.rank === 1;
        const outcome = isChampion ? "champion" : hadWinning ? "winning" : "losing";
        const newGrade = adjustCoachGrade(ts.classicData.headCoachGrade, outcome);
        const newData = checkHotSeat({ ...ts.classicData, headCoachGrade: newGrade }, hadWinning);
        const narrative = `Coach grade: ${ts.classicData.headCoachGrade} → ${newGrade} (${outcome}${isChampion ? " — League Champion!" : ""})`;
        return { ...ts, classicData: newData, narratives: [...ts.narratives, narrative] };
      })
    );
    setProcessedSteps((prev) => new Set([...prev, 0]));
  }, [standings, league.teams, championTeamId]);

  const processStep1Carousel = useCallback(() => {
    setTeamStates((prev) =>
      prev.map((ts) => {
        const roll = randomD6();
        const { classicData, fired, narrative } = processCoachingCarousel(ts.classicData, roll);
        let updated = classicData;
        if (fired) {
          const newGrade = createHeadCoachGrade(randomDiceResult(), updated.frontOfficeGrade, updated.ownership.competence);
          updated = { ...updated, headCoachName: generateCoachName(), headCoachGrade: newGrade, seasonsWithCoach: 0 };
        }
        const fullNarrative = fired
          ? `${narrative} New HC: ${updated.headCoachName} (Grade ${updated.headCoachGrade})`
          : narrative;
        return { ...ts, classicData: updated, narratives: [...ts.narratives, fullNarrative] };
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
        className="inline-flex items-center gap-1 text-xs font-fdf-mono px-1.5 py-0.5 rounded"
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
    0: "Head Coach grades adjust based on last season's performance. The league champion's HC gets +2 grade levels (max A). A winning record grants +1 (max B). A losing record results in -1 (min F). Hot Seat is cleared if the team had a winning season.",
    1: "Coaches on the Hot Seat face a 1d6 roll — rolls of 1-3 mean they're fired. Coaches with grade D or F (depending on the roll) may be placed on the Hot Seat. Fired coaches are immediately replaced: a new name is generated and their grade is determined via Table A (2d6, modified by FO Grade and Ownership).",
    2: "Franchise Points (FP) are calculated from the FO Grade × HC Grade matrix. Bottom-performing teams receive bonus FP for parity: worst team +3, bottom 15% +2, bottom 30% +1. FP determines team development opportunities for the upcoming season.",
    3: "A 2d6 roll on the Ownership Impact table. Results can change Franchise Points, alter ownership traits (loyalty/competence), or adjust the Front Office grade. Savvy owners tend to get better outcomes; meddling owners can hurt the team.",
    4: "The Annual Draft and Free Agency phase for offense. A 2d6 roll determines if the offense improves or diminishes its scoring quality (PROLIFIC/DULL). The current offensive profile influences the odds — weak teams have a better chance to improve.",
    5: "The Annual Draft and Free Agency phase for defense. A 2d6 roll determines if the defense improves or diminishes its scoring prevention quality (STAUNCH/INEPT). Works the same as the offense phase but uses the defensive profile table.",
    6: "The Front Office grade adjusts based on combined draft outcomes. If both offense and defense improved → FO grade +2. One improved → +1. One diminished → -1. Both diminished → -2. No change → no adjustment.",
    7: "Training Camp re-draws all quality pairs for the new season. Ball Security (RELIABLE/SHAKY), Fumbles (SECURE/CLUMSY), Discipline, Coverage, Fumble Recovery, and Clock Management are all re-assigned via the card draw system. Scoring Tendency (P+/P/R/R+) is also re-rolled.",
    8: "Fresh rolls for all Special Teams categories: Kick Return and Punt Return (ELECTRIC quality check), Field Goal success range, and Extra Point success range. Each team gets new 2d6 rolls on Table E.",
    9: "About 1 in 3 teams face an unexpected off-season event: front office shakeups, ownership changes, FP bonuses or penalties, or even franchise relocation. A 2d6 roll on Table U determines the event.",
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

        {/* Team list — step-specific grids */}
        {step === 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <InfoTooltip text={EXPLANATIONS.headCoachGrade} />
              <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>HC Grade adjusts by season outcome</span>
            </div>
            <div className="space-y-1.5">
              {teamStates.map((ts, idx) => {
                const ct = league.teams.find((t) => t.id === ts.teamId);
                const team = ct ? getTeam(ct.teamStoreId) : null;
                const standing = getStanding(ts.teamId);
                const isChamp = championTeamId ? ct?.teamStoreId === championTeamId : false;
                const lastNarrative = ts.narratives[ts.narratives.length - 1] || "";
                return (
                  <div key={ts.teamId} className="px-3 py-2 rounded text-sm" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: isChamp ? "1px solid #f59e0b" : "1px solid var(--fdf-border)" }}>
                    <div className="grid grid-cols-[48px_160px_1fr_auto_auto] items-center gap-2">
                      <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>
                        {team?.abbreviation || "???"}
                        {isChamp && <Trophy size={10} className="inline ml-1" style={{ color: "#f59e0b" }} />}
                      </span>
                      <span className="text-sm truncate" style={{ color: "var(--fdf-text-primary)" }}>{team?.name || "Unknown"}</span>
                      <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                        {standing.wins}W-{standing.losses}L
                      </span>
                      <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>HC:</span>
                      <EditableGrade
                        value={ts.classicData.headCoachGrade}
                        options={["A", "B", "C", "D", "F"]}
                        onChange={(v) => updateTeamState(idx, (s) => ({ ...s, classicData: { ...s.classicData, headCoachGrade: v as HeadCoachGrade } }))}
                      />
                    </div>
                    {lastNarrative && (
                      <div className="mt-1 text-xs" style={{ color: "var(--fdf-text-muted)" }}>{lastNarrative}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <InfoTooltip text={EXPLANATIONS.hotSeat} />
              <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>Carousel determines coaching changes</span>
            </div>
            <div className="space-y-1.5">
              {teamStates.map((ts, idx) => {
                const ct = league.teams.find((t) => t.id === ts.teamId);
                const team = ct ? getTeam(ct.teamStoreId) : null;
                const lastNarrative = ts.narratives[ts.narratives.length - 1] || "";
                return (
                  <div key={ts.teamId} className="px-3 py-2 rounded text-sm" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <div className="grid grid-cols-[48px_160px_1fr_auto_auto_auto] items-center gap-2">
                      <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>{team?.abbreviation || "???"}</span>
                      <span className="text-sm truncate" style={{ color: "var(--fdf-text-primary)" }}>{team?.name || "Unknown"}</span>
                      <div className="flex items-center gap-1">
                        <input
                          value={ts.classicData.headCoachName}
                          onChange={(e) => updateTeamState(idx, (s) => ({ ...s, classicData: { ...s.classicData, headCoachName: e.target.value } }))}
                          className="w-full text-sm bg-transparent outline-none"
                          style={{ color: "var(--fdf-text-primary)" }}
                        />
                        <button
                          onClick={() => updateTeamState(idx, (s) => ({ ...s, classicData: { ...s.classicData, headCoachName: generateCoachName() } }))}
                          className="p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
                          style={{ color: "var(--fdf-text-muted)" }}
                          type="button"
                          title="Generate new name"
                        >
                          <RefreshCw size={10} />
                        </button>
                      </div>
                      <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>HC:</span>
                      <EditableGrade
                        value={ts.classicData.headCoachGrade}
                        options={["A", "B", "C", "D", "F"]}
                        onChange={(v) => updateTeamState(idx, (s) => ({ ...s, classicData: { ...s.classicData, headCoachGrade: v as HeadCoachGrade } }))}
                      />
                      {ts.classicData.hotSeat ? (
                        <span className="text-xs font-fdf-mono px-1 rounded" style={{ backgroundColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>HOT SEAT</span>
                      ) : <span />}
                      {diceMode === "manual" && (
                        <div className="col-span-full mt-1">
                          <DiceInput value={lastRolls[`1-${idx}`] || "1"} onChange={(roll) => {
                            setLastRolls(prev => ({ ...prev, [`1-${idx}`]: roll }));
                            const r = parseInt(roll, 10);
                            const { classicData, fired, narrative } = processCoachingCarousel(ts.classicData, r);
                            let updated = classicData;
                            if (fired) {
                              const newGrade = createHeadCoachGrade(randomDiceResult(), updated.frontOfficeGrade, updated.ownership.competence);
                              updated = { ...updated, headCoachName: generateCoachName(), headCoachGrade: newGrade, seasonsWithCoach: 0 };
                            }
                            const fullNarrative = fired
                              ? `${narrative} New HC: ${updated.headCoachName} (Grade ${updated.headCoachGrade})`
                              : narrative;
                            updateTeamState(idx, (s) => ({ ...s, classicData: updated, narratives: [...s.narratives, fullNarrative] }));
                          }} diceCount={1} />
                        </div>
                      )}
                    </div>
                    {lastNarrative && (
                      <div className="mt-1 text-xs" style={{ color: "var(--fdf-text-muted)" }}>{lastNarrative}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <InfoTooltip text={EXPLANATIONS.franchisePoints} />
              <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>FP Matrix</span>
              <InfoTooltip text={EXPLANATIONS.fpMatrix} />
              <InfoTooltip text={EXPLANATIONS.bonusFP} />
            </div>
            <div className="space-y-1.5">
              {teamStates.map((ts, idx) => {
                const ct = league.teams.find((t) => t.id === ts.teamId);
                const team = ct ? getTeam(ct.teamStoreId) : null;
                const lastNarrative = ts.narratives[ts.narratives.length - 1] || "";
                return (
                  <div key={ts.teamId} className="px-3 py-2 rounded text-sm" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <div className="grid grid-cols-[48px_160px_1fr_auto] items-center gap-2">
                      <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>{team?.abbreviation || "???"}</span>
                      <span className="text-sm truncate" style={{ color: "var(--fdf-text-primary)" }}>{team?.name || "Unknown"}</span>
                      <span className="text-xs" style={{ color: "var(--fdf-text-secondary)" }}>
                        FO: {ts.classicData.frontOfficeGrade} × HC: {ts.classicData.headCoachGrade}
                      </span>
                      <EditableNumber
                        value={ts.classicData.franchisePoints}
                        onChange={(v) => updateTeamState(idx, (s) => ({ ...s, classicData: { ...s.classicData, franchisePoints: v } }))}
                        max={20}
                        suffix="FP"
                      />
                    </div>
                    {lastNarrative && (
                      <div className="mt-1 text-xs" style={{ color: "var(--fdf-text-muted)" }}>{lastNarrative}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <InfoTooltip text={EXPLANATIONS.ownershipImpact} />
              <InfoTooltip text={EXPLANATIONS.ownershipCompetence} />
            </div>
            <div className="space-y-1.5">
              {teamStates.map((ts, idx) => {
                const ct = league.teams.find((t) => t.id === ts.teamId);
                const team = ct ? getTeam(ct.teamStoreId) : null;
                const lastNarrative = ts.narratives[ts.narratives.length - 1] || "";
                return (
                  <div key={ts.teamId} className="px-3 py-2 rounded text-sm" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <div className="grid grid-cols-[48px_160px_1fr_auto] items-center gap-2">
                      <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>{team?.abbreviation || "???"}</span>
                      <span className="text-sm truncate" style={{ color: "var(--fdf-text-primary)" }}>{team?.name || "Unknown"}</span>
                      <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>{lastNarrative}</span>
                      <EditableNumber
                        value={ts.classicData.franchisePoints}
                        onChange={(v) => updateTeamState(idx, (s) => ({ ...s, classicData: { ...s.classicData, franchisePoints: v } }))}
                        max={20}
                        suffix="FP"
                      />
                      {diceMode === "manual" && (
                        <div className="col-span-full mt-1">
                          <DiceInput value={lastRolls[`3-${idx}`] || "11"} onChange={(roll) => {
                            setLastRolls(prev => ({ ...prev, [`3-${idx}`]: roll }));
                            const { classicData, narrative } = processOwnershipImpact(ts.classicData, roll);
                            updateTeamState(idx, (s) => ({ ...s, classicData, narratives: [...s.narratives, narrative] }));
                          }} diceCount={2} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <InfoTooltip text={EXPLANATIONS.prolific} />
              <InfoTooltip text={EXPLANATIONS.dull} />
            </div>
            <div className="space-y-1.5">
              {teamStates.map((ts, idx) => {
                const ct = league.teams.find((t) => t.id === ts.teamId);
                const team = ct ? getTeam(ct.teamStoreId) : null;
                const lastNarrative = ts.narratives[ts.narratives.length - 1] || "";
                return (
                  <div key={ts.teamId} className="px-3 py-2 rounded text-sm" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <div className="grid grid-cols-[48px_160px_1fr_auto] items-center gap-2">
                      <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>{team?.abbreviation || "???"}</span>
                      <span className="text-sm truncate" style={{ color: "var(--fdf-text-primary)" }}>{team?.name || "Unknown"}</span>
                      <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>{lastNarrative}</span>
                      <EditableQuality
                        value={ts.qualities.offense.scoring}
                        options={[null, "PROLIFIC", "DULL"]}
                        onChange={(v) => updateTeamState(idx, (s) => ({
                          ...s, qualities: { ...s.qualities, offense: { ...s.qualities.offense, scoring: v as typeof s.qualities.offense.scoring } },
                        }))}
                        positiveValues={["PROLIFIC"]}
                        negativeValues={["DULL"]}
                      />
                      {diceMode === "manual" && (
                        <div className="col-span-full mt-1">
                          <DiceInput value={lastRolls[`4-${idx}`] || "11"} onChange={(roll) => {
                            setLastRolls(prev => ({ ...prev, [`4-${idx}`]: roll }));
                            const profile = getOffenseDraftProfile(ts.qualities);
                            const result = rollAnnualDraftOffense(roll, profile);
                            let q = ts.qualities;
                            if (result.scoringChange) {
                              const newScoring = applyScoringChange(q.offense.scoring, q.offense.scoringSemi, result.scoringChange);
                              q = { ...q, offense: { ...q.offense, scoring: newScoring.scoring, scoringSemi: newScoring.semi } };
                            }
                            updateTeamState(idx, (s) => ({ ...s, qualities: q, offenseChanged: result.scoringChange, narratives: [...s.narratives, `OFF Draft: ${result.narrative}`] }));
                          }} diceCount={2} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <InfoTooltip text={EXPLANATIONS.staunch} />
              <InfoTooltip text={EXPLANATIONS.inept} />
            </div>
            <div className="space-y-1.5">
              {teamStates.map((ts, idx) => {
                const ct = league.teams.find((t) => t.id === ts.teamId);
                const team = ct ? getTeam(ct.teamStoreId) : null;
                const lastNarrative = ts.narratives[ts.narratives.length - 1] || "";
                return (
                  <div key={ts.teamId} className="px-3 py-2 rounded text-sm" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <div className="grid grid-cols-[48px_160px_1fr_auto] items-center gap-2">
                      <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>{team?.abbreviation || "???"}</span>
                      <span className="text-sm truncate" style={{ color: "var(--fdf-text-primary)" }}>{team?.name || "Unknown"}</span>
                      <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>{lastNarrative}</span>
                      <EditableQuality
                        value={ts.qualities.defense.scoring}
                        options={[null, "STAUNCH", "INEPT"]}
                        onChange={(v) => updateTeamState(idx, (s) => ({
                          ...s, qualities: { ...s.qualities, defense: { ...s.qualities.defense, scoring: v as typeof s.qualities.defense.scoring } },
                        }))}
                        positiveValues={["STAUNCH"]}
                        negativeValues={["INEPT"]}
                      />
                      {diceMode === "manual" && (
                        <div className="col-span-full mt-1">
                          <DiceInput value={lastRolls[`5-${idx}`] || "11"} onChange={(roll) => {
                            setLastRolls(prev => ({ ...prev, [`5-${idx}`]: roll }));
                            const profile = getDefenseDraftProfile(ts.qualities);
                            const result = rollAnnualDraftDefense(roll, profile);
                            let q = ts.qualities;
                            if (result.scoringChange) {
                              const newScoring = applyDefenseScoringChange(q.defense.scoring, q.defense.scoringSemi, result.scoringChange);
                              q = { ...q, defense: { ...q.defense, scoring: newScoring.scoring, scoringSemi: newScoring.semi } };
                            }
                            updateTeamState(idx, (s) => ({ ...s, qualities: q, defenseChanged: result.scoringChange, narratives: [...s.narratives, `DEF Draft: ${result.narrative}`] }));
                          }} diceCount={2} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-1.5">
            <div className="space-y-1.5">
              {teamStates.map((ts, idx) => {
                const ct = league.teams.find((t) => t.id === ts.teamId);
                const team = ct ? getTeam(ct.teamStoreId) : null;
                const lastNarrative = ts.narratives[ts.narratives.length - 1] || "";
                return (
                  <div key={ts.teamId} className="px-3 py-2 rounded text-sm" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <div className="grid grid-cols-[48px_160px_1fr_auto_auto] items-center gap-2">
                      <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>{team?.abbreviation || "???"}</span>
                      <span className="text-sm truncate" style={{ color: "var(--fdf-text-primary)" }}>{team?.name || "Unknown"}</span>
                      <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>{lastNarrative}</span>
                      <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>FO:</span>
                      <EditableGrade
                        value={ts.classicData.frontOfficeGrade}
                        options={["A", "B", "C", "D", "F"]}
                        onChange={(v) => updateTeamState(idx, (s) => ({ ...s, classicData: { ...s.classicData, frontOfficeGrade: v as FrontOfficeGrade } }))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <InfoTooltip text={EXPLANATIONS.pairedCardDraw} />
              <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>CDV = {getQVandCDV(teamCount).cdv}</span>
              <InfoTooltip text={EXPLANATIONS.qv} />
              <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>QV = {getQVandCDV(teamCount).qv}</span>
            </div>
            <div className="grid grid-cols-[48px_160px_1fr_1fr_1fr] items-center gap-2 px-3 text-[10px] font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-text-muted)" }}>
              <span />
              <span />
              <span>Ball Sec.</span>
              <span>Fumbles</span>
              <span>Tendency</span>
            </div>
            <div className="space-y-1.5">
              {teamStates.map((ts, idx) => {
                const ct = league.teams.find((t) => t.id === ts.teamId);
                const team = ct ? getTeam(ct.teamStoreId) : null;
                return (
                  <div key={ts.teamId} className="px-3 py-2 rounded text-sm" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <div className="grid grid-cols-[48px_160px_1fr_1fr_1fr] items-center gap-2">
                      <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>{team?.abbreviation || "???"}</span>
                      <span className="text-sm truncate" style={{ color: "var(--fdf-text-primary)" }}>{team?.name || "Unknown"}</span>
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
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-1.5">
            <div className="space-y-1.5">
              {teamStates.map((ts, idx) => {
                const ct = league.teams.find((t) => t.id === ts.teamId);
                const team = ct ? getTeam(ct.teamStoreId) : null;
                return (
                  <div key={ts.teamId} className="px-3 py-2 rounded text-sm" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <div className="grid grid-cols-[48px_160px_1fr] items-center gap-2">
                      <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>{team?.abbreviation || "???"}</span>
                      <span className="text-sm truncate" style={{ color: "var(--fdf-text-primary)" }}>{team?.name || "Unknown"}</span>
                      <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                        FG: {ts.kicking.fgRange || "—"} · XP: {ts.kicking.xpRange || "—"}
                        {ts.qualities.specialTeams.kickReturn && " · KR: ELECTRIC"}
                        {ts.qualities.specialTeams.puntReturn && " · PR: ELECTRIC"}
                      </span>
                      {diceMode === "manual" && (
                        <div className="col-span-full mt-1">
                          <DiceInput value={lastRolls[`8-${idx}`] || "11"} onChange={(roll) => {
                            setLastRolls(prev => ({ ...prev, [`8-${idx}`]: roll }));
                            const xp2yd = league.settings.xpFrom2YardLine ?? false;
                            const st = rollSpecialTeams(roll, randomDiceResult(), randomDiceResult(), randomDiceResult(), xp2yd);
                            const q = applySpecialTeams(ts.qualities, st);
                            updateTeamState(idx, (s) => ({ ...s, qualities: q, kicking: { fgRange: st.fgRange, xpRange: st.xpRange }, narratives: [...s.narratives, "Special teams rolled."] }));
                          }} diceCount={2} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="space-y-1.5">
            <div className="space-y-1.5">
              {teamStates.map((ts, idx) => {
                const ct = league.teams.find((t) => t.id === ts.teamId);
                const team = ct ? getTeam(ct.teamStoreId) : null;
                const lastNarrative = ts.narratives[ts.narratives.length - 1] || "";
                return (
                  <div key={ts.teamId} className="px-3 py-2 rounded text-sm" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <div className="grid grid-cols-[48px_160px_1fr_auto] items-center gap-2">
                      <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>{team?.abbreviation || "???"}</span>
                      <span className="text-sm truncate" style={{ color: "var(--fdf-text-primary)" }}>{team?.name || "Unknown"}</span>
                      <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>{lastNarrative}</span>
                      <span className="font-fdf-mono" style={{ color: "var(--fdf-accent)" }}>
                        {ts.classicData.franchisePoints} FP
                      </span>
                      {diceMode === "manual" && (
                        <div className="col-span-full mt-1">
                          <DiceInput value={lastRolls[`9-${idx}`] || "11"} onChange={(roll) => {
                            setLastRolls(prev => ({ ...prev, [`9-${idx}`]: roll }));
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
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === OFF_SEASON_STEPS.length - 1 && (
          <div className="space-y-1.5">
            {teamStates.map((ts) => {
              const ct = league.teams.find((t) => t.id === ts.teamId);
              const team = ct ? getTeam(ct.teamStoreId) : null;
              return (
                <div key={ts.teamId} className="px-3 py-2 rounded text-sm" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                  <div className="grid grid-cols-[48px_minmax(160px,auto)_1fr_auto_auto_auto] items-center gap-2">
                    <span className="font-fdf-mono font-bold" style={{ color: team?.primaryColor }}>{team?.abbreviation || "???"}</span>
                    <span className="text-sm" style={{ color: "var(--fdf-text-primary)" }}>{team?.name || "Unknown"}</span>
                    <span className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
                      HC: {ts.classicData.headCoachGrade} · FO: {ts.classicData.frontOfficeGrade}
                    </span>
                    <span className="font-fdf-mono" style={{ color: "var(--fdf-accent)" }}>
                      {ts.classicData.franchisePoints} FP
                    </span>
                    {ts.qualities.offense.scoring && (
                      <span className="text-xs font-fdf-mono px-1 rounded" style={{
                        backgroundColor: ts.qualities.offense.scoring === "PROLIFIC" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: ts.qualities.offense.scoring === "PROLIFIC" ? "#22c55e" : "#ef4444",
                      }}>{ts.qualities.offense.scoring}</span>
                    )}
                    {ts.qualities.defense.scoring && (
                      <span className="text-xs font-fdf-mono px-1 rounded" style={{
                        backgroundColor: ts.qualities.defense.scoring === "STAUNCH" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: ts.qualities.defense.scoring === "STAUNCH" ? "#22c55e" : "#ef4444",
                      }}>{ts.qualities.defense.scoring}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
