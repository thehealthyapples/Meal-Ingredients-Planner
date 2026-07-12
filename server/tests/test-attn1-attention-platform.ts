/**
 * test-attn1-attention-platform.ts (ATTN1)
 * ==========================================
 * Verifies the canonical Attention Platform — the ONE Attention vocabulary
 * (shared/attention) that replaced the three module-local priority unions and
 * rank maps (FI4, OD1, Notice Engine), and the `critical` level: the additive
 * face of Rule T0 (never fail to surface an unsafe thing the household already
 * has).
 *
 * Coverage (the ATTN1 §7 Phase 3 verification list, plus the vocabulary and
 * the Phase 4 confidence boundary):
 *   §1  The vocabulary — one rank map, one total order, presentation labels,
 *       the closed CRITICAL_TYPES allowlist, the A2 structural assertion.
 *   §2  Attention ⊥ Confidence (invariant A5) — AttentionLevel and
 *       EvidenceConfidence share no values (asserted at compile time AND run
 *       time), and the evidence gate (`under-review` ⇒ non-renderable) exists
 *       upstream of any attention ordering.
 *   §3  FI4 — `shopping-restriction-conflict` is emitted `critical`;
 *       `prioritizeOpportunities` never drops a critical to its clamp.
 *   §4  OD1 pure core — a muted critical still surfaces (and muting still works
 *       below critical, invariant A4); the delivery clamp admits every
 *       critical; an ACKNOWLEDGED critical still outranks an UNSEEN high
 *       (closes finding F4); a confirmed-negative learning rank cannot sink a
 *       critical below the top of the list.
 *   §5  Notice Engine — a critical notice fills the MAX_NOTICES_PER_MOMENT
 *       budget first (closes finding F5); golden identity — an input with no
 *       critical orders exactly as it did before ATTN1.
 *   §6  End-to-end through collectOpportunities with the real in-memory store —
 *       muting cannot silence a critical; per-instance dismiss of a critical
 *       still suppresses THAT instance while a new item id re-surfaces
 *       (invariant A3's retained dismissal); a producer emitting `critical` for
 *       a non-allowlisted type honestly degrades and surfaces nothing.
 *
 * Run with: npx tsx server/tests/test-attn1-attention-platform.ts
 */

import {
  ATTENTION_RANK,
  ATTENTION_LABELS,
  CRITICAL_TYPES,
  isAttentionLevel,
  isCritical,
  assertCriticalAllowed,
  type AttentionLevel,
} from "../../shared/attention/index.js";
import {
  EVIDENCE_CONFIDENCE_LABELS,
  isRenderableConfidence,
  type EvidenceConfidence,
} from "../../shared/knowledge/evidence.js";
import {
  identifyShoppingRestrictionOpportunities,
  prioritizeOpportunities,
  type FoodOpportunity,
} from "../intelligence/food-intelligence/opportunity-engine.js";
import {
  filterMutedTypes,
  prioritiseAndGroup,
  collectOpportunities,
  resolveOpportunity,
  type DeliverableOpportunity,
  type ConfirmedUnderstandingFetch,
  type OpportunityOutcomeReporter,
} from "../intelligence/opportunity-delivery/framework.js";
import { InMemoryOpportunityDeliveryStore } from "../intelligence/opportunity-delivery/delivery-store.js";
import type { ConfirmedUnderstanding } from "../intelligence/evidence-learning/household-observation.js";
import {
  noticeOpportunities,
  applySilenceRules,
  MAX_NOTICES_PER_MOMENT,
  type Notice,
} from "../intelligence/conversation/notice-engine.js";
import type { RestrictionDefinition } from "../../shared/restrictions/restriction-types.js";
import type { IntentOutcome, IntentVerb, IntelligenceContext } from "../intelligence/types.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ---------------------------------------------------------------------------
// Invariant A5, compile-time half: the two vocabularies share no values. If a
// future edit ever makes them overlap, this line stops compiling.
// ---------------------------------------------------------------------------
const _attentionAndConfidenceAreDisjoint: Extract<AttentionLevel, EvidenceConfidence> extends never
  ? true
  : never = true;
void _attentionAndConfidenceAreDisjoint;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeDeliverable(overrides: Partial<DeliverableOpportunity> = {}): DeliverableOpportunity {
  return {
    id: "food-intelligence:planner-empty-day:1",
    capabilityId: "food-intelligence",
    domain: "planner",
    type: "planner-empty-day",
    priority: "medium",
    explanation: "test",
    evidence: [{ source: "planner-week", detail: "test" }],
    suggestedAction: "test",
    surface: "planner",
    ...overrides,
  };
}

const CRITICAL_OPPORTUNITY = makeDeliverable({
  id: "food-intelligence:shopping-restriction-conflict:7",
  domain: "shopping",
  type: "shopping-restriction-conflict",
  priority: "critical",
  surface: "shopping",
});

const TREE_NUT_DEF: RestrictionDefinition = {
  id: "tree_nut",
  displayName: "Tree Nut",
  tier: "major_allergen",
  aliases: ["walnuts", "walnut"],
  derivedIngredients: [],
  hiddenIngredients: [],
  substitutions: [],
  prohibitedPhrases: [],
};

async function main(): Promise<void> {
  section("§1 The canonical vocabulary — one rank map, one total order");
  assert(
    ATTENTION_RANK.critical < ATTENTION_RANK.high &&
      ATTENTION_RANK.high < ATTENTION_RANK.medium &&
      ATTENTION_RANK.medium < ATTENTION_RANK.low,
    "total order: critical < high < medium < low (lower sorts first)",
  );
  assert(
    Object.keys(ATTENTION_RANK).length === 4 && Object.keys(ATTENTION_LABELS).length === 4,
    "exactly four attention levels — Critical / Important / Helpful / Informational",
  );
  assert(
    ATTENTION_LABELS.critical === "Critical" &&
      ATTENTION_LABELS.high === "Important" &&
      ATTENTION_LABELS.medium === "Helpful" &&
      ATTENTION_LABELS.low === "Informational",
    "the four-name vocabulary lives at the presentation edge (ATTN1 Phase 5 value rename deferred)",
  );
  assert(
    CRITICAL_TYPES.size === 1 && CRITICAL_TYPES.has("shopping-restriction-conflict"),
    "CRITICAL_TYPES is the approved closed allowlist: exactly { shopping-restriction-conflict }",
  );
  assert(isAttentionLevel("critical") && isAttentionLevel("low"), "isAttentionLevel accepts the four members");
  assert(
    !isAttentionLevel("urgent") && !isAttentionLevel("") && !isAttentionLevel(undefined) && !isAttentionLevel(0),
    "isAttentionLevel rejects everything else — no invented level crosses a boundary",
  );
  assert(isCritical("critical") && !isCritical("high"), "isCritical is true for critical alone (invariant A4 — high is not 'slightly critical')");

  section("§1 Invariant A2 — critical is closed; the structural assertion throws");
  let threw = false;
  try {
    assertCriticalAllowed("planner-empty-day", "critical");
  } catch {
    threw = true;
  }
  assert(threw, "a non-allowlisted type emitting critical throws");
  assertCriticalAllowed("shopping-restriction-conflict", "critical");
  assertCriticalAllowed("planner-empty-day", "high");
  assertCriticalAllowed("some-future-type", "low");
  assert(true, "the allowlisted type at critical, and any type below critical, pass the assertion");

  section("§2 Invariant A5 — Attention ⊥ Confidence, in both directions");
  const attentionValues = Object.keys(ATTENTION_RANK);
  const confidenceValues = Object.keys(EVIDENCE_CONFIDENCE_LABELS);
  assert(
    attentionValues.every((v) => !confidenceValues.includes(v)),
    "AttentionLevel and EvidenceConfidence share no values (also enforced at compile time above)",
    `attention=[${attentionValues}] confidence=[${confidenceValues}]`,
  );
  assert(
    !isRenderableConfidence("under-review"),
    "the evidence gate precedes attention: an under-review claim renders at NO attention level — attention can never resurrect an ungated claim",
  );

  section("§3 FI4 — shopping-restriction-conflict is emitted critical (T0's additive face)");
  const conflicts = identifyShoppingRestrictionOpportunities(
    [{ id: 1, userId: 1, productName: "Walnuts", checked: false } as any],
    [TREE_NUT_DEF],
  );
  assert(conflicts.length === 1 && conflicts[0].priority === "critical", "an unchecked shopping item matching a hard restriction is critical", conflicts[0]?.priority);
  assert(conflicts[0].evidence.length > 0, "the critical still cites its evidence (Rule E1 unchanged — critical is not a licence to assert uncited)");

  section("§3 FI4 — prioritizeOpportunities never drops a critical to its clamp");
  const manyHigh: FoodOpportunity[] = Array.from({ length: 12 }, (_, i) => ({
    id: `planner-empty-day:${i}`,
    type: "planner-empty-day" as const,
    owningDomain: "planner" as const,
    priority: "high" as const,
    explanation: "x",
    evidence: [],
    suggestedAction: "x",
    // PHASE5E — every opportunity names the entity it is about. Inert for this test
    // (attention ordering never reads it), but required by the producer's type.
    subject: { entity: "planner-day" as const, id: i, label: "x" },
  }));
  const withCriticalLast = [...manyHigh, { ...conflicts[0] }];
  const clamped = prioritizeOpportunities(withCriticalLast, 10);
  assert(clamped[0].priority === "critical", "the critical arrives last yet sorts first");
  assert(
    clamped.filter((o) => o.priority === "critical").length === 1 && clamped.length === 11,
    "all criticals admitted; the limit applies to the remainder (10 high) — a cap can never silently drop a safety signal",
    String(clamped.length),
  );

  section("§4 OD1 — invariant A3: a muted critical still surfaces; muting still works below critical (A4)");
  const mutedBoth = filterMutedTypes(
    [CRITICAL_OPPORTUNITY, makeDeliverable({ id: "x", type: "planner-empty-day", priority: "high" })],
    ["shopping-restriction-conflict", "planner-empty-day"],
  );
  assert(
    mutedBoth.length === 1 && mutedBoth[0].priority === "critical",
    "a household may not blanket-silence a harm signal: the muted critical survives, the muted high is removed",
    mutedBoth.map((o) => o.id).join(","),
  );

  section("§4 OD1 — the delivery clamp admits every critical before applying limit");
  const tenHigh = Array.from({ length: 10 }, (_, i) =>
    makeDeliverable({ id: `food-intelligence:planner-empty-day:${i}`, priority: "high" }),
  );
  const clampedDelivery = prioritiseAndGroup([...tenHigh, CRITICAL_OPPORTUNITY], 10);
  assert(
    clampedDelivery.opportunities.length === 11 && clampedDelivery.opportunities[0].priority === "critical",
    "a critical surfaces even when 10+ high opportunities are also eligible (clamp exemption)",
    String(clampedDelivery.opportunities.length),
  );

  section("§4 OD1 — an ACKNOWLEDGED critical still outranks an UNSEEN high (closes F4)");
  const seen = new Set<string>([CRITICAL_OPPORTUNITY.id]);
  const f4 = prioritiseAndGroup(
    [makeDeliverable({ id: "food-intelligence:planner-empty-day:9", priority: "high" }), CRITICAL_OPPORTUNITY],
    10,
    [],
    seen,
  );
  assert(
    f4.opportunities[0].id === CRITICAL_OPPORTUNITY.id,
    "novelty can no longer bury an acknowledged safety signal within its former tier",
    f4.opportunities.map((o) => o.id).join(","),
  );

  section("§4 OD1 — a confirmed-negative learning rank cannot sink a critical (attention is the FIRST key)");
  const dislikeCriticalType: ConfirmedUnderstanding[] = [
    {
      subjectType: "opportunity",
      domain: "shopping",
      subjectKey: "shopping-restriction-conflict",
      direction: "negative",
      rationale: "test rationale",
    } as unknown as ConfirmedUnderstanding,
  ];
  const learned = prioritiseAndGroup(
    [makeDeliverable({ id: "food-intelligence:planner-empty-day:9", priority: "high" }), CRITICAL_OPPORTUNITY],
    10,
    dislikeCriticalType,
  );
  assert(
    learned.opportunities[0].id === CRITICAL_OPPORTUNITY.id,
    "learning re-weights within a tier only — it never moves a critical off the top",
    learned.opportunities.map((o) => o.id).join(","),
  );

  section("§5 Notice Engine — a critical fills the attention budget first (closes F5)");
  const criticalNotice = noticeOpportunities([
    {
      id: CRITICAL_OPPORTUNITY.id,
      domain: "shopping",
      priority: "critical",
      explanation: "conflict",
      suggestedAction: "review",
      evidence: [{ source: "household-eaters", detail: "active hard restriction" }],
    },
  ]);
  assert(criticalNotice.length === 1 && criticalNotice[0].priority === "critical", "the adapter copies critical verbatim — the Coach computes nothing (invariant A1)");
  const twoHighNotices: Notice[] = ["planner-gap", "pantry-opportunity"].map((category, i) => ({
    id: `opportunity:${i}`,
    category: category as Notice["category"],
    priority: "high" as const,
    source: "opportunity-delivery",
    fact: { kind: "opportunity" as const, explanation: "x", suggestedAction: "x", evidence: [{ source: "s", detail: "d" }] },
  }));
  const budget = applySilenceRules([...twoHighNotices, ...criticalNotice]);
  assert(
    budget.length === MAX_NOTICES_PER_MOMENT && budget[0].priority === "critical",
    "two high notices arriving first can no longer consume the whole budget ahead of a critical",
    budget.map((n) => n.priority).join(","),
  );

  section("§5 Golden identity — an input with no critical orders exactly as before ATTN1");
  const legacyMix = [
    makeDeliverable({ id: "a", domain: "pantry", priority: "low" }),
    makeDeliverable({ id: "b", domain: "shopping", priority: "high" }),
    makeDeliverable({ id: "c", domain: "planner", priority: "medium" }),
    makeDeliverable({ id: "d", domain: "shopping", priority: "high" }),
  ];
  assert(
    prioritiseAndGroup(legacyMix).opportunities.map((o) => o.id).join(",") === "b,d,c,a",
    "high → medium → low, stable within a tier — byte-identical to the pre-ATTN1 ordering",
  );
  assert(prioritiseAndGroup(legacyMix, 2).opportunities.length === 2, "with no critical present, the limit clamps exactly as before");
  const legacyNotices: Notice[] = [
    { ...twoHighNotices[0], id: "n1", priority: "low" },
    { ...twoHighNotices[1], id: "n2", priority: "medium" },
  ];
  assert(
    applySilenceRules(legacyNotices).map((n) => n.id).join(",") === "n2,n1",
    "silence rules order medium before low exactly as before",
  );

  // ---------------------------------------------------------------------------
  // §6 — End-to-end through collectOpportunities with the real in-memory store
  // ---------------------------------------------------------------------------

  const noUnderstanding: ConfirmedUnderstandingFetch = async () => [];
  const noReporter: OpportunityOutcomeReporter = async () => ({ recorded: true }) as any;

  function producerEmitting(opportunities: unknown[]): (
    capabilityId: string,
    verb: IntentVerb,
    context: IntelligenceContext,
  ) => Promise<IntentOutcome> {
    return async (capabilityId, verb) => ({
      status: "ok",
      capabilityId,
      verb,
      message: "ok",
      result: { opportunities },
    });
  }

  const restrictionConflict = (itemId: number) => ({
    id: `shopping-restriction-conflict:${itemId}`,
    type: "shopping-restriction-conflict",
    owningDomain: "shopping",
    priority: "critical",
    explanation: "Walnuts conflict with a stored household restriction.",
    evidence: [{ source: "household-eaters", detail: "active hard restriction: Tree Nut" }],
    suggestedAction: "Review Walnuts before buying.",
  });

  section("§6 collectOpportunities — a household that mutes the safety type still sees its critical");
  const store = new InMemoryOpportunityDeliveryStore();
  store.setMutedOpportunityTypes(1, ["shopping-restriction-conflict"]);
  const mutedBundle = await collectOpportunities(
    { userId: 1 },
    { store, fetchProducer: producerEmitting([restrictionConflict(1)]), fetchConfirmedUnderstanding: noUnderstanding },
  );
  assert(
    mutedBundle.opportunities.length === 1 && mutedBundle.opportunities[0].priority === "critical",
    "muting 'shopping-restriction-conflict' does not silence a hard-restriction conflict (live F3 state, now closed)",
    String(mutedBundle.opportunities.length),
  );

  section("§6 collectOpportunities — per-instance dismiss is retained; a NEW item id re-surfaces");
  const dismissed = await resolveOpportunity(
    1,
    "food-intelligence:shopping-restriction-conflict:1",
    "dismissed",
    store,
    noReporter,
  );
  assert(dismissed?.status === "dismissed", "a household that has genuinely resolved THIS conflict may dismiss THIS instance (informed, single-item act)");
  const afterDismiss = await collectOpportunities(
    { userId: 1 },
    { store, fetchProducer: producerEmitting([restrictionConflict(1)]), fetchConfirmedUnderstanding: noUnderstanding },
  );
  assert(afterDismiss.opportunities.length === 0, "the dismissed instance stays suppressed — dismissal is not overridden");
  const newConflict = await collectOpportunities(
    { userId: 1 },
    { store, fetchProducer: producerEmitting([restrictionConflict(2)]), fetchConfirmedUnderstanding: noUnderstanding },
  );
  assert(
    newConflict.opportunities.length === 1 && newConflict.opportunities[0].id.endsWith(":2"),
    "a recurrence on a NEW shopping item produces a new id and re-surfaces — dismissal never silences the future",
  );

  section("§6 collectOpportunities — a producer emitting critical for a non-allowlisted type degrades honestly");
  const inflated = await collectOpportunities(
    { userId: 2 },
    {
      store,
      fetchProducer: producerEmitting([
        { ...restrictionConflict(3), type: "planner-empty-day", owningDomain: "planner", id: "planner-empty-day:3" },
      ]),
      fetchConfirmedUnderstanding: noUnderstanding,
    },
  );
  assert(
    inflated.opportunities.length === 0 && !inflated.trust.resolved,
    "an inflated harm signal never surfaces — the violating producer's batch degrades to an honest empty bundle (invariant A2)",
    String(inflated.opportunities.length),
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`ATTN1 Attention Platform: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
