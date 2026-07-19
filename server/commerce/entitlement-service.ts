// BUS2A — the entitlement service. The one place the product asks
// "what may this household do?" and gets an answer involving I/O.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 4 — runtime consumes one assembled model per entity. This is the
//     assembled model for entitlement, and every gate resolves through it.
//
// THE RULE IS NOT HERE. It is in shared/commerce/entitlements.ts, pure and
// testable without a database. This file gathers the three inputs that rule
// needs — the user's own subscription, their household's, and the legacy tier —
// and hands them over. Splitting it this way is what lets `access.ts` answer
// synchronously from a `User` object while a route answers from the database,
// with ONE rule engine underneath and no second implementation to drift.
//
// IT CLASSIFIES; IT DOES NOT AUTHORISE. `server/lib/access.ts` remains the
// platform's sole authorisation authority (BUS1, § 9). Nothing here decides who
// somebody is or what they may reach.

import type { User } from "@shared/schema";
import {
  entitlementsForPlan,
  resolveEntitlements,
  type EntitlementState,
  type LimitKey,
  type PlanId,
} from "@shared/commerce";
import {
  getHouseholdSubscriptions,
  getSubscriptionForUser,
} from "./subscription-store";

/**
 * A user's legacy tier, read defensively.
 *
 * `users.subscription_tier` is `NOT NULL DEFAULT 'free'` and carries a CHECK
 * constraint, so an unrecognised value should be impossible. It is validated
 * anyway, because the failure mode of trusting it is granting premium on a
 * malformed string, and the cost of the check is one comparison.
 */
function legacyTierOf(user: Pick<User, "subscriptionTier">): PlanId | null {
  const tier = user.subscriptionTier;
  return tier === "premium" || tier === "friends_family" || tier === "free"
    ? tier
    : null;
}

/**
 * The full entitlement projection for a user, including their household's.
 *
 * ASYNC AND DATABASE-BACKED. Use this wherever a household's shared
 * subscription must count — which is anywhere the answer is shown to a
 * household or gates a write.
 *
 * `householdId` is passed in rather than looked up because the caller almost
 * always has it already, and a second lookup on every gate check would put a
 * query on paths that do not need one.
 */
export async function entitlementsForUser(
  user: Pick<User, "id" | "subscriptionTier">,
  householdId: number | null,
  now: Date = new Date(),
): Promise<EntitlementState> {
  const own = await getSubscriptionForUser(user.id);
  const household = householdId
    ? await getHouseholdSubscriptions(householdId, user.id)
    : [];

  return resolveEntitlements(
    {
      subscription: own?.snapshot ?? null,
      householdSubscriptions: household,
      legacyTier: legacyTierOf(user),
    },
    now,
  );
}

/**
 * The entitlement projection derivable from a `User` object alone.
 *
 * SYNCHRONOUS, AND DELIBERATELY WEAKER THAN THE ABOVE. It sees the legacy tier
 * and nothing else — no subscription row, no household. It exists because
 * `server/lib/access.ts` has twenty-odd synchronous call sites that take a
 * `User`, and rewriting all of them to be async in this change would be a large
 * behavioural diff across the platform in a workstream that is meant to add no
 * live commercial behaviour at all.
 *
 * THIS IS CORRECT TODAY AND WILL NOT BE CORRECT LATER, SO SAY SO PLAINLY:
 * it agrees with `entitlementsForUser` exactly as long as no subscription rows
 * exist — which is guaranteed today, because BUS2A activates none. The moment
 * BUS2B writes the first row, every consumer that needs household-aware or
 * subscription-aware truth must be on the async path.
 *
 * That migration is a named BUS2B deliverable rather than a discovered
 * surprise, and the verification test asserts the two agree while the
 * precondition holds, so the day it stops being true the suite says so.
 */
export function entitlementsFromUser(
  user: Pick<User, "subscriptionTier"> | null | undefined,
  now: Date = new Date(),
): EntitlementState {
  if (!user) return entitlementsForPlan("free");
  return resolveEntitlements({ legacyTier: legacyTierOf(user) }, now);
}

/**
 * Whether one more of something is permitted, with the count supplied.
 *
 * Returns a REASON alongside the verdict so the route can say something true to
 * the household instead of composing its own sentence from a boolean — which is
 * how `server/routes.ts` ended up with three differently-worded limit messages
 * quoting numbers that lived in three different places.
 */
export interface LimitVerdict {
  allowed: boolean;
  limit: number | null;
  current: number;
  planId: PlanId;
}

export function checkLimit(
  state: EntitlementState,
  limit: LimitKey,
  currentCount: number,
): LimitVerdict {
  const ceiling = state.limits[limit] ?? null;
  return {
    allowed: ceiling === null || currentCount < ceiling,
    limit: ceiling,
    current: currentCount,
    planId: state.planId,
  };
}
