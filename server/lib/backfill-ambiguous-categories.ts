import { db } from '../db';
import { shoppingList } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { detectIngredientCategory } from './ingredient-utils';

const UNCERTAIN = new Set(['other']);

export interface AmbiguousBackfillResult {
  total: number;
  updated: number;
  skipped: number;
  dryRun: boolean;
  rows: Array<{ id: number; productName: string; before: string; after: string }>;
}

export async function runAmbiguousCategoryBackfill(
  options: { dryRun?: boolean } = {},
): Promise<AmbiguousBackfillResult> {
  const { dryRun = false } = options;

  if (dryRun) console.log('[AmbiguousBackfill] DRY RUN — no DB writes will occur');

  const rows = await db
    .select({
      id: shoppingList.id,
      productName: shoppingList.productName,
      normalizedName: shoppingList.normalizedName,
      category: shoppingList.category,
    })
    .from(shoppingList)
    .where(
      and(
        eq(shoppingList.category, 'other'),
        eq(shoppingList.reviewReason, 'ambiguous_term'),
      ),
    );

  const result: AmbiguousBackfillResult = {
    total: rows.length,
    updated: 0,
    skipped: 0,
    dryRun,
    rows: [],
  };

  console.log(`[AmbiguousBackfill] Found ${rows.length} rows to evaluate`);

  for (const row of rows) {
    const name = (row.normalizedName ?? row.productName ?? '').trim();
    if (!name) {
      result.skipped++;
      continue;
    }
    const detected = detectIngredientCategory(name);
    if (UNCERTAIN.has(detected)) {
      result.skipped++;
      continue;
    }
    result.rows.push({
      id: row.id,
      productName: row.productName ?? '',
      before: row.category ?? 'other',
      after: detected,
    });
    if (!dryRun) {
      await db
        .update(shoppingList)
        .set({ category: detected })
        .where(eq(shoppingList.id, row.id));
    }
    result.updated++;
  }

  console.log(
    `[AmbiguousBackfill] Complete — total=${result.total} updated=${result.updated} skipped=${result.skipped} dryRun=${dryRun}`,
  );
  return result;
}
