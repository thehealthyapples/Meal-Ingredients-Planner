/**
 * test-intelligence-food-intelligence-binding.ts (FI3)
 * =====================================================
 * Verifies the NINETEENTH live capability binding: the read-only Food Intelligence
 * capability — the platform's first Domain Intelligence engine (deterministic
 * join+rank+explain over the Food Knowledge Registry, optionally enriched with the
 * caller's own household context).
 *
 * Coverage:
 *   §1  Pure reasoning core (rankAndExplain) — no I/O, no database:
 *       determinism, citation on every recommendation (Rule E1), Rule T0 safety
 *       exclusion, familiarity-first ranking (Stage 2), stable editorial order
 *       fallback (Stage 1), limit clamping, evidence-context honest gaps.
 *   §2  Port → Handler → Binding contract, with an in-memory FoodIntelligenceReadPort:
 *       capability registration/count, public (unauthenticated) access, missing/
 *       unknown-slug honest gaps, recommend/explain verbs, unsupported verb,
 *       read-only enforcement.
 *
 * Run with: npx tsx server/tests/test-intelligence-food-intelligence-binding.ts
 */

import {
  rankAndExplain,
  NO_HOUSEHOLD_SIGNAL,
  type HouseholdSignal,
  type FoodIntelligenceCitation,
} from "../intelligence/food-intelligence/engine.js";
import {
  IntelligencePlatform,
  CapabilityRegistry,
  createFoodIntelligenceReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type FoodIntelligenceReadPort,
  type FoodIntelligenceBundle,
} from "../intelligence/index.js";
import type { FoodCard } from "../services/nutrition-knowledge-registry.js";
import type { RestrictionDefinition } from "../../shared/restrictions/restriction-types.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ---------------------------------------------------------------------------
// §1 — Pure reasoning core fixtures
// ---------------------------------------------------------------------------

const SPINACH: FoodCard = { slug: "spinach", name: "Spinach", category: "vegetables", subcategory: "leafy-greens", description: null };
const CHICKPEAS: FoodCard = { slug: "chickpeas", name: "Chickpeas", category: "legumes", subcategory: null, description: null };
const WALNUTS: FoodCard = { slug: "walnuts", name: "Walnuts", category: "nuts", subcategory: null, description: null };
const BROCCOLI: FoodCard = { slug: "broccoli", name: "Broccoli", category: "vegetables", subcategory: null, description: null };

const IRON_CITATION: FoodIntelligenceCitation = { factType: "nutrient", factSlug: "iron", factName: "Iron" };

const TREE_NUT_DEF: RestrictionDefinition = {
  id: "tree_nut",
  displayName: "Tree Nut",
  tier: "major_allergen",
  aliases: ["walnuts", "walnut"],
  derivedIngredients: [],
  hiddenIngredients: [],
  substitutions: [],
  prohibitedPhrases: [],
};

const NUT_RESTRICTED_SIGNAL: HouseholdSignal = {
  resolved: true,
  restrictionDefs: [TREE_NUT_DEF],
  familiarAppearances: new Map(),
};

async function main(): Promise<void> {
  section("§1 Pure core — determinism, citation, safety, ranking (no I/O)");

  const candidates = [SPINACH, CHICKPEAS, WALNUTS];

  const runA = rankAndExplain(candidates, IRON_CITATION, NO_HOUSEHOLD_SIGNAL);
  const runB = rankAndExplain(candidates, IRON_CITATION, NO_HOUSEHOLD_SIGNAL);
  assert(
    JSON.stringify(runA) === JSON.stringify(runB),
    "deterministic: identical input yields byte-identical output (Rule LT3)",
  );

  assert(
    runA.recommendations.every((r) => r.citation.factSlug === "iron" && r.citation.factName === "Iron"),
    "Rule E1 — every recommendation carries the citation that made it a candidate",
  );
  assert(
    runA.recommendations.every((r) => r.household === null),
    "Stage 1 (no household signal) — household context is null, never fabricated",
  );
  assert(
    runA.recommendations.map((r) => r.slug).join(",") === "spinach,chickpeas,walnuts",
    "Stage 1 — no household signal preserves the registry's own editorial order",
  );
  assert(
    runA.recommendations.every((r, i) => r.rank === i + 1),
    "rank is 1-based and reflects final position",
  );

  section("§1 Rule T0 — safety supersedes everything (hard exclusion, not deprioritisation)");
  const nutFiltered = rankAndExplain([SPINACH, WALNUTS, CHICKPEAS], IRON_CITATION, NUT_RESTRICTED_SIGNAL);
  assert(
    !nutFiltered.recommendations.some((r) => r.slug === "walnuts"),
    "a food conflicting with an active hard restriction is excluded outright",
  );
  assert(
    nutFiltered.excludedForSafety === 1,
    "excludedForSafety counts exactly the excluded candidate",
    String(nutFiltered.excludedForSafety),
  );
  assert(
    nutFiltered.recommendations.length === 2,
    "the remaining two safe candidates are still recommended",
  );

  section("§1 Stage 2 — familiarity-first ranking, never overriding safety");
  const familiarSignal: HouseholdSignal = {
    resolved: true,
    restrictionDefs: [],
    familiarAppearances: new Map([["walnuts", 3]]),
  };
  const familiarRanked = rankAndExplain([SPINACH, CHICKPEAS, WALNUTS], IRON_CITATION, familiarSignal);
  assert(
    familiarRanked.recommendations[0].slug === "walnuts",
    "a food the household already plans is ranked first",
    familiarRanked.recommendations.map((r) => r.slug).join(","),
  );
  assert(
    familiarRanked.recommendations[0].household?.familiar === true &&
      familiarRanked.recommendations[0].household?.plannerAppearanceCount === 3,
    "the familiar recommendation carries its household context (familiar + appearance count)",
  );
  assert(
    familiarRanked.recommendations[0].explanation.some((s) => /already planned meals with Walnuts/.test(s)),
    "the explanation names the household signal in food terms (Rule T1 — food, not bodies)",
  );
  assert(
    familiarRanked.recommendations.slice(1).map((r) => r.slug).join(",") === "spinach,chickpeas",
    "non-familiar candidates keep the registry's own relative order after the familiar one",
  );

  section("§1 Evidence context — curated line reused when authored, honest gap otherwise");
  const spinachRec = rankAndExplain([SPINACH], IRON_CITATION, NO_HOUSEHOLD_SIGNAL).recommendations[0];
  assert(spinachRec.evidenceContext.length > 0, "spinach has a curated evidence line (shared/canonical/nutrition-context.ts)");
  assert(
    spinachRec.explanation.includes(spinachRec.evidenceContext[0]),
    "the curated evidence line is reused verbatim in the explanation, never rewritten",
  );
  const broccoliRec = rankAndExplain([BROCCOLI], IRON_CITATION, NO_HOUSEHOLD_SIGNAL).recommendations[0];
  assert(broccoliRec.evidenceContext.length === 0, "broccoli has no curated evidence line — an honest gap, not fabricated");
  assert(
    broccoliRec.explanation.length === 1,
    "with no evidence line and no household signal, the explanation is exactly the citation sentence",
  );

  section("§1 Limit clamping — never fewer than 1, never more than the engine max");
  const many = Array.from({ length: 30 }, (_, i) => ({ slug: `food-${i}`, name: `Food ${i}`, category: "misc", subcategory: null, description: null }));
  assert(rankAndExplain(many, IRON_CITATION, NO_HOUSEHOLD_SIGNAL, 5).recommendations.length === 5, "limit=5 returns exactly 5");
  assert(rankAndExplain(many, IRON_CITATION, NO_HOUSEHOLD_SIGNAL, 100).recommendations.length === 20, "limit=100 clamps to the engine max (20)");
  assert(rankAndExplain(many, IRON_CITATION, NO_HOUSEHOLD_SIGNAL, 0).recommendations.length === 1, "limit=0 clamps up to 1 (never zero when candidates exist)");
  assert(rankAndExplain([], IRON_CITATION, NO_HOUSEHOLD_SIGNAL).recommendations.length === 0, "no candidates → no recommendations, never fabricated");

  // ---------------------------------------------------------------------------
  // §2 — Port → Handler → Binding contract
  // ---------------------------------------------------------------------------

  section("§2 Capability lookup — Food Intelligence is the nineteenth live capability");
  assert(
    intelligencePlatform.getCapability("food-intelligence")!.availability === "available",
    "canonical singleton: food-intelligence capability is 'available' (handler bound)",
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(
    live.length === 21,
    "exactly TWENTY-ONE capabilities are live (the previous eighteen + food-intelligence + opportunity-delivery + evidence-learning) — scope lock (EL1)",
    String(live.length),
  );
  assert(
    intelligencePlatform.getCapability("food-intelligence")!.executableIntents.includes("recommend") &&
      intelligencePlatform.getCapability("food-intelligence")!.executableIntents.includes("explain"),
    "executableIntents declares recommend + explain (truthful registry — INT6A)",
  );
  assert(
    !intelligencePlatform.getCapability("food-intelligence")!.executableIntents.includes("search"),
    "search is NOT in executableIntents (no live code path)",
  );

  function makeBundle(overrides: Partial<FoodIntelligenceBundle> = {}): FoodIntelligenceBundle {
    return {
      scope: "nutrient",
      querySlug: "iron",
      queryName: "Iron",
      recommendations: [
        {
          slug: "spinach",
          name: "Spinach",
          category: "vegetables",
          rank: 1,
          citation: IRON_CITATION,
          evidenceContext: [],
          household: null,
          explanation: ['Spinach is linked to "Iron" in the source-gated Food Knowledge Registry.'],
        },
      ],
      trust: { isGrounded: true, householdAware: false, excludedForSafety: 0 },
      metadata: { assembledAt: new Date().toISOString(), sources: ["nutrition-knowledge-registry"] },
      ...overrides,
    };
  }

  const calls: string[] = [];
  function makePort(): FoodIntelligenceReadPort {
    return {
      assembleFoodIntelligence: async (request) => {
        calls.push(`assembleFoodIntelligence(${request.scope},${request.slug})`);
        if (request.slug === "unknown-thing") {
          return {
            scope: request.scope,
            querySlug: request.slug,
            queryName: null,
            recommendations: [],
            trust: { isGrounded: false, householdAware: false, excludedForSafety: 0 },
            metadata: { assembledAt: new Date().toISOString(), sources: [] },
          };
        }
        return makeBundle();
      },
      // FI4 — this suite covers only recommend/explain; the `report` verb (Food
      // Opportunity Engine) has its own dedicated coverage in
      // test-intelligence-food-opportunity-binding.ts. This stub keeps the port
      // contract complete without expanding this suite's scope.
      identifyOpportunities: async () => {
        throw new Error("identifyOpportunities is not exercised by this suite");
      },
    };
  }

  function platformWithFakeFoodIntelligence(): IntelligencePlatform {
    const p = new IntelligencePlatform(new CapabilityRegistry());
    p.registerHandler("food-intelligence", createFoodIntelligenceReadHandler(async () => makePort()), ["recommend", "explain"]);
    return p;
  }

  const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };
  const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };

  section("§2 Public access — unauthenticated callers get Stage 1 recommendations (like nutrition-knowledge)");
  const platform = platformWithFakeFoodIntelligence();
  calls.length = 0;
  const anonRecommend = await platform.handle(
    { verb: "recommend", capabilityId: "food-intelligence", parameters: { scope: "nutrient", slug: "iron" } },
    anon,
  );
  assert(anonRecommend.status === "ok", "anonymous recommend → ok (never denied)", anonRecommend.status);
  const anonResult = anonRecommend.result as any;
  assert(anonResult.recommendations.length === 1 && anonResult.recommendations[0].slug === "spinach", "recommendation surfaced from the port");
  assert(calls.includes("assembleFoodIntelligence(nutrient,iron)"), "delegated to the engine port");

  section("§2 Honest gaps — missing parameters, unknown slug");
  const missingParams = await platform.handle(
    { verb: "recommend", capabilityId: "food-intelligence", parameters: { scope: "nutrient" } },
    user1,
  );
  assert(missingParams.status === "gap", "recommend with no slug → honest gap", missingParams.status);
  assert(/scope, slug/.test(missingParams.message ?? ""), "gap message names the required parameters");

  const unknownSlug = await platform.handle(
    { verb: "recommend", capabilityId: "food-intelligence", parameters: { scope: "nutrient", slug: "unknown-thing" } },
    user1,
  );
  assert(unknownSlug.status === "gap", "unknown nutrient slug → honest gap, never fabricated", unknownSlug.status);
  assert(/will not infer or fabricate/.test(unknownSlug.message ?? ""), "gap message refuses to fabricate");

  section("§2 explain verb — single-candidate drill-down, and honest gap when not found");
  const explainOk = await platform.handle(
    { verb: "explain", capabilityId: "food-intelligence", parameters: { scope: "nutrient", slug: "iron", foodSlug: "spinach" } },
    user1,
  );
  assert(explainOk.status === "ok", "explain for a grounded candidate → ok", explainOk.status);
  assert((explainOk.result as any).recommendation.slug === "spinach", "explain returns the matching recommendation");

  const explainMissingFood = await platform.handle(
    { verb: "explain", capabilityId: "food-intelligence", parameters: { scope: "nutrient", slug: "iron", foodSlug: "walnuts" } },
    user1,
  );
  assert(
    explainMissingFood.status === "gap",
    "explain for a food not among the grounded/safety-cleared recommendations → honest gap",
    explainMissingFood.status,
  );

  section("§2 Unsupported intent — verbs outside the food-intelligence allow-list");
  const searchIntent = await platform.handle(
    { verb: "search", capabilityId: "food-intelligence", parameters: {} },
    user1,
  );
  assert(searchIntent.status === "unsupported_intent", "search not in allow-list → unsupported_intent", searchIntent.status);

  const addIntent = await platform.handle(
    { verb: "add", capabilityId: "food-intelligence", parameters: {} },
    user1,
  );
  assert(
    addIntent.status === "unsupported_intent",
    "add is never executable — no write path exists for food-intelligence (Rule FI1)",
    addIntent.status,
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`FI3 Food Intelligence read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
