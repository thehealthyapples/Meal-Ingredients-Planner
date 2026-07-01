/**
 * Pantry Capability Binding (INT8)
 * =================================
 * Activates the FOURTH live capability on the THA Intelligence Platform: it binds the
 * read-only Pantry handler to the `pantry` capability, flipping its availability from
 * "registered" (metadata only) to "available" (executable). It reuses the exact
 * Port → Handler → Binding pattern proven by the Planner (INT2), Shopping (INT3), and
 * Nutrition / Knowledge (INT4) — the platform gains a fourth live owner without gaining
 * any pantry logic.
 *
 * The handler delegates to the real owning service (storage) via a port built with
 * DYNAMIC imports, so binding here does NOT open a database connection at import time —
 * the owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createPantryReadHandler } from "../handlers/pantry-read-handler.js";
import { createStoragePantryReadPort, type PantryReadPort } from "../handlers/pantry-read-port.js";

/** The capability id this binding activates. */
export const PANTRY_CAPABILITY_ID = "pantry";

/**
 * The verbs this read-only binding actually executes. Only "read" and "explain" have
 * a live code path in the handler; all other allow-listed verbs (add, delete, search,
 * recommend) return an honest gap. Declared here so the registry can surface truthful
 * executableIntents and discovery cannot over-advertise (INT6A).
 */
export const PANTRY_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain"];

/**
 * Bind the read-only Pantry handler to a platform.
 *
 * Production: call with only `platform` — the real storage port is used by default.
 * Tests: pass an in-memory port factory as the second argument so the binding and
 * test share the same registration entry point (INT6B recommendation C4).
 */
export function bindPantryReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<PantryReadPort> = createStoragePantryReadPort,
): void {
  platform.registerHandler(
    PANTRY_CAPABILITY_ID,
    createPantryReadHandler(resolvePort),
    PANTRY_EXECUTABLE_INTENTS,
  );
}
