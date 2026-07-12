/**
 * Product Knowledge Read Port (PHASE5A)
 * =====================================
 * The delegation surface onto the Product Knowledge Registry owner
 * (`server/services/product-knowledge-registry.ts`).
 *
 * Every method takes the caller's already-resolved visibility tier as its FIRST
 * argument, and there is no method that omits it. That is not a convention — it
 * is the interface making the unfiltered read UNTYPEABLE. A handler cannot
 * accidentally fetch an entry above the caller's tier, because this port exposes
 * no function that would return one (Rule PKR26 — filtering happens before
 * composition, never in the model).
 *
 * READ-ONLY BY CONSTRUCTION: no write method exists. The registry is authored in
 * `docs/product/inventory/product.yaml` by a human and generated to JSON; nothing
 * at runtime may create, edit or retire an entry.
 */

import type {
  ProductEntryView,
  ProductVisibility,
} from "../../services/product-knowledge-registry.js";

export interface ProductKnowledgeReadPort {
  /** Entries this tier may be told, optionally within one section. */
  listEntries(tier: ProductVisibility, section?: string): Promise<ProductEntryView[]>;
  /** One entry by id. `undefined` for BOTH "unknown" and "above your tier" —
   *  the caller is given no way to tell them apart (Rule PKR29). */
  getEntry(tier: ProductVisibility, id: string): Promise<ProductEntryView | undefined>;
  /** Sections visible at this tier, with the count visible at this tier. */
  listSections(tier: ProductVisibility): Promise<{ section: string; count: number }[]>;
  /** Substring search across the entries this tier may be told. */
  searchEntries(tier: ProductVisibility, query: string): Promise<ProductEntryView[]>;
}

/**
 * Production factory. Dynamic import so binding this capability does not read
 * the inventory file at import time — the owner is only touched on first
 * invocation, mirroring every other binding's no-DB-connection-at-import rule.
 */
export async function createRegistryProductKnowledgeReadPort(): Promise<ProductKnowledgeReadPort> {
  const registry = await import("../../services/product-knowledge-registry.js");
  return {
    listEntries: async (tier, section) => registry.listEntries(tier, section),
    getEntry: async (tier, id) => registry.getEntry(tier, id),
    listSections: async (tier) => registry.listSections(tier),
    searchEntries: async (tier, query) => registry.searchEntries(tier, query),
  };
}
