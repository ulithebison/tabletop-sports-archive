# FDF Companion App — User Guide

A complete guide to the Fast Drive Football Digital Companion, the browser-based scorekeeper, stat tracker, and season replay tool for the FDF tabletop football game.

---

## Table of Contents

1. [What Is the FDF Companion App?](#1-what-is-the-fdf-companion-app)
2. [Getting Started](#2-getting-started)
3. [Managing Teams](#3-managing-teams)
4. [Playing a Quick Game](#4-playing-a-quick-game)
5. [The Digital Scoresheet](#5-the-digital-scoresheet)
6. [Overtime](#6-overtime)
7. [Win Probability Chart](#7-win-probability-chart)
8. [Game Summary & Sharing](#8-game-summary--sharing)
9. [Season Replay Mode](#9-season-replay-mode)
10. [Season Statistics & Awards](#10-season-statistics--awards)
11. [Data Management](#11-data-management)
12. [Tips & Best Practices](#12-tips--best-practices)

---

## 1. What Is the FDF Companion App?

The FDF Companion App is a free, browser-based digital companion for **Fast Drive Football** (FDF), the tabletop football game. It runs entirely in your browser — no account, no downloads, no internet connection required after the initial page load.

### What it does

- **Tracks scores and game clock** so you never lose count of ticks or quarters
- **Records every drive** with field position, result, time, and an auto-generated play-by-play summary
- **Tracks player stats** in Enhanced Mode — passing TDs, rushing TDs, receiving TDs, field goals, turnovers, and more
- **Calculates win probability** in real time, so you can see momentum shifts as the game unfolds
- **Generates game cards** you can download as PNG images and share on social media
- **Exports game reports** as Excel spreadsheets or printable PDFs
- **Replays entire seasons** — create leagues, generate schedules, simulate games with instant results, track standings, seed playoffs, and crown a champion
- **Computes season stats and awards** — leaderboards, MVP, Offensive/Defensive Player of the Year, Players of the Week, and a season recap timeline

### What it doesn't do

The app is a **companion**, not a replacement for the physical game. You still roll your own dice, consult the FDF charts and tables, and make all the decisions. The app records what happened — it doesn't play the game for you. (The one exception is the Instant Result simulator for season mode, which uses the FDF rules to generate plausible final scores.)

### Where your data lives

Everything is stored in your browser's **localStorage**. There is no server, no cloud sync, and no login. Your teams, games, and seasons persist across browser sessions on the same device. You can export a full JSON backup at any time (see [Data Management](#11-data-management)).

---

## 2. Getting Started

### Accessing the app

Navigate to the FDF section of the site. The app lives under the `/fdf` path — look for "FDF Companion" in the site navigation, or go directly to `/fdf`.

### The Dashboard

The dashboard is your home base. It shows:

- **Quick Game** — Start a new game between two teams
- **Teams** — Manage your team library (with a badge showing how many teams you have)
- **History** — Browse completed games (with a count badge)

Below the quick-action cards you'll see:

- **Active Games** — Any games currently in progress. Click a game to resume it, or double-click the delete button to remove it.
- **Recent Games** — Your last 5 completed games with final scores and drive counts. Click any game to review the full summary.

### Sidebar Navigation

A persistent sidebar (slide-out on mobile, always visible on desktop) gives you quick access to every section:

| Icon | Label | Where it goes |
|------|-------|---------------|
| Dashboard | Dashboard | `/fdf` |
| Zap | Quick Game | `/fdf/quick-game` |
| Users | Teams | `/fdf/teams` |
| Trophy | Seasons | `/fdf/seasons` |
| History | History | `/fdf/history` |
| Hard Drive | Data | `/fdf/data` |

### First things first

Before you can play a game, you need at least **two teams**. Head to **Teams** and create or import your first teams (see [Managing Teams](#3-managing-teams)).

---

## 3. Managing Teams

### Creating a team

Go to **Teams > New Team**. The form has several sections:

#### Basic Info

| Field | Required | Notes |
|-------|----------|-------|
| Team Name | Yes | e.g., "Green Bay Packers" |
| Abbreviation | Yes | Up to 4 characters, auto-uppercased (e.g., "GB") |
| Season Year | No | Defaults to 2024 |
| League | No | NFL, AFL, USFL, XFL, AAF, WFL, or Custom |
| Conference | No | e.g., "NFC" |
| Division | No | e.g., "North" |
| Record | No | e.g., "12-5" |
| Head Coach | No | e.g., "Matt LaFleur" |

Only the **name** and **abbreviation** are required. Everything else is optional metadata that appears on team cards and quality displays during games.

#### Team Qualities

This is where you enter the team's FDF quality ratings. Each quality has a dropdown with options that mirror the FDF team cards:

**Offense qualities:**
- Scoring: PROLIFIC / PROLIFIC* / — / DULL* / DULL
- Yards: DYNAMIC / DYNAMIC* / — / ERRATIC* / ERRATIC
- Protection: SOLID / SOLID* / — / POROUS* / POROUS
- Ball Security: RELIABLE / RELIABLE* / — / SHAKY* / SHAKY
- Fumbles: SECURE / SECURE* / — / CLUMSY* / CLUMSY
- Discipline: DISCIPLINED / DISCIPLINED* / — / UNDISCIPLINED* / UNDISCIPLINED
- Clock Management: Super EFFICIENT / EFFICIENT / EFFICIENT* / — / INEFFICIENT* / INEFFICIENT / Super INEFFICIENT
- Scoring Tendency: P+ / P / — / R / R+

**Defense qualities:**
- Scoring: STAUNCH / STAUNCH* / — / INEPT* / INEPT
- Yards: STIFF / STIFF* / — / SOFT* / SOFT
- Pass Rush: PUNISHING / PUNISHING* / — / MILD* / MILD
- Coverage: AGGRESSIVE / AGGRESSIVE* / — / MEEK* / MEEK
- Fumble Recovery: ACTIVE / ACTIVE* / — / PASSIVE* / PASSIVE
- Discipline: DISCIPLINED / DISCIPLINED* / — / UNDISCIPLINED* / UNDISCIPLINED

**Special Teams:**
- Kick Return: ELECTRIC / ELECTRIC* / —
- Punt Return: ELECTRIC / ELECTRIC* / —
- FG Range (e.g., "11-62")
- XP Range (e.g., "11-63")

The `*` indicates a "semi" quality — a half-strength version used in the FDF rules. A dash (`—`) means no quality in that category.

**Tip:** These qualities are displayed on Team Quality Cards during the game and are used by the Instant Result simulator in Season Mode. Enter them accurately for best results.

#### Appearance

- **Primary Color** — Hex color picker (e.g., `#203731` for Packers green). Used for team badges and scoreboard.
- **Secondary Color** — Hex color picker (e.g., `#FFB612` for Packers gold).
- **Logo URL** — Optional. Not widely displayed but stored for future use.
- **Notes** — Free-text field for anything you want to remember about this team.

#### Finder Roster (Player Roster)

The roster is organized into four categories that match how the FDF Player Finder works:

| Category | What it tracks |
|----------|---------------|
| Rushing TD | Ball carriers who score rushing touchdowns |
| Passing TD | Quarterbacks who throw touchdown passes |
| Receiving TD | Receivers who catch touchdown passes |
| FG & XP | Kickers who attempt field goals and extra points |

Each category is a collapsible section. To add a player:

1. Expand the category
2. Click **Add Player**
3. Enter the player's name (e.g., "Josh Jacobs")
4. Enter the finder range (e.g., "11-40")
5. Press Enter or click the green + button

Players can appear in multiple categories — a running back might be in both Rushing TD and Receiving TD.

**Quick Import per category:** Click the upload icon on any category header to paste players in bulk. The format is one player per line:

```
D. Henry, 11-40
Tony Pollard, 41-55
Tyjae Spears, 56-63
```

**Full file import:** Click the **Import Team File** button at the top of the roster section to import from a structured text file (see below).

### Importing teams from text

For bulk team creation, use the **Import** button on the Teams list page. You can paste text directly or upload a `.txt` file.

**Format:**

```
NAME: Green Bay Packers
ABR: GB
SEASON: 2024
LEAGUE: NFL
CONFERENCE: NFC
DIVISION: North
RECORD: 12-5
HEAD COACH: Matt LaFleur
COLOR: #203731
COLOR2: #FFB612
FG: 11-62
XP: 11-63

OFFENSE
Scoring: PROLIFIC
Yards: DYNAMIC*
Protection: SOLID
Tendency: P

DEFENSE
Scoring: STAUNCH*
Yards: STIFF

SPECIAL TEAMS
KR: ELECTRIC*

RUSHING TD
Josh Jacobs, 11-40
Emanuel Wilson, 41-55

PASSING TD
Jordan Love, 11-66

RECEIVING TD
Jayden Reed, 11-33
Romeo Doubs, 34-55

FG & XP
Brayden Narveson, 11-62
```

**Key rules:**
- Only **NAME** and **ABR** are required — everything else is optional
- Use `*` after a quality name to indicate "semi" (e.g., `DYNAMIC*`)
- Use `—` (em dash) or leave blank for "no quality"
- Separate multiple teams in the same file with `---` on its own line
- Roster players use the format: `Name, Range` (one per line under the category header)

Click **Parse & Preview** to see a preview of all detected teams before importing. The preview shows color swatches, quality counts, player counts, and warns you about duplicate abbreviations.

### Editing and deleting teams

Click any team on the Teams list to open the edit form. All fields are editable. The **Delete** button is at the bottom of the form — it shows a confirmation dialog before removing the team.

---

## 4. Playing a Quick Game

### Setting up

Go to **Quick Game** from the dashboard or sidebar.

1. **Select the away team** from the dropdown
2. **Select the home team** from the dropdown (must be different from away)
3. **Toggle Enhanced Mode** (optional) — enables per-drive player tracking, auto-generated play-by-play summaries with player names, and post-game box scores with MVP. If either team is missing a roster, you'll see a warning.
4. **Coin toss** — Click the "Coin Toss" button for a random result, or manually select which team receives using the radio buttons
5. Click **Start Game**

The app creates a new game and takes you to the live scoresheet.

**Tip:** Enhanced Mode is worth the small extra effort of selecting players per drive. The auto-summaries, box scores, and season stat tracking all depend on it.

### Standard vs. Enhanced Mode

| Feature | Standard Mode | Enhanced Mode |
|---------|--------------|---------------|
| Score tracking | Yes | Yes |
| Drive log | Yes | Yes |
| Game clock | Yes | Yes |
| Auto-summaries | Team names only | Player names included |
| Player selection per drive | No | Yes |
| Box score | No | Yes |
| MVP calculation | No | Yes |
| Season player stats | No | Yes |
| Win Probability | Yes | Yes |

---

## 5. The Digital Scoresheet

The scoresheet is the heart of the app — your digital game board for tracking every drive.

### Layout

The scoresheet has three main areas:

- **Top bar:** Scoreboard with team abbreviations, scores by quarter, and total scores. The possessing team is highlighted.
- **Main area:** Drive entry form on the left, with Team Quality Cards flanking the scoreboard when qualities are available.
- **Right sidebar:** Game phase indicator, game clock widget, dice roller, timing die reference, and action buttons. Below that, the event log scrolls with every recorded drive.

### Entering a drive

Each drive follows a consistent flow. The form shows only the fields relevant to the current result:

#### Step 1: Field Position

Select the starting field position for the drive:
- **POOR** (red) — Deep in own territory
- **AVERAGE** (amber) — Around midfield
- **GREAT** (green) — In opponent's territory

#### Step 2: Drive Time (Ticks)

Enter the number of ticks consumed by the drive. This comes from your timing die roll using the FDF timing chart:

| Timing Die | Ticks |
|-----------|-------|
| 1 | 1 |
| 2 | 2 |
| 3 | 2 |
| 4 | 2 |
| 5 | 3 |
| 6 | 4 |

The timing die reference is always visible in the sidebar for quick lookup. Each quarter has 12 ticks (representing 15 minutes of game time at 75 seconds per tick).

#### Step 3: Drive Result

Select what happened on the drive. Results are grouped by category:

**Scoring plays:**
- Rushing TD (6 pts)
- Passing TD (6 pts)
- Field Goal — Good (3 pts)
- Field Goal — Missed (0 pts)
- Safety (2 pts to the defense)

**Turnovers:**
- Interception
- Fumble
- Turnover on Downs

**Return touchdowns** (6 pts — scored by the defense):
- Kickoff Return TD
- Punt Return TD
- Fumble Return TD
- Interception Return TD
- Blocked FG Return TD
- Blocked Punt TD
- Free Kick Return TD

**Kick/Punt outcomes:**
- Punt, Punt (Backed Up), Punt (Coffin Corner)
- Kick/Punt — Receiving Team Recovers
- Kick/Punt — Kicking Team Recovers
- Kick/Punt — Kicking Team TD

**Special situations:**
- Kneel Down
- Desperation Play
- Desperation TD / FG
- Unusual Result
- End of Half / End of Game

#### Step 4: PAT (after touchdowns)

When a touchdown is scored, the PAT selector appears:
- **XP Good** (+1 point)
- **XP Missed** (+0)
- **2PT Good** (+2 points)
- **2PT Failed** (+0)

In Enhanced Mode with rosters, you also select the PAT players — the kicker for extra points, or the QB and receiver for two-point conversions.

#### Step 5: Player Selection (Enhanced Mode only)

After selecting the drive result, player fields appear based on context:
- **Passing TD:** Select the QB and the receiver
- **Rushing TD:** Select the ball carrier (and optionally the QB)
- **Field Goal:** Select the kicker
- **Interception:** Optionally select the QB who threw it and the defender who picked it off
- **Return TDs:** Select the returner

Players are grouped by their Finder Roster category. Their finder ranges are displayed next to their names for easy reference.

#### Step 6: Summary

The app auto-generates a play-by-play summary for each drive. For example:

> *"Jordan Love finds Jayden Reed for the touchdown!"*

or in Standard Mode:

> *"Packers hit the passing play for a touchdown!"*

You can:
- **Accept** the generated summary as-is
- **Edit** it with your own text
- **Shuffle** to get a different randomly-selected template

#### Step 7: Log the Drive

Click **Log Drive** to record the drive. The score updates, the clock advances, possession toggles (with special rules — see below), and the drive appears in the event log.

### Possession rules

After most drives, possession automatically switches to the other team. Special cases:

- **Defense scoring TD** (return TDs) — Possession does **not** change. The defending team scored, and the original offense still has the ball on the ensuing kickoff.
- **Kick/Punt — Receiving Team Recovers** — Possession does **not** change (the receiving team keeps the ball).
- **After halftime** — Home team automatically receives to start the second half.

You can always manually toggle possession with the **Switch** button next to the possession indicator.

### Timing warnings

In the **2nd and 4th quarters** (and overtime), when 4 or fewer ticks remain, a red timing warning appears. This is your reminder to check clock management qualities per the FDF rules.

### The Dice Roller

The sidebar includes three clickable dice — black, white, and red — matching the standard FDF dice set. Click individual dice to roll them, or click **Roll All** to roll all three at once with a quick animation. Dice values are attached to the current drive for your records.

### The Event Log

The right sidebar displays a scrolling event log of every drive, newest first. Each entry shows:
- Quarter badge and team abbreviation
- Drive result with color-coded left border (green for TDs, red for turnovers, blue for field goals, orange for missed FGs, purple for safeties)
- Score after the drive
- Summary text (if available)
- Dice values (if recorded)

### Undo

Made a mistake? Click the **Undo** button in the drive entry form header to remove the last recorded drive. This reverses the score, restores clock ticks, and reverts possession. In overtime, the entire OT state is recomputed from scratch to handle complex multi-possession scenarios correctly.

### End Half / End Game

You don't have to play out every tick. Use the action buttons in the sidebar:

- **End 1st Half** — Ends Q2 immediately and advances to Q3 (no drive entry needed)
- **End Game** — Ends the game immediately at the current score
- **End OT Period** — Ends the current overtime period (used when the clock runs out)
- **Finish Game Early** — Available if you need to end the game before the clock expires

### Live Stats toggle

During an active game, click the **Live Stats** button in the sidebar to see a real-time box score and team stats without leaving the scoresheet. Click **Hide Stats** to collapse it.

---

## 6. Overtime

### When does overtime happen?

When the score is tied at the end of the 4th quarter, the game enters a "waiting for coin toss" state. The scoresheet detects this automatically — the clock shows Q4 with 0 ticks remaining, and the OT Coin Toss component appears.

### The coin toss

1. Click **Flip** for a random result, or manually select which team receives
2. If the game is not part of a season, toggle **Can end in tie** (checked = regular season rules where a tie is possible; unchecked = playoff rules where play continues until there's a winner)
3. Click **Start Overtime**

### How overtime works (NFL rules)

Overtime follows **guaranteed possession** rules:

**Phase 1 — Guaranteed Possession:**
- The receiving team gets the ball first
- After the first team's possession ends (any result: score, turnover, punt, etc.), the second team gets the ball
- After both teams have had at least one possession, if the score is different, the game is over
- If the score is still tied, the game moves to sudden death

**Exception:** A **safety on the first possession** ends the game immediately — the defensive team wins.

**Phase 2 — Sudden Death:**
- Any scoring play that changes the score differential ends the game instantly
- If the clock runs out:
  - **Regular season:** The game ends in a tie
  - **Playoffs:** A new OT period begins. The receiving team alternates each period. Play continues until someone wins.

### OT clock

Each overtime period has **8 ticks** (representing 10 minutes of game time). The game clock widget shows an "OT" row with 8 dots, just like the quarter rows.

### OT phase indicator

The sidebar displays the current OT phase — "Guaranteed Possession" or "Sudden Death" — so you always know which rules apply to the current drive.

---

## 7. Win Probability Chart

### What is it?

The Win Probability (WP) chart tracks each team's estimated chance of winning after every drive. It's a line graph that runs from 0% (away team certain to win) to 100% (home team certain to win), with 50% being a tossup.

### How to read it

- The **x-axis** is the drive number (left to right through the game)
- The **y-axis** is the home team's win probability (0% to 100%)
- A **flat line near 50%** means the game is competitive
- **Sharp spikes** indicate momentum-changing plays — touchdowns, turnovers, and late-game scores
- The line converges toward 0% or 100% as the game progresses, because each remaining tick matters more

### How it's calculated

The WP model uses a logistic function that considers:
- **Score differential** — The bigger the lead, the higher the WP
- **Time remaining** — Late-game leads are worth more than early-game leads
- **Possession** — The team with the ball gets a small bonus (+1.5 points of expected value)
- **Home field advantage** — A small built-in bias toward the home team (~53% at kickoff in a 0-0 game)

The curve steepness increases as the game progresses. In Q1, a 7-point lead barely moves the needle; in Q4 with 2 ticks left, it's nearly decisive.

### WP Analytics

After the game, the WP chart includes summary stats:
- **Key Play** — The single drive with the biggest WP swing (e.g., "Drive 14: +32% WP shift")
- **Biggest Lead** — The moment one team had the highest WP (furthest from 50%)
- **Lead Changes** — How many times the WP line crossed 50%
- **Biggest Swing** — The magnitude of the largest single-drive WP change

### Where to see it

- **During the game:** Collapsible in the scoresheet sidebar (click to expand)
- **After the game:** Prominently displayed in the Game Summary

---

## 8. Game Summary & Sharing

When a game ends — either by clock expiration, manual end, or overtime — you're taken to the Game Summary page. You can also revisit any completed game from **History**.

### What's in the summary

#### Final Score & Headline

A large scoreboard shows the final score with team colors. Above it, an auto-generated headline captures the game's narrative:

- **Blowout** (margin 17+): *"KC dominates LAC, 38-10"*
- **Nailbiter** (margin 3 or less with lead changes): *"GB edges DET, 24-23"*
- **Comeback** (loser had 80%+ WP at some point): *"BUF stuns KC, 27-24"*
- **Default**: *"SF defeats SEA, 21-14"*
- **Tie**: *"PIT and BAL battle to a 17-17 tie"*

#### Score by Quarter

A table showing points scored in each quarter (and OT if applicable) for both teams, plus totals.

#### Team Stats

Side-by-side comparison of total drives, scoring drives, turnovers, interceptions, fumbles, passing TDs, rushing TDs, and field goals.

#### Box Score (Enhanced Mode)

A full statistical breakdown for every player who recorded a stat. Columns include passing TDs, interceptions, rushing TDs, receiving TDs, field goals, extra points, and total points responsible for.

#### MVP (Enhanced Mode)

The player with the most "points responsible for" is highlighted as the game's MVP. Points responsible for = (TDs * 6) + (FGs * 3) + (XPs * 1).

#### Scoring Plays

A filtered list showing only the drives that put points on the board, with quarter, team, result, PAT, summary, and running score.

#### Win Probability Chart & Analytics

The full WP chart with key play, biggest lead, lead changes, and biggest swing stats (see [Win Probability Chart](#7-win-probability-chart)).

#### Drive Log

The complete drive-by-drive record of the game. Each entry shows drive number, quarter, possessing team, field position, ticks consumed, result, PAT, summary, dice values, and score after drive.

### Sharing and exporting

Below the drive log, you'll find several export options:

#### Game Card (PNG)

Click **Share Game Card** to generate a visual game card image. Two formats are available:

- **1200x630** — Social media format (Twitter/X, Facebook, Discord)
- **1080x1080** — Square format (Instagram)

The card shows team colors, final score, key stats, and the WP chart in a compact visual. Export options:

- **Download PNG** — Saves the image to your device
- **Copy** — Copies the image to your clipboard for pasting
- **Share** — Opens your device's native share sheet (on supported devices/browsers)

#### Excel Export

Click **Download Excel** to generate a detailed `.xlsx` spreadsheet. The file includes:

- Game info (date, teams, mode, drives)
- Score by quarter
- Team stats comparison
- Player stats table (Enhanced Mode)
- Scoring plays
- Complete drive log with all fields

The file is named `FDF-[AWAY]-vs-[HOME]-[ID].xlsx` (e.g., `FDF-KC-vs-LAC-a1b2c3d4.xlsx`).

#### Print / PDF

Click **Download PDF** to open your browser's print dialog. The game summary is formatted for clean printing — export buttons and navigation are automatically hidden. Use your browser's "Save as PDF" option for a digital copy.

---

## 9. Season Replay Mode

Season Mode lets you replay an entire football season — regular season schedules, weekly games, instant result simulations, standings, playoff brackets, and a champion.

### Creating a season

Go to **Seasons > New Season**. Fill out the form:

#### Basic Info
- **Season Name** — e.g., "1966 AFL Season"
- **Year** — e.g., 1966
- **League Type** — NFL, USFL, AFL, CFL, XFL, or Custom (button group)

#### Configuration
- **Regular Season Weeks** — How many weeks in the schedule (1-30)
- **Playoff Teams** — How many teams make the playoffs (2, 4, 6, 7, 8, 12, or 14)
- **Bye Weeks** — Check to allow bye weeks in the schedule
- **Home Field in Playoffs** — Check to give higher seeds home field advantage

#### Overtime Rules
- **Can End in Tie** — Check for regular season rules (games can tie). Unchecked means playoff rules (no ties). All seasons use guaranteed possession overtime.

#### Team Selection
Pick which teams from your library participate. Use **All** or **None** for quick selection, then toggle individual teams. You need at least 2 teams.

#### Divisions (Optional)
Add divisions to organize your league (e.g., "NFC North," "AFC East"). Teams assigned to divisions get division records tracked in standings.

Click **Create Season** to build the season. It starts in **Setup** status.

### Setting up the schedule

Before the season begins, you need a schedule. The Schedule Import tool offers two options:

#### Auto Generate

Click the **Auto Generate** tab and then **Generate Schedule**. The app creates a round-robin (or near-round-robin) schedule that fills your configured number of weeks. If you have divisions, games are weighted to include more intra-division matchups.

#### Import CSV

Click the **Import CSV** tab and paste your schedule in CSV format:

```
Week,Away,Home
1,KC,LAC
1,BUF,MIA
1,GB,DET
2,LAC,KC
2,MIA,BUF
2,DET,GB
```

Rules:
- Teams are matched by abbreviation or full name
- Use `BYE` for bye weeks (e.g., `1,KC,BYE`)
- Click **Parse & Preview** to see the schedule before applying
- Errors and warnings are shown in colored alert boxes

After previewing, click **Apply Schedule** to lock it in. You'll see a summary: "X games across Y weeks."

Click **Start Season** to begin the regular season.

### Playing the regular season

Once the season starts, you're in the **Regular Season** phase. The season dashboard shows:

#### Week Navigation

Use the left/right arrows or the week selector to jump between weeks. Each week shows all scheduled games with their status:

- **Unplayed** — Ready to play or simulate
- **In Progress** — A game you started but haven't finished
- **Completed** — Final score shown
- **BYE** — Team has a bye week

#### Playing a game

Click **Play** on any unplayed game. A pre-game modal appears where you choose Enhanced Mode and the receiving team, just like Quick Game. The game opens in the scoresheet with the season context — when you finish, the result is automatically recorded back to the season schedule.

#### Simulating a game (Instant Results)

Click **Simulate** on any unplayed game to generate an instant result using the FDF rules. A modal walks you through the 5-step simulation:

**Step 1 — Team Ratings:** Each team's qualities are converted to a numeric rating. Offense and defense qualities contribute points (e.g., PROLIFIC scoring = +4, DULL = -4, semi qualities are half value). The final rating is the average of offense and defense, rounded.

**Step 2 — Point Differential:** The home team's rating minus the away team's rating gives the point differential, which determines the home team's advantage.

**Step 3 — Win Roll:** A 2d6 roll (11-66 range) is compared against a win range based on the point differential. If the roll is within range, the home team wins. If the roll exactly equals the range boundary, overtime is triggered.

**Step 4 — Winner's Score:** The winner's scoring quality determines which score table to use. A 2d6 roll selects the final score from the table (ranging from ~3 to ~45 points depending on quality).

**Step 5 — Loser's Score:** A closeness roll determines how close the game is: close (1-2), moderate (3-4), or blowout (5-6). The loser's score is derived from the winner's score minus a random margin.

Click **Accept Result** to record the final score.

#### Simulate Week / Simulate Remaining

- **Simulate Week** — Simulates all unplayed games in the current week at once
- **Simulate Remaining** — Simulates all remaining regular season games (with a confirmation prompt)

Both options use the same 5-step engine for each game.

#### Resetting a game result

Click **Reset** on any completed game to clear its result. This returns the game to "unplayed" status. In the regular season, this is straightforward. In playoffs, resetting cascades — if a game's winner had already advanced, the downstream matchup is also cleared (see Playoffs below).

### Standings

Toggle the **Standings** button on the season dashboard to view current standings. If you have divisions, standings are grouped by division.

Columns: Rank, Team, Wins, Losses, Ties, Win%, Points For, Points Against, Point Diff, Streak, Last 5.

**Tiebreaker order:**
1. Win percentage (ties count as half a win)
2. Division record (if divisions exist)
3. Point differential
4. Total points scored

### Entering the playoffs

When all regular season games are complete, a **Seeding Preview** section appears showing the playoff seeds based on standings. Division winners (if applicable) are seeded first, followed by wild card teams.

Click **Enter Playoffs** to generate the playoff bracket.

#### Bracket structure

The bracket scales based on your playoff team count:

| Teams | Rounds |
|-------|--------|
| 2 | Championship only |
| 3-4 | Conference Championship + Championship |
| 5-8 | Wild Card + Conference + Championship |
| 9+ | Wild Card + Divisional + Conference + Championship |

**Byes:** If the number of playoff teams isn't a power of 2, the top seeds receive first-round byes. For example, with 6 teams, seeds #1-2 get byes and seeds #3-6 play in the Wild Card round.

**Matchups:** Higher seeds face lower seeds (#1 vs #6, #2 vs #5, #3 vs #4). If home field is enabled, higher seeds are the home team.

#### Playing/simulating playoff games

Playoff games work exactly like regular season games — click **Play** to open the scoresheet or **Simulate** for an instant result. Winners automatically advance to the next round.

**Resetting playoff games:** Because winners feed into the next round, resetting a playoff result can cascade. If the Packers beat the Lions in the Wild Card, and the Packers are already slotted into the Conference round, resetting the Wild Card game clears the Conference matchup too. The app warns you about cascading effects before you confirm.

#### The Championship

When the final game is complete, the season enters **Completed** status. The champion is displayed with a trophy, and the full bracket and final standings are shown.

### Season navigation

The season dashboard action bar includes links to:
- **Standings** — Toggle the standings table
- **Stats** — Season player statistics ([see below](#10-season-statistics--awards))
- **Awards** — MVP, OPOY, DPOY, and more
- **Recap** — Season moments timeline

These links appear during the regular season and playoffs, and remain available after the season is completed.

---

## 10. Season Statistics & Awards

Season stats are calculated from **manually-played games only** — simulated games don't have drive data, so they can't contribute player statistics. The more games you play by hand (especially in Enhanced Mode), the richer your stats will be.

### Season Leaderboards

Go to **Seasons > [Your Season] > Stats**. The leaderboard has five category tabs:

| Tab | What it ranks |
|-----|---------------|
| Points Responsible For | Total points a player contributed (TDs * 6 + FGs * 3 + XPs * 1) |
| Rushing TDs | Rushing touchdown count |
| Passing TDs | Passing touchdown count |
| Receiving TDs | Receiving touchdown count |
| Field Goals | Field goals made |

Each tab shows the top 20 players with their name, team, and stat value. Click **Show All** to see the full list.

### Player Detail Modal

Click any player row to open a detailed modal showing:

- **Season totals** — All stat categories for the season
- **Game log** — Week-by-week breakdown with opponent, result, score, and individual stats for that game

### Team Stats Overview

Below the leaderboard, a team stats table shows aggregate numbers for each team:

- Games played (manual vs. simulated breakdown)
- Average points for/against
- Turnover differential
- Field position percentages (what % of drives started in POOR/AVERAGE/GREAT position)

### Season Awards

Go to **Seasons > [Your Season] > Awards**. Five awards are calculated:

| Award | Criteria |
|-------|---------|
| **MVP** | Highest points responsible for across all played games |
| **Offensive Player of the Year** | Highest combined passing + rushing + receiving TDs |
| **Defensive Player of the Year** | Highest combined interceptions + fumble recoveries + sacks |
| **Clutch Player** | Highest TD-to-INT ratio (offensive efficiency) |
| **Turnover King** (Team Award) | Best team turnover differential (forced minus committed) |

Each award card shows the winner's name, team, and key stat line.

### Players of the Week

Below the major awards, a week-by-week list shows the top performer for each week (by points responsible for). Only weeks with at least one manually-played game have a Player of the Week.

### Season Recap

Go to **Seasons > [Your Season] > Recap**. This is a timeline of the season's most memorable moments, drawn from played games:

- **Biggest WP Swing** — The single drive with the largest win probability shift
- **Closest Games** — Games decided by the narrowest margins
- **Blowouts** — The most lopsided results
- **Comebacks** — Games where the eventual winner was trailing badly
- **Shutouts** — Games where one team scored zero
- **Highest-Scoring Games** — The most points combined
- **Overtime Thrillers** — Games that went to OT

Each moment card shows the teams, score, week, and a headline describing what made it notable. You can filter by moment type using the filter pills at the top.

---

## 11. Data Management

Go to **Data** from the sidebar to manage your app data.

### Current Data Summary

Three stat boxes show how many teams, games, and seasons you currently have stored.

### Exporting

Click **Export All Data** to download a complete JSON backup file. The file includes:

- All teams (with qualities, rosters, colors, metadata)
- All games (with drives, scores, clock state, player involvement)
- All seasons (with schedules, results, standings)
- App settings

The file is named `fdf-backup-YYYY-MM-DD.json` and can be saved anywhere on your device.

### Importing

Click **Choose Backup File** and select a previously exported JSON file. The app shows a preview with:

- Number of teams, games, and seasons in the backup
- Whether settings are included

**Warning:** Importing **replaces all current data**. This cannot be undone. Make sure to export a backup of your current data first if you want to keep it.

Click **Replace All Data** to import. A success message confirms the operation.

### What's saved and where

All data is stored in your browser's **localStorage** under four keys:

| Key | Contents |
|-----|----------|
| `fdf_teams` | Team library |
| `fdf_games` | All games (active and completed) |
| `fdf_seasons` | All seasons |
| `fdf_settings` | App preferences (Enhanced Mode default) |

### localStorage limits and best practices

Most browsers allow **5-10 MB** of localStorage per domain. A typical team takes ~1-2 KB, a game takes ~5-20 KB (depending on drive count and Enhanced Mode), and a season takes ~10-50 KB.

**Practical limits:**
- Hundreds of teams: no problem
- Dozens of full seasons: no problem
- Thousands of completed games: you might approach the limit over time

**Backup recommendations:**
- Export a backup **before** importing new data
- Export a backup **periodically** — especially after completing a season you care about
- Export a backup **before clearing browser data** or switching browsers
- Store backups somewhere safe (cloud drive, email to yourself, etc.)

**Important:** Clearing your browser data, using private/incognito mode, or switching to a different browser will lose your data. Always keep a recent backup.

---

## 12. Tips & Best Practices

### Workflow for a quick game

1. Create your two teams (or import them)
2. Start a Quick Game with Enhanced Mode on
3. Play through the game, logging each drive
4. Review the Game Summary — check the WP chart, box score, and headline
5. Share the game card on social media or download the Excel report

### Workflow for a full season

1. Import all your teams from a text file (much faster than creating one by one)
2. Create a new season and select your teams
3. Import your schedule via CSV, or auto-generate one
4. Each week, decide which games to play manually and which to simulate
5. Play the marquee matchups by hand (in Enhanced Mode) for the richest stats
6. Simulate the rest with Instant Results — it's quick and uses team qualities for realistic outcomes
7. Check standings after each week to track the playoff race
8. When the regular season ends, enter playoffs and play/simulate through the bracket
9. After the championship, explore Stats, Awards, and Recap for the full season story

### Getting the most out of Enhanced Mode

- **Fill out rosters completely** — The more players you add, the more specific the auto-summaries become
- **Add finder ranges** — They're displayed during player selection, making it easy to match your dice roll to the right player
- **Use all four categories** — A player can appear in multiple categories (e.g., an RB in both Rushing TD and Receiving TD)

### Making Instant Results more accurate

The simulation engine depends entirely on **team qualities**. The more qualities you fill in, the more differentiated the ratings will be:

- A team with all qualities filled out will have a nuanced rating
- A team with no qualities defaults to a neutral rating (0)
- The biggest impact comes from **Scoring** qualities (PROLIFIC/DULL for offense, STAUNCH/INEPT for defense) — they're worth +/- 4 points each
- **Clock Management** (EFFICIENT/INEFFICIENT) is the next most impactful at +/- 2 points
- Semi qualities count for half value

### Managing multiple seasons

Each season is independent. You can have multiple seasons running simultaneously — a 1966 AFL season and a 2024 NFL season, for example. They share the same team library, so changes to a team's qualities or roster affect all future games across all seasons.

### When to use the dice roller

The in-app dice roller is a convenience tool — you don't have to use it. Many players prefer rolling physical dice (it's a tabletop game, after all!). The roller is most useful when:

- You're playing on the go and don't have dice handy
- You want dice values recorded in the drive log for review later
- You want a quick reference for the sum without mental math

---

*This guide covers the FDF Companion App as of February 2026. The app is under active development — new features may be added over time. For the latest, visit the site and explore!*
