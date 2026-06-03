/**
 * test-restriction-resolver.ts
 * ============================
 * Tests for the Phase 3 canonical restriction library and resolver.
 *
 * Run with:  npm run test:restriction-resolver
 *
 * Tests cover:
 * - Library integrity (all definitions have required fields)
 * - Exact alias matching for all Phase 3 restrictions
 * - Case-insensitive matching
 * - Hyphen / underscore normalisation
 * - Derived ingredient matching
 * - Hidden ingredient matching
 * - No-match scenarios
 * - Word-boundary safety ("minute" ≠ "nut", "savoy" ≠ "soy")
 * - nut_free backward compatibility → expands to peanut + tree_nut
 * - Duplicate suppression
 * - Invalid / empty input handling
 * - Full match structure completeness
 * - resolveActiveRestrictions convenience helper
 */

import {
  findRestrictionById,
  findRestrictionByAlias,
  resolveIngredientRestrictions,
  resolveTextRestrictions,
  getRestrictionMatches,
  resolveActiveRestrictions,
} from '../../shared/restrictions/restriction-resolver.js';

import {
  RESTRICTION_DEFINITIONS,
  RESTRICTION_LIBRARY_VERSION,
} from '../../shared/restrictions/restriction-library.js';

import type { RestrictionDefinition } from '../../shared/restrictions/restriction-types.js';

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

// ─── Fixtures — pull definitions from the live library ───────────────────────

const glutenDef    = RESTRICTION_DEFINITIONS.find(d => d.id === 'gluten')!;
const dairyDef     = RESTRICTION_DEFINITIONS.find(d => d.id === 'dairy')!;
const peanutDef    = RESTRICTION_DEFINITIONS.find(d => d.id === 'peanut')!;
const treeNutDef   = RESTRICTION_DEFINITIONS.find(d => d.id === 'tree_nut')!;
const sesameDef    = RESTRICTION_DEFINITIONS.find(d => d.id === 'sesame')!;
const soyDef       = RESTRICTION_DEFINITIONS.find(d => d.id === 'soy')!;
const mustardDef   = RESTRICTION_DEFINITIONS.find(d => d.id === 'mustard')!;
const shellfishDef = RESTRICTION_DEFINITIONS.find(d => d.id === 'shellfish')!;
const eggsDef      = RESTRICTION_DEFINITIONS.find(d => d.id === 'eggs')!;
const coconutDef   = RESTRICTION_DEFINITIONS.find(d => d.id === 'coconut')!;

// ─── 1. Library integrity ─────────────────────────────────────────────────────

section('1. Library integrity');

assert(typeof RESTRICTION_LIBRARY_VERSION === 'string', 'Library version is a string');
assert(RESTRICTION_LIBRARY_VERSION.startsWith('3.'), 'Library version is Phase 3');
assert(RESTRICTION_DEFINITIONS.length >= 10, `Library contains at least 10 definitions (found ${RESTRICTION_DEFINITIONS.length})`);

assert(!!glutenDef,    'gluten definition exists');
assert(!!dairyDef,     'dairy definition exists');
assert(!!peanutDef,    'peanut definition exists');
assert(!!treeNutDef,   'tree_nut definition exists');
assert(!!sesameDef,    'sesame definition exists');
assert(!!soyDef,       'soy definition exists');
assert(!!mustardDef,   'mustard definition exists');
assert(!!shellfishDef, 'shellfish definition exists');
assert(!!eggsDef,      'eggs definition exists');
assert(!!coconutDef,   'coconut definition exists');

// nut_free is no longer a canonical definition
assert(findRestrictionById('nut_free') === undefined, 'nut_free is no longer a canonical definition (replaced by peanut + tree_nut)');

for (const def of RESTRICTION_DEFINITIONS) {
  assert(typeof def.id === 'string' && def.id.length > 0,                    `[${def.id}] id is non-empty string`);
  assert(typeof def.displayName === 'string' && def.displayName.length > 0,  `[${def.id}] displayName is non-empty string`);
  assert(def.tier === 'major_allergen' || def.tier === 'additional_restriction', `[${def.id}] tier is a valid RestrictionTier`);
  assert(Array.isArray(def.aliases),             `[${def.id}] aliases is an array`);
  assert(Array.isArray(def.derivedIngredients),  `[${def.id}] derivedIngredients is an array`);
  assert(Array.isArray(def.hiddenIngredients),   `[${def.id}] hiddenIngredients is an array`);
  assert(Array.isArray(def.substitutions),       `[${def.id}] substitutions is an array`);
  assert(Array.isArray(def.prohibitedPhrases),   `[${def.id}] prohibitedPhrases is an array`);
}

assert(peanutDef?.tier === 'major_allergen',  'peanut is a major_allergen');
assert(treeNutDef?.tier === 'major_allergen', 'tree_nut is a major_allergen');
assert(sesameDef?.tier === 'major_allergen',  'sesame is a major_allergen');
assert(coconutDef?.tier === 'additional_restriction', 'coconut is an additional_restriction (not a statutory UK major allergen)');

// ─── 2. findRestrictionById ───────────────────────────────────────────────────

section('2. findRestrictionById');

assert(findRestrictionById('gluten')?.id    === 'gluten',    'findRestrictionById("gluten")');
assert(findRestrictionById('dairy')?.id     === 'dairy',     'findRestrictionById("dairy")');
assert(findRestrictionById('peanut')?.id    === 'peanut',    'findRestrictionById("peanut")');
assert(findRestrictionById('tree_nut')?.id  === 'tree_nut',  'findRestrictionById("tree_nut")');
assert(findRestrictionById('sesame')?.id    === 'sesame',    'findRestrictionById("sesame")');
assert(findRestrictionById('soy')?.id       === 'soy',       'findRestrictionById("soy")');
assert(findRestrictionById('mustard')?.id   === 'mustard',   'findRestrictionById("mustard")');
assert(findRestrictionById('shellfish')?.id === 'shellfish', 'findRestrictionById("shellfish")');
assert(findRestrictionById('eggs')?.id      === 'eggs',      'findRestrictionById("eggs")');
assert(findRestrictionById('coconut')?.id   === 'coconut',   'findRestrictionById("coconut")');

assert(findRestrictionById('nut_free') === undefined, 'findRestrictionById("nut_free") → undefined (legacy)');
assert(findRestrictionById('fish')     === undefined, 'findRestrictionById("fish") → undefined (Phase 4)');
assert(findRestrictionById('')         === undefined, 'findRestrictionById("") → undefined');
assert(findRestrictionById(null as any) === undefined, 'findRestrictionById(null) → undefined');

// Case-insensitive and normalised
assert(findRestrictionById('GLUTEN')?.id   === 'gluten',   'findRestrictionById case-insensitive');
assert(findRestrictionById('tree-nut')?.id === 'tree_nut', 'findRestrictionById hyphen → underscore');

// ─── 3. findRestrictionByAlias — peanut ──────────────────────────────────────

section('3. findRestrictionByAlias — peanut');

assert(findRestrictionByAlias('peanut')?.id    === 'peanut', 'alias "peanut" → peanut');
assert(findRestrictionByAlias('peanuts')?.id   === 'peanut', 'alias "peanuts" → peanut');
assert(findRestrictionByAlias('groundnut')?.id === 'peanut', 'alias "groundnut" → peanut');
assert(findRestrictionByAlias('groundnuts')?.id === 'peanut','alias "groundnuts" → peanut');
assert(findRestrictionByAlias('peanut-free')?.id === 'peanut','alias "peanut-free" → peanut');
assert(findRestrictionByAlias('PEANUT')?.id    === 'peanut', 'alias "PEANUT" case-insensitive → peanut');

// ─── 4. findRestrictionByAlias — tree_nut ────────────────────────────────────

section('4. findRestrictionByAlias — tree_nut');

assert(findRestrictionByAlias('tree nut')?.id   === 'tree_nut', 'alias "tree nut" → tree_nut');
assert(findRestrictionByAlias('tree nuts')?.id  === 'tree_nut', 'alias "tree nuts" → tree_nut');
assert(findRestrictionByAlias('tree-nut')?.id   === 'tree_nut', 'alias "tree-nut" → tree_nut');
assert(findRestrictionByAlias('tree nut free')?.id === 'tree_nut', 'alias "tree nut free" → tree_nut');
assert(findRestrictionByAlias('TREE NUT')?.id   === 'tree_nut', '"TREE NUT" case-insensitive → tree_nut');

// "nut" and "nuts" alone are handled by legacy expansion in getRestrictionMatches,
// NOT via findRestrictionByAlias (which returns a single definition only)
assert(findRestrictionByAlias('nut') === undefined,  '"nut" → undefined via findRestrictionByAlias (use getRestrictionMatches)');
assert(findRestrictionByAlias('nuts') === undefined, '"nuts" → undefined via findRestrictionByAlias (use getRestrictionMatches)');

// ─── 5. findRestrictionByAlias — sesame ──────────────────────────────────────

section('5. findRestrictionByAlias — sesame');

assert(findRestrictionByAlias('sesame')?.id        === 'sesame', 'alias "sesame" → sesame');
assert(findRestrictionByAlias('sesame seed')?.id   === 'sesame', 'alias "sesame seed" → sesame');
assert(findRestrictionByAlias('sesame seeds')?.id  === 'sesame', 'alias "sesame seeds" → sesame');
assert(findRestrictionByAlias('sesame-free')?.id   === 'sesame', 'alias "sesame-free" → sesame');
assert(findRestrictionByAlias('SESAME')?.id        === 'sesame', '"SESAME" case-insensitive → sesame');

// ─── 6. findRestrictionByAlias — soy ─────────────────────────────────────────

section('6. findRestrictionByAlias — soy');

assert(findRestrictionByAlias('soy')?.id      === 'soy', 'alias "soy" → soy');
assert(findRestrictionByAlias('soya')?.id     === 'soy', 'alias "soya" → soy');
assert(findRestrictionByAlias('soy-free')?.id === 'soy', 'alias "soy-free" → soy');
assert(findRestrictionByAlias('soya free')?.id === 'soy','alias "soya free" → soy');

// ─── 7. findRestrictionByAlias — mustard / shellfish / eggs / coconut ────────

section('7. findRestrictionByAlias — mustard / shellfish / eggs / coconut');

assert(findRestrictionByAlias('mustard')?.id    === 'mustard',   'alias "mustard" → mustard');
assert(findRestrictionByAlias('shellfish')?.id  === 'shellfish', 'alias "shellfish" → shellfish');
assert(findRestrictionByAlias('crustacean')?.id === 'shellfish', 'alias "crustacean" → shellfish');
assert(findRestrictionByAlias('mollusc')?.id    === 'shellfish', 'alias "mollusc" → shellfish');
assert(findRestrictionByAlias('egg')?.id        === 'eggs',      'alias "egg" → eggs');
assert(findRestrictionByAlias('eggs')?.id       === 'eggs',      'alias "eggs" → eggs');
assert(findRestrictionByAlias('egg-free')?.id   === 'eggs',      'alias "egg-free" → eggs');
assert(findRestrictionByAlias('coconut')?.id    === 'coconut',   'alias "coconut" → coconut');

// ─── 8. findRestrictionByAlias — gluten and dairy preserved ──────────────────

section('8. gluten and dairy aliases preserved from Phase 2');

assert(findRestrictionByAlias('coeliac')?.id       === 'gluten', 'alias "coeliac" → gluten');
assert(findRestrictionByAlias('celiac')?.id        === 'gluten', 'alias "celiac" → gluten');
assert(findRestrictionByAlias('wheat')?.id         === 'gluten', 'alias "wheat" → gluten');
assert(findRestrictionByAlias('gluten-free')?.id   === 'gluten', 'alias "gluten-free" → gluten');
assert(findRestrictionByAlias('dairy-free')?.id    === 'dairy',  'alias "dairy-free" → dairy');
assert(findRestrictionByAlias('lactose-free')?.id  === 'dairy',  'alias "lactose-free" → dairy');
assert(findRestrictionByAlias('lactose intolerant')?.id === 'dairy', 'alias "lactose intolerant" → dairy');
assert(findRestrictionByAlias('milk')?.id          === 'dairy',  'alias "milk" → dairy');

// ─── 9. nut_free backward compatibility ──────────────────────────────────────

section('9. nut_free backward compatibility — expands to peanut + tree_nut');

// All historical nut-restriction terms must expand to BOTH peanut and tree_nut
const nutFreeMatches = getRestrictionMatches(['nut_free']);
assertEqual(nutFreeMatches.length, 2, 'getRestrictionMatches(["nut_free"]) → 2 matches');
const nutFreeIds = nutFreeMatches.map(m => m.restriction.id).sort();
assertEqual(nutFreeIds, ['peanut', 'tree_nut'], 'nut_free expands to peanut + tree_nut');

const nutFreeHyphen = getRestrictionMatches(['nut-free']);
assertEqual(nutFreeHyphen.length, 2, 'getRestrictionMatches(["nut-free"]) → 2 matches');
const nutFreeHyphenIds = nutFreeHyphen.map(m => m.restriction.id).sort();
assertEqual(nutFreeHyphenIds, ['peanut', 'tree_nut'], '"nut-free" expands to peanut + tree_nut');

const nutFreeSpace = getRestrictionMatches(['nut free']);
assertEqual(nutFreeSpace.length, 2, 'getRestrictionMatches(["nut free"]) → 2 matches');

const nutsMatches = getRestrictionMatches(['nuts']);
assertEqual(nutsMatches.length, 2, 'getRestrictionMatches(["nuts"]) → 2 matches (conservative expansion)');
const nutsIds = nutsMatches.map(m => m.restriction.id).sort();
assertEqual(nutsIds, ['peanut', 'tree_nut'], '"nuts" expands to peanut + tree_nut');

const nutAllergyMatches = getRestrictionMatches(['nut allergy']);
assertEqual(nutAllergyMatches.length, 2, 'getRestrictionMatches(["nut allergy"]) → 2 matches');

// nut_free + peanut together → deduplication: peanut returned once, tree_nut returned once
const nutFreeAndPeanut = getRestrictionMatches(['nut_free', 'peanut']);
assertEqual(nutFreeAndPeanut.length, 2, 'nut_free + peanut deduped to peanut + tree_nut (peanut not duplicated)');

// ─── 10. Peanut resolves independently ───────────────────────────────────────

section('10. Peanut resolves independently');

const pbResult = resolveIngredientRestrictions('peanut butter', [peanutDef]);
assert(pbResult.length === 1 && pbResult[0].restriction.id === 'peanut', '"peanut butter" resolves peanut');
assert(pbResult[0].sourceType === 'alias', '"peanut butter" matches peanut via alias (peanut at word boundary)');

const satayResult = resolveIngredientRestrictions('satay sauce', [peanutDef]);
assert(satayResult.length === 1 && satayResult[0].sourceType === 'hidden_ingredient', '"satay sauce" resolves peanut via hidden_ingredient');

const groundnutOilResult = resolveIngredientRestrictions('groundnut oil', [peanutDef]);
assert(groundnutOilResult.length === 1 && groundnutOilResult[0].restriction.id === 'peanut', '"groundnut oil" resolves peanut');

// ─── 11. Tree nut resolves independently ─────────────────────────────────────

section('11. Tree nut resolves independently');

const almondMilkResult = resolveIngredientRestrictions('almond milk', [treeNutDef]);
assert(almondMilkResult.length === 1 && almondMilkResult[0].restriction.id === 'tree_nut', '"almond milk" resolves tree_nut');
assert(almondMilkResult[0].sourceType === 'derived_ingredient', '"almond milk" via derived_ingredient');

const walnutResult = resolveIngredientRestrictions('walnut', [treeNutDef]);
assert(walnutResult.length === 1 && walnutResult[0].restriction.id === 'tree_nut', '"walnut" resolves tree_nut');

const hazelnutResult = resolveIngredientRestrictions('hazelnut spread', [treeNutDef]);
assert(hazelnutResult.length === 1 && hazelnutResult[0].restriction.id === 'tree_nut', '"hazelnut spread" resolves tree_nut');

const nutButterResult = resolveIngredientRestrictions('nut butter', [treeNutDef]);
assert(nutButterResult.length === 1 && nutButterResult[0].restriction.id === 'tree_nut', '"nut butter" resolves tree_nut');

const pestoResult = resolveIngredientRestrictions('pesto', [treeNutDef]);
assert(pestoResult.length === 1 && pestoResult[0].sourceType === 'hidden_ingredient', '"pesto" resolves tree_nut via hidden_ingredient');

// ─── 12. Sesame resolves tahini and sesame oil ────────────────────────────────

section('12. Sesame resolves tahini and sesame oil');

const tahiniResult = resolveIngredientRestrictions('tahini', [sesameDef]);
assert(tahiniResult.length === 1 && tahiniResult[0].restriction.id === 'sesame', '"tahini" resolves sesame');
assert(tahiniResult[0].sourceType === 'derived_ingredient', '"tahini" via derived_ingredient');
assert(tahiniResult[0].sourceValue === 'tahini', '"tahini" sourceValue is "tahini"');

const tahiniDressingResult = resolveIngredientRestrictions('tahini dressing', [sesameDef]);
assert(tahiniDressingResult.length === 1 && tahiniDressingResult[0].restriction.id === 'sesame', '"tahini dressing" resolves sesame');

const sesameOilResult = resolveIngredientRestrictions('sesame oil', [sesameDef]);
assert(sesameOilResult.length === 1 && sesameOilResult[0].restriction.id === 'sesame', '"sesame oil" resolves sesame');

const toastedSesameOilResult = resolveIngredientRestrictions('toasted sesame oil', [sesameDef]);
assert(toastedSesameOilResult.length === 1 && toastedSesameOilResult[0].restriction.id === 'sesame', '"toasted sesame oil" resolves sesame');

const sesameSeeds = resolveIngredientRestrictions('sesame seeds', [sesameDef]);
assert(sesameSeeds.length === 1 && sesameSeeds[0].sourceType === 'alias', '"sesame seeds" resolves sesame via alias');

const hummusResult = resolveIngredientRestrictions('hummus', [sesameDef]);
assert(hummusResult.length === 1 && hummusResult[0].sourceType === 'hidden_ingredient', '"hummus" resolves sesame via hidden_ingredient');

// ─── 13. Soy resolves soy sauce, tofu, miso, edamame ─────────────────────────

section('13. Soy resolves soy sauce, tofu, miso, edamame');

const soySauceResult = resolveIngredientRestrictions('soy sauce', [soyDef]);
assert(soySauceResult.length === 1 && soySauceResult[0].restriction.id === 'soy', '"soy sauce" resolves soy');

const tofuResult = resolveIngredientRestrictions('tofu', [soyDef]);
assert(tofuResult.length === 1 && tofuResult[0].restriction.id === 'soy', '"tofu" resolves soy');

const misoResult = resolveIngredientRestrictions('miso', [soyDef]);
assert(misoResult.length === 1 && misoResult[0].restriction.id === 'soy', '"miso" resolves soy');

const edamameResult = resolveIngredientRestrictions('edamame', [soyDef]);
assert(edamameResult.length === 1 && edamameResult[0].restriction.id === 'soy', '"edamame" resolves soy');

const tamariResult = resolveIngredientRestrictions('tamari', [soyDef]);
assert(tamariResult.length === 1 && tamariResult[0].restriction.id === 'soy', '"tamari" resolves soy');

const tempehResult = resolveIngredientRestrictions('tempeh', [soyDef]);
assert(tempehResult.length === 1 && tempehResult[0].restriction.id === 'soy', '"tempeh" resolves soy');

// ─── 14. Mustard resolves mustard powder and dijon mustard ───────────────────

section('14. Mustard resolves mustard powder and dijon mustard');

const mustardPowderResult = resolveIngredientRestrictions('mustard powder', [mustardDef]);
assert(mustardPowderResult.length === 1 && mustardPowderResult[0].restriction.id === 'mustard', '"mustard powder" resolves mustard');

const dijonResult = resolveIngredientRestrictions('dijon mustard', [mustardDef]);
assert(dijonResult.length === 1 && dijonResult[0].restriction.id === 'mustard', '"dijon mustard" resolves mustard');

const wholeGrainMustardResult = resolveIngredientRestrictions('wholegrain mustard', [mustardDef]);
assert(wholeGrainMustardResult.length === 1, '"wholegrain mustard" resolves mustard');

const mustardOilResult = resolveIngredientRestrictions('mustard oil', [mustardDef]);
assert(mustardOilResult.length === 1 && mustardOilResult[0].restriction.id === 'mustard', '"mustard oil" resolves mustard');

// ─── 15. Shellfish resolves prawns, shrimp, crab, oyster sauce ───────────────

section('15. Shellfish resolves prawns, shrimp, crab, oyster sauce');

const prawnResult = resolveIngredientRestrictions('prawns', [shellfishDef]);
assert(prawnResult.length === 1 && prawnResult[0].restriction.id === 'shellfish', '"prawns" resolves shellfish');

const shrimpResult = resolveIngredientRestrictions('shrimp', [shellfishDef]);
assert(shrimpResult.length === 1 && shrimpResult[0].restriction.id === 'shellfish', '"shrimp" resolves shellfish');

const crabResult = resolveIngredientRestrictions('crab', [shellfishDef]);
assert(crabResult.length === 1 && crabResult[0].restriction.id === 'shellfish', '"crab" resolves shellfish');

// oyster sauce: "oyster" is in derivedIngredients and "oyster sauce" contains it,
// so it matches as derived_ingredient (before hidden_ingredient is checked — both are correct)
const oysterSauceResult = resolveIngredientRestrictions('oyster sauce', [shellfishDef]);
assert(oysterSauceResult.length === 1 && oysterSauceResult[0].restriction.id === 'shellfish', '"oyster sauce" resolves shellfish');

const calamariResult = resolveIngredientRestrictions('calamari', [shellfishDef]);
assert(calamariResult.length === 1 && calamariResult[0].restriction.id === 'shellfish', '"calamari" resolves shellfish');

// ─── 16. Eggs resolves mayonnaise and egg wash ────────────────────────────────

section('16. Eggs resolves mayonnaise and egg wash');

const mayonnaiseResult = resolveIngredientRestrictions('mayonnaise', [eggsDef]);
assert(mayonnaiseResult.length === 1 && mayonnaiseResult[0].restriction.id === 'eggs', '"mayonnaise" resolves eggs');
assert(mayonnaiseResult[0].sourceType === 'derived_ingredient', '"mayonnaise" via derived_ingredient');

const eggWashResult = resolveIngredientRestrictions('egg wash', [eggsDef]);
assert(eggWashResult.length === 1 && eggWashResult[0].restriction.id === 'eggs', '"egg wash" resolves eggs');

const meringueResult = resolveIngredientRestrictions('meringue', [eggsDef]);
assert(meringueResult.length === 1 && meringueResult[0].restriction.id === 'eggs', '"meringue" resolves eggs');

const briocheResult = resolveIngredientRestrictions('brioche', [eggsDef]);
assert(briocheResult.length === 1 && briocheResult[0].sourceType === 'hidden_ingredient', '"brioche" resolves eggs via hidden_ingredient');

// ─── 17. Coconut resolves coconut milk and coconut oil ───────────────────────

section('17. Coconut resolves coconut milk and coconut oil');

const coconutMilkResult = resolveIngredientRestrictions('coconut milk', [coconutDef]);
assert(coconutMilkResult.length === 1 && coconutMilkResult[0].restriction.id === 'coconut', '"coconut milk" resolves coconut');

const coconutOilResult = resolveIngredientRestrictions('coconut oil', [coconutDef]);
assert(coconutOilResult.length === 1 && coconutOilResult[0].restriction.id === 'coconut', '"coconut oil" resolves coconut');

const desiccatedCoconutResult = resolveIngredientRestrictions('desiccated coconut', [coconutDef]);
assert(desiccatedCoconutResult.length === 1, '"desiccated coconut" resolves coconut');

const coconutAminosResult = resolveIngredientRestrictions('coconut aminos', [coconutDef]);
assert(coconutAminosResult.length === 1, '"coconut aminos" resolves coconut');

// ─── 18. Gluten derived ingredients preserved ─────────────────────────────────

section('18. Gluten existing behaviour preserved');

const wholemealResult = resolveIngredientRestrictions('wholemeal pasta', [glutenDef]);
assert(wholemealResult.length === 1 && wholemealResult[0].restriction.id === 'gluten', '"wholemeal pasta" resolves gluten');
assert(wholemealResult[0].sourceType === 'derived_ingredient', '"wholemeal pasta" via derived_ingredient');

const couscousResult = resolveIngredientRestrictions('couscous', [glutenDef]);
assert(couscousResult.length === 1 && couscousResult[0].restriction.id === 'gluten', '"couscous" resolves gluten');

const soySauceGlutenResult = resolveIngredientRestrictions('soy sauce', [glutenDef]);
assert(soySauceGlutenResult.length === 1 && soySauceGlutenResult[0].sourceType === 'hidden_ingredient', '"soy sauce" resolves gluten via hidden_ingredient (preserved)');

// ─── 19. Dairy existing behaviour preserved ───────────────────────────────────

section('19. Dairy existing behaviour preserved');

const yoghurtResult = resolveIngredientRestrictions('natural yoghurt', [dairyDef]);
assert(yoghurtResult.length === 1 && yoghurtResult[0].restriction.id === 'dairy', '"natural yoghurt" resolves dairy');
assert(yoghurtResult[0].sourceType === 'derived_ingredient', '"natural yoghurt" via derived_ingredient');

const gheeResult = resolveIngredientRestrictions('ghee', [dairyDef]);
assert(gheeResult.length === 1 && gheeResult[0].restriction.id === 'dairy', '"ghee" resolves dairy');

// ─── 20. No-match scenarios ───────────────────────────────────────────────────

section('20. No-match scenarios');

assertEqual(resolveIngredientRestrictions('rice', [glutenDef]),         [], '"rice" has no gluten match');
assertEqual(resolveIngredientRestrictions('olive oil', [dairyDef]),     [], '"olive oil" has no dairy match');
assertEqual(resolveIngredientRestrictions('broccoli', [peanutDef]),     [], '"broccoli" has no peanut match');
assertEqual(resolveIngredientRestrictions('black pepper', [treeNutDef]), [], '"black pepper" has no tree_nut match');
assertEqual(resolveIngredientRestrictions('turmeric', [glutenDef, dairyDef, peanutDef, treeNutDef, sesameDef]), [], '"turmeric" has no match for any restriction');
assertEqual(resolveIngredientRestrictions('frozen peas', [shellfishDef, eggsDef, mustardDef]), [], '"frozen peas" has no match');

// ─── 21. Word-boundary safety ─────────────────────────────────────────────────

section('21. Word-boundary safety');

// "nut" does not false-match "minute"
const minuteResult = resolveIngredientRestrictions('minute rice', [peanutDef, treeNutDef]);
assertEqual(minuteResult, [], '"minute rice" does NOT match peanut or tree_nut — word boundary enforced');

// "soy" does not false-match "savoy"
const savoyResult = resolveIngredientRestrictions('savoy cabbage', [soyDef]);
assertEqual(savoyResult, [], '"savoy cabbage" does NOT match soy — word boundary enforced');

// "egg" should NOT false-match words containing "egg" as a substring where it's not standalone
// "eggplant" contains "egg" at a word boundary (it starts with "egg") — this IS expected to match
const eggplantResult = resolveIngredientRestrictions('eggplant', [eggsDef]);
// "eggplant" starts with "egg" followed by a non-space ("p") so word-boundary check fails → no match
assertEqual(eggplantResult, [], '"eggplant" does NOT match eggs — "egg" not at word boundary');

// ─── 22. Duplicate suppression ────────────────────────────────────────────────

section('22. Duplicate suppression');

// Same definition twice → one result
const dairyDupes = resolveIngredientRestrictions('yoghurt', [dairyDef, dairyDef]);
assertEqual(dairyDupes.length, 1, 'duplicate definition in restrictions → single result');

// getRestrictionMatches: "gluten" + "coeliac" → one gluten result
const glutenDupes = getRestrictionMatches(['gluten', 'coeliac', 'wheat']);
assertEqual(glutenDupes.length, 1, 'gluten + coeliac + wheat → 1 result (deduped)');
assert(glutenDupes[0]?.restriction.id === 'gluten', 'deduped result is gluten');

// Mixed restrictions
const mixed = getRestrictionMatches(['gluten', 'dairy', 'peanut']);
assertEqual(mixed.length, 3, 'gluten + dairy + peanut → 3 distinct results');
const mixedIds = mixed.map(m => m.restriction.id).sort();
assertEqual(mixedIds, ['dairy', 'gluten', 'peanut'], 'mixed result IDs are gluten, dairy, peanut');

// Unknown restrictions silently skipped
const withUnknown = getRestrictionMatches(['gluten', 'fish', 'unknown-allergen']);
assertEqual(withUnknown.length, 1, 'unknown restrictions silently skipped');
assert(withUnknown[0]?.restriction.id === 'gluten', 'only gluten returned');

// ─── 23. getRestrictionMatches — match structure ──────────────────────────────

section('23. getRestrictionMatches — match structure');

const coeliacs = getRestrictionMatches(['coeliac']);
assert(coeliacs.length === 1, 'getRestrictionMatches(["coeliac"]) returns 1 match');
const coeliacMatch = coeliacs[0]!;
assert(coeliacMatch.restriction.id === 'gluten',  'match.restriction.id is "gluten"');
assert(coeliacMatch.matchedTerm === 'coeliac',    'match.matchedTerm is "coeliac"');
assert(coeliacMatch.sourceType === 'alias',       'match.sourceType is "alias"');
assert(coeliacMatch.sourceValue === 'coeliac',    'match.sourceValue is "coeliac"');

// sesame is now resolvable
const sesameMatches = getRestrictionMatches(['sesame']);
assertEqual(sesameMatches.length, 1, 'getRestrictionMatches(["sesame"]) returns 1 match');
assert(sesameMatches[0]?.restriction.id === 'sesame', 'sesame resolves to sesame definition');

// ─── 24. Invalid input handling ───────────────────────────────────────────────

section('24. Invalid input handling');

assertEqual(resolveIngredientRestrictions('', [glutenDef]),           [], 'empty ingredient → []');
assertEqual(resolveIngredientRestrictions(null as any, [glutenDef]),  [], 'null ingredient → []');
assertEqual(resolveIngredientRestrictions(undefined as any, [sesameDef]), [], 'undefined ingredient → []');
assertEqual(resolveIngredientRestrictions('rice', null as any),       [], 'null restrictions → []');
assertEqual(getRestrictionMatches([]),                                 [], 'empty array → []');
assertEqual(getRestrictionMatches(null as any),                        [], 'null → []');
assertEqual(findRestrictionById(''), undefined, 'empty id → undefined');
assertEqual(findRestrictionByAlias(''), undefined, 'empty alias → undefined');

// ─── 25. resolveActiveRestrictions convenience helper ────────────────────────

section('25. resolveActiveRestrictions');

const activeDefs = resolveActiveRestrictions(['sesame', 'dairy']);
assertEqual(activeDefs.length, 2, 'resolveActiveRestrictions returns 2 definitions');
const activeIds = activeDefs.map(d => d.id).sort();
assertEqual(activeIds, ['dairy', 'sesame'], 'active definitions are sesame and dairy');

const nutFreeActiveDefs = resolveActiveRestrictions(['nut_free']);
assertEqual(nutFreeActiveDefs.length, 2, 'resolveActiveRestrictions("nut_free") → 2 definitions');
const nutFreeActiveIds = nutFreeActiveDefs.map(d => d.id).sort();
assertEqual(nutFreeActiveIds, ['peanut', 'tree_nut'], 'nut_free expands to peanut + tree_nut definitions');

const emptyActiveDefs = resolveActiveRestrictions([]);
assertEqual(emptyActiveDefs.length, 0, 'resolveActiveRestrictions([]) → []');

// ─── 26. RestrictionMatch structure completeness ──────────────────────────────

section('26. RestrictionMatch structure completeness');

const sampleMatches = resolveIngredientRestrictions('tahini', [sesameDef]);
assert(sampleMatches.length === 1, 'sample match count');
const m = sampleMatches[0]!;
assert(typeof m.restriction === 'object',    'match.restriction is an object');
assert(typeof m.restriction.id === 'string', 'match.restriction.id is a string');
assert(typeof m.matchedTerm === 'string',    'match.matchedTerm is a string');
assert(
  m.sourceType === 'alias' || m.sourceType === 'derived_ingredient' || m.sourceType === 'hidden_ingredient',
  'match.sourceType is a valid RestrictionSourceType',
);
assert(typeof m.sourceValue === 'string', 'match.sourceValue is a string');

// ─── 27. resolveTextRestrictions ─────────────────────────────────────────────

section('27. resolveTextRestrictions');

const textGluten = resolveTextRestrictions('topped with malt vinegar', [glutenDef]);
assert(textGluten.length === 1 && textGluten[0].restriction.id === 'gluten', 'resolveTextRestrictions finds gluten via hidden ingredient');

const textSoy = resolveTextRestrictions('stir fry with soy sauce', [soyDef]);
assert(textSoy.length === 1 && textSoy[0].restriction.id === 'soy', 'resolveTextRestrictions finds soy in text');

const textNone = resolveTextRestrictions('drizzle with olive oil', [glutenDef, dairyDef, peanutDef]);
assertEqual(textNone, [], 'safe text → no matches');

// ─── 28. Soybean / soybeans alias matching ────────────────────────────────────
//
// Verifies that whole-bean ingredient terms resolve to the soy restriction.
// These were previously missed because wordBoundaryIncludes("soy") does not
// match "soybean" — the 'b' follows without a space boundary.

section('28. Soybean alias matching');

const soybeanResult = resolveIngredientRestrictions('soybean', [soyDef]);
assert(soybeanResult.length === 1 && soybeanResult[0].restriction.id === 'soy', '"soybean" resolves soy');
assertEqual(soybeanResult[0].sourceType, 'alias', '"soybean" matched as alias');

const soybeansResult = resolveIngredientRestrictions('soybeans', [soyDef]);
assert(soybeansResult.length === 1 && soybeansResult[0].restriction.id === 'soy', '"soybeans" resolves soy');

const soyaBeanResult = resolveIngredientRestrictions('soya bean', [soyDef]);
assert(soyaBeanResult.length === 1 && soyaBeanResult[0].restriction.id === 'soy', '"soya bean" resolves soy');

const soyaBeansResult = resolveIngredientRestrictions('soya beans', [soyDef]);
assert(soyaBeansResult.length === 1 && soyaBeansResult[0].restriction.id === 'soy', '"soya beans" resolves soy');

const soyBeanResult = resolveIngredientRestrictions('soy bean', [soyDef]);
assert(soyBeanResult.length === 1 && soyBeanResult[0].restriction.id === 'soy', '"soy bean" resolves soy');

const soyBeansResult = resolveIngredientRestrictions('soy beans', [soyDef]);
assert(soyBeansResult.length === 1 && soyBeansResult[0].restriction.id === 'soy', '"soy beans" resolves soy');

// Soy sauce still resolves (regression check)
const soySauceRegression = resolveIngredientRestrictions('soy sauce', [soyDef]);
assert(soySauceRegression.length === 1 && soySauceRegression[0].restriction.id === 'soy', '"soy sauce" still resolves soy (regression)');

// Tofu still resolves (regression check)
const tofuRegression = resolveIngredientRestrictions('tofu', [soyDef]);
assert(tofuRegression.length === 1 && tofuRegression[0].restriction.id === 'soy', '"tofu" still resolves soy (regression)');

// Savoy cabbage still NOT matched (word-boundary regression)
const savoyRegression = resolveIngredientRestrictions('savoy cabbage', [soyDef]);
assertEqual(savoyRegression, [], '"savoy cabbage" still does NOT match soy (regression)');

// Ingredient string that contains "soybeans" as part of a longer phrase
const soySauceWithSoybeans = resolveIngredientRestrictions('soybeans (water, salt)', [soyDef]);
assert(soySauceWithSoybeans.length === 1 && soySauceWithSoybeans[0].restriction.id === 'soy', '"soybeans (water, salt)" resolves soy');

// No duplicate when both "soy" and "soybeans" appear in one product — dedup by id
const soyAndSoybeans = resolveIngredientRestrictions('soy', [soyDef]);
assert(soyAndSoybeans.length === 1, 'No duplicate soy result for "soy" alone');

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n────────────────────────────────────────`);
console.log(`RESTRICTION RESOLVER TESTS: ${passed} passed, ${failed} failed`);
console.log(`────────────────────────────────────────`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
