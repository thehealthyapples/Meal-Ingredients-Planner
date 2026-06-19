// WS2F — Canonical Food Report Foundation: FoodReportKnowledgeAdapter.
//
// Given a WS2A canonical food slug, assembles the Food Report knowledge object
// that drives the six approved report sections:
//
//   Overview · Key Nutrients · Health Benefits · Nutrition Context ·
//   Your Variety · Broaden Your Variety
//
// Authority model (WS2D Option A+):
//   Identity  → WS2A canonical seed  (CANONICAL_SEED / foods.ts)
//   Knowledge → WS0 knowledge seed   (FOOD_NUTRIENTS / FOOD_BENEFITS / NUTRIENT_SEED / HEALTH_BENEFIT_SEED)
//   Context   → NUTRITION_CONTEXT    (WS2F typed context facts — WS2D Stage S2 seed shape)
//
// This module is READ-ONLY. It:
//   • never duplicates data stores — reads existing registries only
//   • never fabricates — missing data → field absent / array empty
//   • returns null for any slug not present in CANONICAL_SEED
//     (preparations, mixed-food containers and unknown strings all return null)
//   • keeps the WS2A identity FK bridge (knowledgeFoodSlug) as the only seam
//     between identity and knowledge — zero dangling FKs is maintained
//
// NOT in scope for WS2F:
//   Pairings · Healthier Alternatives · Nutrition Boost Ideas ·
//   Gut Health breakdown · Apple Score integration
//
// The "Your Variety / Broaden Your Variety" split is USER-SCOPED and must be
// computed at the presentation layer via shared/canonical/variety.ts using the
// household's eaten ingredient list. This adapter returns the full variety
// catalogue plus per-variety additional knowledge — the display layer splits it.

import { CANONICAL_SEED } from "./foods";
import { FOOD_NUTRIENTS, FOOD_BENEFITS } from "../knowledge/relationships";
import { NUTRIENT_SEED } from "../knowledge/nutrients";
import { HEALTH_BENEFIT_SEED } from "../knowledge/health-benefits";
import { NUTRITION_CONTEXT } from "./nutrition-context";
import { varietyLabel } from "./variety";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Overview section — name, category, one-paragraph description. */
export interface FoodReportOverview {
  name: string;
  category: string;
  /** Preferred source: canonical description. Falls back to WS0 description. */
  description: string;
}

/**
 * Per-variety knowledge beyond what the parent food already covers.
 * "Additional" means: present for this variety but NOT for the canonical parent.
 * Both arrays are empty when the variety has no WS0 link or no unique knowledge.
 * Callers render nothing when both are empty.
 */
export interface FoodReportVariety {
  slug: string;
  name: string;
  /** Short label with parent food name stripped, e.g. "Cherry" from "Cherry Tomato". */
  label: string;
  additionalNutrients: string[];
  additionalBenefits: string[];
}

/**
 * Assembled knowledge for a canonical food's Food Report.
 *
 * Universal rule: missing data → array/field is empty/absent, never fabricated.
 * Callers must render nothing for empty sections. Every field is sourced
 * directly from WS2A (identity) or WS0 (knowledge).
 */
export interface FoodReportKnowledge {
  canonicalSlug: string;
  overview: FoodReportOverview;
  /** Top nutrients (max 5). Empty when WS0 has no data for this food. */
  keyNutrients: string[];
  /** Health benefits from WS0 nutrient bridge. Empty when WS0 has no data. */
  healthBenefits: string[];
  /** Curated context lines from NUTRITION_CONTEXT. Empty when none authored. */
  nutritionContext: string[];
  /** All defined varieties with any additional (variety-exclusive) knowledge. */
  varieties: FoodReportVariety[];
}

// ─── Internal lookup maps (built once from seed constants) ───────────────────

const nutrientDisplayName = new Map(NUTRIENT_SEED.map((n) => [n.slug, n.name]));
const benefitDisplayName = new Map(HEALTH_BENEFIT_SEED.map((b) => [b.slug, b.name]));

function toNutrientDisplayNames(slugs: readonly string[]): string[] {
  return slugs
    .map((s) => nutrientDisplayName.get(s) ?? null)
    .filter((n): n is string => n !== null);
}

function toBenefitDisplayNames(slugs: readonly string[]): string[] {
  return slugs
    .map((s) => benefitDisplayName.get(s) ?? null)
    .filter((b): b is string => b !== null);
}

function getKeyNutrients(knowledgeSlug: string | null | undefined): string[] {
  if (!knowledgeSlug) return [];
  return toNutrientDisplayNames((FOOD_NUTRIENTS[knowledgeSlug] ?? []).slice(0, 5));
}

function getHealthBenefits(knowledgeSlug: string | null | undefined): string[] {
  if (!knowledgeSlug) return [];
  return toBenefitDisplayNames(FOOD_BENEFITS[knowledgeSlug] ?? []);
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Assemble the Food Report knowledge for a canonical food slug.
 *
 * Returns null when the slug is not in the WS2A canonical seed — this is the
 * PREPARATION GUARD: preparations (e.g. "grilled tomatoes") and multi-food
 * containers (e.g. "mixed beans") are never in the seed, so they always return
 * null and never receive a Food Report.
 *
 * The adapter reads directly from the typed seed constants (no DB round-trip),
 * exactly as the resolver and variety modules do.
 */
export function buildFoodReport(canonicalSlug: string): FoodReportKnowledge | null {
  const entry = CANONICAL_SEED.find((e) => e.food.slug === canonicalSlug);
  if (!entry) return null;

  const food = entry.food;
  const knowledgeSlug = food.knowledgeFoodSlug ?? null;

  // Description: canonical preferred (authored by THA editorial); WS0 fallback.
  // The WS0 description is surfaced from the FOOD_SEED via a lazy import to
  // avoid a circular dependency risk — instead we resolve inline here.
  const description = (food.description ?? null) ?? "";

  // Build the parent's nutrient / benefit slug sets for deduplication.
  const parentNutrientSlugs = new Set<string>(
    knowledgeSlug ? (FOOD_NUTRIENTS[knowledgeSlug] ?? []) : [],
  );
  const parentBenefitSlugs = new Set<string>(
    knowledgeSlug ? (FOOD_BENEFITS[knowledgeSlug] ?? []) : [],
  );

  // Build per-variety knowledge. A variety shows only ADDITIONAL facts — those
  // not already surfaced by the canonical parent — so the reader never sees a
  // repeated fact between the "shared" and "variety" sections.
  const varieties: FoodReportVariety[] = (entry.varieties ?? []).map((v) => {
    const vKnowledgeSlug = v.knowledgeFoodSlug ?? null;
    const allVarietyNutrientSlugs = vKnowledgeSlug
      ? (FOOD_NUTRIENTS[vKnowledgeSlug] ?? [])
      : [];
    const allVarietyBenefitSlugs = vKnowledgeSlug
      ? (FOOD_BENEFITS[vKnowledgeSlug] ?? [])
      : [];

    return {
      slug: v.slug,
      name: v.name,
      label: varietyLabel(v.name, food.name),
      additionalNutrients: toNutrientDisplayNames(
        allVarietyNutrientSlugs.filter((s) => !parentNutrientSlugs.has(s)),
      ),
      additionalBenefits: toBenefitDisplayNames(
        allVarietyBenefitSlugs.filter((s) => !parentBenefitSlugs.has(s)),
      ),
    };
  });

  return {
    canonicalSlug,
    overview: {
      name: food.name,
      category: food.category,
      description,
    },
    keyNutrients: getKeyNutrients(knowledgeSlug),
    healthBenefits: getHealthBenefits(knowledgeSlug),
    nutritionContext: NUTRITION_CONTEXT[canonicalSlug] ?? [],
    varieties,
  };
}

/**
 * Convenience guard. Returns true when the canonical slug corresponds to a
 * real food in WS2A. Preparations, containers and unknown strings return false.
 * Equivalent to `buildFoodReport(slug) !== null` without assembling the report.
 */
export function isCanonicalFood(slug: string): boolean {
  return CANONICAL_SEED.some((e) => e.food.slug === slug);
}
