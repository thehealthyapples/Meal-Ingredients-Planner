/**
 * Shopping Capability Binding (INT3 read-only; INT40 adds write)
 * ================================================================
 * Activates the live `shopping` capability on the THA Intelligence Platform. It reuses
 * the exact Port → Handler → Binding pattern proven by the Planner in INT2 — the
 * platform gains a live owner without gaining any shopping logic.
 *
 * INT40: a CapabilityHandler is one-per-capability, not one-per-verb (the registry
 * binds a single handler per capability id — see capability-registry.ts bindHandler).
 * To add the "add" verb without breaking the existing read verbs, this binding now
 * COMPOSES the read handler (INT3, unchanged) and the new write handler (INT40) into
 * one dispatching handler: "read"/"explain" delegate to the read handler, "add"
 * delegates to the write handler, anything else is an honest gap. Neither handler
 * changes — this file only adds the dispatch.
 *
 * Handlers delegate to the real owning service (storage) via ports built with DYNAMIC
 * imports, so binding here does NOT open a database connection at import time — the
 * owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { CapabilityHandler, Intent, IntelligenceContext, IntentVerb } from "../types.js";
import { createShoppingReadHandler } from "../handlers/shopping-read-handler.js";
import { createStorageShoppingReadPort, type ShoppingReadPort } from "../handlers/shopping-read-port.js";
import { createShoppingWriteHandler } from "../handlers/shopping-write-handler.js";
import { createStorageShoppingWritePort, type ShoppingWritePort } from "../handlers/shopping-write-port.js";

/** The capability id this binding activates. */
export const SHOPPING_CAPABILITY_ID = "shopping";

/**
 * The verbs this binding actually executes: "read"/"explain" (INT3, read-only) and
 * "add" (INT40, write — a single household staple/extra). All other allow-listed verbs
 * (delete, generate) return an honest gap. Declared here so the registry can surface
 * truthful executableIntents and discovery cannot over-advertise (INT6A).
 */
export const SHOPPING_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain", "add"];

/** Compose the read and write handlers into one capability-level dispatcher. */
function composeShoppingHandler(
  readHandler: CapabilityHandler,
  writeHandler: CapabilityHandler,
): CapabilityHandler {
  return (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    if (intent.verb === "add") return writeHandler(intent, context);
    return readHandler(intent, context);
  };
}

/**
 * Bind the composed (read + INT40 write) Shopping handler to a platform.
 *
 * Production: call with only `platform` — the real storage ports are used by default.
 * Tests: pass in-memory port factories so the binding and test share the same
 * registration entry point (INT6B recommendation C4).
 */
export function bindShoppingReadCapability(
  platform: IntelligencePlatform,
  resolveReadPort: () => Promise<ShoppingReadPort> = createStorageShoppingReadPort,
  resolveWritePort: () => Promise<ShoppingWritePort> = createStorageShoppingWritePort,
): void {
  platform.registerHandler(
    SHOPPING_CAPABILITY_ID,
    composeShoppingHandler(
      createShoppingReadHandler(resolveReadPort),
      createShoppingWriteHandler(resolveWritePort),
    ),
    SHOPPING_EXECUTABLE_INTENTS,
  );
}
