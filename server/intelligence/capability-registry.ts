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
  CapabilityHandler,
  IntentVerb,
} from "./types.js";

/** An honest gap: a desired (verb × capability) with no owning endpoint today (TIP2 §2.4). */
export interface CapabilityGap {
  readonly capabilityId: string;
  readonly verb: IntentVerb;
  readonly reason: string;
}

// ---------------------------------------------------------------------------
// Canonical capability seed (TIP2 §2.1 — C1..C13). Real owners / services / APIs.
// ---------------------------------------------------------------------------

const SEED_CAPABILITIES: readonly Capability[] = [
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
    description: "Read-only nutrition and food knowledge (source-gated).",
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

/** Honest GAPs (TIP2 §2.4) — desired intents THA does not own an endpoint for yet. */
const SEED_GAPS: readonly CapabilityGap[] = [
  { capabilityId: "shopping", verb: "order", reason: "No checkout/retailer-order endpoint exists; basket build ≠ order placement. Prepare-basket + hand-off only (Rule 8)." },
  { capabilityId: "planner", verb: "delete", reason: "Deleting the whole week *record* is a GAP — only clearing week entries exists. Entry-level delete is supported; week-object delete is not." },
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
}
