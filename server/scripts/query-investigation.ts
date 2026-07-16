import { db } from "../db.js";
import * as schema from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { pool } from "../db.js";

async function main() {
  // 1. Household eaters
  console.log("\n=== HOUSEHOLD EATERS ===");
  const eaters = await db.select().from(schema.householdEaters);
  console.log(`Total household eaters: ${eaters.length}`);
  for (const e of eaters) {
    console.log(JSON.stringify({
      id: e.id, name: e.displayName, userId: e.userId,
      defaultDietTypes: e.defaultDietTypes,
      hardRestrictions: e.hardRestrictions
    }));
  }

  // 2. Users (diet lives on household_eaters since CONV1 P4 / OWN-1 — see section 1)
  console.log("\n=== USERS ===");
  const users = await db.select({
    id: schema.users.id, username: schema.users.username,
  }).from(schema.users);
  for (const u of users) {
    console.log(JSON.stringify(u));
  }

  // 3. User preferences for diet types
  console.log("\n=== USER PREFERENCES (diet types/exclusions) ===");
  const prefs = await db.select({
    userId: schema.userPreferences.userId,
    dietTypes: schema.userPreferences.dietTypes,
    excludedIngredients: schema.userPreferences.excludedIngredients
  }).from(schema.userPreferences);
  for (const p of prefs) {
    console.log(JSON.stringify(p));
  }

  // 4. Meal templates - active count and categories
  console.log("\n=== MEAL TEMPLATES (active) ===");
  const templates = await db.select().from(schema.mealTemplates).where(eq(schema.mealTemplates.isActive, true));
  console.log(`Total active templates: ${templates.length}`);
  const byCat: Record<string, number> = {};
  for (const t of templates) { byCat[t.category] = (byCat[t.category] || 0) + 1; }
  console.log("By category:", JSON.stringify(byCat));
  for (const t of templates) {
    console.log(`  [${t.id}] "${t.name}" cat="${t.category}" diets=${JSON.stringify(t.compatibleDiets)} protein=${JSON.stringify(t.proteinSlots)?.substring(0,80)}`);
  }

  // 5. User meals count and categories
  console.log("\n=== USER MEALS SUMMARY ===");
  const meals = await db.select().from(schema.meals);
  const byUser: Record<number, { count: number; noIngredients: number; kinds: Record<string,number>; sources: Record<string,number> }> = {};
  for (const m of meals) {
    if (!byUser[m.userId]) byUser[m.userId] = { count: 0, noIngredients: 0, kinds: {}, sources: {} };
    byUser[m.userId].count++;
    const ings = m.ingredients as string[] | null;
    if (!ings || ings.length === 0) byUser[m.userId].noIngredients++;
    const k = m.kind || "unknown";
    byUser[m.userId].kinds[k] = (byUser[m.userId].kinds[k] || 0) + 1;
    const s = m.mealSourceType || "unknown";
    byUser[m.userId].sources[s] = (byUser[m.userId].sources[s] || 0) + 1;
  }
  for (const [uid, data] of Object.entries(byUser)) {
    console.log(`User ${uid}: ${data.count} meals, ${data.noIngredients} no-ingredients, kinds=${JSON.stringify(data.kinds)}, sources=${JSON.stringify(data.sources)}`);
  }

  // 6. Categories table
  console.log("\n=== MEAL CATEGORIES ===");
  const cats = await db.select().from(schema.categories);
  console.log(JSON.stringify(cats.map(c => ({ id: c.id, name: c.name }))));
}

main().catch(console.error).finally(() => pool.end());
