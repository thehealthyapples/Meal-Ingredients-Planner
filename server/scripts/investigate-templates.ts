/**
 * Priority 1 Investigation: Meal Templates
 * - Writer census
 * - Stub structure analysis
 * - Duplicate identities
 */

import { db } from "../db";
import { mealTemplates } from "@shared/schema";
import { sql } from "drizzle-orm";

async function investigate() {
  console.log("\n=== MEAL TEMPLATES INVESTIGATION ===\n");

  // 1. Total row count
  const totalResult = await db.execute(sql`SELECT COUNT(*) as count FROM meal_templates`);
  const total = (totalResult.rows[0] as any)?.count || 0;
  console.log(`1. Total meal_templates rows: ${total}`);

  // 2. Stub analysis: rows with empty/null shell structure arrays
  const stubResult = await db.execute(sql`
    SELECT COUNT(*) as stub_count
    FROM meal_templates
    WHERE (shared_base_components IS NULL OR shared_base_components = '{}')
      AND (protein_slots IS NULL OR protein_slots = '{}')
      AND (carb_slots IS NULL OR carb_slots = '{}')
      AND (veg_slots IS NULL OR veg_slots = '{}')
  `);
  const stubs = (stubResult.rows[0] as any)?.stub_count || 0;
  console.log(`2. Stub templates (empty shell structure): ${stubs}/${total} (${((stubs/total)*100).toFixed(1)}%)`);

  // 3. Sample stubs to understand structure
  if (stubs > 0) {
    console.log("\n   Sample stubs (first 3):");
    const samples = await db.execute(sql`
      SELECT id, name, category, shared_base_components, protein_slots, carb_slots, is_active
      FROM meal_templates
      WHERE (shared_base_components IS NULL OR shared_base_components = '{}')
        AND (protein_slots IS NULL OR protein_slots = '{}')
      LIMIT 3
    `);
    samples.rows.forEach((row: any, i: number) => {
      console.log(`   [${i+1}] ID=${row.id}, name="${row.name}", category="${row.category}", active=${row.is_active}`);
    });
  }

  // 4. Duplicate names
  const dupsResult = await db.execute(sql`
    SELECT name, COUNT(*) as count
    FROM meal_templates
    GROUP BY name
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `);
  const duplicates = dupsResult.rows || [];
  console.log(`\n3. Duplicate template names: ${duplicates.length}`);
  duplicates.forEach((dup: any) => {
    console.log(`   "${dup.name}" appears ${dup.count} times`);
  });

  // 5. Duplicate IDs (shouldn't happen but check)
  const dupIdResult = await db.execute(sql`
    SELECT id, COUNT(*) as count
    FROM meal_templates
    GROUP BY id
    HAVING COUNT(*) > 1
  `);
  const dupIds = dupIdResult.rows || [];
  if (dupIds.length > 0) {
    console.log(`\n   Duplicate IDs found: ${dupIds.length}`);
    dupIds.forEach((dup: any) => {
      console.log(`   ID=${dup.id} appears ${dup.count} times`);
    });
  }

  // 6. Writer analysis: check created_at timestamp patterns
  const writerResult = await db.execute(sql`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count,
      MIN(created_at) as earliest,
      MAX(created_at) as latest
    FROM meal_templates
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 10
  `);
  console.log(`\n4. Writer activity (by creation date):`);
  (writerResult.rows || []).forEach((row: any) => {
    console.log(`   ${row.date}: ${row.count} rows (${row.earliest} to ${row.latest})`);
  });

  // 7. Active vs inactive
  const activeResult = await db.execute(sql`
    SELECT is_active, COUNT(*) as count
    FROM meal_templates
    GROUP BY is_active
  `);
  console.log(`\n5. Active/Inactive status:`);
  (activeResult.rows || []).forEach((row: any) => {
    const status = row.is_active ? "ACTIVE" : "INACTIVE";
    console.log(`   ${status}: ${row.count} rows`);
  });

  // 8. Check for NULL fields that might be problematic
  const nullResult = await db.execute(sql`
    SELECT
      COUNT(CASE WHEN name IS NULL THEN 1 END) as null_name,
      COUNT(CASE WHEN category IS NULL THEN 1 END) as null_category,
      COUNT(CASE WHEN primary_slot IS NULL THEN 1 END) as null_primary_slot,
      COUNT(CASE WHEN suitable_slots IS NULL THEN 1 END) as null_suitable_slots
    FROM meal_templates
  `);
  const nullCounts = nullResult.rows[0] as any;
  console.log(`\n6. NULL field counts:`);
  console.log(`   name: ${nullCounts.null_name}, category: ${nullCounts.null_category}`);
  console.log(`   primary_slot: ${nullCounts.null_primary_slot}, suitable_slots: ${nullCounts.null_suitable_slots}`);

  console.log("\n=== INVESTIGATION COMPLETE ===\n");
}

investigate().catch(console.error).finally(() => process.exit(0));
