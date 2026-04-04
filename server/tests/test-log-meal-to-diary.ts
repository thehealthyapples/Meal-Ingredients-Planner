/**
 * logMealToDiary — unit tests for entry-name building logic
 *
 * Tests the pure name-building behaviour that lives inside logMealToDiary:
 *   1. Meal with structured items  → one entry per item, order preserved
 *   2. Legacy meal with no items   → single entry using meal name
 *   3. Meal with duplicate items   → separate entries (intentional: two portions)
 *   4. Items with quantities       → quantity appended as "(qty)"
 *
 * Run with:  npx tsx server/tests/test-log-meal-to-diary.ts
 */

// ---------------------------------------------------------------------------
// Inline the pure name-building function (mirrors logMealToDiary in storage.ts)
// so tests have no DB dependency.
// ---------------------------------------------------------------------------

interface MockItem {
  id: number;
  name: string;
  quantity: string | null;
}

function buildEntryNames(items: MockItem[], mealName: string): string[] {
  if (items.length === 0) return [mealName];
  return items.map(i => i.quantity ? `${i.name} (${i.quantity})` : i.name);
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function expect<T>(label: string, actual: T, expected: T): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    console.error(`       expected: ${JSON.stringify(expected)}`);
    console.error(`       got:      ${JSON.stringify(actual)}`);
    failed++;
  }
}

function section(title: string): void {
  console.log(`\n── ${title} ──`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

section("Meal with structured items");

expect(
  "returns one entry per item in insertion order",
  buildEntryNames(
    [
      { id: 1, name: "Chicken breast", quantity: null },
      { id: 2, name: "Brown rice", quantity: null },
      { id: 3, name: "Broccoli", quantity: null },
    ],
    "Chicken rice bowl"
  ),
  ["Chicken breast", "Brown rice", "Broccoli"]
);

expect(
  "preserves insertion order (id ascending)",
  buildEntryNames(
    [
      { id: 10, name: "Apple", quantity: null },
      { id: 11, name: "Yoghurt", quantity: null },
    ],
    "Snack plate"
  ),
  ["Apple", "Yoghurt"]
);

section("Legacy meal with no items");

expect(
  "falls back to meal name when items array is empty",
  buildEntryNames([], "Spaghetti bolognese"),
  ["Spaghetti bolognese"]
);

expect(
  "single-entry result for legacy meal",
  buildEntryNames([], "Overnight oats").length,
  1
);

section("Meal with duplicate items");

expect(
  "duplicate item names produce separate entries (two portions)",
  buildEntryNames(
    [
      { id: 1, name: "Boiled egg", quantity: null },
      { id: 2, name: "Boiled egg", quantity: null },
    ],
    "Egg meal"
  ),
  ["Boiled egg", "Boiled egg"]
);

expect(
  "three identical items produce three entries",
  buildEntryNames(
    [
      { id: 1, name: "Oat cake", quantity: null },
      { id: 2, name: "Oat cake", quantity: null },
      { id: 3, name: "Oat cake", quantity: null },
    ],
    "Snack"
  ).length,
  3
);

section("Items with quantities");

expect(
  "quantity appended in parentheses",
  buildEntryNames(
    [{ id: 1, name: "Chicken breast", quantity: "200g" }],
    "Chicken meal"
  ),
  ["Chicken breast (200g)"]
);

expect(
  "null quantity produces plain name",
  buildEntryNames(
    [{ id: 1, name: "Banana", quantity: null }],
    "Fruit bowl"
  ),
  ["Banana"]
);

expect(
  "mixed — some items have quantities, some do not",
  buildEntryNames(
    [
      { id: 1, name: "Chicken breast", quantity: "150g" },
      { id: 2, name: "Salad leaves", quantity: null },
      { id: 3, name: "Olive oil", quantity: "1 tbsp" },
    ],
    "Chicken salad"
  ),
  ["Chicken breast (150g)", "Salad leaves", "Olive oil (1 tbsp)"]
);

expect(
  "duplicate items with quantities each get their own entry",
  buildEntryNames(
    [
      { id: 1, name: "Protein shake", quantity: "300ml" },
      { id: 2, name: "Protein shake", quantity: "300ml" },
    ],
    "Post-workout"
  ),
  ["Protein shake (300ml)", "Protein shake (300ml)"]
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
