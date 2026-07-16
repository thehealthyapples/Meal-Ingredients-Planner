/**
 * test-surf1b5-starter-meal-safety.ts
 * ===================================
 * SURF1B5 — Starter Meal Safety Convergence.
 *
 * THE DEFECT
 * ----------
 * Starter meals — the first cookbook a household is ever given — were selected by a
 * PREFERENCE and never by SAFETY.
 *
 * `getStarterMeals()` matched the soft `user_preferences.diet_types` label preference
 * against the `meals.diet_types` LABEL, then called `pickMealsWithBackfill()`, which
 * topped the list up from ALL system meals whenever too few carried the label.
 *
 *   21 meals wanted per category.  Vegan-labelled system meals: 2 breakfasts.
 *   → the backfill fired, and the pool it drew from was full of meat.
 *
 * Two further holes sat behind it, both worse:
 *
 *   · the label filter only ran when `diet_types` was non-empty — so 43 live users who
 *     hold a diet PATTERN and no label preference were handed the unfiltered cookbook;
 *   · `users.diet_restrictions` was never read here at all — so a Gluten-Free household
 *     was served 42 gluten-bearing starter meals. Allergens, not preferences.
 *
 * Measured at 933dfabe: 36 of 95 constrained households were served at least one meal
 * the canonical gate refuses; 986 prohibited servings in total.
 *
 * THE FIX
 * Every starter meal — candidate AND backfill — passes `isMealSafeForHousehold()`, the
 * one canonical gate. The label keeps only the job it can do honestly: it ORDERS the
 * safe pool. And the labeller itself now asks the canonical library what meat is, so a
 * label THA prints can no longer contradict the gate THA serves through.
 *
 * THE LAYERS
 *   1  BACKFILL — the top-up can only ever draw from the safe pool
 *   2  FEWER, NEVER UNSAFE — a short safe pool yields a short list, never a padded one
 *   3  UNRESTRICTED — households with nothing to gate against keep their full backfill
 *   4  LABEL IS ORDERING, NOT ADMISSION — safe-but-unlabelled meals are served; a label
 *      cannot admit a meal the gate refuses
 *   5  FAIL-CLOSED — an unresolved safety context serves nothing, and preloads nothing
 *   6  THE LABEL PATH — imported meals cannot be labelled vegan/vegetarian against the
 *      canonical answer (prosciutto, gelatine, dairy, eggs, honey)
 *   7  POSITIVE CONTROLS — vegan sausages, oat milk and the other plant substitutes stay
 *   8  ONE OWNER — the retired keyword lists are gone from the labeller and cannot return
 *   9  PATTERNS STAY PER MEMBER — no household-wide union of diet patterns
 *  10  LIVE DATA — every live household, every starter meal, the real gate
 *
 * Run with: npm run test:surf1b5-starter-meal-safety
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../db.js';
import { users, meals, userPreferences, householdEaters, householdMembers } from '../../shared/schema.js';
import type { Meal } from '../../shared/schema.js';
import { dietPatternFromDietTypes } from '../../shared/dietRules.js';
import { getStarterMeals, pickMealsWithBackfill } from '../lib/meal-service.js';
import { detectDietTypes } from '../lib/external-meal-service.js';
import {
  resolveHouseholdSafetyContext,
  isMealSafeForHousehold,
  isSafetyGateActive,
  type HouseholdSafetyContext,
} from '../lib/household-dietary-safety.js';

// ─── Harness ──────────────────────────────────────────────────────────────────

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

function note(line: string): void {
  console.log(`  … ${line}`);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** The number of starter meals wanted per category. Mirrors `MEALS_PER_CATEGORY`. */
const WANTED = 21;

let nextId = 1;
function meal(name: string, ingredients: string[], dietTypes: string[] = []): Meal {
  return { id: nextId++, name, ingredients, dietTypes } as unknown as Meal;
}

/** A safety context built by hand, so the gate can be exercised without a database. */
function ctxFor(
  dietPattern: string | null,
  hardRestrictions: string[] = [],
): HouseholdSafetyContext {
  return {
    status: 'resolved',
    householdId: 1,
    requesterUserId: 1,
    requesterDietPattern: dietPattern,
    members: [],
    hardRestrictions,
    activeRestrictions: [],
    dietPatterns: dietPattern ? [dietPattern] : [],
    preferences: { dietTypes: [], excludedIngredients: [] },
  };
}

const UNAVAILABLE: HouseholdSafetyContext = {
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

const safeFor = (m: Meal, ctx: HouseholdSafetyContext): boolean =>
  isMealSafeForHousehold({ name: m.name, ingredients: m.ingredients ?? [] }, ctx).safe;

const safePool = (pool: Meal[], ctx: HouseholdSafetyContext): Meal[] =>
  pool.filter((m) => safeFor(m, ctx));

/**
 * A synthetic breakfast category shaped exactly like the live one: a couple of
 * vegan-labelled meals, a long tail of meat, and — the part the old code never saw —
 * plenty of unlabelled meals that are perfectly vegan.
 */
function syntheticBreakfasts(): Meal[] {
  const pool: Meal[] = [];
  pool.push(meal('Vegan overnight oats', ['oat milk', 'rolled oats', 'chia seeds'], ['vegan', 'vegetarian']));
  pool.push(meal('Vegan tofu scramble', ['tofu', 'turmeric', 'spinach'], ['vegan', 'vegetarian']));
  // Safe, and completely unlabelled — invisible to the old label filter.
  for (let i = 0; i < 30; i++) {
    pool.push(meal(`Porridge with berries ${i}`, ['oats', 'water', 'blueberries'], []));
  }
  // The old backfill pool: meat, fish, dairy, eggs, honey, and SURF1B4's seven.
  for (let i = 0; i < 30; i++) {
    pool.push(meal(`Bacon sandwich ${i}`, ['bacon', 'white bread'], []));
  }
  pool.push(meal('Prosciutto & melon plate', ['prosciutto', 'melon']));
  pool.push(meal('Gelatine fruit pot', ['gelatine', 'strawberries']));
  pool.push(meal('Honey yoghurt bowl', ['honey', 'greek yoghurt']));
  pool.push(meal('Scrambled eggs on toast', ['eggs', 'butter', 'sourdough']));
  return pool;
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function sec1_backfill(): void {
  section('1  BACKFILL — the top-up can only draw from the safe pool');

  const vegan = ctxFor('Vegan');
  const pool = syntheticBreakfasts();
  const safe = safePool(pool, vegan);
  const labelled = safe.filter((m) => m.dietTypes.includes('vegan'));

  note(`synthetic breakfast pool: ${pool.length} meals, ${safe.length} vegan-safe, ${labelled.length} vegan-LABELLED`);
  assert(labelled.length < WANTED, 'the labelled pool is smaller than the slot count — the backfill MUST fire');

  const picked = pickMealsWithBackfill(labelled, safe, WANTED);
  assert(picked.length === WANTED, `the household still receives a full ${WANTED} meals`, `got ${picked.length}`);
  assert(
    picked.every((m) => safeFor(m, vegan)),
    'every meal returned — labelled AND backfilled — passes the canonical gate',
    picked.filter((m) => !safeFor(m, vegan)).map((m) => m.name).join(', '),
  );
  assert(
    picked.some((m) => !m.dietTypes.includes('vegan')),
    'the backfill genuinely fired (unlabelled meals are present) — this test is not passing by refusing everything',
  );
  assert(
    !picked.some((m) => /bacon|prosciutto|gelatine|honey|egg/i.test(m.ingredients.join(' '))),
    'NOT ONE prohibited meal reached the list — bacon, prosciutto, gelatine, honey and eggs are all absent',
  );

  // The defect, stated as a test: hand the OLD backfill source (the whole category) to
  // the same function and prohibited meals appear. This is what shipped at 933dfabe.
  const oldStyle = pickMealsWithBackfill(labelled, pool, WANTED);
  assert(
    oldStyle.some((m) => !safeFor(m, vegan)),
    'NEGATIVE CONTROL: backfilling from the unrestricted pool (the pre-SURF1B5 behaviour) DOES serve prohibited meals',
  );
  note(`the old path would have served ${oldStyle.filter((m) => !safeFor(m, vegan)).length} prohibited meals in this category`);
}

function sec2_fewerNeverUnsafe(): void {
  section('2  FEWER, NEVER UNSAFE — a short safe pool yields a short list');

  const vegan = ctxFor('Vegan');
  // A category with only three safe meals and a mountain of meat.
  const pool: Meal[] = [
    meal('Vegan overnight oats', ['oat milk', 'oats'], ['vegan']),
    meal('Fruit salad', ['apple', 'pear'], []),
    meal('Toast & jam', ['sourdough', 'jam'], []),
    ...Array.from({ length: 40 }, (_, i) => meal(`Sausage bap ${i}`, ['pork sausage', 'bap'])),
  ];
  const safe = safePool(pool, vegan);
  const picked = pickMealsWithBackfill(safe.filter((m) => m.dietTypes.includes('vegan')), safe, WANTED);

  assert(safe.length === 3, 'the safe pool holds 3 meals', `got ${safe.length}`);
  assert(picked.length === 3, 'the household receives 3 meals — FEWER than the 21 slots', `got ${picked.length}`);
  assert(picked.length < WANTED, 'the shortfall is NOT padded from the prohibited pool');
  assert(picked.every((m) => safeFor(m, vegan)), 'and all 3 are safe');
  assert(
    new Set(picked.map((m) => m.id)).size === picked.length,
    'no meal is duplicated to fill the gap — nothing is fabricated',
  );

  // The extreme: nothing safe at all.
  const carnivorousOnly = Array.from({ length: 30 }, (_, i) => meal(`Steak ${i}`, ['beef steak']));
  const nothingSafe = pickMealsWithBackfill([], safePool(carnivorousOnly, vegan), WANTED);
  assert(nothingSafe.length === 0, 'a category with no safe meal at all returns NOTHING, not a prohibited meal');
}

function sec3_unrestricted(): void {
  section('3  UNRESTRICTED — households with nothing to gate against keep their backfill');

  const none = ctxFor(null, []);
  assert(!isSafetyGateActive(none), 'a household with no pattern and no restriction has no active gate');

  const pool = syntheticBreakfasts();
  const picked = pickMealsWithBackfill([], pool, WANTED);
  assert(picked.length === WANTED, `an unrestricted household still receives the full ${WANTED}`, `got ${picked.length}`);
  assert(
    picked.some((m) => /bacon/i.test(m.ingredients.join(' '))),
    'and its backfill still reaches the whole cookbook — bacon included. SURF1B5 costs an unrestricted household nothing',
  );

  assert(isSafetyGateActive(ctxFor('Vegan')), 'a diet PATTERN alone activates the gate');
  assert(isSafetyGateActive(ctxFor(null, ['Gluten-Free'])), 'a hard RESTRICTION alone activates the gate — this was never read here before');
  assert(isSafetyGateActive(UNAVAILABLE), 'an UNAVAILABLE context is active — "we could not find out" is not "unrestricted"');
}

function sec4_labelIsOrdering(): void {
  section('4  LABEL IS ORDERING, NOT ADMISSION');

  const vegan = ctxFor('Vegan');
  const pool = syntheticBreakfasts();
  const safe = safePool(pool, vegan);

  // A meal that LIES: labelled vegan, but the food is bacon. The label used to admit it.
  const liar = meal('Vegan-style breakfast bap', ['bacon', 'white bread'], ['vegan', 'vegetarian']);
  const withLiar = [...pool, liar];
  const safeWithLiar = safePool(withLiar, vegan);
  assert(
    !safeWithLiar.some((m) => m.id === liar.id),
    'a meal LABELLED vegan whose ingredients are bacon is REFUSED — the label cannot admit it',
  );
  const picked = pickMealsWithBackfill(
    safeWithLiar.filter((m) => m.dietTypes.includes('vegan')),
    safeWithLiar,
    WANTED,
  );
  assert(!picked.some((m) => m.id === liar.id), 'and it never reaches the household, even though it matches the label preference');

  // The converse: a safe meal with NO label is served. The old code could not see it.
  const unlabelledSafe = safe.filter((m) => m.dietTypes.length === 0);
  assert(unlabelledSafe.length > 0, 'the safe pool contains meals carrying no vegan label at all');
  const pickedAll = pickMealsWithBackfill(safe.filter((m) => m.dietTypes.includes('vegan')), safe, WANTED);
  assert(
    pickedAll.some((m) => m.dietTypes.length === 0),
    'safe-but-unlabelled meals ARE served — the food is what qualifies a meal, not the sticker on it',
  );

  // Ordering is preserved: the label-matching meals still come first.
  const labelled = safe.filter((m) => m.dietTypes.includes('vegan'));
  const head = pickedAll.slice(0, labelled.length);
  assert(
    head.every((m) => m.dietTypes.includes('vegan')),
    'label-matching meals still fill the first slots — existing starter-meal ordering is preserved where safety allows',
  );
}

async function sec5_failClosed(): Promise<void> {
  section('5  FAIL-CLOSED — an unresolved safety context serves nothing');

  const pool = syntheticBreakfasts();
  const safe = safePool(pool, UNAVAILABLE);
  assert(safe.length === 0, 'under an UNAVAILABLE context the canonical gate refuses EVERY meal', `${safe.length} survived`);
  assert(
    pickMealsWithBackfill([], safe, WANTED).length === 0,
    'so the starter-meal list is empty — THA refuses to guess rather than serve a possible allergen',
  );
}

function sec6_labelPath(): void {
  section('6  THE LABEL PATH — an import cannot be labelled against the canonical answer');

  // SURF1B4 left this list alive, reasoning that "a label is a claim, not a gate".
  // That held only until something treated a label as a gate. Starter meals did.
  const holes: Array<[string, string[]]> = [
    ['Prosciutto pizza', ['prosciutto', 'mozzarella', 'pizza base']],
    ['Pancetta carbonara', ['pancetta', 'eggs', 'parmesan']],
    ['Gammon steak', ['gammon', 'pineapple']],
    ['Mutton curry', ['mutton', 'onion']],
    ['Fruit jelly', ['gelatine', 'orange juice']],
    ['Bone broth ramen', ['bone broth', 'noodles']],
    ['Foie gras toast', ['foie gras', 'brioche']],
  ];
  for (const [name, ingredients] of holes) {
    const labels = detectDietTypes(name, ingredients);
    assert(
      !labels.includes('vegetarian') && !labels.includes('vegan'),
      `an imported "${name}" is labelled neither vegan nor vegetarian`,
      `got [${labels.join(', ')}]`,
    );
  }

  // The vegan-only animal foods. The old labeller knew dairy and nothing else.
  const veganOnly: Array<[string, string[]]> = [
    ['Cheese omelette', ['eggs', 'cheddar']],
    ['Honey granola', ['honey', 'oats']],
    ['Buttered crumpets', ['butter', 'crumpets']],
  ];
  for (const [name, ingredients] of veganOnly) {
    const labels = detectDietTypes(name, ingredients);
    assert(!labels.includes('vegan'), `an imported "${name}" is NOT labelled vegan`, `got [${labels.join(', ')}]`);
    assert(labels.includes('vegetarian'), `…but IS still labelled vegetarian — the two remain different questions`);
  }

  // A CLAIM cannot outrank the canonical answer. This is the import that worried SURF1B4.
  const claimed = detectDietTypes('Vegan carbonara', ['pancetta', 'eggs', 'spaghetti']);
  assert(
    !claimed.includes('vegan') && !claimed.includes('vegetarian'),
    'a recipe that CALLS ITSELF vegan but lists pancetta is labelled neither — the source\'s claim is vetoed',
    `got [${claimed.join(', ')}]`,
  );
  const claimedVeggie = detectDietTypes('Vegetarian chicken salad', ['chicken breast', 'lettuce']);
  assert(
    !claimedVeggie.includes('vegetarian'),
    'a "vegetarian" chicken salad is not labelled vegetarian',
    `got [${claimedVeggie.join(', ')}]`,
  );
}

function sec7_positiveControls(): void {
  section('7  POSITIVE CONTROLS — the plant substitutes stay');

  const substitutes: Array<[string, string[]]> = [
    ['Vegan sausage rolls', ['vegan sausages', 'puff pastry']],
    ['Oat milk porridge', ['oat milk', 'oats']],
    ['Quorn spaghetti', ['quorn mince', 'tomatoes', 'spaghetti']],
    ['Peanut butter toast', ['peanut butter', 'bread']],
    ['Butternut squash soup', ['butternut squash', 'stock']],
    ['Vegan cheese pizza', ['vegan cheese', 'tomato', 'pizza base']],
    ['Flax egg pancakes', ['flax egg', 'flour', 'oat milk']],
  ];
  for (const [name, ingredients] of substitutes) {
    const labels = detectDietTypes(name, ingredients);
    assert(
      labels.includes('vegan') && labels.includes('vegetarian'),
      `"${name}" is still labelled vegan AND vegetarian — the fix is not a blanket refusal`,
      `got [${labels.join(', ')}]`,
    );
  }

  // The source's own claim is still allowed to UNDER-claim, and that is deliberate:
  // a source that says "vegetarian" may be telling us it is not vegan, and SURF1B5 does
  // not overrule it. Preserved from the pre-SURF1B5 rule (where "mince" in "meat-free
  // mince" tripped MEAT_KEYWORDS and produced the same [vegetarian]).
  //
  // An under-claimed label costs the household ORDERING — the meal arrives in the safe
  // backfill rather than at the head of the list. It cannot cost them the meal, because
  // the gate, not the label, decides what is served. That is the whole point of SURF1B5,
  // and here is the proof:
  const meatFreeChilli = detectDietTypes('Meat-free chilli', ['meat-free mince', 'kidney beans']);
  assert(
    meatFreeChilli.includes('vegetarian') && !meatFreeChilli.includes('vegan'),
    'a source-claimed "meat-free" dish is labelled vegetarian and NOT promoted to vegan — the claim is not overruled',
    `got [${meatFreeChilli.join(', ')}]`,
  );

  // And every one of them — under-claimed label included — is SERVED to a vegan household.
  const vegan = ctxFor('Vegan');
  const servable: Array<[string, string[]]> = [
    ...substitutes,
    ['Meat-free chilli', ['meat-free mince', 'kidney beans']],
  ];
  for (const [name, ingredients] of servable) {
    assert(
      safeFor(meal(name, ingredients), vegan),
      `"${name}" is SERVED to a vegan household by the starter-meal gate`,
    );
  }
  note('the under-labelled "Meat-free chilli" is served to a vegan anyway — the gate decides, the label only orders');
}

function sec8_oneOwner(): void {
  section('8  ONE OWNER — the retired keyword lists cannot return');

  const source = readFileSync(join(process.cwd(), 'server/lib/external-meal-service.ts'), 'utf8');
  // Strip comments first: the retired lists are NAMED in this file's own header, and a
  // check that cannot tell prose from a keyword list is not a check. (SURF1B4's method.)
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  for (const list of ['MEAT_KEYWORDS', 'FISH_KEYWORDS', 'DAIRY_KEYWORDS']) {
    assert(!code.includes(list), `${list} is GONE from the labeller — deleted, not deprecated (Principle 8)`);
  }

  // SURF1C1 moved the labeller one door further in. It no longer calls `shouldExcludeRecipe`
  // itself — it calls `classifyDietLabels`, the evidence-gated derivation of it, which lives
  // beside it in `dietRules.ts` and is the single owner of "which labels does this meal's own
  // evidence support?". The property SURF1B5 pinned here is unchanged and now pinned WHOLE:
  // the labeller holds no food vocabulary, and the chain from it to the canonical library is
  // asserted link by link rather than at one end.
  assert(
    code.includes('classifyDietLabels'),
    'the labeller delegates to the canonical classifier — it decides no diet label of its own',
  );
  const dietRulesCode = readFileSync(join(process.cwd(), 'shared/dietRules.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  assert(
    /export function classifyDietLabels/.test(dietRulesCode),
    'the canonical classifier lives in dietRules.ts — beside the gate, where it cannot drift from it',
  );
  assert(
    dietRulesCode.includes('shouldExcludeRecipe'),
    'and the classifier itself reaches the canonical library through the same door the meal gate uses',
  );

  // The meal service must not have grown a food vocabulary of its own either.
  const mealService = readFileSync(join(process.cwd(), 'server/lib/meal-service.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  for (const term of ['bacon', 'chicken', 'prosciutto', 'gelatine', 'beef', 'MEAT_KEYWORDS']) {
    assert(
      !new RegExp(`["'\`]${term}`, 'i').test(mealService),
      `meal-service.ts defines no food term of its own ("${term}") — it asks the gate, it does not know`,
    );
  }
  assert(
    mealService.includes('isMealSafeForHousehold'),
    'meal-service.ts reaches safety through the one canonical gate',
  );
}

function sec9_perMember(): void {
  section('9  PATTERNS STAY PER MEMBER');

  // A vegan and an omnivore share a kitchen. The omnivore's starter meals are not
  // vegan-gated; the vegan's are. Restrictions union household-wide; patterns do not.
  const veganRequester = ctxFor('Vegan');
  const omnivoreRequester = ctxFor(null);
  const steak = meal('Steak dinner', ['beef steak', 'potatoes']);

  assert(!safeFor(steak, veganRequester), 'the vegan member is not offered the steak');
  assert(safeFor(steak, omnivoreRequester), 'the omnivore member IS — the household is not made vegan by one member');

  // But a hard restriction held by ANY member binds every member.
  const householdWithNutAllergy = ctxFor(null, ['Nuts']);
  const satay = meal('Chicken satay', ['chicken', 'peanut butter']);
  assert(
    !safeFor(satay, householdWithNutAllergy),
    'a nut allergy anywhere in the household refuses the satay for everyone — restrictions DO union',
  );
}

async function sec10_liveData(): Promise<void> {
  section('10  LIVE DATA — every live household, every starter meal, the real gate');

  // CONV1 P4 (OWN-1): each person's diet lives on their eater row in their active
  // household — users.diet_pattern / diet_restrictions are retired. The sweep reads
  // the canonical owner and derives the pattern exactly as the platform does.
  const userRows = await db
    .select({
      id: users.id,
      defaultDietTypes: householdEaters.defaultDietTypes,
      hardRestrictions: householdEaters.hardRestrictions,
    })
    .from(users)
    .leftJoin(householdMembers, and(
      eq(householdMembers.userId, users.id),
      eq(householdMembers.status, 'active'),
    ))
    .leftJoin(householdEaters, and(
      eq(householdEaters.householdId, householdMembers.householdId),
      eq(householdEaters.userId, users.id),
    ));
  const allUsers = userRows.map((r) => ({
    id: r.id,
    dietPattern: dietPatternFromDietTypes(r.defaultDietTypes ?? []),
    dietRestrictions: r.hardRestrictions ?? [],
  }));
  const systemMeals = await db
    .select()
    .from(meals)
    .where(and(eq(meals.isSystemMeal, true), inArray(meals.categoryId, [1, 2, 3])));

  note(`${allUsers.length} live users, ${systemMeals.length} system starter meals`);

  const vegHouseholds = allUsers.filter((u) =>
    ['vegan', 'vegetarian'].includes((u.dietPattern ?? '').toLowerCase()),
  );
  note(`${vegHouseholds.length} live Vegan/Vegetarian households`);
  assert(vegHouseholds.length > 0, 'there ARE live vegan/vegetarian households — this section is not vacuous');

  let served = 0;
  let prohibited = 0;
  let emptyCategories = 0;

  for (const u of allUsers) {
    const ctx = await resolveHouseholdSafetyContext(u.id);
    const starter = await getStarterMeals(u.id);
    for (const list of [starter.breakfast, starter.lunch, starter.dinner]) {
      if (list.length === 0) emptyCategories++;
      for (const m of list) {
        served++;
        if (!isMealSafeForHousehold({ name: m.name, ingredients: m.ingredients ?? [] }, ctx).safe) {
          prohibited++;
          console.error(`  ✗ user ${u.id} (${u.dietPattern}) was served prohibited meal "${m.name}"`);
        }
      }
    }
  }

  note(`${served} starter meals returned across every live household`);
  assert(prohibited === 0, `NOT ONE prohibited starter meal reaches ANY live household`, `${prohibited} got through`);
  assert(served > 10_000, 'the gate did not pass by emptying the cookbook — it still serves thousands of meals', `only ${served}`);

  // The vegan breakfast slot — the exact slot SURF1B4 named as a live fail-open.
  // The slots-fill assertions below are about a household whose ONLY constraint is
  // the vegan pattern. The eater-row sweep (CONV1 P4) also surfaces vegans who hold
  // hard allergies on top — for them a SHORT list is the correct behaviour (layer 2:
  // fewer, never unsafe) — so pick a vegan household with no hard restrictions.
  let veganUser: { id: number; dietPattern: string | null } | undefined;
  for (const u of vegHouseholds) {
    if ((u.dietPattern ?? '').toLowerCase() !== 'vegan') continue;
    const c = await resolveHouseholdSafetyContext(u.id);
    if (c.status === 'resolved' && c.hardRestrictions.length === 0) { veganUser = u; break; }
  }
  if (veganUser) {
    const ctx = await resolveHouseholdSafetyContext(veganUser.id);
    const breakfasts = systemMeals.filter((m) => m.categoryId === 1);
    const safe = breakfasts.filter((m) => isMealSafeForHousehold({ name: m.name, ingredients: m.ingredients ?? [] }, ctx).safe);
    const labelled = breakfasts.filter((m) => m.dietTypes?.includes('vegan'));
    note(
      `vegan breakfast: ${breakfasts.length} in the cookbook · ${labelled.length} LABELLED vegan · ${safe.length} actually vegan-SAFE`,
    );
    // SURF1B5 asserted `labelled.length < WANTED` here and called it "the backfill still
    // fires today" — 2 labelled vegan breakfasts against 21 slots. That was its own
    // limitation #1, written down as a passing test because it was true.
    //
    // SURF1C1 closed it. The cookbook was never short of vegan food, only of vegan LABELS
    // — and the 500 authored recipes, the only meals with real ingredient lists, carried
    // none at all. Now they carry the ones their ingredients prove, and the slot fills with
    // label-matched food instead of topping up from unlabelled.
    //
    // The assertion is INVERTED rather than deleted, because the number it guards is the
    // whole point of both workstreams: if the labelled pool ever falls back below 21, the
    // label has stopped doing the one job it is allowed to do.
    assert(
      labelled.length >= WANTED,
      `the vegan-labelled breakfast pool now fills all ${WANTED} slots on its own (SURF1C1) — it was 2 before`,
      `only ${labelled.length} labelled`,
    );
    assert(
      safe.length >= WANTED,
      'and the SAFE pool still covers them — the gate, not the label, is what admits a meal',
      `${safe.length} safe`,
    );

    const starter = await getStarterMeals(veganUser.id);
    assert(
      starter.breakfast.length === WANTED,
      `so this live vegan household still receives a full ${WANTED} breakfasts — and every one is safe`,
      `got ${starter.breakfast.length}`,
    );
    assert(
      starter.breakfast.every((m) => isMealSafeForHousehold({ name: m.name, ingredients: m.ingredients ?? [] }, ctx).safe),
      'each of them passes the canonical gate',
    );
  }

  // The meals the old backfill could reach and the gate refuses — the size of the hole.
  if (vegHouseholds.length > 0) {
    const ctx = await resolveHouseholdSafetyContext(vegHouseholds[0].id);
    const refused = systemMeals.filter(
      (m) => !isMealSafeForHousehold({ name: m.name, ingredients: m.ingredients ?? [] }, ctx).safe,
    );
    note(
      `${refused.length} of ${systemMeals.length} system starter meals are refused for household ${vegHouseholds[0].id} ` +
        `(${vegHouseholds[0].dietPattern}) — every one of them was reachable through the old backfill`,
    );
    assert(refused.length > 0, 'the prohibited top-up pool was real, and is now unreachable');
  }

  // Unrestricted control — they must lose nothing.
  const unrestricted = allUsers.filter((u) => !u.dietPattern && !(u.dietRestrictions ?? []).length);
  let full = 0;
  const sample = unrestricted.slice(0, 20);
  for (const u of sample) {
    const s = await getStarterMeals(u.id);
    if (s.breakfast.length + s.lunch.length + s.dinner.length === WANTED * 3) full++;
  }
  assert(
    sample.length > 0 && full === sample.length,
    `all ${sample.length} sampled unrestricted households still receive the full ${WANTED * 3} starter meals`,
    `${full}/${sample.length}`,
  );

  note(`${emptyCategories} empty category/categories across every live household`);

  // Labels, live: no system meal's label may contradict the canonical gate.
  const veganCtx = ctxFor('Vegan');
  const vegetarianCtx = ctxFor('Vegetarian');
  const allSystem = await db.select().from(meals).where(eq(meals.isSystemMeal, true));
  const badVegan = allSystem.filter((m) => m.dietTypes?.includes('vegan') && !safeFor(m as Meal, veganCtx));
  const badVegetarian = allSystem.filter((m) => m.dietTypes?.includes('vegetarian') && !safeFor(m as Meal, vegetarianCtx));
  assert(
    badVegan.length === 0,
    `no vegan-LABELLED system meal contradicts the canonical gate (${allSystem.length} meals checked)`,
    badVegan.slice(0, 3).map((m) => m.name).join(', '),
  );
  assert(
    badVegetarian.length === 0,
    'no vegetarian-LABELLED system meal contradicts the canonical gate',
    badVegetarian.slice(0, 3).map((m) => m.name).join(', '),
  );

  // …and the labeller cannot create one, on the live cookbook's own names/ingredients.
  let relabelContradictions = 0;
  for (const m of allSystem.slice(0, 400)) {
    const labels = detectDietTypes(m.name, m.ingredients ?? []);
    if (labels.includes('vegan') && !safeFor(m as Meal, veganCtx)) relabelContradictions++;
    if (labels.includes('vegetarian') && !safeFor(m as Meal, vegetarianCtx)) relabelContradictions++;
  }
  assert(
    relabelContradictions === 0,
    're-labelling 400 live meals through the new labeller produces ZERO labels the gate would contradict',
    `${relabelContradictions} contradictions`,
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n═══ SURF1B5 — Starter Meal Safety Convergence ═══');

  sec1_backfill();
  sec2_fewerNeverUnsafe();
  sec3_unrestricted();
  sec4_labelIsOrdering();
  await sec5_failClosed();
  sec6_labelPath();
  sec7_positiveControls();
  sec8_oneOwner();
  sec9_perMember();
  await sec10_liveData();

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SURF1B5: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(70));
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error('\nSuite crashed:', err);
  process.exit(1);
});
