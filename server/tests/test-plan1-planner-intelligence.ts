/**
 * PLAN1 — Planner Intelligence.
 *
 * The Planner now explains WHY a meal is recommended, not just WHAT to eat.
 * Three claims, each asserted rather than assumed:
 *
 *   1. NON-FABRICATION. Every reason shown to a user is derived from an evidence
 *      entry naming the canonical owner it was read from. A reason without a
 *      source is not merely absent — it is unconstructible. This is the claim
 *      that matters most; it is what stops explanations becoming a fabrication
 *      surface (ARCHITECTURE_PRINCIPLES Principle 6).
 *
 *   2. HONEST GAPS. When an owner cannot be read (no pantry, no household
 *      history, no season), that dimension is SILENT. It never degrades to a
 *      guess, a hedge, or invented placeholder copy.
 *
 *   3. EVIDENCE, NOT INVENTION. Each of the nine PLAN1 dimensions fires only on
 *      a real fact from a real owner, and reflects the week as it actually
 *      stands — a meal is credited only with the plants it genuinely ADDS.
 *
 * Runs entirely without a database: the composer's derivations are pure, and the
 * DB-backed reads are gated behind a userId this test never supplies.
 *
 * Run with: npm run test:plan1-planner-intelligence
 */
import type { UserPreferences } from "../../shared/schema.js";
import type { ScoredCandidate } from "../lib/meal-scoring-service.js";
import {
  generateMealExplanation,
  type PlannerExplanationDimension,
} from "../lib/explainability-service.js";
import {
  buildPlannerExplanationContext,
  buildSeasonalFoods,
  mealCanonicalFoods,
  mealPlantGroups,
  EMPTY_PLANNER_EXPLANATION_CONTEXT,
  EMPTY_PLANNER_WEEK_STATE,
  type PlannerExplanationContext,
  type PlannerWeekState,
} from "../lib/planner-explanation-context.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

// A fixed date, so the season under test never depends on when CI runs.
const SUMMER = new Date("2026-07-15T12:00:00Z");
const WINTER = new Date("2026-01-15T12:00:00Z");

/** A candidate with every score at zero, so a test only lights the dimension it means to. */
function candidate(over: Partial<ScoredCandidate> = {}): ScoredCandidate {
  return {
    id: 1, name: "Test Meal", image: null, ingredients: [], instructions: [],
    source: "test", sourceUrl: null, category: null, cuisine: null,
    primaryProtein: null, dietTypes: [], estimatedCost: null, estimatedUPFScore: null,
    score: 50, isExternal: false,
    scoreBreakdown: {
      dietMatch: 0, goalAlignment: 0, budgetAlignment: 0, upfScore: 0,
      varietyScore: 0, overlapScore: 0, cuisineBonus: 0, simplicityBonus: 0,
    },
    ...over,
  };
}

function ctx(over: Partial<PlannerExplanationContext> = {}): PlannerExplanationContext {
  return { ...EMPTY_PLANNER_EXPLANATION_CONTEXT, ...over };
}
function week(over: Partial<PlannerWeekState> = {}): PlannerWeekState {
  return { ...EMPTY_PLANNER_WEEK_STATE, ...over };
}
const dims = (e: { dimension: PlannerExplanationDimension }[]) => e.map((x) => x.dimension);

// ─────────────────────────────────────────────────────────────────────────────
console.log("\nCLAIM 1 — Non-fabrication: no reason exists without a cited owner\n");

{
  // The richest explanation we can construct: many owners, many dimensions.
  const rich = generateMealExplanation(
    candidate({
      name: "Summer Tomato & Chickpea Salad",
      ingredients: ["cherry tomatoes", "basil", "chickpeas", "olive oil", "kale"],
      primaryProtein: "vegetarian",
      estimatedCost: 3.2,
      estimatedUPFScore: 5,
      householdFit: {
        compatibleCount: 4, totalCount: 4, memberChanges: [], swapsNeeded: [],
        sharedIngredients: [], extraPrepMinutes: 0, fitScore: 90, explanation: "",
      },
    }),
    null,
    {
      context: ctx({
        season: "summer", seasonAware: true,
        seasonalFoods: new Map([["tomato", "Tomato"], ["basil", "Basil"]]),
        pantryAware: true, pantryFoods: new Map([["olive-oil", "Olive oil"], ["chickpeas", "Chickpeas"]]),
        historyAware: true, familiarFoods: new Map([["tomato", 6], ["kale", 2]]),
      }),
      week: week({ mealsChosen: 3, weeklyBudget: 40, costSoFar: 12 }),
    },
  );

  check("a rich explanation produces multiple reasons", rich.reasons.length >= 4,
    `got ${rich.reasons.length}`);
  check("every reason is the detail of an evidence entry",
    rich.reasons.every((r) => rich.evidence.some((e) => e.detail === r)));
  check("every evidence entry names a non-empty source owner",
    rich.evidence.every((e) => typeof e.source === "string" && e.source.trim().length > 0));
  check("every evidence entry carries a non-empty detail",
    rich.evidence.every((e) => e.detail.trim().length > 0));
  check("reasons are a prefix of the ranked evidence trail",
    rich.reasons.every((r, i) => rich.evidence[i].detail === r));
  check("the evidence trail is never truncated below the reasons shown",
    rich.evidence.length >= rich.reasons.length);

  // The Planner speaks no health claim — those are gated behind SourceRef +
  // reviewedAt in the Food Report and must never leak into a recommendation.
  const HEALTH_CLAIM_WORDS = [
    "reduces", "prevents", "cures", "lowers your", "boosts your immune",
    "protects against", "treats", "heals", "anti-inflammatory",
  ];
  const allText = rich.evidence.map((e) => e.detail.toLowerCase()).join(" | ");
  check("no health claim is made by the Planner",
    !HEALTH_CLAIM_WORDS.some((w) => allText.includes(w)), allText);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\nCLAIM 2 — Honest gaps: an unreadable owner is silent, never guessed\n");

{
  // Backwards compatibility: the pre-PLAN1 two-argument call still works.
  const legacy = generateMealExplanation(candidate(), null);
  check("legacy 2-arg call still returns an explanation", legacy.reasons.length > 0);
  check("legacy call falls back to the sourced composite line",
    legacy.evidence.length === 1 && legacy.evidence[0].dimension === "overall-balance");
  check("even the fallback line names its owner",
    legacy.evidence[0].source.includes("meal-scoring-service"));
}

{
  // Every awareness flag false + ingredients present. The composer must stay mute
  // on pantry, seasonality and history rather than inventing any of them.
  const blind = generateMealExplanation(
    candidate({ ingredients: ["cherry tomatoes", "basil", "salmon"], primaryProtein: "fish" }),
    null,
    { context: ctx(), week: week() },
  );
  const d = dims(blind.evidence);
  check("no pantry line without a pantry read", !d.includes("pantry-usage"));
  check("no seasonal line without a seasonality read", !d.includes("seasonal-suitability"));
  check("no household-history line without planner history", !d.includes("household-history"));
  check("no household-suitability line without householdFit", !d.includes("household-suitability"));
  check("no week-opportunity line without a target set", !d.includes("week-opportunity"));
  // Plant diversity needs no owner beyond the canonical classifier, so it DOES fire.
  check("plant diversity still fires (its owner is always readable)", d.includes("plant-diversity"));
}

{
  // A pantry that was read but contains nothing relevant must not claim usage.
  const noMatch = generateMealExplanation(
    candidate({ ingredients: ["salmon"] }),
    null,
    { context: ctx({ pantryAware: true, pantryFoods: new Map([["kale", "Kale"]]) }), week: week() },
  );
  check("a read-but-irrelevant pantry produces no pantry line",
    !dims(noMatch.evidence).includes("pantry-usage"));
}

{
  // An unresolvable ingredient is a gap; it must never be reasoned over.
  const foods = mealCanonicalFoods(["glorbnax", "cherry tomatoes"]);
  check("unresolvable ingredients are dropped, resolvable ones kept",
    foods.size === 1 && foods.has("tomato"), JSON.stringify(Array.from(foods)));
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\nCLAIM 3 — Evidence, not invention: each dimension reads a real fact\n");

{
  const fit = generateMealExplanation(
    candidate({
      householdFit: {
        compatibleCount: 3, totalCount: 4, memberChanges: [], swapsNeeded: ["dairy-free cheese"],
        sharedIngredients: [], extraPrepMinutes: 5, fitScore: 70, explanation: "",
      },
    }),
    null,
    { context: ctx(), week: week() },
  );
  const line = fit.evidence.find((e) => e.dimension === "household-suitability");
  check("household suitability reports the true compatible count",
    line != null && line.detail.includes("3 of 4"), line?.detail);
  check("household suitability names the swap needed",
    line != null && line.detail.includes("dairy-free cheese"), line?.detail);
  check("household suitability cites household_eaters",
    line != null && line.source.includes("household_eaters"), line?.source);
}

{
  const prefs = {
    dietTypes: [], healthGoals: ["build-muscle"], budgetLevel: "standard",
    upfSensitivity: null, excludedIngredients: [],
  } as unknown as UserPreferences;
  const goals = generateMealExplanation(
    candidate({ scoreBreakdown: { ...candidate().scoreBreakdown, goalAlignment: 18 } }),
    prefs,
    { context: ctx(), week: week() },
  );
  const line = goals.evidence.find((e) => e.dimension === "nutrition-goals");
  check("nutrition goals read user_preferences.healthGoals",
    line != null && line.source === "user_preferences.healthGoals", line?.source);
  check("nutrition goals render the human goal label",
    line != null && line.detail.includes("building muscle"), line?.detail);
}

{
  const pantry = generateMealExplanation(
    candidate({ ingredients: ["olive oil", "chickpeas", "salmon"] }),
    null,
    {
      context: ctx({
        pantryAware: true,
        pantryFoods: new Map([["olive-oil", "Olive oil"], ["chickpeas", "Chickpeas"]]),
      }),
      week: week(),
    },
  );
  const line = pantry.evidence.find((e) => e.dimension === "pantry-usage");
  check("pantry usage counts only the ingredients actually held",
    line != null && line.detail.includes("2 ingredients"), line?.detail);
  check("pantry usage cites user_pantry_items",
    line != null && line.source === "user_pantry_items", line?.source);
}

{
  const seasonal = generateMealExplanation(
    candidate({ ingredients: ["cherry tomatoes", "basil", "salmon"] }),
    null,
    {
      context: ctx({
        season: "summer", seasonAware: true,
        seasonalFoods: new Map([["tomato", "Tomato"], ["basil", "Basil"]]),
      }),
      week: week(),
    },
  );
  const line = seasonal.evidence.find((e) => e.dimension === "seasonal-suitability");
  check("seasonal suitability names the in-season foods and the season",
    line != null && line.detail.includes("Tomato") && line.detail.includes("Basil")
      && line.detail.includes("summer"), line?.detail);
  check("seasonal suitability excludes out-of-season foods",
    line != null && !line.detail.includes("Salmon"), line?.detail);
}

{
  // Plant diversity credits only what the meal ADDS to the week.
  const groups = mealPlantGroups(["cherry tomatoes", "tomato", "basil"]);
  check("plant groups dedupe tomato varieties to one plant",
    groups.size === 2 && groups.has("tomato") && groups.has("basil"),
    JSON.stringify(Array.from(groups.keys())));
  check("non-plants are excluded from plant groups", mealPlantGroups(["salmon"]).size === 0);

  const fresh = generateMealExplanation(
    candidate({ ingredients: ["cherry tomatoes", "basil", "kale"] }),
    null,
    { context: ctx(), week: week({ plantGroups: new Set(["tomato"]) }) },
  );
  const line = fresh.evidence.find((e) => e.dimension === "plant-diversity");
  check("plant diversity counts only the NEW plants (tomato already on the plan)",
    line != null && line.detail.includes("2 new plants"), line?.detail);
  check("plant diversity does not re-credit a plant already counted",
    line != null && !line.detail.includes("Tomato"), line?.detail);

  const none = generateMealExplanation(
    candidate({ ingredients: ["cherry tomatoes"] }),
    null,
    { context: ctx(), week: week({ plantGroups: new Set(["tomato"]) }) },
  );
  check("a meal adding no new plant makes no plant-diversity claim",
    !dims(none.evidence).includes("plant-diversity"));
}

{
  const first = generateMealExplanation(
    candidate({ primaryProtein: "fish" }), null,
    { context: ctx(), week: week({ mealsChosen: 4, usedProteins: new Map([["chicken", 2]]) }) },
  );
  const firstLine = first.evidence.find((e) => e.dimension === "planner-balance");
  check("planner balance flags the first use of a protein this week",
    firstLine != null && firstLine.detail.includes("First fish meal"), firstLine?.detail);

  const repeat = generateMealExplanation(
    candidate({ primaryProtein: "chicken" }), null,
    { context: ctx(), week: week({ mealsChosen: 4, usedProteins: new Map([["chicken", 3]]) }) },
  );
  const repeatLine = repeat.evidence.find((e) => e.dimension === "planner-balance");
  check("planner balance honestly reports an over-used protein",
    repeatLine != null && repeatLine.detail.includes("already on your plan 3 times"),
    repeatLine?.detail);

  // The week-state fact supersedes the generic variety weight. Without this, a
  // meal could simultaneously "add variety" and be "already on your plan 3 times".
  const contradiction = generateMealExplanation(
    candidate({
      primaryProtein: "chicken",
      scoreBreakdown: { ...candidate().scoreBreakdown, varietyScore: 15 },
    }),
    null,
    { context: ctx(), week: week({ mealsChosen: 4, usedProteins: new Map([["chicken", 3]]) }) },
  );
  const balanceLines = contradiction.evidence.filter((e) => e.dimension === "planner-balance");
  check("planner balance is stated exactly once", balanceLines.length === 1,
    JSON.stringify(balanceLines.map((l) => l.detail)));
  check("the week-state fact wins over the generic variety weight",
    balanceLines[0].source.startsWith("planner week state"), balanceLines[0].source);
  check("the contradictory generic variety line is dropped",
    !contradiction.evidence.some((e) => e.detail.includes("Adds variety")));

  // With no week-state balance fact, the generic variety line survives untouched.
  const genericOnly = generateMealExplanation(
    candidate({ scoreBreakdown: { ...candidate().scoreBreakdown, varietyScore: 15 } }),
    null,
    { context: ctx(), week: week() },
  );
  check("the generic variety line survives when no week-state fact exists",
    genericOnly.evidence.some((e) => e.detail.includes("Adds variety")));
}

{
  const fish = generateMealExplanation(
    candidate({ primaryProtein: "fish" }), null,
    { context: ctx(), week: week({ fishCount: 1, fishTarget: 2 }) },
  );
  const line = fish.evidence.find((e) => e.dimension === "week-opportunity");
  check("week opportunity moves the user toward an unmet fish target",
    line != null && line.detail.includes("2 fish meals a week") && line.detail.includes("1 so far"),
    line?.detail);

  const met = generateMealExplanation(
    candidate({ primaryProtein: "fish" }), null,
    { context: ctx(), week: week({ fishCount: 2, fishTarget: 2 }) },
  );
  check("a met fish target raises no opportunity",
    !met.evidence.some((e) => e.detail.includes("fish")));

  const redMeat = generateMealExplanation(
    candidate({ primaryProtein: "vegetarian" }), null,
    { context: ctx(), week: week({ redMeatCount: 2, redMeatTarget: 2 }) },
  );
  check("week opportunity credits staying within the red-meat limit",
    redMeat.evidence.some((e) => e.dimension === "week-opportunity"
      && e.detail.includes("within your 2 red-meat meals")));

  const isRedMeat = generateMealExplanation(
    candidate({ primaryProtein: "beef" }), null,
    { context: ctx(), week: week({ redMeatCount: 2, redMeatTarget: 2 }) },
  );
  check("a red-meat meal never claims to keep you within the red-meat limit",
    !isRedMeat.evidence.some((e) => e.detail.includes("within your")));
}

{
  const budget = generateMealExplanation(
    candidate({ estimatedCost: 6 }), null,
    { context: ctx(), week: week({ weeklyBudget: 40, costSoFar: 12 }) },
  );
  const line = budget.evidence.find((e) => e.dimension === "shopping-impact"
    && e.detail.includes("on budget"));
  check("shopping impact projects the true running cost (12 + 6 of 40)",
    line != null && line.detail.includes("18.00") && line.detail.includes("40.00"), line?.detail);

  const over = generateMealExplanation(
    candidate({ estimatedCost: 30 }), null,
    { context: ctx(), week: week({ weeklyBudget: 40, costSoFar: 12 }) },
  );
  check("a meal that breaks the budget makes no on-budget claim",
    !over.evidence.some((e) => e.detail.includes("on budget")));
}

{
  const familiar = generateMealExplanation(
    candidate({ ingredients: ["cherry tomatoes", "kale", "salmon"] }), null,
    { context: ctx({ historyAware: true, familiarFoods: new Map([["tomato", 6], ["kale", 2]]) }), week: week() },
  );
  const line = familiar.evidence.find((e) => e.dimension === "household-history");
  check("household history cites foods the household has actually planned",
    line != null && line.detail.includes("Tomato") && line.detail.includes("Kale"), line?.detail);
  check("household history cites planner_entries as its owner",
    line != null && line.source.includes("planner_entries"), line?.source);

  const novel = generateMealExplanation(
    candidate({ ingredients: ["cherry tomatoes"] }), null,
    { context: ctx({ historyAware: true, familiarFoods: new Map([["kale", 2]]) }), week: week() },
  );
  check("household history honestly reports a food never planned before",
    novel.evidence.some((e) => e.dimension === "household-history"
      && e.detail.includes("hasn't planned before")));

  const once = generateMealExplanation(
    candidate({ ingredients: ["kale"] }), null,
    { context: ctx({ historyAware: true, familiarFoods: new Map([["kale", 1]]) }), week: week() },
  );
  check("household history singularises a food planned exactly once",
    once.evidence.some((e) => e.detail.includes("planned 1 time before")));
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\nSeasonality reads the canonical owner, not a new store\n");

{
  const summer = buildSeasonalFoods(SUMMER);
  const winter = buildSeasonalFoods(WINTER);
  check("July resolves to UK summer", summer.season === "summer");
  check("January resolves to UK winter", winter.season === "winter");
  check("summer peak includes the curated SEASON_SEED foods",
    summer.foods.has("tomato") && summer.foods.has("basil"));
  check("winter peak excludes summer foods", !winter.foods.has("tomato"));
  check("winter peak includes the curated winter foods",
    winter.foods.has("parsnip") && winter.foods.has("brussels-sprouts"));
  check("every seasonal food carries a display name",
    Array.from(summer.foods.values()).every((n) => n.trim().length > 0));
}

/** No userId → no DB is touched, and the context is honest about what it lacks. */
async function verifyUserlessContext(): Promise<void> {
  const context = await buildPlannerExplanationContext(undefined, SUMMER);
  check("a userless context still resolves seasonality",
    context.seasonAware && context.season === "summer");
  check("a userless context admits it has no pantry", !context.pantryAware);
  check("a userless context admits it has no household history", !context.historyAware);
  check("a userless context holds no pantry or history facts",
    context.pantryFoods.size === 0 && context.familiarFoods.size === 0);
}

// ─────────────────────────────────────────────────────────────────────────────
verifyUserlessContext()
  .then(() => {
    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error("Test harness failed:", err);
    process.exit(1);
  });
