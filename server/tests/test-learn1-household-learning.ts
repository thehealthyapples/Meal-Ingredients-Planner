/**
 * test-learn1-household-learning.ts (LEARN1)
 * ==========================================================================
 * Verifies Household Learning: the first real Evidence reporter and the first
 * real consumer of Confirmed Understanding, wired over the EL1 Evidence &
 * Learning Platform through Rule EL2's one door.
 *
 * Coverage:
 *   §1  The confirmation gate (ET5) and the explainability gate (ET6) —
 *       `toConfirmedUnderstanding` admits a confirmed, directional, self-explaining
 *       signal and rejects everything else, including a Pattern that merely cleared
 *       the statistical bar.
 *   §2  `learningRankFor` — pure dimension matching (domain × subjectType × subjectKey).
 *   §3  `prioritiseAndGroup` — re-weighting properties: no-op without Confirmed
 *       Understanding, within-tier reorder only, never crosses a priority tier,
 *       set/ids/count preserved.
 *   §4  `resolveOpportunity` as Evidence reporter — one event per GENUINE terminal
 *       transition, none for `acknowledged`, none for an idempotent re-resolve, and
 *       never a failure propagated into the user's own action.
 *   §5  `collectOpportunities` as Confirmed Understanding consumer — honest degrade
 *       to no influence, and an auditable record of what was influenced.
 *   §6  Rule EL2 enforcement — no module in this loop imports the evidence store or
 *       names its tables; every crossing goes through `intelligencePlatform.handle`.
 *       Plus: LEARN1 changed no EL1 threshold.
 *
 * Every assertion is database-free.
 *
 * Run with: npx tsx server/tests/test-learn1-household-learning.ts
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  prioritiseAndGroup,
  learningRankFor,
  collectOpportunities,
  resolveOpportunity,
  OPPORTUNITY_SUBJECT_TYPE,
  OPPORTUNITY_ACCEPTED_OUTCOME,
  OPPORTUNITY_DISMISSED_OUTCOME,
  type DeliverableOpportunity,
  type OpportunityOutcomeReporter,
  type ConfirmedUnderstandingFetch,
} from "../intelligence/opportunity-delivery/framework.js";
import { InMemoryOpportunityDeliveryStore } from "../intelligence/opportunity-delivery/delivery-store.js";
import {
  toConfirmedUnderstanding,
  type ConfirmedUnderstanding,
  type HouseholdObservationInput,
} from "../intelligence/evidence-learning/household-observation.js";
import { MIN_EVIDENCE_COUNT, MIN_CONSISTENCY, EVIDENCE_WINDOW_DAYS } from "../intelligence/evidence-learning/framework.js";
import type { IntelligenceContext, IntentOutcome, IntentVerb } from "../intelligence/types.js";

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
// Fixtures
// ---------------------------------------------------------------------------

function makeOpportunity(overrides: Partial<DeliverableOpportunity> = {}): DeliverableOpportunity {
  return {
    id: "food-intelligence:planner-empty-day:1",
    capabilityId: "food-intelligence",
    domain: "planner",
    type: "planner-empty-day",
    priority: "medium",
    explanation: "test",
    evidence: [],
    suggestedAction: "test",
    surface: "planner",
    ...overrides,
  };
}

function makeUnderstanding(overrides: Partial<ConfirmedUnderstanding> = {}): ConfirmedUnderstanding {
  return {
    domain: "planner",
    subjectType: OPPORTUNITY_SUBJECT_TYPE,
    subjectKey: "planner-empty-day",
    direction: "negative",
    confidence: "medium",
    evidenceCount: 5,
    rationale: "4 of 5 recent outcomes for opportunity \"planner-empty-day\" were negative (planner).",
    ...overrides,
  };
}

/** A raw `household_learning_signals` row, as `search` returns it. */
function makeSignalRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    householdId: 7,
    domain: "planner",
    subjectType: OPPORTUNITY_SUBJECT_TYPE,
    subjectKey: "planner-empty-day",
    direction: "negative",
    evidenceCount: 5,
    consistency: 0.8,
    confidence: "medium",
    supportingEventIds: [1, 2, 3, 4],
    rationale: "4 of 5 recent outcomes were negative.",
    status: "confirmed",
    ...overrides,
  };
}

function seed(store: InMemoryOpportunityDeliveryStore, userId: number, opp: DeliverableOpportunity): Promise<void> {
  return store.insertDelivered([
    {
      userId,
      opportunityId: opp.id,
      capabilityId: opp.capabilityId,
      domain: opp.domain,
      type: opp.type,
      priority: opp.priority,
      surface: opp.surface,
    },
  ]);
}

/** Three opportunities: two in the `high` tier (A then B), one `low` (C). */
function threeOpportunityProducer(): IntentOutcome {
  return {
    status: "ok",
    capabilityId: "food-intelligence",
    verb: "report",
    message: "ok",
    result: {
      opportunities: [
        {
          id: "planner-empty-day:1",
          type: "planner-empty-day",
          owningDomain: "planner",
          priority: "high",
          explanation: "Wednesday has no meals planned yet.",
          evidence: [],
          suggestedAction: "Add a meal to Wednesday.",
        },
        {
          id: "pantry-item-unused-in-plan:2",
          type: "pantry-item-unused-in-plan",
          owningDomain: "pantry",
          priority: "high",
          explanation: "Walnuts are in your pantry but unused.",
          evidence: [],
          suggestedAction: "Plan a meal that uses Walnuts.",
        },
        {
          id: "shopping-restriction-conflict:3",
          type: "shopping-restriction-conflict",
          owningDomain: "shopping",
          priority: "low",
          explanation: "An item conflicts with a restriction.",
          evidence: [],
          suggestedAction: "Review the item.",
        },
      ],
      trust: { householdAware: true },
      source: "food-opportunity-engine",
    },
  };
}

const A = "food-intelligence:planner-empty-day:1";
const B = "food-intelligence:pantry-item-unused-in-plan:2";
const C = "food-intelligence:shopping-restriction-conflict:3";

async function fetchProducer(_capabilityId: string, _verb: IntentVerb, _context: IntelligenceContext): Promise<IntentOutcome> {
  return threeOpportunityProducer();
}

function ids(opportunities: readonly DeliverableOpportunity[]): string {
  return opportunities.map((o) => o.id).join(",");
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // =========================================================================
  section("§1 toConfirmedUnderstanding — the confirmation gate (ET5) and the explainability gate (ET6)");

  assert(toConfirmedUnderstanding([makeSignalRow()]).length === 1, "a confirmed, directional, self-explaining signal is admitted");

  assert(
    toConfirmedUnderstanding([makeSignalRow({ status: "pending_confirmation" })]).length === 0,
    "ET5 — a Pattern that cleared the statistical bar but was never confirmed is NOT actionable",
  );
  assert(
    toConfirmedUnderstanding([makeSignalRow({ status: "declined" })]).length === 0,
    "a declined Pattern is never acted on",
  );
  assert(
    toConfirmedUnderstanding([makeSignalRow({ rationale: "" })]).length === 0,
    "ET6 — an understanding that cannot explain itself is not a weaker understanding; it is not one at all",
  );
  assert(
    toConfirmedUnderstanding([makeSignalRow({ rationale: "   " })]).length === 0,
    "a whitespace-only rationale is no rationale",
  );
  assert(
    toConfirmedUnderstanding([makeSignalRow({ direction: "neutral" })]).length === 0,
    "a neutral row cannot re-weight anything and is dropped, never coerced into a direction",
  );
  assert(
    toConfirmedUnderstanding([makeSignalRow({ confidence: "certain" })]).length === 0,
    "a confidence outside the deterministic low/medium/high buckets is rejected",
  );
  assert(
    toConfirmedUnderstanding([null, undefined, 42, "signal", makeSignalRow()]).length === 1,
    "malformed rows are skipped without throwing; the well-formed one survives",
  );

  const understood = toConfirmedUnderstanding([makeSignalRow()])[0];
  assert(
    understood.direction === "negative" && understood.confidence === "medium" && understood.evidenceCount === 5,
    "the narrowed shape carries direction, confidence and evidence count verbatim",
  );
  assert(understood.rationale.length > 0, "the rationale travels with every understanding (ET6)");

  // =========================================================================
  section("§2 learningRankFor — pure dimension matching");

  const planner = makeOpportunity({ domain: "planner", type: "planner-empty-day" });

  assert(learningRankFor(planner, []) === 0, "no Confirmed Understanding → rank 0 (the honest gap, and the common case)");
  assert(learningRankFor(planner, [makeUnderstanding({ direction: "negative" })]) === 1, "a confirmed negative demotes (+1)");
  assert(learningRankFor(planner, [makeUnderstanding({ direction: "positive" })]) === -1, "a confirmed positive promotes (-1)");
  assert(
    learningRankFor(planner, [makeUnderstanding({ domain: "pantry" })]) === 0,
    "same subjectKey in a different domain does not match — the dimension is (domain × subjectType × subjectKey)",
  );
  assert(
    learningRankFor(planner, [makeUnderstanding({ subjectKey: "some-other-type" })]) === 0,
    "a different opportunity type does not match",
  );
  assert(
    learningRankFor(planner, [makeUnderstanding({ subjectType: "meal" })]) === 0,
    "an understanding about a meal never re-weights an opportunity",
  );

  // =========================================================================
  section("§3 prioritiseAndGroup — re-weighting properties");

  const mixed: DeliverableOpportunity[] = [
    makeOpportunity({ id: "a", domain: "planner", type: "planner-empty-day", priority: "high" }),
    makeOpportunity({ id: "b", domain: "pantry", type: "pantry-item-unused-in-plan", priority: "high" }),
    makeOpportunity({ id: "c", domain: "shopping", type: "shopping-restriction-conflict", priority: "low" }),
  ];

  assert(
    ids(prioritiseAndGroup(mixed).opportunities) === "a,b,c",
    "no Confirmed Understanding → byte-for-byte the pre-LEARN1 ordering",
    ids(prioritiseAndGroup(mixed).opportunities),
  );
  assert(
    ids(prioritiseAndGroup(mixed, 10, []).opportunities) === "a,b,c",
    "an explicitly empty understanding list is also a no-op",
  );

  const demoteA = [makeUnderstanding({ domain: "planner", subjectKey: "planner-empty-day", direction: "negative" })];
  assert(
    ids(prioritiseAndGroup(mixed, 10, demoteA).opportunities) === "b,a,c",
    "a confirmed negative demotes within its own priority tier",
    ids(prioritiseAndGroup(mixed, 10, demoteA).opportunities),
  );

  const promoteB = [makeUnderstanding({ domain: "pantry", subjectKey: "pantry-item-unused-in-plan", direction: "positive" })];
  assert(
    ids(prioritiseAndGroup(mixed, 10, promoteB).opportunities) === "b,a,c",
    "a confirmed positive promotes within its own priority tier",
    ids(prioritiseAndGroup(mixed, 10, promoteB).opportunities),
  );

  // The safety property: learning re-orders advice, it never buries urgent advice.
  const demoted = prioritiseAndGroup(mixed, 10, demoteA).opportunities;
  assert(
    demoted.findIndex((o) => o.id === "a") < demoted.findIndex((o) => o.id === "c"),
    "a DEMOTED high-priority opportunity still outranks every low-priority one — learning never crosses a priority tier",
  );

  const bothWays = [
    makeUnderstanding({ domain: "planner", subjectKey: "planner-empty-day", direction: "negative" }),
    makeUnderstanding({ domain: "shopping", subjectKey: "shopping-restriction-conflict", direction: "positive" }),
  ];
  const crossTier = prioritiseAndGroup(mixed, 10, bothWays).opportunities;
  assert(
    crossTier[crossTier.length - 1].id === "c",
    "a PROMOTED low-priority opportunity still ranks below every high-priority one, even a demoted one",
    ids(crossTier),
  );

  const reweighted = prioritiseAndGroup(mixed, 10, demoteA).opportunities;
  assert(reweighted.length === mixed.length, "re-weighting preserves the count — nothing is dropped from the eligible set");
  assert(
    [...reweighted].map((o) => o.id).sort().join(",") === "a,b,c",
    "re-weighting preserves the exact id set — it reorders, it never authors or removes",
  );
  assert(
    reweighted.every((o) => mixed.find((m) => m.id === o.id)!.priority === o.priority),
    "re-weighting never rewrites a producer's own priority — that fact stays the producer's",
  );

  const twoNegatives = [
    makeUnderstanding({ domain: "planner", subjectKey: "planner-empty-day", direction: "negative" }),
    makeUnderstanding({ domain: "pantry", subjectKey: "pantry-item-unused-in-plan", direction: "negative" }),
  ];
  assert(
    ids(prioritiseAndGroup(mixed, 10, twoNegatives).opportunities) === "a,b,c",
    "two equally-demoted opportunities keep their stable arrival order relative to each other",
    ids(prioritiseAndGroup(mixed, 10, twoNegatives).opportunities),
  );

  // =========================================================================
  section("§4 resolveOpportunity — the Evidence reporter");

  function spyReporter(): { reported: HouseholdObservationInput[]; report: OpportunityOutcomeReporter } {
    const reported: HouseholdObservationInput[] = [];
    return {
      reported,
      report: async (input) => {
        reported.push(input);
        return { recorded: true };
      },
    };
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    const opp = makeOpportunity({ id: A, domain: "planner", type: "planner-empty-day", priority: "high" });
    await seed(store, 1, opp);
    const spy = spyReporter();

    const resolution = await resolveOpportunity(1, A, "accepted", store, spy.report);
    assert(resolution?.status === "accepted", "accepting an opportunity resolves it");
    assert(spy.reported.length === 1, "accepting reports exactly one Evidence event", String(spy.reported.length));

    const ev = spy.reported[0];
    assert(ev.direction === "positive", "an accepted opportunity is positive Evidence");
    assert(ev.outcomeType === OPPORTUNITY_ACCEPTED_OUTCOME, "outcomeType is opportunity_accepted");
    assert(ev.subjectType === OPPORTUNITY_SUBJECT_TYPE, "subjectType is opportunity");
    assert(ev.subjectKey === "planner-empty-day", "subjectKey is the opportunity TYPE — the grouping dimension a Pattern accumulates over");
    assert(ev.subjectId === A, "subjectId is the specific opportunity instance");
    assert(ev.domain === "planner", "domain is the opportunity's own owning domain");
    assert(ev.sourceCapabilityId === "opportunity-delivery", "sourceCapabilityId names the reporting capability");
    assert(ev.userId === 1, "the acting user is carried; the household is resolved server-side, never passed");
    assert(
      ev.context?.priority === "high" && ev.context?.surface === "planner" && ev.context?.opportunityCapabilityId === "food-intelligence",
      "context carries the delivery metadata verbatim for explainability",
    );
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    await seed(store, 1, makeOpportunity({ id: B, domain: "pantry", type: "pantry-item-unused-in-plan" }));
    const spy = spyReporter();
    await resolveOpportunity(1, B, "dismissed", store, spy.report);
    assert(spy.reported.length === 1 && spy.reported[0].direction === "negative", "a dismissed opportunity is negative Evidence");
    assert(spy.reported[0].outcomeType === OPPORTUNITY_DISMISSED_OUTCOME, "outcomeType is opportunity_dismissed");
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    await seed(store, 1, makeOpportunity({ id: A }));
    const spy = spyReporter();
    const ack = await resolveOpportunity(1, A, "acknowledged", store, spy.report);
    assert(ack?.status === "acknowledged", "acknowledging still resolves");
    assert(spy.reported.length === 0, "acknowledged reports NO Evidence — 'seen' is not an opinion");
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    await seed(store, 1, makeOpportunity({ id: A }));
    const spy = spyReporter();
    await resolveOpportunity(1, A, "dismissed", store, spy.report);
    await resolveOpportunity(1, A, "dismissed", store, spy.report);
    await resolveOpportunity(1, A, "dismissed", store, spy.report);
    assert(
      spy.reported.length === 1,
      "an idempotent re-dismiss reports NOTHING further — a client retry can never inflate a household's apparent consistency",
      String(spy.reported.length),
    );
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    await seed(store, 1, makeOpportunity({ id: A }));
    const spy = spyReporter();
    await resolveOpportunity(1, A, "accepted", store, spy.report);
    const afterDismiss = await resolveOpportunity(1, A, "dismissed", store, spy.report);
    assert(spy.reported.length === 1 && spy.reported[0].direction === "positive", "dismissing an already-accepted opportunity reports no second, contradicting Evidence");
    assert(afterDismiss?.status === "accepted", "and the terminal status is unchanged");
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    await seed(store, 1, makeOpportunity({ id: A }));
    const spy = spyReporter();
    const ackThenAccept = await resolveOpportunity(1, A, "acknowledged", store, spy.report);
    assert(ackThenAccept?.status === "acknowledged" && spy.reported.length === 0, "acknowledge first: still no Evidence");
    await resolveOpportunity(1, A, "accepted", store, spy.report);
    assert(spy.reported.length === 1, "then accepting it does report — a non-terminal record transitions normally");
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    const spy = spyReporter();
    const missing = await resolveOpportunity(1, "food-intelligence:never-delivered:9", "dismissed", store, spy.report);
    assert(missing === null, "resolving a never-delivered opportunity is an honest gap");
    assert(spy.reported.length === 0, "and reports no Evidence about something that never happened");
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    await seed(store, 1, makeOpportunity({ id: A }));
    const throwing: OpportunityOutcomeReporter = async () => {
      throw new Error("evidence store unreachable");
    };
    const resolution = await resolveOpportunity(1, A, "dismissed", store, throwing);
    assert(resolution?.status === "dismissed", "a throwing Evidence reporter never fails the user's own action");
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    await seed(store, 1, makeOpportunity({ id: A }));
    const refusing: OpportunityOutcomeReporter = async () => ({ recorded: false, reason: "no household" });
    const resolution = await resolveOpportunity(1, A, "accepted", store, refusing);
    assert(resolution?.status === "accepted", "an Evidence reporter that honestly declines never fails the user's own action");
  }

  // =========================================================================
  section("§5 collectOpportunities — the Confirmed Understanding consumer");

  {
    const store = new InMemoryOpportunityDeliveryStore();
    const none: ConfirmedUnderstandingFetch = async () => [];
    const bundle = await collectOpportunities({ userId: 1 }, { store, fetchProducer, fetchConfirmedUnderstanding: none });
    assert(ids(bundle.opportunities) === `${A},${B},${C}`, "nothing confirmed → the pre-LEARN1 ordering, unchanged", ids(bundle.opportunities));
    assert(bundle.metadata.learning.confirmedUnderstandingCount === 0, "and the audit trail says so honestly");
    assert(bundle.metadata.learning.influenced.length === 0, "nothing was influenced");
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    const demote: ConfirmedUnderstandingFetch = async () => [
      makeUnderstanding({ domain: "planner", subjectKey: "planner-empty-day", direction: "negative" }),
    ];
    const bundle = await collectOpportunities({ userId: 2 }, { store, fetchProducer, fetchConfirmedUnderstanding: demote });
    assert(ids(bundle.opportunities) === `${B},${A},${C}`, "a confirmed negative demotes the opportunity within its tier", ids(bundle.opportunities));
    assert(bundle.metadata.learning.confirmedUnderstandingCount === 1, "the bundle records how many understandings were consulted");
    assert(
      bundle.metadata.learning.influenced.join(",") === A,
      "and names exactly the opportunity whose rank moved — the influence is auditable, never invisible",
      bundle.metadata.learning.influenced.join(","),
    );
    assert(bundle.opportunities.length === 3, "the delivered set is unchanged in size");
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    const exploding: ConfirmedUnderstandingFetch = async () => {
      throw new Error("evidence store unreachable");
    };
    const bundle = await collectOpportunities({ userId: 3 }, { store, fetchProducer, fetchConfirmedUnderstanding: exploding });
    assert(ids(bundle.opportunities) === `${A},${B},${C}`, "an unreachable evidence store degrades honestly to no influence", ids(bundle.opportunities));
    assert(bundle.metadata.learning.confirmedUnderstandingCount === 0, "and never claims an understanding it could not read");
    assert(bundle.trust.resolved === true, "producer trust is unaffected by the learning read");
  }

  {
    const store = new InMemoryOpportunityDeliveryStore();
    const unrelated: ConfirmedUnderstandingFetch = async () => [makeUnderstanding({ subjectType: "meal", subjectKey: "risotto" })];
    const bundle = await collectOpportunities({ userId: 4 }, { store, fetchProducer, fetchConfirmedUnderstanding: unrelated });
    assert(ids(bundle.opportunities) === `${A},${B},${C}`, "an understanding about a different subject type influences nothing");
    assert(bundle.metadata.learning.influenced.length === 0, "and is honestly reported as having influenced nothing");
  }

  // =========================================================================
  section("§6 Rule EL2 — Evidence flows through one door, and LEARN1 moved no EL1 threshold");

  const here = path.dirname(fileURLToPath(import.meta.url));
  const read = (rel: string): string => readFileSync(path.resolve(here, rel), "utf8");

  /**
   * These assertions inspect CODE, not prose. Both modules discuss the evidence tables
   * in their headers in order to state that they never touch them, so a naive substring
   * search over the raw file would fail on the very comment that documents the rule.
   */
  const stripComments = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  const observationCode = stripComments(read("../intelligence/evidence-learning/household-observation.ts"));
  const opportunityCode = stripComments(read("../intelligence/opportunity-delivery/framework.ts"));

  const runtimeImportsStore = (src: string): boolean =>
    src.split("\n").some((line) => /^\s*import\s+(?!type)/.test(line) && line.includes("evidence-learning-store"));

  assert(!runtimeImportsStore(observationCode), "household-observation.ts never imports the evidence store at runtime (types only)");
  assert(!runtimeImportsStore(opportunityCode), "the opportunity framework never imports the evidence store");
  assert(
    !opportunityCode.includes("evidence-learning-store"),
    "the opportunity framework does not reference the evidence store at all — it is a domain, and Rule EL2 forbids a private path",
  );
  assert(
    !observationCode.includes("household_evidence_events") && !observationCode.includes("household_learning_signals"),
    "the one door's CODE names neither evidence table — the store alone owns them",
  );
  assert(
    !opportunityCode.includes("household_evidence_events") && !opportunityCode.includes("household_learning_signals"),
    "the reporting domain's CODE names neither evidence table",
  );
  assert(
    observationCode.includes("intelligencePlatform.handle"),
    "both directions of the one door travel the ordinary Intent Engine pipeline",
  );
  assert(
    (observationCode.match(/verb: "report"/g) ?? []).length === 1 && (observationCode.match(/verb: "search"/g) ?? []).length === 1,
    "exactly one `report` seam and one `search` seam exist",
  );

  assert(MIN_EVIDENCE_COUNT === 3, "ET1 — LEARN1 did not move MIN_EVIDENCE_COUNT", String(MIN_EVIDENCE_COUNT));
  assert(MIN_CONSISTENCY === 0.7, "ET2 — LEARN1 did not move MIN_CONSISTENCY", String(MIN_CONSISTENCY));
  assert(EVIDENCE_WINDOW_DAYS === 90, "ET3 — LEARN1 did not move EVIDENCE_WINDOW_DAYS", String(EVIDENCE_WINDOW_DAYS));

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`LEARN1 Household Learning: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
