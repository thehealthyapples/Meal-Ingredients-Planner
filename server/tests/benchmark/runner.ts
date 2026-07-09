/**
 * runner.ts — INTQ4 benchmark execution engine
 * ==============================================
 * Implements EXECUTION_PROCESS steps 0–5 for one run: resolve bundle → execute
 * each selected question through the ONE Companion seam → deterministic (+ optional
 * judge) scoring → aggregate → compare against baseline → assemble the result
 * artefact. Step 6 (emit + history) lives in history.ts / report.ts; teardown of a
 * disposable DB is the caller's concern (single-world mode uses no disposable DB).
 *
 * THE ONE-SEAM INVARIANT (README §1, AUTOMATION §2): this module NEVER imports a
 * capability handler, the intent engine, the permission model, or the behaviour
 * engine. It receives a `TurnRunner` — a thin wrapper the caller builds around
 * `conversationGateway.processUserTurn` — and calls nothing else into the Companion.
 */

import { randomUUID } from "node:crypto";
import type {
  BenchmarkEnvironment, BenchmarkMode, BenchmarkResult, DimensionKey,
} from "./types.js";
import { resolveBundle, resolveProvenance, judgeDescriptor, loadQuestionsFixture, bundleVersionLabel } from "./bundle.js";
import { RESULT_SCHEMA_VERSION } from "./bundle.js";
import { selectQuestions } from "./select.js";
import { deriveExpectation, registryExecutableCapabilityIds } from "./expectations.js";
import {
  scoreDeterministic, buildQuestionResult, applyGateCaps,
  JUDGE_OWNED, DIMENSION_WEIGHTS, DIMENSION_NAMES, type CapturedTurn,
} from "./scorer.js";
import { resolveJudge, type JudgeClient } from "./judge.js";
import {
  rollupDimensions, rollupDomains, rollupCapabilities, rollupNonCapability, rollupHouseholds, rollupPersonalities,
  safetyPanel, honestGapRate, headlineScore, failedQuestionIds, releaseReadiness, compare,
  routingPanel, coveragePanel, coverageByDomain, routingFailureReport, qualityPanel, hallucinationPanel,
  capabilityUtilisationPanel,
} from "./aggregate.js";

/** The thin, caller-provided wrapper around the ONE Companion seam. */
export type TurnRunner = (utterance: string) => Promise<CapturedTurn>;

export interface RunOptions {
  readonly mode: BenchmarkMode;
  readonly runTurn: TurnRunner;
  /** In single-world mode all questions run against the acting household;
   *  in benchmark-world mode they run against one permanent INTQ6 household. */
  readonly worldMode?: "single-world" | "benchmark-world" | "deterministic-households";
  /** The household label questions are attributed to (e.g. "BW03" in benchmark-world mode). */
  readonly householdLabel?: string;
  readonly judge?: JudgeClient;
  readonly baseline?: BenchmarkResult | null;
  /** Optional caller hook for progress reporting (e.g. server logs). */
  readonly onProgress?: (done: number, total: number, id: string) => void;
}

function makeRunId(commit: string): string {
  const iso = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "T").slice(0, 19);
  return `${iso}Z__${commit.slice(0, 7)}`;
}

/** Certification is framework-only in INTQ4 — returns a non-scored artefact. */
function certificationFrameworkOnly(options: RunOptions): BenchmarkResult {
  const bundle = resolveBundle();
  const subject = resolveProvenance();
  const judge = judgeDescriptor(false);
  return {
    schemaVersion: RESULT_SCHEMA_VERSION,
    runId: makeRunId(subject.commit),
    mode: "certification",
    status: "framework-only",
    abortReason:
      "Certification requires the STRICT preconditions (EXECUTION_PROCESS §2): the six " +
      "deterministic households seeded to fixed IDs into a disposable database (households.v1.json " +
      "seed contract), and the pinned temperature-0 judge reachable. INTQ4 ships the certification " +
      "framework only; run Quick or Full for an executable deterministic-tier score.",
    bundle,
    subject,
    judge,
    repeats: 1,
    worldMode: "deterministic-households",
    headline: {
      score: 0, honestGapRate: 0, gatesFired: 0, questionsScored: 0, meanLatencyMs: 0,
      routingGatesFired: 0, intentResolutionAccuracy: 0, capabilityReach: 0, hallucinationRate: 0,
    },
    environment: { llmProviderAvailable: false, judgeInvoked: false },
    routing: {
      routingRequiredQuestions: 0, capabilityReachPct: 0, intentResolutionAccuracyPct: 0,
      capabilityMisses: 0, misroutes: 0, unreachableCapabilities: [], unreachableCapabilityCount: 0,
      failureReasons: {}, validHonestGaps: 0, invokedCapabilitiesSource: "none",
    },
    coverage: {
      intendedCapabilities: [], invokedCapabilities: [], intendedCoveragePct: 0,
      registryExecutableCapabilities: registryExecutableCapabilityIds(), registryCoveragePct: 0,
      untestedCapabilities: registryExecutableCapabilityIds(),
    },
    coverageByDomain: [],
    routingFailures: [],
    quality: {
      questionsScored: 0, meanComposite: 0, meanD1Band: 0, meanD5Band: 0, meanD7Band: 0,
      reachedButEmpty: 0, judgeInvoked: false,
    },
    hallucination: { count: 0, rate: 0, questionIds: [], basis: "Not scored — certification is framework-only." },
    capabilityUtilisation: {
      probeActive: false, exercised: [], neverExercised: [], neverExercisedCount: 0,
      registeredUnbound: [], bypassedQuestions: [], bypassedStructural: 0, bypassedDefect: 0,
      totalInvocations: 0, totalCapabilityTimeMs: 0, capabilityTimeShareOfRun: 0, utilisationPct: 0,
    },
    dimensions: (Object.keys(DIMENSION_WEIGHTS) as DimensionKey[]).map((key) => ({
      key, name: DIMENSION_NAMES[key], weight: DIMENSION_WEIGHTS[key], points: 0, bandPct: 0,
    })),
    domains: [], capabilities: [], capabilitiesCrossCutting: [], households: [], personalities: [],
    safety: { G1: [], G2: [], G3: [], G4: [], G5: [] },
    topImprovements: [], topRegressions: [], failedQuestions: [], newlyFailing: [], newlyPassing: [],
    releaseReadiness: {
      verdict: "PARTIAL",
      blockers: [],
      warnings: ["Certification not executed — framework only (see abortReason)."],
      notes: [`Bundle ${bundleVersionLabel(bundle)} resolved and ready; preconditions pending.`],
    },
    questions: [],
    baselineRunId: null,
    durationMs: 0,
  };
}

export async function runBenchmark(options: RunOptions): Promise<BenchmarkResult> {
  if (options.mode === "certification") {
    return certificationFrameworkOnly(options);
  }

  const started = Date.now();
  const bundle = resolveBundle();
  const subject = resolveProvenance();
  const fixture = loadQuestionsFixture();
  const judge = options.judge ?? resolveJudge();
  const worldMode = options.worldMode ?? "single-world";
  const householdLabel = options.householdLabel ?? "live";

  const selected = selectQuestions(fixture, options.mode);
  const questionResults = [];
  let anyJudge = false;
  /** BENCH2 — captured once from the turns themselves; identical for every turn in a run. */
  let llmProviderAvailable = true;
  /** BENCH2C — whether a capability probe actually observed this run. */
  let capabilityProbeActive = false;

  // BENCH2C — the turn runner may own a capability probe that shadows `intelligencePlatform.handle`.
  // It MUST be removed however this loop ends, so a thrown question can never leave the production
  // singleton wrapped. `dispose` is optional: a caller-supplied stub TurnRunner has none.
  try {
  for (let i = 0; i < selected.length; i++) {
    const q = selected[i];
    const exp = deriveExpectation(q);
    const turn = await options.runTurn(q.utterance);
    llmProviderAvailable = turn.llmProviderAvailable;
    capabilityProbeActive = turn.capabilityProbeActive;
    const scored = scoreDeterministic(exp, turn);

    // Optional judge tier — refine the degree of judge-owned dimensions only.
    if (judge.enabled) {
      for (const dim of JUDGE_OWNED) {
        const verdict = await judge.score(dim, exp, turn);
        if (verdict) {
          anyJudge = true;
          const weight = DIMENSION_WEIGHTS[dim];
          scored.bands[dim] = { band: verdict.band, points: (verdict.band / 4) * weight, weight, source: "judge", rationale: verdict.rationale };
        }
      }
      // Recompute composite after judge refinement. Gate caps still apply, and BENCH2 routes
      // that recompute through `applyGateCaps` — the same function the deterministic tier used —
      // so the judge can never lift a question past a gate by re-grading a dimension.
      const raw = (Object.keys(scored.bands) as DimensionKey[]).reduce((s, k) => s + scored.bands[k].points, 0);
      scored.rawComposite = Math.round(raw * 10) / 10;
      scored.composite = Math.round(applyGateCaps(scored.rawComposite, scored.gate, scored.routingGate) * 10) / 10;
    }

    questionResults.push(buildQuestionResult(exp, turn, householdLabel, scored));
    options.onProgress?.(i + 1, selected.length, q.id);
  }
  } finally {
    (options.runTurn as Partial<{ dispose(): void }>).dispose?.();
  }

  const environment: BenchmarkEnvironment = { llmProviderAvailable, judgeInvoked: anyJudge };
  const dimensions = rollupDimensions(questionResults);
  const domains = rollupDomains(questionResults);
  const capabilities = rollupCapabilities(questionResults);
  const capabilitiesCrossCutting = rollupNonCapability(questionResults);
  const households = rollupHouseholds(questionResults);
  const personalities = rollupPersonalities(questionResults);
  const safety = safetyPanel(questionResults);
  const headline = headlineScore(questionResults);
  const hgRate = honestGapRate(questionResults);
  const gatesFired = Object.values(safety).reduce((s, arr) => s + arr.length, 0);
  const failed = failedQuestionIds(questionResults);
  const cmp = compare(questionResults, domains, dimensions, options.baseline ?? null);

  // BENCH2 — the four separated panels.
  const routing = routingPanel(questionResults);
  const coverage = coveragePanel(questionResults);
  const byDomain = coverageByDomain(questionResults);
  const routingFailures = routingFailureReport(questionResults);
  const quality = qualityPanel(questionResults, anyJudge);
  const hallucination = hallucinationPanel(questionResults);
  const routingGatesFired = routing.capabilityMisses + routing.misroutes;

  // BENCH2C — the Capability Utilisation Dashboard. `durationMs` is needed for the capability-time
  // share, so it is computed here rather than at the return statement.
  const durationMs = Date.now() - started;
  const capabilityUtilisation = capabilityUtilisationPanel(questionResults, durationMs, capabilityProbeActive);

  const readiness = releaseReadiness(
    headline, hgRate, safety, failed, routing, hallucination, environment, questionResults,
    capabilityUtilisation,
  );
  const meanLatency = questionResults.length
    ? Math.round(questionResults.reduce((s, q) => s + q.latencyMs, 0) / questionResults.length)
    : 0;

  // OBS1: observe the benchmark execution (fire-and-forget; a missing or
  // unreachable observation store never affects a benchmark run).
  const obsRunId = makeRunId(subject.commit);
  try {
    const { recordObservation } = await import("../../intelligence/observation/observation-engine.js");
    recordObservation({
      kind: "benchmark-run",
      severity: "info",
      outcome: "scored",
      sessionId: obsRunId,
      durationMs,
      metadata: {
        runId: obsRunId,
        mode: options.mode,
        headlineScore: headline,
        honestGapRate: hgRate,
        meanLatencyMs: meanLatency,
        questionsScored: questionResults.length,
        gatesFired,
        hallucinationRate: hallucination.rate,
      },
    });
  } catch (err) {
    console.error("[Benchmark] observation capture unavailable:", err instanceof Error ? err.message : err);
  }

  return {
    schemaVersion: RESULT_SCHEMA_VERSION,
    runId: obsRunId,
    mode: options.mode,
    status: "scored",
    abortReason: null,
    bundle,
    subject,
    judge: judgeDescriptor(anyJudge),
    repeats: 1,
    worldMode,
    headline: {
      score: headline,
      honestGapRate: hgRate,
      gatesFired,
      questionsScored: questionResults.length,
      meanLatencyMs: meanLatency,
      routingGatesFired,
      intentResolutionAccuracy: routing.intentResolutionAccuracyPct,
      capabilityReach: routing.capabilityReachPct,
      hallucinationRate: hallucination.rate,
    },
    environment,
    routing,
    coverage,
    coverageByDomain: byDomain,
    routingFailures,
    quality,
    hallucination,
    capabilityUtilisation,
    dimensions,
    domains,
    capabilities,
    capabilitiesCrossCutting,
    households,
    personalities,
    safety,
    topImprovements: cmp.topImprovements,
    topRegressions: cmp.topRegressions,
    failedQuestions: failed,
    newlyFailing: cmp.newlyFailing,
    newlyPassing: cmp.newlyPassing,
    releaseReadiness: readiness,
    questions: questionResults,
    baselineRunId: options.baseline?.runId ?? null,
    durationMs,
  };
}
