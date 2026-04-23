/**
 * Category Normalisation Pass
 *
 * Re-evaluates ALL shopping_list items using the current canonical resolver
 * and corrects any category that no longer matches.
 *
 * Target items: every row except matched_to_product (already finalised).
 * Safe to re-run multiple times — only writes when category actually differs.
 *
 * Priority order (mirrors resolveItem):
 *   1. canonical-map.json hard entries
 *   2. modifier prefix (frozen → frozen, tinned → tinned, dried → pantry)
 *   3. keyword detection
 *
 * NEVER overwrites matched_to_product items.
 */

import { db } from '../db';
import { shoppingList } from '@shared/schema';
import { ne, eq, or, isNull } from 'drizzle-orm';
import { resolveItem } from './item-resolver';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NormaliseOptions {
  dryRun?: boolean;
}

export interface CorrectionExample {
  id: number;
  name: string;
  oldCategory: string;
  newCategory: string;
  oldSubcategory: string | null;
  newSubcategory: string | null;
}

export interface NormaliseResult {
  scanned: number;
  corrected: number;
  skipped: number;
  dryRun: boolean;
  examples: CorrectionExample[];
}

// ── Runner ────────────────────────────────────────────────────────────────────

export async function runCategoryNormalisation(opts: NormaliseOptions = {}): Promise<NormaliseResult> {
  const { dryRun = false } = opts;

  if (dryRun) console.log('[Normalise] DRY RUN — no DB writes');

  // Fetch every item that has not been matched to a specific product.
  // matched_to_product means a supermarket SKU has been selected — that's the
  // most specific state and must not be disturbed.
  const items = await db
    .select({
      id:             shoppingList.id,
      productName:    shoppingList.productName,
      normalizedName: shoppingList.normalizedName,
      category:       shoppingList.category,
      subcategory:    shoppingList.subcategory,
      canonicalName:  shoppingList.canonicalName,
      resolutionState: shoppingList.resolutionState,
    })
    .from(shoppingList)
    // Use IS DISTINCT FROM semantics: include rows where resolutionState IS NULL
    // (legacy items added before the column existed) as well as rows with any
    // explicit value other than 'matched_to_product'.
    // Plain ne() evaluates NULL != 'matched_to_product' as NULL (unknown) in SQL,
    // which is falsy — silently excluding the legacy rows we most need to fix.
    .where(or(isNull(shoppingList.resolutionState), ne(shoppingList.resolutionState, 'matched_to_product')));

  const result: NormaliseResult = {
    scanned:   items.length,
    corrected: 0,
    skipped:   0,
    dryRun,
    examples:  [],
  };

  // Deduplicate by productName so we only call resolveItem once per unique name.
  // All rows sharing that name receive the same update.
  const nameToResolved = new Map<string, ReturnType<typeof resolveItem>>();

  for (const item of items) {
    if (!item.productName) { result.skipped++; continue; }

    if (!nameToResolved.has(item.productName)) {
      nameToResolved.set(item.productName, resolveItem(item.productName));
    }

    const resolved = nameToResolved.get(item.productName)!;

    // Only update when:
    //   a) category has changed, AND
    //   b) the new category is specific (not 'other')
    const categoryChanged = resolved.category !== (item.category ?? '');
    const isUsefulCategory = resolved.category !== 'other';

    if (!categoryChanged || !isUsefulCategory) {
      result.skipped++;
      continue;
    }

    if (result.examples.length < 25) {
      result.examples.push({
        id:            item.id,
        name:          item.productName,
        oldCategory:   item.category ?? '(none)',
        newCategory:   resolved.category,
        oldSubcategory: item.subcategory ?? null,
        newSubcategory: resolved.subcategory ?? null,
      });
    }

    if (!dryRun) {
      await db
        .update(shoppingList)
        .set({
          category:        resolved.category,
          resolutionState: resolved.resolutionState,
          needsReview:     resolved.needsReview,
          reviewReason:    resolved.reviewReason ?? null,
          // Only overwrite subcategory when the resolver produced a value
          ...(resolved.subcategory !== null ? { subcategory: resolved.subcategory } : {}),
          // Only fill canonicalName when currently absent
          ...(!item.canonicalName && resolved.canonicalName ? { canonicalName: resolved.canonicalName } : {}),
        })
        .where(eq(shoppingList.id, item.id));
    }

    result.corrected++;
  }

  console.log(
    `[Normalise] ${dryRun ? 'DRY ' : ''}Complete — scanned=${result.scanned} corrected=${result.corrected} skipped=${result.skipped}`
  );

  return result;
}
