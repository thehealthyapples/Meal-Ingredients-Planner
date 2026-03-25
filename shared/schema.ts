import { pgTable, text, serial, integer, real, boolean, unique, timestamp, varchar, index, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  firstName: text("first_name"),
  profilePhotoUrl: text("profile_photo_url"),
  measurementPreference: text("measurement_preference").notNull().default("metric"),
  preferredPriceTier: text("preferred_price_tier").notNull().default("standard"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  starterMealsLoaded: boolean("starter_meals_loaded").notNull().default(false),
  isBetaUser: boolean("is_beta_user").notNull().default(false),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  dietPattern: text("diet_pattern"),
  dietRestrictions: text("diet_restrictions").array(),
  eatingSchedule: text("eating_schedule"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  role: text("role").notNull().default("user"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  subscriptionStatus: text("subscription_status"),
  subscriptionExpiresAt: timestamp("subscription_expires_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isDemo: boolean("is_demo").notNull().default(false),
  demoExpiresAt: timestamp("demo_expires_at", { withTimezone: true }),
  demoClaimedEmail: text("demo_claimed_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
});

export const mealCategories = pgTable("meal_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const mealTemplates = pgTable("meal_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("dinner"),
  description: text("description"),
  imageUrl: text("image_url"),
  defaultCalories: integer("default_calories"),
  defaultProtein: integer("default_protein"),
  defaultCarbs: integer("default_carbs"),
  defaultFat: integer("default_fat"),
  // shared-meal / personal-plate fields
  title: text("title"),
  cuisine: text("cuisine"),
  sharedBaseComponents: text("shared_base_components").array(),
  proteinSlots: text("protein_slots").array(),
  carbSlots: text("carb_slots").array(),
  vegSlots: text("veg_slots").array(),
  toppingSlots: text("topping_slots").array(),
  sauceSlots: text("sauce_slots").array(),
  compatibleDiets: text("compatible_diets").array(),
  estimatedTotalTime: integer("estimated_total_time"),
  estimatedExtraTimePerVariant: integer("estimated_extra_time_per_variant"),
  costBand: text("cost_band"),
  isActive: boolean("is_active").notNull().default(true),
});

export const mealTemplateProducts = pgTable("meal_template_products", {
  id: serial("id").primaryKey(),
  mealTemplateId: integer("meal_template_id").notNull(),
  productName: text("product_name").notNull(),
  brand: text("brand"),
  store: text("store"),
  qualityTier: text("quality_tier").notNull().default("standard"),
  estimatedPrice: real("estimated_price"),
  upfScore: integer("upf_score"),
  thaRating: integer("smp_rating"),
  imageUrl: text("image_url"),
  barcode: text("barcode"),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  ingredients: text("ingredients").array().notNull(),
  instructions: text("instructions").array(),
  imageUrl: text("image_url"),
  servings: integer("servings").notNull().default(1),
  categoryId: integer("category_id"),
  sourceUrl: text("source_url"),
  mealTemplateId: integer("meal_template_id").references(() => mealTemplates.id),
  mealSourceType: text("meal_source_type").notNull().default("scratch"),
  isReadyMeal: boolean("is_ready_meal").notNull().default(false),
  isSystemMeal: boolean("is_system_meal").notNull().default(false),
  mealFormat: text("meal_format").notNull().default("recipe"),
  dietTypes: text("diet_types").array().notNull().default([]),
  isFreezerEligible: boolean("is_freezer_eligible").notNull().default(true),
  audience: text("audience").notNull().default("adult"),
  isDrink: boolean("is_drink").notNull().default(false),
  drinkType: text("drink_type"),
  barcode: text("barcode"),
  brand: text("brand"),
  originalMealId: integer("original_meal_id"),
  kind: text("kind").notNull().default("meal"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const nutrition = pgTable("nutrition", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").notNull(),
  calories: text("calories"),
  protein: text("protein"),
  carbs: text("carbs"),
  fat: text("fat"),
  sugar: text("sugar"),
  salt: text("salt"),
  source: text("source"),
});

export const normalizedIngredients = pgTable("normalized_ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  category: text("category").notNull().default("other"),
});

export const groceryProducts = pgTable("grocery_products", {
  id: serial("id").primaryKey(),
  ingredientName: text("ingredient_name").notNull(),
  name: text("name").notNull(),
  brand: text("brand"),
  imageUrl: text("image_url"),
  weight: text("weight"),
  supermarket: text("supermarket").notNull(),
  tier: text("tier").notNull().default("standard"),
  price: real("price"),
  currency: text("currency").notNull().default("GBP"),
  productUrl: text("product_url"),
  pricePerUnit: text("price_per_unit"),
});

export const shoppingList = pgTable("shopping_list", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  householdId: integer("household_id"),
  addedByUserId: integer("added_by_user_id"),
  productName: text("product_name").notNull(),
  normalizedName: text("normalized_name"),
  quantityValue: real("quantity_value"),
  unit: text("unit"),
  quantityInGrams: real("quantity_in_grams"),
  imageUrl: text("image_url"),
  quantity: integer("quantity").notNull().default(1),
  brand: text("brand"),
  category: text("category"),
  selectedTier: text("selected_tier"),
  ingredientId: integer("ingredient_id"),
  matchedProductId: text("matched_product_id"),
  matchedStore: text("matched_store"),
  matchedPrice: real("matched_price"),
  availableStores: text("available_stores"),
  thaRating: integer("smp_rating"),
  checked: boolean("checked").notNull().default(false),
  needsReview: boolean("needs_review").notNull().default(false),
  validationNote: text("validation_note"),
  selectedStore: text("selected_store"),
  itemType: text("item_type"),
  variantSelections: text("variant_selections"),
  attributePreferences: text("attribute_preferences"),
  confidenceLevel: text("confidence_level"),
  confidenceReason: text("confidence_reason"),
  basketLabel: text("basket_label"),
});

export const productMatches = pgTable("product_matches", {
  id: serial("id").primaryKey(),
  shoppingListItemId: integer("shopping_list_item_id").notNull(),
  supermarket: text("supermarket").notNull(),
  productName: text("product_name").notNull(),
  price: real("price"),
  pricePerUnit: text("price_per_unit"),
  productUrl: text("product_url"),
  imageUrl: text("image_url"),
  currency: text("currency").notNull().default("GBP"),
  tier: text("tier").notNull().default("standard"),
  productWeight: text("product_weight"),
  tescoProductId: text("tesco_product_id"),
  sainsburysProductId: text("sainsburys_product_id"),
  ocadoProductId: text("ocado_product_id"),
  thaRating: integer("smp_rating"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMealSchema = createInsertSchema(meals).pick({
  name: true,
  ingredients: true,
  instructions: true,
  imageUrl: true,
  servings: true,
  categoryId: true,
  sourceUrl: true,
  mealTemplateId: true,
  mealSourceType: true,
  isReadyMeal: true,
  isSystemMeal: true,
  mealFormat: true,
  dietTypes: true,
  isFreezerEligible: true,
  audience: true,
  isDrink: true,
  drinkType: true,
  barcode: true,
  brand: true,
  originalMealId: true,
  kind: true,
});

export const updateMealSchema = createInsertSchema(meals).pick({
  name: true,
  ingredients: true,
  instructions: true,
  servings: true,
  kind: true,
}).partial();

export type UpdateMeal = z.infer<typeof updateMealSchema>;

export const insertNutritionSchema = createInsertSchema(nutrition).pick({
  mealId: true,
  calories: true,
  protein: true,
  carbs: true,
  fat: true,
  sugar: true,
  salt: true,
  source: true,
});

export const mealAllergens = pgTable("meal_allergens", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").notNull(),
  allergen: text("allergen").notNull(),
});

export const ingredientSwaps = pgTable("ingredient_swaps", {
  id: serial("id").primaryKey(),
  original: text("original").notNull(),
  healthier: text("healthier").notNull(),
});

export const insertNormalizedIngredientSchema = createInsertSchema(normalizedIngredients).pick({
  name: true,
  normalizedName: true,
  category: true,
});

export const insertGroceryProductSchema = createInsertSchema(groceryProducts).pick({
  ingredientName: true,
  name: true,
  brand: true,
  imageUrl: true,
  weight: true,
  supermarket: true,
  tier: true,
  price: true,
  currency: true,
  productUrl: true,
  pricePerUnit: true,
});

export const insertShoppingListItemSchema = createInsertSchema(shoppingList).pick({
  productName: true,
  normalizedName: true,
  quantityValue: true,
  unit: true,
  quantityInGrams: true,
  imageUrl: true,
  quantity: true,
  brand: true,
  category: true,
  selectedTier: true,
  ingredientId: true,
  matchedProductId: true,
  matchedStore: true,
  matchedPrice: true,
  availableStores: true,
  thaRating: true,
  checked: true,
  needsReview: true,
  validationNote: true,
  selectedStore: true,
  basketLabel: true,
});

export const insertProductMatchSchema = createInsertSchema(productMatches).pick({
  shoppingListItemId: true,
  supermarket: true,
  productName: true,
  price: true,
  pricePerUnit: true,
  productUrl: true,
  imageUrl: true,
  currency: true,
  tier: true,
  productWeight: true,
  tescoProductId: true,
  sainsburysProductId: true,
  ocadoProductId: true,
  thaRating: true,
});

export const insertMealAllergenSchema = createInsertSchema(mealAllergens).pick({
  mealId: true,
  allergen: true,
});

export const insertIngredientSwapSchema = createInsertSchema(ingredientSwaps).pick({
  original: true,
  healthier: true,
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weekStart: text("week_start").notNull(),
  name: text("name").notNull(),
  calorieTarget: integer("calorie_target"),
  peopleCount: integer("people_count").notNull().default(1),
});

export const mealPlanEntries = pgTable("meal_plan_entries", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  slot: text("slot").notNull(),
  mealId: integer("meal_id").notNull(),
  mealTemplateId: integer("meal_template_id"),
  resolvedSourceType: text("resolved_source_type"),
});

export const plannerWeeks = pgTable("planner_weeks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  householdId: integer("household_id"),
  weekNumber: integer("week_number").notNull(),
  weekName: text("week_name").notNull(),
}, (table) => [
  unique("planner_weeks_user_week_unique").on(table.userId, table.weekNumber),
]);

export const plannerDays = pgTable("planner_days", {
  id: serial("id").primaryKey(),
  weekId: integer("week_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
}, (table) => [
  unique("planner_days_week_day_unique").on(table.weekId, table.dayOfWeek),
]);

export const plannerEntries = pgTable("planner_entries", {
  id: serial("id").primaryKey(),
  dayId: integer("day_id").notNull(),
  mealType: text("meal_type").notNull(),
  audience: text("audience").notNull().default("adult"),
  mealId: integer("meal_id").notNull(),
  calories: integer("calories").default(0),
  isDrink: boolean("is_drink").notNull().default(false),
  drinkType: text("drink_type"),
  position: integer("position").notNull().default(0),
});

export const diets = pgTable("diets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const mealDiets = pgTable("meal_diets", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").notNull(),
  dietId: integer("diet_id").notNull(),
});

export const insertMealCategorySchema = createInsertSchema(mealCategories).pick({
  name: true,
});

export const insertDietSchema = createInsertSchema(diets).pick({
  name: true,
});

export const insertMealDietSchema = createInsertSchema(mealDiets).pick({
  mealId: true,
  dietId: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).pick({
  weekStart: true,
  name: true,
  calorieTarget: true,
  peopleCount: true,
});

export const insertMealPlanEntrySchema = createInsertSchema(mealPlanEntries).pick({
  planId: true,
  dayOfWeek: true,
  slot: true,
  mealId: true,
  mealTemplateId: true,
  resolvedSourceType: true,
});

export const insertPlannerWeekSchema = createInsertSchema(plannerWeeks).pick({
  weekNumber: true,
  weekName: true,
});

export const insertPlannerDaySchema = createInsertSchema(plannerDays).pick({
  weekId: true,
  dayOfWeek: true,
});

export const insertPlannerEntrySchema = createInsertSchema(plannerEntries).pick({
  dayId: true,
  mealType: true,
  audience: true,
  mealId: true,
  calories: true,
  isDrink: true,
  drinkType: true,
  position: true,
});

export const updatePlannerWeekSchema = z.object({
  weekName: z.string().min(1).max(100),
});

export const upsertPlannerEntrySchema = z.object({
  dayId: z.number().int().positive(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snacks"]),
  audience: z.enum(["adult", "baby", "child"]).default("adult"),
  mealId: z.number().int().positive().nullable(),
  calories: z.number().int().min(0).optional().default(0),
  isDrink: z.boolean().optional().default(false),
  drinkType: z.enum(["soft", "alcohol"]).nullable().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MealCategory = typeof mealCategories.$inferSelect;
export type InsertMealCategory = z.infer<typeof insertMealCategorySchema>;
export type Meal = typeof meals.$inferSelect;
export type MealSummary = Omit<Meal, 'ingredients' | 'instructions'> & {
  ingredientCount: number;
};
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Nutrition = typeof nutrition.$inferSelect;
export type InsertNutrition = z.infer<typeof insertNutritionSchema>;
export type ShoppingListItem = typeof shoppingList.$inferSelect;
export type InsertShoppingListItem = z.infer<typeof insertShoppingListItemSchema>;
export type MealAllergen = typeof mealAllergens.$inferSelect;
export type InsertMealAllergen = z.infer<typeof insertMealAllergenSchema>;
export type IngredientSwap = typeof ingredientSwaps.$inferSelect;
export type InsertIngredientSwap = z.infer<typeof insertIngredientSwapSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlanEntry = typeof mealPlanEntries.$inferSelect;
export type InsertMealPlanEntry = z.infer<typeof insertMealPlanEntrySchema>;
export type Diet = typeof diets.$inferSelect;
export type InsertDiet = z.infer<typeof insertDietSchema>;
export type MealDiet = typeof mealDiets.$inferSelect;
export type InsertMealDiet = z.infer<typeof insertMealDietSchema>;
export type PlannerWeek = typeof plannerWeeks.$inferSelect;
export type InsertPlannerWeek = z.infer<typeof insertPlannerWeekSchema>;
export type PlannerDay = typeof plannerDays.$inferSelect;
export type InsertPlannerDay = z.infer<typeof insertPlannerDaySchema>;
export type PlannerEntry = typeof plannerEntries.$inferSelect;
export type InsertPlannerEntry = z.infer<typeof insertPlannerEntrySchema>;

export const supermarketLinks = pgTable("supermarket_links", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  searchUrl: text("search_url").notNull(),
  logoUrl: text("logo_url"),
});

export const insertSupermarketLinkSchema = createInsertSchema(supermarketLinks).pick({
  name: true,
  country: true,
  searchUrl: true,
  logoUrl: true,
});

export type SupermarketLink = typeof supermarketLinks.$inferSelect;
export type InsertSupermarketLink = z.infer<typeof insertSupermarketLinkSchema>;
export type ProductMatch = typeof productMatches.$inferSelect;
export type InsertProductMatch = z.infer<typeof insertProductMatchSchema>;

export const ingredientSources = pgTable("ingredient_sources", {
  id: serial("id").primaryKey(),
  shoppingListItemId: integer("shopping_list_item_id").notNull(),
  mealId: integer("meal_id").notNull(),
  mealName: text("meal_name").notNull(),
  quantityMultiplier: integer("quantity_multiplier").notNull().default(1),
  weekNumber: integer("week_number"),
  dayOfWeek: integer("day_of_week"),
  mealSlot: text("meal_slot"),
});

export const insertIngredientSourceSchema = createInsertSchema(ingredientSources).pick({
  shoppingListItemId: true,
  mealId: true,
  mealName: true,
  quantityMultiplier: true,
  weekNumber: true,
  dayOfWeek: true,
  mealSlot: true,
});

export type IngredientSource = typeof ingredientSources.$inferSelect;
export type InsertIngredientSource = z.infer<typeof insertIngredientSourceSchema>;

export type NormalizedIngredient = typeof normalizedIngredients.$inferSelect;
export type InsertNormalizedIngredient = z.infer<typeof insertNormalizedIngredientSchema>;
export type GroceryProduct = typeof groceryProducts.$inferSelect;
export type InsertGroceryProduct = z.infer<typeof insertGroceryProductSchema>;

export const additives = pgTable("additives", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  riskLevel: text("risk_level").notNull().default("low"),
  description: text("description"),
  isRegulatory: boolean("is_regulatory").default(false),
});

export const productAdditives = pgTable("product_additives", {
  id: serial("id").primaryKey(),
  productBarcode: text("product_barcode").notNull(),
  additiveId: integer("additive_id").notNull(),
});

export const insertAdditiveSchema = createInsertSchema(additives).pick({
  name: true,
  type: true,
  riskLevel: true,
  description: true,
});

export const insertProductAdditiveSchema = createInsertSchema(productAdditives).pick({
  productBarcode: true,
  additiveId: true,
});

export type Additive = typeof additives.$inferSelect;
export type InsertAdditive = z.infer<typeof insertAdditiveSchema>;
export type ProductAdditive = typeof productAdditives.$inferSelect;
export type InsertProductAdditive = z.infer<typeof insertProductAdditiveSchema>;

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  dietTypes: text("diet_types").array().notNull().default([]),
  excludedIngredients: text("excluded_ingredients").array().notNull().default([]),
  healthGoals: text("health_goals").array().notNull().default([]),
  budgetLevel: text("budget_level").notNull().default("standard"),
  preferredStores: text("preferred_stores").array().notNull().default([]),
  upfSensitivity: text("upf_sensitivity").notNull().default("moderate"),
  qualityPreference: text("quality_preference").notNull().default("standard"),
  calorieTarget: integer("calorie_target"),
  calorieMode: text("calorie_mode").notNull().default("auto"),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  activityLevel: text("activity_level").notNull().default("moderate"),
  goalType: text("goal_type").notNull().default("maintain"),
  adultsCount: integer("adults_count").notNull().default(1),
  childrenCount: integer("children_count").notNull().default(0),
  babiesCount: integer("babies_count").notNull().default(0),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  eliteTrackingEnabled: boolean("elite_tracking_enabled").notNull().default(true),
  healthTrendEnabled: boolean("health_trend_enabled").notNull().default(true),
  barcodeScannerEnabled: boolean("barcode_scanner_enabled").notNull().default(true),
  plannerShowCalories: boolean("planner_show_calories").notNull().default(true),
  plannerEnableBabyMeals: boolean("planner_enable_baby_meals").notNull().default(false),
  plannerEnableChildMeals: boolean("planner_enable_child_meals").notNull().default(false),
  plannerEnableDrinks: boolean("planner_enable_drinks").notNull().default(false),
  preferredIngredients: text("preferred_ingredients").array().notNull().default([]),
  maxPrepTolerance: integer("max_prep_tolerance"),
  mealMode: text("meal_mode").notNull().default("exact"),
  maxExtraPrepMinutes: integer("max_extra_prep_minutes"),
  maxTotalCookTime: integer("max_total_cook_time"),
  preferLessProcessed: boolean("prefer_less_processed").notNull().default(false),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  dietTypes: true,
  excludedIngredients: true,
  healthGoals: true,
  budgetLevel: true,
  preferredStores: true,
  upfSensitivity: true,
  qualityPreference: true,
  calorieTarget: true,
  calorieMode: true,
  heightCm: true,
  weightKg: true,
  activityLevel: true,
  goalType: true,
  adultsCount: true,
  childrenCount: true,
  babiesCount: true,
  soundEnabled: true,
  eliteTrackingEnabled: true,
  healthTrendEnabled: true,
  barcodeScannerEnabled: true,
  plannerShowCalories: true,
  plannerEnableBabyMeals: true,
  plannerEnableChildMeals: true,
  plannerEnableDrinks: true,
  preferredIngredients: true,
  maxPrepTolerance: true,
  mealMode: true,
  maxExtraPrepMinutes: true,
  maxTotalCookTime: true,
  preferLessProcessed: true,
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export const userStreaks = pgTable("user_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  currentEliteStreak: integer("current_elite_streak").notNull().default(0),
  bestEliteStreak: integer("best_elite_streak").notNull().default(0),
  lastEliteDate: text("last_elite_date"),
  weeklyEliteCount: integer("weekly_elite_count").notNull().default(0),
  weekStartDate: text("week_start_date"),
});

export const insertUserStreakSchema = createInsertSchema(userStreaks).pick({
  currentEliteStreak: true,
  bestEliteStreak: true,
  lastEliteDate: true,
  weeklyEliteCount: true,
  weekStartDate: true,
});

export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertUserStreak = z.infer<typeof insertUserStreakSchema>;

export const userHealthTrends = pgTable("user_health_trends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  averageThaRating: real("average_smp_rating").notNull(),
  eliteCount: integer("elite_count").notNull().default(0),
  processedCount: integer("processed_count").notNull().default(0),
  sampleCount: integer("sample_count").notNull().default(0),
});

export const insertUserHealthTrendSchema = createInsertSchema(userHealthTrends).pick({
  date: true,
  averageThaRating: true,
  eliteCount: true,
  processedCount: true,
  sampleCount: true,
});

export type UserHealthTrend = typeof userHealthTrends.$inferSelect;
export type InsertUserHealthTrend = z.infer<typeof insertUserHealthTrendSchema>;

export const productHistory = pgTable("product_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  barcode: text("barcode"),
  productName: text("product_name").notNull(),
  brand: text("brand"),
  imageUrl: text("image_url"),
  novaGroup: integer("nova_group"),
  nutriscoreGrade: text("nutriscore_grade"),
  thaRating: integer("smp_rating"),
  upfScore: integer("upf_score"),
  healthScore: integer("health_score"),
  scannedAt: text("scanned_at").notNull(),
  source: text("source").notNull().default("search"),
});

export const insertProductHistorySchema = createInsertSchema(productHistory).omit({
  id: true,
  userId: true,
});

export type ProductHistory = typeof productHistory.$inferSelect;
export type InsertProductHistory = z.infer<typeof insertProductHistorySchema>;

export const freezerMeals = pgTable("freezer_meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  householdId: integer("household_id"),
  mealId: integer("meal_id").notNull(),
  totalPortions: integer("total_portions").notNull().default(1),
  remainingPortions: integer("remaining_portions").notNull().default(1),
  frozenDate: text("frozen_date").notNull(),
  expiryDate: text("expiry_date"),
  batchLabel: text("batch_label"),
  notes: text("notes"),
});

export const insertFreezerMealSchema = createInsertSchema(freezerMeals).omit({
  id: true,
  userId: true,
});

export type FreezerMeal = typeof freezerMeals.$inferSelect;
export type InsertFreezerMeal = z.infer<typeof insertFreezerMealSchema>;

export const basketItems = pgTable("basket_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mealId: integer("meal_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const insertBasketItemSchema = createInsertSchema(basketItems).pick({
  mealId: true,
  quantity: true,
});

export type BasketItem = typeof basketItems.$inferSelect;
export type InsertBasketItem = z.infer<typeof insertBasketItemSchema>;

export const insertMealTemplateSchema = createInsertSchema(mealTemplates).pick({
  name: true,
  category: true,
  description: true,
  imageUrl: true,
  defaultCalories: true,
  defaultProtein: true,
  defaultCarbs: true,
  defaultFat: true,
  title: true,
  cuisine: true,
  sharedBaseComponents: true,
  proteinSlots: true,
  carbSlots: true,
  vegSlots: true,
  toppingSlots: true,
  sauceSlots: true,
  compatibleDiets: true,
  estimatedTotalTime: true,
  estimatedExtraTimePerVariant: true,
  costBand: true,
  isActive: true,
});

export const insertMealTemplateProductSchema = createInsertSchema(mealTemplateProducts).pick({
  mealTemplateId: true,
  productName: true,
  brand: true,
  store: true,
  qualityTier: true,
  estimatedPrice: true,
  upfScore: true,
  imageUrl: true,
  barcode: true,
});

export type MealTemplate = typeof mealTemplates.$inferSelect;
export type InsertMealTemplate = z.infer<typeof insertMealTemplateSchema>;
export type MealTemplateProduct = typeof mealTemplateProducts.$inferSelect;
export type InsertMealTemplateProduct = z.infer<typeof insertMealTemplateProductSchema>;

// ─── Meal Plan Templates ───────────────────────────────────────────────────────

export const mealPlanTemplates = pgTable("meal_plan_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false),
  isPremium: boolean("is_premium").notNull().default(false),
  ownerUserId: integer("owner_user_id"),
  season: text("season"),
  status: text("status").notNull().default("published"),
  createdBy: integer("created_by"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  shareToken: text("share_token"),
  visibility: text("visibility").notNull().default("private"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("meal_plan_templates_owner_idx").on(table.ownerUserId),
  index("meal_plan_templates_status_idx").on(table.status),
]);

export const mealPlanTemplateItems = pgTable(
  "meal_plan_template_items",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    templateId: varchar("template_id")
      .notNull()
      .references(() => mealPlanTemplates.id, { onDelete: "cascade" }),
    weekNumber: integer("week_number").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    mealSlot: text("meal_slot").notNull(),
    mealId: integer("meal_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueSlot: unique().on(table.templateId, table.weekNumber, table.dayOfWeek, table.mealSlot),
  })
);

export const insertMealPlanTemplateSchema = createInsertSchema(mealPlanTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMealPlanTemplateItemSchema = createInsertSchema(mealPlanTemplateItems).omit({
  id: true,
  createdAt: true,
});

export type MealPlanTemplate = typeof mealPlanTemplates.$inferSelect;
export type InsertMealPlanTemplate = z.infer<typeof insertMealPlanTemplateSchema>;
export type MealPlanTemplateItem = typeof mealPlanTemplateItems.$inferSelect;
export type InsertMealPlanTemplateItem = z.infer<typeof insertMealPlanTemplateItemSchema>;

// ─── Admin Audit Log ──────────────────────────────────────────────────────────

export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  targetUserId: integer("target_user_id").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog).omit({
  id: true,
  createdAt: true,
});

export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;

export const userPantryItems = pgTable("user_pantry_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  householdId: integer("household_id"),
  ingredientKey: text("ingredient_key").notNull(),
  displayName: text("display_name"),
  category: text("category").notNull().default("larder"),
  defaultHave: boolean("default_have").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserPantryItemSchema = createInsertSchema(userPantryItems).omit({
  id: true,
  createdAt: true,
});

export type UserPantryItem = typeof userPantryItems.$inferSelect;
export type InsertUserPantryItem = z.infer<typeof insertUserPantryItemSchema>;

export const shoppingListExtras = pgTable("shopping_list_extras", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  householdId: integer("household_id"),
  name: text("name").notNull(),
  category: text("category").notNull().default("household"),
  alwaysAdd: boolean("always_add").notNull().default(false),
  inBasket: boolean("in_basket").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertShoppingListExtraSchema = createInsertSchema(shoppingListExtras).omit({
  id: true,
  createdAt: true,
});

export type ShoppingListExtra = typeof shoppingListExtras.$inferSelect;
export type InsertShoppingListExtra = z.infer<typeof insertShoppingListExtraSchema>;

export const mealPairings = pgTable("meal_pairings", {
  id: serial("id").primaryKey(),
  baseMealId: integer("base_meal_id").notNull().references(() => meals.id, { onDelete: "cascade" }),
  suggestedMealId: integer("suggested_meal_id").notNull().references(() => meals.id, { onDelete: "cascade" }),
  note: text("note"),
  priority: integer("priority").notNull().default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMealPairingSchema = createInsertSchema(mealPairings).omit({
  id: true,
  createdAt: true,
});

export type MealPairing = typeof mealPairings.$inferSelect;
export type InsertMealPairing = z.infer<typeof insertMealPairingSchema>;

export const ingredientProducts = pgTable("ingredient_products", {
  id: serial("id").primaryKey(),
  ingredientKey: text("ingredient_key").notNull(),
  productName: text("product_name").notNull(),
  retailer: text("retailer").notNull(),
  size: text("size"),
  notes: text("notes"),
  tags: jsonb("tags"),
  priority: integer("priority").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIngredientProductSchema = createInsertSchema(ingredientProducts).omit({
  id: true,
  createdAt: true,
});

export type IngredientProduct = typeof ingredientProducts.$inferSelect;
export type InsertIngredientProduct = z.infer<typeof insertIngredientProductSchema>;

export const recipeSourceSettings = pgTable("recipe_source_settings", {
  id: serial("id").primaryKey(),
  sourceKey: text("source_key").notNull().unique(),
  enabled: boolean("enabled").notNull().default(true),
  sourceType: text("source_type").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  adminUpdatedAt: timestamp("admin_updated_at", { withTimezone: true }),
});

export const insertRecipeSourceSettingsSchema = createInsertSchema(recipeSourceSettings).omit({
  id: true,
  updatedAt: true,
  adminUpdatedAt: true,
});

export type RecipeSourceSettings = typeof recipeSourceSettings.$inferSelect;
export type InsertRecipeSourceSettings = z.infer<typeof insertRecipeSourceSettingsSchema>;

export const recipeSourceAuditLog = pgTable("recipe_source_audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  sourceName: text("source_name").notNull(),
  urlOrQuery: text("url_or_query"),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRecipeSourceAuditLogSchema = createInsertSchema(recipeSourceAuditLog).omit({
  id: true,
  createdAt: true,
});

export type RecipeSourceAuditLog = typeof recipeSourceAuditLog.$inferSelect;
export type InsertRecipeSourceAuditLog = z.infer<typeof insertRecipeSourceAuditLogSchema>;

// ─── Household System ─────────────────────────────────────────────────────────

export const households = pgTable("households", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const householdMembers = pgTable("household_members", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  invitedByUserId: integer("invited_by_user_id"),
  leftAt: timestamp("left_at", { withTimezone: true }),
}, (table) => [
  unique("household_members_household_user_unique").on(table.householdId, table.userId),
]);

export const insertHouseholdSchema = createInsertSchema(households).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHouseholdMemberSchema = createInsertSchema(householdMembers).omit({
  id: true,
});

export type Household = typeof households.$inferSelect;
export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type HouseholdMember = typeof householdMembers.$inferSelect;
export type InsertHouseholdMember = z.infer<typeof insertHouseholdMemberSchema>;

// ─── My Diary ─────────────────────────────────────────────────────────────────

export const foodDiaryDays = pgTable("food_diary_days", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("food_diary_days_user_date_unique").on(table.userId, table.date),
]);

export const foodDiaryEntries = pgTable("food_diary_entries", {
  id: serial("id").primaryKey(),
  dayId: integer("day_id").notNull().references(() => foodDiaryDays.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mealSlot: text("meal_slot").notNull(),
  name: text("name").notNull(),
  notes: text("notes"),
  sourceType: text("source_type").notNull().default("manual"),
  sourcePlannerEntryId: integer("source_planner_entry_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const foodDiaryMetrics = pgTable("food_diary_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  weightKg: real("weight_kg"),
  bmi: real("bmi"),
  moodApples: integer("mood_apples"),
  sleepHours: real("sleep_hours"),
  energyApples: integer("energy_apples"),
  notes: text("notes"),
  stuckToPlan: boolean("stuck_to_plan"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("food_diary_metrics_user_date_unique").on(table.userId, table.date),
]);

export const insertFoodDiaryDaySchema = createInsertSchema(foodDiaryDays).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFoodDiaryEntrySchema = createInsertSchema(foodDiaryEntries).omit({ id: true, createdAt: true });
export const insertFoodDiaryMetricsSchema = createInsertSchema(foodDiaryMetrics).omit({ id: true, createdAt: true });

export type FoodDiaryDay = typeof foodDiaryDays.$inferSelect;
export type InsertFoodDiaryDay = z.infer<typeof insertFoodDiaryDaySchema>;
export type FoodDiaryEntry = typeof foodDiaryEntries.$inferSelect;
export type InsertFoodDiaryEntry = z.infer<typeof insertFoodDiaryEntrySchema>;
export type FoodDiaryMetrics = typeof foodDiaryMetrics.$inferSelect;
export type InsertFoodDiaryMetrics = z.infer<typeof insertFoodDiaryMetricsSchema>;

export const foodKnowledge = pgTable("food_knowledge", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  shortSummary: text("short_summary"),
  whyThaHighlightsThis: text("why_tha_highlights_this"),
  whatToKnow: text("what_to_know"),
  whoItMattersTo: text("who_it_matters_to"),
  simplerAlternatives: text("simpler_alternatives"),
  tags: text("tags").array(),
  source: text("source"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertFoodKnowledgeSchema = createInsertSchema(foodKnowledge).omit({ id: true });
export type FoodKnowledge = typeof foodKnowledge.$inferSelect;
export type InsertFoodKnowledge = z.infer<typeof insertFoodKnowledgeSchema>;

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
