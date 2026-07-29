# PostgreSQL Schema Inventory

Read-only structural inventory of `heliumdb` (replit-heliumdb-production).

| Field | Value |
| --- | --- |
| Generated at | 2026-07-28T22:35:18.767Z |
| Generator | `export-schema-inventory.mjs` v1.0.0 |
| Format version | 1 |
| Server version | 16.10 |
| Database | `heliumdb` |
| Content hash (SHA-256) | `872358e6a6e1f02228181c09ab4e2dd8b4743bb7dac6d82afde53fd404bd24a1` |

> The content hash covers the structural payload only — it excludes `meta` (generation time, labels), so the same schema on Replit and on Neon staging hashes identically.

**Safety:** collected inside a `BEGIN TRANSACTION READ ONLY` block closed with `ROLLBACK`. No DDL, no DML, no application rows. The only table rows read are migration ids and timestamps from `schema_migrations`. Connection details are never recorded in this file.

## Object counts

| Object | Count |
| --- | ---: |
| Check Constraints | 32 |
| Columns | 1092 |
| Domains | 0 |
| Enum Labels | 0 |
| Enums | 0 |
| Exclusion Constraints | 0 |
| Extensions | 1 |
| Foreign Keys | 89 |
| Foreign Tables | 0 |
| Indexes | 228 |
| Materialized Views | 0 |
| Migration Entries | 102 |
| Migration Tables | 1 |
| Partitioned Tables | 0 |
| Primary Keys | 104 |
| Rls Enabled Tables | 0 |
| Rls Policies | 0 |
| Schemas | 1 |
| Sequences | 98 |
| Tables | 104 |
| Triggers | 0 |
| Unique Constraints | 39 |
| Views | 0 |

## Schemas

| Schema | Owner | Tables | Views | Sequences | Comment |
| --- | --- | ---: | ---: | ---: | --- |
| `public` | pg_database_owner | 104 | 0 | 98 | standard public schema |

## Extensions

| Extension | Schema | Version |
| --- | --- | --- |
| `plpgsql` | `pg_catalog` | 1.0 |

## Enums

_No user-defined enum types._

## Views

_No views or materialized views._

## Triggers

_No user-defined triggers._

## Row-level security

_RLS is not enabled on any table, and no policies are defined._

> Access control is therefore enforced entirely in the application layer.

## Sequences

| Sequence | Type | Start | Increment | Min | Max | Cycles | Owned by |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| `public.activity_summary_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.activity_summary.id` |
| `public.additives_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.additives.id` |
| `public.admin_audit_log_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.admin_audit_log.id` |
| `public.barcode_lookup_events_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.barcode_lookup_events.id` |
| `public.basket_items_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.basket_items.id` |
| `public.billing_events_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.billing_events.id` |
| `public.canonical_food_alias_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.canonical_food_alias.id` |
| `public.canonical_food_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.canonical_food.id` |
| `public.communities_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.communities.id` |
| `public.community_invitations_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.community_invitations.id` |
| `public.community_members_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.community_members.id` |
| `public.companion_action_proposals_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.companion_action_proposals.id` |
| `public.companion_guidance_events_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.companion_guidance_events.id` |
| `public.companion_health_snapshots_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.companion_health_snapshots.id` |
| `public.companion_learning_recommendations_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.companion_learning_recommendations.id` |
| `public.companion_response_feedback_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.companion_response_feedback.id` |
| `public.conversation_threads_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.conversation_threads.id` |
| `public.conversation_turns_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.conversation_turns.id` |
| `public.conversations_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.conversations.id` |
| `public.diets_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.diets.id` |
| `public.diversity_group_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.diversity_group.id` |
| `public.food_diary_days_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.food_diary_days.id` |
| `public.food_diary_entries_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.food_diary_entries.id` |
| `public.food_diary_metrics_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.food_diary_metrics.id` |
| `public.food_knowledge_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.food_knowledge.id` |
| `public.food_variety_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.food_variety.id` |
| `public.freezer_meals_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.freezer_meals.id` |
| `public.grocery_products_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.grocery_products.id` |
| `public.household_eaters_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.household_eaters.id` |
| `public.household_evidence_events_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.household_evidence_events.id` |
| `public.household_invitations_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.household_invitations.id` |
| `public.household_learning_signals_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.household_learning_signals.id` |
| `public.household_members_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.household_members.id` |
| `public.households_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.households.id` |
| `public.ingredient_classifications_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.ingredient_classifications.id` |
| `public.ingredient_products_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.ingredient_products.id` |
| `public.ingredient_sources_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.ingredient_sources.id` |
| `public.ingredient_swaps_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.ingredient_swaps.id` |
| `public.knowledge_food_benefits_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_food_benefits.id` |
| `public.knowledge_food_nutrients_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_food_nutrients.id` |
| `public.knowledge_food_preparations_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_food_preparations.id` |
| `public.knowledge_foods_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_foods.id` |
| `public.knowledge_health_benefits_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_health_benefits.id` |
| `public.knowledge_nutrient_benefits_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_nutrient_benefits.id` |
| `public.knowledge_nutrients_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_nutrients.id` |
| `public.knowledge_preparation_effects_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_preparation_effects.id` |
| `public.knowledge_preparations_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_preparations.id` |
| `public.knowledge_releases_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_releases.id` |
| `public.knowledge_review_audit_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_review_audit.id` |
| `public.knowledge_review_batches_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_review_batches.id` |
| `public.knowledge_review_decisions_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_review_decisions.id` |
| `public.knowledge_review_queue_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_review_queue.id` |
| `public.knowledge_rollback_points_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_rollback_points.id` |
| `public.knowledge_vocabulary_aliases_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.knowledge_vocabulary_aliases.id` |
| `public.meal_allergens_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.meal_allergens.id` |
| `public.meal_categories_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.meal_categories.id` |
| `public.meal_diets_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.meal_diets.id` |
| `public.meal_items_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.meal_items.id` |
| `public.meal_pairings_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.meal_pairings.id` |
| `public.meal_plan_entries_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.meal_plan_entries.id` |
| `public.meal_plans_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.meal_plans.id` |
| `public.meal_templates_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.meal_templates.id` |
| `public.meal_uplift_applications_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.meal_uplift_applications.id` |
| `public.meals_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.meals.id` |
| `public.normalized_ingredients_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.normalized_ingredients.id` |
| `public.nutrition_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.nutrition.id` |
| `public.opportunity_deliveries_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.opportunity_deliveries.id` |
| `public.pantry_ingredient_knowledge_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.pantry_ingredient_knowledge.id` |
| `public.planner_days_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.planner_days.id` |
| `public.planner_entries_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.planner_entries.id` |
| `public.planner_entry_eaters_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.planner_entry_eaters.id` |
| `public.planner_week_eater_overrides_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.planner_week_eater_overrides.id` |
| `public.planner_weeks_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.planner_weeks.id` |
| `public.platform_observations_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.platform_observations.id` |
| `public.platform_turn_outcomes_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.platform_turn_outcomes.id` |
| `public.privacy_activity_log_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.privacy_activity_log.id` |
| `public.product_additives_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.product_additives.id` |
| `public.product_events_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.product_events.id` |
| `public.product_history_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.product_history.id` |
| `public.product_matches_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.product_matches.id` |
| `public.recipe_source_audit_log_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.recipe_source_audit_log.id` |
| `public.recipe_source_settings_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.recipe_source_settings.id` |
| `public.referral_attributions_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.referral_attributions.id` |
| `public.savings_events_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.savings_events.id` |
| `public.shopping_fulfilment_memory_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.shopping_fulfilment_memory.id` |
| `public.shopping_list_extras_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.shopping_list_extras.id` |
| `public.shopping_list_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.shopping_list.id` |
| `public.subscriptions_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.subscriptions.id` |
| `public.supermarket_links_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.supermarket_links.id` |
| `public.support_requests_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.support_requests.id` |
| `public.user_consents_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.user_consents.id` |
| `public.user_health_trends_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.user_health_trends.id` |
| `public.user_item_usage_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.user_item_usage.id` |
| `public.user_pantry_items_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.user_pantry_items.id` |
| `public.user_preferences_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.user_preferences.id` |
| `public.user_streaks_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.user_streaks.id` |
| `public.users_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.users.id` |
| `public.week_provisioning_items_id_seq` | integer | 1 | 1 | 1 | 2147483647 | no | `public.week_provisioning_items.id` |

## Migrations

### `public.schema_migrations` — 102 applied

| # | id | applied_at |
| ---: | --- | --- |
| 1 | 2026-02-27_add_user_diet_fields | 2026-04-16 06:49:24.493546 |
| 2 | 2026-02-27_backfill_user_diet_fields | 2026-04-16 06:49:24.512968 |
| 3 | 2026-02-27_password_reset_tokens | 2026-04-16 06:49:24.521891 |
| 4 | 2026-02-27_meal_plan_templates | 2026-04-16 06:49:24.526035 |
| 5 | 2026-02-27_add_meals_created_at | 2026-04-16 06:49:24.52924 |
| 6 | 2026-02-28_add_roles_and_subscriptions | 2026-04-16 06:49:24.532751 |
| 7 | 2026-03-01_seed_admin_users | 2026-04-16 06:49:24.538661 |
| 8 | 2026-03-01_create_admin_audit_log | 2026-04-16 06:49:24.543281 |
| 9 | 2026-03-01_extend_meal_plan_templates | 2026-04-16 06:49:24.546632 |
| 10 | 2026-03-01_add_template_sharing | 2026-04-16 06:49:24.551394 |
| 11 | 2026-03-01_add_planner_entry_position | 2026-04-16 06:49:24.558614 |
| 12 | 2026-03-01_add_meals_kind | 2026-04-16 06:49:24.561528 |
| 13 | 2026-03-01_user_pantry_items | 2026-04-16 06:49:24.564848 |
| 14 | 2026-03-01_meal_pairings | 2026-04-16 06:49:24.583615 |
| 15 | 2026-03-01_ingredient_products | 2026-04-16 06:49:24.589905 |
| 16 | 2026-03-04_recipe_source_settings | 2026-04-16 06:49:24.601816 |
| 17 | 2026-03-04_households | 2026-04-16 06:49:24.605588 |
| 18 | 2026-03-04_household_id_columns | 2026-04-16 06:49:24.609115 |
| 19 | 2026-03-04_backfill_households | 2026-04-16 06:49:24.61288 |
| 20 | 2026-03-08_basket_attribution_columns | 2026-04-16 06:49:24.622833 |
| 21 | 2026-03-08_food_diary_tables | 2026-04-16 06:49:24.626449 |
| 22 | 2026-03-12_add_always_add_to_extras | 2026-04-16 06:49:24.630958 |
| 23 | 2026-03-12_add_in_basket_to_extras | 2026-04-16 06:49:24.634432 |
| 24 | 2026-03-13_pantry_columns_fix | 2026-04-16 07:07:14.913965 |
| 25 | 2026-03-13_fix_pantry_null_household_id | 2026-04-16 07:07:14.923504 |
| 26 | 2026-03-13_shopping_list_columns_fix | 2026-04-16 07:07:14.929589 |
| 27 | 2026-03-13_backfill_missing_households | 2026-04-16 07:07:14.934498 |
| 28 | 2026-03-13_add_demo_user_fields | 2026-04-16 07:07:14.939933 |
| 29 | 2026-03-13_add_demo_claimed_email | 2026-04-16 07:07:14.944279 |
| 30 | 2026-03-14_add_first_name | 2026-04-16 07:07:14.947721 |
| 31 | 2026-03-14_create_food_knowledge | 2026-04-16 07:07:14.950886 |
| 32 | 2026-03-15_extend_meal_templates | 2026-04-16 07:07:14.95502 |
| 33 | 2026-03-15_meals_meal_template_fk | 2026-04-16 07:07:14.958314 |
| 34 | 2026-03-15_user_preferences_meal_matching | 2026-04-16 07:07:14.964087 |
| 35 | 2026-03-15_household_meal_mode_settings | 2026-04-16 07:07:14.967148 |
| 36 | 2026-03-15_shopping_list_basket_label | 2026-04-16 07:07:14.970518 |
| 37 | 2026-03-20_add_user_login_tracking | 2026-04-16 07:07:14.97415 |
| 38 | 2026-03-20_add_site_settings | 2026-04-16 07:07:14.978235 |
| 39 | 2026-03-30_add_include_regulatory_additives_in_scoring | 2026-04-16 07:07:14.982319 |
| 40 | 2026-04-02_add_barcode_lookup_events | 2026-04-16 07:07:14.986346 |
| 41 | 2026-04-02_add_additives_aliases | 2026-04-16 07:07:15.178067 |
| 42 | 2026-04-02_add_fruit_pantry_category | 2026-04-16 07:07:15.181444 |
| 43 | 2026-04-02_meal_items_and_usage | 2026-04-16 07:07:15.19657 |
| 44 | 2026-04-02_add_shop_status_to_shopping_list | 2026-04-16 07:07:15.224934 |
| 45 | 2026-04-04_custom_diary_metrics | 2026-04-16 07:07:15.228234 |
| 46 | 2026-04-05_savings_events | 2026-04-16 07:07:15.231824 |
| 47 | 2026-04-12_item_resolution_layer | 2026-04-16 07:07:20.752573 |
| 48 | 2026-04-16_add_guest_eaters_to_planner_entries | 2026-04-16 07:20:19.818176 |
| 49 | 2026-04-16_ingredient_sources_meal_context | 2026-04-16 11:19:39.96408 |
| 50 | 2026-04-16_add_household_eaters_tables | 2026-04-16 12:27:59.38548 |
| 51 | 2026-04-18_fix_pantry_uniqueness | 2026-04-18 15:53:03.480482 |
| 52 | 2026-04-18_pantry_ingredient_knowledge | 2026-04-18 20:22:18.742517 |
| 53 | 2026-04-18_pantry_knowledge_highlights | 2026-04-18 20:22:19.167654 |
| 54 | 2026-04-19_backfill_planner_weeks_household_id_final | 2026-04-19 11:05:52.597994 |
| 55 | 2026-04-19_backfill_shopping_list_null_resolution_state | 2026-04-19 11:05:53.082615 |
| 56 | 2026-04-19_ingredient_classifications_table | 2026-04-19 21:25:12.09129 |
| 57 | 2026-04-23_add_adaptation_result_to_planner_entries | 2026-04-24 03:14:38.571468 |
| 58 | 2026-04-25_product_matches_price_source | 2026-04-25 22:33:14.227186 |
| 59 | 2026-04-28_add_cupboard_quantity_to_shopping_list | 2026-04-29 05:58:34.025832 |
| 60 | 2026-05-03_add_source_to_shopping_list | 2026-05-03 11:36:45.495972 |
| 61 | 2026-05-03_rename_source_basket_to_manual | 2026-05-03 11:41:47.737708 |
| 62 | 2026-05-05_add_product_events_and_activity_summary | 2026-05-05 08:50:31.217194 |
| 63 | 2026-05-18_household_safe_variants | 2026-05-18 14:38:25.938975 |
| 64 | 2026-05-18_variant_kind_cookbook_visibility | 2026-05-19 07:55:06.062889 |
| 65 | 2026-05-20_add_week_provisioning_items | 2026-05-20 23:19:14.722054 |
| 66 | 2026-05-22_add_shopping_fulfilment_memory | 2026-05-22 16:04:14.265366 |
| 67 | 2026-05-23_add_pet_pantry_category | 2026-05-23 19:38:06.384874 |
| 68 | 2026-05-23_add_pantry_need_quantity | 2026-05-23 19:38:07.081481 |
| 69 | 2026-06-11_add_meal_uplift_applications | 2026-06-11 20:10:24.966925 |
| 70 | 2026-06-14_add_hybrid_meal_occasion | 2026-06-14 15:02:56.413634 |
| 71 | 2026-06-14_add_shell_nutrition_opportunities | 2026-06-14 18:38:02.122984 |
| 72 | 2026-06-15_enrich_six_pre_existing_shells | 2026-06-15 14:18:56.781067 |
| 73 | 2026-06-15_backfill_meals_from_templates | 2026-06-15 14:18:56.934604 |
| 74 | 2026-06-18_ws0_knowledge_registry | 2026-06-18 17:31:39.503165 |
| 75 | 2026-07-01_int18_conversation_store | 2026-07-01 08:44:56.267778 |
| 76 | 2026-07-03_opportunity_deliveries | 2026-07-03 14:02:22.618055 |
| 77 | 2026-07-03_user_preferences_muted_opportunity_types | 2026-07-03 14:02:22.691799 |
| 78 | 2026-07-03_evidence_and_learning_platform | 2026-07-03 14:02:22.700842 |
| 79 | 2026-07-03_platform_turn_outcomes | 2026-07-03 23:10:33.592206 |
| 80 | 2026-07-03_pkc0_claim_trust_columns | 2026-07-03 23:56:45.866753 |
| 81 | 2026-07-04_pkc3_retire_live_yogurt_duplicate | 2026-07-04 13:03:03.184415 |
| 82 | 2026-07-08_platform_observations | 2026-07-08 22:43:01.879806 |
| 83 | 2026-07-09_know1_retire_live_yogurt_duplicate | 2026-07-09 11:56:14.566906 |
| 84 | 2026-07-11_trust1_s5_auth_rate_limits | 2026-07-11 15:00:59.310145 |
| 85 | 2026-07-11_cbk1_cookbook_canonical_identity | 2026-07-11 21:25:55.522653 |
| 86 | 2026-07-11_phase5a_preparation_knowledge | 2026-07-11 23:58:43.385196 |
| 87 | 2026-07-14_pub1_canonical_food_projection_columns | 2026-07-14 05:42:27.263817 |
| 88 | 2026-07-15_rm3_retire_meal_template_products | 2026-07-15 11:51:40.039341 |
| 89 | 2026-07-16_sec23_auth_token_expiry_timestamptz | 2026-07-16 16:25:13.754086 |
| 90 | 2026-07-16_conv1_p4_household_eaters_integrity | 2026-07-16 23:00:41.244496 |
| 91 | 2026-07-16_conv1_p4_move_diet_to_household_eaters | 2026-07-16 23:00:42.693718 |
| 92 | 2026-07-16_conv1_p4_retire_users_diet_columns | 2026-07-16 23:00:42.786231 |
| 93 | 2026-07-17_conv1_p5_household_time_zone | 2026-07-17 07:29:07.157351 |
| 94 | 2026-07-17_conv1_p7_planner_week_anchor | 2026-07-17 09:26:15.37067 |
| 95 | 2026-07-17_conv1_p10_schema_coverage | 2026-07-17 11:34:51.654233 |
| 96 | 2026-07-18_bus1_trust_and_compliance | 2026-07-18 22:42:27.160006 |
| 97 | 2026-07-18_bus2a_commercial_foundation | 2026-07-18 23:42:47.266887 |
| 98 | 2026-07-19_know2_claim_rejection_state | 2026-07-19 08:27:42.778246 |
| 99 | 2026-07-19_comm1_community_foundation | 2026-07-19 17:34:08.509637 |
| 100 | 2026-07-19_comm1a_invitation_and_referral | 2026-07-19 19:58:45.049074 |
| 101 | 2026-07-20_foundation_meals3_editorial_retirement | 2026-07-20 17:32:35.110426 |
| 102 | 2026-07-22_planner1_continuous_timeline_index | 2026-07-22 12:13:33.49208 |

## Tables

| Table | Kind | Cols | PK | FKs | Unique | Checks | Indexes | Triggers | RLS |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| [`public.activity_summary`](#publicactivity_summary) | table | 12 | id | 1 | 1 | 0 | 2 | 0 | off |
| [`public.additives`](#publicadditives) | table | 7 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.admin_audit_log`](#publicadmin_audit_log) | table | 6 | id | 2 | 0 | 0 | 1 | 0 | off |
| [`public.auth_rate_limits`](#publicauth_rate_limits) | table | 4 | key | 0 | 0 | 0 | 2 | 0 | off |
| [`public.barcode_lookup_events`](#publicbarcode_lookup_events) | table | 11 | id | 0 | 0 | 0 | 4 | 0 | off |
| [`public.basket_items`](#publicbasket_items) | table | 4 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.billing_events`](#publicbilling_events) | table | 8 | id | 1 | 0 | 1 | 4 | 0 | off |
| [`public.canonical_food`](#publiccanonical_food) | table | 22 | id | 2 | 1 | 0 | 2 | 0 | off |
| [`public.canonical_food_alias`](#publiccanonical_food_alias) | table | 8 | id | 1 | 1 | 0 | 2 | 0 | off |
| [`public.communities`](#publiccommunities) | table | 7 | id | 1 | 0 | 1 | 1 | 0 | off |
| [`public.community_invitations`](#publiccommunity_invitations) | table | 9 | id | 3 | 0 | 2 | 5 | 0 | off |
| [`public.community_members`](#publiccommunity_members) | table | 8 | id | 3 | 1 | 2 | 4 | 0 | off |
| [`public.companion_action_proposals`](#publiccompanion_action_proposals) | table | 14 | id | 1 | 0 | 0 | 3 | 0 | off |
| [`public.companion_guidance_events`](#publiccompanion_guidance_events) | table | 9 | id | 1 | 0 | 0 | 1 | 0 | off |
| [`public.companion_health_snapshots`](#publiccompanion_health_snapshots) | table | 11 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.companion_learning_recommendations`](#publiccompanion_learning_recommendations) | table | 11 | id | 2 | 0 | 0 | 1 | 0 | off |
| [`public.companion_response_feedback`](#publiccompanion_response_feedback) | table | 7 | id | 1 | 1 | 0 | 2 | 0 | off |
| [`public.conversation_threads`](#publicconversation_threads) | table | 5 | id | 1 | 0 | 0 | 1 | 0 | off |
| [`public.conversation_turns`](#publicconversation_turns) | table | 11 | id | 1 | 0 | 1 | 1 | 0 | off |
| [`public.conversations`](#publicconversations) | table | 4 | id | 1 | 1 | 0 | 2 | 0 | off |
| [`public.diets`](#publicdiets) | table | 2 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.diversity_group`](#publicdiversity_group) | table | 9 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.food_diary_days`](#publicfood_diary_days) | table | 6 | id | 1 | 1 | 0 | 2 | 0 | off |
| [`public.food_diary_entries`](#publicfood_diary_entries) | table | 9 | id | 2 | 0 | 0 | 1 | 0 | off |
| [`public.food_diary_metrics`](#publicfood_diary_metrics) | table | 12 | id | 1 | 1 | 0 | 2 | 0 | off |
| [`public.food_knowledge`](#publicfood_knowledge) | table | 12 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.food_variety`](#publicfood_variety) | table | 10 | id | 1 | 1 | 0 | 2 | 0 | off |
| [`public.freezer_meals`](#publicfreezer_meals) | table | 10 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.grocery_products`](#publicgrocery_products) | table | 12 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.household_eaters`](#publichousehold_eaters) | table | 6 | id | 2 | 0 | 0 | 2 | 0 | off |
| [`public.household_evidence_events`](#publichousehold_evidence_events) | table | 12 | id | 1 | 0 | 0 | 3 | 0 | off |
| [`public.household_invitations`](#publichousehold_invitations) | table | 11 | id | 3 | 0 | 5 | 5 | 0 | off |
| [`public.household_learning_signals`](#publichousehold_learning_signals) | table | 17 | id | 2 | 1 | 0 | 3 | 0 | off |
| [`public.household_members`](#publichousehold_members) | table | 8 | id | 2 | 1 | 0 | 2 | 0 | off |
| [`public.households`](#publichouseholds) | table | 7 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.ingredient_classifications`](#publicingredient_classifications) | table | 14 | id | 0 | 1 | 0 | 4 | 0 | off |
| [`public.ingredient_products`](#publicingredient_products) | table | 11 | id | 1 | 0 | 0 | 4 | 0 | off |
| [`public.ingredient_sources`](#publicingredient_sources) | table | 10 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.ingredient_swaps`](#publicingredient_swaps) | table | 3 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.knowledge_food_benefits`](#publicknowledge_food_benefits) | table | 14 | id | 2 | 1 | 2 | 3 | 0 | off |
| [`public.knowledge_food_nutrients`](#publicknowledge_food_nutrients) | table | 15 | id | 2 | 1 | 2 | 3 | 0 | off |
| [`public.knowledge_food_preparations`](#publicknowledge_food_preparations) | table | 7 | id | 2 | 1 | 0 | 3 | 0 | off |
| [`public.knowledge_foods`](#publicknowledge_foods) | table | 15 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.knowledge_health_benefits`](#publicknowledge_health_benefits) | table | 9 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.knowledge_nutrient_benefits`](#publicknowledge_nutrient_benefits) | table | 14 | id | 2 | 1 | 2 | 3 | 0 | off |
| [`public.knowledge_nutrients`](#publicknowledge_nutrients) | table | 10 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.knowledge_preparation_effects`](#publicknowledge_preparation_effects) | table | 17 | id | 2 | 1 | 2 | 4 | 0 | off |
| [`public.knowledge_preparations`](#publicknowledge_preparations) | table | 10 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.knowledge_releases`](#publicknowledge_releases) | table | 18 | id | 3 | 0 | 0 | 1 | 0 | off |
| [`public.knowledge_review_audit`](#publicknowledge_review_audit) | table | 11 | id | 1 | 0 | 0 | 3 | 0 | off |
| [`public.knowledge_review_batches`](#publicknowledge_review_batches) | table | 14 | id | 1 | 0 | 0 | 1 | 0 | off |
| [`public.knowledge_review_decisions`](#publicknowledge_review_decisions) | table | 23 | id | 3 | 0 | 0 | 3 | 0 | off |
| [`public.knowledge_review_queue`](#publicknowledge_review_queue) | table | 18 | id | 0 | 1 | 0 | 3 | 0 | off |
| [`public.knowledge_rollback_points`](#publicknowledge_rollback_points) | table | 6 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.knowledge_vocabulary_aliases`](#publicknowledge_vocabulary_aliases) | table | 9 | id | 1 | 0 | 0 | 2 | 0 | off |
| [`public.meal_allergens`](#publicmeal_allergens) | table | 3 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.meal_categories`](#publicmeal_categories) | table | 2 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.meal_diets`](#publicmeal_diets) | table | 3 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.meal_items`](#publicmeal_items) | table | 7 | id | 1 | 0 | 0 | 2 | 0 | off |
| [`public.meal_pairings`](#publicmeal_pairings) | table | 7 | id | 3 | 0 | 0 | 2 | 0 | off |
| [`public.meal_plan_entries`](#publicmeal_plan_entries) | table | 7 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.meal_plan_template_items`](#publicmeal_plan_template_items) | table | 7 | id | 1 | 1 | 0 | 2 | 0 | off |
| [`public.meal_plan_templates`](#publicmeal_plan_templates) | table | 14 | id | 0 | 0 | 1 | 4 | 0 | off |
| [`public.meal_plans`](#publicmeal_plans) | table | 6 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.meal_templates`](#publicmeal_templates) | table | 27 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.meal_uplift_applications`](#publicmeal_uplift_applications) | table | 15 | id | 2 | 0 | 0 | 4 | 0 | off |
| [`public.meals`](#publicmeals) | table | 39 | id | 2 | 0 | 1 | 5 | 0 | off |
| [`public.normalized_ingredients`](#publicnormalized_ingredients) | table | 4 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.nutrition`](#publicnutrition) | table | 9 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.opportunity_deliveries`](#publicopportunity_deliveries) | table | 11 | id | 1 | 1 | 0 | 3 | 0 | off |
| [`public.pantry_ingredient_knowledge`](#publicpantry_ingredient_knowledge) | table | 13 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.planner_days`](#publicplanner_days) | table | 3 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.planner_entries`](#publicplanner_entries) | table | 12 | id | 1 | 0 | 0 | 1 | 0 | off |
| [`public.planner_entry_eaters`](#publicplanner_entry_eaters) | table | 3 | id | 2 | 1 | 0 | 2 | 0 | off |
| [`public.planner_week_eater_overrides`](#publicplanner_week_eater_overrides) | table | 4 | id | 2 | 1 | 0 | 2 | 0 | off |
| [`public.planner_weeks`](#publicplanner_weeks) | table | 6 | id | 0 | 1 | 0 | 3 | 0 | off |
| [`public.platform_observations`](#publicplatform_observations) | table | 16 | id | 1 | 0 | 0 | 5 | 0 | off |
| [`public.platform_turn_outcomes`](#publicplatform_turn_outcomes) | table | 8 | id | 0 | 0 | 0 | 3 | 0 | off |
| [`public.privacy_activity_log`](#publicprivacy_activity_log) | table | 5 | id | 0 | 0 | 0 | 3 | 0 | off |
| [`public.product_additives`](#publicproduct_additives) | table | 3 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.product_events`](#publicproduct_events) | table | 12 | id | 1 | 0 | 0 | 4 | 0 | off |
| [`public.product_history`](#publicproduct_history) | table | 13 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.product_matches`](#publicproduct_matches) | table | 16 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.recipe_source_audit_log`](#publicrecipe_source_audit_log) | table | 7 | id | 1 | 0 | 0 | 1 | 0 | off |
| [`public.recipe_source_settings`](#publicrecipe_source_settings) | table | 6 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.referral_attributions`](#publicreferral_attributions) | table | 9 | id | 3 | 0 | 3 | 3 | 0 | off |
| [`public.savings_events`](#publicsavings_events) | table | 9 | id | 1 | 0 | 0 | 4 | 0 | off |
| [`public.schema_migrations`](#publicschema_migrations) | table | 2 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.session`](#publicsession) | table | 3 | sid | 0 | 0 | 0 | 2 | 0 | off |
| [`public.shopping_fulfilment_memory`](#publicshopping_fulfilment_memory) | table | 13 | id | 1 | 0 | 0 | 3 | 0 | off |
| [`public.shopping_list`](#publicshopping_list) | table | 39 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.shopping_list_extras`](#publicshopping_list_extras) | table | 8 | id | 1 | 0 | 0 | 1 | 0 | off |
| [`public.site_settings`](#publicsite_settings) | table | 3 | key | 0 | 0 | 0 | 1 | 0 | off |
| [`public.subscriptions`](#publicsubscriptions) | table | 15 | id | 2 | 0 | 4 | 4 | 0 | off |
| [`public.supermarket_links`](#publicsupermarket_links) | table | 5 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.support_requests`](#publicsupport_requests) | table | 13 | id | 2 | 0 | 0 | 4 | 0 | off |
| [`public.user_consents`](#publicuser_consents) | table | 10 | id | 1 | 0 | 0 | 3 | 0 | off |
| [`public.user_health_trends`](#publicuser_health_trends) | table | 7 | id | 0 | 0 | 0 | 1 | 0 | off |
| [`public.user_item_usage`](#publicuser_item_usage) | table | 7 | id | 1 | 0 | 0 | 2 | 0 | off |
| [`public.user_pantry_items`](#publicuser_pantry_items) | table | 14 | id | 1 | 0 | 1 | 3 | 0 | off |
| [`public.user_preferences`](#publicuser_preferences) | table | 35 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.user_streaks`](#publicuser_streaks) | table | 7 | id | 0 | 1 | 0 | 2 | 0 | off |
| [`public.users`](#publicusers) | table | 30 | id | 0 | 1 | 2 | 2 | 0 | off |
| [`public.week_provisioning_items`](#publicweek_provisioning_items) | table | 6 | id | 1 | 0 | 0 | 2 | 0 | off |

### `public.activity_summary`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('activity_summary_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `household_id` | `integer` | NOT NULL | — | — |
| 4 | `current_shopping_items` | `integer` | NOT NULL | `0` | — |
| 5 | `current_planner_meals` | `integer` | NOT NULL | `0` | — |
| 6 | `current_pantry_items` | `integer` | NOT NULL | `0` | — |
| 7 | `current_recipes` | `integer` | NOT NULL | `0` | — |
| 8 | `lifetime_shopping_adds` | `integer` | NOT NULL | `0` | — |
| 9 | `lifetime_planner_adds` | `integer` | NOT NULL | `0` | — |
| 10 | `lifetime_pantry_adds` | `integer` | NOT NULL | `0` | — |
| 11 | `lifetime_recipe_adds` | `integer` | NOT NULL | `0` | — |
| 12 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `activity_summary_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `activity_summary_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| UNIQUE | `activity_summary_user_id_unique` | `UNIQUE (user_id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `activity_summary_pkey` | btree | yes | `CREATE UNIQUE INDEX activity_summary_pkey ON activity_summary USING btree (id)` |
| `activity_summary_user_id_unique` | btree | yes | `CREATE UNIQUE INDEX activity_summary_user_id_unique ON activity_summary USING btree (user_id)` |

### `public.additives`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('additives_id_seq'::regclass)` | — |
| 2 | `name` | `text` | NOT NULL | — | — |
| 3 | `type` | `text` | NOT NULL | — | — |
| 4 | `risk_level` | `text` | NOT NULL | `'low'::text` | — |
| 5 | `description` | `text` | yes | — | — |
| 6 | `is_regulatory` | `boolean` | yes | `false` | — |
| 7 | `aliases` | `text[]` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `additives_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `additives_name_unique` | `UNIQUE (name)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `additives_name_unique` | btree | yes | `CREATE UNIQUE INDEX additives_name_unique ON additives USING btree (name)` |
| `additives_pkey` | btree | yes | `CREATE UNIQUE INDEX additives_pkey ON additives USING btree (id)` |

### `public.admin_audit_log`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('admin_audit_log_id_seq'::regclass)` | — |
| 2 | `admin_user_id` | `integer` | NOT NULL | — | — |
| 3 | `action` | `text` | NOT NULL | — | — |
| 4 | `target_user_id` | `integer` | yes | — | — |
| 5 | `metadata` | `jsonb` | yes | — | — |
| 6 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `admin_audit_log_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `admin_audit_log_admin_user_id_users_id_fk` | `FOREIGN KEY (admin_user_id) REFERENCES users(id)` |
| FOREIGN KEY | `admin_audit_log_target_user_id_users_id_fk` | `FOREIGN KEY (target_user_id) REFERENCES users(id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `admin_audit_log_pkey` | btree | yes | `CREATE UNIQUE INDEX admin_audit_log_pkey ON admin_audit_log USING btree (id)` |

### `public.auth_rate_limits`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `key` | `text` | NOT NULL | — | — |
| 2 | `hits` | `integer` | NOT NULL | `0` | — |
| 3 | `expires_at` | `timestamp with time zone` | NOT NULL | — | — |
| 4 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `auth_rate_limits_pkey` | `PRIMARY KEY (key)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `auth_rate_limits_expires_at_idx` | btree | no | `CREATE INDEX auth_rate_limits_expires_at_idx ON auth_rate_limits USING btree (expires_at)` |
| `auth_rate_limits_pkey` | btree | yes | `CREATE UNIQUE INDEX auth_rate_limits_pkey ON auth_rate_limits USING btree (key)` |

### `public.barcode_lookup_events`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('barcode_lookup_events_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | yes | — | — |
| 3 | `barcode` | `text` | NOT NULL | — | — |
| 4 | `lookup_source` | `text` | NOT NULL | `'off'::text` | — |
| 5 | `status` | `text` | NOT NULL | — | — |
| 6 | `http_status` | `integer` | NOT NULL | — | — |
| 7 | `off_product_code` | `text` | yes | — | — |
| 8 | `off_product_name` | `text` | yes | — | — |
| 9 | `failure_reason` | `text` | yes | — | — |
| 10 | `request_url` | `text` | yes | — | — |
| 11 | `created_at` | `timestamp without time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `barcode_lookup_events_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `barcode_lookup_events_pkey` | btree | yes | `CREATE UNIQUE INDEX barcode_lookup_events_pkey ON barcode_lookup_events USING btree (id)` |
| `idx_barcode_lookup_events_barcode` | btree | no | `CREATE INDEX idx_barcode_lookup_events_barcode ON barcode_lookup_events USING btree (barcode)` |
| `idx_barcode_lookup_events_status` | btree | no | `CREATE INDEX idx_barcode_lookup_events_status ON barcode_lookup_events USING btree (status)` |
| `idx_barcode_lookup_events_user_id` | btree | no | `CREATE INDEX idx_barcode_lookup_events_user_id ON barcode_lookup_events USING btree (user_id)` |

### `public.basket_items`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('basket_items_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `meal_id` | `integer` | NOT NULL | — | — |
| 4 | `quantity` | `integer` | NOT NULL | `1` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `basket_items_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `basket_items_pkey` | btree | yes | `CREATE UNIQUE INDEX basket_items_pkey ON basket_items USING btree (id)` |

### `public.billing_events`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('billing_events_id_seq'::regclass)` | — |
| 2 | `provider_event_id` | `text` | NOT NULL | — | — |
| 3 | `kind` | `text` | NOT NULL | — | — |
| 4 | `subscription_id` | `integer` | yes | — | — |
| 5 | `occurred_at` | `timestamp with time zone` | NOT NULL | — | — |
| 6 | `received_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 7 | `processed_at` | `timestamp with time zone` | yes | — | — |
| 8 | `payload` | `jsonb` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `billing_events_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `billing_events_subscription_id_fkey` | `FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE` |
| CHECK | `billing_events_kind_check` | `CHECK (kind = ANY (ARRAY['trial-started'::text, 'activated'::text, 'renewed'::text, 'payment-failed'::text, 'payment-recovered'::text, 'plan-changed'::text, 'cancellation-scheduled'::text, 'cancellation-revoked'::text, 'ended'::text]))` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `billing_events_occurred_at_idx` | btree | no | `CREATE INDEX billing_events_occurred_at_idx ON billing_events USING btree (occurred_at)` |
| `billing_events_pkey` | btree | yes | `CREATE UNIQUE INDEX billing_events_pkey ON billing_events USING btree (id)` |
| `billing_events_provider_event_id_key` | btree | yes | `CREATE UNIQUE INDEX billing_events_provider_event_id_key ON billing_events USING btree (provider_event_id)` |
| `billing_events_subscription_id_idx` | btree | no | `CREATE INDEX billing_events_subscription_id_idx ON billing_events USING btree (subscription_id)` |

### `public.canonical_food`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('canonical_food_id_seq'::regclass)` | — |
| 2 | `slug` | `text` | NOT NULL | — | — |
| 3 | `name` | `text` | NOT NULL | — | — |
| 4 | `category` | `text` | NOT NULL | — | — |
| 5 | `subcategory` | `text` | yes | — | — |
| 6 | `description` | `text` | yes | — | — |
| 7 | `knowledge_food_slug` | `text` | yes | — | — |
| 8 | `diversity_group_slug` | `text` | yes | — | — |
| 9 | `status` | `text` | NOT NULL | `'active'::text` | — |
| 10 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 11 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 12 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 13 | `tier` | `text` | NOT NULL | `'canonical'::text` | — |
| 14 | `scientific_name` | `text` | yes | — | — |
| 15 | `source_ref` | `text` | yes | — | — |
| 16 | `confidence` | `text` | yes | — | — |
| 17 | `family` | `text` | yes | — | — |
| 18 | `availability` | `text` | yes | — | — |
| 19 | `availability_modifiers` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 20 | `peak_seasons` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 21 | `origin_region` | `text` | yes | — | — |
| 22 | `fermented` | `boolean` | NOT NULL | `false` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `canonical_food_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `canonical_food_diversity_group_slug_fkey` | `FOREIGN KEY (diversity_group_slug) REFERENCES diversity_group(slug) ON DELETE SET NULL` |
| FOREIGN KEY | `canonical_food_knowledge_food_slug_fkey` | `FOREIGN KEY (knowledge_food_slug) REFERENCES knowledge_foods(slug) ON DELETE SET NULL` |
| UNIQUE | `canonical_food_slug_key` | `UNIQUE (slug)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `canonical_food_pkey` | btree | yes | `CREATE UNIQUE INDEX canonical_food_pkey ON canonical_food USING btree (id)` |
| `canonical_food_slug_key` | btree | yes | `CREATE UNIQUE INDEX canonical_food_slug_key ON canonical_food USING btree (slug)` |

### `public.canonical_food_alias`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('canonical_food_alias_id_seq'::regclass)` | — |
| 2 | `canonical_food_id` | `integer` | NOT NULL | — | — |
| 3 | `alias` | `text` | NOT NULL | — | — |
| 4 | `alias_key` | `text` | NOT NULL | — | — |
| 5 | `alias_type` | `text` | NOT NULL | — | — |
| 6 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 7 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 8 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `canonical_food_alias_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `canonical_food_alias_canonical_food_id_fkey` | `FOREIGN KEY (canonical_food_id) REFERENCES canonical_food(id) ON DELETE CASCADE` |
| UNIQUE | `canonical_food_alias_alias_key_key` | `UNIQUE (alias_key)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `canonical_food_alias_alias_key_key` | btree | yes | `CREATE UNIQUE INDEX canonical_food_alias_alias_key_key ON canonical_food_alias USING btree (alias_key)` |
| `canonical_food_alias_pkey` | btree | yes | `CREATE UNIQUE INDEX canonical_food_alias_pkey ON canonical_food_alias USING btree (id)` |

### `public.communities`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('communities_id_seq'::regclass)` | — |
| 2 | `name` | `text` | NOT NULL | — | — |
| 3 | `kind` | `text` | NOT NULL | `'neighbourhood'::text` | — |
| 4 | `created_by_household_id` | `integer` | yes | — | — |
| 5 | `status` | `text` | NOT NULL | `'active'::text` | — |
| 6 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 7 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `communities_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `communities_created_by_household_id_fkey` | `FOREIGN KEY (created_by_household_id) REFERENCES households(id) ON DELETE SET NULL` |
| CHECK | `communities_status_check` | `CHECK (status = ANY (ARRAY['active'::text, 'archived'::text]))` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `communities_pkey` | btree | yes | `CREATE UNIQUE INDEX communities_pkey ON communities USING btree (id)` |

### `public.community_invitations`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('community_invitations_id_seq'::regclass)` | — |
| 2 | `community_id` | `integer` | NOT NULL | — | — |
| 3 | `invited_household_id` | `integer` | NOT NULL | — | — |
| 4 | `invited_by_household_id` | `integer` | yes | — | — |
| 5 | `token` | `text` | NOT NULL | — | — |
| 6 | `status` | `text` | NOT NULL | `'pending'::text` | — |
| 7 | `expires_at` | `timestamp with time zone` | NOT NULL | — | — |
| 8 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 9 | `responded_at` | `timestamp with time zone` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `community_invitations_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `community_invitations_community_id_fkey` | `FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE` |
| FOREIGN KEY | `community_invitations_invited_by_household_id_fkey` | `FOREIGN KEY (invited_by_household_id) REFERENCES households(id) ON DELETE SET NULL` |
| FOREIGN KEY | `community_invitations_invited_household_id_fkey` | `FOREIGN KEY (invited_household_id) REFERENCES households(id) ON DELETE CASCADE` |
| CHECK | `community_invitations_responded_check` | `CHECK (status = 'pending'::text AND responded_at IS NULL OR status <> 'pending'::text AND responded_at IS NOT NULL)` |
| CHECK | `community_invitations_status_check` | `CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'revoked'::text, 'expired'::text]))` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `community_invitations_community_idx` | btree | no | `CREATE INDEX community_invitations_community_idx ON community_invitations USING btree (community_id)` |
| `community_invitations_invited_household_idx` | btree | no | `CREATE INDEX community_invitations_invited_household_idx ON community_invitations USING btree (invited_household_id)` |
| `community_invitations_pending_idx` | btree | no | `CREATE INDEX community_invitations_pending_idx ON community_invitations USING btree (invited_household_id, status) WHERE status = 'pending'::text` |
| `community_invitations_pkey` | btree | yes | `CREATE UNIQUE INDEX community_invitations_pkey ON community_invitations USING btree (id)` |
| `community_invitations_token_key` | btree | yes | `CREATE UNIQUE INDEX community_invitations_token_key ON community_invitations USING btree (token)` |

### `public.community_members`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('community_members_id_seq'::regclass)` | — |
| 2 | `community_id` | `integer` | NOT NULL | — | — |
| 3 | `household_id` | `integer` | NOT NULL | — | — |
| 4 | `role` | `text` | NOT NULL | `'member'::text` | — |
| 5 | `status` | `text` | NOT NULL | `'active'::text` | — |
| 6 | `joined_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 7 | `invited_by_household_id` | `integer` | yes | — | — |
| 8 | `left_at` | `timestamp with time zone` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `community_members_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `community_members_community_id_fkey` | `FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE` |
| FOREIGN KEY | `community_members_household_id_fkey` | `FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE` |
| FOREIGN KEY | `community_members_invited_by_household_id_fkey` | `FOREIGN KEY (invited_by_household_id) REFERENCES households(id) ON DELETE SET NULL` |
| UNIQUE | `community_members_community_household_unique` | `UNIQUE (community_id, household_id)` |
| CHECK | `community_members_role_check` | `CHECK (role = ANY (ARRAY['member'::text, 'admin'::text, 'owner'::text]))` |
| CHECK | `community_members_status_check` | `CHECK (status = 'active'::text AND left_at IS NULL OR status = 'left'::text AND left_at IS NOT NULL)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `community_members_community_active_idx` | btree | no | `CREATE INDEX community_members_community_active_idx ON community_members USING btree (community_id) WHERE status = 'active'::text` |
| `community_members_community_household_unique` | btree | yes | `CREATE UNIQUE INDEX community_members_community_household_unique ON community_members USING btree (community_id, household_id)` |
| `community_members_household_active_idx` | btree | no | `CREATE INDEX community_members_household_active_idx ON community_members USING btree (household_id) WHERE status = 'active'::text` |
| `community_members_pkey` | btree | yes | `CREATE UNIQUE INDEX community_members_pkey ON community_members USING btree (id)` |

### `public.companion_action_proposals`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('companion_action_proposals_id_seq'::regclass)` | — |
| 2 | `conversation_turn_id` | `integer` | NOT NULL | — | — |
| 3 | `workflow_id` | `text` | NOT NULL | — | — |
| 4 | `capability_id` | `text` | NOT NULL | — | — |
| 5 | `verb` | `text` | NOT NULL | — | — |
| 6 | `label` | `text` | NOT NULL | — | — |
| 7 | `parameters` | `jsonb` | NOT NULL | `'{}'::jsonb` | — |
| 8 | `confirmation_tier` | `text` | NOT NULL | — | — |
| 9 | `status` | `text` | NOT NULL | `'proposed'::text` | — |
| 10 | `result_summary` | `text` | yes | — | — |
| 11 | `error_code` | `text` | yes | — | — |
| 12 | `error_message` | `text` | yes | — | — |
| 13 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 14 | `resolved_at` | `timestamp with time zone` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `companion_action_proposals_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `companion_action_proposals_conversation_turn_id_fkey` | `FOREIGN KEY (conversation_turn_id) REFERENCES conversation_turns(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `companion_action_proposals_conversation_turn_id_idx` | btree | no | `CREATE INDEX companion_action_proposals_conversation_turn_id_idx ON companion_action_proposals USING btree (conversation_turn_id)` |
| `companion_action_proposals_pkey` | btree | yes | `CREATE UNIQUE INDEX companion_action_proposals_pkey ON companion_action_proposals USING btree (id)` |
| `companion_action_proposals_workflow_id_idx` | btree | no | `CREATE INDEX companion_action_proposals_workflow_id_idx ON companion_action_proposals USING btree (workflow_id)` |

### `public.companion_guidance_events`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('companion_guidance_events_id_seq'::regclass)` | — |
| 2 | `conversation_turn_id` | `integer` | NOT NULL | — | — |
| 3 | `event_kind` | `text` | NOT NULL | — | — |
| 4 | `source_domain` | `text` | NOT NULL | — | — |
| 5 | `domain` | `text` | NOT NULL | — | — |
| 6 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 7 | `source_capability_id` | `text` | yes | — | — |
| 8 | `target_capability_id` | `text` | yes | — | — |
| 9 | `target_verb` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `companion_guidance_events_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `companion_guidance_events_conversation_turn_id_fkey` | `FOREIGN KEY (conversation_turn_id) REFERENCES conversation_turns(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `companion_guidance_events_pkey` | btree | yes | `CREATE UNIQUE INDEX companion_guidance_events_pkey ON companion_guidance_events USING btree (id)` |

### `public.companion_health_snapshots`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('companion_health_snapshots_id_seq'::regclass)` | — |
| 2 | `total_events` | `integer` | NOT NULL | — | — |
| 3 | `total_turns` | `integer` | NOT NULL | — | — |
| 4 | `by_stage` | `jsonb` | NOT NULL | — | — |
| 5 | `by_state` | `jsonb` | NOT NULL | — | — |
| 6 | `by_surface` | `jsonb` | NOT NULL | — | — |
| 7 | `gap_counts` | `jsonb` | NOT NULL | — | — |
| 8 | `top_unmatched_utterances` | `jsonb` | NOT NULL | — | — |
| 9 | `routing_failures` | `jsonb` | NOT NULL | — | — |
| 10 | `capability_gap_clusters` | `jsonb` | NOT NULL | — | — |
| 11 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `companion_health_snapshots_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `companion_health_snapshots_pkey` | btree | yes | `CREATE UNIQUE INDEX companion_health_snapshots_pkey ON companion_health_snapshots USING btree (id)` |

### `public.companion_learning_recommendations`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('companion_learning_recommendations_id_seq'::regclass)` | — |
| 2 | `snapshot_id` | `integer` | NOT NULL | — | — |
| 3 | `kind` | `text` | NOT NULL | — | — |
| 4 | `status` | `text` | NOT NULL | `'pending'::text` | — |
| 5 | `payload` | `jsonb` | NOT NULL | — | — |
| 6 | `rationale` | `text` | NOT NULL | — | — |
| 7 | `confidence` | `text` | NOT NULL | `'low'::text` | — |
| 8 | `reviewed_by` | `integer` | yes | — | — |
| 9 | `reviewed_at` | `timestamp with time zone` | yes | — | — |
| 10 | `review_notes` | `text` | yes | — | — |
| 11 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `companion_learning_recommendations_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `companion_learning_recommendations_reviewed_by_fkey` | `FOREIGN KEY (reviewed_by) REFERENCES users(id)` |
| FOREIGN KEY | `companion_learning_recommendations_snapshot_id_fkey` | `FOREIGN KEY (snapshot_id) REFERENCES companion_health_snapshots(id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `companion_learning_recommendations_pkey` | btree | yes | `CREATE UNIQUE INDEX companion_learning_recommendations_pkey ON companion_learning_recommendations USING btree (id)` |

### `public.companion_response_feedback`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('companion_response_feedback_id_seq'::regclass)` | — |
| 2 | `conversation_turn_id` | `integer` | NOT NULL | — | — |
| 3 | `rating` | `text` | NOT NULL | — | — |
| 4 | `reason_code` | `text` | yes | — | — |
| 5 | `note` | `text` | yes | — | — |
| 6 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 7 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `companion_response_feedback_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `companion_response_feedback_conversation_turn_id_fkey` | `FOREIGN KEY (conversation_turn_id) REFERENCES conversation_turns(id) ON DELETE CASCADE` |
| UNIQUE | `companion_response_feedback_conversation_turn_id_key` | `UNIQUE (conversation_turn_id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `companion_response_feedback_conversation_turn_id_key` | btree | yes | `CREATE UNIQUE INDEX companion_response_feedback_conversation_turn_id_key ON companion_response_feedback USING btree (conversation_turn_id)` |
| `companion_response_feedback_pkey` | btree | yes | `CREATE UNIQUE INDEX companion_response_feedback_pkey ON companion_response_feedback USING btree (id)` |

### `public.conversation_threads`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('conversation_threads_id_seq'::regclass)` | — |
| 2 | `conversation_id` | `integer` | NOT NULL | — | — |
| 3 | `surface` | `text` | NOT NULL | — | — |
| 4 | `opened_at` | `timestamp without time zone` | NOT NULL | `now()` | — |
| 5 | `closed_at` | `timestamp without time zone` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `conversation_threads_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `conversation_threads_conversation_id_fkey` | `FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `conversation_threads_pkey` | btree | yes | `CREATE UNIQUE INDEX conversation_threads_pkey ON conversation_threads USING btree (id)` |

### `public.conversation_turns`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('conversation_turns_id_seq'::regclass)` | — |
| 2 | `thread_id` | `integer` | NOT NULL | — | — |
| 3 | `role` | `text` | NOT NULL | — | — |
| 4 | `surface` | `text` | NOT NULL | — | — |
| 5 | `utterance` | `text` | NOT NULL | — | — |
| 6 | `resolved_intent` | `jsonb` | yes | — | — |
| 7 | `context_frame_ref` | `jsonb` | yes | — | — |
| 8 | `entity_refs` | `jsonb` | NOT NULL | `'[]'::jsonb` | — |
| 9 | `outcome_ref` | `jsonb` | yes | — | — |
| 10 | `created_at` | `timestamp without time zone` | NOT NULL | `now()` | — |
| 11 | `fallback_state` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `conversation_turns_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `conversation_turns_thread_id_fkey` | `FOREIGN KEY (thread_id) REFERENCES conversation_threads(id) ON DELETE CASCADE` |
| CHECK | `conversation_turns_role_check` | `CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text]))` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `conversation_turns_pkey` | btree | yes | `CREATE UNIQUE INDEX conversation_turns_pkey ON conversation_turns USING btree (id)` |

### `public.conversations`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('conversations_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `created_at` | `timestamp without time zone` | NOT NULL | `now()` | — |
| 4 | `updated_at` | `timestamp without time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `conversations_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `conversations_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| UNIQUE | `conversations_user_id_key` | `UNIQUE (user_id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `conversations_pkey` | btree | yes | `CREATE UNIQUE INDEX conversations_pkey ON conversations USING btree (id)` |
| `conversations_user_id_key` | btree | yes | `CREATE UNIQUE INDEX conversations_user_id_key ON conversations USING btree (user_id)` |

### `public.diets`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('diets_id_seq'::regclass)` | — |
| 2 | `name` | `text` | NOT NULL | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `diets_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `diets_name_unique` | `UNIQUE (name)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `diets_name_unique` | btree | yes | `CREATE UNIQUE INDEX diets_name_unique ON diets USING btree (name)` |
| `diets_pkey` | btree | yes | `CREATE UNIQUE INDEX diets_pkey ON diets USING btree (id)` |

### `public.diversity_group`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('diversity_group_id_seq'::regclass)` | — |
| 2 | `slug` | `text` | NOT NULL | — | — |
| 3 | `display_name` | `text` | NOT NULL | — | — |
| 4 | `description` | `text` | yes | — | — |
| 5 | `count_as_single_plant` | `boolean` | NOT NULL | `true` | — |
| 6 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 7 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 8 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 9 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `diversity_group_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `diversity_group_slug_key` | `UNIQUE (slug)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `diversity_group_pkey` | btree | yes | `CREATE UNIQUE INDEX diversity_group_pkey ON diversity_group USING btree (id)` |
| `diversity_group_slug_key` | btree | yes | `CREATE UNIQUE INDEX diversity_group_slug_key ON diversity_group USING btree (slug)` |

### `public.food_diary_days`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('food_diary_days_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `date` | `text` | NOT NULL | — | — |
| 4 | `notes` | `text` | yes | — | — |
| 5 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 6 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `food_diary_days_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `food_diary_days_user_id_users_id_fk` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| UNIQUE | `food_diary_days_user_date_unique` | `UNIQUE (user_id, date)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `food_diary_days_pkey` | btree | yes | `CREATE UNIQUE INDEX food_diary_days_pkey ON food_diary_days USING btree (id)` |
| `food_diary_days_user_date_unique` | btree | yes | `CREATE UNIQUE INDEX food_diary_days_user_date_unique ON food_diary_days USING btree (user_id, date)` |

### `public.food_diary_entries`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('food_diary_entries_id_seq'::regclass)` | — |
| 2 | `day_id` | `integer` | NOT NULL | — | — |
| 3 | `user_id` | `integer` | NOT NULL | — | — |
| 4 | `meal_slot` | `text` | NOT NULL | — | — |
| 5 | `name` | `text` | NOT NULL | — | — |
| 6 | `notes` | `text` | yes | — | — |
| 7 | `source_type` | `text` | NOT NULL | `'manual'::text` | — |
| 8 | `source_planner_entry_id` | `integer` | yes | — | — |
| 9 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `food_diary_entries_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `food_diary_entries_day_id_food_diary_days_id_fk` | `FOREIGN KEY (day_id) REFERENCES food_diary_days(id) ON DELETE CASCADE` |
| FOREIGN KEY | `food_diary_entries_user_id_users_id_fk` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `food_diary_entries_pkey` | btree | yes | `CREATE UNIQUE INDEX food_diary_entries_pkey ON food_diary_entries USING btree (id)` |

### `public.food_diary_metrics`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('food_diary_metrics_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `date` | `text` | NOT NULL | — | — |
| 4 | `weight_kg` | `real` | yes | — | — |
| 5 | `bmi` | `real` | yes | — | — |
| 6 | `mood_apples` | `integer` | yes | — | — |
| 7 | `sleep_hours` | `real` | yes | — | — |
| 8 | `energy_apples` | `integer` | yes | — | — |
| 9 | `notes` | `text` | yes | — | — |
| 10 | `stuck_to_plan` | `boolean` | yes | — | — |
| 11 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 12 | `custom_values` | `jsonb` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `food_diary_metrics_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `food_diary_metrics_user_id_users_id_fk` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| UNIQUE | `food_diary_metrics_user_date_unique` | `UNIQUE (user_id, date)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `food_diary_metrics_pkey` | btree | yes | `CREATE UNIQUE INDEX food_diary_metrics_pkey ON food_diary_metrics USING btree (id)` |
| `food_diary_metrics_user_date_unique` | btree | yes | `CREATE UNIQUE INDEX food_diary_metrics_user_date_unique ON food_diary_metrics USING btree (user_id, date)` |

### `public.food_knowledge`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('food_knowledge_id_seq'::regclass)` | — |
| 2 | `slug` | `text` | NOT NULL | — | — |
| 3 | `type` | `text` | NOT NULL | — | — |
| 4 | `title` | `text` | NOT NULL | — | — |
| 5 | `short_summary` | `text` | yes | — | — |
| 6 | `why_tha_highlights_this` | `text` | yes | — | — |
| 7 | `what_to_know` | `text` | yes | — | — |
| 8 | `who_it_matters_to` | `text` | yes | — | — |
| 9 | `simpler_alternatives` | `text` | yes | — | — |
| 10 | `tags` | `text[]` | yes | — | — |
| 11 | `source` | `text` | yes | — | — |
| 12 | `is_active` | `boolean` | NOT NULL | `true` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `food_knowledge_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `food_knowledge_slug_unique` | `UNIQUE (slug)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `food_knowledge_pkey` | btree | yes | `CREATE UNIQUE INDEX food_knowledge_pkey ON food_knowledge USING btree (id)` |
| `food_knowledge_slug_unique` | btree | yes | `CREATE UNIQUE INDEX food_knowledge_slug_unique ON food_knowledge USING btree (slug)` |

### `public.food_variety`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('food_variety_id_seq'::regclass)` | — |
| 2 | `canonical_food_id` | `integer` | NOT NULL | — | — |
| 3 | `slug` | `text` | NOT NULL | — | — |
| 4 | `name` | `text` | NOT NULL | — | — |
| 5 | `description` | `text` | yes | — | — |
| 6 | `display_order` | `integer` | NOT NULL | `0` | — |
| 7 | `status` | `text` | NOT NULL | `'active'::text` | — |
| 8 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 9 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 10 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `food_variety_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `food_variety_canonical_food_id_fkey` | `FOREIGN KEY (canonical_food_id) REFERENCES canonical_food(id) ON DELETE CASCADE` |
| UNIQUE | `food_variety_slug_key` | `UNIQUE (slug)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `food_variety_pkey` | btree | yes | `CREATE UNIQUE INDEX food_variety_pkey ON food_variety USING btree (id)` |
| `food_variety_slug_key` | btree | yes | `CREATE UNIQUE INDEX food_variety_slug_key ON food_variety USING btree (slug)` |

### `public.freezer_meals`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('freezer_meals_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `meal_id` | `integer` | NOT NULL | — | — |
| 4 | `total_portions` | `integer` | NOT NULL | `1` | — |
| 5 | `remaining_portions` | `integer` | NOT NULL | `1` | — |
| 6 | `frozen_date` | `text` | NOT NULL | — | — |
| 7 | `expiry_date` | `text` | yes | — | — |
| 8 | `batch_label` | `text` | yes | — | — |
| 9 | `notes` | `text` | yes | — | — |
| 10 | `household_id` | `integer` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `freezer_meals_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `freezer_meals_pkey` | btree | yes | `CREATE UNIQUE INDEX freezer_meals_pkey ON freezer_meals USING btree (id)` |

### `public.grocery_products`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('grocery_products_id_seq'::regclass)` | — |
| 2 | `ingredient_name` | `text` | NOT NULL | — | — |
| 3 | `name` | `text` | NOT NULL | — | — |
| 4 | `brand` | `text` | yes | — | — |
| 5 | `image_url` | `text` | yes | — | — |
| 6 | `weight` | `text` | yes | — | — |
| 7 | `supermarket` | `text` | NOT NULL | — | — |
| 8 | `tier` | `text` | NOT NULL | `'standard'::text` | — |
| 9 | `price` | `real` | yes | — | — |
| 10 | `currency` | `text` | NOT NULL | `'GBP'::text` | — |
| 11 | `product_url` | `text` | yes | — | — |
| 12 | `price_per_unit` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `grocery_products_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `grocery_products_pkey` | btree | yes | `CREATE UNIQUE INDEX grocery_products_pkey ON grocery_products USING btree (id)` |

### `public.household_eaters`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('household_eaters_id_seq'::regclass)` | — |
| 2 | `household_id` | `integer` | NOT NULL | — | — |
| 3 | `display_name` | `text` | NOT NULL | — | — |
| 4 | `user_id` | `integer` | yes | — | — |
| 5 | `default_diet_types` | `text[]` | yes | — | — |
| 6 | `hard_restrictions` | `text[]` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `household_eaters_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `household_eaters_household_id_households_id_fk` | `FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE` |
| FOREIGN KEY | `household_eaters_user_id_users_id_fk` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `household_eaters_household_user_uniq` | btree | yes | `CREATE UNIQUE INDEX household_eaters_household_user_uniq ON household_eaters USING btree (household_id, user_id) WHERE user_id IS NOT NULL` |
| `household_eaters_pkey` | btree | yes | `CREATE UNIQUE INDEX household_eaters_pkey ON household_eaters USING btree (id)` |

### `public.household_evidence_events`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('household_evidence_events_id_seq'::regclass)` | — |
| 2 | `household_id` | `integer` | NOT NULL | — | — |
| 3 | `domain` | `text` | NOT NULL | — | — |
| 4 | `subject_type` | `text` | NOT NULL | — | — |
| 5 | `subject_id` | `text` | NOT NULL | — | — |
| 6 | `subject_key` | `text` | NOT NULL | — | — |
| 7 | `outcome_type` | `text` | NOT NULL | — | — |
| 8 | `direction` | `text` | NOT NULL | — | — |
| 9 | `context` | `jsonb` | yes | — | — |
| 10 | `source_capability_id` | `text` | NOT NULL | — | — |
| 11 | `occurred_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 12 | `recorded_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `household_evidence_events_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `household_evidence_events_household_id_fkey` | `FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `household_evidence_events_household_occurred_idx` | btree | no | `CREATE INDEX household_evidence_events_household_occurred_idx ON household_evidence_events USING btree (household_id, occurred_at)` |
| `household_evidence_events_household_subject_idx` | btree | no | `CREATE INDEX household_evidence_events_household_subject_idx ON household_evidence_events USING btree (household_id, domain, subject_type, subject_key)` |
| `household_evidence_events_pkey` | btree | yes | `CREATE UNIQUE INDEX household_evidence_events_pkey ON household_evidence_events USING btree (id)` |

### `public.household_invitations`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('household_invitations_id_seq'::regclass)` | — |
| 2 | `token` | `text` | NOT NULL | — | — |
| 3 | `invited_by_household_id` | `integer` | NOT NULL | — | — |
| 4 | `invited_email` | `text` | NOT NULL | — | — |
| 5 | `kind` | `text` | NOT NULL | `'tha'::text` | — |
| 6 | `community_id` | `integer` | yes | — | — |
| 7 | `status` | `text` | NOT NULL | `'pending'::text` | — |
| 8 | `expires_at` | `timestamp with time zone` | NOT NULL | — | — |
| 9 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 10 | `responded_at` | `timestamp with time zone` | yes | — | — |
| 11 | `accepted_by_household_id` | `integer` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `household_invitations_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `household_invitations_accepted_by_household_id_fkey` | `FOREIGN KEY (accepted_by_household_id) REFERENCES households(id) ON DELETE SET NULL` |
| FOREIGN KEY | `household_invitations_community_id_fkey` | `FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE` |
| FOREIGN KEY | `household_invitations_invited_by_household_id_fkey` | `FOREIGN KEY (invited_by_household_id) REFERENCES households(id) ON DELETE CASCADE` |
| CHECK | `household_invitations_accepted_by_check` | `CHECK (status = 'accepted'::text AND accepted_by_household_id IS NOT NULL OR status <> 'accepted'::text AND accepted_by_household_id IS NULL)` |
| CHECK | `household_invitations_community_check` | `CHECK (kind = 'community'::text AND community_id IS NOT NULL OR kind = 'tha'::text AND community_id IS NULL)` |
| CHECK | `household_invitations_kind_check` | `CHECK (kind = ANY (ARRAY['tha'::text, 'community'::text]))` |
| CHECK | `household_invitations_responded_check` | `CHECK (status = 'pending'::text AND responded_at IS NULL OR status <> 'pending'::text AND responded_at IS NOT NULL)` |
| CHECK | `household_invitations_status_check` | `CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'revoked'::text, 'expired'::text]))` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `household_invitations_email_idx` | btree | no | `CREATE INDEX household_invitations_email_idx ON household_invitations USING btree (invited_email)` |
| `household_invitations_inviter_idx` | btree | no | `CREATE INDEX household_invitations_inviter_idx ON household_invitations USING btree (invited_by_household_id)` |
| `household_invitations_pending_idx` | btree | no | `CREATE INDEX household_invitations_pending_idx ON household_invitations USING btree (invited_email, status) WHERE status = 'pending'::text` |
| `household_invitations_pkey` | btree | yes | `CREATE UNIQUE INDEX household_invitations_pkey ON household_invitations USING btree (id)` |
| `household_invitations_token_key` | btree | yes | `CREATE UNIQUE INDEX household_invitations_token_key ON household_invitations USING btree (token)` |

### `public.household_learning_signals`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('household_learning_signals_id_seq'::regclass)` | — |
| 2 | `household_id` | `integer` | NOT NULL | — | — |
| 3 | `domain` | `text` | NOT NULL | — | — |
| 4 | `subject_type` | `text` | NOT NULL | — | — |
| 5 | `subject_key` | `text` | NOT NULL | — | — |
| 6 | `direction` | `text` | NOT NULL | — | — |
| 7 | `evidence_count` | `integer` | NOT NULL | — | — |
| 8 | `consistency` | `real` | NOT NULL | — | — |
| 9 | `confidence` | `text` | NOT NULL | — | — |
| 10 | `supporting_event_ids` | `jsonb` | NOT NULL | — | — |
| 11 | `rationale` | `text` | NOT NULL | — | — |
| 12 | `status` | `text` | NOT NULL | `'pending_confirmation'::text` | — |
| 13 | `detected_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 14 | `last_evaluated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 15 | `confirmed_by_user_id` | `integer` | yes | — | — |
| 16 | `confirmed_at` | `timestamp with time zone` | yes | — | — |
| 17 | `confirmation_notes` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `household_learning_signals_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `household_learning_signals_confirmed_by_user_id_fkey` | `FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id)` |
| FOREIGN KEY | `household_learning_signals_household_id_fkey` | `FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE` |
| UNIQUE | `household_learning_signals_dimension_unique` | `UNIQUE (household_id, domain, subject_type, subject_key, direction)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `household_learning_signals_dimension_unique` | btree | yes | `CREATE UNIQUE INDEX household_learning_signals_dimension_unique ON household_learning_signals USING btree (household_id, domain, subject_type, subject_key, direction)` |
| `household_learning_signals_household_status_idx` | btree | no | `CREATE INDEX household_learning_signals_household_status_idx ON household_learning_signals USING btree (household_id, status)` |
| `household_learning_signals_pkey` | btree | yes | `CREATE UNIQUE INDEX household_learning_signals_pkey ON household_learning_signals USING btree (id)` |

### `public.household_members`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('household_members_id_seq'::regclass)` | — |
| 2 | `household_id` | `integer` | NOT NULL | — | — |
| 3 | `user_id` | `integer` | NOT NULL | — | — |
| 4 | `role` | `text` | NOT NULL | `'member'::text` | — |
| 5 | `status` | `text` | NOT NULL | `'active'::text` | — |
| 6 | `joined_at` | `timestamp with time zone` | yes | — | — |
| 7 | `invited_by_user_id` | `integer` | yes | — | — |
| 8 | `left_at` | `timestamp with time zone` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `household_members_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `household_members_household_id_households_id_fk` | `FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE` |
| FOREIGN KEY | `household_members_user_id_users_id_fk` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| UNIQUE | `household_members_household_user_unique` | `UNIQUE (household_id, user_id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `household_members_household_user_unique` | btree | yes | `CREATE UNIQUE INDEX household_members_household_user_unique ON household_members USING btree (household_id, user_id)` |
| `household_members_pkey` | btree | yes | `CREATE UNIQUE INDEX household_members_pkey ON household_members USING btree (id)` |

### `public.households`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('households_id_seq'::regclass)` | — |
| 2 | `name` | `text` | NOT NULL | — | — |
| 3 | `invite_code` | `text` | NOT NULL | — | — |
| 4 | `created_by_user_id` | `integer` | yes | — | — |
| 5 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 6 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 7 | `time_zone` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `households_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `households_invite_code_unique` | `UNIQUE (invite_code)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `households_invite_code_unique` | btree | yes | `CREATE UNIQUE INDEX households_invite_code_unique ON households USING btree (invite_code)` |
| `households_pkey` | btree | yes | `CREATE UNIQUE INDEX households_pkey ON households USING btree (id)` |

### `public.ingredient_classifications`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('ingredient_classifications_id_seq'::regclass)` | — |
| 2 | `normalized_key` | `text` | NOT NULL | — | — |
| 3 | `canonical_name` | `text` | NOT NULL | — | — |
| 4 | `canonical_key` | `text` | NOT NULL | — | — |
| 5 | `category` | `text` | NOT NULL | — | — |
| 6 | `subcategory` | `text` | yes | — | — |
| 7 | `aliases` | `text` | yes | — | — |
| 8 | `source` | `text` | NOT NULL | `'ai'::text` | — |
| 9 | `ai_confidence` | `text` | yes | — | — |
| 10 | `ai_model` | `text` | yes | — | — |
| 11 | `review_status` | `text` | NOT NULL | `'pending'::text` | — |
| 12 | `notes` | `text` | yes | — | — |
| 13 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 14 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `ingredient_classifications_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `ingredient_classifications_normalized_key_key` | `UNIQUE (normalized_key)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `idx_ic_normalized_key` | btree | no | `CREATE INDEX idx_ic_normalized_key ON ingredient_classifications USING btree (normalized_key)` |
| `idx_ic_review_status` | btree | no | `CREATE INDEX idx_ic_review_status ON ingredient_classifications USING btree (review_status)` |
| `ingredient_classifications_normalized_key_key` | btree | yes | `CREATE UNIQUE INDEX ingredient_classifications_normalized_key_key ON ingredient_classifications USING btree (normalized_key)` |
| `ingredient_classifications_pkey` | btree | yes | `CREATE UNIQUE INDEX ingredient_classifications_pkey ON ingredient_classifications USING btree (id)` |

### `public.ingredient_products`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('ingredient_products_id_seq'::regclass)` | — |
| 2 | `ingredient_key` | `text` | NOT NULL | — | — |
| 3 | `product_name` | `text` | NOT NULL | — | — |
| 4 | `retailer` | `text` | NOT NULL | — | — |
| 5 | `size` | `text` | yes | — | — |
| 6 | `notes` | `text` | yes | — | — |
| 7 | `tags` | `jsonb` | yes | — | — |
| 8 | `priority` | `integer` | NOT NULL | `0` | — |
| 9 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 10 | `created_by` | `integer` | yes | — | — |
| 11 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `ingredient_products_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `ingredient_products_created_by_users_id_fk` | `FOREIGN KEY (created_by) REFERENCES users(id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `idx_ingredient_products_active` | btree | no | `CREATE INDEX idx_ingredient_products_active ON ingredient_products USING btree (is_active)` |
| `idx_ingredient_products_key` | btree | no | `CREATE INDEX idx_ingredient_products_key ON ingredient_products USING btree (ingredient_key)` |
| `ingredient_products_pkey` | btree | yes | `CREATE UNIQUE INDEX ingredient_products_pkey ON ingredient_products USING btree (id)` |
| `uniq_ingredient_products_key_name_retailer` | btree | yes | `CREATE UNIQUE INDEX uniq_ingredient_products_key_name_retailer ON ingredient_products USING btree (ingredient_key, product_name, retailer)` |

### `public.ingredient_sources`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('ingredient_sources_id_seq'::regclass)` | — |
| 2 | `shopping_list_item_id` | `integer` | NOT NULL | — | — |
| 3 | `meal_id` | `integer` | NOT NULL | — | — |
| 4 | `meal_name` | `text` | NOT NULL | — | — |
| 5 | `quantity_multiplier` | `integer` | NOT NULL | `1` | — |
| 6 | `week_number` | `integer` | yes | — | — |
| 7 | `day_of_week` | `integer` | yes | — | — |
| 8 | `meal_slot` | `text` | yes | — | — |
| 9 | `eater_ids` | `integer[]` | yes | — | — |
| 10 | `guest_eaters` | `jsonb` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `ingredient_sources_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `ingredient_sources_pkey` | btree | yes | `CREATE UNIQUE INDEX ingredient_sources_pkey ON ingredient_sources USING btree (id)` |

### `public.ingredient_swaps`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('ingredient_swaps_id_seq'::regclass)` | — |
| 2 | `original` | `text` | NOT NULL | — | — |
| 3 | `healthier` | `text` | NOT NULL | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `ingredient_swaps_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `ingredient_swaps_pkey` | btree | yes | `CREATE UNIQUE INDEX ingredient_swaps_pkey ON ingredient_swaps USING btree (id)` |

### `public.knowledge_food_benefits`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_food_benefits_id_seq'::regclass)` | — |
| 2 | `food_slug` | `text` | NOT NULL | — | — |
| 3 | `benefit_slug` | `text` | NOT NULL | — | — |
| 4 | `evidence_strength` | `text` | NOT NULL | `'emerging'::text` | — |
| 5 | `ranking` | `integer` | NOT NULL | `0` | — |
| 6 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 7 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 8 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 9 | `source_refs` | `jsonb` | NOT NULL | `'[]'::jsonb` | — |
| 10 | `reviewed_at` | `timestamp with time zone` | yes | — | — |
| 11 | `reviewed_by` | `text` | yes | — | — |
| 12 | `rejected_at` | `timestamp with time zone` | yes | — | — |
| 13 | `rejected_by` | `text` | yes | — | — |
| 14 | `rejection_reason` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_food_benefits_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `knowledge_food_benefits_benefit_slug_fkey` | `FOREIGN KEY (benefit_slug) REFERENCES knowledge_health_benefits(slug) ON DELETE CASCADE` |
| FOREIGN KEY | `knowledge_food_benefits_food_slug_fkey` | `FOREIGN KEY (food_slug) REFERENCES knowledge_foods(slug) ON DELETE CASCADE` |
| UNIQUE | `uq_knowledge_food_benefit` | `UNIQUE (food_slug, benefit_slug)` |
| CHECK | `knowledge_food_benefits_rejection_attributed_check` | `CHECK (rejected_at IS NULL OR rejected_by IS NOT NULL AND btrim(COALESCE(rejection_reason, ''::text)) <> ''::text)` |
| CHECK | `knowledge_food_benefits_review_exclusive_check` | `CHECK (reviewed_at IS NULL OR rejected_at IS NULL)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_food_benefits_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_food_benefits_pkey ON knowledge_food_benefits USING btree (id)` |
| `knowledge_food_benefits_review_state_idx` | btree | no | `CREATE INDEX knowledge_food_benefits_review_state_idx ON knowledge_food_benefits USING btree (reviewed_at, rejected_at) WHERE is_active` |
| `uq_knowledge_food_benefit` | btree | yes | `CREATE UNIQUE INDEX uq_knowledge_food_benefit ON knowledge_food_benefits USING btree (food_slug, benefit_slug)` |

### `public.knowledge_food_nutrients`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_food_nutrients_id_seq'::regclass)` | — |
| 2 | `food_slug` | `text` | NOT NULL | — | — |
| 3 | `nutrient_slug` | `text` | NOT NULL | — | — |
| 4 | `amount` | `text` | yes | — | — |
| 5 | `confidence` | `text` | NOT NULL | `'established'::text` | — |
| 6 | `ranking` | `integer` | NOT NULL | `0` | — |
| 7 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 8 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 9 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 10 | `source_refs` | `jsonb` | NOT NULL | `'[]'::jsonb` | — |
| 11 | `reviewed_at` | `timestamp with time zone` | yes | — | — |
| 12 | `reviewed_by` | `text` | yes | — | — |
| 13 | `rejected_at` | `timestamp with time zone` | yes | — | — |
| 14 | `rejected_by` | `text` | yes | — | — |
| 15 | `rejection_reason` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_food_nutrients_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `knowledge_food_nutrients_food_slug_fkey` | `FOREIGN KEY (food_slug) REFERENCES knowledge_foods(slug) ON DELETE CASCADE` |
| FOREIGN KEY | `knowledge_food_nutrients_nutrient_slug_fkey` | `FOREIGN KEY (nutrient_slug) REFERENCES knowledge_nutrients(slug) ON DELETE CASCADE` |
| UNIQUE | `uq_knowledge_food_nutrient` | `UNIQUE (food_slug, nutrient_slug)` |
| CHECK | `knowledge_food_nutrients_rejection_attributed_check` | `CHECK (rejected_at IS NULL OR rejected_by IS NOT NULL AND btrim(COALESCE(rejection_reason, ''::text)) <> ''::text)` |
| CHECK | `knowledge_food_nutrients_review_exclusive_check` | `CHECK (reviewed_at IS NULL OR rejected_at IS NULL)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_food_nutrients_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_food_nutrients_pkey ON knowledge_food_nutrients USING btree (id)` |
| `knowledge_food_nutrients_review_state_idx` | btree | no | `CREATE INDEX knowledge_food_nutrients_review_state_idx ON knowledge_food_nutrients USING btree (reviewed_at, rejected_at) WHERE is_active` |
| `uq_knowledge_food_nutrient` | btree | yes | `CREATE UNIQUE INDEX uq_knowledge_food_nutrient ON knowledge_food_nutrients USING btree (food_slug, nutrient_slug)` |

### `public.knowledge_food_preparations`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_food_preparations_id_seq'::regclass)` | — |
| 2 | `food_slug` | `text` | NOT NULL | — | — |
| 3 | `preparation_slug` | `text` | NOT NULL | — | — |
| 4 | `ranking` | `integer` | NOT NULL | `0` | — |
| 5 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 6 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 7 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_food_preparations_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `knowledge_food_preparations_food_slug_fkey` | `FOREIGN KEY (food_slug) REFERENCES knowledge_foods(slug) ON DELETE CASCADE` |
| FOREIGN KEY | `knowledge_food_preparations_preparation_slug_fkey` | `FOREIGN KEY (preparation_slug) REFERENCES knowledge_preparations(slug) ON DELETE CASCADE` |
| UNIQUE | `uq_knowledge_food_preparation` | `UNIQUE (food_slug, preparation_slug)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_food_preparations_food_idx` | btree | no | `CREATE INDEX knowledge_food_preparations_food_idx ON knowledge_food_preparations USING btree (food_slug)` |
| `knowledge_food_preparations_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_food_preparations_pkey ON knowledge_food_preparations USING btree (id)` |
| `uq_knowledge_food_preparation` | btree | yes | `CREATE UNIQUE INDEX uq_knowledge_food_preparation ON knowledge_food_preparations USING btree (food_slug, preparation_slug)` |

### `public.knowledge_foods`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_foods_id_seq'::regclass)` | — |
| 2 | `slug` | `text` | NOT NULL | — | — |
| 3 | `name` | `text` | NOT NULL | — | — |
| 4 | `category` | `text` | NOT NULL | — | — |
| 5 | `subcategory` | `text` | yes | — | — |
| 6 | `aliases` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 7 | `description` | `text` | yes | — | — |
| 8 | `image_url` | `text` | yes | — | — |
| 9 | `common_forms` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 10 | `storage_guidance` | `text` | yes | — | — |
| 11 | `seasonality` | `text` | yes | — | — |
| 12 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 13 | `display_order` | `integer` | NOT NULL | `0` | — |
| 14 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 15 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_foods_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `knowledge_foods_slug_key` | `UNIQUE (slug)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_foods_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_foods_pkey ON knowledge_foods USING btree (id)` |
| `knowledge_foods_slug_key` | btree | yes | `CREATE UNIQUE INDEX knowledge_foods_slug_key ON knowledge_foods USING btree (slug)` |

### `public.knowledge_health_benefits`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_health_benefits_id_seq'::regclass)` | — |
| 2 | `slug` | `text` | NOT NULL | — | — |
| 3 | `name` | `text` | NOT NULL | — | — |
| 4 | `description` | `text` | yes | — | — |
| 5 | `icon` | `text` | yes | — | — |
| 6 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 7 | `display_order` | `integer` | NOT NULL | `0` | — |
| 8 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 9 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_health_benefits_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `knowledge_health_benefits_slug_key` | `UNIQUE (slug)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_health_benefits_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_health_benefits_pkey ON knowledge_health_benefits USING btree (id)` |
| `knowledge_health_benefits_slug_key` | btree | yes | `CREATE UNIQUE INDEX knowledge_health_benefits_slug_key ON knowledge_health_benefits USING btree (slug)` |

### `public.knowledge_nutrient_benefits`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_nutrient_benefits_id_seq'::regclass)` | — |
| 2 | `nutrient_slug` | `text` | NOT NULL | — | — |
| 3 | `benefit_slug` | `text` | NOT NULL | — | — |
| 4 | `evidence_strength` | `text` | NOT NULL | `'emerging'::text` | — |
| 5 | `ranking` | `integer` | NOT NULL | `0` | — |
| 6 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 7 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 8 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 9 | `source_refs` | `jsonb` | NOT NULL | `'[]'::jsonb` | — |
| 10 | `reviewed_at` | `timestamp with time zone` | yes | — | — |
| 11 | `reviewed_by` | `text` | yes | — | — |
| 12 | `rejected_at` | `timestamp with time zone` | yes | — | — |
| 13 | `rejected_by` | `text` | yes | — | — |
| 14 | `rejection_reason` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_nutrient_benefits_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `knowledge_nutrient_benefits_benefit_slug_fkey` | `FOREIGN KEY (benefit_slug) REFERENCES knowledge_health_benefits(slug) ON DELETE CASCADE` |
| FOREIGN KEY | `knowledge_nutrient_benefits_nutrient_slug_fkey` | `FOREIGN KEY (nutrient_slug) REFERENCES knowledge_nutrients(slug) ON DELETE CASCADE` |
| UNIQUE | `uq_knowledge_nutrient_benefit` | `UNIQUE (nutrient_slug, benefit_slug)` |
| CHECK | `knowledge_nutrient_benefits_rejection_attributed_check` | `CHECK (rejected_at IS NULL OR rejected_by IS NOT NULL AND btrim(COALESCE(rejection_reason, ''::text)) <> ''::text)` |
| CHECK | `knowledge_nutrient_benefits_review_exclusive_check` | `CHECK (reviewed_at IS NULL OR rejected_at IS NULL)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_nutrient_benefits_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_nutrient_benefits_pkey ON knowledge_nutrient_benefits USING btree (id)` |
| `knowledge_nutrient_benefits_review_state_idx` | btree | no | `CREATE INDEX knowledge_nutrient_benefits_review_state_idx ON knowledge_nutrient_benefits USING btree (reviewed_at, rejected_at) WHERE is_active` |
| `uq_knowledge_nutrient_benefit` | btree | yes | `CREATE UNIQUE INDEX uq_knowledge_nutrient_benefit ON knowledge_nutrient_benefits USING btree (nutrient_slug, benefit_slug)` |

### `public.knowledge_nutrients`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_nutrients_id_seq'::regclass)` | — |
| 2 | `slug` | `text` | NOT NULL | — | — |
| 3 | `name` | `text` | NOT NULL | — | — |
| 4 | `description` | `text` | yes | — | — |
| 5 | `category` | `text` | yes | — | — |
| 6 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 7 | `display_order` | `integer` | NOT NULL | `0` | — |
| 8 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 9 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 10 | `family` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_nutrients_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `knowledge_nutrients_slug_key` | `UNIQUE (slug)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_nutrients_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_nutrients_pkey ON knowledge_nutrients USING btree (id)` |
| `knowledge_nutrients_slug_key` | btree | yes | `CREATE UNIQUE INDEX knowledge_nutrients_slug_key ON knowledge_nutrients USING btree (slug)` |

### `public.knowledge_preparation_effects`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_preparation_effects_id_seq'::regclass)` | — |
| 2 | `food_slug` | `text` | NOT NULL | — | — |
| 3 | `preparation_slug` | `text` | NOT NULL | — | — |
| 4 | `effect_kind` | `text` | NOT NULL | — | — |
| 5 | `target_slug` | `text` | yes | — | — |
| 6 | `direction` | `text` | NOT NULL | — | — |
| 7 | `approved_wording` | `text` | NOT NULL | — | — |
| 8 | `uncertainty_note` | `text` | yes | — | — |
| 9 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 10 | `source_refs` | `jsonb` | NOT NULL | `'[]'::jsonb` | — |
| 11 | `reviewed_at` | `timestamp with time zone` | yes | — | — |
| 12 | `reviewed_by` | `text` | yes | — | — |
| 13 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 14 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 15 | `rejected_at` | `timestamp with time zone` | yes | — | — |
| 16 | `rejected_by` | `text` | yes | — | — |
| 17 | `rejection_reason` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_preparation_effects_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `knowledge_preparation_effects_food_slug_fkey` | `FOREIGN KEY (food_slug) REFERENCES knowledge_foods(slug) ON DELETE CASCADE` |
| FOREIGN KEY | `knowledge_preparation_effects_preparation_slug_fkey` | `FOREIGN KEY (preparation_slug) REFERENCES knowledge_preparations(slug) ON DELETE CASCADE` |
| UNIQUE | `uq_knowledge_preparation_effect` | `UNIQUE (food_slug, preparation_slug, effect_kind, target_slug)` |
| CHECK | `knowledge_preparation_effects_rejection_attributed_check` | `CHECK (rejected_at IS NULL OR rejected_by IS NOT NULL AND btrim(COALESCE(rejection_reason, ''::text)) <> ''::text)` |
| CHECK | `knowledge_preparation_effects_review_exclusive_check` | `CHECK (reviewed_at IS NULL OR rejected_at IS NULL)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_preparation_effects_food_idx` | btree | no | `CREATE INDEX knowledge_preparation_effects_food_idx ON knowledge_preparation_effects USING btree (food_slug)` |
| `knowledge_preparation_effects_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_preparation_effects_pkey ON knowledge_preparation_effects USING btree (id)` |
| `knowledge_preparation_effects_review_state_idx` | btree | no | `CREATE INDEX knowledge_preparation_effects_review_state_idx ON knowledge_preparation_effects USING btree (reviewed_at, rejected_at) WHERE is_active` |
| `uq_knowledge_preparation_effect` | btree | yes | `CREATE UNIQUE INDEX uq_knowledge_preparation_effect ON knowledge_preparation_effects USING btree (food_slug, preparation_slug, effect_kind, target_slug)` |

### `public.knowledge_preparations`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_preparations_id_seq'::regclass)` | — |
| 2 | `slug` | `text` | NOT NULL | — | — |
| 3 | `name` | `text` | NOT NULL | — | — |
| 4 | `prep_type` | `text` | NOT NULL | — | — |
| 5 | `description` | `text` | yes | — | — |
| 6 | `family` | `text` | yes | — | — |
| 7 | `source` | `text` | NOT NULL | `'THA editorial'::text` | — |
| 8 | `display_order` | `integer` | NOT NULL | `0` | — |
| 9 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 10 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_preparations_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `knowledge_preparations_slug_key` | `UNIQUE (slug)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_preparations_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_preparations_pkey ON knowledge_preparations USING btree (id)` |
| `knowledge_preparations_slug_key` | btree | yes | `CREATE UNIQUE INDEX knowledge_preparations_slug_key ON knowledge_preparations USING btree (slug)` |

### `public.knowledge_releases`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_releases_id_seq'::regclass)` | — |
| 2 | `published_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 3 | `approved_by_user_id` | `integer` | yes | — | — |
| 4 | `approved_by_user_ids` | `jsonb` | NOT NULL | `'[]'::jsonb` | — |
| 5 | `published_by_user_id` | `integer` | yes | — | — |
| 6 | `aliases_published` | `integer` | NOT NULL | `0` | — |
| 7 | `new_entities` | `integer` | NOT NULL | `0` | — |
| 8 | `updated_entities` | `integer` | NOT NULL | `0` | — |
| 9 | `rejected_proposals` | `integer` | NOT NULL | `0` | — |
| 10 | `deferred_proposals` | `integer` | NOT NULL | `0` | — |
| 11 | `linked_batch_ids` | `jsonb` | NOT NULL | `'[]'::jsonb` | — |
| 12 | `linked_proposal_ids` | `jsonb` | NOT NULL | `'[]'::jsonb` | — |
| 13 | `rollback_id` | `integer` | yes | — | — |
| 14 | `notes` | `text` | yes | — | — |
| 15 | `status` | `text` | NOT NULL | `'published'::text` | — |
| 16 | `rolled_back_at` | `timestamp with time zone` | yes | — | — |
| 17 | `rolled_back_by_user_id` | `integer` | yes | — | — |
| 18 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_releases_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `knowledge_releases_approved_by_user_id_fkey` | `FOREIGN KEY (approved_by_user_id) REFERENCES users(id)` |
| FOREIGN KEY | `knowledge_releases_published_by_user_id_fkey` | `FOREIGN KEY (published_by_user_id) REFERENCES users(id)` |
| FOREIGN KEY | `knowledge_releases_rolled_back_by_user_id_fkey` | `FOREIGN KEY (rolled_back_by_user_id) REFERENCES users(id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_releases_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_releases_pkey ON knowledge_releases USING btree (id)` |

### `public.knowledge_review_audit`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_review_audit_id_seq'::regclass)` | — |
| 2 | `entity` | `text` | NOT NULL | — | — |
| 3 | `entity_id` | `integer` | yes | — | — |
| 4 | `action` | `text` | NOT NULL | — | — |
| 5 | `actor_kind` | `text` | NOT NULL | `'human'::text` | — |
| 6 | `actor_user_id` | `integer` | yes | — | — |
| 7 | `release_id` | `integer` | yes | — | — |
| 8 | `before` | `jsonb` | yes | — | — |
| 9 | `after` | `jsonb` | yes | — | — |
| 10 | `detail` | `text` | yes | — | — |
| 11 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_review_audit_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `knowledge_review_audit_actor_user_id_fkey` | `FOREIGN KEY (actor_user_id) REFERENCES users(id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `idx_knowledge_review_audit_entity` | btree | no | `CREATE INDEX idx_knowledge_review_audit_entity ON knowledge_review_audit USING btree (entity, entity_id)` |
| `idx_knowledge_review_audit_release` | btree | no | `CREATE INDEX idx_knowledge_review_audit_release ON knowledge_review_audit USING btree (release_id)` |
| `knowledge_review_audit_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_review_audit_pkey ON knowledge_review_audit USING btree (id)` |

### `public.knowledge_review_batches`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_review_batches_id_seq'::regclass)` | — |
| 2 | `direction` | `text` | NOT NULL | `'import'::text` | — |
| 3 | `format` | `text` | NOT NULL | `'json'::text` | — |
| 4 | `schema_version` | `text` | yes | — | — |
| 5 | `checksum` | `text` | yes | — | — |
| 6 | `exported_at` | `timestamp with time zone` | yes | — | — |
| 7 | `reviewer_model` | `text` | yes | — | — |
| 8 | `source_filename` | `text` | yes | — | — |
| 9 | `item_count` | `integer` | NOT NULL | `0` | — |
| 10 | `proposal_count` | `integer` | NOT NULL | `0` | — |
| 11 | `status` | `text` | NOT NULL | `'imported'::text` | — |
| 12 | `notes` | `text` | yes | — | — |
| 13 | `created_by_user_id` | `integer` | yes | — | — |
| 14 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_review_batches_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `knowledge_review_batches_created_by_user_id_fkey` | `FOREIGN KEY (created_by_user_id) REFERENCES users(id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_review_batches_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_review_batches_pkey ON knowledge_review_batches USING btree (id)` |

### `public.knowledge_review_decisions`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_review_decisions_id_seq'::regclass)` | — |
| 2 | `batch_id` | `integer` | NOT NULL | — | — |
| 3 | `term_id` | `integer` | NOT NULL | — | — |
| 4 | `review_type` | `text` | NOT NULL | `'vocabulary'::text` | — |
| 5 | `domain` | `text` | yes | — | — |
| 6 | `decision_type` | `text` | NOT NULL | — | — |
| 7 | `target_canonical_slug` | `text` | yes | — | — |
| 8 | `alias_string` | `text` | yes | — | — |
| 9 | `proposed_new_slug` | `text` | yes | — | — |
| 10 | `proposed_new_name` | `text` | yes | — | — |
| 11 | `proposed_new_description` | `text` | yes | — | — |
| 12 | `rationale` | `text` | yes | — | — |
| 13 | `confidence` | `text` | yes | — | — |
| 14 | `reviewer_model` | `text` | yes | — | — |
| 15 | `reviewer_notes` | `text` | yes | — | — |
| 16 | `original_context` | `jsonb` | NOT NULL | `'{}'::jsonb` | — |
| 17 | `status` | `text` | NOT NULL | `'proposed'::text` | — |
| 18 | `approved_by_user_id` | `integer` | yes | — | — |
| 19 | `approved_at` | `timestamp with time zone` | yes | — | — |
| 20 | `rejected_at` | `timestamp with time zone` | yes | — | — |
| 21 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 22 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 23 | `reviewer` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_review_decisions_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `knowledge_review_decisions_approved_by_user_id_fkey` | `FOREIGN KEY (approved_by_user_id) REFERENCES users(id)` |
| FOREIGN KEY | `knowledge_review_decisions_batch_id_fkey` | `FOREIGN KEY (batch_id) REFERENCES knowledge_review_batches(id) ON DELETE CASCADE` |
| FOREIGN KEY | `knowledge_review_decisions_term_id_fkey` | `FOREIGN KEY (term_id) REFERENCES knowledge_review_queue(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `idx_knowledge_review_decision_batch` | btree | no | `CREATE INDEX idx_knowledge_review_decision_batch ON knowledge_review_decisions USING btree (batch_id, status)` |
| `idx_knowledge_review_decision_term` | btree | no | `CREATE INDEX idx_knowledge_review_decision_term ON knowledge_review_decisions USING btree (term_id)` |
| `knowledge_review_decisions_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_review_decisions_pkey ON knowledge_review_decisions USING btree (id)` |

### `public.knowledge_review_queue`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_review_queue_id_seq'::regclass)` | — |
| 2 | `review_type` | `text` | NOT NULL | `'vocabulary'::text` | — |
| 3 | `domain` | `text` | NOT NULL | — | — |
| 4 | `dedupe_key` | `text` | NOT NULL | — | — |
| 5 | `label` | `text` | NOT NULL | — | — |
| 6 | `source` | `text` | NOT NULL | — | — |
| 7 | `contexts` | `jsonb` | NOT NULL | `'[]'::jsonb` | — |
| 8 | `details` | `jsonb` | NOT NULL | `'{}'::jsonb` | — |
| 9 | `occurrence_count` | `integer` | NOT NULL | `1` | — |
| 10 | `status` | `text` | NOT NULL | `'unresolved'::text` | — |
| 11 | `first_seen_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 12 | `last_seen_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 13 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 14 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 15 | `priority` | `text` | yes | — | — |
| 16 | `knowledge_origin` | `text` | yes | — | — |
| 17 | `review_notes` | `text` | yes | — | — |
| 18 | `suggested_canonical_slug` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_review_queue_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `uq_knowledge_review_item` | `UNIQUE (review_type, domain, dedupe_key)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `idx_knowledge_review_type` | btree | no | `CREATE INDEX idx_knowledge_review_type ON knowledge_review_queue USING btree (review_type, status)` |
| `knowledge_review_queue_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_review_queue_pkey ON knowledge_review_queue USING btree (id)` |
| `uq_knowledge_review_item` | btree | yes | `CREATE UNIQUE INDEX uq_knowledge_review_item ON knowledge_review_queue USING btree (review_type, domain, dedupe_key)` |

### `public.knowledge_rollback_points`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_rollback_points_id_seq'::regclass)` | — |
| 2 | `release_id` | `integer` | yes | — | — |
| 3 | `snapshot` | `jsonb` | NOT NULL | `'{}'::jsonb` | — |
| 4 | `status` | `text` | NOT NULL | `'active'::text` | — |
| 5 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 6 | `consumed_at` | `timestamp with time zone` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_rollback_points_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_rollback_points_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_rollback_points_pkey ON knowledge_rollback_points USING btree (id)` |

### `public.knowledge_vocabulary_aliases`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('knowledge_vocabulary_aliases_id_seq'::regclass)` | — |
| 2 | `kind` | `text` | NOT NULL | — | — |
| 3 | `alias_normalised` | `text` | NOT NULL | — | — |
| 4 | `canonical_slug` | `text` | NOT NULL | — | — |
| 5 | `decision_id` | `integer` | yes | — | — |
| 6 | `release_id` | `integer` | yes | — | — |
| 7 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 8 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 9 | `deactivated_at` | `timestamp with time zone` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `knowledge_vocabulary_aliases_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `knowledge_vocabulary_aliases_decision_id_fkey` | `FOREIGN KEY (decision_id) REFERENCES knowledge_review_decisions(id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `knowledge_vocabulary_aliases_pkey` | btree | yes | `CREATE UNIQUE INDEX knowledge_vocabulary_aliases_pkey ON knowledge_vocabulary_aliases USING btree (id)` |
| `uq_knowledge_vocab_alias_active` | btree | yes | `CREATE UNIQUE INDEX uq_knowledge_vocab_alias_active ON knowledge_vocabulary_aliases USING btree (kind, alias_normalised) WHERE is_active` |

### `public.meal_allergens`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('meal_allergens_id_seq'::regclass)` | — |
| 2 | `meal_id` | `integer` | NOT NULL | — | — |
| 3 | `allergen` | `text` | NOT NULL | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meal_allergens_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `meal_allergens_pkey` | btree | yes | `CREATE UNIQUE INDEX meal_allergens_pkey ON meal_allergens USING btree (id)` |

### `public.meal_categories`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('meal_categories_id_seq'::regclass)` | — |
| 2 | `name` | `text` | NOT NULL | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meal_categories_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `meal_categories_name_unique` | `UNIQUE (name)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `meal_categories_name_unique` | btree | yes | `CREATE UNIQUE INDEX meal_categories_name_unique ON meal_categories USING btree (name)` |
| `meal_categories_pkey` | btree | yes | `CREATE UNIQUE INDEX meal_categories_pkey ON meal_categories USING btree (id)` |

### `public.meal_diets`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('meal_diets_id_seq'::regclass)` | — |
| 2 | `meal_id` | `integer` | NOT NULL | — | — |
| 3 | `diet_id` | `integer` | NOT NULL | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meal_diets_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `meal_diets_pkey` | btree | yes | `CREATE UNIQUE INDEX meal_diets_pkey ON meal_diets USING btree (id)` |

### `public.meal_items`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('meal_items_id_seq'::regclass)` | — |
| 2 | `meal_id` | `integer` | NOT NULL | — | — |
| 3 | `type` | `text` | NOT NULL | — | — |
| 4 | `reference_id` | `integer` | yes | — | — |
| 5 | `name` | `text` | NOT NULL | — | — |
| 6 | `quantity` | `text` | yes | — | — |
| 7 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meal_items_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `meal_items_meal_id_meals_id_fk` | `FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `idx_meal_items_meal_id` | btree | no | `CREATE INDEX idx_meal_items_meal_id ON meal_items USING btree (meal_id)` |
| `meal_items_pkey` | btree | yes | `CREATE UNIQUE INDEX meal_items_pkey ON meal_items USING btree (id)` |

### `public.meal_pairings`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('meal_pairings_id_seq'::regclass)` | — |
| 2 | `base_meal_id` | `integer` | NOT NULL | — | — |
| 3 | `suggested_meal_id` | `integer` | NOT NULL | — | — |
| 4 | `note` | `text` | yes | — | — |
| 5 | `priority` | `integer` | NOT NULL | `0` | — |
| 6 | `created_by` | `integer` | yes | — | — |
| 7 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meal_pairings_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `meal_pairings_base_meal_id_meals_id_fk` | `FOREIGN KEY (base_meal_id) REFERENCES meals(id) ON DELETE CASCADE` |
| FOREIGN KEY | `meal_pairings_created_by_users_id_fk` | `FOREIGN KEY (created_by) REFERENCES users(id)` |
| FOREIGN KEY | `meal_pairings_suggested_meal_id_meals_id_fk` | `FOREIGN KEY (suggested_meal_id) REFERENCES meals(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `meal_pairings_base_meal_idx` | btree | no | `CREATE INDEX meal_pairings_base_meal_idx ON meal_pairings USING btree (base_meal_id, priority DESC)` |
| `meal_pairings_pkey` | btree | yes | `CREATE UNIQUE INDEX meal_pairings_pkey ON meal_pairings USING btree (id)` |

### `public.meal_plan_entries`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('meal_plan_entries_id_seq'::regclass)` | — |
| 2 | `plan_id` | `integer` | NOT NULL | — | — |
| 3 | `day_of_week` | `integer` | NOT NULL | — | — |
| 4 | `slot` | `text` | NOT NULL | — | — |
| 5 | `meal_id` | `integer` | NOT NULL | — | — |
| 6 | `meal_template_id` | `integer` | yes | — | — |
| 7 | `resolved_source_type` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meal_plan_entries_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `meal_plan_entries_pkey` | btree | yes | `CREATE UNIQUE INDEX meal_plan_entries_pkey ON meal_plan_entries USING btree (id)` |

### `public.meal_plan_template_items`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `character varying` | NOT NULL | `gen_random_uuid()` | — |
| 2 | `template_id` | `character varying` | NOT NULL | — | — |
| 3 | `week_number` | `integer` | NOT NULL | — | — |
| 4 | `day_of_week` | `integer` | NOT NULL | — | — |
| 5 | `meal_slot` | `text` | NOT NULL | — | — |
| 6 | `meal_id` | `integer` | NOT NULL | — | — |
| 7 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meal_plan_template_items_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `meal_plan_template_items_template_id_meal_plan_templates_id_fk` | `FOREIGN KEY (template_id) REFERENCES meal_plan_templates(id) ON DELETE CASCADE` |
| UNIQUE | `meal_plan_template_items_template_id_week_number_day_of_week_me` | `UNIQUE (template_id, week_number, day_of_week, meal_slot)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `meal_plan_template_items_pkey` | btree | yes | `CREATE UNIQUE INDEX meal_plan_template_items_pkey ON meal_plan_template_items USING btree (id)` |
| `meal_plan_template_items_template_id_week_number_day_of_week_me` | btree | yes | `CREATE UNIQUE INDEX meal_plan_template_items_template_id_week_number_day_of_week_me ON meal_plan_template_items USING btree (template_id, week_number, day_of_week, meal_slot)` |

### `public.meal_plan_templates`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `character varying` | NOT NULL | `gen_random_uuid()` | — |
| 2 | `name` | `text` | NOT NULL | — | — |
| 3 | `description` | `text` | yes | — | — |
| 4 | `is_default` | `boolean` | NOT NULL | `false` | — |
| 5 | `is_premium` | `boolean` | NOT NULL | `false` | — |
| 6 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 7 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 8 | `owner_user_id` | `integer` | yes | — | — |
| 9 | `season` | `text` | yes | — | — |
| 10 | `status` | `text` | NOT NULL | `'published'::text` | — |
| 11 | `created_by` | `integer` | yes | — | — |
| 12 | `published_at` | `timestamp with time zone` | yes | — | — |
| 13 | `share_token` | `text` | yes | — | — |
| 14 | `visibility` | `text` | NOT NULL | `'private'::text` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meal_plan_templates_pkey` | `PRIMARY KEY (id)` |
| CHECK | `meal_plan_templates_visibility_check` | `CHECK (visibility = ANY (ARRAY['private'::text, 'shared'::text]))` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `meal_plan_templates_owner_idx` | btree | no | `CREATE INDEX meal_plan_templates_owner_idx ON meal_plan_templates USING btree (owner_user_id)` |
| `meal_plan_templates_pkey` | btree | yes | `CREATE UNIQUE INDEX meal_plan_templates_pkey ON meal_plan_templates USING btree (id)` |
| `meal_plan_templates_share_token_idx` | btree | yes | `CREATE UNIQUE INDEX meal_plan_templates_share_token_idx ON meal_plan_templates USING btree (share_token) WHERE share_token IS NOT NULL` |
| `meal_plan_templates_status_idx` | btree | no | `CREATE INDEX meal_plan_templates_status_idx ON meal_plan_templates USING btree (status)` |

### `public.meal_plans`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('meal_plans_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `week_start` | `text` | NOT NULL | — | — |
| 4 | `name` | `text` | NOT NULL | — | — |
| 5 | `calorie_target` | `integer` | yes | — | — |
| 6 | `people_count` | `integer` | NOT NULL | `1` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meal_plans_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `meal_plans_pkey` | btree | yes | `CREATE UNIQUE INDEX meal_plans_pkey ON meal_plans USING btree (id)` |

### `public.meal_templates`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('meal_templates_id_seq'::regclass)` | — |
| 2 | `name` | `text` | NOT NULL | — | — |
| 3 | `category` | `text` | NOT NULL | `'dinner'::text` | — |
| 4 | `description` | `text` | yes | — | — |
| 5 | `image_url` | `text` | yes | — | — |
| 6 | `default_calories` | `integer` | yes | — | — |
| 7 | `default_protein` | `integer` | yes | — | — |
| 8 | `default_carbs` | `integer` | yes | — | — |
| 9 | `default_fat` | `integer` | yes | — | — |
| 10 | `title` | `text` | yes | — | — |
| 11 | `cuisine` | `text` | yes | — | — |
| 12 | `shared_base_components` | `text[]` | yes | — | — |
| 13 | `protein_slots` | `text[]` | yes | — | — |
| 14 | `carb_slots` | `text[]` | yes | — | — |
| 15 | `veg_slots` | `text[]` | yes | — | — |
| 16 | `topping_slots` | `text[]` | yes | — | — |
| 17 | `sauce_slots` | `text[]` | yes | — | — |
| 18 | `compatible_diets` | `text[]` | yes | — | — |
| 19 | `estimated_total_time` | `integer` | yes | — | — |
| 20 | `estimated_extra_time_per_variant` | `integer` | yes | — | — |
| 21 | `cost_band` | `text` | yes | — | — |
| 22 | `is_active` | `boolean` | NOT NULL | `true` | — |
| 23 | `primary_slot` | `text` | yes | — | — |
| 24 | `suitable_slots` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 25 | `energy_band` | `text` | yes | — | — |
| 26 | `style_tags` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 27 | `nutrition_opportunities` | `text[]` | NOT NULL | `'{}'::text[]` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meal_templates_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `meal_templates_pkey` | btree | yes | `CREATE UNIQUE INDEX meal_templates_pkey ON meal_templates USING btree (id)` |

### `public.meal_uplift_applications`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('meal_uplift_applications_id_seq'::regclass)` | — |
| 2 | `meal_id` | `integer` | NOT NULL | — | — |
| 3 | `user_id` | `integer` | NOT NULL | — | — |
| 4 | `rule_id` | `text` | NOT NULL | — | — |
| 5 | `rule_name` | `text` | NOT NULL | — | — |
| 6 | `ingredient` | `text` | NOT NULL | — | — |
| 7 | `action` | `text` | NOT NULL | — | — |
| 8 | `quantity` | `text` | yes | — | — |
| 9 | `explanation` | `text` | NOT NULL | — | — |
| 10 | `added_by` | `text` | NOT NULL | `'tha_uplift'::text` | — |
| 11 | `planner_entry_id` | `integer` | yes | — | — |
| 12 | `forked_from_meal_id` | `integer` | yes | — | — |
| 13 | `status` | `text` | NOT NULL | `'accepted'::text` | — |
| 14 | `accepted_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 15 | `removed_at` | `timestamp with time zone` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meal_uplift_applications_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `meal_uplift_applications_meal_id_fkey` | `FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE` |
| FOREIGN KEY | `meal_uplift_applications_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `meal_uplift_applications_pkey` | btree | yes | `CREATE UNIQUE INDEX meal_uplift_applications_pkey ON meal_uplift_applications USING btree (id)` |
| `mua_meal_id_idx` | btree | no | `CREATE INDEX mua_meal_id_idx ON meal_uplift_applications USING btree (meal_id)` |
| `mua_meal_status_idx` | btree | no | `CREATE INDEX mua_meal_status_idx ON meal_uplift_applications USING btree (meal_id, status)` |
| `mua_user_id_idx` | btree | no | `CREATE INDEX mua_user_id_idx ON meal_uplift_applications USING btree (user_id)` |

### `public.meals`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('meals_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `name` | `text` | NOT NULL | — | — |
| 4 | `ingredients` | `text[]` | NOT NULL | — | — |
| 5 | `image_url` | `text` | yes | — | — |
| 6 | `servings` | `integer` | NOT NULL | `1` | — |
| 7 | `category_id` | `integer` | yes | — | — |
| 8 | `instructions` | `text[]` | yes | — | — |
| 9 | `source_url` | `text` | yes | — | — |
| 10 | `meal_template_id` | `integer` | yes | — | — |
| 11 | `meal_source_type` | `text` | NOT NULL | `'scratch'::text` | — |
| 12 | `is_ready_meal` | `boolean` | NOT NULL | `false` | — |
| 13 | `is_system_meal` | `boolean` | NOT NULL | `false` | — |
| 14 | `meal_format` | `text` | NOT NULL | `'recipe'::text` | — |
| 15 | `diet_types` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 16 | `is_freezer_eligible` | `boolean` | NOT NULL | `true` | — |
| 17 | `audience` | `text` | NOT NULL | `'adult'::text` | — |
| 18 | `is_drink` | `boolean` | NOT NULL | `false` | — |
| 19 | `drink_type` | `text` | yes | — | — |
| 20 | `barcode` | `text` | yes | — | — |
| 21 | `brand` | `text` | yes | — | — |
| 22 | `original_meal_id` | `integer` | yes | — | — |
| 23 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 24 | `kind` | `text` | NOT NULL | `'meal'::text` | — |
| 25 | `is_household_safe_variant` | `boolean` | NOT NULL | `false` | — |
| 26 | `household_safe_for` | `jsonb` | yes | — | — |
| 27 | `variant_kind` | `text` | yes | — | — |
| 28 | `show_in_cookbook` | `boolean` | NOT NULL | `false` | — |
| 29 | `primary_slot` | `text` | yes | — | — |
| 30 | `suitable_slots` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 31 | `energy_band` | `text` | yes | — | — |
| 32 | `style_tags` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 33 | `acquisition_lane` | `text` | yes | — | — |
| 34 | `acquisition_type` | `text` | yes | — | — |
| 35 | `acquisition_source_key` | `text` | yes | — | — |
| 36 | `licence_ref` | `text` | yes | — | — |
| 37 | `attribution_text` | `text` | yes | — | — |
| 38 | `retired_at` | `timestamp with time zone` | yes | — | — |
| 39 | `retired_reason` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `meals_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `meals_meal_template_id_fkey` | `FOREIGN KEY (meal_template_id) REFERENCES meal_templates(id) ON DELETE SET NULL` |
| FOREIGN KEY | `meals_meal_template_id_meal_templates_id_fk` | `FOREIGN KEY (meal_template_id) REFERENCES meal_templates(id)` |
| CHECK | `meals_retirement_check` | `CHECK (retired_at IS NULL AND retired_reason IS NULL OR retired_at IS NOT NULL AND retired_reason IS NOT NULL)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `meals_household_safe_variant_idx` | btree | no | `CREATE INDEX meals_household_safe_variant_idx ON meals USING btree (user_id, is_household_safe_variant) WHERE is_household_safe_variant = true` |
| `meals_live_idx` | btree | no | `CREATE INDEX meals_live_idx ON meals USING btree (id) WHERE retired_at IS NULL` |
| `meals_pkey` | btree | yes | `CREATE UNIQUE INDEX meals_pkey ON meals USING btree (id)` |
| `meals_tha_original_source_key_uniq` | btree | yes | `CREATE UNIQUE INDEX meals_tha_original_source_key_uniq ON meals USING btree (acquisition_source_key) WHERE is_system_meal = true AND acquisition_source_key ~~ 'tha_original:%'::text` |
| `meals_variant_kind_idx` | btree | no | `CREATE INDEX meals_variant_kind_idx ON meals USING btree (user_id, variant_kind) WHERE variant_kind IS NOT NULL` |

### `public.normalized_ingredients`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('normalized_ingredients_id_seq'::regclass)` | — |
| 2 | `name` | `text` | NOT NULL | — | — |
| 3 | `normalized_name` | `text` | NOT NULL | — | — |
| 4 | `category` | `text` | NOT NULL | `'other'::text` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `normalized_ingredients_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `normalized_ingredients_pkey` | btree | yes | `CREATE UNIQUE INDEX normalized_ingredients_pkey ON normalized_ingredients USING btree (id)` |

### `public.nutrition`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('nutrition_id_seq'::regclass)` | — |
| 2 | `meal_id` | `integer` | NOT NULL | — | — |
| 3 | `calories` | `text` | yes | — | — |
| 4 | `protein` | `text` | yes | — | — |
| 5 | `carbs` | `text` | yes | — | — |
| 6 | `fat` | `text` | yes | — | — |
| 7 | `sugar` | `text` | yes | — | — |
| 8 | `salt` | `text` | yes | — | — |
| 9 | `source` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `nutrition_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `nutrition_pkey` | btree | yes | `CREATE UNIQUE INDEX nutrition_pkey ON nutrition USING btree (id)` |

### `public.opportunity_deliveries`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('opportunity_deliveries_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `opportunity_id` | `text` | NOT NULL | — | — |
| 4 | `capability_id` | `text` | NOT NULL | — | — |
| 5 | `domain` | `text` | NOT NULL | — | — |
| 6 | `type` | `text` | NOT NULL | — | — |
| 7 | `priority` | `text` | NOT NULL | — | — |
| 8 | `surface` | `text` | NOT NULL | — | — |
| 9 | `status` | `text` | NOT NULL | `'delivered'::text` | — |
| 10 | `delivered_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 11 | `resolved_at` | `timestamp with time zone` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `opportunity_deliveries_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `opportunity_deliveries_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| UNIQUE | `opportunity_deliveries_user_opportunity_unique` | `UNIQUE (user_id, opportunity_id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `opportunity_deliveries_pkey` | btree | yes | `CREATE UNIQUE INDEX opportunity_deliveries_pkey ON opportunity_deliveries USING btree (id)` |
| `opportunity_deliveries_user_opportunity_unique` | btree | yes | `CREATE UNIQUE INDEX opportunity_deliveries_user_opportunity_unique ON opportunity_deliveries USING btree (user_id, opportunity_id)` |
| `opportunity_deliveries_user_status_idx` | btree | no | `CREATE INDEX opportunity_deliveries_user_status_idx ON opportunity_deliveries USING btree (user_id, status)` |

### `public.pantry_ingredient_knowledge`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('pantry_ingredient_knowledge_id_seq'::regclass)` | — |
| 2 | `ingredient_key` | `text` | NOT NULL | — | — |
| 3 | `supports` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 4 | `why_it_matters` | `text` | yes | — | — |
| 5 | `good_to_know` | `text` | yes | — | — |
| 6 | `how_to_choose` | `text[]` | yes | — | — |
| 7 | `tags` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 8 | `last_enriched_at` | `timestamp with time zone` | yes | — | — |
| 9 | `enrichment_source` | `text` | NOT NULL | `'manual'::text` | — |
| 10 | `enrichment_version` | `integer` | NOT NULL | `1` | — |
| 11 | `is_locked` | `boolean` | NOT NULL | `false` | — |
| 12 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 13 | `highlights` | `text[]` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `pantry_ingredient_knowledge_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `pantry_ingredient_knowledge_ingredient_key_key` | `UNIQUE (ingredient_key)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `pantry_ingredient_knowledge_ingredient_key_key` | btree | yes | `CREATE UNIQUE INDEX pantry_ingredient_knowledge_ingredient_key_key ON pantry_ingredient_knowledge USING btree (ingredient_key)` |
| `pantry_ingredient_knowledge_pkey` | btree | yes | `CREATE UNIQUE INDEX pantry_ingredient_knowledge_pkey ON pantry_ingredient_knowledge USING btree (id)` |

### `public.planner_days`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('planner_days_id_seq'::regclass)` | — |
| 2 | `week_id` | `integer` | NOT NULL | — | — |
| 3 | `day_of_week` | `integer` | NOT NULL | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `planner_days_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `planner_days_week_day_unique` | `UNIQUE (week_id, day_of_week)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `planner_days_pkey` | btree | yes | `CREATE UNIQUE INDEX planner_days_pkey ON planner_days USING btree (id)` |
| `planner_days_week_day_unique` | btree | yes | `CREATE UNIQUE INDEX planner_days_week_day_unique ON planner_days USING btree (week_id, day_of_week)` |

### `public.planner_entries`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('planner_entries_id_seq'::regclass)` | — |
| 2 | `day_id` | `integer` | NOT NULL | — | — |
| 3 | `meal_type` | `text` | NOT NULL | — | — |
| 4 | `audience` | `text` | NOT NULL | `'adult'::text` | — |
| 5 | `meal_id` | `integer` | NOT NULL | — | — |
| 6 | `calories` | `integer` | yes | `0` | — |
| 7 | `is_drink` | `boolean` | NOT NULL | `false` | — |
| 8 | `drink_type` | `text` | yes | — | — |
| 9 | `position` | `integer` | NOT NULL | `0` | — |
| 10 | `adaptation_result` | `jsonb` | yes | — | — |
| 11 | `guest_eaters` | `jsonb` | yes | — | — |
| 12 | `original_meal_id_before_variant` | `integer` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `planner_entries_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `planner_entries_original_meal_id_before_variant_fkey` | `FOREIGN KEY (original_meal_id_before_variant) REFERENCES meals(id) ON DELETE SET NULL` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `planner_entries_pkey` | btree | yes | `CREATE UNIQUE INDEX planner_entries_pkey ON planner_entries USING btree (id)` |

### `public.planner_entry_eaters`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('planner_entry_eaters_id_seq'::regclass)` | — |
| 2 | `entry_id` | `integer` | NOT NULL | — | — |
| 3 | `household_eater_id` | `integer` | NOT NULL | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `planner_entry_eaters_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `planner_entry_eaters_entry_id_planner_entries_id_fk` | `FOREIGN KEY (entry_id) REFERENCES planner_entries(id) ON DELETE CASCADE` |
| FOREIGN KEY | `planner_entry_eaters_household_eater_id_household_eaters_id_fk` | `FOREIGN KEY (household_eater_id) REFERENCES household_eaters(id) ON DELETE CASCADE` |
| UNIQUE | `planner_entry_eaters_entry_member_unique` | `UNIQUE (entry_id, household_eater_id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `planner_entry_eaters_entry_member_unique` | btree | yes | `CREATE UNIQUE INDEX planner_entry_eaters_entry_member_unique ON planner_entry_eaters USING btree (entry_id, household_eater_id)` |
| `planner_entry_eaters_pkey` | btree | yes | `CREATE UNIQUE INDEX planner_entry_eaters_pkey ON planner_entry_eaters USING btree (id)` |

### `public.planner_week_eater_overrides`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('planner_week_eater_overrides_id_seq'::regclass)` | — |
| 2 | `week_id` | `integer` | NOT NULL | — | — |
| 3 | `eater_id` | `integer` | NOT NULL | — | — |
| 4 | `diet_types` | `text[]` | NOT NULL | `'{}'::text[]` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `planner_week_eater_overrides_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `planner_week_eater_overrides_eater_id_household_eaters_id_fk` | `FOREIGN KEY (eater_id) REFERENCES household_eaters(id) ON DELETE CASCADE` |
| FOREIGN KEY | `planner_week_eater_overrides_week_id_planner_weeks_id_fk` | `FOREIGN KEY (week_id) REFERENCES planner_weeks(id) ON DELETE CASCADE` |
| UNIQUE | `pweo_week_eater_unique` | `UNIQUE (week_id, eater_id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `planner_week_eater_overrides_pkey` | btree | yes | `CREATE UNIQUE INDEX planner_week_eater_overrides_pkey ON planner_week_eater_overrides USING btree (id)` |
| `pweo_week_eater_unique` | btree | yes | `CREATE UNIQUE INDEX pweo_week_eater_unique ON planner_week_eater_overrides USING btree (week_id, eater_id)` |

### `public.planner_weeks`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('planner_weeks_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `week_number` | `integer` | NOT NULL | — | — |
| 4 | `week_name` | `text` | NOT NULL | — | — |
| 5 | `household_id` | `integer` | yes | — | — |
| 6 | `week_start_date` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `planner_weeks_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `planner_weeks_user_week_unique` | `UNIQUE (user_id, week_number)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `planner_weeks_household_start_date_idx` | btree | no | `CREATE INDEX planner_weeks_household_start_date_idx ON planner_weeks USING btree (household_id, week_start_date)` |
| `planner_weeks_pkey` | btree | yes | `CREATE UNIQUE INDEX planner_weeks_pkey ON planner_weeks USING btree (id)` |
| `planner_weeks_user_week_unique` | btree | yes | `CREATE UNIQUE INDEX planner_weeks_user_week_unique ON planner_weeks USING btree (user_id, week_number)` |

### `public.platform_observations`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('platform_observations_id_seq'::regclass)` | — |
| 2 | `observed_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 3 | `kind` | `text` | NOT NULL | — | — |
| 4 | `severity` | `text` | NOT NULL | `'info'::text` | — |
| 5 | `outcome` | `text` | yes | — | — |
| 6 | `user_id` | `integer` | yes | — | — |
| 7 | `session_id` | `text` | yes | — | — |
| 8 | `surface` | `text` | yes | — | — |
| 9 | `capability` | `text` | yes | — | — |
| 10 | `verb` | `text` | yes | — | — |
| 11 | `intent` | `text` | yes | — | — |
| 12 | `context_view` | `text` | yes | — | — |
| 13 | `confidence` | `real` | yes | — | — |
| 14 | `duration_ms` | `integer` | yes | — | — |
| 15 | `recovery_path` | `text` | yes | — | — |
| 16 | `metadata` | `jsonb` | NOT NULL | `'{}'::jsonb` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `platform_observations_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `platform_observations_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `platform_observations_capability_idx` | btree | no | `CREATE INDEX platform_observations_capability_idx ON platform_observations USING btree (capability)` |
| `platform_observations_kind_observed_at_idx` | btree | no | `CREATE INDEX platform_observations_kind_observed_at_idx ON platform_observations USING btree (kind, observed_at)` |
| `platform_observations_observed_at_idx` | btree | no | `CREATE INDEX platform_observations_observed_at_idx ON platform_observations USING btree (observed_at)` |
| `platform_observations_pkey` | btree | yes | `CREATE UNIQUE INDEX platform_observations_pkey ON platform_observations USING btree (id)` |
| `platform_observations_session_idx` | btree | no | `CREATE INDEX platform_observations_session_idx ON platform_observations USING btree (session_id)` |

### `public.platform_turn_outcomes`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('platform_turn_outcomes_id_seq'::regclass)` | — |
| 2 | `stage` | `text` | NOT NULL | — | — |
| 3 | `state` | `text` | yes | — | — |
| 4 | `gap_kind` | `text` | yes | — | — |
| 5 | `surface` | `text` | NOT NULL | — | — |
| 6 | `utterance` | `text` | NOT NULL | — | — |
| 7 | `intents` | `jsonb` | NOT NULL | `'[]'::jsonb` | — |
| 8 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `platform_turn_outcomes_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `platform_turn_outcomes_created_at_idx` | btree | no | `CREATE INDEX platform_turn_outcomes_created_at_idx ON platform_turn_outcomes USING btree (created_at)` |
| `platform_turn_outcomes_pkey` | btree | yes | `CREATE UNIQUE INDEX platform_turn_outcomes_pkey ON platform_turn_outcomes USING btree (id)` |
| `platform_turn_outcomes_state_idx` | btree | no | `CREATE INDEX platform_turn_outcomes_state_idx ON platform_turn_outcomes USING btree (state)` |

### `public.privacy_activity_log`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('privacy_activity_log_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | yes | — | — |
| 3 | `action` | `text` | NOT NULL | — | — |
| 4 | `detail` | `jsonb` | yes | — | — |
| 5 | `occurred_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `privacy_activity_log_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `privacy_activity_log_action_idx` | btree | no | `CREATE INDEX privacy_activity_log_action_idx ON privacy_activity_log USING btree (action, occurred_at)` |
| `privacy_activity_log_pkey` | btree | yes | `CREATE UNIQUE INDEX privacy_activity_log_pkey ON privacy_activity_log USING btree (id)` |
| `privacy_activity_log_user_id_idx` | btree | no | `CREATE INDEX privacy_activity_log_user_id_idx ON privacy_activity_log USING btree (user_id)` |

### `public.product_additives`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('product_additives_id_seq'::regclass)` | — |
| 2 | `product_barcode` | `text` | NOT NULL | — | — |
| 3 | `additive_id` | `integer` | NOT NULL | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `product_additives_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `product_additives_pkey` | btree | yes | `CREATE UNIQUE INDEX product_additives_pkey ON product_additives USING btree (id)` |

### `public.product_events`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('product_events_id_seq'::regclass)` | — |
| 2 | `event_type` | `text` | NOT NULL | — | — |
| 3 | `feature_area` | `text` | NOT NULL | — | — |
| 4 | `user_id` | `integer` | NOT NULL | — | — |
| 5 | `household_id` | `integer` | NOT NULL | — | — |
| 6 | `meal_id` | `integer` | yes | — | — |
| 7 | `planner_entry_id` | `integer` | yes | — | — |
| 8 | `pantry_item_id` | `integer` | yes | — | — |
| 9 | `basket_item_id` | `integer` | yes | — | — |
| 10 | `product_id` | `integer` | yes | — | — |
| 11 | `metadata` | `jsonb` | yes | — | — |
| 12 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `product_events_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `product_events_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `product_events_created_at_idx` | btree | no | `CREATE INDEX product_events_created_at_idx ON product_events USING btree (created_at)` |
| `product_events_event_type_idx` | btree | no | `CREATE INDEX product_events_event_type_idx ON product_events USING btree (event_type)` |
| `product_events_pkey` | btree | yes | `CREATE UNIQUE INDEX product_events_pkey ON product_events USING btree (id)` |
| `product_events_user_id_idx` | btree | no | `CREATE INDEX product_events_user_id_idx ON product_events USING btree (user_id)` |

### `public.product_history`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('product_history_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `barcode` | `text` | yes | — | — |
| 4 | `product_name` | `text` | NOT NULL | — | — |
| 5 | `brand` | `text` | yes | — | — |
| 6 | `image_url` | `text` | yes | — | — |
| 7 | `nova_group` | `integer` | yes | — | — |
| 8 | `nutriscore_grade` | `text` | yes | — | — |
| 9 | `smp_rating` | `integer` | yes | — | — |
| 10 | `upf_score` | `integer` | yes | — | — |
| 11 | `health_score` | `integer` | yes | — | — |
| 12 | `scanned_at` | `text` | NOT NULL | — | — |
| 13 | `source` | `text` | NOT NULL | `'search'::text` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `product_history_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `product_history_pkey` | btree | yes | `CREATE UNIQUE INDEX product_history_pkey ON product_history USING btree (id)` |

### `public.product_matches`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('product_matches_id_seq'::regclass)` | — |
| 2 | `shopping_list_item_id` | `integer` | NOT NULL | — | — |
| 3 | `supermarket` | `text` | NOT NULL | — | — |
| 4 | `product_name` | `text` | NOT NULL | — | — |
| 5 | `price` | `real` | yes | — | — |
| 6 | `price_per_unit` | `text` | yes | — | — |
| 7 | `product_url` | `text` | yes | — | — |
| 8 | `image_url` | `text` | yes | — | — |
| 9 | `currency` | `text` | NOT NULL | `'GBP'::text` | — |
| 10 | `tier` | `text` | NOT NULL | `'standard'::text` | — |
| 11 | `product_weight` | `text` | yes | — | — |
| 12 | `tesco_product_id` | `text` | yes | — | — |
| 13 | `sainsburys_product_id` | `text` | yes | — | — |
| 14 | `ocado_product_id` | `text` | yes | — | — |
| 15 | `smp_rating` | `integer` | yes | — | — |
| 16 | `price_source` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `product_matches_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `product_matches_pkey` | btree | yes | `CREATE UNIQUE INDEX product_matches_pkey ON product_matches USING btree (id)` |

### `public.recipe_source_audit_log`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('recipe_source_audit_log_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | yes | — | — |
| 3 | `action` | `text` | NOT NULL | — | — |
| 4 | `source_name` | `text` | NOT NULL | — | — |
| 5 | `url_or_query` | `text` | yes | — | — |
| 6 | `reason` | `text` | NOT NULL | — | — |
| 7 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `recipe_source_audit_log_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `recipe_source_audit_log_user_id_users_id_fk` | `FOREIGN KEY (user_id) REFERENCES users(id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `recipe_source_audit_log_pkey` | btree | yes | `CREATE UNIQUE INDEX recipe_source_audit_log_pkey ON recipe_source_audit_log USING btree (id)` |

### `public.recipe_source_settings`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('recipe_source_settings_id_seq'::regclass)` | — |
| 2 | `source_key` | `text` | NOT NULL | — | — |
| 3 | `enabled` | `boolean` | NOT NULL | `true` | — |
| 4 | `source_type` | `text` | NOT NULL | — | — |
| 5 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 6 | `admin_updated_at` | `timestamp with time zone` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `recipe_source_settings_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `recipe_source_settings_source_key_unique` | `UNIQUE (source_key)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `recipe_source_settings_pkey` | btree | yes | `CREATE UNIQUE INDEX recipe_source_settings_pkey ON recipe_source_settings USING btree (id)` |
| `recipe_source_settings_source_key_unique` | btree | yes | `CREATE UNIQUE INDEX recipe_source_settings_source_key_unique ON recipe_source_settings USING btree (source_key)` |

### `public.referral_attributions`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('referral_attributions_id_seq'::regclass)` | — |
| 2 | `referrer_household_id` | `integer` | NOT NULL | — | — |
| 3 | `referred_household_id` | `integer` | NOT NULL | — | — |
| 4 | `invitation_id` | `integer` | yes | — | — |
| 5 | `status` | `text` | NOT NULL | `'recorded'::text` | — |
| 6 | `recorded_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 7 | `verified_at` | `timestamp with time zone` | yes | — | — |
| 8 | `eligible_at` | `timestamp with time zone` | yes | — | — |
| 9 | `entitlement_processed_at` | `timestamp with time zone` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `referral_attributions_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `referral_attributions_invitation_id_fkey` | `FOREIGN KEY (invitation_id) REFERENCES household_invitations(id) ON DELETE SET NULL` |
| FOREIGN KEY | `referral_attributions_referred_household_id_fkey` | `FOREIGN KEY (referred_household_id) REFERENCES households(id) ON DELETE CASCADE` |
| FOREIGN KEY | `referral_attributions_referrer_household_id_fkey` | `FOREIGN KEY (referrer_household_id) REFERENCES households(id) ON DELETE CASCADE` |
| CHECK | `referral_attributions_ladder_check` | `CHECK (status = 'recorded'::text AND verified_at IS NULL AND eligible_at IS NULL AND entitlement_processed_at IS NULL OR status = 'verified'::text AND verified_at IS NOT NULL AND eligible_at IS NULL AND entitlement_processed_at IS NULL OR status = 'eligible'::text AND verified_at IS NOT NULL AND eligible_at IS NOT NULL AND entitlement_processed_at IS NULL OR status = 'entitlement_processed'::text AND verified_at IS NOT NULL AND eligible_at IS NOT NULL AND entitlement_processed_at IS NOT NULL OR status = 'void'::text)` |
| CHECK | `referral_attributions_not_self_check` | `CHECK (referrer_household_id <> referred_household_id)` |
| CHECK | `referral_attributions_status_check` | `CHECK (status = ANY (ARRAY['recorded'::text, 'verified'::text, 'eligible'::text, 'entitlement_processed'::text, 'void'::text]))` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `referral_attributions_pkey` | btree | yes | `CREATE UNIQUE INDEX referral_attributions_pkey ON referral_attributions USING btree (id)` |
| `referral_attributions_referred_key` | btree | yes | `CREATE UNIQUE INDEX referral_attributions_referred_key ON referral_attributions USING btree (referred_household_id)` |
| `referral_attributions_referrer_idx` | btree | no | `CREATE INDEX referral_attributions_referrer_idx ON referral_attributions USING btree (referrer_household_id)` |

### `public.savings_events`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('savings_events_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `date` | `text` | NOT NULL | — | — |
| 4 | `type` | `text` | NOT NULL | — | — |
| 5 | `amount` | `real` | NOT NULL | — | — |
| 6 | `source_id` | `integer` | yes | — | — |
| 7 | `source_type` | `text` | yes | — | — |
| 8 | `note` | `text` | yes | — | — |
| 9 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `savings_events_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `savings_events_user_id_users_id_fk` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `idx_savings_events_source` | btree | yes | `CREATE UNIQUE INDEX idx_savings_events_source ON savings_events USING btree (user_id, source_type, source_id) WHERE source_id IS NOT NULL AND source_type IS NOT NULL` |
| `idx_savings_events_user_date` | btree | no | `CREATE INDEX idx_savings_events_user_date ON savings_events USING btree (user_id, date)` |
| `idx_savings_events_user_id` | btree | no | `CREATE INDEX idx_savings_events_user_id ON savings_events USING btree (user_id)` |
| `savings_events_pkey` | btree | yes | `CREATE UNIQUE INDEX savings_events_pkey ON savings_events USING btree (id)` |

### `public.schema_migrations`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `text` | NOT NULL | — | — |
| 2 | `applied_at` | `timestamp without time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `schema_migrations_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `schema_migrations_pkey` | btree | yes | `CREATE UNIQUE INDEX schema_migrations_pkey ON schema_migrations USING btree (id)` |

### `public.session`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `sid` | `character varying` | NOT NULL | — | — |
| 2 | `sess` | `json` | NOT NULL | — | — |
| 3 | `expire` | `timestamp(6) without time zone` | NOT NULL | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `session_pkey` | `PRIMARY KEY (sid)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `IDX_session_expire` | btree | no | `CREATE INDEX "IDX_session_expire" ON session USING btree (expire)` |
| `session_pkey` | btree | yes | `CREATE UNIQUE INDEX session_pkey ON session USING btree (sid)` |

### `public.shopping_fulfilment_memory`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('shopping_fulfilment_memory_id_seq'::regclass)` | — |
| 2 | `household_id` | `integer` | NOT NULL | — | — |
| 3 | `normalized_item_name` | `text` | NOT NULL | — | — |
| 4 | `original_item_name` | `text` | yes | — | — |
| 5 | `barcode` | `text` | yes | — | — |
| 6 | `product_name` | `text` | NOT NULL | — | — |
| 7 | `brand` | `text` | yes | — | — |
| 8 | `tha_rating` | `integer` | yes | — | — |
| 9 | `available_stores` | `jsonb` | yes | — | — |
| 10 | `source` | `text` | NOT NULL | — | — |
| 11 | `chosen_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 12 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 13 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `shopping_fulfilment_memory_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `shopping_fulfilment_memory_household_id_fkey` | `FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `sfm_household_id_idx` | btree | no | `CREATE INDEX sfm_household_id_idx ON shopping_fulfilment_memory USING btree (household_id)` |
| `sfm_household_item_idx` | btree | no | `CREATE INDEX sfm_household_item_idx ON shopping_fulfilment_memory USING btree (household_id, normalized_item_name)` |
| `shopping_fulfilment_memory_pkey` | btree | yes | `CREATE UNIQUE INDEX shopping_fulfilment_memory_pkey ON shopping_fulfilment_memory USING btree (id)` |

### `public.shopping_list`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('shopping_list_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `product_name` | `text` | NOT NULL | — | — |
| 4 | `image_url` | `text` | yes | — | — |
| 5 | `quantity` | `integer` | NOT NULL | `1` | — |
| 6 | `brand` | `text` | yes | — | — |
| 7 | `normalized_name` | `text` | yes | — | — |
| 8 | `quantity_value` | `real` | yes | — | — |
| 9 | `unit` | `text` | yes | — | — |
| 10 | `category` | `text` | yes | — | — |
| 11 | `selected_tier` | `text` | yes | — | — |
| 12 | `quantity_in_grams` | `real` | yes | — | — |
| 13 | `ingredient_id` | `integer` | yes | — | — |
| 14 | `matched_product_id` | `text` | yes | — | — |
| 15 | `matched_store` | `text` | yes | — | — |
| 16 | `matched_price` | `real` | yes | — | — |
| 17 | `checked` | `boolean` | NOT NULL | `false` | — |
| 18 | `needs_review` | `boolean` | NOT NULL | `false` | — |
| 19 | `validation_note` | `text` | yes | — | — |
| 20 | `selected_store` | `text` | yes | — | — |
| 21 | `available_stores` | `text` | yes | — | — |
| 22 | `smp_rating` | `integer` | yes | — | — |
| 23 | `household_id` | `integer` | yes | — | — |
| 24 | `added_by_user_id` | `integer` | yes | — | — |
| 25 | `item_type` | `text` | yes | — | — |
| 26 | `variant_selections` | `text` | yes | — | — |
| 27 | `attribute_preferences` | `text` | yes | — | — |
| 28 | `confidence_level` | `text` | yes | — | — |
| 29 | `confidence_reason` | `text` | yes | — | — |
| 30 | `basket_label` | `text` | yes | — | — |
| 31 | `shop_status` | `text` | yes | — | — |
| 32 | `original_text` | `text` | yes | — | — |
| 33 | `canonical_name` | `text` | yes | — | — |
| 34 | `subcategory` | `text` | yes | — | — |
| 35 | `resolution_state` | `text` | yes | `'raw'::text` | — |
| 36 | `review_reason` | `text` | yes | — | — |
| 37 | `review_suggestions` | `text` | yes | — | — |
| 38 | `cupboard_quantity` | `real` | yes | — | — |
| 39 | `source` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `shopping_list_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `shopping_list_pkey` | btree | yes | `CREATE UNIQUE INDEX shopping_list_pkey ON shopping_list USING btree (id)` |

### `public.shopping_list_extras`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('shopping_list_extras_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `name` | `text` | NOT NULL | — | — |
| 4 | `category` | `text` | NOT NULL | `'household'::text` | — |
| 5 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 6 | `household_id` | `integer` | yes | — | — |
| 7 | `always_add` | `boolean` | NOT NULL | `false` | — |
| 8 | `in_basket` | `boolean` | NOT NULL | `true` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `shopping_list_extras_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `shopping_list_extras_user_id_users_id_fk` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `shopping_list_extras_pkey` | btree | yes | `CREATE UNIQUE INDEX shopping_list_extras_pkey ON shopping_list_extras USING btree (id)` |

### `public.site_settings`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `key` | `text` | NOT NULL | — | — |
| 2 | `value` | `text` | NOT NULL | — | — |
| 3 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `site_settings_pkey` | `PRIMARY KEY (key)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `site_settings_pkey` | btree | yes | `CREATE UNIQUE INDEX site_settings_pkey ON site_settings USING btree (key)` |

### `public.subscriptions`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('subscriptions_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `household_id` | `integer` | yes | — | — |
| 4 | `plan_id` | `text` | NOT NULL | — | — |
| 5 | `status` | `text` | NOT NULL | — | — |
| 6 | `billing_period` | `text` | yes | — | — |
| 7 | `trial_ends_at` | `timestamp with time zone` | yes | — | — |
| 8 | `current_period_end` | `timestamp with time zone` | yes | — | — |
| 9 | `cancel_at_period_end` | `boolean` | NOT NULL | `false` | — |
| 10 | `pending_plan_id` | `text` | yes | — | — |
| 11 | `past_due_since` | `timestamp with time zone` | yes | — | — |
| 12 | `provider_customer_id` | `text` | yes | — | — |
| 13 | `provider_subscription_id` | `text` | yes | — | — |
| 14 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 15 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `subscriptions_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `subscriptions_household_id_fkey` | `FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL` |
| FOREIGN KEY | `subscriptions_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| CHECK | `subscriptions_billing_period_check` | `CHECK (billing_period IS NULL OR (billing_period = ANY (ARRAY['monthly'::text, 'annual'::text])))` |
| CHECK | `subscriptions_pending_plan_id_check` | `CHECK (pending_plan_id IS NULL OR (pending_plan_id = ANY (ARRAY['free'::text, 'premium'::text, 'friends_family'::text])))` |
| CHECK | `subscriptions_plan_id_check` | `CHECK (plan_id = ANY (ARRAY['free'::text, 'premium'::text, 'friends_family'::text]))` |
| CHECK | `subscriptions_status_check` | `CHECK (status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'cancelled'::text, 'expired'::text, 'incomplete'::text]))` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `subscriptions_household_id_idx` | btree | no | `CREATE INDEX subscriptions_household_id_idx ON subscriptions USING btree (household_id)` |
| `subscriptions_pkey` | btree | yes | `CREATE UNIQUE INDEX subscriptions_pkey ON subscriptions USING btree (id)` |
| `subscriptions_provider_subscription_id_key` | btree | yes | `CREATE UNIQUE INDEX subscriptions_provider_subscription_id_key ON subscriptions USING btree (provider_subscription_id)` |
| `subscriptions_user_id_idx` | btree | no | `CREATE INDEX subscriptions_user_id_idx ON subscriptions USING btree (user_id)` |

### `public.supermarket_links`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('supermarket_links_id_seq'::regclass)` | — |
| 2 | `name` | `text` | NOT NULL | — | — |
| 3 | `country` | `text` | NOT NULL | — | — |
| 4 | `search_url` | `text` | NOT NULL | — | — |
| 5 | `logo_url` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `supermarket_links_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `supermarket_links_pkey` | btree | yes | `CREATE UNIQUE INDEX supermarket_links_pkey ON supermarket_links USING btree (id)` |

### `public.support_requests`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('support_requests_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | yes | — | — |
| 3 | `kind` | `text` | NOT NULL | — | — |
| 4 | `subject` | `text` | NOT NULL | — | — |
| 5 | `body` | `text` | NOT NULL | — | — |
| 6 | `context_path` | `text` | yes | — | — |
| 7 | `contact_email` | `text` | yes | — | — |
| 8 | `status` | `text` | NOT NULL | `'new'::text` | — |
| 9 | `internal_note` | `text` | yes | — | — |
| 10 | `resolved_by_user_id` | `integer` | yes | — | — |
| 11 | `resolved_at` | `timestamp with time zone` | yes | — | — |
| 12 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 13 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `support_requests_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `support_requests_resolved_by_user_id_fkey` | `FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL` |
| FOREIGN KEY | `support_requests_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `support_requests_kind_idx` | btree | no | `CREATE INDEX support_requests_kind_idx ON support_requests USING btree (kind)` |
| `support_requests_pkey` | btree | yes | `CREATE UNIQUE INDEX support_requests_pkey ON support_requests USING btree (id)` |
| `support_requests_status_idx` | btree | no | `CREATE INDEX support_requests_status_idx ON support_requests USING btree (status, created_at)` |
| `support_requests_user_id_idx` | btree | no | `CREATE INDEX support_requests_user_id_idx ON support_requests USING btree (user_id)` |

### `public.user_consents`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('user_consents_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | yes | — | — |
| 3 | `consent_type` | `text` | NOT NULL | — | — |
| 4 | `granted` | `boolean` | NOT NULL | — | — |
| 5 | `document_slug` | `text` | yes | — | — |
| 6 | `document_version` | `text` | yes | — | — |
| 7 | `source` | `text` | NOT NULL | — | — |
| 8 | `recorded_ip` | `text` | yes | — | — |
| 9 | `recorded_user_agent` | `text` | yes | — | — |
| 10 | `recorded_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `user_consents_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `user_consents_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `user_consents_lookup_idx` | btree | no | `CREATE INDEX user_consents_lookup_idx ON user_consents USING btree (user_id, consent_type, recorded_at)` |
| `user_consents_pkey` | btree | yes | `CREATE UNIQUE INDEX user_consents_pkey ON user_consents USING btree (id)` |
| `user_consents_user_id_idx` | btree | no | `CREATE INDEX user_consents_user_id_idx ON user_consents USING btree (user_id)` |

### `public.user_health_trends`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('user_health_trends_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `date` | `text` | NOT NULL | — | — |
| 4 | `average_smp_rating` | `real` | NOT NULL | — | — |
| 5 | `elite_count` | `integer` | NOT NULL | `0` | — |
| 6 | `processed_count` | `integer` | NOT NULL | `0` | — |
| 7 | `sample_count` | `integer` | NOT NULL | `0` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `user_health_trends_pkey` | `PRIMARY KEY (id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `user_health_trends_pkey` | btree | yes | `CREATE UNIQUE INDEX user_health_trends_pkey ON user_health_trends USING btree (id)` |

### `public.user_item_usage`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('user_item_usage_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `item_type` | `text` | NOT NULL | — | — |
| 4 | `item_id` | `integer` | yes | — | — |
| 5 | `item_name` | `text` | NOT NULL | — | — |
| 6 | `last_used_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 7 | `use_count` | `integer` | NOT NULL | `1` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `user_item_usage_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `user_item_usage_user_id_users_id_fk` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `idx_user_item_usage_user_id` | btree | no | `CREATE INDEX idx_user_item_usage_user_id ON user_item_usage USING btree (user_id)` |
| `user_item_usage_pkey` | btree | yes | `CREATE UNIQUE INDEX user_item_usage_pkey ON user_item_usage USING btree (id)` |

### `public.user_pantry_items`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('user_pantry_items_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `ingredient_key` | `text` | NOT NULL | — | — |
| 4 | `category` | `text` | NOT NULL | `'larder'::text` | — |
| 5 | `default_have` | `boolean` | NOT NULL | `true` | — |
| 6 | `notes` | `text` | yes | — | — |
| 7 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 8 | `display_name` | `text` | yes | — | — |
| 9 | `is_default` | `boolean` | NOT NULL | `false` | — |
| 10 | `is_deleted` | `boolean` | NOT NULL | `false` | — |
| 11 | `sort_order` | `integer` | NOT NULL | `0` | — |
| 12 | `household_id` | `integer` | yes | — | — |
| 13 | `need_quantity_value` | `real` | yes | — | — |
| 14 | `need_unit` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `user_pantry_items_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `user_pantry_items_user_id_users_id_fk` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| CHECK | `user_pantry_items_category_check` | `CHECK (category = ANY (ARRAY['larder'::text, 'fridge'::text, 'freezer'::text, 'household'::text, 'fruit'::text, 'pet'::text]))` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `user_pantry_items_household_ingredient_active_unique` | btree | yes | `CREATE UNIQUE INDEX user_pantry_items_household_ingredient_active_unique ON user_pantry_items USING btree (household_id, ingredient_key) WHERE is_deleted = false AND household_id IS NOT NULL` |
| `user_pantry_items_pkey` | btree | yes | `CREATE UNIQUE INDEX user_pantry_items_pkey ON user_pantry_items USING btree (id)` |
| `user_pantry_items_user_id_idx` | btree | no | `CREATE INDEX user_pantry_items_user_id_idx ON user_pantry_items USING btree (user_id)` |

### `public.user_preferences`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('user_preferences_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `diet_types` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 4 | `excluded_ingredients` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 5 | `health_goals` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 6 | `budget_level` | `text` | NOT NULL | `'standard'::text` | — |
| 7 | `preferred_stores` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 8 | `upf_sensitivity` | `text` | NOT NULL | `'moderate'::text` | — |
| 9 | `quality_preference` | `text` | NOT NULL | `'standard'::text` | — |
| 10 | `calorie_target` | `integer` | yes | — | — |
| 11 | `sound_enabled` | `boolean` | NOT NULL | `true` | — |
| 12 | `elite_tracking_enabled` | `boolean` | NOT NULL | `true` | — |
| 13 | `health_trend_enabled` | `boolean` | NOT NULL | `true` | — |
| 14 | `barcode_scanner_enabled` | `boolean` | NOT NULL | `true` | — |
| 15 | `planner_show_calories` | `boolean` | NOT NULL | `true` | — |
| 16 | `planner_enable_baby_meals` | `boolean` | NOT NULL | `false` | — |
| 17 | `planner_enable_child_meals` | `boolean` | NOT NULL | `false` | — |
| 18 | `planner_enable_drinks` | `boolean` | NOT NULL | `false` | — |
| 19 | `calorie_mode` | `text` | NOT NULL | `'auto'::text` | — |
| 20 | `height_cm` | `real` | yes | — | — |
| 21 | `weight_kg` | `real` | yes | — | — |
| 22 | `activity_level` | `text` | NOT NULL | `'moderate'::text` | — |
| 23 | `goal_type` | `text` | NOT NULL | `'maintain'::text` | — |
| 24 | `adults_count` | `integer` | NOT NULL | `1` | — |
| 25 | `children_count` | `integer` | NOT NULL | `0` | — |
| 26 | `babies_count` | `integer` | NOT NULL | `0` | — |
| 27 | `preferred_ingredients` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 28 | `max_prep_tolerance` | `integer` | yes | — | — |
| 29 | `meal_mode` | `text` | NOT NULL | `'exact'::text` | — |
| 30 | `max_extra_prep_minutes` | `integer` | yes | — | — |
| 31 | `max_total_cook_time` | `integer` | yes | — | — |
| 32 | `prefer_less_processed` | `boolean` | NOT NULL | `false` | — |
| 33 | `include_regulatory_additives_in_scoring` | `boolean` | NOT NULL | `true` | — |
| 34 | `muted_opportunity_types` | `text[]` | NOT NULL | `'{}'::text[]` | — |
| 35 | `companion_personality` | `text` | NOT NULL | `'companion'::text` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `user_preferences_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `user_preferences_user_id_unique` | `UNIQUE (user_id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `user_preferences_pkey` | btree | yes | `CREATE UNIQUE INDEX user_preferences_pkey ON user_preferences USING btree (id)` |
| `user_preferences_user_id_unique` | btree | yes | `CREATE UNIQUE INDEX user_preferences_user_id_unique ON user_preferences USING btree (user_id)` |

### `public.user_streaks`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('user_streaks_id_seq'::regclass)` | — |
| 2 | `user_id` | `integer` | NOT NULL | — | — |
| 3 | `current_elite_streak` | `integer` | NOT NULL | `0` | — |
| 4 | `best_elite_streak` | `integer` | NOT NULL | `0` | — |
| 5 | `last_elite_date` | `text` | yes | — | — |
| 6 | `weekly_elite_count` | `integer` | NOT NULL | `0` | — |
| 7 | `week_start_date` | `text` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `user_streaks_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `user_streaks_user_id_unique` | `UNIQUE (user_id)` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `user_streaks_pkey` | btree | yes | `CREATE UNIQUE INDEX user_streaks_pkey ON user_streaks USING btree (id)` |
| `user_streaks_user_id_unique` | btree | yes | `CREATE UNIQUE INDEX user_streaks_user_id_unique ON user_streaks USING btree (user_id)` |

### `public.users`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('users_id_seq'::regclass)` | — |
| 2 | `username` | `text` | NOT NULL | — | — |
| 3 | `password` | `text` | NOT NULL | — | — |
| 4 | `measurement_preference` | `text` | NOT NULL | `'metric'::text` | — |
| 5 | `preferred_price_tier` | `text` | NOT NULL | `'standard'::text` | — |
| 6 | `onboarding_completed` | `boolean` | NOT NULL | `false` | — |
| 7 | `starter_meals_loaded` | `boolean` | NOT NULL | `false` | — |
| 8 | `is_beta_user` | `boolean` | NOT NULL | `false` | — |
| 9 | `display_name` | `text` | yes | — | — |
| 10 | `profile_photo_url` | `text` | yes | — | — |
| 11 | `email_verified` | `boolean` | NOT NULL | `false` | — |
| 12 | `email_verification_token` | `text` | yes | — | — |
| 13 | `email_verification_expires` | `timestamp with time zone` | yes | — | — |
| 16 | `eating_schedule` | `text` | yes | — | — |
| 17 | `password_reset_token` | `text` | yes | — | — |
| 18 | `password_reset_expires` | `timestamp with time zone` | yes | — | — |
| 19 | `role` | `text` | NOT NULL | `'user'::text` | — |
| 20 | `subscription_tier` | `text` | NOT NULL | `'free'::text` | — |
| 21 | `subscription_status` | `text` | yes | — | — |
| 22 | `subscription_expires_at` | `timestamp with time zone` | yes | — | — |
| 23 | `updated_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 24 | `is_demo` | `boolean` | NOT NULL | `false` | — |
| 25 | `demo_expires_at` | `timestamp with time zone` | yes | — | — |
| 26 | `demo_claimed_email` | `text` | yes | — | — |
| 27 | `first_name` | `text` | yes | — | — |
| 28 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |
| 29 | `last_login_at` | `timestamp with time zone` | yes | — | — |
| 30 | `last_seen_at` | `timestamp with time zone` | yes | — | — |
| 31 | `custom_metric_defs` | `jsonb` | yes | — | — |
| 32 | `diary_extra_metrics` | `jsonb` | yes | — | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `users_pkey` | `PRIMARY KEY (id)` |
| UNIQUE | `users_username_unique` | `UNIQUE (username)` |
| CHECK | `users_role_check` | `CHECK (role = ANY (ARRAY['user'::text, 'admin'::text]))` |
| CHECK | `users_subscription_tier_check` | `CHECK (subscription_tier = ANY (ARRAY['free'::text, 'premium'::text, 'friends_family'::text]))` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `users_pkey` | btree | yes | `CREATE UNIQUE INDEX users_pkey ON users USING btree (id)` |
| `users_username_unique` | btree | yes | `CREATE UNIQUE INDEX users_username_unique ON users USING btree (username)` |

### `public.week_provisioning_items`

kind: table · owner: postgres · persistence: permanent

| # | Column | Type | Nullable | Default | Notes |
| ---: | --- | --- | --- | --- | --- |
| 1 | `id` | `integer` | NOT NULL | `nextval('week_provisioning_items_id_seq'::regclass)` | — |
| 2 | `week_id` | `integer` | NOT NULL | — | — |
| 3 | `name` | `text` | NOT NULL | — | — |
| 4 | `meal_id` | `integer` | yes | — | — |
| 5 | `note` | `text` | yes | — | — |
| 6 | `created_at` | `timestamp with time zone` | NOT NULL | `now()` | — |

**Constraints**

| Type | Name | Definition |
| --- | --- | --- |
| PRIMARY KEY | `week_provisioning_items_pkey` | `PRIMARY KEY (id)` |
| FOREIGN KEY | `week_provisioning_items_week_id_fkey` | `FOREIGN KEY (week_id) REFERENCES planner_weeks(id) ON DELETE CASCADE` |

**Indexes**

| Name | Method | Unique | Definition |
| --- | --- | --- | --- |
| `week_provisioning_items_pkey` | btree | yes | `CREATE UNIQUE INDEX week_provisioning_items_pkey ON week_provisioning_items USING btree (id)` |
| `wpi_week_id_idx` | btree | no | `CREATE INDEX wpi_week_id_idx ON week_provisioning_items USING btree (week_id)` |

