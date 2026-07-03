/**
 * test-intelligence-fallback.ts — INT35
 * ======================================
 * Tests for Intelligent Fallback & Natural Language Coverage.
 * No database, no OpenAI API required (in-memory store + stubs).
 *
 * Coverage:
 *   §1  classifyTurn — the four canonical unsuccessful states are distinct
 *   §2  isEmptySearchResult — known live search result shapes
 *   §3  buildFallbackText — state-specific copy, never the generic line
 *   §4  Resolver — British phrasing coverage (the INT34 failed examples)
 *   §5  Resolver — unrecognised marker + profile baseline
 *   §6  Gateway end-to-end — state-specific responses through the full pipeline
 *   §7  Unsuccessful-query log — recorded, bounded, no sensitive data
 *   §8  Existing successful routing still works (INT24/26/27 regressions)
 *
 * Run: npx tsx server/tests/test-intelligence-fallback.ts
 */

import {
  classifyTurn,
  isEmptySearchResult,
  buildFallbackText,
  logUnsuccessfulQuery,
  getUnsuccessfulQueryLog,
  resetUnsuccessfulQueryLog,
  type QueriedIntentOutcome,
} from "../intelligence/conversation/turn-fallback.js";
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
import type { IntelligenceContext, IntentOutcome, IntentVerb } from "../intelligence/types.js";

// ---------------------------------------------------------------------------
// Minimal test harness
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
// Helpers
// ---------------------------------------------------------------------------

const resolver = new PatternIntentResolver();

function hints(
  surface: IntentResolutionHints["surface"] = "floating",
  overrides: Partial<IntentResolutionHints> = {},
): IntentResolutionHints {
  return { surface, temporalAnchor: "2026-07-02", ...overrides };
}

async function resolve(
  utterance: string,
  surface: IntentResolutionHints["surface"] = "floating",
): Promise<ResolvedIntent[]> {
  return resolver.resolve(utterance, hints(surface));
}

function firstWith(results: ResolvedIntent[], cap: string): ResolvedIntent | undefined {
  return results.find((r) => r.capability === cap);
}

function q(
  capability: string,
  status: QueriedIntentOutcome["status"],
  extras: Partial<QueriedIntentOutcome> = {},
): QueriedIntentOutcome {
  return { capability, verb: "search" as IntentVerb, baseline: false, status, ...extras };
}

const baselineProfile = (status: QueriedIntentOutcome["status"] = "ok-data"): QueriedIntentOutcome => ({
  capability: "profile",
  verb: "read" as IntentVerb,
  baseline: true,
  status,
});

// Gateway stubs -------------------------------------------------------------

class StubLlm implements ILlmProvider {
  readonly modelName = "stub";
  readonly isAvailable = true;
  calls = 0;
  constructor(private readonly reply: string = '{"text": "grounded answer", "entityRefs": []}',
              private readonly shouldThrow = false) {}
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
    return {
      status: "ok",
      capabilityId: intent.capabilityId,
      verb: intent.verb,
      message: "ok",
      result: { note: "default stub data" },
    };
  };
}

function makeGateway(
  resolverStub: IIntentResolver,
  llm: ILlmProvider,
  handle: HandleIntentFn,
): ConversationGateway {
  resetInMemoryIds();
  return new ConversationGateway(new InMemoryConversationStore(), llm, resolverStub, handle);
}

function makeCtx(userId = 42): IntelligenceContext {
  return { role: "user", userId: String(userId), premium: false };
}

const ROUTED_SEARCH: ResolvedIntent = {
  capability: "meals",
  verb: "search",
  parameters: { query: "pasta" },
  confidence: 0.87,
};
const BASELINE_PROFILE: ResolvedIntent = {
  capability: "profile",
  verb: "read",
  parameters: {},
  confidence: 0.5,
  baseline: true,
};
const UNRECOGNISED_PROFILE: ResolvedIntent = {
  ...BASELINE_PROFILE,
  gap: { kind: "unknown" },
};

const OK_EMPTY_SEARCH: IntentOutcome = {
  status: "ok",
  capabilityId: "meals",
  verb: "search",
  message: "ok",
  result: { scope: "search", query: "pasta", mealCount: 0, meals: [], source: "meals" },
};
const OK_DATA_SEARCH: IntentOutcome = {
  status: "ok",
  capabilityId: "meals",
  verb: "search",
  message: "ok",
  result: { scope: "search", query: "pasta", mealCount: 1, meals: [{ id: 7, name: "Pasta bake" }], source: "meals" },
};
const GAP_OUTCOME: IntentOutcome = {
  status: "gap",
  capabilityId: "meals",
  verb: "search",
  message: "Honest gap — no stored answer for this request.",
};
const PROFILE_OK: IntentOutcome = {
  status: "ok",
  capabilityId: "profile",
  verb: "read",
  message: "ok",
  result: { profile: { firstName: "Colin" }, preferences: null },
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {

  // ── §1 — classifyTurn: the four canonical states are distinct ────────────
  section("classifyTurn — four canonical states");

  assert(classifyTurn([]) === "no-route", "nothing queried → no-route");
  assert(
    classifyTurn([baselineProfile()]) === "no-route",
    "only the baseline profile read → no-route (understood/no-data is NOT conflated with no-route)",
  );
  assert(
    classifyTurn([baselineProfile(), q("meals", "no-knowledge")]) === "no-knowledge",
    "routed intent with honest platform gap → no-knowledge (distinct from no-route)",
  );
  assert(
    classifyTurn([baselineProfile(), q("meals", "ok-empty")]) === "no-results",
    "routed search executed and found nothing → no-results (distinct from no-knowledge)",
  );
  assert(
    classifyTurn([baselineProfile(), q("meals", "ok-empty"), q("diary-discovery", "no-knowledge")]) === "no-results",
    "mixed empty-search + gap → no-results wins (a search that ran is the more informative answer)",
  );
  assert(
    classifyTurn([baselineProfile(), q("meals", "error")]) === "internal-error",
    "routed intent threw a genuine fault → internal-error",
  );
  assert(
    classifyTurn([baselineProfile(), q("meals", "no-knowledge"), q("diary-discovery", "error")]) === "no-knowledge",
    "mixed gap + fault → no-knowledge (the honest gap outranks the fault)",
  );
  assert(
    classifyTurn([baselineProfile(), q("meals", "ok-data")]) === null,
    "routed intent produced data → success (null)",
  );
  assert(
    classifyTurn([baselineProfile("error"), q("meals", "ok-data")]) === null,
    "baseline failure never sinks a successful routed turn",
  );

  // ── §2 — isEmptySearchResult ─────────────────────────────────────────────
  section("isEmptySearchResult — known live search shapes");

  assert(isEmptySearchResult({ totalCount: 0, results: [] }), "discovery shape: totalCount 0 → empty");
  assert(!isEmptySearchResult({ totalCount: 3, results: [1, 2, 3] }), "discovery shape: totalCount 3 → not empty");
  assert(isEmptySearchResult({ mealCount: 0, meals: [], query: "pasta" }), "meals search: mealCount 0 → empty");
  assert(!isEmptySearchResult({ mealCount: 2, meals: [{}, {}] }), "meals search: mealCount 2 → not empty");
  assert(
    isEmptySearchResult({ query: "sleep", foods: [], nutrients: [], benefits: [], source: "x" }),
    "nutrition-knowledge search: all arrays empty → empty",
  );
  assert(
    !isEmptySearchResult({ query: "sleep", foods: [{ slug: "oats" }], nutrients: [], benefits: [] }),
    "nutrition-knowledge search: one populated array → not empty",
  );
  assert(isEmptySearchResult([]), "bare empty array → empty");
  assert(!isEmptySearchResult([1]), "bare populated array → not empty");
  assert(!isEmptySearchResult({ profile: { name: "C" } }), "object with no arrays/counts → not empty (data)");

  // ── §3 — buildFallbackText: state-specific copy ──────────────────────────
  section("buildFallbackText — state-specific copy");

  const GENERIC = "i don't have that information right now";
  const tNoRoute   = buildFallbackText("no-route", { surface: "floating" });
  const tNoKnow    = buildFallbackText("no-knowledge");
  const tNoResults = buildFallbackText("no-results", {
    queried: [q("meals", "ok-empty", { query: "pasta" })],
  });
  const tError     = buildFallbackText("internal-error");

  assert(/rephras/i.test(tNoRoute) && /for example/i.test(tNoRoute), "no-route: offers rephrase suggestions");
  assert(/understood/i.test(tNoKnow) && /guess/i.test(tNoKnow), "no-knowledge: honest 'understood but no trusted info'");
  assert(tNoResults.includes('"pasta"') && /searched/i.test(tNoResults), "no-results: names what was searched");
  assert(tNoResults.includes("your meals"), "no-results: names the searched area in friendly form");
  assert(/went wrong/i.test(tError) && /try again/i.test(tError), "internal-error: error fallback copy");
  const allTexts = [tNoRoute, tNoKnow, tNoResults, tError];
  assert(new Set(allTexts).size === 4, "all four state messages are distinct");
  assert(
    allTexts.every((t) => !t.toLowerCase().includes(GENERIC)),
    "no state message uses the generic pre-INT35 line",
  );
  assert(
    buildFallbackText("no-route", { clarificationPrompt: "Did you mean this week?" }) ===
      "Did you mean this week?",
    "no-route: resolver clarification prompt is surfaced verbatim when present",
  );

  // ── §4 — Resolver: British phrasing coverage (INT34 failed examples) ─────
  section("Resolver — natural language coverage for the INT35 examples");

  {
    const r = await resolve("show me a past meal");
    const diary = firstWith(r, "diary-discovery");
    assert(diary !== undefined, '"show me a past meal" → diary-discovery (past = already eaten)');
    assert(diary?.verb === "search", '"show me a past meal" → verb search');
    assert(r[0].capability === "diary-discovery", '"show me a past meal" → diary-discovery is top result');
  }

  {
    const r = await resolve("what pasta meals have I got");
    const meals = firstWith(r, "meals");
    assert(meals !== undefined, '"what pasta meals have I got" → meals');
    assert(meals?.verb === "search", '"what pasta meals have I got" → verb search');
    assert((meals?.parameters.query as string) === "pasta", '"what pasta meals have I got" → query "pasta"');
    assert(r[0].capability === "meals", '"what pasta meals have I got" → meals is top result');
  }

  {
    const r = await resolve("pasta meals");
    const md = firstWith(r, "meal-discovery");
    assert(md !== undefined, '"pasta meals" (bare noun phrase) → meal-discovery');
    assert((md?.parameters.query as string) === "pasta", '"pasta meals" → query "pasta"');
  }

  {
    const r = await resolve("show me pasta recipes");
    const md = firstWith(r, "meal-discovery");
    assert(md !== undefined, '"show me pasta recipes" → meal-discovery (plural recipes now matches)');
    assert((md?.parameters.query as string) === "pasta", '"show me pasta recipes" → query "pasta"');
  }

  {
    const r = await resolve("meals under 400 calories");
    const nd = firstWith(r, "nutrition-discovery");
    assert(nd !== undefined, '"meals under 400 calories" → nutrition-discovery');
    assert(nd?.verb === "search", '"meals under 400 calories" → verb search');
    assert(r[0].capability === "nutrition-discovery", '"meals under 400 calories" → nutrition-discovery is top');
  }

  {
    const r = await resolve("foods that help with sleep");
    const nk = firstWith(r, "nutrition-knowledge");
    assert(nk !== undefined, '"foods that help with sleep" → nutrition-knowledge');
    assert(nk?.verb === "search", '"foods that help with sleep" → verb search');
    assert((nk?.parameters.query as string) === "sleep", '"foods that help with sleep" → query "sleep"');
  }

  // Close OVS variants
  {
    const r = await resolve("which chicken recipes do I have");
    const meals = firstWith(r, "meals");
    assert(
      meals?.verb === "search" && (meals?.parameters.query as string) === "chicken",
      '"which chicken recipes do I have" → meals search "chicken"',
    );
  }
  {
    const r = await resolve("what meals have I got");
    const meals = firstWith(r, "meals");
    assert(
      meals?.verb === "read" && (meals?.parameters.scope as string) === "summary",
      '"what meals have I got" (no qualifier) → meals read summary',
    );
  }
  {
    const r = await resolve("show me my recent meals");
    assert(
      firstWith(r, "diary-discovery") !== undefined,
      '"show me my recent meals" → diary-discovery (temporal qualifier)',
    );
  }

  // ── §5 — Resolver: unrecognised marker + baseline ────────────────────────
  section("Resolver — unrecognised marker and profile baseline");

  {
    const r = await resolve("wibble flurble quux");
    const profile = firstWith(r, "profile");
    assert(profile !== undefined, "gibberish: profile always-on still present");
    assert(profile?.baseline === true, "gibberish: profile is marked baseline");
    assert(profile?.gap?.kind === "unknown", 'gibberish: profile carries gap kind "unknown"');
    assert(
      r.every((ri) => ri.baseline === true),
      "gibberish on floating: no utterance-derived intents (baseline only)",
    );
  }

  {
    const r = await resolve("what's on my shopping list");
    const profile = firstWith(r, "profile");
    assert(
      profile === undefined || profile.gap === undefined,
      "recognised utterance: profile carries NO unknown gap",
    );
    assert(firstWith(r, "shopping-discovery") !== undefined, "recognised utterance routes normally");
  }

  // ── §6 — Gateway end-to-end: the four states through the pipeline ────────
  section("Gateway — state-specific responses end-to-end");

  // no-route: resolver returns only the baseline profile with the unknown gap.
  {
    const llm = new StubLlm();
    const gw = makeGateway(
      new StubResolver([UNRECOGNISED_PROFILE]),
      llm,
      stubHandle({ profile: PROFILE_OK }),
    );
    const r = await gw.processUserTurn(1, "wibble flurble", "floating", {}, makeCtx(1));
    assert(/rephras/i.test(r.text), "no-route turn: response asks to rephrase with suggestions");
    assert(llm.calls === 0, "no-route turn: the LLM is never called");
  }

  // no-knowledge: routed intent, platform returns an honest gap.
  {
    const llm = new StubLlm();
    const gw = makeGateway(
      new StubResolver([ROUTED_SEARCH, BASELINE_PROFILE]),
      llm,
      stubHandle({ meals: GAP_OUTCOME, profile: PROFILE_OK }),
    );
    const r = await gw.processUserTurn(2, "what pasta meals have I got", "floating", {}, makeCtx(2));
    assert(/understood/i.test(r.text) && /guess/i.test(r.text), "no-knowledge turn: honest 'no trusted info' response");
    assert(!/rephras/i.test(r.text), "no-knowledge turn: distinct from no-route (no rephrase ask)");
    assert(llm.calls === 0, "no-knowledge turn: the LLM is never called");
    assert(r.outcome?.status === "gap", "no-knowledge turn: platform outcome surfaced for traceability");
  }

  // no-results: routed search executed OK and found nothing.
  {
    const llm = new StubLlm();
    const gw = makeGateway(
      new StubResolver([ROUTED_SEARCH, BASELINE_PROFILE]),
      llm,
      stubHandle({ meals: OK_EMPTY_SEARCH, profile: PROFILE_OK }),
    );
    const r = await gw.processUserTurn(3, "what pasta meals have I got", "floating", {}, makeCtx(3));
    assert(/searched/i.test(r.text) && r.text.includes('"pasta"'), "no-results turn: names the searched query");
    assert(!/understood/i.test(r.text), "no-results turn: distinct from no-knowledge");
    assert(llm.calls === 0, "no-results turn: the LLM is never called");
  }

  // internal-error: the capability handler throws a genuine fault.
  {
    const llm = new StubLlm();
    const gw = makeGateway(
      new StubResolver([ROUTED_SEARCH, BASELINE_PROFILE]),
      llm,
      stubHandle({ meals: new Error("db exploded"), profile: PROFILE_OK }),
    );
    const r = await gw.processUserTurn(4, "what pasta meals have I got", "floating", {}, makeCtx(4));
    assert(/went wrong/i.test(r.text), "internal-error turn: uses the error fallback");
    assert(llm.calls === 0, "internal-error turn: the LLM is never called");
  }

  // internal-error: the LLM itself fails after successful grounding.
  {
    const llm = new StubLlm("", true);
    const gw = makeGateway(
      new StubResolver([ROUTED_SEARCH, BASELINE_PROFILE]),
      llm,
      stubHandle({ meals: OK_DATA_SEARCH, profile: PROFILE_OK }),
    );
    const r = await gw.processUserTurn(5, "what pasta meals have I got", "floating", {}, makeCtx(5));
    assert(/went wrong/i.test(r.text), "LLM failure: uses the error fallback");
  }

  // success: routed intent produced data → the LLM answers as before.
  {
    const llm = new StubLlm('{"text": "You have 1 pasta meal: Pasta bake.", "entityRefs": [{"type": "meal", "id": 7}]}');
    const gw = makeGateway(
      new StubResolver([ROUTED_SEARCH, BASELINE_PROFILE]),
      llm,
      stubHandle({ meals: OK_DATA_SEARCH, profile: PROFILE_OK }),
    );
    const r = await gw.processUserTurn(6, "what pasta meals have I got", "floating", {}, makeCtx(6));
    assert(llm.calls === 1, "successful turn: the LLM IS called");
    assert(r.text.includes("Pasta bake"), "successful turn: grounded LLM answer returned");
    assert(r.entityRefs.length === 1 && r.entityRefs[0].id === 7, "successful turn: entity refs preserved");
  }

  // ── §7 — Unsuccessful-query log ──────────────────────────────────────────
  section("Unsuccessful-query log — recorded, no sensitive data");

  {
    resetUnsuccessfulQueryLog();
    const llm = new StubLlm();
    const gw = makeGateway(
      new StubResolver([UNRECOGNISED_PROFILE]),
      llm,
      stubHandle({ profile: PROFILE_OK }),
    );
    await gw.processUserTurn(7, "wibble flurble", "floating", {}, makeCtx(7));
    const log = getUnsuccessfulQueryLog();
    assert(log.length >= 1, "unmatched query is logged");
    assert(log.some((e) => e.stage === "resolver-unmatched"), "resolver-unmatched stage recorded");
    assert(log.some((e) => e.stage === "turn-fallback" && e.state === "no-route"), "turn-fallback no-route recorded");
    assert(log.every((e) => e.utterance === "wibble flurble"), "log carries the utterance for resolver improvement");
    const serialized = JSON.stringify(log);
    assert(!serialized.includes('"userId"'), "log never contains a userId key");
    assert(!serialized.includes("Colin"), "log never contains capability result data");
  }

  {
    resetUnsuccessfulQueryLog();
    logUnsuccessfulQuery({
      stage: "turn-fallback",
      state: "no-results",
      surface: "floating",
      utterance: "x".repeat(500),
      intents: [],
    });
    const [entry] = getUnsuccessfulQueryLog();
    assert(entry.utterance.length <= 200, "logged utterance is truncated to 200 chars");
    resetUnsuccessfulQueryLog();
  }

  // ── §8 — Existing successful routing still works ─────────────────────────
  section("Existing routing — INT24/26/27/33 regressions");

  {
    const r = await resolve("What is broccoli good for?");
    assert(
      r[0].capability === "nutrition-knowledge" && r[0].verb === "explain",
      '"what is broccoli good for" → nutrition-knowledge explain (INT22/24)',
    );
  }
  {
    const r = await resolve("show me my shopping list");
    assert(firstWith(r, "shopping-discovery") !== undefined || firstWith(r, "shopping") !== undefined,
      '"show me my shopping list" still routes to shopping');
  }
  {
    const r = await resolve("what's in my pantry?");
    assert(firstWith(r, "pantry-discovery") !== undefined, '"what\'s in my pantry" → pantry-discovery (INT31)');
  }
  {
    const r = await resolve("what high-protein meals do I have planned this week?");
    assert(
      firstWith(r, "nutrition-discovery") !== undefined && firstWith(r, "planner-discovery") !== undefined,
      "compound nutrition+planner question still resolves both capabilities (INT33)",
    );
  }
  {
    const r = await resolve("find me a recipe for chicken curry");
    const md = firstWith(r, "meal-discovery");
    assert(
      md !== undefined && (md.parameters.query as string).includes("chicken curry"),
      '"find me a recipe for chicken curry" → meal-discovery (INT26)',
    );
  }
  {
    const r = await resolve("do I have any pasta meals?");
    const meals = firstWith(r, "meals");
    assert(
      meals?.verb === "search" && (meals?.parameters.query as string) === "pasta",
      '"do I have any pasta meals?" (SVO) still → meals search "pasta"',
    );
  }
  {
    const r = await resolve("show me my meal plan");
    assert(firstWith(r, "planner") !== undefined, '"show me my meal plan" still routes to planner (not meal-discovery)');
  }
  {
    const r = await resolve("what meals do I have this week?");
    assert(firstWith(r, "planner") !== undefined, '"what meals do I have this week" still routes to planner');
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n════════════════════════════════════════════════════`);
  console.log(`  INT35 fallback tests: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log(`\n  Failures:`);
    for (const f of failures) console.log(`   ✗ ${f}`);
    process.exit(1);
  }
  console.log(`════════════════════════════════════════════════════\n`);
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
