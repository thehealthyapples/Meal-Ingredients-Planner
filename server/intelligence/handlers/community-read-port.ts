/**
 * Community Read Port (COMM1)
 * ===========================
 * The NARROW, read-only delegation surface the Community capability handler is
 * allowed to call. Every method is a 1:1 forward to an EXISTING owning-service
 * method on `server/lib/community.ts` (SoT D37) plus the household session
 * resolver on `server/lib/household.ts` (SoT D16). This port adds NO community
 * business logic; it is a typed seam so that:
 *   • the handler delegates (never re-implements) community reads, and
 *   • tests can inject an in-memory owner to prove delegation without a database.
 *
 * NO WRITE METHOD EXISTS BY CONSTRUCTION. Creating a community, inviting a
 * household, accepting, declining, revoking and leaving are all membership
 * lifecycle events owned by the Community service and reached only through the
 * authenticated HTTP surface. The Companion can tell a household which
 * communities it is in; it cannot join one on their behalf.
 *
 * THE PRIVACY BOUNDARY IS IN THE TYPES. `getMemberHouseholds` returns household
 * IDS AND ROLES — no names, no eaters, no restrictions, no plans. There is
 * deliberately no method here that returns another household's content, because
 * a port method is the only way the handler could reach one.
 */

import type { Community } from "@shared/schema";

/** A member household as the Community owner surfaces it: presence and rank only. */
export interface CommunityMemberHouseholdRow {
  readonly householdId: number;
  readonly role: string;
  readonly joinedAt: Date;
}

/** A pending invitation as the owner surfaces it. The token is NEVER included. */
export interface CommunityInvitationRow {
  readonly id: number;
  readonly communityId: number;
  readonly expiresAt: Date;
}

export interface CommunityReadPort {
  /** Household-membership owner — resolves the caller's active household (authorization). */
  getHouseholdForUser(userId: number): Promise<number>;
  /** Community owner — every community this household actively belongs to. */
  getCommunitiesForHousehold(householdId: number): Promise<Community[]>;
  /** Community owner — one community, or null if this household is not a member. */
  getCommunityForMember(communityId: number, householdId: number): Promise<Community | null>;
  /** Community owner — member households of a community: ids and roles ONLY. */
  getMemberHouseholds(communityId: number, requestingHouseholdId: number): Promise<CommunityMemberHouseholdRow[]>;
  /** Community owner — pending, unexpired invitations addressed to this household. */
  getPendingInvitations(householdId: number): Promise<CommunityInvitationRow[]>;
}

/**
 * Build the production port over the real owning services. Imports are DYNAMIC so
 * that loading the Intelligence Platform module (and its tests) never opens a
 * database connection at import time — the owner is only touched on first invocation.
 */
export async function createStorageCommunityReadPort(): Promise<CommunityReadPort> {
  const { getHouseholdForUser } = await import("../../lib/household.js");
  const community = await import("../../lib/community.js");
  return {
    getHouseholdForUser: (userId) => getHouseholdForUser(userId),
    getCommunitiesForHousehold: (householdId) => community.getCommunitiesForHousehold(householdId),
    getCommunityForMember: (communityId, householdId) => community.getCommunityForMember(communityId, householdId),
    getMemberHouseholds: (communityId, requestingHouseholdId) =>
      community.getMemberHouseholds(communityId, requestingHouseholdId),
    // Projected deliberately: the owner returns full invitation rows including the
    // bearer token, and the token must never reach an AI-facing surface.
    getPendingInvitations: async (householdId) => {
      const rows = await community.getPendingInvitations(householdId);
      return rows.map(r => ({ id: r.id, communityId: r.communityId, expiresAt: r.expiresAt }));
    },
  };
}
