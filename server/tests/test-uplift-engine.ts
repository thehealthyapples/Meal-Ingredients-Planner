/**
 * test-uplift-engine.ts
 * =====================
 * Unit + snapshot tests for the Nutrition Uplift Engine.
 *
 * Run with:  npm run test:uplift
 *
 * Tests cover:
 * - Rule matching
 * - Duplicate suppression
 * - Diet exclusions
 * - Slot exclusions
 * - Approval gate (unreviewed rules excluded)
 * - Priority ordering
 * - Confidence handling
 * - Deterministic / stable outputs
 * - Batch matching
 * - Performance assumptions
 */

import { buildRuleIndex, matchUpliftRules, batchMatchUplift } from '../lib/uplift-engine.js';
import UPLIFT_RULES from '../lib/uplift-rules.js';
import type { UpliftRule, UpliftContext, BatchUpliftInput } from '../lib/uplift-types.js';

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

// ─── Build index ──────────────────────────────────────────────────────────────

const IDX = buildRuleIndex(UPLIFT_RULES);

// ─── 1. Approval gate ────────────────────────────────────────────────────────

section('1. Approval gate');

const unreviewedCtx: UpliftContext = {
  mealName: 'omelette',
  ingredients: ['eggs', 'butter'],
};
const unreviewedResults = matchUpliftRules(unreviewedCtx, IDX);
const draftMatch = unreviewedResults.find(r => r.ruleId === 'draft-omelette-rule');
assert(!draftMatch, 'Unreviewed rule excluded from production matching');

const reviewedCount = UPLIFT_RULES.filter(r => r.reviewedAt).length;
const unreviewed = UPLIFT_RULES.filter(r => !r.reviewedAt).length;
assert(unreviewed >= 1, `At least 1 unreviewed draft rule exists (found ${unreviewed})`);
assert(reviewedCount >= 20, `At least 20 reviewed rules exist (found ${reviewedCount})`);

// ─── 2. Mac & cheese matching ─────────────────────────────────────────────────

section('2. Mac & cheese payload');

const macCtx: UpliftContext = {
  mealName: 'mac and cheese',
  ingredients: ['macaroni', 'cheddar cheese', 'milk', 'butter'],
  mealSlot: 'dinner',
};
const macResults = matchUpliftRules(macCtx, IDX);

assert(macResults.length > 0, 'Mac & cheese returns matches');

const macIngredients = macResults.flatMap(r => r.suggestions.map(s => s.ingredient.toLowerCase()));
assert(
  macIngredients.some(i => i.includes('turmeric')),
  'Turmeric suggestion present for mac & cheese'
);
assert(
  macIngredients.some(i => i.includes('black pepper')),
  'Black pepper suggestion present for mac & cheese'
);
assert(
  macIngredients.some(i => i.includes('peas')),
  'Peas suggestion present for mac & cheese'
);

// ─── 3. Salad matching ────────────────────────────────────────────────────────

section('3. Salad payload');

const saladCtx: UpliftContext = {
  mealName: 'green salad',
  ingredients: ['lettuce', 'cucumber', 'tomatoes'],
  category: 'salad',
  mealSlot: 'lunch',
};
const saladResults = matchUpliftRules(saladCtx, IDX);

assert(saladResults.length > 0, 'Salad returns matches');

const saladIngredients = saladResults.flatMap(r => r.suggestions.map(s => s.ingredient.toLowerCase()));
assert(
  saladIngredients.some(i => i.includes('seed')),
  'Seeds suggestion present for salad'
);
assert(
  saladIngredients.some(i => i.includes('olive oil')),
  'Olive oil suggestion present for salad'
);
assert(
  saladIngredients.some(i => i.includes('apple cider vinegar')),
  'Apple cider vinegar suggestion present for salad'
);

// ─── 4. Wholemeal swap rule ───────────────────────────────────────────────────

section('4. Wholemeal swap rules');

const pastaCtx: UpliftContext = {
  mealName: 'spaghetti bolognese',
  ingredients: ['spaghetti', 'beef mince', 'tomatoes', 'onion'],
  mealSlot: 'dinner',
};
const pastaResults = matchUpliftRules(pastaCtx, IDX);
const pastaSwaps = pastaResults.flatMap(r => r.suggestions.filter(s => s.action === 'swap'));
assert(pastaSwaps.length > 0, 'Wholemeal swap suggested for pasta dish');
assert(
  pastaSwaps.some(s => s.ingredient.toLowerCase().includes('wholemeal')),
  'Wholemeal pasta swap suggested'
);

const toastCtx: UpliftContext = {
  mealName: 'beans on toast',
  ingredients: ['bread', 'baked beans'],
  mealSlot: 'breakfast',
};
const toastResults = matchUpliftRules(toastCtx, IDX);
const toastSwaps = toastResults.flatMap(r => r.suggestions.filter(s => s.action === 'swap'));
assert(toastSwaps.length > 0, 'Wholemeal swap suggested for toast');

// ─── 5. Diet exclusion ────────────────────────────────────────────────────────

section('5. Diet exclusion');

const curryVeganCtx: UpliftContext = {
  mealName: 'vegetable curry',
  ingredients: ['chickpeas', 'tomatoes', 'coconut milk', 'spices'],
  mealSlot: 'dinner',
  dietTypes: ['vegan'],
};
const curryVeganResults = matchUpliftRules(curryVeganCtx, IDX);
const dairyRuleMatched = curryVeganResults.find(r => r.ruleId === 'curry-fermented-addition');
assert(!dairyRuleMatched, 'Dairy yoghurt rule excluded for vegan household');

const curryOmniCtx: UpliftContext = {
  mealName: 'chicken curry',
  ingredients: ['chicken', 'tomatoes', 'cream', 'spices'],
  mealSlot: 'dinner',
  dietTypes: [],
};
const curryOmniResults = matchUpliftRules(curryOmniCtx, IDX);
const dairyRuleOmni = curryOmniResults.find(r => r.ruleId === 'curry-fermented-addition');
assert(!!dairyRuleOmni, 'Dairy yoghurt rule included for omnivore household');

const dairyFreeCtx: UpliftContext = {
  mealName: 'chicken curry',
  ingredients: ['chicken', 'tomatoes', 'coconut cream'],
  mealSlot: 'dinner',
  dietTypes: ['dairy-free'],
};
const dairyFreeResults = matchUpliftRules(dairyFreeCtx, IDX);
const dairyRuleDairyFree = dairyFreeResults.find(r => r.ruleId === 'curry-fermented-addition');
assert(!dairyRuleDairyFree, 'Dairy rule excluded for dairy-free household');

// ─── 6. Slot exclusion ───────────────────────────────────────────────────────

section('6. Slot exclusion');

// Porridge is breakfast-only in that rule
const porridgeDinnerCtx: UpliftContext = {
  mealName: 'porridge',
  ingredients: ['oats', 'milk'],
  mealSlot: 'dinner',
};
const porridgeDinnerResults = matchUpliftRules(porridgeDinnerCtx, IDX);
const resistantStarchAtDinner = porridgeDinnerResults.find(r => r.ruleId === 'porridge-resistant-starch');
// This rule has compatibleMealSlots: ['breakfast'], so should not fire for dinner
assert(!resistantStarchAtDinner, 'Breakfast-only rule excluded when slot is dinner');

const porridgeBreakfastCtx: UpliftContext = {
  mealName: 'porridge',
  ingredients: ['oats', 'milk'],
  mealSlot: 'breakfast',
};
const porridgeBreakfastResults = matchUpliftRules(porridgeBreakfastCtx, IDX);
const resistantStarchAtBreakfast = porridgeBreakfastResults.find(r => r.ruleId === 'porridge-resistant-starch');
assert(!!resistantStarchAtBreakfast, 'Breakfast-only rule fires correctly at breakfast');

// ─── 7. Duplicate suppression ────────────────────────────────────────────────

section('7. Duplicate suppression');

// Bolognese could match both pasta-lentil-protein and pasta-wholemeal-swap
// and possibly other pasta rules — ensure lentils only appear once
const batchWithDupes: BatchUpliftInput = {
  meals: [
    {
      id: 'pasta-1',
      name: 'spaghetti bolognese',
      ingredients: ['spaghetti', 'beef mince', 'tomatoes'],
      mealSlot: 'dinner',
    },
    {
      id: 'pasta-2',
      name: 'penne bolognese',
      ingredients: ['penne', 'beef mince', 'tomatoes'],
      mealSlot: 'dinner',
    },
  ],
  dietTypes: [],
};

const batchOutput = batchMatchUplift(batchWithDupes, IDX);
assert(batchOutput.results.length === 2, 'Batch returns result for each meal');

for (const mealResult of batchOutput.results) {
  const allIngredients = mealResult.matches.flatMap(m => m.suggestions.map(s => s.ingredient.toLowerCase().trim()));
  const uniqueIngredients = new Set(allIngredients);
  assert(
    allIngredients.length === uniqueIngredients.size,
    `No duplicate suggestions in batch result for "${mealResult.mealName}"`
  );
}

// ─── 8. Priority ordering ────────────────────────────────────────────────────

section('8. Priority ordering');

if (macResults.length >= 2) {
  let prioritiesAscending = true;
  for (let i = 1; i < macResults.length; i++) {
    if (macResults[i].priority < macResults[i - 1].priority) {
      prioritiesAscending = false;
      break;
    }
  }
  assert(prioritiesAscending, 'Matches returned in ascending priority order');
}

// ─── 9. Deterministic / stable outputs ───────────────────────────────────────

section('9. Deterministic and stable outputs');

const deterministicCtx: UpliftContext = {
  mealName: 'mac and cheese',
  ingredients: ['macaroni', 'cheddar cheese', 'milk'],
  mealSlot: 'dinner',
  dietTypes: [],
};

const run1 = matchUpliftRules(deterministicCtx, IDX);
const run2 = matchUpliftRules(deterministicCtx, IDX);
const run3 = matchUpliftRules(deterministicCtx, IDX);

assertEqual(
  run1.map(r => r.ruleId),
  run2.map(r => r.ruleId),
  'Run 1 and run 2 return identical rule IDs'
);
assertEqual(
  run2.map(r => r.ruleId),
  run3.map(r => r.ruleId),
  'Run 2 and run 3 return identical rule IDs'
);

// Snapshot check — rule IDs must be stable
const snapshotRuleIds = run1.map(r => r.ruleId);
assert(snapshotRuleIds.includes('mac-cheese-turmeric-pepper'), 'Snapshot: mac-cheese-turmeric-pepper present');
assert(snapshotRuleIds.includes('mac-cheese-wholemeal-swap'), 'Snapshot: mac-cheese-wholemeal-swap present');

// ─── 10. Confidence handling ──────────────────────────────────────────────────

section('10. Confidence handling');

const tiers = ['high', 'medium', 'low'] as const;
for (const result of macResults) {
  assert(
    tiers.includes(result.confidence as any),
    `Match ${result.ruleId} has valid confidence tier: ${result.confidence}`
  );
}

// ─── 11. Batch performance ────────────────────────────────────────────────────

section('11. Performance');

const perfMeals = Array.from({ length: 21 }, (_, i) => ({
  id: i,
  name: ['mac and cheese', 'spaghetti bolognese', 'green salad', 'chicken curry', 'jacket potato',
         'porridge', 'toast', 'pizza', 'chicken stir fry', 'rice bowl', 'vegetable wrap',
         'bean soup', 'pasta carbonara', 'baked potato', 'chicken dinner', 'sandwich',
         'granola', 'muesli', 'chicken tikka masala', 'lentil soup', 'fajita wrap'][i % 21],
  ingredients: ['mixed ingredients'],
  mealSlot: ['breakfast', 'lunch', 'dinner', 'snack'][i % 4],
}));

const perfStart = Date.now();
const perfOutput = batchMatchUplift({ meals: perfMeals, dietTypes: [] }, IDX);
const perfMs = Date.now() - perfStart;

assert(perfMs < 30, `Batch of 21 meals matches in under 30ms (actual: ${perfMs}ms)`);
assert(perfOutput.matchTimeMs < 30, `Reported matchTimeMs under 30ms (actual: ${perfOutput.matchTimeMs}ms)`);

// ─── 12. Batch structure ─────────────────────────────────────────────────────

section('12. Batch response structure');

const structureInput: BatchUpliftInput = {
  meals: [
    { id: 'a1', name: 'salad', ingredients: ['lettuce', 'tomatoes'], mealSlot: 'lunch' },
  ],
  dietTypes: [],
};
const structureOutput = batchMatchUplift(structureInput, IDX);
assert(typeof structureOutput.matchTimeMs === 'number', 'matchTimeMs is a number');
assert(typeof structureOutput.totalMeals === 'number', 'totalMeals is a number');
assert(typeof structureOutput.totalMatches === 'number', 'totalMatches is a number');
assert(Array.isArray(structureOutput.results), 'results is an array');
assert(structureOutput.totalMeals === 1, 'totalMeals matches input length');

if (structureOutput.results.length > 0) {
  const firstResult = structureOutput.results[0];
  assert(firstResult.mealId === 'a1', 'mealId preserved in result');
  assert(Array.isArray(firstResult.matches), 'matches is an array');
  if (firstResult.matches.length > 0) {
    const firstMatch = firstResult.matches[0];
    assert(typeof firstMatch.ruleId === 'string', 'ruleId is string');
    assert(typeof firstMatch.ruleName === 'string', 'ruleName is string');
    assert(Array.isArray(firstMatch.suggestions), 'suggestions is array');
    assert(Array.isArray(firstMatch.matchedTriggers), 'matchedTriggers is array');
  }
}

// ─── 13. Empty batch ─────────────────────────────────────────────────────────

section('13. Edge cases');

const emptyResult = batchMatchUplift({ meals: [], dietTypes: [] }, IDX);
assertEqual(emptyResult.results, [], 'Empty meals array returns empty results');
assertEqual(emptyResult.totalMeals, 0, 'Empty meals has totalMeals of 0');

// Meal with no matching rules
const noMatchCtx: UpliftContext = {
  mealName: 'xzzy unknown dish 12345',
  ingredients: [],
};
const noMatchResult = matchUpliftRules(noMatchCtx, IDX);
assertEqual(noMatchResult, [], 'Unrecognised meal returns empty match array');

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n────────────────────────────────────────`);
console.log(`UPLIFT ENGINE TESTS: ${passed} passed, ${failed} failed`);
console.log(`────────────────────────────────────────`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
