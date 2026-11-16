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
import type { CapabilityHandler, Intent, IntelligenceContext, IntentVerb } from "../types.js";
import { createMealsReadHandler } from "../handlers/meals-read-handler.js";
import { createStorageMealsReadPort, type MealsReadPort } from "../handlers/meals-read-port.js";
import { createMealsWriteHandler } from "../handlers/meals-write-handler.js";
import { createStorageMealsWritePort, type MealsWritePort } from "../handlers/meals-write-port.js";

/** The capability id this binding activates. */
export const MEALS_CAPABILITY_ID = "meals";

/**
 * The verbs this binding actually executes. "read" (scopes: list / summary / detail)
 * and "search" (name + ingredient filter over caller-scoped meals + system meals —
 * INT25 resolves the INT15 open decision by using the already-scoped `getMeals` /
 * `getSystemMeals` port methods rather than the unsafe `lookupMeals`). "explain" (no
 * stored rationale on a meal), "recommend" (ranking lives inline at the route layer),
 * and "generate"/"delete"/"import"/"share" remain allow-listed on the capability
 * but return an honest gap. "replace" (COMP3 — the FIRST write verb this capability
 * executes) persists a Companion-offered dietary substitution to the caller's own
 * saved copy of a recipe. "add" (COMP3 — quick meals) creates a bare, caller-owned
 * meal from just a name when the Companion couldn't find one by that name, through
 * the exact same owning-service call the existing "Build a Meal" page already uses.
 * Both are confirmed exactly like every other write proposal. Declared here so the
 * registry can surface truthful executableIntents and discovery cannot over-advertise
 * (INT6A).
 */
export const MEALS_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "search", "replace", "add"];

/** The write verbs the write handler owns (COMP3: replace + add). */
const MEALS_WRITE_VERBS: ReadonlySet<IntentVerb> = new Set<IntentVerb>(["replace", "add"]);

/** Compose the read and write handlers into one capability-level dispatcher. */
function composeMealsHandler(
  readHandler: CapabilityHandler,
  writeHandler: CapabilityHandler,
): CapabilityHandler {
  return (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    if (MEALS_WRITE_VERBS.has(intent.verb)) return writeHandler(intent, context);
    return readHandler(intent, context);
  };
}

/**
 * Bind the composed (read + COMP3 write) Meals handler to a platform.
 *
 * Production: call with only `platform` — the real storage ports are used by default.
 * Tests: pass in-memory port factories so the binding and test share the same
 * registration entry point (INT6B recommendation C4).
 */
export function bindMealsReadCapability(
  platform: IntelligencePlatform,
  resolveReadPort: () => Promise<MealsReadPort> = createStorageMealsReadPort,
  resolveWritePort: () => Promise<MealsWritePort> = createStorageMealsWritePort,
): void {
  platform.registerHandler(
    MEALS_CAPABILITY_ID,
    composeMealsHandler(
      createMealsReadHandler(resolveReadPort),
      createMealsWriteHandler(resolveWritePort),
    ),
    MEALS_EXECUTABLE_INTENTS,
  );
}
