/**
 * types.ts — INTQ4 Intelligence Benchmark Execution Platform
 * ===========================================================
 * The machine-readable result artefact schema and run-mode contracts for the
 * THA Companion Benchmark. This is the single source of truth every consumer
 * (runner, scorer, report renderer, history store, admin API, dashboard) shares.
 *
 * The shape follows BENCHMARK_AUTOMATION.md §3 (`result.json`) and is extended
 * only additively with the fields INTQ4's displays require (domain / personality
 * / household breakdowns, release readiness, top improvements/regressions).
 *
 * Governing framework: docs/intelligence/benchmark/ (README §3–4, AUTOMATION §3,
 * SCORING_FRAMEWORK §6, REPORT_TEMPLATE). Nothing here changes Companion
 * behaviour — these are observation records only.
 */

/** The three benchmark depths INTQ4 supports (README / task scope). */
export type BenchmarkMode = "quick" | "full" | "certification";

/** The seven scoring dimensions (SCORING_FRAMEWORK §1). */
export type DimensionKey = "D1" | "D2" | "D3" | "D4" | "D5" | "D6" | "D7";

/** The five hard-gates (SCORING_FRAMEWORK §4). */
export type GateKey = "G1" | "G2" | "G3" | "G4" | "G5";

/** SCORING_FRAMEWORK §3.2 — a question's correct answer is grounded or an honest gap. */
export type CorrectAnswerType = "grounded" | "honest-gap" | "unknown";

/** The five co-versioned bundle components (README §3) + resolved provenance. */
export interface BenchmarkBundle {
  readonly questions: string;
  readonly households: string;
  readonly rubric: string;
  readonly judge: string;
  readonly framework: string;
  readonly fixtureChecksum: string;
}

/** Everything needed to reproduce/audit a run (REPORT_TEMPLATE §8). */
export interface BenchmarkProvenance {
  /** Git commit the Companion (subject) was built from. */
  readonly commit: string;
  readonly branch: string;
  readonly dirty: boolean;
  /** Content fingerprint of the runtime Capability Registry (INTQ4 link requirement). */
  readonly capabilityRegistryVersion: string;
  /** Content fingerprint of the shared knowledge seed (INTQ4 link requirement). */
  readonly knowledgeVersion: string;
  /** Frozen benchmark clock (EXECUTION_PROCESS §5). */
  readonly clock: string;
  /** ISO timestamp the run executed. */
  readonly executedAt: string;
}

/** The pinned judge descriptor (SCORING_FRAMEWORK §5). */
export interface JudgeDescriptor {
  readonly model: string;
  readonly temperature: number;
  readonly promptHash: string;
  /** Whether the judge tier actually ran this run, or scoring was deterministic-only. */
  readonly invoked: boolean;
}

/** Per-dimension band (0–4) and derived points contribution (SCORING_FRAMEWORK §3.1). */
export interface DimensionScore {
  readonly band: number;         // 0–4
  readonly points: number;       // band/4 × weight
  readonly weight: number;
  /** Whether the band was set deterministically or by the judge. */
  readonly source: "deterministic" | "judge";
  readonly rationale?: string;
}

/** A single scored question — one entry in result.questions[]. */
export interface QuestionResult {
  readonly id: string;
  readonly category: string;              // domain (one of the 10 canonical)
  readonly capability: string;            // raw capability string from the fixture
  readonly capabilityFamily: string;      // normalised primary capability token
  readonly household: string;             // benchmark household id (or "live" in single-world mode)
  readonly utterance: string;
  readonly correctAnswerType: CorrectAnswerType;
  readonly composite: number;             // 0–100 after hard-gate cap
  readonly rawComposite: number;          // Σ dimensionPoints before the gate cap
  readonly gate: GateKey | null;
  readonly bands: Record<DimensionKey, DimensionScore>;
  readonly reachedCapability: string | null;
  readonly fallbackState: string | null;
  readonly latencyMs: number;
  readonly error: string | null;
  /** The Companion's actual response text (truncated), retained for the detail appendix. */
  readonly responsePreview: string;
  readonly personality: string;
  /** Count of entity references in the Companion's response. */
  readonly entityRefCount: number;
  /** Count of actions proposed or confirmed in the Companion's response. */
  readonly actionCount: number;
}

/** Rolled-up dimension score (SCORING_FRAMEWORK §6.3). */
export interface DimensionRollup {
  readonly key: DimensionKey;
  readonly name: string;
  readonly weight: number;
  readonly points: number;      // mean points across scored questions
  readonly bandPct: number;     // 0–1
}

/** A grouped rollup row (domain / capability / household / personality). */
export interface GroupRollup {
  readonly key: string;
  readonly label: string;
  readonly n: number;
  readonly mean: number;        // mean composite
  readonly gates: number;
}

/** A movement vs baseline (top improvements / regressions). */
export interface Movement {
  readonly key: string;
  readonly label: string;
  readonly delta: number;
  readonly current: number;
  readonly baseline: number;
}

/** Overall PASS / PARTIAL / FAIL verdict + release-readiness reasons. */
export interface ReleaseReadiness {
  readonly verdict: "PASS" | "PARTIAL" | "FAIL";
  readonly blockers: string[];
  readonly warnings: string[];
  readonly notes: string[];
}

/** The complete run artefact (result.json). */
export interface BenchmarkResult {
  readonly schemaVersion: string;
  readonly runId: string;
  readonly mode: BenchmarkMode;
  readonly status: "scored" | "aborted" | "framework-only";
  readonly abortReason: string | null;
  readonly bundle: BenchmarkBundle;
  readonly subject: BenchmarkProvenance;
  readonly judge: JudgeDescriptor;
  readonly repeats: number;
  /** "single-world" = ran against the acting admin's live household context;
   *  "benchmark-world" = ran against a permanent INTQ6 Benchmark Household
   *  (DEV world, reset to canonical state — see server/benchmark/);
   *  "deterministic-households" = ran against the disposable-DB certification
   *  fixtures (BENCHMARK_HOUSEHOLDS.md seed contract). */
  readonly worldMode: "single-world" | "benchmark-world" | "deterministic-households";
  readonly headline: {
    readonly score: number;             // Overall Intelligence Score, 0–100
    readonly honestGapRate: number;     // 0–1
    readonly gatesFired: number;
    readonly questionsScored: number;
    readonly meanLatencyMs: number;
  };
  readonly dimensions: DimensionRollup[];
  readonly domains: GroupRollup[];         // Domain Scores (per category)
  readonly capabilities: GroupRollup[];    // Capability Scores — registry-aligned families only (INTQ9)
  readonly capabilitiesCrossCutting: GroupRollup[]; // Non-capability families: Companion Platform / Trust-Safety meta (INTQ9)
  readonly households: GroupRollup[];      // Household Scores
  readonly personalities: GroupRollup[];   // Personality Scores
  readonly safety: Record<GateKey, string[]>;
  readonly topImprovements: Movement[];
  readonly topRegressions: Movement[];
  readonly failedQuestions: string[];
  readonly newlyFailing: string[];
  readonly newlyPassing: string[];
  readonly releaseReadiness: ReleaseReadiness;
  readonly questions: QuestionResult[];
  readonly baselineRunId: string | null;
  /** Total wall-clock of the run, ms. */
  readonly durationMs: number;
}

/** Lightweight history index row (AUTOMATION §4). */
export interface HistoryIndexEntry {
  readonly runId: string;
  readonly mode: BenchmarkMode;
  readonly status: BenchmarkResult["status"];
  readonly executedAt: string;
  readonly commit: string;
  readonly branch: string;
  readonly bundleVersion: string;
  readonly headlineScore: number;
  readonly honestGapRate: number;
  readonly gatesFired: number;
  readonly verdict: ReleaseReadiness["verdict"];
}
