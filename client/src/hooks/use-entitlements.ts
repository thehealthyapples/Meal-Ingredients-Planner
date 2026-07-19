// BUS2A — the client's one reader of the entitlement projection.
//
// Governing architecture: docs/architecture/THA_COMMERCIAL_ARCHITECTURE.md
//   C2  — THA owns the projection; no surface asks a provider anything.
//   C11 — the projection CLASSIFIES. It never authorises.
//   C12 — feature and limit keys are a closed vocabulary.
//
// ─────────────────────────────────────────────────────────────────────────────
// THIS IS PRESENTATION ONLY. IT IS NOT A SECURITY BOUNDARY.
//
// Everything here runs on a device the household controls, so every answer it
// gives is advisory: it decides what to DRAW, never what is PERMITTED. The
// server re-resolves the same projection through `server/lib/access.ts` — the
// platform's sole authorisation authority (C11) — and a client that lied to
// itself gets a 402 or 403 from the route it tried to use.
//
// The value of rendering from the projection is not enforcement. It is that a
// household is never shown a door that will not open, and never shown a ceiling
// that is not the real one.
// ─────────────────────────────────────────────────────────────────────────────
//
// WHY THIS EXISTS AT ALL: before it, four client surfaces answered "may we?" by
// comparing `user.subscriptionTier` to string literals and comparing counts to
// typed integers. That is Principle 2's duplicate ownership in its plainest
// form — the ceiling on shared plans was written down in `plans.ts`, in a route
// handler, in an environment variable and in a sentence of UI copy, and nothing
// made them agree. They agreed by coincidence, until they wouldn't.

import { useQuery } from "@tanstack/react-query";
import {
  entitlementsForPlan,
  hasFeature,
  isWithinLimit,
  limitFor,
  type EntitlementState,
  type FeatureKey,
  type LimitKey,
} from "@shared/commerce";

/**
 * The free plan's entitlements, used whenever the real answer is not known yet.
 *
 * FAILS CLOSED, and that direction is deliberate. While the query is in flight,
 * or the household is signed out, or the request failed, this hook reports the
 * LEAST capable plan. The failure mode of failing open is showing a household
 * an unlocked control that the server then refuses — an offer withdrawn at the
 * moment it is accepted, which reads as the product breaking rather than as the
 * product having a limit.
 *
 * The cost of failing closed is a locked control appearing briefly on a slow
 * connection for a household that has in fact paid. That is a worse experience
 * for a moment; the alternative is a worse experience at the moment that
 * matters most.
 */
const FALLBACK: EntitlementState = entitlementsForPlan("free");

export interface Entitlements {
  /** The resolved projection — the free plan until the real answer arrives. */
  state: EntitlementState;
  /** True while the true answer is not yet known. `state` is the fallback. */
  isLoading: boolean;
  /** Whether the plan grants a feature. Closed vocabulary (C12). */
  can: (feature: FeatureKey) => boolean;
  /** The ceiling for a limit, or null for no ceiling. */
  ceiling: (limit: LimitKey) => number | null;
  /** Whether one MORE would still sit within the ceiling. */
  within: (limit: LimitKey, currentCount: number) => boolean;
}

export function useEntitlements(): Entitlements {
  const { data, isPending } = useQuery<EntitlementState>({
    queryKey: ["/api/commerce/entitlements"],
    queryFn: async () => {
      const res = await fetch("/api/commerce/entitlements", {
        credentials: "include",
      });
      // A signed-out visitor is not an error — it is the free plan. Throwing
      // here would put the query into a retry/error state for what is simply
      // the normal state of every logged-out page.
      if (res.status === 401) return FALLBACK;
      if (!res.ok) throw new Error("Failed to fetch entitlements");
      return await res.json();
    },
    retry: false,
  });

  const state = data ?? FALLBACK;

  return {
    state,
    isLoading: isPending,
    can: (feature: FeatureKey) => hasFeature(state, feature),
    ceiling: (limit: LimitKey) => limitFor(state, limit),
    within: (limit: LimitKey, currentCount: number) =>
      isWithinLimit(state, limit, currentCount),
  };
}
