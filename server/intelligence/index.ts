/**
 * THA Intelligence Platform — public module surface
 * =================================================
 * The single import surface for the canonical Intelligence Platform foundation
 * (INT1). Import the singleton `intelligencePlatform` for orchestration; import the
 * types/classes for tests and future workstreams.
 *
 * This is INTERNAL platform infrastructure. It exposes NO HTTP endpoints and NO UI.
 * Wiring any route or surface to it is a future, governed workstream (INT2+).
 */

export {
  IntelligencePlatform,
  intelligencePlatform,
} from "./intelligence-platform.js";

export { CapabilityRegistry, type CapabilityGap } from "./capability-registry.js";
export { IntentEngine, type RouteOptions } from "./intent-engine.js";

// INT6B — Read Binding Kit (shared infrastructure for all read-only handlers).
export { toInt, requireUserId, gap, denied, readOnlyVerbGuard } from "./handlers/_read-kit.js";

// INT2 — first live capability binding (read-only Planner).
export { bindPlannerReadCapability, PLANNER_CAPABILITY_ID, PLANNER_EXECUTABLE_INTENTS } from "./bindings/planner.js";
export {
  createPlannerReadHandler,
  type PlannerMealView,
  type PlannerDayView,
  type PlannerWeekReadResult,
  type PlannerDayReadResult,
  type PlannerExplainResult,
} from "./handlers/planner-read-handler.js";
export {
  createStoragePlannerReadPort,
  type PlannerReadPort,
  type PlannerMealRef,
} from "./handlers/planner-read-port.js";

// INT3 — second live capability binding (read-only Shopping).
export { bindShoppingReadCapability, SHOPPING_CAPABILITY_ID, SHOPPING_EXECUTABLE_INTENTS } from "./bindings/shopping.js";
export {
  createShoppingReadHandler,
  type ShoppingItemView,
  type ShoppingExtraView,
  type ShoppingListReadResult,
  type ShoppingUnresolvedItemView,
  type ShoppingUnresolvedReadResult,
  type ShoppingPricedItemView,
  type ShoppingBasketSummaryResult,
  type ShoppingStatusExplainResult,
} from "./handlers/shopping-read-handler.js";
export {
  createStorageShoppingReadPort,
  type ShoppingReadPort,
} from "./handlers/shopping-read-port.js";

// INT4 — third live capability binding (read-only Nutrition / Knowledge).
export {
  bindNutritionKnowledgeReadCapability,
  NUTRITION_KNOWLEDGE_CAPABILITY_ID,
  NUTRITION_KNOWLEDGE_EXECUTABLE_INTENTS,
} from "./bindings/nutrition-knowledge.js";
export {
  createNutritionKnowledgeReadHandler,
  type KnowledgeBenefitView,
  type NutritionFoodReadResult,
  type NutritionNutrientReadResult,
  type NutritionBenefitReadResult,
  type NutritionCategoriesReadResult,
  type NutritionFoodsReadResult,
  type NutritionSearchResult,
  type NutritionExplainResult,
} from "./handlers/nutrition-knowledge-read-handler.js";
export {
  createRegistryNutritionKnowledgeReadPort,
  type NutritionKnowledgeReadPort,
} from "./handlers/nutrition-knowledge-read-port.js";
// INT8 — fourth live capability binding (read-only Pantry).
export { bindPantryReadCapability, PANTRY_CAPABILITY_ID, PANTRY_EXECUTABLE_INTENTS } from "./bindings/pantry.js";
export {
  createPantryReadHandler,
  type PantryItemView,
  type PantryListReadResult,
  type PantryIngredientKnowledgeView,
  type PantryExplainResult,
} from "./handlers/pantry-read-handler.js";
export {
  createStoragePantryReadPort,
  type PantryReadPort,
} from "./handlers/pantry-read-port.js";

// INT10 — fifth live capability binding (read-only Diary).
export { bindDiaryReadCapability, DIARY_CAPABILITY_ID, DIARY_EXECUTABLE_INTENTS } from "./bindings/diary.js";
export {
  createDiaryReadHandler,
  type DiaryEntryView,
  type DiaryDayReadResult,
  type DiaryMetricsView,
  type DiaryExplainResult,
} from "./handlers/diary-read-handler.js";
export {
  createStorageDiaryReadPort,
  type DiaryReadPort,
} from "./handlers/diary-read-port.js";

// INT12 — sixth live capability binding (read-only Profile).
export { bindProfileReadCapability, PROFILE_CAPABILITY_ID, PROFILE_EXECUTABLE_INTENTS } from "./bindings/profile.js";
export {
  createProfileReadHandler,
  type ProfileView,
  type ProfilePreferencesView,
  type ProfileReadResult,
} from "./handlers/profile-read-handler.js";
export {
  createStorageProfileReadPort,
  type ProfileReadPort,
} from "./handlers/profile-read-port.js";

// INT13 — seventh live capability binding (read-only Household).
export { bindHouseholdReadCapability, HOUSEHOLD_CAPABILITY_ID, HOUSEHOLD_EXECUTABLE_INTENTS } from "./bindings/household.js";
export {
  createHouseholdReadHandler,
  type HouseholdMemberView,
  type HouseholdView,
  type HouseholdDietaryContextView,
  type HouseholdEaterView,
  type HouseholdEatersView,
  type HouseholdReadResult,
} from "./handlers/household-read-handler.js";
export {
  createStorageHouseholdReadPort,
  type HouseholdReadPort,
  type HouseholdMembershipRow,
} from "./handlers/household-read-port.js";

// INT14 — eighth live capability binding (read-only Partners).
export { bindPartnersReadCapability, PARTNERS_CAPABILITY_ID, PARTNERS_EXECUTABLE_INTENTS } from "./bindings/partners.js";
export {
  createPartnersReadHandler,
  type RetailerView,
  type PartnersRetailersReadResult,
} from "./handlers/partners-read-handler.js";
export {
  createStoragePartnersReadPort,
  type PartnersReadPort,
  type RetailerRef,
} from "./handlers/partners-read-port.js";

// INT15 — ninth live capability binding (read-only Meals).
export { bindMealsReadCapability, MEALS_CAPABILITY_ID, MEALS_EXECUTABLE_INTENTS } from "./bindings/meals.js";
export {
  createMealsReadHandler,
  type MealView,
  type MealSummaryView,
  type MealItemView,
  type MealsListReadResult,
  type MealsSummaryReadResult,
  type MealsDetailReadResult,
  type MealsReadResult,
} from "./handlers/meals-read-handler.js";
export {
  createStorageMealsReadPort,
  type MealsReadPort,
} from "./handlers/meals-read-port.js";

// INT16 — tenth live capability binding (read-only Templates).
export { bindTemplatesReadCapability, TEMPLATES_CAPABILITY_ID, TEMPLATES_EXECUTABLE_INTENTS } from "./bindings/templates.js";
export {
  createTemplatesReadHandler,
  type MealTemplateView,
  type PlanTemplateSummaryView,
  type PlanTemplateItemView,
  type PlanTemplateDetailView,
  type TemplatesMealTemplatesReadResult,
  type TemplatesMealTemplateReadResult,
  type TemplatesPlanLibraryReadResult,
  type TemplatesPlanMineReadResult,
  type TemplatesPlanDefaultReadResult,
  type TemplatesPlanDetailReadResult,
  type TemplatesReadResult,
} from "./handlers/templates-read-handler.js";
export {
  createStorageTemplatesReadPort,
  type TemplatesReadPort,
  type PlanTemplateWithCount,
  type PlanTemplateWithItems,
} from "./handlers/templates-read-port.js";

// INT17 — eleventh live capability binding (read-only Analyser).
export { bindAnalyserReadCapability, ANALYSER_CAPABILITY_ID, ANALYSER_EXECUTABLE_INTENTS } from "./bindings/analyser.js";
export {
  createAnalyserReadHandler,
  type AdditiveView,
  type AnalyserAdditivesReadResult,
} from "./handlers/analyser-read-handler.js";
export {
  createStorageAnalyserReadPort,
  type AnalyserReadPort,
  type AdditiveRef,
} from "./handlers/analyser-read-port.js";

export {
  resolveContext,
  canInvokeCapability,
  canAccessKnowledgeClass,
  roleMeetsMinimum,
  confirmationFor,
  type PermissionDecision,
} from "./permissions.js";

export { CapabilityExecutionError } from "./types.js";
export type {
  Capability,
  CapabilityAvailability,
  CapabilityClass,
  CapabilityHandler,
  CapabilityPermissions,
  AiAccessPosture,
  ConfirmationTier,
  ExecutionFailureStatus,
  IntelligenceContext,
  IntelligenceRole,
  Intent,
  IntentOutcome,
  IntentOutcomeStatus,
  IntentVerb,
  KnowledgeClass,
} from "./types.js";
