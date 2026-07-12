/**
 * Product Knowledge Capability Binding (PHASE5A)
 * ==============================================
 * Activates the `product-knowledge` capability on the THA Intelligence Platform:
 * the read path by which THA can answer questions about ITSELF from an owned,
 * permission-aware registry instead of from a hardcoded sentence.
 *
 * This is Rule PKR20 realised: Product Knowledge reaches the model through the
 * FRONT DOOR THAT ALREADY EXISTS and gets no bespoke path. It is a registered
 * Knowledge Capability like any other — the Capability Registry still owns
 * capability metadata and permission-aware access, INT17 still owns every byte
 * the model reads, `access.ts` still owns identity, and the registry still owns
 * nothing but the knowledge. Four ownerships, all intact, which is the entire
 * reason for routing it this way rather than any shorter way.
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createProductKnowledgeReadHandler } from "../handlers/product-knowledge-read-handler.js";
import {
  createRegistryProductKnowledgeReadPort,
  type ProductKnowledgeReadPort,
} from "../handlers/product-knowledge-read-port.js";

/** The capability id this binding activates. */
export const PRODUCT_KNOWLEDGE_CAPABILITY_ID = "product-knowledge";

/**
 * The verbs this read-only binding actually executes. `report` is deliberately
 * NOT here: a "report on the product" would require the platform to select,
 * order and summarise what matters about THA — an editorial judgement the
 * registry's owners make, not one the Intelligence Platform may make on their
 * behalf. It returns an honest gap.
 */
export const PRODUCT_KNOWLEDGE_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "search", "explain"];

export function bindProductKnowledgeReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<ProductKnowledgeReadPort> = createRegistryProductKnowledgeReadPort,
): void {
  platform.registerHandler(
    PRODUCT_KNOWLEDGE_CAPABILITY_ID,
    createProductKnowledgeReadHandler(resolvePort),
    PRODUCT_KNOWLEDGE_EXECUTABLE_INTENTS,
  );
}
