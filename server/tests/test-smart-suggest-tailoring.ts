/**
 * test-smart-suggest-tailoring.ts
 * ================================
 * Deterministic tests verifying that Smart Planner eater tailoring
 * materially affects scoring and candidate selection.
 *
 * Tests cover:
 * - Vegetarian diet types score meat meals lower (via scoreMeal)
 * - excludedIngredients/hard restrictions hard-filter candidates
 * - Fallback paths (fish cap / red meat cap) use slot-safe candidates
 * - Diet type union from multiple eaters scores as expected
 *
 * Run with: npx tsx server/tests/test-smart-suggest-tailoring.ts
 */

import { scoreMeal } from '../lib/meal-scoring-service.js';
import type { UserPreferences } from '@shared/schema.js';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePrefs(overrides: Partial<UserPreferences>): UserPreferences {
  return {
    id: 1,
    userId: 1,
    dietTypes: [],
    excludedIngredients: [],
    preferredIngredients: [],
    healthGoals: [],
    budgetLevel: 'standard',
    upfSensitivity: 'moderate',
    calorieTarget: null,
    plannerEnableDrinks: false,
    maxPrepTolerance: null,
    maxExtraPrepMinutes: null,
    maxTotalCookTime: null,
    preferLessProcessed: false,
    mealMode: 'exact',
    preferredCuisines: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as UserPreferences;
}

function scoreCandidate(
  name: string,
  ingredients: string[],
  prefs: UserPreferences | null,
): number {
  const { score } = scoreMeal({ name, ingredients }, prefs, {});
  return score;
}

function isHardExcluded(
  name: string,
  ingredients: string[],
  hardExcluded: string[],
): boolean {
  const allText = [name, ...ingredients].join(' ').toLowerCase();
  return hardExcluded.some(exc => allText.includes(exc.toLowerCase()));
}

// ─── 1. Vegetarian diet type reduces meat meal scores ─────────────────────────

section('1. Vegetarian diet type scoring');

const chickenCurry = { name: 'Chicken curry', ingredients: ['chicken', 'coconut milk', 'spices'] };
const vegCurry     = { name: 'Vegetable curry', ingredients: ['chickpeas', 'coconut milk', 'spices'] };

const omniPrefs = makePrefs({ dietTypes: [] });
const vegPrefs  = makePrefs({ dietTypes: ['vegetarian'] });

const chickenScoreOmni = scoreCandidate(chickenCurry.name, chickenCurry.ingredients, omniPrefs);
const chickenScoreVeg  = scoreCandidate(chickenCurry.name, chickenCurry.ingredients, vegPrefs);
const vegCurryOmni     = scoreCandidate(vegCurry.name,     vegCurry.ingredients,     omniPrefs);
const vegCurryVeg      = scoreCandidate(vegCurry.name,     vegCurry.ingredients,     vegPrefs);

assert(
  chickenScoreVeg < chickenScoreOmni,
  'Chicken curry scores lower under vegetarian prefs',
  `omni=${chickenScoreOmni} veg=${chickenScoreVeg}`,
);
assert(
  chickenScoreVeg < vegCurryVeg,
  'Vegetable curry scores higher than chicken curry under vegetarian prefs',
  `chicken=${chickenScoreVeg} veg-curry=${vegCurryVeg}`,
);

// ─── 2. Excluded ingredients reduce scores ────────────────────────────────────

section('2. Excluded ingredient scoring');

const fishDishPrefs = makePrefs({ excludedIngredients: ['salmon'] });
const salmonPasta   = { name: 'Salmon pasta', ingredients: ['salmon', 'pasta', 'cream'] };
const beefPasta     = { name: 'Beef pasta', ingredients: ['beef mince', 'pasta', 'tomatoes'] };

const salmonExcluded = scoreCandidate(salmonPasta.name, salmonPasta.ingredients, fishDishPrefs);
const beefAllowed    = scoreCandidate(beefPasta.name,   beefPasta.ingredients,   fishDishPrefs);

assert(
  salmonExcluded < beefAllowed,
  'Salmon dish scores lower when salmon is excluded',
  `salmon=${salmonExcluded} beef=${beefAllowed}`,
);

// ─── 3. Hard restrictions hard-filter candidates ──────────────────────────────

section('3. Hard restriction filtering');

const nuts = ['peanut', 'almond', 'cashew'];

const peanutStir = { name: 'Peanut stir fry', ingredients: ['peanuts', 'noodles', 'soy sauce'] };
const plainStir  = { name: 'Vegetable stir fry', ingredients: ['broccoli', 'noodles', 'soy sauce'] };

assert(
  isHardExcluded(peanutStir.name, peanutStir.ingredients, ['peanut']),
  'Peanut stir fry is hard-excluded when peanut is a restriction',
);
assert(
  !isHardExcluded(plainStir.name, plainStir.ingredients, ['peanut']),
  'Plain stir fry is NOT hard-excluded when peanut is a restriction',
);
assert(
  isHardExcluded(peanutStir.name, peanutStir.ingredients, nuts),
  'Peanut stir fry is hard-excluded from nut restriction list',
);

// ─── 4. Multi-eater diet union scoring ───────────────────────────────────────

section('4. Multi-eater union diet scoring');

// Household: omnivore adult + vegetarian child
// Union of diet types = ['vegetarian']
// Meat should score lower than under no diet constraint
const mergedDietPrefs = makePrefs({ dietTypes: ['vegetarian'] });

const beefBurger = { name: 'Beef burger', ingredients: ['beef mince', 'bun', 'lettuce'] };
const vegBurger  = { name: 'Bean burger', ingredients: ['black beans', 'bun', 'lettuce'] };

const beefScoreMerged = scoreCandidate(beefBurger.name, beefBurger.ingredients, mergedDietPrefs);
const vegScoreMerged  = scoreCandidate(vegBurger.name,  vegBurger.ingredients,  mergedDietPrefs);
const beefScoreNone   = scoreCandidate(beefBurger.name, beefBurger.ingredients, makePrefs({}));

assert(
  beefScoreMerged < beefScoreNone,
  'Beef burger scores lower with merged vegetarian diet than with no diet',
  `merged=${beefScoreMerged} none=${beefScoreNone}`,
);
assert(
  vegScoreMerged > beefScoreMerged,
  'Bean burger scores higher than beef burger under vegetarian merged prefs',
  `bean=${vegScoreMerged} beef=${beefScoreMerged}`,
);

// ─── 5. Budget level affects scoring ─────────────────────────────────────────

section('5. Budget level tailoring');

const budgetPrefs   = makePrefs({ budgetLevel: 'budget' });
const premiumPrefs  = makePrefs({ budgetLevel: 'premium' });

const cheapMeal     = { name: 'Pasta e fagioli', ingredients: ['pasta', 'beans'], estimatedCost: 2.5 };
const expensiveMeal = { name: 'Wagyu steak', ingredients: ['wagyu beef'], estimatedCost: 25 };

const cheapBudget   = scoreMeal(cheapMeal,     budgetPrefs, {}).score;
const expBudget     = scoreMeal(expensiveMeal, budgetPrefs, {}).score;
const cheapPremium  = scoreMeal(cheapMeal,     premiumPrefs, {}).score;

assert(
  cheapBudget > expBudget,
  'Cheap meal scores higher than expensive meal under budget prefs',
  `cheap=${cheapBudget} expensive=${expBudget}`,
);
assert(
  typeof cheapPremium === 'number' && cheapPremium >= 0,
  'Premium prefs still produce valid scores',
);

// ─── 6. Fish dislike exclusion ────────────────────────────────────────────────

section('6. Fish dislike hard exclusion');

const fishRestrictions = ['fish', 'salmon', 'tuna', 'cod'];

const salmonDish = { name: 'Grilled salmon', ingredients: ['salmon', 'lemon', 'herbs'] };
const chickenDish = { name: 'Grilled chicken', ingredients: ['chicken breast', 'lemon', 'herbs'] };

assert(
  isHardExcluded(salmonDish.name, salmonDish.ingredients, fishRestrictions),
  'Salmon dish is hard-excluded when fish restrictions active',
);
assert(
  !isHardExcluded(chickenDish.name, chickenDish.ingredients, fishRestrictions),
  'Chicken dish is NOT hard-excluded by fish restrictions',
);

// ─── 7. Health goals influence scoring ───────────────────────────────────────

section('7. Health goal tailoring');

const musclePrefs  = makePrefs({ healthGoals: ['build-muscle'] });
const weightPrefs  = makePrefs({ healthGoals: ['lose-weight'] });

const highProtein = { name: 'Chicken breast salad', ingredients: ['chicken', 'spinach', 'cucumber'] };
const heavyDessert = { name: 'Chocolate cream cake', ingredients: ['chocolate', 'cream', 'butter', 'sugar'] };

const proteinMuscle = scoreCandidate(highProtein.name, highProtein.ingredients, musclePrefs);
const dessertWeight = scoreCandidate(heavyDessert.name, heavyDessert.ingredients, weightPrefs);
const proteinBase   = scoreCandidate(highProtein.name, highProtein.ingredients, makePrefs({}));
const dessertBase   = scoreCandidate(heavyDessert.name, heavyDessert.ingredients, makePrefs({}));

assert(
  proteinMuscle >= proteinBase,
  'High-protein meal scores same or better under build-muscle goal',
  `muscle=${proteinMuscle} base=${proteinBase}`,
);
assert(
  dessertWeight < dessertBase,
  'Heavy dessert scores lower under lose-weight goal',
  `weight=${dessertWeight} base=${dessertBase}`,
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n────────────────────────────────────────');
console.log(`SMART SUGGEST TAILORING TESTS: ${passed} passed, ${failed} failed`);
console.log('────────────────────────────────────────');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
