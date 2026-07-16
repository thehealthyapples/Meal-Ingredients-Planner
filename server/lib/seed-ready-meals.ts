import { db } from "../db";
import { meals, mealCategories } from "@shared/schema";
import { eq } from "drizzle-orm";
import { READY_MEALS } from "./ready-meals-seed";

// CONV1 WRITE-4 — this module used to import `log` from ../index. That is the
// server's entry point, and its boot IIFE is unguarded, so importing this seed
// from a CLI runner booted the entire server: an Express listener, the route
// table and the media mount, all to insert some rows. A seed is a script; it
// must be runnable without the thing it seeds for. The import is gone and the
// cycle with it, which is what makes `npm run seed:ready-meals` possible at all.
const log = (message: string, source = "seed") => console.log(`[${source}] ${message}`);

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

  // CONV1 WRITE-4 — REMOVED: an unconditional wipe of image_url on EVERY system
  // meal, which ran on every boot. This seed owns the ~N ready meals it declares
  // in READY_MEALS; `is_system_meal` is a far wider set that also covers the 500
  // Founding Cookbook rows, which it does not own and must not touch. It was
  // harmless only because the cookbook has no images yet — the day it gained
  // them, boot would have wiped them, on every restart, silently. A publisher
  // may correct what it authored and nothing else.

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
