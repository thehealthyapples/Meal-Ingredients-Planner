/**
 * service-composition.ts
 * =====================
 *
 * COMP4A2 — Business Service Composition Orchestration
 *
 * Orchestrates progressive knowledge search when a business service
 * returns an honest gap. Iterates through the registered composition
 * steps, collects enrichments, and returns them to the capability handler.
 */

import {
  getCompositionConfig,
  type ServiceCompositionContext,
  type EnrichedContext,
  type IStorageScope,
} from "./business-service-composition-registry.js";
import type { ResolvedIntent } from "../intent-resolver.js";
import type { IntelligenceContext } from "../types.js";
import type { IIntelligencePlatform } from "../intelligence-platform.js";

/**
 * Execute progressive knowledge composition for a business service.
 *
 * @param capability The capability name (e.g., "planner")
 * @param intent The resolved intent that triggered the composition
 * @param userContext User + household context
 * @param primaryGapMessage The honest gap message from the primary query
 * @param storage Scoped storage accessor
 * @param platform The Intelligence Platform (for cross-service queries)
 * @param options Configuration (e.g., collect all vs. stop at first)
 *
 * @returns Array of enriched contexts found, in order. Empty if no enrichment.
 */
export async function executeProgressiveComposition(
  capability: string,
  intent: ResolvedIntent,
  userContext: IntelligenceContext,
  primaryGapMessage: string,
  storage: IStorageScope,
  platform: IIntelligencePlatform,
  options?: { accumulate?: boolean; maxEnrichments?: number }
): Promise<readonly EnrichedContext[]> {
  const config = getCompositionConfig(capability);
  if (!config) {
    // No composition configured for this capability
    return [];
  }

  // Check if this intent triggers composition
  const intentAsAny = intent as any;
  const intentName = intentAsAny.name || intentAsAny.capability?.split('/')[1] || '';
  const intentKey = `${intent.verb}:${intentName}`;
  const shouldCompose = config.triggeredByIntents.some(
    (t) =>
      t === intentKey ||
      t === intent.verb ||
      t.startsWith(`${intent.verb}:`)
  );

  if (!shouldCompose) {
    return [];
  }

  const enrichments: EnrichedContext[] = [];

  // Adapt ResolvedIntent to ServiceCompositionContext
  // Note: intent might be a ResolvedIntent or Intent type depending on caller
  const utterance = intentAsAny.utterance || intentAsAny.originalUtterance || '';

  const context: ServiceCompositionContext = {
    utterance,
    intent,
    primaryGapMessage,
    userContext,
    storage,
    intelligencePlatform: platform,
  };

  // Execute each progressive search step
  for (const step of config.progressiveSearchSteps) {
    // Check if user has premium access (if step requires it)
    const userContextAsAny = userContext as any;
    if (step.premiumOnly && !userContextAsAny.hasPremiumAccess) {
      continue;
    }

    try {
      const enriched = await step.search(context);

      if (enriched) {
        enrichments.push(enriched);

        // Stop at first match unless accumulating
        if (!step.accumulate && !options?.accumulate) {
          break;
        }

        // Check max enrichments limit
        if (
          options?.maxEnrichments &&
          enrichments.length >= options.maxEnrichments
        ) {
          break;
        }
      }
    } catch (error) {
      // Log but don't fail the query — composition is an enhancement, not critical
      console.error(
        `[ServiceComposition] Error in step "${step.label}" for capability ${capability}:`,
        error
      );
      // Continue to next step
    }
  }

  return enrichments;
}

/**
 * Format enriched contexts for display in the Conversation Gateway.
 *
 * Converts the enriched contexts array into a user-facing message that
 * accompanies the primary gap message. The Behaviour Engine will then
 * voice this combined message per the active personality.
 */
export function formatEnrichedGapMessage(
  primaryGapMessage: string,
  enrichments: readonly EnrichedContext[]
): string {
  if (enrichments.length === 0) {
    return primaryGapMessage;
  }

  const enrichmentTexts = enrichments.map((e) => {
    // Add a prefix based on presentation mode
    const prefix: Record<string, string> = {
      related: "Here's related context:",
      suggestion: "You might also consider:",
      notice: "By the way:",
    };

    return `${prefix[e.presentationMode] || "Also:"} ${e.content}`;
  });

  return [primaryGapMessage, ...enrichmentTexts].join("\n\n");
}

/**
 * Create a scoped storage accessor for use in composition steps.
 * Enforces user/household scope on all reads.
 *
 * This is a minimal implementation; in production, it would wrap
 * the real storage service with permission checks.
 */
export function createStorageScope(
  userId: number,
  householdId: number,
  baseStorage: any // Would be real Storage type in production
): IStorageScope {
  return {
    async getUserProfile() {
      return await baseStorage.getUserProfile(userId);
    },

    async getHousehold() {
      return await baseStorage.getHousehold(householdId);
    },

    async getPlannerEntries(week?: number, day?: string) {
      return await baseStorage.getPlannerEntries(userId, week, day);
    },

    async getPlannerWeeks() {
      return await baseStorage.getPlannerWeeks(userId);
    },

    async getCookbookMeals(query?: string) {
      return await baseStorage.getCookbookMeals(userId, query);
    },

    async getShoppingItems() {
      return await baseStorage.getShoppingItems(userId);
    },

    async getPantryItems() {
      return await baseStorage.getPantryItems(userId);
    },

    async getDiaryEntries(from: Date, to: Date) {
      return await baseStorage.getDiaryEntries(userId, from, to);
    },

    async getHouseholdRestrictions() {
      return await baseStorage.getHouseholdRestrictions(householdId);
    },

    async query<T>(table: string, filter?: Record<string, unknown>) {
      const scopedFilter = { ...filter, userId, householdId };
      return await baseStorage.query<T>(table, scopedFilter);
    },
  };
}
