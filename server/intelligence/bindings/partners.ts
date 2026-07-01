/**
 * Partners Capability Binding (INT14)
 * =====================================
 * Activates the EIGHTH live capability on the THA Intelligence Platform: it binds the
 * read-only Partners handler to the `partners` capability, flipping its availability
 * from "registered" (metadata only) to "available" (executable). It reuses the exact
 * Port → Handler → Binding pattern proven by the Planner (INT2), Shopping (INT3),
 * Nutrition / Knowledge (INT4), Pantry (INT8), Diary (INT10), Profile (INT12), and
 * Household (INT13) — the platform gains an eighth live owner without gaining any
 * partners/retailer logic.
 *
 * The handler delegates to the real owning service (`server/lib/
 * supermarket-basket-service.ts`) via a port built with a DYNAMIC import, so binding
 * here does NOT touch that module at import time — the owner is only touched on first
 * invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createPartnersReadHandler } from "../handlers/partners-read-handler.js";
import { createStoragePartnersReadPort, type PartnersReadPort } from "../handlers/partners-read-port.js";

/** The capability id this binding activates. */
export const PARTNERS_CAPABILITY_ID = "partners";

/**
 * The verbs this read-only binding actually executes. Only "read" has a live code
 * path in the handler (and only for `scope: "retailers"`); "explain", "recommend", and
 * "compare" all remain allow-listed on the capability but return an honest gap — the
 * canonical Capability Card found no safe, grounded owner read for any of them.
 * Declared here so the registry can surface truthful executableIntents and discovery
 * cannot over-advertise (INT6A).
 */
export const PARTNERS_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"];

/**
 * Bind the read-only Partners handler to a platform.
 *
 * Production: call with only `platform` — the real owning-service port is used by
 * default. Tests: pass an in-memory port factory as the second argument so the binding
 * and test share the same registration entry point (INT6B recommendation C4).
 */
export function bindPartnersReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<PartnersReadPort> = createStoragePartnersReadPort,
): void {
  platform.registerHandler(
    PARTNERS_CAPABILITY_ID,
    createPartnersReadHandler(resolvePort),
    PARTNERS_EXECUTABLE_INTENTS,
  );
}
