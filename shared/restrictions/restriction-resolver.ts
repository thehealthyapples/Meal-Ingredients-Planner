/**
 * restriction-resolver.ts
 * =======================
 * Deterministic restriction matching utilities.
 *
 * Design constraints:
 * - No AI calls, no I/O, no database access, no side effects
 * - Case-insensitive and fully deterministic
 * - Uses library data only — no hardcoded allergen logic
 * - Designed for future expansion without interface changes
 *
 * Matching strategy:
 * - Alias matching: whole-word, so "nut" does not false-match "minute",
 *   and "soy" does not false-match "savoy".
 * - Derived / hidden ingredient matching: forward substring, so "tahini dressing"
 *   matches the derived entry "tahini", and "natural yoghurt" matches "yoghurt".
 * - First match per restriction definition wins; results are deduped by id.
 *
 * Backward compatibility:
 * - "nut_free" / "nut-free" / "nut free" / "nut allergy" / "nuts" / "nut"
 *   are treated as legacy aliases that expand to BOTH peanut and tree_nut.
 *   This is handled in getRestrictionMatches via LEGACY_ALIAS_EXPANSIONS.
 *   findRestrictionByAlias does NOT expand legacy aliases — it returns a single
 *   definition only and is not the right tool for household restriction resolution.
 */

import { RESTRICTION_DEFINITIONS } from './restriction-library.js';
import type {
  RestrictionDefinition,
  RestrictionMatch,
  RestrictionSourceType,
} from './restriction-types.js';

// ─── Internal normaliser ──────────────────────────────────────────────────────

/**
 * Normalise a restriction or ingredient term for case-insensitive comparison.
 * Replaces hyphens and underscores with spaces so "gluten-free", "gluten_free",
 * and "gluten free" all resolve to the same normalised form.
 */
function norm(s: string): string {
  return s.toLowerCase().trim().replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
}

// ─── Legacy expansion map ─────────────────────────────────────────────────────

/**
 * Maps stored/legacy hardRestriction strings that represent MULTIPLE canonical
 * restrictions to the set of canonical ids they should expand to.
 *
 * Used only in getRestrictionMatches — not in findRestrictionByAlias.
 *
 * Background: Phase 2 had a single nut_free definition. Phase 3 splits this
 * into peanut and tree_nut. Any stored "nut_free" value must now expand to both.
 * "nut" and "nuts" are also conservatively expanded to both, since a household
 * that entered "nut allergy" almost certainly intended both peanut and tree nut.
 */
const LEGACY_ALIAS_EXPANSIONS: Record<string, string[]> = {
  'nut free':    ['peanut', 'tree_nut'],
  'nut-free':    ['peanut', 'tree_nut'],
  'nut_free':    ['peanut', 'tree_nut'],
  'nut allergy': ['peanut', 'tree_nut'],
  'nuts':        ['peanut', 'tree_nut'],
  'nut':         ['peanut', 'tree_nut'],
};

/** Returns true if a normalised term is covered by the legacy expansion map. */
function isLegacyExpansion(normTerm: string): boolean {
  return Object.prototype.hasOwnProperty.call(LEGACY_ALIAS_EXPANSIONS, normTerm);
}

// ─── Matching helpers ─────────────────────────────────────────────────────────

/**
 * Whole-word check: returns true only when `needle` appears at a word boundary
 * within `haystack`. Prevents "nut" matching "minute", and "soy" matching "savoy".
 *
 * Word boundaries are space characters and string edges.
 * Example:
 *   wordBoundaryIncludes("peanut butter", "peanut")  → true
 *   wordBoundaryIncludes("minute rice",   "nut")     → false
 *   wordBoundaryIncludes("savoy cabbage", "soy")     → false
 *   wordBoundaryIncludes("nut butter",    "nut")     → true
 */
function wordBoundaryIncludes(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const idx = haystack.indexOf(needle);
  if (idx === -1) return false;

  const beforeOk = idx === 0 || haystack[idx - 1] === ' ';
  const afterIdx = idx + needle.length;
  const afterOk = afterIdx === haystack.length || haystack[afterIdx] === ' ';

  return beforeOk && afterOk;
}

/**
 * Forward substring check for derived and hidden ingredient entries.
 * The haystack (ingredient being tested) must contain the needle (library entry).
 *
 * Example:
 *   substringIncludes("tahini dressing", "tahini")  → true
 *   substringIncludes("natural yoghurt", "yoghurt") → true
 *   substringIncludes("tahini", "tahini dressing")  → false
 */
function substringIncludes(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return haystack.includes(needle);
}

// ─── Internal per-definition matcher ─────────────────────────────────────────

/**
 * Attempts to match a single normalised ingredient string against one
 * restriction definition. Returns the first (most authoritative) match
 * found, or null if no match. Checks in this order:
 *   1. id (whole-word, alias sourceType)
 *   2. aliases (whole-word, alias sourceType)
 *   3. derivedIngredients (forward substring, derived_ingredient sourceType)
 *   4. hiddenIngredients (forward substring, hidden_ingredient sourceType)
 */
function matchIngredientAgainstDefinition(
  normIngredient: string,
  definition: RestrictionDefinition,
): RestrictionMatch | null {
  function makeMatch(
    sourceType: RestrictionSourceType,
    sourceValue: string,
  ): RestrictionMatch {
    return { restriction: definition, matchedTerm: normIngredient, sourceType, sourceValue };
  }

  // 1. Check definition id (whole-word)
  const normId = norm(definition.id);
  if (wordBoundaryIncludes(normIngredient, normId)) {
    return makeMatch('alias', definition.id);
  }

  // 2. Check aliases (whole-word)
  for (const alias of definition.aliases) {
    const normAlias = norm(alias);
    if (wordBoundaryIncludes(normIngredient, normAlias)) {
      return makeMatch('alias', alias);
    }
  }

  // 3. Check derived ingredients (forward substring)
  for (const derived of definition.derivedIngredients) {
    const normDerived = norm(derived);
    if (substringIncludes(normIngredient, normDerived)) {
      return makeMatch('derived_ingredient', derived);
    }
  }

  // 4. Check hidden ingredients (forward substring)
  for (const hidden of definition.hiddenIngredients) {
    const normHidden = norm(hidden);
    if (substringIncludes(normIngredient, normHidden)) {
      return makeMatch('hidden_ingredient', hidden);
    }
  }

  return null;
}

// ─── Lookup utilities ─────────────────────────────────────────────────────────

/**
 * Find a restriction definition by its exact id.
 * Returns undefined if no definition has that id.
 * Case-insensitive; underscores and hyphens treated as spaces.
 *
 * @example
 * findRestrictionById('gluten')    // → gluten definition
 * findRestrictionById('peanut')    // → peanut definition
 * findRestrictionById('tree_nut')  // → tree_nut definition
 * findRestrictionById('sesame')    // → sesame definition
 * findRestrictionById('nut_free')  // → undefined (legacy — see getRestrictionMatches)
 */
export function findRestrictionById(id: string): RestrictionDefinition | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const normId = norm(id);
  return RESTRICTION_DEFINITIONS.find(d => norm(d.id) === normId);
}

/**
 * Find a restriction definition by alias, id, or display name.
 * Returns the first matching definition, or undefined.
 *
 * This is a single-result lookup — it does NOT expand legacy aliases to multiple
 * definitions. For household-level resolution (where "nut_free" should expand to
 * both peanut and tree_nut), use getRestrictionMatches instead.
 *
 * Case-insensitive; hyphens and underscores treated as spaces.
 *
 * @example
 * findRestrictionByAlias('coeliac')     // → gluten definition
 * findRestrictionByAlias('dairy-free')  // → dairy definition
 * findRestrictionByAlias('peanuts')     // → peanut definition
 * findRestrictionByAlias('tree nuts')   // → tree_nut definition
 * findRestrictionByAlias('tahini')      // → undefined (tahini is an ingredient, not an alias)
 * findRestrictionByAlias('sesame')      // → sesame definition
 */
export function findRestrictionByAlias(alias: string): RestrictionDefinition | undefined {
  if (!alias || typeof alias !== 'string') return undefined;
  const normAlias = norm(alias);
  if (!normAlias) return undefined;

  return RESTRICTION_DEFINITIONS.find(d => {
    if (norm(d.id) === normAlias) return true;
    if (norm(d.displayName) === normAlias) return true;
    return d.aliases.some(a => norm(a) === normAlias);
  });
}

// ─── Resolution utilities ─────────────────────────────────────────────────────

/**
 * Resolve which of the provided restriction definitions conflict with a
 * given ingredient string.
 *
 * Caller provides the restriction definitions to check against, allowing
 * resolution against a household's active restrictions only (a subset of
 * the full library).
 *
 * Returns one match per definition at most (deduplicated by definition id).
 * Returns an empty array when no conflict is found — never throws.
 *
 * @example
 * resolveIngredientRestrictions('tahini', [sesame_def])
 *   // → [{ restriction: sesame_def, sourceType: 'derived_ingredient', ... }]
 *
 * resolveIngredientRestrictions('natural yoghurt', [dairy_def])
 *   // → [{ restriction: dairy_def, sourceType: 'derived_ingredient', ... }]
 *
 * resolveIngredientRestrictions('savoy cabbage', [soy_def])
 *   // → []  (word-boundary matching: "soy" not at word boundary in "savoy")
 *
 * resolveIngredientRestrictions('rice', [gluten_def])
 *   // → []
 */
export function resolveIngredientRestrictions(
  ingredient: string,
  restrictions: RestrictionDefinition[],
): RestrictionMatch[] {
  if (!ingredient || typeof ingredient !== 'string') return [];
  if (!Array.isArray(restrictions) || restrictions.length === 0) return [];

  const normIngredient = norm(ingredient);
  if (!normIngredient) return [];

  const matches: RestrictionMatch[] = [];
  const seenIds = new Set<string>();

  for (const definition of restrictions) {
    if (!definition || seenIds.has(definition.id)) continue;
    const match = matchIngredientAgainstDefinition(normIngredient, definition);
    if (match) {
      matches.push(match);
      seenIds.add(definition.id);
    }
  }

  return matches;
}

/**
 * Resolve which of the provided restriction definitions conflict with any
 * content within a block of text (e.g. a recipe description or step).
 *
 * Semantically identical to resolveIngredientRestrictions for Phase 3.
 * Provided as a separate function to allow the implementation to diverge
 * in Phase 4 (e.g. tokenisation, phrase detection) without changing callers.
 *
 * Returns an empty array when no conflict is found — never throws.
 */
export function resolveTextRestrictions(
  text: string,
  restrictions: RestrictionDefinition[],
): RestrictionMatch[] {
  return resolveIngredientRestrictions(text, restrictions);
}

// ─── High-level API ───────────────────────────────────────────────────────────

/**
 * Resolve a household's raw hardRestrictions strings to canonical
 * RestrictionMatch records.
 *
 * Handles legacy aliases: "nut_free", "nut-free", "nut free", "nut allergy",
 * "nuts", "nut" all expand to BOTH peanut and tree_nut matches. This is the
 * correct Phase 3 behaviour — peanut and tree_nut are separate canonical
 * restrictions, but historically stored as one value.
 *
 * Deduplicates by definition id: if "gluten" and "coeliac" are both present,
 * a single gluten match is returned. If "nut_free" and "peanut" are both
 * present, peanut is returned only once.
 *
 * Unrecognised restriction strings are silently skipped (fail-safe).
 *
 * @example
 * getRestrictionMatches(['nut_free'])
 *   // → [{ restriction: peanut_def, ... }, { restriction: tree_nut_def, ... }]
 *
 * getRestrictionMatches(['gluten-free', 'coeliac'])
 *   // → [{ restriction: gluten_def, matchedTerm: 'gluten-free', ... }]
 *   // coeliac deduped — same definition
 *
 * getRestrictionMatches(['sesame'])
 *   // → [{ restriction: sesame_def, ... }]
 */
export function getRestrictionMatches(
  hardRestrictions: string[],
): RestrictionMatch[] {
  if (!Array.isArray(hardRestrictions)) return [];

  const matches: RestrictionMatch[] = [];
  const seenIds = new Set<string>();

  function addIfUnseen(definition: RestrictionDefinition, raw: string): void {
    if (seenIds.has(definition.id)) return;
    seenIds.add(definition.id);
    matches.push({
      restriction: definition,
      matchedTerm: raw,
      sourceType: 'alias',
      sourceValue: raw,
    });
  }

  for (const raw of hardRestrictions) {
    if (!raw || typeof raw !== 'string') continue;
    const normRaw = norm(raw);

    // Check legacy expansions first — one input → multiple canonical definitions
    if (isLegacyExpansion(normRaw)) {
      const expansionIds = LEGACY_ALIAS_EXPANSIONS[normRaw];
      for (const id of expansionIds) {
        const def = findRestrictionById(id);
        if (def) addIfUnseen(def, raw);
      }
      continue;
    }

    // Normal single-definition alias lookup
    const definition = findRestrictionByAlias(raw);
    if (!definition) continue;
    addIfUnseen(definition, raw);
  }

  return matches;
}

/**
 * Convenience: resolve household restriction strings to the set of active
 * RestrictionDefinitions, deduplicated.
 *
 * Equivalent to getRestrictionMatches(hardRestrictions).map(m => m.restriction),
 * but provided as a named function for use in uplift filtering and recipe
 * safety checks where only the definitions are needed.
 */
export function resolveActiveRestrictions(
  hardRestrictions: string[],
): RestrictionDefinition[] {
  return getRestrictionMatches(hardRestrictions).map(m => m.restriction);
}
