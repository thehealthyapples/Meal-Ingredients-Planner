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
import { LEADING_INGREDIENT_DESCRIPTORS } from "../ingredient-descriptors";
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
//
// KNOW3 — exported so `knowledge-binding.ts` matches canonical identities against
// knowledge identities through THIS normalisation and no other. A private variant
// list there would be a second normalisation step, which GOV2 Rule 5 forbids.
export function ingredientKeyVariants(norm: string): string[] {
  const out: string[] = [norm];
  const push = (s: string) => { if (s && !out.includes(s)) out.push(s); };

  push(singularizeIngredientKey(norm));

  const words = norm.split(" ");
  const last = words[words.length - 1];
  if (last.length > 3 && last.endsWith("es")) push([...words.slice(0, -1), last.slice(0, -2)].join(" "));
  if (last.length > 2 && last.endsWith("s")) push([...words.slice(0, -1), last.slice(0, -1)].join(" "));

  return out;
}

/**
 * NUT_VERIFY2 — candidate keys for FREE TEXT a person wrote, in priority order.
 *
 * This is `ingredientKeyVariants` (the identity variants, above) applied to the
 * faithful key and then to each progressively descriptor-peeled form of it:
 * "dried red lentils" → "red lentils" → (stop; "red" is not a descriptor).
 *
 * WHY THIS IS SEPARATE FROM `ingredientKeyVariants`, AND MUST STAY SEPARATE
 *
 * The two functions answer different questions and only one of them may peel:
 *
 *   · `ingredientKeyVariants` answers "what forms IS this identity?" and is
 *     used by `knowledge-binding.ts` to match canonical identities against
 *     knowledge identities (KNOW3). Peeling there is WRONG and was measured
 *     as such: with peeling folded into it, `smoked-cheese` reduced to
 *     `cheese`, `ground-coffee` to `coffee`, `baby-spinach` to `spinach` and
 *     `smoked-paprika` to `paprika` — so `validateCanonicalSeed()` began
 *     reporting ambiguous knowledge bindings for six real seed entries that
 *     are not ambiguous at all. Three suites went red.
 *
 *   · This function answers "what might a person have MEANT by this line?"
 *     and is used only by `resolveCanonicalFood`, the free-text entry point.
 *
 * Identity matching stays faithful; free text gets the wider net. Neither is
 * fuzzy and neither is substring: every candidate either equals a canonical
 * key exactly or matches nothing at all.
 *
 * Ordering guarantees, all pinned by `test-nut-verify2-descriptor-resolution.ts`:
 *   · the faithful key is ALWAYS first, so a descriptor that begins a real
 *     canonical name — "dried lentils", "ground cumin", "baby spinach",
 *     "tinned tomatoes", "rolled oats" — resolves at full length and is
 *     never reduced;
 *   · peeling stops at the first non-descriptor word, so only the leading run
 *     of descriptors is removed and the food itself is never touched;
 *   · COLOURS ARE NOT DESCRIPTORS — "red cabbage" and "black pepper" are their
 *     own canonical foods with their own diversity groups, distinct from
 *     "cabbage" and "pepper" (see `shared/ingredient-descriptors.ts`);
 *   · the last remaining word is never peeled, so a key is never reduced to
 *     nothing.
 */
export function freeTextIngredientKeyVariants(norm: string): string[] {
  const out: string[] = [];
  const push = (s: string) => { if (s && !out.includes(s)) out.push(s); };

  for (const v of ingredientKeyVariants(norm)) push(v);

  // A leading descriptor may be written plural — "2 x 400g tins chickpeas",
  // "3 cans tomatoes". The vocabulary holds singulars, and
  // `singularizeIngredientKey` addresses only a key's LAST word (it returns
  // "tins" unchanged), so a bare trailing "s" is tolerated here for the
  // MEMBERSHIP TEST alone. A word only ever matches if its singular is already
  // in the vocabulary, so this widens nothing beyond the declared descriptors —
  // and the key itself is never rewritten, only whole words dropped.
  const isDescriptor = (w: string) =>
    LEADING_INGREDIENT_DESCRIPTORS.has(w) ||
    (w.endsWith("s") && LEADING_INGREDIENT_DESCRIPTORS.has(w.slice(0, -1)));

  let words = norm.split(" ").filter(Boolean);
  while (words.length > 1 && isDescriptor(words[0])) {
    words = words.slice(1);
    for (const v of ingredientKeyVariants(words.join(" "))) push(v);
  }

  return out;
}

/** "cherry-tomato" → ["cherry tomato", …]. The identity keys a slug spells. */
export function slugKey(slug: string): string {
  return slugToKey(slug);
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
  // NUT_VERIFY2 — free text gets the descriptor-peeled candidate list. Identity
  // matching (knowledge-binding.ts) keeps `ingredientKeyVariants` and does not.
  for (const candidate of freeTextIngredientKeyVariants(key)) {
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
