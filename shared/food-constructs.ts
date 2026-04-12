/**
 * Food Constructs — colloquial and composite food input normalisation.
 *
 * This layer sits AFTER spelling correction and BEFORE taxonomy lookup in the
 * parse pipeline. It maps informal / British / composite food descriptions to
 * canonical, structured representations without touching measurement units or
 * breaking any existing parse behaviour.
 *
 * Extending this module:
 *   - Add new entries to EXACT_CONSTRUCTS (keyed by normalised input string).
 *   - The lookup function also handles generic "measure-word of X" patterns
 *     automatically (e.g. "bowl of anything") — no code change needed for those.
 *
 * No AI, no side effects, fully deterministic.
 */

import { normalizeIngredientKey } from "./normalize";

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * A single sub-ingredient that a construct expands into.
 * Components are future-safe — the parse pipeline carries them but does not
 * yet split them into separate line items.
 */
export interface ConstructComponent {
  /** Canonical display name (title case) */
  name: string;
  /** Optional pre-computed taxonomy category, skips taxonomy lookup */
  category?: string;
}

/**
 * The resolved representation of a food construct.
 *
 * unit semantics:
 *   string   — use this explicit unit
 *   null     — no unit (clears any unit the parser may have detected)
 *   undefined — inherit whatever the shared parser found (default)
 */
export interface FoodConstruct {
  /** Canonical display name (title case) to replace the parsed name */
  resolvedName: string;
  /** The original colloquial key this was matched from, for logging */
  resolvedFrom: string;
  /**
   * Explicit unit override.
   * undefined = inherit from parser, null = clear unit, string = use this unit.
   */
  unit?: string | null;
  /**
   * Quantity multiplier. When set, replaces any parsed quantity with this
   * number expressed as a string.  Used for constructs like "round of
   * sandwiches" where the quantity is implied by the phrase.
   */
  quantityMultiplier?: number;
  /**
   * Optional category hint — when provided, the taxonomy lookup is skipped and
   * this value is used directly.
   */
  category?: string;
  /**
   * Sub-ingredients this construct decomposes into.
   * Carried on the result for future expansion; not currently applied by the
   * pipeline.
   */
  components?: ConstructComponent[];
}

// ── Exact construct map ───────────────────────────────────────────────────────
//
// Keys MUST be normalised (lowercase, no punctuation, single spaces) —
// identical to what normalizeIngredientKey() would produce.
// Values describe how the construct should be resolved.

const EXACT_CONSTRUCTS: Readonly<Record<string, FoodConstruct>> = {
  // ── Butties / sandwiches ─────────────────────────────────────────────────
  "chip butty": {
    resolvedName: "Sandwich",
    resolvedFrom: "chip butty",
    unit: null,
    category: "bakery",
    components: [
      { name: "Bread", category: "bakery" },
      { name: "Chips", category: "produce" },
    ],
  },
  "chip buttie": {
    resolvedName: "Sandwich",
    resolvedFrom: "chip buttie",
    unit: null,
    category: "bakery",
    components: [
      { name: "Bread", category: "bakery" },
      { name: "Chips", category: "produce" },
    ],
  },
  "bacon butty": {
    resolvedName: "Sandwich",
    resolvedFrom: "bacon butty",
    unit: null,
    category: "bakery",
    components: [
      { name: "Bread", category: "bakery" },
      { name: "Bacon", category: "meat" },
    ],
  },
  "bacon buttie": {
    resolvedName: "Sandwich",
    resolvedFrom: "bacon buttie",
    unit: null,
    category: "bakery",
    components: [
      { name: "Bread", category: "bakery" },
      { name: "Bacon", category: "meat" },
    ],
  },
  "egg butty": {
    resolvedName: "Sandwich",
    resolvedFrom: "egg butty",
    unit: null,
    category: "bakery",
    components: [
      { name: "Bread", category: "bakery" },
      { name: "Egg", category: "eggs" },
    ],
  },
  "sausage butty": {
    resolvedName: "Sandwich",
    resolvedFrom: "sausage butty",
    unit: null,
    category: "bakery",
    components: [
      { name: "Bread", category: "bakery" },
      { name: "Sausage", category: "meat" },
    ],
  },
  "sausage bap": {
    resolvedName: "Sandwich",
    resolvedFrom: "sausage bap",
    unit: null,
    category: "bakery",
    components: [
      { name: "Bap", category: "bakery" },
      { name: "Sausage", category: "meat" },
    ],
  },
  "bacon bap": {
    resolvedName: "Sandwich",
    resolvedFrom: "bacon bap",
    unit: null,
    category: "bakery",
    components: [
      { name: "Bap", category: "bakery" },
      { name: "Bacon", category: "meat" },
    ],
  },

  // ── "Round of" constructs ─────────────────────────────────────────────────
  "round of sandwiches": {
    resolvedName: "Sandwich",
    resolvedFrom: "round of sandwiches",
    unit: null,
    quantityMultiplier: 2,
    category: "bakery",
  },
  "round of toast": {
    resolvedName: "Toast",
    resolvedFrom: "round of toast",
    unit: null,
    quantityMultiplier: 2,
    category: "bakery",
  },
  "round of bread": {
    resolvedName: "Bread",
    resolvedFrom: "round of bread",
    unit: "slice",
    quantityMultiplier: 2,
    category: "bakery",
  },

  // ── Potato colloquialisms ─────────────────────────────────────────────────
  "jacket potato": {
    resolvedName: "Baked Potato",
    resolvedFrom: "jacket potato",
    unit: null,
    category: "produce",
  },
  "jacket spud": {
    resolvedName: "Baked Potato",
    resolvedFrom: "jacket spud",
    unit: null,
    category: "produce",
  },
  "baked spud": {
    resolvedName: "Baked Potato",
    resolvedFrom: "baked spud",
    unit: null,
    category: "produce",
  },
  "spuds": {
    resolvedName: "Potatoes",
    resolvedFrom: "spuds",
    unit: null,
    category: "produce",
  },
  "spud": {
    resolvedName: "Potato",
    resolvedFrom: "spud",
    unit: null,
    category: "produce",
  },
  "tatties": {
    resolvedName: "Potatoes",
    resolvedFrom: "tatties",
    unit: null,
    category: "produce",
  },
  "tattie": {
    resolvedName: "Potato",
    resolvedFrom: "tattie",
    unit: null,
    category: "produce",
  },

  // ── Tin / can overrides (generic pattern handles most, but these need
  //    product-name resolution beyond just the trailing word) ────────────────
  "tin of beans": {
    resolvedName: "Baked Beans",
    resolvedFrom: "tin of beans",
    unit: "can",
    category: "uncategorised",
  },
  "can of beans": {
    resolvedName: "Baked Beans",
    resolvedFrom: "can of beans",
    unit: "can",
    category: "uncategorised",
  },
  "tin of tomatoes": {
    resolvedName: "Chopped Tomatoes",
    resolvedFrom: "tin of tomatoes",
    unit: "can",
    category: "produce",
  },
  "can of tomatoes": {
    resolvedName: "Chopped Tomatoes",
    resolvedFrom: "can of tomatoes",
    unit: "can",
    category: "produce",
  },
  "tin of tuna": {
    resolvedName: "Tuna",
    resolvedFrom: "tin of tuna",
    unit: "can",
    category: "fish",
  },
  "can of tuna": {
    resolvedName: "Tuna",
    resolvedFrom: "can of tuna",
    unit: "can",
    category: "fish",
  },
  "tin of chickpeas": {
    resolvedName: "Chickpeas",
    resolvedFrom: "tin of chickpeas",
    unit: "can",
    category: "uncategorised",
  },
  "can of chickpeas": {
    resolvedName: "Chickpeas",
    resolvedFrom: "can of chickpeas",
    unit: "can",
    category: "uncategorised",
  },
  "tin of coconut milk": {
    resolvedName: "Coconut Milk",
    resolvedFrom: "tin of coconut milk",
    unit: "can",
    category: "uncategorised",
  },
  "can of coconut milk": {
    resolvedName: "Coconut Milk",
    resolvedFrom: "can of coconut milk",
    unit: "can",
    category: "uncategorised",
  },
  "can of coke": {
    resolvedName: "Coca-Cola",
    resolvedFrom: "can of coke",
    unit: "can",
    category: "uncategorised",
  },
  "tin of soup": {
    resolvedName: "Soup",
    resolvedFrom: "tin of soup",
    unit: "can",
    category: "uncategorised",
  },

  // ── Breakfast / full meal constructs ─────────────────────────────────────
  "full english": {
    resolvedName: "Full English Breakfast",
    resolvedFrom: "full english",
    unit: null,
    category: "uncategorised",
    components: [
      { name: "Eggs", category: "eggs" },
      { name: "Bacon", category: "meat" },
      { name: "Sausages", category: "meat" },
      { name: "Baked Beans", category: "uncategorised" },
      { name: "Toast", category: "bakery" },
      { name: "Mushrooms", category: "produce" },
      { name: "Tomatoes", category: "produce" },
    ],
  },
  "full english breakfast": {
    resolvedName: "Full English Breakfast",
    resolvedFrom: "full english breakfast",
    unit: null,
    category: "uncategorised",
    components: [
      { name: "Eggs", category: "eggs" },
      { name: "Bacon", category: "meat" },
      { name: "Sausages", category: "meat" },
      { name: "Baked Beans", category: "uncategorised" },
      { name: "Toast", category: "bakery" },
      { name: "Mushrooms", category: "produce" },
      { name: "Tomatoes", category: "produce" },
    ],
  },
  "full scottish": {
    resolvedName: "Full Scottish Breakfast",
    resolvedFrom: "full scottish",
    unit: null,
    category: "uncategorised",
    components: [
      { name: "Eggs", category: "eggs" },
      { name: "Bacon", category: "meat" },
      { name: "Lorne Sausage", category: "meat" },
      { name: "Black Pudding", category: "meat" },
      { name: "Toast", category: "bakery" },
      { name: "Mushrooms", category: "produce" },
      { name: "Tomatoes", category: "produce" },
      { name: "Baked Beans", category: "uncategorised" },
    ],
  },
  "ploughmans": {
    resolvedName: "Ploughman's Lunch",
    resolvedFrom: "ploughmans",
    unit: null,
    category: "uncategorised",
    components: [
      { name: "Bread", category: "bakery" },
      { name: "Cheddar Cheese", category: "dairy" },
      { name: "Pickle", category: "uncategorised" },
      { name: "Lettuce", category: "produce" },
    ],
  },
  "ploughmans lunch": {
    resolvedName: "Ploughman's Lunch",
    resolvedFrom: "ploughmans lunch",
    unit: null,
    category: "uncategorised",
    components: [
      { name: "Bread", category: "bakery" },
      { name: "Cheddar Cheese", category: "dairy" },
      { name: "Pickle", category: "uncategorised" },
      { name: "Lettuce", category: "produce" },
    ],
  },

  // ── Courgette / noodle alternatives ──────────────────────────────────────
  "courgetti": {
    resolvedName: "Courgette",
    resolvedFrom: "courgetti",
    unit: null,
    category: "produce",
  },

  // ── Pint overrides (generic pattern gives unit "pint", but milk/beer need
  //    category hints) ────────────────────────────────────────────────────
  "pint of milk": {
    resolvedName: "Milk",
    resolvedFrom: "pint of milk",
    unit: "pint",
    category: "dairy",
  },
  "pint of beer": {
    resolvedName: "Beer",
    resolvedFrom: "pint of beer",
    unit: "pint",
    category: "uncategorised",
  },
  "pint of lager": {
    resolvedName: "Lager",
    resolvedFrom: "pint of lager",
    unit: "pint",
    category: "uncategorised",
  },
};

// ── Measure-word pattern fallback ─────────────────────────────────────────────
//
// When an input matches "[measure-word] of [X]" and X is not already handled
// by EXACT_CONSTRUCTS, the unit is extracted from the measure word and the
// product name is derived from X.
//
// These are food-specific containers / portion descriptors — they must NOT be
// added to the measurement-unit system (UNIT_PATTERN in parse-ingredient.ts).

const MEASURE_WORDS = new Set([
  "slice",
  "slices",
  "bowl",
  "bowls",
  "cup",
  "cups",
  "mug",
  "mugs",
  "glass",
  "glasses",
  "pint",
  "pints",
  "tin",
  "tins",
  "can",
  "cans",
  "bottle",
  "bottles",
  "jar",
  "jars",
  "bag",
  "bags",
  "packet",
  "packets",
  "box",
  "boxes",
  "piece",
  "pieces",
  "portion",
  "portions",
  "helping",
  "helpings",
  "serving",
  "servings",
  "scoop",
  "scoops",
  "dollop",
  "dollops",
]);

// Singular canonical form (strips trailing "s" for display in unit field)
function singulariseMeasureWord(word: string): string {
  const IRREGULARS: Record<string, string> = {
    glasses: "glass",
    boxes: "box",
    slices: "slice",
    pieces: "piece",
    portions: "portion",
    helpings: "helping",
    servings: "serving",
    scoops: "scoop",
    dollops: "dollop",
    bowls: "bowl",
    cups: "cup",
    mugs: "mug",
    pints: "pint",
    tins: "tin",
    cans: "can",
    bottles: "bottle",
    jars: "jar",
    bags: "bag",
    packets: "packet",
  };
  return IRREGULARS[word] ?? (word.endsWith("s") ? word.slice(0, -1) : word);
}

// Capitalise the first letter of a string
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Look up a normalised ingredient string against the food constructs map.
 *
 * Returns a FoodConstruct if the input is a known colloquial or composite food,
 * or null if it is not a recognised construct.
 *
 * The input MUST already be normalised (lowercase, no punctuation, single
 * spaces) — i.e. the output of normalizeIngredientKey().
 *
 * Resolution order:
 *   1. Exact match in EXACT_CONSTRUCTS
 *   2. "measure-word of X" pattern (generic container + product)
 *   3. null — not a known construct
 */
export function lookupFoodConstruct(normalizedInput: string): FoodConstruct | null {
  // 1. Exact match
  const exact = EXACT_CONSTRUCTS[normalizedInput];
  if (exact) return exact;

  // Strip leading indefinite/definite articles before further pattern matching.
  // e.g. "a slice of toast" → "slice of toast", "the full english" → "full english"
  const stripped = normalizedInput.replace(/^(?:an? |the )/, "");

  // Retry exact match after stripping (catches "the full english", etc.)
  if (stripped !== normalizedInput) {
    const strippedExact = EXACT_CONSTRUCTS[stripped];
    if (strippedExact) return { ...strippedExact, resolvedFrom: normalizedInput };
  }

  // 2. Generic measure-word pattern: "[unit] of [product]"
  // Applied to the article-stripped form so "a slice of toast" → unit:"slice" product:"toast"
  const inputToMatch = stripped !== normalizedInput ? stripped : normalizedInput;
  const measureMatch = inputToMatch.match(/^(\w+) of (.+)$/);
  if (measureMatch) {
    const [, rawUnit, rawProduct] = measureMatch;
    if (MEASURE_WORDS.has(rawUnit)) {
      const unit = singulariseMeasureWord(rawUnit);
      const resolvedName = capitalise(rawProduct.trim());
      return {
        resolvedName,
        resolvedFrom: normalizedInput,
        unit,
        // No category hint — will be resolved from taxonomy using the product name
      };
    }
  }

  return null;
}

/**
 * Returns true if the normalised input looks like it could be a food construct
 * that we don't (yet) have an entry for.  Used to emit useful log warnings for
 * inputs that should probably be added to EXACT_CONSTRUCTS.
 *
 * This is intentionally conservative — it only flags inputs with clear
 * structural markers, not every multi-word ingredient.
 */
export function isLikelyFoodConstruct(normalizedInput: string): boolean {
  // "X of Y" patterns that were NOT caught by the measure-word fallback
  // (the fallback handles known measure words; anything else with "of" might
  // still be a food construct we don't handle yet)
  if (/ of /.test(normalizedInput)) return true;
  // British sandwich slang
  if (normalizedInput.endsWith("butty") || normalizedInput.endsWith("buttie")) return true;
  // "round of X" patterns
  if (normalizedInput.startsWith("round of ")) return true;
  // "full X" breakfast patterns
  if (/^full /.test(normalizedInput)) return true;
  return false;
}

/**
 * Emit a structured log warning for an input that looks like a food construct
 * but wasn't matched by the lookup function.
 *
 * @param originalLine  The raw (pre-normalisation) input line.
 * @param normalizedInput  The normalised key that failed to match.
 */
export function logUnrecognisedConstruct(
  originalLine: string,
  normalizedInput: string
): void {
  console.warn(
    `[food-constructs] unrecognised construct candidate: "${normalizedInput}"` +
      (originalLine !== normalizedInput ? ` (original: "${originalLine}")` : "")
  );
}

/**
 * Emit a structured log error for a construct that was matched but could not
 * be applied correctly (e.g. missing resolvedName, bad state).
 *
 * @param construct  The construct that failed.
 * @param reason  Human-readable description of the failure.
 */
export function logConstructMappingFailure(
  construct: Partial<FoodConstruct>,
  reason: string
): void {
  console.error(
    `[food-constructs] mapping failure for "${construct.resolvedFrom ?? "(unknown)"}" — ${reason}`
  );
}
