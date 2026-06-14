import { db, pool } from "../db.js";
import * as schema from "../../shared/schema.js";
import { eq, and, inArray, notInArray } from "drizzle-orm";

async function main() {
  // Get User 1 meals that would pass route-level filtering
  const meals = await db.select().from(schema.meals).where(
    and(
      eq(schema.meals.userId, 1),
      notInArray(schema.meals.mealSourceType, ["starter", "planner-placeholder", "openfoodfacts"]),
      notInArray(schema.meals.kind as any, ["component"] as any[])
    )
  );
  
  // Get categories
  const cats = await db.select().from(schema.categories);
  const catMap = new Map(cats.map(c => [c.id, c.name.toLowerCase()]));
  
  console.log(`\nUser 1 meals after route filtering: ${meals.length}`);
  
  const byCat: Record<string, number> = {};
  const noIngredients: string[] = [];
  
  for (const m of meals) {
    const cat = m.categoryId ? catMap.get(m.categoryId) || "unknown" : "null-category";
    byCat[cat] = (byCat[cat] || 0) + 1;
    if (!m.ingredients || m.ingredients.length === 0) {
      noIngredients.push(m.name);
    }
  }
  
  console.log("By category:", JSON.stringify(byCat, null, 2));
  console.log(`\nNo ingredients (${noIngredients.length}):`, noIngredients.slice(0, 10));
  
  // List breakfast-categorized meals
  console.log("\n=== BREAKFAST MEALS ===");
  for (const m of meals) {
    const cat = m.categoryId ? catMap.get(m.categoryId) || "unknown" : "null-category";
    if (cat === "breakfast" || cat === "smoothie") {
      console.log(`  "${m.name}" ings=${m.ingredients?.length ?? 0} [${(m.ingredients as string[] || []).slice(0,3).join(', ')}...]`);
    }
  }
  
  // Show category lookup table
  console.log("\n=== CATEGORIES ===");
  for (const [id, name] of catMap) {
    console.log(`  ${id}: ${name}`);
  }
}

main().catch(console.error).finally(() => pool.end());
