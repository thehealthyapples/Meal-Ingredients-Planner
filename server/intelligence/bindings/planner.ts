/**
 * Planner Capability Binding (INT2 read-only; INT40 adds write)
 * ================================================================
 * Activates the live `planner` capability on the THA Intelligence Platform. This was
 * the single line where the platform first stopped being inert foundation and started
 * orchestrating a real owner (INT2).
 *
 * INT40: a CapabilityHandler is one-per-capability, not one-per-verb (the registry
 * binds a single handler per capability id — see capability-registry.ts bindHandler).
 * To add the "add" verb without breaking the existing read verbs, this binding now
 * COMPOSES the read handler (INT2, unchanged) and the new write handler (INT40) into
 * one dispatching handler: "read"/"explain" delegate to the read handler, "add"
 * delegates to the write handler, anything else is an honest gap. Neither handler
 * changes — this file only adds the dispatch.
 *
 * Handlers delegate to the real owning services (storage + household) via ports built
 * with DYNAMIC imports, so binding here does NOT open a database connection at import
 * time — the owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { CapabilityHandler, Intent, IntelligenceContext, IntentVerb } from "../types.js";
import { createPlannerReadHandler } from "../handlers/planner-read-handler.js";
import { createStoragePlannerReadPort, type PlannerReadPort } from "../handlers/planner-read-port.js";
import { createPlannerWriteHandler } from "../handlers/planner-write-handler.js";
import { createStoragePlannerWritePort, type PlannerWritePort } from "../handlers/planner-write-port.js";

/** The capability id this binding activates. */
export const PLANNER_CAPABILITY_ID = "planner";

/**
 * The verbs this binding actually executes: "read"/"explain" (INT2, read-only), "add"
 * (INT40, write — one meal into a known day+slot), and "move"/"replace" (COMP_ACT1,
 * write — relocate an entry, swap an entry's meal). All other allow-listed verbs
 * (generate, delete, import, share) return an honest gap. Declared here so the registry
 * can surface truthful executableIntents and discovery cannot over-advertise (INT6A).
 */
export const PLANNER_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain", "add", "move", "replace"];

/** The write verbs the write handler owns (COMP_ACT1: add + move + replace). */
const PLANNER_WRITE_VERBS: ReadonlySet<IntentVerb> = new Set<IntentVerb>(["add", "move", "replace"]);

/** Compose the read and write handlers into one capability-level dispatcher. */
function composePlannerHandler(
  readHandler: CapabilityHandler,
  writeHandler: CapabilityHandler,
): CapabilityHandler {
  return (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    if (PLANNER_WRITE_VERBS.has(intent.verb)) return writeHandler(intent, context);
    return readHandler(intent, context);
  };
}

/**
 * Bind the composed (read + INT40 write) Planner handler to a platform.
 *
 * Production: call with only `platform` — the real storage ports are used by default.
 * Tests: pass in-memory port factories so the binding and test share the same
 * registration entry point (INT6B recommendation C4).
 */
export function bindPlannerReadCapability(
  platform: IntelligencePlatform,
  resolveReadPort: () => Promise<PlannerReadPort> = createStoragePlannerReadPort,
  resolveWritePort: () => Promise<PlannerWritePort> = createStoragePlannerWritePort,
): void {
  platform.registerHandler(
    PLANNER_CAPABILITY_ID,
    composePlannerHandler(
      createPlannerReadHandler(resolveReadPort),
      createPlannerWriteHandler(resolveWritePort),
    ),
    PLANNER_EXECUTABLE_INTENTS,
  );
}
