"use client";

import { useState } from "react";
import {
  BookOpen,
  Zap,
  Users,
  Trophy,
  Clock,
  BarChart3,
  Share2,
  Calendar,
  Award,
  HardDrive,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Dices,
  Target,
  ArrowRight,
  FileSpreadsheet,
  Printer,
  Download,
  Upload,
  AlertTriangle,
  Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Reusable primitives                                                */
/* ------------------------------------------------------------------ */

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg p-5 ${className}`}
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      {children}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-sm font-bold font-fdf-mono uppercase tracking-wider mb-3"
      style={{ color: "var(--fdf-accent)" }}
    >
      {children}
    </h3>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4
      className="text-sm font-bold font-fdf-mono mb-2 mt-4"
      style={{ color: "var(--fdf-text-primary)" }}
    >
      {children}
    </h4>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
      {children}
    </p>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-2 rounded-md px-3 py-2 text-xs mt-3"
      style={{
        backgroundColor: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.25)",
        color: "var(--fdf-accent)",
      }}
    >
      <Lightbulb size={14} className="mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-2 rounded-md px-3 py-2 text-xs mt-3"
      style={{
        backgroundColor: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.25)",
        color: "#fbbf24",
      }}
    >
      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-2 rounded-md px-3 py-2 text-xs mt-3"
      style={{
        backgroundColor: "rgba(34,197,94,0.08)",
        border: "1px solid rgba(34,197,94,0.25)",
        color: "#4ade80",
      }}
    >
      <Info size={14} className="mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto mt-2 mb-3 rounded-md" style={{ border: "1px solid var(--fdf-border)" }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: "var(--fdf-bg-secondary)" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-bold font-fdf-mono uppercase tracking-wider"
                style={{ color: "var(--fdf-text-muted)", borderBottom: "1px solid var(--fdf-border)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2"
                  style={{
                    color: "var(--fdf-text-secondary)",
                    borderBottom: ri < rows.length - 1 ? "1px solid var(--fdf-border)" : "none",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre
      className="rounded-md p-3 text-xs font-fdf-mono overflow-x-auto mt-2 mb-3 whitespace-pre-wrap"
      style={{ backgroundColor: "var(--fdf-bg-secondary)", color: "var(--fdf-text-secondary)", border: "1px solid var(--fdf-border)" }}
    >
      {children}
    </pre>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="px-1 py-0.5 rounded text-xs font-fdf-mono"
      style={{ backgroundColor: "var(--fdf-bg-secondary)", color: "var(--fdf-accent)" }}
    >
      {children}
    </code>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-1.5 mt-2 mb-3 pl-1">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--fdf-text-secondary)" }}>
          <span
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-fdf-mono mt-0.5"
            style={{ backgroundColor: "var(--fdf-accent)", color: "#fff" }}
          >
            {i + 1}
          </span>
          <span className="leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/*  Table of Contents                                                  */
/* ------------------------------------------------------------------ */

function TableOfContents({
  sections,
  activeId,
  onSelect,
}: {
  sections: Section[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <SectionCard>
      <Heading>Table of Contents</Heading>
      <nav className="space-y-0.5">
        {sections.map((s, i) => {
          const Icon = s.icon;
          const active = activeId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-xs transition-colors"
              style={{
                color: active ? "#fff" : "var(--fdf-text-secondary)",
                backgroundColor: active ? "rgba(59,130,246,0.15)" : "transparent",
              }}
            >
              <span className="font-fdf-mono w-5 text-right flex-shrink-0" style={{ color: "var(--fdf-text-muted)" }}>
                {i + 1}.
              </span>
              <Icon size={14} className="flex-shrink-0" />
              <span className="truncate">{s.title}</span>
            </button>
          );
        })}
      </nav>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible Section                                                */
/* ------------------------------------------------------------------ */

function CollapsibleSection({
  section,
  index,
  isOpen,
  onToggle,
}: {
  section: Section;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;
  return (
    <div id={section.id}>
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full text-left py-3 px-1 group"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(59,130,246,0.12)", color: "var(--fdf-accent)" }}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-fdf-mono"
              style={{ color: "var(--fdf-text-muted)" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="text-sm font-bold font-fdf-mono tracking-wide"
              style={{ color: "var(--fdf-text-primary)" }}
            >
              {section.title}
            </span>
          </div>
        </div>
        <span style={{ color: "var(--fdf-text-muted)" }}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>
      {isOpen && (
        <SectionCard className="mb-4 ml-11">
          {section.content}
        </SectionCard>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section content                                                    */
/* ------------------------------------------------------------------ */

const SECTIONS: Section[] = [
  /* ---- 1. What Is the FDF Companion App? ---- */
  {
    id: "intro",
    icon: BookOpen,
    title: "What Is the FDF Companion App?",
    content: (
      <>
        <P>
          The FDF Companion App is a free, browser-based digital companion for <strong>Fast Drive Football &mdash; DICE Version</strong> (FDF),
          the tabletop football game. It runs entirely in your browser &mdash; no account, no downloads, no internet
          connection required after the initial page load.
        </P>

        <SubHeading>What it does</SubHeading>
        <ul className="space-y-1 text-sm pl-4 mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span>Tracks scores and game clock so you never lose count of ticks or quarters</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span>Records every drive with field position, result, time, and an auto-generated play-by-play summary</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span>Tracks player stats in Enhanced Mode &mdash; passing TDs, rushing TDs, receiving TDs, field goals, turnovers, and more</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span>Calculates win probability in real time</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span>Generates shareable game cards you can download as PNG images (WIP)</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span>Exports game reports as Excel spreadsheets or printable PDFs</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span>Replays entire seasons with schedules, instant result simulations, standings, and playoffs</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span>Computes season stats and awards &mdash; MVP, OPOY, Defense Team of the Year, Players of the Week, and a season recap</span></li>
        </ul>

        <SubHeading>What it doesn&apos;t do</SubHeading>
        <P>
          The app is a <strong>companion</strong>, not a replacement for the physical game. You still roll your own dice,
          consult the FDF charts and tables, and make all the decisions. The app records what happened &mdash; it doesn&apos;t
          play the game for you. (The one exception is the Instant Result simulator for season mode, which uses the FDF
          rules to generate plausible final scores.)
        </P>

        <SubHeading>Where your data lives</SubHeading>
        <P>
          Everything is stored in your browser&apos;s <strong>localStorage</strong>. There is no server, no cloud sync,
          and no login. Your teams, games, and seasons persist across browser sessions on the same device. You can export
          a full JSON backup at any time (see Data Management).<strong>We highly suggest that you are doing this often because of updates and bug fixes.</strong>
        </P>
      </>
    ),
  },

  /* ---- 2. Getting Started ---- */
  {
    id: "getting-started",
    icon: Zap,
    title: "Getting Started",
    content: (
      <>
        <SubHeading>The Dashboard</SubHeading>
        <P>
          The dashboard is your home base. Three quick-action cards give you one-click access to the most common tasks:
        </P>
        <Table
          headers={["Card", "Action"]}
          rows={[
            ["Quick Game", "Start a new game between two teams"],
            ["Teams", "Manage your team library (badge shows count)"],
            ["History", "Browse completed games (badge shows count)"],
          ]}
        />
        <P>
          Below the cards you&apos;ll see <strong>Active Games</strong> (in-progress games you can resume) and
          <strong> Recent Games</strong> (last 5 completed games). Click any game to jump to it.
        </P>

        <SubHeading>Sidebar Navigation</SubHeading>
        <P>A persistent sidebar gives you quick access to every section:</P>
        <Table
          headers={["Label", "Where it goes"]}
          rows={[
            ["Dashboard", "Home base with quick actions and recent activity"],
            ["Quick Game", "Start a new game"],
            ["Teams", "Create, import, and edit teams"],
            ["Seasons", "Manage full season replays"],
            ["History", "Browse all completed games"],
            ["Data", "Export and import your data"],
            ["Guide", "This page!"],
            ["Dark/Light Mode", "Switch between Dark and Light mode!"],
          ]}
        />

        <SubHeading>First things first</SubHeading>
        <P>
          Before you can play a game, you need at least <strong>two teams</strong>. Head to Teams and create or import
          your first teams.
        </P>
      </>
    ),
  },

  /* ---- 3. Managing Teams ---- */
  {
    id: "teams",
    icon: Users,
    title: "Managing Teams",
    content: (
      <>
        <SubHeading>Creating a team</SubHeading>
        <P>Go to Teams &gt; New Team. Only the <strong>name</strong> and <strong>abbreviation</strong> are required &mdash; everything else is optional metadata.</P>

        <Table
          headers={["Field", "Required", "Example"]}
          rows={[
            ["Team Name", "Yes", "Green Bay Packers"],
            ["Abbreviation", "Yes", "GB"],
            ["Season Year", "No", "2024"],
            ["League", "No", "NFL, AFL, USFL, XFL, CFL, Custom"],
            ["Conference / Division", "No", "NFC / North"],
            ["Record / Head Coach", "No", "12-5 / Matt LaFleur"],
            ["Primary / Secondary Color", "No", "#203731 / #FFB612"],
          ]}
        />

        <SubHeading>Team Qualities</SubHeading>
        <P>
          Enter the team&apos;s FDF quality ratings. Each quality has a dropdown matching the FDF team cards.
          Use <InlineCode>*</InlineCode> to indicate a &quot;semi&quot; quality (half-strength).
        </P>
        <Table
          headers={["Category", "Qualities"]}
          rows={[
            ["Offense", "Scoring, Yards, Protection, Ball Security, Fumbles, Discipline, Clock Mgmt, Tendency"],
            ["Defense", "Scoring, Yards, Pass Rush, Coverage, Fumble Recovery, Discipline"],
            ["Special Teams", "Kick Return, Punt Return, FG Range, XP Range"],
          ]}
        />
        <Tip>
          Qualities are displayed on Team Quality Cards during games and are used by the Instant Result simulator in
          Season Mode. Enter them accurately for best results.
        </Tip>

        <SubHeading>Finder Roster (Player Roster)</SubHeading>
        <P>The roster is organized into four categories matching the FDF Player Finder:</P>
        <Table
          headers={["Category", "What it tracks"]}
          rows={[
            ["Rushing TD", "Ball carriers who score rushing touchdowns"],
            ["Passing TD", "Quarterbacks who throw touchdown passes"],
            ["Receiving TD", "Receivers who catch touchdown passes"],
            ["FG & XP", "Kickers who attempt field goals and extra points"],
          ]}
        />
        <P>
          Players can appear in multiple categories &mdash; a running back might be in both Rushing TD and Receiving TD.
          Each player entry has a name and an optional finder range (e.g., &quot;11-40&quot;). Just make sure that names are the same.
        </P>

        <SubHeading>Importing teams from text</SubHeading>
        <P>
          For bulk team creation, use the <strong>Import</strong> button on the Teams list page. Paste text directly or
          upload a <InlineCode>.txt</InlineCode> file.
        </P>
        <Code>{
`# ===========================
# FDF TEAM IMPORT — EXAMPLE
# ===========================
# Lines starting with # are comments and will be ignored by the importer.
# You can paste this entire file into the Team Import modal.
# To import multiple teams, separate them with ---

# --- TEAM INFO ---
# Required fields: NAME and ABR
# All other fields are optional with sensible defaults.
NAME: Green Bay Packers
ABR: GB
SEASON: 2024
LEAGUE: NFL
# Valid leagues: NFL | AFL | USFL | XFL | AAF | WFL | Custom
CONFERENCE: NFC
DIVISION: North
RECORD: 12-5
HEAD COACH: Matt LaFleur
COLOR: #203731
# COLOR is the primary team color (hex code)
COLOR2: #FFB612
# COLOR2 is the secondary team color (hex code)
LOGO: https://example.com/packers-logo.png
# LOGO is a URL to the team logo image
FG: 11-62
# FG is the Field Goal success range (two-dice roll, e.g. 11-62)
XP: 11-63
# XP is the Extra Point success range (two-dice roll, e.g. 11-63)
NOTES: 2024 NFC North Champions

# --- OFFENSE ---
# Each quality can be set to one of its valid keywords.
# Append * for semi (requires a 1d6 check), or use — for none.
#
# Scoring:       PROLIFIC | PROLIFIC* | DULL* | DULL | —
# Yards:         DYNAMIC | DYNAMIC* | ERRATIC* | ERRATIC | —
# Protection:    SOLID | SOLID* | POROUS* | POROUS | —
# Ball Security: RELIABLE | RELIABLE* | SHAKY* | SHAKY | —
# Fumbles:       SECURE | SECURE* | CLUMSY* | CLUMSY | —
# Discipline:    DISCIPLINED | DISCIPLINED* | UNDISCIPLINED* | UNDISCIPLINED | —
# Clock:         SUPER EFFICIENT | EFFICIENT | EFFICIENT* | INEFFICIENT* | INEFFICIENT | SUPER INEFFICIENT | —
# Tendency:      P+ | P | R | R+ | —
OFFENSE
Scoring: PROLIFIC
Yards: DYNAMIC*
Protection: SOLID
Ball Security: RELIABLE*
Fumbles: —
Discipline: DISCIPLINED
Clock: EFFICIENT
Tendency: P

# --- DEFENSE ---
# Scoring:         STAUNCH | STAUNCH* | INEPT* | INEPT | —
# Yards:           STIFF | STIFF* | SOFT* | SOFT | —
# Pass Rush:       PUNISHING | PUNISHING* | MILD* | MILD | —
# Coverage:        AGGRESSIVE | AGGRESSIVE* | MEEK* | MEEK | —
# Fumble Recovery: ACTIVE | ACTIVE* | PASSIVE* | PASSIVE | —
# Discipline:      DISCIPLINED | DISCIPLINED* | UNDISCIPLINED* | UNDISCIPLINED | —
DEFENSE
Scoring: STAUNCH*
Yards: STIFF
Pass Rush: PUNISHING*
Coverage: AGGRESSIVE
Fumble Recovery: ACTIVE
Discipline: —

# --- SPECIAL TEAMS ---
# Only ELECTRIC is available (no negative counterpart).
# KR: ELECTRIC | ELECTRIC* | —
# PR: ELECTRIC | ELECTRIC* | —
SPECIAL TEAMS
KR: ELECTRIC*
PR: ELECTRIC

# --- ROSTER ---
# Format: Player Name, Range
# Range is a two-dice roll range like 11-40.
# Each category is a section header followed by player lines.
RUSHING TD
Josh Jacobs, 11-40
Emanuel Wilson, 41-55
Chris Brooks, 56-62
MarShawn Lloyd, 63-66

PASSING TD
Jordan Love, 11-66

RECEIVING TD
Jayden Reed, 11-24
Romeo Doubs, 25-40
Dontayvion Wicks, 41-50
Tucker Kraft, 51-60
Christian Watson, 61-66

FG & XP
Brayden Narveson, 11-66`}</Code>
        <P>
          Separate multiple teams in the same file with <InlineCode>---</InlineCode> on its own line.
          Click <strong>Parse &amp; Preview</strong> to review before importing.
        </P>
      </>
    ),
  },

  /* ---- 4. Playing a Quick Game ---- */
  {
    id: "quick-game",
    icon: Zap,
    title: "Playing a Quick Game",
    content: (
      <>
        <SubHeading>Setting up</SubHeading>
        <StepList
          steps={[
            "Select the away team from the dropdown",
            "Select the home team (must be different from away)",
            "Toggle Enhanced Mode (optional) — enables per-drive player tracking, auto-generated summaries with player names, and post-game box scores with MVP",
            "Coin toss — click the button for a random result, or manually select which team receives",
            "Click Start Game",
          ]}
        />

        <SubHeading>Standard vs. Enhanced Mode</SubHeading>
        <Table
          headers={["Feature", "Standard", "Enhanced"]}
          rows={[
            ["Score tracking", "Yes", "Yes"],
            ["Drive log & game clock", "Yes", "Yes"],
            ["Auto-summaries", "Team names only", "Player names included"],
            ["Player selection per drive", "No", "Yes"],
            ["Box score & MVP", "No", "Yes"],
            ["Season player stats", "No", "Yes"],
            ["Win Probability", "Yes", "Yes"],
          ]}
        />
        <Tip>
          Enhanced Mode is worth the small extra effort. The auto-summaries, box scores, and season stat tracking all
          depend on it.
        </Tip>
      </>
    ),
  },

  /* ---- 5. The Digital Scoresheet ---- */
  {
    id: "scoresheet",
    icon: Target,
    title: "The Digital Scoresheet",
    content: (
      <>
        <SubHeading>Layout</SubHeading>
        <P>
          The scoresheet has three main areas: a <strong>scoreboard</strong> at the top with team scores by quarter,
          the <strong>drive entry form</strong> in the main area (with Team Quality Cards flanking the scoreboard), and
          a <strong>right sidebar</strong> with the game clock, dice roller, timing die reference, and scrolling event log.
        </P>

        <SubHeading>Entering a drive</SubHeading>
        <P>Each drive follows a consistent flow:</P>
        <StepList
          steps={[
            "Field Position — select POOR (red), AVERAGE (amber), or GREAT (green)",
            "Drive Time — enter ticks consumed (1-4 based on timing die roll)",
            "Drive Result — select what happened (TD, FG, turnover, punt, etc.)",
            "PAT — if a touchdown, select XP Good, XP Missed, 2PT Good, or 2PT Failed",
            "Player Selection — (Enhanced Mode) pick the players involved from your roster",
            "Summary — review and optionally edit the auto-generated play-by-play text",
            "Log Drive — click to record. Score updates, clock advances, possession toggles.",
          ]}
        />

        <SubHeading>Timing Die Reference</SubHeading>
        <Table
          headers={["Timing Die", "Ticks"]}
          rows={[["1", "1"], ["2", "2"], ["3", "2"], ["4", "2"], ["5", "3"], ["6", "4"]]}
        />
        <P>Each quarter has 12 ticks (15 minutes at 75 seconds per tick).</P>

        <SubHeading>Drive results</SubHeading>
        <P>Results are grouped by category:</P>
        <Table
          headers={["Category", "Results"]}
          rows={[
            ["Scoring", "Rushing TD (6), Passing TD (6), FG Good (3), FG Missed (0), Safety (2 to defense)"],
            ["Turnovers", "Interception, Fumble, Turnover on Downs"],
            ["Return TDs", "Kickoff Return TD, Punt Return TD, Fumble Return TD, INT Return TD, Blocked FG/Punt TD, Free Kick Return TD"],
            ["Kick/Punt", "Punt, Punt (Backed Up), Punt (Coffin Corner), and kick/punt fumble outcomes"],
            ["Special", "Kneel Down, Desperation Play/TD/FG, Unusual Result, End of Half, End of Game"],
          ]}
        />

        <SubHeading>Key features</SubHeading>
        <ul className="space-y-2 text-sm pl-4 mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span><strong>Timing warnings</strong> &mdash; In Q2 and Q4, when 4 or fewer ticks remain, a red warning appears to remind you to check clock management qualities</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span><strong>Dice roller</strong> &mdash; Three clickable dice (black, white, red) with &quot;Roll All&quot; button. Values are attached to the current drive.</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span><strong>Event log</strong> &mdash; Scrolling sidebar with color-coded drive entries (green for TDs, red for turnovers, blue for FGs, purple for safeties)</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span><strong>Undo</strong> &mdash; Remove the last recorded drive. Reverses score, restores ticks, and reverts possession.</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span><strong>End Half / End Game</strong> &mdash; Skip to halftime or finish the game immediately without entering a drive</span></li>
          <li className="flex gap-2"><ArrowRight size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--fdf-accent)" }} /><span><strong>Live Stats</strong> &mdash; Toggle a real-time box score during the game without leaving the scoresheet</span></li>
        </ul>
      </>
    ),
  },

  /* ---- 6. Overtime ---- */
  {
    id: "overtime",
    icon: Clock,
    title: "Overtime",
    content: (
      <>
        <SubHeading>When does overtime happen?</SubHeading>
        <P>
          When the score is tied at the end of Q4, the game enters a &quot;waiting for coin toss&quot; state.
          The scoresheet detects this automatically and shows the OT Coin Toss component.
        </P>

        <SubHeading>The coin toss</SubHeading>
        <StepList
          steps={[
            "Click Flip for a random result, or manually select which team receives",
            "Toggle \"Can end in tie\" — checked for regular season (tie is possible), unchecked for playoffs (play until someone wins)",
            "Click Start Overtime",
          ]}
        />

        <SubHeading>How overtime works (NFL rules)</SubHeading>
        <P><strong>Phase 1 &mdash; Guaranteed Possession:</strong></P>
        <ul className="space-y-1 text-sm pl-4 mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
          <li>The receiving team gets the ball first</li>
          <li>After the first team&apos;s possession ends, the second team gets the ball</li>
          <li>After both teams have had at least one possession, if the score is different, the game is over</li>
          <li>If the score is still tied, the game moves to sudden death</li>
        </ul>
        <Warning>A safety on the first possession ends the game immediately &mdash; the defensive team wins.</Warning>

        <P><strong>Phase 2 &mdash; Sudden Death:</strong></P>
        <ul className="space-y-1 text-sm pl-4 mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
          <li>Any scoring play that changes the score differential ends the game instantly</li>
          <li>If the clock runs out: <strong>Regular season</strong> = tie, <strong>Playoffs</strong> = new OT period begins</li>
        </ul>
        <P>Each overtime period has <strong>8 ticks</strong> (10 minutes of game time).</P>
        <P>We implemented the official NFL rules for the overtime because there were no specifics in the Rule Book of the game.</P>
      </>
    ),
  },

  /* ---- 7. Win Probability Chart ---- */
  {
    id: "win-probability",
    icon: BarChart3,
    title: "Win Probability Chart",
    content: (
      <>
        <SubHeading>What is it?</SubHeading>
        <P>
          The WP chart tracks each team&apos;s estimated chance of winning after every drive. It&apos;s a line graph
          from 0% (away team certain to win) to 100% (home team certain to win), with 50% being a tossup.
        </P>

        <SubHeading>How to read it</SubHeading>
        <ul className="space-y-1 text-sm pl-4 mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
          <li>A <strong>flat line near 50%</strong> means the game is competitive</li>
          <li><strong>Sharp spikes</strong> indicate momentum-changing plays</li>
          <li>The line converges toward 0% or 100% late in the game, because each remaining tick matters more</li>
        </ul>

        <SubHeading>How it&apos;s calculated</SubHeading>
        <P>The WP model considers:</P>
        <Table
          headers={["Factor", "Effect"]}
          rows={[
            ["Score differential", "Bigger lead = higher WP"],
            ["Time remaining", "Late-game leads are worth more"],
            ["Possession", "Team with ball gets +1.5 points of expected value"],
            ["Home field", "Small built-in bias (~53% at kickoff in a 0-0 game)"],
          ]}
        />

        <SubHeading>WP Analytics (post-game)</SubHeading>
        <Table
          headers={["Stat", "What it means"]}
          rows={[
            ["Key Play", "The single drive with the biggest WP swing"],
            ["Biggest Lead", "The moment one team had the highest WP (furthest from 50%)"],
            ["Lead Changes", "How many times the WP line crossed 50%"],
            ["Biggest Swing", "Magnitude of the largest single-drive WP change"],
          ]}
        />
      </>
    ),
  },

  /* ---- 8. Game Summary & Sharing ---- */
  {
    id: "summary",
    icon: Share2,
    title: "Game Summary & Sharing",
    content: (
      <>
        <P>
          When a game ends, you&apos;re taken to the Game Summary. You can also revisit any completed game from History.
        </P>

        <SubHeading>What&apos;s in the summary</SubHeading>
        <ul className="space-y-1 text-sm pl-4 mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
          <li><strong>Final Score &amp; Headline</strong> &mdash; Large scoreboard with auto-generated headline (blowout, nailbiter, comeback, or default)</li>
          <li><strong>Score by Quarter</strong> &mdash; Points per quarter for both teams</li>
          <li><strong>Team Stats</strong> &mdash; Side-by-side comparison of drives, scoring drives, turnovers, and TDs</li>
          <li><strong>Box Score &amp; MVP</strong> &mdash; (Enhanced Mode) Full stat breakdown for every player; MVP is player with most points responsible for</li>
          <li><strong>Win Probability Chart</strong> &mdash; Full WP graph with analytics</li>
          <li><strong>Scoring Plays &amp; Drive Log</strong> &mdash; Complete game record</li>
        </ul>

        <SubHeading>Export options</SubHeading>
        <Table
          headers={["Option", "What you get"]}
          rows={[
            ["Share Game Card (WIP)", "This is still WIP! PNG image in 1200x630 (social) or 1080x1080 (Instagram). Download, copy to clipboard, or share via native share sheet."],
            ["Download Excel", "Full .xlsx spreadsheet with game info, scores, stats, and drive log"],
            ["Download PDF", "Opens browser print dialog for clean printing or saving as PDF"],
          ]}
        />
        <Tip>
          Game cards look great on Twitter/X and Discord. The social format (1200x630) includes team colors, final score,
          and key stats in a compact visual.
        </Tip>
      </>
    ),
  },

  /* ---- 9. Season Replay Mode ---- */
  {
    id: "seasons",
    icon: Calendar,
    title: "Season Replay Mode",
    content: (
      <>
        <P>
          Season Mode lets you replay an entire football season &mdash; regular season schedules, weekly games, instant
          result simulations, standings, playoff brackets, and a champion.
        </P>

        <SubHeading>Creating a season</SubHeading>
        <P>Go to Seasons &gt; New Season and fill out:</P>
        <Table
          headers={["Field", "Notes"]}
          rows={[
            ["Season Name", "e.g., \"1966 AFL Season\""],
            ["Year", "e.g., 1966"],
            ["League Type", "NFL, USFL, AFL, CFL, XFL, or Custom"],
            ["Regular Season Weeks", "1-30"],
            ["Playoff Teams", "2, 4, 6, 7 (NFL), 8, 12, or 14"],
            ["Bye Weeks", "Allow bye weeks in the schedule"],
            ["Home Field in Playoffs", "Higher seeds get home field"],
            ["Can End in Tie", "Regular season games can tie (recommended)"],
            ["Teams", "Select from your library (minimum 2)"],
            ["Divisions", "Optional — group teams for division records"],
          ]}
        />

        <SubHeading>Setting up the schedule</SubHeading>
        <P>
          <strong>Auto Generate</strong> &mdash; Creates a round-robin schedule. If divisions exist, games are weighted
          for more intra-division matchups.
        </P>
        <P><strong>Import CSV</strong> &mdash; Paste your schedule in CSV format:</P>
        <Code>{`Week,Away,Home
1,KC,LAC
1,BUF,MIA
1,GB,DET
2,LAC,KC
2,MIA,BUF`}</Code>
        <P>Use <InlineCode>BYE</InlineCode> for bye weeks. Teams are matched by abbreviation or full name.</P>

        <SubHeading>Playing the regular season</SubHeading>
        <P>
          Navigate weeks with arrows or the week selector. Each game can be:
        </P>
        <Table
          headers={["Action", "What happens"]}
          rows={[
            ["Play", "Opens pre-game modal, then scoresheet. Result auto-records to the season."],
            ["Simulate", "5-step instant result: team ratings \u2192 point diff \u2192 win roll \u2192 winner's score \u2192 loser's score"],
            ["Resume", "Continue an in-progress game"],
            ["Reset", "Clear a result and return the game to unplayed status"],
          ]}
        />
        <P>
          <strong>Simulate Week</strong> and <strong>Simulate Remaining</strong> buttons let you batch-simulate
          multiple games at once.
        </P>

        <SubHeading>Instant Result simulation (5 steps)</SubHeading>
        <StepList
          steps={[
            "Team Ratings — each team's qualities are converted to a numeric rating (offense + defense averaged)",
            "Point Differential — home team rating minus away team rating determines home advantage",
            "Win Roll — a 2d6 roll is compared against a win range based on the point differential",
            "Winner's Score — the winner's scoring quality determines which score table to use; a 2d6 roll selects the final score",
            "Loser's Score — a closeness roll determines margin: close (1-2), moderate (3-4), or blowout (5-6)",
          ]}
        />

        <SubHeading>Standings</SubHeading>
        <P>
          Toggle the Standings button to view current standings. If divisions exist, standings are grouped by division.
          Tiebreakers: win%, division record, point differential, total points scored.
        </P>

        <SubHeading>Playoffs</SubHeading>
        <P>
          When all regular season games are complete, a Seeding Preview appears. Click <strong>Enter Playoffs</strong> 
          to generate the bracket. Higher seeds face lower seeds, and top seeds may receive first-round byes.
        </P>
        <Table
          headers={["Teams", "Rounds"]}
          rows={[
            ["2", "Championship only"],
            ["3-4", "Conference + Championship"],
            ["5-8", "Wild Card + Conference + Championship"],
            ["9+", "Wild Card + Divisional + Conference + Championship"],
          ]}
        />
        <P>
          Winners automatically advance to the next round. Resetting a playoff result can <strong>cascade</strong> &mdash;
          if the winner had already advanced, downstream matchups are cleared too. The app warns you before confirming.
        </P>

        <SubHeading>Championship</SubHeading>
        <P>
          When the final game is complete, the season enters Completed status. The champion is displayed with a trophy,
          and the full bracket and final standings remain available.
        </P>
      </>
    ),
  },

  /* ---- 10. Season Statistics & Awards ---- */
  {
    id: "stats",
    icon: Award,
    title: "Season Statistics & Awards",
    content: (
      <>
        <InfoBox>
          Season stats are calculated from manually-played games only. Simulated games don&apos;t have drive data,
          so they can&apos;t contribute player statistics. The more games you play by hand in Enhanced Mode, the richer
          your stats will be.
        </InfoBox>

        <SubHeading>Season Leaderboards</SubHeading>
        <P>Five category tabs on the Stats page:</P>
        <Table
          headers={["Tab", "What it ranks"]}
          rows={[
            ["Points Responsible For", "Total points (TDs \u00d7 6 + FGs \u00d7 3 + XPs \u00d7 1)"],
            ["Rushing TDs", "Rushing touchdown count"],
            ["Passing TDs", "Passing touchdown count"],
            ["Receiving TDs", "Receiving touchdown count"],
            ["Field Goals", "Field goals made"],
          ]}
        />
        <P>
          Each tab shows the top 20 players. Click <strong>Show All</strong> to expand. Click any player to open a
          detail modal with season totals and a week-by-week game log.
        </P>

        <SubHeading>Team Stats</SubHeading>
        <P>
          Below the leaderboard, a team stats table shows average points for/against, turnover differential, and field
          position percentages for each team.
        </P>

        <SubHeading>Season Awards</SubHeading>
        <Table
          headers={["Award", "Criteria"]}
          rows={[
            ["MVP", "Highest points responsible for across all played games"],
            ["Offensive Player of the Year", "Highest combined passing + rushing + receiving TDs"],
            ["Clutch Player", "Highest TD-to-INT ratio (offensive efficiency)"],
            ["Turnover King (Team)", "Best team turnover differential"],
          ]}
        />

        <SubHeading>Players of the Week</SubHeading>
        <P>
          A week-by-week list of the top performer per week (by points responsible for). Only weeks with manually-played
          games are included.
        </P>

        <SubHeading>Season Recap</SubHeading>
        <P>
          A timeline of the season&apos;s most memorable moments: biggest WP swing, closest games, blowouts, comebacks,
          shutouts, highest-scoring games, and overtime thrillers. Filter by moment type with the pills at the top.
        </P>
      </>
    ),
  },

  /* ---- 11. Data Management ---- */
  {
    id: "data",
    icon: HardDrive,
    title: "Data Management",
    content: (
      <>
        <SubHeading>Exporting</SubHeading>
        <P>
          <strong>We highly suggest that you are doing this often because of updates and bug fixes.</strong>
          Click <strong>Export All Data</strong> on the Data page to download a complete JSON backup. The file includes
          all teams, games, seasons, and settings. Named <InlineCode>fdf-backup-YYYY-MM-DD.json</InlineCode>.
        </P>

        <SubHeading>Importing</SubHeading>
        <P>
          Click <strong>Choose Backup File</strong> and select a previously exported JSON file. A preview shows team,
          game, and season counts before you confirm.
        </P>
        <Warning>
          Importing replaces all current data. This cannot be undone. Always export a backup of your current data first.
        </Warning>

        <SubHeading>What&apos;s saved and where</SubHeading>
        <Table
          headers={["Key", "Contents"]}
          rows={[
            ["fdf_teams", "Team library"],
            ["fdf_games", "All games (active and completed)"],
            ["fdf_seasons", "All seasons"],
            ["fdf_settings", "App preferences"],
          ]}
        />

        <SubHeading>localStorage limits</SubHeading>
        <P>
          Most browsers allow 5-10 MB per domain. A typical team takes ~1-2 KB, a game ~5-20 KB, and a season ~10-50 KB.
          Hundreds of teams and dozens of seasons fit comfortably.
        </P>

        <SubHeading>Backup best practices</SubHeading>
        <ul className="space-y-1 text-sm pl-4 mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
          <li>Export a backup <strong>before</strong> importing new data</li>
          <li>Export <strong>periodically</strong> &mdash; especially after completing a season</li>
          <li>Export <strong>before clearing browser data</strong> or switching browsers</li>
          <li>Store backups somewhere safe (cloud drive, email to yourself)</li>
        </ul>
        <Warning>
          Clearing your browser data, using incognito mode, or switching browsers will lose your data.
          Always keep a recent backup.
        </Warning>
      </>
    ),
  },

  /* ---- 12. Tips & Best Practices ---- */
  {
    id: "tips",
    icon: Lightbulb,
    title: "Tips & Best Practices",
    content: (
      <>
        <SubHeading>Quick game workflow</SubHeading>
        <StepList
          steps={[
            "Create your two teams (or import them)",
            "Start a Quick Game with Enhanced Mode on",
            "Play through the game, logging each drive",
            "Review the Game Summary \u2014 check the WP chart, box score, and headline",
            "Share the game card or download the Excel report",
          ]}
        />

        <SubHeading>Full season workflow</SubHeading>
        <StepList
          steps={[
            "Import all your teams from a text file (much faster than creating one by one)",
            "Create a new season and select your teams",
            "Import your schedule via CSV, or auto-generate one",
            "Each week, decide which games to play manually and which to simulate",
            "Play the marquee matchups by hand (in Enhanced Mode) for the richest stats",
            "Simulate the rest with Instant Results \u2014 it\u2019s quick and uses team qualities for realistic outcomes",
            "Check standings after each week to track the playoff race",
            "When the regular season ends, enter playoffs and play through the bracket",
            "After the championship, explore Stats, Awards, and Recap",
          ]}
        />

        <SubHeading>Getting the most out of Enhanced Mode</SubHeading>
        <ul className="space-y-1 text-sm pl-4 mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
          <li><strong>Fill out rosters completely</strong> &mdash; the more players, the more specific the auto-summaries</li>
          <li><strong>Add finder ranges</strong> &mdash; they&apos;re displayed during player selection for easy dice-to-player matching</li>
          <li><strong>Use all four categories</strong> &mdash; a player can appear in multiple categories (e.g., an RB in Rushing TD and Receiving TD)</li>
        </ul>

        <SubHeading>Making Instant Results more accurate</SubHeading>
        <P>
          The simulation engine depends on team qualities. The more you fill in, the more differentiated the ratings:
        </P>
        <ul className="space-y-1 text-sm pl-4 mb-3" style={{ color: "var(--fdf-text-secondary)" }}>
          <li><strong>Scoring</strong> qualities (PROLIFIC/DULL, STAUNCH/INEPT) have the biggest impact (\u00b14 points each)</li>
          <li><strong>Clock Management</strong> (EFFICIENT/INEFFICIENT) is next most impactful (\u00b12 points)</li>
          <li>Semi qualities count for half value</li>
          <li>A team with no qualities defaults to a neutral rating (0)</li>
        </ul>

        <SubHeading>Managing multiple seasons</SubHeading>
        <P>
          Each season is independent. You can have multiple running simultaneously &mdash; a 1966 AFL season and a 2024
          NFL season, for example. They share the same team library, so changes to a team&apos;s qualities or roster
          affect all future games across all seasons.
        </P>

        <SubHeading>When to use the dice roller</SubHeading>
        <P>
          The in-app dice roller is a convenience &mdash; you don&apos;t have to use it. Many players prefer rolling
          physical dice (it&apos;s a tabletop game, after all!). The roller is most useful when you&apos;re playing on the
          go without dice, or when you want values recorded in the drive log.
        </P>
      </>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function GuidePage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["intro"]));
  const [tocVisible, setTocVisible] = useState(true);

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const scrollTo = (id: string) => {
    // Open the section first
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Scroll to it
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const expandAll = () => {
    setOpenSections(new Set(SECTIONS.map((s) => s.id)));
  };

  const collapseAll = () => {
    setOpenSections(new Set());
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(59,130,246,0.12)", color: "var(--fdf-accent)" }}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <h1
              className="text-xl font-bold font-fdf-mono tracking-wide"
              style={{ color: "var(--fdf-text-primary)" }}
            >
              User Guide
            </h1>
            <p className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
              FDF Companion App &mdash; Complete Reference
            </p>
          </div>
        </div>
        <P>
          Everything you need to know about the Fast Drive Football Digital Companion &mdash; from creating your first
        team to crowning a season champion.
        </P>
      </div>

      {/* Table of Contents (collapsible) */}
      <div className="mb-6">
        <button
          onClick={() => setTocVisible(!tocVisible)}
          className="flex items-center gap-2 text-xs font-bold font-fdf-mono uppercase tracking-wider mb-2"
          style={{ color: "var(--fdf-text-muted)" }}
        >
          {tocVisible ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Table of Contents
        </button>
        {tocVisible && (
          <TableOfContents
            sections={SECTIONS}
            activeId={[...openSections].pop() ?? null}
            onSelect={scrollTo}
          />
        )}
      </div>

      {/* Expand / Collapse controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={expandAll}
          className="text-xs px-3 py-1.5 rounded-md font-bold font-fdf-mono"
          style={{
            backgroundColor: "rgba(59,130,246,0.1)",
            color: "var(--fdf-accent)",
            border: "1px solid rgba(59,130,246,0.25)",
          }}
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="text-xs px-3 py-1.5 rounded-md font-bold font-fdf-mono"
          style={{
            backgroundColor: "var(--fdf-bg-card)",
            color: "var(--fdf-text-muted)",
            border: "1px solid var(--fdf-border)",
          }}
        >
          Collapse All
        </button>
      </div>

      {/* Sections */}
      <div
        className="rounded-lg divide-y"
        style={{
          backgroundColor: "var(--fdf-bg-card)",
          border: "1px solid var(--fdf-border)",
          borderColor: "var(--fdf-border)",
        }}
      >
        <style>{`
          .guide-divider > * + * {
            border-top: 1px solid var(--fdf-border);
          }
        `}</style>
        <div className="guide-divider">
          {SECTIONS.map((section, i) => (
            <div key={section.id} className="px-4">
              <CollapsibleSection
                section={section}
                index={i}
                isOpen={openSections.has(section.id)}
                onToggle={() => toggle(section.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 mb-4 text-center">
        <p className="text-xs" style={{ color: "var(--fdf-text-muted)" }}>
          FDF Companion App User Guide &mdash; February 2026
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--fdf-text-muted)" }}>
          The app is under active development. New features may be added over time.
        </p>
      </div>
    </div>
  );
}
