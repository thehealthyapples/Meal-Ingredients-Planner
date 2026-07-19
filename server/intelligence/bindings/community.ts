/**
 * Community Capability Binding (COMM1)
 * ====================================
 * Binds the read-only Community handler to the `community` capability, flipping
 * its availability from "registered" (metadata only) to "available" (executable).
 * It reuses the exact Port → Handler → Binding pattern proven by the Planner
 * (INT2), Household (INT13) and every other live owner — the platform gains a new
 * owner without gaining any community logic.
 *
 * The handler delegates to the real owning service via a port built with DYNAMIC
 * imports, so binding here does NOT open a database connection at import time.
 *
 * Idempotent: binding twice re-binds the same handler.
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createCommunityReadHandler } from "../handlers/community-read-handler.js";
import { createStorageCommunityReadPort, type CommunityReadPort } from "../handlers/community-read-port.js";

/** The capability id this binding activates. */
export const COMMUNITY_CAPABILITY_ID = "community";

/**
 * The verbs this read-only binding actually executes. Only "read" has a live code
 * path. "add"/"delete" (create a community, invite a household, accept, leave)
 * are membership lifecycle writes that remain owned by the Community service, and
 * "explain" has no stored rationale on a membership row to explain. Declared here
 * so the registry surfaces truthful executableIntents and discovery cannot
 * over-advertise (INT6A).
 */
export const COMMUNITY_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"];

/**
 * Bind the read-only Community handler to a platform.
 *
 * Production: call with only `platform`. Tests: pass an in-memory port factory so
 * the binding and the test share the same registration entry point.
 */
export function bindCommunityReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<CommunityReadPort> = createStorageCommunityReadPort,
): void {
  platform.registerHandler(
    COMMUNITY_CAPABILITY_ID,
    createCommunityReadHandler(resolvePort),
    COMMUNITY_EXECUTABLE_INTENTS,
  );
}
