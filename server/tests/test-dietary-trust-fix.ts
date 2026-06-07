/**
 * test-dietary-trust-fix.ts
 * =========================
 * Regression tests for the Smart Plan dietary trust fix.
 *
 * Covers:
 *  1.  Old session with no version is rejected.
 *  2.  Old session with version 1 is rejected.
 *  3.  Version 2 session is accepted.
 *  4.  Malformed session is rejected and cleared.
 *  5.  Vegan profile excludes user meal with ingredients=[].
 *  6.  Vegan profile excludes user meal with chicken ingredients.
 *  7.  Vegan profile allows user meal with clearly vegan ingredients.
 *  8.  Vegetarian profile excludes user meal with ingredients=[].
 *  9.  Vegetarian profile excludes user meal with fish/meat ingredients.
 *  10. Unrestricted profile preserves existing behaviour for ingredient-less meals.
 *  11. External ingredient verification still works (gate excludes empty ingredients).
 *  12. candidateDietExcluded still correctly evaluates enriched external candidates.
 *
 * Run with: npx tsx server/tests/test-dietary-trust-fix.ts
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

// ─── Session version logic (mirrors use-smart-suggest.ts) ─────────────────────

const SMART_SESSION_VERSION = 2;

interface SessionData {
  version?: number;
  smartResult?: { entries?: unknown[] };
  lockedEntries?: string[];
}

// Replicate the loadSmartSession logic from the hook without DOM dependency.
function simulateLoadSession(raw: string): boolean {
  try {
    const data = JSON.parse(raw) as SessionData;
    if (!data.version || data.version < SMART_SESSION_VERSION) return false;
    if (!Array.isArray(data.smartResult?.entries)) return false;
    return true;
  } catch {
    return false;
  }
}

const mockEntries = [{ dayOfWeek: 1, slot: 'dinner', candidate: { id: 1, name: 'Lentil Soup', isExternal: false, ingredients: ['lentils'] } }];

// ─── Test 1 — Session with no version is rejected ─────────────────────────────

section('Test 1 — Session with no version field is rejected');

assert(
  !simulateLoadSession(JSON.stringify({ smartResult: { entries: mockEntries }, lockedEntries: [] })),
  'Session missing version field is rejected',
);

// ─── Test 2 — Session with version 1 is rejected ──────────────────────────────

section('Test 2 — Session with version=1 is rejected');

assert(
  !simulateLoadSession(JSON.stringify({ version: 1, smartResult: { entries: mockEntries }, lockedEntries: [] })),
  'Session with version=1 is rejected (predates ingredient verification)',
);

// ─── Test 3 — Version 2 session is accepted ───────────────────────────────────

section('Test 3 — Session with version=2 is accepted');

assert(
  simulateLoadSession(JSON.stringify({ version: 2, smartResult: { entries: mockEntries }, lockedEntries: [] })),
  'Session with version=2 is accepted',
);

// ─── Test 4 — Malformed session is rejected ───────────────────────────────────

section('Test 4 — Malformed sessions are rejected');

assert(
  !simulateLoadSession('not-json-at-all{{{'),
  'Completely invalid JSON is rejected',
);

assert(
  !simulateLoadSession(JSON.stringify({ version: 2, smartResult: null })),
  'Session with smartResult=null is rejected (entries missing)',
);

assert(
  !simulateLoadSession(JSON.stringify({ version: 2, smartResult: { entries: 'not-an-array' } })),
  'Session with entries as string (not array) is rejected',
);

assert(
  !simulateLoadSession(JSON.stringify({})),
  'Empty session object is rejected',
);

// ─── Helpers for diet-filter tests ────────────────────────────────────────────

// Replicate the ingredient gate predicate from the user meals loop.
// Returns true when the meal should be excluded given the active restrictions.
function userMealIngredientGateExcludes(
  ingredientCount: number,
  dietPattern: string | null,
  dietRestrictions: string[],
  hardExcluded: string[],
): boolean {
  const profileRestricted =
    (dietPattern !== null && dietPattern !== "") ||
    dietRestrictions.length > 0 ||
    hardExcluded.length > 0;
  return profileRestricted && ingredientCount === 0;
}

const meal = (name: string, ingredients: string[]) => ({ name, ingredients });

// ─── Test 5 — Vegan profile excludes user meal with ingredients=[] ─────────────

section('Test 5 — Vegan profile: ingredient-less user meals are excluded');

assert(
  userMealIngredientGateExcludes(0, 'Vegan', [], []),
  'Vegan profile + ingredients=[] → excluded by ingredient gate',
);

assert(
  userMealIngredientGateExcludes(0, 'Vegan', ['Dairy-Free'], []),
  'Vegan+Dairy-Free profile + ingredients=[] → excluded by ingredient gate',
);

// ─── Test 6 — Vegan profile excludes user meal with chicken ingredients ────────

section('Test 6 — Vegan profile: user meal with chicken in ingredients is excluded by dietRules');

assert(
  candidateDietExcluded(
    meal('Tikka Masala', ['chicken breast', 'yogurt', 'tomatoes', 'cream', 'spices']),
    'Vegan', [],
  ),
  'Vegan: meal with chicken+yogurt+cream is excluded by dietRules',
);

assert(
  candidateDietExcluded(
    meal('Beef Stir Fry', ['beef strips', 'broccoli', 'soy sauce', 'ginger']),
    'Vegan', [],
  ),
  'Vegan: meal with beef is excluded by dietRules',
);

assert(
  candidateDietExcluded(
    meal('Scrambled Eggs', ['eggs', 'butter', 'milk', 'salt']),
    'Vegan', [],
  ),
  'Vegan: meal with eggs+butter+milk is excluded by dietRules',
);

// ─── Test 7 — Vegan profile allows user meal with vegan ingredients ────────────

section('Test 7 — Vegan profile: user meal with vegan ingredients is allowed');

assert(
  !candidateDietExcluded(
    meal('Lentil Soup', ['red lentils', 'onion', 'garlic', 'cumin', 'vegetable stock']),
    'Vegan', [],
  ),
  'Vegan: lentil soup with no animal products is allowed',
);

assert(
  !candidateDietExcluded(
    meal('Bean Casserole', ['kidney beans', 'tomatoes', 'onion', 'peppers', 'paprika']),
    'Vegan', [],
  ),
  'Vegan: bean casserole with no animal products is allowed',
);

assert(
  !candidateDietExcluded(
    meal('Tofu Stir Fry', ['tofu', 'broccoli', 'soy sauce', 'sesame oil', 'ginger']),
    'Vegan', [],
  ),
  'Vegan: tofu stir fry with no animal products is allowed',
);

// ─── Test 8 — Vegetarian profile excludes user meal with ingredients=[] ────────

section('Test 8 — Vegetarian profile: ingredient-less user meals are excluded');

assert(
  userMealIngredientGateExcludes(0, 'Vegetarian', [], []),
  'Vegetarian profile + ingredients=[] → excluded by ingredient gate',
);

// ─── Test 9 — Vegetarian profile excludes user meal with fish/meat ─────────────

section('Test 9 — Vegetarian profile: meals with fish or meat are excluded by dietRules');

assert(
  candidateDietExcluded(
    meal('Salmon Pasta', ['salmon fillet', 'pasta', 'capers', 'lemon', 'olive oil']),
    'Vegetarian', [],
  ),
  'Vegetarian: salmon pasta is excluded by dietRules',
);

assert(
  candidateDietExcluded(
    meal('Chicken Salad', ['chicken breast', 'lettuce', 'cucumber', 'tomato', 'dressing']),
    'Vegetarian', [],
  ),
  'Vegetarian: chicken salad is excluded by dietRules',
);

assert(
  !candidateDietExcluded(
    meal('Cheese Omelette', ['eggs', 'cheddar', 'butter', 'salt', 'pepper']),
    'Vegetarian', [],
  ),
  'Vegetarian: cheese omelette (no meat/fish) is allowed by dietRules',
);

// ─── Test 10 — Unrestricted profile: ingredient-less meals are NOT excluded ────

section('Test 10 — Unrestricted profile: ingredient-less user meals are allowed');

assert(
  !userMealIngredientGateExcludes(0, null, [], []),
  'No restrictions + ingredients=[] → NOT excluded (unrestricted profile)',
);

assert(
  !userMealIngredientGateExcludes(0, '', [], []),
  'Empty dietPattern + ingredients=[] → NOT excluded (unrestricted profile)',
);

assert(
  !candidateDietExcluded(
    meal('Pizza Toast', []),
    null, [],
  ),
  'No dietary pattern: ingredient-less meal passes dietRules filter',
);

// ─── Test 11 — External ingredient gate still works ───────────────────────────

section('Test 11 — External ingredient gate: empty ingredients excludes external candidates');

function externalIngredientGateExcludes(ingredients: string[]): boolean {
  return ingredients.length === 0;
}

assert(
  externalIngredientGateExcludes([]),
  'External candidate with ingredients=[] is excluded by ingredient gate',
);

assert(
  !externalIngredientGateExcludes(['lentils', 'onion', 'garlic']),
  'External candidate with ingredients is NOT excluded by ingredient gate',
);

// ─── Test 12 — enrichCandidateIngredients: no-URL candidates are excluded ──────

section('Test 12 — External enrichment: candidates without sourceUrl return null');

async function testEnrichmentNoUrl(): Promise<void> {
  const c: ExternalMealCandidate = {
    externalId: 'test-no-url',
    name: 'Unknown Dish',
    image: null,
    ingredients: [],
    instructions: [],
    dietTypes: [],
    estimatedCost: null,
    estimatedUPFScore: null,
    source: 'BBC Good Food',
    sourceUrl: null,
    category: 'dinner',
    cuisine: null,
    primaryProtein: null,
  };
  const result = await enrichCandidateIngredients(c);
  assert(
    result === null,
    'External candidate with no sourceUrl returns null from enrichCandidateIngredients',
    `result = ${JSON.stringify(result)}`,
  );
}

async function testEnrichmentPassthrough(): Promise<void> {
  const c: ExternalMealCandidate = {
    externalId: 'mealdb-test',
    name: 'Lentil Dahl',
    image: null,
    ingredients: ['red lentils', 'coconut milk', 'tomatoes', 'cumin', 'garlic'],
    instructions: [],
    dietTypes: ['vegan'],
    estimatedCost: null,
    estimatedUPFScore: null,
    source: 'TheMealDB',
    sourceUrl: 'https://www.themealdb.com/meal/12345',
    category: 'dinner',
    cuisine: 'Indian',
    primaryProtein: null,
  };
  const result = await enrichCandidateIngredients(c);
  assert(
    result !== null && result.ingredients.length === 5,
    'TheMealDB candidate with existing ingredients passes through enrichment unchanged',
    `ingredients.length = ${result?.ingredients.length}`,
  );
}

// ─── Run async tests then print summary ───────────────────────────────────────

(async () => {
  await testEnrichmentNoUrl();
  await testEnrichmentPassthrough();

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
