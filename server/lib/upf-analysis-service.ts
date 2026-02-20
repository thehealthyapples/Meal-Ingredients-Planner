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

export interface ProductContext {
  productName: string;
  categoriesTags: string[];
  novaGroup: number | null;
}

export function analyzeProductUPF(
  ingredientsText: string,
  additiveDb: Additive[],
  healthScore: number,
  productContext?: ProductContext,
): UPFAnalysisResult {
  const ingredients = parseProductIngredients(ingredientsText);
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
    smpRating: smpResult.smpRating,
    hasCape: smpResult.hasCape,
    smpScore: smpResult.score,
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
