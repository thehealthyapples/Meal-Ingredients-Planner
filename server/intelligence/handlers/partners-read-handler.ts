/**
 * Partners Read Handler (INT14 — eighth live capability binding)
 * ================================================================
 * The EIGHTH execution handler bound to the THA Intelligence Platform. It makes the
 * `partners` capability *executable* for a single, narrow READ-ONLY scope, by
 * delegating to the existing Partners owner through a {@link PartnersReadPort}. It
 * proves the reusable Port → Handler → Binding pattern (first established for the
 * Planner in INT2) against an eighth, independent owner.
 *
 * HARD BOUNDARIES (the reason this binding is safe — per the canonical Capability Card,
 * docs/architecture/capabilities/partners.md):
 *   • READ-ONLY, ONE SCOPE ONLY. Only the "read" verb executes, and only for
 *     `scope: "retailers"`. There is NO code path here for `explain`, `recommend`, or
 *     `compare` — the Card found no safe, grounded owner read for any of them.
 *   • NO PRICE FABRICATION. This handler never surfaces a per-store price, a price
 *     comparison, or a store recommendation. The only code path that could synthesize
 *     those (product-matching-service.ts → price-lookup.ts) makes a live external fetch
 *     and applies hardcoded variance/tier multipliers to it — presenting that as fact
 *     would be a fabrication (Principle 6). This binding does not touch that path.
 *   • DELEGATION ONLY. The retailer list comes from the owning service via the port,
 *     unmodified. This file contains NO retailer business logic, NO ranking, and NO
 *     synthesis of its own.
 *   • PERMISSION-AWARE. The retailer list itself is not user-owned (no ownership
 *     scoping applies), but the live human route (`/api/basket/supermarkets-enhanced`)
 *     still requires an authenticated caller — this handler mirrors that gate.
 *   • HONEST GAPS. A missing or unsupported `scope` parameter returns a structured gap
 *     naming the one supported scope, never a fabricated answer.
 *
 * The handler is built by {@link createPartnersReadHandler} with a port provider, so the
 * production binding injects the real owning service and tests inject an in-memory owner.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { PartnersReadPort, RetailerRef } from "./partners-read-port.js";
import { requireUserId, gap, readOnlyVerbGuard } from "./_read-kit.js";

// ---------------------------------------------------------------------------
// Result shapes (read projections — the owner's static data, surfaced unmodified)
// ---------------------------------------------------------------------------

/** A retailer as the read binding surfaces it — a direct passthrough of the owner's fields. */
export interface RetailerView {
  readonly name: string;
  readonly key: string;
  readonly color: string;
  readonly hasDirectBasket: boolean;
}

export interface PartnersRetailersReadResult {
  readonly scope: "retailers";
  readonly retailerCount: number;
  readonly retailers: readonly RetailerView[];
  readonly source: "retail-intelligence";
}

// ---------------------------------------------------------------------------
// Read projections (stored fields only — no fabrication)
// ---------------------------------------------------------------------------

function toRetailerView(r: RetailerRef): RetailerView {
  return {
    name: r.name,
    key: r.key,
    color: r.color,
    hasDirectBasket: r.hasDirectBasket,
  };
}

// ---------------------------------------------------------------------------
// Verb implementations
// ---------------------------------------------------------------------------

/**
 * Read the static retailer list. Requires `scope: "retailers"` — the only scope this
 * capability has a safe, fabrication-free owner for (per the Capability Card). Any
 * other scope, or a missing scope, is an honest gap naming the supported scope.
 */
async function handleRead(intent: Intent, port: PartnersReadPort): Promise<PartnersRetailersReadResult> {
  const params = intent.parameters ?? {};
  const scope = params.scope as string | undefined;

  if (scope !== "retailers") {
    throw gap(
      `Unsupported partners read scope ${JSON.stringify(scope)}. ` +
        'Supported scope: "retailers" (the static list of supported UK retailers). ' +
        "Per-store price comparison and routing are not part of this capability's safe, grounded reads.",
    );
  }

  const retailers = await port.getBasketSupermarkets();
  return {
    scope: "retailers",
    retailerCount: retailers.length,
    retailers: retailers.map(toRetailerView),
    source: "retail-intelligence",
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the partners read-only handler. `resolvePort` provides the owning-service
 * surface (production: real owner; tests: in-memory owner). The returned handler is
 * what the Capability Registry binds to the `partners` capability (INT14).
 */
export function createPartnersReadHandler(
  resolvePort: () => Promise<PartnersReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding, single scope: only "read" executes. "explain", "recommend",
    // and "compare" are all in the partners allow-list but all out of scope for this
    // binding — the Card found no safe, grounded owner for any of them. There is no
    // code path here that fabricates a price, a comparison, or a recommendation.
    readOnlyVerbGuard(intent, ["read"], "Partners");

    // The retailer list is not user-owned, but the live human route still requires an
    // authenticated caller — mirrored here rather than relaxed.
    requireUserId(context, "Partners");
    const port = await resolvePort();

    return handleRead(intent, port);
  };
}
