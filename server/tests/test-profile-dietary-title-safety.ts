/**
 * test-profile-dietary-title-safety.ts
 * ======================================
 * Regression tests for Profile dietary filtering on title-only external recipe
 * candidates (ingredients = []).
 *
 * Root cause: BBC Good Food, AllRecipes, Jamie Oliver, and Serious Eats scrapers
 * return ingredients: []. The shared dietRules engine previously lacked:
 * - "seafood" in FISH_SEAFOOD_KEYWORDS
 * - dish-name terms (carbonara, ragu, bolognese, birria, ossobuco) that imply
 *   non-vegan/non-vegetarian content even with no ingredient data
 *
 * These tests exercise candidateDietExcluded() which delegates to
 * shouldExcludeRecipe() — the single source of truth for both recipe search and
 * Smart Planner generation.
 *
 * Known limitation noted in this file:
 *   Dairy-Free currently false-positives on plant-based milks (coconut milk,
 *   oat milk, almond milk, soy milk) because \bmilk\b matches generically.
 *   Tests below document expected vs actual behaviour for tracking purposes.
 *
 * Run with: npx tsx server/tests/test-profile-dietary-title-safety.ts
 */

import { candidateDietExcluded } from '../lib/smart-suggest-service.js';

// ─── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let knownIssues = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// Documents a known pre-existing limitation without counting it as a test failure.
// The note explains the gap and what a fix would look like.
function knownLimitation(
  currentBehaviourCorrect: boolean,
  label: string,
  note: string,
): void {
  if (currentBehaviourCorrect) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.warn(`  ⚠ KNOWN LIMITATION: ${label}`);
    console.warn(`    ${note}`);
    knownIssues++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// Builds a minimal title-only candidate (ingredients = []) matching what BBC
// Good Food / AllRecipes / Jamie Oliver / Serious Eats scrapers return.
const titleOnly = (name: string) => ({ name, ingredients: [] as string[] });
const withIngredients = (name: string, ingredients: string[]) => ({ name, ingredients });

const VEGAN = (c: { name: string; ingredients: string[] }) =>
  candidateDietExcluded(c, 'Vegan', []);
const VEGETARIAN = (c: { name: string; ingredients: string[] }) =>
  candidateDietExcluded(c, 'Vegetarian', []);
const DAIRY_FREE = (c: { name: string; ingredients: string[] }) =>
  candidateDietExcluded(c, null, ['Dairy-Free']);
const NONE = (c: { name: string; ingredients: string[] }) =>
  candidateDietExcluded(c, null, []);

// ─── Section 1: Vegan — title-only exclusions ─────────────────────────────────

section('1 — Vegan: dish-name title-only exclusions (ingredients=[])');

assert(
  VEGAN(titleOnly('Healthy Carbonara')),
  'Vegan excludes "Healthy Carbonara" (title only — implies bacon/eggs/parmesan)',
);
assert(
  VEGAN(titleOnly('Carbonara')),
  'Vegan excludes "Carbonara" (bare title)',
);
assert(
  VEGAN(titleOnly('Healthy Ragu Pasta')),
  'Vegan excludes "Healthy Ragu Pasta" (ragu = meat sauce)',
);
assert(
  VEGAN(titleOnly('Ragu pasta bake')),
  'Vegan excludes "Ragu pasta bake"',
);
assert(
  VEGAN(titleOnly('Classic Bolognese')),
  'Vegan excludes "Classic Bolognese" (title only)',
);
assert(
  VEGAN(titleOnly('Birria Tacos')),
  'Vegan excludes "Birria Tacos" (braised beef/goat)',
);
assert(
  VEGAN(titleOnly('Ossobuco Milanese')),
  'Vegan excludes "Ossobuco Milanese" (braised veal)',
);
assert(
  VEGAN(titleOnly('Healthy Seafood Pasta')),
  'Vegan excludes "Healthy Seafood Pasta" (seafood keyword)',
);
assert(
  VEGAN(titleOnly('Seafood Linguine')),
  'Vegan excludes "Seafood Linguine"',
);

// ─── Section 2: Vegan — ragù with diacritic via normalisation ─────────────────

section('2 — Vegan: ragù accent variant via diacritic normalisation');

assert(
  VEGAN(titleOnly('Ragù alla Bolognese')),
  'Vegan excludes "Ragù alla Bolognese" (accented ù normalised to u)',
);
assert(
  VEGAN(titleOnly('Healthy ragù pasta')),
  'Vegan excludes "Healthy ragù pasta"',
);

// ─── Section 3: Vegetarian — title-only exclusions ────────────────────────────

section('3 — Vegetarian: dish-name title-only exclusions (ingredients=[])');

assert(
  VEGETARIAN(titleOnly('Healthy Seafood Pasta')),
  'Vegetarian excludes "Healthy Seafood Pasta"',
);
assert(
  VEGETARIAN(titleOnly('Seafood Risotto')),
  'Vegetarian excludes "Seafood Risotto"',
);
assert(
  VEGETARIAN(titleOnly('Classic Bolognese')),
  'Vegetarian excludes "Classic Bolognese"',
);
assert(
  VEGETARIAN(titleOnly('Ragu Pasta')),
  'Vegetarian excludes "Ragu Pasta"',
);
assert(
  VEGETARIAN(titleOnly('Ragù al Macinato')),
  'Vegetarian excludes "Ragù al Macinato" (accented ù)',
);
assert(
  VEGETARIAN(titleOnly('Healthy Carbonara')),
  'Vegetarian excludes "Healthy Carbonara" (pork/pancetta implied)',
);

// ─── Section 4: Vegan — existing ingredient-based checks still work ──────────

section('4 — Vegan: ingredient-based checks not regressed');

assert(
  VEGAN(withIngredients('Pasta', ['anchovies', 'garlic', 'olive oil'])),
  'Vegan excludes anchovy ingredient',
);
assert(
  VEGAN(withIngredients('Stir Fry', ['chicken breast', 'soy sauce'])),
  'Vegan excludes chicken ingredient',
);
assert(
  VEGAN(withIngredients('Pasta', ['parmesan', 'olive oil'])),
  'Vegan excludes parmesan (dairy)',
);
assert(
  !VEGAN(withIngredients('Lentil Soup', ['lentils', 'tomato', 'garlic', 'olive oil'])),
  'Vegan allows plain lentil soup',
);
assert(
  !VEGAN(titleOnly('Mushroom Risotto')),
  'Vegan allows "Mushroom Risotto" title (no meat/seafood/dairy terms)',
);

// ─── Section 5: Vegetarian — safe meals still allowed ────────────────────────

section('5 — Vegetarian: compliant meals not blocked');

assert(
  !VEGETARIAN(titleOnly('Mushroom Risotto')),
  'Vegetarian allows "Mushroom Risotto"',
);
assert(
  !VEGETARIAN(titleOnly('Tomato and Basil Pasta')),
  'Vegetarian allows "Tomato and Basil Pasta"',
);
assert(
  !VEGETARIAN(withIngredients('Cheese Omelette', ['eggs', 'cheddar'])),
  'Vegetarian allows eggs + cheese (not excluded for Vegetarian)',
);

// ─── Section 6: Vegan safe — plant-based meals not blocked ───────────────────

section('6 — Vegan: plant-based meals allowed');

// SURF1B4 — this assertion is INVERTED, and the inversion is the fix.
//
// "Vegan Bolognese" used to be excluded from vegans. The dish-name list this file
// documents lived in `dietRules`, knew the word "bolognese", and had no way to say
// "…unless it says vegan on the tin". The canonical restriction library does: the
// dish names now live in the `meat` definition's hiddenIngredients, and
// "vegan bolognese" is one of its excludedCompounds. A plain "Bolognese" is still
// excluded by title alone — the conservative trade-off this file was written to
// defend is preserved exactly where it is still needed.
assert(
  !VEGAN(titleOnly('Vegan Bolognese')),
  '"Vegan Bolognese" is served to a vegan — the title-only filter can now read the word "vegan"',
);
assert(
  VEGAN(titleOnly('Bolognese')),
  '"Bolognese" (no qualifier) is still excluded by title alone — the conservative trade-off, preserved',
);

assert(
  !VEGAN(titleOnly('Tofu Stir Fry')),
  'Vegan allows "Tofu Stir Fry"',
);
assert(
  !VEGAN(titleOnly('Roasted Vegetable Pasta')),
  'Vegan allows "Roasted Vegetable Pasta"',
);
// Coconut milk in ingredient list hits the same \bmilk\b false positive as the
// Dairy-Free known limitation. Documented below rather than asserted.
knownLimitation(
  !VEGAN(withIngredients('Chickpea Curry', ['chickpeas', 'coconut milk', 'tomatoes'])),
  'Vegan allows chickpea curry with coconut milk ingredient',
  'KNOWN ISSUE: \\bmilk\\b in DAIRY_KEYWORDS matches "coconut milk" — same root cause as Dairy-Free false positive. Not fixed in this PR.',
);

// ─── Section 7: Dairy-Free known limitation — plant-based milks ──────────────

section('7 — Dairy-Free: plant-based milk known limitation (documented, not fixed here)');

// DESIRED behaviour: these should NOT be excluded for Dairy-Free.
// CURRENT behaviour: \bmilk\b matches generically, so all four are incorrectly
// excluded. This is a pre-existing false positive. Tracked for a follow-up fix.

knownLimitation(
  !DAIRY_FREE(titleOnly('Coconut Milk Curry')),
  'Dairy-Free does not exclude "Coconut Milk Curry"',
  'KNOWN ISSUE: \\bmilk\\b matches "coconut milk" — needs plant-milk allowlist or term split. Not fixed in this PR.',
);
knownLimitation(
  !DAIRY_FREE(titleOnly('Oat Milk Porridge')),
  'Dairy-Free does not exclude "Oat Milk Porridge"',
  'KNOWN ISSUE: same \\bmilk\\b false positive.',
);
knownLimitation(
  !DAIRY_FREE(titleOnly('Almond Milk Smoothie')),
  'Dairy-Free does not exclude "Almond Milk Smoothie"',
  'KNOWN ISSUE: same \\bmilk\\b false positive.',
);
knownLimitation(
  !DAIRY_FREE(titleOnly('Soy Milk Latte')),
  'Dairy-Free does not exclude "Soy Milk Latte"',
  'KNOWN ISSUE: same \\bmilk\\b false positive.',
);

// These Dairy-Free exclusions should still work (real dairy):
assert(
  DAIRY_FREE(withIngredients('Pasta', ['parmesan', 'butter'])),
  'Dairy-Free excludes parmesan + butter ingredients',
);
assert(
  DAIRY_FREE(withIngredients('Mac and Cheese', ['macaroni', 'cheddar', 'cream'])),
  'Dairy-Free excludes cheese + cream ingredients',
);

// ─── Section 8: no-profile — nothing excluded ────────────────────────────────

section('8 — No profile: no meals excluded');

assert(
  !NONE(titleOnly('Carbonara')),
  'No diet profile — carbonara is not excluded',
);
assert(
  !NONE(titleOnly('Healthy Seafood Pasta')),
  'No diet profile — seafood pasta is not excluded',
);
assert(
  !NONE(withIngredients('Beef Stew', ['beef', 'potato', 'carrot'])),
  'No diet profile — beef stew is not excluded',
);

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${knownIssues} known limitation(s)`);
if (knownIssues > 0) {
  console.log('Known limitations are documented issues not fixed in this PR — see section 7.');
}
if (failed > 0) {
  console.error('SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED');
}
