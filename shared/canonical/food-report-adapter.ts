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
//   Knowledge → WS0 knowledge seed   (FOOD_NUTRIENT_LINKS / NUTRIENT_SEED)
//   Context   → NUTRITION_CONTEXT    (WS2F typed context facts — WS2D Stage S2 seed shape)
//   Benefits  → NOT HERE. See "Health benefits" below.
//
// This module is READ-ONLY. It:
//   • never duplicates data stores — reads existing registries only
//   • never fabricates — missing data → field absent / array empty
//   • returns null for any slug not present in CANONICAL_SEED
//     (preparations, mixed-food containers and unknown strings all return null)
//   • keeps the WS2A identity FK bridge (knowledgeFoodSlug) as the only seam
//     between identity and knowledge — zero dangling FKs is maintained
//
// KNOW4 — the knowledge it reads is now the UNIFIED seed. Before KNOW4 this
// adapter read the compact editorial maps (`FOOD_NUTRIENTS`), which describe
// only the 264 human-authored knowledge foods. The 346 graduated foods KNOW2
// promoted into the same declared owner were invisible to it, so the seven
// canonical foods KNOW3 bound to graduated knowledge surfaced nothing at all.
// It now reads `FOOD_NUTRIENT_LINKS` — the same two halves, composed once, by
// their owner. No fact is authored here and no store is added.
//
// Health benefits — why this adapter returns none.
//   A food→benefit link is a CLAIM. PKC Phase 0 (Rule KC8) admits a claim to a
//   user only when it clears the Layer-2 evidence gate: a valid `SourceRef`
//   AND a human `reviewedAt` sign-off. `reviewedAt` is a database column that
//   only a human sets (Rule KC9) — it exists nowhere in the seed, so no
//   seed-only, DB-free module can evaluate the gate. This adapter therefore
//   cannot know whether a benefit may be spoken, and so it never speaks one:
//   `healthBenefits` and every variety's `additionalBenefits` are always empty.
//   The one mouth for benefit claims is `getEvidenceBackedFoodReport()`
//   (server/lib/food-report-evidence.ts), which composes this report with the
//   gate. That was PKC2's stated contract; KNOW4 is where it becomes true.
//   This is also why the graduated benefit links are not read here: they are
//   AI-drafted candidates (`GRADUATED_FOOD_SOURCE`), the exact class of claim
//   the gate exists to hold back.
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
import { FOOD_NUTRIENT_LINKS } from "../knowledge/food-relationships";
import { NUTRIENT_SEED } from "../knowledge/nutrients";
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
  /** Always empty from this adapter — a claim it cannot gate. Populated only by
   *  `getEvidenceBackedFoodReport()`. See the "Health benefits" note above. */
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
  /** Top nutrients (max 5), editorial links before graduated ones. Empty when
   *  the food has no knowledge link, or the knowledge seed has no data for it. */
  keyNutrients: string[];
  /** Always empty from this adapter — a claim it cannot gate. Populated only by
   *  `getEvidenceBackedFoodReport()`. See the "Health benefits" note above. */
  healthBenefits: string[];
  /** Curated context lines from NUTRITION_CONTEXT. Empty when none authored. */
  nutritionContext: string[];
  /** All defined varieties with any additional (variety-exclusive) knowledge. */
  varieties: FoodReportVariety[];
}

// ─── Internal lookup maps (built once from seed constants) ───────────────────

const nutrientDisplayName = new Map(NUTRIENT_SEED.map((n) => [n.slug, n.name]));

/** Nutrient slugs a knowledge food links, in the seed's own order. A nutrient
 *  the seed no longer defines (retired vocabulary) has no display name and is
 *  dropped rather than rendered as its raw slug. */
function nutrientSlugsFor(knowledgeSlug: string | null | undefined): readonly string[] {
  if (!knowledgeSlug) return [];
  return FOOD_NUTRIENT_LINKS.get(knowledgeSlug) ?? [];
}

function toNutrientDisplayNames(slugs: readonly string[]): string[] {
  return slugs
    .map((s) => nutrientDisplayName.get(s) ?? null)
    .filter((n): n is string => n !== null);
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

  // Build the parent's nutrient slug set for deduplication.
  const parentNutrientSlugs = new Set<string>(nutrientSlugsFor(knowledgeSlug));

  // Build per-variety knowledge. A variety shows only ADDITIONAL facts — those
  // not already surfaced by the canonical parent — so the reader never sees a
  // repeated fact between the "shared" and "variety" sections.
  const varieties: FoodReportVariety[] = (entry.varieties ?? []).map((v) => {
    const allVarietyNutrientSlugs = nutrientSlugsFor(v.knowledgeFoodSlug);

    return {
      slug: v.slug,
      name: v.name,
      label: varietyLabel(v.name, food.name),
      additionalNutrients: toNutrientDisplayNames(
        allVarietyNutrientSlugs.filter((s) => !parentNutrientSlugs.has(s)),
      ),
      // A claim this module cannot gate. getEvidenceBackedFoodReport() fills it.
      additionalBenefits: [],
    };
  });

  return {
    canonicalSlug,
    overview: {
      name: food.name,
      category: food.category,
      description,
    },
    keyNutrients: toNutrientDisplayNames(nutrientSlugsFor(knowledgeSlug).slice(0, 5)),
    // A claim this module cannot gate. getEvidenceBackedFoodReport() fills it.
    healthBenefits: [],
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
