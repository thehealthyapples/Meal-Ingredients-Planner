import { pgTable, text, serial, integer, real, boolean, unique, uniqueIndex, timestamp, varchar, index, jsonb } from "drizzle-orm/pg-core";
import type { AdaptationResult, HouseholdSafeForSnapshot } from "./meal-adaptation";
import type { KnowledgeSourceRef } from "./knowledge/evidence";
import type { GuestEater } from "./household-eater";
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
  emailVerificationExpires: timestamp("email_verification_expires", { withTimezone: true }),
  // CONV1 P4 (OWN-1): diet_pattern / diet_restrictions are RETIRED. A person's diet
  // is owned by their household_eaters row (Register Domain 16; Principle 2) — the
  // pattern lives in default_diet_types as its canonical diet type, restrictions in
  // hard_restrictions. Migration 2026-07-16_conv1_p4_retire_users_diet_columns
  // dropped the columns after gating on zero data loss.
  eatingSchedule: text("eating_schedule"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires", { withTimezone: true }),
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
  customMetricDefs: jsonb("custom_metric_defs").$type<Array<{ id: string; name: string; unit: string }>>(),
  diaryExtraMetrics: jsonb("diary_extra_metrics").$type<string[]>(),
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
  // ── Hybrid Meal Occasion (additive; display/metadata only) ──
  primarySlot: text("primary_slot"),
  suitableSlots: text("suitable_slots").array().notNull().default([]),
  energyBand: text("energy_band"),
  styleTags: text("style_tags").array().notNull().default([]),
  // Editorial "nutrition opportunity" metadata for meal shells (display only).
  nutritionOpportunities: text("nutrition_opportunities").array().notNull().default([]),
});

// RM3 (2026-07-15): `meal_template_products` — a duplicate, denormalized ready-meal
// product representation with no live consumer — was retired under Principle 8. Ready
// meals converge onto the canonical `meals` identity (RM1 §8). Its table is dropped by
// migration `2026-07-15_rm3_retire_meal_template_products`. Do not reintroduce it: a
// packaged product is a `meals` row you buy instead of cook (RM1 §2).

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
  /** True for AI-generated household-safe variant meals. Never true on original recipes. */
  isHouseholdSafeVariant: boolean("is_household_safe_variant").notNull().default(false),
  /** Restriction snapshot recorded at variant creation time. Null on all non-variant meals. */
  householdSafeFor: jsonb("household_safe_for").$type<HouseholdSafeForSnapshot>(),
  /** Disambiguates fork type: null = original, 'edit_copy' = cookbook edit fork, 'household_safe' = AI household variant. */
  variantKind: text("variant_kind"),
  /** Controls whether this variant appears in the cookbook tab. False for all originals; toggled by user in Phase 2. */
  showInCookbook: boolean("show_in_cookbook").notNull().default(false),
  // ── Hybrid Meal Occasion (additive; display/metadata only) ──
  primarySlot: text("primary_slot"),
  suitableSlots: text("suitable_slots").array().notNull().default([]),
  energyBand: text("energy_band"),
  styleTags: text("style_tags").array().notNull().default([]),
  // ── FS3 Recipe Acquisition provenance (canonical; shared/recipe-acquisition.ts owns the vocabulary) ──
  /** Which of the four acquisition lanes this row entered through: tha_library | licensed_discovery | personal_cookbook | community_cookbook. Null only on rows not yet backfilled. */
  acquisitionLane: text("acquisition_lane"),
  /** The acquisition act: authored | licensed_import | user_import | user_transcription | product | derived | community_share. */
  acquisitionType: text("acquisition_type"),
  /** Register key of the source this row was acquired from (shared/recipe-acquisition.ts). Null for authored content. */
  acquisitionSourceKey: text("acquisition_source_key"),
  /** Licence under which THA holds this row (register licenceRef). Null = owned or user-held content. */
  licenceRef: text("licence_ref"),
  /** Attribution line to render wherever this recipe is displayed. Null = no attribution duty. */
  attributionText: text("attribution_text"),
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
  // Explicit origin tag — values: 'quick_list' | 'planner' | 'basket' | null.
  // Nullable & additive: legacy rows pre-2026-05-03 may be NULL, in which case
  // origin still falls back to basket_label prefix + ingredient_sources presence.
  source: text("source"),
  // Guided shop mode state — values: pending | already_got | need_to_buy | in_basket | alternate_selected | deferred
  shopStatus: text("shop_status"),
  // ── Item Resolution Layer ──────────────────────────────────────────────────
  // originalText: raw user input before any normalisation (e.g. "some berries")
  originalText: text("original_text"),
  // canonicalName: authoritative resolved name (e.g. "toilet roll" not "bog roll")
  canonicalName: text("canonical_name"),
  // subcategory: finer classification within a category
  subcategory: text("subcategory"),
  // resolutionState: lifecycle — raw | needs_review | resolved | matched_to_product
  resolutionState: text("resolution_state").default("raw"),
  // reviewReason: machine-readable — unrecognised_item | ambiguous_term | low_confidence | category_conflict
  reviewReason: text("review_reason"),
  // reviewSuggestions: JSON-encoded string[] of specific variants for ambiguous terms
  reviewSuggestions: text("review_suggestions"),
  // cupboardQuantity: how much the user already has at home (partial cupboard check)
  cupboardQuantity: real("cupboard_quantity"),
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
  // "provider" = price came from a real provider result; "estimate" = category-based fallback.
  // null on legacy rows written before this field existed — rendered the same as "provider".
  priceSource: text("price_source"),
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
  isHouseholdSafeVariant: true,
  householdSafeFor: true,
  variantKind: true,
  showInCookbook: true,
  acquisitionLane: true,
  acquisitionType: true,
  acquisitionSourceKey: true,
  licenceRef: true,
  attributionText: true,
}).extend({
  householdSafeFor: z.custom<HouseholdSafeForSnapshot>().nullish(),
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
  source: true,
  shopStatus: true,
  originalText: true,
  canonicalName: true,
  subcategory: true,
  resolutionState: true,
  reviewReason: true,
  reviewSuggestions: true,
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
  priceSource: true,
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
  /** AI-generated household adaptation result. Null until user triggers "Tailor for household". */
  adaptationResult: jsonb("adaptation_result").$type<AdaptationResult>(),
  /** One-off guest eaters for this entry only. Phase 5. */
  guestEaters: jsonb("guest_eaters").$type<GuestEater[]>(),
  /** Original meal ID before the entry was repointed to a household-safe variant. Null if no variant accepted. */
  originalMealIdBeforeVariant: integer("original_meal_id_before_variant"),
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
export type { GuestEater } from "./household-eater";
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
  /** Meal context captured at add-to-list time (Phase 6 equivalent). */
  eaterIds: integer("eater_ids").array(),
  guestEaters: jsonb("guest_eaters").$type<GuestEater[]>(),
});

export const insertIngredientSourceSchema = createInsertSchema(ingredientSources).pick({
  shoppingListItemId: true,
  mealId: true,
  mealName: true,
  quantityMultiplier: true,
  weekNumber: true,
  dayOfWeek: true,
  mealSlot: true,
  eaterIds: true,
  guestEaters: true,
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
  aliases: text("aliases").array(),
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
  includeRegulatoryAdditivesInScoring: boolean("include_regulatory_additives_in_scoring").notNull().default(true),
  // OD1 — Opportunity Delivery Framework: opportunity `type` values (e.g.
  // "planner-empty-day") the user has muted. Filtered out before delivery;
  // empty means no muting, never a fabricated default preference.
  mutedOpportunityTypes: text("muted_opportunity_types").array().notNull().default([]),
  // EWO2/CP2 — the user's chosen Companion voice. One column, one owner: this
  // is the ONLY store of the personality choice (INT21 §5.1). The Behaviour
  // Engine reads it fresh every turn via the gateway and normalises any
  // unrecognised value to the platform default, so a bad row degrades to the
  // default voice rather than an error. Declared here by CP2: the column has
  // existed in Postgres since EWO2 but was never added to this schema, so
  // Drizzle omitted it from every SELECT and the value was invisible at
  // runtime — every user silently received the default voice.
  companionPersonality: text("companion_personality").notNull().default("companion"),
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
  includeRegulatoryAdditivesInScoring: true,
  mutedOpportunityTypes: true,
  companionPersonality: true,
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
  primarySlot: true,
  suitableSlots: true,
  energyBand: true,
  styleTags: true,
  nutritionOpportunities: true,
});

export type MealTemplate = typeof mealTemplates.$inferSelect;
export type InsertMealTemplate = z.infer<typeof insertMealTemplateSchema>;
// RM3: MealTemplateProduct / InsertMealTemplateProduct removed with the retired table above.

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

// ─── Companion Learning (INT35C) ───────────────────────────────────────────────
// Single canonical owner: server/intelligence/conversation/companion-learning-store.ts
// (see docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md).
//
// companion_health_snapshots: a point-in-time capture of the aggregate Companion
// observability summary (INT35B) + gap classification (INT35C) + turn-count
// denominator. Same privacy class as the INT35 miss log it is built from: no
// user id, no household id, no intent parameters, no capability result payloads
// — only aggregate counts and already-anonymised/truncated utterance text.
//
// companion_learning_recommendations: the admin review queue. Every row is an
// ADVISORY proposal (matcher / capability / regression-test). `status` is a
// human triage signal only — there is no `applied` column and no code path from
// this table to production routing. Acting on an "approved" row remains a
// separate, human, code-reviewed edit (e.g. to PatternIntentResolver), per the
// INT35B hard rule this workstream inherits unchanged.

export const companionHealthSnapshots = pgTable("companion_health_snapshots", {
  id: serial("id").primaryKey(),
  totalEvents: integer("total_events").notNull(),
  totalTurns: integer("total_turns").notNull(),
  byStage: jsonb("by_stage").notNull(),
  byState: jsonb("by_state").notNull(),
  bySurface: jsonb("by_surface").notNull(),
  gapCounts: jsonb("gap_counts").notNull(),
  topUnmatchedUtterances: jsonb("top_unmatched_utterances").notNull(),
  routingFailures: jsonb("routing_failures").notNull(),
  capabilityGapClusters: jsonb("capability_gap_clusters").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCompanionHealthSnapshotSchema = createInsertSchema(companionHealthSnapshots).omit({
  id: true,
  createdAt: true,
});

export type CompanionHealthSnapshot = typeof companionHealthSnapshots.$inferSelect;
export type InsertCompanionHealthSnapshot = z.infer<typeof insertCompanionHealthSnapshotSchema>;

export const companionLearningRecommendations = pgTable("companion_learning_recommendations", {
  id: serial("id").primaryKey(),
  snapshotId: integer("snapshot_id").notNull().references(() => companionHealthSnapshots.id),
  kind: text("kind").notNull(), // "matcher" | "capability" | "regression-test"
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected" | "completed"
  payload: jsonb("payload").notNull(),
  rationale: text("rationale").notNull(),
  confidence: text("confidence").notNull().default("low"), // "low" | "medium" | "high"
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCompanionLearningRecommendationSchema = createInsertSchema(companionLearningRecommendations).omit({
  id: true,
  createdAt: true,
});

export type CompanionLearningRecommendation = typeof companionLearningRecommendations.$inferSelect;
export type InsertCompanionLearningRecommendation = z.infer<typeof insertCompanionLearningRecommendationSchema>;

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
  needQuantityValue: real("need_quantity_value"),
  needUnit: text("need_unit"),
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
  /**
   * The household's IANA time zone, e.g. "Europe/London". NULLABLE BY DESIGN.
   *
   * TIME3 / CONV1 P5 (SCH-1). One of Household Time's two facts (HT2), owned here
   * on Domain 16 — an EXISTING owner, extended. No new domain, no new store, no
   * new write funnel. The rules that read it live with their own owner,
   * `shared/time/household-time.ts`, which owns none of this data (HT1).
   *
   * A CLOCK IS A PROPERTY OF THE HOME (HT4) — never of the device, the session or
   * the member. A family on holiday is still a household at home. Per-member zones
   * are refused: they are a different fact at a different scope and would be a
   * split-brain over one shared plan.
   *
   * NULL IS AN HONEST ANSWER, and it means "THA has not been told" — which is not
   * the same as, and must never be silently overwritten by, "THA assumed
   * Europe/London" (CP8; Core Principle 6). Detected at signup from the device and
   * correctable by the household thereafter; when it is NULL, consumers fall back
   * to the DECLARED default in shared/time/household-time.ts, whose provenance is
   * recorded there. A declared default is not fabrication; a silent one is.
   */
  timeZone: text("time_zone"),
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

/**
 * Eaters within a household who meals can be planned for.
 * Supports both linked users (adults with accounts) and children (userId = null).
 */
export const householdEaters = pgTable("household_eaters", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  /** Null for eaters without an account. */
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  /** Soft diet preferences — can be overridden per meal plan. */
  defaultDietTypes: text("default_diet_types").array(),
  /** Hard restrictions — always enforced, never overridable. */
  hardRestrictions: text("hard_restrictions").array(),
}, (table) => [
  // CONV1 P4 (WRITE-3): one eater row per account per household. Without this,
  // concurrent creation could duplicate a person. Account-less eaters (userId NULL)
  // are exempt — a household may declare several people who share no account.
  uniqueIndex("household_eaters_household_user_uniq")
    .on(table.householdId, table.userId)
    .where(sql`user_id IS NOT NULL`),
]);

/**
 * Which household eaters are associated with a specific planner entry.
 */
export const plannerEntryEaters = pgTable("planner_entry_eaters", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull().references(() => plannerEntries.id, { onDelete: "cascade" }),
  householdEaterId: integer("household_eater_id").notNull().references(() => householdEaters.id, { onDelete: "cascade" }),
}, (table) => [
  unique("planner_entry_eaters_entry_member_unique").on(table.entryId, table.householdEaterId),
]);

export const insertHouseholdSchema = createInsertSchema(households).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHouseholdMemberSchema = createInsertSchema(householdMembers).omit({
  id: true,
});

export const insertHouseholdEaterSchema = createInsertSchema(householdEaters).omit({ id: true });

/**
 * Per-week diet override for a household eater.
 * Replaces defaultDietTypes for the duration of this week only.
 * hardRestrictions are never touched.
 */
export const plannerWeekEaterOverrides = pgTable("planner_week_eater_overrides", {
  id: serial("id").primaryKey(),
  weekId: integer("week_id").notNull().references(() => plannerWeeks.id, { onDelete: "cascade" }),
  eaterId: integer("eater_id").notNull().references(() => householdEaters.id, { onDelete: "cascade" }),
  dietTypes: text("diet_types").array().notNull().default([]),
}, (table) => [
  unique("pweo_week_eater_unique").on(table.weekId, table.eaterId),
]);

export type Household = typeof households.$inferSelect;
export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type HouseholdMember = typeof householdMembers.$inferSelect;
export type InsertHouseholdMember = z.infer<typeof insertHouseholdMemberSchema>;
export type HouseholdEaterRow = typeof householdEaters.$inferSelect;
export type InsertHouseholdEater = z.infer<typeof insertHouseholdEaterSchema>;
export type PlannerEntryEater = typeof plannerEntryEaters.$inferSelect;
export type WeekEaterOverride = typeof plannerWeekEaterOverrides.$inferSelect;

// ─── Household Fulfilment Memory ──────────────────────────────────────────────

export const shoppingFulfilmentMemory = pgTable("shopping_fulfilment_memory", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  normalizedItemName: text("normalized_item_name").notNull(),
  originalItemName: text("original_item_name"),
  barcode: text("barcode"),
  productName: text("product_name").notNull(),
  brand: text("brand"),
  thaRating: integer("tha_rating"),
  availableStores: jsonb("available_stores").$type<string[]>(),
  source: text("source").notNull(),
  chosenAt: timestamp("chosen_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("sfm_household_id_idx").on(table.householdId),
  index("sfm_household_item_idx").on(table.householdId, table.normalizedItemName),
]);

export type ShoppingFulfilmentMemoryEntry = typeof shoppingFulfilmentMemory.$inferSelect;

// ─── Weekly Provisioning ───────────────────────────────────────────────────────

export const weekProvisioningItems = pgTable("week_provisioning_items", {
  id: serial("id").primaryKey(),
  weekId: integer("week_id").notNull().references(() => plannerWeeks.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  mealId: integer("meal_id"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WeekProvisioningItem = typeof weekProvisioningItems.$inferSelect;
export type InsertWeekProvisioningItem = typeof weekProvisioningItems.$inferInsert;

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
  customValues: jsonb("custom_values").$type<Record<string, string>>(),
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

// Epic 1: Meal Builder — typed items within a meal
export const mealItems = pgTable("meal_items", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").notNull().references(() => meals.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'recipe' | 'product' | 'manual'
  referenceId: integer("reference_id"), // meals.id for recipe, productHistory.id for product, null for manual
  name: text("name").notNull(),
  quantity: text("quantity"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMealItemSchema = createInsertSchema(mealItems).omit({ id: true, createdAt: true });
export type MealItem = typeof mealItems.$inferSelect;
export type InsertMealItem = z.infer<typeof insertMealItemSchema>;

// ─── Savings Events ────────────────────────────────────────────────────────────
export const savingsEvents = pgTable("savings_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  type: text("type").notNull(), // 'takeaway_avoided' | 'pantry_used' | 'smart_swap'
  amount: real("amount").notNull(),
  sourceId: integer("source_id"),
  sourceType: text("source_type"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavingsEventSchema = createInsertSchema(savingsEvents).omit({ id: true, createdAt: true });
export type SavingsEvent = typeof savingsEvents.$inferSelect;
export type InsertSavingsEvent = z.infer<typeof insertSavingsEventSchema>;

// Epic 3: Usage tracking — recent and frequent items per user
export const userItemUsage = pgTable("user_item_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull(), // 'recipe' | 'product' | 'manual'
  itemId: integer("item_id"),
  itemName: text("item_name").notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
  useCount: integer("use_count").notNull().default(1),
});

// ── Pantry Ingredient Knowledge ────────────────────────────────────────────────
// Shared enrichment cache — one row per canonical ingredient_key.
// Populated from static seed data (source='manual') or OpenAI enrichment
// (source='ai'). Locked rows are never overwritten by AI.
export const pantryIngredientKnowledge = pgTable("pantry_ingredient_knowledge", {
  id: serial("id").primaryKey(),
  ingredientKey: text("ingredient_key").notNull().unique(),
  supports:      text("supports").array().notNull().default(sql`'{}'`),
  highlights:    text("highlights").array(),
  whyItMatters:  text("why_it_matters"),
  goodToKnow:    text("good_to_know"),
  howToChoose:   text("how_to_choose").array(),
  tags:          text("tags").array().notNull().default(sql`'{}'`),
  lastEnrichedAt:    timestamp("last_enriched_at",    { withTimezone: true }),
  enrichmentSource:  text("enrichment_source").notNull().default("manual"),
  enrichmentVersion: integer("enrichment_version").notNull().default(1),
  isLocked:      boolean("is_locked").notNull().default(false),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PantryIngredientKnowledge = typeof pantryIngredientKnowledge.$inferSelect;

// ── Ingredient Classifications ─────────────────────────────────────────────────
// Shared, admin-reviewable classification records — one row per canonical concept.
// Populated by the AI classifier or manually. Reused across all users/households.
// source priority: manual > deterministic > ai
export const ingredientClassifications = pgTable('ingredient_classifications', {
  id: serial('id').primaryKey(),
  normalizedKey:  text('normalized_key').notNull().unique(),
  canonicalName:  text('canonical_name').notNull(),
  canonicalKey:   text('canonical_key').notNull(),
  category:       text('category').notNull(),
  subcategory:    text('subcategory'),
  aliases:        text('aliases'),          // JSON-encoded string[]
  source:         text('source').notNull().default('ai'),        // 'deterministic' | 'ai' | 'manual'
  aiConfidence:   text('ai_confidence'),                         // 'high' | 'medium' | 'low'
  aiModel:        text('ai_model'),
  reviewStatus:   text('review_status').notNull().default('pending'), // 'approved' | 'pending' | 'rejected'
  notes:          text('notes'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insertIngredientClassificationSchema = createInsertSchema(ingredientClassifications)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type IngredientClassification    = typeof ingredientClassifications.$inferSelect;
export type InsertIngredientClassification = z.infer<typeof insertIngredientClassificationSchema>;

// ─── Product Event Tracking ────────────────────────────────────────────────────

import type { ProductEventMetadata } from "./product-events";

export const productEvents = pgTable("product_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  featureArea: text("feature_area").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  householdId: integer("household_id").notNull(),
  // Nullable relational context
  mealId: integer("meal_id"),
  plannerEntryId: integer("planner_entry_id"),
  pantryItemId: integer("pantry_item_id"),
  basketItemId: integer("basket_item_id"),
  productId: integer("product_id"),
  // Sanitised metadata — no raw user input ever stored here
  metadata: jsonb("metadata").$type<ProductEventMetadata>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("product_events_user_id_idx").on(table.userId),
  eventTypeIdx: index("product_events_event_type_idx").on(table.eventType),
  createdAtIdx: index("product_events_created_at_idx").on(table.createdAt),
}));

export type ProductEvent = typeof productEvents.$inferSelect;

// ─── Activity Summary (cached counts) ─────────────────────────────────────────
// One row per user. Current counts are derived from live tables; lifetime counts
// are accumulated on success events only.
export const activitySummary = pgTable("activity_summary", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  householdId: integer("household_id").notNull(),
  // Current counts — re-derived from source tables on each event
  currentShoppingItems: integer("current_shopping_items").notNull().default(0),
  currentPlannerMeals: integer("current_planner_meals").notNull().default(0),
  currentPantryItems: integer("current_pantry_items").notNull().default(0),
  currentRecipes: integer("current_recipes").notNull().default(0),
  // Lifetime counts — incremented on success events only
  lifetimeShoppingAdds: integer("lifetime_shopping_adds").notNull().default(0),
  lifetimePlannerAdds: integer("lifetime_planner_adds").notNull().default(0),
  lifetimePantryAdds: integer("lifetime_pantry_adds").notNull().default(0),
  lifetimeRecipeAdds: integer("lifetime_recipe_adds").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdUnique: unique("activity_summary_user_id_unique").on(table.userId),
}));

export type ActivitySummary = typeof activitySummary.$inferSelect;
export type InsertPantryIngredientKnowledge = typeof pantryIngredientKnowledge.$inferInsert;

// ─── Meal Uplift Applications ─────────────────────────────────────────────────
// Tracks every accepted uplift suggestion with full provenance.
// One row per ingredient added. Supports reversal and audit.

export const mealUpliftApplications = pgTable("meal_uplift_applications", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").notNull().references(() => meals.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Uplift rule provenance
  ruleId: text("rule_id").notNull(),
  ruleName: text("rule_name").notNull(),
  // What was added
  ingredient: text("ingredient").notNull(),
  action: text("action").notNull(), // 'add' | 'swap' | 'boost'
  quantity: text("quantity"),
  explanation: text("explanation").notNull(),
  // Origin marker — always 'tha_uplift' for engine-generated suggestions
  addedBy: text("added_by").notNull().default("tha_uplift"),
  // Optional context
  plannerEntryId: integer("planner_entry_id"),
  // If the meal was forked from a system meal to protect the original
  forkedFromMealId: integer("forked_from_meal_id"),
  // Lifecycle state: 'accepted' | 'removed'
  status: text("status").notNull().default("accepted"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
  removedAt: timestamp("removed_at", { withTimezone: true }),
});

export const insertMealUpliftApplicationSchema = createInsertSchema(mealUpliftApplications).omit({
  id: true,
  acceptedAt: true,
  removedAt: true,
});

export type MealUpliftApplication = typeof mealUpliftApplications.$inferSelect;
export type InsertMealUpliftApplication = z.infer<typeof insertMealUpliftApplicationSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// WS0 — NUTRITION KNOWLEDGE REGISTRY (additive, shared source of truth)
// ═══════════════════════════════════════════════════════════════════════════
// Editorial nutrition knowledge — NOT pantry inventory, NOT recipe storage.
// Human-curated, deterministic, explainable. Every record carries a `source`
// field and an `isActive` flag so it can be edited or retired. No AI-generated
// medical claims live here — content is added by curation only.
//
// This layer is intentionally NOT wired into planner ranking, the restriction
// engine, meal scoring or recommendation ranking. It exposes typed storage and
// retrieval helpers only (see server/services/nutrition-knowledge-registry.ts).
//
// Entities are addressed by a stable, human-readable `slug` so that the seed
// data and the relationship tables remain editable and reviewable by hand.

// ── Foods ──────────────────────────────────────────────────────────────────
export const knowledgeFoods = pgTable("knowledge_foods", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  aliases: text("aliases").array().notNull().default(sql`'{}'`),
  description: text("description"),
  imageUrl: text("image_url"),
  commonForms: text("common_forms").array().notNull().default(sql`'{}'`),
  storageGuidance: text("storage_guidance"),
  // DISPLAY COPY ONLY (WS0X.4 Consolidation Gate). Free-text seasonality for the
  // food-detail surface. NOT the source of truth for seasonality logic — that is
  // SEASON_SEED (shared/discovery/seasonal-map.ts). Do not filter/rank on this.
  seasonality: text("seasonality"),
  source: text("source").notNull().default("THA editorial"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Nutrients ──────────────────────────────────────────────────────────────
export const knowledgeNutrients = pgTable("knowledge_nutrients", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  // Broad classification: macronutrient | mineral | vitamin | fatty-acid | phytonutrient | other.
  category: text("category"),
  // NK6M — optional parent family within a category. A nutrient may be classified
  // beneath a broader canonical family without being merged or aliased into it
  // (e.g. lutein/zeaxanthin/beta-carotene sit under the `carotenoids` family but
  // keep their own identity and facts). Null = the nutrient has no parent family
  // (it is itself top-level, which includes family rows such as `carotenoids`).
  family: text("family"),
  source: text("source").notNull().default("THA editorial"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Health Benefits ──────────────────────────────────────────────────────────
export const knowledgeHealthBenefits = pgTable("knowledge_health_benefits", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  source: text("source").notNull().default("THA editorial"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Food ↔ Nutrient ──────────────────────────────────────────────────────────
// KNOW5 — the COMPOSITION EVIDENCE CONTRACT. This edge asserts the food-specific
// premise ("this food is a notable source of that nutrient") on which every
// benefit chip rests. Before KNOW5 it carried no evidence columns at all, so a
// chip could inherit a genuine NHS/EFSA citation earned by the *nutrient-level*
// sentence while its food-specific premise was an unreviewed AI draft.
//
// It now carries the same Layer-2 shape as the nutrient↔benefit edge:
// sourceRefs (Layer-1 validated) + reviewedAt (human sign-off) + reviewedBy
// (reviewer identity). NULL reviewedAt means "not reviewed", which is the truth
// for every pre-KNOW5 row — no backfill, and no row is grandfathered in.
export const knowledgeFoodNutrients = pgTable("knowledge_food_nutrients", {
  id: serial("id").primaryKey(),
  foodSlug: text("food_slug").notNull().references(() => knowledgeFoods.slug, { onDelete: "cascade" }),
  nutrientSlug: text("nutrient_slug").notNull().references(() => knowledgeNutrients.slug, { onDelete: "cascade" }),
  // Optional editorial amount string, e.g. "high", "150mg per 30g". Never a fabricated precise figure.
  amount: text("amount"),
  // Editorial confidence in the association: 'established' | 'good' | 'emerging'.
  // STORAGE ONLY. It is authored, not earned, and the render gate never reads it.
  confidence: text("confidence").notNull().default("established"),
  // Lower = more prominent. Used to order "top nutrients" for a food.
  ranking: integer("ranking").notNull().default(0),
  source: text("source").notNull().default("THA editorial"),
  sourceRefs: jsonb("source_refs").$type<KnowledgeSourceRef[]>().notNull().default(sql`'[]'::jsonb`),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueFoodNutrient: unique("uq_knowledge_food_nutrient").on(t.foodSlug, t.nutrientSlug),
}));

// ── Food ↔ Health Benefit ────────────────────────────────────────────────────
// evidenceStrength is STORED ONLY — it must not be surfaced to users yet.
//
// This row is the editorial ASSERTION that a food supports a benefit. It is not
// itself the licence to render: a chip earns that through the evidence chain
// (composition edge ⋈ nutrient↔benefit edge), both Layer-2 gated.
//
// KNOW5 resolves gap G4 — sourceRefs/reviewedAt here were written by nothing and
// read by nothing, implying a food-level review that never happened. They now
// have exactly one defined meaning: a food→benefit row that is itself
// evidence-backed carries a citation for the *food-specific* claim, which lifts
// the derived chip's Evidence Confidence from Strong to Established. It can only
// ever ADD evidence — never substitute for the chain, and never license a chip on
// its own. reviewedBy names the human who signed off; seeds never set either.
export const knowledgeFoodBenefits = pgTable("knowledge_food_benefits", {
  id: serial("id").primaryKey(),
  foodSlug: text("food_slug").notNull().references(() => knowledgeFoods.slug, { onDelete: "cascade" }),
  benefitSlug: text("benefit_slug").notNull().references(() => knowledgeHealthBenefits.slug, { onDelete: "cascade" }),
  // 'established' | 'good' | 'emerging' — internal editorial signal, not for display.
  evidenceStrength: text("evidence_strength").notNull().default("emerging"),
  ranking: integer("ranking").notNull().default(0),
  source: text("source").notNull().default("THA editorial"),
  sourceRefs: jsonb("source_refs").$type<KnowledgeSourceRef[]>().notNull().default(sql`'[]'::jsonb`),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueFoodBenefit: unique("uq_knowledge_food_benefit").on(t.foodSlug, t.benefitSlug),
}));

// ── Nutrient ↔ Health Benefit ────────────────────────────────────────────────
export const knowledgeNutrientBenefits = pgTable("knowledge_nutrient_benefits", {
  id: serial("id").primaryKey(),
  nutrientSlug: text("nutrient_slug").notNull().references(() => knowledgeNutrients.slug, { onDelete: "cascade" }),
  benefitSlug: text("benefit_slug").notNull().references(() => knowledgeHealthBenefits.slug, { onDelete: "cascade" }),
  evidenceStrength: text("evidence_strength").notNull().default("emerging"),
  ranking: integer("ranking").notNull().default(0),
  source: text("source").notNull().default("THA editorial"),
  sourceRefs: jsonb("source_refs").$type<KnowledgeSourceRef[]>().notNull().default(sql`'[]'::jsonb`),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueNutrientBenefit: unique("uq_knowledge_nutrient_benefit").on(t.nutrientSlug, t.benefitSlug),
}));

export const insertKnowledgeFoodSchema = createInsertSchema(knowledgeFoods).omit({ id: true, createdAt: true });
export const insertKnowledgeNutrientSchema = createInsertSchema(knowledgeNutrients).omit({ id: true, createdAt: true });
export const insertKnowledgeHealthBenefitSchema = createInsertSchema(knowledgeHealthBenefits).omit({ id: true, createdAt: true });
export const insertKnowledgeFoodNutrientSchema = createInsertSchema(knowledgeFoodNutrients, {
  sourceRefs: z.custom<KnowledgeSourceRef[]>().optional(),
}).omit({ id: true, createdAt: true });
// sourceRefs overridden: drizzle-zod cannot derive a jsonb column's $type<T>()
// generic, so the default-inferred schema type doesn't match KnowledgeSourceRef[].
export const insertKnowledgeFoodBenefitSchema = createInsertSchema(knowledgeFoodBenefits, {
  sourceRefs: z.custom<KnowledgeSourceRef[]>().optional(),
}).omit({ id: true, createdAt: true });
export const insertKnowledgeNutrientBenefitSchema = createInsertSchema(knowledgeNutrientBenefits, {
  sourceRefs: z.custom<KnowledgeSourceRef[]>().optional(),
}).omit({ id: true, createdAt: true });

export type KnowledgeFood = typeof knowledgeFoods.$inferSelect;
export type InsertKnowledgeFood = z.infer<typeof insertKnowledgeFoodSchema>;
export type KnowledgeNutrient = typeof knowledgeNutrients.$inferSelect;
export type InsertKnowledgeNutrient = z.infer<typeof insertKnowledgeNutrientSchema>;
export type KnowledgeHealthBenefit = typeof knowledgeHealthBenefits.$inferSelect;
export type InsertKnowledgeHealthBenefit = z.infer<typeof insertKnowledgeHealthBenefitSchema>;
export type KnowledgeFoodNutrient = typeof knowledgeFoodNutrients.$inferSelect;
export type InsertKnowledgeFoodNutrient = z.infer<typeof insertKnowledgeFoodNutrientSchema>;
export type KnowledgeFoodBenefit = typeof knowledgeFoodBenefits.$inferSelect;
export type InsertKnowledgeFoodBenefit = z.infer<typeof insertKnowledgeFoodBenefitSchema>;
export type KnowledgeNutrientBenefit = typeof knowledgeNutrientBenefits.$inferSelect;
export type InsertKnowledgeNutrientBenefit = z.infer<typeof insertKnowledgeNutrientBenefitSchema>;

// ── Preparation Knowledge (PHASE5A — builds WS5A; PKCA §7 Phase 4) ───────────
//
// "The same food. A different thing done to it. Nutrition only changes if the
// evidence says so." (WS5A). Preparation is a metadata layer ON a food — it
// NEVER mints a canonical food (WS5A Risk R6) and NEVER changes plant counting.
//
// The layer has exactly two dimensions, and keeping them apart is the whole
// design (WS5A §1.2):
//
//   EXISTENCE — that people eat this food this way. Cheap, editorial, always
//               allowed. This is the MVF bar (PKCA Rule KC5).
//   EFFECT    — that the preparation MEASURABLY CHANGES nutrition. Expensive,
//               evidence-gated, rare. Allowed only with a Layer-1 trusted
//               citation and a named human sign-off.
//
// Effects reuse the EXISTING Layer-2 claim-trust contract verbatim
// (sourceRefs + reviewedAt + reviewedBy, gated by isEvidenceBackedClaim) —
// the same columns and the same running validator as knowledge_food_benefits.
// No new evidence vocabulary and no new lifecycle is invented (PKCA Rule KC1;
// Risk R6). Candidate/gate/confirm for an effect lives where it already lives
// for every other knowledge proposal: knowledge_review_queue (KQ1B), with
// reviewType "preparation_effect".
//
// This is a DELIBERATE, documented divergence from WS5A §3.1, which proposed a
// bespoke five-state `editorialStatus` column. That column predates PKC0/KNOW5,
// which made the evidence chain itself the render gate. Adding it now would
// create a SECOND lifecycle for one fact — exactly what Rule KC1 forbids.

/** WS5A §1.6. `composite` is deliberately absent: a composite ADDS other foods
 *  (granola, trail mix) and is NOT a preparation — it must never inherit a
 *  single food's clean profile (WS5A Case D, Risk R9). */
export const PREPARATION_TYPES = ["state", "preservation", "cooking", "processing"] as const;
export type PreparationType = (typeof PREPARATION_TYPES)[number];

/** What an evidenced effect acts on (WS5A §3.1). */
export const PREPARATION_EFFECT_KINDS = ["nutrient", "attribute", "caution", "context"] as const;
export type PreparationEffectKind = (typeof PREPARATION_EFFECT_KINDS)[number];

/** WS5A §3.1. `no-meaningful-change` is a POSITIVE, evidenced finding ("we know
 *  it doesn't matter") — it is NOT the absence of a row ("nobody knows yet").
 *  Collapsing the two is the single biggest trust risk in this domain (Risk R3). */
export const PREPARATION_EFFECT_DIRECTIONS = ["increases", "decreases", "changes", "no-meaningful-change"] as const;
export type PreparationEffectDirection = (typeof PREPARATION_EFFECT_DIRECTIONS)[number];

/** The preparation catalogue — a reference vocabulary beside the spine
 *  (Principle 5), not an entity. One row per preparation, shared across foods. */
export const knowledgePreparations = pgTable("knowledge_preparations", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** One of PREPARATION_TYPES. Enforced by the seed validator, not by the DB. */
  prepType: text("prep_type").notNull(),
  description: text("description"),
  /** Optional parent preparation slug — the shallow hierarchy of WS5A Case F
   *  ("cooked" is a family; boiled/roasted/fried are its children). Split a
   *  child out ONLY where an evidenced effect distinguishes it, never for
   *  completeness. Self-referencing by slug convention, mirroring
   *  knowledge_nutrients.family (NK6M) and canonical_food.family (NK6R). */
  family: text("family"),
  source: text("source").notNull().default("THA editorial"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Food ↔ Preparation: EXISTENCE only. This edge asserts nothing about
 *  nutrition — it says only "people eat this food this way", which is the
 *  cheap, always-allowed half of WS5A §1.2. It therefore carries NO evidence
 *  columns, deliberately: requiring a citation to state that boiled eggs exist
 *  would be evidence theatre, and it would gate the MVF bar behind the
 *  enrichment that Rule KC6 says may never gate it. */
export const knowledgeFoodPreparations = pgTable("knowledge_food_preparations", {
  id: serial("id").primaryKey(),
  foodSlug: text("food_slug").notNull().references(() => knowledgeFoods.slug, { onDelete: "cascade" }),
  preparationSlug: text("preparation_slug").notNull().references(() => knowledgePreparations.slug, { onDelete: "cascade" }),
  /** Lower = more prominent. Orders "how people eat this" on the food surface. */
  ranking: integer("ranking").notNull().default(0),
  source: text("source").notNull().default("THA editorial"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueFoodPreparation: unique("uq_knowledge_food_preparation").on(t.foodSlug, t.preparationSlug),
}));

/** Food ↔ Preparation EFFECT: the evidence-gated claim that this preparation
 *  measurably changes something about this food.
 *
 *  The render gate is `isEvidenceBackedClaim` (shared/knowledge/evidence.ts) —
 *  the SAME function that gates every benefit chip. A row with no valid
 *  SourceRef, or no human sign-off, does not render: it is an honest gap, and
 *  the surface says so in the words of WS5A §4, never in the words of a guess.
 *
 *  A preparation NEVER authors a benefit directly (WS5A §2.2, Risk R8). The
 *  only legitimate route is preparation → nutrient/attribute → benefit, which
 *  the existing nutrient bridge already owns. `effectKind: "caution"` exists
 *  precisely so that "smoking raises sodium" can be said WITHOUT it becoming a
 *  benefit claim in either direction. */
export const knowledgePreparationEffects = pgTable("knowledge_preparation_effects", {
  id: serial("id").primaryKey(),
  foodSlug: text("food_slug").notNull().references(() => knowledgeFoods.slug, { onDelete: "cascade" }),
  preparationSlug: text("preparation_slug").notNull().references(() => knowledgePreparations.slug, { onDelete: "cascade" }),
  /** One of PREPARATION_EFFECT_KINDS. */
  effectKind: text("effect_kind").notNull(),
  /** The nutrient/attribute slug affected. Null for `caution` and `context`. */
  targetSlug: text("target_slug"),
  /** One of PREPARATION_EFFECT_DIRECTIONS. */
  direction: text("direction").notNull(),
  /** The exact sentence a surface may show. Editorial, EFSA-wording-checked
   *  where it is a claim. A surface renders THIS STRING — it never composes its
   *  own sentence from the columns, which is how a hedged claim becomes a
   *  confident one (WS5A §3.4). */
  approvedWording: text("approved_wording").notNull(),
  /** Shown whenever the evidence is weaker than established (WS5A §3.4). */
  uncertaintyNote: text("uncertainty_note"),
  source: text("source").notNull().default("THA editorial"),
  sourceRefs: jsonb("source_refs").$type<KnowledgeSourceRef[]>().notNull().default(sql`'[]'::jsonb`),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniquePreparationEffect: unique("uq_knowledge_preparation_effect").on(t.foodSlug, t.preparationSlug, t.effectKind, t.targetSlug),
}));

export const insertKnowledgePreparationSchema = createInsertSchema(knowledgePreparations).omit({ id: true, createdAt: true });
export const insertKnowledgeFoodPreparationSchema = createInsertSchema(knowledgeFoodPreparations).omit({ id: true, createdAt: true });
export const insertKnowledgePreparationEffectSchema = createInsertSchema(knowledgePreparationEffects, {
  sourceRefs: z.custom<KnowledgeSourceRef[]>().optional(),
}).omit({ id: true, createdAt: true });

export type KnowledgePreparation = typeof knowledgePreparations.$inferSelect;
export type InsertKnowledgePreparation = z.infer<typeof insertKnowledgePreparationSchema>;
export type KnowledgeFoodPreparation = typeof knowledgeFoodPreparations.$inferSelect;
export type InsertKnowledgeFoodPreparation = z.infer<typeof insertKnowledgeFoodPreparationSchema>;
export type KnowledgePreparationEffect = typeof knowledgePreparationEffects.$inferSelect;
export type InsertKnowledgePreparationEffect = z.infer<typeof insertKnowledgePreparationEffectSchema>;

// ── Knowledge Review Queue (KQ1B — Workbench Phase 0) ────────────────────────
// A GENERAL, governed review queue for knowledge items that a governed process
// could not resolve on its own and that need human review. It is a PROPOSAL /
// worklist layer only: it owns no canonical identity, mints no entity, and does
// not fork the single GOV2 resolver (docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md).
//
// Generalisation (KQ1B architectural adjustment): the queue is NOT vocabulary-
// specific. `reviewType` discriminates the kind of review; the first and only
// implemented type is "vocabulary" (unresolved nutrient/benefit terms captured
// from the GOV2 resolver/importer). Future review types (e.g. duplicate-entity,
// claim-source, relationship) are ADDITIVE: a new `reviewType` value + any
// type-specific fields tucked into the `details` jsonb — no schema redesign.
//
// Dedupe: one row per distinct item, keyed by (reviewType, domain, dedupeKey).
// Re-sighting the same item increments `occurrenceCount`, refreshes `lastSeenAt`
// and appends to `contexts` rather than inserting a duplicate row.

/** One place a review item was sighted. Stored in `contexts` (append-on-resight). */
export interface KnowledgeReviewContext {
  /** Where the sighting came from, e.g. "importer", "resolver". */
  source: string;
  /** Optional provenance detail. */
  foodSlug?: string;
  file?: string;
  path?: string;
  note?: string;
  /** ISO timestamp of this sighting. */
  at?: string;
}

export const knowledgeReviewQueue = pgTable("knowledge_review_queue", {
  id: serial("id").primaryKey(),
  // Discriminator for the kind of review. First implemented value: "vocabulary".
  reviewType: text("review_type").notNull().default("vocabulary"),
  // Sub-domain within the review type. For "vocabulary": "nutrient" | "benefit"
  // | "food". Kept as a column (not buried in details) so it is filterable.
  domain: text("domain").notNull(),
  // Stable dedupe discriminator within (reviewType, domain). For "vocabulary"
  // this is the resolver's normalised term (GOV2 single normaliser).
  dedupeKey: text("dedupe_key").notNull(),
  // Human-facing label — the first-seen verbatim string.
  label: text("label").notNull(),
  // Origin of the FIRST sighting, e.g. "importer" | "resolver".
  source: text("source").notNull(),
  // Every place this item has been sighted (append-on-resight, deduped).
  contexts: jsonb("contexts").$type<KnowledgeReviewContext[]>().notNull().default(sql`'[]'::jsonb`),
  // Review-type-specific payload — the additive-extensibility hatch. For
  // "vocabulary": { normalisedTerm, rawTerm, reason }.
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  // Number of sightings (incremented on every re-capture).
  occurrenceCount: integer("occurrence_count").notNull().default(1),
  // Lifecycle. Phase 0 only ever writes "unresolved"; later phases add
  // in_review → proposed → approved → applied | handed_off | rejected | deferred.
  status: text("status").notNull().default("unresolved"),
  // ── KQ1C — Phase 1 editable review fields (additive) ─────────────────────
  // These are proposal-layer editorial annotations only. They never touch
  // canonical identity: `suggestedCanonicalSlug` is a REVIEWER SUGGESTION for
  // an external LLM to consider, not an applied alias (apply is a later phase).
  // Reviewer-assigned triage priority: "high" | "medium" | "low" | null.
  priority: text("priority"),
  // Editorial classification of where this knowledge originates (distinct from
  // `source`, which is the capture channel). Free text with common presets.
  knowledgeOrigin: text("knowledge_origin"),
  // Free-text reviewer notes for external-LLM/editorial context.
  reviewNotes: text("review_notes"),
  // Reviewer's SUGGESTED canonical match (a slug the term might resolve to).
  // A suggestion for review — never applied to the resolver in Phase 1.
  suggestedCanonicalSlug: text("suggested_canonical_slug"),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueReviewItem: unique("uq_knowledge_review_item").on(t.reviewType, t.domain, t.dedupeKey),
  reviewTypeIdx: index("idx_knowledge_review_type").on(t.reviewType, t.status),
}));

export const insertKnowledgeReviewQueueSchema = createInsertSchema(knowledgeReviewQueue, {
  contexts: z.custom<KnowledgeReviewContext[]>().optional(),
  details: z.custom<Record<string, unknown>>().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type KnowledgeReviewQueueItem = typeof knowledgeReviewQueue.$inferSelect;
export type InsertKnowledgeReviewQueueItem = z.infer<typeof insertKnowledgeReviewQueueSchema>;

// ─── KQ1D — Phase 2: Knowledge Review Package import & proposals ──────────────
// Additive proposal-layer tables. They own NO canonical identity, mint no
// entity, write nothing to the resolver, and change no canonical vocabulary
// (docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md). They only PERSIST the
// editorial decisions an external LLM/reviewer proposed in an exported Knowledge
// Review Package, linked back to the queue items they resolve, behind a human
// approval gate. Apply / hand-off / rollback are LATER phases (KQ1A §10).

// One imported Knowledge Review Package. Holds package-level provenance
// (checksum, schema version, exported-at, reviewing model, source filename) so
// every proposal it created is traceable to the file it came from.
export const knowledgeReviewBatches = pgTable("knowledge_review_batches", {
  id: serial("id").primaryKey(),
  // "import" today; the shape leaves room for a later persisted "export".
  direction: text("direction").notNull().default("import"),
  format: text("format").notNull().default("json"),
  // The imported package's declared schema version (provenance).
  schemaVersion: text("schema_version"),
  // sha256 the package carried over its source items — validated on import.
  checksum: text("checksum"),
  // When the package was originally exported from THA (from the envelope).
  exportedAt: timestamp("exported_at", { withTimezone: true }),
  // Which external LLM/reviewer produced the decisions (package-level).
  reviewerModel: text("reviewer_model"),
  // The uploaded file's name, for audit.
  sourceFilename: text("source_filename"),
  // How many items the package contained vs how many proposals were created.
  itemCount: integer("item_count").notNull().default(0),
  proposalCount: integer("proposal_count").notNull().default(0),
  // imported → (later phases) approved → applied → rolled_back.
  status: text("status").notNull().default("imported"),
  notes: text("notes"),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKnowledgeReviewBatchSchema = createInsertSchema(knowledgeReviewBatches).omit({
  id: true,
  createdAt: true,
});
export type KnowledgeReviewBatch = typeof knowledgeReviewBatches.$inferSelect;
export type InsertKnowledgeReviewBatch = z.infer<typeof insertKnowledgeReviewBatchSchema>;

// One proposed editorial decision for a queue term, imported from a package.
// A PROPOSAL only — created with status "proposed"; a human must approve/reject.
// Nothing here is ever applied to the resolver or canonical vocabularies in
// Phase 2 (approval merely records intent; apply is Phase 3).
export const knowledgeReviewDecisions = pgTable("knowledge_review_decisions", {
  id: serial("id").primaryKey(),
  // The package this proposal was imported from.
  batchId: integer("batch_id").notNull().references(() => knowledgeReviewBatches.id, { onDelete: "cascade" }),
  // The queue term this proposal resolves (the link the DoD requires).
  termId: integer("term_id").notNull().references(() => knowledgeReviewQueue.id, { onDelete: "cascade" }),
  // Denormalised from the term for convenient filtering/display.
  reviewType: text("review_type").notNull().default("vocabulary"),
  domain: text("domain"),
  // alias | new_identity | reject | defer (the reviewer's decision).
  decisionType: text("decision_type").notNull(),
  // For "alias": the existing canonical slug + the alt-name to bind (proposal
  // only — validated for shape, never written to the resolver in Phase 2).
  targetCanonicalSlug: text("target_canonical_slug"),
  aliasString: text("alias_string"),
  // For "new_identity": the hand-off artifact fields (proposed, never minted).
  proposedNewSlug: text("proposed_new_slug"),
  proposedNewName: text("proposed_new_name"),
  proposedNewDescription: text("proposed_new_description"),
  // Reviewer metadata preserved verbatim (provenance).
  rationale: text("rationale"),
  confidence: text("confidence"),
  // KQ1E — Phase 3: the reviewer (human/agent identity) distinct from the model.
  // Both are surfaced side-by-side in the Consensus & Comparison workspace.
  reviewer: text("reviewer"),
  reviewerModel: text("reviewer_model"),
  reviewerNotes: text("reviewer_notes"),
  // The queue term's original context snapshot at import time (preserved so the
  // proposal stays interpretable even if the queue later changes).
  originalContext: jsonb("original_context").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  // proposed → approved | rejected. No apply/rollback states in Phase 2.
  status: text("status").notNull().default("proposed"),
  approvedByUserId: integer("approved_by_user_id").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  batchStatusIdx: index("idx_knowledge_review_decision_batch").on(t.batchId, t.status),
  termIdx: index("idx_knowledge_review_decision_term").on(t.termId),
}));

export const insertKnowledgeReviewDecisionSchema = createInsertSchema(knowledgeReviewDecisions, {
  originalContext: z.custom<Record<string, unknown>>().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export type KnowledgeReviewDecision = typeof knowledgeReviewDecisions.$inferSelect;
export type InsertKnowledgeReviewDecision = z.infer<typeof insertKnowledgeReviewDecisionSchema>;

// ════════════════════════════════════════════════════════════════════════════
// KQ1F — Phase 4: Publish, Release Notes, Rollback & Knowledge Health
// ════════════════════════════════════════════════════════════════════════════
// PUBLISHING is the ONLY operation that changes canonical knowledge, and it does
// so through exactly ONE mechanism: the governed alias overlay below. GOV2 Rule 3
// classes adding an alias as a CONTENT edit, never a new identity or schema
// change — so the overlay moves alias *content* into a governed runtime store the
// single resolver still solely reads; it does NOT move vocabulary ownership
// (TypeScript stays the owner per NK6F). New-identity decisions are emitted as
// hand-off artifacts for the TS owner — the Workbench NEVER auto-mints a
// canonical entity. Every publish creates a Knowledge Release + a rollback point
// and appends append-only audit rows (complete history preserved).

// The governed alias overlay. The single resolver merges ACTIVE rows on top of
// its TS-owned seed alias tables at load / reload, under the SAME anti-fork guard
// as the TS tables: `canonicalSlug` MUST already be a canonical slug or the
// resolver refuses it. This is the ONLY canonical-adjacent write the Workbench
// makes. Rollback soft-deletes rows (isActive=false) — never hard-deletes — so
// the audit trail stays intact and resolution simply reverts to pre-release
// behaviour. A partial unique index keeps at most ONE active alias per
// (kind, aliasNormalised) — GOV2 many-to-one: one string → exactly one identity.
export const knowledgeVocabularyAliases = pgTable("knowledge_vocabulary_aliases", {
  id: serial("id").primaryKey(),
  // nutrient | benefit (the canonical vocabulary the alias belongs to).
  kind: text("kind").notNull(),
  // The normalised alt-name key (resolver's normaliseVocabularyTerm output).
  aliasNormalised: text("alias_normalised").notNull(),
  // The canonical slug this alias resolves to. Anti-fork guarded at merge time.
  canonicalSlug: text("canonical_slug").notNull(),
  // Provenance: the approved decision + release that published this alias.
  decisionId: integer("decision_id").references(() => knowledgeReviewDecisions.id),
  releaseId: integer("release_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
}, (t) => ({
  // Only ONE active alias per (kind, key) — historical inactive rows may coexist,
  // so a rolled-back alias can be re-published later without a constraint clash.
  activeAliasUnique: uniqueIndex("uq_knowledge_vocab_alias_active")
    .on(t.kind, t.aliasNormalised)
    .where(sql`${t.isActive}`),
}));

export const insertKnowledgeVocabularyAliasSchema = createInsertSchema(knowledgeVocabularyAliases).omit({
  id: true,
  createdAt: true,
});
export type KnowledgeVocabularyAlias = typeof knowledgeVocabularyAliases.$inferSelect;
export type InsertKnowledgeVocabularyAlias = z.infer<typeof insertKnowledgeVocabularyAliasSchema>;

// A rollback point captured at publish time. Holds the deterministic snapshot
// needed to reverse a release (the overlay rows it created + the prior decision/
// term statuses), so rollback is exact and non-destructive. `status` flips
// active → consumed when the release is rolled back.
export const knowledgeRollbackPoints = pgTable("knowledge_rollback_points", {
  id: serial("id").primaryKey(),
  // The release this point can restore (set immediately after the release row
  // exists; nullable only to sidestep the circular insert ordering).
  releaseId: integer("release_id"),
  // { aliasRowIds:number[], handoffCount:number, decisions:[{id,prevStatus}],
  //   terms:[{id,prevStatus}] } — everything reverse() needs.
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  status: text("status").notNull().default("active"), // active | consumed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
});

export const insertKnowledgeRollbackPointSchema = createInsertSchema(knowledgeRollbackPoints, {
  snapshot: z.custom<Record<string, unknown>>().optional(),
}).omit({ id: true, createdAt: true });
export type KnowledgeRollbackPoint = typeof knowledgeRollbackPoints.$inferSelect;
export type InsertKnowledgeRollbackPoint = z.infer<typeof insertKnowledgeRollbackPointSchema>;

// One Knowledge Release — created automatically by every publish operation. It
// is the human-readable record of exactly what changed and who approved/published
// it, and it links to the rollback point that can reverse it.
export const knowledgeReleases = pgTable("knowledge_releases", {
  id: serial("id").primaryKey(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  // The approving admin. `approvedByUserIds` holds the full distinct set when a
  // release spans decisions approved by more than one admin.
  approvedByUserId: integer("approved_by_user_id").references(() => users.id),
  approvedByUserIds: jsonb("approved_by_user_ids").$type<number[]>().notNull().default(sql`'[]'::jsonb`),
  // The admin who ran publish (may differ from the approver).
  publishedByUserId: integer("published_by_user_id").references(() => users.id),
  // The release's change breakdown.
  aliasesPublished: integer("aliases_published").notNull().default(0),
  newEntities: integer("new_entities").notNull().default(0),        // new-identity hand-offs emitted
  updatedEntities: integer("updated_entities").notNull().default(0), // distinct canonical targets that gained an alias
  rejectedProposals: integer("rejected_proposals").notNull().default(0),
  deferredProposals: integer("deferred_proposals").notNull().default(0),
  // Traceability: the packages + proposals this release drew from.
  linkedBatchIds: jsonb("linked_batch_ids").$type<number[]>().notNull().default(sql`'[]'::jsonb`),
  linkedProposalIds: jsonb("linked_proposal_ids").$type<number[]>().notNull().default(sql`'[]'::jsonb`),
  // The rollback point that reverses this release.
  rollbackId: integer("rollback_id"),
  notes: text("notes"),
  status: text("status").notNull().default("published"), // published | rolled_back
  rolledBackAt: timestamp("rolled_back_at", { withTimezone: true }),
  rolledBackByUserId: integer("rolled_back_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKnowledgeReleaseSchema = createInsertSchema(knowledgeReleases, {
  approvedByUserIds: z.custom<number[]>().optional(),
  linkedBatchIds: z.custom<number[]>().optional(),
  linkedProposalIds: z.custom<number[]>().optional(),
}).omit({ id: true, createdAt: true });
export type KnowledgeRelease = typeof knowledgeReleases.$inferSelect;
export type InsertKnowledgeRelease = z.infer<typeof insertKnowledgeReleaseSchema>;

// Append-only audit history — every governed transition across the Workbench
// (capture / import / approve / reject / publish / hand-off / rollback). Retained
// forever with before/after snapshots so a release can be reconstructed. Nothing
// updates or deletes these rows.
export const knowledgeReviewAudit = pgTable("knowledge_review_audit", {
  id: serial("id").primaryKey(),
  entity: text("entity").notNull(),      // term | batch | decision | alias | release
  entityId: integer("entity_id"),
  action: text("action").notNull(),      // approved | rejected | published | handed_off | rolled_back | …
  actorKind: text("actor_kind").notNull().default("human"), // human | llm | system
  actorUserId: integer("actor_user_id").references(() => users.id),
  releaseId: integer("release_id"),
  before: jsonb("before").$type<Record<string, unknown> | null>(),
  after: jsonb("after").$type<Record<string, unknown> | null>(),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  entityIdx: index("idx_knowledge_review_audit_entity").on(t.entity, t.entityId),
  releaseIdx: index("idx_knowledge_review_audit_release").on(t.releaseId),
}));

export const insertKnowledgeReviewAuditSchema = createInsertSchema(knowledgeReviewAudit, {
  before: z.custom<Record<string, unknown> | null>().optional(),
  after: z.custom<Record<string, unknown> | null>().optional(),
}).omit({ id: true, createdAt: true });
export type KnowledgeReviewAudit = typeof knowledgeReviewAudit.$inferSelect;
export type InsertKnowledgeReviewAudit = z.infer<typeof insertKnowledgeReviewAuditSchema>;

// ════════════════════════════════════════════════════════════════════════════
// WS2A — Canonical Food Identity Foundations
// ════════════════════════════════════════════════════════════════════════════
// "One food. One meaning. Everywhere." — the identity spine.
//
// These four tables are ADDITIVE and stand BESIDE every existing identity
// system (knowledge_foods, ingredient-aliases, food-synonyms, nutrition-variety
// keyword lists, …). Nothing reads them in production yet — they exist to be
// validated in SHADOW MODE against the live counting before any cutover.
//
// Hard guarantees baked into the schema:
//   • canonical_food_alias.alias_key is UNIQUE  → one string resolves to AT MOST
//     one food. This is the anti-fork lock: "tomatoes" can never simultaneously
//     mean two foods, so a food can never silently split and double-count.
//   • Plant Diversity counts at diversity_group level, not canonical_food, so a
//     food's varieties (cherry/plum/heirloom tomato) share ONE group and can
//     never inflate the 30-plants count.
//
// See docs/investigations/knowledge/WS2A_CANONICAL_FOOD_FOUNDATIONS_IMPLEMENTATION.md.

// ── Diversity Group ──────────────────────────────────────────────────────────
// What the 30-plants-a-week counter counts ONCE. All tomato varieties → the
// single "tomato" group; all mushroom varieties → the single "mushroom" group.
export const diversityGroups = pgTable("diversity_group", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  // When true, every canonical_food in this group counts as exactly one plant.
  countAsSinglePlant: boolean("count_as_single_plant").notNull().default(true),
  source: text("source").notNull().default("THA editorial"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Canonical Food ───────────────────────────────────────────────────────────
// The identity spine. A SUPERSET of knowledge_foods: it may carry foods with no
// editorial entry (knowledge_food_slug = NULL). For editorial foods the slugs
// may differ in number (canonical "tomato" ↔ knowledge "tomatoes"); the link is
// the explicit knowledge_food_slug FK, never an assumption.
export const canonicalFoods = pgTable("canonical_food", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  // DESCRIPTIVE ATTRIBUTE ONLY (NK6R). Texture/format words such as "Hard",
  // "Soft", "Semi-hard" describe a food; they are NOT a hierarchy level. The
  // parent/child structure lives in `family` below. Never branch logic on this.
  subcategory: text("subcategory"),
  description: text("description"),
  // NK6R — optional parent canonical food. A food may sit beneath a broader
  // canonical identity without being merged or aliased into it: the child keeps
  // its own slug, display name and facts (GOV2 Rule 1/2), and the parent is a
  // real canonical identity in its own right — not a category string.
  //   olive-pomace-oil → olive-oil          (grade under the generic oil)
  //   stilton → blue-cheese → cheese        (named cheese → family → parent)
  //   chickpea-pasta → pasta                (pasta type under the generic)
  // Null = the food is top-level, which includes family rows such as `cheese`
  // and `blue-cheese`. Self-referencing by slug convention (no FK, mirroring
  // knowledge_nutrients.family from NK6M); validateCanonicalSeed() enforces that
  // every family resolves to an existing canonical food and that the graph is
  // acyclic. Aliasing a child into its parent is a GOV2 fail test — the whole
  // point of this column is that a hierarchy is NOT an alias.
  family: text("family"),
  // Optional link OUT to the editorial Knowledge Registry (WS0). Nullable so the
  // spine can hold foods the registry was never meant to cover.
  knowledgeFoodSlug: text("knowledge_food_slug").references(() => knowledgeFoods.slug, { onDelete: "set null" }),
  // What this food counts as for Plant Diversity. Nullable for non-plant foods.
  diversityGroupSlug: text("diversity_group_slug").references(() => diversityGroups.slug, { onDelete: "set null" }),
  // active | draft | merged | retired — identities are retireable, never deleted.
  status: text("status").notNull().default("active"),
  source: text("source").notNull().default("THA editorial"),
  // WS0.10 — Global Food Catalogue tier support.
  // "canonical" = THA editorial (current default). "catalogue" = imported, not yet curated.
  tier: text("tier").notNull().default("canonical"),
  // Botanical/biological name — primary cross-source deduplication key.
  scientificName: text("scientific_name"),
  // Attribution for imported data: "USDA:167762", "UKFCT:A01234", etc.
  sourceRef: text("source_ref"),
  // Import confidence — null for THA editorial (no scoring needed). "high" | "medium" | "low".
  confidence: text("confidence"),
  // ── WS0X.5 Food Context Foundation ─────────────────────────────────────────
  // The SINGLE source of truth for food-intrinsic context. Controlled vocabularies
  // live in shared/canonical/food-context.ts; validateCanonicalSeed() enforces them.
  // UK-scoped, additive, nullable — no backfill, no behaviour change on existing reads.
  //
  // Availability (UK retail reach, ordinal): "mainstream" | "common" | "specialist" | "rare".
  // Recommendation tier is DERIVED from this at query time — never reuse `tier` (provenance).
  availability: text("availability"),
  // Orthogonal availability modifiers (NOT folded into the ordinal scale, since a
  // food can be both "mainstream" and "imported"): subset of "imported" | "seasonal" | "online_only".
  availabilityModifiers: text("availability_modifiers").array().notNull().default(sql`'{}'`),
  // Structured UK peak seasons — the canonical seasonality FACT owner. Subset of
  // "spring" | "summer" | "autumn" | "winter". Empty = no distinct UK peak (year-round/imported).
  // ABSORBS the SEASON_SEED knowledge; SEASON_SEED becomes a derived curated view (WS0X.4 §Phase 2).
  peakSeasons: text("peak_seasons").array().notNull().default(sql`'{}'`),
  // Geographic/botanical origin — a controlled region slug (where the food COMES FROM).
  // DISTINCT from cuisine association (CUISINE_SEED, many-to-many). Single-valued, nullable.
  originRegion: text("origin_region"),
  // M4.5 — Fermented Food Attribute. Single canonical owner of fermentation status.
  // true = food undergoes meaningful fermentation (live cultures or metabolic transformation by micro-organisms).
  // false (default) = not fermented, or fermentation is not a defining attribute of this food.
  // Enables "Fermented Foods This Week" reporting independently of plant diversity.
  fermented: boolean("fermented").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Food Variety ─────────────────────────────────────────────────────────────
// A named sub-kind of ONE canonical food (cherry/plum/heirloom → tomato). A
// variety shares its parent's diversity group, so tracking it NEVER changes a
// plant count — it only powers "Your Variety / Broaden Your Variety" later.
export const foodVarieties = pgTable("food_variety", {
  id: serial("id").primaryKey(),
  canonicalFoodId: integer("canonical_food_id").notNull().references(() => canonicalFoods.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  status: text("status").notNull().default("active"),
  source: text("source").notNull().default("THA editorial"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Canonical Food Alias ─────────────────────────────────────────────────────
// Same food, different words. alias_key (the normalizeIngredientKey output) is
// UNIQUE across the whole table — the single most important integrity rule in
// the project: one string → at most one food.
export const canonicalFoodAliases = pgTable("canonical_food_alias", {
  id: serial("id").primaryKey(),
  canonicalFoodId: integer("canonical_food_id").notNull().references(() => canonicalFoods.id, { onDelete: "cascade" }),
  // Human/display form of the alias, e.g. "Cherry Tomatoes", "EVOO".
  alias: text("alias").notNull(),
  // normalizeIngredientKey(alias) — the matchable key. UNIQUE = the anti-fork lock.
  aliasKey: text("alias_key").notNull().unique(),
  // singular | plural | common_name | brand | misspelling | form
  aliasType: text("alias_type").notNull(),
  source: text("source").notNull().default("THA editorial"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDiversityGroupSchema = createInsertSchema(diversityGroups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCanonicalFoodSchema = createInsertSchema(canonicalFoods).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFoodVarietySchema = createInsertSchema(foodVarieties).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCanonicalFoodAliasSchema = createInsertSchema(canonicalFoodAliases).omit({ id: true, createdAt: true });

export type DiversityGroup = typeof diversityGroups.$inferSelect;
export type InsertDiversityGroup = z.infer<typeof insertDiversityGroupSchema>;
export type CanonicalFood = typeof canonicalFoods.$inferSelect;
export type InsertCanonicalFood = z.infer<typeof insertCanonicalFoodSchema>;
export type FoodVariety = typeof foodVarieties.$inferSelect;
export type InsertFoodVariety = z.infer<typeof insertFoodVarietySchema>;
export type CanonicalFoodAlias = typeof canonicalFoodAliases.$inferSelect;
export type InsertCanonicalFoodAlias = z.infer<typeof insertCanonicalFoodAliasSchema>;

// ── Conversation Platform (INT18 Phase 0) ────────────────────────────────────
// Three tables owned exclusively by ConversationStore.
// One conversation per user; threads are context-coherent stretches within it;
// turns are the atomic record.
//
// POINTER DISCIPLINE (TIP3 Risk R1): all JSONB columns store IDs/pointers only
// — never business data rows. entity_refs = [{type,id}]; context_frame_ref =
// {activePlannerWeekId, householdId, ...} (IDs only). Stale IDs surface as
// honest gaps on re-render; the store never holds a second copy of truth.

export const conversations = pgTable("conversations", {
  id:        serial("id").primaryKey(),
  userId:    integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const conversationThreads = pgTable("conversation_threads", {
  id:             serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  // 'floating' | 'planner' | 'shopping' | 'nutrition' | 'household' |
  // 'pantry' | 'diary' | 'meals' | 'templates' | 'partners' | 'analyser' | 'voice'
  surface:  text("surface").notNull(),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),  // null = still active
});

export const conversationTurns = pgTable("conversation_turns", {
  id:       serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => conversationThreads.id, { onDelete: "cascade" }),
  // 'user' | 'assistant' | 'system'
  role:     text("role").notNull(),
  surface:  text("surface").notNull(),
  utterance: text("utterance").notNull(),
  // Null when the resolver produced no routed (non-baseline) intent this turn.
  // Otherwise { capabilities: [{capabilityId, verb, status}] } — the routed
  // capabilities this turn and their per-capability outcome status (INT39:
  // the "intent recognised" / "capability executed" Goal Completion signal).
  resolvedIntent:  jsonb("resolved_intent"),
  // Snapshot of POINTER IDs used this turn (not the data). Re-render re-reads
  // the live entity by ID — this is the immutable record of "what was in scope".
  contextFrameRef: jsonb("context_frame_ref"),
  // [{type, id}] — powers pronoun resolution in follow-up turns.
  entityRefs:  jsonb("entity_refs").notNull().default(sql`'[]'::jsonb`),
  // {status, message} from IntentOutcome only — never the mutated row.
  outcomeRef:  jsonb("outcome_ref"),
  // INT39 — the honest unsuccessful-turn state (INT35 vocabulary: "no-route" |
  // "no-knowledge" | "no-results" | "internal-error"), persisted on assistant
  // turns only. Null = a successful/grounded turn (or a non-actioned system
  // turn). Previously this state was computed per-request and never stored;
  // persisting it is what makes "recovery after a failed conversation" and
  // "capability executed" Goal Completion signals derivable from this table
  // alone, with no new table and no new business-data ownership.
  fallbackState: text("fallback_state"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConversationThreadSchema = createInsertSchema(conversationThreads).omit({ id: true, openedAt: true });
export const insertConversationTurnSchema = createInsertSchema(conversationTurns).omit({ id: true, createdAt: true });

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type ConversationThread = typeof conversationThreads.$inferSelect;
export type InsertConversationThread = z.infer<typeof insertConversationThreadSchema>;
export type ConversationTurn = typeof conversationTurns.$inferSelect;
export type InsertConversationTurn = z.infer<typeof insertConversationTurnSchema>;

// ─── Companion Guidance & Feedback (INT38) ─────────────────────────────────────
// Single canonical owner: server/intelligence/conversation/companion-feedback-store.ts
// (see docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md).
//
// Same privacy class as the INT35C companion tables: no user id, no household
// id, no utterance text, no capability result payload. The only linkage either
// table carries is `conversationTurnId` — an opaque integer pointer into
// conversation_turns, cascade-deleted with the user's own conversation data.
// Feedback and guidance events are ADVISORY signals only: there is no
// `applied` column and no code path from either table back into
// PatternIntentResolver or the Capability Registry.
//
// companion_response_feedback: one 👍/👎 rating per assistant turn (unique on
// conversationTurnId — resubmitting overwrites, an upsert-by-turn). reasonCode
// is only ever set alongside a "down" rating.
//
// companion_guidance_events: "shown" (recorded server-side the moment a
// cross-domain Next Step suggestion is attached to a turn) and "clicked"
// (recorded when the user follows it) — the raw material for task-completion
// rate, successful-journey, and abandonment analytics.

export const companionResponseFeedback = pgTable("companion_response_feedback", {
  id: serial("id").primaryKey(),
  conversationTurnId: integer("conversation_turn_id").notNull().references(() => conversationTurns.id, { onDelete: "cascade" }).unique(),
  rating: text("rating").notNull(), // "up" | "down"
  reasonCode: text("reason_code"), // set only when rating = "down"
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCompanionResponseFeedbackSchema = createInsertSchema(companionResponseFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CompanionResponseFeedback = typeof companionResponseFeedback.$inferSelect;
export type InsertCompanionResponseFeedback = z.infer<typeof insertCompanionResponseFeedbackSchema>;

export const companionGuidanceEvents = pgTable("companion_guidance_events", {
  id: serial("id").primaryKey(),
  conversationTurnId: integer("conversation_turn_id").notNull().references(() => conversationTurns.id, { onDelete: "cascade" }),
  eventKind: text("event_kind").notNull(), // "shown" | "clicked"
  sourceDomain: text("source_domain").notNull(),
  domain: text("domain").notNull(),
  // INT39 — the underlying Capability Guidance Registry action this event
  // resolved from/to. Nullable (domain-only rows predate INT39): the Goal
  // Completion analytics only classify a "clicked" event as a completed goal
  // when these are present and match a completion criterion the SOURCE
  // capability declared for itself — never inferred from domain strings alone.
  sourceCapabilityId: text("source_capability_id"),
  targetCapabilityId: text("target_capability_id"),
  targetVerb: text("target_verb"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCompanionGuidanceEventSchema = createInsertSchema(companionGuidanceEvents).omit({
  id: true,
  createdAt: true,
});

export type CompanionGuidanceEvent = typeof companionGuidanceEvents.$inferSelect;
export type InsertCompanionGuidanceEvent = z.infer<typeof insertCompanionGuidanceEventSchema>;

// ─── Companion Task Delegation & Assisted Actions (INT40) ──────────────────────
// Single canonical owner: server/intelligence/conversation/companion-action-store.ts
// (see docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md).
//
// Same privacy class as the INT38 companion tables: no user id, no household id,
// no raw utterance text. The only linkage is `conversationTurnId` — an opaque
// integer pointer into conversation_turns, cascade-deleted with the user's own
// conversation data. `parameters` holds the RESOLVED, structured intent
// parameters the proposal was built from (e.g. {mealId, dayId, mealSlot} or
// {name, category}) — pointer/structured data only, mirroring the existing
// `resolvedIntent`/`entityRefs` discipline on conversation_turns, never a copy
// of business data owned elsewhere.
//
// A "Companion Action" is a proposed, then confirmed-or-cancelled, execution of
// exactly one registered (capabilityId, verb) pair via the Intent Engine — see
// server/intelligence/conversation/companion-actions.ts. This table is the ONLY
// store of a proposal's lifecycle; there is no second table for "workflows" —
// `workflowId` is a grouping key on this same table (always set, even for a
// single-action bundle), so multi-action guided workflows are queried, never
// separately owned.
export const companionActionProposals = pgTable("companion_action_proposals", {
  id: serial("id").primaryKey(),
  conversationTurnId: integer("conversation_turn_id").notNull().references(() => conversationTurns.id, { onDelete: "cascade" }),
  // Groups a bundle of actions proposed together in the same turn (a "guided
  // workflow"). Always set, including for a single proposed action, so
  // workflow-level analytics need no special-casing between "one action" and
  // "a workflow" — a length-1 workflow is a valid workflow.
  workflowId: text("workflow_id").notNull(),
  capabilityId: text("capability_id").notNull(),
  verb: text("verb").notNull(), // IntentVerb, e.g. "add"
  label: text("label").notNull(), // human-readable action label shown on the button
  // Resolved, structured intent parameters — never free text, never fabricated.
  parameters: jsonb("parameters").notNull().default(sql`'{}'::jsonb`),
  confirmationTier: text("confirmation_tier").notNull(), // "none" | "light" | "required" | "strong"
  status: text("status").notNull().default("proposed"), // "proposed" | "confirmed" | "in_progress" | "succeeded" | "failed" | "cancelled"
  resultSummary: text("result_summary"), // set on "succeeded" — honest, human-readable outcome
  errorCode: text("error_code"), // set on "failed" — the IntentOutcomeStatus (e.g. "denied", "gap")
  errorMessage: text("error_message"), // set on "failed" — the honest platform message
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }), // set on any terminal status
});

export const insertCompanionActionProposalSchema = createInsertSchema(companionActionProposals).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export type CompanionActionProposal = typeof companionActionProposals.$inferSelect;
export type InsertCompanionActionProposal = z.infer<typeof insertCompanionActionProposalSchema>;

// ─── Opportunity Delivery Framework (OD1) ──────────────────────────────────────
// Single canonical owner: server/intelligence/opportunity-delivery/framework.ts
// (see docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md).
//
// Unlike the INT38/39/40 companion tables, this table is NOT scoped to a
// conversation turn — a Domain Intelligence opportunity (e.g. FI4's Food
// Opportunities) is ambient: generated from a household's own existing
// activity, not from an assistant conversation, so there is no turn to key
// on. It is scoped directly to `userId` instead — the same identity every
// other household-aware verb on this platform resolves from
// (`context.userId`, never a client-supplied household id).
//
// This is the ONLY store of an opportunity's delivery lifecycle. It owns NO
// business-domain fact (Rule FI1) — `opportunityId`/`capabilityId`/`domain`/
// `type`/`priority` are a snapshot of identifying metadata from the producing
// capability's own report at the moment of first delivery, used only to
// dedupe and to resolve acknowledge/dismiss/accept requests; the underlying
// planner/pantry/shopping facts remain owned exactly where they always were.
//
// status lifecycle: "delivered" (default, on first report) -> "acknowledged"
// (seen, non-terminal — still eligible for future reports) -> "dismissed" or
// "accepted" (terminal — suppressed from all future reports for this user).
// UNIQUE(userId, opportunityId) is what makes delivery idempotent: a second
// `report` for an opportunity that already has a row never inserts a
// duplicate — this IS "preventing duplicate delivery".
export const opportunityDeliveries = pgTable("opportunity_deliveries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Globally-unique key across producers: `${capabilityId}:${producer's own opportunity id}`.
  opportunityId: text("opportunity_id").notNull(),
  capabilityId: text("capability_id").notNull(),
  domain: text("domain").notNull(),
  type: text("type").notNull(),
  priority: text("priority").notNull(), // "high" | "medium" | "low"
  surface: text("surface").notNull(), // ConversationSurface this opportunity was delivered to
  status: text("status").notNull().default("delivered"), // "delivered" | "acknowledged" | "dismissed" | "accepted"
  deliveredAt: timestamp("delivered_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }), // set on "dismissed" or "accepted"
}, (table) => ({
  userOpportunityUnique: unique("opportunity_deliveries_user_opportunity_unique").on(table.userId, table.opportunityId),
  userStatusIdx: index("opportunity_deliveries_user_status_idx").on(table.userId, table.status),
}));

export const insertOpportunityDeliverySchema = createInsertSchema(opportunityDeliveries).omit({
  id: true,
  deliveredAt: true,
  resolvedAt: true,
});

export type OpportunityDelivery = typeof opportunityDeliveries.$inferSelect;
export type InsertOpportunityDelivery = z.infer<typeof insertOpportunityDeliverySchema>;

// ─── Evidence & Learning Platform (EL1) ────────────────────────────────────────
// Single canonical owner: server/intelligence/evidence-learning/evidence-learning-store.ts
// (see docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md). This is
// the "Personalisation Event Log" component named (but not built) at
// THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §4.2/§7.2 — built here as a
// reusable, domain-agnostic platform capability rather than a Food-Intelligence-
// owned store, so any future Domain Intelligence layer can be a consumer.
//
// Two tables, two different scopes (Principle 2 scope test):
//   - household_evidence_events: the raw, append-only capture of a single
//     structured household outcome. Never edited after insert.
//   - household_learning_signals: a DERIVED, re-evaluated-in-place pattern over
//     an accumulation of evidence events for one (domain, subjectType,
//     subjectKey, direction) dimension. Never created or advanced to
//     "confirmed" from a single evidence event — the detector enforces a
//     minimum evidence count (see evidence-learning/framework.ts).
//
// EL1 owns zero business-domain/preference data (mirrors Rule FI1): it never
// writes a household's actual dietary/preference state itself. A signal only
// reaches "confirmed" through an explicit household confirmation action
// (the `approve` verb); adapting an actual preference store on the strength of
// a confirmed signal remains a separate, human-triggered write through that
// preference store's own owning capability — never a private write path from
// here.
export const householdEvidenceEvents = pgTable("household_evidence_events", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  /** The reporting Domain Intelligence / business domain, e.g. "food-intelligence". */
  domain: text("domain").notNull(),
  /** The kind of thing this outcome is about, e.g. "meal", "swap", "ingredient". */
  subjectType: text("subject_type").notNull(),
  /** The specific instance, namespaced by the reporting domain, e.g. "meal:412" — for citation/explainability only, never a second identity for that entity. */
  subjectId: text("subject_id").notNull(),
  /** The stable dimension pattern-detection groups on, e.g. "cuisine:italian" or a food/tag slug — coarser than subjectId by design. */
  subjectKey: text("subject_key").notNull(),
  /** The specific thing that happened, e.g. "accepted", "rejected", "completed", "skipped" — closed vocabulary owned by the reporting domain, not interpreted here. */
  outcomeType: text("outcome_type").notNull(),
  /** Normalised direction of this single outcome, decided by the reporting domain — EL1 only counts/accumulates it, never infers it. */
  direction: text("direction").notNull(), // "positive" | "negative" | "neutral"
  /** Optional additional detail (e.g. tags) the reporting domain wants preserved for explainability. Never a second copy of business-domain facts — free-form context only. */
  context: jsonb("context"),
  /** Which capability reported this event (Capability Registry id). */
  sourceCapabilityId: text("source_capability_id").notNull(),
  /** When the outcome actually happened. */
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  /** When THA captured it — kept distinct from occurredAt for honest backfill support. */
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  householdSubjectIdx: index("household_evidence_events_household_subject_idx").on(
    table.householdId, table.domain, table.subjectType, table.subjectKey,
  ),
  householdOccurredIdx: index("household_evidence_events_household_occurred_idx").on(table.householdId, table.occurredAt),
}));

export const insertHouseholdEvidenceEventSchema = createInsertSchema(householdEvidenceEvents).omit({
  id: true,
  recordedAt: true,
});

export type HouseholdEvidenceEvent = typeof householdEvidenceEvents.$inferSelect;
export type InsertHouseholdEvidenceEvent = z.infer<typeof insertHouseholdEvidenceEventSchema>;

/**
 * A DERIVED pattern over accumulated evidence events for one dimension. Never
 * user-visible or preference-adapting until `status` reaches "confirmed"
 * through an explicit household confirmation (`approve` verb) — see
 * evidence-learning-handler.ts. One row per (household, domain, subjectType,
 * subjectKey, direction); re-detection UPDATES this row rather than inserting
 * a new one (see upsertSignal in evidence-learning-store.ts), except once a
 * household has confirmed or declined it — after that, only the evidence
 * fields refresh; status is never silently reset back to pending (no nagging,
 * mirrors the OD1 delivery framework's terminal-status discipline).
 */
export const householdLearningSignals = pgTable("household_learning_signals", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  subjectType: text("subject_type").notNull(),
  subjectKey: text("subject_key").notNull(),
  direction: text("direction").notNull(), // "positive" | "negative"
  evidenceCount: integer("evidence_count").notNull(),
  /** Ratio (0..1) of considered events that agreed with `direction`. */
  consistency: real("consistency").notNull(),
  /** Deterministic bucket from evidenceCount + consistency — never an ML confidence score. */
  confidence: text("confidence").notNull(), // "low" | "medium" | "high"
  /** household_evidence_events.id values this pattern is built from — the explainability trail. */
  supportingEventIds: jsonb("supporting_event_ids").notNull(),
  /** Deterministic, human-readable explanation, e.g. "5 of 6 recent outcomes for X were positive". */
  rationale: text("rationale").notNull(),
  status: text("status").notNull().default("pending_confirmation"), // "pending_confirmation" | "confirmed" | "declined"
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  lastEvaluatedAt: timestamp("last_evaluated_at", { withTimezone: true }).notNull().defaultNow(),
  confirmedByUserId: integer("confirmed_by_user_id").references(() => users.id),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  confirmationNotes: text("confirmation_notes"),
}, (table) => ({
  householdDimensionUnique: unique("household_learning_signals_dimension_unique").on(
    table.householdId, table.domain, table.subjectType, table.subjectKey, table.direction,
  ),
  householdStatusIdx: index("household_learning_signals_household_status_idx").on(table.householdId, table.status),
}));

export const insertHouseholdLearningSignalSchema = createInsertSchema(householdLearningSignals).omit({
  id: true,
  detectedAt: true,
  lastEvaluatedAt: true,
  confirmedByUserId: true,
  confirmedAt: true,
});

export type HouseholdLearningSignal = typeof householdLearningSignals.$inferSelect;
export type InsertHouseholdLearningSignal = z.infer<typeof insertHouseholdLearningSignalSchema>;

// ---------------------------------------------------------------------------
// OBS1 — Observation Engine (canonical platform telemetry)
// ---------------------------------------------------------------------------
// platform_observations: the single durable store of runtime observations
// across the Intelligence Platform — intent resolution, capability invocation,
// context composition, knowledge retrieval, response generation, recovery,
// clarification, escalation, manual overrides, user feedback, and benchmark
// runs. Sole owner: server/intelligence/observation/observation-store.ts.
//
// Extensibility rule: new analytical needs are met by the closed-but-growable
// `kind` vocabulary plus the JSONB `metadata` bag — never by schema redesign.
// Privacy rule: no utterance or capability result payload is ever stored next
// to a user id; metadata carries shapes and counts, not content (the one
// exception is the pre-existing PII-scrubbed fallback log discipline, which
// stores a truncated utterance with NO user attribution).
// Retention: bounded operational window (pruned by the store), not an archive.
export const platformObservations = pgTable("platform_observations", {
  id: serial("id").primaryKey(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
  /** Closed ObservationKind vocabulary — see server/intelligence/observation/observation-engine.ts */
  kind: text("kind").notNull(),
  severity: text("severity").notNull().default("info"), // "info" | "warning" | "error"
  /** Outcome vocabulary: IntentOutcomeStatus values plus "ok" | "error" | "gap" | "clarification" */
  outcome: text("outcome"),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  /** Correlation id: conversation thread id for turns, benchmark run id for benchmark observations. */
  sessionId: text("session_id"),
  surface: text("surface"),
  capability: text("capability"),
  verb: text("verb"),
  /** Convenience projection "<capability>:<verb>" for intent-level grouping. */
  intent: text("intent"),
  contextView: text("context_view"),
  confidence: real("confidence"),
  durationMs: integer("duration_ms"),
  recoveryPath: text("recovery_path"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
}, (table) => ({
  observedAtIdx: index("platform_observations_observed_at_idx").on(table.observedAt),
  kindObservedAtIdx: index("platform_observations_kind_observed_at_idx").on(table.kind, table.observedAt),
  capabilityIdx: index("platform_observations_capability_idx").on(table.capability),
  sessionIdx: index("platform_observations_session_idx").on(table.sessionId),
}));

export const insertPlatformObservationSchema = createInsertSchema(platformObservations).omit({
  id: true,
  observedAt: true,
});

export type PlatformObservation = typeof platformObservations.$inferSelect;
export type InsertPlatformObservation = z.infer<typeof insertPlatformObservationSchema>;

// ─── TRUST1-S5 — authentication rate limiting ────────────────────────────────
// The shared counter behind every authentication rate limit (server/lib/auth-rate-limit.ts).
//
// Declared here for one specific reason beyond tidiness: a table that exists in Postgres but not
// in this file is a table drizzle-kit will offer to DROP. The migration runner creates it; this
// declaration is what stops a `drizzle-kit push` from deleting it.
//
// TRUST1-O8 UPDATE: the production push path this originally defended against
// (`scripts/migrate-prod.sh`, `drizzle-kit push --force` straight at the production database) is
// GONE — deleted, along with the post-merge hook that pushed a schema after every git merge.
// `push` now survives only behind `scripts/db/schema-push-guard.ts`, which cannot reach a managed
// database. The declaration below is kept regardless: it is correct, it is what keeps a *dev* push
// from dropping the table, and O8 found a second table that lacked exactly this protection
// (`barcode_lookup_events`, declared below) and had been silently exposed to it for months.
//
// NO PERSONAL DATA. `key` is an HMAC-SHA256 of an IP address or an email address under
// SESSION_SECRET — never the value itself. An IP is personal data under UK GDPR, and this table is
// consulted on every login attempt on the platform, so a plaintext key would have quietly built the
// exact record TRUST1-P8 is busy deleting from the logs.
//
// Rows are ephemeral operational state, not records: they expire on their own, the store prunes
// them, and rotating SESSION_SECRET orphans all of them harmlessly.
export const authRateLimits = pgTable("auth_rate_limits", {
  /** HMAC-SHA256(policy + IP | email | user id, SESSION_SECRET), prefixed by policy id. */
  key: text("key").primaryKey(),
  hits: integer("hits").notNull().default(0),
  /** End of the current fixed window. A row whose expiry has passed is reset, not accumulated. */
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  expiresAtIdx: index("auth_rate_limits_expires_at_idx").on(table.expiresAt),
}));

export type AuthRateLimit = typeof authRateLimits.$inferSelect;

// ─── TRUST1-O8 — barcode lookup events ───────────────────────────────────────
// Operational telemetry for Open Food Facts barcode lookups. Written by server/routes.ts via raw
// SQL (`INSERT INTO barcode_lookup_events …`), created by the reviewed migration
// `2026-04-02_add_barcode_lookup_events`.
//
// THIS DECLARATION IS A DATA-LOSS FIX, and it is the sharpest evidence TRUST1-O8 found that risk
// R6 was never theoretical. The table has existed in Postgres since April and has never existed in
// this file. Drizzle offers to DROP any table it finds in the database but not in the schema —
// and `scripts/migrate-prod.sh` ran `drizzle-kit push --force`, which does not ask. Every
// production push since April was therefore an offer to destroy this table and every row in it,
// accepted automatically. TRUST1-S5 spotted the hazard and defended its own table (above); nothing
// generalised that defence, so this one stayed exposed.
//
// The push paths are gone now. This declaration closes the hole behind them, and matches the
// migration's DDL exactly — plain `integer` user_id (the migration declares no foreign key, and
// adding one here would make the next dev push try to create it), and a `timestamp` WITHOUT time
// zone, because the migration says TIMESTAMP and not TIMESTAMPTZ. A declaration that does not
// mirror the DDL is not protection; it is a queued ALTER TABLE.
//
// NOTE: nothing reads through this Drizzle table object today — routes.ts still uses raw SQL, and
// O8 deliberately does not change that (it would be a behaviour change in an unrelated feature).
// The declaration exists to make the table VISIBLE to drizzle-kit, which is the entire point.
export const barcodeLookupEvents = pgTable("barcode_lookup_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  barcode: text("barcode").notNull(),
  lookupSource: text("lookup_source").notNull().default("off"),
  status: text("status").notNull(),
  httpStatus: integer("http_status").notNull(),
  offProductCode: text("off_product_code"),
  offProductName: text("off_product_name"),
  failureReason: text("failure_reason"),
  requestUrl: text("request_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  barcodeIdx: index("idx_barcode_lookup_events_barcode").on(table.barcode),
  userIdIdx: index("idx_barcode_lookup_events_user_id").on(table.userId),
  statusIdx: index("idx_barcode_lookup_events_status").on(table.status),
}));

export type BarcodeLookupEvent = typeof barcodeLookupEvents.$inferSelect;
