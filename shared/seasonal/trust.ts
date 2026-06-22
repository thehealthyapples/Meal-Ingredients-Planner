// WS11 — Seasonal Stories Engine: trust guard.
//
// A Seasonal Story is the most TEMPTING of all the lenses to turn into a
// scorecard. A whole season, summarised, invites ranking ("your best season"),
// productivity language ("most productive"), and health verdicts ("healthiest
// season"). WS11 must refuse all of it. A season is a memory, never an annual
// review.
//
// This guard EXTENDS the WS10 ban list (which already extends WS9 → WS8), and
// adds seasonal-specific bans. It fails CLOSED: any block card whose headline
// or facts carry a banned term is dropped (never shown) and asserted against in
// tests. Because the deficit/comparison/ranking primitives are never computed
// in the engine, they cannot leak in — the guard is the second line, not the
// first.
//
// The test, inherited from WS10: "Would a kind person who has cooked alongside
// this household say this out loud, unprompted — and would it make them SMILE?"
// For WS11 add: "…and would it feel like a memory of the season, not a verdict
// on it?"

import { BANNED_TERMS as WS10_BANNED } from "../stories/trust";

/**
 * WS11-specific additions on top of WS10's combined ban list. These target the
 * seasonal failure mode: turning a season into a competition or a report.
 *   • Ranking of seasons: "best season", "worst season"
 *   • Productivity framing: "most productive", "productive season"
 *   • Health verdicts on the season: "healthiest", "unhealthiest"
 *   • Yearly-review / scorecard language: "season score", "annual review",
 *     "report card", "season rating"
 *   • Progress/pressure framing the season invites: "you should",
 *     "this season you only", "you need to"
 */
export const SEASONAL_EXTRA_BANNED: string[] = [
  // Ranking of seasons
  "best season",
  "worst season",
  "better season",
  "top season",
  // Productivity framing
  "most productive",
  "productive season",
  "productivity",
  // Health verdicts on the season
  "healthiest",
  "unhealthiest",
  "healthiest season",
  // Scorecard / yearly-review language
  "season score",
  "season rating",
  "report card",
  "annual review",
  "yearly review",
  "scorecard",
  // Pressure / prescription the season summary invites
  "you should",
  "you need to",
  "this season you only",
];

/** The full WS11 ban list: WS10's combined bans + the seasonal-specific ones. */
export const BANNED_TERMS: string[] = Array.from(
  new Set([...WS10_BANNED, ...SEASONAL_EXTRA_BANNED]),
);

/** Returns the list of banned terms found in `text` (empty = clean). */
export function validateText(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_TERMS.filter((term) => lower.includes(term));
}

/** True when a seasonal headline or fact is safe to surface. */
export function isTextTrustworthy(text: string): boolean {
  return validateText(text).length === 0;
}

/**
 * Validates a full set of seasonal blocks, throwing if any card carries banned
 * language. Used by the test harness as a hard gate; the engine itself drops
 * offending cards silently (empty-is-silent) rather than ever surfacing them.
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
      `Seasonal Stories trust violation — banned language detected:\n  ${failures.join("\n  ")}`,
    );
  }
}
