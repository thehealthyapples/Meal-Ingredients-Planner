/**
 * test-benchmark-capability-utilisation.ts — BENCH2C
 * ===================================================
 * Proves the Capability Utilisation Dashboard reports what actually executed, and proves the
 * probe that observes it leaves the Intelligence Platform exactly as it found it.
 *
 * Two things are being guarded:
 *
 *  1. **The dashboard tells the truth.** Invocation counts, success/failure, execution time, and
 *     contribution to the final answer are attributed per capability; registered capabilities that
 *     never ran are named; questions that bypassed every registered capability are separated into
 *     `defect` (a capability existed and nothing ran) and `structural` (the platform was correct
 *     not to route). An unobserved run reports "not measured", never "nothing ran".
 *
 *  2. **The probe is a pass-through.** It wraps `intelligencePlatform.handle`, records, returns the
 *     outcome unchanged, re-throws unchanged, ignores every user but its own, and restores the
 *     singleton on dispose. A benchmark that changed the platform it measures would be worthless.
 *
 *   npm run test:benchmark-utilisation
 */

import { intelligencePlatform } from "../intelligence/intelligence-platform.js";
import { scoreDeterministic, buildQuestionResult, type CapturedTurn } from "./benchmark/scorer.js";
import { capabilityUtilisationPanel } from "./benchmark/aggregate.js";
import { installCapabilityProbe, isCapabilityProbeInstalled } from "./benchmark/capability-probe.js";
import type { ExpectationRecord } from "./benchmark/expectations.js";
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

function invocation(over: Partial<CapabilityInvocation> = {}): CapabilityInvocation {
  return {
    capabilityId: "profile", verb: "read", status: "ok", ok: true, durationMs: 10,
    threw: false, errorMessage: null, contribution: "grounding-data", baseline: false,
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
    capabilityInvocations: [invocation()],
    capabilityProbeActive: true,
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
    ...over,
  };
}

const NO_ROUTE_TURN: Partial<CapturedTurn> = {
  text: "I'm not sure I understood that question.",
  entityRefCount: 0,
  outcomeStatus: null,
  reachedCapability: null,
  invokedCapabilities: [],
  invokedCapabilitiesSource: "none",
  capabilityInvocations: [],
  fallbackState: "no-route",
};

// ── 1. The dashboard attributes what actually ran ───────────────────────────

console.log("\n1. Capability utilisation is recorded, attributed and honest");

{
  const results: QuestionResult[] = [];
  const push = (exp: ExpectationRecord, t: CapturedTurn) =>
    results.push(buildQuestionResult(exp, t, "test", scoreDeterministic(exp, t)));

  // U-1: profile ran twice (once routed + grounding, once as a baseline context-only read); meals
  //      ran once and returned an EMPTY search — reached and successful, but grounded nothing.
  push(
    expectation({ id: "U-1" }),
    turn({
      capabilityInvocations: [
        invocation({ capabilityId: "profile", durationMs: 10, contribution: "grounding-data" }),
        invocation({ capabilityId: "profile", durationMs: 30, contribution: "context-only", baseline: true }),
        invocation({ capabilityId: "meals", verb: "search", durationMs: 50, contribution: "empty-result" }),
      ],
    }),
  );
  // U-2: pantry threw.
  push(
    expectation({ id: "U-2", capabilityFamily: "pantry" }),
    turn({
      reachedCapability: "pantry", invokedCapabilities: ["pantry"],
      capabilityInvocations: [
        invocation({
          capabilityId: "pantry", verb: "read", status: "threw", ok: false, threw: true,
          errorMessage: "boom", durationMs: 5, contribution: "error",
        }),
      ],
    }),
  );
  // U-3: a STRUCTURAL bypass — a write-intent refusal invoked nothing, correctly.
  push(
    expectation({ id: "U-3", expectsWriteIntent: true, routingRequired: false }),
    turn({
      text: "I can't add that yet.", outcomeStatus: "not_executable", reachedCapability: null,
      invokedCapabilities: [], invokedCapabilitiesSource: "none", capabilityInvocations: [],
      fallbackState: null, entityRefCount: 0,
    }),
  );
  // U-4: a DEFECT bypass — a registered, executable capability existed and nothing ran.
  push(expectation({ id: "U-4" }), turn(NO_ROUTE_TURN));

  const u = capabilityUtilisationPanel(results, 10_000, true);

  eq("probe recorded as active", u.probeActive, true);
  eq("4 invocations across the run", u.totalInvocations, 4);
  eq("total capability execution time", u.totalCapabilityTimeMs, 10 + 30 + 50 + 5);
  eq("capability time share of a 10s run", u.capabilityTimeShareOfRun, 0.01);
  eq("busiest capability sorts first", u.exercised[0].capabilityId, "profile");

  const profile = u.exercised.find((r) => r.capabilityId === "profile")!;
  eq("profile: 2 invocations", profile.invocations, 2);
  eq("profile: 1 distinct question", profile.questions, 1);
  eq("profile: both succeeded", profile.succeeded, 2);
  eq("profile: only 1 contributed to the answer", profile.contributedToAnswer, 1);
  eq("profile: 1 baseline context-only read", profile.baselineInvocations, 1);
  eq("profile: mean duration", profile.meanDurationMs, 20);
  eq("profile: max duration", profile.maxDurationMs, 30);
  eq("profile: total duration", profile.totalDurationMs, 40);
  eq("profile: executable per the registry", profile.executable, true);
  check("profile: display name comes from the registry", profile.displayName !== "profile", profile.displayName);

  const meals = u.exercised.find((r) => r.capabilityId === "meals")!;
  eq("meals: an ok-but-empty search counts as succeeded", meals.succeeded, 1);
  eq("meals: an ok-but-empty search contributed nothing", meals.contributedToAnswer, 0);
  eq("meals: contribution rate is 0", meals.contributionRate, 0);
  eq("meals: verb recorded", meals.verbs.join(","), "search");

  const pantry = u.exercised.find((r) => r.capabilityId === "pantry")!;
  eq("pantry: a throw is a failure", pantry.failed, 1);
  eq("pantry: a throw is counted separately", pantry.threw, 1);
  eq("pantry: success rate 0", pantry.successRate, 0);
  eq("pantry: status histogram records the throw", pantry.statuses["threw"], 1);
}

// ── 2. Never-exercised and bypassed questions ───────────────────────────────

console.log("\n2. Never-exercised capabilities and bypassing questions are highlighted");

{
  const results: QuestionResult[] = [];
  const push = (exp: ExpectationRecord, t: CapturedTurn) =>
    results.push(buildQuestionResult(exp, t, "test", scoreDeterministic(exp, t)));

  push(expectation({ id: "U-1" }), turn());
  push(
    expectation({ id: "U-3", expectsWriteIntent: true, routingRequired: false }),
    turn({
      text: "I can't add that yet.", outcomeStatus: "not_executable", reachedCapability: null,
      invokedCapabilities: [], invokedCapabilitiesSource: "none", capabilityInvocations: [],
      fallbackState: null, entityRefCount: 0,
    }),
  );
  push(expectation({ id: "U-4" }), turn(NO_ROUTE_TURN));

  const u = capabilityUtilisationPanel(results, 5_000, true);

  check("never-exercised excludes the capability that ran", !u.neverExercised.includes("profile"));
  check("never-exercised names real executable capabilities", u.neverExercisedCount > 0, `${u.neverExercisedCount}`);
  check("never-exercised contains meals (registered, executable, unused here)", u.neverExercised.includes("meals"));
  check("registered-but-unbound is listed separately", u.registeredUnbound.includes("developer"));
  check(
    "registered-but-unbound NEVER appears in never-exercised (unexercisable by design, not a defect)",
    !u.neverExercised.some((c) => u.registeredUnbound.includes(c)),
  );
  eq("utilisation % is exercised / executable", u.utilisationPct > 0 && u.utilisationPct < 1, true);

  eq("2 questions invoked no capability", u.bypassedQuestions.length, 2);
  eq("1 is a defect", u.bypassedDefect, 1);
  eq("1 is structural", u.bypassedStructural, 1);
  eq("defects sort first", u.bypassedQuestions[0].kind, "defect");
  eq("the defect is the R1 question", u.bypassedQuestions[0].id, "U-4");
  eq("the defect carries its BENCH2 routing gate", u.bypassedQuestions[0].routingGate, "R1");
  eq("the structural bypass is the write-intent refusal", u.bypassedQuestions[1].id, "U-3");
  eq("the structural bypass has no routing gate", u.bypassedQuestions[1].routingGate, null);
  eq("the structural bypass names why", u.bypassedQuestions[1].failureReason, "write-intent-declined");

  // A run nobody observed must never be reported as a run in which nothing ran.
  const unobserved = capabilityUtilisationPanel(results, 5_000, false);
  eq("no probe: probeActive false", unobserved.probeActive, false);
  eq("no probe: never-exercised is EMPTY, not 'all of them'", unobserved.neverExercisedCount, 0);
  eq("no probe: no question is reported as bypassing", unobserved.bypassedQuestions.length, 0);
  eq("no probe: no invocations claimed", unobserved.totalInvocations, 0);
  check("no probe: unbound capabilities are still nameable", unobserved.registeredUnbound.length > 0);
}

// ── 3. The probe is a pass-through and restores the platform ────────────────

console.log("\n3. The capability probe observes without changing anything");

{
  const platform = intelligencePlatform as unknown as Record<string, unknown>;
  const originalHandle = platform.handle;

  check("no probe installed initially", !isCapabilityProbeInstalled());

  const p1 = installCapabilityProbe("42");
  eq("a probe installs for an acting user id", p1.active, true);
  check("platform.handle is now wrapped", isCapabilityProbeInstalled());
  check("platform.handle is a different function while wrapped", platform.handle !== originalHandle);

  const dup = installCapabilityProbe("42");
  eq("a second probe for the SAME user is refused", dup.active, false);
  eq("a refused probe drains empty", dup.drain().length, 0);

  const anon = installCapabilityProbe(undefined);
  eq("a probe with no acting user is refused", anon.active, false);

  const p2 = installCapabilityProbe("99");
  eq("a probe for a DIFFERENT user is granted", p2.active, true);

  p2.dispose();
  check("still wrapped while one probe remains", isCapabilityProbeInstalled());
  p1.dispose();
  check("unwrapped once the last probe disposes", !isCapabilityProbeInstalled());
  eq("platform.handle is restored to the original function", platform.handle, originalHandle);

  p1.dispose();
  check("dispose is idempotent", !isCapabilityProbeInstalled());
  eq("platform.handle still original after a redundant dispose", platform.handle, originalHandle);
}

// ── 4. The probe records real invocations, scoped to its own user ───────────

console.log("\n4. The probe records the acting user's invocations, and nobody else's");

// Wrapped rather than top-level `await`: this repo's tsx/esbuild pipeline emits CJS for
// standalone test scripts, where top-level await is a transform error.
async function probeRecordingChecks(): Promise<void> {
  const probe = installCapabilityProbe("7");
  const handle = intelligencePlatform.handle.bind(intelligencePlatform);

  // `developer` is registered, unbound, and permission-restricted. The engine's PERMISSION step
  // runs BEFORE INVOKE, so it returns a structured `denied` — never reaching a handler or a
  // database. A perfect, side-effect-free probe subject, and a check that the wrapper does not
  // reorder or bypass any engine step: whatever the platform decides, the probe returns verbatim.
  const mine = await handle({ verb: "read", capabilityId: "developer", parameters: {} } as never, {
    role: "admin", userId: "7",
  } as never);
  eq("the outcome is returned unchanged by the wrapper", mine.status, "denied");
  check("the wrapper did not fabricate a success", mine.status !== "ok");

  // A different user's turn must pass through completely unobserved.
  await handle({ verb: "read", capabilityId: "developer", parameters: {} } as never, {
    role: "admin", userId: "8",
  } as never);

  const records = probe.drain();
  eq("exactly one invocation was recorded", records.length, 1);
  eq("the recorded capability is correct", records[0].capabilityId, "developer");
  eq("the recorded verb is correct", records[0].verb, "read");
  eq("the recorded status is the platform's own", records[0].status, "denied");
  eq("a non-ok outcome is not counted as ok", records[0].ok, false);
  eq("it did not throw", records[0].threw, false);
  check("a duration was measured", records[0].durationMs >= 0);
  eq("draining twice yields nothing the second time", probe.drain().length, 0);

  // An unknown capability id produces `unknown_capability` — still structured, still recorded.
  await handle({ verb: "read", capabilityId: "no-such-capability", parameters: {} } as never, {
    role: "admin", userId: "7",
  } as never);
  const unknown = probe.drain();
  eq("an unknown capability is recorded", unknown.length, 1);
  eq("with the platform's honest status", unknown[0].status, "unknown_capability");
  eq("attributed to the intent's capability id when the outcome names none", unknown[0].capabilityId, "no-such-capability");

  probe.dispose();
  check("platform restored after the recording test", !isCapabilityProbeInstalled());
}

probeRecordingChecks()
  .then(() => {
    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error("capability-utilisation test crashed:", err);
    process.exit(1);
  });
