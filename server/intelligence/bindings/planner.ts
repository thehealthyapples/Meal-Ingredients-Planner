/**
 * Planner Capability Binding (INT2)
 * =================================
 * Activates the FIRST live capability on the THA Intelligence Platform: it binds the
 * read-only Planner handler to the `planner` capability, flipping its availability from
 * "registered" (metadata only) to "available" (executable). This is the single line
 * where the platform stops being inert foundation and starts orchestrating a real owner.
 *
 * The handler delegates to the real owning services (storage + household) via a port
 * built with DYNAMIC imports, so binding here does NOT open a database connection at
 * import time — the owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createPlannerReadHandler } from "../handlers/planner-read-handler.js";
import { createStoragePlannerReadPort, type PlannerReadPort } from "../handlers/planner-read-port.js";

/** The capability id this binding activates. */
export const PLANNER_CAPABILITY_ID = "planner";

/**
 * The verbs this read-only binding actually executes. Only "read" and "explain" have
 * a live code path in the handler; all other allow-listed verbs (generate, add, move,
 * replace, delete, import, share) return an honest gap. Declared here so the registry
 * can surface truthful executableIntents and discovery cannot over-advertise (INT6A).
 */
export const PLANNER_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain"];

/**
 * Bind the read-only Planner handler to a platform.
 *
 * Production: call with only `platform` — the real storage port is used by default.
 * Tests: pass an in-memory port factory as the second argument so the binding and
 * test share the same registration entry point (INT6B recommendation C4).
 */
export function bindPlannerReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<PlannerReadPort> = createStoragePlannerReadPort,
): void {
  platform.registerHandler(
    PLANNER_CAPABILITY_ID,
    createPlannerReadHandler(resolvePort),
    PLANNER_EXECUTABLE_INTENTS,
  );
}
