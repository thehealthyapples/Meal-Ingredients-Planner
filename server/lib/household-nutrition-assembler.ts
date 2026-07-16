/**
 * household-nutrition-assembler.ts — HNP1 Household Nutrition Platform Foundation
 * =========================================================================
 * THE I/O ORCHESTRATOR of the Household Nutrition Platform.
 *
 * It holds no rule, no threshold, no weight and no phrasing. It reads from the
 * existing canonical owners, hands their output to the PURE reasoning core
 * (`shared/nutrition/household-nutrition.ts`), and returns what that core composed.
 *
 * This is the same "pure reasoning core, thin I/O orchestrator" split that FI4's
 * opportunity engine and NTC-P2's notice gateway already use. It is applied here
 * from the start rather than being refactored into later.
 *
 * ---------------------------------------------------------------------------
 * IT OWNS NOTHING. Every figure traces to a canonical read:
 * ---------------------------------------------------------------------------
 *   Household planner history (all-time AND per week)
 *                          → fetchHouseholdPlannerFoods (WX4 — the single canonical
 *                            household-planner read; HNP1 extended it with `byWeek`
 *                            rather than adding a second reader)
 *   Plant classification   → shared/canonical/plant-classifier (M4 — the single
 *                            canonical owner; this module never decides what a plant is)
 *   Variety components     → the SAME classifier's computeMealVariety / sumVarietyScores,
 *                            with its own per-meal caps applied by IT, not by us
 *   Processing quality     → user_health_trends (the existing time-series owner, written
 *                            by the UPF / Apple Rating service — never recomputed here)
 *   All-time diversity + categories
 *                          → assembleNutritionCentre (WX8 — the existing household
 *                            nutrition projection; HNP1 READS it and does not replace it)
 *   Score / balance / insights / opportunities
 *                          → shared/nutrition/household-nutrition (the pure core)
 *
 * PROGRESSIVE ENRICHMENT: every owner is read INDEPENDENTLY and best-effort. A
 * household with no planner, no analysed products, or no Nutrition Centre simply
 * contributes no dimension from that owner. It never blocks the others, and it never
 * yields a fabricated stand-in. A household with nothing at all yields
 * `{ available: false }` and the whole surface disappears.
 *
 * Run tests: npx tsx server/tests/test-household-nutrition.ts
 */

import { storage } from "../storage";
import { fetchHouseholdPlannerFoods, type PlannerWeekFacts } from "./food-intelligence-assembler";
import { assembleNutritionCentre } from "./nutrition-centre-assembler";
import {
  computeMealVariety,
  sumVarietyScores,
  isPlantIngredient,
  EMPTY_VARIETY_SCORE,
} from "@shared/canonical/plant-classifier";
import {
  buildInsights,
  buildOpportunities,
  buildWeeklySummary,
  computeHouseholdNutritionScore,
  PLANNER_WEEK_DAYS,
  type HouseholdNutritionFacts,
  type HouseholdNutritionOpportunity,
  type HouseholdNutritionScore,
  type NutritionInsight,
  type WeeklyNutritionSummary,
} from "@shared/nutrition/household-nutrition";

// ---------------------------------------------------------------------------
// The public projection
// ---------------------------------------------------------------------------

/**
 * Everything the Household Nutrition Platform tells a household about itself.
 *
 * Every section is INDEPENDENTLY nullable. `available: false` means the household
 * has no nutrition history at all, and the surface renders nothing — the same
 * discipline `assembleNutritionCentre` already applies (WX8).
 */
export interface HouseholdNutritionReport {
  available: boolean;
  score: HouseholdNutritionScore | null;
  weekly: WeeklyNutritionSummary | null;
  insights: NutritionInsight[];
  opportunities: HouseholdNutritionOpportunity[];
  /** Named so any surface can answer "which owners produced this?" without guessing. */
  trust: {
    sources: string[];
    /** The dimensions that had no data, named honestly rather than scored as zero. */
    unscoredDimensions: string[];
  };
}

const UNAVAILABLE: HouseholdNutritionReport = {
  available: false,
  score: null,
  weekly: null,
  insights: [],
  opportunities: [],
  trust: { sources: [], unscoredDimensions: [] },
};

// ---------------------------------------------------------------------------
// Owner reads — each independent, each best-effort
// ---------------------------------------------------------------------------

/**
 * The household's average Apple Rating, from the EXISTING time-series owner.
 *
 * Returns `null` (never 0) when the household has never had a product analysed —
 * which is the common case, and an honest gap. A household that has scanned nothing
 * has not eaten badly; THA simply does not know, and says so by not scoring the
 * dimension at all.
 *
 * The average is weighted by `sampleCount`, because each row is itself already an
 * average over that many products. A plain mean of the daily means would silently
 * over-weight a day on which one product was scanned.
 */
async function readProcessingQuality(
  userId: number,
): Promise<{ average: number | null; sampleCount: number }> {
  try {
    const trends = await storage.getUserHealthTrends(userId, 90);
    let weighted = 0;
    let samples = 0;
    for (const t of trends) {
      const n = t.sampleCount ?? 0;
      if (n <= 0) continue;
      weighted += t.averageThaRating * n;
      samples += n;
    }
    if (samples === 0) return { average: null, sampleCount: 0 };
    return { average: weighted / samples, sampleCount: samples };
  } catch (err) {
    console.error("[HNP1] health trends unavailable:", err);
    return { average: null, sampleCount: 0 };
  }
}

/**
 * All-time context from the EXISTING household nutrition projection (WX8).
 *
 * HNP1 READS the Nutrition Centre; it does not re-derive its figures and it does not
 * replace it. Plant diversity is a CONTESTED domain (ARCHITECTURE_PRINCIPLES.md) — a
 * second all-time count computed in this module would be a second owner and would move
 * convergence backwards, which is exactly what the notice gateway declined to do for
 * the same figure.
 */
async function readAllTimeContext(
  householdId: number,
): Promise<{ plantDiversity: number | null; categoriesCovered: number; categoriesTotal: number }> {
  try {
    const centre = await assembleNutritionCentre(householdId);
    if (!centre.available || !centre.overview || !centre.journey) {
      return { plantDiversity: null, categoriesCovered: 0, categoriesTotal: 0 };
    }
    return {
      plantDiversity: centre.overview.plantDiversity,
      categoriesCovered: centre.journey.categoriesCovered,
      categoriesTotal: centre.journey.categoriesTotal,
    };
  } catch (err) {
    console.error("[HNP1] nutrition centre unavailable:", err);
    return { plantDiversity: null, categoriesCovered: 0, categoriesTotal: 0 };
  }
}

/**
 * Turn ONE planner week into the plant facts the pure core scores.
 *
 * Both figures come from the canonical classifier, not from this module:
 *   - the plant SET is `isPlantIngredient` applied to the week's canonical slugs
 *   - the variety PROFILE is `computeMealVariety` + `sumVarietyScores`, whose
 *     per-meal caps (3 fruit, 3 veg, 1 each grain/herb/oil) are the classifier's own
 *     model of a balanced meal and are applied by IT
 *
 * A week is passed as ONE ingredient list per meal-entry batch. The classifier caps
 * per call, so handing it the whole week at once would silently collapse a varied
 * week into one capped meal. The week is therefore summed over its meals, which is
 * what `sumVarietyScores` exists for.
 */
function weekPlantFacts(week: PlannerWeekFacts | undefined): {
  plantSlugs: string[];
  variety: ReturnType<typeof sumVarietyScores>;
} {
  if (!week) return { plantSlugs: [], variety: EMPTY_VARIETY_SCORE };

  const plantSlugs = Array.from(week.slugs).filter((slug) =>
    isPlantIngredient(slug.replace(/-/g, " ")),
  );

  // One VarietyScore per meal, then summed — never one capped score for the whole week.
  const variety = sumVarietyScores([computeMealVariety(week.ingredients)]);

  return { plantSlugs, variety };
}

// ---------------------------------------------------------------------------
// The assembler
// ---------------------------------------------------------------------------

/**
 * Assemble the household's nutrition report for ONE planner week.
 *
 * `weekNumber` defaults to the household's LATEST planned week — the week a household
 * looking at their dashboard is actually living in. An explicit `weekNumber` reports
 * that week instead, and an unknown one is an honest gap (`available: false`), never
 * the latest week silently substituted.
 */
export async function assembleHouseholdNutrition(
  userId: number,
  householdId: number,
  weekNumber?: number,
): Promise<HouseholdNutritionReport> {
  const planner = await fetchHouseholdPlannerFoods(householdId);

  // No planner history at all → the household has told THA nothing about how it eats,
  // and THA has nothing honest to say back. Silence, never a zero score.
  if (planner.byWeek.size === 0) return UNAVAILABLE;

  const weeks = Array.from(planner.byWeek.keys()).sort((a, b) => a - b);
  const latest = weeks[weeks.length - 1];
  const targetWeek = weekNumber ?? latest;

  const week = planner.byWeek.get(targetWeek);
  // An explicitly requested week that the household never planned is an honest gap.
  if (!week) return UNAVAILABLE;

  const [processing, allTime] = await Promise.all([
    readProcessingQuality(userId),
    readAllTimeContext(householdId),
  ]);

  const { plantSlugs, variety } = weekPlantFacts(week);

  const facts: HouseholdNutritionFacts = {
    weeklyPlantSlugs: plantSlugs,
    weeklyVariety: variety,
    mealsPlanned: week.mealEntryCount,
    daysWithMeals: countDaysWithMeals(week),
    averageAppleRating: processing.average,
    appleRatingSampleCount: processing.sampleCount,
    categoriesCovered: allTime.categoriesCovered,
    categoriesTotal: allTime.categoriesTotal,
    allTimePlantDiversity: allTime.plantDiversity,
    weekNumber: targetWeek,
  };

  // THE PURE CORE. Every rule, weight, threshold and sentence lives there.
  const score = computeHouseholdNutritionScore(facts);
  const weekly = buildWeeklySummary(facts);
  const insights = buildInsights(facts, score);
  const opportunities = buildOpportunities(facts, score);

  const sources = ["planner", "plant-classifier"];
  if (processing.sampleCount > 0) sources.push("user_health_trends");
  if (allTime.plantDiversity != null) sources.push("nutrition-centre");

  return {
    available: true,
    score,
    weekly,
    insights,
    opportunities,
    trust: {
      sources,
      unscoredDimensions: score.dimensions.filter((d) => d.value === null).map((d) => d.key),
    },
  };
}

/**
 * How many of the week's seven days carry at least one meal.
 *
 * This is an EXACT count of distinct planner days, not an inference. The canonical
 * household planner read already joined `planner_days` to reach the week; HNP1 projects
 * its id through (`PlannerWeekFacts.dayIds`), so the figure a household is scored on is
 * counted rather than approximated.
 *
 * The distinction matters and is not academic: counting DISTINCT MEALS instead — the
 * obvious shortcut when the day id is absent — silently under-reports every household
 * that cooks the same meal on two days, which is most of them. A household is never
 * scored on a proxy when the real figure is one projection away.
 *
 * Clamped to the seven days of a planner week, because `PLANNER_WEEK_DAYS` is the
 * denominator the pure core scores this against.
 */
function countDaysWithMeals(week: PlannerWeekFacts): number {
  return Math.min(week.dayIds.size, PLANNER_WEEK_DAYS);
}
