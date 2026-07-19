/**
 * shared/attention — the canonical THA Attention vocabulary (ATTN1)
 * ==================================================================
 * The ONE Attention vocabulary for the platform, established by
 * docs/investigations/intelligence/ATTN1_ATTENTION_PRIORITY_MODEL.md (§5). It replaces the
 * three structurally identical, module-local priority unions and rank maps
 * previously declared in:
 *
 *   - server/intelligence/food-intelligence/opportunity-engine.ts (`FoodOpportunityPriority`)
 *   - server/intelligence/opportunity-delivery/framework.ts        (`OpportunityPriority`)
 *   - server/intelligence/conversation/notice-engine.ts            (`NoticePriority`)
 *
 * all retired under ATTN1 (Principle 8 — retire on introduction). This is a
 * REFERENCE VOCABULARY (Core Principle 5) — not a store, not a service, not a
 * capability. It sits beside the entity spine exactly as the allergen library
 * and the diet-pattern enum already do. No table owns an attention level:
 * `opportunity_deliveries.priority` remains a non-authoritative snapshot
 * (shared/schema.ts — ATTN1 invariant A6).
 *
 * PURE AND ZERO-I/O by construction: importing this module from the Notice
 * Engine does not violate its zero-dependency rationale — that rationale
 * forbids depending on the platform's I/O modules, which `shared/` is not.
 *
 * THE AXIS THIS VOCABULARY OWNS — Attention: "how much should this household
 * care about this item, right now?" It is deliberately disjoint from the two
 * axes it must never be conflated with (ATTN1 §4, invariant A5):
 *
 *   - Confidence (`EvidenceConfidence`, shared/knowledge/evidence.ts) — "how
 *     sure are we this is true?" The evidence gate runs FIRST and decides
 *     whether an item may render at all; attention orders only what survived.
 *     Confidence may never raise attention; attention may never launder
 *     confidence. The two unions share no values, no rank map and no module —
 *     deliberately, and a test asserts the value sets stay disjoint.
 *   - Selection (Planner `score`/`fitScore`, COMP1 verdict ladder) — "which
 *     candidate wins?" A property of a set, never of a fact's importance.
 *
 * THE FOUR LEVELS (ATTN1 §5.2) — each anchored to existing doctrine:
 *
 *   critical → a fact that could cause HARM if unseen (hard restrictions,
 *              allergens, intolerances, sourced toxicity). This is the additive
 *              face of Rule T0 (NK2 §2 P1 — "Safety is the absolute blocker",
 *              non-overridable): never fail to surface an unsafe thing the
 *              household already has.
 *   high     → "Important" — an actionable gap the household would act on.
 *   medium   → "Helpful"  — useful guidance, safely ignored.
 *   low      → "Informational" — context, patterns, celebration; no action.
 *
 * The `high`/`medium`/`low` wire values are retained on purpose: ATTN1 §7
 * Phase 5 (renaming them to `important`/`helpful`/`informational` at the value
 * level) is explicitly deferred — it is pure cosmetics that would churn every
 * fixture and the persisted snapshot column for no behavioural gain. Where the
 * four-name vocabulary must face a user, map at the presentation edge via
 * {@link ATTENTION_LABELS} instead.
 *
 * `critical` IS NOT A CONFIRMATION TIER (invariant A7): AttentionLevel governs
 * SURFACING; `ConfirmationTier` governs ACTING. A critical notice still
 * resolves through its ordinary registered verbs at their ordinary
 * confirmation tier.
 */

/** How much should this household care about this item, right now? Producer-assigned, never re-derived downstream (ATTN1 invariant A1). */
export type AttentionLevel = "critical" | "high" | "medium" | "low";

/** Total order. Lower sorts first. The single canonical rank. The three consumer sort functions, layer-independent under ATTN1's scope lock, were converged by DEC1 into the one canonical mechanics module beside this file (`./decision.ts`). */
export const ATTENTION_RANK: Readonly<Record<AttentionLevel, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** Presentation-edge names for the four levels. The wire values are the vocabulary; these labels are how a UI says them (ATTN1 §7 Phase 5 — value rename deferred). */
export const ATTENTION_LABELS: Readonly<Record<AttentionLevel, string>> = {
  critical: "Critical",
  high: "Important",
  medium: "Helpful",
  low: "Informational",
};

/**
 * MAT1 (AFI_VERIFY1 §4.3) — presentation-edge names for the opportunity DOMAIN:
 * which room of the house an observation came from. Sits beside
 * {@link ATTENTION_LABELS} for the same reason and in the same class — a
 * reference vocabulary at the presentation edge, not a store, service or
 * capability.
 *
 * WHY IT MOVED HERE. A registered domain must appear in four registries before a
 * household can correctly see it:
 *
 *   1. `DOMAIN_SURFACE`     — server/intelligence/opportunity-delivery/framework.ts
 *   2. `DOMAIN_TO_CATEGORY` — server/intelligence/conversation/notice-engine.ts
 *   3. a mounted `AmbientIntelligence domains={[…]}` surface
 *   4. THIS map — else the card renders under the generic "Food" fallback
 *
 * The first two were asserted; this one was not, because it was declared inside
 * a `.tsx` component the server test pipeline cannot import. It was therefore
 * the ONE unguarded registry, and the last one before the household's eyes — a
 * new domain could pass every existing test and still reach a real kitchen
 * mislabelled. Declaring it here makes it the single source of truth for both
 * sides of the wire and lets `test-mat1-registry-conformance.ts` assert all four
 * registries in the ONE existing pipeline, with no second test runner.
 *
 * This is a MOVE, not a new registry (Principle 8 — retire on introduction). The
 * component keeps the same fallback behaviour; it now imports these rows rather
 * than re-declaring them.
 */
export const OPPORTUNITY_DOMAIN_LABELS: Readonly<Record<string, string>> = {
  planner: "Planner",
  pantry: "Pantry",
  shopping: "Shopping list",
  // AFI4/CBK2 — without this row a cookbook card renders under the generic "Food"
  // fallback, so the household could not tell which room the observation came from.
  cookbook: "Cookbook",
  // HNP2 — the nutrition domain. "Food" would be actively misleading here: every other
  // domain in this map IS food, and the one thing this card is about is the shape of the
  // week rather than any single food in it.
  nutrition: "Nutrition",
};

/**
 * What a card says when it has no label for the domain. An unregistered domain
 * degrades to the honest generic rather than to a guess or a blank — but it is
 * a GAP, and the conformance suite fails rather than letting one ship.
 */
export const OPPORTUNITY_DOMAIN_FALLBACK_LABEL = "Food";

/**
 * The CLOSED allowlist of opportunity/notice types permitted to be `critical`
 * (ATTN1 invariant A2). Every member must be backed by Rule T0 — an active
 * household hard restriction, allergen, intolerance, or sourced toxicity.
 * Adding a member requires governance review (Governance Rule 8, by analogy):
 * this allowlist is the platform's structural defence against attention
 * inflation, the model's principal long-term risk (ATTN1 §8 R1). `critical`
 * is valuable precisely and only in proportion to how rarely it is used.
 */
export const CRITICAL_TYPES: ReadonlySet<string> = new Set(["shopping-restriction-conflict"]);

const ATTENTION_LEVELS: ReadonlySet<string> = new Set(Object.keys(ATTENTION_RANK));

/** Type guard for values arriving over an untyped boundary (producer adapters, raw API payloads). */
export function isAttentionLevel(value: unknown): value is AttentionLevel {
  return typeof value === "string" && ATTENTION_LEVELS.has(value);
}

/**
 * `critical` carries exemptions nothing else does (ATTN1 invariant A3: exempt
 * from type muting, exempt from the delivery clamp, fills the attention budget
 * first). Invariant A4 is its mirror: nothing below `critical` is exempt from
 * anything — `high` is not "slightly critical".
 */
export function isCritical(level: AttentionLevel): boolean {
  return level === "critical";
}

/**
 * The invariant-A2 structural assertion: a producer may emit `critical` only
 * for a type on the {@link CRITICAL_TYPES} allowlist. Enforced at the producer
 * boundary (OD1's adapter) so no future producer can inflate an inconvenience
 * into a harm signal merely by naming it `critical`. Throws — a producer that
 * violates A2 is untrusted and honestly degrades rather than surfacing.
 */
export function assertCriticalAllowed(type: string, level: AttentionLevel): void {
  if (isCritical(level) && !CRITICAL_TYPES.has(type)) {
    throw new Error(
      `Attention level "critical" is not permitted for opportunity type "${type}" — ` +
        `critical is a closed allowlist backed by Rule T0 (ATTN1 invariant A2). ` +
        `Membership changes require governance review.`,
    );
  }
}
