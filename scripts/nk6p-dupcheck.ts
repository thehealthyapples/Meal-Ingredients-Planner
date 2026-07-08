import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main(){
  const slugs = ['chicken-hearts','chicken-liver','cottage-cheese','duck-liver','live-yoghurt','mascarpone','ricotta'];
  for (const s of slugs){
    const r:any = await db.execute(sql`select slug from knowledge_foods where slug=${s}`);
    const rows = r.rows ?? r;
    console.log(`${s}: ${rows.length? 'PRESENT':'ABSENT'}`);
  }
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});
