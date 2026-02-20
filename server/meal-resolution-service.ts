import { storage } from "./storage";
import type { Meal, MealTemplate, MealTemplateProduct, UserPreferences } from "@shared/schema";

export interface ResolvedMeal {
  templateId: number;
  templateName: string;
  resolvedMealId: number | null;
  resolvedSourceType: 'scratch' | 'ready_meal';
  meal: Meal | null;
  readyMealProduct: MealTemplateProduct | null;
  score: number;
  reasoning: string[];
}

interface ScoringWeights {
  qualityWeight: number;
  budgetWeight: number;
  upfWeight: number;
}

function getWeights(prefs: UserPreferences | null): ScoringWeights {
  const quality = prefs?.qualityPreference || 'standard';
  const budget = prefs?.budgetLevel || 'standard';
  const upf = prefs?.upfSensitivity || 'moderate';

  let qualityWeight = 0.33;
  let budgetWeight = 0.33;
  let upfWeight = 0.34;

  if (quality === 'premium') qualityWeight = 0.5;
  if (quality === 'budget') { qualityWeight = 0.15; budgetWeight = 0.5; }
  if (budget === 'budget') budgetWeight = 0.5;
  if (budget === 'premium') budgetWeight = 0.15;
  if (upf === 'strict') upfWeight = 0.5;
  if (upf === 'relaxed') upfWeight = 0.15;

  const total = qualityWeight + budgetWeight + upfWeight;
  return {
    qualityWeight: qualityWeight / total,
    budgetWeight: budgetWeight / total,
    upfWeight: upfWeight / total,
  };
}

function scoreScratchMeal(meal: Meal, weights: ScoringWeights): { score: number; reasoning: string[] } {
  const reasoning: string[] = [];
  let qualityScore = 0.8;
  let budgetScore = 0.5;
  let upfScore = 1.0;

  reasoning.push("Scratch recipe: high quality (homemade)");
  reasoning.push("Scratch recipe: zero UPF risk");
  reasoning.push("Scratch recipe: moderate budget (ingredient costs)");

  const score = qualityScore * weights.qualityWeight +
    budgetScore * weights.budgetWeight +
    upfScore * weights.upfWeight;

  return { score, reasoning };
}

function scoreReadyMealProduct(product: MealTemplateProduct, weights: ScoringWeights): { score: number; reasoning: string[] } {
  const reasoning: string[] = [];

  let qualityScore = 0.5;
  const tier = product.qualityTier || 'standard';
  if (tier === 'premium' || tier === 'organic') qualityScore = 0.7;
  if (tier === 'budget') qualityScore = 0.3;
  reasoning.push(`Ready meal (${tier} tier): quality ${Math.round(qualityScore * 100)}%`);

  let budgetScore = 0.7;
  if (product.estimatedPrice) {
    if (product.estimatedPrice < 3) budgetScore = 0.9;
    else if (product.estimatedPrice < 5) budgetScore = 0.7;
    else if (product.estimatedPrice < 8) budgetScore = 0.5;
    else budgetScore = 0.3;
  }
  reasoning.push(`Price: ${product.estimatedPrice ? `£${product.estimatedPrice.toFixed(2)}` : 'unknown'}`);

  let upfScoreVal = 0.3;
  if (product.upfScore !== null && product.upfScore !== undefined) {
    upfScoreVal = Math.max(0, 1 - product.upfScore / 100);
    reasoning.push(`UPF score: ${product.upfScore}/100`);
  } else {
    reasoning.push("UPF score: unknown (assumed moderate)");
  }

  const score = qualityScore * weights.qualityWeight +
    budgetScore * weights.budgetWeight +
    upfScoreVal * weights.upfWeight;

  return { score, reasoning };
}

export async function resolveTemplate(
  templateId: number,
  userId?: number,
  forcedSourceType?: 'scratch' | 'ready_meal' | 'hybrid'
): Promise<ResolvedMeal | null> {
  const template = await storage.getMealTemplate(templateId);
  if (!template) return null;

  let prefs: UserPreferences | null = null;
  if (userId) {
    prefs = await storage.getUserPreferences(userId) || null;
  }

  const weights = getWeights(prefs);
  const scratchMeals = await storage.getMealsForTemplate(templateId);
  const readyMealProducts = await storage.getMealTemplateProducts(templateId);

  const scratchMeal = scratchMeals.find(m => m.mealSourceType === 'scratch') || scratchMeals[0] || null;

  interface Candidate {
    sourceType: 'scratch' | 'ready_meal';
    meal: Meal | null;
    product: MealTemplateProduct | null;
    score: number;
    reasoning: string[];
  }

  const candidates: Candidate[] = [];

  if (scratchMeal) {
    const { score, reasoning } = scoreScratchMeal(scratchMeal, weights);
    candidates.push({ sourceType: 'scratch', meal: scratchMeal, product: null, score, reasoning });
  }

  for (const product of readyMealProducts) {
    const { score, reasoning } = scoreReadyMealProduct(product, weights);
    candidates.push({ sourceType: 'ready_meal', meal: null, product, score, reasoning });
  }

  if (candidates.length === 0) {
    return {
      templateId,
      templateName: template.name,
      resolvedMealId: null,
      resolvedSourceType: 'scratch',
      meal: null,
      readyMealProduct: null,
      score: 0,
      reasoning: ['No implementations available for this template'],
    };
  }

  if (forcedSourceType && forcedSourceType !== 'hybrid') {
    const forced = candidates.filter(c => c.sourceType === forcedSourceType);
    if (forced.length > 0) {
      const best = forced.sort((a, b) => b.score - a.score)[0];
      return {
        templateId,
        templateName: template.name,
        resolvedMealId: best.meal?.id || null,
        resolvedSourceType: best.sourceType,
        meal: best.meal,
        readyMealProduct: best.product,
        score: best.score,
        reasoning: [`Forced source: ${forcedSourceType}`, ...best.reasoning],
      };
    }
  }

  const best = candidates.sort((a, b) => b.score - a.score)[0];
  return {
    templateId,
    templateName: template.name,
    resolvedMealId: best.meal?.id || null,
    resolvedSourceType: best.sourceType,
    meal: best.meal,
    readyMealProduct: best.product,
    score: best.score,
    reasoning: best.reasoning,
  };
}

export async function resolveAllTemplatesForPlan(
  planId: number,
  userId?: number
): Promise<Map<number, ResolvedMeal>> {
  const entries = await storage.getMealPlanEntries(planId);
  const results = new Map<number, ResolvedMeal>();

  for (const entry of entries) {
    const tid = entry.mealTemplateId;
    if (tid && !results.has(tid)) {
      const resolved = await resolveTemplate(tid, userId);
      if (resolved) results.set(tid, resolved);
    }
  }

  return results;
}
