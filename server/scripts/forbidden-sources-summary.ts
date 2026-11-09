/**
 * Priority 3: Quick summary of 163 forbidden meals
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

async function summary() {
  try {
    const forbiddenSources = ['apininjas', 'bigoven', 'fatsecret', 'bbcgoodfood', 'allrecipes', 'jamieoliver', 'seriouseats'];

    console.log("\n=== FORBIDDEN SOURCE MEALS SUMMARY ===\n");

    // Total forbidden
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM meals
      WHERE acquisition_source_key IN ('apininjas', 'bigoven', 'fatsecret', 'bbcgoodfood', 'allrecipes', 'jamieoliver', 'seriouseats')
    `);
    const total = (totalResult.rows?.[0] as any)?.total || 0;

    // By source
    const bySourceResult = await db.execute(sql`
      SELECT
        acquisition_source_key,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as users,
        COUNT(CASE WHEN is_system_meal THEN 1 END) as system_meals
      FROM meals
      WHERE acquisition_source_key IN ('apininjas', 'bigoven', 'fatsecret', 'bbcgoodfood', 'allrecipes', 'jamieoliver', 'seriouseats')
      GROUP BY acquisition_source_key
      ORDER BY count DESC
    `);

    console.log("Forbidden meals by source:");
    (bySourceResult.rows || []).forEach((row: any) => {
      console.log(`  ${row.acquisition_source_key}: ${row.count} meals (${row.users} users, ${row.system_meals} system)`);
    });

    console.log(`\nTOTAL: ${total} forbidden meals\n`);

    // Check planner usage
    const plannerResult = await db.execute(sql`
      SELECT COUNT(DISTINCT meal_id) as meals_in_planner
      FROM planner_entries
      WHERE meal_id IN (
        SELECT id FROM meals
        WHERE acquisition_source_key IN ('apininjas', 'bigoven', 'fatsecret', 'bbcgoodfood', 'allrecipes', 'jamieoliver', 'seriouseats')
      )
    `);
    const mealsInPlanner = (plannerResult.rows?.[0] as any)?.meals_in_planner || 0;

    console.log(`Forbidden meals actively used in planner: ${mealsInPlanner}\n`);

  } catch (error) {
    console.error("ERROR:", error);
    process.exit(1);
  }
}

summary().finally(() => process.exit(0));
