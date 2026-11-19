# Carb Manager comparison evidence audit

**Checked:** 19 November 2026
**Scope:** All 30 tasks in the existing matrix, reviewed against official Carb Manager product/help pages. This was a source review, not hands-on product testing. “Not reported” means the reviewed sources did not establish the feature, not that it is absent.

## Task-by-task findings

| Task | Status | Evidence and qualification |
|---|---|---|
| One household plan | Some limits | Premium shopping lists can scale recipe amounts to a chosen number of people; shared household meal planning and eater profiles are not established. [Shopping lists](https://help.carbmanager.com/docs/generate-and-print-shopping-lists) |
| Eater profiles | Not reported | Personal diet/intolerance settings are described, not separate saved profiles for each eater. [Meal plans](https://help.carbmanager.com/docs/meal-plan-overview) |
| Food restrictions | Some limits | Generated plans can use food intolerances/aversions and recipe filters include diet options; per-eater safety checks are not established. [Meal plans](https://help.carbmanager.com/docs/meal-plan-overview) |
| Adapt for each eater | Not reported | Plans can scale servings or macros; different versions of one meal for multiple eaters are not established. [Shopping lists](https://help.carbmanager.com/docs/generate-and-print-shopping-lists) |
| Create meals | Yes | Users can create custom meals and recipes with ingredients, servings, instructions and calculated nutrition. [Create recipes](https://help.carbmanager.com/docs/create-custom-recipes) |
| Import recipes | Some limits | Premium imports URLs from some websites; success depends on the source page. [Import recipes](https://help.carbmanager.com/docs/en/import-recipes) |
| Social recipe import | Not reported | Website URL import exists, but direct import from social posts/apps is not established. [Import recipes](https://help.carbmanager.com/docs/en/import-recipes) |
| Scan recipes | Some limits | Cookbook QR codes can add recipes; paper/image recipe scanning or OCR is not established. [Barcode/QR scanning](https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures) |
| Create weekly plans | Yes | Premium supports generated, custom and curated plans; custom plans can cover up to 30 days. [Plan overview](https://help.carbmanager.com/docs/meal-plan-overview) |
| Import a plan | Some limits | Users can copy and edit a curated Carb Manager plan; outside document/app plan import is not established. [Start a plan](https://help.carbmanager.com/docs/en/start-a-meal-plan) |
| Scan a paper plan | Not reported | Cookbook QR recipe scanning is documented, not scanning/OCR of a paper meal plan. [Barcode/QR scanning](https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures) |
| Reuse plan templates | Yes | Custom, generated and curated plans can be saved in My Foods, edited and started later. [Custom plans](https://help.carbmanager.com/docs/create-custom-meal-plans-1) |
| Shopping list | Yes | Premium generates editable lists from selected plan dates, scales to a chosen number of people, and supports check-off and print/download. Only one active list at a time. [Shopping lists](https://help.carbmanager.com/docs/generate-and-print-shopping-lists) |
| Shared household | Some limits | Users can share daily logs and foods/recipes/meals with friends; shared household planning or live grocery-list collaboration is not established. [Sharing](https://help.carbmanager.com/docs/share-daily-logs-foods-recipes-and-meals) |
| Budget & store costs | Not reported | Lists can be printed/downloaded; budget planning, cost estimates and retailer basket handoff are not established. [Shopping lists](https://help.carbmanager.com/docs/generate-and-print-shopping-lists) |
| Meal nutrition | Yes | Custom recipes calculate nutrition; Pro exposes detailed nutrient breakdowns and macro goals. [Create recipes](https://help.carbmanager.com/docs/create-custom-recipes) |
| Add nutrition | Some limits | Macro-scaled plans may suggest foods to add if a plan misses macro goals; this does not establish nutrient-uplift suggestions for a logged meal. [Start a plan](https://help.carbmanager.com/docs/en/start-a-meal-plan) |
| Weekly intake | Yes | My Week charts show daily consumed totals for carbs, protein, fat, energy and fiber. [Daily Log](https://help.carbmanager.com/docs/daily-log-overview) |
| Explore the week | Some limits | Weekly totals and in-depth nutrient details are documented; browsing foods logged in a week and their linked nutrients is not established. [Daily Log](https://help.carbmanager.com/docs/daily-log-overview) |
| Food diary | Yes | Daily Log supports meals, snacks, supplements, water, steps and exercise; Premium adds glucose, ketone and insulin readings. [Daily Log](https://help.carbmanager.com/docs/daily-log-overview) |
| Photo meal logging | Some limits | Premium supports logging food by meal photo; detail on how to review/correct recognition is limited in the source reviewed. [Food Tracker](https://www.carbmanager.com/feature-details/x5-75raaacaaoe2g/food-tracker/) |
| Weight in diary | Yes | All users can record weight in the Daily Log; Premium adds a wider set of body/health measurements and weight projections. [Log weight](https://help.carbmanager.com/docs/log-weight) |
| Mood & energy | Some limits | Lifestyle measurements include sleep and other tracking; a dedicated mood/energy/ability diary is not established. [Measurements](https://help.carbmanager.com/docs/add-body-and-health-measurements) |
| Barcode scan | Yes | Free mobile barcode scanning searches food databases; the Keto Diet Cookbook's QR codes can load a recipe. [Barcode/QR scanning](https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures) |
| Offline scan | Not reported | Barcode lookup searches online food databases; offline lookup is not documented. [Food data sources](https://help.carbmanager.com/docs/view-sources-of-food-data) |
| Cook from pantry | Not reported | Recipe filters and food history are documented; live pantry-stock recipe discovery is not established. [Find recipes](https://help.carbmanager.com/docs/find-foods-recipes-and-meals) |
| Scan pantry items | Not reported | Barcode and cookbook QR scanning exist, but camera recognition of pantry inventory is not established. [Barcode/QR scanning](https://help.carbmanager.com/docs/en/log-foods-by-scanning-barcodes-and-snapping-pictures) |
| Pantry sync | Not reported | Automatic stock updates from shopping or cooking are not described. [Shopping lists](https://help.carbmanager.com/docs/generate-and-print-shopping-lists) |
| AI recipe tailoring | Some limits | Plan generation uses declared preferences/intolerances and macro targets; older release notes mention a beta AI Recipe Finder, but broad current AI recipe adaptation is not established. [Plan overview](https://help.carbmanager.com/docs/meal-plan-overview) |
| Guided cooking | Some limits | Custom recipes can store multiple preparation steps, but interactive step-by-step cooking mode is not established. [Create recipes](https://help.carbmanager.com/docs/create-custom-recipes) |

## Product and THA observations

**Verified:** Carb Manager's broadest overlap is diet-led planning and detailed individual tracking. Its Premium plan builder supports custom plans up to 30 days, recipe URL imports from some websites, date-range shopping lists scaled for a chosen number of people, weekly macro totals, and suggested add-on foods when planned macros do not match goals. Its mobile barcode scanner is free; its physical cookbook QR workflow can bring a recipe into the app.

**SUGGESTIONS — internal only:** benchmark THA's shopping workflow against Carb Manager's explicit “number of people” list scaling, print/download output, and selected date-range generation. Review whether THA's existing plan/nutrition guidance could surface a reviewed add-on option when a planned meal misses a household nutrition aim. These are comparison-led checks, not commitments to add a new feature or public copy.

**Source limits:** Carb Manager help docs include dates from 2020–2026 and feature availability differs by Premium/free, mobile/web and subscription. No account/device testing was performed. No feature is marked No solely from silence.
