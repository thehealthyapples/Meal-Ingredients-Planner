# Samsung Food — competitor evidence audit — 19 November 2026

**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
**Active session:** `CMP_EVIDENCE_STATUS_DISTINCTION_20261119`
**Branch / review base:** `feat/integrated-dev` / `5b2ec4b3`
**Rollback:** existing session tag `rollback/CMP-evidence-verification-distinction-20261119` → `047fc302991bf42d8b327064ecf0770bc8ebdb84`
**Audit scope:** Samsung Food's 30 comparison tasks, using official Samsung Food developer/help pages found and reviewed on 2026-11-19. No hands-on competitor-app testing.

## What changed in the matrix

- Added sourced, per-cell records for account-level dietary preferences, recipe personalization, budget/basket limits, and meal-plan import/scan reporting.
- Added claim-specific links and precise tier/availability caveats for recipe import and image scan, plan creation/templates, shopping, nutrition, pantry tools, AI planning and guided cooking.
- Reclassified **Weekly intake** from Yes to Some limits. Samsung documents daily nutrition goals and detailed recipe nutrition, but the reviewed material does not establish a report of consumed weekly nutrient totals across diary days.
- **No competitor cells were changed to Confirmed no.** A source not mentioning a workflow stays grey.

## Cell decisions

| Matrix task | Status | Evidence reading |
|---|---|---|
| One household plan | Some limits | Household size and shared meal plans are documented; separate eater-specific restrictions are not established in the reviewed profile settings. |
| Eater profiles | Not reported in reviewed sources | Account settings describe one primary diet and household size, not individual profiles. This is not proof those profiles do not exist. |
| Food restrictions | Yes | Account settings offer one diet and multiple food avoidance/allergy selections; these appear account-level. |
| Adapt for each eater | Some limits | AI recipe personalization by diet is documented; adaptations for different eaters sharing one meal are not. |
| Create meals / recipes | Yes | Recipe Builder supports creating and editing recipes. |
| Import recipes | Yes | URL, browser extension, mobile share extension and image capture are documented; source-site compatibility varies. |
| Social recipe import | Yes | The mobile share extension names apps including Pinterest and Facebook. |
| Scan recipes | Yes | Image-to-recipe scan is documented; three free scans, unlimited scans with Food+. |
| Create weekly plans | Yes | Weekly scheduling by date, day and meal type is documented. |
| Import an existing plan | Not reported in reviewed sources | Reviewed planner help describes adding recipes and reusing saved plans, not bringing in an external plan. |
| Scan a paper plan | Not reported in reviewed sources | Reviewed planner help does not document paper-plan scanning. |
| Reuse plan templates | Yes | Saved plans can be reused; up to three free, unlimited with Food+. |
| Shopping list | Yes | Plans turn into shopping lists; retailer checkout depends on supported regions/stores. |
| Shared household collaboration | Yes | Shared meal plans and shopping lists are documented. |
| Budget / basket | Some limits | Retailer basket handoff is documented; cost comparison/budget planning is not established in the sources reviewed. |
| Meal nutrition | Yes | Recipe macro- and micronutrient details are documented. |
| Add nutrition | Some limits | Food+ AI offers macro balancing and a healthier recipe twist; specific nutrient-adding ingredient suggestions are not established. |
| Weekly intake | Some limits | Daily goals and detailed nutrient tracking exist; consumed weekly totals from diary days are not established. |
| Explore foods from the week | Not assessed yet | This particular comparison task was not resolved in this source pass. |
| Food diary / photo logging / weight / mood and energy | Not assessed yet | The material reviewed here does not establish these diary workflows; no absence claim is made. |
| Barcode / offline scan | Not assessed yet | This source pass did not establish packaged-food barcode or offline scanning. |
| Cook from pantry / scan pantry / pantry sync | Yes | Use It Up, ingredient photo recognition, Food List updates and list transfers are documented; some capabilities are Food+ features. |
| AI recipe tailoring | Yes | Tailored seven-day plans use preferences, dietary needs and health goals; Samsung Health may supply personal health data. |
| Guided cooking | Yes | Food+ Smart Cook Mode documents guided steps and AI tips; appliance control is also described. |

## Primary developer sources

- [What’s Included in Samsung Food+](https://support.samsungfood.com/hc/en-us/articles/32709269852052-What-s-Included-in-Your-Samsung-Food-Subscription) — tailored plans, AI recipe personalization, pantry search, Vision AI, Smart Cook Mode, recipe scans.
- [Managing Your Samsung Food Account](https://support.samsungfood.com/hc/en-us/articles/18365212922644-Managing-Your-Samsung-Food-Account) — one primary diet, avoidances/allergies, household size and account-level preferences.
- [Getting Started with Meal Planner](https://support.samsungfood.com/hc/en-us/articles/35369657798548-Getting-Started-with-Meal-Planner) and [Meal Planner FAQ](https://support.samsungfood.com/hc/en-us/articles/35374865737620-Meal-Planner-FAQ) — scheduling, sharing, saved-plan reuse and tier limits.
- [Save, Search, and Share Recipes](https://support.samsungfood.com/hc/en-us/articles/18365507924372-Getting-Started-with-Samsung-Food-Save-Search-and-Share-Recipes) — link/share imports and image scans, including free scan limits.
- [Create and Manage Shopping Lists](https://support.samsungfood.com/hc/en-us/articles/18369342052372-Getting-Started-with-Samsung-Food-Create-and-Manage-Shopping-Lists) and [Sharing & Collaboration](https://support.samsungfood.com/hc/en-us/articles/18689681101716-Sharing-Collaboration-on-Samsung-Food) — list generation, supported retailer checkout and collaboration.
- [Nutrition calculations](https://support.samsungfood.com/hc/en-us/articles/18725068057620-Nutrition-calculations-Macronutrients-Micronutrients-and-Health-Score) and [Daily Nutrition Goals](https://support.samsungfood.com/hc/en-us/articles/30286911223956-How-to-Set-and-Manage-Your-Daily-Nutrition-Goals-in-Samsung-Food) — recipe nutrients, daily goals and calculation scope.

## Limits and follow-up

This pass distinguishes what the reviewed sources support from what they do not report. It does not prove a capability absent from the Samsung Food app. Regions, stores, devices and Food+ tiers can change access. The Samsung Food row now carries exact URLs for reviewed claims; other still-missing cells remain **Not assessed yet**. Next, apply the same method to the other high-overlap apps, then continue the full matrix source audit.
