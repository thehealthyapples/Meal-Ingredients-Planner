// WS0X.6 — Meal Detail Food Intelligence.
//
// Builds consolidated food intelligence for a meal's ingredients using
// ONLY existing WS0 data sources:
//   • WS0 nutrients + benefits (via resolveIngredientsToKnowledgeSummary)
//   • WS0X.5 food context: availability, peak_seasons, origin_region (FOOD_CONTEXT_SEED)
//   • WS8 discovery engine (discover()) for "you may also enjoy" hooks
//   • SEASON_SEED + seasonForDate() for seasonal highlights
//
// No new intelligence systems. No fabricated claims.
// Returns EMPTY when no WS0 coverage — callers hide the section gracefully.

import {
  resolveIngredientsToKnowledgeSummary,
  resolveIngredientSlugs,
  listFoods,
} from "./nutrition-knowledge-registry";
import { getFoodContext } from "../../shared/canonical/food-context";
import { SEASON_SEED, seasonForDate } from "../../shared/discovery/seasonal-map";
import { discover } from "../../shared/discovery/engine";
import { plantDiversityGroup } from "../../shared/canonical/plant-classifier";

// ── Display labels ────────────────────────────────────────────────────────────

const ORIGIN_LABELS: Record<string, string> = {
  "united-kingdom": "United Kingdom",
  "europe": "Europe",
  "mediterranean": "Mediterranean",
  "north-africa": "North Africa",
  "sub-saharan-africa": "Africa",
  "middle-east": "Middle East",
  "central-asia": "Central Asia",
  "south-asia": "South Asia",
  "east-asia": "East Asia",
  "southeast-asia": "Southeast Asia",
  "north-america": "North America",
  "central-america": "Central America",
  "south-america": "South America",
  "oceania": "Oceania",
  "global": "Worldwide",
};

// Origins too generic to surface (no informational value for UK users)
const SUPPRESS_ORIGINS = new Set(["global", "united-kingdom", "europe"]);

// Availability copy — only specialist/rare is worth surfacing
const AVAILABILITY_LABELS: Record<string, string> = {
  specialist: "Less common — check specialist stores",
  rare: "Rare — usually online or specialist",
};

// NUTPLAN2 — the hand-maintained PLANT_CATEGORIES set that used to live here is
// RETIRED (Principle 8). It was a second answer to "is this a plant?", written as
// six WS0 category strings, sitting beside the canonical owner
// (`plantDiversityGroup`, shared/canonical/plant-classifier.ts:231) that already
// owned the question — and the platform's own verification register had it
// flagged as an open violation (`pd-rival-owner`, publication-register.ts).
//
// It carried a second, quieter defect: it incremented once per resolved SLUG, so
// kale and cavolo nero counted as two plants and every tomato variety counted
// separately. Counting groups is the whole point of the 30-plants number.

// Nutrient priority for the "Why This Meal Is Great" chip — most notable first
const HIGHLIGHT_NUTRIENT_PRIORITY = [
  "Omega-3",
  "Vitamin D",
  "Vitamin B12",
  "Folate",
  "Iron",
  "Zinc",
  "Vitamin C",
  "Magnesium",
  "Dietary Fibre",
  "Fibre",
  "Potassium",
  "Calcium",
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IngredientIntelligence {
  raw: string;
  nutrients: string[];
  isSeasonal: boolean;
  seasonLabel?: string;
  origin?: string;
  availabilityNote?: string;
}

export interface MealFoodIntelligence {
  highlights: string[];
  nutrients: string[];
  benefits: string[];
  plantCount: number;
  seasonalIngredients: Array<{ name: string; season: string }>;
  origins: Array<{ ingredient: string; regionLabel: string }>;
  rareItems: Array<{ ingredient: string; availabilityLabel: string }>;
  discovery: Array<{ slug: string; name: string }>;
  perIngredient: IngredientIntelligence[];
}

const EMPTY: MealFoodIntelligence = {
  highlights: [],
  nutrients: [],
  benefits: [],
  plantCount: 0,
  seasonalIngredients: [],
  origins: [],
  rareItems: [],
  discovery: [],
  perIngredient: [],
};

// ── Builder ───────────────────────────────────────────────────────────────────

export async function buildMealFoodIntelligence(
  ingredients: string[],
): Promise<MealFoodIntelligence> {
  if (ingredients.length === 0) return EMPTY;

  const [knowledgeSummary, slugMap, allFoods] = await Promise.all([
    resolveIngredientsToKnowledgeSummary(ingredients),
    resolveIngredientSlugs(ingredients),
    listFoods(),
  ]);

  if (slugMap.size === 0) return EMPTY;

  const foodBySlug = new Map(allFoods.map((f) => [f.slug, f]));

  // Deduplicate nutrients + benefits across all matched ingredients
  const nutrientSet = new Set<string>();
  const benefitSet = new Set<string>();
  for (const { nutrients, benefits } of Object.values(knowledgeSummary)) {
    for (const n of nutrients) nutrientSet.add(n);
    for (const b of benefits) benefitSet.add(b);
  }
  const nutrients = Array.from(nutrientSet);
  const benefits = Array.from(benefitSet);

  // Current UK season
  const currentSeason = seasonForDate(new Date());
  const currentSeasonSlugs = new Set(SEASON_SEED[currentSeason].map((f) => f.slug));
  const seasonLabel = currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1);

  const seasonalIngredients: Array<{ name: string; season: string }> = [];
  const origins: Array<{ ingredient: string; regionLabel: string }> = [];
  const rareItems: Array<{ ingredient: string; availabilityLabel: string }> = [];
  const seenRegions = new Set<string>();
  // Distinct diversity GROUPS, not slugs — the canonical dedup key (NUTPLAN2).
  const plantGroups = new Set<string>();

  for (const [raw, slug] of Array.from(slugMap.entries())) {
    // Seasonal check
    if (currentSeasonSlugs.has(slug)) {
      const entry = SEASON_SEED[currentSeason].find((f) => f.slug === slug);
      if (entry) seasonalIngredients.push({ name: entry.name, season: seasonLabel });
    }

    // Plant food count — one entry per diversity group, via the canonical owner.
    const food = foodBySlug.get(slug);
    const group = plantDiversityGroup(food ? food.name : raw);
    if (group) plantGroups.add(group);

    // Food context
    const ctx = getFoodContext(slug);
    if (ctx) {
      // Origin — suppress generic regions; max 3 unique regions
      if (
        ctx.originRegion &&
        !SUPPRESS_ORIGINS.has(ctx.originRegion) &&
        !seenRegions.has(ctx.originRegion) &&
        origins.length < 3
      ) {
        const display = titleCase(raw);
        origins.push({ ingredient: display, regionLabel: ORIGIN_LABELS[ctx.originRegion] ?? ctx.originRegion });
        seenRegions.add(ctx.originRegion);
      }

      // Availability — only specialist/rare is worth mentioning
      const availLabel = AVAILABILITY_LABELS[ctx.availability];
      if (availLabel && rareItems.length < 2) {
        rareItems.push({ ingredient: titleCase(raw), availabilityLabel: availLabel });
      }
    }
  }

  // Discovery — try up to 3 slugs, return first that yields results
  const discovery: Array<{ slug: string; name: string }> = [];
  for (const slug of Array.from(slugMap.values()).slice(0, 3)) {
    try {
      const result = discover({
        food: slug,
        household: { enjoys: [] },
        types: ["similar"],
        limitPerType: 3,
      });
      const suggestions = result.sections.flatMap((s) => s.suggestions).slice(0, 3);
      if (suggestions.length > 0) {
        discovery.push(...suggestions.map((s) => ({ slug: s.slug, name: s.name })));
        break;
      }
    } catch {
      // Discovery is best-effort; move to next slug
    }
  }

  // Build "Why This Meal Is Great" highlights (up to 5 chips)
  const highlights: string[] = [];

  const plantCount = plantGroups.size;
  if (plantCount >= 2) {
    highlights.push(`Contains ${plantCount} plant food${plantCount !== 1 ? "s" : ""}`);
  }

  // Pick the most notable nutrient by priority
  const topNutrient =
    HIGHLIGHT_NUTRIENT_PRIORITY.find((n) => nutrientSet.has(n)) ?? nutrients[0];
  if (topNutrient) highlights.push(`Rich in ${topNutrient}`);

  if (benefits[0]) highlights.push(benefits[0]);

  if (seasonalIngredients.length > 0) {
    highlights.push(`${seasonalIngredients[0].name} in season now`);
  }

  // Build per-ingredient intelligence for inline display
  const perIngredient: IngredientIntelligence[] = [];
  for (const [raw, slug] of Array.from(slugMap.entries())) {
    const summary = knowledgeSummary[raw];
    const ctx = getFoodContext(slug);
    const isSeasonal = currentSeasonSlugs.has(slug);

    const intel: IngredientIntelligence = {
      raw,
      nutrients: summary ? summary.nutrients.slice(0, 3) : [],
      isSeasonal,
      seasonLabel: isSeasonal ? seasonLabel : undefined,
      origin:
        ctx?.originRegion && !SUPPRESS_ORIGINS.has(ctx.originRegion)
          ? (ORIGIN_LABELS[ctx.originRegion] ?? ctx.originRegion)
          : undefined,
      availabilityNote: ctx?.availability
        ? AVAILABILITY_LABELS[ctx.availability]
        : undefined,
    };

    if (intel.nutrients.length > 0 || intel.isSeasonal) {
      perIngredient.push(intel);
    }
  }

  return {
    highlights: highlights.slice(0, 5),
    nutrients,
    benefits,
    plantCount,
    seasonalIngredients,
    origins,
    rareItems,
    discovery,
    perIngredient,
  };
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
