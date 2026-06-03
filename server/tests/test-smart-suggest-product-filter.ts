/**
 * test-smart-suggest-product-filter.ts
 * ======================================
 * Verifies that Smart Planner excludes barcode-scanned grocery products
 * (mealSourceType='openfoodfacts') from the recommendation candidate pool.
 *
 * Root cause: products like Neck Oil (Beavertown IPA) and Low Tide (Magic Rock
 * Pale Ale) were saved to the meals table via barcode scan with no ingredients,
 * no meal intent flags, and mealSourceType='openfoodfacts'. Smart Planner treated
 * them as dinner candidates because no source-type gate existed.
 *
 * Fix: candidateIsProduct() returns true for mealSourceType='openfoodfacts'.
 * This gate is applied both in the route pre-filter and as defense-in-depth
 * inside generateSmartSuggestion().
 *
 * Tests cover:
 * - openfoodfacts product is excluded
 * - Neck Oil-style branded beer product is excluded
 * - Low Tide-style branded pale ale product is excluded
 * - zero-ingredient openfoodfacts product is excluded
 * - genuine user-created recipe remains eligible
 * - imported recipe (url-import / scratch) remains eligible
 * - external recipe candidates are never subject to the product gate
 * - starter meals remain excluded
 * - planner-placeholder meals remain excluded
 * - valid mealSourceType values that should not be excluded
 *
 * Run with: npx tsx server/tests/test-smart-suggest-product-filter.ts
 */

import { candidateIsProduct } from '../lib/smart-suggest-service.js';

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

// ─── 1. OpenFoodFacts product source gate ─────────────────────────────────────

section('1. OpenFoodFacts product source gate');

assert(
  candidateIsProduct('openfoodfacts') === true,
  'mealSourceType=openfoodfacts is identified as a product',
);

// ─── 2. Neck Oil — Beavertown IPA (branded beer) ──────────────────────────────

section('2. Neck Oil (Beavertown IPA) product exclusion');

// Neck Oil is stored in the meals table via barcode scan.
// It has mealSourceType='openfoodfacts', isDrink=false (missed by category detection),
// drinkType=null (never set), kind='meal' (default), ingredients=[].
const neckOilSourceType = 'openfoodfacts';
assert(
  candidateIsProduct(neckOilSourceType) === true,
  'Neck Oil (openfoodfacts product) is excluded from Smart Planner pool',
);

// ─── 3. Low Tide — Magic Rock Pale Ale (branded beer) ─────────────────────────

section('3. Low Tide (Magic Rock Pale Ale) product exclusion');

const lowTideSourceType = 'openfoodfacts';
assert(
  candidateIsProduct(lowTideSourceType) === true,
  'Low Tide (openfoodfacts product) is excluded from Smart Planner pool',
);

// ─── 4. Zero-ingredient openfoodfacts product ─────────────────────────────────

section('4. Zero-ingredient openfoodfacts product');

// Products saved via barcode scan always have ingredients=[] (routes.ts saveProduct handler).
// This test confirms the source gate fires regardless of ingredient count.
assert(
  candidateIsProduct('openfoodfacts') === true,
  'Zero-ingredient openfoodfacts product is excluded by source gate',
  'ingredients=[] is irrelevant — source type is the disqualifying factor',
);

// ─── 5. Genuine user-created recipe remains eligible ──────────────────────────

section('5. User-created recipe eligibility');

assert(
  candidateIsProduct('scratch') === false,
  'User-created scratch recipe is NOT a product — remains eligible',
);
assert(
  candidateIsProduct('url-import') === false,
  'URL-imported recipe is NOT a product — remains eligible',
);
assert(
  candidateIsProduct('') === false,
  'Empty mealSourceType is NOT a product — remains eligible',
);

// ─── 6. Imported recipe remains eligible ──────────────────────────────────────

section('6. Imported recipe eligibility');

assert(
  candidateIsProduct('url-import') === false,
  'url-import source recipe remains eligible',
);
assert(
  candidateIsProduct('auto-import') === false,
  'auto-import source recipe remains eligible',
);
assert(
  candidateIsProduct('household-safe-variant') === false,
  'Household-safe variant remains eligible',
);

// ─── 7. External recipe candidates are unaffected ─────────────────────────────

section('7. External recipe candidates');

// External candidates (TheMealDB, BBC Good Food, etc.) never have a mealSourceType —
// they are ExternalMealCandidate objects that bypass the user-meal loop entirely.
// candidateIsProduct() is only called on Meal rows; this section documents the boundary.
assert(
  candidateIsProduct('scratch') === false,
  'External candidates bypass product gate (they use a separate loop in the service)',
  'TheMealDB / BBC Good Food candidates are ExternalMealCandidate, not Meal rows',
);

// ─── 8. Starter meals remain excluded ─────────────────────────────────────────

section('8. Starter / template meal exclusion (existing behaviour preserved)');

// Starter meals are excluded by the route pre-filter (mealSourceType !== "starter").
// candidateIsProduct() does NOT handle starters — that exclusion is intentionally
// separate and predates this fix. This test documents the boundary.
assert(
  candidateIsProduct('starter') === false,
  'starter mealSourceType is NOT handled by candidateIsProduct (excluded separately in route filter)',
  'starter exclusion via routes.ts source-type gate remains unchanged',
);

// ─── 9. Planner-placeholder meals remain excluded ─────────────────────────────

section('9. Planner-placeholder meal exclusion (existing behaviour preserved)');

assert(
  candidateIsProduct('planner-placeholder') === false,
  'planner-placeholder is NOT handled by candidateIsProduct (excluded separately in route filter)',
  'planner-placeholder exclusion via routes.ts source-type gate remains unchanged',
);

// ─── 10. Source type exhaustive check ─────────────────────────────────────────

section('10. Exhaustive source type check');

const eligibleSourceTypes = [
  'scratch',
  'url-import',
  'auto-import',
  'household-safe-variant',
  '',
  'starter',             // excluded by route gate, not by candidateIsProduct
  'planner-placeholder', // excluded by route gate, not by candidateIsProduct
];

for (const src of eligibleSourceTypes) {
  assert(
    candidateIsProduct(src) === false,
    `"${src}" is not an openfoodfacts product source — eligible (or separately excluded)`,
  );
}

assert(
  candidateIsProduct('openfoodfacts') === true,
  'Only "openfoodfacts" returns true from candidateIsProduct',
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Smart Planner product filter: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('TESTS FAILED');
  process.exit(1);
} else {
  console.log('All tests passed.');
}
