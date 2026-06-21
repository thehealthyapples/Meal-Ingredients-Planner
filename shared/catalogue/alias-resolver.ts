// WS0.10 — Alias Resolver.
//
// Two jobs:
//   1. Normalise USDA US-English names to THA UK-English before canonical lookup.
//   2. Check the resolved name against the canonical index (slug, alias, variety).
//
// Resolution order:
//   a. Strip USDA description suffixes ("raw", "cooked, boiled", "without salt" etc.)
//   b. Apply US→UK name map
//   c. Check canonical resolver (slug + alias index)
//   d. Return match or null

import { normalizeIngredientKey } from "../normalize";
import { buildCanonicalIndex } from "../canonical/resolver";

// US → UK English name map. Applied before canonical lookup.
// Keys are lowercase. Values are the THA preferred UK English name.
export const US_TO_UK_MAP: Record<string, string> = {
  // Vegetables
  "zucchini": "courgette",
  "eggplant": "aubergine",
  "arugula": "rocket",
  "cilantro": "coriander",
  "rutabaga": "swede",
  "beet": "beetroot",
  "beets": "beetroot",
  "corn": "sweetcorn",
  "bell pepper": "pepper",
  "hot pepper": "chilli",
  "bokchoy": "pak choi",
  "bok choy": "pak choi",
  "canola": "rapeseed",
  "canola oil": "rapeseed oil",
  "romaine": "romaine lettuce",
  "butternut squash": "butternut squash",
  "acorn squash": "acorn squash",
  "spaghetti squash": "spaghetti squash",
  "yam": "yam",
  "sweet potato": "sweet potato",

  // Legumes
  "garbanzo beans": "chickpeas",
  "garbanzo": "chickpeas",
  "navy beans": "haricot beans",
  "lima beans": "butter beans",
  "fava beans": "broad beans",
  "fava bean": "broad bean",
  "snap peas": "sugar snap peas",
  "snow peas": "mangetout",
  "green peas": "peas",

  // Fish & seafood
  "shrimp": "prawns",
  "crayfish": "crayfish",

  // Grains
  "buckwheat groats": "buckwheat",
  "whole wheat": "wholemeal wheat",
  "whole grain": "wholegrain",

  // Herbs & spices
  "lemon grass": "lemongrass",

  // Scallions
  "scallion": "spring onion",
  "scallions": "spring onions",
  "green onion": "spring onion",
  "green onions": "spring onions",
};

// USDA description cleaning patterns — strip cooking/preparation qualifiers.
// Applied before name resolution to get to the core food name.
const USDA_SUFFIXES_TO_STRIP = [
  /,\s*raw$/i,
  /,\s*fresh$/i,
  /,\s*cooked.*$/i,
  /,\s*boiled.*$/i,
  /,\s*steamed.*$/i,
  /,\s*roasted.*$/i,
  /,\s*baked.*$/i,
  /,\s*dried.*$/i,
  /,\s*canned.*$/i,
  /,\s*tinned.*$/i,
  /,\s*frozen.*$/i,
  /,\s*without.*$/i,
  /,\s*with.*$/i,
  /,\s*NFS$/i,
  /,\s*all varieties$/i,
  /,\s*all types$/i,
  /,\s*mature seeds.*$/i,
  /,\s*seeds.*$/i,
  /,\s*whole.*$/i,
  /,\s*sliced.*$/i,
  /,\s*chopped.*$/i,
  /,\s*unprepared$/i,
  /,\s*prepared.*$/i,
];

export function cleanUSDADescription(description: string): string {
  let cleaned = description.trim();
  for (const pattern of USDA_SUFFIXES_TO_STRIP) {
    cleaned = cleaned.replace(pattern, "").trim();
  }
  // Remove trailing commas/semicolons left after stripping
  cleaned = cleaned.replace(/[,;]+$/, "").trim();
  return cleaned;
}

export interface AliasResolution {
  resolvedName: string;
  wasTranslated: boolean;    // true if US→UK map was applied
  canonicalSlug: string | null;
  canonicalName: string | null;
  matchType: "slug" | "alias" | null;
}

function tryLookup(name: string, index: ReturnType<typeof buildCanonicalIndex>): { canonicalSlug: string; canonicalName: string; matchType: "slug" | "alias" } | null {
  const key = normalizeIngredientKey(name);
  const hit = index.byKey.get(key);
  if (hit) {
    return {
      canonicalSlug: hit.canonicalSlug,
      canonicalName: hit.canonicalName,
      matchType: hit.matchType === "canonical" ? "slug" : "alias",
    };
  }
  return null;
}

export function resolveAlias(usdaDescription: string): AliasResolution {
  const index = buildCanonicalIndex();
  const cleaned = cleanUSDADescription(usdaDescription).toLowerCase();

  // Apply US→UK map
  const translated = US_TO_UK_MAP[cleaned] ?? cleaned;
  const wasTranslated = translated !== cleaned;

  // Try 1: full translated name
  const hit1 = tryLookup(translated, index);
  if (hit1) {
    return { resolvedName: translated, wasTranslated, ...hit1 };
  }

  // Try 2: untranslated original (already in alias table as-is)
  if (wasTranslated) {
    const hit2 = tryLookup(cleaned, index);
    if (hit2) {
      return { resolvedName: cleaned, wasTranslated: false, ...hit2 };
    }
  }

  // Try 3: bare name before first comma — catches USDA patterns like "Oats, rolled"
  // that survive suffix-stripping with a trailing qualifier.
  const beforeComma = cleaned.split(",")[0].trim();
  if (beforeComma && beforeComma !== cleaned) {
    const translatedBare = US_TO_UK_MAP[beforeComma] ?? beforeComma;
    const hit3 = tryLookup(translatedBare, index);
    if (hit3) {
      return {
        resolvedName: translatedBare,
        wasTranslated: translatedBare !== beforeComma,
        ...hit3,
      };
    }
    // Also try the bare untranslated
    if (translatedBare !== beforeComma) {
      const hit3b = tryLookup(beforeComma, index);
      if (hit3b) {
        return { resolvedName: beforeComma, wasTranslated: false, ...hit3b };
      }
    }
  }

  return {
    resolvedName: translated,
    wasTranslated,
    canonicalSlug: null,
    canonicalName: null,
    matchType: null,
  };
}
