// WX1 — Meal Intelligence Assembler.
//
// Composes existing canonical owners into a single runtime model for a meal.
// The assembler owns NOTHING — it reads from canonical sources and returns an
// ephemeral runtime object. Nothing is persisted or cached here.
//
// Canonical ownership map (Architecture Principle 2):
//   Meal identity/ingredients/instructions  → DB `meals`
//   Meal nutrition                          → DB `nutrition`
//   Food identity + nutrients               → CANONICAL_SEED + WS0 registry
//   Health benefit CLAIMS                   → the Layer-2 evidence gate, via
//                                             getEvidenceBackedFoodReport (KNOW4)
//   Food discovery                          → shared/discovery/engine (WS8)
//   Seasonality                             → shared/discovery/seasonal-map
//   Household planner history               → DB `planner_entries` / `planner_weeks`
//   Nutrition enhancement                   → uplift-engine + uplift-rules
//
// Progressive enrichment (Architecture Principle 3):
//   Every section is independently optional. Absent data returns null or [].
//   No section ever fabricates content.

import { db } from "../db";
import {
  meals,
  nutrition,
  plannerEntries,
  plannerDays,
  plannerWeeks,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { resolveCanonicalFood } from "@shared/canonical/resolver";
import type { FoodReportKnowledge } from "@shared/canonical/food-report-adapter";
import { getEvidenceBackedFoodReport } from "./food-report-evidence";
import {
  seasonForDate,
  SEASON_SEED,
  SEASON_LABEL,
} from "@shared/discovery/seasonal-map";
import { discover } from "@shared/discovery/engine";
import type { DiscoveryResult } from "@shared/discovery/types";
import type { UKSeason } from "@shared/discovery/types";
import { buildRuleIndex, matchUpliftRules } from "./uplift-engine";
import { UPLIFT_RULES } from "./uplift-rules";
import type { UpliftMatchResult } from "./uplift-types";

// ── Lazy rule index (built once per process) ──────────────────────────────────

let _ruleIndex: ReturnType<typeof buildRuleIndex> | null = null;

function getRuleIndex(): ReturnType<typeof buildRuleIndex> {
  if (!_ruleIndex) _ruleIndex = buildRuleIndex(UPLIFT_RULES);
  return _ruleIndex;
}

// ── Public types ──────────────────────────────────────────────────────────────

/** Core meal facts — direct projection from the `meals` table. */
export interface MealCore {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[] | null;
  servings: number;
  categoryId: number | null;
  dietTypes: string[];
  primarySlot: string | null;
  suitableSlots: string[];
  imageUrl: string | null;
  mealFormat: string;
  isReadyMeal: boolean;
}

/** Nutrition snapshot from the `nutrition` table. */
export interface MealNutritionSnapshot {
  calories: string | null;
  protein: string | null;
  carbs: string | null;
  fat: string | null;
  sugar: string | null;
  salt: string | null;
  source: string | null;
}

/**
 * One ingredient that resolved to a canonical food, with its assembled food
 * report. Only present for ingredients where `resolveCanonicalFood` matched.
 */
export interface ResolvedFoodIntelligence {
  /** Original ingredient string from the meal. */
  ingredient: string;
  canonicalSlug: string;
  canonicalName: string;
  diversityGroupSlug: string | null;
  /** Full canonical food report from WS2F. Never null when this entry exists. */
  report: FoodReportKnowledge;
}

/** Which of the meal's resolved ingredients are at their UK seasonal best right now. */
export interface MealSeasonality {
  season: UKSeason;
  seasonLabel: string;
  /** Subset of resolved foods that appear in the current season's seed list. */
  seasonalIngredients: Array<{
    ingredient: string;
    canonicalSlug: string;
    name: string;
  }>;
}

/** Household planner history for this specific meal. */
export interface HouseholdMealContext {
  householdId: number;
  /** How many times this meal has appeared in the household's planner. */
  plannerAppearanceCount: number;
  /** Week number of the most recent planner appearance, or null if never planned. */
  lastPlannerWeekNumber: number | null;
}

/** Meal's presence in a specific planner week. */
export interface PlannerMealContext {
  weekId: number;
  appearances: Array<{
    entryId: number;
    mealType: string;
    dayOfWeek: number;
    audience: string;
  }>;
}

/** Nutrition enhancement suggestions from the uplift engine. */
export interface NutritionEnhancementContext {
  /** Matched uplift rules for this meal, sorted by priority. */
  matches: UpliftMatchResult[];
}

/**
 * Trust model — how much of this intelligence is grounded in canonical data.
 * Based solely on validated ingredient resolution. Never estimated.
 */
export interface MealIntelligenceTrust {
  totalIngredients: number;
  resolvedIngredients: number;
  /** 'high' ≥80%, 'medium' ≥40%, 'low' <40%, 'unknown' for meals with no ingredients. */
  confidenceLevel: "high" | "medium" | "low" | "unknown";
}

/** Assembly provenance — when assembled and which sources contributed. */
export interface MealIntelligenceMetadata {
  /** ISO 8601 timestamp of this assembly. */
  assembledAt: string;
  /** Which sections had contributing data. */
  sources: string[];
}

/**
 * The canonical runtime model for meal intelligence.
 *
 * Design contract:
 *   • Every section is independently optional (progressive enrichment).
 *   • Null/empty means absent — never fabricated.
 *   • The assembler owns nothing — all facts trace back to canonical owners.
 *   • Future surfaces call getMealIntelligence() and render available sections.
 */
export interface MealIntelligence {
  mealId: number;
  /** Core meal facts. Null only when the meal does not exist. */
  meal: MealCore | null;
  /** Nutrition snapshot. Null when no nutrition row exists for this meal. */
  nutrition: MealNutritionSnapshot | null;
  /**
   * Per-ingredient canonical food intelligence. Contains only ingredients that
   * resolved to a canonical food. Empty array for fully unresolved meals.
   */
  foods: ResolvedFoodIntelligence[];
  /**
   * Deduplicated union of health benefits across all resolved foods.
   * Empty when no resolved food has WS0 benefit data.
   */
  healthBenefits: string[];
  /**
   * Which of this meal's ingredients are at their UK seasonal best right now.
   * Null when no ingredients resolve to canonical foods.
   */
  seasonality: MealSeasonality | null;
  /** Household planner history. Null when no householdId is provided. */
  household: HouseholdMealContext | null;
  /**
   * Current planner week context. Null when no plannerWeekId is provided or
   * when the meal does not appear in the specified week.
   */
  planner: PlannerMealContext | null;
  /**
   * Nutrition uplift suggestions. Null when no rules match this meal.
   * Uses the same engine as MealUpliftPanel.
   */
  nutritionEnhancement: NutritionEnhancementContext | null;
  /**
   * Food discovery for the first resolved ingredient (anchor food).
   * Null when no ingredients resolve to canonical foods.
   */
  discovery: DiscoveryResult | null;
  trust: MealIntelligenceTrust;
  metadata: MealIntelligenceMetadata;
}

// ── Section assemblers ────────────────────────────────────────────────────────

async function assembleMeal(mealId: number): Promise<MealCore | null> {
  const [row] = await db
    .select()
    .from(meals)
    .where(eq(meals.id, mealId));

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    ingredients: row.ingredients,
    instructions: row.instructions ?? null,
    servings: row.servings,
    categoryId: row.categoryId ?? null,
    dietTypes: row.dietTypes,
    primarySlot: row.primarySlot ?? null,
    suitableSlots: row.suitableSlots,
    imageUrl: row.imageUrl ?? null,
    mealFormat: row.mealFormat,
    isReadyMeal: row.isReadyMeal,
  };
}

async function assembleNutrition(
  mealId: number
): Promise<MealNutritionSnapshot | null> {
  const [row] = await db
    .select()
    .from(nutrition)
    .where(eq(nutrition.mealId, mealId));

  if (!row) return null;

  return {
    calories: row.calories ?? null,
    protein: row.protein ?? null,
    carbs: row.carbs ?? null,
    fat: row.fat ?? null,
    sugar: row.sugar ?? null,
    salt: row.salt ?? null,
    source: row.source ?? null,
  };
}

/**
 * Resolve a meal's ingredients to their canonical food reports.
 *
 * KNOW4 — this reads the EVIDENCE-GATED report, not the raw seed adapter. A
 * meal's benefit chips are the same claims the Food page renders, so they must
 * pass through the same Layer-2 gate (Rule KC4 — one owner, one mouth). One
 * gated read per distinct canonical food, resolved concurrently.
 */
async function assembleFoods(ingredients: string[]): Promise<ResolvedFoodIntelligence[]> {
  const seenSlugs = new Set<string>();
  const pending: { ingredient: string; resolution: ReturnType<typeof resolveCanonicalFood> }[] = [];

  for (const ingredient of ingredients) {
    const resolution = resolveCanonicalFood(ingredient);
    if (!resolution.matched || !resolution.canonicalSlug) continue;

    // One canonical food entry per meal, even if multiple ingredients resolve
    // to the same canonical slug (e.g. "cherry tomatoes" and "tomatoes").
    if (seenSlugs.has(resolution.canonicalSlug)) continue;
    seenSlugs.add(resolution.canonicalSlug);

    pending.push({ ingredient, resolution });
  }

  const reports = await Promise.all(
    pending.map((p) => getEvidenceBackedFoodReport(p.resolution.canonicalSlug!)),
  );

  const resolved: ResolvedFoodIntelligence[] = [];
  pending.forEach(({ ingredient, resolution }, i) => {
    const report = reports[i];
    if (!report) return;
    resolved.push({
      ingredient,
      canonicalSlug: resolution.canonicalSlug!,
      canonicalName: resolution.canonicalName!,
      diversityGroupSlug: resolution.diversityGroupSlug,
      report,
    });
  });

  return resolved;
}

function assembleHealthBenefits(foods: ResolvedFoodIntelligence[]): string[] {
  const seen = new Set<string>();
  const benefits: string[] = [];
  for (const food of foods) {
    for (const benefit of food.report.healthBenefits) {
      if (!seen.has(benefit)) {
        seen.add(benefit);
        benefits.push(benefit);
      }
    }
  }
  return benefits;
}

function assembleSeasonality(
  foods: ResolvedFoodIntelligence[],
  now: Date
): MealSeasonality | null {
  if (foods.length === 0) return null;

  const season = seasonForDate(now);
  const seasonFoods = SEASON_SEED[season];
  const seasonalSlugs = new Set(seasonFoods.map((f) => f.slug));
  const seasonalFoodBySlug = new Map(seasonFoods.map((f) => [f.slug, f]));

  const seasonalIngredients = foods
    .filter((f) => seasonalSlugs.has(f.canonicalSlug))
    .map((f) => ({
      ingredient: f.ingredient,
      canonicalSlug: f.canonicalSlug,
      name: seasonalFoodBySlug.get(f.canonicalSlug)?.name ?? f.canonicalName,
    }));

  return {
    season,
    seasonLabel: SEASON_LABEL[season],
    seasonalIngredients,
  };
}

async function assembleHousehold(
  mealId: number,
  householdId: number
): Promise<HouseholdMealContext | null> {
  const rows = await db
    .select({
      weekNumber: plannerWeeks.weekNumber,
    })
    .from(plannerEntries)
    .innerJoin(plannerDays, eq(plannerEntries.dayId, plannerDays.id))
    .innerJoin(plannerWeeks, eq(plannerDays.weekId, plannerWeeks.id))
    .where(
      and(
        eq(plannerEntries.mealId, mealId),
        eq(plannerWeeks.householdId, householdId)
      )
    )
    .orderBy(desc(plannerWeeks.weekNumber));

  const lastPlannerWeekNumber =
    rows.length > 0 ? rows[0].weekNumber : null;

  return {
    householdId,
    plannerAppearanceCount: rows.length,
    lastPlannerWeekNumber,
  };
}

async function assemblePlanner(
  mealId: number,
  plannerWeekId: number
): Promise<PlannerMealContext | null> {
  const rows = await db
    .select({
      entryId: plannerEntries.id,
      mealType: plannerEntries.mealType,
      dayOfWeek: plannerDays.dayOfWeek,
      audience: plannerEntries.audience,
    })
    .from(plannerEntries)
    .innerJoin(plannerDays, eq(plannerEntries.dayId, plannerDays.id))
    .where(
      and(
        eq(plannerEntries.mealId, mealId),
        eq(plannerDays.weekId, plannerWeekId)
      )
    );

  if (rows.length === 0) return null;

  return {
    weekId: plannerWeekId,
    appearances: rows.map((r) => ({
      entryId: r.entryId,
      mealType: r.mealType,
      dayOfWeek: r.dayOfWeek,
      audience: r.audience,
    })),
  };
}

function assembleNutritionEnhancement(
  meal: MealCore
): NutritionEnhancementContext | null {
  const idx = getRuleIndex();
  const matches = matchUpliftRules(
    {
      mealName: meal.name,
      ingredients: meal.ingredients,
      dietTypes: meal.dietTypes,
    },
    idx
  );

  if (matches.length === 0) return null;

  return { matches };
}

function assembleDiscovery(
  foods: ResolvedFoodIntelligence[],
  now: Date
): DiscoveryResult | null {
  if (foods.length === 0) return null;

  const anchorSlug = foods[0].canonicalSlug;

  return discover({
    food: anchorSlug,
    now,
  });
}

function assembleTrust(
  totalIngredients: number,
  resolvedCount: number
): MealIntelligenceTrust {
  if (totalIngredients === 0) {
    return {
      totalIngredients: 0,
      resolvedIngredients: 0,
      confidenceLevel: "unknown",
    };
  }

  const ratio = resolvedCount / totalIngredients;
  const confidenceLevel =
    ratio >= 0.8 ? "high" : ratio >= 0.4 ? "medium" : "low";

  return {
    totalIngredients,
    resolvedIngredients: resolvedCount,
    confidenceLevel,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Assemble meal intelligence for a single meal.
 *
 * All sections are assembled in parallel. Each section independently handles
 * its own absent-data case (null or empty). The function always returns a
 * complete `MealIntelligence` object — never throws.
 *
 * @param mealId       The meal to assemble intelligence for.
 * @param householdId  Optional — enables household planner history section.
 * @param plannerWeekId Optional — enables current planner week section.
 */
export async function getMealIntelligence(
  mealId: number,
  householdId?: number,
  plannerWeekId?: number
): Promise<MealIntelligence> {
  const now = new Date();
  const sources: string[] = [];

  // Phase 1: fetch meal row (needed by several subsequent sections)
  const meal = await assembleMeal(mealId);

  if (meal) sources.push("meal");

  // Phase 2: all remaining sections in parallel
  const ingredients = meal?.ingredients ?? [];

  const [
    nutritionResult,
    householdResult,
    plannerResult,
  ] = await Promise.all([
    assembleNutrition(mealId),
    householdId != null ? assembleHousehold(mealId, householdId) : Promise.resolve(null),
    plannerWeekId != null ? assemblePlanner(mealId, plannerWeekId) : Promise.resolve(null),
  ]);

  if (nutritionResult) sources.push("nutrition");
  if (householdResult) sources.push("household");
  if (plannerResult) sources.push("planner");

  // Phase 3: sections derived from ingredients. The food reports are evidence-
  // gated (KNOW4), so this phase reads the database and is no longer pure.
  const foods = await assembleFoods(ingredients);
  const healthBenefits = assembleHealthBenefits(foods);
  const seasonality = assembleSeasonality(foods, now);

  if (foods.length > 0) sources.push("canonical_foods");
  if (healthBenefits.length > 0) sources.push("health_benefits");
  if (seasonality && seasonality.seasonalIngredients.length > 0) {
    sources.push("seasonality");
  }

  // Phase 4: intelligence sections (depend on meal + foods)
  const nutritionEnhancement = meal
    ? assembleNutritionEnhancement(meal)
    : null;
  const discovery = assembleDiscovery(foods, now);

  if (nutritionEnhancement) sources.push("nutrition_enhancement");
  if (discovery && discovery.sections.length > 0) sources.push("discovery");

  // Phase 5: trust
  const trust = assembleTrust(ingredients.length, foods.length);

  return {
    mealId,
    meal,
    nutrition: nutritionResult,
    foods,
    healthBenefits,
    seasonality,
    household: householdResult,
    planner: plannerResult,
    nutritionEnhancement,
    discovery,
    trust,
    metadata: {
      assembledAt: now.toISOString(),
      sources,
    },
  };
}
