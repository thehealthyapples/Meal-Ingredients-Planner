/**
 * test-intelligence-opportunity-delivery-binding.ts (OD1)
 * =========================================================
 * Verifies the Opportunity Delivery Framework — the canonical, cross-cutting
 * governance layer over Domain Intelligence opportunity producers (today:
 * food-intelligence's `report` verb, FI4). Registered as a NEW, twentieth
 * capability (`opportunity-delivery`) with four verbs: `report` (collect/dedupe/
 * prioritise/group/deliver), `review` (acknowledge), `approve` (accept), `delete`
 * (dismiss).
 *
 * Coverage:
 *   §1  Pure reasoning core — no I/O, no database:
 *       selectSurface, filterMutedTypes, partitionForDelivery, prioritiseAndGroup.
 *       Determinism, cross-producer priority ordering, dedup rules (terminal
 *       states suppressed; open states never re-inserted), grouping by domain.
 *   §2  Port → Handler → Binding contract, with a fake producer fetch + a real
 *       InMemoryOpportunityDeliveryStore: `report`/`review`/`approve`/`delete` —
 *       authentication requirement, honest gaps (unresolvable opportunityId,
 *       missing opportunityId), duplicate-delivery prevention across two `report`
 *       calls, idempotent re-resolve of an already-terminal opportunity.
 *   §3  Capability Registry — opportunity-delivery is the twentieth live
 *       capability; executableIntents is exactly the four verbs above.
 *
 * Run with: npx tsx server/tests/test-intelligence-opportunity-delivery-binding.ts
 */

import {
  selectSurface,
  filterMutedTypes,
  partitionForDelivery,
  prioritiseAndGroup,
  collectOpportunities,
  resolveOpportunity,
  type DeliverableOpportunity,
  type ExistingDeliveryRecord,
  type OpportunityDeliveryBundle,
} from "../intelligence/opportunity-delivery/framework.js";
import { InMemoryOpportunityDeliveryStore } from "../intelligence/opportunity-delivery/delivery-store.js";
import {
  IntelligencePlatform,
  CapabilityRegistry,
  createOpportunityDeliveryHandler,
  intelligencePlatform,
  OPPORTUNITY_DELIVERY_CAPABILITY_ID,
  type IntelligenceContext,
  type IntentOutcome,
  type IntentVerb,
  type OpportunityDeliveryReadPort,
} from "../intelligence/index.js";

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
// §1 — Pure reasoning core fixtures
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

async function main(): Promise<void> {
  section("§1 selectSurface — deterministic domain → surface mapping, honest fallback");
  assert(selectSurface("planner") === "planner", "planner domain → planner surface");
  assert(selectSurface("pantry") === "pantry", "pantry domain → pantry surface");
  assert(selectSurface("shopping") === "shopping", "shopping domain → shopping surface");
  assert(selectSurface("some-future-domain") === "floating", "an unmapped domain falls back to the Companion's floating surface (honest gap, never a guess)");

  section("§1 filterMutedTypes — respects user preference, never fabricates a default");
  const typed = [
    makeOpportunity({ id: "a", type: "planner-empty-day" }),
    makeOpportunity({ id: "b", type: "pantry-item-unused-in-plan" }),
    makeOpportunity({ id: "c", type: "shopping-restriction-conflict" }),
  ];
  assert(filterMutedTypes(typed, []).length === 3, "no muted types → nothing filtered");
  const afterMute = filterMutedTypes(typed, ["pantry-item-unused-in-plan"]);
  assert(afterMute.length === 2 && afterMute.every((o) => o.type !== "pantry-item-unused-in-plan"), "a muted type is removed; others untouched");

  section("§1 partitionForDelivery — duplicate-delivery prevention rules");
  const candidates = [
    makeOpportunity({ id: "new-one" }), // no existing record
    makeOpportunity({ id: "already-delivered" }), // open, non-terminal
    makeOpportunity({ id: "already-dismissed" }), // terminal
    makeOpportunity({ id: "already-accepted" }), // terminal
  ];
  const existing = new Map<string, ExistingDeliveryRecord>([
    ["already-delivered", { status: "delivered" }],
    ["already-dismissed", { status: "dismissed" }],
    ["already-accepted", { status: "accepted" }],
  ]);
  const partition = partitionForDelivery(candidates, existing);
  assert(
    partition.deliverable.map((o) => o.id).sort().join(",") === "already-delivered,new-one",
    "terminal (dismissed/accepted) opportunities are suppressed entirely — never redelivered",
    partition.deliverable.map((o) => o.id).join(","),
  );
  assert(
    partition.toInsert.map((o) => o.id).join(",") === "new-one",
    "only the never-before-seen opportunity needs a first insert — an already-delivered one is never inserted twice",
    partition.toInsert.map((o) => o.id).join(","),
  );

  section("§1 prioritiseAndGroup — cross-producer ordering, grouping by domain, limit clamp");
  const mixed: DeliverableOpportunity[] = [
    makeOpportunity({ id: "a", domain: "pantry", priority: "low" }),
    makeOpportunity({ id: "b", domain: "shopping", priority: "high" }),
    makeOpportunity({ id: "c", domain: "planner", priority: "medium" }),
    makeOpportunity({ id: "d", domain: "shopping", priority: "high" }),
  ];
  const { opportunities: ordered, grouped } = prioritiseAndGroup(mixed);
  assert(
    ordered.map((o) => o.id).join(",") === "b,d,c,a",
    "high before medium before low; stable within a tier (across producers, not just within one)",
    ordered.map((o) => o.id).join(","),
  );
  assert(
    Object.keys(grouped).sort().join(",") === "pantry,planner,shopping",
    "grouped view partitions the delivered set by owning domain",
  );
  assert(grouped["shopping"].length === 2 && grouped["planner"].length === 1 && grouped["pantry"].length === 1, "each group contains exactly its own domain's opportunities");
  assert(prioritiseAndGroup(mixed, 2).opportunities.length === 2, "limit clamps the result count");
  assert(prioritiseAndGroup([]).opportunities.length === 0, "no opportunities in → no opportunities out, no groups");

  // ---------------------------------------------------------------------------
  // §2 — I/O orchestration (collectOpportunities / resolveOpportunity) against a
  // fake producer fetch + a REAL InMemoryOpportunityDeliveryStore
  // ---------------------------------------------------------------------------

  section("§2 collectOpportunities — honest empty bundle for an anonymous caller");
  const store = new InMemoryOpportunityDeliveryStore();
  const producerCalls: string[] = [];

  function fakeFoodIntelligenceOk(): IntentOutcome {
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
            evidence: [{ source: "planner-week", detail: "test" }],
            suggestedAction: "Add a meal to Wednesday.",
          },
          {
            id: "pantry-item-unused-in-plan:2",
            type: "pantry-item-unused-in-plan",
            owningDomain: "pantry",
            priority: "low",
            explanation: "Walnuts are in your pantry but unused.",
            evidence: [{ source: "pantry-items", detail: "test" }],
            suggestedAction: "Plan a meal that uses Walnuts.",
          },
        ],
        trust: { householdAware: true },
        source: "food-opportunity-engine",
      },
    };
  }

  async function fetchProducer(capabilityId: string, verb: IntentVerb, context: IntelligenceContext): Promise<IntentOutcome> {
    producerCalls.push(`${capabilityId}:${verb}:${context.userId}`);
    if (context.userId === "999") {
      return { status: "gap", capabilityId, verb, message: "no household" };
    }
    return fakeFoodIntelligenceOk();
  }

  const emptyBundle = await collectOpportunities({ userId: undefined }, { store, fetchProducer });
  assert(emptyBundle.opportunities.length === 0 && !emptyBundle.trust.resolved, "no userId → honest empty bundle, never fabricated");
  assert(producerCalls.length === 0, "an anonymous request never reaches a producer");

  section("§2 collectOpportunities — a producer honest gap degrades to zero opportunities, not an error");
  const gapBundle = await collectOpportunities({ userId: 999 }, { store, fetchProducer });
  assert(gapBundle.opportunities.length === 0 && !gapBundle.trust.resolved, "producer gap (no household) → empty, honest bundle");

  section("§2 collectOpportunities — ok: adapts, prioritises, groups and persists new opportunities");
  producerCalls.length = 0;
  const bundle1 = await collectOpportunities({ userId: 1 }, { store, fetchProducer });
  assert(bundle1.trust.resolved, "at least one producer resolved");
  assert(bundle1.opportunities.length === 2, "both producer opportunities delivered", String(bundle1.opportunities.length));
  assert(bundle1.opportunities[0].priority === "high", "high-priority opportunity ordered first");
  assert(bundle1.opportunities[0].id === "food-intelligence:planner-empty-day:1", "id is namespaced by producing capability");
  assert(bundle1.opportunities[0].surface === "planner", "surface selected from the opportunity's own domain");
  assert(Object.keys(bundle1.grouped).sort().join(",") === "pantry,planner", "grouped by domain");
  assert(producerCalls.includes("food-intelligence:report:1"), "delegated to the registered producer via the platform's own verb");

  section("§2 collectOpportunities — a second report never redelivers a duplicate row");
  const beforeSecondCall = await store.getRecords(1, ["food-intelligence:planner-empty-day:1", "food-intelligence:pantry-item-unused-in-plan:2"]);
  assert(beforeSecondCall.size === 2, "both opportunities were persisted after the first report");
  const bundle2 = await collectOpportunities({ userId: 1 }, { store, fetchProducer });
  assert(bundle2.opportunities.length === 2, "the same still-open opportunities are still delivered on a second report");
  const afterSecondCall = await store.getRecords(1, ["food-intelligence:planner-empty-day:1", "food-intelligence:pantry-item-unused-in-plan:2"]);
  assert(afterSecondCall.size === 2, "still exactly two delivery records — no duplicate row was inserted");

  section("§2 collectOpportunities — muted preference filters an opportunity out of delivery");
  store.setMutedOpportunityTypes(2, ["pantry-item-unused-in-plan"]);
  const bundle3 = await collectOpportunities({ userId: 2 }, { store, fetchProducer });
  assert(
    bundle3.opportunities.length === 1 && bundle3.opportunities[0].type === "planner-empty-day",
    "the muted type is excluded from delivery for this user",
    String(bundle3.opportunities.length),
  );

  section("§2 resolveOpportunity — honest gap when this user was never delivered the opportunity");
  const neverDelivered = await resolveOpportunity(1, "food-intelligence:does-not-exist:99", "dismissed", store);
  assert(neverDelivered === null, "resolving an opportunity id with no delivery record is an honest gap (null), never fabricated");

  section("§2 resolveOpportunity — dismiss suppresses the opportunity from all future reports");
  const dismissed = await resolveOpportunity(1, "food-intelligence:pantry-item-unused-in-plan:2", "dismissed", store);
  assert(dismissed?.status === "dismissed" && dismissed.resolvedAt !== null, "dismissed is terminal and stamps resolvedAt");
  const bundleAfterDismiss = await collectOpportunities({ userId: 1 }, { store, fetchProducer });
  assert(
    bundleAfterDismiss.opportunities.length === 1 && bundleAfterDismiss.opportunities[0].type === "planner-empty-day",
    "a dismissed opportunity never reappears in a future report",
  );

  section("§2 resolveOpportunity — idempotent: re-resolving an already-terminal opportunity is a no-op");
  const redismissed = await resolveOpportunity(1, "food-intelligence:pantry-item-unused-in-plan:2", "accepted", store);
  assert(
    redismissed?.status === "dismissed",
    "a second resolve call on an already-terminal opportunity returns its existing (unchanged) status, never transitions again",
    redismissed?.status,
  );

  section("§2 resolveOpportunity — acknowledge is non-terminal: opportunity remains deliverable");
  const acknowledged = await resolveOpportunity(1, "food-intelligence:planner-empty-day:1", "acknowledged", store);
  assert(acknowledged?.status === "acknowledged" && acknowledged.resolvedAt === null, "acknowledged has no resolvedAt (non-terminal)");
  const bundleAfterAck = await collectOpportunities({ userId: 1 }, { store, fetchProducer });
  assert(
    bundleAfterAck.opportunities.some((o) => o.id === "food-intelligence:planner-empty-day:1"),
    "an acknowledged (non-terminal) opportunity is still delivered on a future report",
  );

  // ---------------------------------------------------------------------------
  // §3 — Full Port → Handler → Binding contract via IntelligencePlatform.handle()
  // ---------------------------------------------------------------------------

  section("§3 Full binding contract — report/review/approve/delete via a fake port");

  const bindingCalls: string[] = [];
  function makeFakePort(): OpportunityDeliveryReadPort {
    return {
      collectOpportunities: async (request): Promise<OpportunityDeliveryBundle> => {
        bindingCalls.push(`collectOpportunities(${request.userId})`);
        if (request.userId === 999) {
          return { opportunities: [], grouped: {}, trust: { resolved: false }, metadata: { assembledAt: new Date().toISOString(), sources: [] } };
        }
        const opp = makeOpportunity({ id: "food-intelligence:planner-empty-day:1" });
        return {
          opportunities: [opp],
          grouped: { planner: [opp] },
          trust: { resolved: true },
          metadata: { assembledAt: new Date().toISOString(), sources: ["food-intelligence"] },
        };
      },
      resolveOpportunity: async (userId, opportunityId, status) => {
        bindingCalls.push(`resolveOpportunity(${userId},${opportunityId},${status})`);
        if (opportunityId === "unknown-id") return null;
        return { opportunityId, status, resolvedAt: status === "acknowledged" ? null : new Date().toISOString() };
      },
    };
  }

  function platformWithFakeOpportunityDelivery(): IntelligencePlatform {
    const p = new IntelligencePlatform(new CapabilityRegistry());
    p.registerHandler(
      OPPORTUNITY_DELIVERY_CAPABILITY_ID,
      createOpportunityDeliveryHandler(async () => makeFakePort()),
      ["report", "review", "approve", "delete"],
    );
    return p;
  }

  const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };
  const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };

  const platform = platformWithFakeOpportunityDelivery();

  section("§3 report — requires authentication");
  const anonReport = await platform.handle({ verb: "report", capabilityId: "opportunity-delivery", parameters: {} }, anon);
  assert(anonReport.status === "denied", "anonymous report → denied, never a fabricated bundle", anonReport.status);

  section("§3 report — ok, delegates to the port");
  bindingCalls.length = 0;
  const okReport = await platform.handle({ verb: "report", capabilityId: "opportunity-delivery", parameters: {} }, user1);
  assert(okReport.status === "ok", "report for an authenticated caller → ok", okReport.status);
  const reportResult = okReport.result as any;
  assert(reportResult.source === "opportunity-delivery-framework", "result attributed to the framework");
  assert(reportResult.opportunities.length === 1 && reportResult.grouped.planner.length === 1, "opportunities + grouped view surfaced from the port");
  assert(bindingCalls.includes("collectOpportunities(1)"), "delegated with the caller's own numeric userId");

  section("§3 review/approve/delete — the platform's own strong-confirmation gate applies (TIP2 §5.1)");
  const unconfirmedDelete = await platform.handle(
    { verb: "delete", capabilityId: "opportunity-delivery", parameters: { opportunityId: "food-intelligence:planner-empty-day:1" } },
    user1,
  );
  assert(
    unconfirmedDelete.status === "confirmation_required",
    "delete/review/approve are 'strong' confirmation verbs platform-wide — the handler is never reached without options.confirmed",
    unconfirmedDelete.status,
  );

  section("§3 review/approve/delete — missing opportunityId is an honest gap");
  const missingId = await platform.handle(
    { verb: "delete", capabilityId: "opportunity-delivery", parameters: {} },
    user1,
    { confirmed: true },
  );
  assert(missingId.status === "gap", "missing opportunityId → gap, never a fabricated dismissal", missingId.status);

  section("§3 review/approve/delete — an unknown opportunityId is an honest gap");
  const unknownId = await platform.handle(
    { verb: "approve", capabilityId: "opportunity-delivery", parameters: { opportunityId: "unknown-id" } },
    user1,
    { confirmed: true },
  );
  assert(unknownId.status === "gap", "an opportunityId never delivered to this user → gap", unknownId.status);
  assert(/never|report/i.test(unknownId.message ?? ""), "gap message points the caller back to report");

  section("§3 review/approve/delete — ok, delegates the correct target status per verb");
  bindingCalls.length = 0;
  const reviewOutcome = await platform.handle(
    { verb: "review", capabilityId: "opportunity-delivery", parameters: { opportunityId: "food-intelligence:planner-empty-day:1" } },
    user1,
    { confirmed: true },
  );
  assert(reviewOutcome.status === "ok" && (reviewOutcome.result as any).status === "acknowledged", "review → acknowledged");

  const approveOutcome = await platform.handle(
    { verb: "approve", capabilityId: "opportunity-delivery", parameters: { opportunityId: "food-intelligence:planner-empty-day:1" } },
    user1,
    { confirmed: true },
  );
  assert(approveOutcome.status === "ok" && (approveOutcome.result as any).status === "accepted", "approve → accepted");

  const deleteOutcome = await platform.handle(
    { verb: "delete", capabilityId: "opportunity-delivery", parameters: { opportunityId: "food-intelligence:planner-empty-day:1" } },
    user1,
    { confirmed: true },
  );
  assert(deleteOutcome.status === "ok" && (deleteOutcome.result as any).status === "dismissed", "delete → dismissed");
  assert(
    bindingCalls.join("|").includes("resolveOpportunity(1,food-intelligence:planner-empty-day:1,acknowledged)") &&
      bindingCalls.join("|").includes("resolveOpportunity(1,food-intelligence:planner-empty-day:1,accepted)") &&
      bindingCalls.join("|").includes("resolveOpportunity(1,food-intelligence:planner-empty-day:1,dismissed)"),
    "each verb maps to its own distinct target status",
  );

  section("§3 Unsupported intent — verbs outside the allow-list are rejected");
  const searchIntent = await platform.handle({ verb: "search", capabilityId: "opportunity-delivery", parameters: {} }, user1);
  assert(searchIntent.status === "unsupported_intent", "search not in allow-list → unsupported_intent", searchIntent.status);

  // ---------------------------------------------------------------------------
  // §4 — Canonical singleton: capability registered, twentieth live capability
  // ---------------------------------------------------------------------------

  section("§4 Capability lookup — opportunity-delivery is the twentieth live capability");
  assert(
    intelligencePlatform.getCapability(OPPORTUNITY_DELIVERY_CAPABILITY_ID)!.availability === "available",
    "canonical singleton: opportunity-delivery is 'available' (handler bound)",
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(live.length === 21, "exactly twenty-one live capabilities on the canonical singleton (EL1 adds evidence-learning)", String(live.length));
  const executable = intelligencePlatform.getCapability(OPPORTUNITY_DELIVERY_CAPABILITY_ID)!.executableIntents;
  assert(
    [...executable].sort().join(",") === ["approve", "delete", "report", "review"].sort().join(","),
    "executableIntents is exactly report/review/approve/delete — truthful registry (INT6A)",
    [...executable].sort().join(","),
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`OD1 Opportunity Delivery Framework binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
