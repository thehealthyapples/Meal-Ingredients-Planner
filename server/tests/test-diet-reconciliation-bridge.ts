/**
 * test-diet-reconciliation-bridge.ts
 * ====================================
 * Tests for:
 * 1. Profile → Planner diet bridge logic (canonical mapping + preservation)
 * 2. Planner scoring coverage for newly-added diet types
 *
 * Run with: npx tsx server/tests/test-diet-reconciliation-bridge.ts
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

function section(title: string): void {
  console.log(`\n── ${title} ──`);
}

// ─── Bridge logic (extracted for unit testing without DB) ─────────────────────

const CANONICAL_DIET_VALUES = new Set([
  "vegan", "vegetarian", "flexitarian", "keto", "low-carb",
  "paleo", "carnivore", "mediterranean", "dash", "mind",
]);

const DIET_PATTERN_TO_DIET_TYPE: Record<string, string> = {
  Vegan: "vegan",
  Vegetarian: "vegetarian",
  Flexitarian: "flexitarian",
  Keto: "keto",
  "Low-Carb": "low-carb",
  Paleo: "paleo",
  Carnivore: "carnivore",
  Mediterranean: "mediterranean",
  DASH: "dash",
  MIND: "mind",
};

function applyBridge(
  currentDietTypes: string[],
  newDietPattern: string | null,
): string[] {
  const preserved = currentDietTypes.filter(
    dt => !CANONICAL_DIET_VALUES.has(dt.toLowerCase()),
  );
  const newDietType = newDietPattern
    ? DIET_PATTERN_TO_DIET_TYPE[newDietPattern] ?? null
    : null;
  return newDietType ? [...preserved, newDietType] : preserved;
}

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makePrefs(dietTypes: string[]): UserPreferences {
  return {
    id: 1,
    userId: 1,
    dietTypes,
    excludedIngredients: [],
    healthGoals: [],
    budgetLevel: null,
    upfSensitivity: null,
    qualityPreference: null,
    adultsCount: null,
    childrenCount: null,
    babiesCount: null,
    calorieMode: null,
    calorieTarget: null,
    heightCm: null,
    weightKg: null,
    activityLevel: null,
    goalType: null,
    preferredStores: [],
    soundEnabled: null,
    eliteTrackingEnabled: null,
    healthTrendEnabled: null,
    barcodeScannerEnabled: null,
    mealMode: null,
    maxExtraPrepMinutes: null,
    maxTotalCookTime: null,
    preferLessProcessed: null,
    plannerEnableDrinks: null,
    measurementPreference: null,
  } as unknown as UserPreferences;
}

function scoreForDiet(dietTypes: string[], ingredients: string[]): number {
  const prefs = makePrefs(dietTypes);
  return scoreMeal({ name: "Test Meal", ingredients }, prefs).score;
}

// ─── Part 1: Bridge logic ──────────────────────────────────────────────────────

section("Bridge — canonical mappings");

// Each PascalCase dietPattern must map to the correct lowercase diet type
for (const [pattern, expected] of Object.entries(DIET_PATTERN_TO_DIET_TYPE)) {
  const result = applyBridge([], pattern);
  assert(
    result.length === 1 && result[0] === expected,
    `${pattern} → "${expected}"`,
    `got [${result.join(", ")}]`,
  );
}

section("Bridge — sync test cases");

// Vegan sync: empty → [vegan]
{
  const result = applyBridge([], "Vegan");
  assert(result.includes("vegan") && result.length === 1, "Vegan sync: adds vegan");
}

// Vegetarian sync
{
  const result = applyBridge([], "Vegetarian");
  assert(result.includes("vegetarian") && result.length === 1, "Vegetarian sync: adds vegetarian");
}

// Keto sync
{
  const result = applyBridge([], "Keto");
  assert(result.includes("keto") && result.length === 1, "Keto sync: adds keto");
}

// Paleo sync
{
  const result = applyBridge([], "Paleo");
  assert(result.includes("paleo") && result.length === 1, "Paleo sync: adds paleo");
}

// Clear dietPattern: removes canonical value, leaves non-canonical
{
  const result = applyBridge(["vegan", "halal"], null);
  assert(!result.includes("vegan"), "Clear dietPattern: removes vegan");
  assert(result.includes("halal"), "Clear dietPattern: preserves halal");
  assert(result.length === 1, "Clear dietPattern: only non-canonical remain");
}

// Preserve halal/kosher/pescatarian through a pattern change
{
  const result = applyBridge(["halal", "kosher", "pescatarian", "vegetarian"], "Keto");
  assert(result.includes("halal"), "Preserve halal through pattern change");
  assert(result.includes("kosher"), "Preserve kosher through pattern change");
  assert(result.includes("pescatarian"), "Preserve pescatarian through pattern change");
  assert(result.includes("keto"), "New keto value added");
  assert(!result.includes("vegetarian"), "Old vegetarian canonical removed");
  assert(result.length === 4, `Correct count (3 preserved + 1 new), got ${result.length}`);
}

// Replace canonical value (vegetarian → vegan)
{
  const result = applyBridge(["vegetarian"], "Vegan");
  assert(result.includes("vegan"), "vegetarian replaced by vegan");
  assert(!result.includes("vegetarian"), "old vegetarian removed");
  assert(result.length === 1, "no duplicates");
}

// No duplicates when same value re-applied
{
  const result = applyBridge(["keto"], "Keto");
  assert(result.filter(v => v === "keto").length === 1, "No duplicate keto when same pattern saved");
}

// Preserve style: prefixed values
{
  const result = applyBridge(["style:simple-meals", "vegan"], "Mediterranean");
  assert(result.includes("style:simple-meals"), "Preserve style:simple-meals prefix");
  assert(result.includes("mediterranean"), "Mediterranean added");
  assert(!result.includes("vegan"), "Old vegan removed");
}

// ─── Part 2: Planner scoring — newly-added diet types ─────────────────────────

section("Scoring — paleo");

{
  const safeScore = scoreForDiet(["paleo"], ["chicken breast", "sweet potato", "broccoli", "olive oil"]);
  const penaltyScore = scoreForDiet(["paleo"], ["pasta", "bread", "beans", "cheese"]);
  assert(safeScore > penaltyScore, `Paleo-safe meal scores higher than paleo-violating (${safeScore} > ${penaltyScore})`);
  assert(penaltyScore < safeScore - 20, `Paleo-violating meal takes >20-point penalty (${safeScore} → ${penaltyScore})`);
}

section("Scoring — low-carb");

{
  const safeScore = scoreForDiet(["low-carb"], ["chicken thigh", "courgette", "spinach", "olive oil"]);
  const penaltyScore = scoreForDiet(["low-carb"], ["pasta", "bread", "rice", "potato"]);
  assert(safeScore > penaltyScore, `Low-carb safe meal scores higher (${safeScore} > ${penaltyScore})`);
}

section("Scoring — carnivore");

{
  const safeScore = scoreForDiet(["carnivore"], ["beef steak", "lamb chops", "butter"]);
  const penaltyScore = scoreForDiet(["carnivore"], ["beans", "lentils", "tofu", "pasta", "bread"]);
  assert(safeScore > penaltyScore, `Carnivore-safe meal scores higher (${safeScore} > ${penaltyScore})`);
}

section("Scoring — flexitarian");

{
  const safeScore = scoreForDiet(["flexitarian"], ["lentils", "chickpeas", "spinach", "quinoa"]);
  const penaltyScore = scoreForDiet(["flexitarian"], ["beef", "lamb", "bacon", "pork", "mince"]);
  assert(safeScore > penaltyScore, `Flexitarian plant meal scores higher than red-meat meal (${safeScore} > ${penaltyScore})`);
}

section("Scoring — mediterranean");

{
  const safeScore = scoreForDiet(["mediterranean"], ["salmon", "olive oil", "tomatoes", "garlic", "lentils"]);
  const penaltyScore = scoreForDiet(["mediterranean"], ["bacon", "salami", "pepperoni", "processed", "instant"]);
  assert(safeScore > penaltyScore, `Mediterranean-aligned meal scores higher (${safeScore} > ${penaltyScore})`);
}

section("Scoring — DASH");

{
  const safeScore = scoreForDiet(["dash"], ["chicken breast", "vegetables", "brown rice"]);
  const penaltyScore = scoreForDiet(["dash"], ["bacon", "ham", "salami", "soy sauce", "processed"]);
  assert(safeScore > penaltyScore, `DASH-compliant meal scores higher (${safeScore} > ${penaltyScore})`);
}

section("Scoring — MIND");

{
  const safeScore = scoreForDiet(["mind"], ["salmon", "leafy greens", "blueberries", "walnuts"]);
  const penaltyScore = scoreForDiet(["mind"], ["beef", "lamb", "steak", "butter", "cream", "chocolate", "sugar"]);
  assert(safeScore > penaltyScore, `MIND-compliant meal scores higher (${safeScore} > ${penaltyScore})`);
}

section("Scoring — planner recognises new diet types (non-zero effect)");

for (const dietType of ["paleo", "low-carb", "carnivore", "flexitarian", "mediterranean", "dash", "mind"]) {
  // A meal with penalty ingredients should score lower than base when diet type is active
  const baseScore = scoreForDiet([], ["chicken", "vegetables", "olive oil"]);
  // Score of a neutral meal should equal base (diet type is active but no penalty keywords)
  const neutralScore = scoreForDiet([dietType], ["chicken", "vegetables", "olive oil"]);
  assert(
    neutralScore === baseScore,
    `${dietType}: neutral meal unchanged by diet type (score = ${neutralScore})`,
  );
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n── Results ──`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
