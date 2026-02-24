"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FdfTeam, TeamQualities, TeamKicking, FinderRoster, ClockQualityLevel } from "@/lib/fdf/types";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { QualityEditor } from "./QualityEditor";
import { FinderRosterEditor, EMPTY_FINDER_ROSTER } from "./FinderRosterEditor";
import { ChevronDown, ChevronRight } from "lucide-react";

// Quality dropdown options
const POSITIVE_NEGATIVE = (pos: string, neg: string) => [
  { label: pos, value: `${pos}_full` },
  { label: `${pos}•`, value: `${pos}_semi` },
  { label: "—", value: "none" },
  { label: `${neg}•`, value: `${neg}_semi` },
  { label: neg, value: `${neg}_full` },
];

const CLOCK_OPTIONS = [
  { label: "Super EFFICIENT", value: "EFFICIENT_super" },
  { label: "EFFICIENT", value: "EFFICIENT_full" },
  { label: "EFFICIENT•", value: "EFFICIENT_semi" },
  { label: "—", value: "none" },
  { label: "INEFFICIENT•", value: "INEFFICIENT_semi" },
  { label: "INEFFICIENT", value: "INEFFICIENT_full" },
  { label: "Super INEFFICIENT", value: "INEFFICIENT_super" },
];

const TENDENCY_OPTIONS = [
  { label: "P+", value: "P+" },
  { label: "P", value: "P" },
  { label: "—", value: "none" },
  { label: "R", value: "R" },
  { label: "R+", value: "R+" },
];

const ELECTRIC_OPTIONS = [
  { label: "ELECTRIC", value: "ELECTRIC_full" },
  { label: "ELECTRIC•", value: "ELECTRIC_semi" },
  { label: "—", value: "none" },
];

const LEAGUE_OPTIONS = ["NFL", "AFL", "USFL", "XFL", "AAF", "WFL", "Custom"] as const;

function parseQuality(val: string): { quality: string | null; semi: boolean } {
  if (val === "none") return { quality: null, semi: false };
  const parts = val.split("_");
  return { quality: parts[0], semi: parts[1] === "semi" };
}

function parseClock(val: string): { quality: "EFFICIENT" | "INEFFICIENT" | null; level: ClockQualityLevel } {
  if (val === "none") return { quality: null, level: null };
  const parts = val.split("_");
  return {
    quality: parts[0] as "EFFICIENT" | "INEFFICIENT",
    level: parts[1] as ClockQualityLevel,
  };
}

function encodeQuality(quality: string | null, semi: boolean): string {
  if (!quality) return "none";
  return `${quality}_${semi ? "semi" : "full"}`;
}

function encodeClock(quality: "EFFICIENT" | "INEFFICIENT" | null, level: ClockQualityLevel): string {
  if (!quality || !level) return "none";
  return `${quality}_${level}`;
}

interface TeamFormProps {
  existingTeam?: FdfTeam;
}

export function TeamForm({ existingTeam }: TeamFormProps) {
  const router = useRouter();
  const { addTeam, updateTeam, deleteTeam } = useTeamStore();

  const [name, setName] = useState(existingTeam?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(existingTeam?.abbreviation ?? "");
  const [season, setSeason] = useState(existingTeam?.season ?? 2024);
  const [league, setLeague] = useState<FdfTeam["league"]>(existingTeam?.league ?? "NFL");
  const [conference, setConference] = useState(existingTeam?.conference ?? "");
  const [division, setDivision] = useState(existingTeam?.division ?? "");
  const [record, setRecord] = useState(existingTeam?.record ?? "");
  const [headCoach, setHeadCoach] = useState(existingTeam?.headCoach ?? "");
  const [logoUrl, setLogoUrl] = useState(existingTeam?.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(existingTeam?.primaryColor ?? "#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState(existingTeam?.secondaryColor ?? "#ffffff");
  const [notes, setNotes] = useState(existingTeam?.notes ?? "");
  const [finderRoster, setFinderRoster] = useState<FinderRoster>(
    existingTeam?.finderRoster ?? { ...EMPTY_FINDER_ROSTER }
  );
  const [rosterExpanded, setRosterExpanded] = useState(!!existingTeam?.finderRoster);

  const [fgRange, setFgRange] = useState(existingTeam?.kicking.fgRange ?? "");
  const [xpRange, setXpRange] = useState(existingTeam?.kicking.xpRange ?? "");

  // Offense qualities as encoded strings
  const eq = existingTeam?.qualities;
  const [offScoring, setOffScoring] = useState(eq ? encodeQuality(eq.offense.scoring, eq.offense.scoringSemi) : "none");
  const [offYards, setOffYards] = useState(eq ? encodeQuality(eq.offense.yards, eq.offense.yardsSemi) : "none");
  const [offProtection, setOffProtection] = useState(eq ? encodeQuality(eq.offense.protection, eq.offense.protectionSemi) : "none");
  const [offBallSec, setOffBallSec] = useState(eq ? encodeQuality(eq.offense.ballSecurity, eq.offense.ballSecuritySemi) : "none");
  const [offFumbles, setOffFumbles] = useState(eq ? encodeQuality(eq.offense.fumbles, eq.offense.fumblesSemi) : "none");
  const [offDiscipline, setOffDiscipline] = useState(eq ? encodeQuality(eq.offense.discipline, eq.offense.disciplineSemi) : "none");
  const [offClock, setOffClock] = useState(eq ? encodeClock(eq.offense.clockManagement, eq.offense.clockManagementLevel) : "none");
  const [offTendency, setOffTendency] = useState(eq?.offense.scoringTendency ?? "none");

  const [defScoring, setDefScoring] = useState(eq ? encodeQuality(eq.defense.scoring, eq.defense.scoringSemi) : "none");
  const [defYards, setDefYards] = useState(eq ? encodeQuality(eq.defense.yards, eq.defense.yardsSemi) : "none");
  const [defPassRush, setDefPassRush] = useState(eq ? encodeQuality(eq.defense.passRush, eq.defense.passRushSemi) : "none");
  const [defCoverage, setDefCoverage] = useState(eq ? encodeQuality(eq.defense.coverage, eq.defense.coverageSemi) : "none");
  const [defFumbleRec, setDefFumbleRec] = useState(eq ? encodeQuality(eq.defense.fumbleRecovery, eq.defense.fumbleRecoverySemi) : "none");
  const [defDiscipline, setDefDiscipline] = useState(eq ? encodeQuality(eq.defense.discipline, eq.defense.disciplineSemi) : "none");

  const [stKR, setStKR] = useState(eq ? encodeQuality(eq.specialTeams.kickReturn, eq.specialTeams.kickReturnSemi) : "none");
  const [stPR, setStPR] = useState(eq ? encodeQuality(eq.specialTeams.puntReturn, eq.specialTeams.puntReturnSemi) : "none");

  const buildQualities = (): TeamQualities => {
    const os = parseQuality(offScoring);
    const oy = parseQuality(offYards);
    const op = parseQuality(offProtection);
    const ob = parseQuality(offBallSec);
    const of2 = parseQuality(offFumbles);
    const od = parseQuality(offDiscipline);
    const oc = parseClock(offClock);

    const ds = parseQuality(defScoring);
    const dy = parseQuality(defYards);
    const dp = parseQuality(defPassRush);
    const dc = parseQuality(defCoverage);
    const dfr = parseQuality(defFumbleRec);
    const dd = parseQuality(defDiscipline);

    const skr = parseQuality(stKR);
    const spr = parseQuality(stPR);

    return {
      offense: {
        scoring: os.quality as TeamQualities["offense"]["scoring"],
        scoringSemi: os.semi,
        yards: oy.quality as TeamQualities["offense"]["yards"],
        yardsSemi: oy.semi,
        protection: op.quality as TeamQualities["offense"]["protection"],
        protectionSemi: op.semi,
        ballSecurity: ob.quality as TeamQualities["offense"]["ballSecurity"],
        ballSecuritySemi: ob.semi,
        fumbles: of2.quality as TeamQualities["offense"]["fumbles"],
        fumblesSemi: of2.semi,
        discipline: od.quality as TeamQualities["offense"]["discipline"],
        disciplineSemi: od.semi,
        clockManagement: oc.quality,
        clockManagementLevel: oc.level,
        scoringTendency: offTendency === "none" ? null : offTendency as TeamQualities["offense"]["scoringTendency"],
      },
      defense: {
        scoring: ds.quality as TeamQualities["defense"]["scoring"],
        scoringSemi: ds.semi,
        yards: dy.quality as TeamQualities["defense"]["yards"],
        yardsSemi: dy.semi,
        passRush: dp.quality as TeamQualities["defense"]["passRush"],
        passRushSemi: dp.semi,
        coverage: dc.quality as TeamQualities["defense"]["coverage"],
        coverageSemi: dc.semi,
        fumbleRecovery: dfr.quality as TeamQualities["defense"]["fumbleRecovery"],
        fumbleRecoverySemi: dfr.semi,
        discipline: dd.quality as TeamQualities["defense"]["discipline"],
        disciplineSemi: dd.semi,
      },
      specialTeams: {
        kickReturn: skr.quality as TeamQualities["specialTeams"]["kickReturn"],
        kickReturnSemi: skr.semi,
        puntReturn: spr.quality as TeamQualities["specialTeams"]["puntReturn"],
        puntReturnSemi: spr.semi,
      },
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !abbreviation.trim()) return;

    const qualities = buildQualities();
    const kicking: TeamKicking = { fgRange, xpRange };

    // Check if finder roster has any named players
    const hasFinderPlayers = [
      ...finderRoster.rushingTD,
      ...finderRoster.passingTD,
      ...finderRoster.receivingTD,
      ...finderRoster.kickingFGXP,
    ].some(p => p.name.trim() !== "");

    const teamFinderRoster = hasFinderPlayers ? finderRoster : undefined;

    const teamData = {
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
      season,
      league: league as FdfTeam["league"],
      conference: conference || undefined,
      division: division || undefined,
      record: record || undefined,
      headCoach: headCoach || undefined,
      qualities,
      kicking,
      primaryColor,
      secondaryColor,
      logoUrl: logoUrl || undefined,
      notes: notes || undefined,
      finderRoster: teamFinderRoster,
      // Keep legacy roster if it exists on the team
      roster: existingTeam?.roster,
    };

    if (existingTeam) {
      updateTeam(existingTeam.id, teamData);
    } else {
      addTeam(teamData);
    }
    router.push("/fdf/teams");
  };

  const handleDelete = () => {
    if (existingTeam && confirm("Delete this team?")) {
      deleteTeam(existingTeam.id);
      router.push("/fdf/teams");
    }
  };

  const inputStyle = {
    backgroundColor: "var(--fdf-bg-elevated)",
    color: "var(--fdf-text-primary)",
    border: "1px solid var(--fdf-border)",
  };

  const sectionClass = "rounded-lg p-4 mb-4";
  const sectionStyle = { backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {/* Basic Info */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="text-sm font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
          Basic Info
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>Team Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded px-2.5 py-2 text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>Abbreviation *</label>
            <input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} required maxLength={4} className="w-full rounded px-2.5 py-2 text-sm uppercase font-fdf-mono" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>Season Year</label>
            <input type="number" value={season} onChange={(e) => setSeason(Number(e.target.value))} className="w-full rounded px-2.5 py-2 text-sm font-fdf-mono" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>League</label>
            <select value={league} onChange={(e) => setLeague(e.target.value as FdfTeam["league"])} className="w-full rounded px-2.5 py-2 text-sm" style={inputStyle}>
              {LEAGUE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>Conference</label>
            <input value={conference} onChange={(e) => setConference(e.target.value)} className="w-full rounded px-2.5 py-2 text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>Division</label>
            <input value={division} onChange={(e) => setDivision(e.target.value)} className="w-full rounded px-2.5 py-2 text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>Record</label>
            <input value={record} onChange={(e) => setRecord(e.target.value)} placeholder="e.g. 10-7" className="w-full rounded px-2.5 py-2 text-sm font-fdf-mono" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>Head Coach</label>
            <input value={headCoach} onChange={(e) => setHeadCoach(e.target.value)} className="w-full rounded px-2.5 py-2 text-sm" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Offense Qualities */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="text-sm font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
          Offense Qualities
        </h2>
        <QualityEditor label="Scoring" options={POSITIVE_NEGATIVE("PROLIFIC", "DULL")} value={offScoring} onChange={setOffScoring} />
        <QualityEditor label="Yards" options={POSITIVE_NEGATIVE("DYNAMIC", "ERRATIC")} value={offYards} onChange={setOffYards} />
        <QualityEditor label="Protection" options={POSITIVE_NEGATIVE("SOLID", "POROUS")} value={offProtection} onChange={setOffProtection} />
        <QualityEditor label="Ball Security" options={POSITIVE_NEGATIVE("RELIABLE", "SHAKY")} value={offBallSec} onChange={setOffBallSec} />
        <QualityEditor label="Fumbles" options={POSITIVE_NEGATIVE("SECURE", "CLUMSY")} value={offFumbles} onChange={setOffFumbles} />
        <QualityEditor label="Discipline" options={POSITIVE_NEGATIVE("DISCIPLINED", "UNDISCIPLINED")} value={offDiscipline} onChange={setOffDiscipline} />
        <QualityEditor label="Clock Mgmt" options={CLOCK_OPTIONS} value={offClock} onChange={setOffClock} />
        <QualityEditor label="TD Tendency" options={TENDENCY_OPTIONS} value={offTendency} onChange={setOffTendency} />
      </div>

      {/* Defense Qualities */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="text-sm font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
          Defense Qualities
        </h2>
        <QualityEditor label="Scoring" options={POSITIVE_NEGATIVE("STAUNCH", "INEPT")} value={defScoring} onChange={setDefScoring} />
        <QualityEditor label="Yards" options={POSITIVE_NEGATIVE("STIFF", "SOFT")} value={defYards} onChange={setDefYards} />
        <QualityEditor label="Pass Rush" options={POSITIVE_NEGATIVE("PUNISHING", "MILD")} value={defPassRush} onChange={setDefPassRush} />
        <QualityEditor label="Coverage" options={POSITIVE_NEGATIVE("AGGRESSIVE", "MEEK")} value={defCoverage} onChange={setDefCoverage} />
        <QualityEditor label="Fumble Rec" options={POSITIVE_NEGATIVE("ACTIVE", "PASSIVE")} value={defFumbleRec} onChange={setDefFumbleRec} />
        <QualityEditor label="Discipline" options={POSITIVE_NEGATIVE("DISCIPLINED", "UNDISCIPLINED")} value={defDiscipline} onChange={setDefDiscipline} />
      </div>

      {/* Special Teams */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="text-sm font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
          Special Teams
        </h2>
        <QualityEditor label="KR Electric" options={ELECTRIC_OPTIONS} value={stKR} onChange={setStKR} />
        <QualityEditor label="PR Electric" options={ELECTRIC_OPTIONS} value={stPR} onChange={setStPR} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>FG Range</label>
            <input value={fgRange} onChange={(e) => setFgRange(e.target.value)} placeholder="e.g. 11-62" className="w-full rounded px-2.5 py-2 text-sm font-fdf-mono" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>XP Range</label>
            <input value={xpRange} onChange={(e) => setXpRange(e.target.value)} placeholder="e.g. 11-63" className="w-full rounded px-2.5 py-2 text-sm font-fdf-mono" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Colors & Notes */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="text-sm font-bold font-fdf-mono uppercase tracking-wider mb-3" style={{ color: "var(--fdf-accent)" }}>
          Appearance & Notes
        </h2>
        <div className="mb-3">
          <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>Logo URL</label>
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="w-full rounded px-2.5 py-2 text-sm" style={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 rounded px-2.5 py-2 text-sm font-fdf-mono" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>Secondary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              <input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 rounded px-2.5 py-2 text-sm font-fdf-mono" style={inputStyle} />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--fdf-text-secondary)" }}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded px-2.5 py-2 text-sm" style={inputStyle} />
        </div>
      </div>

      {/* Roster (Enhanced Mode) */}
      <div className={sectionClass} style={sectionStyle}>
        <button
          type="button"
          onClick={() => setRosterExpanded(!rosterExpanded)}
          className="flex items-center gap-1.5 w-full text-left"
        >
          {rosterExpanded
            ? <ChevronDown size={14} style={{ color: "var(--fdf-accent)" }} />
            : <ChevronRight size={14} style={{ color: "var(--fdf-text-muted)" }} />
          }
          <h2 className="text-sm font-bold font-fdf-mono uppercase tracking-wider" style={{ color: "var(--fdf-accent)" }}>
            Roster — Finder Categories
          </h2>
        </button>
        {!existingTeam && !rosterExpanded && (
          <p className="text-xs mt-2 ml-5" style={{ color: "var(--fdf-text-muted)" }}>
            Organize players by Enhanced Team Card finder tables
          </p>
        )}
        {rosterExpanded && (
          <div className="mt-3">
            <FinderRosterEditor finderRoster={finderRoster} onChange={setFinderRoster} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="px-5 py-2.5 rounded-md text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: "var(--fdf-accent)" }}
        >
          {existingTeam ? "Update Team" : "Create Team"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/fdf/teams")}
          className="px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
          style={{ color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
        >
          Cancel
        </button>
        {existingTeam && (
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
            style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
