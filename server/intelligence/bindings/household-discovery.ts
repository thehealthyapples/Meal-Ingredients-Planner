/**
 * Household Discovery Binding (INT29)
 * =====================================
 * Wires the `household-discovery` capability into an IntelligencePlatform
 * instance by registering its handler and flipping availability to "available".
 *
 * Call `bindHouseholdDiscoveryCapability(platform)` exactly ONCE during
 * platform initialisation. The singleton `intelligence-platform.ts` calls it
 * at the bottom of its file so it is wired on the first import.
 *
 * PRODUCTION:  `createProductionHouseholdDiscoveryPort` (lazy DB import).
 * TESTS:       Pass a custom `resolvePort` factory that returns an in-memory stub.
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import {
  createHouseholdDiscoveryHandler,
  HOUSEHOLD_DISCOVERY_EXECUTABLE_INTENTS,
} from "../handlers/household-discovery-handler.js";
import {
  createProductionHouseholdDiscoveryPort,
  type HouseholdDiscoveryPort,
} from "../handlers/household-discovery-port.js";

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------

export const HOUSEHOLD_DISCOVERY_CAPABILITY_ID = "household-discovery" as const;

export const HOUSEHOLD_DISCOVERY_BINDING_EXECUTABLE_INTENTS: readonly IntentVerb[] =
  HOUSEHOLD_DISCOVERY_EXECUTABLE_INTENTS as unknown as IntentVerb[];

// ---------------------------------------------------------------------------
// Binding function
// ---------------------------------------------------------------------------

export function bindHouseholdDiscoveryCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<HouseholdDiscoveryPort> = createProductionHouseholdDiscoveryPort,
): void {
  platform.registerHandler(
    HOUSEHOLD_DISCOVERY_CAPABILITY_ID,
    createHouseholdDiscoveryHandler(resolvePort),
    HOUSEHOLD_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  );
}
