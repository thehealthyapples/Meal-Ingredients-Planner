import { Additive } from "@shared/schema";
import { ParsedIngredient, parseProductIngredients } from "./product-analysis";

// Allow optional single space between E and the digits, e.g. "E 500" or "E500".
const E_NUMBER_PATTERN = /\bE\s?\d{3,4}[a-z]?\b/gi;

const ADDITIVE_TYPE_RISK: Record<string, number> = {
  colouring: 3,
  preservative: 2,
  sweetener: 2,
  emulsifier: 2,
  "flavour enhancer": 3,
  "modified starch": 2,
  thickener: 1,
  antioxidant: 1,
  "acidity regulator": 1,
  "raising agent": 0,
  "anti-caking": 1,
  "firming agent": 0,
  "anti-foaming": 2,
  humectant: 1,
};

const RISK_LEVEL_SCORES: Record<string, number> = {
  low: 1,
  moderate: 3,
  high: 5,
};

export interface AdditiveMatch {
  additive: Additive;
  foundIn: string;
  /** True when this additive is present due to a legal/regulatory requirement
   *  (e.g. UK flour fortification) rather than a discretionary manufacturing
   *  choice.  Still counted in the THA apple score — just labelled separately
   *  in explanations. */
  isRegulatory: boolean;
}

export interface UPFAnalysisResult {
  upfScore: number;
  thaRating: number;
  additiveMatches: AdditiveMatch[];
  /** Total number of detected DB additives (= additiveMatches.length). */
  additiveCount: number;
  /** Subset of additiveMatches flagged as regulatory (e.g. UK flour fortification). */
  regulatoryAdditives: AdditiveMatch[];
  /** Count of regulatory additives for quick access. */
  regulatoryCount: number;
  processingIndicators: string[];
  ingredientCount: number;
  upfIngredientCount: number;
  riskBreakdown: {
    additiveRisk: number;
    processingRisk: number;
    ingredientComplexityRisk: number;
  };
  /** Transparent breakdown of the 3-bucket THA processing score. */
  thaBreakdown: ProcessingBreakdown;
}

// Extract detection pattern — module-scope so tests can import it directly.
// Each match represents one distinct extract declaration in the ingredient text.
// Grouped phrases (e.g. "spice and herb extracts") produce one match because
// only the qualifying word immediately before "extract(s)" is captured.
// Plain "spice", "spices", "herbs" without "extract" do NOT match.
// "yeast extract" is intentionally absent — handled by SOFT_UPF_TERMS.
// Global flag is required for counted matching via String.prototype.match().
export const EXTRACT_PATTERN = /\b(?:herb|spice|plant|botanical|mixed|vegetable|fruit|natural|rosemary|thyme|oregano|basil|sage|bay|parsley|coriander|fennel|tarragon|mint|marjoram|lavender|chamomile|turmeric|ginger|paprika|celery|elderflower|elderberry|hibiscus|lemon|orange|lime|garlic|onion|pepper|chilli|chili)\s+extracts?\b/gi;

// Soft UPF terms counted as additive signals even without an E-number.
// Roots only — "flavour" matches "flavouring", "smoke flavour", "flavourings", etc.
// Exported so tests can import the single source of truth instead of duplicating.
export const SOFT_UPF_TERMS = [
  "yeast extract",
  "flavour",         // covers: natural flavouring, smoke flavour, flavourings, artificial flavour
  "flavor",          // American spelling
  "maltodextrin",
  "dextrose",
  "glucose syrup",
  "hydrolysed",
  "modified starch", // covers modified corn/tapioca/potato/maize starch
  "invert sugar",
];

// Additive function-word declarations — for explanation display.
// Covers the full vocabulary of additive roles that may appear in ingredient lists.
export const HARD_ADDITIVE_TERMS = [
  "emulsifier", "emulsifiers",
  "preservative", "preservatives",
  "antioxidant",
  "acidity regulator",
  "sweetener", "sweeteners",
  "flavouring", "flavourings", "flavoring", "flavorings",
  "colouring", "colourings", "coloring", "colorings",
  "stabiliser", "stabilisers", "stabilizer", "stabilizers",
  "thickener", "thickeners",
  "gelling agent",
  "raising agent",
  "anti-caking agent",
  "humectant",
  "glazing agent",
  "flavour enhancer",
];

// Industrial/refined ingredients that indicate ultra-processing.
// Intentionally excludes terms already in SOFT_UPF_TERMS (dextrose, maltodextrin,
// glucose syrup, modified starch, hydrolysed, invert sugar) to prevent double-counting.
export const INDUSTRIAL_INGREDIENT_TERMS = [
  "glucose-fructose syrup",
  "fructose syrup",
  "palm fat",
  "palm oil",
  "hydrogenated",           // covers "partially hydrogenated" too
  "skimmed milk powder",
  "whey powder",
  "whey protein",
  "milk proteins",
  "milk solids",
  "lactose",
  "soy protein isolate",
  "whey protein isolate",
  "protein isolate",
  "mechanically separated",
];

// UPF pattern rules — identify ingredient combinations typical of confectionery,
// industrial baked goods, and heavily formulated products.
// Each rule fires at most once; total capped at 3 in the scoring function.
export const UPF_PATTERN_RULES: Array<{
  id: string;
  label: string;
  test: (text: string) => boolean;
}> = [
  {
    id: "sugar_glucose_syrup",
    label: "sugar + glucose syrup",
    test: (t) => t.includes("sugar") && t.includes("glucose syrup"),
  },
  {
    id: "sugar_palm",
    label: "sugar + palm fat/oil",
    test: (t) => t.includes("sugar") && (t.includes("palm fat") || t.includes("palm oil")),
  },
  {
    id: "sugar_milk_powder",
    label: "sugar + milk powder/whey",
    test: (t) =>
      t.includes("sugar") &&
      (t.includes("skimmed milk powder") || t.includes("whey powder")),
  },
  {
    id: "sugar_emulsifier_flavour",
    label: "sugar + emulsifier/flavouring",
    test: (t) =>
      t.includes("sugar") &&
      (t.includes("emulsifier") || t.includes("flavour") || t.includes("flavor")),
  },
  {
    id: "dairy_fractions",
    label: "multiple dairy fractions",
    test: (t) => {
      const fractions = [
        "skimmed milk powder", "whey powder", "lactose",
        "milk proteins", "milk solids", "whey protein",
      ];
      return fractions.filter(f => t.includes(f)).length >= 2;
    },
  },
];

// Pattern that identifies a fortified-flour context surrounding a match.
// When E170 (Calcium Carbonate) appears inside "fortified wheat flour (…)"
// we flag it as regulatory rather than discretionary.
const FORTIFIED_FLOUR_PATTERN = /fortif(?:ied|ication)/i;

// Normalise text before matching: collapse soya→soy so DB entries in either
// spelling match ingredient labels in either spelling.
function normaliseForMatching(raw: string): string {
  return raw.toLowerCase().replace(/\bsoya\b/g, "soy");
}

export function detectAdditives(ingredientsText: string, additiveDb: Additive[]): AdditiveMatch[] {
  if (!ingredientsText) return [];
  const text = normaliseForMatching(ingredientsText);
  const isFortifiedFlourContext = FORTIFIED_FLOUR_PATTERN.test(ingredientsText);
  const matches: AdditiveMatch[] = [];
  const seen = new Set<number>();

  // Tracks character ranges already claimed by a successful match.
  // Prevents shorter/generic terms (e.g. "fatty acids") from matching
  // within a range already covered by a more-specific term (e.g.
  // "mono- and diglycerides of fatty acids").
  const consumed: Array<{ start: number; end: number }> = [];

  function overlapsConsumed(start: number, end: number): boolean {
    return consumed.some(r => start < r.end && end > r.start);
  }

  // Pass 1: E-number matches — highest priority, always win.
  const eNumbers = text.match(E_NUMBER_PATTERN) || [];
  for (const eNum of eNumbers) {
    // Strip any internal space (e.g. "E 500" → "E500") before DB lookup.
    const normalized = eNum.replace(/\s/g, "").toUpperCase();
    const additive = additiveDb.find(a => a.name.toUpperCase() === normalized);
    if (additive && !seen.has(additive.id)) {
      seen.add(additive.id);
      const idx = text.indexOf(eNum.toLowerCase());
      if (idx !== -1) consumed.push({ start: idx, end: idx + eNum.length });
      const isRegulatory = !!additive.isRegulatory || (additive.name === "E170" && isFortifiedFlourContext);
      matches.push({ additive, foundIn: eNum, isRegulatory });
    }
  }

  // Pass 2: Name-based matching.
  //
  // Rules:
  //   1. Longer commonNames are processed first (more specific wins).
  //   2. A match is only accepted if the phrase appears as a standalone
  //      ingredient token — preceded and followed by a separator character
  //      (, ; ( ) [ ] or start/end of string).  This prevents generic
  //      sub-phrases like "fatty acids" from matching inside the longer
  //      compound phrase "mono- and diglycerides of fatty acids".
  //   3. Consumed ranges block any later match that overlaps them.

  // Separators that bound individual ingredient tokens.
  const SEP = /[,;()\[\]]/;

  function isStandaloneMatch(t: string, term: string): number {
    // Escape regex special chars in the term.
    const escaped = term.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
    // LEADING boundary only: start-of-string OR a delimiter (, ; ( [ :).
    // Colon is included so "Preservative: Sodium Nitrite" and
    // "Antioxidant: Ascorbic Acid" are matched inside compound sections.
    // Spaces are intentionally excluded as a leading boundary — a term
    // preceded only by a space is embedded mid-phrase (e.g. "of fatty
    // acids") and must NOT match.
    // No trailing restriction: "Mono- and Diglycerides" legitimately
    // has " of Fatty Acids" after it before the closing paren.
    const rx = new RegExp(`(?:^|[,;(:\\[])\\s*${escaped}`, "i");
    const m = rx.exec(t);
    if (!m) return -1;
    // Return the index where the term itself starts within the match.
    const termStart = t.toLowerCase().indexOf(term, m.index);
    return termStart;
  }

  const candidates = additiveDb
    .filter(a => !seen.has(a.id))
    .map(a => {
      const commonName = normaliseForMatching(
        (a.description?.split(" - ")[0] ?? "").replace(/\(.*?\)/g, "").trim()
      );
      return { additive: a, commonName };
    })
    .filter(({ commonName }) => commonName.length > 3)
    .sort((a, b) => b.commonName.length - a.commonName.length);

  for (const { additive, commonName } of candidates) {
    if (seen.has(additive.id)) continue;
    const idx = isStandaloneMatch(text, commonName);
    if (idx === -1) continue;
    if (overlapsConsumed(idx, idx + commonName.length)) continue;

    seen.add(additive.id);
    consumed.push({ start: idx, end: idx + commonName.length });
    const isRegulatory = !!additive.isRegulatory || (additive.name === "E170" && isFortifiedFlourContext);
    matches.push({ additive, foundIn: commonName, isRegulatory });
  }

  return matches;
}

export function detectProcessingIndicators(ingredientsText: string): string[] {
  if (!ingredientsText) return [];
  const text = ingredientsText.toLowerCase();
  const indicators: string[] = [];

  const checks: [string, string[]][] = [
    ["Modified starch", ["modified starch", "modified maize starch", "modified corn starch", "modified tapioca starch"]],
    ["Hydrogenated oils", ["hydrogenated", "partially hydrogenated"]],
    ["High fructose corn syrup", ["high fructose corn syrup", "hfcs", "glucose-fructose syrup"]],
    ["Artificial flavouring", ["artificial flavour", "artificial flavor", "flavouring", "flavoring"]],
    ["Artificial colouring", ["artificial colour", "artificial color"]],
    ["Maltodextrin", ["maltodextrin"]],
    ["Dextrose", ["dextrose"]],
    ["Invert sugar", ["invert sugar", "inverted sugar"]],
    ["Palm oil", ["palm oil", "palm fat"]],
    ["Protein isolate", ["protein isolate", "soy protein isolate", "whey protein isolate"]],
    ["Mechanically separated", ["mechanically separated", "mechanically recovered"]],
  ];

  for (const [label, keywords] of checks) {
    if (keywords.some(kw => text.includes(kw))) {
      indicators.push(label);
    }
  }

  return indicators;
}

export function calculateUPFScore(
  ingredients: ParsedIngredient[],
  additiveMatches: AdditiveMatch[],
  processingIndicators: string[],
): number {
  let score = 0;

  let additiveRisk = 0;
  for (const match of additiveMatches) {
    const typeRisk = ADDITIVE_TYPE_RISK[match.additive.type] ?? 1;
    const levelRisk = RISK_LEVEL_SCORES[match.additive.riskLevel] ?? 1;
    additiveRisk += typeRisk + levelRisk;
  }
  score += Math.min(40, additiveRisk * 2);

  score += Math.min(30, processingIndicators.length * 6);

  const upfCount = ingredients.filter(i => i.isUPF || i.isENumber).length;
  if (ingredients.length > 0) {
    const upfRatio = upfCount / ingredients.length;
    score += Math.round(upfRatio * 20);
  }

  if (ingredients.length > 20) score += 10;
  else if (ingredients.length > 15) score += 7;
  else if (ingredients.length > 10) score += 5;

  return Math.min(100, Math.max(0, score));
}

export interface ProcessingBreakdown {
  additiveTermsFound: string[];
  industrialIngredientsFound: string[];
  upfPatternsFound: string[];
  totalProcessingPenalty: number;
}

/**
 * Returns a transparent breakdown of processing signals found in an ingredient list.
 * Used internally by calculateTHAAppleRating and externally by buildTHAExplanation.
 */
export function buildProcessingBreakdown(
  additiveMatches: AdditiveMatch[],
  ingredientsText: string,
): ProcessingBreakdown {
  const text = (ingredientsText ?? "").toLowerCase();

  // Bucket 1: additive signals — DB matches + soft terms + extract phrases
  EXTRACT_PATTERN.lastIndex = 0;
  const extractHits = (text.match(EXTRACT_PATTERN) ?? []) as string[];
  const softHits = SOFT_UPF_TERMS.filter(term => text.includes(term));
  const additivePenalty = Math.min(5, additiveMatches.length + softHits.length + extractHits.length);

  // Bucket 2: industrial ingredients (no overlap with SOFT_UPF_TERMS)
  const industrialIngredientsFound = INDUSTRIAL_INGREDIENT_TERMS.filter(term => text.includes(term));
  const industrialPenalty = Math.min(5, industrialIngredientsFound.length);

  // Bucket 3: UPF pattern signals — ingredient combinations typical of ultra-processing
  const upfPatternsFound = UPF_PATTERN_RULES
    .filter(rule => rule.test(text))
    .map(rule => rule.label);
  const patternPenalty = Math.min(3, upfPatternsFound.length);

  return {
    additiveTermsFound: [
      ...additiveMatches.map(m => m.foundIn),
      ...softHits,
      ...extractHits,
    ],
    industrialIngredientsFound,
    upfPatternsFound,
    totalProcessingPenalty: additivePenalty + industrialPenalty + patternPenalty,
  };
}

/**
 * Apple rating — 3-bucket processing model.
 *
 * Bucket 1 – Additive signals (capped at 5 pts):
 *   DB additive matches + soft UPF terms (SOFT_UPF_TERMS) + extract phrases
 *
 * Bucket 2 – Industrial ingredients (capped at 5 pts):
 *   Refined/fractionated industrial ingredients not already in SOFT_UPF_TERMS
 *   e.g. palm fat/oil, skimmed milk powder, whey powder, lactose, hydrogenated fats
 *
 * Bucket 3 – UPF pattern signals (capped at 3 pts):
 *   Ingredient combinations typical of confectionery / industrial baked goods
 *   e.g. sugar + glucose syrup, multiple dairy fractions, sugar + palm fat
 *
 * Total (0–13) → rating:
 *   0   = 5 apples  (minimal industrial processing)
 *   1   = 4 apples  (mild concern)
 *   2–3 = 3 apples  (moderate industrial processing)
 *   4–5 = 2 apples  (clearly ultra-processed)
 *   6+  = 1 apple   (highly formulated / heavily industrial)
 *
 * NOVA is not a factor. Score is deterministic and ingredient-text-driven.
 */
export function calculateTHAAppleRating(
  additiveCount: number,
  processingIndicators: string[] = [],
  novaGroup?: number | null,
  ingredientsText?: string,
): number {
  const text = (ingredientsText ?? "").toLowerCase();

  // Bucket 1 — additive signals (same effective-count as the legacy model)
  EXTRACT_PATTERN.lastIndex = 0;
  const extractHits = (text.match(EXTRACT_PATTERN) ?? []).length;
  const softCount = SOFT_UPF_TERMS.filter(term => text.includes(term)).length;
  const additivePenalty = Math.min(5, additiveCount + softCount + extractHits);

  // Bucket 2 — industrial ingredients
  const industrialPenalty = Math.min(
    5,
    INDUSTRIAL_INGREDIENT_TERMS.filter(term => text.includes(term)).length,
  );

  // Bucket 3 — UPF pattern signals
  const patternPenalty = Math.min(
    3,
    UPF_PATTERN_RULES.filter(rule => rule.test(text)).length,
  );

  const total = additivePenalty + industrialPenalty + patternPenalty;

  if (total === 0) return 5;
  if (total === 1) return 4;
  if (total <= 3) return 3;
  if (total <= 5) return 2;
  return 1;
}

export interface ProductContext {
  productName: string;
  categoriesTags: string[];
  novaGroup: number | null;
}

// Converts a UPFAnalysisResult into a concise, plain-English phrase for display in THA.
// Intended as a single-line summary shown next to a product card.
export function buildTHAExplanation(result: UPFAnalysisResult, novaGroup?: number | null): string {
  const breakdown = result.thaBreakdown;
  const total = breakdown.totalProcessingPenalty;
  const parts: string[] = [];

  // Clean product — nothing to flag
  if (total === 0) {
    return "Low processing — minimal industrial ingredients detected";
  }

  // UPF pattern detected — lead with the strongest signal
  if (breakdown.upfPatternsFound.length > 0) {
    const topPattern = breakdown.upfPatternsFound[0];
    const industrialHighlights = breakdown.industrialIngredientsFound.slice(0, 3).join(", ");
    if (industrialHighlights) {
      parts.push(`Ultra-processed pattern detected · ${industrialHighlights}`);
    } else {
      parts.push(`Ultra-processed pattern detected · ${topPattern}`);
    }
  } else if (breakdown.industrialIngredientsFound.length > 0) {
    // Industrial ingredients without a strong pattern
    if (breakdown.industrialIngredientsFound.length >= 3) {
      parts.push(`Multiple industrial ingredients detected · ${breakdown.industrialIngredientsFound.slice(0, 3).join(", ")}`);
    } else {
      parts.push(`Industrial ingredients detected · ${breakdown.industrialIngredientsFound.join(", ")}`);
    }
  }

  // Additive signals
  const addCount = result.additiveMatches.length;
  const regulatoryCount = result.additiveMatches.filter(m => m.isRegulatory).length;
  const discretionaryCount = addCount - regulatoryCount;
  const highRiskCount = result.additiveMatches.filter(m => m.additive.riskLevel === "high").length;

  if (parts.length === 0) {
    // No industrial/pattern signals — additive-only explanation
    if (discretionaryCount > 0) {
      const topTypes = Array.from(
        new Set(
          result.additiveMatches
            .filter(m => !m.isRegulatory)
            .slice(0, 3)
            .map(m => m.additive.type),
        ),
      ).join(", ");
      parts.push(`${discretionaryCount} additive${discretionaryCount !== 1 ? "s" : ""} (${topTypes})`);
    } else if (regulatoryCount > 0) {
      parts.push(`${regulatoryCount} regulatory additive${regulatoryCount !== 1 ? "s" : ""} (required by law)`);
    } else {
      // Soft-term only (flavourings, yeast extract etc.)
      parts.push("Processing indicators detected");
    }
  } else {
    // Append additive detail if meaningful
    if (highRiskCount > 0) {
      parts.push(`${highRiskCount} high-concern additive${highRiskCount !== 1 ? "s" : ""}`);
    } else if (discretionaryCount > 0) {
      parts.push(`${discretionaryCount} additive${discretionaryCount !== 1 ? "s" : ""}`);
    }
  }

  return parts.join(" · ");
}

export function analyzeProductUPF(
  ingredientsText: string,
  additiveDb: Additive[],
  healthScore: number,
  productContext?: ProductContext,
  preParseIngredients?: ParsedIngredient[],
): UPFAnalysisResult {
  const ingredients = preParseIngredients ?? parseProductIngredients(ingredientsText);
  const additiveMatches = detectAdditives(ingredientsText, additiveDb);
  const processingIndicators = detectProcessingIndicators(ingredientsText);
  const upfScore = calculateUPFScore(ingredients, additiveMatches, processingIndicators);

  let additiveRisk = 0;
  for (const match of additiveMatches) {
    additiveRisk += (ADDITIVE_TYPE_RISK[match.additive.type] ?? 1) + (RISK_LEVEL_SCORES[match.additive.riskLevel] ?? 1);
  }

  const novaGroup = productContext?.novaGroup ?? (upfScore >= 50 ? 4 : upfScore >= 25 ? 3 : upfScore >= 10 ? 2 : 1);

  const regulatoryAdditives = additiveMatches.filter(m => m.isRegulatory);
  const thaBreakdown = buildProcessingBreakdown(additiveMatches, ingredientsText);

  // DEBUG — remove after investigation
  if (process.env.THA_SCORE_DEBUG === "1") {
    const softHits = SOFT_UPF_TERMS.filter(t => ingredientsText.toLowerCase().includes(t));
    EXTRACT_PATTERN.lastIndex = 0;
    const extractHits = ingredientsText.toLowerCase().match(EXTRACT_PATTERN) ?? [];
    console.log("[THA-DEBUG] ──────────────────────────────────────");
    console.log("[THA-DEBUG] input text    :", ingredientsText);
    console.log("[THA-DEBUG] DB matches    :", additiveMatches.map(m => `${m.additive.name}[${m.foundIn}]`).join(", ") || "none");
    console.log("[THA-DEBUG] soft hits     :", softHits.join(", ") || "none");
    console.log("[THA-DEBUG] extract hits  :", extractHits.join(", ") || "none");
    console.log("[THA-DEBUG] industrial    :", thaBreakdown.industrialIngredientsFound.join(", ") || "none");
    console.log("[THA-DEBUG] patterns      :", thaBreakdown.upfPatternsFound.join(", ") || "none");
    console.log("[THA-DEBUG] total penalty :", thaBreakdown.totalProcessingPenalty);
    console.log("[THA-DEBUG] thaRating     : will be", (() => {
      const t = thaBreakdown.totalProcessingPenalty;
      return t === 0 ? 5 : t === 1 ? 4 : t <= 3 ? 3 : t <= 5 ? 2 : 1;
    })());
    console.log("[THA-DEBUG] ──────────────────────────────────────");
  }

  return {
    upfScore,
    thaRating: calculateTHAAppleRating(additiveMatches.length, processingIndicators, novaGroup, ingredientsText),
    additiveMatches,
    additiveCount: additiveMatches.length,
    regulatoryAdditives,
    regulatoryCount: regulatoryAdditives.length,
    processingIndicators,
    ingredientCount: ingredients.length,
    upfIngredientCount: ingredients.filter(i => i.isUPF || i.isENumber).length,
    riskBreakdown: {
      additiveRisk: Math.min(40, additiveRisk * 2),
      processingRisk: Math.min(30, processingIndicators.length * 6),
      ingredientComplexityRisk: ingredients.length > 20 ? 10 : ingredients.length > 15 ? 7 : ingredients.length > 10 ? 5 : 0,
    },
    thaBreakdown,
  };
}
