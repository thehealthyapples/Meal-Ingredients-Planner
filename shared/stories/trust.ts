// WS10 — Household Stories Engine: trust guard.
//
// Stories are the most INTIMATE of the three lenses (Discovery / Alternatives /
// Stories). Discovery's failure mode is overwhelm; Alternatives' is judgement;
// Stories' is SURVEILLANCE — proving THA has been watching since the beginning
// and turning that into a verdict on how the household eats.
//
// The guard here extends the WS9 ban list (which extends WS8's) with
// stories-specific bans: no gamification, no deficits, no declines, no
// health verdicts on the household, no surveillance language.
//
// The test: "Would a kind person who has cooked alongside this household for
// two years say this out loud, unprompted, and would it make them SMILE?"
// If it would sting — or if it sounds like a system reporting on them — it
// is banned.
//
// The guard fails CLOSED: any story card whose headline or facts carry a
// banned term is dropped (never shown), and asserted against in tests.

import { BANNED_TERMS as WS9_BANNED } from "../alternatives/trust";

/**
 * WS10-specific additions on top of WS9's combined ban list (which already
 * covers WS8's bans + WS9's alternatives-specific ones).
 * These target stories-specific failure modes:
 *   • Gamification: streaks, achievements, leaderboards
 *   • Deficits: "fell short", "below average", "not enough", "missing out"
 *   • Comparison to past self as decline: "less than last", "declined"
 *   • Health verdicts on the household: "you improved", "well done"
 *   • Surveillance language: "we tracked", "we noticed"
 */
export const STORIES_EXTRA_BANNED: string[] = [
  // Gamification
  "streak",
  "achievement",
  "leaderboard",
  // Deficit framing
  "fell short",
  "below average",
  "below the average",
  "you only ate",
  "you only cooked",
  "only managed",
  "not enough",
  "missing out",
  // Comparison to past self as decline
  "less than last",
  "fewer than last",
  "declined",
  "you failed",
  "failed to",
  // Health verdicts on the household
  "you improved",
  "you're doing well",
  "you are doing well",
  "doing well",
  "well done",
  // Surveillance language
  "we tracked",
  "we noticed",
  "we recorded",
  "we logged",
];

/** The full WS10 ban list: WS9's combined bans + the stories-specific ones. */
export const BANNED_TERMS: string[] = Array.from(
  new Set([...WS9_BANNED, ...STORIES_EXTRA_BANNED]),
);

/** Returns the list of banned terms found in `text` (empty = clean). */
export function validateText(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_TERMS.filter((term) => lower.includes(term));
}

/** True when a story headline or fact is safe to surface. */
export function isTextTrustworthy(text: string): boolean {
  return validateText(text).length === 0;
}

/**
 * Validates a full set of story cards, throwing if any headline or fact
 * carries banned language. Used by the test harness as a hard gate; the
 * engine itself drops offending cards silently (empty-is-silent) rather
 * than ever surfacing them.
 */
export function assertTrustworthy(
  cards: Array<{ headline: string; facts: Array<{ text: string }> }>,
): void {
  const failures: string[] = [];
  for (const card of cards) {
    const hv = validateText(card.headline);
    if (hv.length > 0) {
      failures.push(`Headline "${card.headline}": ${hv.join(", ")}`);
    }
    for (const fact of card.facts) {
      const fv = validateText(fact.text);
      if (fv.length > 0) {
        failures.push(`Fact "${fact.text}": ${fv.join(", ")}`);
      }
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `Stories trust violation — banned language detected:\n  ${failures.join("\n  ")}`,
    );
  }
}
