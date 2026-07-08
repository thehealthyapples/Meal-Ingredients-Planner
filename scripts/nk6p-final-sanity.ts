import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main(){
  const dup:any = await db.execute(sql`select slug, count(*) c from knowledge_foods group by slug having count(*)>1`);
  const drows = dup.rows ?? dup;
  const cnt:any = await db.execute(sql`select count(*)::int c from knowledge_foods`);
  console.log("knowledge_foods total:", (cnt.rows??cnt)[0].c);
  console.log("duplicate slugs in knowledge_foods:", drows.length === 0 ? "NONE" : JSON.stringify(drows));
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});
