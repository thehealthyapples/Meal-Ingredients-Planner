/**
 * capability-composition.ts — INT42
 * ===================================
 * The Conversation Gateway's SEQUENTIAL composition seam: a pure function
 * that derives a second, DEPENDENT capability query from a first
 * capability's already-computed result — the "Meals → Uplift → Food
 * Intelligence" chain INT42 demonstrates for "help make this meal
 * healthier."
 *
 * WHY THIS EXISTS SEPARATELY FROM THE COMPOUND MATCHERS (pattern-intent-
 * resolver.ts, INT33): a compound matcher can only fire capabilities whose
 * PARAMETERS are derivable from the utterance alone (parallel composition —
 * "Level 1"). It cannot ask "why is the ingredient Uplift just suggested
 * grounded for that nutrient?", because Uplift hasn't run yet at resolve()
 * time (the resolver may not call intelligencePlatform.handle() or read
 * storage — see intent-resolver.ts's header). This module is the "Level 2"
 * seam: it runs AFTER the first wave of capability queries has already
 * produced real data, and decides whether a second, dependent query is worth
 * asking.
 *
 * SCOPE — deliberately ONE named chain, not a general orchestration planner.
 * A general "any capability's output may parameterise any other capability's
 * input" planner is real future work (see docs/implementation/
 * INT42_CAPABILITY_COMPOSITION_FOUNDATION.md, "Remaining orchestration
 * gaps") — building it now would be new engine machinery speculatively, with
 * no second consumer to prove it against yet. This module is intentionally
 * as small as the one chain it serves.
 *
 * HARD BOUNDARIES (mirrors every other conversation/*.ts seam module —
 * companion-guidance.ts, companion-enrichment.ts):
 *  - PURE. No I/O of its own. The gateway supplies the first wave's already-
 *    fetched, already-typed result; this module only decides WHAT to ask
 *    next and HOW to shape its parameters.
 *  - NO FABRICATION. A first-wave result with nothing groundable to derive
 *    from yields no second query — never a guessed parameter (Principle 6).
 *  - NO NEW TAXONOMY INVENTED. The NutritionTag → Food Intelligence slug
 *    table below is a narrow, evidence-checked SUBSET: only tags with a
 *    real, unambiguous entry in the Food Knowledge Registry
 *    (shared/knowledge/nutrients.ts, shared/knowledge/health-benefits.ts)
 *    are mapped. Every unmapped tag ('protein' — deliberately left unmapped:
 *    the 'protein' uplift tag is a coarse planner signal we do not yet route to
 *    a food-intelligence query, an editorial gap not a missing slug (NK6M made
 *    `protein` the single canonical nutrient identity); 'antioxidant' — the
 *    registry only has named phytonutrients, no generic "antioxidants" slug;
 *    'micronutrient', 'resistant-starch', 'fermented', 'wholefood-swap') is an
 *    honest gap, never a guessed slug.
 */

import type { IntentVerb } from "../types.js";
import type { UpliftMatchResult, NutritionTag } from "../../lib/uplift-types.js";

/** A single dependent capability query this module has decided is worth asking. */
export interface DerivedQuery {
  readonly capability: string;
  readonly verb: IntentVerb;
  readonly parameters: Readonly<Record<string, unknown>>;
}

const NUTRITION_TAG_TO_FOOD_INTELLIGENCE: Readonly<
  Partial<Record<NutritionTag, { scope: "nutrient" | "benefit"; slug: string }>>
> = {
  fibre: { scope: "nutrient", slug: "fibre" },
  "healthy-fat": { scope: "nutrient", slug: "unsaturated-fats" },
  "gut-diversity": { scope: "benefit", slug: "gut-health" },
};

/** Slugify an ingredient name the same way toSlug() does in pattern-intent-resolver.ts. */
function toFoodSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Given the Uplift capability's own already-computed suggestions for one
 * meal (never re-matched here — this function performs no matching of its
 * own), derive a single Food Intelligence `explain` query for the FIRST
 * suggestion whose nutrition tag has a grounded registry mapping: "why is
 * <ingredient> a good source of <nutrient/benefit>?", cited from the Food
 * Knowledge Registry rather than restating Uplift's own static copy.
 *
 * Returns null when Uplift produced no suggestions, or when none of its
 * matched rules' tags have a grounded mapping — an honest gap, never a
 * guessed slug or a fabricated food-intelligence call.
 */
export function deriveFoodIntelligenceExplainFromUplift(
  matches: readonly UpliftMatchResult[],
): DerivedQuery | null {
  for (const match of matches) {
    const suggestion = match.suggestions[0];
    if (!suggestion) continue;
    for (const tag of match.nutritionTags) {
      const mapped = NUTRITION_TAG_TO_FOOD_INTELLIGENCE[tag];
      if (!mapped) continue;
      const foodSlug = toFoodSlug(suggestion.ingredient);
      if (!foodSlug) continue;
      return {
        capability: "food-intelligence",
        verb: "explain",
        parameters: { scope: mapped.scope, slug: mapped.slug, foodSlug },
      };
    }
  }
  return null;
}
