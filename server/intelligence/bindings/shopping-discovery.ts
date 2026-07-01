/**
 * Shopping Discovery Binding (INT30)
 * =====================================
 * Wires the `shopping-discovery` capability into an IntelligencePlatform
 * instance by registering its handler and flipping availability to "available".
 *
 * PRODUCTION:  `createProductionShoppingDiscoveryPort` (lazy DB import).
 * TESTS:       Pass a custom `resolvePort` factory that returns an in-memory stub.
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import {
  createShoppingDiscoveryHandler,
  SHOPPING_DISCOVERY_EXECUTABLE_INTENTS,
} from "../handlers/shopping-discovery-handler.js";
import {
  createProductionShoppingDiscoveryPort,
  type ShoppingDiscoveryPort,
} from "../handlers/shopping-discovery-port.js";

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------

export const SHOPPING_DISCOVERY_CAPABILITY_ID = "shopping-discovery" as const;

export const SHOPPING_DISCOVERY_BINDING_EXECUTABLE_INTENTS: readonly IntentVerb[] =
  SHOPPING_DISCOVERY_EXECUTABLE_INTENTS as unknown as IntentVerb[];

// ---------------------------------------------------------------------------
// Binding function
// ---------------------------------------------------------------------------

export function bindShoppingDiscoveryCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<ShoppingDiscoveryPort> = createProductionShoppingDiscoveryPort,
): void {
  platform.registerHandler(
    SHOPPING_DISCOVERY_CAPABILITY_ID,
    createShoppingDiscoveryHandler(resolvePort),
    SHOPPING_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  );
}
