import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { FdfGame, FdfTeam, PlayerGameStats, DriveEntry } from "./types";
import { isScoringPlay, isReturnTD } from "./scoring";

// ── FDF Dark Theme Palette ──────────────────────────────────────
const BG_PRIMARY = "FF0A0E17";
const BG_CARD = "FF1A2332";
const BG_SCOREBOARD = "FF000000";
const BG_SECTION = "FF111827";
const TEXT_PRIMARY = "FFF1F5F9";
const TEXT_SECONDARY = "FF94A3B8";
const TEXT_MUTED = "FF64748B";
const TEXT_SCOREBOARD = "FFFBBF24";
const ACCENT = "FF3B82F6";
const BORDER_COLOR = "FF2A3A52";
const TD_GREEN = "FF22C55E";
const TURNOVER_RED = "FFEF4444";
const FG_AMBER = "FFF59E0B";

// Total columns used across the sheet (matches Drive Log = widest common table)
const TOTAL_COLS = 9;

// ── Reusable Style Factories ────────────────────────────────────
const thin: ExcelJS.Border = { style: "thin", color: { argb: BORDER_COLOR } };
const borders: Partial<ExcelJS.Borders> = { top: thin, bottom: thin, left: thin, right: thin };

function bodyFont(size = 10, color = TEXT_PRIMARY): Partial<ExcelJS.Font> {
  return { name: "Consolas", size, color: { argb: color } };
}

function fillBg(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

/** Fill empty cells in a row with dark background so there are no white gaps */
function fillRowBg(ws: ExcelJS.Worksheet, rowNum: number, bg: string) {
  const row = ws.getRow(rowNum);
  for (let c = 1; c <= TOTAL_COLS; c++) {
    const cell = row.getCell(c);
    if (!cell.fill || (cell.fill as ExcelJS.FillPattern).pattern === "none") {
      cell.fill = fillBg(bg);
    }
  }
}

/** Add a spacer row (thin dark gap between sections) */
function addSpacer(ws: ExcelJS.Worksheet): number {
  const row = ws.addRow([]);
  row.height = 6;
  fillRowBg(ws, row.number, BG_PRIMARY);
  return row.number;
}

/** Add a section title bar (merged across all columns, accent-styled) */
function addSectionTitle(ws: ExcelJS.Worksheet, title: string): number {
  addSpacer(ws);
  const row = ws.addRow([title]);
  row.height = 26;
  ws.mergeCells(row.number, 1, row.number, TOTAL_COLS);
  const cell = row.getCell(1);
  cell.font = { name: "Consolas", size: 11, bold: true, color: { argb: ACCENT } };
  cell.fill = fillBg(BG_SECTION);
  cell.alignment = { horizontal: "left", vertical: "middle" };
  cell.border = { bottom: { style: "medium", color: { argb: ACCENT } } };
  fillRowBg(ws, row.number, BG_SECTION);
  return row.number;
}

/** Style a table header row within the section */
function addTableHeader(ws: ExcelJS.Worksheet, headers: string[], startCol: number): ExcelJS.Row {
  const vals: string[] = new Array(TOTAL_COLS).fill("");
  headers.forEach((h, i) => { vals[startCol - 1 + i] = h; });
  const row = ws.addRow(vals);
  row.height = 22;
  for (let c = startCol; c < startCol + headers.length; c++) {
    const cell = row.getCell(c);
    cell.font = { name: "Consolas", size: 9, bold: true, color: { argb: BG_PRIMARY } };
    cell.fill = fillBg(ACCENT);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = borders;
  }
  fillRowBg(ws, row.number, BG_PRIMARY);
  return row;
}

/** Style a data row for a table within the section */
function addDataRow(
  ws: ExcelJS.Worksheet,
  values: (string | number)[],
  startCol: number,
  alt: boolean,
): ExcelJS.Row {
  const vals: (string | number)[] = new Array(TOTAL_COLS).fill("");
  values.forEach((v, i) => { vals[startCol - 1 + i] = v; });
  const row = ws.addRow(vals);
  const bg = alt ? BG_CARD : BG_PRIMARY;
  row.height = 20;
  row.font = bodyFont();
  for (let c = startCol; c < startCol + values.length; c++) {
    const cell = row.getCell(c);
    cell.fill = fillBg(bg);
    cell.border = borders;
    cell.alignment = { vertical: "middle" };
  }
  fillRowBg(ws, row.number, bg);
  return row;
}

// ── Helpers ─────────────────────────────────────────────────────
function getResultLabel(result: string): string {
  return result
    .replace(/_/g, " ")
    .replace(/\bFGA\b/, "FG")
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function patLabel(pat?: string): string {
  if (!pat) return "";
  if (pat === "XP_GOOD") return "XP Good";
  if (pat === "XP_MISSED") return "XP Missed";
  if (pat === "2PT_GOOD") return "2PT Good";
  if (pat === "2PT_FAILED") return "2PT Failed";
  return pat;
}

function resultColor(result: string): string {
  if (result.includes("TD") || result === "TD_RUN" || result === "TD_PASS") return TD_GREEN;
  if (result.includes("FG") || result === "DESPERATION_FGA") return FG_AMBER;
  if (result === "INTERCEPTION" || result === "FUMBLE" || result.includes("RETURN_TD")) return TURNOVER_RED;
  return TEXT_PRIMARY;
}

function teamColor(team: FdfTeam): string {
  return team.primaryColor.replace("#", "FF");
}

// ── Main Export ─────────────────────────────────────────────────
export async function exportGameToExcel(
  game: FdfGame,
  homeTeam: FdfTeam,
  awayTeam: FdfTeam,
  playerStats?: PlayerGameStats[],
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FDF Companion App";
  wb.created = new Date();

  const winner =
    game.score.home.total > game.score.away.total
      ? homeTeam.name
      : game.score.away.total > game.score.home.total
        ? awayTeam.name
        : "Tie";

  const hasOT = game.score.home.ot > 0 || game.score.away.ot > 0;

  // Stat calculations (used in multiple sections)
  const homeDrives = game.drives.filter((d) => d.teamId === homeTeam.id);
  const awayDrives = game.drives.filter((d) => d.teamId === awayTeam.id);
  const homeScoringDrives = homeDrives.filter((d) => isScoringPlay(d.result) && !isReturnTD(d.result)).length
    + awayDrives.filter((d) => isReturnTD(d.result)).length;
  const awayScoringDrives = awayDrives.filter((d) => isScoringPlay(d.result) && !isReturnTD(d.result)).length
    + homeDrives.filter((d) => isReturnTD(d.result)).length;
  const homeINT = homeDrives.filter((d) => d.result === "INTERCEPTION" || d.result === "INTERCEPTION_RETURN_TD").length;
  const awayINT = awayDrives.filter((d) => d.result === "INTERCEPTION" || d.result === "INTERCEPTION_RETURN_TD").length;
  const homeFum = homeDrives.filter((d) => d.result === "FUMBLE" || d.result === "FUMBLE_RETURN_TD").length;
  const awayFum = awayDrives.filter((d) => d.result === "FUMBLE" || d.result === "FUMBLE_RETURN_TD").length;
  const homePassTD = homeDrives.filter((d) => d.result === "TD_PASS").length;
  const awayPassTD = awayDrives.filter((d) => d.result === "TD_PASS").length;
  const homeRushTD = homeDrives.filter((d) => d.result === "TD_RUN").length;
  const awayRushTD = awayDrives.filter((d) => d.result === "TD_RUN").length;
  const homeFGMade = homeDrives.filter((d) => d.result === "FGA_GOOD" || d.result === "DESPERATION_FGA").length;
  const homeFGAtt = homeFGMade + homeDrives.filter((d) => d.result === "FGA_MISSED").length;
  const awayFGMade = awayDrives.filter((d) => d.result === "FGA_GOOD" || d.result === "DESPERATION_FGA").length;
  const awayFGAtt = awayFGMade + awayDrives.filter((d) => d.result === "FGA_MISSED").length;

  // ── Single Worksheet ──────────────────────────────────────────
  const ws = wb.addWorksheet("Game Report");
  ws.properties.tabColor = { argb: ACCENT };
  ws.views = [{ showGridLines: false }];

  // Column widths (optimized for Drive Log, the widest standard table)
  ws.columns = [
    { width: 6 },   // A: #
    { width: 9 },   // B: Quarter
    { width: 9 },   // C: Team
    { width: 12 },  // D: Field Pos / Stat label
    { width: 22 },  // E: Result
    { width: 12 },  // F: PAT
    { width: 36 },  // G: Summary
    { width: 13 },  // H: Score After
    { width: 13 },  // I: Dice
  ];

  // ═══════════════════════════════════════════════════════════════
  // TITLE BANNER
  // ═══════════════════════════════════════════════════════════════
  const titleRow = ws.addRow(["FDF GAME REPORT"]);
  ws.mergeCells(1, 1, 1, TOTAL_COLS);
  titleRow.height = 40;
  const tCell = titleRow.getCell(1);
  tCell.font = { name: "Consolas", size: 18, bold: true, color: { argb: TEXT_SCOREBOARD } };
  tCell.fill = fillBg(BG_SCOREBOARD);
  tCell.alignment = { horizontal: "center", vertical: "middle" };
  tCell.border = borders;

  // Score line
  const scoreRow = ws.addRow([`${awayTeam.abbreviation}  ${game.score.away.total}   —   ${homeTeam.abbreviation}  ${game.score.home.total}`]);
  ws.mergeCells(2, 1, 2, TOTAL_COLS);
  scoreRow.height = 32;
  const sCell = scoreRow.getCell(1);
  sCell.font = { name: "Consolas", size: 14, bold: true, color: { argb: TEXT_PRIMARY } };
  sCell.fill = fillBg(BG_CARD);
  sCell.alignment = { horizontal: "center", vertical: "middle" };
  sCell.border = borders;

  // Winner line
  const isTie = game.score.home.total === game.score.away.total;
  const winnerText = isTie ? "TIE GAME" : `${winner} wins`;
  const winRow = ws.addRow([winnerText]);
  ws.mergeCells(3, 1, 3, TOTAL_COLS);
  winRow.height = 22;
  const wCell = winRow.getCell(1);
  wCell.font = { name: "Consolas", size: 10, color: { argb: TEXT_MUTED } };
  wCell.fill = fillBg(BG_CARD);
  wCell.alignment = { horizontal: "center", vertical: "middle" };
  wCell.border = { bottom: { style: "medium", color: { argb: ACCENT } } };

  // ═══════════════════════════════════════════════════════════════
  // GAME INFO
  // ═══════════════════════════════════════════════════════════════
  addSectionTitle(ws, "GAME INFO");

  const infoData: [string, string | number][] = [
    ["Date", new Date(game.startedAt).toLocaleDateString()],
    ["Away Team", `${awayTeam.name} (${awayTeam.abbreviation})`],
    ["Home Team", `${homeTeam.name} (${homeTeam.abbreviation})`],
    ["Overtime", hasOT ? "Yes" : "No"],
    ["Enhanced Mode", game.enhancedMode ? "Yes" : "No"],
    ["Total Drives", game.drives.length],
  ];

  infoData.forEach(([label, value], i) => {
    const bg = i % 2 === 0 ? BG_PRIMARY : BG_CARD;
    const row = ws.addRow([]);
    row.height = 20;

    // Label in cols A-C (merged)
    ws.mergeCells(row.number, 1, row.number, 3);
    const lCell = row.getCell(1);
    lCell.value = label;
    lCell.font = bodyFont(10, ACCENT);
    lCell.fill = fillBg(bg);
    lCell.border = borders;
    lCell.alignment = { vertical: "middle" };

    // Value in cols D-I (merged)
    ws.mergeCells(row.number, 4, row.number, TOTAL_COLS);
    const vCell = row.getCell(4);
    vCell.value = value;
    vCell.font = bodyFont(10, TEXT_PRIMARY);
    vCell.fill = fillBg(bg);
    vCell.border = borders;
    vCell.alignment = { vertical: "middle" };
  });

  // ═══════════════════════════════════════════════════════════════
  // SCORE BY QUARTER
  // ═══════════════════════════════════════════════════════════════
  addSectionTitle(ws, "SCORE BY QUARTER");

  const qtrHeaders = ["Team", "Q1", "Q2", "Q3", "Q4"];
  if (hasOT) qtrHeaders.push("OT");
  qtrHeaders.push("Total");
  // Pad to fill remaining columns
  while (qtrHeaders.length < TOTAL_COLS) qtrHeaders.push("");

  const qtrHdr = addTableHeader(ws, qtrHeaders.slice(0, TOTAL_COLS), 1);
  // Merge unused trailing columns into last real header
  const qtrColCount = (hasOT ? 7 : 6);
  if (qtrColCount < TOTAL_COLS) {
    ws.mergeCells(qtrHdr.number, qtrColCount, qtrHdr.number, TOTAL_COLS);
  }

  // Away
  const awayQtrVals: (string | number)[] = [
    awayTeam.abbreviation,
    game.score.away.q1, game.score.away.q2, game.score.away.q3, game.score.away.q4,
  ];
  if (hasOT) awayQtrVals.push(game.score.away.ot);
  awayQtrVals.push(game.score.away.total);

  const awayQRow = addDataRow(ws, awayQtrVals, 1, false);
  awayQRow.getCell(1).font = { name: "Consolas", size: 10, bold: true, color: { argb: teamColor(awayTeam) } };
  for (let c = 2; c <= qtrColCount; c++) awayQRow.getCell(c).alignment = { horizontal: "center", vertical: "middle" };
  awayQRow.getCell(qtrColCount).font = { name: "Consolas", size: 11, bold: true, color: { argb: TEXT_SCOREBOARD } };
  if (qtrColCount < TOTAL_COLS) ws.mergeCells(awayQRow.number, qtrColCount, awayQRow.number, TOTAL_COLS);

  // Home
  const homeQtrVals: (string | number)[] = [
    homeTeam.abbreviation,
    game.score.home.q1, game.score.home.q2, game.score.home.q3, game.score.home.q4,
  ];
  if (hasOT) homeQtrVals.push(game.score.home.ot);
  homeQtrVals.push(game.score.home.total);

  const homeQRow = addDataRow(ws, homeQtrVals, 1, true);
  homeQRow.getCell(1).font = { name: "Consolas", size: 10, bold: true, color: { argb: teamColor(homeTeam) } };
  for (let c = 2; c <= qtrColCount; c++) homeQRow.getCell(c).alignment = { horizontal: "center", vertical: "middle" };
  homeQRow.getCell(qtrColCount).font = { name: "Consolas", size: 11, bold: true, color: { argb: TEXT_SCOREBOARD } };
  if (qtrColCount < TOTAL_COLS) ws.mergeCells(homeQRow.number, qtrColCount, homeQRow.number, TOTAL_COLS);

  // ═══════════════════════════════════════════════════════════════
  // TEAM STATS
  // ═══════════════════════════════════════════════════════════════
  addSectionTitle(ws, "TEAM STATS");

  // Header: Stat (A-D merged), Away (E-F merged), Home (G-H merged), I empty
  const tsHdrRow = ws.addRow([]);
  tsHdrRow.height = 22;
  const tsHdrFont: Partial<ExcelJS.Font> = { name: "Consolas", size: 9, bold: true, color: { argb: BG_PRIMARY } };

  ws.mergeCells(tsHdrRow.number, 1, tsHdrRow.number, 4);
  const tsH1 = tsHdrRow.getCell(1);
  tsH1.value = "Stat";
  tsH1.font = tsHdrFont;
  tsH1.fill = fillBg(ACCENT);
  tsH1.alignment = { horizontal: "left", vertical: "middle" };
  tsH1.border = borders;

  ws.mergeCells(tsHdrRow.number, 5, tsHdrRow.number, 6);
  const tsH2 = tsHdrRow.getCell(5);
  tsH2.value = awayTeam.abbreviation;
  tsH2.font = tsHdrFont;
  tsH2.fill = fillBg(ACCENT);
  tsH2.alignment = { horizontal: "center", vertical: "middle" };
  tsH2.border = borders;

  ws.mergeCells(tsHdrRow.number, 7, tsHdrRow.number, 8);
  const tsH3 = tsHdrRow.getCell(7);
  tsH3.value = homeTeam.abbreviation;
  tsH3.font = tsHdrFont;
  tsH3.fill = fillBg(ACCENT);
  tsH3.alignment = { horizontal: "center", vertical: "middle" };
  tsH3.border = borders;

  tsHdrRow.getCell(9).fill = fillBg(ACCENT);
  tsHdrRow.getCell(9).border = borders;

  const statsData: [string, string | number, string | number][] = [
    ["Total Drives", awayDrives.length, homeDrives.length],
    ["Scoring Drives", awayScoringDrives, homeScoringDrives],
    ["Turnovers", awayINT + awayFum, homeINT + homeFum],
    ["  Interceptions", awayINT, homeINT],
    ["  Fumbles Lost", awayFum, homeFum],
    ["Passing TD", awayPassTD, homePassTD],
    ["Rushing TD", awayRushTD, homeRushTD],
    ["Field Goals", `${awayFGMade}-${awayFGAtt}`, `${homeFGMade}-${homeFGAtt}`],
  ];

  statsData.forEach(([label, away, home], i) => {
    const bg = i % 2 === 0 ? BG_PRIMARY : BG_CARD;
    const row = ws.addRow([]);
    row.height = 20;
    const isIndented = label.startsWith("  ");

    ws.mergeCells(row.number, 1, row.number, 4);
    const lCell = row.getCell(1);
    lCell.value = label;
    lCell.font = bodyFont(10, isIndented ? TEXT_MUTED : TEXT_SECONDARY);
    lCell.fill = fillBg(bg);
    lCell.border = borders;
    lCell.alignment = { vertical: "middle" };

    ws.mergeCells(row.number, 5, row.number, 6);
    const aCell = row.getCell(5);
    aCell.value = away;
    aCell.font = bodyFont(10, TEXT_PRIMARY);
    aCell.fill = fillBg(bg);
    aCell.border = borders;
    aCell.alignment = { horizontal: "center", vertical: "middle" };

    ws.mergeCells(row.number, 7, row.number, 8);
    const hCell = row.getCell(7);
    hCell.value = home;
    hCell.font = bodyFont(10, TEXT_PRIMARY);
    hCell.fill = fillBg(bg);
    hCell.border = borders;
    hCell.alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(9).fill = fillBg(bg);
    row.getCell(9).border = borders;
  });

  // ═══════════════════════════════════════════════════════════════
  // PLAYER STATS (enhanced mode only)
  // ═══════════════════════════════════════════════════════════════
  if (playerStats && playerStats.length > 0) {
    addSectionTitle(ws, "PLAYER STATS");

    // 9 columns: Name | # | Team | Pass TD | INT | Rush TD | Rec TD | FG/XP | Points
    addTableHeader(ws, ["Name", "#", "Team", "PsTD", "INT", "RuTD", "RcTD", "FG/XP", "Points"], 1);

    playerStats.forEach((p, i) => {
      const team = p.teamId === homeTeam.id ? homeTeam : awayTeam;
      const fgXp = [
        p.kicking.fieldGoalsMade > 0 ? `${p.kicking.fieldGoalsMade}FG` : "",
        p.kicking.extraPointsMade > 0 ? `${p.kicking.extraPointsMade}XP` : "",
      ].filter(Boolean).join(" ") || "-";

      const row = addDataRow(ws, [
        p.playerName,
        p.playerNumber ?? "",
        team.abbreviation,
        p.passing.touchdowns,
        p.passing.interceptions,
        p.rushing.touchdowns,
        p.receiving.touchdowns,
        fgXp,
        p.pointsResponsibleFor,
      ], 1, i % 2 !== 0);

      row.getCell(1).font = { name: "Consolas", size: 10, bold: true, color: { argb: TEXT_PRIMARY } };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).font = { name: "Consolas", size: 10, bold: true, color: { argb: teamColor(team) } };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      for (let c = 4; c <= 9; c++) row.getCell(c).alignment = { horizontal: "center", vertical: "middle" };
      // Red for turnovers
      if (p.passing.interceptions > 0) row.getCell(5).font = bodyFont(10, TURNOVER_RED);
      // Points column gold
      row.getCell(9).font = { name: "Consolas", size: 10, bold: true, color: { argb: TEXT_SCOREBOARD } };
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SCORING PLAYS
  // ═══════════════════════════════════════════════════════════════
  const scoringPlays = game.drives.filter((d) => isScoringPlay(d.result));
  if (scoringPlays.length > 0) {
    addSectionTitle(ws, "SCORING PLAYS");

    // 6 cols: Quarter | Team | Result | PAT | Summary (merged E-H) | Score After
    const spHdrRow = ws.addRow([]);
    spHdrRow.height = 22;
    const spHdrFont: Partial<ExcelJS.Font> = { name: "Consolas", size: 9, bold: true, color: { argb: BG_PRIMARY } };
    const spHeaders = ["Qtr", "Team", "Result", "PAT"];
    spHeaders.forEach((h, idx) => {
      const cell = spHdrRow.getCell(idx + 1);
      cell.value = h;
      cell.font = spHdrFont;
      cell.fill = fillBg(ACCENT);
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = borders;
    });
    // Summary merged E-H
    ws.mergeCells(spHdrRow.number, 5, spHdrRow.number, 8);
    const spSumHdr = spHdrRow.getCell(5);
    spSumHdr.value = "Summary";
    spSumHdr.font = spHdrFont;
    spSumHdr.fill = fillBg(ACCENT);
    spSumHdr.alignment = { horizontal: "left", vertical: "middle" };
    spSumHdr.border = borders;
    // Score After
    const spScoreHdr = spHdrRow.getCell(9);
    spScoreHdr.value = "Score";
    spScoreHdr.font = spHdrFont;
    spScoreHdr.fill = fillBg(ACCENT);
    spScoreHdr.alignment = { horizontal: "center", vertical: "middle" };
    spScoreHdr.border = borders;

    scoringPlays.forEach((d, i) => {
      const scoringTeam = isReturnTD(d.result)
        ? (d.teamId === homeTeam.id ? awayTeam : homeTeam)
        : (d.teamId === homeTeam.id ? homeTeam : awayTeam);
      const bg = i % 2 === 0 ? BG_PRIMARY : BG_CARD;
      const row = ws.addRow([]);
      row.height = 20;

      const vals = [`Q${d.quarter}`, scoringTeam.abbreviation, getResultLabel(d.result), patLabel(d.patResult)];
      vals.forEach((v, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = v;
        cell.font = bodyFont();
        cell.fill = fillBg(bg);
        cell.border = borders;
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // Team color
      row.getCell(2).font = { name: "Consolas", size: 10, bold: true, color: { argb: teamColor(scoringTeam) } };
      // Result color
      row.getCell(3).font = bodyFont(10, resultColor(d.result));
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };

      // Summary merged E-H
      ws.mergeCells(row.number, 5, row.number, 8);
      const sumCell = row.getCell(5);
      sumCell.value = d.summary || "";
      sumCell.font = bodyFont(9, TEXT_SECONDARY);
      sumCell.fill = fillBg(bg);
      sumCell.border = borders;
      sumCell.alignment = { vertical: "middle", wrapText: true };

      // Score after
      const scCell = row.getCell(9);
      scCell.value = d.scoreAfterDrive;
      scCell.font = { name: "Consolas", size: 10, bold: true, color: { argb: TEXT_SCOREBOARD } };
      scCell.fill = fillBg(bg);
      scCell.border = borders;
      scCell.alignment = { horizontal: "center", vertical: "middle" };
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // DRIVE LOG
  // ═══════════════════════════════════════════════════════════════
  if (game.drives.length > 0) {
    addSectionTitle(ws, "DRIVE LOG");

    addTableHeader(ws, ["#", "Qtr", "Team", "FldPos", "Result", "PAT", "Summary", "Score", "Dice"], 1);

    game.drives.forEach((d: DriveEntry, i: number) => {
      const team = d.teamId === homeTeam.id ? homeTeam : awayTeam;
      const row = addDataRow(ws, [
        d.driveNumber,
        `Q${d.quarter}`,
        team.abbreviation,
        d.fieldPosition,
        getResultLabel(d.result),
        patLabel(d.patResult),
        d.summary || "",
        d.scoreAfterDrive,
        d.diceValues ? d.diceValues.join(", ") : "",
      ], 1, i % 2 !== 0);

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).font = { name: "Consolas", size: 10, bold: true, color: { argb: teamColor(team) } };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(5).font = bodyFont(10, resultColor(d.result));
      row.getCell(8).font = { name: "Consolas", size: 10, bold: true, color: { argb: TEXT_SCOREBOARD } };
      row.getCell(8).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(9).font = bodyFont(9, TEXT_MUTED);
      row.getCell(9).alignment = { horizontal: "center", vertical: "middle" };
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════
  addSpacer(ws);
  const footerRow = ws.addRow(["Generated by FDF Companion App"]);
  ws.mergeCells(footerRow.number, 1, footerRow.number, TOTAL_COLS);
  footerRow.height = 20;
  const fCell = footerRow.getCell(1);
  fCell.font = bodyFont(8, TEXT_MUTED);
  fCell.fill = fillBg(BG_PRIMARY);
  fCell.alignment = { horizontal: "center", vertical: "middle" };

  // ═══════════════════════════════════════════════════════════════
  // Download
  // ═══════════════════════════════════════════════════════════════
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const fileName = `FDF-${awayTeam.abbreviation}-vs-${homeTeam.abbreviation}-${game.id.slice(0, 8)}.xlsx`;
  saveAs(blob, fileName);
}
