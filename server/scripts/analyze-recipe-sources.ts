/**
 * Priority 3 Investigation: Recipe-Source Integrity
 *
 * Analyzes 163 meals from forbidden/unlicensed external sources
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

async function analyze() {
  console.log("\n=== RECIPE-SOURCE INTEGRITY INVESTIGATION ===\n");

  try {
    // 1. Source policy context from FS3
    console.log("1. FS3 SOURCE POLICY REGISTER\n");
    console.log("   Licensed sources (permitted storage):");
    console.log("   • themealdb (licenceState: conditional)");
    console.log("   • edamam (licenceState: licensed)\n");

    console.log("   Forbidden sources (storage: forbidden):");
    console.log("   • apininjas (licenceState: pending_review)");
    console.log("   • bigoven (licenceState: pending_review)");
    console.log("   • fatsecret (licenceState: pending_review)");
    console.log("   • bbcgoodfood (licenceState: unlicensed)");
    console.log("   • allrecipes (licenceState: unlicensed)");
    console.log("   • jamieoliver (licenceState: unlicensed)");
    console.log("   • seriouseats (licenceState: unlicensed)\n");

    console.log("   Internal sources (THA-owned):");
    console.log("   • meal_shell (licenceState: owned)\n");

    // 2. Count meals by acquisition_source_key
    console.log("2. MEALS BY SOURCE KEY DISTRIBUTION\n");

    const sourceDistResult = await db.execute(sql`
      SELECT
        COALESCE(acquisition_source_key, 'NULL') as source_key,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN is_system_meal THEN 1 END) as system_meals,
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM meals
      GROUP BY acquisition_source_key
      ORDER BY count DESC
    `);

    (sourceDistResult.rows || []).forEach((row: any) => {
      console.log(`   ${row.source_key || '(NULL)'}: ${row.count} meals`);
      console.log(`     Users: ${row.unique_users}, System: ${row.system_meals}`);
      console.log(`     Created: ${row.oldest ? new Date(row.oldest).toISOString().split('T')[0] : 'N/A'} to ${row.newest ? new Date(row.newest).toISOString().split('T')[0] : 'N/A'}\n`);
    });

    // 3. Identify forbidden source meals (163 expected)
    console.log("3. FORBIDDEN/UNLICENSED SOURCE MEALS\n");

    const forbiddenSources = ['apininjas', 'bigoven', 'fatsecret', 'bbcgoodfood', 'allrecipes', 'jamieoliver', 'seriouseats'];

    const forbiddenResult = await db.execute(sql`
      SELECT
        acquisition_source_key,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN is_system_meal THEN 1 END) as system_meals,
        COUNT(CASE WHEN NOT is_system_meal THEN 1 END) as user_meals
      FROM meals
      WHERE acquisition_source_key = ANY(${forbiddenSources}::text[])
      GROUP BY acquisition_source_key
      ORDER BY count DESC
    `);

    const forbiddenMeals = forbiddenResult.rows || [];
    const totalForbidden = forbiddenMeals.reduce((sum: number, row: any) => sum + row.count, 0);

    console.log(`   Total forbidden/unlicensed meals: ${totalForbidden}\n`);
    forbiddenMeals.forEach((row: any) => {
      console.log(`   ${row.acquisition_source_key}: ${row.count} meals`);
      console.log(`     System: ${row.system_meals}, User: ${row.user_meals}, Users: ${row.unique_users}\n`);
    });

    // 4. Sample forbidden meals
    console.log("4. SAMPLE FORBIDDEN MEALS (first 10)\n");

    const samplesResult = await db.execute(sql`
      SELECT
        id,
        name,
        user_id,
        is_system_meal,
        acquisition_source_key,
        acquisition_type,
        created_at
      FROM meals
      WHERE acquisition_source_key = ANY(${forbiddenSources}::text[])
      LIMIT 10
    `);

    (samplesResult.rows || []).forEach((meal: any, i: number) => {
      const type = meal.is_system_meal ? "SYSTEM" : "USER";
      console.log(`   [${i+1}] ID=${meal.id} "${meal.name}"`);
      console.log(`       Type: ${type}, Source: ${meal.acquisition_source_key}`);
      console.log(`       Acq Type: ${meal.acquisition_type}, Created: ${new Date(meal.created_at).toISOString().split('T')[0]}\n`);
    });

    // 5. Check consumer impact - Planner references
    console.log("5. CONSUMER IMPACT ANALYSIS\n");

    const plannerResult = await db.execute(sql`
      SELECT
        COUNT(DISTINCT pe.meal_id) as referenced_meals,
        COUNT(DISTINCT pe.id) as planner_entries
      FROM planner_entries pe
      WHERE EXISTS (
        SELECT 1 FROM meals m
        WHERE m.id = pe.meal_id
          AND m.acquisition_source_key = ANY(${forbiddenSources}::text[])
      )
    `);

    const planner = (plannerResult.rows?.[0] as any) || {};
    console.log(`   Planner entries using forbidden meals: ${planner.planner_entries}`);
    console.log(`   Distinct meals in planner: ${planner.referenced_meals}\n`);

    // 6. Check for active use
    console.log("6. CURRENT USE ASSESSMENT\n");

    const recentUseResult = await db.execute(sql`
      SELECT
        COUNT(*) as total_forbidden,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as created_last_30d,
        COUNT(CASE WHEN is_system_meal THEN 1 END) as system_count,
        COUNT(CASE WHEN NOT is_system_meal THEN 1 END) as user_count
      FROM meals
      WHERE acquisition_source_key = ANY(${forbiddenSources}::text[])
    `);

    const use = (recentUseResult.rows?.[0] as any) || {};
    console.log(`   Total forbidden meals: ${use.total_forbidden}`);
    console.log(`   Created in last 30 days: ${use.created_last_30d}`);
    console.log(`   System meals: ${use.system_count}`);
    console.log(`   User meals: ${use.user_count}\n`);

    // 7. Summary
    console.log("=== INVESTIGATION SUMMARY ===\n");
    console.log(`Total forbidden source meals: ${totalForbidden}`);
    console.log(`Used in planner: ${planner.planner_entries > 0 ? 'YES' : 'NO'}`);
    console.log(`System meals affected: ${forbiddenMeals.reduce((sum: number, row: any) => sum + row.system_meals, 0)}`);
    console.log(`User meals affected: ${forbiddenMeals.reduce((sum: number, row: any) => sum + row.user_meals, 0)}\n`);

    console.log("Next: Phase 2 - Assess consumer impact and evidence\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  }
}

analyze().catch(console.error).finally(() => process.exit(0));
