/**
 * Food Intelligence Capability Binding (FI3; extended FI4)
 * ============================================================
 * Activates the NINETEENTH live capability on the THA Intelligence Platform: it binds
 * the read-only Food Intelligence handler to the `food-intelligence` capability,
 * flipping its availability from "registered" (metadata only) to "available"
 * (executable). It reuses the exact Port → Handler → Binding pattern proven by every
 * other capability — the platform gains its first Domain Intelligence capability
 * (per THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §2, §7.1) without gaining any
 * new business-domain data ownership (Rule FI1).
 *
 * FI4 extends this SAME capability (not a new one — Rule 8, evolution over
 * replacement) with a third verb, `report`, executing against the sibling Food
 * Opportunity Engine (server/intelligence/food-intelligence/opportunity-engine.ts).
 *
 * The handler delegates to the Food Intelligence Engine and the Food Opportunity
 * Engine via a port built with DYNAMIC imports, so binding here does NOT open a
 * database connection at import time — the engines' owners are only touched on
 * first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createFoodIntelligenceReadHandler } from "../handlers/food-intelligence-read-handler.js";
import {
  createEngineFoodIntelligenceReadPort,
  type FoodIntelligenceReadPort,
} from "../handlers/food-intelligence-read-port.js";

/** The capability id this binding activates. */
export const FOOD_INTELLIGENCE_CAPABILITY_ID = "food-intelligence";

/**
 * The verbs this read-only binding actually executes: `recommend` (the primary
 * join+rank+explain output), `explain` (a single-candidate drill-down), and (FI4)
 * `report` (the caller's own prioritised Food Opportunities). Declared here so the
 * registry can surface truthful executableIntents and discovery cannot
 * over-advertise (INT6A discipline, applied to FI3's new capability and its FI4
 * extension).
 */
export const FOOD_INTELLIGENCE_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["recommend", "explain", "report"];

/**
 * Bind the read-only Food Intelligence handler to a platform.
 *
 * Production: call with only `platform` — the real engine port is used by default.
 * Tests: pass an in-memory port factory as the second argument so the binding and
 * test share the same registration entry point.
 */
export function bindFoodIntelligenceReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<FoodIntelligenceReadPort> = createEngineFoodIntelligenceReadPort,
): void {
  platform.registerHandler(
    FOOD_INTELLIGENCE_CAPABILITY_ID,
    createFoodIntelligenceReadHandler(resolvePort),
    FOOD_INTELLIGENCE_EXECUTABLE_INTENTS,
  );
}
