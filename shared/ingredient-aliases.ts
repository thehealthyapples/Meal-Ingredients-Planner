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

  // ── Tomato forms → canonical ─────────────────────────────────────────────
  // Passata is pureed tomatoes — same qualitative nutrients, appropriate to map.
  "passata":                    "tomatoes",
  "tomato passata":             "tomatoes",
  "tinned tomatoes":            "tomatoes",
  "chopped tomatoes":           "tomatoes",
  "sun dried tomatoes":         "tomatoes",

  // ── Mushroom generic → most common UK cultivated variety ─────────────────
  // "mushrooms" alone (no variety specified) maps to white mushrooms.
  // Specific varieties (chestnut, shiitake, oyster) are matched directly via WS0.
  "mushrooms":                  "white mushrooms",
  "mixed mushrooms":            "white mushrooms",
  "field mushrooms":            "white mushrooms",

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

  // ── Chocolate kinds → canonical ───────────────────────────────────────────
  "dark chocolate":             "chocolate",
  "milk chocolate":             "chocolate",
  "white chocolate":            "chocolate",
  "drinking chocolate":         "chocolate",

  // ── Flour kinds → canonical ───────────────────────────────────────────────
  // Specific flour types resolve to the base "flour" key for THA picks lookup.
  // Note: normalizeIngredientKey strips hyphens, so "self-raising" → "self raising".
  "plain flour":                "flour",
  "strong flour":               "flour",
  "strong white flour":         "flour",
  "wholemeal flour":            "flour",
  "self raising flour":         "flour",
  "bread flour":                "flour",
  "00 flour":                   "flour",

  // ── Hot sauces → canonical ────────────────────────────────────────────────
  "sriracha sauce":             "sriracha",
  "sriracha hot sauce":         "sriracha",

  // ── Bread kinds → canonical ───────────────────────────────────────────────
  "white bread":                "bread",
  "brown bread":                "bread",
  "seeded bread":               "bread",
  "sourdough bread":            "bread",

  // ── Cheese varieties → canonical ─────────────────────────────────────────
  "gruyere":                    "cheese",
  "gruyere cheese":             "cheese",

  // ── Chicken cuts → canonical display identity ────────────────────────────
  // All cuts share the same micronutrient profile (selenium, B6, zinc, B12).
  // Fat varies slightly but no meaningful health story differs across cuts.
  "chicken breast":             "chicken",
  "chicken breasts":            "chicken",
  "chicken thigh":              "chicken",
  "chicken thighs":             "chicken",
  "chicken leg":                "chicken",
  "chicken legs":               "chicken",
  "chicken wing":               "chicken",
  "chicken wings":              "chicken",
  "chicken drumstick":          "chicken",
  "chicken drumsticks":         "chicken",

  // ── Apple varieties → singular canonical ─────────────────────────────────
  // All common apple varieties share the same key nutrients and health story.
  "gala apple":                 "apple",
  "braeburn":                   "apple",
  "braeburn apple":             "apple",
  "braeburn apples":            "apple",
  "pink lady":                  "apple",
  "pink lady apple":            "apple",
  "pink lady apples":           "apple",
  "granny smith":               "apple",
  "granny smith apple":         "apple",
  "granny smith apples":        "apple",

  // ── Citrus varieties → canonical ─────────────────────────────────────────
  "satsuma":                    "orange",
  "clementine":                 "orange",
  "clementines":                "orange",
  "satsumas":                   "orange",

  // ── Pepper colour variants → canonical ───────────────────────────────────
  // All bell pepper colours share the same capsicum plant and similar profiles.
  "yellow pepper":              "red pepper",
  "orange pepper":              "red pepper",
  "green pepper":               "red pepper",
  "yellow peppers":             "red pepper",
  "orange peppers":             "red pepper",
  "green peppers":              "red pepper",
  "mixed peppers":              "red pepper",
  "peppers":                    "red pepper",

  // ── Potato variants → canonical ──────────────────────────────────────────
  "new potatoes":               "potato",
  "new potato":                 "potato",
  "baby potatoes":              "potato",
  "baby potato":                "potato",
  "jersey royals":              "potato",
  "jersey royal potatoes":      "potato",
  "salad potatoes":             "potato",
  "mashed potato":              "potato",
  "mashed potatoes":            "potato",

  // ── Broccoli variants → canonical ────────────────────────────────────────
  "tenderstem broccoli":        "broccoli",
  "tender stem broccoli":       "broccoli",
  "purple sprouting broccoli":  "broccoli",
  "sprouting broccoli":         "broccoli",
  "broccoli florets":           "broccoli",

  // ── Coriander forms → canonical ──────────────────────────────────────────
  // Coriander seeds and ground coriander come from the same plant as the herb.
  "coriander seeds":            "coriander",
  "ground coriander":           "coriander",
  "coriander seed":             "coriander",

  // ── Spice form variants (already named correctly, add common forms) ───────
  "sweet smoked paprika":       "paprika",
  "hot smoked paprika":         "paprika",
  "chilli powder":              "chilli",
  "cayenne pepper":             "chilli",
  "cayenne":                    "chilli",
  "dried chilli flakes":        "chilli",
  "chilli flakes":              "chilli",
  "red chilli flakes":          "chilli",

  // ── Salad leaf variants → canonical ──────────────────────────────────────
  "mixed salad leaves":         "lettuce",
  "mixed leaves":               "lettuce",
  "baby leaf salad":            "lettuce",
  "salad leaf":                 "lettuce",
  "wild rocket":                "rocket",

  // ── Chicken with quality qualifiers → canonical ──────────────────────────
  // "free range" / "organic" are production labels, not food identifiers.
  // Two forms exist because normalizeIngredientKey removes hyphens without
  // inserting a space: "free-range" → "freerange", "free range" → "free range".
  "free range chicken breast":  "chicken",
  "free range chicken thigh":   "chicken",
  "free range chicken":         "chicken",
  "freerange chicken breast":   "chicken",
  "freerange chicken thigh":    "chicken",
  "freerange chicken":          "chicken",
  "organic chicken breast":     "chicken",
  "organic chicken":            "chicken",

  // ── Common tomato + stock forms ───────────────────────────────────────────
  // "sundried" (no space) needed because normalizeIngredientKey removes
  // hyphens without adding a space ("sun-dried" → "sundried").
  // "sun dried tomatoes" already exists in the original block above.
  "tinned cherry tomatoes":     "tomatoes",
  "sundried tomatoes":          "tomatoes",
  "tomato puree":               "tomatoes",
  "tomato paste":               "tomatoes",

  // ── Spring onion plural → singular canonical ──────────────────────────────
  // "scallions" and "green onions" already map to "spring onions" above;
  // this entry ensures "spring onions" resolves directly without trailing-s.
  "spring onions":              "spring onion",

  // ── Leafy greens variants ─────────────────────────────────────────────────
  "baby spinach leaves":        "spinach",
  "spinach leaves":             "spinach",
  "curly kale":                 "kale",
  "cavolo nero":                "kale",

  // ── Onion variants ────────────────────────────────────────────────────────
  "white onion":                "onion",
  "white onions":               "onion",
  "brown onions":               "onion",
  "large onion":                "onion",
  "medium onion":               "onion",

  // ── Garlic forms ─────────────────────────────────────────────────────────
  "garlic bulb":                "garlic",
  "garlic bulbs":               "garlic",
  "garlic head":                "garlic",
  "wild garlic":                "garlic",

  // ── Lemon and lime forms ──────────────────────────────────────────────────
  "juice of lemon":             "lemon",
  "juice of lime":              "lime",
  "lemon juice":                "lemon",
  "lime juice":                 "lime",
  "zest of lemon":              "lemon",
  "lemon zest":                 "lemon",
  "lime zest":                  "lime",

  // ── Ginger forms ─────────────────────────────────────────────────────────
  "fresh ginger root":          "ginger",
  "ginger root":                "ginger",
  "stem ginger":                "ginger",

  // ── Cocoa/chocolate forms → canonical ────────────────────────────────────
  "cocoa powder":               "dark chocolate",
  "cacao powder":               "dark chocolate",
  "cocoa nibs":                 "dark chocolate",
  "cacao nibs":                 "dark chocolate",

  // ── Common ingredient qualifiers that survive qty stripping ───────────────
  // These occur after stripping the numeric part, e.g. "4 large free range eggs"
  // normalises to "large free range eggs" → SIZE_ADJ_RE strips "large" →
  // "free range eggs" → resolveIngredientAlias → "eggs".
  "free range eggs":            "eggs",
  "freerange eggs":             "eggs",
  "organic eggs":               "eggs",

  // ── Salmon forms ──────────────────────────────────────────────────────────
  "smoked salmon":              "salmon",
  "salmon fillets":             "salmon",
  "salmon fillet":              "salmon",

  // ── Cauliflower composite dishes ─────────────────────────────────────────
  // "cauliflower cheese" is a dish but the primary ingredient is cauliflower.
  "cauliflower cheese":         "cauliflower",

  // ── Rice variants → canonical ────────────────────────────────────────────
  "basmati rice":               "white rice",
  "jasmine rice":               "white rice",
  "long grain rice":            "white rice",
  "arborio rice":               "white rice",
  "risotto rice":               "white rice",

  // ── Pasta variants → canonical ────────────────────────────────────────────
  "spaghetti":                  "pasta",
  "penne":                      "pasta",
  "fusilli":                    "pasta",
  "tagliatelle":                "pasta",
  "linguine":                   "pasta",
  "rigatoni":                   "pasta",
  "farfalle":                   "pasta",
  "wholemeal spaghetti":        "pasta",
  "wholemeal pasta":            "pasta",
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
