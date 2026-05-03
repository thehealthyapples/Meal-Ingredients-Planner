/**
 * Backfill Classifier
 *
 * Processes existing shopping_list rows where:
 *   - resolutionState = 'needs_review'
 *   - reviewReason    = 'unrecognised_item'
 *
 * Deduplicates by normalizedName so each unique concept is classified once.
 * Calls AI only when no stored classification exists.
 * Updates all matching rows on success.
 *
 * NEVER overwrites:
 *   - manually corrected items (source='manual' in classification store)
 *   - already-resolved items (resolutionState = 'resolved' or 'matched_to_product')
 */

import { db } from '../db';
import { shoppingList } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import {
  lookupClassification,
  saveClassification,
  applyClassificationToItems,
} from './classification-store';
import { classifyItem } from './openai-item-classifier';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BackfillOptions {
  batchSize?: number;
  dryRun?:    boolean;
}

export interface BackfillResult {
  totalWeakItems: number;
  uniqueKeys:     number;
  processed:      number;
  accepted:       number;
  rejected:       number;
  skipped:        number;
  errors:         number;
  dryRun:         boolean;
}

// ── Runner ────────────────────────────────────────────────────────────────────

export async function runBackfill(options: BackfillOptions = {}): Promise<BackfillResult> {
  const { batchSize = 50, dryRun = false } = options;

  if (dryRun) console.log('[Backfill] DRY RUN — no DB writes will occur');

  // 1. Fetch all unresolved items
  const weakItems = await db.select({
    id:             shoppingList.id,
    normalizedName: shoppingList.normalizedName,
  })
  .from(shoppingList)
  .where(and(
    eq(shoppingList.resolutionState, 'needs_review'),
    eq(shoppingList.reviewReason,    'unrecognised_item'),
  ));

  // 2. Deduplicate by normalizedName
  const keyToIds = new Map<string, number[]>();
  for (const item of weakItems) {
    const key = (item.normalizedName ?? '').trim().toLowerCase();
    if (key.length < 2) continue;
    if (!keyToIds.has(key)) keyToIds.set(key, []);
    keyToIds.get(key)!.push(item.id);
  }

  const allKeys   = Array.from(keyToIds.keys());
  const batchKeys = allKeys.slice(0, batchSize);

  const result: BackfillResult = {
    totalWeakItems: weakItems.length,
    uniqueKeys:     allKeys.length,
    processed: 0,
    accepted:  0,
    rejected:  0,
    skipped:   0,
    errors:    0,
    dryRun,
  };

  console.log(`[Backfill] Found ${weakItems.length} weak items across ${allKeys.length} unique keys — processing ${batchKeys.length}`);

  // 3. Process each unique key
  for (const key of batchKeys) {
    const itemIds = keyToIds.get(key)!;
    result.processed++;

    try {
      // 3a. Check store — don't call AI for already-classified keys
      const existing = await lookupClassification(key);

      if (existing) {
        if (existing.reviewStatus === 'rejected') {
          console.log(`[Backfill] Skip "${key}" — previously rejected`);
          result.skipped++;
          continue;
        }
        if (!dryRun) {
          const count = await applyClassificationToItems(key, existing, itemIds);
          console.log(`[Backfill] Applied cached "${key}" → ${existing.category} (${count} items)`);
        } else {
          console.log(`[Backfill] DRY: would apply cached "${key}" → ${existing.category} (${itemIds.length} items)`);
        }
        result.accepted++;
        continue;
      }

      // 3b. Call AI
      const aiResult = await classifyItem(key);

      if (!aiResult) {
        console.log(`[Backfill] No result for "${key}" — AI returned null`);
        result.rejected++;
        continue;
      }

      // 3c. Validation gate — classifyItem already enforces whitelist + threshold.
      // Defence in depth: refuse anything that isn't a likely food product.
      if (!aiResult.likelyFoodProduct) {
        console.log(`[Backfill] Rejected "${key}" — likelyFood=false`);
        result.rejected++;
        continue;
      }

      if (!dryRun) {
        // 3d. Save to store
        const saved = await saveClassification({
          normalizedKey:  key,
          canonicalName:  aiResult.canonicalName,
          canonicalKey:   aiResult.canonicalKey,
          category:       aiResult.category,
          subcategory:    aiResult.subcategory ?? null,
          aliases:        JSON.stringify(aiResult.aliases),
          source:         'ai',
          aiConfidence:   aiResult.confidence.toFixed(2),
          aiModel:        'gpt-4o-mini',
          reviewStatus:   'pending',
          notes:          aiResult.notes || null,
        });

        const target = saved ?? await lookupClassification(key);
        if (target) {
          const count = await applyClassificationToItems(key, target, itemIds);
          console.log(`[Backfill] ✓ "${key}" → ${aiResult.category}/${aiResult.canonicalName} (${count} items updated)`);
        }
      } else {
        console.log(`[Backfill] DRY: would save "${key}" → ${aiResult.category}/${aiResult.canonicalName} (${itemIds.length} items)`);
      }

      result.accepted++;

      // Throttle to stay within rate limits
      await new Promise(r => setTimeout(r, 250));

    } catch (err) {
      result.errors++;
      console.error(`[Backfill] Error for "${key}":`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[Backfill] Complete — processed=${result.processed} accepted=${result.accepted} rejected=${result.rejected} skipped=${result.skipped} errors=${result.errors}`);
  return result;
}
