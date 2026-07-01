/**
 * Partners Read Port (INT14)
 * ===========================
 * The NARROW, read-only delegation surface the Partners capability handler is allowed
 * to call. The single method here is a 1:1 forward to an EXISTING owning-service
 * function — `getBasketSupermarkets()` (`server/lib/supermarket-basket-service.ts:224`),
 * the static 9-retailer list (name/key/color/hasDirectBasket). This port adds NO
 * partners business logic; it is a typed seam so that:
 *   • the handler delegates (never re-implements) the retailer read, and
 *   • tests can inject an in-memory owner to prove delegation without a live import.
 *
 * SCOPE, PER THE CANONICAL CAPABILITY CARD (docs/architecture/capabilities/partners.md):
 * this is the ONLY safe, fabrication-free read in the "Partners / Supermarkets"
 * capability. `/api/routing` and `/api/savings/*` are unrelated concerns (excluded from
 * this capability entirely, per the Card). Per-store price comparison (`compare` /
 * `recommend`) has no stored owner — the only code path that could serve it makes a
 * live external fetch and synthesizes per-store prices with hardcoded multipliers,
 * which would be a fabrication if presented as fact. `verifyStoreAvailability()` is an
 * unimplemented stub. None of those are exposed by this port.
 *
 * GOVERNANCE: the static retailer list is not user-owned (no ownership scoping is
 * possible or required), but the live human route (`/api/basket/supermarkets-enhanced`)
 * still requires `req.isAuthenticated()` — the handler mirrors that gate. This port has
 * NO write methods by construction (INT14 is read-only).
 */

/** A retailer as the owner stores it — name/key/color/hasDirectBasket, nothing else. */
export interface RetailerRef {
  readonly name: string;
  readonly key: string;
  readonly color: string;
  readonly hasDirectBasket: boolean;
}

/**
 * The read-only owning-service surface. The single method forwards to the existing
 * Partners owner's static retailer list.
 */
export interface PartnersReadPort {
  /** Partners owner — the static, hardcoded list of supported UK retailers. */
  getBasketSupermarkets(): Promise<RetailerRef[]>;
}

/**
 * Build the production port over the real owning service. The import is DYNAMIC so
 * that loading the Intelligence Platform module never opens the owning module at
 * import time — the owner is only touched on first invocation. `getBasketSupermarkets`
 * is itself synchronous (a static array, not a database read); the port wraps it in a
 * Promise only to match the async port contract shared by every other capability.
 */
export async function createStoragePartnersReadPort(): Promise<PartnersReadPort> {
  const { getBasketSupermarkets } = await import("../../lib/supermarket-basket-service.js");
  return {
    getBasketSupermarkets: async () => getBasketSupermarkets(),
  };
}
