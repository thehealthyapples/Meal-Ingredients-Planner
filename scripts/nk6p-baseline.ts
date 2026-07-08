import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const f = await db.execute(sql`select count(*)::int as c from knowledge_foods`);
  const n = await db.execute(sql`select count(*)::int as c from knowledge_nutrients`);
  const b = await db.execute(sql`select count(*)::int as c from knowledge_health_benefits`);
  const fn = await db.execute(sql`select count(*)::int as c from knowledge_food_nutrients`);
  const fb = await db.execute(sql`select count(*)::int as c from knowledge_food_benefits`);
  console.log("knowledge_foods:", (f.rows?.[0]??f[0]));
  console.log("knowledge_nutrients:", (n.rows?.[0]??n[0]));
  console.log("knowledge_health_benefits:", (b.rows?.[0]??b[0]));
  console.log("knowledge_food_nutrients:", (fn.rows?.[0]??fn[0]));
  console.log("knowledge_food_benefits:", (fb.rows?.[0]??fb[0]));
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});
