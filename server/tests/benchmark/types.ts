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

// ─────────────────────────────────────────────────────────────────────────────
// BENCH2 — Routing integrity (SCORING_FRAMEWORK §4.1)
//
// Before BENCH2 the benchmark could not tell a capability that DOES NOT EXIST
// (a legitimate honest gap, the highest-rewarded outcome) apart from a
// capability that EXISTS AND IS EXECUTABLE but was never reached (a routing
// failure that the platform must never be credited for). Both surfaced as
// `fallbackState: "no-route"` and both scored ~73/100 — see
// docs/investigations/intelligence/INTA1_INTELLIGENCE_PLATFORM_WIRING_AUDIT.md §6.2.
//
// These types make the distinction first-class and machine-checkable. Nothing
// here reaches inside the Companion: every field is derived from the captured
// turn plus the runtime Capability Registry the Companion itself uses.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Does the capability a question intends actually exist, and can it run?
 * Resolved against the SAME runtime registry the Intent Engine routes through
 * (`intelligencePlatform.registry`), never a hand-maintained second list.
 */
export type CapabilityStatus =
  /** Registered AND a handler is bound with ≥1 executable verb — reaching it is REQUIRED. */
  | "registered-executable"
  /** Registered but no executable verb (foundation state / `availability: "never"`) — an honest gap is correct. */
  | "registered-unbound"
  /** No registry entry at all (cross-cutting Companion/Trust question, or genuinely absent) — an honest gap is correct. */
  | "unregistered";

/**
 * The four states BENCH2 exists to separate. Exactly one is assigned per question.
 *
 *  1. `honest-gap-valid`  — no suitable capability exists (or routing is structurally
 *                           not expected). The honest gap is the correct answer and is
 *                           still rewarded, exactly as before.
 *  2. `capability-miss`   — a registered, executable capability existed and NOTHING was
 *                           invoked. A benchmark failure (gate R1), never an honest gap.
 *  3. `reached-other`     — some capability was invoked, but not the intended one. When
 *                           routing was required this is a misroute (gate R2).
 *  4. `reached-intended`  — the intended capability was invoked. Answer quality is now the
 *                           only thing left to judge (D1/D5/D7 + the judge tier).
 */
export type RoutingOutcome =
  | "reached-intended"
  /**
   * BENCHINT4 (T1.1) — the intended capability was not reached, but a capability the FIXTURE
   * ITSELF names as a secondary was. 45 of the 100 fixture questions carry a compound
   * capability ("shopping-list + analyser"), and `capabilityFamily()` keeps only the primary
   * token. Before this state existed, a turn that invoked the fixture's own secondary was
   * scored identically to a turn that invoked something wholly unrelated — six of the twelve
   * R2 misroutes in `2026-07-10T10-48-57Z__8e10ea3` were of the former kind (BENCHINT3 §1).
   *
   * It is still a routing failure and still fires gate R2: the question names a primary and
   * the platform did not reach it. The state exists so the Routing Failure Report can say
   * WHICH kind of failure it was, not to forgive it. Widening R2's pass set would move the
   * headline for a reason unrelated to the platform's behaviour.
   */
  | "reached-secondary"
  | "reached-other"
  | "capability-miss"
  | "honest-gap-valid";

/** Why no capability was reached (or why the wrong one was). Recorded on every non-`reached-intended` turn. */
export type RoutingFailureReason =
  /** The Intent Resolver produced no route for this utterance (`fallbackState: "no-route"`). */
  | "intent-unresolved"
  /** A capability was invoked, but not the intended one. */
  | "wrong-capability"
  /** BENCHINT4 — the fixture's own SECONDARY capability was invoked; its primary was not. */
  | "secondary-capability"
  /** The engine's LOCATE step found no such capability id (`unknown_capability`). */
  | "capability-unregistered"
  /** The capability exists but does not support the resolved verb (`unsupported_intent`). */
  | "verb-unsupported"
  /** Registered, but no handler is bound (`not_executable`). */
  | "capability-not-executable"
  /** The acting identity is not permitted to invoke it (`denied`). */
  | "permission-denied"
  /** A confirmation tier blocked invocation (`confirmation_required`). */
  | "confirmation-required"
  /** The registry itself declares this (capability, verb) an honest gap (`gap`). */
  | "registered-honest-gap"
  /** The write-intent guard declined before the resolver ran — correct, read-only behaviour. */
  | "write-intent-declined"
  /** A capability ran but produced nothing (`no-knowledge` / `no-results`). */
  | "knowledge-gap"
  /** The turn threw, or returned `internal-error`. Gate G5 owns this; no routing gate is added. */
  | "internal-error"
  /** The LLM provider was not configured, so the gateway short-circuited before routing. */
  | "llm-provider-unavailable"
  /** Nothing was reached and the turn carried no fallbackState and no outcome — an unexplained miss. */
  | "no-signal";

/** The two routing gates (SCORING_FRAMEWORK §4.1). Distinct from the five Tier-A safety gates. */
export type RoutingGateKey = "R1" | "R2";

/** The per-question routing record — the intended capability, what actually ran, and why. */
export interface RoutingRecord {
  /** The Capability-Registry-aligned capability this question intends to exercise. */
  readonly intendedCapability: string;
  /**
   * BENCHINT4 — the other capabilities the fixture's compound expectation names
   * ("shopping-list + analyser" → `["analyser"]`). Empty for a single-capability question.
   * Reaching one of these is `reached-secondary`, which is reported distinctly from a misroute
   * into an unrelated capability and still gated.
   */
  readonly secondaryCapabilities: readonly string[];
  /** Whether that capability exists in the runtime registry and can execute. */
  readonly intendedCapabilityStatus: CapabilityStatus;
  /**
   * True when the platform MUST reach `intendedCapability` for this question.
   * False for structural honest gaps (write-intent refusals, safety boundaries)
   * and for questions whose intended capability does not exist — those keep the
   * pre-BENCH2 honest-gap reward.
   */
  readonly routingRequired: boolean;
  /** Every routed (non-baseline) capability the turn actually invoked, in resolver order. */
  readonly invokedCapabilities: string[];
  /** Which signal `invokedCapabilities` was derived from — the benchmark never guesses silently. */
  readonly invokedCapabilitiesSource: InvokedCapabilitiesSource;
  readonly outcome: RoutingOutcome;
  readonly failureReason: RoutingFailureReason | null;
  /** One human sentence explaining `outcome` + `failureReason`, for the Routing Failure Report. */
  readonly explanation: string;
}

/**
 * Where `invokedCapabilities` came from. The gateway persists the full routed set on the
 * assistant turn (`conversation_turns.resolved_intent`, INT39); when that is readable we use
 * it. When it is not, we fall back to the single `TurnResult.outcome.capabilityId` and say so
 * rather than reporting a narrower set as if it were complete.
 */
export type InvokedCapabilitiesSource = "resolved-intent" | "outcome-only" | "none";

// ─────────────────────────────────────────────────────────────────────────────
// BENCH2C — Capability Utilisation
//
// BENCH2 answers "did the platform reach the capability it advertises?". BENCH2C answers
// "which capabilities actually RAN, how long did each take, did it succeed, and did it feed
// the answer?" — plus the two negatives: registered capabilities never exercised, and
// benchmark questions answered without invoking any registered capability at all.
//
// Every field below is observed at the platform's own `handle()` seam (capability-probe.ts)
// or joined from the routed set the gateway already persists. Nothing is re-derived from a
// second source of truth, and nothing is written to any store.
// ─────────────────────────────────────────────────────────────────────────────

import type { CapabilityInvocation } from "./capability-probe.js";
export type { CapabilityInvocation, CapabilityContribution } from "./capability-probe.js";

/** One row of the Capability Utilisation Dashboard — a registered capability's whole run. */
export interface CapabilityUtilisationRow {
  readonly capabilityId: string;
  readonly displayName: string;
  /** Registry truth: is a handler bound with ≥1 executable verb? */
  readonly registered: boolean;
  readonly executable: boolean;
  /** Total invocations across every question in the run (a question may invoke one twice). */
  readonly invocations: number;
  /** Distinct benchmark questions that invoked it at least once. */
  readonly questions: number;
  /** Invocations whose `IntentOutcome.status === "ok"`. */
  readonly succeeded: number;
  /** Invocations that returned an honest non-ok outcome, or threw. */
  readonly failed: number;
  /** Of `failed`, those that threw rather than returning a structured outcome. */
  readonly threw: number;
  readonly successRate: number;         // succeeded / invocations, 0–1
  /** Invocations whose result entered the LLM's CONTEXT DATA block — it grounded the answer. */
  readonly contributedToAnswer: number;
  readonly contributionRate: number;    // contributedToAnswer / invocations, 0–1
  /** Invocations that were baseline, context-only reads rather than a route for the question. */
  readonly baselineInvocations: number;
  /** True execution time of the LOCATE → … → INVOKE pipeline, observed per invocation. */
  readonly meanDurationMs: number;
  readonly p95DurationMs: number;
  readonly maxDurationMs: number;
  readonly totalDurationMs: number;
  /** Every distinct verb the capability was invoked with. */
  readonly verbs: string[];
  /** Every distinct outcome status observed, with its count. */
  readonly statuses: Record<string, number>;
}

/** A benchmark question that produced an answer without invoking ANY registered capability. */
export interface BypassedQuestion {
  readonly id: string;
  readonly domain: string;
  readonly utterance: string;
  readonly intendedCapability: string;
  readonly intendedCapabilityStatus: CapabilityStatus;
  /**
   * `structural` — the platform is architecturally correct not to route (a write-intent refusal,
   * a safety boundary, or no executable capability exists). `defect` — a registered, executable
   * capability existed and nothing ran (BENCH2 gate R1).
   */
  readonly kind: "structural" | "defect";
  readonly routingGate: RoutingGateKey | null;
  readonly failureReason: RoutingFailureReason | null;
  readonly fallbackState: string | null;
}

/** CAPABILITY UTILISATION — which registered capabilities the run actually exercised. */
export interface CapabilityUtilisationPanel {
  /**
   * False when no probe could be installed. Every count below is then zero, and the report
   * says "not observed" rather than presenting an empty table as "this run used no capabilities".
   */
  readonly probeActive: boolean;
  /** Every registry capability with ≥1 invocation, busiest first. */
  readonly exercised: CapabilityUtilisationRow[];
  /** Registered, executable capabilities with ZERO invocations in this run. */
  readonly neverExercised: string[];
  readonly neverExercisedCount: number;
  /** Registered but unbound capabilities (`administration`, `developer`) — cannot run by design. */
  readonly registeredUnbound: string[];
  /** Questions that answered without invoking any registered capability. */
  readonly bypassedQuestions: BypassedQuestion[];
  readonly bypassedStructural: number;
  readonly bypassedDefect: number;
  /** Run totals. */
  readonly totalInvocations: number;
  readonly totalCapabilityTimeMs: number;
  /** Share of the run's wall-clock spent inside capability execution (the rest is LLM + gateway). */
  readonly capabilityTimeShareOfRun: number;
  /** Distinct executable capabilities exercised / distinct executable capabilities registered. */
  readonly utilisationPct: number;
}

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
  /**
   * The clock the run had. `"wall"` — the real system clock — for every run today.
   *
   * BENCHINT2 (D10): this field previously always carried a frozen ISO instant that nothing ever
   * injected, so the artefact asserted a temporal grounding the run did not have. It now reports
   * the truth. See `BENCHMARK_CLOCK` in bundle.ts.
   */
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
  /** BENCH2 — the routing gate, if one fired. Independent of the Tier-A safety gate. */
  readonly routingGate: RoutingGateKey | null;
  /** BENCH2 — intended vs actual capability, and why routing failed. */
  readonly routing: RoutingRecord;
  /** BENCH2 — the turn asserted where it should have admitted a gap (gate G1). The deterministic hallucination signal. */
  readonly hallucination: boolean;
  /** BENCH2C — every capability this question actually invoked, with its outcome, duration and contribution. */
  readonly capabilityInvocations: CapabilityInvocation[];
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

// ─────────────────────────────────────────────────────────────────────────────
// BENCH2 — the four reporting panels the headline must never be allowed to hide
// ─────────────────────────────────────────────────────────────────────────────

/** ROUTING ACCURACY — did the platform reach the capabilities it advertises? */
export interface RoutingPanel {
  /** Questions whose intended capability is registered, executable, and structurally reachable. */
  readonly routingRequiredQuestions: number;
  /** Of those, the share where ANY capability was invoked. "Did we get into the engine at all?" */
  readonly capabilityReachPct: number;
  /** Of those, the share where the INTENDED capability was invoked. "Did we get to the right one?" */
  readonly intentResolutionAccuracyPct: number;
  /** R1 count — a registered, executable capability existed and nothing was invoked. */
  readonly capabilityMisses: number;
  /** R2 count — a capability was invoked, but not the intended one. */
  readonly misroutes: number;
  /**
   * BENCHINT4 — of `misroutes`, how many reached a capability the question's OWN compound
   * expectation names as a secondary. Reported alongside, never subtracted from, `misroutes`:
   * both numbers are needed to read the trend line across the change that introduced this one.
   */
  readonly misroutesReachingSecondary: number;
  /** Registered+executable capabilities the fixture intends but that NO question in this run ever invoked. */
  readonly unreachableCapabilities: string[];
  readonly unreachableCapabilityCount: number;
  /** Every `RoutingFailureReason` seen, with its count — the routing-failure histogram. */
  readonly failureReasons: Record<string, number>;
  /** Honest gaps the benchmark still accepts, because no suitable capability exists. */
  readonly validHonestGaps: number;
  /** How `invokedCapabilities` was resolved across the run (see InvokedCapabilitiesSource). */
  readonly invokedCapabilitiesSource: InvokedCapabilitiesSource | "mixed";
}

/** CAPABILITY COVERAGE — which registered capabilities does the suite actually exercise? */
export interface CoveragePanel {
  /** Distinct registered+executable capabilities the fixture intends. */
  readonly intendedCapabilities: string[];
  /** Distinct registered+executable capabilities at least one question actually invoked. */
  readonly invokedCapabilities: string[];
  /** invokedCapabilities / intendedCapabilities. "Of what we test, how much can we reach?" */
  readonly intendedCoveragePct: number;
  /** Every executable capability in the runtime registry (the denominator the platform advertises). */
  readonly registryExecutableCapabilities: string[];
  /** invokedCapabilities / registryExecutableCapabilities. "Of what the platform claims, how much do we exercise?" */
  readonly registryCoveragePct: number;
  /** Executable capabilities the fixture never intends — an untested surface, not a platform defect. */
  readonly untestedCapabilities: string[];
}

/** One Capability-Coverage-by-Domain row. */
export interface CoverageByDomainRow {
  readonly domain: string;
  readonly questions: number;
  readonly routingRequired: number;
  readonly reachedAny: number;
  readonly reachedIntended: number;
  readonly capabilityReachPct: number;
  readonly intentResolutionAccuracyPct: number;
  readonly capabilityMisses: number;
  readonly misroutes: number;
  readonly validHonestGaps: number;
}

/** One row of the Routing Failure Report. */
export interface RoutingFailureRow {
  readonly id: string;
  readonly domain: string;
  readonly utterance: string;
  readonly intendedCapability: string;
  readonly intendedCapabilityStatus: CapabilityStatus;
  readonly invokedCapabilities: string[];
  readonly outcome: RoutingOutcome;
  readonly failureReason: RoutingFailureReason | null;
  readonly routingGate: RoutingGateKey | null;
  readonly fallbackState: string | null;
  readonly explanation: string;
}

/**
 * ANSWER QUALITY — measured ONLY on questions that reached the intended capability.
 * A platform that never routes cannot claim an answer-quality score; separating this
 * from the headline is the whole point of BENCH2.
 */
export interface QualityPanel {
  /** Questions in the denominator: those with `routing.outcome === "reached-intended"`. */
  readonly questionsScored: number;
  readonly meanComposite: number;
  readonly meanD1Band: number;   // Factual Correctness
  readonly meanD5Band: number;   // Relevance & Completeness
  readonly meanD7Band: number;   // Presentation & Structure
  /** Reached the intended capability, but the capability produced nothing (`no-knowledge` / `no-results`). */
  readonly reachedButEmpty: number;
  /** True when the judge tier graded D1/D5; false means these are conservative deterministic proxies. */
  readonly judgeInvoked: boolean;
}

/** HALLUCINATION RATE — asserted where it should have admitted (gate G1). */
export interface HallucinationPanel {
  readonly count: number;
  /** count / questionsScored, 0–1. */
  readonly rate: number;
  readonly questionIds: string[];
  /** Exactly what this number is derived from — never presented as more than it measures. */
  readonly basis: string;
}

/** The run environment the score is only valid within. */
export interface BenchmarkEnvironment {
  /** False ⇒ the gateway short-circuits before routing and every answer-quality dimension is meaningless. */
  readonly llmProviderAvailable: boolean;
  readonly judgeInvoked: boolean;
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
    /** BENCH2 — routing gates fired (R1 + R2). A non-zero value means the platform failed to reach itself. */
    readonly routingGatesFired: number;
    /** BENCH2 — of routing-required questions, the share that reached the intended capability. 0–1. */
    readonly intentResolutionAccuracy: number;
    /** BENCH2 — of routing-required questions, the share that reached any capability. 0–1. */
    readonly capabilityReach: number;
    /** BENCH2 — asserted-where-a-gap-was-correct rate. 0–1. */
    readonly hallucinationRate: number;
  };
  /** BENCH2 — the run environment the score is only valid within. */
  readonly environment: BenchmarkEnvironment;
  /** BENCH2 — Routing Accuracy, reported separately from Answer Quality and Safety. */
  readonly routing: RoutingPanel;
  /** BENCH2 — Capability Coverage: what the suite tests vs what the registry advertises. */
  readonly coverage: CoveragePanel;
  /** BENCH2 — Capability Coverage by Domain. */
  readonly coverageByDomain: CoverageByDomainRow[];
  /** BENCH2 — every question that failed to reach its intended capability, and why. */
  readonly routingFailures: RoutingFailureRow[];
  /** BENCH2 — Answer Quality, measured only where routing succeeded. */
  readonly quality: QualityPanel;
  /** BENCH2 — Hallucination Rate (gate G1). */
  readonly hallucination: HallucinationPanel;
  /** BENCH2C — Capability Utilisation Dashboard: what ran, how fast, and what never ran at all. */
  readonly capabilityUtilisation: CapabilityUtilisationPanel;
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
  /**
   * BENCH2 — the rubric component's own version. Baseline selection requires a matching
   * rubric MAJOR: a rubric change re-grades every question, so a cross-rubric delta would be
   * a re-baseline reported as a regression (README §4 forbids exactly that). Absent on
   * pre-BENCH2 index rows, which therefore never match a v2 rubric — the intended re-baseline.
   */
  readonly rubricVersion?: string;
  readonly headlineScore: number;
  readonly honestGapRate: number;
  readonly gatesFired: number;
  /** BENCH2 — routing gates fired (R1 + R2). */
  readonly routingGatesFired?: number;
  /** BENCH2 — intent resolution accuracy, 0–1. */
  readonly intentResolutionAccuracy?: number;
  readonly verdict: ReleaseReadiness["verdict"];
}
