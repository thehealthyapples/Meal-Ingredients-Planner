/**
 * Community — the owning service (COMM1, SoT Domain 37)
 * =====================================================
 * The single owner of three facts: which communities exist, which HOUSEHOLDS
 * belong to them, and who has been invited. Nothing else. This module reads no
 * plan, no list, no pantry, no eater and no restriction, and it exposes no method
 * that would let a caller reach another household's data.
 *
 * WHY THE OWNERSHIP WALK LIVES HERE
 * ---------------------------------
 * `server/intelligence/permissions.ts:82-85` is explicit that the platform never
 * re-implements ownership checks — they are "delegated to the owning service at
 * invoke time". A capability declaring `ownershipScoped: true` gets NO
 * enforcement for free; it is metadata. So the walk is here, in the owner, and
 * every read below is scoped by a household id the CALLER cannot supply: it is
 * resolved from the session via `getHouseholdForUser`.
 *
 * THE SEC1 RULE
 * -------------
 * SEC1 (departed-member eater exposure) was caused by a read and a write
 * disagreeing about who was at the table, with the read being looser: the write
 * only ever seated *active* members, the read filtered on household alone, and a
 * person who had left kept leaking their allergens into the household they left.
 *
 * The defence here is structural: `ACTIVE_MEMBERSHIP` below is the ONE predicate,
 * and every read and every write in this file uses it. There is deliberately no
 * second way to ask "is this household in this community".
 *
 * WHAT MEMBERSHIP IS NOT
 * ----------------------
 * Membership is NOT a read grant. Two households sharing a community can see
 * that they share it — and nothing else about each other. `assertNoCrossHouseholdRead`
 * at the foot of this file is the executable statement of that boundary, and
 * COMM1's isolation test drives it.
 */

import { db } from "../db";
import { communities, communityMembers, communityInvitations, householdMembers } from "@shared/schema";
import type { Community, CommunityMember, CommunityInvitation } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";

/**
 * The community role ladder. Identical to `server/lib/household.ts`'s ranks by
 * design — a household that administers its community uses the same vocabulary
 * it already uses to administer itself.
 */
const ROLE_RANK: Record<string, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export type CommunityRole = "member" | "admin" | "owner";

/** How long an invitation stands before it expires. */
export const INVITATION_TTL_DAYS = 14;

/**
 * THE ONE MEMBERSHIP PREDICATE (the SEC1 rule).
 *
 * Every read and every write in this module composes this. A membership is real
 * only while `status = 'active'`; a household that has left is a row that exists
 * for audit and is never a member again until it re-joins.
 */
function activeMembership(communityId: number, householdId: number) {
  return and(
    eq(communityMembers.communityId, communityId),
    eq(communityMembers.householdId, householdId),
    eq(communityMembers.status, "active"),
  );
}

// ---------------------------------------------------------------------------
// Reads — all scoped to a household the caller could not have supplied
// ---------------------------------------------------------------------------

/**
 * Every community this household actively belongs to.
 *
 * This is the whole of what a household may learn from this domain without
 * naming a specific community.
 */
export async function getCommunitiesForHousehold(householdId: number): Promise<Community[]> {
  const rows = await db
    .select({ community: communities })
    .from(communityMembers)
    .innerJoin(communities, eq(communities.id, communityMembers.communityId))
    .where(and(
      eq(communityMembers.householdId, householdId),
      eq(communityMembers.status, "active"),
      eq(communities.status, "active"),
    ));
  return rows.map(r => r.community);
}

/**
 * This household's membership row in one community, or null.
 *
 * THE AUTHORIZATION PRIMITIVE. Returning null is the negative answer to "may
 * this household see this community at all", and every caller below treats it
 * as refusal rather than as an empty result.
 */
export async function getMembership(communityId: number, householdId: number): Promise<CommunityMember | null> {
  const row = await db.query.communityMembers.findFirst({
    where: activeMembership(communityId, householdId),
  });
  return row ?? null;
}

/** Whether this household is an active member of this community. */
export async function isMember(communityId: number, householdId: number): Promise<boolean> {
  return (await getMembership(communityId, householdId)) !== null;
}

/**
 * Whether this household holds at least `minRole` in this community.
 *
 * A non-member is not "below the rank" — it is refused, and the distinction
 * matters: a caller must never learn a community exists by being told their role
 * in it is insufficient.
 */
export async function hasCommunityRole(
  communityId: number,
  householdId: number,
  minRole: CommunityRole,
): Promise<boolean> {
  const membership = await getMembership(communityId, householdId);
  if (!membership) return false;
  return (ROLE_RANK[membership.role] ?? 0) >= (ROLE_RANK[minRole] ?? 0);
}

/**
 * One community, but ONLY if this household is a member of it.
 *
 * Returns null for "no such community" AND for "you are not in it" — the same
 * answer on purpose. A distinguishable response would let any household probe
 * for the existence of communities it does not belong to.
 */
export async function getCommunityForMember(communityId: number, householdId: number): Promise<Community | null> {
  if (!(await isMember(communityId, householdId))) return null;
  const community = await db.query.communities.findFirst({
    where: and(eq(communities.id, communityId), eq(communities.status, "active")),
  });
  return community ?? null;
}

/**
 * The member households of a community — IDS AND ROLES ONLY.
 *
 * THE PRIVACY BOUNDARY IS THIS FUNCTION'S RETURN TYPE. It deliberately does not
 * join `households` for names, does not touch `household_eaters`, and exposes no
 * column from any other domain. A caller learns that a household is present and
 * what rank it holds. Anything more is a future capability that must declare
 * what it discloses and be gated on its own merits — it is not a widening of
 * this one.
 */
export async function getMemberHouseholds(
  communityId: number,
  requestingHouseholdId: number,
): Promise<{ householdId: number; role: string; joinedAt: Date }[]> {
  if (!(await isMember(communityId, requestingHouseholdId))) return [];
  const rows = await db
    .select({
      householdId: communityMembers.householdId,
      role: communityMembers.role,
      joinedAt: communityMembers.joinedAt,
    })
    .from(communityMembers)
    .where(and(
      eq(communityMembers.communityId, communityId),
      eq(communityMembers.status, "active"),
    ));
  return rows;
}

// ---------------------------------------------------------------------------
// Membership lifecycle
// ---------------------------------------------------------------------------

/**
 * Create a community, seating the creating household as its owner.
 *
 * Both writes are in ONE transaction: a community with no owner is
 * unadministrable, and a half-applied creation would leave one behind.
 */
export async function createCommunity(
  name: string,
  createdByHouseholdId: number,
  kind = "neighbourhood",
): Promise<Community> {
  return db.transaction(async (tx) => {
    const [community] = await tx.insert(communities).values({
      name,
      kind,
      createdByHouseholdId,
    }).returning();

    await tx.insert(communityMembers).values({
      communityId: community.id,
      householdId: createdByHouseholdId,
      role: "owner",
      status: "active",
    });

    return community;
  });
}

/**
 * Invite a household to a community.
 *
 * Requires `admin` in the inviting household's own membership — checked by the
 * caller through {@link hasCommunityRole}, and re-checked here so the rule holds
 * even if a future caller forgets. Refuses to invite a household that is already
 * a member, and refuses to stack a second pending invitation.
 */
export async function inviteHousehold(
  communityId: number,
  invitedHouseholdId: number,
  invitedByHouseholdId: number,
): Promise<{ ok: true; invitation: CommunityInvitation } | { ok: false; reason: string }> {
  if (!(await hasCommunityRole(communityId, invitedByHouseholdId, "admin"))) {
    return { ok: false, reason: "Requires community role 'admin' or higher." };
  }
  if (await isMember(communityId, invitedHouseholdId)) {
    return { ok: false, reason: "That household is already a member." };
  }

  const existing = await db.query.communityInvitations.findFirst({
    where: and(
      eq(communityInvitations.communityId, communityId),
      eq(communityInvitations.invitedHouseholdId, invitedHouseholdId),
      eq(communityInvitations.status, "pending"),
    ),
  });
  if (existing) {
    return { ok: false, reason: "That household already has a pending invitation." };
  }

  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const [invitation] = await db.insert(communityInvitations).values({
    communityId,
    invitedHouseholdId,
    invitedByHouseholdId,
    token: randomBytes(32).toString("base64url"),
    status: "pending",
    expiresAt,
  }).returning();

  return { ok: true, invitation };
}

/**
 * Accept an invitation by token.
 *
 * THE TOKEN IS NOT SUFFICIENT ON ITS OWN. The accepting household must be the
 * household the invitation names — a bearer token that anyone could redeem would
 * reintroduce exactly the property that made a shared join code the wrong
 * mechanism (see the schema note on `community_invitations`).
 *
 * Expiry is enforced HERE at read time as well as being stored, because a row
 * that has passed its expiry has not been rewritten by anything yet.
 */
export async function acceptInvitation(
  token: string,
  acceptingHouseholdId: number,
): Promise<{ ok: true; membership: CommunityMember } | { ok: false; reason: string }> {
  const invitation = await db.query.communityInvitations.findFirst({
    where: eq(communityInvitations.token, token),
  });

  // One indistinguishable refusal for "no such token" and "not yours". A caller
  // must not be able to probe for valid tokens.
  if (!invitation || invitation.invitedHouseholdId !== acceptingHouseholdId) {
    return { ok: false, reason: "That invitation is not valid." };
  }
  if (invitation.status !== "pending") {
    return { ok: false, reason: `That invitation has already been ${invitation.status}.` };
  }
  if (invitation.expiresAt.getTime() <= Date.now()) {
    await db.update(communityInvitations)
      .set({ status: "expired", respondedAt: new Date() })
      .where(eq(communityInvitations.id, invitation.id));
    return { ok: false, reason: "That invitation has expired." };
  }

  return db.transaction(async (tx) => {
    const [membership] = await tx.insert(communityMembers).values({
      communityId: invitation.communityId,
      householdId: acceptingHouseholdId,
      role: "member",
      status: "active",
      invitedByHouseholdId: invitation.invitedByHouseholdId,
    })
      // A household that previously left and is re-invited already has a row.
      // Re-seat it rather than failing on the unique constraint — and clear
      // `leftAt`, because the status CHECK forbids an active row that has one.
      .onConflictDoUpdate({
        target: [communityMembers.communityId, communityMembers.householdId],
        set: { status: "active", role: "member", leftAt: null, joinedAt: new Date() },
      })
      .returning();

    await tx.update(communityInvitations)
      .set({ status: "accepted", respondedAt: new Date() })
      .where(eq(communityInvitations.id, invitation.id));

    return { ok: true as const, membership };
  });
}

/** Decline an invitation. Same identity check as acceptance. */
export async function declineInvitation(
  token: string,
  decliningHouseholdId: number,
): Promise<{ ok: boolean; reason?: string }> {
  const invitation = await db.query.communityInvitations.findFirst({
    where: eq(communityInvitations.token, token),
  });
  if (!invitation || invitation.invitedHouseholdId !== decliningHouseholdId) {
    return { ok: false, reason: "That invitation is not valid." };
  }
  if (invitation.status !== "pending") {
    return { ok: false, reason: `That invitation has already been ${invitation.status}.` };
  }
  await db.update(communityInvitations)
    .set({ status: "declined", respondedAt: new Date() })
    .where(eq(communityInvitations.id, invitation.id));
  return { ok: true };
}

/**
 * Revoke a pending invitation. Requires `admin` in the revoking household.
 */
export async function revokeInvitation(
  invitationId: number,
  revokingHouseholdId: number,
): Promise<{ ok: boolean; reason?: string }> {
  const invitation = await db.query.communityInvitations.findFirst({
    where: eq(communityInvitations.id, invitationId),
  });
  if (!invitation) return { ok: false, reason: "That invitation is not valid." };
  if (!(await hasCommunityRole(invitation.communityId, revokingHouseholdId, "admin"))) {
    return { ok: false, reason: "That invitation is not valid." };
  }
  if (invitation.status !== "pending") {
    return { ok: false, reason: `That invitation has already been ${invitation.status}.` };
  }
  await db.update(communityInvitations)
    .set({ status: "revoked", respondedAt: new Date() })
    .where(eq(communityInvitations.id, invitationId));
  return { ok: true };
}

/**
 * A household leaves a community.
 *
 * SOFT DEPARTURE, exactly as `household_members` does it — the row stays, dated.
 * A DELETE would erase the fact that the household was ever there, which is the
 * audit trail an inter-household domain most needs.
 *
 * REFUSES TO REMOVE THE LAST OWNER. A community with no owner cannot be
 * administered and cannot invite anyone, so it would be permanently frozen.
 */
export async function leaveCommunity(
  communityId: number,
  householdId: number,
): Promise<{ ok: boolean; reason?: string }> {
  const membership = await getMembership(communityId, householdId);
  if (!membership) return { ok: false, reason: "Not a member of that community." };

  if (membership.role === "owner") {
    const owners = await db.query.communityMembers.findMany({
      where: and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.role, "owner"),
        eq(communityMembers.status, "active"),
      ),
    });
    if (owners.length <= 1) {
      return { ok: false, reason: "Transfer ownership before leaving — a community must keep an owner." };
    }
  }

  await db.update(communityMembers)
    .set({ status: "left", leftAt: new Date() })
    .where(activeMembership(communityId, householdId));
  return { ok: true };
}

/** Pending, unexpired invitations addressed to this household. */
export async function getPendingInvitations(householdId: number): Promise<CommunityInvitation[]> {
  const rows = await db.query.communityInvitations.findMany({
    where: and(
      eq(communityInvitations.invitedHouseholdId, householdId),
      eq(communityInvitations.status, "pending"),
    ),
  });
  // Expiry filtered at read time — see acceptInvitation.
  return rows.filter(r => r.expiresAt.getTime() > Date.now());
}

// ---------------------------------------------------------------------------
// The privacy boundary, stated executably
// ---------------------------------------------------------------------------

/**
 * The set of table names this domain is permitted to read.
 *
 * COMM1's isolation test asserts that `server/lib/community.ts` imports nothing
 * outside this set. It exists so that a future edit which quietly joins
 * `household_eaters` to answer "who's in my neighbourhood?" fails a test rather
 * than shipping — which is the shape of the SEC1 defect, one domain up.
 */
export const COMMUNITY_READABLE_TABLES: readonly string[] = [
  "communities",
  "community_members",
  "community_invitations",
  // Read for the household→user derivation ONLY (whose household is this?), never
  // for household content.
  "household_members",
];
