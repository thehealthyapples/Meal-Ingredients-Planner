import { db } from "../db";
import { meals, userPreferences, users } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { Meal } from "@shared/schema";

const BREAKFAST_CATEGORY_ID = 1;
const LUNCH_CATEGORY_ID = 2;
const DINNER_CATEGORY_ID = 3;

const MEALS_PER_CATEGORY = 21;

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function filterByDiet(mealsList: Meal[], dietTypes: string[]): Meal[] {
  if (!dietTypes.length) return mealsList;
  return mealsList.filter((meal) => {
    if (!meal.dietTypes || meal.dietTypes.length === 0) return false;
    return dietTypes.some((diet) => meal.dietTypes.includes(diet));
  });
}

function pickMealsWithBackfill(
  filtered: Meal[],
  allMeals: Meal[],
  count: number
): Meal[] {
  const shuffledFiltered = shuffleArray(filtered);
  if (shuffledFiltered.length >= count) {
    return shuffledFiltered.slice(0, count);
  }
  const selected = [...shuffledFiltered];
  const selectedIds = new Set(selected.map((m) => m.id));
  const remaining = shuffleArray(
    allMeals.filter((m) => !selectedIds.has(m.id))
  );
  for (const meal of remaining) {
    if (selected.length >= count) break;
    selected.push(meal);
  }
  return selected;
}

export async function getStarterMeals(userId: number): Promise<{
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
}> {
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));

  const userDietTypes = prefs?.dietTypes ?? [];

  const systemMeals = await db
    .select()
    .from(meals)
    .where(
      and(
        eq(meals.isSystemMeal, true),
        inArray(meals.categoryId, [
          BREAKFAST_CATEGORY_ID,
          LUNCH_CATEGORY_ID,
          DINNER_CATEGORY_ID,
        ])
      )
    );

  const breakfastMeals = systemMeals.filter(
    (m) => m.categoryId === BREAKFAST_CATEGORY_ID
  );
  const lunchMeals = systemMeals.filter(
    (m) => m.categoryId === LUNCH_CATEGORY_ID
  );
  const dinnerMeals = systemMeals.filter(
    (m) => m.categoryId === DINNER_CATEGORY_ID
  );

  if (userDietTypes.length > 0) {
    const filteredBreakfast = filterByDiet(breakfastMeals, userDietTypes);
    const filteredLunch = filterByDiet(lunchMeals, userDietTypes);
    const filteredDinner = filterByDiet(dinnerMeals, userDietTypes);

    return {
      breakfast: pickMealsWithBackfill(
        filteredBreakfast,
        breakfastMeals,
        MEALS_PER_CATEGORY
      ),
      lunch: pickMealsWithBackfill(
        filteredLunch,
        lunchMeals,
        MEALS_PER_CATEGORY
      ),
      dinner: pickMealsWithBackfill(
        filteredDinner,
        dinnerMeals,
        MEALS_PER_CATEGORY
      ),
    };
  }

  return {
    breakfast: shuffleArray(breakfastMeals).slice(0, MEALS_PER_CATEGORY),
    lunch: shuffleArray(lunchMeals).slice(0, MEALS_PER_CATEGORY),
    dinner: shuffleArray(dinnerMeals).slice(0, MEALS_PER_CATEGORY),
  };
}

export async function hasStarterMealsLoaded(userId: number): Promise<boolean> {
  const [user] = await db
    .select({ starterMealsLoaded: users.starterMealsLoaded })
    .from(users)
    .where(eq(users.id, userId));
  return user?.starterMealsLoaded ?? false;
}

export async function preloadStarterMeals(userId: number): Promise<number> {
  const alreadyLoaded = await hasStarterMealsLoaded(userId);
  if (alreadyLoaded) return 0;

  const starterMeals = await getStarterMeals(userId);
  const allStarter = [
    ...starterMeals.breakfast,
    ...starterMeals.lunch,
    ...starterMeals.dinner,
  ];

  await db.transaction(async (tx) => {
    for (const meal of allStarter) {
      await tx.insert(meals).values({
        userId,
        name: meal.name,
        ingredients: meal.ingredients,
        instructions: meal.instructions ?? [],
        imageUrl: meal.imageUrl ?? null,
        servings: meal.servings,
        categoryId: meal.categoryId,
        sourceUrl: meal.sourceUrl ?? null,
        isReadyMeal: meal.isReadyMeal,
        mealFormat: meal.mealFormat,
        dietTypes: meal.dietTypes,
        mealSourceType: "starter",
      });
    }
    await tx
      .update(users)
      .set({ starterMealsLoaded: true })
      .where(eq(users.id, userId));
  });

  return allStarter.length;
}
