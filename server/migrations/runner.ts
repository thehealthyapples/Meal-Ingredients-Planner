/**
 * Migration Runner
 * ================
 * Applies ordered SQL migrations at server startup and tracks them in
 * the `schema_migrations` table so each migration runs exactly once.
 *
 * HOW TO ADD A NEW MIGRATION
 * ---------------------------
 * 1. Add a new entry to the MIGRATIONS array below (append to the END).
 * 2. Choose a unique id in the format:  YYYY-MM-DD_short_description
 *    Example: "2026-03-15_add_user_goals_column"
 * 3. Put all SQL for that migration in the `statements` array.
 *    Each string is executed as a separate statement inside a transaction.
 * 4. Use safe, idempotent SQL — prefer IF NOT EXISTS / IF EXISTS so the
 *    migration can be re-run safely if the transaction was partially applied.
 * 5. Commit and deploy — the runner applies it once and records it.
 * ---------------------------
 *
 * THE ONE EXCEPTION TO "APPEND TO THE END" — THE BASELINE (CONV1 P10 / SCH-3)
 * ---------------------------------------------------------------------------
 * The FIRST entry in the list is a **schema baseline**: it creates the 45 tables that
 * predate this migration system and were only ever created by `drizzle-kit push`. It sits
 * at the HEAD, and it is the only entry that may.
 *
 * **Why the append-only rule could not cover it.** Those tables existed BEFORE migration
 * #1. The list's second entry is `2026-02-27_add_user_diet_fields`, which does
 * `ALTER TABLE users …` — and `users` was created by no migration at all. Appending the
 * CREATEs would put them AFTER the 76 migrations that alter them, so a rebuild from empty
 * fails on the second statement it reaches. **This is not a theory; both were measured**
 * (CONV1 P10's report § 3):
 *
 *     baseline APPENDED : 17/93 migrations apply · 65/91 tables built  ← and the coverage
 *                                                                        gate still reports 100%
 *     baseline AT HEAD  : 93/93 migrations apply · 91/91 tables built
 *
 * The same statements. Only the position differs. **Appending would have made the gate
 * green and left the schema unbuildable** — the exact failure that gate exists to detect.
 *
 * **Why this does not break the rule's purpose.** The rule protects APPLIED HISTORY: never
 * remove an entry, never reorder entries relative to one another, never edit one that has
 * shipped. The baseline does none of that — it removes nothing, edits nothing, and changes
 * no existing entry's relative order. And position is irrelevant to a database that already
 * exists: `runMigrations()` keys on IDs and applies only what is pending, so the baseline
 * arrives as a no-op wherever it sits in the array.
 *
 * **Rule, going forward: there is exactly ONE baseline and it is already here. Everything
 * else appends to the END.** A second entry at the head would be reordering, and that is
 * what this rule forbids.
 */

import { pool } from "../db";

interface Migration {
  id: string;
  statements: string[];
}

// ─── ORDERED MIGRATION LIST ──────────────────────────────────────────────────
// IMPORTANT: Never remove or reorder entries. Only append new ones at the end.
//
// AMENDED 2026-07-17 (CONV1 P10 / SCH-3), by the change that made the unqualified rule
// impossible to obey: entry [0] is the SCHEMA BASELINE and is the sole permitted
// exception — see "THE ONE EXCEPTION" in this file's header. It creates the tables that
// predate this list, so it must precede the migrations that alter them. There is exactly
// one, it is already here, and everything after it appends to the END.
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATIONS: Migration[] = [
  // ── CONV1 P10 / SCH-3 — THE SCHEMA BASELINE. THE LONG GAME. ─────────────────
  //
  // ** THIS ENTRY IS FIRST ON PURPOSE, AND IT IS THE ONLY ONE THAT MAY BE. **
  // It creates the tables that predate this migration list, so it must run before the
  // migrations that ALTER them. Measured both ways, on one pinned connection, into an
  // empty schema:
  //
  //     this entry APPENDED at the end : 17/93 migrations apply · 65/91 tables built
  //     this entry AT THE HEAD         : 93/93 migrations apply · 91/91 tables built
  //
  // Same statements; only the position differs. See this file's header for why the
  // append-only rule was amended rather than quietly broken, and CONV1 P10's report § 3.
  //
  // 45 of THA's 91 declared tables had no reviewed migration. They existed in a database
  // ONLY because somebody once ran `drizzle-kit push` from shared/schema.ts — no review,
  // no transaction boundary, no version record, no reproducible provenance. Every domain
  // in the CONV1 programme publishes into a projection whose TABLE could not be rebuilt
  // from this file: `users`, `meals`, `planner_weeks`, `planner_days`, `planner_entries`,
  // `shopping_list`, `user_preferences`, `meal_templates` among them. CPI1 called it
  // "arguably the deepest structural defect in the platform", and it survived this long
  // for one reason: **it has no user impact at all.** It is a disaster-recovery and
  // reproducibility defect. You notice it exactly once, on the worst day.
  //
  // ── WHY THIS IS SAFE, STATED PRECISELY ──────────────────────────────────────
  // Every statement below is guarded — a table create with an existence check, a
  // constraint add, or a guarded index create. **On every database that exists today,
  // every one of them
  // is a NO-OP** — the tables are already there. This migration changes no row, no column,
  // no type and no behaviour. Its only effect is on an EMPTY database: CI, a fresh dev
  // box, a restore. That is the entire point.
  //
  // ── WHERE THIS DDL CAME FROM, AND WHY IT MATTERS ────────────────────────────
  // **It was introspected from the live database's ACTUAL shape (information_schema), not
  // transcribed from shared/schema.ts.** That distinction is the whole risk of this
  // phase. A `CREATE TABLE` that disagrees with reality would be INVISIBLE here — the
  // `IF NOT EXISTS` swallows it on every existing database — while quietly building a
  // WRONG schema on a fresh one. And the coverage gate is a text grep, so it would report
  // 100% either way. **`SEC-3` is exactly this defect at one column** ("two identical
  // declarations, two different physical types"), which is why the declaration was not
  // trusted as the source.
  //
  // ── IT WAS PROVEN, NOT ASSERTED (CP10) — TWICE, BECAUSE ONCE WAS NOT ENOUGH ──
  // This migration must satisfy TWO different properties, and proving one does not prove
  // the other:
  //
  //   1. IT BUILDS FROM NOTHING. Every statement executed into an EMPTY Postgres schema,
  //      then diffed column by column against the live tables:
  //          tables 45/45 · constraints 22/22 · indexes 11/11 built from this DDL alone
  //          column-by-column diff vs live: 45/45 IDENTICAL
  //   2. IT IS A NO-OP ON A DATABASE THAT ALREADY HAS EVERYTHING. Applied at boot against
  //      the live database and the full column census compared before and after.
  //
  // **The first draft passed (1) and FAILED (2), at boot, loudly**: the constraint
  // statements were bare `ALTER TABLE … ADD CONSTRAINT`, which an empty schema accepts
  // and an existing database rejects ("constraint … already exists"). The runner's
  // transaction rolled the whole thing back and the boot aborted — failing closed, as
  // designed — so nothing leaked; but had this shipped, **every existing deployment would
  // have failed to start.** Postgres has no ADD CONSTRAINT … IF NOT EXISTS, so each one
  // is now wrapped in a pg_constraint existence check.
  //
  // The lesson is worth more than the fix: "it rebuilds an empty database" and "it does
  // nothing to a full one" are different claims, and a scratch-schema test can only ever
  // demonstrate the first.
  //
  // ── A NOTE FOR WHOEVER EDITS THESE COMMENTS ─────────────────────────────────
  // `verify:schema-coverage` greps this WHOLE FILE, comments included, for
  // `CREATE TABLE [IF NOT EXISTS] <name>`. Its optional existence-check group requires
  // trailing WHITESPACE, so writing that phrase in prose immediately followed by a
  // backtick makes the gate capture the word "IF" and report a phantom orphan table.
  // (It did, from this very comment block, until it was reworded.) Prose in this file is
  // read by the gate as if it were DDL — so describe the statements; do not quote them.
  //
  // ── WHAT THIS MIGRATION IS NOT ──────────────────────────────────────────────
  // It is **additive only**. No DROP, no ALTER of an existing column, no retype, no data
  // touched — `R7`: "the scaffolding is deleted first, because it looks like obvious
  // debt." It gives 45 tables a reviewed PROVENANCE; it gives none of them a new owner
  // (Register Rule 7 is not triggered). And it closes the TABLE-level gap only: columns
  // added declaratively to already-covered tables remain undetected by the gate, which
  // says so itself — "true coverage is no better than the figure above".
  {
    id: "2026-07-17_conv1_p10_schema_coverage",
    statements: [
      `CREATE TABLE IF NOT EXISTS "additives" (
  "id" serial NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "risk_level" text DEFAULT 'low'::text NOT NULL,
  "description" text,
  "is_regulatory" boolean DEFAULT false,
  "aliases" text[],
  CONSTRAINT "additives_pkey" PRIMARY KEY (id),
  CONSTRAINT "additives_name_unique" UNIQUE (name)
)`,
      `CREATE TABLE IF NOT EXISTS "basket_items" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "meal_id" integer NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  CONSTRAINT "basket_items_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "diversity_group" (
  "id" serial NOT NULL,
  "slug" text NOT NULL,
  "display_name" text NOT NULL,
  "description" text,
  "count_as_single_plant" boolean DEFAULT true NOT NULL,
  "source" text DEFAULT 'THA editorial'::text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "diversity_group_pkey" PRIMARY KEY (id),
  CONSTRAINT "diversity_group_slug_key" UNIQUE (slug)
)`,
      `CREATE TABLE IF NOT EXISTS "canonical_food" (
  "id" serial NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "subcategory" text,
  "description" text,
  "knowledge_food_slug" text,
  "diversity_group_slug" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "source" text DEFAULT 'THA editorial'::text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "tier" text DEFAULT 'canonical'::text NOT NULL,
  "scientific_name" text,
  "source_ref" text,
  "confidence" text,
  "family" text,
  "availability" text,
  "availability_modifiers" text[] DEFAULT '{}'::text[] NOT NULL,
  "peak_seasons" text[] DEFAULT '{}'::text[] NOT NULL,
  "origin_region" text,
  "fermented" boolean DEFAULT false NOT NULL,
  CONSTRAINT "canonical_food_pkey" PRIMARY KEY (id),
  CONSTRAINT "canonical_food_slug_key" UNIQUE (slug)
)`,
      `CREATE TABLE IF NOT EXISTS "canonical_food_alias" (
  "id" serial NOT NULL,
  "canonical_food_id" integer NOT NULL,
  "alias" text NOT NULL,
  "alias_key" text NOT NULL,
  "alias_type" text NOT NULL,
  "source" text DEFAULT 'THA editorial'::text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "canonical_food_alias_pkey" PRIMARY KEY (id),
  CONSTRAINT "canonical_food_alias_alias_key_key" UNIQUE (alias_key)
)`,
      `CREATE TABLE IF NOT EXISTS "companion_action_proposals" (
  "id" serial NOT NULL,
  "conversation_turn_id" integer NOT NULL,
  "workflow_id" text NOT NULL,
  "capability_id" text NOT NULL,
  "verb" text NOT NULL,
  "label" text NOT NULL,
  "parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "confirmation_tier" text NOT NULL,
  "status" text DEFAULT 'proposed'::text NOT NULL,
  "result_summary" text,
  "error_code" text,
  "error_message" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "resolved_at" timestamptz,
  CONSTRAINT "companion_action_proposals_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "companion_guidance_events" (
  "id" serial NOT NULL,
  "conversation_turn_id" integer NOT NULL,
  "event_kind" text NOT NULL,
  "source_domain" text NOT NULL,
  "domain" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "source_capability_id" text,
  "target_capability_id" text,
  "target_verb" text,
  CONSTRAINT "companion_guidance_events_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "companion_health_snapshots" (
  "id" serial NOT NULL,
  "total_events" integer NOT NULL,
  "total_turns" integer NOT NULL,
  "by_stage" jsonb NOT NULL,
  "by_state" jsonb NOT NULL,
  "by_surface" jsonb NOT NULL,
  "gap_counts" jsonb NOT NULL,
  "top_unmatched_utterances" jsonb NOT NULL,
  "routing_failures" jsonb NOT NULL,
  "capability_gap_clusters" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "companion_health_snapshots_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "users" (
  "id" serial NOT NULL,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "measurement_preference" text DEFAULT 'metric'::text NOT NULL,
  "preferred_price_tier" text DEFAULT 'standard'::text NOT NULL,
  "onboarding_completed" boolean DEFAULT false NOT NULL,
  "starter_meals_loaded" boolean DEFAULT false NOT NULL,
  "is_beta_user" boolean DEFAULT false NOT NULL,
  "display_name" text,
  "profile_photo_url" text,
  "email_verified" boolean DEFAULT false NOT NULL,
  "email_verification_token" text,
  "email_verification_expires" timestamptz,
  "eating_schedule" text,
  "password_reset_token" text,
  "password_reset_expires" timestamptz,
  "role" text DEFAULT 'user'::text NOT NULL,
  "subscription_tier" text DEFAULT 'free'::text NOT NULL,
  "subscription_status" text,
  "subscription_expires_at" timestamptz,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "is_demo" boolean DEFAULT false NOT NULL,
  "demo_expires_at" timestamptz,
  "demo_claimed_email" text,
  "first_name" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "last_login_at" timestamptz,
  "last_seen_at" timestamptz,
  "custom_metric_defs" jsonb,
  "diary_extra_metrics" jsonb,
  CONSTRAINT "users_pkey" PRIMARY KEY (id),
  CONSTRAINT "users_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text]))),
  CONSTRAINT "users_subscription_tier_check" CHECK ((subscription_tier = ANY (ARRAY['free'::text, 'premium'::text, 'friends_family'::text]))),
  CONSTRAINT "users_username_unique" UNIQUE (username)
)`,
      `CREATE TABLE IF NOT EXISTS "companion_learning_recommendations" (
  "id" serial NOT NULL,
  "snapshot_id" integer NOT NULL,
  "kind" text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "payload" jsonb NOT NULL,
  "rationale" text NOT NULL,
  "confidence" text DEFAULT 'low'::text NOT NULL,
  "reviewed_by" integer,
  "reviewed_at" timestamptz,
  "review_notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "companion_learning_recommendations_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "companion_response_feedback" (
  "id" serial NOT NULL,
  "conversation_turn_id" integer NOT NULL,
  "rating" text NOT NULL,
  "reason_code" text,
  "note" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "companion_response_feedback_pkey" PRIMARY KEY (id),
  CONSTRAINT "companion_response_feedback_conversation_turn_id_key" UNIQUE (conversation_turn_id)
)`,
      `CREATE TABLE IF NOT EXISTS "diets" (
  "id" serial NOT NULL,
  "name" text NOT NULL,
  CONSTRAINT "diets_pkey" PRIMARY KEY (id),
  CONSTRAINT "diets_name_unique" UNIQUE (name)
)`,
      `CREATE TABLE IF NOT EXISTS "food_variety" (
  "id" serial NOT NULL,
  "canonical_food_id" integer NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "source" text DEFAULT 'THA editorial'::text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "food_variety_pkey" PRIMARY KEY (id),
  CONSTRAINT "food_variety_slug_key" UNIQUE (slug)
)`,
      `CREATE TABLE IF NOT EXISTS "freezer_meals" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "meal_id" integer NOT NULL,
  "total_portions" integer DEFAULT 1 NOT NULL,
  "remaining_portions" integer DEFAULT 1 NOT NULL,
  "frozen_date" text NOT NULL,
  "expiry_date" text,
  "batch_label" text,
  "notes" text,
  "household_id" integer,
  CONSTRAINT "freezer_meals_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "grocery_products" (
  "id" serial NOT NULL,
  "ingredient_name" text NOT NULL,
  "name" text NOT NULL,
  "brand" text,
  "image_url" text,
  "weight" text,
  "supermarket" text NOT NULL,
  "tier" text DEFAULT 'standard'::text NOT NULL,
  "price" real,
  "currency" text DEFAULT 'GBP'::text NOT NULL,
  "product_url" text,
  "price_per_unit" text,
  CONSTRAINT "grocery_products_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "ingredient_sources" (
  "id" serial NOT NULL,
  "shopping_list_item_id" integer NOT NULL,
  "meal_id" integer NOT NULL,
  "meal_name" text NOT NULL,
  "quantity_multiplier" integer DEFAULT 1 NOT NULL,
  "week_number" integer,
  "day_of_week" integer,
  "meal_slot" text,
  "eater_ids" int4[],
  "guest_eaters" jsonb,
  CONSTRAINT "ingredient_sources_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "ingredient_swaps" (
  "id" serial NOT NULL,
  "original" text NOT NULL,
  "healthier" text NOT NULL,
  CONSTRAINT "ingredient_swaps_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "knowledge_releases" (
  "id" serial NOT NULL,
  "published_at" timestamptz DEFAULT now() NOT NULL,
  "approved_by_user_id" integer,
  "approved_by_user_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "published_by_user_id" integer,
  "aliases_published" integer DEFAULT 0 NOT NULL,
  "new_entities" integer DEFAULT 0 NOT NULL,
  "updated_entities" integer DEFAULT 0 NOT NULL,
  "rejected_proposals" integer DEFAULT 0 NOT NULL,
  "deferred_proposals" integer DEFAULT 0 NOT NULL,
  "linked_batch_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "linked_proposal_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "rollback_id" integer,
  "notes" text,
  "status" text DEFAULT 'published'::text NOT NULL,
  "rolled_back_at" timestamptz,
  "rolled_back_by_user_id" integer,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "knowledge_releases_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "knowledge_review_audit" (
  "id" serial NOT NULL,
  "entity" text NOT NULL,
  "entity_id" integer,
  "action" text NOT NULL,
  "actor_kind" text DEFAULT 'human'::text NOT NULL,
  "actor_user_id" integer,
  "release_id" integer,
  "before" jsonb,
  "after" jsonb,
  "detail" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "knowledge_review_audit_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "knowledge_review_batches" (
  "id" serial NOT NULL,
  "direction" text DEFAULT 'import'::text NOT NULL,
  "format" text DEFAULT 'json'::text NOT NULL,
  "schema_version" text,
  "checksum" text,
  "exported_at" timestamptz,
  "reviewer_model" text,
  "source_filename" text,
  "item_count" integer DEFAULT 0 NOT NULL,
  "proposal_count" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'imported'::text NOT NULL,
  "notes" text,
  "created_by_user_id" integer,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "knowledge_review_batches_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "knowledge_review_queue" (
  "id" serial NOT NULL,
  "review_type" text DEFAULT 'vocabulary'::text NOT NULL,
  "domain" text NOT NULL,
  "dedupe_key" text NOT NULL,
  "label" text NOT NULL,
  "source" text NOT NULL,
  "contexts" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "occurrence_count" integer DEFAULT 1 NOT NULL,
  "status" text DEFAULT 'unresolved'::text NOT NULL,
  "first_seen_at" timestamptz DEFAULT now() NOT NULL,
  "last_seen_at" timestamptz DEFAULT now() NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "priority" text,
  "knowledge_origin" text,
  "review_notes" text,
  "suggested_canonical_slug" text,
  CONSTRAINT "knowledge_review_queue_pkey" PRIMARY KEY (id),
  CONSTRAINT "uq_knowledge_review_item" UNIQUE (review_type, domain, dedupe_key)
)`,
      `CREATE TABLE IF NOT EXISTS "knowledge_review_decisions" (
  "id" serial NOT NULL,
  "batch_id" integer NOT NULL,
  "term_id" integer NOT NULL,
  "review_type" text DEFAULT 'vocabulary'::text NOT NULL,
  "domain" text,
  "decision_type" text NOT NULL,
  "target_canonical_slug" text,
  "alias_string" text,
  "proposed_new_slug" text,
  "proposed_new_name" text,
  "proposed_new_description" text,
  "rationale" text,
  "confidence" text,
  "reviewer_model" text,
  "reviewer_notes" text,
  "original_context" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'proposed'::text NOT NULL,
  "approved_by_user_id" integer,
  "approved_at" timestamptz,
  "rejected_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "reviewer" text,
  CONSTRAINT "knowledge_review_decisions_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "knowledge_rollback_points" (
  "id" serial NOT NULL,
  "release_id" integer,
  "snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "consumed_at" timestamptz,
  CONSTRAINT "knowledge_rollback_points_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "knowledge_vocabulary_aliases" (
  "id" serial NOT NULL,
  "kind" text NOT NULL,
  "alias_normalised" text NOT NULL,
  "canonical_slug" text NOT NULL,
  "decision_id" integer,
  "release_id" integer,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "deactivated_at" timestamptz,
  CONSTRAINT "knowledge_vocabulary_aliases_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "meal_allergens" (
  "id" serial NOT NULL,
  "meal_id" integer NOT NULL,
  "allergen" text NOT NULL,
  CONSTRAINT "meal_allergens_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "meal_categories" (
  "id" serial NOT NULL,
  "name" text NOT NULL,
  CONSTRAINT "meal_categories_pkey" PRIMARY KEY (id),
  CONSTRAINT "meal_categories_name_unique" UNIQUE (name)
)`,
      `CREATE TABLE IF NOT EXISTS "meal_diets" (
  "id" serial NOT NULL,
  "meal_id" integer NOT NULL,
  "diet_id" integer NOT NULL,
  CONSTRAINT "meal_diets_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "meal_plan_entries" (
  "id" serial NOT NULL,
  "plan_id" integer NOT NULL,
  "day_of_week" integer NOT NULL,
  "slot" text NOT NULL,
  "meal_id" integer NOT NULL,
  "meal_template_id" integer,
  "resolved_source_type" text,
  CONSTRAINT "meal_plan_entries_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "meal_plans" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "week_start" text NOT NULL,
  "name" text NOT NULL,
  "calorie_target" integer,
  "people_count" integer DEFAULT 1 NOT NULL,
  CONSTRAINT "meal_plans_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "meal_templates" (
  "id" serial NOT NULL,
  "name" text NOT NULL,
  "category" text DEFAULT 'dinner'::text NOT NULL,
  "description" text,
  "image_url" text,
  "default_calories" integer,
  "default_protein" integer,
  "default_carbs" integer,
  "default_fat" integer,
  "title" text,
  "cuisine" text,
  "shared_base_components" text[],
  "protein_slots" text[],
  "carb_slots" text[],
  "veg_slots" text[],
  "topping_slots" text[],
  "sauce_slots" text[],
  "compatible_diets" text[],
  "estimated_total_time" integer,
  "estimated_extra_time_per_variant" integer,
  "cost_band" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "primary_slot" text,
  "suitable_slots" text[] DEFAULT '{}'::text[] NOT NULL,
  "energy_band" text,
  "style_tags" text[] DEFAULT '{}'::text[] NOT NULL,
  "nutrition_opportunities" text[] DEFAULT '{}'::text[] NOT NULL,
  CONSTRAINT "meal_templates_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "meals" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "name" text NOT NULL,
  "ingredients" text[] NOT NULL,
  "image_url" text,
  "servings" integer DEFAULT 1 NOT NULL,
  "category_id" integer,
  "instructions" text[],
  "source_url" text,
  "meal_template_id" integer,
  "meal_source_type" text DEFAULT 'scratch'::text NOT NULL,
  "is_ready_meal" boolean DEFAULT false NOT NULL,
  "is_system_meal" boolean DEFAULT false NOT NULL,
  "meal_format" text DEFAULT 'recipe'::text NOT NULL,
  "diet_types" text[] DEFAULT '{}'::text[] NOT NULL,
  "is_freezer_eligible" boolean DEFAULT true NOT NULL,
  "audience" text DEFAULT 'adult'::text NOT NULL,
  "is_drink" boolean DEFAULT false NOT NULL,
  "drink_type" text,
  "barcode" text,
  "brand" text,
  "original_meal_id" integer,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "kind" text DEFAULT 'meal'::text NOT NULL,
  "is_household_safe_variant" boolean DEFAULT false NOT NULL,
  "household_safe_for" jsonb,
  "variant_kind" text,
  "show_in_cookbook" boolean DEFAULT false NOT NULL,
  "primary_slot" text,
  "suitable_slots" text[] DEFAULT '{}'::text[] NOT NULL,
  "energy_band" text,
  "style_tags" text[] DEFAULT '{}'::text[] NOT NULL,
  "acquisition_lane" text,
  "acquisition_type" text,
  "acquisition_source_key" text,
  "licence_ref" text,
  "attribution_text" text,
  CONSTRAINT "meals_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "normalized_ingredients" (
  "id" serial NOT NULL,
  "name" text NOT NULL,
  "normalized_name" text NOT NULL,
  "category" text DEFAULT 'other'::text NOT NULL,
  CONSTRAINT "normalized_ingredients_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "nutrition" (
  "id" serial NOT NULL,
  "meal_id" integer NOT NULL,
  "calories" text,
  "protein" text,
  "carbs" text,
  "fat" text,
  "sugar" text,
  "salt" text,
  "source" text,
  CONSTRAINT "nutrition_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "planner_days" (
  "id" serial NOT NULL,
  "week_id" integer NOT NULL,
  "day_of_week" integer NOT NULL,
  CONSTRAINT "planner_days_pkey" PRIMARY KEY (id),
  CONSTRAINT "planner_days_week_day_unique" UNIQUE (week_id, day_of_week)
)`,
      `CREATE TABLE IF NOT EXISTS "planner_entries" (
  "id" serial NOT NULL,
  "day_id" integer NOT NULL,
  "meal_type" text NOT NULL,
  "audience" text DEFAULT 'adult'::text NOT NULL,
  "meal_id" integer NOT NULL,
  "calories" integer DEFAULT 0,
  "is_drink" boolean DEFAULT false NOT NULL,
  "drink_type" text,
  "position" integer DEFAULT 0 NOT NULL,
  "adaptation_result" jsonb,
  "guest_eaters" jsonb,
  "original_meal_id_before_variant" integer,
  CONSTRAINT "planner_entries_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "planner_weeks" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "week_number" integer NOT NULL,
  "week_name" text NOT NULL,
  "household_id" integer,
  "week_start_date" text,
  CONSTRAINT "planner_weeks_pkey" PRIMARY KEY (id),
  CONSTRAINT "planner_weeks_user_week_unique" UNIQUE (user_id, week_number)
)`,
      `CREATE TABLE IF NOT EXISTS "product_additives" (
  "id" serial NOT NULL,
  "product_barcode" text NOT NULL,
  "additive_id" integer NOT NULL,
  CONSTRAINT "product_additives_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "product_history" (
  "id" serial NOT NULL,
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
  "source" text DEFAULT 'search'::text NOT NULL,
  CONSTRAINT "product_history_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "product_matches" (
  "id" serial NOT NULL,
  "shopping_list_item_id" integer NOT NULL,
  "supermarket" text NOT NULL,
  "product_name" text NOT NULL,
  "price" real,
  "price_per_unit" text,
  "product_url" text,
  "image_url" text,
  "currency" text DEFAULT 'GBP'::text NOT NULL,
  "tier" text DEFAULT 'standard'::text NOT NULL,
  "product_weight" text,
  "tesco_product_id" text,
  "sainsburys_product_id" text,
  "ocado_product_id" text,
  "smp_rating" integer,
  "price_source" text,
  CONSTRAINT "product_matches_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "shopping_list" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "product_name" text NOT NULL,
  "image_url" text,
  "quantity" integer DEFAULT 1 NOT NULL,
  "brand" text,
  "normalized_name" text,
  "quantity_value" real,
  "unit" text,
  "category" text,
  "selected_tier" text,
  "quantity_in_grams" real,
  "ingredient_id" integer,
  "matched_product_id" text,
  "matched_store" text,
  "matched_price" real,
  "checked" boolean DEFAULT false NOT NULL,
  "needs_review" boolean DEFAULT false NOT NULL,
  "validation_note" text,
  "selected_store" text,
  "available_stores" text,
  "smp_rating" integer,
  "household_id" integer,
  "added_by_user_id" integer,
  "item_type" text,
  "variant_selections" text,
  "attribute_preferences" text,
  "confidence_level" text,
  "confidence_reason" text,
  "basket_label" text,
  "shop_status" text,
  "original_text" text,
  "canonical_name" text,
  "subcategory" text,
  "resolution_state" text DEFAULT 'raw'::text,
  "review_reason" text,
  "review_suggestions" text,
  "cupboard_quantity" real,
  "source" text,
  CONSTRAINT "shopping_list_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "shopping_list_extras" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "name" text NOT NULL,
  "category" text DEFAULT 'household'::text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "household_id" integer,
  "always_add" boolean DEFAULT false NOT NULL,
  "in_basket" boolean DEFAULT true NOT NULL,
  CONSTRAINT "shopping_list_extras_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "supermarket_links" (
  "id" serial NOT NULL,
  "name" text NOT NULL,
  "country" text NOT NULL,
  "search_url" text NOT NULL,
  "logo_url" text,
  CONSTRAINT "supermarket_links_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "user_health_trends" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "date" text NOT NULL,
  "average_smp_rating" real NOT NULL,
  "elite_count" integer DEFAULT 0 NOT NULL,
  "processed_count" integer DEFAULT 0 NOT NULL,
  "sample_count" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "user_health_trends_pkey" PRIMARY KEY (id)
)`,
      `CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "diet_types" text[] DEFAULT '{}'::text[] NOT NULL,
  "excluded_ingredients" text[] DEFAULT '{}'::text[] NOT NULL,
  "health_goals" text[] DEFAULT '{}'::text[] NOT NULL,
  "budget_level" text DEFAULT 'standard'::text NOT NULL,
  "preferred_stores" text[] DEFAULT '{}'::text[] NOT NULL,
  "upf_sensitivity" text DEFAULT 'moderate'::text NOT NULL,
  "quality_preference" text DEFAULT 'standard'::text NOT NULL,
  "calorie_target" integer,
  "sound_enabled" boolean DEFAULT true NOT NULL,
  "elite_tracking_enabled" boolean DEFAULT true NOT NULL,
  "health_trend_enabled" boolean DEFAULT true NOT NULL,
  "barcode_scanner_enabled" boolean DEFAULT true NOT NULL,
  "planner_show_calories" boolean DEFAULT true NOT NULL,
  "planner_enable_baby_meals" boolean DEFAULT false NOT NULL,
  "planner_enable_child_meals" boolean DEFAULT false NOT NULL,
  "planner_enable_drinks" boolean DEFAULT false NOT NULL,
  "calorie_mode" text DEFAULT 'auto'::text NOT NULL,
  "height_cm" real,
  "weight_kg" real,
  "activity_level" text DEFAULT 'moderate'::text NOT NULL,
  "goal_type" text DEFAULT 'maintain'::text NOT NULL,
  "adults_count" integer DEFAULT 1 NOT NULL,
  "children_count" integer DEFAULT 0 NOT NULL,
  "babies_count" integer DEFAULT 0 NOT NULL,
  "preferred_ingredients" text[] DEFAULT '{}'::text[] NOT NULL,
  "max_prep_tolerance" integer,
  "meal_mode" text DEFAULT 'exact'::text NOT NULL,
  "max_extra_prep_minutes" integer,
  "max_total_cook_time" integer,
  "prefer_less_processed" boolean DEFAULT false NOT NULL,
  "include_regulatory_additives_in_scoring" boolean DEFAULT true NOT NULL,
  "muted_opportunity_types" text[] DEFAULT '{}'::text[] NOT NULL,
  "companion_personality" text DEFAULT 'companion'::text NOT NULL,
  CONSTRAINT "user_preferences_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_preferences_user_id_unique" UNIQUE (user_id)
)`,
      `CREATE TABLE IF NOT EXISTS "user_streaks" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "current_elite_streak" integer DEFAULT 0 NOT NULL,
  "best_elite_streak" integer DEFAULT 0 NOT NULL,
  "last_elite_date" text,
  "weekly_elite_count" integer DEFAULT 0 NOT NULL,
  "week_start_date" text,
  CONSTRAINT "user_streaks_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_streaks_user_id_unique" UNIQUE (user_id)
)`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'canonical_food_diversity_group_slug_fkey' AND r.relname = 'canonical_food'
         ) THEN
           ALTER TABLE "canonical_food" ADD CONSTRAINT "canonical_food_diversity_group_slug_fkey" FOREIGN KEY (diversity_group_slug) REFERENCES diversity_group(slug) ON DELETE SET NULL;
         END IF;
       END $$`,
      // On a fresh database, knowledge_foods is created by a later migration. Preserve this
      // historical baseline statement for existing schemas, but defer it when the referenced
      // table does not exist; the final append-only repair migration adds it after table creation.
      `DO $$ BEGIN
         IF to_regclass('public.knowledge_foods') IS NOT NULL AND NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'canonical_food_knowledge_food_slug_fkey' AND r.relname = 'canonical_food'
         ) THEN
           ALTER TABLE "canonical_food" ADD CONSTRAINT "canonical_food_knowledge_food_slug_fkey" FOREIGN KEY (knowledge_food_slug) REFERENCES knowledge_foods(slug) ON DELETE SET NULL;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'canonical_food_alias_canonical_food_id_fkey' AND r.relname = 'canonical_food_alias'
         ) THEN
           ALTER TABLE "canonical_food_alias" ADD CONSTRAINT "canonical_food_alias_canonical_food_id_fkey" FOREIGN KEY (canonical_food_id) REFERENCES canonical_food(id) ON DELETE CASCADE;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF to_regclass('public.conversation_turns') IS NOT NULL AND NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'companion_action_proposals_conversation_turn_id_fkey' AND r.relname = 'companion_action_proposals'
         ) THEN
           ALTER TABLE "companion_action_proposals" ADD CONSTRAINT "companion_action_proposals_conversation_turn_id_fkey" FOREIGN KEY (conversation_turn_id) REFERENCES conversation_turns(id) ON DELETE CASCADE;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF to_regclass('public.conversation_turns') IS NOT NULL AND NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'companion_guidance_events_conversation_turn_id_fkey' AND r.relname = 'companion_guidance_events'
         ) THEN
           ALTER TABLE "companion_guidance_events" ADD CONSTRAINT "companion_guidance_events_conversation_turn_id_fkey" FOREIGN KEY (conversation_turn_id) REFERENCES conversation_turns(id) ON DELETE CASCADE;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'companion_learning_recommendations_reviewed_by_fkey' AND r.relname = 'companion_learning_recommendations'
         ) THEN
           ALTER TABLE "companion_learning_recommendations" ADD CONSTRAINT "companion_learning_recommendations_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES users(id);
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'companion_learning_recommendations_snapshot_id_fkey' AND r.relname = 'companion_learning_recommendations'
         ) THEN
           ALTER TABLE "companion_learning_recommendations" ADD CONSTRAINT "companion_learning_recommendations_snapshot_id_fkey" FOREIGN KEY (snapshot_id) REFERENCES companion_health_snapshots(id);
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF to_regclass('public.conversation_turns') IS NOT NULL AND NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'companion_response_feedback_conversation_turn_id_fkey' AND r.relname = 'companion_response_feedback'
         ) THEN
           ALTER TABLE "companion_response_feedback" ADD CONSTRAINT "companion_response_feedback_conversation_turn_id_fkey" FOREIGN KEY (conversation_turn_id) REFERENCES conversation_turns(id) ON DELETE CASCADE;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'food_variety_canonical_food_id_fkey' AND r.relname = 'food_variety'
         ) THEN
           ALTER TABLE "food_variety" ADD CONSTRAINT "food_variety_canonical_food_id_fkey" FOREIGN KEY (canonical_food_id) REFERENCES canonical_food(id) ON DELETE CASCADE;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'knowledge_releases_approved_by_user_id_fkey' AND r.relname = 'knowledge_releases'
         ) THEN
           ALTER TABLE "knowledge_releases" ADD CONSTRAINT "knowledge_releases_approved_by_user_id_fkey" FOREIGN KEY (approved_by_user_id) REFERENCES users(id);
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'knowledge_releases_published_by_user_id_fkey' AND r.relname = 'knowledge_releases'
         ) THEN
           ALTER TABLE "knowledge_releases" ADD CONSTRAINT "knowledge_releases_published_by_user_id_fkey" FOREIGN KEY (published_by_user_id) REFERENCES users(id);
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'knowledge_releases_rolled_back_by_user_id_fkey' AND r.relname = 'knowledge_releases'
         ) THEN
           ALTER TABLE "knowledge_releases" ADD CONSTRAINT "knowledge_releases_rolled_back_by_user_id_fkey" FOREIGN KEY (rolled_back_by_user_id) REFERENCES users(id);
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'knowledge_review_audit_actor_user_id_fkey' AND r.relname = 'knowledge_review_audit'
         ) THEN
           ALTER TABLE "knowledge_review_audit" ADD CONSTRAINT "knowledge_review_audit_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES users(id);
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'knowledge_review_batches_created_by_user_id_fkey' AND r.relname = 'knowledge_review_batches'
         ) THEN
           ALTER TABLE "knowledge_review_batches" ADD CONSTRAINT "knowledge_review_batches_created_by_user_id_fkey" FOREIGN KEY (created_by_user_id) REFERENCES users(id);
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'knowledge_review_decisions_approved_by_user_id_fkey' AND r.relname = 'knowledge_review_decisions'
         ) THEN
           ALTER TABLE "knowledge_review_decisions" ADD CONSTRAINT "knowledge_review_decisions_approved_by_user_id_fkey" FOREIGN KEY (approved_by_user_id) REFERENCES users(id);
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'knowledge_review_decisions_batch_id_fkey' AND r.relname = 'knowledge_review_decisions'
         ) THEN
           ALTER TABLE "knowledge_review_decisions" ADD CONSTRAINT "knowledge_review_decisions_batch_id_fkey" FOREIGN KEY (batch_id) REFERENCES knowledge_review_batches(id) ON DELETE CASCADE;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'knowledge_review_decisions_term_id_fkey' AND r.relname = 'knowledge_review_decisions'
         ) THEN
           ALTER TABLE "knowledge_review_decisions" ADD CONSTRAINT "knowledge_review_decisions_term_id_fkey" FOREIGN KEY (term_id) REFERENCES knowledge_review_queue(id) ON DELETE CASCADE;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'knowledge_vocabulary_aliases_decision_id_fkey' AND r.relname = 'knowledge_vocabulary_aliases'
         ) THEN
           ALTER TABLE "knowledge_vocabulary_aliases" ADD CONSTRAINT "knowledge_vocabulary_aliases_decision_id_fkey" FOREIGN KEY (decision_id) REFERENCES knowledge_review_decisions(id);
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'meals_meal_template_id_fkey' AND r.relname = 'meals'
         ) THEN
           ALTER TABLE "meals" ADD CONSTRAINT "meals_meal_template_id_fkey" FOREIGN KEY (meal_template_id) REFERENCES meal_templates(id) ON DELETE SET NULL;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'meals_meal_template_id_meal_templates_id_fk' AND r.relname = 'meals'
         ) THEN
           ALTER TABLE "meals" ADD CONSTRAINT "meals_meal_template_id_meal_templates_id_fk" FOREIGN KEY (meal_template_id) REFERENCES meal_templates(id);
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'planner_entries_original_meal_id_before_variant_fkey' AND r.relname = 'planner_entries'
         ) THEN
           ALTER TABLE "planner_entries" ADD CONSTRAINT "planner_entries_original_meal_id_before_variant_fkey" FOREIGN KEY (original_meal_id_before_variant) REFERENCES meals(id) ON DELETE SET NULL;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'shopping_list_extras_user_id_users_id_fk' AND r.relname = 'shopping_list_extras'
         ) THEN
           ALTER TABLE "shopping_list_extras" ADD CONSTRAINT "shopping_list_extras_user_id_users_id_fk" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
         END IF;
       END $$`,
      `CREATE INDEX IF NOT EXISTS companion_action_proposals_conversation_turn_id_idx ON companion_action_proposals USING btree (conversation_turn_id)`,
      `CREATE INDEX IF NOT EXISTS companion_action_proposals_workflow_id_idx ON companion_action_proposals USING btree (workflow_id)`,
      `CREATE INDEX IF NOT EXISTS idx_knowledge_review_audit_entity ON knowledge_review_audit USING btree (entity, entity_id)`,
      `CREATE INDEX IF NOT EXISTS idx_knowledge_review_audit_release ON knowledge_review_audit USING btree (release_id)`,
      `CREATE INDEX IF NOT EXISTS idx_knowledge_review_type ON knowledge_review_queue USING btree (review_type, status)`,
      `CREATE INDEX IF NOT EXISTS idx_knowledge_review_decision_batch ON knowledge_review_decisions USING btree (batch_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_knowledge_review_decision_term ON knowledge_review_decisions USING btree (term_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_knowledge_vocab_alias_active ON knowledge_vocabulary_aliases USING btree (kind, alias_normalised) WHERE is_active`,
      `CREATE INDEX IF NOT EXISTS meals_household_safe_variant_idx ON meals USING btree (user_id, is_household_safe_variant) WHERE (is_household_safe_variant = true)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS meals_tha_original_source_key_uniq ON meals USING btree (acquisition_source_key) WHERE ((is_system_meal = true) AND (acquisition_source_key ~~ 'tha_original:%'::text))`,
      `CREATE INDEX IF NOT EXISTS meals_variant_kind_idx ON meals USING btree (user_id, variant_kind) WHERE (variant_kind IS NOT NULL)`,
    ],
  },

  {
    id: "2026-02-27_add_user_diet_fields",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_pattern TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_restrictions TEXT[]",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS eating_schedule TEXT",
    ],
  },

  {
    id: "2026-02-27_backfill_user_diet_fields",
    statements: [
      `UPDATE users u
       SET
         diet_pattern = CASE
           WHEN up.diet_types && ARRAY['vegan']                THEN 'Vegan'
           WHEN up.diet_types && ARRAY['vegetarian']           THEN 'Vegetarian'
           WHEN up.diet_types && ARRAY['mediterranean']        THEN 'Mediterranean'
           WHEN up.diet_types && ARRAY['dash']                 THEN 'DASH'
           WHEN up.diet_types && ARRAY['mind']                 THEN 'MIND'
           WHEN up.diet_types && ARRAY['flexitarian']          THEN 'Flexitarian'
           WHEN up.diet_types && ARRAY['keto']                 THEN 'Keto'
           WHEN up.diet_types && ARRAY['paleo']                THEN 'Paleo'
           WHEN up.diet_types && ARRAY['low-carb', 'atkins']  THEN 'Low-Carb'
           WHEN up.diet_types && ARRAY['carnivore']            THEN 'Carnivore'
           ELSE NULL
         END,
         diet_restrictions = ARRAY_REMOVE(
           ARRAY[
             CASE WHEN up.diet_types && ARRAY['gluten-free'] THEN 'Gluten-Free'::TEXT END,
             CASE WHEN up.diet_types && ARRAY['dairy-free']  THEN 'Dairy-Free'::TEXT END
           ],
           NULL
         )
       FROM user_preferences up
       WHERE up.user_id = u.id`,
    ],
  },

  {
    id: "2026-02-27_password_reset_tokens",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ",
    ],
  },

  {
    id: "2026-02-27_meal_plan_templates",
    statements: [
      `CREATE TABLE IF NOT EXISTS meal_plan_templates (
         id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
         name        TEXT NOT NULL,
         description TEXT,
         is_default  BOOLEAN NOT NULL DEFAULT FALSE,
         is_premium  BOOLEAN NOT NULL DEFAULT FALSE,
         created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
      `CREATE TABLE IF NOT EXISTS meal_plan_template_items (
         id           VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
         template_id  VARCHAR NOT NULL REFERENCES meal_plan_templates(id) ON DELETE CASCADE,
         week_number  INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 6),
         day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
         meal_slot    TEXT NOT NULL CHECK (meal_slot IN ('breakfast','lunch','dinner')),
         meal_id      INTEGER NOT NULL REFERENCES meals(id) ON DELETE RESTRICT,
         created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         UNIQUE (template_id, week_number, day_of_week, meal_slot)
       )`,
    ],
  },

  {
    id: "2026-02-27_add_meals_created_at",
    statements: [
      "ALTER TABLE meals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
    ],
  },

  {
    id: "2026-02-28_add_roles_and_subscriptions",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
      "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check",
      "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user','admin'))",
      "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check",
      "ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check CHECK (subscription_tier IN ('free','premium','friends_family'))",
    ],
  },

  {
    id: "2026-03-01_seed_admin_users",
    statements: [
      "UPDATE users SET role = 'admin' WHERE username IN ('colinclapson@hotmail.co.uk', 'lindsayclapson@outlook.com')",
    ],
  },

  {
    id: "2026-03-01_create_admin_audit_log",
    statements: [
      `CREATE TABLE IF NOT EXISTS admin_audit_log (
         id              SERIAL PRIMARY KEY,
         admin_user_id   INTEGER NOT NULL REFERENCES users(id),
         action          TEXT NOT NULL,
         target_user_id  INTEGER REFERENCES users(id),
         metadata        JSONB,
         created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
    ],
  },

  {
    id: "2026-03-01_extend_meal_plan_templates",
    statements: [
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE",
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS season TEXT",
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'",
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)",
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ",
      "CREATE INDEX IF NOT EXISTS meal_plan_templates_owner_idx ON meal_plan_templates (owner_user_id)",
      "CREATE INDEX IF NOT EXISTS meal_plan_templates_status_idx ON meal_plan_templates (status)",
    ],
  },

  {
    id: "2026-03-01_add_template_sharing",
    statements: [
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS share_token TEXT",
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'",
      "CREATE UNIQUE INDEX IF NOT EXISTS meal_plan_templates_share_token_idx ON meal_plan_templates (share_token) WHERE share_token IS NOT NULL",
      "ALTER TABLE meal_plan_templates DROP CONSTRAINT IF EXISTS meal_plan_templates_visibility_check",
      "ALTER TABLE meal_plan_templates ADD CONSTRAINT meal_plan_templates_visibility_check CHECK (visibility IN ('private','shared'))",
    ],
  },

  {
    id: "2026-03-01_add_planner_entry_position",
    statements: [
      "ALTER TABLE planner_entries ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0",
    ],
  },

  {
    id: "2026-03-01_add_meals_kind",
    statements: [
      "ALTER TABLE meals ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'meal'",
    ],
  },

  {
    id: "2026-03-01_user_pantry_items",
    statements: [
      `CREATE TABLE IF NOT EXISTS user_pantry_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ingredient_key TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'larder' CHECK (category IN ('larder','fridge','freezer')),
        default_have BOOLEAN NOT NULL DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, ingredient_key)
      )`,
      "CREATE INDEX IF NOT EXISTS user_pantry_items_user_id_idx ON user_pantry_items(user_id)",
    ],
  },

  {
    id: "2026-03-01_meal_pairings",
    statements: [
      `CREATE TABLE IF NOT EXISTS meal_pairings (
        id SERIAL PRIMARY KEY,
        base_meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        suggested_meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        note TEXT,
        priority INTEGER NOT NULL DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(base_meal_id, suggested_meal_id)
      )`,
      "CREATE INDEX IF NOT EXISTS meal_pairings_base_meal_idx ON meal_pairings(base_meal_id, priority DESC)",
    ],
  },

  {
    id: "2026-03-01_ingredient_products",
    statements: [
      `CREATE TABLE IF NOT EXISTS ingredient_products (
        id SERIAL PRIMARY KEY,
        ingredient_key TEXT NOT NULL,
        product_name TEXT NOT NULL,
        retailer TEXT NOT NULL,
        size TEXT,
        notes TEXT,
        tags JSONB,
        priority INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_by INT REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      "CREATE INDEX IF NOT EXISTS idx_ingredient_products_key ON ingredient_products(ingredient_key)",
      "CREATE INDEX IF NOT EXISTS idx_ingredient_products_active ON ingredient_products(is_active)",
      "CREATE UNIQUE INDEX IF NOT EXISTS uniq_ingredient_products_key_name_retailer ON ingredient_products(ingredient_key, product_name, retailer)",
    ],
  },

  {
    id: "2026-03-04_recipe_source_settings",
    statements: [
      `CREATE TABLE IF NOT EXISTS recipe_source_settings (
        id SERIAL PRIMARY KEY,
        source_key TEXT NOT NULL UNIQUE,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        source_type TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        admin_updated_at TIMESTAMPTZ
      )`,
      `CREATE TABLE IF NOT EXISTS recipe_source_audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        source_name TEXT NOT NULL,
        url_or_query TEXT,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    ],
  },

  {
    id: "2026-03-04_households",
    statements: [
      `CREATE TABLE IF NOT EXISTS households (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        invite_code TEXT NOT NULL UNIQUE,
        created_by_user_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS household_members (
        id SERIAL PRIMARY KEY,
        household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'active',
        joined_at TIMESTAMPTZ,
        invited_by_user_id INTEGER,
        left_at TIMESTAMPTZ,
        CONSTRAINT household_members_household_user_unique UNIQUE (household_id, user_id)
      )`,
    ],
  },

  {
    id: "2026-03-04_household_id_columns",
    statements: [
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS household_id INTEGER",
      "ALTER TABLE planner_weeks ADD COLUMN IF NOT EXISTS household_id INTEGER",
      "ALTER TABLE freezer_meals ADD COLUMN IF NOT EXISTS household_id INTEGER",
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS household_id INTEGER",
      "ALTER TABLE shopping_list_extras ADD COLUMN IF NOT EXISTS household_id INTEGER",
    ],
  },

  {
    id: "2026-03-04_backfill_households",
    statements: [
      `INSERT INTO households (name, invite_code, created_by_user_id, created_at, updated_at)
       SELECT
         username || '''s Household',
         upper(substr(md5(random()::text), 1, 8)),
         id,
         NOW(),
         NOW()
       FROM users
       WHERE id NOT IN (
         SELECT created_by_user_id FROM households WHERE created_by_user_id IS NOT NULL
       )
       ON CONFLICT DO NOTHING`,
      `INSERT INTO household_members (household_id, user_id, role, status, joined_at)
       SELECT h.id, u.id, 'owner', 'active', NOW()
       FROM users u
       JOIN households h ON h.created_by_user_id = u.id
       ON CONFLICT ON CONSTRAINT household_members_household_user_unique DO NOTHING`,
      `UPDATE shopping_list sl
       SET household_id = h.id
       FROM households h
       WHERE h.created_by_user_id = sl.user_id AND sl.household_id IS NULL`,
      `UPDATE planner_weeks pw
       SET household_id = h.id
       FROM households h
       WHERE h.created_by_user_id = pw.user_id AND pw.household_id IS NULL`,
      `UPDATE freezer_meals fm
       SET household_id = h.id
       FROM households h
       WHERE h.created_by_user_id = fm.user_id AND fm.household_id IS NULL`,
      `UPDATE user_pantry_items upi
       SET household_id = h.id
       FROM households h
       WHERE h.created_by_user_id = upi.user_id AND upi.household_id IS NULL`,
      `UPDATE shopping_list_extras sle
       SET household_id = h.id
       FROM households h
       WHERE h.created_by_user_id = sle.user_id AND sle.household_id IS NULL`,
    ],
  },

  {
    id: "2026-03-08_basket_attribution_columns",
    statements: [
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS added_by_user_id INTEGER",
      "ALTER TABLE ingredient_sources ADD COLUMN IF NOT EXISTS week_number INTEGER",
      "ALTER TABLE ingredient_sources ADD COLUMN IF NOT EXISTS day_of_week INTEGER",
      "ALTER TABLE ingredient_sources ADD COLUMN IF NOT EXISTS meal_slot TEXT",
    ],
  },

  {
    id: "2026-03-08_food_diary_tables",
    statements: [
      `CREATE TABLE IF NOT EXISTS food_diary_days (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT food_diary_days_user_date_unique UNIQUE (user_id, date)
      )`,
      `CREATE TABLE IF NOT EXISTS food_diary_entries (
        id SERIAL PRIMARY KEY,
        day_id INTEGER NOT NULL REFERENCES food_diary_days(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        meal_slot TEXT NOT NULL,
        name TEXT NOT NULL,
        notes TEXT,
        source_type TEXT NOT NULL DEFAULT 'manual',
        source_planner_entry_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS food_diary_metrics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        weight_kg REAL,
        bmi REAL,
        mood_apples INTEGER,
        sleep_hours REAL,
        energy_apples INTEGER,
        notes TEXT,
        stuck_to_plan BOOLEAN,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT food_diary_metrics_user_date_unique UNIQUE (user_id, date)
      )`,
    ],
  },

  {
    id: "2026-03-12_add_always_add_to_extras",
    statements: [
      "ALTER TABLE shopping_list_extras ADD COLUMN IF NOT EXISTS always_add boolean NOT NULL DEFAULT false",
    ],
  },

  {
    id: "2026-03-12_add_in_basket_to_extras",
    statements: [
      "ALTER TABLE shopping_list_extras ADD COLUMN IF NOT EXISTS in_basket boolean NOT NULL DEFAULT false",
      "ALTER TABLE shopping_list_extras ALTER COLUMN in_basket SET DEFAULT true",
    ],
  },

  {
    id: "2026-03-13_pantry_columns_fix",
    statements: [
      // Add columns that were added to the Drizzle schema without a migration
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS display_name TEXT",
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE",
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE",
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0",
      // Backfill display_name from ingredient_key for any pre-existing rows
      "UPDATE user_pantry_items SET display_name = ingredient_key WHERE display_name IS NULL",
      // Widen the category CHECK to include 'household' and 'fruit'.
      // 'fruit' rows were seeded before this migration ran (the original inline
      // constraint was dropped by a drizzle-kit push), so we must include it here
      // or the ADD CONSTRAINT fails on existing rows.  A later migration
      // (2026-04-02_add_fruit_pantry_category) already adds 'fruit' to the same
      // list, so including it now is safe and makes that migration a clean no-op.
      "ALTER TABLE user_pantry_items DROP CONSTRAINT IF EXISTS user_pantry_items_category_check",
      "ALTER TABLE user_pantry_items ADD CONSTRAINT user_pantry_items_category_check CHECK (category IN ('larder','fridge','freezer','household','fruit'))",
    ],
  },

  {
    id: "2026-03-13_fix_pantry_null_household_id",
    statements: [
      // Patch any pantry rows that were inserted without a household_id.
      // This backfills the correct household by joining to the user's active
      // household membership. Safe: only touches rows where household_id IS NULL.
      `UPDATE user_pantry_items upi
       SET household_id = hm.household_id
       FROM household_members hm
       WHERE hm.user_id = upi.user_id
         AND hm.status = 'active'
         AND upi.household_id IS NULL`,
    ],
  },

  {
    id: "2026-03-13_shopping_list_columns_fix",
    statements: [
      // These columns were added to the Drizzle schema incrementally without migrations.
      // All use IF NOT EXISTS so they are safe to run even if a column already exists.
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT FALSE",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS validation_note TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS selected_store TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS item_type TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS variant_selections TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS attribute_preferences TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS confidence_level TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS confidence_reason TEXT",
    ],
  },

  {
    id: "2026-03-13_backfill_missing_households",
    statements: [
      // Some users created after the original backfill (2026-03-04) have no household.
      // This migration is idempotent and safe to run any number of times.

      // Step 1: Create a household for any user who still has none
      `INSERT INTO households (name, invite_code, created_by_user_id, created_at, updated_at)
       SELECT
         username || '''s Household',
         upper(substr(md5(random()::text), 1, 8)),
         id,
         NOW(),
         NOW()
       FROM users
       WHERE id NOT IN (
         SELECT created_by_user_id FROM households WHERE created_by_user_id IS NOT NULL
       )
       ON CONFLICT DO NOTHING`,

      // Step 2: Insert an owner membership for those users
      `INSERT INTO household_members (household_id, user_id, role, status, joined_at)
       SELECT h.id, u.id, 'owner', 'active', NOW()
       FROM users u
       JOIN households h ON h.created_by_user_id = u.id
       ON CONFLICT ON CONSTRAINT household_members_household_user_unique DO NOTHING`,

      // Step 3: Backfill household_id on planner_weeks rows that are still NULL
      `UPDATE planner_weeks pw
       SET household_id = hm.household_id
       FROM household_members hm
       WHERE hm.user_id = pw.user_id
         AND hm.status = 'active'
         AND pw.household_id IS NULL`,
    ],
  },

  {
    id: "2026-03-13_add_demo_user_fields",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ",
    ],
  },

  {
    id: "2026-03-13_add_demo_claimed_email",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_claimed_email TEXT",
    ],
  },

  {
    id: "2026-03-14_add_first_name",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT",
    ],
  },

  {
    id: "2026-03-14_create_food_knowledge",
    statements: [
      `CREATE TABLE IF NOT EXISTS food_knowledge (
        id                    SERIAL PRIMARY KEY,
        slug                  TEXT NOT NULL UNIQUE,
        type                  TEXT NOT NULL,
        title                 TEXT NOT NULL,
        short_summary         TEXT,
        why_tha_highlights_this TEXT,
        what_to_know          TEXT,
        who_it_matters_to     TEXT,
        simpler_alternatives  TEXT,
        tags                  TEXT[],
        source                TEXT,
        is_active             BOOLEAN NOT NULL DEFAULT TRUE
      )`,
    ],
  },

  {
    id: "2026-03-15_extend_meal_templates",
    statements: [
      `ALTER TABLE meal_templates
        ADD COLUMN IF NOT EXISTS title TEXT,
        ADD COLUMN IF NOT EXISTS cuisine TEXT,
        ADD COLUMN IF NOT EXISTS shared_base_components TEXT[],
        ADD COLUMN IF NOT EXISTS protein_slots TEXT[],
        ADD COLUMN IF NOT EXISTS carb_slots TEXT[],
        ADD COLUMN IF NOT EXISTS veg_slots TEXT[],
        ADD COLUMN IF NOT EXISTS topping_slots TEXT[],
        ADD COLUMN IF NOT EXISTS sauce_slots TEXT[],
        ADD COLUMN IF NOT EXISTS compatible_diets TEXT[],
        ADD COLUMN IF NOT EXISTS estimated_total_time INTEGER,
        ADD COLUMN IF NOT EXISTS estimated_extra_time_per_variant INTEGER,
        ADD COLUMN IF NOT EXISTS cost_band TEXT,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`,
    ],
  },

  {
    id: "2026-03-15_meals_meal_template_fk",
    statements: [
      `ALTER TABLE meals
        ADD CONSTRAINT meals_meal_template_id_fkey
        FOREIGN KEY (meal_template_id)
        REFERENCES meal_templates(id)
        ON DELETE SET NULL`,
    ],
  },

  {
    id: "2026-03-15_user_preferences_meal_matching",
    statements: [
      `ALTER TABLE user_preferences
        ADD COLUMN IF NOT EXISTS preferred_ingredients TEXT[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS max_prep_tolerance INTEGER`,
    ],
  },

  {
    id: "2026-03-15_household_meal_mode_settings",
    statements: [
      `ALTER TABLE user_preferences
        ADD COLUMN IF NOT EXISTS meal_mode TEXT NOT NULL DEFAULT 'exact',
        ADD COLUMN IF NOT EXISTS max_extra_prep_minutes INTEGER,
        ADD COLUMN IF NOT EXISTS max_total_cook_time INTEGER,
        ADD COLUMN IF NOT EXISTS prefer_less_processed BOOLEAN NOT NULL DEFAULT FALSE`,
    ],
  },

  {
    id: "2026-03-15_shopping_list_basket_label",
    statements: [
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS basket_label TEXT",
    ],
  },

  {
    id: "2026-03-20_add_user_login_tracking",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ",
    ],
  },

  {
    id: "2026-03-20_add_site_settings",
    statements: [
      `CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `INSERT INTO site_settings (key, value)
       VALUES ('banner', '{"enabled":false,"text":""}')
       ON CONFLICT (key) DO NOTHING`,
    ],
  },

  {
    id: "2026-03-30_add_include_regulatory_additives_in_scoring",
    statements: [
      `ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS include_regulatory_additives_in_scoring BOOLEAN NOT NULL DEFAULT TRUE`,
    ],
  },

  {
    id: "2026-04-02_add_barcode_lookup_events",
    statements: [
      `CREATE TABLE IF NOT EXISTS barcode_lookup_events (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER,
        barcode         TEXT NOT NULL,
        lookup_source   TEXT NOT NULL DEFAULT 'off',
        status          TEXT NOT NULL,
        http_status     INTEGER NOT NULL,
        off_product_code  TEXT,
        off_product_name  TEXT,
        failure_reason  TEXT,
        request_url     TEXT,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_barcode_lookup_events_barcode ON barcode_lookup_events (barcode)`,
      `CREATE INDEX IF NOT EXISTS idx_barcode_lookup_events_user_id ON barcode_lookup_events (user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_barcode_lookup_events_status ON barcode_lookup_events (status)`,
    ],
  },

  {
    id: "2026-04-02_add_additives_aliases",
    statements: [
      "ALTER TABLE additives ADD COLUMN IF NOT EXISTS aliases TEXT[]",
    ],
  },

  {
    id: "2026-04-02_add_fruit_pantry_category",
    statements: [
      "ALTER TABLE user_pantry_items DROP CONSTRAINT IF EXISTS user_pantry_items_category_check",
      "ALTER TABLE user_pantry_items ADD CONSTRAINT user_pantry_items_category_check CHECK (category IN ('larder','fridge','freezer','household','fruit'))",
    ],
  },

  {
    id: "2026-04-02_meal_items_and_usage",
    statements: [
      `CREATE TABLE IF NOT EXISTS meal_items (
        id           SERIAL PRIMARY KEY,
        meal_id      INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        type         TEXT NOT NULL CHECK (type IN ('recipe','product','manual')),
        reference_id INTEGER,
        name         TEXT NOT NULL,
        quantity     TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items (meal_id)`,
      `CREATE TABLE IF NOT EXISTS user_item_usage (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_type    TEXT NOT NULL,
        item_id      INTEGER,
        item_name    TEXT NOT NULL,
        last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        use_count    INTEGER NOT NULL DEFAULT 1,
        CONSTRAINT user_item_usage_unique UNIQUE (user_id, item_name, item_type)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_user_item_usage_user_id ON user_item_usage (user_id)`,
    ],
  },

  {
    id: "2026-04-02_add_shop_status_to_shopping_list",
    statements: [
      // Tracks guided shop mode state per item.
      // Values: pending | already_got | need_to_buy | in_basket | alternate_selected | deferred
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS shop_status TEXT",
    ],
  },

  {
    id: "2026-04-04_custom_diary_metrics",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_metric_defs JSONB NOT NULL DEFAULT '[]'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS diary_extra_metrics JSONB NOT NULL DEFAULT '[]'",
      "ALTER TABLE food_diary_metrics ADD COLUMN IF NOT EXISTS custom_values JSONB NOT NULL DEFAULT '{}'",
    ],
  },

  {
    id: "2026-04-05_savings_events",
    statements: [
      `CREATE TABLE IF NOT EXISTS savings_events (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date        TEXT NOT NULL,
        type        TEXT NOT NULL CHECK (type IN ('takeaway_avoided','pantry_used','smart_swap')),
        amount      REAL NOT NULL,
        source_id   INTEGER,
        source_type TEXT,
        note        TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_savings_events_user_id ON savings_events (user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_savings_events_user_date ON savings_events (user_id, date)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_savings_events_source ON savings_events (user_id, source_type, source_id) WHERE source_id IS NOT NULL AND source_type IS NOT NULL`,
    ],
  },

  {
    id: "2026-04-12_item_resolution_layer",
    statements: [
      // original_text: raw user input before any normalisation
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS original_text TEXT",
      // canonical_name: authoritative resolved name (e.g. "toilet roll" not "bog roll")
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS canonical_name TEXT",
      // subcategory: finer classification within a category (e.g. category=produce, subcategory=root_vegetable)
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS subcategory TEXT",
      // resolution_state: lifecycle of the item from raw input to resolved
      // Values: raw | needs_review | resolved | matched_to_product
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS resolution_state TEXT NOT NULL DEFAULT 'raw'",
      // review_reason: machine-readable reason why the item needs review
      // Values: unrecognised_item | ambiguous_term | low_confidence | category_conflict
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS review_reason TEXT",
      // review_suggestions: JSON array of suggested specific variants for ambiguous umbrella terms
      // e.g. ["strawberries","blueberries","raspberries","mixed berries"] for "berries"
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS review_suggestions TEXT",
    ],
  },

  {
    id: "2026-04-16_add_guest_eaters_to_planner_entries",
    statements: [
      "ALTER TABLE planner_entries ADD COLUMN IF NOT EXISTS guest_eaters JSONB",
    ],
  },

  {
    id: "2026-04-16_ingredient_sources_meal_context",
    statements: [
      "ALTER TABLE ingredient_sources ADD COLUMN IF NOT EXISTS eater_ids INTEGER[]",
      "ALTER TABLE ingredient_sources ADD COLUMN IF NOT EXISTS guest_eaters JSONB",
    ],
  },

  {
    id: "2026-04-16_add_household_eaters_tables",
    statements: [
      `CREATE TABLE IF NOT EXISTS household_eaters (
        id SERIAL PRIMARY KEY,
        household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        default_diet_types TEXT[],
        hard_restrictions TEXT[]
      )`,
      `CREATE TABLE IF NOT EXISTS planner_entry_eaters (
        id SERIAL PRIMARY KEY,
        entry_id INTEGER NOT NULL REFERENCES planner_entries(id) ON DELETE CASCADE,
        household_eater_id INTEGER NOT NULL REFERENCES household_eaters(id) ON DELETE CASCADE,
        CONSTRAINT planner_entry_eaters_entry_member_unique UNIQUE (entry_id, household_eater_id)
      )`,
      `CREATE TABLE IF NOT EXISTS planner_week_eater_overrides (
        id SERIAL PRIMARY KEY,
        week_id INTEGER NOT NULL REFERENCES planner_weeks(id) ON DELETE CASCADE,
        eater_id INTEGER NOT NULL REFERENCES household_eaters(id) ON DELETE CASCADE,
        diet_types TEXT[] NOT NULL DEFAULT '{}',
        CONSTRAINT pweo_week_eater_unique UNIQUE (week_id, eater_id)
      )`,
    ],
  },

  {
    id: "2026-04-18_fix_pantry_uniqueness",
    statements: [
      // ── Step 1: Remove active household-level duplicates ─────────────────────
      // The old constraint was UNIQUE(user_id, ingredient_key), so two users in
      // the same household could both insert the same ingredient_key. Pantry items
      // are fetched by household_id, so these duplicates are always visible.
      //
      // Keep the best row per (household_id, ingredient_key):
      //   • prefer user-added items (is_default=false) over seeded defaults
      //   • then prefer the oldest record (lowest id) — most likely the original
      //
      // Only touches active (is_deleted=false) rows. Soft-deleted rows are left
      // alone — they are hidden from all queries and represent intentional removals.
      `DELETE FROM user_pantry_items
       WHERE id IN (
         SELECT id FROM (
           SELECT id,
                  ROW_NUMBER() OVER (
                    PARTITION BY household_id, ingredient_key
                    ORDER BY is_default ASC, id ASC
                  ) AS rn
           FROM user_pantry_items
           WHERE household_id IS NOT NULL
             AND is_deleted = FALSE
         ) ranked
         WHERE rn > 1
       )`,

      // ── Step 2: Drop the old user-scoped unique constraint ───────────────────
      // This constraint was UNIQUE(user_id, ingredient_key). It only prevented a
      // single user from adding the same key twice — not two household members.
      "ALTER TABLE user_pantry_items DROP CONSTRAINT IF EXISTS user_pantry_items_user_id_ingredient_key_key",

      // ── Step 3: Add the correct household-scoped partial unique index ─────────
      // A partial index on active rows only, so:
      //   • soft-deleted defaults do not block re-adding the same ingredient
      //   • rows with a null household_id (legacy, should be none) are excluded
      //     and still protected by the now-dropped user-level constraint
      //
      // Two users in the same household can no longer create duplicate entries.
      // Concurrent seeding is also safe: the second seed's inserts will conflict
      // on this index and be silently skipped via ON CONFLICT DO NOTHING.
      `CREATE UNIQUE INDEX IF NOT EXISTS user_pantry_items_household_ingredient_active_unique
       ON user_pantry_items (household_id, ingredient_key)
       WHERE is_deleted = FALSE AND household_id IS NOT NULL`,
    ],
  },

  {
    id: "2026-04-18_pantry_ingredient_knowledge",
    statements: [
      `CREATE TABLE IF NOT EXISTS pantry_ingredient_knowledge (
        id                 SERIAL PRIMARY KEY,
        ingredient_key     TEXT NOT NULL UNIQUE,
        supports           TEXT[] NOT NULL DEFAULT '{}',
        why_it_matters     TEXT,
        good_to_know       TEXT,
        how_to_choose      TEXT[],
        tags               TEXT[] NOT NULL DEFAULT '{}',
        last_enriched_at   TIMESTAMPTZ,
        enrichment_source  TEXT NOT NULL DEFAULT 'manual',
        enrichment_version INTEGER NOT NULL DEFAULT 1,
        is_locked          BOOLEAN NOT NULL DEFAULT FALSE,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    ],
  },

  {
    id: "2026-04-18_pantry_knowledge_highlights",
    statements: [
      `ALTER TABLE pantry_ingredient_knowledge ADD COLUMN IF NOT EXISTS highlights TEXT[]`,
    ],
  },

  {
    // RELEASE-HARDENING: Final sweep for planner_weeks rows whose household_id
    // was never backfilled. Earlier backfills (2026-03-04 and 2026-03-13) only
    // joined through households.created_by_user_id, missing users who became
    // household members after those migrations ran. This join goes through
    // household_members directly, matching every active membership.
    // Safe: only touches rows where household_id IS NULL. Idempotent.
    id: "2026-04-19_backfill_planner_weeks_household_id_final",
    statements: [
      `UPDATE planner_weeks pw
       SET household_id = hm.household_id
       FROM household_members hm
       WHERE hm.user_id = pw.user_id
         AND hm.status = 'active'
         AND pw.household_id IS NULL`,
    ],
  },

  {
    // RELEASE-HARDENING: Ensure no shopping_list rows have a NULL
    // resolution_state. The column was added with DEFAULT 'raw' on
    // 2026-04-12, but any row inserted via a raw SQL path that bypassed
    // the ORM default could still be NULL. Setting to 'raw' is the safe
    // starting point — it marks items as unprocessed without losing data.
    // Idempotent; safe to run multiple times.
    id: "2026-04-19_backfill_shopping_list_null_resolution_state",
    statements: [
      `UPDATE shopping_list
       SET resolution_state = 'raw'
       WHERE resolution_state IS NULL`,
    ],
  },

  {
    id: "2026-04-19_ingredient_classifications_table",
    statements: [
      `CREATE TABLE IF NOT EXISTS ingredient_classifications (
         id              SERIAL PRIMARY KEY,
         normalized_key  TEXT NOT NULL UNIQUE,
         canonical_name  TEXT NOT NULL,
         canonical_key   TEXT NOT NULL,
         category        TEXT NOT NULL,
         subcategory     TEXT,
         aliases         TEXT,
         source          TEXT NOT NULL DEFAULT 'ai',
         ai_confidence   TEXT,
         ai_model        TEXT,
         review_status   TEXT NOT NULL DEFAULT 'pending',
         notes           TEXT,
         created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_ic_normalized_key
         ON ingredient_classifications(normalized_key)`,
      `CREATE INDEX IF NOT EXISTS idx_ic_review_status
         ON ingredient_classifications(review_status)`,
    ],
  },

  {
    // adaptation_result was defined in shared/schema.ts and used by
    // savePlannerEntryAdaptation / the "Tailor for household" feature,
    // but the column was never added to the DB. Safe: JSONB nullable,
    // no default needed. Idempotent via IF NOT EXISTS guard.
    id: "2026-04-23_add_adaptation_result_to_planner_entries",
    statements: [
      "ALTER TABLE planner_entries ADD COLUMN IF NOT EXISTS adaptation_result JSONB",
    ],
  },

  {
    id: "2026-04-25_product_matches_price_source",
    statements: [
      "ALTER TABLE product_matches ADD COLUMN IF NOT EXISTS price_source TEXT",
    ],
  },

  {
    id: "2026-04-28_add_cupboard_quantity_to_shopping_list",
    statements: [
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS cupboard_quantity REAL",
      "UPDATE shopping_list SET shop_status = 'pending' WHERE shop_status LIKE 'partial:%'",
    ],
  },

  {
    // Additive: explicit per-row origin tag. Nullable; existing rows keep
    // working via the legacy basket_label / ingredient_sources fall-back in
    // application code. Backfill uses ONLY explicit signals — never guesses:
    //   • basket_label LIKE 'quick_list\_%' → 'quick_list' (only the Quick
    //     List entry path writes that prefix).
    //   • presence of an ingredient_sources join row → 'planner'.
    //   • everything else stays NULL.
    // Both UPDATEs are guarded by `source IS NULL` so re-runs are no-ops.
    id: "2026-05-03_add_source_to_shopping_list",
    statements: [
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS source TEXT",
      `UPDATE shopping_list
         SET source = 'quick_list'
       WHERE source IS NULL
         AND basket_label LIKE 'quick_list\\_%' ESCAPE '\\'`,
      `UPDATE shopping_list sl
         SET source = 'planner'
       WHERE sl.source IS NULL
         AND EXISTS (
           SELECT 1 FROM ingredient_sources ig
           WHERE ig.shopping_list_item_id = sl.id
         )`,
    ],
  },

  {
    // Scope correction: 'basket' is not an approved source value. Any rows
    // tagged 'basket' by an interim build are remapped to 'manual'. Idempotent.
    id: "2026-05-03_rename_source_basket_to_manual",
    statements: [
      "UPDATE shopping_list SET source = 'manual' WHERE source = 'basket'",
    ],
  },

  {
    id: "2026-05-05_add_product_events_and_activity_summary",
    statements: [
      `CREATE TABLE IF NOT EXISTS product_events (
        id               SERIAL PRIMARY KEY,
        event_type       TEXT NOT NULL,
        feature_area     TEXT NOT NULL,
        user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        household_id     INTEGER NOT NULL,
        meal_id          INTEGER,
        planner_entry_id INTEGER,
        pantry_item_id   INTEGER,
        basket_item_id   INTEGER,
        product_id       INTEGER,
        metadata         JSONB,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS product_events_user_id_idx    ON product_events (user_id)`,
      `CREATE INDEX IF NOT EXISTS product_events_event_type_idx ON product_events (event_type)`,
      `CREATE INDEX IF NOT EXISTS product_events_created_at_idx ON product_events (created_at)`,
      `CREATE TABLE IF NOT EXISTS activity_summary (
        id                      SERIAL PRIMARY KEY,
        user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        household_id            INTEGER NOT NULL,
        current_shopping_items  INTEGER NOT NULL DEFAULT 0,
        current_planner_meals   INTEGER NOT NULL DEFAULT 0,
        current_pantry_items    INTEGER NOT NULL DEFAULT 0,
        current_recipes         INTEGER NOT NULL DEFAULT 0,
        lifetime_shopping_adds  INTEGER NOT NULL DEFAULT 0,
        lifetime_planner_adds   INTEGER NOT NULL DEFAULT 0,
        lifetime_pantry_adds    INTEGER NOT NULL DEFAULT 0,
        lifetime_recipe_adds    INTEGER NOT NULL DEFAULT 0,
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT activity_summary_user_id_unique UNIQUE (user_id)
      )`,
    ],
  },

  {
    id: "2026-05-18_household_safe_variants",
    statements: [
      "ALTER TABLE meals ADD COLUMN IF NOT EXISTS is_household_safe_variant BOOLEAN NOT NULL DEFAULT FALSE",
      "ALTER TABLE meals ADD COLUMN IF NOT EXISTS household_safe_for JSONB",
      "ALTER TABLE planner_entries ADD COLUMN IF NOT EXISTS original_meal_id_before_variant INTEGER REFERENCES meals(id) ON DELETE SET NULL",
      "CREATE INDEX IF NOT EXISTS meals_household_safe_variant_idx ON meals (user_id, is_household_safe_variant) WHERE is_household_safe_variant = TRUE",
    ],
  },

  {
    id: "2026-05-18_variant_kind_cookbook_visibility",
    statements: [
      // Disambiguates edit-copy forks from household-safe AI variants.
      // Values: null = original, 'edit_copy' = cookbook fork, 'household_safe' = AI variant.
      "ALTER TABLE meals ADD COLUMN IF NOT EXISTS variant_kind TEXT",
      // Phase 1 default: false everywhere. Phase 2 will expose the toggle.
      "ALTER TABLE meals ADD COLUMN IF NOT EXISTS show_in_cookbook BOOLEAN NOT NULL DEFAULT FALSE",
      // Backfill existing household-safe variant rows (created by today's earlier migration).
      "UPDATE meals SET variant_kind = 'household_safe' WHERE is_household_safe_variant = TRUE AND variant_kind IS NULL",
      "CREATE INDEX IF NOT EXISTS meals_variant_kind_idx ON meals (user_id, variant_kind) WHERE variant_kind IS NOT NULL",
    ],
  },

  {
    id: "2026-05-20_add_week_provisioning_items",
    statements: [
      `CREATE TABLE IF NOT EXISTS week_provisioning_items (
        id SERIAL PRIMARY KEY,
        week_id INTEGER NOT NULL REFERENCES planner_weeks(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        meal_id INTEGER,
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      "CREATE INDEX IF NOT EXISTS wpi_week_id_idx ON week_provisioning_items (week_id)",
    ],
  },

  {
    id: "2026-05-22_add_shopping_fulfilment_memory",
    statements: [
      `CREATE TABLE IF NOT EXISTS shopping_fulfilment_memory (
        id SERIAL PRIMARY KEY,
        household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        normalized_item_name TEXT NOT NULL,
        original_item_name TEXT,
        barcode TEXT,
        product_name TEXT NOT NULL,
        brand TEXT,
        tha_rating INTEGER,
        available_stores JSONB,
        source TEXT NOT NULL,
        chosen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS sfm_household_id_idx ON shopping_fulfilment_memory (household_id)`,
      `CREATE INDEX IF NOT EXISTS sfm_household_item_idx ON shopping_fulfilment_memory (household_id, normalized_item_name)`,
    ],
  },

  {
    id: "2026-05-23_add_pet_pantry_category",
    statements: [
      "ALTER TABLE user_pantry_items DROP CONSTRAINT IF EXISTS user_pantry_items_category_check",
      "ALTER TABLE user_pantry_items ADD CONSTRAINT user_pantry_items_category_check CHECK (category IN ('larder','fridge','freezer','household','fruit','pet'))",
    ],
  },

  {
    id: "2026-05-23_add_pantry_need_quantity",
    statements: [
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS need_quantity_value REAL",
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS need_unit TEXT",
    ],
  },

  {
    id: "2026-06-11_add_meal_uplift_applications",
    statements: [
      `CREATE TABLE IF NOT EXISTS meal_uplift_applications (
        id SERIAL PRIMARY KEY,
        meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rule_id TEXT NOT NULL,
        rule_name TEXT NOT NULL,
        ingredient TEXT NOT NULL,
        action TEXT NOT NULL,
        quantity TEXT,
        explanation TEXT NOT NULL,
        added_by TEXT NOT NULL DEFAULT 'tha_uplift',
        planner_entry_id INTEGER,
        forked_from_meal_id INTEGER,
        status TEXT NOT NULL DEFAULT 'accepted',
        accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        removed_at TIMESTAMP WITH TIME ZONE
      )`,
      `CREATE INDEX IF NOT EXISTS mua_meal_id_idx ON meal_uplift_applications (meal_id)`,
      `CREATE INDEX IF NOT EXISTS mua_user_id_idx ON meal_uplift_applications (user_id)`,
      `CREATE INDEX IF NOT EXISTS mua_meal_status_idx ON meal_uplift_applications (meal_id, status)`,
    ],
  },

  {
    // Hybrid Meal Occasion — additive only. Adds primary_slot / suitable_slots /
    // energy_band / style_tags to meal_templates and meals, then backfills from
    // existing category data. Backfill is derived strictly from the live planner
    // SLOT_CATEGORY_MAPPING (its exact inverse), so suitable_slots reproduces
    // today's slot eligibility byte-for-byte and planner output is unchanged.
    // No column is altered, no row deleted. Every UPDATE is guarded so re-runs
    // are no-ops. energy_band / style_tags keep their column defaults.
    id: "2026-06-14_add_hybrid_meal_occasion",
    statements: [
      // ── meal_templates columns ──
      `ALTER TABLE meal_templates
        ADD COLUMN IF NOT EXISTS primary_slot TEXT,
        ADD COLUMN IF NOT EXISTS suitable_slots TEXT[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS energy_band TEXT,
        ADD COLUMN IF NOT EXISTS style_tags TEXT[] NOT NULL DEFAULT '{}'`,

      // ── meals columns ──
      `ALTER TABLE meals
        ADD COLUMN IF NOT EXISTS primary_slot TEXT,
        ADD COLUMN IF NOT EXISTS suitable_slots TEXT[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS energy_band TEXT,
        ADD COLUMN IF NOT EXISTS style_tags TEXT[] NOT NULL DEFAULT '{}'`,

      // ── Backfill meal_templates.primary_slot from text category (4 canonical slots only) ──
      `UPDATE meal_templates
         SET primary_slot = lower(category)
       WHERE primary_slot IS NULL
         AND lower(category) IN ('breakfast','lunch','dinner','snack')`,

      // ── Backfill meal_templates.suitable_slots = inverse of SLOT_CATEGORY_MAPPING ──
      `UPDATE meal_templates
         SET suitable_slots = CASE lower(category)
           WHEN 'breakfast' THEN ARRAY['breakfast']
           WHEN 'smoothie'  THEN ARRAY['breakfast','snack']
           WHEN 'lunch'     THEN ARRAY['lunch']
           WHEN 'snack'     THEN ARRAY['lunch','snack']
           WHEN 'salad'     THEN ARRAY['lunch']
           WHEN 'dinner'    THEN ARRAY['dinner']
           WHEN 'main'      THEN ARRAY['dinner']
           WHEN 'dessert'   THEN ARRAY['snack']
           WHEN 'drink'     THEN ARRAY['snack']
           ELSE suitable_slots
         END
       WHERE (suitable_slots IS NULL OR cardinality(suitable_slots) = 0)
         AND lower(category) IN
           ('breakfast','smoothie','lunch','snack','salad','dinner','main','dessert','drink')`,

      // ── Backfill meals.primary_slot via category_id -> meal_categories.name ──
      `UPDATE meals m
         SET primary_slot = lower(mc.name)
        FROM meal_categories mc
       WHERE m.category_id = mc.id
         AND m.primary_slot IS NULL
         AND lower(mc.name) IN ('breakfast','lunch','dinner','snack')`,

      // ── Backfill meals.suitable_slots via category_id -> meal_categories.name ──
      `UPDATE meals m
         SET suitable_slots = CASE lower(mc.name)
           WHEN 'breakfast' THEN ARRAY['breakfast']
           WHEN 'smoothie'  THEN ARRAY['breakfast','snack']
           WHEN 'lunch'     THEN ARRAY['lunch']
           WHEN 'snack'     THEN ARRAY['lunch','snack']
           WHEN 'salad'     THEN ARRAY['lunch']
           WHEN 'dinner'    THEN ARRAY['dinner']
           WHEN 'main'      THEN ARRAY['dinner']
           WHEN 'dessert'   THEN ARRAY['snack']
           WHEN 'drink'     THEN ARRAY['snack']
           ELSE m.suitable_slots
         END
        FROM meal_categories mc
       WHERE m.category_id = mc.id
         AND (m.suitable_slots IS NULL OR cardinality(m.suitable_slots) = 0)
         AND lower(mc.name) IN
           ('breakfast','smoothie','lunch','snack','salad','dinner','main','dessert','drink')`,
    ],
  },

  {
    // Starter shell catalogue — additive only. Adds nutrition_opportunities to
    // meal_templates so meal shells can carry editorial "nutrition opportunity"
    // metadata (e.g. extra greens, lentils, seeds). Display/metadata only — never
    // read by planner scoring, filtering or slot eligibility. No column altered,
    // no row touched; existing rows keep the column default ('{}'). No backfill.
    id: "2026-06-14_add_shell_nutrition_opportunities",
    statements: [
      `ALTER TABLE meal_templates
        ADD COLUMN IF NOT EXISTS nutrition_opportunities TEXT[] NOT NULL DEFAULT '{}'`,
    ],
  },

  {
    // Promote 6 pre-existing templates to canonical starter-shell status.
    // These templates were skipped by the seed (they already existed) but were
    // missing energyBand, styleTags, nutritionOpportunities, compatible_diets,
    // and all component-slot fields. Each UPDATE targets its row by exact id so
    // no other row is touched. Idempotent: re-running overwrites with same values.
    //
    // Canonical metadata source:
    //   docs/investigations/cookbook/STARTER_SHELL_EXISTING_TEMPLATE_ENRICHMENT.md
    //
    // IDs: 633 Cooked Breakfast, 287 Overnight Oats, 291 Breakfast Wrap,
    //      166 Pasta Salad, 109 Sausage & Mash, 78 Shepherd's Pie
    id: "2026-06-15_enrich_six_pre_existing_shells",
    statements: [
      // ── Cooked Breakfast (id 633) ─────────────────────────────────────────────
      `UPDATE meal_templates SET
         primary_slot            = 'breakfast',
         suitable_slots          = ARRAY['breakfast','lunch','dinner'],
         energy_band             = 'hearty',
         style_tags              = ARRAY['shared-meal','adaptable','family-pleaser','comfort'],
         shared_base_components  = ARRAY['cooked sides'],
         protein_slots           = ARRAY['eggs','sausages','vegetarian sausages','beans'],
         carb_slots              = ARRAY['toast','gf toast','hash browns'],
         veg_slots               = ARRAY['tomatoes','mushrooms','greens','avocado'],
         topping_slots           = ARRAY[]::TEXT[],
         sauce_slots             = ARRAY[]::TEXT[],
         compatible_diets        = ARRAY['Vegetarian','Gluten-Free','Dairy-Free','Keto'],
         nutrition_opportunities = ARRAY['extra greens','beans','mushrooms','seeds','avocado']
       WHERE id = 633`,

      // ── Overnight Oats (id 287) ───────────────────────────────────────────────
      `UPDATE meal_templates SET
         primary_slot            = 'breakfast',
         suitable_slots          = ARRAY['breakfast','snack'],
         energy_band             = 'medium',
         style_tags              = ARRAY['fresh','quick'],
         shared_base_components  = ARRAY['soaked oats base'],
         protein_slots           = ARRAY['yogurt','milk or plant milk','protein powder'],
         carb_slots              = ARRAY['rolled oats'],
         veg_slots               = ARRAY[]::TEXT[],
         topping_slots           = ARRAY['fruit','seeds','nut butter'],
         sauce_slots             = ARRAY[]::TEXT[],
         compatible_diets        = ARRAY['Vegetarian','Vegan','Dairy-Free','Gluten-Free'],
         nutrition_opportunities = ARRAY['berries','nuts','seeds','chia','fruit variety']
       WHERE id = 287`,

      // ── Breakfast Wrap (id 291) ───────────────────────────────────────────────
      `UPDATE meal_templates SET
         primary_slot            = 'breakfast',
         suitable_slots          = ARRAY['breakfast','lunch'],
         energy_band             = 'medium',
         style_tags              = ARRAY['adaptable','family-pleaser','quick'],
         shared_base_components  = ARRAY['wrap'],
         protein_slots           = ARRAY['eggs','beans','plant protein'],
         carb_slots              = ARRAY['tortilla wrap'],
         veg_slots               = ARRAY['peppers','tomatoes','greens'],
         topping_slots           = ARRAY['cheese or alternative'],
         sauce_slots             = ARRAY['salsa or sauce'],
         compatible_diets        = ARRAY['Vegetarian','Vegan','Dairy-Free','Gluten-Free'],
         nutrition_opportunities = ARRAY['greens','tomatoes','avocado','beans','peppers']
       WHERE id = 291`,

      // ── Pasta Salad (id 166) ──────────────────────────────────────────────────
      `UPDATE meal_templates SET
         primary_slot            = 'lunch',
         suitable_slots          = ARRAY['lunch','dinner'],
         energy_band             = 'medium',
         style_tags              = ARRAY['fresh','adaptable'],
         shared_base_components  = ARRAY['pasta base','vegetables'],
         protein_slots           = ARRAY['chicken','beans','cheese or alternative','tuna'],
         carb_slots              = ARRAY['pasta'],
         veg_slots               = ARRAY['peppers','greens','tomatoes'],
         topping_slots           = ARRAY['seeds','herbs'],
         sauce_slots             = ARRAY['dressing'],
         compatible_diets        = ARRAY['Vegetarian','Vegan','Dairy-Free','Gluten-Free'],
         nutrition_opportunities = ARRAY['greens','beans','seeds','peppers','herbs']
       WHERE id = 166`,

      // ── Sausage & Mash (id 109) ───────────────────────────────────────────────
      `UPDATE meal_templates SET
         primary_slot            = 'dinner',
         suitable_slots          = ARRAY['lunch','dinner'],
         energy_band             = 'hearty',
         style_tags              = ARRAY['comfort','family-pleaser'],
         shared_base_components  = ARRAY['mash','gravy'],
         protein_slots           = ARRAY['sausages','plant-based sausages'],
         carb_slots              = ARRAY['mashed potato'],
         veg_slots               = ARRAY['peas','greens','root vegetables'],
         topping_slots           = ARRAY['herbs'],
         sauce_slots             = ARRAY['gravy'],
         compatible_diets        = ARRAY['Vegetarian','Vegan','Gluten-Free','Dairy-Free'],
         nutrition_opportunities = ARRAY['greens','peas','root veg','beans','herbs']
       WHERE id = 109`,

      // ── Shepherd's Pie (id 78) ────────────────────────────────────────────────
      `UPDATE meal_templates SET
         primary_slot            = 'dinner',
         suitable_slots          = ARRAY['dinner'],
         energy_band             = 'hearty',
         style_tags              = ARRAY['comfort','family-pleaser'],
         shared_base_components  = ARRAY['mince base','mash topping'],
         protein_slots           = ARRAY['mince','lentils','plant protein'],
         carb_slots              = ARRAY['mashed potato'],
         veg_slots               = ARRAY['peas','root vegetables','greens'],
         topping_slots           = ARRAY['herbs'],
         sauce_slots             = ARRAY['gravy'],
         compatible_diets        = ARRAY['Vegetarian','Vegan','Gluten-Free','Dairy-Free'],
         nutrition_opportunities = ARRAY['extra vegetables','lentils','beans','greens']
       WHERE id = 78`,
    ],
  },

  {
    // Backfill display metadata from meal_templates onto their linked meals rows.
    // The hybrid-meal-occasion columns (style_tags, suitable_slots) were added to the
    // meals table in 2026-06-14_add_hybrid_meal_occasion but were never populated for
    // existing meal rows — only the meal_templates rows were enriched by the seed and
    // enrichment migrations. The auto-import path also creates meals without copying
    // template tags. This migration fixes all existing rows in one pass.
    //
    // Scope: display-only. Does not affect planner scoring, ranking, slot eligibility
    // or any restriction logic. Additive only: only updates rows with currently-empty
    // arrays where the linked template has non-empty values.
    id: "2026-06-15_backfill_meals_from_templates",
    statements: [
      // ── Copy style_tags from the linked template ──────────────────────────────
      `UPDATE meals m
         SET style_tags = t.style_tags
        FROM meal_templates t
       WHERE m.meal_template_id = t.id
         AND (m.style_tags IS NULL OR cardinality(m.style_tags) = 0)
         AND cardinality(t.style_tags) > 0`,

      // ── Copy suitable_slots from the linked template (supplements category backfill) ──
      `UPDATE meals m
         SET suitable_slots = t.suitable_slots
        FROM meal_templates t
       WHERE m.meal_template_id = t.id
         AND (m.suitable_slots IS NULL OR cardinality(m.suitable_slots) = 0)
         AND cardinality(t.suitable_slots) > 0`,
    ],
  },

  {
    // WS0 — Nutrition Knowledge Registry. Additive only: creates six new tables
    // for editorial nutrition knowledge (foods, nutrients, health benefits and
    // their relationships). Touches no existing table, column or row. Not wired
    // into planner scoring, restrictions, meal scoring or recommendation ranking.
    // Idempotent — safe to re-run. Seeded separately via `npm run seed:knowledge`.
    id: "2026-06-18_ws0_knowledge_registry",
    statements: [
      `CREATE TABLE IF NOT EXISTS knowledge_foods (
        id              SERIAL PRIMARY KEY,
        slug            TEXT NOT NULL UNIQUE,
        name            TEXT NOT NULL,
        category        TEXT NOT NULL,
        subcategory     TEXT,
        aliases         TEXT[] NOT NULL DEFAULT '{}',
        description     TEXT,
        image_url       TEXT,
        common_forms    TEXT[] NOT NULL DEFAULT '{}',
        storage_guidance TEXT,
        seasonality     TEXT,
        source          TEXT NOT NULL DEFAULT 'THA editorial',
        display_order   INTEGER NOT NULL DEFAULT 0,
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS knowledge_nutrients (
        id              SERIAL PRIMARY KEY,
        slug            TEXT NOT NULL UNIQUE,
        name            TEXT NOT NULL,
        description     TEXT,
        category        TEXT,
        source          TEXT NOT NULL DEFAULT 'THA editorial',
        display_order   INTEGER NOT NULL DEFAULT 0,
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS knowledge_health_benefits (
        id              SERIAL PRIMARY KEY,
        slug            TEXT NOT NULL UNIQUE,
        name            TEXT NOT NULL,
        description     TEXT,
        icon            TEXT,
        source          TEXT NOT NULL DEFAULT 'THA editorial',
        display_order   INTEGER NOT NULL DEFAULT 0,
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS knowledge_food_nutrients (
        id            SERIAL PRIMARY KEY,
        food_slug     TEXT NOT NULL REFERENCES knowledge_foods(slug) ON DELETE CASCADE,
        nutrient_slug TEXT NOT NULL REFERENCES knowledge_nutrients(slug) ON DELETE CASCADE,
        amount        TEXT,
        confidence    TEXT NOT NULL DEFAULT 'established',
        ranking       INTEGER NOT NULL DEFAULT 0,
        source        TEXT NOT NULL DEFAULT 'THA editorial',
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_knowledge_food_nutrient UNIQUE (food_slug, nutrient_slug)
      )`,

      `CREATE TABLE IF NOT EXISTS knowledge_food_benefits (
        id                SERIAL PRIMARY KEY,
        food_slug         TEXT NOT NULL REFERENCES knowledge_foods(slug) ON DELETE CASCADE,
        benefit_slug      TEXT NOT NULL REFERENCES knowledge_health_benefits(slug) ON DELETE CASCADE,
        evidence_strength TEXT NOT NULL DEFAULT 'emerging',
        ranking           INTEGER NOT NULL DEFAULT 0,
        source            TEXT NOT NULL DEFAULT 'THA editorial',
        is_active         BOOLEAN NOT NULL DEFAULT TRUE,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_knowledge_food_benefit UNIQUE (food_slug, benefit_slug)
      )`,

      `CREATE TABLE IF NOT EXISTS knowledge_nutrient_benefits (
        id                SERIAL PRIMARY KEY,
        nutrient_slug     TEXT NOT NULL REFERENCES knowledge_nutrients(slug) ON DELETE CASCADE,
        benefit_slug      TEXT NOT NULL REFERENCES knowledge_health_benefits(slug) ON DELETE CASCADE,
        evidence_strength TEXT NOT NULL DEFAULT 'emerging',
        ranking           INTEGER NOT NULL DEFAULT 0,
        source            TEXT NOT NULL DEFAULT 'THA editorial',
        is_active         BOOLEAN NOT NULL DEFAULT TRUE,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_knowledge_nutrient_benefit UNIQUE (nutrient_slug, benefit_slug)
      )`,
    ],
  },

  {
    // INT18 Phase 0 — Conversation Store.
    // Adds three tables for the TIP3 Conversation Platform. All additive —
    // no existing table, column or row is touched. Idempotent (IF NOT EXISTS).
    //
    // POINTER DISCIPLINE (TIP3 Risk R1): entity_refs, context_frame_ref, and
    // outcome_ref store IDs/pointers only — never business data rows.
    // ConversationStore is the sole owner of these tables; no other module writes.
    id: "2026-07-01_int18_conversation_store",
    statements: [
      `CREATE TABLE IF NOT EXISTS conversations (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (user_id)
      )`,

      `CREATE TABLE IF NOT EXISTS conversation_threads (
        id              SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        surface         TEXT NOT NULL,
        opened_at       TIMESTAMP NOT NULL DEFAULT NOW(),
        closed_at       TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS conversation_turns (
        id                SERIAL PRIMARY KEY,
        thread_id         INTEGER NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
        role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        surface           TEXT NOT NULL,
        utterance         TEXT NOT NULL,
        resolved_intent   JSONB,
        context_frame_ref JSONB,
        entity_refs       JSONB NOT NULL DEFAULT '[]',
        outcome_ref       JSONB,
        created_at        TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
    ],
  },

  {
    // OD1 — Opportunity Delivery Framework. Adds the single new store this
    // framework owns: the delivery lifecycle of a Domain Intelligence
    // opportunity (delivered/acknowledged/dismissed/accepted), keyed by
    // (user_id, opportunity_id) — not conversation-turn-scoped, since these
    // opportunities are ambient (generated from existing activity), not
    // conversational. Additive only; no existing table or column touched.
    id: "2026-07-03_opportunity_deliveries",
    statements: [
      `CREATE TABLE IF NOT EXISTS opportunity_deliveries (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        opportunity_id TEXT NOT NULL,
        capability_id TEXT NOT NULL,
        domain        TEXT NOT NULL,
        type          TEXT NOT NULL,
        priority      TEXT NOT NULL,
        surface       TEXT NOT NULL,
        status        TEXT NOT NULL DEFAULT 'delivered',
        delivered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at   TIMESTAMPTZ,
        CONSTRAINT opportunity_deliveries_user_opportunity_unique UNIQUE (user_id, opportunity_id)
      )`,
      `CREATE INDEX IF NOT EXISTS opportunity_deliveries_user_status_idx ON opportunity_deliveries (user_id, status)`,
    ],
  },

  {
    // OD1 — Opportunity Delivery Framework: the one new user preference this
    // framework respects. Empty array means no muting (honest default, never
    // a fabricated preference).
    id: "2026-07-03_user_preferences_muted_opportunity_types",
    statements: [
      "ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS muted_opportunity_types TEXT[] NOT NULL DEFAULT '{}'",
    ],
  },

  {
    // EL1 — Evidence & Learning Platform. Two new stores: the append-only
    // capture of structured household outcomes, and the derived, confirmation-
    // gated patterns detected over an accumulation of those outcomes. Additive
    // only; no existing table or column touched. See
    // server/intelligence/evidence-learning/evidence-learning-store.ts (sole owner).
    id: "2026-07-03_evidence_and_learning_platform",
    statements: [
      `CREATE TABLE IF NOT EXISTS household_evidence_events (
        id            SERIAL PRIMARY KEY,
        household_id  INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        domain        TEXT NOT NULL,
        subject_type  TEXT NOT NULL,
        subject_id    TEXT NOT NULL,
        subject_key   TEXT NOT NULL,
        outcome_type  TEXT NOT NULL,
        direction     TEXT NOT NULL,
        context       JSONB,
        source_capability_id TEXT NOT NULL,
        occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS household_evidence_events_household_subject_idx ON household_evidence_events (household_id, domain, subject_type, subject_key)`,
      `CREATE INDEX IF NOT EXISTS household_evidence_events_household_occurred_idx ON household_evidence_events (household_id, occurred_at)`,
      `CREATE TABLE IF NOT EXISTS household_learning_signals (
        id                SERIAL PRIMARY KEY,
        household_id      INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        domain            TEXT NOT NULL,
        subject_type      TEXT NOT NULL,
        subject_key       TEXT NOT NULL,
        direction         TEXT NOT NULL,
        evidence_count    INTEGER NOT NULL,
        consistency       REAL NOT NULL,
        confidence        TEXT NOT NULL,
        supporting_event_ids JSONB NOT NULL,
        rationale         TEXT NOT NULL,
        status            TEXT NOT NULL DEFAULT 'pending_confirmation',
        detected_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        confirmed_by_user_id INTEGER REFERENCES users(id),
        confirmed_at      TIMESTAMPTZ,
        confirmation_notes TEXT,
        CONSTRAINT household_learning_signals_dimension_unique UNIQUE (household_id, domain, subject_type, subject_key, direction)
      )`,
      `CREATE INDEX IF NOT EXISTS household_learning_signals_household_status_idx ON household_learning_signals (household_id, status)`,
    ],
  },

  {
    // PKC Phase 0 — Layer-2 claim trust (Rule KC8, PLATFORM_KNOWLEDGE_COMPLETION
    // _ARCHITECTURE.md §4.1/§7). Additive columns only: source_refs holds the
    // citation list (KnowledgeSourceRef[]) for a benefit claim; reviewed_at is
    // the explicit human sign-off timestamp. Seeds never write reviewed_at —
    // only the sign-off gate (npm run knowledge:signoff) may set it (Rule KC9).
    // Idempotent — safe to re-run. No existing row's meaning changes: both
    // columns default to "unsourced / not signed off", which is the honest
    // description of every pre-existing row.
    id: "2026-07-03_pkc0_claim_trust_columns",
    statements: [
      `ALTER TABLE knowledge_food_benefits ADD COLUMN IF NOT EXISTS source_refs JSONB NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE knowledge_food_benefits ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ`,
      `ALTER TABLE knowledge_nutrient_benefits ADD COLUMN IF NOT EXISTS source_refs JSONB NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE knowledge_nutrient_benefits ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ`,
    ],
  },

  {
    // OBS1 — Observation Engine (canonical platform telemetry). One durable,
    // bounded-retention store of runtime observations across the Intelligence
    // Platform. Sole owner: server/intelligence/observation/observation-store.ts.
    // Additive only; supersedes the never-created platform_turn_outcomes design
    // (EWO-PRO1), whose store is retired by OBS1 rather than completed, so the
    // platform has exactly one telemetry system.
    id: "2026-07-08_platform_observations",
    statements: [
      `CREATE TABLE IF NOT EXISTS platform_observations (
        id            SERIAL PRIMARY KEY,
        observed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        kind          TEXT NOT NULL,
        severity      TEXT NOT NULL DEFAULT 'info',
        outcome       TEXT,
        user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id    TEXT,
        surface       TEXT,
        capability    TEXT,
        verb          TEXT,
        intent        TEXT,
        context_view  TEXT,
        confidence    REAL,
        duration_ms   INTEGER,
        recovery_path TEXT,
        metadata      JSONB NOT NULL DEFAULT '{}'::jsonb
      )`,
      `CREATE INDEX IF NOT EXISTS platform_observations_observed_at_idx ON platform_observations (observed_at)`,
      `CREATE INDEX IF NOT EXISTS platform_observations_kind_observed_at_idx ON platform_observations (kind, observed_at)`,
      `CREATE INDEX IF NOT EXISTS platform_observations_capability_idx ON platform_observations (capability)`,
      `CREATE INDEX IF NOT EXISTS platform_observations_session_idx ON platform_observations (session_id)`,
    ],
  },

  // KNOW1 — retire the `live-yogurt` duplicate WS0 knowledge food.
  //
  // `seed-knowledge-registry.ts` is an idempotent, additive-only UPSERT with no
  // delete path, so removing `live-yogurt` from FOOD_SEED does not remove a row
  // already seeded into an environment. This statement does, and cascades to that
  // food's `knowledge_food_nutrients` / `knowledge_food_benefits` rows via the
  // existing ON DELETE CASCADE foreign keys (shared/schema.ts). It is a no-op where
  // the row never existed, and a real cleanup where it did.
  //
  // Safe to run before or after re-seeding: canonical Yoghurt now points at the
  // `yoghurt` knowledge food, which this statement does not touch.
  {
    id: "2026-07-09_know1_retire_live_yogurt_duplicate",
    statements: [
      `DELETE FROM knowledge_foods WHERE slug = 'live-yogurt'`,
    ],
  },

  // TRUST1-S5 — authentication rate limiting.
  //
  // The shared counter behind every authentication rate limit. It lives in Postgres, not in a
  // process, because THA deploys to Render `autoscale` (multiple instances) and an in-memory
  // counter would make the real limit N × the configured one — silently, and differently on every
  // deploy. Every instance shares this table, so the configured limit is the actual limit.
  //
  // `key` is an HMAC-SHA256 of the IP or the email address under SESSION_SECRET, never the value
  // itself. There is deliberately NO personal data in this table: an IP address is personal data
  // under UK GDPR, and building a plaintext record of who-tried-to-log-in-from-where inside the
  // programme that is removing personal data from the logs (TRUST1-P8) would be an own goal.
  //
  // Rows are ephemeral operational state, not records. They expire on their own, the store prunes
  // them opportunistically, and rotating SESSION_SECRET orphans every one of them — all three are
  // fine and none of them lose anything anyone needs.
  {
    id: "2026-07-11_trust1_s5_auth_rate_limits",
    statements: [
      `CREATE TABLE IF NOT EXISTS auth_rate_limits (
         key        TEXT PRIMARY KEY,
         hits       INTEGER NOT NULL DEFAULT 0,
         expires_at TIMESTAMPTZ NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
      // The pruner's only access path.
      `CREATE INDEX IF NOT EXISTS auth_rate_limits_expires_at_idx ON auth_rate_limits (expires_at)`,
    ],
  },

  {
    // CBK1 — The founding cookbook's canonical identity, enforced.
    //
    // `acquisition_source_key` ("tha_original:THA-###") is the identity of a THA founding recipe
    // and the idempotency key the canonical seeder reconciles on. Until now nothing stopped the
    // same recipe existing twice: the seeder simply took care not to do it, and a duplicate would
    // have been a silent, permanent, globally-visible defect (system meals are shown to every
    // user). "One canonical identity per entity" was declared and unenforced.
    //
    // The index is deliberately narrow — the founding cookbook's key space only. Other system
    // meals (the ready-meal seed) carry a NULL key, and user meals may legitimately share an
    // acquisition key with one another; neither is constrained here.
    id: "2026-07-11_cbk1_cookbook_canonical_identity",
    statements: [
      `CREATE UNIQUE INDEX IF NOT EXISTS meals_tha_original_source_key_uniq
         ON meals (acquisition_source_key)
         WHERE is_system_meal = true AND acquisition_source_key LIKE 'tha_original:%'`,
    ],
  },

  {
    // PHASE5A — Preparation Knowledge (builds WS5A; PKCA §7 Phase 4).
    //
    // "The same food. A different thing done to it. Nutrition only changes if the
    //  evidence says so."
    //
    // Three tables, and the split between them is the whole design:
    //
    //   knowledge_preparations        the catalogue. A reference vocabulary beside
    //                                 the spine (Principle 5) — raw, frozen, roasted,
    //                                 smoked, ground. Shared across foods.
    //
    //   knowledge_food_preparations   EXISTENCE. "People eat this food this way."
    //                                 Cheap, editorial, ALWAYS allowed, and carrying
    //                                 NO evidence columns on purpose: requiring a
    //                                 citation to state that boiled eggs exist would
    //                                 be evidence theatre, and it would gate the MVF
    //                                 bar behind enrichment that Rule KC6 says may
    //                                 never gate it.
    //
    //   knowledge_preparation_effects EFFECT. "This preparation measurably CHANGES
    //                                 something." Expensive, rare, and gated by the
    //                                 SAME Layer-2 contract as every benefit chip:
    //                                 source_refs + reviewed_at + reviewed_by,
    //                                 checked at render by isEvidenceBackedClaim().
    //                                 No new evidence vocabulary, no second lifecycle
    //                                 (Rule KC1). This table starts EMPTY and the
    //                                 seeder never writes it — an effect is authored
    //                                 through the review workflow and signed off by a
    //                                 named human (Rule KC9: automation authors
    //                                 candidates, it never publishes them).
    //
    // Additive only. Nothing is dropped, no column is altered, and no existing read
    // changes: a surface that ignores preparations behaves exactly as it did.
    id: "2026-07-11_phase5a_preparation_knowledge",
    statements: [
      `CREATE TABLE IF NOT EXISTS knowledge_preparations (
         id            SERIAL PRIMARY KEY,
         slug          TEXT NOT NULL UNIQUE,
         name          TEXT NOT NULL,
         prep_type     TEXT NOT NULL,
         description   TEXT,
         family        TEXT,
         source        TEXT NOT NULL DEFAULT 'THA editorial',
         display_order INTEGER NOT NULL DEFAULT 0,
         is_active     BOOLEAN NOT NULL DEFAULT TRUE,
         created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,

      // Existence. No evidence columns, deliberately (see above).
      `CREATE TABLE IF NOT EXISTS knowledge_food_preparations (
         id               SERIAL PRIMARY KEY,
         food_slug        TEXT NOT NULL REFERENCES knowledge_foods(slug) ON DELETE CASCADE,
         preparation_slug TEXT NOT NULL REFERENCES knowledge_preparations(slug) ON DELETE CASCADE,
         ranking          INTEGER NOT NULL DEFAULT 0,
         source           TEXT NOT NULL DEFAULT 'THA editorial',
         is_active        BOOLEAN NOT NULL DEFAULT TRUE,
         created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         CONSTRAINT uq_knowledge_food_preparation UNIQUE (food_slug, preparation_slug)
       )`,
      `CREATE INDEX IF NOT EXISTS knowledge_food_preparations_food_idx
         ON knowledge_food_preparations (food_slug)`,

      // Effect. Same Layer-2 shape as knowledge_food_benefits — source_refs
      // (Layer-1 validated), reviewed_at (the human gate), reviewed_by (who is
      // accountable). Both review columns are NULLABLE and start NULL, which is
      // the truthful state: nothing has been signed off, so nothing speaks.
      `CREATE TABLE IF NOT EXISTS knowledge_preparation_effects (
         id               SERIAL PRIMARY KEY,
         food_slug        TEXT NOT NULL REFERENCES knowledge_foods(slug) ON DELETE CASCADE,
         preparation_slug TEXT NOT NULL REFERENCES knowledge_preparations(slug) ON DELETE CASCADE,
         effect_kind      TEXT NOT NULL,
         target_slug      TEXT,
         direction        TEXT NOT NULL,
         approved_wording TEXT NOT NULL,
         uncertainty_note TEXT,
         source           TEXT NOT NULL DEFAULT 'THA editorial',
         source_refs      JSONB NOT NULL DEFAULT '[]'::jsonb,
         reviewed_at      TIMESTAMPTZ,
         reviewed_by      TEXT,
         is_active        BOOLEAN NOT NULL DEFAULT TRUE,
         created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         CONSTRAINT uq_knowledge_preparation_effect
           UNIQUE (food_slug, preparation_slug, effect_kind, target_slug)
       )`,
      `CREATE INDEX IF NOT EXISTS knowledge_preparation_effects_food_idx
         ON knowledge_preparation_effects (food_slug)`,
    ],
  },

  {
    // PUB1 — the canonical_food projection catches up with its owner.
    //
    // CANONICAL_SEED declares six columns that `canonical_food` does not have, so
    // `npm run seed:canonical` — the domain's ONE authorised writer — could not run
    // at all: Postgres rejected the INSERT with `column "family" does not exist`.
    // That is why the projection has sat at 53 of 312 foods since WS2A. A publication
    // path that cannot execute is not a slow publication; it is an absent one, and it
    // failed silently because nothing reads the table (CPI1 §4.3, S2-5).
    //
    // The six columns were added to shared/schema.ts by NK6R (`family`), WS0X.5 (the
    // four food-context columns) and M4.5 (`fermented`) — each declared by its owner,
    // none of them ever given a migration. They reach the database here, through the
    // one sanctioned DDL path (schema-push-guard.ts: "Production schema changes happen
    // in exactly ONE way: a reviewed migration appended to server/migrations/runner.ts").
    //
    // Additive and nullable-or-defaulted throughout. Nothing is dropped, no column is
    // altered, and no existing read changes: every one of these columns is unread by
    // any runtime path today (identity resolves against the seed, per CPI1's trace),
    // so the migration is behaviour-neutral on its own. It is the seed run that
    // follows which publishes the data.
    //
    // NOT NULL + DEFAULT on the array and boolean columns matches the owner's
    // declaration exactly (schema.ts:2258, 2262, 2270). Adding them with a default is
    // safe on an existing table — Postgres 11+ rewrites no rows.
    id: "2026-07-14_pub1_canonical_food_projection_columns",
    statements: [
      // NK6R — parent canonical identity (stilton → blue-cheese → cheese). Nullable:
      // null means the food is top-level, which is the common case.
      `ALTER TABLE canonical_food ADD COLUMN IF NOT EXISTS family TEXT`,
      // WS0X.5 — food context. The single owner of food-intrinsic availability,
      // seasonality and origin.
      `ALTER TABLE canonical_food ADD COLUMN IF NOT EXISTS availability TEXT`,
      `ALTER TABLE canonical_food ADD COLUMN IF NOT EXISTS availability_modifiers TEXT[] NOT NULL DEFAULT '{}'`,
      `ALTER TABLE canonical_food ADD COLUMN IF NOT EXISTS peak_seasons TEXT[] NOT NULL DEFAULT '{}'`,
      `ALTER TABLE canonical_food ADD COLUMN IF NOT EXISTS origin_region TEXT`,
      // M4.5 — fermentation status.
      `ALTER TABLE canonical_food ADD COLUMN IF NOT EXISTS fermented BOOLEAN NOT NULL DEFAULT FALSE`,
    ],
  },

  {
    // RM3 — retire the duplicate ready-meal product representation.
    //
    // `meal_template_products` was a second, denormalized product representation
    // (product_name/store/price/upf/barcode per template) with NO live consumer: its
    // only reader was `meal-resolution-service.ts` behind POST /api/meal-templates/:id/resolve,
    // which the client never called, and its only writer was the orphaned Analyser
    // "Link to template" flow. RM1 (§3.3, §8) identified it as the store to converge
    // away under Principle 8; a ready meal is a `meals` row you buy instead of cook.
    //
    // Safe: the table has no inbound foreign keys and no live reader/writer remains in
    // the code after RM3. DROP IF EXISTS is idempotent. No generic ready meals are
    // migrated — none were ever stored here as canonical identities.
    id: "2026-07-15_rm3_retire_meal_template_products",
    statements: [
      `DROP TABLE IF EXISTS meal_template_products`,
    ],
  },

  {
    // SEC2 + SEC3 — the two auth token expiry columns become TIMESTAMPTZ, matching
    // the 99 other timestamp columns in the schema and their own declarations.
    //
    // These are INSTANT values: a token expires at a point on the timeline, and that
    // point does not move because a household — or a server — is somewhere else. A
    // naive column has no such point. It holds a wall-clock reading whose meaning is
    // supplied by whichever process reads it, so the expiry drifts by the process's
    // UTC offset: early is a lockout, late is an extended window on a password-reset
    // token. Both columns have been naive since they were created, and the platform's
    // containers default to UTC — which is why nothing has gone wrong yet. That is a
    // deployment accident, not a control.
    //
    // WHY THE 2026-02-27 MIGRATION DID NOT ALREADY DO THIS. It tried:
    //   "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ"
    // It is recorded as applied. It did nothing, because `drizzle-kit push` had already
    // created the column from shared/schema.ts as naive, and ADD COLUMN IF NOT EXISTS
    // silently succeeds against an existing column of the wrong type. So the physical
    // type of a security-token column is decided by whether push or the migration
    // reached the database first, and it can differ between environments with nothing
    // to detect it.
    //
    // WHY THE GUARD IS NOT DECORATION. In an environment where the migration won that
    // race, the column is ALREADY timestamptz — and `x AT TIME ZONE 'UTC'` on a
    // timestamptz returns a NAIVE timestamp, which would then be re-cast using the
    // session zone and silently shift every live token. The conditional makes this
    // migration correct in both environments: convert only what is still naive.
    //
    // WHY 'UTC' IS THE RIGHT READING. The values already in these columns were written
    // by node-postgres from a JS Date under a UTC process, so the stored wall-clock IS
    // UTC. Verified empirically before writing this. The explicit `AT TIME ZONE 'UTC'`
    // does not rely on the session TimeZone, so the result does not depend on who runs it.
    id: "2026-07-16_sec23_auth_token_expiry_timestamptz",
    statements: [
      `DO $$
       BEGIN
         IF EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'users'
             AND column_name = 'password_reset_expires'
             AND data_type = 'timestamp without time zone'
         ) THEN
           ALTER TABLE users
             ALTER COLUMN password_reset_expires TYPE TIMESTAMPTZ
             USING password_reset_expires AT TIME ZONE 'UTC';
         END IF;
       END $$`,
      `DO $$
       BEGIN
         IF EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'users'
             AND column_name = 'email_verification_expires'
             AND data_type = 'timestamp without time zone'
         ) THEN
           ALTER TABLE users
             ALTER COLUMN email_verification_expires TYPE TIMESTAMPTZ
             USING email_verification_expires AT TIME ZONE 'UTC';
         END IF;
       END $$`,
    ],
  },

  {
    // CONV1 P4 / WRITE-3 — household_eaters membership integrity.
    //
    // `syncMembersAsEaters` was a read-then-insert inside GET /api/household/eaters:
    // a write during a GET, racing itself, into a table with no uniqueness guard —
    // concurrent GETs could duplicate an adult. Creation now happens at the four
    // membership events (createUser / joinHousehold / leaveHousehold /
    // removeHouseholdMember), guarded by the partial unique index this migration adds.
    //
    // Order inside this migration matters: existing duplicates must be merged before
    // the index can be created. Duplicate rows are folded into the lowest id — their
    // planner references are repointed, their diet arrays unioned — so no household
    // loses a declaration or a planner selection.
    id: "2026-07-16_conv1_p4_household_eaters_integrity",
    statements: [
      // 1a. Repoint planner entry selections from duplicate eater rows to the keeper,
      //     unless the keeper is already selected on that entry.
      `UPDATE planner_entry_eaters pee
       SET household_eater_id = d.keeper
       FROM (
         SELECT id, min(id) OVER (PARTITION BY household_id, user_id) AS keeper
         FROM household_eaters WHERE user_id IS NOT NULL
       ) d
       WHERE pee.household_eater_id = d.id
         AND d.id <> d.keeper
         AND NOT EXISTS (
           SELECT 1 FROM planner_entry_eaters p2
           WHERE p2.entry_id = pee.entry_id AND p2.household_eater_id = d.keeper
         )`,
      // 1b. Any selection still pointing at a duplicate collides with an existing
      //     keeper selection on the same entry — the selection survives via the keeper.
      `DELETE FROM planner_entry_eaters pee
       USING (
         SELECT id, min(id) OVER (PARTITION BY household_id, user_id) AS keeper
         FROM household_eaters WHERE user_id IS NOT NULL
       ) d
       WHERE pee.household_eater_id = d.id AND d.id <> d.keeper`,
      // 1c/1d. Same two steps for weekly diet overrides.
      `UPDATE planner_week_eater_overrides pweo
       SET eater_id = d.keeper
       FROM (
         SELECT id, min(id) OVER (PARTITION BY household_id, user_id) AS keeper
         FROM household_eaters WHERE user_id IS NOT NULL
       ) d
       WHERE pweo.eater_id = d.id
         AND d.id <> d.keeper
         AND NOT EXISTS (
           SELECT 1 FROM planner_week_eater_overrides p2
           WHERE p2.week_id = pweo.week_id AND p2.eater_id = d.keeper
         )`,
      `DELETE FROM planner_week_eater_overrides pweo
       USING (
         SELECT id, min(id) OVER (PARTITION BY household_id, user_id) AS keeper
         FROM household_eaters WHERE user_id IS NOT NULL
       ) d
       WHERE pweo.eater_id = d.id AND d.id <> d.keeper`,
      // 1e. Union duplicate rows' diet arrays into the keeper (first-occurrence order).
      `UPDATE household_eaters k
       SET default_diet_types = (
             SELECT COALESCE(array_agg(v ORDER BY ord), '{}')
             FROM (
               SELECT v, min(ord) AS ord
               FROM unnest(COALESCE(k.default_diet_types, '{}') || COALESCE(agg.diet_types, '{}'))
                 WITH ORDINALITY AS t(v, ord)
               GROUP BY v
             ) s
           ),
           hard_restrictions = (
             SELECT COALESCE(array_agg(v ORDER BY ord), '{}')
             FROM (
               SELECT v, min(ord) AS ord
               FROM unnest(COALESCE(k.hard_restrictions, '{}') || COALESCE(agg.restrictions, '{}'))
                 WITH ORDINALITY AS t(v, ord)
               GROUP BY v
             ) s
           )
       FROM (
         SELECT min(id) AS keeper,
                (SELECT COALESCE(array_agg(v), '{}') FROM (
                   SELECT DISTINCT unnest(COALESCE(dd.default_diet_types, '{}')) AS v
                   FROM household_eaters dd
                   WHERE dd.household_id = he.household_id AND dd.user_id = he.user_id
                 ) x) AS diet_types,
                (SELECT COALESCE(array_agg(v), '{}') FROM (
                   SELECT DISTINCT unnest(COALESCE(dd.hard_restrictions, '{}')) AS v
                   FROM household_eaters dd
                   WHERE dd.household_id = he.household_id AND dd.user_id = he.user_id
                 ) x) AS restrictions
         FROM household_eaters he
         WHERE he.user_id IS NOT NULL
         GROUP BY he.household_id, he.user_id
         HAVING count(*) > 1
       ) agg
       WHERE k.id = agg.keeper`,
      // 1f. Delete the duplicates.
      `DELETE FROM household_eaters he
       USING (
         SELECT id, min(id) OVER (PARTITION BY household_id, user_id) AS keeper
         FROM household_eaters WHERE user_id IS NOT NULL
       ) d
       WHERE he.id = d.id AND d.id <> d.keeper`,
      // 2. The guard that makes the race impossible.
      `CREATE UNIQUE INDEX IF NOT EXISTS household_eaters_household_user_uniq
         ON household_eaters (household_id, user_id)
         WHERE user_id IS NOT NULL`,
      // 3. Backfill: every ACTIVE member has an eater row from now on — creation is a
      //    membership event, no longer a side effect of loading a page.
      `INSERT INTO household_eaters (household_id, display_name, user_id, default_diet_types, hard_restrictions)
       SELECT hm.household_id, COALESCE(u.display_name, u.username), hm.user_id, '{}', '{}'
       FROM household_members hm
       JOIN users u ON u.id = hm.user_id
       WHERE hm.status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM household_eaters he
           WHERE he.household_id = hm.household_id AND he.user_id = hm.user_id
         )`,
    ],
  },

  {
    // CONV1 P4 / WRITE-2 — the diet fact moves to its declared owner.
    //
    // ARCHITECTURE_PRINCIPLES.md Principle 2 (2026-06-25) and Register Domain 16 name
    // `household_eaters` the owner of a person's diet; `users.diet_pattern` /
    // `users.diet_restrictions` are a redundant shadow ordered retired (OWN-1). This
    // migration copies every ACTIVE member's declared diet onto their eater row:
    //
    //   default_diet_types := dedupe( pattern-head ∥ existing ∥ user_preferences.diet_types )
    //   hard_restrictions  := dedupe( users.diet_restrictions ∥ existing )
    //
    // The pattern head goes FIRST: the canonical diet type of `users.diet_pattern`
    // (its lowercase form for the ten canonical patterns, the raw value otherwise), so
    // the requester's derived diet pattern after the move equals the pattern before it
    // — the safety gate must not weaken. Departed memberships are NOT copied: a former
    // household has no claim on a person's current declarations (SEC-1).
    id: "2026-07-16_conv1_p4_move_diet_to_household_eaters",
    statements: [
      `UPDATE household_eaters he
       SET default_diet_types = (
             SELECT COALESCE(array_agg(v ORDER BY ord), '{}')
             FROM (
               SELECT v, min(ord) AS ord
               FROM unnest(
                 CASE
                   WHEN u.diet_pattern IS NULL THEN '{}'::text[]
                   WHEN lower(u.diet_pattern) IN ('vegan','vegetarian','flexitarian','keto','low-carb','paleo','carnivore','mediterranean','dash','mind')
                     THEN ARRAY[lower(u.diet_pattern)]
                   ELSE ARRAY[u.diet_pattern]
                 END
                 || COALESCE(he.default_diet_types, '{}')
                 || COALESCE(up.diet_types, '{}')
               ) WITH ORDINALITY AS t(v, ord)
               GROUP BY v
             ) s
           ),
           hard_restrictions = (
             SELECT COALESCE(array_agg(v ORDER BY ord), '{}')
             FROM (
               SELECT v, min(ord) AS ord
               FROM unnest(
                 COALESCE(u.diet_restrictions, '{}') || COALESCE(he.hard_restrictions, '{}')
               ) WITH ORDINALITY AS t(v, ord)
               GROUP BY v
             ) s
           )
       FROM users u
       JOIN household_members hm
         ON hm.user_id = u.id AND hm.status = 'active'
       LEFT JOIN user_preferences up ON up.user_id = u.id
       WHERE he.user_id = u.id
         AND he.household_id = hm.household_id`,
    ],
  },

  {
    // CONV1 P4 / OWN-1 — retire the shadow columns.
    //
    // The DROP is gated: if any ACTIVE member's declared restrictions or diet pattern
    // is not already present on their eater row, the migration REFUSES rather than
    // dropping. "The migration moves live allergens — not one may be lost"
    // (PEOPLE1 § 9.2 constraint 1). A raised exception aborts this migration's
    // transaction, so the columns survive for diagnosis.
    id: "2026-07-16_conv1_p4_retire_users_diet_columns",
    statements: [
      `DO $$
       DECLARE bad integer;
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'users' AND column_name = 'diet_pattern'
         ) THEN
           RETURN; -- already retired
         END IF;
         SELECT count(*) INTO bad
         FROM users u
         JOIN household_members hm ON hm.user_id = u.id AND hm.status = 'active'
         LEFT JOIN household_eaters he
           ON he.household_id = hm.household_id AND he.user_id = u.id
         WHERE (
                 u.diet_restrictions IS NOT NULL
             AND cardinality(u.diet_restrictions) > 0
             AND (he.id IS NULL OR NOT (COALESCE(he.hard_restrictions, '{}') @> u.diet_restrictions))
               )
            OR (
                 u.diet_pattern IS NOT NULL
             AND (he.id IS NULL OR NOT (COALESCE(he.default_diet_types, '{}') && ARRAY[lower(u.diet_pattern), u.diet_pattern]))
               );
         IF bad > 0 THEN
           RAISE EXCEPTION 'CONV1-P4/OWN-1 refused: % active member(s) hold diet facts not yet present on their eater row. Not one allergen may be lost (PEOPLE1 §9.2).', bad;
         END IF;
       END $$`,
      `ALTER TABLE users DROP COLUMN IF EXISTS diet_pattern`,
      `ALTER TABLE users DROP COLUMN IF EXISTS diet_restrictions`,
    ],
  },

  // CONV1 P5 / SCH-1 — households.timeZone (TIME3 Phase 2, the zone).
  //
  // Additive and nullable. NO ROW IS REWRITTEN and there is NO BACK-FILL: a NULL
  // zone means "THA has not been told where this household lives", which is an
  // honest gap and the truth for every household that exists today. Defaulting it
  // in SQL would manufacture a fact indistinguishable from one the household
  // stated — the exact shape CP8 and Core Principle 6 forbid. THA's declared
  // default (Europe/London, with its provenance) lives in
  // shared/time/household-time.ts and is applied at READ time by consumers, never
  // written here.
  //
  // No consumer converges in this migration or this phase: that is Phase 3
  // (CONV1 P6). This lands the fact so that the seven of twelve consumers that
  // need only the zone HAVE one to read.
  {
    id: "2026-07-17_conv1_p5_household_time_zone",
    statements: [
      `ALTER TABLE households ADD COLUMN IF NOT EXISTS time_zone text`,
    ],
  },

  // CONV1 P7 / SCH-2 — planner_weeks.weekStartDate (TIME3 Phase 4, THE ANCHOR).
  //
  // Additive and nullable. NO ROW IS REWRITTEN. THERE IS NO BACK-FILL — NOT NOW, NOT EVER.
  //
  // ── THIS COMMENT IS THE MITIGATION, AND IT IS LOAD-BEARING (CONV1 R5) ──────────
  // The column is trivial to add. The danger is not the ALTER: it is the next person
  // who sees several hundred NULLs, reads them as a bug, and writes the one-line
  // UPDATE that "fixes" them. That UPDATE is the single most damaging change anyone
  // could make to this schema, and it would look like housekeeping.
  //
  // DO NOT WRITE IT. Here is why, in the architecture's own terms:
  //
  //   • HT7 is absolute: the anchor is written ONLY at creation and NEVER back-filled.
  //     The only moment THA can honestly know which calendar week a planner slot means
  //     is the moment the slot is created (TIME1 § 6.2). That moment has passed for
  //     every row this migration touches. It cannot be recovered afterwards.
  //   • THA cannot know which calendar week a household's existing Week 3 meant.
  //     `weekNumber` is a slot label in a fixed rota, not a time coordinate (TIME1 § 3.1):
  //     all six weeks are created eagerly at first touch, and nothing has ever made them
  //     calendar-consecutive. A household whose Week 1 is w/c 20 July and whose Week 2 is
  //     w/c 3 August — because they skipped a week — is a household this column can
  //     represent and no back-fill could ever reconstruct.
  //   • A back-filled anchor is `approxDate` with a schema (CONV1 R5). It would be
  //     INDISTINGUISHABLE from one the household actually meant, which is precisely what
  //     makes it worse than an absent one — and `approxDate` is the fabrication this
  //     whole architecture exists to retire (TIME1 § 3.3; CONV1 P9).
  //   • NULL IS NOT A BUG; IT IS THE ANSWER. `resolvePlannerWeek` returns
  //     `{ anchored: false, reason: "no-anchor" }` and every consumer keeps exactly its
  //     current behaviour (HT6 — totality IS the compatibility strategy). Nothing is
  //     broken by these NULLs. Something WOULD be broken by filling them.
  //   • Core Principle 6 — honest gaps over invented facts.
  //
  // The ONLY legitimate route to anchoring an existing week is the household DECLARING
  // it — an explicit, offered, never-forced confirmation ("Is this week beginning Monday
  // 20 July?"). That is an extension point (TIME1 § 6.2), deliberately not built here.
  // A declared anchor is a fact. An inferred one is fabrication.
  //
  // A gate enforces this rather than trusting the comment: `verify:publication`, domain
  // `household-time`, check `ht-anchor-is-never-back-filled` — it fails if this migration
  // list ever learns to UPDATE this column (CP10: a convergence is finished when a gate
  // can fail).
  //
  // No consumer converges in this migration or this phase — that is Phase 5 (CONV1 P8).
  // This lands the fact so that the five rival "current weeks" HAVE something to read.
  {
    id: "2026-07-17_conv1_p7_planner_week_anchor",
    statements: [
      `ALTER TABLE planner_weeks ADD COLUMN IF NOT EXISTS week_start_date text`,
    ],
  },

  // ─── BUS1 — Trust & Compliance ─────────────────────────────────────────────
  //
  // Three tables, declared together in shared/schema.ts under the same heading.
  // Governing architecture: docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md
  //
  // All three are ADDITIVE. Nothing here alters, drops, or rewrites an existing
  // table or row, so this migration is a no-op on every existing household.
  //
  // Note the deliberate FK asymmetry, which is the whole compliance design and
  // not an inconsistency to be tidied up later:
  //
  //   user_consents.user_id        → ON DELETE SET NULL. The row must OUTLIVE the
  //                                  account (Art. 7(1) — THA must be able to show
  //                                  consent was obtained for processing that has
  //                                  already happened), while identifying nobody.
  //   support_requests.user_id     → ON DELETE SET NULL, same reasoning: proof a
  //                                  data-subject request was answered.
  //   privacy_activity_log.user_id → NO FOREIGN KEY AT ALL. A FK would either
  //                                  block the erasure or cascade the evidence of
  //                                  it away with the account. This row exists
  //                                  precisely to prove the erasure happened, so
  //                                  it must survive the row it refers to.
  //
  // Every statement is idempotent (IF NOT EXISTS), per the runner's rule 4.
  {
    id: "2026-07-18_bus1_trust_and_compliance",
    statements: [
      `CREATE TABLE IF NOT EXISTS user_consents (
         id SERIAL PRIMARY KEY,
         user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
         consent_type TEXT NOT NULL,
         granted BOOLEAN NOT NULL,
         document_slug TEXT,
         document_version TEXT,
         source TEXT NOT NULL,
         recorded_ip TEXT,
         recorded_user_agent TEXT,
         recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS user_consents_user_id_idx ON user_consents (user_id)`,
      `CREATE INDEX IF NOT EXISTS user_consents_lookup_idx ON user_consents (user_id, consent_type, recorded_at)`,

      `CREATE TABLE IF NOT EXISTS support_requests (
         id SERIAL PRIMARY KEY,
         user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
         kind TEXT NOT NULL,
         subject TEXT NOT NULL,
         body TEXT NOT NULL,
         context_path TEXT,
         contact_email TEXT,
         status TEXT NOT NULL DEFAULT 'new',
         internal_note TEXT,
         resolved_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
         resolved_at TIMESTAMPTZ,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS support_requests_user_id_idx ON support_requests (user_id)`,
      `CREATE INDEX IF NOT EXISTS support_requests_status_idx ON support_requests (status, created_at)`,
      `CREATE INDEX IF NOT EXISTS support_requests_kind_idx ON support_requests (kind)`,

      `CREATE TABLE IF NOT EXISTS privacy_activity_log (
         id SERIAL PRIMARY KEY,
         user_id INTEGER,
         action TEXT NOT NULL,
         detail JSONB,
         occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS privacy_activity_log_action_idx ON privacy_activity_log (action, occurred_at)`,
      `CREATE INDEX IF NOT EXISTS privacy_activity_log_user_id_idx ON privacy_activity_log (user_id)`,

      // The ONE statement in BUS1 that alters an existing table, and it is here
      // because Article 17 was otherwise unsatisfiable for an entire class of
      // account.
      //
      // `admin_audit_log.admin_user_id` is a foreign key to users.id with no ON
      // DELETE action AND a NOT NULL constraint. Together those meant Postgres
      // REFUSED to delete any operator account that had ever performed an
      // audited action — so a staff member exercising their right to erasure
      // could not be honoured at all, by anyone, at any point in the platform's
      // history.
      //
      // Dropping NOT NULL lets the erasure service null the actor while keeping
      // the audit row. Deleting the rows instead was rejected: an audit log that
      // can be erased on request is not an audit log, and this one records who
      // approved the platform's food and knowledge decisions.
      //
      // Safe and backward compatible: dropping a NOT NULL constraint invalidates
      // no existing row and no existing INSERT — every current writer supplies
      // the column.
      `ALTER TABLE admin_audit_log ALTER COLUMN admin_user_id DROP NOT NULL`,
    ],
  },

  // ─── BUS2A — Commercial Platform Foundation ───────────────────────────────
  //
  // Creates the two tables of the commercial domain. Creates NOTHING ELSE: no
  // column is added to `users`, no constraint is altered, and no existing row
  // is touched or read. BUS2A activates no subscription and processes no
  // payment, so both tables are created EMPTY and stay empty until BUS2B.
  //
  // `users.subscription_tier` — the pre-BUS2A owner of Domain 26 — is
  // deliberately left exactly as it is, including its CHECK constraint at
  // migration `2026-02-28_add_roles_and_subscriptions`. It remains the live
  // owner and the entitlement resolver's last-resort input. Its retirement
  // condition is stated in shared/commerce/entitlements.ts and belongs to
  // BUS2B; dropping it here would take premium access away from every
  // household that has it, in a change that ships no way to give it back.
  {
    id: "2026-07-18_bus2a_commercial_foundation",
    statements: [
      `CREATE TABLE IF NOT EXISTS subscriptions (
         id SERIAL PRIMARY KEY,
         user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
         household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
         plan_id TEXT NOT NULL,
         status TEXT NOT NULL,
         billing_period TEXT,
         trial_ends_at TIMESTAMPTZ,
         current_period_end TIMESTAMPTZ,
         cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
         pending_plan_id TEXT,
         past_due_since TIMESTAMPTZ,
         provider_customer_id TEXT,
         provider_subscription_id TEXT,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,

      // The same closed vocabularies the shared/commerce/ types declare, held
      // at the database too. A tier typo that reaches a gate is a household
      // silently losing access, and TypeScript does not run inside Postgres.
      `ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_check`,
      `ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_id_check
         CHECK (plan_id IN ('free','premium','friends_family'))`,
      `ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pending_plan_id_check`,
      `ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_pending_plan_id_check
         CHECK (pending_plan_id IS NULL OR pending_plan_id IN ('free','premium','friends_family'))`,
      `ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check`,
      `ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
         CHECK (status IN ('trialing','active','past_due','cancelled','expired','incomplete'))`,
      `ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_period_check`,
      `ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_billing_period_check
         CHECK (billing_period IS NULL OR billing_period IN ('monthly','annual'))`,

      `CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions (user_id)`,
      `CREATE INDEX IF NOT EXISTS subscriptions_household_id_idx ON subscriptions (household_id)`,
      // Nullable and unique: Postgres permits many NULLs in a unique index, so
      // this constrains real provider ids without requiring one to exist.
      `CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_provider_subscription_id_key
         ON subscriptions (provider_subscription_id)`,

      `CREATE TABLE IF NOT EXISTS billing_events (
         id SERIAL PRIMARY KEY,
         provider_event_id TEXT NOT NULL,
         kind TEXT NOT NULL,
         subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
         occurred_at TIMESTAMPTZ NOT NULL,
         received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         processed_at TIMESTAMPTZ,
         payload JSONB
       )`,

      `ALTER TABLE billing_events DROP CONSTRAINT IF EXISTS billing_events_kind_check`,
      `ALTER TABLE billing_events ADD CONSTRAINT billing_events_kind_check
         CHECK (kind IN ('trial-started','activated','renewed','payment-failed',
                         'payment-recovered','plan-changed','cancellation-scheduled',
                         'cancellation-revoked','ended'))`,

      // THE IDEMPOTENCY GUARANTEE, AND IT IS THIS LINE.
      //
      // Every payment provider redelivers webhooks — on timeout, on a non-2xx,
      // and on their own retry schedule — so a duplicate is the normal case.
      // Enforced here rather than in application code because application code
      // cannot win a race between two concurrent deliveries of the same event,
      // and the cost of losing it is a term extended for free or a paying
      // household cut off. BUS2B's ingest relies on this constraint by design:
      // it INSERTs and lets a conflict be the no-op.
      `CREATE UNIQUE INDEX IF NOT EXISTS billing_events_provider_event_id_key
         ON billing_events (provider_event_id)`,
      `CREATE INDEX IF NOT EXISTS billing_events_subscription_id_idx ON billing_events (subscription_id)`,
      `CREATE INDEX IF NOT EXISTS billing_events_occurred_at_idx ON billing_events (occurred_at)`,
    ],
  },

  {
    // KNOW2 — the terminal REJECTED state for a nutrition claim.
    //
    // KNOW5 gave every claim table `reviewed_at` + `reviewed_by`, and KNOW1 found
    // what those two columns could not say. `reviewed_at IS NULL` meant BOTH
    // "nobody has looked at this yet" AND "a qualified reviewer looked at this and
    // refused it", and no query could tell the two apart. A refused health claim
    // was therefore indistinguishable from an unexamined one: it came back to the
    // top of every future reviewer's queue forever, and the next reviewer — shown
    // no record of the refusal — could approve what a colleague had already
    // rejected, with nothing anywhere marking that it had happened.
    //
    // These columns are ADDITIVE and NULLABLE, and no row is back-filled. Every
    // existing claim keeps exactly the state it has: the 21 pre-KNOW5 sign-offs
    // stay approved, and the 3,299 uncited rows stay pending — which is the truth,
    // because none of them has been rejected by anyone. Inventing a rejection
    // would be the fabrication this architecture exists to prevent.
    //
    // The CHECK constraint is the load-bearing line. Approval and rejection are
    // mutually exclusive, and it is enforced in the database rather than in
    // application code because `reviewed_at` is what the Trust Gate reads: a row
    // holding both states would be a claim a human refused that renders to
    // households anyway, and TypeScript does not run inside Postgres.
    id: "2026-07-19_know2_claim_rejection_state",
    statements: [
      ...["knowledge_food_nutrients", "knowledge_food_benefits", "knowledge_nutrient_benefits", "knowledge_preparation_effects"].flatMap(
        (table) => [
          `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ`,
          `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS rejected_by TEXT`,
          `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS rejection_reason TEXT`,
          `ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${table}_review_exclusive_check`,
          `ALTER TABLE ${table} ADD CONSTRAINT ${table}_review_exclusive_check
             CHECK (reviewed_at IS NULL OR rejected_at IS NULL)`,
          // A rejection must name its reviewer and say why. An unexplained refusal
          // cannot be reviewed, appealed, or reversed — it is the rejection-side
          // twin of KNOW5's "a sign-off must name its reviewer".
          `ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${table}_rejection_attributed_check`,
          `ALTER TABLE ${table} ADD CONSTRAINT ${table}_rejection_attributed_check
             CHECK (rejected_at IS NULL OR (rejected_by IS NOT NULL AND btrim(COALESCE(rejection_reason, '')) <> ''))`,
          // The reviewer's worklist filters on this every time it loads.
          `CREATE INDEX IF NOT EXISTS ${table}_review_state_idx
             ON ${table} (reviewed_at, rejected_at) WHERE is_active`,
        ],
      ),
    ],
  },

  {
    // COMM1 — the Community Foundation. Three tables, one new domain (SoT D37),
    // sitting ABOVE Domain 16 and owning nothing Domain 16 owns.
    //
    // The membership grain is the HOUSEHOLD. `community_members.household_id`
    // references `households`, never `users` — a person reaches a community
    // through their household, so this schema creates no second user↔group
    // membership entity to drift from `household_members`.
    //
    // The two CHECK constraints are the load-bearing lines, and both are in the
    // database rather than in application code for the same reason KNOW2 gave:
    // TypeScript does not run inside Postgres, and these are the invariants that
    // decide whether a household is in a community or not.
    //
    //   1. A membership that has left must say when. The soft-departure shape is
    //      copied from `household_members` deliberately — SEC1 was caused by a
    //      read and a write disagreeing about who was at the table, and identical
    //      shapes let one predicate serve both.
    //   2. An invitation's terminal states are exclusive, and anything that is
    //      not pending must record when it stopped being pending. A row that is
    //      both accepted and revoked is a grant nobody can adjudicate.
    id: "2026-07-19_comm1_community_foundation",
    statements: [
      `CREATE TABLE IF NOT EXISTS communities (
         id SERIAL PRIMARY KEY,
         name TEXT NOT NULL,
         kind TEXT NOT NULL DEFAULT 'neighbourhood',
         created_by_household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
         status TEXT NOT NULL DEFAULT 'active',
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
      `ALTER TABLE communities DROP CONSTRAINT IF EXISTS communities_status_check`,
      `ALTER TABLE communities ADD CONSTRAINT communities_status_check
         CHECK (status IN ('active', 'archived'))`,

      `CREATE TABLE IF NOT EXISTS community_members (
         id SERIAL PRIMARY KEY,
         community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
         household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
         role TEXT NOT NULL DEFAULT 'member',
         status TEXT NOT NULL DEFAULT 'active',
         joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         invited_by_household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
         left_at TIMESTAMPTZ
       )`,
      `ALTER TABLE community_members DROP CONSTRAINT IF EXISTS community_members_community_household_unique`,
      `ALTER TABLE community_members ADD CONSTRAINT community_members_community_household_unique
         UNIQUE (community_id, household_id)`,
      `ALTER TABLE community_members DROP CONSTRAINT IF EXISTS community_members_role_check`,
      `ALTER TABLE community_members ADD CONSTRAINT community_members_role_check
         CHECK (role IN ('member', 'admin', 'owner'))`,
      // A departure must be dated. An undated "left" row cannot be audited and
      // cannot be distinguished from a write that half-completed.
      `ALTER TABLE community_members DROP CONSTRAINT IF EXISTS community_members_status_check`,
      `ALTER TABLE community_members ADD CONSTRAINT community_members_status_check
         CHECK (
           (status = 'active' AND left_at IS NULL)
           OR (status = 'left' AND left_at IS NOT NULL)
         )`,
      // Every membership read filters on this.
      `CREATE INDEX IF NOT EXISTS community_members_household_active_idx
         ON community_members (household_id) WHERE status = 'active'`,
      `CREATE INDEX IF NOT EXISTS community_members_community_active_idx
         ON community_members (community_id) WHERE status = 'active'`,

      `CREATE TABLE IF NOT EXISTS community_invitations (
         id SERIAL PRIMARY KEY,
         community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
         invited_household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
         invited_by_household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
         token TEXT NOT NULL,
         status TEXT NOT NULL DEFAULT 'pending',
         expires_at TIMESTAMPTZ NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         responded_at TIMESTAMPTZ
       )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS community_invitations_token_key
         ON community_invitations (token)`,
      `ALTER TABLE community_invitations DROP CONSTRAINT IF EXISTS community_invitations_status_check`,
      `ALTER TABLE community_invitations ADD CONSTRAINT community_invitations_status_check
         CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired'))`,
      // Terminal states are exclusive with pending, and a resolved invitation
      // must record when it resolved.
      `ALTER TABLE community_invitations DROP CONSTRAINT IF EXISTS community_invitations_responded_check`,
      `ALTER TABLE community_invitations ADD CONSTRAINT community_invitations_responded_check
         CHECK (
           (status = 'pending' AND responded_at IS NULL)
           OR (status <> 'pending' AND responded_at IS NOT NULL)
         )`,
      `CREATE INDEX IF NOT EXISTS community_invitations_community_idx
         ON community_invitations (community_id)`,
      `CREATE INDEX IF NOT EXISTS community_invitations_invited_household_idx
         ON community_invitations (invited_household_id)`,
      // The only invitation lookup that runs on every acceptance attempt.
      `CREATE INDEX IF NOT EXISTS community_invitations_pending_idx
         ON community_invitations (invited_household_id, status) WHERE status = 'pending'`,
    ],
  },

  {
    id: "2026-07-19_comm1a_invitation_and_referral",
    statements: [
      // ── household_invitations ────────────────────────────────────────────
      // An invitation addressed to an EMAIL, so it can reach someone who has no
      // account. Distinct from households.invite_code (a person joining a home)
      // and from community_invitations (two households that both already exist).
      `CREATE TABLE IF NOT EXISTS household_invitations (
         id SERIAL PRIMARY KEY,
         token TEXT NOT NULL,
         invited_by_household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
         invited_email TEXT NOT NULL,
         kind TEXT NOT NULL DEFAULT 'tha',
         community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
         status TEXT NOT NULL DEFAULT 'pending',
         expires_at TIMESTAMPTZ NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         responded_at TIMESTAMPTZ,
         accepted_by_household_id INTEGER REFERENCES households(id) ON DELETE SET NULL
       )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS household_invitations_token_key
         ON household_invitations (token)`,
      `ALTER TABLE household_invitations DROP CONSTRAINT IF EXISTS household_invitations_kind_check`,
      `ALTER TABLE household_invitations ADD CONSTRAINT household_invitations_kind_check
         CHECK (kind IN ('tha', 'community'))`,
      `ALTER TABLE household_invitations DROP CONSTRAINT IF EXISTS household_invitations_status_check`,
      `ALTER TABLE household_invitations ADD CONSTRAINT household_invitations_status_check
         CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired'))`,
      // A community invitation names a community; a THA invitation must not.
      // Without this, a 'tha' row could carry a community and acceptance would
      // silently join a neighbourhood nobody was invited to.
      `ALTER TABLE household_invitations DROP CONSTRAINT IF EXISTS household_invitations_community_check`,
      `ALTER TABLE household_invitations ADD CONSTRAINT household_invitations_community_check
         CHECK (
           (kind = 'community' AND community_id IS NOT NULL)
           OR (kind = 'tha' AND community_id IS NULL)
         )`,
      // A resolved invitation must record when it resolved (COMM1's rule, kept).
      `ALTER TABLE household_invitations DROP CONSTRAINT IF EXISTS household_invitations_responded_check`,
      `ALTER TABLE household_invitations ADD CONSTRAINT household_invitations_responded_check
         CHECK (
           (status = 'pending' AND responded_at IS NULL)
           OR (status <> 'pending' AND responded_at IS NOT NULL)
         )`,
      // An accepted invitation must say who accepted it, and one that was not
      // accepted must not claim anyone did.
      `ALTER TABLE household_invitations DROP CONSTRAINT IF EXISTS household_invitations_accepted_by_check`,
      `ALTER TABLE household_invitations ADD CONSTRAINT household_invitations_accepted_by_check
         CHECK (
           (status = 'accepted' AND accepted_by_household_id IS NOT NULL)
           OR (status <> 'accepted' AND accepted_by_household_id IS NULL)
         )`,
      `CREATE INDEX IF NOT EXISTS household_invitations_inviter_idx
         ON household_invitations (invited_by_household_id)`,
      `CREATE INDEX IF NOT EXISTS household_invitations_email_idx
         ON household_invitations (invited_email)`,
      `CREATE INDEX IF NOT EXISTS household_invitations_pending_idx
         ON household_invitations (invited_email, status) WHERE status = 'pending'`,

      // ── referral_attributions ────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS referral_attributions (
         id SERIAL PRIMARY KEY,
         referrer_household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
         referred_household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
         invitation_id INTEGER REFERENCES household_invitations(id) ON DELETE SET NULL,
         status TEXT NOT NULL DEFAULT 'recorded',
         recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         verified_at TIMESTAMPTZ,
         eligible_at TIMESTAMPTZ,
         entitlement_processed_at TIMESTAMPTZ
       )`,
      // THE LOAD-BEARING CONSTRAINT: a household is referred once, ever. Two
      // households cannot both claim the same referral, and a household cannot
      // be re-referred. In Postgres because this is the fact a future reward is
      // computed from, and application code is the wrong place to guard money.
      `CREATE UNIQUE INDEX IF NOT EXISTS referral_attributions_referred_key
         ON referral_attributions (referred_household_id)`,
      // A household cannot refer itself.
      `ALTER TABLE referral_attributions DROP CONSTRAINT IF EXISTS referral_attributions_not_self_check`,
      `ALTER TABLE referral_attributions ADD CONSTRAINT referral_attributions_not_self_check
         CHECK (referrer_household_id <> referred_household_id)`,
      `ALTER TABLE referral_attributions DROP CONSTRAINT IF EXISTS referral_attributions_status_check`,
      `ALTER TABLE referral_attributions ADD CONSTRAINT referral_attributions_status_check
         CHECK (status IN ('recorded', 'verified', 'eligible', 'entitlement_processed', 'void'))`,
      // THE STATUS LADDER, ENFORCED. Each rung requires the rung below it to
      // have happened, and to have recorded when. This is what makes "no reward
      // before verified eligibility" a property of the database rather than a
      // promise in a comment: a row cannot reach `eligible` without a
      // `verified_at`, and cannot reach `entitlement_processed` without an
      // `eligible_at` that the commercial owner had to set.
      `ALTER TABLE referral_attributions DROP CONSTRAINT IF EXISTS referral_attributions_ladder_check`,
      `ALTER TABLE referral_attributions ADD CONSTRAINT referral_attributions_ladder_check
         CHECK (
           (status = 'recorded' AND verified_at IS NULL AND eligible_at IS NULL AND entitlement_processed_at IS NULL)
           OR (status = 'verified' AND verified_at IS NOT NULL AND eligible_at IS NULL AND entitlement_processed_at IS NULL)
           OR (status = 'eligible' AND verified_at IS NOT NULL AND eligible_at IS NOT NULL AND entitlement_processed_at IS NULL)
           OR (status = 'entitlement_processed' AND verified_at IS NOT NULL AND eligible_at IS NOT NULL AND entitlement_processed_at IS NOT NULL)
           OR (status = 'void')
         )`,
      `CREATE INDEX IF NOT EXISTS referral_attributions_referrer_idx
         ON referral_attributions (referrer_household_id)`,
    ],
  },

  // ── FOUNDATION_MEALS3 Phase 1 — editorial retirement, not deletion ──────────
  //
  // FOUNDATION_MEALS2 § 2.1 classified 76 of the founding 500 as RETIRE: meals
  // whose DISH is wrong rather than whose text is wrong — salad vegetables
  // simmered until tender, rolled oats used as a savoury stew starch, and an
  // instruction that cannot be followed ("cook the wholegrain bread according
  // to the packet instructions"). No amount of editing rescues them; they would
  // have to be re-conceived, which means writing a new meal.
  //
  // The architecture had no way to say that. `meals` could hold a recipe or not
  // hold it, and `shared/cookbook/curation.ts` could shelve it or leave it on
  // the `library` shelf — but the library shelf is a browsing decision, and it
  // is enforced client-side, so a household could still reach an uncookable
  // recipe by searching for it. Deleting the rows was the other option and it
  // is the wrong one: eleven tables carry a bare `meal_id` with no foreign key,
  // so a delete orphans planner entries, basket items, freezer meals and
  // ingredient sources, and destroys the audit trail of what was withdrawn.
  //
  // So: two additive nullable columns, no backfill, no data destroyed. A
  // retired meal keeps its id, its provenance, its content and every reference
  // to it. What it loses is the right to be OFFERED — the collection-level
  // reads in `server/storage.ts` filter it out, and `shelfForMeal` returns the
  // `retired` shelf. `getMeal(id)` still resolves it, so a planner entry made
  // last week still renders.
  //
  // The CHECK is the load-bearing part: a reason without a retirement, or a
  // retirement without a reason, is an unauditable half-state. Phase 1 writes
  // one of three reasons and the constraint holds the pairing in Postgres
  // rather than in a comment.
  {
    id: "2026-07-20_foundation_meals3_editorial_retirement",
    statements: [
      `ALTER TABLE meals ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ`,
      `ALTER TABLE meals ADD COLUMN IF NOT EXISTS retired_reason TEXT`,
      // Null together or set together — never one without the other.
      `ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_retirement_check`,
      `ALTER TABLE meals ADD CONSTRAINT meals_retirement_check
         CHECK (
           (retired_at IS NULL AND retired_reason IS NULL)
           OR (retired_at IS NOT NULL AND retired_reason IS NOT NULL)
         )`,
      // Every collection-level read filters on `retired_at IS NULL`. A partial
      // index on the live rows keeps that filter free — and it is the common
      // case by a wide margin (76 retired against 3,207 rows today).
      `CREATE INDEX IF NOT EXISTS meals_live_idx ON meals (id) WHERE retired_at IS NULL`,
    ],
  },

  // ─── PLANNER1 — Continuous Timeline ────────────────────────────────────────
  //
  // Governing architecture: THA_HOUSEHOLD_TIME_ARCHITECTURE.md § 13 (migration
  // principle 3, as amended 2026-07-22); docs/implementation/PLANNER_CONTINUOUS_TIMELINE.md.
  //
  // The Planner's fixed six-week rota becomes a continuous, dated, unbounded timeline.
  // `week_number` is now an unbounded per-household ordinal; the calendar coordinate is
  // `week_start_date`. Weeks accrue indefinitely and are NEVER pruned, so dated range and
  // lookup access must stay efficient — this index is that guarantee.
  //
  // ADDITIVE AND HT7-SAFE. It adds NO column, NO default, and UPDATEs no row: it does not
  // touch `week_start_date`'s values at all, only indexes them. The no-back-fill gate
  // (`ht-anchor-is-never-back-filled`) fires on `ADD COLUMN … week_start_date … DEFAULT` and
  // on `UPDATE planner_weeks … week_start_date`; a `CREATE INDEX` matches neither, by design.
  {
    id: "2026-07-22_planner1_continuous_timeline_index",
    statements: [
      `CREATE INDEX IF NOT EXISTS planner_weeks_household_start_date_idx
         ON planner_weeks (household_id, week_start_date)`,
    ],
  },

  // ─── Fix — fresh-database migration order (SQLSTATE 42P01) ─────────────────
  //
  // The baseline ("2026-07-17_conv1_p10_schema_coverage", entry [0]) used to add
  // `canonical_food_knowledge_food_slug_fkey` — a FOREIGN KEY on canonical_food.knowledge_food_slug
  // REFERENCING knowledge_foods(slug) — as part of its own statement list. `knowledge_foods` is not
  // created until "2026-06-18_ws0_knowledge_registry", which sits LATER in this array. On a database
  // that already had both tables (every real deployment, per the baseline's own "safe on every
  // existing database" claim) that ordering was invisible. On a FRESH database — a new Neon branch,
  // a clean CI run — the baseline runs first, as it must, and hits `relation "knowledge_foods" does
  // not exist` (42P01) before the registry migration ever gets a chance to create it. The runner's
  // transaction rolls back and boot fails closed: no schema is left half-built, but the server never
  // starts either.
  //
  // The fix is two-part: the historical baseline statement now checks that the referenced table
  // exists before attempting the FK, and this append-only migration retries the identical guarded
  // constraint after "2026-06-18_ws0_knowledge_registry" has created `knowledge_foods`. This edits
  // no migration ID and reorders nothing. Databases that already recorded the baseline never
  // re-read its statements because `runMigrations()` tracks applied state solely by ID. On an
  // existing schema where the constraint is already present, the pg_constraint guard makes this
  // appended migration a no-op.
  {
    id: "2026-07-28_fix_canonical_food_knowledge_food_slug_fkey_order",
    statements: [
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'canonical_food_knowledge_food_slug_fkey' AND r.relname = 'canonical_food'
         ) THEN
           ALTER TABLE "canonical_food" ADD CONSTRAINT "canonical_food_knowledge_food_slug_fkey" FOREIGN KEY (knowledge_food_slug) REFERENCES knowledge_foods(slug) ON DELETE SET NULL;
         END IF;
       END $$`,
    ],
  },

  // ─── Fix — conversation_turn FK ordering on fresh databases ────────────────
  // The baseline creates the three referencing companion tables, but conversation_turns is
  // created later by the conversation-store migration. Baseline guards defer these constraints;
  // this append-only migration adds them once both sides exist. Existing schemas no-op via the
  // pg_constraint checks.
  {
    id: "2026-07-28_fix_conversation_turn_foreign_key_order",
    statements: [
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'companion_action_proposals_conversation_turn_id_fkey' AND r.relname = 'companion_action_proposals'
         ) THEN
           ALTER TABLE "companion_action_proposals" ADD CONSTRAINT "companion_action_proposals_conversation_turn_id_fkey" FOREIGN KEY (conversation_turn_id) REFERENCES conversation_turns(id) ON DELETE CASCADE;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'companion_guidance_events_conversation_turn_id_fkey' AND r.relname = 'companion_guidance_events'
         ) THEN
           ALTER TABLE "companion_guidance_events" ADD CONSTRAINT "companion_guidance_events_conversation_turn_id_fkey" FOREIGN KEY (conversation_turn_id) REFERENCES conversation_turns(id) ON DELETE CASCADE;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_class r ON r.oid = c.conrelid
           WHERE c.conname = 'companion_response_feedback_conversation_turn_id_fkey' AND r.relname = 'companion_response_feedback'
         ) THEN
           ALTER TABLE "companion_response_feedback" ADD CONSTRAINT "companion_response_feedback_conversation_turn_id_fkey" FOREIGN KEY (conversation_turn_id) REFERENCES conversation_turns(id) ON DELETE CASCADE;
         END IF;
       END $$`,
    ],
  },

  // ← Add new migrations here, appended to the end
];

// ─── WHAT THE CODE EXPECTS OF A DATABASE (REL3) ──────────────────────────────
// The list above is the single source of truth for which migrations exist. These two accessors
// are the only sanctioned way to ask it that question from outside this file.
//
// They exist because `scripts/verify-prod.ts` used to carry its OWN copy of the answer — a
// string literal, `"2026-06-18_ws0_knowledge_registry"`, hand-updated. It was 20 migrations
// stale, which meant the production verifier reported "Schema at head: PASS" against a database
// missing `auth_rate_limits` (TRUST1-S5's shared counter) and the founding cookbook's unique
// index (CBK1). A verifier that says PASS while production is 20 migrations behind is worse than
// no verifier: it is a false assurance, and the release checklist believed it.
//
// The fix is not a better literal — it is having no literal. There is one migration list, it
// lives here, and `runMigrations()` below consumes `expectedMigrationHead()` for its own parity
// log too, so the runner and the verifier cannot disagree about the head even in principle.
// This creates no second owner: nothing here applies, records, or orders a migration.
// ─────────────────────────────────────────────────────────────────────────────

/** Every reviewed migration id, in the order the runner applies them. */
export const MIGRATION_IDS: ReadonlyArray<string> = MIGRATIONS.map(m => m.id);

/**
 * The migration a fully-migrated database is expected to be at: the last entry, by definition —
 * the runner applies in order and the list appends at the end (see the header of this file; the
 * one baseline at [0] is not an append and does not affect which entry is LAST).
 *
 * CONV1 P10 note — a database that adopts the baseline AFTER the fact (i.e. every database that
 * existed before 2026-07-17) will have the baseline as its chronologically-newest `applied_at`
 * row while this returns the list's last entry, so `runMigrations()` logs one cosmetic parity
 * WARNING on the next boot. It is not a failure, it self-resolves the moment any further
 * migration is appended, and it is invisible to a fresh database (which applies in list order,
 * baseline first). `scripts/verify-prod.ts` is unaffected: `compareMigrationState` is SET-based
 * on purpose — it asks "is anything missing, anywhere", never "is the newest row this literal".
 */
export function expectedMigrationHead(): string {
  const head = MIGRATIONS[MIGRATIONS.length - 1]?.id;
  if (!head) {
    // Unreachable while any migration exists. Throwing rather than returning null keeps every
    // caller honest: there is no "expected head" for an empty list, and a verifier must not
    // quietly compare a database against `undefined` and call it a match.
    throw new Error("[Migrations] The migration list is empty — there is no expected head.");
  }
  return head;
}

export interface MigrationResult {
  lastAppliedId: string | null;
  newlyApplied: number;
}

export async function runMigrations(): Promise<MigrationResult> {
  const client = await pool.connect();
  try {
    // Ensure the tracking table exists (safe to run every boot)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         TEXT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("[Migrations] schema_migrations table ready");

    // Load which migrations are already applied
    const { rows: applied } = await client.query<{ id: string }>(
      "SELECT id FROM schema_migrations"
    );
    const appliedIds = new Set(applied.map(r => r.id));

    const pending = MIGRATIONS.filter(m => !appliedIds.has(m.id));

    if (pending.length === 0) {
      console.log("[Migrations] Up to date — no pending migrations");
    } else {
      console.log(`[Migrations] ${pending.length} pending migration(s) to apply`);
    }

    for (const migration of pending) {
      console.log(`[Migrations] Applying "${migration.id}" …`);
      try {
        await client.query("BEGIN");

        for (const sql of migration.statements) {
          await client.query(sql);
        }

        await client.query(
          "INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
          [migration.id]
        );

        await client.query("COMMIT");
        console.log(`[Migrations] ✓ Applied "${migration.id}"`);
      } catch (err: any) {
        await client.query("ROLLBACK").catch(() => {});

        const isPermission =
          err?.code === "42501" || (err?.message ?? "").includes("permission denied");

        if (isPermission) {
          console.error(
            `[Migrations] ✗ PERMISSION DENIED on "${migration.id}". ` +
              "Your database user may lack ALTER TABLE privileges. " +
              "Run these statements manually on the production database:\n" +
              migration.statements.map(s => `  ${s};`).join("\n")
          );
        } else {
          console.error(
            `[Migrations] ✗ Failed on "${migration.id}":`,
            err?.message ?? err
          );
        }
        throw err; // Caller decides whether to fail fast or continue
      }
    }

    // Retrieve the most recently applied migration for health reporting
    const { rows: latest } = await client.query<{ id: string }>(
      "SELECT id FROM schema_migrations ORDER BY applied_at DESC, id DESC LIMIT 1"
    );

    const lastAppliedId = latest[0]?.id ?? null;

    // Log parity summary: confirms the migration state matches the code expectations.
    // Same accessor `scripts/verify-prod.ts` uses — one owner of "what head should this be at?".
    const expectedHead = expectedMigrationHead();
    if (lastAppliedId && lastAppliedId === expectedHead) {
      console.log(`[Migrations] Schema at head: ${lastAppliedId}`);
    } else if (lastAppliedId) {
      console.warn(`[Migrations] Schema head mismatch — DB at "${lastAppliedId}", expected "${expectedHead}"`);
    }

    return {
      lastAppliedId,
      newlyApplied: pending.length,
    };
  } finally {
    client.release();
  }
}
