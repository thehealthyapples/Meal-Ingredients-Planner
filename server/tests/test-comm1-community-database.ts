/**
 * test-comm1-community-database.ts (COMM1)
 * ========================================
 * DB-BACKED verification that the Community Foundation's invariants are enforced
 * by POSTGRES, not merely by TypeScript.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM test-comm1-community-foundation.ts
 * ----------------------------------------------------------------------
 * SEC1's lesson is that a binding test proves DELEGATION, not ISOLATION:
 * `test-intelligence-household-binding.ts:156` mocked its owner, which is why 51
 * green assertions sat on top of a live cross-household leak for the whole life
 * of that bug. The COMM1 foundation test is likewise mock-backed and
 * source-level. This file is the counterweight — it writes real rows and asserts
 * the database REFUSES the bad ones.
 *
 * It requires DATABASE_URL and is therefore not part of the default gate; it is
 * run explicitly, as the SEC1 and BUS1 DB-backed suites are.
 *
 * WHAT IT COVERS: table shape, the household grain (no user_id column, no FK to
 * users), the lifecycle CHECK constraints, uniqueness, and cascade.
 *
 * WHAT IT DOES NOT YET COVER, STATED PLAINLY: service-level cross-household
 * isolation with two real households — proving household B cannot read household
 * A's community data through the owning service. That needs multi-household
 * fixtures and is recorded as an open follow-on in COMM1's report.
 *
 * Run with: npm run test:comm1-community-database
 */

import { db } from "../db.js";
import { sql } from "drizzle-orm";

async function main() {
  let pass = 0, fail = 0;
  const ok = (c: boolean, l: string, d?: unknown) => {
    if (c) { console.log(`  ✓ ${l}`); pass++; }
    else { console.log(`  ✗ ${l}${d !== undefined ? ` — ${JSON.stringify(d)}` : ""}`); fail++; }
  };

  // 1. Tables exist with the right shape
  const cols = await db.execute<{ table_name: string; column_name: string }>(sql`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_name IN ('communities','community_members','community_invitations')
    ORDER BY table_name, ordinal_position`);
  const byTable: Record<string, string[]> = {};
  for (const r of cols.rows) (byTable[r.table_name] ??= []).push(r.column_name);
  console.log("\n1. Tables created");
  ok(byTable.communities?.length > 0, "communities exists");
  ok(byTable.community_members?.includes("household_id"), "community_members.household_id exists");
  ok(!byTable.community_members?.includes("user_id"), "community_members has NO user_id — household grain holds in the DB");
  ok(byTable.community_invitations?.includes("token"), "community_invitations.token exists");

  // 2. The FK actually points at households
  const fks = await db.execute<{ col: string; ref_table: string }>(sql`
    SELECT kcu.column_name AS col, ccu.table_name AS ref_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_name='community_members'`);
  console.log("\n2. Foreign keys");
  const hhFk = fks.rows.find(r => r.col === "household_id");
  ok(hhFk?.ref_table === "households", "community_members.household_id -> households", hhFk?.ref_table);
  ok(!fks.rows.some(r => r.ref_table === "users"), "community_members references users NOWHERE");

  // 3. The CHECK constraints REFUSE bad rows — the real test
  console.log("\n3. Database refuses invalid lifecycle states");
  const [hh] = (await db.execute<{ id: number }>(sql`SELECT id FROM households LIMIT 1`)).rows;
  if (!hh) { console.log("  ! no household to test against — skipping"); }
  else {
    const [c] = (await db.execute<{ id: number }>(sql`
      INSERT INTO communities (name, kind, created_by_household_id)
      VALUES ('COMM1 verify', 'neighbourhood', ${hh.id}) RETURNING id`)).rows;

    // 3a. 'left' without left_at must be refused
    let refused = false;
    try {
      await db.execute(sql`INSERT INTO community_members (community_id, household_id, status)
                           VALUES (${c.id}, ${hh.id}, 'left')`);
    } catch { refused = true; }
    ok(refused, "a 'left' membership with no left_at is REFUSED by the database");

    // 3b. bad role refused
    refused = false;
    try {
      await db.execute(sql`INSERT INTO community_members (community_id, household_id, role)
                           VALUES (${c.id}, ${hh.id}, 'superuser')`);
    } catch { refused = true; }
    ok(refused, "an invented role is REFUSED");

    // 3c. valid membership accepted
    await db.execute(sql`INSERT INTO community_members (community_id, household_id, role, status)
                         VALUES (${c.id}, ${hh.id}, 'owner', 'active')`);
    const mc = (await db.execute<{ n: string }>(sql`
      SELECT COUNT(*)::text AS n FROM community_members WHERE community_id=${c.id}`)).rows[0];
    ok(mc.n === "1", "a valid membership is accepted", mc.n);

    // 3d. duplicate membership refused
    refused = false;
    try {
      await db.execute(sql`INSERT INTO community_members (community_id, household_id)
                           VALUES (${c.id}, ${hh.id})`);
    } catch { refused = true; }
    ok(refused, "a household cannot be seated twice in one community");

    // 3e. invitation without expiry refused
    refused = false;
    try {
      await db.execute(sql`INSERT INTO community_invitations (community_id, invited_household_id, token)
                           VALUES (${c.id}, ${hh.id}, 'tok-no-expiry')`);
    } catch { refused = true; }
    ok(refused, "an invitation with NO expiry is REFUSED — no permanent standing grant");

    // 3f. accepted invitation without responded_at refused
    refused = false;
    try {
      await db.execute(sql`INSERT INTO community_invitations (community_id, invited_household_id, token, status, expires_at)
                           VALUES (${c.id}, ${hh.id}, 'tok-bad', 'accepted', NOW() + INTERVAL '1 day')`);
    } catch { refused = true; }
    ok(refused, "an 'accepted' invitation with no responded_at is REFUSED");

    // 3g. valid invitation accepted, and token uniqueness holds
    await db.execute(sql`INSERT INTO community_invitations (community_id, invited_household_id, token, expires_at)
                         VALUES (${c.id}, ${hh.id}, 'tok-comm1-verify', NOW() + INTERVAL '14 days')`);
    refused = false;
    try {
      await db.execute(sql`INSERT INTO community_invitations (community_id, invited_household_id, token, expires_at)
                           VALUES (${c.id}, ${hh.id}, 'tok-comm1-verify', NOW() + INTERVAL '14 days')`);
    } catch { refused = true; }
    ok(refused, "invitation tokens are unique");

    // 4. CASCADE: deleting the community removes its members and invitations
    console.log("\n4. Cascade behaviour");
    await db.execute(sql`DELETE FROM communities WHERE id=${c.id}`);
    const left = (await db.execute<{ n: string }>(sql`
      SELECT (SELECT COUNT(*) FROM community_members WHERE community_id=${c.id})
           + (SELECT COUNT(*) FROM community_invitations WHERE community_id=${c.id}) AS n`)).rows[0];
    ok(left.n === "0", "deleting a community cascades to members and invitations", left.n);
  }

  console.log(`\n${"─".repeat(50)}\nCOMM1 database: ${pass} passed, ${fail} failed`);
  return fail;


}
main().then((f)=>process.exit(f>0?1:0)).catch(e=>{console.error(e);process.exit(1);});
