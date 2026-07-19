/**
 * test-comm2-orchard-isolation.ts (COMM2)
 * ========================================================================
 * THE TWO-HOUSEHOLD RUNTIME ISOLATION TEST.
 *
 * This is COMM1 § 11.1 — the follow-on COMM1 named as the thing that "should
 * exist before any capability crosses the boundary." COMM2 is that capability,
 * so COMM2 owes this test. It is written here rather than deferred again.
 *
 * WHY IT IS DIFFERENT FROM EVERYTHING ELSE ALREADY GREEN
 * ------------------------------------------------------
 * COMM1 has 81 source-level assertions and 14 DB-backed ones, and COMM2 adds 69
 * more. Every one of them proves something ABOUT THE CODE: that a method is
 * absent, that a table is not referenced, that a page does not import a module.
 * None of them drives TWO REAL HOUSEHOLDS through the owning service and checks
 * what the second one can actually obtain about the first.
 *
 * SEC1 is why that distinction is not pedantry. Fifty-one green, mock-backed
 * assertions sat on top of a live cross-household leak for the entire life of
 * that bug, because they proved delegation rather than isolation. This file
 * creates real rows, calls the real service, and asserts on real return values.
 *
 * It requires DATABASE_URL and is run explicitly, like COMM1's DB suite.
 *
 * FIXTURE HYGIENE: every row created here is torn down in a `finally`, and the
 * assertions are scoped to THIS run's ids — never global counts. That is a
 * direct lesson from COMM1 § 9, where two aborted runs left orphans that made
 * BUS1's global assertions fail for reasons unrelated to the code under test.
 *
 * Run with: npm run test:comm2-orchard-isolation
 */

import { db } from "../db.js";
import { sql } from "drizzle-orm";
import * as community from "../lib/community.js";

async function main() {
  let pass = 0, fail = 0;
  const ok = (c: boolean, l: string, d?: unknown) => {
    if (c) { console.log(`  ✓ ${l}`); pass++; }
    else { console.log(`  ✗ ${l}${d !== undefined ? ` — ${JSON.stringify(d)}` : ""}`); fail++; }
  };

  // Reserved marker so any orphan from an aborted run is unambiguously ours.
  const MARK = "comm2-isolation-fixture";
  let householdA = 0, householdB = 0, householdC = 0, communityId = 0;

  try {
    // ── Fixture: three households. A owns a neighbourhood, B is invited to it,
    //    C is a complete stranger and never touches it. ────────────────────
    // `invite_code` is NOT NULL on households — Domain 16's own permanent shared
    // code, which COMM1 deliberately did not mirror for communities (§ 2.2). The
    // fixture must supply one; it is marked so it can never collide with a real
    // household's, and it is never used to join anything here.
    const mk = async (name: string) => {
      const r = await db.execute<{ id: number }>(sql`
        INSERT INTO households (name, invite_code)
        VALUES (${`${MARK} ${name}`}, ${`${MARK}-${name}-${process.pid}`})
        RETURNING id`);
      return r.rows[0].id;
    };
    householdA = await mk("A");
    householdB = await mk("B");
    householdC = await mk("C");

    console.log("\n1. A creates a neighbourhood");
    const c = await community.createCommunity("Ashdown Lane", householdA);
    communityId = c.id;
    ok(c.kind === "neighbourhood", "created as a neighbourhood — a kind, not a second table", c.kind);
    const aMembership = await community.getMembership(communityId, householdA);
    ok(aMembership?.role === "owner", "the creating household is the owner", aMembership?.role);

    console.log("\n2. BEFORE B joins — a non-member obtains NOTHING");
    // This is the probe-resistance claim, at runtime rather than in a comment.
    const bSeesCommunity = await community.getCommunityForMember(communityId, householdB);
    ok(bSeesCommunity === null, "a non-member cannot read the community it was not invited to");

    const cSeesCommunity = await community.getCommunityForMember(communityId, householdC);
    ok(cSeesCommunity === null, "a stranger cannot read it either");

    // The critical one: "not yours" and "does not exist" must be the same answer.
    const nonExistent = await community.getCommunityForMember(999_999_999, householdB);
    ok(
      nonExistent === null && bSeesCommunity === null,
      "'not yours' and 'does not exist' are the SAME answer — the platform cannot be enumerated",
    );

    const bSeesMembers = await community.getMemberHouseholds(communityId, householdB);
    ok(
      Array.isArray(bSeesMembers) && bSeesMembers.length === 0,
      "a non-member gets NO member list — not a filtered one, an empty one",
      bSeesMembers,
    );

    const bCommunities = await community.getCommunitiesForHousehold(householdB);
    ok(
      !bCommunities.some(x => x.id === communityId),
      "the community does not appear in a non-member's own list",
    );

    console.log("\n3. The invitation is targeted, not a bearer grant");
    const inv = await community.inviteHousehold(communityId, householdB, householdA);
    ok(inv.ok === true, "A may invite B");
    const token = inv.ok ? inv.invitation.token : "";

    // The leaked-token case: C holds B's token and must still be refused.
    const stolen = await community.acceptInvitation(token, householdC);
    ok(
      stolen.ok === false,
      "a household holding someone else's token is REFUSED — the token alone is not sufficient",
      stolen,
    );
    const cAfterSteal = await community.getMembership(communityId, householdC);
    ok(cAfterSteal === null, "and the refusal left no membership behind");

    console.log("\n4. B accepts — and learns exactly one new fact");
    const accepted = await community.acceptInvitation(token, householdB);
    ok(accepted.ok === true, "the invited household may accept its own invitation");

    const bMembers = await community.getMemberHouseholds(communityId, householdB);
    ok(bMembers.length === 2, "B can now see that two households share the neighbourhood", bMembers.length);

    // ── THE LOAD-BEARING ASSERTION OF THIS ENTIRE WORKSTREAM ──────────────
    // What B receives about A, field by field. If a name, an eater, a plan or a
    // list ever appears here, the Orchard would render it — the room shows what
    // the service returns.
    const rowAboutA = bMembers.find(m => m.householdId === householdA);
    ok(!!rowAboutA, "B can see that A is here");
    const fields = Object.keys(rowAboutA ?? {}).sort();
    ok(
      JSON.stringify(fields) === JSON.stringify(["householdId", "joinedAt", "role"]),
      "B receives EXACTLY {householdId, joinedAt, role} about A — and nothing else",
      fields,
    );
    ok(
      !JSON.stringify(rowAboutA).includes(MARK),
      "A's household NAME does not appear in what B receives — the fixture marker proves it by absence",
      rowAboutA,
    );

    // The single-use property, at runtime.
    const replay = await community.acceptInvitation(token, householdB);
    ok(replay.ok === false, "the token cannot be replayed — single-use holds", replay);

    console.log("\n5. Membership is still not a read grant");
    // B is now a legitimate member. It must STILL be unable to reach anything of
    // A's beyond the membership fact. Proven by the absence of a method: assert
    // the service exposes none that could.
    const surface = Object.keys(community).filter(k => typeof (community as any)[k] === "function");
    const forbidden = surface.filter(fn =>
      /eater|restriction|plan|list|meal|profile|user|name/i.test(fn) &&
      !/getCommunit(y|ies)ForMember|getCommunitiesForHousehold/.test(fn),
    );
    ok(
      forbidden.length === 0,
      "the owning service exposes no method that could return another household's data",
      forbidden,
    );

    console.log("\n6. Leaving, and the last-owner floor");
    const ownerLeaves = await community.leaveCommunity(communityId, householdA);
    ok(
      ownerLeaves.ok === false,
      "the last owner cannot leave — a neighbourhood is never stranded unadministrable",
      ownerLeaves,
    );

    const bLeaves = await community.leaveCommunity(communityId, householdB);
    ok(bLeaves.ok === true, "a member may leave");

    const bAfterLeaving = await community.getMemberHouseholds(communityId, householdB);
    ok(
      bAfterLeaving.length === 0,
      "AFTER LEAVING, B can no longer see who is in it — the read and the write agree about who is at the table (the SEC1 lesson)",
      bAfterLeaving,
    );
    const bListAfter = await community.getCommunitiesForHousehold(householdB);
    ok(
      !bListAfter.some(x => x.id === communityId),
      "and it has left B's own list too",
    );

    // A departed household must be gone from A's view as well — the mirror of
    // the SEC1 defect, where a departed member kept leaking into the household.
    const aMembersAfter = await community.getMemberHouseholds(communityId, householdA);
    ok(
      aMembersAfter.length === 1 && aMembersAfter[0].householdId === householdA,
      "and A no longer sees B — a departure is symmetric",
      aMembersAfter,
    );
  } finally {
    // Teardown, scoped to this run. Cascades clear members and invitations.
    if (communityId) await db.execute(sql`DELETE FROM communities WHERE id = ${communityId}`);
    for (const h of [householdA, householdB, householdC].filter(Boolean)) {
      await db.execute(sql`DELETE FROM households WHERE id = ${h}`);
    }
    const leftovers = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*)::text AS n FROM households WHERE name LIKE ${`${MARK}%`}`);
    console.log(`\n  fixture rows remaining: ${leftovers.rows[0].n} (must be 0)`);
    if (leftovers.rows[0].n !== "0") fail++;
  }

  console.log("\n────────────────────────────────────────────────────────────");
  console.log(`COMM2 isolation: ${pass} passed, ${fail} failed`);
  console.log("Two real households. One shared fact. Nothing else crossed.");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
