/**
 * Meals Write Port (COMP3 — Companion-offered dietary substitution)
 * ====================================================================
 * The NARROW write delegation surface the Meals capability handler is allowed to
 * call. Every method here is a 1:1 forward to an EXISTING owning-service method
 * (`server/storage.ts`, SoT D12) — the exact same `storage.getMeal` /
 * `storage.createMeal` / `storage.updateMeal` calls `POST /api/uplift/accept`
 * already uses to fork a system meal into a user-private copy before mutating it.
 *
 * OWN-DATA ONLY BY CONSTRUCTION: ownership is verified by the HANDLER (replicating
 * the exact `meal.userId !== userId && !meal.isSystemMeal` check the uplift-accept
 * route uses) before any write method is ever called — this port itself performs
 * no authorization, it only forwards reads and the writes.
 *
 * GOVERNANCE: the Meals service remains the authoritative owner of all meal data.
 * This port adds NO recipe business logic — it does not decide what to change,
 * only how to persist a change the caller has already decided on.
 */

import type { Meal, InsertMeal, PlannerDay, PlannerWeek, PlannerEntry } from "@shared/schema";

export interface MealsWritePort {
  /** Meal owner — the full meal record (for the isSystemMeal/userId ownership check). */
  getMeal(id: number): Promise<Meal | undefined>;
  /** Meal owner — fork a system meal into a new user-owned row. Same shape `POST /api/uplift/accept` already forks with. */
  createMeal(userId: number, insertMeal: InsertMeal): Promise<Meal>;
  /** Meal owner — persist an updated ingredient list. Same call `POST /api/uplift/accept` already makes. */
  updateMeal(id: number, data: Partial<{ ingredients: string[] }>): Promise<Meal | undefined>;
  /**
   * Household-membership owner — resolves the caller's active household
   * (authorization). Mirrors `planner-write-port.ts` exactly: "add" optionally
   * also places the brand-new quick meal on the planner in the same write, so
   * it needs the same ownership check the Planner's own "add" uses.
   */
  getHouseholdForUser(userId: number): Promise<number>;
  /** Planner owner — a single day by id (for the quick-meal-placement ownership check). */
  getPlannerDay(id: number): Promise<PlannerDay | undefined>;
  /** Planner owner — a single week by id (for the day's householdId ownership check). */
  getPlannerWeek(id: number): Promise<PlannerWeek | undefined>;
  /** Planner owner — add a new entry to a day. Same call `POST /api/planner/days/:dayId/items` makes. */
  addPlannerEntry(
    dayId: number,
    mealSlot: string,
    audience: string,
    mealId: number,
    position?: number,
    calories?: number,
    isDrink?: boolean,
    drinkType?: string | null,
  ): Promise<PlannerEntry>;
}

/**
 * Build the production port over the real owning service. Imports are DYNAMIC so
 * that loading the Intelligence Platform module (and its tests) never opens a
 * database connection at import time — the owner is only touched on first
 * invocation.
 */
export async function createStorageMealsWritePort(): Promise<MealsWritePort> {
  const { storage } = await import("../../storage.js");
  const { getHouseholdForUser } = await import("../../lib/household.js");
  return {
    getMeal: (id) => storage.getMeal(id),
    createMeal: (userId, insertMeal) => storage.createMeal(userId, insertMeal),
    updateMeal: (id, data) => storage.updateMeal(id, data),
    getHouseholdForUser: (userId) => getHouseholdForUser(userId),
    getPlannerDay: (id) => storage.getPlannerDay(id),
    getPlannerWeek: (id) => storage.getPlannerWeek(id),
    addPlannerEntry: (dayId, mealSlot, audience, mealId, position, calories, isDrink, drinkType) =>
      storage.addPlannerEntry(dayId, mealSlot, audience, mealId, position, calories, isDrink, drinkType),
  };
}
