/**
 * Production Verification Script
 * ================================
 * Checks that prod DB matches code expectations for all release-critical areas.
 *
 * Usage (against prod Neon DB):
 *   DATABASE_URL="<prod url>" npx tsx scripts/verify-prod.ts
 *
 * Exits 0 if all checks pass. Exits 1 if any check fails.
 * Prints a table of PASS / FAIL / WARN for each area.
 */

import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

interface Check {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
}

const results: Check[] = [];

function pass(name: string, detail: string) { results.push({ name, status: "PASS", detail }); }
function fail(name: string, detail: string) { results.push({ name, status: "FAIL", detail }); }
function warn(name: string, detail: string) { results.push({ name, status: "WARN", detail }); }

async function run() {
  const client = await pool.connect();
  try {

    // ── 1. Schema migration head ──────────────────────────────────────────────
    const { rows: migRows } = await client.query<{ id: string }>(
      `SELECT id FROM schema_migrations ORDER BY applied_at DESC, id DESC LIMIT 1`
    );
    const latestMig = migRows[0]?.id ?? "(none)";
    const expectedHead = "2026-05-05_add_product_events_and_activity_summary";
    if (latestMig === expectedHead) {
      pass("Schema at head", latestMig);
    } else {
      fail("Schema at head", `Expected "${expectedHead}", got "${latestMig}"`);
    }

    // ── 2. planner_weeks: no rows with NULL household_id ─────────────────────
    const { rows: nullWeeks } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM planner_weeks WHERE household_id IS NULL`
    );
    const nullWeekCount = parseInt(nullWeeks[0]?.count ?? "0", 10);
    if (nullWeekCount === 0) {
      pass("planner_weeks.household_id", "All rows have household_id set");
    } else {
      fail("planner_weeks.household_id", `${nullWeekCount} rows still have NULL household_id — planner week selector will be empty for those users`);
    }

    // ── 3. planner_weeks: at least one user has 6 weeks ──────────────────────
    const { rows: weekCounts } = await client.query<{ household_id: number; cnt: string }>(
      `SELECT household_id, COUNT(*) AS cnt FROM planner_weeks GROUP BY household_id ORDER BY cnt DESC LIMIT 1`
    );
    const maxWeeks = parseInt(weekCounts[0]?.cnt ?? "0", 10);
    if (maxWeeks >= 6) {
      pass("planner_weeks count", `At least one household has ${maxWeeks} weeks`);
    } else if (maxWeeks > 0) {
      warn("planner_weeks count", `Max weeks per household is ${maxWeeks} (expected 6)`);
    } else {
      fail("planner_weeks count", "No planner_weeks rows found");
    }

    // ── 4. planner_days: each week has 7 days ────────────────────────────────
    const { rows: orphanDays } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM planner_weeks pw
       WHERE (SELECT COUNT(*) FROM planner_days pd WHERE pd.week_id = pw.id) <> 7`
    );
    const badWeeks = parseInt(orphanDays[0]?.count ?? "0", 10);
    if (badWeeks === 0) {
      pass("planner_days (7 per week)", "All planner_weeks have exactly 7 days");
    } else {
      fail("planner_days (7 per week)", `${badWeeks} planner_weeks have != 7 days — affected users will see incomplete week grid`);
    }

    // ── 5. shopping_list: no NULL resolution_state ────────────────────────────
    const { rows: nullState } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM shopping_list WHERE resolution_state IS NULL`
    );
    const nullStateCount = parseInt(nullState[0]?.count ?? "0", 10);
    if (nullStateCount === 0) {
      pass("shopping_list.resolution_state not null", "All rows have resolution_state set");
    } else {
      fail("shopping_list.resolution_state not null", `${nullStateCount} rows have NULL resolution_state — migration may not have applied`);
    }

    // ── 6. shopping_list: raw items count (should be run through backfill) ───
    const { rows: rawItems } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM shopping_list WHERE resolution_state = 'raw'`
    );
    const rawCount = parseInt(rawItems[0]?.count ?? "0", 10);
    if (rawCount === 0) {
      pass("shopping_list backfill", "No items in raw state");
    } else {
      warn("shopping_list backfill", `${rawCount} items still in raw state — run: npx tsx server/scripts/backfill-item-resolution.ts`);
    }

    // ── 7. pantry_ingredient_knowledge table exists ───────────────────────────
    const { rows: pikExists } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_name = 'pantry_ingredient_knowledge'
       ) AS exists`
    );
    if (pikExists[0]?.exists) {
      const { rows: pikCols } = await client.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'pantry_ingredient_knowledge'`
      );
      const cols = pikCols.map(r => r.column_name);
      const requiredCols = ["ingredient_key", "supports", "highlights", "why_it_matters", "good_to_know", "how_to_choose", "tags", "last_enriched_at", "enrichment_source", "enrichment_version", "is_locked", "created_at"];
      const missing = requiredCols.filter(c => !cols.includes(c));
      if (missing.length === 0) {
        pass("pantry_ingredient_knowledge schema", `Table exists with all required columns`);
      } else {
        fail("pantry_ingredient_knowledge schema", `Table exists but missing columns: ${missing.join(", ")}`);
      }
    } else {
      fail("pantry_ingredient_knowledge table", "Table does not exist — migration 2026-04-18_pantry_ingredient_knowledge may not have applied");
    }

    // ── 8. shopping_list resolution columns exist ─────────────────────────────
    const { rows: slCols } = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'shopping_list'`
    );
    const slColNames = slCols.map(r => r.column_name);
    const requiredSlCols = ["original_text", "canonical_name", "subcategory", "resolution_state", "review_reason", "review_suggestions"];
    const missingSlCols = requiredSlCols.filter(c => !slColNames.includes(c));
    if (missingSlCols.length === 0) {
      pass("shopping_list resolution columns", "All item-resolution columns present");
    } else {
      fail("shopping_list resolution columns", `Missing: ${missingSlCols.join(", ")} — migration 2026-04-12_item_resolution_layer may not have applied`);
    }

    // ── 9. All users have active household membership ─────────────────────────
    const { rows: noHousehold } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users u
       WHERE NOT EXISTS (
         SELECT 1 FROM household_members hm
         WHERE hm.user_id = u.id AND hm.status = 'active'
       )
       AND u.is_demo = false`
    );
    const noHouseholdCount = parseInt(noHousehold[0]?.count ?? "0", 10);
    if (noHouseholdCount === 0) {
      pass("All users have active household", "Every non-demo user has an active household_members row");
    } else {
      fail("All users have active household", `${noHouseholdCount} non-demo users have no active household_members row — getHouseholdForUser will throw for them`);
    }

    // ── 10. planner_entries: position column exists ───────────────────────────
    const { rows: peCols } = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'planner_entries'`
    );
    const peColNames = peCols.map(r => r.column_name);
    const requiredPeCols = ["position", "adaptation_result", "guest_eaters"];
    const missingPeCols = requiredPeCols.filter(c => !peColNames.includes(c));
    if (missingPeCols.length === 0) {
      pass("planner_entries columns", "All planner_entries columns present");
    } else {
      fail("planner_entries columns", `Missing: ${missingPeCols.join(", ")}`);
    }

  } finally {
    client.release();
    await pool.end();
  }

  // ── Print results ─────────────────────────────────────────────────────────
  console.log("\n=== Production Verification ===\n");
  let anyFail = false;
  for (const r of results) {
    const icon = r.status === "PASS" ? "✓" : r.status === "WARN" ? "⚠" : "✗";
    console.log(`  ${icon} [${r.status}] ${r.name}`);
    if (r.status !== "PASS") {
      console.log(`         ${r.detail}`);
    }
    if (r.status === "FAIL") anyFail = true;
  }

  const passed = results.filter(r => r.status === "PASS").length;
  const warned = results.filter(r => r.status === "WARN").length;
  const failed = results.filter(r => r.status === "FAIL").length;

  console.log(`\n  Total: ${passed} passed, ${warned} warned, ${failed} failed\n`);

  if (anyFail) {
    console.error("RESULT: FAIL — production has critical mismatches. Fix above items before serving traffic.");
    process.exit(1);
  } else if (warned > 0) {
    console.log("RESULT: WARN — prod is functional but has data gaps. Run backfills per RELEASE.md Step 4.");
    process.exit(0);
  } else {
    console.log("RESULT: PASS — production matches code expectations.");
    process.exit(0);
  }
}

run().catch(err => {
  console.error("Verify script fatal error:", err);
  process.exit(1);
});
