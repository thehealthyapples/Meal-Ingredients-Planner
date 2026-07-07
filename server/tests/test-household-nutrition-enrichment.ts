/**
 * test-household-nutrition-enrichment.ts — FI5
 * ===============================================
 * Tests for household-specific enrichment
 * (server/intelligence/conversation/household-nutrition-enrichment.ts) and its
 * gateway wiring in conversation-gateway.ts.
 *
 * Coverage:
 *   §1  Variety insight — familiar/unfamiliar/no-history, pure & honest
 *   §2  Household safety insight — real restriction conflicts, silent otherwise
 *   §3  Composition — combines both, honest gap when household unresolved
 *   §4  Gateway wiring — composed items appear on a real turn, capped, honest
 *   §5  Honesty — deterministic, no fabrication, no member named
 *
 * Run: npx tsx server/tests/test-household-nutrition-enrichment.ts
 */

import {
  composeHouseholdNutritionEnrichment,
  buildHouseholdNutritionEnrichment,
} from "../intelligence/conversation/household-nutrition-enrichment.js";
import type { HouseholdSignal } from "../intelligence/food-intelligence/engine.js";
import type { FoodRef } from "../intelligence/conversation/nutrition-enrichment.js";
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
import { resolveActiveRestrictions } from "../../shared/restrictions/restriction-resolver.js";

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
// Fixtures
// ---------------------------------------------------------------------------

const kale: FoodRef = {
  slug: "kale",
  name: "Kale",
  complianceText: "kale vegetables leafy-greens a nutrient-dense leafy green",
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

const NO_HOUSEHOLD: HouseholdSignal = {
  resolved: false,
  restrictionDefs: [],
  familiarAppearances: new Map(),
};

function householdSignal(overrides: Partial<HouseholdSignal>): HouseholdSignal {
  return { ...NO_HOUSEHOLD, resolved: true, householdId: 1, ...overrides };
}

const cheese: FoodRef = {
  slug: "cheddar-cheese",
  name: "Cheddar Cheese",
  complianceText: "cheddar cheese dairy hard-cheese a hard cows-milk cheese",
};

const cheeseFoodResult = {
  scope: "food",
  slug: "cheddar-cheese",
  name: "Cheddar Cheese",
  category: "dairy",
  subcategory: "hard-cheese",
  description: "A hard cow's-milk cheese.",
  benefits: [],
  nutrients: [],
  source: "nutrition-knowledge-registry",
};

// "dairy" is a real allergen restriction in shared/restrictions/restriction-library.ts
// (household hard restrictions are allergen/medical, not diet-pattern preferences —
// diet patterns like "Vegan"/"Vegetarian" are a different, profile-scoped fact
// already covered by nutrition-enrichment.ts's own personal-relevance check).
const dairyRestrictionDefs = resolveActiveRestrictions(["dairy"]);

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
  // ── §1 Variety insight ───────────────────────────────────────────────────
  section("§1 Variety insight — familiar/unfamiliar/no-history, pure & honest");
  {
    const familiar = composeHouseholdNutritionEnrichment(
      kale,
      householdSignal({ familiarAppearances: new Map([["kale", 3], ["broccoli", 1]]) }),
    );
    const varietyItem = familiar.find((i) => i.title === "Already part of your rotation");
    assert(varietyItem !== undefined, "a food with planner appearances surfaces the familiarity insight");
    assert(!!varietyItem && varietyItem.body.includes("3 times"), "the insight names the real appearance count");
    assert(!!varietyItem && varietyItem.body.includes("2 different foods"), "the insight names the real variety count");

    const unfamiliar = composeHouseholdNutritionEnrichment(
      kale,
      householdSignal({ familiarAppearances: new Map([["broccoli", 2], ["carrot", 1]]) }),
    );
    const newItem = unfamiliar.find((i) => i.title === "New to your household");
    assert(newItem !== undefined, "a food never planned (but household has other history) surfaces the 'new' insight");
    assert(!!newItem && newItem.body.includes("2 different foods"), "the 'new' insight names the real variety count");

    const noHistory = composeHouseholdNutritionEnrichment(kale, householdSignal({ familiarAppearances: new Map() }));
    assert(
      noHistory.every((i) => i.title !== "Already part of your rotation" && i.title !== "New to your household"),
      "a household with no planner history at all yields no variety insight (honest gap)",
    );
  }

  // ── §2 Household safety insight ──────────────────────────────────────────
  section("§2 Household safety insight — real restriction conflicts, silent otherwise");
  {
    const conflict = composeHouseholdNutritionEnrichment(
      cheese,
      householdSignal({ restrictionDefs: dairyRestrictionDefs }),
    );
    const safetyItem = conflict.find((i) => i.title === "Worth checking against your household");
    assert(safetyItem !== undefined, "a genuine household restriction conflict (dairy restriction + cheese) surfaces a safety insight");
    assert(!!safetyItem && safetyItem.sourceDomain === "household", "the safety insight attributes the household domain");
    assert(
      !!safetyItem && !/\bhousehold_eaters\b/i.test(safetyItem.body) && !safetyItem.body.match(/\buser\s*\d+\b/i),
      "the safety insight never names a specific household member or raw identifier",
    );

    const noConflict = composeHouseholdNutritionEnrichment(
      kale,
      householdSignal({ restrictionDefs: dairyRestrictionDefs }),
    );
    assert(
      noConflict.every((i) => i.title !== "Worth checking against your household"),
      "a food that does not conflict with any household restriction yields no safety item — never a fabricated 'this is fine' claim",
    );

    const noRestrictions = composeHouseholdNutritionEnrichment(cheese, householdSignal({ restrictionDefs: [] }));
    assert(
      noRestrictions.every((i) => i.title !== "Worth checking against your household"),
      "a household with no active hard restrictions yields no safety item",
    );

    const noComplianceText = composeHouseholdNutritionEnrichment(
      { slug: "cheddar-cheese", name: "Cheddar Cheese" },
      householdSignal({ restrictionDefs: dairyRestrictionDefs }),
    );
    assert(
      noComplianceText.every((i) => i.title !== "Worth checking against your household"),
      "a food ref with no complianceText (explain scope) is never checked — avoids a low-confidence guess",
    );
  }

  // ── §3 Composition — honest gap when household unresolved ──────────────
  section("§3 Composition — honest gap when household unresolved");
  {
    const unresolved = composeHouseholdNutritionEnrichment(kale, NO_HOUSEHOLD);
    assert(unresolved.length === 0, "an unresolved household yields nothing at all");

    const viaBuilder = await buildHouseholdNutritionEnrichment(
      { status: "ok-data", outcome: { result: cheeseFoodResult } },
      1,
      async () =>
        householdSignal({
          restrictionDefs: dairyRestrictionDefs,
          familiarAppearances: new Map([["cheddar-cheese", 2], ["salmon", 1]]),
        }),
    );
    assert(viaBuilder.length === 2, "the async builder composes both insights when a food and a resolved household are both present");

    const noFood = await buildHouseholdNutritionEnrichment(
      { status: "ok-data", outcome: { result: { scope: "categories", categories: [] } } },
      1,
      async () => householdSignal({}),
    );
    assert(noFood.length === 0, "no extractable food yields nothing without ever calling the household resolver's result");

    const notOkData = await buildHouseholdNutritionEnrichment(
      { status: "no-knowledge", outcome: { result: chickenFoodResult } },
      1,
      async () => householdSignal({ restrictionDefs: dairyRestrictionDefs }),
    );
    assert(notOkData.length === 0, "a non-'ok-data' nutrition status yields nothing regardless of household");

    const missingQuery = await buildHouseholdNutritionEnrichment(undefined, 1, async () => householdSignal({}));
    assert(missingQuery.length === 0, "an absent nutrition query yields nothing, not a throw");

    const resolverThrows = await buildHouseholdNutritionEnrichment(
      { status: "ok-data", outcome: { result: chickenFoodResult } },
      1,
      async () => {
        throw new Error("db unavailable");
      },
    ).catch((e) => e);
    assert(
      resolverThrows instanceof Error,
      "(documenting current behaviour) a resolver that throws propagates — production's real resolveHouseholdSignal never throws (see engine.ts), so this never surfaces in practice",
    );
  }

  // ── §4 Gateway wiring ─────────────────────────────────────────────────────
  section("§4 Gateway wiring — composed items appear on a real turn, capped, honest");
  {
    resetInMemoryIds();
    const nutritionRead: ResolvedIntent = { capability: "nutrition-knowledge", verb: "read", parameters: {}, confidence: 1 };
    const gateway = new ConversationGateway(
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
    // An implausible userId with no real users/households row — resolveHouseholdSignal's
    // own try/catch (engine.ts) degrades any read failure (including "no such user") to
    // NO_HOUSEHOLD_SIGNAL, so this proves the wiring is honest (no crash, no fabricated
    // household) rather than proving a populated household item (covered by §1–§3 above
    // via the injectable resolver, which does not depend on ambient database state).
    const NO_SUCH_USER_ID = 987_654_321;
    const result = await gateway.processUserTurn(NO_SUCH_USER_ID, "tell me about chicken breast", "floating", {}, makeCtx(NO_SUCH_USER_ID));
    assert(result.enrichment.length <= 3, "combined enrichment still respects the overall MAX_ENRICHMENT_ITEMS cap");
    assert(
      !result.enrichment.some((i) => i.title === "Worth checking against your household" || i.title === "Already part of your rotation" || i.title === "New to your household"),
      "with no resolvable household for an implausible userId, no household-nutrition item is fabricated",
    );

    // Unsuccessful turn — no household-nutrition enrichment either.
    resetInMemoryIds();
    const miss: ResolvedIntent = { capability: "planner", verb: "read", parameters: {}, confidence: 0, gap: { kind: "unknown" } };
    const gatewayMiss = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlm(),
      new StubResolver([miss]),
      stubHandle({}),
    );
    const missResult = await gatewayMiss.processUserTurn(1, "wibble flurble", "floating", {}, makeCtx());
    assert(missResult.enrichment.length === 0, "an unsuccessful turn carries no household-nutrition enrichment either");
  }

  // ── §5 Honesty ────────────────────────────────────────────────────────────
  section("§5 Honesty — deterministic, no fabrication");
  {
    const first = composeHouseholdNutritionEnrichment(
      cheese,
      householdSignal({ restrictionDefs: dairyRestrictionDefs, familiarAppearances: new Map([["kale", 2]]) }),
    );
    const second = composeHouseholdNutritionEnrichment(
      cheese,
      householdSignal({ restrictionDefs: dairyRestrictionDefs, familiarAppearances: new Map([["kale", 2]]) }),
    );
    assert(
      JSON.stringify(first) === JSON.stringify(second),
      "composeHouseholdNutritionEnrichment is pure — identical input yields byte-identical output",
    );
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
