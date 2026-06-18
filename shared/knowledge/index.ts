// WS0 — Nutrition Knowledge Registry: editorial seed data (single source of truth).
//
// These typed datasets are the human-curated, editable origin of the registry.
// The seed runner (server/seeds/seed-knowledge-registry.ts) upserts them into
// the knowledge_* tables. Nothing here makes medical claims or fabricates
// certainty — it is conservative, well-established editorial nutrition content.
import type {
  InsertKnowledgeFood,
  InsertKnowledgeNutrient,
  InsertKnowledgeHealthBenefit,
  InsertKnowledgeFoodNutrient,
  InsertKnowledgeFoodBenefit,
  InsertKnowledgeNutrientBenefit,
} from "../schema";
import { FOOD_SEED } from "./foods";
import { NUTRIENT_SEED } from "./nutrients";
import { HEALTH_BENEFIT_SEED } from "./health-benefits";
import { FOOD_NUTRIENTS, FOOD_BENEFITS, NUTRIENT_BENEFITS } from "./relationships";

export { FOOD_SEED, NUTRIENT_SEED, HEALTH_BENEFIT_SEED };
export { FOOD_NUTRIENTS, FOOD_BENEFITS, NUTRIENT_BENEFITS };

const foodSlugs = new Set(FOOD_SEED.map((f) => f.slug));
const nutrientSlugs = new Set(NUTRIENT_SEED.map((n) => n.slug));
const benefitSlugs = new Set(HEALTH_BENEFIT_SEED.map((b) => b.slug));

/**
 * Expand the compact relationship maps into typed insert rows. Array order
 * becomes `ranking` (0 = most prominent). Confidence/evidence default to a
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

function expandNutrientBenefits(): InsertKnowledgeNutrientBenefit[] {
  const rows: InsertKnowledgeNutrientBenefit[] = [];
  for (const [nutrientSlug, benefits] of Object.entries(NUTRIENT_BENEFITS)) {
    benefits.forEach((benefitSlug, i) => {
      rows.push({ nutrientSlug, benefitSlug, ranking: i, evidenceStrength: "good", source: "THA editorial" });
    });
  }
  return rows;
}

export const FOOD_NUTRIENT_SEED = expandFoodNutrients();
export const FOOD_BENEFIT_SEED = expandFoodBenefits();
export const NUTRIENT_BENEFIT_SEED = expandNutrientBenefits();

/**
 * Deterministic referential-integrity check over the editorial data. Returns a
 * list of human-readable problems (empty = clean). The seed runner calls this
 * and refuses to seed if there are dangling slugs, so the registry can never be
 * seeded into an inconsistent state.
 */
export function validateKnowledgeSeed(): string[] {
  const problems: string[] = [];

  const dupCheck = (label: string, slugs: string[]) => {
    const seen = new Set<string>();
    for (const s of slugs) {
      if (seen.has(s)) problems.push(`Duplicate ${label} slug: ${s}`);
      seen.add(s);
    }
  };
  dupCheck("food", FOOD_SEED.map((f) => f.slug));
  dupCheck("nutrient", NUTRIENT_SEED.map((n) => n.slug));
  dupCheck("benefit", HEALTH_BENEFIT_SEED.map((b) => b.slug));

  for (const r of FOOD_NUTRIENT_SEED) {
    if (!foodSlugs.has(r.foodSlug)) problems.push(`food↔nutrient: unknown food "${r.foodSlug}"`);
    if (!nutrientSlugs.has(r.nutrientSlug)) problems.push(`food↔nutrient: unknown nutrient "${r.nutrientSlug}" (food ${r.foodSlug})`);
  }
  for (const r of FOOD_BENEFIT_SEED) {
    if (!foodSlugs.has(r.foodSlug)) problems.push(`food↔benefit: unknown food "${r.foodSlug}"`);
    if (!benefitSlugs.has(r.benefitSlug)) problems.push(`food↔benefit: unknown benefit "${r.benefitSlug}" (food ${r.foodSlug})`);
  }
  for (const r of NUTRIENT_BENEFIT_SEED) {
    if (!nutrientSlugs.has(r.nutrientSlug)) problems.push(`nutrient↔benefit: unknown nutrient "${r.nutrientSlug}"`);
    if (!benefitSlugs.has(r.benefitSlug)) problems.push(`nutrient↔benefit: unknown benefit "${r.benefitSlug}" (nutrient ${r.nutrientSlug})`);
  }
  return problems;
}

export const KNOWLEDGE_SEED_COUNTS = {
  foods: FOOD_SEED.length,
  nutrients: NUTRIENT_SEED.length,
  healthBenefits: HEALTH_BENEFIT_SEED.length,
  foodNutrients: FOOD_NUTRIENT_SEED.length,
  foodBenefits: FOOD_BENEFIT_SEED.length,
  nutrientBenefits: NUTRIENT_BENEFIT_SEED.length,
} as const;
