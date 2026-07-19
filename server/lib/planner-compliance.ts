/**
 * planner-compliance.ts
 *
 * Single Profile-compliance gate for SYSTEM-GENERATED planner writes.
 *
 * Product rule: any meal chosen or placed by THA into a Smart Meal Plan must
 * respect the user's Profile dietary requirements (dietPattern, dietRestrictions)
 * and household hard restrictions.
 *
 * This module is a thin orchestration layer. It does NOT define a second dietary
 * rules engine, does NOT carry its own keyword lists, and (since SURF1B) does NOT
 * resolve diet itself. It delegates entirely:
 *   - resolveHouseholdSafetyContext() → canonical household safety resolver (who)
 *   - candidateDietExcluded()  → dietRules.shouldExcludeRecipe()  (Profile diet)
 *   - candidateHardExcluded()  → canonical restriction resolver    (household hard)
 *
 * Scope: gate SYSTEM-controlled write paths only (template apply / week-template
 * apply / template import / demo seed / smart-apply persistence). Deliberate
 * user-manual placement is intentionally NOT gated here.
 */
import type { Meal, User, UserPreferences } from "@shared/schema";
import { candidateDietExcluded, candidateHardExcluded } from "./smart-suggest-service";
import { resolveHouseholdSafetyContext } from "./household-dietary-safety";

/** Resolved, reusable compliance context for one user. Build once, reuse per item. */
export interface PlannerComplianceContext {
  /** HARD for the requesting user — their own diet pattern. Not unioned household-wide. */
  dietPattern: string | null;
  /**
   * HARD, household-wide (SURF1B). Every active member's `users.diet_restrictions`
   * plus every eater's `hard_restrictions` — including children, who have no account
   * and whose eater row is their canonical owner.
   *
   * Before SURF1B this carried only the REQUESTING user's restrictions, so a meal
   * containing another member's declared allergen was compliant for the person
   * planning it.
   */
  dietRestrictions: string[];
  /** Household hard restrictions + user prefs excludedIngredients (conservative). */
  hardExcludedIngredients: string[];
  /**
   * True when the household's safety context could not be resolved. The gate then
   * rejects every meal: a system path must not place food into a plan for a
   * household whose allergens it could not read.
   */
  safetyUnavailable: boolean;
  /** categoryId → category name, for resolving meal category text. */
  categoryNameById: Map<number, string>;
}

export interface ComplianceResult {
  compliant: boolean;
  /** Machine-readable reason when non-compliant (e.g. "diet:Vegan", "household-hard-restriction"). */
  reason?: string;
}

/** Minimal storage surface this helper needs. Passed in to avoid an import cycle
 *  (storage.ts imports this module for seedDemoData). Both the real `storage`
 *  singleton and the storage class instance (`this`) satisfy it structurally. */
export interface ComplianceStorageDeps {
  getUserPreferences(userId: number): Promise<Pick<UserPreferences, "excludedIngredients"> | undefined>;
  getAllCategories(): Promise<Array<{ id: number; name: string }>>;
}

/** Shape of the meal fields the gate inspects. Stored meals expose name,
 *  ingredients and categoryId; external candidates instead carry a category name
 *  string and a cuisine string. Both are supported so one helper gates every
 *  system path. `categoryName`, when provided, takes precedence over `categoryId`. */
export type CompliableMeal = Pick<Meal, "name" | "ingredients"> & {
  categoryId?: number | null;
  categoryName?: string | null;
  cuisine?: string | null;
};

/**
 * Resolve the per-user compliance context once.
 *
 * Diet resolution is delegated wholly to the canonical household safety resolver
 * (`household-dietary-safety.ts`, SURF1B). This module reads no diet table.
 *
 * Before SURF1B it assembled diet itself: the REQUESTING user's profile, plus the
 * raw `household_eaters.hard_restrictions` mirror. Adult eater rows store `[]` by
 * design, so another member's declared allergen reached this gate only when the
 * mirror happened to be populated — which for 10 of the 21 restricted households it
 * was not. A household whose child cannot eat nuts could have a nut meal placed into
 * its plan by the parent's Smart Planner.
 *
 * Failure is no longer non-fatal. If the household's safety context cannot be read,
 * `safetyUnavailable` is set and the gate rejects every meal (fail closed).
 */
export async function resolvePlannerComplianceContext(
  storage: ComplianceStorageDeps,
  userId: number,
): Promise<PlannerComplianceContext> {
  const safety = await resolveHouseholdSafetyContext(userId);
  const prefs = await storage.getUserPreferences(userId);

  // Household hard restrictions bind every meal. User prefs' excludedIngredients are
  // a soft preference, but the planner has always treated them as hard here — a
  // conservative direction, preserved deliberately: loosening it would be a safety
  // regression, and SURF1B changes no filter in the permissive direction.
  const hardSet = new Set<string>([
    ...safety.hardRestrictions.map(r => r.toLowerCase()),
    ...(prefs?.excludedIngredients ?? []).map(e => e.toLowerCase()),
  ]);

  const categories = await storage.getAllCategories();
  const categoryNameById = new Map<number, string>(
    categories.map(c => [c.id, c.name]),
  );

  return {
    dietPattern: safety.requesterDietPattern,
    dietRestrictions: safety.hardRestrictions,
    hardExcludedIngredients: Array.from(hardSet),
    safetyUnavailable: safety.status === "unavailable",
    categoryNameById,
  };
}

/**
 * True when the user has any active dietary constraint. When false, every meal is
 * compliant by definition — callers should short-circuit so that unrestricted
 * users (the majority) see no behaviour change and pay no per-meal lookup cost.
 */
export function isComplianceActive(ctx: PlannerComplianceContext): boolean {
  // An unresolved safety context is NOT an unrestricted household. The gate must
  // run — and refuse — rather than short-circuit into "everything is compliant".
  if (ctx.safetyUnavailable) return true;

  return (
    !!ctx.dietPattern ||
    ctx.dietRestrictions.length > 0 ||
    ctx.hardExcludedIngredients.length > 0
  );
}

/**
 * Decide whether a single meal may be placed for this user.
 *
 * Delegates to the shared SSoT predicates only — no local keyword logic. Profile
 * diet is checked over name + category + cuisine + ingredients (the same text the
 * generation pool filter uses); household hard restrictions are checked over name
 * + ingredients via the canonical resolver, matching generation behaviour exactly.
 */
export function isMealCompliantForUser(
  meal: CompliableMeal,
  ctx: PlannerComplianceContext,
): ComplianceResult {
  // Fail closed: we could not read this household's allergens, so we place nothing.
  if (ctx.safetyUnavailable) {
    return { compliant: false, reason: "safety-context-unavailable" };
  }

  const categoryName =
    meal.categoryName ??
    (meal.categoryId != null ? ctx.categoryNameById.get(meal.categoryId) ?? null : null);

  const candidate = {
    name: meal.name,
    ingredients: meal.ingredients ?? [],
    category: categoryName,
    cuisine: meal.cuisine ?? null,
  };

  // Profile dietary hard filter — shared dietRules engine (single source of truth).
  if (candidateDietExcluded(candidate, ctx.dietPattern, ctx.dietRestrictions)) {
    return {
      compliant: false,
      reason: `diet:${ctx.dietPattern ?? ctx.dietRestrictions.join("/")}`,
    };
  }

  // Household hard restrictions — shared canonical restriction resolver.
  // Matches generation: hard-restriction text is name + ingredients only.
  if (candidateHardExcluded(candidate.name, candidate.ingredients, ctx.hardExcludedIngredients)) {
    return { compliant: false, reason: "household-hard-restriction" };
  }

  return { compliant: true };
}

// NUTPLAN2 — `assertMealCompliantForPlanner` is RETIRED (Principle 8).
//
// A convenience wrapper written for "write paths that hold a mealId", with ZERO
// callers anywhere in the repository including its own tests. All fifteen real
// call sites use `resolvePlannerComplianceContext` + `isMealCompliantForUser`
// directly and skip the wrapper built for them.
//
// Deleted rather than wired, because wiring it would have changed fifteen
// working call sites to route through an untested indirection — and the third
// state, leaving it in place, is the one that costs most: it reads as the
// sanctioned entry point while protecting nothing.
