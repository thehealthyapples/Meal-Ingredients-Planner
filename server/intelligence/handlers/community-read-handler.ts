/**
 * Community Read Handler (COMM1)
 * ==============================
 * Makes the `community` capability executable for READ-ONLY intents, by
 * delegating every read to the Community owner through a {@link CommunityReadPort}.
 * It reuses the Port → Handler → Binding pattern proven by the Planner (INT2),
 * Household (INT13) and eleven other owners — the platform gains another live
 * owner without gaining any community logic.
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • READ-ONLY. Only "read" executes. "add"/"delete" (create a community, invite,
 *     accept, leave) and "explain" (there is no stored rationale on a membership
 *     row) fall through `readOnlyVerbGuard` and return an honest gap. There is NO
 *     code path here that joins a household to a community.
 *   • DELEGATION ONLY. All data comes from the owner via the port. This file
 *     contains no membership rule of its own.
 *   • PERMISSION-AWARE / OWN HOUSEHOLD ONLY. Every read is scoped to the caller's
 *     own household, resolved exclusively from `getHouseholdForUser(userId)` —
 *     never a client-suppliable household id. Cross-household access has no code
 *     path because no method accepts another household's id.
 *   • THE PRIVACY BOUNDARY. Membership is not a read grant. The "members" scope
 *     returns household IDS AND ROLES ONLY. No name, no eater, no restriction, no
 *     plan, no list belonging to another household is reachable from here — not
 *     because it is filtered out, but because the port exposes no method that
 *     returns it.
 *   • NO TOKENS. Invitation bearer tokens are excluded from this projection, the
 *     same decision INT13 made for `households.inviteCode`: an AI-facing surface
 *     is a broader-blast-radius consumer of a join secret.
 *   • HONEST GAPS. A household in no communities gets an empty list, which is a
 *     true answer. A community the caller is not in returns the SAME refusal as
 *     one that does not exist, so the binding cannot be used to probe.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { CommunityReadPort } from "./community-read-port.js";
import { requireUserId, gap, readOnlyVerbGuard } from "./_read-kit.js";

// ---------------------------------------------------------------------------
// Result shapes (read projections — owned data, surfaced honestly)
// ---------------------------------------------------------------------------

/** A community as the read binding surfaces it. */
export interface CommunityView {
  readonly id: number;
  readonly name: string;
  readonly kind: string;
}

/** The caller's communities. */
export interface CommunitiesView {
  readonly scope: "communities";
  readonly communities: readonly CommunityView[];
}

/**
 * The member households of one community — PRESENCE AND RANK ONLY.
 *
 * `householdId` is an opaque identifier here. It is included because a household
 * legitimately needs to know how many households share its neighbourhood and who
 * administers it; it carries no personal data on its own, and nothing in this
 * binding can turn one into a name, an eater or a restriction.
 */
export interface CommunityMembersView {
  readonly scope: "members";
  readonly communityId: number;
  readonly memberCount: number;
  readonly members: readonly { readonly householdId: number; readonly role: string }[];
}

/** Pending invitations addressed to the caller's household. Never includes tokens. */
export interface CommunityInvitationsView {
  readonly scope: "invitations";
  readonly invitations: readonly { readonly id: number; readonly communityId: number; readonly expiresAt: string }[];
}

type ReadScope = "communities" | "members" | "invitations";

const SCOPES: readonly ReadScope[] = ["communities", "members", "invitations"];

function toCommunityView(c: { id: number; name: string; kind: string }): CommunityView {
  return { id: c.id, name: c.name, kind: c.kind };
}

async function handleRead(
  intent: Intent,
  userId: number,
  port: CommunityReadPort,
): Promise<unknown> {
  const scope = (intent.parameters?.scope as string | undefined) ?? "communities";
  if (!SCOPES.includes(scope as ReadScope)) {
    throw gap(`Community has no "${scope}" scope. Available scopes: ${SCOPES.join(", ")}.`);
  }

  // THE OWNERSHIP WALK. The household is resolved from the session, never taken
  // from the intent — there is no parameter a caller could set to reach another.
  const householdId = await port.getHouseholdForUser(userId);

  switch (scope as ReadScope) {
    case "communities": {
      const communities = await port.getCommunitiesForHousehold(householdId);
      return { scope: "communities", communities: communities.map(toCommunityView) } satisfies CommunitiesView;
    }
    case "members": {
      const communityId = Number(intent.parameters?.communityId);
      if (!Number.isInteger(communityId)) {
        throw gap(
          `Reading a community's members needs a communityId. Ask about a community this household belongs to.`,
        );
      }
      // Membership is re-checked by the owner. A community the caller is not in
      // returns the same refusal as one that does not exist.
      const community = await port.getCommunityForMember(communityId, householdId);
      if (!community) {
        throw gap(
          `This household is not a member of that community, or it does not exist. ` +
            `THA will not confirm which.`,
        );
      }
      const members = await port.getMemberHouseholds(communityId, householdId);
      return {
        scope: "members",
        communityId,
        memberCount: members.length,
        members: members.map(m => ({ householdId: m.householdId, role: m.role })),
      } satisfies CommunityMembersView;
    }
    case "invitations": {
      const invitations = await port.getPendingInvitations(householdId);
      return {
        scope: "invitations",
        invitations: invitations.map(i => ({
          id: i.id,
          communityId: i.communityId,
          expiresAt: i.expiresAt.toISOString(),
        })),
      } satisfies CommunityInvitationsView;
    }
  }
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the community read-only handler. `resolvePort` provides the
 * owning-service surface (production: the real Community service; tests: an
 * in-memory owner).
 */
export function createCommunityReadHandler(
  resolvePort: () => Promise<CommunityReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding: only "read" executes. Every membership lifecycle verb
    // remains owned by the Community service and reachable only through the
    // authenticated HTTP surface.
    readOnlyVerbGuard(intent, ["read"], "Community");

    const userId = requireUserId(context, "Community");
    const port = await resolvePort();

    return handleRead(intent, userId, port);
  };
}
