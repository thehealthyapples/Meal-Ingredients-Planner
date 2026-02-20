import type { UserPreferences } from "@shared/schema";
import type { ScoredCandidate } from "./meal-scoring-service";

export interface MealExplanation {
  title: string;
  reasons: string[];
  scoreBreakdown: {
    healthScore: number;
    upfScore: number;
    budgetScore: number;
    preferenceMatch: number;
  };
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

export function generateMealExplanation(
  candidate: ScoredCandidate,
  prefs: UserPreferences | null
): MealExplanation {
  const reasons: string[] = [];
  const bd = candidate.scoreBreakdown;

  if (prefs) {
    if (bd.dietMatch >= WEIGHT_MAX.dietMatch * 0.8 && prefs.dietTypes && prefs.dietTypes.length > 0) {
      reasons.push(`Matches your ${prefs.dietTypes.join(", ")} diet preference`);
    } else if (bd.dietMatch < 0) {
      reasons.push("May contain ingredients outside your diet preferences");
    }

    if (bd.goalAlignment >= WEIGHT_MAX.goalAlignment && prefs.healthGoals && prefs.healthGoals.length > 0) {
      const goalLabels: Record<string, string> = {
        "build-muscle": "building muscle",
        "lose-weight": "weight management",
        "eat-healthier": "eating healthier",
        "avoid-upf": "avoiding processed foods",
      };
      const labels = prefs.healthGoals.map(g => goalLabels[g] || g).join(", ");
      reasons.push(`Supports your goal of ${labels}`);
    }

    if (bd.budgetAlignment >= WEIGHT_MAX.budgetAlignment * 0.7) {
      const budgetLabels: Record<string, string> = {
        budget: "your budget-friendly preference",
        standard: "a standard budget",
        premium: "your premium ingredient preference",
      };
      reasons.push(`Fits within ${budgetLabels[prefs.budgetLevel] || "your budget"}`);
    }

    if (prefs.upfSensitivity === "strict" && bd.upfScore >= WEIGHT_MAX.upfScore * 0.7) {
      reasons.push("Low in ultra-processed ingredients (strict UPF mode)");
    } else if (prefs.upfSensitivity === "moderate" && bd.upfScore >= WEIGHT_MAX.upfScore * 0.5) {
      reasons.push("Contains minimal processed ingredients");
    }

    if (prefs.excludedIngredients && prefs.excludedIngredients.length > 0 && bd.dietMatch >= 0) {
      reasons.push(`Avoids your excluded ingredients (${prefs.excludedIngredients.slice(0, 3).join(", ")})`);
    }
  }

  if (bd.varietyScore >= WEIGHT_MAX.varietyScore * 0.7) {
    reasons.push("Adds variety to your protein sources this week");
  }

  if (bd.overlapScore >= WEIGHT_MAX.overlapScore * 0.5) {
    reasons.push("Shares ingredients with other meals, reducing waste");
  }

  if (bd.cuisineBonus > 0) {
    reasons.push(`Matches your preferred cuisine`);
  }

  if (candidate.estimatedCost && candidate.estimatedCost < 5) {
    reasons.push(`Cost-effective meal (est. ~${candidate.estimatedCost.toFixed(2)})`);
  }

  if (candidate.estimatedUPFScore !== null && candidate.estimatedUPFScore <= 15) {
    reasons.push("Very low UPF score - mostly whole ingredients");
  }

  if (reasons.length === 0) {
    reasons.push("Good overall balance of nutrition, cost, and variety");
  }

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
    reasons: reasons.slice(0, 5),
    scoreBreakdown: {
      healthScore: Math.max(0, Math.min(100, healthScore)),
      upfScore: Math.max(0, Math.min(100, upfBreakdown)),
      budgetScore: Math.max(0, Math.min(100, budgetScore)),
      preferenceMatch: Math.max(0, Math.min(100, prefMatch)),
    },
  };
}
