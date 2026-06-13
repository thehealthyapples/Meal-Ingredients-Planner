/**
 * test-household-vegan-vegetarian-hard-enforcement.ts
 * =====================================================
 * Verifies that household-level Vegetarian and Vegan dietary patterns are
 * hard-enforced in the Smart Planner candidate pool and Tier-4 shell recovery.
 *
 * Background: prior to this fix, household eater Vegetarian/Vegan diet types
 * flowed into mergedDietTypes for scoring only. They did NOT enter
 * candidateDietExcluded(), so a child or non-request-user adult Vegetarian
 * household member could silently receive chicken/fish/meat in their plan.
 *
 * Tests cover all 8 Definition-of-Done scenarios:
 *  1. Child Vegetarian blocks chicken/fish meals
 *  2. Adult non-request-user Vegetarian blocks chicken/fish meals
 *  3. Child Vegan blocks meat/dairy/egg/honey
 *  4. Adult non-request-user Vegan blocks meat/dairy/egg/honey
 *  5. Mixed omnivore + Vegetarian household → vegetarian-safe meals only
 *  6. Mixed Mediterranean + Vegan household → vegan-safe meals only
 *  7. Coconut milk / oat milk / coconut cream remain allowed under Vegan
 *  8. Tier-4 shell recovery obeys the same Vegetarian/Vegan household rules
 *
 * Run with: npx tsx server/tests/test-household-vegan-vegetarian-hard-enforcement.ts
 */

import { generateSmartSuggestion, selectShellRecoveryCandidate, type SmartSuggestSettings } from '../lib/smart-suggest-service.js';
import { candidateDietExcluded } from '../lib/smart-suggest-service.js';
import type { Meal, UserPreferences } from '@shared/schema.js';
import type { MealMatch, ScoreBreakdown } from '../lib/household-meal-matcher.js';
import type { MealTemplate } from '@shared/schema.js';

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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

const DINNER_CAT_ID = 3;
const LUNCH_CAT_ID = 2;
const BREAKFAST_CAT_ID = 1;

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
} as UserPreferences;

const baseSettings: SmartSuggestSettings = {
  mealsPerDay: 1,
  dietPattern: null,
  dietRestrictions: [],
  hardExcludedIngredients: [],
  plannerEnableDrinks: false,
};

// ─── Helpers to call generateSmartSuggestion for a single pool pass ───────────

// Returns all entry candidate names across the 7-day plan.
async function planEntryNames(meals: Meal[], settings: SmartSuggestSettings): Promise<string[]> {
  const result = await generateSmartSuggestion(meals, noPrefs, settings, new Map(), categoryMap);
  return result.entries.map(e => e.candidate.name);
}

// ─── Test 1: Child Vegetarian blocks chicken/fish meals ───────────────────────

section('Test 1 — Child Vegetarian: chicken and fish blocked');

{
  const meals: Meal[] = [
    makeMeal({ id: 1, name: 'Roast Chicken', ingredients: ['chicken', 'herbs', 'oil'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 2, name: 'Salmon Fillet', ingredients: ['salmon', 'lemon', 'dill'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 3, name: 'Chickpea Curry', ingredients: ['chickpeas', 'tomato', 'spices'], categoryId: DINNER_CAT_ID }),
  ];

  const settings: SmartSuggestSettings = {
    ...baseSettings,
    householdStrictDiets: ['Vegetarian'],
  };

  const names = await planEntryNames(meals, settings);
  const uniqueNames = new Set(names);

  assert(!uniqueNames.has('Roast Chicken'),
    'Child Vegetarian: chicken blocked from pool');
  assert(!uniqueNames.has('Salmon Fillet'),
    'Child Vegetarian: fish blocked from pool');
  assert(names.length === 7,
    `Child Vegetarian: plan still fills 7 slots via compliant meal (got ${names.length})`);
  // All served meals (including external candidates) must be vegetarian-safe
  const veggNames = await generateSmartSuggestion(meals, noPrefs, settings, new Map(), categoryMap)
    .then(r => r.entries.map(e => [e.candidate.name, ...e.candidate.ingredients].join(' ').toLowerCase()));
  const hasMeat = veggNames.some(t => /(chicken|beef|pork|lamb|salmon|cod|tuna|prawn|fish)/.test(t));
  assert(!hasMeat, 'Child Vegetarian: no meat or fish in any served entry (incl. external candidates)');
}

// ─── Test 2: Adult non-request-user Vegetarian blocks chicken/fish ────────────

section('Test 2 — Adult non-request-user Vegetarian: chicken and fish blocked');

{
  const meals: Meal[] = [
    makeMeal({ id: 10, name: 'Beef Burger', ingredients: ['beef mince', 'bun', 'lettuce'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 11, name: 'Cod and Chips', ingredients: ['cod', 'potato', 'batter'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 12, name: 'Lentil Dahl', ingredients: ['lentils', 'onion', 'cumin', 'turmeric'], categoryId: DINNER_CAT_ID }),
  ];

  // Request user is omnivore (dietPattern null), but adult household member is Vegetarian.
  const settings: SmartSuggestSettings = {
    ...baseSettings,
    dietPattern: null,
    householdStrictDiets: ['Vegetarian'],
  };

  const names = await planEntryNames(meals, settings);
  const uniqueNames = new Set(names);

  assert(!uniqueNames.has('Beef Burger'),
    'Adult Vegetarian member: beef blocked from pool');
  assert(!uniqueNames.has('Cod and Chips'),
    'Adult Vegetarian member: fish blocked from pool');
  const vegg2Names = await generateSmartSuggestion(meals, noPrefs, settings, new Map(), categoryMap)
    .then(r => r.entries.map(e => [e.candidate.name, ...e.candidate.ingredients].join(' ').toLowerCase()));
  const hasMeat2 = vegg2Names.some(t => /(beef|cod|fish|salmon|chicken|pork|lamb|tuna|prawn)/.test(t));
  assert(!hasMeat2, 'Adult Vegetarian member: no meat or fish in any served entry (incl. external candidates)');
}

// ─── Test 3: Child Vegan blocks meat/dairy/egg/honey ─────────────────────────

section('Test 3 — Child Vegan: meat, dairy, egg, honey all blocked');

{
  const meals: Meal[] = [
    makeMeal({ id: 20, name: 'Chicken Tikka', ingredients: ['chicken', 'yoghurt', 'spices'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 21, name: 'Cheese Omelette', ingredients: ['eggs', 'cheddar', 'butter'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 22, name: 'Honey Cake', ingredients: ['honey', 'flour', 'eggs'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 23, name: 'Bean Stew', ingredients: ['black beans', 'tomato', 'onion', 'garlic'], categoryId: DINNER_CAT_ID }),
  ];

  const settings: SmartSuggestSettings = {
    ...baseSettings,
    householdStrictDiets: ['Vegan'],
  };

  const names = await planEntryNames(meals, settings);
  const uniqueNames = new Set(names);

  assert(!uniqueNames.has('Chicken Tikka'),
    'Child Vegan: chicken + dairy (yoghurt) blocked');
  assert(!uniqueNames.has('Cheese Omelette'),
    'Child Vegan: eggs + dairy blocked');
  assert(!uniqueNames.has('Honey Cake'),
    'Child Vegan: honey blocked');
  const vegan3Texts = await generateSmartSuggestion(meals, noPrefs, settings, new Map(), categoryMap)
    .then(r => r.entries.map(e => [e.candidate.name, ...e.candidate.ingredients].join(' ').toLowerCase()));
  const hasAnimal3 = vegan3Texts.some(t => /(chicken|beef|pork|lamb|salmon|fish|egg|cheddar|mozzarella|yogh|honey|butter|cream|milk)/.test(t));
  assert(!hasAnimal3, 'Child Vegan: no animal products in any served entry (incl. external candidates)');
}

// ─── Test 4: Adult non-request-user Vegan blocks meat/dairy/egg/honey ─────────

section('Test 4 — Adult non-request-user Vegan: full vegan enforcement');

{
  const meals: Meal[] = [
    makeMeal({ id: 30, name: 'Lamb Roast', ingredients: ['lamb', 'rosemary', 'oil'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 31, name: 'Prawn Stir Fry', ingredients: ['prawns', 'vegetables', 'soy sauce'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 32, name: 'Milk Pudding', ingredients: ['milk', 'cream', 'sugar'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 33, name: 'Tofu Stir Fry', ingredients: ['tofu', 'vegetables', 'tamari'], categoryId: DINNER_CAT_ID }),
  ];

  const settings: SmartSuggestSettings = {
    ...baseSettings,
    dietPattern: null,
    householdStrictDiets: ['Vegan'],
  };

  const names = await planEntryNames(meals, settings);
  const uniqueNames = new Set(names);

  assert(!uniqueNames.has('Lamb Roast'),
    'Adult Vegan member: lamb blocked');
  assert(!uniqueNames.has('Prawn Stir Fry'),
    'Adult Vegan member: prawns blocked');
  assert(!uniqueNames.has('Milk Pudding'),
    'Adult Vegan member: dairy blocked');
  const vegan4Texts = await generateSmartSuggestion(meals, noPrefs, settings, new Map(), categoryMap)
    .then(r => r.entries.map(e => [e.candidate.name, ...e.candidate.ingredients].join(' ').toLowerCase()));
  const hasAnimal4 = vegan4Texts.some(t => /(lamb|prawn|milk|cream|egg|cheese|chicken|fish|salmon|beef|pork|butter|honey)/.test(t));
  assert(!hasAnimal4, 'Adult Vegan member: no animal products in any served entry (incl. external candidates)');
}

// ─── Test 5: Mixed omnivore + Vegetarian household ────────────────────────────

section('Test 5 — Mixed omnivore + Vegetarian: shared meals must be vegetarian-safe');

{
  // Request user is omnivore, one household member is Vegetarian.
  const meals: Meal[] = [
    makeMeal({ id: 40, name: 'Grilled Steak', ingredients: ['beef steak', 'oil', 'seasoning'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 41, name: 'Tuna Pasta', ingredients: ['pasta', 'tuna', 'sweetcorn'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 42, name: 'Veggie Pasta', ingredients: ['pasta', 'peppers', 'courgette', 'tomato'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 43, name: 'Cheese Pizza', ingredients: ['dough', 'mozzarella', 'tomato', 'basil'], categoryId: DINNER_CAT_ID }),
  ];

  const settings: SmartSuggestSettings = {
    ...baseSettings,
    dietPattern: null,
    householdStrictDiets: ['Vegetarian'],
  };

  const names = await planEntryNames(meals, settings);
  const uniqueNames = new Set(names);

  assert(!uniqueNames.has('Grilled Steak'),
    'Mixed omni+Veg: steak excluded from shared plan');
  assert(!uniqueNames.has('Tuna Pasta'),
    'Mixed omni+Veg: tuna excluded from shared plan');
  assert(
    uniqueNames.has('Veggie Pasta') || uniqueNames.has('Cheese Pizza'),
    'Mixed omni+Veg: vegetarian-safe meals remain in pool',
  );
}

// ─── Test 6: Mixed Mediterranean + Vegan household ────────────────────────────

section('Test 6 — Mixed Mediterranean + Vegan: vegan-safe meals only');

{
  // Request user is Mediterranean (scoring only, no hard blocks in current system).
  // Household member is Vegan → should hard-enforce vegan rules.
  const meals: Meal[] = [
    makeMeal({ id: 50, name: 'Grilled Salmon', ingredients: ['salmon', 'olive oil', 'lemon'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 51, name: 'Feta Salad', ingredients: ['feta', 'tomato', 'olive', 'olive oil'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 52, name: 'Hummus and Pita', ingredients: ['hummus', 'pitta', 'olive oil', 'chickpeas'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 53, name: 'Lentil Soup', ingredients: ['lentils', 'tomato', 'onion', 'olive oil', 'herbs'], categoryId: DINNER_CAT_ID }),
  ];

  const settings: SmartSuggestSettings = {
    ...baseSettings,
    dietPattern: 'Mediterranean',
    householdStrictDiets: ['Vegan'],
  };

  const names = await planEntryNames(meals, settings);
  const uniqueNames = new Set(names);

  assert(!uniqueNames.has('Grilled Salmon'),
    'Mediterranean+Vegan: salmon excluded (fish)');
  assert(!uniqueNames.has('Feta Salad'),
    'Mediterranean+Vegan: feta excluded (dairy)');
  assert(
    uniqueNames.has('Hummus and Pita') || uniqueNames.has('Lentil Soup'),
    'Mediterranean+Vegan: plant-based Mediterranean meals remain',
  );
}

// ─── Test 7: Coconut milk / oat milk / coconut cream allowed for Vegan ─────────

section('Test 7 — Plant milk exception: coconut milk, oat milk, coconut cream allowed');

{
  // These meals use plant milks — should NOT be excluded by Vegan hard filter.
  assert(
    !candidateDietExcluded(
      { name: 'Coconut Curry', ingredients: ['coconut milk', 'chickpeas', 'spices'] },
      'Vegan', [],
    ),
    'Coconut milk does NOT trigger Vegan exclusion',
  );
  assert(
    !candidateDietExcluded(
      { name: 'Oat Porridge', ingredients: ['oats', 'oat milk', 'berries'] },
      'Vegan', [],
    ),
    'Oat milk does NOT trigger Vegan exclusion',
  );
  assert(
    !candidateDietExcluded(
      { name: 'Coconut Rice Pudding', ingredients: ['rice', 'coconut cream', 'vanilla'] },
      'Vegan', [],
    ),
    'Coconut cream does NOT trigger Vegan exclusion',
  );
  // Dairy milk should still be excluded
  assert(
    candidateDietExcluded(
      { name: 'Milk Pudding', ingredients: ['whole milk', 'cream', 'sugar'] },
      'Vegan', [],
    ),
    'Dairy milk STILL triggers Vegan exclusion (plant milk exception is scoped)',
  );

  // The same check applies when enforced via householdStrictDiets in the pool
  const meals: Meal[] = [
    makeMeal({ id: 60, name: 'Coconut Curry', ingredients: ['coconut milk', 'chickpeas', 'spices'], categoryId: DINNER_CAT_ID }),
    makeMeal({ id: 61, name: 'Oat Porridge', ingredients: ['oats', 'oat milk', 'berries'], categoryId: BREAKFAST_CAT_ID }),
    makeMeal({ id: 62, name: 'Cheese Pasta', ingredients: ['pasta', 'cheddar', 'cream'], categoryId: DINNER_CAT_ID }),
  ];

  const settings: SmartSuggestSettings = {
    ...baseSettings,
    mealsPerDay: 2,
    householdStrictDiets: ['Vegan'],
  };

  const result = await generateSmartSuggestion(meals, noPrefs, settings, new Map(), categoryMap);
  const allNames = new Set(result.entries.map(e => e.candidate.name));

  assert(!allNames.has('Cheese Pasta'),
    'Plant-milk test via pool: cheese pasta (dairy) excluded');
  assert(allNames.has('Coconut Curry') || allNames.has('Oat Porridge'),
    'Plant-milk test via pool: plant milk meals survive Vegan household filter');
}

// ─── Test 8: Tier-4 shell recovery obeys Vegetarian/Vegan household rules ─────

section('Test 8 — Tier-4 shell recovery: Vegetarian and Vegan rules enforced');

{
  // Build a minimal MealMatch fixture with full compatibility score.
  const scoreBreakdown: ScoreBreakdown = {
    compatibility: 1,
    sharedBase: 1,
    swapSimplicity: 1,
    timeFit: 1,
    costFit: 1,
    healthAlignment: 1,
    preferenceConfidence: 1,
  };

  // Shell template that would serve as a "Chicken Stir Fry" dinner
  const chickenShell: Partial<MealTemplate> = {
    id: 1001,
    name: 'Chicken Stir Fry',
    category: 'dinner',
    cuisine: null,
    description: 'A quick weeknight stir fry',
    imageUrl: null,
    sharedBaseComponents: ['rice', 'soy sauce', 'garlic'],
    proteinSlots: ['chicken breast'],
    carbSlots: ['rice'],
    vegSlots: ['broccoli', 'carrots'],
    toppingSlots: [],
    sauceSlots: ['soy sauce'],
    compatibleDiets: [],
  };

  const chickenMatch: MealMatch = {
    template: chickenShell as MealTemplate,
    sharedIngredients: ['rice', 'soy sauce'],
    memberChanges: [],
    swapsNeeded: [],
    extraPrepMinutes: 0,
    fitScore: 90,
    scoreBreakdown,
    explanation: 'Good match',
  };

  // Shell template that is vegan-safe
  const veggieShell: Partial<MealTemplate> = {
    id: 1002,
    name: 'Vegetable Stir Fry',
    category: 'dinner',
    cuisine: null,
    description: 'A plant-based stir fry',
    imageUrl: null,
    sharedBaseComponents: ['rice', 'soy sauce', 'garlic'],
    proteinSlots: ['tofu'],
    carbSlots: ['rice'],
    vegSlots: ['broccoli', 'carrots', 'peppers'],
    toppingSlots: [],
    sauceSlots: ['soy sauce'],
    compatibleDiets: ['vegan'],
  };

  const veggieMatch: MealMatch = {
    template: veggieShell as MealTemplate,
    sharedIngredients: ['rice'],
    memberChanges: [],
    swapsNeeded: [],
    extraPrepMinutes: 0,
    fitScore: 80,
    scoreBreakdown,
    explanation: 'Vegan-safe match',
  };

  // Test 8a: Vegetarian household — chicken shell rejected, veggie shell accepted
  const vegResult = selectShellRecoveryCandidate(
    [chickenMatch, veggieMatch],
    'dinner',
    [],
    null,
    [],
    ['Vegetarian'],
  );

  assert(
    vegResult?.name === 'Vegetable Stir Fry',
    `Tier-4 Vegetarian: chicken shell rejected, veggie shell selected (got: ${vegResult?.name ?? 'null'})`,
  );

  // Test 8b: Vegan household — fish shell blocked too
  const fishShell: Partial<MealTemplate> = {
    id: 1003,
    name: 'Salmon Bowl',
    category: 'dinner',
    cuisine: null,
    description: null,
    imageUrl: null,
    sharedBaseComponents: ['rice'],
    proteinSlots: ['salmon fillet'],
    carbSlots: ['rice'],
    vegSlots: ['cucumber', 'avocado'],
    toppingSlots: [],
    sauceSlots: ['soy sauce'],
    compatibleDiets: [],
  };

  const fishMatch: MealMatch = {
    template: fishShell as MealTemplate,
    sharedIngredients: ['rice'],
    memberChanges: [],
    swapsNeeded: [],
    extraPrepMinutes: 0,
    fitScore: 95,
    scoreBreakdown,
    explanation: 'Fish match',
  };

  const cheeseShell: Partial<MealTemplate> = {
    id: 1004,
    name: 'Cheese Pasta Bake',
    category: 'dinner',
    cuisine: null,
    description: null,
    imageUrl: null,
    sharedBaseComponents: ['pasta'],
    proteinSlots: [],
    carbSlots: ['pasta'],
    vegSlots: ['tomato', 'peppers'],
    toppingSlots: ['cheddar'],
    sauceSlots: ['cream'],
    compatibleDiets: [],
  };

  const cheeseMatch: MealMatch = {
    template: cheeseShell as MealTemplate,
    sharedIngredients: ['pasta'],
    memberChanges: [],
    swapsNeeded: [],
    extraPrepMinutes: 0,
    fitScore: 85,
    scoreBreakdown,
    explanation: 'Cheese match',
  };

  const veganResult = selectShellRecoveryCandidate(
    [fishMatch, cheeseMatch, veggieMatch],
    'dinner',
    [],
    null,
    [],
    ['Vegan'],
  );

  assert(
    veganResult?.name === 'Vegetable Stir Fry',
    `Tier-4 Vegan: fish and cheese shells rejected, veggie shell selected (got: ${veganResult?.name ?? 'null'})`,
  );

  // Test 8c: No householdStrictDiets — chicken shell passes through (existing behaviour preserved)
  const noHsdResult = selectShellRecoveryCandidate(
    [chickenMatch, veggieMatch],
    'dinner',
    [],
    null,
    [],
    undefined,
  );

  assert(
    noHsdResult?.name === 'Chicken Stir Fry',
    `Tier-4 no HSD: highest-scoring shell passes when no household strict diet (got: ${noHsdResult?.name ?? 'null'})`,
  );

  // Test 8d: Request-user Vegetarian pattern (no HSD needed) — chicken still rejected
  const reqUserVegResult = selectShellRecoveryCandidate(
    [chickenMatch, veggieMatch],
    'dinner',
    [],
    'Vegetarian',
    [],
    undefined,
  );

  assert(
    reqUserVegResult?.name === 'Vegetable Stir Fry',
    `Tier-4 request-user Vegetarian: chicken shell rejected via dietPattern (got: ${reqUserVegResult?.name ?? 'null'})`,
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n────────────────────────────────────────────────────────────────');
console.log(`HOUSEHOLD VEGAN/VEGETARIAN HARD ENFORCEMENT: ${passed} passed, ${failed} failed`);
console.log('────────────────────────────────────────────────────────────────');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
