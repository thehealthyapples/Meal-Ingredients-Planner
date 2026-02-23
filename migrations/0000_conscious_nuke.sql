CREATE TABLE "additives" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"description" text,
	CONSTRAINT "additives_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "basket_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"meal_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "diets_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "freezer_meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"meal_id" integer NOT NULL,
	"total_portions" integer DEFAULT 1 NOT NULL,
	"remaining_portions" integer DEFAULT 1 NOT NULL,
	"frozen_date" text NOT NULL,
	"expiry_date" text,
	"batch_label" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "grocery_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingredient_name" text NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"image_url" text,
	"weight" text,
	"supermarket" text NOT NULL,
	"tier" text DEFAULT 'standard' NOT NULL,
	"price" real,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"product_url" text,
	"price_per_unit" text
);
--> statement-breakpoint
CREATE TABLE "ingredient_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"shopping_list_item_id" integer NOT NULL,
	"meal_id" integer NOT NULL,
	"meal_name" text NOT NULL,
	"quantity_multiplier" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredient_swaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"original" text NOT NULL,
	"healthier" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_allergens" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer NOT NULL,
	"allergen" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "meal_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "meal_diets" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer NOT NULL,
	"diet_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_plan_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"slot" text NOT NULL,
	"meal_id" integer NOT NULL,
	"meal_template_id" integer,
	"resolved_source_type" text
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"week_start" text NOT NULL,
	"name" text NOT NULL,
	"calorie_target" integer,
	"people_count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_template_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_template_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"brand" text,
	"store" text,
	"quality_tier" text DEFAULT 'standard' NOT NULL,
	"estimated_price" real,
	"upf_score" integer,
	"smp_rating" integer,
	"image_url" text,
	"barcode" text
);
--> statement-breakpoint
CREATE TABLE "meal_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'dinner' NOT NULL,
	"description" text,
	"image_url" text,
	"default_calories" integer,
	"default_protein" integer,
	"default_carbs" integer,
	"default_fat" integer
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"ingredients" text[] NOT NULL,
	"instructions" text[],
	"image_url" text,
	"servings" integer DEFAULT 1 NOT NULL,
	"category_id" integer,
	"source_url" text,
	"meal_template_id" integer,
	"meal_source_type" text DEFAULT 'scratch' NOT NULL,
	"is_ready_meal" boolean DEFAULT false NOT NULL,
	"is_system_meal" boolean DEFAULT false NOT NULL,
	"meal_format" text DEFAULT 'recipe' NOT NULL,
	"diet_types" text[] DEFAULT '{}' NOT NULL,
	"is_freezer_eligible" boolean DEFAULT true NOT NULL,
	"audience" text DEFAULT 'adult' NOT NULL,
	"is_drink" boolean DEFAULT false NOT NULL,
	"drink_type" text,
	"barcode" text,
	"brand" text,
	"original_meal_id" integer
);
--> statement-breakpoint
CREATE TABLE "normalized_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer NOT NULL,
	"calories" text,
	"protein" text,
	"carbs" text,
	"fat" text,
	"sugar" text,
	"salt" text,
	"source" text
);
--> statement-breakpoint
CREATE TABLE "planner_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	CONSTRAINT "planner_days_week_day_unique" UNIQUE("week_id","day_of_week")
);
--> statement-breakpoint
CREATE TABLE "planner_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"day_id" integer NOT NULL,
	"meal_type" text NOT NULL,
	"audience" text DEFAULT 'adult' NOT NULL,
	"meal_id" integer NOT NULL,
	"calories" integer DEFAULT 0,
	"is_drink" boolean DEFAULT false NOT NULL,
	"drink_type" text
);
--> statement-breakpoint
CREATE TABLE "planner_weeks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"week_number" integer NOT NULL,
	"week_name" text NOT NULL,
	CONSTRAINT "planner_weeks_user_week_unique" UNIQUE("user_id","week_number")
);
--> statement-breakpoint
CREATE TABLE "product_additives" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_barcode" text NOT NULL,
	"additive_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"barcode" text,
	"product_name" text NOT NULL,
	"brand" text,
	"image_url" text,
	"nova_group" integer,
	"nutriscore_grade" text,
	"smp_rating" integer,
	"upf_score" integer,
	"health_score" integer,
	"scanned_at" text NOT NULL,
	"source" text DEFAULT 'search' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"shopping_list_item_id" integer NOT NULL,
	"supermarket" text NOT NULL,
	"product_name" text NOT NULL,
	"price" real,
	"price_per_unit" text,
	"product_url" text,
	"image_url" text,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"tier" text DEFAULT 'standard' NOT NULL,
	"product_weight" text,
	"tesco_product_id" text,
	"sainsburys_product_id" text,
	"ocado_product_id" text,
	"smp_rating" integer
);
--> statement-breakpoint
CREATE TABLE "shopping_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"normalized_name" text,
	"quantity_value" real,
	"unit" text,
	"quantity_in_grams" real,
	"image_url" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"brand" text,
	"category" text,
	"selected_tier" text,
	"ingredient_id" integer,
	"matched_product_id" text,
	"matched_store" text,
	"matched_price" real,
	"available_stores" text,
	"smp_rating" integer,
	"checked" boolean DEFAULT false NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"validation_note" text,
	"selected_store" text
);
--> statement-breakpoint
CREATE TABLE "supermarket_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"search_url" text NOT NULL,
	"logo_url" text
);
--> statement-breakpoint
CREATE TABLE "user_health_trends" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" text NOT NULL,
	"average_smp_rating" real NOT NULL,
	"elite_count" integer DEFAULT 0 NOT NULL,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"diet_types" text[] DEFAULT '{}' NOT NULL,
	"excluded_ingredients" text[] DEFAULT '{}' NOT NULL,
	"health_goals" text[] DEFAULT '{}' NOT NULL,
	"budget_level" text DEFAULT 'standard' NOT NULL,
	"preferred_stores" text[] DEFAULT '{}' NOT NULL,
	"upf_sensitivity" text DEFAULT 'moderate' NOT NULL,
	"quality_preference" text DEFAULT 'standard' NOT NULL,
	"calorie_target" integer,
	"calorie_mode" text DEFAULT 'auto' NOT NULL,
	"height_cm" real,
	"weight_kg" real,
	"activity_level" text DEFAULT 'moderate' NOT NULL,
	"goal_type" text DEFAULT 'maintain' NOT NULL,
	"adults_count" integer DEFAULT 1 NOT NULL,
	"children_count" integer DEFAULT 0 NOT NULL,
	"babies_count" integer DEFAULT 0 NOT NULL,
	"sound_enabled" boolean DEFAULT true NOT NULL,
	"elite_tracking_enabled" boolean DEFAULT true NOT NULL,
	"health_trend_enabled" boolean DEFAULT true NOT NULL,
	"barcode_scanner_enabled" boolean DEFAULT true NOT NULL,
	"planner_show_calories" boolean DEFAULT true NOT NULL,
	"planner_enable_baby_meals" boolean DEFAULT false NOT NULL,
	"planner_enable_child_meals" boolean DEFAULT false NOT NULL,
	"planner_enable_drinks" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"current_elite_streak" integer DEFAULT 0 NOT NULL,
	"best_elite_streak" integer DEFAULT 0 NOT NULL,
	"last_elite_date" text,
	"weekly_elite_count" integer DEFAULT 0 NOT NULL,
	"week_start_date" text,
	CONSTRAINT "user_streaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"display_name" text,
	"profile_photo_url" text,
	"measurement_preference" text DEFAULT 'metric' NOT NULL,
	"preferred_price_tier" text DEFAULT 'standard' NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"starter_meals_loaded" boolean DEFAULT false NOT NULL,
	"is_beta_user" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
