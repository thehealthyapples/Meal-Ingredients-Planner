/**
 * Priority 2: Detailed Provenance Analysis
 *
 * Identifies which meals lack provenance and analyzes meal writers
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

async function analyze() {
  console.log("\n=== PROVENANCE GAPS ANALYSIS ===\n");

  try {
    // 1. Meals with missing provenance data
    console.log("1. PROVENANCE DATA GAPS\n");

    const gapsResult = await db.execute(sql`
      SELECT
        COUNT(*) as total_meals,
        COUNT(CASE WHEN meal_source_type IS NULL THEN 1 END) as missing_meal_source_type,
        COUNT(CASE WHEN acquisition_source_key IS NULL THEN 1 END) as missing_acquisition_source_key,
        COUNT(CASE WHEN acquisition_type IS NULL THEN 1 END) as missing_acquisition_type,
        COUNT(CASE WHEN acquisition_lane IS NULL THEN 1 END) as missing_acquisition_lane
      FROM meals
    `);

    const gaps = (gapsResult.rows?.[0] as any) || {};
    console.log(`   Total meals: ${gaps.total_meals}`);
    console.log(`   Missing meal_source_type: ${gaps.missing_meal_source_type}`);
    console.log(`   Missing acquisition_source_key: ${gaps.missing_acquisition_source_key}`);
    console.log(`   Missing acquisition_type: ${gaps.missing_acquisition_type}`);
    console.log(`   Missing acquisition_lane: ${gaps.missing_acquisition_lane}\n`);

    // 2. Meal source type distribution
    console.log("2. MEAL SOURCE TYPE DISTRIBUTION\n");

    const sourceTypeResult = await db.execute(sql`
      SELECT
        COALESCE(meal_source_type, 'NULL') as source_type,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM meals
      GROUP BY meal_source_type
      ORDER BY count DESC
    `);

    (sourceTypeResult.rows || []).forEach((row: any) => {
      console.log(`   ${row.source_type}: ${row.count} meals (${row.unique_users} users)`);
    });
    console.log();

    // 3. Acquisition type distribution
    console.log("3. ACQUISITION TYPE DISTRIBUTION\n");

    const acqTypeResult = await db.execute(sql`
      SELECT
        COALESCE(acquisition_type, 'NULL') as acq_type,
        COUNT(*) as count
      FROM meals
      GROUP BY acquisition_type
      ORDER BY count DESC
    `);

    (acqTypeResult.rows || []).forEach((row: any) => {
      console.log(`   ${row.acq_type}: ${row.count} meals`);
    });
    console.log();

    // 4. System vs User provenance comparison
    console.log("4. SYSTEM VS USER MEALS PROVENANCE\n");

    const systemVsUserResult = await db.execute(sql`
      SELECT
        is_system_meal,
        COUNT(*) as total,
        COUNT(CASE WHEN meal_source_type IS NOT NULL THEN 1 END) as has_source_type,
        COUNT(CASE WHEN acquisition_source_key IS NOT NULL THEN 1 END) as has_source_key
      FROM meals
      GROUP BY is_system_meal
    `);

    (systemVsUserResult.rows || []).forEach((row: any) => {
      const type = row.is_system_meal ? "SYSTEM" : "USER";
      const sourceCoverage = row.has_source_type ? ((row.has_source_type / row.total) * 100).toFixed(1) : "0.0";
      const keyCoverage = row.has_source_key ? ((row.has_source_key / row.total) * 100).toFixed(1) : "0.0";
      console.log(`   ${type}:`);
      console.log(`     Total: ${row.total}`);
      console.log(`     With source_type: ${row.has_source_type} (${sourceCoverage}%)`);
      console.log(`     With source_key: ${row.has_source_key} (${keyCoverage}%)\n`);
    });

    // 5. Sample meals lacking provenance
    console.log("5. SAMPLE MEALS LACKING PROVENANCE (first 10)\n");

    const samplesResult = await db.execute(sql`
      SELECT
        id,
        name,
        user_id,
        is_system_meal,
        created_at,
        meal_source_type,
        acquisition_source_key,
        acquisition_type,
        acquisition_lane
      FROM meals
      WHERE meal_source_type IS NULL
        OR acquisition_source_key IS NULL
        OR acquisition_type IS NULL
      LIMIT 10
    `);

    (samplesResult.rows || []).forEach((meal: any, i: number) => {
      const type = meal.is_system_meal ? "SYSTEM" : "USER";
      console.log(`   [${i+1}] ID=${meal.id} "${meal.name}" (${type})`);
      console.log(`       source_type: ${meal.meal_source_type || "NULL"}`);
      console.log(`       source_key: ${meal.acquisition_source_key || "NULL"}`);
      console.log(`       acq_type: ${meal.acquisition_type || "NULL"}`);
      console.log(`       created: ${meal.created_at}\n`);
    });

    // 6. Writer analysis
    console.log("6. IDENTIFIED MEAL WRITERS\n");

    console.log("   ✓ server/storage.ts:");
    console.log("     - createMeal() → user recipe creation");
    console.log("     - resolveOrCreateProductMeal() → product-based meal creation\n");

    console.log("   ✓ server/lib/seed-ready-meals.ts:");
    console.log("     - seedReadyMeals() → ~500 system ready meals");
    console.log("     - Sets: mealSourceType='ready_meal', isSystemMeal=true\n");

    console.log("   ✓ server/lib/openfoodfacts-importer.ts:");
    console.log("     - OpenFoodFacts integration (likely test/legacy code)\n");

    console.log("   ✓ server/lib/meal-service.ts:");
    console.log("     - getStarterMeals() → meal selection (no writes)\n");

    console.log("   ✓ server/verification/publication-checks.ts:");
    console.log("     - Verification and validation (no writes)\n");

    console.log("=== ANALYSIS COMPLETE ===\n");
    console.log("Summary:");
    console.log(`  • Total meals: ${gaps.total_meals}`);
    console.log(`  • Missing provenance: ${Math.max(gaps.missing_meal_source_type, gaps.missing_acquisition_source_key)}`);
    console.log(`  • Main writers: storage.ts (live), seed-ready-meals.ts (system)`);
    console.log(`  • Meal source types found: ${sourceTypeResult.rows?.length || 0} distinct types\n`);
    console.log("Next: Classify each writer and plan repair\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  }
}

analyze().catch(console.error).finally(() => process.exit(0));
