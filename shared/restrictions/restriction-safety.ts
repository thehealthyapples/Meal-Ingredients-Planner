/**
 * restriction-safety.ts
 * =====================
 * Pure, deterministic restriction safety evaluation for the product analyser.
 *
 * Design:
 * - No I/O, no database access, no AI calls
 * - Usable client-side (bundled with the frontend)
 * - Uses the canonical restriction resolver and substitution rules
 * - Never claims household-safe unless deterministic checks pass
 * - Fails safely: unknown restrictions produce no false positives
 */

import {
  resolveActiveRestrictions,
  resolveIngredientRestrictions,
} from './restriction-resolver.js';
import { matchSubstitutionRulesWithConflicts } from '../substitution-rules.js';
import type { RestrictionSourceType } from './restriction-types.js';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * The overall safety status for a single restriction conflict.
 *
 * warning  — restriction ingredient detected; a known alternative may exist
 * unsafe   — restriction ingredient detected; no safe deterministic substitute found
 * safe     — no restriction conflicts detected (only set when restrictions are known)
 * unknown  — eater data absent or restriction not in canonical library
 */
export type RestrictionSafetyStatus = 'warning' | 'unsafe' | 'safe' | 'unknown';

/** One household member's restriction profile. */
export interface EaterProfile {
  displayName: string;
  hardRestrictions: string[];
}

/**
 * One restriction safety finding.
 * Produced per (canonical restriction × matched ingredient) pair.
 * Not persisted — computed on demand from live household data.
 */
export interface RestrictionSafetyResult {
  /** Overall safety status for this finding. */
  status: RestrictionSafetyStatus;
  /** Names of household members affected by this restriction. */
  affectedEaters: string[];
  /** Canonical restriction id (e.g. "sesame", "peanut"). */
  restrictionId: string;
  /** Human-readable restriction name (e.g. "Sesame"). */
  restrictionName: string;
  /** The ingredient string that triggered this match. */
  matchedIngredient: string;
  /** How the match was established. */
  matchedVia: RestrictionSourceType;
  /**
   * The first safe deterministic substitute from substitution rules, if any.
   * This is informational — it does not imply the product is adaptable.
   * For packaged products, it represents what the ingredient could be replaced
   * with in a home-cooked equivalent.
   */
  selectedSubstitution: string | null;
  /** Substitutes that were rejected due to cross-restriction conflicts. */
  rejectedSubstitutions: Array<{
    replacement: string;
    conflictingRestrictions: string[];
  }>;
  /**
   * Explanation of why a substitute was rejected, if all were rejected.
   * Null when a safe substitute was found or substitution is not applicable.
   */
  conflictReason: string | null;
  /** Plain-English summary suitable for display. */
  explanation: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Normalises an ingredient string for resolver input.
 * Strips parenthetical content, percentages, and punctuation that would
 * prevent word-boundary matching (e.g. "Wheat Flour (Wheat)" → "Wheat Flour Wheat").
 */
function normaliseIngredientForResolver(ingredient: string): string {
  return ingredient
    .replace(/[(),;:[\]{}*%|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses product ingredient text into individual ingredient name segments.
 * Splits on commas and semicolons; strips leading quantities, percentages,
 * and E-number references.
 */
export function parseIngredientText(ingredientsText: string): string[] {
  return ingredientsText
    .split(/[,;]/)
    .map(seg =>
      seg
        .replace(/\([^)]*\)/g, '')   // remove parenthetical notes
        .replace(/\b\d+(?:\.\d+)?%/g, '')  // remove percentages
        .replace(/\be\d{3,4}[a-z]?\b/gi, '') // remove E-numbers
        .trim()
    )
    .filter(seg => seg.length >= 2);
}

// ─── Core computation ─────────────────────────────────────────────────────────

/**
 * Evaluates restriction safety for a product against all household eaters.
 *
 * Returns one RestrictionSafetyResult per (restriction × matched ingredient) pair.
 * Returns an empty array when eater profiles are empty or no restrictions are set.
 * Never throws — unknown restrictions are silently ignored (fail-safe).
 *
 * @param ingredients - Individual ingredient name strings from the product.
 *   Use the parsed analysis.ingredients array if available; fall back to
 *   parseIngredientText(product.ingredients_text).
 * @param eaterProfiles - Household eater profiles with their hardRestrictions.
 *   An empty array produces an empty result (no false positives).
 * @param allHardRestrictions - Union of all eater hardRestrictions — passed to
 *   the substitution engine for cross-restriction conflict checking.
 */
export function computeRestrictionSafety(
  ingredients: string[],
  eaterProfiles: EaterProfile[],
): RestrictionSafetyResult[] {
  if (!ingredients.length || !eaterProfiles.length) return [];

  // Build union of all restriction strings for substitution conflict checking
  const allHardRestrictions = Array.from(
    new Set(eaterProfiles.flatMap(e => e.hardRestrictions ?? []).filter(Boolean))
  );
  if (!allHardRestrictions.length) return [];

  // Resolve canonical definitions from all eaters' restrictions
  const allCanonicalDefs = resolveActiveRestrictions(allHardRestrictions);
  if (!allCanonicalDefs.length) return [];

  // Build a map: restrictionId → eater names that have it
  const eatersByRestrictionId = new Map<string, string[]>();
  for (const eater of eaterProfiles) {
    const eatersRestrictions = resolveActiveRestrictions(eater.hardRestrictions ?? []);
    for (const def of eatersRestrictions) {
      if (!eatersByRestrictionId.has(def.id)) {
        eatersByRestrictionId.set(def.id, []);
      }
      eatersByRestrictionId.get(def.id)!.push(eater.displayName);
    }
  }

  const results: RestrictionSafetyResult[] = [];
  // Deduplicate by (restrictionId, normalisedIngredient) to avoid duplicate cards
  const seen = new Set<string>();

  for (const rawIngredient of ingredients) {
    const preparedIngredient = normaliseIngredientForResolver(rawIngredient);
    if (!preparedIngredient) continue;

    const matches = resolveIngredientRestrictions(preparedIngredient, allCanonicalDefs);

    for (const match of matches) {
      const dedupKey = `${match.restriction.id}::${preparedIngredient.toLowerCase()}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      const affectedEaters = eatersByRestrictionId.get(match.restriction.id) ?? [];

      // Look up substitution rules using the original ingredient for pattern matching
      const { adjustments, conflicts } = matchSubstitutionRulesWithConflicts(
        [rawIngredient],
        allHardRestrictions,
      );

      const adjustment = adjustments.find(a =>
        a.matchedIngredient.toLowerCase().includes(rawIngredient.toLowerCase().substring(0, 6))
        || rawIngredient.toLowerCase().includes(a.matchedIngredient.toLowerCase().substring(0, 6))
      ) ?? adjustments[0] ?? null;

      // Find rejected substitutions for this ingredient's rule
      const conflictEntry = conflicts.find(c =>
        c.matchedIngredient.toLowerCase() === rawIngredient.toLowerCase()
        || rawIngredient.toLowerCase().includes(c.matchedIngredient.toLowerCase().substring(0, 4))
      );

      const selectedSubstitution = adjustment?.replacement ?? null;
      const rejectedSubstitutions = conflictEntry?.rejectedStrategies ?? [];
      const allBlocked = !adjustment && conflictEntry != null;

      const status: RestrictionSafetyStatus = allBlocked ? 'unsafe' : 'warning';

      const matchedViaLabel =
        match.sourceType === 'alias' ? 'by name' :
        match.sourceType === 'derived_ingredient' ? 'as a derived ingredient' :
        'as a hidden ingredient';

      const eaterLabel = affectedEaters.length > 0
        ? affectedEaters.join(', ')
        : 'household member';

      results.push({
        status,
        affectedEaters,
        restrictionId: match.restriction.id,
        restrictionName: match.restriction.displayName,
        matchedIngredient: rawIngredient,
        matchedVia: match.sourceType,
        selectedSubstitution,
        rejectedSubstitutions,
        conflictReason: allBlocked
          ? `No deterministic safe substitute found — all options conflict with other active restrictions`
          : null,
        explanation: selectedSubstitution
          ? `${match.restriction.displayName} detected for ${eaterLabel} — matched ${matchedViaLabel}. A known alternative exists.`
          : `${match.restriction.displayName} detected for ${eaterLabel} — matched ${matchedViaLabel}. Needs review.`,
      });
    }
  }

  return results;
}
