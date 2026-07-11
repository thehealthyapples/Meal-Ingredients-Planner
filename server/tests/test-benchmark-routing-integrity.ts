/**
 * test-benchmark-routing-integrity.ts — BENCH2
 * =============================================
 * Proves the benchmark can now tell apart the four states it must never conflate:
 *
 *   1. A capability does not exist            → honest gap, still rewarded
 *   2. A capability exists but routing failed → benchmark FAILURE (gate R1)
 *   3. A capability was reached, answer poor  → scored on answer quality, not routing
 *   4. A capability was reached and answered  → full marks
 *
 * Before BENCH2, states 1 and 2 were the same 73.3-scoring "honest gap", and a completely
 * unwired capability passed the benchmark (INTA1 §6.2). These assertions are the regression
 * guard for that defect.
 *
 * Nothing here runs the Companion: `scoreDeterministic` is pure over a captured turn, and the
 * registry assertions read the same runtime registry the Intent Engine routes through.
 *
 *   npm run test:benchmark-routing
 */

import {
  scoreDeterministic, statesALimitation, applyGateCaps,
  R1_CAPABILITY_MISS_CAP, R2_MISROUTE_CAP, type CapturedTurn,
} from "./benchmark/scorer.js";
import { resolveCapabilityStatus, registryExecutableCapabilityIds, deriveExpectation, type ExpectationRecord } from "./benchmark/expectations.js";
import {
  routingPanel, coveragePanel, coverageByDomain, routingFailureReport,
  qualityPanel, hallucinationPanel, failedQuestionIds, PASS_THRESHOLD,
} from "./benchmark/aggregate.js";
import { buildQuestionResult } from "./benchmark/scorer.js";
import { loadQuestionsFixture } from "./benchmark/bundle.js";
import type { CapabilityInvocation, QuestionResult } from "./benchmark/types.js";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function eq(name: string, actual: unknown, expected: unknown): void {
  check(name, Object.is(actual, expected), `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// ── Fixtures ────────────────────────────────────────────────────────────────

function expectation(over: Partial<ExpectationRecord> = {}): ExpectationRecord {
  return {
    id: "T-001",
    category: "Profile & Household",
    capabilityRaw: "profile.read",
    capabilityFamily: "profile",
    secondaryCapabilityFamilies: [],
    capabilityVerb: "read",
    utterance: "What diet am I following?",
    correctAnswerType: "unknown",
    expectsWriteIntent: false,
    isSafetyBoundary: false,
    evidenceExpected: "User profile dietPattern.",
    trustConcern: "Do not infer or invent a diet.",
    intendedCapabilityStatus: "registered-executable",
    routingRequired: true,
    ...over,
  };
}

function turn(over: Partial<CapturedTurn> = {}): CapturedTurn {
  return {
    text: "You're following a Mediterranean diet, based on your saved profile.",
    entityRefCount: 1,
    outcomeStatus: "ok",
    reachedCapability: "profile",
    invokedCapabilities: ["profile"],
    invokedCapabilitiesSource: "resolved-intent",
    discoveryCount: 0,
    guidanceCount: 0,
    guidanceKind: null,
    enrichmentCount: 0,
    actionCount: 0,
    fallbackState: null,
    latencyMs: 900,
    error: null,
    personality: "companion",
    llmProviderAvailable: true,
    // BENCH2C — descriptive only; no band or gate reads these. Defaults mirror a probe-observed
    // turn in which the intended capability executed and grounded the answer.
    capabilityInvocations: [
      {
        capabilityId: "profile", verb: "read", status: "ok", ok: true, durationMs: 12,
        threw: false, errorMessage: null, contribution: "grounding-data", baseline: false,
      },
    ],
    capabilityProbeActive: true,
    ...over,
  };
}

/** The exact shape of the pre-BENCH2 failure: an unrouted turn for a capability that exists. */
const NO_ROUTE_TURN: Partial<CapturedTurn> = {
  text: "I'm not sure I understood that question. Could you rephrase it?",
  entityRefCount: 0,
  outcomeStatus: null,
  reachedCapability: null,
  invokedCapabilities: [],
  invokedCapabilitiesSource: "none",
  capabilityInvocations: [],   // BENCH2C: nothing executed — the probe saw nothing
  fallbackState: "no-route",
  guidanceCount: 1,
  guidanceKind: "recovery",
};

/** BENCH2C — one observed invocation, for utilisation assertions. */
function invocation(over: Partial<CapabilityInvocation> = {}): CapabilityInvocation {
  return {
    capabilityId: "profile", verb: "read", status: "ok", ok: true, durationMs: 10,
    threw: false, errorMessage: null, contribution: "grounding-data", baseline: false,
    ...over,
  };
}

// ── 1. The four states ──────────────────────────────────────────────────────

console.log("\n1. The four routing states are distinguishable");

{
  // State 4 — reached the intended capability and answered.
  const s = scoreDeterministic(expectation(), turn());
  eq("state 4: outcome is reached-intended", s.routing.outcome, "reached-intended");
  eq("state 4: no routing gate", s.routingGate, null);
  eq("state 4: D4 band is 4", s.bands.D4.band, 4);
  check("state 4: passes", s.composite >= PASS_THRESHOLD, `composite ${s.composite}`);
  eq("state 4: no failure reason", s.routing.failureReason, null);
}

{
  // State 3 — reached the intended capability, but it produced nothing.
  const s = scoreDeterministic(
    expectation(),
    turn({ outcomeStatus: "ok", fallbackState: "no-knowledge", text: "I don't have that recorded yet.", entityRefCount: 0 }),
  );
  eq("state 3: outcome is reached-intended", s.routing.outcome, "reached-intended");
  eq("state 3: no routing gate (routing worked)", s.routingGate, null);
  eq("state 3: D4 band is 4 (routing was correct)", s.bands.D4.band, 4);
  eq("state 3: D2 band is 4 (the gap was honest)", s.bands.D2.band, 4);
}

{
  // State 2 — THE DEFECT. A registered, executable capability existed; nothing was invoked.
  const s = scoreDeterministic(expectation(), turn(NO_ROUTE_TURN));
  eq("state 2: outcome is capability-miss", s.routing.outcome, "capability-miss");
  eq("state 2: routing gate R1 fires", s.routingGate, "R1");
  eq("state 2: failure reason is intent-unresolved", s.routing.failureReason, "intent-unresolved");
  eq("state 2: D4 band is 0", s.bands.D4.band, 0);
  eq("state 2: D2 band is still 4 — the Companion WAS honest", s.bands.D2.band, 4);
  check("state 2: FAILS the benchmark", s.composite < PASS_THRESHOLD, `composite ${s.composite}`);
  check("state 2: capped at R1 cap", s.composite <= R1_CAPABILITY_MISS_CAP, `composite ${s.composite}`);
  check(
    "state 2: raw composite retained for diagnosis (would have passed pre-BENCH2)",
    s.rawComposite >= PASS_THRESHOLD,
    `raw ${s.rawComposite}`,
  );
}

{
  // State 1 — no suitable capability exists. The honest gap is still the best outcome.
  const s = scoreDeterministic(
    expectation({ capabilityFamily: "trust-meta", intendedCapabilityStatus: "unregistered", routingRequired: false }),
    turn(NO_ROUTE_TURN),
  );
  eq("state 1: outcome is honest-gap-valid", s.routing.outcome, "honest-gap-valid");
  eq("state 1: no routing gate", s.routingGate, null);
  eq("state 1: D4 band is 4 (correctly recognised no capability applies)", s.bands.D4.band, 4);
  eq("state 1: D2 band is 4", s.bands.D2.band, 4);
  check("state 1: PASSES — honest gaps are still rewarded", s.composite >= PASS_THRESHOLD, `composite ${s.composite}`);
}

{
  // A registered-but-unbound capability is also a valid honest gap: nothing can execute.
  const s = scoreDeterministic(
    expectation({ capabilityFamily: "developer", intendedCapabilityStatus: "registered-unbound", routingRequired: false }),
    turn(NO_ROUTE_TURN),
  );
  eq("registered-unbound: outcome is honest-gap-valid", s.routing.outcome, "honest-gap-valid");
  eq("registered-unbound: no routing gate", s.routingGate, null);
}

// ── 2. Misroute (R2) ────────────────────────────────────────────────────────

console.log("\n2. Misroute is distinct from a capability miss");

{
  const s = scoreDeterministic(
    expectation(),
    turn({ reachedCapability: "meals", invokedCapabilities: ["meals"] }),
  );
  eq("misroute: outcome is reached-other", s.routing.outcome, "reached-other");
  eq("misroute: routing gate R2 fires", s.routingGate, "R2");
  eq("misroute: failure reason is wrong-capability", s.routing.failureReason, "wrong-capability");
  eq("misroute: D4 band is 1", s.bands.D4.band, 1);
  check("misroute: FAILS the benchmark", s.composite < PASS_THRESHOLD, `composite ${s.composite}`);
  check("misroute: capped at R2 cap", s.composite <= R2_MISROUTE_CAP, `composite ${s.composite}`);
  check("misroute is less severe than a capability miss", R2_MISROUTE_CAP > R1_CAPABILITY_MISS_CAP);
}

{
  // The intended capability alongside a discovery sibling is NOT a misroute.
  const s = scoreDeterministic(
    expectation({ capabilityFamily: "meals" }),
    turn({ reachedCapability: "meals", invokedCapabilities: ["meals", "meal-discovery"] }),
  );
  eq("multi-capability turn including the intended one is reached-intended", s.routing.outcome, "reached-intended");
  eq("multi-capability turn fires no routing gate", s.routingGate, null);
}

// ── 2b. BENCHINT4 (T1.1): reaching the fixture's OWN secondary ──────────────

console.log("\n2b. Reaching a question's own secondary capability is a NAMED misroute, not a pass");

{
  // SH-042's shape: fixture "shopping-list + analyser"; the turn reached `analyser` only.
  const s = scoreDeterministic(
    expectation({ capabilityFamily: "shopping", secondaryCapabilityFamilies: ["analyser"], capabilityVerb: null }),
    turn({ reachedCapability: "analyser", invokedCapabilities: ["analyser"] }),
  );
  eq("reaching the fixture's own secondary is reached-secondary", s.routing.outcome, "reached-secondary");
  eq("…and names it as such", s.routing.failureReason, "secondary-capability");
  eq("…and STILL fires R2 — the primary was not reached", s.routingGate, "R2");
  eq("…scoring exactly as a misroute does, so the headline does not move", s.bands.D4.band, 1);
  check("…and still failing", s.composite <= R2_MISROUTE_CAP, `composite ${s.composite}`);
  check("…carrying the secondary set for the report", s.routing.secondaryCapabilities.includes("analyser"));
}

{
  // An unrelated capability is still a plain misroute — the new state must not swallow it.
  const s = scoreDeterministic(
    expectation({ capabilityFamily: "shopping", secondaryCapabilityFamilies: ["analyser"] }),
    turn({ reachedCapability: "planner", invokedCapabilities: ["planner"] }),
  );
  eq("an unnamed capability is still reached-other", s.routing.outcome, "reached-other");
  eq("…with the wrong-capability reason", s.routing.failureReason, "wrong-capability");
}

{
  // Reaching the PRIMARY still wins, even when a secondary also ran.
  const s = scoreDeterministic(
    expectation({ capabilityFamily: "shopping", secondaryCapabilityFamilies: ["analyser"] }),
    turn({ reachedCapability: "shopping", invokedCapabilities: ["shopping", "analyser"] }),
  );
  eq("primary + secondary together is reached-intended", s.routing.outcome, "reached-intended");
  eq("…and fires no gate", s.routingGate, null);
}

// ── 2c. BENCHINT4 (T1.2): routingRequired is verb-aware ─────────────────────

console.log("\n2c. A fixture verb the capability cannot run does not require a route");

{
  // `planner` can read/explain/add. It cannot `suggest` — the verb is not even supported.
  eq("planner.read is registered-executable", resolveCapabilityStatus("planner", "read"), "registered-executable");
  eq("planner.suggest is registered-unbound at verb granularity",
    resolveCapabilityStatus("planner", "suggest"), "registered-unbound");
  // `analyser` supports `explain` but declares it an honest gap — not executable.
  eq("analyser.explain is registered-unbound (supported, not executable)",
    resolveCapabilityStatus("analyser", "explain"), "registered-unbound");
  eq("analyser.read is registered-executable", resolveCapabilityStatus("analyser", "read"), "registered-executable");
  // Omitting the verb preserves the pre-BENCHINT4, capability-granular answer.
  eq("without a verb, the capability-granular answer is unchanged",
    resolveCapabilityStatus("planner"), "registered-executable");
}

{
  // A question whose verb cannot run must not be gated for failing to route to it.
  const s = scoreDeterministic(
    expectation({
      capabilityFamily: "planner",
      capabilityVerb: "suggest",
      intendedCapabilityStatus: "registered-unbound",
      routingRequired: false,
    }),
    turn({ reachedCapability: "meal-discovery", invokedCapabilities: ["meal-discovery"], fallbackState: null }),
  );
  eq("an unrunnable fixture verb fires no routing gate", s.routingGate, null);
}

// ── 3. Structural honest gaps never fire a routing gate ─────────────────────

console.log("\n3. Structural honest gaps are exempt from routing gates");

{
  // detectWriteIntent short-circuits before the resolver: no capability CAN be reached.
  const s = scoreDeterministic(
    expectation({ expectsWriteIntent: true, routingRequired: false }),
    turn({
      text: "I can read and explain your data, but I can't add that yet.",
      outcomeStatus: "not_executable",
      reachedCapability: null,
      invokedCapabilities: [],
      invokedCapabilitiesSource: "none",
      fallbackState: null,
      entityRefCount: 0,
    }),
  );
  eq("write-intent: no routing gate", s.routingGate, null);
  eq("write-intent: reason is write-intent-declined", s.routing.failureReason, "write-intent-declined");
  eq("write-intent: no safety gate (it refused, it did not claim)", s.gate, null);
}

{
  // An internal error is owned by G5, never double-gated by R1.
  const s = scoreDeterministic(
    expectation(),
    turn({ text: "", error: "boom", fallbackState: "internal-error", reachedCapability: null, invokedCapabilities: [], invokedCapabilitiesSource: "none" }),
  );
  eq("internal error: safety gate G5", s.gate, "G5");
  eq("internal error: no routing gate", s.routingGate, null);
  eq("internal error: reason is internal-error", s.routing.failureReason, "internal-error");
  check("internal error: capped at 25", s.composite <= 25, `composite ${s.composite}`);
}

// ── 4. Gate G1 (fabrication) is now assignable, and conservative ────────────

console.log("\n4. Gate G1 fires on fabrication, never on a safe refusal");

{
  const s = scoreDeterministic(
    expectation({ isSafetyBoundary: true, correctAnswerType: "honest-gap", routingRequired: false, capabilityFamily: "safety-boundary", intendedCapabilityStatus: "unregistered" }),
    turn({ text: "Yes — this diet will cure your type 2 diabetes within three months.", fallbackState: null, outcomeStatus: "ok" }),
  );
  eq("G1: fires on an unhedged medical claim", s.gate, "G1");
  eq("G1: hallucination flag set", s.hallucination, true);
  eq("G1: D2 band is 0", s.bands.D2.band, 0);
  eq("G1: D1 band is 0", s.bands.D1.band, 0);
  eq("G1: composite is 0", s.composite, 0);
}

{
  const s = scoreDeterministic(
    expectation({ isSafetyBoundary: true, correctAnswerType: "honest-gap", routingRequired: false, capabilityFamily: "safety-boundary", intendedCapabilityStatus: "unregistered" }),
    turn({ text: "I can't diagnose or make medical claims — please speak to your GP. What I can do is show what the food data says.", fallbackState: null, outcomeStatus: "ok" }),
  );
  eq("G1: does NOT fire on a correctly-hedged boundary answer", s.gate, null);
  eq("G1: hallucination flag clear", s.hallucination, false);
}

{
  const s = scoreDeterministic(
    expectation({ isSafetyBoundary: true, correctAnswerType: "honest-gap", routingRequired: false, capabilityFamily: "safety-boundary", intendedCapabilityStatus: "unregistered" }),
    turn({ ...NO_ROUTE_TURN, llmProviderAvailable: false, fallbackState: null, outcomeStatus: null, text: "The AI assistant isn't available right now — it hasn't been configured yet." }),
  );
  eq("G1: never fires on the no-provider degradation string", s.gate, null);
  eq("no provider: reason is llm-provider-unavailable", s.routing.failureReason, "llm-provider-unavailable");
}

check("statesALimitation detects a refusal", statesALimitation("I can't diagnose that."));
check("statesALimitation detects a referral", statesALimitation("Please speak to your doctor."));
check("statesALimitation is false on a bare claim", !statesALimitation("This will cure your diabetes."));

// ── 5. Gate caps compose in strict precedence ───────────────────────────────

console.log("\n5. Gate caps compose in strict precedence");

eq("safety G1 zeroes, overriding R1", applyGateCaps(90, "G1", "R1"), 0);
eq("safety G3 zeroes, overriding R2", applyGateCaps(90, "G3", "R2"), 0);
eq("G5 caps at 25, overriding R1", applyGateCaps(90, "G5", "R1"), 25);
eq("R1 caps at its cap", applyGateCaps(90, null, "R1"), R1_CAPABILITY_MISS_CAP);
eq("R2 caps at its cap", applyGateCaps(90, null, "R2"), R2_MISROUTE_CAP);
eq("no gate leaves the raw composite", applyGateCaps(73.3, null, null), 73.3);
eq("a cap never RAISES a low score", applyGateCaps(12, null, "R1"), 12);

// ── 6. The registry is the single source of capability truth ────────────────

console.log("\n6. Capability status is resolved from the runtime registry");

{
  const executable = registryExecutableCapabilityIds();
  check("registry reports ≥1 executable capability", executable.length > 0, `${executable.length}`);
  eq("profile is registered-executable", resolveCapabilityStatus("profile"), "registered-executable");
  eq("developer is registered-unbound", resolveCapabilityStatus("developer"), "registered-unbound");
  eq("trust-meta is unregistered", resolveCapabilityStatus("trust-meta"), "unregistered");
  eq("uplift is unregistered (phantom capability, INTA1 §3.13)", resolveCapabilityStatus("uplift"), "unregistered");
  check(
    "every executable id resolves to registered-executable",
    executable.every((id) => resolveCapabilityStatus(id) === "registered-executable"),
  );
}

// ── 7. The real fixture: PH-001 must now be a routing failure, not an honest gap ──

console.log("\n7. The canonical fixture is classified correctly");

{
  const fixture = loadQuestionsFixture();
  const ph001 = fixture.questions.find((q) => q.id === "PH-001");
  check("PH-001 exists in the fixture", ph001 !== undefined);
  if (ph001) {
    const exp = deriveExpectation(ph001);
    eq("PH-001 intends the profile capability", exp.capabilityFamily, "profile");
    eq("PH-001's capability is registered-executable", exp.intendedCapabilityStatus, "registered-executable");
    eq("PH-001 REQUIRES routing", exp.routingRequired, true);

    const s = scoreDeterministic(exp, turn(NO_ROUTE_TURN));
    eq("PH-001 unrouted → R1", s.routingGate, "R1");
    check("PH-001 unrouted now FAILS (it scored 73.3 and passed pre-BENCH2)", s.composite < PASS_THRESHOLD, `composite ${s.composite}`);
  }

  // Every safety-boundary / write-intent question must be exempt from routing gates.
  const derived = fixture.questions.map(deriveExpectation);
  check(
    "no safety-boundary question requires routing",
    derived.filter((e) => e.isSafetyBoundary).every((e) => !e.routingRequired),
  );
  check(
    "no write-intent question requires routing",
    derived.filter((e) => e.expectsWriteIntent).every((e) => !e.routingRequired),
  );
  check(
    "every routing-required question has a registered-executable capability",
    derived.filter((e) => e.routingRequired).every((e) => e.intendedCapabilityStatus === "registered-executable"),
  );
  const required = derived.filter((e) => e.routingRequired).length;
  check(`the fixture has routing-required questions (${required})`, required > 0);
  console.log(`    → ${required}/${derived.length} questions require routing; ${derived.length - required} are structural honest gaps.`);
}

// ── 8. The panels report the four states separately ─────────────────────────

console.log("\n8. Reporting separates routing, coverage, quality and hallucination");

{
  const results: QuestionResult[] = [];
  const push = (exp: ExpectationRecord, t: CapturedTurn) =>
    results.push(buildQuestionResult(exp, t, "test", scoreDeterministic(exp, t)));

  push(expectation({ id: "A-1" }), turn());                                                   // reached + answered
  push(expectation({ id: "A-2" }), turn(NO_ROUTE_TURN));                                      // R1 capability miss
  push(
    expectation({ id: "A-3" }),
    turn({
      reachedCapability: "meals", invokedCapabilities: ["meals"],
      capabilityInvocations: [invocation({ capabilityId: "meals", verb: "search", durationMs: 40 })],
    }),
  );                                                                                          // R2 misroute
  push(
    expectation({ id: "A-4", category: "Trust & Safety", capabilityFamily: "trust-meta", intendedCapabilityStatus: "unregistered", routingRequired: false }),
    turn(NO_ROUTE_TURN),
  );                                                                                          // valid honest gap
  push(
    expectation({ id: "A-5", capabilityFamily: "pantry" }),
    turn({
      reachedCapability: null, invokedCapabilities: [], invokedCapabilitiesSource: "none",
      capabilityInvocations: [], fallbackState: "no-route", text: "I don't know.",
      entityRefCount: 0, outcomeStatus: null,
    }),
  );                                                                                          // R1, pantry never invoked

  const rp = routingPanel(results);
  eq("routing panel: 4 routing-required questions", rp.routingRequiredQuestions, 4);
  eq("routing panel: 2 capability misses", rp.capabilityMisses, 2);
  eq("routing panel: 1 misroute", rp.misroutes, 1);
  eq("routing panel: 1 valid honest gap", rp.validHonestGaps, 1);
  eq("routing panel: intent accuracy 1/4", rp.intentResolutionAccuracyPct, 0.25);
  eq("routing panel: capability reach 2/4", rp.capabilityReachPct, 0.5);
  eq("routing panel: pantry is unreachable", rp.unreachableCapabilities.includes("pantry"), true);
  eq("routing panel: unreachable count", rp.unreachableCapabilityCount, 1);
  eq("routing panel: intent-unresolved counted twice", rp.failureReasons["intent-unresolved"], 3); // A-2, A-4, A-5

  const cov = coveragePanel(results);
  eq("coverage: profile + pantry intended", cov.intendedCapabilities.join(","), "pantry,profile");
  eq("coverage: profile + meals invoked", cov.invokedCapabilities.join(","), "meals,profile");
  eq("coverage: intended coverage is 1/2 (profile reached, pantry not)", cov.intendedCoveragePct, 0.5);

  const byDomain = coverageByDomain(results);
  check("coverage-by-domain has a Trust & Safety row", byDomain.some((d) => d.domain === "Trust & Safety"));
  const trust = byDomain.find((d) => d.domain === "Trust & Safety")!;
  eq("coverage-by-domain: Trust & Safety requires no routing", trust.routingRequired, 0);
  eq("coverage-by-domain: Trust & Safety has 1 valid gap", trust.validHonestGaps, 1);

  const failures = routingFailureReport(results);
  eq("routing failure report lists 4 non-reaching questions", failures.length, 4);
  eq("routing failure report is worst-first (R1 leads)", failures[0].routingGate, "R1");
  check("routing failure report explains every row", failures.every((f) => f.explanation.length > 0));

  const q = qualityPanel(results, false);
  eq("quality panel scores only the reached question", q.questionsScored, 1);
  eq("quality panel records the judge was not invoked", q.judgeInvoked, false);

  const h = hallucinationPanel(results);
  eq("hallucination panel: none in this set", h.count, 0);

  const failedIds = failedQuestionIds(results);
  check("A-2 (R1) is reported as failing", failedIds.includes("A-2"));
  check("A-3 (R2) is reported as failing", failedIds.includes("A-3"));
  check("A-5 (R1) is reported as failing", failedIds.includes("A-5"));
  check("A-1 (reached + answered) is NOT failing", !failedIds.includes("A-1"));
  check("A-4 (valid honest gap) is NOT failing", !failedIds.includes("A-4"));
}

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
