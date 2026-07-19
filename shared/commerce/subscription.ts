// BUS2A — the subscription lifecycle.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 2 — one owner per fact. This module owns "what a subscription's
//     state means and how it may change". The `subscriptions` table owns the
//     stored values; the projection (server/commerce/) does the I/O. Neither
//     restates the rules, and the rules touch no database.
//   Principle 3 — transactional state, single owner, no enrichment pipeline.
//     A subscription is transactional. It gets one owner and no progressive
//     enrichment, exactly as Principle 3 instructs for Membership.
//
// PURE AND ZERO-I/O. Every function here takes `now` as an argument.
//
// MUST NEVER CONSUME HOUSEHOLD TIME (HT10, § 8.1). Subscription/Trial is a
// permanently-INSTANT domain: a term is a duration, not a date in anybody's
// calendar, and a trial must not be longer for a family in Auckland. The
// comparisons below are all instant-vs-instant.

import type {
  BillingPeriod,
  PlanId,
  SubscriptionStatus,
} from "./types";
import {
  DEFAULT_TRIAL_DAYS,
  ENTITLING_STATUSES,
  PAST_DUE_GRACE_DAYS,
} from "./types";

/**
 * The canonical projection of a subscription — THA's own, never a provider's.
 *
 * This is the shape everything downstream reads. No consumer of it can tell
 * which payment provider produced it, and that is the point of the boundary.
 */
export interface SubscriptionSnapshot {
  planId: PlanId;
  status: SubscriptionStatus;
  /** Null for a plan that does not bill (`free`, `friends_family`). */
  billingPeriod: BillingPeriod | null;
  /** When the trial ends. Null when there is no trial. */
  trialEndsAt: Date | null;
  /** When the paid term ends. Null when there is no term. */
  currentPeriodEnd: Date | null;
  /** A cancellation is scheduled; access continues to `currentPeriodEnd`. */
  cancelAtPeriodEnd: boolean;
  /** A downgrade takes effect at period end. Null when none is scheduled. */
  pendingPlanId: PlanId | null;
  /** When payment first failed. Starts the PAST_DUE_GRACE_DAYS clock. */
  pastDueSince: Date | null;
}

/** A subscription that never existed. The honest starting point. */
export function freeSnapshot(): SubscriptionSnapshot {
  return {
    planId: "free",
    status: "expired",
    billingPeriod: null,
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    pendingPlanId: null,
    pastDueSince: null,
  };
}

/**
 * How plans rank against each other.
 *
 * `friends_family` ranks WITH premium, not above it. It grants the same access
 * by a different route, so treating it as a higher tier would classify an
 * operator moving somebody from friends-and-family to a paid premium plan as a
 * "downgrade" and defer it to period end — which would be wrong, and would be
 * wrong silently.
 */
export function planRank(id: PlanId): number {
  return id === "free" ? 0 : 1;
}

export type PlanChangeKind = "upgrade" | "downgrade" | "lateral" | "none";

/**
 * What kind of change moving from one plan to another is.
 *
 * The distinction is not cosmetic — it decides WHEN the change takes effect:
 *
 *   upgrade   — immediately. A household that has asked for more access, and
 *               (under BUS2B) paid for it, gets it now.
 *   downgrade — at period end. They have already paid for the term they are in,
 *               so taking access away mid-term would be charging for something
 *               and then withdrawing it.
 *   lateral   — immediately. Monthly↔annual, or premium↔friends_family: the
 *               entitlements do not change, so there is nothing to defer.
 *
 * ADDED TO SPARE THE NEXT PERSON THE ARGUMENT: this asymmetry is deliberate and
 * is the household-favouring choice in both directions.
 */
export function classifyPlanChange(from: PlanId, to: PlanId): PlanChangeKind {
  if (from === to) return "none";
  const delta = planRank(to) - planRank(from);
  if (delta > 0) return "upgrade";
  if (delta < 0) return "downgrade";
  return "lateral";
}

/**
 * The status a subscription ACTUALLY has at `now`, given what is stored.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EXPIRY IS DERIVED ON READ, NOT WRITTEN BY A JOB. THIS IS THE LOAD-BEARING
 * DECISION IN THE WHOLE LIFECYCLE, AND IT IS FORCED RATHER THAN CHOSEN.
 *
 * THA HAS NO SCHEDULER. BUS1 recorded that plainly and carried it to BUS2 as an
 * open item: "expired trial accounts are still only cleaned when an admin
 * manually calls the endpoint, and any retention policy that must run on a
 * timer has nothing to hang off" (THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md §11).
 *
 * A lifecycle whose correctness depends on a job that does not exist is a
 * lifecycle that is wrong by default. Stored status would say `trialing` for a
 * trial that ended in March, and every gate reading it would let that household
 * through — not because anybody decided to, but because nothing ran.
 *
 * So the stored status records what HAPPENED (events did occur), and this
 * function answers what IS (the term has since run out). The store is never
 * wrong, because it never claims anything time-dependent. When BUS2B adds a
 * scheduler it may write these transitions down for reporting; it must NOT
 * become the thing gates depend on, or this correctness property is lost.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function effectiveStatus(
  snapshot: SubscriptionSnapshot,
  now: Date,
): SubscriptionStatus {
  const t = now.getTime();

  switch (snapshot.status) {
    case "trialing":
      // A trial with no end date never ends, which is not a trial. Treat the
      // missing date as an ended trial rather than as a permanent one: the
      // failure mode of the first is a household asked to subscribe, and of
      // the second is unlimited free access nobody can account for.
      if (!snapshot.trialEndsAt) return "expired";
      return snapshot.trialEndsAt.getTime() > t ? "trialing" : "expired";

    case "past_due": {
      if (!snapshot.pastDueSince) return "past_due";
      const graceEnds =
        snapshot.pastDueSince.getTime() + PAST_DUE_GRACE_DAYS * DAY_MS;
      return graceEnds > t ? "past_due" : "expired";
    }

    case "cancelled":
      // Cancelled means "will not renew", never "access removed now". The
      // household paid for this term. BUS1 §8.1 — leaving is not made hard,
      // and it is not made punitive either.
      if (!snapshot.currentPeriodEnd) return "expired";
      return snapshot.currentPeriodEnd.getTime() > t ? "cancelled" : "expired";

    case "active":
      // An active subscription past its period end has not renewed. Something
      // upstream failed to tell THA. Reporting `expired` is the honest and the
      // safe reading; reporting `active` would grant access on the strength of
      // an event that never arrived.
      if (!snapshot.currentPeriodEnd) return "active";
      return snapshot.currentPeriodEnd.getTime() > t ? "active" : "expired";

    case "expired":
    case "incomplete":
      return snapshot.status;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whether a status grants access. */
export function isEntitling(status: SubscriptionStatus): boolean {
  return ENTITLING_STATUSES.includes(status);
}

/**
 * The plan a snapshot actually entitles at `now`.
 *
 * `free` whenever the effective status does not entitle — which is how a lapsed
 * premium subscription becomes a free household without anything having to run.
 */
export function effectivePlan(
  snapshot: SubscriptionSnapshot,
  now: Date,
): PlanId {
  return isEntitling(effectiveStatus(snapshot, now)) ? snapshot.planId : "free";
}

/** When a trial started `now` would end. A duration added to an instant. */
export function trialEndFrom(now: Date, days: number = DEFAULT_TRIAL_DAYS): Date {
  return new Date(now.getTime() + days * DAY_MS);
}

/**
 * Whole days remaining, for a household-facing countdown. Never negative.
 *
 * Returns a COUNT, never a formatted string and never a date: the words belong
 * to their surface, and the calendar belongs to nobody in this domain.
 */
export function daysRemaining(at: Date | null, now: Date): number | null {
  if (!at) return null;
  return Math.max(0, Math.ceil((at.getTime() - now.getTime()) / DAY_MS));
}
