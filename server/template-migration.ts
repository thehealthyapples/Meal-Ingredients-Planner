import { db } from "./db";
import { meals, mealTemplates, mealPlanEntries, mealCategories } from "@shared/schema";
import { eq, isNull, sql } from "drizzle-orm";

export async function runTemplateMigration() {
  const unlinkedMeals = await db.select({
    id: meals.id,
    name: meals.name,
    categoryId: meals.categoryId,
  }).from(meals).where(isNull(meals.mealTemplateId));

  if (unlinkedMeals.length === 0) return;

  console.log(`[Template Migration] Found ${unlinkedMeals.length} unlinked meals, creating templates...`);

  for (const meal of unlinkedMeals) {
    const normalizedName = meal.name.trim();
    const existing = await db.select().from(mealTemplates)
      .where(sql`LOWER(TRIM(${mealTemplates.name})) = LOWER(${normalizedName})`);

    let templateId: number;
    if (existing.length > 0) {
      templateId = existing[0].id;
    } else {
      let categoryName = 'dinner';
      if (meal.categoryId) {
        const [cat] = await db.select().from(mealCategories).where(eq(mealCategories.id, meal.categoryId));
        if (cat) categoryName = cat.name.toLowerCase();
      }
      const [newTemplate] = await db.insert(mealTemplates).values({
        name: normalizedName,
        category: categoryName,
        description: 'Auto-created template',
      }).returning();
      templateId = newTemplate.id;
    }

    await db.update(meals).set({ mealTemplateId: templateId }).where(eq(meals.id, meal.id));

    await db.update(mealPlanEntries)
      .set({ mealTemplateId: templateId, resolvedSourceType: 'scratch' })
      .where(eq(mealPlanEntries.mealId, meal.id));
  }

  console.log(`[Template Migration] Migration complete.`);
}
