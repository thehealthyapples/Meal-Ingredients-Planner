/**
 * NUTPLAN2 — the one owner of how a Nutrition Uplift suggestion is worded.
 *
 * "Simply Better" turns an uplift suggestion into a sentence a household reads.
 * The rule is three words long and was therefore copied rather than owned: the
 * same `swap → "Swap in X" / boost → "Add more X" / else → "Add X"` ternary
 * appeared VERBATIM in five places — two route handlers, two assemblers, and a
 * page component (NUTPLAN1 finding D2).
 *
 * Five copies of a rule is not five times the risk of one; it is the certainty
 * that they will eventually disagree, and the near-certainty that nobody will
 * notice which one is right. The specific hazard here is that the copies span
 * BOTH PLANES: four render server-side and one renders in the browser, so the
 * same suggestion could be worded one way on the food detail page and another
 * in the Nutrition Centre, with no test able to see the difference.
 *
 * This module defines NO new suggestion, action, or capability. It is the
 * existing rule, moved to one place, under Principle 2 (one owner per fact) and
 * Principle 8 (retire on introduction — every copy is deleted, not left beside).
 *
 * It lives in `shared/` because the client is one of the five callers. The
 * uplift ENGINE and its types stay exactly where they are
 * (`server/lib/uplift-types.ts`, `uplift-rules.ts`, `uplift-engine.ts`) — this
 * owns the wording and nothing else, and deliberately takes a structural shape
 * rather than importing a server type, so no client bundle grows a server
 * dependency to render three words.
 */

/** The actions an uplift suggestion can take. Mirrors `UpliftSuggestion.action`
 *  (`server/lib/uplift-types.ts`) structurally, without importing it. */
export type UpliftAction = "add" | "swap" | "boost";

/** The minimum a caller must supply to have a suggestion worded. */
export interface UpliftPhrasingInput {
  action: UpliftAction | string;
  ingredient: string;
}

/**
 * The household-facing sentence for one uplift suggestion.
 *
 * An unrecognised action falls to "Add X" — the same behaviour all five original
 * copies had, because each was an `if swap … else if boost … else` chain. It is
 * preserved rather than tightened: this convergence is not the place to change
 * what a household reads, and a thrown error here would blank a working panel.
 */
export function upliftSuggestionText(suggestion: UpliftPhrasingInput): string {
  if (suggestion.action === "swap") return `Swap in ${suggestion.ingredient}`;
  if (suggestion.action === "boost") return `Add more ${suggestion.ingredient}`;
  return `Add ${suggestion.ingredient}`;
}
