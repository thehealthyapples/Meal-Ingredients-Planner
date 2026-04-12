/**
 * Backfill: Item Resolution Layer
 * ================================
 * Scans shopping list items still in resolution_state = 'raw' (or NULL) and
 * runs each through the shared resolveItem() function, persisting the results.
 *
 * SAFETY
 * ------
 * - Only touches rows where resolution_state = 'raw' OR IS NULL.
 * - Idempotent: safe to re-run any number of times.
 * - Does NOT overwrite original_text, normalized_name, or category if already set.
 * - Does NOT attach product data or prices.
 * - Does NOT overwrite user intent: if the item resolves as needs_review,
 *   that state is written honestly — we do not force a fake 'resolved' state.
 *
 * ITEMS INTENTIONALLY SKIPPED
 * ----------------------------
 * - Rows already in 'resolved', 'needs_review', or 'matched_to_product' state.
 *
 * HOW TO RUN
 * ----------
 *   tsx server/scripts/backfill-item-resolution.ts
 *
 * Add --dry-run to preview without writing:
 *   tsx server/scripts/backfill-item-resolution.ts --dry-run
 */

import { pool } from '../db';
import { resolveItem } from '../lib/item-resolver';

const DRY_RUN = process.argv.includes('--dry-run');

interface RawRow {
  id: number;
  product_name: string;
  category: string | null;
  resolution_state: string | null;
  original_text: string | null;
  normalized_name: string | null;
}

async function run() {
  if (DRY_RUN) {
    console.log('[Backfill] DRY RUN — no changes will be written');
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query<RawRow>(`
      SELECT id, product_name, category, resolution_state, original_text, normalized_name
      FROM   shopping_list
      WHERE  resolution_state = 'raw' OR resolution_state IS NULL
      ORDER  BY id
    `);

    console.log(`[Backfill] Found ${rows.length} item(s) to process`);

    let nResolved    = 0;
    let nNeedsReview = 0;
    let nErrors      = 0;

    for (const row of rows) {
      try {
        const result = resolveItem(row.product_name, {
          callerCategory: row.category ?? null,
        });

        if (!DRY_RUN) {
          await client.query(
            `UPDATE shopping_list
             SET
               -- Preserve any original_text already stored (e.g. manually edited items)
               original_text      = COALESCE(original_text, $2),
               canonical_name     = $3,
               subcategory        = $4,
               resolution_state   = $5,
               review_reason      = $6,
               review_suggestions = $7,
               needs_review       = $8,
               validation_note    = $9,
               -- Preserve any normalized_name already stored
               normalized_name    = COALESCE(normalized_name, $10),
               -- Preserve any category already stored (resolver output is the fallback)
               category           = COALESCE(NULLIF(category, 'uncategorised'), $11)
             WHERE id = $1`,
            [
              row.id,
              result.originalText,        // $2  — preserved if already set
              result.canonicalName,        // $3
              result.subcategory,          // $4
              result.resolutionState,      // $5
              result.reviewReason,         // $6
              result.reviewSuggestions,    // $7
              result.needsReview,          // $8
              result.validationNote,       // $9
              result.normalizedName,       // $10 — preserved if already set
              result.category,             // $11 — only used if category is NULL/'uncategorised'
            ],
          );
        } else {
          console.log(
            `  [DRY] id=${row.id} "${row.product_name}" → ` +
            `state=${result.resolutionState} reason=${result.reviewReason ?? '-'}`
          );
        }

        if (result.needsReview) nNeedsReview++;
        else nResolved++;
      } catch (err) {
        console.error(`[Backfill] Error on item id=${row.id} ("${row.product_name}"):`, err);
        nErrors++;
      }
    }

    console.log('[Backfill] Complete.');
    console.log(`  resolved:     ${nResolved}`);
    console.log(`  needs_review: ${nNeedsReview}`);
    console.log(`  errors:       ${nErrors}`);
    if (DRY_RUN) console.log('  (no rows were modified — dry run)');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('[Backfill] Fatal error:', err);
  process.exit(1);
});
