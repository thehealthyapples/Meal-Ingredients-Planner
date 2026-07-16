/**
 * Household Health Read Port (HHP2)
 * ==================================
 * The NARROW, read-only delegation surface the Household Health capability handler is
 * allowed to call. It is a typed seam and NOTHING else: it adds no rule, no threshold,
 * no weight, no phrasing and no score of its own.
 *
 * Both methods forward 1:1 to an EXISTING canonical owner:
 *
 *   getHouseholdForUser      → server/lib/household.ts — the household-membership owner
 *                              (SoT D16). The caller's own household is RESOLVED, never
 *                              supplied: there is no parameter through which a client
 *                              could ask about someone else's household.
 *   assembleHouseholdHealth  → server/lib/household-nutrition-assembler.ts (HNP1) — the
 *                              Household Health domain reasoning owner. HHP2 does not
 *                              re-derive, re-weight or second-guess one figure it returns.
 *
 * HHP2 CREATES NO ENGINE. The score, band, dimensions, insights and opportunities this
 * port returns were all already composed by HNP1's pure core
 * (`shared/nutrition/household-nutrition.ts`) before HHP2 existed. HHP2's whole job is to
 * give that existing output a REGISTERED MOUTH on the Intelligence Platform, so the
 * canonical Decision Engine can reach it through the ordinary Intent Engine path.
 *
 * Imports are DYNAMIC, mirroring every other read port in this directory: binding the
 * capability must never open a database connection at import time — the owners are
 * touched only on first invocation.
 */

import type { HouseholdNutritionReport } from "../../lib/household-nutrition-assembler.js";

/** The read-only owning-surface. Forwards to the household-membership owner and HNP1. */
export interface HouseholdHealthReadPort {
  /** Household-membership owner — resolves the caller's OWN active household (SoT D16). */
  getHouseholdForUser(userId: number): Promise<number>;
  /**
   * HNP1's assembler — the household's own nutrition report for one planner week.
   * `weekNumber` omitted means the household's LATEST planned week (HNP1's own default),
   * which is the week a household looking at their dashboard is actually living in.
   */
  assembleHouseholdHealth(
    userId: number,
    householdId: number,
    weekNumber?: number,
  ): Promise<HouseholdNutritionReport>;
}

/**
 * Build the production port over the real owners. Nothing here composes: each method is a
 * one-line forward to the module that already owns the answer.
 */
export async function createHouseholdHealthReadPort(): Promise<HouseholdHealthReadPort> {
  const { getHouseholdForUser } = await import("../../lib/household.js");
  const { assembleHouseholdNutrition } = await import("../../lib/household-nutrition-assembler.js");
  return {
    getHouseholdForUser: (userId) => getHouseholdForUser(userId),
    assembleHouseholdHealth: (userId, householdId, weekNumber) =>
      assembleHouseholdNutrition(userId, householdId, weekNumber),
  };
}
