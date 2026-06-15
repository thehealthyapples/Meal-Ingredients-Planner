/**
 * test-tier4-shell-recovery-activation.ts
 * ========================================
 * Verifies that Tier-4 shell recovery uses primarySlot / suitableSlots for slot
 * eligibility and applies the A/B/C/D tie-breaking rules when selecting among
 * multiple eligible shells.
 *
 * Tests map to the 8 verification scenarios in TIER4_SHELL_RECOVERY_ACTIVATION.md:
 *   1. Full recipe pool → Tier-4 never triggered (verified via generateSmartSuggestion settings)
 *   2. Missing dinner → dinner shell selected
 *   3. Missing lunch → lunch shell selected
 *   4. Missing breakfast → breakfast shell selected
 *   5. suitableSlots cross-slot eligibility (breakfast shell fills dinner when curated so)
 *   6. Vegetarian household never receives non-compatible shell
 *   7. Existing planner behaviour unchanged (category-only templates still work)
 *   8. Recipes preferred over shells when recipes exist
 *
 * Run with: npx tsx server/tests/test-tier4-shell-recovery-activation.ts
 */

import { selectShellRecoveryCandidate, generateSmartSuggestion, type SmartSuggestSettings } from '../lib/smart-suggest-service.js';
import type { MealMatch, ScoreBreakdown } from '../lib/household-meal-matcher.js';
import type { MealTemplate, Meal, UserPreferences } from '@shared/schema.js';

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

// ─── Fixture helpers ──────────────────────────────────────────────────────────

const FULL_SCORE: ScoreBreakdown = {
  compatibility: 1,
  sharedBase: 1,
  swapSimplicity: 1,
  timeFit: 1,
  costFit: 1,
  healthAlignment: 1,
  preferenceConfidence: 1,
};

function makeShell(overrides: Partial<MealTemplate> & { id: number; name: string }): MealTemplate {
  return {
    defaultCalories: null,
    defaultProtein: null,
    defaultCarbs: null,
    defaultFat: null,
    imageUrl: null,
    title: null,
    description: null,
    category: null,
    cuisine: null,
    sharedBaseComponents: ["shared base"],
    proteinSlots: ["protein option"],
    carbSlots: ["carb option"],
    vegSlots: ["veg option"],
    toppingSlots: [],
    sauceSlots: [],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    estimatedTotalTime: 30,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
    primarySlot: null,
    suitableSlots: [],
    energyBand: null,
    styleTags: [],
    nutritionOpportunities: [],
    ...overrides,
  } as MealTemplate;
}

function makeMatch(template: MealTemplate, fitScore = 80): MealMatch {
  return {
    template,
    sharedIngredients: template.sharedBaseComponents ?? [],
    memberChanges: [],
    swapsNeeded: [],
    extraPrepMinutes: 0,
    fitScore,
    scoreBreakdown: FULL_SCORE,
    explanation: 'Test match',
  };
}

function makeMeal(overrides: Partial<Meal> & { id: number; name: string; categoryId?: number }): Meal {
  return {
    userId: 1,
    ingredients: ['ingredient a', 'ingredient b'],
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
    primarySlot: null,
    suitableSlots: [],
    energyBand: null,
    styleTags: [],
    ...overrides,
  } as Meal;
}

const BREAKFAST_CAT = 1;
const LUNCH_CAT = 2;
const DINNER_CAT = 3;

const categoryMap = new Map([
  [BREAKFAST_CAT, 'breakfast'],
  [LUNCH_CAT, 'lunch'],
  [DINNER_CAT, 'dinner'],
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

// ─── Section 1: primarySlot-based slot eligibility ────────────────────────────

section('1. primarySlot: shell eligible for its primarySlot only when suitableSlots is empty');

{
  const breakfastShell = makeShell({
    id: 100,
    name: 'Morning Bowl',
    category: 'breakfast',
    primarySlot: 'breakfast',
    suitableSlots: [],
    energyBand: 'light',
    styleTags: ['fresh'],
  });

  const result = selectShellRecoveryCandidate([makeMatch(breakfastShell)], 'breakfast', [], null, []);
  assert(result?.name === 'Morning Bowl',
    'primarySlot=breakfast is eligible for breakfast slot');

  const dinnerResult = selectShellRecoveryCandidate([makeMatch(breakfastShell)], 'dinner', [], null, []);
  assert(dinnerResult === null,
    'primarySlot=breakfast NOT eligible for dinner (suitableSlots=[])');

  const lunchResult = selectShellRecoveryCandidate([makeMatch(breakfastShell)], 'lunch', [], null, []);
  assert(lunchResult === null,
    'primarySlot=breakfast NOT eligible for lunch (suitableSlots=[])');
}

// ─── Section 2: suitableSlots extends eligibility ────────────────────────────

section('2. suitableSlots: cross-slot eligibility when suitableSlots includes target');

{
  const soupShell = makeShell({
    id: 200,
    name: 'Soup & Side',
    category: 'lunch',
    primarySlot: 'lunch',
    suitableSlots: ['lunch', 'dinner'],
    energyBand: 'medium',
    styleTags: ['comfort', 'one-pot'],
  });

  const lunchResult = selectShellRecoveryCandidate([makeMatch(soupShell)], 'lunch', [], null, []);
  assert(lunchResult?.name === 'Soup & Side',
    'Soup & Side eligible for lunch (primarySlot=lunch)');

  const dinnerResult = selectShellRecoveryCandidate([makeMatch(soupShell)], 'dinner', [], null, []);
  assert(dinnerResult?.name === 'Soup & Side',
    'Soup & Side eligible for dinner (suitableSlots includes dinner)');

  const breakfastResult = selectShellRecoveryCandidate([makeMatch(soupShell)], 'breakfast', [], null, []);
  assert(breakfastResult === null,
    'Soup & Side NOT eligible for breakfast (not in primarySlot or suitableSlots)');
}

// ─── Section 3: Scenario 5 — suitableSlots cross-slot example ────────────────

section('3. Scenario 5 — "Cooked Breakfast"-style shell with suitableSlots=[breakfast,lunch,dinner]');

{
  const crossSlotShell = makeShell({
    id: 300,
    name: 'Full English Style',
    category: 'breakfast',
    primarySlot: 'breakfast',
    suitableSlots: ['breakfast', 'lunch', 'dinner'],
    energyBand: 'hearty',
    styleTags: ['comfort', 'shared-meal'],
  });

  const dinnerResult = selectShellRecoveryCandidate([makeMatch(crossSlotShell)], 'dinner', [], null, []);
  assert(dinnerResult?.name === 'Full English Style',
    'Breakfast-primary shell eligible for dinner when suitableSlots includes dinner');

  const lunchResult = selectShellRecoveryCandidate([makeMatch(crossSlotShell)], 'lunch', [], null, []);
  assert(lunchResult?.name === 'Full English Style',
    'Breakfast-primary shell eligible for lunch when suitableSlots includes lunch');
}

// ─── Section 4: Tie-breaking A — primarySlot exact match preferred ────────────

section('4. Tie-breaking A: primarySlot exact match preferred over suitableSlots-only');

{
  const suitableOnlyDinner = makeShell({
    id: 401,
    name: 'Lunch Shell That Suits Dinner',
    category: 'lunch',
    primarySlot: 'lunch',
    suitableSlots: ['lunch', 'dinner'],
    energyBand: 'medium',
    styleTags: ['comfort', 'shared-meal', 'one-pot'],
  });

  const primaryDinner = makeShell({
    id: 402,
    name: 'Dinner Primary Shell',
    category: 'dinner',
    primarySlot: 'dinner',
    suitableSlots: ['dinner'],
    energyBand: 'hearty',
    styleTags: ['comfort'],
  });

  // suitableOnly comes first (higher fitScore), but primaryDinner should win on tie-breaking A
  const matches: MealMatch[] = [
    makeMatch(suitableOnlyDinner, 90),
    makeMatch(primaryDinner, 80),
  ];

  const result = selectShellRecoveryCandidate(matches, 'dinner', [], null, []);
  assert(result?.name === 'Dinner Primary Shell',
    `Tie-breaking A: primarySlot=dinner preferred over suitableSlots-only (got: ${result?.name ?? 'null'})`);
}

// ─── Section 5: Tie-breaking B — energyBand preference ───────────────────────

section('5. Tie-breaking B: energyBand preference per slot');

{
  const heartyDinner = makeShell({
    id: 501,
    name: 'Hearty Dinner',
    category: 'dinner',
    primarySlot: 'dinner',
    suitableSlots: ['dinner'],
    energyBand: 'hearty',
    styleTags: ['comfort'],
  });

  const lightDinner = makeShell({
    id: 502,
    name: 'Light Dinner',
    category: 'dinner',
    primarySlot: 'dinner',
    suitableSlots: ['dinner'],
    energyBand: 'light',
    styleTags: ['fresh'],
  });

  // Both are primary=dinner. For dinner slot, hearty is preferred (SLOT_ENERGY_PREFERENCE).
  // lightDinner comes first in the array (higher fitScore) but hearty should win.
  const matches: MealMatch[] = [
    makeMatch(lightDinner, 90),
    makeMatch(heartyDinner, 80),
  ];

  const result = selectShellRecoveryCandidate(matches, 'dinner', [], null, []);
  assert(result?.name === 'Hearty Dinner',
    `Tie-breaking B: hearty preferred for dinner over light (got: ${result?.name ?? 'null'})`);

  // For breakfast: light preferred over hearty
  const breakfastHearty = makeShell({
    id: 503,
    name: 'Hearty Breakfast',
    category: 'breakfast',
    primarySlot: 'breakfast',
    suitableSlots: ['breakfast'],
    energyBand: 'hearty',
    styleTags: ['comfort'],
  });

  const breakfastLight = makeShell({
    id: 504,
    name: 'Light Breakfast',
    category: 'breakfast',
    primarySlot: 'breakfast',
    suitableSlots: ['breakfast'],
    energyBand: 'light',
    styleTags: ['fresh'],
  });

  const bMatches: MealMatch[] = [
    makeMatch(breakfastHearty, 90),
    makeMatch(breakfastLight, 80),
  ];

  const bResult = selectShellRecoveryCandidate(bMatches, 'breakfast', [], null, []);
  assert(bResult?.name === 'Light Breakfast',
    `Tie-breaking B: light preferred for breakfast over hearty (got: ${bResult?.name ?? 'null'})`);
}

// ─── Section 6: Tie-breaking C — more styleTags preferred ────────────────────

section('6. Tie-breaking C: more styleTags preferred when A and B are equal');

{
  const fewTags = makeShell({
    id: 601,
    name: 'Few Tags Shell',
    category: 'dinner',
    primarySlot: 'dinner',
    suitableSlots: ['dinner'],
    energyBand: 'hearty',
    styleTags: ['comfort'],
  });

  const moreTags = makeShell({
    id: 602,
    name: 'More Tags Shell',
    category: 'dinner',
    primarySlot: 'dinner',
    suitableSlots: ['dinner'],
    energyBand: 'hearty',
    styleTags: ['comfort', 'shared-meal', 'family-pleaser', 'one-pot'],
  });

  // fewTags comes first (higher fitScore), moreTags should win on C
  const matches: MealMatch[] = [
    makeMatch(fewTags, 95),
    makeMatch(moreTags, 80),
  ];

  const result = selectShellRecoveryCandidate(matches, 'dinner', [], null, []);
  assert(result?.name === 'More Tags Shell',
    `Tie-breaking C: more styleTags wins over fewer (got: ${result?.name ?? 'null'})`);
}

// ─── Section 7: Scenario 6 — Vegetarian household compliance ──────────────────

section('7. Scenario 6: Vegetarian household never receives non-compatible shell');

{
  const chickenShell = makeShell({
    id: 700,
    name: 'Chicken Curry Night',
    category: 'dinner',
    primarySlot: 'dinner',
    suitableSlots: ['dinner'],
    energyBand: 'hearty',
    styleTags: ['comfort', 'one-pot'],
    proteinSlots: ['chicken breast'],
    compatibleDiets: [],
  });

  const vegShell = makeShell({
    id: 701,
    name: 'Veggie Curry Night',
    category: 'dinner',
    primarySlot: 'dinner',
    suitableSlots: ['dinner'],
    energyBand: 'hearty',
    styleTags: ['comfort', 'one-pot', 'adaptable'],
    proteinSlots: ['tofu', 'chickpeas'],
    compatibleDiets: ['Vegetarian', 'Vegan'],
  });

  const result = selectShellRecoveryCandidate(
    [makeMatch(chickenShell, 90), makeMatch(vegShell, 80)],
    'dinner',
    [],
    null,
    [],
    ['Vegetarian'],
  );

  assert(result?.name === 'Veggie Curry Night',
    `Vegetarian household: chicken shell rejected, veg shell selected (got: ${result?.name ?? 'null'})`);
}

// ─── Section 8: Vegan household compliance ────────────────────────────────────

section('8. Vegan household: egg/dairy shells rejected');

{
  const eggShell = makeShell({
    id: 800,
    name: 'Egg Breakfast Bake',
    category: 'breakfast',
    primarySlot: 'breakfast',
    suitableSlots: ['breakfast'],
    energyBand: 'hearty',
    styleTags: ['comfort', 'one-pot', 'shared-meal'],
    proteinSlots: ['eggs'],
    compatibleDiets: ['Vegetarian'],
  });

  const veganBreakfast = makeShell({
    id: 801,
    name: 'Vegan Smoothie Bowl',
    category: 'breakfast',
    primarySlot: 'breakfast',
    suitableSlots: ['breakfast'],
    energyBand: 'light',
    styleTags: ['fresh', 'quick'],
    proteinSlots: ['plant protein'],
    compatibleDiets: ['Vegan', 'Vegetarian', 'Dairy-Free'],
  });

  const result = selectShellRecoveryCandidate(
    [makeMatch(eggShell, 90), makeMatch(veganBreakfast, 80)],
    'breakfast',
    [],
    null,
    [],
    ['Vegan'],
  );

  assert(result?.name === 'Vegan Smoothie Bowl',
    `Vegan household: egg shell rejected, plant-based shell selected (got: ${result?.name ?? 'null'})`);
}

// ─── Section 9: Scenario 7 — category fallback for legacy templates ───────────

section('9. Scenario 7: legacy templates (no primarySlot/suitableSlots) use category fallback');

{
  const legacyDinner = makeShell({
    id: 900,
    name: 'Legacy Curry Shell',
    category: 'dinner',
    // No primarySlot, no suitableSlots — should fall back to SLOT_CATEGORY_MAPPING
    primarySlot: null,
    suitableSlots: [],
    energyBand: null,
    styleTags: [],
  });

  const dinnerResult = selectShellRecoveryCandidate([makeMatch(legacyDinner)], 'dinner', [], null, []);
  assert(dinnerResult?.name === 'Legacy Curry Shell',
    'Legacy template with category=dinner still eligible for dinner slot via category fallback');

  const breakfastResult = selectShellRecoveryCandidate([makeMatch(legacyDinner)], 'breakfast', [], null, []);
  assert(breakfastResult === null,
    'Legacy template with category=dinner NOT eligible for breakfast slot');

  // Verify category=main also maps to dinner (SLOT_CATEGORY_MAPPING covers "main")
  const legacyMain = makeShell({
    id: 901,
    name: 'Legacy Main Shell',
    category: 'main',
    primarySlot: null,
    suitableSlots: [],
  });

  const mainResult = selectShellRecoveryCandidate([makeMatch(legacyMain)], 'dinner', [], null, []);
  assert(mainResult?.name === 'Legacy Main Shell',
    'Legacy template with category=main eligible for dinner slot via category fallback');
}

// ─── Section 10: Scenario 3 — lunch shells selected for lunch slot ─────────────

section('10. Scenario 3: lunch slot selects appropriate lunch shells');

{
  const soupSide = makeShell({
    id: 1000,
    name: 'Soup & Side',
    category: 'lunch',
    primarySlot: 'lunch',
    suitableSlots: ['lunch', 'dinner'],
    energyBand: 'medium',
    styleTags: ['comfort', 'one-pot', 'shared-meal'],
  });

  const grainBowl = makeShell({
    id: 1001,
    name: 'Grain Bowl',
    category: 'lunch',
    primarySlot: 'lunch',
    suitableSlots: ['lunch', 'dinner'],
    energyBand: 'medium',
    styleTags: ['fresh', 'adaptable'],
  });

  const wrapBar = makeShell({
    id: 1002,
    name: 'Wrap Bar',
    category: 'lunch',
    primarySlot: 'lunch',
    suitableSlots: ['lunch'],
    energyBand: 'medium',
    styleTags: ['bar', 'buffet', 'quick', 'family-pleaser'],
  });

  const matches: MealMatch[] = [
    makeMatch(soupSide, 90),
    makeMatch(grainBowl, 85),
    makeMatch(wrapBar, 80),
  ];

  const result = selectShellRecoveryCandidate(matches, 'lunch', [], null, []);
  assert(
    result !== null,
    'Lunch slot: at least one shell selected',
  );
  assert(
    ['Soup & Side', 'Grain Bowl', 'Wrap Bar'].includes(result?.name ?? ''),
    `Lunch slot: selected a lunch-appropriate shell (got: ${result?.name ?? 'null'})`,
  );
}

// ─── Section 11: Scenario 4 — breakfast shells selected for breakfast slot ─────

section('11. Scenario 4: breakfast slot selects appropriate breakfast shells');

{
  const cookedBreakfast = makeShell({
    id: 1100,
    name: 'Cooked Breakfast',
    category: 'breakfast',
    primarySlot: 'breakfast',
    suitableSlots: ['breakfast'],
    energyBand: 'hearty',
    styleTags: ['shared-meal', 'comfort', 'family-pleaser'],
  });

  const smoothieBowl = makeShell({
    id: 1101,
    name: 'Smoothie Bowl',
    category: 'breakfast',
    primarySlot: 'breakfast',
    suitableSlots: ['breakfast', 'snack'],
    energyBand: 'light',
    styleTags: ['fresh', 'quick'],
  });

  const overnightOats = makeShell({
    id: 1102,
    name: 'Overnight Oats',
    category: 'breakfast',
    primarySlot: 'breakfast',
    suitableSlots: ['breakfast', 'snack'],
    energyBand: 'light',
    styleTags: ['quick', 'fresh'],
  });

  const matches: MealMatch[] = [
    makeMatch(cookedBreakfast, 80),
    makeMatch(smoothieBowl, 85),
    makeMatch(overnightOats, 90),
  ];

  const result = selectShellRecoveryCandidate(matches, 'breakfast', [], null, []);
  assert(
    result !== null,
    'Breakfast slot: at least one shell selected',
  );
  assert(
    ['Cooked Breakfast', 'Smoothie Bowl', 'Overnight Oats'].includes(result?.name ?? ''),
    `Breakfast slot: selected a breakfast-appropriate shell (got: ${result?.name ?? 'null'})`,
  );
  // For breakfast, light energyBand is preferred — Smoothie Bowl or Overnight Oats
  // should be selected over Cooked Breakfast (hearty) by tie-breaking B
  assert(
    result?.name !== 'Cooked Breakfast',
    `Breakfast tie-breaking B: hearty shell not preferred for breakfast (got: ${result?.name ?? 'null'})`,
  );
}

// ─── Section 12: Scenario 8 — recipes preferred, Tier-4 only for empty slots ──

section('12. Scenario 8: Tier-4 not triggered when userId absent (test harness path)');

{
  // generateSmartSuggestion only invokes Tier-4 when userId is present AND slot is
  // genuinely exhausted. When no userId, getShellMatches returns [] immediately.
  // We verify this by confirming the shell-id prefix ("shell-") never appears in
  // a plan generated without userId, even when the recipe pool is tiny.
  const meals: Meal[] = [
    makeMeal({ id: 1, name: 'Pasta Bake', ingredients: ['pasta', 'tomato', 'cheese'], categoryId: DINNER_CAT }),
    makeMeal({ id: 2, name: 'Chicken Stir Fry', ingredients: ['chicken', 'veg', 'soy sauce'], categoryId: DINNER_CAT }),
  ];

  const result = await generateSmartSuggestion(
    meals, noPrefs, { ...baseSettings, mealsPerDay: 1 }, new Map(), categoryMap
  );

  const shellEntries = result.entries.filter(e => String(e.candidate.id).startsWith('shell-'));
  assert(shellEntries.length === 0,
    `No userId → Tier-4 never triggered (shell entries: ${shellEntries.length})`);
}

// ─── Section 13: no-op when matches empty ─────────────────────────────────────

section('13. Empty matches list → null (graceful degradation)');

{
  const result = selectShellRecoveryCandidate([], 'dinner', [], null, []);
  assert(result === null, 'Empty matches returns null (no crash)');
}

// ─── Section 14: compatibility gate — partial compatibility rejected ────────────

section('14. Compatibility gate: shell with partial compatibility rejected');

{
  const partialMatch = makeShell({
    id: 1400,
    name: 'Partial Compat Shell',
    category: 'dinner',
    primarySlot: 'dinner',
    suitableSlots: ['dinner'],
  });

  const partialMatchObj: MealMatch = {
    ...makeMatch(partialMatch),
    scoreBreakdown: { ...FULL_SCORE, compatibility: 0.5 },
  };

  const result = selectShellRecoveryCandidate([partialMatchObj], 'dinner', [], null, []);
  assert(result === null,
    'Shell with compatibility < 1 rejected (diet conflicts present)');
}

// ─── Section 15: hard exclusion gate ──────────────────────────────────────────

section('15. Hard exclusion gate: shell ingredient in exclusion list rejected');

{
  // Shell whose ONLY ingredients are peanut-derived — after filtering, compliantIngredients
  // will be empty, causing the shell to be rejected entirely.
  const nutShell = makeShell({
    id: 1500,
    name: 'Nut Heavy Shell',
    category: 'dinner',
    primarySlot: 'dinner',
    suitableSlots: ['dinner'],
    proteinSlots: ['peanuts', 'peanut butter'],
    sharedBaseComponents: ['peanut sauce base'],
    carbSlots: [],
    vegSlots: [],
    toppingSlots: [],
    sauceSlots: [],
  });

  const safeShell = makeShell({
    id: 1501,
    name: 'Nut-Free Shell',
    category: 'dinner',
    primarySlot: 'dinner',
    suitableSlots: ['dinner'],
    proteinSlots: ['chicken', 'beans'],
    sharedBaseComponents: ['tomato sauce'],
  });

  const result = selectShellRecoveryCandidate(
    [makeMatch(nutShell, 95), makeMatch(safeShell, 80)],
    'dinner',
    ['peanut'],
    null,
    [],
  );

  assert(result?.name === 'Nut-Free Shell',
    `Hard exclusion: peanut shell rejected, nut-free shell selected (got: ${result?.name ?? 'null'})`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n────────────────────────────────────────────────────────────────────');
console.log(`TIER-4 SHELL RECOVERY ACTIVATION: ${passed} passed, ${failed} failed`);
console.log('────────────────────────────────────────────────────────────────────');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
