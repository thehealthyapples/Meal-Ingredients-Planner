/**
 * test-intelligence-evidence-learning-binding.ts (EL1)
 * ======================================================
 * Verifies the Evidence & Learning Platform — the canonical, cross-cutting
 * platform that captures structured household outcomes, accumulates them into
 * an append-only evidence log, and deterministically detects explainable
 * patterns over accumulated evidence, never from a single observation.
 * Registered as a NEW, twenty-first capability (`evidence-learning`) with four
 * verbs: `report` (capture), `search` (list signals), `approve` (confirm),
 * `delete` (decline).
 *
 * Coverage:
 *   §1  Pure reasoning core — no I/O, no database:
 *       groupEvents, bucketConfidence, detectPatterns. The non-negotiable:
 *       fewer than MIN_EVIDENCE_COUNT polarised events never produces a
 *       pattern; a non-majority direction never produces a pattern; rationale
 *       and supportingEventIds are exact and explainable.
 *   §2  I/O orchestration (recordOutcomeAndDetect / listHouseholdSignals /
 *       decideSignal) against a REAL InMemoryEvidenceLearningStore: evidence
 *       accumulates silently until the structural bar is cleared; a decided
 *       (confirmed/declined) signal is never reset to pending by further
 *       evidence, but its evidence fields keep refreshing; confirming/
 *       declining a signal belonging to a different household is an honest
 *       gap (null), never a cross-household leak.
 *   §3  Port → Handler → Binding contract, with a fake port: authentication
 *       requirement, honest gaps (missing report fields, missing signalId,
 *       unknown/foreign signal id), the platform's own strong-confirmation
 *       gate on approve/delete (TIP2 §5.1), report/search needing no
 *       confirmation.
 *   §4  Capability Registry — evidence-learning is the twenty-first live
 *       capability; executableIntents is exactly the four verbs above;
 *       confirmationFor matches the platform's deterministic per-verb rule.
 *
 * Run with: npx tsx server/tests/test-intelligence-evidence-learning-binding.ts
 */

import {
  groupEvents,
  bucketConfidence,
  detectPatterns,
  recordOutcomeAndDetect,
  listHouseholdSignals,
  decideSignal,
  MIN_EVIDENCE_COUNT,
  MIN_CONSISTENCY,
  type EvidenceEventInput,
  type RecordOutcomeRequest,
} from "../intelligence/evidence-learning/framework.js";
import { InMemoryEvidenceLearningStore } from "../intelligence/evidence-learning/evidence-learning-store.js";
import {
  IntelligencePlatform,
  CapabilityRegistry,
  createEvidenceLearningHandler,
  intelligencePlatform,
  EVIDENCE_LEARNING_CAPABILITY_ID,
  confirmationFor,
  type IntelligenceContext,
  type EvidenceLearningReadPort,
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
// §1 fixtures
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<EvidenceEventInput> = {}): EvidenceEventInput {
  return {
    id: 1,
    domain: "food-intelligence",
    subjectType: "meal",
    subjectKey: "italian pasta",
    direction: "positive",
    ...overrides,
  };
}

async function main(): Promise<void> {
  section("§1 groupEvents — dimensions with spaces in subjectKey never corrupt grouping");
  const grouped = groupEvents([
    makeEvent({ id: 1, subjectKey: "gluten free swap" }),
    makeEvent({ id: 2, subjectKey: "gluten free swap" }),
    makeEvent({ id: 3, subjectKey: "dairy free swap" }),
  ]);
  assert(grouped.size === 2, "two distinct dimensions grouped correctly despite spaces in subjectKey", String(grouped.size));
  const glutenGroup = Array.from(grouped.values()).find((g) => g.dimension.subjectKey === "gluten free swap");
  assert(glutenGroup?.events.length === 2, "both gluten-free-swap events landed in the same group");

  section("§1 bucketConfidence — deterministic thresholds");
  assert(bucketConfidence(2) === "low", "below MIN_EVIDENCE_COUNT still buckets low (detectPatterns gates this separately)");
  assert(bucketConfidence(3) === "low", "3 events → low");
  assert(bucketConfidence(4) === "low", "4 events → low");
  assert(bucketConfidence(5) === "medium", "5 events → medium");
  assert(bucketConfidence(7) === "medium", "7 events → medium");
  assert(bucketConfidence(8) === "high", "8 events → high");
  assert(bucketConfidence(100) === "high", "100 events → high");

  section("§1 detectPatterns — the non-negotiable: never from fewer than MIN_EVIDENCE_COUNT events");
  const twoEvents = [makeEvent({ id: 1 }), makeEvent({ id: 2 })];
  assert(MIN_EVIDENCE_COUNT === 3, "MIN_EVIDENCE_COUNT is 3 (sanity check on the constant this test relies on)");
  assert(detectPatterns(twoEvents).length === 0, "2 positive events (below MIN_EVIDENCE_COUNT) → no pattern, ever");

  section("§1 detectPatterns — 3 consistent events clears the bar");
  const threeConsistent = [makeEvent({ id: 1 }), makeEvent({ id: 2 }), makeEvent({ id: 3 })];
  const patterns = detectPatterns(threeConsistent);
  assert(patterns.length === 1, "3 consistent positive events → exactly one pattern", String(patterns.length));
  assert(patterns[0].direction === "positive", "direction is positive");
  assert(patterns[0].evidenceCount === 3, "evidenceCount is 3");
  assert(patterns[0].consistency === 1, "consistency is 1.0 (all three agreed)");
  assert(patterns[0].confidence === "low", "3 events → low confidence bucket");
  assert(patterns[0].supportingEventIds.length === 3 && patterns[0].supportingEventIds.includes(1), "supportingEventIds cites the actual contributing events");
  assert(/3 of 3/.test(patterns[0].rationale), "rationale is a plain, explainable sentence", patterns[0].rationale);

  section("§1 detectPatterns — no majority direction (below MIN_CONSISTENCY) → no pattern");
  assert(MIN_CONSISTENCY === 0.7, "MIN_CONSISTENCY is 0.7 (sanity check on the constant this test relies on)");
  const splitEvents = [
    makeEvent({ id: 1, direction: "positive" }),
    makeEvent({ id: 2, direction: "positive" }),
    makeEvent({ id: 3, direction: "negative" }),
    makeEvent({ id: 4, direction: "negative" }),
  ];
  assert(detectPatterns(splitEvents).length === 0, "50/50 split (below MIN_CONSISTENCY) → no pattern, even with 4 events");

  section("§1 detectPatterns — neutral events accumulate but never count towards direction");
  const withNeutrals = [
    makeEvent({ id: 1, direction: "positive" }),
    makeEvent({ id: 2, direction: "positive" }),
    makeEvent({ id: 3, direction: "positive" }),
    makeEvent({ id: 4, direction: "neutral" }),
    makeEvent({ id: 5, direction: "neutral" }),
  ];
  const neutralPatterns = detectPatterns(withNeutrals);
  assert(neutralPatterns.length === 1 && neutralPatterns[0].evidenceCount === 3, "neutral events are excluded from evidenceCount/consistency", String(neutralPatterns[0]?.evidenceCount));

  section("§1 detectPatterns — independent dimensions never cross-contaminate");
  const twoDimensions = [
    ...[1, 2, 3].map((id) => makeEvent({ id, subjectKey: "curry" })),
    ...[4, 5].map((id) => makeEvent({ id, subjectKey: "salad", direction: "negative" as const })),
  ];
  const multi = detectPatterns(twoDimensions);
  assert(multi.length === 1, "salad's 2 events stay below MIN_EVIDENCE_COUNT — only curry produces a pattern", String(multi.length));
  assert(multi[0].subjectKey === "curry", "the one pattern belongs to curry, not salad");

  // ---------------------------------------------------------------------------
  // §2 — I/O orchestration against a REAL InMemoryEvidenceLearningStore
  // ---------------------------------------------------------------------------

  section("§2 recordOutcomeAndDetect — evidence accumulates silently below the bar");
  const store = new InMemoryEvidenceLearningStore();
  const baseRequest: Omit<RecordOutcomeRequest, "subjectId"> = {
    householdId: 1,
    domain: "food-intelligence",
    subjectType: "meal",
    subjectKey: "italian pasta",
    outcomeType: "accepted",
    direction: "positive",
    sourceCapabilityId: "food-intelligence",
  };

  const r1 = await recordOutcomeAndDetect({ ...baseRequest, subjectId: "meal:1" }, store);
  assert(r1.signal === null, "1st positive event → still no signal (structural minimum not met)");
  const r2 = await recordOutcomeAndDetect({ ...baseRequest, subjectId: "meal:2" }, store);
  assert(r2.signal === null, "2nd positive event → still no signal");
  const r3 = await recordOutcomeAndDetect({ ...baseRequest, subjectId: "meal:3" }, store);
  assert(r3.signal !== null, "3rd positive event → signal now created (bar cleared)");
  assert(r3.signal?.status === "pending_confirmation", "a freshly detected signal starts pending_confirmation, never pre-approved");
  assert(r3.signal?.evidenceCount === 3, "evidenceCount reflects all 3 accumulated events");

  section("§2 recordOutcomeAndDetect — a 4th event refreshes the SAME signal row (upsert, not a duplicate)");
  const r4 = await recordOutcomeAndDetect({ ...baseRequest, subjectId: "meal:4" }, store);
  assert(r4.signal?.evidenceCount === 4, "evidenceCount refreshed to 4");
  const allSignalsAfterR4 = await listHouseholdSignals({ householdId: 1 }, store);
  assert(allSignalsAfterR4.length === 1, "still exactly one signal row for this dimension — refreshed in place, never duplicated", String(allSignalsAfterR4.length));

  section("§2 decideSignal — confirming a pending signal writes only status/confirmedBy/confirmedAt");
  const pendingSignal = allSignalsAfterR4[0];
  const confirmed = await decideSignal({ id: pendingSignal.id, decision: "confirmed", userId: 42 }, 1, store);
  assert(confirmed?.status === "confirmed", "signal is now confirmed");
  assert(confirmed?.confirmedByUserId === 42, "confirmedByUserId recorded");
  assert(confirmed?.evidenceCount === 4, "confirming never alters the evidence fields themselves");

  section("§2 decideSignal — a confirmed signal is never reset to pending by further evidence, but evidence keeps refreshing");
  const r5 = await recordOutcomeAndDetect({ ...baseRequest, subjectId: "meal:5" }, store);
  assert(r5.signal?.status === "confirmed", "status remains confirmed after a 5th supporting event — never silently relitigated");
  assert(r5.signal?.evidenceCount === 5, "evidenceCount still refreshes to 5 even though status is locked");

  section("§2 decideSignal — cross-household confirmation is an honest gap, never a leak");
  const wrongHousehold = await decideSignal({ id: pendingSignal.id, decision: "confirmed", userId: 99 }, 2, store);
  assert(wrongHousehold === null, "a household cannot confirm/decline another household's signal id");

  section("§2 decideSignal — declining a DIFFERENT dimension's signal never touches the first");
  const declineStore = new InMemoryEvidenceLearningStore();
  for (const id of [1, 2, 3]) {
    await recordOutcomeAndDetect(
      { ...baseRequest, subjectId: `meal:${id}`, subjectKey: "curry", outcomeType: "rejected", direction: "negative" },
      declineStore,
    );
  }
  const currySignals = await listHouseholdSignals({ householdId: 1 }, declineStore);
  assert(currySignals.length === 1 && currySignals[0].direction === "negative", "3 consistent rejections → one negative signal");
  const declined = await decideSignal({ id: currySignals[0].id, decision: "declined", userId: 7, notes: "we still like this" }, 1, declineStore);
  assert(declined?.status === "declined" && declined?.confirmationNotes === "we still like this", "decline records status + notes");

  // ---------------------------------------------------------------------------
  // §3 — Full Port → Handler → Binding contract via IntelligencePlatform.handle()
  // ---------------------------------------------------------------------------

  section("§3 Full binding contract — report/search/approve/delete via a fake port");

  const bindingCalls: string[] = [];
  function makeFakePort(): EvidenceLearningReadPort {
    return {
      getHouseholdForUser: async (userId) => {
        bindingCalls.push(`getHouseholdForUser(${userId})`);
        return userId;
      },
      recordOutcome: async (params) => {
        bindingCalls.push(`recordOutcome(${params.householdId},${params.subjectKey})`);
        return {
          event: { id: 1, ...params, context: params.context ?? null, recordedAt: new Date(), occurredAt: new Date() } as any,
          signal: null,
        };
      },
      listSignals: async (query) => {
        bindingCalls.push(`listSignals(${query.householdId})`);
        return query.householdId === 1
          ? [{ id: 11, householdId: 1, status: "pending_confirmation" } as any]
          : [];
      },
      decideSignal: async (input) => {
        bindingCalls.push(`decideSignal(${input.id},${input.decision})`);
        if (input.id === 999) return null;
        return { id: input.id, householdId: input.householdId, status: input.decision, confirmedByUserId: input.userId } as any;
      },
    };
  }

  function platformWithFakeEvidenceLearning(): IntelligencePlatform {
    const p = new IntelligencePlatform(new CapabilityRegistry());
    p.registerHandler(
      EVIDENCE_LEARNING_CAPABILITY_ID,
      createEvidenceLearningHandler(async () => makeFakePort()),
      ["report", "search", "approve", "delete"],
    );
    return p;
  }

  const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };
  const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
  const platform = platformWithFakeEvidenceLearning();

  section("§3 report — requires authentication");
  const anonReport = await platform.handle({ verb: "report", capabilityId: "evidence-learning", parameters: {} }, anon);
  assert(anonReport.status === "denied", "anonymous report → denied, never a fabricated capture", anonReport.status);

  section("§3 report — missing required fields is an honest gap");
  const missingFields = await platform.handle(
    { verb: "report", capabilityId: "evidence-learning", parameters: { domain: "food-intelligence" } },
    user1,
  );
  assert(missingFields.status === "gap", "incomplete report parameters → gap, never a partial/fabricated capture", missingFields.status);

  section("§3 report — ok, delegates to the port with the caller's resolved household");
  bindingCalls.length = 0;
  const okReport = await platform.handle(
    {
      verb: "report",
      capabilityId: "evidence-learning",
      parameters: {
        domain: "food-intelligence",
        subjectType: "meal",
        subjectId: "meal:1",
        subjectKey: "curry",
        outcomeType: "accepted",
        direction: "positive",
        sourceCapabilityId: "food-intelligence",
      },
    },
    user1,
  );
  assert(okReport.status === "ok", "report for an authenticated caller → ok", okReport.status);
  assert((okReport.result as any).source === "evidence-learning-framework", "result attributed to the framework");
  assert(bindingCalls.includes("recordOutcome(1,curry)"), "delegated with the caller's own resolved householdId");

  section("§3 search — no confirmation required (read-only verb)");
  const searchOutcome = await platform.handle({ verb: "search", capabilityId: "evidence-learning", parameters: {} }, user1);
  assert(searchOutcome.status === "ok", "search needs no confirmation and succeeds directly", searchOutcome.status);
  assert((searchOutcome.result as any).signals.length === 1, "signals surfaced from the port");

  section("§3 approve/delete — the platform's own strong-confirmation gate applies (TIP2 §5.1)");
  const unconfirmedApprove = await platform.handle(
    { verb: "approve", capabilityId: "evidence-learning", parameters: { signalId: 11 } },
    user1,
  );
  assert(
    unconfirmedApprove.status === "confirmation_required",
    "approve/delete are 'strong' confirmation verbs platform-wide — the handler is never reached without options.confirmed",
    unconfirmedApprove.status,
  );

  section("§3 approve — missing signalId is an honest gap");
  const missingSignalId = await platform.handle(
    { verb: "approve", capabilityId: "evidence-learning", parameters: {} },
    user1,
    { confirmed: true },
  );
  assert(missingSignalId.status === "gap", "missing signalId → gap, never a fabricated confirmation", missingSignalId.status);

  section("§3 approve — an unknown/foreign signal id is an honest gap");
  const unknownSignal = await platform.handle(
    { verb: "approve", capabilityId: "evidence-learning", parameters: { signalId: 999 } },
    user1,
    { confirmed: true },
  );
  assert(unknownSignal.status === "gap", "a signal id that does not resolve to this household → gap", unknownSignal.status);
  assert(/never|search/i.test(unknownSignal.message ?? ""), "gap message points the caller back to search");

  section("§3 approve/delete — ok, delegates the correct decision per verb");
  bindingCalls.length = 0;
  const approveOutcome = await platform.handle(
    { verb: "approve", capabilityId: "evidence-learning", parameters: { signalId: 11 } },
    user1,
    { confirmed: true },
  );
  assert(approveOutcome.status === "ok" && (approveOutcome.result as any).signal.status === "confirmed", "approve → confirmed");

  const deleteOutcome = await platform.handle(
    { verb: "delete", capabilityId: "evidence-learning", parameters: { signalId: 11 } },
    user1,
    { confirmed: true },
  );
  assert(deleteOutcome.status === "ok" && (deleteOutcome.result as any).signal.status === "declined", "delete → declined");
  assert(
    bindingCalls.join("|").includes("decideSignal(11,confirmed)") && bindingCalls.join("|").includes("decideSignal(11,declined)"),
    "each verb maps to its own distinct decision",
  );

  section("§3 Unsupported intent — verbs outside the allow-list are rejected");
  const explainIntent = await platform.handle({ verb: "explain", capabilityId: "evidence-learning", parameters: {} }, user1);
  assert(explainIntent.status === "unsupported_intent", "explain not in allow-list → unsupported_intent", explainIntent.status);

  // ---------------------------------------------------------------------------
  // §4 — Canonical singleton: capability registered, twenty-first live capability
  // ---------------------------------------------------------------------------

  section("§4 Capability lookup — evidence-learning is the twenty-first live capability");
  const capability = intelligencePlatform.getCapability(EVIDENCE_LEARNING_CAPABILITY_ID)!;
  assert(capability.availability === "available", "canonical singleton: evidence-learning is 'available' (handler bound)");
  assert(
    [...capability.executableIntents].sort().join(",") === ["approve", "delete", "report", "search"].sort().join(","),
    "executableIntents is exactly report/search/approve/delete — truthful registry (INT6A)",
    [...capability.executableIntents].sort().join(","),
  );

  section("§4 confirmationFor — matches the platform's own deterministic per-verb rule");
  assert(confirmationFor(capability, "report") === "none", "report needs no confirmation (read-only-verb class, additive capture)");
  assert(confirmationFor(capability, "search") === "none", "search needs no confirmation (read-only verb)");
  assert(confirmationFor(capability, "approve") === "strong", "approve is strong confirmation — the only door onto a household's confirmed pattern");
  assert(confirmationFor(capability, "delete") === "strong", "delete is strong confirmation");

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`EL1 Evidence & Learning Platform binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
