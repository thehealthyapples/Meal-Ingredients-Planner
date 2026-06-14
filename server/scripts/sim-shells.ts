// READ-ONLY: inspect meal_templates slot-component population for Tier-4 shell recovery.
import { db, pool } from "../db.js";
import * as schema from "../../shared/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  const t = await db.select().from(schema.mealTemplates).where(eq(schema.mealTemplates.isActive, true));
  console.log(`active templates: ${t.length}`);
  const fields = ["sharedBaseComponents","proteinSlots","carbSlots","vegSlots","toppingSlots","sauceSlots"] as const;
  let withAnySlot = 0;
  const catWithSlots: Record<string, number> = {};
  const catTotal: Record<string, number> = {};
  let withCompatibleDiets = 0;
  for (const row of t as any[]) {
    const cat = (row.category || "?").toLowerCase();
    catTotal[cat] = (catTotal[cat]||0)+1;
    const all = fields.flatMap(f => (row[f] as string[] | null) ?? []);
    if (all.length > 0) { withAnySlot++; catWithSlots[cat] = (catWithSlots[cat]||0)+1; }
    if (((row.compatibleDiets as string[]|null) ?? []).length > 0) withCompatibleDiets++;
  }
  console.log(`templates with >=1 populated slot component: ${withAnySlot}/${t.length}`);
  console.log(`templates with non-empty compatibleDiets: ${withCompatibleDiets}/${t.length}`);
  console.log(`category totals: ${JSON.stringify(catTotal)}`);
  console.log(`category WITH slot components: ${JSON.stringify(catWithSlots)}`);
  console.log(`\nexamples WITH slots:`);
  let shown = 0;
  for (const row of t as any[]) {
    const all = fields.flatMap(f => (row[f] as string[] | null) ?? []);
    if (all.length > 0 && shown < 12) {
      console.log(`  [${row.id}] "${row.name}" cat=${row.category} diets=${JSON.stringify(row.compatibleDiets)} slots=${JSON.stringify(all).slice(0,120)}`);
      shown++;
    }
  }
}
main().catch(console.error).finally(()=>pool.end());
