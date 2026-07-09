// The single owner of "why was this meal recommended?" for the Planner.
//
// PLAN1 — Planner Intelligence. Before PLAN1 this service explained a meal from
// the eight `scoreMeal` weights alone. It now composes an evidence-based
// explanation across every intelligence THA already owns: household suitability,
// nutrition goals, plant diversity, planner balance, pantry usage, shopping
// impact, seasonal suitability, previous household preferences, and the
// opportunities a meal opens up for the week.
//
// THE NON-FABRICATION INVARIANT (Principle 6).
// `reasons` is DERIVED from `evidence` — it is not written alongside it. A
// sentence therefore cannot reach a user without a named owner it was read from.
// Adding an unsourced reason is not merely discouraged here; it is unreachable.
// When an owner cannot be read, its dimension is silent (see
// `planner-explanation-context.ts` awareness flags). Silence over invention.
//
// This service speaks NO health claim. Health-benefit claims are gated behind
// `getEvidenceBackedFoodReport` (SourceRef + human reviewedAt) and belong to the
// Food Report, not the Planner. Every line below is a structural fact about the
// meal, the week, the household, or the pantry.

import type { UserPreferences } from "@shared/schema";
import type { ScoredCandidate } from "./meal-scoring-service";
import {
  mealCanonicalFoods,
  mealPlantGroups,
  type PlannerExplanationContext,
  type PlannerWeekState,
} from "./planner-explanation-context";

/** The intelligence dimensions a planner recommendation can be explained by. */
export type PlannerExplanationDimension =
  | "diet-match"
  | "household-suitability"
  | "nutrition-goals"
  | "pantry-usage"
  | "seasonal-suitability"
  | "plant-diversity"
  | "week-opportunity"
  | "household-history"
  | "planner-balance"
  | "shopping-impact"
  | "processing-level"
  | "budget-fit"
  | "cuisine-preference"
  | "overall-balance";

/**
 * One explained fact. `source` names the canonical owner the fact was read from.
 * Rule E1, as used by the Food Intelligence engines: no citation, no card.
 */
export interface PlannerExplanationEvidence {
  readonly dimension: PlannerExplanationDimension;
  /** The existing owner this fact came from. Never a model, never a guess. */
  readonly source: string;
  /** The sentence shown to the user. */
  readonly detail: string;
}

export interface MealExplanation {
  title: string;
  reasons: string[];
  /** Every reason, with the owner it was read from. `reasons` is derived from this. */
  evidence: PlannerExplanationEvidence[];
  scoreBreakdown: {
    healthScore: number;
    upfScore: number;
    budgetScore: number;
    preferenceMatch: number;
  };
}

/** Intelligence read once per suggestion run, plus the week as at this choice. */
export interface PlannerExplanationInput {
  readonly context: PlannerExplanationContext;
  readonly week: PlannerWeekState;
}

const WEIGHT_MAX = {
  dietMatch: 25,
  goalAlignment: 15,
  budgetAlignment: 15,
  upfScore: 15,
  varietyScore: 15,
  overlapScore: 10,
  cuisineBonus: 5,
};

/** Presentation order. Household and goal fit lead; generic score notes trail. */
const DIMENSION_RANK: Record<PlannerExplanationDimension, number> = {
  "diet-match": 0,
  "household-suitability": 1,
  "nutrition-goals": 2,
  "pantry-usage": 3,
  "seasonal-suitability": 4,
  "plant-diversity": 5,
  "week-opportunity": 6,
  "household-history": 7,
  "planner-balance": 8,
  "shopping-impact": 9,
  "processing-level": 10,
  "budget-fit": 11,
  "cuisine-preference": 12,
  "overall-balance": 13,
};

/** How many reasons the Planner surfaces. The full evidence trail is uncapped. */
const MAX_REASONS = 6;

const RED_MEAT_PROTEINS = new Set(["beef", "lamb", "pork"]);
const FISH_PROTEINS = new Set(["fish", "seafood"]);

const GOAL_LABELS: Record<string, string> = {
  "build-muscle": "building muscle",
  "lose-weight": "weight management",
  "eat-healthier": "eating healthier",
  "avoid-upf": "avoiding processed foods",
};

const BUDGET_LABELS: Record<string, string> = {
  budget: "your budget-friendly preference",
  standard: "a standard budget",
  premium: "your premium ingredient preference",
};

const plural = (n: number, one: string, many = `${one}s`): string => (n === 1 ? one : many);

/** "a", "a and b", "a, b and c", "a, b, c and 2 more" — never a bare truncation. */
function formatList(names: readonly string[], limit = 3): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length <= limit) {
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  }
  return `${names.slice(0, limit).join(", ")} and ${names.length - limit} more`;
}

const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function generateMealExplanation(
  candidate: ScoredCandidate,
  prefs: UserPreferences | null,
  intel?: PlannerExplanationInput,
): MealExplanation {
  const evidence: PlannerExplanationEvidence[] = [];
  const bd = candidate.scoreBreakdown;

  const cite = (
    dimension: PlannerExplanationDimension,
    source: string,
    detail: string,
  ): void => {
    evidence.push({ dimension, source, detail });
  };

  // ── Household suitability — owner: household-meal-matcher ───────────────────
  // Attached to the candidate by scoreMealCompatibility over household_eaters.
  const fit = candidate.householdFit;
  if (fit && fit.totalCount > 0) {
    const source = "household-meal-matcher (household_eaters)";
    if (fit.compatibleCount === fit.totalCount) {
      cite(
        "household-suitability",
        source,
        `Works for all ${fit.totalCount} in your household with no changes`,
      );
    } else if (fit.compatibleCount > 0) {
      const swaps = fit.swapsNeeded.length > 0 ? ` (${formatList(fit.swapsNeeded, 2)})` : "";
      cite(
        "household-suitability",
        source,
        `Works for ${fit.compatibleCount} of ${fit.totalCount} in your household — ` +
          `${fit.swapsNeeded.length} ${plural(fit.swapsNeeded.length, "swap")} needed${swaps}`,
      );
    }
  }

  // ── Preference-derived dimensions — owner: user_preferences ─────────────────
  if (prefs) {
    if (bd.dietMatch >= WEIGHT_MAX.dietMatch * 0.8 && prefs.dietTypes && prefs.dietTypes.length > 0) {
      cite(
        "diet-match",
        "user_preferences.dietTypes",
        `Matches your ${prefs.dietTypes.join(", ")} diet preference`,
      );
    } else if (bd.dietMatch < 0) {
      cite(
        "diet-match",
        "user_preferences.dietTypes",
        "May contain ingredients outside your diet preferences",
      );
    }

    if (bd.goalAlignment >= WEIGHT_MAX.goalAlignment && prefs.healthGoals && prefs.healthGoals.length > 0) {
      const labels = prefs.healthGoals.map((g) => GOAL_LABELS[g] || g).join(", ");
      cite(
        "nutrition-goals",
        "user_preferences.healthGoals",
        `Supports your goal of ${labels}`,
      );
    }

    if (bd.budgetAlignment >= WEIGHT_MAX.budgetAlignment * 0.7) {
      cite(
        "budget-fit",
        "user_preferences.budgetLevel",
        `Fits within ${BUDGET_LABELS[prefs.budgetLevel] || "your budget"}`,
      );
    }

    if (prefs.upfSensitivity === "strict" && bd.upfScore >= WEIGHT_MAX.upfScore * 0.7) {
      cite(
        "processing-level",
        "user_preferences.upfSensitivity",
        "Low in ultra-processed ingredients (strict UPF mode)",
      );
    } else if (prefs.upfSensitivity === "moderate" && bd.upfScore >= WEIGHT_MAX.upfScore * 0.5) {
      cite(
        "processing-level",
        "user_preferences.upfSensitivity",
        "Contains minimal processed ingredients",
      );
    }

    if (prefs.excludedIngredients && prefs.excludedIngredients.length > 0 && bd.dietMatch >= 0) {
      cite(
        "diet-match",
        "user_preferences.excludedIngredients",
        `Avoids your excluded ingredients (${prefs.excludedIngredients.slice(0, 3).join(", ")})`,
      );
    }
  }

  // ── Score-derived dimensions — owner: meal-scoring-service ──────────────────
  if (bd.varietyScore >= WEIGHT_MAX.varietyScore * 0.7) {
    cite(
      "planner-balance",
      "meal-scoring-service.varietyScore",
      "Adds variety to your protein sources this week",
    );
  }

  if (bd.overlapScore >= WEIGHT_MAX.overlapScore * 0.5) {
    cite(
      "shopping-impact",
      "meal-scoring-service.overlapScore",
      "Shares ingredients with other meals, reducing waste",
    );
  }

  if (bd.cuisineBonus > 0) {
    cite("cuisine-preference", "meal-scoring-service.cuisineBonus", "Matches your preferred cuisine");
  }

  if (candidate.estimatedCost && candidate.estimatedCost < 5) {
    cite(
      "shopping-impact",
      "external-meal-service.estimatedCost",
      `Cost-effective meal (est. ~£${candidate.estimatedCost.toFixed(2)})`,
    );
  }

  if (candidate.estimatedUPFScore !== null && candidate.estimatedUPFScore <= 15) {
    cite(
      "processing-level",
      "external-meal-service.estimatedUPFScore",
      "Very low UPF score - mostly whole ingredients",
    );
  }

  // ── PLAN1 dimensions — composed from the canonical owners, when readable ────
  if (intel) {
    appendIntelligenceEvidence(candidate, intel, cite);
  }

  // Planner balance is stated once. The week-state fact (what the plan actually
  // holds) supersedes the generic variety weight, which can only ever restate it
  // — and, on a hand-built breakdown, could contradict it.
  if (evidence.some((e) => e.dimension === "planner-balance" && e.source.startsWith("planner week state"))) {
    for (let i = evidence.length - 1; i >= 0; i--) {
      if (evidence[i].source === "meal-scoring-service.varietyScore") evidence.splice(i, 1);
    }
  }

  // Only when no owner said anything at all. Sourced to the composite score.
  if (evidence.length === 0) {
    cite(
      "overall-balance",
      "meal-scoring-service (composite score)",
      "Good overall balance of nutrition, cost, and variety",
    );
  }

  evidence.sort((a, b) => DIMENSION_RANK[a.dimension] - DIMENSION_RANK[b.dimension]);

  const healthScore = Math.round(
    ((bd.dietMatch / WEIGHT_MAX.dietMatch) * 40 +
      (bd.goalAlignment / WEIGHT_MAX.goalAlignment) * 30 +
      (bd.upfScore / WEIGHT_MAX.upfScore) * 30) *
      100 / 100
  );
  const upfBreakdown = Math.round((bd.upfScore / WEIGHT_MAX.upfScore) * 100);
  const budgetScore = Math.round((bd.budgetAlignment / WEIGHT_MAX.budgetAlignment) * 100);
  const prefMatch = Math.round(candidate.score);

  return {
    title: "Why this meal was chosen",
    // Derived, never authored: a reason without evidence cannot be constructed.
    reasons: evidence.slice(0, MAX_REASONS).map((e) => e.detail),
    evidence,
    scoreBreakdown: {
      healthScore: Math.max(0, Math.min(100, healthScore)),
      upfScore: Math.max(0, Math.min(100, upfBreakdown)),
      budgetScore: Math.max(0, Math.min(100, budgetScore)),
      preferenceMatch: Math.max(0, Math.min(100, prefMatch)),
    },
  };
}

/**
 * The six dimensions PLAN1 adds, each gated on its owner having been read.
 * Every branch is a fact lookup — none infers, estimates, or generates.
 */
function appendIntelligenceEvidence(
  candidate: ScoredCandidate,
  { context, week }: PlannerExplanationInput,
  cite: (d: PlannerExplanationDimension, source: string, detail: string) => void,
): void {
  const mealFoods = mealCanonicalFoods(candidate.ingredients);

  // ── Pantry usage — owner: DB user_pantry_items ──────────────────────────────
  if (context.pantryAware && mealFoods.size > 0) {
    const inPantry: string[] = [];
    for (const slug of Array.from(mealFoods.keys())) {
      const have = context.pantryFoods.get(slug);
      if (have) inPantry.push(have);
    }
    if (inPantry.length > 0) {
      cite(
        "pantry-usage",
        "user_pantry_items",
        `Uses ${inPantry.length} ${plural(inPantry.length, "ingredient")} you already have — ` +
          `${formatList(inPantry)}`,
      );
    }
  }

  // ── Seasonal suitability — owner: seasonal-map + canonical peakSeasons ──────
  if (context.seasonAware && context.season && mealFoods.size > 0) {
    const inSeason: string[] = [];
    for (const slug of Array.from(mealFoods.keys())) {
      const name = context.seasonalFoods.get(slug);
      if (name) inSeason.push(name);
    }
    if (inSeason.length > 0) {
      cite(
        "seasonal-suitability",
        "shared/discovery/seasonal-map + canonical_food.peakSeasons",
        `${formatList(inSeason)} ${plural(inSeason.length, "is", "are")} at UK ` +
          `${context.season} peak right now`,
      );
    }
  }

  // ── Plant diversity — owner: canonical plant-classifier / diversity_group ───
  const plantGroups = mealPlantGroups(candidate.ingredients);
  if (plantGroups.size > 0) {
    const fresh: string[] = [];
    for (const [groupSlug, name] of Array.from(plantGroups.entries())) {
      if (!week.plantGroups.has(groupSlug)) fresh.push(name);
    }
    if (fresh.length > 0) {
      cite(
        "plant-diversity",
        "shared/canonical/plant-classifier (diversity_group)",
        `Adds ${fresh.length} new ${plural(fresh.length, "plant")} to your week — ${formatList(fresh)}`,
      );
    }
  }

  // ── Week opportunity — owner: planner week state + smart-suggest settings ───
  const protein = candidate.primaryProtein;
  if (protein && FISH_PROTEINS.has(protein) && week.fishTarget != null && week.fishTarget > 0) {
    if (week.fishCount < week.fishTarget) {
      cite(
        "week-opportunity",
        "planner week state + smart-suggest settings.fishPerWeek",
        `Moves you toward your ${week.fishTarget} fish ${plural(week.fishTarget, "meal")} a week ` +
          `(${week.fishCount} so far)`,
      );
    }
  }
  if (
    week.redMeatTarget != null &&
    week.redMeatCount >= week.redMeatTarget &&
    (protein == null || !RED_MEAT_PROTEINS.has(protein))
  ) {
    cite(
      "week-opportunity",
      "planner week state + smart-suggest settings.redMeatPerWeek",
      `Keeps you within your ${week.redMeatTarget} red-meat ` +
        `${plural(week.redMeatTarget, "meal")} a week`,
    );
  }

  // ── Shopping impact — owner: planner week state + settings.maxWeeklyBudget ──
  if (week.weeklyBudget != null && week.weeklyBudget > 0 && candidate.estimatedCost != null) {
    const projected = week.costSoFar + candidate.estimatedCost;
    if (projected <= week.weeklyBudget) {
      cite(
        "shopping-impact",
        "planner week state + smart-suggest settings.maxWeeklyBudget",
        `Keeps the week on budget — about £${projected.toFixed(2)} of ` +
          `£${week.weeklyBudget.toFixed(2)} planned so far`,
      );
    }
  }

  // ── Previous household preferences — owner: DB planner_entries ──────────────
  if (context.historyAware && mealFoods.size > 0) {
    const familiar: Array<{ name: string; appearances: number }> = [];
    for (const [slug, name] of Array.from(mealFoods.entries())) {
      const appearances = context.familiarFoods.get(slug);
      if (appearances) familiar.push({ name, appearances });
    }
    familiar.sort((a, b) => b.appearances - a.appearances);

    if (familiar.length >= 2) {
      cite(
        "household-history",
        "planner_entries (household planner history)",
        `Built on foods your household already cooks with — ${formatList(familiar.map((f) => f.name))}`,
      );
    } else if (familiar.length === 1) {
      const [only] = familiar;
      cite(
        "household-history",
        "planner_entries (household planner history)",
        `Uses ${only.name}, which your household has planned ${only.appearances} ` +
          `${plural(only.appearances, "time")} before`,
      );
    } else {
      cite(
        "household-history",
        "planner_entries (household planner history)",
        `Introduces ${mealFoods.size} ${plural(mealFoods.size, "food")} your household ` +
          `hasn't planned before`,
      );
    }
  }

  // ── Planner balance — owner: planner week state (protein distribution) ──────
  if (protein) {
    const used = week.usedProteins.get(protein) ?? 0;
    if (used === 0 && week.mealsChosen > 0) {
      cite(
        "planner-balance",
        "planner week state (protein distribution)",
        `First ${protein} meal this week — keeps your protein sources varied`,
      );
    } else if (used >= 2) {
      cite(
        "planner-balance",
        "planner week state (protein distribution)",
        `${titleCase(protein)} is already on your plan ${used} times this week`,
      );
    }
  }
}
