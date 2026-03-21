import { Additive } from "@shared/schema";
import { ParsedIngredient, parseProductIngredients } from "./product-analysis";
import { calculateStrictSMPRating, type SMPRatingResult } from "./smp-rating-service";

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
}

export interface UPFAnalysisResult {
  upfScore: number;
  smpRating: number;
  hasCape: boolean;
  smpScore: number;
  isWholeFoodOverride: boolean;
  isOrganic: boolean;
  additiveMatches: AdditiveMatch[];
  processingIndicators: string[];
  ingredientCount: number;
  upfIngredientCount: number;
  riskBreakdown: {
    additiveRisk: number;
    processingRisk: number;
    ingredientComplexityRisk: number;
  };
  smpPenalties: SMPRatingResult["penalties"];
  smpBonuses: SMPRatingResult["bonuses"];
}

export function detectAdditives(ingredientsText: string, additiveDb: Additive[]): AdditiveMatch[] {
  if (!ingredientsText) return [];
  const text = ingredientsText.toLowerCase();
  const matches: AdditiveMatch[] = [];
  const seen = new Set<number>();

  const eNumbers = text.match(E_NUMBER_PATTERN) || [];
  for (const eNum of eNumbers) {
    const normalized = eNum.toUpperCase();
    const additive = additiveDb.find(a => a.name.toUpperCase() === normalized);
    if (additive && !seen.has(additive.id)) {
      seen.add(additive.id);
      matches.push({ additive, foundIn: eNum });
    }
  }

  for (const additive of additiveDb) {
    if (seen.has(additive.id)) continue;
    const desc = additive.description?.toLowerCase() || "";
    const nameParts = desc.split(" - ");
    if (nameParts.length > 0) {
      const commonName = nameParts[0].replace(/\(.*?\)/g, "").trim();
      if (commonName.length > 3 && text.includes(commonName)) {
        seen.add(additive.id);
        matches.push({ additive, foundIn: commonName });
      }
    }
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

export function calculateSMPRating(upfScore: number, healthScore: number): number {
  const combined = (healthScore * 0.6) + ((100 - upfScore) * 0.4);

  if (combined >= 80) return 5;
  if (combined >= 65) return 4;
  if (combined >= 50) return 3;
  if (combined >= 35) return 2;
  return 1;
}

/**
 * Apple rating — considers E-number additives, "soft" UPF ingredients,
 * processing indicators, and NOVA group.
 *
 * Soft UPF ingredients (not E-numbers but indicative of UPF processing):
 *   yeast extract, natural flavouring/flavour, maltodextrin, dextrose,
 *   glucose syrup, hydrolysed protein, modified starch variants.
 *
 * NOVA hard caps:
 *   NOVA 4 → max 3 apples (reduced further to 2 if flavourings detected)
 *   NOVA 3 → max 4 apples
 *
 * 5 apples = NOVA 1/2, 0 additives, 0 soft UPF
 * 4 apples = NOVA 1/2, 1 additive/soft; or NOVA 3, 0 additives
 * 3 apples = 2–3 combined; or NOVA 4 with no flavourings
 * 2 apples = 4–5 combined; or NOVA 4 with flavourings
 * 1 apple  = 6+ combined additives
 */
export function calculateAdditiveRating(
  additiveCount: number,
  processingIndicators: string[] = [],
  novaGroup?: number | null,
  ingredientsText?: string,
): number {
  const text = (ingredientsText ?? "").toLowerCase();

  // Each term is distinct — "natural flavour" covers "natural flavouring",
  // "natural flavours" etc. via substring match, so we list the root only.
  const SOFT_UPF_TERMS = [
    "yeast extract",
    "natural flavour",   // covers natural flavouring / natural flavours
    "natural flavor",    // American spelling
    "maltodextrin",
    "dextrose",
    "glucose syrup",
    "hydrolysed",
    "modified starch",   // covers modified corn/tapioca/potato/maize starch
    "invert sugar",
  ];

  const softCount = SOFT_UPF_TERMS.filter(term => text.includes(term)).length;
  const effectiveCount = additiveCount + softCount;

  // Base score from combined additive count
  let score: number;
  if (effectiveCount === 0) score = 5;
  else if (effectiveCount === 1) score = 4;
  else if (effectiveCount <= 3) score = 3;
  else if (effectiveCount <= 5) score = 2;
  else score = 1;

  // NOVA group hard caps
  if (novaGroup === 4) score = Math.min(score, 3);
  if (novaGroup === 3) score = Math.min(score, 4);

  // Additional penalty: NOVA 4 + flavouring agents → cap at 2
  const hasFlavouring = processingIndicators.some(i =>
    i.toLowerCase().includes("flavour") || i.toLowerCase().includes("flavor")
  );
  if (novaGroup === 4 && hasFlavouring) score = Math.min(score, 2);

  return Math.max(1, Math.min(5, score));
}

export interface ProductContext {
  productName: string;
  categoriesTags: string[];
  novaGroup: number | null;
}

// Converts a UPFAnalysisResult into a concise, plain-English phrase for display in THA.
// Intended as a single-line summary shown next to a product card.
export function buildTHAExplanation(result: UPFAnalysisResult, novaGroup?: number | null): string {
  if (result.isWholeFoodOverride) return "Minimally processed — mostly whole-food ingredients";
  if (result.isOrganic && result.additiveMatches.length === 0) return "Organic with no detected additives";

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

  if (addCount === 0 && result.processingIndicators.length === 0) {
    parts.push("no additives detected");
  } else {
    if (addCount > 0) {
      const topTypes = Array.from(new Set(result.additiveMatches.slice(0, 3).map(m => m.additive.type))).join(", ");
      parts.push(`${addCount} additive${addCount !== 1 ? "s" : ""} (${topTypes})`);
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

  const smpResult = calculateStrictSMPRating({
    novaGroup,
    additiveMatches,
    ingredientsText,
    ingredientCount: ingredients.length,
    productName: productContext?.productName ?? "",
    categoriesTags: productContext?.categoriesTags ?? [],
  });

  return {
    upfScore,
    smpRating: calculateAdditiveRating(additiveMatches.length, processingIndicators, novaGroup, ingredientsText),
    hasCape: smpResult.hasCape,
    smpScore: smpResult.score,
    isWholeFoodOverride: smpResult.isWholeFoodOverride,
    isOrganic: smpResult.isOrganic,
    additiveMatches,
    processingIndicators,
    ingredientCount: ingredients.length,
    upfIngredientCount: ingredients.filter(i => i.isUPF || i.isENumber).length,
    riskBreakdown: {
      additiveRisk: Math.min(40, additiveRisk * 2),
      processingRisk: Math.min(30, processingIndicators.length * 6),
      ingredientComplexityRisk: ingredients.length > 20 ? 10 : ingredients.length > 15 ? 7 : ingredients.length > 10 ? 5 : 0,
    },
    smpPenalties: smpResult.penalties,
    smpBonuses: smpResult.bonuses,
  };
}
