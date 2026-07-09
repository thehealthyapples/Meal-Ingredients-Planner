/**
 * test-intelligence-observation-telemetry.ts — OBS1
 * =================================================================
 * Tests for the Observation Engine (canonical platform telemetry):
 * the fire-and-forget record seam, the privacy-preserving row shape,
 * the in-memory store contract, and every pure Workbench aggregation.
 * DB-free by construction — the InMemoryObservationStore is injected,
 * so server/db.ts is never loaded.
 *
 * Coverage:
 *   §1  recordObservation — capture, intent projection, isolation, disable flag
 *   §2  InMemoryObservationStore — filters, ordering, counts
 *   §3  summarizeOverview — rates, byKind/bySeverity/byDay
 *   §4  summarizeCapabilities — grouping, outcomes, neutral exclusion
 *   §5  summarizeIntents — failed intents, confidence distribution
 *   §6  summarizeContext — budget/missing counters, view counts
 *   §7  summarizeCompanion — feedback, escalations, recoveries, generation
 *   §8  summarizeKnowledge — coverage vs honest gap, sources
 *   §9  summarizePlanner — verb split, generation gaps, recoveries
 *   §10 summarizeBenchmarks — metadata projection, trend order
 *
 * Run: npx tsx server/tests/test-intelligence-observation-telemetry.ts
 */

import {
  recordObservation,
  setObservationStore,
  summarizeOverview,
  summarizeCapabilities,
  summarizeIntents,
  summarizeContext,
  summarizeCompanion,
  summarizeKnowledge,
  summarizePlanner,
  summarizeBenchmarks,
  OBSERVATION_KINDS,
  type ObservationKind,
} from "../intelligence/observation/observation-engine.js";
import {
  InMemoryObservationStore,
  type IObservationStore,
} from "../intelligence/observation/observation-contract.js";
import type { InsertPlatformObservation, PlatformObservation } from "../../shared/schema.js";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗ ${label}`);
  }
}

/** Wait for the record seam's fire-and-forget promise chain to settle. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

let rowId = 1;
/** A full PlatformObservation row for the pure aggregators. */
function row(partial: Partial<PlatformObservation> & { kind: ObservationKind }): PlatformObservation {
  return {
    id: rowId++,
    observedAt: new Date("2026-07-08T12:00:00Z"),
    severity: "info",
    outcome: null,
    userId: null,
    sessionId: null,
    surface: null,
    capability: null,
    verb: null,
    intent: null,
    contextView: null,
    confidence: null,
    durationMs: null,
    recoveryPath: null,
    metadata: {},
    ...partial,
  };
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  // §1 recordObservation — the fire-and-forget seam
  // -------------------------------------------------------------------------

  console.log("\n── §1 recordObservation — capture, projection, isolation ──────────────────────");

  const store = new InMemoryObservationStore();
  setObservationStore(store);

  recordObservation({
    kind: "capability-invocation",
    outcome: "ok",
    userId: 7,
    sessionId: "thread-1",
    capability: "planner",
    verb: "report",
    durationMs: 42,
  });
  await settle();

  assert(store.all().length === 1, "an observation is recorded through the injected store");
  assert(store.all()[0].intent === "planner:report", "intent is projected as <capability>:<verb>");
  assert(store.all()[0].severity === "info", "severity defaults to info");

  recordObservation({ kind: "intent-resolution", capability: "planner" });
  await settle();
  assert(store.all()[1].intent === null, "no verb → no intent projection (never guessed)");

  // Isolation: a store that throws must never propagate to the caller.
  const throwingStore: IObservationStore = {
    async record(): Promise<void> {
      throw new Error("synthetic store failure");
    },
    async listSince(): Promise<PlatformObservation[]> {
      return [];
    },
    async listRecent(): Promise<PlatformObservation[]> {
      return [];
    },
    async countByKindSince(): Promise<{ total: number; byKind: Record<string, number> }> {
      return { total: 0, byKind: {} };
    },
  };
  setObservationStore(throwingStore);
  let threw = false;
  try {
    recordObservation({ kind: "recovery", outcome: "internal-error" });
    await settle();
  } catch {
    threw = true;
  }
  assert(!threw, "a failing store never throws into the observed operation");

  // Disable flag: capture is a no-op with OBS_DISABLE_CAPTURE=1.
  const disabledStore = new InMemoryObservationStore();
  setObservationStore(disabledStore);
  process.env.OBS_DISABLE_CAPTURE = "1";
  recordObservation({ kind: "user-feedback", outcome: "up" });
  await settle();
  delete process.env.OBS_DISABLE_CAPTURE;
  assert(disabledStore.all().length === 0, "OBS_DISABLE_CAPTURE=1 disables capture entirely");

  assert(
    OBSERVATION_KINDS.length === 11 && new Set(OBSERVATION_KINDS).size === 11,
    "the observation taxonomy is the closed 11-kind vocabulary",
  );

  // -------------------------------------------------------------------------
  // §2 InMemoryObservationStore — the store contract
  // -------------------------------------------------------------------------

  console.log("\n── §2 InMemoryObservationStore — filters, ordering, counts ────────────────────");

  const contract = new InMemoryObservationStore();
  const insert = (o: Partial<InsertPlatformObservation> & { kind: string }): Promise<void> =>
    contract.record({
      severity: "info",
      outcome: null,
      userId: null,
      sessionId: null,
      surface: null,
      capability: null,
      verb: null,
      intent: null,
      contextView: null,
      confidence: null,
      durationMs: null,
      recoveryPath: null,
      metadata: {},
      ...o,
    } as InsertPlatformObservation);

  await insert({ kind: "capability-invocation", capability: "planner", verb: "report", intent: "planner:report", outcome: "ok", sessionId: "s1" });
  await insert({ kind: "capability-invocation", capability: "shopping", verb: "report", intent: "shopping:report", outcome: "error", severity: "error", sessionId: "s2" });
  await insert({ kind: "clarification", outcome: "ambiguous", severity: "warning", sessionId: "s1" });

  assert((await contract.listRecent()).length === 3, "listRecent with no filter returns everything");
  assert(
    (await contract.listRecent())[0].kind === "clarification",
    "listRecent returns newest first",
  );
  assert(
    (await contract.listRecent({ kind: "capability-invocation" })).length === 2,
    "kind filter narrows to matching rows",
  );
  assert(
    (await contract.listRecent({ capability: "planner" })).length === 1,
    "capability filter narrows to matching rows",
  );
  assert(
    (await contract.listRecent({ severity: "error" })).length === 1,
    "severity filter narrows to matching rows",
  );
  assert(
    (await contract.listRecent({ sessionId: "s1" })).length === 2,
    "sessionId filter correlates a session's rows",
  );
  assert(
    (await contract.listRecent({ q: "shopping" })).length === 1,
    "free-text q matches capability/verb/intent/outcome/kind fields",
  );
  assert(
    (await contract.listRecent({ q: "AMBIG" })).length === 1,
    "free-text q is case-insensitive",
  );
  assert((await contract.listRecent({ limit: 2 })).length === 2, "limit caps the result set");

  const counts = await contract.countByKindSince(new Date(0));
  assert(counts.total === 3, "countByKindSince totals every row in the window");
  assert(
    counts.byKind["capability-invocation"] === 2 && counts.byKind["clarification"] === 1,
    "countByKindSince groups by kind",
  );
  assert(
    (await contract.listSince(new Date(0))).length === 3,
    "listSince returns the full window oldest-first",
  );

  // -------------------------------------------------------------------------
  // §3 summarizeOverview
  // -------------------------------------------------------------------------

  console.log("\n── §3 summarizeOverview — rates and distributions ──────────────────────────────");

  const overviewRows: PlatformObservation[] = [
    row({ kind: "intent-resolution", confidence: 0.9 }),
    row({ kind: "intent-resolution", confidence: 0.5 }),
    row({ kind: "capability-invocation", outcome: "ok" }),
    row({ kind: "capability-invocation", outcome: "ok" }),
    row({ kind: "capability-invocation", outcome: "gap" }),
    row({ kind: "capability-invocation", outcome: "confirmation_required" }),
    row({ kind: "clarification", outcome: "ambiguous", severity: "warning" }),
    row({ kind: "response-generation", outcome: "ok", durationMs: 1000 }),
    row({ kind: "response-generation", outcome: "error", severity: "error", durationMs: 3000, observedAt: new Date("2026-07-07T12:00:00Z") }),
    row({ kind: "context-composition", outcome: "ok", durationMs: 5 }),
  ];
  const overview = summarizeOverview(overviewRows, 7);

  assert(overview.total === 10, "total counts every observation in the window");
  assert(overview.successRate === 0.667, "successRate judges ok over non-neutral invocations (rounded to 3dp)");
  assert(overview.failureRate === 0.333, "failureRate is the complement over judged invocations (rounded to 3dp)");
  assert(overview.clarificationRate === 0.5, "clarificationRate is clarifications per resolution");
  assert(overview.averageConfidence === 0.7, "averageConfidence means resolver confidences");
  assert(overview.averageResponseTimeMs === 2000, "averageResponseTimeMs means generation durations");
  assert(overview.averageContextCompositionMs === 5, "averageContextCompositionMs means composition durations");
  assert(
    overview.byKind[0].kind === "capability-invocation" && overview.byKind[0].count === 4,
    "byKind is sorted by count descending",
  );
  assert(
    overview.byDay.length === 2 &&
      overview.byDay[0].day === "2026-07-07" &&
      overview.byDay[0].errors === 1,
    "byDay buckets by ISO day with error counts, oldest first",
  );
  assert(
    summarizeOverview([], 7).successRate === null,
    "no invocations → honest null rates, never a fabricated 0 or 1",
  );

  // -------------------------------------------------------------------------
  // §4 summarizeCapabilities
  // -------------------------------------------------------------------------

  console.log("\n── §4 summarizeCapabilities — per-capability health ────────────────────────────");

  const capabilityRows: PlatformObservation[] = [
    row({ kind: "capability-invocation", capability: "planner", verb: "report", outcome: "ok", durationMs: 10 }),
    row({ kind: "capability-invocation", capability: "planner", verb: "report", outcome: "gap", durationMs: 30 }),
    row({ kind: "capability-invocation", capability: "planner", verb: "update", outcome: "confirmation_required" }),
    row({ kind: "capability-invocation", capability: "shopping", verb: "report", outcome: "denied" }),
    row({ kind: "capability-invocation", capability: "shopping", verb: "report", outcome: "error", severity: "error" }),
    row({ kind: "intent-resolution", capability: "planner", confidence: 0.8 }),
  ];
  const capabilities = summarizeCapabilities(capabilityRows, 7).capabilities;

  assert(capabilities.length === 2, "invocations group by capability");
  assert(capabilities[0].capability === "planner", "capabilities are sorted by volume");
  const planner = capabilities[0];
  assert(planner.total === 3 && planner.ok === 1 && planner.gaps === 1, "ok and gap outcomes are counted");
  assert(planner.successRate === 0.5, "confirmation_required is neutral — excluded from the judged rate");
  assert(planner.averageConfidence === 0.8, "capability confidence comes from its intent resolutions");
  const shopping = capabilities[1];
  assert(shopping.denied === 1 && shopping.errors === 1, "denied outcomes and error severities are counted");
  assert(
    planner.trend.length === 1 && planner.trend[0].failures === 1,
    "the per-day trend counts non-ok, non-neutral invocations as failures",
  );

  // -------------------------------------------------------------------------
  // §5 summarizeIntents
  // -------------------------------------------------------------------------

  console.log("\n── §5 summarizeIntents — intent quality ────────────────────────────────────────");

  const intentRows: PlatformObservation[] = [
    row({ kind: "capability-invocation", capability: "planner", verb: "report", intent: "planner:report", outcome: "ok" }),
    row({ kind: "capability-invocation", capability: "planner", verb: "report", intent: "planner:report", outcome: "gap" }),
    row({ kind: "capability-invocation", capability: "meals", verb: "find", intent: "meals:find", outcome: "ok" }),
    row({ kind: "intent-resolution", intent: "planner:report", capability: "planner", verb: "report", confidence: 0.95 }),
    row({ kind: "intent-resolution", intent: "meals:find", capability: "meals", verb: "find", confidence: 0.42 }),
    row({ kind: "clarification", outcome: "needs-clarification" }),
  ];
  const intents = summarizeIntents(intentRows, 7);

  assert(intents.intents.length === 2 && intents.intents[0].intent === "planner:report", "intents group and sort by volume");
  assert(intents.intents[0].failed === 1, "non-ok, non-neutral invocations count as failed");
  assert(
    intents.failedIntents.length === 1 && intents.failedIntents[0].intent === "planner:report",
    "failedIntents lists only intents with failures",
  );
  assert(intents.intents[0].averageConfidence === 0.95, "per-intent confidence comes from its resolutions");
  const distribution = intents.confidenceDistribution;
  assert(distribution.length === 10, "confidence distribution has ten fixed buckets");
  assert(
    distribution[9].count === 1 && distribution[4].count === 1,
    "confidences land in their buckets (0.95 → 0.9–1.0, 0.42 → 0.4–0.5)",
  );
  assert(intents.clarificationRate === 0.5, "window-level clarification rate is reported");

  // -------------------------------------------------------------------------
  // §6 summarizeContext
  // -------------------------------------------------------------------------

  console.log("\n── §6 summarizeContext — composition health ────────────────────────────────────");

  const contextRows: PlatformObservation[] = [
    row({ kind: "context-composition", durationMs: 4, metadata: { budgetExceeded: false, capabilitiesContributing: 2, views: ["planner:report", "meals:find"] } }),
    row({ kind: "context-composition", durationMs: 6, metadata: { budgetExceeded: true, capabilitiesContributing: 0, views: ["planner:report"] } }),
  ];
  const context = summarizeContext(contextRows, 7);

  assert(context.compositionCount === 2, "every composition is counted");
  assert(context.averageCompositionMs === 5, "composition wall time is averaged");
  assert(context.budgetExceededCount === 1, "budget-exceeded compositions are counted");
  assert(context.missingContextCount === 1, "zero-contributor compositions are counted as missing context");
  assert(
    context.views[0].contextView === "planner:report" && context.views[0].count === 2,
    "Context Views are counted across compositions and sorted by use",
  );

  // -------------------------------------------------------------------------
  // §7 summarizeCompanion
  // -------------------------------------------------------------------------

  console.log("\n── §7 summarizeCompanion — feedback, escalations, recoveries ──────────────────");

  const companionRows: PlatformObservation[] = [
    row({ kind: "user-feedback", outcome: "up" }),
    row({ kind: "user-feedback", outcome: "down", metadata: { reasonCode: "wrong-data" } }),
    row({ kind: "user-feedback", outcome: "down", metadata: { reasonCode: "wrong-data" } }),
    row({ kind: "escalation", recoveryPath: "manual-action-redirect" }),
    row({ kind: "recovery", outcome: "no-knowledge", recoveryPath: "recovery-suggestions" }),
    row({ kind: "recovery", outcome: "internal-error", recoveryPath: "honest-disclosure", severity: "error" }),
    row({ kind: "response-generation", outcome: "ok", durationMs: 800 }),
    row({ kind: "response-generation", outcome: "error", severity: "error", durationMs: 200 }),
  ];
  const companion = summarizeCompanion(companionRows, 7);

  assert(companion.feedback.helpful === 1 && companion.feedback.notHelpful === 2, "feedback splits up/down");
  assert(
    companion.feedback.byReason[0].reason === "wrong-data" && companion.feedback.byReason[0].count === 2,
    "down-vote reason codes are counted from metadata",
  );
  assert(
    companion.escalations.total === 1 && companion.escalations.byPath[0].path === "manual-action-redirect",
    "escalations group by path",
  );
  assert(
    companion.recoveries.total === 2 && companion.recoveries.byState.length === 2,
    "recoveries group by fallback state and path",
  );
  assert(
    companion.responseGeneration.errors === 1 && companion.responseGeneration.averageDurationMs === 500,
    "generation errors and mean duration are reported",
  );

  // -------------------------------------------------------------------------
  // §8 summarizeKnowledge
  // -------------------------------------------------------------------------

  console.log("\n── §8 summarizeKnowledge — grounded vs honest gap ──────────────────────────────");

  const knowledgeRows: PlatformObservation[] = [
    row({ kind: "knowledge-retrieval", outcome: "ok", metadata: { sources: ["planner", "meals"] } }),
    row({ kind: "knowledge-retrieval", outcome: "ok", metadata: { sources: ["planner"] } }),
    row({ kind: "knowledge-retrieval", outcome: "no-knowledge", severity: "warning", metadata: { sources: [] } }),
    row({ kind: "knowledge-retrieval", outcome: "not-executable", severity: "warning", metadata: { sources: [] } }),
  ];
  const knowledge = summarizeKnowledge(knowledgeRows, 7);

  assert(knowledge.retrievals.total === 4 && knowledge.retrievals.grounded === 2, "grounded retrievals are the ok outcomes");
  assert(knowledge.retrievals.coverageRate === 0.5 && knowledge.honestGapRate === 0.5, "coverage and honest-gap rates are complements");
  assert(
    knowledge.gapKinds.length === 2,
    "gap kinds are counted from the non-ok outcomes",
  );
  assert(
    knowledge.sources[0].capability === "planner" && knowledge.sources[0].count === 2,
    "grounding sources are counted across retrievals",
  );

  // -------------------------------------------------------------------------
  // §9 summarizePlanner
  // -------------------------------------------------------------------------

  console.log("\n── §9 summarizePlanner — the planner slice ─────────────────────────────────────");

  const plannerRows: PlatformObservation[] = [
    row({ kind: "capability-invocation", capability: "planner", verb: "report", outcome: "ok", durationMs: 10 }),
    row({ kind: "capability-invocation", capability: "planner", verb: "generate", outcome: "not_executable", durationMs: 20 }),
    row({ kind: "capability-invocation", capability: "planner-compliance", verb: "report", outcome: "ok", durationMs: 30 }),
    row({ kind: "capability-invocation", capability: "shopping", verb: "report", outcome: "ok" }),
    row({ kind: "recovery", outcome: "no-knowledge", metadata: { capabilities: ["planner"] } }),
    row({ kind: "recovery", outcome: "no-knowledge", metadata: { capabilities: ["shopping"] } }),
  ];
  const plannerView = summarizePlanner(plannerRows, 7);

  assert(plannerView.total === 3, "the planner slice is capability-prefix scoped (shopping excluded)");
  assert(
    plannerView.byVerb.find((v) => v.verb === "generate")?.failures === 1,
    "failed generate attempts are counted by verb",
  );
  assert(
    plannerView.generation.attempts === 1 && plannerView.generation.gaps === 1,
    "generation attempts and their honest gaps are reported",
  );
  assert(plannerView.recoveries === 1, "recoveries are counted only when a planner capability was attempted");
  assert(plannerView.averageDurationMs === 20, "planner invocation durations are averaged");

  // -------------------------------------------------------------------------
  // §10 summarizeBenchmarks
  // -------------------------------------------------------------------------

  console.log("\n── §10 summarizeBenchmarks — run projection and trend ──────────────────────────");

  const benchmarkRows: PlatformObservation[] = [
    row({
      kind: "benchmark-run",
      sessionId: "run-old",
      durationMs: 60_000,
      observedAt: new Date("2026-07-06T10:00:00Z"),
      metadata: { runId: "run-old", mode: "full", headlineScore: 71.5, honestGapRate: 0.1, meanLatencyMs: 900, questionsScored: 40 },
    }),
    row({
      kind: "benchmark-run",
      sessionId: "run-new",
      durationMs: 61_000,
      observedAt: new Date("2026-07-08T10:00:00Z"),
      metadata: { runId: "run-new", mode: "full", headlineScore: 74.0, honestGapRate: 0.08, meanLatencyMs: 850, questionsScored: 40 },
    }),
    row({ kind: "capability-invocation", capability: "planner", outcome: "ok" }),
  ];
  const benchmarks = summarizeBenchmarks(benchmarkRows);

  assert(benchmarks.runs.length === 2, "only benchmark-run observations are projected");
  assert(benchmarks.runs[0].runId === "run-new", "runs are newest first");
  assert(
    benchmarks.runs[0].headlineScore === 74.0 && benchmarks.runs[0].questionsScored === 40,
    "run metrics are projected verbatim from metadata",
  );
  assert(
    benchmarks.trend[0].headlineScore === 71.5 && benchmarks.trend[1].headlineScore === 74.0,
    "the trend is oldest first for charting",
  );

  // -------------------------------------------------------------------------

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error("\nFailures:");
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
