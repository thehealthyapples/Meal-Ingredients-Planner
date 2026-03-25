import { Additive } from "@shared/schema";
import { ParsedIngredient, parseProductIngredients } from "./product-analysis";

const E_NUMBER_PATTERN = /\bE\d{3,4}[a-z]?\b/gi;

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
  processingIndicators: string[];
  ingredientCount: number;
  upfIngredientCount: number;
  riskBreakdown: {
    additiveRisk: number;
    processingRisk: number;
    ingredientComplexityRisk: number;
  };
}

// Extract detection pattern — module-scope so tests can import it directly.
// Each match represents one distinct extract declaration in the ingredient text.
// Grouped phrases (e.g. "spice and herb extracts") produce one match because
// only the qualifying word immediately before "extract(s)" is captured.
// Plain "spice", "spices", "herbs" without "extract" do NOT match.
// "yeast extract" is intentionally absent — handled by SOFT_UPF_TERMS.
// Global flag is required for counted matching via String.prototype.match().
export const EXTRACT_PATTERN = /\b(?:herb|spice|plant|botanical|mixed|vegetable|fruit|natural|rosemary|thyme|oregano|basil|sage|bay|parsley|coriander|fennel|tarragon|mint|marjoram|lavender|chamomile|turmeric|ginger|paprika|celery|elderflower|elderberry|hibiscus|lemon|orange|lime|garlic|onion|pepper|chilli|chili)\s+extracts?\b/gi;

// Pattern that identifies a fortified-flour context surrounding a match.
// When E170 (Calcium Carbonate) appears inside "fortified wheat flour (…)"
// we flag it as regulatory rather than discretionary.
const FORTIFIED_FLOUR_PATTERN = /fortif(?:ied|ication)/i;

export function detectAdditives(ingredientsText: string, additiveDb: Additive[]): AdditiveMatch[] {
  if (!ingredientsText) return [];
  const text = ingredientsText.toLowerCase();
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
    const normalized = eNum.toUpperCase();
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
    // LEADING boundary only: start-of-string OR a delimiter (, ; ( [).
    // Spaces are intentionally excluded as a leading boundary — a term
    // preceded only by a space is embedded mid-phrase (e.g. "of fatty
    // acids") and must NOT match.
    // No trailing restriction: "Mono- and Diglycerides" legitimately
    // has " of Fatty Acids" after it before the closing paren.
    const rx = new RegExp(`(?:^|[,;(\\[])\\s*${escaped}`, "i");
    const m = rx.exec(t);
    if (!m) return -1;
    // Return the index where the term itself starts within the match.
    const termStart = t.toLowerCase().indexOf(term, m.index);
    return termStart;
  }

  const candidates = additiveDb
    .filter(a => !seen.has(a.id))
    .map(a => {
      const commonName = (a.description?.toLowerCase().split(" - ")[0] ?? "")
        .replace(/\(.*?\)/g, "")
        .trim();
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

/**
 * Apple rating — pure additive-count model.
 *
 * "Additives" = E-number matches from the DB  +  soft UPF terms
 * (yeast extract, natural flavouring, maltodextrin, dextrose, glucose syrup,
 * hydrolysed, modified starch, invert sugar).
 *
 * NOVA does NOT influence this score.
 *
 * 5 apples = 0 additives
 * 4 apples = 1 additive
 * 3 apples = 2–3 additives
 * 2 apples = 4 additives
 * 1 apple  = 5+ additives
 */
export function calculateTHAAppleRating(
  additiveCount: number,
  processingIndicators: string[] = [],
  novaGroup?: number | null,
  ingredientsText?: string,
): number {
  const text = (ingredientsText ?? "").toLowerCase();

  // Soft UPF terms that count as additives even without an E-number.
  // Roots only — "natural flavour" matches "natural flavouring/flavours" etc.
  const SOFT_UPF_TERMS = [
    "yeast extract",
    "natural flavour",    // covers natural flavouring / natural flavours
    "natural flavor",     // American spelling
    "maltodextrin",
    "dextrose",
    "glucose syrup",
    "hydrolysed",
    "modified starch",    // covers modified corn/tapioca/potato/maize starch
    "invert sugar",
  ];

  // EXTRACT_PATTERN is module-level (exported). Reset lastIndex before use
  // because the global flag makes the RegExp object stateful.
  EXTRACT_PATTERN.lastIndex = 0;
  const extractHit = (text.match(EXTRACT_PATTERN) ?? []).length;

  const softCount = SOFT_UPF_TERMS.filter(term => text.includes(term)).length;
  const effectiveCount = additiveCount + softCount + extractHit;

  // Pure 5→1 mapping — NOVA is not a factor
  if (effectiveCount === 0) return 5;
  if (effectiveCount === 1) return 4;
  if (effectiveCount <= 3) return 3;
  if (effectiveCount === 4) return 2;
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
  const nova = novaGroup ?? (result.upfScore >= 50 ? 4 : result.upfScore >= 25 ? 3 : result.upfScore >= 10 ? 2 : 1);
  const addCount = result.additiveMatches.length;
  const highRiskCount = result.additiveMatches.filter(m => m.additive.riskLevel === "high").length;
  const parts: string[] = [];

  if (nova === 4) {
    parts.push("Ultra-processed (NOVA 4)");
  } else if (nova === 3) {
    parts.push("Moderately processed (NOVA 3)");
  } else if (nova <= 2 && addCount === 0 && result.processingIndicators.length === 0) {
    return "Low processing — minimal additives detected";
  }

  const regulatoryCount = result.additiveMatches.filter(m => m.isRegulatory).length;
  const discretionaryCount = addCount - regulatoryCount;

  if (addCount === 0 && result.processingIndicators.length === 0) {
    parts.push("no additives detected");
  } else {
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
    }
    if (regulatoryCount > 0) {
      parts.push(`${regulatoryCount} regulatory`);
    }
    if (highRiskCount > 0) {
      parts.push(`${highRiskCount} high-risk`);
    }
    if (result.processingIndicators.length > 0) {
      parts.push(result.processingIndicators.slice(0, 2).map(s => s.toLowerCase()).join(", "));
    }
  }

  return parts.length > 0 ? parts.join(" · ") : "Processing level unknown";
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

  return {
    upfScore,
    thaRating: calculateTHAAppleRating(additiveMatches.length, processingIndicators, novaGroup, ingredientsText),
    additiveMatches,
    processingIndicators,
    ingredientCount: ingredients.length,
    upfIngredientCount: ingredients.filter(i => i.isUPF || i.isENumber).length,
    riskBreakdown: {
      additiveRisk: Math.min(40, additiveRisk * 2),
      processingRisk: Math.min(30, processingIndicators.length * 6),
      ingredientComplexityRisk: ingredients.length > 20 ? 10 : ingredients.length > 15 ? 7 : ingredients.length > 10 ? 5 : 0,
    },
  };
}
