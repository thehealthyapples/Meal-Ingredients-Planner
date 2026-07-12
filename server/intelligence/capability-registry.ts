/**
 * THA AI Capability Registry — runtime
 * ====================================
 * The single canonical allow-list of capabilities the Intelligence Platform may
 * touch. Each entry is a *descriptor of an existing owner* (service + API + SoT
 * owner) — the registry reads ownership, it never re-declares or re-owns anything
 * (TIP2 §2, §5.3 "one owner per capability").
 *
 * This is a DERIVED PROJECTION of the live route table + the Source of Truth
 * Register. It is rebuildable from source and is never an authoritative second
 * store (Principle 7 — no permanent synchronisation bridge).
 *
 * INT1 SCOPE: placeholder registrations representing EXISTING platform services
 * only. No new business capability is invented. No execution handler is bound —
 * every capability is "registered" (metadata), not yet "available" (executable).
 * Honest GAPs (TIP2 §2.4) are recorded as gaps, never fabricated owners.
 */

import type {
  Capability,
  CapabilityEnrichment,
  CapabilityGuidance,
  CapabilityHandler,
  CompletionCriterion,
  IntentVerb,
} from "./types.js";

// ---------------------------------------------------------------------------
// Capability Guidance seed (INT39) — extends the capability seed below with
// structured "where to next" guidance, keyed by capability id. Declared
// separately from SEED_CAPABILITIES purely for readability; it is merged
// into each capability record before registration, so guidance remains a
// first-class part of the capability's own descriptor (TIP2 discipline: a
// capability record is a complete descriptor of an existing owner).
//
// Mirrors the exact journeys INT38 proved out as a static Companion-owned
// JOURNEY_MAP (nutrition→meal→planner, meal→planner→shopping, etc.) — INT39
// moves that same knowledge onto the capabilities it describes, and adds
// lateral `relatedActions`, named `recommendedJourneys`, and honest
// `completionCriteria`. Every action here is a real (capabilityId, verb)
// pair; resolution always re-checks executability against the live registry,
// so a guidance action can never point at a gapped or unbound capability.
// ---------------------------------------------------------------------------

const GUIDANCE: Readonly<Record<string, CapabilityGuidance>> = {
  "nutrition-knowledge": {
    primaryAction: { capabilityId: "meals", verb: "read", label: "Find Matching Meals" },
    relatedActions: [
      { capabilityId: "meal-discovery", verb: "search", label: "Search Meals by Nutrition" },
    ],
    followUpActions: [
      { capabilityId: "planner", verb: "read", label: "Plan This Week" },
    ],
    recommendedJourneys: [
      { capabilityId: "nutrition-knowledge", verb: "read", label: "Understand the Nutrition" },
      { capabilityId: "meals", verb: "read", label: "Find Matching Meals" },
      { capabilityId: "planner", verb: "read", label: "Plan This Week" },
    ],
    completionCriteria: [
      {
        id: "planned-after-nutrition",
        description: "The user moved from a nutrition answer into planning their week.",
        satisfiedByAction: { capabilityId: "planner", verb: "read", label: "Plan This Week" },
      },
    ],
  },
  meals: {
    primaryAction: { capabilityId: "planner", verb: "read", label: "Plan Your Week" },
    relatedActions: [
      { capabilityId: "nutrition-knowledge", verb: "read", label: "Check Nutrition Info" },
    ],
    followUpActions: [
      { capabilityId: "shopping", verb: "read", label: "Build Shopping List" },
    ],
    recommendedJourneys: [
      { capabilityId: "meals", verb: "read", label: "Find a Meal" },
      { capabilityId: "planner", verb: "read", label: "Plan Your Week" },
      { capabilityId: "shopping", verb: "read", label: "Build Shopping List" },
    ],
    completionCriteria: [
      {
        id: "planned-after-meal",
        description: "The user moved from a meal answer into planning their week.",
        satisfiedByAction: { capabilityId: "planner", verb: "read", label: "Plan Your Week" },
      },
    ],
  },
  shopping: {
    primaryAction: { capabilityId: "pantry", verb: "read", label: "Compare with Pantry" },
    relatedActions: [
      { capabilityId: "partners", verb: "read", label: "Compare Supermarkets" },
    ],
    followUpActions: [
      { capabilityId: "planner", verb: "read", label: "Review Your Plan" },
    ],
    recommendedJourneys: [
      { capabilityId: "shopping", verb: "read", label: "Check Your Shopping List" },
      { capabilityId: "pantry", verb: "read", label: "Compare with Pantry" },
      { capabilityId: "planner", verb: "read", label: "Review Your Plan" },
    ],
    completionCriteria: [
      {
        id: "pantry-checked-after-shopping",
        description: "The user compared their shopping list against their pantry.",
        satisfiedByAction: { capabilityId: "pantry", verb: "read", label: "Compare with Pantry" },
      },
    ],
  },
  planner: {
    primaryAction: { capabilityId: "nutrition-knowledge", verb: "read", label: "Check Nutrition Balance" },
    relatedActions: [
      { capabilityId: "household", verb: "read", label: "Check Household Preferences" },
    ],
    followUpActions: [
      { capabilityId: "shopping", verb: "read", label: "Build Shopping List" },
    ],
    recommendedJourneys: [
      { capabilityId: "planner", verb: "read", label: "Review Your Plan" },
      { capabilityId: "nutrition-knowledge", verb: "read", label: "Check Nutrition Balance" },
      { capabilityId: "shopping", verb: "read", label: "Build Shopping List" },
    ],
    completionCriteria: [
      {
        id: "shopping-built-after-planning",
        description: "The user moved from a plan answer into building a shopping list.",
        satisfiedByAction: { capabilityId: "shopping", verb: "read", label: "Build Shopping List" },
      },
    ],
  },
  pantry: {
    primaryAction: { capabilityId: "meals", verb: "read", label: "Find Meals I Can Cook" },
    relatedActions: [
      { capabilityId: "pantry-discovery", verb: "search", label: "Search What I Have" },
    ],
    followUpActions: [
      { capabilityId: "planner", verb: "read", label: "Plan With What I Have" },
    ],
    recommendedJourneys: [
      { capabilityId: "pantry", verb: "read", label: "Check What's In My Pantry" },
      { capabilityId: "meals", verb: "read", label: "Find Meals I Can Cook" },
      { capabilityId: "planner", verb: "read", label: "Plan With What I Have" },
    ],
    completionCriteria: [
      {
        id: "planned-after-pantry",
        description: "The user moved from a pantry answer into planning around what they have.",
        satisfiedByAction: { capabilityId: "planner", verb: "read", label: "Plan With What I Have" },
      },
    ],
  },
  diary: {
    primaryAction: { capabilityId: "nutrition-knowledge", verb: "read", label: "See Nutrition Insights" },
    followUpActions: [
      { capabilityId: "planner", verb: "read", label: "Adjust This Week's Plan" },
    ],
    recommendedJourneys: [
      { capabilityId: "diary", verb: "read", label: "Review What Was Eaten" },
      { capabilityId: "nutrition-knowledge", verb: "read", label: "See Nutrition Insights" },
      { capabilityId: "planner", verb: "read", label: "Adjust This Week's Plan" },
    ],
    completionCriteria: [
      {
        id: "adjusted-after-diary",
        description: "The user moved from a diary answer into adjusting their plan.",
        satisfiedByAction: { capabilityId: "planner", verb: "read", label: "Adjust This Week's Plan" },
      },
    ],
  },
  household: {
    primaryAction: { capabilityId: "planner", verb: "read", label: "Plan Around Preferences" },
    recommendedJourneys: [
      { capabilityId: "household", verb: "read", label: "Check Household Preferences" },
      { capabilityId: "planner", verb: "read", label: "Plan Around Preferences" },
    ],
    completionCriteria: [
      {
        id: "planned-after-household",
        description: "The user moved from a household answer into planning around preferences.",
        satisfiedByAction: { capabilityId: "planner", verb: "read", label: "Plan Around Preferences" },
      },
    ],
  },
  "food-intelligence": {
    primaryAction: { capabilityId: "meals", verb: "read", label: "Find Matching Meals" },
    followUpActions: [
      { capabilityId: "planner", verb: "read", label: "Plan This Week" },
    ],
    recommendedJourneys: [
      { capabilityId: "food-intelligence", verb: "recommend", label: "Get Food Recommendations" },
      { capabilityId: "meals", verb: "read", label: "Find Matching Meals" },
      { capabilityId: "planner", verb: "read", label: "Plan This Week" },
    ],
    completionCriteria: [
      {
        id: "planned-after-food-intelligence",
        description: "The user moved from a Food Intelligence recommendation into planning their week.",
        satisfiedByAction: { capabilityId: "planner", verb: "read", label: "Plan This Week" },
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Capability Enrichment seed (INT41) — extends the capability seed below with
// structured contextual insights, explanations, recommendations and
// educational content, keyed by capability id. Declared separately for
// readability and merged into each capability record before registration,
// the same way GUIDANCE above is merged (TIP2 discipline: a capability
// record is a complete descriptor of an existing owner).
//
// Content here is static, evergreen and capability-owned — never a live
// computation, never personalised, never a health/medical claim (the
// EFSA/health-claim firewall enforced in the LLM system prompt applies
// equally to this static content). It is presented alongside a turn's
// primary answer as additional context, never as a replacement for it.
// ---------------------------------------------------------------------------

const ENRICHMENT: Readonly<Record<string, CapabilityEnrichment>> = {
  "nutrition-knowledge": {
    items: [
      {
        kind: "explanation",
        title: "Where these figures come from",
        body: "Nutrition figures are recorded per serving from the food's own source — not adjusted for how much of it ends up in a specific meal.",
      },
      {
        kind: "educational",
        title: "Balance over any single food",
        body: "How a day's meals balance together generally matters more than any one food eaten in isolation.",
      },
      {
        // NUT1 — richer, evidence-based framing for "explain" turns, where the
        // owner is surfacing a specific food↔benefit link. Educational only:
        // explains HOW a link was established, never a disease/treatment claim.
        kind: "educational",
        title: "How a food↔benefit link is established",
        body: "Each benefit shown for a food is one the Nutrition / Knowledge owner has explicitly linked and reviewed — never inferred from a nutrient amount alone.",
        appliesToVerbs: ["explain"],
      },
      {
        // NUT1 — richer guidance for "search" turns, pointing at the two other
        // ways to browse the same source-gated registry (by nutrient, by
        // benefit) rather than only by food name.
        kind: "recommendation",
        title: "Search by nutrient or benefit, too",
        body: "The same registry can be browsed by a nutrient (e.g. \"iron\") or a health benefit (e.g. \"gut health\"), not just by a food's name.",
        appliesToVerbs: ["search"],
      },
    ],
  },
  meals: {
    items: [
      {
        kind: "recommendation",
        title: "Build your own cookbook",
        body: "Saving meals you cook often makes them easy to find again and to reuse when planning future weeks.",
        appliesToVerbs: ["read", "search"],
      },
    ],
  },
  planner: {
    items: [
      {
        kind: "educational",
        title: "Plan ahead, decide less",
        body: "Filling in a few days of your planner in advance means fewer last-minute decisions about what to cook.",
      },
    ],
  },
  shopping: {
    items: [
      {
        kind: "insight",
        title: "Group by category",
        body: "Shopping list items grouped by category are typically faster to work through in-store than an unsorted list.",
      },
    ],
  },
  pantry: {
    items: [
      {
        kind: "recommendation",
        title: "Check before you shop",
        body: "Comparing your shopping list against your pantry first helps avoid buying something you already have.",
      },
    ],
  },
  diary: {
    items: [
      {
        kind: "explanation",
        title: "Log as you go",
        body: "A diary entry logged soon after eating tends to be more complete than one reconstructed from memory later.",
      },
    ],
  },
  household: {
    items: [
      {
        kind: "educational",
        title: "Preferences are per member",
        body: "Dietary preferences and allergen restrictions are set per household member, so meal matching can account for everyone individually.",
      },
    ],
  },
  "food-intelligence": {
    items: [
      {
        kind: "explanation",
        title: "No citation, no card",
        body: "Every recommendation is shown only because the Food Knowledge Registry already links that food to the requested benefit or nutrient — nothing here is inferred or ranked by an AI model.",
      },
      {
        kind: "educational",
        title: "Household-aware, never household-fabricated",
        body: "When you're signed in, recommendations may reflect meals your own household has already planned and exclude anything conflicting with a stored hard restriction — nothing is guessed about a household THA has no data for.",
      },
      {
        // FI4 — explains the ambient Opportunity Engine's `report` verb: suggestions
        // only, never an autonomous action taken on the household's behalf.
        kind: "explanation",
        title: "Opportunities are suggestions, not actions",
        body: "Food Opportunities are generated from your own existing planner, pantry and shopping activity and are always suggestions for you to act on — nothing is added, changed or removed on your behalf.",
        appliesToVerbs: ["report"],
      },
    ],
  },
  "opportunity-delivery": {
    items: [
      {
        // OD1 — mirrors food-intelligence's own "suggestions, not actions" framing,
        // applied to the delivery/resolution layer above it.
        kind: "explanation",
        title: "Opportunities are suggestions, not actions",
        body: "Dismissing, acknowledging or accepting an opportunity only updates its own delivery record — it never adds, changes or removes anything in your planner, pantry or shopping list.",
      },
    ],
  },
  "evidence-learning": {
    items: [
      {
        // EL1 — the non-negotiable this whole platform exists to enforce.
        kind: "explanation",
        title: "Patterns, never a single event",
        body: "A pattern only appears once enough consistent outcomes have accumulated for the same thing — one accepted or rejected meal never becomes a learned pattern on its own.",
      },
      {
        kind: "explanation",
        title: "Nothing changes until you say so",
        body: "Confirming or declining a pattern only updates that pattern's own record — it never changes a dietary preference, restriction or setting by itself. Any actual change to your household's preferences always happens as its own separate, visible step.",
        appliesToVerbs: ["approve", "delete"],
      },
    ],
  },
};

/** An honest gap: a desired (verb × capability) with no owning endpoint today (TIP2 §2.4). */
export interface CapabilityGap {
  readonly capabilityId: string;
  readonly verb: IntentVerb;
  readonly reason: string;
}

// ---------------------------------------------------------------------------
// Canonical capability seed (TIP2 §2.1 — C1..C13). Real owners / services / APIs.
// ---------------------------------------------------------------------------

const SEED_CAPABILITIES_BASE: readonly Capability[] = [
  {
    id: "planner",
    displayName: "Planner",
    description: "Weekly meal planning — weeks, days, and entries.",
    owner: "DB planner_weeks / planner_days / planner_entries (SoT D14)",
    owningService: "server/lib/meal-service.ts, planner-compliance.ts, meal-resolution-service.ts",
    apiSurface: "/api/planner/*",
    supportedIntents: ["read", "explain", "recommend", "generate", "add", "move", "replace", "delete", "import", "share"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "destructive",
    aiAccess: "W!",
    availability: "registered",
  },
  {
    id: "shopping",
    displayName: "Shopping",
    description: "Shopping list and basket preparation.",
    owner: "DB shopping_list / shopping_list_extras (SoT D15)",
    owningService: "server/lib/grocery-integration.ts, supermarket-basket-service.ts, price-lookup.ts",
    apiSurface: "/api/shopping-list/*, /api/shopping/*, /api/basket/*",
    supportedIntents: ["read", "explain", "add", "delete", "generate"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "write",
    aiAccess: "W",
    availability: "registered",
  },
  {
    id: "nutrition-knowledge",
    displayName: "Nutrition / Knowledge",
    description:
      "Read-only nutrition and food knowledge (source-gated) — foods, nutrients, health benefits, " +
      "and (PHASE5A) preparation knowledge: how a food is cooked, preserved and prepared, plus any " +
      "evidence-gated effect that preparation has. A preparation's EXISTENCE is stated freely; a " +
      "preparation's EFFECT is stated only where a cited, human-signed-off claim earns it, and is an " +
      "honest gap otherwise (WS5A).",
    owner: "WS0 knowledge_* tables (SoT D1)",
    owningService: "server/services/nutrition-knowledge-registry.ts, nutrition-centre-assembler.ts",
    apiSurface: "/api/knowledge/*, /api/nutrition*, /api/food-knowledge/*",
    supportedIntents: ["read", "explain", "search", "analyse", "compare", "report"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: false, audited: false },
    capabilityClass: "read-only",
    aiAccess: "R",
    availability: "registered",
  },
  {
    // PHASE5A — the knowledge of what THA ITSELF is. The platform's fifth
    // knowledge domain (PKCA §9) and its first SELF-DESCRIBING one: the subject
    // and the source are the same system.
    //
    // That inverts the evidence problem. For food, nutrition and recipes the
    // enemy is FABRICATION — THA can be wrong about an external world. Here THA
    // *is* the source: it cannot fabricate a Planner page it does not ship. The
    // enemy is STALENESS — a product fact is wrong because it STOPPED being
    // true, and a stale entry is indistinguishable from a fresh one by reading
    // it (PKCA Rule KC14).
    //
    // Registered exactly like every other capability, and deliberately not
    // privileged: it is a Knowledge Capability, not a special case.
    id: "product-knowledge",
    displayName: "Product Knowledge",
    description:
      "Read-only, permission-aware knowledge of what The Healthy Apples itself is — its domains, " +
      "pages, journeys, capabilities, integrations, settings, claims and glossary. The single owner " +
      "of every sentence THA says about itself: the Companion QUERIES this capability and may never " +
      "duplicate product knowledge into a prompt, template or fallback string (Rule PKR27). Every " +
      "entry carries a visibility tier, and content above the caller's tier is dropped BEFORE the " +
      "prompt is composed — never placed in context with an instruction to withhold it (Rule PKR26).",
    owner:
      "The Product Knowledge Registry, docs/product/ — authored as inventory/product.yaml, generated " +
      "to inventory/product.json, which is the ONLY artefact the Intelligence Platform ever reads " +
      "(PKR1 §18, Rule PKR21). Canonical owner of the Product Knowledge domain (PKCA §9.2).",
    owningService: "server/services/product-knowledge-registry.ts",
    apiSurface: "(platform-internal only — no HTTP route; the registry is documentation, read through this capability)",
    supportedIntents: ["read", "explain", "search", "report"],
    executableIntents: [],
    // knowledgeClass is "public" because the CAPABILITY is reachable by anyone —
    // per-ENTRY visibility is what actually gates disclosure, and it is enforced
    // inside the owner, before composition. The registry classifies; access.ts
    // authorises (Rule PKR25). This class is not, and must never become, the
    // permission boundary for a product fact.
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: false, audited: false },
    capabilityClass: "read-only",
    aiAccess: "R",
    availability: "registered",
  },
  {
    id: "meals",
    displayName: "Cookbook / Meals",
    description: "Meals and recipe composition.",
    owner: "DB meals + meal_items (SoT D12)",
    owningService: "server/lib/meal-service.ts, recipe-swap-engine.ts, meal-resolution-service.ts",
    apiSurface: "/api/meals/*, /api/meal-items/*",
    supportedIntents: ["read", "explain", "search", "recommend", "generate", "add", "replace", "delete", "import", "share"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "destructive",
    aiAccess: "W!",
    availability: "registered",
  },
  {
    id: "meal-discovery",
    displayName: "Meal Discovery",
    description: "Cross-source recipe and meal discovery — personal cookbook, THA library, meal templates, and (Phase 2) external recipe sources.",
    owner: "MealDiscoveryEngine (INT26) — reads meals + meal_templates via storage; no owned table",
    owningService: "server/intelligence/services/meal-discovery-engine.ts",
    apiSurface: "(platform-internal only — no dedicated HTTP route; Phase 2 will proxy external APIs)",
    supportedIntents: ["search", "recommend"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "read-only",
    aiAccess: "R",
    discoveryOf: "meals",
    availability: "registered",
  },
  {
    id: "diary",
    displayName: "Diary",
    description: "Food diary logging.",
    owner: "DB food_diary_* (SoT D21)",
    owningService: "routes-resident diary logic + meal-resolution-service.ts",
    apiSurface: "/api/food-diary/*",
    supportedIntents: ["read", "explain", "add", "delete", "import"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "write",
    aiAccess: "W",
    availability: "registered",
  },
  {
    id: "profile",
    displayName: "Profile / Preferences",
    description: "User profile and preferences (own data only).",
    owner: "DB user_preferences + users.* (SoT D7, D26, D27)",
    owningService: "server/lib/sanitizeUser.ts, routes-resident profile logic",
    apiSurface: "/api/profile, /api/user/preferences, /api/user/*-settings",
    supportedIntents: ["read", "explain", "add"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "write",
    aiAccess: "W",
    availability: "registered",
  },
  {
    id: "partners",
    displayName: "Partners / Supermarkets",
    description: "Retailer mapping, routing and savings (advisory).",
    owner: "server/lib/retailIntelligence.ts + grocery-integration.ts",
    owningService: "server/lib/retailIntelligence.ts, product-matching-service.ts, price-lookup.ts",
    apiSurface: "/api/basket/supermarkets-enhanced, /api/routing, /api/savings/*",
    supportedIntents: ["read", "explain", "recommend", "compare"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: false, audited: false },
    capabilityClass: "ai-assisted",
    aiAccess: "R+A",
    availability: "registered",
  },
  {
    id: "pantry",
    displayName: "Pantry",
    description: "Pantry items plus discovery / alternatives / stories (read).",
    owner: "DB userPantryItems + WS8–11 engines (SoT D8–11)",
    owningService: "shared/discovery, shared/alternatives, shared/stories, shared/seasonal, item-resolver.ts",
    apiSurface: "/api/pantry/*, /api/user-items/*, /api/freezer/*",
    supportedIntents: ["read", "explain", "search", "recommend", "add", "delete"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "write",
    aiAccess: "W",
    availability: "registered",
  },
  {
    id: "analyser",
    displayName: "Analyser (Product / UPF)",
    description: "Product and ultra-processed-food analysis (advisory).",
    owner: "server/lib/product-analysis.ts + upf-analysis-service.ts (SoT D19)",
    owningService: "server/lib/product-analysis.ts, ocr.ts, openfoodfacts-importer.ts",
    apiSurface: "/api/scan, /api/products/barcode/:barcode, /api/additives",
    supportedIntents: ["read", "explain", "analyse", "report"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: false, audited: false },
    capabilityClass: "ai-assisted",
    aiAccess: "R+A",
    availability: "registered",
  },
  {
    id: "household",
    displayName: "Household",
    description: "Household membership and eaters.",
    owner: "DB households / household_members / household_eaters (SoT D16)",
    owningService: "server/lib/household.ts, household-meal-matcher.ts",
    apiSurface: "/api/household/*",
    supportedIntents: ["read", "explain", "add", "delete"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "destructive",
    aiAccess: "W!",
    availability: "registered",
  },
  {
    id: "templates",
    displayName: "Plan Templates",
    description: "Meal and plan templates (publish gated by admin).",
    owner: "DB meal_templates / meal_plan_templates (SoT D13)",
    owningService: "server/template-migration.ts, meal-food-intelligence.ts",
    apiSurface: "/api/plan-templates/*, /api/meal-templates/*",
    supportedIntents: ["read", "explain", "search", "recommend", "generate", "add", "import", "delete", "share"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "write",
    aiAccess: "W",
    availability: "registered",
  },
  {
    id: "nutrition-discovery",
    displayName: "Nutrition Discovery",
    description: "Discover meals matching a nutritional criterion — calorie ceiling, protein floor, macro balance.",
    owner: "nutrition table joined to meals (SoT: nutrition + meals tables)",
    owningService: "server/intelligence/services/nutrition-discovery-engine.ts",
    apiSurface: "/api/nutrition* (bulk lookup; no dedicated filter route — filter is platform-internal)",
    supportedIntents: ["search", "recommend"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "read-only",
    aiAccess: "R",
    discoveryOf: "nutrition-knowledge",
    availability: "registered",
  },
  {
    id: "planner-discovery",
    displayName: "Planner Discovery",
    description: "Search for meals within your planner — find what you have planned across all weeks.",
    owner: "planner_weeks / planner_days / planner_entries joined to meals (SoT D14)",
    owningService: "server/intelligence/services/planner-discovery-engine.ts",
    apiSurface: "(platform-internal only — reads planner_weeks, planner_entries, meals via storage)",
    supportedIntents: ["search"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "read-only",
    aiAccess: "R",
    discoveryOf: "planner",
    availability: "registered",
  },
  {
    id: "pantry-discovery",
    displayName: "Pantry Discovery",
    description: "Search items in your pantry — find what you have in your larder, fridge, or freezer.",
    owner: "user_pantry_items (SoT D9)",
    owningService: "server/intelligence/services/pantry-discovery-engine.ts",
    apiSurface: "(platform-internal only — reads user_pantry_items via storage)",
    supportedIntents: ["search"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "read-only",
    aiAccess: "R",
    discoveryOf: "pantry",
    availability: "registered",
  },
  {
    id: "diary-discovery",
    displayName: "Diary Discovery",
    description: "Search your food diary entries — find what you've eaten across dates and meal slots.",
    owner: "food_diary_entries + food_diary_days (SoT D11)",
    owningService: "server/intelligence/services/diary-discovery-engine.ts",
    apiSurface: "(platform-internal only — reads food_diary_entries via storage.getDiaryEntriesForDiscovery)",
    supportedIntents: ["search"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "read-only",
    aiAccess: "R",
    discoveryOf: "diary",
    availability: "registered",
  },
  {
    id: "shopping-discovery",
    displayName: "Shopping Discovery",
    description: "Search items on your shopping list — find what you need to buy, by name or category.",
    owner: "shopping_list (SoT D4)",
    owningService: "server/intelligence/services/shopping-discovery-engine.ts",
    apiSurface: "(platform-internal only — reads shopping_list via storage)",
    supportedIntents: ["search"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "read-only",
    aiAccess: "R",
    discoveryOf: "shopping",
    availability: "registered",
  },
  {
    id: "household-discovery",
    displayName: "Household Discovery",
    description: "Search for members of your household — find who's in your household, their dietary preferences, and allergen restrictions.",
    owner: "households / household_members / household_eaters (SoT D13)",
    owningService: "server/intelligence/services/household-discovery-engine.ts",
    apiSurface: "(platform-internal only — reads households, household_members, household_eaters via storage)",
    supportedIntents: ["search"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "read-only",
    aiAccess: "R",
    discoveryOf: "household",
    availability: "registered",
  },
  {
    id: "food-intelligence",
    displayName: "Food Intelligence",
    description: "Deterministic join + rank + explain recommendations composed from the Food Knowledge Registry and (when a caller's own household resolves) household planner history and hard restrictions — plus (FI4) an ambient Opportunity Engine that identifies and prioritises actionable Food Opportunities from the caller's own existing planner, pantry and shopping activity, and (COMP1) a Comparison Engine that composes structured, cited comparisons of two or more named foods/products from existing owners (canonical seed, evidence-gated knowledge, the caller's own scan history, household context) with honest gaps. The foundation Domain Intelligence engine consumed by Companion today, and by Planner/Shopping/Cookbook/Pantry in future workstreams (FI3, extended FI4, COMP1).",
    owner: "server/intelligence/food-intelligence/engine.ts + opportunity-engine.ts + comparison-engine.ts (FI3/FI4/COMP1 — Domain Intelligence owner per THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §2, §7.1; composes WS0 knowledge_* (SoT D1), canonical seed (shared/canonical), product_history (caller-scoped scan records), household_eaters (SoT D16), planner history (SoT D14), pantry items (SoT D8-11) and shopping list (SoT D15); owns zero business-domain data, Rule FI1)",
    owningService: "server/intelligence/food-intelligence/engine.ts, opportunity-engine.ts, comparison-engine.ts",
    apiSurface: "(platform-internal only — no dedicated HTTP route; consumed via the registered capability, not a private route)",
    supportedIntents: ["recommend", "explain", "report", "compare"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: false, audited: false },
    capabilityClass: "read-only",
    aiAccess: "R",
    availability: "registered",
  },
  {
    id: "opportunity-delivery",
    displayName: "Opportunity Delivery Framework",
    description: "The canonical, cross-cutting framework governing how Domain Intelligence opportunities (today: FI4's ambient Food Opportunities) are prioritised, grouped, deduplicated and surfaced across the platform, and how a caller acknowledges (review), dismisses (delete) or accepts (approve) one. Owns zero business-domain data and zero producer reasoning — every opportunity's content is a verbatim projection of what a registered producer capability already returned (OD1).",
    owner: "server/intelligence/opportunity-delivery/framework.ts + delivery-store.ts (OD1 — the platform's own governance layer per THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md; delivery-store.ts is the sole owner of the new opportunity_deliveries table, SoT-registered under OD1)",
    owningService: "server/intelligence/opportunity-delivery/framework.ts, delivery-store.ts",
    apiSurface: "(platform-internal only — no dedicated HTTP route; consumed via the registered capability, not a private route)",
    supportedIntents: ["report", "review", "approve", "delete"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "write",
    aiAccess: "W",
    availability: "registered",
  },
  {
    id: "evidence-learning",
    displayName: "Evidence & Learning Platform",
    description: "The canonical, cross-cutting platform that captures structured household outcomes (report), accumulates them into an append-only evidence log, and deterministically detects patterns over accumulated evidence — never from a single observation. A detected pattern is a pending, explainable signal (its supporting evidence and rationale are always shown) until a household explicitly confirms (approve) or declines (delete) it. Owns zero business-domain/preference data — confirming a signal only changes its own status; adapting an actual household preference on the strength of a confirmed signal remains a separate, human-triggered write through that preference store's own owning capability (EL1).",
    owner: "server/intelligence/evidence-learning/framework.ts + evidence-learning-store.ts (EL1 — a reusable platform capability per THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §4.2/§7.2's forward-named \"Personalisation Event Log\", generalised beyond Food Intelligence so any future Domain Intelligence layer can be a consumer; evidence-learning-store.ts is the sole owner of the new household_evidence_events and household_learning_signals tables, SoT-registered under EL1)",
    owningService: "server/intelligence/evidence-learning/framework.ts, evidence-learning-store.ts",
    apiSurface: "(platform-internal only — no dedicated HTTP route; consumed via the registered capability, not a private route)",
    supportedIntents: ["report", "search", "approve", "delete"],
    executableIntents: [],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "write",
    aiAccess: "W",
    availability: "registered",
  },
  {
    id: "administration",
    displayName: "Administration",
    description: "Admin operations — users, sources, classifications. Admin role only.",
    owner: "server/lib/access.ts + admin_audit_log",
    owningService: "server/storage.ts (admin methods), auto-import-service.ts, backfill-classifier.ts",
    apiSurface: "/api/admin/*",
    supportedIntents: ["read", "explain", "report", "review", "approve", "import", "export", "add", "delete"],
    executableIntents: [],
    permissions: { minimumRole: "admin", knowledgeClass: "admin", ownershipScoped: false, audited: true },
    capabilityClass: "human-confirmation-required",
    aiAccess: "W!",
    availability: "registered",
  },
  {
    id: "developer",
    displayName: "Developer / Platform",
    description: "Architecture/workflow knowledge — isolated developer plane only; never user plane.",
    owner: "repo + docs/ + SoT Register",
    owningService: "n/a (read tooling, isolated dev plane)",
    apiSurface: "n/a (no production route)",
    supportedIntents: ["read", "explain", "report"],
    executableIntents: [],
    permissions: { minimumRole: "developer", knowledgeClass: "developer", ownershipScoped: false, audited: true },
    capabilityClass: "read-only",
    aiAccess: "never",
    // TIP1 §7: the developer plane is PHYSICALLY isolated; in this (canonical
    // user-facing) registry the capability must never be reachable. A future
    // developer-plane deployment would register it as "registered"/"available"
    // in its own isolated registry instance.
    availability: "never",
  },
];

/**
 * INT39 — the Capability Guidance Registry seed, merged onto the base
 * capability descriptors. `guidance` is attached ONLY when the GUIDANCE table
 * above declares it for that id — every other capability is left exactly as
 * it was (no fabricated default guidance). This is the extension point: a
 * future capability declares its own guidance the same way, in GUIDANCE
 * above, with zero change to CapabilityRegistry itself.
 *
 * INT41 — the Capability Enrichment Registry seed is merged the same way,
 * from ENRICHMENT above, attached ONLY when declared for that id.
 */
const SEED_CAPABILITIES: readonly Capability[] = SEED_CAPABILITIES_BASE.map((cap) => {
  const withGuidance = GUIDANCE[cap.id] ? { ...cap, guidance: GUIDANCE[cap.id] } : cap;
  return ENRICHMENT[cap.id] ? { ...withGuidance, enrichment: ENRICHMENT[cap.id] } : withGuidance;
});

/** Honest GAPs (TIP2 §2.4) — desired intents THA does not own an endpoint for yet. */
const SEED_GAPS: readonly CapabilityGap[] = [
  { capabilityId: "shopping", verb: "order", reason: "No checkout/retailer-order endpoint exists; basket build ≠ order placement. Prepare-basket + hand-off only (Rule 8)." },
  { capabilityId: "planner", verb: "delete", reason: "Deleting the whole week *record* is a GAP — only clearing week entries exists. Entry-level delete is supported; week-object delete is not." },
  { capabilityId: "product-knowledge", verb: "report", reason: "A report ON THE PRODUCT would require the platform to select, order and summarise what matters about THA. That is an editorial judgement belonging to the registry's named human owners, not to the Intelligence Platform. Entries are read, searched and explained individually; they are not summarised into a narrative THA never wrote (PHASE5A)." },
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * The Capability Registry. Holds capability descriptors and (in future) their
 * execution handlers. New capabilities can be registered without any architectural
 * change — this is the extension point the platform was built around.
 */
export class CapabilityRegistry {
  private readonly capabilities = new Map<string, Capability>();
  private readonly handlers = new Map<string, CapabilityHandler>();
  private readonly gaps: CapabilityGap[] = [];

  constructor(seed: readonly Capability[] = SEED_CAPABILITIES, gaps: readonly CapabilityGap[] = SEED_GAPS) {
    for (const cap of seed) this.register(cap);
    for (const gap of gaps) this.registerGap(gap);
    this.validateDiscoveryRelationships();
  }

  /** Register (or replace) a capability descriptor. */
  register(capability: Capability): void {
    this.capabilities.set(capability.id, capability);
  }

  /** Record an honest gap for a (capability, verb) pair. */
  registerGap(gap: CapabilityGap): void {
    this.gaps.push(gap);
  }

  /**
   * Bind an execution handler to a capability, marking it "available" and recording
   * exactly which verbs the handler implements (executableIntents). The binder must
   * declare the verbs it will actually execute — not every verb in supportedIntents,
   * only those the handler has a real code path for. This keeps discovery truthful
   * and prevents over-advertising functionality (INT6A).
   *
   * executableIntents must be a subset of the capability's supportedIntents. An empty
   * list is valid for the INT1 foundation state (handler exists but executes nothing yet).
   */
  bindHandler(
    capabilityId: string,
    handler: CapabilityHandler,
    executableIntents: readonly IntentVerb[] = [],
  ): void {
    const cap = this.capabilities.get(capabilityId);
    if (!cap) throw new Error(`Cannot bind handler: unknown capability "${capabilityId}"`);
    this.handlers.set(capabilityId, handler);
    this.capabilities.set(capabilityId, { ...cap, availability: "available", executableIntents });
  }

  /** Capability discovery — lookup by id. */
  get(capabilityId: string): Capability | undefined {
    return this.capabilities.get(capabilityId);
  }

  has(capabilityId: string): boolean {
    return this.capabilities.has(capabilityId);
  }

  /** Capability discovery — full list (the catalogue future surfaces read). */
  list(): Capability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Capability discovery — only capabilities that have at least one executable intent
   * (i.e. a handler is bound and declares verbs it will actually execute). Discovery
   * surfaces that must not over-advertise functionality should use this, not list().
   */
  listExecutable(): Capability[] {
    return Array.from(this.capabilities.values()).filter(
      (c) => c.executableIntents.length > 0,
    );
  }

  /** True if the given verb is currently executable for this capability. */
  isExecutable(capabilityId: string, verb: IntentVerb): boolean {
    return this.capabilities.get(capabilityId)?.executableIntents.includes(verb) ?? false;
  }

  getHandler(capabilityId: string): CapabilityHandler | undefined {
    return this.handlers.get(capabilityId);
  }

  /** True if this (capability, verb) is a recorded honest gap. */
  findGap(capabilityId: string, verb: IntentVerb): CapabilityGap | undefined {
    return this.gaps.find((g) => g.capabilityId === capabilityId && g.verb === verb);
  }

  listGaps(): CapabilityGap[] {
    return [...this.gaps];
  }

  /** Whether a capability supports a verb (closed allow-list). */
  supports(capabilityId: string, verb: IntentVerb): boolean {
    return this.capabilities.get(capabilityId)?.supportedIntents.includes(verb) ?? false;
  }

  // ---------------------------------------------------------------------------
  // INT39 — Capability Guidance Registry (extension, not a second registry)
  // ---------------------------------------------------------------------------

  /** The structured guidance a capability declares for itself, if any (honest — no fabricated default). */
  getGuidance(capabilityId: string): CapabilityGuidance | undefined {
    return this.capabilities.get(capabilityId)?.guidance;
  }

  /** All completion criteria declared by a capability (empty array when it declares none). */
  getCompletionCriteria(capabilityId: string): readonly CompletionCriterion[] {
    return this.capabilities.get(capabilityId)?.guidance?.completionCriteria ?? [];
  }

  // ---------------------------------------------------------------------------
  // INT41 — Capability Enrichment Registry (extension, not a second registry)
  // ---------------------------------------------------------------------------

  /** The structured enrichment a capability declares for itself, if any (honest — no fabricated default). */
  getEnrichment(capabilityId: string): CapabilityEnrichment | undefined {
    return this.capabilities.get(capabilityId)?.enrichment;
  }

  // ---------------------------------------------------------------------------
  // BENCHINT4 — Owner ↔ Discovery relationship (extension, not a second registry)
  //
  // Three declarative lookups over the `discoveryOf` field. They RANK NOTHING and
  // SELECT NOTHING: each answers a question about who owns what, and every routing,
  // merging and ordering decision stays with the component that already owns it.
  // ---------------------------------------------------------------------------

  /** True when this capability is the discovery sibling of some owning capability. */
  isDiscoveryCapability(capabilityId: string): boolean {
    return this.capabilities.get(capabilityId)?.discoveryOf != null;
  }

  /** The owning capability id this discovery capability serves, or undefined for an owner. */
  discoveryOwnerOf(capabilityId: string): string | undefined {
    return this.capabilities.get(capabilityId)?.discoveryOf;
  }

  /**
   * True when `a` and `b` are the SAME capability, or an owner and its own discovery
   * sibling. Two owners, or two discovery capabilities, are never the same entity family
   * however alike their ids look.
   *
   * This is the predicate INT17 §4.5 depends on to keep `alsoIn` truthful. It lives here
   * because the relationship it reads is registry metadata; the POLICY of when merging is
   * permitted stays in the Context Composition Engine, which never imports this class.
   */
  sameEntityFamily(a: string, b: string): boolean {
    if (a === b) return true;
    return this.discoveryOwnerOf(a) === b || this.discoveryOwnerOf(b) === a;
  }

  /**
   * Fail loudly at construction if the declared owner ↔ discovery graph is not well formed.
   *
   * Silence is the failure mode this whole field exists to remove: INT17 §8 open item 5
   * records that when the old stem rule could not see a pair, "merging silently stops for it
   * — safely (it emits twice), but silently". A typo, a self-reference, a dangling owner or
   * two siblings claiming one owner would each reintroduce exactly that silence, so each
   * throws here instead, at import time, in every process that loads the platform.
   */
  private validateDiscoveryRelationships(): void {
    const claimedOwners = new Map<string, string>();
    for (const cap of Array.from(this.capabilities.values())) {
      const owner = cap.discoveryOf;
      if (owner == null) continue;
      if (owner === cap.id) {
        throw new Error(`Capability "${cap.id}" declares itself its own discovery owner.`);
      }
      const ownerCap = this.capabilities.get(owner);
      if (!ownerCap) {
        throw new Error(`Capability "${cap.id}" declares discoveryOf "${owner}", which is not a registered capability.`);
      }
      if (ownerCap.discoveryOf != null) {
        throw new Error(`Capability "${cap.id}" declares discoveryOf "${owner}", but "${owner}" is itself a discovery capability. A discovery sibling must name an OWNER.`);
      }
      const existing = claimedOwners.get(owner);
      if (existing) {
        throw new Error(`Capabilities "${existing}" and "${cap.id}" both declare discoveryOf "${owner}". An owner has at most one discovery sibling.`);
      }
      claimedOwners.set(owner, cap.id);
    }
  }
}
