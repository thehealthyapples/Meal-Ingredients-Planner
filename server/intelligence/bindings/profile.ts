/**
 * Profile Capability Binding (INT12)
 * ====================================
 * Activates the SIXTH live capability on the THA Intelligence Platform: it binds the
 * read-only Profile handler to the `profile` capability, flipping its availability
 * from "registered" (metadata only) to "available" (executable). It reuses the exact
 * Port → Handler → Binding pattern proven by the Planner (INT2), Shopping (INT3),
 * Nutrition / Knowledge (INT4), Pantry (INT8), and Diary (INT10) — the platform gains a
 * sixth live owner without gaining any profile logic.
 *
 * The handler delegates to the real owning service (storage) via a port built with
 * DYNAMIC imports, so binding here does NOT open a database connection at import time —
 * the owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createProfileReadHandler } from "../handlers/profile-read-handler.js";
import { createStorageProfileReadPort, type ProfileReadPort } from "../handlers/profile-read-port.js";

/** The capability id this binding activates. */
export const PROFILE_CAPABILITY_ID = "profile";

/**
 * The verbs this read-only binding actually executes. Only "read" has a live code path
 * in the handler; the other allow-listed verbs ("explain" — no stored rationale;
 * "add" — a write) return an honest gap. Declared here so the registry can surface
 * truthful executableIntents and discovery cannot over-advertise (INT6A).
 */
export const PROFILE_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"];

/**
 * Bind the read-only Profile handler to a platform.
 *
 * Production: call with only `platform` — the real storage port is used by default.
 * Tests: pass an in-memory port factory as the second argument so the binding and
 * test share the same registration entry point (INT6B recommendation C4).
 */
export function bindProfileReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<ProfileReadPort> = createStorageProfileReadPort,
): void {
  platform.registerHandler(
    PROFILE_CAPABILITY_ID,
    createProfileReadHandler(resolvePort),
    PROFILE_EXECUTABLE_INTENTS,
  );
}
