/**
 * Meal Discovery Capability Binding (INT26)
 * ==========================================
 * Activates the TWELFTH live capability on the THA Intelligence Platform: it binds
 * the Meal Discovery handler to the `meal-discovery` capability, flipping its
 * availability from "registered" (metadata only) to "available" (executable). It
 * reuses the exact Port → Handler → Binding pattern proven by the Planner (INT2),
 * Shopping (INT3), Nutrition / Knowledge (INT4), Pantry (INT8), Diary (INT10),
 * Profile (INT12), Household (INT13), Partners (INT14), Meals (INT15), Templates
 * (INT16), and Analyser (INT17) — the platform gains a twelfth live owner without
 * gaining any meal-discovery logic.
 *
 * The handler delegates to MealDiscoveryEngine (real storage in production) via a
 * port built with DYNAMIC imports, so binding here does NOT open a database
 * connection at import time — the engine is only touched on first invocation.
 *
 * Phase 1 (this binding): internal sources only — personal library, THA system
 * meals, meal templates. No external API calls. No schema changes.
 *
 * Idempotent: binding twice simply re-binds the same handler.
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createMealDiscoveryHandler, MEAL_DISCOVERY_EXECUTABLE_INTENTS } from "../handlers/meal-discovery-handler.js";
import { createProductionMealDiscoveryPort, type MealDiscoveryPort } from "../handlers/meal-discovery-port.js";

/** The capability id this binding activates. */
export const MEAL_DISCOVERY_CAPABILITY_ID = "meal-discovery";

/**
 * The verbs this binding actually executes. Only `search` in Phase 1.
 * `recommend` is registered on the capability but remains a gap until a
 * delegate-only ranking method exists in MealDiscoveryEngine (INT26 design §4).
 */
export const MEAL_DISCOVERY_BINDING_EXECUTABLE_INTENTS: readonly IntentVerb[] =
  MEAL_DISCOVERY_EXECUTABLE_INTENTS as unknown as IntentVerb[];

/**
 * Bind the Meal Discovery handler to a platform.
 *
 * Production: call with only `platform` — the real engine port is used by default.
 * Tests: pass an in-memory port factory as the second argument so the binding and
 * test share the same registration entry point (INT6B recommendation C4).
 */
export function bindMealDiscoveryCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<MealDiscoveryPort> = createProductionMealDiscoveryPort,
): void {
  platform.registerHandler(
    MEAL_DISCOVERY_CAPABILITY_ID,
    createMealDiscoveryHandler(resolvePort),
    MEAL_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  );
}
