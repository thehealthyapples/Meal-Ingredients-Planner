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
  InsertKnowledgeNutrientBenefit,
} from "../schema";
import { FOOD_SEED, EDITORIAL_FOOD_SEED } from "./foods";
import { NUTRIENT_SEED } from "./nutrients";
import { HEALTH_BENEFIT_SEED } from "./health-benefits";
import { FOOD_NUTRIENTS, FOOD_BENEFITS, NUTRIENT_BENEFITS } from "./relationships";
import { NUTRIENT_BENEFIT_SOURCES } from "./claim-sources";
import { FOOD_NUTRIENT_SOURCES } from "./composition-sources";
import { validateSourceRef } from "./evidence";
// KNOW2 — the draft-authored half of the seed, promoted out of the retired
// second writer (the NK6D importer, now the write-free canonical-foods-gate.ts).
// Composed with the editorial half in ./food-relationships so the knowledge_*
// tables have exactly one writer again.
import { GRADUATED_FOOD_SEED, GRADUATED_FOOD_SOURCE } from "./graduated-foods";
// KNOW4 — the composition moved to ./food-relationships so the client-bundled
// food report adapter can reach the unified links without importing the
// sourced-claim pack. This module re-exports it; it is not a second copy.
import { FOOD_NUTRIENT_SEED, FOOD_BENEFIT_SEED } from "./food-relationships";

export { FOOD_SEED, EDITORIAL_FOOD_SEED, NUTRIENT_SEED, HEALTH_BENEFIT_SEED };
export { GRADUATED_FOOD_SEED, GRADUATED_FOOD_SOURCE } from "./graduated-foods";
export { GRADUATED_FOOD_NUTRIENTS, GRADUATED_FOOD_BENEFITS } from "./graduated-relationships";
export { FOOD_NUTRIENTS, FOOD_BENEFITS, NUTRIENT_BENEFITS };
export {
  FOOD_NUTRIENT_SEED,
  FOOD_BENEFIT_SEED,
  FOOD_NUTRIENT_LINKS,
  FOOD_BENEFIT_LINKS,
} from "./food-relationships";
export { NUTRIENT_BENEFIT_SOURCES, SOURCED_LAUNCH_BENEFITS } from "./claim-sources";
// KNOW5 — the composition edge's citation pack. Deliberately NOT re-exported
// through ./food-relationships: that module is client-bundled and must not ship
// citations for claims the browser may never speak.
export {
  FOOD_NUTRIENT_SOURCES,
  FOOD_NUTRIENT_SOURCE_BY_PAIR,
  attachCompositionSources,
  type SourcedFoodNutrientClaim,
} from "./composition-sources";
export * from "./evidence";
// GOV2 Canonical Alias Principle — the single shared vocabulary resolver.
export * from "./canonical-vocabulary-resolver";

const foodSlugs = new Set(FOOD_SEED.map((f) => f.slug));
const nutrientSlugs = new Set(NUTRIENT_SEED.map((n) => n.slug));
const benefitSlugs = new Set(HEALTH_BENEFIT_SEED.map((b) => b.slug));

// PKC Phase 0: merge the sourced claim pack (claim-sources.ts) into the
// expanded rows. Sourced pairs carry sourceRefs + evidenceStrength
// "established"; everything else stays an unsourced editorial candidate
// (sourceRefs [] → never rendered, per the Layer-2 gate in evidence.ts).
// reviewedAt is deliberately never written here — sign-off is a human gate.
function expandNutrientBenefits(): InsertKnowledgeNutrientBenefit[] {
  const sourcesByPair = new Map(
    NUTRIENT_BENEFIT_SOURCES.map((s) => [`${s.nutrientSlug}→${s.benefitSlug}`, s]),
  );
  const rows: InsertKnowledgeNutrientBenefit[] = [];
  for (const [nutrientSlug, benefits] of Object.entries(NUTRIENT_BENEFITS)) {
    benefits.forEach((benefitSlug, i) => {
      const sourced = sourcesByPair.get(`${nutrientSlug}→${benefitSlug}`);
      rows.push({
        nutrientSlug,
        benefitSlug,
        ranking: i,
        evidenceStrength: sourced ? sourced.evidenceStrength : "good",
        source: sourced ? sourced.sourceRefs[0].body : "THA editorial",
        sourceRefs: sourced ? sourced.sourceRefs : [],
      });
    });
  }
  return rows;
}

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

  // KNOW2 — one owner per fact, enforced rather than declared (Rule KC8).
  //
  // 1. A graduated draft may never re-mint an identity the editorial seed owns.
  //    That is a merge, and a merge is a human decision (GOV2 Rule 7). The
  //    dupCheck above would also catch it, but this names the actual fault.
  const editorialSlugs = new Set(EDITORIAL_FOOD_SEED.map((f) => f.slug));
  for (const f of GRADUATED_FOOD_SEED) {
    if (editorialSlugs.has(f.slug)) {
      problems.push(`graduated food "${f.slug}" collides with an editorial identity — a merge is a human decision, not a graduation`);
    }
    // 2. Draft-authored rows must never wear the human editorial stamp. This is
    //    the exact defect KNOW2 repaired: the importer left `source` to its
    //    column default, so AI-authored identities claimed "THA editorial".
    if (f.source !== GRADUATED_FOOD_SOURCE) {
      problems.push(`graduated food "${f.slug}" must carry source "${GRADUATED_FOOD_SOURCE}", not ${JSON.stringify(f.source)}`);
    }
  }

  // 3. No relationship pair may be written twice. Two rows for one (food, fact)
  //    pair means two owners of that fact, whichever half of the seed they sit
  //    in — and the DB's unique constraint would silently let the second win.
  const pairCheck = (label: string, pairs: string[]) => {
    const seen = new Set<string>();
    for (const p of pairs) {
      if (seen.has(p)) problems.push(`duplicate ${label} pair: ${p} — one owner per fact`);
      seen.add(p);
    }
  };
  pairCheck("food↔nutrient", FOOD_NUTRIENT_SEED.map((r) => `${r.foodSlug}→${r.nutrientSlug}`));
  pairCheck("food↔benefit", FOOD_BENEFIT_SEED.map((r) => `${r.foodSlug}→${r.benefitSlug}`));

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

  // PKC Phase 0 — the sourced claim pack may only CITE existing editorial
  // links, never create new ones, and every citation must clear Layer 1.
  const seenSourcedPairs = new Set<string>();
  for (const s of NUTRIENT_BENEFIT_SOURCES) {
    const pair = `${s.nutrientSlug}→${s.benefitSlug}`;
    if (seenSourcedPairs.has(pair)) problems.push(`claim-sources: duplicate entry for ${pair}`);
    seenSourcedPairs.add(pair);
    if (!(NUTRIENT_BENEFITS[s.nutrientSlug] ?? []).includes(s.benefitSlug)) {
      problems.push(`claim-sources: ${pair} is not an existing NUTRIENT_BENEFITS link — citations may not introduce new claims`);
    }
    if (s.sourceRefs.length === 0) problems.push(`claim-sources: ${pair} has no sourceRefs`);
    for (const ref of s.sourceRefs) {
      for (const p of validateSourceRef(ref)) problems.push(`claim-sources: ${pair}: ${p}`);
    }
  }

  // KNOW5 — the composition claim pack obeys the same two rules as the
  // nutrient↔benefit pack: it may only CITE existing food→nutrient links, never
  // create one, and every citation must clear Layer 1. A citation that invents a
  // link is an uncited claim wearing a source (finding F1, in a new disguise).
  const fnPairs = new Set(FOOD_NUTRIENT_SEED.map((r) => `${r.foodSlug}→${r.nutrientSlug}`));
  const seenCompositionPairs = new Set<string>();
  for (const s of FOOD_NUTRIENT_SOURCES) {
    const pair = `${s.foodSlug}→${s.nutrientSlug}`;
    if (seenCompositionPairs.has(pair)) problems.push(`composition-sources: duplicate entry for ${pair}`);
    seenCompositionPairs.add(pair);
    if (!fnPairs.has(pair)) {
      problems.push(`composition-sources: ${pair} is not an existing food→nutrient link — citations may not introduce new claims`);
    }
    if (s.sourceRefs.length === 0) problems.push(`composition-sources: ${pair} has no sourceRefs`);
    for (const ref of s.sourceRefs) {
      for (const p of validateSourceRef(ref)) problems.push(`composition-sources: ${pair}: ${p}`);
    }
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
  // KNOW5 — how many composition links carry a citation. Everything else is an
  // uncited premise and can license no benefit chip.
  citedFoodNutrients: FOOD_NUTRIENT_SOURCES.length,
} as const;
