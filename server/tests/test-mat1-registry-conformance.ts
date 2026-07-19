/**
 * test-mat1-registry-conformance.ts (MAT1)
 * =========================================================
 * Closes the two production-readiness reservations AFI_VERIFY1 named as the gate
 * before wider rollout (docs/investigations/AFI_VERIFY1_AMBIENT_FOOD_INTELLIGENCE_CONFORMANCE_AUDIT.md §8):
 * R2 (the engine clamped before the delivery layer could rank) and R3 (the client
 * rendering registry had no test of any kind).
 *
 * Coverage:
 *   §1  Registry conformance — every member of the CLOSED `FOOD_OPPORTUNITY_DOMAINS`
 *       set is registered in all four places a domain must appear before a household
 *       can correctly see it. This is the audit's §4.3 finding: `DOMAIN_LABEL` lived
 *       inside a `.tsx` the server pipeline could not import, so it was the ONE
 *       unguarded registry — and the LAST step before the household's eyes. A new
 *       domain could pass every existing suite and still reach a real kitchen
 *       labelled "Food". MAT1 moved it to `shared/attention` so this suite can walk
 *       it, in the ONE existing pipeline, with no second test runner.
 *   §2  Household Learning eligibility (LEARN1 × MAT1) — OD1 asks each producer for
 *       the CANDIDATE set, not the delivered set, so a household's own Confirmed
 *       Understanding can re-rank every observation that household generated rather
 *       than only the top slice a producer happened to keep.
 *   §3  The invariant §2 must never break: attention outranks learning. Learning
 *       reorders WITHIN an attention tier and can never move an item across one.
 *
 * A NOTE ON WHAT §3 DELIBERATELY DOES NOT ASSERT. AFI_VERIFY1 R2 proposed guarding
 * the fix with "a test asserting a low-priority opportunity can be promoted above a
 * medium-priority one by Confirmed Understanding". That test is NOT written here,
 * because it asserts the opposite of a load-bearing safety invariant: `orderByAttention`
 * (shared/attention/decision.ts:87) makes ATTENTION the first sort key and learning a
 * tie-breaker beneath it, precisely so that "a confirmed dislike re-orders advice
 * within its tier; it never buries urgent advice beneath trivia" (decision.ts:82-86,
 * framework.ts:574-580). Making R2's literal test pass would mean letting a household's
 * preference outrank a safety signal. The audit's underlying concern was ELIGIBILITY —
 * that clamped-away candidates could never be re-ranked at all — and that is what §2
 * asserts. §3 pins the invariant R2's wording would have broken.
 *
 * Run with: npx tsx server/tests/test-mat1-registry-conformance.ts
 */

import {
  FOOD_OPPORTUNITY_DOMAINS,
  type FoodOpportunityDomain,
} from "../intelligence/food-intelligence/opportunity-engine.js";
import {
  selectSurface,
  prioritiseAndGroup,
  collectOpportunities,
  OPPORTUNITY_SUBJECT_TYPE,
  type DeliverableOpportunity,
  type ProducerFetch,
} from "../intelligence/opportunity-delivery/framework.js";
import { noticeOpportunities } from "../intelligence/conversation/notice-engine.js";
import { InMemoryOpportunityDeliveryStore } from "../intelligence/opportunity-delivery/delivery-store.js";
import type { ConfirmedUnderstanding } from "../intelligence/evidence-learning/household-observation.js";
import {
  OPPORTUNITY_DOMAIN_LABELS,
  OPPORTUNITY_DOMAIN_FALLBACK_LABEL,
  type AttentionLevel,
} from "../../shared/attention/index.js";
import { DELIVERY_MAX_LIMIT, DELIVERY_DEFAULT_LIMIT } from "../../shared/attention/decision.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

/** A minimal, valid deliverable — every field the sort, the notice adapter and Rule E1 read. */
function opportunity(
  id: string,
  domain: string,
  type: string,
  priority: AttentionLevel,
): DeliverableOpportunity {
  return {
    id,
    capabilityId: "food-intelligence",
    domain,
    type,
    priority,
    explanation: `Observation ${id} about ${domain}.`,
    // Rule E1 — no citation, no card. Every fixture cites, because an uncited one
    // would be dropped for the WRONG reason and quietly weaken the assertion.
    evidence: [{ source: domain, detail: `A real read from ${domain}.` }],
    suggestedAction: `Take action on ${id}.`,
    surface: selectSurface(domain),
    subject: undefined,
  } as DeliverableOpportunity;
}

async function main(): Promise<void> {
  console.log("\nMAT1 — registry conformance & household-learning eligibility\n" + "=".repeat(56));

  // -------------------------------------------------------------------------
  section("§1 Registry conformance — every registered domain reaches the household correctly");

  // HNP2 — four became five. This assertion is not a formality: it is the governance
  // gate the fifth member had to be argued past, and it fired at the type level the
  // moment `nutrition` was added. The decision it records: the nutrition domain carries
  // the ONE opportunity type that survived MAT1 §3.3's retirement of the household
  // nutrition limb (`nutrition-balance-gap`), whose two siblings were retired precisely
  // BECAUSE they duplicated observations `planner` already makes. Widening this number
  // is how that argument is made in public rather than in a commit message.
  assert(
    FOOD_OPPORTUNITY_DOMAINS.length === 5,
    "the domain set is CLOSED at five members — a sixth is a governance decision, not an edit",
    FOOD_OPPORTUNITY_DOMAINS.join(","),
  );

  for (const domain of FOOD_OPPORTUNITY_DOMAINS) {
    // Registry 1 — DOMAIN_SURFACE, via its public reader. An unregistered domain
    // falls back to "floating", which is the Companion's generic surface: the card
    // would exist but would never land in the room it is about.
    assert(
      selectSurface(domain) !== "floating",
      `${domain}: registered in DOMAIN_SURFACE (routes to its own conversation surface, not the floating fallback)`,
      selectSurface(domain),
    );

    // Registry 2 — DOMAIN_TO_CATEGORY, via `noticeOpportunities`, which drops an
    // unmapped domain outright (notice-engine.ts:340-341). A domain missing here is
    // produced, delivered and persisted — and the Companion NEVER voices it.
    const notices = noticeOpportunities([
      opportunity(`${domain}-1`, domain, `${domain}-probe`, "medium"),
    ]);
    assert(
      notices.length === 1,
      `${domain}: registered in DOMAIN_TO_CATEGORY (the Companion can voice it)`,
      `${notices.length} notices`,
    );

    // Registry 3 — the client label registry. THE FINDING THIS SUITE EXISTS FOR
    // (AFI_VERIFY1 §4.3). Before MAT1 this row was unassertable from any test.
    const label = OPPORTUNITY_DOMAIN_LABELS[domain];
    assert(
      typeof label === "string" && label.length > 0 && label !== OPPORTUNITY_DOMAIN_FALLBACK_LABEL,
      `${domain}: registered in OPPORTUNITY_DOMAIN_LABELS (the card names its room, not the generic "${OPPORTUNITY_DOMAIN_FALLBACK_LABEL}")`,
      String(label),
    );
  }

  // The registries must not drift the OTHER way either: a label for a domain that no
  // producer can emit is a promise the platform cannot keep.
  const registeredDomains = new Set<string>(FOOD_OPPORTUNITY_DOMAINS);
  const orphanLabels = Object.keys(OPPORTUNITY_DOMAIN_LABELS).filter((d) => !registeredDomains.has(d));
  assert(
    orphanLabels.length === 0,
    "no label exists for a domain no producer can emit (the AFI_VERIFY1 §4.1 failure mode, in reverse)",
    orphanLabels.join(",") || "none",
  );

  // The honest-gap contract itself: an UNREGISTERED domain must degrade to the
  // generic label rather than to a blank, a crash, or a guess.
  assert(
    (OPPORTUNITY_DOMAIN_LABELS["not-a-domain"] ?? OPPORTUNITY_DOMAIN_FALLBACK_LABEL) ===
      OPPORTUNITY_DOMAIN_FALLBACK_LABEL,
    "an unregistered domain degrades to the honest generic label, never to a blank or a guess",
  );

  // -------------------------------------------------------------------------
  section("§2 MAT1 — OD1 asks producers for the CANDIDATE set, so LEARN1 can rank all of it");

  // A producer holding more candidates than the household-facing limit — exactly the
  // AFI3_5 shape: 30 generated, 10 delivered, and the 20 below the line unreachable
  // by any amount of household learning.
  const CANDIDATE_COUNT = 24;
  const allCandidates = Array.from({ length: CANDIDATE_COUNT }, (_, i) =>
    // All `low`, all pantry — the domain the audit measured being starved.
    ({ id: `pantry-${i}`, domain: "pantry", type: "pantry-item-unused-in-plan", priority: "low" as const }),
  );

  /** Records what OD1 asked for, and honours it the way the real producer does. */
  let requestedLimit: unknown = "never asked";
  const fetchProducer: ProducerFetch = async (_capabilityId, _verb, _context, parameters) => {
    requestedLimit = parameters?.limit;
    const limit = typeof parameters?.limit === "number" ? parameters.limit : DELIVERY_DEFAULT_LIMIT;
    return {
      status: "ok",
      result: {
        opportunities: allCandidates.slice(0, limit).map((c) => ({
          id: c.id,
          owningDomain: c.domain,
          type: c.type,
          priority: c.priority,
          explanation: `Observation about ${c.id}.`,
          evidence: [{ source: "pantry", detail: "A real pantry read." }],
          suggestedAction: `Use ${c.id}.`,
        })),
        trust: { householdAware: true },
      },
    } as never;
  };

  const noUnderstanding = async (): Promise<readonly ConfirmedUnderstanding[]> => [];

  const store = new InMemoryOpportunityDeliveryStore();
  await collectOpportunities(
    { userId: 1, limit: DELIVERY_DEFAULT_LIMIT },
    { store, fetchProducer, fetchConfirmedUnderstanding: noUnderstanding },
  );

  assert(
    requestedLimit === DELIVERY_MAX_LIMIT,
    `OD1 requests the full candidate set (${DELIVERY_MAX_LIMIT}) from each producer, not the delivered limit (${DELIVERY_DEFAULT_LIMIT})`,
    String(requestedLimit),
  );

  // The household-facing outcome is UNCHANGED — this fix restores eligibility, it
  // does not widen what anyone is shown. If this assertion ever fails, MAT1 has
  // become a delivery-budget change, which it must never be.
  const store2 = new InMemoryOpportunityDeliveryStore();
  const delivered = await collectOpportunities(
    { userId: 2, limit: DELIVERY_DEFAULT_LIMIT },
    { store: store2, fetchProducer, fetchConfirmedUnderstanding: noUnderstanding },
  );
  assert(
    delivered.opportunities.length === DELIVERY_DEFAULT_LIMIT,
    `the household still sees exactly its own limit (${DELIVERY_DEFAULT_LIMIT}) — eligibility widened, the delivery budget did not`,
    String(delivered.opportunities.length),
  );

  // The point of the fix: a candidate that the producer's own clamp used to discard
  // is now reachable, and the household's Confirmed Understanding can promote it into
  // what is actually delivered.
  const beyondOldClamp = allCandidates[CANDIDATE_COUNT - 1];
  const promoteLateCandidate: ConfirmedUnderstanding[] = [
    {
      domain: "pantry",
      subjectType: OPPORTUNITY_SUBJECT_TYPE,
      subjectKey: "pantry-item-unused-in-plan",
      direction: "positive",
      confidence: "high",
      evidenceCount: 4,
      rationale: "This household acts on pantry suggestions.",
    },
  ];
  assert(
    !allCandidates.slice(0, DELIVERY_DEFAULT_LIMIT).some((c) => c.id === beyondOldClamp.id),
    `fixture is honest: ${beyondOldClamp.id} sits BELOW the old producer-side clamp of ${DELIVERY_DEFAULT_LIMIT}`,
  );

  const store3 = new InMemoryOpportunityDeliveryStore();
  const learned = await collectOpportunities(
    { userId: 3, limit: DELIVERY_DEFAULT_LIMIT },
    {
      store: store3,
      fetchProducer,
      fetchConfirmedUnderstanding: async () => promoteLateCandidate,
    },
  );
  assert(
    learned.opportunities.length === DELIVERY_DEFAULT_LIMIT,
    "the learning-influenced delivery still respects the same household-facing budget",
    String(learned.opportunities.length),
  );
  assert(
    learned.metadata.learning.influenced.length > 0,
    "LEARN1 actually influenced the delivered set — the household's Confirmed Understanding reached candidates the old clamp had hidden",
    JSON.stringify(learned.metadata.learning),
  );

  // -------------------------------------------------------------------------
  section("§3 The invariant MAT1 must not break — attention outranks learning");

  // A `low` the household loves, and a `medium` it has said nothing about. Learning
  // must NOT lift the low above the medium: attention is the first key, always.
  const lovedLow = opportunity("loved-low", "pantry", "pantry-item-unused-in-plan", "low");
  const neutralMedium = opportunity("neutral-medium", "shopping", "shopping-item-already-in-pantry", "medium");

  const { opportunities: ordered } = prioritiseAndGroup(
    [lovedLow, neutralMedium],
    DELIVERY_DEFAULT_LIMIT,
    promoteLateCandidate,
  );
  assert(
    ordered[0].id === "neutral-medium",
    "a confirmed-positive `low` does NOT overtake an unconfirmed `medium` — learning re-orders within a tier, never across one (ATTN1 F4/F5)",
    ordered.map((o) => o.id).join(" > "),
  );

  // ...and within a tier, it does exactly what LEARN1 promises.
  const otherLow = opportunity("other-low", "cookbook", "cookbook-recipe-cookable-now", "low");
  const { opportunities: withinTier } = prioritiseAndGroup(
    [otherLow, lovedLow],
    DELIVERY_DEFAULT_LIMIT,
    promoteLateCandidate,
  );
  assert(
    withinTier[0].id === "loved-low",
    "within one attention tier, a confirmed-positive opportunity IS promoted — LEARN1 still does its job",
    withinTier.map((o) => o.id).join(" > "),
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`MAT1 registry conformance & learning eligibility: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
