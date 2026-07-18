/**
 * Engineering Knowledge Capability Binding (ENGINT1)
 * ==================================================
 * Activates the EXISTING `developer` capability — *"Architecture/workflow
 * knowledge — isolated developer plane only; never user plane"* — on an
 * Intelligence Platform instance.
 *
 * IT CREATES NO NEW CAPABILITY, AND THAT IS THE POINT. The `developer`
 * capability has been declared in the Capability Registry since TIP1, owning
 * exactly this knowledge (`owner: "repo + docs/ + SoT Register"`). Registering a
 * second `engineering-intelligence` capability beside it would have given one
 * body of knowledge two owners — failing the Architecture Compliance Checklist
 * on *"No duplicate ownership"* and *"No duplicate entities"* — so ENGINT1
 * activates the declaration that already existed rather than adding a rival to
 * it. One Intelligence Platform, one Companion, one Capability Registry, one
 * source of truth.
 *
 * WHO MAY CALL THIS. Only `server/intelligence/developer-plane.ts`. Binding this
 * handler to the canonical user-facing platform is prohibited by TIP1 §7 —
 * *"sharing an endpoint would make boundary 2 a single misclassification away
 * from a leak"* — and is prevented structurally, not by convention: the
 * user-facing seed keeps `developer` at `availability: "never"`, which
 * `permissions.ts` rejects before any role check, and `bindHandler` is never
 * reached for it on that plane.
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import {
  createEngineeringKnowledgeReadHandler,
  ENGINEERING_KNOWLEDGE_EXECUTABLE_INTENTS,
} from "../handlers/engineering-knowledge-read-handler.js";
import {
  createRegistryEngineeringKnowledgeReadPort,
  type EngineeringKnowledgeReadPort,
} from "../handlers/engineering-knowledge-read-port.js";

/**
 * The capability id this binding activates. It is `developer` — the id TIP1
 * declared — and deliberately NOT a new `engineering-intelligence` id.
 */
export const ENGINEERING_KNOWLEDGE_CAPABILITY_ID = "developer";

/** Re-exported so callers and tests read the executable set from one place. */
export const ENGINEERING_KNOWLEDGE_INTENTS: readonly IntentVerb[] = ENGINEERING_KNOWLEDGE_EXECUTABLE_INTENTS;

export function bindEngineeringKnowledgeReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<EngineeringKnowledgeReadPort> = createRegistryEngineeringKnowledgeReadPort,
): void {
  platform.registerHandler(
    ENGINEERING_KNOWLEDGE_CAPABILITY_ID,
    createEngineeringKnowledgeReadHandler(resolvePort),
    ENGINEERING_KNOWLEDGE_INTENTS,
  );
}
