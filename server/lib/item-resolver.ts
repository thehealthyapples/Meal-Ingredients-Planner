/**
 * Shared Item Resolution Layer
 *
 * Every item entering the shopping list — whether from manual add, Check
 * Cupboard, basket edit, recipe/social import, or any future source — must
 * pass through resolveItem() before being written to the DB.
 *
 * Responsibilities:
 *  1. Normalise raw text into a clean product name.
 *  2. Enforce canonical categories via a hard map (prevents "toilet roll → bakery").
 *  3. Detect ambiguous umbrella terms and surface suggestions (e.g. "berries").
 *  4. Assign a resolution_state so every item has a lifecycle in DB.
 *  5. Never silently force a bad category — prefer needs_review over a wrong guess.
 */

import { normalizeName, detectIngredientCategory } from './ingredient-utils';
import canonicalMapData from '../data/canonical-map.json';
import ambiguityMapData from '../data/ambiguity-map.json';

// ── Resolution state ──────────────────────────────────────────────────────────

export type ResolutionState = 'raw' | 'needs_review' | 'resolved' | 'matched_to_product';

export type ReviewReason =
  | 'unrecognised_item'  // category fell through to 'other'
  | 'ambiguous_term'     // user entered an umbrella term with multiple specific variants
  | 'low_confidence'     // keyword match but confidence is marginal
  | 'category_conflict'; // incoming category differs from canonical map

// ── Resolved item payload ─────────────────────────────────────────────────────

export interface ResolvedItem {
  /** The raw text the user typed, preserved for audit */
  originalText: string;
  /** Clean product name for display */
  productName: string;
  /** Lowercased, descriptor-stripped name for deduplication */
  normalizedName: string;
  /** Authoritative resolved name from canonical map (if found) */
  canonicalName: string | null;
  /** Top-level category (produce, dairy, household, etc.) */
  category: string;
  /** Finer sub-classification (root_vegetable, soft_fruit, etc.) */
  subcategory: string | null;
  /** How confident we are in the resolution */
  resolutionState: ResolutionState;
  /** Machine-readable reason for needs_review state */
  reviewReason: string | null;
  /** JSON-encoded string[] of specific variants when reason=ambiguous_term */
  reviewSuggestions: string | null;
  /** Human-readable note for the UI (populates validationNote) */
  validationNote: string | null;
  /** Boolean flag kept for backward compatibility */
  needsReview: boolean;
}

// ── Canonical category map ────────────────────────────────────────────────────
// Items listed here ALWAYS map to the given category/subcategory regardless of
// what the keyword-based detector would infer.  Add entries here to prevent
// household goods landing in food categories.
//
// Data lives in server/data/canonical-map.json — edit that file to add entries.
// Behaviour is unchanged: canonical entries are checked FIRST, before fuzzy
// keyword detection, and always win over caller-supplied categories.

interface CanonicalEntry {
  canonicalName: string;
  category: string;
  subcategory: string | null;
}

// Keys are lowercase normalised strings.
// JSON is imported statically so esbuild bundles it inline — no runtime file I/O.
const CANONICAL_MAP: Record<string, CanonicalEntry> = canonicalMapData as Record<string, CanonicalEntry>;

// ── Ambiguity dictionary ──────────────────────────────────────────────────────
// Keys are normalised lowercase umbrella terms.
// Values are objects with:
//   mode        — "single" (pick one) or "multi" (pick several)
//   suggestions — ordered list of specific variants the user probably meant
//
// When a key matches, the item is marked needs_review + ambiguous_term so the UI
// can present suggestion chips or checkboxes depending on mode.
//
// Data lives in server/data/ambiguity-map.json — edit that file to add entries.

interface AmbiguityEntry {
  mode: 'single' | 'multi';
  suggestions: string[];
}

// JSON is imported statically so esbuild bundles it inline — no runtime file I/O.
const AMBIGUITY_MAP: Record<string, AmbiguityEntry> = ambiguityMapData as Record<string, AmbiguityEntry>;

// ── Confidence thresholds ─────────────────────────────────────────────────────

// Minimum keyword-match confidence to consider an item resolved vs needs_review.
// Currently the keyword detector is binary (match / no match) so we use a
// categorical threshold: 'other' is the only failing category.
const UNCERTAIN_CATEGORIES = new Set(['other']);

// ── Modifier-aware category detection ────────────────────────────────────────
// normalizeName() strips modifier words like "frozen", "tinned", "dried" before
// detectIngredientCategory() sees the name.  This means "frozen mixed veg" loses
// the "frozen" signal and falls through to 'other'.
//
// This function reads the RAW product name (post quantity-strip, pre-normalize)
// and returns the correct category if a strong modifier is present, or null if
// no modifier is detected (falls through to normal keyword detection).
//
// Rules:
//   frozen <anything>  → 'frozen'   — always wins; never falls to 'other'
//   tinned/canned <x>  → 'tinned'   — matches "tinned tomatoes", "canned beans"
//   dried <anything>   → 'pantry'   — dried goods live in pantry
//
// This is deterministic and modifier-specific.  It does not guess.

function detectModifierCategory(productName: string): string | null {
  const lower = productName.toLowerCase().trim();
  if (/^frozen\b/.test(lower)) return 'frozen';
  if (/^(tinned|canned|tin of|can of)\b/.test(lower)) return 'tinned';
  if (/^dried\b/.test(lower)) return 'pantry';
  return null;
}

// ── Shared category resolution helper ────────────────────────────────────────
// Precedence: canonical → modifier → caller → keyword-detected → "other"
// callerCategory values of null, 'uncategorised', and 'other' are not trusted
// (they represent missing data or a previously failed resolution).

export function resolveCategory(
  canonical: CanonicalEntry | null,
  modifierCategory: string | null,
  callerCategory: string | null | undefined,
  normalizedName: string,
): string {
  if (canonical?.category) return canonical.category;
  if (modifierCategory) return modifierCategory;
  if (
    callerCategory != null &&
    callerCategory !== 'uncategorised' &&
    callerCategory !== 'other'
  ) {
    return callerCategory;
  }
  const kw = detectIngredientCategory(normalizedName);
  return UNCERTAIN_CATEGORIES.has(kw) ? 'other' : kw;
}

// ── Main resolver ─────────────────────────────────────────────────────────────

export interface ResolveOptions {
  /**
   * Category supplied by the caller (e.g. already inferred by an import flow).
   * When provided the resolver skips keyword detection but still validates
   * against the canonical map to catch category conflicts.
   */
  callerCategory?: string | null;
}

export function resolveItem(rawText: string, options: ResolveOptions = {}): ResolvedItem {
  const originalText = rawText.trim();

  // 1. Normalise the name for matching and deduplication
  const productName = stripLeadingQuantity(originalText);
  const normalizedName = normalizeName(productName);
  const lowerKey = normalizedName.toLowerCase();

  // 2. Check canonical map first — this enforces correct categories for known items
  const canonical = lookupCanonical(lowerKey, productName);

  // 3. Check ambiguity dictionary — skip if canonical entry already exists.
  // A canonical match means we already know exactly what this item is (e.g. the
  // user picked "prawns" from a seafood picker and "prawns" is in canonical-map),
  // so re-running ambiguity would cause a loop.
  const ambiguity = canonical ? null : lookupAmbiguity(lowerKey, productName);
  if (ambiguity) {
    // Use canonical category if found, otherwise try modifier (e.g. "frozen berries"
    // should be category=frozen even though "berries" is ambiguous), then callerCategory,
    // then 'other' as last resort.
    const modCat = detectModifierCategory(productName);
    return {
      originalText,
      productName,
      normalizedName,
      canonicalName: canonical?.canonicalName ?? null,
      category: resolveCategory(canonical, modCat, options.callerCategory, normalizedName),
      subcategory: canonical?.subcategory ?? null,
      resolutionState: 'needs_review',
      reviewReason: 'ambiguous_term',
      // Encode both the suggestions list and the selection mode so the UI
      // can decide between single-select chips and multi-select checkboxes
      // without any client-side string matching.
      reviewSuggestions: JSON.stringify({ items: ambiguity.suggestions, mode: ambiguity.mode }),
      validationNote: `"${productName}" could refer to several specific items — please pick one`,
      needsReview: true,
    };
  }

  // 4. Canonical map hit — high confidence, correct category enforced
  if (canonical) {
    // If the caller supplied a category that conflicts with the canonical map, flag it.
    if (
      options.callerCategory != null &&
      options.callerCategory !== canonical.category &&
      options.callerCategory !== 'uncategorised'
    ) {
      return {
        originalText,
        productName,
        normalizedName,
        canonicalName: canonical.canonicalName,
        category: canonical.category,        // canonical wins — do not use caller's value
        subcategory: canonical.subcategory,
        resolutionState: 'needs_review',
        reviewReason: 'category_conflict',
        reviewSuggestions: null,
        validationNote: `Category was "${options.callerCategory}" but canonical map says "${canonical.category}"`,
        needsReview: true,
      };
    }

    return {
      originalText,
      productName,
      normalizedName,
      canonicalName: canonical.canonicalName,
      category: canonical.category,
      subcategory: canonical.subcategory,
      resolutionState: 'resolved',
      reviewReason: null,
      reviewSuggestions: null,
      validationNote: null,
      needsReview: false,
    };
  }

  // 5. No canonical entry — modifier-aware category detection.
  //
  // Resolution order:
  //   a) callerCategory if it is a trusted explicit value (not null / uncategorised / other)
  //   b) modifier prefix on the raw productName  (frozen → frozen, tinned → tinned, dried → pantry)
  //   c) keyword detection on the normalised name (existing behaviour)
  //
  // callerCategory='other' is intentionally NOT trusted here: it is the fallback value
  // that gets stored when a previous resolution failed, so we re-derive rather than
  // perpetuate the weak assignment.  This is essential for the rename flow — editing
  // "mixed veg" → "frozen mixed veg" must not inherit the old 'other' category.
  const modifierCategory = detectModifierCategory(productName);
  const detectedCategory = resolveCategory(null, modifierCategory, options.callerCategory, normalizedName);

  if (UNCERTAIN_CATEGORIES.has(detectedCategory)) {
    return {
      originalText,
      productName,
      normalizedName,
      canonicalName: null,
      category: detectedCategory,
      subcategory: null,
      resolutionState: 'needs_review',
      reviewReason: 'unrecognised_item',
      reviewSuggestions: null,
      validationNote: 'Item not confidently recognised — please verify',
      needsReview: true,
    };
  }

  // Keyword match — resolved
  return {
    originalText,
    productName,
    normalizedName,
    canonicalName: null,
    category: detectedCategory,
    subcategory: null,
    resolutionState: 'resolved',
    reviewReason: null,
    reviewSuggestions: null,
    validationNote: null,
    needsReview: false,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Strip a leading quantity from the text (e.g. "2 chicken breasts" → "chicken breasts").
 * Mirrors the logic already in the POST route so the resolver is self-contained.
 */
function stripLeadingQuantity(text: string): string {
  const m = text.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  return m ? m[2].trim() : text.trim();
}

/**
 * Look up a canonical entry by trying successively shorter sub-phrases of the
 * normalised name.  This handles inputs like "fresh blueberries" which should
 * resolve to "blueberries".
 */
function lookupCanonical(lowerKey: string, rawProductName: string): CanonicalEntry | null {
  // Exact match
  if (CANONICAL_MAP[lowerKey]) return CANONICAL_MAP[lowerKey];

  // Partial match: check if any canonical key is contained in the normalised name
  // (longest first so "toilet roll" beats "roll")
  const sortedKeys = Object.keys(CANONICAL_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lowerKey.includes(key)) return CANONICAL_MAP[key];
  }

  // Also try the raw product name lowercased in case normalizeName stripped useful info
  const lowerRaw = rawProductName.toLowerCase();
  if (CANONICAL_MAP[lowerRaw]) return CANONICAL_MAP[lowerRaw];
  for (const key of sortedKeys) {
    if (lowerRaw.includes(key)) return CANONICAL_MAP[key];
  }

  return null;
}

/**
 * Look up an ambiguity entry.  Returns the entry (mode + suggestions) when the
 * input is an umbrella term, or null when it is specific enough to resolve
 * directly.
 */
function lookupAmbiguity(lowerKey: string, rawProductName: string): AmbiguityEntry | null {
  const lowerRaw = rawProductName.toLowerCase().trim();

  // Guard: if the raw product name already appears in an entry's suggestions list,
  // the item was previously disambiguated and must not be re-flagged.  Without this
  // check, modifier-stripping in normalizeName() causes loops — e.g. "plain flour"
  // normalises to "flour" which would re-match the flour ambiguity entry even
  // though the user already made an explicit selection.
  function isSuggestion(entry: AmbiguityEntry): boolean {
    return entry.suggestions.some(s => s.toLowerCase() === lowerRaw);
  }

  // Exact match on normalised key
  if (AMBIGUITY_MAP[lowerKey]) {
    const entry = AMBIGUITY_MAP[lowerKey];
    if (isSuggestion(entry)) return null;
    return entry;
  }

  // Exact match on raw name lowercased (handles "frozen berries" → strip modifier
  // → "berries", but also plain raw matches before normalisation)
  if (AMBIGUITY_MAP[lowerRaw]) {
    const entry = AMBIGUITY_MAP[lowerRaw];
    if (isSuggestion(entry)) return null;
    return entry;
  }

  // Modifier-stripped lookup: strip a leading modifier word so "frozen berries"
  // → normalised key "berries" and "dried lentils" → "lentils" both hit their
  // ambiguity entries even when normalizeName() already stripped the modifier.
  const strippedKey = lowerKey.replace(/^(frozen|tinned|canned|dried)\s+/, '').trim();
  if (strippedKey !== lowerKey && AMBIGUITY_MAP[strippedKey]) {
    const entry = AMBIGUITY_MAP[strippedKey];
    if (isSuggestion(entry)) return null;
    return entry;
  }

  const strippedRaw = lowerRaw.replace(/^(frozen|tinned|canned|dried)\s+/, '').trim();
  if (strippedRaw !== lowerRaw && AMBIGUITY_MAP[strippedRaw]) {
    const entry = AMBIGUITY_MAP[strippedRaw];
    if (isSuggestion(entry)) return null;
    return entry;
  }

  // Only trigger for very short / generic inputs — avoid false positives on
  // specific items like "strawberry yogurt" matching "yogurt"
  const wordCount = lowerKey.split(/\s+/).length;
  if (wordCount <= 2) {
    for (const key of Object.keys(AMBIGUITY_MAP)) {
      // The normalised key must equal the ambiguity key, not merely contain it,
      // to avoid "chicken breast" triggering the "chicken" umbrella.
      if (lowerKey === key || lowerRaw === key) {
        const entry = AMBIGUITY_MAP[key];
        if (isSuggestion(entry)) return null;
        return entry;
      }
    }
  }

  return null;
}
