/**
 * RM2A — Analyser → Planner Journey · Verification Tests
 * ======================================================
 * Proves the canonical-identity guarantee the journey depends on:
 *
 *   1. Resolving the same barcode twice reuses ONE `meals` identity
 *      (idempotent — the same product never creates duplicate meal identities).
 *   2. A different barcode creates a distinct identity.
 *   3. A product with no barcode always creates a fresh identity
 *      (nothing to resolve against — unchanged legacy behaviour).
 *   4. Identity is scoped per household member — one user's product identity is
 *      never silently handed to another user.
 *   5. The resolved identity carries the ready-meal shape the Planner and shopping
 *      layer already understand (isReadyMeal, mealSourceType='openfoodfacts',
 *      barcode), so no downstream behaviour changes.
 *
 * Run with:  npx tsx server/tests/test-rm2a-analyser-to-planner.ts
 */

import { storage } from "../storage.js";
import { db } from "../db.js";
import { meals } from "../../shared/schema.js";
import { eq, and, like } from "drizzle-orm";

const USER_A = 990101;                 // synthetic, isolated test users (no FK on meals.userId)
const USER_B = 990102;
const BARCODE_PREFIX = "RM2ATEST";
const BARCODE_1 = `${BARCODE_PREFIX}0000001`;
const BARCODE_2 = `${BARCODE_PREFIX}0000002`;

let passed = 0;
let failed = 0;

function expect<T>(label: string, actual: T, expected: T): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { console.log(`  ✓  ${label}`); passed++; }
  else {
    console.error(`  ✗  ${label}`);
    console.error(`       expected: ${JSON.stringify(expected)}`);
    console.error(`       got:      ${JSON.stringify(actual)}`);
    failed++;
  }
}

function productMeal(name: string, barcode: string | null) {
  return {
    name,
    ingredients: [] as string[],
    instructions: [] as string[],
    servings: 1,
    isReadyMeal: true,
    mealSourceType: "openfoodfacts" as const,
    brand: "TestBrand",
    barcode,
  };
}

async function cleanup() {
  // Remove every meal any test in this file could have created.
  await db.delete(meals).where(like(meals.barcode, `${BARCODE_PREFIX}%`));
  await db.delete(meals).where(and(eq(meals.userId, USER_A), eq(meals.name, "RM2A No-Barcode Product")));
  await db.delete(meals).where(and(eq(meals.userId, USER_B), eq(meals.name, "RM2A No-Barcode Product")));
}

async function run() {
  console.log("=== RM2A — Analyser → Planner Journey Verification ===\n");
  await cleanup();

  // 1. Idempotent reuse on the same barcode ----------------------------------
  console.log("── Idempotent identity resolution ──");
  const first = await storage.resolveOrCreateProductMeal(USER_A, productMeal("RM2A Beef Lasagne", BARCODE_1));
  expect("first resolve creates a new identity", first.created, true);

  const second = await storage.resolveOrCreateProductMeal(USER_A, productMeal("RM2A Beef Lasagne (re-added)", BARCODE_1));
  expect("second resolve reuses the identity (created=false)", second.created, false);
  expect("same product resolves to the SAME meal id", second.meal.id, first.meal.id);

  const rowsForBarcode1 = await db.select().from(meals)
    .where(and(eq(meals.userId, USER_A), eq(meals.barcode, BARCODE_1)));
  expect("exactly one meals row exists for the barcode", rowsForBarcode1.length, 1);

  // 2. A different barcode is a different identity ----------------------------
  console.log("\n── Distinct products stay distinct ──");
  const other = await storage.resolveOrCreateProductMeal(USER_A, productMeal("RM2A Chicken Tikka", BARCODE_2));
  expect("different barcode creates a new identity", other.created, true);
  expect("different barcode => different meal id", other.meal.id !== first.meal.id, true);

  // 3. No barcode => always create (legacy behaviour preserved) ---------------
  console.log("\n── Barcode-less products keep legacy create behaviour ──");
  const noBc1 = await storage.resolveOrCreateProductMeal(USER_A, productMeal("RM2A No-Barcode Product", null));
  const noBc2 = await storage.resolveOrCreateProductMeal(USER_A, productMeal("RM2A No-Barcode Product", null));
  expect("no-barcode resolve #1 creates", noBc1.created, true);
  expect("no-barcode resolve #2 also creates (no identity to reuse)", noBc2.created, true);
  expect("no-barcode resolves are distinct rows", noBc1.meal.id !== noBc2.meal.id, true);

  // 4. Identity is scoped per household member --------------------------------
  console.log("\n── Per-member identity scope ──");
  const userB = await storage.resolveOrCreateProductMeal(USER_B, productMeal("RM2A Beef Lasagne", BARCODE_1));
  expect("another user resolving the same barcode gets their OWN identity", userB.created, true);
  expect("cross-user barcode does not collapse into user A's row", userB.meal.id !== first.meal.id, true);

  // 5. Resolved identity carries the ready-meal shape downstream relies on ----
  console.log("\n── Ready-meal identity shape preserved ──");
  expect("identity is a ready meal", first.meal.isReadyMeal, true);
  expect("identity carries the openfoodfacts source type", first.meal.mealSourceType, "openfoodfacts");
  expect("identity carries the barcode (shopping preferred-match hint)", first.meal.barcode, BARCODE_1);

  await cleanup();

  console.log(`\n${failed === 0 ? "✅ PASS" : "❌ FAIL"} — ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Test run failed:", err);
  try { await cleanup(); } catch {}
  process.exit(1);
});
