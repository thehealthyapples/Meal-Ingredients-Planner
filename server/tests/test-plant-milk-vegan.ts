/**
 * test-plant-milk-vegan.ts
 * ========================
 * Regression tests for the plant-milk false-positive fix in dietRules.
 *
 * Root cause: the standalone keyword "milk" in DAIRY_KEYWORDS matched
 * "almond milk", "oat milk", "soy milk", "coconut milk", and "plant milk"
 * via word-boundary regex, incorrectly excluding vegan/dairy-free recipes
 * that use plant-based milks.
 *
 * Fix: removePlantMilkPhrases() strips compound plant-milk phrases before
 * dairy keyword scanning in the Vegan case and Dairy-Free restriction.
 *
 * Run with: npx tsx server/tests/test-plant-milk-vegan.ts
 */

import { shouldExcludeRecipe } from '../lib/dietRules.js';
import { candidateDietExcluded } from '../lib/smart-suggest-service.js';

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

const vegan = (text: string) =>
  shouldExcludeRecipe(text, { dietPattern: 'Vegan', dietRestrictions: [] });

const dairyFree = (text: string) =>
  shouldExcludeRecipe(text, { dietPattern: null, dietRestrictions: ['Dairy-Free'] });

// ─── Plant milks must NOT trigger Vegan exclusion ─────────────────────────────

section('Plant milks — must pass Vegan filter (were previously false-positive)');

assert(!vegan('almond milk chia seeds vanilla'),
  'Almond milk chia pudding: NOT excluded by Vegan');

assert(!vegan('oat milk overnight oats berries maple'),
  'Oat milk overnight oats: NOT excluded by Vegan');

assert(!vegan('soy milk smoothie frozen banana spinach'),
  'Soy milk smoothie: NOT excluded by Vegan');

assert(!vegan('coconut milk rice porridge'),
  'Coconut milk porridge: NOT excluded by Vegan');

assert(!vegan('plant milk granola bowl mixed berries'),
  'Plant milk granola bowl: NOT excluded by Vegan');

assert(!vegan('cashew milk chia pudding cinnamon'),
  'Cashew milk chia pudding: NOT excluded by Vegan');

assert(!vegan('oat mylk latte espresso'),
  'Oat mylk latte: NOT excluded by Vegan');

// ─── Dairy milks must STILL trigger Vegan exclusion ───────────────────────────

section('Dairy milks — must still fail Vegan filter');

assert(vegan('whole milk porridge'),
  'Whole milk porridge: EXCLUDED by Vegan (dairy milk)');

assert(vegan('skimmed milk banana smoothie'),
  'Skimmed milk smoothie: EXCLUDED by Vegan (dairy milk)');

assert(vegan('semi-skimmed milk oats'),
  'Semi-skimmed milk oats: EXCLUDED by Vegan (dairy milk)');

assert(vegan('cow milk cereal'),
  'Cow milk cereal: EXCLUDED by Vegan (dairy milk)');

assert(vegan('dairy milk hot chocolate'),
  'Dairy milk hot chocolate: EXCLUDED by Vegan (dairy milk)');

// ─── Plant milks must NOT trigger Dairy-Free exclusion ───────────────────────

section('Plant milks — must pass Dairy-Free restriction');

assert(!dairyFree('almond milk smoothie berries'),
  'Almond milk smoothie: NOT excluded by Dairy-Free');

assert(!dairyFree('oat milk overnight oats'),
  'Oat milk overnight oats: NOT excluded by Dairy-Free');

assert(!dairyFree('coconut milk curry vegetables'),
  'Coconut milk curry: NOT excluded by Dairy-Free');

assert(!dairyFree('soy milk matcha latte'),
  'Soy milk matcha: NOT excluded by Dairy-Free');

// ─── Other Vegan exclusions still work after the fix ─────────────────────────

section('Vegan exclusions not affected by plant milk fix');

assert(vegan('prawn curry coconut milk spices'),
  'Prawn curry with coconut milk: EXCLUDED by Vegan (prawns)');

assert(vegan('cheese omelette eggs cheddar'),
  'Cheese omelette: EXCLUDED by Vegan (eggs + cheese)');

assert(vegan('chicken stir-fry oat milk sauce'),
  'Chicken stir-fry with oat milk: EXCLUDED by Vegan (chicken)');

assert(vegan('smoked salmon almond milk scrambled eggs'),
  'Salmon + eggs (with almond milk): EXCLUDED by Vegan (salmon + eggs)');

assert(!vegan('chickpea curry tomato spinach'),
  'Chickpea curry (no plant milk): NOT excluded by Vegan');

assert(!vegan('overnight oats almond milk chia berries'),
  'Overnight oats with almond milk: NOT excluded by Vegan');

// ─── Keto compliance of breakfast concepts (no change expected) ───────────────

section('Keto compliance — breakfast concepts unaffected');

const keto = (name: string, ingredients: string[]) =>
  candidateDietExcluded({ name, ingredients }, 'Keto', []);

assert(!keto('Cheese omelette', ['eggs', 'cheddar', 'butter']),
  'Cheese omelette: NOT excluded by Keto');

assert(!keto('Frittata', ['eggs', 'spinach', 'parmesan', 'olive oil']),
  'Frittata: NOT excluded by Keto');

assert(!keto('Scrambled eggs', ['eggs', 'butter', 'cream']),
  'Scrambled eggs: NOT excluded by Keto');

assert(!keto('Shakshuka', ['eggs', 'tomatoes', 'peppers', 'cumin', 'paprika']),
  'Shakshuka: NOT excluded by Keto');

assert(!keto('Avocado breakfast', ['avocado', 'eggs', 'smoked salmon']),
  'Avocado + eggs + smoked salmon: NOT excluded by Keto');

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n────────────────────────────────────────');
console.log(`PLANT MILK VEGAN TESTS: ${passed} passed, ${failed} failed`);
console.log('────────────────────────────────────────');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
