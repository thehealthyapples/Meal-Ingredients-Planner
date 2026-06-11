/**
 * dry-run-planner-compliance-cleanup.ts
 * =======================================
 * DRY RUN ONLY — reads planner_entries and reports which ones would be removed
 * by a compliance cleanup pass. Does NOT delete or update anything.
 *
 * Uses the same shared compliance engine as the write gates:
 *   resolvePlannerComplianceContext → isComplianceActive → isMealCompliantForUser
 *   (which delegates to candidateDietExcluded → dietRules.shouldExcludeRecipe
 *    and candidateHardExcluded → canonical restriction resolver)
 *
 * No new rules. No duplicated keyword lists. No special-casing of any diet.
 *
 * Run with: npx tsx server/tests/dry-run-planner-compliance-cleanup.ts
 */

import { storage } from "../storage.js";
import { db } from "../db.js";
import {
  plannerWeeks,
  plannerDays,
  plannerEntries,
} from "../../shared/schema.js";
import { eq, inArray } from "drizzle-orm";
import {
  resolvePlannerComplianceContext,
  isComplianceActive,
  isMealCompliantForUser,
} from "../lib/planner-compliance.js";
import { getHouseholdForUser } from "../lib/household.js";

// ── Target user ───────────────────────────────────────────────────────────────
// The active user for this investigation. Update if running against a different account.
const TARGET_USER_ID = 1;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Helpers ───────────────────────────────────────────────────────────────────

interface EntryReport {
  entryId: number;
  weekNumber: number;
  dayName: string;
  dayOfWeek: number;
  mealSlot: string;
  audience: string;
  mealId: number;
  mealName: string;
  reason: string;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== DRY RUN: Planner Compliance Cleanup ===");
  console.log("NO DATA WILL BE CHANGED.\n");

  // 1. Resolve compliance context
  const ctx = await resolvePlannerComplianceContext(storage, TARGET_USER_ID);
  console.log(`User ${TARGET_USER_ID} compliance context:`);
  console.log(`  dietPattern:           ${ctx.dietPattern ?? "(none)"}`);
  console.log(`  dietRestrictions:      [${ctx.dietRestrictions.join(", ") || "none"}]`);
  console.log(`  hardExcluded count:    ${ctx.hardExcludedIngredients.length}`);
  if (ctx.hardExcludedIngredients.length > 0) {
    console.log(`  hardExcluded:          [${ctx.hardExcludedIngredients.join(", ")}]`);
  }

  const active = isComplianceActive(ctx);
  if (!active) {
    console.log("\n⚠️  Compliance is NOT active for this user (no dietPattern, no restrictions, no hard exclusions).");
    console.log("Nothing would be removed. Exiting.\n");
    process.exit(0);
  }

  // 2. Resolve household for week lookup
  let householdId: number;
  try {
    householdId = await getHouseholdForUser(TARGET_USER_ID);
  } catch (err) {
    console.error("Failed to resolve household for user:", err);
    process.exit(1);
  }
  console.log(`\n  householdId:           ${householdId}`);

  // 3. Load all planner weeks for this household
  const weeks = await db
    .select()
    .from(plannerWeeks)
    .where(eq(plannerWeeks.householdId, householdId))
    .orderBy(plannerWeeks.weekNumber);

  if (weeks.length === 0) {
    console.log("\nNo planner weeks found. Nothing to check.\n");
    process.exit(0);
  }

  const weekIdToNumber = new Map<number, number>(weeks.map(w => [w.id, w.weekNumber]));
  const allWeekIds = weeks.map(w => w.id);
  console.log(`\n  Planner weeks found:   ${weeks.length} (weeks ${weeks.map(w => w.weekNumber).join(", ")})`);

  // 4. Load all planner days for these weeks
  const allDays = await db
    .select()
    .from(plannerDays)
    .where(inArray(plannerDays.weekId, allWeekIds));

  const dayIdToWeekNumber = new Map<number, number>();
  const dayIdToDayOfWeek = new Map<number, number>();
  for (const day of allDays) {
    const weekNum = weekIdToNumber.get(day.weekId);
    if (weekNum !== undefined) dayIdToWeekNumber.set(day.id, weekNum);
    dayIdToDayOfWeek.set(day.id, day.dayOfWeek);
  }

  const allDayIds = allDays.map(d => d.id);
  if (allDayIds.length === 0) {
    console.log("No planner days found. Nothing to check.\n");
    process.exit(0);
  }

  // 5. Load all planner entries for these days
  const entries = await db
    .select()
    .from(plannerEntries)
    .where(inArray(plannerEntries.dayId, allDayIds));

  console.log(`  Planner entries found: ${entries.length}`);
  console.log("\nChecking compliance for each entry...\n");

  // 6. Check each entry
  let compliantCount = 0;
  let nonCompliantCount = 0;
  const proposed: EntryReport[] = [];

  for (const entry of entries) {
    const meal = await storage.getMeal(entry.mealId);
    if (!meal) {
      // Missing meal — treat as non-compliant (orphaned entry)
      nonCompliantCount++;
      proposed.push({
        entryId: entry.id,
        weekNumber: dayIdToWeekNumber.get(entry.dayId) ?? -1,
        dayName: DAY_NAMES[dayIdToDayOfWeek.get(entry.dayId) ?? 0],
        dayOfWeek: dayIdToDayOfWeek.get(entry.dayId) ?? -1,
        mealSlot: entry.mealType,
        audience: entry.audience,
        mealId: entry.mealId,
        mealName: "(meal record not found)",
        reason: "meal-not-found",
      });
      continue;
    }

    const result = isMealCompliantForUser(meal, ctx);
    if (result.compliant) {
      compliantCount++;
    } else {
      nonCompliantCount++;
      proposed.push({
        entryId: entry.id,
        weekNumber: dayIdToWeekNumber.get(entry.dayId) ?? -1,
        dayName: DAY_NAMES[dayIdToDayOfWeek.get(entry.dayId) ?? 0],
        dayOfWeek: dayIdToDayOfWeek.get(entry.dayId) ?? -1,
        mealSlot: entry.mealType,
        audience: entry.audience,
        mealId: meal.id,
        mealName: meal.name,
        reason: result.reason ?? "unknown",
      });
    }
  }

  // 7. Report
  console.log("─────────────────────────────────────────────────────────");
  console.log("PLANNER COMPLIANCE CLEANUP DRY RUN: COMPLETE");
  console.log("─────────────────────────────────────────────────────────\n");

  console.log(`Rollback identifier:    rollback/before-planner-entry-cleanup-2026-06-06 @ af620b9`);
  console.log(`User ID:                ${TARGET_USER_ID}`);
  console.log(`Household ID:           ${householdId}`);
  console.log(`Total entries checked:  ${entries.length}`);
  console.log(`Compliant:              ${compliantCount}`);
  console.log(`Non-compliant:          ${nonCompliantCount}`);
  console.log();

  if (proposed.length === 0) {
    console.log("✅  No non-compliant entries found. Nothing would be removed.\n");
  } else {
    console.log("🔴  Entries proposed for removal:\n");
    for (const r of proposed) {
      console.log(`  Entry ID ${r.entryId}:`);
      console.log(`    Week:       ${r.weekNumber}`);
      console.log(`    Day:        ${r.dayName} (dayOfWeek=${r.dayOfWeek})`);
      console.log(`    Slot:       ${r.mealSlot} (${r.audience})`);
      console.log(`    Meal ID:    ${r.mealId}`);
      console.log(`    Meal name:  "${r.mealName}"`);
      console.log(`    Reason:     ${r.reason}`);
      console.log();
    }
  }

  console.log("─────────────────────────────────────────────────────────");
  console.log("DATA CHANGED: NONE — dry run only.");
  console.log("─────────────────────────────────────────────────────────\n");

  process.exit(0);
}

main().catch(err => {
  console.error("Dry run failed:", err);
  process.exit(1);
});
