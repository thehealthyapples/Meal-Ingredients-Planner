/**
 * test-shop3-shopping-surface-convergence.ts
 * ==========================================
 * SHOP3 — there is exactly ONE Shopping destination, and it is the one that
 * carries THA's only safety-critical signal.
 *
 * THE DEFECT
 * ----------
 * Shopping was served by TWO live surfaces:
 *
 *   /shopping-workspace  — the nav's only Shopping door
 *   /basket, /analyse-basket — not in the nav, but linked THREE times from the
 *                        Dashboard and advertised in the workspace's own footer
 *
 * `nav-bar.tsx` aliased the second pair into the first's nav pip, so a household
 * standing on the duplicate saw the "Shopping" pip lit and had no signal they
 * were anywhere else.
 *
 * The divergence that mattered was not cosmetic. `shopping-restriction-conflict`
 * is the SOLE member of the closed `critical` allowlist in
 * `shared/attention/index.ts` — raised when a product on the list conflicts with
 * a named household member's stored hard restriction. It reaches a household
 * through `<AmbientIntelligence surfaceKey="shopping">`.
 *
 *   /shopping-workspace mounted it.
 *   /basket mounted NO AmbientIntelligence at all.
 *
 * Same list, same stored peanut allergy, same peanut butter: one door raised a
 * critical card, the other was silent. The server generator was sound and
 * surface-agnostic the whole time — the second client simply never asked.
 *
 * SHOP1 predicted this exact gap (SHOP1:425-434) and DECLINED to fix it by
 * mounting a second ambient surface, on the grounds that doing so would
 * entrench the duplication rather than resolve it. It named the correct fix as
 * closing the duplicate. That is what SHOP3 did.
 *
 * WHY THIS FILE ASSERTS THE COMPLEMENT
 * ------------------------------------
 * Asserting "the workspace mounts the safety surface" would have passed BEFORE
 * SHOP3 too — it always did. The defect was the existence of a second door, so
 * §1 asserts that NO shopping route resolves to anything but the canonical
 * page, and §2 asserts the canonical page still mounts the signal. A future
 * surface that renders a shopping list without the safety card fails §1 rather
 * than shipping.
 *
 * THE LAYERS
 *   1  ONE DOOR — no route renders a second Shopping page
 *   2  THE SIGNAL — the canonical surface mounts the critical-bearing surface
 *   3  NO ORPHANS — the retired page and its list renderer are gone, and
 *      nothing imports them
 *   4  CAPABILITIES PRESERVED — the three subsystems that existed ONLY on the
 *      retired surface are present on the canonical one
 *   5  NO FABRICATED VERDICTS — an unrated item is never scored as 0
 *
 * Run with: npm run test:shop3-shopping-surface-convergence
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ─── Harness ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: boolean, label: string, detail?: unknown): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗ ${label}${detail !== undefined ? ` — got ${JSON.stringify(detail)}` : ''}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

const ROOT = join(import.meta.dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

const APP = read('client/src/App.tsx');
const WORKSPACE = read('client/src/pages/shopping-workspace-page.tsx');
const NAV = read('client/src/components/nav-bar.tsx');

console.log('SHOP3 — Shopping Surface Convergence');

// ─── 1. ONE DOOR ──────────────────────────────────────────────────────────────

section('1. One door — no route renders a second Shopping page');

// The retired paths must still RESOLVE (bookmarks are honoured) but must not
// render a page of their own.
for (const path of ['/basket', '/analyse-basket']) {
  const routeLine = APP.split('\n').find(
    l => l.includes(`path="${path}"`) && l.includes('<Route'),
  );
  assert(routeLine !== undefined, `${path} still has a route (bookmarks not 404'd)`);
  assert(
    routeLine !== undefined && routeLine.includes('Redirect to="/shopping-workspace"'),
    `${path} redirects to the canonical Shopping room`,
    routeLine?.trim(),
  );
  assert(
    routeLine !== undefined && !routeLine.includes('ShoppingListPage'),
    `${path} does not render a second Shopping page`,
  );
}

assert(
  !APP.includes('ShoppingListPage'),
  'App.tsx no longer imports the retired Shopping page',
);

// The nav alias existed only to paper over the duplication.
assert(
  !/["']\/shopping-workspace["']\s*:\s*\[[^\]]*basket/.test(NAV),
  'nav-bar no longer aliases the retired paths into the Shopping pip',
);

// ─── 2. THE SIGNAL ────────────────────────────────────────────────────────────

section('2. The signal — the canonical surface carries the critical card');

assert(
  /<AmbientIntelligence[\s\S]{0,200}surfaceKey="shopping"/.test(WORKSPACE),
  'the canonical Shopping surface mounts AmbientIntelligence for the shopping domain',
);

// The `critical` allowlist is closed and shopping owns its only member. If that
// stops being true this test's premise has changed and it should be revisited.
const ATTENTION = read('shared/attention/index.ts');
assert(
  ATTENTION.includes('shopping-restriction-conflict'),
  'shopping-restriction-conflict is still the signal the shopping domain owns',
);

// ─── 3. NO ORPHANS ────────────────────────────────────────────────────────────

section('3. No orphans — the retired surface is gone');

const RETIRED = [
  'client/src/pages/shopping-list-page.tsx',
  'client/src/components/ShoppingListView.tsx',
];
for (const p of RETIRED) {
  assert(!existsSync(join(ROOT, p)), `${p} is deleted`);
}

// Nothing may import them. Comments referring to them historically are fine;
// an `import` or a JSX mount is not.
const LIVE_DIRS = ['client/src', 'server', 'scripts', 'shared'];
import { execSync } from 'node:child_process';
// `--exclude` drops this file: it necessarily contains the very strings it
// searches for, and would otherwise report itself as an importer.
const importHits = execSync(
  `grep -rn "from \\"@/components/ShoppingListView\\"\\|from \\"@/pages/shopping-list-page\\"\\|<ShoppingListView" ${LIVE_DIRS.join(' ')} --include=*.ts --include=*.tsx --exclude=test-shop3-shopping-surface-convergence.ts || true`,
  { cwd: ROOT, encoding: 'utf8' },
).trim();
assert(importHits === '', 'nothing imports or mounts the retired modules', importHits);

// ─── 4. CAPABILITIES PRESERVED ────────────────────────────────────────────────

section('4. Capabilities preserved — what existed ONLY on the retired surface');

// 4a. Deletion granularity. The canonical surface had NO single-item delete
//     before SHOP3; retiring the other door without this would have removed the
//     household's only way to take one line off their list.
assert(
  WORKSPACE.includes('api.shoppingList.remove.path'),
  'single-item delete reaches the canonical surface',
);
assert(
  WORKSPACE.includes('ws-remove-btn-'),
  'the household has a control to remove one item',
);
assert(
  WORKSPACE.includes('button-clear-planned') && WORKSPACE.includes('button-clear-quick-list'),
  'clear-by-source granularity is preserved (planned vs quick list)',
);

// 4b. The pricing layer. `total-cost` and `prices` had ZERO callers here.
assert(
  WORKSPACE.includes('api.shoppingList.totalCost.path'),
  'the basket total endpoint is called from the canonical surface',
);
assert(
  WORKSPACE.includes('api.shoppingList.prices.path'),
  'the price-matches endpoint is called from the canonical surface',
);
assert(
  WORKSPACE.includes('text-basket-total-price'),
  'the basket total is rendered',
);
assert(
  WORKSPACE.includes('table-comparison-strip'),
  'the cross-retailer price comparison is rendered',
);
assert(
  WORKSPACE.includes('dialog-price-comparison'),
  'the per-item price comparison is reachable',
);
assert(
  WORKSPACE.includes('api.priceTier.update.path'),
  'the household can still set its price tier',
);
assert(
  WORKSPACE.includes('text-basket-estimated-total'),
  'the post-checkout estimated total is rendered (it was carried in state but never shown)',
);

// 4c. The extras table. `/api/shopping-list/extras` had ZERO callers here.
//     NOTE the name collision: the `extras` SOURCE FILTER on this page means
//     "manually added list item" and is a different concept from this table.
assert(
  WORKSPACE.includes('/api/shopping-list/extras'),
  'the saved-staples table is read by the canonical surface',
);
assert(
  WORKSPACE.includes('section-always-in-basket'),
  '"Always in basket" staples are rendered',
);
assert(
  WORKSPACE.includes('input-add-extra') && WORKSPACE.includes('extra-delete-'),
  'staples can be added and removed',
);

// ─── 5. NO FABRICATED VERDICTS ────────────────────────────────────────────────

section('5. No fabricated verdicts — an unrated item is not scored as 0');

// The retired surface printed "Industrial" in red about an unrated banana,
// because `canShowScoreForItem` grants PERMISSION to show a score and does not
// assert one EXISTS (a whole food passes it with a null rating), and `?? 0`
// then turned null into the worst possible verdict.
assert(
  !WORKSPACE.includes('Industrial'),
  'the canonical surface renders no processing verdict from a coerced null',
);
assert(
  !/thaRating \?\? 0/.test(
    // Only item-level renders matter; sort comparators over analysed catalogue
    // products legitimately treat a missing score as 0.
    WORKSPACE.split('\n').filter(l => l.includes('AppleRating')).join('\n'),
  ),
  'no AppleRating on this surface is fed a coerced-null score',
);
assert(
  WORKSPACE.includes('i.thaRating != null'),
  'the average Apple Score excludes unrated items rather than counting them as zero',
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`SHOP3: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  • ${f}`));
  process.exit(1);
}
console.log('Shopping is one room, and it is the one that warns you.');
