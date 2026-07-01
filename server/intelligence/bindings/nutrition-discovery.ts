/**
 * Nutrition Discovery Capability Binding (INT27)
 * ================================================
 * Activates the THIRTEENTH live capability on the THA Intelligence Platform: it binds
 * the read-only Nutrition Discovery handler to the `nutrition-discovery` capability,
 * flipping its availability from "registered" to "available" (executable).
 *
 * The handler delegates to NutritionDiscoveryEngine via a port built with DYNAMIC
 * imports, so binding here does NOT open a database connection at import time.
 *
 * Idempotent: binding twice simply re-binds the same handler.
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createNutritionDiscoveryHandler } from "../handlers/nutrition-discovery-handler.js";
import {
  createProductionNutritionDiscoveryPort,
  type NutritionDiscoveryPort,
} from "../handlers/nutrition-discovery-port.js";

export const NUTRITION_DISCOVERY_CAPABILITY_ID = "nutrition-discovery";

/**
 * The verbs this binding actually executes. "search" has a live code path.
 * "recommend" is in supportedIntents (architecture-declared) but is NOT here —
 * it returns an honest gap until a delegate-only ranking method exists.
 */
export const NUTRITION_DISCOVERY_BINDING_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["search"];

/**
 * Bind the Nutrition Discovery handler to a platform.
 *
 * Production: call with only `platform`.
 * Tests: pass an in-memory port factory as the second argument.
 */
export function bindNutritionDiscoveryCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<NutritionDiscoveryPort> = createProductionNutritionDiscoveryPort,
): void {
  platform.registerHandler(
    NUTRITION_DISCOVERY_CAPABILITY_ID,
    createNutritionDiscoveryHandler(resolvePort),
    NUTRITION_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  );
}
