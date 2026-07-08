/**
 * test-intelligence-capability-composition.ts (INT42)
 * ======================================================
 * Verifies the INT42 Capability Composition Foundation:
 *
 *   §1  MEAL_HEALTHIER_COMPOUND (pattern-intent-resolver.ts) — "help make
 *       this meal healthier" resolves Meals + Uplift in parallel, gated on
 *       hints.selectedMealId, and does NOT fire without it.
 *   §2  NUTRITION_BOOST_WEEK_COMPOUND — "what nutrition boosts should I add
 *       this week?" resolves Opportunity Delivery alone; naming a specific
 *       nutrient/benefit ALSO adds Food Intelligence's own `recommend` (never
 *       `report` — that would reopen the single-delivery-path problem
 *       OPPORTUNITY_DELIVERY_MATCHERS documents avoiding).
 *   §3  deriveFoodIntelligenceExplainFromUplift (capability-composition.ts)
 *       — the pure sequential-derivation function: a grounded mapping
 *       produces a derived query, an unmapped tag is an honest gap (null),
 *       and the function scans every matched rule (not just the first) for
 *       a groundable tag.
 *   §4  End-to-end gateway wiring — the derived Food Intelligence query
 *       actually fires as a SECOND wave after Uplift's own result is known,
 *       is skipped when nothing groundable was found, and is skipped when
 *       food-intelligence was already resolved independently this turn (no
 *       double-query, no overwrite of a genuine utterance-driven match).
 *
 * Run: npx tsx server/tests/test-intelligence-capability-composition.ts
 */

import { PatternIntentResolver } from "../intelligence/pattern-intent-resolver.js";
import { deriveFoodIntelligenceExplainFromUplift } from "../intelligence/conversation/capability-composition.js";
import {
  ConversationGateway,
  type HandleIntentFn,
} from "../intelligence/conversation/conversation-gateway.js";
import { InMemoryConversationStore, resetInMemoryIds } from "../intelligence/conversation/conversation-store.js";
import type {
  IIntentResolver,
  IntentResolutionHints,
  ResolvedIntent,
} from "../intelligence/intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import type { IntelligenceContext, IntentOutcome } from "../intelligence/types.js";
import type { UpliftMatchResult } from "../lib/uplift-types.js";

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

const resolver = new PatternIntentResolver();

function hints(overrides: Partial<IntentResolutionHints> = {}): IntentResolutionHints {
  return { surface: "floating", temporalAnchor: "2026-07-06", ...overrides };
}

function firstWith(results: ResolvedIntent[], cap: string): ResolvedIntent | undefined {
  return results.find((r) => r.capability === cap);
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("§1 MEAL_HEALTHIER_COMPOUND — Meals + Uplift, gated on selectedMealId");

  const withMeal = await resolver.resolve("help make this meal healthier", hints({ selectedMealId: 100 }));
  const mealsHit = firstWith(withMeal, "meals");
  const upliftHit = firstWith(withMeal, "uplift");
  assert(mealsHit?.verb === "read" && mealsHit?.parameters.scope === "detail" && mealsHit?.parameters.mealId === 100, "meals/read {scope:detail, mealId} fires when a meal is in focus");
  assert(upliftHit?.verb === "recommend" && upliftHit?.parameters.mealId === 100, "uplift/recommend {mealId} fires alongside it");

  const withoutMeal = await resolver.resolve("help make this meal healthier", hints());
  assert(!firstWith(withoutMeal, "uplift"), "no selectedMealId → uplift does NOT fire (nothing to parameterise it with)");

  const variantPhrasing = await resolver.resolve("how can I make this healthier?", hints({ selectedMealId: 42 }));
  assert(!!firstWith(variantPhrasing, "uplift") && !!firstWith(variantPhrasing, "meals"), "alternate phrasing 'how can I make this healthier?' also fires the compound");

  const boostPhrasing = await resolver.resolve("any boosts for this meal?", hints({ selectedMealId: 7 }));
  assert(!!firstWith(boostPhrasing, "uplift"), "'any boosts for this meal?' also fires uplift");

  const unrelated = await resolver.resolve("what's on my planner tomorrow?", hints({ selectedMealId: 100 }));
  assert(!firstWith(unrelated, "uplift"), "an unrelated utterance does NOT fire uplift even with a meal in focus");

  // -------------------------------------------------------------------------
  section("§2 NUTRITION_BOOST_WEEK_COMPOUND — Opportunity Delivery (+ Food Intelligence when a nutrient is named)");

  const genericBoost = await resolver.resolve("what nutrition boosts should I add this week?", hints());
  const odHit = firstWith(genericBoost, "opportunity-delivery");
  assert(odHit?.verb === "report", "opportunity-delivery/report always fires for a weekly-boost question");
  assert(!firstWith(genericBoost, "food-intelligence"), "no nutrient named → food-intelligence is NOT added (nothing to recommend for)");

  const namedNutrientBoost = await resolver.resolve("what fibre boosts should I add this week?", hints());
  assert(!!firstWith(namedNutrientBoost, "opportunity-delivery"), "opportunity-delivery still fires when a nutrient is named");
  const fiHit = firstWith(namedNutrientBoost, "food-intelligence");
  assert(fiHit?.verb === "recommend" && fiHit?.parameters.scope === "nutrient" && fiHit?.parameters.slug === "fibre", "food-intelligence/recommend {scope:nutrient, slug:fibre} added — NOT the 'report' verb (avoids reopening the double-delivery-path issue)");

  const noWeekSignal = await resolver.resolve("what nutrition boosts should I add?", hints());
  assert(!firstWith(noWeekSignal, "opportunity-delivery") || firstWith(noWeekSignal, "opportunity-delivery")!.confidence < 0.84, "missing the 'this week' signal does not fire the compound at its declared confidence");

  // -------------------------------------------------------------------------
  section("§3 deriveFoodIntelligenceExplainFromUplift — pure sequential derivation");

  const fibreMatch: UpliftMatchResult = {
    ruleId: "r1", ruleName: "n1",
    suggestions: [{ ingredient: "Chickpeas", action: "add", why: "why" }],
    nutritionTags: ["fibre"], confidence: "high", priority: 1, matchedTriggers: [],
  };
  const derived = deriveFoodIntelligenceExplainFromUplift([fibreMatch]);
  assert(
    derived?.capability === "food-intelligence" && derived?.verb === "explain" &&
    derived?.parameters.scope === "nutrient" && derived?.parameters.slug === "fibre" && derived?.parameters.foodSlug === "chickpeas",
    "a grounded tag (fibre) derives a food-intelligence/explain query with a slugified ingredient",
  );

  const proteinMatch: UpliftMatchResult = {
    ruleId: "r2", ruleName: "n2",
    suggestions: [{ ingredient: "chicken", action: "add", why: "why" }],
    nutritionTags: ["protein"], confidence: "high", priority: 1, matchedTriggers: [],
  };
  assert(deriveFoodIntelligenceExplainFromUplift([proteinMatch]) === null, "the 'protein' tag is deliberately unmapped (an editorial gap, not a guessed slug) even though `protein` is the single canonical nutrient identity (NK6M)");

  assert(deriveFoodIntelligenceExplainFromUplift([]) === null, "no matches at all → null");

  const noSuggestionMatch: UpliftMatchResult = { ...fibreMatch, suggestions: [] };
  assert(deriveFoodIntelligenceExplainFromUplift([noSuggestionMatch]) === null, "a match with no suggestions → null, never fabricated");

  assert(
    deriveFoodIntelligenceExplainFromUplift([proteinMatch, fibreMatch])?.parameters.slug === "fibre",
    "scans every matched rule (not just the first) for a groundable tag",
  );

  const healthyFat: UpliftMatchResult = { ...fibreMatch, suggestions: [{ ingredient: "olive oil", action: "add", why: "w" }], nutritionTags: ["healthy-fat"] };
  assert(deriveFoodIntelligenceExplainFromUplift([healthyFat])?.parameters.slug === "unsaturated-fats", "'healthy-fat' maps to the real registry slug 'unsaturated-fats'");

  const gutDiversity: UpliftMatchResult = { ...fibreMatch, suggestions: [{ ingredient: "kimchi", action: "add", why: "w" }], nutritionTags: ["gut-diversity"] };
  const gdDerived = deriveFoodIntelligenceExplainFromUplift([gutDiversity]);
  assert(gdDerived?.parameters.scope === "benefit" && gdDerived?.parameters.slug === "gut-health", "'gut-diversity' maps to the real registry benefit slug 'gut-health'");

  // -------------------------------------------------------------------------
  section("§4 End-to-end gateway wiring — the derived second wave");

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

  const MEAL_INTENT: ResolvedIntent = { capability: "meals", verb: "read", parameters: { scope: "detail", mealId: 100 }, confidence: 0.86 };
  const UPLIFT_INTENT: ResolvedIntent = { capability: "uplift", verb: "recommend", parameters: { mealId: 100 }, confidence: 0.86 };
  const FOOD_INTELLIGENCE_INTENT: ResolvedIntent = { capability: "food-intelligence", verb: "recommend", parameters: { scope: "nutrient", slug: "iron" }, confidence: 0.85 };

  const MEAL_OK: IntentOutcome = { status: "ok", capabilityId: "meals", verb: "read", message: "ok", result: { scope: "detail", meal: { id: 100, name: "Mac and Cheese" } } };
  const UPLIFT_OK_FIBRE: IntentOutcome = {
    status: "ok", capabilityId: "uplift", verb: "recommend", message: "ok",
    result: { mealId: 100, mealName: "Mac and Cheese", matches: [fibreMatch], source: "uplift-engine" },
  };
  const UPLIFT_OK_PROTEIN: IntentOutcome = {
    status: "ok", capabilityId: "uplift", verb: "recommend", message: "ok",
    result: { mealId: 100, mealName: "Mac and Cheese", matches: [proteinMatch], source: "uplift-engine" },
  };
  const FOOD_INTELLIGENCE_EXPLAIN_OK: IntentOutcome = {
    status: "ok", capabilityId: "food-intelligence", verb: "explain", message: "ok",
    result: { scope: "nutrient", querySlug: "fibre", queryName: "Fibre", recommendation: { slug: "chickpeas" }, source: "food-intelligence-engine" },
  };
  const FOOD_INTELLIGENCE_RECOMMEND_OK: IntentOutcome = {
    status: "ok", capabilityId: "food-intelligence", verb: "recommend", message: "ok",
    result: { scope: "nutrient", querySlug: "iron", queryName: "Iron", recommendations: [], source: "food-intelligence-engine" },
  };

  async function runTurn(
    resolved: ResolvedIntent[],
    perCapability: Record<string, IntentOutcome>,
  ): Promise<{ callLog: string[]; assistantResolvedIntent: unknown }> {
    resetInMemoryIds();
    const callLog: string[] = [];
    let foodIntelligenceCalls = 0;
    const handle: HandleIntentFn = async (intent) => {
      callLog.push(`${intent.capabilityId}:${intent.verb}`);
      if (intent.capabilityId === "food-intelligence") foodIntelligenceCalls++;
      const o = perCapability[intent.capabilityId];
      if (o) return o;
      return { status: "ok", capabilityId: intent.capabilityId, verb: intent.verb, message: "ok", result: { note: "default" } };
    };
    const gateway = new ConversationGateway(new InMemoryConversationStore(), new StubLlm(), new StubResolver(resolved), handle);
    const result = await gateway.processUserTurn(42, "help make this meal healthier", "floating", { selectedMealId: 100 }, makeCtx());
    return { callLog, assistantResolvedIntent: result.assistantTurn.resolvedIntent };
  }

  const withFibre = await runTurn([MEAL_INTENT, UPLIFT_INTENT], { meals: MEAL_OK, uplift: UPLIFT_OK_FIBRE, "food-intelligence": FOOD_INTELLIGENCE_EXPLAIN_OK });
  assert(withFibre.callLog.includes("food-intelligence:explain"), "a groundable Uplift suggestion triggers a SECOND-WAVE food-intelligence/explain call");
  const withFibreCaps = (withFibre.assistantResolvedIntent as any)?.capabilities ?? [];
  assert(
    withFibreCaps.some((c: any) => c.capabilityId === "meals") &&
      withFibreCaps.some((c: any) => c.capabilityId === "uplift") &&
      withFibreCaps.some((c: any) => c.capabilityId === "food-intelligence" && c.status === "ok-data"),
    "all three composed capabilities (meals, uplift, food-intelligence) are recorded as this turn's resolved intent",
  );

  const withProtein = await runTurn([MEAL_INTENT, UPLIFT_INTENT], { meals: MEAL_OK, uplift: UPLIFT_OK_PROTEIN });
  assert(!withProtein.callLog.includes("food-intelligence:explain"), "an ungroundable Uplift suggestion (protein) never triggers a second-wave call — honest gap, no query at all");

  const withExistingFoodIntelligence = await runTurn(
    [MEAL_INTENT, UPLIFT_INTENT, FOOD_INTELLIGENCE_INTENT],
    { meals: MEAL_OK, uplift: UPLIFT_OK_FIBRE, "food-intelligence": FOOD_INTELLIGENCE_RECOMMEND_OK },
  );
  const fiCallCount = withExistingFoodIntelligence.callLog.filter((c) => c.startsWith("food-intelligence:")).length;
  assert(fiCallCount === 1, "food-intelligence already resolved independently this turn → the derived query is skipped, never a second/overwriting call", String(fiCallCount));
  assert(withExistingFoodIntelligence.callLog.includes("food-intelligence:recommend"), "the ORIGINAL, utterance-driven food-intelligence/recommend intent still executes untouched");

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT42 Capability Composition: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
