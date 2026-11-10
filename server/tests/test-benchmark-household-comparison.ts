/**
 * test-benchmark-household-comparison.ts — BENCH-COMPARE
 * =========================================================
 * "Multi-household mode" already runs a full, independent benchmark per targeted
 * household and saves each as its own artifact (admin run-benchmark route) — that
 * fan-out was never the gap. What was missing was a way to see N already-saved
 * artifacts side by side without opening each one individually.
 *
 * `compareHouseholds()` is a pure, I/O-free merge of already-loaded `BenchmarkResult`
 * objects: no re-run, no re-scoring, no second source of truth for anything a result
 * already recorded. These assertions prove it sorts worst-first, surfaces real
 * per-gate counts (including G2 since BENCH-G2), preserves the "not measured" vs
 * "measured, clear" distinction, and flags a cross-bundle-version comparison rather
 * than silently comparing two different question sets.
 *
 *   npm run test:benchmark-household-comparison
 */

import { compareHouseholds } from "./benchmark/aggregate.js";
import type { BenchmarkResult, GateKey, QuestionResult } from "./benchmark/types.js";

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

function result(over: {
  runId: string;
  householdLabel: string;
  headlineScore: number;
  gates?: Partial<Record<GateKey, string[]>>;
  dietarySafetyMeasured?: boolean;
  bundleQuestionsVersion?: string;
  verdict?: "PASS" | "PARTIAL" | "FAIL";
}): BenchmarkResult {
  const safety: Record<GateKey, string[]> = {
    G1: [], G2: [], G3: [], G4: [], G5: [], ...(over.gates ?? {}),
  };
  const gatesFired = (Object.values(safety) as string[][]).reduce((s, ids) => s + ids.length, 0);
  const question: QuestionResult = {
    id: "Q-1", category: "Planner", capability: "planner.suggest", capabilityFamily: "planner",
    household: over.householdLabel, utterance: "What's for dinner?", correctAnswerType: "unknown",
    composite: over.headlineScore, rawComposite: over.headlineScore, gate: null, routingGate: null,
    routing: {
      intendedCapability: "planner", secondaryCapabilities: [], intendedCapabilityStatus: "registered-executable",
      routingRequired: true, invokedCapabilities: ["planner"], invokedCapabilitiesSource: "resolved-intent",
      outcome: "reached-intended", failureReason: null, explanation: "Reached the intended capability.",
    },
    hallucination: false, capabilityInvocations: [], bands: {} as QuestionResult["bands"],
    reachedCapability: "planner", fallbackState: null, latencyMs: 500, error: null,
    responsePreview: "A lentil dal.", personality: "companion", entityRefCount: 1, actionCount: 0,
  };
  const bundleVersion = over.bundleQuestionsVersion ?? "1.0.0";
  return {
    schemaVersion: "1.0.0", runId: over.runId, mode: "quick", status: "scored", abortReason: null,
    bundle: { questions: bundleVersion, households: "1.0.0", rubric: "2.0.0", judge: "1.0.0", framework: "1.0.0", fixtureChecksum: "x" },
    subject: {
      commit: "abc1234", branch: "feat/integrated-dev", dirty: false,
      capabilityRegistryVersion: "x", knowledgeVersion: "x", clock: "wall",
      executedAt: "2026-11-10T00:00:00.000Z",
    },
    judge: { model: "claude-opus-4-8", temperature: 0, promptHash: "x", invoked: false },
    repeats: 1, worldMode: "benchmark-world",
    headline: {
      score: over.headlineScore, honestGapRate: 0.5, gatesFired, questionsScored: 10, meanLatencyMs: 500,
      routingGatesFired: 0, intentResolutionAccuracy: 1, capabilityReach: 1, hallucinationRate: 0,
    },
    environment: { llmProviderAvailable: true, judgeInvoked: false, dietarySafetyMeasured: over.dietarySafetyMeasured ?? true },
    routing: {
      routingRequiredQuestions: 10, capabilityReachPct: 1, intentResolutionAccuracyPct: 1,
      capabilityMisses: 0, misroutes: 0, misroutesReachingSecondary: 0, unreachableCapabilities: [],
      unreachableCapabilityCount: 0, failureReasons: {}, validHonestGaps: 0, invokedCapabilitiesSource: "resolved-intent",
    },
    coverage: {
      intendedCapabilities: ["planner"], invokedCapabilities: ["planner"], intendedCoveragePct: 1,
      registryExecutableCapabilities: ["planner"], registryCoveragePct: 1, untestedCapabilities: [],
    },
    coverageByDomain: [], routingFailures: [],
    quality: { questionsScored: 10, meanComposite: over.headlineScore, meanD1Band: 3, meanD5Band: 3, meanD7Band: 3, reachedButEmpty: 0, judgeInvoked: false },
    hallucination: { count: 0, rate: 0, questionIds: [], basis: "x" },
    capabilityUtilisation: {
      probeActive: true, exercised: [], neverExercised: [], neverExercisedCount: 0, registeredUnbound: [],
      bypassedQuestions: [], bypassedStructural: 0, bypassedDefect: 0, totalInvocations: 0,
      totalCapabilityTimeMs: 0, capabilityTimeShareOfRun: 0, utilisationPct: 1,
    },
    dimensions: [], domains: [], capabilities: [], capabilitiesCrossCutting: [],
    households: [], personalities: [], safety,
    topImprovements: [], topRegressions: [], failedQuestions: [], newlyFailing: [], newlyPassing: [],
    releaseReadiness: {
      verdict: over.verdict ?? (gatesFired > 0 ? "FAIL" : "PASS"), blockers: [], warnings: [], notes: [],
    },
    questions: [question], baselineRunId: null, durationMs: 1000,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

console.log("1. Empty input");
{
  const report = compareHouseholds([]);
  eq("no rows", report.rows.length, 0);
  eq("mean is 0", report.meanHeadlineScore, 0);
  eq("no worst household", report.worstHousehold, null);
  eq("no hard gate", report.anyHardGateFired, false);
}

console.log("\n2. Sorts worst-first by headline score");
{
  const report = compareHouseholds([
    result({ runId: "r-high", householdLabel: "BW01", headlineScore: 92 }),
    result({ runId: "r-low", householdLabel: "BW08", headlineScore: 61 }),
    result({ runId: "r-mid", householdLabel: "BW03", headlineScore: 78 }),
  ]);
  eq("worst household leads", report.rows[0].householdLabel, "BW08");
  eq("best household trails", report.rows[2].householdLabel, "BW01");
  eq("worstHousehold matches row 0", report.worstHousehold, "BW08");
  eq("mean headline is the simple average", report.meanHeadlineScore, Math.round(((92 + 61 + 78) / 3) * 10) / 10);
}

console.log("\n3. Real per-gate counts, including G2");
{
  const report = compareHouseholds([
    result({ runId: "r-safe", householdLabel: "BW01", headlineScore: 90 }),
    result({ runId: "r-breach", householdLabel: "BW04", headlineScore: 40, gates: { G2: ["Q-7"] } }),
  ]);
  const breach = report.rows.find((r) => r.householdLabel === "BW04")!;
  const safe = report.rows.find((r) => r.householdLabel === "BW01")!;
  eq("BW04's G2 count is real, not just a total", breach.gatesFired.G2, 1);
  eq("BW04 is flagged as a hard-gate household", breach.hardGateFired, true);
  eq("BW01 fired no gate", safe.gatesFired.G2, 0);
  eq("BW01 is not a hard-gate household", safe.hardGateFired, false);
  eq("report-level flag is true when ANY household has a hard gate", report.anyHardGateFired, true);
}

console.log("\n4. 'Not measured' is never confused with 'measured, clear'");
{
  const report = compareHouseholds([
    result({ runId: "r-measured", householdLabel: "BW04", headlineScore: 90, dietarySafetyMeasured: true }),
    result({ runId: "r-unmeasured", householdLabel: "live", headlineScore: 90, dietarySafetyMeasured: false }),
  ]);
  const measured = report.rows.find((r) => r.householdLabel === "BW04")!;
  const unmeasured = report.rows.find((r) => r.householdLabel === "live")!;
  eq("measured household carries the flag", measured.dietarySafetyMeasured, true);
  eq("unmeasured household carries the flag", unmeasured.dietarySafetyMeasured, false);
  check("both show a G2 count of 0 — the flag is what tells them apart, not the count", measured.gatesFired.G2 === 0 && unmeasured.gatesFired.G2 === 0);
}

console.log("\n5. Cross-bundle-version comparisons are flagged, not silently merged");
{
  const report = compareHouseholds([
    result({ runId: "r-v1-a", householdLabel: "BW01", headlineScore: 80, bundleQuestionsVersion: "1.0.0" }),
    result({ runId: "r-v1-b", householdLabel: "BW02", headlineScore: 82, bundleQuestionsVersion: "1.0.0" }),
    result({ runId: "r-v2", householdLabel: "BW03", headlineScore: 85, bundleQuestionsVersion: "2.0.0" }),
  ]);
  eq("the minority bundle version is named", report.bundleVersionMismatches.length, 1);
  eq("it names the actual mismatching run", report.bundleVersionMismatches[0], "r-v2");
}
{
  const report = compareHouseholds([
    result({ runId: "r-a", householdLabel: "BW01", headlineScore: 80 }),
    result({ runId: "r-b", householdLabel: "BW02", headlineScore: 82 }),
  ]);
  eq("no mismatch when every run shares a bundle version", report.bundleVersionMismatches.length, 0);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
