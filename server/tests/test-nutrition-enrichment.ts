/**
 * test-nutrition-enrichment.ts — NUT1
 * ======================================
 * Tests for NUT1's two additive nutrition-specific enrichment sources
 * (server/intelligence/conversation/nutrition-enrichment.ts) and their gateway
 * wiring in conversation-gateway.ts.
 *
 * Coverage:
 *   §1  Evidence context — curated per-food lines, honest gap when none exist
 *   §2  Personal relevance — real diet-conflict detection, silent otherwise
 *   §3  Gateway wiring — composed items appear on a real turn, capped, honest
 *   §4  Honesty — deterministic, no fabrication, no boundary crossing
 *
 * Run: npx tsx server/tests/test-nutrition-enrichment.ts
 */

import { buildNutritionEnrichment } from "../intelligence/conversation/nutrition-enrichment.js";
import {
  ConversationGateway,
  type HandleIntentFn,
} from "../intelligence/conversation/conversation-gateway.js";
import {
  InMemoryConversationStore,
  resetInMemoryIds,
} from "../intelligence/conversation/conversation-store.js";
import type { IIntentResolver, ResolvedIntent } from "../intelligence/intent-resolver.js";
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
  console.log(`\n── ${name} ───────────────────────────────────────────`);
}

// ---------------------------------------------------------------------------
// Fixtures — shapes mirroring the real handler results, not the real handlers
// ---------------------------------------------------------------------------

const spinachFoodResult = {
  scope: "food",
  slug: "spinach",
  name: "Spinach",
  category: "vegetables",
  subcategory: "leafy-greens",
  description: "A leafy green vegetable.",
  benefits: [],
  nutrients: [],
  source: "nutrition-knowledge-registry",
};

const broccoliFoodResult = {
  scope: "food",
  slug: "broccoli",
  name: "Broccoli",
  category: "vegetables",
  subcategory: null,
  description: null,
  benefits: [],
  nutrients: [],
  source: "nutrition-knowledge-registry",
};

const chickenFoodResult = {
  scope: "food",
  slug: "chicken-breast",
  name: "Chicken Breast",
  category: "meat",
  subcategory: "poultry",
  description: "A lean cut of poultry.",
  benefits: [],
  nutrients: [],
  source: "nutrition-knowledge-registry",
};

const explainScopeResult = {
  scope: "food-benefits",
  foodSlug: "spinach",
  foodName: "Spinach",
  benefits: [],
  source: "nutrition-knowledge-registry",
  note: "grounded",
};

function profileResult(dietPattern: string | null, dietRestrictions: string[] = []) {
  return {
    scope: "profile",
    profile: { id: 1, dietPattern, dietRestrictions },
    preferences: null,
  };
}

function makeCtx(userId = 42): IntelligenceContext {
  return { role: "user", userId: String(userId), premium: false };
}

class StubLlm implements ILlmProvider {
  readonly modelName = "stub";
  readonly isAvailable = true;
  async complete(_request: LlmRequest): Promise<LlmResponse> {
    return { content: '{"text":"ok","entityRefs":[]}', model: this.modelName };
  }
}

class StubResolver implements IIntentResolver {
  constructor(private readonly results: ResolvedIntent[]) {}
  async resolve(): Promise<ResolvedIntent[]> {
    return this.results;
  }
}

function stubHandle(perCapability: Record<string, IntentOutcome>): HandleIntentFn {
  return async (intent) => {
    const o = perCapability[intent.capabilityId];
    if (o) return o;
    return { status: "gap", capabilityId: intent.capabilityId, verb: intent.verb, message: "no data" };
  };
}

async function main(): Promise<void> {
  // ── §1 Evidence context ──────────────────────────────────────────────────
  section("§1 Evidence context — curated per-food lines, honest gap when none exist");
  {
    const withCurated = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: spinachFoodResult } },
      undefined,
    );
    assert(withCurated.length === 1, "a food with a curated NUTRITION_CONTEXT line yields one evidence item");
    assert(withCurated[0]?.kind === "explanation", "the evidence item is kind 'explanation'");
    assert(withCurated[0]?.title.includes("Spinach"), "the item names the actual food discussed this turn");
    assert(withCurated[0]?.sourceCapabilityId === "nutrition-knowledge", "the item attributes its source capability");

    const withoutCurated = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: broccoliFoodResult } },
      undefined,
    );
    assert(withoutCurated.length === 0, "a food with no curated line yields nothing — an honest gap, never invented content");

    const notOkData = buildNutritionEnrichment(
      { status: "no-knowledge", outcome: { result: spinachFoodResult } },
      undefined,
    );
    assert(notOkData.length === 0, "a non-'ok-data' status yields nothing regardless of result shape");

    const missingQuery = buildNutritionEnrichment(undefined, undefined);
    assert(missingQuery.length === 0, "an absent nutrition query yields nothing, not a throw");

    const unrecognisedShape = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: { scope: "categories", categories: [] } } },
      undefined,
    );
    assert(unrecognisedShape.length === 0, "a result shape with no extractable food (e.g. 'categories' scope) yields nothing");

    const explainScope = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: explainScopeResult } },
      undefined,
    );
    assert(explainScope.length === 1, "the 'food-benefits' explain scope also carries enough (foodSlug/foodName) for evidence context");
  }

  // ── §2 Personal relevance ────────────────────────────────────────────────
  section("§2 Personal relevance — real diet-conflict detection, silent otherwise");
  {
    const veganConflict = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: chickenFoodResult } },
      { status: "ok-data", outcome: { result: profileResult("Vegan") } },
    );
    const personal = veganConflict.find((i) => i.kind === "insight");
    assert(personal !== undefined, "a genuine diet conflict (Vegan profile + a meat food) surfaces a personal insight");
    assert(!!personal && personal.body.includes("Vegan"), "the insight names the caller's own stated diet pattern");

    const veganCompliant = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: spinachFoodResult } },
      { status: "ok-data", outcome: { result: profileResult("Vegan") } },
    );
    assert(
      veganCompliant.every((i) => i.kind !== "insight"),
      "a food that does not conflict with the stated diet yields no personal item — never a fabricated positive claim",
    );

    const noProfileQuery = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: chickenFoodResult } },
      undefined,
    );
    assert(
      noProfileQuery.every((i) => i.kind !== "insight"),
      "no profile query available this turn yields no personal item — an honest gap, not an assumption",
    );

    const emptyProfile = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: chickenFoodResult } },
      { status: "ok-data", outcome: { result: profileResult(null, []) } },
    );
    assert(
      emptyProfile.every((i) => i.kind !== "insight"),
      "a profile with no stated diet pattern or restriction yields no personal item",
    );

    const explainScopeNoConflictCheck = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: explainScopeResult } },
      { status: "ok-data", outcome: { result: profileResult("Vegan") } },
    );
    assert(
      explainScopeNoConflictCheck.every((i) => i.kind !== "insight"),
      "the 'explain' scope carries no category/description text, so no compliance check is attempted (avoids a low-confidence guess)",
    );

    const restrictionConflict = buildNutritionEnrichment(
      {
        status: "ok-data",
        outcome: {
          result: { scope: "food", slug: "cheddar", name: "Cheddar Cheese", category: "dairy", subcategory: null, description: null },
        },
      },
      { status: "ok-data", outcome: { result: profileResult(null, ["Dairy-Free"]) } },
    );
    assert(
      restrictionConflict.some((i) => i.kind === "insight"),
      "a dietRestrictions-only conflict (no dietPattern set) is also detected",
    );
  }

  // ── §3 Gateway wiring ─────────────────────────────────────────────────────
  section("§3 Gateway wiring — composed items appear on a real turn, capped, honest");
  {
    resetInMemoryIds();
    const nutritionRead: ResolvedIntent = { capability: "nutrition-knowledge", verb: "read", parameters: {}, confidence: 1 };
    const profileRead: ResolvedIntent = { capability: "profile", verb: "read", parameters: {}, confidence: 0.5, baseline: true };
    const gateway = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlm(),
      new StubResolver([nutritionRead, profileRead]),
      stubHandle({
        "nutrition-knowledge": {
          status: "ok",
          capabilityId: "nutrition-knowledge",
          verb: "read",
          message: "ok",
          result: chickenFoodResult,
        },
        profile: {
          status: "ok",
          capabilityId: "profile",
          verb: "read",
          message: "ok",
          result: profileResult("Vegan"),
        },
      }),
    );
    const result = await gateway.processUserTurn(1, "tell me about chicken breast", "floating", {}, makeCtx());
    assert(
      result.enrichment.some((i) => i.kind === "insight" && i.sourceCapabilityId === "nutrition-knowledge"),
      "a turn where both nutrition-knowledge and the profile baseline succeed surfaces the personal-relevance insight",
    );
    assert(result.enrichment.length <= 3, "combined enrichment (static + NUT1) still respects the overall MAX_ENRICHMENT_ITEMS cap");

    // Without the profile baseline succeeding, only the static/evidence items can appear — never a fabricated personal claim.
    resetInMemoryIds();
    const gatewayNoProfile = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlm(),
      new StubResolver([nutritionRead]),
      stubHandle({
        "nutrition-knowledge": {
          status: "ok",
          capabilityId: "nutrition-knowledge",
          verb: "read",
          message: "ok",
          result: chickenFoodResult,
        },
      }),
    );
    const resultNoProfile = await gatewayNoProfile.processUserTurn(1, "tell me about chicken breast", "floating", {}, makeCtx());
    assert(
      resultNoProfile.enrichment.every((i) => i.kind !== "insight" || i.sourceCapabilityId !== "nutrition-knowledge"),
      "without a successful profile read this turn, no personal-relevance item is fabricated",
    );

    // Unsuccessful turn — still no NUT1 enrichment (same honest-gap discipline as INT41).
    resetInMemoryIds();
    const miss: ResolvedIntent = { capability: "planner", verb: "read", parameters: {}, confidence: 0, gap: { kind: "unknown" } };
    const gatewayMiss = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlm(),
      new StubResolver([miss]),
      stubHandle({}),
    );
    const missResult = await gatewayMiss.processUserTurn(1, "wibble flurble", "floating", {}, makeCtx());
    assert(missResult.enrichment.length === 0, "an unsuccessful turn carries no NUT1 enrichment either");
  }

  // ── §4 Honesty ────────────────────────────────────────────────────────────
  section("§4 Honesty — deterministic, no fabrication, no boundary crossing");
  {
    const first = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: chickenFoodResult } },
      { status: "ok-data", outcome: { result: profileResult("Vegan") } },
    );
    const second = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: chickenFoodResult } },
      { status: "ok-data", outcome: { result: profileResult("Vegan") } },
    );
    assert(JSON.stringify(first) === JSON.stringify(second), "buildNutritionEnrichment is pure — identical input yields byte-identical output");

    const malformedProfile = buildNutritionEnrichment(
      { status: "ok-data", outcome: { result: chickenFoodResult } },
      { status: "ok-data", outcome: { result: { scope: "profile" } } },
    );
    assert(malformedProfile.every((i) => i.kind !== "insight"), "a profile result missing its 'profile' field is treated as no data, not a crash");
  }

  // ---------------------------------------------------------------------------
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailed assertions:");
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
