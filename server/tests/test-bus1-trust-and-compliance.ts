// BUS1 — verification for the Trust & Compliance layer.
//
// Run: npx tsx server/tests/test-bus1-trust-and-compliance.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS TEST EXISTS, AND WHY IT USES A REAL DATABASE.
//
// The failure mode this whole workstream guards against is SILENT: THA tells a
// household it erased their data, the product keeps working perfectly, and the
// data is still there. Nothing surfaces it. No user complains, because nobody
// can see it. It would be discovered by a regulator, or never.
//
// A mocked test cannot catch that, because the thing being tested IS the
// database's behaviour — which tables cascade, which block, which quietly
// orphan. Those are facts about Postgres and this schema, not about the code's
// intentions. So this creates a real account with real rows in ~15 tables,
// erases it, and then goes looking for what is left.
//
// It cleans up after itself, and every row it creates is namespaced by a marker
// so a failed run leaves nothing that could be confused for real data.
// ─────────────────────────────────────────────────────────────────────────────

import { eq, sql } from "drizzle-orm";
import { db, pool } from "../db";
import {
  conversations,
  foodDiaryDays,
  freezerMeals,
  householdEaters,
  householdMembers,
  households,
  meals,
  plannerDays,
  plannerEntries,
  plannerWeeks,
  privacyActivityLog,
  shoppingList,
  supportRequests,
  userConsents,
  userPantryItems,
  userPreferences,
  users,
} from "@shared/schema";
import { eraseAccount } from "../privacy/account-erasure-service";
import { buildDataExport } from "../privacy/data-export-service";
import { recordConsent } from "../privacy/consent-service";
import { PERSONAL_DATA_REGISTRY, registeredTables } from "../privacy/personal-data-registry";
import { LEGAL_DOCUMENTS, renderLegalDocument, COMPANY_PROFILE } from "@shared/legal";
import { CONSENT_TYPES } from "@shared/privacy/consent";

const MARKER = "bus1-verify";
let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail?: string) {
  checks++;
  if (condition) {
    console.log(`  ✅ ${label}`);
  } else {
    failures++;
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Count rows still referencing a user id, by raw SQL so nothing is assumed. */
async function countRows(table: string, column: string, userId: number): Promise<number> {
  const result = await db.execute(
    sql.raw(`SELECT COUNT(*)::int AS n FROM ${table} WHERE ${column} = ${userId}`),
  );
  const rows = (result as unknown as { rows: Array<{ n: number }> }).rows;
  return rows[0]?.n ?? 0;
}

/**
 * Remove anything a PREVIOUS run left behind.
 *
 * Added after an early run crashed on a fixture defect partway through creating
 * its account, leaving marker-named rows in `meals` and `households` that the
 * end-of-run cleanup never reached. A test that only tidies up when it succeeds
 * is a test that litters exactly when something is already wrong — so the sweep
 * runs at the START, where a crash cannot skip it.
 */
async function sweepPreviousRuns(): Promise<void> {
  const m = MARKER;
  await db.execute(sql.raw(`DELETE FROM planner_entries WHERE day_id IN (SELECT id FROM planner_days WHERE week_id IN (SELECT id FROM planner_weeks WHERE week_name LIKE '${m}%'))`));
  await db.execute(sql.raw(`DELETE FROM planner_days WHERE week_id IN (SELECT id FROM planner_weeks WHERE week_name LIKE '${m}%')`));
  await db.execute(sql.raw(`DELETE FROM planner_weeks WHERE week_name LIKE '${m}%'`));
  await db.execute(sql.raw(`DELETE FROM freezer_meals WHERE meal_id IN (SELECT id FROM meals WHERE name LIKE '${m}%')`));
  await db.execute(sql.raw(`DELETE FROM meals WHERE name LIKE '${m}%'`));
  await db.execute(sql.raw(`DELETE FROM shopping_list WHERE product_name LIKE '${m}%'`));
  await db.execute(sql.raw(`DELETE FROM household_eaters WHERE display_name LIKE '${m}%'`));
  await db.execute(sql.raw(`DELETE FROM user_pantry_items WHERE ingredient_key LIKE '${m}%'`));
  await db.execute(sql.raw(`DELETE FROM household_members WHERE household_id IN (SELECT id FROM households WHERE name LIKE '${m}%')`));
  await db.execute(sql.raw(`DELETE FROM households WHERE name LIKE '${m}%'`));
  await db.execute(sql.raw(`DELETE FROM users WHERE username LIKE '${m}%'`));
}

async function main() {
  console.log("\n=== BUS1 — Trust & Compliance verification ===\n");
  await sweepPreviousRuns();

  // ───────────────────────────────────────────────────────────────────────
  console.log("1. Legal content renders and resolves every token");

  for (const slug of Object.keys(LEGAL_DOCUMENTS) as Array<keyof typeof LEGAL_DOCUMENTS>) {
    const doc = renderLegalDocument(slug);
    const serialised = JSON.stringify(doc);
    check(
      `${slug} contains no unresolved {{token}}`,
      !serialised.includes("{{"),
      serialised.match(/\{\{[^}]+\}\}/)?.[0],
    );
    check(`${slug} has sections`, doc.sections.length > 0);
    check(`${slug} carries a version`, /^\d+\.\d+\.\d+$/.test(doc.version), doc.version);
  }

  check(
    "placeholder company fields are flagged, not silently published",
    COMPANY_PROFILE.placeholder && COMPANY_PROFILE.placeholderFields.length > 0,
  );

  // ───────────────────────────────────────────────────────────────────────
  console.log("\n2. The personal data registry is internally consistent");

  const ids = PERSONAL_DATA_REGISTRY.map((e) => e.id);
  check("no duplicate category ids", new Set(ids).size === ids.length);
  check(
    "every non-exported category says why",
    PERSONAL_DATA_REGISTRY.every((e) => e.collect !== null || !!e.omittedBecause),
  );
  check(
    "every non-erased category says why",
    PERSONAL_DATA_REGISTRY.every((e) => e.erase !== null || !!e.erasureNote),
  );
  check("registry names tables", registeredTables().size > 20, `${registeredTables().size} tables`);

  // ───────────────────────────────────────────────────────────────────────
  console.log("\n3. A real account, with real data, is erased completely");

  // Build an account carrying rows in every awkward shape the schema has:
  // no-FK tables, a cascading chain, a SET NULL health-data row, and a
  // three-level parent chain with no cascade at any level.
  const [user] = await db
    .insert(users)
    .values({
      username: `${MARKER}-${Date.now()}@example.invalid`,
      password: "not-a-real-hash",
    })
    .returning();
  const userId = user.id;
  console.log(`   created account ${userId}`);

  const [household] = await db
    .insert(households)
    .values({ name: `${MARKER} household`, createdByUserId: userId, inviteCode: `${MARKER}-${Date.now()}` })
    .returning();
  await db.insert(householdMembers).values({ householdId: household.id, userId, role: "owner" });

  // The single most important row in this test: Article 9 health data whose FK
  // is ON DELETE SET NULL, so the database would have ORPHANED it rather than
  // erased it.
  await db.insert(householdEaters).values({
    householdId: household.id,
    userId,
    displayName: `${MARKER} eater`,
    hardRestrictions: ["peanut"],
  });

  const [meal] = await db
    .insert(meals)
    .values({ userId, name: `${MARKER} meal`, ingredients: [`${MARKER} ingredient`] })
    .returning();

  // A three-level chain with NO foreign key at any level — the shape that
  // orphans permanently if the parent is deleted before its children.
  const [week] = await db
    .insert(plannerWeeks)
    .values({ userId, householdId: household.id, weekNumber: 1, weekName: `${MARKER} week` })
    .returning();
  const [day] = await db.insert(plannerDays).values({ weekId: week.id, dayOfWeek: 1 }).returning();
  await db.insert(plannerEntries).values({ dayId: day.id, mealId: meal.id, mealType: "dinner" });

  await db.insert(shoppingList).values({ userId, householdId: household.id, productName: `${MARKER} item` });
  await db.insert(userPantryItems).values({ userId, ingredientKey: `${MARKER}-pantry` });
  await db.insert(freezerMeals).values({ userId, householdId: household.id, mealId: meal.id, totalPortions: 2, remainingPortions: 2, frozenDate: "2026-07-18" });
  await db.insert(foodDiaryDays).values({ userId, date: "2026-07-18" });
  await db.insert(userPreferences).values({ userId });
  await db.insert(conversations).values({ userId });
  await db.insert(supportRequests).values({
    userId,
    kind: "question",
    subject: `${MARKER} subject`,
    body: `${MARKER} body text that is long enough`,
  });
  for (const t of CONSENT_TYPES) {
    await recordConsent({
      userId,
      consentType: t,
      granted: true,
      source: "registration",
      context: { ip: "203.0.113.1", userAgent: "verification" },
    });
  }

  // ── Export BEFORE erasure ────────────────────────────────────────────
  const exported = await buildDataExport(userId);
  check("export includes the account", !!exported.data["account"]);
  check(
    "export never contains the password hash",
    !JSON.stringify(exported.data).includes("not-a-real-hash"),
  );
  check("export declares its omissions", exported.omissions.length > 0);
  check(
    "export includes the household's dietary needs",
    JSON.stringify(exported.data["eater-profile"]).includes("peanut"),
  );
  check(
    "export includes planner data",
    JSON.stringify(exported.data["planner"]).includes(`"weekNumber":1`),
  );
  check(
    "every registry category appears as a key",
    PERSONAL_DATA_REGISTRY.filter((e) => e.collect !== null).every((e) => e.id in exported.data),
  );

  // ── Erase ─────────────────────────────────────────────────────────────
  const receipt = await eraseAccount(userId);
  console.log(`   erased — ${receipt.totalRowsAffected} rows across ${Object.keys(receipt.categories).length} categories`);

  // ── Verify NOTHING is left ────────────────────────────────────────────
  const leftovers: Array<[string, string]> = [
    ["users", "id"],
    ["meals", "user_id"],
    ["shopping_list", "user_id"],
    ["planner_weeks", "user_id"],
    ["user_preferences", "user_id"],
    ["user_pantry_items", "user_id"],
    ["freezer_meals", "user_id"],
    ["food_diary_days", "user_id"],
    ["conversations", "user_id"],
    ["household_members", "user_id"],
    ["household_eaters", "user_id"],
  ];
  for (const [table, column] of leftovers) {
    const n = await countRows(table, column, userId);
    check(`${table} has no rows left`, n === 0, `${n} rows remain`);
  }

  // The children of the no-FK chains — the ones that orphan silently.
  const orphanDays = await db.select().from(plannerDays).where(eq(plannerDays.weekId, week.id));
  check("planner_days did not orphan", orphanDays.length === 0, `${orphanDays.length} orphaned`);
  const orphanEntries = await db.select().from(plannerEntries).where(eq(plannerEntries.dayId, day.id));
  check("planner_entries did not orphan", orphanEntries.length === 0, `${orphanEntries.length} orphaned`);

  // The household had exactly one member, so it goes too.
  const hh = await db.select().from(households).where(eq(households.id, household.id));
  check("sole-member household was erased", hh.length === 0);
  check("receipt reports the household erasure", receipt.householdErased);

  // ── Verify what SURVIVES survives correctly ───────────────────────────
  console.log("\n4. The lawful retention records survive, identifying nobody");

  const survivingConsents = await db
    .select()
    .from(userConsents)
    .where(sql`${userConsents.userId} IS NULL AND ${userConsents.recordedUserAgent} IS NULL`);
  check("consent rows were kept", survivingConsents.length >= CONSENT_TYPES.length);

  const stillLinked = await countRows("user_consents", "user_id", userId);
  check("no consent row still points at the account", stillLinked === 0, `${stillLinked} linked`);

  const ipLeak = await db.execute(
    sql`SELECT COUNT(*)::int AS n FROM user_consents WHERE recorded_ip = '203.0.113.1'`,
  );
  check(
    "the consent evidence no longer holds the IP address",
    ((ipLeak as unknown as { rows: Array<{ n: number }> }).rows[0]?.n ?? 0) === 0,
  );

  const redacted = await db.execute(
    sql`SELECT COUNT(*)::int AS n FROM support_requests WHERE body LIKE '%${sql.raw(MARKER)}%'`,
  );
  check(
    "the support message text was redacted",
    ((redacted as unknown as { rows: Array<{ n: number }> }).rows[0]?.n ?? 0) === 0,
  );

  const auditRows = await db
    .select()
    .from(privacyActivityLog)
    .where(eq(privacyActivityLog.userId, userId));
  check("an erasure record was written", auditRows.some((r) => r.action === "account-erasure"));
  check("an export record was written", auditRows.some((r) => r.action === "data-export"));
  check(
    "the erasure record holds no personal data",
    auditRows.every((r) => !JSON.stringify(r.detail ?? {}).toLowerCase().includes(MARKER)),
  );

  // ── Clean up this test's own residue ──────────────────────────────────
  await db.delete(privacyActivityLog).where(eq(privacyActivityLog.userId, userId));
  await db.execute(sql`DELETE FROM user_consents WHERE user_id IS NULL AND source = 'registration' AND recorded_ip IS NULL AND document_version IS NOT NULL AND recorded_at > NOW() - INTERVAL '5 minutes'`);
  await db.execute(sql`DELETE FROM support_requests WHERE user_id IS NULL AND subject = '[redacted — account deleted]' AND created_at > NOW() - INTERVAL '5 minutes'`);
  await db.delete(meals).where(eq(meals.id, meal.id));

  console.log(`\n=== ${checks - failures}/${checks} checks passed ===\n`);
  await pool.end();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error("\nVerification crashed:", err);
  await pool.end();
  process.exit(1);
});
