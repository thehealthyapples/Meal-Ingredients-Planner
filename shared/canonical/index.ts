// WS2A — Canonical Food Identity: editorial seed entry point.
//
// Flattens the structured CANONICAL_SEED into per-table insert arrays and ships
// a deterministic integrity check (validateCanonicalSeed) that the seed runner
// calls and REFUSES to seed on any violation — mirroring WS0's
// validateKnowledgeSeed. The canonical layer can therefore never be seeded into
// an inconsistent (forked / dangling) state.
import { normalizeIngredientKey } from "../normalize";
import { FOOD_SEED } from "../knowledge/foods";
import { DIVERSITY_GROUP_SEED } from "./diversity-groups";
import { CANONICAL_SEED, type AliasType } from "./foods";
import { buildCanonicalIndex } from "./resolver";

export { DIVERSITY_GROUP_SEED } from "./diversity-groups";
export { CANONICAL_SEED } from "./foods";
export type { AliasType, CanonicalFoodSeed } from "./foods";
export {
  resolveCanonicalFood,
  buildCanonicalIndex,
  type CanonicalResolution,
  type ResolutionMatchType,
} from "./resolver";

// ── Flattened insert arrays (consumed by the seed runner) ─────────────────────

export const CANONICAL_FOOD_SEED = CANONICAL_SEED.map((e) => e.food);

export interface FoodVarietySeedRow {
  canonicalFoodSlug: string;
  slug: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface CanonicalFoodAliasSeedRow {
  canonicalFoodSlug: string;
  alias: string;
  aliasKey: string;
  aliasType: AliasType;
}

export const FOOD_VARIETY_SEED: FoodVarietySeedRow[] = CANONICAL_SEED.flatMap((e) =>
  (e.varieties ?? []).map((v, i) => ({
    canonicalFoodSlug: e.food.slug,
    slug: v.slug,
    name: v.name,
    description: v.description,
    displayOrder: v.displayOrder ?? i,
  })),
);

export const CANONICAL_FOOD_ALIAS_SEED: CanonicalFoodAliasSeedRow[] = CANONICAL_SEED.flatMap((e) =>
  (e.aliases ?? []).map((a) => ({
    canonicalFoodSlug: e.food.slug,
    alias: a.alias,
    aliasKey: normalizeIngredientKey(a.alias),
    aliasType: a.aliasType,
  })),
);

const ALIAS_TYPES: ReadonlySet<string> = new Set([
  "singular", "plural", "common_name", "brand", "misspelling", "form",
]);

/**
 * Referential-integrity + anti-fork check over the editorial seed. Returns a
 * list of human-readable problems (empty = clean).
 */
export function validateCanonicalSeed(): string[] {
  const problems: string[] = [];

  const groupSlugs = new Set(DIVERSITY_GROUP_SEED.map((g) => g.slug));
  const foodSlugs = new Set(CANONICAL_FOOD_SEED.map((f) => f.slug));
  const knowledgeSlugs = new Set(FOOD_SEED.map((f) => f.slug));

  const dupCheck = (label: string, slugs: string[]) => {
    const seen = new Set<string>();
    for (const s of slugs) {
      if (seen.has(s)) problems.push(`Duplicate ${label} slug: ${s}`);
      seen.add(s);
    }
  };
  dupCheck("diversity_group", DIVERSITY_GROUP_SEED.map((g) => g.slug));
  dupCheck("canonical_food", CANONICAL_FOOD_SEED.map((f) => f.slug));
  dupCheck("food_variety", FOOD_VARIETY_SEED.map((v) => v.slug));

  // Canonical foods → FKs.
  for (const f of CANONICAL_FOOD_SEED) {
    if (f.diversityGroupSlug && !groupSlugs.has(f.diversityGroupSlug)) {
      problems.push(`canonical_food "${f.slug}": unknown diversity_group "${f.diversityGroupSlug}"`);
    }
    if (f.knowledgeFoodSlug && !knowledgeSlugs.has(f.knowledgeFoodSlug)) {
      problems.push(`canonical_food "${f.slug}": unknown knowledge_food "${f.knowledgeFoodSlug}"`);
    }
  }

  // Varieties → parent FK.
  for (const v of FOOD_VARIETY_SEED) {
    if (!foodSlugs.has(v.canonicalFoodSlug)) {
      problems.push(`food_variety "${v.slug}": unknown parent canonical_food "${v.canonicalFoodSlug}"`);
    }
  }

  // Aliases → parent FK, valid type, and UNIQUE alias_key (the anti-fork lock).
  const seenAliasKeys = new Map<string, string>(); // key → owning food slug
  for (const a of CANONICAL_FOOD_ALIAS_SEED) {
    if (!foodSlugs.has(a.canonicalFoodSlug)) {
      problems.push(`canonical_food_alias "${a.alias}": unknown parent canonical_food "${a.canonicalFoodSlug}"`);
    }
    if (!ALIAS_TYPES.has(a.aliasType)) {
      problems.push(`canonical_food_alias "${a.alias}": invalid aliasType "${a.aliasType}"`);
    }
    if (!a.aliasKey) {
      problems.push(`canonical_food_alias "${a.alias}": empty alias_key after normalisation`);
      continue;
    }
    const owner = seenAliasKeys.get(a.aliasKey);
    if (owner && owner !== a.canonicalFoodSlug) {
      problems.push(`Duplicate alias_key "${a.aliasKey}" claimed by "${owner}" and "${a.canonicalFoodSlug}" (anti-fork violation)`);
    } else if (owner) {
      problems.push(`Duplicate alias_key "${a.aliasKey}" within "${a.canonicalFoodSlug}"`);
    }
    seenAliasKeys.set(a.aliasKey, a.canonicalFoodSlug);
  }

  // Resolver index conflicts: any single key two different foods both claim.
  const { conflicts } = buildCanonicalIndex();
  for (const c of conflicts) {
    problems.push(`Resolver key collision "${c.key}" between ${c.foods.join(" and ")} (one food, one meaning violation)`);
  }

  return problems;
}

export const CANONICAL_SEED_COUNTS = {
  diversityGroups: DIVERSITY_GROUP_SEED.length,
  canonicalFoods: CANONICAL_FOOD_SEED.length,
  varieties: FOOD_VARIETY_SEED.length,
  aliases: CANONICAL_FOOD_ALIAS_SEED.length,
} as const;
