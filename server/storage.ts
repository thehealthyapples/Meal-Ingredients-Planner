import { User, InsertUser, Meal, MealSummary, InsertMeal, Nutrition, InsertNutrition, ShoppingListItem, InsertShoppingListItem, MealAllergen, IngredientSwap, MealPlan, InsertMealPlan, MealPlanEntry, InsertMealPlanEntry, Diet, MealDiet, MealCategory, SupermarketLink, ProductMatch, InsertProductMatch, IngredientSource, InsertIngredientSource, NormalizedIngredient, InsertNormalizedIngredient, GroceryProduct, InsertGroceryProduct, UserPreferences, InsertUserPreferences, Additive, InsertAdditive, ProductAdditive, InsertProductAdditive, BasketItem, InsertBasketItem, MealTemplate, InsertMealTemplate, MealTemplateProduct, InsertMealTemplateProduct, PlannerWeek, PlannerDay, PlannerEntry, InsertPlannerEntry, UserStreak, UserHealthTrend, ProductHistory, InsertProductHistory, FreezerMeal, InsertFreezerMeal, MealPlanTemplate, InsertMealPlanTemplate, MealPlanTemplateItem, InsertMealPlanTemplateItem, AdminAuditLog, UserPantryItem, ShoppingListExtra, MealPairing, InsertMealPairing, IngredientProduct, InsertIngredientProduct, Household, HouseholdMember, FoodDiaryDay, FoodDiaryEntry, FoodDiaryMetrics, InsertFoodDiaryEntry, InsertFoodDiaryMetrics, users, meals, nutrition, shoppingList, mealAllergens, ingredientSwaps, mealPlans, mealPlanEntries, diets, mealDiets, mealCategories, supermarketLinks, productMatches, ingredientSources, normalizedIngredients, groceryProducts, userPreferences, additives, productAdditives, basketItems, mealTemplates, mealTemplateProducts, plannerWeeks, plannerDays, plannerEntries, userStreaks, userHealthTrends, productHistory, freezerMeals, mealPlanTemplates, mealPlanTemplateItems, adminAuditLog, userPantryItems, shoppingListExtras, mealPairings, ingredientProducts, households, householdMembers, foodDiaryDays, foodDiaryEntries, foodDiaryMetrics, foodKnowledge, FoodKnowledge, siteSettings } from "@shared/schema";
import { normalizeIngredientKey } from "@shared/normalize";
import { db } from "./db";
import { eq, and, ilike, or, sql, inArray, isNull, isNotNull } from "drizzle-orm";
import { getHouseholdForUser } from "./lib/household";
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
  createdAt?: Date | null;
  lastLoginAt?: Date | null;
};

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPreference(id: number, measurementPreference: string): Promise<User | undefined>;
  getMeals(userId: number): Promise<Meal[]>;
  getMealsSummary(userId: number): Promise<MealSummary[]>;
  getSystemMealsSummary(): Promise<MealSummary[]>;
  getMeal(id: number): Promise<Meal | undefined>;
  createMeal(userId: number, insertMeal: InsertMeal): Promise<Meal>;
  deleteMeal(id: number): Promise<void>;
  updateMeal(id: number, data: Partial<{ name: string; ingredients: string[]; instructions: string[]; servings: number; kind: string }>): Promise<Meal | undefined>;
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
  updateShoppingListItem(id: number, fields: Partial<Pick<ShoppingListItem, 'productName' | 'normalizedName' | 'quantityValue' | 'unit' | 'category' | 'quantity' | 'selectedTier' | 'checked' | 'quantityInGrams' | 'ingredientId' | 'matchedProductId' | 'matchedStore' | 'matchedPrice' | 'availableStores' | 'smpRating' | 'itemType' | 'variantSelections' | 'attributePreferences' | 'confidenceLevel' | 'confidenceReason' | 'basketLabel'>>): Promise<ShoppingListItem | undefined>;
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
  updateUserProfile(id: number, fields: Partial<Pick<User, 'firstName' | 'displayName' | 'profilePhotoUrl' | 'dietPattern' | 'dietRestrictions' | 'eatingSchedule'>>): Promise<User | undefined>;
  completeOnboarding(userId: number): Promise<User | undefined>;
  resetOnboarding(userId: number): Promise<void>;
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
  updateLastLoginAt(userId: number): Promise<void>;
  createAuditLog(entry: { adminUserId: number; action: string; targetUserId?: number; metadata?: object }): Promise<void>;
  getSiteSetting(key: string): Promise<string | null>;
  setSiteSetting(key: string, value: string): Promise<void>;

  // ── Pantry Staples ───────────────────────────────────────────────────────────
  getPantryItems(userId: number): Promise<UserPantryItem[]>;
  addPantryItem(userId: number, ingredient: string, category: string, notes?: string, displayName?: string, isDefault?: boolean): Promise<UserPantryItem>;
  deletePantryItem(userId: number, id: number): Promise<void>;
  seedDefaultHouseholdItems(userId: number): Promise<void>;
  seedDefaultFoodPantryItems(userId: number): Promise<void>;
  syncAllPantryDefaults(): Promise<void>;

  // ── Shopping List Extras ───────────────────────────────────────────────────
  getShoppingListExtras(userId: number): Promise<ShoppingListExtra[]>;
  addShoppingListExtra(userId: number, name: string, category?: string, alwaysAdd?: boolean): Promise<ShoppingListExtra>;
  updateShoppingListExtra(userId: number, id: number, fields: { alwaysAdd?: boolean; inBasket?: boolean }): Promise<ShoppingListExtra | undefined>;
  deleteShoppingListExtra(userId: number, id: number): Promise<void>;

  // ── Meal Pairings ─────────────────────────────────────────────────────────────
  getMealPairings(mealId: number): Promise<{ pairing: MealPairing; meal: Meal }[]>;
  addMealPairing(data: InsertMealPairing): Promise<MealPairing>;
  deleteMealPairing(id: number): Promise<MealPairing | undefined>;

  // ── Ingredient Products (THA Picks) ────────────────────────────────────────
  getIngredientProductsForKeys(keys: string[]): Promise<IngredientProduct[]>;
  getAllActiveIngredientProducts(): Promise<IngredientProduct[]>;
  searchIngredientProducts(query: string): Promise<IngredientProduct[]>;
  createIngredientProduct(data: InsertIngredientProduct): Promise<IngredientProduct>;
  updateIngredientProduct(id: number, data: Partial<InsertIngredientProduct>): Promise<IngredientProduct | undefined>;
  deactivateIngredientProduct(id: number): Promise<void>;

  // ── Household System ────────────────────────────────────────────────────────
  getHouseholdByUser(userId: number): Promise<{ household: Household; members: HouseholdMember[] } | null>;
  getUserHouseholdRole(userId: number): Promise<string | null>;
  createHouseholdForUser(userId: number, name: string): Promise<Household>;
  getHouseholdWithMembers(householdId: number): Promise<{ household: Household; members: { member: HouseholdMember; user: { id: number; displayName: string | null; username: string } }[] }>;
  findHouseholdByInviteCode(inviteCode: string): Promise<Household | null>;
  joinHousehold(userId: number, inviteCode: string): Promise<{ household: Household; role: string }>;
  leaveHousehold(userId: number): Promise<Household>;
  renameHousehold(userId: number, householdId: number, name: string): Promise<Household>;
  removeHouseholdMember(actorUserId: number, targetUserId: number): Promise<{ member: HouseholdMember; user: { id: number; displayName: string | null; username: string } }[]>;

  // ── Basket Attribution ───────────────────────────────────────────────────────
  getShoppingListItemsWithAttribution(userId: number): Promise<ShoppingListItemWithAttribution[]>;
  getBasketMealIds(userId: number): Promise<number[]>;
  getHouseholdDietaryContext(userId: number): Promise<HouseholdDietaryContext>;

  // ── My Diary ─────────────────────────────────────────────────────────────────
  getFoodDiaryDay(userId: number, date: string): Promise<FoodDiaryDay | null>;
  getOrCreateFoodDiaryDay(userId: number, date: string): Promise<FoodDiaryDay>;
  getFoodDiaryEntries(userId: number, date: string): Promise<FoodDiaryEntry[]>;
  createFoodDiaryEntry(userId: number, date: string, data: InsertFoodDiaryEntry): Promise<FoodDiaryEntry>;
  updateFoodDiaryEntry(entryId: number, userId: number, data: Partial<Pick<FoodDiaryEntry, 'name' | 'notes' | 'mealSlot'>>): Promise<FoodDiaryEntry | undefined>;
  deleteFoodDiaryEntry(entryId: number, userId: number): Promise<void>;
  copyPlannerToFoodDiary(userId: number, date: string, slots?: string[]): Promise<{ copied: number; skipped: number }>;
  getFoodDiaryMetrics(userId: number, date: string): Promise<FoodDiaryMetrics | null>;
  upsertFoodDiaryMetrics(userId: number, date: string, data: Partial<InsertFoodDiaryMetrics>): Promise<FoodDiaryMetrics>;
  getFoodDiaryMetricsTrends(userId: number, days?: number): Promise<FoodDiaryMetrics[]>;

  // ── Demo User Lifecycle ───────────────────────────────────────────────────────
  createDemoUser(): Promise<User>;
  seedDemoData(userId: number): Promise<void>;
  cleanupDemoUser(userId: number): Promise<void>;

  // ── Food Knowledge ────────────────────────────────────────────────────────────
  getFoodKnowledgeAll(): Promise<FoodKnowledge[]>;
  getFoodKnowledgeBySlug(slug: string): Promise<FoodKnowledge | null>;
  searchFoodKnowledge(q: string): Promise<FoodKnowledge[]>;

  sessionStore: session.Store;
}

// ── Attribution Types ───────────────────────────────────────────────────────
export type ShoppingListItemWithAttribution = ShoppingListItem & {
  addedByDisplayName: string | null;
  sources: Array<{ mealId: number; mealName: string; weekNumber: number | null; dayOfWeek: number | null; mealSlot: string | null }>;
};

export type HouseholdDietaryContext = {
  members: Array<{
    userId: number;
    displayName: string;
    dietTypes: string[];
    dietRestrictions: string[];
    excludedIngredients: string[];
  }>;
  aggregated: {
    unionDietTypes: string[];
    unionRestrictions: string[];
    unionExclusions: string[];
  };
};

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
    return await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values(insertUser).returning();

      const inviteCode = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
      const [household] = await tx.insert(households).values({
        name: `${user.username}'s Household`,
        inviteCode,
        createdByUserId: user.id,
      }).returning();

      await tx.insert(householdMembers).values({
        householdId: household.id,
        userId: user.id,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
      });

      return user;
    });
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

  async updateMeal(id: number, data: Partial<{ name: string; ingredients: string[]; instructions: string[]; servings: number; kind: string }>): Promise<Meal | undefined> {
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
    const householdId = await getHouseholdForUser(userId);
    return await db.select().from(shoppingList).where(eq(shoppingList.householdId, householdId));
  }

  async addShoppingListItem(userId: number, item: InsertShoppingListItem, addedByUserId?: number): Promise<ShoppingListItem> {
    const householdId = await getHouseholdForUser(userId);
    const [result] = await db.insert(shoppingList).values({ ...item, userId, householdId, addedByUserId: addedByUserId ?? userId }).returning();
    return result;
  }

  async addOrConsolidateShoppingListItem(userId: number, item: InsertShoppingListItem, addedByUserId?: number): Promise<ShoppingListItem> {
    const householdId = await getHouseholdForUser(userId);

    // Labels that identify member-specific (non-shared) items.
    // These must only consolidate with items carrying the same label,
    // so a vegetarian swap never collapses into the shared ingredient line.
    const MEMBER_SPECIFIC_LABELS = ["vegetarian_swap", "keto_swap", "optional", "vegetarian", "keto"];
    const incomingLabel = item.basketLabel ?? null;
    const isMemberSpecific = incomingLabel !== null && MEMBER_SPECIFIC_LABELS.includes(incomingLabel);

    if (item.normalizedName && item.unit) {
      // Build WHERE clause: always match on household + normalizedName + unit.
      // For member-specific labels, also require the same basketLabel so they
      // never merge with the shared base item.
      const baseCondition = and(
        eq(shoppingList.householdId, householdId),
        eq(shoppingList.normalizedName, item.normalizedName),
        eq(shoppingList.unit, item.unit)
      );

      const condition = isMemberSpecific
        ? and(baseCondition, eq(shoppingList.basketLabel, incomingLabel))
        : baseCondition;

      const existing = await db.select().from(shoppingList).where(condition);

      if (existing.length > 0) {
        const existingItem = existing[0];
        const newQty = (existingItem.quantityValue || 0) + (item.quantityValue || 0);
        const newGrams = item.quantityInGrams
          ? (existingItem.quantityInGrams || 0) + item.quantityInGrams
          : existingItem.quantityInGrams;

        // If the incoming item is labelled 'shared', promote the merged row to
        // 'shared' so the UI always reflects the shared status.
        const labelUpdate = incomingLabel === "shared" && existingItem.basketLabel !== "shared"
          ? { basketLabel: "shared" as string }
          : {};

        const [result] = await db.update(shoppingList)
          .set({ quantityValue: newQty, quantityInGrams: newGrams, ...labelUpdate })
          .where(eq(shoppingList.id, existingItem.id))
          .returning();
        return result;
      }
    }
    const [result] = await db.insert(shoppingList).values({ ...item, userId, householdId, addedByUserId: addedByUserId ?? userId }).returning();
    return result;
  }

  async updateShoppingListItemQuantity(id: number, quantity: number): Promise<ShoppingListItem | undefined> {
    const [result] = await db.update(shoppingList).set({ quantity }).where(eq(shoppingList.id, id)).returning();
    return result;
  }

  async updateShoppingListItem(id: number, fields: Partial<Pick<ShoppingListItem, 'productName' | 'normalizedName' | 'quantityValue' | 'unit' | 'quantityInGrams' | 'category' | 'quantity' | 'selectedTier' | 'checked' | 'ingredientId' | 'matchedProductId' | 'matchedStore' | 'matchedPrice' | 'availableStores' | 'smpRating' | 'itemType' | 'variantSelections' | 'attributePreferences' | 'confidenceLevel' | 'confidenceReason' | 'basketLabel'>>): Promise<ShoppingListItem | undefined> {
    const [result] = await db.update(shoppingList).set(fields).where(eq(shoppingList.id, id)).returning();
    return result;
  }

  async removeShoppingListItem(id: number): Promise<void> {
    await db.delete(ingredientSources).where(eq(ingredientSources.shoppingListItemId, id));
    await db.delete(productMatches).where(eq(productMatches.shoppingListItemId, id));
    await db.delete(shoppingList).where(eq(shoppingList.id, id));
  }

  async clearShoppingList(userId: number): Promise<void> {
    const householdId = await getHouseholdForUser(userId);
    await this.clearAllIngredientSourcesForUser(userId);
    await this.clearAllProductMatchesForUser(userId);
    await db.delete(shoppingList).where(eq(shoppingList.householdId, householdId));
    // Also clear session-only extras (inBasket=true, alwaysAdd=false)
    await db
      .delete(shoppingListExtras)
      .where(
        and(
          eq(shoppingListExtras.householdId, householdId),
          eq(shoppingListExtras.inBasket, true),
          eq(shoppingListExtras.alwaysAdd, false)
        )
      );
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
    const householdId = await getHouseholdForUser(userId);
    const items = await db.select().from(shoppingList).where(eq(shoppingList.householdId, householdId));
    if (items.length === 0) return [];
    const itemIds = items.map(i => i.id);
    return await db.select().from(productMatches).where(inArray(productMatches.shoppingListItemId, itemIds));
  }

  async addProductMatch(match: InsertProductMatch): Promise<ProductMatch> {
    const [result] = await db.insert(productMatches).values(match).returning();
    return result;
  }

  async clearProductMatches(shoppingListItemId: number): Promise<void> {
    await db.delete(productMatches).where(eq(productMatches.shoppingListItemId, shoppingListItemId));
  }

  async clearAllProductMatchesForUser(userId: number): Promise<void> {
    const householdId = await getHouseholdForUser(userId);
    const items = await db.select().from(shoppingList).where(eq(shoppingList.householdId, householdId));
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
    const householdId = await getHouseholdForUser(userId);
    const items = await db.select().from(shoppingList).where(eq(shoppingList.householdId, householdId));
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

  async updateUserProfile(id: number, fields: Partial<Pick<User, 'firstName' | 'displayName' | 'profilePhotoUrl' | 'dietPattern' | 'dietRestrictions' | 'eatingSchedule'>>): Promise<User | undefined> {
    const [result] = await db.update(users).set(fields).where(eq(users.id, id)).returning();
    return result;
  }

  async completeOnboarding(userId: number): Promise<User | undefined> {
    const [result] = await db.update(users).set({ onboardingCompleted: true }).where(eq(users.id, userId)).returning();
    return result;
  }

  async resetOnboarding(userId: number): Promise<void> {
    await db.update(users).set({ onboardingCompleted: false }).where(eq(users.id, userId));
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

  private summaryFields() {
    return {
      id: meals.id,
      userId: meals.userId,
      name: meals.name,
      imageUrl: meals.imageUrl,
      servings: meals.servings,
      categoryId: meals.categoryId,
      sourceUrl: meals.sourceUrl,
      mealTemplateId: meals.mealTemplateId,
      mealSourceType: meals.mealSourceType,
      isReadyMeal: meals.isReadyMeal,
      isSystemMeal: meals.isSystemMeal,
      mealFormat: meals.mealFormat,
      dietTypes: meals.dietTypes,
      isFreezerEligible: meals.isFreezerEligible,
      audience: meals.audience,
      isDrink: meals.isDrink,
      drinkType: meals.drinkType,
      barcode: meals.barcode,
      brand: meals.brand,
      originalMealId: meals.originalMealId,
      kind: meals.kind,
      createdAt: meals.createdAt,
      ingredientCount: sql<number>`coalesce(array_length(${meals.ingredients}, 1), 0)`.mapWith(Number),
    };
  }

  async getMealsSummary(userId: number): Promise<MealSummary[]> {
    return await db.select(this.summaryFields()).from(meals).where(eq(meals.userId, userId));
  }

  async getSystemMealsSummary(): Promise<MealSummary[]> {
    return await db.select(this.summaryFields()).from(meals).where(eq(meals.isSystemMeal, true));
  }

  async getSystemMealByName(name: string): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(and(eq(meals.isSystemMeal, true), eq(meals.name, name)));
    return meal;
  }

  async getPlannerWeeks(userId: number): Promise<PlannerWeek[]> {
    const householdId = await getHouseholdForUser(userId);
    return await db.select().from(plannerWeeks).where(eq(plannerWeeks.householdId, householdId)).orderBy(plannerWeeks.weekNumber);
  }

  async getPlannerWeek(id: number): Promise<PlannerWeek | undefined> {
    const [result] = await db.select().from(plannerWeeks).where(eq(plannerWeeks.id, id));
    return result;
  }

  async createPlannerWeeks(userId: number): Promise<PlannerWeek[]> {
    const householdId = await getHouseholdForUser(userId);
    const existing = await db.select().from(plannerWeeks).where(eq(plannerWeeks.householdId, householdId)).orderBy(plannerWeeks.weekNumber);
    if (existing.length > 0) return existing;

    try {
      const weeks: PlannerWeek[] = [];
      await db.transaction(async (tx) => {
        for (let w = 1; w <= 6; w++) {
          const [week] = await tx.insert(plannerWeeks).values({
            userId,
            householdId,
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
        const retried = await db.select().from(plannerWeeks).where(eq(plannerWeeks.householdId, householdId)).orderBy(plannerWeeks.weekNumber);
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
    const householdId = await getHouseholdForUser(userId);
    const hhWeeks = await db.select().from(plannerWeeks).where(eq(plannerWeeks.householdId, householdId));
    for (const week of hhWeeks) {
      await db.delete(plannerDays).where(eq(plannerDays.weekId, week.id));
    }
    await db.delete(plannerWeeks).where(eq(plannerWeeks.householdId, householdId));
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
    const householdId = await getHouseholdForUser(userId);
    return await db.select().from(freezerMeals)
      .where(eq(freezerMeals.householdId, householdId))
      .orderBy(sql`${freezerMeals.frozenDate} DESC`);
  }

  async getFreezerMeal(id: number): Promise<FreezerMeal | undefined> {
    const [result] = await db.select().from(freezerMeals).where(eq(freezerMeals.id, id));
    return result;
  }

  async getFreezerMealsByMealId(userId: number, mealId: number): Promise<FreezerMeal[]> {
    const householdId = await getHouseholdForUser(userId);
    return await db.select().from(freezerMeals)
      .where(and(eq(freezerMeals.householdId, householdId), eq(freezerMeals.mealId, mealId)));
  }

  async addFreezerMeal(userId: number, data: InsertFreezerMeal): Promise<FreezerMeal> {
    const householdId = await getHouseholdForUser(userId);
    const [result] = await db.insert(freezerMeals).values({ ...data, userId, householdId }).returning();
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
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
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
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      });
    if (!updated) throw new Error(`User ${userId} not found`);
    return updated;
  }

  async updateLastLoginAt(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  async createAuditLog(entry: { adminUserId: number; action: string; targetUserId?: number; metadata?: object }): Promise<void> {
    await db.insert(adminAuditLog).values({
      adminUserId: entry.adminUserId,
      action: entry.action,
      targetUserId: entry.targetUserId ?? null,
      metadata: entry.metadata ?? null,
    });
  }

  // ── Pantry Staples ──────────────────────────────────────────────────────────
  async getPantryItems(userId: number): Promise<UserPantryItem[]> {
    const householdId = await getHouseholdForUser(userId);
    return db
      .select()
      .from(userPantryItems)
      .where(and(eq(userPantryItems.householdId, householdId), eq(userPantryItems.isDeleted, false)))
      .orderBy(userPantryItems.sortOrder, userPantryItems.createdAt);
  }

  async addPantryItem(userId: number, ingredient: string, category: string, notes?: string, displayName?: string, isDefault?: boolean): Promise<UserPantryItem> {
    const householdId = await getHouseholdForUser(userId);
    const ingredientKey = normalizeIngredientKey(ingredient);
    const [item] = await db
      .insert(userPantryItems)
      .values({
        userId,
        householdId,
        ingredientKey,
        displayName: displayName ?? ingredient,
        category,
        notes: notes ?? null,
        isDefault: isDefault ?? false,
        isDeleted: false,
      })
      .returning();
    return item;
  }

  async deletePantryItem(userId: number, id: number): Promise<void> {
    const householdId = await getHouseholdForUser(userId);
    const [existing] = await db
      .select()
      .from(userPantryItems)
      .where(and(eq(userPantryItems.id, id), eq(userPantryItems.householdId, householdId)))
      .limit(1);
    if (!existing) return;
    if (existing.isDefault) {
      await db
        .update(userPantryItems)
        .set({ isDeleted: true })
        .where(eq(userPantryItems.id, id));
    } else {
      await db.delete(userPantryItems).where(eq(userPantryItems.id, id));
    }
  }

  async seedDefaultHouseholdItems(userId: number): Promise<void> {
    let householdId: number;
    try {
      householdId = await getHouseholdForUser(userId);
    } catch {
      console.warn(`[Pantry Seed] No household for user ${userId}, skipping household seed`);
      return;
    }
    const defaults = [
      "Toilet roll", "Kitchen roll", "Tissues", "Washing up liquid",
      "Dishwasher tablets", "Laundry detergent", "Fabric conditioner",
      "Bin bags", "Food bags / freezer bags", "Cling film",
      "Baking paper", "Aluminium foil", "Sponges / scourers",
      "Multi-surface cleaner", "Bleach", "Hand soap",
      "Shower gel", "Shampoo", "Toothpaste",
    ];
    for (const name of defaults) {
      const ingredientKey = normalizeIngredientKey(name);
      try {
        await db
          .insert(userPantryItems)
          .values({
            userId,
            householdId,
            ingredientKey,
            displayName: name,
            category: "household",
            isDefault: true,
            isDeleted: false,
          })
          .onConflictDoNothing();
      } catch {
        // skip duplicates silently
      }
    }
  }

  async seedDefaultFoodPantryItems(userId: number): Promise<void> {
    let householdId: number;
    try {
      householdId = await getHouseholdForUser(userId);
    } catch {
      console.warn(`[Pantry Seed] No household for user ${userId}, skipping food pantry seed`);
      return;
    }
    const defaults: { name: string; category: "larder" | "fridge" | "freezer"; sortOrder: number }[] = [
      // FRIDGE
      { name: "Milk", category: "fridge", sortOrder: 0 },
      { name: "Butter", category: "fridge", sortOrder: 1 },
      { name: "Eggs", category: "fridge", sortOrder: 2 },
      { name: "Cheese", category: "fridge", sortOrder: 3 },
      { name: "Greek yogurt", category: "fridge", sortOrder: 4 },
      { name: "Plain yogurt", category: "fridge", sortOrder: 5 },
      { name: "Double cream", category: "fridge", sortOrder: 6 },
      { name: "Sour cream", category: "fridge", sortOrder: 7 },
      { name: "Mayonnaise", category: "fridge", sortOrder: 8 },
      { name: "Mustard", category: "fridge", sortOrder: 9 },
      { name: "Ketchup", category: "fridge", sortOrder: 10 },
      // FREEZER
      { name: "Frozen peas", category: "freezer", sortOrder: 0 },
      { name: "Frozen sweetcorn", category: "freezer", sortOrder: 1 },
      { name: "Frozen berries", category: "freezer", sortOrder: 2 },
      { name: "Frozen spinach", category: "freezer", sortOrder: 3 },
      { name: "Frozen mixed vegetables", category: "freezer", sortOrder: 4 },
      { name: "Frozen chips", category: "freezer", sortOrder: 5 },
      { name: "Frozen bread", category: "freezer", sortOrder: 6 },
      { name: "Ice cubes", category: "freezer", sortOrder: 7 },
      // LARDER — BASICS
      { name: "Olive oil", category: "larder", sortOrder: 0 },
      { name: "Vegetable oil", category: "larder", sortOrder: 1 },
      { name: "Apple cider vinegar", category: "larder", sortOrder: 2 },
      { name: "Balsamic vinegar", category: "larder", sortOrder: 3 },
      { name: "White wine vinegar", category: "larder", sortOrder: 4 },
      { name: "Soy sauce", category: "larder", sortOrder: 5 },
      { name: "Worcestershire sauce", category: "larder", sortOrder: 6 },
      { name: "Stock cubes", category: "larder", sortOrder: 7 },
      { name: "Tinned chopped tomatoes", category: "larder", sortOrder: 8 },
      { name: "Passata", category: "larder", sortOrder: 9 },
      { name: "Tomato puree", category: "larder", sortOrder: 10 },
      { name: "Tinned baked beans", category: "larder", sortOrder: 11 },
      { name: "Tinned chickpeas", category: "larder", sortOrder: 12 },
      { name: "Tinned kidney beans", category: "larder", sortOrder: 13 },
      { name: "Tinned lentils", category: "larder", sortOrder: 14 },
      { name: "Tuna tins", category: "larder", sortOrder: 15 },
      { name: "Rice (basmati)", category: "larder", sortOrder: 16 },
      { name: "Pasta (dried)", category: "larder", sortOrder: 17 },
      { name: "Couscous", category: "larder", sortOrder: 18 },
      { name: "Oats", category: "larder", sortOrder: 19 },
      { name: "Flour — plain", category: "larder", sortOrder: 20 },
      { name: "Flour — self-raising", category: "larder", sortOrder: 21 },
      { name: "Flour — bread flour", category: "larder", sortOrder: 22 },
      { name: "Baking powder", category: "larder", sortOrder: 23 },
      { name: "Bicarbonate of soda", category: "larder", sortOrder: 24 },
      { name: "Yeast (dried)", category: "larder", sortOrder: 25 },
      { name: "Sugar (granulated)", category: "larder", sortOrder: 26 },
      { name: "Brown sugar", category: "larder", sortOrder: 27 },
      { name: "Honey", category: "larder", sortOrder: 28 },
      { name: "Peanut butter", category: "larder", sortOrder: 29 },
      { name: "Jam", category: "larder", sortOrder: 30 },
      { name: "Cornflour", category: "larder", sortOrder: 31 },
      { name: "Breadcrumbs", category: "larder", sortOrder: 32 },
      { name: "Cocoa powder", category: "larder", sortOrder: 33 },
      { name: "Vanilla extract", category: "larder", sortOrder: 34 },
      // LARDER — SPICES & HERBS (sortOrder 100+ to group together)
      { name: "Salt", category: "larder", sortOrder: 100 },
      { name: "Black pepper", category: "larder", sortOrder: 101 },
      { name: "Chilli flakes", category: "larder", sortOrder: 102 },
      { name: "Paprika", category: "larder", sortOrder: 103 },
      { name: "Smoked paprika", category: "larder", sortOrder: 104 },
      { name: "Ground cumin", category: "larder", sortOrder: 105 },
      { name: "Ground coriander", category: "larder", sortOrder: 106 },
      { name: "Turmeric", category: "larder", sortOrder: 107 },
      { name: "Curry powder", category: "larder", sortOrder: 108 },
      { name: "Garam masala", category: "larder", sortOrder: 109 },
      { name: "Cinnamon", category: "larder", sortOrder: 110 },
      { name: "Nutmeg", category: "larder", sortOrder: 111 },
      { name: "Mixed herbs", category: "larder", sortOrder: 112 },
      { name: "Oregano", category: "larder", sortOrder: 113 },
      { name: "Basil (dried)", category: "larder", sortOrder: 114 },
      { name: "Thyme (dried)", category: "larder", sortOrder: 115 },
      { name: "Rosemary (dried)", category: "larder", sortOrder: 116 },
      { name: "Garlic granules", category: "larder", sortOrder: 117 },
      { name: "Onion granules", category: "larder", sortOrder: 118 },
      { name: "Ground ginger", category: "larder", sortOrder: 119 },
    ];
    for (const { name, category, sortOrder } of defaults) {
      const ingredientKey = normalizeIngredientKey(name);
      try {
        await db
          .insert(userPantryItems)
          .values({
            userId,
            householdId,
            ingredientKey,
            displayName: name,
            category,
            isDefault: true,
            isDeleted: false,
            sortOrder,
          })
          .onConflictDoNothing();
      } catch {
        // skip duplicates silently
      }
    }
  }

  async syncAllPantryDefaults(): Promise<void> {
    // Find the owner user for every household. We only need one representative
    // user per household — the owner is always present.
    const owners = await db
      .select({ userId: householdMembers.userId })
      .from(householdMembers)
      .where(and(eq(householdMembers.role, "owner"), eq(householdMembers.status, "active")));

    let count = 0;
    for (const { userId } of owners) {
      try {
        await this.seedDefaultFoodPantryItems(userId);
        await this.seedDefaultHouseholdItems(userId);
        count++;
      } catch (err) {
        console.warn(`[Pantry Sync] Failed for user ${userId}:`, err);
      }
    }
    console.log(`[Pantry Sync] Synced defaults for ${count} household(s)`);
  }

  // ── Shopping List Extras ──────────────────────────────────────────────────
  async getShoppingListExtras(userId: number): Promise<ShoppingListExtra[]> {
    const householdId = await getHouseholdForUser(userId);
    return db
      .select()
      .from(shoppingListExtras)
      .where(eq(shoppingListExtras.householdId, householdId))
      .orderBy(shoppingListExtras.createdAt);
  }

  async addShoppingListExtra(userId: number, name: string, category = "household", alwaysAdd = false): Promise<ShoppingListExtra> {
    const householdId = await getHouseholdForUser(userId);
    const [item] = await db
      .insert(shoppingListExtras)
      .values({ userId, householdId, name, category, alwaysAdd, inBasket: true })
      .returning();
    return item;
  }

  async updateShoppingListExtra(userId: number, id: number, fields: { alwaysAdd?: boolean; inBasket?: boolean }): Promise<ShoppingListExtra | undefined> {
    const householdId = await getHouseholdForUser(userId);
    const updates: Partial<typeof shoppingListExtras.$inferInsert> = {};
    if (fields.alwaysAdd !== undefined) updates.alwaysAdd = fields.alwaysAdd;
    if (fields.inBasket !== undefined) updates.inBasket = fields.inBasket;
    if (Object.keys(updates).length === 0) return undefined;
    const [result] = await db
      .update(shoppingListExtras)
      .set(updates)
      .where(and(eq(shoppingListExtras.id, id), eq(shoppingListExtras.householdId, householdId)))
      .returning();
    return result;
  }

  async deleteShoppingListExtra(userId: number, id: number): Promise<void> {
    const householdId = await getHouseholdForUser(userId);
    await db
      .delete(shoppingListExtras)
      .where(and(eq(shoppingListExtras.id, id), eq(shoppingListExtras.householdId, householdId)));
  }

  // ── Meal Pairings ─────────────────────────────────────────────────────────
  async getMealPairings(mealId: number): Promise<{ pairing: MealPairing; meal: Meal }[]> {
    const rows = await db
      .select({ pairing: mealPairings, meal: meals })
      .from(mealPairings)
      .innerJoin(meals, eq(mealPairings.suggestedMealId, meals.id))
      .where(eq(mealPairings.baseMealId, mealId))
      .orderBy(sql`${mealPairings.priority} DESC`);
    return rows;
  }

  async addMealPairing(data: InsertMealPairing): Promise<MealPairing> {
    const [pairing] = await db.insert(mealPairings).values(data).returning();
    return pairing;
  }

  async deleteMealPairing(id: number): Promise<MealPairing | undefined> {
    const [deleted] = await db.delete(mealPairings).where(eq(mealPairings.id, id)).returning();
    return deleted;
  }

  // ── Ingredient Products (THA Picks) ────────────────────────────────────────

  async getIngredientProductsForKeys(keys: string[]): Promise<IngredientProduct[]> {
    if (keys.length === 0) return [];
    return db
      .select()
      .from(ingredientProducts)
      .where(and(eq(ingredientProducts.isActive, true), inArray(ingredientProducts.ingredientKey, keys)))
      .orderBy(sql`${ingredientProducts.priority} DESC`);
  }

  async getAllActiveIngredientProducts(): Promise<IngredientProduct[]> {
    return db
      .select()
      .from(ingredientProducts)
      .where(eq(ingredientProducts.isActive, true))
      .orderBy(sql`${ingredientProducts.priority} DESC`);
  }

  async searchIngredientProducts(query: string): Promise<IngredientProduct[]> {
    if (!query.trim()) {
      return db.select().from(ingredientProducts).orderBy(sql`${ingredientProducts.priority} DESC`);
    }
    const pattern = `%${query}%`;
    return db
      .select()
      .from(ingredientProducts)
      .where(sql`${ingredientProducts.ingredientKey} ILIKE ${pattern} OR ${ingredientProducts.productName} ILIKE ${pattern}`)
      .orderBy(sql`${ingredientProducts.priority} DESC`);
  }

  async createIngredientProduct(data: InsertIngredientProduct): Promise<IngredientProduct> {
    const [row] = await db.insert(ingredientProducts).values(data).returning();
    return row;
  }

  async updateIngredientProduct(id: number, data: Partial<InsertIngredientProduct>): Promise<IngredientProduct | undefined> {
    const [row] = await db.update(ingredientProducts).set(data).where(eq(ingredientProducts.id, id)).returning();
    return row;
  }

  async deactivateIngredientProduct(id: number): Promise<void> {
    await db.update(ingredientProducts).set({ isActive: false }).where(eq(ingredientProducts.id, id));
  }

  // ── Household System ────────────────────────────────────────────────────────

  async getHouseholdByUser(userId: number): Promise<{ household: Household; members: HouseholdMember[] } | null> {
    const member = await db.query.householdMembers.findFirst({
      where: and(
        eq(householdMembers.userId, userId),
        eq(householdMembers.status, "active")
      ),
    });
    if (!member) return null;

    const household = await db.query.households.findFirst({
      where: eq(households.id, member.householdId),
    });
    if (!household) return null;

    const members = await db.query.householdMembers.findMany({
      where: and(
        eq(householdMembers.householdId, household.id),
        eq(householdMembers.status, "active")
      ),
    });

    return { household, members };
  }

  async getUserHouseholdRole(userId: number): Promise<string | null> {
    const member = await db.query.householdMembers.findFirst({
      where: and(
        eq(householdMembers.userId, userId),
        eq(householdMembers.status, "active")
      ),
    });
    return member?.role ?? null;
  }

  private async generateUniqueInviteCode(): Promise<string> {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let attempt = 0; attempt < 20; attempt++) {
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const existing = await db.query.households.findFirst({
        where: eq(households.inviteCode, code),
      });
      if (!existing) return code;
    }
    throw new Error("Failed to generate unique invite code after 20 attempts");
  }

  async createHouseholdForUser(userId: number, name: string): Promise<Household> {
    const inviteCode = await this.generateUniqueInviteCode();
    let createdHousehold: Household;
    await db.transaction(async (tx) => {
      const [hh] = await tx.insert(households).values({
        name,
        inviteCode,
        createdByUserId: userId,
      }).returning();
      createdHousehold = hh;
      await tx.insert(householdMembers).values({
        householdId: hh.id,
        userId,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
      });
    });
    return createdHousehold!;
  }

  async getHouseholdWithMembers(householdId: number): Promise<{
    household: Household;
    members: { member: HouseholdMember; user: { id: number; displayName: string | null; username: string } }[];
  }> {
    const household = await db.query.households.findFirst({
      where: eq(households.id, householdId),
    });
    if (!household) throw new Error("Household not found");

    const activeMembers = await db.query.householdMembers.findMany({
      where: and(
        eq(householdMembers.householdId, householdId),
        eq(householdMembers.status, "active")
      ),
    });

    const members = await Promise.all(
      activeMembers.map(async (member) => {
        const fullUser = await db.query.users.findFirst({
          where: eq(users.id, member.userId),
        });
        const user = {
          id: fullUser!.id,
          displayName: fullUser!.displayName ?? null,
          username: fullUser!.username,
        };
        return { member, user };
      })
    );

    return { household, members };
  }

  async findHouseholdByInviteCode(inviteCode: string): Promise<Household | null> {
    const code = inviteCode.trim().toLowerCase();
    const household = await db.query.households.findFirst({
      where: sql`lower(${households.inviteCode}) = ${code}`,
    });
    return household ?? null;
  }

  async joinHousehold(userId: number, inviteCode: string): Promise<{ household: Household; role: string }> {
    const target = await this.findHouseholdByInviteCode(inviteCode);
    if (!target) throw new Error("INVALID_CODE");

    let result: { household: Household; role: string };

    await db.transaction(async (tx) => {
      const currentActive = await tx.query.householdMembers.findFirst({
        where: and(
          eq(householdMembers.userId, userId),
          eq(householdMembers.status, "active")
        ),
      });

      if (currentActive && currentActive.householdId === target.id) {
        throw new Error("ALREADY_IN_HOUSEHOLD");
      }

      if (currentActive) {
        await tx.update(householdMembers)
          .set({ status: "left", leftAt: new Date() })
          .where(eq(householdMembers.id, currentActive.id));
      }

      const existingRow = await tx.query.householdMembers.findFirst({
        where: and(
          eq(householdMembers.householdId, target.id),
          eq(householdMembers.userId, userId)
        ),
      });

      if (existingRow) {
        await tx.update(householdMembers)
          .set({ status: "active", role: "member", leftAt: null, joinedAt: new Date() })
          .where(eq(householdMembers.id, existingRow.id));
      } else {
        await tx.insert(householdMembers).values({
          householdId: target.id,
          userId,
          role: "member",
          status: "active",
          joinedAt: new Date(),
        });
      }

      result = { household: target, role: "member" };
    });

    return result!;
  }

  async leaveHousehold(userId: number): Promise<Household> {
    let newHousehold: Household;

    await db.transaction(async (tx) => {
      const currentMembership = await tx.query.householdMembers.findFirst({
        where: and(
          eq(householdMembers.userId, userId),
          eq(householdMembers.status, "active")
        ),
      });
      if (!currentMembership) throw new Error("NO_ACTIVE_HOUSEHOLD");

      if (currentMembership.role === "owner") {
        const otherActives = await tx.query.householdMembers.findMany({
          where: and(
            eq(householdMembers.householdId, currentMembership.householdId),
            eq(householdMembers.status, "active")
          ),
        });
        const others = otherActives.filter(m => m.userId !== userId);
        if (others.length > 0) {
          throw new Error("OWNER_HAS_MEMBERS");
        }
      }

      await tx.update(householdMembers)
        .set({ status: "left", leftAt: new Date() })
        .where(eq(householdMembers.id, currentMembership.id));

      const inviteCode = await this.generateUniqueInviteCode();
      const [hh] = await tx.insert(households).values({
        name: "My Household",
        inviteCode,
        createdByUserId: userId,
      }).returning();
      newHousehold = hh;

      const existingRow = await tx.query.householdMembers.findFirst({
        where: and(
          eq(householdMembers.householdId, hh.id),
          eq(householdMembers.userId, userId)
        ),
      });

      if (existingRow) {
        await tx.update(householdMembers)
          .set({ status: "active", role: "owner", leftAt: null, joinedAt: new Date() })
          .where(eq(householdMembers.id, existingRow.id));
      } else {
        await tx.insert(householdMembers).values({
          householdId: hh.id,
          userId,
          role: "owner",
          status: "active",
          joinedAt: new Date(),
        });
      }
    });

    return newHousehold!;
  }

  async renameHousehold(userId: number, householdId: number, name: string): Promise<Household> {
    const membership = await db.query.householdMembers.findFirst({
      where: and(
        eq(householdMembers.userId, userId),
        eq(householdMembers.householdId, householdId),
        eq(householdMembers.status, "active")
      ),
    });
    if (!membership || membership.role !== "owner") {
      throw new Error("NOT_OWNER");
    }
    const [updated] = await db.update(households)
      .set({ name, updatedAt: new Date() })
      .where(eq(households.id, householdId))
      .returning();
    return updated;
  }

  async removeHouseholdMember(actorUserId: number, targetUserId: number): Promise<{
    member: HouseholdMember; user: { id: number; displayName: string | null; username: string; email: string };
  }[]> {
    let householdId: number;

    await db.transaction(async (tx) => {
      const actorMembership = await tx.query.householdMembers.findFirst({
        where: and(
          eq(householdMembers.userId, actorUserId),
          eq(householdMembers.status, "active")
        ),
      });
      if (!actorMembership || actorMembership.role !== "owner") {
        throw new Error("NOT_OWNER");
      }
      if (actorUserId === targetUserId) {
        throw new Error("CANNOT_REMOVE_SELF");
      }

      const targetMembership = await tx.query.householdMembers.findFirst({
        where: and(
          eq(householdMembers.userId, targetUserId),
          eq(householdMembers.householdId, actorMembership.householdId),
          eq(householdMembers.status, "active")
        ),
      });
      if (!targetMembership) throw new Error("MEMBER_NOT_FOUND");

      await tx.update(householdMembers)
        .set({ status: "removed", leftAt: new Date() })
        .where(eq(householdMembers.id, targetMembership.id));

      const inviteCode = await this.generateUniqueInviteCode();
      const [newHh] = await tx.insert(households).values({
        name: "My Household",
        inviteCode,
        createdByUserId: targetUserId,
      }).returning();

      await tx.insert(householdMembers).values({
        householdId: newHh.id,
        userId: targetUserId,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
      });

      householdId = actorMembership.householdId;
    });

    const result = await this.getHouseholdWithMembers(householdId!);
    return result.members;
  }

  // ── Basket Attribution ───────────────────────────────────────────────────────

  async getShoppingListItemsWithAttribution(userId: number): Promise<ShoppingListItemWithAttribution[]> {
    const householdId = await getHouseholdForUser(userId);
    const items = await db.select().from(shoppingList).where(eq(shoppingList.householdId, householdId));
    if (items.length === 0) return [];

    const allSources = await db.select().from(ingredientSources).where(
      inArray(ingredientSources.shoppingListItemId, items.map(i => i.id))
    );

    const addedByIds = items.map(i => i.addedByUserId).filter((id): id is number => id != null);
    const addedByUsers = addedByIds.length > 0
      ? await db.select({ id: users.id, displayName: users.displayName, username: users.username })
          .from(users).where(inArray(users.id, addedByIds))
      : [];
    const userMap = new Map(addedByUsers.map(u => [u.id, u.displayName || u.username]));

    const sourcesByItem = new Map<number, typeof allSources>();
    for (const src of allSources) {
      if (!sourcesByItem.has(src.shoppingListItemId)) sourcesByItem.set(src.shoppingListItemId, []);
      sourcesByItem.get(src.shoppingListItemId)!.push(src);
    }

    return items.map(item => ({
      ...item,
      addedByDisplayName: item.addedByUserId ? (userMap.get(item.addedByUserId) ?? null) : null,
      sources: (sourcesByItem.get(item.id) ?? []).map(s => ({
        mealId: s.mealId,
        mealName: s.mealName,
        weekNumber: s.weekNumber ?? null,
        dayOfWeek: s.dayOfWeek ?? null,
        mealSlot: s.mealSlot ?? null,
      })),
    }));
  }

  async getBasketMealIds(userId: number): Promise<number[]> {
    const householdId = await getHouseholdForUser(userId);
    const items = await db.select({ id: shoppingList.id }).from(shoppingList).where(eq(shoppingList.householdId, householdId));
    if (items.length === 0) return [];
    const sources = await db.select({ mealId: ingredientSources.mealId }).from(ingredientSources)
      .where(inArray(ingredientSources.shoppingListItemId, items.map(i => i.id)));
    return [...new Set(sources.map(s => s.mealId))];
  }

  async getHouseholdDietaryContext(userId: number): Promise<HouseholdDietaryContext> {
    const householdId = await getHouseholdForUser(userId);
    const members = await db.select({ member: householdMembers, user: { id: users.id, displayName: users.displayName, username: users.username } })
      .from(householdMembers)
      .innerJoin(users, eq(householdMembers.userId, users.id))
      .where(and(eq(householdMembers.householdId, householdId), eq(householdMembers.status, 'active')));

    const memberProfiles: HouseholdDietaryContext['members'] = [];
    for (const { member, user } of members) {
      const prefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, member.userId));
      const p = prefs[0];
      memberProfiles.push({
        userId: member.userId,
        displayName: user.displayName || user.username,
        dietTypes: p?.dietTypes ?? [],
        dietRestrictions: [],
        excludedIngredients: p?.excludedIngredients ?? [],
      });
    }

    return {
      members: memberProfiles,
      aggregated: {
        unionDietTypes: [...new Set(memberProfiles.flatMap(m => m.dietTypes))],
        unionRestrictions: [...new Set(memberProfiles.flatMap(m => m.dietRestrictions))],
        unionExclusions: [...new Set(memberProfiles.flatMap(m => m.excludedIngredients))],
      },
    };
  }

  // ── My Diary ─────────────────────────────────────────────────────────────────

  async getFoodDiaryDay(userId: number, date: string): Promise<FoodDiaryDay | null> {
    const [day] = await db.select().from(foodDiaryDays).where(
      and(eq(foodDiaryDays.userId, userId), eq(foodDiaryDays.date, date))
    );
    return day ?? null;
  }

  async getOrCreateFoodDiaryDay(userId: number, date: string): Promise<FoodDiaryDay> {
    const existing = await this.getFoodDiaryDay(userId, date);
    if (existing) return existing;
    const [created] = await db.insert(foodDiaryDays).values({ userId, date }).returning();
    return created;
  }

  async getFoodDiaryEntries(userId: number, date: string): Promise<FoodDiaryEntry[]> {
    const day = await this.getFoodDiaryDay(userId, date);
    if (!day) return [];
    return await db.select().from(foodDiaryEntries)
      .where(and(eq(foodDiaryEntries.dayId, day.id), eq(foodDiaryEntries.userId, userId)))
      .orderBy(foodDiaryEntries.createdAt);
  }

  async createFoodDiaryEntry(userId: number, date: string, data: InsertFoodDiaryEntry): Promise<FoodDiaryEntry> {
    const day = await this.getOrCreateFoodDiaryDay(userId, date);
    const [entry] = await db.insert(foodDiaryEntries).values({ ...data, userId, dayId: day.id }).returning();
    return entry;
  }

  async updateFoodDiaryEntry(entryId: number, userId: number, data: Partial<Pick<FoodDiaryEntry, 'name' | 'notes' | 'mealSlot'>>): Promise<FoodDiaryEntry | undefined> {
    const [result] = await db.update(foodDiaryEntries)
      .set(data)
      .where(and(eq(foodDiaryEntries.id, entryId), eq(foodDiaryEntries.userId, userId)))
      .returning();
    return result;
  }

  async deleteFoodDiaryEntry(entryId: number, userId: number): Promise<void> {
    await db.delete(foodDiaryEntries)
      .where(and(eq(foodDiaryEntries.id, entryId), eq(foodDiaryEntries.userId, userId)));
  }

  async copyPlannerToFoodDiary(userId: number, date: string, slots?: string[]): Promise<{ copied: number; skipped: number }> {
    const targetDate = new Date(date);
    const jsDay = targetDate.getDay();
    const plannerDay = jsDay === 0 ? 7 : jsDay;

    const weeks = await db.select().from(plannerWeeks)
      .where(eq(plannerWeeks.userId, userId))
      .orderBy(plannerWeeks.weekNumber)
      .limit(1);
    if (weeks.length === 0) return { copied: 0, skipped: 0 };

    const week = weeks[0];
    const days = await db.select().from(plannerDays)
      .where(and(eq(plannerDays.weekId, week.id), eq(plannerDays.dayOfWeek, plannerDay)));
    if (days.length === 0) return { copied: 0, skipped: 0 };

    const day = days[0];
    const entries = await db.select().from(plannerEntries).where(eq(plannerEntries.dayId, day.id));

    const existingEntries = await this.getFoodDiaryEntries(userId, date);
    const existingPlannerIds = new Set(
      existingEntries.map(e => e.sourcePlannerEntryId).filter((id): id is number => id != null)
    );

    const diaryDay = await this.getOrCreateFoodDiaryDay(userId, date);
    let copied = 0;
    let skipped = 0;

    for (const entry of entries) {
      if (existingPlannerIds.has(entry.id)) { skipped++; continue; }
      const mealName = entry.mealId ? (await db.select({ name: meals.name }).from(meals).where(eq(meals.id, entry.mealId)))[0]?.name ?? 'Planner meal' : 'Planner meal';
      const slot = entry.mealType === 'snacks' ? 'snack' : (entry.mealType ?? 'dinner');
      if (slots && slots.length > 0 && !slots.includes(slot)) { skipped++; continue; }
      await db.insert(foodDiaryEntries).values({
        dayId: diaryDay.id,
        userId,
        mealSlot: slot,
        name: mealName,
        sourceType: 'copied_from_planner',
        sourcePlannerEntryId: entry.id,
      });
      copied++;
    }
    return { copied, skipped };
  }

  async getFoodDiaryMetrics(userId: number, date: string): Promise<FoodDiaryMetrics | null> {
    const [metrics] = await db.select().from(foodDiaryMetrics)
      .where(and(eq(foodDiaryMetrics.userId, userId), eq(foodDiaryMetrics.date, date)));
    return metrics ?? null;
  }

  async upsertFoodDiaryMetrics(userId: number, date: string, data: Partial<InsertFoodDiaryMetrics>): Promise<FoodDiaryMetrics> {
    const existing = await this.getFoodDiaryMetrics(userId, date);
    if (existing) {
      const [updated] = await db.update(foodDiaryMetrics)
        .set(data)
        .where(and(eq(foodDiaryMetrics.userId, userId), eq(foodDiaryMetrics.date, date)))
        .returning();
      return updated;
    }
    const [created] = await db.insert(foodDiaryMetrics).values({ userId, date, ...data }).returning();
    return created;
  }

  async getFoodDiaryMetricsTrends(userId: number, days = 90): Promise<FoodDiaryMetrics[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return await db.select().from(foodDiaryMetrics)
      .where(and(eq(foodDiaryMetrics.userId, userId), sql`${foodDiaryMetrics.date} >= ${cutoffStr}`))
      .orderBy(foodDiaryMetrics.date);
  }

  async bulkUpsertFoodDiaryMetrics(
    userId: number,
    rows: Array<Partial<InsertFoodDiaryMetrics> & { date: string }>,
    strategy: "skip" | "overwrite" | "merge",
  ): Promise<{ imported: number; skipped: number; failed: number }> {
    let imported = 0, skipped = 0, failed = 0;
    for (const row of rows) {
      try {
        const existing = await this.getFoodDiaryMetrics(userId, row.date);
        if (strategy === "skip" && existing) { skipped++; continue; }
        if (strategy === "merge" && existing) {
          const merged: Partial<InsertFoodDiaryMetrics> = {};
          if (existing.weightKg == null && row.weightKg != null) merged.weightKg = row.weightKg;
          if (existing.sleepHours == null && row.sleepHours != null) merged.sleepHours = row.sleepHours;
          if (existing.moodApples == null && row.moodApples != null) merged.moodApples = row.moodApples;
          if (existing.energyApples == null && row.energyApples != null) merged.energyApples = row.energyApples;
          if (existing.notes == null && row.notes != null) merged.notes = row.notes;
          if (existing.stuckToPlan == null && row.stuckToPlan != null) merged.stuckToPlan = row.stuckToPlan;
          if (Object.keys(merged).length > 0) {
            await this.upsertFoodDiaryMetrics(userId, row.date, merged);
          }
          imported++;
          continue;
        }
        const { date, ...data } = row;
        await this.upsertFoodDiaryMetrics(userId, date, data);
        imported++;
      } catch {
        failed++;
      }
    }
    return { imported, skipped, failed };
  }

  async bulkCreateFoodDiaryEntries(
    userId: number,
    rows: Array<{ date: string; mealSlot: string; name: string; notes?: string | null }>,
    strategy: "skip" | "overwrite" | "merge",
  ): Promise<{ imported: number; skipped: number; failed: number }> {
    let imported = 0, skipped = 0, failed = 0;
    for (const row of rows) {
      try {
        const existing = await this.getFoodDiaryEntries(userId, row.date);
        const match = existing.find(
          (e) => e.mealSlot === row.mealSlot && e.name.toLowerCase() === row.name.toLowerCase(),
        );
        if (strategy === "skip" && match) { skipped++; continue; }
        if (strategy === "merge" && match) { skipped++; continue; }
        if (strategy === "overwrite" && match) {
          await this.deleteFoodDiaryEntry(match.id, userId);
        }
        await this.createFoodDiaryEntry(userId, row.date, {
          dayId: 0,
          userId,
          mealSlot: row.mealSlot,
          name: row.name,
          notes: row.notes ?? null,
          sourceType: "imported",
          sourcePlannerEntryId: null,
        });
        imported++;
      } catch {
        failed++;
      }
    }
    return { imported, skipped, failed };
  }
  // ── Demo User Lifecycle ───────────────────────────────────────────────────────

  async createDemoUser(): Promise<User> {
    const { randomBytes } = await import("crypto");
    const suffix = randomBytes(6).toString("hex");
    const username = `demo_${suffix}@demo.thehealthyapples.com`;
    const password = randomBytes(24).toString("hex");
    const demoExpiresAt = new Date(Date.now() + 20 * 60 * 1000);

    return await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({
        username,
        password,
        displayName: "Demo User",
        isDemo: true,
        demoExpiresAt,
        onboardingCompleted: true,
        emailVerified: true,
        isBetaUser: true,
        starterMealsLoaded: true,
      }).returning();

      const inviteCode = randomBytes(4).toString("hex").toUpperCase();
      const [household] = await tx.insert(households).values({
        name: "Demo Household",
        inviteCode,
        createdByUserId: user.id,
      }).returning();

      await tx.insert(householdMembers).values({
        householdId: household.id,
        userId: user.id,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
      });

      return user;
    });
  }

  async seedDemoData(userId: number): Promise<void> {
    const DEMO_MEALS = [
      {
        name: "Overnight Oats with Berries",
        ingredients: ["Rolled oats", "Oat milk", "Chia seeds", "Mixed berries", "Honey", "Vanilla extract"],
        mealSourceType: "scratch" as const,
        mealFormat: "recipe" as const,
        isReadyMeal: false,
        dietTypes: ["vegetarian", "vegan"] as string[],
        audience: "adult" as const,
        servings: 1,
      },
      {
        name: "Griddled Chicken & Avocado Salad",
        ingredients: ["Free-range chicken breast", "Avocado", "Mixed salad leaves", "Cherry tomatoes", "Cucumber", "Lemon juice", "Extra virgin olive oil", "Black pepper"],
        mealSourceType: "scratch" as const,
        mealFormat: "recipe" as const,
        isReadyMeal: false,
        dietTypes: ["gluten-free"] as string[],
        audience: "adult" as const,
        servings: 2,
      },
      {
        name: "Baked Salmon with Tenderstem Broccoli",
        ingredients: ["Salmon fillets", "Tenderstem broccoli", "Lemon", "Garlic", "Extra virgin olive oil", "Dill", "Sea salt"],
        mealSourceType: "scratch" as const,
        mealFormat: "recipe" as const,
        isReadyMeal: false,
        dietTypes: ["gluten-free", "dairy-free"] as string[],
        audience: "adult" as const,
        servings: 2,
      },
      {
        name: "Red Lentil & Spinach Soup",
        ingredients: ["Red lentils", "Baby spinach", "Tinned chopped tomatoes", "Vegetable stock", "Red onion", "Garlic", "Ground cumin", "Ground coriander", "Olive oil"],
        mealSourceType: "scratch" as const,
        mealFormat: "recipe" as const,
        isReadyMeal: false,
        dietTypes: ["vegetarian", "vegan", "gluten-free"] as string[],
        audience: "adult" as const,
        servings: 4,
      },
    ];

    const createdMeals: Meal[] = [];
    for (const mealData of DEMO_MEALS) {
      const meal = await this.createMeal(userId, {
        ...mealData,
        instructions: [],
        imageUrl: null,
        categoryId: null,
        sourceUrl: null,
        mealTemplateId: null,
        isFreezerEligible: true,
        isDrink: false,
        drinkType: null,
        barcode: null,
        brand: null,
        originalMealId: null,
        kind: "meal",
        isSystemMeal: false,
      });
      createdMeals.push(meal);
    }

    const [oats, chickenSalad, salmon, lentilSoup] = createdMeals;

    const weeks = await this.createPlannerWeeks(userId);
    const week1 = weeks[0];
    if (!week1) return;

    const days = await this.getPlannerDays(week1.id);
    const monday    = days.find(d => d.dayOfWeek === 0);
    const tuesday   = days.find(d => d.dayOfWeek === 1);
    const wednesday = days.find(d => d.dayOfWeek === 2);
    const thursday  = days.find(d => d.dayOfWeek === 3);

    const entries: Array<[number, string, number]> = [
      [monday?.id ?? 0,    "breakfast", oats.id],
      [monday?.id ?? 0,    "lunch",     chickenSalad.id],
      [monday?.id ?? 0,    "dinner",    salmon.id],
      [tuesday?.id ?? 0,   "breakfast", oats.id],
      [tuesday?.id ?? 0,   "dinner",    lentilSoup.id],
      [wednesday?.id ?? 0, "lunch",     lentilSoup.id],
      [wednesday?.id ?? 0, "dinner",    chickenSalad.id],
      [thursday?.id ?? 0,  "breakfast", oats.id],
      [thursday?.id ?? 0,  "dinner",    salmon.id],
    ];

    for (const [dayId, mealType, mealId] of entries) {
      if (!dayId) continue;
      await this.addPlannerEntry(dayId, mealType, "adult", mealId);
    }

    const shoppingItems: Omit<InsertShoppingListItem, "userId">[] = [
      { productName: "Free Range Eggs (12)", normalizedName: "eggs", quantity: 1, category: "dairy-eggs", selectedTier: "standard", checked: false, needsReview: false, matchedStore: "Tesco", matchedPrice: 2.49, smpRating: 4 },
      { productName: "Oat Milk (1L)", normalizedName: "oat milk", quantity: 2, category: "dairy-eggs", selectedTier: "standard", checked: false, needsReview: false, matchedStore: "Waitrose", matchedPrice: 1.45, smpRating: 3 },
      { productName: "Rolled Oats (1kg)", normalizedName: "rolled oats", quantity: 1, category: "grains", selectedTier: "standard", checked: false, needsReview: false, matchedStore: "Tesco", matchedPrice: 1.09, smpRating: 5 },
      { productName: "Mixed Berries (400g)", normalizedName: "mixed berries", quantity: 1, category: "fruit", selectedTier: "standard", checked: false, needsReview: false, matchedStore: "Tesco", matchedPrice: 2.99, smpRating: 5 },
      { productName: "Salmon Fillets (2 pack)", normalizedName: "salmon", quantity: 1, category: "fish", selectedTier: "premium", checked: false, needsReview: false, matchedStore: "Waitrose", matchedPrice: 5.49, smpRating: 5 },
      { productName: "Chicken Breast (500g)", normalizedName: "chicken breast", quantity: 1, category: "meat", selectedTier: "standard", checked: false, needsReview: false, matchedStore: "Tesco", matchedPrice: 3.79, smpRating: 4 },
      { productName: "Tenderstem Broccoli (200g)", normalizedName: "broccoli", quantity: 1, category: "vegetables", selectedTier: "standard", checked: false, needsReview: false, matchedStore: "Tesco", matchedPrice: 1.99, smpRating: 5 },
      { productName: "Avocado (2 pack)", normalizedName: "avocado", quantity: 1, category: "fruit", selectedTier: "standard", checked: false, needsReview: false, matchedStore: "Tesco", matchedPrice: 1.89, smpRating: 5 },
      { productName: "Red Split Lentils (500g)", normalizedName: "red lentils", quantity: 1, category: "pulses", selectedTier: "standard", checked: false, needsReview: false, matchedStore: "Tesco", matchedPrice: 1.29, smpRating: 5 },
      { productName: "Baby Spinach (200g)", normalizedName: "spinach", quantity: 1, category: "vegetables", selectedTier: "standard", checked: false, needsReview: false, matchedStore: "Tesco", matchedPrice: 1.49, smpRating: 5 },
      { productName: "Tinned Chopped Tomatoes (400g)", normalizedName: "chopped tomatoes", quantity: 2, category: "tinned", selectedTier: "standard", checked: false, needsReview: false, matchedStore: "Tesco", matchedPrice: 0.55, smpRating: 4 },
      { productName: "Extra Virgin Olive Oil (500ml)", normalizedName: "olive oil", quantity: 1, category: "oils", selectedTier: "premium", checked: true, needsReview: false, matchedStore: "Waitrose", matchedPrice: 5.99, smpRating: 5 },
    ];

    for (const item of shoppingItems) {
      await this.addShoppingListItem(userId, { ...item } as InsertShoppingListItem);
    }

    await this.upsertUserPreferences(userId, {
      dietTypes: [],
      excludedIngredients: [],
      healthGoals: ["eat_healthier", "reduce_processed"],
      budgetLevel: "standard",
      preferredStores: ["Tesco", "Waitrose"],
      upfSensitivity: "moderate",
      qualityPreference: "standard",
      calorieTarget: 2000,
      calorieMode: "auto",
      adultsCount: 2,
      childrenCount: 0,
      babiesCount: 0,
      soundEnabled: false,
      eliteTrackingEnabled: true,
      healthTrendEnabled: true,
      barcodeScannerEnabled: true,
      plannerShowCalories: true,
      plannerEnableBabyMeals: false,
      plannerEnableChildMeals: false,
      plannerEnableDrinks: false,
    });
  }

  async cleanupDemoUser(userId: number): Promise<void> {
    let householdId: number | null = null;
    try {
      householdId = await getHouseholdForUser(userId);
    } catch { }

    if (householdId) {
      const hhWeeks = await db.select().from(plannerWeeks).where(eq(plannerWeeks.householdId, householdId));
      for (const week of hhWeeks) {
        const days = await db.select().from(plannerDays).where(eq(plannerDays.weekId, week.id));
        for (const day of days) {
          await db.delete(plannerEntries).where(eq(plannerEntries.dayId, day.id));
        }
        await db.delete(plannerDays).where(eq(plannerDays.weekId, week.id));
      }
      await db.delete(plannerWeeks).where(eq(plannerWeeks.householdId, householdId));
    }

    const userShoppingItems = await db.select({ id: shoppingList.id }).from(shoppingList).where(eq(shoppingList.userId, userId));
    const itemIds = userShoppingItems.map(i => i.id);
    if (itemIds.length > 0) {
      await db.delete(ingredientSources).where(inArray(ingredientSources.shoppingListItemId, itemIds));
      await db.delete(productMatches).where(inArray(productMatches.shoppingListItemId, itemIds));
    }
    await db.delete(shoppingList).where(eq(shoppingList.userId, userId));

    const userMeals = await db.select({ id: meals.id }).from(meals).where(eq(meals.userId, userId));
    const mealIds = userMeals.map(m => m.id);
    if (mealIds.length > 0) {
      await db.delete(nutrition).where(inArray(nutrition.mealId, mealIds));
      await db.delete(mealAllergens).where(inArray(mealAllergens.mealId, mealIds));
    }
    await db.delete(meals).where(eq(meals.userId, userId));

    await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
    await db.delete(userStreaks).where(eq(userStreaks.userId, userId));
    await db.delete(userHealthTrends).where(eq(userHealthTrends.userId, userId));

    if (householdId) {
      await db.delete(householdMembers).where(eq(householdMembers.householdId, householdId));
      await db.delete(households).where(eq(households.id, householdId));
    }

    await db.delete(users).where(eq(users.id, userId));
  }

  async getFoodKnowledgeAll(): Promise<FoodKnowledge[]> {
    return db.select().from(foodKnowledge)
      .where(eq(foodKnowledge.isActive, true))
      .orderBy(foodKnowledge.type, foodKnowledge.title);
  }

  async getFoodKnowledgeBySlug(slug: string): Promise<FoodKnowledge | null> {
    const [row] = await db.select().from(foodKnowledge)
      .where(and(eq(foodKnowledge.slug, slug), eq(foodKnowledge.isActive, true)));
    return row ?? null;
  }

  async searchFoodKnowledge(q: string): Promise<FoodKnowledge[]> {
    const pattern = `%${q}%`;
    return db.select().from(foodKnowledge)
      .where(and(
        eq(foodKnowledge.isActive, true),
        or(
          ilike(foodKnowledge.title, pattern),
          ilike(foodKnowledge.shortSummary, pattern),
          ilike(foodKnowledge.type, pattern),
        )
      ))
      .orderBy(foodKnowledge.title);
  }

  async getSiteSetting(key: string): Promise<string | null> {
    const [row] = await db.select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, key));
    return row?.value ?? null;
  }

  async setSiteSetting(key: string, value: string): Promise<void> {
    await db.insert(siteSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
  }
}

export const storage = new DatabaseStorage();
