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
}
