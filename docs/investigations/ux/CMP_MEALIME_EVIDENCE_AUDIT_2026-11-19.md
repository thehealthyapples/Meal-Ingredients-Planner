# Mealime comparison evidence audit

**Checked:** 19 November 2026
**Scope:** All 30 tasks in the existing THA comparison matrix, reviewed against Mealime's official support docs and official personalization page. No hands-on account testing was performed.
**Evidence rule:** Yes = documented; Some limits = documented with scope or qualification; Not reported = no sufficient finding in reviewed developer sources, not proof of absence.

## Task-by-task findings

| Task | Status | Evidence and qualification |
|---|---|---|
| One household plan | Some limits | Household size and serving scaling are supported; servings can scale up to six. Sources do not establish separate restriction settings for each eater. [Serving sizes](https://support.mealime.com/article/98-can-i-scale-servings-greater-than-4) |
| Eater profiles | Not reported | Mealime describes account preferences and household size, but not separate saved profiles/restrictions for each person. [Eating preferences](https://support.mealime.com/article/59-choose-your-allergies-and-restrictions) |
| Food restrictions | Yes | Supported diet preferences and allergy/restriction filters; the grocery list can flag potential allergen cross-contamination. [Allergen warnings](https://support.mealime.com/article/107-allergen-warnings) |
| Adapt for each eater | Some limits | Recipe filtering covers diet, allergies, dislikes, calories and other preferences; separate alternatives for each eater within one shared meal are not established. [Getting Started](https://support.mealime.com/article/151-getting-started-guide) |
| Create meals | Some limits | Users assemble plans from Mealime recipes and can save favorites/notes. Creating wholly custom recipes from scratch is not established in the reviewed sources. [Getting Started](https://support.mealime.com/article/151-getting-started-guide) |
| Import recipes | Yes | Mobile app can import many web recipes by pasting a URL; success depends on the source page. [Web recipe import](https://support.mealime.com/article/112-importing-a-recipe-from-the-web) |
| Social recipe import | Some limits | Recipe URLs can be copied from a browser and pasted into Mealime; a direct social-platform integration is not established. [Web recipe import](https://support.mealime.com/article/112-importing-a-recipe-from-the-web) |
| Meal scan | Not reported | Recipe or meal-photo scanning into the cookbook/plan was not established. |
| Create weekly plans | Yes | Auto-builder and self-serve planner create plans; users may plan ahead or choose day by day. [Getting Started](https://support.mealime.com/article/151-getting-started-guide) |
| Import a plan | Not reported | External meal-plan import was not established. |
| Scan a paper plan | Not reported | Paper meal-plan scanning was not established. |
| Reuse plan templates | Not reported | Pro can display the two most recent plans, but reusable plan templates were not established. [Mealime Pro](https://support.mealime.com/article/79-mealime-pro) |
| Shopping list | Yes | Plans generate a consolidated, categorized list with quantities. Grocery delivery handoff is described for supported providers/locations. [Grocery list](https://support.mealime.com/article/75-how-the-grocery-list-works) |
| Shared household | Some limits | Multiple people can use one account across devices, but Mealime says it has no in-app multi-user sharing feature or separate collaborator accounts. Some introductory language describes shared-account use as collaborative; this should not be equated with independent profiles or permissions. [Multi-user accounts](https://support.mealime.com/article/102-multi-user-accounts), [Getting Started](https://support.mealime.com/article/151-getting-started-guide) |
| Budget and store costs | Some limits | Recipe/planner filters include grocery price and per-serving price points; Mealime says it cannot provide a general total grocery cost because prices vary. [Getting Started](https://support.mealime.com/article/151-getting-started-guide), [Grocery cost FAQ](https://support.mealime.com/article/93-how-much-will-my-meal-plans-groceries-cost) |
| Meal nutrition | Some limits | Mealime Pro presents recipe calories, macros and micronutrients; this is subscription-gated. [Nutrition facts](https://support.mealime.com/article/89-viewing-recipe-nutritional-information) |
| Add nutrition | Not reported | Nutrient-adding ingredient suggestions were not established. |
| Weekly intake | Some limits | Cooked recipe servings/nutrition can be sent to Apple Health; in-app analysis of actual nutrient totals across a week is not established. [Getting Started](https://support.mealime.com/article/151-getting-started-guide) |
| Explore the week | Not reported | A linked weekly food/nutrient explorer was not established. |
| Food diary | Some limits | Recipes can be marked cooked and servings consumed can be sent to Apple Health; a full in-app food diary is not established. [Getting Started](https://support.mealime.com/article/151-getting-started-guide) |
| Photo meal logging | Not reported | Meal-photo suggestions for diary logging were not established. |
| Weight in diary | Not reported | Weight logging was not established. |
| Mood and energy | Not reported | Mood, energy or ability diary entries were not established. |
| Barcode scan | Not reported | Packaged-food barcode scanning was not established. |
| Offline scan | Not reported | Offline food lookup/scanning was not established. |
| Cook from pantry | Some limits | Mealime Pro allows selecting fridge/pantry items for a plan; this is a planning filter, not a documented live inventory. [Getting Started](https://support.mealime.com/article/151-getting-started-guide) |
| Scan pantry items | Not reported | Camera-based pantry recognition was not established. |
| Pantry sync | Not reported | Automatic pantry updates from shopping/cooking were not established. |
| AI recipe tailoring | Not reported | Plans are personalized by preferences and recipe filters, but the reviewed sources do not identify AI as the method or establish AI recipe tailoring. [Personalization](https://work.mealime.com/personalization) |
| Guided cooking | Yes | Mobile cooking mode displays one instruction at a time and supports hands-free step advancement. [Cooking mode](https://support.mealime.com/article/88-how-to-use-cooking-mode) |

## Overall observation

**Verified:** Mealime is a focused planner and cooking companion. It combines recipe selection, automatic grocery-list generation, ingredient reuse, dietary filters, and guided cooking. Pro adds detailed recipe nutrition, pantry/fridge planning, and access to recent plans. Household quantity planning is documented, while per-eater restriction profiles are not. Multi-person use relies on sharing account credentials rather than separate collaborator accounts.

**Inferred:** Mealime's documented strengths overlap THA's plan-to-shop path and recipe imports. Its product documentation offers less evidence for persistent, individual household needs, diary breadth, and nutrient analysis across actual consumed weeks. These are comparison gaps in reviewed evidence, not assertions about hidden features.

**Not established:** Paper-plan capture, external plan import, photo diary, weight/mood logs, barcode/offline scan, visual pantry, pantry synchronization, AI recipe tailoring and in-app weekly intake reports remain neutral grey.

**Sources are developer documentation, not an independent feature test.** Availability can depend on platform, subscription and grocery provider/region.