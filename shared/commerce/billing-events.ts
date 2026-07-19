// BUS2A — the billing-event vocabulary, and the pure reducer that projects it.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 2 — one owner per fact. The event log owns WHAT HAPPENED. The
//     snapshot owns WHAT IS NOW. The snapshot is derived from the log and is
//     never independently written, so the two cannot disagree — which is the
//     only construction under which they are not two owners of one fact.
//   Principle 7 — no permanent synchronisation bridge. This is emphatically not
//     one. Nothing here keeps two stores in agreement; events flow one way and
//     the projection is a fold. The Principle 7 test — "does this bridge exist
//     because two stores both own the same fact?" — answers no.
//
// PURE AND ZERO-I/O. The reducer is a function of (snapshot, event). It reads no
// clock: every event carries its own `occurredAt`, because an event that
// arrives late must still be applied as of when it happened.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE PROVIDER BOUNDARY IS THIS FILE
//
// These event kinds are THA's, not Stripe's. BUS2B will write ONE translation
// function — provider webhook payload → BillingEvent — and that function is the
// only place in the platform permitted to know a provider's vocabulary. Past it,
// nothing knows who processes payments, and swapping provider is a change to one
// translator rather than an archaeology exercise across the codebase.
//
// The list is deliberately shorter than any provider's. Stripe emits well over a
// hundred event types; almost all of them are facts about Stripe (a price object
// was updated, a payment method was attached) rather than facts about a
// household's access. Only the ones that CHANGE WHAT A HOUSEHOLD MAY DO earn a
// place here. The translator is expected to discard most of what it receives,
// and discarding is a decision the boundary is for.
// ─────────────────────────────────────────────────────────────────────────────

import type { BillingPeriod, PlanId } from "./types";
import type { SubscriptionSnapshot } from "./subscription";
import { classifyPlanChange } from "./subscription";

export const BILLING_EVENT_KINDS = [
  /** A trial began. Entitles from now until `trialEndsAt`. */
  "trial-started",
  /** A subscription became paid and current. Ends any trial. */
  "activated",
  /** A term renewed. Moves `currentPeriodEnd` forward. */
  "renewed",
  /** A payment failed. Begins the bounded recovery window. */
  "payment-failed",
  /** A previously-failed payment succeeded. Ends the recovery window. */
  "payment-recovered",
  /** The plan changed. Timing depends on classifyPlanChange(). */
  "plan-changed",
  /** The household asked to cancel. Access continues to period end. */
  "cancellation-scheduled",
  /** The household changed their mind before the term ended. */
  "cancellation-revoked",
  /** The subscription is over. Terminal. */
  "ended",
] as const;

export type BillingEventKind = (typeof BILLING_EVENT_KINDS)[number];

/**
 * One thing that happened to a subscription.
 *
 * `providerEventId` IS THE IDEMPOTENCY KEY, and it is required. Every payment
 * provider redelivers webhooks — on timeout, on a non-2xx, on their own retry
 * schedule — so "this event arrives more than once" is the normal case and not
 * the exceptional one. The store enforces a UNIQUE constraint on it, so a
 * redelivery is a no-op at the database rather than a second application of the
 * same state change. Getting this wrong means a duplicated `renewed` extends a
 * household's term for free, or a duplicated `ended` cuts off a household who
 * is paying.
 *
 * For events THA raises itself (an operator grant, a trial start) the id is
 * minted locally with a `tha:` prefix, so the same uniqueness applies to both
 * origins and there is no second, weaker path.
 */
export interface BillingEvent {
  providerEventId: string;
  kind: BillingEventKind;
  occurredAt: Date;
  planId?: PlanId;
  billingPeriod?: BillingPeriod | null;
  trialEndsAt?: Date | null;
  currentPeriodEnd?: Date | null;
}

/**
 * Apply one event to a snapshot. PURE — no clock, no I/O, no mutation.
 *
 * Called in `occurredAt` order over the full event log to build the projection.
 * Because it is a fold over a log deduplicated by `providerEventId`, replaying
 * from the beginning always produces the same answer — which is what makes the
 * projection rebuildable rather than a value that drifts and must be trusted.
 */
export function applyBillingEvent(
  snapshot: SubscriptionSnapshot,
  event: BillingEvent,
): SubscriptionSnapshot {
  const next: SubscriptionSnapshot = { ...snapshot };

  switch (event.kind) {
    case "trial-started":
      next.planId = event.planId ?? snapshot.planId;
      next.status = "trialing";
      next.trialEndsAt = event.trialEndsAt ?? null;
      next.billingPeriod = event.billingPeriod ?? null;
      next.pastDueSince = null;
      next.cancelAtPeriodEnd = false;
      break;

    case "activated":
      next.planId = event.planId ?? snapshot.planId;
      next.status = "active";
      // The trial is over because the subscription is paid, not because a
      // date passed. Clearing it stops effectiveStatus() from later reading a
      // stale trial end on an active subscription.
      next.trialEndsAt = null;
      next.billingPeriod = event.billingPeriod ?? snapshot.billingPeriod;
      next.currentPeriodEnd = event.currentPeriodEnd ?? snapshot.currentPeriodEnd;
      next.pastDueSince = null;
      next.cancelAtPeriodEnd = false;
      break;

    case "renewed": {
      // A renewal is where a scheduled downgrade lands. It is the only moment
      // the household's term genuinely rolls over, so it is the only honest
      // place to apply a change that was deferred to "period end".
      if (snapshot.pendingPlanId) {
        next.planId = snapshot.pendingPlanId;
        next.pendingPlanId = null;
      }
      next.status = "active";
      next.currentPeriodEnd = event.currentPeriodEnd ?? snapshot.currentPeriodEnd;
      next.pastDueSince = null;
      break;
    }

    case "payment-failed":
      next.status = "past_due";
      // Only the FIRST failure starts the clock. A provider retrying three
      // times over a fortnight must not reset the grace window on each
      // attempt, or a subscription could sit past_due indefinitely.
      next.pastDueSince = snapshot.pastDueSince ?? event.occurredAt;
      break;

    case "payment-recovered":
      next.status = "active";
      next.pastDueSince = null;
      next.currentPeriodEnd = event.currentPeriodEnd ?? snapshot.currentPeriodEnd;
      break;

    case "plan-changed": {
      const target = event.planId ?? snapshot.planId;
      const kind = classifyPlanChange(snapshot.planId, target);
      if (kind === "downgrade") {
        // Deferred, not applied. They paid for this term.
        next.pendingPlanId = target;
      } else {
        next.planId = target;
        next.pendingPlanId = null;
      }
      if (event.billingPeriod !== undefined) {
        next.billingPeriod = event.billingPeriod;
      }
      break;
    }

    case "cancellation-scheduled":
      next.status = "cancelled";
      next.cancelAtPeriodEnd = true;
      next.currentPeriodEnd = event.currentPeriodEnd ?? snapshot.currentPeriodEnd;
      // A pending downgrade is meaningless once the whole subscription is
      // ending; leaving it would apply a plan change at a renewal that will
      // never happen.
      next.pendingPlanId = null;
      break;

    case "cancellation-revoked":
      next.status = "active";
      next.cancelAtPeriodEnd = false;
      break;

    case "ended":
      next.status = "expired";
      next.cancelAtPeriodEnd = false;
      next.pendingPlanId = null;
      next.pastDueSince = null;
      break;
  }

  return next;
}

/**
 * Fold an event log into a snapshot.
 *
 * Sorts by `occurredAt` because webhook delivery order is not guaranteed and
 * arrival order is not causal order. Ties break on `providerEventId` so the
 * result is deterministic — the same log always projects to the same snapshot,
 * which is what the verification test asserts by replaying in shuffled order.
 */
export function projectSubscription(
  initial: SubscriptionSnapshot,
  events: readonly BillingEvent[],
): SubscriptionSnapshot {
  return [...events]
    .sort(
      (a, b) =>
        a.occurredAt.getTime() - b.occurredAt.getTime() ||
        a.providerEventId.localeCompare(b.providerEventId),
    )
    .reduce(applyBillingEvent, initial);
}
