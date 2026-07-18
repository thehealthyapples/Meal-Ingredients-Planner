/**
 * Pantry Capability Binding (INT8 read-only; COMP_ACT1 adds write)
 * =================================================================
 * Activates the live `pantry` capability on the THA Intelligence Platform. INT8 bound the
 * read-only handler; COMP_ACT1 COMPOSES that read handler (unchanged) with a new write
 * handler so "add" and "delete" become executable, reusing the exact Port → Handler →
 * Binding pattern the Planner (INT40) and Shopping (INT40) write paths proved — the
 * platform gains pantry writes without gaining any pantry logic.
 *
 * Handlers delegate to the real owning service (storage) via ports built with DYNAMIC
 * imports, so binding here does NOT open a database connection at import time — the owner
 * is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { CapabilityHandler, Intent, IntelligenceContext, IntentVerb } from "../types.js";
import { createPantryReadHandler } from "../handlers/pantry-read-handler.js";
import { createStoragePantryReadPort, type PantryReadPort } from "../handlers/pantry-read-port.js";
import { createPantryWriteHandler } from "../handlers/pantry-write-handler.js";
import { createStoragePantryWritePort, type PantryWritePort } from "../handlers/pantry-write-port.js";

/** The capability id this binding activates. */
export const PANTRY_CAPABILITY_ID = "pantry";

/**
 * The verbs this binding actually executes: "read"/"explain" (INT8, read-only) and
 * "add"/"delete" (COMP_ACT1, write). The remaining allow-listed verbs (search, recommend)
 * return an honest gap. Declared here so the registry can surface truthful
 * executableIntents and discovery cannot over-advertise (INT6A).
 */
export const PANTRY_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain", "add", "delete"];

/** The write verbs the write handler owns (COMP_ACT1: add + delete). */
const PANTRY_WRITE_VERBS: ReadonlySet<IntentVerb> = new Set<IntentVerb>(["add", "delete"]);

/** Compose the read and write handlers into one capability-level dispatcher. */
function composePantryHandler(
  readHandler: CapabilityHandler,
  writeHandler: CapabilityHandler,
): CapabilityHandler {
  return (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    if (PANTRY_WRITE_VERBS.has(intent.verb)) return writeHandler(intent, context);
    return readHandler(intent, context);
  };
}

/**
 * Bind the composed (read + COMP_ACT1 write) Pantry handler to a platform.
 *
 * Production: call with only `platform` — the real storage ports are used by default.
 * Tests: pass in-memory port factories so the binding and test share the same
 * registration entry point (INT6B recommendation C4).
 */
export function bindPantryReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<PantryReadPort> = createStoragePantryReadPort,
  resolveWritePort: () => Promise<PantryWritePort> = createStoragePantryWritePort,
): void {
  platform.registerHandler(
    PANTRY_CAPABILITY_ID,
    composePantryHandler(
      createPantryReadHandler(resolvePort),
      createPantryWriteHandler(resolveWritePort),
    ),
    PANTRY_EXECUTABLE_INTENTS,
  );
}
