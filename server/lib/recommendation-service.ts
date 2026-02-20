import { Meal, UserPreferences } from "@shared/schema";
import { parseIngredient, detectIngredientCategory } from "./ingredient-utils";

const DIET_EXCLUDED_CATEGORIES: Record<string, string[]> = {
  vegetarian: ["meat", "fish"],
  vegan: ["meat", "fish", "dairy", "eggs"],
  keto: ["grains", "bakery"],
  "gluten-free": ["grains", "bakery"],
  carnivore: ["grains", "bakery", "legumes", "fruit", "produce"],
};

const DIET_EXCLUDED_KEYWORDS: Record<string, string[]> = {
  vegetarian: ["chicken", "beef", "pork", "lamb", "turkey", "bacon", "steak", "mince", "sausage", "ham", "salmon", "tuna", "cod", "prawn", "shrimp"],
  vegan: ["chicken", "beef", "pork", "lamb", "turkey", "bacon", "steak", "mince", "sausage", "ham", "salmon", "tuna", "cod", "prawn", "shrimp", "milk", "cheese", "butter", "cream", "egg", "yogurt", "honey"],
  "gluten-free": ["flour", "bread", "pasta", "noodle", "wheat", "barley", "rye", "couscous"],
  carnivore: ["rice", "bread", "pasta", "flour", "beans", "lentils", "apple", "banana", "potato", "tomato", "lettuce"],
  keto: ["rice", "bread", "pasta", "flour", "sugar", "potato", "noodle", "oat"],
};

const HIGH_PROTEIN_KEYWORDS = ["chicken", "beef", "turkey", "salmon", "tuna", "egg", "tofu", "lentil", "bean", "pork", "prawn", "shrimp", "cod", "lamb"];
const LOW_CALORIE_KEYWORDS = ["salad", "spinach", "broccoli", "cucumber", "tomato", "lettuce", "celery", "pepper", "courgette", "zucchini"];
const UPF_INDICATOR_KEYWORDS = ["processed", "instant", "packet", "mix", "ready-made", "pre-made", "canned", "tinned"];

export interface RecommendationResult {
  compatible: boolean;
  score: number;
  warnings: string[];
  dietMatch: boolean;
  goalMatch: boolean;
}

export function evaluateMeal(meal: Meal, prefs: UserPreferences): RecommendationResult {
  const warnings: string[] = [];
  let score = 100;
  let dietMatch = true;
  let goalMatch = true;

  const ingredients = meal.ingredients || [];
  const normalizedIngredients = ingredients.map(i => {
    const parsed = parseIngredient(i);
    return {
      raw: i.toLowerCase(),
      name: (parsed.normalizedName || parsed.name).toLowerCase(),
      category: detectIngredientCategory(parsed.normalizedName || parsed.name),
    };
  });

  if (prefs.dietTypes && prefs.dietTypes.length > 0) {
    for (const diet of prefs.dietTypes) {
      const excludedCats = DIET_EXCLUDED_CATEGORIES[diet] || [];
      const excludedKeywords = DIET_EXCLUDED_KEYWORDS[diet] || [];

      for (const ing of normalizedIngredients) {
        if (excludedCats.includes(ing.category)) {
          warnings.push(`${ing.name} may not fit a ${diet} diet`);
          dietMatch = false;
          score -= 20;
        }
        for (const kw of excludedKeywords) {
          if (ing.name.includes(kw) || ing.raw.includes(kw)) {
            warnings.push(`${ing.name} contains "${kw}" (not ${diet}-friendly)`);
            dietMatch = false;
            score -= 15;
            break;
          }
        }
      }
    }
  }

  if (prefs.excludedIngredients && prefs.excludedIngredients.length > 0) {
    for (const excluded of prefs.excludedIngredients) {
      const exLower = excluded.toLowerCase();
      for (const ing of normalizedIngredients) {
        if (ing.name.includes(exLower) || ing.raw.includes(exLower)) {
          warnings.push(`Contains excluded ingredient: ${excluded}`);
          score -= 30;
        }
      }
    }
  }

  if (prefs.healthGoals && prefs.healthGoals.length > 0) {
    for (const goal of prefs.healthGoals) {
      if (goal === "build-muscle") {
        const hasProtein = normalizedIngredients.some(ing =>
          HIGH_PROTEIN_KEYWORDS.some(kw => ing.name.includes(kw) || ing.raw.includes(kw))
        );
        if (hasProtein) {
          score += 10;
        } else {
          score -= 5;
          goalMatch = false;
        }
      }
      if (goal === "lose-weight") {
        const hasLowCal = normalizedIngredients.some(ing =>
          LOW_CALORIE_KEYWORDS.some(kw => ing.name.includes(kw) || ing.raw.includes(kw))
        );
        if (hasLowCal) score += 5;
        const heavyIngredients = normalizedIngredients.filter(ing =>
          ["cream", "butter", "sugar", "chocolate", "pastry"].some(kw => ing.name.includes(kw))
        );
        if (heavyIngredients.length > 0) {
          score -= 10;
          goalMatch = false;
        }
      }
      if (goal === "avoid-upf" || goal === "eat-healthier") {
        const hasUPF = normalizedIngredients.some(ing =>
          UPF_INDICATOR_KEYWORDS.some(kw => ing.name.includes(kw) || ing.raw.includes(kw))
        );
        if (hasUPF) {
          score -= 10;
          warnings.push("Contains potentially processed ingredients");
          goalMatch = false;
        }
      }
    }
  }

  if (prefs.upfSensitivity) {
    const hasUPF = normalizedIngredients.some(ing =>
      UPF_INDICATOR_KEYWORDS.some(kw => ing.name.includes(kw) || ing.raw.includes(kw))
    );
    if (hasUPF) {
      if (prefs.upfSensitivity === "strict") {
        score -= 25;
        warnings.push("Contains processed ingredients (strict UPF mode)");
      } else if (prefs.upfSensitivity === "moderate") {
        score -= 10;
      }
    }
  }

  return {
    compatible: score > 0 && dietMatch,
    score: Math.max(0, Math.min(100, score)),
    warnings: Array.from(new Set(warnings)).slice(0, 5),
    dietMatch,
    goalMatch,
  };
}

export function filterMealsByPreferences(meals: Meal[], prefs: UserPreferences): Meal[] {
  return meals.filter(meal => {
    const result = evaluateMeal(meal, prefs);
    return result.compatible;
  });
}

export function rankMealsByPreferences(meals: Meal[], prefs: UserPreferences): Array<{ meal: Meal; result: RecommendationResult }> {
  return meals
    .map(meal => ({ meal, result: evaluateMeal(meal, prefs) }))
    .sort((a, b) => b.result.score - a.result.score);
}
