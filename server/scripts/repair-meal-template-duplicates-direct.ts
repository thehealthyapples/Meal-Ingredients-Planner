/**
 * Priority 1 Repair: Direct execution (non-interactive)
 *
 * Found duplicates:
 * - Beef Lasagne (ID 553 to delete)
 * - Bounty (ID 583 to delete)
 * - Snickers (ID 581 to delete)
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

async function repair() {
  console.log("\n=== MEAL TEMPLATES DUPLICATE REPAIR (DIRECT) ===\n");

  try {
    const deleteIds = [553, 583, 581];

    // Step 1: Create backup
    console.log("Step 1: Creating backup...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS meal_templates_backup_2026_11_08 AS
      SELECT * FROM meal_templates WHERE FALSE
    `);

    await db.execute(sql`
      INSERT INTO meal_templates_backup_2026_11_08
      SELECT * FROM meal_templates
    `);
    console.log("✓ Backup created\n");

    // Step 2: Delete duplicates
    console.log("Step 2: Deleting duplicate rows...");
    console.log(`Deleting IDs: ${deleteIds.join(", ")}\n`);

    await db.execute(sql`
      DELETE FROM meal_templates
      WHERE id IN (553, 583, 581)
    `);
    console.log(`✓ Deleted ${deleteIds.length} duplicate rows\n`);

    // Step 3: Verify
    console.log("Step 3: Verifying...");
    const verifyResult = await db.execute(sql`
      SELECT name, COUNT(*) as count
      FROM meal_templates
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    if ((verifyResult.rows || []).length === 0) {
      console.log("✓ No duplicates remain\n");
    } else {
      console.log("⚠️ Duplicates still found:\n");
      console.log(verifyResult.rows);
    }

    // Step 4: Final count
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM meal_templates
    `);
    const finalCount = (countResult.rows?.[0] as any)?.total || 0;
    console.log(`Step 4: Final state: ${finalCount} total templates\n`);

    console.log("=== REPAIR COMPLETE ===\n");
    console.log("Summary:");
    console.log(`  ✓ Deleted 3 duplicate rows (IDs: 553, 583, 581)`);
    console.log(`  ✓ Final template count: ${finalCount}`);
    console.log(`  ✓ Backup preserved: meal_templates_backup_2026_11_08`);
    console.log("\nNext steps:");
    console.log("  1. Run: npm run seed:meal-shells");
    console.log("  2. Test Planner/Cookbook template loading");
    console.log("  3. Verify no regressions\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    console.error("\nTo rollback:");
    console.error("  DROP TABLE meal_templates;");
    console.error("  ALTER TABLE meal_templates_backup_2026_11_08 RENAME TO meal_templates;\n");
    process.exit(1);
  }
}

repair().catch(console.error).finally(() => process.exit(0));
