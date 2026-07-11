/**
 * Uplift Read Handler (INT42 — twenty-second live capability binding)
 * ======================================================================
 * Makes the `uplift` capability executable for the `recommend` verb, by
 * delegating every request to the existing Nutrition Uplift Engine
 * (SoT Domain 17) through an {@link UpliftReadPort}. This is the platform's
 * FIRST binding of a pre-existing, non-Intelligence-Platform domain engine
 * that today is only reachable via `POST /api/uplift/batch` — INT42 gives it
 * a second, read-only, single-meal entry point so it can be composed
 * alongside `meals` in a Companion turn (see
 * docs/implementation/intelligence/INT42_CAPABILITY_COMPOSITION_FOUNDATION.md).
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • READ-ONLY, ONE VERB. Only `recommend` executes. Accepting or removing a
 *     suggestion (the existing `POST /api/uplift/accept` /
 *     `DELETE /api/uplift/applications/:id` routes) is a WRITE against
 *     `meal_uplift_applications` — that remains the exclusive property of
 *     those existing routes; this binding never proposes, and never could,
 *     since it declares no write verb.
 *   • DELEGATION ONLY. All matching happens in the Uplift Engine via the
 *     port. This file contains NO rule authoring, NO scoring, and NO
 *     nutrition-tag reasoning of its own — it projects the engine's
 *     already-computed, already-cited suggestions verbatim.
 *   • OWNERSHIP CHECK REPLICATED, NOT DELEGATED. Identical to the Meals
 *     binding (`meals-read-handler.ts`) and for the same reason:
 *     `storage.getMeal` has no ownership filter. This handler replicates the
 *     exact same check — a meal that does not exist and a meal that exists
 *     but is not the caller's (and not a system meal) both return the SAME
 *     denial, with the SAME message, never leaking existence.
 *   • HONEST GAPS. A missing `mealId`, a meal with no matching Uplift rule,
 *     is a structured honest gap — never a fabricated suggestion.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { UpliftReadPort } from "./uplift-read-port.js";
import type { UpliftMatchResult } from "../../lib/uplift-types.js";
import { toInt, requireUserId, gap, denied, readOnlyVerbGuard } from "./_read-kit.js";

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

export interface UpliftRecommendResult {
  readonly mealId: number;
  readonly mealName: string;
  readonly matches: readonly UpliftMatchResult[];
  readonly source: "uplift-engine";
}

const DENIED_MESSAGE =
  "Meal not found. The Intelligence Platform never confirms or denies the existence of " +
  "another user's private meal — this message is identical whether the id does not exist " +
  "or belongs to someone else.";

// ---------------------------------------------------------------------------
// Verb implementation
// ---------------------------------------------------------------------------

async function handleRecommend(
  intent: Intent,
  userId: number,
  port: UpliftReadPort,
): Promise<UpliftRecommendResult> {
  const params = intent.parameters ?? {};
  const mealId = toInt(params.mealId);
  if (mealId === undefined) {
    throw gap("A Nutrition Boost recommendation needs a { mealId } parameter (a positive integer).");
  }

  const meal = await port.getMeal(mealId);
  // Mirrors meals-read-handler.ts exactly: a missing meal and a meal owned by
  // someone else (and not a system meal) produce the SAME outcome, with the
  // SAME message — never leaking whether a given id exists.
  if (!meal || (meal.userId !== userId && !meal.isSystemMeal)) {
    throw denied(DENIED_MESSAGE);
  }

  const matches = port.matchMeal({
    mealName: meal.name,
    ingredients: meal.ingredients,
    dietTypes: meal.dietTypes,
  });

  if (matches.length === 0) {
    throw gap(
      `Honest gap: no reviewed Nutrition Boost rule matches ${JSON.stringify(meal.name)} today. ` +
        "The Uplift Engine will not fabricate a suggestion for a meal it has no rule for.",
    );
  }

  return {
    mealId: meal.id,
    mealName: meal.name,
    matches,
    source: "uplift-engine",
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the Uplift read-only handler. `resolvePort` provides the owning
 * surface (production: real storage + the real Uplift Engine; tests: an
 * in-memory owner). The returned handler is what the Capability Registry
 * binds to the `uplift` capability (INT42).
 */
export function createUpliftReadHandler(
  resolvePort: () => Promise<UpliftReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, ["recommend"], "Uplift");

    const userId = requireUserId(context, "Uplift");
    const port = await resolvePort();
    return handleRecommend(intent, userId, port);
  };
}
