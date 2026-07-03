/**
 * Evidence & Learning Capability Binding (EL1)
 * ================================================
 * Activates the twenty-first live capability on the THA Intelligence Platform:
 * it binds the Evidence & Learning handler to the `evidence-learning`
 * capability, flipping its availability from "registered" (metadata only) to
 * "available" (executable). Reuses the exact Port -> Handler -> Binding
 * pattern proven by every other capability.
 *
 * The handler delegates to the EL1 framework + store via a port built with
 * DYNAMIC imports, so binding here does NOT open a database connection at
 * import time - the store is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry
 * replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createEvidenceLearningHandler } from "../handlers/evidence-learning-handler.js";
import {
  createStoreEvidenceLearningReadPort,
  type EvidenceLearningReadPort,
} from "../handlers/evidence-learning-read-port.js";

/** The capability id this binding activates. */
export const EVIDENCE_LEARNING_CAPABILITY_ID = "evidence-learning";

/**
 * The verbs this binding actually executes: `report` (capture a structured
 * household outcome), `search` (list current learning signals), `approve`
 * (confirm a pending signal) and `delete` (decline a pending signal).
 * Declared here so the registry can surface truthful executableIntents and
 * discovery cannot over-advertise (INT6A discipline).
 */
export const EVIDENCE_LEARNING_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["report", "search", "approve", "delete"];

/**
 * Bind the Evidence & Learning handler to a platform.
 *
 * Production: call with only `platform` - the real store-backed port is used
 * by default. Tests: pass an in-memory port factory as the second argument so
 * the binding and test share the same registration entry point.
 */
export function bindEvidenceLearningCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<EvidenceLearningReadPort> = createStoreEvidenceLearningReadPort,
): void {
  platform.registerHandler(
    EVIDENCE_LEARNING_CAPABILITY_ID,
    createEvidenceLearningHandler(resolvePort),
    EVIDENCE_LEARNING_EXECUTABLE_INTENTS,
  );
}
