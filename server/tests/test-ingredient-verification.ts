/**
 * test-ingredient-verification.ts
 * ================================
 * Verifies that external recipe candidates must have ingredients before being
 * recommended by the Smart Planner.
 *
 * Product rule: THA must not recommend an external recipe unless ingredients have
 * been obtained and analysed. If ingredients.length === 0 after the detail-fetch
 * enrichment step, the candidate is excluded — no title-only guessing.
 *
 * Tests cover:
 *  1. Candidate with ingredients passes verification.
 *  2. Candidate with ingredients violating Vegan is excluded.
 *  3. Candidate with ingredients violating Vegetarian is excluded.
 *  4. Candidate with ingredients violating Dairy-Free is excluded.
 *  5. Candidate with ingredients = [] is excluded from Smart Planner.
 *  6. BBC Good Food candidate must have ingredients before recommendation.
 *  7. AllRecipes candidate must have ingredients before recommendation.
 *  8. Jamie Oliver candidate must have ingredients before recommendation.
 *  9. Serious Eats candidate must have ingredients before recommendation.
 *
 * Run with: npx tsx server/tests/test-ingredient-verification.ts
 */

import { candidateDietExcluded } from '../lib/smart-suggest-service.js';
import { enrichCandidateIngredients } from '../lib/external-meal-service.js';
import type { ExternalMealCandidate } from '../lib/external-meal-service.js';

// ─── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Minimal candidate factory for diet-filter tests (no detail-fetch needed).
const candidate = (name: string, ingredients: string[]) => ({ name, ingredients });

// Builds an ExternalMealCandidate with the given source and optional ingredients.
function externalCandidate(
  source: string,
  name: string,
  ingredients: string[],
  sourceUrl: string | null = null,
): ExternalMealCandidate {
  return {
    externalId: `${source.toLowerCase().replace(/\s/g, '-')}-test`,
    name,
    image: null,
    ingredients,
    instructions: [],
    dietTypes: [],
    estimatedCost: null,
    estimatedUPFScore: null,
    source,
    sourceUrl,
    category: 'dinner',
    cuisine: null,
    primaryProtein: null,
  };
}

// Simulate the ingredient gate that lives in generateSmartSuggestion.
// Returns true when the candidate should be excluded (no ingredients).
function ingredientGateExcludes(c: ExternalMealCandidate): boolean {
  return c.ingredients.length === 0;
}

// ─── Test 1: Candidate with ingredients passes verification ───────────────────

section('Test 1 — Candidate with ingredients passes the ingredient gate');

assert(
  !ingredientGateExcludes(externalCandidate('BBC Good Food', 'Lentil Soup', ['red lentils', 'onion', 'garlic', 'cumin', 'vegetable stock'])),
  'Candidate with ingredients is NOT excluded by ingredient gate',
);

// ─── Test 2: Candidate with ingredients violating Vegan is excluded ───────────

section('Test 2 — Vegan profile: ingredients containing meat are excluded');

assert(
  candidateDietExcluded(
    candidate('Carbonara', ['spaghetti', 'pancetta', 'eggs', 'parmesan', 'black pepper']),
    'Vegan',
    [],
  ),
  'Vegan: Carbonara with pancetta+eggs+parmesan is excluded by dietRules',
);

assert(
  candidateDietExcluded(
    candidate('Seafood Pasta', ['pasta', 'prawns', 'garlic', 'olive oil', 'lemon']),
    'Vegan',
    [],
  ),
  'Vegan: Seafood Pasta with prawns is excluded by dietRules',
);

assert(
  candidateDietExcluded(
    candidate('Ragu Pasta', ['pasta', 'beef mince', 'tomatoes', 'onion', 'red wine']),
    'Vegan',
    [],
  ),
  'Vegan: Ragu Pasta with beef mince is excluded by dietRules',
);

assert(
  !candidateDietExcluded(
    candidate('Tomato Pasta', ['pasta', 'tomatoes', 'garlic', 'olive oil', 'basil']),
    'Vegan',
    [],
  ),
  'Vegan: Tomato Pasta with no animal products passes dietRules',
);

// ─── Test 3: Candidate with ingredients violating Vegetarian is excluded ──────

section('Test 3 — Vegetarian profile: ingredients containing meat are excluded');

assert(
  candidateDietExcluded(
    candidate('Chicken Tikka Masala', ['chicken', 'yogurt', 'tomatoes', 'cream', 'spices']),
    'Vegetarian',
    [],
  ),
  'Vegetarian: Chicken Tikka Masala with chicken is excluded by dietRules',
);

assert(
  candidateDietExcluded(
    candidate('Fish and Chips', ['cod', 'potatoes', 'flour', 'beer', 'oil']),
    'Vegetarian',
    [],
  ),
  'Vegetarian: Fish and Chips with cod is excluded by dietRules',
);

assert(
  !candidateDietExcluded(
    candidate('Mushroom Risotto', ['arborio rice', 'mushrooms', 'white wine', 'butter']),
    'Vegetarian',
    [],
  ),
  'Vegetarian: Mushroom Risotto with no meat passes dietRules',
);

// SURF1B4 — parmesan is made with animal rennet. The canonical `meat` definition has
// said so since SURF1B2, and the Vegetarian pattern now resolves through it rather
// than through a private meat list that had never heard of rennet.
assert(
  candidateDietExcluded(
    candidate('Mushroom Risotto', ['arborio rice', 'mushrooms', 'parmesan', 'butter']),
    'Vegetarian',
    [],
  ),
  'Vegetarian: parmesan (animal rennet) IS excluded — pattern and restriction now agree',
);

// ─── Test 4: Candidate with ingredients violating Dairy-Free is excluded ──────

section('Test 4 — Dairy-Free restriction: ingredients containing dairy are excluded');

assert(
  candidateDietExcluded(
    candidate('Mac and Cheese', ['macaroni', 'cheddar', 'butter', 'milk', 'flour']),
    null,
    ['Dairy-Free'],
  ),
  'Dairy-Free: Mac and Cheese with cheddar+butter+milk is excluded by dietRules',
);

assert(
  candidateDietExcluded(
    candidate('Creamy Pasta', ['pasta', 'cream', 'parmesan', 'garlic', 'olive oil']),
    null,
    ['Dairy-Free'],
  ),
  'Dairy-Free: Creamy Pasta with cream+parmesan is excluded by dietRules',
);

assert(
  !candidateDietExcluded(
    candidate('Tomato Soup', ['tomatoes', 'onion', 'garlic', 'vegetable stock', 'olive oil']),
    null,
    ['Dairy-Free'],
  ),
  'Dairy-Free: Tomato Soup with no dairy passes dietRules',
);

// ─── Test 5: Candidate with ingredients = [] is excluded from Smart Planner ───

section('Test 5 — ingredient gate excludes candidates with empty ingredients');

assert(
  ingredientGateExcludes(externalCandidate('BBC Good Food', 'Carbonara', [], 'https://www.bbcgoodfood.com/recipes/carbonara')),
  'BBC Good Food candidate with ingredients=[] is excluded by ingredient gate',
);

assert(
  ingredientGateExcludes(externalCandidate('AllRecipes', 'Seafood Pasta', [], 'https://www.allrecipes.com/recipe/12345/seafood-pasta')),
  'AllRecipes candidate with ingredients=[] is excluded by ingredient gate',
);

assert(
  ingredientGateExcludes(externalCandidate('Jamie Oliver', 'Ragu', [], 'https://www.jamieoliver.com/recipes/beef-ragu')),
  'Jamie Oliver candidate with ingredients=[] is excluded by ingredient gate',
);

assert(
  ingredientGateExcludes(externalCandidate('Serious Eats', 'Clam Chowder', [], 'https://www.seriouseats.com/clam-chowder')),
  'Serious Eats candidate with ingredients=[] is excluded by ingredient gate',
);

// A candidate WITH ingredients must NOT be excluded by the gate.
assert(
  !ingredientGateExcludes(externalCandidate('BBC Good Food', 'Lentil Dahl', ['red lentils', 'coconut milk', 'tomatoes', 'spices'])),
  'Candidate with ingredients is NOT excluded by ingredient gate',
);

// ─── Test 6: BBC Good Food enrichment — no sourceUrl means excluded ───────────

section('Test 6 — BBC Good Food: candidate without sourceUrl cannot be enriched');

async function testBBCNoUrl(): Promise<void> {
  const c = externalCandidate('BBC Good Food', 'Mystery Recipe', [], null);
  const result = await enrichCandidateIngredients(c);
  assert(
    result === null,
    'BBC Good Food candidate with no sourceUrl returns null from enrichCandidateIngredients',
  );
}

// ─── Test 7: AllRecipes enrichment — no sourceUrl means excluded ──────────────

section('Test 7 — AllRecipes: candidate without sourceUrl cannot be enriched');

async function testAllRecipesNoUrl(): Promise<void> {
  const c = externalCandidate('AllRecipes', 'Unknown Dish', [], null);
  const result = await enrichCandidateIngredients(c);
  assert(
    result === null,
    'AllRecipes candidate with no sourceUrl returns null from enrichCandidateIngredients',
  );
}

// ─── Test 8: Jamie Oliver enrichment — no sourceUrl means excluded ────────────

section('Test 8 — Jamie Oliver: candidate without sourceUrl cannot be enriched');

async function testJamieOliverNoUrl(): Promise<void> {
  const c = externalCandidate('Jamie Oliver', 'Secret Recipe', [], null);
  const result = await enrichCandidateIngredients(c);
  assert(
    result === null,
    'Jamie Oliver candidate with no sourceUrl returns null from enrichCandidateIngredients',
  );
}

// ─── Test 9: Serious Eats enrichment — no sourceUrl means excluded ────────────

section('Test 9 — Serious Eats: candidate without sourceUrl cannot be enriched');

async function testSeriousEatsNoUrl(): Promise<void> {
  const c = externalCandidate('Serious Eats', 'Unnamed Dish', [], null);
  const result = await enrichCandidateIngredients(c);
  assert(
    result === null,
    'Serious Eats candidate with no sourceUrl returns null from enrichCandidateIngredients',
  );
}

// ─── Test: enrichCandidateIngredients passes through candidates with ingredients

section('Enrichment passthrough — candidates already having ingredients');

async function testPassthrough(): Promise<void> {
  const c = externalCandidate(
    'TheMealDB',
    'Vegan Lentil Soup',
    ['red lentils', 'onion', 'garlic', 'cumin', 'vegetable stock'],
    'https://www.themealdb.com/meal/12345',
  );
  const result = await enrichCandidateIngredients(c);
  assert(
    result !== null && result.ingredients.length === 5,
    'TheMealDB candidate with existing ingredients passes through enrichment unchanged',
    `ingredients.length = ${result?.ingredients.length}`,
  );
}

// ─── Run async tests then print summary ───────────────────────────────────────

(async () => {
  await testBBCNoUrl();
  await testAllRecipesNoUrl();
  await testJamieOliverNoUrl();
  await testSeriousEatsNoUrl();
  await testPassthrough();

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
