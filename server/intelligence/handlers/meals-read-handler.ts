/**
 * Meals Read Handler (INT15 — ninth live capability binding)
 * ==============================================================
 * The NINTH execution handler bound to the THA Intelligence Platform. It makes the
 * `meals` capability *executable* for READ-ONLY intents only, by delegating every read
 * to the existing Meals owner (storage) through a {@link MealsReadPort}. It proves the
 * reusable Port → Handler → Binding pattern (first established for the Planner in
 * INT2) against a ninth, independent owner.
 *
 * HARD BOUNDARIES (the reason this binding is safe — per the canonical Capability Card,
 * docs/architecture/capabilities/meals.md):
 *   • READ-ONLY, THREE SCOPES ONLY. Only the "read" verb executes, for `scope` in
 *     "list" / "summary" / "detail". There is NO code path here for `explain` (no
 *     stored rationale on a meal), `search` (the owner's `lookupMeals` has zero
 *     ownership scoping — an OPEN DECISION the Card flags as unsafe to bind as-is),
 *     `recommend` (the live route computes ranking inline at the route layer, not via
 *     a delegate-only owner method — reimplementing that here would be business logic
 *     in the handler), or any write verb.
 *   • OWNERSHIP CHECK REPLICATED, NOT DELEGATED. `storage.getMeal`/`storage.getMealItems`
 *     have no ownership filter — any id returns its row regardless of caller. This
 *     handler replicates the EXACT existing route check
 *     (`meal.userId !== callerId && !meal.isSystemMeal` → not found, server/routes.ts:
 *     1183) before exposing detail/items data. This is a documented, narrow exception
 *     to "owner remains owner" (an ownership/auth gate, not domain business logic),
 *     permitted by INT7A's allowed-list. A meal that does not exist and a meal that
 *     exists but is not the caller's both return the SAME denial, with the SAME
 *     message — exactly mirroring the route's behaviour, to avoid an existence leak.
 *   • NO NUTRITION. Nutrition is a separate table joined by mealId and is not in the
 *     Card's allowed scopes or port methods — this handler never reads it, never
 *     surfaces it, and therefore never has the opportunity to fabricate or estimate a
 *     nutritional value (Principle 6).
 *   • DELEGATION ONLY. All data comes from the owning service via the port. This file
 *     contains NO meal business rule, NO ranking, and NO synthesis of its own; "list"
 *     and "summary" merge the caller's meals with system meals exactly as the existing
 *     `/api/meals` route does (server/routes.ts:1160).
 *
 * The handler is built by {@link createMealsReadHandler} with a port provider, so the
 * production binding injects the real owning service and tests inject an in-memory owner.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { MealsReadPort } from "./meals-read-port.js";
import { toInt, requireUserId, gap, denied, readOnlyVerbGuard } from "./_read-kit.js";
import type { Meal, MealSummary, MealItem } from "@shared/schema";

// ---------------------------------------------------------------------------
// Result shapes (read projections — owned data, surfaced honestly)
// ---------------------------------------------------------------------------

/** A meal as the read binding surfaces it — every stored field, no nutrition (see module doc). */
export interface MealView {
  readonly id: number;
  readonly userId: number;
  readonly name: string;
  readonly ingredients: readonly string[];
  readonly instructions: readonly string[] | null;
  readonly imageUrl: string | null;
  readonly servings: number;
  readonly categoryId: number | null;
  readonly sourceUrl: string | null;
  readonly mealSourceType: string;
  readonly isReadyMeal: boolean;
  readonly isSystemMeal: boolean;
  readonly mealFormat: string;
  readonly dietTypes: readonly string[];
  readonly isFreezerEligible: boolean;
  readonly audience: string;
  readonly isDrink: boolean;
  readonly drinkType: string | null;
  readonly kind: string;
  readonly createdAt: Date;
}

/** A meal summary — the owner's own display-safe projection (ingredientCount, no full text). */
export interface MealSummaryView {
  readonly id: number;
  readonly userId: number;
  readonly name: string;
  readonly imageUrl: string | null;
  readonly servings: number;
  readonly categoryId: number | null;
  readonly mealSourceType: string;
  readonly isReadyMeal: boolean;
  readonly isSystemMeal: boolean;
  readonly mealFormat: string;
  readonly dietTypes: readonly string[];
  readonly isFreezerEligible: boolean;
  readonly audience: string;
  readonly isDrink: boolean;
  readonly drinkType: string | null;
  readonly kind: string;
  readonly createdAt: Date;
  readonly ingredientCount: number;
}

/** A typed builder item within a meal. */
export interface MealItemView {
  readonly id: number;
  readonly type: string;
  readonly referenceId: number | null;
  readonly name: string;
  readonly quantity: string | null;
}

export interface MealsListReadResult {
  readonly scope: "list";
  readonly mealCount: number;
  readonly meals: readonly MealView[];
  readonly source: "meals";
}

export interface MealsSummaryReadResult {
  readonly scope: "summary";
  readonly mealCount: number;
  readonly meals: readonly MealSummaryView[];
  readonly source: "meals";
}

export interface MealsDetailReadResult {
  readonly scope: "detail";
  readonly meal: MealView;
  readonly items: readonly MealItemView[];
  readonly source: "meals";
}

export type MealsReadResult = MealsListReadResult | MealsSummaryReadResult | MealsDetailReadResult;

// ---------------------------------------------------------------------------
// Read projections (stored fields only — no fabrication)
// ---------------------------------------------------------------------------

function toMealView(m: Meal): MealView {
  return {
    id: m.id,
    userId: m.userId,
    name: m.name,
    ingredients: m.ingredients,
    instructions: m.instructions ?? null,
    imageUrl: m.imageUrl ?? null,
    servings: m.servings,
    categoryId: m.categoryId ?? null,
    sourceUrl: m.sourceUrl ?? null,
    mealSourceType: m.mealSourceType,
    isReadyMeal: m.isReadyMeal,
    isSystemMeal: m.isSystemMeal,
    mealFormat: m.mealFormat,
    dietTypes: m.dietTypes,
    isFreezerEligible: m.isFreezerEligible,
    audience: m.audience,
    isDrink: m.isDrink,
    drinkType: m.drinkType ?? null,
    kind: m.kind,
    createdAt: m.createdAt,
  };
}

function toMealSummaryView(m: MealSummary): MealSummaryView {
  return {
    id: m.id,
    userId: m.userId,
    name: m.name,
    imageUrl: m.imageUrl ?? null,
    servings: m.servings,
    categoryId: m.categoryId ?? null,
    mealSourceType: m.mealSourceType,
    isReadyMeal: m.isReadyMeal,
    isSystemMeal: m.isSystemMeal,
    mealFormat: m.mealFormat,
    dietTypes: m.dietTypes,
    isFreezerEligible: m.isFreezerEligible,
    audience: m.audience,
    isDrink: m.isDrink,
    drinkType: m.drinkType ?? null,
    kind: m.kind,
    createdAt: m.createdAt,
    ingredientCount: m.ingredientCount,
  };
}

function toMealItemView(i: MealItem): MealItemView {
  return {
    id: i.id,
    type: i.type,
    referenceId: i.referenceId ?? null,
    name: i.name,
    quantity: i.quantity ?? null,
  };
}

// ---------------------------------------------------------------------------
// Verb implementations
// ---------------------------------------------------------------------------

const DENIED_MESSAGE =
  "Meal not found. The Intelligence Platform never confirms or denies the existence of " +
  "another user's private meal — this message is identical whether the id does not exist " +
  "or belongs to someone else.";

async function handleRead(
  intent: Intent,
  userId: number,
  port: MealsReadPort,
): Promise<MealsReadResult> {
  const params = intent.parameters ?? {};
  const scope = params.scope as string | undefined;

  if (scope === "list") {
    const [own, system] = await Promise.all([port.getMeals(userId), port.getSystemMeals()]);
    const merged = [...own, ...system];
    return {
      scope: "list",
      mealCount: merged.length,
      meals: merged.map(toMealView),
      source: "meals",
    };
  }

  if (scope === "summary") {
    const [own, system] = await Promise.all([port.getMealsSummary(userId), port.getSystemMealsSummary()]);
    const merged = [...own, ...system];
    return {
      scope: "summary",
      mealCount: merged.length,
      meals: merged.map(toMealSummaryView),
      source: "meals",
    };
  }

  if (scope === "detail") {
    const mealId = toInt(params.mealId);
    if (mealId === undefined) {
      throw gap('Reading meal detail requires a { mealId } parameter (a positive integer).');
    }

    const meal = await port.getMeal(mealId);
    // Mirrors server/routes.ts:1183 exactly: a missing meal and a meal owned by someone
    // else (and not a system meal) produce the SAME outcome, with the SAME message —
    // never leaking whether a given id exists.
    if (!meal || (meal.userId !== userId && !meal.isSystemMeal)) {
      throw denied(DENIED_MESSAGE);
    }

    const items = await port.getMealItems(mealId);
    return {
      scope: "detail",
      meal: toMealView(meal),
      items: items.map(toMealItemView),
      source: "meals",
    };
  }

  throw gap(
    `Unsupported meals read scope ${JSON.stringify(scope)}. ` +
      'Supported scopes: "list" (the caller\'s meals + system meals), "summary" ' +
      '(the same, as a lighter projection), "detail" (a single meal + its items, requires { mealId }).',
  );
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the meals read-only handler. `resolvePort` provides the owning-service surface
 * (production: real storage; tests: in-memory owner). The returned handler is what the
 * Capability Registry binds to the `meals` capability (INT15).
 */
export function createMealsReadHandler(
  resolvePort: () => Promise<MealsReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding: only "read" executes. "explain" (no stored rationale), "search"
    // (the owner's lookupMeals has no ownership scoping — an unresolved open decision),
    // "recommend" (ranking lives inline at the route layer, not a delegate-only owner
    // method), and every write verb (generate/add/replace/delete/import/share) are all
    // in the meals allow-list but all out of scope for this read-only binding.
    readOnlyVerbGuard(intent, ["read"], "Meals");

    const userId = requireUserId(context, "Meals");
    const port = await resolvePort();

    return handleRead(intent, userId, port);
  };
}
