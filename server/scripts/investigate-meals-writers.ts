/**
 * Priority 2 Investigation: Meals Writers & Provenance
 *
 * Identifies all meal writers and analyzes provenance gaps
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

async function investigate() {
  console.log("\n=== MEALS WRITERS & PROVENANCE INVESTIGATION ===\n");

  try {
    // 1. Total meals count
    console.log("1. MEALS DATA STATE\n");
    const totalResult = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN is_system_meal THEN 1 END) as system_meals,
        COUNT(CASE WHEN NOT is_system_meal THEN 1 END) as user_meals
      FROM meals
    `);
    const counts = (totalResult.rows?.[0] as any) || {};
    console.log(`   Total meals: ${counts.total}`);
    console.log(`   System meals: ${counts.system_meals}`);
    console.log(`   User meals: ${counts.user_meals}\n`);

    // 2. Provenance analysis
    console.log("2. PROVENANCE ANALYSIS\n");

    // Check what provenance columns exist
    const columnsResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'meals'
        AND (column_name ILIKE '%source%' OR column_name ILIKE '%provenance%' OR column_name ILIKE '%acquisition%')
      ORDER BY column_name
    `);

    const provenanceColumns = (columnsResult.rows || []).map((r: any) => r.column_name);
    console.log(`   Provenance-related columns found: ${provenanceColumns.length}`);
    if (provenanceColumns.length > 0) {
      provenanceColumns.forEach((col: string) => {
        console.log(`     - ${col}`);
      });
    } else {
      console.log(`     (none found)`);
    }
    console.log();

    // 3. Check for common provenance indicators
    console.log("3. CHECKING FOR MEAL SOURCE INDICATORS\n");

    // Sample meals to understand structure
    const sampleResult = await db.execute(sql`
      SELECT
        id,
        name,
        user_id,
        is_system_meal,
        created_at,
        COALESCE(SUBSTRING(ingredients::text, 1, 50), '(no ingredients)') as sample_ingredients
      FROM meals
      LIMIT 5
    `);

    console.log("   Sample meals (first 5):");
    (sampleResult.rows || []).forEach((meal: any, i: number) => {
      const type = meal.is_system_meal ? "SYSTEM" : "USER";
      console.log(`   [${i+1}] ID=${meal.id} name="${meal.name}" type=${type} user=${meal.user_id}`);
    });
    console.log();

    // 4. Check for null/empty indicators
    console.log("4. DATA QUALITY CHECKS\n");

    const qualityResult = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN name IS NULL THEN 1 END) as null_name,
        COUNT(CASE WHEN ingredients IS NULL OR array_length(ingredients, 1) IS NULL THEN 1 END) as null_ingredients,
        COUNT(CASE WHEN created_at IS NULL THEN 1 END) as null_created_at,
        COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id
      FROM meals
    `);

    const quality = (qualityResult.rows?.[0] as any) || {};
    console.log(`   Total rows: ${quality.total}`);
    console.log(`   Null name: ${quality.null_name}`);
    console.log(`   Null ingredients: ${quality.null_ingredients}`);
    console.log(`   Null created_at: ${quality.null_created_at}`);
    console.log(`   Null user_id: ${quality.null_user_id}\n`);

    // 5. System meals distribution
    console.log("5. SYSTEM MEALS BREAKDOWN\n");

    const systemResult = await db.execute(sql`
      SELECT
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM meals
      WHERE is_system_meal = true
    `);

    const systemData = (systemResult.rows?.[0] as any) || {};
    console.log(`   System meal rows: ${systemData.count}`);
    console.log(`   Created by users: ${systemData.unique_users}\n`);

    // 6. Writer identification via git blame patterns (if possible)
    console.log("6. MEAL WRITERS (inferred from known code paths)\n");
    console.log("   Identified meal writer files:");
    console.log("   1. server/storage.ts - Main live writer (storage.ts methods)");
    console.log("   2. server/lib/seed-ready-meals.ts - System meal seed");
    console.log("   3. server/lib/openfoodfacts-importer.ts - Import from OpenFoodFacts");
    console.log("   4. server/lib/meal-service.ts - Meal service operations");
    console.log("   5. server/migrations/runner.ts - Schema migrations");
    console.log("   6. server/verification/publication-checks.ts - Verification operations\n");

    console.log("=== INVESTIGATION COMPLETE ===\n");
    console.log("Summary:");
    console.log(`  • ${counts.total} total meals (${counts.system_meals} system, ${counts.user_meals} user)`);
    console.log(`  • Provenance columns: ${provenanceColumns.length > 0 ? provenanceColumns.join(', ') : '(none)'}`);
    console.log(`  • Data quality issues: ${quality.null_name + quality.null_ingredients + quality.null_created_at + quality.null_user_id} null values`);
    console.log(`  • Meal writers: 6 files identified (see above)\n`);
    console.log("Next: Phase 2 - Analyze each writer to classify authorization\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  }
}

investigate().catch(console.error).finally(() => process.exit(0));
