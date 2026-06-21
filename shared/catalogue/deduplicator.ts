// WS0.10 — Deduplicator.
//
// Checks a candidate name + scientific name against existing canonical foods.
// Three-axis check in priority order:
//   1. Slug match (normalised candidate name → canonical slug)
//   2. Alias match (resolved name is already in canonical_food_alias)
//   3. Scientific name match (exact match against existing scientific names)
//
// If any axis matches, the food is a duplicate — return the existing slug.
// Only if ALL THREE fail should a new catalogue entry be created.
//
// Note: scientific name match in this module is checked against a static map of
// known scientific names because the canonical seed does not currently store
// scientificName. In WS0.10 we add scientificName to the schema; this map
// provides deduplication during the transition until the column is backfilled.

import { normalizeIngredientKey } from "../normalize";
import { buildCanonicalIndex } from "../canonical/resolver";

// Scientific name → canonical slug map for existing foods.
// Sourced from reliable botanical/biological classification.
const SCIENTIFIC_NAME_TO_SLUG: Record<string, string> = {
  "cucurbita pepo":       "courgette",
  "solanum melongena":    "aubergine",
  "eruca vesicaria":      "rocket",
  "coriandrum sativum":   "coriander",
  "cicer arietinum":      "chickpeas",
  "brassica napus":       "swede",
  "raphanus sativus":     "radish",
  "brassica oleracea":    "broccoli",    // broad — courgette/cauliflower all share genus; match on full name
  "brassica oleracea var. italica": "broccoli",
  "brassica oleracea var. botrytis": "cauliflower",
  "brassica oleracea var. sabellica": "kale",
  "brassica oleracea var. gemmifera": "brussels-sprouts",
  "brassica oleracea var. capitata": "cabbage",
  "spinacia oleracea":    "spinach",
  "allium cepa":          "onion",
  "allium sativum":       "garlic",
  "allium fistulosum":    "spring-onion",
  "lycopersicon esculentum": "tomato",
  "solanum lycopersicum": "tomato",
  "capsicum annuum":      "pepper",
  "cucumis sativus":      "cucumber",
  "beta vulgaris":        "beetroot",
  "daucus carota":        "carrots",
  "pastinaca sativa":     "parsnip",
  "brassica rapa":        "turnip",
  "ipomoea batatas":      "sweet-potato",
  "solanum tuberosum":    "potato",
  "lens culinaris":       "lentils",
  "phaseolus vulgaris":   "black-beans",   // common bean — many varieties
  "vicia faba":           "broad-beans",
  "pisum sativum":        "peas",
  "glycine max":          "edamame",
  "arachis hypogaea":     "peanuts",
  "prunus dulcis":        "almonds",
  "juglans regia":        "walnuts",
  "corylus avellana":     "hazelnuts",
  "bertholletia excelsa": "brazil-nuts",
  "anacardium occidentale": "cashews",
  "pistacia vera":        "pistachios",
  "carya illinoinensis":  "pecans",
  "salmo salar":          "salmon",
  "sardina pilchardus":   "sardines",
  "thunnus":              "tuna",
  "scomber scombrus":     "mackerel",
  "gadus morhua":         "cod",
  "melanogrammus aeglefinus": "haddock",
  "engraulis encrasicolus": "anchovies",
  "avena sativa":         "oats",
  "oryza sativa":         "brown-rice",
  "chenopodium quinoa":   "quinoa",
  "fagopyrum esculentum": "buckwheat",
  "triticum aestivum":    "wheat",
  "hordeum vulgare":      "barley",
  "secale cereale":       "rye",
  "triticum spelta":      "spelt",
  "panicum miliaceum":    "millet",
  "zea mays":             "corn",
  "malus domestica":      "apple",
  "citrus sinensis":      "orange",
  "fragaria":             "strawberry",
  "vaccinium":            "blueberry",
  "musa":                 "banana",
  "mangifera indica":     "mango",
  "persea americana":     "avocado",
  "olea europaea":        "olives",
  "cocos nucifera":       "coconut",
  "ananas comosus":       "pineapple",
  "vitis vinifera":       "grape",
  "citrus limon":         "lemon",
  "citrus aurantifolia":  "lime",
  "punica granatum":      "pomegranate",
};

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingSlug: string | null;
  matchAxis: "slug" | "alias" | "scientific_name" | null;
}

export function checkForDuplicate(
  resolvedName: string,
  scientificName?: string,
): DeduplicationResult {
  const index = buildCanonicalIndex();
  const key = normalizeIngredientKey(resolvedName);

  // Axis 1 + 2: slug and alias are both in the canonical index
  const hit = index.byKey.get(key);
  if (hit) {
    const axis = hit.matchType === "canonical" ? "slug" : "alias";
    return { isDuplicate: true, existingSlug: hit.canonicalSlug, matchAxis: axis };
  }

  // Axis 3: scientific name match
  if (scientificName) {
    const sciKey = scientificName.toLowerCase().trim();
    const sciSlug = SCIENTIFIC_NAME_TO_SLUG[sciKey];
    if (sciSlug) {
      return { isDuplicate: true, existingSlug: sciSlug, matchAxis: "scientific_name" };
    }
  }

  return { isDuplicate: false, existingSlug: null, matchAxis: null };
}

// Convert a proposed UK English food name to a THA-style slug.
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
