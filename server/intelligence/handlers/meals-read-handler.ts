/**
 * Meals Read Handler (INT15 / INT25 — ninth live capability binding)
 * ==================================================================
 * The NINTH execution handler bound to the THA Intelligence Platform. It makes the
 * `meals` capability *executable* for READ-ONLY intents, by delegating every read
 * to the existing Meals owner (storage) through a {@link MealsReadPort}. It proves the
 * reusable Port → Handler → Binding pattern (first established for the Planner in
 * INT2) against a ninth, independent owner.
 *
 * HARD BOUNDARIES (the reason this binding is safe — per the canonical Capability Card,
 * docs/architecture/capabilities/meals.md):
 *   • READ-ONLY, FOUR SCOPES / TWO VERBS. "read" (scopes: list / summary / detail) and
 *     "search" (caller-scoped name + ingredient filter) execute. There is NO code path
 *     here for `explain` (no stored rationale on a meal), `recommend` (the live route
 *     computes ranking inline at the route layer, not via a delegate-only owner method
 *     — reimplementing that here would be business logic in the handler), or any write verb.
 *   • SEARCH IS OWNERSHIP-SCOPED BY CONSTRUCTION (INT25). INT15 deliberately excluded
 *     `storage.lookupMeals` (zero scoping — ILIKE across ALL users' meals). INT25
 *     resolves this by implementing search over `getMeals(userId)` (caller-scoped by the
 *     owner) + `getSystemMeals()` (public, shared), then filtering client-side. No new
 *     port method is required: the existing owner-scoped methods are already safe.
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

/**
 * A meal search result row — lightweight projection for the LLM grounding context.
 * Contains no nutrition data (out of scope) and no ingredients array (too large for
 * prompt; the caller can request detail for any matched meal id).
 */
export interface MealSearchView {
  readonly id: number;
  readonly name: string;
  readonly imageUrl: string | null;
  readonly servings: number;
  readonly isSystemMeal: boolean;
  readonly dietTypes: readonly string[];
  readonly mealFormat: string;
  readonly kind: string;
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

/**
 * Search result — own meals + system meals filtered by name/ingredient query.
 * Capped at SEARCH_MAX_RESULTS rows; the caller may request full detail for any id.
 */
export interface MealsSearchResult {
  readonly scope: "search";
  readonly query: string;
  readonly mealCount: number;
  readonly meals: readonly MealSearchView[];
  readonly source: "meals";
}

export type MealsReadResult =
  | MealsListReadResult
  | MealsSummaryReadResult
  | MealsDetailReadResult
  | MealsSearchResult;

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

/** Lightweight projection for search results — no ingredients array, no instructions. */
function toMealSearchView(m: Meal): MealSearchView {
  return {
    id: m.id,
    name: m.name,
    imageUrl: m.imageUrl ?? null,
    servings: m.servings,
    isSystemMeal: m.isSystemMeal,
    dietTypes: m.dietTypes,
    mealFormat: m.mealFormat,
    kind: m.kind,
  };
}

// ---------------------------------------------------------------------------
// Search (INT25 — ownership-scoped name + ingredient filter)
// ---------------------------------------------------------------------------

/** Maximum results returned by the search verb (keeps grounding context manageable). */
const SEARCH_MAX_RESULTS = 20;

/**
 * Does this meal match the lower-cased query?
 * Checks the name first (faster), then scans ingredient strings.
 * Delegation-only: the match logic reads only the owner's stored strings.
 */
function matchesMealQuery(meal: Meal, lowerQuery: string): boolean {
  if (meal.name.toLowerCase().includes(lowerQuery)) return true;
  return meal.ingredients.some((ing) => ing.toLowerCase().includes(lowerQuery));
}

/**
 * Search the caller's own meals + system meals by name/ingredient.
 *
 * Safe by construction (INT25):
 *   - `getMeals(userId)` is already caller-scoped by the owner (no cross-user access).
 *   - `getSystemMeals()` is publicly shared (all authenticated users may see system meals).
 *   - Client-side filter never touches another user's private rows.
 *   - Deduplication by id prevents a system meal that also appears in own from doubling.
 *   - Capped at SEARCH_MAX_RESULTS (20) to keep the grounding payload manageable.
 */
async function handleSearch(
  intent: Intent,
  userId: number,
  port: MealsReadPort,
): Promise<MealsSearchResult> {
  const params = intent.parameters ?? {};
  const rawQuery = typeof params.query === "string" ? params.query.trim() : "";
  if (!rawQuery) {
    throw gap("Searching meals needs a non-empty { query } string.");
  }
  const lowerQuery = rawQuery.toLowerCase();

  const [own, system] = await Promise.all([port.getMeals(userId), port.getSystemMeals()]);

  // Merge own + system; deduplicate by id in case a system meal also appears in own.
  const seen = new Set<number>();
  const merged: Meal[] = [];
  for (const m of [...own, ...system]) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      merged.push(m);
    }
  }

  const matches = merged
    .filter((m) => matchesMealQuery(m, lowerQuery))
    .slice(0, SEARCH_MAX_RESULTS);

  return {
    scope: "search",
    query: rawQuery,
    mealCount: matches.length,
    meals: matches.map(toMealSearchView),
    source: "meals",
  };
}

// ---------------------------------------------------------------------------
// Verb implementations — read
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
 * Capability Registry binds to the `meals` capability (INT15 / INT25).
 */
export function createMealsReadHandler(
  resolvePort: () => Promise<MealsReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding: "read" and "search" execute. "explain" (no stored rationale),
    // "recommend" (ranking lives inline at the route layer, not a delegate-only owner
    // method), and every write verb (generate/add/replace/delete/import/share) are all
    // in the meals allow-list but all out of scope for this read-only binding.
    readOnlyVerbGuard(intent, ["read", "search"], "Meals");

    const userId = requireUserId(context, "Meals");
    const port = await resolvePort();

    if (intent.verb === "search") return handleSearch(intent, userId, port);
    return handleRead(intent, userId, port);
  };
}
