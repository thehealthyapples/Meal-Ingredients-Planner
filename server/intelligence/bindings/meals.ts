/**
 * Meals Capability Binding (INT15)
 * ===================================
 * Activates the NINTH live capability on the THA Intelligence Platform: it binds the
 * read-only Meals handler to the `meals` capability, flipping its availability from
 * "registered" (metadata only) to "available" (executable). It reuses the exact
 * Port → Handler → Binding pattern proven by the Planner (INT2), Shopping (INT3),
 * Nutrition / Knowledge (INT4), Pantry (INT8), Diary (INT10), Profile (INT12),
 * Household (INT13), and Partners (INT14) — the platform gains a ninth live owner
 * without gaining any meals/recipe logic.
 *
 * The handler delegates to the real owning service (storage) via a port built with
 * DYNAMIC imports, so binding here does NOT open a database connection at import time —
 * the owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createMealsReadHandler } from "../handlers/meals-read-handler.js";
import { createStorageMealsReadPort, type MealsReadPort } from "../handlers/meals-read-port.js";

/** The capability id this binding activates. */
export const MEALS_CAPABILITY_ID = "meals";

/**
 * The verbs this binding actually executes. "read" (scopes: list / summary / detail)
 * and "search" (name + ingredient filter over caller-scoped meals + system meals —
 * INT25 resolves the INT15 open decision by using the already-scoped `getMeals` /
 * `getSystemMeals` port methods rather than the unsafe `lookupMeals`). "explain" (no
 * stored rationale on a meal), "recommend" (ranking lives inline at the route layer),
 * and every write verb remain allow-listed on the capability but return an honest gap.
 * Declared here so the registry can surface truthful executableIntents and discovery
 * cannot over-advertise (INT6A).
 */
export const MEALS_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "search"];

/**
 * Bind the read-only Meals handler to a platform.
 *
 * Production: call with only `platform` — the real storage port is used by default.
 * Tests: pass an in-memory port factory as the second argument so the binding and
 * test share the same registration entry point (INT6B recommendation C4).
 */
export function bindMealsReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<MealsReadPort> = createStorageMealsReadPort,
): void {
  platform.registerHandler(
    MEALS_CAPABILITY_ID,
    createMealsReadHandler(resolvePort),
    MEALS_EXECUTABLE_INTENTS,
  );
}
