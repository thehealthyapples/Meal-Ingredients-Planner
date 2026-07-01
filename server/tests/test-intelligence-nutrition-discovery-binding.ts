/**
 * test-intelligence-nutrition-discovery-binding.ts (INT27)
 * ==========================================================
 * Verifies the THIRTEENTH live capability binding: Nutrition Discovery. It proves
 * the Port → Handler → Binding pattern (established in INT2–INT26) against a
 * thirteenth independent owner, end-to-end:
 *
 *   intent → capability registry → permission check → nutrition-discovery (engine) → response
 *
 * — WITHOUT a live database, by injecting an in-memory NutritionDiscoveryPort stub
 * that stands in for the storage layer. The same handler in production uses the real
 * storage; the contract under test is identical.
 *
 * Covered:
 *   — parseMacroText: text format tolerance (range, "~", unit suffixes, N/A)
 *   — parseNutritionFilter: calorie ceiling, protein floor, carb max, low-fat, low-sugar
 *   — satisfiesFilter: null parsed field → excludes meal from results
 *   — Capability lookup (thirteen live capabilities after INT27)
 *   — nutrition-discovery registered + available in the canonical singleton
 *   — executableIntents declares "search"; "recommend" is NOT executable
 *   — Permission: anonymous → denied (before port is touched)
 *   — Search: meals under 400 calories — correct meals returned
 *   — Search: high protein (qualitative) — uses proteinMin threshold
 *   — Search: low carb (qualitative) — uses carbsMax threshold
 *   — Search: explicit gram threshold — "at least 30g protein"
 *   — Search: no matching meals → ok (totalCount 0, empty results), NOT a gap
 *   — Search: empty query → gap
 *   — Search: missing query param → gap
 *   — Search: query with no parseable filter → gap
 *   — NutritionDiscoveryItem shape: id, name, sourceType, sourceLabel, nutrition, internalId
 *   — Result shape: scope "nutrition-filter", source "nutrition-discovery"
 *   — mealsWithNutritionCount + mealsWithoutNutritionCount coverage metadata
 *   — Capping: > NUTRITION_DISCOVERY_MAX_RESULTS → handler caps to 15
 *   — Write verbs → confirmation_required or gap
 *   — canExecute("nutrition-discovery", "search") → true on canonical singleton
 *   — canExecute("nutrition-discovery", "recommend") → false on canonical singleton
 *
 * Run with: npx tsx server/tests/test-intelligence-nutrition-discovery-binding.ts
 */

import {
  IntelligencePlatform,
  intelligencePlatform,
  NUTRITION_DISCOVERY_CAPABILITY_ID,
  NUTRITION_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  type IntelligenceContext,
} from "../intelligence/index.js";
import { bindNutritionDiscoveryCapability } from "../intelligence/bindings/nutrition-discovery.js";
import type { NutritionDiscoveryPort, MealNutritionRow } from "../intelligence/handlers/nutrition-discovery-port.js";
import {
  parseMacroText,
  parseNutritionFilter,
  satisfiesFilter,
  NUTRITION_DISCOVERY_MAX_RESULTS,
} from "../intelligence/services/nutrition-discovery-engine.js";

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
// Helpers
// ---------------------------------------------------------------------------

function makeRow(
  id: number, name: string, isSystem: boolean,
  cals: string | null, protein: string | null, carbs: string | null, fat: string | null,
): MealNutritionRow {
  return {
    meal: {
      id,
      name,
      userId: 1,
      isSystemMeal: isSystem,
      imageUrl: null,
      servings: 2,
      ingredients: [],
      instructions: [],
      sourceUrl: null,
      mealSourceType: "custom",
      categoryId: null,
      mealTemplateId: null,
      isReadyMeal: false,
      mealFormat: "recipe",
      dietTypes: [],
      isFreezerEligible: false,
      audience: "adult",
      isDrink: false,
      drinkType: null,
      barcode: null,
      brand: null,
      originalMealId: null,
      kind: "meal",
      createdAt: new Date(),
      isHouseholdSafeVariant: false,
      householdSafeFor: [],
      variantKind: null,
      showInCookbook: true,
      primarySlot: null,
      suitableSlots: [],
      energyBand: null,
      styleTags: [],
    } as any,
    nutrition: cals != null ? {
      id: id * 100,
      mealId: id,
      calories: cals,
      protein,
      carbs,
      fat,
      sugar: null,
      salt: null,
      fibre: null,
      saturates: null,
      perServingCalories: null,
      perServingProtein: null,
      perServingCarbs: null,
      perServingFat: null,
    } as any : null,
    isSystem,
  };
}

const LOW_CAL_ROW     = makeRow(1, "Light Veggie Soup",     false, "280", "8",  "35", "5");
const HIGH_PROTEIN_ROW = makeRow(2, "Grilled Chicken Breast", true, "350", "42", "0",  "6");
const HIGH_CAL_ROW    = makeRow(3, "Indulgent Pasta Bake",  false, "650", "18", "80", "22");
const NO_NUTRITION_ROW = makeRow(4, "Mystery Stew",          false, null,  null, null, null);

const ALL_ROWS: MealNutritionRow[] = [LOW_CAL_ROW, HIGH_PROTEIN_ROW, HIGH_CAL_ROW, NO_NUTRITION_ROW];

const portCalls: string[] = [];
function makePort(rows: MealNutritionRow[] = ALL_ROWS): NutritionDiscoveryPort {
  return {
    getMealRows: async (userId: number) => {
      portCalls.push(`getMealRows(${userId})`);
      return rows;
    },
  };
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const anon:  IntelligenceContext = { role: "user", userId: undefined, premium: false };

// ---------------------------------------------------------------------------
// parseMacroText unit tests
// ---------------------------------------------------------------------------

section("parseMacroText — text format tolerance");

assert(parseMacroText("320") === 320, "parseMacroText: plain integer string");
assert(parseMacroText("320 kcal") === 320, "parseMacroText: integer with 'kcal' suffix");
assert(parseMacroText("320g") === 320, "parseMacroText: integer with 'g' suffix");
assert(parseMacroText("~300") === 300, "parseMacroText: leading '~' stripped");
assert(parseMacroText("300-400") === 350, "parseMacroText: range → average");
assert(parseMacroText("N/A") === null, "parseMacroText: 'N/A' → null");
assert(parseMacroText("na") === null, "parseMacroText: 'na' → null");
assert(parseMacroText(null) === null, "parseMacroText: null → null");
assert(parseMacroText("") === null, "parseMacroText: empty string → null");
assert(parseMacroText("-") === null, "parseMacroText: '-' → null");
assert(parseMacroText("unknown") === null, "parseMacroText: 'unknown' → null");
assert(parseMacroText("25.5") === 25.5, "parseMacroText: decimal string");

// ---------------------------------------------------------------------------
// parseNutritionFilter unit tests
// ---------------------------------------------------------------------------

section("parseNutritionFilter — calorie ceiling");

const f1 = parseNutritionFilter("meals under 400 calories");
assert(f1 !== null, "parseNutritionFilter: 'under 400 calories' → non-null");
assert(f1?.caloriesMax === 400, "parseNutritionFilter: caloriesMax = 400", String(f1?.caloriesMax));

const f2 = parseNutritionFilter("something less than 300 kcal");
assert(f2?.caloriesMax === 300, "parseNutritionFilter: 'less than 300 kcal' → caloriesMax = 300");

section("parseNutritionFilter — protein floor");

const f3 = parseNutritionFilter("high protein meals");
assert(f3?.proteinMin === 20, "parseNutritionFilter: 'high protein' → proteinMin = 20 (default)");

const f4 = parseNutritionFilter("at least 30g protein per meal");
assert(f4?.proteinMin === 30, "parseNutritionFilter: 'at least 30g protein' → proteinMin = 30");

section("parseNutritionFilter — carb max / qualitative");

const f5 = parseNutritionFilter("low carb recipes");
assert(f5?.carbsMax === 20, "parseNutritionFilter: 'low carb' → carbsMax = 20 (default)");

const f6 = parseNutritionFilter("meals with under 15g carbs");
assert(f6?.carbsMax === 15, "parseNutritionFilter: 'under 15g carbs' → carbsMax = 15");

section("parseNutritionFilter — fat / sugar / edge cases");

const f7 = parseNutritionFilter("low fat dinner ideas");
assert(f7?.fatMax === 10, "parseNutritionFilter: 'low fat' → fatMax = 10 (default)");

const f8 = parseNutritionFilter("low sugar recipes");
assert(f8?.sugarMax === 5, "parseNutritionFilter: 'low sugar' → sugarMax = 5 (default)");

const f9 = parseNutritionFilter("what should I have for dinner?");
assert(f9 === null, "parseNutritionFilter: no threshold signal → null");

const f10 = parseNutritionFilter("");
assert(f10 === null, "parseNutritionFilter: empty string → null");

// ---------------------------------------------------------------------------
// satisfiesFilter unit tests
// ---------------------------------------------------------------------------

section("satisfiesFilter — threshold predicates");

const pn = { calories: 280, protein: 8, carbs: 35, fat: 5, sugar: null, salt: null };

assert(satisfiesFilter(pn, { caloriesMax: 300 }), "satisfiesFilter: 280 ≤ 300 kcal → true");
assert(!satisfiesFilter(pn, { caloriesMax: 250 }), "satisfiesFilter: 280 > 250 kcal → false");
assert(!satisfiesFilter(pn, { proteinMin: 20 }), "satisfiesFilter: 8g protein < 20g min → false");
assert(satisfiesFilter(pn, { proteinMin: 5 }), "satisfiesFilter: 8g protein ≥ 5g min → true");
assert(!satisfiesFilter(pn, { carbsMax: 20 }), "satisfiesFilter: 35g carbs > 20g max → false");
assert(satisfiesFilter(pn, { carbsMax: 40 }), "satisfiesFilter: 35g carbs ≤ 40g max → true");
assert(
  !satisfiesFilter({ calories: 280, protein: null, carbs: 35, fat: 5, sugar: null, salt: null }, { proteinMin: 5 }),
  "satisfiesFilter: null protein with proteinMin threshold → false (honest exclusion)",
);

// ---------------------------------------------------------------------------
// Build a fresh platform for handler contract tests
// ---------------------------------------------------------------------------

section("Fresh platform — binding lifecycle");

const platform = new IntelligencePlatform();

const beforeBind = platform.getCapability(NUTRITION_DISCOVERY_CAPABILITY_ID);
assert(beforeBind !== undefined, "nutrition-discovery is seeded in registry before binding");
assert(
  beforeBind!.executableIntents.length === 0,
  "nutrition-discovery has empty executableIntents before binding",
);

portCalls.length = 0;
bindNutritionDiscoveryCapability(platform, () => Promise.resolve(makePort()));

const afterBind = platform.getCapability(NUTRITION_DISCOVERY_CAPABILITY_ID)!;
assert(afterBind.availability === "available", "nutrition-discovery flips to 'available' after binding");
assert(afterBind.executableIntents.includes("search"), "executableIntents includes 'search'");
assert(!afterBind.executableIntents.includes("recommend"), "executableIntents does NOT include 'recommend'");

// ---------------------------------------------------------------------------
// Permission: anonymous caller → denied (port never touched)
// ---------------------------------------------------------------------------

section("Permission guard — anonymous caller");

portCalls.length = 0;
const anonOutcome = await platform.handle(
  { verb: "search", capabilityId: NUTRITION_DISCOVERY_CAPABILITY_ID, parameters: { query: "meals under 400 calories" } },
  anon,
);
assert(anonOutcome.status === "denied", "anonymous caller → status 'denied'", anonOutcome.status);
assert(portCalls.length === 0, "port is never touched for anonymous callers");

// ---------------------------------------------------------------------------
// Search: meals under 400 calories
// ---------------------------------------------------------------------------

section("Search: meals under 400 calories");

portCalls.length = 0;
const under400 = await platform.handle(
  { verb: "search", capabilityId: NUTRITION_DISCOVERY_CAPABILITY_ID, parameters: { query: "meals under 400 calories" } },
  user1,
);
assert(under400.status === "ok", "search 'meals under 400 calories' → ok", under400.status);
assert(portCalls.length > 0, "port.getMealRows() was called");

const r400 = under400.result as any;
assert(r400.scope === "nutrition-filter", "result scope = 'nutrition-filter'");
assert(r400.source === "nutrition-discovery", "result source = 'nutrition-discovery'");
assert(r400.filter?.caloriesMax === 400, "filter.caloriesMax = 400", String(r400.filter?.caloriesMax));
assert(r400.totalCount === 2, "totalCount = 2 (280 + 350 kcal meals pass)", String(r400.totalCount));
assert(r400.mealsWithNutritionCount === 3, "mealsWithNutritionCount = 3", String(r400.mealsWithNutritionCount));
assert(r400.mealsWithoutNutritionCount === 1, "mealsWithoutNutritionCount = 1 (mystery stew)", String(r400.mealsWithoutNutritionCount));
assert(Array.isArray(r400.results), "results is an array");
assert(r400.results.length === 2, "results has 2 items", String(r400.results.length));

const item0 = r400.results[0];
assert(typeof item0.id === "string", "item.id is a string");
assert(typeof item0.name === "string", "item.name is a string");
assert(item0.sourceType === "personal" || item0.sourceType === "system", "item.sourceType is 'personal' or 'system'");
assert(typeof item0.sourceLabel === "string", "item.sourceLabel is a string");
assert(typeof item0.nutrition === "object" && item0.nutrition !== null, "item.nutrition is an object");
assert(typeof item0.internalId === "number", "item.internalId is a number");
assert(item0.isAlreadySaved === true, "item.isAlreadySaved = true");

// ---------------------------------------------------------------------------
// Search: high protein (qualitative)
// ---------------------------------------------------------------------------

section("Search: high protein meals (qualitative threshold)");

const hpOutcome = await platform.handle(
  { verb: "search", capabilityId: NUTRITION_DISCOVERY_CAPABILITY_ID, parameters: { query: "high protein meals" } },
  user1,
);
assert(hpOutcome.status === "ok", "high protein search → ok", hpOutcome.status);
const hp = hpOutcome.result as any;
assert(hp.filter?.proteinMin === 20, "filter.proteinMin = 20 (default high-protein threshold)", String(hp.filter?.proteinMin));
assert(hp.totalCount === 1, "only 1 meal has ≥ 20g protein (chicken breast: 42g)", String(hp.totalCount));
assert(hp.results[0]?.name === "Grilled Chicken Breast", "first result is Grilled Chicken Breast");
assert(hp.results[0]?.sourceType === "system", "Grilled Chicken Breast sourceType = 'system'");

// ---------------------------------------------------------------------------
// Search: low carb (qualitative)
// ---------------------------------------------------------------------------

section("Search: low carb recipes (qualitative threshold)");

const lcOutcome = await platform.handle(
  { verb: "search", capabilityId: NUTRITION_DISCOVERY_CAPABILITY_ID, parameters: { query: "low carb recipes" } },
  user1,
);
assert(lcOutcome.status === "ok", "low carb search → ok", lcOutcome.status);
const lc = lcOutcome.result as any;
assert(lc.filter?.carbsMax === 20, "filter.carbsMax = 20 (default low-carb threshold)", String(lc.filter?.carbsMax));
assert(lc.totalCount === 1, "only 1 meal has ≤ 20g carbs (chicken breast: 0g)", String(lc.totalCount));

// ---------------------------------------------------------------------------
// Search: explicit gram threshold
// ---------------------------------------------------------------------------

section("Search: at least 30g protein");

const expOutcome = await platform.handle(
  { verb: "search", capabilityId: NUTRITION_DISCOVERY_CAPABILITY_ID, parameters: { query: "meals with at least 30g protein" } },
  user1,
);
assert(expOutcome.status === "ok", "explicit gram threshold search → ok", expOutcome.status);
const exp = expOutcome.result as any;
assert(exp.filter?.proteinMin === 30, "filter.proteinMin = 30", String(exp.filter?.proteinMin));
assert(exp.totalCount === 1, "only chicken breast (42g) meets ≥ 30g protein", String(exp.totalCount));

// ---------------------------------------------------------------------------
// Search: no matching meals → ok, not a gap
// ---------------------------------------------------------------------------

section("Search: no matching meals → ok (totalCount 0)");

const noMatchOutcome = await platform.handle(
  { verb: "search", capabilityId: NUTRITION_DISCOVERY_CAPABILITY_ID, parameters: { query: "meals under 10 calories" } },
  user1,
);
assert(noMatchOutcome.status === "ok", "no-match search → ok (not a gap)", noMatchOutcome.status);
const nm = noMatchOutcome.result as any;
assert(nm.totalCount === 0, "totalCount = 0 when nothing matches");
assert(Array.isArray(nm.results) && nm.results.length === 0, "results is empty array");

// ---------------------------------------------------------------------------
// Search: empty query → gap
// ---------------------------------------------------------------------------

section("Search: empty query → gap");

const emptyOutcome = await platform.handle(
  { verb: "search", capabilityId: NUTRITION_DISCOVERY_CAPABILITY_ID, parameters: { query: "" } },
  user1,
);
assert(emptyOutcome.status === "gap", "empty query → status 'gap'", emptyOutcome.status);

// ---------------------------------------------------------------------------
// Search: missing query param → gap
// ---------------------------------------------------------------------------

section("Search: missing query param → gap");

const missingOutcome = await platform.handle(
  { verb: "search", capabilityId: NUTRITION_DISCOVERY_CAPABILITY_ID, parameters: {} },
  user1,
);
assert(missingOutcome.status === "gap", "missing query param → status 'gap'", missingOutcome.status);

// ---------------------------------------------------------------------------
// Search: query with no filter signal → gap
// ---------------------------------------------------------------------------

section("Search: query with no parseable filter → gap");

const unparseableOutcome = await platform.handle(
  { verb: "search", capabilityId: NUTRITION_DISCOVERY_CAPABILITY_ID, parameters: { query: "what should I have for dinner?" } },
  user1,
);
assert(unparseableOutcome.status === "gap", "unparseable filter → status 'gap'", unparseableOutcome.status);

// ---------------------------------------------------------------------------
// Capping: > NUTRITION_DISCOVERY_MAX_RESULTS results
// ---------------------------------------------------------------------------

section(`Capping: > ${NUTRITION_DISCOVERY_MAX_RESULTS} results capped to ${NUTRITION_DISCOVERY_MAX_RESULTS}`);

const manyRows: MealNutritionRow[] = Array.from({ length: 20 }, (_, i) =>
  makeRow(100 + i, `Low Cal Meal ${i}`, false, "100", "5", "10", "3")
);

const cappedPlatform = new IntelligencePlatform();
bindNutritionDiscoveryCapability(cappedPlatform, () => Promise.resolve(makePort(manyRows)));

const capOutcome = await cappedPlatform.handle(
  { verb: "search", capabilityId: NUTRITION_DISCOVERY_CAPABILITY_ID, parameters: { query: "meals under 500 calories" } },
  user1,
);
assert(capOutcome.status === "ok", "capped search → ok", capOutcome.status);
const cap = capOutcome.result as any;
assert(
  cap.results.length === NUTRITION_DISCOVERY_MAX_RESULTS,
  `results.length capped at ${NUTRITION_DISCOVERY_MAX_RESULTS}`,
  String(cap.results.length),
);

// ---------------------------------------------------------------------------
// Write verbs → confirmation_required or gap
// ---------------------------------------------------------------------------

section("Write verbs → confirmation_required or gap");

for (const verb of ["add", "delete", "generate", "replace"] as const) {
  const wv = await platform.handle(
    { verb, capabilityId: NUTRITION_DISCOVERY_CAPABILITY_ID, parameters: {} },
    user1,
  );
  // nutrition-discovery supportedIntents = ["search", "recommend"] — write verbs are
  // genuinely unsupported (unsupported_intent) rather than gated (confirmation_required).
  assert(
    wv.status === "confirmation_required" || wv.status === "gap" || wv.status === "unsupported_intent",
    `${verb} verb → rejected (confirmation_required, gap, or unsupported_intent)`,
    wv.status,
  );
}

// ---------------------------------------------------------------------------
// Canonical singleton assertions
// ---------------------------------------------------------------------------

section("Canonical singleton — thirteen live capabilities (scope lock)");

const live = intelligencePlatform.listExecutableCapabilities();
assert(
  live.length === 18,
  "exactly EIGHTEEN capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery + nutrition-discovery + planner-discovery + household-discovery + shopping-discovery + pantry-discovery + diary-discovery) — scope lock (updated by INT32)",
  String(live.length),
);

const singletonND = intelligencePlatform.getCapability(NUTRITION_DISCOVERY_CAPABILITY_ID)!;
assert(singletonND !== undefined, "nutrition-discovery capability is registered on canonical singleton");
assert(singletonND.availability === "available", "singleton nutrition-discovery is 'available'");
assert(
  singletonND.executableIntents.length === NUTRITION_DISCOVERY_BINDING_EXECUTABLE_INTENTS.length,
  `singleton has ${NUTRITION_DISCOVERY_BINDING_EXECUTABLE_INTENTS.length} executable intent(s)`,
  String(singletonND.executableIntents.length),
);
assert(singletonND.executableIntents.includes("search"), "singleton includes 'search'");
assert(!singletonND.executableIntents.includes("recommend"), "singleton does NOT include 'recommend'");

// ---------------------------------------------------------------------------
// canExecute()
// ---------------------------------------------------------------------------

section("canExecute() on canonical singleton");

assert(intelligencePlatform.canExecute(NUTRITION_DISCOVERY_CAPABILITY_ID, "search"), "canExecute search → true");
assert(!intelligencePlatform.canExecute(NUTRITION_DISCOVERY_CAPABILITY_ID, "recommend"), "canExecute recommend → false");
assert(!intelligencePlatform.canExecute(NUTRITION_DISCOVERY_CAPABILITY_ID, "read"), "canExecute read → false");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n══════════════════════════════════════════════`);
console.log(`  INT27 Nutrition Discovery: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════`);
if (failed > 0) process.exit(1);
