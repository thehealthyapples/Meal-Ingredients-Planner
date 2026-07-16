/**
 * Household Health Capability Binding (HHP2)
 * ==========================================
 * Activates Household Health as a live capability on the THA Intelligence Platform: it
 * binds the read-only Household Health handler to the `household-health` capability,
 * flipping its availability from "registered" (metadata only) to "available" (executable).
 *
 * It reuses the exact Port → Handler → Binding pattern proven by every other capability.
 * The platform gains a registered mouth for a domain it ALREADY reasons about (HNP1) — it
 * gains no new engine, no new score, and no new business-domain data ownership.
 *
 * WHY THIS CAPABILITY IS SEPARATE FROM `household`. The `household` capability's owner is
 * the household-MEMBERSHIP store (households / household_members / household_eaters, SoT
 * D16) — who is in this household and what they cannot eat. Household HEALTH's owner is
 * HNP1's reasoning core, which composes over the planner, the plant classifier,
 * user_health_trends and the Nutrition Centre. They are different owners answering
 * different questions, so folding health into `household` would give one capability two
 * owners — the precise thing "one owner per fact" forbids.
 *
 * The handler delegates to the real owners via a port built with DYNAMIC imports, so
 * binding here does NOT open a database connection at import time.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createHouseholdHealthReadHandler } from "../handlers/household-health-handler.js";
import {
  createHouseholdHealthReadPort,
  type HouseholdHealthReadPort,
} from "../handlers/household-health-read-port.js";

/** The capability id this binding activates — and the id HHP2 enrols in `OPPORTUNITY_SOURCES`. */
export const HOUSEHOLD_HEALTH_CAPABILITY_ID = "household-health";

/**
 * The verbs this read-only binding actually executes. Only `report` has a live code path:
 * the household's own Health Opportunities and the score they were derived from.
 *
 * `report` is the verb the canonical Decision Engine calls on every registered producer
 * (DEC1 §7), which is what makes this capability an Opportunity Platform rather than merely
 * another read surface. Declared here so the registry surfaces truthful `executableIntents`
 * and discovery cannot over-advertise (INT6A discipline).
 */
export const HOUSEHOLD_HEALTH_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["report"];

/**
 * Bind the read-only Household Health handler to a platform.
 *
 * Production: call with only `platform` — the real owners are used by default.
 * Tests: pass an in-memory port factory so the binding and the test share one registration
 * entry point (INT6B recommendation C4).
 */
export function bindHouseholdHealthCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<HouseholdHealthReadPort> = createHouseholdHealthReadPort,
): void {
  platform.registerHandler(
    HOUSEHOLD_HEALTH_CAPABILITY_ID,
    createHouseholdHealthReadHandler(resolvePort),
    HOUSEHOLD_HEALTH_EXECUTABLE_INTENTS,
  );
}
