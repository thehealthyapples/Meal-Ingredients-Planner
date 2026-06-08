/**
 * test-smart-suggest-premium-filter.ts
 * =======================================
 * Regression tests for the premium/subscriber-only content gate in Smart Planner.
 *
 * Root cause: BBC GoodFood premium recipes were seeded into the meals table before
 * import-path blocking existed. The Smart Planner had no premium-content filter on
 * the My Meals candidate pool. Meal IDs 1558 and 1559 (Marinated chicken with orzo,
 * tomato & feta — BBC GoodFood premium) appeared in Smart Planner suggestions.
 *
 * Fix: candidateIsPremium() added to smart-suggest-service.ts and applied both
 * as a defense-in-depth gate inside generateSmartSuggestion() and as a route-level
 * pre-filter at the userMeals block in routes.ts.
 *
 * Tests cover:
 * 1. Saved meal with premium wording in title is excluded from Smart Planner
 * 2. Saved meal with premium wording in instructions is excluded
 * 3. Normal saved recipe passes through (no false positives)
 * 4. All premium marker variants are detected
 * 5. Case-insensitive matching
 * 6. Recipe import blocks premium wording in title (marker constant shared)
 *
 * Run with: npx tsx server/tests/test-smart-suggest-premium-filter.ts
 */

import { candidateIsPremium } from '../lib/smart-suggest-service.js';

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

// ─── 1. Premium wording in title (primary observed case) ──────────────────────

section('1. Premium wording in title');

assert(
  candidateIsPremium({
    name: 'Marinated chicken with orzo, tomato & feta. This is a premium piece of content available to subscribed users.',
    instructions: [],
  }) === true,
  'BBC GoodFood premium title is flagged as premium',
);

assert(
  candidateIsPremium({
    name: 'Edited: Marinated chicken with orzo, tomato & feta. This is a premium piece of content available to subscribed users. (Edited)',
    instructions: [],
  }) === true,
  'Edited BBC GoodFood premium title is flagged as premium',
);

// ─── 2. Premium wording in instructions ───────────────────────────────────────

section('2. Premium wording in instructions');

assert(
  candidateIsPremium({
    name: 'Chicken traybake',
    instructions: [
      'This is a premium piece of content available to subscribed users.',
      'Heat the oven to 200C.',
    ],
  }) === true,
  'Premium marker in instructions is flagged',
);

assert(
  candidateIsPremium({
    name: 'Beef stew',
    instructions: ['Subscription required to view this recipe.'],
  }) === true,
  '"subscription required" in instructions is flagged',
);

// ─── 3. Normal recipe passes (no false positives) ─────────────────────────────

section('3. Normal recipes — no false positives');

assert(
  candidateIsPremium({
    name: 'Spaghetti Bolognese',
    instructions: ['Cook the mince.', 'Add tomatoes.', 'Simmer for 30 minutes.'],
  }) === false,
  'Normal recipe passes through — not flagged as premium',
);

assert(
  candidateIsPremium({
    name: 'Chicken tikka masala',
    instructions: [],
  }) === false,
  'Chicken tikka masala passes through — not flagged as premium',
);

assert(
  candidateIsPremium({
    name: 'Avocado on toast',
    instructions: undefined,
  }) === false,
  'Recipe with no instructions passes through — not flagged as premium',
);

// ─── 4. All premium marker variants ───────────────────────────────────────────

section('4. Premium marker variants');

const markerTests: [string, string][] = [
  ['premium piece of content', 'Recipe contains: premium piece of content'],
  ['available to subscribed users', 'Recipe contains: available to subscribed users'],
  ['subscribed users', 'Recipe contains: subscribed users'],
  ['subscriber-only', 'Recipe contains: subscriber-only'],
  ['subscribers only', 'Recipe contains: subscribers only'],
  ['premium content', 'Recipe contains: premium content'],
  ['subscription required', 'Recipe contains: subscription required'],
];

for (const [marker, label] of markerTests) {
  assert(
    candidateIsPremium({ name: `A great recipe. ${marker}.`, instructions: [] }) === true,
    label,
  );
}

// ─── 5. Case-insensitive matching ─────────────────────────────────────────────

section('5. Case-insensitive matching');

assert(
  candidateIsPremium({
    name: 'PREMIUM PIECE OF CONTENT available to subscribed users',
    instructions: [],
  }) === true,
  'Upper-case premium marker in title is flagged',
);

assert(
  candidateIsPremium({
    name: 'Recipe name',
    instructions: ['SUBSCRIPTION REQUIRED to view full recipe.'],
  }) === true,
  'Upper-case premium marker in instructions is flagged',
);

// ─── 6. Import premium marker constant alignment ───────────────────────────────

section('6. Import premium marker matches the known BBC GoodFood string');

// The import route uses IMPORT_PREMIUM_MARKER = "This is a premium piece of content
// available to subscribed users." — this string contains "premium piece of content"
// AND "available to subscribed users", both of which are in PREMIUM_MARKERS.
// Confirms that the candidateIsPremium() check would have caught this meal on import
// had the title been scanned.
const bbcGoodFoodPremiumTitle =
  'Marinated chicken with orzo, tomato & feta. This is a premium piece of content available to subscribed users.';

assert(
  candidateIsPremium({ name: bbcGoodFoodPremiumTitle, instructions: [] }) === true,
  'BBC GoodFood premium title string is caught by candidateIsPremium()',
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Smart Planner premium filter: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('TESTS FAILED');
  process.exit(1);
} else {
  console.log('All tests passed.');
}
