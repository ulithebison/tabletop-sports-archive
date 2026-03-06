"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Zap, Check } from "lucide-react";
import { NarrativeBox } from "./NarrativeBox";
import { InfoTooltip } from "./InfoTooltip";
import { DiceModeToggle, DigitalDicePanel } from "./CommissionerDicePanel";
import type { DiceMode } from "./CommissionerDicePanel";
import { DiceInput } from "./DiceInput";
import { EditableGrade, EditableQuality, EditableNumber, EditableText, SemiToggle } from "./EditableValue";
import { LogoUpload } from "./LogoUpload";
import { EXPLANATIONS } from "@/lib/fdf/commissioner/explanations";
import { FdfCard } from "../shared/FdfCard";
import { generateId } from "@/lib/fdf/id";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { useCommissionerStore } from "@/lib/fdf/commissioner/commissioner-store";
import {
  generateTeamBatch,
  generateCoachName,
} from "@/lib/fdf/commissioner/name-generator";
import {
  getQVandCDV,
  emptyQualities,
  emptyKicking,
  autoGenerateClassicTeamData,
  createOwnership,
  createFrontOfficeGrade,
  createHeadCoachGrade,
  calculateFranchisePoints,
  rollScoringTendency,
  rollOffenseProfile,
  rollDefenseProfile,
  rollSpecialTeams,
  applyOffenseScoring,
  applyOffenseProfile,
  applyDefenseScoring,
  applyDefenseProfile,
  applySpecialTeams,
  drawOffenseScoring,
  drawDefenseScoring,
  drawOffenseQualityPairs,
  drawDefenseQualityPairs,
  drawClockManagement,
} from "@/lib/fdf/commissioner/classic-mode";
import {
  randomD6,
  randomDiceResult,
} from "@/lib/fdf/commissioner/dice-engine";
import type {
  ClassicTeamData,
  CommissionerTeam,
  LeagueSettings,
  FrontOfficeGrade,
  HeadCoachGrade,
} from "@/lib/fdf/commissioner/types";
import type { TeamQualities, TeamKicking } from "@/lib/fdf/types";

// ── Step definitions ────────────────────────────────────────

const STEPS = [
  "League Settings",
  "Teams",
  "Ownership & FO",
  "Head Coaches",
  "Franchise Points",
  "Offense Scoring",
  "Offense Qualities",
  "Clock Management",
  "Defense Scoring",
  "Defense Qualities",
  "Special Teams",
  "Scoring Tendency",
  "Review & Create",
];

interface TeamSetup {
  name: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  classicData: ClassicTeamData;
  qualities: TeamQualities;
  kicking: TeamKicking;
}

interface ClassicSetupWizardProps {
  onComplete: (leagueId: string) => void;
  onCancel: () => void;
}

export function ClassicSetupWizard({ onComplete, onCancel }: ClassicSetupWizardProps) {
  const [step, setStep] = useState(0);
  const [leagueName, setLeagueName] = useState("My League");
  const [teamCount, setTeamCount] = useState(8);
  const [xpFrom2YardLine, setXpFrom2YardLine] = useState(false);
  const [teams, setTeams] = useState<TeamSetup[]>([]);
  const [processing, setProcessing] = useState(false);
  const [diceMode, setDiceMode] = useState<DiceMode>("auto");
  const [digitalTeamIdx, setDigitalTeamIdx] = useState(0);

  const addTeam = useTeamStore((s) => s.addTeam);
  const createLeague = useCommissionerStore((s) => s.createLeague);
  const addTeamToLeague = useCommissionerStore((s) => s.addTeamToLeague);
  const updateLeague = useCommissionerStore((s) => s.updateLeague);

  // ── Helpers ───────────────────────────────────────────────

  const updateTeamAt = useCallback((index: number, updater: (t: TeamSetup) => TeamSetup) => {
    setTeams((prev) => prev.map((t, i) => i === index ? updater(t) : t));
  }, []);

  const updateTeamClassicData = useCallback((index: number, partial: Partial<ClassicTeamData>) => {
    updateTeamAt(index, (t) => ({ ...t, classicData: { ...t.classicData, ...partial } }));
  }, [updateTeamAt]);

  const updateTeamQualities = useCallback((index: number, updater: (q: TeamQualities) => TeamQualities) => {
    updateTeamAt(index, (t) => ({ ...t, qualities: updater(t.qualities) }));
  }, [updateTeamAt]);

  // ── Step 0: League Settings ─────────────────────────────
  const handleGenerateTeams = useCallback(() => {
    const batch = generateTeamBatch(teamCount);
    setTeams(
      batch.map((t) => ({
        name: `${t.city} ${t.nickname}`,
        abbreviation: t.abbreviation,
        primaryColor: t.colors.primary,
        secondaryColor: t.colors.secondary,
        classicData: autoGenerateClassicTeamData(),
        qualities: emptyQualities(),
        kicking: emptyKicking(),
      }))
    );
  }, [teamCount]);

  // ── Auto-Roll functions for each step ─────────────────────

  const autoRollOwnership = useCallback(() => {
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        classicData: {
          ...autoGenerateClassicTeamData(),
          headCoachName: t.classicData.headCoachName,
        },
      }))
    );
  }, []);

  const rollOwnershipForTeam = useCallback((index: number, compRoll: number, loyRoll: number, foRoll: number) => {
    const ownership = createOwnership(compRoll, loyRoll);
    const frontOfficeGrade = createFrontOfficeGrade(foRoll);
    updateTeamAt(index, (t) => ({
      ...t,
      classicData: {
        ...t.classicData,
        ownership,
        frontOfficeGrade,
      },
    }));
  }, [updateTeamAt]);

  const autoRollCoaches = useCallback(() => {
    setTeams((prev) =>
      prev.map((t) => {
        const name = generateCoachName();
        const roll = randomDiceResult();
        const headCoachGrade = createHeadCoachGrade(roll, t.classicData.frontOfficeGrade, t.classicData.ownership.competence);
        return {
          ...t,
          classicData: { ...t.classicData, headCoachName: name, headCoachGrade },
        };
      })
    );
  }, []);

  const rollCoachForTeam = useCallback((index: number, roll: string) => {
    updateTeamAt(index, (t) => {
      const headCoachGrade = createHeadCoachGrade(roll, t.classicData.frontOfficeGrade, t.classicData.ownership.competence);
      return { ...t, classicData: { ...t.classicData, headCoachGrade } };
    });
  }, [updateTeamAt]);

  const recalcFP = useCallback(() => {
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        classicData: {
          ...t.classicData,
          franchisePoints: calculateFranchisePoints(t.classicData.frontOfficeGrade, t.classicData.headCoachGrade),
        },
      }))
    );
  }, []);

  const autoRollOffenseScoring = useCallback(() => {
    const { cdv } = getQVandCDV(teams.length);
    const { prolific, dull } = drawOffenseScoring(teams.length, cdv);
    setTeams((prev) =>
      prev.map((t, i) => {
        const isProlific = prolific.includes(i);
        const isDull = dull.includes(i);
        let q = t.qualities;
        if (isProlific) {
          q = applyOffenseScoring(q, "PROLIFIC", false);
          q = applyOffenseProfile(q, rollOffenseProfile(randomDiceResult(), "PROLIFIC", false));
        } else if (isDull) {
          q = applyOffenseScoring(q, "DULL", false);
          q = applyOffenseProfile(q, rollOffenseProfile(randomDiceResult(), "DULL", false));
        } else {
          q = applyOffenseScoring(q, null, false);
        }
        return { ...t, qualities: q };
      })
    );
  }, [teams.length]);

  const autoRollOffenseQualities = useCallback(() => {
    const { cdv } = getQVandCDV(teams.length);
    const draws = drawOffenseQualityPairs(teams.length, cdv);
    setTeams((prev) =>
      prev.map((t, i) => ({
        ...t,
        qualities: {
          ...t.qualities,
          offense: {
            ...t.qualities.offense,
            ballSecurity: draws.ballSecurity.positive.includes(i) ? "RELIABLE" : draws.ballSecurity.negative.includes(i) ? "SHAKY" : null,
            ballSecuritySemi: false,
            fumbles: draws.fumbles.positive.includes(i) ? "SECURE" : draws.fumbles.negative.includes(i) ? "CLUMSY" : null,
            fumblesSemi: false,
            discipline: draws.discipline.positive.includes(i) ? "DISCIPLINED" : draws.discipline.negative.includes(i) ? "UNDISCIPLINED" : null,
            disciplineSemi: false,
          },
        },
      }))
    );
  }, [teams.length]);

  const autoRollClockManagement = useCallback(() => {
    const { qv } = getQVandCDV(teams.length);
    const draws = drawClockManagement(teams.length, qv);
    setTeams((prev) =>
      prev.map((t, i) => ({
        ...t,
        qualities: {
          ...t.qualities,
          offense: {
            ...t.qualities.offense,
            clockManagement: draws.efficient.includes(i) || draws.superEfficient.includes(i) ? "EFFICIENT" : draws.inefficient.includes(i) || draws.superInefficient.includes(i) ? "INEFFICIENT" : null,
            clockManagementLevel: draws.superEfficient.includes(i) ? "super" : draws.efficient.includes(i) ? "full" : draws.superInefficient.includes(i) ? "super" : draws.inefficient.includes(i) ? "full" : null,
          },
        },
      }))
    );
  }, [teams.length]);

  const autoRollDefenseScoring = useCallback(() => {
    const { cdv } = getQVandCDV(teams.length);
    const { staunch, inept } = drawDefenseScoring(teams.length, cdv);
    setTeams((prev) =>
      prev.map((t, i) => {
        const isStaunch = staunch.includes(i);
        const isInept = inept.includes(i);
        let q = t.qualities;
        if (isStaunch) {
          q = applyDefenseScoring(q, "STAUNCH", false);
          q = applyDefenseProfile(q, rollDefenseProfile(randomDiceResult(), "STAUNCH", false));
        } else if (isInept) {
          q = applyDefenseScoring(q, "INEPT", false);
          q = applyDefenseProfile(q, rollDefenseProfile(randomDiceResult(), "INEPT", false));
        } else {
          q = applyDefenseScoring(q, null, false);
        }
        return { ...t, qualities: q };
      })
    );
  }, [teams.length]);

  const autoRollDefenseQualities = useCallback(() => {
    const { cdv } = getQVandCDV(teams.length);
    const draws = drawDefenseQualityPairs(teams.length, cdv);
    setTeams((prev) =>
      prev.map((t, i) => ({
        ...t,
        qualities: {
          ...t.qualities,
          defense: {
            ...t.qualities.defense,
            coverage: draws.coverage.positive.includes(i) ? "AGGRESSIVE" : draws.coverage.negative.includes(i) ? "MEEK" : null,
            coverageSemi: false,
            fumbleRecovery: draws.fumbleRecovery.positive.includes(i) ? "ACTIVE" : draws.fumbleRecovery.negative.includes(i) ? "PASSIVE" : null,
            fumbleRecoverySemi: false,
            discipline: draws.discipline.positive.includes(i) ? "DISCIPLINED" : draws.discipline.negative.includes(i) ? "UNDISCIPLINED" : null,
            disciplineSemi: false,
          },
        },
      }))
    );
  }, [teams.length]);

  const autoRollSpecialTeams = useCallback(() => {
    setTeams((prev) =>
      prev.map((t) => {
        const st = rollSpecialTeams(randomDiceResult(), randomDiceResult(), randomDiceResult(), randomDiceResult(), xpFrom2YardLine);
        return {
          ...t,
          qualities: applySpecialTeams(t.qualities, st),
          kicking: { fgRange: st.fgRange, xpRange: st.xpRange },
        };
      })
    );
  }, [xpFrom2YardLine]);

  const rollSpecialTeamsForTeam = useCallback((index: number, krRoll: string, prRoll: string, fgRoll: string, xpRoll: string) => {
    const st = rollSpecialTeams(krRoll, prRoll, fgRoll, xpRoll, xpFrom2YardLine);
    updateTeamAt(index, (t) => ({
      ...t,
      qualities: applySpecialTeams(t.qualities, st),
      kicking: { fgRange: st.fgRange, xpRange: st.xpRange },
    }));
  }, [xpFrom2YardLine, updateTeamAt]);

  const autoRollTendency = useCallback(() => {
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        qualities: {
          ...t.qualities,
          offense: { ...t.qualities.offense, scoringTendency: rollScoringTendency(randomD6()) },
        },
      }))
    );
  }, []);

  const rollTendencyForTeam = useCallback((index: number, roll: number) => {
    const tendency = rollScoringTendency(roll);
    updateTeamQualities(index, (q) => ({ ...q, offense: { ...q.offense, scoringTendency: tendency } }));
  }, [updateTeamQualities]);

  // ── Re-roll single team (per step) ─────────────────────────
  const rerollTeam = useCallback((stepNum: number, index: number) => {
    switch (stepNum) {
      case 2:
        rollOwnershipForTeam(index, randomD6(), randomD6(), randomD6());
        break;
      case 3:
        rollCoachForTeam(index, randomDiceResult());
        break;
      case 10:
        rollSpecialTeamsForTeam(index, randomDiceResult(), randomDiceResult(), randomDiceResult(), randomDiceResult());
        break;
      case 11:
        rollTendencyForTeam(index, randomD6());
        break;
    }
  }, [rollOwnershipForTeam, rollCoachForTeam, rollSpecialTeamsForTeam, rollTendencyForTeam]);

  // ── Create League ───────────────────────────────────────
  const handleCreateLeague = useCallback(async () => {
    setProcessing(true);
    const settings: LeagueSettings = {
      defenseScheme: "4-3",
      era: "2020s",
      seasonLength: 17,
      playoffTeams: 6,
      xpFrom2YardLine,
    };

    const leagueId = createLeague({ name: leagueName, mode: "classic", settings });
    const { qv, cdv } = getQVandCDV(teams.length);
    updateLeague(leagueId, { qv, cdv });

    for (const t of teams) {
      const teamStoreId = addTeam({
        name: t.name,
        abbreviation: t.abbreviation,
        season: 2024,
        league: "Custom",
        qualities: t.qualities,
        kicking: t.kicking,
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
        headCoach: t.classicData.headCoachName,
        logoUrl: t.logoUrl,
      });

      const commTeam: CommissionerTeam = {
        id: generateId(),
        teamStoreId,
        leagueId,
        classicData: t.classicData,
        temporaryModifiers: [],
      };
      addTeamToLeague(leagueId, commTeam);
    }

    updateLeague(leagueId, { currentPhase: "regular_season" });
    setProcessing(false);
    onComplete(leagueId);
  }, [teams, leagueName, xpFrom2YardLine, createLeague, updateLeague, addTeam, addTeamToLeague, onComplete]);

  // ── Navigation ──────────────────────────────────────────
  const canNext = () => {
    if (step === 0) return leagueName.trim().length > 0;
    if (step === 1) return teams.length >= 4;
    return true;
  };

  const next = () => {
    if (step === 0 && teams.length === 0) handleGenerateTeams();
    if (step === 3) recalcFP(); // auto-calc FP when leaving coaches step
    if (step < STEPS.length - 1) setStep(step + 1);
  };
  const prev = () => { if (step > 0) setStep(step - 1); };

  // ── Render helpers ────────────────────────────────────────

  // Re-roll button for a single team
  const renderRerollBtn = (stepNum: number, idx: number) => (
    <button
      onClick={() => rerollTeam(stepNum, idx)}
      className="px-1.5 py-0.5 rounded text-[10px] font-fdf-mono transition-colors opacity-60 hover:opacity-100"
      style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-muted)" }}
      type="button"
      title="Re-roll this team"
    >
      <RefreshCw size={10} />
    </button>
  );

  // Dice mode header for steps with rolls
  const renderDiceModeHeader = (autoLabel: string, autoAction: () => void, showDigital?: boolean) => (
    <div className="flex items-center gap-3 flex-wrap">
      <DiceModeToggle mode={diceMode} onChange={setDiceMode} showDigital={showDigital} />
      {diceMode === "auto" && (
        <button onClick={autoAction} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold text-white" style={{ backgroundColor: "var(--fdf-accent)" }} type="button">
          <Zap size={12} /> {autoLabel}
        </button>
      )}
    </div>
  );

  // Auto-only header for card-draw steps (no dice mode toggle)
  const renderCardDrawHeader = (autoLabel: string, autoAction: () => void) => (
    <div className="flex items-center gap-3 flex-wrap">
      <button onClick={autoAction} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold text-white" style={{ backgroundColor: "var(--fdf-accent)" }} type="button">
        <Zap size={12} /> {autoLabel}
      </button>
    </div>
  );

  // ── Render Step Content ─────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0: // League Settings
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-muted)" }}>
                League Name
              </label>
              <input
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm"
                style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-fdf-mono font-bold mb-1" style={{ color: "var(--fdf-text-muted)" }}>
                Number of Teams
              </label>
              <select
                value={teamCount}
                onChange={(e) => setTeamCount(Number(e.target.value))}
                className="px-3 py-2 rounded text-sm"
                style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-primary)" }}
              >
                {[4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32].map((n) => (
                  <option key={n} value={n}>{n} teams</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={xpFrom2YardLine}
                onChange={(e) => setXpFrom2YardLine(e.target.checked)}
                id="xp2yd"
              />
              <label htmlFor="xp2yd" className="text-sm" style={{ color: "var(--fdf-text-secondary)" }}>
                XP from 2-yard line (classic era)
              </label>
              <InfoTooltip text={EXPLANATIONS.xpFrom2YardLine} />
            </div>
          </div>
        );

      case 1: // Teams (with color picker + logo upload)
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                {teams.length} teams generated
              </span>
              <button
                onClick={handleGenerateTeams}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
                style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)", color: "var(--fdf-text-secondary)" }}
                type="button"
              >
                <RefreshCw size={12} /> Regenerate All
              </button>
            </div>
            <div className="space-y-1.5">
              {teams.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded"
                  style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}
                >
                  {/* Logo */}
                  <LogoUpload
                    logoUrl={t.logoUrl}
                    onChange={(url) => updateTeamAt(i, (tt) => ({ ...tt, logoUrl: url }))}
                    size={28}
                    fallbackColor={t.primaryColor}
                    fallbackText={t.abbreviation.slice(0, 2)}
                  />
                  {/* Primary color */}
                  <input
                    type="color"
                    value={t.primaryColor}
                    onChange={(e) => updateTeamAt(i, (tt) => ({ ...tt, primaryColor: e.target.value }))}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                    title="Primary color"
                  />
                  {/* Secondary color */}
                  <input
                    type="color"
                    value={t.secondaryColor}
                    onChange={(e) => updateTeamAt(i, (tt) => ({ ...tt, secondaryColor: e.target.value }))}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                    title="Secondary color"
                  />
                  <input
                    value={t.name}
                    onChange={(e) => updateTeamAt(i, (tt) => ({ ...tt, name: e.target.value }))}
                    className="flex-1 text-sm bg-transparent outline-none"
                    style={{ color: "var(--fdf-text-primary)" }}
                  />
                  <input
                    value={t.abbreviation}
                    onChange={(e) => updateTeamAt(i, (tt) => ({ ...tt, abbreviation: e.target.value.toUpperCase().slice(0, 4) }))}
                    className="w-14 text-center text-xs font-fdf-mono bg-transparent outline-none"
                    style={{ color: "var(--fdf-text-muted)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 2: // Ownership & FO
        return (
          <div className="space-y-3">
            <NarrativeBox text="Roll 3×1d6 per team: Competence, Loyalty, and Front Office Grade." type="info" />
            <div className="flex items-center gap-2">
              <InfoTooltip text={EXPLANATIONS.ownershipCompetence} />
              <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>Competence</span>
              <InfoTooltip text={EXPLANATIONS.ownershipLoyalty} />
              <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>Loyalty</span>
              <InfoTooltip text={EXPLANATIONS.frontOfficeGrade} />
              <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>FO Grade</span>
            </div>
            {renderDiceModeHeader("Auto-Roll All", autoRollOwnership, false)}
            {diceMode === "manual" && (
              <div className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                Use the dropdowns below to enter dice values per team, or click each team&apos;s Roll button.
              </div>
            )}
            <div className="space-y-1.5">
              {teams.map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded text-xs flex-wrap" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                  <span className="font-fdf-mono font-bold w-12 flex-shrink-0" style={{ color: t.primaryColor }}>{t.abbreviation}</span>
                  <span className="text-xs truncate max-w-[100px]" style={{ color: "var(--fdf-text-primary)" }}>{t.name}</span>
                  <EditableQuality
                    value={t.classicData.ownership.competence}
                    options={["SAVVY", "NEUTRAL", "MEDDLING"]}
                    onChange={(v) => updateTeamClassicData(i, { ownership: { ...t.classicData.ownership, competence: (v as "SAVVY" | "NEUTRAL" | "MEDDLING") || "NEUTRAL" } })}
                    positiveValues={["SAVVY"]}
                    negativeValues={["MEDDLING"]}
                  />
                  <EditableQuality
                    value={t.classicData.ownership.loyalty}
                    options={["LOYAL", "NEUTRAL", "SELFISH"]}
                    onChange={(v) => updateTeamClassicData(i, { ownership: { ...t.classicData.ownership, loyalty: (v as "LOYAL" | "NEUTRAL" | "SELFISH") || "NEUTRAL" } })}
                    positiveValues={["LOYAL"]}
                    negativeValues={["SELFISH"]}
                  />
                  <span className="text-[10px]" style={{ color: "var(--fdf-text-muted)" }}>FO:</span>
                  <EditableGrade
                    value={t.classicData.frontOfficeGrade}
                    options={["A", "B", "C", "D", "F"]}
                    onChange={(v) => updateTeamClassicData(i, { frontOfficeGrade: v as FrontOfficeGrade })}
                  />
                  {(diceMode === "auto" || diceMode === "digital") && renderRerollBtn(2, i)}
                  {diceMode === "manual" && (
                    <div className="w-full mt-1 flex items-center gap-2 flex-wrap">
                      <DiceInput value="1" onChange={(v) => {
                        const comp = parseInt(v, 10);
                        const o = createOwnership(comp, 1);
                        updateTeamClassicData(i, { ownership: { ...t.classicData.ownership, competence: o.competence } });
                      }} diceCount={1} label="Comp" />
                      <DiceInput value="1" onChange={(v) => {
                        const loy = parseInt(v, 10);
                        const o = createOwnership(1, loy);
                        updateTeamClassicData(i, { ownership: { ...t.classicData.ownership, loyalty: o.loyalty } });
                      }} diceCount={1} label="Loy" />
                      <DiceInput value="1" onChange={(v) => {
                        const fo = parseInt(v, 10);
                        updateTeamClassicData(i, { frontOfficeGrade: createFrontOfficeGrade(fo) });
                      }} diceCount={1} label="FO" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 3: // Head Coaches
        return (
          <div className="space-y-3">
            <NarrativeBox text="Roll 2d6 on Table A for Head Coach Grade. Affected by FO Grade and Ownership." type="info" />
            <div className="flex items-center gap-2">
              <InfoTooltip text={EXPLANATIONS.headCoachGrade} />
              <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>HC Grade depends on FO + Owner</span>
            </div>
            {renderDiceModeHeader("Generate All", autoRollCoaches)}
            {diceMode === "digital" && (
              <DigitalDicePanel
                diceCount={2}
                onResult={(roll) => rollCoachForTeam(digitalTeamIdx, roll)}
                teams={teams}
                selectedTeamIndex={digitalTeamIdx}
                onSelectTeam={setDigitalTeamIdx}
                label="Table A: Head Coach Grade"
              />
            )}
            <div className="space-y-1.5">
              {teams.map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded text-xs" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                  <span className="font-fdf-mono font-bold w-12 flex-shrink-0" style={{ color: t.primaryColor }}>{t.abbreviation}</span>
                  <span className="text-xs truncate max-w-[100px]" style={{ color: "var(--fdf-text-primary)" }}>{t.name}</span>
                  <input
                    value={t.classicData.headCoachName}
                    onChange={(e) => updateTeamClassicData(i, { headCoachName: e.target.value })}
                    placeholder="Coach Name"
                    className="flex-1 text-sm bg-transparent outline-none"
                    style={{ color: "var(--fdf-text-primary)" }}
                  />
                  <button
                    onClick={() => updateTeamClassicData(i, { headCoachName: generateCoachName() })}
                    className="p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity"
                    style={{ color: "var(--fdf-text-muted)" }}
                    type="button"
                    title="Generate new name"
                  >
                    <RefreshCw size={10} />
                  </button>
                  <span className="text-[10px]" style={{ color: "var(--fdf-text-muted)" }}>HC:</span>
                  <EditableGrade
                    value={t.classicData.headCoachGrade}
                    options={["A", "B", "C", "D", "F"]}
                    onChange={(v) => updateTeamClassicData(i, { headCoachGrade: v as HeadCoachGrade })}
                  />
                  {diceMode === "auto" && renderRerollBtn(3, i)}
                  {diceMode === "manual" && (
                    <DiceInput value="11" onChange={(roll) => rollCoachForTeam(i, roll)} diceCount={2} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 4: // Franchise Points
        return (
          <div className="space-y-3">
            <NarrativeBox text="Franchise Points are calculated from Front Office Grade × Head Coach Grade. Higher FP = better team development opportunities." type="info" />
            <div className="flex items-center gap-2">
              <InfoTooltip text={EXPLANATIONS.franchisePoints} />
              <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>FP Matrix</span>
              <InfoTooltip text={EXPLANATIONS.fpMatrix} />
            </div>
            <button onClick={recalcFP} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold text-white" style={{ backgroundColor: "var(--fdf-accent)" }} type="button">
              <RefreshCw size={12} /> Recalculate All
            </button>
            <div className="space-y-1.5">
              {teams.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded text-xs" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                  <span className="font-fdf-mono font-bold w-12 flex-shrink-0" style={{ color: t.primaryColor }}>{t.abbreviation}</span>
                  <span className="text-xs truncate max-w-[100px]" style={{ color: "var(--fdf-text-primary)" }}>{t.name}</span>
                  <span style={{ color: "var(--fdf-text-secondary)" }}>
                    FO: {t.classicData.frontOfficeGrade} × HC: {t.classicData.headCoachGrade}
                  </span>
                  <span className="ml-auto">
                    <EditableNumber
                      value={t.classicData.franchisePoints}
                      onChange={(v) => updateTeamClassicData(i, { franchisePoints: v })}
                      max={20}
                      suffix="FP"
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 5: // Offense Scoring
        return (
          <div className="space-y-3">
            <NarrativeBox text="Card Draw assigns PROLIFIC/DULL. Teams with a scoring quality then roll 2d6 on Table C for yards + protection profile." type="info" />
            <div className="flex items-center gap-2 flex-wrap">
              <InfoTooltip text={EXPLANATIONS.cdv} />
              <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>CDV = {getQVandCDV(teams.length).cdv}</span>
              <InfoTooltip text={EXPLANATIONS.prolific} />
              <InfoTooltip text={EXPLANATIONS.dull} />
              <InfoTooltip text={EXPLANATIONS.semi} className="ml-1" />
            </div>
            {renderDiceModeHeader("Draw & Roll All", autoRollOffenseScoring, false)}
            {diceMode === "manual" && (
              <div className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                Set scoring quality via dropdown, then roll 2d6 Table C for teams with PROLIFIC or DULL.
              </div>
            )}
            <div className="space-y-1.5">
              {teams.map((t, i) => {
                const o = t.qualities.offense;
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded text-xs flex-wrap" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <span className="font-fdf-mono font-bold w-12 flex-shrink-0" style={{ color: t.primaryColor }}>{t.abbreviation}</span>
                    <span className="text-xs truncate max-w-[100px]" style={{ color: "var(--fdf-text-primary)" }}>{t.name}</span>
                    <EditableQuality
                      value={o.scoring}
                      options={[null, "PROLIFIC", "DULL"]}
                      onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, scoring: v as typeof o.scoring } }))}
                      positiveValues={["PROLIFIC"]}
                      negativeValues={["DULL"]}
                    />
                    {o.scoring && <SemiToggle checked={o.scoringSemi} onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, scoringSemi: v } }))} />}
                    {o.yards && (
                      <EditableQuality
                        value={o.yards}
                        options={[null, "DYNAMIC", "ERRATIC"]}
                        onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, yards: v as typeof o.yards } }))}
                        positiveValues={["DYNAMIC"]}
                        negativeValues={["ERRATIC"]}
                      />
                    )}
                    {o.yards && <SemiToggle checked={o.yardsSemi} onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, yardsSemi: v } }))} />}
                    {o.protection && (
                      <EditableQuality
                        value={o.protection}
                        options={[null, "SOLID", "POROUS"]}
                        onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, protection: v as typeof o.protection } }))}
                        positiveValues={["SOLID"]}
                        negativeValues={["POROUS"]}
                      />
                    )}
                    {o.protection && <SemiToggle checked={o.protectionSemi} onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, protectionSemi: v } }))} />}
                    {diceMode === "manual" && o.scoring && (
                      <div className="w-full mt-1">
                        <DiceInput value="11" onChange={(roll) => {
                          const profile = rollOffenseProfile(roll, o.scoring as "PROLIFIC" | "DULL", o.scoringSemi);
                          updateTeamQualities(i, (q) => applyOffenseProfile(q, profile));
                        }} diceCount={2} label="Table C" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 6: // Offense Qualities
        return (
          <div className="space-y-3">
            <NarrativeBox text="Card Draw only — no dice. CDV teams get positive quality, CDV teams get negative, rest neutral. Use the button to draw, or set values directly via the dropdowns." type="info" />
            <div className="flex items-center gap-2">
              <InfoTooltip text={EXPLANATIONS.pairedCardDraw} />
              <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>CDV = {getQVandCDV(teams.length).cdv}</span>
            </div>
            {renderCardDrawHeader("Draw All Pairs", autoRollOffenseQualities)}
            <div className="space-y-1.5">
              {teams.map((t, i) => {
                const o = t.qualities.offense;
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded text-xs flex-wrap" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <span className="font-fdf-mono font-bold w-12 flex-shrink-0" style={{ color: t.primaryColor }}>{t.abbreviation}</span>
                    <span className="text-xs truncate max-w-[100px]" style={{ color: "var(--fdf-text-primary)" }}>{t.name}</span>
                    <EditableQuality
                      value={o.ballSecurity}
                      options={[null, "RELIABLE", "SHAKY"]}
                      onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, ballSecurity: v as typeof o.ballSecurity } }))}
                      positiveValues={["RELIABLE"]}
                      negativeValues={["SHAKY"]}
                    />
                    <EditableQuality
                      value={o.fumbles}
                      options={[null, "SECURE", "CLUMSY"]}
                      onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, fumbles: v as typeof o.fumbles } }))}
                      positiveValues={["SECURE"]}
                      negativeValues={["CLUMSY"]}
                    />
                    <EditableQuality
                      value={o.discipline}
                      options={[null, "DISCIPLINED", "UNDISCIPLINED"]}
                      onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, discipline: v as typeof o.discipline } }))}
                      positiveValues={["DISCIPLINED"]}
                      negativeValues={["UNDISCIPLINED"]}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 7: // Clock Management
        return (
          <div className="space-y-3">
            <NarrativeBox text="Card Draw only — no dice. QV teams get positive quality, QV teams get negative, rest neutral. Use the button to draw, or set values directly via the dropdowns." type="info" />
            <div className="flex items-center gap-2">
              <InfoTooltip text={EXPLANATIONS.qv} />
              <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>QV = {getQVandCDV(teams.length).qv}</span>
              <InfoTooltip text={EXPLANATIONS.efficient} />
              <InfoTooltip text={EXPLANATIONS.inefficient} />
            </div>
            {renderCardDrawHeader("Draw All", autoRollClockManagement)}
            <div className="space-y-1.5">
              {teams.map((t, i) => {
                const cm = t.qualities.offense.clockManagement;
                const level = t.qualities.offense.clockManagementLevel;
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded text-xs" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <span className="font-fdf-mono font-bold w-12 flex-shrink-0" style={{ color: t.primaryColor }}>{t.abbreviation}</span>
                    <span className="text-xs truncate max-w-[100px]" style={{ color: "var(--fdf-text-primary)" }}>{t.name}</span>
                    <EditableQuality
                      value={cm ? `${level === "super" ? "S-" : ""}${cm}` : null}
                      options={[null, "EFFICIENT", "S-EFFICIENT", "INEFFICIENT", "S-INEFFICIENT"]}
                      onChange={(v) => {
                        if (!v) {
                          updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, clockManagement: null, clockManagementLevel: null } }));
                        } else if (v.startsWith("S-")) {
                          const base = v.replace("S-", "") as "EFFICIENT" | "INEFFICIENT";
                          updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, clockManagement: base, clockManagementLevel: "super" } }));
                        } else {
                          updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, clockManagement: v as "EFFICIENT" | "INEFFICIENT", clockManagementLevel: "full" } }));
                        }
                      }}
                      positiveValues={["EFFICIENT", "S-EFFICIENT"]}
                      negativeValues={["INEFFICIENT", "S-INEFFICIENT"]}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 8: // Defense Scoring
        return (
          <div className="space-y-3">
            <NarrativeBox text="Card Draw assigns STAUNCH/INEPT. Teams with a scoring quality then roll 2d6 on Table D for yards + pass rush profile." type="info" />
            <div className="flex items-center gap-2 flex-wrap">
              <InfoTooltip text={EXPLANATIONS.cdv} />
              <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>CDV = {getQVandCDV(teams.length).cdv}</span>
              <InfoTooltip text={EXPLANATIONS.staunch} />
              <InfoTooltip text={EXPLANATIONS.inept} />
              <InfoTooltip text={EXPLANATIONS.semi} className="ml-1" />
            </div>
            {renderDiceModeHeader("Draw & Roll All", autoRollDefenseScoring, false)}
            {diceMode === "manual" && (
              <div className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
                Set scoring quality via dropdown, then roll 2d6 Table D for teams with STAUNCH or INEPT.
              </div>
            )}
            <div className="space-y-1.5">
              {teams.map((t, i) => {
                const d = t.qualities.defense;
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded text-xs flex-wrap" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <span className="font-fdf-mono font-bold w-12 flex-shrink-0" style={{ color: t.primaryColor }}>{t.abbreviation}</span>
                    <span className="text-xs truncate max-w-[100px]" style={{ color: "var(--fdf-text-primary)" }}>{t.name}</span>
                    <EditableQuality
                      value={d.scoring}
                      options={[null, "STAUNCH", "INEPT"]}
                      onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, defense: { ...q.defense, scoring: v as typeof d.scoring } }))}
                      positiveValues={["STAUNCH"]}
                      negativeValues={["INEPT"]}
                    />
                    {d.scoring && <SemiToggle checked={d.scoringSemi} onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, defense: { ...q.defense, scoringSemi: v } }))} />}
                    {d.yards && (
                      <EditableQuality
                        value={d.yards}
                        options={[null, "STIFF", "SOFT"]}
                        onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, defense: { ...q.defense, yards: v as typeof d.yards } }))}
                        positiveValues={["STIFF"]}
                        negativeValues={["SOFT"]}
                      />
                    )}
                    {d.yards && <SemiToggle checked={d.yardsSemi} onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, defense: { ...q.defense, yardsSemi: v } }))} />}
                    {d.passRush && (
                      <EditableQuality
                        value={d.passRush}
                        options={[null, "PUNISHING", "MILD"]}
                        onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, defense: { ...q.defense, passRush: v as typeof d.passRush } }))}
                        positiveValues={["PUNISHING"]}
                        negativeValues={["MILD"]}
                      />
                    )}
                    {d.passRush && <SemiToggle checked={d.passRushSemi} onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, defense: { ...q.defense, passRushSemi: v } }))} />}
                    {diceMode === "manual" && d.scoring && (
                      <div className="w-full mt-1">
                        <DiceInput value="11" onChange={(roll) => {
                          const profile = rollDefenseProfile(roll, d.scoring as "STAUNCH" | "INEPT", d.scoringSemi);
                          updateTeamQualities(i, (q) => applyDefenseProfile(q, profile));
                        }} diceCount={2} label="Table D" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 9: // Defense Qualities
        return (
          <div className="space-y-3">
            <NarrativeBox text="Card Draw only — no dice. CDV teams get positive quality, CDV teams get negative, rest neutral. Use the button to draw, or set values directly via the dropdowns." type="info" />
            <div className="flex items-center gap-2">
              <InfoTooltip text={EXPLANATIONS.pairedCardDraw} />
              <span className="text-[10px] font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>CDV = {getQVandCDV(teams.length).cdv}</span>
            </div>
            {renderCardDrawHeader("Draw All Pairs", autoRollDefenseQualities)}
            <div className="space-y-1.5">
              {teams.map((t, i) => {
                const d = t.qualities.defense;
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded text-xs flex-wrap" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                    <span className="font-fdf-mono font-bold w-12 flex-shrink-0" style={{ color: t.primaryColor }}>{t.abbreviation}</span>
                    <span className="text-xs truncate max-w-[100px]" style={{ color: "var(--fdf-text-primary)" }}>{t.name}</span>
                    <EditableQuality
                      value={d.coverage}
                      options={[null, "AGGRESSIVE", "MEEK"]}
                      onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, defense: { ...q.defense, coverage: v as typeof d.coverage } }))}
                      positiveValues={["AGGRESSIVE"]}
                      negativeValues={["MEEK"]}
                    />
                    <EditableQuality
                      value={d.fumbleRecovery}
                      options={[null, "ACTIVE", "PASSIVE"]}
                      onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, defense: { ...q.defense, fumbleRecovery: v as typeof d.fumbleRecovery } }))}
                      positiveValues={["ACTIVE"]}
                      negativeValues={["PASSIVE"]}
                    />
                    <EditableQuality
                      value={d.discipline}
                      options={[null, "DISCIPLINED", "UNDISCIPLINED"]}
                      onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, defense: { ...q.defense, discipline: v as typeof d.discipline } }))}
                      positiveValues={["DISCIPLINED"]}
                      negativeValues={["UNDISCIPLINED"]}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 10: // Special Teams
        return (
          <div className="space-y-3">
            <NarrativeBox text="Roll Table E: 4×2d6 per team for KR, PR, FG range, and XP range." type="info" />
            <div className="flex items-center gap-2 flex-wrap">
              <InfoTooltip text={EXPLANATIONS.electric} />
              <InfoTooltip text={EXPLANATIONS.fgRange} />
              <InfoTooltip text={EXPLANATIONS.xpRange} />
            </div>
            {renderDiceModeHeader("Roll All", autoRollSpecialTeams)}
            {diceMode === "digital" && (
              <DigitalDicePanel
                diceCount={2}
                onResult={(roll) => {
                  // Apply as KR roll for selected team (user should roll 4 times)
                  rollSpecialTeamsForTeam(digitalTeamIdx, roll, randomDiceResult(), randomDiceResult(), randomDiceResult());
                }}
                teams={teams}
                selectedTeamIndex={digitalTeamIdx}
                onSelectTeam={setDigitalTeamIdx}
                label="Table E: Special Teams (rolls all 4 sub-tables)"
              />
            )}
            <div className="space-y-1.5">
              {teams.map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded text-xs flex-wrap" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                  <span className="font-fdf-mono font-bold w-12 flex-shrink-0" style={{ color: t.primaryColor }}>{t.abbreviation}</span>
                  <span className="text-xs truncate max-w-[100px]" style={{ color: "var(--fdf-text-primary)" }}>{t.name}</span>
                  <span style={{ color: "var(--fdf-text-secondary)" }}>
                    {t.qualities.specialTeams.kickReturn && (
                      <span className="text-green-400">KR: ELECTRIC{t.qualities.specialTeams.kickReturnSemi ? "•" : ""} </span>
                    )}
                    {t.qualities.specialTeams.puntReturn && (
                      <span className="text-green-400">PR: ELECTRIC{t.qualities.specialTeams.puntReturnSemi ? "•" : ""} </span>
                    )}
                  </span>
                  <span className="ml-auto font-fdf-mono flex items-center gap-2" style={{ color: "var(--fdf-text-muted)" }}>
                    <span>FG:</span>
                    <EditableText
                      value={t.kicking.fgRange}
                      onChange={(v) => updateTeamAt(i, (tt) => ({ ...tt, kicking: { ...tt.kicking, fgRange: v } }))}
                      placeholder="—"
                    />
                    <span>XP:</span>
                    <EditableText
                      value={t.kicking.xpRange}
                      onChange={(v) => updateTeamAt(i, (tt) => ({ ...tt, kicking: { ...tt.kicking, xpRange: v } }))}
                      placeholder="—"
                    />
                  </span>
                  {diceMode === "auto" && renderRerollBtn(10, i)}
                  {diceMode === "manual" && (
                    <div className="w-full mt-1">
                      <DiceInput value="11" onChange={(roll) => rollSpecialTeamsForTeam(i, roll, randomDiceResult(), randomDiceResult(), randomDiceResult())} diceCount={2} label="Roll" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 11: // Scoring Tendency
        return (
          <div className="space-y-3">
            <NarrativeBox text="Roll 1d6 per team for Scoring Tendency: P+ (pass-heavy), P (pass), Neutral, R (run), R+ (run-heavy)." type="info" />
            <div className="flex items-center gap-2">
              <InfoTooltip text={EXPLANATIONS.scoringTendency} />
            </div>
            {renderDiceModeHeader("Roll All", autoRollTendency)}
            {diceMode === "digital" && (
              <DigitalDicePanel
                diceCount={1}
                onResult={(roll) => rollTendencyForTeam(digitalTeamIdx, parseInt(roll, 10))}
                teams={teams}
                selectedTeamIndex={digitalTeamIdx}
                onSelectTeam={setDigitalTeamIdx}
                label="Scoring Tendency (1d6)"
              />
            )}
            <div className="space-y-1.5">
              {teams.map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded text-xs" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                  <span className="font-fdf-mono font-bold w-12 flex-shrink-0" style={{ color: t.primaryColor }}>{t.abbreviation}</span>
                  <span className="text-xs truncate max-w-[100px]" style={{ color: "var(--fdf-text-primary)" }}>{t.name}</span>
                  <EditableQuality
                    value={t.qualities.offense.scoringTendency}
                    options={[null, "P+", "P", "R", "R+"]}
                    onChange={(v) => updateTeamQualities(i, (q) => ({ ...q, offense: { ...q.offense, scoringTendency: v as typeof q.offense.scoringTendency } }))}
                    positiveValues={["P+", "P"]}
                    negativeValues={["R+", "R"]}
                  />
                  {diceMode === "auto" && renderRerollBtn(11, i)}
                  {diceMode === "manual" && (
                    <DiceInput value="1" onChange={(roll) => rollTendencyForTeam(i, parseInt(roll, 10))} diceCount={1} label="" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 12: // Review & Create
        return (
          <div className="space-y-3">
            <NarrativeBox text={`Ready to create "${leagueName}" with ${teams.length} teams in Classic Mode.`} type="positive" />
            <div className="space-y-1.5">
              {teams.map((t, i) => (
                <div key={i} className="px-3 py-2 rounded text-xs space-y-1" style={{ backgroundColor: "var(--fdf-bg-secondary)", border: "1px solid var(--fdf-border)" }}>
                  <div className="flex items-center gap-2">
                    {t.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.logoUrl} alt="" className="w-5 h-5 rounded object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded" style={{ backgroundColor: t.primaryColor }} />
                    )}
                    <span className="font-bold" style={{ color: "var(--fdf-text-primary)" }}>{t.name}</span>
                    <span className="font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>{t.abbreviation}</span>
                    <span className="ml-auto font-fdf-mono" style={{ color: "var(--fdf-accent)" }}>
                      {t.classicData.franchisePoints} FP
                    </span>
                  </div>
                  <div style={{ color: "var(--fdf-text-secondary)" }}>
                    HC: {t.classicData.headCoachName || "TBD"} ({t.classicData.headCoachGrade}) · FO: {t.classicData.frontOfficeGrade} · {t.classicData.ownership.competence}/{t.classicData.ownership.loyalty}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-fdf-mono font-bold" style={{ color: "var(--fdf-accent)" }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-xs font-fdf-mono" style={{ color: "var(--fdf-text-muted)" }}>
            {STEPS[step]}
          </span>
        </div>
        <div className="h-1 rounded-full" style={{ backgroundColor: "var(--fdf-bg-secondary)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, backgroundColor: "var(--fdf-accent)" }}
          />
        </div>
      </div>

      {/* Step content */}
      <FdfCard className="mb-4">
        <h2 className="text-sm font-bold font-fdf-mono mb-4" style={{ color: "var(--fdf-text-primary)" }}>
          {STEPS[step]}
        </h2>
        {renderStep()}
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

        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            disabled={!canNext()}
            className="flex items-center gap-1 px-4 py-2 rounded text-sm font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--fdf-accent)" }}
            type="button"
          >
            Next
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleCreateLeague}
            disabled={processing}
            className="flex items-center gap-1 px-5 py-2 rounded text-sm font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: "#22c55e" }}
            type="button"
          >
            <Check size={14} />
            {processing ? "Creating..." : "Create League"}
          </button>
        )}
      </div>
    </div>
  );
}
