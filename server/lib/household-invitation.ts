/**
 * HOUSEHOLD INVITATION — the owning service for SoT Domain 38. (COMM1A)
 * ===========================================================================
 *
 * This module is the ONLY reader and writer of `household_invitations`.
 *
 * WHAT IT OWNS: a link a household sends to an email address, inviting them to
 * THA and optionally to one of its communities.
 *
 * WHAT IT DOES NOT OWN, AND NEVER WRITES:
 *   - `households` / `household_members` (Domain 16) — it never creates a
 *     household. Registration does that, exactly as it did before COMM1A.
 *   - `households.invite_code` — the mechanism by which a PERSON joins a HOME.
 *     A different question with a different answer; COMM1A adds no second way.
 *   - `communities` / `community_members` / `community_invitations` (Domain 37)
 *     — it calls `server/lib/community.ts` and writes none of them itself. When
 *     an invited stranger becomes a household, this module ASKS COMM1 to issue
 *     a proper community invitation. COMM1 remains the single owner of who is
 *     in a community, which is the whole reason COMM1A is a separate domain
 *     rather than a column.
 *   - `referral_attributions` — owned by `server/lib/referral.ts`.
 *
 * ── THE FOUR ATTACKS THIS IS BUILT AGAINST ─────────────────────────────────
 *
 * 1. HOUSEHOLD ENUMERATION. Creating an invitation returns the SAME response
 *    whether or not the email belongs to an existing THA household. A caller
 *    cannot use this surface to discover who is on the platform.
 *
 * 2. TOKEN REPLAY. Acceptance is a conditional UPDATE on `status = 'pending'`,
 *    so two concurrent redemptions cannot both win — the second changes zero
 *    rows and is refused. Single-use is a database outcome, not a check.
 *
 * 3. ACCEPTANCE BY THE WRONG RECIPIENT. A bearer token in an email can be
 *    forwarded. So the token alone is never sufficient: the accepting account's
 *    address must equal the invited address. This is COMM1 § 2.2's rule
 *    ("the accepting household must be the household the invitation names")
 *    carried down to the only identity a stranger has.
 *
 * 4. SELF-REFERRAL. A household cannot invite its own address, and the referral
 *    table refuses `referrer = referred` in Postgres besides.
 */

import { db } from "../db.js";
import { and, eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { householdInvitations, communities } from "@shared/schema";
import type { HouseholdInvitation } from "@shared/schema";
import * as community from "./community.js";

/**
 * The invitation lifetime, in days.
 *
 * DELIBERATELY RE-EXPORTED FROM COMM1 RATHER THAN REDECLARED. "How long does an
 * invitation last" is one fact, and two constants would drift the moment
 * somebody tuned one of them.
 */
export const INVITATION_TTL_DAYS = community.INVITATION_TTL_DAYS;

export type InvitationKind = "tha" | "community";

/** The tables this domain may touch. Asserted by the test suite. */
export const HOUSEHOLD_INVITATION_READABLE_TABLES: readonly string[] = [
  "household_invitations",
  "communities",
];

/**
 * One normalisation, used by every write AND every read.
 *
 * SEC1's lesson is that a read and a write disagreeing about identity is how
 * data leaks. If invitations were stored lower-cased but matched raw, an
 * invitation to `Sam@Example.com` would be unacceptable by its own recipient.
 */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Mask an address for display to whoever holds the token.
 *
 * The recipient needs to know WHICH address to sign up with; nobody needs the
 * whole string. A forwarded link therefore discloses a hint, not a contact.
 */
export function maskEmail(email: string): string {
  const [local, domain] = normaliseEmail(email).split("@");
  if (!domain) return "•••";
  const head = local.slice(0, 1);
  return `${head}${"•".repeat(Math.max(local.length - 1, 1))}@${domain}`;
}

function expiryFromNow(now: Date): Date {
  return new Date(now.getTime() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Live = pending and not past its expiry. Expiry is evaluated on read. */
function isLive(inv: HouseholdInvitation, now: Date): boolean {
  return inv.status === "pending" && inv.expiresAt.getTime() > now.getTime();
}

// ───────────────────────────────────────────────────────────────────────────
// Creating
// ───────────────────────────────────────────────────────────────────────────

export interface CreateInvitationResult {
  ok: true;
  /** For the caller's own list. The TOKEN IS NOT HERE — see the module header. */
  invitation: { id: number; invitedEmail: string; kind: InvitationKind; expiresAt: Date };
  /** Delivered only to the invited address. Never returned over HTTP. */
  token: string;
}

export async function createInvitation(params: {
  invitedByHouseholdId: number;
  inviterEmail: string;
  email: string;
  communityId?: number | null;
  now?: Date;
}): Promise<CreateInvitationResult | { ok: false; reason: string }> {
  const now = params.now ?? new Date();
  const email = normaliseEmail(params.email);

  if (!email || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    return { ok: false, reason: "That doesn't look like an email address." };
  }

  // Attack 4 — a household inviting itself would manufacture a referral.
  if (email === normaliseEmail(params.inviterEmail)) {
    return { ok: false, reason: "That's your own address." };
  }

  const kind: InvitationKind = params.communityId ? "community" : "tha";

  if (kind === "community") {
    // Delegated to COMM1's owner — this module never reads community_members.
    // A community the caller is not in must be indistinguishable from one that
    // does not exist (COMM1 § 2.4), so both fall into the same message.
    const member = await community.getCommunityForMember(params.communityId!, params.invitedByHouseholdId);
    if (!member) {
      return { ok: false, reason: "That neighbourhood is not available." };
    }
  }

  // One live invitation per (inviter, address). Re-inviting is not an error —
  // it refreshes rather than accumulating tokens, so a household that clicks
  // twice does not leave two live grants behind.
  const existing = await db.query.householdInvitations.findFirst({
    where: and(
      eq(householdInvitations.invitedByHouseholdId, params.invitedByHouseholdId),
      eq(householdInvitations.invitedEmail, email),
      eq(householdInvitations.status, "pending"),
    ),
  });
  if (existing && isLive(existing, now)) {
    await db.update(householdInvitations)
      .set({ status: "revoked", respondedAt: now })
      .where(eq(householdInvitations.id, existing.id));
  }

  const token = randomBytes(32).toString("base64url");
  const [invitation] = await db.insert(householdInvitations).values({
    token,
    invitedByHouseholdId: params.invitedByHouseholdId,
    invitedEmail: email,
    kind,
    communityId: params.communityId ?? null,
    status: "pending",
    expiresAt: expiryFromNow(now),
  }).returning();

  return {
    ok: true,
    token,
    invitation: {
      id: invitation.id,
      invitedEmail: email,
      kind,
      expiresAt: invitation.expiresAt,
    },
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Reading
// ───────────────────────────────────────────────────────────────────────────

export interface InvitationPreview {
  kind: InvitationKind;
  /** Masked — enough to know which address to use, not enough to be a contact. */
  invitedEmailMasked: string;
  communityName: string | null;
  expiresAt: Date;
}

/**
 * What the holder of a token may see BEFORE authenticating.
 *
 * Returns null for invalid, expired, revoked, declined and already-accepted
 * alike — one answer, so the surface cannot be used as an oracle. The token is
 * 32 random bytes, so "valid" here is not a discovery.
 */
export async function previewByToken(token: string, now: Date = new Date()): Promise<InvitationPreview | null> {
  if (!token) return null;
  const inv = await db.query.householdInvitations.findFirst({
    where: eq(householdInvitations.token, token),
  });
  if (!inv || !isLive(inv, now)) return null;

  let communityName: string | null = null;
  if (inv.communityId) {
    const c = await db.query.communities.findFirst({ where: eq(communities.id, inv.communityId) });
    communityName = c?.name ?? null;
  }

  return {
    kind: inv.kind as InvitationKind,
    invitedEmailMasked: maskEmail(inv.invitedEmail),
    communityName,
    expiresAt: inv.expiresAt,
  };
}

/** The inviter's own outstanding invitations. Tokens are never included. */
export async function getInvitationsSent(
  invitedByHouseholdId: number,
  now: Date = new Date(),
): Promise<{ id: number; invitedEmail: string; kind: InvitationKind; status: string; expiresAt: Date }[]> {
  const rows = await db.select().from(householdInvitations)
    .where(eq(householdInvitations.invitedByHouseholdId, invitedByHouseholdId));

  return rows.map(r => ({
    id: r.id,
    invitedEmail: r.invitedEmail,
    kind: r.kind as InvitationKind,
    // Expiry is evaluated on READ, never by a scheduler — THA has no scheduler
    // (Commercial Rule C6 records the same constraint for its own lifecycle).
    status: r.status === "pending" && !isLive(r, now) ? "expired" : r.status,
    expiresAt: r.expiresAt,
  }));
}

// ───────────────────────────────────────────────────────────────────────────
// Redeeming
// ───────────────────────────────────────────────────────────────────────────

export interface RedeemedInvitation {
  invitationId: number;
  invitedByHouseholdId: number;
  kind: InvitationKind;
  communityId: number | null;
}

/**
 * Consume a token on behalf of a household whose account address is `email`.
 *
 * This is the single redemption path. Registration and an already-signed-in
 * acceptance both come through here, so the identity check and the single-use
 * guarantee cannot diverge between them.
 *
 * IT DOES NOT JOIN A COMMUNITY. It returns what was redeemed; the caller asks
 * COMM1 to issue the community invitation, which the recipient must then
 * explicitly accept. Membership is never a side effect of clicking a link.
 */
export async function redeemInvitation(params: {
  token: string;
  acceptingHouseholdId: number;
  acceptingEmail: string;
  now?: Date;
}): Promise<{ ok: true; redeemed: RedeemedInvitation } | { ok: false; reason: string }> {
  const now = params.now ?? new Date();

  // One message for every failure below. A distinguishing error here would let
  // a holder of a bad token learn WHY it was bad, which is the enumeration
  // surface all over again.
  const REFUSED = "That invitation is not valid.";

  const inv = await db.query.householdInvitations.findFirst({
    where: eq(householdInvitations.token, params.token),
  });
  if (!inv || !isLive(inv, now)) return { ok: false, reason: REFUSED };

  // Attack 3 — the token was emailed to one address; only that address may
  // spend it. A forwarded link is inert in anyone else's hands.
  if (normaliseEmail(params.acceptingEmail) !== inv.invitedEmail) {
    return {
      ok: false,
      reason: "This invitation was sent to a different email address than the one on your account.",
    };
  }

  // Attack 4 — the inviter's own household cannot redeem its own invitation.
  if (inv.invitedByHouseholdId === params.acceptingHouseholdId) {
    return { ok: false, reason: REFUSED };
  }

  // Attack 2 — the conditional UPDATE is the single-use guarantee. Two
  // concurrent redemptions race here and exactly one updates a row.
  const updated = await db.update(householdInvitations)
    .set({
      status: "accepted",
      respondedAt: now,
      acceptedByHouseholdId: params.acceptingHouseholdId,
      // The address has done its work. Retaining it past acceptance keeps
      // personal data about a third party for no remaining purpose.
      invitedEmail: sql`'redacted@invitation.accepted'`,
    })
    .where(and(
      eq(householdInvitations.id, inv.id),
      eq(householdInvitations.status, "pending"),
    ))
    .returning();

  if (updated.length === 0) return { ok: false, reason: REFUSED };

  return {
    ok: true,
    redeemed: {
      invitationId: inv.id,
      invitedByHouseholdId: inv.invitedByHouseholdId,
      kind: inv.kind as InvitationKind,
      communityId: inv.communityId,
    },
  };
}

/**
 * Ask COMM1 to issue the community invitation a redeemed link promised.
 *
 * Kept as its own step, and deliberately not folded into `redeemInvitation`,
 * because it is the boundary between the two domains: everything above writes
 * Domain 38, and this writes nothing — it calls Domain 37's owner and returns
 * what COMM1 decided.
 *
 * The recipient must still accept in the Orchard. That is the "explicit
 * acceptance" requirement, and it is why this returns a token to be presented
 * rather than a membership.
 */
export async function issueCommunityInvitationFor(
  redeemed: RedeemedInvitation,
  acceptingHouseholdId: number,
): Promise<{ ok: true; communityToken: string } | { ok: false; reason: string }> {
  if (redeemed.kind !== "community" || !redeemed.communityId) {
    return { ok: false, reason: "That invitation does not name a neighbourhood." };
  }
  const result = await community.inviteHousehold(
    redeemed.communityId,
    acceptingHouseholdId,
    redeemed.invitedByHouseholdId,
  );
  if (!result.ok) return { ok: false, reason: result.reason };
  return { ok: true, communityToken: result.invitation.token };
}

// ───────────────────────────────────────────────────────────────────────────
// Withdrawing
// ───────────────────────────────────────────────────────────────────────────

/** Only the household that sent it may revoke it. */
export async function revokeInvitation(
  invitationId: number,
  revokingHouseholdId: number,
  now: Date = new Date(),
): Promise<{ ok: boolean; reason?: string }> {
  const updated = await db.update(householdInvitations)
    .set({ status: "revoked", respondedAt: now, invitedEmail: sql`'redacted@invitation.revoked'` })
    .where(and(
      eq(householdInvitations.id, invitationId),
      eq(householdInvitations.invitedByHouseholdId, revokingHouseholdId),
      eq(householdInvitations.status, "pending"),
    ))
    .returning();

  // "Not yours" and "does not exist" are the same answer — COMM1 § 2.4.
  if (updated.length === 0) return { ok: false, reason: "That invitation is not valid." };
  return { ok: true };
}
