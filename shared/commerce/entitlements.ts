// BUS2A — the entitlement projection. THE canonical answer to "what may this
// household do?", and the last step before product access.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 2 — one owner per fact. This module owns the RULE. Not the data:
//     the subscription rows, the legacy column and the household membership all
//     belong to their existing owners and are passed IN.
//   Principle 4 — runtime consumes one assembled model per entity. This is that
//     model for entitlement. No surface may re-derive access by reading a tier
//     and comparing strings, which is precisely what four surfaces do today
//     (server/routes.ts:7319, share-plan-dialog.tsx:47, templates-panel.tsx:211,
//     and access.ts itself). BUS2A converges them onto this.
//
// PURE AND ZERO-I/O. Takes `now` as an argument.
//
// ─────────────────────────────────────────────────────────────────────────────
// THIS MODULE CLASSIFIES. IT NEVER AUTHORISES.
//
// The distinction is BUS1's, made when the personal data registry was built
// (THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md § 9): "any second authorisation
// authority — server/lib/access.ts remains the only one — the registry LABELS
// where it never AUTHORISES."
//
// The same line is held here, and it matters more, because entitlement looks so
// much more like authorisation than a data-category label does. `access.ts`
// remains the sole authority on who somebody is and what they may reach; this
// module only answers what a PLAN grants. `isAdmin` is deliberately not an input
// below: an operator's bypass is a fact about a ROLE, and mixing it in here
// would mean a change to the plan catalogue — a data file — could grant or
// revoke operator access. That is how a Markdown-edit-sized change becomes a
// privilege escalation, and BUS1 refused it for the same reason.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  EntitlementSource,
  FeatureKey,
  LimitKey,
  PlanId,
} from "./types";
import { LIMIT_KEYS } from "./types";
import { PLAN_CATALOGUE } from "./plans";
import type { SubscriptionSnapshot } from "./subscription";
import { effectivePlan, planRank } from "./subscription";

/**
 * Everything the rule needs, supplied by the caller.
 *
 * `legacyTier` is `users.subscription_tier` — Domain 26's pre-BUS2A owner. It
 * is an input rather than a rival source, and it is what BUS2B retires. See
 * RESOLUTION ORDER.
 */
export interface EntitlementInput {
  /** This user's own subscription, if any. */
  subscription?: SubscriptionSnapshot | null;
  /** Entitling subscriptions held by OTHER active members of the household. */
  householdSubscriptions?: readonly SubscriptionSnapshot[];
  /** `users.subscription_tier`. */
  legacyTier?: PlanId | null;
}

export interface EntitlementState {
  planId: PlanId;
  source: EntitlementSource;
  features: readonly FeatureKey[];
  /** Every limit key, resolved. `null` means no ceiling. */
  limits: Readonly<Record<LimitKey, number | null>>;
}

/**
 * RESOLUTION ORDER — the highest-ranked ENTITLING source wins.
 *
 * It is a maximum, not a precedence chain, and that is a deliberate choice with
 * a household-shaped reason. Under strict precedence, a member whose own
 * subscription had lapsed would resolve to `free` on their own expired row and
 * never reach their household's active one — so one person's expired card would
 * quietly remove the whole family's access to a plan somebody else is paying
 * for. Taking the maximum cannot produce that.
 *
 * ─── HOUSEHOLD ENTITLEMENT ───────────────────────────────────────────────────
 * A subscription is bought by a person and entitles a HOUSEHOLD. THA is built
 * around the Household First Principle, and a family sharing one meal plan,
 * one shopping list and one set of allergies cannot sensibly have four
 * different answers to "may we keep this plan?". Only ACTIVE members count
 * (`household_members.status`), so a departed member's subscription stops
 * entitling the household they left — and, symmetrically, they keep what they
 * are paying for.
 *
 * ─── WHY `legacy-tier` IS STILL HERE, STATED PLAINLY ─────────────────────────
 * `users.subscription_tier` is the LIVE owner of Domain 26 today. There are no
 * subscription rows in any environment, because BUS2A activates none. If this
 * resolver ignored the column, every premium and friends-and-family household
 * in the platform would silently drop to free the moment it was wired in. So it
 * is read, last, and only when nothing better exists.
 *
 * Under Principle 2's scope test the column and the table cannot legitimately
 * disagree, so one is redundant — and Principle 8 requires the retirement
 * condition to be stated in the same change rather than left to be discovered:
 *
 *   RETIREMENT CONDITION. `users.subscription_tier` is dropped, and the
 *   `legacy-tier` source deleted from this module, when BUS2B has (a) a live
 *   billing provider, and (b) migrated every non-free row in `users` into a
 *   `subscriptions` row. Until both hold, the column is the owner and this
 *   fallback is what keeps that true rather than a bridge that hides it.
 *
 * This is NOT a Principle 7 synchronisation bridge: nothing writes the column
 * to match the table or the table to match the column. It is a read-order with
 * a stated end, which is what Principle 8 calls migrating behind a stable
 * signature.
 */
export function resolveEntitlements(
  input: EntitlementInput,
  now: Date,
): EntitlementState {
  const candidates: Array<{ plan: PlanId; source: EntitlementSource }> = [];

  if (input.subscription) {
    candidates.push({
      plan: effectivePlan(input.subscription, now),
      source: "subscription",
    });
  }

  for (const held of input.householdSubscriptions ?? []) {
    candidates.push({ plan: effectivePlan(held, now), source: "household" });
  }

  if (input.legacyTier) {
    candidates.push({ plan: input.legacyTier, source: "legacy-tier" });
  }

  let best: { plan: PlanId; source: EntitlementSource } = {
    plan: "free",
    source: "default",
  };
  for (const candidate of candidates) {
    if (planRank(candidate.plan) > planRank(best.plan)) best = candidate;
  }

  return stateFor(best.plan, best.source);
}

function stateFor(planId: PlanId, source: EntitlementSource): EntitlementState {
  const plan = PLAN_CATALOGUE[planId];
  const limits = Object.fromEntries(
    LIMIT_KEYS.map(key => [key, plan.limits[key] ?? null]),
  ) as Record<LimitKey, number | null>;

  return { planId, source, features: plan.features, limits };
}

/** The entitlements of a plan on its own. Used where no subscription exists. */
export function entitlementsForPlan(planId: PlanId): EntitlementState {
  return stateFor(planId, "default");
}

export function hasFeature(
  state: EntitlementState,
  feature: FeatureKey,
): boolean {
  return state.features.includes(feature);
}

/** A ceiling, or null for none. */
export function limitFor(
  state: EntitlementState,
  limit: LimitKey,
): number | null {
  return state.limits[limit] ?? null;
}

/**
 * Whether one more would still be within the ceiling.
 *
 * Takes the CURRENT COUNT rather than counting anything itself — counting is
 * I/O and this module does none. Callers pass what their own store told them.
 */
export function isWithinLimit(
  state: EntitlementState,
  limit: LimitKey,
  currentCount: number,
): boolean {
  const ceiling = limitFor(state, limit);
  return ceiling === null || currentCount < ceiling;
}
