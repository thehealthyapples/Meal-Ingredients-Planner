/**
 * COMP3 — the one owner of how THA tells a household it withheld something, or
 * could not check something, on dietary-safety grounds.
 *
 * Every intelligence surface that filters food must eventually say the same two
 * things: "we left something out, and here is why" and "we could not check, so
 * we are not guessing". Those two sentences were authored SIXTEEN times — nine
 * in `server/routes.ts`, two in `recipe-swap-engine.ts`, and, most seriously,
 * two in the browser (`use-smart-suggest.ts`, `weekly-planner-page.tsx`).
 *
 * Sixteen copies of one sentence is not sixteen times the risk of one; it is the
 * certainty that they will disagree and the near-certainty that nobody will
 * notice which one is right. They already had:
 *
 *   - a grammar defect in one copy only — the pairings note read "We left out 1
 *     suggestion that DON'T suit your household's dietary needs", because that
 *     copy pluralised the noun but hard-coded the verb. Its two siblings, which
 *     say the same thing about ideas and meals, agreed correctly. One sentence,
 *     three authors, two of them right;
 *   - unexplained drift in the refusal: "can't check" / "could not check" /
 *     "couldn't confirm", "right now" / "just now", and recovery advice present
 *     in some copies and absent in others, for the identical underlying fact;
 *   - a CLIENT-authored safety claim. `use-smart-suggest.ts` rendered the
 *     server's note but supplied `?? "they don't suit your household's dietary
 *     needs"` when the server sent none — so the browser asserted something
 *     about the household's dietary data that no server gate had established.
 *     The comment directly above it said the clause "is the SERVER's sentence,
 *     rendered verbatim". The fallback made that comment false.
 *
 * This module defines NO new gate, decision, engine or capability. It does not
 * decide what to withhold and never sees a restriction, a member, or a meal —
 * the existing safety gates decide, exactly as before, and pass their result in.
 * It owns the WORDING and nothing else, under Principle 2 (one owner per fact)
 * and Principle 8 (retire on introduction — every copy is deleted, not left
 * beside). This is the pattern `shared/nutrition/uplift-phrasing.ts` established
 * under NUTPLAN2, applied to a family sixteen copies wide instead of five.
 *
 * It lives in `shared/` because the two client copies are among the callers, and
 * takes plain structural arguments rather than importing a server type, so no
 * client bundle grows a server dependency to render a sentence.
 *
 * ── What these sentences must never say ──────────────────────────────────────
 * They name NO restriction and NO member. A withhold note is a broadcast
 * surface — it can land in a toast seen by anyone holding the phone — and whose
 * allergy this is does not belong there. This is stricter than the discipline
 * `household-nutrition-enrichment.ts` applies (name the restriction, never the
 * member): here, name neither. The rule is enforced against this file by
 * `test-comp3-unified-household-explanations.ts`, which is why converging the
 * copies here also converges the place that rule is checked — previously it was
 * asserted against one of the sixteen copies and could not see the other fifteen.
 */

/** The phrase every sentence in this family ends on. Written once. */
const DIETARY_NEEDS = "your household's dietary needs";

/**
 * The bare clause, with no count and no wrapper — for callers that compose it
 * into a larger sentence (the smart-apply gate sends this as `withheldNote`,
 * and the planner toast renders it after "N left out because ").
 *
 * `count` selects agreement only. It never appears in the output.
 */
export function withheldClause(count = 1): string {
  return count === 1
    ? `it doesn't suit ${DIETARY_NEEDS}`
    : `they don't suit ${DIETARY_NEEDS}`;
}

/**
 * The counted note, for when some candidates survived the gate and some did not.
 *
 * Never present a filtered list as if it were the whole answer (PROD6): without
 * this sentence, withholding every suggestion is indistinguishable from there
 * being none, which is the silent shortening the rule exists to prevent.
 *
 * `noun` is the thing being counted — "suggestion", "idea", "meal", "swap". It
 * is pluralised with a plain "s", which is correct for every current caller.
 */
export function withheldNote(input: { count: number; noun: string }): string {
  const { count, noun } = input;
  const plural = count === 1 ? "" : "s";
  const verb = count === 1 ? "doesn't" : "don't";
  return `We left out ${count} ${noun}${plural} that ${verb} suit ${DIETARY_NEEDS}.`;
}

/**
 * The note for when NOTHING survived the gate — a different statement from the
 * counted one, and a different statement again from "there was nothing to find".
 *
 * `attempt` completes "We couldn't …" and describes what was tried, e.g.
 * "suggest anything from these ingredients". `subjectIsPlural` selects the
 * agreement of the trailing verb, because "anything … suits" but "swaps … suit".
 * `consequence`, when given, is appended as ", <consequence>" — it states what
 * THA did about it, and is the caller's because only the caller knows.
 */
export function nothingSuitableNote(input: {
  attempt: string;
  subjectIsPlural?: boolean;
  consequence?: string;
}): string {
  const { attempt, subjectIsPlural = false, consequence } = input;
  const verb = subjectIsPlural ? "suit" : "suits";
  const tail = consequence ? `, ${consequence}` : "";
  return `We couldn't ${attempt} that ${verb} ${DIETARY_NEEDS}${tail}.`;
}

/**
 * The refusal for when the household's safety context could not be resolved.
 *
 * This is an honest gap, not an empty result (Core Principle 6). Returning an
 * empty list instead would read to the household as "there is nothing", which is
 * a different and false statement from "we could not check". Every caller here
 * fails CLOSED.
 *
 * `subject` is what could not be checked — "this", "these", "meal suggestions".
 * `consequence` states what THA therefore did NOT do, and is required: a refusal
 * that does not say what it cost the household is not an explanation. Callers
 * that can recover pass `retryable`, which appends the invitation to try again.
 */
export function safetyUnavailableNote(input: {
  subject: string;
  consequence: string;
  retryable?: boolean;
}): string {
  const { subject, consequence, retryable = false } = input;
  const retry = retryable ? " Please try again in a moment." : "";
  return `We can't check ${subject} against ${DIETARY_NEEDS} right now, so ${consequence}.${retry}`;
}
