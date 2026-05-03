/**
 * Guard script: detect ambiguity-map suggestions that loop back to needsReview.
 *
 * A loop occurs when a user selects a specific variant (e.g. "plain flour") from
 * an ambiguity picker but the resolver re-flags it as ambiguous on the next load.
 * This usually happens because normalizeName() strips modifier words, collapsing
 * "plain flour" back to "flour" which then re-matches the flour ambiguity entry.
 *
 * Run:  npx tsx scripts/check-ambiguity-loops.ts
 * Exit: 0 if no unintentional loops, 1 if any are found.
 */

import { resolveItem } from '../server/lib/item-resolver';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mapPath = path.join(__dirname, '../server/data/ambiguity-map.json');
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as Record<string, { suggestions: string[] }>;

// These parent→suggestion pairs are INTENTIONAL cascading disambiguation paths:
// selecting "berries" from the fruit picker correctly shows the berries picker,
// and selecting "mixed berries" from the berries picker correctly shows the mixed
// berries picker.  They loop by design and should not be treated as failures.
const INTENTIONAL_CASCADES = new Set([
  'fruit → berries',
  'fruit → citrus',
  'berries → mixed berries',
  'berry → mixed berries',
]);

interface Loop {
  parent: string;
  suggestion: string;
  resolvedAs: string;
  intentional: boolean;
}

const loops: Loop[] = [];

for (const [parent, entry] of Object.entries(map)) {
  for (const suggestion of entry.suggestions) {
    const result = resolveItem(suggestion);
    if (result.needsReview && result.reviewReason === 'ambiguous_term') {
      const key = `${parent} → ${suggestion}`;
      loops.push({ parent, suggestion, resolvedAs: result.normalizedName, intentional: INTENTIONAL_CASCADES.has(key) });
    }
  }
}

const unintentional = loops.filter(l => !l.intentional);
const intentional = loops.filter(l => l.intentional);

if (intentional.length > 0) {
  console.log(`ℹ ${intentional.length} intentional cascade(s) — expected, not failures:`);
  for (const { parent, suggestion } of intentional) {
    console.log(`  ${parent} → "${suggestion}"`);
  }
}

if (unintentional.length === 0) {
  console.log('✓ No unintentional ambiguity loops found — all non-cascade suggestions resolve cleanly.');
  process.exit(0);
} else {
  console.error(`\n✗ Found ${unintentional.length} unintentional looping suggestion(s):\n`);
  for (const { parent, suggestion, resolvedAs } of unintentional) {
    console.error(`  ${parent} → "${suggestion}" (normalises to "${resolvedAs}")`);
  }
  console.error('\nEach loop above means a user who picks that suggestion will see');
  console.error('the ambiguity picker again after a page refresh. Fix by either:');
  console.error('  1. Adding the suggestion to canonical-map.json, OR');
  console.error('  2. Removing the modifier word from normalizeName() MODIFIER_WORDS.');
  process.exit(1);
}
