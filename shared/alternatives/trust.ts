// WS9 — Food Alternatives Engine: trust guard.
//
// Alternatives are strictly MORE dangerous than Discovery. Discovery never
// references the current food as a problem; Alternatives, by grammar, invites a
// comparison ("you could use X instead"). The instant a comparison is implied,
// the anchor food risks being positioned as deficient. So the guard here is
// STRICTER than WS8's, not looser.
//
// We reuse WS8's banned vocabulary verbatim (guardrails authored once, per the
// WS7 invariant) and ADD the WS9-specific bans the brief calls out: never tell a
// household they "should switch", and never frame an alternative as an upgrade.
//
// The guard fails CLOSED: any option whose reason OR honesty-note carries a banned
// term is DROPPED by the engine (never shown), and asserted against in tests.
//
// The grammar test behind the list (from the WS9 investigation): could a kind,
// knowledgeable friend say this sentence to your face, about a food you just
// chose, without it sounding like a correction? If not, it is banned.

import { BANNED_TERMS as DISCOVERY_BANNED } from "../discovery/trust";

/**
 * WS9-specific additions on top of the shared Discovery ban list. These target
 * the brief's explicit prohibitions — "Better", "Healthier", "Superior", "You
 * should switch" — and the framing traps unique to alternatives (implying the
 * current food was a mistake, or that switching is an obligation).
 */
export const ALTERNATIVES_EXTRA_BANNED: string[] = [
  "should switch",
  "you should swap",
  "should swap",
  "switch away",
  "ditch the",
  "give up",
  "cut out the",
  "instead of the unhealthy",
  "guilt",
  "guilt-free",
  "guilt free",
  "clean eating",
  "clean version",
  "detox",
  "good for you",
  "bad for you",
  "better for you",
  "better option",
  "better choice", // also in discovery list; harmless duplicate
  "the right choice",
  "what you should",
  "real food", // moralising "real vs fake" framing
];

/** The full WS9 ban list: Discovery's bans + the alternatives-specific ones. */
export const BANNED_TERMS: string[] = Array.from(
  new Set([...DISCOVERY_BANNED, ...ALTERNATIVES_EXTRA_BANNED]),
);

/** Returns the list of banned terms found in `text` (empty = clean). */
export function validateReason(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_TERMS.filter((term) => lower.includes(term));
}

/** True when a reason / note string is safe to surface. */
export function isReasonTrustworthy(text: string): boolean {
  return validateReason(text).length === 0;
}

/**
 * Throws if any option carries ranking / judgement language in its reason or its
 * honesty note. Used by the test harness as a hard gate; the engine itself drops
 * offending options silently (empty-is-silent) rather than ever showing them.
 */
export function assertTrustworthy(
  options: Array<{ name: string; reason: string; note?: string }>,
): void {
  const failures: string[] = [];
  for (const o of options) {
    const violations = [
      ...validateReason(o.reason),
      ...(o.note ? validateReason(o.note) : []),
    ];
    if (violations.length > 0) {
      failures.push(
        `"${o.name}": ${Array.from(new Set(violations)).join(", ")}`,
      );
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `Alternatives trust violation — ranking/judgement language detected:\n  ${failures.join("\n  ")}`,
    );
  }
}
