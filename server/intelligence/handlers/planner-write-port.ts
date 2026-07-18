/**
 * Planner Write Port (INT40 — Companion Task Delegation & Assisted Actions;
 * COMP_ACT1 adds `move` + `replace`)
 * ===========================================================================
 * The NARROW write delegation surface the Planner capability handler is allowed to
 * call. Every method here is a 1:1 forward to an EXISTING owning-service method — the
 * planner data owner (`server/storage.ts`, SoT D14) and the household authorization
 * owner (`server/lib/household.ts`). Read methods mirror `planner-read-port.ts`
 * exactly (reused, not re-derived); `addPlannerEntry` (INT40), `updatePlannerEntryLocation`
 * and `replacePlannerEntryMeal` (COMP_ACT1) are the write methods — the SAME storage
 * calls `POST /api/planner/days/:dayId/items`, `PATCH /api/planner/entries/:entryId`,
 * and `PATCH /api/planner/entries/:entryId/meal` make today.
 *
 * OWN-DATA ONLY BY CONSTRUCTION: ownership is verified by the HANDLER (replicating the
 * exact sequence each route uses) using these read methods before any write method is
 * ever called — this port itself performs no authorization, it only forwards reads and
 * the writes.
 *
 * GOVERNANCE: the Planner service remains the authoritative owner of all planner data
 * and business rules (TIP1 Principles 2 & 7). This port adds NO planner business logic.
 */

import type { PlannerWeek, PlannerDay, PlannerEntry, Meal } from "@shared/schema";

export interface PlannerWritePort {
  /** Household-membership owner — resolves the caller's active household (authorization). */
  getHouseholdForUser(userId: number): Promise<number>;
  /** Planner owner — a single day by id. */
  getPlannerDay(id: number): Promise<PlannerDay | undefined>;
  /** Planner owner — a single week by id (for the day's householdId ownership check). */
  getPlannerWeek(id: number): Promise<PlannerWeek | undefined>;
  /** Planner owner — a single entry by id (for move/replace ownership resolution). */
  getPlannerEntryById(id: number): Promise<PlannerEntry | undefined>;
  /** Meal owner — the full meal record (needed for the isSystemMeal/userId ownership check). */
  getMeal(id: number): Promise<Meal | undefined>;
  /** Planner owner — add a new entry to a day (household-scoped by the ownership check above). */
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
  /** Planner owner — move an existing entry to a (day, slot, position). Same call `PATCH /entries/:id` makes. */
  updatePlannerEntryLocation(
    id: number,
    dayId: number,
    mealType: string,
    position: number,
  ): Promise<PlannerEntry | undefined>;
  /** Planner owner — replace the meal on an existing entry. Same call `PATCH /entries/:id/meal` makes. */
  replacePlannerEntryMeal(entryId: number, mealId: number): Promise<PlannerEntry | undefined>;
}

/**
 * Build the production port over the real owning services. Imports are DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStoragePlannerWritePort(): Promise<PlannerWritePort> {
  const { storage } = await import("../../storage.js");
  const { getHouseholdForUser } = await import("../../lib/household.js");
  return {
    getHouseholdForUser: (userId) => getHouseholdForUser(userId),
    getPlannerDay: (id) => storage.getPlannerDay(id),
    getPlannerWeek: (id) => storage.getPlannerWeek(id),
    getPlannerEntryById: (id) => storage.getPlannerEntryById(id),
    getMeal: (id) => storage.getMeal(id),
    addPlannerEntry: (dayId, mealSlot, audience, mealId, position, calories, isDrink, drinkType) =>
      storage.addPlannerEntry(dayId, mealSlot, audience, mealId, position, calories, isDrink, drinkType),
    updatePlannerEntryLocation: (id, dayId, mealType, position) =>
      storage.updatePlannerEntryLocation(id, dayId, mealType, position),
    replacePlannerEntryMeal: (entryId, mealId) => storage.replacePlannerEntryMeal(entryId, mealId),
  };
}
