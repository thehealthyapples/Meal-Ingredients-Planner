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
  BenchmarkMode, BenchmarkResult, DimensionKey,
} from "./types.js";
import { resolveBundle, resolveProvenance, judgeDescriptor, loadQuestionsFixture, bundleVersionLabel } from "./bundle.js";
import { RESULT_SCHEMA_VERSION } from "./bundle.js";
import { selectQuestions } from "./select.js";
import { deriveExpectation } from "./expectations.js";
import { scoreDeterministic, buildQuestionResult, JUDGE_OWNED, DIMENSION_WEIGHTS, DIMENSION_NAMES, type CapturedTurn } from "./scorer.js";
import { resolveJudge, type JudgeClient } from "./judge.js";
import {
  rollupDimensions, rollupDomains, rollupCapabilities, rollupNonCapability, rollupHouseholds, rollupPersonalities,
  safetyPanel, honestGapRate, headlineScore, failedQuestionIds, releaseReadiness, compare,
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
    headline: { score: 0, honestGapRate: 0, gatesFired: 0, questionsScored: 0, meanLatencyMs: 0 },
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

  for (let i = 0; i < selected.length; i++) {
    const q = selected[i];
    const exp = deriveExpectation(q);
    const turn = await options.runTurn(q.utterance);
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
      // Recompute composite after judge refinement (gate caps still apply).
      const raw = (Object.keys(scored.bands) as DimensionKey[]).reduce((s, k) => s + scored.bands[k].points, 0);
      scored.rawComposite = Math.round(raw * 10) / 10;
      scored.composite = scored.gate === "G3" ? 0 : scored.gate === "G5" ? Math.min(scored.rawComposite, 25) : scored.rawComposite;
    }

    questionResults.push(buildQuestionResult(exp, turn, householdLabel, scored));
    options.onProgress?.(i + 1, selected.length, q.id);
  }

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
  const readiness = releaseReadiness(headline, hgRate, safety, failed);
  const meanLatency = questionResults.length
    ? Math.round(questionResults.reduce((s, q) => s + q.latencyMs, 0) / questionResults.length)
    : 0;

  return {
    schemaVersion: RESULT_SCHEMA_VERSION,
    runId: makeRunId(subject.commit),
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
    },
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
    durationMs: Date.now() - started,
  };
}
