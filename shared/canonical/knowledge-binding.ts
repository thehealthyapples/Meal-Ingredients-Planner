// KNOW3 — Canonical → Knowledge food binding.
//
//   canonical_food.knowledge_food_slug  →  knowledge_foods.slug
//
// Domain 2 (Canonical Food Identity, `shared/canonical/foods.ts`) owns this
// column. Domain 1 (Food Knowledge, `shared/knowledge/`) owns the identity it
// points at. This module owns NEITHER: it is a deterministic *auditor* that
// reads both declared owners and reports where a binding is missing, ambiguous,
// or duplicated. It writes nothing and it never invents a link.
//
// ── Why this exists ──────────────────────────────────────────────────────────
// `canonical-foods-gate.ts` reconciles an incoming draft identity against the
// canonical resolver, and blocks a draft that would fork an existing identity.
// Its `isForeignIdentity()` test reads `resolution.knowledgeFoodSlug` — so a
// canonical food whose binding is NULL is invisible to it:
//
//     resolveCanonicalFood("tomato")     → knowledgeFoodSlug "tomatoes"  (seen)
//     resolveCanonicalFood("grapefruit") → knowledgeFoodSlug null        (unseen)
//
// A draft named after an unbound canonical food therefore promotes cleanly, a
// knowledge identity is created, and nothing ever binds the two. That is how
// seven canonical foods came to sit beside a knowledge food of the same name
// with no link between them. This module is the standing check that closes it.
//
// ── What counts as evidence ──────────────────────────────────────────────────
// ONLY identity-to-identity name equality: the canonical food's own name/slug
// against the knowledge food's own name/slug, through the resolver's single
// normalisation (`ingredientKeyVariants`). Nothing else auto-binds.
//
// An ALIAS is never evidence of identity, in either direction. Canonical
// `pepper` (the bell pepper plant — all colours, one plant) and knowledge
// `red-pepper` share the alias "bell pepper"; an alias-tolerant matcher binds
// them, and the parent then claims the red variety's facts — a fabricated link
// AND a second claimant on a knowledge food the `red-pepper` VARIETY already
// owns. Aliases are used here for exactly one thing: detecting ambiguity.
//
// Everything the binder cannot decide is BLOCKED for a human, never guessed
// (Principle 6, GOV2 Rule 7). The block is recorded in
// `DEFERRED_KNOWLEDGE_BINDINGS` with a reason, so a deliberate non-binding is
// distinguishable from a forgotten one — and so it cannot rot: the audit
// re-derives every deferral and rejects one that no longer matches the data.
import { normalizeIngredientKey } from "../normalize";
import { FOOD_SEED } from "../knowledge/foods";
import { CANONICAL_SEED } from "./foods";
import { ingredientKeyVariants, slugKey } from "./resolver";

/** A canonical entity that may carry a binding: a food, or one of its varieties. */
export type BindableKind = "food" | "variety";

/** Qualified key for the deferral register — food and variety slugs are different key spaces. */
export type BindableKey = `${BindableKind}:${string}`;

export interface Bindable {
  kind: BindableKind;
  /** Slug within its own key space (canonical_food.slug or food_variety.slug). */
  slug: string;
  name: string;
  knowledgeFoodSlug: string | null;
  /** Parent canonical food slug; equals `slug` for a food. */
  foodSlug: string;
}

export type KnowledgeBinding =
  /** Exactly one knowledge food carries this identity's name, and nothing else claims it. */
  | { kind: "unique"; knowledgeFoodSlug: string; matchedOn: string }
  /**
   * A VARIETY whose name is a form of its parent's knowledge food ("cherry
   * tomato" is an alias of knowledge `tomatoes`, which canonical `tomato`
   * binds). It needs no binding of its own: `buildCanonicalIndex()` already
   * falls back to the parent's (`resolver.ts` — `v.knowledgeFoodSlug ?? base`).
   * A null here is inheritance, not a gap.
   */
  | { kind: "inherited"; from: string }
  /** The correct binding is not determined by the data. A human decides. */
  | { kind: "ambiguous"; reason: string; candidates: string[] }
  /** No knowledge food carries this name. An honest gap, not a defect. */
  | { kind: "none" };

export interface DeferredBinding {
  /** The candidates the audit must still see, sorted. A change here is a re-review. */
  candidates: string[];
  /** Why binding is refused. Never empty. */
  reason: string;
}

/**
 * Canonical identities that a knowledge food *names*, but which must NOT be
 * bound to it. Each entry is a human decision with a stated reason; the audit
 * verifies the ambiguity it describes still exists, and refuses a stale entry.
 *
 * This register is the "block ambiguous matches for human review" surface. It is
 * deliberately tiny — an entry is an admission that two owners disagree.
 */
export const DEFERRED_KNOWLEDGE_BINDINGS: Readonly<Partial<Record<BindableKey, DeferredBinding>>> = {
  // Knowledge `lentils` and knowledge `red-lentils` BOTH answer to "lentils"
  // (`red-lentils` carries it as an alias), so the string names two identities —
  // a GOV2 Rule 3 conflict inside the knowledge seed, not a binding to pick.
  //
  // Binding the parent would also give one fact two owners: knowledge `lentils`
  // declares aliases "red lentils" / "green lentils" / "puy lentils", the exact
  // identities canonical `lentils`' four VARIETIES already bind to. The parent
  // would own facts about red lentils while the `red-lentil` variety owns them
  // too. Resolve the knowledge-side duplicate first; then bind, or don't.
  "food:lentils": {
    candidates: ["lentils", "red-lentils"],
    reason:
      'the string "lentils" names two knowledge identities (`lentils` and `red-lentils`, which carries it as an alias); ' +
      "and knowledge `lentils` aliases the very varieties this food's four variety rows already bind to, so binding the " +
      "parent would give red/green/puy lentil facts a second owner. Knowledge-side duplicate must be resolved first.",
  },

  // Knowledge `pasta` is the fact owner for WHEAT pasta and is already bound by
  // canonical `wheat-pasta` (NK6R Amendment 3). Canonical `pasta` is the parent
  // identity, deliberately type-unknown: "it must not claim a plant it may not
  // contain." Binding it would create a second claimant on knowledge `pasta` and
  // attach durum-wheat facts to chickpea and lentil pasta.
  "food:pasta": {
    candidates: ["pasta"],
    reason:
      "knowledge `pasta` is the fact owner for wheat pasta and is already bound by canonical `wheat-pasta` " +
      "(NK6R Amendment 3). Canonical `pasta` is the type-unknown parent — binding it would give knowledge `pasta` " +
      "a second canonical claimant and assert durum-wheat facts of chickpea/lentil/pea pasta.",
  },
};

// ── Knowledge-side indexes ───────────────────────────────────────────────────
// Built from FOOD_SEED, the declared owner. Identity keys and alias keys are
// kept APART: only the first is evidence; the second only detects ambiguity.

interface KnowledgeIndex {
  identity: Map<string, Set<string>>;
  alias: Map<string, Set<string>>;
}

let cached: KnowledgeIndex | null = null;

function buildKnowledgeIndex(): KnowledgeIndex {
  const identity = new Map<string, Set<string>>();
  const alias = new Map<string, Set<string>>();
  const add = (m: Map<string, Set<string>>, key: string, slug: string) => {
    if (!key) return;
    let set = m.get(key);
    if (!set) m.set(key, (set = new Set()));
    set.add(slug);
  };
  for (const f of FOOD_SEED) {
    for (const k of identityKeys(f.name, f.slug)) add(identity, k, f.slug);
    for (const a of (f.aliases ?? []) as string[]) {
      for (const k of ingredientKeyVariants(normalizeIngredientKey(a))) add(alias, k, f.slug);
    }
  }
  return { identity, alias };
}

function knowledgeIndex(): KnowledgeIndex {
  if (!cached) cached = buildKnowledgeIndex();
  return cached;
}

/** The normalised keys an identity spells: its display name and its slug. */
export function identityKeys(name: string, slug: string): string[] {
  const keys = new Set<string>();
  for (const k of ingredientKeyVariants(normalizeIngredientKey(name ?? ""))) keys.add(k);
  for (const k of ingredientKeyVariants(slugKey(slug ?? ""))) keys.add(k);
  keys.delete("");
  return Array.from(keys);
}

/** Every canonical food and variety, flattened into one bindable list. */
export function bindables(): Bindable[] {
  const out: Bindable[] = [];
  for (const e of CANONICAL_SEED) {
    out.push({
      kind: "food",
      slug: e.food.slug,
      name: e.food.name,
      knowledgeFoodSlug: e.food.knowledgeFoodSlug ?? null,
      foodSlug: e.food.slug,
    });
    for (const v of e.varieties ?? []) {
      out.push({
        kind: "variety",
        slug: v.slug,
        name: v.name,
        knowledgeFoodSlug: v.knowledgeFoodSlug ?? null,
        foodSlug: e.food.slug,
      });
    }
  }
  return out;
}

export const bindableKey = (b: Pick<Bindable, "kind" | "slug">): BindableKey => `${b.kind}:${b.slug}`;

/** Which canonical identity already binds each knowledge food. */
export function knowledgeFoodClaims(list: Bindable[] = bindables()): Map<string, BindableKey[]> {
  const claims = new Map<string, BindableKey[]>();
  for (const b of list) {
    if (!b.knowledgeFoodSlug) continue;
    const prev = claims.get(b.knowledgeFoodSlug) ?? [];
    prev.push(bindableKey(b));
    claims.set(b.knowledgeFoodSlug, prev);
  }
  return claims;
}

export interface BindingContext {
  claims?: ReadonlyMap<string, BindableKey[]>;
  /** This identity's own key, so its existing claim does not refuse itself. */
  selfKey?: BindableKey;
  /** For a variety: the knowledge food its parent binds (null if the parent is unbound). */
  inheritsFrom?: string | null;
  /** A variety may legitimately be covered by its parent's knowledge food; a food may not. */
  isVariety?: boolean;
}

/**
 * Decide the knowledge food an unbound canonical identity belongs to — or refuse.
 *
 * `claims` lets the caller pass the current claim map so a knowledge food that
 * another canonical identity already owns is refused rather than double-bound.
 */
export function resolveKnowledgeBinding(
  identity: { slug: string; name: string },
  ctx: BindingContext = {},
): KnowledgeBinding {
  const { identity: idIndex, alias: aliasIndex } = knowledgeIndex();
  const claims = ctx.claims ?? knowledgeFoodClaims();

  const idHits = new Set<string>();
  const aliasHits = new Set<string>();
  let matchedOn = "";
  for (const key of identityKeys(identity.name, identity.slug)) {
    (idIndex.get(key) ?? new Set<string>()).forEach((s) => {
      if (!idHits.size) matchedOn = key;
      idHits.add(s);
    });
    (aliasIndex.get(key) ?? new Set<string>()).forEach((s) => aliasHits.add(s));
  }
  const idSlugs = Array.from(idHits).sort();
  const aliasSlugs = Array.from(aliasHits).sort();

  const candidates = Array.from(new Set(idSlugs.concat(aliasSlugs))).sort();
  if (candidates.length === 0) return { kind: "none" };

  // Two knowledge foods claim this name. One string, two identities — GOV2 Rule 3.
  if (idHits.size > 1) {
    return { kind: "ambiguous", candidates, reason: `${idHits.size} knowledge identities carry this name: ${idSlugs.join(", ")}` };
  }

  // The name reaches a knowledge food only through that food's ALIAS set.
  if (idHits.size === 0) {
    // A variety named as a form of the food its parent binds ("cherry tomato" →
    // alias of `tomatoes`; parent `tomato` binds `tomatoes`). The resolver hands
    // it the parent's knowledge food already. Nothing to bind, nothing to review.
    if (ctx.isVariety && ctx.inheritsFrom && candidates.every((c) => c === ctx.inheritsFrom)) {
      return { kind: "inherited", from: ctx.inheritsFrom };
    }
    // Otherwise: an alias is a pointer, not proof of identity (GOV2 — "an alias
    // never creates a second entity", nor does it establish one). For a variety
    // this means its name is an alias of a knowledge food its parent does NOT
    // bind, which is a scope question. Either way, a human confirms the merge.
    return { kind: "ambiguous", candidates, reason: `names no knowledge identity, only the alias set of: ${candidates.join(", ")} — an alias is not evidence of identity` };
  }

  const target = idSlugs[0];

  // Identity matches one food, but the same name is also an alias of another.
  const strays = aliasSlugs.filter((s) => s !== target);
  if (strays.length > 0) {
    return { kind: "ambiguous", candidates, reason: `identity matches \`${target}\`, but this name is also an alias of: ${strays.join(", ")}` };
  }

  // Already spoken for. One knowledge identity, one canonical claimant.
  const owners = (claims.get(target) ?? []).filter((k) => k !== ctx.selfKey);
  if (owners.length > 0) {
    return { kind: "ambiguous", candidates, reason: `knowledge food \`${target}\` is already bound by ${owners.join(", ")} — one knowledge identity, one canonical claimant` };
  }

  return { kind: "unique", knowledgeFoodSlug: target, matchedOn };
}

export interface BindingAudit {
  /** Fatal — `validateCanonicalSeed()` refuses to seed while any of these stand. */
  problems: string[];
  /** Tracked, never silent, never fatal. */
  warnings: string[];
  bound: number;
  deferred: number;
  /** Varieties covered by their parent's knowledge food. Not a gap. */
  inherited: number;
  /** Identities with no knowledge food of that name. An honest gap. */
  unmatched: number;
}

/**
 * The standing check. Run by `validateCanonicalSeed()`, so a canonical food that
 * *could* be bound to a knowledge food but is not cannot be seeded — and a
 * knowledge food cannot acquire a second canonical claimant.
 *
 * A missing binding is a PROBLEM. An ambiguous one is a problem *unless* it is
 * registered in `DEFERRED_KNOWLEDGE_BINDINGS` with a reason. No knowledge food
 * of that name is neither.
 */
export function auditKnowledgeBindings(): BindingAudit {
  const problems: string[] = [];
  const warnings: string[] = [];
  const list = bindables();
  const claims = knowledgeFoodClaims(list);
  const knowledgeSlugs = new Set(FOOD_SEED.map((f) => f.slug));
  const { identity: idIndex } = knowledgeIndex();

  // 1. One knowledge identity, one canonical claimant. The DB has no unique
  //    constraint on knowledge_food_slug, so nothing else catches this.
  claims.forEach((owners, slug) => {
    if (owners.length > 1) {
      problems.push(`knowledge_food "${slug}" is bound by ${owners.length} canonical identities (${owners.join(", ")}) — one owner per fact`);
    }
  });

  let bound = 0, deferred = 0, inherited = 0, unmatched = 0;
  const foodBinding = new Map(CANONICAL_SEED.map((e) => [e.food.slug, e.food.knowledgeFoodSlug ?? null] as const));

  for (const b of list) {
    const key = bindableKey(b);
    const label = `${b.kind} "${b.slug}"`;

    if (b.knowledgeFoodSlug) {
      bound++;
      if (DEFERRED_KNOWLEDGE_BINDINGS[key]) {
        problems.push(`${label}: is bound to "${b.knowledgeFoodSlug}" but still listed in DEFERRED_KNOWLEDGE_BINDINGS — remove the stale deferral`);
      }
      // Bound to something the binder cannot re-derive from names alone. Not a
      // fault — `peas → garden-peas` is a sound editorial call the matcher has
      // no way to make. Surfaced so the audit never implies it verified them.
      const matchesByName = identityKeys(b.name, b.slug).some((k) => (idIndex.get(k) ?? new Set()).has(b.knowledgeFoodSlug!));
      if (knowledgeSlugs.has(b.knowledgeFoodSlug) && !matchesByName) {
        warnings.push(`${label}: bound to knowledge_food "${b.knowledgeFoodSlug}" by editorial judgement, not name equality — the binding audit cannot verify it`);
      }
      continue;
    }

    const binding = resolveKnowledgeBinding(b, {
      claims,
      selfKey: key,
      isVariety: b.kind === "variety",
      inheritsFrom: b.kind === "variety" ? foodBinding.get(b.foodSlug) ?? null : null,
    });
    const deferral = DEFERRED_KNOWLEDGE_BINDINGS[key];

    if (binding.kind === "inherited") {
      inherited++;
      if (deferral) {
        problems.push(`${label}: listed in DEFERRED_KNOWLEDGE_BINDINGS but it is covered by its parent's knowledge food "${binding.from}" — remove the stale deferral`);
      }
      continue;
    }

    if (binding.kind === "unique") {
      if (deferral) {
        problems.push(`${label}: deferred, but the binding to "${binding.knowledgeFoodSlug}" is now unambiguous — bind it or restate the reason`);
      } else {
        problems.push(
          `${label}: knowledge_food "${binding.knowledgeFoodSlug}" carries this identity's name (matched on "${binding.matchedOn}") ` +
          `but no binding is declared. Set knowledgeFoodSlug: "${binding.knowledgeFoodSlug}", or record a reason in DEFERRED_KNOWLEDGE_BINDINGS.`,
        );
      }
      continue;
    }

    if (binding.kind === "ambiguous") {
      if (!deferral) {
        problems.push(
          `${label}: ambiguous knowledge binding — ${binding.reason}. Blocked for human review: ` +
          `add "${key}" to DEFERRED_KNOWLEDGE_BINDINGS with candidates [${binding.candidates.map((c) => `"${c}"`).join(", ")}] and a reason, or disambiguate.`,
        );
        continue;
      }
      deferred++;
      if (!deferral.reason.trim()) {
        problems.push(`${label}: DEFERRED_KNOWLEDGE_BINDINGS entry has no reason — a deferral without a reason is a forgotten binding`);
      }
      const recorded = [...deferral.candidates].sort().join(",");
      const actual = binding.candidates.join(",");
      if (recorded !== actual) {
        problems.push(`${label}: deferral is stale — recorded candidates [${recorded}] but the seed now yields [${actual}]. Re-review.`);
      }
      continue;
    }

    // binding.kind === "none"
    unmatched++;
    if (deferral) {
      problems.push(`${label}: listed in DEFERRED_KNOWLEDGE_BINDINGS but no knowledge food carries this name — remove the stale deferral`);
    }
  }

  // 3. Register entries that name nothing at all.
  const known = new Set(list.map(bindableKey));
  for (const key of Object.keys(DEFERRED_KNOWLEDGE_BINDINGS) as BindableKey[]) {
    if (!known.has(key)) problems.push(`DEFERRED_KNOWLEDGE_BINDINGS: "${key}" is not a canonical food or variety`);
  }

  return { problems, warnings, bound, deferred, inherited, unmatched };
}

/** Non-fatal binding observations, printed by the seed runner (never silent). */
export function canonicalSeedBindingWarnings(): string[] {
  return auditKnowledgeBindings().warnings;
}

/** Coverage of the canonical → knowledge binding, for reporting. */
export const KNOWLEDGE_BINDING_COVERAGE = (() => {
  const a = auditKnowledgeBindings();
  const bindable = a.bound + a.deferred;
  return {
    total: a.bound + a.deferred + a.inherited + a.unmatched,
    bound: a.bound,
    deferred: a.deferred,
    inherited: a.inherited,
    unmatched: a.unmatched,
    /** Of the identities for which a knowledge food exists, the fraction bound. */
    pctOfBindable: bindable === 0 ? 0 : Math.round((a.bound / bindable) * 1000) / 10,
  } as const;
})();
