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
import { FOOD_CONTEXT_SEED, validateFoodContext } from "./food-context";
import { buildCanonicalIndex } from "./resolver";
import { auditKnowledgeBindings } from "./knowledge-binding";

export { DIVERSITY_GROUP_SEED } from "./diversity-groups";
export { CANONICAL_SEED } from "./foods";
export type { AliasType, CanonicalFoodSeed } from "./foods";
export {
  FOOD_CONTEXT_SEED,
  getFoodContext,
  validateFoodContext,
  AVAILABILITY_LEVELS,
  AVAILABILITY_MODIFIERS,
  UK_SEASONS,
  ORIGIN_REGIONS,
  type AvailabilityLevel,
  type AvailabilityModifier,
  type UKSeasonSlug,
  type OriginRegion,
  type FoodContextSeed,
} from "./food-context";
export {
  resolveCanonicalFood,
  buildCanonicalIndex,
  ingredientKeyVariants,
  type CanonicalResolution,
  type ResolutionMatchType,
} from "./resolver";
// KNOW3 — canonical → knowledge food binding (audit only; owns no fact).
export {
  auditKnowledgeBindings,
  canonicalSeedBindingWarnings,
  resolveKnowledgeBinding,
  knowledgeFoodClaims,
  bindables,
  bindableKey,
  identityKeys,
  DEFERRED_KNOWLEDGE_BINDINGS,
  KNOWLEDGE_BINDING_COVERAGE,
  type KnowledgeBinding,
  type BindingAudit,
  type BindingContext,
  type Bindable,
  type BindableKey,
  type DeferredBinding,
} from "./knowledge-binding";

// ── Flattened insert arrays (consumed by the seed runner) ─────────────────────

// WS0X.5 — merge the per-food context (availability / peak_seasons / origin_region /
// modifiers) onto each canonical_food insert at seed-build time. This is what makes
// canonical_food the SINGLE runtime owner of food context: the authoring map in
// food-context.ts is folded in here, never read at runtime in parallel.
export const CANONICAL_FOOD_SEED = CANONICAL_SEED.map((e) => {
  const ctx = FOOD_CONTEXT_SEED[e.food.slug];
  if (!ctx) return e.food;
  return {
    ...e.food,
    availability: ctx.availability,
    availabilityModifiers: ctx.modifiers,
    peakSeasons: ctx.peakSeasons,
    originRegion: ctx.originRegion,
  };
});

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
 * WS0X.10A — Progressive Food Intelligence. Whether a canonical food MUST carry
 * food context (Level 2) to be seeded. Curated editorial foods do; foods that are
 * intentionally staged at Level 1 (imported catalogue tier, or draft status) do NOT —
 * for them context is optional enrichment that accretes later, never a visibility gate.
 *
 * Defaults match the DB column defaults (tier="canonical", status="active"), so a seed
 * food that sets neither is treated as curated. Behaviour is therefore UNCHANGED unless
 * a food is EXPLICITLY marked Level 1 — the existing spine keeps 100% context coverage.
 */
export function isContextRequired(food: { tier?: string | null; status?: string | null }): boolean {
  const tier = food.tier ?? "canonical";
  const status = food.status ?? "active";
  const isLevel1 = tier === "catalogue" || status === "draft";
  return !isLevel1;
}

/**
 * WS0X.10A — Non-fatal Level-1 context coverage gaps. Lists canonical foods that are
 * intentionally staged at Level 1 and do not yet carry food context. These are TRACKED
 * (never silent) so back-fill can be prioritised, but they never block the seed.
 */
export function canonicalSeedContextWarnings(): string[] {
  const warnings: string[] = [];
  for (const f of CANONICAL_FOOD_SEED) {
    if (!FOOD_CONTEXT_SEED[f.slug] && !isContextRequired(f)) {
      warnings.push(
        `canonical_food "${f.slug}": Level 1 (context pending) — availability/peak_seasons/origin_region not yet authored`,
      );
    }
  }
  return warnings;
}

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
    // NK6R — `family` is a self-reference by slug (no DB FK). Enforce it here so the
    // hierarchy can never be seeded dangling or self-parented.
    if (f.family) {
      if (f.family === f.slug) {
        problems.push(`canonical_food "${f.slug}": family points at itself`);
      } else if (!foodSlugs.has(f.family)) {
        problems.push(`canonical_food "${f.slug}": unknown family "${f.family}"`);
      }
    }
  }

  // NK6R — the family graph must be a forest, not a cycle. A cycle would make
  // "walk to the root identity" non-terminating for every consumer of the hierarchy.
  {
    const familyOf = new Map(CANONICAL_FOOD_SEED.map((f) => [f.slug, f.family ?? null] as const));
    const reported = new Set<string>();
    for (const start of CANONICAL_FOOD_SEED.map((f) => f.slug)) {
      const path: string[] = [];
      const seen = new Set<string>();
      let cur: string | null | undefined = start;
      while (cur && familyOf.has(cur) && !seen.has(cur)) {
        seen.add(cur);
        path.push(cur);
        cur = familyOf.get(cur);
      }
      // Landed back on a node already on this path (and it is not a clean root) = cycle.
      if (cur && seen.has(cur) && !reported.has(cur)) {
        for (const s of path) reported.add(s);
        problems.push(`canonical_food family cycle: ${[...path, cur].join(" → ")}`);
      }
    }
  }

  // NK6R — a food may not be BOTH a child of X and an alias of X. The whole point of
  // `family` is that a hierarchy is not an alias (GOV2 fail test 5); collapsing the two
  // would re-create the exact over-merge NK6Q was raised to undo.
  {
    const aliasOwner = new Map<string, string>(); // alias_key → owning food slug
    for (const a of CANONICAL_FOOD_ALIAS_SEED) aliasOwner.set(a.aliasKey, a.canonicalFoodSlug);
    for (const f of CANONICAL_FOOD_SEED) {
      if (!f.family) continue;
      for (const key of [normalizeIngredientKey(f.name), normalizeIngredientKey(f.slug.replace(/-/g, " "))]) {
        if (aliasOwner.get(key) === f.family) {
          problems.push(`canonical_food "${f.slug}": is a child of "${f.family}" AND aliased by it ("${key}") — a hierarchy is not an alias`);
        }
      }
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

  // WS0X.5 / WS0X.5A / WS0X.10A — Food context integrity (single-owner enforcement).
  // (a) Pre-staged context entries (slugs not yet in CANONICAL_SEED) are intentionally
  //     allowed — they are authored ahead of promotion so auto-tagging requires no
  //     manual step at promotion time. Orphan entries are NOT flagged as errors.
  // (b) WS0X.10A Progressive Food Intelligence: food context is OPTIONAL ENRICHMENT
  //     (Level 2), not a visibility gate. A curated editorial food (tier="canonical",
  //     status="active") MUST still carry context — so the existing spine keeps 100%
  //     coverage with no silent regression. A food that is intentionally staged at
  //     Level 1 (tier="catalogue" OR status="draft") MAY be seeded without context;
  //     that is a TRACKED coverage gap (see canonicalSeedContextWarnings()), never a
  //     fatal error, and context is NEVER fabricated to satisfy a gate.
  // (c) Whatever context IS present must be in the controlled vocabulary — UNCHANGED.
  //     A malformed context value still blocks the seed, preserving trust.
  for (const f of CANONICAL_FOOD_SEED) {
    const ctx = FOOD_CONTEXT_SEED[f.slug];
    if (!ctx) {
      if (isContextRequired(f)) {
        problems.push(`canonical_food "${f.slug}": missing food context (availability/peak_seasons/origin_region)`);
      }
      // Level-1 foods: missing context is a non-fatal, tracked coverage gap.
      continue;
    }
    problems.push(...validateFoodContext(f.slug, ctx));
  }

  // Resolver index conflicts: any single key two different foods both claim.
  const { conflicts } = buildCanonicalIndex();
  for (const c of conflicts) {
    problems.push(`Resolver key collision "${c.key}" between ${c.foods.join(" and ")} (one food, one meaning violation)`);
  }

  // KNOW3 — canonical → knowledge food binding. A canonical food that a knowledge
  // food of the same name exists for MUST declare `knowledgeFoodSlug`, and no two
  // canonical identities may bind the same knowledge food. An ambiguous match is
  // not guessed: it is refused here unless a human has recorded the reason in
  // DEFERRED_KNOWLEDGE_BINDINGS. This is the gate that makes a missed binding
  // unshippable — `canonical-foods-gate.ts` can only warn, because it runs before
  // the knowledge food it would bind to exists in the seed.
  problems.push(...auditKnowledgeBindings().problems);

  return problems;
}

export const CANONICAL_SEED_COUNTS = {
  diversityGroups: DIVERSITY_GROUP_SEED.length,
  canonicalFoods: CANONICAL_FOOD_SEED.length,
  varieties: FOOD_VARIETY_SEED.length,
  aliases: CANONICAL_FOOD_ALIAS_SEED.length,
} as const;

// WS0X.5 — food-context coverage over the editorial canonical foods. A dimension
// is "covered" when it carries a non-empty/known value (peakSeasons may legitimately
// be empty for year-round foods, so coverage there = "has a context record").
export const FOOD_CONTEXT_COVERAGE = (() => {
  const foods = CANONICAL_FOOD_SEED;
  const total = foods.length;
  let availability = 0, peakSeasons = 0, originRegion = 0, hasContext = 0;
  for (const f of foods) {
    const ctx = FOOD_CONTEXT_SEED[f.slug];
    if (!ctx) continue;
    hasContext += 1;
    if (ctx.availability) availability += 1;
    if (ctx.originRegion) originRegion += 1;
    if (ctx.peakSeasons.length > 0) peakSeasons += 1;
  }
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);
  return {
    total,
    hasContext,
    availability: { count: availability, pct: pct(availability) },
    originRegion: { count: originRegion, pct: pct(originRegion) },
    peakSeasonsNonEmpty: { count: peakSeasons, pct: pct(peakSeasons) },
  } as const;
})();
