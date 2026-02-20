import type { AdditiveMatch } from "./upf-analysis-service";

const DAIRY_MEAT_KEYWORDS = [
  "dairy", "milk", "cheese", "yoghurt", "yogurt", "cream", "butter",
  "beef", "meat", "steak", "mince", "burger", "lamb", "pork", "chicken",
  "turkey", "sausage", "bacon",
];

const ORGANIC_KEYWORDS = ["organic", "bio", "biologique"];

const SUPERFOODS = [
  "quinoa", "chia", "flaxseed", "linseed", "turmeric", "ginger",
  "blueberry", "blueberries", "acai", "spinach", "kale", "broccoli",
  "avocado", "salmon", "sardine", "sardines", "mackerel", "walnut",
  "walnuts", "almond", "almonds", "oats", "sweet potato", "garlic",
  "green tea", "matcha", "pomegranate", "beetroot", "lentil", "lentils",
  "chickpea", "chickpeas", "hemp seed", "hemp seeds", "spirulina",
  "seaweed", "olive oil", "coconut oil", "dark chocolate", "cacao",
];

export interface SMPRatingInput {
  novaGroup: number;
  additiveMatches: AdditiveMatch[];
  ingredientsText: string;
  ingredientCount: number;
  productName: string;
  categoriesTags: string[];
}

export interface SMPRatingResult {
  score: number;
  smpRating: number;
  hasCape: boolean;
  penalties: {
    nova: number;
    highRiskAdditives: number;
    emulsifiers: number;
    acidityRegulators: number;
    bovaerRisk: number;
  };
  bonuses: {
    organic: number;
    superfoods: number;
    simplicity: number;
  };
}

function isDairyOrMeat(productName: string, categoriesTags: string[]): boolean {
  const lowerName = productName.toLowerCase();
  const lowerCats = categoriesTags.map(c => c.toLowerCase()).join(" ");
  const combined = `${lowerName} ${lowerCats}`;
  return DAIRY_MEAT_KEYWORDS.some(kw => combined.includes(kw));
}

function isOrganic(productName: string, ingredientsText: string, categoriesTags: string[]): boolean {
  const combined = `${productName} ${ingredientsText} ${categoriesTags.join(" ")}`.toLowerCase();
  return ORGANIC_KEYWORDS.some(kw => combined.includes(kw));
}

function countSuperfoods(ingredientsText: string): number {
  const lower = ingredientsText.toLowerCase();
  let count = 0;
  for (const sf of SUPERFOODS) {
    if (lower.includes(sf)) count++;
  }
  return count;
}

export function calculateStrictSMPRating(input: SMPRatingInput): SMPRatingResult {
  let score = 100;

  let novaPenalty = 0;
  if (input.novaGroup === 2) novaPenalty = 5;
  else if (input.novaGroup === 3) novaPenalty = 15;
  else if (input.novaGroup === 4) novaPenalty = 40;
  score -= novaPenalty;

  let highRiskCount = 0;
  let emulsifierCount = 0;
  let acidityRegulatorCount = 0;

  for (const match of input.additiveMatches) {
    if (match.additive.riskLevel === "high") highRiskCount++;
    const type = match.additive.type.toLowerCase();
    if (type === "emulsifier") emulsifierCount++;
    if (type === "acidity regulator") acidityRegulatorCount++;
  }

  const highRiskPenalty = highRiskCount * 8;
  const emulsifierPenalty = emulsifierCount * 6;
  const acidityPenalty = acidityRegulatorCount * 3;
  score -= highRiskPenalty;
  score -= emulsifierPenalty;
  score -= acidityPenalty;

  const organic = isOrganic(input.productName, input.ingredientsText, input.categoriesTags);
  const dairyMeat = isDairyOrMeat(input.productName, input.categoriesTags);

  let bovaerPenalty = 0;
  if (dairyMeat && !organic) {
    bovaerPenalty = 10;
    score -= bovaerPenalty;
  }

  let organicBonus = 0;
  if (organic) {
    organicBonus = 15;
    score += organicBonus;
  }

  const superfoodCount = countSuperfoods(input.ingredientsText);
  const superfoodBonus = superfoodCount * 5;
  score += superfoodBonus;

  let simplicityBonus = 0;
  const totalAdditiveCount = input.additiveMatches.length;
  if (input.ingredientCount <= 3 && totalAdditiveCount === 0) {
    simplicityBonus = 20;
    score += simplicityBonus;
  }

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  let smpRating: number;
  if (score >= 90) smpRating = 5;
  else if (score >= 75) smpRating = 4;
  else if (score >= 55) smpRating = 3;
  else if (score >= 35) smpRating = 2;
  else smpRating = 1;

  const hasCape = score >= 90 && totalAdditiveCount === 0 && (organic || superfoodCount > 0 || input.novaGroup === 1);

  return {
    score,
    smpRating,
    hasCape,
    penalties: {
      nova: novaPenalty,
      highRiskAdditives: highRiskPenalty,
      emulsifiers: emulsifierPenalty,
      acidityRegulators: acidityPenalty,
      bovaerRisk: bovaerPenalty,
    },
    bonuses: {
      organic: organicBonus,
      superfoods: superfoodBonus,
      simplicity: simplicityBonus,
    },
  };
}
