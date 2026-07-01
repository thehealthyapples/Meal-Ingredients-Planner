/**
 * Planner Discovery Capability Binding (INT28)
 * ==============================================
 * Activates the FOURTEENTH live capability on the THA Intelligence Platform.
 * Binds the Planner Discovery handler to the `planner-discovery` capability,
 * flipping its availability from "registered" to "available".
 *
 * Reuses the Port → Handler → Binding pattern (INT2–INT27). The platform gains
 * a fourteenth live owner without gaining any planner-discovery logic.
 *
 * Idempotent: binding twice simply re-binds the same handler.
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createPlannerDiscoveryHandler, PLANNER_DISCOVERY_EXECUTABLE_INTENTS } from "../handlers/planner-discovery-handler.js";
import { createProductionPlannerDiscoveryPort, type PlannerDiscoveryPort } from "../handlers/planner-discovery-port.js";

export const PLANNER_DISCOVERY_CAPABILITY_ID = "planner-discovery";

export const PLANNER_DISCOVERY_BINDING_EXECUTABLE_INTENTS: readonly IntentVerb[] =
  PLANNER_DISCOVERY_EXECUTABLE_INTENTS as unknown as IntentVerb[];

export function bindPlannerDiscoveryCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<PlannerDiscoveryPort> = createProductionPlannerDiscoveryPort,
): void {
  platform.registerHandler(
    PLANNER_DISCOVERY_CAPABILITY_ID,
    createPlannerDiscoveryHandler(resolvePort),
    PLANNER_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  );
}
