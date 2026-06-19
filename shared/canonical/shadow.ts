// WS2A — Shadow Mode validation.
//
// CRITICAL: this does NOT replace Plant Diversity, Planner, Shopping, Pantry,
// Boosts or the Analyser. It runs the canonical resolver SILENTLY beside the
// existing identity logic and reports where they agree and disagree. Nothing
// here is wired into any production surface.
//
// "Existing identity" reproduced here is the SAME key the live 30-plants counter
// uses: resolveIngredientAlias(stripForMatch(raw)) — i.e. client
// nutrition-variety / ingredient-reuse `normaliseForReuse`, rebuilt from shared
// building blocks so this module stays in the shared layer.
import { resolveIngredientAlias } from "../ingredient-aliases";
import { resolveCanonicalFood, type CanonicalResolution } from "./resolver";

// Mirror of client/src/lib/ingredient-reuse.ts STRIP_WORDS / stripForMatch.
const STRIP_WORDS = new Set([
  "fresh", "dried", "frozen", "organic", "chopped", "sliced", "diced",
  "minced", "grated", "shredded", "whole", "ground", "crushed",
  "handful", "pinch", "splash", "knob", "drizzle",
  "a", "an", "the", "of", "some", "extra",
]);

function stripForMatch(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, "")
    .replace(/\d+(\.\d+)?\s*(g|kg|ml|l|tsp|tbsp|cup|cups|oz|lb|lbs|clove|cloves)?\s*/gi, "")
    .replace(/\b(tsp|tbsp|g|kg|ml|l|oz|lb|lbs|cup|cups|clove|cloves)\b/gi, "")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STRIP_WORDS.has(w))
    .join(" ")
    .trim();
}

/** The live 30-plants counter's distinct-plant identity for a raw ingredient. */
export function existingIdentityKey(raw: string): string {
  return resolveIngredientAlias(stripForMatch(raw));
}

export type ShadowClassification = "matched" | "mismatch" | "unknown" | "ambiguous";

export interface ShadowItem {
  input: string;
  existingKey: string;
  canonical: CanonicalResolution;
  classification: ShadowClassification;
  note: string;
}

export interface ShadowReport {
  total: number;
  items: ShadowItem[];
  diagnostics: { matched: number; mismatch: number; unknown: number; ambiguous: number };
  existingDistinctPlants: number;
  canonicalDistinctPlants: number;
  // % of resolved items whose canonical grouping agrees 1:1 with the existing key.
  parityPct: number;
  mismatches: ShadowItem[];
  unknownFoods: string[];
}

/** Distinct canonical plants = distinct diversity groups among resolved foods. */
export function countCanonicalPlants(inputs: string[]): number {
  const groups = new Set<string>();
  for (const raw of inputs) {
    const r = resolveCanonicalFood(raw);
    if (r.matched && r.diversityGroupSlug) groups.add(r.diversityGroupSlug);
  }
  return groups.size;
}

/** Distinct existing plants = distinct alias-collapse keys (mirrors today). */
export function countExistingPlants(inputs: string[]): number {
  return new Set(inputs.map(existingIdentityKey).filter(Boolean)).size;
}

/**
 * Run the canonical resolver beside the existing identity logic over a set of
 * free-text ingredients and report agreement.
 *
 * Classification:
 *   • unknown   — resolver found no canonical food (normal for non-whole-foods)
 *   • ambiguous — resolver reported >1 candidate (should be impossible: unique key)
 *   • mismatch  — resolved, but its diversity group merges/splits relative to the
 *                 existing key (canonical groups things existing keeps apart, or
 *                 vice-versa). For this seed every mismatch is a canonical *fix*
 *                 (e.g. mushroom kinds collapse to one plant), surfaced for review.
 *   • matched   — resolved AND its grouping agrees 1:1 with the existing key.
 */
export function runShadowComparison(inputs: string[]): ShadowReport {
  // First pass: resolve everything and build the cross-maps.
  const rows = inputs.map((input) => ({
    input,
    existingKey: existingIdentityKey(input),
    canonical: resolveCanonicalFood(input),
  }));

  // existingKey → set of canonical groups it maps to (split detector)
  const existingToGroups = new Map<string, Set<string>>();
  // canonical group → set of existing keys mapping to it (merge detector)
  const groupToExisting = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.canonical.matched || !r.canonical.diversityGroupSlug) continue;
    const g = r.canonical.diversityGroupSlug;
    if (!existingToGroups.has(r.existingKey)) existingToGroups.set(r.existingKey, new Set());
    existingToGroups.get(r.existingKey)!.add(g);
    if (!groupToExisting.has(g)) groupToExisting.set(g, new Set());
    groupToExisting.get(g)!.add(r.existingKey);
  }

  const items: ShadowItem[] = rows.map((r) => {
    if (!r.canonical.matched) {
      return { ...r, classification: "unknown", note: "no canonical food for this text" };
    }
    if (r.canonical.matchType === "ambiguous") {
      return { ...r, classification: "ambiguous", note: "multiple canonical candidates" };
    }
    const g = r.canonical.diversityGroupSlug;
    const merges = g ? (groupToExisting.get(g)?.size ?? 0) > 1 : false;
    const splits = (existingToGroups.get(r.existingKey)?.size ?? 0) > 1;
    if (splits) {
      return { ...r, classification: "mismatch", note: `existing key "${r.existingKey}" maps to multiple canonical groups (split risk)` };
    }
    if (merges) {
      return { ...r, classification: "mismatch", note: `canonical group "${g}" merges multiple existing keys (canonical collapses variety)` };
    }
    return { ...r, classification: "matched", note: `existing "${r.existingKey}" ≡ canonical group "${g}"` };
  });

  const diagnostics = { matched: 0, mismatch: 0, unknown: 0, ambiguous: 0 };
  for (const it of items) diagnostics[it.classification]++;

  const resolved = items.filter((i) => i.classification === "matched" || i.classification === "mismatch").length;
  const parityPct = resolved === 0 ? 100 : Math.round((diagnostics.matched / resolved) * 1000) / 10;

  return {
    total: inputs.length,
    items,
    diagnostics,
    existingDistinctPlants: countExistingPlants(inputs),
    canonicalDistinctPlants: countCanonicalPlants(inputs),
    parityPct,
    mismatches: items.filter((i) => i.classification === "mismatch"),
    unknownFoods: items.filter((i) => i.classification === "unknown").map((i) => i.input),
  };
}
