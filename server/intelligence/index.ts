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
// INT40 — Planner write (the "add" verb, composed into the same binding above).
export { createPlannerWriteHandler, type PlannerAddResult } from "./handlers/planner-write-handler.js";
export { createStoragePlannerWritePort, type PlannerWritePort } from "./handlers/planner-write-port.js";

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
// INT40 — Shopping write (the "add" verb, composed into the same binding above).
export { createShoppingWriteHandler, type ShoppingAddResult } from "./handlers/shopping-write-handler.js";
export { createStorageShoppingWritePort, type ShoppingWritePort } from "./handlers/shopping-write-port.js";

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
  type MealSearchView,
  type MealsListReadResult,
  type MealsSummaryReadResult,
  type MealsDetailReadResult,
  type MealsSearchResult,
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

// INT26 — twelfth live capability binding (Meal Discovery — cross-source search).
export {
  bindMealDiscoveryCapability,
  MEAL_DISCOVERY_CAPABILITY_ID,
  MEAL_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
} from "./bindings/meal-discovery.js";
export {
  createMealDiscoveryHandler,
  MEAL_DISCOVERY_EXECUTABLE_INTENTS,
} from "./handlers/meal-discovery-handler.js";
export {
  createProductionMealDiscoveryPort,
  type MealDiscoveryPort,
  type DiscoveryItem,
  type MealDiscoverySearchResult,
} from "./handlers/meal-discovery-port.js";

// INT27 — thirteenth live capability binding (Nutrition Discovery — macro-filtered meal search).
export {
  bindNutritionDiscoveryCapability,
  NUTRITION_DISCOVERY_CAPABILITY_ID,
  NUTRITION_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
} from "./bindings/nutrition-discovery.js";
export {
  createNutritionDiscoveryHandler,
  NUTRITION_DISCOVERY_EXECUTABLE_INTENTS,
} from "./handlers/nutrition-discovery-handler.js";
export {
  createProductionNutritionDiscoveryPort,
  type NutritionDiscoveryPort,
  type MealNutritionRow,
  type NutritionFilter,
  type NutritionDiscoveryItem,
  type NutritionDiscoverySearchResult,
  type ParsedNutrition,
} from "./handlers/nutrition-discovery-port.js";

// INT28 — fourteenth live capability binding (Planner Discovery — search across all planner weeks).
export {
  bindPlannerDiscoveryCapability,
  PLANNER_DISCOVERY_CAPABILITY_ID,
  PLANNER_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
} from "./bindings/planner-discovery.js";
export {
  createPlannerDiscoveryHandler,
  PLANNER_DISCOVERY_EXECUTABLE_INTENTS,
} from "./handlers/planner-discovery-handler.js";
export {
  createProductionPlannerDiscoveryPort,
  type PlannerDiscoveryPort,
  type PlannerDiscoveryItem,
  type PlannerDiscoverySearchResult,
} from "./handlers/planner-discovery-port.js";

// INT32 — eighteenth live capability binding (Diary Discovery — search food diary entries).
export {
  bindDiaryDiscoveryCapability,
  DIARY_DISCOVERY_CAPABILITY_ID,
  DIARY_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
} from "./bindings/diary-discovery.js";
export {
  createDiaryDiscoveryHandler,
  DIARY_DISCOVERY_EXECUTABLE_INTENTS,
} from "./handlers/diary-discovery-handler.js";
export {
  createProductionDiaryDiscoveryPort,
  type DiaryDiscoveryPort,
  type DiaryDiscoveryItem,
  type DiaryDiscoverySearchResult,
} from "./handlers/diary-discovery-port.js";

// INT31 — seventeenth live capability binding (Pantry Discovery — search pantry items).
export {
  bindPantryDiscoveryCapability,
  PANTRY_DISCOVERY_CAPABILITY_ID,
  PANTRY_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
} from "./bindings/pantry-discovery.js";
export {
  createPantryDiscoveryHandler,
  PANTRY_DISCOVERY_EXECUTABLE_INTENTS,
} from "./handlers/pantry-discovery-handler.js";
export {
  createProductionPantryDiscoveryPort,
  type PantryDiscoveryPort,
  type PantryDiscoveryItem,
  type PantryDiscoverySearchResult,
} from "./handlers/pantry-discovery-port.js";

// INT30 — sixteenth live capability binding (Shopping Discovery — search shopping list items).
export {
  bindShoppingDiscoveryCapability,
  SHOPPING_DISCOVERY_CAPABILITY_ID,
  SHOPPING_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
} from "./bindings/shopping-discovery.js";
export {
  createShoppingDiscoveryHandler,
  SHOPPING_DISCOVERY_EXECUTABLE_INTENTS,
} from "./handlers/shopping-discovery-handler.js";
export {
  createProductionShoppingDiscoveryPort,
  type ShoppingDiscoveryPort,
  type ShoppingDiscoveryItem,
  type ShoppingDiscoverySearchResult,
} from "./handlers/shopping-discovery-port.js";

// INT29 — fifteenth live capability binding (Household Discovery — search members, diet types, and allergens).
export {
  bindHouseholdDiscoveryCapability,
  HOUSEHOLD_DISCOVERY_CAPABILITY_ID,
  HOUSEHOLD_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
} from "./bindings/household-discovery.js";
export {
  createHouseholdDiscoveryHandler,
  HOUSEHOLD_DISCOVERY_EXECUTABLE_INTENTS,
} from "./handlers/household-discovery-handler.js";
export {
  createProductionHouseholdDiscoveryPort,
  type HouseholdDiscoveryPort,
  type HouseholdDiscoveryItem,
  type HouseholdDiscoverySearchResult,
} from "./handlers/household-discovery-port.js";

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

// FI3 — nineteenth live capability binding (read-only Food Intelligence Engine —
// the first Domain Intelligence capability: join+rank+explain over the Food
// Knowledge Registry plus, when a caller's own household resolves, household
// planner history and hard restrictions). Extended FI4 with a `report` verb
// (the ambient Food Opportunity Engine) on the SAME capability.
export {
  bindFoodIntelligenceReadCapability,
  FOOD_INTELLIGENCE_CAPABILITY_ID,
  FOOD_INTELLIGENCE_EXECUTABLE_INTENTS,
} from "./bindings/food-intelligence.js";
export {
  createFoodIntelligenceReadHandler,
  type FoodIntelligenceRecommendResult,
  type FoodIntelligenceExplainResult,
  type FoodOpportunityReportResult,
} from "./handlers/food-intelligence-read-handler.js";
export {
  createEngineFoodIntelligenceReadPort,
  type FoodIntelligenceReadPort,
} from "./handlers/food-intelligence-read-port.js";
export {
  assembleFoodIntelligence,
  resolveHouseholdSignal,
  NO_HOUSEHOLD_SIGNAL,
  type FoodIntelligenceRequest,
  type FoodIntelligenceBundle,
  type FoodIntelligenceRecommendation,
  type FoodIntelligenceCitation,
  type FoodIntelligenceHouseholdContext,
  type FoodIntelligenceTrust,
  type HouseholdSignal,
} from "./food-intelligence/engine.js";

// FI4 — the Food Opportunity Engine (ambient, sibling to the Food Intelligence
// Engine above): identifies and prioritises deterministic Food Opportunities
// from the caller's own existing planner, pantry and shopping activity.
export {
  identifyOpportunities,
  identifyPlannerGapOpportunities,
  identifyPantryUnusedOpportunities,
  identifyShoppingRestrictionOpportunities,
  prioritizeOpportunities,
  type FoodOpportunity,
  type FoodOpportunityType,
  type FoodOpportunityPriority,
  type FoodOpportunityDomain,
  type FoodOpportunityEvidence,
  type FoodOpportunityTrust,
  type FoodOpportunityBundle,
  type FoodOpportunityRequest,
} from "./food-intelligence/opportunity-engine.js";

// OD1 — twentieth live capability binding (Opportunity Delivery Framework): the
// platform's own governance layer over Domain Intelligence opportunity producers
// (today: food-intelligence's `report` verb, FI4). Prioritises and groups
// opportunities across producers, prevents duplicate delivery, selects a delivery
// surface, and supports acknowledge (`review`) / dismiss (`delete`) / accept
// (`approve`).
export {
  bindOpportunityDeliveryCapability,
  OPPORTUNITY_DELIVERY_CAPABILITY_ID,
  OPPORTUNITY_DELIVERY_EXECUTABLE_INTENTS,
} from "./bindings/opportunity-delivery.js";
export {
  createOpportunityDeliveryHandler,
  type OpportunityDeliveryReportResult,
  type OpportunityResolutionResult,
} from "./handlers/opportunity-delivery-handler.js";
export {
  createEngineOpportunityDeliveryReadPort,
  type OpportunityDeliveryReadPort,
} from "./handlers/opportunity-delivery-read-port.js";
export {
  collectOpportunities,
  resolveOpportunity,
  prioritiseAndGroup,
  selectSurface,
  filterMutedTypes,
  partitionForDelivery,
  type DeliverableOpportunity,
  type OpportunityPriority,
  type OpportunityEvidence,
  type OpportunityDeliveryTrust,
  type OpportunityDeliveryBundle,
  type OpportunityDeliveryRequest,
  type OpportunityResolution,
  type PrioritisedOpportunities,
  type DeliveryPartition,
  type ExistingDeliveryRecord,
  type ProducerFetch,
  type CollectOpportunitiesDeps,
} from "./opportunity-delivery/framework.js";
export {
  opportunityDeliveryStore,
  DatabaseOpportunityDeliveryStore,
  InMemoryOpportunityDeliveryStore,
  isTerminalDeliveryStatus,
  type IOpportunityDeliveryStore,
  type OpportunityDeliveryStatus,
  type NewOpportunityDelivery,
} from "./opportunity-delivery/delivery-store.js";

// EL1 — twenty-first live capability binding (Evidence & Learning Platform): captures
// structured household outcomes (`report`), accumulates them into an append-only
// evidence log, and deterministically detects explainable patterns over accumulated
// evidence (never a single observation). A detected pattern stays `pending_confirmation`
// - only an explicit household `approve`/`delete` ever changes that, and even then it
// only changes the signal's own record, never a business-domain preference itself.
export {
  bindEvidenceLearningCapability,
  EVIDENCE_LEARNING_CAPABILITY_ID,
  EVIDENCE_LEARNING_EXECUTABLE_INTENTS,
} from "./bindings/evidence-learning.js";
export {
  createEvidenceLearningHandler,
  type RecordOutcomeParams,
  type ListSignalsQuery,
  type DecideSignalInput,
  type EvidenceOutcomeResult,
  type LearningSignalsResult,
  type SignalDecisionResult,
} from "./handlers/evidence-learning-handler.js";
export {
  createStoreEvidenceLearningReadPort,
  type EvidenceLearningReadPort,
} from "./handlers/evidence-learning-read-port.js";
export {
  detectPatterns,
  groupEvents,
  bucketConfidence,
  recordOutcomeAndDetect,
  listHouseholdSignals,
  decideSignal,
  MIN_EVIDENCE_COUNT,
  MIN_CONSISTENCY,
  EVIDENCE_WINDOW_DAYS,
  type EvidenceEventInput,
  type DetectedPattern,
  type RecordOutcomeRequest,
  type RecordOutcomeResult,
} from "./evidence-learning/framework.js";
export {
  evidenceLearningStore,
  DatabaseEvidenceLearningStore,
  InMemoryEvidenceLearningStore,
  isDecidedSignalStatus,
  type IEvidenceLearningStore,
  type EvidenceDirection,
  type SignalDirection,
  type SignalConfidence,
  type SignalStatus,
  type NewEvidenceEvent,
  type EvidenceQuery,
  type DerivedSignalInput,
  type SignalQuery,
  type ConfirmSignalInput,
} from "./evidence-learning/evidence-learning-store.js";

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
