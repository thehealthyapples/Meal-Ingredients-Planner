// GOV2 — Canonical Alias Principle: the single shared vocabulary resolver.
//
// "One identity. One display name. Unlimited aliases. Every path in resolves
//  aliases to the one identity." (docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md)
//
// This is THE resolver (GOV2 Rule 5): every import / AI / search / OCR path must
// resolve an incoming nutrient or benefit name through this module BEFORE the
// entity is referenced. Aliases are many-to-one (many alt-name strings → one
// canonical slug). An unknown string is REJECTED and reported — never silently
// minted into a second identity (GOV2 Rule 4/7 + Core Principle 6).
//
// Vocabulary ownership (NK6F): TypeScript remains the canonical owner of the
// nutrient and benefit vocabularies. This module introduces NO new vocabulary —
// the canonical slug SETS are derived from NUTRIENT_SEED / HEALTH_BENEFIT_SEED,
// the single source of truth. It only records the alternate NAMES that resolve
// to those existing canonical identities. No canonical slug is renamed here.

import { NUTRIENT_SEED } from "./nutrients";
import { HEALTH_BENEFIT_SEED } from "./health-benefits";

/** Canonical nutrient slugs — derived from the single source of truth. */
export const CANONICAL_NUTRIENT_SLUGS: ReadonlySet<string> = new Set(
  NUTRIENT_SEED.map((n) => n.slug),
);

/** Canonical health-benefit slugs — derived from the single source of truth. */
export const CANONICAL_BENEFIT_SLUGS: ReadonlySet<string> = new Set(
  HEALTH_BENEFIT_SEED.map((b) => b.slug),
);

/**
 * Deterministic normalisation shared by every path (GOV2 Rule 5). Lower-cases,
 * trims, and collapses spaces / underscores / slashes to single hyphens so that
 * `vitamin_C`, `Vitamin C` and `vitamin-c` all reduce to one lookup key.
 */
export function normaliseVocabularyTerm(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_/]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Nutrient aliases (normalised alt-name → canonical nutrient slug) ──────────
// Genuine same-substance synonyms only (GOV2 scope test). Every target below is
// validated to be a canonical slug at module load.
export const NUTRIENT_ALIASES: Readonly<Record<string, string>> = {
  // Long-chain marine omega-3 fractions are omega-3.
  "long-chain-omega-3-epa-dha": "omega-3",
  "omega-3-epa-dha": "omega-3",
  "epa-dha": "omega-3",
  // Beta-glucan / soluble fibre is fibre.
  "beta-glucan-soluble-fibre": "fibre",
  "soluble-fibre": "fibre",
  // Anthocyanins are the canonical berry polyphenol; the draft's compound label
  // names them specifically.
  "polyphenols-anthocyanins": "anthocyanins",
  // Plant (non-haem) iron is iron.
  "plant-iron": "iron",
  "non-haem-iron": "iron",
  // Monounsaturated fat is an unsaturated fat.
  "monounsaturated-fat": "unsaturated-fats",
  // Live cultures, whatever the labelling caveat, are live cultures.
  "live-cultures-when-labelled": "live-cultures",
  // NK6L — "high-quality protein" is a quality FRAMING of protein, not a separate
  // substance. It merges into the canonical `protein` identity (NK6K merge
  // decision). Note: glucosinolates is deliberately NOT aliased to sulforaphane —
  // it is its own canonical identity (NK6L amendment).
  "high-quality-protein": "protein",
  // NK6M — protein has ONE canonical identity. Plant vs animal is a SOURCE
  // attribute (a property of the food), not a separate nutrient. The former
  // `plant-protein` identity was collapsed into `protein`; both source-qualified
  // names resolve to the one identity (GOV2 Rule 3/7). This also preserves
  // backwards compatibility for any path still emitting the old `plant-protein`
  // string (imports, seeded rows, draft YAMLs).
  "plant-protein": "protein",
  "animal-protein": "protein",
};

// ── Benefit aliases (normalised framing term → canonical benefit slug) ───────
// Conservative and definitionally grounded: a framing term aliases to a canonical
// benefit ONLY when that benefit's own editorial description already encompasses
// the concept (so the mapping is a synonym, not a fabricated association). Terms
// that are planner/wording framing rather than a health-benefit identity (e.g.
// "meal_balance", "breakfast_quality") are intentionally NOT listed — they are
// rejected and reported for an editorial decision.
export const BENEFIT_ALIASES: Readonly<Record<string, string>> = {
  // gut-health desc: "fibre-rich plants and fermented foods that add variety to
  // what lives in your gut".
  "gut-health-pattern": "gut-health",
  "plant-diversity": "gut-health",
  "fermented-food-context": "gut-health",
  // heart-health desc: "unsaturated fats, fibre, potassium and colourful plants".
  "healthy-fat": "heart-health",
  // bone-health desc: "calcium, vitamin D, vitamin K and magnesium".
  "calcium": "bone-health",
  // muscle-recovery desc: "foods that add protein and minerals which muscles use".
  "protein": "muscle-recovery",
  "meat-free-protein": "muscle-recovery",
};

// ── KQ1F — governed alias overlay (published aliases) ────────────────────────
// GOV2 keeps ONE resolver (Rule 5). Published aliases (KQ1F) must resolve through
// THIS module, not a second one — so the resolver carries an in-memory overlay
// that the server injects from the governed `knowledge_vocabulary_aliases` table
// at boot and after every publish/rollback. The overlay is DB-sourced but this
// module stays DB-free: the server reads the table and calls setVocabularyOverlay.
//
// The overlay is subject to the SAME anti-fork guard as the TS seed tables: an
// alias whose target is not a canonical slug is REFUSED (it would fabricate a
// second identity, GOV2 Rule 7). It NEVER renames a canonical slug and never
// overrides an exact canonical match — resolution order is exact → TS alias →
// overlay, so the overlay can only ADD alt-names for existing identities.
const NUTRIENT_OVERLAY: Map<string, string> = new Map();
const BENEFIT_OVERLAY: Map<string, string> = new Map();

export interface VocabularyOverlayInput {
  /** normalised alias → canonical nutrient slug */
  nutrient?: Record<string, string>;
  /** normalised alias → canonical benefit slug */
  benefit?: Record<string, string>;
}

export interface VocabularyOverlayResult {
  nutrient: number;
  benefit: number;
  /** Entries refused by the anti-fork guard (target not a canonical slug). */
  rejected: Array<{ kind: "nutrient" | "benefit"; alias: string; target: string }>;
}

/**
 * Install the governed alias overlay (replacing any prior overlay). Every target
 * is validated against the canonical slug set — a non-canonical target is
 * REFUSED and reported, never installed (GOV2 anti-fork, Rule 7). Called by the
 * server at boot and after publish/rollback so published aliases resolve through
 * the single resolver. Returns how many entries were installed per kind + the
 * rejected set (which the caller should treat as a hard governance error).
 */
export function setVocabularyOverlay(overlay: VocabularyOverlayInput): VocabularyOverlayResult {
  const rejected: VocabularyOverlayResult["rejected"] = [];
  const install = (
    src: Record<string, string> | undefined,
    canonical: ReadonlySet<string>,
    dest: Map<string, string>,
    kind: "nutrient" | "benefit",
  ): number => {
    dest.clear();
    if (!src) return 0;
    let n = 0;
    for (const [rawAlias, rawTarget] of Object.entries(src)) {
      const alias = normaliseVocabularyTerm(rawAlias);
      const target = String(rawTarget ?? "");
      if (!alias) continue;
      if (!canonical.has(target)) {
        rejected.push({ kind, alias, target });
        continue; // anti-fork: refuse a target that is not a canonical identity
      }
      dest.set(alias, target);
      n++;
    }
    return n;
  };
  return {
    nutrient: install(overlay.nutrient, CANONICAL_NUTRIENT_SLUGS, NUTRIENT_OVERLAY, "nutrient"),
    benefit: install(overlay.benefit, CANONICAL_BENEFIT_SLUGS, BENEFIT_OVERLAY, "benefit"),
    rejected,
  };
}

/** The currently-installed overlay (for diagnostics / health reporting). */
export function getVocabularyOverlay(): { nutrient: Record<string, string>; benefit: Record<string, string> } {
  return {
    nutrient: Object.fromEntries(NUTRIENT_OVERLAY),
    benefit: Object.fromEntries(BENEFIT_OVERLAY),
  };
}

/** Drop the overlay entirely (resolution reverts to exact + TS-seed aliases). */
export function clearVocabularyOverlay(): void {
  NUTRIENT_OVERLAY.clear();
  BENEFIT_OVERLAY.clear();
}

export type ResolutionVia = "exact" | "alias" | "overlay" | "unresolved";

export interface VocabularyResolution {
  /** Original incoming string, verbatim. */
  input: string;
  /** Normalised lookup key. */
  normalised: string;
  /** True when the term resolved to a canonical identity. */
  resolved: boolean;
  /** Canonical slug when resolved; null when rejected. */
  canonicalSlug: string | null;
  via: ResolutionVia;
  /** Human-readable reason when rejected. */
  reason?: string;
}

function resolveTerm(
  raw: string,
  canonical: ReadonlySet<string>,
  aliases: Readonly<Record<string, string>>,
  overlay: Map<string, string>,
  kind: "nutrient" | "benefit",
): VocabularyResolution {
  const normalised = normaliseVocabularyTerm(raw);
  if (!normalised) {
    return { input: raw, normalised, resolved: false, canonicalSlug: null, via: "unresolved", reason: "empty term" };
  }
  // Exact canonical match wins — the overlay can never override an identity.
  if (canonical.has(normalised)) {
    return { input: raw, normalised, resolved: true, canonicalSlug: normalised, via: "exact" };
  }
  // TS-owned seed aliases next.
  const aliasTarget = aliases[normalised];
  if (aliasTarget) {
    return { input: raw, normalised, resolved: true, canonicalSlug: aliasTarget, via: "alias" };
  }
  // Governed published-alias overlay last (still the single resolver). Its
  // targets were anti-fork-validated at install time.
  const overlayTarget = overlay.get(normalised);
  if (overlayTarget) {
    return { input: raw, normalised, resolved: true, canonicalSlug: overlayTarget, via: "overlay" };
  }
  return {
    input: raw,
    normalised,
    resolved: false,
    canonicalSlug: null,
    via: "unresolved",
    reason: `no canonical ${kind} identity or alias for "${normalised}"`,
  };
}

/** Resolve an incoming nutrient name to a canonical nutrient slug (or reject). */
export function resolveNutrientTerm(raw: string): VocabularyResolution {
  return resolveTerm(raw, CANONICAL_NUTRIENT_SLUGS, NUTRIENT_ALIASES, NUTRIENT_OVERLAY, "nutrient");
}

/** Resolve an incoming benefit name to a canonical benefit slug (or reject). */
export function resolveBenefitTerm(raw: string): VocabularyResolution {
  return resolveTerm(raw, CANONICAL_BENEFIT_SLUGS, BENEFIT_ALIASES, BENEFIT_OVERLAY, "benefit");
}

// GOV2 Rule 7 (anti-fork) load-time guard: an alias whose target is not itself a
// canonical slug would fabricate a second identity. Refuse to load if so.
for (const [alias, target] of Object.entries(NUTRIENT_ALIASES)) {
  if (!CANONICAL_NUTRIENT_SLUGS.has(target)) {
    throw new Error(`NUTRIENT_ALIASES["${alias}"] → "${target}" is not a canonical nutrient slug`);
  }
}
for (const [alias, target] of Object.entries(BENEFIT_ALIASES)) {
  if (!CANONICAL_BENEFIT_SLUGS.has(target)) {
    throw new Error(`BENEFIT_ALIASES["${alias}"] → "${target}" is not a canonical benefit slug`);
  }
}
