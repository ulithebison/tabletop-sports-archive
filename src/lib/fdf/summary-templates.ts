import type { DriveResultType } from "./types";

/**
 * Summary templates per drive result type.
 * Variables: {qb}, {receiver}, {rb}, {kicker}, {defender}, {returner}, {team}, {opponent}, {fieldpos}
 */
export const SUMMARY_TEMPLATES: Partial<Record<DriveResultType, string[]>> = {
  TD_PASS: [
    "{qb} finds {receiver} for the touchdown!",
    "{qb} connects with {receiver} in the end zone!",
    "Touchdown! {qb} hits {receiver} for the score.",
    "{receiver} hauls in the {qb} pass for six!",
    "What a throw! {qb} to {receiver} for the TD!",
  ],
  TD_RUN: [
    "{rb} punches it in for the touchdown!",
    "{rb} breaks through the line for the score!",
    "Touchdown! {rb} finds the end zone on the ground.",
    "{rb} powers in for six!",
    "{rb} takes the handoff and scores!",
  ],
  FGA_GOOD: [
    "{kicker} nails the field goal.",
    "The kick is good! {kicker} puts three on the board.",
    "{kicker} splits the uprights for three.",
    "Field goal is good from {kicker}.",
    "{kicker} connects on the field goal attempt.",
  ],
  FGA_MISSED: [
    "{kicker} misses the field goal wide.",
    "No good! {kicker}'s kick goes wide.",
    "{kicker} pushes the field goal attempt wide right.",
    "The kick from {kicker} falls short.",
    "{kicker} can't connect on the field goal.",
  ],
  INTERCEPTION: [
    "{qb} is picked off by {opponent}!",
    "Intercepted! {opponent} reads the pass perfectly.",
    "{qb} throws it right to {opponent}. Turnover!",
    "{opponent} steps in front of the {qb} pass for the interception!",
    "Bad decision by {qb}! {opponent} with the INT.",
  ],
  FUMBLE: [
    "Fumble! {opponent} recovers!",
    "Ball is loose! {opponent} falls on the fumble.",
    "Turnover! {opponent} scoops up the fumble.",
    "{opponent} forces the fumble and recovers!",
    "A costly turnover — {opponent} with the recovery.",
  ],
  SAFETY: [
    "Safety! {team} is brought down in the end zone.",
    "Sack in the end zone! Safety for {opponent}!",
    "Two points for {opponent} — safety!",
    "Safety! {team} gives up two points.",
    "{team} caught in the end zone! Safety!",
  ],
  PUNT: [
    "{team} punts it away.",
    "Punt. {team} gives the ball back to {opponent}.",
    "{team} forced to punt from {fieldpos} field position.",
    "Three and out. {team} punts.",
    "{team} sends out the punt team.",
  ],
  PUNT_BU: [
    "{team} punts (backed up deep).",
    "Punting from deep in their own territory, {team} gets off a booming kick.",
    "{team} punts from a backed-up position.",
  ],
  PUNT_CO: [
    "{team} punts (coffin-corner).",
    "Coffin-corner punt by {team}. Great field position flip.",
    "{team} pins {opponent} deep with a coffin-corner punt.",
  ],
  TURNOVER_ON_DOWNS: [
    "{team} turns it over on downs!",
    "{opponent} gets the ball after {team} fails on fourth down.",
    "Turnover on downs! {team} comes up short.",
  ],
  KICKOFF_RETURN_TD: [
    "{team} takes the kickoff all the way back for a touchdown!",
    "Kickoff return touchdown! {team} goes the distance!",
    "{team} breaks free on the kick return! Touchdown!",
  ],
  PUNT_RETURN_TD: [
    "{team} takes the punt back to the house!",
    "Punt return touchdown! {team} electrifies the crowd!",
    "{team} shakes loose for the punt return TD!",
  ],
  INTERCEPTION_RETURN_TD: [
    "{team} picks it off and takes it to the house!",
    "Pick six! {team} intercepts and scores!",
    "{team} jumps the route and returns it for six!",
  ],
  FUMBLE_RETURN_TD: [
    "{team} scoops up the fumble and races to the end zone!",
    "Fumble recovery touchdown! {team} goes all the way!",
    "{team} picks up the loose ball and scores!",
  ],
  BLOCKED_FG_RETURN_TD: [
    "Blocked! {team} picks it up and returns it for a touchdown!",
    "The field goal is blocked and {team} takes it back for six!",
    "{team} blocks the kick and takes it to the house!",
  ],
  BLOCKED_PUNT_TD: [
    "Punt is blocked! {team} recovers in the end zone for a TD!",
    "Blocked punt! {team} falls on it in the end zone for the score!",
    "{team} crashes through and blocks the punt — touchdown!",
  ],
  FREE_KICK_RETURN_TD: [
    "{team} returns the free kick for a touchdown!",
    "Free kick return touchdown! {team} goes all the way!",
    "{team} breaks loose on the free kick and scores!",
  ],
  DESPERATION_TD: [
    "Desperation heave... CAUGHT! {receiver} with the miracle touchdown!",
    "Hail Mary! {qb} launches it and {receiver} comes down with it! Touchdown!",
    "{qb} throws up a prayer and {receiver} answers! Touchdown!",
  ],
  DESPERATION_PLAY: [
    "{qb} heaves a desperation pass... incomplete!",
    "Last-ditch effort by {qb}! The ball falls to the turf.",
    "{qb} throws up a prayer... but nobody's there. Turnover.",
  ],
  UNUSUAL_RESULT: [
    "Unusual play! Something unexpected happens on the field.",
    "A bizarre sequence — the refs sort it out.",
    "What just happened?! An unusual result leaves everyone confused.",
  ],
  DESPERATION_FGA: [
    "Desperation field goal attempt by {kicker}... it's good!",
    "{kicker} nails the desperation kick as time expires!",
    "{kicker} launches a desperation boot... and it sneaks through!",
  ],
  KICK_PUNT_REC_RECOVERS: [
    "{team} fumbles the return but recovers the ball.",
    "Loose ball on the return! {team} falls on their own fumble.",
    "Fumble on the return, but {team} recovers. No harm done.",
  ],
  KICK_PUNT_KICK_RECOVERS: [
    "Fumble on the return! {opponent} recovers the ball.",
    "{opponent} pounces on the loose ball! Turnover!",
    "The return man drops it! {opponent} falls on the fumble.",
  ],
  KICK_PUNT_KICK_TD: [
    "Fumble on the return! {opponent} scoops and scores! Touchdown!",
    "{opponent} recovers the fumble and takes it to the house!",
    "Loose ball! {opponent} scoops it up and scores! Touchdown!",
  ],
  KNEEL_DOWN: [
    "{team} takes a knee to run out the clock.",
    "Victory formation. {team} kneels it.",
    "{team} lines up in victory formation and runs out the clock.",
  ],
  END_OF_HALF: [
    "That's the end of the first half.",
    "Halftime! We head to the break.",
    "The horn sounds. End of the first half.",
  ],
  END_OF_GAME: [
    "That's the game!",
    "Final whistle blows. The game is over.",
    "And that's the final whistle! Game over.",
  ],
};

/**
 * Team-only summary templates (no player variables).
 * Used for non-Enhanced mode where rosters/player tracking aren't available.
 * Variables: {team}, {opponent}, {fieldpos}
 *
 * For result types where SUMMARY_TEMPLATES already use only team/opponent/fieldpos,
 * the generator falls back to SUMMARY_TEMPLATES directly — no duplication needed.
 */
export const SIMPLE_SUMMARY_TEMPLATES: Partial<Record<DriveResultType, string[]>> = {
  TD_PASS: [
    "{team} hits the passing play for a touchdown!",
    "{team} connects through the air for six!",
    "Touchdown {team}! A big pass play finds the end zone.",
    "A strike through the air! {team} scores!",
  ],
  TD_RUN: [
    "{team} punches it in on the ground!",
    "{team} powers into the end zone on the rush!",
    "Touchdown {team}! A strong run into the end zone.",
    "{team} breaks through the line for the score!",
  ],
  FGA_GOOD: [
    "{team} nails the field goal.",
    "The kick is good! {team} adds three.",
    "{team} splits the uprights for three points.",
    "Field goal is good! Three more for {team}.",
  ],
  FGA_MISSED: [
    "{team} misses the field goal wide!",
    "No good! {team}'s field goal attempt goes wide.",
    "{team} can't connect on the field goal attempt.",
    "The kick from {team} falls short.",
  ],
  INTERCEPTION: [
    "{team} is picked off by {opponent}!",
    "Intercepted! {opponent} comes up with the ball.",
    "Turnover! {opponent} snags the interception.",
    "Bad throw by {team} — {opponent} picks it off!",
  ],
  FUMBLE: [
    "Fumble! {opponent} recovers!",
    "Ball is loose! {opponent} falls on the fumble.",
    "Turnover! {opponent} scoops up the fumble.",
    "{opponent} forces the fumble and recovers!",
  ],
  DESPERATION_TD: [
    "Desperation heave by {team}... CAUGHT! Miracle touchdown!",
    "Hail Mary! {team} launches it deep and comes down with it! Touchdown!",
    "{team} throws up a prayer and it's answered! Touchdown!",
  ],
  DESPERATION_PLAY: [
    "{team} throws up a desperation play... incomplete!",
    "Desperation heave by {team} falls short!",
    "Last-ditch effort by {team}! The ball falls to the turf.",
    "{team} goes for it all... but it's not meant to be.",
  ],
  UNUSUAL_RESULT: [
    "Unusual play! Something unexpected happens on the field.",
    "A bizarre sequence — the refs sort it out.",
    "What just happened?! An unusual result leaves everyone confused.",
    "A strange play. Nobody's quite sure what to make of it.",
  ],
  DESPERATION_FGA: [
    "Desperation field goal attempt by {team}... it's good!",
    "{team} nails the desperation kick as time expires!",
    "{team} launches a desperation boot... and it sneaks through!",
  ],
};
