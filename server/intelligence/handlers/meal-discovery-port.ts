/**
 * Meal Discovery Port (INT26)
 * ===========================
 * Types and production port factory for the `meal-discovery` capability.
 *
 * The port exposes a single method — `discover(query, userId)` — that is the
 * complete public surface of the MealDiscoveryEngine from the handler's perspective.
 * All source fan-out, deduplication, ranking, and capping happen behind this
 * interface; the handler never imports the engine directly, never touches storage,
 * and never knows which underlying sources were queried.
 *
 * Phase 1 sources (internal only):
 *   PersonalLibrarySource — storage.getMeals(userId)
 *   SystemMealsSource     — storage.getSystemMeals()
 *   MealTemplatesSource   — storage.getMealTemplates()
 *
 * Phase 2 sources (external provider tier — NOT in this file): all external recipe
 *   sources are registered in MealDiscoveryEngine as one provider tier (INT26A).
 *
 * GOVERNANCE: No data is owned here. The engine delegates to the existing storage
 * owners. This port is the typed seam that keeps the handler testable without a
 * live database (inject an in-memory stub; the production binding injects the engine).
 */

import type { MealTemplate } from "@shared/schema";

// ---------------------------------------------------------------------------
// Shared result types
// ---------------------------------------------------------------------------

/**
 * A single discovery result — source-agnostic from the handler's perspective.
 * `sourceType` and `sourceLabel` provide user-facing attribution. `id` is a
 * composite stable key within a turn — NOT a database id.
 *
 * Phase 1 sourceType values: "personal" | "system" | "template".
 * Phase 2 will add "external". Future will add "ai" and "partner".
 */
export interface DiscoveryItem {
  /**
   * Composite stable key — "<sourceType>:<internalId or index>".
   * Examples: "personal:42", "system:100", "template:7".
   * Used for deduplication and LLM entity refs. Never persisted.
   */
  readonly id: string;

  readonly name: string;
  readonly description?: string;
  readonly servings?: number;
  readonly mealFormat?: string;
  readonly dietTypes: readonly string[];

  /** Source attribution — only information the caller ever sees about source. */
  readonly sourceType: "personal" | "system" | "template";
  /** Human-readable label: "Your Cookbook", "THA Library", "Meal Templates". */
  readonly sourceLabel: string;

  readonly imageUrl?: string;

  /**
   * true for personal/system results — they are already in the platform.
   * false for template results — the user can use a template to build a meal,
   * but the template itself is not a saved recipe.
   */
  readonly isAlreadySaved: boolean;

  /**
   * false for all Phase 1 sources — no import flow in this phase.
   * Phase 2 external results will set this true.
   */
  readonly importable: boolean;

  /**
   * Set for personal and system results (the real db id). Absent for templates.
   * The LLM can use this to produce entity refs (type: "meal", id: internalId).
   */
  readonly internalId?: number;
}

/**
 * The result shape returned by the meal-discovery/search handler.
 * This is the ONLY shape the conversation gateway and LLM ever see.
 */
export interface MealDiscoverySearchResult {
  readonly scope: "discovery";
  readonly query: string;
  readonly totalCount: number;
  readonly results: readonly DiscoveryItem[];
  /**
   * Human-readable summary of which sources were queried.
   * Example: "your cookbook, the THA library, and meal templates"
   */
  readonly sourcesQueried: string;
  readonly source: "meal-discovery";
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

/**
 * MealDiscoveryPort — the narrow surface the meal-discovery handler calls.
 * One method. All source orchestration is behind this interface.
 *
 * Production: MealDiscoveryEngine implements this.
 * Tests:      In-memory stub implements this — inject via resolvePort factory.
 */
export interface MealDiscoveryPort {
  /**
   * Search across all enabled discovery sources for the given query, scoped
   * to the caller's userId. Returns merged, deduplicated, ranked results.
   * Never throws — returns an empty array if all sources fail.
   */
  discover(query: string, userId: number): Promise<DiscoveryItem[]>;
}

// ---------------------------------------------------------------------------
// Template helper (shared with engine — avoids re-importing schema in both)
// ---------------------------------------------------------------------------

/**
 * Build a DiscoveryItem from a MealTemplate row.
 * Templates are not meals — no servings, no dietTypes on the template row.
 */
export function templateToDiscoveryItem(t: MealTemplate): DiscoveryItem {
  return {
    id: `template:${t.id}`,
    name: t.title ?? t.name,
    description: t.description ?? undefined,
    servings: undefined,
    mealFormat: undefined,
    dietTypes: t.compatibleDiets ?? [],
    sourceType: "template",
    sourceLabel: "Meal Templates",
    imageUrl: t.imageUrl ?? undefined,
    isAlreadySaved: false,
    importable: false,
    internalId: undefined,
  };
}

// ---------------------------------------------------------------------------
// Production port factory
// ---------------------------------------------------------------------------

/**
 * Build the production port backed by MealDiscoveryEngine. Imports are DYNAMIC
 * so loading the Intelligence Platform never opens a database connection at
 * import time — the engine and storage are only resolved on first invocation.
 */
export async function createProductionMealDiscoveryPort(): Promise<MealDiscoveryPort> {
  const { MealDiscoveryEngine } = await import("../services/meal-discovery-engine.js");
  const { storage } = await import("../../storage.js");
  return new MealDiscoveryEngine(storage);
}
