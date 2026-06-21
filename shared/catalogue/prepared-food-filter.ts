// WS0.12 — Prepared-Food Filter (pipeline-level).
//
// WS0.11 leaked composite dishes through the acquisition-stage category
// allow-list: "Spinach souffle", "Potato pancakes", "Pickles", "Cheese sauce".
// This module moves prepared-dish rejection INTO the core pipeline so ANY future
// source (not just the WS0.11 snapshot) self-protects.
//
// Principle — preparation STATE vs composite DISH:
//   • A single ingredient in a preparation state is a FOOD:
//       rolled oats, dried apricots, roasted almonds, ground beef, frozen peas.
//     These contain words that look prepared but describe ONE ingredient.
//   • A composite DISH combines ingredients or is a recognised recipe:
//       souffle, pancake, casserole, soup, sauce, salad, pie, meatloaf.
//     These do not belong in an INGREDIENT catalogue.
//
// The filter is whole-word and precedence-ordered:
//   1. ALLOW_LIST   — explicit single-ingredient foods that contain a block word
//                     (e.g. "custard apple", "applesauce", "breadfruit"). Always pass.
//   2. BLOCK_TOKENS — composite-dish / non-ingredient words, matched on word
//                     boundaries so "rolled"/"applesauce"/"breadfruit" are safe.

export interface PreparedFoodCheck {
  isPrepared: boolean;
  matchedToken: string | null;
  reason: string;
}

// ── ALLOW LIST ── single-ingredient foods that legitimately contain a block word.
// Checked first; an exact-ish match here overrides every block token.
// This is the guard against the trust risk "hide useful foods / remove regional foods".
export const ALLOW_LIST: string[] = [
  "applesauce",          // one word; "apple, sauce" (two words) would still block
  "custard apple",       // a fruit (Annona) — not the dessert "custard"
  "breadfruit",          // a fruit — not "bread"
  "bread fruit",
  "sweetbread",          // offal — not "bread"
  "butterhead lettuce",  // a lettuce — not "butter"
  "marrow",              // vegetable marrow / bone marrow
  "cornbread",           // (kept as an ingredient-grain product; remove if undesired)
  "soup celery",         // "soup celery" is a celery type in some sources
];

// ── BLOCK TOKENS ── composite-dish / prepared / non-ingredient words.
// Matched as whole words (\bWORD\b) so substrings inside single-ingredient
// names ("rolled", "applesauce", "breadfruit") never trigger a false block.
export const BLOCK_TOKENS: string[] = [
  // composite / baked dishes
  "souffle", "soufflé", "pancake", "pancakes", "waffle", "waffles",
  "casserole", "gratin", "quiche", "pie", "cobbler", "crumble",
  "pizza", "lasagna", "lasagne", "ravioli", "dumpling", "dumplings",
  "wonton", "samosa", "pakora", "fritter", "fritters", "croquette",
  "spring roll", "egg roll", "pasty", "turnover", "strudel",
  // liquids / composites
  "soup", "soups", "stew", "chowder", "bisque", "broth", "gravy",
  "sauce", "sauces", "ketchup", "salsa", "dip", "spread",
  // protein composites
  "meatloaf", "meatball", "meatballs", "patty", "patties", "nugget",
  "nuggets", "sausage", "sausages", "burger", "burgers", "kebab",
  "falafel", "terrine", "pate", "loaf",
  // assembled / served dishes
  "salad", "sandwich", "wrap", "taco", "burrito", "enchilada",
  "stir-fry", "stir fry", "risotto", "paella", "pilaf", "pudding",
  "custard", "mousse", "trifle", "parfait", "omelet", "omelette",
  "scramble", "frittata", "quiche",
  // preserved / pickled prepared items
  "pickle", "pickles", "pickled", "relish", "chutney", "marmalade",
  // stuffed / breaded preparations
  "stuffed", "breaded", "battered", "tempura",
  // supplements / infant / branded composites
  "infant", "baby food", "babyfood", "formula", "supplement",
  "meal replacement", "protein powder", "protein bar", "energy bar",
];

function hasWord(textLower: string, token: string): boolean {
  // Escape regex metacharacters, then match on word boundaries.
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${esc}([^a-z]|$)`, "i").test(textLower);
}

/**
 * Decide whether a USDA description names a prepared/composite dish rather than
 * a single ingredient. Works on the RAW description (before normalisation) so
 * no composite slips through on a cleaned name.
 */
export function checkPreparedFood(description: string): PreparedFoodCheck {
  const lower = description.toLowerCase();

  // 1. ALLOW LIST wins.
  for (const allowed of ALLOW_LIST) {
    if (lower.includes(allowed)) {
      return { isPrepared: false, matchedToken: null, reason: `Allow-listed single ingredient ("${allowed}")` };
    }
  }

  // 2. BLOCK tokens.
  for (const token of BLOCK_TOKENS) {
    if (hasWord(lower, token)) {
      return { isPrepared: true, matchedToken: token, reason: `Prepared/composite dish — blocked token "${token}"` };
    }
  }

  return { isPrepared: false, matchedToken: null, reason: "No prepared-dish signal" };
}
