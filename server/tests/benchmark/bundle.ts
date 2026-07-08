/**
 * bundle.ts — INTQ4 bundle & provenance resolver
 * ===============================================
 * Resolves the five co-versioned bundle components (README §3) plus the subject
 * provenance every run must be stamped with (INTQ4 link requirement): benchmark
 * version, git commit, capability registry version, knowledge version, execution
 * date. Everything here is pure metadata resolution — it never calls the Companion.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { intelligencePlatform } from "../../intelligence/intelligence-platform.js";
import { KNOWLEDGE_SEED_COUNTS } from "../../../shared/knowledge/index.js";
import type { BenchmarkBundle, BenchmarkProvenance, JudgeDescriptor } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(__dirname, "../../..");
export const FIXTURE_PATH = resolve(__dirname, "fixtures/companion-benchmark-100.v1.json");
export const HISTORY_DIR = resolve(REPO_ROOT, "docs/intelligence/benchmark/history");

/** The frozen bundle-component versions this framework release pins (README §4).
 *
 *  FRAMEWORK_VERSION was bumped to v1.1.0 by INTQ9 (capability-family normalisation
 *  hardening + the Cross-Cutting Scores report panel) — a MINOR, comparison-safe
 *  harness/report-shape change; no question, household, rubric weight/gate, or judge changed.
 *
 *  BENCH2 bumps RUBRIC_VERSION to v2.0.0 and FRAMEWORK_VERSION to v2.0.0 — a **MAJOR**,
 *  comparison-BREAKING change. Two new routing gates (R1/R2) and the first-ever assignment of
 *  the long-specified fabrication gate (G1) re-grade questions that previously passed, and the
 *  D4 Capability Routing ladder now scores an un-routed turn 0 rather than 1. README §4 is
 *  explicit that a rubric change is a re-baseline, never a regression delta — `selectBaseline`
 *  in history.ts enforces that by requiring a matching rubric MAJOR, so the first BENCH2 run
 *  establishes a new baseline instead of reporting a −34-point "regression" against a score
 *  that was never measuring what it claimed. Questions, households and the judge are unchanged.
 *
 *  See docs/implementation/BENCH2_INTELLIGENCE_BENCHMARK_HARDENING.md and README §4's version log.
 *
 *  BENCH2C bumps FRAMEWORK_VERSION to v2.1.0 — a **MINOR, comparison-safe** change. It adds the
 *  Capability Utilisation Dashboard (an observation panel and one report section) and changes no
 *  question, household, rubric dimension/weight/gate, judge, or per-question score. Utilisation is
 *  purely descriptive: no dimension band and no gate reads a capability invocation record. Runs are
 *  directly comparable across this boundary — a `v2.0.0` baseline simply carries no utilisation data.
 *
 *  See docs/implementation/BENCH2C_CAPABILITY_UTILISATION_DASHBOARD.md and README §4's version log. */
export const FRAMEWORK_VERSION = "v2.1.0";
export const HOUSEHOLDS_VERSION = "v1.0.0";
export const RUBRIC_VERSION = "v2.0.0";
export const JUDGE_VERSION = "v1.0.0";
/** Additive result fields (BENCH2 panels; BENCH2C `capabilityUtilisation` + per-question invocations) — MINOR. */
export const RESULT_SCHEMA_VERSION = "1.2.0";

/** SCORING_FRAMEWORK §5 — the pinned judge model at rubric/judge v1.0.0. */
export const JUDGE_MODEL = "claude-opus-4-8";

/** Frozen benchmark clock (EXECUTION_PROCESS §5). */
export const BENCHMARK_CLOCK = "2026-07-04T00:00:00Z";

function sha256(input: string): string {
  return "sha256:" + createHash("sha256").update(input).digest("hex").slice(0, 32);
}

/** The raw questions fixture (INTQ3 import). */
export interface QuestionsFixture {
  version: string;
  totalQuestions: number;
  categoryOrder: string[];
  questions: Array<{
    id: string;
    category: string;
    utterance: string;
    rationale: string;
    capability: string;
    evidenceExpected: string;
    trustConcern: string;
    grades: { chatgptPredicted: string; claudePredicted: string; actual: string };
  }>;
}

let cachedFixture: QuestionsFixture | null = null;
let cachedFixtureRaw: string | null = null;

export function loadQuestionsFixture(): QuestionsFixture {
  if (!cachedFixture) {
    cachedFixtureRaw = readFileSync(FIXTURE_PATH, "utf8");
    cachedFixture = JSON.parse(cachedFixtureRaw) as QuestionsFixture;
  }
  return cachedFixture;
}

/** Content fingerprint of the runtime Capability Registry (a stand-in "version"). */
export function capabilityRegistryVersion(): string {
  const caps = intelligencePlatform.registry
    .list()
    .map((c) => `${c.id}|${[...c.supportedIntents].sort().join(",")}|${[...c.executableIntents].sort().join(",")}|${c.availability}`)
    .sort();
  return sha256(caps.join("\n"));
}

/** Content fingerprint of the shared knowledge seed. */
export function knowledgeVersion(): string {
  return sha256(JSON.stringify(KNOWLEDGE_SEED_COUNTS));
}

/** The frozen judge prompt (SCORING_FRAMEWORK §5) — hashed to become the `judge` version. */
export const JUDGE_PROMPT_TEMPLATE = `You are the THA Companion Benchmark judge. Score EXACTLY the requested dimension of one Companion turn on the universal 0-4 band (4 exemplary, 3 good, 2 adequate, 1 poor, 0 failed). You are a grader, not a participant: reward truth over tone, never override a deterministic hard-gate, and cite the turn in a one-sentence rationale. You are given only the utterance, the captured turn, and the question's expectation record — never a baseline or an expected grade. Output strict JSON: {"band": <0-4>, "rationale": "<cite the turn>"}.`;

export function judgeDescriptor(invoked: boolean): JudgeDescriptor {
  return {
    model: JUDGE_MODEL,
    temperature: 0,
    promptHash: sha256(JUDGE_PROMPT_TEMPLATE),
    invoked,
  };
}

export function resolveBundle(): BenchmarkBundle {
  const fixture = loadQuestionsFixture();
  return {
    questions: fixture.version,
    households: HOUSEHOLDS_VERSION,
    rubric: RUBRIC_VERSION,
    judge: JUDGE_VERSION,
    framework: FRAMEWORK_VERSION,
    fixtureChecksum: sha256(cachedFixtureRaw ?? JSON.stringify(fixture)),
  };
}

/** A single human-facing bundle version string for the history index. */
export function bundleVersionLabel(bundle: BenchmarkBundle): string {
  // All components are pinned together at v1.0.0 today; surface the questions
  // component as the headline version and note when any component diverges.
  const all = [bundle.questions, bundle.households, bundle.rubric, bundle.judge, bundle.framework];
  const unified = all.every((v) => v === all[0]);
  return unified ? bundle.questions : `${bundle.questions} (mixed)`;
}

function safeGit(cmd: string, fallback: string): string {
  try {
    return execSync(cmd, { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

export function resolveProvenance(): BenchmarkProvenance {
  const commit = safeGit("git rev-parse HEAD", "unknown");
  const branch = safeGit("git rev-parse --abbrev-ref HEAD", "unknown");
  const dirty = safeGit("git status --porcelain", "") !== "";
  return {
    commit,
    branch,
    dirty,
    capabilityRegistryVersion: capabilityRegistryVersion(),
    knowledgeVersion: knowledgeVersion(),
    clock: BENCHMARK_CLOCK,
    executedAt: new Date().toISOString(),
  };
}
