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

export interface MealExplanation {
  title: string;
  reasons: string[];
  scoreBreakdown: { healthScore: number; upfScore: number; budgetScore: number; preferenceMatch: number };
}

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
