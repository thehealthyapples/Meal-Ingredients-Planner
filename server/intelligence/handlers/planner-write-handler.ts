/**
 * Planner Write Handler (INT40 — Companion Task Delegation & Assisted Actions)
 * ==============================================================================
 * The SECOND write execution path bound to the THA Intelligence Platform (after
 * Shopping — see shopping-write-handler.ts). It makes the `add` verb on the `planner`
 * capability executable, by delegating to the existing Planner owner
 * (`storage.addPlannerEntry`) through a {@link PlannerWritePort}.
 *
 * OWNERSHIP CHECKS ARE REPLICATED, NOT REINVENTED: this handler performs EXACTLY the
 * same sequence `POST /api/planner/days/:dayId/items` performs in server/routes.ts —
 * day exists → the day's week belongs to the caller's household → the meal is either a
 * system meal or owned by the caller — before calling addPlannerEntry. This is the same
 * discipline every existing read binding already follows (e.g. planner-read-handler.ts
 * replicates the route's ownership check rather than relaxing it).
 *
 * HARD BOUNDARIES:
 *   • ONE VERB. Only "add" executes here.
 *   • NO DAY IS EVER GUESSED. dayId, mealId and mealSlot must all be supplied as
 *     resolved parameters (from surface context, never invented) — a missing one is an
 *     honest gap. This handler never resolves "today" or "Saturday" itself; that
 *     resolution is the caller's (companion-actions.ts's) responsibility, gated by
 *     already-known surface hints only.
 *   • DELEGATION ONLY. No planner business rule is re-implemented here.
 *   • CONFIRMATION IS ALREADY ENFORCED UPSTREAM by the Intent Engine's CONFIRM step.
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

/**
 * Create the planner write handler. `resolvePort` provides the owning-service surface
 * (production: real storage + household service; tests: in-memory owner).
 */
export function createPlannerWriteHandler(
  resolvePort: () => Promise<PlannerWritePort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    if (intent.verb !== "add") {
      throw gap(
        `Planner is bound to the Intelligence Platform for write ONLY on "add": "${intent.verb}" is not executable via the platform yet.`,
      );
    }
    const userId = requireUserId(context, "Planner");
    const port = await resolvePort();
    return handleAdd(intent, userId, port);
  };
}
