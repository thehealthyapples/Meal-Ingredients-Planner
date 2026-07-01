/**
 * Analyser Capability Binding (INT17)
 * =====================================
 * Activates the ELEVENTH live capability on the THA Intelligence Platform: it binds the
 * read-only Analyser handler to the `analyser` capability, flipping its availability
 * from "registered" (metadata only) to "available" (executable). It reuses the exact
 * Port → Handler → Binding pattern proven by the Planner (INT2), Shopping (INT3),
 * Nutrition / Knowledge (INT4), Pantry (INT8), Diary (INT10), Profile (INT12),
 * Household (INT13), Partners (INT14), Meals (INT15), and Templates (INT16) — the
 * platform gains an eleventh live owner without gaining any product-analysis/UPF logic.
 *
 * The handler delegates to the real owning service (`server/storage.ts`) via a port
 * built with a DYNAMIC import, so binding here does NOT touch that module at import
 * time — the owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createAnalyserReadHandler } from "../handlers/analyser-read-handler.js";
import { createStorageAnalyserReadPort, type AnalyserReadPort } from "../handlers/analyser-read-port.js";

/** The capability id this binding activates. */
export const ANALYSER_CAPABILITY_ID = "analyser";

/**
 * The verbs this read-only binding actually executes. Only "read" has a live code
 * path in the handler (and only for `scope: "additives"`); "explain", "analyse", and
 * "report" all remain allow-listed on the capability but return an honest gap — the
 * canonical Capability Card found no safe, grounded STORED-read owner for any of them.
 * Declared here so the registry can surface truthful executableIntents and discovery
 * cannot over-advertise (INT6A).
 */
export const ANALYSER_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"];

/**
 * Bind the read-only Analyser handler to a platform.
 *
 * Production: call with only `platform` — the real owning-service port is used by
 * default. Tests: pass an in-memory port factory as the second argument so the binding
 * and test share the same registration entry point (INT6B recommendation C4).
 */
export function bindAnalyserReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<AnalyserReadPort> = createStorageAnalyserReadPort,
): void {
  platform.registerHandler(
    ANALYSER_CAPABILITY_ID,
    createAnalyserReadHandler(resolvePort),
    ANALYSER_EXECUTABLE_INTENTS,
  );
}
