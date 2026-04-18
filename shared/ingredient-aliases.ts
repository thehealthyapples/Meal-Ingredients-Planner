import { normalizeIngredientKey } from "./normalize";

/**
 * Deterministic alias map — variant ingredient keys → canonical key.
 *
 * Rules:
 *  - All keys are pre-normalised (lowercase, no punctuation, single spaces)
 *  - Canonical forms use UK English
 *  - AI must never write to or override this map
 *  - Additions must be reviewed by a human before merging
 */
const ALIASES: Record<string, string> = {
  // ── US → UK English ──────────────────────────────────────────────────────
  "eggplant":                   "aubergine",
  "zucchini":                   "courgette",
  "cilantro":                   "coriander",
  "scallions":                  "spring onions",
  "green onions":               "spring onions",
  "arugula":                    "rocket",
  "rutabaga":                   "swede",
  "bell pepper":                "pepper",
  "ground beef":                "beef mince",
  "ground pork":                "pork mince",
  "ground turkey":              "turkey mince",
  "ground lamb":                "lamb mince",
  "heavy cream":                "double cream",
  "half and half":              "single cream",
  "whole wheat bread":          "wholemeal bread",
  "whole grain bread":          "wholemeal bread",
  "candy":                      "sweets",
  "cookie":                     "biscuit",
  "chips":                      "crisps",

  // ── Common synonyms ───────────────────────────────────────────────────────
  "garbanzo beans":             "chickpeas",
  "garbanzos":                  "chickpeas",
  "canned chickpeas":           "tinned chickpeas",
  "canned tomatoes":            "tinned tomatoes",
  "crushed tomatoes":           "tinned tomatoes",
  "canned lentils":             "tinned lentils",
  "canned salmon":              "tinned salmon",
  "canned sardines":            "tinned sardines",
  "canned mackerel":            "tinned mackerel",
  "canned tuna":                "tinned tuna",
  "canned beans":               "tinned beans",
  "linseed":                    "flaxseed",
  "flax seed":                  "flaxseed",
  "flax seeds":                 "flaxseed",
  "ground linseed":             "ground flaxseed",
  "milled flaxseed":            "ground flaxseed",
  "milled linseed":             "ground flaxseed",
  "bulgar wheat":               "bulgur wheat",
  "bulgar":                     "bulgur wheat",
  "bulgur":                     "bulgur wheat",
  "soya milk":                  "soy milk",
  "soya beans":                 "edamame",

  // ── Spelling variants ─────────────────────────────────────────────────────
  "natural yoghurt":            "natural yogurt",
  "greek yoghurt":              "greek yogurt",
  "plain yogurt":               "natural yogurt",
  "plain yoghurt":              "natural yogurt",
  "full fat yogurt":            "natural yogurt",
  "bio yogurt":                 "natural yogurt",
  "bio yoghurt":                "natural yogurt",
  "wholegrain mustard":         "wholegrain mustard",
  "dijon mustard":              "dijon mustard",

  // ── Form/preparation variants → ingredient ────────────────────────────────
  "garlic clove":               "garlic",
  "garlic cloves":              "garlic",
  "minced garlic":              "garlic",
  "garlic paste":               "garlic",
  "baby spinach":               "spinach",
  "frozen spinach":             "spinach",
  "flat leaf parsley":          "parsley",
  "curly parsley":              "parsley",
  "fresh parsley":              "parsley",
  "dried parsley":              "parsley",
  "fresh basil":                "basil",
  "dried basil":                "basil",
  "fresh thyme":                "thyme",
  "dried thyme":                "thyme",
  "fresh rosemary":             "rosemary",
  "dried rosemary":             "rosemary",
  "cherry tomatoes":            "tomatoes",
  "plum tomatoes":              "tomatoes",
  "vine tomatoes":              "tomatoes",
  "roma tomatoes":              "tomatoes",

  // ── Olive oil variants → canonical ────────────────────────────────────────
  "virgin olive oil":           "olive oil",
  "pure olive oil":             "olive oil",
  "light olive oil":            "olive oil",
  "extra virgin olive oil":     "olive oil",
  "evoo":                       "olive oil",

  // ── Oat variants ──────────────────────────────────────────────────────────
  "porridge oats":              "oats",
  "rolled oats":                "oats",
  "instant oats":               "oats",
  "steel cut oats":             "oats",
  "jumbo oats":                 "oats",

  // ── Rice variants ─────────────────────────────────────────────────────────
  "long grain brown rice":      "brown rice",
  "short grain brown rice":     "brown rice",

  // ── Nut variants ──────────────────────────────────────────────────────────
  "ground almonds":             "almonds",
  "flaked almonds":             "almonds",
  "blanched almonds":           "almonds",
  "walnut halves":              "walnuts",
  "walnut pieces":              "walnuts",
};

/**
 * Resolve a potentially non-canonical ingredient key to its canonical form.
 * Returns the original key unchanged if no alias exists — never returns null.
 * AI must not call this function at insert time.
 */
export function resolveIngredientAlias(rawKey: string): string {
  const normalized = normalizeIngredientKey(rawKey);
  return ALIASES[normalized] ?? normalized;
}

/**
 * Return the canonical key given an already-normalized key, or the key itself.
 */
export function getCanonicalKey(normalizedKey: string): string {
  return ALIASES[normalizedKey] ?? normalizedKey;
}
