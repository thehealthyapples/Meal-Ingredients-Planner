/**
 * uplift-types.ts
 * ===============
 * Strongly-typed interfaces for the Nutrition Uplift Engine.
 * No runtime logic here — pure type definitions.
 */

// ─── Taxonomy ────────────────────────────────────────────────────────────────

export type NutritionTag =
  | 'fibre'
  | 'protein'
  | 'healthy-fat'
  | 'micronutrient'
  | 'gut-diversity'
  | 'antioxidant'
  | 'resistant-starch'
  | 'fermented'
  | 'wholefood-swap';

export type ConfidenceTier = 'high' | 'medium' | 'low';

// ─── Trigger ─────────────────────────────────────────────────────────────────

/**
 * Describes when a rule should fire.
 * At least one pattern group must match for the rule to be evaluated.
 * Multiple groups are OR-ed together.
 */
export interface UpliftTrigger {
  /** Matches if ANY of the meal's ingredients contains one of these strings. */
  ingredientPattern?: string[];
  /** Matches if the meal name contains any of these substrings (case-insensitive). */
  mealNamePattern?: string[];
  /** Matches if the meal category equals any of these strings (case-insensitive). */
  categoryPattern?: string[];
  /** Matches if the meal slot equals any of these strings (breakfast|lunch|dinner|snack). */
  mealSlotPattern?: string[];
  /**
   * Future-ready: intended for gap-based matching once nutrition data is available.
   * Values like 'low-protein', 'low-fibre'. Currently unused by the engine.
   */
  nutritionGapPattern?: string[];
}

// ─── Suggestion ──────────────────────────────────────────────────────────────

export interface UpliftSuggestion {
  ingredient: string;
  /** add = new ingredient, swap = replace something, boost = increase existing */
  action: 'add' | 'swap' | 'boost';
  quantity?: string;
  /** Plain-English explanation visible to the user. Must use approved language. */
  why: string;
  /** Internal reference topic for evidence tagging. Not shown to users. */
  evidenceTopic?: string;
  /** Slug for a future learn-more article. Not rendered yet. */
  learnMoreSlug?: string;
}

// ─── Rule ────────────────────────────────────────────────────────────────────

export interface UpliftRule {
  id: string;
  name: string;
  trigger: UpliftTrigger;
  suggestions: UpliftSuggestion[];
  nutritionTags: NutritionTag[];
  /** Rule is silently skipped for meals matching these diet types. */
  excludedDietTypes?: string[];
  /** If present, rule only fires for these meal slots. Absent = all slots allowed. */
  compatibleMealSlots?: string[];
  confidence: ConfidenceTier;
  /** Lower number = surfaced first. */
  priority: number;
  /**
   * ISO date string (YYYY-MM-DD). Rules without this value are excluded from
   * production matching — this is the approval gate.
   */
  reviewedAt?: string;
}

// ─── Context ─────────────────────────────────────────────────────────────────

/** Describes a single meal at the point of uplift evaluation. */
export interface UpliftContext {
  mealName: string;
  ingredients: string[];
  category?: string;
  mealSlot?: string;
  dietTypes?: string[];
}

// ─── Match Result ─────────────────────────────────────────────────────────────

export interface UpliftMatchResult {
  ruleId: string;
  ruleName: string;
  suggestions: UpliftSuggestion[];
  nutritionTags: NutritionTag[];
  confidence: ConfidenceTier;
  priority: number;
  matchedTriggers: string[];
}

// ─── Batch API shapes ─────────────────────────────────────────────────────────

export interface BatchUpliftMeal {
  id?: string | number;
  name: string;
  ingredients?: string[];
  category?: string;
  mealSlot?: string;
}

export interface BatchUpliftInput {
  meals: BatchUpliftMeal[];
  /** Household-level diet types applied to all meals in the batch. */
  dietTypes?: string[];
}

export interface BatchUpliftMealResult {
  mealId?: string | number;
  mealName: string;
  matches: UpliftMatchResult[];
}

export interface BatchUpliftOutput {
  results: BatchUpliftMealResult[];
  matchTimeMs: number;
  totalMeals: number;
  totalMatches: number;
}
