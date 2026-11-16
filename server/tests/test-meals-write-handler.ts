/**
 * test-meals-write-handler.ts — COMP3 Meals Write Handler ("replace" + "add")
 * ============================================================================
 * Coverage:
 *   - A meal already owned by the caller is edited in place — no fork.
 *   - A SYSTEM meal is forked to a new user-owned row first, then the fork
 *     (never the original) is edited — mirrors POST /api/uplift/accept exactly.
 *   - A meal owned by a DIFFERENT user (not system) is denied — same denial
 *     whether the meal doesn't exist or isn't the caller's, no existence leak.
 *   - An ingredient no longer present on the meal is an honest gap, never a
 *     silent no-op or a guess at which line to change.
 *   - "add" creates a bare quick meal — just a name, caller-owned, no
 *     ingredients — matching quick-meal-page.tsx's own save defaults exactly.
 *   - Any verb other than "replace"/"add" is an honest gap — this binding is
 *     NOT a general-purpose meal editor.
 *
 * No database. Run: npx tsx server/tests/test-meals-write-handler.ts
 */

import { createMealsWriteHandler } from "../intelligence/handlers/meals-write-handler.js";
import type { MealsWritePort } from "../intelligence/handlers/meals-write-port.js";
import type { Meal, InsertMeal, PlannerDay, PlannerWeek, PlannerEntry } from "@shared/schema";
import type { Intent, IntelligenceContext } from "../intelligence/types.js";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ ${label}`);
  }
}

function fixtureMeal(overrides: Partial<Meal>): Meal {
  return {
    id: 1, userId: 0, name: "Spaghetti Bolognese", ingredients: ["1tbsp worcestershire sauce", "350g spaghetti"],
    instructions: [], servings: 4, categoryId: null, sourceUrl: null, mealSourceType: "manual",
    isReadyMeal: false, isSystemMeal: true, mealFormat: "meal", dietTypes: [], isFreezerEligible: false,
    audience: "adult", isDrink: false, drinkType: null, barcode: null, brand: null, originalMealId: null,
    kind: "recipe", createdAt: new Date(),
    ...overrides,
  } as unknown as Meal;
}

class InMemoryMealsWritePort implements MealsWritePort {
  meals = new Map<number, Meal>();
  days = new Map<number, PlannerDay>();
  weeks = new Map<number, PlannerWeek>();
  entries = new Map<number, PlannerEntry>();
  householdByUser = new Map<number, number>();
  nextId = 100;
  nextEntryId = 500;

  async getMeal(id: number): Promise<Meal | undefined> {
    return this.meals.get(id);
  }
  async createMeal(userId: number, insertMeal: InsertMeal): Promise<Meal> {
    const id = this.nextId++;
    const created = fixtureMeal({ ...(insertMeal as Partial<Meal>), id, userId, isSystemMeal: false });
    this.meals.set(id, created);
    return created;
  }
  async updateMeal(id: number, data: Partial<{ ingredients: string[] }>): Promise<Meal | undefined> {
    const existing = this.meals.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.meals.set(id, updated);
    return updated;
  }
  async getHouseholdForUser(userId: number): Promise<number> {
    const householdId = this.householdByUser.get(userId);
    if (householdId === undefined) throw new Error(`no household fixture for user ${userId}`);
    return householdId;
  }
  async getPlannerDay(id: number): Promise<PlannerDay | undefined> {
    return this.days.get(id);
  }
  async getPlannerWeek(id: number): Promise<PlannerWeek | undefined> {
    return this.weeks.get(id);
  }
  async addPlannerEntry(
    dayId: number,
    mealSlot: string,
    audience: string,
    mealId: number,
    position = 0,
    calories = 0,
    isDrink = false,
    drinkType: string | null = null,
  ): Promise<PlannerEntry> {
    const id = this.nextEntryId++;
    const entry = {
      id, dayId, mealType: mealSlot, audience, mealId, position, calories, isDrink, drinkType,
      adaptationResult: null, guestEaters: null, originalMealIdBeforeVariant: null,
    } as unknown as PlannerEntry;
    this.entries.set(id, entry);
    return entry;
  }
}

function fixtureDay(overrides: Partial<PlannerDay>): PlannerDay {
  return { id: 1, weekId: 1, dayOfWeek: 1, ...overrides } as unknown as PlannerDay;
}

function fixtureWeek(overrides: Partial<PlannerWeek>): PlannerWeek {
  return { id: 1, userId: 0, householdId: 1, weekNumber: 1, weekStartDate: null, ...overrides } as unknown as PlannerWeek;
}

function ctx(userId: number): IntelligenceContext {
  return { role: "user", userId: String(userId), premium: false };
}

function intent(parameters: Record<string, unknown>, verb: Intent["verb"] = "replace"): Intent {
  return { capabilityId: "meals", verb, parameters };
}

async function main() {
  // ── Already-owned meal: edited in place, no fork ──────────────────────────
  {
    const port = new InMemoryMealsWritePort();
    port.meals.set(1, fixtureMeal({ id: 1, userId: 226, isSystemMeal: false }));
    const handler = createMealsWriteHandler(async () => port);
    const result = await handler(
      intent({ mealId: 1, ingredient: "1tbsp worcestershire sauce", replacement: "1tbsp gluten-free Worcestershire sauce" }),
      ctx(226),
    ) as { scope: string; mealId: number; forkedFromMealId: number | null };

    assert(result.mealId === 1 && result.forkedFromMealId === null, "an already-owned meal is edited in place — no fork, same id");
    assert(
      port.meals.get(1)?.ingredients.includes("1tbsp gluten-free Worcestershire sauce") === true,
      "the ingredient list now carries the replacement",
    );
    assert(
      port.meals.get(1)?.ingredients.includes("1tbsp worcestershire sauce") === false,
      "the original flagged ingredient is gone, not merely appended alongside",
    );
  }

  // ── matchedTerm swaps ONLY the flagged word(s) — the measure survives ────
  // The curated replacement text is just the ingredient name on its own
  // ("gluten-free Worcestershire sauce") — it never carries a quantity. A
  // full-line replace would silently drop "1tbsp"; matchedTerm must prevent that.
  {
    const port = new InMemoryMealsWritePort();
    port.meals.set(1, fixtureMeal({ id: 1, userId: 226, isSystemMeal: false, ingredients: ["1tbsp worcestershire sauce", "350g spaghetti"] }));
    const handler = createMealsWriteHandler(async () => port);
    const result = await handler(
      intent({ mealId: 1, ingredient: "1tbsp worcestershire sauce", matchedTerm: "worcestershire sauce", replacement: "gluten-free Worcestershire sauce" }),
      ctx(226),
    ) as { scope: string; mealId: number; forkedFromMealId: number | null };

    assert(
      port.meals.get(result.mealId)?.ingredients.includes("1tbsp gluten-free Worcestershire sauce") === true,
      "the measure (\"1tbsp\") is preserved — only the flagged word(s) are swapped, never the whole line",
    );
    assert(
      port.meals.get(result.mealId)?.ingredients.includes("350g spaghetti") === true,
      "every other ingredient line is left completely untouched",
    );
  }

  // ── matchedTerm absent (or not actually present in the line): falls back
  // to a full-line replace rather than silently doing nothing ──────────────
  {
    const port = new InMemoryMealsWritePort();
    port.meals.set(1, fixtureMeal({ id: 1, userId: 226, isSystemMeal: false, ingredients: ["1tbsp worcestershire sauce"] }));
    const handler = createMealsWriteHandler(async () => port);
    const result = await handler(
      intent({ mealId: 1, ingredient: "1tbsp worcestershire sauce", matchedTerm: "something not on this line", replacement: "gluten-free Worcestershire sauce" }),
      ctx(226),
    ) as { scope: string; mealId: number };

    assert(
      port.meals.get(result.mealId)?.ingredients.includes("gluten-free Worcestershire sauce") === true,
      "a matchedTerm that isn't actually in the line falls back to a full-line replace, never a silent no-op",
    );
  }

  // ── System meal: forked to a new user-owned row, original left untouched ──
  {
    const port = new InMemoryMealsWritePort();
    port.meals.set(1, fixtureMeal({ id: 1, userId: 0, isSystemMeal: true }));
    const handler = createMealsWriteHandler(async () => port);
    const result = await handler(
      intent({ mealId: 1, ingredient: "1tbsp worcestershire sauce", replacement: "1tbsp gluten-free Worcestershire sauce" }),
      ctx(226),
    ) as { scope: string; mealId: number; forkedFromMealId: number | null };

    assert(result.forkedFromMealId === 1 && result.mealId !== 1, "a system meal is forked to a NEW row, not edited in place");
    assert(port.meals.get(1)?.ingredients.includes("1tbsp worcestershire sauce") === true, "the original system meal is left completely untouched");
    assert(
      port.meals.get(result.mealId)?.ingredients.includes("1tbsp gluten-free Worcestershire sauce") === true,
      "the FORK carries the replacement",
    );
    assert(port.meals.get(result.mealId)?.userId === 226, "the fork is owned by the household that asked, not the system");
    assert(port.meals.get(result.mealId)?.isSystemMeal === false, "the fork is a personal copy, never itself a system meal");
  }

  // ── Another user's own (non-system) meal: denied, no existence leak ──────
  {
    const port = new InMemoryMealsWritePort();
    port.meals.set(1, fixtureMeal({ id: 1, userId: 38, isSystemMeal: false }));
    const handler = createMealsWriteHandler(async () => port);
    let deniedCaught = false;
    let missingCaught = false;
    try {
      await handler(intent({ mealId: 1, ingredient: "1tbsp worcestershire sauce", replacement: "x" }), ctx(226));
    } catch (e) {
      deniedCaught = (e as { failureStatus?: string }).failureStatus === "denied";
    }
    try {
      await handler(intent({ mealId: 999, ingredient: "1tbsp worcestershire sauce", replacement: "x" }), ctx(226));
    } catch (e) {
      missingCaught = (e as { failureStatus?: string }).failureStatus === "denied";
    }
    assert(deniedCaught, "another user's own (non-system) meal is denied, never editable by someone else");
    assert(missingCaught, "a missing meal id denies with the SAME kind as someone else's meal — no existence leak");
  }

  // ── Ingredient no longer present: honest gap, never a silent no-op ───────
  {
    const port = new InMemoryMealsWritePort();
    port.meals.set(1, fixtureMeal({ id: 1, userId: 226, isSystemMeal: false, ingredients: ["350g spaghetti"] }));
    const handler = createMealsWriteHandler(async () => port);
    let gapCaught = false;
    try {
      await handler(intent({ mealId: 1, ingredient: "1tbsp worcestershire sauce", replacement: "x" }), ctx(226));
    } catch (e) {
      gapCaught = (e as { failureStatus?: string }).failureStatus === "gap";
    }
    assert(gapCaught, "an ingredient no longer on the recipe is an honest gap, never a silent no-op or a guess");
  }

  // ── Only "replace" and "add" execute here ─────────────────────────────────
  {
    const port = new InMemoryMealsWritePort();
    const handler = createMealsWriteHandler(async () => port);
    let gapCaught = false;
    try {
      await handler(intent({ mealId: 1 }, "delete"), ctx(226));
    } catch (e) {
      gapCaught = (e as { failureStatus?: string }).failureStatus === "gap";
    }
    assert(gapCaught, "any verb other than \"replace\"/\"add\" is an honest gap — this is not a general-purpose meal editor");
  }

  // ── "add" — a quick meal: just a name, owned by the caller, no fork ──────
  // Field defaults must match quick-meal-page.tsx's own save call exactly —
  // a Companion-created quick meal must be indistinguishable from one the
  // household built by hand on that page.
  {
    const port = new InMemoryMealsWritePort();
    const handler = createMealsWriteHandler(async () => port);
    const result = await handler(
      intent({ name: "Steak and Chips" }, "add"),
      ctx(226),
    ) as { scope: string; mealId: number; name: string };

    assert(result.scope === "add" && result.name === "Steak and Chips", "a quick meal is created with the exact spoken name");
    const created = port.meals.get(result.mealId);
    assert(created?.userId === 226, "the quick meal is owned by the household that asked, never a system meal");
    assert(created?.isSystemMeal === false, "a quick meal is never itself a system meal");
    assert(Array.isArray(created?.ingredients) && created!.ingredients.length === 0, "a quick meal starts with no ingredients — the same empty-parts state the Build-a-Meal page already allows");
  }

  // ── "add" — with dayId + mealSlot, the new quick meal is ALSO placed on the
  // planner in the SAME write. The household never asked for a quick meal in
  // isolation — the original command was "add X to <day> <slot>" — so a bare
  // "yes" confirming the quick-meal offer must complete BOTH halves, not just
  // create an orphaned meal in Cookbook/Meals that never reaches the planner.
  {
    const port = new InMemoryMealsWritePort();
    port.householdByUser.set(226, 1);
    port.days.set(10, fixtureDay({ id: 10, weekId: 1, dayOfWeek: 1 }));
    port.weeks.set(1, fixtureWeek({ id: 1, householdId: 1 }));
    const handler = createMealsWriteHandler(async () => port);
    const result = await handler(
      intent({ name: "Banger and Mash", dayId: 10, mealSlot: "dinner" }, "add"),
      ctx(226),
    ) as { scope: string; mealId: number; name: string; plannerEntryId: number | null };

    assert(result.plannerEntryId !== null, "the quick meal is ALSO placed on the planner, not left orphaned in Cookbook/Meals");
    const placed = port.entries.get(result.plannerEntryId!);
    assert(placed?.dayId === 10 && placed?.mealType === "dinner" && placed?.mealId === result.mealId, "the planner entry points at the day/slot asked for and the newly created meal");
  }

  // ── "add" — without dayId/mealSlot, behaves exactly as before: meal only ──
  {
    const port = new InMemoryMealsWritePort();
    const handler = createMealsWriteHandler(async () => port);
    const result = await handler(
      intent({ name: "Steak and Chips" }, "add"),
      ctx(226),
    ) as { scope: string; mealId: number; plannerEntryId: number | null };

    assert(result.plannerEntryId === null, "no dayId/mealSlot given — creates the quick meal only, same as before this fix");
  }

  // ── "add" — a planner day in a DIFFERENT household is denied, no existence leak ─
  {
    const port = new InMemoryMealsWritePort();
    port.householdByUser.set(226, 1);
    port.days.set(10, fixtureDay({ id: 10, weekId: 1, dayOfWeek: 1 }));
    port.weeks.set(1, fixtureWeek({ id: 1, householdId: 99 })); // a different household owns this day
    const handler = createMealsWriteHandler(async () => port);
    let deniedCaught = false;
    try {
      await handler(intent({ name: "Banger and Mash", dayId: 10, mealSlot: "dinner" }, "add"), ctx(226));
    } catch (e) {
      deniedCaught = (e as { failureStatus?: string }).failureStatus === "denied";
    }
    assert(deniedCaught, "a planner day belonging to another household is denied — no cross-household placement");
    assert(port.meals.size === 0, "the quick meal is never created when the planner placement would be denied");
  }

  // ── "add" — a missing name is an honest gap, never a fabricated placeholder ─
  {
    const port = new InMemoryMealsWritePort();
    const handler = createMealsWriteHandler(async () => port);
    let gapCaught = false;
    try {
      await handler(intent({}, "add"), ctx(226));
    } catch (e) {
      gapCaught = (e as { failureStatus?: string }).failureStatus === "gap";
    }
    assert(gapCaught, "a quick meal with no name is an honest gap, never a fabricated placeholder name");
  }

  console.log("\n══════════════════════════════════════════════════════");
  console.log("COMP3 — Meals Write Handler");
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failed > 0) {
    console.error("\nFailed assertions:");
    failures.forEach((f) => console.error(`  ✗ ${f}`));
    process.exit(1);
  }
  console.log("All tests passed ✓");
}

main().catch((err) => {
  console.error("[test-meals-write-handler] Unexpected error:", err);
  process.exit(1);
});
