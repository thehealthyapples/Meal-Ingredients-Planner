import type { PlannerWeek, PlannerDay, PlannerEntry } from "@shared/schema";

export interface FullDay extends PlannerDay {
  entries: PlannerEntry[];
}

export interface FullWeek extends PlannerWeek {
  days: FullDay[];
}

export interface SmartCandidate {
  id: string | number;
  name: string;
  image?: string | null;
  isExternal?: boolean;
  externalId?: string;
  source?: string | null;
  sourceUrl?: string | null;
  estimatedCost?: number | null;
  estimatedUPFScore?: number | null;
  scoreBreakdown?: Record<string, number>;
  category?: string | null;
  cuisine?: string | null;
  primaryProtein?: string | null;
  dietTypes?: string[];
  ingredients?: string[];
  servings?: number | null;
  householdFit?: {
    compatibleCount: number;
    totalCount: number;
    memberChanges: Array<{
      userId: number | null;
      displayName: string;
      swaps: string[];
    }>;
    swapsNeeded: string[];
    sharedIngredients: string[];
    extraPrepMinutes: number;
    fitScore: number;
    explanation: string;
  };
}

// COMP3 — these two types were re-declared here as structural twins of the
// server's, with no shared import: `evidence` was optional here and required
// there, and `dimension` was `string` here and a 14-member union there. A
// duplicated TYPE drifts silently — each copy type-checks against itself, so
// nothing could notice the producer and the renderer disagreeing. Both are now
// read from the one declaration. (PLAN1's note still holds and now lives there:
// `evidence` is optional because sessions persisted before PLAN1 carry
// `reasons` without the evidence trail.)
export type {
  PlannerExplanationEvidence,
  MealExplanation,
} from "@shared/explanations/planner-explanation";
import type { MealExplanation } from "@shared/explanations/planner-explanation";

export interface SmartSuggestEntry {
  dayOfWeek: number;
  day: string;
  slot: string;
  candidate: SmartCandidate;
  locked: boolean;
  explanation?: MealExplanation;
}

export interface SmartSuggestResult {
  entries: SmartSuggestEntry[];
  stats: {
    totalMeals: number;
    userMeals: number;
    externalMeals: number;
    estimatedWeeklyCost: number;
    averageUPFScore: number;
    uniqueIngredients: number;
    ingredientReuse: number;
    proteinDistribution: Record<string, number>;
    sharedIngredients: string[];
  };
}
