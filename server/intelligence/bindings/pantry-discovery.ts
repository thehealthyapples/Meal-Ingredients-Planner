/**
 * Pantry Discovery Binding (INT31)
 * ====================================
 * Wires the `pantry-discovery` capability into an IntelligencePlatform instance.
 *
 * PRODUCTION:  `createProductionPantryDiscoveryPort` (lazy DB import).
 * TESTS:       Pass a custom `resolvePort` factory that returns an in-memory stub.
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import {
  createPantryDiscoveryHandler,
  PANTRY_DISCOVERY_EXECUTABLE_INTENTS,
} from "../handlers/pantry-discovery-handler.js";
import {
  createProductionPantryDiscoveryPort,
  type PantryDiscoveryPort,
} from "../handlers/pantry-discovery-port.js";

export const PANTRY_DISCOVERY_CAPABILITY_ID = "pantry-discovery" as const;

export const PANTRY_DISCOVERY_BINDING_EXECUTABLE_INTENTS: readonly IntentVerb[] =
  PANTRY_DISCOVERY_EXECUTABLE_INTENTS as unknown as IntentVerb[];

export function bindPantryDiscoveryCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<PantryDiscoveryPort> = createProductionPantryDiscoveryPort,
): void {
  platform.registerHandler(
    PANTRY_DISCOVERY_CAPABILITY_ID,
    createPantryDiscoveryHandler(resolvePort),
    PANTRY_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  );
}
