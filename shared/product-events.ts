export const EventTypes = {
  MEAL_SAVED: "meal_saved",
  MEAL_IMPORTED: "meal_imported",
  MEAL_IMPORT_FAILED: "meal_import_failed",
  MEAL_ADDED_TO_PLANNER: "meal_added_to_planner",
  MEAL_ADDED_TO_BASKET: "meal_added_to_basket",
  MEAL_FROZEN: "meal_frozen",

  PLANNER_MEAL_ADDED: "planner_meal_added",
  PLANNER_SENT_TO_BASKET: "planner_sent_to_basket",
  PLANNER_CLEARED: "planner_cleared",

  PANTRY_ITEM_ADDED: "pantry_item_added",
  PANTRY_SENT_TO_BASKET: "pantry_sent_to_basket",

  ANALYSER_SEARCH: "analyser_search_performed",
  PRODUCT_CLICKED: "product_clicked",

  QUICKLIST_SENT: "quicklist_sent_to_cyc",

  CYC_SKIP: "cyc_skip",
  CYC_HEAD_TO_SHOP: "cyc_head_to_shop",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export const FeatureAreas = {
  COOKBOOK: "cookbook",
  PLANNER: "planner",
  PANTRY: "pantry",
  ANALYSER: "analyser",
  SHOPPING: "shopping",
  CYC: "cyc",
} as const;

export type FeatureArea = (typeof FeatureAreas)[keyof typeof FeatureAreas];

export const ReasonCodes = {
  PARSE_ERROR: "parse_error",
  MATCH_FAILED: "match_failed",
  NO_RESULTS: "no_results",
  SAVE_FAILED: "save_failed",
} as const;

export type ReasonCode = (typeof ReasonCodes)[keyof typeof ReasonCodes];

export const EVENT_FEATURE_AREAS: Record<EventType, FeatureArea> = {
  meal_saved: "cookbook",
  meal_imported: "cookbook",
  meal_import_failed: "cookbook",
  meal_added_to_planner: "cookbook",
  meal_added_to_basket: "cookbook",
  meal_frozen: "cookbook",
  planner_meal_added: "planner",
  planner_sent_to_basket: "planner",
  planner_cleared: "planner",
  pantry_item_added: "pantry",
  pantry_sent_to_basket: "pantry",
  analyser_search_performed: "analyser",
  product_clicked: "analyser",
  quicklist_sent_to_cyc: "shopping",
  cyc_skip: "cyc",
  cyc_head_to_shop: "cyc",
};

// Only these fields may appear in the metadata JSONB column.
// No raw user input, no full URLs, no stack traces.
export const ALLOWED_METADATA_FIELDS = new Set([
  "reasonCode",
  "failureStage",
  "inputType",
  "itemCount",
  "source",
  "retailer",
  "domain",
]);

// Events that drive lifetime counter increments in activity_summary
export const LIFETIME_INCREMENT_EVENTS = new Set<EventType>([
  "meal_saved",
  "meal_imported",
  "planner_meal_added",
  "meal_added_to_planner",
  "pantry_item_added",
  "planner_sent_to_basket",
  "pantry_sent_to_basket",
  "quicklist_sent_to_cyc",
]);

// Client-side events accepted via POST /api/events/track
export const CLIENT_TRACKABLE_EVENTS = new Set<EventType>([
  "quicklist_sent_to_cyc",
  "cyc_skip",
  "cyc_head_to_shop",
  "product_clicked",
]);

export interface ProductEventMetadata {
  reasonCode?: string;
  failureStage?: string;
  inputType?: string;
  itemCount?: number;
  source?: string;
  retailer?: string;
  domain?: string;
}
