// WS2B — Variety Surfacing (educational layer).
//
//   eaten ingredients ──▶ canonical resolver ──▶ "Your Variety" (eaten)
//                                            └──▶ "Broaden Your Variety" (not yet eaten)
//
// PURE and READ-ONLY. This file reads the WS2A editorial seed (the same source
// shadow mode uses) and the household's eaten ingredient strings, and derives
// what to *surface*. It computes NO counts, mutates NO state and is wired into
// NO production counting path. The 30-plants number is produced entirely
// elsewhere (client computePlantData → plantRows.length) and is never read here.
//
// Honesty rules (WS2B brief):
//   • Only varieties already defined by WS2A are ever shown — never invented.
//   • A food with zero defined varieties surfaces NOTHING (no empty cards).
//   • Aliases resolve to their canonical variety first (the resolver's job).
import { CANONICAL_SEED } from "./foods";
import { resolveCanonicalFood } from "./resolver";

export interface CanonicalVarietyDisplay {
  /** The canonical food this block belongs to, e.g. "tomato". */
  canonicalSlug: string;
  /** The canonical food's display name, e.g. "Tomato". */
  canonicalName: string;
  /** Short labels of varieties the household HAS eaten, sorted A→Z. */
  yourVarieties: string[];
  /** Short labels of defined varieties NOT yet eaten, sorted A→Z. */
  broadenVarieties: string[];
}

interface DefinedVariety {
  slug: string;
  /** Short, food-name-stripped label, e.g. "Cherry" from "Cherry Tomato". */
  label: string;
}

/**
 * Strip a trailing food name from a variety name so the surfaced label reads as
 * the distinguishing part only: "Cherry Tomato" + "Tomato" → "Cherry".
 * Falls back to the full variety name if stripping would leave nothing.
 */
export function varietyLabel(varietyName: string, foodName: string): string {
  const suffix = " " + foodName.toLowerCase();
  if (varietyName.toLowerCase().endsWith(suffix)) {
    const stripped = varietyName.slice(0, varietyName.length - suffix.length).trim();
    if (stripped) return stripped;
  }
  return varietyName;
}

// ── Defined-variety index, built once from the editorial seed ─────────────────
// canonical food slug → its varieties (display-ordered), plus the food name.

interface FoodVarietyInfo {
  name: string;
  varieties: DefinedVariety[]; // in seed displayOrder
  bySlug: Map<string, DefinedVariety>;
}

let cachedFoodIndex: Map<string, FoodVarietyInfo> | null = null;

function getFoodIndex(): Map<string, FoodVarietyInfo> {
  if (cachedFoodIndex) return cachedFoodIndex;
  const index = new Map<string, FoodVarietyInfo>();
  for (const entry of CANONICAL_SEED) {
    const food = entry.food;
    const ordered = [...(entry.varieties ?? [])].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
    const varieties: DefinedVariety[] = ordered.map((v) => ({
      slug: v.slug,
      label: varietyLabel(v.name, food.name),
    }));
    const bySlug = new Map(varieties.map((v) => [v.slug, v]));
    index.set(food.slug, { name: food.name, varieties, bySlug });
  }
  cachedFoodIndex = index;
  return index;
}

/** Defined varieties for a canonical food, or [] if it has none (→ surface nothing). */
export function getDefinedVarieties(canonicalSlug: string): DefinedVariety[] {
  return getFoodIndex().get(canonicalSlug)?.varieties ?? [];
}

// Quantity/prep stripping so "200g chopped cherry tomatoes" still resolves to the
// cherry-tomato VARIETY. This mirrors client stripForMatch (ingredient-reuse.ts)
// but deliberately does NOT alias-collapse (which would fold cherry → tomato and
// lose the variety). Source of truth for the word set: ingredient-reuse.ts —
// keep in sync if that changes.
const STRIP_WORDS: ReadonlySet<string> = new Set([
  "fresh", "dried", "frozen", "organic", "chopped", "sliced", "diced",
  "minced", "grated", "shredded", "whole", "ground", "crushed",
  "handful", "pinch", "splash", "knob", "drizzle",
  "a", "an", "the", "of", "some", "extra",
]);

function stripQuantityAndPrep(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, "")
    .replace(/\d+(\.\d+)?\s*(g|kg|ml|l|tsp|tbsp|cup|cups|oz|lb|lbs|clove|cloves|x)?\s*/gi, "")
    .replace(/\b(tsp|tbsp|g|kg|ml|l|oz|lb|lbs|cup|cups|clove|cloves)\b/gi, "")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STRIP_WORDS.has(w))
    .join(" ")
    .trim();
}

/**
 * Which varieties the household has eaten, per canonical food.
 * Resolves every ingredient string; records only true VARIETY matches (a generic
 * "tomatoes" alias contributes its food but no variety). Read-only aggregation.
 */
export function buildEatenVarietyIndex(ingredients: string[]): Map<string, Set<string>> {
  const eaten = new Map<string, Set<string>>();
  for (const raw of ingredients) {
    if (!raw || !raw.trim()) continue;
    const res = resolveCanonicalFood(stripQuantityAndPrep(raw));
    if (res.matchType === "variety" && res.canonicalSlug && res.varietySlug) {
      let set = eaten.get(res.canonicalSlug);
      if (!set) { set = new Set(); eaten.set(res.canonicalSlug, set); }
      set.add(res.varietySlug);
    }
  }
  return eaten;
}

/**
 * Build the educational variety display for a single canonical food given the
 * household's eaten variety slugs for it. Returns null when there is nothing
 * worth surfacing (food has no defined varieties) — the caller renders nothing.
 *
 * Sections:
 *   • Your Variety       — eaten varieties (hidden when empty)
 *   • Broaden Your Variety — defined-but-not-eaten varieties (hidden when empty)
 * Both alphabetical. A single-variety food, once eaten, yields no Broaden block.
 */
export function buildVarietyDisplay(
  canonicalSlug: string,
  canonicalName: string,
  eatenSlugs: ReadonlySet<string>,
): CanonicalVarietyDisplay | null {
  const defined = getDefinedVarieties(canonicalSlug);
  if (defined.length === 0) return null; // no canonical varieties → show nothing

  const your: string[] = [];
  const broaden: string[] = [];
  for (const v of defined) {
    if (eatenSlugs.has(v.slug)) your.push(v.label);
    else broaden.push(v.label);
  }
  if (your.length === 0 && broaden.length === 0) return null;

  your.sort((a, b) => a.localeCompare(b));
  broaden.sort((a, b) => a.localeCompare(b));
  return { canonicalSlug, canonicalName, yourVarieties: your, broadenVarieties: broaden };
}

export interface VarietyRowInput {
  /** Stable key for the plant row (the report's canonicalKey). */
  key: string;
  /** A representative ingredient string for the row, used to resolve its food. */
  representative: string;
}

/**
 * Map each plant row to its educational variety display, computed at the
 * CANONICAL-FOOD level so a household's varieties aggregate correctly even when
 * "tomatoes" and "cherry tomatoes" land on different report rows.
 *
 * Ownership: the variety block for a food renders ONCE, on the first row that
 * resolves to that food — preferring the base-food row (a "Tomato" row) over a
 * variety row (a "Cherry Tomato" row) so the block reads naturally.
 *
 * @param allIngredients every raw ingredient string in the week (resolver filters)
 * @param rows           plant rows in display order
 * @returns Map keyed by row.key → display (only for owner rows with content)
 */
export function buildRowVarietyDisplays(
  allIngredients: string[],
  rows: VarietyRowInput[],
): Map<string, CanonicalVarietyDisplay> {
  const eaten = buildEatenVarietyIndex(allIngredients);
  const foodIndex = getFoodIndex();

  // Pick the owner row per canonical food (base-food row wins over variety row).
  interface Owner { rowKey: string; isBase: boolean }
  const ownerByFood = new Map<string, Owner>();
  for (const row of rows) {
    const res = resolveCanonicalFood(row.representative);
    if (!res.matched || !res.canonicalSlug) continue;
    const food = foodIndex.get(res.canonicalSlug);
    if (!food || food.varieties.length === 0) continue; // no varieties → never surfaces

    const isBase = res.matchType === "canonical" || res.matchType === "alias";
    const existing = ownerByFood.get(res.canonicalSlug);
    if (!existing) ownerByFood.set(res.canonicalSlug, { rowKey: row.key, isBase });
    else if (isBase && !existing.isBase) ownerByFood.set(res.canonicalSlug, { rowKey: row.key, isBase });
  }

  const result = new Map<string, CanonicalVarietyDisplay>();
  for (const [foodSlug, owner] of Array.from(ownerByFood.entries())) {
    const food = foodIndex.get(foodSlug)!;
    const display = buildVarietyDisplay(foodSlug, food.name, eaten.get(foodSlug) ?? new Set());
    if (display) result.set(owner.rowKey, display);
  }
  return result;
}
