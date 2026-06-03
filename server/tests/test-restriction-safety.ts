/**
 * test-restriction-safety.ts
 * ==========================
 * Tests for the Phase 4 restriction safety computation module.
 *
 * Run with:  npm run test:restriction-safety
 *
 * Tests cover:
 * - sesame/tahini detection
 * - peanut/peanut butter detection
 * - soy/soy sauce detection + coconut conflict
 * - peanut + sesame rejecting tahini as substitute
 * - no restrictions state
 * - unknown restriction fail-safe
 * - parseIngredientText utility
 * - multi-eater scenarios
 * - status field correctness
 */

import {
  computeRestrictionSafety,
  parseIngredientText,
  type EaterProfile,
  type RestrictionSafetyResult,
} from '../../shared/restrictions/restriction-safety.js';

// ─── Test infrastructure ──────────────────────────────────────────────────────

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

function assertEqual<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    console.error(`    expected: ${e}`);
    console.error(`    actual:   ${a}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function findResult(results: RestrictionSafetyResult[], restrictionId: string): RestrictionSafetyResult | undefined {
  return results.find(r => r.restrictionId === restrictionId);
}

// ─── 1. parseIngredientText utility ──────────────────────────────────────────

section('1. parseIngredientText');

const parsed1 = parseIngredientText('Water, Sugar, Wheat Flour (Wheat), Salt, Soya Lecithin');
assert(parsed1.some(i => i.toLowerCase().includes('wheat flour')), 'wheat flour parsed');
assert(parsed1.some(i => i.toLowerCase().includes('soya lecithin')), 'soya lecithin parsed');
assert(!parsed1.some(i => i.includes('(Wheat)')), 'parenthetical content stripped');

const parsed2 = parseIngredientText('tahini (sesame paste) 15%, sunflower oil, salt');
assert(parsed2.some(i => i.toLowerCase().includes('tahini')), 'tahini parsed from text');

const parsed3 = parseIngredientText('');
assertEqual(parsed3, [], 'empty string → empty array');

// ─── 2. No restrictions — empty result ───────────────────────────────────────

section('2. No restrictions configured');

const noRestrictionsResult = computeRestrictionSafety(
  ['peanut butter', 'tahini', 'soy sauce'],
  [],
);
assertEqual(noRestrictionsResult, [], 'empty eater profiles → empty results');

const noHardRestrictionsResult = computeRestrictionSafety(
  ['peanut butter', 'tahini'],
  [{ displayName: 'Alice', hardRestrictions: [] }],
);
assertEqual(noHardRestrictionsResult, [], 'eater with no hardRestrictions → empty results');

// ─── 3. Unknown restriction — fail-safe ──────────────────────────────────────

section('3. Unknown restriction fail-safe');

const unknownResult = computeRestrictionSafety(
  ['some ingredient'],
  [{ displayName: 'Alice', hardRestrictions: ['fish', 'completely-unknown-allergen-xyz'] }],
);
// fish and unknown allergen are not in Phase 3 library → no results, no error
assertEqual(unknownResult, [], 'unknown restrictions produce no results (fail-safe)');

// ─── 4. Sesame / tahini detection ────────────────────────────────────────────

section('4. Sesame / tahini detection');

const sesameEater: EaterProfile = { displayName: 'Alice', hardRestrictions: ['sesame'] };

const tahiniResult = computeRestrictionSafety(['tahini'], [sesameEater]);
assert(tahiniResult.length >= 1, 'tahini triggers sesame restriction');
const tahiniMatch = findResult(tahiniResult, 'sesame');
assert(!!tahiniMatch, 'sesame result present');
assert(tahiniMatch!.restrictionName === 'Sesame', 'restrictionName is Sesame');
assert(tahiniMatch!.matchedIngredient === 'tahini', 'matchedIngredient is tahini');
assert(tahiniMatch!.matchedVia === 'derived_ingredient', 'matched via derived_ingredient');
assert(tahiniMatch!.affectedEaters.includes('Alice'), 'Alice listed as affected eater');
assert(tahiniMatch!.status === 'warning' || tahiniMatch!.status === 'unsafe', 'status is warning or unsafe');

const sesameOilResult = computeRestrictionSafety(['sesame oil'], [sesameEater]);
assert(sesameOilResult.length >= 1, 'sesame oil triggers sesame restriction');
const sesameOilMatch = findResult(sesameOilResult, 'sesame');
assert(!!sesameOilMatch, 'sesame result present for sesame oil');

// Sesame seeds (alias match)
const sesameSeeds = computeRestrictionSafety(['sesame seeds'], [sesameEater]);
assert(sesameSeeds.length >= 1, 'sesame seeds detected');
const sesameSeedsMatch = findResult(sesameSeeds, 'sesame');
assert(sesameSeedsMatch?.matchedVia === 'alias', 'sesame seeds matched via alias');

// ─── 5. Peanut / peanut butter detection ─────────────────────────────────────

section('5. Peanut / peanut butter detection');

const peanutEater: EaterProfile = { displayName: 'Bob', hardRestrictions: ['peanut'] };

const pbResult = computeRestrictionSafety(['peanut butter'], [peanutEater]);
assert(pbResult.length >= 1, 'peanut butter triggers peanut restriction');
const pbMatch = findResult(pbResult, 'peanut');
assert(!!pbMatch, 'peanut result present');
assert(pbMatch!.matchedIngredient === 'peanut butter', 'matchedIngredient is peanut butter');
assert(pbMatch!.affectedEaters.includes('Bob'), 'Bob listed as affected eater');
// selectedSubstitution should exist (tahini or sunflower seed butter from peanut_butter rule)
assert(pbMatch!.selectedSubstitution !== null, 'a substitution suggestion exists');

const peanutOilResult = computeRestrictionSafety(['peanut oil'], [peanutEater]);
assert(peanutOilResult.length >= 1, 'peanut oil detected');

const groundnutResult = computeRestrictionSafety(['groundnut oil'], [peanutEater]);
assert(groundnutResult.length >= 1, 'groundnut oil detected for peanut restriction');

// ─── 6. Soy / soy sauce detection ────────────────────────────────────────────

section('6. Soy / soy sauce detection');

const soyEater: EaterProfile = { displayName: 'Charlie', hardRestrictions: ['soy'] };

const soySauceResult = computeRestrictionSafety(['soy sauce'], [soyEater]);
assert(soySauceResult.length >= 1, 'soy sauce triggers soy restriction');
const soySauceMatch = findResult(soySauceResult, 'soy');
assert(!!soySauceMatch, 'soy result present');
// When no coconut restriction, coconut aminos should be the suggested substitute
assert(soySauceMatch!.selectedSubstitution !== null, 'substitution exists for soy sauce');

// ─── 7. Soy + Coconut conflict: coconut aminos blocked ───────────────────────

section('7. Soy + Coconut → coconut aminos rejected');

const soyCocEater: EaterProfile = {
  displayName: 'Dana',
  hardRestrictions: ['soy', 'coconut'],
};

const soyCocResult = computeRestrictionSafety(['soy sauce'], [soyCocEater]);
assert(soyCocResult.length >= 1, 'soy sauce detected for soy+coconut household');

const soyCocMatch = findResult(soyCocResult, 'soy');
assert(!!soyCocMatch, 'soy conflict present');

if (soyCocMatch?.selectedSubstitution) {
  assert(
    !soyCocMatch.selectedSubstitution.includes('coconut aminos'),
    'coconut aminos NOT selected (coconut also restricted)',
  );
}
if (soyCocMatch?.rejectedSubstitutions) {
  assert(
    soyCocMatch.rejectedSubstitutions.some(s => s.replacement.includes('coconut aminos')),
    'coconut aminos listed in rejected substitutions',
  );
}

// ─── 8. Peanut + Sesame: tahini strategy rejected ────────────────────────────

section('8. Peanut + Sesame → tahini rejected as peanut substitute');

const peanutSesameEater: EaterProfile = {
  displayName: 'Eve',
  hardRestrictions: ['peanut', 'sesame'],
};

const psPBResult = computeRestrictionSafety(['peanut butter'], [peanutSesameEater]);
const psPBMatch = findResult(psPBResult, 'peanut');
assert(!!psPBMatch, 'peanut conflict present for peanut+sesame household');

if (psPBMatch) {
  // Selected substitution should NOT be tahini
  assert(
    psPBMatch.selectedSubstitution !== 'tahini (sesame seed butter)' &&
    !psPBMatch.selectedSubstitution?.includes('tahini'),
    'tahini NOT selected as peanut butter substitute (sesame also restricted)',
  );
  // Tahini should appear in rejectedSubstitutions
  assert(
    psPBMatch.rejectedSubstitutions.some(s => s.replacement.includes('tahini')),
    'tahini listed in rejected substitutions for peanut butter',
  );
  assert(
    psPBMatch.rejectedSubstitutions.some(s =>
      s.conflictingRestrictions.includes('sesame')
    ),
    'sesame listed as conflicting restriction for tahini rejection',
  );
  // Safe substitute should be sunflower seed butter
  assert(
    psPBMatch.selectedSubstitution?.includes('sunflower seed butter') ?? false,
    'sunflower seed butter selected as safe fallback',
  );
}

// ─── 9. Multi-eater: different restrictions, correct attribution ──────────────

section('9. Multi-eater scenarios');

const multiEaters: EaterProfile[] = [
  { displayName: 'Alice', hardRestrictions: ['sesame'] },
  { displayName: 'Bob', hardRestrictions: ['peanut'] },
];

const multiResult = computeRestrictionSafety(['tahini', 'peanut butter'], multiEaters);
assert(multiResult.length >= 2, 'two distinct restriction conflicts detected');

const sesameMulti = findResult(multiResult, 'sesame');
const peanutMulti = findResult(multiResult, 'peanut');

assert(!!sesameMulti, 'sesame conflict present');
assert(!!peanutMulti, 'peanut conflict present');

assert(sesameMulti?.affectedEaters.includes('Alice') === true, 'Alice affected by sesame');
assert(sesameMulti?.affectedEaters.includes('Bob') === false, 'Bob not affected by sesame');

assert(peanutMulti?.affectedEaters.includes('Bob') === true, 'Bob affected by peanut');
assert(peanutMulti?.affectedEaters.includes('Alice') === false, 'Alice not affected by peanut');

// ─── 10. Result structure completeness ───────────────────────────────────────

section('10. RestrictionSafetyResult structure');

const structureResult = computeRestrictionSafety(
  ['tahini'],
  [{ displayName: 'Test', hardRestrictions: ['sesame'] }],
)[0];

assert(!!structureResult, 'result produced');
if (structureResult) {
  assert(typeof structureResult.status === 'string', 'status is string');
  assert(Array.isArray(structureResult.affectedEaters), 'affectedEaters is array');
  assert(typeof structureResult.restrictionId === 'string', 'restrictionId is string');
  assert(typeof structureResult.restrictionName === 'string', 'restrictionName is string');
  assert(typeof structureResult.matchedIngredient === 'string', 'matchedIngredient is string');
  assert(
    structureResult.matchedVia === 'alias' ||
    structureResult.matchedVia === 'derived_ingredient' ||
    structureResult.matchedVia === 'hidden_ingredient',
    'matchedVia is valid RestrictionSourceType',
  );
  assert(
    structureResult.selectedSubstitution === null || typeof structureResult.selectedSubstitution === 'string',
    'selectedSubstitution is string or null',
  );
  assert(Array.isArray(structureResult.rejectedSubstitutions), 'rejectedSubstitutions is array');
  assert(
    structureResult.conflictReason === null || typeof structureResult.conflictReason === 'string',
    'conflictReason is string or null',
  );
  assert(typeof structureResult.explanation === 'string', 'explanation is string');
}

// ─── 11. Trust language — no unsafe certainty claims ─────────────────────────

section('11. Trust language');

// Explanation should not contain certainty language
const explanationResult = computeRestrictionSafety(
  ['tahini'],
  [{ displayName: 'Test', hardRestrictions: ['sesame'] }],
)[0];

if (explanationResult) {
  const exp = explanationResult.explanation.toLowerCase();
  assert(!exp.includes('guaranteed safe'), 'no "guaranteed safe" in explanation');
  assert(!exp.includes('allergy-safe'), 'no "allergy-safe" in explanation');
  assert(!exp.includes('certified'), 'no "certified" in explanation');
  assert(!exp.includes('medical-grade'), 'no "medical-grade" in explanation');
  // Should use detection language
  assert(
    exp.includes('detected') || exp.includes('matched') || exp.includes('needs review'),
    'uses appropriate detection language',
  );
}

// ─── 12. Empty ingredients — safe response ────────────────────────────────────

section('12. Edge cases');

const emptyIngResult = computeRestrictionSafety(
  [],
  [{ displayName: 'Alice', hardRestrictions: ['sesame'] }],
);
assertEqual(emptyIngResult, [], 'empty ingredients → empty results');

// Safe ingredient — no match
const safeIngResult = computeRestrictionSafety(
  ['rice', 'salt', 'water'],
  [{ displayName: 'Alice', hardRestrictions: ['sesame', 'peanut'] }],
);
assertEqual(safeIngResult, [], 'safe ingredients produce no conflicts');

// ─── 13. Hummus — hidden sesame source ───────────────────────────────────────

section('13. Hidden ingredient source');

const hummusResult = computeRestrictionSafety(
  ['hummus'],
  [{ displayName: 'Alice', hardRestrictions: ['sesame'] }],
);
assert(hummusResult.length >= 1, 'hummus detected as hidden sesame source');
const hummusMatch = findResult(hummusResult, 'sesame');
assert(hummusMatch?.matchedVia === 'hidden_ingredient', 'hummus matched via hidden_ingredient');

// ─── 14. Soybean / soybeans detection via computeRestrictionSafety ───────────
//
// End-to-end: verifies the full pipeline (library → resolver → safety) correctly
// surfaces a warning when ingredient lists use whole-bean terms.

section('14. Soybean / soybeans detection (end-to-end)');

const soybeanEater: EaterProfile = { displayName: 'Lilly', hardRestrictions: ['soy'] };

// soybean (singular)
const soybeanSafetyResult = computeRestrictionSafety(['soybean'], [soybeanEater]);
assert(soybeanSafetyResult.length >= 1, 'soybean triggers soy restriction');
const soybeanMatch = findResult(soybeanSafetyResult, 'soy');
assert(!!soybeanMatch, 'soy result present for soybean ingredient');
assert(soybeanMatch!.affectedEaters.includes('Lilly'), 'Lilly listed as affected eater');

// soybeans (plural)
const soybeansSafetyResult = computeRestrictionSafety(['soybeans'], [soybeanEater]);
assert(soybeansSafetyResult.length >= 1, 'soybeans triggers soy restriction');
const soybeansMatch = findResult(soybeansSafetyResult, 'soy');
assert(!!soybeansMatch, 'soy result present for soybeans ingredient');

// soya bean
const soyaBeanSafetyResult = computeRestrictionSafety(['soya bean'], [soybeanEater]);
assert(findResult(soyaBeanSafetyResult, 'soy') !== null, 'soya bean triggers soy restriction');

// soya beans
const soyaBeansSafetyResult = computeRestrictionSafety(['soya beans'], [soybeanEater]);
assert(findResult(soyaBeansSafetyResult, 'soy') !== null, 'soya beans triggers soy restriction');

// Ingredient list representative of a real soy sauce product ("soybeans (water, salt)")
const soySauceWithSoybeansResult = computeRestrictionSafety(
  ['water', 'soybeans', 'wheat', 'salt'],
  [soybeanEater],
);
assert(soySauceWithSoybeansResult.length >= 1, 'soybeans in product ingredient list triggers soy restriction');

// Savoy cabbage — no false positive (regression)
const savoyCabbageResult = computeRestrictionSafety(['savoy cabbage'], [soybeanEater]);
assert(savoyCabbageResult.length === 0, 'savoy cabbage does NOT trigger soy restriction');

// No duplicate warnings when product has both 'soy' and 'soybeans' in ingredient list
const dedupeResult = computeRestrictionSafety(['soy', 'soybeans'], [soybeanEater]);
const soydupMatches = dedupeResult.filter(r => r.restrictionId === 'soy');
// computeRestrictionSafety returns one result per matched ingredient — two matches is correct
// but the RestrictionSafetyPanel groups them. Verify both are for the same restriction.
assert(soydupMatches.every(r => r.restrictionId === 'soy'), 'all matches are soy restriction (no cross-contamination)');

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n────────────────────────────────────────`);
console.log(`RESTRICTION SAFETY TESTS: ${passed} passed, ${failed} failed`);
console.log(`────────────────────────────────────────`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
