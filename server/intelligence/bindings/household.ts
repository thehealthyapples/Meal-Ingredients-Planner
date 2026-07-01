/**
 * Household Capability Binding (INT13)
 * ======================================
 * Activates the SEVENTH live capability on the THA Intelligence Platform: it binds the
 * read-only Household handler to the `household` capability, flipping its availability
 * from "registered" (metadata only) to "available" (executable). It reuses the exact
 * Port → Handler → Binding pattern proven by the Planner (INT2), Shopping (INT3),
 * Nutrition / Knowledge (INT4), Pantry (INT8), Diary (INT10), and Profile (INT12) — the
 * platform gains a seventh live owner without gaining any household logic.
 *
 * The handler delegates to the real owning service (storage + the household session
 * resolver) via a port built with DYNAMIC imports, so binding here does NOT open a
 * database connection at import time — the owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createHouseholdReadHandler } from "../handlers/household-read-handler.js";
import { createStorageHouseholdReadPort, type HouseholdReadPort } from "../handlers/household-read-port.js";

/** The capability id this binding activates. */
export const HOUSEHOLD_CAPABILITY_ID = "household";

/**
 * The verbs this read-only binding actually executes. Only "read" has a live code path
 * in the handler; the other allow-listed verbs ("explain" — no stored rationale on
 * membership/eater records; "add"/"delete" — writes) return an honest gap. Declared here
 * so the registry can surface truthful executableIntents and discovery cannot
 * over-advertise (INT6A).
 */
export const HOUSEHOLD_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"];

/**
 * Bind the read-only Household handler to a platform.
 *
 * Production: call with only `platform` — the real storage port is used by default.
 * Tests: pass an in-memory port factory as the second argument so the binding and
 * test share the same registration entry point (INT6B recommendation C4).
 */
export function bindHouseholdReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<HouseholdReadPort> = createStorageHouseholdReadPort,
): void {
  platform.registerHandler(
    HOUSEHOLD_CAPABILITY_ID,
    createHouseholdReadHandler(resolvePort),
    HOUSEHOLD_EXECUTABLE_INTENTS,
  );
}
