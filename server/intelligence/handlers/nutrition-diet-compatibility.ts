/**
 * Nutrition Diet Compatibility Checker
 * ====================================
 * Core system for checking whether a food is compatible with a household's
 * dietary patterns (keto, vegan, etc.) AND hard restrictions (allergies,
 * intolerances). Reusable across every domain that names a food (nutrition-
 * knowledge, planner, journal, cookbook, shopping).
 *
 * Delegates entirely to the two canonical owners the rest of the platform
 * already uses — this file defines NO keyword list and NO second rules engine:
 *   - `resolveHouseholdSafetyContext()` (server/lib/household-dietary-safety.ts)
 *     for WHO the household is and WHAT it has declared. THE canonical
 *     resolver (SURF1B) — do not substitute `resolveHouseholdSignal()`
 *     (food-intelligence/engine.ts); that type carries no `eaters` and no
 *     diet-pattern field at all.
 *   - `shared/dietRules.ts` → `shouldExcludeRecipe()` for diet-pattern hard
 *     exclusions (Keto, Vegan, Paleo, …).
 *   - `shared/restrictions/restriction-resolver.ts` → `resolveIngredientRestrictions()`
 *     for allergen/restriction matching against the food name itself.
 *
 * 2026-11-22 (live-caught) — "can my family eat chicken?" answered "conflicts
 * with your household's Vegetarian requirements" for a household where ONLY
 * the requester (who had just set Vegetarian AND Keto on their own profile)
 * held Vegetarian — a second member (Keto only, not Vegetarian) was told the
 * same blanket conflict. The bug: diet PATTERNS were checked against the
 * flattened household-wide union of every member's patterns, excluding the
 * food if ANY pattern in that union conflicted — which is exactly backwards
 * for a per-person preference. `household-dietary-safety.ts`'s own doc
 * comments already say diet patterns are "HARD for this member only — never
 * unioned across the household" (CONV1 P4/OWN-1); this file unioned them
 * anyway. Hard RESTRICTIONS (allergens) stay unioned — correctly: an allergy
 * belonging to any member genuinely does bind a shared dish for everyone.
 * Diet patterns do not work that way, and now check per member.
 *
 * 2026-11-22 — split into an I/O step (`resolveHouseholdDietContext`, one DB
 * round trip) and a pure per-food check (`checkFoodCompatibilityWithContext`,
 * no I/O). The Planner diet audit checks every meal name and ingredient in a
 * whole week against the SAME household — resolving the household context
 * fresh per item would be an avoidable per-ingredient DB round trip for no
 * reason: the household doesn't change between items in one audit request.
 * `checkFoodCompatibility` (unchanged signature) is now a thin convenience
 * wrapper over both steps, for the single-food callers that don't need to
 * amortise the resolution across many foods.
 */

import { shouldExcludeRecipe } from "@shared/dietRules.js";
import { resolveIngredientRestrictions } from "@shared/restrictions/restriction-resolver.js";
import {
  resolveHouseholdSafetyContext,
  type HouseholdSafetyContext,
} from "../../lib/household-dietary-safety.js";

/** One household member's own verdict for this food — never anyone else's. */
export interface MemberFoodCompatibility {
  displayName: string;
  compatible: boolean;
  conflictingDietPatterns: string[];
}

export interface FoodCompatibilityInfo {
  /** True only when EVERY household member can eat this food. */
  compatible: boolean;
  restrictions: string[]; // Household's declared hard restrictions, canonical display names.
  dietPatterns: string[]; // Every household member's diet pattern (Keto, Vegan, …) — for display/AI context only, never applied as a blanket rule.
  conflictingRestrictions: string[]; // Which restrictions this food conflicts with (household-wide — allergens bind everyone).
  conflictingDietPatterns: string[]; // Union of every pattern that excludes this food for AT LEAST ONE member — for display only; see `members` for who.
  /** Per-member breakdown — the source of truth `explanation` is built from. */
  members: MemberFoodCompatibility[];
  explanation: string; // Human-readable explanation, naming members by name when they differ.
}

const NO_CONSTRAINTS_RESULT: Omit<FoodCompatibilityInfo, "explanation"> = {
  compatible: true,
  restrictions: [],
  dietPatterns: [],
  conflictingRestrictions: [],
  conflictingDietPatterns: [],
  members: [],
};

/**
 * Resolve the I/O once: the caller's household dietary context, in the shape
 * `checkFoodCompatibilityWithContext` needs. `undefined` means "no constraints
 * known" (no user, or the household context did not resolve) — every food is
 * reported compatible, which `checkFoodCompatibilityWithContext` already does
 * when given `undefined`.
 */
export async function resolveHouseholdDietContext(
  userId: number | undefined,
): Promise<HouseholdSafetyContext | undefined> {
  if (!userId) return undefined;
  try {
    const context = await resolveHouseholdSafetyContext(userId);
    return context.status === "resolved" ? context : undefined;
  } catch (error) {
    console.error(`[DietCompat] Could not resolve household dietary context for user ${userId}:`, error);
    return undefined;
  }
}

/**
 * Pure (no I/O) per-food check against an ALREADY-RESOLVED household context.
 * Call `resolveHouseholdDietContext` once per request/batch and reuse its
 * result across every food being checked.
 */
export function checkFoodCompatibilityWithContext(
  foodName: string,
  context: HouseholdSafetyContext | undefined,
): FoodCompatibilityInfo {
  if (!context) {
    return { ...NO_CONSTRAINTS_RESULT, explanation: `${foodName} has no known dietary conflicts.` };
  }

  const result: FoodCompatibilityInfo = {
    compatible: true,
    restrictions: [],
    dietPatterns: [],
    conflictingRestrictions: [],
    conflictingDietPatterns: [],
    members: [],
    explanation: "",
  };

  // Display/AI-context only — every pattern anyone in the household holds.
  // NEVER used below to gate the household-wide verdict; see file header.
  result.dietPatterns = context.dietPatterns.filter((d): d is string => typeof d === "string" && d.length > 0);

  // The canonical restriction definitions resolved from the household's declared
  // hard restrictions (allergens, intolerances) — legitimately unioned: an
  // allergy belonging to any member binds a dish shared by the household.
  result.restrictions = context.activeRestrictions.map((r) => r.displayName);
  if (context.activeRestrictions.length > 0) {
    const matches = resolveIngredientRestrictions(foodName, context.activeRestrictions);
    if (matches.length > 0) {
      result.conflictingRestrictions = Array.from(
        new Set(matches.map((m) => m.restriction.displayName)),
      );
    }
  }

  // Diet PATTERNS — checked per member, never as a household-wide union. A
  // member with no declared pattern has nothing to conflict with and is
  // always pattern-compatible (their own hard restrictions, if any, are
  // still unioned into conflictingRestrictions above).
  for (const member of context.members) {
    const conflicting = member.dietPatterns.filter((pattern) =>
      shouldExcludeRecipe(foodName, { dietPattern: pattern, dietRestrictions: [] }),
    );
    result.members.push({
      displayName: member.displayName,
      compatible: conflicting.length === 0,
      conflictingDietPatterns: conflicting,
    });
    for (const pattern of conflicting) {
      if (!result.conflictingDietPatterns.includes(pattern)) {
        result.conflictingDietPatterns.push(pattern);
      }
    }
  }

  result.compatible =
    result.conflictingRestrictions.length === 0 &&
    result.members.every((m) => m.compatible);

  // Build human-readable explanation
  if (result.compatible) {
    result.explanation = `${foodName} has no known dietary conflicts.`;
  } else {
    const clauses: string[] = [];

    if (result.conflictingRestrictions.length > 0) {
      clauses.push(`your household's ${result.conflictingRestrictions.join(", ")} requirements`);
    }

    const conflictedMembers = result.members.filter((m) => !m.compatible);
    if (conflictedMembers.length > 0) {
      // Only ONE member in the household, or every pattern-holder conflicts the same way —
      // speak it as "your X diet" rather than naming a single person redundantly.
      if (result.members.length <= 1) {
        clauses.push(`your ${Array.from(new Set(conflictedMembers.flatMap((m) => m.conflictingDietPatterns))).join(", ")} diet`);
      } else {
        clauses.push(
          conflictedMembers
            .map((m) => `${m.displayName}'s ${m.conflictingDietPatterns.join(", ")} diet`)
            .join(", and "),
        );
      }
    }

    result.explanation = `${foodName} conflicts with ${clauses.join(" and ")}.`;

    // Name who it's still fine for, so a shared "can my family eat X" question
    // never reads as a blanket no when some members have no conflict at all.
    const unaffected = result.members.filter((m) => m.compatible);
    if (result.members.length > 1 && unaffected.length > 0 && unaffected.length < result.members.length) {
      result.explanation += ` It's fine for ${unaffected.map((m) => m.displayName).join(" and ")}.`;
    }
  }

  return result;
}

/**
 * Check if a single food is compatible with a household's dietary constraints.
 * Convenience wrapper: resolves the household context and runs the pure check
 * in one call. For checking MANY foods against the same household (e.g. a
 * planner week's worth of meals), call `resolveHouseholdDietContext` once and
 * reuse it with `checkFoodCompatibilityWithContext` instead of calling this
 * per food.
 */
export async function checkFoodCompatibility(
  foodName: string,
  userId: number | undefined,
): Promise<FoodCompatibilityInfo> {
  const context = await resolveHouseholdDietContext(userId);
  return checkFoodCompatibilityWithContext(foodName, context);
}
