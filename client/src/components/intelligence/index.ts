// WX2_5 — Intelligence Experience System.
//
// A reusable presentation system for surfacing intelligence consistently across
// The Healthy Apples (Home, Cookbook, Planner, Shopping, Pantry, Food Pages,
// future mobile app).
//
// These components own NO intelligence: they receive already-validated content
// from canonical owners (Meal Intelligence Assembler, Home Intelligence,
// Canonical Food, Discovery, Planner, Household, Nutrition Enhancement,
// Seasonality) and render it with one consistent visual language, tone and set
// of trust rules.
//
// See docs/investigations/ux/WX2_5_INTELLIGENCE_EXPERIENCE_SYSTEM_IMPLEMENTATION.md

// Visual tokens — the single source of truth for the system's look.
export * from "./intelligence-tokens";

// Chips.
export { IntelligenceChip, IntelligenceChipGroup } from "./IntelligenceChip";

// Generic container.
export {
  IntelligenceCard,
  type IntelligenceCardProps,
  type IntelligenceCardAction,
} from "./IntelligenceCard";

// Specific, trust-enforcing cards.
//
// UX3 — the coaching cards (Celebration, Opportunity, SimplyBetterChoice) no
// longer live here. Encouragement, advice and recommendation reach the household
// through the Companion, in one voice; the rooms keep only what is theirs.
export { SeasonalCard } from "./SeasonalCard";
export { HouseholdInsightCard } from "./HouseholdInsightCard";

// WX5 — Connected Food Panel (Food Page relationship web).
export { ConnectedFoodPanel } from "./ConnectedFoodPanel";

// SURF1A — the ONE client owner of preparation knowledge's presentation. Every
// surface that shows a preparation renders it through this, so WS5A's three-state
// trust rule ("we know it doesn't matter" ≠ "nobody knows yet") is turned into
// pixels in exactly one place.
export {
  FoodPreparationList,
  type FoodPreparation,
  type PreparationSourceRef,
} from "./FoodPreparationList";

export { LearningSignalCard } from "./LearningSignalCard";
