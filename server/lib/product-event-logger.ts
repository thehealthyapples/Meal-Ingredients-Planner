/**
 * Product Event Logger
 * ====================
 * Single ingestion point for all product analytics events.
 *
 * NEVER bypass this helper — all writes to product_events and activity_summary
 * must go through logProductEvent().
 *
 * ROLLBACK: set DISABLE_PRODUCT_EVENTS=true to stop all writes to both tables
 * while keeping the application fully functional.
 */

import { db } from "../db";
import { productEvents, activitySummary, meals, shoppingList, userPantryItems } from "@shared/schema";
import {
  EventTypes,
  EventType,
  EVENT_FEATURE_AREAS,
  ALLOWED_METADATA_FIELDS,
  LIFETIME_INCREMENT_EVENTS,
  ProductEventMetadata,
} from "@shared/product-events";
import { eq, and, count, sql } from "drizzle-orm";

export interface ProductEventInput {
  eventType: EventType;
  userId: number;
  householdId: number;
  mealId?: number;
  plannerEntryId?: number;
  pantryItemId?: number;
  basketItemId?: number;
  productId?: number;
  metadata?: ProductEventMetadata;
}

const ALL_EVENT_TYPES = new Set<string>(Object.values(EventTypes));

function isValidEventType(eventType: string): eventType is EventType {
  return ALL_EVENT_TYPES.has(eventType);
}

function sanitizeMetadata(raw: ProductEventMetadata): ProductEventMetadata {
  const out: Record<string, unknown> = {};
  ALLOWED_METADATA_FIELDS.forEach(key => {
    const val = (raw as Record<string, unknown>)[key];
    if (val !== undefined && val !== null) {
      out[key] = val;
    }
  });
  return out as ProductEventMetadata;
}

/**
 * Log a product event. Always fire-and-forget — never throws.
 * Returns a promise that resolves when the write is complete (or silently swallowed on error).
 */
export async function logProductEvent(input: ProductEventInput): Promise<void> {
  if (process.env.DISABLE_PRODUCT_EVENTS === "true") return;

  if (!isValidEventType(input.eventType)) {
    console.warn(`[ProductEvents] Rejected unknown event type: "${input.eventType}"`);
    return;
  }

  if (!input.userId || !input.householdId) {
    console.warn(`[ProductEvents] Rejected event "${input.eventType}" — missing userId or householdId`);
    return;
  }

  try {
    const featureArea = EVENT_FEATURE_AREAS[input.eventType];
    const metadata = input.metadata ? sanitizeMetadata(input.metadata) : null;
    const hasMetadata = metadata && Object.keys(metadata).length > 0;

    await db.insert(productEvents).values({
      eventType: input.eventType,
      featureArea,
      userId: input.userId,
      householdId: input.householdId,
      mealId: input.mealId ?? null,
      plannerEntryId: input.plannerEntryId ?? null,
      pantryItemId: input.pantryItemId ?? null,
      basketItemId: input.basketItemId ?? null,
      productId: input.productId ?? null,
      metadata: hasMetadata ? metadata : null,
    });

    await updateActivitySummary(input);
  } catch (err) {
    console.error(
      `[ProductEvents] Failed to write event "${input.eventType}":`,
      err instanceof Error ? err.message : err
    );
  }
}

async function updateActivitySummary(input: ProductEventInput): Promise<void> {
  const { userId, householdId, eventType, metadata } = input;

  // Re-derive current counts from source tables (never increment blindly)
  const [recipeRow] = await db
    .select({ count: count() })
    .from(meals)
    .where(and(eq(meals.userId, userId), eq(meals.isSystemMeal, false)));

  const [shoppingRow] = await db
    .select({ count: count() })
    .from(shoppingList)
    .where(eq(shoppingList.userId, userId));

  const [pantryRow] = await db
    .select({ count: count() })
    .from(userPantryItems)
    .where(eq(userPantryItems.userId, userId));

  // Planner count is household-scoped — join through the week
  const plannerResult = await db.execute<{ cnt: string }>(sql`
    SELECT COUNT(pe.id)::text AS cnt
    FROM planner_entries pe
    JOIN planner_days pd ON pe.day_id = pd.id
    JOIN planner_weeks pw ON pd.week_id = pw.id
    WHERE pw.household_id = ${householdId}
      AND pe.meal_id IS NOT NULL
  `);
  const plannerMealCount = parseInt(plannerResult.rows?.[0]?.cnt ?? "0", 10);

  // Lifetime increments — only for success events
  let shopInc = 0;
  let plannerInc = 0;
  let pantryInc = 0;
  let recipeInc = 0;

  if (LIFETIME_INCREMENT_EVENTS.has(eventType)) {
    switch (eventType) {
      case "meal_saved":
      case "meal_imported":
        recipeInc = 1;
        break;
      case "planner_meal_added":
      case "meal_added_to_planner":
        plannerInc = 1;
        break;
      case "pantry_item_added":
        pantryInc = 1;
        break;
      case "planner_sent_to_basket":
      case "pantry_sent_to_basket":
      case "quicklist_sent_to_cyc":
        shopInc = metadata?.itemCount ?? 1;
        break;
    }
  }

  await db.execute(sql`
    INSERT INTO activity_summary (
      user_id, household_id,
      current_shopping_items, current_planner_meals,
      current_pantry_items, current_recipes,
      lifetime_shopping_adds, lifetime_planner_adds,
      lifetime_pantry_adds, lifetime_recipe_adds,
      updated_at
    ) VALUES (
      ${userId}, ${householdId},
      ${shoppingRow.count}, ${plannerMealCount},
      ${pantryRow.count}, ${recipeRow.count},
      ${shopInc}, ${plannerInc},
      ${pantryInc}, ${recipeInc},
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      current_shopping_items = EXCLUDED.current_shopping_items,
      current_planner_meals  = EXCLUDED.current_planner_meals,
      current_pantry_items   = EXCLUDED.current_pantry_items,
      current_recipes        = EXCLUDED.current_recipes,
      lifetime_shopping_adds = activity_summary.lifetime_shopping_adds + EXCLUDED.lifetime_shopping_adds,
      lifetime_planner_adds  = activity_summary.lifetime_planner_adds  + EXCLUDED.lifetime_planner_adds,
      lifetime_pantry_adds   = activity_summary.lifetime_pantry_adds   + EXCLUDED.lifetime_pantry_adds,
      lifetime_recipe_adds   = activity_summary.lifetime_recipe_adds   + EXCLUDED.lifetime_recipe_adds,
      updated_at             = NOW()
  `);
}

/** Extract domain-only from a URL string. Returns null if the URL is invalid. */
export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
