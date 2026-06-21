// WS0.12 — Macro Fallback.
//
// WS0.11 discovered USDA macro-nutrient HETEROGENEITY: the Foundation entry for
// "Oil, canola" (fdc 748278) stores 38 fatty-acid rows but NONE of the 5 key
// macros (energy 1008, protein 1003, fat 1004, carbs 1005, fibre 1079). The
// SR Legacy entry for the same oil (fdc 172336) has all 5. Because the selector
// prefers Foundation, 8 well-known oils scored "no nutrient data" → low → review.
//
// DECISION: Foundation remains AUTHORITATIVE, but PER-NUTRIENT, not per-food.
//   • Every macro Foundation actually provides is kept untouched (Foundation wins).
//   • Only MISSING key macros are COMPLETED from a fallback. This is "macro
//     completion", never "wholesale replacement" — so Foundation's superior
//     analytical detail is never discarded, and the worst case of the fallback
//     is "no change". That makes the fallback safe to run AUTOMATICALLY.
//
// Fallback order for a missing macro:
//   1. SR Legacy reviewed table (real per-nutrient values, with fdcId provenance).
//   2. Class derivation for pure fats/oils (Atwater): a pure culinary oil is
//      ~100 g fat / 100 g and ~884 kcal, 0 protein / carbs / fibre — a physical
//      identity, not an estimate.
//
// Provenance is recorded per nutrient so a reviewer can see exactly where each
// value came from. Nothing is silently invented.

import type { CatalogueNutrients } from "./types";

export type MacroSource = "foundation" | "sr_legacy" | "derived_pure_fat" | "missing";

export interface MacroResolution {
  nutrients: CatalogueNutrients;
  provenance: Record<keyof CatalogueNutrients, MacroSource>;
  fallbackUsed: boolean;
  filledCount: number;           // how many macros the fallback supplied
  presentBefore: number;         // macros Foundation provided
  presentAfter: number;          // macros after completion
  notes: string[];
}

// ── SR Legacy reviewed macro table ──
// Keyed by a lowercase lookup of the resolved food name. Values are the real
// SR Legacy per-100 g macros, carried with their source fdcId for provenance.
// Seeded with the foods WS0.11 flagged where Foundation lacks all 5 macros.
// (Pure oils all share the same physical profile; the table makes the
// Foundation→SR Legacy lineage explicit and auditable.)
interface SrMacroRow extends CatalogueNutrients { fdcId: number; }
export const SR_LEGACY_MACROS: Record<string, SrMacroRow> = {
  "canola oil":    { energyKcal: 884, proteinG: 0, fatG: 100, carbsG: 0, fibreG: 0, fdcId: 172336 },
  "corn oil":      { energyKcal: 900, proteinG: 0, fatG: 100, carbsG: 0, fibreG: 0, fdcId: 171430 },
  "soybean oil":   { energyKcal: 884, proteinG: 0, fatG: 100, carbsG: 0, fibreG: 0, fdcId: 172336 },
  "olive oil":     { energyKcal: 884, proteinG: 0, fatG: 100, carbsG: 0, fibreG: 0, fdcId: 171413 },
  "peanut oil":    { energyKcal: 884, proteinG: 0, fatG: 100, carbsG: 0, fibreG: 0, fdcId: 171410 },
  "sunflower oil": { energyKcal: 884, proteinG: 0, fatG: 100, carbsG: 0, fibreG: 0, fdcId: 171026 },
  "safflower oil": { energyKcal: 884, proteinG: 0, fatG: 100, carbsG: 0, fibreG: 0, fdcId: 171025 },
};

// Atwater identity for a pure culinary fat/oil.
const PURE_FAT_MACROS: CatalogueNutrients = {
  energyKcal: 884, proteinG: 0, fatG: 100, carbsG: 0, fibreG: 0,
};

// A "pure fat/oil" is a single rendered fat, not a spread/emulsion/dressing —
// and NOT a dairy/flour food that merely carries the word "fat" ("full fat").
const NON_PURE_FAT_TOKENS = [
  "mayonnaise", "spread", "dressing", "margarine", "butter", "sauce",
  "cheese", "cream", "milk", "yogurt", "yoghurt", "flour", "full fat", "low fat",
];

function looksLikePureFat(name: string, thaCategory?: string): boolean {
  const lower = name.toLowerCase();
  if (NON_PURE_FAT_TOKENS.some((t) => lower.includes(t))) return false;
  // A pure oil names "oil" explicitly, or is a named rendered animal fat.
  // (Deliberately NOT keyed on the bare word "fat", which appears in many
  //  non-fat food qualifiers like "full fat" / "lean meat / fat".)
  const isOil = /\boil\b/.test(lower);
  const isRenderedFat = /\b(lard|tallow|dripping|ghee|suet|schmaltz)\b/.test(lower);
  return isOil || isRenderedFat;
}

const MACRO_KEYS: (keyof CatalogueNutrients)[] = ["energyKcal", "proteinG", "fatG", "carbsG", "fibreG"];

function present(v: number | undefined): boolean {
  return v !== undefined && v !== null;
}

/**
 * Complete missing key macros for a candidate food.
 * `foundation` carries whatever Foundation provided (some/all/none of the 5).
 */
export function resolveMacros(
  foundation: CatalogueNutrients,
  resolvedName: string,
  thaCategory?: string,
): MacroResolution {
  const out: CatalogueNutrients = { ...foundation };
  const provenance = {} as Record<keyof CatalogueNutrients, MacroSource>;
  const notes: string[] = [];

  const presentBefore = MACRO_KEYS.filter((k) => present(foundation[k])).length;

  // Seed provenance from Foundation.
  for (const k of MACRO_KEYS) provenance[k] = present(foundation[k]) ? "foundation" : "missing";

  const missing = MACRO_KEYS.filter((k) => !present(out[k]));
  if (missing.length === 0) {
    return { nutrients: out, provenance, fallbackUsed: false, filledCount: 0, presentBefore, presentAfter: presentBefore, notes };
  }

  // Source 1 — SR Legacy reviewed table.
  const srRow = SR_LEGACY_MACROS[resolvedName.toLowerCase()];
  if (srRow) {
    for (const k of missing) {
      if (present(srRow[k])) {
        out[k] = srRow[k];
        provenance[k] = "sr_legacy";
      }
    }
    notes.push(`Completed missing macros from SR Legacy fdc ${srRow.fdcId} (Foundation lacked them).`);
  }

  // Source 2 — pure-fat derivation for any still-missing macros.
  const stillMissing = MACRO_KEYS.filter((k) => !present(out[k]));
  if (stillMissing.length > 0 && looksLikePureFat(resolvedName, thaCategory)) {
    for (const k of stillMissing) {
      out[k] = PURE_FAT_MACROS[k];
      provenance[k] = "derived_pure_fat";
    }
    notes.push("Derived missing macros from pure-fat identity (≈884 kcal, 100 g fat, 0 protein/carb/fibre per 100 g).");
  }

  const presentAfter = MACRO_KEYS.filter((k) => present(out[k])).length;
  const filledCount = presentAfter - presentBefore;

  return {
    nutrients: out,
    provenance,
    fallbackUsed: filledCount > 0,
    filledCount,
    presentBefore,
    presentAfter,
    notes,
  };
}
