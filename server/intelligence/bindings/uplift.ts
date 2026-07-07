/**
 * Uplift Capability Binding (INT42)
 * ====================================
 * Activates the TWENTY-SECOND live capability on the THA Intelligence
 * Platform: it binds the read-only Uplift handler to the `uplift`
 * capability, flipping its availability from "registered" (metadata only) to
 * "available" (executable). It reuses the exact Port → Handler → Binding
 * pattern proven by every other capability, against a tenth kind of owner: a
 * pre-existing, non-Intelligence-Platform domain engine (SoT Domain 17,
 * "Nutrition Boost (Uplift)") that predates this platform entirely.
 *
 * The handler delegates to the real Meals owner and the real Uplift Engine
 * via a port built with DYNAMIC imports, so binding here does NOT open a
 * database connection at import time — the owner is only touched on first
 * invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry
 * replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createUpliftReadHandler } from "../handlers/uplift-read-handler.js";
import { createEngineUpliftReadPort, type UpliftReadPort } from "../handlers/uplift-read-port.js";

/** The capability id this binding activates. */
export const UPLIFT_CAPABILITY_ID = "uplift";

/**
 * The verbs this binding actually executes: `recommend` (a single meal's
 * Nutrition Boost suggestions). Accepting/removing a suggestion remains the
 * exclusive property of the existing `/api/uplift/accept` /
 * `/api/uplift/applications/:id` routes — this binding declares no write verb.
 */
export const UPLIFT_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["recommend"];

/**
 * Bind the read-only Uplift handler to a platform.
 *
 * Production: call with only `platform` — the real Meals + Uplift Engine
 * port is used by default. Tests: pass an in-memory port factory as the
 * second argument so the binding and test share the same registration entry
 * point (INT6B recommendation C4).
 */
export function bindUpliftReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<UpliftReadPort> = createEngineUpliftReadPort,
): void {
  platform.registerHandler(
    UPLIFT_CAPABILITY_ID,
    createUpliftReadHandler(resolvePort),
    UPLIFT_EXECUTABLE_INTENTS,
  );
}
