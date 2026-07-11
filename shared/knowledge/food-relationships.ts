// KNOW4 — the single composition of the food→fact relationship seed.
//
// KNOW2 composed the editorial and graduated halves into one array so the
// knowledge_* tables have exactly one writer again. That composition lived in
// `index.ts`, whose module graph also pulls in the food identity seed, the
// graduated identity seed and the sourced-claim pack (citation bodies, titles
// and URLs). `food-report-adapter.ts` is client-bundled, needs only the
// food→nutrient links, and — by design — is not permitted to render a benefit
// claim at all. Importing the whole index to reach one array would ship the
// citation pack to a browser that must never speak a claim.
//
// So the composition moves here, and `index.ts` re-exports it. This creates no
// store and no fact: it is the same merge of the same two owners, given one
// home that both the seed runner and the report adapter can reach. There is
// still exactly one place where "the unified relationship seed" is defined.
//
// ORDER IS MEANINGFUL, AND IT IS NOT `ranking`.
//   `ranking` is authored independently within each half — an editorial link
//   and a graduated link may both carry ranking 0 for the same food, because
//   neither author could see the other's list. Sorting the merged array by
//   `ranking` would therefore compare two sequences that were never on one
//   scale, and let a draft-authored link outrank a human-authored one. The
//   array order below is the honest ordering: editorial links first, in their
//   own rank order, then graduated links, in theirs. Consumers must preserve
//   array order and must not re-sort by `ranking`.

import type { InsertKnowledgeFoodNutrient, InsertKnowledgeFoodBenefit } from "../schema";
import { FOOD_NUTRIENTS, FOOD_BENEFITS } from "./relationships";
import { GRADUATED_FOOD_NUTRIENTS, GRADUATED_FOOD_BENEFITS } from "./graduated-relationships";

/**
 * Expand the compact editorial relationship maps into typed insert rows. Array
 * order becomes `ranking` (0 = most prominent). Confidence/evidence default to a
 * conservative "established"/"good" — these are editable per row later.
 */
function expandFoodNutrients(): InsertKnowledgeFoodNutrient[] {
  const rows: InsertKnowledgeFoodNutrient[] = [];
  for (const [foodSlug, nutrients] of Object.entries(FOOD_NUTRIENTS)) {
    nutrients.forEach((nutrientSlug, i) => {
      rows.push({ foodSlug, nutrientSlug, ranking: i, confidence: "established", source: "THA editorial" });
    });
  }
  return rows;
}

function expandFoodBenefits(): InsertKnowledgeFoodBenefit[] {
  const rows: InsertKnowledgeFoodBenefit[] = [];
  for (const [foodSlug, benefits] of Object.entries(FOOD_BENEFITS)) {
    benefits.forEach((benefitSlug, i) => {
      rows.push({ foodSlug, benefitSlug, ranking: i, evidenceStrength: "good", source: "THA editorial" });
    });
  }
  return rows;
}

// KNOW2 — editorial links first, then the graduated draft links. The graduated
// rows keep their own per-row `confidence` / `evidenceStrength` / `ranking`,
// which the compact editorial maps above cannot express (they hardcode
// "established"/"good"). One array, one writer, two honestly-labelled origins.
export const FOOD_NUTRIENT_SEED = [...expandFoodNutrients(), ...GRADUATED_FOOD_NUTRIENTS];
export const FOOD_BENEFIT_SEED = [...expandFoodBenefits(), ...GRADUATED_FOOD_BENEFITS];

/**
 * Group relationship rows by food slug, preserving array order (see the header:
 * editorial half first, then graduated). `validateKnowledgeSeed()` refuses a
 * duplicate (food, fact) pair, so no row is ever listed twice for one food.
 *
 * Returns a Map rather than a Record so a food slug can never collide with an
 * Object.prototype key.
 */
function groupByFood<T>(rows: readonly T[], foodOf: (r: T) => string, factOf: (r: T) => string): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const food = foodOf(row);
    const facts = grouped.get(food);
    if (facts) facts.push(factOf(row));
    else grouped.set(food, [factOf(row)]);
  }
  return grouped;
}

/** Food slug → its nutrient slugs, editorial first. The unified read model. */
export const FOOD_NUTRIENT_LINKS: ReadonlyMap<string, readonly string[]> = groupByFood(
  FOOD_NUTRIENT_SEED,
  (r) => r.foodSlug,
  (r) => r.nutrientSlug,
);

/** Food slug → its benefit slugs, editorial first. These are CLAIMS: a consumer
 *  may only render them through the Layer-2 evidence gate (PKC Phase 0). */
export const FOOD_BENEFIT_LINKS: ReadonlyMap<string, readonly string[]> = groupByFood(
  FOOD_BENEFIT_SEED,
  (r) => r.foodSlug,
  (r) => r.benefitSlug,
);
