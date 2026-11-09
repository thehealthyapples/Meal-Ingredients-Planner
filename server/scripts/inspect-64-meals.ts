/**
 * Inspect the 64 meals with NULL acquisition_type/lane
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

async function inspect() {
  console.log("\n=== INSPECTING 64 MEALS WITH NULL ACQUISITION FIELDS ===\n");

  try {
    // Get all 64 meals
    const allResult = await db.execute(sql`
      SELECT
        id,
        name,
        user_id,
        is_system_meal,
        created_at,
        meal_source_type,
        acquisition_type,
        acquisition_lane,
        acquisition_source_key
      FROM meals
      WHERE acquisition_type IS NULL OR acquisition_lane IS NULL
      ORDER BY created_at DESC
    `);

    const meals = allResult.rows || [];
    console.log(`Total meals with NULL fields: ${meals.length}\n`);

    // Analyze patterns
    const typeMap = new Map<string, number>();
    const sourceTypeMap = new Map<string, number>();
    const userMap = new Set<any>();
    let systemCount = 0, userCount = 0;

    meals.forEach((m: any) => {
      const typeKey = m.is_system_meal ? "SYSTEM" : "USER";
      typeMap.set(typeKey, (typeMap.get(typeKey) || 0) + 1);
      sourceTypeMap.set(m.meal_source_type || "NULL", (sourceTypeMap.get(m.meal_source_type || "NULL") || 0) + 1);

      if (m.is_system_meal) systemCount++;
      else {
        userCount++;
        userMap.add(m.user_id);
      }
    });

    console.log("Distribution:");
    console.log(`  System meals: ${systemCount}`);
    console.log(`  User meals: ${userCount} (from ${userMap.size} users)\n`);

    console.log("By meal_source_type:");
    Array.from(sourceTypeMap.entries()).forEach(([type, count]) => {
      console.log(`  ${type || 'NULL'}: ${count}`);
    });
    console.log();

    // Show first 15 examples
    console.log("Sample meals (first 15):\n");
    meals.slice(0, 15).forEach((m: any, i: number) => {
      const type = m.is_system_meal ? "SYSTEM" : "USER";
      console.log(`[${i+1}] ID=${m.id} "${m.name}"`);
      console.log(`    Type: ${type}, User: ${m.user_id}`);
      console.log(`    Source Type: ${m.meal_source_type}`);
      console.log(`    Acquisition Type: ${m.acquisition_type || "NULL"}`);
      console.log(`    Acquisition Lane: ${m.acquisition_lane || "NULL"}`);
      console.log(`    Created: ${m.created_at}\n`);
    });

    console.log(`\n(Showing ${Math.min(15, meals.length)} of ${meals.length} total)\n`);

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  }
}

inspect().catch(console.error).finally(() => process.exit(0));
