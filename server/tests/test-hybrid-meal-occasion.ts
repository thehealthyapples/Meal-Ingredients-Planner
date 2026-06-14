/**
 * test-hybrid-meal-occasion.ts
 * ============================
 * Verifies the Hybrid Meal Occasion model (primarySlot / suitableSlots / energyBand /
 * styleTags) and its human-centred Style Tags, with full backward compatibility.
 *
 * Guarantees under test:
 *  - Existing meals (category only, no suitableSlots) keep their exact slot eligibility.
 *  - A curated meal with explicit suitableSlots uses it for slot fit.
 *  - energyBand and styleTags are display-only — they never enter slot eligibility.
 *  - Style tag slug → display label mapping is correct (Family Table, Quick & Easy, …).
 *  - System-derived tags only ever produce the three derivable slugs.
 *
 * Run with: npx tsx server/tests/test-hybrid-meal-occasion.ts
 */

import { getCandidateSlotFit } from '../lib/smart-suggest-service.js';
import type { ScoredCandidate } from '../lib/meal-scoring-service.js';
import {
  STYLE_TAG_DISPLAY_MAP,
  STYLE_TAG_SLUGS,
  getStyleTagDisplayLabel,
  deriveSystemStyleTags,
  deriveSuitableSlots,
  CATEGORY_SLOT_MAPPING,
  MEAL_SLOTS,
  type MealSlot,
} from '@shared/style-tags';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// Minimal candidate factory — only the fields getCandidateSlotFit reads matter.
function candidate(partial: Partial<ScoredCandidate>): ScoredCandidate {
  return { id: 1, name: 'test', category: null, ...partial } as ScoredCandidate;
}

// The live planner mapping, mirrored for an independent expected-value oracle.
const SLOT_CATEGORY_MAPPING: Record<string, string[]> = {
  breakfast: ['breakfast', 'smoothie'],
  lunch: ['lunch', 'snack', 'salad'],
  dinner: ['dinner', 'main'],
  snack: ['snack', 'dessert', 'smoothie', 'drink'],
};
function expectedLegacyFit(category: string | null, slot: string): boolean {
  if (!category) return slot === 'dinner';
  return (SLOT_CATEGORY_MAPPING[slot] || [slot]).includes(category.toLowerCase());
}

// ───────────────────────────────────────────────────────────────────────────
section('Test 1 — old meal (category only) still works (legacy path unchanged)');
{
  const categories = ['breakfast', 'smoothie', 'lunch', 'snack', 'salad', 'dinner', 'main', 'dessert', 'drink'];
  for (const cat of categories) {
    for (const slot of MEAL_SLOTS) {
      const got = getCandidateSlotFit(candidate({ category: cat }), slot);
      const want = expectedLegacyFit(cat, slot);
      assert(got === want, `category="${cat}" slot="${slot}" → ${want}`, `got ${got}`);
    }
  }
  // null category → only dinner
  for (const slot of MEAL_SLOTS) {
    assert(
      getCandidateSlotFit(candidate({ category: null }), slot) === (slot === 'dinner'),
      `null category slot="${slot}" → ${slot === 'dinner'}`,
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────
section('Test 2 — meal with primarySlot + suitableSlots works');
{
  const c = candidate({ category: 'dinner', primarySlot: 'lunch', suitableSlots: ['lunch', 'dinner'] });
  assert(getCandidateSlotFit(c, 'lunch') === true, 'suitableSlots includes lunch → true');
  assert(getCandidateSlotFit(c, 'dinner') === true, 'suitableSlots includes dinner → true');
  assert(getCandidateSlotFit(c, 'breakfast') === false, 'suitableSlots excludes breakfast → false');
  assert(getCandidateSlotFit(c, 'snack') === false, 'suitableSlots excludes snack → false');
}

// ───────────────────────────────────────────────────────────────────────────
section('Test 3 — Cooked Breakfast: primary breakfast, suitable [breakfast,lunch,dinner]');
{
  const c = candidate({ primarySlot: 'breakfast', suitableSlots: ['breakfast', 'lunch', 'dinner'] });
  assert(getCandidateSlotFit(c, 'breakfast') === true, 'fits breakfast');
  assert(getCandidateSlotFit(c, 'lunch') === true, 'fits lunch');
  assert(getCandidateSlotFit(c, 'dinner') === true, 'fits dinner');
  assert(getCandidateSlotFit(c, 'snack') === false, 'does not fit snack');
}

// ───────────────────────────────────────────────────────────────────────────
section('Test 4 — Smoothie: primary breakfast, suitable [breakfast,snack]');
{
  const c = candidate({ primarySlot: 'breakfast', suitableSlots: ['breakfast', 'snack'] });
  assert(getCandidateSlotFit(c, 'breakfast') === true, 'fits breakfast');
  assert(getCandidateSlotFit(c, 'snack') === true, 'fits snack');
  assert(getCandidateSlotFit(c, 'lunch') === false, 'does not fit lunch');
  assert(getCandidateSlotFit(c, 'dinner') === false, 'does not fit dinner');
}

// ───────────────────────────────────────────────────────────────────────────
section('Test 5 — Soup & Side: primary lunch, suitable [lunch,dinner]');
{
  const c = candidate({ primarySlot: 'lunch', suitableSlots: ['lunch', 'dinner'] });
  assert(getCandidateSlotFit(c, 'lunch') === true, 'fits lunch');
  assert(getCandidateSlotFit(c, 'dinner') === true, 'fits dinner');
  assert(getCandidateSlotFit(c, 'breakfast') === false, 'does not fit breakfast');
  assert(getCandidateSlotFit(c, 'snack') === false, 'does not fit snack');
}

// ───────────────────────────────────────────────────────────────────────────
section('Test 6 — energyBand does not affect eligibility');
{
  for (const band of ['light', 'medium', 'hearty']) {
    const withBand = candidate({ category: 'dinner', energyBand: band });
    const without = candidate({ category: 'dinner' });
    for (const slot of MEAL_SLOTS) {
      assert(
        getCandidateSlotFit(withBand, slot) === getCandidateSlotFit(without, slot),
        `energyBand="${band}" slot="${slot}" leaves eligibility unchanged`,
      );
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
section('Test 7 — styleTags are display-only metadata (no eligibility effect)');
{
  const tags = ['shared-meal', 'comfort', 'quick', 'family-pleaser'];
  const withTags = candidate({ category: 'dinner', styleTags: tags } as Partial<ScoredCandidate>);
  const without = candidate({ category: 'dinner' });
  for (const slot of MEAL_SLOTS) {
    assert(
      getCandidateSlotFit(withTags, slot) === getCandidateSlotFit(without, slot),
      `styleTags present slot="${slot}" leaves eligibility unchanged`,
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────
section('Test 8 — backfilled suitableSlots reproduces legacy eligibility exactly');
{
  // For every category, a curated candidate whose suitableSlots = the inverse-mapping
  // backfill must fit the same slots as the legacy category-only candidate.
  for (const cat of Object.keys(CATEGORY_SLOT_MAPPING)) {
    const derived = deriveSuitableSlots(cat);
    const curated = candidate({ category: cat, suitableSlots: derived });
    const legacy = candidate({ category: cat });
    for (const slot of MEAL_SLOTS) {
      assert(
        getCandidateSlotFit(curated, slot) === getCandidateSlotFit(legacy, slot),
        `backfill parity category="${cat}" slot="${slot}"`,
        `curated=${getCandidateSlotFit(curated, slot)} legacy=${getCandidateSlotFit(legacy, slot)}`,
      );
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
section('Style Tag display label map');
{
  const expected: Record<string, string> = {
    'shared-meal': 'Family Table',
    adaptable: 'Adaptable',
    'family-pleaser': 'Family Pleaser',
    quick: 'Quick & Easy',
    comfort: 'Comfort',
    fresh: 'Fresh',
    indulgent: 'Indulgent',
    buffet: 'Buffet',
    bar: 'Bar',
    'one-pot': 'One Pot',
  };
  for (const [slug, label] of Object.entries(expected)) {
    assert(STYLE_TAG_DISPLAY_MAP[slug as keyof typeof STYLE_TAG_DISPLAY_MAP] === label,
      `${slug} → "${label}"`);
    assert(getStyleTagDisplayLabel(slug) === label, `getStyleTagDisplayLabel("${slug}") → "${label}"`);
  }
  // every canonical slug has a label
  assert(STYLE_TAG_SLUGS.every(s => !!STYLE_TAG_DISPLAY_MAP[s]), 'every slug has a display label');
  // Fuss Free intentionally absent (merged into Quick & Easy)
  assert(!(STYLE_TAG_SLUGS as readonly string[]).includes('fuss-free'), 'fuss-free slug is NOT implemented');
  // unknown slug falls back to raw value
  assert(getStyleTagDisplayLabel('totally-unknown') === 'totally-unknown', 'unknown slug falls back to raw');
}

// ───────────────────────────────────────────────────────────────────────────
section('System-derived style tags (deterministic, derivable subset only)');
{
  // shared-meal: any component slot present
  assert(
    deriveSystemStyleTags({ proteinSlots: ['chicken'] }).includes('shared-meal'),
    'protein slot → shared-meal',
  );
  assert(
    deriveSystemStyleTags({ toppingSlots: ['cheese'] }).includes('shared-meal'),
    'topping slot → shared-meal',
  );
  assert(
    !deriveSystemStyleTags({ proteinSlots: [], carbSlots: [] }).includes('shared-meal'),
    'no component slots → no shared-meal',
  );
  // adaptable: compatibleDiets.length >= 2
  assert(
    deriveSystemStyleTags({ compatibleDiets: ['vegan', 'gluten-free'] }).includes('adaptable'),
    '2 compatible diets → adaptable',
  );
  assert(
    !deriveSystemStyleTags({ compatibleDiets: ['vegan'] }).includes('adaptable'),
    '1 compatible diet → no adaptable',
  );
  // quick: estimatedTotalTime < 20
  assert(deriveSystemStyleTags({ estimatedTotalTime: 15 }).includes('quick'), 'time 15 → quick');
  assert(!deriveSystemStyleTags({ estimatedTotalTime: 25 }).includes('quick'), 'time 25 → no quick');
  assert(!deriveSystemStyleTags({ estimatedTotalTime: null }).includes('quick'), 'null time → no quick');
  // curated-only tags never derived
  const all = deriveSystemStyleTags({
    proteinSlots: ['x'], compatibleDiets: ['a', 'b'], estimatedTotalTime: 10,
  });
  const curatedOnly = ['family-pleaser', 'comfort', 'fresh', 'indulgent', 'buffet', 'bar', 'one-pot'];
  assert(curatedOnly.every(t => !all.includes(t as any)), 'curated-only tags are never system-derived');
  assert(all.length === 3, 'all three derivable tags produced when all conditions met', `got ${all.join(',')}`);
}

// ───────────────────────────────────────────────────────────────────────────
section('Category → slot inverse mapping integrity');
{
  // Every mapped slot must be a valid MealSlot.
  for (const [cat, slots] of Object.entries(CATEGORY_SLOT_MAPPING)) {
    assert(
      slots.every(s => (MEAL_SLOTS as readonly string[]).includes(s)),
      `category="${cat}" maps only to valid slots`,
    );
  }
  // Inverse must agree with the forward SLOT_CATEGORY_MAPPING.
  for (const [cat, slots] of Object.entries(CATEGORY_SLOT_MAPPING)) {
    const want = (MEAL_SLOTS as readonly MealSlot[]).filter(s =>
      (SLOT_CATEGORY_MAPPING[s] || []).includes(cat),
    );
    assert(
      JSON.stringify([...slots].sort()) === JSON.stringify([...want].sort()),
      `inverse mapping for "${cat}" matches forward mapping`,
      `inverse=${slots} forward=${want}`,
    );
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`Hybrid Meal Occasion: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(60));
process.exit(failed === 0 ? 0 : 1);
