/**
 * uplift-engine.ts
 * ================
 * Deterministic, zero-AI nutrition uplift matching engine.
 *
 * Design constraints:
 * - No AI calls, no DB writes, no external I/O
 * - Sub-30ms matching for normal weekly planner payloads
 * - Every output traces back to an explicit rule + trigger
 * - Rules without reviewedAt are excluded (approval gate)
 */

import type {
  UpliftRule,
  UpliftContext,
  UpliftMatchResult,
  UpliftSuggestion,
  BatchUpliftInput,
  BatchUpliftOutput,
} from './uplift-types.js';

const DEBUG = process.env.NODE_ENV === 'development';

// ─── Internal index types ─────────────────────────────────────────────────────

interface RuleIndex {
  byIngredientToken: Map<string, UpliftRule[]>;
  byMealNameToken: Map<string, UpliftRule[]>;
  byCategoryToken: Map<string, UpliftRule[]>;
  bySlotToken: Map<string, UpliftRule[]>;
  /** Rules with no index-able token (shouldn't happen in practice) */
  unindexed: UpliftRule[];
}

// ─── Normalisation ────────────────────────────────────────────────────────────

function normaliseMealName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function normaliseIngredients(ingredients: string[]): string[] {
  return ingredients.map(i => i.toLowerCase().trim());
}

function normaliseToken(token: string): string {
  return token.toLowerCase().trim();
}

// ─── Index construction ───────────────────────────────────────────────────────

/**
 * Builds a reverse index over a reviewed rule set.
 * Only rules with reviewedAt are indexed — unreviewed rules are silently dropped.
 */
export function buildRuleIndex(rules: UpliftRule[]): RuleIndex {
  const reviewed = rules.filter(r => {
    if (!r.reviewedAt) {
      if (DEBUG) console.log(`[uplift-engine] Skipping unreviewed rule: ${r.id}`);
      return false;
    }
    return true;
  });

  const idx: RuleIndex = {
    byIngredientToken: new Map(),
    byMealNameToken: new Map(),
    byCategoryToken: new Map(),
    bySlotToken: new Map(),
    unindexed: [],
  };

  for (const rule of reviewed) {
    let indexed = false;

    for (const token of rule.trigger.ingredientPattern ?? []) {
      const key = normaliseToken(token);
      if (!idx.byIngredientToken.has(key)) idx.byIngredientToken.set(key, []);
      idx.byIngredientToken.get(key)!.push(rule);
      indexed = true;
    }

    for (const token of rule.trigger.mealNamePattern ?? []) {
      const key = normaliseToken(token);
      if (!idx.byMealNameToken.has(key)) idx.byMealNameToken.set(key, []);
      idx.byMealNameToken.get(key)!.push(rule);
      indexed = true;
    }

    for (const token of rule.trigger.categoryPattern ?? []) {
      const key = normaliseToken(token);
      if (!idx.byCategoryToken.has(key)) idx.byCategoryToken.set(key, []);
      idx.byCategoryToken.get(key)!.push(rule);
      indexed = true;
    }

    for (const token of rule.trigger.mealSlotPattern ?? []) {
      const key = normaliseToken(token);
      if (!idx.bySlotToken.has(key)) idx.bySlotToken.set(key, []);
      idx.bySlotToken.get(key)!.push(rule);
      indexed = true;
    }

    if (!indexed) {
      idx.unindexed.push(rule);
    }
  }

  return idx;
}

// ─── Trigger matching ─────────────────────────────────────────────────────────

function matchesTrigger(
  rule: UpliftRule,
  normalisedName: string,
  normalisedIngredients: string[],
  normalisedCategory: string,
  normalisedSlot: string,
): { matched: boolean; matchedTriggers: string[] } {
  const matchedTriggers: string[] = [];

  // ingredientPattern: any ingredient contains any of the tokens
  if (rule.trigger.ingredientPattern && rule.trigger.ingredientPattern.length > 0) {
    for (const token of rule.trigger.ingredientPattern) {
      const t = normaliseToken(token);
      if (normalisedIngredients.some(ing => ing.includes(t))) {
        matchedTriggers.push(`ingredient:${token}`);
        break;
      }
    }
  }

  // mealNamePattern: meal name contains any of the tokens
  if (rule.trigger.mealNamePattern && rule.trigger.mealNamePattern.length > 0) {
    for (const token of rule.trigger.mealNamePattern) {
      const t = normaliseToken(token);
      if (normalisedName.includes(t)) {
        matchedTriggers.push(`mealName:${token}`);
        break;
      }
    }
  }

  // categoryPattern: category equals any of the tokens
  if (rule.trigger.categoryPattern && rule.trigger.categoryPattern.length > 0) {
    for (const token of rule.trigger.categoryPattern) {
      const t = normaliseToken(token);
      if (normalisedCategory === t || normalisedCategory.includes(t)) {
        matchedTriggers.push(`category:${token}`);
        break;
      }
    }
  }

  // mealSlotPattern: slot equals any of the tokens
  if (rule.trigger.mealSlotPattern && rule.trigger.mealSlotPattern.length > 0) {
    for (const token of rule.trigger.mealSlotPattern) {
      const t = normaliseToken(token);
      if (normalisedSlot === t) {
        matchedTriggers.push(`slot:${token}`);
        break;
      }
    }
  }

  return { matched: matchedTriggers.length > 0, matchedTriggers };
}

// ─── Diet exclusion ───────────────────────────────────────────────────────────

function isDietExcluded(rule: UpliftRule, dietTypes: string[]): boolean {
  if (!rule.excludedDietTypes || rule.excludedDietTypes.length === 0) return false;
  const lowerDiets = dietTypes.map(d => d.toLowerCase());
  return rule.excludedDietTypes.some(excluded =>
    lowerDiets.includes(excluded.toLowerCase())
  );
}

// ─── Slot exclusion ───────────────────────────────────────────────────────────

function isSlotExcluded(rule: UpliftRule, mealSlot: string): boolean {
  if (!rule.compatibleMealSlots || rule.compatibleMealSlots.length === 0) return false;
  const normSlot = mealSlot.toLowerCase();
  return !rule.compatibleMealSlots.some(s => s.toLowerCase() === normSlot);
}

// ─── Duplicate suppression ────────────────────────────────────────────────────

/**
 * Deduplicates suggestions across matched rules so the same ingredient
 * is never suggested twice for the same meal.
 */
function deduplicateSuggestions(suggestions: UpliftSuggestion[]): UpliftSuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter(s => {
    const key = s.ingredient.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Candidate rule collection ────────────────────────────────────────────────

function collectCandidateRules(
  idx: RuleIndex,
  normalisedName: string,
  normalisedIngredients: string[],
  normalisedCategory: string,
  normalisedSlot: string,
): UpliftRule[] {
  const seen = new Set<string>();
  const candidates: UpliftRule[] = [];

  function add(rule: UpliftRule): void {
    if (!seen.has(rule.id)) {
      seen.add(rule.id);
      candidates.push(rule);
    }
  }

  // ingredient token lookup
  idx.byIngredientToken.forEach((rules, token) => {
    if (normalisedIngredients.some(ing => ing.includes(token))) {
      rules.forEach(add);
    }
  });

  // meal name token lookup
  idx.byMealNameToken.forEach((rules, token) => {
    if (normalisedName.includes(token)) {
      rules.forEach(add);
    }
  });

  // category token lookup
  idx.byCategoryToken.forEach((rules, token) => {
    if (normalisedCategory === token || normalisedCategory.includes(token)) {
      rules.forEach(add);
    }
  });

  // slot token lookup
  idx.bySlotToken.forEach((rules, token) => {
    if (normalisedSlot === token) {
      rules.forEach(add);
    }
  });

  // unindexed rules always checked
  idx.unindexed.forEach(add);

  return candidates;
}

// ─── Core matching function ───────────────────────────────────────────────────

export function matchUpliftRules(
  ctx: UpliftContext,
  idx: RuleIndex,
): UpliftMatchResult[] {
  const normName = normaliseMealName(ctx.mealName);
  const normIngredients = normaliseIngredients(ctx.ingredients ?? []);
  const normCategory = normaliseToken(ctx.category ?? '');
  const normSlot = normaliseToken(ctx.mealSlot ?? '');
  const dietTypes = ctx.dietTypes ?? [];

  const candidates = collectCandidateRules(idx, normName, normIngredients, normCategory, normSlot);

  const results: UpliftMatchResult[] = [];

  for (const rule of candidates) {
    // Approval gate — belt-and-braces check (index builder already filters, but guard here too)
    if (!rule.reviewedAt) {
      if (DEBUG) console.log(`[uplift-engine] Skipped unreviewed rule ${rule.id} (gate)`);
      continue;
    }

    // Diet exclusion
    if (isDietExcluded(rule, dietTypes)) {
      if (DEBUG) console.log(`[uplift-engine] Skipped ${rule.id}: diet exclusion (${dietTypes.join(',')})`);
      continue;
    }

    // Slot exclusion
    if (normSlot && isSlotExcluded(rule, normSlot)) {
      if (DEBUG) console.log(`[uplift-engine] Skipped ${rule.id}: slot exclusion (${normSlot})`);
      continue;
    }

    // Full trigger evaluation
    const { matched, matchedTriggers } = matchesTrigger(
      rule, normName, normIngredients, normCategory, normSlot
    );

    if (!matched) {
      if (DEBUG) console.log(`[uplift-engine] No trigger match for ${rule.id} on "${ctx.mealName}"`);
      continue;
    }

    if (DEBUG) console.log(`[uplift-engine] Matched ${rule.id} on "${ctx.mealName}" via [${matchedTriggers.join(', ')}]`);

    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      suggestions: rule.suggestions,
      nutritionTags: rule.nutritionTags,
      confidence: rule.confidence,
      priority: rule.priority,
      matchedTriggers,
    });
  }

  // Sort by priority ascending (lower = more important)
  results.sort((a, b) => a.priority - b.priority);

  return results;
}

// ─── Batch matching ───────────────────────────────────────────────────────────

export function batchMatchUplift(
  input: BatchUpliftInput,
  idx: RuleIndex,
): BatchUpliftOutput {
  const start = Date.now();
  const householdDietTypes = input.dietTypes ?? [];

  const results = input.meals.map(meal => {
    const ctx: UpliftContext = {
      mealName: meal.name,
      ingredients: meal.ingredients ?? [],
      category: meal.category,
      mealSlot: meal.mealSlot,
      dietTypes: householdDietTypes,
    };

    const rawMatches = matchUpliftRules(ctx, idx);

    // Collect all suggestions across matched rules and deduplicate by ingredient
    const allSuggestions = rawMatches.flatMap(m => m.suggestions);
    const dedupedSuggestions = deduplicateSuggestions(allSuggestions);

    // Re-map suggestions back to their matches (keep deduped ingredient list per match)
    const seenIngredients = new Set<string>();
    const dedupedMatches = rawMatches.map(match => {
      const filteredSuggestions = match.suggestions.filter(s => {
        const key = s.ingredient.toLowerCase().trim();
        if (seenIngredients.has(key)) return false;
        seenIngredients.add(key);
        return true;
      });
      return { ...match, suggestions: filteredSuggestions };
    }).filter(m => m.suggestions.length > 0);

    return {
      mealId: meal.id,
      mealName: meal.name,
      matches: dedupedMatches,
      _dedupedSuggestions: dedupedSuggestions,
    };
  });

  const matchTimeMs = Date.now() - start;

  const cleanResults = results.map(({ _dedupedSuggestions: _, ...rest }) => rest);
  const totalMatches = cleanResults.reduce((sum, r) => sum + r.matches.length, 0);

  if (DEBUG) {
    console.log(`[uplift-engine] Batch: ${input.meals.length} meals → ${totalMatches} matches in ${matchTimeMs}ms`);
  }

  return {
    results: cleanResults,
    matchTimeMs,
    totalMeals: input.meals.length,
    totalMatches,
  };
}
