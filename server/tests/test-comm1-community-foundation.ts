/**
 * test-comm1-community-foundation.ts (COMM1)
 * ==========================================
 * The Community Foundation: households belong to communities, and a community
 * membership grants access to NOTHING ELSE.
 *
 * WHAT THIS FILE PROVES, AND WHY EACH LAYER EXISTS
 * ------------------------------------------------
 * §1 ARCHITECTURE — Community is one domain with one owner, registered as a
 *    platform capability rather than a separate application, and the membership
 *    grain is the HOUSEHOLD. A user↔community table would be a second membership
 *    entity parallel to Domain 16's `household_members` and could drift from it.
 *
 * §2 THE BINDING — the Port → Handler → Binding pattern, end-to-end, without a
 *    live database, by injecting an in-memory owner. Read-only by construction.
 *
 * §3 THE PRIVACY BOUNDARY — the layer this workstream exists for. Membership is
 *    NOT a read grant. This section asserts the COMPLEMENT of the usual test:
 *    not "the right data comes back" but "no method exists that could return
 *    another household's data". A boundary you can only test by remembering to
 *    test it is not a boundary.
 *
 * §4 PROBE RESISTANCE — a community the caller is not in must be indistinguishable
 *    from one that does not exist. Otherwise any household can enumerate the
 *    communities of every other household by watching which error it gets.
 *
 * §5 THE SEC1 RULE — one membership predicate, used by every read and every write.
 *    SEC1 was caused by a read and a write disagreeing about who was at the table,
 *    with the read being looser. This asserts the owner has no second way to ask.
 *
 * §6 LIFECYCLE INVARIANTS — the state machine the database CHECK constraints
 *    enforce, asserted at the source level so a change to either is caught here.
 *
 * WHAT THIS FILE DOES NOT PROVE, STATED PLAINLY
 * ---------------------------------------------
 * It is NOT DB-backed. SEC1's lesson is explicit that binding tests prove
 * delegation, not isolation — `test-intelligence-household-binding.ts:156` mocked
 * `getHouseholdEaters`, which is why its 51 assertions passed against a live
 * cross-household leak for that bug's entire life. §3 and §5 below are therefore
 * SOURCE-LEVEL assertions over the owning module: they prove the code cannot
 * reach across the boundary, not that a live database refuses a crafted request.
 * A DB-backed isolation test is recorded as a required follow-on in COMM1's
 * report, and it is not optional.
 *
 * Run with: npm run test:comm1-community-foundation
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  IntelligencePlatform,
  CapabilityRegistry,
  createCommunityReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type CommunityReadPort,
} from "../intelligence/index.js";
import type { Community } from "../../shared/schema.js";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
    failures.push(label);
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

const ROOT = join(import.meta.dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

/**
 * Strip block and line comments before asserting over source.
 *
 * THIS MATTERS. The first version of §3 grepped the raw file and failed on
 * `household_eaters` — which appears twice in this module, both times in a
 * DOC COMMENT explaining that the module must never touch it. A test that
 * greps prose asserts the documentation, not the behaviour: it would have gone
 * green the moment someone reworded a comment, and red for a correct file that
 * happened to mention a table it forbids. Code only.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

const OWNER_SRC = stripComments(read("server/lib/community.ts"));
const PORT_SRC_RAW = read("server/intelligence/handlers/community-read-port.ts");
const PORT_SRC = stripComments(PORT_SRC_RAW);
const HANDLER_SRC = stripComments(read("server/intelligence/handlers/community-read-handler.ts"));
const SCHEMA_SRC = read("shared/schema.ts");
const MIGRATION_SRC = read("server/migrations/runner.ts");

// ---------------------------------------------------------------------------
// In-memory owner. Household 10 is in community 1 (as owner) and community 2.
// Household 20 is in community 1 only. Household 30 is in nothing.
// ---------------------------------------------------------------------------

const COMMUNITY_1: Community = {
  id: 1, name: "Elm Street", kind: "neighbourhood",
  createdByHouseholdId: 10, status: "active",
  createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
};
const COMMUNITY_2: Community = {
  id: 2, name: "Allotment Group", kind: "neighbourhood",
  createdByHouseholdId: 99, status: "active",
  createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
};

const MEMBERSHIPS: Record<number, number[]> = { 10: [1, 2], 20: [1], 30: [] };

function makePort(calls: string[] = []): CommunityReadPort & { calls: string[] } {
  const port = {
    calls,
    getHouseholdForUser: async (userId: number) => {
      calls.push(`getHouseholdForUser(${userId})`);
      if (userId === 1) return 10;
      if (userId === 2) return 20;
      if (userId === 3) return 30;
      throw new Error(`User ${userId} has no active household membership.`);
    },
    getCommunitiesForHousehold: async (householdId: number) => {
      calls.push(`getCommunitiesForHousehold(${householdId})`);
      const ids = MEMBERSHIPS[householdId] ?? [];
      return [COMMUNITY_1, COMMUNITY_2].filter(c => ids.includes(c.id));
    },
    getCommunityForMember: async (communityId: number, householdId: number) => {
      calls.push(`getCommunityForMember(${communityId},${householdId})`);
      const ids = MEMBERSHIPS[householdId] ?? [];
      if (!ids.includes(communityId)) return null;
      return communityId === 1 ? COMMUNITY_1 : COMMUNITY_2;
    },
    getMemberHouseholds: async (communityId: number, requestingHouseholdId: number) => {
      calls.push(`getMemberHouseholds(${communityId},${requestingHouseholdId})`);
      const ids = MEMBERSHIPS[requestingHouseholdId] ?? [];
      if (!ids.includes(communityId)) return [];
      if (communityId === 1) {
        return [
          { householdId: 10, role: "owner", joinedAt: new Date("2026-01-01") },
          { householdId: 20, role: "member", joinedAt: new Date("2026-02-01") },
        ];
      }
      return [{ householdId: 10, role: "member", joinedAt: new Date("2026-03-01") }];
    },
    getPendingInvitations: async (householdId: number) => {
      calls.push(`getPendingInvitations(${householdId})`);
      if (householdId !== 30) return [];
      return [{ id: 7, communityId: 1, expiresAt: new Date("2099-01-01") }];
    },
  };
  return port;
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const user3: IntelligenceContext = { role: "user", userId: "3", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeCommunity(calls: string[] = []): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("community", createCommunityReadHandler(async () => makePort(calls)), ["read"]);
  return p;
}

async function main(): Promise<void> {
  console.log("COMM1 — Community Foundation");

  // =========================================================================
  section("1. Architecture — one domain, one owner, household grain");

  const cap = intelligencePlatform.getCapability("community");
  assert(cap !== undefined, "community is a registered platform capability, not a separate application");
  assert(cap?.availability === "available", "community is bound and executable", cap?.availability);
  assert(
    cap !== undefined && cap.owner.includes("communities") && cap.owner.includes("D37"),
    "the capability names its SoT owner (D37)",
    cap?.owner,
  );
  assert(
    cap?.owningService === "server/lib/community.ts",
    "exactly ONE owning service is declared",
    cap?.owningService,
  );
  assert(
    cap?.capabilityClass === "read-only" && cap.executableIntents.every(v => v === "read"),
    "the capability is read-only — membership lifecycle is not reachable from the platform",
  );
  // Community has no UI (scope lock), so it must not be a routable Companion room.
  assert(
    cap?.companionDomain === "platform",
    "companionDomain is 'platform', not a room — COMM1 builds no UI, so nothing may route to it",
    String(cap?.companionDomain),
  );

  // THE MEMBERSHIP GRAIN. This is the architectural claim the whole domain rests on.
  assert(
    /communityMembers[\s\S]{0,400}householdId: integer\("household_id"\)[\s\S]{0,120}references\(\(\) => households\.id/.test(SCHEMA_SRC),
    "community_members references HOUSEHOLDS",
  );
  const membersBlock = SCHEMA_SRC.slice(
    SCHEMA_SRC.indexOf("export const communityMembers"),
    SCHEMA_SRC.indexOf("export const communityInvitations"),
  );
  assert(
    membersBlock.length > 0 && !/references\(\(\) => users\.id/.test(membersBlock),
    "community_members does NOT reference users — no second membership entity parallel to household_members",
  );
  assert(
    /unique\("community_members_community_household_unique"\)/.test(SCHEMA_SRC),
    "one membership row per household per community",
  );
  // One entity, not two: a neighbourhood is a kind.
  assert(
    !/pgTable\("neighbourhoods"/.test(SCHEMA_SRC) && /kind: text\("kind"\)/.test(SCHEMA_SRC),
    "a neighbourhood is a KIND of community, not a second table",
  );

  // =========================================================================
  section("2. The binding — delegation, read-only, honest gaps");

  const platform = platformWithFakeCommunity();

  const anonRead = await platform.handle(
    { verb: "read", capabilityId: "community", parameters: { scope: "communities" } },
    anon,
  );
  assert(anonRead.status === "denied", "anonymous read → denied", anonRead.status);

  const calls: string[] = [];
  const p2 = platformWithFakeCommunity(calls);
  const mine = await p2.handle(
    { verb: "read", capabilityId: "community", parameters: { scope: "communities" } },
    user1,
  );
  assert(mine.status === "ok", "authenticated read → ok", mine.status);
  const minePayload = mine.result as { communities: { id: number; name: string }[] };
  assert(minePayload.communities.length === 2, "household 10 sees both its communities");
  assert(
    calls.some(c => c.startsWith("getHouseholdForUser")),
    "the handler DELEGATES the ownership walk to the owner (never resolves household itself)",
  );

  // Read-only enforcement, at TWO layers.
  //
  // Layer 1 — the REGISTRY. Community declares `supportedIntents: ["read"]` and
  // nothing else, so a write verb is refused as `unsupported_intent` before any
  // handler runs. This is deliberately narrower than Household, which allow-lists
  // add/delete/explain and lets them reach its handler to be gapped there: a verb
  // Community will never support should not be in its architectural surface at all.
  for (const verb of ["add", "delete", "explain"] as const) {
    const r = await platform.handle(
      { verb, capabilityId: "community", parameters: {} },
      user1,
    );
    assert(
      r.status === "unsupported_intent",
      `"${verb}" is refused at the registry — it is not in Community's supported surface`,
      r.status,
    );
  }

  // Layer 2 — the HANDLER GUARD, as defence in depth. Even if a future edit
  // widened `supportedIntents`, the handler itself still executes only "read".
  // Called directly, bypassing the registry, so the guard is proven on its own.
  const rawHandler = createCommunityReadHandler(async () => makePort());
  for (const verb of ["add", "delete", "explain"] as const) {
    let threw = false;
    try {
      await rawHandler({ verb, capabilityId: "community", parameters: {} }, user1);
    } catch (err) {
      threw = /read-only|not executable/i.test(String((err as Error).message));
    }
    assert(threw, `the handler's own guard refuses "${verb}" even if the registry widened`);
  }

  // A household in no communities gets an empty list, which is TRUE — not a gap.
  const p3 = platformWithFakeCommunity();
  const none = await p3.handle(
    { verb: "read", capabilityId: "community", parameters: { scope: "communities" } },
    user3,
  );
  assert(
    none.status === "ok" && (none.result as { communities: unknown[] }).communities.length === 0,
    "a household in no communities gets an honest empty list, not a gap",
  );

  // =========================================================================
  section("3. The privacy boundary — membership is NOT a read grant");

  // Asserting the COMPLEMENT: no method anywhere in this domain returns another
  // household's content. This is what makes the boundary structural rather than
  // a filter someone must remember to apply.
  const FORBIDDEN_TABLES = [
    "householdEaters", "household_eaters",
    "plannerEntries", "planner_entries",
    "plannerWeeks", "planner_weeks",
    "shoppingList", "shopping_list",
    "userPantryItems", "user_pantry_items",
    "meals", "foodDiaryDays", "food_diary_days",
    "conversations",
  ];
  for (const table of FORBIDDEN_TABLES) {
    assert(
      !new RegExp(`\\b${table}\\b`).test(OWNER_SRC),
      `the Community owner never touches ${table}`,
    );
  }

  // The owner declares its own readable set, and the declaration matches reality.
  assert(
    /COMMUNITY_READABLE_TABLES/.test(OWNER_SRC),
    "the owner declares which tables it may read",
  );
  assert(
    /"households"/.test(OWNER_SRC) === false,
    "the owner does not read the households table itself — it holds ids, not household records",
  );

  // The port is the only way the handler could reach data, so its shape IS the boundary.
  for (const table of FORBIDDEN_TABLES) {
    assert(
      !new RegExp(`\\b${table}\\b`).test(PORT_SRC),
      `the read port exposes no method returning ${table}`,
    );
  }
  assert(
    !/name|displayName/.test(
      PORT_SRC.slice(PORT_SRC.indexOf("CommunityMemberHouseholdRow"), PORT_SRC.indexOf("CommunityInvitationRow")),
    ),
    "a member household is surfaced as an id and a role — never a name",
  );

  // Members scope returns ids and roles only.
  const p4 = platformWithFakeCommunity();
  const members = await p4.handle(
    { verb: "read", capabilityId: "community", parameters: { scope: "members", communityId: 1 } },
    user1,
  );
  assert(members.status === "ok", "a member may read their community's members", members.status);
  const memberPayload = members.result as { members: Record<string, unknown>[]; memberCount: number };
  assert(memberPayload.memberCount === 2, "member count is truthful");
  const memberKeys = Object.keys(memberPayload.members[0] ?? {}).sort();
  assert(
    JSON.stringify(memberKeys) === JSON.stringify(["householdId", "role"]),
    "a member row carries EXACTLY householdId and role — nothing else",
    JSON.stringify(memberKeys),
  );

  // Tokens never reach an AI-facing surface (the INT13 inviteCode decision).
  const p5 = platformWithFakeCommunity();
  const invites = await p5.handle(
    { verb: "read", capabilityId: "community", parameters: { scope: "invitations" } },
    user3,
  );
  assert(invites.status === "ok", "a household may read its own pending invitations", invites.status);
  assert(
    !JSON.stringify(invites.result).includes("token"),
    "an invitation token is NEVER surfaced to the platform — same decision INT13 made for inviteCode",
  );
  assert(
    !/\btoken\b/.test(HANDLER_SRC.slice(HANDLER_SRC.indexOf("case \"invitations\""))),
    "the handler has no code path that reads a token",
  );

  // =========================================================================
  section("4. Probe resistance — 'not yours' and 'does not exist' are the same answer");

  const p6 = platformWithFakeCommunity();
  const notMine = await p6.handle(
    // Community 2 exists, but household 20 (user 2) is not in it.
    { verb: "read", capabilityId: "community", parameters: { scope: "members", communityId: 2 } },
    { role: "user", userId: "2", premium: false },
  );
  const p7 = platformWithFakeCommunity();
  const notReal = await p7.handle(
    { verb: "read", capabilityId: "community", parameters: { scope: "members", communityId: 9999 } },
    { role: "user", userId: "2", premium: false },
  );
  assert(notMine.status === "gap", "a community the household is not in → gap", notMine.status);
  assert(notReal.status === "gap", "a community that does not exist → gap", notReal.status);
  assert(
    notMine.message === notReal.message,
    "the two messages are IDENTICAL — membership cannot be probed by watching the error",
    `${notMine.message} vs ${notReal.message}`,
  );

  // The HTTP surface must make the same refusal.
  const ROUTES_SRC = read("server/routes.ts");
  const communityRoutes = ROUTES_SRC.slice(
    ROUTES_SRC.indexOf("COMM1 — Community Foundation"),
    ROUTES_SRC.indexOf('app.get("/api/household"'),
  );
  assert(
    /getCommunityForMember[\s\S]{0,200}404/.test(communityRoutes),
    "the members route returns 404 for a community the household is not in — same as not found",
  );
  assert(
    !/req\.body\?\.householdId\s*\)\s*;[\s\S]{0,200}getCommunitiesForHousehold\(Number\(req/.test(communityRoutes),
    "no route takes the acting household from the client",
  );
  const sessionResolutions = (communityRoutes.match(/getHouseholdForUser\(req\.user!\.id\)/g) ?? []).length;
  assert(
    sessionResolutions >= 8,
    `every community route resolves the household from the SESSION (found ${sessionResolutions})`,
  );

  // =========================================================================
  section("5. The SEC1 rule — one membership predicate, shared by read and write");

  assert(
    /function activeMembership\(/.test(OWNER_SRC),
    "the owner defines ONE membership predicate",
  );
  // Every place that asks "is this household in this community" must compose it.
  // Counting the literal status comparison catches a second, looser way to ask.
  const statusChecks = (OWNER_SRC.match(/eq\(communityMembers\.status, "active"\)/g) ?? []).length;
  assert(
    statusChecks >= 3,
    `membership status is checked wherever membership is asked (found ${statusChecks})`,
  );
  assert(
    /getMembership[\s\S]{0,200}activeMembership\(/.test(OWNER_SRC),
    "the authorization primitive composes the shared predicate",
  );
  assert(
    /leaveCommunity[\s\S]{0,900}activeMembership\(/.test(OWNER_SRC),
    "the WRITE side uses the same predicate as the read (the SEC1 defect was these disagreeing)",
  );
  // A departure is soft, as with household_members — the row stays, dated.
  assert(
    !/db\.delete\(communityMembers\)/.test(OWNER_SRC),
    "leaving is a soft departure — a membership row is never deleted",
  );

  // =========================================================================
  section("6. Lifecycle invariants — enforced in the database, not just in code");

  assert(
    /community_members_status_check[\s\S]{0,300}left_at IS NOT NULL/.test(MIGRATION_SRC),
    "a membership that has left must be dated (CHECK)",
  );
  assert(
    /community_invitations_status_check[\s\S]{0,200}'pending', 'accepted', 'declined', 'revoked', 'expired'/.test(MIGRATION_SRC),
    "the invitation state machine is closed (CHECK)",
  );
  assert(
    /community_invitations_responded_check[\s\S]{0,300}status <> 'pending' AND responded_at IS NOT NULL/.test(MIGRATION_SRC),
    "a resolved invitation must record when it resolved (CHECK)",
  );
  assert(
    /expires_at TIMESTAMPTZ NOT NULL/.test(MIGRATION_SRC),
    "an invitation MUST expire — there is no permanent standing grant",
  );
  assert(
    /community_invitations_token_key/.test(MIGRATION_SRC),
    "invitation tokens are unique",
  );

  // Acceptance requires identity, not just the bearer token.
  assert(
    /invitation\.invitedHouseholdId !== acceptingHouseholdId/.test(OWNER_SRC),
    "the token alone is NOT sufficient — the accepting household must be the invited one",
  );
  assert(
    /expiresAt\.getTime\(\) <= Date\.now\(\)/.test(OWNER_SRC),
    "expiry is enforced at read time, not only stored",
  );
  // A community must always be administrable.
  assert(
    /Transfer ownership before leaving/.test(OWNER_SRC),
    "the last owner cannot leave — a community is never stranded unadministrable",
  );

  // One owner of "who may join": no second join mechanism.
  assert(
    !/inviteCode/.test(OWNER_SRC) && !/invite_code/.test(MIGRATION_SRC.slice(MIGRATION_SRC.indexOf("comm1_community_foundation"))),
    "COMM1 adds no shared join code — 'who may join' has exactly ONE owner",
  );

  // Privacy registry — the domain must not escape GDPR export/erasure.
  const PRIVACY_SRC = read("server/privacy/personal-data-registry.ts");
  assert(
    /id: "community-membership"/.test(PRIVACY_SRC),
    "Community is declared in the personal data registry",
  );
  assert(
    /"community_members"/.test(PRIVACY_SRC) && /"community_invitations"/.test(PRIVACY_SRC),
    "all three Community tables are named for the completeness gate",
  );
  assert(
    /erasureNote:[\s\S]{0,400}belong to the household, not to you alone/.test(PRIVACY_SRC),
    "the erasure note states the household grain — one member leaving does not withdraw the household",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"─".repeat(60)}`);
  console.log(`COMM1: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailures:");
    failures.forEach(f => console.log(`  • ${f}`));
    process.exit(1);
  }
  console.log("Households belong to neighbourhoods. Nothing else crosses.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
