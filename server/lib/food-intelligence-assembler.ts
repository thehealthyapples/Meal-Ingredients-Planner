// WX4 — Food Intelligence Assembler.
//
// Composes existing canonical owners into a single runtime model for ONE food.
// The assembler owns NOTHING — it reads from canonical sources and returns an
// ephemeral runtime object. Nothing is persisted or cached here.
//
// Canonical ownership map (Architecture Principle 2):
//   Food identity / overview / description   → CANONICAL_SEED (WS2A) via buildFoodReport
//   Nutrients + health benefits + context    → WS0 knowledge bridge via buildFoodReport
//   Seasonality                              → shared/discovery/seasonal-map
//   Meals using this food                    → DB `meals` (system Cookbook)
//   Household planner history                → DB `planner_entries` / `planner_days` / `planner_weeks`
//   Food discovery                           → shared/discovery/engine (WS8)
//   Nutrition enhancement (Simply Better)    → uplift-engine + uplift-rules
//
// Progressive enrichment (Architecture Principle 3):
//   Every section is independently optional. Absent data returns null or [].
//   No section ever fabricates content. An unknown slug ⇒ `food === null`.

import { db } from "../db";
import { meals, plannerEntries, plannerDays, plannerWeeks } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { resolveCanonicalFood } from "@shared/canonical/resolver";
import { buildFoodReport, isCanonicalFood } from "@shared/canonical/food-report-adapter";
import type { FoodReportKnowledge } from "@shared/canonical/food-report-adapter";
import {
  seasonForDate,
  SEASON_SEED,
  SEASON_LABEL,
} from "@shared/discovery/seasonal-map";
import { discover } from "@shared/discovery/engine";
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

// ── How many Cookbook meals we surface for one food. ──────────────────────────
const MAX_MEALS = 8;

// ── Public types ──────────────────────────────────────────────────────────────

/** Hero / overview facts — straight from the WS2F food report. */
export interface FoodOverview {
  name: string;
  category: string;
  /** Empty string when no description has been authored. */
  description: string;
}

/** Whether this food is at its UK seasonal best right now. Null when not seasonal. */
export interface FoodSeasonality {
  season: UKSeason;
  seasonLabel: string;
  /** Warm one-liner, e.g. "Tomato is at its best in the UK summer." */
  note: string;
}

/** A Cookbook meal that contains this canonical food. */
export interface FoodMealReference {
  mealId: number;
  name: string;
  imageUrl: string | null;
}

/**
 * Household planner history for this specific food. Only present when the
 * household has actually planned a meal containing it (evidence required).
 */
export interface FoodHouseholdContext {
  householdId: number;
  /** Planner entries (meal appearances) that contained this food. */
  plannerAppearanceCount: number;
  /** Most recent planner week number a meal with this food appeared in. */
  lastPlannerWeekNumber: number | null;
  /** Earliest planner week number — when the household first met this food. */
  firstPlannerWeekNumber: number | null;
  /** The meal containing this food that the household plans most often. */
  mostCommonMeal: { mealId: number; name: string; count: number } | null;
}

/**
 * One discovery suggestion. `linkable` is true only when the slug is itself a
 * canonical food (so a /foods/:slug page exists). Variety/cuisine slugs that
 * have no page are surfaced as inspiration but never linked — no dead ends.
 */
export interface FoodDiscoverySuggestion {
  slug: string;
  name: string;
  reason: string;
  linkable: boolean;
}

export interface FoodDiscoverySection {
  type: string;
  title: string;
  suggestions: FoodDiscoverySuggestion[];
}

export interface FoodDiscovery {
  sections: FoodDiscoverySection[];
}

/** Nutrition enhancement suggestions involving this food. */
export interface FoodNutritionEnhancement {
  matches: UpliftMatchResult[];
}

/**
 * Trust model — how much of this page is grounded in canonical knowledge.
 * Based solely on which sections validated. Never estimated.
 */
export interface FoodIntelligenceTrust {
  /** True when the slug resolved to a real canonical food. */
  isCanonical: boolean;
  /** Count of sections that produced validated content. */
  populatedSections: number;
}

/** Assembly provenance — when assembled and which sources contributed. */
export interface FoodIntelligenceMetadata {
  assembledAt: string;
  sources: string[];
}

/**
 * The canonical runtime model for food intelligence.
 *
 * Design contract:
 *   • Every section is independently optional (progressive enrichment).
 *   • Null/empty means absent — never fabricated.
 *   • The assembler owns nothing — all facts trace back to canonical owners.
 *   • `food === null` means the slug is not a canonical food (safe 404).
 */
export interface FoodIntelligence {
  slug: string;
  /** Identity + overview. Null only when the slug is not a canonical food. */
  food: FoodOverview | null;
  /** Health benefits (WS0). Empty when none. */
  healthBenefits: string[];
  /** Top nutrients (WS0, max 5). Empty when none. */
  keyNutrients: string[];
  /** Curated context lines (WS2F). Empty when none authored. */
  nutritionContext: string[];
  /** Current UK seasonal status. Null when this food is not in season now. */
  seasonality: FoodSeasonality | null;
  /** Cookbook meals containing this food. Empty when none. */
  meals: FoodMealReference[];
  /** Household planner history for this food. Null when no evidence. */
  household: FoodHouseholdContext | null;
  /** Discovery (similar / cook-with / varieties / seasonal …). Null when none. */
  discovery: FoodDiscovery | null;
  /** Simply Better Choices involving this food. Null when no rule matches. */
  nutritionEnhancement: FoodNutritionEnhancement | null;
  trust: FoodIntelligenceTrust;
  metadata: FoodIntelligenceMetadata;
}

// ── Section assemblers ────────────────────────────────────────────────────────

function assembleSeasonality(
  slug: string,
  foodName: string,
  now: Date
): FoodSeasonality | null {
  const season = seasonForDate(now);
  const inSeason = SEASON_SEED[season].some((f) => f.slug === slug);
  if (!inSeason) return null;

  const label = SEASON_LABEL[season];
  return {
    season,
    seasonLabel: label,
    note: `${foodName} is at its best in the UK ${season}.`,
  };
}

/**
 * Cookbook meals (system meals) whose ingredients resolve to this canonical
 * food. Read-only; resolution is the same canonical owner used everywhere else.
 */
async function assembleMeals(slug: string): Promise<FoodMealReference[]> {
  const rows = await db
    .select({
      id: meals.id,
      name: meals.name,
      ingredients: meals.ingredients,
      imageUrl: meals.imageUrl,
    })
    .from(meals)
    .where(eq(meals.isSystemMeal, true));

  const out: FoodMealReference[] = [];
  for (const row of rows) {
    if (out.length >= MAX_MEALS) break;
    const hit = (row.ingredients ?? []).some(
      (ing) => resolveCanonicalFood(ing).canonicalSlug === slug
    );
    if (hit) {
      out.push({ mealId: row.id, name: row.name, imageUrl: row.imageUrl ?? null });
    }
  }
  return out;
}

/** Per-slug planner accumulation, keyed by canonical food slug. */
interface PlannerFoodAcc {
  appearances: number;
  lastWeek: number;
  firstWeek: number;
  mealCounts: Map<number, { name: string; count: number }>;
}

/**
 * Fetch the household's planner meals once and derive BOTH:
 *   • per-food planner accumulation (bySlug) — history for ANY requested slug
 *   • the household's `enjoys` set (every canonical slug they have planned),
 *     used to give Discovery household context.
 */
async function fetchHouseholdPlannerFoods(
  householdId: number
): Promise<{ enjoys: string[]; bySlug: Map<string, PlannerFoodAcc> }> {
  const rows = await db
    .select({
      mealId: plannerEntries.mealId,
      mealName: meals.name,
      ingredients: meals.ingredients,
      weekNumber: plannerWeeks.weekNumber,
    })
    .from(plannerEntries)
    .innerJoin(plannerDays, eq(plannerEntries.dayId, plannerDays.id))
    .innerJoin(plannerWeeks, eq(plannerDays.weekId, plannerWeeks.id))
    .innerJoin(meals, eq(plannerEntries.mealId, meals.id))
    .where(eq(plannerWeeks.householdId, householdId));

  const enjoys = new Set<string>();
  // Per-slug accumulation so we can build history for ANY requested food.
  const bySlug = new Map<string, PlannerFoodAcc>();

  for (const row of rows) {
    // One distinct canonical slug per planner entry, even if several
    // ingredients resolve to the same food.
    const slugsInEntry = new Set<string>();
    for (const ing of row.ingredients ?? []) {
      const slug = resolveCanonicalFood(ing).canonicalSlug;
      if (slug) slugsInEntry.add(slug);
    }

    for (const slug of Array.from(slugsInEntry)) {
      enjoys.add(slug);
      const acc = bySlug.get(slug);
      if (!acc) {
        bySlug.set(slug, {
          appearances: 1,
          lastWeek: row.weekNumber,
          firstWeek: row.weekNumber,
          mealCounts: new Map([
            [row.mealId, { name: row.mealName, count: 1 }],
          ]),
        });
      } else {
        acc.appearances += 1;
        acc.lastWeek = Math.max(acc.lastWeek, row.weekNumber);
        acc.firstWeek = Math.min(acc.firstWeek, row.weekNumber);
        const mc = acc.mealCounts.get(row.mealId);
        if (mc) mc.count += 1;
        else acc.mealCounts.set(row.mealId, { name: row.mealName, count: 1 });
      }
    }
  }

  return { enjoys: Array.from(enjoys), bySlug };
}

function buildHouseholdForSlug(
  householdId: number,
  slug: string,
  bySlug: Map<string, PlannerFoodAcc>
): FoodHouseholdContext | null {
  const acc = bySlug.get(slug);
  if (!acc || acc.appearances === 0) return null;

  let mostCommonMeal: FoodHouseholdContext["mostCommonMeal"] = null;
  for (const [mealId, mc] of Array.from(acc.mealCounts)) {
    if (!mostCommonMeal || mc.count > mostCommonMeal.count) {
      mostCommonMeal = { mealId, name: mc.name, count: mc.count };
    }
  }

  return {
    householdId,
    plannerAppearanceCount: acc.appearances,
    lastPlannerWeekNumber: acc.lastWeek,
    firstPlannerWeekNumber: acc.firstWeek,
    mostCommonMeal,
  };
}

function assembleNutritionEnhancement(
  food: FoodReportKnowledge
): FoodNutritionEnhancement | null {
  const idx = getRuleIndex();
  // Treat the food as a single-ingredient context so any uplift rule whose
  // trigger names this food fires. No new rules; existing owner only.
  const matches = matchUpliftRules(
    {
      mealName: food.overview.name,
      ingredients: [food.overview.name],
      dietTypes: [],
    },
    idx
  );
  if (matches.length === 0) return null;
  return { matches };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Assemble food intelligence for a single canonical food slug.
 *
 * Always returns a complete `FoodIntelligence` object — never throws. When the
 * slug is not a canonical food, `food` is null and all sections are empty: the
 * caller renders a calm not-found state.
 *
 * @param foodSlug     Canonical food slug (e.g. "tomato").
 * @param householdId  Optional — enables household planner history + Discovery
 *                     household context.
 */
export async function getFoodIntelligence(
  foodSlug: string,
  householdId?: number
): Promise<FoodIntelligence> {
  const now = new Date();
  const sources: string[] = [];

  const report = buildFoodReport(foodSlug);

  // Unknown / non-canonical slug → safe empty model.
  if (!report) {
    return {
      slug: foodSlug,
      food: null,
      healthBenefits: [],
      keyNutrients: [],
      nutritionContext: [],
      seasonality: null,
      meals: [],
      household: null,
      discovery: null,
      nutritionEnhancement: null,
      trust: { isCanonical: false, populatedSections: 0 },
      metadata: { assembledAt: now.toISOString(), sources },
    };
  }

  sources.push("canonical_food");

  // Household planner foods (drives both household history + discovery enjoys).
  let household: FoodHouseholdContext | null = null;
  let enjoys: string[] = [];
  if (householdId != null) {
    const planner = await fetchHouseholdPlannerFoods(householdId);
    enjoys = planner.enjoys;
    household = buildHouseholdForSlug(householdId, foodSlug, planner.bySlug);
  }

  // Cookbook meals containing this food.
  const mealRefs = await assembleMeals(foodSlug);

  // Pure sections.
  const seasonality = assembleSeasonality(
    foodSlug,
    report.overview.name,
    now
  );
  const rawDiscovery = discover({
    food: foodSlug,
    household: enjoys.length > 0 ? { enjoys } : undefined,
    now,
  });
  const discovery: FoodDiscovery | null =
    rawDiscovery.sections.length > 0
      ? {
          sections: rawDiscovery.sections.map((section) => ({
            type: section.type,
            title: section.title,
            suggestions: section.suggestions.map((s) => ({
              slug: s.slug,
              name: s.name,
              reason: s.reason,
              linkable: isCanonicalFood(s.slug),
            })),
          })),
        }
      : null;
  const nutritionEnhancement = assembleNutritionEnhancement(report);

  if (report.healthBenefits.length > 0) sources.push("health_benefits");
  if (report.keyNutrients.length > 0) sources.push("nutrients");
  if (report.nutritionContext.length > 0) sources.push("nutrition_context");
  if (seasonality) sources.push("seasonality");
  if (mealRefs.length > 0) sources.push("meals");
  if (household) sources.push("household");
  if (discovery) sources.push("discovery");
  if (nutritionEnhancement) sources.push("nutrition_enhancement");

  const populatedSections =
    (report.healthBenefits.length > 0 ? 1 : 0) +
    (report.keyNutrients.length > 0 ? 1 : 0) +
    (report.nutritionContext.length > 0 ? 1 : 0) +
    (seasonality ? 1 : 0) +
    (mealRefs.length > 0 ? 1 : 0) +
    (household ? 1 : 0) +
    (discovery ? 1 : 0) +
    (nutritionEnhancement ? 1 : 0);

  return {
    slug: foodSlug,
    food: {
      name: report.overview.name,
      category: report.overview.category,
      description: report.overview.description,
    },
    healthBenefits: report.healthBenefits,
    keyNutrients: report.keyNutrients,
    nutritionContext: report.nutritionContext,
    seasonality,
    meals: mealRefs,
    household,
    discovery,
    nutritionEnhancement,
    trust: { isCanonical: true, populatedSections },
    metadata: { assembledAt: now.toISOString(), sources },
  };
}
