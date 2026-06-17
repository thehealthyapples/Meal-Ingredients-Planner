/**
 * health-benefits-model.ts
 * ========================
 * Shared, client-side **display model** for the THA Health Benefits experience.
 *
 * Purpose
 * -------
 * Give the two connected surfaces — the 30 Plants **Plant Diversity Report**
 * page and the Pantry **Nutrition Explore** mode — one common vocabulary and
 * one common adapter over the existing curated nutrition libraries, so they
 * always speak the same language.
 *
 * This module is **display only**. It does not fabricate, infer, or persist any
 * nutrition data. It reads existing curated sources:
 *   - nutrition-benefit-library.ts  (foods → key nutrients + summary)
 *   - pantry-knowledge.ts           (store-cupboard "why it matters" context)
 *
 * Trust guardrails (THA Nutrition Enhancement Philosophy)
 * -------------------------------------------------------
 *   - A structured Health Benefit → Nutrient registry does **not exist yet**.
 *     Until a separately-approved data-population task creates it, every
 *     `healthBenefits` array returned here is empty and callers must render a
 *     safe empty state. We never derive outcome claims from free-text
 *     `supports`/`tags`, and we never call an AI to invent them.
 *   - Health benefits, when they exist, are educational summaries — not medical
 *     advice. Surfaces show HEALTH_DISCLAIMER.
 */

import { normaliseForReuse } from "@/lib/ingredient-reuse";
import {
  getNutritionBenefit,
  getAllNutritionBenefits,
} from "@/lib/nutrition-benefit-library";
import { getPantryKnowledge } from "@/lib/pantry-knowledge";

// ─── User-facing vocabulary ─────────────────────────────────────────────────
// Single source of truth for the words both surfaces must use. Importing these
// (rather than hard-coding strings) keeps the two surfaces in lockstep.

/** Column headers — the visible report/table structure. */
export const COLUMN_LABELS = {
  plant: "Plant",
  healthBenefits: "Health Benefits",
  keyNutrients: "Key Nutrients",
  meals: "Meals",
} as const;

/** Section + control language used inside expanded rows and the Explore hub. */
export const TERMINOLOGY = {
  healthBenefits: "Health Benefits",
  moreHealthBenefits: "More Health Benefits",
  keyNutrients: "Key Nutrients",
  meals: "Meals",
  broadenYourVariety: "Broaden Your Variety",
} as const;

/**
 * Safe empty-state copy. Use these whenever the underlying curated data does not
 * (yet) carry a value — never invent a substitute.
 */
export const EMPTY_STATES = {
  noHealthBenefits: "No health benefits recorded yet",
  healthBenefitsComingSoon: "Health benefit data coming soon",
  noKeyNutrients: "Key nutrient data coming soon",
  noVariety: "No variety suggestions recorded yet",
} as const;

export const HEALTH_DISCLAIMER =
  "Health benefits and key nutrients are educational summaries, not medical advice.";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * A single health-outcome relationship for a food.
 *
 * Reserved for the future Health Benefit registry (Benefit → Nutrient → Food).
 * No source currently produces these, so arrays of this type are always empty
 * for now — the shape exists so both surfaces are ready to render real data the
 * moment the population task lands, without further UI changes.
 */
export interface HealthBenefit {
  /** Outcome, e.g. "Sleep Quality". */
  name: string;
  /** Optional decorative emoji, e.g. "😴". */
  emoji?: string;
  /** The bridging key nutrient that evidences the benefit, e.g. "Magnesium". */
  nutrient?: string;
}

/** The unified, display-ready profile both surfaces consume. */
export interface FoodHealthProfile {
  canonicalKey: string;
  displayName: string;
  category: string | null;
  /** Real, existing curated data. */
  keyNutrients: string[];
  /** Real, existing curated one-line summary (or null). */
  summary: string | null;
  /**
   * Outcome-level benefits. Empty until the Health Benefit registry is
   * populated — callers must handle the empty case with EMPTY_STATES copy.
   */
  healthBenefits: HealthBenefit[];
  /** Convenience flag so callers don't re-check `.length`. */
  hasHealthBenefitData: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDisplayName(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Builds the shared display profile for an ingredient from existing curated
 * data. Returns null only when nothing is known at all (no benefit-library
 * entry *and* no pantry-knowledge entry) — callers can then show an item with a
 * full empty state, or skip it, as appropriate.
 *
 * `healthBenefits` is intentionally always `[]` until the registry exists.
 */
export function getFoodHealthProfile(
  ingredient: string,
  opts?: { displayName?: string; category?: string | null },
): FoodHealthProfile | null {
  const canonicalKey = normaliseForReuse(ingredient);
  const benefit = getNutritionBenefit(ingredient);
  const knowledge = getPantryKnowledge(canonicalKey);

  if (!benefit && !knowledge && !opts?.displayName) return null;

  const summary = benefit?.summary ?? knowledge?.whyItMatters ?? null;

  return {
    canonicalKey,
    displayName:
      opts?.displayName ?? benefit?.name ?? toDisplayName(canonicalKey),
    category: opts?.category ?? benefit?.category ?? null,
    keyNutrients: benefit?.keyNutrients ?? [],
    summary,
    // No structured benefit registry yet — honest empty until data population.
    healthBenefits: [],
    hasHealthBenefitData: false,
  };
}

// ─── Pantry Explore browse sources ──────────────────────────────────────────
// These power the evergreen "Nutrition Knowledge Hub". They are derived purely
// from the existing curated benefit library.

/** All curated foods, as display profiles, sorted A→Z. */
export function listLibraryFoods(): FoodHealthProfile[] {
  return getAllNutritionBenefits()
    .map((b) =>
      getFoodHealthProfile(b.name, {
        displayName: b.name,
        category: b.category,
      }),
    )
    .filter((p): p is FoodHealthProfile => p !== null)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export interface NutrientGroup {
  nutrient: string;
  foods: string[];
}

/**
 * Inverts the curated food library into a Nutrient → Foods index, so Explore
 * can be browsed by Key Nutrient. Real data only; no inference.
 */
export function buildNutrientIndex(): NutrientGroup[] {
  const map = new Map<string, Set<string>>();
  for (const b of getAllNutritionBenefits()) {
    for (const nutrient of b.keyNutrients) {
      if (!map.has(nutrient)) map.set(nutrient, new Set());
      map.get(nutrient)!.add(b.name);
    }
  }
  return Array.from(map.entries())
    .map(([nutrient, foods]) => ({
      nutrient,
      foods: Array.from(foods).sort(),
    }))
    .sort((a, b) => a.nutrient.localeCompare(b.nutrient));
}

/**
 * The set of browsable Health Benefit topics. Empty until the Health Benefit
 * registry is populated — Explore renders an empty state for this lens today.
 */
export function listHealthBenefitTopics(): HealthBenefit[] {
  return [];
}
