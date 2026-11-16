# Corrected Old Repository Comparison — 2026-11-12

## Method
Compared current working trees by SHA-256 and relative path. A file absent at the same relative path is **relocated** if its exact hash exists anywhere in the active tree, and **genuinely unique** only if its hash is absent from the entire active tree. Same-path/different-hash files remain changed; their old hash was separately checked against every active file.

Excluded `.git`, dependency/build/upload/cache directories, test outputs, `artifacts`, `logs`, Bridge npm cache/log directories, root `.tha-*.txt` outputs, and this report itself. Config values are not printed. Zero-byte hash matches are exact content matches but can be generic placeholders; marked as such.

**Active:** `tha-integrated-dev-g-native-20261003`, `feat/integrated-dev`, HEAD `4cf1ea4f2d130171441ef88f06515037c1f947fb`; at this correction run the prior report was the only untracked active-tree path. **Risk:** Amber subject matter; read-only investigation/report correction. Only the report was written.

**Preflight read:** user workspace instructions; Bridge `AGENTS.md`; active repo `AGENTS.md`, `PROJECT_GOVERNANCE.md`, architecture README, `ENGINEERING_WORKFLOW.md`, `REPOSITORY_CONVENTIONS.md`, AI operating-model README and relevant principles/evidence/risk/output docs; old repo `AGENTS.md` files for integrated-dev, staging, and Living Larder. No saved generator script existed; previous report generation was inline.

## Summary

| Folder | Same path + same hash | Same path, changed hash | Old hash also elsewhere | Relocated | Genuinely unique | Active-only paths | Spot-check claims surviving |
|---|---:|---:|---:|---:|---:|---:|---:|
| Meal-Ingredients-Planner | 305 | 214 | 4 | 519 | 198 | 6825 | 5/5 |
| tha-integrated-dev | 5458 | 232 | 29 | 3 | 1 | 1654 | 1/1 unique; all 4 path-only claims audited |
| tha-integrated-dev-staging-20260927 | 5451 | 235 | 30 | 3 | 1 | 1658 | 1/1 unique; all 4 path-only claims audited |
| tha-living-larder-authoritative | 5375 | 260 | 27 | 1 | 53 | 1709 | 5/5 |

## Independent spot-check

For each selected unique file, the active tree was searched by filename and same-name hits were re-hashed; the full active-tree hash index was also checked for identical content under another name.

- **Meal-Ingredients-Planner:** 5/5 sampled unique claims survived; same-name active files existed but had different hashes. Samples: `INGREDIENT_IMAGERY_INFRASTRUCTURE_IMPLEMENTATION.md`, `INGREDIENT_IMAGERY_LIBRARY_INVESTIGATION.md`, `MEAL_DIALOG_INFORMATION_DENSITY_REDUCTION.md`, `MEAL_ENHANCEMENT_MEAL_FIT_PROTECTION_RULE.md`, `MEAL_ENHANCEMENT_PLATFORM_ARCHITECTURE.md`.
- **tha-integrated-dev:** only four path-only candidates existed; all four were checked exhaustively, below the requested five. 1/4 is unique; three are exact-content relocations into `docs\investigations\cookbook\`. Unique sample: `docs\product\structure\pages\page-landing.md`, with no active same-name/hash match.
- **tha-integrated-dev-staging-20260927:** only four path-only candidates existed; all four checked exhaustively, below five. 1/4 is unique; three are exact-content relocations into `docs\investigations\cookbook\`. The unique page spec has no active same-name/hash match.
- **tha-living-larder-authoritative:** 5/5 sampled unique claims survived; no same-name or same-hash active match. Samples: `Create-THA-Shortcuts.ps1`, `Install-THA.ps1`, `package.json20261004`, `package.json20261004T200438`, `start-dev.bat`.

All old-only-by-path candidates in the two integrated-dev folders were checked; a fifth candidate did not exist.

## Meal-Ingredients-Planner

**Reading:** 717 earlier path-only claims split into 519 exact-content relocations and 198 unique hashes. Unique items include client/server/shared source, assets, and docs. Recent dashboard, weekly-plan review, diet-intent review and plan-to-shopping handoff work remains a candidate to view/rescue; docs may describe historical/superseded behavior.

### Genuinely unique old files

- `INGREDIENT_IMAGERY_INFRASTRUCTURE_IMPLEMENTATION.md` (1635 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `INGREDIENT_IMAGERY_LIBRARY_INVESTIGATION.md` (1755 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `MEAL_DIALOG_INFORMATION_DENSITY_REDUCTION.md` (566 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `MEAL_ENHANCEMENT_MEAL_FIT_PROTECTION_RULE.md` (206 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `MEAL_ENHANCEMENT_PLATFORM_ARCHITECTURE.md` (332 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `MEAL_ENHANCEMENT_SYSTEM_CONSOLIDATION_INVESTIGATION.md` (1160 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `MEAL_ENHANCEMENT_WEEKLY_REUSE_IMPLEMENTATION.md` (283 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `MEAL_ENHANCEMENT_WEEKLY_REUSE_INVESTIGATION.md` (346 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `MEAL_VARIETY_NUDGE_RETIREMENT.md` (673 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `NUTRITION_BOOST_COMPACT_UX_REFINEMENT.md` (1411 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `NUTRITION_BOOST_INGREDIENT_VISIBILITY_FIX.md` (1446 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `PLANNER_ARCHIVE_HOUSEHOLD_FAMILIARITY.md` (210 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `PLANNER_HISTORY_RETENTION_INVESTIGATION.md` (286 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `PLANT_DIVERSITY_CATEGORY_COMPLETION_IMPLEMENTATION.md` (1364 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `PLANT_DIVERSITY_COUNTER_ACCURACY_FIX.md` (1001 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `PLANT_DIVERSITY_COUNTER_INVESTIGATION.md` (280 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `PLANT_DIVERSITY_EXPLORER_IMPLEMENTATION.md` (1653 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `PREMIUM_RECIPE_SMART_PLANNER_AUDIT.md` (1377 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `PREMIUM_RECIPE_SMART_PLANNER_FIX.md` (1261 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `tatus` (8918 bytes) — Unique file content; review purpose before discard.
- `THIRTY_PLANTS_THIS_WEEK_COPY_REFRESH.md` (424 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `.codex\config.toml` (440 bytes) — Unique local configuration/tool file; preserve until reviewed; contents not printed.
- `client\src\assets\icons\tha-apple-sort.png` (1189556 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\assets\icons\The healthy apples recommneds.png` (1490459 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\BadAppleWarningModal.tsx` (6161 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\dashboard-next-step-card.test.tsx` (2073 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\dashboard-next-step-card.tsx` (2852 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\dashboard-plan-meal-card.test.ts` (1398 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\dashboard-plan-meal-card.tsx` (8455 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\dashboard-plan-shopping-handoff.test.tsx` (1082 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\dashboard-plan-shopping-handoff.tsx` (982 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\first-visit-hint.tsx` (1811 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\HealthTrendChart.tsx` (5738 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\HomeIntelligenceCompanion.tsx` (6063 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\household-diet-intent-review.test.tsx` (1154 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\household-diet-intent-review.tsx` (2103 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\NutritionBoostPanel.tsx` (4561 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\PageHeader.tsx` (13030 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\plan-to-shopping-review-dialog.tsx` (2850 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\PlannerIntelligenceCompanion.tsx` (5674 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\RankModeSelector.tsx` (2328 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\scan-confirm-dialog.tsx` (17237 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ShoppingListView.tsx` (178856 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\tha-bridge-evidence-panel.test.tsx` (2878 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\tha-bridge-evidence-panel.tsx` (4601 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\weekly-plan-review-card.tsx` (6646 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\intelligence\CelebrationCard.tsx` (1292 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\intelligence\OpportunityCard.tsx` (1454 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\intelligence\SimplyBetterChoiceCard.tsx` (1518 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\meal-detail\SimplyBetterChoicesPanel.tsx` (4821 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\accordion.tsx` (2033 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\alert.tsx` (1643 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\apple-rating.tsx` (1295 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\aspect-ratio.tsx` (145 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\breadcrumb.tsx` (2827 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\calendar.tsx` (2763 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\carousel.tsx` (6470 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\chart.tsx` (10846 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\command.tsx` (5036 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\context-menu.tsx` (7626 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\hover-card.tsx` (1280 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\input-otp.tsx` (2223 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\menubar.tsx` (8861 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\navigation-menu.tsx` (5256 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\pagination.tsx` (2868 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\radio-group.tsx` (1509 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\resizable.tsx` (1768 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\score-badge.tsx` (302 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\scroll-area.tsx` (1688 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\sidebar.tsx` (22573 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\slider.tsx` (1103 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\components\ui\toggle-group.tsx` (1814 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\hooks\use-mobile.tsx` (651 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\lib\dashboard-plan-shopping-handoff.test.ts` (1107 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\lib\dashboard-plan-shopping-handoff.ts` (702 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\lib\nutrition-boosts.ts` (6701 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\lib\plan-to-shopping-review-model.test.ts` (1951 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\lib\plan-to-shopping-review-model.ts` (1519 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\lib\tha-bridge-adapter.test.ts` (2623 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\lib\tha-bridge-adapter.ts` (4247 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\lib\weekly-plan-review-model.test.ts` (2321 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\lib\weekly-plan-review-model.ts` (2199 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\pages\list-page.tsx` (32979 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\pages\pantry-page.tsx` (49027 bytes) — Potential distinct code/source asset; review before discard.
- `client\src\pages\shopping-list-page.tsx` (249212 bytes) — Potential distinct code/source asset; review before discard.
- `docs\investigations\COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md` (37128 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\COMPONENT_MEAL_RECOVERY_FEASIBILITY.md` (25087 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\current_dev_status.md` (20854 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\DASHBOARD_NEXT_STEP_CARD_20261017.md` (6325 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\DASHBOARD_PLAN_MEAL_QUICK_ADD_20261017.md` (3923 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\DASHBOARD_PLAN_TO_SHOPPING_HANDOFF_20261017.md` (2699 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\DIETARY_LABEL_DISPLAY_NORMALISATION_FIX.md` (4302 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md` (52152 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_PHASE1_IMPLEMENTATION_PLAN.md` (33905 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_PHASE1_IMPLEMENTATION.md` (7709 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_PHASE4_HOUSEHOLD_FIT_DISPLAY.md` (9212 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_PHASE5_RESTRICTION_RESOLVER_INTEGRATION.md` (9899 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_PHASE6_COMPATIBILITY_RANKING_PLAN.md` (34906 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_PHASE6_IMPLEMENTATION.md` (14520 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_V1_MASTER_PLAN_REVISION.md` (31305 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\HOUSEHOLD_DIET_INTENT_REVIEW_20261017.md` (2659 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\M1_FOOD_INTELLIGENCE_CONVERGENCE_IMPLEMENTATION.md` (15845 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\M2_PANTRY_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md` (22971 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\M3_CANONICAL_DIETARY_RULES_CONVERGENCE_IMPLEMENTATION.md` (25466 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\M4_5_FERMENTED_FOOD_ATTRIBUTE_IMPLEMENTATION.md` (15823 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\M4_CANONICAL_DIVERSITY_GROUP_CONVERGENCE_IMPLEMENTATION.md` (19398 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\M5_TRUSTED_FOOD_INTELLIGENCE_ACTIVATION.md` (25357 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\M6_PLATFORM_FOOD_INTELLIGENCE_ROLLOUT.md` (33997 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\MEAL_DETAIL_EXPERIENCE_V3_REFINEMENT.md` (43974 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\MEAL_DETAIL_EXPERIENCE_V3.md` (57266 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\NUTRITION_BOOST_ACCEPT_TRANSACTION_VERIFICATION.md` (18026 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md` (57989 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md` (45678 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\PANTRY_ASSETS_PHASE_1_IMPLEMENTATION_20260727.md` (7614 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\PANTRY_ASSETS_PHASE_1_PROVENANCE.json` (19230 bytes) — Unique file content; review purpose before discard.
- `docs\investigations\PANTRY_OVERLAP_PLAN_REVIEW_20261017.md` (2683 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\PANTRY_ROOT_CAUSE_INVESTIGATION_20260727.md` (11152 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\PLAN_TO_SHOPPING_REVIEW_IMPLEMENTATION_20261017.md` (3611 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\PLANNER_GENERATION_PATH_ROOT_CAUSE.md` (15363 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\PLANNER_MEAL_CARD_V2.md` (8250 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\PREMIUM_RECIPE_SMART_PLANNER_FIX.md` (9088 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\PRESERVE_SINCE_LAST_PRODUCTION_CHECKPOINT.md` (8208 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\PROFILE_SAVE_DIET_RESTRICTIONS_VALIDATION_FIX.md` (2070 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\PUSH_PRESERVATION_REMOTE_BACKUP.md` (3718 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\SMART_PLANNER_SLOT_FILLING_RECOVERY.md` (8658 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\STARTER_SHELL_EXISTING_TEMPLATE_ENRICHMENT.md` (11929 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_30_PLANTS_MODAL_V2_DESIGN_VALIDATION.md` (38825 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_30_PLANTS_MODAL_V2_FEASIBILITY_REVIEW.md` (45276 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_6_WEEK_FAMILY_EXPERIENCE_AUDIT.md` (77729 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_ADAPTIVE_DENSITY_FOUNDATION.md` (11894 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_CORE_ARCHITECTURE_PRINCIPLES_IMPLEMENTATION.md` (21560 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_CORE_ARCHITECTURE_PRINCIPLES.md` (40852 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_ENGINEERING_WORKFLOW_ARCHITECTURE_CONVERGENCE_STATUS.md` (5632 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_FULL_SYSTEM_LAUNCH_READINESS_AUDIT.md` (41516 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_KNOWLEDGE_SURFACES_AND_ROUTE_OWNERSHIP_AUDIT.md` (24359 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_LAUNCH_ROADMAP.md` (48864 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md` (49681 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (38048 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\TIER4_MEAL_SHELL_RECOVERY_IMPLEMENTATION.md` (11812 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\TIER4_SHELL_RECOVERY_ACTIVATION.md` (7866 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WEEKLY_NUTRITION_REPORT_AND_CAUTION_FOODS_MODEL.md` (32440 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md` (48345 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WEEKLY_PLAN_REVIEW_IMPLEMENTATION_20261017.md` (2781 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS0_KNOWLEDGE_FOUNDATIONS_IMPLEMENTATION.md` (9386 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS0X_1_FIRST_500_FOODS_PROMOTION_PREVIEW.md` (66197 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS0X_10A_PROGRESSIVE_FOOD_INTELLIGENCE_IMPLEMENTATION.md` (22491 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS0X_11_MASS_FOOD_INTELLIGENCE_PROMOTION_PHASE1.md` (19067 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS0X_12_FOOD_INTELLIGENCE_PIPELINE_DISCREPANCY_INVESTIGATION.md` (31809 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS0X_13_UNIFIED_FOOD_INTELLIGENCE_ARCHITECTURE.md` (31951 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS0X_2_H1_PROMOTION_SYSTEM_AND_FIRST_BATCH_IMPLEMENTATION.md` (17506 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS0X_3_FOOD_CONTEXT_TAGGING_ARCHITECTURE.md` (27451 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS0X_4_FOOD_INTELLIGENCE_CONSOLIDATION_GATE.md` (26179 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS0X_6_MEAL_DETAIL_FOOD_INTELLIGENCE_ROLLOUT.md` (11055 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS0X_9_FOOD_INTELLIGENCE_MASS_PROMOTION_STRATEGY.md` (50366 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS2_PANTRY_EXPLORE_V2_IMPLEMENTATION.md` (13604 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS2C_FOOD_REPORT_ENRICHMENT.md` (29749 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS2D_CANONICAL_NUTRITION_KNOWLEDGE_ARCHITECTURE.md` (33505 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS2E_CANONICAL_SLUG_RECONCILIATION.md` (31360 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS2F_CANONICAL_FOOD_REPORT_FOUNDATION.md` (17693 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS3A_NUTRITION_REPORT_PAGE_REDESIGN.md` (10031 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS4B_NUTRITION_KNOWLEDGE_PIPELINE.md` (95159 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS6_CANONICAL_FOOD_REPORT_ARCHITECTURE.md` (44684 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WS9_5_WORKSPACE_HEADER_DESIGN_EXPLORATION_COMPLETION.md` (6675 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WX1_MEAL_INTELLIGENCE_ASSEMBLER_IMPLEMENTATION.md` (7651 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WX10E_REV2_BRAND_BANNER_SIDEBAR_AND_WORKSPACE_COMMAND_RULES.md` (5892 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WX10F_PLATFORM_SHELL_HEADER_FINAL_REFINEMENT.md` (6475 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WX11_PLATFORM_SHELL_STANDARD_IMPLEMENTATION.md` (8820 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WX14A_WORKSPACE_APPLE_REFINEMENT_IMPLEMENTATION.md` (7184 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WX2_5_INTELLIGENCE_EXPERIENCE_SYSTEM_IMPLEMENTATION.md` (7713 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WX3_PLANNER_INTELLIGENCE_COMPANION_IMPLEMENTATION.md` (5596 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WX6_SHOPPING_INTELLIGENCE_IMPLEMENTATION.md` (8539 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WX7_PANTRY_INTELLIGENCE_IMPLEMENTATION.md` (9011 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\investigations\WX9_5_WORKSPACE_HEADER_DESIGN_SPIKE.md` (20458 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `public\images\ingredients\almonds.webp` (10626 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\avocado.webp` (11076 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\basil.webp` (15316 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\blueberries.webp` (29948 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\brown-rice.webp` (13796 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\chia-seeds.webp` (70694 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\chickpeas.webp` (57330 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\coriander.webp` (24076 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\kale.webp` (42124 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\kimchi.webp` (22124 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\lentils.webp` (13728 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\oats.webp` (21432 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\olive-oil.webp` (8722 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\pumpkin-seeds.webp` (13892 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\sauerkraut.webp` (10310 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\spinach.webp` (46054 bytes) — Potential distinct code/source asset; review before discard.
- `public\images\ingredients\walnuts.webp` (20118 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\migrate-prod.sh` (784 bytes) — Potential distinct code/source asset; review before discard.
- `server\email.ts` (6066 bytes) — Potential distinct code/source asset; review before discard.
- `server\meal-resolution-service.ts` (6361 bytes) — Potential distinct code/source asset; review before discard.
- `server\template-migration.ts` (1708 bytes) — Potential distinct code/source asset; review before discard.
- `server\lib\recommendation-service.ts` (6018 bytes) — Potential distinct code/source asset; review before discard.
- `server\migrations\ensureUserDietColumns.ts` (1566 bytes) — Potential distinct code/source asset; review before discard.
- `server\tests\test-planner-week-copy.ts` (3333 bytes) — Potential distinct code/source asset; review before discard.
- `shared\planner-week-copy.ts` (2654 bytes) — Potential distinct code/source asset; review before discard.

### Relocated files (same hash found at active path)

- `_wx96_shoot.mjs` → scripts\_wx96_shoot.mjs — identical content at a different path.
- `active-tab-colour-report.txt` → docs\implementation\ux\active-tab-colour-report.txt — identical content at a different path.
- `apple-score-trust-gate-complete.txt` → docs\implementation\ux\apple-score-trust-gate-complete.txt — identical content at a different path.
- `COMPACT_EXPANDABLE_NUTRITION_BOOST_ROWS.md` → docs\implementation\ux\COMPACT_EXPANDABLE_NUTRITION_BOOST_ROWS.md — identical content at a different path.
- `compact-pantry-row-report.txt` → docs\implementation\ux\compact-pantry-row-report.txt — identical content at a different path.
- `compact-qty-row-report.txt` → docs\implementation\ux\compact-qty-row-report.txt — identical content at a different path.
- `NUTRITION_BOOST_RUNTIME_PROOF_INVESTIGATION.md` → docs\investigations\intelligence\NUTRITION_BOOST_RUNTIME_PROOF_INVESTIGATION.md — identical content at a different path.
- `pantry-quantity-foundation-summary.txt` → docs\implementation\ux\pantry-quantity-foundation-summary.txt — identical content at a different path.
- `pantry-quantity-foundation-workings.txt` → docs\implementation\ux\pantry-quantity-foundation-workings.txt — identical content at a different path.
- `shop-cta-align-report.txt` → docs\implementation\ux\shop-cta-align-report.txt — identical content at a different path.
- `shop-nav-report.txt` → docs\implementation\ux\shop-nav-report.txt — identical content at a different path.
- `shopping-multiselect-resolution-fix.txt` → docs\implementation\ux\shopping-multiselect-resolution-fix.txt — identical content at a different path.
- `shopping-review-resolution-summary.txt` → docs\implementation\ux\shopping-review-resolution-summary.txt — identical content at a different path.
- `shopping-row-standardisation-report.txt` → docs\implementation\ux\shopping-row-standardisation-report.txt — identical content at a different path.
- `SMART_PLANNER_DIETARY_PATTERN_AUDIT.md` → docs\investigations\planner\SMART_PLANNER_DIETARY_PATTERN_AUDIT.md — identical content at a different path.
- `SMP-Features.md` → docs\SMP-Features.md — identical content at a different path.
- `test-db-connect.ts` → scripts\test-db-connect.ts — identical content at a different path.
- `attached_assets\_new_single_apple_1772726624473.png` → archive\assets\_new_single_apple_1772726624473.png — identical content at a different path.
- `attached_assets\1_bad_apple_1772695549330.png` → archive\assets\1_bad_apple_1772695549330.png — identical content at a different path.
- `attached_assets\2_apples_new_1772726624473.png` → archive\assets\2_apples_new_1772726624473.png — identical content at a different path.
- `attached_assets\2_bad_apple_1772695549330.png` → archive\assets\2_bad_apple_1772695549330.png — identical content at a different path.
- `attached_assets\3_apple_1772695549330.png` → archive\assets\3_apple_1772695549330.png — identical content at a different path.
- `attached_assets\3_apples_new_1772726624473.png` → archive\assets\3_apples_new_1772726624473.png — identical content at a different path.
- `attached_assets\4_apples_1772695549330.png` → archive\assets\4_apples_1772695549330.png — identical content at a different path.
- `attached_assets\4_apples_new_1772726624473.png` → archive\assets\4_apples_new_1772726624473.png — identical content at a different path.
- `attached_assets\5_apples_1772695549330.png` → archive\assets\5_apples_1772695549330.png — identical content at a different path.
- `attached_assets\5_apples_new_1772726624473.png` → archive\assets\5_apples_new_1772726624473.png — identical content at a different path.
- `attached_assets\apple_score_1_transparent_512_1771840154576.png` → archive\assets\apple_score_1_transparent_512_1771840154576.png — identical content at a different path.
- `attached_assets\apple_score_1_white_512_v4_1771846626816.png` → archive\assets\apple_score_1_white_512_v4_1771846626816.png, archive\assets\apple_score_1_white_512_v4_1771864048268.png, archive\assets\apple_score_1_white_512_v4_1771866171297.png — identical content at a different path.
- `attached_assets\apple_score_1_white_512_v4_1771864048268.png` → archive\assets\apple_score_1_white_512_v4_1771846626816.png, archive\assets\apple_score_1_white_512_v4_1771864048268.png, archive\assets\apple_score_1_white_512_v4_1771866171297.png — identical content at a different path.
- `attached_assets\apple_score_1_white_512_v4_1771866171297.png` → archive\assets\apple_score_1_white_512_v4_1771846626816.png, archive\assets\apple_score_1_white_512_v4_1771864048268.png, archive\assets\apple_score_1_white_512_v4_1771866171297.png — identical content at a different path.
- `attached_assets\apple_score_2_transparent_512_1771840154577.png` → archive\assets\apple_score_2_transparent_512_1771840154577.png — identical content at a different path.
- `attached_assets\apple_score_2_white_512_v4_1771846626816.png` → archive\assets\apple_score_2_white_512_v4_1771846626816.png, archive\assets\apple_score_2_white_512_v4_1771864048268.png — identical content at a different path.
- `attached_assets\apple_score_2_white_512_v4_1771864048268.png` → archive\assets\apple_score_2_white_512_v4_1771846626816.png, archive\assets\apple_score_2_white_512_v4_1771864048268.png — identical content at a different path.
- `attached_assets\apple_score_3_transparent_512_1771840154577.png` → archive\assets\apple_score_3_transparent_512_1771840154577.png — identical content at a different path.
- `attached_assets\apple_score_3_white_512_v4_1771846626816.png` → archive\assets\apple_score_3_white_512_v4_1771846626816.png, archive\assets\apple_score_3_white_512_v4_1771864048268.png — identical content at a different path.
- `attached_assets\apple_score_3_white_512_v4_1771864048268.png` → archive\assets\apple_score_3_white_512_v4_1771846626816.png, archive\assets\apple_score_3_white_512_v4_1771864048268.png — identical content at a different path.
- `attached_assets\apple_score_4_transparent_512_1771840154577.png` → archive\assets\apple_score_4_transparent_512_1771840154577.png — identical content at a different path.
- `attached_assets\apple_score_4_white_512_v4_1771846626815.png` → archive\assets\apple_score_4_white_512_v4_1771846626815.png — identical content at a different path.
- `attached_assets\apple_score_5_transparent_512_1771840154577.png` → archive\assets\apple_score_5_transparent_512_1771840154577.png — identical content at a different path.
- `attached_assets\apple_score_5_transparent_512_v4_(1)_1771864048268.png` → archive\assets\apple_score_5_transparent_512_v4_(1)_1771864048268.png — identical content at a different path.
- `attached_assets\apple_score_5_white_512_v4_1771846626816.png` → archive\assets\apple_score_5_white_512_v4_1771846626816.png — identical content at a different path.
- `attached_assets\ChatGPT_Image_Feb_23,_2026,_04_20_29_PM_1771864048268.png` → archive\assets\ChatGPT_Image_Feb_23,_2026,_04_20_29_PM_1771864048268.png, archive\assets\ChatGPT_Image_Feb_23,_2026,_04_20_29_PM_1771866171297.png — identical content at a different path.
- `attached_assets\ChatGPT_Image_Feb_23,_2026,_04_20_29_PM_1771866171297.png` → archive\assets\ChatGPT_Image_Feb_23,_2026,_04_20_29_PM_1771864048268.png, archive\assets\ChatGPT_Image_Feb_23,_2026,_04_20_29_PM_1771866171297.png — identical content at a different path.
- `attached_assets\ChatGPT_Image_Feb_23,_2026,_08_50_58_AM_1771836720199.png` → archive\assets\ChatGPT_Image_Feb_23,_2026,_08_50_58_AM_1771836720199.png — identical content at a different path.
- `attached_assets\ChatGPT_Image_Mar_5,_2026,_09_51_21_AM_1772704308734.png` → archive\assets\ChatGPT_Image_Mar_5,_2026,_09_51_21_AM_1772704308734.png — identical content at a different path.
- `attached_assets\choose_better_1772726624473.png` → archive\assets\choose_better_1772726624473.png — identical content at a different path.
- `attached_assets\Choose_better_long_1772726624473.png` → archive\assets\Choose_better_long_1772726624473.png — identical content at a different path.
- `attached_assets\concept_pages_1772717564706.png` → archive\assets\concept_pages_1772717564706.png, archive\assets\concept_pages_1772752715080.png — identical content at a different path.
- `attached_assets\concept_pages_1772752715080.png` → archive\assets\concept_pages_1772717564706.png, archive\assets\concept_pages_1772752715080.png — identical content at a different path.
- `attached_assets\hte_healthy_apples_long_logo_1772702298025.png` → archive\assets\hte_healthy_apples_long_logo_1772702298025.png — identical content at a different path.
- `attached_assets\image_1771409749769.png` → archive\assets\image_1771409749769.png — identical content at a different path.
- `attached_assets\image_1771409789949.png` → archive\assets\image_1771409789949.png, archive\assets\image_1771410327792.png — identical content at a different path.
- `attached_assets\image_1771410327792.png` → archive\assets\image_1771409789949.png, archive\assets\image_1771410327792.png — identical content at a different path.
- `attached_assets\master_apple_logo_1772744482850.png` → archive\assets\master_apple_logo_1772744482850.png, attached_assets\new_single_apple_transparent_1772836544576.png — identical content at a different path.
- `attached_assets\orchard_background_concept_1772753707742.png` → archive\assets\orchard_background_concept_1772753707742.png, attached_assets\orchard_background_concept_1772752768712.png — identical content at a different path.
- `attached_assets\Pasted--1-Admin-User-Tool-Run-Onboarding-Action-What-Why-Add-a_1773417909953.txt` → archive\prompts\Pasted--1-Admin-User-Tool-Run-Onboarding-Action-What-Why-Add-a_1773417909953.txt — identical content at a different path.
- `attached_assets\Pasted--1B-User-Profile-Account-Action-Update-My-Preferences-W_1773418837956.txt` → archive\prompts\Pasted--1B-User-Profile-Account-Action-Update-My-Preferences-W_1773418837956.txt — identical content at a different path.
- `attached_assets\Pasted--2-Premium-Hero-Kitchen-to-Basket-What-Why-Replace-the-_1773419390708.txt` → archive\prompts\Pasted--2-Premium-Hero-Kitchen-to-Basket-What-Why-Replace-the-_1773419390708.txt — identical content at a different path.
- `attached_assets\Pasted--2B-Premium-Hero-Refinement-Brand-Line-Product-Flow-Wat_1773420409250.txt` → archive\prompts\Pasted--2B-Premium-Hero-Refinement-Brand-Line-Product-Flow-Wat_1773420409250.txt — identical content at a different path.
- `attached_assets\Pasted--3-Friendly-Onboarding-Questionnaire-Refresh-What-Why-R_1773417093862.txt` → archive\prompts\Pasted--3-Friendly-Onboarding-Questionnaire-Refresh-What-Why-R_1773417093862.txt — identical content at a different path.
- `attached_assets\Pasted--4-Demo-Mode-Phase-1-Temporary-Demo-User-Global-Banner-_1773440670199.txt` → archive\prompts\Pasted--4-Demo-Mode-Phase-1-Temporary-Demo-User-Global-Banner-_1773440670199.txt — identical content at a different path.
- `attached_assets\Pasted--5-Real-Account-Performance-Audit-Why-Demo-Feels-Faster_1773446344543.txt` → archive\prompts\Pasted--5-Real-Account-Performance-Audit-Why-Demo-Feels-Faster_1773446344543.txt — identical content at a different path.
- `attached_assets\Pasted--5B-Real-Account-Performance-Fixes-Phase-1-Cache-User-H_1773448315179.txt` → archive\prompts\Pasted--5B-Real-Account-Performance-Fixes-Phase-1-Cache-User-H_1773448315179.txt — identical content at a different path.
- `attached_assets\Pasted--5C-Real-Account-Performance-Fixes-Phase-2-Lightweight-_1773448902652.txt` → archive\prompts\Pasted--5C-Real-Account-Performance-Fixes-Phase-2-Lightweight-_1773448902652.txt — identical content at a different path.
- `attached_assets\Pasted--6-Analyser-Page-Reframe-Current-Product-Cleaner-Shop-O_1773530217708.txt` → archive\prompts\Pasted--6-Analyser-Page-Reframe-Current-Product-Cleaner-Shop-O_1773530217708.txt — identical content at a different path.
- `attached_assets\Pasted--6B-Analyser-Page-Restructure-Additive-Classification-F_1774218050276.txt` → archive\prompts\Pasted--6B-Analyser-Page-Restructure-Additive-Classification-F_1774218050276.txt — identical content at a different path.
- `attached_assets\Pasted--7-Homepage-Hero-Page-Orchard-Background-Final-Copy-and_1773950439072.txt` → archive\prompts\Pasted--7-Homepage-Hero-Page-Orchard-Background-Final-Copy-and_1773950439072.txt, archive\prompts\Pasted--7-Homepage-Hero-Page-Orchard-Background-Final-Copy-and_1773950467224.txt — identical content at a different path.
- `attached_assets\Pasted--7-Homepage-Hero-Page-Orchard-Background-Final-Copy-and_1773950467224.txt` → archive\prompts\Pasted--7-Homepage-Hero-Page-Orchard-Background-Final-Copy-and_1773950439072.txt, archive\prompts\Pasted--7-Homepage-Hero-Page-Orchard-Background-Final-Copy-and_1773950467224.txt — identical content at a different path.
- `attached_assets\Pasted--9-Canonical-Product-Grouping-Single-Product-Multiple-R_1774219705183.txt` → archive\prompts\Pasted--9-Canonical-Product-Grouping-Single-Product-Multiple-R_1774219705183.txt — identical content at a different path.
- `attached_assets\Pasted--9-Product-Quality-Comparison-UX-Apple-Scoring-Overhaul_1774130988161.txt` → archive\prompts\Pasted--9-Product-Quality-Comparison-UX-Apple-Scoring-Overhaul_1774130988161.txt, archive\prompts\Pasted--9-Product-Quality-Comparison-UX-Apple-Scoring-Overhaul_1774131021045.txt — identical content at a different path.
- `attached_assets\Pasted--9-Product-Quality-Comparison-UX-Apple-Scoring-Overhaul_1774131021045.txt` → archive\prompts\Pasted--9-Product-Quality-Comparison-UX-Apple-Scoring-Overhaul_1774130988161.txt, archive\prompts\Pasted--9-Product-Quality-Comparison-UX-Apple-Scoring-Overhaul_1774131021045.txt — identical content at a different path.
- `attached_assets\Pasted--9B-Correction-Pass-Visible-Result-UX-Sorting-Standard-_1774134930614.txt` → archive\prompts\Pasted--9B-Correction-Pass-Visible-Result-UX-Sorting-Standard-_1774134930614.txt — identical content at a different path.
- `attached_assets\Pasted--REPLIT-UI-AUDIT-VISUAL-SNAPSHOT-WORKSTREAM-Summary-Use_1782473289825.txt` → archive\prompts\Pasted--REPLIT-UI-AUDIT-VISUAL-SNAPSHOT-WORKSTREAM-Summary-Use_1782473289825.txt — identical content at a different path.
- `attached_assets\Pasted-ADD-ON-Pantry-Staples-Components-Pairings-to-include-af_1772396233513.txt` → archive\prompts\Pasted-ADD-ON-Pantry-Staples-Components-Pairings-to-include-af_1772396233513.txt — identical content at a different path.
- `attached_assets\Pasted-Add-User-Saved-Templates-private-6-week-templates-on-to_1772318393376.txt` → archive\prompts\Pasted-Add-User-Saved-Templates-private-6-week-templates-on-to_1772318393376.txt — identical content at a different path.
- `attached_assets\Pasted-Adjust-modal-styling-so-that-all-modals-visually-match-_1773935077342.txt` → archive\prompts\Pasted-Adjust-modal-styling-so-that-all-modals-visually-match-_1773935077342.txt — identical content at a different path.
- `attached_assets\Pasted-Build-and-refine-the-desktop-landing-page-for-The-Healt_1773443824805.txt` → archive\prompts\Pasted-Build-and-refine-the-desktop-landing-page-for-The-Healt_1773443824805.txt — identical content at a different path.
- `attached_assets\Pasted-Category-list-in-render-order-meat-fish-dairy-eggs-prod_1773190643196.txt` → archive\prompts\Pasted-Category-list-in-render-order-meat-fish-dairy-eggs-prod_1773190643196.txt — identical content at a different path.
- `attached_assets\Pasted-CHANGE-CONTROL-ENFORCED-READ-ONLY-INVESTIGATION-ONLY-Yo_1777765507191.txt` → archive\prompts\Pasted-CHANGE-CONTROL-ENFORCED-READ-ONLY-INVESTIGATION-ONLY-Yo_1777765507191.txt — identical content at a different path.
- `attached_assets\Pasted-CHANGE-CONTROL-ENFORCED-READ-ONLY-INVESTIGATION-ONLY-Yo_1777766516133.txt` → archive\prompts\Pasted-CHANGE-CONTROL-ENFORCED-READ-ONLY-INVESTIGATION-ONLY-Yo_1777766516133.txt — identical content at a different path.
- `attached_assets\Pasted-CHANGE-CONTROL-ENFORCED-RELEASE-MATRIX-VERIFIED-You-are_1777743949132.txt` → archive\prompts\Pasted-CHANGE-CONTROL-ENFORCED-RELEASE-MATRIX-VERIFIED-You-are_1777743949132.txt — identical content at a different path.
- `attached_assets\Pasted-Debug-why-Planner-image-import-is-still-losing-detail-A_1778591100405.txt` → archive\prompts\Pasted-Debug-why-Planner-image-import-is-still-losing-detail-A_1778591100405.txt — identical content at a different path.
- `attached_assets\Pasted-DELTA-OBJECTIVE-small-follow-up-The-Pantry-build-is-mos_1772545091780.txt` → archive\prompts\Pasted-DELTA-OBJECTIVE-small-follow-up-The-Pantry-build-is-mos_1772545091780.txt — identical content at a different path.
- `attached_assets\Pasted-Execute-Phase-0-of-the-THA-Planner-Architecture-Revamp-_1778623858657.txt` → archive\prompts\Pasted-Execute-Phase-0-of-the-THA-Planner-Architecture-Revamp-_1778623858657.txt — identical content at a different path.
- `attached_assets\Pasted-FEATURE-Admin-Preferred-Products-THA-Picks-integrated-i_1772399804015.txt` → archive\prompts\Pasted-FEATURE-Admin-Preferred-Products-THA-Picks-integrated-i_1772399804015.txt — identical content at a different path.
- `attached_assets\Pasted-Fix-the-supermarket-integration-so-the-shopping-list-ca_1770763954312.txt` → archive\prompts\Pasted-Fix-the-supermarket-integration-so-the-shopping-list-ca_1770763954312.txt — identical content at a different path.
- `attached_assets\Pasted-getting-this-error-log-i-think-the-household-members-is_1772924490615.txt` → archive\prompts\Pasted-getting-this-error-log-i-think-the-household-members-is_1772924490615.txt — identical content at a different path.
- `attached_assets\Pasted-GOAL-Add-reliable-tracking-for-user-account-creation-ti_1774007762022.txt` → archive\prompts\Pasted-GOAL-Add-reliable-tracking-for-user-account-creation-ti_1774007762022.txt — identical content at a different path.
- `attached_assets\Pasted-hello-replit-i-need-help-troubleshooting-production-AI-_1776199731077.txt` → archive\prompts\Pasted-hello-replit-i-need-help-troubleshooting-production-AI-_1776199731077.txt — identical content at a different path.
- `attached_assets\Pasted-hello-replit-i-need-help-troubleshooting-production-and_1776198922933.txt` → archive\prompts\Pasted-hello-replit-i-need-help-troubleshooting-production-and_1776198922933.txt — identical content at a different path.
- `attached_assets\Pasted-hello-replit-i-want-a-planning-design-prompt-for-the-ne_1776252372027.txt` → archive\prompts\Pasted-hello-replit-i-want-a-planning-design-prompt-for-the-ne_1776252372027.txt — identical content at a different path.
- `attached_assets\Pasted-hello-replit-i-want-a-tightly-scoped-UX-cleanup-of-the-_1776246753346.txt` → archive\prompts\Pasted-hello-replit-i-want-a-tightly-scoped-UX-cleanup-of-the-_1776246753346.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-an-admin-only-User-Search-Tier-Management-too_1772321556317.txt` → archive\prompts\Pasted-Implement-an-admin-only-User-Search-Tier-Management-too_1772321556317.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-Multiple-recipes-per-meal-slot-in-the-Planner_1772356644412.txt` → archive\prompts\Pasted-Implement-Multiple-recipes-per-meal-slot-in-the-Planner_1772356644412.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-Multiple-recipes-per-meal-slot-in-the-Planner_1772360484568.txt` → archive\prompts\Pasted-Implement-Multiple-recipes-per-meal-slot-in-the-Planner_1772360484568.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-Phase-1A-of-the-Planner-Workspace-Revamp-APPR_1778626547368.txt` → archive\prompts\Pasted-Implement-Phase-1A-of-the-Planner-Workspace-Revamp-APPR_1778626547368.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-Phase-1B-of-the-Planner-Workspace-Revamp-APPR_1778627660067.txt` → archive\prompts\Pasted-Implement-Phase-1B-of-the-Planner-Workspace-Revamp-APPR_1778627660067.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-Phase-1C-of-the-Planner-Workspace-Revamp-APPR_1778628541816.txt` → archive\prompts\Pasted-Implement-Phase-1C-of-the-Planner-Workspace-Revamp-APPR_1778628541816.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-Phase-1D-of-the-Planner-Workspace-Revamp-APPR_1778629388294.txt` → archive\prompts\Pasted-Implement-Phase-1D-of-the-Planner-Workspace-Revamp-APPR_1778629388294.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-Phase-2A-of-the-Planner-Workspace-Revamp-APPR_1778630440857.txt` → archive\prompts\Pasted-Implement-Phase-2A-of-the-Planner-Workspace-Revamp-APPR_1778630440857.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-Plan-Templates-Preview-Import-Seasonal-plans-_1772317879490.txt` → archive\prompts\Pasted-Implement-Plan-Templates-Preview-Import-Seasonal-plans-_1772317879490.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-Plan-Templates-Preview-Import-User-Private-Te_1772318675239.txt` → archive\prompts\Pasted-Implement-Plan-Templates-Preview-Import-User-Private-Te_1772318675239.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-source-based-filters-labels-and-soft-grouping_1777809250608.txt` → archive\prompts\Pasted-Implement-source-based-filters-labels-and-soft-grouping_1777809250608.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-structured-section-by-section-Planner-image-e_1778597783317.txt` → archive\prompts\Pasted-Implement-structured-section-by-section-Planner-image-e_1778597783317.txt — identical content at a different path.
- `attached_assets\Pasted-Implement-the-confirmed-Planner-scan-truncation-fix-APP_1778592901311.txt` → archive\prompts\Pasted-Implement-the-confirmed-Planner-scan-truncation-fix-APP_1778592901311.txt — identical content at a different path.
- `attached_assets\Pasted-Improve-the-dashboard-so-it-feels-more-meaningful-warme_1773447937216.txt` → archive\prompts\Pasted-Improve-the-dashboard-so-it-feels-more-meaningful-warme_1773447937216.txt — identical content at a different path.
- `attached_assets\Pasted-In-The-Healthy-Apples-Replit-GitHub-Render-Neon-impleme_1772313784420.txt` → archive\prompts\Pasted-In-The-Healthy-Apples-Replit-GitHub-Render-Neon-impleme_1772313784420.txt — identical content at a different path.
- `attached_assets\Pasted-In-The-Healthy-Apples-Replit-GitHub-Render-Neon-Postgre_1772238792898.txt` → archive\prompts\Pasted-In-The-Healthy-Apples-Replit-GitHub-Render-Neon-Postgre_1772238792898.txt — identical content at a different path.
- `attached_assets\Pasted-now-i-want-the-bakground-of-the-modals-to-use-the-same-_1773948573645.txt` → archive\prompts\Pasted-now-i-want-the-bakground-of-the-modals-to-use-the-same-_1773948573645.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Add-a-persistent-subtle-orchard-meadow-backdr_1772748682079.txt` → archive\prompts\Pasted-Objective-Add-a-persistent-subtle-orchard-meadow-backdr_1772748682079.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Add-a-reusable-The-Healthy-Apples-master-appl_1772735033851.txt` → archive\prompts\Pasted-Objective-Add-a-reusable-The-Healthy-Apples-master-appl_1772735033851.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Create-a-new-THA-site-page-called-Healthy-Liv_1773097341390.txt` → archive\prompts\Pasted-Objective-Create-a-new-THA-site-page-called-Healthy-Liv_1773097341390.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Create-a-premium-landing-page-hero-visual-and_1773415960603.txt` → archive\prompts\Pasted-Objective-Create-a-premium-landing-page-hero-visual-and_1773415960603.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Create-a-read-only-Demo-Mode-at-demo-so-visit_1773089282013.txt` → archive\prompts\Pasted-Objective-Create-a-read-only-Demo-Mode-at-demo-so-visit_1773089282013.txt, archive\prompts\Pasted-Objective-Create-a-read-only-Demo-Mode-at-demo-so-visit_1773089297323.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Create-a-read-only-Demo-Mode-at-demo-so-visit_1773089297323.txt` → archive\prompts\Pasted-Objective-Create-a-read-only-Demo-Mode-at-demo-so-visit_1773089282013.txt, archive\prompts\Pasted-Objective-Create-a-read-only-Demo-Mode-at-demo-so-visit_1773089297323.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Diagnose-and-fix-the-production-error-relatio_1772927014009.txt` → archive\prompts\Pasted-Objective-Diagnose-and-fix-the-production-error-relatio_1772927014009.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Extend-THA-Pantry-to-include-COMMON-HOUSEHOLD_1772522933737.txt` → archive\prompts\Pasted-Objective-Extend-THA-Pantry-to-include-COMMON-HOUSEHOLD_1772522933737.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Fix-the-UI-regressions-introduced-in-the-Calm_1772749968527.txt` → archive\prompts\Pasted-Objective-Fix-the-UI-regressions-introduced-in-the-Calm_1772749968527.txt — identical content at a different path.
- `attached_assets\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536114114.txt` → archive\prompts\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536114114.txt, archive\prompts\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536131559.txt, archive\prompts\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536979052.txt — identical content at a different path.
- `attached_assets\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536131559.txt` → archive\prompts\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536114114.txt, archive\prompts\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536131559.txt, archive\prompts\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536979052.txt — identical content at a different path.
- `attached_assets\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536979052.txt` → archive\prompts\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536114114.txt, archive\prompts\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536131559.txt, archive\prompts\Pasted-OBJECTIVE-Implement-Pantry-as-a-first-class-feature-in-_1772536979052.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Implement-Pantry-Staples-Components-Pairings-_1772406540895.txt` → archive\prompts\Pasted-Objective-Implement-Pantry-Staples-Components-Pairings-_1772406540895.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Plan-a-proper-restricted-demo-account-archite_1773426270348.txt` → archive\prompts\Pasted-Objective-Plan-a-proper-restricted-demo-account-archite_1773426270348.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Refactor-the-THA-basket-into-a-smart-food-int_1773095865436.txt` → archive\prompts\Pasted-Objective-Refactor-the-THA-basket-into-a-smart-food-int_1773095865436.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Refine-the-basket-page-analyse-basket-shoppin_1773186507568.txt` → archive\prompts\Pasted-Objective-Refine-the-basket-page-analyse-basket-shoppin_1773186507568.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Refine-the-global-THA-app-shell-so-it-feels-c_1772794587216.txt` → archive\prompts\Pasted-Objective-Refine-the-global-THA-app-shell-so-it-feels-c_1772794587216.txt, archive\prompts\Pasted-Objective-Refine-the-global-THA-app-shell-so-it-feels-c_1772794614612.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Refine-the-global-THA-app-shell-so-it-feels-c_1772794614612.txt` → archive\prompts\Pasted-Objective-Refine-the-global-THA-app-shell-so-it-feels-c_1772794587216.txt, archive\prompts\Pasted-Objective-Refine-the-global-THA-app-shell-so-it-feels-c_1772794614612.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Refine-the-THA-basket-page-shopping-list-page_1773182901266.txt` → archive\prompts\Pasted-Objective-Refine-the-THA-basket-page-shopping-list-page_1773182901266.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Refine-the-THA-basket-UI-so-it-feels-cleaner-_1773098658876.txt` → archive\prompts\Pasted-Objective-Refine-the-THA-basket-UI-so-it-feels-cleaner-_1773098658876.txt — identical content at a different path.
- `attached_assets\Pasted-Objective-Refine-the-THA-Planner-UX-to-use-a-cleaner-ma_1772785721655.txt` → archive\prompts\Pasted-Objective-Refine-the-THA-Planner-UX-to-use-a-cleaner-ma_1772785721655.txt — identical content at a different path.
- `attached_assets\Pasted-Phase-0-Identify-current-styling-architecture-no-change_1772718491141.txt` → archive\prompts\Pasted-Phase-0-Identify-current-styling-architecture-no-change_1772718491141.txt — identical content at a different path.
- `attached_assets\Pasted-Phase-10-0-Products-Page-Ingredient-Scraping-Ultra-Proc_1770834827195.txt` → archive\prompts\Pasted-Phase-10-0-Products-Page-Ingredient-Scraping-Ultra-Proc_1770834827195.txt — identical content at a different path.
- `attached_assets\Pasted-Phase-10-0-Products-Page-Ingredient-Scraping-Ultra-Proc_1770835432064.txt` → archive\prompts\Pasted-Phase-10-0-Products-Page-Ingredient-Scraping-Ultra-Proc_1770835432064.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-13-MEAL-EXPLAINABILITY-PRODUCT-DEDUPLICATION-ADDI_1770985720407.txt` → archive\prompts\Pasted-PHASE-13-MEAL-EXPLAINABILITY-PRODUCT-DEDUPLICATION-ADDI_1770985720407.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-15-2-SHOPPING-LIST-CLEANUP-NORMALISATION-FILTERS-_1771021469012.txt` → archive\prompts\Pasted-PHASE-15-2-SHOPPING-LIST-CLEANUP-NORMALISATION-FILTERS-_1771021469012.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-15-MEAL-TEMPLATE-ARCHITECTURE-GENERIC-MEAL-LAYER-_1770999619028.txt` → archive\prompts\Pasted-PHASE-15-MEAL-TEMPLATE-ARCHITECTURE-GENERIC-MEAL-LAYER-_1770999619028.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-17-SMART-MEAL-SUGGESTION-ENGINE-PLANNER-INTEGRATI_1770943544924.txt` → archive\prompts\Pasted-PHASE-17-SMART-MEAL-SUGGESTION-ENGINE-PLANNER-INTEGRATI_1770943544924.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-18-FIX-RECIPE-IMPORTER-TO-SUPPORT-JSON-LD-RECIPE-_1771109942272.txt` → archive\prompts\Pasted-PHASE-18-FIX-RECIPE-IMPORTER-TO-SUPPORT-JSON-LD-RECIPE-_1771109942272.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-20-GLOBAL-SHOP-PICKER-SMP-RATING-IN-ANALYSE-BASKE_1771111949712.txt` → archive\prompts\Pasted-PHASE-20-GLOBAL-SHOP-PICKER-SMP-RATING-IN-ANALYSE-BASKE_1771111949712.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-21-PREMIUM-UX-REDESIGN-APPLE-LEVEL-EXPERIENCE-OBJ_1771177262692.txt` → archive\prompts\Pasted-PHASE-21-PREMIUM-UX-REDESIGN-APPLE-LEVEL-EXPERIENCE-OBJ_1771177262692.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-29-Apple-Rating-SVG-System-Create-components-Appl_1771242007447.txt` → archive\prompts\Pasted-PHASE-29-Apple-Rating-SVG-System-Create-components-Appl_1771242007447.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-32-Barcode-Scanner-Product-Analysis-Page-OBJECTIV_1771245190736.txt` → archive\prompts\Pasted-PHASE-32-Barcode-Scanner-Product-Analysis-Page-OBJECTIV_1771245190736.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-38-Freezer-Meals-System-My-Freezer-Meals-OBJECTIV_1771259563442.txt` → archive\prompts\Pasted-PHASE-38-Freezer-Meals-System-My-Freezer-Meals-OBJECTIV_1771259563442.txt — identical content at a different path.
- `attached_assets\Pasted-Phase-4-Household-Fit-Score-Step-11-prompt-implement-sc_1773592836246.txt` → archive\prompts\Pasted-Phase-4-Household-Fit-Score-Step-11-prompt-implement-sc_1773592836246.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-9-1-FULL-IMPLEMENTATION-Ingredient-Separation-Aut_1770767519780.txt` → archive\prompts\Pasted-PHASE-9-1-FULL-IMPLEMENTATION-Ingredient-Separation-Aut_1770767519780.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-9-2-STRUCTURED-INGREDIENT-SYSTEM-AND-SHOPPING-LIS_1770796816307.txt` → archive\prompts\Pasted-PHASE-9-2-STRUCTURED-INGREDIENT-SYSTEM-AND-SHOPPING-LIS_1770796816307.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-9-3-ADVANCED-SHOPPING-LIST-CLEANUP-CATEGORY-COLUM_1770801955620.txt` → archive\prompts\Pasted-PHASE-9-3-ADVANCED-SHOPPING-LIST-CLEANUP-CATEGORY-COLUM_1770801955620.txt — identical content at a different path.
- `attached_assets\Pasted-Phase-9-3-My-Meals-UI-Improvements-and-Shopping-List-In_1770816506238.txt` → archive\prompts\Pasted-Phase-9-3-My-Meals-UI-Improvements-and-Shopping-List-In_1770816506238.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-9-4-ADVANCED-SUPERMARKET-PRICE-TIERS-FULL-SCREEN-_1770805960803.txt` → archive\prompts\Pasted-PHASE-9-4-ADVANCED-SUPERMARKET-PRICE-TIERS-FULL-SCREEN-_1770805960803.txt — identical content at a different path.
- `attached_assets\Pasted-Phase-9-4-Meal-Editing-Instructions-View-Basket-Integra_1770818166426.txt` → archive\prompts\Pasted-Phase-9-4-Meal-Editing-Instructions-View-Basket-Integra_1770818166426.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-9-5-ITEM-LEVEL-PRICE-TIER-CONTROL-CUSTOM-TOTALS-S_1770809980323.txt` → archive\prompts\Pasted-PHASE-9-5-ITEM-LEVEL-PRICE-TIER-CONTROL-CUSTOM-TOTALS-S_1770809980323.txt — identical content at a different path.
- `attached_assets\Pasted-PHASE-9-Shopping-List-Consolidation-Unit-Conversion-and_1770765092773.txt` → archive\prompts\Pasted-PHASE-9-Shopping-List-Consolidation-Unit-Conversion-and_1770765092773.txt — identical content at a different path.
- `attached_assets\Pasted-PRIORITY-1-Profile-Onboarding-consistency-The-user-prof_1773485569582.txt` → archive\prompts\Pasted-PRIORITY-1-Profile-Onboarding-consistency-The-user-prof_1773485569582.txt — identical content at a different path.
- `attached_assets\Pasted-PRIORITY-Apple-scoring-review-and-whole-food-override-W_1773521382469.txt` → archive\prompts\Pasted-PRIORITY-Apple-scoring-review-and-whole-food-override-W_1773521382469.txt — identical content at a different path.
- `attached_assets\Pasted-PRIORITY-User-ingredient-correction-flow-across-Basket-_1773523852224.txt` → archive\prompts\Pasted-PRIORITY-User-ingredient-correction-flow-across-Basket-_1773523852224.txt — identical content at a different path.
- `attached_assets\Pasted-Prompt-3-Build-Quick-Meal-builder-Work-in-the-most-cost_1773692180458.txt` → archive\prompts\Pasted-Prompt-3-Build-Quick-Meal-builder-Work-in-the-most-cost_1773692180458.txt — identical content at a different path.
- `attached_assets\Pasted-Prompt-4-Multi-recipe-meal-method-timing-calculator-Wor_1773692445771.txt` → archive\prompts\Pasted-Prompt-4-Multi-recipe-meal-method-timing-calculator-Wor_1773692445771.txt — identical content at a different path.
- `attached_assets\Pasted-Refinement-remove-obsolete-global-basket-controls-and-s_1773186120490.txt` → archive\prompts\Pasted-Refinement-remove-obsolete-global-basket-controls-and-s_1773186120490.txt — identical content at a different path.
- `attached_assets\Pasted-REPLIT-IMPLEMENTATION-PROMPT-Feature-Global-Meal-Librar_1771335487873.txt` → archive\prompts\Pasted-REPLIT-IMPLEMENTATION-PROMPT-Feature-Global-Meal-Librar_1771335487873.txt — identical content at a different path.
- `attached_assets\Pasted-REPLIT-IMPLEMENTATION-PROMPT-Feature-Premium-Profile-Pa_1771365793996.txt` → archive\prompts\Pasted-REPLIT-IMPLEMENTATION-PROMPT-Feature-Premium-Profile-Pa_1771365793996.txt — identical content at a different path.
- `attached_assets\Pasted-Replit-Prompt-Fix-UI-Rendering-Restore-Orchard-Visuals-_1772746430332.txt` → archive\prompts\Pasted-Replit-Prompt-Fix-UI-Rendering-Restore-Orchard-Visuals-_1772746430332.txt — identical content at a different path.
- `attached_assets\Pasted-Replit-Prompt-Harden-User-API-Responses-Remove-Sensitiv_1772183946595.txt` → archive\prompts\Pasted-Replit-Prompt-Harden-User-API-Responses-Remove-Sensitiv_1772183946595.txt — identical content at a different path.
- `attached_assets\Pasted-Replit-Prompt-Persistent-Orchard-Backdrop-Subtle-More-C_1772747847119.txt` → archive\prompts\Pasted-Replit-Prompt-Persistent-Orchard-Backdrop-Subtle-More-C_1772747847119.txt — identical content at a different path.
- `attached_assets\Pasted-Replit-Prompt-Replace-Face-Scoring-With-THA-Apple-Ratin_1772735198076.txt` → archive\prompts\Pasted-Replit-Prompt-Replace-Face-Scoring-With-THA-Apple-Ratin_1772735198076.txt — identical content at a different path.
- `attached_assets\Pasted-Replit-Prompt-Roll-Back-Qty-Stepper-for-Measured-Quanti_1773357118121.txt` → archive\prompts\Pasted-Replit-Prompt-Roll-Back-Qty-Stepper-for-Measured-Quanti_1773357118121.txt — identical content at a different path.
- `attached_assets\Pasted-Replit-Prompt-Stage-1-5-1-6-Basket-Micro-Polish-Row-Act_1773356302568.txt` → archive\prompts\Pasted-Replit-Prompt-Stage-1-5-1-6-Basket-Micro-Polish-Row-Act_1773356302568.txt — identical content at a different path.
- `attached_assets\Pasted-Replit-Prompt-Stage-1-Basket-Professionalisation-Grid-H_1773354959458.txt` → archive\prompts\Pasted-Replit-Prompt-Stage-1-Basket-Professionalisation-Grid-H_1773354959458.txt — identical content at a different path.
- `attached_assets\Pasted-Replit-Prompt-Stage-2-Basket-Final-Polish-Sticky-Column_1773357497732.txt` → archive\prompts\Pasted-Replit-Prompt-Stage-2-Basket-Final-Polish-Sticky-Column_1773357497732.txt — identical content at a different path.
- `attached_assets\Pasted-Replit-Prompt-THA-Replit-Execution-Rules-Modify-only-fi_1773083503892.txt` → archive\prompts\Pasted-Replit-Prompt-THA-Replit-Execution-Rules-Modify-only-fi_1773083503892.txt — identical content at a different path.
- `attached_assets\Pasted-Review-and-tighten-the-analyser-upgrade-you-just-implem_1773930111314.txt` → archive\prompts\Pasted-Review-and-tighten-the-analyser-upgrade-you-just-implem_1773930111314.txt — identical content at a different path.
- `attached_assets\Pasted-Review-the-completed-Phase-0-Planner-Architecture-Refac_1778625792117.txt` → archive\prompts\Pasted-Review-the-completed-Phase-0-Planner-Architecture-Refac_1778625792117.txt — identical content at a different path.
- `attached_assets\Pasted-Step-4-prompt-add-ingredient-explanation-modal-Work-in-_1773590994740.txt` → archive\prompts\Pasted-Step-4-prompt-add-ingredient-explanation-modal-Work-in-_1773590994740.txt — identical content at a different path.
- `attached_assets\Pasted-Step-9-prompt-build-household-meal-matcher-service-Work_1773592047546.txt` → archive\prompts\Pasted-Step-9-prompt-build-household-meal-matcher-service-Work_1773592047546.txt — identical content at a different path.
- `attached_assets\Pasted-Stop-and-correct-the-implementation-The-current-result-_1773944740902.txt` → archive\prompts\Pasted-Stop-and-correct-the-implementation-The-current-result-_1773944740902.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Basket-Refactor-Food-Intent-Whole-Food-Matching-Mul_1773095131192.txt` → archive\prompts\Pasted-THA-Basket-Refactor-Food-Intent-Whole-Food-Matching-Mul_1773095131192.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Feature-Plan-Scan-Recipes-Meal-Plans-Objective-Impl_1772836911115.txt` → archive\prompts\Pasted-THA-Feature-Plan-Scan-Recipes-Meal-Plans-Objective-Impl_1772836911115.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Household-System-Household-Engine-Architecture-Spec_1772807345969.txt` → archive\prompts\Pasted-THA-Household-System-Household-Engine-Architecture-Spec_1772807345969.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Apple-Rating-Display-Update-_1773350580031.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Apple-Rating-Display-Update-_1773350580031.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Basket-Flow-Fixes-Cost-Effic_1773334677749.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Basket-Flow-Fixes-Cost-Effic_1773334677749.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773188668229.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773188668229.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773190939166.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773190939166.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773222447384.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773222447384.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773225478253.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773225478253.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773228591105.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773228591105.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773231107709.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773231107709.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773311987844.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Do-Not-Deviat_1773311987844.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Mode-Modify-o_1773186993479.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Cost-Efficient-Mode-Modify-o_1773186993479.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Household-Items-in-Basket-Co_1773329631971.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Household-Items-in-Basket-Co_1773329631971.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Household-Items-in-Basket-Co_1773330165472.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Household-Items-in-Basket-Co_1773330165472.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Household-Items-in-Basket-Co_1773329631971.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Household-Items-in-Basket-Co_1773330165472.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Household-Pantry-Input-Flow-_1773332836758.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Household-Pantry-Input-Flow-_1773332836758.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Inspection-Only-Do-Not-Devia_1773252191364.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Inspection-Only-Do-Not-Devia_1773252191364.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Inspection-Only-Do-Not-Devia_1773257705812.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Inspection-Only-Do-Not-Devia_1773257705812.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Inspection-Only-Do-Not-Devia_1773252191364.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Inspection-Only-Do-Not-Devia_1773257705812.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773001504970.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773001504970.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773001973337.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773001973337.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773003669614.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773004033906.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773013708155.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773081900619.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773082523153.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773003669614.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773001973337.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773003669614.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773004033906.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773013708155.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773081900619.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773082523153.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773004033906.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773001973337.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773003669614.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773004033906.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773013708155.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773081900619.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773082523153.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773013708155.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773001973337.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773003669614.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773004033906.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773013708155.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773081900619.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773082523153.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773081900619.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773001973337.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773003669614.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773004033906.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773013708155.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773081900619.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773082523153.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773082523153.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773001973337.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773003669614.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773004033906.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773013708155.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773081900619.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773082523153.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773099559910.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773099559910.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773099837266.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773099837266.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773181705104.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773181705104.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773181821410.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773181821410.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773181705104.txt, archive\prompts\Pasted-THA-Replit-Execution-Rules-Modify-only-files-required-f_1773181821410.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Pantry-Merge-Upgrade-Cost-Ef_1773247728420.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Pantry-Merge-Upgrade-Cost-Ef_1773247728420.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Pantry-Phase-1-Cost-Efficien_1773239727405.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Pantry-Phase-1-Cost-Efficien_1773239727405.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Scoring-Inspection-Small-Per_1773262055503.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Scoring-Inspection-Small-Per_1773262055503.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Execution-Rules-Scoring-Refinement-Pass-Cost_1773263619071.txt` → archive\prompts\Pasted-THA-Replit-Execution-Rules-Scoring-Refinement-Pass-Cost_1773263619071.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Prompt-Household-Intelligence-My-Diary-Objec_1772930895222.txt` → archive\prompts\Pasted-THA-Replit-Prompt-Household-Intelligence-My-Diary-Objec_1772930895222.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Prompt-Household-Intelligence-Personal-Food-_1772930026591.txt` → archive\prompts\Pasted-THA-Replit-Prompt-Household-Intelligence-Personal-Food-_1772930026591.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Replit-Prompt-Household-System-THA-Household-Engine_1772806307307.txt` → archive\prompts\Pasted-THA-Replit-Prompt-Household-System-THA-Household-Engine_1772806307307.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-1A-Househ_1772808860476.txt` → archive\prompts\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-1A-Househ_1772808860476.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-1B-Househ_1772831187250.txt` → archive\prompts\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-1B-Househ_1772831187250.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-1B-Househ_1772832496422.txt` → archive\prompts\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-1B-Househ_1772832496422.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-1B-Househ_1772832713580.txt` → archive\prompts\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-1B-Househ_1772832713580.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-2-Househo_1772834541655.txt` → archive\prompts\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-2-Househo_1772834541655.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-2-Househo_1772834880802.txt` → archive\prompts\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-2-Househo_1772834880802.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-2-Househo_1772834990334.txt` → archive\prompts\Pasted-THA-Repo-Specific-Implementation-Prompt-Phase-2-Househo_1772834990334.txt — identical content at a different path.
- `attached_assets\Pasted-THA-Repo-Specific-Implementation-Prompt-Scan-Recipes-Me_1772837433899.txt` → archive\prompts\Pasted-THA-Repo-Specific-Implementation-Prompt-Scan-Recipes-Me_1772837433899.txt — identical content at a different path.
- `attached_assets\Pasted-This-is-not-complete-and-it-is-still-not-doing-what-I-a_1774133799351.txt` → archive\prompts\Pasted-This-is-not-complete-and-it-is-still-not-doing-what-I-a_1774133799351.txt — identical content at a different path.
- `attached_assets\Pasted-Tighten-the-analyser-implementation-without-expanding-s_1773917843147.txt` → archive\prompts\Pasted-Tighten-the-analyser-implementation-without-expanding-s_1773917843147.txt, archive\prompts\Pasted-Tighten-the-analyser-implementation-without-expanding-s_1773918030213.txt — identical content at a different path.
- `attached_assets\Pasted-Tighten-the-analyser-implementation-without-expanding-s_1773918030213.txt` → archive\prompts\Pasted-Tighten-the-analyser-implementation-without-expanding-s_1773917843147.txt, archive\prompts\Pasted-Tighten-the-analyser-implementation-without-expanding-s_1773918030213.txt — identical content at a different path.
- `attached_assets\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770758708026.txt` → archive\prompts\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770758708026.txt — identical content at a different path.
- `attached_assets\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770759912470.txt` → archive\prompts\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770759912470.txt, archive\prompts\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770762953024.txt, archive\prompts\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770763022247.txt — identical content at a different path.
- `attached_assets\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770762953024.txt` → archive\prompts\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770759912470.txt, archive\prompts\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770762953024.txt, archive\prompts\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770763022247.txt — identical content at a different path.
- `attached_assets\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770763022247.txt` → archive\prompts\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770759912470.txt, archive\prompts\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770762953024.txt, archive\prompts\Pasted-Upgrade-SmartMeal-Planner-to-support-full-macro-calcula_1770763022247.txt — identical content at a different path.
- `attached_assets\Pasted-Upgrade-SmartMeal-Planner-to-support-full-meal-categori_1770761570931.txt` → archive\prompts\Pasted-Upgrade-SmartMeal-Planner-to-support-full-meal-categori_1770761570931.txt — identical content at a different path.
- `attached_assets\Pasted-Upgrade-the-existing-SmartMeal-Planner-Node-js-app-to-s_1770669298321.txt` → archive\prompts\Pasted-Upgrade-the-existing-SmartMeal-Planner-Node-js-app-to-s_1770669298321.txt — identical content at a different path.
- `attached_assets\Pasted-Upgrade-the-SmartMeal-Planner-app-to-improve-ingredient_1770671262472.txt` → archive\prompts\Pasted-Upgrade-the-SmartMeal-Planner-app-to-improve-ingredient_1770671262472.txt — identical content at a different path.
- `attached_assets\Pasted-Use-the-existing-implementation-from-the-previous-step-_1774045774686.txt` → archive\prompts\Pasted-Use-the-existing-implementation-from-the-previous-step-_1774045774686.txt — identical content at a different path.
- `attached_assets\Pasted-Use-the-existing-implementation-from-the-previous-step-_1774046218263.txt` → archive\prompts\Pasted-Use-the-existing-implementation-from-the-previous-step-_1774046218263.txt — identical content at a different path.
- `attached_assets\Pasted-We-are-fixing-one-approved-scope-only-TRUST-LAYER-AI-in_1777794038699.txt` → archive\prompts\Pasted-We-are-fixing-one-approved-scope-only-TRUST-LAYER-AI-in_1777794038699.txt — identical content at a different path.
- `attached_assets\Pasted-We-are-implementing-ONE-approved-change-only-Add-a-CONS_1777799269574.txt` → archive\prompts\Pasted-We-are-implementing-ONE-approved-change-only-Add-a-CONS_1777799269574.txt — identical content at a different path.
- `attached_assets\Pasted-We-are-implementing-ONE-approved-change-only-Add-a-ligh_1777797167163.txt` → archive\prompts\Pasted-We-are-implementing-ONE-approved-change-only-Add-a-ligh_1777797167163.txt — identical content at a different path.
- `attached_assets\Pasted-We-are-implementing-ONE-approved-change-only-Add-top-3-_1777799920964.txt` → archive\prompts\Pasted-We-are-implementing-ONE-approved-change-only-Add-top-3-_1777799920964.txt — identical content at a different path.
- `attached_assets\Pasted-We-are-implementing-ONE-approved-change-only-Constrain-_1777798253682.txt` → archive\prompts\Pasted-We-are-implementing-ONE-approved-change-only-Constrain-_1777798253682.txt — identical content at a different path.
- `attached_assets\Pasted-We-are-implementing-ONE-approved-change-only-Include-es_1777796322380.txt` → archive\prompts\Pasted-We-are-implementing-ONE-approved-change-only-Include-es_1777796322380.txt — identical content at a different path.
- `attached_assets\Pasted-We-are-implementing-ONE-approved-change-only-Make-Revie_1777797762073.txt` → archive\prompts\Pasted-We-are-implementing-ONE-approved-change-only-Make-Revie_1777797762073.txt — identical content at a different path.
- `attached_assets\Pasted-We-are-implementing-ONE-approved-change-only-Safe-estim_1777795595394.txt` → archive\prompts\Pasted-We-are-implementing-ONE-approved-change-only-Safe-estim_1777795595394.txt — identical content at a different path.
- `attached_assets\Pasted-We-are-live-in-production-on-Render-and-we-need-to-add-_1771969516856.txt` → archive\prompts\Pasted-We-are-live-in-production-on-Render-and-we-need-to-add-_1771969516856.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773589221816.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773589221816.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773590192193.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773590192193.txt, archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773590210069.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773590210069.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773590192193.txt, archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773590210069.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773697692980.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773697692980.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699038710.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699038710.txt, archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699127366.txt, archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699138657.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699127366.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699038710.txt, archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699127366.txt, archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699138657.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699138657.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699038710.txt, archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699127366.txt, archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773699138657.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773701513256.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773701513256.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773733678936.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773733678936.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773744476755.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773744476755.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773758912081.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773758912081.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773759806485.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1773759806485.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1774015699249.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1774015699249.txt — identical content at a different path.
- `attached_assets\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1774048920351.txt` → archive\prompts\Pasted-Work-in-the-most-cost-efficient-way-possible-Important-_1774048920351.txt — identical content at a different path.
- `attached_assets\Pasted-You-are-investigating-a-production-only-backend-issue-B_1773393307434.txt` → archive\prompts\Pasted-You-are-investigating-a-production-only-backend-issue-B_1773393307434.txt — identical content at a different path.
- `attached_assets\Pasted-You-are-making-a-safe-production-data-update-for-pantry_1773397530596.txt` → archive\prompts\Pasted-You-are-making-a-safe-production-data-update-for-pantry_1773397530596.txt — identical content at a different path.
- `attached_assets\Pasted-You-are-making-a-small-cost-controlled-refinement-to-th_1773358208917.txt` → archive\prompts\Pasted-You-are-making-a-small-cost-controlled-refinement-to-th_1773358208917.txt — identical content at a different path.
- `attached_assets\Pasted-You-are-now-implementing-the-FIRST-post-investigation-r_1778573735570.txt` → archive\prompts\Pasted-You-are-now-implementing-the-FIRST-post-investigation-r_1778573735570.txt — identical content at a different path.
- `attached_assets\Pasted-You-are-working-in-the-THA-repo-Work-carefully-keep-cha_1773914905385.txt` → archive\prompts\Pasted-You-are-working-in-the-THA-repo-Work-carefully-keep-cha_1773914905385.txt, archive\prompts\Pasted-You-are-working-in-the-THA-repo-Work-carefully-keep-cha_1773915087534.txt — identical content at a different path.
- `attached_assets\Pasted-You-are-working-in-the-THA-repo-Work-carefully-keep-cha_1773915087534.txt` → archive\prompts\Pasted-You-are-working-in-the-THA-repo-Work-carefully-keep-cha_1773914905385.txt, archive\prompts\Pasted-You-are-working-in-the-THA-repo-Work-carefully-keep-cha_1773915087534.txt — identical content at a different path.
- `attached_assets\Pasted-You-are-working-on-The-Healthy-Apples-production-codeba_1777801684803.txt` → archive\prompts\Pasted-You-are-working-on-The-Healthy-Apples-production-codeba_1777801684803.txt — identical content at a different path.
- `attached_assets\Pasted-You-are-working-on-The-Healthy-Apples-production-codeba_1777802780848.txt` → archive\prompts\Pasted-You-are-working-on-The-Healthy-Apples-production-codeba_1777802780848.txt — identical content at a different path.
- `attached_assets\Pasted-You-are-working-on-The-Healthy-Apples-THA-web-app-We-ne_1772577681565.txt` → archive\prompts\Pasted-You-are-working-on-The-Healthy-Apples-THA-web-app-We-ne_1772577681565.txt — identical content at a different path.
- `attached_assets\Pasted-Your-plan-is-approved-with-these-required-adjustments-b_1772361916831.txt` → archive\prompts\Pasted-Your-plan-is-approved-with-these-required-adjustments-b_1772361916831.txt — identical content at a different path.
- `attached_assets\Screenshot_2026-02-23_at_17.00.41_1771866089707.png` → archive\assets\Screenshot_2026-02-23_at_17.00.41_1771866089707.png, archive\assets\Screenshot_2026-02-23_at_17.00.41_1771866151473.png — identical content at a different path.
- `attached_assets\Screenshot_2026-02-23_at_17.00.41_1771866151473.png` → archive\assets\Screenshot_2026-02-23_at_17.00.41_1771866089707.png, archive\assets\Screenshot_2026-02-23_at_17.00.41_1771866151473.png — identical content at a different path.
- `attached_assets\Screenshot_2026-02-23_at_17.00.55_1771866089708.png` → archive\assets\Screenshot_2026-02-23_at_17.00.55_1771866089708.png, archive\assets\Screenshot_2026-02-23_at_17.00.55_1771866151473.png — identical content at a different path.
- `attached_assets\Screenshot_2026-02-23_at_17.00.55_1771866151473.png` → archive\assets\Screenshot_2026-02-23_at_17.00.55_1771866089708.png, archive\assets\Screenshot_2026-02-23_at_17.00.55_1771866151473.png — identical content at a different path.
- `attached_assets\Screenshot_2026-02-23_at_17.01.03_1771866089708.png` → archive\assets\Screenshot_2026-02-23_at_17.01.03_1771866089708.png, archive\assets\Screenshot_2026-02-23_at_17.01.03_1771866151473.png — identical content at a different path.
- `attached_assets\Screenshot_2026-02-23_at_17.01.03_1771866151473.png` → archive\assets\Screenshot_2026-02-23_at_17.01.03_1771866089708.png, archive\assets\Screenshot_2026-02-23_at_17.01.03_1771866151473.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-05_at_10.02.26_1772705114667.png` → archive\assets\Screenshot_2026-03-05_at_10.02.26_1772705114667.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-05_at_16.06.40_1772726829385.png` → archive\assets\Screenshot_2026-03-05_at_16.06.40_1772726829385.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-06_at_22.34.05_1772836581966.png` → archive\assets\Screenshot_2026-03-06_at_22.34.05_1772836581966.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-08_at_18.22.41_1773015358457.png` → archive\assets\Screenshot_2026-03-08_at_18.22.41_1773015358457.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-11_at_21.36.30_1773265068147.png` → archive\assets\Screenshot_2026-03-11_at_21.36.30_1773265068147.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-12_at_15.06.51_1773328112445.png` → archive\assets\Screenshot_2026-03-12_at_15.06.51_1773328112445.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-12_at_15.07.01_1773328092974.png` → archive\assets\Screenshot_2026-03-12_at_15.07.01_1773328092974.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-12_at_20.21.20_1773346947324.png` → archive\assets\Screenshot_2026-03-12_at_20.21.20_1773346947324.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-12_at_21.50.07_1773352265531.png` → archive\assets\Screenshot_2026-03-12_at_21.50.07_1773352265531.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-12_at_21.53.02_1773352396058.png` → archive\assets\Screenshot_2026-03-12_at_21.53.02_1773352396058.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-13_at_16.37.20_1773419916971.png` → archive\assets\Screenshot_2026-03-13_at_16.37.20_1773419916971.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-13_at_23.56.27_1773446223464.png` → archive\assets\Screenshot_2026-03-13_at_23.56.27_1773446223464.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-16_at_23.01.11_1773702087127.png` → archive\assets\Screenshot_2026-03-16_at_23.01.11_1773702087127.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-17_at_19.25.12_1773775538950.png` → archive\assets\Screenshot_2026-03-17_at_19.25.12_1773775538950.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-19_at_18.57.29_1773946669572.png` → archive\assets\Screenshot_2026-03-19_at_18.57.29_1773946669572.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-19_at_19.29.14_1773948593191.png` → archive\assets\Screenshot_2026-03-19_at_19.29.14_1773948593191.png — identical content at a different path.
- `attached_assets\Screenshot_2026-03-21_at_23.27.38_1774135696382.png` → archive\assets\Screenshot_2026-03-21_at_23.27.38_1774135696382.png — identical content at a different path.
- `attached_assets\tha_logo_transparent_1772799303316.png` → archive\assets\tha_logo_transparent_1772799303316.png — identical content at a different path.
- `attached_assets\THA_long_transparent_1772799327979.png` → archive\assets\THA_long_transparent_1772799327979.png — identical content at a different path.
- `attached_assets\the_healthy_apples_logo_1772702298025.png` → archive\assets\the_healthy_apples_logo_1772702298025.png — identical content at a different path.
- `attached_assets\thehealthy_apples_transparent_logo__1773438557183.png` → archive\assets\thehealthy_apples_transparent_logo__1773438557183.png — identical content at a different path.
- `attached_assets\thehealthy_apples_transparent_logo_cropped_1773790275780.png` → archive\assets\thehealthy_apples_transparent_logo_cropped_1773790275780.png — identical content at a different path.
- `client\public\apple-rating-1.png` → archive\assets\_new_single_apple_1772726624473.png — identical content at a different path.
- `client\public\apple-rating-2.png` → archive\assets\2_apples_new_1772726624473.png — identical content at a different path.
- `client\public\apple-rating-3.png` → archive\assets\3_apples_new_1772726624473.png — identical content at a different path.
- `client\public\apple-rating-4.png` → archive\assets\4_apples_new_1772726624473.png — identical content at a different path.
- `client\public\apple-rating-5.png` → archive\assets\5_apples_new_1772726624473.png — identical content at a different path.
- `client\public\logo-square.png` → archive\assets\choose_better_1772726624473.png — identical content at a different path.
- `client\public\orchard-bg.png` → archive\assets\orchard_background_concept_1772753707742.png, attached_assets\orchard_background_concept_1772752768712.png — identical content at a different path.
- `docs\investigations\ADULT_HOUSEHOLD_EATER_DIET_ENRICHMENT.md` → docs\investigations\planner\ADULT_HOUSEHOLD_EATER_DIET_ENRICHMENT.md — identical content at a different path.
- `docs\investigations\After clearing all planner weeks.md` → docs\investigations\planner\After clearing all planner weeks.md — identical content at a different path.
- `docs\investigations\CANONICAL_FOOD_IDENTITY_ARCHITECTURE.md` → docs\investigations\knowledge\CANONICAL_FOOD_IDENTITY_ARCHITECTURE.md — identical content at a different path.
- `docs\investigations\clean up planner restriction.md` → docs\investigations\planner\clean up planner restriction.md — identical content at a different path.
- `docs\investigations\COMPONENT_CLASSIFICATION_SMART_PLANNER_FIX.md` → docs\investigations\cookbook\COMPONENT_CLASSIFICATION_SMART_PLANNER_FIX.md — identical content at a different path.
- `docs\investigations\COMPONENT_MEAL_ADAPTABILITY_RANKING.md` → docs\investigations\cookbook\COMPONENT_MEAL_ADAPTABILITY_RANKING.md — identical content at a different path.
- `docs\investigations\COMPONENT_MEAL_CATALOGUE_RANKING.md` → docs\investigations\cookbook\COMPONENT_MEAL_CATALOGUE_RANKING.md — identical content at a different path.
- `docs\investigations\COMPONENT_VS_MEAL_CLASSIFICATION_AUDIT.md` → docs\investigations\cookbook\COMPONENT_VS_MEAL_CLASSIFICATION_AUDIT.md — identical content at a different path.
- `docs\investigations\COOKED_BREAKFAST_MEAL_SHELL_SEED.md` → docs\investigations\cookbook\COOKED_BREAKFAST_MEAL_SHELL_SEED.md — identical content at a different path.
- `docs\investigations\DIETARY_PATTERN_CUISINE_EXISTING_STRUCTURE_FEASIBILITY.md` → docs\investigations\knowledge\DIETARY_PATTERN_CUISINE_EXISTING_STRUCTURE_FEASIBILITY.md — identical content at a different path.
- `docs\investigations\DIETARY_PATTERN_CUISINE_SEPARATION_IMPACT_AUDIT.md` → docs\investigations\knowledge\DIETARY_PATTERN_CUISINE_SEPARATION_IMPACT_AUDIT.md — identical content at a different path.
- `docs\investigations\Enforce Profile dietary requirements.md` → docs\investigations\planner\Enforce Profile dietary requirements.md — identical content at a different path.
- `docs\investigations\FAMILY_CONFIDENCE_LEARNING_COPY_UPDATE.md` → docs\investigations\ux\FAMILY_CONFIDENCE_LEARNING_COPY_UPDATE.md — identical content at a different path.
- `docs\investigations\FLEXIBLE_MEAL_OCCASION_AND_SHELL_SUITABILITY.md` → docs\investigations\cookbook\FLEXIBLE_MEAL_OCCASION_AND_SHELL_SUITABILITY.md — identical content at a different path.
- `docs\investigations\GLUTEN_LIBRARY_COVERAGE_ALIGNMENT.md` → docs\investigations\knowledge\GLUTEN_LIBRARY_COVERAGE_ALIGNMENT.md — identical content at a different path.
- `docs\investigations\HEALTHY_TIKKA_MASALA_TRACE_INVESTIGATION.md` → docs\investigations\knowledge\HEALTHY_TIKKA_MASALA_TRACE_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_AWARE_NUTRITION_BOOSTS_INVESTIGATION.md` → docs\investigations\knowledge\HOUSEHOLD_AWARE_NUTRITION_BOOSTS_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_ENGINE_LIVE_VALIDATION.md` → docs\investigations\planner\HOUSEHOLD_COMPATIBILITY_ENGINE_LIVE_VALIDATION.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_PHASE2_IMPLEMENTATION.md` → docs\investigations\planner\HOUSEHOLD_COMPATIBILITY_PHASE2_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_PHASE2_NORMAL_MEAL_ADAPTER_PLAN.md` → docs\investigations\planner\HOUSEHOLD_COMPATIBILITY_PHASE2_NORMAL_MEAL_ADAPTER_PLAN.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_PHASE3_PLANNER_INTEGRATION.md` → docs\investigations\planner\HOUSEHOLD_COMPATIBILITY_PHASE3_PLANNER_INTEGRATION.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_RESTRICTION_RESOLVER_FEASIBILITY.md` → docs\investigations\planner\HOUSEHOLD_COMPATIBILITY_RESTRICTION_RESOLVER_FEASIBILITY.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_REVIEW_DESIGN.md` → docs\investigations\planner\HOUSEHOLD_COMPATIBILITY_REVIEW_DESIGN.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_COMPATIBILITY_V1_MASTER_PLAN.md` → docs\investigations\planner\HOUSEHOLD_COMPATIBILITY_V1_MASTER_PLAN.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_EATERS_ADULT_CHIPS_PROFILE_ONLY_FIX.md` → docs\investigations\ux\HOUSEHOLD_EATERS_ADULT_CHIPS_PROFILE_ONLY_FIX.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_EATERS_ADULT_PROFILE_DATA_SOURCE_INVESTIGATION.md` → docs\investigations\planner\HOUSEHOLD_EATERS_ADULT_PROFILE_DATA_SOURCE_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_EATERS_ADULT_USERID_MAPPING_VALIDATION.md` → docs\investigations\planner\HOUSEHOLD_EATERS_ADULT_USERID_MAPPING_VALIDATION.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_EATERS_CHIP_DISPLAY_INVESTIGATION.md` → docs\investigations\ux\HOUSEHOLD_EATERS_CHIP_DISPLAY_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_EATERS_FULL_VISIBILITY_IMPLEMENTATION.md` → docs\investigations\ux\HOUSEHOLD_EATERS_FULL_VISIBILITY_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\HOUSEHOLD_EATERS_INTEGRATION_AUDIT.md` → docs\investigations\planner\HOUSEHOLD_EATERS_INTEGRATION_AUDIT.md — identical content at a different path.
- `docs\investigations\HUMAN_CENTRED_STYLE_TAGS.md` → docs\investigations\ux\HUMAN_CENTRED_STYLE_TAGS.md — identical content at a different path.
- `docs\investigations\HYBRID_MEAL_OCCASION_IMPLEMENTATION.md` → docs\investigations\cookbook\HYBRID_MEAL_OCCASION_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\HYBRID_MEAL_OCCASION_MODEL_IMPLEMENTATION_SCOPE.md` → docs\investigations\cookbook\HYBRID_MEAL_OCCASION_MODEL_IMPLEMENTATION_SCOPE.md — identical content at a different path.
- `docs\investigations\INGREDIENT_IMAGERY_INFRASTRUCTURE_IMPLEMENTATION.md` → docs\investigations\cookbook\INGREDIENT_IMAGERY_INFRASTRUCTURE_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\INGREDIENT_IMAGERY_LIBRARY_INVESTIGATION.md` → docs\investigations\cookbook\INGREDIENT_IMAGERY_LIBRARY_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\ingredients-fetch.md` → docs\investigations\engineering\ingredients-fetch.md — identical content at a different path.
- `docs\investigations\Investigate why a beef and bacon recipe is still appearing in a Vegan.md` → docs\investigations\planner\Investigate why a beef and bacon recipe is still appearing in a Vegan.md — identical content at a different path.
- `docs\investigations\KETO_LOW_CARB_DIETARY_DICTIONARY_IMPLEMENTATION.md` → docs\investigations\knowledge\KETO_LOW_CARB_DIETARY_DICTIONARY_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\LIVE_HOUSEHOLD_COMPONENT_MEAL_VALIDATION.md` → docs\investigations\cookbook\LIVE_HOUSEHOLD_COMPONENT_MEAL_VALIDATION.md — identical content at a different path.
- `docs\investigations\M1_RETIRE_NUTRITION_BENEFIT_LIBRARY.md` → docs\investigations\knowledge\M1_RETIRE_NUTRITION_BENEFIT_LIBRARY.md — identical content at a different path.
- `docs\investigations\M1A_WS0_SEED_AND_CANONICAL_DISPLAY_IMPLEMENTATION.md` → docs\investigations\knowledge\M1A_WS0_SEED_AND_CANONICAL_DISPLAY_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\MATCH_MEALS_HOUSEHOLD_EATERS_IMPLEMENTATION.md` → docs\investigations\planner\MATCH_MEALS_HOUSEHOLD_EATERS_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\MATCH_MEALS_HOUSEHOLD_EATERS_MIGRATION_SCOPE.md` → docs\investigations\planner\MATCH_MEALS_HOUSEHOLD_EATERS_MIGRATION_SCOPE.md — identical content at a different path.
- `docs\investigations\MEAL_DETAIL_EXPERIENCE_V3_IMPLEMENTATION.md` → docs\investigations\cookbook\MEAL_DETAIL_EXPERIENCE_V3_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\MEAL_DETAIL_FAMILY_CONFIDENCE_TRUST_FIX.md` → docs\investigations\cookbook\MEAL_DETAIL_FAMILY_CONFIDENCE_TRUST_FIX.md — identical content at a different path.
- `docs\investigations\MEAL_DETAIL_V3_PHASE1_CORRECTIONS_AND_VERIFICATION.md` → docs\investigations\cookbook\MEAL_DETAIL_V3_PHASE1_CORRECTIONS_AND_VERIFICATION.md — identical content at a different path.
- `docs\investigations\MEAL_DIALOG_INFORMATION_DENSITY_REDUCTION.md` → docs\investigations\ux\MEAL_DIALOG_INFORMATION_DENSITY_REDUCTION.md — identical content at a different path.
- `docs\investigations\MEAL_ENHANCEMENT_MEAL_FIT_PROTECTION_RULE.md` → docs\investigations\planner\MEAL_ENHANCEMENT_MEAL_FIT_PROTECTION_RULE.md — identical content at a different path.
- `docs\investigations\MEAL_ENHANCEMENT_PLATFORM_ARCHITECTURE.md` → docs\investigations\planner\MEAL_ENHANCEMENT_PLATFORM_ARCHITECTURE.md — identical content at a different path.
- `docs\investigations\MEAL_ENHANCEMENT_SYSTEM_CONSOLIDATION_INVESTIGATION.md` → docs\investigations\planner\MEAL_ENHANCEMENT_SYSTEM_CONSOLIDATION_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\MEAL_ENHANCEMENT_WEEKLY_REUSE_IMPLEMENTATION.md` → docs\investigations\planner\MEAL_ENHANCEMENT_WEEKLY_REUSE_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\MEAL_ENHANCEMENT_WEEKLY_REUSE_INVESTIGATION.md` → docs\investigations\planner\MEAL_ENHANCEMENT_WEEKLY_REUSE_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\MEAL_SHELL_LIVE_PATH_VALIDATION.md` → docs\investigations\cookbook\MEAL_SHELL_LIVE_PATH_VALIDATION.md — identical content at a different path.
- `docs\investigations\MEAL_TEMPLATE_ARCHITECTURE_AUDIT.md` → docs\investigations\cookbook\MEAL_TEMPLATE_ARCHITECTURE_AUDIT.md — identical content at a different path.
- `docs\investigations\MEAL_TEMPLATE_SLOT_WRITE_PATH_INVESTIGATION.md` → docs\investigations\cookbook\MEAL_TEMPLATE_SLOT_WRITE_PATH_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\MEAL_UPLIFT_APPLICATIONS_DEV_MIGRATION_IMPLEMENTATION.md` → docs\investigations\intelligence\MEAL_UPLIFT_APPLICATIONS_DEV_MIGRATION_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\MEAL_UPLIFT_APPLICATIONS_MIGRATION_VALIDATION.md` → docs\investigations\intelligence\MEAL_UPLIFT_APPLICATIONS_MIGRATION_VALIDATION.md — identical content at a different path.
- `docs\investigations\MEAL_VARIETY_NUDGE_RETIREMENT.md` → docs\investigations\planner\MEAL_VARIETY_NUDGE_RETIREMENT.md — identical content at a different path.
- `docs\investigations\NORMAL_MEAL_COMPATIBILITY_ENGINE_FEASIBILITY.md` → docs\investigations\planner\NORMAL_MEAL_COMPATIBILITY_ENGINE_FEASIBILITY.md — identical content at a different path.
- `docs\investigations\NUTRITION_BENEFIT_ENRICHMENT_GAP_INVESTIGATION.md` → docs\investigations\knowledge\NUTRITION_BENEFIT_ENRICHMENT_GAP_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\NUTRITION_BENEFIT_LIBRARY_IMPLEMENTATION.md` → docs\investigations\knowledge\NUTRITION_BENEFIT_LIBRARY_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_CLIENT_STATE_REFRESH_INVESTIGATION.md` → docs\investigations\intelligence\NUTRITION_BOOST_CLIENT_STATE_REFRESH_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_COMPACT_UX_REFINEMENT.md` → docs\investigations\intelligence\NUTRITION_BOOST_COMPACT_UX_REFINEMENT.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_DUPLICATION_INVESTIGATION.md` → docs\investigations\intelligence\NUTRITION_BOOST_DUPLICATION_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_FORK_STATE_CACHE_FIX.md` → docs\investigations\intelligence\NUTRITION_BOOST_FORK_STATE_CACHE_FIX.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_FORK_STATE_FINAL_VALIDATION.md` → docs\investigations\intelligence\NUTRITION_BOOST_FORK_STATE_FINAL_VALIDATION.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_INGREDIENT_ROW_PROVENANCE_IMPLEMENTATION.md` → docs\investigations\intelligence\NUTRITION_BOOST_INGREDIENT_ROW_PROVENANCE_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_INGREDIENT_ROW_PROVENANCE_MATCH_INVESTIGATION.md` → docs\investigations\intelligence\NUTRITION_BOOST_INGREDIENT_ROW_PROVENANCE_MATCH_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_INGREDIENT_VISIBILITY_FIX.md` → docs\investigations\intelligence\NUTRITION_BOOST_INGREDIENT_VISIBILITY_FIX.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_MODAL_STATE_LABEL_REMOVE.md` → docs\investigations\intelligence\NUTRITION_BOOST_MODAL_STATE_LABEL_REMOVE.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_PANEL_PERSISTENCE_AND_CACHE_VERIFICATION.md` → docs\investigations\intelligence\NUTRITION_BOOST_PANEL_PERSISTENCE_AND_CACHE_VERIFICATION.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_PROVENANCE_DISPLAY_INVESTIGATION.md` → docs\investigations\intelligence\NUTRITION_BOOST_PROVENANCE_DISPLAY_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_PROVENANCE_QUERY_ENABLE_FIX.md` → docs\investigations\intelligence\NUTRITION_BOOST_PROVENANCE_QUERY_ENABLE_FIX.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_RUNTIME_PROOF_INVESTIGATION.md` → docs\investigations\intelligence\NUTRITION_BOOST_RUNTIME_PROOF_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_SYSTEM_MERGE_IMPLEMENTATION.md` → docs\investigations\intelligence\NUTRITION_BOOST_SYSTEM_MERGE_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\NUTRITION_BOOST_VISIBLE_IDEA_LIMIT_INCREASE.md` → docs\investigations\intelligence\NUTRITION_BOOST_VISIBLE_IDEA_LIMIT_INCREASE.md — identical content at a different path.
- `docs\investigations\PAGEHEADER_ADAPTIVE_DENSITY_MIGRATION.md` → docs\investigations\ux\PAGEHEADER_ADAPTIVE_DENSITY_MIGRATION.md — identical content at a different path.
- `docs\investigations\PANTRY_KNOWLEDGE_POPULATION_INVESTIGATION.md` → docs\investigations\knowledge\PANTRY_KNOWLEDGE_POPULATION_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\PANTRY_V2_NUTRITION_KNOWLEDGE_HUB.md` → docs\investigations\knowledge\PANTRY_V2_NUTRITION_KNOWLEDGE_HUB.md — identical content at a different path.
- `docs\investigations\pantry-category-fix-summary.md` → docs\investigations\knowledge\pantry-category-fix-summary.md — identical content at a different path.
- `docs\investigations\pantry-category-fix-workings.md` → docs\investigations\knowledge\pantry-category-fix-workings.md — identical content at a different path.
- `docs\investigations\PARTIAL_HOUSEHOLD_COMPATIBILITY_FEASIBILITY.md` → docs\investigations\planner\PARTIAL_HOUSEHOLD_COMPATIBILITY_FEASIBILITY.md — identical content at a different path.
- `docs\investigations\PHASE_5A_SMART_PLANNER_RESTRICTION_FILTER.md` → docs\investigations\planner\PHASE_5A_SMART_PLANNER_RESTRICTION_FILTER.md — identical content at a different path.
- `docs\investigations\PLANNER_ARCHIVE_HOUSEHOLD_FAMILIARITY.md` → docs\investigations\planner\PLANNER_ARCHIVE_HOUSEHOLD_FAMILIARITY.md — identical content at a different path.
- `docs\investigations\PLANNER_ASSISTANT_WORKSPACE_FEASIBILITY_INVESTIGATION.md` → docs\investigations\planner\PLANNER_ASSISTANT_WORKSPACE_FEASIBILITY_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\PLANNER_BOOST_COUNT_RECONCILIATION.md` → docs\investigations\planner\PLANNER_BOOST_COUNT_RECONCILIATION.md — identical content at a different path.
- `docs\investigations\PLANNER_HISTORY_RETENTION_INVESTIGATION.md` → docs\investigations\planner\PLANNER_HISTORY_RETENTION_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\PLANNER_MEAL_CARD_V2_REFINEMENT.md` → docs\investigations\planner\PLANNER_MEAL_CARD_V2_REFINEMENT.md — identical content at a different path.
- `docs\investigations\PLANNER_VISIBLE_WEEK_EXECUTION_TRACE.md` → docs\investigations\planner\PLANNER_VISIBLE_WEEK_EXECUTION_TRACE.md — identical content at a different path.
- `docs\investigations\planner-compliance-cleanup-dry-run.md` → docs\investigations\planner\planner-compliance-cleanup-dry-run.md — identical content at a different path.
- `docs\investigations\planner-compliance-gate-merge-report.md` → docs\investigations\planner\planner-compliance-gate-merge-report.md — identical content at a different path.
- `docs\investigations\planner-profile-compliance-gate-implementation.md` → docs\investigations\planner\planner-profile-compliance-gate-implementation.md — identical content at a different path.
- `docs\investigations\PLANT_DIVERSITY_CANONICAL_RESOLUTION_INVESTIGATION.md` → docs\investigations\knowledge\PLANT_DIVERSITY_CANONICAL_RESOLUTION_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\PLANT_DIVERSITY_CATEGORY_COMPLETION_IMPLEMENTATION.md` → docs\investigations\knowledge\PLANT_DIVERSITY_CATEGORY_COMPLETION_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\PLANT_DIVERSITY_COUNTER_ACCURACY_FIX.md` → docs\investigations\knowledge\PLANT_DIVERSITY_COUNTER_ACCURACY_FIX.md — identical content at a different path.
- `docs\investigations\PLANT_DIVERSITY_COUNTER_INVESTIGATION.md` → docs\investigations\knowledge\PLANT_DIVERSITY_COUNTER_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\PLANT_DIVERSITY_EXPLORER_EDUCATIONAL_REPORT_REDESIGN.md` → docs\investigations\knowledge\PLANT_DIVERSITY_EXPLORER_EDUCATIONAL_REPORT_REDESIGN.md — identical content at a different path.
- `docs\investigations\PLANT_DIVERSITY_EXPLORER_IMAGERY_FALLBACK_IMPLEMENTATION.md` → docs\investigations\knowledge\PLANT_DIVERSITY_EXPLORER_IMAGERY_FALLBACK_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\PLANT_DIVERSITY_EXPLORER_IMPLEMENTATION.md` → docs\investigations\knowledge\PLANT_DIVERSITY_EXPLORER_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\PLANT_DIVERSITY_EXPLORER_REPORT_TABLE_IMPLEMENTATION.md` → docs\investigations\knowledge\PLANT_DIVERSITY_EXPLORER_REPORT_TABLE_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\PLANT_DIVERSITY_RENDER_PATH_INVESTIGATION.md` → docs\investigations\knowledge\PLANT_DIVERSITY_RENDER_PATH_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\PLANT_MILK_FALSE_POSITIVE_FIX_PATH.md` → docs\investigations\knowledge\PLANT_MILK_FALSE_POSITIVE_FIX_PATH.md — identical content at a different path.
- `docs\investigations\PLANT_MILK_FALSE_POSITIVE_IMPLEMENTATION.md` → docs\investigations\knowledge\PLANT_MILK_FALSE_POSITIVE_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\PREMIUM_RECIPE_RESTORE_1558_1559.sql` → docs\investigations\cookbook\PREMIUM_RECIPE_RESTORE_1558_1559.sql — identical content at a different path.
- `docs\investigations\PREMIUM_RECIPE_SMART_PLANNER_AUDIT.md` → docs\investigations\cookbook\PREMIUM_RECIPE_SMART_PLANNER_AUDIT.md — identical content at a different path.
- `docs\investigations\PROFILE_COMPLIANCE_CERTIFICATION_REPORT.md` → docs\investigations\planner\PROFILE_COMPLIANCE_CERTIFICATION_REPORT.md — identical content at a different path.
- `docs\investigations\PROFILE_DIETARY_PATTERN_LABEL_RENAME.md` → docs\investigations\ux\PROFILE_DIETARY_PATTERN_LABEL_RENAME.md — identical content at a different path.
- `docs\investigations\PROFILE_SAVE_400_INVALID_PROFILE_DATA_INVESTIGATION.md` → docs\investigations\ux\PROFILE_SAVE_400_INVALID_PROFILE_DATA_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\project_overview.md` → docs\investigations\engineering\project_overview.md — identical content at a different path.
- `docs\investigations\RELEASE_1_HOUSEHOLD_AWARE_NUTRITION_BOOSTS.md` → docs\investigations\platform\RELEASE_1_HOUSEHOLD_AWARE_NUTRITION_BOOSTS.md — identical content at a different path.
- `docs\investigations\RELEASE_1_NUTRITION_ENHANCEMENT_IMPLEMENTATION.md` → docs\investigations\platform\RELEASE_1_NUTRITION_ENHANCEMENT_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\RELEASE_1_VISUAL_VALIDATION.md` → docs\investigations\platform\RELEASE_1_VISUAL_VALIDATION.md — identical content at a different path.
- `docs\investigations\running-app-commit-vegan-filter-verification.md` → docs\investigations\engineering\running-app-commit-vegan-filter-verification.md — identical content at a different path.
- `docs\investigations\SIMPLY_BETTER_CHOICES_RENAME.md` → docs\investigations\ux\SIMPLY_BETTER_CHOICES_RENAME.md — identical content at a different path.
- `docs\investigations\SMART PLAN INGREDIENT VERIFICATION FAILURE INVESTIGATION.md` → docs\investigations\planner\SMART PLAN INGREDIENT VERIFICATION FAILURE INVESTIGATION.md — identical content at a different path.
- `docs\investigations\SMART_PLAN_DIETARY_TRUST_FIX.md` → docs\investigations\planner\SMART_PLAN_DIETARY_TRUST_FIX.md — identical content at a different path.
- `docs\investigations\SMART_PLANNER_BREAKFAST_CANDIDATE_RECOVERY.md` → docs\investigations\planner\SMART_PLANNER_BREAKFAST_CANDIDATE_RECOVERY.md — identical content at a different path.
- `docs\investigations\SMART_PLANNER_CANDIDATE_POOL_TRACE.md` → docs\investigations\planner\SMART_PLANNER_CANDIDATE_POOL_TRACE.md — identical content at a different path.
- `docs\investigations\SMART_PLANNER_DISCOVERY_STRATEGY_AUDIT.md` → docs\investigations\planner\SMART_PLANNER_DISCOVERY_STRATEGY_AUDIT.md — identical content at a different path.
- `docs\investigations\SMART_PLANNER_EXTERNAL_BACKFILL_FEASIBILITY.md` → docs\investigations\planner\SMART_PLANNER_EXTERNAL_BACKFILL_FEASIBILITY.md — identical content at a different path.
- `docs\investigations\SMART_PLANNER_MEAL_EXHAUSTION_AND_REPETITION_INVESTIGATION.md` → docs\investigations\planner\SMART_PLANNER_MEAL_EXHAUSTION_AND_REPETITION_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\SMART_PLANNER_POST_ENFORCEMENT_SLOT_FILL_FAILURE.md` → docs\investigations\planner\SMART_PLANNER_POST_ENFORCEMENT_SLOT_FILL_FAILURE.md — identical content at a different path.
- `docs\investigations\SMART_PLANNER_POST_RESTART_VALIDATION.md` → docs\investigations\planner\SMART_PLANNER_POST_RESTART_VALIDATION.md — identical content at a different path.
- `docs\investigations\SMART_PLANNER_RESTRICTION_ENFORCEMENT_ROOT_CAUSE.md` → docs\investigations\planner\SMART_PLANNER_RESTRICTION_ENFORCEMENT_ROOT_CAUSE.md — identical content at a different path.
- `docs\investigations\smart-meal-plan-profile-compliance-path-investigation.md` → docs\investigations\planner\smart-meal-plan-profile-compliance-path-investigation.md — identical content at a different path.
- `docs\investigations\smart-planner-advanced-overrides-summary.md` → docs\investigations\planner\smart-planner-advanced-overrides-summary.md — identical content at a different path.
- `docs\investigations\smart-planner-dietary-external-search-summary.md` → docs\investigations\planner\smart-planner-dietary-external-search-summary.md — identical content at a different path.
- `docs\investigations\smart-planner-dietary-filter-investigation.md` → docs\investigations\planner\smart-planner-dietary-filter-investigation.md — identical content at a different path.
- `docs\investigations\smart-planner-dietary-filter-summary.md` → docs\investigations\planner\smart-planner-dietary-filter-summary.md — identical content at a different path.
- `docs\investigations\smart-planner-full-ingredients-summary.md` → docs\investigations\planner\smart-planner-full-ingredients-summary.md — identical content at a different path.
- `docs\investigations\smart-planner-ingredient-investigation.md` → docs\investigations\planner\smart-planner-ingredient-investigation.md — identical content at a different path.
- `docs\investigations\smart-planner-non-meal-candidate-investigation.md` → docs\investigations\planner\smart-planner-non-meal-candidate-investigation.md — identical content at a different path.
- `docs\investigations\smart-planner-preview-card-summary.md` → docs\investigations\planner\smart-planner-preview-card-summary.md — identical content at a different path.
- `docs\investigations\smart-planner-vegan-anchovy-investigation.md` → docs\investigations\planner\smart-planner-vegan-anchovy-investigation.md — identical content at a different path.
- `docs\investigations\STARTER_SHELL_CATALOGUE_POPULATION.md` → docs\investigations\cookbook\STARTER_SHELL_CATALOGUE_POPULATION.md — identical content at a different path.
- `docs\investigations\STYLE_TAG_SYSTEM_DESIGN.md` → docs\investigations\ux\STYLE_TAG_SYSTEM_DESIGN.md — identical content at a different path.
- `docs\investigations\THA_25_SHELL_MASTER_CATALOGUE.md` → docs\investigations\cookbook\THA_25_SHELL_MASTER_CATALOGUE.md — identical content at a different path.
- `docs\investigations\THA_30_PLANTS_MODAL_V2_HEALTH_BENEFITS_AMENDMENT.md` → docs\investigations\knowledge\THA_30_PLANTS_MODAL_V2_HEALTH_BENEFITS_AMENDMENT.md — identical content at a different path.
- `docs\investigations\THA_30_PLANTS_MODAL_V2_SUPPORT_MODEL_AMENDMENT.md` → docs\investigations\knowledge\THA_30_PLANTS_MODAL_V2_SUPPORT_MODEL_AMENDMENT.md — identical content at a different path.
- `docs\investigations\THA_30_PLANTS_MODAL_V2.md` → docs\investigations\knowledge\THA_30_PLANTS_MODAL_V2.md — identical content at a different path.
- `docs\investigations\THA_30_PLANTS_PAGE_FINAL_DESIGN.md` → docs\investigations\knowledge\THA_30_PLANTS_PAGE_FINAL_DESIGN.md — identical content at a different path.
- `docs\investigations\THA_ADAPTIVE_LAYOUT_ENGINE_AUDIT.md` → docs\investigations\ux\THA_ADAPTIVE_LAYOUT_ENGINE_AUDIT.md — identical content at a different path.
- `docs\investigations\THA_COMPREHENSIVE_UI_DENSITY_AND_BREATHING_SPACE_AUDIT.md` → docs\investigations\ux\THA_COMPREHENSIVE_UI_DENSITY_AND_BREATHING_SPACE_AUDIT.md — identical content at a different path.
- `docs\investigations\THA_CONFIRMATION_DIALOG_MIGRATION.md` → docs\investigations\ux\THA_CONFIRMATION_DIALOG_MIGRATION.md — identical content at a different path.
- `docs\investigations\THA_DIALOG_FOUNDATION.md` → docs\investigations\ux\THA_DIALOG_FOUNDATION.md — identical content at a different path.
- `docs\investigations\THA_DIALOG_WIDTH_STANDARDISATION_AUDIT.md` → docs\investigations\ux\THA_DIALOG_WIDTH_STANDARDISATION_AUDIT.md — identical content at a different path.
- `docs\investigations\THA_EDUCATIONAL_DIALOG_MIGRATION.md` → docs\investigations\ux\THA_EDUCATIONAL_DIALOG_MIGRATION.md — identical content at a different path.
- `docs\investigations\THA_FOOD_INTELLIGENCE_SURFACE_AUDIT.md` → docs\investigations\intelligence\THA_FOOD_INTELLIGENCE_SURFACE_AUDIT.md — identical content at a different path.
- `docs\investigations\THA_HEALTH_BENEFITS_CONNECTED_EXPERIENCE_IMPLEMENTATION.md` → docs\investigations\knowledge\THA_HEALTH_BENEFITS_CONNECTED_EXPERIENCE_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\THIRTY_PLANTS_THIS_WEEK_COPY_REFRESH.md` → docs\investigations\knowledge\THIRTY_PLANTS_THIS_WEEK_COPY_REFRESH.md — identical content at a different path.
- `docs\investigations\VARIETY_EXPLORER_MODAL_VISUAL_CLEANUP.md` → docs\investigations\knowledge\VARIETY_EXPLORER_MODAL_VISUAL_CLEANUP.md — identical content at a different path.
- `docs\investigations\vegan-planner-cleanup-classification.md` → docs\investigations\planner\vegan-planner-cleanup-classification.md — identical content at a different path.
- `docs\investigations\VEGETARIAN_VEGAN_HOUSEHOLD_ENFORCEMENT_PATH.md` → docs\investigations\planner\VEGETARIAN_VEGAN_HOUSEHOLD_ENFORCEMENT_PATH.md — identical content at a different path.
- `docs\investigations\VEGETARIAN_VEGAN_HOUSEHOLD_HARD_ENFORCEMENT.md` → docs\investigations\planner\VEGETARIAN_VEGAN_HOUSEHOLD_HARD_ENFORCEMENT.md — identical content at a different path.
- `docs\investigations\WS_APP_01_INGREDIENT_RECOGNITION_FAILSAFE.md` → docs\investigations\knowledge\WS_APP_01_INGREDIENT_RECOGNITION_FAILSAFE.md — identical content at a different path.
- `docs\investigations\WS0_10_GLOBAL_FOOD_CATALOGUE_INGESTION.md` → docs\investigations\knowledge\WS0_10_GLOBAL_FOOD_CATALOGUE_INGESTION.md — identical content at a different path.
- `docs\investigations\WS0_11_REAL_USDA_INGESTION_PILOT.md` → docs\investigations\knowledge\WS0_11_REAL_USDA_INGESTION_PILOT.md — identical content at a different path.
- `docs\investigations\WS0_12_CATALOGUE_NORMALISATION_AND_PROMOTION_READINESS.md` → docs\investigations\knowledge\WS0_12_CATALOGUE_NORMALISATION_AND_PROMOTION_READINESS.md — identical content at a different path.
- `docs\investigations\WS0_5_KNOWLEDGE_AUTHORING_PIPELINE_VERIFICATION.md` → docs\investigations\knowledge\WS0_5_KNOWLEDGE_AUTHORING_PIPELINE_VERIFICATION.md — identical content at a different path.
- `docs\investigations\WS0_6_CLAUDE_FOOD_AUTHORING_TRIAL.md` → docs\investigations\knowledge\WS0_6_CLAUDE_FOOD_AUTHORING_TRIAL.md — identical content at a different path.
- `docs\investigations\WS0_7_VARIETY_NUTRITION_OVERRIDE_RULES.md` → docs\investigations\knowledge\WS0_7_VARIETY_NUTRITION_OVERRIDE_RULES.md — identical content at a different path.
- `docs\investigations\WS0_8_LAUNCH_FOOD_COVERAGE_EXPANSION.md` → docs\investigations\knowledge\WS0_8_LAUNCH_FOOD_COVERAGE_EXPANSION.md — identical content at a different path.
- `docs\investigations\WS0_9_GLOBAL_FOOD_CATALOGUE_ARCHITECTURE.md` → docs\investigations\knowledge\WS0_9_GLOBAL_FOOD_CATALOGUE_ARCHITECTURE.md — identical content at a different path.
- `docs\investigations\WS0X_10_PROGRESSIVE_FOOD_INTELLIGENCE_PROMOTION_MODEL.md` → docs\investigations\knowledge\WS0X_10_PROGRESSIVE_FOOD_INTELLIGENCE_PROMOTION_MODEL.md — identical content at a different path.
- `docs\investigations\WS0X_5_FOOD_CONTEXT_FOUNDATION_IMPLEMENTATION.md` → docs\investigations\knowledge\WS0X_5_FOOD_CONTEXT_FOUNDATION_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WS0X_5A_FOOD_CONTEXT_FOUNDATION_COMPLETION.md` → docs\investigations\knowledge\WS0X_5A_FOOD_CONTEXT_FOUNDATION_COMPLETION.md — identical content at a different path.
- `docs\investigations\WS0X_6B_MEAL_DETAIL_FOOD_INTELLIGENCE_PRESENTATION_REDESIGN.md` → docs\investigations\knowledge\WS0X_6B_MEAL_DETAIL_FOOD_INTELLIGENCE_PRESENTATION_REDESIGN.md — identical content at a different path.
- `docs\investigations\WS0X_6C_MEAL_DETAIL_FOOD_INTELLIGENCE_RESOLUTION_FIX.md` → docs\investigations\knowledge\WS0X_6C_MEAL_DETAIL_FOOD_INTELLIGENCE_RESOLUTION_FIX.md — identical content at a different path.
- `docs\investigations\WS0X_7_INGREDIENT_RESOLUTION_ENGINE_COMPLETENESS_PROGRAM.md` → docs\investigations\knowledge\WS0X_7_INGREDIENT_RESOLUTION_ENGINE_COMPLETENESS_PROGRAM.md — identical content at a different path.
- `docs\investigations\WS0X_8_FOOD_INTELLIGENCE_DATA_EXPANSION_PROGRAM.md` → docs\investigations\knowledge\WS0X_8_FOOD_INTELLIGENCE_DATA_EXPANSION_PROGRAM.md — identical content at a different path.
- `docs\investigations\WS0X_FOOD_INTELLIGENCE_EXPANSION_PROGRAM.md` → docs\investigations\knowledge\WS0X_FOOD_INTELLIGENCE_EXPANSION_PROGRAM.md — identical content at a different path.
- `docs\investigations\WS1_5_ALIAS_VS_VARIETY_CLASSIFICATION_SPIKE.md` → docs\investigations\knowledge\WS1_5_ALIAS_VS_VARIETY_CLASSIFICATION_SPIKE.md — identical content at a different path.
- `docs\investigations\WS1_PANTRY_EXPLORE_V2_IMPLEMENTATION.md` → docs\investigations\knowledge\WS1_PANTRY_EXPLORE_V2_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WS1_WS6_FOUNDATION_COMPLETION_AUDIT.md` → docs\investigations\knowledge\WS1_WS6_FOUNDATION_COMPLETION_AUDIT.md — identical content at a different path.
- `docs\investigations\WS10_HOUSEHOLD_FOOD_STORIES.md` → docs\investigations\knowledge\WS10_HOUSEHOLD_FOOD_STORIES.md — identical content at a different path.
- `docs\investigations\WS10_HOUSEHOLD_STORIES_ENGINE.md` → docs\investigations\knowledge\WS10_HOUSEHOLD_STORIES_ENGINE.md — identical content at a different path.
- `docs\investigations\WS11_SEASONAL_STORIES_ENGINE.md` → docs\investigations\knowledge\WS11_SEASONAL_STORIES_ENGINE.md — identical content at a different path.
- `docs\investigations\WS11_SEASONAL_STORIES.md` → docs\investigations\knowledge\WS11_SEASONAL_STORIES.md — identical content at a different path.
- `docs\investigations\WS2_PANTRY_EXPLORE_V2.md` → docs\investigations\knowledge\WS2_PANTRY_EXPLORE_V2.md — identical content at a different path.
- `docs\investigations\WS2A_CANONICAL_FOOD_FOUNDATIONS_IMPLEMENTATION.md` → docs\investigations\knowledge\WS2A_CANONICAL_FOOD_FOUNDATIONS_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WS2B_VARIETY_SURFACING_IMPLEMENTATION.md` → docs\investigations\knowledge\WS2B_VARIETY_SURFACING_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WS2F_CANONICAL_FOOD_REPORT_FOUNDATION_AMENDMENT.md` → docs\investigations\knowledge\WS2F_CANONICAL_FOOD_REPORT_FOUNDATION_AMENDMENT.md — identical content at a different path.
- `docs\investigations\WS2G_FOOD_REPORT_UI_FOUNDATION.md` → docs\investigations\knowledge\WS2G_FOOD_REPORT_UI_FOUNDATION.md — identical content at a different path.
- `docs\investigations\WS3B_QUALIFIERS_ARCHITECTURE.md` → docs\investigations\knowledge\WS3B_QUALIFIERS_ARCHITECTURE.md — identical content at a different path.
- `docs\investigations\WS5A_PREPARATION_KNOWLEDGE_ARCHITECTURE.md` → docs\investigations\knowledge\WS5A_PREPARATION_KNOWLEDGE_ARCHITECTURE.md — identical content at a different path.
- `docs\investigations\WS7_FOOD_RELATIONSHIPS_DISCOVERY_AND_STORIES.md` → docs\investigations\knowledge\WS7_FOOD_RELATIONSHIPS_DISCOVERY_AND_STORIES.md — identical content at a different path.
- `docs\investigations\WS7_RELATIONSHIP_GRAPH_POC.md` → docs\investigations\knowledge\WS7_RELATIONSHIP_GRAPH_POC.md — identical content at a different path.
- `docs\investigations\WS8_DISCOVERY_ENGINE.md` → docs\investigations\knowledge\WS8_DISCOVERY_ENGINE.md — identical content at a different path.
- `docs\investigations\WS8_FOOD_DISCOVERY_FOUNDATIONS.md` → docs\investigations\knowledge\WS8_FOOD_DISCOVERY_FOUNDATIONS.md — identical content at a different path.
- `docs\investigations\WS9_ALTERNATIVES_ENGINE.md` → docs\investigations\knowledge\WS9_ALTERNATIVES_ENGINE.md — identical content at a different path.
- `docs\investigations\WS9_GOAL_DRIVEN_ALTERNATIVES.md` → docs\investigations\knowledge\WS9_GOAL_DRIVEN_ALTERNATIVES.md — identical content at a different path.
- `docs\investigations\WX10_AUTHENTICATED_BRAND_SHELL_REFINEMENT.md` → docs\investigations\ux\WX10_AUTHENTICATED_BRAND_SHELL_REFINEMENT.md — identical content at a different path.
- `docs\investigations\WX10_UNIFIED_WORKSPACE_HEADER_IMPLEMENTATION.md` → docs\investigations\ux\WX10_UNIFIED_WORKSPACE_HEADER_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WX10B_WORKSPACE_CANVAS_CONSISTENCY_IMPLEMENTATION.md` → docs\investigations\ux\WX10B_WORKSPACE_CANVAS_CONSISTENCY_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WX10C_HOTFIX_RESIZEADDTEXTAREA_INITIALISATION.md` → docs\investigations\ux\WX10C_HOTFIX_RESIZEADDTEXTAREA_INITIALISATION.md — identical content at a different path.
- `docs\investigations\WX10C_SHOPPING_WORKSPACE_CANONICAL_OWNERSHIP.md` → docs\investigations\ux\WX10C_SHOPPING_WORKSPACE_CANONICAL_OWNERSHIP.md — identical content at a different path.
- `docs\investigations\WX10E_MOBILE_NAVIGATION_AND_SHOPPING_WORKSPACE_REFINEMENT_IMPLEMENTATION.md` → docs\investigations\ux\WX10E_MOBILE_NAVIGATION_AND_SHOPPING_WORKSPACE_REFINEMENT_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WX10E_REV1_DESKTOP_MOBILE_NAVIGATION_AND_WORKSPACE_STANDARDISATION.md` → docs\investigations\ux\WX10E_REV1_DESKTOP_MOBILE_NAVIGATION_AND_WORKSPACE_STANDARDISATION.md — identical content at a different path.
- `docs\investigations\WX10F_HEADER_SIDEBAR_LAYOUT_CORRECTION.md` → docs\investigations\ux\WX10F_HEADER_SIDEBAR_LAYOUT_CORRECTION.md — identical content at a different path.
- `docs\investigations\WX12_PLATFORM_BANNER_LOGO_ALIGNMENT_FIX.md` → docs\investigations\ux\WX12_PLATFORM_BANNER_LOGO_ALIGNMENT_FIX.md — identical content at a different path.
- `docs\investigations\WX12A_PROFILE_PAGE_REGRESSION_FIX_IMPLEMENTATION.md` → docs\investigations\ux\WX12A_PROFILE_PAGE_REGRESSION_FIX_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WX12A_PROFILE_PAGE_REGRESSION_FIX.md` → docs\investigations\ux\WX12A_PROFILE_PAGE_REGRESSION_FIX.md — identical content at a different path.
- `docs\investigations\WX12B_REV1_TANSTACK_QUERY_V5_LOADING_GUARD_IMPLEMENTATION.md` → docs\investigations\ux\WX12B_REV1_TANSTACK_QUERY_V5_LOADING_GUARD_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WX12B_TANSTACK_QUERY_V5_LOADING_GUARD_AUDIT.md` → docs\investigations\ux\WX12B_TANSTACK_QUERY_V5_LOADING_GUARD_AUDIT.md — identical content at a different path.
- `docs\investigations\WX13_PLANNER_INTELLIGENCE_STRIP_IMPLEMENTATION.md` → docs\investigations\ux\WX13_PLANNER_INTELLIGENCE_STRIP_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WX14_PLATFORM_NAVIGATION_OWNERSHIP_AND_GLOBAL_HEADER_IMPLEMENTATION.md` → docs\investigations\ux\WX14_PLATFORM_NAVIGATION_OWNERSHIP_AND_GLOBAL_HEADER_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WX14_SHOPPING_WORKSPACE_VISUAL_POLISH.md` → docs\investigations\ux\WX14_SHOPPING_WORKSPACE_VISUAL_POLISH.md — identical content at a different path.
- `docs\investigations\WX15_PLATFORM_REGRESSION_FIXES.md` → docs\investigations\ux\WX15_PLATFORM_REGRESSION_FIXES.md — identical content at a different path.
- `docs\investigations\WX15B_PLATFORM_REGRESSION_CORRECTIONS.md` → docs\investigations\ux\WX15B_PLATFORM_REGRESSION_CORRECTIONS.md — identical content at a different path.
- `docs\investigations\WX1A_COOKBOOK_MEAL_INTELLIGENCE_SURFACE.md` → docs\investigations\cookbook\WX1A_COOKBOOK_MEAL_INTELLIGENCE_SURFACE.md — identical content at a different path.
- `docs\investigations\WX2_HOME_INTELLIGENCE_COMPANION_IMPLEMENTATION.md` → docs\investigations\ux\WX2_HOME_INTELLIGENCE_COMPANION_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WX4_FOOD_INTELLIGENCE_PAGES_IMPLEMENTATION.md` → docs\investigations\ux\WX4_FOOD_INTELLIGENCE_PAGES_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WX5_CONNECTED_FOOD_INTELLIGENCE_IMPLEMENTATION.md` → docs\investigations\ux\WX5_CONNECTED_FOOD_INTELLIGENCE_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WX8_HOUSEHOLD_NUTRITION_CENTRE_IMPLEMENTATION.md` → docs\investigations\ux\WX8_HOUSEHOLD_NUTRITION_CENTRE_IMPLEMENTATION.md — identical content at a different path.
- `docs\investigations\WX9_2_EXPERIENCE_INTEGRATION_AND_STORYTELLING.md` → docs\investigations\ux\WX9_2_EXPERIENCE_INTEGRATION_AND_STORYTELLING.md — identical content at a different path.
- `docs\investigations\WX9_3_ABOVE_THE_FOLD_OPTIMISATION.md` → docs\investigations\ux\WX9_3_ABOVE_THE_FOLD_OPTIMISATION.md — identical content at a different path.
- `docs\investigations\WX9_4_UNIFIED_WORKSPACE_HEADER_ARCHITECTURE_INVESTIGATION.md` → docs\investigations\ux\WX9_4_UNIFIED_WORKSPACE_HEADER_ARCHITECTURE_INVESTIGATION.md — identical content at a different path.
- `docs\investigations\WX9_EXPERIENCE_INTEGRATION_AND_LAUNCH_READINESS.md` → docs\investigations\ux\WX9_EXPERIENCE_INTEGRATION_AND_LAUNCH_READINESS.md — identical content at a different path.
- `docs\investigations\WX9.6_ADAPTIVE_WORKSPACE_ARCHITECTURE.md` → docs\investigations\ux\WX9.6_ADAPTIVE_WORKSPACE_ARCHITECTURE.md — identical content at a different path.
- `docs\investigations\WX9.7_WORKFLOW_FIRST_WORKSPACE_DENSITY_AND_UX_OPTIMISATION.md` → docs\investigations\ux\WX9.7_WORKFLOW_FIRST_WORKSPACE_DENSITY_AND_UX_OPTIMISATION.md — identical content at a different path.

### Same-path files with changed content

Each listed file exists at the same relative path but has a different hash. Where the old hash is still in active under another path, the location is shown.

- `.gitignore` — 121 → 793 bytes (+672); contents differ. Old hash not found elsewhere in active.
- `.replit` — 1072 → 2536 bytes (+1464); contents differ. Old hash not found elsewhere in active.
- `MIGRATIONS.md` — 10497 → 14317 bytes (+3820); contents differ. Old hash not found elsewhere in active.
- `package-lock.json` — 399386 → 437879 bytes (+38493); contents differ. Old hash not found elsewhere in active.
- `package.json` — 6948 → 31020 bytes (+24072); contents differ. Old hash not found elsewhere in active.
- `RELEASE.md` — 12181 → 26931 bytes (+14750); contents differ. Old hash not found elsewhere in active.
- `tailwind.config.ts` — 4221 → 5397 bytes (+1176); contents differ. Old hash not found elsewhere in active.
- `tsconfig.json` — 680 → 705 bytes (+25); contents differ. Old hash not found elsewhere in active.
- `vite.config.ts` — 1120 → 2242 bytes (+1122); contents differ. Old hash not found elsewhere in active.
- `.claude\settings.local.json` — 719 → 314 bytes (-405); contents differ. Old hash not found elsewhere in active.
- `client\index.html` — 1928 → 3620 bytes (+1692); contents differ. Old hash not found elsewhere in active.
- `client\public\apple-logo.png` — 233997 → 21466 bytes (-212531); contents differ. Old version also exists at: archive\assets\_new_single_apple_1772726624473.png.
- `client\public\favicon.png` — 295207 → 9263 bytes (-285944); contents differ. Old hash not found elsewhere in active.
- `client\public\logo-long.png` — 505688 → 42398 bytes (-463290); contents differ. Old version also exists at: archive\assets\thehealthy_apples_transparent_logo_cropped_1773790275780.png.
- `client\src\App.tsx` — 11024 → 23487 bytes (+12463); contents differ. Old hash not found elsewhere in active.
- `client\src\index.css` — 16479 → 103461 bytes (+86982); contents differ. Old hash not found elsewhere in active.
- `client\src\assets\icons\tha-apple.png` — 1449727 → 22095 bytes (-1427632); contents differ. Old version also exists at: archive\assets\master_apple_logo_1772744482850.png, attached_assets\new_single_apple_transparent_1772836544576.png.
- `client\src\components\AdaptationReviewSheet.tsx` — 27490 → 27821 bytes (+331); contents differ. Old hash not found elsewhere in active.
- `client\src\components\AddToWeekModal.tsx` — 18617 → 18718 bytes (+101); contents differ. Old hash not found elsewhere in active.
- `client\src\components\AppleRating.tsx` — 4348 → 6795 bytes (+2447); contents differ. Old hash not found elsewhere in active.
- `client\src\components\BarcodeScanner.tsx` — 12844 → 12899 bytes (+55); contents differ. Old hash not found elsewhere in active.
- `client\src\components\camera-modal.tsx` — 10129 → 10232 bytes (+103); contents differ. Old hash not found elsewhere in active.
- `client\src\components\CookbookMealIntelligenceStrip.tsx` — 7619 → 6943 bytes (-676); contents differ. Old hash not found elsewhere in active.
- `client\src\components\CookbookWorkspacePanel.tsx` — 21002 → 20317 bytes (-685); contents differ. Old hash not found elsewhere in active.
- `client\src\components\create-meal-modal.tsx` — 19953 → 20772 bytes (+819); contents differ. Old hash not found elsewhere in active.
- `client\src\components\day-view-drawer.tsx` — 19338 → 20206 bytes (+868); contents differ. Old hash not found elsewhere in active.
- `client\src\components\food-knowledge-modal.tsx` — 2406 → 2826 bytes (+420); contents differ. Old hash not found elsewhere in active.
- `client\src\components\FoodReport.tsx` — 9049 → 9655 bytes (+606); contents differ. Old hash not found elsewhere in active.
- `client\src\components\HouseholdNutritionCentre.tsx` — 14317 → 22832 bytes (+8515); contents differ. Old hash not found elsewhere in active.
- `client\src\components\import-diary-modal.tsx` — 22380 → 22491 bytes (+111); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ingredient-input.tsx` — 4851 → 4898 bytes (+47); contents differ. Old hash not found elsewhere in active.
- `client\src\components\KitchenToBasketVisual.tsx` — 5605 → 4891 bytes (-714); contents differ. Old hash not found elsewhere in active.
- `client\src\components\meal-completion-dialog.tsx` — 19814 → 20444 bytes (+630); contents differ. Old hash not found elsewhere in active.
- `client\src\components\MealImageWidget.tsx` — 20312 → 22364 bytes (+2052); contents differ. Old hash not found elsewhere in active.
- `client\src\components\MealPreviewBubble.tsx` — 9481 → 9712 bytes (+231); contents differ. Old hash not found elsewhere in active.
- `client\src\components\MealUpliftPanel.tsx` — 24837 → 24074 bytes (-763); contents differ. Old hash not found elsewhere in active.
- `client\src\components\nav-bar.tsx` — 33811 → 36758 bytes (+2947); contents differ. Old hash not found elsewhere in active.
- `client\src\components\nutrition-insights-panel.tsx` — 4523 → 5355 bytes (+832); contents differ. Old hash not found elsewhere in active.
- `client\src\components\nutrition-variety-chips.tsx` — 14909 → 15134 bytes (+225); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PantryIntelligencePanel.tsx` — 10251 → 9375 bytes (-876); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PantryKnowledgeHub.tsx` — 47068 → 49102 bytes (+2034); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerAnalyserContent.tsx` — 9830 → 10862 bytes (+1032); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerAssistantPanel.tsx` — 89743 → 93068 bytes (+3325); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerBulkAssignPanel.tsx` — 14070 → 14130 bytes (+60); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerIntelligenceStrip.tsx` — 10991 → 10532 bytes (-459); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerMealCard.tsx` — 9081 → 9499 bytes (+418); contents differ. Old version also exists at: .engineering\session\rollback-evidence\planner-followup-20261026\PlannerMealCard.tsx.before-topline-meal-photos-20261026T213735.
- `client\src\components\PlannerMealPickerPanel.tsx` — 33525 → 39353 bytes (+5828); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerScanReview.tsx` — 61676 → 61756 bytes (+80); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlantDiversityReport.tsx` — 45200 → 46268 bytes (+1068); contents differ. Old hash not found elsewhere in active.
- `client\src\components\product-picker-sheet.tsx` — 14642 → 14947 bytes (+305); contents differ. Old hash not found elsewhere in active.
- `client\src\components\RecipeScanReview.tsx` — 23626 → 23729 bytes (+103); contents differ. Old hash not found elsewhere in active.
- `client\src\components\share-plan-dialog.tsx` — 12870 → 14342 bytes (+1472); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ShoppingIntelligencePanel.tsx` — 7296 → 7044 bytes (-252); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ShoppingListScanReview.tsx` — 13505 → 13523 bytes (+18); contents differ. Old hash not found elsewhere in active.
- `client\src\components\SiteBanner.tsx` — 614 → 1203 bytes (+589); contents differ. Old hash not found elsewhere in active.
- `client\src\components\SmartReviewPanelContent.tsx` — 27609 → 27339 bytes (-270); contents differ. Old hash not found elsewhere in active.
- `client\src\components\templates-panel.tsx` — 35878 → 37845 bytes (+1967); contents differ. Old hash not found elsewhere in active.
- `client\src\components\TrialBanner.tsx` — 5734 → 8145 bytes (+2411); contents differ. Old hash not found elsewhere in active.
- `client\src\components\upf-info-modal.tsx` — 4499 → 4496 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `client\src\components\workspace-header.tsx` — 18852 → 16118 bytes (-2734); contents differ. Old hash not found elsewhere in active.
- `client\src\components\WorkspaceAnalyserSheet.tsx` — 60627 → 62353 bytes (+1726); contents differ. Old hash not found elsewhere in active.
- `client\src\components\analyser\AnalyserDetailV2.tsx` — 32545 → 34665 bytes (+2120); contents differ. Old hash not found elsewhere in active.
- `client\src\components\analyser\WholeFoodAnalysisCard.tsx` — 5560 → 6001 bytes (+441); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\ConnectedFoodPanel.tsx` — 5161 → 6372 bytes (+1211); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\index.ts` — 1464 → 2276 bytes (+812); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\intelligence-tokens.ts` — 4822 → 9258 bytes (+4436); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\IntelligenceCard.tsx` — 4941 → 5249 bytes (+308); contents differ. Old hash not found elsewhere in active.
- `client\src\components\layout\orchard-backdrop.tsx` — 512 → 8438 bytes (+7926); contents differ. Old hash not found elsewhere in active.
- `client\src\components\meal-detail\HouseholdAdaptationsSummary.tsx` — 7226 → 7061 bytes (-165); contents differ. Old hash not found elsewhere in active.
- `client\src\components\meal-detail\MealFamilyConfidence.tsx` — 6563 → 6390 bytes (-173); contents differ. Old hash not found elsewhere in active.
- `client\src\components\meal-detail\MealTrustSummary.tsx` — 3381 → 3265 bytes (-116); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\button.tsx` — 2421 → 3456 bytes (+1035); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\card.tsx` — 2006 → 3686 bytes (+1680); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\checkbox.tsx` — 1084 → 1264 bytes (+180); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\dialog-foundation.ts` — 7039 → 7651 bytes (+612); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\dialog.tsx` — 4166 → 5623 bytes (+1457); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\input.tsx` — 867 → 966 bytes (+99); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\sheet.tsx` — 4421 → 4526 bytes (+105); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\switch.tsx` — 1166 → 1348 bytes (+182); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\tabs.tsx` — 1936 → 2545 bytes (+609); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\textarea.tsx` — 711 → 811 bytes (+100); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\toast.tsx` — 5178 → 5902 bytes (+724); contents differ. Old hash not found elsewhere in active.
- `client\src\components\ui\toaster.tsx` — 1353 → 1722 bytes (+369); contents differ. Old hash not found elsewhere in active.
- `client\src\contexts\PlannerContext.tsx` — 4867 → 5113 bytes (+246); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-adaptive-density.tsx` — 4322 → 6518 bytes (+2196); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-basket.ts` — 2846 → 4807 bytes (+1961); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-meals-summary.ts` — 527 → 824 bytes (+297); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-meals.ts` — 2033 → 3588 bytes (+1555); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-planner-meal-search.ts` — 7793 → 8398 bytes (+605); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-planner-operations.ts` — 19423 → 20951 bytes (+1528); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-smart-suggest.ts` — 13828 → 16178 bytes (+2350); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-sound-effects.ts` — 2253 → 2630 bytes (+377); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-toast.ts` — 4082 → 4968 bytes (+886); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-user.ts` — 4002 → 5580 bytes (+1578); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-week-meal-entries.ts` — 2700 → 4326 bytes (+1626); contents differ. Old hash not found elsewhere in active.
- `client\src\lib\analyser-view-model.ts` — 15146 → 14938 bytes (-208); contents differ. Old hash not found elsewhere in active.
- `client\src\lib\diets.ts` — 8176 → 10258 bytes (+2082); contents differ. Old hash not found elsewhere in active.
- `client\src\lib\ingredient-imagery.ts` — 10794 → 9800 bytes (-994); contents differ. Old hash not found elsewhere in active.
- `client\src\lib\ingredient-reuse.ts` — 3886 → 4435 bytes (+549); contents differ. Old hash not found elsewhere in active.
- `client\src\lib\planner-types.ts` — 1829 → 2436 bytes (+607); contents differ. Old hash not found elsewhere in active.
- `client\src\lib\quick-list.ts` — 1384 → 1606 bytes (+222); contents differ. Old hash not found elsewhere in active.
- `client\src\lib\unit-display.ts` — 5654 → 10243 bytes (+4589); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-ingredient-products-page.tsx` — 20819 → 21138 bytes (+319); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-recipe-sources-page.tsx` — 14236 → 14212 bytes (-24); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-users-page.tsx` — 23600 → 23672 bytes (+72); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\auth-page.tsx` — 34160 → 39130 bytes (+4970); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\dashboard.tsx` — 41203 → 47495 bytes (+6292); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\food-detail-page.tsx` — 11538 → 21187 bytes (+9649); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\food-diary-page.tsx` — 86761 → 94303 bytes (+7542); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\home-page.tsx` — 10616 → 11754 bytes (+1138); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\meal-detail-page.tsx` — 64249 → 66123 bytes (+1874); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\meals-page.tsx` — 337779 → 348624 bytes (+10845); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\not-found.tsx` — 737 → 2893 bytes (+2156); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\onboarding-page.tsx` — 37600 → 41980 bytes (+4380); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\partners-page.tsx` — 25819 → 25819 bytes (same size); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\plant-diversity-page.tsx` — 11160 → 23981 bytes (+12821); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\products-page.tsx` — 110768 → 123467 bytes (+12699); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\profile-page.tsx` — 83409 → 110411 bytes (+27002); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\quick-meal-page.tsx` — 35431 → 36672 bytes (+1241); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\shared-plan-page.tsx` — 8995 → 9044 bytes (+49); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\shopping-workspace-page.tsx` — 134570 → 156246 bytes (+21676); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\supermarkets-page.tsx` — 9797 → 10245 bytes (+448); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\weekly-planner-page.tsx` — 227741 → 244910 bytes (+17169); contents differ. Old hash not found elsewhere in active.
- `data\alternatives\ws9-alternatives-report.json` — 47108 → 47108 bytes (same size); contents differ. Old hash not found elsewhere in active.
- `data\discovery\ws8-discovery-report.json` — 33096 → 33096 bytes (same size); contents differ. Old hash not found elsewhere in active.
- `data\seasonal\ws11-seasonal-stories-report.json` — 43923 → 43924 bytes (+1); contents differ. Old hash not found elsewhere in active.
- `data\stories\ws10-stories-report.json` — 21259 → 21259 bytes (same size); contents differ. Old hash not found elsewhere in active.
- `docs\ARCHITECTURE_PRINCIPLES.md` — 13416 → 393 bytes (-13023); contents differ. Old hash not found elsewhere in active.
- `docs\ENGINEERING_WORKFLOW.md` — 14827 → 380 bytes (-14447); contents differ. Old hash not found elsewhere in active.
- `migrations\0001_m4_5_fermented_attribute.sql` — 349 → 359 bytes (+10); contents differ. Old hash not found elsewhere in active.
- `scripts\apply-canonical-tables.ts` — 2915 → 3227 bytes (+312); contents differ. Old hash not found elsewhere in active.
- `scripts\post-merge.sh` — 51 → 1126 bytes (+1075); contents differ. Old hash not found elsewhere in active.
- `scripts\verify-prod.ts` — 12548 → 27486 bytes (+14938); contents differ. Old hash not found elsewhere in active.
- `seed\family-plan.json` — 7565 → 11294 bytes (+3729); contents differ. Old hash not found elsewhere in active.
- `server\auth.ts` — 15831 → 31521 bytes (+15690); contents differ. Old hash not found elsewhere in active.
- `server\db.ts` — 409 → 3223 bytes (+2814); contents differ. Old hash not found elsewhere in active.
- `server\index.ts` — 6943 → 9600 bytes (+2657); contents differ. Old hash not found elsewhere in active.
- `server\routes.ts` — 521299 → 695822 bytes (+174523); contents differ. Old hash not found elsewhere in active.
- `server\storage.ts` — 173143 → 216810 bytes (+43667); contents differ. Old hash not found elsewhere in active.
- `server\lib\access.ts` — 1308 → 5749 bytes (+4441); contents differ. Old hash not found elsewhere in active.
- `server\lib\auto-import-service.ts` — 3652 → 5104 bytes (+1452); contents differ. Old hash not found elsewhere in active.
- `server\lib\connected-food-intelligence-assembler.ts` — 15956 → 15874 bytes (-82); contents differ. Old hash not found elsewhere in active.
- `server\lib\explainability-service.ts` — 4087 → 17453 bytes (+13366); contents differ. Old hash not found elsewhere in active.
- `server\lib\external-meal-service.ts` — 31945 → 36861 bytes (+4916); contents differ. Old hash not found elsewhere in active.
- `server\lib\food-intelligence-assembler.ts` — 16931 → 26436 bytes (+9505); contents differ. Old hash not found elsewhere in active.
- `server\lib\household-meal-matcher.ts` — 19592 → 18552 bytes (-1040); contents differ. Old hash not found elsewhere in active.
- `server\lib\meal-intelligence-assembler.ts` — 16572 → 17542 bytes (+970); contents differ. Old hash not found elsewhere in active.
- `server\lib\meal-service.ts` — 4612 → 11693 bytes (+7081); contents differ. Old hash not found elsewhere in active.
- `server\lib\media-storage.ts` — 3281 → 18351 bytes (+15070); contents differ. Old hash not found elsewhere in active.
- `server\lib\nutrition-centre-assembler.ts` — 11953 → 15742 bytes (+3789); contents differ. Old hash not found elsewhere in active.
- `server\lib\openfoodfacts-importer.ts` — 11970 → 12032 bytes (+62); contents differ. Old hash not found elsewhere in active.
- `server\lib\planner-compliance.ts` — 7085 → 8735 bytes (+1650); contents differ. Old hash not found elsewhere in active.
- `server\lib\product-event-logger.ts` — 6459 → 6586 bytes (+127); contents differ. Old hash not found elsewhere in active.
- `server\lib\recipe-source-gate.ts` — 7234 → 8971 bytes (+1737); contents differ. Old hash not found elsewhere in active.
- `server\lib\recipe-swap-engine.ts` — 11915 → 14787 bytes (+2872); contents differ. Old hash not found elsewhere in active.
- `server\lib\routing.ts` — 3869 → 3802 bytes (-67); contents differ. Old hash not found elsewhere in active.
- `server\lib\sanitizeUser.ts` — 809 → 5408 bytes (+4599); contents differ. Old hash not found elsewhere in active.
- `server\lib\seed-food-knowledge.ts` — 12810 → 13024 bytes (+214); contents differ. Old hash not found elsewhere in active.
- `server\lib\seed-ready-meals.ts` — 2406 → 3171 bytes (+765); contents differ. Old hash not found elsewhere in active.
- `server\lib\smart-suggest-service.ts` — 45570 → 47838 bytes (+2268); contents differ. Old hash not found elsewhere in active.
- `server\lib\uplift-persistence.ts` — 7869 → 10595 bytes (+2726); contents differ. Old hash not found elsewhere in active.
- `server\lib\uplift-rules.ts` — 41850 → 45790 bytes (+3940); contents differ. Old hash not found elsewhere in active.
- `server\lib\usda-whole-food-service.ts` — 3179 → 14156 bytes (+10977); contents differ. Old hash not found elsewhere in active.
- `server\migrations\runner.ts` — 68250 → 195838 bytes (+127588); contents differ. Old hash not found elsewhere in active.
- `server\scripts\query-investigation.ts` — 3374 → 3313 bytes (-61); contents differ. Old hash not found elsewhere in active.
- `server\scripts\sim-slot-fill.ts` — 14013 → 13373 bytes (-640); contents differ. Old hash not found elsewhere in active.
- `server\seeds\seed-canonical-food.ts` — 6328 → 15847 bytes (+9519); contents differ. Old hash not found elsewhere in active.
- `server\seeds\seed-knowledge-registry.ts` — 5806 → 21298 bytes (+15492); contents differ. Old hash not found elsewhere in active.
- `server\services\meal-food-intelligence.ts` — 9101 → 9973 bytes (+872); contents differ. Old hash not found elsewhere in active.
- `server\services\nutrition-knowledge-registry.ts` — 30405 → 56959 bytes (+26554); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-diet-reconciliation-bridge.ts` — 10239 → 11451 bytes (+1212); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-food-report-adapter.ts` — 14866 → 15840 bytes (+974); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-guest-eater.ts` — 7341 → 7344 bytes (+3); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-household-eater.ts` — 6187 → 6234 bytes (+47); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-household-vegan-vegetarian-hard-enforcement.ts` — 22154 → 23611 bytes (+1457); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-ingredient-verification.ts` — 11239 → 11727 bytes (+488); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-keto-low-carb-dictionary.ts` — 16957 → 18217 bytes (+1260); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-knowledge-registry.ts` — 4331 → 6108 bytes (+1777); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-planner-compliance-gate.ts` — 7458 → 7489 bytes (+31); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-profile-dietary-title-safety.ts` — 11074 → 11525 bytes (+451); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-restriction-resolver.ts` — 46578 → 46757 bytes (+179); contents differ. Old hash not found elsewhere in active.
- `shared\dietRules.ts` — 16823 → 31885 bytes (+15062); contents differ. Old hash not found elsewhere in active.
- `shared\household-eater.ts` — 5774 → 6362 bytes (+588); contents differ. Old hash not found elsewhere in active.
- `shared\ingredient-aliases.ts` — 19947 → 20728 bytes (+781); contents differ. Old hash not found elsewhere in active.
- `shared\meal-adaptation.ts` — 4183 → 4625 bytes (+442); contents differ. Old hash not found elsewhere in active.
- `shared\normalize.ts` — 1898 → 1919 bytes (+21); contents differ. Old hash not found elsewhere in active.
- `shared\parse-ingredient.ts` — 2681 → 3479 bytes (+798); contents differ. Old hash not found elsewhere in active.
- `shared\schema.ts` — 81615 → 193143 bytes (+111528); contents differ. Old hash not found elsewhere in active.
- `shared\alternatives\index.ts` — 784 → 794 bytes (+10); contents differ. Old hash not found elsewhere in active.
- `shared\alternatives\types.ts` — 6078 → 6088 bytes (+10); contents differ. Old hash not found elsewhere in active.
- `shared\canonical\food-context.ts` — 26285 → 31695 bytes (+5410); contents differ. Old hash not found elsewhere in active.
- `shared\canonical\food-report-adapter.ts` — 8199 → 11889 bytes (+3690); contents differ. Old hash not found elsewhere in active.
- `shared\canonical\foods.ts` — 145830 → 192449 bytes (+46619); contents differ. Old hash not found elsewhere in active.
- `shared\canonical\index.ts` — 10608 → 14046 bytes (+3438); contents differ. Old hash not found elsewhere in active.
- `shared\canonical\plant-classifier.ts` — 13950 → 16698 bytes (+2748); contents differ. Old hash not found elsewhere in active.
- `shared\canonical\resolver.ts` — 6204 → 11041 bytes (+4837); contents differ. Old hash not found elsewhere in active.
- `shared\catalogue\alias-resolver.ts` — 5439 → 5616 bytes (+177); contents differ. Old hash not found elsewhere in active.
- `shared\catalogue\name-normaliser.ts` — 9931 → 11489 bytes (+1558); contents differ. Old hash not found elsewhere in active.
- `shared\discovery\cuisine-map.ts` — 5666 → 5676 bytes (+10); contents differ. Old hash not found elsewhere in active.
- `shared\discovery\index.ts` — 689 → 699 bytes (+10); contents differ. Old hash not found elsewhere in active.
- `shared\discovery\seasonal-map.ts` — 3203 → 3584 bytes (+381); contents differ. Old hash not found elsewhere in active.
- `shared\discovery\types.ts` — 3805 → 4058 bytes (+253); contents differ. Old hash not found elsewhere in active.
- `shared\knowledge\foods.ts` — 131365 → 135005 bytes (+3640); contents differ. Old hash not found elsewhere in active.
- `shared\knowledge\index.ts` — 4739 → 10147 bytes (+5408); contents differ. Old hash not found elsewhere in active.
- `shared\knowledge\nutrients.ts` — 6170 → 9427 bytes (+3257); contents differ. Old hash not found elsewhere in active.
- `shared\knowledge\relationships.ts` — 40421 → 40923 bytes (+502); contents differ. Old hash not found elsewhere in active.
- `shared\restrictions\restriction-library.ts` — 15948 → 37225 bytes (+21277); contents differ. Old hash not found elsewhere in active.
- `shared\restrictions\restriction-resolver.ts` — 15384 → 23956 bytes (+8572); contents differ. Old hash not found elsewhere in active.
- `shared\seasonal\engine.ts` — 16499 → 17481 bytes (+982); contents differ. Old hash not found elsewhere in active.
- `shared\seasonal\index.ts` — 694 → 704 bytes (+10); contents differ. Old hash not found elsewhere in active.
- `shared\seasonal\types.ts` — 5508 → 5518 bytes (+10); contents differ. Old hash not found elsewhere in active.
- `shared\stories\engine.ts` — 27100 → 29121 bytes (+2021); contents differ. Old hash not found elsewhere in active.
- `shared\stories\index.ts` — 684 → 694 bytes (+10); contents differ. Old hash not found elsewhere in active.
- `shared\stories\types.ts` — 7040 → 9787 bytes (+2747); contents differ. Old hash not found elsewhere in active.

### Active-only paths

Counts are in the summary. These are paths absent by the same relative path in the old folder; the same content may be present there at another path.

## tha-integrated-dev

**Reading:** three cookbook briefs moved into the active `docs\investigations\cookbook\`; only `docs\product\structure\pages\page-landing.md` is unique by content. Same-path changes span client/server, governance, dependencies, tests, scripts and docs.

### Genuinely unique old files

- `docs\product\structure\pages\page-landing.md` (1519 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.

### Relocated files (same hash found at active path)

- `CODEX_COOKBOOK_FUNCTIONAL_TASK.md` → docs\investigations\cookbook\CODEX_COOKBOOK_FUNCTIONAL_TASK.md — identical content at a different path.
- `COOKBOOK_COLLABORATION_CONTRACT.md` → docs\investigations\cookbook\COOKBOOK_COLLABORATION_CONTRACT.md — identical content at a different path.
- `OVERNIGHT_COOKBOOK_ORCHESTRATION.md` → docs\investigations\cookbook\OVERNIGHT_COOKBOOK_ORCHESTRATION.md — identical content at a different path.

### Same-path files with changed content

Each listed file exists at the same relative path but has a different hash. Where the old hash is still in active under another path, the location is shown.

- `.env` — 468 → 700 bytes (+232); contents differ. Old hash not found elsewhere in active.
- `AGENTS.md` — 1531 → 5295 bytes (+3764); contents differ. Old hash not found elsewhere in active.
- `package-lock.json` — 417996 → 437879 bytes (+19883); contents differ. Old hash not found elsewhere in active.
- `package.json` — 30326 → 31020 bytes (+694); contents differ. Old hash not found elsewhere in active.
- `PROJECT_GOVERNANCE.md` — 95710 → 127796 bytes (+32086); contents differ. Old hash not found elsewhere in active.
- `vite.frontend-only.config.ts` — 423 → 792 bytes (+369); contents differ. Old hash not found elsewhere in active.
- `.claude\scheduled_tasks.lock` — 124 → 124 bytes (same size); contents differ. Old hash not found elsewhere in active.
- `.engineering\scripts\repo-structure-verify.sh` — 6372 → 6934 bytes (+562); contents differ. Old version also exists at: .engineering\scripts\repo-structure-verify.sh.pre-root-allowlist-fix-20261109T182823Z.bak.
- `.engineering\scripts\rollback-verify.sh` — 6972 → 7729 bytes (+757); contents differ. Old version also exists at: .engineering\scripts\rollback-verify.sh.pre-python3-fix-20261109T182335Z.bak.
- `.engineering\session\CURRENT.md` — 475557 → 485027 bytes (+9470); contents differ. Old hash not found elsewhere in active.
- `client\src\App.tsx` — 28474 → 23487 bytes (-4987); contents differ. Old hash not found elsewhere in active.
- `client\src\index.css` — 112583 → 103461 bytes (-9122); contents differ. Old hash not found elsewhere in active.
- `client\src\components\admin-banner.tsx` — 3901 → 3997 bytes (+96); contents differ. Old hash not found elsewhere in active.
- `client\src\components\FoodReport.tsx` — 8529 → 9655 bytes (+1126); contents differ. Old hash not found elsewhere in active.
- `client\src\components\HouseholdNutritionCentre.tsx` — 15585 → 22832 bytes (+7247); contents differ. Old hash not found elsewhere in active.
- `client\src\components\MealPreviewBubble.tsx` — 9481 → 9712 bytes (+231); contents differ. Old hash not found elsewhere in active.
- `client\src\components\nav-bar.tsx` — 36611 → 36758 bytes (+147); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PantryKnowledgeHub.tsx` — 49067 → 49102 bytes (+35); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerAssistantPanel.tsx` — 89650 → 93068 bytes (+3418); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerMealCard.tsx` — 9081 → 9499 bytes (+418); contents differ. Old version also exists at: .engineering\session\rollback-evidence\planner-followup-20261026\PlannerMealCard.tsx.before-topline-meal-photos-20261026T213735.
- `client\src\components\PlannerMealPickerPanel.tsx` — 37887 → 39353 bytes (+1466); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerScanReview.tsx` — 61748 → 61756 bytes (+8); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\client__src__components__PlannerScanReview.tsx.
- `client\src\components\PlantDiversityReport.tsx` — 45701 → 46268 bytes (+567); contents differ. Old hash not found elsewhere in active.
- `client\src\components\SmartReviewPanelContent.tsx` — 29113 → 27339 bytes (-1774); contents differ. Old hash not found elsewhere in active.
- `client\src\components\workspace-header.tsx` — 15432 → 16118 bytes (+686); contents differ. Old hash not found elsewhere in active.
- `client\src\components\analyser\AnalyserDetailV2.tsx` — 32213 → 34665 bytes (+2452); contents differ. Old hash not found elsewhere in active.
- `client\src\components\analyser\WholeFoodAnalysisCard.tsx` — 5598 → 6001 bytes (+403); contents differ. Old hash not found elsewhere in active.
- `client\src\components\conversation\companion-card.ts` — 13897 → 13905 bytes (+8); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\client__src__components__conversation__companion-card.ts.
- `client\src\components\conversation\FloatingAssistant.tsx` — 85732 → 98751 bytes (+13019); contents differ. Old hash not found elsewhere in active.
- `client\src\components\cookbook-real-book\real-book.css` — 26297 → 28341 bytes (+2044); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\ConnectedFoodPanel.tsx` — 5161 → 6372 bytes (+1211); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\FoodComparisonView.tsx` — 10091 → 27670 bytes (+17579); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\FoodPreparationList.tsx` — 6427 → 7445 bytes (+1018); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\index.ts` — 2005 → 2276 bytes (+271); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\intelligence-tokens.ts` — 8787 → 9258 bytes (+471); contents differ. Old hash not found elsewhere in active.
- `client\src\components\layout\app-shell.tsx` — 22730 → 25604 bytes (+2874); contents differ. Old hash not found elsewhere in active.
- `client\src\components\layout\orchard-backdrop.tsx` — 16939 → 8438 bytes (-8501); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-week-meal-entries.ts` — 2700 → 4326 bytes (+1626); contents differ. Old hash not found elsewhere in active.
- `client\src\lib\diets.ts` — 8802 → 10258 bytes (+1456); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-benchmark-households-page.tsx` — 29352 → 33967 bytes (+4615); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-intelligence-page.tsx` — 61882 → 61930 bytes (+48); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-knowledge-claims-page.tsx` — 23579 → 30591 bytes (+7012); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-page.tsx` — 28673 → 29019 bytes (+346); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\cookbook-real-book-concept.tsx` — 25168 → 24094 bytes (-1074); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\dashboard.tsx` — 47498 → 47495 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\food-comparison-page.tsx` — 8420 → 13425 bytes (+5005); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\food-detail-page.tsx` — 16629 → 21187 bytes (+4558); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\food-diary-page.tsx` — 97662 → 94303 bytes (-3359); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\fridge-interaction-preview.tsx` — 17708 → 18424 bytes (+716); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\home-experience-page.tsx` — 57054 → 33537 bytes (-23517); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\home-page.tsx` — 10670 → 11754 bytes (+1084); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\invitation-page.tsx` — 8622 → 8618 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\larder-room.tsx` — 44722 → 45595 bytes (+873); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\living-home-room.css` — 32615 → 34272 bytes (+1657); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\meals-page.tsx` — 348616 → 348624 bytes (+8); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\client__src__pages__meals-page.tsx.
- `client\src\pages\not-found.tsx` — 2897 → 2893 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\onboarding-page.tsx` — 41977 → 41980 bytes (+3); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\client__src__pages__onboarding-page.tsx.
- `client\src\pages\plant-diversity-page.tsx` — 8055 → 23981 bytes (+15926); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\privacy-settings-page.tsx` — 20854 → 21664 bytes (+810); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\products-page.tsx` — 117649 → 123467 bytes (+5818); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\profile-page.tsx` — 102551 → 110411 bytes (+7860); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\quick-meal-page.tsx` — 36360 → 36672 bytes (+312); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\shopping-workspace-page.tsx` — 178448 → 156246 bytes (-22202); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\weekly-planner-page.tsx` — 242730 → 244910 bytes (+2180); contents differ. Old hash not found elsewhere in active.
- `client\src\styles\planner-physical.css` — 2411 → 26439 bytes (+24028); contents differ. Old hash not found elsewhere in active.
- `config\governed-roots.json` — 655 → 675 bytes (+20); contents differ. Old version also exists at: config\governed-roots.json20261003.
- `docs\architecture\GOVERNING_EXPERIENCE_ARCHITECTURE.md` — 97742 → 98623 bytes (+881); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\LIVING_HOME_VISUAL_REGISTRY.md` — 77754 → 78510 bytes (+756); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` — 62270 → 62534 bytes (+264); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\NK2_THA_NUTRITION_METHODOLOGY.md` — 39481 → 40019 bytes (+538); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\README.md` — 126200 → 127165 bytes (+965); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\REPOSITORY_CONVENTIONS.md` — 16162 → 17295 bytes (+1133); contents differ. Old version also exists at: docs\architecture\REPOSITORY_CONVENTIONS.md.pre-root-allowlist-fix-20261109T182833Z.bak.
- `docs\architecture\THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` — 33786 → 34165 bytes (+379); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\THA_EXPERIENCE_BLUEPRINT.md` — 60361 → 64188 bytes (+3827); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` — 46209 → 57480 bytes (+11271); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — 116080 → 116727 bytes (+647); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\capabilities\analyser.md` — 10070 → 12387 bytes (+2317); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\capabilities\household.md` — 9459 → 10195 bytes (+736); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_FOCUS_20261105\docs__architecture__capabilities__household.md.
- `docs\architecture\capabilities\profile.md` — 5685 → 7029 bytes (+1344); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_FOCUS_20261105\docs__architecture__capabilities__profile.md.
- `docs\implementation\assets\house-asset-register.json` — 12742 → 13668 bytes (+926); contents differ. Old version also exists at: docs\implementation\assets\house-asset-register.json.pre-HOMEEXT1-20261027-115335.bak.
- `docs\implementation\ux\ADOPTION_REGISTER.md` — 80418 → 83758 bytes (+3340); contents differ. Old hash not found elsewhere in active.
- `docs\implementation\ux\adoption-register.json` — 102107 → 105313 bytes (+3206); contents differ. Old version also exists at: docs\implementation\ux\adoption-register.json.pre-HOMEEXT1-20261027-123710.bak.
- `docs\intelligence\benchmark\history\index.json` — 65202 → 70626 bytes (+5424); contents differ. Old hash not found elsewhere in active.
- `docs\product\OWNERS.md` — 13292 → 13130 bytes (-162); contents differ. Old hash not found elsewhere in active.
- `docs\product\VISIBILITY.md` — 13250 → 13053 bytes (-197); contents differ. Old hash not found elsewhere in active.
- `docs\product\assets\glossary.md` — 9002 → 8691 bytes (-311); contents differ. Old hash not found elsewhere in active.
- `docs\product\assets\screenshots\manifest.json` — 3864 → 3854 bytes (-10); contents differ. Old hash not found elsewhere in active.
- `docs\product\connections\settings\set-companion-personality.md` — 1078 → 1074 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\companion-capabilities\cap-companion.md` — 2167 → 3679 bytes (+1512); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-analyser.md` — 1568 → 1588 bytes (+20); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-diary.md` — 1219 → 1235 bytes (+16); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-household.md` — 1466 → 1482 bytes (+16); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-meals.md` — 1364 → 1376 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-pantry.md` — 1222 → 1234 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-partners.md` — 1527 → 1539 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-planner.md` — 1398 → 1410 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-profile.md` — 1508 → 1520 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-shopping.md` — 1381 → 1397 bytes (+16); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\knowledge-capabilities\cap-nutrition-knowledge.md` — 3451 → 3947 bytes (+496); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\knowledge-capabilities\cap-product-knowledge.md` — 4179 → 4203 bytes (+24); contents differ. Old hash not found elsewhere in active.
- `docs\product\inventory\product.json` — 109722 → 109649 bytes (-73); contents differ. Old hash not found elsewhere in active.
- `docs\product\inventory\product.yaml` — 89532 → 92245 bytes (+2713); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-better-choices.md` — 974 → 971 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-build-habits.md` — 1941 → 1938 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-ethos.md` — 1236 → 1233 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-founding-story.md` — 1101 → 1098 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-hero.md` — 1206 → 1203 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-scan-understand.md` — 1100 → 1097 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\domains\dom-cookbook.md` — 1534 → 1691 bytes (+157); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\docs__product__structure__domains__dom-cookbook.md.
- `docs\product\structure\domains\dom-diary.md` — 1218 → 1199 bytes (-19); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\domains\dom-home.md` — 1710 → 1709 bytes (-1); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\domains\dom-shopping.md` — 2018 → 1372 bytes (-646); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\domains\dom-shopping.md.
- `docs\product\structure\journeys\jrn-shop.md` — 2761 → 1736 bytes (-1025); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\journeys\jrn-shop.md.
- `docs\product\structure\pages\page-admin-knowledge-claims.md` — 2580 → 2797 bytes (+217); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-auth.md` — 1244 → 1241 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-basket.md` — 1526 → 923 bytes (-603); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\pages\page-basket.md.
- `docs\product\structure\pages\page-cookbook.md` — 1444 → 1409 bytes (-35); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\docs__product__structure__pages__page-cookbook.md.
- `docs\product\structure\pages\page-diary.md` — 1522 → 1419 bytes (-103); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-home.md` — 2308 → 2463 bytes (+155); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-not-found.md` — 1410 → 709 bytes (-701); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\pages\page-not-found.md.
- `docs\product\structure\pages\page-nutrition.md` — 1561 → 1636 bytes (+75); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-pantry.md` — 1928 → 1871 bytes (-57); contents differ. Old version also exists at: .engineering\session\rollback-evidence\LARDER_ROUTE1_REMOVE_REDIRECT_20261105\docs\product\structure\pages\page-pantry.md.
- `docs\product\structure\pages\page-profile.md` — 1627 → 1709 bytes (+82); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_FOCUS_20261105\docs__product__structure__pages__page-profile.md.
- `docs\product\structure\pages\page-shopping-workspace.md` — 1901 → 1276 bytes (-625); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\pages\page-shopping-workspace.md.
- `docs\product\structure\routes\routes-map.md` — 7924 → 4092 bytes (-3832); contents differ. Old hash not found elsewhere in active.
- `docs\product\surfaces\admin\adm-knowledge-claims.md` — 2696 → 2934 bytes (+238); contents differ. Old hash not found elsewhere in active.
- `docs\product\surfaces\hidden\hid-routing-telemetry.md` — 3114 → 3110 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\afi1-capture-ambient-screenshots.ts` — 5972 → 5968 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\afi2-capture-ambient-screenshots.ts` — 5937 → 5933 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\afi35-capture-ambient-screenshots.ts` — 13077 → 13069 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-arrival1-home.ts` — 5498 → 5486 bytes (-12); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-expadopt1-adoption.ts` — 3974 → 3967 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-intarch1-interior-architecture.ts` — 5232 → 5225 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-intarch2-material-surfaces.ts` — 6407 → 6400 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-nav1-application-shell.ts` — 5913 → 5905 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-north1-home.ts` — 6096 → 6084 bytes (-12); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-north2-home.ts` — 5582 → 5566 bytes (-16); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-north3-home.ts` — 5346 → 5330 bytes (-16); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-odl1-home.ts` — 2177 → 2169 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-product-screenshots.ts` — 6142 → 6135 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-ux-evidence.ts` — 33473 → 33410 bytes (-63); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-ux2-experience-language.ts` — 4511 → 4500 bytes (-11); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-ux3-experience-convergence.ts` — 6258 → 6243 bytes (-15); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-uxnav1-orchard-navigation.ts` — 5403 → 5396 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\experience-verify1-capture-rooms.ts` — 9031 → 9012 bytes (-19); contents differ. Old hash not found elsewhere in active.
- `scripts\mat1-capture-maturity-screenshots.ts` — 16520 → 16512 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\prod1-capture-product-completion.ts` — 14556 → 14540 bytes (-16); contents differ. Old hash not found elsewhere in active.
- `scripts\ux-refine1-verify-shell.ts` — 7876 → 7872 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\ux2-verify-experience-language.ts` — 11791 → 11776 bytes (-15); contents differ. Old hash not found elsewhere in active.
- `scripts\ux3-verify-experience-convergence.ts` — 9154 → 9143 bytes (-11); contents differ. Old hash not found elsewhere in active.
- `scripts\ci\typecheck-baseline.json` — 9987 → 4139 bytes (-5848); contents differ. Old hash not found elsewhere in active.
- `server\db.ts` — 1372 → 3223 bytes (+1851); contents differ. Old hash not found elsewhere in active.
- `server\routes.ts` — 674885 → 695822 bytes (+20937); contents differ. Old hash not found elsewhere in active.
- `server\storage.ts` — 207406 → 216810 bytes (+9404); contents differ. Old hash not found elsewhere in active.
- `server\trust-routes.ts` — 15087 → 16091 bytes (+1004); contents differ. Old hash not found elsewhere in active.
- `server\benchmark\world-fixtures.ts` — 88713 → 89409 bytes (+696); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\capability-registry.ts` — 57854 → 58106 bytes (+252); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\intent-resolver.ts` — 6677 → 8166 bytes (+1489); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\pattern-intent-resolver.ts` — 146091 → 161672 bytes (+15581); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\pattern-intent-resolver.ts.
- `server\intelligence\README.md` — 45197 → 44148 bytes (-1049); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\bindings\household.ts` — 2511 → 2346 bytes (-165); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\bindings\profile.ts` — 2377 → 2316 bytes (-61); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\context\context-view.ts` — 41015 → 43983 bytes (+2968); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\action-language.ts` — 20033 → 22479 bytes (+2446); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\action-resolution.ts` — 29210 → 34831 bytes (+5621); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\companion-action-store.ts` — 9831 → 10232 bytes (+401); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\conversation-gateway.ts` — 85682 → 93999 bytes (+8317); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\native-discovery.ts` — 15526 → 15543 bytes (+17); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\notice-engine.ts` — 29082 → 31029 bytes (+1947); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\personality-registry.ts` — 32326 → 32380 bytes (+54); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\food-intelligence\comparison-engine.ts` — 31251 → 49309 bytes (+18058); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\food-intelligence\engine.ts` — 18155 → 18169 bytes (+14); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\food-intelligence\opportunity-engine.ts` — 72029 → 72853 bytes (+824); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\household-read-handler.ts` — 10136 → 13148 bytes (+3012); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\household-read-port.ts` — 3783 → 4471 bytes (+688); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\nutrition-discovery-port.ts` — 4241 → 4569 bytes (+328); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\nutrition-discovery-port.ts.
- `server\intelligence\handlers\opportunity-delivery-handler.ts` — 14437 → 15384 bytes (+947); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\opportunity-delivery-read-port.ts` — 2815 → 3215 bytes (+400); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\planner-read-handler.ts` — 14831 → 18912 bytes (+4081); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\planner-read-port.ts` — 8495 → 9364 bytes (+869); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\profile-read-handler.ts` — 13687 → 16252 bytes (+2565); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\profile-read-port.ts` — 2710 → 3700 bytes (+990); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\shopping-read-handler.ts` — 16827 → 17351 bytes (+524); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\opportunity-delivery\delivery-store.ts` — 9882 → 11579 bytes (+1697); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\opportunity-delivery\framework.ts` — 51643 → 54295 bytes (+2652); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\services\nutrition-discovery-engine.ts` — 10365 → 12243 bytes (+1878); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\nutrition-discovery-engine.ts.
- `server\lib\food-intelligence-assembler.ts` — 20126 → 26436 bytes (+6310); contents differ. Old hash not found elsewhere in active.
- `server\lib\food-report-evidence.ts` — 4095 → 4553 bytes (+458); contents differ. Old hash not found elsewhere in active.
- `server\lib\knowledge-claim-review-store.ts` — 20189 → 32641 bytes (+12452); contents differ. Old hash not found elsewhere in active.
- `server\lib\meal-service.ts` — 11435 → 11693 bytes (+258); contents differ. Old hash not found elsewhere in active.
- `server\lib\nutrition-centre-assembler.ts` — 12903 → 15742 bytes (+2839); contents differ. Old hash not found elsewhere in active.
- `server\lib\product-event-logger.ts` — 6459 → 6586 bytes (+127); contents differ. Old hash not found elsewhere in active.
- `server\lib\routing.ts` — 3869 → 3802 bytes (-67); contents differ. Old hash not found elsewhere in active.
- `server\lib\uplift-rules.ts` — 41850 → 45790 bytes (+3940); contents differ. Old hash not found elsewhere in active.
- `server\lib\usda-whole-food-service.ts` — 3179 → 14156 bytes (+10977); contents differ. Old hash not found elsewhere in active.
- `server\migrations\runner.ts` — 187101 → 195838 bytes (+8737); contents differ. Old hash not found elsewhere in active.
- `server\privacy\personal-data-registry.ts` — 45317 → 46747 bytes (+1430); contents differ. Old hash not found elsewhere in active.
- `server\services\nutrition-knowledge-registry.ts` — 47846 → 56959 bytes (+9113); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-cbk2-intelligent-cookbook.ts` — 23063 → 11741 bytes (-11322); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-comp1-food-comparison.ts` — 21771 → 29170 bytes (+7399); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-cookbook-real-book-contract.ts` — 15037 → 15455 bytes (+418); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-companion-card.ts` — 10519 → 10526 bytes (+7); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\server__tests__test-intelligence-companion-card.ts.
- `server\tests\test-intelligence-context-composition.ts` — 59446 → 60928 bytes (+1482); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-household-binding.ts` — 20443 → 20590 bytes (+147); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-native-discovery.ts` — 19618 → 20670 bytes (+1052); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-nutrition-discovery-binding.ts` — 23810 → 27509 bytes (+3699); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\test-intelligence-nutrition-discovery-binding.ts.
- `server\tests\test-intelligence-nutrition-knowledge-binding.ts` — 18994 → 19017 bytes (+23); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-planner-binding.ts` — 18342 → 23800 bytes (+5458); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-shopping-binding.ts` — 17942 → 18721 bytes (+779); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intent-resolver-routing-attribution.ts` — 16997 → 17308 bytes (+311); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\test-intent-resolver-routing-attribution.ts.
- `server\tests\test-intent-resolver.ts` — 27381 → 29725 bytes (+2344); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-pantry1-intelligent-pantry.ts` — 33766 → 10759 bytes (-23007); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-plan2-planner-evolution.ts` — 24742 → 3529 bytes (-21213); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-prod3-companion-restriction-safety.ts` — 17135 → 17885 bytes (+750); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\aggregate.ts` — 33287 → 36112 bytes (+2825); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\expectations.ts` — 19690 → 19843 bytes (+153); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\index.ts` — 1799 → 1818 bytes (+19); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\report.ts` — 33549 → 34029 bytes (+480); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\runner.ts` — 13205 → 14141 bytes (+936); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\scorer.ts` — 28971 → 32970 bytes (+3999); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\types.ts` — 30246 → 33405 bytes (+3159); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\fixtures\companion-benchmark-100.v1.json` — 89473 → 89469 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `server\verification\publication-register.ts` — 126746 → 129662 bytes (+2916); contents differ. Old hash not found elsewhere in active.
- `shared\ingredient-aliases.ts` — 19947 → 20728 bytes (+781); contents differ. Old hash not found elsewhere in active.
- `shared\schema.ts` — 189487 → 193143 bytes (+3656); contents differ. Old hash not found elsewhere in active.
- `shared\canonical\food-report-adapter.ts` — 9502 → 11889 bytes (+2387); contents differ. Old hash not found elsewhere in active.
- `shared\catalogue\alias-resolver.ts` — 5439 → 5616 bytes (+177); contents differ. Old hash not found elsewhere in active.
- `shared\catalogue\name-normaliser.ts` — 9931 → 11489 bytes (+1558); contents differ. Old hash not found elsewhere in active.
- `shared\knowledge\evidence.ts` — 16697 → 18187 bytes (+1490); contents differ. Old hash not found elsewhere in active.
- `shared\legal\documents\privacy-policy.ts` — 17467 → 17797 bytes (+330); contents differ. Old hash not found elsewhere in active.
- `shared\privacy\consent.ts` — 6764 → 7030 bytes (+266); contents differ. Old hash not found elsewhere in active.
- `shared\support\help-centre.ts` — 41061 → 41060 bytes (-1); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\shared__support__help-centre.ts.

### Active-only paths

Counts are in the summary. These are paths absent by the same relative path in the old folder; the same content may be present there at another path.

## tha-integrated-dev-staging-20260927

**Reading:** three cookbook briefs moved into the active `docs\investigations\cookbook\`; only `docs\product\structure\pages\page-landing.md` is unique by content. Same-path changes span client/server, governance, dependencies, tests, scripts and docs.

### Genuinely unique old files

- `docs\product\structure\pages\page-landing.md` (1519 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.

### Relocated files (same hash found at active path)

- `CODEX_COOKBOOK_FUNCTIONAL_TASK.md` → docs\investigations\cookbook\CODEX_COOKBOOK_FUNCTIONAL_TASK.md — identical content at a different path.
- `COOKBOOK_COLLABORATION_CONTRACT.md` → docs\investigations\cookbook\COOKBOOK_COLLABORATION_CONTRACT.md — identical content at a different path.
- `OVERNIGHT_COOKBOOK_ORCHESTRATION.md` → docs\investigations\cookbook\OVERNIGHT_COOKBOOK_ORCHESTRATION.md — identical content at a different path.

### Same-path files with changed content

Each listed file exists at the same relative path but has a different hash. Where the old hash is still in active under another path, the location is shown.

- `.env` — 244 → 700 bytes (+456); contents differ. Old hash not found elsewhere in active.
- `AGENTS.md` — 1531 → 5295 bytes (+3764); contents differ. Old hash not found elsewhere in active.
- `package-lock.json` — 415910 → 437879 bytes (+21969); contents differ. Old hash not found elsewhere in active.
- `package.json` — 30326 → 31020 bytes (+694); contents differ. Old hash not found elsewhere in active.
- `PROJECT_GOVERNANCE.md` — 94887 → 127796 bytes (+32909); contents differ. Old version also exists at: PROJECT_GOVERNANCE.md20261003.
- `vite.frontend-only.config.ts` — 423 → 792 bytes (+369); contents differ. Old hash not found elsewhere in active.
- `.engineering\scripts\repo-structure-verify.sh` — 6372 → 6934 bytes (+562); contents differ. Old version also exists at: .engineering\scripts\repo-structure-verify.sh.pre-root-allowlist-fix-20261109T182823Z.bak.
- `.engineering\scripts\rollback-verify.sh` — 6972 → 7729 bytes (+757); contents differ. Old version also exists at: .engineering\scripts\rollback-verify.sh.pre-python3-fix-20261109T182335Z.bak.
- `.engineering\session\CURRENT.md` — 475557 → 485027 bytes (+9470); contents differ. Old hash not found elsewhere in active.
- `client\src\App.tsx` — 28474 → 23487 bytes (-4987); contents differ. Old hash not found elsewhere in active.
- `client\src\index.css` — 112583 → 103461 bytes (-9122); contents differ. Old hash not found elsewhere in active.
- `client\src\components\admin-banner.tsx` — 3901 → 3997 bytes (+96); contents differ. Old hash not found elsewhere in active.
- `client\src\components\FoodReport.tsx` — 8529 → 9655 bytes (+1126); contents differ. Old hash not found elsewhere in active.
- `client\src\components\HouseholdNutritionCentre.tsx` — 15585 → 22832 bytes (+7247); contents differ. Old hash not found elsewhere in active.
- `client\src\components\MealPreviewBubble.tsx` — 9481 → 9712 bytes (+231); contents differ. Old hash not found elsewhere in active.
- `client\src\components\nav-bar.tsx` — 36611 → 36758 bytes (+147); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PantryKnowledgeHub.tsx` — 49067 → 49102 bytes (+35); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerAssistantPanel.tsx` — 89650 → 93068 bytes (+3418); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerMealCard.tsx` — 9081 → 9499 bytes (+418); contents differ. Old version also exists at: .engineering\session\rollback-evidence\planner-followup-20261026\PlannerMealCard.tsx.before-topline-meal-photos-20261026T213735.
- `client\src\components\PlannerMealPickerPanel.tsx` — 37887 → 39353 bytes (+1466); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerScanReview.tsx` — 61748 → 61756 bytes (+8); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\client__src__components__PlannerScanReview.tsx.
- `client\src\components\PlantDiversityReport.tsx` — 45701 → 46268 bytes (+567); contents differ. Old hash not found elsewhere in active.
- `client\src\components\SmartReviewPanelContent.tsx` — 29113 → 27339 bytes (-1774); contents differ. Old hash not found elsewhere in active.
- `client\src\components\workspace-header.tsx` — 15432 → 16118 bytes (+686); contents differ. Old hash not found elsewhere in active.
- `client\src\components\analyser\AnalyserDetailV2.tsx` — 32213 → 34665 bytes (+2452); contents differ. Old hash not found elsewhere in active.
- `client\src\components\analyser\WholeFoodAnalysisCard.tsx` — 5598 → 6001 bytes (+403); contents differ. Old hash not found elsewhere in active.
- `client\src\components\conversation\companion-card.ts` — 13897 → 13905 bytes (+8); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\client__src__components__conversation__companion-card.ts.
- `client\src\components\conversation\FloatingAssistant.tsx` — 85732 → 98751 bytes (+13019); contents differ. Old hash not found elsewhere in active.
- `client\src\components\cookbook-real-book\real-book.css` — 26297 → 28341 bytes (+2044); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\ConnectedFoodPanel.tsx` — 5161 → 6372 bytes (+1211); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\FoodComparisonView.tsx` — 10091 → 27670 bytes (+17579); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\FoodPreparationList.tsx` — 6427 → 7445 bytes (+1018); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\index.ts` — 2005 → 2276 bytes (+271); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\intelligence-tokens.ts` — 8787 → 9258 bytes (+471); contents differ. Old hash not found elsewhere in active.
- `client\src\components\layout\app-shell.tsx` — 22730 → 25604 bytes (+2874); contents differ. Old hash not found elsewhere in active.
- `client\src\components\layout\orchard-backdrop.tsx` — 16939 → 8438 bytes (-8501); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-week-meal-entries.ts` — 2700 → 4326 bytes (+1626); contents differ. Old hash not found elsewhere in active.
- `client\src\lib\diets.ts` — 8802 → 10258 bytes (+1456); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-benchmark-households-page.tsx` — 29352 → 33967 bytes (+4615); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-intelligence-page.tsx` — 61882 → 61930 bytes (+48); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-knowledge-claims-page.tsx` — 23579 → 30591 bytes (+7012); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-page.tsx` — 28673 → 29019 bytes (+346); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\cookbook-real-book-concept.tsx` — 25168 → 24094 bytes (-1074); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\dashboard.tsx` — 47498 → 47495 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\food-comparison-page.tsx` — 8420 → 13425 bytes (+5005); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\food-detail-page.tsx` — 16629 → 21187 bytes (+4558); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\food-diary-page.tsx` — 97662 → 94303 bytes (-3359); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\fridge-interaction-preview.tsx` — 17708 → 18424 bytes (+716); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\home-experience-page.tsx` — 57054 → 33537 bytes (-23517); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\home-page.tsx` — 10670 → 11754 bytes (+1084); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\invitation-page.tsx` — 8622 → 8618 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\larder-room.tsx` — 44722 → 45595 bytes (+873); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\living-home-room.css` — 32615 → 34272 bytes (+1657); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\meals-page.tsx` — 348616 → 348624 bytes (+8); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\client__src__pages__meals-page.tsx.
- `client\src\pages\not-found.tsx` — 2897 → 2893 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\onboarding-page.tsx` — 41977 → 41980 bytes (+3); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\client__src__pages__onboarding-page.tsx.
- `client\src\pages\plant-diversity-page.tsx` — 8055 → 23981 bytes (+15926); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\privacy-settings-page.tsx` — 20854 → 21664 bytes (+810); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\products-page.tsx` — 117649 → 123467 bytes (+5818); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\profile-page.tsx` — 102551 → 110411 bytes (+7860); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\quick-meal-page.tsx` — 36360 → 36672 bytes (+312); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\shopping-workspace-page.tsx` — 178448 → 156246 bytes (-22202); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\weekly-planner-page.tsx` — 242730 → 244910 bytes (+2180); contents differ. Old hash not found elsewhere in active.
- `client\src\styles\planner-physical.css` — 2411 → 26439 bytes (+24028); contents differ. Old hash not found elsewhere in active.
- `config\governed-roots.json` — 655 → 675 bytes (+20); contents differ. Old version also exists at: config\governed-roots.json20261003.
- `docs\architecture\GOVERNING_EXPERIENCE_ARCHITECTURE.md` — 97742 → 98623 bytes (+881); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\LIVING_HOME_VISUAL_REGISTRY.md` — 77754 → 78510 bytes (+756); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` — 62270 → 62534 bytes (+264); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\NK2_THA_NUTRITION_METHODOLOGY.md` — 39481 → 40019 bytes (+538); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\README.md` — 126200 → 127165 bytes (+965); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\REPOSITORY_CONVENTIONS.md` — 16162 → 17295 bytes (+1133); contents differ. Old version also exists at: docs\architecture\REPOSITORY_CONVENTIONS.md.pre-root-allowlist-fix-20261109T182833Z.bak.
- `docs\architecture\THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` — 33786 → 34165 bytes (+379); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\THA_EXPERIENCE_BLUEPRINT.md` — 60361 → 64188 bytes (+3827); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` — 46209 → 57480 bytes (+11271); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — 116080 → 116727 bytes (+647); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\capabilities\analyser.md` — 10070 → 12387 bytes (+2317); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\capabilities\household.md` — 9459 → 10195 bytes (+736); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_FOCUS_20261105\docs__architecture__capabilities__household.md.
- `docs\architecture\capabilities\profile.md` — 5685 → 7029 bytes (+1344); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_FOCUS_20261105\docs__architecture__capabilities__profile.md.
- `docs\implementation\assets\house-asset-register.json` — 12742 → 13668 bytes (+926); contents differ. Old version also exists at: docs\implementation\assets\house-asset-register.json.pre-HOMEEXT1-20261027-115335.bak.
- `docs\implementation\ux\ADOPTION_REGISTER.md` — 80418 → 83758 bytes (+3340); contents differ. Old hash not found elsewhere in active.
- `docs\implementation\ux\adoption-register.json` — 102107 → 105313 bytes (+3206); contents differ. Old version also exists at: docs\implementation\ux\adoption-register.json.pre-HOMEEXT1-20261027-123710.bak.
- `docs\intelligence\benchmark\history\index.json` — 65202 → 70626 bytes (+5424); contents differ. Old hash not found elsewhere in active.
- `docs\product\OWNERS.md` — 13292 → 13130 bytes (-162); contents differ. Old hash not found elsewhere in active.
- `docs\product\VISIBILITY.md` — 13250 → 13053 bytes (-197); contents differ. Old hash not found elsewhere in active.
- `docs\product\assets\glossary.md` — 9002 → 8691 bytes (-311); contents differ. Old hash not found elsewhere in active.
- `docs\product\assets\screenshots\manifest.json` — 3864 → 3854 bytes (-10); contents differ. Old hash not found elsewhere in active.
- `docs\product\connections\settings\set-companion-personality.md` — 1078 → 1074 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\companion-capabilities\cap-companion.md` — 2167 → 3679 bytes (+1512); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-analyser.md` — 1568 → 1588 bytes (+20); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-diary.md` — 1219 → 1235 bytes (+16); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-household.md` — 1466 → 1482 bytes (+16); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-meals.md` — 1364 → 1376 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-pantry.md` — 1222 → 1234 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-partners.md` — 1527 → 1539 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-planner.md` — 1398 → 1410 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-profile.md` — 1508 → 1520 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-shopping.md` — 1381 → 1397 bytes (+16); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\knowledge-capabilities\cap-nutrition-knowledge.md` — 3451 → 3947 bytes (+496); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\knowledge-capabilities\cap-product-knowledge.md` — 4179 → 4203 bytes (+24); contents differ. Old hash not found elsewhere in active.
- `docs\product\inventory\product.json` — 109722 → 109649 bytes (-73); contents differ. Old hash not found elsewhere in active.
- `docs\product\inventory\product.yaml` — 89532 → 92245 bytes (+2713); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-better-choices.md` — 974 → 971 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-build-habits.md` — 1941 → 1938 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-ethos.md` — 1236 → 1233 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-founding-story.md` — 1101 → 1098 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-hero.md` — 1206 → 1203 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-scan-understand.md` — 1100 → 1097 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\domains\dom-cookbook.md` — 1534 → 1691 bytes (+157); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\docs__product__structure__domains__dom-cookbook.md.
- `docs\product\structure\domains\dom-diary.md` — 1218 → 1199 bytes (-19); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\domains\dom-home.md` — 1710 → 1709 bytes (-1); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\domains\dom-shopping.md` — 2018 → 1372 bytes (-646); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\domains\dom-shopping.md.
- `docs\product\structure\journeys\jrn-shop.md` — 2761 → 1736 bytes (-1025); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\journeys\jrn-shop.md.
- `docs\product\structure\pages\page-admin-knowledge-claims.md` — 2580 → 2797 bytes (+217); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-auth.md` — 1244 → 1241 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-basket.md` — 1526 → 923 bytes (-603); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\pages\page-basket.md.
- `docs\product\structure\pages\page-cookbook.md` — 1444 → 1409 bytes (-35); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\docs__product__structure__pages__page-cookbook.md.
- `docs\product\structure\pages\page-diary.md` — 1522 → 1419 bytes (-103); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-home.md` — 2308 → 2463 bytes (+155); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-not-found.md` — 1410 → 709 bytes (-701); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\pages\page-not-found.md.
- `docs\product\structure\pages\page-nutrition.md` — 1561 → 1636 bytes (+75); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-pantry.md` — 1928 → 1871 bytes (-57); contents differ. Old version also exists at: .engineering\session\rollback-evidence\LARDER_ROUTE1_REMOVE_REDIRECT_20261105\docs\product\structure\pages\page-pantry.md.
- `docs\product\structure\pages\page-profile.md` — 1627 → 1709 bytes (+82); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_FOCUS_20261105\docs__product__structure__pages__page-profile.md.
- `docs\product\structure\pages\page-shopping-workspace.md` — 1901 → 1276 bytes (-625); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\pages\page-shopping-workspace.md.
- `docs\product\structure\routes\routes-map.md` — 7924 → 4092 bytes (-3832); contents differ. Old hash not found elsewhere in active.
- `docs\product\surfaces\admin\adm-knowledge-claims.md` — 2696 → 2934 bytes (+238); contents differ. Old hash not found elsewhere in active.
- `docs\product\surfaces\hidden\hid-routing-telemetry.md` — 3114 → 3110 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\afi1-capture-ambient-screenshots.ts` — 5972 → 5968 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\afi2-capture-ambient-screenshots.ts` — 5937 → 5933 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\afi35-capture-ambient-screenshots.ts` — 13077 → 13069 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-arrival1-home.ts` — 5498 → 5486 bytes (-12); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-expadopt1-adoption.ts` — 3974 → 3967 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-intarch1-interior-architecture.ts` — 5232 → 5225 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-intarch2-material-surfaces.ts` — 6407 → 6400 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-nav1-application-shell.ts` — 5913 → 5905 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-north1-home.ts` — 6096 → 6084 bytes (-12); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-north2-home.ts` — 5582 → 5566 bytes (-16); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-north3-home.ts` — 5346 → 5330 bytes (-16); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-odl1-home.ts` — 2177 → 2169 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-product-screenshots.ts` — 6142 → 6135 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-ux-evidence.ts` — 33473 → 33410 bytes (-63); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-ux2-experience-language.ts` — 4511 → 4500 bytes (-11); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-ux3-experience-convergence.ts` — 6258 → 6243 bytes (-15); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-uxnav1-orchard-navigation.ts` — 5403 → 5396 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\experience-verify1-capture-rooms.ts` — 9031 → 9012 bytes (-19); contents differ. Old hash not found elsewhere in active.
- `scripts\mat1-capture-maturity-screenshots.ts` — 16520 → 16512 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\prod1-capture-product-completion.ts` — 14556 → 14540 bytes (-16); contents differ. Old hash not found elsewhere in active.
- `scripts\ux-refine1-verify-shell.ts` — 7876 → 7872 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\ux2-verify-experience-language.ts` — 11791 → 11776 bytes (-15); contents differ. Old hash not found elsewhere in active.
- `scripts\ux3-verify-experience-convergence.ts` — 9154 → 9143 bytes (-11); contents differ. Old hash not found elsewhere in active.
- `scripts\ci\typecheck-baseline.json` — 9987 → 4139 bytes (-5848); contents differ. Old hash not found elsewhere in active.
- `server\db.ts` — 1372 → 3223 bytes (+1851); contents differ. Old hash not found elsewhere in active.
- `server\routes.ts` — 674885 → 695822 bytes (+20937); contents differ. Old hash not found elsewhere in active.
- `server\storage.ts` — 207406 → 216810 bytes (+9404); contents differ. Old hash not found elsewhere in active.
- `server\trust-routes.ts` — 15087 → 16091 bytes (+1004); contents differ. Old hash not found elsewhere in active.
- `server\benchmark\world-fixtures.ts` — 88713 → 89409 bytes (+696); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\capability-registry.ts` — 57854 → 58106 bytes (+252); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\intent-resolver.ts` — 6677 → 8166 bytes (+1489); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\pattern-intent-resolver.ts` — 146091 → 161672 bytes (+15581); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\pattern-intent-resolver.ts.
- `server\intelligence\README.md` — 45197 → 44148 bytes (-1049); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\bindings\household.ts` — 2511 → 2346 bytes (-165); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\bindings\profile.ts` — 2377 → 2316 bytes (-61); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\context\context-view.ts` — 41015 → 43983 bytes (+2968); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\action-language.ts` — 20033 → 22479 bytes (+2446); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\action-resolution.ts` — 29210 → 34831 bytes (+5621); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\companion-action-store.ts` — 9831 → 10232 bytes (+401); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\conversation-gateway.ts` — 85682 → 93999 bytes (+8317); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\native-discovery.ts` — 15526 → 15543 bytes (+17); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\notice-engine.ts` — 29082 → 31029 bytes (+1947); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\personality-registry.ts` — 32326 → 32380 bytes (+54); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\food-intelligence\comparison-engine.ts` — 31251 → 49309 bytes (+18058); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\food-intelligence\engine.ts` — 18155 → 18169 bytes (+14); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\food-intelligence\opportunity-engine.ts` — 72029 → 72853 bytes (+824); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\household-discovery-handler.ts` — 2712 → 2610 bytes (-102); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\household-read-handler.ts` — 10136 → 13148 bytes (+3012); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\household-read-port.ts` — 3783 → 4471 bytes (+688); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\nutrition-discovery-port.ts` — 4241 → 4569 bytes (+328); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\nutrition-discovery-port.ts.
- `server\intelligence\handlers\opportunity-delivery-handler.ts` — 14437 → 15384 bytes (+947); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\opportunity-delivery-read-port.ts` — 2815 → 3215 bytes (+400); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\planner-read-handler.ts` — 14831 → 18912 bytes (+4081); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\planner-read-port.ts` — 8495 → 9364 bytes (+869); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\profile-read-handler.ts` — 13687 → 16252 bytes (+2565); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\profile-read-port.ts` — 2710 → 3700 bytes (+990); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\shopping-discovery-port.ts` — 3145 → 3254 bytes (+109); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\shopping-read-handler.ts` — 16827 → 17351 bytes (+524); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\opportunity-delivery\delivery-store.ts` — 9882 → 11579 bytes (+1697); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\opportunity-delivery\framework.ts` — 51643 → 54295 bytes (+2652); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\services\nutrition-discovery-engine.ts` — 10365 → 12243 bytes (+1878); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\nutrition-discovery-engine.ts.
- `server\intelligence\services\shopping-discovery-engine.ts` — 3268 → 3277 bytes (+9); contents differ. Old hash not found elsewhere in active.
- `server\lib\food-intelligence-assembler.ts` — 20126 → 26436 bytes (+6310); contents differ. Old hash not found elsewhere in active.
- `server\lib\food-report-evidence.ts` — 4095 → 4553 bytes (+458); contents differ. Old hash not found elsewhere in active.
- `server\lib\knowledge-claim-review-store.ts` — 20189 → 32641 bytes (+12452); contents differ. Old hash not found elsewhere in active.
- `server\lib\meal-service.ts` — 11435 → 11693 bytes (+258); contents differ. Old hash not found elsewhere in active.
- `server\lib\nutrition-centre-assembler.ts` — 12903 → 15742 bytes (+2839); contents differ. Old hash not found elsewhere in active.
- `server\lib\product-event-logger.ts` — 6459 → 6586 bytes (+127); contents differ. Old hash not found elsewhere in active.
- `server\lib\routing.ts` — 3869 → 3802 bytes (-67); contents differ. Old hash not found elsewhere in active.
- `server\lib\uplift-rules.ts` — 41850 → 45790 bytes (+3940); contents differ. Old hash not found elsewhere in active.
- `server\lib\usda-whole-food-service.ts` — 3179 → 14156 bytes (+10977); contents differ. Old hash not found elsewhere in active.
- `server\migrations\runner.ts` — 187101 → 195838 bytes (+8737); contents differ. Old hash not found elsewhere in active.
- `server\privacy\personal-data-registry.ts` — 45317 → 46747 bytes (+1430); contents differ. Old hash not found elsewhere in active.
- `server\services\nutrition-knowledge-registry.ts` — 47846 → 56959 bytes (+9113); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-cbk2-intelligent-cookbook.ts` — 23063 → 11741 bytes (-11322); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-comp1-food-comparison.ts` — 21771 → 29170 bytes (+7399); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-cookbook-real-book-contract.ts` — 15037 → 15455 bytes (+418); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-companion-card.ts` — 10519 → 10526 bytes (+7); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\server__tests__test-intelligence-companion-card.ts.
- `server\tests\test-intelligence-context-composition.ts` — 59446 → 60928 bytes (+1482); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-household-binding.ts` — 20443 → 20590 bytes (+147); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-native-discovery.ts` — 19618 → 20670 bytes (+1052); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-nutrition-discovery-binding.ts` — 23810 → 27509 bytes (+3699); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\test-intelligence-nutrition-discovery-binding.ts.
- `server\tests\test-intelligence-nutrition-knowledge-binding.ts` — 18994 → 19017 bytes (+23); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-planner-binding.ts` — 18342 → 23800 bytes (+5458); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-shopping-binding.ts` — 17942 → 18721 bytes (+779); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-shopping-discovery-binding.ts` — 13140 → 13715 bytes (+575); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intent-resolver-routing-attribution.ts` — 16997 → 17308 bytes (+311); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\test-intent-resolver-routing-attribution.ts.
- `server\tests\test-intent-resolver.ts` — 26310 → 29725 bytes (+3415); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-pantry1-intelligent-pantry.ts` — 33766 → 10759 bytes (-23007); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-plan2-planner-evolution.ts` — 24742 → 3529 bytes (-21213); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-prod3-companion-restriction-safety.ts` — 17135 → 17885 bytes (+750); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\aggregate.ts` — 33287 → 36112 bytes (+2825); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\expectations.ts` — 19690 → 19843 bytes (+153); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\index.ts` — 1799 → 1818 bytes (+19); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\report.ts` — 33549 → 34029 bytes (+480); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\runner.ts` — 13205 → 14141 bytes (+936); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\scorer.ts` — 28971 → 32970 bytes (+3999); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\types.ts` — 30246 → 33405 bytes (+3159); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\fixtures\companion-benchmark-100.v1.json` — 89473 → 89469 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `server\verification\publication-register.ts` — 126746 → 129662 bytes (+2916); contents differ. Old hash not found elsewhere in active.
- `shared\ingredient-aliases.ts` — 19947 → 20728 bytes (+781); contents differ. Old hash not found elsewhere in active.
- `shared\schema.ts` — 189487 → 193143 bytes (+3656); contents differ. Old hash not found elsewhere in active.
- `shared\canonical\food-report-adapter.ts` — 9502 → 11889 bytes (+2387); contents differ. Old hash not found elsewhere in active.
- `shared\catalogue\alias-resolver.ts` — 5439 → 5616 bytes (+177); contents differ. Old hash not found elsewhere in active.
- `shared\catalogue\name-normaliser.ts` — 9931 → 11489 bytes (+1558); contents differ. Old hash not found elsewhere in active.
- `shared\knowledge\evidence.ts` — 16697 → 18187 bytes (+1490); contents differ. Old hash not found elsewhere in active.
- `shared\legal\documents\privacy-policy.ts` — 17467 → 17797 bytes (+330); contents differ. Old hash not found elsewhere in active.
- `shared\privacy\consent.ts` — 6764 → 7030 bytes (+266); contents differ. Old hash not found elsewhere in active.
- `shared\support\help-centre.ts` — 41061 → 41060 bytes (-1); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\shared__support__help-centre.ts.

### Active-only paths

Counts are in the summary. These are paths absent by the same relative path in the old folder; the same content may be present there at another path.

## tha-living-larder-authoritative

**Reading:** after generated-output exclusions, 1 path is an exact-content relocation and 53 paths have hashes absent from active. Unique material includes launcher/config files, ops-console source/images, server/runtime code, and product docs. Preserve pending review.

### Genuinely unique old files

- `Create-THA-Shortcuts.ps1` (1331 bytes) — Unique file content; review purpose before discard.
- `Install-THA.ps1` (1654 bytes) — Unique file content; review purpose before discard.
- `package.json20261004` (30229 bytes) — Unique file content; review purpose before discard.
- `package.json20261004T200438` (30484 bytes) — Unique file content; review purpose before discard.
- `start-dev.bat` (259 bytes) — Unique file content; review purpose before discard.
- `THA-C-to-G-live-state-reconciliation-CODEX - C.md` (7141 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `THA-C-to-G-live-state-reconciliation-CODEX.md` (7141 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `tha.cmd` (114 bytes) — Unique file content; review purpose before discard.
- `tha.ps1` (2603 bytes) — Unique file content; review purpose before discard.
- `.codex\hooks.json` (467 bytes) — Unique local configuration/tool file; preserve until reviewed; contents not printed.
- `config\tha-repositories.json` (1028 bytes) — Unique local configuration/tool file; preserve until reviewed; contents not printed.
- `config\tha-repository-reviews.json` (48402 bytes) — Unique local configuration/tool file; preserve until reviewed; contents not printed.
- `config\tha-services.json` (1825 bytes) — Unique local configuration/tool file; preserve until reviewed; contents not printed.
- `docs\THA-OPERATIONS.md` (4540 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `docs\product\structure\pages\page-landing.md` (1519 bytes) — Unique documentation/evidence; may be historic, but exact content is absent from active.
- `ops-console\server.mjs` (16034 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\app.js` (92624 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\index.html` (2443 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\styles.css` (12896 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\repository-review\tha-cookbook-page-fidelity-claude\recipe-revision-02.png` (1749234 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\repository-review\tha-cookbook-real-book-functional\collection.png` (1562299 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\repository-review\tha-cookbook-real-book-functional\recipe.png` (1744344 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\repository-review\tha-cookbook-real-book-functional\trusted-preview.png` (1726129 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\repository-review\tha-cookbook-real-book-visual\review-sheet.png` (1682774 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\repository-review\tha-larder-concept-lab\contact-sheet.png` (7662081 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\repository-review\tha-larder-fruit-nut-assets\flax-seeds.webp` (78588 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\repository-review\tha-larder-room-remediation\batch-01-orchard-workroom.png` (2429906 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\repository-review\tha-living-larder-authoritative\home.png` (827868 bytes) — Potential distinct code/source asset; review before discard.
- `ops-console\public\repository-review\tha-living-larder-v2\candidate-01-vs-north-star.jpg` (165393 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\preflight-env.ts` (7564 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\test-preflight-env.ts` (3606 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-clean.ps1` (1754 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-common.ps1` (41294 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-doctor.ps1` (1712 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-launch-claude.ps1` (4341 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-launch-ide.ps1` (3077 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-launch-terminal.ps1` (3193 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-planner.ps1` (1753 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-repository-review-status.ps1` (3108 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-session.ps1` (6826 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-start.ps1` (12711 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-status.ps1` (6726 bytes) — Potential distinct code/source asset; review before discard.
- `scripts\tha-stop.ps1` (2014 bytes) — Potential distinct code/source asset; review before discard.
- `server\intelligence\opportunity-delivery\surface-selection.ts` (755 bytes) — Potential distinct code/source asset; review before discard.
- `server\lib\database-identity.ts` (1758 bytes) — Potential distinct code/source asset; review before discard.
- `server\lib\pantry-sync-report.ts` (5681 bytes) — Potential distinct code/source asset; review before discard.
- `server\lib\runtime-bind.ts` (521 bytes) — Potential distinct code/source asset; review before discard.
- `server\lib\sanitized-error.ts` (3191 bytes) — Potential distinct code/source asset; review before discard.
- `server\tests\test-database-identity-sanitized.ts` (5148 bytes) — Potential distinct code/source asset; review before discard.
- `server\tests\test-fresh-migration-order.ts` (7630 bytes) — Potential distinct code/source asset; review before discard.
- `server\tests\test-pantry-sync-report.ts` (13140 bytes) — Potential distinct code/source asset; review before discard.
- `server\tests\test-runtime-bind-host.ts` (539 bytes) — Potential distinct code/source asset; review before discard.
- `server\tests\test-sanitized-error.ts` (9561 bytes) — Potential distinct code/source asset; review before discard.

### Relocated files (same hash found at active path)

- `ops-console\public\repository-review\tha-larder-room-remediation\batch-02-food-group-bays.png` → client\public\images\living-larder\room\orchard-workroom.png — identical content at a different path.

### Same-path files with changed content

Each listed file exists at the same relative path but has a different hash. Where the old hash is still in active under another path, the location is shown.

- `.env` — 8273 → 700 bytes (-7573); contents differ. Old hash not found elsewhere in active.
- `.env.example` — 8062 → 6979 bytes (-1083); contents differ. Old hash not found elsewhere in active.
- `.gitignore` — 817 → 793 bytes (-24); contents differ. Old hash not found elsewhere in active.
- `AGENTS.md` — 1874 → 5295 bytes (+3421); contents differ. Old hash not found elsewhere in active.
- `package-lock.json` — 415910 → 437879 bytes (+21969); contents differ. Old hash not found elsewhere in active.
- `package.json` — 30589 → 31020 bytes (+431); contents differ. Old hash not found elsewhere in active.
- `.engineering\scripts\repo-structure-verify.sh` — 6372 → 6934 bytes (+562); contents differ. Old version also exists at: .engineering\scripts\repo-structure-verify.sh.pre-root-allowlist-fix-20261109T182823Z.bak.
- `.engineering\scripts\rollback-verify.sh` — 6972 → 7729 bytes (+757); contents differ. Old version also exists at: .engineering\scripts\rollback-verify.sh.pre-python3-fix-20261109T182335Z.bak.
- `.engineering\session\CURRENT.md` — 475557 → 485027 bytes (+9470); contents differ. Old hash not found elsewhere in active.
- `.hermes\plans\2026-08-13_162625-real-working-cookbook.md` — 24039 → 24485 bytes (+446); contents differ. Old hash not found elsewhere in active.
- `client\src\App.tsx` — 28074 → 23487 bytes (-4587); contents differ. Old hash not found elsewhere in active.
- `client\src\index.css` — 112583 → 103461 bytes (-9122); contents differ. Old hash not found elsewhere in active.
- `client\src\components\admin-banner.tsx` — 3726 → 3997 bytes (+271); contents differ. Old hash not found elsewhere in active.
- `client\src\components\FoodReport.tsx` — 8529 → 9655 bytes (+1126); contents differ. Old hash not found elsewhere in active.
- `client\src\components\HouseholdNutritionCentre.tsx` — 15585 → 22832 bytes (+7247); contents differ. Old hash not found elsewhere in active.
- `client\src\components\MealPreviewBubble.tsx` — 9481 → 9712 bytes (+231); contents differ. Old hash not found elsewhere in active.
- `client\src\components\nav-bar.tsx` — 36611 → 36758 bytes (+147); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PantryKnowledgeHub.tsx` — 49067 → 49102 bytes (+35); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerAssistantPanel.tsx` — 89650 → 93068 bytes (+3418); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerMealCard.tsx` — 9081 → 9499 bytes (+418); contents differ. Old version also exists at: .engineering\session\rollback-evidence\planner-followup-20261026\PlannerMealCard.tsx.before-topline-meal-photos-20261026T213735.
- `client\src\components\PlannerMealPickerPanel.tsx` — 37887 → 39353 bytes (+1466); contents differ. Old hash not found elsewhere in active.
- `client\src\components\PlannerScanReview.tsx` — 61748 → 61756 bytes (+8); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\client__src__components__PlannerScanReview.tsx.
- `client\src\components\PlantDiversityReport.tsx` — 45701 → 46268 bytes (+567); contents differ. Old hash not found elsewhere in active.
- `client\src\components\SmartReviewPanelContent.tsx` — 29113 → 27339 bytes (-1774); contents differ. Old hash not found elsewhere in active.
- `client\src\components\workspace-header.tsx` — 15432 → 16118 bytes (+686); contents differ. Old hash not found elsewhere in active.
- `client\src\components\analyser\AnalyserDetailV2.tsx` — 32213 → 34665 bytes (+2452); contents differ. Old hash not found elsewhere in active.
- `client\src\components\analyser\WholeFoodAnalysisCard.tsx` — 5598 → 6001 bytes (+403); contents differ. Old hash not found elsewhere in active.
- `client\src\components\conversation\companion-card.ts` — 13897 → 13905 bytes (+8); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\client__src__components__conversation__companion-card.ts.
- `client\src\components\conversation\FloatingAssistant.tsx` — 84528 → 98751 bytes (+14223); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\ConnectedFoodPanel.tsx` — 5161 → 6372 bytes (+1211); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\FoodComparisonView.tsx` — 10091 → 27670 bytes (+17579); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\FoodPreparationList.tsx` — 6427 → 7445 bytes (+1018); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\index.ts` — 2005 → 2276 bytes (+271); contents differ. Old hash not found elsewhere in active.
- `client\src\components\intelligence\intelligence-tokens.ts` — 8787 → 9258 bytes (+471); contents differ. Old hash not found elsewhere in active.
- `client\src\components\layout\app-shell.tsx` — 22802 → 25604 bytes (+2802); contents differ. Old hash not found elsewhere in active.
- `client\src\components\layout\orchard-backdrop.tsx` — 16939 → 8438 bytes (-8501); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-planner-meal-search.ts` — 7793 → 8398 bytes (+605); contents differ. Old hash not found elsewhere in active.
- `client\src\hooks\use-week-meal-entries.ts` — 2700 → 4326 bytes (+1626); contents differ. Old hash not found elsewhere in active.
- `client\src\lib\diets.ts` — 8802 → 10258 bytes (+1456); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-benchmark-households-page.tsx` — 29352 → 33967 bytes (+4615); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-intelligence-page.tsx` — 61882 → 61930 bytes (+48); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-knowledge-claims-page.tsx` — 23579 → 30591 bytes (+7012); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\admin-page.tsx` — 28434 → 29019 bytes (+585); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\contact-page.tsx` — 14766 → 14956 bytes (+190); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\cookbook-real-book-concept.tsx` — 11023 → 24094 bytes (+13071); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\dashboard.tsx` — 47498 → 47495 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\food-comparison-page.tsx` — 8420 → 13425 bytes (+5005); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\food-detail-page.tsx` — 16629 → 21187 bytes (+4558); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\food-diary-page.tsx` — 97662 → 94303 bytes (-3359); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\fridge-interaction-preview.tsx` — 17708 → 18424 bytes (+716); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\home-experience-page.tsx` — 57054 → 33537 bytes (-23517); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\home-page.tsx` — 10670 → 11754 bytes (+1084); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\invitation-page.tsx` — 8622 → 8618 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\larder-room.tsx` — 44722 → 45595 bytes (+873); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\living-home-room.css` — 32615 → 34272 bytes (+1657); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\living-home-room.tsx` — 33211 → 33261 bytes (+50); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\meals-page.tsx` — 347839 → 348624 bytes (+785); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\not-found.tsx` — 2897 → 2893 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\onboarding-page.tsx` — 41977 → 41980 bytes (+3); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\client__src__pages__onboarding-page.tsx.
- `client\src\pages\plant-diversity-page.tsx` — 8055 → 23981 bytes (+15926); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\privacy-settings-page.tsx` — 20854 → 21664 bytes (+810); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\products-page.tsx` — 117649 → 123467 bytes (+5818); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\profile-page.tsx` — 102551 → 110411 bytes (+7860); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\quick-meal-page.tsx` — 36360 → 36672 bytes (+312); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\shopping-workspace-page.tsx` — 178448 → 156246 bytes (-22202); contents differ. Old hash not found elsewhere in active.
- `client\src\pages\weekly-planner-page.tsx` — 241378 → 244910 bytes (+3532); contents differ. Old hash not found elsewhere in active.
- `docs\ai-operating-model\task-prompt-template.md` — 1614 → 1650 bytes (+36); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\GOVERNING_EXPERIENCE_ARCHITECTURE.md` — 97742 → 98623 bytes (+881); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\LIVING_HOME_VISUAL_REGISTRY.md` — 77754 → 78510 bytes (+756); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` — 62270 → 62534 bytes (+264); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\NK2_THA_NUTRITION_METHODOLOGY.md` — 39481 → 40019 bytes (+538); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\README.md` — 126200 → 127165 bytes (+965); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\REPOSITORY_CONVENTIONS.md` — 16162 → 17295 bytes (+1133); contents differ. Old version also exists at: docs\architecture\REPOSITORY_CONVENTIONS.md.pre-root-allowlist-fix-20261109T182833Z.bak.
- `docs\architecture\THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` — 33786 → 34165 bytes (+379); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\THA_EXPERIENCE_BLUEPRINT.md` — 60361 → 64188 bytes (+3827); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` — 46209 → 57480 bytes (+11271); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — 116040 → 116727 bytes (+687); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\capabilities\analyser.md` — 10070 → 12387 bytes (+2317); contents differ. Old hash not found elsewhere in active.
- `docs\architecture\capabilities\household.md` — 9459 → 10195 bytes (+736); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_FOCUS_20261105\docs__architecture__capabilities__household.md.
- `docs\architecture\capabilities\profile.md` — 5685 → 7029 bytes (+1344); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_FOCUS_20261105\docs__architecture__capabilities__profile.md.
- `docs\implementation\AI_WORK_HANDOFF.md` — 11193 → 5842 bytes (-5351); contents differ. Old hash not found elsewhere in active.
- `docs\implementation\COOKBOOK_REAL_BOOK_CONCEPT_RESPONSIVE_IMPLEMENTATION.md` — 2924 → 2955 bytes (+31); contents differ. Old hash not found elsewhere in active.
- `docs\implementation\assets\house-asset-register.json` — 12742 → 13668 bytes (+926); contents differ. Old version also exists at: docs\implementation\assets\house-asset-register.json.pre-HOMEEXT1-20261027-115335.bak.
- `docs\implementation\ux\ADOPTION_REGISTER.md` — 80418 → 83758 bytes (+3340); contents differ. Old hash not found elsewhere in active.
- `docs\implementation\ux\adoption-register.json` — 102107 → 105313 bytes (+3206); contents differ. Old version also exists at: docs\implementation\ux\adoption-register.json.pre-HOMEEXT1-20261027-123710.bak.
- `docs\intelligence\benchmark\history\index.json` — 65202 → 70626 bytes (+5424); contents differ. Old hash not found elsewhere in active.
- `docs\product\OWNERS.md` — 13292 → 13130 bytes (-162); contents differ. Old hash not found elsewhere in active.
- `docs\product\VISIBILITY.md` — 13250 → 13053 bytes (-197); contents differ. Old hash not found elsewhere in active.
- `docs\product\assets\glossary.md` — 9002 → 8691 bytes (-311); contents differ. Old hash not found elsewhere in active.
- `docs\product\assets\screenshots\manifest.json` — 3864 → 3854 bytes (-10); contents differ. Old hash not found elsewhere in active.
- `docs\product\connections\settings\set-companion-personality.md` — 1078 → 1074 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\companion-capabilities\cap-companion.md` — 2167 → 3679 bytes (+1512); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-analyser.md` — 1568 → 1588 bytes (+20); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-diary.md` — 1219 → 1235 bytes (+16); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-household.md` — 1466 → 1482 bytes (+16); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-meals.md` — 1364 → 1376 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-pantry.md` — 1222 → 1234 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-partners.md` — 1527 → 1539 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-planner.md` — 1398 → 1410 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-profile.md` — 1508 → 1520 bytes (+12); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\intelligence-capabilities\cap-shopping.md` — 1381 → 1397 bytes (+16); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\knowledge-capabilities\cap-nutrition-knowledge.md` — 3451 → 3947 bytes (+496); contents differ. Old hash not found elsewhere in active.
- `docs\product\intelligence\knowledge-capabilities\cap-product-knowledge.md` — 4179 → 4203 bytes (+24); contents differ. Old hash not found elsewhere in active.
- `docs\product\inventory\product.json` — 109722 → 109649 bytes (-73); contents differ. Old hash not found elsewhere in active.
- `docs\product\inventory\product.yaml` — 89532 → 92245 bytes (+2713); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-better-choices.md` — 974 → 971 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-build-habits.md` — 1941 → 1938 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-ethos.md` — 1236 → 1233 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-founding-story.md` — 1101 → 1098 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-hero.md` — 1206 → 1203 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\narrative\marketing-messages\mkt-scan-understand.md` — 1100 → 1097 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\domains\dom-admin.md` — 1387 → 1490 bytes (+103); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\domains\dom-cookbook.md` — 1534 → 1691 bytes (+157); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\docs__product__structure__domains__dom-cookbook.md.
- `docs\product\structure\domains\dom-diary.md` — 1218 → 1199 bytes (-19); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\domains\dom-home.md` — 1710 → 1709 bytes (-1); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\domains\dom-shopping.md` — 2018 → 1372 bytes (-646); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\domains\dom-shopping.md.
- `docs\product\structure\journeys\jrn-shop.md` — 2761 → 1736 bytes (-1025); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\journeys\jrn-shop.md.
- `docs\product\structure\pages\page-admin-knowledge-claims.md` — 2580 → 2797 bytes (+217); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-auth.md` — 1244 → 1241 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-basket.md` — 1526 → 923 bytes (-603); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\pages\page-basket.md.
- `docs\product\structure\pages\page-cookbook.md` — 1444 → 1409 bytes (-35); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\docs__product__structure__pages__page-cookbook.md.
- `docs\product\structure\pages\page-diary.md` — 1522 → 1419 bytes (-103); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-home.md` — 2308 → 2463 bytes (+155); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-not-found.md` — 1410 → 709 bytes (-701); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\pages\page-not-found.md.
- `docs\product\structure\pages\page-nutrition.md` — 1561 → 1636 bytes (+75); contents differ. Old hash not found elsewhere in active.
- `docs\product\structure\pages\page-pantry.md` — 1928 → 1871 bytes (-57); contents differ. Old version also exists at: .engineering\session\rollback-evidence\LARDER_ROUTE1_REMOVE_REDIRECT_20261105\docs\product\structure\pages\page-pantry.md.
- `docs\product\structure\pages\page-profile.md` — 1627 → 1709 bytes (+82); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_FOCUS_20261105\docs__product__structure__pages__page-profile.md.
- `docs\product\structure\pages\page-shopping-workspace.md` — 1901 → 1276 bytes (-625); contents differ. Old version also exists at: .engineering\session\rollback-evidence\SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105\docs\product\structure\pages\page-shopping-workspace.md.
- `docs\product\structure\routes\routes-map.md` — 7924 → 4092 bytes (-3832); contents differ. Old hash not found elsewhere in active.
- `docs\product\surfaces\admin\adm-home.md` — 1189 → 1267 bytes (+78); contents differ. Old hash not found elsewhere in active.
- `docs\product\surfaces\admin\adm-knowledge-claims.md` — 2696 → 2934 bytes (+238); contents differ. Old hash not found elsewhere in active.
- `docs\product\surfaces\hidden\hid-routing-telemetry.md` — 3114 → 3110 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\afi1-capture-ambient-screenshots.ts` — 5972 → 5968 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\afi2-capture-ambient-screenshots.ts` — 5937 → 5933 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\afi35-capture-ambient-screenshots.ts` — 13077 → 13069 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-arrival1-home.ts` — 5498 → 5486 bytes (-12); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-expadopt1-adoption.ts` — 3974 → 3967 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-intarch1-interior-architecture.ts` — 5232 → 5225 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-intarch2-material-surfaces.ts` — 6407 → 6400 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-nav1-application-shell.ts` — 5913 → 5905 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-north1-home.ts` — 6096 → 6084 bytes (-12); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-north2-home.ts` — 5582 → 5566 bytes (-16); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-north3-home.ts` — 5346 → 5330 bytes (-16); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-odl1-home.ts` — 2177 → 2169 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-product-screenshots.ts` — 6142 → 6135 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-ux-evidence.ts` — 33473 → 33410 bytes (-63); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-ux2-experience-language.ts` — 4511 → 4500 bytes (-11); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-ux3-experience-convergence.ts` — 6258 → 6243 bytes (-15); contents differ. Old hash not found elsewhere in active.
- `scripts\capture-uxnav1-orchard-navigation.ts` — 5403 → 5396 bytes (-7); contents differ. Old hash not found elsewhere in active.
- `scripts\experience-verify1-capture-rooms.ts` — 9031 → 9012 bytes (-19); contents differ. Old hash not found elsewhere in active.
- `scripts\mat1-capture-maturity-screenshots.ts` — 16520 → 16512 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `scripts\prod1-capture-product-completion.ts` — 14556 → 14540 bytes (-16); contents differ. Old hash not found elsewhere in active.
- `scripts\seed-default-pantry-food.ts` — 880 → 776 bytes (-104); contents differ. Old hash not found elsewhere in active.
- `scripts\ux-refine1-verify-shell.ts` — 7876 → 7872 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `scripts\ux2-verify-experience-language.ts` — 11791 → 11776 bytes (-15); contents differ. Old hash not found elsewhere in active.
- `scripts\ux3-verify-experience-convergence.ts` — 9154 → 9143 bytes (-11); contents differ. Old hash not found elsewhere in active.
- `scripts\ci\typecheck-baseline.json` — 377 → 4139 bytes (+3762); contents differ. Old hash not found elsewhere in active.
- `scripts\ci\typecheck-gate.ts` — 10413 → 10692 bytes (+279); contents differ. Old hash not found elsewhere in active.
- `scripts\ci\verify-release-packaging.ts` — 13164 → 13120 bytes (-44); contents differ. Old hash not found elsewhere in active.
- `server\auth.ts` — 31651 → 31521 bytes (-130); contents differ. Old hash not found elsewhere in active.
- `server\db.ts` — 1372 → 3223 bytes (+1851); contents differ. Old hash not found elsewhere in active.
- `server\index.ts` — 10880 → 9600 bytes (-1280); contents differ. Old hash not found elsewhere in active.
- `server\routes.ts` — 673027 → 695822 bytes (+22795); contents differ. Old hash not found elsewhere in active.
- `server\storage.ts` — 210354 → 216810 bytes (+6456); contents differ. Old hash not found elsewhere in active.
- `server\trust-routes.ts` — 15087 → 16091 bytes (+1004); contents differ. Old hash not found elsewhere in active.
- `server\benchmark\world-fixtures.ts` — 88713 → 89409 bytes (+696); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\capability-registry.ts` — 57854 → 58106 bytes (+252); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\intent-resolver.ts` — 6677 → 8166 bytes (+1489); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\pattern-intent-resolver.ts` — 146091 → 161672 bytes (+15581); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\pattern-intent-resolver.ts.
- `server\intelligence\README.md` — 45197 → 44148 bytes (-1049); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\bindings\household.ts` — 2511 → 2346 bytes (-165); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\bindings\profile.ts` — 2377 → 2316 bytes (-61); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\context\context-view.ts` — 41015 → 43983 bytes (+2968); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\action-language.ts` — 20033 → 22479 bytes (+2446); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\action-resolution.ts` — 29210 → 34831 bytes (+5621); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\companion-action-store.ts` — 9831 → 10232 bytes (+401); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\conversation-gateway.ts` — 85682 → 93999 bytes (+8317); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\native-discovery.ts` — 15526 → 15543 bytes (+17); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\notice-engine.ts` — 29082 → 31029 bytes (+1947); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\conversation\personality-registry.ts` — 32326 → 32380 bytes (+54); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\food-intelligence\comparison-engine.ts` — 31251 → 49309 bytes (+18058); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\food-intelligence\engine.ts` — 18155 → 18169 bytes (+14); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\food-intelligence\opportunity-engine.ts` — 72120 → 72853 bytes (+733); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\household-discovery-handler.ts` — 2609 → 2610 bytes (+1); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\household-read-handler.ts` — 10136 → 13148 bytes (+3012); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\household-read-port.ts` — 3783 → 4471 bytes (+688); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\nutrition-discovery-port.ts` — 4241 → 4569 bytes (+328); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\nutrition-discovery-port.ts.
- `server\intelligence\handlers\opportunity-delivery-handler.ts` — 14437 → 15384 bytes (+947); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\opportunity-delivery-read-port.ts` — 2815 → 3215 bytes (+400); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\planner-read-handler.ts` — 14831 → 18912 bytes (+4081); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\planner-read-port.ts` — 8495 → 9364 bytes (+869); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\profile-read-handler.ts` — 13687 → 16252 bytes (+2565); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\profile-read-port.ts` — 2710 → 3700 bytes (+990); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\shopping-discovery-port.ts` — 3537 → 3254 bytes (-283); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\handlers\shopping-read-handler.ts` — 16827 → 17351 bytes (+524); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\opportunity-delivery\delivery-store.ts` — 9882 → 11579 bytes (+1697); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\opportunity-delivery\framework.ts` — 50430 → 54295 bytes (+3865); contents differ. Old hash not found elsewhere in active.
- `server\intelligence\services\nutrition-discovery-engine.ts` — 10365 → 12243 bytes (+1878); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\nutrition-discovery-engine.ts.
- `server\intelligence\services\shopping-discovery-engine.ts` — 3268 → 3277 bytes (+9); contents differ. Old hash not found elsewhere in active.
- `server\lib\food-intelligence-assembler.ts` — 20126 → 26436 bytes (+6310); contents differ. Old hash not found elsewhere in active.
- `server\lib\food-report-evidence.ts` — 4095 → 4553 bytes (+458); contents differ. Old hash not found elsewhere in active.
- `server\lib\knowledge-claim-review-store.ts` — 20189 → 32641 bytes (+12452); contents differ. Old hash not found elsewhere in active.
- `server\lib\meal-service.ts` — 11435 → 11693 bytes (+258); contents differ. Old hash not found elsewhere in active.
- `server\lib\nutrition-centre-assembler.ts` — 12903 → 15742 bytes (+2839); contents differ. Old hash not found elsewhere in active.
- `server\lib\product-event-logger.ts` — 6459 → 6586 bytes (+127); contents differ. Old hash not found elsewhere in active.
- `server\lib\routing.ts` — 3869 → 3802 bytes (-67); contents differ. Old hash not found elsewhere in active.
- `server\lib\uplift-rules.ts` — 41850 → 45790 bytes (+3940); contents differ. Old hash not found elsewhere in active.
- `server\lib\usda-whole-food-service.ts` — 3179 → 14156 bytes (+10977); contents differ. Old hash not found elsewhere in active.
- `server\migrations\runner.ts` — 193332 → 195838 bytes (+2506); contents differ. Old hash not found elsewhere in active.
- `server\privacy\personal-data-registry.ts` — 45317 → 46747 bytes (+1430); contents differ. Old hash not found elsewhere in active.
- `server\scripts\query-investigation.ts` — 3316 → 3313 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `server\scripts\query-user1-meals.ts` — 1901 → 1898 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `server\services\nutrition-knowledge-registry.ts` — 47846 → 56959 bytes (+9113); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-cbk2-intelligent-cookbook.ts` — 5569 → 11741 bytes (+6172); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-comp1-food-comparison.ts` — 21771 → 29170 bytes (+7399); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-household-vegan-vegetarian-hard-enforcement.ts` — 24285 → 23611 bytes (-674); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-companion-card.ts` — 10519 → 10526 bytes (+7); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\server__tests__test-intelligence-companion-card.ts.
- `server\tests\test-intelligence-compound-resolver.ts` — 23542 → 23539 bytes (-3); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-context-composition.ts` — 59446 → 60928 bytes (+1482); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-diary-discovery-binding.ts` — 11266 → 11258 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-food-intelligence-binding.ts` — 15712 → 15419 bytes (-293); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-household-binding.ts` — 20443 → 20590 bytes (+147); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-household-discovery-binding.ts` — 15289 → 15281 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-meals-binding.ts` — 23043 → 22756 bytes (-287); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-native-discovery.ts` — 19618 → 20670 bytes (+1052); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-nutrition-discovery-binding.ts` — 23810 → 27509 bytes (+3699); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\test-intelligence-nutrition-discovery-binding.ts.
- `server\tests\test-intelligence-nutrition-knowledge-binding.ts` — 18994 → 19017 bytes (+23); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-pantry-discovery-binding.ts` — 11739 → 11731 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-planner-binding.ts` — 18342 → 23800 bytes (+5458); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-planner-discovery-binding.ts` — 13108 → 13100 bytes (-8); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-shopping-binding.ts` — 18152 → 18721 bytes (+569); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intelligence-shopping-discovery-binding.ts` — 13148 → 13715 bytes (+567); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-intent-resolver-routing-attribution.ts` — 16997 → 17308 bytes (+311); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COMPANION_NUTRITION_20261104\test-intent-resolver-routing-attribution.ts.
- `server\tests\test-intent-resolver.ts` — 26310 → 29725 bytes (+3415); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-pantry1-intelligent-pantry.ts` — 2255 → 10759 bytes (+8504); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-plan2-planner-evolution.ts` — 1623 → 3529 bytes (+1906); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-prod3-companion-restriction-safety.ts` — 17135 → 17885 bytes (+750); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-prod6-safety-gate-convergence.ts` — 37166 → 37100 bytes (-66); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-slot-filling-recovery.ts` — 14376 → 13683 bytes (-693); contents differ. Old hash not found elsewhere in active.
- `server\tests\test-tier4-shell-recovery-activation.ts` — 24984 → 24310 bytes (-674); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\aggregate.ts` — 33287 → 36112 bytes (+2825); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\expectations.ts` — 19690 → 19843 bytes (+153); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\index.ts` — 1799 → 1818 bytes (+19); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\report.ts` — 33549 → 34029 bytes (+480); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\runner.ts` — 13205 → 14141 bytes (+936); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\scorer.ts` — 28971 → 32970 bytes (+3999); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\types.ts` — 30246 → 33405 bytes (+3159); contents differ. Old hash not found elsewhere in active.
- `server\tests\benchmark\fixtures\companion-benchmark-100.v1.json` — 89473 → 89469 bytes (-4); contents differ. Old hash not found elsewhere in active.
- `server\tests\context-composition\engine.ts` — 9308 → 9241 bytes (-67); contents differ. Old hash not found elsewhere in active.
- `server\verification\publication-register.ts` — 126746 → 129662 bytes (+2916); contents differ. Old hash not found elsewhere in active.
- `shared\ingredient-aliases.ts` — 19947 → 20728 bytes (+781); contents differ. Old hash not found elsewhere in active.
- `shared\normalize.ts` — 1898 → 1919 bytes (+21); contents differ. Old hash not found elsewhere in active.
- `shared\schema.ts` — 189487 → 193143 bytes (+3656); contents differ. Old hash not found elsewhere in active.
- `shared\canonical\food-report-adapter.ts` — 9502 → 11889 bytes (+2387); contents differ. Old hash not found elsewhere in active.
- `shared\catalogue\alias-resolver.ts` — 5439 → 5616 bytes (+177); contents differ. Old hash not found elsewhere in active.
- `shared\catalogue\name-normaliser.ts` — 9931 → 11489 bytes (+1558); contents differ. Old hash not found elsewhere in active.
- `shared\knowledge\evidence.ts` — 16697 → 18187 bytes (+1490); contents differ. Old hash not found elsewhere in active.
- `shared\legal\documents\privacy-policy.ts` — 17467 → 17797 bytes (+330); contents differ. Old hash not found elsewhere in active.
- `shared\privacy\consent.ts` — 6764 → 7030 bytes (+266); contents differ. Old hash not found elsewhere in active.
- `shared\support\help-centre.ts` — 41061 → 41060 bytes (-1); contents differ. Old version also exists at: .engineering\session\rollback-evidence\COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105\pre-edit\shared__support__help-centre.ts.

### Active-only paths

Counts are in the summary. These are paths absent by the same relative path in the old folder; the same content may be present there at another path.

## Living Larder committed history

One commit follows the local history boundary `53c12f4661f64bd583df58ab05954f7ea6684270`:
- `19d2ac01d9a79240fc29b0ac04e638ad5e71eee5` (2026-09-02): documents `NODE_ENV=development` as the local-development expectation in `.env.example`.
The active HEAD object is absent from this clone, so cross-clone ancestry was not directly verified locally.

## Recommendations

- **Meal-Ingredients-Planner:** review the 198 unique files, especially dashboard/planner/shopping workflow source and tests, before discarding; 519 paths are exact-content relocations.
- **tha-integrated-dev:** review its one unique page spec and changed implementation; the three cookbook docs are in active.
- **tha-integrated-dev-staging-20260927:** same unique/relocated split; review page spec and changed implementation.
- **tha-living-larder-authoritative:** preserve pending review of 53 unique files and divergent history; three paths match content in active elsewhere.

No source file in the active repo or four old folders was modified; no delete, merge, port, commit, service, database, task, or config operation occurred. Only this report was regenerated.




## Cross-folder collision and restore-path checks (2026-11-12)

This section cross-checks the 253 entries in the four **Genuinely unique old files** lists above against each other and against active paths. Generated root `.tha-*.txt` outputs remain excluded.

### Part A — collisions between old folders

Checked both exact relative paths and basenames across all folder pairs. There is one relative path shared by three folders, yielding three pairwise comparisons:

| Folder pair | Shared relative path | SHA-256 verdict |
|---|---|---|
| tha-integrated-dev ↔ tha-integrated-dev-staging-20260927 | `docs\product\structure\pages\page-landing.md` | **IDENTICAL** (`FCD3330C22BF91D87D7C0AAA19B8DA3ECB43F667AB258ADF948AFC3E7B3D34D9`) |
| tha-integrated-dev ↔ tha-living-larder-authoritative | `docs\product\structure\pages\page-landing.md` | **IDENTICAL** (`FCD3330C22BF91D87D7C0AAA19B8DA3ECB43F667AB258ADF948AFC3E7B3D34D9`) |
| tha-integrated-dev-staging-20260927 ↔ tha-living-larder-authoritative | `docs\product\structure\pages\page-landing.md` | **IDENTICAL** (`FCD3330C22BF91D87D7C0AAA19B8DA3ECB43F667AB258ADF948AFC3E7B3D34D9`) |

There are **no different-content conflicts** at a shared path and **no additional basename-only collisions** at different relative paths among the 253 files. The page spec occurs in three old folders but has one identical byte sequence; it is not a choose-one conflict.

### Part B — active destination path occupancy

Each of the 253 unique files was checked with a direct active-tree `Test-Path -PathType Leaf` at its own relative path. Every destination path is absent. Thus all are clean additions by path; no restoration would overwrite an existing active file. The complete clean-addition set for each folder is the corresponding exhaustive **Genuinely unique old files** list above.

| Old folder | Clean additions | Path occupied | Path-occupied files |
|---|---:|---:|---|
| Meal-Ingredients-Planner | 198 | 0 | **NONE** |
| tha-integrated-dev | 1 | 0 | **NONE** |
| tha-integrated-dev-staging-20260927 | 1 | 0 | **NONE** |
| tha-living-larder-authoritative | 53 | 0 | **NONE** |

A clean addition here means the target path is vacant in active; it does not assert that the old file is desirable or should be restored.

### Independent verification samples

**Part A identical verdicts:** all three reported pairwise collisions were independently re-hashed directly from both old folders. Each yielded SHA-256 `FCD3330C22BF91D87D7C0AAA19B8DA3ECB43F667AB258ADF948AFC3E7B3D34D9`:
- `tha-integrated-dev` ↔ `tha-integrated-dev-staging-20260927`: identical.
- `tha-integrated-dev` ↔ `tha-living-larder-authoritative`: identical.
- `tha-integrated-dev-staging-20260927` ↔ `tha-living-larder-authoritative`: identical.

**Part B clean additions:** three sample target paths were independently checked with direct `Test-Path`; all returned false, and the old files were directly re-hashed:
- `Meal-Ingredients-Planner\INGREDIENT_IMAGERY_INFRASTRUCTURE_IMPLEMENTATION.md` — target absent; old SHA-256 `DB0E18241B71B7C86646D29B40033D201E7E08FF0429A8190D3BAE2DB320661C`.
- `tha-integrated-dev\docs\product\structure\pages\page-landing.md` — target absent; old SHA-256 `FCD3330C22BF91D87D7C0AAA19B8DA3ECB43F667AB258ADF948AFC3E7B3D34D9`.
- `tha-living-larder-authoritative\Create-THA-Shortcuts.ps1` — target absent; old SHA-256 `6FD3F40D4ADD57EE207E04F458C2E0A5A382486A0DE3559151EF2347A8C05432`.

The four folder counts reconcile to 253 (198 + 1 + 1 + 53). No files were copied, moved, merged, deleted, or edited in the active tree or any old folder.
## Content-level assessment (2026-11-12)

### Scope and evidence note

This appendix records content-level review of the unique source files and representative investigation documents opened during this pass. It does not claim a verdict for files whose content was not successfully inspected in this pass; where a document is only a short pointer/summary, the verdict is limited to that summary. Source verdicts are per file except where tests are explicitly grouped with the component they exercise. No source file or asset was changed. Comparison target is the active working tree at `tha-integrated-dev-g-native-20261003`, HEAD `4cf1ea4f2d130171441ef88f06515037c1f947fb`.

### Meal-Ingredients-Planner — source code

**Dashboard / plan and shopping review**

- `client/src/components/dashboard-next-step-card.tsx` — Finished, tested four-state routing (basket, current plan, saved recipes, cookbook); active Dashboard already presents Cookbook/Basket/weekly-plan entry points, so the card is a modest navigation convenience rather than missing capability. Low rescue priority.
- `client/src/components/dashboard-next-step-card.test.tsx` — Covers all four routing branches and accessible link rendering; useful only with that component; no independent feature.
- `client/src/components/dashboard-plan-meal-card.tsx` — Finished quick-add form posts to the active-compatible `/api/planner/days/:id/items` contract and reports a truthful handoff. The helper selects `plannerWeeks[0]`; active Dashboard uses an explicit current-week hook, so direct reuse requires week-selection adaptation. Active Dashboard currently links to Planner without this quick-add flow. Distinct convenience feature, worth considering.
- `client/src/components/dashboard-plan-meal-card.test.ts` — Verifies weekday sorting, malformed input handling, and position computation excluding child/drink entries; supports a potentially useful but non-essential quick-add feature.
- `client/src/components/dashboard-plan-shopping-handoff.tsx` — Finished, neutral confirmation/link to review the plan; depends on the quick-add flow and adds no standalone behavior.
- `client/src/components/dashboard-plan-shopping-handoff.test.tsx` — Confirms handoff text/link rendering; component support only.
- `client/src/lib/dashboard-plan-shopping-handoff.ts` — Small pure builder for meal/day/slot handoff copy; useful only with the quick-add feature.
- `client/src/lib/dashboard-plan-shopping-handoff.test.ts` — Exercises that builder’s output; no separate capability.
- `client/src/components/plan-to-shopping-review-dialog.tsx` — Finished explicit review/cancel/confirm dialog before shopping write. The active weekly planner’s `addAllToBasket` invokes `generateFromMeals` directly, and no equivalent review-dialog source exists in the active tree. This is a meaningful user-consent step and is the strongest Meal Planner rescue candidate.
- `client/src/lib/plan-to-shopping-review-model.ts` — Finished Monday-first read model preserving duplicate meals, identifying unavailable saved meals, and showing exact ingredient-name pantry overlaps without claiming quantity/suitability. It supports the missing review step; active planner currently has direct send actions.
- `client/src/lib/plan-to-shopping-review-model.test.ts` — Tests ordering, missing meals, duplicate preservation and conservative pantry matching; retain only if the review flow is pursued.
- `client/src/components/weekly-plan-review-card.tsx` — Finished collapsible display of planned meals and household preferences; active weekly planner already shows meals and week-specific soft-preference overrides while preserving hard restrictions. Mostly duplicated presentation; the distinct pre-shopping consent dialog is the valuable part.
- `client/src/lib/weekly-plan-review-model.ts` — Pure read model for the same review card; active planner owns its current plan presentation, so this is not independently missing capability.
- `client/src/lib/weekly-plan-review-model.test.ts` — Tests the old review projection; low rescue priority absent the card.
- `client/src/components/household-diet-intent-review.tsx` — Clear explanatory labels distinguish flexible diet preferences from hard restrictions and state that the UI does not verify product labels/cross-contact. Active planner retains this distinction, but the old profile-specific explanatory panel was not found by exact component search; worth reviewing alongside the profile flow, not enough evidence to rescue standalone.
- `client/src/components/household-diet-intent-review.test.tsx` — Render assertions for that explanatory distinction; support file only.

**Intelligence, nutrition, and shared presentation**

- `client/src/components/PlannerIntelligenceCompanion.tsx` — Finished fetch-and-render companion for `/api/planner/weeks/:weekId/intelligence`; active code explicitly says `PlannerIntelligenceStrip` replaces the old companion and shares its query key. Superseded.
- `client/src/components/HomeIntelligenceCompanion.tsx` — Optional-data home companion; active Dashboard has its own intelligence/cards pipeline. Its old endpoint and specific content were not established as a missing capability; no rescue verdict beyond likely superseded.
- `client/src/components/HealthTrendChart.tsx` — Complete period-selecting chart that requests `/api/user/health-trends`; no matching active endpoint/component was found in this pass. A route/data-owner check is required before treating it as a real rescuable feature; not on shortlist.
- `client/src/components/NutritionBoostPanel.tsx` — Real display panel uses restriction-safety and diet-rule helpers, but suggestion source is the old static `nutrition-boosts.ts`; active meal detail has the canonical Meal Uplift/food-intelligence path. Superseded by the more actionable current approach.
- `client/src/lib/nutrition-boosts.ts` — Static keyword/name-based ingredient suggestion catalog; no authoritative food knowledge source and no persistence. Old heuristic experiment, not safe to reinstate.
- `client/src/components/meal-detail/SimplyBetterChoicesPanel.tsx` — Component source contains inert Add/Remove controls and hard-coded “Already used this week”; layout class is assembled from a token that produces invalid Tailwind utility names. Half-finished experiment; do not rescue.
- `client/src/components/intelligence/SimplyBetterChoiceCard.tsx` — Presentational wrapper for a validated suggestion; the incomplete panel above leaves no working consumer. No independent capability.
- `client/src/components/intelligence/CelebrationCard.tsx` — Thin presentation wrapper over shared IntelligenceCard; active repo has newer intelligence presentation system. Superseded wrapper.
- `client/src/components/intelligence/OpportunityCard.tsx` — Thin presentation wrapper; active opportunity delivery/strip owns this concept. Superseded wrapper.
- `client/src/components/RankModeSelector.tsx` — Finished selector for old analyser ranking modes, with old icon assets. Active basket/product analysis uses its current ranking contract; migration would need API/type adaptation. Not a distinct capability proven missing.
- `client/src/components/BadAppleWarningModal.tsx` — Finished modal, but its strong “Highly Ultra-Processed” and “high-risk” copy is driven by supplied scores; active product classification/warning flow has evolved. Avoid rescuing without current evidence/copy review.
- `client/src/components/first-visit-hint.tsx` — Dismissible localStorage hint, finished but generic and state-local; no distinct enduring product capability.
- `client/src/components/PageHeader.tsx` — Large configurable collapsing header predates the active canonical WorkspaceHeader/shell. Superseded shell experiment.
- `client/src/components/tha-bridge-evidence-panel.tsx` — Read-only mock adapter panel; adapter explicitly fixes writes/delegation off and uses local fixture data. Useful prototype evidence only, not a live Bridge integration. `tha-bridge-evidence-panel.test.tsx` checks mock rendering and filename filtering; neither should be treated as production integration.
- `client/src/lib/tha-bridge-adapter.ts` — Explicitly mock-only, with no network implementation and write/delegation hard-disabled. Prototype, not recoverable live capability. `client/src/lib/tha-bridge-adapter.test.ts` verifies those mock constraints.

**Other application code**

- `shared/planner-week-copy.ts` — Finished pure previous-week planner copy policy; matches target weekdays, orders entries, preserves entry fields, and skips an occupied target slot rather than overwriting it. Active planner has “duplicate this meal” behavior but no equivalent whole-week copy function found. Potentially useful distinct capability, but requires owner review of exact occupied-slot semantics before rescue.
- `server/tests/test-planner-week-copy.ts` — Meaningful tests cover occupied-slot preservation, missing weekdays, drinks/children, and full entry data preservation; only useful with the helper/route that would call it.
- `client/src/components/scan-confirm-dialog.tsx` — Real scan/import UI, but its meal-plan import path uses best-effort per-item catches and may create empty meals; it does not preserve imported slots reliably. Defect-prone older importer; do not rescue as-is.
- `client/src/pages/list-page.tsx` — Complete local quick-list workflow with pending ingredient entry/history and API submission; active basket/shopping experience has since centralized list state. Old route/page, likely superseded; no distinct data owner identified.
- `client/src/pages/pantry-page.tsx` — Complete older pantry page tied to `pantry_items` and old PantryKnowledgeHub/IntelligencePanel pieces. Active repo has the newer Pantry/Living Larder experience. Superseded page, not a safe wholesale rescue.
- `client/src/components/ShoppingListView.tsx` — Large (3,517-line) legacy shopping UI with retailer/session/product-match state and dependencies on old analyser and basket modules. Active `shopping-workspace-page.tsx` is the current owner; wholesale rescue would duplicate state and workflows.
- `client/src/pages/shopping-list-page.tsx` — Large (4,251-line) legacy page importing old shopping/pantry/analyser modules; active shopping workspace replaces it. Superseded.
- `server/meal-resolution-service.ts` — Finished scoring service, but weights and “unknown UPF assumed moderate” are hand-coded heuristics. Conflicts with current canonical food-intelligence ownership; do not rescue.
- `server/lib/recommendation-service.ts` — Keyword/category diet screening and goal scoring duplicates canonical restriction/food-intelligence logic and can yield broad false matches. Superseded, unsafe to restore.
- `server/template-migration.ts` — Data-writing backfill that creates templates and rewrites meal/planner links; old schema approach and must not be run or ported without a governed migration review.
- `server/migrations/ensureUserDietColumns.ts` — Executes production `ALTER TABLE users` statements for old columns. Schema risk and obsolete preference shape; do not rescue.
- `server/email.ts` — Nodemailer mail transport implementation; active email route/config ownership was not established in this pass. No rescue recommendation without checking current mail subsystem and secret/config contract.
- `scripts/migrate-prod.sh` — Production migration shell entry point; operationally sensitive and not a feature. No rescue without current migration workflow check.
- `client/src/hooks/use-mobile.tsx` — Thin legacy wrapper around adaptive-density state; active design system has its own responsive hooks. No unique capability established.
- `client/src/components/ui/accordion.tsx`, `alert.tsx`, `apple-rating.tsx`, `aspect-ratio.tsx`, `breadcrumb.tsx`, `calendar.tsx`, `carousel.tsx`, `chart.tsx`, `command.tsx`, `context-menu.tsx`, `hover-card.tsx`, `input-otp.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `radio-group.tsx`, `resizable.tsx`, `score-badge.tsx`, `scroll-area.tsx`, `sidebar.tsx`, `slider.tsx`, `toggle-group.tsx` — These are generic Radix/shadcn-style primitives or wrappers, not THA-specific features. The active UI tree has its current primitive set; rescue only an exact missing dependency if a selected feature is separately approved. `sidebar.tsx` is a generic stateful primitive, not a product behavior candidate.

### Meal-Ingredients-Planner — investigation/document groups

The old docs are dated mostly June 8–28 and many are short status extracts pointing to longer reports. The following conclusions are directly supported by the opened file bodies and active-tree references:

- **Plant diversity/30 Plants** (`PLANT_DIVERSITY_*`, `THIRTY_PLANTS_THIS_WEEK_COPY_REFRESH.md`, `COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md`, `THA_30_PLANTS_*`) — describe a real implemented explorer, canonical grouping/counter fixes, category suggestions, and a report redesign. Active planner now has a consolidated `PlannerIntelligenceStrip` and a separate Nutrition Report architecture. The June implementation notes are historical; no unique source code here to restore. The very large design documents contain additional target-state ideas and should be retained only if those open decisions are still being pursued.
- **Meal enhancement / weekly reuse** (`MEAL_ENHANCEMENT_*`, `NUTRITION_BOOST_*`, `MEAL_VARIETY_NUDGE_RETIREMENT.md`, `MEAL_DIALOG_INFORMATION_DENSITY_REDUCTION.md`) — documents explain that NutritionBoost and variety nudges were informational/context-blind, MealUplift was actionable, and records later fixes. Active code now uses Meal Uplift and canonical food intelligence. Old static boost/variety experiments are superseded; the dated reports are historical evidence, not implementation requests.
- **2026-10-17 planner/shopping review** (`DASHBOARD_*_20261017.md`, `HOUSEHOLD_DIET_INTENT_REVIEW_20261017.md`, `PANTRY_OVERLAP_PLAN_REVIEW_20261017.md`, `PLAN_TO_SHOPPING_REVIEW_IMPLEMENTATION_20261017.md`, `WEEKLY_PLAN_REVIEW_IMPLEMENTATION_20261017.md`) — records a finished, tested review-before-write step and dashboard quick-add, with manual UI acceptance still pending in those reports. Active planner still sends the week directly to shopping; the review dialog/model are absent. This is the clearest unresolved user-flow thread and supports the rescue shortlist below.
- **Household compatibility phases** (`HOUSEHOLD_COMPATIBILITY_*`, `PROFILE_SAVE_DIET_RESTRICTIONS_VALIDATION_FIX.md`, `DIETARY_LABEL_DISPLAY_NORMALISATION_FIX.md`) — describe migration from soft diet intent toward canonical household eaters/hard restrictions, plus resolver/ranking work. Active weekly planner explicitly preserves hard restrictions while allowing week-level soft overrides; the old phase docs are historical against that active flow. No phase code should be restored independently.
- **Food intelligence, canonical reports and nutrition knowledge** (`WS0*`, `WS2*`, `WS3A*`, `WS4B*`, `WS6*`, `M1–M6`, `NUTRITION_KNOWLEDGE_*`, `WEEKLY_NUTRITION_*`, `THA_PERSONALISED_NUTRITION_*`) — these documents describe a long investigation/implementation lineage toward one canonical food report and trusted knowledge pipeline. Active repo contains food intelligence, canonical food/report and opportunity architecture, so their implemented foundations are reflected. Investigation-only decisions and future editorial pipeline proposals are not themselves proof of an active open task; keep as historical design rationale, not code to restore.
- **Shell/header and workspace presentation** (`WX9_5*`, `WS9_5*`, `WX10E*`, `WX10F*`, `WX11*`, `WX14A*`, `THA_ADAPTIVE_DENSITY_FOUNDATION.md`, `STARTER_SHELL_EXISTING_TEMPLATE_ENRICHMENT.md`) — documents show the header/shell standard was implemented and then refined; active app has the canonical WorkspaceHeader and current shell. Older PageHeader/sidebar/UI pieces are superseded.
- **Planner history, meal recovery, launch/readiness and architecture audits** (`PLANNER_ARCHIVE_*`, `PLANNER_HISTORY_*`, `COMPONENT_MEAL_RECOVERY_*`, `PLANNER_GENERATION_PATH_*`, `SMART_PLANNER_*`, `TIER4_*`, `THA_*AUDIT*`, `THA_LAUNCH_*`, `THA_SOURCE_OF_TRUTH_*`, `PRESERVE_SINCE_LAST_PRODUCTION_CHECKPOINT.md`, `PUSH_PRESERVATION_REMOTE_BACKUP.md`, `current_dev_status.md`) — these are dated evidence, status snapshots, or deferred/red decisions rather than standalone implemented features. Do not treat old status as current. Re-open only a specifically named unresolved decision before acting.
- **Imagery** (`INGREDIENT_IMAGERY_*`, `PANTRY_ASSETS_PHASE_1_*`, `PANTRY_ROOT_CAUSE_INVESTIGATION.md`) — implementation summary states the ingredient image lookup maps were empty and returned emoji fallbacks; old ingredient assets are not evidence of use by the active UI. The active image/food asset owner should be checked before any asset rescue.

### Meal-Ingredients-Planner — binary assets

The two unique icon PNGs and 17 ingredient WebP files are not automatically valuable because their filenames resemble active ingredients. No active reference to these exact old asset paths was found during this pass; the old imagery implementation summary says the lookup maps were empty. Treat as historical candidate assets, not active dependencies. A complete asset-pipeline scan remains required before deleting them.

### tha-living-larder-authoritative — source assessment

- `scripts/preflight-env.ts` and `scripts/test-preflight-env.ts` implement and test an offline, fail-closed `.env` presence/key-name check that never prints values. The active repo’s app is not this Larder runtime, so this is useful operational tooling only if that runtime remains in use; not a missing integrated-app feature.
- `server/lib/database-identity.ts` plus `server/tests/test-database-identity-sanitized.ts` provide bounded host/database logging without credentials; plausible reusable privacy-safe utility, but ownership belongs with the Larder’s startup path and active app integration is unproven.
- `server/lib/sanitized-error.ts` plus `server/tests/test-sanitized-error.ts` classify thrown errors to fixed literals, avoiding `.name`/`.message` leakage; real, carefully tested safety utility for the Larder runtime, but not an active integrated-app dependency.
- `server/lib/pantry-sync-report.ts` plus `server/tests/test-pantry-sync-report.ts` implement bounded aggregate counts for startup pantry-default sync; real operational privacy control, but specific to Larder startup and not shown used by the active app.
- `server/lib/runtime-bind.ts` plus `server/tests/test-runtime-bind-host.ts` choose only `0.0.0.0` or loopback and reject other values; small finished Larder host-binding utility, not an active app requirement established here.
- `server/tests/test-fresh-migration-order.ts` checks a repository-specific migration ordering contract. It is a useful regression check only if the Larder migration runner remains in service; it does not imply its migrations should be ported.
- `server/intelligence/opportunity-delivery/surface-selection.ts` — unique implementation file; its production integration and current active equivalent were not established from the portion inspected. No rescue verdict without an import/consumer and contract check.
- `scripts/tha-*.ps1`, `tha.ps1`, `tha.cmd`, `Install-THA.ps1`, `Create-THA-Shortcuts.ps1`, and `start-dev.bat` are a substantial Windows operator workflow (start/stop/status/doctor/clean, transcript, shortcuts, installation checks), not application features. Keep only if this authoritative Larder checkout still owns the local runtime; they are not portable application code.
- `ops-console/server.mjs`, `ops-console/public/app.js`, `index.html`, `styles.css` form a finished operator dashboard. The server explicitly delegates all status/readiness truth to the existing PowerShell scripts and binds to loopback; its frontend polls and renders those reports. This is distinct tooling if the old Larder operator workflow remains in service, but not evidence for restoring app capabilities into the active integrated repo.
- `config/tha-*.json` and `.codex/hooks.json` are runtime/repository configuration, not feature assets. They were not inspected for values here; preserve no content based on filename alone and do not copy credentials/config between repos.
- `docs/THA-OPERATIONS.md`, `docs/product/structure/pages/page-landing.md`, and the two dated `package.json` snapshots are historical/operator or backup files. They are not current implementation sources; re-check only if a specific operational process still depends on them.
- The reconciliation markdown files are historical comparison evidence, not runtime features. Review their status against current repo state before relying on them.

### tha-living-larder-authoritative — assets and commit 19d2ac01

The unique `ops-console/public/repository-review/**` PNG/JPG/WebP assets are screenshot/contact-sheet review artifacts. `ops-console/public/app.js` serves a repository-review surface, but this pass did not establish a runtime reference for every image path or whether the active app consumes them. They are not ordinary app UI assets and should be retained only with the operator console/review records they document.

Commit `19d2ac01d9a79240fc29b0ac04e638ad5e71eee5` adds a `LOCAL DEVELOPMENT` explanation and `NODE_ENV=development` to that repo’s `.env.example`; its body explains the sibling Bridge launcher invokes Node directly and requires the variable. The active integrated repo’s `.env.example` has no `NODE_ENV` line, so this documentation is absent there. It is environment-specific to that launcher and is not an active-app feature to port blindly.

### Explicit worth-rescuing shortlist

1. **Before-shopping review flow:** `client/src/components/plan-to-shopping-review-dialog.tsx`, `client/src/lib/plan-to-shopping-review-model.ts`, and their tests. The dialog gives the user a concrete list of meals/ingredients and a separate confirm action before the existing `generateFromMeals` write. The active weekly planner currently has direct “Send week to basket” actions, so the consent/review behavior is not reflected. The model’s implementation contains Monday-first sorting, duplicate-preserving meal mapping, exact normalized ingredient-name pantry matches, and an explicit warning that a pantry name match does not establish quantity or suitability. Those are direct content findings from the opened files.
2. **Dashboard quick-add:** `client/src/components/dashboard-plan-meal-card.tsx` and `client/src/components/dashboard-plan-meal-card.test.ts`, optionally with the paired handoff component/model/tests. The component actually queries meals and posts meal/day/slot/audience/position to `/api/planner/days/:id/items`; tests confirm correct position and reject malformed planner inputs. The active Dashboard currently only links to Planner. Adaptation is required because the old helper chooses the first returned week, whereas active Dashboard uses the current-week hook.
3. **Previous-week copy policy:** `shared/planner-week-copy.ts` and `server/tests/test-planner-week-copy.ts`. The opened helper preserves entry fields, maps weekdays, sorts positions and refuses to overwrite occupied slots; its tests assert these behaviors. Active planner has a single-meal duplicate action but no whole-week copy helper found. This is a distinct candidate only if the owner wants whole-week copying and approves the skip-on-occupied policy.

Everything else above is either reflected by newer active code, generic/shared infrastructure, defective or heuristic old code, an operational tool tied to the Larder runtime, or not supported by enough inspected active consumer evidence to recommend rescue. This shortlist is a content assessment, not a port/merge instruction.

## Follow-up validation of rescue candidates, APIs, assets, and NODE_ENV (2026-11-12)

### 1. Candidate paths, imports, dependency resolution, active references

All four candidate paths were checked in both old clones. The three UI/model files and `shared/planner-week-copy.ts` exist in `Meal-Ingredients-Planner`; none exists in `tha-living-larder-authoritative`. Neither old clone has `server/planner-week-copy.ts`. The helper is only `shared/planner-week-copy.ts`, and its relative import `./schema` resolves to `shared/schema.ts`.

| File | Imports from (type) | Exists in old repo? | Found in active repo? | Note |
|---|---|---:|---:|---|
| `client/src/components/plan-to-shopping-review-dialog.tsx` | `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog` (internal alias); `Button` from `@/components/ui/button` (internal alias); `ScrollArea` from `@/components/ui/scroll-area` (internal alias); type `PlanToShoppingReviewItem` from `@/lib/plan-to-shopping-review-model` (internal alias) | Yes, Meal-Ingredients-Planner | No | Every alias resolves to an existing old-repo source file. No direct external package imports. Dialog is callback-driven; `onConfirm` is supplied by its parent. |
| `client/src/lib/plan-to-shopping-review-model.ts` | type `FullDay` from `@/lib/planner-types` (internal alias); type `Meal` from `@shared/schema` (internal alias) | Yes, Meal-Ingredients-Planner | No | Both imports resolve in old repo (`client/src/lib/planner-types.ts`, `shared/schema.ts`). Pure projection; no fetch or endpoint call. |
| `client/src/components/dashboard-plan-meal-card.tsx` | `useEffect`, `useState` from `react` (external); `useMutation`, `useQuery`, `useQueryClient` from `@tanstack/react-query` (external); `Link` from `wouter` (external); `CalendarPlus`, `Loader2` from `lucide-react` (external); type `Meal` from `@shared/schema` (internal alias); `api` from `@shared/routes` (internal alias); `apiRequest` from `@/lib/queryClient`; `buildDashboardPlanShoppingHandoff` from `@/lib/dashboard-plan-shopping-handoff`; `DashboardPlanShoppingHandoffCard` from `@/components/dashboard-plan-shopping-handoff`; `useToast` from `@/hooks/use-toast`; `Button` from `@/components/ui/button`; `Card`, `CardContent` from `@/components/ui/card` (all internal aliases) | Yes, Meal-Ingredients-Planner | No | All internal imports resolve in the old repo. Its package.json constraints are `react ^18.3.1`, `@tanstack/react-query ^5.60.5`, `wouter ^3.3.5`, `lucide-react ^0.453.0`. |
| `shared/planner-week-copy.ts` | type `PlannerEntry` from relative `./schema` (internal relative import) | Yes, Meal-Ingredients-Planner | No | `shared/schema.ts` exists. No external packages. No server-side copy helper exists in either old clone. |

Active source searches for the candidate paths and exported identifiers (`PlanToShoppingReviewDialog`, `buildPlanToShoppingReview`, `DashboardPlanMealCard`, `getPlannerQuickAddDays`, `getPlannerQuickAddPosition`, `planPreviousWeekCopy`, `copyPlannerEntryValues`) returned no matches under active `client/src`, `server`, or `shared`. No partial port or renamed implementation under those identifiers was found. The active planner does independently implement single-entry duplication; that is not the old whole-week copy policy.

### 2. API endpoint/function contract checks

**Endpoint: `POST /api/planner/days/:dayId/items`**

- Found in active repo: yes.
- Location: `server/routes.ts` around line 6550.
- Contract: authenticated POST; validates `mealSlot` enum (`breakfast`, `lunch`, `dinner`, `snacks`), integer `mealId`, optional nonnegative integer `position`, optional/defaulted `audience`, calories, `isDrink`, drink type, eater IDs and guest eater context. Checks day/week household ownership and meal ownership, then returns the created entry with HTTP 201.
- Matches shortlist expectations: **yes** for the old dashboard quick-add payload (`mealSlot`, `mealId`, `position`, `audience: "adult"`, `isDrink: false`). Its first-week selection still needs adaptation to the active current-week identity.

**Endpoint: `GET /api/planner/weeks/:weekId`**

- Found in active repo: **no**. Active GET routes include `/api/planner/weeks`, `/api/planner/weeks/:weekId/days`, and `/api/planner/full`; there is no bare per-week GET route.
- Location: N/A for requested route; `server/routes.ts` around line 6899 for `/api/planner/full`.
- Contract: the old `buildPlanToShoppingReview(days, meals, pantryNames)` is a pure function and itself reads no API. The active `/api/planner/full` handler returns planner weeks stitched with days and entries; meal records and pantry names are separate client data. The per-week days endpoint returns the requested week’s days only.
- Matches shortlist expectations: **unclear as stated**. The claim that the review model reads `/api/planner/weeks/:weekId` is not supported by the source. The review projection can be assembled from active planner-full, meal, and pantry queries without that endpoint.

**Function/route: `generateFromMeals`**

- Found in active repo: yes, as a shared API descriptor and route, not a standalone function export.
- Locations: `shared/routes.ts` around line 189; `server/routes.ts` around line 4275; caller `client/src/hooks/use-planner-operations.ts` around lines 315 and 480.
- Contract: POST path `/api/shopping-list/from-meals`; authenticated request with `mealSelections` array of `{ mealId, count, eaterIds?, guestEaters? }` (server also accepts a legacy `mealIds` array). Server resolves meal ingredients, freezer portions and ready meals, then returns generated shopping items plus freezer deduction data (the hook handles either an array or `{ items, freezerDeductions }`).
- Matches shortlist expectations: **yes at the integration boundary, with adaptation**. The old dialog accepts an `onConfirm` callback and does not make the write itself; its old parent confirms then calls the existing mutation. The active mutation accepts the same `mealSelections` contract, so a review stage can precede it. The review model’s one-row-per-planned-entry output must be mapped/aggregated to the expected meal selection counts, preserving any eater context required by current behavior.

### 3. Asset references

Searches covered active source and public assets for exact filenames, then checked the active `client/src/lib/ingredient-imagery.ts` registry. The registry’s `IMAGE_MAP` and category map are empty; its ingredient examples are comments. The same-path old assets are absent from the active tree. Exact-name matches in the active comparison report and historical implementation documents are documentation mentions, not runtime consumers.

**Meal-Ingredients-Planner icons (both have no active source/public reference):**

- `client/src/assets/icons/tha-apple-sort.png` — none.
- `client/src/assets/icons/The healthy apples recommneds.png` — none. Active experience audit notes this misspelled filename as an orphaned asset; no runtime consumer found.

**Meal-Ingredients-Planner ingredient images (all 17 old files; no active files at the same paths):**

- `public/images/ingredients/almonds.webp` — no active source/public reference.
- `public/images/ingredients/avocado.webp` — comment-only example in `client/src/lib/ingredient-imagery.ts`; no active map entry.
- `public/images/ingredients/basil.webp` — no active source/public reference.
- `public/images/ingredients/blueberries.webp` — comment-only example; no active map entry.
- `public/images/ingredients/brown-rice.webp` — no active source/public reference.
- `public/images/ingredients/chia-seeds.webp` — no active source/public reference.
- `public/images/ingredients/chickpeas.webp` — comment-only example; no active map entry.
- `public/images/ingredients/coriander.webp` — no active source/public reference.
- `public/images/ingredients/kale.webp` — comment-only example; no active map entry.
- `public/images/ingredients/kimchi.webp` — no active source/public reference.
- `public/images/ingredients/lentils.webp` — no active source/public reference.
- `public/images/ingredients/oats.webp` — no active source/public reference.
- `public/images/ingredients/olive-oil.webp` — comment/example references only; no active map entry.
- `public/images/ingredients/pumpkin-seeds.webp` — comment-only example; no active map entry.
- `public/images/ingredients/sauerkraut.webp` — comment-only example; no active map entry.
- `public/images/ingredients/spinach.webp` — comment-only example; no active map entry.
- `public/images/ingredients/walnuts.webp` — comment-only example; no active map entry.

**Living Larder repository-review assets (10; no exact filename references in active application source/public tree):**

- `ops-console/public/repository-review/tha-cookbook-page-fidelity-claude/recipe-revision-02.png`
- `ops-console/public/repository-review/tha-cookbook-real-book-functional/collection.png`
- `ops-console/public/repository-review/tha-cookbook-real-book-functional/recipe.png`
- `ops-console/public/repository-review/tha-cookbook-real-book-functional/trusted-preview.png`
- `ops-console/public/repository-review/tha-cookbook-real-book-visual/review-sheet.png`
- `ops-console/public/repository-review/tha-larder-concept-lab/contact-sheet.png`
- `ops-console/public/repository-review/tha-larder-fruit-nut-assets/flax-seeds.webp`
- `ops-console/public/repository-review/tha-larder-room-remediation/batch-01-orchard-workroom.png`
- `ops-console/public/repository-review/tha-living-larder-authoritative/home.png`
- `ops-console/public/repository-review/tha-living-larder-v2/candidate-01-vs-north-star.jpg`

The active integrated repo’s source/public filename search found no references to any of those ten images. They remain operator-console/review evidence in the old clone, not active UI assets.

### 4. NODE_ENV: active app vs Bridge launcher

- Active integrated `.env.example`: no `NODE_ENV` line.
- Active integrated `package.json`: `dev` runs `tsx scripts/start-dev.ts`.
- Active integrated `scripts/start-dev.ts`: sets `process.env.NODE_ENV = "development"` before dynamically importing `server/index.ts`. Thus normal `npm run dev` does not need `.env` to set this variable. `npm start` sets production mode in its script.
- The Bridge launcher is not inside the active integrated repository; it is `G:\The Healthy Apples\Infrastructure\tha-chatgpt-bridge\start-tha-services.ps1`. It sets `$larder` to the separate `G:\The Healthy Apples\Applications\GitHub\tha-living-larder-authoritative`, reads that checkout’s `.env`, resolves `NODE_ENV` from that file or launcher process environment, fails closed unless it is `development`, and passes the resolved value explicitly to the Larder backend process. The launcher’s `-Integrated` path refers to the active integrated checkout for the frontend, but backend `.env`/entrypoint are the Living Larder checkout.
- Conclusion: omission from the **active integrated repo’s** `.env.example` is not an oversight for its ordinary dev command; its launcher sets the value. The Bridge launcher does not consume the active integrated `.env.example` for its backend, so copying the Living Larder note into that file would not fix or govern Bridge backend startup. The old `19d2ac01` example change is relevant to the separately configured Living Larder `.env.example` when that checkout is launched by Bridge; it is environment-specific, not a missing active integrated app setting.
