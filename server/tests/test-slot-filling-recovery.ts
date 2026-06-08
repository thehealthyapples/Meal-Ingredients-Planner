/**
 * test-slot-filling-recovery.ts
 * ==============================
 * Regression tests for the Tier-3 controlled-repeat slot-filling fix.
 *
 * Root cause: usedIds unconditionally blocked all previously-selected meals.
 * Once the unique candidate pool for a slot was exhausted (e.g. 2 Keto breakfasts
 * after day 2), no Tier-3 recovery existed — every remaining breakfast slot was
 * left empty even though compliant meals were available for reuse.
 *
 * Fix: getRepeatCandidates() returns slot-fit candidates without filtering usedIds.
 * Called as Tier 3 only after Tier 1 (unused slot-fit) and Tier 2 (unused safe
 * fallback) are both exhausted. All safety gates remain active — they are enforced
 * at pool-construction time.
 *
 * Run with: npx tsx server/tests/test-slot-filling-recovery.ts
 */

import { generateSmartSuggestion, type SmartSuggestSettings } from '../lib/smart-suggest-service.js';
import type { Meal, UserPreferences } from '@shared/schema.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ─── Minimal stub types for testing ──────────────────────────────────────────

function makeMeal(overrides: Partial<Meal> & { id: number; name: string; categoryId?: number }): Meal {
  return {
    userId: 1,
    ingredients: [],
    instructions: [],
    servings: 2,
    imageUrl: null,
    mealTemplateId: null,
    mealSourceType: 'scratch',
    isReadyMeal: false,
    isSystemMeal: false,
    mealFormat: 'recipe',
    dietTypes: [],
    isFreezerEligible: true,
    audience: 'adult',
    isDrink: false,
    drinkType: null,
    barcode: null,
    brand: null,
    originalMealId: null,
    createdAt: new Date(),
    kind: 'meal',
    isHouseholdSafeVariant: false,
    householdSafeFor: null,
    variantKind: null,
    showInCookbook: false,
    ...overrides,
  } as Meal;
}

const BREAKFAST_CAT_ID = 1;
const LUNCH_CAT_ID = 2;
const DINNER_CAT_ID = 3;

const categoryMap = new Map([
  [BREAKFAST_CAT_ID, 'breakfast'],
  [LUNCH_CAT_ID, 'lunch'],
  [DINNER_CAT_ID, 'dinner'],
]);

const noPrefs: UserPreferences = {
  userId: 1,
  dietTypes: [],
  excludedIngredients: [],
  weeklyBudget: null,
  calorieTarget: null,
  plannerEnableDrinks: false,
  preferredCuisines: [],
  cookingTime: null,
  servings: 2,
};

const baseSettings: SmartSuggestSettings = {
  mealsPerDay: 3,
  dietPattern: null,
  dietRestrictions: [],
  hardExcludedIngredients: [],
  plannerEnableDrinks: false,
};

// ─── Test 1: Keto breakfast pool exhaustion → repeat fills all 7 days ─────────

section('Keto: 2 compliant breakfasts fill all 7 breakfast slots via Tier-3 repeat');

{
  // Only 2 Keto-compliant breakfast meals. Without Tier 3, days 3-7 would be empty.
  const meals: Meal[] = [
    makeMeal({ id: 101, name: 'Cheese Omelette', ingredients: ['eggs', 'cheddar', 'butter'], categoryId: BREAKFAST_CAT_ID }),
    makeMeal({ id: 102, name: 'Avocado Eggs', ingredients: ['eggs', 'avocado', 'salt'], categoryId: BREAKFAST_CAT_ID }),
    // Lunch and dinner meals so those slots are filled
    makeMeal({ id: 201, name: 'Grilled Chicken', ingredients: ['chicken breast', 'olive oil'], categoryId: LUNCH_CAT_ID }),
    makeMeal({ id: 202, name: 'Salmon Salad', ingredients: ['salmon', 'spinach'], categoryId: LUNCH_CAT_ID }),
    makeMeal({ id: 203, name: 'Steak', ingredients: ['beef steak', 'butter'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 204, name: 'Lamb Chops', ingredients: ['lamb chops', 'rosemary'], categoryId: DINNER_CAT_ID }),
  ];

  const settings: SmartSuggestSettings = {
    ...baseSettings,
    dietPattern: 'Keto',
    dietRestrictions: [],
  };

  const result = await generateSmartSuggestion(
    meals, noPrefs, settings, new Map(), categoryMap
  );

  const breakfastEntries = result.entries.filter(e => e.slot === 'breakfast');
  const lunchEntries = result.entries.filter(e => e.slot === 'lunch');
  const dinnerEntries = result.entries.filter(e => e.slot === 'dinner');

  assert(breakfastEntries.length === 7,
    `Keto: all 7 breakfast slots filled (got ${breakfastEntries.length})`);

  // External candidates may also contribute — verify dietary compliance rather than specific names
  const invalidKeto = breakfastEntries.filter(e => {
    const text = [e.candidate.name, ...e.candidate.ingredients].join(' ').toLowerCase();
    return /(bread|flour|oat|cereal|rice|sugar|pasta|waffle|bagel|muffin)/.test(text);
  });
  assert(invalidKeto.length === 0,
    `Keto: all breakfast entries are Keto-compliant (${invalidKeto.map(e => e.candidate.name).join(', ') || 'none invalid'})`);

  assert(lunchEntries.length === 7,
    `Keto: all 7 lunch slots filled (got ${lunchEntries.length})`);

  assert(dinnerEntries.length === 7,
    `Keto: all 7 dinner slots filled (got ${dinnerEntries.length})`);

  // Verify Keto compliance: no bakery/grain/sugar in breakfast slots
  const breakfastNames = breakfastEntries.map(e => e.candidate.name.toLowerCase());
  assert(breakfastNames.every(n => !/(bread|flour|oat|cereal|sugar|rice)/.test(n)),
    'Keto: no non-Keto meals in breakfast slots');
}

// ─── Test 2: Dinner slot fills via Tier-3 repeat when pool is small ───────────

section('Dinner: small pool fills all 7 dinner slots via Tier-3 repeat');

{
  const meals: Meal[] = [
    makeMeal({ id: 301, name: 'Chicken Stir Fry', ingredients: ['chicken', 'vegetables'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 302, name: 'Beef Curry', ingredients: ['beef', 'curry paste', 'coconut milk'], categoryId: DINNER_CAT_ID }),
    // Only 2 dinner meals for 7 dinner slots
    makeMeal({ id: 201, name: 'Egg Salad', ingredients: ['eggs', 'lettuce'], categoryId: LUNCH_CAT_ID }),
    makeMeal({ id: 202, name: 'Tuna Wrap', ingredients: ['tuna', 'wrap'], categoryId: LUNCH_CAT_ID }),
  ];

  const result = await generateSmartSuggestion(
    meals, noPrefs, { ...baseSettings, mealsPerDay: 2 }, new Map(), categoryMap
  );

  const dinnerEntries = result.entries.filter(e => e.slot === 'dinner');
  assert(dinnerEntries.length === 7,
    `Dinner: all 7 slots filled with 2-meal pool (got ${dinnerEntries.length})`);
}

// ─── Test 3: Breakfast boundary — dinner meals never reused in breakfast ───────

section('Boundary: dinner meals must NOT appear in breakfast slots via Tier-3');

{
  const meals: Meal[] = [
    // Only dinner meals — no breakfast candidates at all
    makeMeal({ id: 401, name: 'Roast Chicken', ingredients: ['chicken', 'potatoes', 'herbs'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 402, name: 'Pasta Bake', ingredients: ['pasta', 'tomatoes', 'cheese'], categoryId: DINNER_CAT_ID }),
    // Lunch meals
    makeMeal({ id: 501, name: 'Soup', ingredients: ['vegetables', 'stock'], categoryId: LUNCH_CAT_ID }),
  ];

  const result = await generateSmartSuggestion(
    meals, noPrefs, baseSettings, new Map(), categoryMap
  );

  const breakfastEntries = result.entries.filter(e => e.slot === 'breakfast');
  const breakfastNames = breakfastEntries.map(e => e.candidate.name);

  // External search may contribute breakfast candidates — the boundary we're testing is
  // that LOCAL dinner meals are never promoted to the breakfast slot.
  assert(!breakfastNames.includes('Roast Chicken') && !breakfastNames.includes('Pasta Bake'),
    'Boundary: local dinner meals never promoted to breakfast slots');

  assert(!breakfastNames.includes('Soup'),
    'Boundary: local lunch meals never promoted to breakfast slots');

  const dinnerEntries = result.entries.filter(e => e.slot === 'dinner');
  assert(dinnerEntries.length === 7,
    `Boundary: dinner slots still fill correctly (got ${dinnerEntries.length})`);
}

// ─── Test 4: Vegan compliance maintained through Tier-3 repeats ───────────────

section('Vegan: compliance maintained when Tier-3 repeats activate');

{
  const meals: Meal[] = [
    // Only 1 Vegan-compliant breakfast meal
    makeMeal({ id: 601, name: 'Fruit Salad', ingredients: ['banana', 'berries', 'apple'], categoryId: BREAKFAST_CAT_ID }),
    // Non-vegan breakfast meal — must NOT appear
    makeMeal({ id: 602, name: 'Egg Benedict', ingredients: ['eggs', 'ham', 'hollandaise'], categoryId: BREAKFAST_CAT_ID }),
    makeMeal({ id: 701, name: 'Lentil Soup', ingredients: ['lentils', 'tomatoes', 'cumin'], categoryId: LUNCH_CAT_ID }),
    makeMeal({ id: 702, name: 'Chickpea Curry', ingredients: ['chickpeas', 'tomato', 'spices'], categoryId: DINNER_CAT_ID }),
  ];

  const settings: SmartSuggestSettings = {
    ...baseSettings,
    dietPattern: 'Vegan',
  };

  const result = await generateSmartSuggestion(
    meals, noPrefs, settings, new Map(), categoryMap
  );

  const breakfastEntries = result.entries.filter(e => e.slot === 'breakfast');

  assert(breakfastEntries.length === 7,
    `Vegan: 1-meal pool fills all 7 breakfast slots (got ${breakfastEntries.length})`);

  assert(breakfastEntries.every(e => e.candidate.name === 'Fruit Salad'),
    'Vegan: only the compliant meal appears in breakfast slots');

  assert(!breakfastEntries.some(e => e.candidate.name === 'Egg Benedict'),
    'Vegan: non-vegan breakfast meal never appears despite having breakfast category');
}

// ─── Test 5: Premium meals excluded even in Tier-3 ────────────────────────────
// Note: component filtering (kind='component') is enforced by routes.ts before
// generateSmartSuggestion is called. Premium filtering IS done inside the service.

section('Safety: premium meals excluded from Tier-3 repeats');

{
  // Pre-filter components as routes.ts would — service tests must simulate this
  const allMeals: Meal[] = [
    makeMeal({ id: 802, name: 'Available to subscribed users only — Granola', ingredients: ['oats', 'nuts'], categoryId: BREAKFAST_CAT_ID }),
    // Only one valid breakfast meal after premium exclusion
    makeMeal({ id: 803, name: 'Simple Porridge', ingredients: ['oats', 'water', 'berries'], categoryId: BREAKFAST_CAT_ID }),
    makeMeal({ id: 901, name: 'Salad', ingredients: ['lettuce', 'cucumber'], categoryId: LUNCH_CAT_ID }),
    makeMeal({ id: 902, name: 'Rice Bowl', ingredients: ['rice', 'vegetables'], categoryId: DINNER_CAT_ID }),
  ];

  const result = await generateSmartSuggestion(
    allMeals, noPrefs, baseSettings, new Map(), categoryMap
  );

  const breakfastEntries = result.entries.filter(e => e.slot === 'breakfast');
  const breakfastNames = breakfastEntries.map(e => e.candidate.name);

  assert(!breakfastNames.some(n => n.toLowerCase().includes('subscribed')),
    'Safety: premium meal never appears in breakfast slots');

  assert(!breakfastNames.some(n => n.toLowerCase().includes('subscribed users')),
    'Safety: premium marker never appears in breakfast entry names');
}

// ─── Test 6: Variety preserved — unique meals used before repeats ─────────────

section('Variety: unique meals preferred; Tier-3 only activates after exhaustion');

{
  const meals: Meal[] = [
    makeMeal({ id: 1001, name: 'Omelette', ingredients: ['eggs', 'cheese'], categoryId: BREAKFAST_CAT_ID }),
    makeMeal({ id: 1002, name: 'Scrambled Eggs', ingredients: ['eggs', 'butter'], categoryId: BREAKFAST_CAT_ID }),
    makeMeal({ id: 1003, name: 'Avocado Toast', ingredients: ['avocado', 'toast'], categoryId: BREAKFAST_CAT_ID }),
    makeMeal({ id: 1101, name: 'Salad', ingredients: ['lettuce', 'tomato'], categoryId: LUNCH_CAT_ID }),
    makeMeal({ id: 1201, name: 'Pasta', ingredients: ['pasta', 'sauce'], categoryId: DINNER_CAT_ID }),
  ];

  const result = await generateSmartSuggestion(
    meals, noPrefs, baseSettings, new Map(), categoryMap
  );

  const breakfastEntries = result.entries.filter(e => e.slot === 'breakfast');
  const breakfastNames = breakfastEntries.map(e => e.candidate.name);
  const uniqueBreakfastNames = new Set(breakfastNames);

  assert(breakfastEntries.length === 7,
    `Variety: all 7 breakfast slots filled (got ${breakfastEntries.length})`);

  // With 3 unique meals for 7 slots, at least 3 distinct meals must appear
  assert(uniqueBreakfastNames.size >= 3,
    `Variety: all 3 unique meals used before repeats (unique count: ${uniqueBreakfastNames.size})`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n────────────────────────────────────────────────────────');
console.log(`SLOT FILLING RECOVERY TESTS: ${passed} passed, ${failed} failed`);
console.log('────────────────────────────────────────────────────────');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
