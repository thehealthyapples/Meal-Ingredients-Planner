import { readFileSync } from "fs";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main(){
  const slugs = readFileSync("scratchpad_nk6p_imported_slugs.txt","utf-8").split("\n").map(s=>s.trim()).filter(Boolean);
  let zeroN=0, zeroB=0; const bad:string[]=[];
  for (const s of slugs){
    const n:any = await db.execute(sql`select count(*)::int c from knowledge_food_nutrients where food_slug=${s} and is_active=true`);
    const b:any = await db.execute(sql`select count(*)::int c from knowledge_food_benefits where food_slug=${s} and is_active=true`);
    const nc = (n.rows??n)[0].c, bc=(b.rows??b)[0].c;
    if(nc===0){zeroN++; bad.push(s+" (0 nutrients)");}
    if(bc===0){zeroB++; bad.push(s+" (0 benefits)");}
  }
  console.log(`checked ${slugs.length} imported foods`);
  console.log(`  with 0 nutrients: ${zeroN}`);
  console.log(`  with 0 benefits: ${zeroB}`);
  if(bad.length) console.log("  offenders:\n   "+bad.join("\n   "));
  else console.log("  ALL imported foods have >=1 nutrient AND >=1 benefit (no partial/zero-binding foods).");
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});
