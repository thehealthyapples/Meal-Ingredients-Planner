import type { Meal, UserPreferences } from "@shared/schema";
import { fetchExternalCandidates, type ExternalMealCandidate } from "./external-meal-service";
import { scoreMeal, convertMealToCandidate, convertExternalToCandidate, type ScoredCandidate } from "./meal-scoring-service";
import { generateMealExplanation, type MealExplanation } from "./explainability-service";
import { resolveActiveRestrictions, resolveIngredientRestrictions } from "@shared/restrictions/restriction-resolver.js";
import type { RestrictionDefinition } from "@shared/restrictions/restriction-types.js";

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
  // P0: respect the user's planner drinks preference — controls whether non-alcoholic drinks
  // can enter the candidate pool. Alcoholic drinks are always excluded regardless of this flag.
  plannerEnableDrinks?: boolean;
  // Household hard restrictions — ingredients that must never appear in any planned meal.
  // These are hard exclusions (unlike dietTypes which influence scoring).
  hardExcludedIngredients?: string[];
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

const DEBUG = process.env.NODE_ENV === 'development';

// Returns true if a candidate contains any hard-excluded ingredient.
// Hard exclusions bypass scoring — the meal is always removed from the pool.
//
// Phase 5A: matching now uses the canonical restriction resolver instead of the
// previous raw `allText.includes(exc)` substring check. The old check missed
// derived and hidden ingredients that don't contain the restriction keyword —
// e.g. sesame→tahini, soy→tofu/miso/tamari, peanut→satay sauce, coconut→coconut
// milk, and legacy nut_free→peanut + tree_nut. Since Smart Planner actively
// recommends meals, those false negatives were the highest-priority safety gap.
//
// The resolver is run per field (the meal name and each ingredient individually)
// rather than over one joined string. This is important for derived/hidden
// matching, which is forward-substring: joining all ingredients with spaces could
// otherwise let a hidden-ingredient entry match accidentally across the boundary
// between two unrelated ingredients.
//
// Custom restrictions not recognised by the canonical library (e.g. "kiwi",
// "banana", "red meat") keep their previous conservative substring behaviour via
// customRestrictionMatches() so user-entered strings continue to work. Avoiding
// unsafe false negatives is favoured over avoiding rare false positives here.
//
// activeRestrictionDefs is pre-resolved once by the caller for efficiency; it is
// resolveActiveRestrictions(hardExcluded).
function isHardExcluded(
  candidate: ScoredCandidate,
  hardExcluded: string[],
  activeRestrictionDefs: RestrictionDefinition[],
): boolean {
  if (hardExcluded.length === 0) return false;

  // Primary: canonical resolver, checked per field (name + each ingredient).
  const fields = [candidate.name, ...candidate.ingredients];
  for (const field of fields) {
    if (!field) continue;
    if (resolveIngredientRestrictions(field, activeRestrictionDefs).length > 0) return true;
  }

  // Fallback: conservative substring match for restrictions the canonical library
  // does not recognise. Preserves pre-Phase-5A behaviour for custom user strings.
  return customRestrictionMatches(candidate, hardExcluded, activeRestrictionDefs);
}

// Conservative fallback for custom hard restrictions that are NOT in the canonical
// restriction library. Mirrors the pre-Phase-5A joined-text substring behaviour so
// user-entered strings such as "kiwi" or "red meat" keep filtering exactly as before.
//
// Restrictions already covered by the resolver (their definition is present in
// activeRestrictionDefs) are skipped, so canonical word-boundary protection is not
// undermined by a looser substring check (e.g. "soy" never re-matches "savoy" here).
function customRestrictionMatches(
  candidate: ScoredCandidate,
  hardExcluded: string[],
  activeRestrictionDefs: RestrictionDefinition[],
): boolean {
  const allText = [candidate.name, ...candidate.ingredients].join(' ').toLowerCase();
  for (const restriction of hardExcluded) {
    const normR = restriction.toLowerCase().trim().replace(/[-_]/g, ' ');
    if (!normR) continue;
    // Skip restrictions the canonical resolver already handles.
    if (activeRestrictionDefs.some(d =>
      d.id.replace(/_/g, ' ') === normR ||
      d.aliases.some(a => a.toLowerCase() === normR)
    )) continue;
    if (allText.includes(normR)) return true;
  }
  return false;
}

// Exported for unit testing of the hard restriction filter in isolation.
// Builds a minimal candidate from a name + ingredient list and resolves the
// active canonical restrictions internally, so tests don't need the full pipeline.
export function candidateHardExcluded(
  name: string,
  ingredients: string[],
  hardExcluded: string[],
): boolean {
  const candidate = { name, ingredients } as ScoredCandidate;
  return isHardExcluded(candidate, hardExcluded, resolveActiveRestrictions(hardExcluded));
}

// P0: "drink" removed from breakfast — generic drinks must not appear as breakfast meals.
// Breakfast slot only accepts explicit breakfast and smoothie categories.
const SLOT_CATEGORY_MAPPING: Record<string, string[]> = {
  breakfast: ["breakfast", "smoothie"],
  lunch: ["lunch", "snack", "salad"],
  dinner: ["dinner", "main"],
  snack: ["snack", "dessert", "smoothie", "drink"],
};

// P1: deterministic alcohol keyword list — anything matching is excluded from planner pools.
const ALCOHOL_KEYWORDS = [
  "cocktail", "mojito", "margarita", "wine", "beer", "vodka", "whiskey",
  "gin", "rum", "tequila", "champagne", "prosecco", "cider",
  "lager", "ale", "stout", "bourbon", "brandy", "liqueur",
];

// P1/P0: returns true if a candidate should be treated as an alcoholic drink by name or category.
function isAlcoholicCandidate(candidate: ScoredCandidate): boolean {
  const nameLower = candidate.name.toLowerCase();
  const catLower = (candidate.category || "").toLowerCase();
  return (
    ALCOHOL_KEYWORDS.some(kw => nameLower.includes(kw)) ||
    catLower === "cocktail" ||
    catLower === "alcohol"
  );
}

// P0: returns true if a candidate is any kind of drink (alcoholic or non-alcoholic).
function isDrinkCandidate(candidate: ScoredCandidate): boolean {
  const catLower = (candidate.category || "").toLowerCase();
  return (
    catLower === "drink" ||
    catLower === "beverage" ||
    catLower === "cocktail" ||
    catLower === "alcohol" ||
    isAlcoholicCandidate(candidate)
  );
}

// P0: safe fallback candidates per slot — never promotes dinner meals to breakfast.
function getSafeFallbackCandidates(
  allCandidates: ScoredCandidate[],
  slot: string,
  usedIds: Set<string | number>,
): ScoredCandidate[] {
  if (slot === "breakfast") {
    // Breakfast is strict: only explicit breakfast/smoothie in fallback — no cross-slot promotion.
    return allCandidates.filter(c => {
      if (usedIds.has(c.id)) return false;
      const cat = (c.category || "").toLowerCase();
      return cat === "breakfast" || cat === "smoothie";
    });
  }
  // For other slots: null-category (uncategorised) meals and general meal categories are safe.
  // Explicitly exclude breakfast-categorised items from non-breakfast fallback.
  return allCandidates.filter(c => {
    if (usedIds.has(c.id)) return false;
    const cat = (c.category || "").toLowerCase();
    if (cat === "breakfast" || cat === "smoothie") return false;
    return true;
  });
}

// P0: removed universal `|| slot === "dinner"` bypass — dinner now filters via SLOT_CATEGORY_MAPPING.
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

  const plannerEnableDrinks = settings.plannerEnableDrinks ?? false;
  const hardExcluded = settings.hardExcludedIngredients ?? [];
  // Pre-resolve household hard restrictions to canonical definitions once, so the
  // per-candidate hard exclusion filter doesn't re-resolve the same strings.
  const activeRestrictionDefs = resolveActiveRestrictions(hardExcluded);
  const allCandidates: ScoredCandidate[] = [];

  for (const meal of userMeals) {
    // P0: enforce drink/alcohol rules directly on the Meal record before conversion.
    // This catches isDrink/kind="drink" meals that carry no category and no alcohol name keyword.
    if (meal.drinkType === "alcohol") {
      console.debug(`[SmartSuggest] Excluded alcoholic user meal (drinkType=alcohol): "${meal.name}"`);
      continue;
    }
    if (!plannerEnableDrinks && (meal.isDrink || meal.kind === "drink")) {
      console.debug(`[SmartSuggest] Excluded drink user meal (plannerEnableDrinks=false): "${meal.name}"`);
      continue;
    }

    const base = convertMealToCandidate(meal, mealNutrition.get(meal.id));
    const catName = meal.categoryId ? mealCategories.get(meal.categoryId) || null : null;
    base.category = catName;
    const candidate: ScoredCandidate = { ...base, score: 0, scoreBreakdown: { dietMatch: 0, goalAlignment: 0, budgetAlignment: 0, upfScore: 0, varietyScore: 0, overlapScore: 0, cuisineBonus: 0, simplicityBonus: 0 } };

    // P0/P1: secondary name/category-based alcohol check (catches named cocktails without drink flags).
    if (isAlcoholicCandidate(candidate)) {
      console.debug(`[SmartSuggest] Excluded alcoholic user meal (name keyword): "${candidate.name}"`);
      continue;
    }
    // P0: secondary category-based drink check for any drink-category meals that slipped through.
    if (!plannerEnableDrinks && isDrinkCandidate(candidate)) {
      console.debug(`[SmartSuggest] Excluded drink user meal (category check): "${candidate.name}"`);
      continue;
    }
    // Household hard restriction filter — always applied, bypasses scoring.
    if (isHardExcluded(candidate, hardExcluded, activeRestrictionDefs)) {
      if (DEBUG) console.debug(`[SmartSuggest] Hard-excluded user meal (household restriction): "${candidate.name}"`);
      continue;
    }
    allCandidates.push(candidate);
  }

  for (const ext of externalCandidates) {
    const base = convertExternalToCandidate(ext);
    const candidate: ScoredCandidate = { ...base, score: 0, scoreBreakdown: { dietMatch: 0, goalAlignment: 0, budgetAlignment: 0, upfScore: 0, varietyScore: 0, overlapScore: 0, cuisineBonus: 0, simplicityBonus: 0 } };

    // P0: exclude alcoholic external candidates unconditionally.
    // Note: inferCategoryFromCuisineAndName now returns null for drink/cocktail/beverage/alcohol
    // category terms — those null-category candidates are caught below by name-based detection.
    if (isAlcoholicCandidate(candidate)) {
      console.debug(`[SmartSuggest] Excluded alcoholic external meal: "${candidate.name}"`);
      continue;
    }
    // P0: exclude drink-category external candidates unless plannerEnableDrinks is active.
    if (!plannerEnableDrinks && isDrinkCandidate(candidate)) {
      console.debug(`[SmartSuggest] Excluded external drink (plannerEnableDrinks=false): "${candidate.name}"`);
      continue;
    }
    // Household hard restriction filter — always applied.
    if (isHardExcluded(candidate, hardExcluded, activeRestrictionDefs)) {
      if (DEBUG) console.debug(`[SmartSuggest] Hard-excluded external meal (household restriction): "${candidate.name}"`);
      continue;
    }
    allCandidates.push(candidate);
  }

  if (DEBUG && hardExcluded.length > 0) {
    console.debug(`[SmartSuggest] Hard exclusions active: [${hardExcluded.join(', ')}] — pool size after hard filter: ${allCandidates.length}`);
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

      // P0: slot-appropriate candidates only — no universal dinner bypass.
      let slotCandidates = allCandidates.filter(c => {
        if (usedIds.has(c.id)) return false;
        return getCandidateSlotFit(c, slot);
      });

      // P0: safe fallback — category-adjacent meals only, never promotes dinner to breakfast.
      if (slotCandidates.length === 0) {
        slotCandidates = getSafeFallbackCandidates(allCandidates, slot, usedIds);
        if (slotCandidates.length > 0) {
          console.debug(`[SmartSuggest] Using safe fallback candidates for slot "${slot}" (${slotCandidates.length} options)`);
        } else {
          // No safe fallback available — skip this slot rather than suggest an inappropriate meal.
          console.debug(`[SmartSuggest] No suitable candidates for slot "${slot}" — skipping (thin library)`);
        }
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
        // Fallback: safe slot-appropriate candidates only — preserves slot and hard exclusion rules.
        if (slotCandidates.length === 0) slotCandidates = getSafeFallbackCandidates(allCandidates, slot, usedIds);
        if (slotCandidates.length === 0) {
          if (DEBUG) console.debug(`[SmartSuggest] No candidates after fish cap fallback for slot "${slot}"`);
        }
      }
      if (redMeatCount >= maxRedMeat) {
        slotCandidates = slotCandidates.filter(c =>
          c.primaryProtein !== "beef" && c.primaryProtein !== "lamb" && c.primaryProtein !== "pork"
        );
        // Fallback: safe slot-appropriate candidates only — preserves slot and hard exclusion rules.
        if (slotCandidates.length === 0) slotCandidates = getSafeFallbackCandidates(allCandidates, slot, usedIds);
        if (slotCandidates.length === 0) {
          if (DEBUG) console.debug(`[SmartSuggest] No candidates after red meat cap fallback for slot "${slot}"`);
        }
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
        if (DEBUG && score < 10) {
          console.debug(`[SmartSuggest] Low score ${score} for "${c.name}" — breakdown:`, breakdown);
        }
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
