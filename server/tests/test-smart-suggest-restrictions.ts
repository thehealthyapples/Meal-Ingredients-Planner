/**
 * test-smart-suggest-restrictions.ts
 * ===================================
 * Phase 5A — verifies that the Smart Planner hard restriction filter uses the
 * canonical restriction resolver rather than raw substring matching.
 *
 * Exercises candidateHardExcluded() from smart-suggest-service, which is the
 * exact predicate the planner applies to every user and external candidate
 * before scoring. A `true` result means the meal is removed from the pool.
 *
 * Covers:
 * - Derived ingredient matching (sesame→tahini/sesame oil, soy→tofu/miso,
 *   peanut→peanut butter)
 * - Hidden ingredient matching (sesame→hummus, peanut→satay sauce)
 * - Word-boundary safety (soy does NOT block savoy cabbage)
 * - Legacy nut_free expansion to peanut + tree nut
 * - Existing gluten/coeliac and dairy filtering still works
 * - Custom (non-canonical) restrictions still block via conservative substring
 * - No restrictions → nothing excluded
 *
 * Run with: npx tsx server/tests/test-smart-suggest-restrictions.ts
 */

import { candidateHardExcluded } from '../lib/smart-suggest-service.js';

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

// ─── 1. Sesame — derived + hidden ingredients ─────────────────────────────────

section('1. Sesame restriction');

assert(
  candidateHardExcluded('Tahini dressing salad', ['lettuce', 'tahini', 'lemon'], ['sesame']),
  'Sesame blocks tahini (derived ingredient)',
);
assert(
  candidateHardExcluded('Stir fry', ['noodles', 'sesame oil', 'garlic'], ['sesame']),
  'Sesame blocks sesame oil (derived ingredient)',
);
assert(
  candidateHardExcluded('Sesame prawn toast', ['bread', 'sesame seeds'], ['sesame']),
  'Sesame blocks sesame by name (alias)',
);
assert(
  candidateHardExcluded('Mezze platter', ['hummus', 'pitta', 'olives'], ['sesame']),
  'Sesame blocks hummus (hidden ingredient)',
);
assert(
  !candidateHardExcluded('Tomato pasta', ['pasta', 'tomatoes', 'basil'], ['sesame']),
  'Sesame does NOT block an unrelated meal',
);

// ─── 2. Soy — derived ingredients + word-boundary safety ──────────────────────

section('2. Soy restriction');

assert(
  candidateHardExcluded('Stir fry', ['chicken', 'soy sauce', 'rice'], ['soy']),
  'Soy blocks soy sauce (derived ingredient)',
);
assert(
  candidateHardExcluded('Buddha bowl', ['tofu', 'rice', 'avocado'], ['soy']),
  'Soy blocks tofu (derived ingredient)',
);
assert(
  candidateHardExcluded('Miso soup', ['miso', 'spring onion', 'dashi'], ['soy']),
  'Soy blocks miso (derived ingredient)',
);
assert(
  candidateHardExcluded('Glazed salmon', ['salmon', 'tamari', 'ginger'], ['soy']),
  'Soy blocks tamari (derived ingredient)',
);
assert(
  !candidateHardExcluded('Braised savoy cabbage', ['savoy cabbage', 'butter', 'pepper'], ['soy']),
  'Soy does NOT block savoy cabbage (word-boundary protection)',
);

// ─── 3. Peanut — derived + hidden ingredients ─────────────────────────────────

section('3. Peanut restriction');

assert(
  candidateHardExcluded('Satay chicken skewers', ['chicken', 'satay sauce'], ['peanut']),
  'Peanut blocks satay sauce (hidden ingredient)',
);
assert(
  candidateHardExcluded('PB toast', ['bread', 'peanut butter'], ['peanut']),
  'Peanut blocks peanut butter (derived ingredient)',
);
assert(
  candidateHardExcluded('Thai noodles', ['noodles', 'peanuts', 'lime'], ['peanut']),
  'Peanut blocks peanuts by name (alias)',
);
assert(
  !candidateHardExcluded('Vegetable stir fry', ['broccoli', 'noodles', 'garlic'], ['peanut']),
  'Peanut does NOT block a peanut-free stir fry',
);

// ─── 4. Legacy nut_free → peanut + tree nut ───────────────────────────────────

section('4. Legacy nut_free expansion');

assert(
  candidateHardExcluded('Satay skewers', ['chicken', 'peanut sauce'], ['nut_free']),
  'nut_free blocks peanut-derived ingredient',
);
assert(
  candidateHardExcluded('Almond cake', ['almonds', 'sugar', 'eggs'], ['nut_free']),
  'nut_free blocks tree nut ingredient (almonds)',
);
assert(
  candidateHardExcluded('Pesto pasta', ['pasta', 'pesto'], ['nut_free']),
  'nut_free blocks pesto (tree nut hidden ingredient)',
);
assert(
  !candidateHardExcluded('Chicken rice', ['chicken', 'rice', 'peas'], ['nut_free']),
  'nut_free does NOT block a nut-free meal',
);

// ─── 5. Existing gluten / coeliac filtering still works ───────────────────────

section('5. Gluten / coeliac filtering');

assert(
  candidateHardExcluded('Stir fry', ['chicken', 'soy sauce'], ['coeliac']),
  'coeliac (gluten alias) blocks soy sauce (gluten hidden ingredient)',
);
assert(
  candidateHardExcluded('Couscous salad', ['couscous', 'tomato', 'mint'], ['gluten']),
  'gluten blocks couscous (derived ingredient)',
);
assert(
  !candidateHardExcluded('Rice salad', ['rice', 'tomato', 'cucumber'], ['gluten']),
  'gluten does NOT block plain rice salad',
);

// ─── 6. Existing dairy filtering still works ──────────────────────────────────

section('6. Dairy filtering');

assert(
  candidateHardExcluded('Cheese omelette', ['eggs', 'cheddar cheese'], ['dairy']),
  'dairy blocks cheese (derived ingredient)',
);
assert(
  candidateHardExcluded('Greek breakfast', ['yoghurt', 'honey', 'oats'], ['dairy']),
  'dairy blocks yoghurt (derived ingredient)',
);
assert(
  !candidateHardExcluded('Olive oil pasta', ['pasta', 'olive oil', 'garlic'], ['dairy']),
  'dairy does NOT block a dairy-free pasta',
);

// ─── 7. Custom (non-canonical) restrictions still work ────────────────────────

section('7. Custom restriction fallback');

assert(
  candidateHardExcluded('Kiwi fruit salad', ['kiwi', 'banana', 'mango'], ['kiwi']),
  'Unknown custom restriction "kiwi" still blocks via substring fallback',
);
assert(
  candidateHardExcluded('Banana bread', ['banana', 'flour', 'sugar'], ['banana']),
  'Unknown custom restriction "banana" still blocks via substring fallback',
);
assert(
  !candidateHardExcluded('Apple crumble', ['apple', 'flour', 'sugar'], ['kiwi']),
  'Custom restriction "kiwi" does NOT block an unrelated meal',
);

// ─── 8. No restrictions → nothing excluded ────────────────────────────────────

section('8. No restrictions');

assert(
  !candidateHardExcluded('Satay chicken with tahini and tofu', ['peanut butter', 'tahini', 'tofu'], []),
  'Empty restriction list excludes nothing (normal suggestions preserved)',
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n────────────────────────────────────────');
console.log(`SMART SUGGEST RESTRICTION TESTS: ${passed} passed, ${failed} failed`);
console.log('────────────────────────────────────────');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
