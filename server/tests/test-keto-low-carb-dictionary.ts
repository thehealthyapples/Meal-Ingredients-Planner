/**
 * test-keto-low-carb-dictionary.ts
 * ==================================
 * Regression tests for the comprehensive Keto / Low-Carb exclusion dictionary.
 *
 * Covers:
 *  Section A — Keto hard exclusions (composite carb ingredients)
 *  Section B — Keto hard exclusions (bakery products)
 *  Section C — Keto hard exclusions (grain products)
 *  Section D — Keto hard exclusions (starchy vegetables)
 *  Section E — Keto hard exclusions (sweetened sauces)
 *  Section F — Keto hard exclusions (legumes)
 *  Section G — Keto still allows core keto-friendly foods
 *  Section H — False-positive guard: cauliflower pizza is NOT excluded
 *  Section I — Low-Carb mirrors Keto exclusions
 *  Section J — Existing Vegan / Vegetarian behaviour is unchanged
 *
 * Run with: npx tsx server/tests/test-keto-low-carb-dictionary.ts
 */

import { shouldExcludeRecipe } from '../../shared/dietRules.js';

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

// Helper: build the same text blob candidateDietExcluded uses
function blob(name: string, ingredients: string[]): string {
  return [name, ...ingredients].join(' ').toLowerCase();
}

function ketoExcludes(name: string, ingredients: string[]): boolean {
  return shouldExcludeRecipe(blob(name, ingredients), { dietPattern: 'Keto', dietRestrictions: [] });
}

function lowCarbExcludes(name: string, ingredients: string[]): boolean {
  return shouldExcludeRecipe(blob(name, ingredients), { dietPattern: 'Low-Carb', dietRestrictions: [] });
}

function ketoAllows(name: string, ingredients: string[]): boolean {
  return !ketoExcludes(name, ingredients);
}

// ─── Section A — Composite dough / pastry ingredients ────────────────────────

section('A — Keto: composite dough and pastry ingredients are excluded');

assert(
  ketoExcludes('Pizza Margherita', ['pizza dough', 'tomato sauce', 'mozzarella', 'basil']),
  'Keto: Pizza with "pizza dough" ingredient is excluded',
);

assert(
  ketoExcludes('Homemade Pizza', ['pizza base', 'mozzarella', 'tomato sauce', 'peppers']),
  'Keto: Pizza with "pizza base" ingredient is excluded',
);

assert(
  ketoExcludes('Cheese Pizza', ['pizza base', 'cheese', 'tomato sauce']),
  'Keto: Cheese pizza with pizza base is excluded (not boosted by cheese)',
);

assert(
  ketoExcludes('Quiche Lorraine', ['shortcrust pastry', 'eggs', 'cream', 'bacon']),
  'Keto: Quiche with shortcrust pastry is excluded',
);

assert(
  ketoExcludes('Apple Pie', ['pie crust', 'apples', 'sugar', 'cinnamon']),
  'Keto: Apple pie with pie crust is excluded',
);

assert(
  ketoExcludes('Filo Parcels', ['filo pastry', 'spinach', 'feta', 'olive oil']),
  'Keto: Filo pastry parcel is excluded',
);

assert(
  ketoExcludes('Phyllo Triangles', ['phyllo pastry', 'cheese', 'herbs']),
  'Keto: Phyllo pastry is excluded',
);

assert(
  ketoExcludes('Croissant Sandwich', ['croissant', 'ham', 'cheese']),
  'Keto: Croissant sandwich is excluded',
);

assert(
  ketoExcludes('Cookie Dough Bites', ['dough', 'chocolate chips', 'butter', 'sugar']),
  'Keto: Generic "dough" ingredient is excluded',
);

// ─── Section B — Bakery products ─────────────────────────────────────────────

section('B — Keto: bakery products are excluded');

assert(
  ketoExcludes('Toast with Eggs', ['bread', 'eggs', 'butter']),
  'Keto: Bread is excluded',
);

assert(
  ketoExcludes('Bagel and Lox', ['bagel', 'smoked salmon', 'cream cheese', 'capers']),
  'Keto: Bagel is excluded',
);

assert(
  ketoExcludes('Blueberry Muffin', ['muffin', 'blueberries', 'flour', 'sugar', 'butter']),
  'Keto: Muffin is excluded',
);

assert(
  ketoExcludes('Pancakes', ['pancake', 'flour', 'egg', 'milk', 'butter']),
  'Keto: Pancake is excluded',
);

assert(
  ketoExcludes('Belgian Waffles', ['waffle', 'flour', 'egg', 'milk', 'sugar']),
  'Keto: Waffle is excluded',
);

assert(
  ketoExcludes('Sourdough Avocado Toast', ['sourdough', 'avocado', 'lemon', 'salt']),
  'Keto: Sourdough is excluded',
);

assert(
  ketoExcludes('Crumpets with Butter', ['crumpet', 'butter', 'honey']),
  'Keto: Crumpet is excluded',
);

assert(
  ketoExcludes('Eggs Benedict', ['english muffin', 'eggs', 'hollandaise sauce', 'ham']),
  'Keto: English muffin is excluded',
);

// ─── Section C — Grain products ──────────────────────────────────────────────

section('C — Keto: grain products are excluded');

assert(
  ketoExcludes('Spaghetti Bolognese', ['pasta', 'beef mince', 'tomato sauce', 'onion']),
  'Keto: Pasta is excluded',
);

assert(
  ketoExcludes('Chicken Fried Rice', ['rice', 'chicken', 'egg', 'soy sauce']),
  'Keto: Rice is excluded',
);

assert(
  ketoExcludes('Oatmeal Porridge', ['oats', 'milk', 'honey', 'fruit']),
  'Keto: Oats are excluded',
);

assert(
  ketoExcludes('Oatmeal Bowl', ['oatmeal', 'banana', 'berries', 'almond milk']),
  'Keto: Oatmeal is excluded',
);

assert(
  ketoExcludes('Quinoa Salad', ['quinoa', 'cucumber', 'tomato', 'feta', 'olive oil']),
  'Keto: Quinoa is excluded',
);

assert(
  ketoExcludes('Polenta with Mushrooms', ['polenta', 'mushrooms', 'parmesan', 'butter']),
  'Keto: Polenta is excluded',
);

assert(
  ketoExcludes('Granola Yogurt Bowl', ['granola', 'yogurt', 'honey', 'berries']),
  'Keto: Granola is excluded',
);

assert(
  ketoExcludes('Muesli Breakfast', ['muesli', 'milk', 'fruit', 'nuts']),
  'Keto: Muesli is excluded',
);

assert(
  ketoExcludes('Couscous Salad', ['couscous', 'roasted vegetables', 'olive oil', 'lemon']),
  'Keto: Couscous is excluded',
);

// ─── Section D — Starchy vegetables ──────────────────────────────────────────

section('D — Keto: starchy vegetables are excluded');

assert(
  ketoExcludes('Mashed Potato', ['potato', 'butter', 'cream', 'chives']),
  'Keto: Potato is excluded',
);

assert(
  ketoExcludes('Roast Potatoes', ['potatoes', 'olive oil', 'rosemary', 'garlic']),
  'Keto: Potatoes (plural) are excluded',
);

assert(
  ketoExcludes('Sweet Potato Soup', ['sweet potato', 'coconut milk', 'ginger', 'garlic']),
  'Keto: Sweet potato is excluded',
);

assert(
  ketoExcludes('Roasted Sweet Potatoes', ['sweet potatoes', 'olive oil', 'cinnamon', 'cumin']),
  'Keto: Sweet potatoes (plural) are excluded',
);

assert(
  ketoExcludes('Yam and Coconut Stew', ['yam', 'coconut milk', 'tomato', 'onion']),
  'Keto: Yam is excluded',
);

assert(
  ketoExcludes('Parsnip Soup', ['parsnip', 'cream', 'apple', 'curry powder']),
  'Keto: Parsnip is excluded',
);

// ─── Section E — Sweetened sauces ────────────────────────────────────────────

section('E — Keto: sweetened sauces are excluded');

assert(
  ketoExcludes('Burger with Ketchup', ['beef patty', 'cheese', 'ketchup', 'lettuce']),
  'Keto: Ketchup is excluded',
);

assert(
  ketoExcludes('BBQ Ribs', ['pork ribs', 'barbecue sauce', 'garlic', 'onion']),
  'Keto: Barbecue sauce is excluded',
);

assert(
  ketoExcludes('BBQ Chicken Wings', ['chicken wings', 'bbq sauce', 'garlic powder']),
  'Keto: BBQ sauce is excluded',
);

assert(
  ketoExcludes('Teriyaki Salmon', ['salmon', 'teriyaki sauce', 'sesame seeds', 'spring onion']),
  'Keto: Teriyaki sauce is excluded',
);

assert(
  ketoExcludes('Hoisin Duck Pancakes', ['duck', 'hoisin sauce', 'cucumber', 'spring onion']),
  'Keto: Hoisin sauce is excluded',
);

assert(
  ketoExcludes('Sweet and Sour Chicken', ['chicken', 'sweet and sour sauce', 'pepper', 'pineapple']),
  'Keto: Sweet and sour sauce is excluded',
);

assert(
  ketoExcludes('Thai Sweet Chilli Prawns', ['prawns', 'sweet chilli sauce', 'garlic', 'lime']),
  'Keto: Sweet chilli sauce is excluded',
);

// ─── Section F — Legumes ─────────────────────────────────────────────────────

section('F — Keto: legumes and beans are excluded');

assert(
  ketoExcludes('Lentil Soup', ['lentils', 'onion', 'garlic', 'cumin', 'vegetable stock']),
  'Keto: Lentils are excluded',
);

assert(
  ketoExcludes('Hummus with Vegetables', ['chickpeas', 'tahini', 'lemon', 'garlic']),
  'Keto: Chickpeas are excluded',
);

assert(
  ketoExcludes('Black Bean Tacos', ['black beans', 'tortilla', 'salsa', 'avocado']),
  'Keto: Black beans are excluded',
);

assert(
  ketoExcludes('Kidney Bean Chilli', ['kidney beans', 'beef mince', 'tomato', 'cumin']),
  'Keto: Kidney beans are excluded',
);

assert(
  ketoExcludes('Red Lentil Dahl', ['red lentils', 'coconut milk', 'tomato', 'ginger']),
  'Keto: Red lentils (via "lentils" match) are excluded',
);

// ─── Section G — Keto allows core keto-friendly foods ────────────────────────

section('G — Keto: core keto-friendly foods are still allowed');

assert(
  ketoAllows('Scrambled Eggs', ['eggs', 'butter', 'cream', 'chives']),
  'Keto: Eggs with butter and cream are allowed',
);

assert(
  ketoAllows('Grilled Chicken Thighs', ['chicken', 'olive oil', 'garlic', 'herbs']),
  'Keto: Chicken is allowed',
);

assert(
  ketoAllows('Beef Stir Fry', ['beef', 'broccoli', 'sesame oil', 'ginger', 'soy sauce']),
  'Keto: Beef is allowed',
);

assert(
  ketoAllows('Pan Seared Salmon', ['salmon', 'butter', 'lemon', 'capers', 'dill']),
  'Keto: Salmon is allowed',
);

assert(
  ketoAllows('Avocado and Bacon Salad', ['avocado', 'bacon', 'eggs', 'spinach']),
  'Keto: Avocado is allowed',
);

assert(
  ketoAllows('Olive Oil Roasted Vegetables', ['courgette', 'olive oil', 'garlic', 'thyme']),
  'Keto: Olive oil is allowed',
);

assert(
  ketoAllows('Roasted Cauliflower', ['cauliflower', 'olive oil', 'cumin', 'paprika']),
  'Keto: Cauliflower is allowed',
);

assert(
  ketoAllows('Wilted Spinach with Garlic', ['spinach', 'garlic', 'olive oil', 'lemon']),
  'Keto: Spinach is allowed',
);

assert(
  ketoAllows('Broccoli Cheese Bake', ['broccoli', 'cheddar', 'cream', 'eggs']),
  'Keto: Broccoli is allowed',
);

assert(
  ketoAllows('Cheese Omelette', ['eggs', 'cheddar', 'butter', 'chives']),
  'Keto: Cheese omelette (no carb ingredients) is allowed',
);

assert(
  ketoAllows('Ribeye Steak with Butter', ['ribeye steak', 'butter', 'garlic', 'thyme']),
  'Keto: Steak is allowed',
);

assert(
  ketoAllows('Bacon and Egg Cups', ['bacon', 'eggs', 'cheddar', 'cream']),
  'Keto: Bacon and eggs are allowed',
);

// ─── Section H — False-positive guard ────────────────────────────────────────

section('H — False-positive guard: cauliflower pizza is NOT excluded');

assert(
  ketoAllows('Cauliflower Pizza', ['cauliflower', 'mozzarella', 'egg', 'tomato sauce', 'basil']),
  'Keto: Cauliflower pizza (no flour/dough ingredient) is NOT excluded',
);

assert(
  ketoAllows('Cauliflower Crust', ['cauliflower', 'parmesan', 'egg', 'salt']),
  'Keto: Cauliflower crust (no dough/flour ingredient or keyword) is NOT excluded',
);

assert(
  ketoAllows('Zoodles with Pesto', ['courgette', 'pesto', 'cherry tomatoes', 'parmesan']),
  'Keto: Zoodles (spiralised courgette, no pasta/grain ingredient) are NOT excluded',
);

// ─── Section I — Low-Carb mirrors Keto exclusions ────────────────────────────

section('I — Low-Carb: same exclusions as Keto');

assert(
  lowCarbExcludes('Pizza Margherita', ['pizza dough', 'tomato sauce', 'mozzarella', 'basil']),
  'Low-Carb: Pizza with "pizza dough" is excluded',
);

assert(
  lowCarbExcludes('Homemade Pizza', ['pizza base', 'mozzarella', 'tomato sauce', 'peppers']),
  'Low-Carb: Pizza with "pizza base" is excluded',
);

assert(
  lowCarbExcludes('Sourdough Toast', ['sourdough', 'avocado', 'lemon', 'chilli flakes']),
  'Low-Carb: Sourdough bread is excluded',
);

assert(
  lowCarbExcludes('Pasta Bolognese', ['pasta', 'beef mince', 'tomato', 'onion', 'herbs']),
  'Low-Carb: Pasta is excluded',
);

assert(
  lowCarbExcludes('Chicken Fried Rice', ['rice', 'chicken', 'egg', 'spring onion']),
  'Low-Carb: Rice is excluded',
);

assert(
  lowCarbExcludes('Mashed Potato', ['potato', 'butter', 'cream', 'chives']),
  'Low-Carb: Potato is excluded',
);

assert(
  lowCarbExcludes('Pancakes', ['pancake', 'flour', 'egg', 'milk', 'butter']),
  'Low-Carb: Pancake is excluded',
);

assert(
  lowCarbExcludes('Teriyaki Chicken', ['chicken', 'teriyaki sauce', 'sesame seeds']),
  'Low-Carb: Teriyaki sauce is excluded',
);

assert(
  lowCarbExcludes('Hummus Wrap', ['chickpeas', 'tahini', 'tortilla', 'salad']),
  'Low-Carb: Chickpeas and tortilla are excluded',
);

assert(
  lowCarbExcludes('Lentil Soup', ['lentils', 'onion', 'garlic', 'cumin', 'vegetable stock']),
  'Low-Carb: Lentils are excluded',
);

assert(
  !lowCarbExcludes('Grilled Salmon', ['salmon', 'olive oil', 'lemon', 'dill', 'capers']),
  'Low-Carb: Grilled salmon is still allowed',
);

assert(
  !lowCarbExcludes('Cauliflower Pizza', ['cauliflower', 'mozzarella', 'egg', 'tomato sauce']),
  'Low-Carb: Cauliflower pizza (no dough/flour) is NOT excluded',
);

// ─── Section J — Vegan / Vegetarian behaviour unchanged ──────────────────────

section('J — Vegan and Vegetarian: existing behaviour unchanged');

// SURF1B4: the Vegan and Vegetarian gates resolve through the canonical restriction
// library, whose plant-based markers ("burger bun", "quorn", "vegan sausage") vouch
// for the ITEM that carries them. They are passed the recipe's fields, exactly as
// every production caller now does — flattening a recipe into one blob first would
// let a burger bun vouch for the beef mince beside it. Keto and Low-Carb are
// keyword-scanned over joined text as they always were, so `blob()` still serves them.
function veganExcludes(name: string, ingredients: string[]): boolean {
  return shouldExcludeRecipe({ name, ingredients }, { dietPattern: 'Vegan', dietRestrictions: [] });
}

function vegExcludes(name: string, ingredients: string[]): boolean {
  return shouldExcludeRecipe({ name, ingredients }, { dietPattern: 'Vegetarian', dietRestrictions: [] });
}

// Vegan exclusions still fire
assert(
  veganExcludes('Chicken Tikka Masala', ['chicken breast', 'yogurt', 'tomatoes', 'cream', 'spices']),
  'Vegan: Chicken tikka masala is still excluded',
);

assert(
  veganExcludes('Scrambled Eggs', ['eggs', 'butter', 'milk', 'salt']),
  'Vegan: Scrambled eggs are still excluded',
);

assert(
  veganExcludes('Beef Burger', ['beef mince', 'burger bun', 'lettuce', 'tomato']),
  'Vegan: Beef burger is still excluded',
);

// Vegan allows
assert(
  !veganExcludes('Lentil Soup', ['red lentils', 'onion', 'garlic', 'cumin', 'vegetable stock']),
  'Vegan: Lentil soup (plant-based) is still allowed',
);

assert(
  !veganExcludes('Tofu Stir Fry', ['tofu', 'broccoli', 'soy sauce', 'sesame oil', 'ginger']),
  'Vegan: Tofu stir fry is still allowed',
);

// Vegetarian exclusions still fire
assert(
  vegExcludes('Salmon Pasta', ['salmon fillet', 'pasta', 'capers', 'lemon', 'olive oil']),
  'Vegetarian: Salmon pasta is still excluded',
);

assert(
  vegExcludes('Chicken Caesar Salad', ['chicken breast', 'romaine lettuce', 'parmesan', 'croutons']),
  'Vegetarian: Chicken Caesar is still excluded',
);

// Vegetarian allows
assert(
  !vegExcludes('Cheese Omelette', ['eggs', 'cheddar', 'butter', 'chives']),
  'Vegetarian: Cheese omelette (no meat/fish) is still allowed',
);

assert(
  !vegExcludes('Mushroom Risotto', ['arborio rice', 'mushrooms', 'white wine', 'butter']),
  'Vegetarian: Mushroom risotto is still allowed',
);

// SURF1B4 — parmesan is made with animal rennet, and the canonical `meat` definition
// has said so since SURF1B2. The Vegetarian pattern used to disagree with the `meat`
// restriction about this, because it had its own meat list. It no longer has one, so
// it no longer disagrees. A vegetarian parmesan is named as such and is permitted.
assert(
  vegExcludes('Mushroom Risotto', ['arborio rice', 'mushrooms', 'parmesan', 'butter']),
  'Vegetarian: parmesan (animal rennet) IS excluded — the canonical position, now applied to the pattern',
);

assert(
  !vegExcludes('Mushroom Risotto', ['arborio rice', 'mushrooms', 'vegetarian parmesan', 'butter']),
  'Vegetarian: vegetarian parmesan is allowed — the escape hatch is on the packet',
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\nSome tests failed — see above for details.');
  process.exit(1);
} else {
  console.log('All tests passed.');
}
