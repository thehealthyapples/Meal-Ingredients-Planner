/**
 * test-uplift-persistence.ts
 * ==========================
 * Unit tests for uplift persistence logic.
 * No database dependency — pure function tests only.
 *
 * Run with:  npm run test:uplift-persistence
 *
 * Tests cover:
 * - Ingredient normalisation for dedup
 * - Duplicate detection (exact, substring, adjective variants)
 * - Merge logic (added vs skipped)
 * - Removal logic
 * - System-meal fork name generation
 * - Edge cases: empty lists, quantity noise, multi-word ingredients
 */

import {
  normaliseIngredientForDedupe,
  ingredientAlreadyPresent,
  mergeUpliftIngredients,
  removeUpliftIngredient,
  buildForkName,
} from '../lib/uplift-persistence.js';

// ─── Test infrastructure ──────────────────────────────────────────────────────

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

function assertEqual<T>(actual: T, expected: T, label: string): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ─── 1. Normalisation ─────────────────────────────────────────────────────────

section('1. Ingredient normalisation');

assertEqual(
  normaliseIngredientForDedupe('Turmeric'),
  'turmeric',
  'Lowercase conversion'
);
assertEqual(
  normaliseIngredientForDedupe('Ground turmeric'),
  'turmeric',
  'Strips "ground" adjective'
);
assertEqual(
  normaliseIngredientForDedupe('Fresh spinach'),
  'spinach',
  'Strips "fresh" adjective'
);
assertEqual(
  normaliseIngredientForDedupe('½ tsp turmeric'),
  'turmeric',
  'Strips fraction + unit quantities'
);
assertEqual(
  normaliseIngredientForDedupe('2 tbsp mixed seeds'),
  'mixed seeds',
  'Strips numeric + unit quantities'
);
assertEqual(
  normaliseIngredientForDedupe('a handful of frozen peas'),
  'peas',
  'Strips quantity noise words and "frozen"'
);
assertEqual(
  normaliseIngredientForDedupe('extra virgin olive oil'),
  'virgin olive oil',
  '"extra" stripped, multi-word core preserved'
);

// ─── 2. Duplicate detection ───────────────────────────────────────────────────

section('2. Duplicate detection');

const existingIngredients = [
  'macaroni',
  'cheddar cheese',
  'milk',
  'ground turmeric',
  'frozen peas',
  'extra virgin olive oil',
];

assert(
  ingredientAlreadyPresent(existingIngredients, 'turmeric'),
  'Detects "turmeric" already present as "ground turmeric" (substring match)'
);
assert(
  ingredientAlreadyPresent(existingIngredients, 'ground turmeric'),
  'Detects exact "ground turmeric" already present'
);
assert(
  ingredientAlreadyPresent(existingIngredients, 'peas'),
  'Detects "peas" already present as "frozen peas"'
);
assert(
  ingredientAlreadyPresent(existingIngredients, 'olive oil'),
  'Detects "olive oil" already present as "extra virgin olive oil"'
);
assert(
  !ingredientAlreadyPresent(existingIngredients, 'black pepper'),
  'Correctly identifies "black pepper" as NOT present'
);
assert(
  !ingredientAlreadyPresent(existingIngredients, 'spinach'),
  'Correctly identifies "spinach" as NOT present'
);
assert(
  !ingredientAlreadyPresent([], 'turmeric'),
  'Empty ingredient list returns false'
);
assert(
  !ingredientAlreadyPresent(existingIngredients, ''),
  'Empty candidate returns false'
);

// ─── 3. Merge logic ───────────────────────────────────────────────────────────

section('3. Merge logic');

const baseIngredients = ['macaroni', 'cheddar cheese', 'milk'];

const result1 = mergeUpliftIngredients(baseIngredients, ['turmeric', 'black pepper', 'frozen peas']);
assertEqual(result1.added, ['turmeric', 'black pepper', 'frozen peas'], 'All new ingredients added');
assertEqual(result1.skipped, [], 'No skips when all new');
assertEqual(result1.merged.length, 6, 'Merged list has correct length');
assert(result1.merged[0] === 'macaroni', 'Original ingredients retained at head');

const result2 = mergeUpliftIngredients(['macaroni', 'cheddar cheese', 'ground turmeric'], ['turmeric', 'black pepper']);
assertEqual(result2.added, ['black pepper'], 'Only non-duplicate added');
assertEqual(result2.skipped, ['turmeric'], 'Duplicate turmeric skipped');

const result3 = mergeUpliftIngredients(['pasta', 'cheese'], ['pasta', 'spinach', 'cheese']);
assertEqual(result3.added, ['spinach'], 'Only spinach added from duplicated list');
assertEqual(result3.skipped, ['pasta', 'cheese'], 'Both duplicates skipped');

const result4 = mergeUpliftIngredients([], ['turmeric']);
assertEqual(result4.added, ['turmeric'], 'Adds to empty ingredient list');
assertEqual(result4.merged, ['turmeric'], 'Merged is just the new ingredient');

// ─── 4. Removal logic ────────────────────────────────────────────────────────

section('4. Removal logic');

const removalBase = ['macaroni', 'cheddar cheese', 'turmeric', 'frozen peas'];

const rem1 = removeUpliftIngredient(removalBase, 'turmeric');
assert(rem1.removed, 'Ingredient removed successfully');
assertEqual(rem1.ingredients, ['macaroni', 'cheddar cheese', 'frozen peas'], 'Correct ingredients after removal');

const rem2 = removeUpliftIngredient(removalBase, 'ground turmeric');
assert(rem2.removed, 'Adjective variant matches and removes "turmeric"');

const rem3 = removeUpliftIngredient(removalBase, 'spinach');
assert(!rem3.removed, 'Returns removed=false for ingredient not in list');
assertEqual(rem3.ingredients, removalBase, 'Unchanged list returned when nothing found');

const rem4 = removeUpliftIngredient([], 'turmeric');
assert(!rem4.removed, 'Empty list: removed=false');
assertEqual(rem4.ingredients, [], 'Empty list stays empty');

// Multiple-step removal (simulating two separate uplift removals)
const step1 = removeUpliftIngredient(['pasta', 'spinach', 'turmeric', 'peas'], 'spinach');
const step2 = removeUpliftIngredient(step1.ingredients, 'turmeric');
assertEqual(step2.ingredients, ['pasta', 'peas'], 'Sequential removals work correctly');

// ─── 5. Fork name ─────────────────────────────────────────────────────────────

section('5. Fork name');

assertEqual(buildForkName('Mac & Cheese'), 'Mac & Cheese', 'Fork name preserves original name');
assertEqual(buildForkName('Spaghetti Bolognese'), 'Spaghetti Bolognese', 'No suffix added to fork');

// ─── 6. Edge cases ────────────────────────────────────────────────────────────

section('6. Edge cases');

// Merge with quantity in candidate
const qResult = mergeUpliftIngredients(['pasta', 'cheese'], ['½ tsp turmeric']);
assertEqual(qResult.added, ['½ tsp turmeric'], 'Ingredient with quantity added correctly');
// Conservative: "turmeric added" contains "turmeric" so dedup correctly blocks it
assert(
  ingredientAlreadyPresent(qResult.merged, 'turmeric added'),
  'Conservative dedup: "turmeric added" blocked because "turmeric" already present'
);
assert(
  ingredientAlreadyPresent(qResult.merged, 'turmeric'),
  'After merge, "turmeric" correctly detected as present in "½ tsp turmeric"'
);

// Quantity-only noise shouldn't add spurious ingredient
const emptyKey = normaliseIngredientForDedupe('2 tbsp');
assert(emptyKey === '' || emptyKey.length < 3, 'Quantity-only string normalises to near-empty');

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n────────────────────────────────────────`);
console.log(`UPLIFT PERSISTENCE TESTS: ${passed} passed, ${failed} failed`);
console.log(`────────────────────────────────────────`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
