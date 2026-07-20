/**
 * meal-service.ts
 *
 * Starter meals — the first cookbook a household is ever given (SURF1B5).
 *
 * ── The defect this file exists to have fixed ────────────────────────────────
 * Starter meals were selected by a PREFERENCE and never by SAFETY.
 *
 * `getStarterMeals()` read `user_preferences.diet_types` — a soft label preference,
 * which the Source of Truth register and `household-dietary-safety.ts` both class as
 * "soft, advisory, never a safety gate" — matched it against the `meals.diet_types`
 * LABEL, and then called `pickMealsWithBackfill()`, which topped the list up from ALL
 * system meals whenever too few carried the label. Three consequences, all live:
 *
 *   1. BACKFILL FAIL-OPEN. 21 meals are wanted per category; the cookbook carries 2
 *      vegan-labelled breakfasts, 6 vegan lunches and 13 vegan dinners. So every
 *      vegan slot (and the vegetarian breakfast and lunch slots) topped up from the
 *      unrestricted pool — and the top-up pool is full of meat.
 *   2. NO PATTERN, NO GATE. The label filter only ran when `diet_types` was non-empty.
 *      43 live users hold a diet PATTERN (`users.diet_pattern`) with no label
 *      preference at all, and were handed the unfiltered cookbook.
 *   3. NO ALLERGENS AT ALL. `users.diet_restrictions` was never read here. A
 *      Gluten-Free household was served 42 gluten-bearing starter meals.
 *
 * A label is a claim about a meal. A restriction is a fact about a household. The old
 * code asked the claim and never asked the household.
 *
 * ── What it does now ────────────────────────────────────────────────────────
 * Every starter meal — candidate AND backfill — passes `isMealSafeForHousehold()`,
 * the one canonical gate (SURF1B), which resolves the household's restrictions through
 * the canonical restriction library and the requester's diet pattern through
 * `dietRules` (which, since SURF1B4, is the same library again).
 *
 * The label keeps exactly the job it can do honestly: it ORDERS the safe pool. A
 * vegan-labelled safe meal is offered before an unlabelled safe one. It can no longer
 * admit a meal, and it can no longer be the reason a meal is admitted.
 *
 * ── Fewer, never unsafe ─────────────────────────────────────────────────────
 * When the safe pool is smaller than the slot count, the household receives FEWER
 * starter meals. It does not receive a prohibited one, and none is invented. An empty
 * category is an honest statement that THA's cookbook has nothing safe to offer that
 * household yet — and it is the cookbook's job to fix that, not this function's.
 */
import { db } from "../db";
import { meals, userPreferences, users } from "@shared/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import type { Meal } from "@shared/schema";
import {
  resolveHouseholdSafetyContext,
  isMealSafeForHousehold,
  isSafetyGateActive,
  type HouseholdSafetyContext,
  type SafetyCheckableMeal,
} from "./household-dietary-safety";

const BREAKFAST_CATEGORY_ID = 1;
const LUNCH_CATEGORY_ID = 2;
const DINNER_CATEGORY_ID = 3;

const MEALS_PER_CATEGORY = 21;

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Order the safe pool by the household's soft label preference. NOT a gate.
 *
 * This is the one thing `meals.diet_types` is allowed to do. It runs over meals the
 * canonical gate has already passed, so a wrong label can now cost a household a
 * better-matched meal — never their safety.
 */
function filterByDiet(mealsList: Meal[], dietTypes: string[]): Meal[] {
  if (!dietTypes.length) return mealsList;
  return mealsList.filter((meal) => {
    if (!meal.dietTypes || meal.dietTypes.length === 0) return false;
    return dietTypes.some((diet) => meal.dietTypes.includes(diet));
  });
}

/** The fields the canonical gate inspects. `meals` carries no cuisine or description. */
function toSafetyCheckable(meal: Meal): SafetyCheckableMeal {
  return { name: meal.name, ingredients: meal.ingredients ?? [] };
}

/**
 * The starter-meal safety gate. Every meal this function returns has been put to
 * `isMealSafeForHousehold()`; every meal it drops was refused by it.
 *
 * Fails CLOSED by construction: an `unavailable` safety context refuses every meal
 * (SURF1B), so this returns an empty pool rather than the cookbook.
 */
function safeCandidates(pool: Meal[], ctx: HouseholdSafetyContext): Meal[] {
  return pool.filter((meal) => isMealSafeForHousehold(toSafetyCheckable(meal), ctx).safe);
}

/**
 * Fill `count` slots from `preferred` first, then top up from `safePool`.
 *
 * `safePool` is the ONLY source of backfill, and every meal in it has passed the
 * canonical gate. Before SURF1B5 the backfill source was the whole unrestricted
 * category — which is precisely how a vegan household was served a bacon breakfast
 * once the two vegan-labelled breakfasts ran out.
 *
 * Returns fewer than `count` when the safe pool is smaller than `count`. That
 * shortfall is the correct answer and must never be padded.
 *
 * Exported so the safety contract can be pinned directly: which pool the top-up is
 * drawn from IS the defect SURF1B5 fixes, and a test that can only reach it through
 * the database would pass on a cookbook that happened to hold no meat.
 */
export function pickMealsWithBackfill(
  preferred: Meal[],
  safePool: Meal[],
  count: number
): Meal[] {
  const shuffledPreferred = shuffleArray(preferred);
  if (shuffledPreferred.length >= count) {
    return shuffledPreferred.slice(0, count);
  }
  const selected = [...shuffledPreferred];
  const selectedIds = new Set(selected.map((m) => m.id));
  const remaining = shuffleArray(
    safePool.filter((m) => !selectedIds.has(m.id))
  );
  for (const meal of remaining) {
    if (selected.length >= count) break;
    selected.push(meal);
  }
  return selected;
}

export async function getStarterMeals(userId: number): Promise<{
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
}> {
  // The household's canonical safety context: every member's hard restrictions
  // (unioned) and the requester's own diet pattern (never unioned — a vegan and an
  // omnivore sharing a kitchen do not make every meal vegan; SURF1B).
  const safety = await resolveHouseholdSafetyContext(userId);

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));

  // SOFT. Ordering only. Never an admission.
  const labelPreferences = prefs?.dietTypes ?? [];

  const systemMeals = await db
    .select()
    .from(meals)
    .where(
      and(
        eq(meals.isSystemMeal, true),
        // FOUNDATION_MEALS3 — a starter meal is THA handing a household a recipe
        // unprompted, which makes this the worst place of all to offer a dish
        // that cannot be cooked. Retired meals are never candidates.
        isNull(meals.retiredAt),
        inArray(meals.categoryId, [
          BREAKFAST_CATEGORY_ID,
          LUNCH_CATEGORY_ID,
          DINNER_CATEGORY_ID,
        ])
      )
    );

  // An unrestricted household — no hard restriction, no diet pattern — has nothing to
  // gate against, so it keeps its existing behaviour exactly: label-preferred first,
  // backfilled from the whole category. `isSafetyGateActive()` treats an UNAVAILABLE
  // context as active, so a context THA could not resolve takes the gated path and is
  // refused there, rather than falling through to here.
  const gateActive = isSafetyGateActive(safety);

  if (gateActive && safety.status === "unavailable") {
    console.error(
      `[SURF1B5] Household safety context unavailable for user ${userId}. Returning no ` +
        `starter meals. "We could not find out" is not "no restrictions" — refusing to ` +
        `guess is the only safe answer here.`,
    );
  }

  const selectFor = (pool: Meal[]): Meal[] => {
    const safePool = gateActive ? safeCandidates(pool, safety) : pool;
    const preferred = filterByDiet(safePool, labelPreferences);
    return pickMealsWithBackfill(preferred, safePool, MEALS_PER_CATEGORY);
  };

  return {
    breakfast: selectFor(
      systemMeals.filter((m) => m.categoryId === BREAKFAST_CATEGORY_ID)
    ),
    lunch: selectFor(
      systemMeals.filter((m) => m.categoryId === LUNCH_CATEGORY_ID)
    ),
    dinner: selectFor(
      systemMeals.filter((m) => m.categoryId === DINNER_CATEGORY_ID)
    ),
  };
}

export async function hasStarterMealsLoaded(userId: number): Promise<boolean> {
  const [user] = await db
    .select({ starterMealsLoaded: users.starterMealsLoaded })
    .from(users)
    .where(eq(users.id, userId));
  return user?.starterMealsLoaded ?? false;
}

/**
 * Copy the household's starter meals into their cookbook, once, at onboarding.
 *
 * Every meal copied has passed the canonical gate — `getStarterMeals()` returns
 * nothing else. A household with few safe candidates receives few starter meals; one
 * with none receives none, and is NOT marked as loaded, so the copy is retried rather
 * than silently written off. That matters because `starter_meals_loaded` is a one-way
 * flag: setting it after an empty or failed selection would permanently deny the
 * household the starter cookbook they were entitled to.
 */
export async function preloadStarterMeals(userId: number): Promise<number> {
  const alreadyLoaded = await hasStarterMealsLoaded(userId);
  if (alreadyLoaded) return 0;

  const starterMeals = await getStarterMeals(userId);
  const allStarter = [
    ...starterMeals.breakfast,
    ...starterMeals.lunch,
    ...starterMeals.dinner,
  ];

  if (allStarter.length === 0) {
    console.warn(
      `[SURF1B5] No safe starter meals for user ${userId} — nothing preloaded, and the ` +
        `household is NOT marked as loaded. Either the safety context was unavailable, or ` +
        `THA's cookbook currently holds nothing this household may eat. Neither is fixed ` +
        `by serving them something they cannot eat.`,
    );
    return 0;
  }

  await db.transaction(async (tx) => {
    for (const meal of allStarter) {
      await tx.insert(meals).values({
        userId,
        name: meal.name,
        ingredients: meal.ingredients,
        instructions: meal.instructions ?? [],
        imageUrl: meal.imageUrl ?? null,
        servings: meal.servings,
        categoryId: meal.categoryId,
        sourceUrl: meal.sourceUrl ?? null,
        isReadyMeal: meal.isReadyMeal,
        mealFormat: meal.mealFormat,
        dietTypes: meal.dietTypes,
        mealSourceType: "starter",
      });
    }
    await tx
      .update(users)
      .set({ starterMealsLoaded: true })
      .where(eq(users.id, userId));
  });

  return allStarter.length;
}
