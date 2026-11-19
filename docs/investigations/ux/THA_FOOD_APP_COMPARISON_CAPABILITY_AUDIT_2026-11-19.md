# THA food app comparison capability audit — 19 November 2026

## Scope and method

Reviewed THA's current development application implementation and compared 21 named competitor apps across 30 user tasks spanning household meal coordination, recipe capture, weekly planning, shopping, nutrition, diary, scanning, pantry and cooking guidance. The on-page comparison deliberately displays the six closest products by shared tasks by default; users can reveal the wider set. It does not create an overall winner.

Competitor evidence comes from official developer pages/help centres linked from the matrix. This is a dated snapshot: regions, subscription tiers and app versions vary. A feature not found in reviewed official sources is marked Not verified (grey), not No. Red is reserved for a THA capability gap confirmed in the reviewed app source or a specific documented absence.

## THA findings — verified in current source

- Household planner and eater records support shared meals, individual diet choices/restrictions, and reviewed meal adaptations. Owners include existing household/eater and planner services; the UI consumes those records rather than creating comparison-specific state.
- Cookbook recipe capture supports creation/editing, link/text import, recipe image review, and social link attempts with limitations. Planner paper/image scan extracts proposals that users review.
- Weekly planner supports building weeks, templates, shared shopping list handoff, budget tiers, price lookup and retailer handoff (availability varies).
- Nutrition Boost emphasizes positive additions or swaps, with restriction checks and user review. It is not a full nutrient analysis of every recipe.
- Food diary supports food, weight, mood and energy entries. Logged food nutrition is available, but THA does not currently substantiate a complete weekly nutrient-intake audit. The Food room explores foods and linked nutrients, not amounts consumed.
- Analyser supports barcode scanning with an online lookup. No offline product database was found in the reviewed route/service.
- Pantry matching can show existing cookbook meals that use foods, but no complete use-it-up engine, visual pantry scan, or automatic stock decrement was found.
- Recipe instructions exist; a dedicated interactive guided-cooking mode was not found.
- No meal-photo-to-diary recognition/draft flow was found in the reviewed diary implementation.

Primary implementation owners reviewed include `server/routes.ts`, `shared/schema.ts`, `client/src/pages/weekly-planner-page.tsx`, `client/src/pages/food-diary-page.tsx`, `client/src/pages/shopping-workspace-page.tsx`, `client/src/pages/profile-page.tsx`, pantry/larder interfaces, `client/src/components/PlannerScanReview.tsx`, `client/src/components/RecipeScanReview.tsx`, and `client/src/components/MealUpliftPanel.tsx`. Household records, planner, diary, pantry, meals and shopping remain the single owners of their respective facts/workflows.

## Competitor signals and possible THA directions

These are suggestions for product discovery, not approved commitments:

1. **Pantry recognition with careful confirmation** — Samsung Food+ offers a visual food-list scan and use-it-up search. Explore camera-assisted recognition only if the result remains a reviewed draft and manual pantry truth remains reliable.
2. **Meal photo to diary draft** — MyFitnessPal Meal Scan suggests foods from a meal image and allows correction before logging. Explore a correction-first flow that writes through the existing diary owner.
3. **Guided cooking** — Samsung Food, SideChef and Crouton surface step-by-step cooking. Explore optional cook mode with clear progress, timers and the ability to leave, without turning cooking into engagement tracking.
4. **Weekly nutrition clarity** — MFP and MyNetDiary expose weekly reports. Explore a sourced, transparent summary for actually logged meals, including missing days and uncertainty, without implying complete intake from planned meals.
5. **Basket cost confidence** — Mealia emphasizes budget and supermarket baskets. Explore clearer estimated-vs-confirmed costs, coverage and substitutions around THA's existing basket handoff.
6. **Explain scan choices** — Yuka makes product grades and alternatives visible. Explore clearer reasons, trade-offs and restriction context on THA's product comparison, while preserving nuance and household choice.
7. **Feature discoverability** — the review also suggests improving in-app findability and explanation of existing paper/social capture, individual eater restrictions and positive nutrition suggestions before adding additional workflows.

## Evidence links sampled

- MyFitnessPal meal photo scanner: https://support.myfitnesspal.com/hc/en-us/articles/360045761612-How-to-use-the-Meal-Scanner
- MyFitnessPal plan tiers/reports: https://support.myfitnesspal.com/hc/en-us/articles/34889191368077-The-difference-between-Free-Premium-and-Premium
- Samsung Food+: https://samsungfood.com/food-plus/
- Samsung Food+ help: https://support.samsungfood.com/hc/en-us/articles/32709269852052-What-s-Included-in-Your-Samsung-Food-Subscription
- Samsung planner sharing: https://support.samsungfood.com/hc/en-us/articles/35369657798548-Getting-Started-with-Meal-Planner
- Yuka app: https://yuka.io/en/app/
- Yuka offline scans: https://help.yuka.io/l/en/article/dop80j54bb-paid-version-features
- Mealime restrictions: https://support.mealime.com/article/59-choose-your-allergies-and-restrictions
- Mealime allergen warnings: https://support.mealime.com/article/107-allergen-warnings
- Mealime household sharing: https://support.mealime.com/article/151-getting-started-guide
- Mealia UK: https://mealia.com/uk/home

## Limits and follow-up

This is a source-code and official-documentation review, not hands-on testing of every competitor app, subscription tier or region. Entries should be rechecked before publication updates. The biggest unresolved competitor cells remain grey where product capability could not be supported by the linked official evidence.
