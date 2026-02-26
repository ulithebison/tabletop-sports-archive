# FDF Companion App — Project Status Report

> **Date**: 2026-02-26
> **Plan document**: `docs/fdf_webapp/references/FDF_Companion_App_Projektplan_V3.md`
> **Codebase root**: `src/app/fdf/`, `src/components/fdf/`, `src/lib/fdf/`

---

## 1. Executive Summary

The FDF Companion App has been fully implemented through **Sprint 6** of the 7-sprint plan, plus significant bonus features not in the original spec. The app is integrated into the Tabletop Sports Games Archive as a Next.js sub-route (`/fdf/*`) rather than as a standalone Vite SPA.

### By the Numbers

| Metric | Value |
|---|---|
| Total lines of code | ~18,785 |
| Library/utility files | 24 files (~6,435 lines) |
| Components | 57 files (~9,711 lines) |
| Pages/routes | 18 files (~2,639 lines) |
| Zustand stores | 4 (teams, games, seasons, settings) |
| Drive result types | 28 |
| Summary templates | ~80+ (per result type, enhanced + simple) |
| npm dependencies added | 7 (zustand, recharts, html-to-image, exceljs, file-saver, @types/file-saver, lucide-react) |

### Sprint Completion

| Sprint | Plan Description | Status |
|---|---|---|
| Sprint 1 | Project Setup & Scoresheet | **Complete** |
| Sprint 2 | Enhanced Mode & Stats | **Complete** |
| Sprint 3 | Win Probability & Game Cards | **Complete** |
| Sprint 4 | Quick Game & Teams | **Complete** |
| Sprint 5 | Season Replay | **Complete** |
| Sprint 6 | Season Stats & Awards | **Complete** |
| Sprint 7 | Polish & Extras | **Partial** |

---

## 2. Sprint-by-Sprint Comparison

### Sprint 1: Project Setup & Scoresheet (Basis) — COMPLETE

| Plan Item | Status | Notes |
|---|---|---|
| Project scaffolding (Vite + React) | **Done (modified)** | Next.js 15 App Router instead of Vite + React Router (see §3) |
| Dark theme | **Done** | `[data-theme="fdf"]` with 21+ CSS custom properties (`--fdf-*`) |
| AppShell with sidebar navigation | **Done** | `FdfSidebar.tsx` (107 lines) — Dashboard, Teams, Quick Game, History, Seasons, Data |
| Game Clock Widget (12 ticks × 4Q) | **Done** | `GameClockWidget.tsx` (135 lines) — visual dot grid, quarter highlight |
| Scoresheet with Drive Log | **Done** | `Scoresheet.tsx` (341 lines) + `DriveLog.tsx` + `DriveRow.tsx` |
| Drive Entry Form | **Done** | `DriveEntryForm.tsx` (265 lines) — field position, result, time, PAT, players |
| Scoreboard with quarter scores | **Done** | `Scoreboard.tsx` (130 lines) — team colors, quarter-by-quarter, possession indicator |
| Timing Die Reference Widget | **Done** | `TimingDieReference.tsx` (41 lines) |
| PAT selection after TD | **Done** | `PATSelector.tsx` (101 lines) — XP/2PT with player selection |
| LocalStorage persistence | **Done** | 4 Zustand stores with `persist` middleware |
| Game History view | **Done** | `/fdf/history` + `/fdf/history/[id]` pages |
| Game Summary after completion | **Done** | `GameSummary.tsx` (453 lines) — scores, stats, drive log, WP chart, box score, headline |

**Additional Sprint 1 deliverables not in plan:**
- `DriveResultPicker.tsx` (215 lines) — categorized result picker with 5 categories
- `DriveTimeSelector.tsx` (50 lines) — visual die selector
- `FieldPositionSelector.tsx` (43 lines) — POOR/AVERAGE/GREAT with color coding
- `TimingWarning.tsx` (52 lines) — Q2/Q4 efficiency zone warnings

---

### Sprint 2: Enhanced Mode & Stats — COMPLETE

| Plan Item | Status | Notes |
|---|---|---|
| Roster data model & editor | **Done (evolved)** | Two roster systems: legacy `TeamRoster` (position-based) + newer `FinderRoster` (4-category). `RosterEditor.tsx` (332 lines) + `FinderRosterEditor.tsx` (547 lines) |
| PlayerSelector component | **Done** | `PlayerSelector.tsx` (116 lines) — supports both roster types, position-filtered dropdowns with finder ranges |
| summaryTemplates.ts | **Done** | `summary-templates.ts` (233 lines) — per-result templates with `{qb}`, `{receiver}`, `{rb}`, `{kicker}`, `{defender}`, `{returner}` variables. Separate simple templates for non-enhanced mode |
| summaryGenerator.ts | **Done** | `summary-generator.ts` (146 lines) — template selection, variable resolution from FinderRoster/TeamRoster |
| AutoSummaryPreview | **Done** | `AutoSummaryPreview.tsx` (128 lines) — live preview with shuffle button |
| Enhanced Mode toggle | **Done** | Toggle at game start (Quick Game page + PreGameModal for season games) |
| PlayerGameStats calculation | **Done** | `player-stats.ts` (243 lines) — aggregates per-player stats from drives |
| GameBoxScore component | **Done** | `GameBoxScore.tsx` (329 lines) — passing/rushing/receiving/kicking/defense per player |
| Game MVP calculation | **Done** | `getGameMVP()` in `player-stats.ts` — highest pointsResponsibleFor |

**Additional Sprint 2 deliverables not in plan:**
- `FinderRosterImport.tsx` (106 lines) — text import for FDF Enhanced format
- `team-file-parser.ts` (206 lines) — parses section-based roster text (RUSHING TD, PASSING TD, etc.)
- Auto-migration from legacy position roster to FinderRoster (`team-store.ts` v1→v2 migration)

---

### Sprint 3: Win Probability & Game Cards — COMPLETE

| Plan Item | Status | Notes |
|---|---|---|
| winProbability.ts — logistic WP model | **Done** | `win-probability.ts` (165 lines) — logistic function with k varying by game progress, possession bonus, home field advantage |
| WinProbabilityChart — Recharts LineChart | **Done** | `WinProbabilityChart.tsx` (263 lines) — collapsible in scoresheet, full in summary |
| WP in Game Summary | **Done** | Key play, biggest lead, lead changes, biggest swing — all computed by `computeWPAnalytics()` |
| ShareableGameCard | **Done** | `ShareableGameCard.tsx` (449 lines) — `React.forwardRef`, inline styles only, social (1200×630) + Instagram (1080×1080) |
| GameCardExport — image export | **Done** | `GameCardExport.tsx` (261 lines) — download PNG, copy to clipboard, Web Share API. Uses `html-to-image` |
| Headline generator | **Done** | `headline-generator.ts` (105 lines) — blowout/comeback/nailbiter/default categories with random template selection |
| "Share" button after game end | **Done** | Button in `GameSummary.tsx` after drive log section |

**Plan vs. implementation detail:**
- Plan called for SVG export → **Not implemented** (PNG only, plus clipboard copy)
- Plan called for mini WP chart on game card → **Implemented** as part of `ShareableGameCard.tsx`
- Plan called for QR code on game card → **Not implemented**

---

### Sprint 4: Quick Game & Teams — COMPLETE

| Plan Item | Status | Notes |
|---|---|---|
| Quick Game setup page | **Done** | `/fdf/quick-game` (233 lines) — team selection, enhanced mode toggle, coin toss |
| Team database with quality model | **Done** | `types.ts` — full `TeamQualities` with OFF/DEF/ST categories, semi toggle per quality |
| TeamCard component | **Done** | `TeamCard.tsx` (84 lines) — color swatch, name, abbreviation, edit/delete |
| Quality Editor with SEMI toggle | **Done** | `QualityEditor.tsx` (42 lines) + `QualityBadge.tsx` (26 lines) |
| Team CRUD | **Done** | `TeamForm.tsx` (421 lines) — full create/edit with all fields |
| CSV Import (teams + roster) | **Done (enhanced)** | `TeamImportModal.tsx` (417 lines) + `team-import.ts` (615 lines) — state-machine parser for text/JSON, multi-team import with `---` separator, validation preview |
| NFL base data (32 teams preloaded) | **Not done** | No pre-loaded NFL team data. Users must create or import teams manually |
| Team search/selection | **Done** | `TeamSelector.tsx` (43 lines) — dropdown with color swatches and exclude logic |
| Dashboard with recent games | **Done** | `/fdf` dashboard — active games list, recent completed games, quick action cards |

**Plan items not implemented:**
- "Rematch" button after game → **Not done**
- Cross-Era kicking adjustment → **Not done**

---

### Sprint 5: Season Replay — COMPLETE

| Plan Item | Status | Notes |
|---|---|---|
| Season creation with era config | **Done** | `SeasonForm.tsx` (349 lines) — name, year, league type, teams, divisions, OT rules, playoff format |
| Schedule import (CSV) | **Done** | `ScheduleImport.tsx` (247 lines) + `schedule-parser.ts` (137 lines) — CSV paste or auto-generate |
| Week view | **Done** | `WeekView.tsx` (78 lines) + `WeekNavigation.tsx` (63 lines) + `SeasonGameRow.tsx` (195 lines) |
| Instant Results calculation | **Done** | `instant-results.ts` (350 lines) — 5-step simulation per FDF PDF rules (team rating, point diff, win range table, winner/loser scores) |
| "Simulate Week/Season" | **Done** | Simulate individual games, entire weeks, or remaining season. `SimulationModal.tsx` (185 lines) — step-by-step reveal animation |
| Standings calculation | **Done** | `standings.ts` (178 lines) — W-L-T, PCT, PF/PA, division records, streaks, last 5. Tiebreakers: PCT → div record → point diff → PF |
| Playoff bracket | **Done** | `PlayoffBracket.tsx` (111 lines) + `PlayoffMatchup.tsx` (191 lines) + `playoff-seeding.ts` (261 lines) — CSS flex column layout, 2-14 team support with byes |
| Season dashboard | **Done** | `/fdf/seasons/[id]` (759 lines) — setup/regular_season/playoffs/completed phases with full UI for each |

**Additional Sprint 5 deliverables not in plan:**
- `schedule-generator.ts` (219 lines) — round-robin and division schedule auto-generation
- `DivisionEditor.tsx` (173 lines) — drag teams into divisions
- `PreGameModal.tsx` (171 lines) — enhanced mode toggle + coin toss before season games
- `SeedingPreview.tsx` (75 lines) — pre-playoff seed display with confirmation
- `SeasonComplete.tsx` (155 lines) — champion display with trophy
- `InstantResultCard.tsx` (59 lines) — compact simulated result display
- Cascade revert for playoff results
- Bulk simulation (simulate remaining regular season or entire week)

**Plan items not fully implemented:**
- Clinch/elimination tracking → **Not done** (plan mentioned `clinched?: "division" | "playoff" | "bye" | "eliminated"` on standings)
- Conference record in standings → **Partially done** (division record tracked, conference record display TBD)

---

### Sprint 6: Season Stats & Awards — COMPLETE

| Plan Item | Status | Notes |
|---|---|---|
| SeasonLeaderboard — sortable tables | **Done** | `SeasonLeaderboard.tsx` (279 lines) — 6 category tabs (All, Passing, Rushing, Receiving, Kicking, Defense), sortable columns, top 20 + show all |
| PlayerDetailView — game-by-game log | **Done** | `PlayerDetailView.tsx` (204 lines) — modal with season totals + per-game log table |
| TeamStatsOverview — team stats | **Done** | `TeamStatsOverview.tsx` (130 lines) — games played, PF/PA, point diff, field position %, turnover diff |
| SeasonAwardsView — MVP, OPOY, DPOY | **Done** | `SeasonAwardsView.tsx` (154 lines) — MVP, OPOY, DPOY, Clutch, Best Turnover Team + Player of the Week list |
| Player of the Week | **Done** | `calculatePlayersOfTheWeek()` in `season-stats.ts` — per-week best player by pointsResponsibleFor |
| Season Recap — top moments | **Done** | `SeasonRecap.tsx` (188 lines) — timeline with filter pills (WP swings, closest, blowouts, comebacks, shutouts, OT), moment cards with type icons |

**Pages created:**
- `/fdf/seasons/[id]/stats` — Leaderboard + team stats
- `/fdf/seasons/[id]/awards` — Awards display
- `/fdf/seasons/[id]/recap` — Season moments timeline

**Plan items with differences:**
- Plan listed statistical category awards (Passing TD Leader, Rushing TD Leader, etc.) → **Implemented differently** as 5 named awards (MVP, OPOY, DPOY, Clutch Player, Best Turnover Team) rather than per-stat leaders. The stat leaders are visible in the leaderboard itself.
- Plan mentioned `offensiveRookieOfYear` and `coach` awards → **Not implemented** (would require manual tagging)

---

### Sprint 7: Polish & Extras — PARTIAL

| Plan Item | Status | Notes |
|---|---|---|
| 2-Point Conversion Guide (Vermeil table) | **Not done** | |
| Cross-Era Kicking Adjustments calculator | **Not done** | |
| Timing Rules Quick Reference Panel | **Not done** | `TimingWarning.tsx` covers partial functionality (efficiency zone warnings) |
| Data export (JSON/CSV) | **Partially done** | JSON export/import for all stores via `/fdf/data` page. Excel (.xlsx) export per game via `excel-export.ts`. No CSV export for season results or stats |
| Responsive design (tablet-friendly) | **Done** | Mobile hamburger menu, responsive layouts throughout |
| PWA support (offline use) | **Not done** | |
| Keyboard shortcuts | **Not done** | |

---

## 3. Tech Stack Deviations

The plan specified a standalone Vite SPA. The actual implementation integrates into the existing Next.js archive.

| Component | Plan | Actual | Rationale |
|---|---|---|---|
| **Framework** | React 18 + Vite | Next.js 15 App Router | Integration into existing archive site |
| **Routing** | React Router v6 | Next.js file-based routing | Comes with Next.js |
| **Build tool** | Vite | Next.js (Webpack/Turbopack) | Comes with Next.js |
| **CSS** | Tailwind CSS | Tailwind CSS + CSS custom properties (`--fdf-*`) | As planned, with FDF theme isolation via `data-theme` |
| **State** | Zustand + localStorage | Zustand + localStorage (persist middleware) | As planned |
| **CSV parser** | PapaParse | Custom state-machine parser (`team-import.ts`, `schedule-parser.ts`) | No external dependency needed |
| **Excel** | SheetJS/xlsx | ExcelJS | Used for game report export with dark-themed formatting |
| **Charts** | Recharts | Recharts | As planned |
| **Image export** | html-to-image or html2canvas | html-to-image | As planned |
| **Icons** | Lucide React | Lucide React | As planned |
| **Testing** | Vitest + React Testing Library | None (`npm run build` is verification) | Matches main archive approach |
| **Font** | Inter + JetBrains Mono | JetBrains Mono (FDF-specific) + parent site fonts | FDF uses `font-fdf-mono` class throughout |
| **Deployment** | Vercel (sub-path `/fdf/`) | Vercel (Next.js route `/fdf/*`) | Cleaner integration — no separate SPA build |

### Structural Differences

The plan proposed these directory structures:
- `src/hooks/` for custom hooks → **Not used** (logic lives in stores and utility functions)
- `src/data/` for static data → **Merged into** `src/lib/fdf/constants.ts` and `summary-templates.ts`
- `src/types/index.ts` → **Located at** `src/lib/fdf/types.ts`
- `src/stores/` at top level → **Located at** `src/lib/fdf/stores/`
- `src/components/reference/` → **Not implemented** (reference tools not built yet)
- `src/components/quickgame/` → **Merged into** page-level code (`/fdf/quick-game/page.tsx`)

All FDF code lives under the `fdf/` namespace (`src/app/fdf/`, `src/components/fdf/`, `src/lib/fdf/`) for clean separation from the main archive.

---

## 4. Features Beyond Plan

These features were implemented but **not specified** in the V3 plan:

### NFL Overtime Rules (Full Implementation)
- `OvertimePhase`, `OvertimeState` types with guaranteed-possession and sudden-death phases
- `OTCoinToss.tsx` (178 lines) — coin toss modal with random/manual flip, receiver selection, "can end in tie" toggle
- `TICKS_PER_OT_PERIOD = 8` (10 min / 75s per tick)
- `game-store.ts` — `initOvertime()`, `evaluateOTAfterDrive()`, multi-period support for playoffs
- Safety on 1st OT possession → instant win
- Undo support recomputes OT state via `recomputeOvertimeState()`
- OT phase indicator in scoresheet sidebar

### Dice Roller
- `DiceRoller.tsx` (126 lines) — 3 clickable dice with "Roll All" button
- Visual die faces, values attached to drive entries
- `DriveEntry.diceValues?` field for recording

### Event Log Sidebar
- `EventLog.tsx` (119 lines) — right sidebar scrollable event cards
- Color-coded borders (green for TD, red for turnover, amber for FG, etc.)

### Team Quality Cards During Games
- `TeamQualityCard.tsx` (160 lines) — OFF/DEF/ST badges with quality indicators
- FG/XP ranges and scoring tendency displayed
- Shown flanking the scoreboard during active games

### FinderRoster System
- Plan only described position-based `TeamRoster`
- Implementation adds a 4-category `FinderRoster` (rushingTD, passingTD, receivingTD, kickingFGXP) matching actual FDF Enhanced Team Card layout
- Automatic migration from legacy roster (v1→v2 in team store)
- `FinderRosterEditor.tsx` (547 lines) — full category-based editor
- `FinderRosterImport.tsx` (106 lines) — text-based import

### Excel Game Export
- `excel-export.ts` (571 lines) — ExcelJS-based `.xlsx` game report
- Dark-themed formatting matching FDF color palette
- Sections: title, score line, game info, quarter scores, team stats, player stats, scoring plays, full drive log

### Data Management Page
- `/fdf/data` (300 lines) — JSON export/import for all stores
- Validation before import, confirmation for destructive operations
- Backup/restore entire app state

### Season Enhancements
- `PreGameModal.tsx` — enhanced mode toggle + coin toss before each season game
- Schedule auto-generation (round-robin + division-based)
- `DivisionEditor.tsx` — visual division assignment
- Cascade revert for playoff results (resetting a round cascades to later rounds)
- Bulk simulation (simulate remaining games or entire week)
- `SeedingPreview.tsx` — seed preview with confirmation before starting playoffs

---

## 5. Open Items

### Sprint 7 — Not Yet Implemented

| Item | Priority | Complexity |
|---|---|---|
| 2-Point Conversion Guide (Vermeil table) | Medium | Low — static reference data |
| Cross-Era Kicking Adjustments calculator | Medium | Low — lookup table + simple math |
| Timing Rules Quick Reference Panel | Low | Low — collapsible panel with rule summaries |
| PWA support (offline use) | Low | Medium — service worker + manifest |
| Keyboard shortcuts | Low | Low — event listeners for common actions |

### Data Model Gaps

| Plan Feature | Status |
|---|---|
| `WeatherCondition` on games | Type exists, not wired to UI |
| `DriveOverride` / `specialResults` on teams | Not implemented |
| `DriveSpecialRule` array on drives | Type defined, not tracked during gameplay |
| `isNeutralSite`, `isPlayoff`, `playoffRound` on games | Not exposed in UI |
| `conferenceRecord` on standings | Not computed (division record is) |
| `clinched` status on standings | Not implemented |
| `headCoach`, `record`, `notes` on teams | Fields exist in types, not all surfaced in UI |

### Export Formats

| Format | Status |
|---|---|
| JSON (full app backup) | **Done** — `/fdf/data` page |
| Excel (.xlsx) per game | **Done** — `excel-export.ts` |
| PNG game cards | **Done** — `GameCardExport.tsx` |
| SVG game cards | **Not done** |
| Season results CSV | **Not done** |
| Season stats CSV | **Not done** |
| Individual game CSV | **Not done** |

### Planned Routes Not Implemented

| Plan Route | Status | Notes |
|---|---|---|
| `/seasons/:id/simulate` | **Merged** | Simulation is inline on season dashboard and week pages |
| `/seasons/:id/stats/:playerId` | **Merged** | Player detail is a modal (`PlayerDetailView.tsx`), not a separate page |
| `/seasons/:id/game/:gameId/card` | **Merged** | Game card export is part of `GameSummary.tsx` |
| `/history/:gameId/card` | **Merged** | Game card export is part of `GameSummary.tsx` |
| `/settings` | **Not done** | Settings store exists but no dedicated settings page (enhanced mode set per game) |
| `/teams/:id/roster` | **Merged** | Roster editing is a tab within `TeamForm.tsx` |
| `/teams/import` | **Merged** | Import is a modal (`TeamImportModal.tsx`) on the teams page |

### Section 14 (Future Features) Status

All items from the "Nice-to-Have" list remain unimplemented:
- AI commentary (Claude API game recaps)
- Multi-season franchise tracking
- Draft/Free Agency
- Head-to-head rivalry tracker
- Historical stat comparison
- Custom leagues/tournament formats
- Print scoresheet PDF
- Team Card generator from PFR data
- College football support
- Alternative league support (USFL/XFL/AAF/WFL)
- Betting lines from team ratings
- Sound effects
- Community sharing features

---

## 6. File Inventory Summary

### Pages (`src/app/fdf/`) — 18 files

```
/fdf                         → Dashboard (247 lines)
/fdf/teams                   → Team list (90 lines)
/fdf/teams/new               → Create team (17 lines)
/fdf/teams/[id]              → Edit team (45 lines)
/fdf/quick-game              → Quick game setup (233 lines)
/fdf/game/[id]               → Active game / completed summary (102 lines)
/fdf/history                 → Game history (95 lines)
/fdf/history/[id]            → Game detail (45 lines)
/fdf/data                    → Data management (300 lines)
/fdf/seasons                 → Season list (72 lines)
/fdf/seasons/new             → Create season (17 lines)
/fdf/seasons/[id]            → Season dashboard (759 lines)
/fdf/seasons/[id]/week/[week]→ Week detail (279 lines)
/fdf/seasons/[id]/playoffs   → Playoff bracket (303 lines)
/fdf/seasons/[id]/stats      → Season stats (106 lines)
/fdf/seasons/[id]/awards     → Season awards (94 lines)
/fdf/seasons/[id]/recap      → Season recap (72 lines)
layout.tsx                   → FDF layout (42 lines)
```

### Components (`src/components/fdf/`) — 57 files

- **Scoresheet**: 23 components (~4,107 lines)
- **Teams**: 11 components (~2,371 lines)
- **Seasons**: 20 components (~3,126 lines)
- **Shared**: 2 components (53 lines)
- **Layout**: 1 component (107 lines)

### Library (`src/lib/fdf/`) — 24 files

- **Types**: `types.ts` (550 lines)
- **Constants**: `constants.ts` (129 lines)
- **Core engine**: 8 files (~1,460 lines) — game-clock, scoring, player-mapping, player-stats, win-probability, headline-generator, summary-templates, summary-generator
- **Team import**: 2 files (~821 lines) — team-file-parser, team-import
- **Season engine**: 5 files (~1,145 lines) — instant-results, standings, playoff-seeding, schedule-parser, schedule-generator
- **Season stats**: 1 file (630 lines) — season-stats
- **Export**: 1 file (571 lines) — excel-export
- **Stores**: 4 files (~1,126 lines) — game-store, team-store, season-store, settings-store
- **Utility**: 1 file (3 lines) — id
