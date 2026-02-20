import type { Meal, UserPreferences } from "@shared/schema";
import { fetchExternalCandidates, type ExternalMealCandidate } from "./external-meal-service";
import { scoreMeal, convertMealToCandidate, convertExternalToCandidate, type ScoredCandidate } from "./meal-scoring-service";
import { generateMealExplanation, type MealExplanation } from "./explainability-service";

export interface LockedEntry {
  dayOfWeek: number;
  slot: string;
  candidateId: string | number;
  candidateName: string;
}

export interface SmartSuggestSettings {
  mealsPerDay?: number;
  includeLeftovers?: boolean;
  maxWeeklyBudget?: number;
  maxWeeklyUPF?: number;
  preferredCuisine?: string;
  fishPerWeek?: number;
  redMeatPerWeek?: number;
  vegetarianDays?: boolean;
  dietId?: number;
  calorieTarget?: number;
  peopleCount?: number;
  lockedEntries?: LockedEntry[];
}

export interface SmartSuggestEntry {
  dayOfWeek: number;
  day: string;
  slot: string;
  candidate: ScoredCandidate;
  locked: boolean;
  explanation?: MealExplanation;
}

export interface SmartSuggestResult {
  entries: SmartSuggestEntry[];
  stats: {
    totalMeals: number;
    externalMeals: number;
    userMeals: number;
    estimatedWeeklyCost: number;
    averageUPFScore: number;
    proteinDistribution: Record<string, number>;
    ingredientReuse: number;
    uniqueIngredients: number;
    sharedIngredients: string[];
  };
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SLOT_CATEGORY_MAPPING: Record<string, string[]> = {
  breakfast: ["breakfast", "smoothie", "drink"],
  lunch: ["lunch", "snack", "salad"],
  dinner: ["dinner", "main"],
  snack: ["snack", "dessert", "smoothie", "drink"],
};

function getCandidateSlotFit(candidate: ScoredCandidate, slot: string): boolean {
  if (!candidate.category) return slot === "dinner";
  const allowed = SLOT_CATEGORY_MAPPING[slot] || [slot];
  return allowed.includes(candidate.category.toLowerCase());
}

export async function generateSmartSuggestion(
  userMeals: Meal[],
  prefs: UserPreferences | null,
  settings: SmartSuggestSettings,
  mealNutrition: Map<number, { calories?: string | null }>,
  mealCategories: Map<number, string>,
): Promise<SmartSuggestResult> {
  const mealsPerDay = settings.mealsPerDay || 3;
  const slots = mealsPerDay >= 4
    ? ["breakfast", "lunch", "dinner", "snack"]
    : mealsPerDay === 3
      ? ["breakfast", "lunch", "dinner"]
      : mealsPerDay === 2
        ? ["lunch", "dinner"]
        : ["dinner"];

  const externalCandidates = await fetchExternalCandidates({
    cuisine: settings.preferredCuisine,
    query: settings.preferredCuisine || undefined,
  });

  const allCandidates: ScoredCandidate[] = [];

  for (const meal of userMeals) {
    const base = convertMealToCandidate(meal, mealNutrition.get(meal.id));
    const catName = meal.categoryId ? mealCategories.get(meal.categoryId) || null : null;
    base.category = catName;
    allCandidates.push({ ...base, score: 0, scoreBreakdown: { dietMatch: 0, goalAlignment: 0, budgetAlignment: 0, upfScore: 0, varietyScore: 0, overlapScore: 0, cuisineBonus: 0, simplicityBonus: 0 } });
  }

  for (const ext of externalCandidates) {
    const base = convertExternalToCandidate(ext);
    allCandidates.push({ ...base, score: 0, scoreBreakdown: { dietMatch: 0, goalAlignment: 0, budgetAlignment: 0, upfScore: 0, varietyScore: 0, overlapScore: 0, cuisineBonus: 0, simplicityBonus: 0 } });
  }

  const usedProteins = new Map<string, number>();
  const usedIngredients: string[] = [];
  const usedIds = new Set<string | number>();
  const entries: SmartSuggestEntry[] = [];
  let totalCost = 0;
  let totalUPF = 0;
  let mealCount = 0;

  let fishCount = 0;
  let redMeatCount = 0;
  const maxFish = settings.fishPerWeek ?? 99;
  const maxRedMeat = settings.redMeatPerWeek ?? 99;
  const vegDayIdxs = settings.vegetarianDays ? [1, 3] : [];
  const maxWeeklyUPF = settings.maxWeeklyUPF ?? Infinity;

  const lockedMap = new Map<string, LockedEntry>();
  if (settings.lockedEntries) {
    for (const le of settings.lockedEntries) {
      lockedMap.set(`${le.dayOfWeek}-${le.slot}`, le);
    }
  }

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const isVegDay = vegDayIdxs.includes(dayIdx);

    for (const slot of slots) {
      const lockKey = `${dayIdx}-${slot}`;
      const locked = lockedMap.get(lockKey);

      if (locked) {
        const lockedCandidate = allCandidates.find(c =>
          (c.id === locked.candidateId) || (c.name === locked.candidateName)
        );
        if (lockedCandidate) {
          entries.push({
            dayOfWeek: dayIdx,
            day: DAYS[dayIdx],
            slot,
            candidate: lockedCandidate,
            locked: true,
          });
          usedIds.add(lockedCandidate.id);
          if (lockedCandidate.primaryProtein) {
            usedProteins.set(lockedCandidate.primaryProtein, (usedProteins.get(lockedCandidate.primaryProtein) || 0) + 1);
          }
          usedIngredients.push(...lockedCandidate.ingredients);
          totalCost += lockedCandidate.estimatedCost || 4;
          totalUPF += lockedCandidate.estimatedUPFScore || 0;
          mealCount++;
          if (lockedCandidate.primaryProtein === "fish" || lockedCandidate.primaryProtein === "seafood") fishCount++;
          if (lockedCandidate.primaryProtein === "beef" || lockedCandidate.primaryProtein === "lamb" || lockedCandidate.primaryProtein === "pork") redMeatCount++;
          continue;
        }
      }

      let slotCandidates = allCandidates.filter(c => {
        if (usedIds.has(c.id)) return false;
        return getCandidateSlotFit(c, slot) || slot === "dinner";
      });

      if (slotCandidates.length === 0) {
        slotCandidates = allCandidates.filter(c => !usedIds.has(c.id));
      }
      if (slotCandidates.length === 0) {
        slotCandidates = allCandidates;
      }

      if (isVegDay) {
        const vegOnly = slotCandidates.filter(c => {
          const text = [c.name, ...c.ingredients].join(" ").toLowerCase();
          const meatKw = ["chicken", "beef", "pork", "lamb", "turkey", "duck", "bacon", "steak", "ham", "mince", "sausage",
            "fish", "salmon", "tuna", "cod", "prawn", "shrimp"];
          return !meatKw.some(kw => text.includes(kw));
        });
        if (vegOnly.length > 0) slotCandidates = vegOnly;
      }

      if (fishCount >= maxFish) {
        slotCandidates = slotCandidates.filter(c =>
          c.primaryProtein !== "fish" && c.primaryProtein !== "seafood"
        );
        if (slotCandidates.length === 0) slotCandidates = allCandidates.filter(c => !usedIds.has(c.id));
      }
      if (redMeatCount >= maxRedMeat) {
        slotCandidates = slotCandidates.filter(c =>
          c.primaryProtein !== "beef" && c.primaryProtein !== "lamb" && c.primaryProtein !== "pork"
        );
        if (slotCandidates.length === 0) slotCandidates = allCandidates.filter(c => !usedIds.has(c.id));
      }

      if (maxWeeklyUPF < Infinity) {
        const remainingUPFBudget = maxWeeklyUPF * (7 * slots.length) - totalUPF;
        const remainingMeals = (7 * slots.length) - mealCount;
        const maxUPFPerMeal = remainingMeals > 0 ? (remainingUPFBudget / remainingMeals) * 1.3 : 0;
        if (maxUPFPerMeal >= 0) {
          const upfFiltered = slotCandidates.filter(c => (c.estimatedUPFScore || 0) <= maxUPFPerMeal);
          if (upfFiltered.length > 0) slotCandidates = upfFiltered;
        }
      }

      if (settings.maxWeeklyBudget) {
        const remainingBudget = settings.maxWeeklyBudget - totalCost;
        const remainingMeals = (7 * slots.length) - mealCount;
        const maxPerMeal = remainingMeals > 0 ? remainingBudget / remainingMeals * 1.5 : 0;
        if (maxPerMeal > 0) {
          const budgetFiltered = slotCandidates.filter(c => (c.estimatedCost || 5) <= maxPerMeal);
          if (budgetFiltered.length > 0) slotCandidates = budgetFiltered;
        }
      }

      const scored = slotCandidates.map(c => {
        const { score, breakdown } = scoreMeal(
          {
            name: c.name,
            ingredients: c.ingredients,
            dietTypes: c.dietTypes,
            estimatedCost: c.estimatedCost,
            estimatedUPFScore: c.estimatedUPFScore,
            cuisine: c.cuisine,
            primaryProtein: c.primaryProtein,
          },
          prefs,
          {
            usedProteins,
            usedIngredients,
            preferredCuisine: settings.preferredCuisine,
          }
        );
        return { ...c, score, scoreBreakdown: breakdown };
      });

      scored.sort((a, b) => b.score - a.score);

      const topN = scored.slice(0, 5);
      const chosen = topN.length > 0
        ? topN[Math.floor(Math.random() * Math.min(3, topN.length))]
        : scored[0];

      if (chosen) {
        const explanation = generateMealExplanation(chosen, prefs);
        entries.push({
          dayOfWeek: dayIdx,
          day: DAYS[dayIdx],
          slot,
          candidate: chosen,
          locked: false,
          explanation,
        });

        usedIds.add(chosen.id);
        if (chosen.primaryProtein) {
          usedProteins.set(chosen.primaryProtein, (usedProteins.get(chosen.primaryProtein) || 0) + 1);
        }
        usedIngredients.push(...chosen.ingredients);
        totalCost += chosen.estimatedCost || 4;
        totalUPF += chosen.estimatedUPFScore || 0;
        mealCount++;

        if (chosen.primaryProtein === "fish" || chosen.primaryProtein === "seafood") fishCount++;
        if (chosen.primaryProtein === "beef" || chosen.primaryProtein === "lamb" || chosen.primaryProtein === "pork") redMeatCount++;
      }
    }
  }

  const allIngs = entries.flatMap(e => e.candidate.ingredients.map(i => i.toLowerCase().replace(/^\d+[\s/]*(?:g|kg|ml|l|cups?|tsp|tbsp)?\s*/i, "").trim()));
  const ingCounts = new Map<string, number>();
  for (const ing of allIngs) {
    const words = ing.split(/\s+/).filter(w => w.length > 3);
    for (const w of words) {
      ingCounts.set(w, (ingCounts.get(w) || 0) + 1);
    }
  }
  const shared = Array.from(ingCounts.entries()).filter(([, c]) => c >= 3).map(([k]) => k).slice(0, 10);
  const uniqueIngredientSet = new Set(allIngs);

  const proteinDist: Record<string, number> = {};
  usedProteins.forEach((count, protein) => { proteinDist[protein] = count; });

  return {
    entries,
    stats: {
      totalMeals: entries.length,
      externalMeals: entries.filter(e => e.candidate.isExternal).length,
      userMeals: entries.filter(e => !e.candidate.isExternal).length,
      estimatedWeeklyCost: Math.round(totalCost * 100) / 100,
      averageUPFScore: mealCount > 0 ? Math.round(totalUPF / mealCount) : 0,
      proteinDistribution: proteinDist,
      ingredientReuse: shared.length,
      uniqueIngredients: uniqueIngredientSet.size,
      sharedIngredients: shared,
    },
  };
}
