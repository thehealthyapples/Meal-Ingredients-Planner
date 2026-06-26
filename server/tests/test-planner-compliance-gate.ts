/**
 * test-planner-compliance-gate.ts
 * ================================
 * Verifies the single Profile-compliance gate for SYSTEM-generated planner writes
 * (server/lib/planner-compliance.ts::isMealCompliantForUser).
 *
 * The gate delegates entirely to the existing single source of truth
 * (candidateDietExcluded → dietRules.shouldExcludeRecipe, and candidateHardExcluded
 * → canonical restriction resolver). These tests confirm the orchestration: a
 * non-compliant meal is rejected and a compliant meal is allowed, for Profile diet
 * patterns, restrictions, household hard restrictions, and the unrestricted case.
 *
 * Run with: npx tsx server/tests/test-planner-compliance-gate.ts
 */

import {
  isMealCompliantForUser,
  isComplianceActive,
  type PlannerComplianceContext,
  type CompliableMeal,
} from '../lib/planner-compliance.js';
import { shouldExcludeRecipe } from '../../shared/dietRules.js';

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

// Build a context with no category map (meals here use plain text fields).
function ctx(
  dietPattern: string | null,
  dietRestrictions: string[],
  hardExcludedIngredients: string[],
): PlannerComplianceContext {
  return {
    dietPattern,
    dietRestrictions,
    hardExcludedIngredients,
    categoryNameById: new Map(),
  };
}

const meal = (name: string, ingredients: string[], extra?: Partial<CompliableMeal>): CompliableMeal => ({
  name,
  ingredients,
  ...extra,
});

const compliant = (m: CompliableMeal, c: PlannerComplianceContext) =>
  isMealCompliantForUser(m, c).compliant;

// ─── Test 1: Vegan template apply ───────────────────────────────────────────────
section('Test 1 — Vegan profile: animal products skipped, vegan meals applied');
{
  const vegan = ctx('Vegan', [], []);
  assert(!compliant(meal('Beef & Bacon Burger', ['beef mince', 'bacon', 'cheese']), vegan),
    'beef + bacon skipped for Vegan');
  assert(!compliant(meal('Grilled Chicken Salad', ['chicken breast', 'lettuce']), vegan),
    'chicken skipped for Vegan');
  assert(!compliant(meal('Pan-Fried Salmon', ['salmon fillet', 'lemon']), vegan),
    'fish skipped for Vegan');
  assert(!compliant(meal('Prawn Linguine', ['prawns', 'pasta', 'garlic']), vegan),
    'seafood skipped for Vegan');
  assert(!compliant(meal('Cheese Omelette', ['eggs', 'cheddar cheese', 'butter']), vegan),
    'eggs + dairy skipped for Vegan');
  assert(compliant(meal('Lentil & Tomato Soup', ['red lentils', 'chopped tomatoes', 'onion']), vegan),
    'plant meal applied for Vegan');
  // NB: a meal literally named/listing "coconut milk" is excluded by the shared
  // engine (the "milk" keyword) — a pre-existing SSoT keyword behaviour this gate
  // deliberately does not override. Use an unambiguous vegan meal here.
  assert(compliant(meal('Vegetable Stir Fry', ['tofu', 'broccoli', 'carrots', 'soy sauce']), vegan),
    'vegan stir fry applied for Vegan');
}

// ─── Test 2: Vegetarian template apply ──────────────────────────────────────────
section('Test 2 — Vegetarian profile: fish/meat skipped, veg-compatible applied');
{
  const veg = ctx('Vegetarian', [], []);
  assert(!compliant(meal('Cod & Chips', ['cod fillet', 'potatoes']), veg),
    'fish skipped for Vegetarian');
  assert(!compliant(meal('Pork Sausage Casserole', ['pork sausages', 'beans']), veg),
    'pork skipped for Vegetarian');
  assert(!compliant(meal('Beef Lasagne', ['beef mince', 'pasta']), veg),
    'beef skipped for Vegetarian');
  assert(compliant(meal('Cheese Omelette', ['eggs', 'cheddar cheese']), veg),
    'eggs + dairy ALLOWED for Vegetarian');
  assert(compliant(meal('Margherita Pizza', ['mozzarella', 'tomato', 'basil']), veg),
    'vegetarian meal applied');
}

// ─── Test 3: Household hard restriction ─────────────────────────────────────────
section('Test 3 — Household sesame restriction: sesame meals skipped');
{
  const sesame = ctx(null, [], ['sesame']);
  assert(!compliant(meal('Hummus & Tahini Bowl', ['tahini', 'chickpeas', 'lemon']), sesame),
    'tahini (derived from sesame) skipped');
  assert(!compliant(meal('Sesame Noodles', ['sesame oil', 'noodles']), sesame),
    'sesame oil skipped');
  assert(compliant(meal('Tomato Pasta', ['pasta', 'tomato', 'basil']), sesame),
    'sesame-free meal applied');
}

// ─── Test 4: Unrestricted user ──────────────────────────────────────────────────
section('Test 4 — Unrestricted user: behaviour preserved (everything compliant)');
{
  const none = ctx(null, [], []);
  assert(!isComplianceActive(none), 'compliance inactive when no pattern/restrictions');
  assert(compliant(meal('Beef & Bacon Burger', ['beef', 'bacon']), none),
    'beef + bacon allowed for unrestricted user');
  assert(compliant(meal('Pan-Fried Salmon', ['salmon']), none),
    'fish allowed for unrestricted user');
  assert(compliant(meal('Hummus & Tahini Bowl', ['tahini']), none),
    'sesame allowed for unrestricted user (no household restriction)');
}

// ─── Restriction stacking (dietRestrictions independent of pattern) ──────────────
section('Bonus — dietRestrictions (Gluten-Free / Dairy-Free) applied independently');
{
  const gf = ctx(null, ['Gluten-Free'], []);
  assert(!compliant(meal('Spaghetti Bolognese', ['wheat pasta', 'beef']), gf),
    'gluten skipped for Gluten-Free restriction');
  const df = ctx(null, ['Dairy-Free'], []);
  assert(!compliant(meal('Mac & Cheese', ['macaroni', 'cheddar cheese', 'milk']), df),
    'dairy skipped for Dairy-Free restriction');
}

// ─── SSoT consistency — gate agrees with dietRules.shouldExcludeRecipe directly ──
section('Consistency — gate result matches dietRules.shouldExcludeRecipe (single engine)');
{
  const samples: Array<[string, string[]]> = [
    ['Beef & Bacon Burger', ['beef mince', 'bacon']],
    ['Lentil Soup', ['red lentils', 'tomato']],
    ['Pasta Puttanesca', ['anchovy', 'pasta', 'olives']],
    ['Chickpea Curry', ['chickpeas', 'coconut milk']],
  ];
  for (const [name, ingredients] of samples) {
    const text = [name, '', '', ...ingredients].join(' ').toLowerCase();
    const viaGate = !isMealCompliantForUser(meal(name, ingredients), ctx('Vegan', [], [])).compliant;
    const viaEngine = shouldExcludeRecipe(text, { dietPattern: 'Vegan', dietRestrictions: [] });
    assert(viaGate === viaEngine, `gate matches engine for "${name}"`,
      `gate=${viaGate} engine=${viaEngine}`);
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`Planner compliance gate: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(60));
process.exit(failed === 0 ? 0 : 1);
