/**
 * test-intelligence-observability.ts — INT35B
 * ============================================
 * Tests for Companion Learning & Observability. No database, no OpenAI API
 * required (explicit log slices + injected stubs).
 *
 * Coverage:
 *   §1  normalizeUtterance — grouping key
 *   §2  summarizeCompanionHealth — stage/state/surface aggregation
 *   §3  matcher backlog — grouping, ranking, unmatchedUtteranceBacklog
 *   §4  routingFailures — capability-side gaps, distinct from the backlog
 *   §5  privacy — the summary carries no user data (it never receives any)
 *   §6  matcher-suggester — advisory-only, capability-constrained, degraded paths
 *   §7  gateway — fallbackState surfaced end-to-end for all four states + success
 *   §8  resolver — INT35B coverage expansion + INT35 regression
 *
 * Run: npx tsx server/tests/test-intelligence-observability.ts
 */

import {
  normalizeUtterance,
  summarizeCompanionHealth,
  unmatchedUtteranceBacklog,
} from "../intelligence/conversation/companion-observability.js";
import {
  suggestMatcherImprovements,
  KNOWN_CAPABILITIES,
} from "../intelligence/conversation/matcher-suggester.js";
import type { UnsuccessfulQueryLogEntry } from "../intelligence/conversation/turn-fallback.js";
import {
  ConversationGateway,
  type HandleIntentFn,
} from "../intelligence/conversation/conversation-gateway.js";
import {
  InMemoryConversationStore,
  resetInMemoryIds,
} from "../intelligence/conversation/conversation-store.js";
import { PatternIntentResolver } from "../intelligence/pattern-intent-resolver.js";
import type {
  IIntentResolver,
  IntentResolutionHints,
  ResolvedIntent,
} from "../intelligence/intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import type { IntelligenceContext, IntentOutcome } from "../intelligence/types.js";

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

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
    console.error(`  ✗ ${label}`);
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──────────────────────────────────────────`);
}

// ---------------------------------------------------------------------------
// Log builders
// ---------------------------------------------------------------------------

let clock = 0;
function ts(): string {
  // Deterministic, monotonically-increasing ISO timestamps.
  return new Date(Date.UTC(2026, 6, 2, 0, 0, clock++)).toISOString();
}

function unmatched(
  utterance: string,
  surface: UnsuccessfulQueryLogEntry["surface"] = "floating",
): UnsuccessfulQueryLogEntry {
  return { timestamp: ts(), stage: "resolver-unmatched", surface, utterance, intents: [] };
}

function fallback(
  state: NonNullable<UnsuccessfulQueryLogEntry["state"]>,
  utterance: string,
  intents: UnsuccessfulQueryLogEntry["intents"] = [],
  surface: UnsuccessfulQueryLogEntry["surface"] = "floating",
): UnsuccessfulQueryLogEntry {
  return { timestamp: ts(), stage: "turn-fallback", state, surface, utterance, intents };
}

// ---------------------------------------------------------------------------
// Gateway stubs (mirror test-intelligence-fallback.ts)
// ---------------------------------------------------------------------------

class StubLlm implements ILlmProvider {
  readonly modelName = "stub";
  readonly isAvailable: boolean;
  calls = 0;
  constructor(
    private readonly reply: string = '{"text": "grounded answer", "entityRefs": []}',
    private readonly shouldThrow = false,
    available = true,
  ) {
    this.isAvailable = available;
  }
  async complete(_request: LlmRequest): Promise<LlmResponse> {
    this.calls++;
    if (this.shouldThrow) throw new Error("stub LLM failure");
    return { content: this.reply, model: this.modelName };
  }
}

class StubResolver implements IIntentResolver {
  constructor(private readonly results: ResolvedIntent[]) {}
  async resolve(): Promise<ResolvedIntent[]> {
    return this.results;
  }
}

function stubHandle(perCapability: Record<string, IntentOutcome | Error>): HandleIntentFn {
  return async (intent) => {
    const o = perCapability[intent.capabilityId];
    if (o instanceof Error) throw o;
    if (o) return o;
    return { status: "ok", capabilityId: intent.capabilityId, verb: intent.verb, message: "ok", result: { note: "default" } };
  };
}

function makeGateway(resolver: IIntentResolver, llm: ILlmProvider, handle: HandleIntentFn): ConversationGateway {
  resetInMemoryIds();
  return new ConversationGateway(new InMemoryConversationStore(), llm, resolver, handle);
}

function makeCtx(userId = 42): IntelligenceContext {
  return { role: "user", userId: String(userId), premium: false };
}

const ROUTED_SEARCH: ResolvedIntent = { capability: "meals", verb: "search", parameters: { query: "pasta" }, confidence: 0.87 };
const BASELINE_PROFILE: ResolvedIntent = { capability: "profile", verb: "read", parameters: {}, confidence: 0.5, baseline: true };
const UNRECOGNISED_PROFILE: ResolvedIntent = { ...BASELINE_PROFILE, gap: { kind: "unknown" } };

const OK_EMPTY: IntentOutcome = { status: "ok", capabilityId: "meals", verb: "search", message: "ok", result: { scope: "search", query: "pasta", mealCount: 0, meals: [], source: "meals" } };
const OK_DATA: IntentOutcome = { status: "ok", capabilityId: "meals", verb: "search", message: "ok", result: { scope: "search", query: "pasta", mealCount: 1, meals: [{ id: 7, name: "Pasta bake" }], source: "meals" } };
const GAP: IntentOutcome = { status: "gap", capabilityId: "meals", verb: "search", message: "Honest gap." };
const PROFILE_OK: IntentOutcome = { status: "ok", capabilityId: "profile", verb: "read", message: "ok", result: { profile: { firstName: "Colin" } } };

// ---------------------------------------------------------------------------
// Resolver helpers
// ---------------------------------------------------------------------------

const resolver = new PatternIntentResolver();
function hints(surface: IntentResolutionHints["surface"] = "floating"): IntentResolutionHints {
  return { surface, temporalAnchor: "2026-07-02" };
}
async function resolve(u: string, surface: IntentResolutionHints["surface"] = "floating"): Promise<ResolvedIntent[]> {
  return resolver.resolve(u, hints(surface));
}
function has(results: ResolvedIntent[], cap: string): ResolvedIntent | undefined {
  return results.find((r) => r.capability === cap);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // ── §1 normalizeUtterance ────────────────────────────────────────────────
  section("§1 normalizeUtterance");
  assert(normalizeUtterance("  What Pasta  Meals?? ") === "what pasta meals", "lower-cases, collapses ws, strips trailing punctuation");
  assert(normalizeUtterance("Show me!!!") === "show me", "strips repeated trailing punctuation");
  assert(normalizeUtterance("a.b.c") === "a.b.c", "internal punctuation preserved");
  assert(normalizeUtterance("WIBBLE FLURBLE") === normalizeUtterance("wibble flurble"), "case-insensitive grouping key");

  // ── §2 summarizeCompanionHealth aggregation ──────────────────────────────
  section("§2 summarizeCompanionHealth aggregation");
  {
    clock = 0;
    const log: UnsuccessfulQueryLogEntry[] = [
      unmatched("wibble flurble", "floating"),
      fallback("no-route", "wibble flurble", [], "floating"),
      fallback("no-results", "what pasta meals have I got", [{ capability: "meals", verb: "search", status: "ok-empty" }], "meals"),
      fallback("no-knowledge", "tell me about zzz", [{ capability: "nutrition-knowledge", verb: "explain", status: "no-knowledge" }], "nutrition"),
      fallback("internal-error", "boom", [{ capability: "planner", verb: "read", status: "error" }], "planner"),
    ];
    const s = summarizeCompanionHealth(log);
    assert(s.totalEvents === 5, "totalEvents counts every log entry");
    assert(s.byStage["resolver-unmatched"] === 1 && s.byStage["turn-fallback"] === 4, "byStage split is correct");
    assert(s.byState["no-route"] === 1 && s.byState["no-results"] === 1 && s.byState["no-knowledge"] === 1 && s.byState["internal-error"] === 1, "byState counts each state");
    assert(s.windowStart === log[0].timestamp && s.windowEnd === log[log.length - 1].timestamp, "window bounds are first/last timestamps");
    const floating = s.bySurface.find((x) => x.surface === "floating");
    assert(floating?.count === 2, "bySurface counts floating twice");
    assert(s.bySurface[0].count >= s.bySurface[s.bySurface.length - 1].count, "bySurface sorted by frequency desc");
  }
  {
    const empty = summarizeCompanionHealth([]);
    assert(empty.totalEvents === 0 && empty.windowStart === null && empty.windowEnd === null, "empty log → zeroed summary, null window");
    assert(empty.topUnmatchedUtterances.length === 0 && empty.routingFailures.length === 0, "empty log → no groups");
  }

  // ── §3 matcher backlog grouping + ranking ────────────────────────────────
  section("§3 matcher backlog grouping + ranking");
  {
    clock = 0;
    const log: UnsuccessfulQueryLogEntry[] = [
      unmatched("meal ideas?", "floating"),
      unmatched("Meal Ideas", "meals"),          // normalises to same key as above
      unmatched("meal ideas", "floating"),        // 3rd occurrence
      unmatched("what should I cook", "planner"),
      fallback("no-route", "meal ideas", [], "floating"), // also a resolver miss → same key
      fallback("no-results", "chicken", [{ capability: "meals", verb: "search", status: "ok-empty" }], "meals"), // NOT a backlog miss
    ];
    const s = summarizeCompanionHealth(log);
    const top = s.topUnmatchedUtterances;
    assert(top[0].utterance === "meal ideas", "most-frequent unmatched utterance ranks first");
    assert(top[0].count === 4, "grouping counts across phrasings + no-route fallbacks (case-insensitive)");
    assert(top[0].surfaces.includes("floating") && top[0].surfaces.includes("meals"), "group records each surface it was asked from");
    assert(top.some((g) => g.utterance === "what should I cook".toLowerCase()), "second distinct utterance present");
    assert(!top.some((g) => g.utterance === "chicken"), "no-results (ok-empty search) is NOT in the matcher backlog");
    const backlog = unmatchedUtteranceBacklog(log);
    assert(backlog[0] === "meal ideas", "backlog convenience wrapper returns ranked utterances");
    assert(!backlog.includes("chicken"), "backlog excludes capability-side misses");
  }

  // ── §4 routingFailures ───────────────────────────────────────────────────
  section("§4 routingFailures");
  {
    clock = 0;
    const log: UnsuccessfulQueryLogEntry[] = [
      fallback("no-knowledge", "q1", [{ capability: "nutrition-knowledge", verb: "explain", status: "no-knowledge" }]),
      fallback("no-knowledge", "q2", [{ capability: "nutrition-knowledge", verb: "explain", status: "no-knowledge" }]),
      fallback("internal-error", "q3", [{ capability: "planner", verb: "read", status: "error" }]),
      fallback("no-route", "q4", []), // no routed intents → no routing failure
      fallback("no-results", "q5", [{ capability: "meals", verb: "search", status: "ok-empty" }]), // ok-empty is not a failure
    ];
    const s = summarizeCompanionHealth(log);
    const nk = s.routingFailures.find((r) => r.capability === "nutrition-knowledge");
    assert(nk?.count === 2 && nk?.verb === "explain", "routing failure aggregates capability+verb count");
    assert(nk?.statuses.includes("no-knowledge") === true, "routing failure records observed statuses");
    assert(s.routingFailures.some((r) => r.capability === "planner" && r.statuses.includes("error")), "internal-error routing shape captured");
    assert(!s.routingFailures.some((r) => r.capability === "meals"), "ok-empty search is not a routing failure");
    assert(s.routingFailures[0].count >= s.routingFailures[s.routingFailures.length - 1].count, "routingFailures ranked by frequency");
  }

  // ── §5 privacy ───────────────────────────────────────────────────────────
  section("§5 privacy — summary carries no user data");
  {
    clock = 0;
    const log: UnsuccessfulQueryLogEntry[] = [
      unmatched("what did I eat", "diary"),
      fallback("no-knowledge", "tell me about zzz", [{ capability: "nutrition-knowledge", verb: "explain", status: "no-knowledge" }], "nutrition"),
    ];
    const serialized = JSON.stringify(summarizeCompanionHealth(log));
    assert(!/userid|householdid|user_id|household_id/i.test(serialized), "serialized summary contains no user/household id keys");
    assert(!/"parameters"|"result"/.test(serialized), "serialized summary contains no intent parameters or capability results");
  }

  // ── §6 matcher-suggester (advisory only) ─────────────────────────────────
  section("§6 matcher-suggester");
  {
    const valid = JSON.stringify({
      suggestions: [
        { utteranceCluster: ["meal ideas", "dinner ideas"], suggestedCapability: "meal-discovery", suggestedVerb: "search", exampleQuery: "", proposedPattern: "/ideas/", rationale: "recipe discovery", confidence: "high" },
        { utteranceCluster: ["hi there"], suggestedCapability: "small-talk", suggestedVerb: "read", rationale: "chit chat", confidence: "low" }, // invented capability → dropped
        { utteranceCluster: [], suggestedCapability: "meals", suggestedVerb: "read", rationale: "empty cluster", confidence: "low" }, // empty cluster → dropped
      ],
    });
    const report = await suggestMatcherImprovements(["meal ideas", "dinner ideas", "hi there"], new StubLlm(valid));
    assert(report.available === true, "available with a working provider");
    assert(report.suggestions.length === 1, "invalid suggestions (invented capability, empty cluster) are dropped");
    assert(report.suggestions[0].suggestedCapability === "meal-discovery", "valid suggestion retained and capability-constrained");
    assert(report.suggestions.every((s) => s.applied === false), "every suggestion is advisory (applied=false)");
    assert(KNOWN_CAPABILITIES.includes(report.suggestions[0].suggestedCapability), "suggested capability is in the known set");
    assert(/advisory only/i.test(report.note), "report carries the advisory-only note");
    assert(report.model === "stub", "report echoes the model used");
  }
  {
    const report = await suggestMatcherImprovements(["x"], new StubLlm("not json at all"));
    assert(report.available === true && report.suggestions.length === 0, "unparseable model output yields no suggestions, does not throw");
  }
  {
    const report = await suggestMatcherImprovements([], new StubLlm());
    assert(report.available === true && report.suggestions.length === 0 && /no unmatched/i.test(report.note), "empty backlog short-circuits without calling the model");
  }
  {
    const report = await suggestMatcherImprovements(["x"], new StubLlm("{}", false, /* available */ false));
    assert(report.available === false && report.suggestions.length === 0, "unavailable provider → advisory report, no suggestions");
  }
  {
    const report = await suggestMatcherImprovements(["x"], new StubLlm("{}", /* throw */ true));
    assert(report.available === false && report.suggestions.length === 0, "provider error is contained → advisory report, no suggestions");
  }

  // ── §7 gateway surfaces fallbackState end-to-end ─────────────────────────
  section("§7 gateway — fallbackState surfaced end-to-end");
  {
    // no-route
    const gw = makeGateway(new StubResolver([UNRECOGNISED_PROFILE]), new StubLlm(), stubHandle({ profile: PROFILE_OK }));
    const r = await gw.processUserTurn(1, "wibble flurble", "floating", {}, makeCtx(1));
    assert(r.fallbackState === "no-route", "no-route surfaced on TurnResult");
  }
  {
    // no-results
    const gw = makeGateway(new StubResolver([ROUTED_SEARCH, BASELINE_PROFILE]), new StubLlm(), stubHandle({ meals: OK_EMPTY, profile: PROFILE_OK }));
    const r = await gw.processUserTurn(2, "pasta", "floating", {}, makeCtx(2));
    assert(r.fallbackState === "no-results", "no-results surfaced on TurnResult");
  }
  {
    // no-knowledge
    const gw = makeGateway(new StubResolver([ROUTED_SEARCH, BASELINE_PROFILE]), new StubLlm(), stubHandle({ meals: GAP, profile: PROFILE_OK }));
    const r = await gw.processUserTurn(3, "pasta", "floating", {}, makeCtx(3));
    assert(r.fallbackState === "no-knowledge", "no-knowledge surfaced on TurnResult");
  }
  {
    // internal-error (handler throws)
    const gw = makeGateway(new StubResolver([ROUTED_SEARCH, BASELINE_PROFILE]), new StubLlm(), stubHandle({ meals: new Error("boom"), profile: PROFILE_OK }));
    const r = await gw.processUserTurn(4, "pasta", "floating", {}, makeCtx(4));
    assert(r.fallbackState === "internal-error", "internal-error surfaced on TurnResult");
  }
  {
    // success → undefined
    const gw = makeGateway(new StubResolver([ROUTED_SEARCH, BASELINE_PROFILE]), new StubLlm(), stubHandle({ meals: OK_DATA, profile: PROFILE_OK }));
    const r = await gw.processUserTurn(5, "pasta", "floating", {}, makeCtx(5));
    assert(r.fallbackState === undefined, "successful turn has no fallbackState");
  }
  {
    // LLM failure → internal-error even though a capability returned data
    const gw = makeGateway(new StubResolver([ROUTED_SEARCH, BASELINE_PROFILE]), new StubLlm("", /* throw */ true), stubHandle({ meals: OK_DATA, profile: PROFILE_OK }));
    const r = await gw.processUserTurn(6, "pasta", "floating", {}, makeCtx(6));
    assert(r.fallbackState === "internal-error", "LLM provider failure surfaces internal-error");
  }

  // ── §8 resolver coverage expansion + regression ──────────────────────────
  section("§8 resolver — INT35B coverage + INT35 regression");
  {
    // New INT35B nutrition-discovery descriptors
    assert(has(await resolve("high fibre meals"), "nutrition-discovery") != null, "'high fibre meals' → nutrition-discovery");
    assert(has(await resolve("high-fiber recipes"), "nutrition-discovery") != null, "'high-fiber recipes' → nutrition-discovery");
    assert(has(await resolve("low calorie dinners"), "nutrition-discovery") != null, "'low calorie dinners' → nutrition-discovery");
    assert(has(await resolve("low-sodium meals"), "nutrition-discovery") != null, "'low-sodium meals' → nutrition-discovery");
    assert(has(await resolve("low salt recipes"), "nutrition-discovery") != null, "'low salt recipes' → nutrition-discovery");

    // New INT35B meal-discovery phrasings ("ideas", "what should I…")
    const ideas = await resolve("meal ideas");
    assert(has(ideas, "meal-discovery") != null, "'meal ideas' → meal-discovery (was no-route)");
    const healthyIdeas = await resolve("healthy dinner ideas");
    const hi = has(healthyIdeas, "meal-discovery");
    assert(hi != null && hi.parameters.query === "healthy", "'healthy dinner ideas' → meal-discovery query 'healthy'");
    assert(has(await resolve("any ideas for dinner tonight"), "meal-discovery") != null, "'any ideas for dinner tonight' → meal-discovery");
    assert(has(await resolve("what should I cook tonight"), "meal-discovery") != null, "'what should I cook tonight' → meal-discovery");
    assert(has(await resolve("what should I make for dinner"), "meal-discovery") != null, "'what should I make for dinner' → meal-discovery");

    // Guards: the ingredient form and calorie-bounded form keep their owners
    const withIngredient = has(await resolve("what can I cook with chickpeas"), "meal-discovery");
    assert(withIngredient != null && withIngredient.parameters.query === "chickpeas", "'what can I cook with chickpeas' still extracts 'chickpeas' (guard holds)");
    assert(has(await resolve("what can I have under 400 calories"), "nutrition-discovery") != null, "calorie-bounded form still → nutrition-discovery");

    // INT35 regression — prior coverage unchanged
    assert(has(await resolve("high protein meals"), "nutrition-discovery") != null, "INT35 'high protein meals' still routes");
    assert(has(await resolve("what pasta meals have I got"), "meals") != null, "INT35 'what pasta meals have I got' still routes");
    assert(has(await resolve("foods that help with sleep"), "nutrition-knowledge") != null, "INT35 'foods that help with sleep' still routes");
    assert(has(await resolve("show me pasta recipes"), "meal-discovery") != null, "INT35 'show me pasta recipes' still routes");
    // A genuine miss is still a miss (unrecognised marker preserved)
    const miss = await resolve("wibble flurble");
    assert(miss.some((r) => r.gap?.kind === "unknown"), "'wibble flurble' still marked unrecognised (honest gap preserved)");
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT35B observability: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ✗ ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
