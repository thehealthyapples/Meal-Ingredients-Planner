/**
 * Meals Write Handler (COMP3 — Companion-offered dietary substitution + quick meals)
 * ========================================================================
 * Makes two write verbs on the `meals` capability executable:
 *
 *   • "replace" — the household confirmed a Companion-offered ingredient swap
 *     (e.g. "gluten-free Worcestershire sauce" for "1tbsp worcestershire
 *     sauce") and this persists it to the CALLER'S OWN copy of the recipe,
 *     never a shared or another household's row.
 *   • "add" — the household confirmed creating a bare "quick meal" (just a
 *     name) after the Companion could not find a saved meal by that name.
 *     This does NOT invent a new meal-creation concept: it calls the exact
 *     same owning-service method, with the exact same field defaults, as the
 *     existing "Build a Meal" page (`client/src/pages/quick-meal-page.tsx`)
 *     already uses to save a meal with zero parts.
 *
 * OWNERSHIP CHECK AND FORK SEQUENCE ARE REPLICATED, NOT REINVENTED: "replace"
 * is exactly the sequence `POST /api/uplift/accept` already performs in
 * server/routes.ts — meal exists → owned by the caller or is a system meal →
 * (system meal only) fork to a new user-owned row before any mutation. A meal
 * that is already the caller's own is edited in place; the household's planner
 * entries elsewhere that point at the SYSTEM original are intentionally left
 * untouched — this verb changes what the caller's own copy says, nothing else.
 *
 * HARD BOUNDARIES:
 *   • TWO VERBS. Only "replace" and "add" execute here; this is the FIRST
 *     write access of any kind ever bound on `meals` — "read"/"search" remain
 *     the read handler's exclusively.
 *   • NOTHING IS EVER GUESSED. Every parameter (mealId / ingredient /
 *     replacement / name) must be supplied as already-resolved, never
 *     invented here — a missing one is an honest gap.
 *   • EXACT-INGREDIENT MATCH ONLY (replace). The ingredient LINE edited must
 *     appear verbatim in the meal's own ingredient list — never a substring
 *     or fuzzy match, which could silently rewrite the wrong line in a longer
 *     recipe. WITHIN that one located line, only the flagged word(s)
 *     (`matchedTerm`, e.g. "worcestershire sauce") are swapped for the
 *     replacement — never the whole line — so a measure like "1tbsp" is
 *     never silently dropped.
 *   • A QUICK MEAL IS A REAL, OWNED MEAL FROM THE MOMENT IT EXISTS (add). It
 *     is never a system meal, never flagged ready-made, and carries no
 *     ingredients the household didn't actually provide — exactly the empty-
 *     parts state the existing "Build a Meal" page already allows.
 *   • CONFIRMATION IS ALREADY ENFORCED UPSTREAM by the Intent Engine's CONFIRM
 *     step ("replace" → required, "add" → light, server-resolved in
 *     permissions.ts).
 */

import {
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { MealsWritePort } from "./meals-write-port.js";
import { toInt, requireUserId, gap, denied } from "./_read-kit.js";

/** The result of a successful "replace" — the meal the household now has, post-edit. */
export interface MealsReplaceResult {
  readonly scope: "replace";
  readonly mealId: number;
  readonly forkedFromMealId: number | null;
}

/**
 * Swap only the flagged word(s) within one ingredient line, never the whole
 * line. `matchedTerm` (e.g. "worcestershire sauce") is searched case-
 * insensitively inside `line` (e.g. "1tbsp worcestershire sauce"); everything
 * else on the line — the quantity above all — is left exactly as it was. If
 * `matchedTerm` is absent or genuinely isn't present in this line (the
 * resolved conflict and the line fell out of sync between turns), the whole
 * line is replaced instead — a visibly complete fix beats a silent no-op.
 */
function applyWithinLine(line: string, matchedTerm: string | null, replacement: string): string {
  if (matchedTerm) {
    const escaped = matchedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");
    if (re.test(line)) return line.replace(re, replacement);
  }
  return replacement;
}

async function handleReplace(
  intent: Intent,
  userId: number,
  port: MealsWritePort,
): Promise<MealsReplaceResult> {
  const params = intent.parameters ?? {};
  const mealId = toInt(params.mealId);
  const ingredient = typeof params.ingredient === "string" ? params.ingredient.trim() : "";
  const matchedTerm = typeof params.matchedTerm === "string" && params.matchedTerm.trim() ? params.matchedTerm.trim() : null;
  const replacement = typeof params.replacement === "string" ? params.replacement.trim() : "";

  if (mealId === undefined || !ingredient || !replacement) {
    throw gap(
      'Updating a saved recipe needs { mealId, ingredient, replacement } — all resolved from ' +
        'the conflict already found. The Intelligence Platform never invents which line to change.',
    );
  }

  // Replicate the uplift-accept route's exact ownership sequence — no existence
  // leak across households: a meal that does not exist and a meal that exists
  // but is not the caller's both return the SAME denial.
  let meal = await port.getMeal(mealId);
  if (!meal) throw denied("Meal not found. The Intelligence Platform never confirms or denies the existence of another user's private meal.");
  if (meal.userId !== userId && !meal.isSystemMeal) {
    throw denied("Meal not found. The Intelligence Platform never confirms or denies the existence of another user's private meal.");
  }

  const matchIndex = meal.ingredients.findIndex((i) => i === ingredient);
  if (matchIndex === -1) {
    throw gap(
      `"${ingredient}" is no longer on this recipe's ingredient list — it may already have been changed. ` +
        "Nothing was updated.",
    );
  }

  let forkedFromMealId: number | null = null;

  // Fork system meals to a user-private copy before any mutation — the
  // household's own planner entries that already point at the SYSTEM meal are
  // deliberately left alone; only a future add resolves to the new fork.
  if (meal.isSystemMeal) {
    const { buildForkName } = await import("../../lib/uplift-persistence.js");
    const forked = await port.createMeal(userId, {
      name: buildForkName(meal.name),
      ingredients: [...meal.ingredients],
      instructions: meal.instructions ?? [],
      servings: meal.servings,
      categoryId: meal.categoryId ?? undefined,
      sourceUrl: meal.sourceUrl ?? undefined,
      mealSourceType: meal.mealSourceType,
      isReadyMeal: meal.isReadyMeal,
      isSystemMeal: false,
      mealFormat: meal.mealFormat,
      dietTypes: meal.dietTypes,
      isFreezerEligible: meal.isFreezerEligible,
      audience: meal.audience,
      isDrink: meal.isDrink,
      drinkType: meal.drinkType ?? undefined,
      barcode: meal.barcode ?? undefined,
      brand: meal.brand ?? undefined,
      originalMealId: meal.id,
      kind: meal.kind,
    });
    forkedFromMealId = meal.id;
    meal = forked;
  }

  const updatedIngredients = meal.ingredients.map((i) => (i === ingredient ? applyWithinLine(i, matchedTerm, replacement) : i));
  const updated = await port.updateMeal(meal.id, { ingredients: updatedIngredients });
  if (!updated) throw gap("The Meals service could not update that recipe (it may no longer exist).");

  return { scope: "replace", mealId: updated.id, forkedFromMealId };
}

/** The result of a successful "add" — the new quick meal the household now has. */
export interface MealsAddResult {
  readonly scope: "add";
  readonly mealId: number;
  readonly name: string;
  /** Set only when `dayId` + `mealSlot` were given and the planner placement also succeeded. */
  readonly plannerEntryId: number | null;
}

const VALID_MEAL_SLOTS = new Set(["breakfast", "lunch", "dinner", "snacks"]);

/**
 * Create a bare "quick meal" — just a name, no ingredients. Field defaults
 * match `quick-meal-page.tsx`'s own save call EXACTLY (same `mealFormat`,
 * `mealSourceType`, `servings`, flags) — a Companion-created quick meal must
 * be indistinguishable from one the household built by hand on that page.
 *
 * The household never asked for a quick meal in isolation — the ORIGINAL
 * command was always "add <meal> to <day> <slot>"; the quick-meal offer is
 * just the fallback for when that name isn't a saved recipe yet. So when the
 * resolver also hands over `dayId` + `mealSlot` (it resolved those from the
 * same command before asking), this single confirmed "add" completes BOTH
 * halves of what was actually asked — create the meal, then place it — in
 * one write, replicating the exact ownership sequence `planner-write-handler`
 * uses for its own "add" so a quick meal is never placed into another
 * household's day.
 */
async function handleAdd(
  intent: Intent,
  userId: number,
  port: MealsWritePort,
): Promise<MealsAddResult> {
  const params = intent.parameters ?? {};
  const name = typeof params.name === "string" ? params.name.trim() : "";

  if (!name) {
    throw gap(
      'Adding a quick meal needs { name } — resolved from the household\'s own words, never invented here.',
    );
  }

  const dayId = toInt(params.dayId);
  const mealSlot = typeof params.mealSlot === "string" ? params.mealSlot : undefined;
  const wantsPlacement = dayId !== undefined || !!mealSlot;

  // Verify planner ownership BEFORE creating anything — a denied placement
  // must never leave behind an orphaned quick meal nobody asked for on its own.
  let day: Awaited<ReturnType<MealsWritePort["getPlannerDay"]>> | undefined;
  if (wantsPlacement) {
    if (dayId === undefined || !mealSlot) {
      throw gap(
        'Placing a quick meal on the planner needs BOTH { dayId, mealSlot } — a partial pair is an honest gap, never a half-placed guess.',
      );
    }
    if (!VALID_MEAL_SLOTS.has(mealSlot)) {
      throw gap(`Unsupported mealSlot ${JSON.stringify(mealSlot)}. Supported: breakfast, lunch, dinner, snacks.`);
    }
    day = await port.getPlannerDay(dayId);
    if (!day) throw denied("Planner day not found in your own household (no cross-household access).");
    const week = await port.getPlannerWeek(day.weekId);
    const householdId = await port.getHouseholdForUser(userId);
    if (!week || week.householdId !== householdId) {
      throw denied("Planner day not found in your own household (no cross-household access).");
    }
  }

  const created = await port.createMeal(userId, {
    name,
    ingredients: [],
    instructions: [],
    mealFormat: "grouped",
    mealSourceType: "scratch",
    servings: 1,
    isReadyMeal: false,
    isSystemMeal: false,
    isDrink: false,
    isFreezerEligible: true,
    audience: "adult",
    dietTypes: [],
  });

  if (!day || !mealSlot) {
    return { scope: "add", mealId: created.id, name: created.name, plannerEntryId: null };
  }

  const entry = await port.addPlannerEntry(day.id, mealSlot, "adult", created.id, 0, 0, false, null);
  return { scope: "add", mealId: created.id, name: created.name, plannerEntryId: entry.id };
}

/**
 * Create the meals write handler. `resolvePort` provides the owning-service surface
 * (production: real storage; tests: in-memory owner). Executes the two write verbs
 * bound at COMP3; any other verb is an honest gap.
 */
export function createMealsWriteHandler(
  resolvePort: () => Promise<MealsWritePort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    if (intent.verb !== "replace" && intent.verb !== "add") {
      throw gap(
        `Meals is bound to the Intelligence Platform for write on "replace" and "add" only: ` +
          `"${intent.verb}" is not executable via the platform yet.`,
      );
    }
    const userId = requireUserId(context, "Meals");
    const port = await resolvePort();
    if (intent.verb === "add") return handleAdd(intent, userId, port);
    return handleReplace(intent, userId, port);
  };
}
