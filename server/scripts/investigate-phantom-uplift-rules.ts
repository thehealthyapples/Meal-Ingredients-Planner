/**
 * Priority 5 Investigation: Phantom uplift rule rows
 *
 * up-phantom-rules FAIL: rows in meal_uplift_applications cite rule IDs absent
 * from the UPLIFT_RULES source-of-truth array.
 */
import { db } from "../db";
import { sql } from "drizzle-orm";

async function investigate() {
  console.log("\n=== PHANTOM UPLIFT RULE ROWS ===\n");

  const schemaCheck = await db.execute(sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'meal_uplift_applications' ORDER BY ordinal_position
  `);
  console.log("Table schema (meal_uplift_applications):");
  (schemaCheck.rows || []).forEach((r: any) => console.log(`  ${r.column_name}: ${r.data_type}`));

  console.log("\n--- All rule_id groups in meal_uplift_applications ---\n");
  const allGroups = await db.execute(sql`
    SELECT rule_id, count(*)::int AS n, min(accepted_at) as first_seen, max(accepted_at) as last_seen
    FROM meal_uplift_applications GROUP BY rule_id ORDER BY n DESC
  `);
  (allGroups.rows || []).forEach((r: any) => {
    console.log(`  ${r.rule_id}: ${r.n} rows (${r.first_seen} to ${r.last_seen})`);
  });

  console.log("\n--- Detail: test_rule_boundary rows ---\n");
  const trb = await db.execute(sql`
    SELECT id, meal_id, user_id, rule_id, rule_name, ingredient, status, accepted_at, removed_at
    FROM meal_uplift_applications WHERE rule_id = 'test_rule_boundary' ORDER BY accepted_at
  `);
  console.log(trb.rows);

  console.log("\n--- Detail: fallback-deterministic-boosts rows ---\n");
  const fdb = await db.execute(sql`
    SELECT id, meal_id, user_id, rule_id, rule_name, ingredient, status, accepted_at, removed_at
    FROM meal_uplift_applications WHERE rule_id = 'fallback-deterministic-boosts' ORDER BY accepted_at
  `);
  console.log(fdb.rows);

  console.log("\n--- Are any of these meals/rows referenced elsewhere? (active use check) ---\n");
  const mealIds = [...new Set([...trb.rows, ...fdb.rows].map((r: any) => r.meal_id))];
  if (mealIds.length > 0) {
    const activeCheck = await db.execute(sql`
      SELECT DISTINCT meal_id FROM planner_entries WHERE meal_id = ANY(${mealIds}::int[])
    `);
    console.log(`Of ${mealIds.length} distinct meal IDs involved, ${activeCheck.rows.length} appear in planner_entries (active use).`);
    console.log("Meal IDs:", mealIds);
    console.log("Active ones:", activeCheck.rows);
  }
}

investigate().catch((e) => { console.error("ERROR:", e); process.exit(1); }).finally(() => process.exit(0));
