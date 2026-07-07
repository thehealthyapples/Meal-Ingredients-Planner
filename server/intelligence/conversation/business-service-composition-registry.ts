/**
 * business-service-composition-registry.ts
 * ========================================
 *
 * COMP4A2 — Progressive Knowledge Delivery via Business Service Composition
 *
 * Each business service (Planner, Shopping, Meals, etc.) can declare a strategy
 * for progressively composing knowledge when the primary query returns an honest
 * gap. This registry holds the composition configurations.
 *
 * HARD BOUNDARIES:
 *  - No capability invocation; only data-focused searches
 *  - Composition is attempted INSIDE the Intelligence Platform (knowledge plane),
 *    not at the Gateway level
 *  - Enrichments are clearly labeled and never contradict the gap
 *  - All sources are existing platform data (storage, other services, metadata)
 *  - No new knowledge created; only composition of what exists
 */

import type { ResolvedIntent, IntentVerb } from "../intent-resolver.js";
import type { IntelligenceContext } from "../types.js";
import type { IIntelligencePlatform } from "../intelligence-platform.js";

/**
 * The context passed to a progressive search step. Contains everything needed
 * to perform a contextual search, but never invokes capabilities directly.
 */
export interface ServiceCompositionContext {
  /** The original utterance the user asked. */
  readonly utterance: string;

  /** The resolved intent that triggered the composition attempt. */
  readonly intent: ResolvedIntent;

  /** The honest gap message the primary query returned. */
  readonly primaryGapMessage: string;

  /** User + household context (for scoped queries). */
  readonly userContext: IntelligenceContext;

  /** Storage accessor (for direct data queries scoped to the user). */
  readonly storage: IStorageScope;

  /** Intelligence Platform (for cross-service composition queries). */
  readonly intelligencePlatform: IIntelligencePlatform;
}

/**
 * The result of a progressive search step: enriched context to present
 * alongside the honest gap.
 */
export interface EnrichedContext {
  /** The enriched content to present to the user (text). */
  readonly content: string;

  /** Optional: structured data (meals, items, metrics) for deeper integration. */
  readonly data?: unknown;

  /** Tier reached (for logging and debugging). */
  readonly tier: 1 | 2 | 3 | 4;

  /** How to present this enrichment to the user. */
  readonly presentationMode: "related" | "suggestion" | "notice";
}

/**
 * A single step in a progressive knowledge search strategy.
 * Each step is attempted in order; stops at the first match.
 */
export interface ProgressiveSearchStep {
  /** Human-readable label for what this step searches. */
  readonly label: string;

  /**
   * The search function. Returns enriched context (stop immediately) or null
   * (continue to next step). Must handle errors gracefully (log, return null).
   */
  readonly search: (
    context: ServiceCompositionContext
  ) => Promise<EnrichedContext | null>;

  /**
   * Optional: if true, collect this and all subsequent matches; don't stop
   * at the first. Default: false (stop at first match).
   */
  readonly accumulate?: boolean;

  /**
   * Optional: if true, skip this step for users on free tier or without
   * premium permissions. Default: false (always include).
   */
  readonly premiumOnly?: boolean;
}

/**
 * Configuration for one business service's progressive knowledge composition.
 */
export interface BusinessServiceCompositionConfig {
  /** The capability name (e.g., "planner", "shopping"). */
  readonly capability: string;

  /**
   * Which resolved intents trigger composition when they return gaps.
   * Format: "<verb>:<intent-name>" (e.g., "search:meals-by-week")
   */
  readonly triggeredByIntents: readonly string[];

  /**
   * The progressive search steps, tried in order.
   * Stops at the first match unless `accumulate: true`.
   */
  readonly progressiveSearchSteps: readonly ProgressiveSearchStep[];
}

/**
 * Scoped storage accessor — limits reads to the current user's data
 * and respects household/eater scope.
 */
export interface IStorageScope {
  /** Get user's profile data. */
  getUserProfile(): Promise<unknown | null>;

  /** Get user's household. */
  getHousehold(): Promise<unknown | null>;

  /** Get planner weeks/entries for a specific week/day. */
  getPlannerEntries(
    week?: number,
    day?: string
  ): Promise<readonly PlannerEntry[]>;

  /** Get planner weeks that have data. */
  getPlannerWeeks(): Promise<readonly number[]>;

  /** Get cookbook meals (optionally filtered by search query). */
  getCookbookMeals(query?: string): Promise<readonly CookbookMeal[]>;

  /** Get shopping list items. */
  getShoppingItems(): Promise<readonly ShoppingItem[]>;

  /** Get pantry items. */
  getPantryItems(): Promise<readonly PantryItem[]>;

  /** Get diary entries for a date range. */
  getDiaryEntries(
    from: Date,
    to: Date
  ): Promise<readonly DiaryEntry[]>;

  /** Get household restrictions and patterns. */
  getHouseholdRestrictions(): Promise<readonly string[]>;

  /** Generic data fetch for custom queries (scoped to user). */
  query<T>(table: string, filter?: Record<string, unknown>): Promise<T[]>;
}

// Placeholder types for data structures
export interface PlannerEntry {
  week: number;
  day: string;
  meal: unknown;
  createdAt: Date;
}

export interface CookbookMeal {
  id: string;
  name: string;
  cuisine?: string;
  prepTime?: number;
  servings?: number;
  ingredients?: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity?: string;
}

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity?: string;
}

export interface DiaryEntry {
  id: string;
  date: Date;
  meal: unknown;
  nutrition?: unknown;
}

/**
 * The global Business Service Composition Registry.
 * Populated at startup; immutable at runtime.
 */
export const BUSINESS_SERVICE_COMPOSITION_REGISTRY: Map<
  string,
  BusinessServiceCompositionConfig
> = new Map();

/**
 * Register a business service's composition strategy.
 * Called at startup by the service's implementation module.
 */
export function registerBusinessServiceComposition(
  config: BusinessServiceCompositionConfig
): void {
  if (BUSINESS_SERVICE_COMPOSITION_REGISTRY.has(config.capability)) {
    console.warn(
      `[BusinessServiceComposition] Re-registering capability: ${config.capability}`
    );
  }
  BUSINESS_SERVICE_COMPOSITION_REGISTRY.set(config.capability, config);
}

/**
 * Look up a service's composition configuration by capability name.
 */
export function getCompositionConfig(
  capability: string
): BusinessServiceCompositionConfig | undefined {
  return BUSINESS_SERVICE_COMPOSITION_REGISTRY.get(capability);
}

/**
 * Check if a service has composition configured for a specific intent.
 */
export function hasCompositionFor(
  capability: string,
  verb: IntentVerb,
  intentName?: string
): boolean {
  const config = getCompositionConfig(capability);
  if (!config) return false;

  const intentKey = intentName ? `${verb}:${intentName}` : verb;
  return config.triggeredByIntents.some(
    (t) => t === intentKey || t === verb || t.startsWith(`${verb}:`)
  );
}
