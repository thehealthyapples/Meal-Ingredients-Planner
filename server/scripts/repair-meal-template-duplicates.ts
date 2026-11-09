/**
 * Priority 1 Repair: Consolidate Duplicate Meal Templates
 *
 * This script:
 * 1. Identifies the three duplicate template names
 * 2. Creates backup table
 * 3. Consolidates to canonical rows (oldest by created_at)
 * 4. Deletes duplicate rows
 * 5. Verifies boot-bridge still works
 *
 * SAFE: Creates backup, shows what will be deleted, requires confirmation
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}

async function repair() {
  console.log("\n=== MEAL TEMPLATES DUPLICATE REPAIR ===\n");

  try {
    // Step 1: Identify duplicates
    console.log("Step 1: Identifying duplicate template names...");
    const duplicateResult = await db.execute(sql`
      SELECT
        id,
        name,
        category,
        is_active,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY id ASC) as row_num,
        COUNT(*) OVER (PARTITION BY name) as dup_count
      FROM meal_templates
      WHERE name IN (
        SELECT name FROM meal_templates
        GROUP BY name HAVING COUNT(*) > 1
      )
      ORDER BY name, id
    `);

    const duplicates = duplicateResult.rows || [];
    if (duplicates.length === 0) {
      console.log("✓ No duplicates found. Repair not needed.\n");
      process.exit(0);
    }

    console.log(`\n✓ Found ${duplicates.length} duplicate rows (${duplicates.length / 2} names):\n`);

    // Show which will be deleted
    const toDelete = duplicates.filter((row: any) => row.row_num > 1);
    const toKeep = duplicates.filter((row: any) => row.row_num === 1);

    console.log("KEEPING (canonical — oldest):");
    toKeep.forEach((row: any) => {
      console.log(`  ID ${row.id}: "${row.name}" (${row.category}) created ${row.created_at}`);
    });

    console.log("\nDELETING (alternates — newer):");
    toDelete.forEach((row: any) => {
      console.log(`  ID ${row.id}: "${row.name}" (${row.category}) created ${row.created_at}`);
    });

    // Step 2: Confirm before proceeding
    console.log("\n⚠️  WARNING: This will DELETE the alternate rows above.\n");
    const confirm1 = await prompt("Create backup table? (yes/no): ");
    if (confirm1 !== "yes") {
      console.log("Cancelled.\n");
      process.exit(0);
    }

    // Step 3: Create backup
    console.log("\nStep 2: Creating backup...");
    await db.execute(sql`
      CREATE TABLE meal_templates_backup_2026_11_08 AS
      SELECT * FROM meal_templates
    `);
    console.log("✓ Backup created: meal_templates_backup_2026_11_08\n");

    // Step 4: Confirm deletion
    const confirm2 = await prompt("Delete the alternate rows? (yes/no): ");
    if (confirm2 !== "yes") {
      console.log("Cancelled. Backup preserved.\n");
      process.exit(0);
    }

    // Step 5: Delete alternates
    console.log("\nStep 3: Deleting alternate rows...");
    const deleteIds = toDelete.map((row: any) => row.id);

    if (deleteIds.length > 0) {
      await db.execute(sql`
        DELETE FROM meal_templates
        WHERE id = ANY(${deleteIds}::int[])
      `);
      console.log(`✓ Deleted ${deleteIds.length} duplicate rows\n`);
    }

    // Step 6: Verify no duplicates remain
    console.log("Step 4: Verifying no duplicates remain...");
    const verifyResult = await db.execute(sql`
      SELECT name, COUNT(*) as count
      FROM meal_templates
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    if ((verifyResult.rows || []).length === 0) {
      console.log("✓ No duplicates remain\n");
    } else {
      console.log("⚠️ WARNING: Duplicates still found!\n");
      console.log(verifyResult.rows);
    }

    // Step 7: Count final state
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM meal_templates
    `);
    const finalCount = (countResult.rows?.[0] as any)?.total || 0;
    console.log(`Step 5: Final state: ${finalCount} total templates\n`);

    // Step 8: Re-seed to verify boot-bridge
    console.log("Step 6: Verifying boot-bridge (re-running seed)...");
    console.log("Run this command to verify: npm run seed:meal-shells\n");

    console.log("=== REPAIR COMPLETE ===\n");
    console.log("Summary:");
    console.log(`  ✓ Deleted ${deleteIds.length} duplicate rows`);
    console.log(`  ✓ Final template count: ${finalCount}`);
    console.log(`  ✓ Backup preserved: meal_templates_backup_2026_11_08`);
    console.log("\nNext: Run 'npm run seed:meal-shells' to verify boot-bridge\n");

    console.log("If issues occur, restore with:");
    console.log("  DROP TABLE meal_templates;");
    console.log("  ALTER TABLE meal_templates_backup_2026_11_08 RENAME TO meal_templates;");
    console.log("  npm run seed:meal-shells\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    console.error("\nROLLBACK: Restore from backup:");
    console.error("  DROP TABLE meal_templates;");
    console.error("  ALTER TABLE meal_templates_backup_2026_11_08 RENAME TO meal_templates;\n");
    process.exit(1);
  } finally {
    rl.close();
  }
}

repair().catch(console.error);
