/**
 * test-substitution-rules.ts
 * ==========================
 * Tests for the Phase 3B deterministic substitution rule engine.
 *
 * Run with:  npm run test:substitution-rules
 *
 * Tests cover:
 * - All Phase 3B substitutions (peanut, tree_nut, sesame, soy, mustard,
 *   shellfish, eggs, coconut)
 * - Cross-restriction conflict detection and safe strategy fallback
 * - Conflict reporting when all strategies are blocked
 * - Existing Phase 1 behaviour preserved (gluten, dairy, vegan, vegetarian)
 * - detectActiveTriggers extended correctly
 * - matchSubstitutionRulesWithConflicts structure
 * - collectProhibitedPhrases still works
 */

import {
  matchSubstitutionRules,
  matchSubstitutionRulesWithConflicts,
  listSubstitutionOptions,
  detectActiveTriggers,
  collectProhibitedPhrases,
  listAllCuratedReplacements,
  RULE_LIBRARY_VERSION,
  type CookingAdjustment,
  type ConflictReport,
  type DietTrigger,
} from '../../shared/substitution-rules.js';
import { validateAdaptationSafety } from '../lib/household-dietary-safety.js';

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

// ─── 1. Library version ───────────────────────────────────────────────────────

section('1. Library version');
assert(RULE_LIBRARY_VERSION === '3.0.0', `RULE_LIBRARY_VERSION is 3.0.0 (actual: ${RULE_LIBRARY_VERSION})`);

// ─── 2. detectActiveTriggers — Phase 3B new triggers ─────────────────────────

section('2. detectActiveTriggers — Phase 3B new triggers');

const peanutTriggers = detectActiveTriggers(['peanut']);
assert(peanutTriggers.has('peanut_free'), 'peanut → peanut_free');
assert(peanutTriggers.has('nut_free'), 'peanut → nut_free (conservative expansion)');

const treeNutTriggers = detectActiveTriggers(['tree nut']);
assert(treeNutTriggers.has('tree_nut_free'), 'tree nut → tree_nut_free');
assert(treeNutTriggers.has('nut_free'), 'tree nut → nut_free');

const nutFreeTriggers = detectActiveTriggers(['nut_free']);
assert(nutFreeTriggers.has('peanut_free'), 'nut_free → peanut_free (legacy expansion)');
assert(nutFreeTriggers.has('tree_nut_free'), 'nut_free → tree_nut_free (legacy expansion)');
assert(nutFreeTriggers.has('nut_free'), 'nut_free → nut_free (preserved)');

const sesameTriggers = detectActiveTriggers(['sesame']);
assert(sesameTriggers.has('sesame_free'), 'sesame → sesame_free');

const soyTriggers = detectActiveTriggers(['soy']);
assert(soyTriggers.has('soy_free'), 'soy → soy_free');

const soyaTriggers = detectActiveTriggers(['soya']);
assert(soyaTriggers.has('soy_free'), 'soya → soy_free');

const mustardTriggers = detectActiveTriggers(['mustard']);
assert(mustardTriggers.has('mustard_free'), 'mustard → mustard_free');

const shellfishTriggers = detectActiveTriggers(['shellfish']);
assert(shellfishTriggers.has('shellfish_free'), 'shellfish → shellfish_free');

const eggTriggers = detectActiveTriggers(['egg']);
assert(eggTriggers.has('egg_free'), 'egg → egg_free');

const coconutTriggers = detectActiveTriggers(['coconut']);
assert(coconutTriggers.has('coconut_free'), 'coconut → coconut_free');

// Coeliac still activates gluten_free (Phase 1 preserved)
const coeliacTriggers = detectActiveTriggers(['coeliac']);
assert(coeliacTriggers.has('gluten_free'), 'coeliac → gluten_free (Phase 1 preserved)');

// ─── 3. detectActiveTriggers — Phase 1 preserved ──────────────────────────────

section('3. detectActiveTriggers — Phase 1 behaviour preserved');

const veganTriggers = detectActiveTriggers(['vegan']);
assert(veganTriggers.has('vegan'),       'vegan → vegan');
assert(veganTriggers.has('vegetarian'),  'vegan → vegetarian (implied)');
assert(veganTriggers.has('dairy_free'),  'vegan → dairy_free (implied)');

const vegTriggers = detectActiveTriggers(['vegetarian']);
assert(vegTriggers.has('vegetarian'), 'vegetarian → vegetarian');
assert(!vegTriggers.has('vegan'),     'vegetarian → NOT vegan');

const dairyTriggers = detectActiveTriggers(['dairy-free']);
assert(dairyTriggers.has('dairy_free'), 'dairy-free → dairy_free');

const glutenTriggers = detectActiveTriggers(['gluten-free']);
assert(glutenTriggers.has('gluten_free'), 'gluten-free → gluten_free');

const nutFreeRegex = detectActiveTriggers(['nut-free']);
assert(nutFreeRegex.has('nut_free'), 'nut-free → nut_free (Phase 1 regex preserved)');

// ─── 4. Peanut substitutions ──────────────────────────────────────────────────

section('4. Peanut substitutions');

// Peanut-only restriction: tahini is the PREFERRED culinary substitute (sesame is safe)
const pbResult = matchSubstitutionRules(['200g peanut butter'], ['peanut']);
assert(pbResult.length === 1, 'peanut butter rule fires for peanut restriction');
assert(pbResult[0]!.replacement.includes('tahini'), 'peanut butter → tahini (preferred when sesame not restricted)');
assert(pbResult[0]!.prohibitedPhrases.includes('peanut butter'), 'peanut butter in prohibited phrases');

const peanutOilResult = matchSubstitutionRules(['2 tbsp peanut oil'], ['peanut']);
assert(peanutOilResult.length === 1, 'peanut oil rule fires');
assert(peanutOilResult[0]!.replacement.includes('neutral oil'), 'peanut oil → neutral oil');

const groundnutOilResult = matchSubstitutionRules(['1 tbsp groundnut oil'], ['groundnut']);
assert(groundnutOilResult.length === 1, 'groundnut oil rule fires for groundnut restriction');

// ─── 5. Tree nut substitutions ────────────────────────────────────────────────

section('5. Tree nut substitutions');

const almondMilkResult = matchSubstitutionRules(['300ml almond milk'], ['tree nut']);
assert(almondMilkResult.length === 1, 'almond milk rule fires for tree nut restriction');
assert(almondMilkResult[0]!.replacement.includes('oat milk'), 'almond milk → oat milk');
assert(almondMilkResult[0]!.prohibitedPhrases.includes('almond milk'), 'almond milk in prohibited phrases');

// almond flour: oat flour is first strategy (preferred). Safe when no gluten restriction.
const almondFlourResult = matchSubstitutionRules(['100g almond flour'], ['tree nut']);
assert(almondFlourResult.length === 1, 'almond flour rule fires');
assert(almondFlourResult[0]!.replacement.includes('oat flour'), 'almond flour → oat flour (preferred; no gluten restriction)');

const nutButterResult = matchSubstitutionRules(['2 tbsp nut butter'], ['tree nut']);
assert(nutButterResult.length === 1, 'nut butter rule fires for tree nut restriction');

// nut_free also activates tree_nut_free
const almondMilkFromNutFree = matchSubstitutionRules(['300ml almond milk'], ['nut_free']);
assert(almondMilkFromNutFree.length === 1, 'almond milk rule fires for nut_free (legacy) restriction');

// ─── 6. Sesame substitutions ──────────────────────────────────────────────────

section('6. Sesame substitutions');

const tahiniResult = matchSubstitutionRules(['3 tbsp tahini'], ['sesame']);
assert(tahiniResult.length === 1, 'tahini rule fires for sesame restriction');
assert(tahiniResult[0]!.replacement.includes('sunflower seed butter'), 'tahini → sunflower seed butter');
assert(tahiniResult[0]!.prohibitedPhrases.includes('tahini'), 'tahini in prohibited phrases');

const sesameOilResult = matchSubstitutionRules(['1 tsp sesame oil'], ['sesame']);
assert(sesameOilResult.length === 1, 'sesame oil rule fires');
assert(sesameOilResult[0]!.replacement.includes('neutral oil'), 'sesame oil → neutral oil');

const toastedSesameResult = matchSubstitutionRules(['1 tsp toasted sesame oil'], ['sesame seed']);
assert(toastedSesameResult.length === 1, 'toasted sesame oil fires for "sesame seed" restriction');

// ─── 7. Soy substitutions ─────────────────────────────────────────────────────

section('7. Soy substitutions');

const soySauceResult = matchSubstitutionRules(['2 tbsp soy sauce'], ['soy']);
assert(soySauceResult.length === 1, 'soy sauce rule fires for soy restriction');
assert(soySauceResult[0]!.replacement.includes('coconut aminos'), 'soy sauce → coconut aminos (first strategy)');

const tofuResult = matchSubstitutionRules(['200g firm tofu'], ['soy']);
assert(tofuResult.length === 1, 'tofu (as ingredient) rule fires for soy restriction');
assert(tofuResult[0]!.replacement.includes('chickpeas'), 'tofu → chickpeas');
assert(tofuResult[0]!.prohibitedPhrases.some(p => p.includes('tofu')), 'tofu in prohibited phrases');

const misoResult = matchSubstitutionRules(['1 tbsp miso paste'], ['soya']);
assert(misoResult.length === 1, 'miso rule fires for soya restriction');

const edamameResult = matchSubstitutionRules(['100g edamame'], ['soy']);
assert(edamameResult.length === 1, 'edamame rule fires for soy restriction');
assert(edamameResult[0]!.replacement.includes('broad beans'), 'edamame → broad beans');

// ─── 8. Egg substitutions ─────────────────────────────────────────────────────

section('8. Egg substitutions');

const eggWashResult = matchSubstitutionRules(['egg wash'], ['egg']);
assert(eggWashResult.length === 1, 'egg wash rule fires for egg restriction');
assert(eggWashResult[0]!.replacement.includes('plant-based milk'), 'egg wash → plant-based milk wash');
assert(eggWashResult[0]!.prohibitedPhrases.includes('egg wash'), 'egg wash in prohibited phrases');

const eggsResult = matchSubstitutionRules(['2 large eggs'], ['egg-free']);
assert(eggsResult.length === 1, 'eggs (baking) rule fires for egg-free restriction');
assert(eggsResult[0]!.replacement.includes('flax egg'), 'eggs → flax egg (first strategy)');
assert(eggsResult[0]!.cookingNotes.length > 0, 'cooking notes provided');

const meringueResult = matchSubstitutionRules(['meringue'], ['egg allergy']);
// Note: "egg allergy" may not be in aliases; test with "egg" or "eggs"
const meringueResult2 = matchSubstitutionRules(['meringue'], ['egg']);
assert(meringueResult2.length === 1, 'meringue rule fires for egg restriction');
assert(meringueResult2[0]!.replacement.includes('aquafaba'), 'meringue → aquafaba meringue');

// ─── 9. Coconut substitutions ─────────────────────────────────────────────────

section('9. Coconut substitutions');

const coconutMilkResult = matchSubstitutionRules(['400ml coconut milk'], ['coconut']);
assert(coconutMilkResult.length === 1, 'coconut milk rule fires for coconut restriction');
assert(coconutMilkResult[0]!.replacement.includes('oat cream'), 'coconut milk → oat cream');
assert(coconutMilkResult[0]!.prohibitedPhrases.includes('coconut milk'), 'coconut milk in prohibited phrases');

const coconutOilResult = matchSubstitutionRules(['2 tbsp coconut oil'], ['coconut-free']);
assert(coconutOilResult.length === 1, 'coconut oil rule fires for coconut-free restriction');
assert(coconutOilResult[0]!.replacement.includes('neutral oil'), 'coconut oil → neutral oil');

const coconutCreamResult = matchSubstitutionRules(['200ml coconut cream'], ['coconut']);
assert(coconutCreamResult.length === 1, 'coconut cream rule fires');
assert(coconutCreamResult[0]!.replacement.includes('oat cream'), 'coconut cream → oat cream (first safe strategy)');

// ─── 10. Mustard substitutions ───────────────────────────────────────────────

section('10. Mustard substitutions');

const dijonResult = matchSubstitutionRules(['1 tsp dijon mustard'], ['mustard']);
assert(dijonResult.length === 1, 'dijon mustard rule fires for mustard restriction');
assert(dijonResult[0]!.prohibitedPhrases.includes('mustard'), 'mustard in prohibited phrases');

const mustardPowderResult = matchSubstitutionRules(['½ tsp mustard powder'], ['mustard allergy']);
// mustard allergy is in the mustard aliases
const mustardPowderResult2 = matchSubstitutionRules(['½ tsp mustard powder'], ['mustard']);
assert(mustardPowderResult2.length === 1, 'mustard powder rule fires');

// ─── 11. Shellfish allergen substitutions ─────────────────────────────────────

section('11. Shellfish allergen substitutions');

const prawnResult = matchSubstitutionRules(['200g prawns'], ['shellfish']);
assert(prawnResult.length === 1, 'prawn rule fires for shellfish restriction');
assert(prawnResult[0]!.replacement.includes('chickpeas'), 'prawns → smoked chickpeas');
assert(prawnResult[0]!.prohibitedPhrases.includes('de-vein'), 'de-vein in prohibited phrases');

const oysterSauceResult = matchSubstitutionRules(['2 tbsp oyster sauce'], ['shellfish']);
assert(oysterSauceResult.length === 1, 'oyster sauce rule fires for shellfish restriction');
assert(oysterSauceResult[0]!.replacement.includes('mushroom sauce'), 'oyster sauce → mushroom sauce');

// shellfish rule also fires for crustacean alias
const crustaceanResult = matchSubstitutionRules(['150g shrimp'], ['crustacean']);
assert(crustaceanResult.length === 1, 'shrimp rule fires for crustacean restriction');

// ─── 12. Cross-restriction: Peanut + Sesame → tahini strategy rejected ────────

section('12. Cross-restriction: Peanut + Sesame → tahini rejected');

const { adjustments: pnSesAdj, conflicts: pnSesCon } = matchSubstitutionRulesWithConflicts(
  ['200g peanut butter'],
  ['peanut', 'sesame'],
);

assert(pnSesAdj.length === 1, 'still produces an adjustment (sunflower seed butter)');
assert(pnSesAdj[0]!.replacement.includes('sunflower seed butter'), 'safe strategy is sunflower seed butter');
assert(!pnSesAdj[0]!.replacement.includes('tahini'), 'tahini NOT selected');

assert(pnSesCon.length === 1, 'one conflict report generated');
assert(pnSesCon[0]!.ruleId === 'peanut_butter', 'conflict on peanut_butter rule');
assert(
  pnSesCon[0]!.rejectedStrategies.some(s => s.replacement.includes('tahini')),
  'tahini listed in rejected strategies',
);
assert(
  pnSesCon[0]!.rejectedStrategies.some(s => s.conflictingRestrictions.includes('sesame')),
  'sesame listed as conflicting restriction',
);

// ─── 13. Cross-restriction: Soy + Coconut → coconut aminos rejected ───────────

section('13. Cross-restriction: Soy + Coconut → coconut aminos rejected');

const { adjustments: soyCocAdj, conflicts: soyCocCon } = matchSubstitutionRulesWithConflicts(
  ['2 tbsp soy sauce'],
  ['soy', 'coconut'],
);

assert(soyCocAdj.length === 1, 'still produces an adjustment');
assert(!soyCocAdj[0]!.replacement.includes('coconut aminos'), 'coconut aminos NOT selected');
assert(soyCocAdj[0]!.replacement.includes('balsamic vinegar') || soyCocAdj[0]!.replacement.includes('salt'), 'safe fallback strategy selected');

assert(soyCocCon.length === 1, 'one conflict report for soy_sauce rule');
assert(
  soyCocCon[0]!.rejectedStrategies.some(s => s.replacement.includes('coconut aminos')),
  'coconut aminos in rejected strategies',
);
assert(
  soyCocCon[0]!.rejectedStrategies.some(s => s.conflictingRestrictions.includes('coconut')),
  'coconut listed as conflicting restriction',
);

// ─── 14. Cross-restriction: soy vegetarian → tofu rejected for chicken ────────

section('14. Cross-restriction: vegetarian + soy → tofu strategy rejected for chicken');

const { adjustments: vegSoyAdj, conflicts: vegSoyCon } = matchSubstitutionRulesWithConflicts(
  ['300g chicken breast'],
  ['vegetarian', 'soy'],
);

assert(vegSoyAdj.length === 1, 'still produces a chicken substitution');
assert(!vegSoyAdj[0]!.replacement.includes('tofu'), 'tofu NOT selected (soy conflict)');
assert(
  vegSoyAdj[0]!.replacement.includes('chickpeas') || vegSoyAdj[0]!.replacement.includes('cauliflower'),
  'safe alternative selected (chickpeas or cauliflower)',
);

assert(
  vegSoyCon.some(c => c.ruleId === 'chicken_breast' && c.rejectedStrategies.some(s => s.replacement.includes('tofu'))),
  'tofu strategy rejection recorded in conflicts',
);

// ─── 15. Cross-restriction: dairy_free + coconut → cream substitution ─────────

section('15. Cross-restriction: dairy_free + coconut → oat cream selected');

const creamResult = matchSubstitutionRules(['200ml double cream'], ['dairy', 'coconut']);
assert(creamResult.length === 1, 'cream rule fires');
assert(creamResult[0]!.replacement.includes('oat cream'), 'oat cream selected (coconut cream rejected)');

const { adjustments: creamAdj, conflicts: creamCon } = matchSubstitutionRulesWithConflicts(
  ['200ml double cream'],
  ['dairy', 'coconut'],
);
assert(
  creamCon.some(c => c.ruleId === 'cream' && c.rejectedStrategies.some(s => s.replacement.includes('coconut cream'))),
  'coconut cream rejection recorded',
);

// ─── 16. All strategies blocked — conflict-only result ────────────────────────

section('16. All strategies blocked → conflict report, no adjustment');

// Coconut yoghurt: strategy 1 = natural yoghurt (conflicts: dairy),
//                 strategy 2 = oat-based yoghurt (no conflicts)
// So oat yoghurt should be selected even when dairy is restricted

const { adjustments: coconutYogAdj } = matchSubstitutionRulesWithConflicts(
  ['coconut yoghurt'],
  ['coconut', 'dairy'],
);
assert(coconutYogAdj.length === 1, 'coconut yoghurt: oat-based yoghurt selected when dairy also restricted');
assert(coconutYogAdj[0]!.replacement.includes('oat-based yoghurt'), 'oat-based yoghurt is the safe fallback');

// Construct a scenario where truly all strategies fail:
// almond flour has: strategy 1 = sunflower seed flour (no conflicts),
// strategy 2 = oat flour (conflicts: gluten)
// With tree_nut + gluten restriction: sunflower seed flour (no conflicts) is selected first → adjustment made

const almondFlourCross = matchSubstitutionRulesWithConflicts(
  ['100g almond flour'],
  ['tree nut', 'gluten'],
);
assert(almondFlourCross.adjustments.length === 1, 'almond flour: sunflower seed flour selected (no conflicts)');
assert(
  almondFlourCross.conflicts.some(c => c.rejectedStrategies.some(s => s.replacement.includes('oat flour'))),
  'oat flour rejection recorded (gluten conflict)',
);

// ─── 17. Multiple restrictions — deterministic behaviour ─────────────────────

section('17. Multiple restrictions — deterministic');

const multiResult = matchSubstitutionRules(
  ['300g chicken breast', '200ml double cream', '3 tbsp soy sauce'],
  ['vegetarian', 'soy', 'coconut'],
);

// vegetarian → chicken rule fires → chickpeas (tofu rejected via soy)
// dairy_free (from vegetarian? No, vegetarian doesn't imply dairy_free) — check
// Actually vegetarian does NOT add dairy_free. So cream rule won't fire for vegetarian alone.
// soy → soy_sauce rule fires → balsamic fallback (coconut aminos rejected)

const chickenAdj = multiResult.find(a => a.matchedIngredient.includes('chicken'));
const soySauceAdj = multiResult.find(a => a.matchedIngredient.includes('soy sauce'));

assert(!!chickenAdj, 'chicken adjustment present');
assert(!chickenAdj!.replacement.includes('tofu'), 'chicken: tofu not used (soy restricted)');
assert(!!soySauceAdj, 'soy sauce adjustment present');
assert(!soySauceAdj!.replacement.includes('coconut aminos'), 'soy sauce: coconut aminos not used (coconut restricted)');

// ─── 18. Regression — Phase 1 gluten_free still works ────────────────────────

section('18. Regression — gluten_free behaviour preserved');

const pastaResult = matchSubstitutionRules(['200g spaghetti'], ['gluten-free']);
assert(pastaResult.length === 1, 'pasta rule still fires for gluten-free');
assert(pastaResult[0]!.replacement.includes('gluten-free pasta'), 'pasta → GF pasta');
assert(pastaResult[0]!.cookingNotes.length > 0, 'cooking notes present');

const coeliacResult = matchSubstitutionRules(['200g penne'], ['coeliac']);
assert(coeliacResult.length === 1, 'pasta rule fires for coeliac');
const pastaChoices = listSubstitutionOptions(['200g spaghetti'], ['Gluten-Free'])
  .filter(option => option.ruleId === 'wheat_pasta').map(option => option.replacement);
assertEqual(pastaChoices, ['gluten-free pasta (rice or corn-based)', 'rice noodles', 'courgette noodles'],
  'pasta has three ranked, declared choices while the legacy first choice stays unchanged');

// ─── 19. Regression — dairy_free still works ──────────────────────────────────

section('19. Regression — dairy_free behaviour preserved');

const cheeseResult = matchSubstitutionRules(['50g cheddar'], ['dairy-free']);
assert(cheeseResult.length === 1, 'cheese rule fires for dairy-free');
assert(cheeseResult[0]!.replacement.includes('dairy-free cheese'), 'cheese → dairy-free cheese');

// dairy-free only: coconut cream is now preferred (first strategy). Oat cream is fallback.
const creamReg = matchSubstitutionRules(['150ml double cream'], ['dairy-free']);
assert(creamReg.length === 1, 'cream rule fires for dairy-free');
assert(
  creamReg[0]!.replacement.includes('coconut cream') || creamReg[0]!.replacement.includes('oat cream'),
  'cream → coconut cream (preferred) or oat cream (if coconut restricted)',
);

// ─── 20. Regression — vegan still works ───────────────────────────────────────

section('20. Regression — vegan behaviour preserved');

const beefResult = matchSubstitutionRules(['500g beef mince'], ['vegan']);
assert(beefResult.length === 1, 'beef mince rule fires for vegan');
assert(beefResult[0]!.replacement.includes('lentils'), 'beef mince → lentils');

const baconResult = matchSubstitutionRules(['100g bacon'], ['vegan']);
assert(baconResult.length === 1, 'bacon rule fires for vegan');
assert(baconResult[0]!.replacement.includes('paprika and mushrooms'), 'bacon → paprika+mushrooms (tofu strategy skipped as vegan doesn\'t imply soy restriction)');

// ─── 21. Regression — vegetarian still works ─────────────────────────────────

section('21. Regression — vegetarian behaviour preserved');

const chickenVegResult = matchSubstitutionRules(['2 chicken breasts'], ['vegetarian']);
assert(chickenVegResult.length === 1, 'chicken rule fires for vegetarian');
assert(chickenVegResult[0]!.replacement.includes('tofu'), 'chicken → tofu (first strategy; soy not restricted)');

const shellfishVegResult = matchSubstitutionRules(['200g prawns'], ['vegetarian']);
assert(shellfishVegResult.length === 1, 'shellfish rule fires for vegetarian');
assert(shellfishVegResult[0]!.replacement.includes('chickpeas'), 'prawns → chickpeas for vegetarian');

// ─── 22. collectProhibitedPhrases still works ────────────────────────────────

section('22. collectProhibitedPhrases — extended with Phase 3B phrases');

const multiAdjustments = matchSubstitutionRules(
  ['200g peanut butter', '3 tbsp tahini', '2 tbsp soy sauce'],
  ['peanut', 'sesame', 'soy', 'coconut'],
);

const phrases = collectProhibitedPhrases(multiAdjustments);
assert(phrases.includes('peanut butter'), 'peanut butter in prohibited phrases');
assert(phrases.includes('tahini'), 'tahini in prohibited phrases');
assert(phrases.includes('soy sauce'), 'soy sauce in prohibited phrases');
// No duplicates
const unique = new Set(phrases);
assertEqual(unique.size, phrases.length, 'no duplicate prohibited phrases');

// ─── 23. matchSubstitutionRulesWithConflicts structure ───────────────────────

section('23. matchSubstitutionRulesWithConflicts — return shape');

const { adjustments: shapeAdj, conflicts: shapeCon } = matchSubstitutionRulesWithConflicts(
  ['200g peanut butter'],
  ['peanut'],
);
assert(Array.isArray(shapeAdj), 'adjustments is an array');
assert(Array.isArray(shapeCon), 'conflicts is an array');
assert(shapeAdj.length === 1, 'one adjustment');
assert(typeof shapeAdj[0]!.matchedIngredient === 'string', 'matchedIngredient is string');
assert(typeof shapeAdj[0]!.replacement === 'string', 'replacement is string');
assert(Array.isArray(shapeAdj[0]!.cookingNotes), 'cookingNotes is array');
assert(Array.isArray(shapeAdj[0]!.prohibitedPhrases), 'prohibitedPhrases is array');

// ─── 24. No false matches for safe ingredients ───────────────────────────────

section('24. No false matches for safe ingredients');

const noMatchResult = matchSubstitutionRules(
  ['rice', 'broccoli', 'olive oil', 'garlic', 'salt'],
  ['peanut', 'sesame', 'soy', 'shellfish', 'egg'],
);
assertEqual(noMatchResult.length, 0, 'safe ingredients produce no adjustments for allergen restrictions');

const noTriggerResult = matchSubstitutionRules(
  ['200g peanut butter', '3 tbsp tahini'],
  [],
);
assertEqual(noTriggerResult.length, 0, 'empty restrictions → no adjustments');

// ─── 25. COMP3 — widened gluten substitution coverage ────────────────────────
// The restriction library flags soy sauce, Worcestershire sauce, beer, malt
// vinegar, barley malt/extract, hoisin and teriyaki sauce as HIDDEN gluten
// sources (shared/restrictions/restriction-library.ts), but until now only
// pasta had a matching substitution rule — every other flagged ingredient
// dead-ended with "I couldn't verify a suitable replacement" even though a
// real, direct gluten-free equivalent exists commercially for most of them.

section('25. COMP3 — widened gluten substitution coverage');

const worcesterResult = matchSubstitutionRules(['1tbsp worcestershire sauce'], ['gluten-free']);
assert(worcesterResult.length === 1, 'worcestershire sauce rule fires for gluten-free');
assert(worcesterResult[0]!.replacement.includes('gluten-free Worcestershire sauce'), 'worcestershire sauce → GF worcestershire sauce, not a different condiment');

const maltVinegarResult = matchSubstitutionRules(['2 tbsp malt vinegar'], ['gluten-free']);
assert(maltVinegarResult.length === 1, 'malt vinegar rule fires for gluten-free');
assert(
  maltVinegarResult[0]!.replacement.includes('cider vinegar'),
  'malt vinegar → a naturally gluten-free vinegar (no "gluten-free malt vinegar" product claim)',
);

const beerResult = matchSubstitutionRules(['330ml beer'], ['gluten-free']);
assert(beerResult.length === 1, 'beer rule fires for gluten-free');
assert(beerResult[0]!.replacement.includes('gluten-free beer'), 'beer → GF beer');

const maltExtractResult = matchSubstitutionRules(['1 tbsp malt extract'], ['gluten-free']);
assert(maltExtractResult.length === 1, 'malt extract rule fires for gluten-free');
assert(
  maltExtractResult[0]!.replacement.includes('rice malt syrup'),
  'malt extract → a genuinely barley-free sweetener, never a "gluten-free barley malt" claim',
);

const hoisinResult = matchSubstitutionRules(['2 tbsp hoisin sauce'], ['gluten-free']);
assert(hoisinResult.length === 1, 'hoisin sauce rule fires for gluten-free');
assert(hoisinResult[0]!.replacement.includes('gluten-free hoisin sauce'), 'hoisin sauce → GF hoisin sauce');

const teriyakiResult = matchSubstitutionRules(['2 tbsp teriyaki sauce'], ['gluten-free']);
assert(teriyakiResult.length === 1, 'teriyaki sauce rule fires for gluten-free');
assert(teriyakiResult[0]!.replacement.includes('gluten-free teriyaki sauce'), 'teriyaki sauce → GF teriyaki sauce');

// soy_sauce: gluten-only household gets tamari first; a household ALSO
// restricted on soy must never be offered tamari (it IS soy sauce).
const soySauceGlutenOnly = matchSubstitutionRules(['1 tbsp soy sauce'], ['gluten-free']);
assert(soySauceGlutenOnly.length === 1, 'soy sauce rule fires for gluten-free alone');
assert(soySauceGlutenOnly[0]!.replacement.includes('tamari'), 'gluten-only household → tamari offered first');

const soySauceGlutenAndSoy = matchSubstitutionRules(['1 tbsp soy sauce'], ['gluten-free', 'soy']);
assert(soySauceGlutenAndSoy.length === 1, 'soy sauce rule still fires when soy is ALSO restricted');
assert(!soySauceGlutenAndSoy[0]!.replacement.includes('tamari'), 'tamari never offered when soy is restricted (tamari is soy sauce)');

// The existing soy-free-only behaviour (no gluten restriction) must be
// unchanged by adding the gluten_free trigger to this rule.
const soySauceSoyOnly = matchSubstitutionRules(['1 tbsp soy sauce'], ['soy']);
assert(soySauceSoyOnly.length === 1, 'soy sauce rule fires for soy-free alone, unchanged');
assert(!soySauceSoyOnly[0]!.replacement.includes('tamari'), 'soy-only household (no gluten restriction) is never offered tamari');

// ─── 26. Every curated replacement survives the REAL safety re-check ────────
// INT20/COMP3's `defaultCheckPlannerMeal` doesn't trust this engine's own
// word — it re-checks every suggested replacement through
// `household-dietary-safety.ts`'s `validateAdaptationSafety`, the same gate
// a recommendation must clear. A curated fix that fails its own restriction's
// re-check is silently dropped and the household sees "I couldn't verify a
// suitable replacement" — exactly the bug found live on 2026-11-14, where
// "gluten-free Worcestershire sauce" tripped the very hiddenIngredient
// ("Worcestershire sauce") it was suggested to replace, because the phrase
// was missing from restriction-library.ts's masking list. This section
// checks EVERY curated replacement this file can ever hand out, for every
// restriction it is declared to satisfy, so the next rule added here fails
// loudly in CI rather than silently in production.

section('26. Every curated replacement survives the REAL safety re-check');

// Only restrictions `household-dietary-safety.ts` actually gates on via the
// canonical library, keyed by the library's own restriction id (not a
// display alias) so it lines up exactly with `conflictsWithRestrictions`
// below. vegetarian/vegan are diet PATTERNS (a different mechanism
// entirely) and nut_free is a legacy alias that expands to two restrictions
// — neither is what this trigger-by-trigger check is for.
const TRIGGER_TO_RESTRICTION_ID: Partial<Record<DietTrigger, string>> = {
  gluten_free: 'gluten',
  dairy_free: 'dairy',
  peanut_free: 'peanut',
  tree_nut_free: 'tree_nut',
  sesame_free: 'sesame',
  soy_free: 'soy',
  mustard_free: 'mustard',
  shellfish_free: 'shellfish',
  egg_free: 'eggs',
  coconut_free: 'coconut',
  fish_free: 'fish',
  honey_free: 'honey',
};

let selfCheckFailures = 0;
for (const { ruleId, trigger, replacement, conflictsWithRestrictions } of listAllCuratedReplacements()) {
  const restrictionId = TRIGGER_TO_RESTRICTION_ID[trigger];
  if (!restrictionId) continue; // vegetarian/vegan/nut_free — not this check's concern
  // A strategy that ALREADY declares it conflicts with this restriction is
  // correctly rejected — that is the cross-restriction-conflict feature
  // working, not the bug this section exists to catch.
  if (conflictsWithRestrictions.includes(restrictionId)) continue;
  const verdict = validateAdaptationSafety({ ingredients: [replacement] }, [restrictionId]);
  if (!verdict.safe) {
    selfCheckFailures++;
    console.error(`  ✗ [${ruleId}] "${replacement}" is rejected by its own restriction's safety re-check (${restrictionId}): ${JSON.stringify(verdict.violations)}`);
  }
}
assertEqual(selfCheckFailures, 0, 'no curated replacement is rejected by the safety re-check for the restriction it was offered to satisfy (unless it is a declared cross-restriction conflict)');

// ─── 27. COMP_SUB2 — fish and honey substitution coverage ───────────────────
// Deep-dive after COMP_SUB1 found that `detectActiveTriggers` had no cases
// for the `fish` or `honey` canonical restrictions, so `listSubstitutionOptions`
// silently offered ZERO curated fixes for either — every fish-sauce,
// fish-stock, anchovy or honey conflict dead-ended with "I couldn't verify a
// suitable replacement" even though direct, real substitutes exist. This
// section exercises each new rule directly.

section('27. COMP_SUB2 — fish and honey substitution coverage');

// fish_sauce: fish-only household gets tamari first; a household ALSO
// restricted on soy must never be offered tamari (it IS soy sauce), and
// should fall through to coconut aminos instead.
const fishSauceFishOnly = matchSubstitutionRules(['1 tbsp fish sauce'], ['fish']);
assert(fishSauceFishOnly.length === 1, 'fish sauce rule fires for fish-free alone');
assert(fishSauceFishOnly[0]!.replacement.includes('tamari'), 'fish-only household → tamari offered first');

const fishSauceFishAndSoy = matchSubstitutionRules(['1 tbsp fish sauce'], ['fish', 'soy']);
assert(fishSauceFishAndSoy.length === 1, 'fish sauce rule still fires when soy is ALSO restricted');
assert(
  fishSauceFishAndSoy[0]!.replacement.includes('coconut aminos'),
  'tamari never offered when soy is restricted → falls through to coconut aminos',
);

const fishSauceFishAndCoconut = matchSubstitutionRules(['1 tbsp fish sauce'], ['fish', 'coconut']);
assert(fishSauceFishAndCoconut.length === 1, 'fish sauce rule still fires when coconut is ALSO restricted');
assert(
  fishSauceFishAndCoconut[0]!.replacement.includes('tamari'),
  'coconut aminos never offered when coconut is restricted → falls back to tamari',
);

// fish_stock → vegetable stock
const fishStockResult = matchSubstitutionRules(['500ml fish stock'], ['fish']);
assert(fishStockResult.length === 1, 'fish stock rule fires for fish-free');
assert(fishStockResult[0]!.replacement.includes('vegetable stock'), 'fish stock → vegetable stock');

// anchovies_umami → capers
const anchoviesResult = matchSubstitutionRules(['4 anchovy fillets'], ['fish']);
assert(anchoviesResult.length === 1, 'anchovies rule fires for fish-free');
assert(anchoviesResult[0]!.replacement.includes('capers'), 'anchovy fillets → capers');

// worcestershire_sauce_fish_safe → vegan Worcestershire sauce, distinct from
// (and coexisting with) the existing gluten-side Worcestershire rule.
const worcesterFishResult = matchSubstitutionRules(['1tbsp worcestershire sauce'], ['fish']);
assert(worcesterFishResult.length === 1, 'worcestershire sauce rule fires for fish-free');
assert(
  worcesterFishResult[0]!.replacement.includes('vegan Worcestershire sauce'),
  'worcestershire sauce → vegan (anchovy-free) Worcestershire sauce for a fish restriction',
);

const worcesterFishAndGlutenResult = matchSubstitutionRules(['1tbsp worcestershire sauce'], ['fish', 'gluten-free']);
assert(
  worcesterFishAndGlutenResult.length === 2,
  'a household restricted on BOTH fish and gluten gets both Worcestershire fixes offered',
  JSON.stringify(worcesterFishAndGlutenResult),
);

// honey → maple syrup first, agave syrup as the listed fallback
const honeyResult = matchSubstitutionRules(['2 tbsp honey'], ['honey']);
assert(honeyResult.length === 1, 'honey rule fires for honey-free');
assert(honeyResult[0]!.replacement.includes('maple syrup'), 'honey → maple syrup offered first');

const honeyOptions = listSubstitutionOptions(['2 tbsp honey'], ['honey']);
assert(
  honeyOptions.some((o) => o.replacement.includes('agave syrup')),
  'agave syrup is present as a listed fallback option for honey',
  JSON.stringify(honeyOptions),
);

// A plain "fish" dish ingredient (e.g. "cod fillet") deliberately has NO
// rule — this file only targets sauces/condiments/stocks/garnishes, never a
// dish's central named protein, matching every other restriction's scope.
const codFilletResult = matchSubstitutionRules(['2 cod fillets'], ['fish']);
assertEqual(codFilletResult.length, 0, 'a main-protein fish ingredient is deliberately out of scope, same as every other restriction');

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n────────────────────────────────────────`);
console.log(`SUBSTITUTION RULE TESTS: ${passed} passed, ${failed} failed`);
console.log(`────────────────────────────────────────`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
