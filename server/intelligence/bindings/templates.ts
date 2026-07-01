/**
 * Templates Capability Binding (INT16)
 * =======================================
 * Activates the TENTH live capability on the THA Intelligence Platform: it binds the
 * read-only Templates handler to the `templates` capability, flipping its availability
 * from "registered" (metadata only) to "available" (executable). It reuses the exact
 * Port → Handler → Binding pattern proven by the Planner (INT2), Shopping (INT3),
 * Nutrition / Knowledge (INT4), Pantry (INT8), Diary (INT10), Profile (INT12),
 * Household (INT13), Partners (INT14), and Meals (INT15) — the platform gains a tenth
 * live owner without gaining any template/plan logic.
 *
 * The handler delegates to the real owning service (storage) via a port built with
 * DYNAMIC imports, so binding here does NOT open a database connection at import time —
 * the owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createTemplatesReadHandler } from "../handlers/templates-read-handler.js";
import { createStorageTemplatesReadPort, type TemplatesReadPort } from "../handlers/templates-read-port.js";

/** The capability id this binding activates. */
export const TEMPLATES_CAPABILITY_ID = "templates";

/**
 * The verbs this read-only binding actually executes. Only "read" has a live code path
 * in the handler (for `scope` in "meal-templates" / "meal-template" / "plan-templates" /
 * "plan-templates-mine" / "plan-templates-default" / "plan-template"); "explain",
 * "search", "recommend", and every write verb remain allow-listed on the capability but
 * return an honest gap — the canonical Capability Card found no stored rationale field
 * for "explain" and no search-by-name/tag method anywhere in storage.ts for "search".
 * Declared here so the registry can surface truthful executableIntents and discovery
 * cannot over-advertise (INT6A).
 */
export const TEMPLATES_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"];

/**
 * Bind the read-only Templates handler to a platform.
 *
 * Production: call with only `platform` — the real storage port is used by default.
 * Tests: pass an in-memory port factory as the second argument so the binding and
 * test share the same registration entry point (INT6B recommendation C4).
 */
export function bindTemplatesReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<TemplatesReadPort> = createStorageTemplatesReadPort,
): void {
  platform.registerHandler(
    TEMPLATES_CAPABILITY_ID,
    createTemplatesReadHandler(resolvePort),
    TEMPLATES_EXECUTABLE_INTENTS,
  );
}
