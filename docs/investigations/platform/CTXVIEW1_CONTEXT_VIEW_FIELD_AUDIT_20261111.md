# CTXVIEW1 — Context View Field Audit (partial)

Date: 2026-11-11. Scope is exactly the eight entries registered in `server/intelligence/context/context-view.ts`. Read-only review; no source changes.

## 1. `profile:read` — Checked, no gap found

Compared `ProfileReadResult` → `ProfileView` and `ProfilePreferencesView` in `server/intelligence/handlers/profile-read-handler.ts:28–140` against the pinned paths in `context-view.ts:364–373` and the explanatory comments at `context-view.ts:189–202`.

All result top-level fields are accounted for: `scope`, `profile`, `preferences`. Profile and preference leaves not pinned remain eligible for relevance/budget selection (this spec intentionally pins only dietary constraints). The type comment explicitly excludes internal/sensitive columns before this result is formed; it also explicitly excludes `companionPersonality` and `mutedOpportunityTypes` because voice is delivered separately and must not become grounding evidence. No field is silently lost by a collection `keep` allowlist because this result has no collection spec. **No gap found in the checked field set.**

## 2. `food-intelligence:report` — Not yet checked

## 3. `opportunity-delivery:explain` — Not yet checked

## 4. `meals:read` — Not yet checked

## 5. `meals:search` — Not yet checked

## 6. `planner:read` — Not yet checked

The registry currently pins `scope`, `weekId`, `weekNumber`, `weekName`, and `weekStartDate` (`context-view.ts:436–445`), but the handler’s complete actual return shape has not yet been compared field by field. The earlier fix is not treated as verified by this partial report.

## 7. `shopping:read` — Not yet checked

## 8. `household:read` — Not yet checked

---

**Checkpoint:** only profile is fully compared. Do not infer a clean result for any other spec from this partial document. Continue with each registered handler’s declared result/interface and compare every top-level and collection field to the corresponding pinned/keep paths and the file’s omission rationale.
## 2. `food-intelligence:report` — Checked, no allowlist gap found

Compared `FoodOpportunityReportResult` (`opportunities`, `trust`, `source`) at `server/intelligence/handlers/food-intelligence-read-handler.ts:74–78` and nested `FoodOpportunity` (the report handler returns `bundle.opportunities` without narrowing, see `:248–254`) to `context-view.ts:375–390`. Every opportunity field in the result type is present in `keep`: `id`, `type`, `priority`, `owningDomain`, `explanation`, `suggestedAction`, `evidence`, `subject`. Nested evidence and subject are retained as whole values; the spec has no nested projection for their own leaves. The comments at `context-view.ts:204–213` explain preserving provenance and hoisting duplicated evidence detail; `subject` is explicitly documented as previously dropped and added. Top-level `trust` and `source` are not pinned, but this spec does not use a top-level allowlist: scalar relevance/budget selection applies, so they are not silently allowlist-dropped. **No allowlist-drop gap found.**

## 3. `opportunity-delivery:explain` — Checked, no allowlist gap found

Compared `OpportunityExplanationResult` at `server/intelligence/handlers/opportunity-delivery-handler.ts:87–98` with the single-object spec at `context-view.ts:392–405`. All fields (`opportunityId`, `capabilityId`, `domain`, `type`, `priority`, `explanation`, `evidence`, `suggestedAction`, optional `subject`, `source`) remain eligible as ordinary scalar/object leaves; there is no collection `keep` allowlist. `explanation` and `evidence` are pinned. The comment at `context-view.ts:392–402` explains that evidence must survive even when empty, while other fields compete by relevance. **No allowlist-drop gap found.**

## 4. `meals:read` — Checked, no useful gap found

Compared all four union variants (`MealsListReadResult`, `MealsSummaryReadResult`, `MealsDetailReadResult`, `MealsSearchResult`) and row types at `server/intelligence/handlers/meals-read-handler.ts:54–159` against `context-view.ts:407–426`. The `meals` keep list covers every `MealView`/`MealSummaryView` leaf that the type comment deems relevant: `id`, `name`, `mealSourceType`, `isReadyMeal`, `isSystemMeal`, `kind`, `mealFormat`, `audience`, `dietTypes`, `ingredientCount`, `servings`, `isDrink`, `drinkType`, `ingredients`, `instructions`, `isFreezerEligible`. Detail `items` allowlist covers all `MealItemView` fields (`id`, `type`, `referenceId`, `name`, `quantity`). `mealCount` and `source` are top-level scalar fields, not subject to collection keep filtering.

`userId` is repeated caller identity, `categoryId` is an opaque FK with no category name, `sourceUrl` is not an entity reference/citation, and `imageUrl`/`createdAt` are noise; these omissions are explicitly justified at `context-view.ts:229–241`. The older freezer eligibility omission has already been corrected and documented there. No other field in these types is absent from the relevant keep list. **No useful allowlist-drop gap found.**

## 5. `meals:search` — Checked, no gap found

Compared `MealsSearchResult` and `MealSearchView` at `server/intelligence/handlers/meals-read-handler.ts:113–119,148–155` with `context-view.ts:428–434`. All `MealSearchView` fields except `imageUrl` are included (`id`, `name`, `servings`, `isSystemMeal`, `dietTypes`, `mealFormat`, `kind`). The handler’s interface comment says this is intentionally lightweight and omits ingredients because callers can request detail; `imageUrl` is visual presentation metadata rather than a fact needed to answer meal search questions. Top-level `scope`, `query`, `mealCount`, `source` are outside the row allowlist and remain eligible. **No useful allowlist-drop gap found.**

## 6. `planner:read` — Checked, no gap found

Compared the actual `PlannerWeekReadResult`, `PlannerDayReadResult`, `PlannerDayView`, and `PlannerMealView` interfaces at `server/intelligence/handlers/planner-read-handler.ts:43–94` with `context-view.ts:436–461`.

Week scope fields `scope`, `weekId`, `weekNumber`, `weekName`, and `weekStartDate` are all pinned. The collection `days` keeps all `PlannerDayView` fields (`dayId`, `dayOfWeek`, `meals`); nested meals retain all `PlannerMealView` fields (`entryId`, `mealType`, `audience`, `mealId`, `mealName`, `isDrink`, `ingredients`, `calories`). Day scope has `scope`, `weekId`, `weekNumber`, `dayId`, `dayOfWeek`, `meals`; week-only `weekName`/`weekStartDate` are absent by type and safely resolve undefined. Day-scope `dayId`/`dayOfWeek` and other top-level scalars are not collection-allowlisted and remain eligible. No typed result field is silently excluded. **No gap found; the earlier week-identity fix is complete for the declared result types.**

## 7. `shopping:read` — Checked, no gap found

Compared list, unresolved, basket, and status result interfaces and all nested rows at `server/intelligence/handlers/shopping-read-handler.ts:44–140` against `context-view.ts:463–485`.

`items` keeps every `ShoppingItemView` field and adds both `ShoppingUnresolvedItemView` fields (`reviewReason`, `confidenceReason`). `extras` keeps all five `ShoppingExtraView` fields. `pricedItems` keeps all `ShoppingPricedItemView` fields; `unpricedItems` keeps both declared fields (`id`, `name`). Basket summary counts/total/currency/note are all pinned. Result-level `scope`, `itemCount`/`unresolvedCount`, and status-explain fields are not dropped by a collection allowlist. The status-explain operation is a separate result shape under the same read handler; it is not silently allowlist-filtered by these named collections. **No allowlist-drop gap found for the registered spec.**

## 8. `household:read` — Checked, no gap found

Compared `HouseholdView`, `HouseholdDietaryContextView` (including the referenced `HouseholdDietaryContext` storage type), and `HouseholdEatersView` at `server/intelligence/handlers/household-read-handler.ts:52–96` and `server/storage.ts:432–447` against `context-view.ts:487–511`.

The shared `members` keep union includes all `HouseholdMemberView` fields (`userId`, `displayName`, `role`, `status`) and all dietary-context member fields (`userId`, `displayName`, `dietPattern`, `dietTypes`, `dietRestrictions`, `excludedIngredients`). The `eaters` keep list covers every `HouseholdEaterView` field including the consent-gated optional `reportedHealthContext` and `nutritionFocuses`. The three `aggregated` hard-constraint arrays are all pinned. Household top-level `scope`, `id`, `name`, and `myRole` are not subject to collection allowlisting. The invitation secret is explicitly omitted before the result is produced (handler comment at `household-read-handler.ts:60–62`), so it is not a spec-level silent drop. **No gap found in the checked field sets.**

## Audit conclusion

All eight registered specs were checked against their handler result types and applicable nested collection item types. **No unaccounted useful fields were found in this comparison.** Existing exclusions reviewed here are either explicit in the result type/handler or described in Context View rationale; note that the `meals:read` prose around `isFreezerEligible` at `context-view.ts:229–241` is stale relative to the current allowlist at `:418–425`, which includes the field. This audit evaluates the current allowlist, not that stale historical wording.

## Follow-up — 2026-11-11

The later weekly food quantities change adds an `ingredientAnalysis` field to the planner context view. Its pinned-path behavior has a passing regression in `server/tests/test-intelligence-context-composition.ts`; the eight-spec audit was otherwise completed in the sections above. This follow-up only records the later planner field addition.
