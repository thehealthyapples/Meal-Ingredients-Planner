// WS8 — Food Discovery Engine: trust guard.
//
// Discovery must feel like a trusted friend saying "if you like this, you might
// enjoy these too" — never a verdict, never a sale, never a hierarchy of virtue.
//
// This module is the enforcement point for that promise. Every reason string a
// suggestion carries is passed through validateReason() and, in the engine, any
// violation is dropped (and asserted against in tests). One bad suggestion costs
// more trust than ten good ones earn, so the guard fails CLOSED.

/**
 * Vocabulary discovery must never use. Covers the brief's explicit bans
 * ("better than", "healthier", "superior", "best") plus the "DISCOVERY IS NOT"
 * list (healthiest, top foods, highest nutrients, superfoods, optimisation) and
 * judgement language ("you should", "you're missing").
 *
 * Matched case-insensitively as substrings, so keep entries specific enough not
 * to catch innocent words (e.g. "best" would catch "best" — acceptable, we want
 * zero superlatives — but we avoid fragments like "top" that appear inside
 * ordinary words such as "stop" by requiring a trailing space where needed).
 */
export const BANNED_TERMS: string[] = [
  "better than",
  "better choice",
  "healthier",
  "healthiest",
  "superior",
  "the best",
  "best food",
  "worse",
  "unhealthy",
  "superfood",
  "optimal",
  "optimise",
  "optimize",
  "optimisation",
  "optimization",
  "highest nutrient",
  "most nutritious",
  "top food",
  "you should eat",
  "you should be eating",
  "you're missing",
  "you are missing",
  "upgrade",
];

/** Returns the list of banned terms found in `text` (empty = clean). */
export function validateReason(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_TERMS.filter((term) => lower.includes(term));
}

/** True when a reason string is safe to surface. */
export function isReasonTrustworthy(text: string): boolean {
  return validateReason(text).length === 0;
}

/**
 * Throws if any reason carries ranking / judgement language. Used by the test
 * harness as a hard gate; the engine itself drops offending suggestions silently
 * (empty-is-silent) rather than ever showing them.
 */
export function assertTrustworthy(
  suggestions: Array<{ name: string; reason: string }>,
): void {
  const failures: string[] = [];
  for (const s of suggestions) {
    const violations = validateReason(s.reason);
    if (violations.length > 0) {
      failures.push(`"${s.name}": ${violations.join(", ")} — in: ${s.reason}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `Discovery trust violation — ranking/judgement language detected:\n  ${failures.join("\n  ")}`,
    );
  }
}
