/**
 * test-smart-suggest-diet-pattern.ts
 * ===================================
 * Verifies that the Smart Planner enforces the user's Profile dietary
 * requirements (dietPattern + dietRestrictions) as a HARD exclusion, using the
 * shared dietRules engine — the same single source of truth recipe search uses.
 *
 * Exercises candidateDietExcluded() from smart-suggest-service, which is the
 * exact predicate the planner now applies to every user and external candidate
 * before scoring, ranking, and selection. A `true` result means the meal is
 * removed from the pool.
 *
 * Root cause reference: VEGAN CLASSIFICATION FAILURE INVESTIGATION — the planner
 * previously never invoked dietRules.shouldExcludeRecipe, so a Vegan profile
 * could be served an anchovy recipe (Pasta Puttanesca / "Tart's Spaghetti").
 *
 * Run with: npx tsx server/tests/test-smart-suggest-diet-pattern.ts
 */

import { candidateDietExcluded } from '../lib/smart-suggest-service.js';

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

// Helper: build a minimal candidate from a name + ingredient list.
const meal = (name: string, ingredients: string[]) => ({ name, ingredients });

const VEGAN = (c: { name: string; ingredients: string[] }) =>
  candidateDietExcluded(c, 'Vegan', []);
const VEGETARIAN = (c: { name: string; ingredients: string[] }) =>
  candidateDietExcluded(c, 'Vegetarian', []);
const NONE = (c: { name: string; ingredients: string[] }) =>
  candidateDietExcluded(c, null, []);

// ─── Test 1 — the original failure: Pasta Puttanesca (anchovies) ──────────────

section('Test 1 — Vegan excludes Pasta Puttanesca (Tart\'s Spaghetti)');

assert(
  VEGAN(meal("Pasta Puttanesca (Tart's Spaghetti)", [
    'spaghetti', 'olive oil', 'garlic', 'fresh basil',
    '2 oz (50 g) anchovies, drained', 'black olives', 'tomatoes',
  ])),
  'Vegan excludes the exact anchovy recipe from the investigation',
);

// ─── Test 2 — Vegan excludes anchovy recipes ──────────────────────────────────

section('Test 2 — Vegan excludes anchovy recipes');

assert(VEGAN(meal('Anchovy toast', ['bread', 'anchovies', 'butter'])),
  'Vegan excludes anchovies');
assert(VEGAN(meal('Caesar salad', ['lettuce', 'anchovy', 'parmesan'])),
  'Vegan excludes anchovy (singular)');

// ─── Test 3 — Vegan excludes chicken recipes ──────────────────────────────────

section('Test 3 — Vegan excludes chicken recipes');

assert(VEGAN(meal('Roast chicken', ['chicken', 'potatoes', 'carrots'])),
  'Vegan excludes chicken');

// ─── Test 4 — Vegan excludes beef recipes ─────────────────────────────────────

section('Test 4 — Vegan excludes beef recipes');

assert(VEGAN(meal('Beef stew', ['beef', 'onion', 'carrot', 'stock'])),
  'Vegan excludes beef');

// ─── Test 5 — Vegan excludes egg recipes ──────────────────────────────────────

section('Test 5 — Vegan excludes egg recipes');

assert(VEGAN(meal('Spanish omelette', ['eggs', 'potato', 'onion'])),
  'Vegan excludes eggs');

// ─── Extra Vegan coverage (Definition of Done) ────────────────────────────────

section('Vegan — full Definition-of-Done coverage');

assert(VEGAN(meal('Seared tuna', ['tuna', 'sesame', 'soy sauce'])),
  'Vegan excludes tuna');
assert(VEGAN(meal('Salmon fillet', ['salmon', 'lemon', 'dill'])),
  'Vegan excludes salmon');
assert(VEGAN(meal('Prawn curry', ['prawns', 'coconut milk', 'spices'])),
  'Vegan excludes prawns');
assert(VEGAN(meal('Pulled pork', ['pork', 'bbq sauce', 'buns'])),
  'Vegan excludes pork');
assert(VEGAN(meal('Cheese pizza', ['dough', 'mozzarella', 'cheddar', 'tomato'])),
  'Vegan excludes dairy-heavy recipes');
assert(
  !VEGAN(meal('Chickpea curry', ['chickpeas', 'tomato', 'onion', 'spices', 'rice'])),
  'Vegan does NOT exclude a genuinely vegan meal',
);

// ─── Test 6 — Vegetarian excludes fish/seafood ────────────────────────────────

section('Test 6 — Vegetarian excludes fish & seafood');

assert(VEGETARIAN(meal('Fish and chips', ['cod', 'potatoes', 'batter'])),
  'Vegetarian excludes fish (cod)');
assert(VEGETARIAN(meal('Tuna pasta', ['pasta', 'tuna', 'sweetcorn'])),
  'Vegetarian excludes tuna');
assert(VEGETARIAN(meal('Garlic prawns', ['prawns', 'garlic', 'butter'])),
  'Vegetarian excludes prawns (seafood)');
assert(VEGETARIAN(meal('Pasta Puttanesca', ['spaghetti', 'anchovies', 'olives'])),
  'Vegetarian excludes anchovy recipe');

// ─── Test 7 — Vegetarian excludes chicken / beef / pork ───────────────────────

section('Test 7 — Vegetarian excludes meat & poultry');

assert(VEGETARIAN(meal('Roast chicken', ['chicken', 'potatoes'])),
  'Vegetarian excludes chicken');
assert(VEGETARIAN(meal('Beef burger', ['beef mince', 'bun', 'lettuce'])),
  'Vegetarian excludes beef');
assert(VEGETARIAN(meal('Pork chops', ['pork', 'apple sauce'])),
  'Vegetarian excludes pork');
assert(
  !VEGETARIAN(meal('Margherita pizza', ['dough', 'mozzarella', 'tomato', 'basil'])),
  'Vegetarian does NOT exclude a cheese pizza (dairy allowed for vegetarians)',
);
assert(
  !VEGETARIAN(meal('Veggie omelette', ['eggs', 'peppers', 'cheese'])),
  'Vegetarian does NOT exclude eggs (allowed for vegetarians)',
);

// ─── Test 8 — Profile = None → no behaviour change ────────────────────────────

section('Test 8 — No diet profile → nothing excluded');

assert(!NONE(meal("Pasta Puttanesca", ['spaghetti', 'anchovies', 'olives'])),
  'No profile does NOT exclude the anchovy recipe');
assert(!NONE(meal('Roast chicken', ['chicken', 'potatoes'])),
  'No profile does NOT exclude chicken');
assert(!NONE(meal('Beef stew', ['beef', 'onion'])),
  'No profile does NOT exclude beef');
assert(!NONE(meal('Chickpea curry', ['chickpeas', 'rice'])),
  'No profile does NOT exclude a vegan meal either (pool unchanged)');

// ─── Consistency with recipe search (single source of truth) ──────────────────

section('Consistency — planner matches dietRules engine directly');

import { shouldExcludeRecipe } from '../../shared/dietRules.js';

const sample = meal("Pasta Puttanesca (Tart's Spaghetti)", [
  'spaghetti', 'olive oil', 'garlic', 'anchovies', 'tomatoes',
]);
const searchText = [sample.name, ...sample.ingredients].join(' ').toLowerCase();

assert(
  candidateDietExcluded(sample, 'Vegan', []) ===
    shouldExcludeRecipe(searchText, { dietPattern: 'Vegan', dietRestrictions: [] }),
  'Planner predicate agrees with recipe-search dietRules.shouldExcludeRecipe',
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n────────────────────────────────────────');
console.log(`SMART SUGGEST DIET-PATTERN TESTS: ${passed} passed, ${failed} failed`);
console.log('────────────────────────────────────────');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
