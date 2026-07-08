// WS2A — Canonical Resolver.
//
//   free text  →  canonical food  →  optional variety  →  diversity group
//
// Pure and deterministic: it resolves against the editorial SEED (the same
// source the DB is seeded from), so it is usable in tests and in shadow mode
// with no database round-trip. Nothing here mutates state or reads production
// tables — it is read-only interpretation.
//
// Resolution is exact-key, never substring: a string resolves to AT MOST one
// canonical food (the same guarantee the UNIQUE alias_key column enforces in
// the DB). If the seed ever produced two foods for one key, buildCanonicalIndex
// records it as a conflict and validateCanonicalSeed refuses to seed.
import { normalizeIngredientKey, singularizeIngredientKey } from "../normalize";
import { CANONICAL_SEED, type AliasType } from "./foods";

export type ResolutionMatchType = "canonical" | "variety" | "alias" | "unknown" | "ambiguous";

export interface CanonicalResolution {
  input: string;
  normalizedKey: string;
  matched: boolean;
  matchType: ResolutionMatchType;
  canonicalSlug: string | null;
  canonicalName: string | null;
  varietySlug: string | null;
  varietyName: string | null;
  diversityGroupSlug: string | null;
  aliasType: AliasType | null;
  // The knowledge_food identity this canonical food is linked to, when one is
  // declared on the seed (NK6I). Additive: lets identity-bearing consumers (e.g.
  // the canonical-food importer) map a resolved canonical food back to the single
  // knowledge_food identity WITHOUT a second resolver. Null when the canonical
  // food has no linked knowledge_food.
  knowledgeFoodSlug: string | null;
}

interface IndexTarget {
  canonicalSlug: string;
  canonicalName: string;
  diversityGroupSlug: string | null;
  knowledgeFoodSlug: string | null;
  varietySlug: string | null;
  varietyName: string | null;
  matchType: "canonical" | "variety" | "alias";
  aliasType: AliasType | null;
}

export interface CanonicalIndex {
  byKey: Map<string, IndexTarget>;
  // Keys that resolved to more than one DISTINCT canonical food during build.
  conflicts: { key: string; foods: string[] }[];
}

// "cherry-tomato" → "cherry tomato"
function slugToKey(slug: string): string {
  return normalizeIngredientKey(slug.replace(/-/g, " "));
}

let cachedIndex: CanonicalIndex | null = null;

/**
 * Build the resolution index from the editorial seed. Records any key that two
 * different canonical foods both claim (a forked identity) as a conflict rather
 * than silently overwriting — that list is the anti-fork integrity check.
 */
export function buildCanonicalIndex(): CanonicalIndex {
  const byKey = new Map<string, IndexTarget>();
  const conflicts: { key: string; foods: string[] }[] = [];

  const add = (key: string, target: IndexTarget) => {
    if (!key) return;
    const existing = byKey.get(key);
    if (existing) {
      // Same food re-stating the same key (e.g. name == slugToKey) is harmless.
      if (existing.canonicalSlug !== target.canonicalSlug) {
        conflicts.push({ key, foods: [existing.canonicalSlug, target.canonicalSlug] });
      }
      return; // first writer wins; conflict (if any) is recorded
    }
    byKey.set(key, target);
  };

  for (const entry of CANONICAL_SEED) {
    const { food } = entry;
    const base = {
      canonicalSlug: food.slug,
      canonicalName: food.name,
      diversityGroupSlug: food.diversityGroupSlug ?? null,
      knowledgeFoodSlug: food.knowledgeFoodSlug ?? null,
    };

    // Canonical identity: name + slug.
    const canonicalTarget: IndexTarget = { ...base, varietySlug: null, varietyName: null, matchType: "canonical", aliasType: null };
    add(normalizeIngredientKey(food.name), canonicalTarget);
    add(slugToKey(food.slug), canonicalTarget);

    // Varieties: name + slug. Variety inherits the parent's diversity group.
    for (const v of entry.varieties ?? []) {
      const varietyTarget: IndexTarget = { ...base, knowledgeFoodSlug: (v as { knowledgeFoodSlug?: string | null }).knowledgeFoodSlug ?? base.knowledgeFoodSlug, varietySlug: v.slug, varietyName: v.name, matchType: "variety", aliasType: null };
      add(normalizeIngredientKey(v.name), varietyTarget);
      add(slugToKey(v.slug), varietyTarget);
    }

    // Aliases.
    for (const a of entry.aliases ?? []) {
      const aliasTarget: IndexTarget = { ...base, varietySlug: null, varietyName: null, matchType: "alias", aliasType: a.aliasType };
      add(normalizeIngredientKey(a.alias), aliasTarget);
    }
  }

  return { byKey, conflicts };
}

function getIndex(): CanonicalIndex {
  if (!cachedIndex) cachedIndex = buildCanonicalIndex();
  return cachedIndex;
}

// Candidate normalised forms to try, in priority order. Faithful first (the raw
// normalised key), then plural→singular forms so "cherry tomatoes" can reach the
// "cherry tomato" variety and "shiitake mushrooms" the "shiitake mushroom" one.
function inputVariants(norm: string): string[] {
  const out: string[] = [norm];
  const push = (s: string) => { if (s && !out.includes(s)) out.push(s); };

  push(singularizeIngredientKey(norm));

  const words = norm.split(" ");
  const last = words[words.length - 1];
  if (last.length > 3 && last.endsWith("es")) push([...words.slice(0, -1), last.slice(0, -2)].join(" "));
  if (last.length > 2 && last.endsWith("s")) push([...words.slice(0, -1), last.slice(0, -1)].join(" "));

  return out;
}

const UNRESOLVED = (input: string, key: string): CanonicalResolution => ({
  input, normalizedKey: key, matched: false, matchType: "unknown",
  canonicalSlug: null, canonicalName: null, varietySlug: null, varietyName: null,
  diversityGroupSlug: null, aliasType: null, knowledgeFoodSlug: null,
});

/**
 * Resolve free text to a canonical food (+ optional variety + diversity group).
 * Returns an UNRESOLVED result (matchType "unknown") when nothing matches —
 * never throws, never invents an identity.
 */
export function resolveCanonicalFood(input: string): CanonicalResolution {
  const key = normalizeIngredientKey(input ?? "");
  if (!key) return UNRESOLVED(input, key);

  const { byKey } = getIndex();
  for (const candidate of inputVariants(key)) {
    const hit = byKey.get(candidate);
    if (hit) {
      return {
        input,
        normalizedKey: key,
        matched: true,
        matchType: hit.matchType,
        canonicalSlug: hit.canonicalSlug,
        canonicalName: hit.canonicalName,
        varietySlug: hit.varietySlug,
        varietyName: hit.varietyName,
        diversityGroupSlug: hit.diversityGroupSlug,
        aliasType: hit.aliasType,
        knowledgeFoodSlug: hit.knowledgeFoodSlug,
      };
    }
  }
  return UNRESOLVED(input, key);
}
