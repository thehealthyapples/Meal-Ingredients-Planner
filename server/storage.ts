import { User, InsertUser, Meal, InsertMeal, Nutrition, InsertNutrition, ShoppingListItem, InsertShoppingListItem, MealAllergen, IngredientSwap, MealPlan, InsertMealPlan, MealPlanEntry, InsertMealPlanEntry, Diet, MealDiet, MealCategory, SupermarketLink, ProductMatch, InsertProductMatch, IngredientSource, InsertIngredientSource, NormalizedIngredient, InsertNormalizedIngredient, GroceryProduct, InsertGroceryProduct, UserPreferences, InsertUserPreferences, Additive, InsertAdditive, ProductAdditive, InsertProductAdditive, BasketItem, InsertBasketItem, MealTemplate, InsertMealTemplate, MealTemplateProduct, InsertMealTemplateProduct, PlannerWeek, PlannerDay, PlannerEntry, InsertPlannerEntry, UserStreak, UserHealthTrend, ProductHistory, InsertProductHistory, FreezerMeal, InsertFreezerMeal, MealPlanTemplate, InsertMealPlanTemplate, MealPlanTemplateItem, InsertMealPlanTemplateItem, AdminAuditLog, users, meals, nutrition, shoppingList, mealAllergens, ingredientSwaps, mealPlans, mealPlanEntries, diets, mealDiets, mealCategories, supermarketLinks, productMatches, ingredientSources, normalizedIngredients, groceryProducts, userPreferences, additives, productAdditives, basketItems, mealTemplates, mealTemplateProducts, plannerWeeks, plannerDays, plannerEntries, userStreaks, userHealthTrends, productHistory, freezerMeals, mealPlanTemplates, mealPlanTemplateItems, adminAuditLog } from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, sql, inArray, isNull, isNotNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export type MealLookupResult = {
  id: number;
  title: string;
  source: string;
  sourceUrl: string | null;
  createdAt: Date;
};

export type SafeUser = {
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  createdAt?: Date;
};

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPreference(id: number, measurementPreference: string): Promise<User | undefined>;
  getMeals(userId: number): Promise<Meal[]>;
  getMeal(id: number): Promise<Meal | undefined>;
  createMeal(userId: number, insertMeal: InsertMeal): Promise<Meal>;
  deleteMeal(id: number): Promise<void>;
  updateMeal(id: number, data: Partial<{ name: string; ingredients: string[]; instructions: string[]; servings: number }>): Promise<Meal | undefined>;
  updateMealInstructions(id: number, instructions: string[], ingredients?: string[]): Promise<Meal | undefined>;
  getNutrition(mealId: number): Promise<Nutrition | undefined>;
  getNutritionBulk(mealIds: number[]): Promise<Nutrition[]>;
  createNutrition(data: InsertNutrition): Promise<Nutrition>;
  upsertNutrition(data: InsertNutrition): Promise<Nutrition>;
  deleteNutrition(mealId: number): Promise<void>;
  getMealAllergens(mealId: number): Promise<MealAllergen[]>;
  setMealAllergens(mealId: number, allergens: string[]): Promise<MealAllergen[]>;
  deleteMealAllergens(mealId: number): Promise<void>;
  getAllSwaps(): Promise<IngredientSwap[]>;
  getShoppingListItems(userId: number): Promise<ShoppingListItem[]>;
  addShoppingListItem(userId: number, item: InsertShoppingListItem): Promise<ShoppingListItem>;
  addOrConsolidateShoppingListItem(userId: number, item: InsertShoppingListItem): Promise<ShoppingListItem>;
  updateShoppingListItemQuantity(id: number, quantity: number): Promise<ShoppingListItem | undefined>;
  updateShoppingListItem(id: number, fields: Partial<Pick<ShoppingListItem, 'productName' | 'normalizedName' | 'quantityValue' | 'unit' | 'category' | 'quantity' | 'selectedTier' | 'checked' | 'quantityInGrams' | 'ingredientId' | 'matchedProductId' | 'matchedStore' | 'matchedPrice' | 'availableStores' | 'smpRating'>>): Promise<ShoppingListItem | undefined>;
  removeShoppingListItem(id: number): Promise<void>;
  clearShoppingList(userId: number): Promise<void>;
  getMealPlans(userId: number): Promise<MealPlan[]>;
  getMealPlan(id: number): Promise<MealPlan | undefined>;
  createMealPlan(userId: number, data: InsertMealPlan): Promise<MealPlan>;
  deleteMealPlan(id: number): Promise<void>;
  getMealPlanEntries(planId: number): Promise<MealPlanEntry[]>;
  addMealPlanEntry(entry: InsertMealPlanEntry): Promise<MealPlanEntry>;
  getMealPlanEntry(id: number): Promise<MealPlanEntry | undefined>;
  removeMealPlanEntry(id: number): Promise<void>;
  getAllDiets(): Promise<Diet[]>;
  getMealDiets(mealId: number): Promise<MealDiet[]>;
  setMealDiets(mealId: number, dietIds: number[]): Promise<MealDiet[]>;
  deleteMealDiets(mealId: number): Promise<void>;
  getAllCategories(): Promise<MealCategory[]>;
  getCategory(id: number): Promise<MealCategory | undefined>;
  getCategoryByName(name: string): Promise<MealCategory | undefined>;
  getAllSupermarkets(): Promise<SupermarketLink[]>;
  getSupermarketsByCountry(country: string): Promise<SupermarketLink[]>;
  getProductMatches(shoppingListItemId: number): Promise<ProductMatch[]>;
  getProductMatchesForUser(userId: number): Promise<ProductMatch[]>;
  addProductMatch(match: InsertProductMatch): Promise<ProductMatch>;
  clearProductMatches(shoppingListItemId: number): Promise<void>;
  clearAllProductMatchesForUser(userId: number): Promise<void>;
  updateUserPriceTier(id: number, tier: string): Promise<User | undefined>;
  getIngredientSources(shoppingListItemId: number): Promise<IngredientSource[]>;
  getIngredientSourcesForUser(userId: number): Promise<IngredientSource[]>;
  addIngredientSource(source: InsertIngredientSource): Promise<IngredientSource>;
  clearIngredientSources(shoppingListItemId: number): Promise<void>;
  clearAllIngredientSourcesForUser(userId: number): Promise<void>;
  getOrCreateNormalizedIngredient(name: string, normalizedName: string, category: string): Promise<NormalizedIngredient>;
  getNormalizedIngredient(id: number): Promise<NormalizedIngredient | undefined>;
  getNormalizedIngredientByName(normalizedName: string): Promise<NormalizedIngredient | undefined>;
  addGroceryProduct(product: InsertGroceryProduct): Promise<GroceryProduct>;
  getGroceryProducts(ingredientName: string): Promise<GroceryProduct[]>;
  getGroceryProduct(id: number): Promise<GroceryProduct | undefined>;
  clearGroceryProductsForIngredient(ingredientName: string): Promise<void>;
  updateShoppingListItemMatch(id: number, fields: { matchedProductId?: string | null; matchedStore?: string | null; matchedPrice?: number | null }): Promise<ShoppingListItem | undefined>;
  toggleShoppingListItemChecked(id: number, checked: boolean): Promise<ShoppingListItem | undefined>;
  batchUpdateShoppingListStore(userId: number, store: string | null): Promise<void>;
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: number, prefs: InsertUserPreferences): Promise<UserPreferences>;
  updateUserProfile(id: number, fields: Partial<Pick<User, 'displayName' | 'profilePhotoUrl' | 'dietPattern' | 'dietRestrictions' | 'eatingSchedule'>>): Promise<User | undefined>;
  completeOnboarding(userId: number): Promise<User | undefined>;
  getAllAdditives(): Promise<Additive[]>;
  getAdditiveByName(name: string): Promise<Additive | undefined>;
  getProductAdditives(productBarcode: string): Promise<ProductAdditive[]>;
  addProductAdditive(pa: InsertProductAdditive): Promise<ProductAdditive>;
  clearProductAdditives(productBarcode: string): Promise<void>;
  getBasketItems(userId: number): Promise<BasketItem[]>;
  addBasketItem(userId: number, mealId: number, quantity: number): Promise<BasketItem>;
  updateBasketItemQuantity(id: number, quantity: number): Promise<BasketItem | undefined>;
  removeBasketItem(id: number): Promise<void>;
  clearBasket(userId: number): Promise<void>;
  getMealTemplates(): Promise<MealTemplate[]>;
  getMealTemplate(id: number): Promise<MealTemplate | undefined>;
  getMealTemplateByName(name: string): Promise<MealTemplate | undefined>;
  createMealTemplate(data: InsertMealTemplate): Promise<MealTemplate>;
  updateMealTemplate(id: number, data: Partial<InsertMealTemplate>): Promise<MealTemplate | undefined>;
  deleteMealTemplate(id: number): Promise<void>;
  getMealTemplateProducts(mealTemplateId: number): Promise<MealTemplateProduct[]>;
  addMealTemplateProduct(data: InsertMealTemplateProduct): Promise<MealTemplateProduct>;
  removeMealTemplateProduct(id: number): Promise<void>;
  getMealsForTemplate(mealTemplateId: number): Promise<Meal[]>;
  updateMealTemplateId(mealId: number, mealTemplateId: number): Promise<Meal | undefined>;
  updateMealSourceType(mealId: number, sourceType: string): Promise<Meal | undefined>;
  getPlannerWeeks(userId: number): Promise<PlannerWeek[]>;
  getPlannerWeek(id: number): Promise<PlannerWeek | undefined>;
  createPlannerWeeks(userId: number): Promise<PlannerWeek[]>;
  renamePlannerWeek(id: number, weekName: string): Promise<PlannerWeek | undefined>;
  deletePlannerWeeks(userId: number): Promise<void>;
  getPlannerDays(weekId: number): Promise<PlannerDay[]>;
  getPlannerDay(id: number): Promise<PlannerDay | undefined>;
  getPlannerEntriesForDay(dayId: number): Promise<PlannerEntry[]>;
  getPlannerEntriesByDayIds(dayIds: number[]): Promise<PlannerEntry[]>;
  upsertPlannerEntry(dayId: number, mealType: string, audience: string, mealId: number | null, calories?: number, isDrink?: boolean, drinkType?: string | null): Promise<PlannerEntry | null>;
  deletePlannerEntry(id: number): Promise<void>;
  addPlannerEntry(dayId: number, mealType: string, audience: string, mealId: number, position?: number, calories?: number, isDrink?: boolean, drinkType?: string | null): Promise<PlannerEntry>;
  updatePlannerEntryPosition(id: number, position: number): Promise<PlannerEntry | undefined>;
  getPlannerEntryById(id: number): Promise<PlannerEntry | undefined>;
  getPlannerEntriesForWeek(weekId: number): Promise<PlannerEntry[]>;
  getSystemMeals(): Promise<Meal[]>;
  getSystemMealByName(name: string): Promise<Meal | undefined>;
  getUserStreak(userId: number): Promise<UserStreak | undefined>;
  upsertUserStreak(userId: number, data: Partial<UserStreak>): Promise<UserStreak>;
  getUserHealthTrends(userId: number, days: number): Promise<UserHealthTrend[]>;
  upsertUserHealthTrend(userId: number, date: string, smpRating: number, isElite: boolean, isProcessed: boolean): Promise<UserHealthTrend>;
  addProductHistory(userId: number, data: InsertProductHistory): Promise<ProductHistory>;
  getProductHistory(userId: number, limit?: number): Promise<ProductHistory[]>;
  deleteProductHistory(userId: number, id: number): Promise<void>;
  clearProductHistory(userId: number): Promise<void>;
  getFreezerMeals(userId: number): Promise<FreezerMeal[]>;
  getFreezerMeal(id: number): Promise<FreezerMeal | undefined>;
  getFreezerMealsByMealId(userId: number, mealId: number): Promise<FreezerMeal[]>;
  addFreezerMeal(userId: number, data: InsertFreezerMeal): Promise<FreezerMeal>;
  updateFreezerMealPortions(id: number, remainingPortions: number): Promise<FreezerMeal | undefined>;
  useFreezerMealPortion(id: number): Promise<FreezerMeal | undefined>;
  deleteFreezerMeal(id: number): Promise<void>;
  updateMealFreezerEligible(mealId: number, eligible: boolean): Promise<Meal | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  setEmailVerificationToken(userId: number, token: string, expires: Date): Promise<void>;
  markEmailVerified(userId: number): Promise<void>;
  setPasswordResetToken(userId: number, token: string, expires: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updatePassword(userId: number, hashedPassword: string): Promise<void>;
  clearPasswordResetToken(userId: number): Promise<void>;

  // ── Meal Lookup ───────────────────────────────────────────────────────────────
  lookupMeals(query: string): Promise<MealLookupResult[]>;

  // ── Meal Plan Templates ──────────────────────────────────────────────────────
  createOrUpdateTemplate(name: string, description: string | null, isDefault: boolean): Promise<MealPlanTemplate>;
  upsertTemplateItemsBulk(templateId: string, items: Omit<InsertMealPlanTemplateItem, "templateId">[]): Promise<MealPlanTemplateItem[]>;
  getTemplateWithItems(id: string): Promise<(MealPlanTemplate & { items: MealPlanTemplateItem[] }) | undefined>;
  getDefaultTemplate(): Promise<(MealPlanTemplate & { items: MealPlanTemplateItem[] }) | undefined>;
  listTemplates(): Promise<MealPlanTemplate[]>;
  getPublishedGlobalTemplates(tier: string): Promise<(MealPlanTemplate & { itemCount: number })[]>;
  getAllGlobalTemplatesAdmin(): Promise<(MealPlanTemplate & { itemCount: number })[]>;
  getUserPrivateTemplates(userId: number): Promise<(MealPlanTemplate & { itemCount: number })[]>;
  countUserPrivateTemplates(userId: number): Promise<number>;
  createGlobalTemplate(data: { name: string; season?: string; description?: string; createdBy: number }): Promise<MealPlanTemplate>;
  createPrivateTemplate(userId: number, data: { name: string; season?: string; description?: string }): Promise<MealPlanTemplate>;
  updateTemplateMetadata(id: string, data: Partial<{ name: string; season: string; description: string }>): Promise<MealPlanTemplate>;
  setGlobalTemplateStatus(id: string, status: "draft" | "published" | "archived", publishedAt?: Date | null): Promise<MealPlanTemplate>;
  deletePrivateTemplate(id: string, userId: number): Promise<void>;
  snapshotPlannerToTemplate(templateId: string, userId: number): Promise<{ itemCount: number }>;
  importTemplateItems(userId: number, templateId: string, scope: { type: "all" | "week" | "day" | "meal"; weekNumber?: number; dayOfWeek?: number; mealSlot?: string }, mode: "replace" | "keep"): Promise<{ createdCount: number; updatedCount: number; skippedCount: number }>;
  getMealsExport(source?: "web" | "custom" | "all"): Promise<{ id: number; name: string; mealSourceType: string; sourceUrl: string | null; userId: number; createdAt: Date }[]>;

  // ── Template Sharing ─────────────────────────────────────────────────────────
  sharePlanTemplate(templateId: string, userId: number): Promise<string>;
  unsharePlanTemplate(templateId: string, userId: number): Promise<void>;
  getSharedTemplate(token: string): Promise<{ template: MealPlanTemplate; items: MealPlanTemplateItem[] } | null>;
  countSharedTemplates(userId: number): Promise<number>;

  // ── Admin User Management ────────────────────────────────────────────────────
  searchUsers(query: string, limit: number, offset: number): Promise<{ users: SafeUser[]; total: number }>;
  setUserSubscriptionTier(userId: number, tier: "free" | "premium" | "friends_family"): Promise<SafeUser>;
  createAuditLog(entry: { adminUserId: number; action: string; targetUserId?: number; metadata?: object }): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      ) WITH (OIDS=FALSE);
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `).catch(() => {});

    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: false,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`lower(${users.username}) = lower(${username})`);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPreference(id: number, measurementPreference: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ measurementPreference }).where(eq(users.id, id)).returning();
    return user;
  }

  async getMeals(userId: number): Promise<Meal[]> {
    return await db.select().from(meals).where(eq(meals.userId, userId));
  }

  async getMeal(id: number): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, id));
    return meal;
  }

  async createMeal(userId: number, insertMeal: InsertMeal): Promise<Meal> {
    const [meal] = await db
      .insert(meals)
      .values({ ...insertMeal, userId })
      .returning();
    return meal;
  }

  async updateMeal(id: number, data: Partial<{ name: string; ingredients: string[]; instructions: string[]; servings: number }>): Promise<Meal | undefined> {
    const [meal] = await db.update(meals).set(data).where(eq(meals.id, id)).returning();
    return meal;
  }

  async updateMealInstructions(id: number, instructions: string[], ingredients?: string[]): Promise<Meal | undefined> {
    const updateData: any = { instructions };
    if (ingredients) {
      updateData.ingredients = ingredients;
    }
    const [meal] = await db.update(meals).set(updateData).where(eq(meals.id, id)).returning();
    return meal;
  }

  async deleteMeal(id: number): Promise<void> {
    await db.delete(nutrition).where(eq(nutrition.mealId, id));
    await db.delete(mealAllergens).where(eq(mealAllergens.mealId, id));
    await db.delete(mealDiets).where(eq(mealDiets.mealId, id));
    await db.delete(mealPlanEntries).where(eq(mealPlanEntries.mealId, id));
    await db.delete(meals).where(eq(meals.id, id));
  }

  async getNutrition(mealId: number): Promise<Nutrition | undefined> {
    const [n] = await db.select().from(nutrition).where(eq(nutrition.mealId, mealId));
    return n;
  }

  async createNutrition(data: InsertNutrition): Promise<Nutrition> {
    const [n] = await db.insert(nutrition).values(data).returning();
    return n;
  }

  async upsertNutrition(data: InsertNutrition): Promise<Nutrition> {
    await db.delete(nutrition).where(eq(nutrition.mealId, data.mealId));
    const [n] = await db.insert(nutrition).values(data).returning();
    return n;
  }

  async deleteNutrition(mealId: number): Promise<void> {
    await db.delete(nutrition).where(eq(nutrition.mealId, mealId));
  }

  async getNutritionBulk(mealIds: number[]): Promise<Nutrition[]> {
    if (mealIds.length === 0) return [];
    return await db.select().from(nutrition).where(inArray(nutrition.mealId, mealIds));
  }

  async getMealAllergens(mealId: number): Promise<MealAllergen[]> {
    return await db.select().from(mealAllergens).where(eq(mealAllergens.mealId, mealId));
  }

  async setMealAllergens(mealId: number, allergens: string[]): Promise<MealAllergen[]> {
    await db.delete(mealAllergens).where(eq(mealAllergens.mealId, mealId));
    if (allergens.length === 0) return [];
    const values = allergens.map(a => ({ mealId, allergen: a }));
    return await db.insert(mealAllergens).values(values).returning();
  }

  async deleteMealAllergens(mealId: number): Promise<void> {
    await db.delete(mealAllergens).where(eq(mealAllergens.mealId, mealId));
  }

  async getAllSwaps(): Promise<IngredientSwap[]> {
    return await db.select().from(ingredientSwaps);
  }

  async getShoppingListItems(userId: number): Promise<ShoppingListItem[]> {
    return await db.select().from(shoppingList).where(eq(shoppingList.userId, userId));
  }

  async addShoppingListItem(userId: number, item: InsertShoppingListItem): Promise<ShoppingListItem> {
    const [result] = await db.insert(shoppingList).values({ ...item, userId }).returning();
    return result;
  }

  async addOrConsolidateShoppingListItem(userId: number, item: InsertShoppingListItem): Promise<ShoppingListItem> {
    if (item.normalizedName && item.unit) {
      const existing = await db.select().from(shoppingList).where(
        and(
          eq(shoppingList.userId, userId),
          eq(shoppingList.normalizedName, item.normalizedName),
          eq(shoppingList.unit, item.unit)
        )
      );
      if (existing.length > 0) {
        const existingItem = existing[0];
        const newQty = (existingItem.quantityValue || 0) + (item.quantityValue || 0);
        const newGrams = item.quantityInGrams
          ? (existingItem.quantityInGrams || 0) + item.quantityInGrams
          : existingItem.quantityInGrams;
        const [result] = await db.update(shoppingList)
          .set({ quantityValue: newQty, quantityInGrams: newGrams })
          .where(eq(shoppingList.id, existingItem.id))
          .returning();
        return result;
      }
    }
    const [result] = await db.insert(shoppingList).values({ ...item, userId }).returning();
    return result;
  }

  async updateShoppingListItemQuantity(id: number, quantity: number): Promise<ShoppingListItem | undefined> {
    const [result] = await db.update(shoppingList).set({ quantity }).where(eq(shoppingList.id, id)).returning();
    return result;
  }

  async updateShoppingListItem(id: number, fields: Partial<Pick<ShoppingListItem, 'productName' | 'normalizedName' | 'quantityValue' | 'unit' | 'quantityInGrams' | 'category' | 'quantity' | 'selectedTier' | 'checked' | 'ingredientId' | 'matchedProductId' | 'matchedStore' | 'matchedPrice' | 'availableStores' | 'smpRating'>>): Promise<ShoppingListItem | undefined> {
    const [result] = await db.update(shoppingList).set(fields).where(eq(shoppingList.id, id)).returning();
    return result;
  }

  async removeShoppingListItem(id: number): Promise<void> {
    await db.delete(ingredientSources).where(eq(ingredientSources.shoppingListItemId, id));
    await db.delete(productMatches).where(eq(productMatches.shoppingListItemId, id));
    await db.delete(shoppingList).where(eq(shoppingList.id, id));
  }

  async clearShoppingList(userId: number): Promise<void> {
    await this.clearAllIngredientSourcesForUser(userId);
    await this.clearAllProductMatchesForUser(userId);
    await db.delete(shoppingList).where(eq(shoppingList.userId, userId));
  }

  async getMealPlans(userId: number): Promise<MealPlan[]> {
    return await db.select().from(mealPlans).where(eq(mealPlans.userId, userId));
  }

  async getMealPlan(id: number): Promise<MealPlan | undefined> {
    const [plan] = await db.select().from(mealPlans).where(eq(mealPlans.id, id));
    return plan;
  }

  async createMealPlan(userId: number, data: InsertMealPlan): Promise<MealPlan> {
    const [plan] = await db.insert(mealPlans).values({ ...data, userId }).returning();
    return plan;
  }

  async deleteMealPlan(id: number): Promise<void> {
    await db.delete(mealPlanEntries).where(eq(mealPlanEntries.planId, id));
    await db.delete(mealPlans).where(eq(mealPlans.id, id));
  }

  async getMealPlanEntries(planId: number): Promise<MealPlanEntry[]> {
    return await db.select().from(mealPlanEntries).where(eq(mealPlanEntries.planId, planId));
  }

  async addMealPlanEntry(entry: InsertMealPlanEntry): Promise<MealPlanEntry> {
    const [result] = await db.insert(mealPlanEntries).values(entry).returning();
    return result;
  }

  async getMealPlanEntry(id: number): Promise<MealPlanEntry | undefined> {
    const [entry] = await db.select().from(mealPlanEntries).where(eq(mealPlanEntries.id, id));
    return entry;
  }

  async removeMealPlanEntry(id: number): Promise<void> {
    await db.delete(mealPlanEntries).where(eq(mealPlanEntries.id, id));
  }

  async getAllDiets(): Promise<Diet[]> {
    return await db.select().from(diets);
  }

  async getMealDiets(mealId: number): Promise<MealDiet[]> {
    return await db.select().from(mealDiets).where(eq(mealDiets.mealId, mealId));
  }

  async setMealDiets(mealId: number, dietIds: number[]): Promise<MealDiet[]> {
    await db.delete(mealDiets).where(eq(mealDiets.mealId, mealId));
    if (dietIds.length === 0) return [];
    const values = dietIds.map(dietId => ({ mealId, dietId }));
    return await db.insert(mealDiets).values(values).returning();
  }

  async deleteMealDiets(mealId: number): Promise<void> {
    await db.delete(mealDiets).where(eq(mealDiets.mealId, mealId));
  }

  async getAllCategories(): Promise<MealCategory[]> {
    return await db.select().from(mealCategories);
  }

  async getCategory(id: number): Promise<MealCategory | undefined> {
    const [cat] = await db.select().from(mealCategories).where(eq(mealCategories.id, id));
    return cat;
  }

  async getCategoryByName(name: string): Promise<MealCategory | undefined> {
    const [cat] = await db.select().from(mealCategories).where(eq(mealCategories.name, name));
    return cat;
  }

  async getAllSupermarkets(): Promise<SupermarketLink[]> {
    return await db.select().from(supermarketLinks);
  }

  async getSupermarketsByCountry(country: string): Promise<SupermarketLink[]> {
    return await db.select().from(supermarketLinks).where(eq(supermarketLinks.country, country));
  }

  async getProductMatches(shoppingListItemId: number): Promise<ProductMatch[]> {
    return await db.select().from(productMatches).where(eq(productMatches.shoppingListItemId, shoppingListItemId));
  }

  async getProductMatchesForUser(userId: number): Promise<ProductMatch[]> {
    const items = await db.select().from(shoppingList).where(eq(shoppingList.userId, userId));
    if (items.length === 0) return [];
    const itemIds = items.map(i => i.id);
    const allMatches: ProductMatch[] = [];
    for (const id of itemIds) {
      const matches = await db.select().from(productMatches).where(eq(productMatches.shoppingListItemId, id));
      allMatches.push(...matches);
    }
    return allMatches;
  }

  async addProductMatch(match: InsertProductMatch): Promise<ProductMatch> {
    const [result] = await db.insert(productMatches).values(match).returning();
    return result;
  }

  async clearProductMatches(shoppingListItemId: number): Promise<void> {
    await db.delete(productMatches).where(eq(productMatches.shoppingListItemId, shoppingListItemId));
  }

  async clearAllProductMatchesForUser(userId: number): Promise<void> {
    const items = await db.select().from(shoppingList).where(eq(shoppingList.userId, userId));
    for (const item of items) {
      await db.delete(productMatches).where(eq(productMatches.shoppingListItemId, item.id));
    }
  }

  async updateUserPriceTier(id: number, tier: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ preferredPriceTier: tier }).where(eq(users.id, id)).returning();
    return user;
  }

  async getIngredientSources(shoppingListItemId: number): Promise<IngredientSource[]> {
    return await db.select().from(ingredientSources).where(eq(ingredientSources.shoppingListItemId, shoppingListItemId));
  }

  async getIngredientSourcesForUser(userId: number): Promise<IngredientSource[]> {
    const items = await db.select().from(shoppingList).where(eq(shoppingList.userId, userId));
    if (items.length === 0) return [];
    const allSources: IngredientSource[] = [];
    for (const item of items) {
      const sources = await db.select().from(ingredientSources).where(eq(ingredientSources.shoppingListItemId, item.id));
      allSources.push(...sources);
    }
    return allSources;
  }

  async addIngredientSource(source: InsertIngredientSource): Promise<IngredientSource> {
    const existing = await db.select().from(ingredientSources).where(
      and(
        eq(ingredientSources.shoppingListItemId, source.shoppingListItemId),
        eq(ingredientSources.mealId, source.mealId)
      )
    );
    if (existing.length > 0) {
      const [updated] = await db.update(ingredientSources)
        .set({ quantityMultiplier: source.quantityMultiplier })
        .where(eq(ingredientSources.id, existing[0].id))
        .returning();
      return updated;
    }
    const [result] = await db.insert(ingredientSources).values(source).returning();
    return result;
  }

  async clearIngredientSources(shoppingListItemId: number): Promise<void> {
    await db.delete(ingredientSources).where(eq(ingredientSources.shoppingListItemId, shoppingListItemId));
  }

  async clearAllIngredientSourcesForUser(userId: number): Promise<void> {
    const items = await db.select().from(shoppingList).where(eq(shoppingList.userId, userId));
    for (const item of items) {
      await db.delete(ingredientSources).where(eq(ingredientSources.shoppingListItemId, item.id));
    }
  }

  async getOrCreateNormalizedIngredient(name: string, normalizedName: string, category: string): Promise<NormalizedIngredient> {
    const [existing] = await db.select().from(normalizedIngredients).where(eq(normalizedIngredients.normalizedName, normalizedName));
    if (existing) return existing;
    const [created] = await db.insert(normalizedIngredients).values({ name, normalizedName, category }).returning();
    return created;
  }

  async getNormalizedIngredient(id: number): Promise<NormalizedIngredient | undefined> {
    const [result] = await db.select().from(normalizedIngredients).where(eq(normalizedIngredients.id, id));
    return result;
  }

  async getNormalizedIngredientByName(normalizedName: string): Promise<NormalizedIngredient | undefined> {
    const [result] = await db.select().from(normalizedIngredients).where(eq(normalizedIngredients.normalizedName, normalizedName));
    return result;
  }

  async addGroceryProduct(product: InsertGroceryProduct): Promise<GroceryProduct> {
    const [result] = await db.insert(groceryProducts).values(product).returning();
    return result;
  }

  async getGroceryProducts(ingredientName: string): Promise<GroceryProduct[]> {
    return await db.select().from(groceryProducts).where(eq(groceryProducts.ingredientName, ingredientName));
  }

  async getGroceryProduct(id: number): Promise<GroceryProduct | undefined> {
    const [result] = await db.select().from(groceryProducts).where(eq(groceryProducts.id, id));
    return result;
  }

  async clearGroceryProductsForIngredient(ingredientName: string): Promise<void> {
    await db.delete(groceryProducts).where(eq(groceryProducts.ingredientName, ingredientName));
  }

  async updateShoppingListItemMatch(id: number, fields: { matchedProductId?: string | null; matchedStore?: string | null; matchedPrice?: number | null }): Promise<ShoppingListItem | undefined> {
    const [result] = await db.update(shoppingList).set(fields).where(eq(shoppingList.id, id)).returning();
    return result;
  }

  async toggleShoppingListItemChecked(id: number, checked: boolean): Promise<ShoppingListItem | undefined> {
    const [result] = await db.update(shoppingList).set({ checked }).where(eq(shoppingList.id, id)).returning();
    return result;
  }

  async batchUpdateShoppingListStore(userId: number, store: string | null): Promise<void> {
    await db.update(shoppingList).set({ selectedStore: store }).where(eq(shoppingList.userId, userId));
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [result] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return result;
  }

  async upsertUserPreferences(userId: number, prefs: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    if (existing) {
      const [result] = await db.update(userPreferences).set(prefs).where(eq(userPreferences.userId, userId)).returning();
      return result;
    }
    const [result] = await db.insert(userPreferences).values({ ...prefs, userId }).returning();
    return result;
  }

  async updateUserProfile(id: number, fields: Partial<Pick<User, 'displayName' | 'profilePhotoUrl' | 'dietPattern' | 'dietRestrictions' | 'eatingSchedule'>>): Promise<User | undefined> {
    const [result] = await db.update(users).set(fields).where(eq(users.id, id)).returning();
    return result;
  }

  async completeOnboarding(userId: number): Promise<User | undefined> {
    const [result] = await db.update(users).set({ onboardingCompleted: true }).where(eq(users.id, userId)).returning();
    return result;
  }

  async getAllAdditives(): Promise<Additive[]> {
    return db.select().from(additives);
  }

  async getAdditiveByName(name: string): Promise<Additive | undefined> {
    const [result] = await db.select().from(additives).where(eq(additives.name, name));
    return result;
  }

  async getProductAdditives(productBarcode: string): Promise<ProductAdditive[]> {
    return db.select().from(productAdditives).where(eq(productAdditives.productBarcode, productBarcode));
  }

  async addProductAdditive(pa: InsertProductAdditive): Promise<ProductAdditive> {
    const [result] = await db.insert(productAdditives).values(pa).returning();
    return result;
  }

  async clearProductAdditives(productBarcode: string): Promise<void> {
    await db.delete(productAdditives).where(eq(productAdditives.productBarcode, productBarcode));
  }

  async getBasketItems(userId: number): Promise<BasketItem[]> {
    return db.select().from(basketItems).where(eq(basketItems.userId, userId));
  }

  async addBasketItem(userId: number, mealId: number, quantity: number): Promise<BasketItem> {
    const existing = await db.select().from(basketItems)
      .where(and(eq(basketItems.userId, userId), eq(basketItems.mealId, mealId)));
    if (existing.length > 0) {
      const [result] = await db.update(basketItems)
        .set({ quantity: existing[0].quantity + quantity })
        .where(eq(basketItems.id, existing[0].id))
        .returning();
      return result;
    }
    const [result] = await db.insert(basketItems).values({ userId, mealId, quantity }).returning();
    return result;
  }

  async updateBasketItemQuantity(id: number, quantity: number): Promise<BasketItem | undefined> {
    if (quantity <= 0) {
      await db.delete(basketItems).where(eq(basketItems.id, id));
      return undefined;
    }
    const [result] = await db.update(basketItems).set({ quantity }).where(eq(basketItems.id, id)).returning();
    return result;
  }

  async removeBasketItem(id: number): Promise<void> {
    await db.delete(basketItems).where(eq(basketItems.id, id));
  }

  async clearBasket(userId: number): Promise<void> {
    await db.delete(basketItems).where(eq(basketItems.userId, userId));
  }

  async getMealTemplates(): Promise<MealTemplate[]> {
    return db.select().from(mealTemplates);
  }

  async getMealTemplate(id: number): Promise<MealTemplate | undefined> {
    const [result] = await db.select().from(mealTemplates).where(eq(mealTemplates.id, id));
    return result;
  }

  async getMealTemplateByName(name: string): Promise<MealTemplate | undefined> {
    const [result] = await db.select().from(mealTemplates).where(ilike(mealTemplates.name, name));
    return result;
  }

  async createMealTemplate(data: InsertMealTemplate): Promise<MealTemplate> {
    const [result] = await db.insert(mealTemplates).values(data).returning();
    return result;
  }

  async updateMealTemplate(id: number, data: Partial<InsertMealTemplate>): Promise<MealTemplate | undefined> {
    const [result] = await db.update(mealTemplates).set(data).where(eq(mealTemplates.id, id)).returning();
    return result;
  }

  async deleteMealTemplate(id: number): Promise<void> {
    await db.delete(mealTemplateProducts).where(eq(mealTemplateProducts.mealTemplateId, id));
    await db.delete(mealTemplates).where(eq(mealTemplates.id, id));
  }

  async getMealTemplateProducts(mealTemplateId: number): Promise<MealTemplateProduct[]> {
    return db.select().from(mealTemplateProducts).where(eq(mealTemplateProducts.mealTemplateId, mealTemplateId));
  }

  async addMealTemplateProduct(data: InsertMealTemplateProduct): Promise<MealTemplateProduct> {
    const [result] = await db.insert(mealTemplateProducts).values(data).returning();
    return result;
  }

  async removeMealTemplateProduct(id: number): Promise<void> {
    await db.delete(mealTemplateProducts).where(eq(mealTemplateProducts.id, id));
  }

  async getMealsForTemplate(mealTemplateId: number): Promise<Meal[]> {
    return db.select().from(meals).where(eq(meals.mealTemplateId, mealTemplateId));
  }

  async updateMealTemplateId(mealId: number, mealTemplateId: number): Promise<Meal | undefined> {
    const [result] = await db.update(meals).set({ mealTemplateId }).where(eq(meals.id, mealId)).returning();
    return result;
  }

  async updateMealSourceType(mealId: number, sourceType: string): Promise<Meal | undefined> {
    const [result] = await db.update(meals).set({ mealSourceType: sourceType }).where(eq(meals.id, mealId)).returning();
    return result;
  }

  async getSystemMeals(): Promise<Meal[]> {
    return await db.select().from(meals).where(eq(meals.isSystemMeal, true));
  }

  async getSystemMealByName(name: string): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(and(eq(meals.isSystemMeal, true), eq(meals.name, name)));
    return meal;
  }

  async getPlannerWeeks(userId: number): Promise<PlannerWeek[]> {
    return await db.select().from(plannerWeeks).where(eq(plannerWeeks.userId, userId)).orderBy(plannerWeeks.weekNumber);
  }

  async getPlannerWeek(id: number): Promise<PlannerWeek | undefined> {
    const [result] = await db.select().from(plannerWeeks).where(eq(plannerWeeks.id, id));
    return result;
  }

  async createPlannerWeeks(userId: number): Promise<PlannerWeek[]> {
    const existing = await this.getPlannerWeeks(userId);
    if (existing.length > 0) return existing;

    try {
      const weeks: PlannerWeek[] = [];
      await db.transaction(async (tx) => {
        for (let w = 1; w <= 6; w++) {
          const [week] = await tx.insert(plannerWeeks).values({
            userId,
            weekNumber: w,
            weekName: `Week ${w}`,
          }).returning();
          for (let d = 0; d < 7; d++) {
            await tx.insert(plannerDays).values({
              weekId: week.id,
              dayOfWeek: d,
            });
          }
          weeks.push(week);
        }
      });
      return weeks;
    } catch (err: any) {
      if (err?.code === '23505') {
        const retried = await this.getPlannerWeeks(userId);
        if (retried.length > 0) return retried;
      }
      throw err;
    }
  }

  async renamePlannerWeek(id: number, weekName: string): Promise<PlannerWeek | undefined> {
    const [result] = await db.update(plannerWeeks).set({ weekName }).where(eq(plannerWeeks.id, id)).returning();
    return result;
  }

  async deletePlannerWeeks(userId: number): Promise<void> {
    const userWeeks = await db.select().from(plannerWeeks).where(eq(plannerWeeks.userId, userId));
    for (const week of userWeeks) {
      await db.delete(plannerDays).where(eq(plannerDays.weekId, week.id));
    }
    await db.delete(plannerWeeks).where(eq(plannerWeeks.userId, userId));
  }

  async getPlannerDays(weekId: number): Promise<PlannerDay[]> {
    return await db.select().from(plannerDays).where(eq(plannerDays.weekId, weekId)).orderBy(plannerDays.dayOfWeek);
  }

  async getPlannerDay(id: number): Promise<PlannerDay | undefined> {
    const [result] = await db.select().from(plannerDays).where(eq(plannerDays.id, id));
    return result;
  }

  async getPlannerEntriesForDay(dayId: number): Promise<PlannerEntry[]> {
    return await db.select().from(plannerEntries).where(eq(plannerEntries.dayId, dayId));
  }

  async getPlannerEntriesByDayIds(dayIds: number[]): Promise<PlannerEntry[]> {
    if (dayIds.length === 0) return [];
    return await db.select().from(plannerEntries).where(inArray(plannerEntries.dayId, dayIds));
  }

  async upsertPlannerEntry(dayId: number, mealType: string, audience: string, mealId: number | null, calories: number = 0, isDrink: boolean = false, drinkType: string | null = null): Promise<PlannerEntry | null> {
    if (mealId === null) {
      await db.delete(plannerEntries).where(
        and(
          eq(plannerEntries.dayId, dayId),
          eq(plannerEntries.mealType, mealType),
          eq(plannerEntries.audience, audience),
          eq(plannerEntries.isDrink, isDrink),
        )
      );
      return null;
    }
    const existing = await db.select().from(plannerEntries).where(
      and(
        eq(plannerEntries.dayId, dayId),
        eq(plannerEntries.mealType, mealType),
        eq(plannerEntries.audience, audience),
        eq(plannerEntries.isDrink, isDrink),
      )
    );
    if (existing.length > 0) {
      const [result] = await db.update(plannerEntries)
        .set({ mealId, calories, drinkType })
        .where(eq(plannerEntries.id, existing[0].id))
        .returning();
      return result;
    }
    const [result] = await db.insert(plannerEntries).values({
      dayId, mealType, audience, mealId, calories, isDrink, drinkType,
    }).returning();
    return result;
  }

  async deletePlannerEntry(id: number): Promise<void> {
    await db.delete(plannerEntries).where(eq(plannerEntries.id, id));
  }

  async addPlannerEntry(dayId: number, mealType: string, audience: string, mealId: number, position: number = 0, calories: number = 0, isDrink: boolean = false, drinkType: string | null = null): Promise<PlannerEntry> {
    const [result] = await db.insert(plannerEntries).values({
      dayId, mealType, audience, mealId, position, calories, isDrink, drinkType,
    }).returning();
    return result;
  }

  async updatePlannerEntryPosition(id: number, position: number): Promise<PlannerEntry | undefined> {
    const [result] = await db.update(plannerEntries)
      .set({ position })
      .where(eq(plannerEntries.id, id))
      .returning();
    return result;
  }

  async getPlannerEntryById(id: number): Promise<PlannerEntry | undefined> {
    const [result] = await db.select().from(plannerEntries).where(eq(plannerEntries.id, id));
    return result;
  }

  async getPlannerEntriesForWeek(weekId: number): Promise<PlannerEntry[]> {
    const days = await this.getPlannerDays(weekId);
    if (days.length === 0) return [];
    const dayIds = days.map(d => d.id);
    return await db.select().from(plannerEntries).where(inArray(plannerEntries.dayId, dayIds));
  }

  async getUserStreak(userId: number): Promise<UserStreak | undefined> {
    const [result] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId));
    return result;
  }

  async upsertUserStreak(userId: number, data: Partial<UserStreak>): Promise<UserStreak> {
    const existing = await this.getUserStreak(userId);
    if (existing) {
      const [result] = await db.update(userStreaks).set(data).where(eq(userStreaks.userId, userId)).returning();
      return result;
    }
    const [result] = await db.insert(userStreaks).values({
      userId,
      currentEliteStreak: data.currentEliteStreak ?? 0,
      bestEliteStreak: data.bestEliteStreak ?? 0,
      lastEliteDate: data.lastEliteDate ?? null,
      weeklyEliteCount: data.weeklyEliteCount ?? 0,
      weekStartDate: data.weekStartDate ?? null,
    }).returning();
    return result;
  }

  async getUserHealthTrends(userId: number, days: number): Promise<UserHealthTrend[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return await db.select().from(userHealthTrends)
      .where(and(eq(userHealthTrends.userId, userId), sql`${userHealthTrends.date} >= ${cutoffStr}`))
      .orderBy(userHealthTrends.date);
  }

  async upsertUserHealthTrend(userId: number, date: string, smpRating: number, isElite: boolean, isProcessed: boolean): Promise<UserHealthTrend> {
    const [existing] = await db.select().from(userHealthTrends)
      .where(and(eq(userHealthTrends.userId, userId), eq(userHealthTrends.date, date)));
    if (existing) {
      const newSampleCount = existing.sampleCount + 1;
      const newAvg = ((existing.averageSmpRating * existing.sampleCount) + smpRating) / newSampleCount;
      const [result] = await db.update(userHealthTrends).set({
        averageSmpRating: Math.round(newAvg * 100) / 100,
        sampleCount: newSampleCount,
        eliteCount: existing.eliteCount + (isElite ? 1 : 0),
        processedCount: existing.processedCount + (isProcessed ? 1 : 0),
      }).where(eq(userHealthTrends.id, existing.id)).returning();
      return result;
    }
    const [result] = await db.insert(userHealthTrends).values({
      userId,
      date,
      averageSmpRating: smpRating,
      sampleCount: 1,
      eliteCount: isElite ? 1 : 0,
      processedCount: isProcessed ? 1 : 0,
    }).returning();
    return result;
  }
  async addProductHistory(userId: number, data: InsertProductHistory): Promise<ProductHistory> {
    if (data.barcode) {
      const [existing] = await db.select().from(productHistory)
        .where(and(eq(productHistory.userId, userId), eq(productHistory.barcode, data.barcode)));
      if (existing) {
        const [result] = await db.update(productHistory).set({
          ...data,
          scannedAt: new Date().toISOString(),
        }).where(eq(productHistory.id, existing.id)).returning();
        return result;
      }
    }
    const [result] = await db.insert(productHistory).values({
      ...data,
      userId,
    }).returning();
    return result;
  }

  async getProductHistory(userId: number, limit = 50): Promise<ProductHistory[]> {
    return await db.select().from(productHistory)
      .where(eq(productHistory.userId, userId))
      .orderBy(sql`${productHistory.scannedAt} DESC`)
      .limit(limit);
  }

  async deleteProductHistory(userId: number, id: number): Promise<void> {
    await db.delete(productHistory).where(and(eq(productHistory.id, id), eq(productHistory.userId, userId)));
  }

  async clearProductHistory(userId: number): Promise<void> {
    await db.delete(productHistory).where(eq(productHistory.userId, userId));
  }

  async getFreezerMeals(userId: number): Promise<FreezerMeal[]> {
    return await db.select().from(freezerMeals)
      .where(eq(freezerMeals.userId, userId))
      .orderBy(sql`${freezerMeals.frozenDate} DESC`);
  }

  async getFreezerMeal(id: number): Promise<FreezerMeal | undefined> {
    const [result] = await db.select().from(freezerMeals).where(eq(freezerMeals.id, id));
    return result;
  }

  async getFreezerMealsByMealId(userId: number, mealId: number): Promise<FreezerMeal[]> {
    return await db.select().from(freezerMeals)
      .where(and(eq(freezerMeals.userId, userId), eq(freezerMeals.mealId, mealId)));
  }

  async addFreezerMeal(userId: number, data: InsertFreezerMeal): Promise<FreezerMeal> {
    const [result] = await db.insert(freezerMeals).values({ ...data, userId }).returning();
    return result;
  }

  async updateFreezerMealPortions(id: number, remainingPortions: number): Promise<FreezerMeal | undefined> {
    const [result] = await db.update(freezerMeals).set({ remainingPortions }).where(eq(freezerMeals.id, id)).returning();
    return result;
  }

  async useFreezerMealPortion(id: number): Promise<FreezerMeal | undefined> {
    const existing = await this.getFreezerMeal(id);
    if (!existing || existing.remainingPortions <= 0) return undefined;
    const newPortions = existing.remainingPortions - 1;
    if (newPortions <= 0) {
      await db.delete(freezerMeals).where(eq(freezerMeals.id, id));
      return { ...existing, remainingPortions: 0 };
    }
    return await this.updateFreezerMealPortions(id, newPortions);
  }

  async deleteFreezerMeal(id: number): Promise<void> {
    await db.delete(freezerMeals).where(eq(freezerMeals.id, id));
  }

  async updateMealFreezerEligible(mealId: number, eligible: boolean): Promise<Meal | undefined> {
    const [result] = await db.update(meals).set({ isFreezerEligible: eligible }).where(eq(meals.id, mealId)).returning();
    return result;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user;
  }

  async setEmailVerificationToken(userId: number, token: string, expires: Date): Promise<void> {
    await db.update(users).set({ emailVerificationToken: token, emailVerificationExpires: expires }).where(eq(users.id, userId));
  }

  async markEmailVerified(userId: number): Promise<void> {
    await db.update(users).set({ emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null }).where(eq(users.id, userId));
  }

  async setPasswordResetToken(userId: number, token: string, expires: Date): Promise<void> {
    await db.update(users).set({ passwordResetToken: token, passwordResetExpires: expires }).where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user;
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async clearPasswordResetToken(userId: number): Promise<void> {
    await db.update(users).set({ passwordResetToken: null, passwordResetExpires: null }).where(eq(users.id, userId));
  }

  // ── Meal Lookup ───────────────────────────────────────────────────────────────

  async lookupMeals(query: string): Promise<MealLookupResult[]> {
    const q = query.trim();
    const { rows } = await pool.query<{
      id: number;
      name: string;
      meal_source_type: string;
      source_url: string | null;
      created_at: Date;
    }>(
      `SELECT id, name, meal_source_type, source_url, created_at
       FROM meals
       WHERE name ILIKE $1
       ORDER BY
         CASE WHEN lower(name) = lower($2) THEN 0 ELSE 1 END,
         id DESC
       LIMIT 20`,
      [`%${q}%`, q]
    );
    return rows.map(r => ({
      id: r.id,
      title: r.name,
      source: r.meal_source_type,
      sourceUrl: r.source_url,
      createdAt: r.created_at,
    }));
  }

  // ── Meal Plan Templates ──────────────────────────────────────────────────────

  async createOrUpdateTemplate(
    name: string,
    description: string | null,
    isDefault: boolean
  ): Promise<MealPlanTemplate> {
    if (isDefault) {
      await db
        .update(mealPlanTemplates)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(mealPlanTemplates.isDefault, true));
    }
    const existing = await db
      .select()
      .from(mealPlanTemplates)
      .where(eq(mealPlanTemplates.name, name))
      .limit(1);
    if (existing.length > 0) {
      const [updated] = await db
        .update(mealPlanTemplates)
        .set({ description, isDefault, updatedAt: new Date() })
        .where(eq(mealPlanTemplates.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(mealPlanTemplates)
      .values({ name, description, isDefault })
      .returning();
    return created;
  }

  async upsertTemplateItemsBulk(
    templateId: string,
    items: Omit<InsertMealPlanTemplateItem, "templateId">[]
  ): Promise<MealPlanTemplateItem[]> {
    if (items.length === 0) return [];
    const rows = items.map(item => ({ ...item, templateId }));
    const result = await db
      .insert(mealPlanTemplateItems)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          mealPlanTemplateItems.templateId,
          mealPlanTemplateItems.weekNumber,
          mealPlanTemplateItems.dayOfWeek,
          mealPlanTemplateItems.mealSlot,
        ],
        set: { mealId: sql`EXCLUDED.meal_id` },
      })
      .returning();
    return result;
  }

  async getTemplateWithItems(
    id: string
  ): Promise<(MealPlanTemplate & { items: MealPlanTemplateItem[] }) | undefined> {
    const [template] = await db
      .select()
      .from(mealPlanTemplates)
      .where(eq(mealPlanTemplates.id, id))
      .limit(1);
    if (!template) return undefined;
    const items = await db
      .select()
      .from(mealPlanTemplateItems)
      .where(eq(mealPlanTemplateItems.templateId, id))
      .orderBy(mealPlanTemplateItems.weekNumber, mealPlanTemplateItems.dayOfWeek, mealPlanTemplateItems.mealSlot);
    return { ...template, items };
  }

  async getDefaultTemplate(): Promise<(MealPlanTemplate & { items: MealPlanTemplateItem[] }) | undefined> {
    const [template] = await db
      .select()
      .from(mealPlanTemplates)
      .where(eq(mealPlanTemplates.isDefault, true))
      .limit(1);
    if (!template) return undefined;
    return this.getTemplateWithItems(template.id);
  }

  async listTemplates(): Promise<MealPlanTemplate[]> {
    return db
      .select()
      .from(mealPlanTemplates)
      .orderBy(mealPlanTemplates.name);
  }

  async getPublishedGlobalTemplates(tier: string): Promise<(MealPlanTemplate & { itemCount: number })[]> {
    const rows = await db
      .select({
        id: mealPlanTemplates.id,
        name: mealPlanTemplates.name,
        description: mealPlanTemplates.description,
        isDefault: mealPlanTemplates.isDefault,
        isPremium: mealPlanTemplates.isPremium,
        ownerUserId: mealPlanTemplates.ownerUserId,
        season: mealPlanTemplates.season,
        status: mealPlanTemplates.status,
        createdBy: mealPlanTemplates.createdBy,
        publishedAt: mealPlanTemplates.publishedAt,
        createdAt: mealPlanTemplates.createdAt,
        updatedAt: mealPlanTemplates.updatedAt,
        itemCount: sql<number>`(SELECT COUNT(*) FROM meal_plan_template_items WHERE template_id = meal_plan_templates.id)`.mapWith(Number),
      })
      .from(mealPlanTemplates)
      .where(
        and(
          isNull(mealPlanTemplates.ownerUserId),
          eq(mealPlanTemplates.status, "published"),
          ...(tier === "free" ? [eq(mealPlanTemplates.isPremium, false)] : []),
        )
      )
      .orderBy(mealPlanTemplates.isDefault, mealPlanTemplates.name);
    return rows;
  }

  async getAllGlobalTemplatesAdmin(): Promise<(MealPlanTemplate & { itemCount: number })[]> {
    return db
      .select({
        id: mealPlanTemplates.id,
        name: mealPlanTemplates.name,
        description: mealPlanTemplates.description,
        isDefault: mealPlanTemplates.isDefault,
        isPremium: mealPlanTemplates.isPremium,
        ownerUserId: mealPlanTemplates.ownerUserId,
        season: mealPlanTemplates.season,
        status: mealPlanTemplates.status,
        createdBy: mealPlanTemplates.createdBy,
        publishedAt: mealPlanTemplates.publishedAt,
        createdAt: mealPlanTemplates.createdAt,
        updatedAt: mealPlanTemplates.updatedAt,
        itemCount: sql<number>`(SELECT COUNT(*) FROM meal_plan_template_items WHERE template_id = meal_plan_templates.id)`.mapWith(Number),
      })
      .from(mealPlanTemplates)
      .where(isNull(mealPlanTemplates.ownerUserId))
      .orderBy(mealPlanTemplates.createdAt);
  }

  async getUserPrivateTemplates(userId: number): Promise<(MealPlanTemplate & { itemCount: number })[]> {
    return db
      .select({
        id: mealPlanTemplates.id,
        name: mealPlanTemplates.name,
        description: mealPlanTemplates.description,
        isDefault: mealPlanTemplates.isDefault,
        isPremium: mealPlanTemplates.isPremium,
        ownerUserId: mealPlanTemplates.ownerUserId,
        season: mealPlanTemplates.season,
        status: mealPlanTemplates.status,
        createdBy: mealPlanTemplates.createdBy,
        publishedAt: mealPlanTemplates.publishedAt,
        createdAt: mealPlanTemplates.createdAt,
        updatedAt: mealPlanTemplates.updatedAt,
        itemCount: sql<number>`(SELECT COUNT(*) FROM meal_plan_template_items WHERE template_id = meal_plan_templates.id)`.mapWith(Number),
      })
      .from(mealPlanTemplates)
      .where(eq(mealPlanTemplates.ownerUserId, userId))
      .orderBy(mealPlanTemplates.createdAt);
  }

  async countUserPrivateTemplates(userId: number): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(mealPlanTemplates)
      .where(eq(mealPlanTemplates.ownerUserId, userId));
    return row?.count ?? 0;
  }

  async createGlobalTemplate(data: { name: string; season?: string; description?: string; createdBy: number }): Promise<MealPlanTemplate> {
    const [row] = await db
      .insert(mealPlanTemplates)
      .values({
        name: data.name,
        description: data.description ?? null,
        season: data.season ?? null,
        status: "draft",
        createdBy: data.createdBy,
        ownerUserId: null,
        isDefault: false,
        isPremium: false,
      })
      .returning();
    return row;
  }

  async createPrivateTemplate(userId: number, data: { name: string; season?: string; description?: string }): Promise<MealPlanTemplate> {
    const [row] = await db
      .insert(mealPlanTemplates)
      .values({
        name: data.name,
        description: data.description ?? null,
        season: data.season ?? null,
        status: "draft",
        createdBy: userId,
        ownerUserId: userId,
        isDefault: false,
        isPremium: false,
      })
      .returning();
    return row;
  }

  async updateTemplateMetadata(id: string, data: Partial<{ name: string; season: string; description: string }>): Promise<MealPlanTemplate> {
    const [row] = await db
      .update(mealPlanTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mealPlanTemplates.id, id))
      .returning();
    return row;
  }

  async setGlobalTemplateStatus(id: string, status: "draft" | "published" | "archived", publishedAt?: Date | null): Promise<MealPlanTemplate> {
    const updateData: Partial<MealPlanTemplate> = { status, updatedAt: new Date() };
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt;
    const [row] = await db
      .update(mealPlanTemplates)
      .set(updateData)
      .where(and(eq(mealPlanTemplates.id, id), isNull(mealPlanTemplates.ownerUserId)))
      .returning();
    return row;
  }

  async deletePrivateTemplate(id: string, userId: number): Promise<void> {
    const [row] = await db
      .select()
      .from(mealPlanTemplates)
      .where(and(eq(mealPlanTemplates.id, id), eq(mealPlanTemplates.ownerUserId, userId)))
      .limit(1);
    if (!row) throw new Error("Template not found or not owned by user");
    await db.delete(mealPlanTemplates).where(eq(mealPlanTemplates.id, id));
  }

  async snapshotPlannerToTemplate(templateId: string, userId: number): Promise<{ itemCount: number }> {
    const weeks = await this.getPlannerWeeks(userId);
    const newItems: { templateId: string; weekNumber: number; dayOfWeek: number; mealSlot: string; mealId: number }[] = [];

    for (const week of weeks) {
      const days = await this.getPlannerDays(week.id);
      for (const day of days) {
        const entries = await this.getPlannerEntriesForDay(day.id);
        for (const entry of entries) {
          if (entry.isDrink) continue;
          const templateDay = day.dayOfWeek === 0 ? 7 : day.dayOfWeek;
          newItems.push({
            templateId,
            weekNumber: week.weekNumber,
            dayOfWeek: templateDay,
            mealSlot: entry.mealType,
            mealId: entry.mealId,
          });
        }
      }
    }

    await db.transaction(async (tx) => {
      await tx.delete(mealPlanTemplateItems).where(eq(mealPlanTemplateItems.templateId, templateId));
      if (newItems.length > 0) {
        await tx.insert(mealPlanTemplateItems).values(newItems);
      }
      await tx.update(mealPlanTemplates).set({ updatedAt: new Date() }).where(eq(mealPlanTemplates.id, templateId));
    });

    return { itemCount: newItems.length };
  }

  async importTemplateItems(
    userId: number,
    templateId: string,
    scope: { type: "all" | "week" | "day" | "meal"; weekNumber?: number; dayOfWeek?: number; mealSlot?: string },
    mode: "replace" | "keep"
  ): Promise<{ createdCount: number; updatedCount: number; skippedCount: number }> {
    let items = await db
      .select()
      .from(mealPlanTemplateItems)
      .where(eq(mealPlanTemplateItems.templateId, templateId));

    if (scope.type === "week" && scope.weekNumber !== undefined) {
      items = items.filter(i => i.weekNumber === scope.weekNumber);
    } else if (scope.type === "day" && scope.weekNumber !== undefined && scope.dayOfWeek !== undefined) {
      items = items.filter(i => i.weekNumber === scope.weekNumber && i.dayOfWeek === scope.dayOfWeek);
    } else if (scope.type === "meal" && scope.weekNumber !== undefined && scope.dayOfWeek !== undefined && scope.mealSlot) {
      items = items.filter(i => i.weekNumber === scope.weekNumber && i.dayOfWeek === scope.dayOfWeek && i.mealSlot === scope.mealSlot);
    }

    const weeks = await this.createPlannerWeeks(userId);
    const weekMap = new Map<number, number>();
    for (const week of weeks) weekMap.set(week.weekNumber, week.id);

    const allDayIds: number[] = [];
    const dayIdMap = new Map<string, number>();
    for (const week of weeks) {
      const days = await this.getPlannerDays(week.id);
      for (const day of days) {
        dayIdMap.set(`${week.weekNumber}:${day.dayOfWeek}`, day.id);
        allDayIds.push(day.id);
      }
    }

    const existingEntries = await this.getPlannerEntriesByDayIds(allDayIds);
    const occupiedSlots = new Set(existingEntries.map(e => `${e.dayId}:${e.mealType}:${e.audience}`));

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      const plannerDay = item.dayOfWeek % 7;
      const dayId = dayIdMap.get(`${item.weekNumber}:${plannerDay}`);
      if (dayId === undefined) { skippedCount++; continue; }

      const slotKey = `${dayId}:${item.mealSlot}:adult`;
      const hasExisting = occupiedSlots.has(slotKey);

      if (mode === "keep" && hasExisting) { skippedCount++; continue; }

      await this.upsertPlannerEntry(dayId, item.mealSlot, "adult", item.mealId);

      if (hasExisting) {
        updatedCount++;
      } else {
        createdCount++;
        occupiedSlots.add(slotKey);
      }
    }

    return { createdCount, updatedCount, skippedCount };
  }

  async getMealsExport(source: "web" | "custom" | "all" = "all"): Promise<{ id: number; name: string; mealSourceType: string; sourceUrl: string | null; userId: number; createdAt: Date }[]> {
    const base = db
      .select({
        id: meals.id,
        name: meals.name,
        mealSourceType: meals.mealSourceType,
        sourceUrl: meals.sourceUrl,
        userId: meals.userId,
        createdAt: meals.createdAt,
      })
      .from(meals);

    if (source === "web") {
      return base.where(isNotNull(meals.sourceUrl)).orderBy(meals.id);
    }
    if (source === "custom") {
      return base.where(and(isNull(meals.sourceUrl), eq(meals.isSystemMeal, false))).orderBy(meals.id);
    }
    return base.orderBy(meals.id);
  }

  // ── Template Sharing ─────────────────────────────────────────────────────────

  async sharePlanTemplate(templateId: string, userId: number): Promise<string> {
    const [row] = await db
      .select()
      .from(mealPlanTemplates)
      .where(and(eq(mealPlanTemplates.id, templateId), eq(mealPlanTemplates.ownerUserId, userId)))
      .limit(1);
    if (!row) throw new Error("Template not found or not owned by user");

    const token = row.shareToken ?? crypto.randomUUID();
    await db
      .update(mealPlanTemplates)
      .set({ shareToken: token, visibility: "shared", updatedAt: new Date() })
      .where(eq(mealPlanTemplates.id, templateId));
    return token;
  }

  async unsharePlanTemplate(templateId: string, userId: number): Promise<void> {
    const [row] = await db
      .select()
      .from(mealPlanTemplates)
      .where(and(eq(mealPlanTemplates.id, templateId), eq(mealPlanTemplates.ownerUserId, userId)))
      .limit(1);
    if (!row) throw new Error("Template not found or not owned by user");

    await db
      .update(mealPlanTemplates)
      .set({ shareToken: null, visibility: "private", updatedAt: new Date() })
      .where(eq(mealPlanTemplates.id, templateId));
  }

  async getSharedTemplate(token: string): Promise<{ template: MealPlanTemplate; items: MealPlanTemplateItem[] } | null> {
    const [template] = await db
      .select()
      .from(mealPlanTemplates)
      .where(and(eq(mealPlanTemplates.shareToken, token), eq(mealPlanTemplates.visibility, "shared")))
      .limit(1);
    if (!template) return null;

    const items = await db
      .select()
      .from(mealPlanTemplateItems)
      .where(eq(mealPlanTemplateItems.templateId, template.id));

    return { template, items };
  }

  async countSharedTemplates(userId: number): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(mealPlanTemplates)
      .where(and(eq(mealPlanTemplates.ownerUserId, userId), eq(mealPlanTemplates.visibility, "shared")));
    return rows[0]?.count ?? 0;
  }

  // ── Admin User Management ────────────────────────────────────────────────────

  async searchUsers(query: string, limit: number, offset: number): Promise<{ users: SafeUser[]; total: number }> {
    const safeFields = {
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
      subscriptionTier: users.subscriptionTier,
      subscriptionStatus: users.subscriptionStatus,
    };

    let baseQuery = db.select(safeFields).from(users);
    let countQuery = db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users);

    if (query) {
      const pattern = `%${query}%`;
      const condition = sql`(${users.username} ILIKE ${pattern} OR ${users.displayName} ILIKE ${pattern})`;
      baseQuery = baseQuery.where(condition) as typeof baseQuery;
      countQuery = countQuery.where(condition) as typeof countQuery;
    }

    const [rows, [{ count }]] = await Promise.all([
      baseQuery.orderBy(sql`${users.id} DESC`).limit(limit).offset(offset),
      countQuery,
    ]);

    return { users: rows, total: count };
  }

  async setUserSubscriptionTier(userId: number, tier: "free" | "premium" | "friends_family"): Promise<SafeUser> {
    const [updated] = await db
      .update(users)
      .set({ subscriptionTier: tier })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        role: users.role,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
      });
    if (!updated) throw new Error(`User ${userId} not found`);
    return updated;
  }

  async createAuditLog(entry: { adminUserId: number; action: string; targetUserId?: number; metadata?: object }): Promise<void> {
    await db.insert(adminAuditLog).values({
      adminUserId: entry.adminUserId,
      action: entry.action,
      targetUserId: entry.targetUserId ?? null,
      metadata: entry.metadata ?? null,
    });
  }
}

export const storage = new DatabaseStorage();
