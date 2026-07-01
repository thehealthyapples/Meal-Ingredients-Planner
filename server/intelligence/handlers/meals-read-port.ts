/**
 * Meals Read Port (INT15)
 * =======================
 * The NARROW, read-only delegation surface the Meals capability handler is allowed to
 * call. Every method here is a 1:1 forward to an EXISTING owning-service method — the
 * Meals data owner (`server/storage.ts`, SoT D12: meals + meal_items tables). This port
 * adds NO meals business logic; it is a typed seam so that:
 *   • the handler delegates (never re-implements) meal reads, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * OWNER CORRECTION (per the canonical Capability Card, docs/architecture/capabilities/
 * meals.md): the capability registry's `owningService` string names
 * `server/lib/meal-service.ts` (starter-meals onboarding only — no general list/get/
 * search), `recipe-swap-engine.ts` (write/generation logic, no read surface), and
 * `server/meal-resolution-service.ts` (meal-plan slot resolution, a different concern).
 * None of those are the actual owner. The real owner is `server/storage.ts`.
 *
 * NO OWNERSHIP FILTER AT THE STORAGE LAYER FOR getMeal/getMealItems: per the Card's
 * CRITICAL FINDING, `storage.getMeal(id)` and `storage.getMealItems(mealId)` return
 * their row/rows regardless of caller — ownership is enforced entirely at the route
 * layer in the existing human routes (`server/routes.ts:1183` et al.). The handler
 * built on this port MUST replicate that exact ownership check before exposing detail/
 * items data; this port does not and cannot do it, because the owner exposes no scoped
 * method to delegate to.
 *
 * `lookupMeals(query)` is NOT exposed here. The INT15 Card flagged it as an OPEN
 * DECISION: it has zero scoping at the storage layer (ILIKE-matches across ALL users'
 * meals, including other users' private, non-system meals). INT25 resolves this without
 * adding a new storage method: the `search` verb is implemented in the handler by fetching
 * `getMeals(userId)` (caller-scoped by the owner) + `getSystemMeals()` (public, shared),
 * merging them, and applying a client-side name / ingredient filter. Both methods are
 * already in this port and are already ownership-safe — no cross-user data is reachable.
 *
 * GOVERNANCE: the Meals service (storage) remains the authoritative owner of all meal
 * data and business rules (TIP1 Principles 2 & 7). This port only *reads* what the
 * owner exposes; it has NO write methods by construction (INT15 is read-only).
 */

import type { Meal, MealSummary, MealItem } from "@shared/schema";

/**
 * The read-only owning-service surface. List/summary methods are user-scoped by the
 * owner from `userId`; `getMeal`/`getMealItems` are NOT scoped by the owner (see
 * module doc) — the handler is responsible for the ownership check before use.
 */
export interface MealsReadPort {
  /** Meals owner — the caller's own meals (full rows, user-scoped by the owner). */
  getMeals(userId: number): Promise<Meal[]>;
  /** Meals owner — system meals shared across all authenticated users (full rows). */
  getSystemMeals(): Promise<Meal[]>;
  /** Meals owner — the caller's own meals, summary projection (no ingredients/instructions). */
  getMealsSummary(userId: number): Promise<MealSummary[]>;
  /** Meals owner — system meals, summary projection. */
  getSystemMealsSummary(): Promise<MealSummary[]>;
  /** Meals owner — a single meal by id, or undefined if none exists. NOT ownership-scoped. */
  getMeal(id: number): Promise<Meal | undefined>;
  /** Meals owner — typed builder items for a meal. NOT ownership-scoped. */
  getMealItems(mealId: number): Promise<MealItem[]>;
}

/**
 * Build the production port over the real owning service. Imports are DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStorageMealsReadPort(): Promise<MealsReadPort> {
  const { storage } = await import("../../storage.js");
  return {
    getMeals: (userId) => storage.getMeals(userId),
    getSystemMeals: () => storage.getSystemMeals(),
    getMealsSummary: (userId) => storage.getMealsSummary(userId),
    getSystemMealsSummary: () => storage.getSystemMealsSummary(),
    getMeal: (id) => storage.getMeal(id),
    getMealItems: (mealId) => storage.getMealItems(mealId),
  };
}
