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
 * - Derived / hidden ingredient matching: boundary-aware (SURF1C2). The term must
 *   begin at a word boundary and end at a boundary or a regular plural, so "sardine"
 *   still matches "sardines" and "yoghurt" still matches "natural yoghurt", but the
 *   meat term "ragu" no longer matches inside "asparagus". Was raw forward substring.
 * - excludedCompounds matching: raw substring (the plant-substitute early exit, where
 *   a broad match is the safe direction) — unchanged.
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
 *
 * Diacritics are folded (SURF1B4), so "pâté" matches the `pate` alias, "ragù"
 * matches `ragu`, and "crème fraîche" matches the `creme fraiche` derived entry.
 * Both sides of every comparison pass through here, so no accent-stripped
 * duplicate needs to exist in the library. This is the same normalisation
 * `dietRules` has always applied to its own text; the canonical library did not,
 * and every accented ingredient string was silently missed.
 */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // Typographic punctuation → its ASCII form. A recipe title written in a word
    // processor says "Goat’s Cheese" with U+2019, and the library says "goat's
    // cheese" with U+0027. Without this the excludedCompound does not match, the
    // `goat` alias does, and a household avoiding meat is refused a cheese salad.
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .trim()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ');
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
 * A word boundary is a string edge or any character that is not a letter or a
 * digit — punctuation included (SURF1B4). Before SURF1B4 only a literal space
 * counted, which meant the most common ingredient string in any recipe on earth
 * was invisible to the alias matcher:
 *
 *   "2 eggs, beaten"   → "eggs" is followed by a comma → NOT a match  (fail-OPEN)
 *   "beef, diced"      → "beef" is followed by a comma → NOT a match  (fail-OPEN)
 *
 * Every alias in the library is short by design (`beef`, `ham`, `lamb`, `cod`,
 * `egg`, `milk`) precisely because whole-word matching is supposed to make short
 * words safe. Punctuation-blindness quietly took that guarantee away. The
 * boundary is now the same one `dietRules`' `\b` regex has always used, which is
 * why the pattern path can delegate here without losing a single match.
 *
 * Only aliases are matched this way. Derived, hidden and excluded-compound terms
 * are forward substrings and are unaffected.
 *
 * Example:
 *   wordBoundaryIncludes("peanut butter", "peanut")  → true
 *   wordBoundaryIncludes("2 eggs, beaten", "eggs")   → true   (was false)
 *   wordBoundaryIncludes("minute rice",   "nut")     → false
 *   wordBoundaryIncludes("savoy cabbage", "soy")     → false
 *   wordBoundaryIncludes("chamomile tea", "ham")     → false
 */
function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && /[a-z0-9]/.test(ch);
}

function wordBoundaryIncludes(haystack: string, needle: string): boolean {
  if (!needle) return false;

  let from = 0;
  for (;;) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) return false;

    const beforeOk = !isWordChar(haystack[idx - 1]);
    const afterOk = !isWordChar(haystack[idx + needle.length]);
    if (beforeOk && afterOk) return true;

    from = idx + 1;
  }
}

/**
 * Forward substring check. The haystack must contain the needle anywhere.
 *
 * Retained ONLY for excludedCompounds — the plant-substitute early exit, where a
 * broad match is the safe direction (it protects "vegan sausage roll" from the meat
 * gate). Derived and hidden ingredients no longer use this; see below for why.
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

/**
 * Word-start containment for derived and hidden ingredient entries (SURF1C2).
 *
 * A term matches only when it begins at a WORD BOUNDARY (a string edge, or any
 * character that is not a letter or digit). What FOLLOWS the term is unrestricted, so
 * plurals and compounds keep matching exactly as forward substring did — they simply
 * add more letters to the END of a term that still starts the word.
 *
 * ── The defect this replaces ─────────────────────────────────────────────────
 * Derived and hidden terms were matched by RAW forward substring. That was chosen to
 * "handle plurals and compounds for free" — `sausage` catches `sausages`, `cheese`
 * catches `cheesecake`. But a raw substring also matches a term buried INSIDE an
 * unrelated word, and the library carries short terms:
 *
 *   "aspa·ragu·s"  contains the meat hidden-term "ragu"  → asparagus flagged as MEAT
 *
 * SURF1C1 found this live: the canonical gate refused every asparagus meal to every
 * vegetarian, vegan and meat-restricted household, and cost 52 founding recipes the
 * labels their ingredients earn. It over-restricts — a fail-CLOSED defect, which is
 * why four fail-open safety workstreams never saw it — but it is a real defect, and
 * exactly the class the library's own authoring note warns of ("`ham` here WOULD match
 * `chamomile`"). The cheese names `brie`/`edam`/`feta` were already moved to aliases
 * for this reason; `ragu` was missed, and relocating terms one at a time is not a fix.
 *
 * ── Why word-START, and not also word-END ────────────────────────────────────
 * Requiring only the LEFT boundary is deliberate, and it is the whole subtlety. The
 * false positives all share one shape — the term sits after a letter (`aspa·ragu`s,
 * `c·ham`omile, `honey·dew`, `butter·nut`) — so the left boundary is what removes
 * every one of them. Constraining the RIGHT side as well would also remove genuine
 * compounds where the allergen leads the word:
 *
 *   KEPT   "cheesecake" (cheese, DAIRY) · "breaded plaice" (bread, GLUTEN)
 *          "sardines" · "prawns" · "eggs" (singular term + plural -s)
 *          "ragu" · "ragù" (folded) · "beef ragu" · "natural yoghurt"
 *   DROPPED "asparagus" (ragu) · "chamomile" (ham) · "honeydew"/"butternut"
 *          — the term is an infix; the character to its left is a letter
 *
 * `cheesecake` is dairy and `breaded` is gluten; a plural-only right rule dropped both
 * (measured), which is a fail-OPEN. Word-start keeps them and still kills asparagus.
 *
 * The match set can only SHRINK relative to raw substring — every accepted match was
 * already a substring occurrence — so no ingredient newly matches a restriction and no
 * meal that was refused becomes allowed. Every removed match is a coincidental infix
 * ceasing to falsely restrict, verified term-by-term across the live cookbook.
 *
 * Diacritics and typographic punctuation are folded by `norm` before this runs, so
 * "ragù" and "pâté" arrive as "ragu" and "pate".
 */
function boundaryAwareIncludes(haystack: string, needle: string): boolean {
  if (!needle) return false;

  let from = 0;
  for (;;) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) return false;

    // The term must begin at a word boundary — this is what stops "ragu" ⊂ "asparagus".
    // What follows is unconstrained, so "sardine"→"sardines" and "cheese"→"cheesecake"
    // are preserved exactly as raw substring had them.
    if (!isWordChar(haystack[idx - 1])) return true;

    from = idx + 1;
  }
}

// ─── Internal per-definition matcher ─────────────────────────────────────────

/**
 * Attempts to match a single normalised ingredient string against one
 * restriction definition. Returns the first (most authoritative) match
 * found, or null if no match. Checks in this order:
 *   1. id (whole-word, alias sourceType)
 *   2. aliases (whole-word, alias sourceType)
 *   3. derivedIngredients (boundary-aware, derived_ingredient sourceType)
 *   4. hiddenIngredients (boundary-aware, hidden_ingredient sourceType)
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

  // 0. Check excludedCompounds — plant-based alternatives that share a keyword
  //    with a genuine restricted ingredient must never match this definition.
  //    This is an unconditional early exit: if any excluded compound is found
  //    as a substring of the normalised ingredient, return null immediately.
  if (definition.excludedCompounds && definition.excludedCompounds.length > 0) {
    for (const compound of definition.excludedCompounds) {
      if (substringIncludes(normIngredient, norm(compound))) {
        return null;
      }
    }
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

  // 3. Check derived ingredients (boundary-aware: term at a word boundary, plural OK)
  for (const derived of definition.derivedIngredients) {
    const normDerived = norm(derived);
    if (boundaryAwareIncludes(normIngredient, normDerived)) {
      return makeMatch('derived_ingredient', derived);
    }
  }

  // 4. Check hidden ingredients (boundary-aware: term at a word boundary, plural OK)
  for (const hidden of definition.hiddenIngredients) {
    const normHidden = norm(hidden);
    if (boundaryAwareIncludes(normIngredient, normHidden)) {
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

// ─── Enforceability (SURF1B2) ─────────────────────────────────────────────────

/**
 * True when a declared restriction string resolves to at least one canonical
 * definition — i.e. when THA can actually ENFORCE it.
 *
 * This is the question every write door must ask before it stores a restriction.
 * Until SURF1B2 nothing asked it, and the answer was silently "no" for `meat`,
 * `fish` and `honey`: values THA accepted on the profile, showed back to the
 * household, and could not act on. A restriction the platform cannot enforce is
 * worse than one it never accepted, because the household believes it is protected.
 *
 * @example
 * isEnforceableRestriction('Gluten-Free')  // → true
 * isEnforceableRestriction('coeliac')      // → true  (alias)
 * isEnforceableRestriction('Nuts')         // → true  (legacy → peanut + tree_nut)
 * isEnforceableRestriction('meat')         // → true  (Phase 4)
 * isEnforceableRestriction('kiwi')         // → false (no canonical definition)
 */
export function isEnforceableRestriction(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return getRestrictionMatches([value]).length > 0;
}

/**
 * The subset of `values` that resolve to NO canonical definition — the ones THA
 * would accept and be unable to enforce. Empty means every value is enforceable.
 *
 * Order and casing are preserved so the caller can name the offending value back
 * to the household exactly as they typed it.
 */
export function unenforceableRestrictions(values: string[]): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter(v => typeof v === 'string' && v.trim().length > 0)
               .filter(v => !isEnforceableRestriction(v));
}

/** Every canonical restriction id in the library. The list THA can enforce. */
export function listRestrictionIds(): string[] {
  return RESTRICTION_DEFINITIONS.map(d => d.id);
}
