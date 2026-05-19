/**
 * Meal Adaptation — Phase 3
 *
 * Types for the AI-generated household meal adaptation result.
 * Stored as JSONB on planner_entries.adaptation_result.
 */

export interface EaterAdaptation {
  eaterName: string;
  /** "none" = no change needed for this eater */
  changeType: "none" | "swap" | "add_on" | "omission";
  /** Short practical description of the change */
  note: string;
  /** Any extra ingredients needed just for this eater's plate */
  extraIngredients: string[];
  /** True when this eater has no dietary preferences or restrictions on file — compatibility cannot be fully verified */
  hasNoDietaryData?: boolean;
}

export interface AdaptationResult {
  /** Note about the base meal as served to most eaters */
  baseMealNote: string;
  /** One entry per selected eater */
  adaptations: EaterAdaptation[];
  /** Extra ingredients that cover multiple eaters — deduplicated from extraIngredients */
  householdExtraIngredients: string[];
  /** Practical tip for managing all the adaptations in one cook */
  cookingNote: string;
  /**
   * AI-generated preview of one unified version satisfying all household restrictions.
   * Present only when at least one eater has a conflict. Preview only — never persisted
   * as a recipe, never overwrites the original.
   */
  householdSafePreview?: HouseholdSafePreview | null;
}

/** One ingredient change in the household-safe unified preview */
export interface HouseholdSafeIngredientChange {
  /** The original ingredient being changed */
  original: string;
  /** Replacement ingredient, or null if the ingredient is removed entirely */
  replacement: string | null;
  /** Short reason for this change (e.g. "dairy-free for Lilly") */
  reason: string;
}

/**
 * AI-generated preview of one unified recipe version satisfying the most restrictive
 * household requirements. This is a transparent preview only — not a replacement for
 * the original recipe, not medically guaranteed, and not persisted to the cookbook.
 */
export interface HouseholdSafePreview {
  /** Which eaters' restrictions drove the adaptations */
  accommodates: Array<{ eaterName: string; restriction: string }>;
  /** Ingredient-level changes needed to make the recipe household-safe */
  ingredientChanges: HouseholdSafeIngredientChange[];
  /** Method-level changes (free text, e.g. "Reduce chilli by 50% before adding") */
  methodChanges: string[];
  /** Trade-offs and notes (e.g. "Recipe becomes vegetarian", "Milder spice profile") */
  tradeoffs: string[];
  /**
   * Set to true when the post-generation validation detected impossible action+ingredient
   * pairings (e.g. de-veining chickpeas, fish stock in a vegetarian version). The preview
   * should be shown with a warning and the accept button disabled.
   */
  validationFailed?: boolean;
  /** Human-readable descriptions of the specific issues found during validation (for dev logging). */
  validationIssues?: string[];
}

// ─── Reusable variant snapshot ────────────────────────────────────────────────

/** Snapshot of one eater's identity and restrictions at the moment a variant was created. Historical — never auto-updated. */
export interface HouseholdSafeEaterSnapshot {
  /** Stable integer ID for household members; client-generated UUID string for guests */
  id: number | string;
  displayName: string;
  /** hardRestrictions in force at generation time */
  hardRestrictions: string[];
  /** dietTypes in force at generation time */
  dietTypes: string[];
  isGuest: boolean;
}

/**
 * Restriction snapshot stored on a household-safe variant meal.
 * Records who and what was accommodated at the time of creation.
 * Historically fixed — never regenerated or mutated after creation.
 */
export interface HouseholdSafeForSnapshot {
  eaters: HouseholdSafeEaterSnapshot[];
  /** ISO8601 timestamp of when this variant was generated */
  generatedAt: string;
  /** Name of the original meal at generation time */
  originalMealName: string;
}
