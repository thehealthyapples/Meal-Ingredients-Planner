/**
 * SEC1 — A departed member's live account data must not be served to the household
 *        they left.
 *
 * CONV1 item SEC-1; the defect PEOPLE1 § 8.1 found and verified end to end.
 *
 * The chain under test:
 *   1. Alice joins Bob's household → joinHousehold creates an eater row carrying
 *      her userId (CONV1 P4: membership events own eater-row creation; the old
 *      syncMembersAsEaters read-time sync is deleted).
 *   2. Alice leaves. leaveHousehold sets her membership to "left" and NEVER touches
 *      household_eaters — so her row survives, still pointing at her live account.
 *   3. getHouseholdEaters filtered on householdId ONLY, so her row came back.
 *   4. routes.ts then re-read her CURRENT account and served it to Bob —
 *      indefinitely, and updating as she changed it. (That read-time enrichment is
 *      itself deleted under CONV1 P4 / READ-1: eater rows are now the stored owner.)
 *
 * These tests drive real rows through the real storage layer against the real
 * database. They are deliberately not mocked: the defect lived in a WHERE clause,
 * and a mock of that clause would have asserted the bug.
 *
 * Run with:  npm run test:sec1-departed-member-eater-exposure
 */

import { db } from "../db.js";
import { storage } from "../storage.js";
import { getHouseholdForUser } from "../lib/household.js";
import { households, householdMembers, householdEaters, users } from "../../shared/schema.js";
import { eq, inArray } from "drizzle-orm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${e}`);
    console.error(`    received: ${a}`);
    failed++;
  }
}

const stamp = `sec1-${process.pid}-${Math.floor(Math.random() * 1e6)}`;
const createdUserIds: number[] = [];
const createdHouseholdIds: number[] = [];

async function makeUser(name: string, diet: { pattern: string; restrictions: string[] }) {
  const user = await storage.createUser({
    username: `${stamp}-${name}`,
    password: "x",
    displayName: name,
  } as never);
  createdUserIds.push(user.id);
  createdHouseholdIds.push(await getHouseholdForUser(user.id));
  // CONV1 P4 / WRITE-2: a person's diet lives on their eater row, written
  // through the one write door — not on the retired users.diet* columns.
  await storage.updatePersonDiet(user.id, {
    dietPattern: diet.pattern,
    hardRestrictions: diet.restrictions,
  });
  return user;
}

/** The household row (we need its inviteCode to drive a real join). */
async function householdRow(householdId: number) {
  const [row] = await db.select().from(households).where(eq(households.id, householdId));
  return row;
}

async function cleanup() {
  if (createdHouseholdIds.length) {
    await db.delete(householdEaters).where(inArray(householdEaters.householdId, createdHouseholdIds));
    await db.delete(householdMembers).where(inArray(householdMembers.householdId, createdHouseholdIds));
    await db.delete(households).where(inArray(households.id, createdHouseholdIds));
  }
  if (createdUserIds.length) {
    await db.delete(users).where(inArray(users.id, createdUserIds));
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nSEC1 — departed member eater exposure\n");

  // ── Case 1: the exact PEOPLE1 § 8.1 chain ──────────────────────────────────
  console.log("Case 1 — a member who leaves stops being served to the household");

  const bob = await makeUser("Bob", { pattern: "Omnivore", restrictions: [] });
  const alice = await makeUser("Alice", { pattern: "Vegan", restrictions: ["Nuts"] });

  const bobHouseholdId = await getHouseholdForUser(bob.id);
  const invite = (await householdRow(bobHouseholdId)).inviteCode!;

  await storage.joinHousehold(alice.id, invite);

  const whileMember = await storage.getHouseholdEaters(bobHouseholdId);
  assert(
    "while a member, Alice is an eater in Bob's household",
    whileMember.some(e => e.userId === alice.id),
    true,
  );
  assert("both members present", whileMember.length, 2);

  // Alice leaves.
  await storage.leaveHousehold(alice.id);
  createdHouseholdIds.push(await getHouseholdForUser(alice.id));

  // The row still exists — this fix does NOT delete it (planner_entry_eaters
  // references it, and retention is not this layer's decision).
  const rawRows = await db.select().from(householdEaters)
    .where(eq(householdEaters.householdId, bobHouseholdId));
  assert(
    "the orphaned row still EXISTS in the table (not deleted)",
    rawRows.some(r => r.userId === alice.id),
    true,
  );
  assert(
    "the orphaned row still carries Alice's userId (not severed to null)",
    rawRows.find(r => r.userId === alice.id)?.userId,
    alice.id,
  );

  // ...but it is no longer served.
  const afterLeaving = await storage.getHouseholdEaters(bobHouseholdId);
  assert(
    "★ after leaving, Alice is NOT served to Bob's household",
    afterLeaving.some(e => e.userId === alice.id),
    false,
  );
  assert("only Bob remains", afterLeaving.length, 1);
  assert("and Bob is still there", afterLeaving[0]?.userId, bob.id);

  // The exposure was that routes.ts re-read the linked account. Prove that the
  // person whose data would have leaked still has her diet — i.e. the fix closed
  // the read, it did not damage Alice. Under CONV1 P4 her diet travels with her:
  // leaving copies her declarations onto her eater row in her NEW household.
  const aliceDietNow = await storage.getPersonDiet(alice.id);
  assert("Alice's diet travels with her — pattern intact", aliceDietNow.dietPattern, "Vegan");
  assert("Alice's diet travels with her — allergens intact", aliceDietNow.hardRestrictions, ["Nuts"]);

  // ── Case 2: children must never be filtered out ────────────────────────────
  console.log("\nCase 2 — children (userId = null) are unaffected");

  const child = await storage.createHouseholdEater(bobHouseholdId, {
    displayName: "Child",
    defaultDietTypes: [],
    hardRestrictions: ["Peanuts"],
  });

  const withChild = await storage.getHouseholdEaters(bobHouseholdId);
  assert("a child with no account is served", withChild.some(e => e.id === child.id), true);
  assert("child keeps their own allergens", withChild.find(e => e.id === child.id)?.hardRestrictions, ["Peanuts"]);
  assert("household now shows Bob + child, and not Alice", withChild.length, 2);

  // ── Case 3: a removed member, not a leaver ─────────────────────────────────
  console.log("\nCase 3 — removeHouseholdMember closes the same hole");

  const carol = await makeUser("Carol", { pattern: "Vegetarian", restrictions: ["Shellfish"] });
  await storage.joinHousehold(carol.id, invite);

  assert(
    "Carol is served while an active member",
    (await storage.getHouseholdEaters(bobHouseholdId)).some(e => e.userId === carol.id),
    true,
  );

  await storage.removeHouseholdMember(bob.id, carol.id);
  createdHouseholdIds.push(await getHouseholdForUser(carol.id));

  assert(
    "★ a REMOVED member is not served either",
    (await storage.getHouseholdEaters(bobHouseholdId)).some(e => e.userId === carol.id),
    false,
  );

  // ── Case 4: rejoining restores the original row and its history ────────────
  console.log("\nCase 4 — a rejoining member keeps their original eater row");

  const aliceRowIdBefore = rawRows.find(r => r.userId === alice.id)?.id;
  await storage.joinHousehold(alice.id, invite);

  const afterRejoin = await storage.getHouseholdEaters(bobHouseholdId);
  assert("★ Alice is served again after rejoining", afterRejoin.some(e => e.userId === alice.id), true);
  assert(
    "★ and it is her ORIGINAL row — planner history survives, no duplicate",
    afterRejoin.find(e => e.userId === alice.id)?.id,
    aliceRowIdBefore,
  );

  const aliceRowCount = (await db.select().from(householdEaters)
    .where(eq(householdEaters.householdId, bobHouseholdId)))
    .filter(r => r.userId === alice.id).length;
  assert("exactly one row for Alice — the rejoin did not duplicate her", aliceRowCount, 1);

  // ─── Result ────────────────────────────────────────────────────────────────
  console.log(`\n${passed} passed, ${failed} failed\n`);
  await cleanup();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await cleanup().catch(() => {});
  process.exit(1);
});
