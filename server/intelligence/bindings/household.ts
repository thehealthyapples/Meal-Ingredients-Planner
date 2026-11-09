/**
 * Household Capability Binding (INT13)
 * ======================================
 * Activates the Household capability on the THA Intelligence Platform by binding its
 * read and narrowly scoped write handler, flipping its availability
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
 * The verbs this binding actually executes. `add` is restricted to confirmed,
 * consent-gated reported health context and voluntary nutrition focuses for dependents. Declared here so
 * discovery cannot
 * over-advertise (INT6A).
 */
export const HOUSEHOLD_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "add"];

/**
 * Bind the Household handler to a platform.
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
