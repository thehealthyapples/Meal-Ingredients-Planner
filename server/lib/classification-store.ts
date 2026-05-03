/**
 * Classification Store
 *
 * Shared DB layer for ingredient_classifications.
 * One record per canonical concept, reused across all users/households.
 *
 * Priority: manual > deterministic > ai
 * Only 'approved' and 'pending' records are applied to items.
 * 'rejected' records are excluded from all writes.
 */

import { db } from '../db';
import { ingredientClassifications, shoppingList, IngredientClassification, InsertIngredientClassification } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { classifyItem } from './openai-item-classifier';

// ── Lookup ────────────────────────────────────────────────────────────────────

export async function lookupClassification(normalizedKey: string): Promise<IngredientClassification | null> {
  const [row] = await db.select()
    .from(ingredientClassifications)
    .where(eq(ingredientClassifications.normalizedKey, normalizedKey.toLowerCase().trim()));
  return row ?? null;
}

// ── Save ──────────────────────────────────────────────────────────────────────

export async function saveClassification(data: InsertIngredientClassification): Promise<IngredientClassification | null> {
  const [row] = await db.insert(ingredientClassifications)
    .values(data)
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

export async function updateClassification(
  id: number,
  fields: Partial<Pick<IngredientClassification,
    'canonicalName' | 'canonicalKey' | 'category' | 'subcategory' |
    'aliases' | 'source' | 'reviewStatus' | 'notes'>>,
): Promise<IngredientClassification | undefined> {
  const [row] = await db.update(ingredientClassifications)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(ingredientClassifications.id, id))
    .returning();
  return row;
}

// ── Apply to shopping list items ───────────────────────────────────────────────

async function applyToItem(itemId: number, c: IngredientClassification): Promise<void> {
  await db.update(shoppingList).set({
    canonicalName:   c.canonicalName,
    category:        c.category,
    subcategory:     c.subcategory ?? null,
    resolutionState: 'resolved',
    reviewReason:    null,
    needsReview:     false,
    validationNote:  null,
  } as any).where(eq(shoppingList.id, itemId));
}

export async function applyClassificationToItems(
  normalizedKey: string,
  c: IngredientClassification,
  itemIds?: number[],
): Promise<number> {
  // If specific IDs provided, update only those. Otherwise find all matching.
  let ids = itemIds;
  if (!ids) {
    const rows = await db.select({ id: shoppingList.id })
      .from(shoppingList)
      .where(and(
        eq(shoppingList.normalizedName, normalizedKey),
        eq(shoppingList.resolutionState, 'needs_review'),
      ));
    ids = rows.map(r => r.id);
  }

  if (ids.length === 0) return 0;

  await db.update(shoppingList).set({
    canonicalName:   c.canonicalName,
    category:        c.category,
    subcategory:     c.subcategory ?? null,
    resolutionState: 'resolved',
    reviewReason:    null,
    needsReview:     false,
    validationNote:  null,
  } as any).where(inArray(shoppingList.id, ids));

  return ids.length;
}

// ── Main entry point: classify a single newly-added item ─────────────────────
//
// Called fire-and-forget after storage.addShoppingListItem() returns.
// Does nothing if the item was already deterministically resolved.

export async function classifyAndEnrich(itemId: number, normalizedKey: string): Promise<void> {
  const key = (normalizedKey ?? '').trim().toLowerCase();
  if (key.length < 2) return;

  // Step 1: Check store — avoid duplicate AI calls
  const existing = await lookupClassification(key);
  if (existing) {
    if (existing.reviewStatus !== 'rejected') {
      await applyToItem(itemId, existing);
      console.log(`[Classifier] Cache hit for "${key}" (${existing.reviewStatus}) — applied to item ${itemId}`);
    }
    return;
  }

  // Step 2: Call AI
  const result = await classifyItem(key);
  if (!result) return;

  // Step 3: Validation gate — classifyItem already enforces whitelist + threshold.
  // Defence in depth: refuse anything that slipped through.
  if (!result.likelyFoodProduct) {
    console.log(`[Classifier] Rejected "${key}" — likelyFood=false`);
    return;
  }

  // Step 4: Write to shared store
  const saved = await saveClassification({
    normalizedKey:  key,
    canonicalName:  result.canonicalName,
    canonicalKey:   result.canonicalKey,
    category:       result.category,
    subcategory:    result.subcategory ?? null,
    aliases:        JSON.stringify(result.aliases),
    source:         'ai',
    aiConfidence:   result.confidence.toFixed(2),
    aiModel:        'gpt-4o-mini',
    reviewStatus:   'pending',
    notes:          result.notes || null,
  });

  if (!saved) {
    // Conflict — another concurrent process saved it first; re-read and apply
    const fresh = await lookupClassification(key);
    if (fresh && fresh.reviewStatus !== 'rejected') await applyToItem(itemId, fresh);
    return;
  }

  // Step 5: Apply to the triggering item
  await applyToItem(itemId, saved);
  console.log(`[Classifier] ✓ Saved + applied "${key}" → ${result.category}/${result.canonicalName} (item ${itemId})`);
}
