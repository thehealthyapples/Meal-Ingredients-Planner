import { db } from "../db";
import { sql } from "drizzle-orm";

async function run() {
  const u = await db.execute(sql`SELECT id, username, created_at FROM users WHERE id = 38`);
  console.log("User 38:", u.rows);

  const m = await db.execute(sql`
    SELECT id, name, is_system_meal, user_id FROM meals
    WHERE id IN (2221, 86, 92, 1935, 2225, 2271)
  `);
  console.log("\nAffected meals:", m.rows);

  const active = await db.execute(sql`
    SELECT DISTINCT meal_id FROM planner_entries
    WHERE meal_id IN (2221, 86, 92, 1935, 2225, 2271)
  `);
  console.log("\nActive in planner_entries:", active.rows);

  const userCount = await db.execute(sql`SELECT COUNT(*) as c FROM users`);
  console.log("\nTotal users in system:", (userCount.rows[0] as any).c);
}

run().catch((e) => { console.error("ERROR:", e); process.exit(1); }).finally(() => process.exit(0));
