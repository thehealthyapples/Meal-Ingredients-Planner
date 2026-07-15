/**
 * RM4 — Planner Ready Meal Library · Verification Tests
 * =====================================================
 * Proves the library is a read-only view over the existing canonical `meals`
 * identity — no new entity, no duplicated product data:
 *
 *   1. The library returns ONLY ready meals the current member previously added
 *      (never another member's meals, never their non-ready meals).
 *   2. Ordering: most recently planned first, then most frequently used,
 *      then newest never-planned identity.
 *   3. Planning stats (timesPlanned / lastPlannedEntryId) are correct and are
 *      scoped to the member's own household planner.
 *   4. Apple Score joins from the member's OWN product_history by barcode where
 *      available, and renders as an honest gap (null) where it is not.
 *   5. One-tap reuse is a NORMAL planner entry against the existing mealId —
 *      no duplicate meal identity is created, planner history stays correct.
 *
 * Run with:  npx tsx server/tests/test-rm4-planner-ready-meal-library.ts
 */

import { storage } from "../storage.js";
import { db } from "../db.js";
import {
  users, meals, households, householdMembers,
  plannerWeeks, plannerDays, plannerEntries, productHistory,
} from "../../shared/schema.js";
import { eq, and, like, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";

const STAMP = randomBytes(4).toString("hex");
const BARCODE_PREFIX = "RM4TEST";
const BARCODE_1 = `${BARCODE_PREFIX}0000001`;
const BARCODE_2 = `${BARCODE_PREFIX}0000002`;
const BARCODE_3 = `${BARCODE_PREFIX}0000003`;

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

const createdUserIds: number[] = [];
const createdHouseholdIds: number[] = [];
const createdWeekIds: number[] = [];
const createdDayIds: number[] = [];

async function cleanup() {
  if (createdDayIds.length > 0) {
    await db.delete(plannerEntries).where(inArray(plannerEntries.dayId, createdDayIds));
    await db.delete(plannerDays).where(inArray(plannerDays.id, createdDayIds));
  }
  if (createdWeekIds.length > 0) {
    await db.delete(plannerWeeks).where(inArray(plannerWeeks.id, createdWeekIds));
  }
  await db.delete(productHistory).where(like(productHistory.barcode, `${BARCODE_PREFIX}%`));
  await db.delete(meals).where(like(meals.barcode, `${BARCODE_PREFIX}%`));
  await db.delete(meals).where(like(meals.name, `RM4 %${STAMP}%`));
  if (createdHouseholdIds.length > 0) {
    await db.delete(households).where(inArray(households.id, createdHouseholdIds)); // members cascade
  }
  if (createdUserIds.length > 0) {
    await db.delete(users).where(inArray(users.id, createdUserIds));
  }
}

async function createMember(tag: string): Promise<{ userId: number; householdId: number; dayIds: number[] }> {
  const [user] = await db.insert(users)
    .values({ username: `rm4-${tag}-${STAMP}@test.invalid`, password: "not-a-real-hash" })
    .returning();
  createdUserIds.push(user.id);
  const [hh] = await db.insert(households)
    .values({ name: `RM4 household ${tag} ${STAMP}`, inviteCode: `RM4-${tag}-${STAMP}`, createdByUserId: user.id })
    .returning();
  createdHouseholdIds.push(hh.id);
  await db.insert(householdMembers)
    .values({ householdId: hh.id, userId: user.id, role: "owner", status: "active" });
  const [week] = await db.insert(plannerWeeks)
    .values({ userId: user.id, householdId: hh.id, weekNumber: 1, weekName: "Week 1" })
    .returning();
  createdWeekIds.push(week.id);
  const dayIds: number[] = [];
  for (const dayOfWeek of [1, 2]) {
    const [day] = await db.insert(plannerDays).values({ weekId: week.id, dayOfWeek }).returning();
    createdDayIds.push(day.id);
    dayIds.push(day.id);
  }
  return { userId: user.id, householdId: hh.id, dayIds };
}

function readyMeal(name: string, barcode: string | null) {
  return {
    name,
    ingredients: [] as string[],
    instructions: [] as string[],
    servings: 1,
    isReadyMeal: true,
    mealSourceType: "openfoodfacts" as const,
    brand: "RM4Brand",
    barcode,
  };
}

async function run() {
  console.log("=== RM4 — Planner Ready Meal Library Verification ===\n");
  await cleanup();

  const memberA = await createMember("a");
  const memberB = await createMember("b");

  // Member A previously added three ready meals and one cooked recipe.
  const { meal: lasagne } = await storage.resolveOrCreateProductMeal(memberA.userId, readyMeal(`RM4 Beef Lasagne ${STAMP}`, BARCODE_1));
  const { meal: tikka }   = await storage.resolveOrCreateProductMeal(memberA.userId, readyMeal(`RM4 Chicken Tikka ${STAMP}`, BARCODE_2));
  const { meal: pie }     = await storage.resolveOrCreateProductMeal(memberA.userId, readyMeal(`RM4 Veggie Pie ${STAMP}`, BARCODE_3));
  const cooked = await storage.createMeal(memberA.userId, {
    name: `RM4 Home Cooked ${STAMP}`, ingredients: ["rice"], instructions: [], servings: 1,
  });
  // Member B has their own ready meal (same product, own identity — RM2A scope).
  const { meal: bMeal } = await storage.resolveOrCreateProductMeal(memberB.userId, readyMeal(`RM4 B Lasagne ${STAMP}`, BARCODE_1));

  // 1. Scope — only the member's own ready meals -------------------------------
  console.log("── Library scope: only the member's own ready meals ──");
  let lib = await storage.getReadyMealLibrary(memberA.userId);
  expect("library holds exactly member A's three ready meals", lib.length, 3);
  expect("member A's ready meals are all present",
    [lasagne.id, tikka.id, pie.id].every(id => lib.some(i => i.id === id)), true);
  expect("member A's cooked recipe is NOT in the library", lib.some(i => i.id === cooked.id), false);
  expect("member B's ready meal is NOT in member A's library", lib.some(i => i.id === bMeal.id), false);
  expect("library rows carry the existing product info (brand)",
    lib.every(i => i.brand === "RM4Brand"), true);

  // 2. Never-planned ordering: newest identity first ---------------------------
  console.log("\n── Never-planned meals order by newest identity ──");
  expect("never-planned meals: all timesPlanned = 0", lib.every(i => i.timesPlanned === 0), true);
  expect("never-planned meals order newest-first", lib.map(i => i.id), [pie.id, tikka.id, lasagne.id]);

  // 3. Planning stats + recency/frequency ordering -----------------------------
  console.log("\n── Recency-then-frequency ordering follows planner history ──");
  // Plan tikka twice (older entries), then lasagne once (newest entry).
  await storage.addPlannerEntry(memberA.dayIds[0], "dinner", "adult", tikka.id);
  await storage.addPlannerEntry(memberA.dayIds[1], "dinner", "adult", tikka.id);
  const lasagneEntry = await storage.addPlannerEntry(memberA.dayIds[0], "lunch", "adult", lasagne.id);

  lib = await storage.getReadyMealLibrary(memberA.userId);
  expect("most recently planned (lasagne) comes first", lib[0].id, lasagne.id);
  expect("previously planned (tikka) comes second", lib[1].id, tikka.id);
  expect("never-planned (pie) comes last", lib[2].id, pie.id);
  expect("timesPlanned counts every planner entry", lib.find(i => i.id === tikka.id)?.timesPlanned, 2);
  expect("lastPlannedEntryId is the newest entry for the meal",
    lib.find(i => i.id === lasagne.id)?.lastPlannedEntryId, lasagneEntry.id);

  // 4. Stats are scoped to the member's own household planner ------------------
  console.log("\n── Planner history is scoped to the member's household ──");
  await storage.addPlannerEntry(memberB.dayIds[0], "dinner", "adult", lasagne.id); // foreign-household entry
  lib = await storage.getReadyMealLibrary(memberA.userId);
  expect("another household's entries never inflate the member's stats",
    lib.find(i => i.id === lasagne.id)?.timesPlanned, 1);

  // 5. Apple Score joins from the member's own product_history -----------------
  console.log("\n── Apple Score where available; honest gap where not ──");
  await db.insert(productHistory).values({
    userId: memberA.userId, barcode: BARCODE_1, productName: `RM4 Beef Lasagne ${STAMP}`,
    thaRating: 4, scannedAt: new Date().toISOString(), source: "search",
  });
  await db.insert(productHistory).values({
    userId: memberB.userId, barcode: BARCODE_2, productName: `RM4 Chicken Tikka ${STAMP}`,
    thaRating: 2, scannedAt: new Date().toISOString(), source: "search",
  });
  lib = await storage.getReadyMealLibrary(memberA.userId);
  expect("analysed product carries its Apple Score", lib.find(i => i.id === lasagne.id)?.appleScore, 4);
  expect("un-analysed product renders the gap (null), never a fabricated score",
    lib.find(i => i.id === pie.id)?.appleScore, null);
  expect("another member's analysis never leaks into the library",
    lib.find(i => i.id === tikka.id)?.appleScore, null);

  // 6. One-tap reuse: a normal planner entry, no duplicate identity ------------
  console.log("\n── One-tap reuse creates a normal entry over the SAME identity ──");
  const mealsBefore = await db.select().from(meals)
    .where(and(eq(meals.userId, memberA.userId), eq(meals.barcode, BARCODE_1)));
  const reuseEntry = await storage.addPlannerEntry(memberA.dayIds[1], "dinner", "adult", lasagne.id);
  const mealsAfter = await db.select().from(meals)
    .where(and(eq(meals.userId, memberA.userId), eq(meals.barcode, BARCODE_1)));
  expect("reuse creates a normal planner entry against the existing mealId", reuseEntry.mealId, lasagne.id);
  expect("no duplicate meal identity is created by reuse", mealsAfter.length, mealsBefore.length);
  expect("exactly one identity exists for the barcode", mealsAfter.length, 1);

  lib = await storage.getReadyMealLibrary(memberA.userId);
  expect("planner history stays correct after reuse (timesPlanned)",
    lib.find(i => i.id === lasagne.id)?.timesPlanned, 2);
  expect("recency follows the reuse entry",
    lib.find(i => i.id === lasagne.id)?.lastPlannedEntryId, reuseEntry.id);

  await cleanup();

  console.log(`\n${failed === 0 ? "✅ PASS" : "❌ FAIL"} — ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Test run failed:", err);
  try { await cleanup(); } catch {}
  process.exit(1);
});
