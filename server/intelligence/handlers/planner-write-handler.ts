/**
 * Planner Write Handler (INT40 — Companion Task Delegation & Assisted Actions;
 * COMP_ACT1 adds `move` + `replace`)
 * ==============================================================================
 * The SECOND write execution path bound to the THA Intelligence Platform (after
 * Shopping — see shopping-write-handler.ts). It makes the `add`, `move` and `replace`
 * verbs on the `planner` capability executable, by delegating to the existing Planner
 * owner (`storage.addPlannerEntry` / `storage.updatePlannerEntryLocation` /
 * `storage.replacePlannerEntryMeal`) through a {@link PlannerWritePort}.
 *
 * OWNERSHIP CHECKS ARE REPLICATED, NOT REINVENTED: each verb performs EXACTLY the same
 * sequence its equivalent route performs in server/routes.ts —
 *   • add     → `POST /api/planner/days/:dayId/items`
 *   • move    → `PATCH /api/planner/entries/:entryId` (location branch)
 *   • replace → `PATCH /api/planner/entries/:entryId/meal`
 * i.e. entry/day exists → the day's week belongs to the caller's household → (for a
 * meal target) the meal is a system meal or owned by the caller — before the write.
 * This is the same discipline every existing read binding follows.
 *
 * HARD BOUNDARIES:
 *   • THREE VERBS. Only "add", "move" and "replace" execute here; anything else is an
 *     honest gap.
 *   • NOTHING IS EVER GUESSED. dayId / entryId / mealId / mealSlot must all be supplied
 *     as resolved parameters (from surface context, never invented) — a missing one is
 *     an honest gap. This handler never resolves "today" or "Saturday" itself.
 *   • DELEGATION ONLY. No planner business rule is re-implemented here.
 *   • CONFIRMATION IS ALREADY ENFORCED UPSTREAM by the Intent Engine's CONFIRM step
 *     (add → light, move/replace → required, server-resolved in permissions.ts).
 */

import {
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { PlannerWritePort } from "./planner-write-port.js";
import { toInt, requireUserId, gap, denied } from "./_read-kit.js";
import type { PlannerEntry } from "@shared/schema";

const VALID_MEAL_SLOTS = new Set(["breakfast", "lunch", "dinner", "snacks"]);

/** The result of a successful "add" — the stored entry the owner returned. */
export interface PlannerAddResult {
  readonly scope: "add";
  readonly entry: {
    readonly id: number;
    readonly dayId: number;
    readonly mealType: string;
    readonly mealId: number | null;
  };
}

function toResult(entry: PlannerEntry): PlannerAddResult {
  return {
    scope: "add",
    entry: {
      id: entry.id,
      dayId: entry.dayId,
      mealType: entry.mealType,
      mealId: entry.mealId,
    },
  };
}

async function handleAdd(
  intent: Intent,
  userId: number,
  port: PlannerWritePort,
): Promise<PlannerAddResult> {
  const params = intent.parameters ?? {};
  const dayId = toInt(params.dayId);
  const mealId = toInt(params.mealId);
  const mealSlot = typeof params.mealSlot === "string" ? params.mealSlot : undefined;

  if (dayId === undefined || mealId === undefined || !mealSlot) {
    throw gap(
      'Adding a meal to the planner needs { dayId, mealId, mealSlot } — all resolved from ' +
        'context the platform already has. The Intelligence Platform never guesses which day.',
    );
  }
  if (!VALID_MEAL_SLOTS.has(mealSlot)) {
    throw gap(`Unsupported mealSlot ${JSON.stringify(mealSlot)}. Supported: breakfast, lunch, dinner, snacks.`);
  }
  const audience = typeof params.audience === "string" && params.audience.trim() ? params.audience.trim() : "adult";
  const position = toInt(params.position);
  const calories = toInt(params.calories);
  const isDrink = typeof params.isDrink === "boolean" ? params.isDrink : false;
  const drinkType = typeof params.drinkType === "string" ? params.drinkType : null;

  // Replicate the route's ownership sequence exactly — no existence leak across households.
  const day = await port.getPlannerDay(dayId);
  if (!day) throw denied("Planner day not found in your own household (no cross-household access).");
  const week = await port.getPlannerWeek(day.weekId);
  const householdId = await port.getHouseholdForUser(userId);
  if (!week || week.householdId !== householdId) {
    throw denied("Planner day not found in your own household (no cross-household access).");
  }

  const meal = await port.getMeal(mealId);
  if (!meal || (!meal.isSystemMeal && meal.userId !== userId)) {
    throw denied("Meal not found or not accessible to you (must be a system meal or your own).");
  }

  const entry = await port.addPlannerEntry(
    day.id,
    mealSlot,
    audience,
    mealId,
    position ?? 0,
    calories ?? 0,
    isDrink,
    drinkType,
  );
  return toResult(entry);
}

/** The result of a successful "move" — the relocated entry the owner returned. */
export interface PlannerMoveResult {
  readonly scope: "move";
  readonly entry: {
    readonly id: number;
    readonly dayId: number;
    readonly mealType: string;
    readonly mealId: number | null;
  };
}

/** The result of a successful "replace" — the entry with its new meal. */
export interface PlannerReplaceResult {
  readonly scope: "replace";
  readonly entry: {
    readonly id: number;
    readonly dayId: number;
    readonly mealType: string;
    readonly mealId: number | null;
  };
}

/**
 * Resolve an existing entry AND assert it belongs to the caller's household — the exact
 * ownership sequence `PATCH /api/planner/entries/:entryId` and `.../meal` use. Returns
 * the entry on success; throws a `denied` honest gap otherwise (no existence leak: a
 * missing entry and a foreign-household entry are indistinguishable to the caller).
 */
async function resolveOwnedEntry(entryId: number, userId: number, port: PlannerWritePort): Promise<PlannerEntry> {
  const entry = await port.getPlannerEntryById(entryId);
  if (!entry) throw denied("Planner entry not found in your own household (no cross-household access).");
  const day = await port.getPlannerDay(entry.dayId);
  if (!day) throw denied("Planner entry not found in your own household (no cross-household access).");
  const week = await port.getPlannerWeek(day.weekId);
  const householdId = await port.getHouseholdForUser(userId);
  if (!week || week.householdId !== householdId) {
    throw denied("Planner entry not found in your own household (no cross-household access).");
  }
  return entry;
}

async function handleMove(
  intent: Intent,
  userId: number,
  port: PlannerWritePort,
): Promise<PlannerMoveResult> {
  const params = intent.parameters ?? {};
  const entryId = toInt(params.entryId);
  const dayId = toInt(params.dayId);
  const mealSlot = typeof params.mealSlot === "string" ? params.mealSlot : undefined;

  if (entryId === undefined || dayId === undefined || !mealSlot) {
    throw gap(
      'Moving a planner entry needs { entryId, dayId, mealSlot } — all resolved from context ' +
        'the platform already has. The Intelligence Platform never guesses which entry or day.',
    );
  }
  if (!VALID_MEAL_SLOTS.has(mealSlot)) {
    throw gap(`Unsupported mealSlot ${JSON.stringify(mealSlot)}. Supported: breakfast, lunch, dinner, snacks.`);
  }
  const position = toInt(params.position) ?? 0;

  // Ownership of the entry being moved (replicates PATCH /entries/:id).
  await resolveOwnedEntry(entryId, userId, port);
  // Ownership of the TARGET day (the route re-checks the destination household too).
  const targetDay = await port.getPlannerDay(dayId);
  if (!targetDay) throw denied("Target planner day not found in your own household (no cross-household access).");
  const targetWeek = await port.getPlannerWeek(targetDay.weekId);
  const householdId = await port.getHouseholdForUser(userId);
  if (!targetWeek || targetWeek.householdId !== householdId) {
    throw denied("Target planner day not found in your own household (no cross-household access).");
  }

  const updated = await port.updatePlannerEntryLocation(entryId, dayId, mealSlot, position);
  if (!updated) throw gap("The Planner could not move that entry (it may no longer exist).");
  return {
    scope: "move",
    entry: { id: updated.id, dayId: updated.dayId, mealType: updated.mealType, mealId: updated.mealId },
  };
}

async function handleReplace(
  intent: Intent,
  userId: number,
  port: PlannerWritePort,
): Promise<PlannerReplaceResult> {
  const params = intent.parameters ?? {};
  const entryId = toInt(params.entryId);
  const mealId = toInt(params.mealId);
  if (entryId === undefined || mealId === undefined) {
    throw gap(
      'Replacing a planner entry\'s meal needs { entryId, mealId } — both resolved from context ' +
        'the platform already has. The Intelligence Platform never guesses the replacement.',
    );
  }

  // Ownership of the entry (replicates PATCH /entries/:id/meal).
  await resolveOwnedEntry(entryId, userId, port);
  // The replacement meal must be a system meal or owned by the caller (route's exact check).
  const meal = await port.getMeal(mealId);
  if (!meal || (!meal.isSystemMeal && meal.userId !== userId)) {
    throw denied("Meal not found or not accessible to you (must be a system meal or your own).");
  }

  const updated = await port.replacePlannerEntryMeal(entryId, mealId);
  if (!updated) throw gap("The Planner could not replace that entry's meal (it may no longer exist).");
  return {
    scope: "replace",
    entry: { id: updated.id, dayId: updated.dayId, mealType: updated.mealType, mealId: updated.mealId },
  };
}

/**
 * Create the planner write handler. `resolvePort` provides the owning-service surface
 * (production: real storage + household service; tests: in-memory owner). Executes the
 * three write verbs bound at COMP_ACT1; any other verb is an honest gap.
 */
export function createPlannerWriteHandler(
  resolvePort: () => Promise<PlannerWritePort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    if (intent.verb !== "add" && intent.verb !== "move" && intent.verb !== "replace") {
      throw gap(
        `Planner is bound to the Intelligence Platform for write on "add", "move" and "replace": ` +
          `"${intent.verb}" is not executable via the platform yet.`,
      );
    }
    const userId = requireUserId(context, "Planner");
    const port = await resolvePort();
    if (intent.verb === "move") return handleMove(intent, userId, port);
    if (intent.verb === "replace") return handleReplace(intent, userId, port);
    return handleAdd(intent, userId, port);
  };
}
