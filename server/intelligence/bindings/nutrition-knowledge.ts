/**
 * Nutrition / Knowledge Capability Binding (INT4)
 * ===============================================
 * Activates the THIRD live capability on the THA Intelligence Platform: it binds the
 * read-only Nutrition / Knowledge handler to the `nutrition-knowledge` capability, flipping
 * its availability from "registered" (metadata only) to "available" (executable). It reuses
 * the exact Port → Handler → Binding pattern proven by the Planner in INT2 and the Shopping
 * binding in INT3 — the platform gains a third live owner without gaining any nutrition logic.
 *
 * The handler delegates to the real owning service (`nutrition-knowledge-registry.ts`) via a
 * port built with DYNAMIC imports, so binding here does NOT open a database connection at
 * import time — the owner is only touched on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createNutritionKnowledgeReadHandler } from "../handlers/nutrition-knowledge-read-handler.js";
import {
  createRegistryNutritionKnowledgeReadPort,
  type NutritionKnowledgeReadPort,
} from "../handlers/nutrition-knowledge-read-port.js";

/** The capability id this binding activates. */
export const NUTRITION_KNOWLEDGE_CAPABILITY_ID = "nutrition-knowledge";

/**
 * The verbs this read-only binding actually executes. "read", "search", and "explain"
 * have live code paths in the handler; the remaining allow-listed verbs (analyse, compare,
 * report) return honest gaps — the handler explicitly records why each is a gap rather
 * than executing. Declared here so the registry can surface truthful executableIntents
 * and discovery cannot over-advertise (INT6A).
 */
export const NUTRITION_KNOWLEDGE_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "search", "explain"];

/**
 * Bind the read-only Nutrition / Knowledge handler to a platform.
 *
 * Production: call with only `platform` — the real registry port is used by default.
 * Tests: pass an in-memory port factory as the second argument so the binding and
 * test share the same registration entry point (INT6B recommendation C4).
 */
export function bindNutritionKnowledgeReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<NutritionKnowledgeReadPort> = createRegistryNutritionKnowledgeReadPort,
): void {
  platform.registerHandler(
    NUTRITION_KNOWLEDGE_CAPABILITY_ID,
    createNutritionKnowledgeReadHandler(resolvePort),
    NUTRITION_KNOWLEDGE_EXECUTABLE_INTENTS,
  );
}
