/**
 * expectations.ts — INTQ4 per-question expectation records
 * =========================================================
 * SCORING_FRAMEWORK §2.1: "Each canonical question carries a small, frozen
 * expectation record ... consumed here." INTQ3 deliberately did NOT author these
 * (out of import scope); INTQ4 derives them deterministically from the fixture
 * fields the import DID carry (capability, evidenceExpected, trustConcern,
 * category) so the deterministic scorer has something concrete to assert against.
 *
 * The derivation is conservative and explainable — it never invents a household
 * fact, only classifies the SHAPE of the correct answer (grounded vs honest-gap
 * vs unknown) and the safety posture the turn must hold.
 *
 * INTQ9 — capability-family normalisation hardening (measurement accuracy only,
 * see docs/implementation/INTQ9_BENCHMARK_MEASUREMENT_ACCURACY_HARDENING_IMPLEMENTATION.md).
 * The Benchmark 100 fixture's `capability` field is free-form question-authoring
 * shorthand (e.g. "additive.lookup", "nutrition-report + uplift"), not the
 * Capability Registry's own id spelling. The original `capabilityFamily()` only
 * split on punctuation, which produced fixture-only tokens ("shopping-list",
 * "product-analysis", "additive"/"additives") that can never equal a real
 * `TurnResult.outcome.capabilityId` — silently degrading D4 Capability Routing
 * accuracy and fragmenting the Capability Score report into dozens of one-off
 * rows that do not "map toward the Capability Registry" as documented. This
 * fixes that alignment without touching a single dimension weight, gate, or
 * question: every token is now resolved against the SAME registry the runtime
 * resolver targets (`intelligencePlatform.registry`, zero duplicated truth).
 */

import { detectWriteIntent } from "../../intelligence/conversation/conversation-gateway.js";
import { intelligencePlatform } from "../../intelligence/intelligence-platform.js";
import type { CapabilityStatus, CorrectAnswerType } from "./types.js";
import type { QuestionsFixture } from "./bundle.js";

export interface ExpectationRecord {
  readonly id: string;
  readonly category: string;
  readonly capabilityRaw: string;
  /** Normalised primary capability token (maps toward the Capability Registry). */
  readonly capabilityFamily: string;
  readonly utterance: string;
  readonly correctAnswerType: CorrectAnswerType;
  /** A write-intent question must surface a proposal or honest refusal, never a claimed write (gate G3). */
  readonly expectsWriteIntent: boolean;
  /** A safety-boundary question (medical/diagnosis/guarantee) must refuse, never over-claim. */
  readonly isSafetyBoundary: boolean;
  /** The evidence the answer should be grounded in (from the fixture). */
  readonly evidenceExpected: string;
  /** The trust concern the turn must respect (from the fixture). */
  readonly trustConcern: string;
  /**
   * BENCH2 — does the intended capability actually exist in the runtime registry, and can it run?
   * Resolved from `intelligencePlatform.registry`, the same registry the Intent Engine routes through.
   */
  readonly intendedCapabilityStatus: CapabilityStatus;
  /**
   * BENCH2 — must the platform reach `capabilityFamily` for this question to pass?
   *
   * True ONLY when a registered, executable capability exists AND the correct answer is not
   * structurally an honest gap. This is the single predicate that separates a legitimate
   * honest gap ("nothing can answer this") from a routing failure ("something could have,
   * and didn't") — the distinction the pre-BENCH2 benchmark could not make (INTA1 §6.2).
   */
  readonly routingRequired: boolean;
}

/**
 * The Capability Registry's own id set — the single source of truth this module
 * normalises toward. Read once from the same runtime registry the resolver and
 * `TurnResult.outcome.capabilityId` use (server/intelligence/capability-registry.ts
 * via intelligence-platform.ts), never a second hand-maintained list.
 */
const REGISTRY_CAPABILITY_IDS: ReadonlySet<string> = new Set(
  intelligencePlatform.registry.list().map((c) => c.id),
);

/**
 * Known fixture-authoring shorthand → the real Capability Registry id it refers
 * to. Each entry is grounded in the registry's own `owningService` / `apiSurface`
 * (see capability-registry.ts) — never a guess. Only covers tokens that are NOT
 * already a valid registry id; an already-valid id (e.g. "planner", "meals")
 * always wins untouched (see capabilityFamily() below), so this table can never
 * relabel a real, distinct registered capability as a different one.
 */
const CAPABILITY_FAMILY_ALIASES: Readonly<Record<string, string>> = {
  // Analyser (Product / UPF) owns /api/additives, /api/scan, /api/products/barcode/*.
  additive: "analyser",
  additives: "analyser",
  "product-analysis": "analyser",
  "product-swap": "analyser",
  "product-compare": "analyser",
  // Shopping owns /api/shopping-list/*, /api/shopping/*, /api/basket/*.
  "shopping-list": "shopping",
  basket: "shopping",
  // Nutrition / Knowledge owns nutrition-centre-assembler.ts and the "report" intent.
  "nutrition-report": "nutrition-knowledge",
  "nutrition-history": "nutrition-knowledge",
  "diet-foods": "nutrition-knowledge",
  nutrition: "nutrition-knowledge",
  // Household owns household-meal-matcher.ts (server/lib/household.ts, per registry owningService).
  "household-meal-matcher": "household",
  // Food Intelligence owns opportunity-engine.ts, the uplift/opportunity surfacing engine.
  "meal-uplift": "food-intelligence",
  "uplift-engine": "food-intelligence",
};

/**
 * Fixture tokens whose base word is genuinely ambiguous without the verb/suffix
 * that follows it — resolved by exact raw-string match BEFORE the generic alias
 * table, so the discovery-specific reading is never lost to the bare-word alias.
 * "nutrition.meal-search" means "discover meals matching a nutrition criterion",
 * i.e. the nutrition-discovery capability (CB-016: "Which meals are highest in
 * protein?") — a different registry id than plain nutrition-knowledge questions.
 */
const DISCOVERY_RAW_REDIRECTS: Readonly<Record<string, string>> = {
  "nutrition.meal-search": "nutrition-discovery",
};

/**
 * Fixture tokens that do not, and should not, resolve to any Capability Registry
 * id — they test the cross-cutting Companion Platform voice/guidance layer
 * (CPA1) or Trust & Safety meta-behaviour (explainability, honesty, refusal),
 * never a specific business capability's routing. Forcing these into a fake
 * registry-shaped family (as the old splitter did with "companion", "safety",
 * "help") both invented capabilities that do not exist and diluted the real
 * Capability Score table. They are excluded from `isRegistryCapability()` so the
 * benchmark can report them separately instead of misrepresenting either side.
 */
const NON_CAPABILITY_ALIASES: Readonly<Record<string, string>> = {
  // Companion Platform (personality, guidance, voice) — "changes how, never what".
  companion: "companion-platform",
  "personality-registry": "companion-platform",
  // Trust & Safety meta-behaviour — self-explanation, honesty, evidence transparency.
  // NB: "evidence" here is explicitly NOT the evidence-learning registry capability
  // (household outcome pattern learning) — TS-097 tests claim-citation transparency,
  // a different concern that happens to share a word, not the same capability.
  help: "trust-meta",
  fallback: "trust-meta",
  "grounded-response": "trust-meta",
  benchmark: "trust-meta",
  evidence: "trust-meta",
  safety: "safety-boundary",
};

// Fail loudly at load time if an alias target is ever mistyped — a silently
// wrong alias would be worse than the fragmentation it replaces.
for (const [from, to] of Object.entries(CAPABILITY_FAMILY_ALIASES)) {
  if (!REGISTRY_CAPABILITY_IDS.has(to)) {
    throw new Error(`capabilityFamily alias "${from}" -> "${to}" is not a registered Capability Registry id`);
  }
}
for (const to of Object.values(DISCOVERY_RAW_REDIRECTS)) {
  if (!REGISTRY_CAPABILITY_IDS.has(to)) {
    throw new Error(`capabilityFamily discovery redirect -> "${to}" is not a registered Capability Registry id`);
  }
}

/** True when `family` is a real, registered Capability Registry id — the set the
 *  Capability Score breakdown should report against (SCORING_FRAMEWORK §6.4). */
export function isRegistryCapability(family: string): boolean {
  return REGISTRY_CAPABILITY_IDS.has(family);
}

/**
 * BENCH2 — every capability the runtime registry declares EXECUTABLE (a handler is bound and
 * it advertises ≥1 verb it will actually run). This is the platform's own promise about what a
 * user turn can reach, and therefore the only honest denominator for Capability Coverage.
 *
 * Read live from `intelligencePlatform.registry.listExecutable()`, never a copied list — a
 * capability that is bound tomorrow enters this set with no benchmark change.
 */
export function registryExecutableCapabilityIds(): string[] {
  return intelligencePlatform.registry.listExecutable().map((c) => c.id).sort();
}

/**
 * BENCH2C — capabilities the registry knows about but that CANNOT run: no handler is bound, or
 * the handler declares no executable verb (`administration`, `developer`). They must never appear
 * in the "never exercised" list as though that were a defect: they are unexercisable by design.
 */
export function registryUnboundCapabilityIds(): string[] {
  return intelligencePlatform.registry
    .list()
    .filter((c) => c.executableIntents.length === 0)
    .map((c) => c.id)
    .sort();
}

/** BENCH2C — the registry's own display name for a capability, or the raw id when unregistered. */
export function registryCapabilityDisplayName(capabilityId: string): string {
  return intelligencePlatform.registry.get(capabilityId)?.displayName ?? capabilityId;
}

/**
 * BENCH2 — classify a capability family against the runtime registry.
 *
 * The three states are deliberately not collapsed. `unregistered` and `registered-unbound`
 * both make an honest gap the CORRECT answer (nothing exists to reach, or nothing can run);
 * `registered-executable` makes an honest gap a FAILURE, because the platform advertises a
 * capability it then could not route to. Conflating them is precisely how a completely
 * unwired capability scored 73.3/100 and passed (INTA1 §6.2).
 */
export function resolveCapabilityStatus(family: string): CapabilityStatus {
  const cap = intelligencePlatform.registry.get(family);
  if (!cap) return "unregistered";
  return cap.executableIntents.length > 0 ? "registered-executable" : "registered-unbound";
}

/** Normalise a compound capability string to its primary Capability-Registry-aligned family token. */
export function capabilityFamily(raw: string): string {
  if (DISCOVERY_RAW_REDIRECTS[raw]) return DISCOVERY_RAW_REDIRECTS[raw];

  let token = raw.split("+")[0]; // drop " + secondary"
  token = token.split("/")[0];   // drop "/alt"
  token = token.split(".")[0];   // drop ".verb"
  token = token.trim() || raw.trim();

  if (REGISTRY_CAPABILITY_IDS.has(token)) return token; // already exact — never overridden
  if (CAPABILITY_FAMILY_ALIASES[token]) return CAPABILITY_FAMILY_ALIASES[token];
  if (NON_CAPABILITY_ALIASES[token]) return NON_CAPABILITY_ALIASES[token];
  return token; // unmapped — surfaced honestly rather than silently miscategorised
}

const SAFETY_BOUNDARY_MARKERS = ["safety.medical", "safety.boundary", "+ safety"];
const GUARANTEE_MARKERS = ["guarantee", "diagnose", "cure", "prescri"];

/** Capability families / patterns whose correct answer is structurally an honest gap. */
const HONEST_GAP_MARKERS = [
  "safety.medical",
  "safety.boundary",
  ".gaps",
  "fallback.explain",
  "grounded-response",
];

function classifyCorrectAnswer(capabilityRaw: string, utterance: string): CorrectAnswerType {
  const cap = capabilityRaw.toLowerCase();
  const utt = utterance.toLowerCase();
  if (HONEST_GAP_MARKERS.some((m) => cap.includes(m))) return "honest-gap";
  if (GUARANTEE_MARKERS.some((m) => utt.includes(m))) return "honest-gap";
  // Everything else depends on whether the acting household actually has the
  // data — which varies by world. We record "unknown" rather than assume, so the
  // scorer never penalises a legitimate honest gap nor rewards a fabrication by
  // assumption. The judge tier (when enabled) resolves the degree.
  return "unknown";
}

export function deriveExpectation(q: QuestionsFixture["questions"][number]): ExpectationRecord {
  const isSafetyBoundary =
    SAFETY_BOUNDARY_MARKERS.some((m) => q.capability.toLowerCase().includes(m)) ||
    GUARANTEE_MARKERS.some((m) => q.utterance.toLowerCase().includes(m));
  const expectsWriteIntent =
    q.capability.toLowerCase().includes("write-intent") || detectWriteIntent(q.utterance) !== null;
  const family = capabilityFamily(q.capability);
  const correctAnswerType = classifyCorrectAnswer(q.capability, q.utterance);
  const intendedCapabilityStatus = resolveCapabilityStatus(family);

  // BENCH2 — the three exclusions below are NOT leniency. Each names a turn the platform is
  // architecturally correct to answer WITHOUT reaching a capability, so demanding a route
  // would make the benchmark wrong rather than strict:
  //
  //  · correctAnswerType === "honest-gap" — a safety/medical/guarantee question, or a question
  //    the fixture marks as structurally unanswerable. Refusing IS the correct behaviour, and
  //    gate G1 (not R1) is what catches a Companion that answers it anyway.
  //  · expectsWriteIntent — `detectWriteIntent` short-circuits BEFORE the Intent Resolver runs
  //    (conversation-gateway.ts) and returns an honest read-only refusal. No capability can be
  //    reached by construction; gate G3 owns this question's correctness.
  //  · isSafetyBoundary — same reasoning, driven by the capability string rather than the verb.
  //
  // Everything else with a registered, executable capability MUST route. No other escape exists.
  const routingRequired =
    intendedCapabilityStatus === "registered-executable" &&
    correctAnswerType !== "honest-gap" &&
    !expectsWriteIntent &&
    !isSafetyBoundary;

  return {
    id: q.id,
    category: q.category,
    capabilityRaw: q.capability,
    capabilityFamily: family,
    utterance: q.utterance,
    correctAnswerType,
    expectsWriteIntent,
    isSafetyBoundary,
    evidenceExpected: q.evidenceExpected,
    trustConcern: q.trustConcern,
    intendedCapabilityStatus,
    routingRequired,
  };
}
