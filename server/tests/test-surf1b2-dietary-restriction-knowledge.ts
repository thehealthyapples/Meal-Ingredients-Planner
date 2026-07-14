/**
 * test-surf1b2-dietary-restriction-knowledge.ts
 * =============================================
 * SURF1B2 — completing the canonical dietary restriction knowledge.
 *
 * SURF1B restored the safety PATH: it made every declared restriction reach a gate.
 * It closed with one limitation, named as the first thing to do next:
 *
 *   "`meat`, `fish` and `honey` have no canonical restriction definition … a
 *    household declaring bare "meat" with NO pattern is enforced only by the
 *    conservative substring fallback, which catches "meatball" and not "beef"."
 *
 * That is a KNOWLEDGE gap, not a routing one. The path was sound and it was
 * carrying a fact the library could not read.
 *
 * The layers below are ordered by what each one protects:
 *
 *   1. COVERAGE       — every hard-restriction value THA accepts, at every door,
 *                       resolves to an enforceable canonical definition. This is
 *                       the workstream's whole claim, stated as an assertion.
 *   2. NEGATIVE CONTROL — pins the DEFECT, not the fix. Proves the substring
 *                       fallback that used to carry `meat`/`fish`/`honey` was
 *                       blind to beef, salmon and honey. Must pass forever.
 *   3. ENFORCEMENT    — the three new definitions reject real meals, including via
 *                       derived and hidden ingredients (anchovy in Worcestershire
 *                       sauce is the one that matters most).
 *   4. NEGATIVE CONTROLS — the unglamorous half of the work, and the larger half.
 *                       A restriction that excludes kidney beans, goat's cheese and
 *                       vegan sausages is not a safety feature, it is a broken
 *                       platform. Every one of these must NOT match.
 *   5. ONE OWNER      — the canonical library must remain a strict SUPERSET of
 *                       `dietRules`' meat/fish vocabulary, so the two owners of
 *                       "what is meat" can never silently diverge.
 *   6. WRITE DOORS    — THA may not store a restriction it cannot enforce.
 *                       "Accepted" and "enforceable" are now the same set.
 *   7. FAIL-CLOSED    — SURF1B's behaviour is preserved, unchanged.
 *   8. LIVE (DB)      — the real households, through the real code path.
 *
 * Run with: npx tsx server/tests/test-surf1b2-dietary-restriction-knowledge.ts
 */

import {
  resolveActiveRestrictions,
  resolveIngredientRestrictions,
  isEnforceableRestriction,
  unenforceableRestrictions,
  findRestrictionById,
  listRestrictionIds,
} from '../../shared/restrictions/restriction-resolver.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RESTRICTION_LIBRARY_VERSION } from '../../shared/restrictions/restriction-library.js';
import { shouldExcludeRecipe } from '../../shared/dietRules.js';
import {
  isMealSafeForHousehold,
  isSafetyGateActive,
  resolveHouseholdSafetyContext,
  type HouseholdSafetyContext,
} from '../lib/household-dietary-safety.js';

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

/** A resolved household declaring `hard` and nothing else. */
function household(hard: string[], dietPattern: string | null = null): HouseholdSafetyContext {
  return {
    status: 'resolved',
    householdId: 1,
    requesterUserId: 1,
    requesterDietPattern: dietPattern,
    members: [{
      userId: 1,
      displayName: 'Requester',
      hardRestrictions: hard,
      dietPattern,
      dietTypes: [],
      excludedIngredients: [],
    }],
    hardRestrictions: hard,
    activeRestrictions: resolveActiveRestrictions(hard),
    dietPatterns: dietPattern ? [dietPattern] : [],
    preferences: { dietTypes: [], excludedIngredients: [] },
  };
}

/** Does an ingredient conflict with a household declaring `declared`? */
function conflicts(ingredient: string, declared: string[]): boolean {
  return resolveIngredientRestrictions(ingredient, resolveActiveRestrictions(declared)).length > 0;
}

/** Would the pre-SURF1B2 substring fallback have caught this? (see layer 2) */
function substringFallbackWouldCatch(text: string, restriction: string): boolean {
  return text.toLowerCase().includes(restriction.toLowerCase().trim().replace(/[-_]/g, ' '));
}

async function run(): Promise<void> {
  console.log('SURF1B2 — Canonical Dietary Restriction Knowledge Completion');
  console.log('='.repeat(60));
  console.log(`Restriction library version: ${RESTRICTION_LIBRARY_VERSION}`);
  console.log(`Canonical definitions: ${listRestrictionIds().join(', ')}`);

  // ═══════════════════════════════════════════════════════════════════════════
  section('1. COVERAGE — every accepted hard restriction resolves');
  // Every door through which a hard restriction can enter THA. If a value is added
  // to any of these lists without a canonical definition, this section fails.

  // Door 1: the profile chips — client/src/lib/diets.ts ALLERGY_INTOLERANCE_OPTIONS,
  //         and the server enum that validates them (routes.ts ALLOWED_DIET_RESTRICTIONS).
  const PROFILE_OPTIONS = ['Gluten-Free', 'Dairy-Free', 'Nuts', 'Eggs', 'Shellfish', 'Soy', 'Sesame'];
  // Door 2: the onboarding chips — client/src/lib/diets.ts ALLERGY_OPTIONS (lower-case).
  const ONBOARDING_OPTIONS = ['nuts', 'dairy', 'gluten', 'eggs', 'shellfish', 'soy', 'sesame'];
  // Door 3: seeds and the development world — benchmark/world-fixtures.ts,
  //         data/development_world/households/*.json.
  const SEEDED_VALUES = ['meat', 'fish', 'honey', 'dairy', 'eggs', 'tree nuts', 'sesame', 'soy', 'gluten'];
  // Door 4: values already persisted in production, as at 2026-07-14.
  const LIVE_PROFILE_VALUES = ['Nuts', 'eggs', 'dairy', 'Soy', 'Gluten-Free', 'honey', 'fish', 'Dairy-Free', 'Eggs', 'Sesame', 'meat'];
  const LIVE_EATER_VALUES = ['tree nuts', 'fish', 'eggs', 'meat', 'gluten', 'honey', 'dairy', 'soy', 'sesame'];

  const ACCEPTED: Array<[string, string[]]> = [
    ['profile chips + server enum', PROFILE_OPTIONS],
    ['onboarding chips', ONBOARDING_OPTIONS],
    ['seeds / development world', SEEDED_VALUES],
    ['live users.diet_restrictions', LIVE_PROFILE_VALUES],
    ['live household_eaters.hard_restrictions', LIVE_EATER_VALUES],
  ];

  for (const [door, values] of ACCEPTED) {
    const unenforceable = unenforceableRestrictions(values);
    assert(
      unenforceable.length === 0,
      `every value accepted via ${door} resolves to an enforceable definition (${values.length} values)`,
      unenforceable.length ? `unenforceable: ${unenforceable.join(', ')}` : undefined,
    );
  }

  // The three the workstream exists for, named individually so a regression says so.
  for (const id of ['meat', 'fish', 'honey']) {
    assert(!!findRestrictionById(id), `"${id}" now HAS a canonical restriction definition (SURF1B limitation #1)`);
    assert(isEnforceableRestriction(id), `"${id}" is enforceable`);
  }

  // Aliases and case, as the live data actually holds them.
  assert(isEnforceableRestriction('Meat'), '"Meat" resolves (case-insensitive)');
  assert(isEnforceableRestriction('meat-free'), '"meat-free" resolves (alias)');
  assert(isEnforceableRestriction('no meat'), '"no meat" resolves (alias)');
  assert(isEnforceableRestriction('fish-free'), '"fish-free" resolves (alias)');
  assert(isEnforceableRestriction('Honey'), '"Honey" resolves (case-insensitive)');

  // ═══════════════════════════════════════════════════════════════════════════
  section('2. NEGATIVE CONTROL — what the substring fallback could not see');
  // These assertions pin the DEFECT, not the fix. They state what the pre-SURF1B2
  // path did, and they must keep passing forever: the day someone deletes the
  // canonical definitions and falls back to substring matching, these still hold
  // and layer 3 fails loudly.

  assert(
    !substringFallbackWouldCatch('slow-braised beef stew', 'meat'),
    'substring fallback alone does NOT catch "beef stew" for a "meat" restriction',
  );
  assert(
    substringFallbackWouldCatch('swedish meatballs', 'meat'),
    'substring fallback alone DOES catch "meatballs" — it caught the word, not the food',
  );
  assert(
    !substringFallbackWouldCatch('pan-fried salmon fillet', 'fish'),
    'substring fallback alone does NOT catch "salmon" for a "fish" restriction',
  );
  assert(
    !substringFallbackWouldCatch('caesar salad with anchovy dressing', 'fish'),
    'substring fallback alone does NOT catch anchovy — the hidden fish',
  );
  assert(
    !substringFallbackWouldCatch('baklava', 'honey'),
    'substring fallback alone does NOT catch "baklava" for a "honey" restriction',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('3. ENFORCEMENT — the three new definitions reject real food');

  // MEAT — by alias (whole word), by derived ingredient, by hidden ingredient.
  const MEAT_MUST_REJECT = [
    'beef mince', 'pork belly', 'chicken thighs', 'lamb shank', 'duck breast',
    'gammon steak', 'smoked bacon', 'pork sausages', 'beef meatballs', 'ribeye steak',
    'prosciutto', 'pancetta', 'chorizo', 'salami', 'pepperoni', 'venison', 'mutton',
    'black pudding', 'haggis', 'foie gras', 'oxtail', 'tripe', 'liver', 'suet', 'lard',
    'gelatine', 'chicken stock', 'bone broth', 'duck fat', 'biltong', 'turkey mince',
  ];
  for (const food of MEAT_MUST_REJECT) {
    assert(conflicts(food, ['meat']), `"meat" rejects ${food}`);
  }

  // FISH — including the hidden-anchovy family, which is the real prize.
  const FISH_MUST_REJECT = [
    'salmon fillet', 'tuna steak', 'smoked haddock', 'cod loin', 'sardines',
    'mackerel', 'sea bass', 'lemon sole', 'trout', 'anchovies', 'anchovy paste',
    'fish sauce', 'fish fingers', 'seafood linguine', 'caviar', 'surimi',
  ];
  for (const food of FISH_MUST_REJECT) {
    assert(conflicts(food, ['fish']), `"fish" rejects ${food}`);
  }
  for (const hidden of ['worcestershire sauce', 'caesar dressing', 'puttanesca', 'kedgeree', 'nam pla']) {
    assert(conflicts(hidden, ['fish']), `"fish" rejects ${hidden} — HIDDEN anchovy, invisible in the name`);
  }

  // HONEY — including the products that never say "honey".
  for (const food of ['honey', 'runny honey', 'manuka honey', 'honeycomb', 'royal jelly', 'beeswax', 'mead']) {
    assert(conflicts(food, ['honey']), `"honey" rejects ${food}`);
  }
  for (const hidden of ['baklava', 'nougat', 'halva']) {
    assert(conflicts(hidden, ['honey']), `"honey" rejects ${hidden} — traditionally honey-sweetened`);
  }

  // End to end, through the one meal safety gate.
  const meatFree = household(['meat']);
  assert(
    !isMealSafeForHousehold({ name: 'Beef Bourguignon', ingredients: ['beef shin', 'red wine', 'carrots'] }, meatFree).safe,
    'the meal gate rejects Beef Bourguignon for a household declaring bare "meat" — SURF1B could not',
  );
  assert(
    isMealSafeForHousehold({ name: 'Lentil & Squash Curry', ingredients: ['red lentils', 'butternut squash', 'coconut milk'] }, meatFree).safe,
    'the meal gate still SERVES a lentil curry to that household — it did not become a wall',
  );
  const fishFree = household(['fish']);
  assert(
    !isMealSafeForHousehold({ name: 'Spaghetti Puttanesca', ingredients: ['spaghetti', 'olives', 'capers', 'anchovies'] }, fishFree).safe,
    'the meal gate rejects puttanesca for a "fish" restriction — the anchovy is in the ingredients',
  );
  assert(
    !isMealSafeForHousehold({ name: 'Caesar Salad', ingredients: ['romaine', 'croutons', 'caesar dressing'] }, fishFree).safe,
    'the meal gate rejects a Caesar salad for a "fish" restriction — the anchovy is in the DRESSING',
  );
  const vegan = household(['meat', 'fish', 'dairy', 'eggs', 'honey']);
  assert(isSafetyGateActive(vegan), 'the gate is active for the {meat, fish, dairy, eggs, honey} households (users 181–184)');
  for (const meal of [
    { name: 'Honey-Glazed Ham', ingredients: ['gammon joint', 'runny honey'] },
    { name: 'Salmon Niçoise', ingredients: ['salmon fillet', 'egg', 'green beans'] },
    { name: 'Chicken Caesar', ingredients: ['chicken breast', 'caesar dressing', 'parmesan'] },
  ]) {
    assert(!isMealSafeForHousehold(meal, vegan).safe, `the {meat,fish,dairy,eggs,honey} household rejects "${meal.name}"`);
  }
  assert(
    isMealSafeForHousehold(
      { name: 'Chickpea & Spinach Stew', ingredients: ['chickpeas', 'spinach', 'tomatoes', 'olive oil'] },
      vegan,
    ).safe,
    'that same household is still SERVED a chickpea and spinach stew',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('4. NEGATIVE CONTROLS — foods that must NOT be excluded');
  // The half of this work that keeps THA usable. Each of these contains the letters
  // of a restricted term and none of the substance. A safety system that removes
  // kidney beans from a vegan is not cautious, it is wrong.

  const MEAT_MUST_NOT_REJECT: Array<[string, string]> = [
    ['kidney beans',          'a vegan staple — shares the word "kidney" with offal'],
    ['beef tomato',           'a tomato variety'],
    ['beef tomatoes',         'a tomato variety'],
    ["lamb's lettuce",        'a salad leaf'],
    ['lambs lettuce',         'a salad leaf'],
    ['goat cheese',           'dairy, not meat'],
    ["goat's cheese",         'dairy, not meat'],
    ['goats milk',            'dairy, not meat'],
    ['duck egg',              'an egg, not meat'],
    ['quail eggs',            'an egg, not meat'],
    ['mince pies',            'fruit mincemeat — no meat'],
    ['mincemeat',             'fruit — no meat'],
    ['chicken of the woods',  'a mushroom'],
    ['coconut meat',          'the flesh of a coconut'],
    ['vegetable suet',        'vegetarian suet is real and common'],
    ['vegetarian rennet',     'microbial rennet is not animal-derived'],
    ['cauliflower steak',     'a vegetable'],
    ['mushroom steak',        'a vegetable'],
    ['hamburger bun',         'the bun is bread; it carries no meat'],
    ['chamomile tea',         'contains the letters of "ham"'],
    ['lambrusco',             'contains the letters of "lamb"'],
    ['gooseberries',          'contains the letters of "goose"'],
    // Plant-based analogues. Excluding a meat-free product from a household that is
    // avoiding meat defeats the entire purpose of the product.
    ['vegan sausage',         'the whole point of it is that it is not meat'],
    ['veggie sausages',       'the whole point of it is that it is not meat'],
    ['plant-based mince',     'the whole point of it is that it is not meat'],
    ['quorn mince',           'mycoprotein'],
    ['vegan bacon',           'not meat'],
    ['beyond burger',         'not meat'],
    ['jackfruit',             'a fruit used as a pulled-pork substitute'],
    ['meat-free sausages',    'it says so on the packet'],
    ['mushroom pate',         'a mushroom'],
    ['vegan haggis',          'not meat'],
    ['tofu',                  'not meat'],
    ['tempeh',                'not meat'],
  ];
  for (const [food, why] of MEAT_MUST_NOT_REJECT) {
    assert(!conflicts(food, ['meat']), `"meat" does NOT reject ${food} — ${why}`);
  }

  const FISH_MUST_NOT_REJECT: Array<[string, string]> = [
    ['shellfish',          'a SEPARATE allergen — fish and shellfish are distinct in law and medicine'],
    ['king prawns',        'shellfish, not fish'],
    ['crab',               'shellfish, not fish'],
    ['mussels',            'shellfish, not fish'],
    ['scallops',           'shellfish, not fish'],
    ['squid',              'shellfish, not fish'],
    ['vegan fish fingers', 'the whole point of it is that it is not fish'],
    ['fish-free batter',   'it says so on the packet'],
    ['chicken breast',     'not fish'],
    ['peeled potatoes',    'contains the letters of "eel"'],
  ];
  for (const [food, why] of FISH_MUST_NOT_REJECT) {
    assert(!conflicts(food, ['fish']), `"fish" does NOT reject ${food} — ${why}`);
  }

  // …and the converse. A shellfish allergy does not exclude salmon.
  for (const food of ['salmon fillet', 'cod loin', 'tuna']) {
    assert(!conflicts(food, ['shellfish']), `"shellfish" does NOT reject ${food} — it is a fish, a separate allergen`);
  }
  for (const food of ['king prawns', 'mussels']) {
    assert(conflicts(food, ['shellfish']), `"shellfish" still rejects ${food} (SURF1B behaviour preserved)`);
  }

  const HONEY_MUST_NOT_REJECT: Array<[string, string]> = [
    ['honeydew melon',    'a melon'],
    ['honeysuckle',       'a flower'],
    ['meadow herbs',      'contains the letters of "mead"'],
    ['vegan honey',       'not honey'],
    ['honey-free granola','it says so on the packet'],
    ['maple syrup',       'the substitute — it must not be excluded too'],
  ];
  for (const [food, why] of HONEY_MUST_NOT_REJECT) {
    assert(!conflicts(food, ['honey']), `"honey" does NOT reject ${food} — ${why}`);
  }

  // A household with all three restrictions is still fed.
  const allThree = household(['meat', 'fish', 'honey']);
  for (const meal of [
    { name: 'Kidney Bean Chilli', ingredients: ['kidney beans', 'beef tomatoes', 'cumin'] },
    { name: 'Goat’s Cheese & Beetroot Salad', ingredients: ["goat's cheese", "lamb's lettuce", 'beetroot'] },
    { name: 'Vegan Sausage Casserole', ingredients: ['vegan sausages', 'butter beans', 'vegetable stock'] },
    { name: 'Honeydew & Mint Salad', ingredients: ['honeydew melon', 'mint', 'lime'] },
  ]) {
    assert(
      isMealSafeForHousehold(meal, allThree).safe,
      `a {meat, fish, honey} household is still SERVED "${meal.name}"`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  section('5. ONE OWNER — the second owner of "what is meat" is RETIRED');
  // ── This section is INVERTED, and the inversion is the point of a pin. ──────
  //
  // SURF1B2 could not merge the two owners of "what is meat" — dietRules' private
  // MEAT_KEYWORDS (serving the Vegan/Vegetarian PATTERNS) and the canonical `meat`
  // definition (serving declared RESTRICTIONS) — because merging changes the gate for
  // every vegan household and needed its own regression budget. So it PINNED them:
  // the library had to remain a strict superset, and the divergence was recorded as
  // the first thing to do next.
  //
  // SURF1B4 did it. The lists are DELETED and the patterns resolve here. These
  // assertions now guard the merged state: they fail the day a meat keyword reappears
  // in dietRules, which is the only way this defect could come back.

  // Comments stripped before scanning. A check that cannot tell prose from a keyword
  // list is not a check — the retired lists are NAMED in this file's own header, and a
  // scan that trips on the sentence recording their retirement would be worthless.
  const dietRulesSource = readFileSync(
    join(process.cwd(), 'shared/dietRules.ts'),
    'utf8',
  )
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  assert(
    !/MEAT_KEYWORDS|FISH_SEAFOOD_KEYWORDS|DISH_NAME_MEAT_OR_SEAFOOD/.test(dietRulesSource),
    'dietRules holds NO meat or fish keyword list — the duplicate owner is deleted, not deprecated',
  );

  assert(
    /VEGAN_RESTRICTION_IDS|VEGETARIAN_RESTRICTION_IDS/.test(dietRulesSource) &&
      dietRulesSource.includes('restriction-resolver'),
    'the Vegan and Vegetarian patterns resolve through the canonical restriction library',
  );

  // The seven meats the library knew and the pattern did not. Every one of them was
  // servable to a vegan household at 194f7af2. Each is now refused by BOTH paths.
  const ONCE_KNOWN_TO_THE_LIBRARY_ONLY = [
    'prosciutto', 'pancetta', 'gammon', 'mutton', 'gelatine', 'bone broth', 'foie gras',
  ];
  for (const term of ONCE_KNOWN_TO_THE_LIBRARY_ONLY) {
    const viaRestriction = conflicts(term, ['meat']);
    const viaPattern = shouldExcludeRecipe(
      { name: 'Dish', ingredients: [term] },
      { dietPattern: 'Vegan', dietRestrictions: [] },
    );
    assert(
      viaRestriction && viaPattern,
      `"${term}" is refused by BOTH the meat restriction AND the Vegan pattern — the SURF1B2 divergence, closed`,
      `restriction=${viaRestriction} pattern=${viaPattern}`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  section('6. WRITE DOORS — THA may not store a restriction it cannot enforce');

  assert(!isEnforceableRestriction('kiwi'), 'an unenforceable custom value ("kiwi") is correctly reported unenforceable');
  assert(!isEnforceableRestriction('other'), 'the onboarding "other" sentinel is correctly reported unenforceable');
  assert(
    unenforceableRestrictions(['Nuts', 'kiwi', 'meat', 'quinoa']).join(',') === 'kiwi,quinoa',
    'unenforceableRestrictions names exactly the offending values, in order, as typed',
  );
  assert(
    unenforceableRestrictions(PROFILE_OPTIONS).length === 0,
    'the profile door\'s entire offered vocabulary passes the write-door check',
  );
  assert(
    unenforceableRestrictions([...LIVE_PROFILE_VALUES, ...LIVE_EATER_VALUES]).length === 0,
    'every value ALREADY IN PRODUCTION passes the new write-door check — no live row becomes unwritable',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('7. FAIL-CLOSED — SURF1B behaviour preserved');

  const unavailable: HouseholdSafetyContext = {
    status: 'unavailable',
    householdId: null,
    requesterUserId: 1,
    requesterDietPattern: null,
    members: [],
    hardRestrictions: [],
    activeRestrictions: [],
    dietPatterns: [],
    preferences: { dietTypes: [], excludedIngredients: [] },
  };
  assert(
    !isMealSafeForHousehold({ name: 'Plain Rice', ingredients: ['rice'] }, unavailable).safe,
    'an unresolved safety context still refuses every meal, even plain rice',
  );
  assert(isSafetyGateActive(unavailable), 'an unresolved safety context keeps the gate ACTIVE');
  assert(
    isMealSafeForHousehold({ name: 'Plain Rice', ingredients: ['rice'] }, household([])).safe,
    'a RESOLVED household with no restrictions is still served — "none declared" is a fact, not a failure',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('8. LIVE — against the real database');

  let dbReached = false;
  try {
    const { db } = await import('../db.js');
    const { sql } = await import('drizzle-orm');

    const profileRows: any = await db.execute(
      sql`SELECT DISTINCT unnest(diet_restrictions) AS value FROM users WHERE diet_restrictions IS NOT NULL`,
    );
    const eaterRows: any = await db.execute(
      sql`SELECT DISTINCT unnest(hard_restrictions) AS value FROM household_eaters WHERE hard_restrictions IS NOT NULL`,
    );
    dbReached = true;

    const liveProfile: string[] = (profileRows.rows ?? profileRows).map((r: any) => r.value).filter(Boolean);
    const liveEater: string[] = (eaterRows.rows ?? eaterRows).map((r: any) => r.value).filter(Boolean);

    console.log(`  … users.diet_restrictions holds ${liveProfile.length} distinct values: ${liveProfile.join(', ')}`);
    console.log(`  … household_eaters.hard_restrictions holds ${liveEater.length} distinct values: ${liveEater.join(', ')}`);

    const badProfile = unenforceableRestrictions(liveProfile);
    assert(
      badProfile.length === 0,
      `EVERY distinct restriction in live users.diet_restrictions resolves (${liveProfile.length}/${liveProfile.length})`,
      badProfile.length ? `unenforceable: ${badProfile.join(', ')}` : undefined,
    );
    const badEater = unenforceableRestrictions(liveEater);
    assert(
      badEater.length === 0,
      `EVERY distinct restriction in live household_eaters.hard_restrictions resolves (${liveEater.length}/${liveEater.length})`,
      badEater.length ? `unenforceable: ${badEater.join(', ')}` : undefined,
    );

    // The four households SURF1B named as unprotected-by-knowledge: users 181–184,
    // who declared {meat, fish, dairy, eggs, honey}. Resolve them for real.
    const restrictedUsers: any = await db.execute(
      sql`SELECT id, diet_restrictions FROM users
          WHERE diet_restrictions IS NOT NULL
            AND array_length(diet_restrictions, 1) > 0
            AND (diet_restrictions && ARRAY['meat','fish','honey'])
          ORDER BY id`,
    );
    const rows = (restrictedUsers.rows ?? restrictedUsers) as Array<{ id: number; diet_restrictions: string[] }>;
    console.log(`  … ${rows.length} live user(s) declare meat / fish / honey`);

    let allResolved = true;
    let allEnforced = true;
    let beefRejected = 0;
    for (const row of rows) {
      const ctx = await resolveHouseholdSafetyContext(row.id);
      if (ctx.status !== 'resolved') { allResolved = false; continue; }
      // Every declared value must now appear as a canonical active restriction.
      const declared = row.diet_restrictions.filter(v => ['meat', 'fish', 'honey'].includes(v.toLowerCase()));
      const activeIds = ctx.activeRestrictions.map(r => r.id);
      if (!declared.every(d => activeIds.includes(d.toLowerCase()))) allEnforced = false;
      // …and a beef meal must actually be refused.
      const verdict = isMealSafeForHousehold(
        { name: 'Beef Lasagne', ingredients: ['beef mince', 'lasagne sheets', 'parmesan'] },
        ctx,
      );
      if (!verdict.safe) beefRejected++;
    }

    if (rows.length > 0) {
      assert(allResolved, `every meat/fish/honey household's safety context RESOLVES (${rows.length}/${rows.length})`);
      assert(
        allEnforced,
        `every meat/fish/honey household's declaration now appears as a CANONICAL active restriction (${rows.length}/${rows.length}) — was 0/${rows.length}`,
      );
      assert(
        beefRejected === rows.length,
        `every meat/fish/honey household REFUSES a beef lasagne (${beefRejected}/${rows.length}) — the SURF1B gap, closed`,
      );
    } else {
      console.log('  … no live meat/fish/honey households found — section skipped');
    }
  } catch (err) {
    if (!dbReached) {
      console.log('  … database unreachable — LIVE section skipped');
    } else {
      console.error('  ✗ FAIL: LIVE section errored', err);
      failed++;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Suite crashed:', err);
  process.exit(1);
});
