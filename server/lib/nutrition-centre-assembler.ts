// WX8 — Household Nutrition Centre Assembler.
//
// Composes EXISTING canonical owners into one household-wide runtime model that
// answers a single question: "How is our household's relationship with food
// evolving?" It owns NOTHING — no schema, no persistence, no calculations of its
// own. Every figure traces to a canonical read:
//
//   Household planner history  → fetchHouseholdPlannerFoods (food-intelligence assembler)
//   Plant diversity            → shared/canonical/plant-classifier
//   Foods / nutrients / benefits / categories → WS0 Knowledge Registry
//   Seasonality                → shared/discovery/seasonal-map
//   Discovery                  → shared/discovery/engine
//   Nutrition Enhancement      → uplift-engine + uplift-rules (Simply Better)
//
// Progressive enrichment: a household with no planner history yields
// `{ available: false }` and the whole Centre disappears on the client. Every
// section is independently optional — empty intelligence is silent, never
// fabricated, estimated, or shown with invented progress.

import { fetchHouseholdPlannerFoods } from "./food-intelligence-assembler";
import { plantDiversityGroup } from "@shared/canonical/plant-classifier";
import { seasonForDate, SEASON_SEED, SEASON_LABEL } from "@shared/discovery/seasonal-map";
import { discover } from "@shared/discovery/engine";
import {
  listFoods,
  listFoodCategories,
  listHealthBenefits,
  resolveIngredientsToKnowledgeSummary,
} from "../services/nutrition-knowledge-registry";
import { buildRuleIndex, matchUpliftRules } from "./uplift-engine";
import { UPLIFT_RULES } from "./uplift-rules";
import { upliftSuggestionText } from "@shared/nutrition/uplift-phrasing";

// ── Public projection ──────────────────────────────────────────────────────────

export interface CentreFoodRef {
  slug: string;
  name: string;
}

export interface NutritionCentreOverview {
  plantDiversity: number;
  foodDiversity: number;
  mealsCooked: number;
  foodsDiscovered: number;
  seasonalFoodsEnjoyed: number;
  seasonLabel: string;
}

export interface NutritionCentreJourney {
  nutrientCoverage: number;
  benefitCoverage: number;
  categoriesCovered: number;
  categoriesTotal: number;
}

export interface CentreCategoryProgress {
  category: string;
  enjoyed: number;
  total: number;
}

export interface CentreBenefit {
  slug: string;
  name: string;
  icon: string | null;
  /** How many foods the household already enjoys that support this benefit. */
  householdFoodCount: number;
}

export interface CentreTrendFood extends CentreFoodRef {
  appearances: number;
}

export interface CentreDiscoverySuggestion extends CentreFoodRef {
  reason: string;
  /** Slug links to a Food Page only when it is itself a canonical food. */
  linkable: boolean;
}

export interface NutritionCentreDiscovery {
  recentlyDiscovered: CentreFoodRef[];
  notUsedRecently: CentreFoodRef[];
  suggested: CentreDiscoverySuggestion[];
}

export interface CentreSimplyBetter {
  suggestion: string;
  why: string;
}

export interface NutritionCentre {
  available: boolean;
  overview: NutritionCentreOverview | null;
  journey: NutritionCentreJourney | null;
  categories: CentreCategoryProgress[];
  benefits: CentreBenefit[];
  trends: { mostFrequent: CentreTrendFood[] } | null;
  discovery: NutritionCentreDiscovery | null;
  simplyBetter: CentreSimplyBetter[];
}

const EMPTY: NutritionCentre = {
  available: false,
  overview: null,
  journey: null,
  categories: [],
  benefits: [],
  trends: null,
  discovery: null,
  simplyBetter: [],
};

// ── Lazy uplift rule index (reused canonical Nutrition Enhancement owner) ───────

let _ruleIndex: ReturnType<typeof buildRuleIndex> | null = null;
function getRuleIndex() {
  if (!_ruleIndex) _ruleIndex = buildRuleIndex(UPLIFT_RULES);
  return _ruleIndex;
}

// ── Assembler ──────────────────────────────────────────────────────────────────

const RECENT_WEEKS_GAP = 2; // "not cooked recently" = not in the last N planner weeks.
const TOP_N = 6;

export async function assembleNutritionCentre(
  householdId: number,
  now: Date = new Date(),
): Promise<NutritionCentre> {
  const planner = await fetchHouseholdPlannerFoods(householdId);

  // No planner history → the household sections have nothing to assemble.
  if (planner.enjoys.length === 0) return EMPTY;

  // Canonical food catalogue: slug → { name, category }.
  const foods = await listFoods();
  const bySlug = new Map(foods.map((f) => [f.slug, f]));

  // Resolve enjoyed food names → WS0 nutrients + benefits (reuse the registry's
  // canonical resolver; never re-derive knowledge here).
  const enjoyedKnown = planner.enjoys
    .map((slug) => bySlug.get(slug))
    .filter((f): f is NonNullable<typeof f> => !!f);
  const knowledge = await resolveIngredientsToKnowledgeSummary(
    enjoyedKnown.map((f) => f.name),
  );

  // ── Overview ────────────────────────────────────────────────────────────────
  //
  // NUTPLAN2 — dedup on the DIVERSITY GROUP, which is the only key a plant count
  // may use (`plantDiversityGroup`, plant-classifier.ts:231).
  //
  // This previously filtered `planner.enjoys` — a list of CANONICAL FOOD SLUGS —
  // with `isPlantIngredient` and took `.length`. That counts a slug, not a plant:
  // kale and cavolo nero are two slugs in one group, and every tomato variety is
  // its own slug. So the Nutrition Centre told households they had eaten more
  // distinct plants than they had, in the one figure the 30-plants target asks
  // them to act on — the exact error NUTPLAN1 fixed on the planner strip (D1),
  // surviving here because this site dedups by a third rule again.
  //
  // The number is published twice: as `overview.plantDiversity` ("including N
  // different plants" in the Nutrition Centre) and as a conversational milestone
  // through the notice engine. Both now count groups.
  const plantDiversity = new Set(
    planner.enjoys
      .map((slug) => {
        const f = bySlug.get(slug);
        return plantDiversityGroup(f ? f.name : slug.replace(/-/g, " "));
      })
      .filter((group): group is string => group !== null),
  ).size;

  const season = seasonForDate(now);
  const seasonSlugs = new Set(SEASON_SEED[season].map((s) => s.slug));
  const seasonalFoodsEnjoyed = planner.enjoys.filter((s) => seasonSlugs.has(s)).length;

  const overview: NutritionCentreOverview = {
    plantDiversity,
    foodDiversity: planner.enjoys.length,
    mealsCooked: planner.mealEntryCount,
    foodsDiscovered: enjoyedKnown.length,
    seasonalFoodsEnjoyed,
    seasonLabel: SEASON_LABEL[season],
  };

  // ── Nutrition Journey ─────────────────────────────────────────────────────────
  const nutrientSet = new Set<string>();
  const benefitSet = new Set<string>();
  for (const k of Object.values(knowledge)) {
    for (const n of k.nutrients) nutrientSet.add(n);
    for (const b of k.benefits) benefitSet.add(b);
  }

  const allCategories = await listFoodCategories(); // [{ category, count }]
  const enjoyedByCategory = new Map<string, number>();
  for (const f of enjoyedKnown) {
    enjoyedByCategory.set(f.category, (enjoyedByCategory.get(f.category) ?? 0) + 1);
  }
  const categoriesCovered = enjoyedByCategory.size;

  const journey: NutritionCentreJourney = {
    nutrientCoverage: nutrientSet.size,
    benefitCoverage: benefitSet.size,
    categoriesCovered,
    categoriesTotal: allCategories.length,
  };

  // ── Food category progress ────────────────────────────────────────────────────
  const categories: CentreCategoryProgress[] = allCategories.map((c) => ({
    category: c.category,
    enjoyed: enjoyedByCategory.get(c.category) ?? 0,
    total: c.count,
  }));

  // ── Health benefits (browsable) ───────────────────────────────────────────────
  // householdFoodCount = enjoyed foods whose WS0 benefits include this benefit.
  const benefitNameCount = new Map<string, number>();
  for (const k of Object.values(knowledge)) {
    const seen = Array.from(new Set(k.benefits));
    for (const b of seen) benefitNameCount.set(b, (benefitNameCount.get(b) ?? 0) + 1);
  }
  const allBenefits = await listHealthBenefits();
  const benefits: CentreBenefit[] = allBenefits
    .map((b) => ({
      slug: b.slug,
      name: b.name,
      icon: b.icon,
      householdFoodCount: benefitNameCount.get(b.name) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.householdFoodCount - a.householdFoodCount || a.name.localeCompare(b.name),
    );

  // ── Household trends (evidence only) ──────────────────────────────────────────
  const accList = planner.enjoys
    .map((slug) => {
      const acc = planner.bySlug.get(slug);
      const f = bySlug.get(slug);
      return acc && f
        ? {
            slug,
            name: f.name,
            appearances: acc.appearances,
            firstWeek: acc.firstWeek,
            lastWeek: acc.lastWeek,
          }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const mostFrequent: CentreTrendFood[] = [...accList]
    .sort((a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name))
    .slice(0, TOP_N)
    .map(({ slug, name, appearances }) => ({ slug, name, appearances }));

  const trends = mostFrequent.length > 0 ? { mostFrequent } : null;

  // ── Discovery journey ─────────────────────────────────────────────────────────
  const recentlyDiscovered: CentreFoodRef[] = [...accList]
    .sort((a, b) => b.firstWeek - a.firstWeek || a.name.localeCompare(b.name))
    .slice(0, TOP_N)
    .map(({ slug, name }) => ({ slug, name }));

  const maxLastWeek = accList.reduce((m, a) => Math.max(m, a.lastWeek), 0);
  const notUsedRecently: CentreFoodRef[] = accList
    .filter((a) => a.lastWeek <= maxLastWeek - RECENT_WEEKS_GAP)
    .sort((a, b) => a.lastWeek - b.lastWeek || a.name.localeCompare(b.name))
    .slice(0, TOP_N)
    .map(({ slug, name }) => ({ slug, name }));

  const enjoysSet = new Set(planner.enjoys);
  const discoveryResult = discover({
    household: { enjoys: planner.enjoys },
    types: ["broaden_horizons", "seasonal", "cuisine"],
    now,
    limitPerType: 4,
  });
  const seenSuggestion = new Set<string>();
  const suggested: CentreDiscoverySuggestion[] = [];
  for (const section of discoveryResult.sections) {
    for (const s of section.suggestions) {
      if (enjoysSet.has(s.slug) || seenSuggestion.has(s.slug)) continue;
      seenSuggestion.add(s.slug);
      suggested.push({
        slug: s.slug,
        name: s.name,
        reason: s.reason,
        linkable: bySlug.has(s.slug),
      });
      if (suggested.length >= TOP_N) break;
    }
    if (suggested.length >= TOP_N) break;
  }

  const discovery: NutritionCentreDiscovery | null =
    recentlyDiscovered.length > 0 || notUsedRecently.length > 0 || suggested.length > 0
      ? { recentlyDiscovered, notUsedRecently, suggested }
      : null;

  // ── Simply Better Choices (validated Nutrition Enhancement, one or two) ────────
  const matches = matchUpliftRules(
    {
      mealName: "Your household kitchen",
      ingredients: enjoyedKnown.map((f) => f.name),
      dietTypes: [],
    },
    getRuleIndex(),
  );
  const simplyBetter: CentreSimplyBetter[] = [];
  for (const m of matches) {
    for (const s of m.suggestions ?? []) {
      const suggestion = upliftSuggestionText(s);
      simplyBetter.push({ suggestion, why: s.why });
      if (simplyBetter.length >= 2) break;
    }
    if (simplyBetter.length >= 2) break;
  }

  return {
    available: true,
    overview,
    journey,
    categories,
    benefits,
    trends,
    discovery,
    simplyBetter,
  };
}
