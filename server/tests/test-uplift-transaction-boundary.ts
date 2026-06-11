/**
 * test-uplift-transaction-boundary.ts
 * ====================================
 * Investigation script only. Not a permanent test.
 *
 * Proves whether storage.updateMeal() persists when storage.createUpliftApplication()
 * subsequently fails due to missing meal_uplift_applications table.
 *
 * Simulates the exact sequence in POST /api/uplift/accept (routes.ts:9835):
 *   1. storage.getMeal()               — READ
 *   2. storage.updateMeal()            — WRITE (commits immediately, no transaction)
 *   3. storage.createUpliftApplication() — WRITE (fails: table missing)
 *
 * Expected result: ingredient persists despite step 3 failure.
 */

import { db } from "../db.js";
import { meals } from "../../shared/schema.js";
import { storage } from "../storage.js";
import { eq } from "drizzle-orm";

const TEST_MEAL_ID = 2221;
const TEST_INGREDIENT = "__UPLIFT_TX_BOUNDARY_TEST__";

async function runTest() {
  console.log("=== UPLIFT TRANSACTION BOUNDARY TEST ===\n");

  // --- Pre-test snapshot ---
  const pre = await storage.getMeal(TEST_MEAL_ID);
  if (!pre) {
    console.error(`ABORT: Meal ${TEST_MEAL_ID} not found`);
    process.exit(1);
  }

  console.log("PRE-TEST:");
  console.log(`  Meal ID:    ${pre.id}`);
  console.log(`  Meal name:  ${pre.name}`);
  console.log(`  Ingredients (${pre.ingredients.length}):`);
  pre.ingredients.forEach((ing, i) => console.log(`    [${i}] ${ing}`));
  console.log(`  Test ingredient present: ${pre.ingredients.includes(TEST_INGREDIENT)}`);
  console.log("");

  if (pre.ingredients.includes(TEST_INGREDIENT)) {
    console.error("ABORT: Test ingredient already present from a prior run. Clean up first.");
    process.exit(1);
  }

  // --- Step 1: Simulate storage.updateMeal() ---
  console.log("STEP 1: storage.updateMeal() — adding test ingredient (no transaction)");
  try {
    const merged = [...pre.ingredients, TEST_INGREDIENT];
    const updated = await storage.updateMeal(TEST_MEAL_ID, { ingredients: merged });
    console.log(`  Result: SUCCESS`);
    console.log(`  Ingredient count after update: ${updated?.ingredients.length}`);
    console.log(`  Test ingredient appended: ${updated?.ingredients.includes(TEST_INGREDIENT)}`);
  } catch (err: any) {
    console.error(`  Result: FAILED — ${err?.message}`);
    process.exit(1);
  }

  // --- Check DB state after Step 1, before Step 2 ---
  const mid = await storage.getMeal(TEST_MEAL_ID);
  console.log(`\nMID-TEST (after updateMeal, before createUpliftApplication):`);
  console.log(`  Test ingredient in DB: ${mid?.ingredients.includes(TEST_INGREDIENT)}`);

  // --- Step 2: Simulate storage.createUpliftApplication() — WILL FAIL ---
  console.log("\nSTEP 2: storage.createUpliftApplication() — INSERT into missing table");
  let step2Error: string | null = null;
  try {
    await storage.createUpliftApplication({
      mealId: TEST_MEAL_ID,
      userId: 38,
      ruleId: "test_rule_boundary",
      ruleName: "Transaction Boundary Test",
      ingredient: TEST_INGREDIENT,
      action: "add",
      quantity: null,
      explanation: "Investigation test — not a real suggestion",
      addedBy: "tha_uplift",
      plannerEntryId: null,
      forkedFromMealId: null,
      status: "accepted",
    });
    console.log("  Result: SUCCESS (unexpected — table should be missing)");
  } catch (err: any) {
    step2Error = err?.message ?? String(err);
    console.log(`  Result: FAILED (expected)`);
    console.log(`  Error code:    ${err?.code ?? "N/A"}`);
    console.log(`  Error message: ${step2Error}`);
  }

  // --- Post-failure check ---
  console.log("\nPOST-FAILURE CHECK:");
  const post = await storage.getMeal(TEST_MEAL_ID);
  const ingredientPersisted = post?.ingredients.includes(TEST_INGREDIENT) ?? false;

  console.log(`  Test ingredient PERSISTED despite step 2 failure: ${ingredientPersisted ? "YES" : "NO"}`);
  console.log(`  Ingredient count: ${post?.ingredients.length}`);

  // --- Cleanup ---
  console.log("\nCLEANUP: Removing test ingredient");
  if (ingredientPersisted) {
    const restored = pre.ingredients; // original without test ingredient
    await storage.updateMeal(TEST_MEAL_ID, { ingredients: restored });
    const cleanup = await storage.getMeal(TEST_MEAL_ID);
    console.log(`  Test ingredient still present after cleanup: ${cleanup?.ingredients.includes(TEST_INGREDIENT)}`);
    console.log(`  Ingredient count restored to: ${cleanup?.ingredients.length}`);
  } else {
    console.log("  No cleanup needed — ingredient did not persist");
  }

  // --- Verdict ---
  console.log("\n=== VERDICT ===");
  console.log(`TRANSACTION RESULT:       ${ingredientPersisted ? "PARTIAL SUCCESS" : "FULL ROLLBACK"}`);
  console.log(`INGREDIENT PERSISTED:     ${ingredientPersisted ? "YES" : "NO"}`);
  console.log(`STEP 2 ERROR:             ${step2Error ?? "none"}`);
  console.log(`PARTIAL SUCCESS PROVEN:   ${ingredientPersisted && step2Error !== null ? "YES" : "NO"}`);

  process.exit(0);
}

runTest().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
