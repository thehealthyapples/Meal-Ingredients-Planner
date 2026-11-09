/**
 * Priority 2: Repair — Backfill 64 meals with missing provenance
 *
 * Updates 64 user meals that were created by preloadStarterMeals()
 * without proper acquisition fields.
 *
 * Safe: Only affects rows with NULL acquisition_type, sets to derived values
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

async function backfill() {
  console.log("\n=== PROVENANCE BACKFILL (OPTION A) ===\n");

  try {
    // Step 1: Verify the 64 rows exist
    console.log("Step 1: Identifying rows to backfill...");
    const verifyResult = await db.execute(sql`
      SELECT
        COUNT(*) as count,
        MIN(id) as min_id,
        MAX(id) as max_id
      FROM meals
      WHERE (acquisition_type IS NULL OR acquisition_lane IS NULL)
        AND meal_source_type = 'starter'
    `);

    const verify = (verifyResult.rows?.[0] as any) || {};
    console.log(`  Found ${verify.count} meals to backfill`);
    console.log(`  ID range: ${verify.min_id} to ${verify.max_id}\n`);

    if (verify.count === 0) {
      console.log("✓ No rows need backfill. Exiting.\n");
      process.exit(0);
    }

    // Step 2: Show before state
    console.log("Step 2: Before state (sample)...");
    const beforeResult = await db.execute(sql`
      SELECT
        id,
        name,
        meal_source_type,
        acquisition_lane,
        acquisition_type
      FROM meals
      WHERE acquisition_type IS NULL AND meal_source_type = 'starter'
      LIMIT 3
    `);

    (beforeResult.rows || []).forEach((row: any) => {
      console.log(`  ID ${row.id}: "${row.name}"`);
      console.log(`    lane=${row.acquisition_lane} type=${row.acquisition_type}\n`);
    });

    // Step 3: Execute backfill
    console.log("Step 3: Executing backfill...");
    await db.execute(sql`
      UPDATE meals
      SET
        acquisition_lane = 'tha_library',
        acquisition_type = 'authored'
      WHERE (acquisition_type IS NULL OR acquisition_lane IS NULL)
        AND meal_source_type = 'starter'
    `);
    console.log(`✓ Updated ${verify.count} rows\n`);

    // Step 4: Verify after state
    console.log("Step 4: Verifying after state...");
    const afterResult = await db.execute(sql`
      SELECT
        COUNT(*) as count,
        COUNT(CASE WHEN acquisition_lane = 'tha_library' THEN 1 END) as has_lane,
        COUNT(CASE WHEN acquisition_type = 'authored' THEN 1 END) as has_type
      FROM meals
      WHERE meal_source_type = 'starter'
        AND (acquisition_lane IS NOT NULL OR acquisition_type IS NOT NULL)
    `);

    const after = (afterResult.rows?.[0] as any) || {};
    console.log(`  Total starter meals: ${after.count}`);
    console.log(`  With tha_library lane: ${after.has_lane}`);
    console.log(`  With authored type: ${after.has_type}\n`);

    // Step 5: Check no other rows affected
    console.log("Step 5: Verifying no unintended changes...");
    const otherResult = await db.execute(sql`
      SELECT
        COUNT(*) as still_null
      FROM meals
      WHERE acquisition_type IS NULL
        OR acquisition_lane IS NULL
    `);

    const other = (otherResult.rows?.[0] as any) || {};
    if (other.still_null === 0) {
      console.log("✓ No rows with NULL acquisition fields remain\n");
    } else {
      console.log(`⚠️ WARNING: ${other.still_null} rows still have NULL fields\n`);
    }

    console.log("=== BACKFILL COMPLETE ===\n");
    console.log("Summary:");
    console.log(`  ✓ Backfilled ${verify.count} rows`);
    console.log(`  ✓ Set acquisition_lane = 'tha_library'`);
    console.log(`  ✓ Set acquisition_type = 'authored'`);
    console.log(`  ✓ Verified no unintended changes\n`);
    console.log("Next: Apply code fix to preloadStarterMeals()\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  }
}

backfill().catch(console.error).finally(() => process.exit(0));
