/**
 * REFERRAL ATTRIBUTION — the owning service for `referral_attributions`. (COMM1A)
 * ===========================================================================
 *
 * This module is the ONLY reader and writer of `referral_attributions`.
 *
 * ── WHAT THIS OWNS, STATED AS NARROWLY AS IT IS TRUE ───────────────────────
 *
 * It owns ONE FACT: **which household referred which other household, and how
 * far that referral has progressed toward being rewardable.**
 *
 * It owns no amount, no percentage, no currency, no term, no discount code, no
 * coupon and no entitlement. It cannot grant anything. Those belong to the
 * Commercial domain (`shared/commerce/`, `server/commerce/`), and COMM1A is
 * bound by three of its rules in particular:
 *
 *   C2 — THA owns the entitlement projection, and no other service may decide
 *        access. So this module records readiness and never applies a reward.
 *   C3 — no commercial claim without configured pricing, which fails closed
 *        platform-wide today. So NOTHING here may be shown to a household as a
 *        discount, a saving or a percentage. `isPublishable()` is false, and a
 *        "20% off" rendered next to a price that does not exist is exactly the
 *        defect BUS2A withdrew `TrialBanner.tsx`'s copy for.
 *   C9 — leaving is never made hard, and no flow may dangle a discount.
 *
 * ── THE INTENDED REWARD, AND WHY IT IS NOT HERE ────────────────────────────
 *
 * The commercial intent is 20% off for BOTH households for three months once
 * the referred household becomes eligible. **None of that is implementable
 * today, and COMM1A does not pretend otherwise.** The platform has:
 *
 *   - no configured pricing (`isPublishable()` returns false everywhere),
 *   - no payment provider (`NoBillingProvider` is the permanent implementation),
 *   - no path that writes a `subscriptions` row — so no household can become a
 *     paying subscriber at all,
 *   - and NO NOTION OF "ELIGIBLE" anywhere in the commercial layer.
 *
 * So `markEligible` exists, is tested, and is **unreachable from any route,
 * capability or UI in this workstream.** It is the seam a future commercial
 * implementation calls; it is not a feature COMM1A ships. Reporting that
 * honestly is the requirement, and inventing an eligibility rule here would
 * have created a second owner of "who deserves money off" — the precise thing
 * the architecture forbids.
 */

import { db } from "../db.js";
import { and, eq } from "drizzle-orm";
import { referralAttributions } from "@shared/schema";
import type { ReferralAttribution } from "@shared/schema";

export type ReferralStatus =
  | "recorded"
  | "verified"
  | "eligible"
  | "entitlement_processed"
  | "void";

/** The tables this domain may touch. Asserted by the test suite. */
export const REFERRAL_READABLE_TABLES: readonly string[] = ["referral_attributions"];

/**
 * Record that `referredHouseholdId` arrived through `referrerHouseholdId`'s
 * invitation.
 *
 * ONLY EVER CALLED FOR A HOUSEHOLD THAT DID NOT EXIST BEFORE THE INVITATION.
 * A household that already had a THA account and merely accepts a neighbourhood
 * invitation is NOT a referral — it was not referred, it was already here, and
 * recording one would be a fabricated attribution that a future reward would
 * pay out on. That rule lives at the call site in `server/auth.ts` (the
 * registration path) and is asserted by the test suite.
 *
 * Idempotent by database constraint: `referred_household_id` is UNIQUE, so a
 * second attempt for the same household loses rather than duplicating. A
 * household is referred once, ever.
 */
export async function recordReferral(params: {
  referrerHouseholdId: number;
  referredHouseholdId: number;
  invitationId: number | null;
  now?: Date;
}): Promise<{ ok: true; attribution: ReferralAttribution } | { ok: false; reason: string }> {
  if (params.referrerHouseholdId === params.referredHouseholdId) {
    return { ok: false, reason: "A household cannot refer itself." };
  }

  const [attribution] = await db.insert(referralAttributions).values({
    referrerHouseholdId: params.referrerHouseholdId,
    referredHouseholdId: params.referredHouseholdId,
    invitationId: params.invitationId,
    status: "recorded",
    recordedAt: params.now ?? new Date(),
  })
    // The UNIQUE index is the guard. Doing nothing on conflict means a
    // re-registration cannot re-attribute an existing household to a new
    // referrer — the first attribution stands, permanently.
    .onConflictDoNothing({ target: referralAttributions.referredHouseholdId })
    .returning();

  if (!attribution) {
    return { ok: false, reason: "That household has already been referred." };
  }
  return { ok: true, attribution };
}

/**
 * Promote `recorded` → `verified` once the referred household's account has
 * verified its email address.
 *
 * This is what makes the attribution a *verified* one rather than a claimed
 * one. An unverified account is an address nobody has proven they control, and
 * paying a reward on one is how referral fraud works.
 *
 * Conditional on the current status, so it cannot walk a row backwards from
 * `eligible` or resurrect a `void` one.
 */
export async function markVerified(
  referredHouseholdId: number,
  now: Date = new Date(),
): Promise<{ ok: boolean }> {
  const updated = await db.update(referralAttributions)
    .set({ status: "verified", verifiedAt: now })
    .where(and(
      eq(referralAttributions.referredHouseholdId, referredHouseholdId),
      eq(referralAttributions.status, "recorded"),
    ))
    .returning();
  return { ok: updated.length > 0 };
}

/**
 * Promote `verified` → `eligible`.
 *
 * ⚠️ NOTHING IN COMM1A CALLS THIS, AND NOTHING IN COMM1A MAY. It is the seam
 * the Commercial domain calls when a referred household genuinely becomes a
 * paying subscriber — a state the platform cannot currently reach, because no
 * code path writes a `subscriptions` row (BUS2A § "deliberately NOT built").
 *
 * It refuses to promote anything that is not already `verified`, so eligibility
 * can never skip verification even if a future caller gets it wrong. The same
 * ladder is enforced by a CHECK constraint in Postgres.
 */
export async function markEligible(
  referredHouseholdId: number,
  now: Date = new Date(),
): Promise<{ ok: boolean }> {
  const updated = await db.update(referralAttributions)
    .set({ status: "eligible", eligibleAt: now })
    .where(and(
      eq(referralAttributions.referredHouseholdId, referredHouseholdId),
      eq(referralAttributions.status, "verified"),
    ))
    .returning();
  return { ok: updated.length > 0 };
}

/**
 * Promote `eligible` → `entitlement_processed`.
 *
 * ⚠️ ALSO NOT CALLED BY COMM1A. The commercial owner calls this AFTER it has
 * applied whatever reward it decided on, to record that it did. COMM1A neither
 * knows nor stores what that reward was.
 */
export async function markEntitlementProcessed(
  referredHouseholdId: number,
  now: Date = new Date(),
): Promise<{ ok: boolean }> {
  const updated = await db.update(referralAttributions)
    .set({ status: "entitlement_processed", entitlementProcessedAt: now })
    .where(and(
      eq(referralAttributions.referredHouseholdId, referredHouseholdId),
      eq(referralAttributions.status, "eligible"),
    ))
    .returning();
  return { ok: updated.length > 0 };
}

/**
 * The referrals a household has made.
 *
 * Returns COUNTS AND STATUSES ONLY — never the referred household's id, name,
 * or address. A household learns that its invitations landed; it does not
 * thereby gain a directory of the homes that accepted them, which would be the
 * cross-household disclosure COMM1 § 2.3 exists to prevent, arriving by a new
 * door.
 */
export interface ReferralSummary {
  recorded: number;
  verified: number;
  eligible: number;
  entitlementProcessed: number;
}

export async function getReferralSummary(referrerHouseholdId: number): Promise<ReferralSummary> {
  const rows = await db.select().from(referralAttributions)
    .where(eq(referralAttributions.referrerHouseholdId, referrerHouseholdId));

  const summary: ReferralSummary = { recorded: 0, verified: 0, eligible: 0, entitlementProcessed: 0 };
  for (const r of rows) {
    if (r.status === "recorded") summary.recorded++;
    else if (r.status === "verified") summary.verified++;
    else if (r.status === "eligible") summary.eligible++;
    else if (r.status === "entitlement_processed") summary.entitlementProcessed++;
  }
  return summary;
}

/**
 * Whether this household was itself referred, and by nobody in particular.
 *
 * Deliberately returns a BOOLEAN, not the referrer. The referred household has
 * no need to learn which household introduced them beyond what the inviter
 * already told them out of band, and returning the id would hand out a
 * household identifier — the thing this workstream is required never to expose.
 */
export async function wasReferred(referredHouseholdId: number): Promise<boolean> {
  const row = await db.query.referralAttributions.findFirst({
    where: eq(referralAttributions.referredHouseholdId, referredHouseholdId),
  });
  return !!row;
}
