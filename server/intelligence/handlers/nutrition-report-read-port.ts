/**
 * Nutrition Report Read Port (COMP-DET8 — twenty-fourth live capability binding)
 * ================================================================================
 * The narrow, read-only delegation surface for the `nutrition-report` capability.
 * Forwards to `assembleNutritionCentre` (server/lib/nutrition-centre-assembler.ts),
 * the household's real "Nutrition Centre" — plant/food diversity, category and
 * benefit coverage, computed from the household's own planner/diary history.
 *
 * 2026-11-21 — this engine was named only as an "owningService" STRING on the
 * `nutrition-knowledge` capability-registry entry for as long as that entry has
 * existed, and never actually called by any Intelligence Platform handler.
 * `nutrition-knowledge`'s own `report` verb has always honest-gapped specifically
 * because this is a USER-SPECIFIC, diary-linked summary — and that port's own
 * module doc declares "GENERAL KNOWLEDGE ONLY... no method that takes a userId"
 * as a load-bearing boundary. This is deliberately its OWN capability instead of a
 * bolt-on, matching the fixture's own "nutrition-report" capability name.
 *
 * GOVERNANCE: no data is owned here. `nutrition-centre-assembler.ts` (and the
 * canonical Food Knowledge Registry / planner history it reads) remain the sole
 * owners; this port only forwards to the existing, already-tested assembler.
 */

import type { NutritionCentre, NutritionCentreWindow } from "../../lib/nutrition-centre-assembler.js";

export type { NutritionCentre, NutritionCentreWindow };

/**
 * The read-only owning-service surface.
 *   `window`  — "this-week" | "all-time" | "this-year" (assembler's own type).
 *   `weekId`  — the planner week identifier (NOT a weekNumber) the caller's surface
 *               had in view, when known. Only consulted for window "this-week";
 *               the port resolves it to the assembler's own `thisWeekNumber` so the
 *               handler never has to reach into planner storage itself.
 */
export interface NutritionReportPort {
  getNutritionCentre(userId: number, window: NutritionCentreWindow, weekId?: number): Promise<NutritionCentre>;
}

/**
 * Build the production port over the real owning services. Imports are DYNAMIC so
 * that loading the Intelligence Platform module (and its tests) never opens a
 * database connection at import time — owners are only touched on first invocation.
 */
export async function createNutritionReportReadPort(): Promise<NutritionReportPort> {
  const { assembleNutritionCentre } = await import("../../lib/nutrition-centre-assembler.js");
  const { getHouseholdForUser } = await import("../../lib/household.js");
  const { storage } = await import("../../storage.js");

  return {
    async getNutritionCentre(userId, window, weekId) {
      const householdId = await getHouseholdForUser(userId);
      let thisWeekNumber: number | undefined;
      if (window === "this-week" && weekId != null) {
        const week = await storage.getPlannerWeek(weekId);
        thisWeekNumber = week?.weekNumber;
      }
      return assembleNutritionCentre(householdId, new Date(), window, thisWeekNumber);
    },
  };
}
