import { getWholeFoodAlternative } from "@/lib/whole-food-alternatives";
import { rankChoices, buildWhyBetter } from "@/lib/analyser-choice";
import type { WholeFoodAlternative } from "@/lib/whole-food-alternatives";

// Input type mirrors ProductResult from products-page - structurally compatible
export interface InputProduct {
  product_name: string;
  brand: string | null;
  image_url: string | null;
  ingredients_text: string | null;
  nova_group: number | null;
  nutriscore_grade: string | null;
  categories_tags: string[];
  isUK?: boolean;
  availableStores?: string[];
  quantity?: string | null;
  barcode?: string | null;
  nutriments: {
    calories: string | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    sugar: string | null;
    salt: string | null;
  } | null;
  nutriments_raw?: Record<string, unknown> | null;
  analysis?: {
    ingredients: Array<{ name: string; percent: number | null; isUPF: boolean; isENumber: boolean }>;
    novaGroup: number;
    healthScore: number;
    isUltraProcessed: boolean;
    warnings: string[];
    upfCount: number;
    totalIngredients: number;
  } | null;
  upfAnalysis?: {
    upfScore: number;
    thaRating: number;
    additiveCount: number;
    regulatoryCount: number;
    additiveMatches: Array<{
      name: string;
      type: string;
      riskLevel: string;
      description: string | null;
      foundIn: string;
      isRegulatory?: boolean;
    }>;
    processingIndicators: string[];
    ingredientCount: number;
    upfIngredientCount: number;
    riskBreakdown: {
      additiveRisk: number;
      processingRisk: number;
      ingredientComplexityRisk: number;
    };
    thaExplanation?: string;
  } | null;
}

export interface ScoreDriver {
  text: string;
  polarity: "positive" | "negative";
}

export interface AnalyserAdditive {
  name: string;
  type: string;
  riskLevel: string;
  description: string | null;
  isRegulatory: boolean;
}

export interface AnalyserIngredient {
  name: string;
  isUPF: boolean;
  isENumber: boolean;
  percent: number | null;
}

export interface WholeFoodSwap {
  type: "whole-food";
  title: string;
  emoji: string;
  effort: WholeFoodAlternative["effort"];
  timeMinutes: number;
  ingredients: string[];
  method: string;
  tip?: string;
}

export interface PackagedSwap {
  type: "packaged";
  name: string;
  brand: string | null;
  imageUrl: string | null;
  rating: number;
  whyBetter: string[];
  product: InputProduct;
}

export type AnalyserSwap = WholeFoodSwap | PackagedSwap;

export interface AnalyserViewModel {
  product: {
    name: string;
    brand: string | null;
    packSize: string | null;
    imageUrl: string | null;
    barcode: string | null;
    isUK: boolean;
    retailers: string[];
    novaGroup: number | null;
  };
  score: {
    rating: number;
    label: string;
    verdict: string;
    additiveContext: {
      total: number;
      regulatory: number;
      topType: string | undefined;
    };
  };
  scoreDrivers: ScoreDriver[];
  thaReview: string;
  ingredients: {
    rawText: string | null;
    parsed: AnalyserIngredient[];
    additives: AnalyserAdditive[];
    processingIndicators: string[];
    totalCount: number;
    flaggedCount: number;
    allAdditivesRegulatory: boolean;
  };
  nutrition: {
    calories: string | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    sugar: string | null;
    salt: string | null;
  } | null;
  swaps: AnalyserSwap[];
  uiMeta: {
    hasIngredients: boolean;
    hasAdditives: boolean;
    hasNutrition: boolean;
    hasSwaps: boolean;
  };
}

// ─── Score label + verdict ────────────────────────────────────────────────────

function getScoreLabel(rating: number): string {
  if (rating >= 5) return "Excellent";
  if (rating >= 4) return "Good";
  if (rating >= 3) return "Fair";
  if (rating >= 2) return "Mixed";
  return "High Processing";
}

function getScoreVerdict(product: InputProduct): string {
  const upf = product.upfAnalysis;
  const rating = upf?.thaRating ?? 0;
  const nonReg = (upf?.additiveMatches ?? []).filter((a) => !a.isRegulatory);
  if (rating >= 5) return "A clean choice - no additives detected";
  if (rating >= 4)
    return nonReg.length === 1
      ? "A simpler everyday option with just one additive"
      : "A simpler everyday option with minimal additives";
  if (rating >= 3) return "A few additives present - worth comparing alternatives";
  if (rating >= 2) return "Several additives detected - simpler options are available";
  return "More processed than the simplest alternatives";
}

// ─── Score drivers (why this scored X) ───────────────────────────────────────

function buildScoreDrivers(product: InputProduct): ScoreDriver[] {
  const drivers: ScoreDriver[] = [];
  const upf = product.upfAnalysis;
  if (!upf) return drivers;

  const nonReg = upf.additiveMatches.filter((a) => !a.isRegulatory);
  const highRisk = nonReg.filter((a) => a.riskLevel === "high");
  const novaGroup = product.nova_group || product.analysis?.novaGroup;
  const ingCount = upf.ingredientCount || product.analysis?.totalIngredients || 0;

  // Positives
  if (nonReg.length === 0 && upf.regulatoryCount === 0) {
    drivers.push({ text: "No additives detected in the ingredient list", polarity: "positive" });
  } else if (nonReg.length === 1) {
    drivers.push({ text: "Only one additive detected", polarity: "positive" });
  }

  if (upf.regulatoryCount > 0 && upf.regulatoryCount === upf.additiveMatches.length) {
    drivers.push({
      text: "Additives present are regulatory requirements, not manufacturing choices",
      polarity: "positive",
    });
  }

  if (highRisk.length === 0 && nonReg.length > 0) {
    drivers.push({ text: "No high-concern additives detected", polarity: "positive" });
  }

  if (novaGroup && novaGroup <= 2) {
    drivers.push({
      text: "Minimally processed - ingredient list consistent with home cooking",
      polarity: "positive",
    });
  }

  if (ingCount > 0 && ingCount <= 5) {
    drivers.push({ text: `Short, simple ingredient list (${ingCount} ingredients)`, polarity: "positive" });
  }

  // Negatives
  for (const a of highRisk.slice(0, 2)) {
    drivers.push({
      text: `${a.name} (${a.type}) - a high-concern additive, less typical in home cooking`,
      polarity: "negative",
    });
  }
  if (highRisk.length > 2) {
    drivers.push({
      text: `${highRisk.length - 2} further high-concern additive${highRisk.length - 2 > 1 ? "s" : ""} detected`,
      polarity: "negative",
    });
  }

  if (nonReg.length >= 4) {
    drivers.push({
      text: `${nonReg.length} additives detected - more than typical for simpler alternatives`,
      polarity: "negative",
    });
  } else if (nonReg.length >= 2 && highRisk.length === 0) {
    drivers.push({
      text: `${nonReg.length} additives detected - more common in packaged foods than home cooking`,
      polarity: "negative",
    });
  }

  if (novaGroup === 4) {
    drivers.push({
      text: "Ultra-processed classification (NOVA 4) - industrial process beyond standard cooking",
      polarity: "negative",
    });
  } else if (novaGroup === 3) {
    drivers.push({ text: "Processed food classification (NOVA 3)", polarity: "negative" });
  }

  if (upf.processingIndicators.length > 0) {
    const top = upf.processingIndicators.slice(0, 2).join(", ");
    drivers.push({ text: `Processing indicators found: ${top}`, polarity: "negative" });
  }

  return drivers;
}

// ─── THA editorial review ─────────────────────────────────────────────────────

function generateTHAReview(product: InputProduct): string {
  const upf = product.upfAnalysis;
  const rating = upf?.thaRating ?? 0;
  const name = product.product_name;
  const nonReg = (upf?.additiveMatches ?? []).filter((a) => !a.isRegulatory);
  const novaGroup = product.nova_group || product.analysis?.novaGroup;
  const indicators = upf?.processingIndicators ?? [];

  if (rating >= 5) {
    return `${name} reads as a clean product - no additives were detected in our analysis. For a packaged food, that is genuinely rare. The ingredient list appears straightforward and consistent with what you would prepare at home. A confident everyday choice.`;
  }

  if (rating >= 4) {
    const addStr =
      nonReg.length > 0
        ? `The ${nonReg.length === 1 ? "additive" : "additives"} detected - ${nonReg
            .slice(0, 2)
            .map((a) => a.name)
            .join(", ")} - ${nonReg.length === 1 ? "is" : "are"} commonly found in packaged foods and not a major concern. `
        : "";
    return `${name} has a relatively clean profile for a packaged product. ${addStr}Worth keeping in regular rotation if it fits your routine - a practical, accessible option with a simpler ingredient profile than most alternatives in this category.`;
  }

  if (rating >= 3) {
    const topAdditives = nonReg
      .slice(0, 2)
      .map((a) => a.name)
      .join(" and ");
    const addStr = topAdditives
      ? `You will find ${topAdditives} in the ingredient list - this is more common in packaged foods than in home cooking. `
      : "";
    return `${name} sits in the middle of the range. ${addStr}It is not a product we would flag as a concern, but it is worth comparing with simpler alternatives where they exist. Occasional use is unlikely to be an issue.`;
  }

  if (rating >= 2) {
    const indStr =
      indicators.length > 0
        ? ` Processing indicators such as ${indicators.slice(0, 2).join(" and ")} are present.`
        : "";
    return `${name} contains a number of additives more typical of heavily manufactured products.${indStr} There are likely cleaner alternatives available - it is worth taking a moment to compare before making this a regular weekly purchase.`;
  }

  const novaStr = novaGroup === 4 ? " It falls into the ultra-processed (NOVA 4) category." : "";
  return `${name} has a complex ingredient profile with multiple additives detected.${novaStr} This product is more processed than the simplest alternatives available. We would suggest treating it as an occasional rather than regular choice, and exploring cleaner options where possible.`;
}

// ─── Main adapter ─────────────────────────────────────────────────────────────

export function buildAnalyserViewModel(
  product: InputProduct,
  otherProducts: InputProduct[] = []
): AnalyserViewModel {
  const upf = product.upfAnalysis;
  const rating = upf?.thaRating ?? 0;
  const novaGroup = product.nova_group || product.analysis?.novaGroup;

  const additives: AnalyserAdditive[] = (upf?.additiveMatches ?? []).map((a) => ({
    name: a.name,
    type: a.type,
    riskLevel: a.riskLevel,
    description: a.description,
    isRegulatory: a.isRegulatory ?? false,
  }));

  const parsed: AnalyserIngredient[] = (product.analysis?.ingredients ?? []).map((i) => ({
    name: i.name,
    isUPF: i.isUPF,
    isENumber: i.isENumber,
    percent: i.percent,
  }));

  const allAdditivesRegulatory = additives.length > 0 && additives.every((a) => a.isRegulatory);

  // Build swaps
  const swaps: AnalyserSwap[] = [];

  const wfAlt = getWholeFoodAlternative(product.product_name);
  if (wfAlt) {
    swaps.push({
      type: "whole-food",
      title: wfAlt.title,
      emoji: wfAlt.emoji,
      effort: wfAlt.effort,
      timeMinutes: wfAlt.timeMinutes,
      ingredients: wfAlt.ingredients,
      method: wfAlt.method,
      tip: wfAlt.tip,
    });
  }

  const betterOptions = rankChoices(
    otherProducts.filter((p) => p.barcode !== product.barcode),
    rating
  ).slice(0, 3);

  for (const opt of betterOptions) {
    swaps.push({
      type: "packaged",
      name: opt.product_name,
      brand: opt.brand,
      imageUrl: opt.image_url,
      rating: opt.upfAnalysis?.thaRating ?? 0,
      whyBetter: buildWhyBetter(opt, rating),
      product: opt,
    });
  }

  const hasNutrition = !!(
    product.nutriments && Object.values(product.nutriments).some((v) => v !== null)
  );

  const nonRegAdditives = additives.filter((a) => !a.isRegulatory);

  return {
    product: {
      name: product.product_name,
      brand: product.brand,
      packSize: product.quantity ?? null,
      imageUrl: product.image_url,
      barcode: product.barcode ?? null,
      isUK: product.isUK ?? false,
      retailers: product.availableStores ?? [],
      novaGroup: novaGroup ?? null,
    },
    score: {
      rating,
      label: getScoreLabel(rating),
      verdict: getScoreVerdict(product),
      additiveContext: {
        total: nonRegAdditives.length,
        regulatory: upf?.regulatoryCount ?? 0,
        topType: nonRegAdditives[0]?.type,
      },
    },
    scoreDrivers: buildScoreDrivers(product),
    thaReview: generateTHAReview(product),
    ingredients: {
      rawText: product.ingredients_text,
      parsed,
      additives,
      processingIndicators: upf?.processingIndicators ?? [],
      totalCount: upf?.ingredientCount ?? product.analysis?.totalIngredients ?? 0,
      flaggedCount: upf?.upfIngredientCount ?? product.analysis?.upfCount ?? 0,
      allAdditivesRegulatory,
    },
    nutrition: hasNutrition
      ? {
          calories: product.nutriments?.calories ?? null,
          protein: product.nutriments?.protein ?? null,
          carbs: product.nutriments?.carbs ?? null,
          fat: product.nutriments?.fat ?? null,
          sugar: product.nutriments?.sugar ?? null,
          salt: product.nutriments?.salt ?? null,
        }
      : null,
    swaps,
    uiMeta: {
      hasIngredients: !!(product.ingredients_text || parsed.length > 0),
      hasAdditives: additives.length > 0,
      hasNutrition,
      hasSwaps: swaps.length > 0,
    },
  };
}
