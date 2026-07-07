/**
 * household-nutrition-enrichment.ts — FI5 Household Nutrition Intelligence
 * ============================================================================
 * A third, narrowly-scoped enrichment source alongside companion-enrichment.ts
 * (INT41, static per-capability copy) and nutrition-enrichment.ts (NUT1/FI3,
 * personal profile relevance). Where nutrition-enrichment.ts personalises a
 * food answer against the CALLER'S OWN stated profile, this module
 * personalises it against the CALLER'S HOUSEHOLD — reusing the exact service
 * the Food Intelligence Engine (FI3, engine.ts) and Food Opportunity Engine
 * (FI4, opportunity-engine.ts) already share:
 *
 *   1. PLANNER FAMILIARITY / VARIETY — resolveHouseholdSignal() already joins
 *      household eaters + planner history (fetchHouseholdPlannerFoods, SoT
 *      D14). This module reads its `familiarAppearances` map — no new read,
 *      no new join — to say whether the discussed food is already part of
 *      the household's planning rotation, and how many distinct foods that
 *      rotation spans.
 *
 *   2. HOUSEHOLD SAFETY / DIETARY-PREFERENCE CONTEXT — resolveHouseholdSignal()
 *      also resolves the household's active hard restrictions
 *      (household_eaters.hardRestrictions, SoT D16, via the SAME
 *      restriction-resolver the Food Intelligence Engine's own Rule T0 safety
 *      filter uses). This module runs the SAME resolveIngredientRestrictions()
 *      check against the discussed food; a genuine conflict is surfaced as a
 *      household-level (not just personal) insight. It never names which
 *      member holds the restriction — only that the household has one.
 *
 * ARCHITECTURE — Rule FI1 (enrichment, not ownership): every fact here is read
 * through the SAME service two other Domain Intelligence consumers already
 * share (resolveHouseholdSignal). No new store, no new capability, no new
 * schema. Household composition and planner data remain Household-domain- and
 * Planner-domain-owned; this module only reads them.
 *
 * OUT OF SCOPE (documented, not a gap to fix here — see FI5 implementation
 * record §Scope Lock): "household goals". No household-level goals store
 * exists yet (a Goals capability is named future work, THA_FOOD_INTELLIGENCE_
 * PLATFORM_ARCHITECTURE.md §7.2); Rule GO1 requires goals to resolve through a
 * canonical alias chain that isn't built. This module does not infer a
 * goal↔food connection from free-text goal fields — doing so without that
 * resolution chain would be exactly the fabrication Rule GO1/E1 forbid.
 *
 * Deterministic joins only — no LLM call. The one I/O call
 * (resolveHouseholdSignal) is awaited once per turn, only on the turn's
 * success path, only when nutrition-knowledge named a specific food this turn
 * (see conversation-gateway.ts) — never on every Companion turn.
 *
 * Run tests: npx tsx server/tests/test-household-nutrition-enrichment.ts
 */

import {
  resolveHouseholdSignal,
  type HouseholdSignal,
} from "../food-intelligence/engine.js";
import { resolveIngredientRestrictions } from "@shared/restrictions/restriction-resolver.js";
import type { RestrictionDefinition } from "@shared/restrictions/restriction-types.js";
import { extractFoodRef, type FoodRef } from "./nutrition-enrichment.js";
import type { CompanionEnrichmentItem } from "./companion-enrichment.js";

interface QueryResultLike {
  readonly status: string;
  readonly outcome?: { readonly result?: unknown };
}

// ---------------------------------------------------------------------------
// 1. Planner familiarity / variety — pure, no I/O
// ---------------------------------------------------------------------------

function buildVarietyInsight(
  food: FoodRef,
  familiarAppearances: ReadonlyMap<string, number>,
): CompanionEnrichmentItem[] {
  const varietyCount = familiarAppearances.size;
  // No planner history at all — nothing true to say either way (honest gap).
  if (varietyCount === 0) return [];

  const appearances = familiarAppearances.get(food.slug) ?? 0;
  if (appearances > 0) {
    return [
      {
        sourceDomain: "planner",
        sourceCapabilityId: "planner",
        kind: "insight",
        title: "Already part of your rotation",
        body:
          `Your household has planned ${food.name} ${appearances} time${appearances === 1 ? "" : "s"} before — ` +
          `one of ${varietyCount} different food${varietyCount === 1 ? "" : "s"} you've planned so far.`,
      },
    ];
  }

  return [
    {
      sourceDomain: "planner",
      sourceCapabilityId: "planner",
      kind: "insight",
      title: "New to your household",
      body:
        `Your household hasn't planned ${food.name} yet — trying it would add to the ` +
        `${varietyCount} different food${varietyCount === 1 ? "" : "s"} you already cook with.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// 2. Household safety / dietary-preference context — pure, no I/O
// ---------------------------------------------------------------------------

function buildHouseholdSafetyInsight(
  food: FoodRef,
  restrictionDefs: readonly RestrictionDefinition[],
): CompanionEnrichmentItem[] {
  if (!food.complianceText || restrictionDefs.length === 0) return [];

  const matches = resolveIngredientRestrictions(food.complianceText, [...restrictionDefs]);
  if (matches.length === 0) return [];

  // Name the restriction, never the household member who holds it.
  const names = Array.from(new Set(matches.map((m) => m.restriction.displayName)));
  return [
    {
      sourceDomain: "household",
      sourceCapabilityId: "household",
      kind: "insight",
      title: "Worth checking against your household",
      body:
        `${food.name} may conflict with a restriction set for your household (${names.join(", ")}) — ` +
        "worth double-checking before relying on it for shared meals.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Pure composition — testable with a fabricated HouseholdSignal, no database
// ---------------------------------------------------------------------------

export function composeHouseholdNutritionEnrichment(
  food: FoodRef,
  household: HouseholdSignal,
): CompanionEnrichmentItem[] {
  if (!household.resolved) return [];
  return [
    ...buildVarietyInsight(food, household.familiarAppearances),
    ...buildHouseholdSafetyInsight(food, household.restrictionDefs),
  ];
}

// ---------------------------------------------------------------------------
// Public builder — the one I/O seam, injectable for tests
// ---------------------------------------------------------------------------

export type ResolveHouseholdSignalFn = (userId: number | undefined) => Promise<HouseholdSignal>;

/**
 * Build FI5 household-nutrition enrichment for a turn, given nutrition-
 * knowledge's own already-computed result for this turn and the caller's own
 * authenticated userId (never a client-suppliable household id).
 *
 * Returns [] whenever nutrition-knowledge did not succeed with a recognisable
 * food this turn, the caller has no userId, or no household resolves — every
 * branch is an honest gap, never a fabricated fallback.
 */
export async function buildHouseholdNutritionEnrichment(
  nutritionQuery: QueryResultLike | undefined,
  userId: number | undefined,
  resolveSignal: ResolveHouseholdSignalFn = resolveHouseholdSignal,
): Promise<CompanionEnrichmentItem[]> {
  if (nutritionQuery?.status !== "ok-data") return [];
  const food = extractFoodRef(nutritionQuery.outcome?.result);
  if (!food) return [];

  const household = await resolveSignal(userId);
  return composeHouseholdNutritionEnrichment(food, household);
}
