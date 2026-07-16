// PANTRY1 — the Pantry's ONE intelligence composer.
//
// THIS MODULE OWNS NOTHING, AND IT IS NOT AN ENGINE.
//
// That distinction is the whole licence for this file to exist, so it is worth being
// exact about. An ENGINE decides something: it holds a rule, a weight, a threshold or a
// verdict that is true nowhere else, and if you deleted it a fact would disappear from
// THA. An ASSEMBLER decides nothing: every fact it returns is fetched from that fact's
// existing canonical owner and returned ephemerally, and if you deleted it the facts
// would all still be there — only the joining of them would be gone.
//
// Nothing here is persisted, cached, scored, ranked or judged. There is no pantry rule
// in this file. It is the same shape as `food-intelligence-assembler.ts` (WX4),
// `meal-intelligence-assembler.ts` (WX1A) and `household-nutrition-assembler.ts` (HNP1),
// and it sits beside them rather than beneath a new abstraction.
//
// OWNERSHIP MAP — every fact below names the owner it was read from:
//   pantry rows          → DB user_pantry_items, via the INT8 PantryReadPort
//   household + restrictions → resolveHouseholdSignal (the FI3 engine's ONE household read)
//   restriction matching → shared/restrictions (resolveIngredientRestrictions)
//   canonical identity   → shared/canonical/resolver.ts (resolveCanonicalFood)
//   season / familiarity / learning / opportunities
//                        → buildPlannerExplanationContext (PLAN1/PLAN2's ONE composer)
//   the household's recipes → DB meals, via the INT15 MealsReadPort
//   the shopping list    → DB shopping_list, via the SHOP1 ShoppingReadPort
//   the explanation      → explainability-service.ts — THE one owner of "why"
//
// `pantry_ingredient_knowledge` is deliberately ABSENT from that map. It is the Pantry's own
// knowledge table and it is right there — but its `supports` column is free text, of mixed
// category, and evidence-UNGATED, and it contains health claims ("Gut health",
// "Anti-inflammatory compounds"). It is legitimate as EDITORIAL COPY, which is how the Pantry
// Knowledge card already renders it, and inadmissible as cited evidence. See
// `generatePantryExplanation` for the full reasoning.
//
// WHY IT REUSES THE PLANNER'S CONTEXT COMPOSER RATHER THAN BUILDING ITS OWN.
// `buildPlannerExplanationContext` already reads, once and correctly, every ambient fact
// the Pantry needs: the season, the household's planner familiarity, LEARN1's confirmed
// understanding (through EL2's one door), and the open opportunities (from the PRODUCERS,
// never from the delivery door — calling `opportunity-delivery:report` from a background
// read would quietly eat the household's unseen notices; see that module's header). A
// second composer beside it would be the second owner of all four, and would be free to
// disagree with the Planner about what season it is. It is named for the Planner and read
// by the Planner, the Cookbook and now the Pantry — a naming debt, deliberately not paid
// here (DEC1: "location unchanged at designation; naming is governance, not churn").
//
// PROGRESSIVE ENRICHMENT (Architecture Principle 3). Every read below is independently
// optional and independently guarded. One unreadable owner costs its own dimension and
// nothing else, and is reported as an honest gap (`aware: false`) — never as a zero, and
// never as a guess. A database outage must not read as "your cookbook uses this in no
// recipes".

import { resolveCanonicalFood } from "@shared/canonical/resolver";
import { resolveIngredientRestrictions } from "@shared/restrictions/restriction-resolver";
import { mealCanonicalFoods } from "./planner-explanation-context";
import type { PantryExplanation, PantryHouseholdFacts } from "./explainability-service";

// The DB-backed owners are imported dynamically at call time, not statically:
// `server/db.ts` throws on import when DATABASE_URL is absent, and this module must stay
// importable — and its composition testable — without a database.

/**
 * What THA can honestly say about ONE food in ONE household's pantry.
 *
 * Every section is independently optional. Absent data returns null. No section ever
 * fabricates content, and this object is ephemeral — nothing here is stored.
 */
export interface PantryItemIntelligence {
  readonly ingredientKey: string;
  readonly displayName: string;
  /** The one canonical identity, or null when THA cannot identify this food. */
  readonly canonicalSlug: string | null;
  /** Whether the food is actually in the caller's own pantry. */
  readonly inPantry: boolean;
  /**
   * PANTRY1 — the pantry's reasoning. Null when the item is not in the caller's pantry, or
   * when no owner could be read. Carries NO score, by type (see `PantryExplanation`).
   */
  readonly reasoning: PantryExplanation | null;
  readonly trust: {
    /** True only when the caller's own household resolved and contributed the facts below. */
    readonly householdAware: boolean;
  };
  readonly metadata: {
    readonly assembledAt: string;
    /** The owners genuinely read for this assembly. An owner that failed is absent. */
    readonly sources: readonly string[];
  };
}

function emptyIntelligence(
  ingredientKey: string,
  displayName: string,
  now: Date,
  householdAware: boolean,
  sources: readonly string[] = [],
): PantryItemIntelligence {
  return {
    ingredientKey,
    displayName,
    canonicalSlug: resolveCanonicalFood(ingredientKey).canonicalSlug ?? null,
    inPantry: false,
    reasoning: null,
    trust: { householdAware },
    metadata: { assembledAt: now.toISOString(), sources },
  };
}

/**
 * PANTRY1 — assemble the reasoning for one food in the caller's own pantry.
 *
 * Always returns a complete object — never throws. A caller whose pantry cannot be read,
 * or who does not have this food, gets an honest empty assembly (`reasoning: null`), never
 * a fabricated one.
 *
 * Household scoping is inherited, not re-implemented: `getPantryItems(userId)` is scoped to
 * the caller's household by its owner (storage.ts), so a food this household does not have
 * simply is not found. There is no cross-household read to guard against here because there
 * is no cross-household read available.
 */
export async function getPantryItemIntelligence(
  ingredientKey: string,
  userId: number,
  now: Date = new Date(),
): Promise<PantryItemIntelligence> {
  const key = ingredientKey.trim();
  if (!key || !Number.isFinite(userId)) return emptyIntelligence(ingredientKey, ingredientKey, now, false);

  const sources = new Set<string>();

  // ── The pantry row itself — owner: DB user_pantry_items (INT8 read port) ────
  let item: {
    ingredientKey: string;
    displayName: string | null;
    needQuantityValue: number | null;
    needUnit: string | null;
  } | null = null;
  try {
    const { createStoragePantryReadPort } = await import("../intelligence/handlers/pantry-read-port.js");
    const port = await createStoragePantryReadPort();
    const items = await port.getPantryItems(userId);
    item = items.find((i) => i.ingredientKey === key && !i.isDeleted) ?? null;
    sources.add("pantry-items");
  } catch (err) {
    console.error("[PANTRY1] Pantry unreadable:", err);
    return emptyIntelligence(key, key, now, false);
  }

  // Not in this household's pantry. Honest, and the end of it — there is nothing to
  // explain about a food they do not have, and inventing a household for it would be
  // the fabrication this file exists to avoid.
  if (!item) return emptyIntelligence(key, key, now, true, Array.from(sources));

  const name = item.displayName ?? item.ingredientKey;
  const slug = resolveCanonicalFood(item.ingredientKey).canonicalSlug ?? null;

  // ── The ambient context — owner: PLAN1/PLAN2's ONE composer ─────────────────
  // Season, planner familiarity, LEARN1's confirmed understanding, and the open
  // opportunities. Read once, from the composer that already owns all four.
  const { buildPlannerExplanationContext } = await import("./planner-explanation-context.js");
  const { EMPTY_PLANNER_EXPLANATION_CONTEXT } = await import("./planner-explanation-context.js");
  let context = EMPTY_PLANNER_EXPLANATION_CONTEXT;
  try {
    context = await buildPlannerExplanationContext(userId, now);
    if (context.seasonAware) sources.add("seasonal-map");
    if (context.historyAware) sources.add("planner-entries");
    if (context.learningAware) sources.add("household-learning");
    if (context.opportunityAware) sources.add("opportunity-producers");
  } catch (err) {
    console.error("[PANTRY1] Planner explanation context unavailable:", err);
  }

  const facts = await assembleHouseholdFacts(name, slug, userId, sources);

  // ── The explanation — owner: explainability-service.ts (THE one owner of "why") ──
  let reasoning: PantryExplanation | null = null;
  try {
    const { generatePantryExplanation } = await import("./explainability-service.js");
    reasoning = generatePantryExplanation(
      {
        name,
        ingredientKey: item.ingredientKey,
        needQuantityValue: item.needQuantityValue,
        needUnit: item.needUnit,
      },
      context,
      facts,
    );
    sources.add("explainability-service");
  } catch (err) {
    console.error("[PANTRY1] Pantry reasoning unavailable:", err);
  }

  return {
    ingredientKey: item.ingredientKey,
    displayName: name,
    canonicalSlug: slug,
    inPantry: true,
    // An explanation with no evidence is not an explanation. It is returned as absent
    // rather than as an empty shell a surface would then have to decide how to render.
    reasoning: reasoning && reasoning.evidence.length > 0 ? reasoning : null,
    trust: { householdAware: facts.householdAware },
    metadata: { assembledAt: now.toISOString(), sources: Array.from(sources) },
  };
}

/**
 * The household-scoped joins the pure explainer cannot make for itself. Each is read from
 * its canonical owner, and each degrades independently to an honest `aware: false`.
 */
async function assembleHouseholdFacts(
  name: string,
  slug: string | null,
  userId: number,
  sources: Set<string>,
): Promise<PantryHouseholdFacts> {
  const { EMPTY_PANTRY_HOUSEHOLD_FACTS } = await import("./explainability-service.js");

  const [household, cookbook, shopping] = await Promise.all([
    readHouseholdConflicts(name, userId, sources),
    readRecipesUsingFood(slug, userId, sources),
    readShoppingListing(slug, userId, sources),
  ]);

  return {
    ...EMPTY_PANTRY_HOUSEHOLD_FACTS,
    restrictionConflicts: household.conflicts,
    householdAware: household.aware,
    recipesUsingFood: cookbook.recipes,
    cookbookAware: cookbook.aware,
    onShoppingList: shopping.listed,
    shoppingAware: shopping.aware,
  };
}

/**
 * HOUSEHOLD-AWARE. Owner: `resolveHouseholdSignal` (the FI3 engine's one household read,
 * already reused by the Food Opportunity Engine) + shared/restrictions for the matching.
 * No second restriction-matching implementation is introduced — this is the same
 * `resolveIngredientRestrictions` the Rule T0 safety exclusion and all three
 * restriction-conflict generators already call.
 */
async function readHouseholdConflicts(
  name: string,
  userId: number,
  sources: Set<string>,
): Promise<{ conflicts: readonly string[]; aware: boolean }> {
  try {
    const { resolveHouseholdSignal } = await import("../intelligence/food-intelligence/engine.js");
    const household = await resolveHouseholdSignal(userId);
    if (!household.resolved) return { conflicts: [], aware: false };
    sources.add("household-eaters");

    const matches = resolveIngredientRestrictions(name, [...household.restrictionDefs]);
    const conflicts: string[] = [];
    for (const match of matches) {
      const display = match.restriction.displayName;
      if (!conflicts.includes(display)) conflicts.push(display);
    }
    return { conflicts, aware: true };
  } catch (err) {
    console.error("[PANTRY1] Household restrictions unavailable:", err);
    return { conflicts: [], aware: false };
  }
}

/**
 * COOKBOOK-AWARE. Owner: DB meals, through the EXISTING INT15 meals read port, whose
 * `getMeals(userId)` is user-scoped by the owner. System meals are deliberately NOT read:
 * a THA library recipe the household has never seen is not a reason they keep this
 * ingredient in the cupboard, and counting it would inflate a number they cannot check.
 *
 * Identity is resolved with `mealCanonicalFoods` — the SAME function the Planner and the
 * Cookbook use to turn an ingredient list into canonical slugs, so the Pantry cannot
 * disagree with either about which recipes contain chickpeas.
 */
async function readRecipesUsingFood(
  slug: string | null,
  userId: number,
  sources: Set<string>,
): Promise<{ recipes: readonly string[]; aware: boolean }> {
  // An unidentifiable food cannot be matched against a recipe's ingredients in the one
  // canonical key space. Silence, never a raw string scan (which would match "salt" to
  // "salted butter" and tell a household a lie with a citation attached).
  if (!slug) return { recipes: [], aware: false };
  try {
    const { createStorageMealsReadPort } = await import("../intelligence/handlers/meals-read-port.js");
    const port = await createStorageMealsReadPort();
    const meals = await port.getMeals(userId);
    sources.add("meals");

    const recipes: string[] = [];
    for (const meal of meals) {
      const ingredients = meal.ingredients ?? [];
      if (ingredients.length === 0) continue;
      if (mealCanonicalFoods(ingredients).has(slug)) recipes.push(meal.name);
    }
    return { recipes, aware: true };
  } catch (err) {
    console.error("[PANTRY1] Cookbook unavailable:", err);
    return { recipes: [], aware: false };
  }
}

/**
 * SHOPPING-AWARE. Owner: DB shopping_list, through the EXISTING shopping read port.
 * Compared on the one canonical slug, exactly as the SHOP1 duplicate generator does.
 */
async function readShoppingListing(
  slug: string | null,
  userId: number,
  sources: Set<string>,
): Promise<{ listed: boolean; aware: boolean }> {
  if (!slug) return { listed: false, aware: false };
  try {
    const { createStorageShoppingReadPort } = await import("../intelligence/handlers/shopping-read-port.js");
    const port = await createStorageShoppingReadPort();
    const items = await port.getShoppingListItems(userId);
    sources.add("shopping-list");

    const listed = items.some(
      (line) => resolveCanonicalFood(line.normalizedName ?? line.productName).canonicalSlug === slug,
    );
    return { listed, aware: true };
  } catch (err) {
    console.error("[PANTRY1] Shopping list unavailable:", err);
    return { listed: false, aware: false };
  }
}
