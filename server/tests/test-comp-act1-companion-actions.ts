/**
 * test-comp-act1-companion-actions.ts (COMP_ACT1)
 * ================================================
 * Verifies the write verbs COMP_ACT1 activates on the Companion's capabilities by
 * binding them to injected in-memory owners (no live database) and driving them through
 * the REAL platform pipeline:
 *
 *   intent → registry → permission → CONFIRM → handler → owner (delegation) → response
 *
 * Actions under test:
 *   • planner.move     (relocate an entry to a known day+slot)
 *   • planner.replace  (swap an entry's meal for a known meal)
 *   • shopping.delete  (remove one of the caller's own extras)
 *   • pantry.add / pantry.delete
 *   • diary.add        (log a meal on a known date)
 *
 * For each: success (delegates to the owner), an honest gap (missing resolved param),
 * ownership/permission denial where applicable, and the server-side confirmation gate.
 *
 * Run with: npx tsx server/tests/test-comp-act1-companion-actions.ts
 */

import {
  IntelligencePlatform,
  bindPlannerReadCapability,
  bindShoppingReadCapability,
  bindPantryReadCapability,
  bindDiaryReadCapability,
  type IntelligenceContext,
  type PlannerWritePort,
  type ShoppingWritePort,
} from "../intelligence/index.js";
import type { PantryWritePort } from "../intelligence/handlers/pantry-write-port.js";
import type { DiaryWritePort } from "../intelligence/handlers/diary-write-port.js";
import type {
  PlannerWeek, PlannerDay, PlannerEntry, Meal, ShoppingListExtra, UserPantryItem, FoodDiaryEntry,
} from "../../shared/schema.js";

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`); failed++; }
}
function section(name: string): void { console.log(`\n── ${name} ──`); }

const USER = 1;
const HOUSEHOLD = 100;

// ── In-memory owners (stand in for storage + household; record delegation) ──
const weeks: PlannerWeek[] = [
  { id: 10, userId: 1, householdId: 100, weekNumber: 1, weekName: "W1", weekStartDate: null },
  { id: 20, userId: 2, householdId: 200, weekNumber: 1, weekName: "Other", weekStartDate: null }, // foreign
];
const days: PlannerDay[] = [
  { id: 1000, weekId: 10, dayOfWeek: 0 },
  { id: 1001, weekId: 10, dayOfWeek: 1 },
  { id: 2000, weekId: 20, dayOfWeek: 0 }, // foreign
];
const entries: PlannerEntry[] = [
  { id: 5000, dayId: 1000, mealType: "dinner", audience: "adult", mealId: 700, position: 0, calories: 0, isDrink: false, drinkType: null } as PlannerEntry,
  { id: 6000, dayId: 2000, mealType: "dinner", audience: "adult", mealId: 700, position: 0, calories: 0, isDrink: false, drinkType: null } as PlannerEntry, // foreign
];
const meals: Record<number, Meal> = {
  700: { id: 700, userId: 2, isSystemMeal: true } as Meal,   // system meal — accessible to all
  701: { id: 701, userId: 1, isSystemMeal: false } as Meal,  // caller's own
  999: { id: 999, userId: 2, isSystemMeal: false } as Meal,  // another user's private meal
};

const plannerCalls: string[] = [];
const plannerWritePort: PlannerWritePort = {
  getHouseholdForUser: async (userId) => (userId === 1 ? HOUSEHOLD : 200),
  getPlannerDay: async (id) => days.find((d) => d.id === id),
  getPlannerWeek: async (id) => weeks.find((w) => w.id === id),
  getPlannerEntryById: async (id) => entries.find((e) => e.id === id),
  getMeal: async (id) => meals[id],
  addPlannerEntry: async () => { throw new Error("add not exercised here"); },
  updatePlannerEntryLocation: async (id, dayId, mealType, position) => {
    plannerCalls.push(`move:${id}->${dayId}/${mealType}@${position}`);
    return { id, dayId, mealType, audience: "adult", mealId: 700, position, calories: 0, isDrink: false, drinkType: null } as PlannerEntry;
  },
  replacePlannerEntryMeal: async (entryId, mealId) => {
    plannerCalls.push(`replace:${entryId}->meal${mealId}`);
    const e = entries.find((x) => x.id === entryId)!;
    return { ...e, mealId } as PlannerEntry;
  },
};

const shoppingCalls: string[] = [];
const shoppingWritePort: ShoppingWritePort = {
  addShoppingListExtra: async () => { throw new Error("add not exercised here"); },
  deleteShoppingListExtra: async (userId, id) => { shoppingCalls.push(`delete:${userId}/${id}`); },
};

const pantryCalls: string[] = [];
const pantryWritePort: PantryWritePort = {
  addPantryItem: async (userId, ingredient, category) => {
    pantryCalls.push(`add:${userId}/${ingredient}/${category}`);
    return { id: 55, userId, ingredientKey: ingredient, displayName: ingredient, category } as UserPantryItem;
  },
  deletePantryItem: async (userId, id) => { pantryCalls.push(`delete:${userId}/${id}`); },
};

const diaryCalls: string[] = [];
const diaryWritePort: DiaryWritePort = {
  createFoodDiaryEntry: async (userId, date, data) => {
    diaryCalls.push(`log:${userId}/${date}/${data.name}/${data.mealSlot}`);
    return { id: 77, dayId: 900, userId, name: data.name, mealSlot: data.mealSlot, notes: data.notes ?? null, sourceType: "manual", sourcePlannerEntryId: null } as FoodDiaryEntry;
  },
};

// A read-port factory that must never be called by a write verb (fails loud if it is).
const noReadPort = (() => Promise.reject(new Error("read port must not be touched by a write verb"))) as never;

const platform = new IntelligencePlatform();
bindPlannerReadCapability(platform, noReadPort, async () => plannerWritePort);
bindShoppingReadCapability(platform, noReadPort, async () => shoppingWritePort);
bindPantryReadCapability(platform, noReadPort, async () => pantryWritePort);
bindDiaryReadCapability(platform, noReadPort, async () => diaryWritePort);

const ctx: IntelligenceContext = { role: "user", userId: String(USER), premium: false };
const anonCtx: IntelligenceContext = { role: "user", userId: undefined, premium: false };
const CONFIRMED = { confirmed: true } as const;

async function main() {
  section("Planner MOVE (planner.move → updatePlannerEntryLocation)");
  {
    const ok = await platform.handle({ verb: "move", capabilityId: "planner", parameters: { entryId: 5000, dayId: 1001, mealSlot: "lunch", position: 0 } }, ctx, CONFIRMED);
    assert(ok.status === "ok", "moves an owned entry to a known day+slot", ok.status);
    assert(plannerCalls.includes("move:5000->1001/lunch@0"), "delegated to updatePlannerEntryLocation");

    const gap = await platform.handle({ verb: "move", capabilityId: "planner", parameters: { entryId: 5000 } }, ctx, CONFIRMED);
    assert(gap.status === "gap", "missing dayId/mealSlot → honest gap (never guesses)", gap.status);

    const foreign = await platform.handle({ verb: "move", capabilityId: "planner", parameters: { entryId: 6000, dayId: 1001, mealSlot: "lunch" } }, ctx, CONFIRMED);
    assert(foreign.status === "denied", "cross-household entry → denied (no existence leak)", foreign.status);

    const needsConfirm = await platform.handle({ verb: "move", capabilityId: "planner", parameters: { entryId: 5000, dayId: 1001, mealSlot: "lunch" } }, ctx);
    assert(needsConfirm.status === "confirmation_required", "unconfirmed move → confirmation_required", needsConfirm.status);
  }

  section("Planner REPLACE (planner.replace → replacePlannerEntryMeal)");
  {
    const ok = await platform.handle({ verb: "replace", capabilityId: "planner", parameters: { entryId: 5000, mealId: 701 } }, ctx, CONFIRMED);
    assert(ok.status === "ok", "replaces an owned entry's meal with the caller's own meal", ok.status);
    assert(plannerCalls.includes("replace:5000->meal701"), "delegated to replacePlannerEntryMeal");

    const notOwned = await platform.handle({ verb: "replace", capabilityId: "planner", parameters: { entryId: 5000, mealId: 999 } }, ctx, CONFIRMED);
    assert(notOwned.status === "denied", "replacement meal not owned/system → denied", notOwned.status);

    const gap = await platform.handle({ verb: "replace", capabilityId: "planner", parameters: { entryId: 5000 } }, ctx, CONFIRMED);
    assert(gap.status === "gap", "missing mealId → honest gap", gap.status);
  }

  section("Shopping DELETE (shopping.delete → deleteShoppingListExtra)");
  {
    const ok = await platform.handle({ verb: "delete", capabilityId: "shopping", parameters: { id: 42 } }, ctx, CONFIRMED);
    assert(ok.status === "ok", "deletes one of the caller's own extras", ok.status);
    assert(shoppingCalls.includes("delete:1/42"), "delegated to deleteShoppingListExtra with caller userId");

    const gap = await platform.handle({ verb: "delete", capabilityId: "shopping", parameters: {} }, ctx, CONFIRMED);
    assert(gap.status === "gap", "missing id → honest gap", gap.status);

    const needsConfirm = await platform.handle({ verb: "delete", capabilityId: "shopping", parameters: { id: 42 } }, ctx);
    assert(needsConfirm.status === "confirmation_required", "unconfirmed delete → confirmation_required (strong)", needsConfirm.status);
  }

  section("Pantry ADD / DELETE (pantry.add / pantry.delete)");
  {
    const add = await platform.handle({ verb: "add", capabilityId: "pantry", parameters: { ingredient: "oats", category: "larder" } }, ctx, CONFIRMED);
    assert(add.status === "ok", "adds a pantry item", add.status);
    assert(pantryCalls.includes("add:1/oats/larder"), "delegated to addPantryItem");

    const badCat = await platform.handle({ verb: "add", capabilityId: "pantry", parameters: { ingredient: "oats", category: "nonsense" } }, ctx, CONFIRMED);
    assert(badCat.status === "gap", "invalid category → honest gap", badCat.status);

    const del = await platform.handle({ verb: "delete", capabilityId: "pantry", parameters: { id: 9 } }, ctx, CONFIRMED);
    assert(del.status === "ok", "deletes a pantry item", del.status);
    assert(pantryCalls.includes("delete:1/9"), "delegated to deletePantryItem with caller userId");
  }

  section("Diary ADD (diary.add → createFoodDiaryEntry)");
  {
    const ok = await platform.handle({ verb: "add", capabilityId: "diary", parameters: { name: "Porridge", mealSlot: "breakfast", date: "2026-07-18" } }, ctx, CONFIRMED);
    assert(ok.status === "ok", "logs a meal on a known date", ok.status);
    assert(diaryCalls.includes("log:1/2026-07-18/Porridge/breakfast"), "delegated to createFoodDiaryEntry");

    const gap = await platform.handle({ verb: "add", capabilityId: "diary", parameters: { name: "Porridge", mealSlot: "breakfast" } }, ctx, CONFIRMED);
    assert(gap.status === "gap", "missing date → honest gap (never logs against 'today')", gap.status);
  }

  section("Permission — effective identity preserved (anonymous → denied)");
  {
    const anon = await platform.handle({ verb: "add", capabilityId: "pantry", parameters: { ingredient: "oats", category: "larder" } }, anonCtx, CONFIRMED);
    assert(anon.status === "denied", "unauthenticated write → denied (no userId)", anon.status);
  }

  console.log(`\n${failed === 0 ? "✅" : "❌"} COMP_ACT1 — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
