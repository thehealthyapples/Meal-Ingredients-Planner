/**
 * Planner Read Port (INT2)
 * ========================
 * The NARROW, read-only delegation surface the Planner capability handler is allowed
 * to call. Every method here is a 1:1 forward to an EXISTING owning-service method —
 * the planner data owner (`server/storage.ts`, SoT D14) and the household authorization
 * owner (`server/lib/household.ts`). This port adds NO planner business logic; it is a
 * typed seam so that:
 *   • the handler delegates (never re-implements) planner reads, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * GOVERNANCE: the Planner remains the authoritative owner of all planner data and
 * business rules (TIP1 Principles 2 & 7). This port only *reads* what the owner exposes;
 * it has no write methods by construction (INT2 is read-only).
 */

import type { PlannerWeek, PlannerDay, PlannerEntry } from "@shared/schema";

/** A meal as the read binding surfaces it — name only, no recipe/business detail. */
export interface PlannerMealRef {
  readonly id: number;
  readonly name: string;
}

/**
 * The read-only owning-service surface. Each method forwards to the existing planner /
 * household owner. No method mutates anything.
 */
export interface PlannerReadPort {
  /** Household-membership owner — resolves the caller's active household (authorization). */
  getHouseholdForUser(userId: number): Promise<number>;
  /** Planner owner — all weeks for the caller (already household-scoped by the owner). */
  getPlannerWeeks(userId: number): Promise<PlannerWeek[]>;
  /** Planner owner — a single week by id (ownership is verified by the caller). */
  getPlannerWeek(id: number): Promise<PlannerWeek | undefined>;
  /** Planner owner — days of a week. */
  getPlannerDays(weekId: number): Promise<PlannerDay[]>;
  /** Planner owner — a single day by id. */
  getPlannerDay(id: number): Promise<PlannerDay | undefined>;
  /** Planner owner — entries of a day. */
  getPlannerEntriesForDay(dayId: number): Promise<PlannerEntry[]>;
  /** Planner owner — all entries of a week. */
  getPlannerEntriesForWeek(weekId: number): Promise<PlannerEntry[]>;
  /** Planner owner — a single entry by id (for explain). */
  getPlannerEntryById(id: number): Promise<PlannerEntry | undefined>;
  /** Meal owner — minimal meal reference (name) for an entry's mealId. */
  getMeal(id: number): Promise<PlannerMealRef | undefined>;
}

/**
 * Build the production port over the real owning services. Imports are DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStoragePlannerReadPort(): Promise<PlannerReadPort> {
  const { storage } = await import("../../storage.js");
  const { getHouseholdForUser } = await import("../../lib/household.js");
  return {
    getHouseholdForUser: (userId) => getHouseholdForUser(userId),
    getPlannerWeeks: (userId) => storage.getPlannerWeeks(userId),
    getPlannerWeek: (id) => storage.getPlannerWeek(id),
    getPlannerDays: (weekId) => storage.getPlannerDays(weekId),
    getPlannerDay: (id) => storage.getPlannerDay(id),
    getPlannerEntriesForDay: (dayId) => storage.getPlannerEntriesForDay(dayId),
    getPlannerEntriesForWeek: (weekId) => storage.getPlannerEntriesForWeek(weekId),
    getPlannerEntryById: (id) => storage.getPlannerEntryById(id),
    getMeal: async (id) => {
      const meal = await storage.getMeal(id);
      return meal ? { id: meal.id, name: meal.name } : undefined;
    },
  };
}
