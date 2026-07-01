/**
 * Nutrition Discovery Port (INT27)
 * =================================
 * The narrow delegation surface the Nutrition Discovery capability handler is allowed to
 * call. Delegates to `getMealsByNutritionFilter` on the storage owner — a left-join of
 * the `meals` and `nutrition` tables — so the engine can apply threshold predicates in
 * application code without performing unsafe SQL casts on the text-stored macro columns.
 *
 * HARD BOUNDARIES:
 *   • READ-ONLY. No writes, no inserts, no mutations of any kind.
 *   • DELEGATION ONLY. The port contains no nutrition logic, no threshold predicates,
 *     no text-parsing code. All of that lives in NutritionDiscoveryEngine.
 *   • OWNERSHIP SCOPED. Personal meals are returned for `userId` only. System meals
 *     are globally readable by any authenticated user.
 *   • DYNAMIC IMPORTS. Loading this module never opens a DB connection at import time.
 */

import type { Meal, Nutrition } from "@shared/schema";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A single meal row joined to its optional nutrition row from the `nutrition` table. */
export interface MealNutritionRow {
  readonly meal: Meal;
  readonly nutrition: Nutrition | null;
  readonly isSystem: boolean;
}

/**
 * Parsed macro values extracted from the raw text columns in the `nutrition` table.
 * All fields may be `null` if the raw text could not be parsed to a number.
 */
export interface ParsedNutrition {
  readonly calories: number | null;
  readonly protein: number | null;
  readonly carbs: number | null;
  readonly fat: number | null;
  readonly sugar: number | null;
  readonly salt: number | null;
}

/** The filter predicate built from the user's utterance. At least one field is non-null. */
export interface NutritionFilter {
  readonly caloriesMax?: number;
  readonly caloriesMin?: number;
  readonly proteinMin?: number;
  readonly carbsMax?: number;
  readonly fatMax?: number;
  readonly sugarMax?: number;
}

/** A single discovered meal item that satisfies the nutritional filter. */
export interface NutritionDiscoveryItem {
  readonly id: string;
  readonly name: string;
  readonly sourceType: "personal" | "system";
  readonly sourceLabel: string;
  readonly nutrition: ParsedNutrition;
  readonly parsedFromText: boolean;
  readonly isAlreadySaved: boolean;
  readonly internalId: number;
  readonly imageUrl?: string;
}

/** The result shape returned by the Nutrition Discovery handler. */
export interface NutritionDiscoverySearchResult {
  readonly scope: "nutrition-filter";
  readonly filter: NutritionFilter;
  readonly rawQuery: string;
  readonly totalCount: number;
  readonly mealsWithNutritionCount: number;
  readonly mealsWithoutNutritionCount: number;
  readonly results: readonly NutritionDiscoveryItem[];
  readonly source: "nutrition-discovery";
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

/**
 * The read-only surface the handler calls. One method — the engine handles all
 * threshold logic internally. Tests inject an in-memory implementation; production
 * uses `createProductionNutritionDiscoveryPort`.
 */
export interface NutritionDiscoveryPort {
  /**
   * Fetch all meals the user can see (personal + system), left-joined to their
   * nutrition rows. The engine applies the threshold filter in application code.
   */
  getMealRows(userId: number): Promise<MealNutritionRow[]>;
}

// ---------------------------------------------------------------------------
// Production factory (dynamic import — no DB connection at module load time)
// ---------------------------------------------------------------------------

export async function createProductionNutritionDiscoveryPort(): Promise<NutritionDiscoveryPort> {
  const { storage } = await import("../../storage.js");
  return {
    getMealRows: (userId) => storage.getMealsByNutritionFilter(userId),
  };
}
