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
  ],
  BLOCKED_PUNT_TD: [
    "Punt is blocked! {team} recovers in the end zone for a TD!",
    "Blocked punt! {team} falls on it in the end zone for the score!",
  ],
  FREE_KICK_RETURN_TD: [
    "{team} returns the free kick for a touchdown!",
    "Free kick return touchdown! {team} goes all the way!",
  ],
  DESPERATION_TD: [
    "Desperation heave... CAUGHT! {receiver} with the miracle touchdown!",
    "Hail Mary! {qb} launches it and {receiver} comes down with it! Touchdown!",
    "{qb} throws up a prayer and {receiver} answers! Touchdown!",
  ],
  DESPERATION_FGA: [
    "Desperation field goal attempt by {kicker}... it's good!",
    "{kicker} nails the desperation kick as time expires!",
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
  ],
  END_OF_HALF: [
    "That's the end of the first half.",
    "Halftime! We head to the break.",
  ],
  END_OF_GAME: [
    "That's the game!",
    "Final whistle blows. The game is over.",
  ],
};
