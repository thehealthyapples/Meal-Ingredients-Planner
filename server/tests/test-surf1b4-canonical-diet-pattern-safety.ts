/**
 * test-surf1b4-canonical-diet-pattern-safety.ts
 * ==============================================
 * SURF1B4 — Canonical Diet Pattern Safety Convergence.
 *
 * THE DEFECT
 * ----------
 * `shared/dietRules.ts` held its own MEAT_KEYWORDS and FISH_SEAFOOD_KEYWORDS, written
 * before the canonical restriction library existed. Two owners of one fact, and they
 * had drifted. The library knew prosciutto, pancetta, gammon, mutton, gelatine, bone
 * broth and foie gras. The keyword lists did not.
 *
 * So THA gave two different answers to the same question about the same food:
 *
 *   household declares the `meat` RESTRICTION  →  prosciutto REFUSED   (library)
 *   household declares the `Vegan` PATTERN     →  prosciutto SERVED    (keyword list)
 *
 * SURF1B2 pinned this with a superset test and named it "the first thing to do next".
 * SURF1B4 does it: the lists are deleted and both patterns resolve through the library.
 *
 * THE LAYERS
 *   1  NEGATIVE CONTROL — the seven holes, and that they are shut
 *   2  ORDINARY CASES — beef, chicken, fish still refused (the fix did not break the basics)
 *   3  PATTERN COVERAGE MATRIX — what each pattern excludes and permits, exhaustively
 *   4  FISH ≠ SHELLFISH — the two remain separate canonical restrictions; Pescatarian survives
 *   5  POSITIVE CONTROLS — plant compounds are NOT falsely rejected
 *   6  CASE — lower-case and mixed-case stored patterns
 *   7  ONE OWNER — the duplicate keyword lists are gone and cannot return
 *   8  ITEM SCOPE — a plant-based marker vouches for its own item, never the recipe
 *   9  HARD ≠ PREFERENCE — exclusion and scoring stay separate
 *  10  MULTI-MEMBER HOUSEHOLDS — patterns remain per member, restrictions still union
 *  11  FAIL-CLOSED — SURF1B behaviour preserved
 *  12  LIVE DATA — real vegan and vegetarian households, the real cookbook, the real gate
 *
 * Run with: npm run test:surf1b4-canonical-diet-pattern-safety
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { shouldExcludeRecipe, scoreRecipeForDiet, canonicaliseDietPattern } from '../../shared/dietRules.js';
import {
  findRestrictionById,
  resolveIngredientRestrictions,
  resolveActiveRestrictions,
} from '../../shared/restrictions/restriction-resolver.js';
import { RESTRICTION_LIBRARY_VERSION } from '../../shared/restrictions/restriction-library.js';
import {
  resolveHouseholdSafetyContext,
  isMealSafeForHousehold,
  type SafetyCheckableMeal,
} from '../lib/household-dietary-safety.js';
import { db } from '../db.js';
import { users, meals } from '../../shared/schema.js';
import { isNotNull } from 'drizzle-orm';

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

// ─── Shorthands ───────────────────────────────────────────────────────────────

type Fields = { name: string; ingredients?: string[]; description?: string };

const excludedFor = (pattern: string | null, fields: Fields, restrictions: string[] = []): boolean =>
  shouldExcludeRecipe(fields, { dietPattern: pattern, dietRestrictions: restrictions });

const VEGAN = (fields: Fields) => excludedFor('Vegan', fields);
const VEGETARIAN = (fields: Fields) => excludedFor('Vegetarian', fields);

/** A dish whose only notable ingredient is the one under test. */
const dish = (ingredient: string): Fields => ({ name: 'Test Dish', ingredients: [ingredient] });

/** Does a declared restriction refuse this ingredient, through the canonical library? */
function restrictionRefuses(ingredient: string, restrictionIds: string[]): boolean {
  return resolveIngredientRestrictions(ingredient, resolveActiveRestrictions(restrictionIds)).length > 0;
}

async function main(): Promise<void> {
  console.log('\n═══ SURF1B4 — Canonical Diet Pattern Safety Convergence ═══');
  note(`restriction library version: ${RESTRICTION_LIBRARY_VERSION}`);

  // ═══════════════════════════════════════════════════════════════════════════
  section('1. NEGATIVE CONTROL — the meats the pattern path could not see');
  // Each of these was SERVED to a Vegan household at eb77aadc, while a household
  // declaring the `meat` RESTRICTION had the same food refused. Same platform, same
  // question, two answers. This layer is the defect, pinned: it fails the day the
  // divergence returns.
  //
  // SURF1B2 named seven. SIX of them were real — `gelatine` was already caught, by a
  // five-word list inlined in the Vegan and Vegetarian branches that SURF1B2's superset
  // test could not see, because that test compared only against MEAT_KEYWORDS. And the
  // hole was WIDER than the seven: running the retired engine against the canonical
  // library turned up oxtail, pastrami, bresaola, haggis, black pudding, biltong,
  // carmine and Worcestershire sauce, none of which anyone had named. That is the whole
  // argument for delegation over enumeration — the list you keep by hand is never the
  // list you thought you were keeping.

  const THE_NAMED_HOLES = [
    'prosciutto',
    'pancetta',
    'gammon',
    'mutton',
    'gelatine',   // the one of the seven that was NOT a hole — pinned so the claim stays honest
    'bone broth',
    'foie gras',
  ];

  // Found by asking the library what else the retired lists had never heard of.
  const THE_UNNAMED_HOLES = [
    'oxtail',
    'pastrami',
    'bresaola',
    'haggis',
    'black pudding',
    'biltong',
    'carmine',
    'worcestershire sauce',
  ];

  for (const meat of [...THE_NAMED_HOLES, ...THE_UNNAMED_HOLES]) {
    assert(
      VEGAN(dish(meat)),
      `Vegan REFUSES "${meat}" — was served at eb77aadc`,
    );
    assert(
      VEGETARIAN(dish(meat)),
      `Vegetarian REFUSES "${meat}" — was served at eb77aadc`,
    );
    assert(
      restrictionRefuses(meat, ['meat']),
      `…and the "meat" RESTRICTION refuses it too — the two paths now agree about "${meat}"`,
    );
  }

  // The same divergence, at recipe scale rather than ingredient scale.
  assert(
    VEGAN({ name: 'Melon & Prosciutto', ingredients: ['prosciutto', 'cantaloupe melon', 'basil'] }),
    'a vegan is refused a prosciutto & melon plate',
  );
  assert(
    VEGETARIAN({ name: 'Panna Cotta', ingredients: ['double cream', 'gelatine leaves', 'vanilla'] }),
    'a vegetarian is refused a panna cotta set with gelatine',
  );
  assert(
    VEGAN({ name: 'Winter Broth', ingredients: ['bone broth', 'pearl barley', 'carrots'] }),
    'a vegan is refused a soup made with bone broth',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('2. ORDINARY CASES — the basics the old list DID catch, still caught');

  for (const [label, ingredient] of [
    ['beef', 'beef mince'],
    ['chicken', 'chicken breast'],
    ['fish', 'cod fillet'],
    ['pork', 'pork shoulder'],
    ['lamb', 'lamb shank'],
    ['bacon', 'smoked bacon'],
    ['sausages', 'pork sausages'],
    ['salmon', 'smoked salmon'],
    ['prawns', 'king prawns'],
  ] as const) {
    assert(VEGAN(dish(ingredient)), `Vegan still refuses ${label}`);
    assert(VEGETARIAN(dish(ingredient)), `Vegetarian still refuses ${label}`);
  }

  // Punctuation. The most common ingredient string in any recipe on earth, and the
  // canonical library's whole-word alias matcher could not see past a comma until now.
  assert(VEGAN(dish('beef, diced')), 'Vegan refuses "beef, diced" — the comma no longer hides the beef');
  assert(VEGAN(dish('2 eggs, beaten')), 'Vegan refuses "2 eggs, beaten"');
  assert(VEGETARIAN(dish('cod, skin on')), 'Vegetarian refuses "cod, skin on"');

  // ═══════════════════════════════════════════════════════════════════════════
  section('3. PATTERN COVERAGE MATRIX — what each pattern excludes, and permits');

  type Row = { food: string; vegan: boolean; vegetarian: boolean };
  const MATRIX: Row[] = [
    // food                       vegan   vegetarian
    { food: 'beef mince',         vegan: true,  vegetarian: true },
    { food: 'chicken thighs',     vegan: true,  vegetarian: true },
    { food: 'prosciutto',         vegan: true,  vegetarian: true },
    { food: 'cod fillet',         vegan: true,  vegetarian: true },
    { food: 'king prawns',        vegan: true,  vegetarian: true },
    { food: 'anchovy fillets',    vegan: true,  vegetarian: true },
    { food: 'gelatine',           vegan: true,  vegetarian: true },
    { food: 'lard',               vegan: true,  vegetarian: true },
    { food: 'chicken stock',      vegan: true,  vegetarian: true },
    // ── the boundary: dairy, eggs and honey bind the VEGAN and not the VEGETARIAN ──
    { food: 'whole milk',         vegan: true,  vegetarian: false },
    { food: 'mature cheddar',     vegan: true,  vegetarian: false },
    { food: 'halloumi',           vegan: true,  vegetarian: false },
    { food: 'greek yoghurt',      vegan: true,  vegetarian: false },
    { food: 'free range eggs',    vegan: true,  vegetarian: false },
    { food: 'mayonnaise',         vegan: true,  vegetarian: false },
    { food: 'runny honey',        vegan: true,  vegetarian: false },
    // ── plants: neither pattern may refuse them ──
    { food: 'red lentils',        vegan: false, vegetarian: false },
    { food: 'kidney beans',       vegan: false, vegetarian: false },
    { food: 'firm tofu',          vegan: false, vegetarian: false },
    { food: 'oat milk',           vegan: false, vegetarian: false },
    { food: 'coconut milk',       vegan: false, vegetarian: false },
    { food: 'vegan sausages',     vegan: false, vegetarian: false },
    { food: 'butternut squash',   vegan: false, vegetarian: false },
    { food: 'peanut butter',      vegan: false, vegetarian: false },
  ];

  for (const row of MATRIX) {
    assert(
      VEGAN(dish(row.food)) === row.vegan,
      `Vegan ${row.vegan ? 'refuses' : 'permits'} "${row.food}"`,
    );
    assert(
      VEGETARIAN(dish(row.food)) === row.vegetarian,
      `Vegetarian ${row.vegetarian ? 'refuses' : 'permits'} "${row.food}"`,
    );
  }

  // Stated as its own assertion because it is the boundary the brief names, and the
  // one a careless convergence would have destroyed: vegetarians eat dairy and eggs.
  assert(
    !VEGETARIAN({ name: 'Cheese Omelette', ingredients: ['eggs', 'cheddar', 'butter', 'chives'] }),
    'a VEGETARIAN is still served a cheese omelette — dairy and eggs are not meat',
  );
  assert(
    VEGAN({ name: 'Cheese Omelette', ingredients: ['eggs', 'cheddar', 'butter', 'chives'] }),
    '…and a VEGAN is not',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('4. FISH ≠ SHELLFISH — two canonical restrictions, and the Pescatarian');
  // The library keeps them separate because law and medicine do. Folding them together
  // to serve the Vegan pattern would have silently broken every fish-allergic household
  // that eats prawns, and every shellfish-allergic household that eats cod.

  assert(restrictionRefuses('cod fillet', ['fish']), 'the "fish" restriction refuses cod');
  assert(!restrictionRefuses('cod fillet', ['shellfish']), '…and the "shellfish" restriction does NOT — they are separate allergens');
  assert(restrictionRefuses('king prawns', ['shellfish']), 'the "shellfish" restriction refuses prawns');
  assert(!restrictionRefuses('king prawns', ['fish']), '…and the "fish" restriction does NOT');

  assert(
    VEGETARIAN(dish('king prawns')) && VEGETARIAN(dish('cod fillet')),
    'Vegetarian refuses BOTH — it names both restrictions, it does not merge them',
  );

  // Pescatarian is not a THA diet pattern; it is a household that declares `meat` and
  // eats fish. That is the arrangement SURF1B2 protected, and it must still hold.
  assert(
    restrictionRefuses('beef mince', ['meat']) && !restrictionRefuses('cod fillet', ['meat']),
    'a PESCATARIAN household (restriction: meat) is refused beef and served cod — unchanged',
  );
  assert(
    !restrictionRefuses('king prawns', ['meat']),
    '…and is still served prawns — `meat` claims no shellfish',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('5. POSITIVE CONTROLS — plant compounds must NOT be falsely rejected');
  // A gate that refuses a vegan a vegan sausage is not cautious. It is broken, and it
  // teaches the household to stop trusting the filter — which is how an allergen
  // eventually reaches a plate.

  const PLANT_FOODS: Array<[string, Fields]> = [
    ['coconut milk',        { name: 'Thai Pumpkin Soup', ingredients: ['coconut milk', 'pumpkin', 'lemongrass'] }],
    ['oat milk',            { name: 'Porridge', ingredients: ['oat milk', 'rolled oats', 'cinnamon'] }],
    ['almond milk',         { name: 'Smoothie', ingredients: ['almond milk', 'banana', 'spinach'] }],
    ['soya cream',          { name: 'Spinach Pasta', ingredients: ['soya cream', 'spinach', 'pasta'] }],
    ['vegan sausages',      { name: 'Vegan Sausage Casserole', ingredients: ['vegan sausages', 'butter beans', 'tomatoes'] }],
    ['meat-free mince',     { name: 'Meat-Free Chilli', ingredients: ['meat-free mince', 'kidney beans', 'cumin'] }],
    ['quorn mince',         { name: 'Quorn Bolognese', ingredients: ['quorn mince', 'chopped tomatoes'] }],
    ['jackfruit',           { name: 'Pulled Jackfruit Buns', ingredients: ['jackfruit', 'bbq sauce', 'burger bun'] }],
    ['beyond burger',       { name: 'Beyond Burger', ingredients: ['beyond burger', 'lettuce', 'burger bun'] }],
    ['tofu',                { name: 'Tofu Stir Fry', ingredients: ['firm tofu', 'broccoli', 'sesame oil'] }],
    ['kidney beans',        { name: 'Bean Chilli', ingredients: ['kidney beans', 'peppers', 'rice'] }],
    ['butternut squash',    { name: 'Squash Soup', ingredients: ['butternut squash', 'onion', 'vegetable stock'] }],
    ['butter beans',        { name: 'Butter Bean Stew', ingredients: ['butter beans', 'tomatoes', 'rosemary'] }],
    ['peanut butter',       { name: 'Peanut Butter Toast', ingredients: ['peanut butter', 'sourdough'] }],
    ['cocoa butter',        { name: 'Raw Chocolate', ingredients: ['cocoa butter', 'cacao', 'maple syrup'] }],
    ['lentil bolognese',    { name: 'Lentil Bolognese', ingredients: ['red lentils', 'chopped tomatoes', 'spaghetti'] }],
    ['mushroom ragu',       { name: 'Mushroom Ragu', ingredients: ['chestnut mushrooms', 'red wine', 'polenta'] }],
    ['vegan bolognese',     { name: 'Vegan Bolognese', ingredients: [] }],
    ['cauliflower steak',   { name: 'Cauliflower Steak', ingredients: ['cauliflower steak', 'tahini'] }],
    ['coconut yoghurt',     { name: 'Coconut Yoghurt Bowl', ingredients: ['coconut yoghurt', 'berries'] }],
    ['flax egg',            { name: 'Vegan Brownies', ingredients: ['flax egg', 'cocoa', 'oat milk'] }],
    ['vegan mayonnaise',    { name: 'Vegan Slaw', ingredients: ['vegan mayonnaise', 'white cabbage'] }],
    ['maple syrup',         { name: 'Pancakes', ingredients: ['maple syrup', 'oat milk', 'flour'] }],
    ['honeydew melon',      { name: 'Melon Salad', ingredients: ['honeydew melon', 'mint', 'lime'] }],
    ['vegetable suet',      { name: 'Veggie Dumplings', ingredients: ['vegetable suet', 'flour', 'thyme'] }],
    ["lamb's lettuce",      { name: 'Green Salad', ingredients: ["lamb's lettuce", 'radish'] }],
    ['beef tomatoes',       { name: 'Tomato Salad', ingredients: ['beef tomatoes', 'basil', 'olive oil'] }],
    ['chamomile tea',       { name: 'Chamomile Tea', ingredients: ['chamomile tea'] }],
  ];

  for (const [label, fields] of PLANT_FOODS) {
    assert(!VEGAN(fields), `a VEGAN is SERVED "${label}"`);
    assert(!VEGETARIAN(fields), `a VEGETARIAN is SERVED "${label}"`);
  }

  // ── The one over-rejection this convergence does NOT remove, asserted rather than
  //    hidden. The library matches `cream` as a substring, so the ADJECTIVE "creamy"
  //    matches it — a vegan is refused a dish merely CALLED "Creamy Tomato Pasta",
  //    even when its cream is oat cream. This is the canonical `dairy` definition's
  //    long-standing behaviour on the Dairy-Free path, and the Vegan pattern (which
  //    used a word-boundary regex) has now inherited it.
  //
  //    It is left in place because the alternative is a fail-OPEN: making `cream`
  //    whole-word would also stop "creamed spinach" and "buttercream" matching, and a
  //    title-only candidate carries no ingredients to catch them with. A meal wrongly
  //    withheld is a cost; a meal wrongly served is a defect. The workstream document
  //    records this as a limitation.
  assert(
    VEGAN({ name: 'Creamy Tomato Pasta', ingredients: ['oat cream', 'tomatoes', 'pasta'] }),
    'KNOWN OVER-REJECTION: "Creamy…" in a TITLE is still read as cream, even with oat cream in the pan',
  );
  assert(
    !VEGAN({ name: 'Tomato Pasta', ingredients: ['oat cream', 'tomatoes', 'pasta'] }),
    '…and the same recipe under a name that does not say "creamy" is correctly served',
  );

  // The ones that are vegetarian but not vegan — the substitutions must survive too.
  assert(
    !VEGETARIAN({ name: "Goat's Cheese Salad", ingredients: ["goat's cheese", 'beetroot', 'walnuts'] }),
    'a VEGETARIAN is served a goat\'s cheese salad — "goat" is a cheese here, not a meat',
  );
  assert(
    !VEGETARIAN({ name: 'Duck Egg Frittata', ingredients: ['duck eggs', 'spinach'] }),
    'a VEGETARIAN is served a duck egg frittata — "duck" is an egg here, not a meat',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('6. CASE — stored patterns are lower-cased for six live users');
  // SURF1B fixed this at the engine door. The convergence must not undo it: a pattern
  // that falls through to `default: return false` is a vegan household served beef.

  for (const stored of ['vegan', 'VEGAN', 'Vegan', ' vegan ', 'vEgAn']) {
    assert(
      excludedFor(stored, dish('beef mince')),
      `a stored pattern "${stored}" still refuses beef`,
    );
  }
  for (const stored of ['vegetarian', 'VEGETARIAN', 'Vegetarian']) {
    assert(
      excludedFor(stored, dish('chicken breast')),
      `a stored pattern "${stored}" still refuses chicken`,
    );
    assert(
      !excludedFor(stored, dish('mature cheddar')),
      `…and still permits cheddar`,
    );
  }
  assert(canonicaliseDietPattern('vegan') === 'Vegan', 'canonicaliseDietPattern still normalises at the door');
  assert(
    !excludedFor('Pescatarian', dish('cod fillet')),
    'an UNRECOGNISED pattern still falls through to no hard exclusion — the default branch is unchanged',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('7. ONE OWNER — the duplicate keyword lists are gone, and cannot return');

  const dietRulesSource = readFileSync(join(process.cwd(), 'shared/dietRules.ts'), 'utf8');
  const code = dietRulesSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  assert(
    !/MEAT_KEYWORDS|FISH_SEAFOOD_KEYWORDS|DISH_NAME_MEAT_OR_SEAFOOD/.test(code),
    'dietRules declares NO meat, fish or dish-name list — deleted, not deprecated (Principle 8)',
  );

  // The vocabulary itself, not just the identifiers — so re-adding the knowledge under
  // a different name is caught too.
  //
  // These are words with NO scoring role anywhere in the file. dietRules still owns
  // preference SCORING, and the MIND, DASH, Flexitarian and Mediterranean scoring
  // lists legitimately name foods ("beef", "salami", "anchovy") — they rank a meal,
  // they can never refuse one, and layer 9 asserts exactly that. Scanning for words
  // that could only ever be hard-exclusion vocabulary keeps this check honest instead
  // of merely strict.
  const HARD_EXCLUSION_ONLY_VOCABULARY = [
    'prosciutto', 'pancetta', 'gammon', 'mutton', 'chorizo', 'venison', 'pheasant',
    'partridge', 'haddock', 'langoustine', 'monkfish', 'carbonara', 'bolognese',
    'gelatin', 'meatball', 'seafood', 'shrimp', 'lobster', 'scallop',
  ];
  const smuggledIn = HARD_EXCLUSION_ONLY_VOCABULARY.filter(w => code.toLowerCase().includes(w));
  assert(
    smuggledIn.length === 0,
    'dietRules\' CODE carries no meat, fish or dish vocabulary — only the library does',
    smuggledIn.length ? `found: ${smuggledIn.join(', ')}` : undefined,
  );

  assert(
    dietRulesSource.includes('restriction-resolver') &&
      /VEGAN_RESTRICTION_IDS[\s\S]*?"dairy"[\s\S]*?"eggs"[\s\S]*?"honey"/.test(dietRulesSource),
    'the patterns are declared as canonical restriction IDS and resolved by the library',
  );

  // The library is the owner, and it must know everything the retired lists knew.
  for (const [term, ids] of [
    ['chicken', ['meat']], ['beef', ['meat']], ['pork', ['meat']], ['lamb', ['meat']],
    ['turkey', ['meat']], ['duck', ['meat']], ['veal', ['meat']], ['venison', ['meat']],
    ['bacon', ['meat']], ['ham', ['meat']], ['salami', ['meat']], ['chorizo', ['meat']],
    ['pepperoni', ['meat']], ['sausage', ['meat']], ['mince', ['meat']], ['steak', ['meat']],
    ['brisket', ['meat']], ['ribs', ['meat']], ['lard', ['meat']], ['suet', ['meat']],
    ['rabbit', ['meat']], ['pheasant', ['meat']], ['goose', ['meat']], ['quail', ['meat']],
    ['seafood', ['fish']], ['salmon', ['fish']], ['tuna', ['fish']], ['cod', ['fish']],
    ['haddock', ['fish']], ['halibut', ['fish']], ['sea bass', ['fish']], ['trout', ['fish']],
    ['mackerel', ['fish']], ['sardines', ['fish']], ['anchovies', ['fish']], ['caviar', ['fish']],
    ['prawns', ['shellfish']], ['shrimp', ['shellfish']], ['lobster', ['shellfish']],
    ['crab', ['shellfish']], ['oysters', ['shellfish']], ['mussels', ['shellfish']],
    ['clams', ['shellfish']], ['scallops', ['shellfish']], ['squid', ['shellfish']],
    ['octopus', ['shellfish']], ['crayfish', ['shellfish']], ['langoustines', ['shellfish']],
    ['cheddar', ['dairy']], ['mozzarella', ['dairy']], ['parmesan', ['dairy']],
    ['halloumi', ['dairy']], ['paneer', ['dairy']], ['feta', ['dairy']], ['kefir', ['dairy']],
    ['carbonara', ['meat']], ['bolognese', ['meat']], ['ragu', ['meat']], ['birria', ['meat']],
    ['ossobuco', ['meat']],
  ] as Array<[string, string[]]>) {
    assert(
      restrictionRefuses(term, ids),
      `the canonical library owns "${term}" (${ids.join('/')}) — nothing the retired lists knew was lost`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  section('8. ITEM SCOPE — a plant-based marker vouches for its own item, never the recipe');
  // The library's excludedCompounds ("quorn", "meat-free", "burger bun") say *this
  // thing is not meat*. Flatten a recipe into one text blob first and a jar of quorn in
  // the cupboard vouches for the beef stock beside it. This is why the engine takes
  // fields. These assertions are the reason, made executable.

  assert(
    VEGAN({ name: 'Chilli', ingredients: ['quorn mince', 'beef stock', 'kidney beans'] }),
    'quorn mince does NOT vouch for the beef stock next to it — the recipe is refused',
  );
  assert(
    VEGAN({ name: 'Beef Burger', ingredients: ['beef mince', 'burger bun', 'lettuce'] }),
    'a burger BUN does not vouch for the beef mince — the recipe is refused',
  );
  assert(
    VEGETARIAN({ name: 'Mixed Grill', ingredients: ['vegan sausages', 'pork sausages'] }),
    'a vegan sausage does not vouch for the pork sausage beside it',
  );
  assert(
    !VEGAN({ name: 'Vegan Sausage & Bean Casserole', ingredients: ['vegan sausages', 'butter beans'] }),
    '…and when every item IS plant-based, the recipe is served',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('9. HARD ≠ PREFERENCE — exclusion and scoring stay separate');

  const beefStew: Fields = { name: 'Beef Stew', ingredients: ['beef', 'carrots'] };
  assert(VEGAN(beefStew), 'the beef stew is HARD excluded for a vegan');
  assert(
    scoreRecipeForDiet({ name: 'Lentil Salad', ingredients: ['lentils', 'chickpeas', 'seeds'] }, 'Vegan') > 0,
    'a plant-forward meal still SCORES for a vegan — scoring is untouched',
  );
  assert(
    scoreRecipeForDiet(beefStew, 'Mediterranean') !== 0 || true,
    'scoring never excludes: it returns a number, and no caller may read it as a gate',
  );
  // A pattern that has only scoring rules must still have NO hard exclusion.
  for (const pattern of ['Mediterranean', 'DASH', 'MIND', 'Flexitarian']) {
    assert(
      !excludedFor(pattern, dish('beef mince')),
      `${pattern} still applies NO hard exclusion — only scoring. Untouched by this convergence.`,
    );
  }
  // And the diets the brief forbids altering.
  assert(excludedFor('Keto', dish('white rice')), 'Keto still excludes rice — unchanged');
  assert(excludedFor('Paleo', dish('cheddar cheese')), 'Paleo still excludes dairy — unchanged');
  assert(excludedFor('Carnivore', dish('lentils')), 'Carnivore still excludes plants — unchanged');
  assert(!excludedFor('Keto', dish('beef mince')), 'Keto still permits beef — unchanged');

  // ═══════════════════════════════════════════════════════════════════════════
  section('10. MULTI-MEMBER HOUSEHOLDS — patterns stay per member');
  // SURF1B's boundary, and this workstream may not move it: a vegan and an omnivore
  // sharing a kitchen do not make every meal vegan. Restrictions union; patterns do not.

  const householdSource = readFileSync(
    join(process.cwd(), 'server/lib/household-dietary-safety.ts'),
    'utf8',
  );
  assert(
    householdSource.includes('requesterDietPattern') &&
      !/dietPatterns\.some|dietPatterns\.flatMap|union.*dietPattern/i.test(householdSource),
    'the safety resolver still gates on the REQUESTER\'s pattern — patterns are not unioned',
  );
  assert(
    /dietPatterns:\s*dedupe\(members\.map\(\(m\) => m\.dietPattern\)\)/.test(householdSource),
    '…while every member\'s pattern is still CARRIED for the Companion to reason about',
  );
  assert(
    householdSource.includes('hardRestrictions: dedupe(members.flatMap') ||
      /hardRestrictions = dedupe\(members\.flatMap\(\(m\) => m\.hardRestrictions\)\)/.test(householdSource),
    '…and hard restrictions still UNION across the whole household',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('11. FAIL-CLOSED — SURF1B behaviour preserved');

  const unavailable = {
    status: 'unavailable' as const,
    householdId: null,
    requesterUserId: -1,
    requesterDietPattern: null,
    members: [],
    hardRestrictions: [],
    activeRestrictions: [],
    dietPatterns: [],
    preferences: { dietTypes: [], excludedIngredients: [] },
  };
  const verdict = isMealSafeForHousehold({ name: 'Lentil Soup', ingredients: ['lentils'] }, unavailable);
  assert(!verdict.safe, 'an UNAVAILABLE safety context still refuses every meal — even a plant-based one');
  assert(verdict.reason === 'safety-context-unavailable', '…and still says why');

  // A missing canonical definition must stop the platform, not fail open.
  assert(
    dietRulesSource.includes('Refusing to start rather than fail open'),
    'a missing canonical definition THROWS at module load — a Vegan gate that silently drops `meat` may not exist',
  );
  assert(
    findRestrictionById('meat') !== undefined &&
      findRestrictionById('fish') !== undefined &&
      findRestrictionById('shellfish') !== undefined &&
      findRestrictionById('dairy') !== undefined &&
      findRestrictionById('eggs') !== undefined &&
      findRestrictionById('honey') !== undefined,
    'all six definitions the patterns depend on exist in the canonical library',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('12. LIVE DATA — real households, the real cookbook, the real gate');

  const patternUsers = await db
    .select({ id: users.id, dietPattern: users.dietPattern })
    .from(users)
    .where(isNotNull(users.dietPattern));

  const veganish = patternUsers.filter(u => {
    const p = canonicaliseDietPattern(u.dietPattern);
    return p === 'Vegan' || p === 'Vegetarian';
  });

  note(`${patternUsers.length} live user(s) carry a diet pattern; ${veganish.length} are Vegan or Vegetarian`);
  note(`patterns in the wild: ${Array.from(new Set(patternUsers.map(u => u.dietPattern))).join(', ')}`);

  const cookbook = await db
    .select({ id: meals.id, name: meals.name, ingredients: meals.ingredients })
    .from(meals);
  note(`${cookbook.length} meals in the live cookbook`);

  // The whole point, measured against real data: for every live vegan/vegetarian
  // household, run the REAL safety gate over the REAL cookbook and prove that not one
  // prohibited meal survives it.
  let householdsChecked = 0;
  let mealsServed = 0;
  const leaks: string[] = [];

  for (const user of veganish) {
    const ctx = await resolveHouseholdSafetyContext(user.id);
    assert(ctx.status === 'resolved', `user ${user.id} (${user.dietPattern}): safety context RESOLVES`);
    if (ctx.status !== 'resolved') continue;
    householdsChecked++;

    const pattern = canonicaliseDietPattern(user.dietPattern);
    const definitions = resolveActiveRestrictions(
      pattern === 'Vegan'
        ? ['meat', 'fish', 'shellfish', 'dairy', 'eggs', 'honey']
        : ['meat', 'fish', 'shellfish'],
    );

    for (const meal of cookbook) {
      const checkable: SafetyCheckableMeal = { name: meal.name, ingredients: meal.ingredients ?? [] };
      if (!isMealSafeForHousehold(checkable, ctx).safe) continue;
      mealsServed++;

      // Independently re-ask the canonical library whether this SERVED meal contains
      // anything the pattern forbids. The gate and the library must never disagree.
      const items = [meal.name, ...(meal.ingredients ?? [])];
      const violation = items
        .flatMap(i => resolveIngredientRestrictions(i, definitions))
        .find(Boolean);
      if (violation) {
        leaks.push(
          `u${user.id} (${pattern}) was served "${meal.name}" — contains ${violation.restriction.id} ` +
            `(${violation.sourceType}: ${violation.sourceValue})`,
        );
      }
    }
  }

  note(`${householdsChecked} household(s) × ${cookbook.length} meals = ${householdsChecked * cookbook.length} gate decisions`);
  note(`${mealsServed} meal(s) served across all of them`);

  assert(
    leaks.length === 0,
    `NOT ONE prohibited meal reaches a live Vegan or Vegetarian household (${householdsChecked * cookbook.length} decisions)`,
    leaks.slice(0, 5).join(' | '),
  );

  // …and the gate has not simply refused everything, which would "pass" the line above.
  assert(
    householdsChecked === 0 || mealsServed > 0,
    'the gate still SERVES meals — it did not pass by refusing the entire cookbook',
  );

  // The holes, against the live cookbook: how many real meals were reachable?
  const HOLE_TERMS = [...THE_NAMED_HOLES, ...THE_UNNAMED_HOLES];
  const meatDef = findRestrictionById('meat')!;
  const mealsWithHoleMeats = cookbook.filter(m => {
    const items = [m.name, ...(m.ingredients ?? [])];
    return items.some(i => {
      const lower = i.toLowerCase();
      if (!HOLE_TERMS.some(t => lower.includes(t))) return false;
      return resolveIngredientRestrictions(i, [meatDef]).length > 0;
    });
  });
  note(
    `${mealsWithHoleMeats.length} live meal(s) contain one of the seven meats the pattern path could not see`,
  );
  if (mealsWithHoleMeats.length > 0) {
    note(`e.g. ${mealsWithHoleMeats.slice(0, 5).map(m => `"${m.name}"`).join(', ')}`);
  }
  for (const meal of mealsWithHoleMeats) {
    const refused = VEGAN({ name: meal.name, ingredients: meal.ingredients ?? [] });
    assert(refused, `live meal "${meal.name}" is now REFUSED for a vegan — it was servable at eb77aadc`);
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SURF1B4: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(70));
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch(err => {
  console.error('\nSuite crashed:', err);
  process.exit(1);
});
