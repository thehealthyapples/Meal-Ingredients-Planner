/**
 * test-int50-food-intelligence-composition.ts (INT50)
 * =====================================================
 * Verifies the INT50 Food Intelligence Activation seam:
 *
 *   §1  deriveFoodContextQueries (food-intelligence-composition.ts) — the
 *       pure composition decision: a food-grounded turn derives household
 *       dietary-context; a recommendation-shaped turn additionally derives
 *       pantry + shopping (+ planner ONLY when an active week id is in
 *       view — never a guessed week); a non-food turn derives nothing;
 *       capabilities the resolver already routed are never re-queried;
 *       baseline reads and gaps never trigger composition.
 *   §2  toBaselineContextIntent — derived reads are BASELINE (grounding-only,
 *       the profile always-on vocabulary) with confidence below the profile
 *       baseline's 0.50, so composed context never outranks an
 *       utterance-driven resolution.
 *   §3  End-to-end gateway wiring — the derived context reads actually fire
 *       as a second wave through the SAME queryCapability seam, ground the
 *       turn, are excluded from the routed resolvedIntent payload (they are
 *       grounding, not understanding), and are absent byte-for-byte on a
 *       non-food turn.
 *
 * Run: npx tsx server/tests/test-int50-food-intelligence-composition.ts
 */

// §3 drives real turns for a synthetic user id — disable the Observation
// Engine's fire-and-forget capture (its own supported switch) so the run
// neither logs FK noise nor writes synthetic telemetry rows.
process.env.OBS_DISABLE_CAPTURE = "1";

import {
  deriveFoodContextQueries,
  toBaselineContextIntent,
  COMPOSED_CONTEXT_CONFIDENCE,
  type FirstWaveQuery,
} from "../intelligence/conversation/food-intelligence-composition.js";
import {
  ConversationGateway,
  type HandleIntentFn,
} from "../intelligence/conversation/conversation-gateway.js";
import { InMemoryConversationStore, resetInMemoryIds } from "../intelligence/conversation/conversation-store.js";
import type { IIntentResolver, ResolvedIntent } from "../intelligence/intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import type { IntelligenceContext, IntentOutcome, IntentVerb } from "../intelligence/types.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

function wave(
  capability: string,
  verb: IntentVerb,
  overrides: Partial<FirstWaveQuery> = {},
): FirstWaveQuery {
  return { capability, verb, baseline: false, okData: true, ...overrides };
}

function caps(queries: ReturnType<typeof deriveFoodContextQueries>): string[] {
  return queries.map((q) => q.capability);
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("§1 deriveFoodContextQueries — the pure composition decision");

  const informational = deriveFoodContextQueries([wave("nutrition-knowledge", "read")], {});
  assert(
    caps(informational).join(",") === "household",
    "an informational food turn (nutrition-knowledge/read) derives household dietary-context ONLY",
    caps(informational).join(","),
  );
  assert(
    informational[0]?.parameters.scope === "dietary-context",
    "the household read uses the owner's dietary-context scope (aggregated restrictions/diet patterns)",
  );

  const recommendation = deriveFoodContextQueries([wave("food-intelligence", "recommend")], {});
  assert(
    caps(recommendation).join(",") === "household,pantry,shopping",
    "a recommendation-shaped turn derives household + pantry + shopping (no planner without a week in view)",
    caps(recommendation).join(","),
  );
  assert(
    recommendation.every((q) => typeof q.reason === "string" && q.reason.length > 0),
    "every composed query carries a deterministic reason (operator explainability)",
  );

  const withWeek = deriveFoodContextQueries([wave("food-intelligence", "recommend")], {
    activePlannerWeekId: 7,
  });
  assert(
    caps(withWeek).join(",") === "household,pantry,planner,shopping",
    "an active planner week in view additionally derives planner/read for that week",
    caps(withWeek).join(","),
  );
  const plannerQuery = withWeek.find((q) => q.capability === "planner");
  assert(
    plannerQuery?.parameters.scope === "week" && plannerQuery?.parameters.weekId === 7,
    "the planner read targets EXACTLY the surface's active week — never a guessed week",
  );

  const reportShaped = deriveFoodContextQueries([wave("opportunity-delivery", "report")], {});
  assert(
    caps(reportShaped).includes("pantry") && caps(reportShaped).includes("shopping"),
    "opportunity-delivery/report is recommendation-shaped (derives the practical context)",
  );

  const upliftShaped = deriveFoodContextQueries(
    [wave("meals", "read"), wave("uplift", "recommend")],
    {},
  );
  assert(
    caps(upliftShaped).includes("household") && caps(upliftShaped).includes("pantry"),
    "uplift/recommend composes too — 'make this meal healthier' answers see restrictions and the pantry",
  );

  const nonFood = deriveFoodContextQueries(
    [wave("planner", "read"), wave("profile", "read", { baseline: true })],
    { activePlannerWeekId: 7 },
  );
  assert(nonFood.length === 0, "a non-food turn composes NOTHING — the pipeline is unchanged");

  const alreadyRouted = deriveFoodContextQueries(
    [wave("food-intelligence", "recommend"), wave("pantry", "read"), wave("household", "read")],
    {},
  );
  assert(
    caps(alreadyRouted).join(",") === "shopping",
    "capabilities the resolver already routed this turn are never re-queried or overwritten (INT42 rule)",
    caps(alreadyRouted).join(","),
  );

  const gapOnly = deriveFoodContextQueries(
    [wave("food-intelligence", "recommend", { okData: false })],
    {},
  );
  assert(gapOnly.length === 0, "a food capability that produced NO grounding data never triggers composition");

  const baselineOnly = deriveFoodContextQueries(
    [wave("nutrition-knowledge", "read", { baseline: true })],
    {},
  );
  assert(baselineOnly.length === 0, "baseline reads never trigger composition — only ROUTED food grounding does");

  // -------------------------------------------------------------------------
  section("§2 toBaselineContextIntent — grounding-only vocabulary");

  const intent = toBaselineContextIntent({
    capability: "household",
    verb: "read",
    parameters: { scope: "dietary-context" },
    reason: "r",
  });
  assert(intent.baseline === true, "derived context intents are baseline — grounding, never understanding");
  assert(
    intent.confidence === COMPOSED_CONTEXT_CONFIDENCE && intent.confidence < 0.5,
    "derived confidence sits below the always-on profile baseline (0.50)",
  );

  // -------------------------------------------------------------------------
  section("§3 End-to-end gateway wiring — the composed second wave");

  class StubLlm implements ILlmProvider {
    readonly modelName = "stub";
    readonly isAvailable = true;
    async complete(_r: LlmRequest): Promise<LlmResponse> {
      return { content: '{"text": "grounded answer", "entityRefs": []}', model: this.modelName };
    }
  }
  class StubResolver implements IIntentResolver {
    constructor(private readonly results: ResolvedIntent[]) {}
    async resolve(): Promise<ResolvedIntent[]> {
      return this.results;
    }
  }
  function makeCtx(userId = 42): IntelligenceContext {
    return { role: "user", userId: String(userId), premium: false };
  }

  const FOOD_INTELLIGENCE_INTENT: ResolvedIntent = {
    capability: "food-intelligence",
    verb: "recommend",
    parameters: { scope: "nutrient", slug: "fibre" },
    confidence: 0.85,
  };
  const NUTRITION_KNOWLEDGE_INTENT: ResolvedIntent = {
    capability: "nutrition-knowledge",
    verb: "read",
    parameters: { slug: "vitamin-k" },
    confidence: 0.85,
  };
  const PLANNER_INTENT: ResolvedIntent = {
    capability: "planner",
    verb: "read",
    parameters: { scope: "week", weekId: 3 },
    confidence: 0.85,
  };
  const PANTRY_INTENT: ResolvedIntent = {
    capability: "pantry",
    verb: "read",
    parameters: { scope: "list" },
    confidence: 0.8,
  };

  function ok(capabilityId: string, verb: IntentVerb, result: unknown): IntentOutcome {
    return { status: "ok", capabilityId, verb, message: "ok", result };
  }

  const OUTCOMES: Record<string, IntentOutcome> = {
    "food-intelligence": ok("food-intelligence", "recommend", {
      scope: "nutrient", querySlug: "fibre", queryName: "Fibre",
      recommendations: [{ slug: "chickpeas", name: "Chickpeas" }],
      source: "food-intelligence-engine",
    }),
    "nutrition-knowledge": ok("nutrition-knowledge", "read", {
      slug: "vitamin-k", name: "Vitamin K", source: "nutrition-knowledge-registry",
    }),
    household: ok("household", "read", {
      scope: "dietary-context",
      members: [], aggregated: { unionDietTypes: ["vegetarian"], unionRestrictions: ["nuts"], unionExclusions: [] },
    }),
    pantry: ok("pantry", "read", { scope: "list", itemCount: 1, items: [{ id: 1, ingredientKey: "oats" }] }),
    shopping: ok("shopping", "read", { scope: "list", itemCount: 0, items: [], extras: [] }),
    planner: ok("planner", "read", { scope: "week", weekId: 3, weekNumber: 1, weekName: "Week 1", days: [] }),
  };

  async function runTurn(
    resolved: ResolvedIntent[],
    surfaceHints: Record<string, unknown> = {},
    // The context-frame assembler resolves an "active week" from the surface
    // hint, prior entity refs, OR the user's own stored planner weeks (its
    // existing fallback chain — INT50 consumes the frame, it does not decide
    // the week). A user id with no stored data keeps the no-week case
    // deterministic against a live database.
    userId = 987_654_321,
  ): Promise<{ callLog: string[]; assistantResolvedIntent: unknown }> {
    resetInMemoryIds();
    const callLog: string[] = [];
    const handle: HandleIntentFn = async (intent) => {
      callLog.push(`${intent.capabilityId}:${intent.verb}`);
      const o = OUTCOMES[intent.capabilityId];
      if (o) return { ...o, verb: intent.verb };
      return { status: "ok", capabilityId: intent.capabilityId, verb: intent.verb, message: "ok", result: { note: "default" } };
    };
    const gateway = new ConversationGateway(new InMemoryConversationStore(), new StubLlm(), new StubResolver(resolved), handle);
    const result = await gateway.processUserTurn(userId, "what fibre-rich foods should I add?", "floating", surfaceHints, makeCtx(userId));
    return { callLog, assistantResolvedIntent: result.assistantTurn.resolvedIntent };
  }

  const recommendTurn = await runTurn([FOOD_INTELLIGENCE_INTENT]);
  assert(
    recommendTurn.callLog.includes("household:read") &&
      recommendTurn.callLog.includes("pantry:read") &&
      recommendTurn.callLog.includes("shopping:read"),
    "a food recommendation turn composes household + pantry + shopping as a second wave",
    recommendTurn.callLog.join(","),
  );
  assert(
    !recommendTurn.callLog.includes("planner:read"),
    "no active planner week resolvable anywhere → no planner read (never a guessed week)",
    recommendTurn.callLog.join(","),
  );
  const routedCaps = ((recommendTurn.assistantResolvedIntent as any)?.capabilities ?? []).map(
    (c: any) => c.capabilityId,
  );
  assert(
    routedCaps.join(",") === "food-intelligence",
    "composed context reads are BASELINE — the routed resolvedIntent payload records only the utterance-driven capability",
    routedCaps.join(","),
  );

  const weekTurn = await runTurn([FOOD_INTELLIGENCE_INTENT], { activePlannerWeekId: 3 });
  assert(
    weekTurn.callLog.includes("planner:read"),
    "with an active planner week in view, the composed second wave also reads that week",
    weekTurn.callLog.join(","),
  );

  const informationalTurn = await runTurn([NUTRITION_KNOWLEDGE_INTENT]);
  assert(
    informationalTurn.callLog.includes("household:read") &&
      !informationalTurn.callLog.includes("pantry:read") &&
      !informationalTurn.callLog.includes("shopping:read"),
    "an informational food turn composes household restrictions only — context stays tight",
    informationalTurn.callLog.join(","),
  );

  const nonFoodTurn = await runTurn([PLANNER_INTENT], { activePlannerWeekId: 3 });
  assert(
    !nonFoodTurn.callLog.includes("household:read") &&
      !nonFoodTurn.callLog.includes("pantry:read") &&
      !nonFoodTurn.callLog.includes("shopping:read"),
    "a non-food turn composes nothing — the pipeline is unchanged",
    nonFoodTurn.callLog.join(","),
  );

  const alreadyRoutedTurn = await runTurn([FOOD_INTELLIGENCE_INTENT, PANTRY_INTENT]);
  const pantryCalls = alreadyRoutedTurn.callLog.filter((c) => c === "pantry:read").length;
  assert(
    pantryCalls === 1,
    "pantry already routed by the resolver → the composed wave never re-queries or overwrites it",
    String(pantryCalls),
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT50 Food Intelligence Activation: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
