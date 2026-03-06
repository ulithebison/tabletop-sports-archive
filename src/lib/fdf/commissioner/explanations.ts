// ============================================================
// Commissioner Explanations — Tooltip texts for all terms
// ============================================================

export const EXPLANATIONS: Record<string, string> = {
  // Settings
  xpFrom2YardLine:
    "In the modern NFL era (post-2015), extra points are attempted from the 15-yard line, making them harder. This option simulates older eras when XPs were kicked from the 2-yard line — with lower difficulty thresholds.",

  // Ownership & FO
  ownershipCompetence:
    "Owner competence affects team management. SAVVY owners provide bonuses to Front Office grade. MEDDLING owners interfere and can hurt grade outcomes.",
  ownershipLoyalty:
    "Owner loyalty affects coaching stability. LOYAL owners are patient with coaches. SELFISH owners are quick to fire and create hot seats.",
  frontOfficeGrade:
    "Front Office Grade (A–F) represents the quality of the team's front office. Combined with HC Grade, it determines Franchise Points. Higher grades = better draft and development outcomes.",
  headCoachGrade:
    "Head Coach Grade (A–F) represents coaching quality. Affects Franchise Points (FO × HC matrix) and can change based on season performance.",
  hotSeat:
    "A coach on the Hot Seat is at risk of being fired during the Coaching Carousel. Created by losing seasons with SELFISH owners.",

  // Franchise Points
  franchisePoints:
    "Franchise Points (FP) are the currency for team development. Higher FP = better opportunities to improve qualities. FP are calculated from Front Office Grade × Head Coach Grade. In the Off-Season, FP can be spent on re-rolls and upgrades.",
  fpMatrix:
    "The FP Matrix shows how Front Office and Head Coach grades combine. A/A = 12 FP (best), F/F = 0 FP (worst). Each grade pairing maps to a specific FP value.",

  // Card Draws & Distributions
  cdv:
    "Card Draw Value (CDV) determines how many teams receive a specific quality. With CDV=1, 1 team gets the positive variant (e.g. PROLIFIC) and 1 team the negative (e.g. DULL). The rest stay neutral. CDV scales with league size.",
  qv:
    "Quality Value (QV) determines the distribution of Clock Management. QV teams get SUPER-EFFICIENT, 2×QV get EFFICIENT, etc. QV is based on league size.",
  pairedCardDraw:
    "Paired qualities use a card draw shuffle — teams are randomly assigned positive, negative, or neutral. Pairs never have SEMI variants (only full or nothing).",

  // SEMI
  semi:
    "A SEMI quality (marked with a bullet •) is situational: before each drive, roll 1d6. Odd (1,3,5) = quality is active. Even (2,4,6) = inactive for that drive.",

  // Offense Scoring
  prolific:
    "PROLIFIC Offense: above-average scoring ability. Scoring cards and drive results are more favorable — more touchdowns, fewer punts.",
  dull:
    "DULL Offense: below-average scoring. Scoring cards produce more punts and field goal attempts instead of touchdowns.",

  // Offense Profile
  dynamic:
    "DYNAMIC Yards: the offense generates big plays and chunks of yardage. Positive impact on drive outcomes.",
  erratic:
    "ERRATIC Yards: the offense is inconsistent — some big plays, but also more negative plays and stalls.",
  solid:
    "SOLID Protection: the offensive line protects well. Fewer sacks and pressures, better QB performance.",
  porous:
    "POROUS Protection: the offensive line is weak. More sacks, pressures, and disrupted plays.",

  // Offense Quality Pairs
  reliable:
    "RELIABLE Ball Security: fewer turnovers on offense. The team protects the ball well.",
  shaky:
    "SHAKY Ball Security: turnover-prone offense. More fumbles and interceptions.",
  secure:
    "SECURE Fumbles: specifically resistant to fumbles. Ball carriers hold on tight.",
  clumsy:
    "CLUMSY Fumbles: fumble-prone. Running backs and receivers struggle to hold the ball.",
  disciplinedOff:
    "DISCIPLINED Offense: fewer penalties. Clean play execution without holding or false starts.",
  undisciplinedOff:
    "UNDISCIPLINED Offense: penalty-prone. Frequent holding calls, false starts, and illegal formations.",

  // Clock Management
  efficient:
    "EFFICIENT Clock Management: the team manages the game clock well. Better at controlling pace and running out the clock.",
  superEfficient:
    "SUPER-EFFICIENT Clock Management: elite clock management. The team is among the best at situational football.",
  inefficient:
    "INEFFICIENT Clock Management: poor clock management. Wastes timeouts, mismanages the clock in critical situations.",
  superInefficient:
    "SUPER-INEFFICIENT Clock Management: terrible clock management. The team consistently hurts itself with poor decisions.",

  // Defense Scoring
  staunch:
    "STAUNCH Defense: above-average defensive unit. Opposing drives end more often in punts and turnovers.",
  inept:
    "INEPT Defense: below-average defense. Opponents score touchdowns more easily.",

  // Defense Profile
  stiff:
    "STIFF Yards: the defense limits yardage. Opponents struggle to gain ground.",
  soft:
    "SOFT Yards: the defense gives up yards easily. Opponents move the ball consistently.",
  punishing:
    "PUNISHING Pass Rush: the defensive line generates pressure. More sacks and disrupted passes.",
  mild:
    "MILD Pass Rush: weak pass rush. The QB has time to throw, leading to more completions.",

  // Defense Quality Pairs
  aggressive:
    "AGGRESSIVE Coverage: the secondary plays tight, man-to-man. More interceptions but also more big plays allowed.",
  meek:
    "MEEK Coverage: the secondary plays soft. Opponents complete passes easily but fewer big plays.",
  active:
    "ACTIVE Fumble Recovery: the defense is aggressive at stripping the ball and recovering fumbles.",
  passive:
    "PASSIVE Fumble Recovery: the defense rarely forces or recovers fumbles.",
  disciplinedDef:
    "DISCIPLINED Defense: fewer penalties. Clean tackles, no unnecessary roughness or pass interference.",
  undisciplinedDef:
    "UNDISCIPLINED Defense: penalty-prone defense. Pass interference, roughing the passer, personal fouls.",

  // Special Teams
  electric:
    "ELECTRIC Returns: the return specialist can break big plays. Kick or punt returns are more likely to go for big yardage or touchdowns.",
  fgRange:
    "FG Range determines which field goal attempts are makeable. The dice result must fall within this range for the kick to succeed. Wider range = better kicker.",
  xpRange:
    "XP Range determines extra point success. The dice result must fall within this range. In the modern era (15-yard line), ranges are narrower than the 2-yard line era.",

  // Scoring Tendency
  scoringTendency:
    "Scoring Tendency determines the team's preferred offensive style. P+ = strong passing, P = pass-leaning, Neutral = balanced, R = run-leaning, R+ = strong running.",

  // Off-Season
  coachAdjustment:
    "Coach grades adjust based on season performance: champion = upgrade, winning season = small boost chance, losing season = downgrade.",
  coachingCarousel:
    "Hot seat coaches face a dice roll to determine if they're fired. A new coach is generated if fired. Non-hot-seat coaches are safe.",
  bonusFP:
    "Bottom-performing teams receive bonus Franchise Points: worst team +3, bottom 15% +2, bottom 30% +1. This helps parity.",
  ownershipImpact:
    "A 2d6 roll on the Ownership Impact table can change FP, ownership traits, or FO grade based on owner competence and loyalty.",
  annualDraft:
    "The Annual Draft improves or diminishes scoring quality based on current team profile. Better profiles have different odds than weaker ones.",
  trainingCamp:
    "Training Camp re-draws all quality pairs (ball security, fumbles, discipline, coverage, etc.), clock management, and scoring tendency for the new season.",
  unexpectedEvents:
    "About 1/3 of teams face unexpected events: front office shakeups, ownership changes, FP bonuses/penalties, or even franchise relocation.",
};
