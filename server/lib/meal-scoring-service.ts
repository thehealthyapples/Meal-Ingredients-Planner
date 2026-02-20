import type { Meal, UserPreferences } from "@shared/schema";
import type { ExternalMealCandidate } from "./external-meal-service";

export interface ScoredCandidate {
  id: string | number;
  name: string;
  image: string | null;
  ingredients: string[];
  instructions: string[];
  source: string;
  sourceUrl: string | null;
  category: string | null;
  cuisine: string | null;
  primaryProtein: string | null;
  dietTypes: string[];
  estimatedCost: number | null;
  estimatedUPFScore: number | null;
  score: number;
  scoreBreakdown: {
    dietMatch: number;
    goalAlignment: number;
    budgetAlignment: number;
    upfScore: number;
    varietyScore: number;
    overlapScore: number;
    cuisineBonus: number;
    simplicityBonus: number;
  };
  isExternal: boolean;
  mealId?: number;
}

const MEAT_KEYWORDS = ["chicken", "beef", "pork", "lamb", "turkey", "duck", "bacon", "steak", "ham", "mince", "sausage", "veal", "venison"];
const FISH_KEYWORDS = ["fish", "salmon", "tuna", "cod", "prawn", "shrimp", "crab", "lobster", "mussel", "haddock", "mackerel", "trout", "sardine"];
const DAIRY_KEYWORDS = ["milk", "cheese", "cream", "butter", "yogurt", "yoghurt"];

const DIET_EXCLUDED_KEYWORDS: Record<string, string[]> = {
  vegetarian: [...MEAT_KEYWORDS, ...FISH_KEYWORDS],
  vegan: [...MEAT_KEYWORDS, ...FISH_KEYWORDS, ...DAIRY_KEYWORDS, "egg", "honey"],
  "gluten-free": ["flour", "bread", "pasta", "noodle", "wheat", "barley", "rye", "couscous"],
  keto: ["rice", "bread", "pasta", "flour", "sugar", "potato", "noodle", "oat"],
  "dairy-free": DAIRY_KEYWORDS,
};

const HIGH_PROTEIN_KEYWORDS = ["chicken", "beef", "turkey", "salmon", "tuna", "egg", "tofu", "lentil", "bean", "pork", "prawn", "shrimp", "cod", "lamb"];
const LOW_CALORIE_KEYWORDS = ["salad", "spinach", "broccoli", "cucumber", "tomato", "lettuce", "celery", "pepper", "courgette"];
const UPF_KEYWORDS = ["processed", "instant", "packet", "mix", "ready-made", "pre-made", "artificial", "hydrogenated"];

const BUDGET_THRESHOLDS: Record<string, number> = {
  budget: 4.0,
  standard: 7.0,
  premium: 12.0,
};

const SCORE_WEIGHTS = {
  dietMatch: 22,
  goalAlignment: 13,
  budgetAlignment: 13,
  upfScore: 13,
  varietyScore: 13,
  overlapScore: 8,
  cuisineBonus: 5,
  simplicityBonus: 13,
};

export function scoreMeal(
  candidate: {
    name: string;
    ingredients: string[];
    dietTypes?: string[];
    estimatedCost?: number | null;
    estimatedUPFScore?: number | null;
    cuisine?: string | null;
    primaryProtein?: string | null;
  },
  prefs: UserPreferences | null,
  context: {
    usedProteins?: Map<string, number>;
    usedIngredients?: string[];
    preferredCuisine?: string;
  } = {}
): { score: number; breakdown: ScoredCandidate["scoreBreakdown"] } {
  let dietMatch = SCORE_WEIGHTS.dietMatch;
  let goalAlignment = SCORE_WEIGHTS.goalAlignment;
  let budgetAlignment = SCORE_WEIGHTS.budgetAlignment;
  let upfScore = SCORE_WEIGHTS.upfScore;
  let varietyScore = SCORE_WEIGHTS.varietyScore;
  let overlapScore = 0;
  let cuisineBonus = 0;

  const lowerIngs = candidate.ingredients.map(i => i.toLowerCase());
  const allText = [candidate.name, ...candidate.ingredients].join(" ").toLowerCase();

  if (prefs) {
    if (prefs.dietTypes && prefs.dietTypes.length > 0) {
      for (const diet of prefs.dietTypes) {
        const excluded = DIET_EXCLUDED_KEYWORDS[diet] || [];
        const hasExcluded = excluded.some(kw => allText.includes(kw));
        if (hasExcluded) {
          dietMatch = -10;
          break;
        }
      }
    }

    if (prefs.excludedIngredients && prefs.excludedIngredients.length > 0) {
      for (const excl of prefs.excludedIngredients) {
        if (allText.includes(excl.toLowerCase())) {
          dietMatch = -20;
          break;
        }
      }
    }

    if (prefs.healthGoals && prefs.healthGoals.length > 0) {
      for (const goal of prefs.healthGoals) {
        if (goal === "build-muscle") {
          const hasProtein = HIGH_PROTEIN_KEYWORDS.some(kw => allText.includes(kw));
          goalAlignment += hasProtein ? 5 : -5;
        }
        if (goal === "lose-weight") {
          const hasLowCal = LOW_CALORIE_KEYWORDS.some(kw => allText.includes(kw));
          const hasHeavy = ["cream", "butter", "sugar", "chocolate", "pastry"].some(kw => allText.includes(kw));
          if (hasLowCal) goalAlignment += 5;
          if (hasHeavy) goalAlignment -= 8;
        }
        if (goal === "avoid-upf" || goal === "eat-healthier") {
          const hasUPF = UPF_KEYWORDS.some(kw => allText.includes(kw));
          if (hasUPF) goalAlignment -= 10;
        }
      }
    }

    if (prefs.budgetLevel) {
      const threshold = BUDGET_THRESHOLDS[prefs.budgetLevel] || 7.0;
      const cost = candidate.estimatedCost || 5.0;
      if (cost <= threshold) {
        budgetAlignment = SCORE_WEIGHTS.budgetAlignment;
      } else {
        budgetAlignment = Math.max(0, SCORE_WEIGHTS.budgetAlignment - ((cost - threshold) / threshold) * SCORE_WEIGHTS.budgetAlignment);
      }
    }

    if (prefs.upfSensitivity) {
      const upfVal = candidate.estimatedUPFScore || 0;
      if (prefs.upfSensitivity === "strict" && upfVal > 20) {
        upfScore = -10;
      } else if (prefs.upfSensitivity === "moderate" && upfVal > 40) {
        upfScore = 0;
      } else {
        upfScore = SCORE_WEIGHTS.upfScore * (1 - upfVal / 100);
      }
    }
  }

  if (context.usedProteins && candidate.primaryProtein) {
    const count = context.usedProteins.get(candidate.primaryProtein) || 0;
    if (count >= 3) {
      varietyScore = -5;
    } else if (count >= 2) {
      varietyScore = SCORE_WEIGHTS.varietyScore * 0.5;
    }
  }

  if (context.usedIngredients && context.usedIngredients.length > 0) {
    const existingSet = new Set(context.usedIngredients.map(i => i.toLowerCase()));
    const overlap = lowerIngs.filter(i => {
      const words = i.split(/\s+/);
      return words.some(w => w.length > 3 && existingSet.has(w));
    });
    overlapScore = Math.min(SCORE_WEIGHTS.overlapScore, (overlap.length / Math.max(1, lowerIngs.length)) * SCORE_WEIGHTS.overlapScore);
  }

  if (context.preferredCuisine && candidate.cuisine) {
    if (candidate.cuisine.toLowerCase() === context.preferredCuisine.toLowerCase()) {
      cuisineBonus = SCORE_WEIGHTS.cuisineBonus;
    }
  }

  let simplicityBonus = 0;
  const ingredientCount = candidate.ingredients.length;
  if (ingredientCount <= 6) {
    simplicityBonus = SCORE_WEIGHTS.simplicityBonus;
  } else if (ingredientCount <= 10) {
    simplicityBonus = SCORE_WEIGHTS.simplicityBonus * 0.8;
  } else if (ingredientCount <= 15) {
    simplicityBonus = SCORE_WEIGHTS.simplicityBonus * 0.4;
  } else {
    simplicityBonus = 0;
  }

  const commonMealKeywords = [
    "pasta", "chicken", "rice", "curry", "soup", "salad", "stir fry",
    "sandwich", "omelette", "bolognese", "chilli", "stew", "pie",
    "burger", "tacos", "wrap", "noodles", "roast", "bake", "casserole",
  ];
  const nameLower = candidate.name.toLowerCase();
  if (commonMealKeywords.some(kw => nameLower.includes(kw))) {
    simplicityBonus = Math.min(SCORE_WEIGHTS.simplicityBonus, simplicityBonus + 3);
  }

  const total = dietMatch + goalAlignment + budgetAlignment + upfScore + varietyScore + overlapScore + cuisineBonus + simplicityBonus;

  return {
    score: Math.max(0, Math.min(100, total)),
    breakdown: {
      dietMatch,
      goalAlignment,
      budgetAlignment,
      upfScore,
      varietyScore,
      overlapScore,
      cuisineBonus,
      simplicityBonus,
    },
  };
}

export function convertMealToCandidate(
  meal: Meal,
  nutrition?: { calories?: string | null } | null
): Omit<ScoredCandidate, "score" | "scoreBreakdown"> {
  const lowerIngs = meal.ingredients.map(i => i.toLowerCase());
  let primaryProtein: string | null = null;

  const proteinMap: Record<string, string[]> = {
    chicken: ["chicken"], beef: ["beef", "steak", "mince"], pork: ["pork", "bacon", "ham", "sausage"],
    lamb: ["lamb"], fish: ["fish", "salmon", "tuna", "cod", "haddock", "mackerel"],
    seafood: ["prawn", "shrimp", "crab", "lobster"], vegetarian: ["tofu", "tempeh", "paneer", "lentil", "chickpea", "bean"],
  };

  for (const [protein, kws] of Object.entries(proteinMap)) {
    if (lowerIngs.some(ing => kws.some(kw => ing.includes(kw)))) {
      primaryProtein = protein;
      break;
    }
  }

  return {
    id: meal.id,
    name: meal.name,
    image: meal.imageUrl,
    ingredients: meal.ingredients,
    instructions: meal.instructions || [],
    source: "My Meals",
    sourceUrl: meal.sourceUrl,
    category: null,
    cuisine: null,
    primaryProtein,
    dietTypes: [],
    estimatedCost: null,
    estimatedUPFScore: null,
    isExternal: false,
    mealId: meal.id,
  };
}

export function convertExternalToCandidate(ext: ExternalMealCandidate): Omit<ScoredCandidate, "score" | "scoreBreakdown"> {
  return {
    id: ext.externalId,
    name: ext.name,
    image: ext.image,
    ingredients: ext.ingredients,
    instructions: ext.instructions,
    source: ext.source,
    sourceUrl: ext.sourceUrl,
    category: ext.category,
    cuisine: ext.cuisine,
    primaryProtein: ext.primaryProtein,
    dietTypes: ext.dietTypes,
    estimatedCost: ext.estimatedCost,
    estimatedUPFScore: ext.estimatedUPFScore,
    isExternal: true,
  };
}
