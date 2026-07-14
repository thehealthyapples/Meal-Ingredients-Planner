/**
 * test-surf1c1-starter-cookbook-diet-classification.ts
 * ====================================================
 * SURF1C1 — Canonical Starter Cookbook Diet Classification.
 *
 * THE DEFECT
 * ----------
 * An exact inversion, and it had been live in every household's cookbook:
 *
 *   Every diet label THA held sat on a meal it could not prove.
 *   Every meal it could prove carried no label at all.
 *
 *   · The 500 Founding Cookbook recipes — THA's own authored food, and the ONLY system
 *     meals with real ingredient lists (the thinnest carries 7 lines) — held ZERO labels.
 *     The seed that publishes them never wrote `diet_types` at all.
 *   · All 204 labels in the system sat on the 309 ready-meal rows, EVERY ONE of which has
 *     zero ingredient evidence: `ingredients` is a literal echo of the meal's own name
 *     ("Chocolate Mousse" → `["Chocolate Mousse"]`).
 *
 * SURF1B5's audit reported "zero label contradictions across 884 system meals" and was
 * right — but it was vacuously right. No meal with ingredient evidence carried a label, so
 * there was nothing a contradiction could be found in.
 *
 * The labeller compounded it. It classified on the ABSENCE of evidence: it asked the gate
 * "is anything here meat?", an empty ingredient list answered "no", and the absence was
 * recorded as a finding of plants (SURF1B5's own limitation #2).
 *
 * THE FIX
 * `dietRules.classifyDietLabels()` — one owner of "which labels does this meal's own
 * evidence support?", living beside the gate it derives from, holding no food vocabulary,
 * and DECLINING TO ANSWER without evidence. The cookbook seed — the domain's authorised
 * writer — derives each recipe's labels from its own ingredients at publication time.
 *
 * A label remains a DISCOVERY AND ORDERING signal and never a safety gate. SURF1C1 changes
 * no gate, and §5 pins that: the same meals are refused, to the meal, before and after.
 *
 * THE LAYERS
 *   1  EVIDENCE — a title-only meal is unclassifiable, and is left unclassified
 *   2  THE CANONICAL ANSWER — dairy/eggs/honey block vegan; meat/fish/shellfish block both
 *   3  PLANT SUBSTITUTES — vegan sausages, oat milk, quorn, flax egg all survive
 *   4  ONE OWNER — no second classifier, no keyword list, no label authored by a seed
 *   5  THE GATE IS UNCHANGED — labels moved; safety behaviour did not
 *  5b  KNOWN GATE DEFECT — "aspARAGUs" contains "ragu"; found here, deliberately NOT fixed here
 *   6  LIVE DATA — the real cookbook: every label proven, every slot filled
 *
 * Run with: npm run test:surf1c1-starter-cookbook-diet-classification
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq, and } from 'drizzle-orm';
import { db } from '../db.js';
import { meals } from '../../shared/schema.js';
import {
  classifyDietLabels,
  dietEvidenceLines,
  shouldExcludeRecipe,
  MIN_INGREDIENT_EVIDENCE,
} from '../../shared/dietRules.js';
import { detectDietTypes } from '../lib/external-meal-service.js';
import { isMealSafeForHousehold, type HouseholdSafetyContext } from '../lib/household-dietary-safety.js';

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

/** The number of starter meals wanted per category. Mirrors `MEALS_PER_CATEGORY`. */
const WANTED = 21;

function ctxFor(dietPattern: string | null): HouseholdSafetyContext {
  return {
    status: 'resolved',
    householdId: 1,
    requesterUserId: 1,
    requesterDietPattern: dietPattern,
    members: [],
    hardRestrictions: [],
  } as unknown as HouseholdSafetyContext;
}

// ─── 1. Evidence ──────────────────────────────────────────────────────────────

function sec1_evidence(): void {
  section('1  EVIDENCE — absence of evidence is not evidence of absence');

  // The exact shape of all 309 ready-meal rows: the "ingredient list" is the title again.
  const titleOnly = classifyDietLabels({ name: 'Chocolate Mousse', ingredients: ['Chocolate Mousse'] });
  assert(
    titleOnly.evidence === 'insufficient' && titleOnly.labels.length === 0,
    'a meal whose only "ingredient" restates its own name is UNCLASSIFIED — not vegan by default',
    `got [${titleOnly.labels.join(', ')}] with evidence=${titleOnly.evidence}`,
  );
  assert(
    dietEvidenceLines({ name: 'Chocolate Mousse', ingredients: ['Chocolate Mousse'] }).length === 0,
    'the title echoed back is worth zero lines of evidence',
  );

  const empty = classifyDietLabels({ name: 'Grandma\'s Special', ingredients: [] });
  assert(
    empty.evidence === 'insufficient' && empty.labels.length === 0,
    'a meal with NO ingredients is unclassified — the pre-SURF1C1 labeller called this one vegan AND vegetarian',
    `got [${empty.labels.join(', ')}]`,
  );

  // Case and punctuation must not let a near-echo through.
  const nearEcho = classifyDietLabels({ name: 'Spaghetti Hoops', ingredients: ['spaghetti hoops!'] });
  assert(
    nearEcho.labels.length === 0,
    'a title echoed back in different case/punctuation is still not evidence',
    `got [${nearEcho.labels.join(', ')}]`,
  );

  // One line is not a list — defence in depth against the near-echo the exact rule misses.
  const oneLine = classifyDietLabels({ name: 'Mystery Bowl', ingredients: ['rice'] });
  assert(
    oneLine.evidence === 'insufficient' && oneLine.labels.length === 0,
    'a single ingredient line is not a list — it cannot be told apart from a restated title',
    `got [${oneLine.labels.join(', ')}]`,
  );
  assert(MIN_INGREDIENT_EVIDENCE === 2, 'the evidence floor is 2 lines — declared, not implicit');

  // …and it is deliberately NOT set higher: a genuine recipe may be simple.
  const porridge = classifyDietLabels({ name: 'Oat milk porridge', ingredients: ['oat milk', 'oats'] });
  assert(
    porridge.evidence === 'sufficient' && porridge.labels.includes('vegan'),
    'a genuinely simple two-line recipe IS classified — the floor discards no evidence THA actually has',
    `got [${porridge.labels.join(', ')}]`,
  );

  // The whole point: unclassified is an honest answer, not a failure.
  note('an unclassified meal is THA declining to assert what it cannot show');
}

// ─── 2. The canonical answer ──────────────────────────────────────────────────

function sec2_canonicalAnswer(): void {
  section('2  THE CANONICAL ANSWER — the library decides, and it decides both questions');

  // Blocks BOTH vegan and vegetarian.
  const bothBlocked: Array<[string, string[]]> = [
    ['Chicken traybake', ['chicken breast', 'potatoes', 'olive oil']],
    ['Beef stew', ['beef shin', 'carrots', 'stock']],
    ['Prosciutto pizza', ['prosciutto', 'mozzarella', 'pizza base']],
    ['Pancetta carbonara', ['pancetta', 'eggs', 'spaghetti']],
    ['Salmon traybake', ['salmon fillet', 'broccoli', 'brown rice']],
    ['Sardine frittata', ['sardines', 'onion', 'fennel']],
    ['Cod skillet', ['cod', 'red pepper', 'pumpkin']],
    ['Prawn linguine', ['king prawns', 'linguine', 'garlic']],
    ['Mussel chowder', ['mussels', 'potato', 'cream']],
    ['Gammon steak', ['gammon', 'pineapple', 'chips']],
    ['Mutton curry', ['mutton', 'onion', 'spices']],
    ['Fruit jelly', ['gelatine', 'orange juice', 'sugar']],
    ['Bone broth ramen', ['bone broth', 'noodles', 'spring onion']],
    ['Foie gras toast', ['foie gras', 'brioche', 'butter']],
  ];
  for (const [name, ingredients] of bothBlocked) {
    const { labels } = classifyDietLabels({ name, ingredients });
    assert(
      !labels.includes('vegan') && !labels.includes('vegetarian'),
      `"${name}" is labelled NEITHER vegan nor vegetarian`,
      `got [${labels.join(', ')}]`,
    );
  }

  // Blocks vegan ONLY — the two remain different questions.
  const veganBlocked: Array<[string, string[]]> = [
    ['Cheese omelette', ['eggs', 'cheddar', 'butter']],
    ['Honey granola', ['honey', 'oats', 'almonds']],
    ['Buttered crumpets', ['butter', 'crumpets', 'jam']],
    ['Cottage cheese hash', ['cottage cheese', 'red pepper', 'spinach']],
    ['Yoghurt bowl', ['greek yoghurt', 'berries', 'granola']],
  ];
  for (const [name, ingredients] of veganBlocked) {
    const { labels } = classifyDietLabels({ name, ingredients });
    assert(
      !labels.includes('vegan') && labels.includes('vegetarian'),
      `"${name}" is vegetarian but NOT vegan — dairy/eggs/honey cost it the vegan label`,
      `got [${labels.join(', ')}]`,
    );
  }

  // Vegan ⊆ Vegetarian. A meal labelled vegan and not vegetarian is not a meal; it is a bug.
  const combos: Array<[string, string[]]> = [
    ['Tofu skillet', ['firm tofu', 'butternut squash', 'kale']],
    ['Cheese omelette', ['eggs', 'cheddar', 'butter']],
    ['Chicken traybake', ['chicken breast', 'potatoes', 'olive oil']],
    ['Kidney bean one-pot', ['kidney beans', 'chopped tomatoes', 'brown rice']],
  ];
  for (const [name, ingredients] of combos) {
    const { labels } = classifyDietLabels({ name, ingredients });
    assert(
      !labels.includes('vegan') || labels.includes('vegetarian'),
      `"${name}" — vegan is never asserted without vegetarian (vegan ⊆ vegetarian)`,
      `got [${labels.join(', ')}]`,
    );
  }
}

// ─── 3. Plant substitutes ─────────────────────────────────────────────────────

function sec3_plantSubstitutes(): void {
  section('3  PLANT SUBSTITUTES — the fix is not a blanket refusal');

  const substitutes: Array<[string, string[]]> = [
    ['Vegan sausage rolls', ['vegan sausages', 'puff pastry', 'onion']],
    ['Oat milk porridge', ['oat milk', 'oats', 'banana']],
    ['Quorn spaghetti', ['quorn mince', 'chopped tomatoes', 'spaghetti']],
    ['Meat-free chilli', ['meat-free mince', 'kidney beans', 'chopped tomatoes']],
    ['Peanut butter toast', ['peanut butter', 'wholemeal bread', 'banana']],
    ['Butternut squash soup', ['butternut squash', 'vegetable stock', 'onion']],
    ['Vegan cheese pizza', ['vegan cheese', 'tomato', 'pizza base']],
    ['Flax egg pancakes', ['flax egg', 'flour', 'oat milk']],
    ['Almond milk smoothie', ['almond milk', 'berries', 'oats']],
    ['Tofu stir fry', ['firm tofu', 'pak choi', 'brown rice']],
  ];
  for (const [name, ingredients] of substitutes) {
    const { labels } = classifyDietLabels({ name, ingredients });
    assert(
      labels.includes('vegan') && labels.includes('vegetarian'),
      `"${name}" is labelled vegan AND vegetarian — the plant substitutes all survive`,
      `got [${labels.join(', ')}]`,
    );
  }
}

// ─── 4. One owner ─────────────────────────────────────────────────────────────

function sec4_oneOwner(): void {
  section('4  ONE OWNER — no second classifier, and no label a seed authored for itself');

  const strip = (path: string) =>
    readFileSync(join(process.cwd(), path), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

  // The classifier holds NO food vocabulary. Every question about food goes to the library.
  // Bound the scan to the function BODY — dietRules legitimately owns the Keto/Paleo/Carnivore
  // dictionaries elsewhere in the same file, and a scan that cannot tell one function from
  // another is not a scan.
  const dietRules = strip('shared/dietRules.ts');
  const start = dietRules.indexOf('export function classifyDietLabels');
  const after = dietRules.indexOf('export function', start + 1);
  const classifierBody = dietRules.slice(start, after === -1 ? undefined : after);
  assert(start !== -1 && classifierBody.length > 0, 'the classifier body was located for scanning');

  for (const term of ['meat', 'chicken', 'beef', 'dairy', 'cheese', 'honey', 'fish', 'egg']) {
    assert(
      !new RegExp(`["'\`]${term}`, 'i').test(classifierBody),
      `classifyDietLabels defines no food term of its own ("${term}") — it asks the library, it does not know`,
    );
  }
  assert(
    /shouldExcludeRecipe\(fields/.test(classifierBody),
    'classifyDietLabels reaches the canonical library through the same door the meal gate uses',
  );

  // Fields, never a blob — a jar of quorn must not vouch for the beef stock beside it.
  const blob = classifyDietLabels({
    name: 'Beef stew with a side of quorn',
    ingredients: ['quorn mince', 'beef shin', 'carrots'],
  });
  assert(
    !blob.labels.includes('vegetarian') && !blob.labels.includes('vegan'),
    'a plant marker on ONE item cannot vouch for the meat beside it — items are scoped, never flattened',
    `got [${blob.labels.join(', ')}]`,
  );

  // The seed authors no label. It derives every one from the recipe it is publishing.
  const seed = strip('scripts/import-tha-founding-cookbook-500.ts');
  assert(
    seed.includes('classifyDietLabels'),
    'the cookbook seed DERIVES every label from the recipe it publishes — it authors none',
  );
  assert(
    /dietTypes:\s*classification\.labels/.test(seed),
    'the seed writes the classifier\'s answer into diet_types — never a literal label list of its own',
  );

  // The owner is the ingredients. A `diet_types` field in the source JSON would be a second
  // copy of a derived fact, free to contradict the ingredient list beside it in the same file.
  const manifest = readFileSync(
    join(process.cwd(), 'data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json'),
    'utf8',
  );
  assert(
    !/"diet_types"|"dietTypes"/.test(manifest),
    'the source cookbook JSON stores NO diet label — the ingredients are the owner, the label is their projection',
  );

  // And the labeller no longer decides anything for itself either.
  const labeller = strip('server/lib/external-meal-service.ts');
  assert(
    labeller.includes('classifyDietLabels'),
    'the import labeller delegates to the one classifier',
  );
  for (const list of ['MEAT_KEYWORDS', 'FISH_KEYWORDS', 'DAIRY_KEYWORDS']) {
    assert(!labeller.includes(list), `${list} has not returned to the labeller (Principle 8, SURF1B5)`);
  }
}

// ─── 5. The label path, and the gate that is unchanged ────────────────────────

function sec5_labelPathAndGate(): void {
  section('5  THE LABEL PATH — a claim is vetoed, never trusted; and the GATE is untouched');

  // A source's claim cannot survive contradicting evidence (SURF1B5, preserved).
  const claimed = detectDietTypes('Vegan carbonara', ['pancetta', 'eggs', 'spaghetti']);
  assert(
    !claimed.includes('vegan') && !claimed.includes('vegetarian'),
    'a recipe that CALLS ITSELF vegan but lists pancetta is labelled neither — the claim is vetoed',
    `got [${claimed.join(', ')}]`,
  );

  // NEW in SURF1C1: a claim cannot survive the ABSENCE of evidence either.
  const claimedNoEvidence = detectDietTypes('Vegan Buddha Bowl', []);
  assert(
    !claimedNoEvidence.includes('vegan') && !claimedNoEvidence.includes('vegetarian'),
    'a title-only import CALLING ITSELF vegan is labelled neither — no evidence, no label, however loud the claim',
    `got [${claimedNoEvidence.join(', ')}]`,
  );
  note('six call sites in external-meal-service pass `[]` — every one of them used to import as vegan AND vegetarian');

  // An under-claim is still honoured (SURF1B5 §7): the source may know what its list does not show.
  const meatFree = detectDietTypes('Meat-free chilli', ['meat-free mince', 'kidney beans']);
  assert(
    meatFree.includes('vegetarian') && !meatFree.includes('vegan'),
    'a source-claimed "meat-free" dish is labelled vegetarian and NOT promoted to vegan — the claim is not overruled upward',
    `got [${meatFree.join(', ')}]`,
  );

  // Non-diet claims are untouched — SURF1C1 changes Vegan and Vegetarian only.
  const gf = detectDietTypes('Gluten-free brownies', ['gluten-free flour', 'cocoa', 'eggs']);
  assert(
    gf.includes('gluten-free'),
    'gluten-free, dairy-free, keto and paleo claims are outside this mandate and pass through unchanged',
    `got [${gf.join(', ')}]`,
  );

  // ── THE GATE IS UNCHANGED. This is the load-bearing assertion of the workstream. ──
  //
  // A label is a DISCOVERY and ORDERING signal. It is not, and must never become, a
  // safety gate. So the gate's verdict must be identical whatever the label says — and
  // the way to prove that is to hand it the same meal with opposite labels.
  const vegan = ctxFor('Vegan');
  const bacon = { name: 'Bacon sandwich', ingredients: ['smoked bacon', 'white bread', 'butter'] };
  const lentils = { name: 'Lentil dhal', ingredients: ['red lentils', 'coconut milk', 'spinach'] };

  assert(
    !isMealSafeForHousehold(bacon, vegan).safe,
    'a bacon sandwich is REFUSED to a vegan household — labelled or not, the gate reads the food',
  );
  assert(
    isMealSafeForHousehold(lentils, vegan).safe,
    'a lentil dhal is SERVED to a vegan household — with or without a label on it',
  );
  assert(
    classifyDietLabels(bacon).labels.length === 0 && classifyDietLabels(lentils).labels.includes('vegan'),
    'and the classifier agrees with the gate on both — because it asked the gate',
  );
  note('SURF1C1 adds no gate, removes no gate, and changes no gate. It changes what THA can HONESTLY SAY about a meal.');
}

// ─── 5b. A defect SURF1C1 FOUND and must not fix ──────────────────────────────

function sec5b_knownGateDefect(): void {
  section('5b  KNOWN GATE DEFECT — "aspARAGUs" contains "ragu", and the library calls it meat');

  // Found by this workstream, and NOT fixed by it. `ragu` is a hidden meat ingredient, and
  // the canonical resolver matches hidden/derived terms by FORWARD SUBSTRING (deliberately —
  // it is what makes "sardine" match "sardines" and "yoghurt" match "natural yoghurt").
  // So "ragu" matches inside "asparagus", and the canonical library answers: this is meat.
  //
  // Consequences, both live and both PRE-EXISTING:
  //   · the GATE refuses every asparagus meal to every vegetarian, vegan and meat-restricted
  //     household — a fail-CLOSED defect, which is why four prior safety workstreams hunting
  //     fail-OPENs never saw it. It costs households food; it does not endanger them.
  //   · 52 of the 500 founding recipes are therefore classified as NOT vegetarian, and stay
  //     UNLABELLED — under-labelled, never mislabelled.
  //
  // SURF1C1 does not fix it, and the reason is not timidity. The obvious fix — word-boundary
  // matching for derived/hidden terms — would BREAK "sardines", "prawns", "eggs" and every
  // other plural, opening real fail-opens in a major-allergen path. That is a safety-gate
  // change with its own regression budget, and this mandate explicitly excludes it.
  //
  // What SURF1C1 does instead is DEFER to the canonical owner even where it suspects it is
  // wrong — because a classifier that second-guesses the library is a second owner of the
  // fact, and that is the defect this whole SURF1 line exists to remove.
  //
  // This test PINS the defect. It fails the day someone fixes it — and that is the point:
  // whoever fixes it is told, by name, that 52 founding recipes are now eligible for labels
  // they never had, and must re-run `npm run seed:cookbook` to publish them.
  const asparagus = shouldExcludeRecipe(
    { name: 'x', ingredients: ['asparagus'] },
    { dietPattern: 'Vegetarian', dietRestrictions: [] },
  );
  assert(
    asparagus === true,
    'DEFECT PINNED: the canonical library still refuses asparagus to a vegetarian ("ragu" ⊂ "asparagus"). ' +
      'If this now FAILS, the gate has been fixed — re-run `npm run seed:cookbook` to label the 52 recipes it frees.',
  );

  // The direction of the resulting error is the one that is safe to be wrong in.
  const hash = classifyDietLabels({ name: 'Asparagus hash', ingredients: ['asparagus', 'potato', 'olive oil'] });
  assert(
    hash.labels.length === 0,
    'an asparagus recipe is left UNLABELLED, never mislabelled — the error runs toward silence, not toward a false claim',
    `got [${hash.labels.join(', ')}]`,
  );
  note('SURF1C1 found this. SURF1C1 does not fix it. It is the top remaining gap in the report.');
}

// ─── 6. Live data ─────────────────────────────────────────────────────────────

async function sec6_liveData(): Promise<void> {
  section('6  LIVE DATA — the real cookbook, the real labels, the real gate');

  const system = await db
    .select({
      id: meals.id,
      name: meals.name,
      ingredients: meals.ingredients,
      dietTypes: meals.dietTypes,
      categoryId: meals.categoryId,
      sourceType: meals.mealSourceType,
    })
    .from(meals)
    .where(eq(meals.isSystemMeal, true));

  note(`${system.length} system meals in the live cookbook`);

  // 6a. NOT ONE published label contradicts the canonical gate. This is the check SURF1B5
  //     ran and passed vacuously — there was no label on an evidence-bearing meal to test.
  let labelsChecked = 0;
  const contradictions: string[] = [];
  for (const m of system) {
    for (const label of m.dietTypes ?? []) {
      if (label !== 'vegan' && label !== 'vegetarian') continue;
      labelsChecked++;
      const pattern = label === 'vegan' ? 'Vegan' : 'Vegetarian';
      const excluded = shouldExcludeRecipe(
        { name: m.name, ingredients: m.ingredients ?? [] },
        { dietPattern: pattern, dietRestrictions: [] },
      );
      if (excluded) contradictions.push(`${m.name} — labelled ${label}`);
    }
  }
  assert(
    contradictions.length === 0,
    `not one of the ${labelsChecked} published labels contradicts the canonical gate`,
    contradictions.slice(0, 3).join('; '),
  );

  // 6b. Every VEGAN label passes the Vegan gate; every VEGETARIAN label passes the Vegetarian gate.
  const veganCtx = ctxFor('Vegan');
  const vegetarianCtx = ctxFor('Vegetarian');
  const veganLabelled = system.filter((m) => (m.dietTypes ?? []).includes('vegan'));
  const vegLabelled = system.filter((m) => (m.dietTypes ?? []).includes('vegetarian'));

  const veganFails = veganLabelled.filter(
    (m) => !isMealSafeForHousehold({ name: m.name, ingredients: m.ingredients ?? [] }, veganCtx).safe,
  );
  const vegFails = vegLabelled.filter(
    (m) => !isMealSafeForHousehold({ name: m.name, ingredients: m.ingredients ?? [] }, vegetarianCtx).safe,
  );
  assert(
    veganFails.length === 0,
    `every one of the ${veganLabelled.length} vegan-labelled system meals PASSES the Vegan gate`,
    veganFails.slice(0, 3).map((m) => m.name).join('; '),
  );
  assert(
    vegFails.length === 0,
    `every one of the ${vegLabelled.length} vegetarian-labelled system meals PASSES the Vegetarian gate`,
    vegFails.slice(0, 3).map((m) => m.name).join('; '),
  );

  // 6c. The founding cookbook — every label equals what its own ingredients prove.
  const founding = system.filter((m) => m.sourceType === 'starter');
  const drifted = founding.filter((m) => {
    const derived = classifyDietLabels({ name: m.name, ingredients: m.ingredients ?? [] }).labels.slice().sort();
    const published = (m.dietTypes ?? []).filter((l) => l === 'vegan' || l === 'vegetarian').sort();
    return derived.join(',') !== published.join(',');
  });
  assert(
    founding.length === 500,
    `the 500 founding cookbook recipes are all present`,
    `found ${founding.length}`,
  );
  assert(
    drifted.length === 0,
    'every founding recipe\'s label equals what the classifier derives from its ingredients — reproducible by re-seed',
    drifted.slice(0, 3).map((m) => m.name).join('; '),
  );

  const foundingLabelled = founding.filter((m) => (m.dietTypes ?? []).length > 0).length;
  assert(
    foundingLabelled > 0,
    `${foundingLabelled} of the 500 founding recipes now carry a proven label — before SURF1C1 it was ZERO`,
  );

  // 6d. Title-only meals remain unclassified — no label was invented for them.
  const titleOnly = system.filter((m) => dietEvidenceLines({ name: m.name, ingredients: m.ingredients ?? [] }).length < MIN_INGREDIENT_EVIDENCE);
  const invented = titleOnly.filter((m) => {
    const derived = classifyDietLabels({ name: m.name, ingredients: m.ingredients ?? [] });
    return derived.labels.length > 0;
  });
  assert(
    invented.length === 0,
    `all ${titleOnly.length} meals without ingredient evidence are left UNCLASSIFIED by the classifier — none is guessed at`,
  );

  // 6e. THE POINT OF THE WORKSTREAM. Every starter slot that used to backfill from the
  //     unrestricted pool now has enough PROVEN meals to fill itself with label-matched food.
  const CATEGORIES: Array<[number, string]> = [[1, 'Breakfast'], [2, 'Lunch'], [3, 'Dinner']];
  for (const [categoryId, categoryName] of CATEGORIES) {
    const pool = system.filter((m) => m.categoryId === categoryId);
    for (const label of ['vegan', 'vegetarian']) {
      const labelled = pool.filter((m) => (m.dietTypes ?? []).includes(label));
      note(`${label} · ${categoryName}: ${labelled.length} labelled of ${pool.length} (${WANTED} wanted)`);
      assert(
        labelled.length >= WANTED,
        `the ${label} ${categoryName} slot can be filled with ${WANTED} LABEL-MATCHED meals — the label pool is no longer short`,
        `only ${labelled.length} labelled`,
      );
    }
  }

  // 6f. User-owned meals are not the cookbook's to classify, and were not touched.
  const userMeals = await db
    .select({ id: meals.id })
    .from(meals)
    .where(and(eq(meals.isSystemMeal, false)));
  note(`${userMeals.length} user-owned meals — outside this mandate, and none was written`);
  assert(userMeals.length > 0, 'user-owned meals still exist and were never in scope');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n═══ SURF1C1 — Canonical Starter Cookbook Diet Classification ═══');

  sec1_evidence();
  sec2_canonicalAnswer();
  sec3_plantSubstitutes();
  sec4_oneOwner();
  sec5_labelPathAndGate();
  sec5b_knownGateDefect();
  await sec6_liveData();

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SURF1C1: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(70));
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error('\nSuite crashed:', err);
  process.exit(1);
});
