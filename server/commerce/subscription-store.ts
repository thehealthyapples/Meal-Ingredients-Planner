// BUS2A — subscription and billing-event persistence, and the projection.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 2 — one owner per fact. This module is the ONLY reader and writer
//     of `subscriptions` and `billing_events`. Nothing else may touch either
//     table — the same sole-ownership BUS1 established for its three, and which
//     the publication register verifies.
//   Principle 3 — transactional state: one owner, no duplicate state, no
//     enrichment pipeline bolted on.
//
// The RULES live in shared/commerce/ and are pure. This file does I/O and
// applies them; it decides nothing about what a plan grants or what a status
// means.

import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "../db";
import { billingEvents, householdMembers, subscriptions } from "@shared/schema";
import type { Subscription } from "@shared/schema";
import {
  applyBillingEvent,
  freeSnapshot,
  projectSubscription,
  type BillingEvent,
  type BillingEventKind,
  type BillingPeriod,
  type PlanId,
  type SubscriptionSnapshot,
  type SubscriptionStatus,
} from "@shared/commerce";

/** A stored row, read as the canonical snapshot shape. */
function toSnapshot(row: Subscription): SubscriptionSnapshot {
  return {
    planId: row.planId as PlanId,
    status: row.status as SubscriptionStatus,
    billingPeriod: (row.billingPeriod as BillingPeriod | null) ?? null,
    trialEndsAt: row.trialEndsAt ?? null,
    currentPeriodEnd: row.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    pendingPlanId: (row.pendingPlanId as PlanId | null) ?? null,
    pastDueSince: row.pastDueSince ?? null,
  };
}

/** The subscription a user holds in their own name, if any. */
export async function getSubscriptionForUser(
  userId: number,
): Promise<{ row: Subscription; snapshot: SubscriptionSnapshot } | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return row ? { row, snapshot: toSnapshot(row) } : null;
}

/**
 * Subscriptions held by OTHER ACTIVE members of this household.
 *
 * `status = 'active'` on the MEMBERSHIP, not on the subscription — two
 * different `status` columns that mean unrelated things, which is exactly the
 * kind of collision worth naming rather than leaving for the next reader to
 * discover at the wrong moment.
 *
 * A departed member (`household_members.status <> 'active'`) stops entitling
 * the household they left, and keeps entitling themselves. That is the honest
 * reading in both directions: a family should not lose access because somebody
 * moved out, but nor should a household keep benefiting from a subscription
 * belonging to somebody who is no longer part of it.
 */
export async function getHouseholdSubscriptions(
  householdId: number,
  excludeUserId: number,
): Promise<SubscriptionSnapshot[]> {
  const members = await db
    .select({ userId: householdMembers.userId })
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.householdId, householdId),
        eq(householdMembers.status, "active"),
        ne(householdMembers.userId, excludeUserId),
      ),
    );

  const memberIds = members.map(m => m.userId);
  if (memberIds.length === 0) return [];

  const rows = await db
    .select()
    .from(subscriptions)
    .where(inArray(subscriptions.userId, memberIds));

  return rows.map(toSnapshot);
}

/**
 * The outcome of ingesting one billing event.
 *
 * `duplicate` is a SUCCESS, not an error. A provider redelivering a webhook is
 * behaving correctly, and the caller must answer 2xx so it stops retrying.
 */
export type IngestOutcome =
  | { result: "applied"; subscriptionId: number; snapshot: SubscriptionSnapshot }
  | { result: "duplicate"; providerEventId: string }
  | { result: "unmatched"; providerEventId: string };

/**
 * Record a billing event and fold it into the subscription. IDEMPOTENT.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IDEMPOTENCY IS THE DATABASE'S JOB, AND THIS FUNCTION LEANS ON IT DELIBERATELY.
 *
 * The insert is `ON CONFLICT (provider_event_id) DO NOTHING` and the return
 * value tells us whether a row was actually created. If it was not, the event
 * has been seen and we stop — before applying anything.
 *
 * The alternative shape — SELECT to check, then INSERT — has a race between the
 * check and the insert that two concurrent deliveries of the same webhook will
 * eventually find. Providers deliver concurrently. The cost of losing that race
 * is a duplicated `renewed` extending a household's term for free, or a
 * duplicated `ended` cutting off a household who is paying. Neither is
 * acceptable, and neither is detectable afterwards from the projection alone.
 *
 * The whole operation runs in ONE TRANSACTION: the event row and the projected
 * subscription commit together or not at all. A committed event with an
 * unapplied projection would be invisible — the retry would be rejected as a
 * duplicate and the state change lost permanently.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function ingestBillingEvent(
  event: BillingEvent,
  target: { userId: number; householdId: number | null },
): Promise<IngestOutcome> {
  return db.transaction(async tx => {
    const inserted = await tx
      .insert(billingEvents)
      .values({
        providerEventId: event.providerEventId,
        kind: event.kind,
        subscriptionId: null,
        occurredAt: event.occurredAt,
        processedAt: null,
        payload: {
          planId: event.planId ?? null,
          billingPeriod: event.billingPeriod ?? null,
          trialEndsAt: event.trialEndsAt?.toISOString() ?? null,
          currentPeriodEnd: event.currentPeriodEnd?.toISOString() ?? null,
        },
      })
      .onConflictDoNothing({ target: billingEvents.providerEventId })
      .returning({ id: billingEvents.id });

    // No row returned means the unique constraint rejected it: already seen.
    if (inserted.length === 0) {
      return { result: "duplicate", providerEventId: event.providerEventId };
    }
    const eventRowId = inserted[0].id;

    const [existing] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, target.userId))
      .limit(1);

    const before = existing ? toSnapshot(existing) : freeSnapshot();
    const after = applyBillingEvent(before, event);

    let subscriptionId: number;
    if (existing) {
      await tx
        .update(subscriptions)
        .set({ ...snapshotToColumns(after), updatedAt: new Date() })
        .where(eq(subscriptions.id, existing.id));
      subscriptionId = existing.id;
    } else {
      const [created] = await tx
        .insert(subscriptions)
        .values({
          userId: target.userId,
          householdId: target.householdId,
          ...snapshotToColumns(after),
        })
        .returning({ id: subscriptions.id });
      subscriptionId = created.id;
    }

    await tx
      .update(billingEvents)
      .set({ subscriptionId, processedAt: new Date() })
      .where(eq(billingEvents.id, eventRowId));

    return { result: "applied", subscriptionId, snapshot: after };
  });
}

function snapshotToColumns(s: SubscriptionSnapshot) {
  return {
    planId: s.planId,
    status: s.status,
    billingPeriod: s.billingPeriod,
    trialEndsAt: s.trialEndsAt,
    currentPeriodEnd: s.currentPeriodEnd,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    pendingPlanId: s.pendingPlanId,
    pastDueSince: s.pastDueSince,
  };
}

/**
 * Rebuild a subscription's snapshot from its entire event log.
 *
 * The projection is a fold over an append-only log, so replaying it must always
 * produce the stored value. This exists to PROVE that rather than assume it:
 * the verification test ingests a sequence, rebuilds from the log, and asserts
 * the two agree. If they ever diverge, the incremental path has a bug and the
 * log — not the snapshot — is the thing to believe.
 *
 * It is also the repair mechanism. Because the log is the truth, a corrupted
 * snapshot is recoverable; if the snapshot were the only record, it would not
 * be.
 */
export async function rebuildFromEventLog(
  subscriptionId: number,
): Promise<SubscriptionSnapshot | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);
  if (!row) return null;

  const rows = await db
    .select()
    .from(billingEvents)
    .where(eq(billingEvents.subscriptionId, subscriptionId))
    .orderBy(asc(billingEvents.occurredAt), asc(billingEvents.id));

  const events: BillingEvent[] = rows.map(r => {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    return {
      providerEventId: r.providerEventId,
      kind: r.kind as BillingEventKind,
      occurredAt: r.occurredAt,
      planId: (p.planId as PlanId | null) ?? undefined,
      billingPeriod: (p.billingPeriod as BillingPeriod | null) ?? undefined,
      trialEndsAt: p.trialEndsAt ? new Date(p.trialEndsAt as string) : undefined,
      currentPeriodEnd: p.currentPeriodEnd
        ? new Date(p.currentPeriodEnd as string)
        : undefined,
    };
  });

  return projectSubscription(freeSnapshot(), events);
}

/** Attach a subscription to a household, or detach it. */
export async function setSubscriptionHousehold(
  subscriptionId: number,
  householdId: number | null,
): Promise<void> {
  await db
    .update(subscriptions)
    .set({ householdId, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));
}
