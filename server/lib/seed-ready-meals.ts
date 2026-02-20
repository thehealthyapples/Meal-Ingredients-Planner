import { db } from "../db";
import { meals, mealCategories } from "@shared/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { READY_MEALS } from "./ready-meals-seed";
import { log } from "../index";

const SYSTEM_USER_ID = 0;

const REQUIRED_CATEGORIES = [
  "Breakfast", "Lunch", "Dinner", "Snack", "Smoothie",
  "Dessert", "Drink", "Immune Boost", "Supplement",
  "Baby Meal", "Kids Meal", "Frozen Meal",
];

export async function seedReadyMeals() {
  const existingCats = await db.select().from(mealCategories);
  const existingCatNames = new Set(existingCats.map(c => c.name));
  for (const catName of REQUIRED_CATEGORIES) {
    if (!existingCatNames.has(catName)) {
      await db.insert(mealCategories).values({ name: catName }).onConflictDoNothing();
    }
  }

  const existing = await db.select().from(meals).where(eq(meals.isSystemMeal, true));

  const withImages = existing.filter(m => m.imageUrl);
  if (withImages.length > 0) {
    await db.update(meals)
      .set({ imageUrl: null })
      .where(and(eq(meals.isSystemMeal, true), isNotNull(meals.imageUrl)));
    log(`Cleared images from ${withImages.length} system meals`, "seed");
  }

  if (existing.length >= READY_MEALS.length) {
    log(`Ready meals already seeded (${existing.length} found)`, "seed");
    return;
  }

  const categories = await db.select().from(mealCategories);
  const categoryMap = new Map(categories.map(c => [c.name, c.id]));

  const existingNames = new Set(existing.map(m => m.name));
  let inserted = 0;

  for (const rm of READY_MEALS) {
    if (existingNames.has(rm.name)) continue;

    const categoryId = categoryMap.get(rm.category) || null;

    await db.insert(meals).values({
      userId: SYSTEM_USER_ID,
      name: rm.name,
      ingredients: [rm.name],
      instructions: [],
      servings: 1,
      categoryId,
      isReadyMeal: !rm.isDrink,
      isSystemMeal: true,
      mealFormat: rm.isDrink ? "drink" : "ready-meal",
      mealSourceType: "ready_meal",
      dietTypes: rm.dietTypes,
      audience: rm.audience || "adult",
      isDrink: rm.isDrink || false,
      drinkType: rm.drinkType || null,
      isFreezerEligible: rm.isFreezerEligible ?? (!rm.isDrink && !rm.audience),
    });
    inserted++;
  }

  log(`Seeded ${inserted} ready meals (${existing.length + inserted} total)`, "seed");
}
