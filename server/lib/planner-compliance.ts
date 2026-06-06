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
 * rules engine and does NOT carry its own keyword lists. It delegates entirely to
 * the existing single source of truth already used by recipe search and Smart
 * Planner generation:
 *   - candidateDietExcluded()  → dietRules.shouldExcludeRecipe()  (Profile diet)
 *   - candidateHardExcluded()  → canonical restriction resolver    (household hard)
 *
 * Scope: gate SYSTEM-controlled write paths only (template apply / week-template
 * apply / template import / demo seed / smart-apply persistence). Deliberate
 * user-manual placement is intentionally NOT gated here.
 */
import type { Meal, User, UserPreferences } from "@shared/schema";
import { candidateDietExcluded, candidateHardExcluded } from "./smart-suggest-service";
import { getHouseholdForUser } from "./household";

/** Resolved, reusable compliance context for one user. Build once, reuse per item. */
export interface PlannerComplianceContext {
  dietPattern: string | null;
  dietRestrictions: string[];
  /** Union of user prefs excludedIngredients + household eaters' hardRestrictions. */
  hardExcludedIngredients: string[];
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
  getUser(id: number): Promise<Pick<User, "dietPattern" | "dietRestrictions"> | undefined>;
  getUserPreferences(userId: number): Promise<Pick<UserPreferences, "excludedIngredients"> | undefined>;
  getHouseholdEaters(householdId: number): Promise<Array<{ hardRestrictions: string[] | null }>>;
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
 * Mirrors the same assembly the Smart Planner generation route already performs:
 * Profile diet from the users row, and hard restrictions from user prefs unioned
 * with household eaters' hardRestrictions. Household lookup failure is non-fatal —
 * we fall back to user prefs only, exactly as generation does.
 */
export async function resolvePlannerComplianceContext(
  storage: ComplianceStorageDeps,
  userId: number,
): Promise<PlannerComplianceContext> {
  const user = await storage.getUser(userId);
  const prefs = await storage.getUserPreferences(userId);

  const hardSet = new Set<string>(
    (prefs?.excludedIngredients ?? []).map(e => e.toLowerCase()),
  );

  try {
    const householdId = await getHouseholdForUser(userId);
    const eaters = await storage.getHouseholdEaters(householdId);
    for (const eater of eaters) {
      for (const restriction of eater.hardRestrictions ?? []) {
        hardSet.add(restriction.toLowerCase());
      }
    }
  } catch {
    // Non-fatal: if household lookup fails, use user prefs only.
  }

  const categories = await storage.getAllCategories();
  const categoryNameById = new Map<number, string>(
    categories.map(c => [c.id, c.name]),
  );

  return {
    dietPattern: user?.dietPattern ?? null,
    dietRestrictions: (user?.dietRestrictions ?? []).filter(Boolean),
    hardExcludedIngredients: Array.from(hardSet),
    categoryNameById,
  };
}

/**
 * True when the user has any active dietary constraint. When false, every meal is
 * compliant by definition — callers should short-circuit so that unrestricted
 * users (the majority) see no behaviour change and pay no per-meal lookup cost.
 */
export function isComplianceActive(ctx: PlannerComplianceContext): boolean {
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

/**
 * Convenience wrapper for write paths that hold a mealId: loads the meal via the
 * supplied loader and applies isMealCompliantForUser. A missing meal is reported
 * as non-compliant so a system path never silently writes an unresolved id.
 */
export async function assertMealCompliantForPlanner(
  mealId: number,
  ctx: PlannerComplianceContext,
  getMeal: (id: number) => Promise<CompliableMeal | undefined>,
): Promise<ComplianceResult> {
  const meal = await getMeal(mealId);
  if (!meal) return { compliant: false, reason: "meal-not-found" };
  return isMealCompliantForUser(meal, ctx);
}
