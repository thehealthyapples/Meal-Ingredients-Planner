# Yuka comparison evidence audit

**Checked:** 19 November 2026
**Scope:** All 30 tasks in the THA comparison matrix, using Yuka's official app/help pages and UK App Store listing. This is a source review, not hands-on testing.
**Evidence rule:** Yes = documented; Some limits = documented with scope or qualification; Not reported = no sufficient finding in reviewed developer sources, not proof of absence.

## Task-by-task findings

| Task | Status | Evidence and qualification |
|---|---|---|
| One household plan | Not reported | Household meal planning was not established. |
| Eater profiles | Not reported | Per-person profiles and restriction settings were not established. |
| Food restrictions | Some limits | Premium dietary alerts apply to a limited set of scanned-product ingredients/diets. Yuka says traces are not covered and users must check labels. [Food preferences](https://help.yuka.io/l/en/article/qzr8gkygvp-food-preferences) |
| Adapt for each eater | Not reported | Eater-specific meal adaptations were not established. |
| Create meals | Not reported | Meal or recipe creation was not established. |
| Import recipes | Not reported | Recipe-link or text import was not established. |
| Social recipe import | Not reported | Social-media recipe import was not established. |
| Scan recipes | Not reported | Recipe-image digitization was not established; Yuka's documented scan is a packaged-product barcode. |
| Create weekly plans | Not reported | Meal planning or weekly plan creation was not established. Yuka also describes a separate online nutrition education programme, which is not evidence of an in-app plan. |
| Import a plan | Not reported | Existing plan import was not established. |
| Scan a paper plan | Not reported | Paper meal-plan scanning was not established. |
| Reuse plan templates | Not reported | Meal-plan templates were not established. |
| Shopping list | Not reported | Product recommendations are documented; a meal-generated shopping list or retailer basket is not. |
| Shared household | Not reported | Household plan/list collaboration was not established. |
| Budget and store costs | Not reported | Budgeting and retailer price/basket comparison were not established. |
| Meal nutrition | Some limits | Product sheets show nutrient gauges and product scoring, not nutrition analysis for a prepared meal. [Nutritional gauges](https://help.yuka.io/l/en/article/yhzlhb4j1o-untitled-article-en) |
| Add nutrition | Some limits | Yuka suggests similar, higher-rated packaged products when a scan scores poorly; it does not document suggestions to add ingredients/nutrients to a meal. [Recommendations](https://help.yuka.io/l/en/article/s71arvkw6u-selection-recommendations) |
| Weekly intake | Not reported | Actual consumed weekly nutrient totals or reports were not established. |
| Explore the week | Some limits | Scan history lets users revisit product analyses; this is not documented as a selected-week view of eaten foods and nutrients. [Application features](https://yuka.io/en/app/) |
| Food diary | Not reported | Product scan history is not evidence of logging what was eaten. A food diary was not established. |
| Photo meal logging | Not reported | Photo-based meal recognition/logging was not established. |
| Weight in diary | Not reported | Personal weight logging was not established. |
| Mood and energy | Not reported | Mood, energy or ability logging was not established. |
| Barcode scan | Yes | Food barcodes open a product sheet with its score, analysis and (when rated poorly) similar higher-scoring products. [Application features](https://yuka.io/en/app/) |
| Offline scan | Some limits | Premium offline mode covers the 100,000 most frequently scanned food/cosmetic products, not the complete database. [Offline database limits](https://help.yuka.io/l/en/article/ur4x5k32qg-database-in-offline-mode) |
| Cook from pantry | Not reported | Pantry-based recipe discovery was not established. |
| Scan pantry items | Not reported | Pantry-list ingredient recognition was not established. |
| Pantry sync | Not reported | Pantry inventory updates were not established. |
| AI recipe tailoring | Not reported | AI recipe modification/personalization was not established. |
| Guided cooking | Not reported | Interactive cooking instructions or cook mode were not established. |

## Product scoring context

Yuka's own method describes a packaged-food score weighted 60% nutritional quality, 30% additives, and 10% organic certification. Nutritional gauges include calories, saturated fat, sugar, salt, protein, fiber, and fruit/vegetable content. These are product-level analysis features; the score does not equal a meal plan or a complete diet evaluation. [Food scoring method](https://help.yuka.io/l/en/article/ijzgfvi1jq-how-are-food-products-scored)

The official limitation page says database data can be incomplete or inaccurate, product composition may change before records update, and the app is not medical advice. The food-preference help also says not to rely on its alerts alone for allergies. [Yuka limitations](https://help.yuka.io/l/en/article/wz3cbbztf3-what-are-yuka-s-limitations), [Food preferences](https://help.yuka.io/l/en/article/qzr8gkygvp-food-preferences)

## Overall observation

**Verified from official documentation:** Yuka is strong at in-store packaged-product scanning, explaining product-level nutrition/additive scores, suggesting higher-rated product alternatives, and providing a limited offline database. Premium adds dietary preference alerts and offline/search/history features.

**Inferred opportunity for THA (internal only):** Yuka shows the value of a fast scan-to-explanation loop: scan, understand why a product scored as it did, and see a better-rated alternative. THA could assess how to make its own product analysis and next-step recommendations equally immediate, while linking that insight into its household meal plan and shop. This is a discovery suggestion, not a committed feature or public comparison-page addition.

**Not established:** Meal planning, meal/plan scanning, household profiles, meal logging, weight/mood tracking, pantry functions and guided cooking remain neutral grey. Silence in Yuka's official documentation is not confirmation of absence.