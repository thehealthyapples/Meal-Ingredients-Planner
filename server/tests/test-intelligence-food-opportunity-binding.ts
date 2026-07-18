/**
 * test-intelligence-food-opportunity-binding.ts (FI4)
 * =====================================================
 * Verifies the Food Opportunity Engine — FI4's ambient extension of the Food
 * Intelligence Engine (FI3): continuous, deterministic identification and
 * prioritisation of Food Opportunities from a caller's own existing planner,
 * pantry and shopping activity. Registered as a THIRD verb (`report`) on the
 * SAME `food-intelligence` capability FI3 already bound — no new capability,
 * no new capability count (still nineteen live capabilities).
 *
 * Coverage:
 *   §1  Pure reasoning core — no I/O, no database:
 *       identifyPlannerGapOpportunities, identifyPantryUnusedOpportunities,
 *       identifyShoppingRestrictionOpportunities, prioritizeOpportunities.
 *       Determinism, evidence on every opportunity (Rule E1), priority ordering,
 *       honest gaps (no activity → no opportunities, never fabricated).
 *   §2  Port → Handler → Binding contract, with an in-memory FoodIntelligenceReadPort:
 *       the `report` verb — authentication requirement, honest gap when no
 *       household resolves, ok with prioritised opportunities, existing
 *       recommend/explain verbs still unaffected by this extension.
 *
 * Run with: npx tsx server/tests/test-intelligence-food-opportunity-binding.ts
 */

import {
  identifyPlannerGapOpportunities,
  identifyPantryUnusedOpportunities,
  identifyShoppingRestrictionOpportunities,
  identifyPlannerMealUpliftOpportunities,
  identifyPlannerBatchCookOpportunities,
  // AFI3/AFI4 — the generators specified by PANTRY1 and CBK2, whose own suites cannot
  // load (see the note at their sections below).
  identifyPantryNeedOpportunities,
  identifyCookbookCookableNowOpportunities,
  identifyCookbookHouseholdConflictOpportunities,
  prioritizeOpportunities,
  type FoodOpportunity,
  type PlannedMealRef,
} from "../intelligence/food-intelligence/opportunity-engine.js";
// AFI5 — the Companion seam: proves the new `cookbook` domain is registered rather than
// silently dropped one step before a household could read it.
import { noticeOpportunities } from "../intelligence/conversation/notice-engine.js";
import { selectSurface } from "../intelligence/opportunity-delivery/framework.js";
import {
  IntelligencePlatform,
  CapabilityRegistry,
  createFoodIntelligenceReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type FoodIntelligenceReadPort,
  type FoodOpportunityBundle,
} from "../intelligence/index.js";
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

function makeWeek(id: number, weekNumber: number, weekName: string): any {
  return { id, weekNumber, weekName, householdId: 1, userId: 1 };
}
function makeDay(id: number, weekId: number, dayOfWeek: number): any {
  return { id, weekId, dayOfWeek };
}
function makeEntry(id: number, dayId: number): any {
  return { id, dayId, mealType: "dinner", audience: "adult", mealId: 1, position: 0 };
}
function makePantryItem(id: number, ingredientKey: string, displayName: string, isDeleted = false): any {
  return { id, userId: 1, ingredientKey, displayName, category: "larder", isDeleted };
}
function makeShoppingItem(id: number, productName: string, checked = false): any {
  return { id, userId: 1, productName, checked };
}

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

async function main(): Promise<void> {
  section("§1 identifyPlannerGapOpportunities — empty-day detection, priority, determinism");

  const week1 = makeWeek(1, 3, "Week 3");
  const days7 = Array.from({ length: 7 }, (_, i) => makeDay(100 + i, 1, i));
  // Only Monday (dayOfWeek 0) and Tuesday (dayOfWeek 1) have entries → 5 of 7 empty → high priority.
  const entriesFewFilled = [makeEntry(1, 100), makeEntry(2, 101)];

  const gapsHigh = identifyPlannerGapOpportunities(week1, days7, entriesFewFilled);
  assert(gapsHigh.length === 5, "5 empty days produce 5 opportunities", String(gapsHigh.length));
  assert(gapsHigh.every((o) => o.priority === "high"), "5/7 empty (≥50%) → high priority");
  assert(gapsHigh.every((o) => o.owningDomain === "planner"), "owning domain is 'planner'");
  assert(gapsHigh.every((o) => o.type === "planner-empty-day"), "type is 'planner-empty-day'");
  assert(
    gapsHigh.every((o) => o.evidence.length > 0 && o.evidence[0].source === "planner-week"),
    "every opportunity carries evidence naming its source (Rule E1 — no citation, no card)",
  );
  assert(
    gapsHigh.map((o) => o.explanation.includes("Wednesday") || o.explanation.includes("Thursday") || o.explanation.includes("Friday") || o.explanation.includes("Saturday") || o.explanation.includes("Sunday")).every(Boolean),
    "explanations name the actual empty day (Rule T1 — food, not bodies; grounded, not generic)",
  );

  const runA = identifyPlannerGapOpportunities(week1, days7, entriesFewFilled);
  const runB = identifyPlannerGapOpportunities(week1, days7, entriesFewFilled);
  assert(JSON.stringify(runA) === JSON.stringify(runB), "deterministic: identical input yields byte-identical output (Rule LT3)");

  // 6 of 7 days filled, one empty → 1/7 < 50% → medium priority.
  const entriesMostlyFilled = [makeEntry(1, 100), makeEntry(2, 101), makeEntry(3, 102), makeEntry(4, 103), makeEntry(5, 104), makeEntry(6, 105)];
  const gapsMedium = identifyPlannerGapOpportunities(week1, days7, entriesMostlyFilled);
  assert(gapsMedium.length === 1, "1 empty day of 7 produces exactly 1 opportunity", String(gapsMedium.length));
  assert(gapsMedium[0].priority === "medium", "1/7 empty (<50%) → medium priority");

  const entriesAllFilled = days7.map((d, i) => makeEntry(i + 1, d.id));
  assert(identifyPlannerGapOpportunities(week1, days7, entriesAllFilled).length === 0, "every day filled → no opportunities, never fabricated");
  assert(identifyPlannerGapOpportunities(week1, [], []).length === 0, "no days at all → no opportunities");

  section("§1 identifyPantryUnusedOpportunities — canonical identity reuse, honest gaps");

  const pantryItems = [
    makePantryItem(1, "spinach", "Spinach"),
    makePantryItem(2, "walnuts", "Walnuts"),
    makePantryItem(3, "not-a-real-food-xyz", "Mystery Item"),
    makePantryItem(4, "broccoli", "Broccoli", /* isDeleted */ true),
  ];
  const familiarSlugs = new Set(["spinach"]); // household has already planned spinach

  const pantryOpportunities = identifyPantryUnusedOpportunities(pantryItems, familiarSlugs);
  assert(pantryOpportunities.length === 1, "exactly one unused pantry item surfaced", String(pantryOpportunities.length));
  assert(pantryOpportunities[0].id === "pantry-item-unused-in-plan:2", "the familiar item (spinach) is excluded, the unresolved item is excluded, the deleted item is excluded — only walnuts remains");
  assert(pantryOpportunities[0].owningDomain === "pantry", "owning domain is 'pantry'");
  assert(pantryOpportunities[0].priority === "low", "pantry-unused opportunities are informational (low priority)");
  assert(/Walnuts/.test(pantryOpportunities[0].explanation), "explanation names the actual pantry item");

  assert(identifyPantryUnusedOpportunities([], familiarSlugs).length === 0, "no pantry items → no opportunities");
  assert(
    identifyPantryUnusedOpportunities([makePantryItem(5, "spinach", "Spinach")], familiarSlugs).length === 0,
    "a pantry item already familiar to the household is not an opportunity",
  );

  section("§1 identifyShoppingRestrictionOpportunities — reuses the exact Rule T0 restriction matcher");

  const shoppingItems = [
    makeShoppingItem(1, "Walnuts", false),
    makeShoppingItem(2, "Spinach", false),
    makeShoppingItem(3, "Walnut Halves", /* checked */ true),
  ];

  const shoppingOpportunities = identifyShoppingRestrictionOpportunities(shoppingItems, [TREE_NUT_DEF]);
  assert(shoppingOpportunities.length === 1, "exactly one restriction-conflicting item surfaced", String(shoppingOpportunities.length));
  assert(shoppingOpportunities[0].id === "shopping-restriction-conflict:1", "the unchecked walnut item is flagged; the checked one is not (already actioned)");
  assert(shoppingOpportunities[0].owningDomain === "shopping", "owning domain is 'shopping'");
  assert(shoppingOpportunities[0].priority === "critical", "a restriction conflict is critical — Rule T0's additive face (ATTN1)");
  assert(
    shoppingOpportunities[0].evidence.some((e) => e.source === "household-eaters"),
    "evidence names the household restriction that produced the match",
  );
  assert(
    identifyShoppingRestrictionOpportunities(shoppingItems, []).length === 0,
    "no active restrictions → no opportunities (never invents a conflict)",
  );

  section("§1 identifyPlannerMealUpliftOpportunities (AFI1) — reuses the Uplift Rules; one excellent, safety-filtered, cited");

  // "Spaghetti Bolognese" matches several reviewed uplift rules (wholemeal swap,
  // greens addition, lentil boost) in the ONE canonical UPLIFT_RULES set.
  const plannedMeals: PlannedMealRef[] = [{ entryId: 900, dayOfWeek: 2, mealName: "Spaghetti Bolognese", mealId: 500 }];

  const upliftOps = identifyPlannerMealUpliftOpportunities(plannedMeals, week1, []);
  assert(upliftOps.length === 1, "a matching planned meal → exactly ONE lift (prefer one excellent over many)", String(upliftOps.length));
  const uplift = upliftOps[0];
  assert(uplift.type === "planner-meal-uplift", "type is 'planner-meal-uplift'");
  assert(uplift.owningDomain === "planner", "owning domain is 'planner' (routes to the planner surface + Companion)");
  assert(uplift.priority === "low", "an uplift is CALM — low priority, never urgent");
  assert(uplift.subject.entity === "planner-meal" && uplift.subject.id === 900, "subject is the planner-meal keyed on the entry's own id");
  assert(/Spaghetti Bolognese/.test(uplift.explanation), "explanation names the ACTUAL planned meal (household-specific, grounded)");
  assert(
    uplift.evidence.some((e) => e.source === "planner-week") && uplift.evidence.some((e) => e.source === "nutrition-enhancement"),
    "evidence cites BOTH the plan and the uplift rule's own approved 'why' (Rule E1 — no citation, no card)",
  );

  const runU1 = identifyPlannerMealUpliftOpportunities(plannedMeals, week1, []);
  const runU2 = identifyPlannerMealUpliftOpportunities(plannedMeals, week1, []);
  assert(JSON.stringify(runU1) === JSON.stringify(runU2), "deterministic: identical input yields byte-identical output (Rule LT3)");

  assert(identifyPlannerMealUpliftOpportunities([], week1, []).length === 0, "no planned meals → no opportunity, never fabricated");
  assert(
    identifyPlannerMealUpliftOpportunities([{ entryId: 901, dayOfWeek: 3, mealName: "Glass of tap water zzzq", mealId: 501 }], week1, []).length === 0,
    "a meal with no known lift → honest none (never invents an uplift)",
  );

  // SAFETY (Rule T0, reused): the ingredient surfaced with no restrictions is parsed,
  // then restricted — and must never be surfaced again (the filter removed it).
  const surfaced = uplift.suggestedAction.match(/(?:swap in|add more|add) (.+)\.$/)?.[1] ?? "";
  const RESTRICT_SURFACED: RestrictionDefinition = {
    id: "restrict_surfaced",
    displayName: surfaced,
    tier: "major_allergen",
    aliases: [surfaced],
    derivedIngredients: [],
    hiddenIngredients: [],
    substitutions: [],
    prohibitedPhrases: [],
  };
  const safe = identifyPlannerMealUpliftOpportunities(plannedMeals, week1, [RESTRICT_SURFACED]);
  const safeIngredient = safe[0]?.suggestedAction.match(/(?:swap in|add more|add) (.+)\.$/)?.[1] ?? "";
  assert(
    surfaced.length > 0 && (safe.length === 0 || safeIngredient !== surfaced),
    "a suggested ingredient conflicting with a household hard restriction is never surfaced (reuses the exact Rule T0 matcher)",
    `surfaced="${surfaced}" safeIngredient="${safeIngredient}"`,
  );

  section("§1 identifyPlannerBatchCookOpportunities (AFI2) — cook-once for a meal repeated across the week; one excellent, distinct-days, cited");

  // A week where "Overnight Oats" is planned on 3 distinct days (Tue/Wed/Fri), "Salad" on
  // 2 (Mon/Thu), and "Soup" once. dayOfWeek: 0=Mon. Mirrors the seeded demo household.
  const batchWeekMeals: PlannedMealRef[] = [
    { entryId: 1, dayOfWeek: 1, mealName: "Overnight Oats", mealId: 4773 },
    { entryId: 2, dayOfWeek: 2, mealName: "Overnight Oats", mealId: 4773 },
    { entryId: 3, dayOfWeek: 4, mealName: "Overnight Oats", mealId: 4773 },
    { entryId: 4, dayOfWeek: 0, mealName: "Chicken Salad", mealId: 4774 },
    { entryId: 5, dayOfWeek: 3, mealName: "Chicken Salad", mealId: 4774 },
    { entryId: 6, dayOfWeek: 5, mealName: "Lentil Soup", mealId: 4776 },
  ];

  const batchOps = identifyPlannerBatchCookOpportunities(batchWeekMeals, week1);
  assert(batchOps.length === 1, "several repeated meals → exactly ONE card (prefer one excellent over many)", String(batchOps.length));
  const batch = batchOps[0];
  assert(batch.type === "planner-batch-cook", "type is 'planner-batch-cook'");
  assert(batch.owningDomain === "planner", "owning domain is 'planner' (surfaces on the planner ambient surface + Companion)");
  assert(batch.priority === "low", "a batch-cook nudge is CALM — low priority, never urgent");
  assert(batch.subject.entity === "planner-meal" && batch.subject.id === 4773, "subject is the planner-meal keyed on the MEAL's own id (recurs across entries), the meal on the most days");
  assert(/Overnight Oats/.test(batch.explanation) && /3 days/.test(batch.explanation), "picks the meal on the MOST distinct days (Overnight Oats, 3), names the count");
  assert(/Tuesday/.test(batch.explanation) && /Wednesday/.test(batch.explanation) && /Friday/.test(batch.explanation), "names the actual days it is planned on (household-specific, grounded)");
  assert(batch.evidence.some((e) => e.source === "planner-week"), "evidence cites the plan it read (Rule E1 — no citation, no card)");
  assert(batch.id === `planner-batch-cook:${week1.id}:4773`, "id is stable per week + meal");

  // The same meal twice on ONE day is one cooking day, not two — never a false positive.
  const sameDayTwice: PlannedMealRef[] = [
    { entryId: 10, dayOfWeek: 2, mealName: "Stew", mealId: 700 },
    { entryId: 11, dayOfWeek: 2, mealName: "Stew", mealId: 700 },
  ];
  assert(identifyPlannerBatchCookOpportunities(sameDayTwice, week1).length === 0, "a meal on ONE day (even twice) → nothing (distinct days, never a fabricated batch)");

  // Determinism + honest none.
  const runB1 = identifyPlannerBatchCookOpportunities(batchWeekMeals, week1);
  const runB2 = identifyPlannerBatchCookOpportunities(batchWeekMeals, week1);
  assert(JSON.stringify(runB1) === JSON.stringify(runB2), "deterministic: identical input yields byte-identical output (Rule LT3)");
  assert(identifyPlannerBatchCookOpportunities([{ entryId: 20, dayOfWeek: 1, mealName: "Solo Meal", mealId: 800 }], week1).length === 0, "no meal repeated across days → honest none, never a manufactured batch");
  assert(identifyPlannerBatchCookOpportunities([], week1).length === 0, "no planned meals → no opportunity");

  // ---------------------------------------------------------------------------
  // AFI3/AFI4 — the generators specified by PANTRY1 and CBK2.
  //
  // WHY THEY ARE COVERED HERE. `test-pantry1-intelligent-pantry.ts` and
  // `test-cbk2-intelligent-cookbook.ts` specify these three generators, but NEITHER
  // SUITE CAN LOAD: they also import `generatePantryExplanation`,
  // `EMPTY_PANTRY_HOUSEHOLD_FACTS`, `generateRecipeExplanation`,
  // `PlannerOpportunitySignal` and `LearnedPreference`, none of which exist. Those are
  // EXPLAINER specifications — a separate workstream from the opportunity generators.
  // Until they are built, those suites cannot run and cannot be wired into `npm test`
  // (recorded as engineering debt in the AFI3–5 report), so the generator contracts are
  // proven HERE, in the suite that is already wired and green.
  // ---------------------------------------------------------------------------

  section("§1 identifyPantryNeedOpportunities (AFI3/PANTRY1) — the household's OWN recorded need, absent from their list");

  const needsMilk = { ...makePantryItem(10, "milk", "Milk"), needQuantityValue: 2, needUnit: "litres" };
  const fired = identifyPantryNeedOpportunities([needsMilk], []);
  assert(fired.length === 1, "a recorded need absent from the shopping list fires ONE card");
  const needCard = fired[0]!;
  assert(needCard.type === "pantry-need-not-on-shopping-list", "carries the PANTRY1 type", needCard.type);
  assert(needCard.owningDomain === "pantry", "owned by the PANTRY domain", needCard.owningDomain);
  assert(needCard.priority === "medium", "a missed shop is an inconvenience, never critical", needCard.priority);
  assert(needCard.id === "pantry-need-not-on-shopping-list:10", "id is deterministic and row-keyed", needCard.id);
  assert(
    needCard.subject.entity === "pantry-item" && needCard.subject.id === 10 && needCard.subject.label === "Milk",
    "subject is the structured pantry row (PHASE5E)",
  );
  assert(needCard.evidence.length === 2, "Rule E1 — cites BOTH owners it joined", String(needCard.evidence.length));
  assert(
    needCard.evidence.some((e) => e.source === "pantry-items") && needCard.evidence.some((e) => e.source === "shopping-list"),
    "the two owners are the pantry row and the shopping list",
  );
  assert(
    needCard.explanation.includes("2 litres") && needCard.explanation.includes("Milk"),
    "reports back what the household THEMSELVES declared",
    needCard.explanation,
  );

  // Honest gaps — every one of these must stay silent.
  assert(
    identifyPantryNeedOpportunities([needsMilk], [makeShoppingItem(1, "Milk")]).length === 0,
    "a need already on the list is SILENT — matched on canonical identity, not spelling",
  );
  assert(
    identifyPantryNeedOpportunities([makePantryItem(11, "milk", "Milk")], []).length === 0,
    "no recorded need fires nothing — consumption is NEVER modelled",
  );
  assert(
    identifyPantryNeedOpportunities([{ ...makePantryItem(12, "milk", "Milk"), needQuantityValue: 0 }], []).length === 0,
    "a zero need is not a need",
  );
  assert(
    identifyPantryNeedOpportunities([{ ...makePantryItem(13, "milk", "Milk", true), needQuantityValue: 2 }], []).length === 0,
    "a deleted pantry row is not read",
  );
  assert(
    identifyPantryNeedOpportunities(
      [{ ...makePantryItem(14, "zzz-not-a-real-food-xyz", "Grandma's Secret Spice Blend"), needQuantityValue: 1, needUnit: "jar" }],
      [],
    ).length === 0,
    "THE REFUSAL — an unidentifiable food is SILENT, never guessed at",
  );
  assert(
    identifyPantryNeedOpportunities([{ ...makePantryItem(15, "milk", "Milk"), needQuantityValue: 2, needUnit: null }], [])[0]
      ?.explanation.includes("2 Milk") === false,
    "a null unit degrades gracefully — never the string \"2 null\"",
  );

  section("§1 identifyCookbookCookableNowOpportunities (AFI4/CBK2) — every ingredient owned, or no card at all");

  const cookPantry = [makePantryItem(1, "tomato", "Tomatoes"), makePantryItem(2, "onion", "Onions")];
  const cookable = identifyCookbookCookableNowOpportunities(
    [{ id: 10, name: "Tomato & Onion Salad", ingredients: ["tomato", "onion"] }],
    cookPantry,
  );
  assert(cookable.length === 1, "a recipe whose EVERY ingredient is in the pantry produces a card");
  assert(
    cookable[0]?.owningDomain === "cookbook" && cookable[0]?.subject.entity === "meal",
    "the card is owned by the COOKBOOK domain and is about a MEAL",
  );
  assert(cookable[0]?.id === "cookbook-recipe-cookable-now:10", "id is keyed on the meal's own primary key", cookable[0]?.id);
  assert((cookable[0]?.evidence.length ?? 0) >= 2, "Rule E1 — cites BOTH owners it joined (meals + pantry-items)");
  assert(cookable[0]?.priority === "low", "a meal you COULD cook is a possibility, not a call to action");

  // The two refusals this generator exists for.
  assert(
    identifyCookbookCookableNowOpportunities(
      [{ id: 11, name: "Tomato & Beef Stew", ingredients: ["tomato", "onion", "beef"] }],
      cookPantry,
    ).length === 0,
    "a recipe missing ONE ingredient produces NO card (never \"nearly cookable\")",
  );
  assert(
    identifyCookbookCookableNowOpportunities(
      [{ id: 12, name: "Mystery Dish", ingredients: ["tomato", "onion", "xyzzy-not-a-food-42"] }],
      cookPantry,
    ).length === 0,
    "an UNIDENTIFIABLE ingredient BLOCKS the card — a knowledge gap is never treated as \"owned\"",
  );
  assert(
    identifyCookbookCookableNowOpportunities([{ id: 13, name: "Tomato Salad", ingredients: ["tomato"] }], []).length === 0,
    "an empty pantry produces no cookable-now card",
  );
  assert(
    identifyCookbookCookableNowOpportunities([{ id: 14, name: "Empty Recipe", ingredients: [] }], cookPantry).length === 0,
    "a recipe with NO recorded ingredients never fires (no vacuous truth)",
  );
  assert(
    JSON.stringify(
      identifyCookbookCookableNowOpportunities([{ id: 10, name: "Tomato & Onion Salad", ingredients: ["tomato", "onion"] }], cookPantry),
    ) === JSON.stringify(cookable),
    "deterministic: identical input yields byte-identical output (Rule LT3)",
  );

  section("§1 identifyCookbookHouseholdConflictOpportunities (AFI4/CBK2) — names the ingredient, never edits the recipe");

  const VEGETARIAN_DEF: RestrictionDefinition = {
    id: "vegetarian",
    displayName: "Vegetarian",
    tier: "additional_restriction",
    aliases: ["chicken", "beef", "pork"],
    derivedIngredients: [],
    hiddenIngredients: [],
    substitutions: [],
    prohibitedPhrases: [],
  };
  const conflicts = identifyCookbookHouseholdConflictOpportunities(
    [
      { id: 20, name: "Chicken Curry", ingredients: ["chicken", "onion"] },
      { id: 21, name: "Tomato Pasta", ingredients: ["tomato", "pasta"] },
    ],
    [VEGETARIAN_DEF],
  );
  assert(conflicts.length === 1, "only the recipe that ACTUALLY conflicts produces a card", String(conflicts.length));
  assert(conflicts[0]?.subject.id === 20, "the card names the conflicting recipe");
  assert(
    conflicts[0]?.evidence.some((e) => e.source === "household-eaters"),
    "Rule E1 — the restriction is cited to household-eaters",
  );
  assert(
    conflicts[0]?.evidence.some((e) => e.detail.includes("chicken")),
    "names the INGREDIENT that caused the conflict, not just the recipe",
  );
  assert(
    conflicts[0]?.priority === "medium",
    "a cookbook conflict is medium — only shopping-restriction-conflict may be critical",
    conflicts[0]?.priority,
  );
  assert(
    /adapt|keep it as it is/i.test(conflicts[0]?.suggestedAction ?? ""),
    "the action SUGGESTS adapting or keeping — CBK2 never edits a household's recipe",
    conflicts[0]?.suggestedAction,
  );
  assert(
    identifyCookbookHouseholdConflictOpportunities([{ id: 20, name: "Chicken Curry", ingredients: ["chicken"] }], []).length === 0,
    "no stored restrictions ⇒ no conflict cards (never a guessed restriction)",
  );

  section("§1 AFI5 (Companion) — the cookbook domain is REGISTERED, not silently dropped");

  // The silent-drop guard. An unregistered domain is produced, delivered, budgeted and
  // learned from — then vanishes one step before the household could read it.
  const cookbookNotices = noticeOpportunities([
    {
      id: "food-intelligence:cookbook-recipe-cookable-now:10",
      domain: "cookbook",
      priority: "low",
      explanation: "You have everything for \"Tomato Salad\".",
      suggestedAction: "Cook it from what you already have.",
      evidence: [{ source: "meals", detail: "It is in your cookbook." }],
    },
  ]);
  assert(
    cookbookNotices.length === 1 && cookbookNotices[0]?.category === "cookbook-opportunity",
    "a cookbook opportunity reaches the Companion as a `cookbook-opportunity` notice",
  );
  assert(
    noticeOpportunities([
      { id: "x", domain: "cookbook", priority: "low", explanation: "e", suggestedAction: "a", evidence: [] },
    ]).length === 0,
    "an UNCITED cookbook opportunity is still DROPPED at the notice boundary (Rule E1)",
  );
  assert(selectSurface("cookbook") === "meals", "the cookbook domain routes to the EXISTING meals surface", selectSurface("cookbook"));

  section("§1 prioritizeOpportunities — stable priority ordering, limit clamping");

  // PHASE5E — every opportunity names the canonical entity it is about. It is a
  // REQUIRED field on the producer's own type (unlike OD1's envelope, where it is
  // optional): a generator that cannot say what its opportunity concerns has not
  // finished identifying one, and a card that cannot name its subject can never be
  // explained.
  const mixed: FoodOpportunity[] = [
    { id: "a", type: "pantry-item-unused-in-plan", owningDomain: "pantry", priority: "low", explanation: "a", evidence: [], suggestedAction: "a", subject: { entity: "pantry-item", id: 1, label: "a" } },
    { id: "b", type: "shopping-restriction-conflict", owningDomain: "shopping", priority: "high", explanation: "b", evidence: [], suggestedAction: "b", subject: { entity: "shopping-item", id: 2, label: "b" } },
    { id: "c", type: "planner-empty-day", owningDomain: "planner", priority: "medium", explanation: "c", evidence: [], suggestedAction: "c", subject: { entity: "planner-day", id: 3, label: "c" } },
    { id: "d", type: "shopping-restriction-conflict", owningDomain: "shopping", priority: "high", explanation: "d", evidence: [], suggestedAction: "d", subject: { entity: "shopping-item", id: 4, label: "d" } },
  ];
  const prioritized = prioritizeOpportunities(mixed);
  assert(
    prioritized.map((o) => o.id).join(",") === "b,d,c,a",
    "high before medium before low; stable within a tier",
    prioritized.map((o) => o.id).join(","),
  );
  assert(prioritizeOpportunities(mixed, 2).length === 2, "limit clamps the result count");
  assert(prioritizeOpportunities([]).length === 0, "no opportunities in → no opportunities out");

  // ---------------------------------------------------------------------------
  // §2 — Port → Handler → Binding contract (the `report` verb)
  // ---------------------------------------------------------------------------

  section("§2 Capability lookup — FI4 adds no new capability (OD1 later adds a twentieth, unrelated one)");
  assert(
    intelligencePlatform.getCapability("food-intelligence")!.availability === "available",
    "canonical singleton: food-intelligence remains 'available'",
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(live.length === 22, "exactly TWENTY-TWO live capabilities — FI4 extends food-intelligence (no new one); OD1 adds opportunity-delivery; EL1 separately adds evidence-learning", String(live.length));
  assert(
    intelligencePlatform.getCapability("food-intelligence")!.executableIntents.includes("report"),
    "executableIntents now declares 'report' alongside recommend/explain (truthful registry — INT6A)",
  );
  assert(
    intelligencePlatform.getCapability("food-intelligence")!.executableIntents.includes("recommend") &&
      intelligencePlatform.getCapability("food-intelligence")!.executableIntents.includes("explain"),
    "the pre-existing recommend/explain verbs are unaffected by the FI4 extension",
  );

  function makeOpportunityBundle(overrides: Partial<FoodOpportunityBundle> = {}): FoodOpportunityBundle {
    return {
      opportunities: [
        {
          id: "planner-empty-day:1",
          type: "planner-empty-day",
          owningDomain: "planner",
          priority: "high",
          explanation: "Wednesday has no meals planned yet.",
          evidence: [{ source: "planner-week", detail: "test" }],
          suggestedAction: "Add a meal to Wednesday.",
          subject: { entity: "planner-day", id: 1, label: "Wednesday" },
        },
      ],
      trust: { householdAware: true },
      metadata: { assembledAt: new Date().toISOString(), sources: ["planner"] },
      ...overrides,
    };
  }

  const calls: string[] = [];
  function makePort(): FoodIntelligenceReadPort {
    return {
      assembleFoodIntelligence: async () => {
        throw new Error("report tests must not call assembleFoodIntelligence");
      },
      assembleFoodComparison: async () => {
        throw new Error("report tests must not call assembleFoodComparison");
      },
      identifyOpportunities: async (request) => {
        calls.push(`identifyOpportunities(${request.userId})`);
        if (request.userId === 999) {
          return { opportunities: [], trust: { householdAware: false }, metadata: { assembledAt: new Date().toISOString(), sources: [] } };
        }
        return makeOpportunityBundle();
      },
    };
  }

  function platformWithFakeFoodIntelligence(): IntelligencePlatform {
    const p = new IntelligencePlatform(new CapabilityRegistry());
    p.registerHandler("food-intelligence", createFoodIntelligenceReadHandler(async () => makePort()), ["recommend", "explain", "report"]);
    return p;
  }

  const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };
  const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
  const noHouseholdUser: IntelligenceContext = { role: "user", userId: "999", premium: false };

  section("§2 report — requires authentication (never a fabricated household)");
  const platform = platformWithFakeFoodIntelligence();
  calls.length = 0;
  const anonReport = await platform.handle({ verb: "report", capabilityId: "food-intelligence", parameters: {} }, anon);
  assert(anonReport.status === "gap", "anonymous report → honest gap, never fabricated", anonReport.status);
  assert(calls.length === 0, "an anonymous request never reaches the engine port");

  section("§2 report — honest gap when no household resolves");
  const noHouseholdReport = await platform.handle({ verb: "report", capabilityId: "food-intelligence", parameters: {} }, noHouseholdUser);
  assert(noHouseholdReport.status === "gap", "no resolvable household → honest gap", noHouseholdReport.status);
  assert(/will not fabricate a household/.test(noHouseholdReport.message ?? ""), "gap message refuses to fabricate a household");

  section("§2 report — ok with prioritised opportunities for a resolved household");
  const okReport = await platform.handle({ verb: "report", capabilityId: "food-intelligence", parameters: { limit: 5 } }, user1);
  assert(okReport.status === "ok", "report for a resolved household → ok", okReport.status);
  const okResult = okReport.result as any;
  assert(okResult.source === "food-opportunity-engine", "result is attributed to the food-opportunity-engine source");
  assert(okResult.opportunities.length === 1 && okResult.opportunities[0].owningDomain === "planner", "opportunities surfaced from the port");
  assert(calls.includes("identifyOpportunities(1)"), "delegated to the opportunity engine port with the caller's own numeric userId");

  section("§2 Unsupported intent — verbs outside the extended allow-list still rejected");
  const searchIntent = await platform.handle({ verb: "search", capabilityId: "food-intelligence", parameters: {} }, user1);
  assert(searchIntent.status === "unsupported_intent", "search not in allow-list → unsupported_intent", searchIntent.status);

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`FI4 Food Opportunity Engine binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
