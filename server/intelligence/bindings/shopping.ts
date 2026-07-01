/**
 * Shopping Capability Binding (INT3)
 * ==================================
 * Activates the SECOND live capability on the THA Intelligence Platform: it binds the
 * read-only Shopping handler to the `shopping` capability, flipping its availability from
 * "registered" (metadata only) to "available" (executable). It reuses the exact
 * Port → Handler → Binding pattern proven by the Planner in INT2 — the platform gains a
 * second live owner without gaining any shopping logic.
 *
 * The handler delegates to the real owning service (storage) via a port built with
 * DYNAMIC imports, so binding here does NOT open a database connection at import time —
 * the owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createShoppingReadHandler } from "../handlers/shopping-read-handler.js";
import { createStorageShoppingReadPort, type ShoppingReadPort } from "../handlers/shopping-read-port.js";

/** The capability id this binding activates. */
export const SHOPPING_CAPABILITY_ID = "shopping";

/**
 * The verbs this read-only binding actually executes. Only "read" and "explain" have
 * a live code path in the handler; all other allow-listed verbs (add, delete, generate)
 * return an honest gap. Declared here so the registry can surface truthful
 * executableIntents and discovery cannot over-advertise (INT6A).
 */
export const SHOPPING_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain"];

/**
 * Bind the read-only Shopping handler to a platform.
 *
 * Production: call with only `platform` — the real storage port is used by default.
 * Tests: pass an in-memory port factory as the second argument so the binding and
 * test share the same registration entry point (INT6B recommendation C4).
 */
export function bindShoppingReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<ShoppingReadPort> = createStorageShoppingReadPort,
): void {
  platform.registerHandler(
    SHOPPING_CAPABILITY_ID,
    createShoppingReadHandler(resolvePort),
    SHOPPING_EXECUTABLE_INTENTS,
  );
}
