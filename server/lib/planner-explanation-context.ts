// PLAN1 — Planner Intelligence: the evidence context a planner explanation reads from.
//
// This module OWNS NOTHING. It is a read-only composer, in the same shape as
// `food-intelligence-assembler.ts` (WX4): every fact it returns is fetched from
// that fact's existing canonical owner and returned ephemerally. No new store,
// no cache, no second planner, no AI.
//
// OWNERSHIP MAP — every field below names the owner it was read from:
//   season, seasonalFoods   → shared/discovery/seasonal-map.ts (SEASON_SEED, seasonForDate)
//                             widened by shared/canonical/food-context.ts (peakSeasons)
//   pantryFoods             → DB user_pantry_items (via storage.getPantryItems)
//   familiarFoods           → DB planner_entries (via fetchHouseholdPlannerFoods)
//   plant diversity groups  → shared/canonical/plant-classifier.ts + diversity_group seed
//   canonical identity      → shared/canonical/resolver.ts (resolveCanonicalFood)
//
// HONEST GAPS (Principle 6). Each awareness flag is false when the underlying
// owner could not be read (no user, no household, no pantry, DB error). A false
// flag means the explanation composer emits NO line for that dimension. It never
// substitutes a guess. A missing signal is silence, not an invented sentence.

import { SEASON_SEED, seasonForDate } from "@shared/discovery/seasonal-map";
import type { UKSeason } from "@shared/discovery/types";
import { FOOD_CONTEXT_SEED } from "@shared/canonical/food-context";
import { CANONICAL_SEED } from "@shared/canonical/foods";
import { resolveCanonicalFood } from "@shared/canonical/resolver";
import { isPlantIngredient } from "@shared/canonical/plant-classifier";

// The DB-backed owners (storage, household, planner history) are imported
// dynamically at call time, not statically. `server/db.ts` throws on import when
// DATABASE_URL is absent, and this module's derivations (seasonality, canonical
// resolution, plant grouping) are pure — they must stay importable, and testable,
// without a database. Nothing here reaches a DB until a userId is supplied.

/** Canonical slug → display name. */
export type FoodNameIndex = ReadonlyMap<string, string>;

/**
 * Everything a planner explanation may cite, read once per suggestion run.
 * Every map is keyed by canonical food slug (Principle 1 — one key space).
 */
export interface PlannerExplanationContext {
  /** UK meteorological season for the run date. Null when seasonality is unavailable. */
  readonly season: UKSeason | null;
  /** Canonical foods at UK peak season right now. */
  readonly seasonalFoods: FoodNameIndex;
  /** Canonical foods the household records as already in the pantry. */
  readonly pantryFoods: FoodNameIndex;
  /** Canonical foods the household has planned before → planner appearance count. */
  readonly familiarFoods: ReadonlyMap<string, number>;

  /** True when the household's planner history was genuinely read. */
  readonly historyAware: boolean;
  /** True when the household's pantry was genuinely read. */
  readonly pantryAware: boolean;
  /** True when seasonality resolved for the run date. */
  readonly seasonAware: boolean;
}

/** The zero context. Every dimension it gates renders as absent, never as invented. */
export const EMPTY_PLANNER_EXPLANATION_CONTEXT: PlannerExplanationContext = {
  season: null,
  seasonalFoods: new Map(),
  pantryFoods: new Map(),
  familiarFoods: new Map(),
  historyAware: false,
  pantryAware: false,
  seasonAware: false,
};

/**
 * Running state of the week being generated, as at the moment a meal is chosen.
 * Owned by the smart-suggest selection loop — this is a read-only view of it,
 * not a second copy. Used for planner balance and week-opportunity reasoning.
 */
export interface PlannerWeekState {
  /** Meals already placed before this one. */
  readonly mealsChosen: number;
  /** Protein → times already used this week. */
  readonly usedProteins: ReadonlyMap<string, number>;
  /** Diversity-group slugs already counted this week. */
  readonly plantGroups: ReadonlySet<string>;
  readonly fishCount: number;
  readonly fishTarget: number | null;
  readonly redMeatCount: number;
  readonly redMeatTarget: number | null;
  readonly costSoFar: number;
  readonly weeklyBudget: number | null;
}

export const EMPTY_PLANNER_WEEK_STATE: PlannerWeekState = {
  mealsChosen: 0,
  usedProteins: new Map(),
  plantGroups: new Set(),
  fishCount: 0,
  fishTarget: null,
  redMeatCount: 0,
  redMeatTarget: null,
  costSoFar: 0,
  weeklyBudget: null,
};

// ── Canonical name index (built once from the canonical seed) ─────────────────

let canonicalNames: Map<string, string> | null = null;
function canonicalNameFor(slug: string): string {
  if (canonicalNames === null) {
    canonicalNames = new Map(CANONICAL_SEED.map((s) => [s.food.slug, s.food.name]));
  }
  return canonicalNames.get(slug) ?? slug;
}

// ── Pure derivations (no I/O — directly unit-testable) ────────────────────────

/**
 * The canonical foods at UK peak season on `now`.
 *
 * SEASON_SEED is the declared canonical representation of seasonality for logic
 * (WS0X.4). `canonical_food.peakSeasons` absorbs it, and `validateCanonicalSeed`
 * enforces SEASON_SEED ⊆ peakSeasons — so reading both and unioning cannot
 * introduce a fact absent from the owner, only widen coverage to every canonical
 * food that declares the current season.
 */
export function buildSeasonalFoods(now: Date): { season: UKSeason; foods: FoodNameIndex } {
  const season = seasonForDate(now);
  const foods = new Map<string, string>();

  for (const { slug, name } of SEASON_SEED[season]) {
    foods.set(slug, name);
  }
  for (const [slug, context] of Object.entries(FOOD_CONTEXT_SEED)) {
    if (context.peakSeasons.includes(season) && !foods.has(slug)) {
      foods.set(slug, canonicalNameFor(slug));
    }
  }

  return { season, foods };
}

/**
 * Resolve a meal's ingredient strings to canonical foods.
 * Unresolvable ingredients are dropped — an ingredient THA cannot identify is a
 * gap, and a gap must never be reasoned over.
 */
export function mealCanonicalFoods(ingredients: readonly string[]): FoodNameIndex {
  const foods = new Map<string, string>();
  for (const raw of ingredients) {
    if (!raw) continue;
    const r = resolveCanonicalFood(raw);
    if (r.matched && r.canonicalSlug) {
      foods.set(r.canonicalSlug, r.canonicalName ?? canonicalNameFor(r.canonicalSlug));
    }
  }
  return foods;
}

/**
 * The distinct plant diversity groups a meal contributes, keyed by diversity-group
 * slug → a display name for the plant. Deduplicated by group, so every tomato
 * variety collapses to one plant — exactly as the 30-plants counter counts.
 * `isPlantIngredient` is the canonical gate (it honours countAsSinglePlant).
 */
export function mealPlantGroups(ingredients: readonly string[]): FoodNameIndex {
  const groups = new Map<string, string>();
  for (const raw of ingredients) {
    if (!raw || !isPlantIngredient(raw)) continue;
    const r = resolveCanonicalFood(raw);
    if (!r.diversityGroupSlug || groups.has(r.diversityGroupSlug)) continue;
    groups.set(
      r.diversityGroupSlug,
      r.canonicalName ?? canonicalNameFor(r.canonicalSlug ?? r.diversityGroupSlug),
    );
  }
  return groups;
}

// ── The composed read ────────────────────────────────────────────────────────

/**
 * Read every explanation-supporting fact once, from its canonical owner.
 *
 * Each read is independently guarded: one failing owner degrades that single
 * dimension to an honest gap rather than failing the suggestion, and never
 * blocks meal generation. Called once per smart-suggest run, not per candidate.
 */
export async function buildPlannerExplanationContext(
  userId: number | undefined,
  now: Date = new Date(),
): Promise<PlannerExplanationContext> {
  let season: UKSeason | null = null;
  let seasonalFoods: FoodNameIndex = new Map();
  let seasonAware = false;
  try {
    const seasonal = buildSeasonalFoods(now);
    season = seasonal.season;
    seasonalFoods = seasonal.foods;
    seasonAware = seasonal.foods.size > 0;
  } catch (err) {
    console.error("[PlannerIntelligence] Seasonal context unavailable:", err);
  }

  if (userId == null) {
    return { ...EMPTY_PLANNER_EXPLANATION_CONTEXT, season, seasonalFoods, seasonAware };
  }

  const [pantry, history] = await Promise.all([
    readPantryFoods(userId),
    readFamiliarFoods(userId),
  ]);

  return {
    season,
    seasonalFoods,
    seasonAware,
    pantryFoods: pantry.foods,
    pantryAware: pantry.aware,
    familiarFoods: history.foods,
    historyAware: history.aware,
  };
}

/** Owner: DB `user_pantry_items` (via storage). Only items the household has. */
async function readPantryFoods(
  userId: number,
): Promise<{ foods: FoodNameIndex; aware: boolean }> {
  try {
    const { storage } = await import("../storage");
    const items = await storage.getPantryItems(userId);
    const foods = new Map<string, string>();
    for (const item of items) {
      if (!item.defaultHave) continue;
      const r = resolveCanonicalFood(item.ingredientKey || item.displayName || "");
      if (r.matched && r.canonicalSlug) {
        foods.set(r.canonicalSlug, item.displayName ?? r.canonicalName ?? r.canonicalSlug);
      }
    }
    return { foods, aware: true };
  } catch (err) {
    console.error("[PlannerIntelligence] Pantry context unavailable:", err);
    return { foods: new Map(), aware: false };
  }
}

/** Owner: DB `planner_entries` (via fetchHouseholdPlannerFoods — the single canonical read). */
async function readFamiliarFoods(
  userId: number,
): Promise<{ foods: ReadonlyMap<string, number>; aware: boolean }> {
  try {
    const { getHouseholdForUser } = await import("./household");
    const { fetchHouseholdPlannerFoods } = await import("./food-intelligence-assembler");
    const householdId = await getHouseholdForUser(userId);
    const planned = await fetchHouseholdPlannerFoods(householdId);
    const foods = new Map<string, number>();
    for (const [slug, acc] of Array.from(planned.bySlug.entries())) {
      foods.set(slug, acc.appearances);
    }
    // A household with no planner history yet is not "history aware" — it has no
    // history to cite, so familiarity and novelty are both silent.
    return { foods, aware: planned.mealEntryCount > 0 };
  } catch (err) {
    console.error("[PlannerIntelligence] Household planner history unavailable:", err);
    return { foods: new Map(), aware: false };
  }
}
