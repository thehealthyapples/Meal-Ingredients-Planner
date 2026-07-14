/**
 * test-surf1c2-canonical-restriction-matcher-boundary-safety.ts
 * =============================================================
 * SURF1C2 — Canonical Restriction Matcher Boundary Safety.
 *
 * THE DEFECT
 * ----------
 * The canonical resolver matched derivedIngredients and hiddenIngredients by RAW
 * forward substring. So the meat hidden-term "ragu" matched inside "asp·aragu·s", and
 * the canonical library called asparagus meat:
 *
 *   resolveIngredientRestrictions("asparagus", [meat]) → [meat]   (WRONG)
 *
 * SURF1C1 found it live: every asparagus meal was refused to every vegetarian, vegan
 * and meat-restricted household, and 52 founding recipes lost the labels their
 * ingredients earn. A fail-CLOSED defect — it over-restricts, so four fail-open safety
 * workstreams walked past it — and the exact class the library's own authoring note
 * warns of ("`ham` here WOULD match `chamomile`").
 *
 * THE FIX
 * A general, boundary-safe rule in the ONE canonical matcher (no asparagus exception,
 * no second matcher, no keyword list): a derived/hidden term matches only when it
 * begins at a WORD BOUNDARY. What follows is unrestricted, so plurals and compounds
 * keep matching exactly as substring did — "sardine"→"sardines", "cheese"→"cheesecake"
 * — while a term buried inside a word ("aspa·ragu·s") no longer matches.
 *
 * THE SAFETY DIRECTION
 * The new match set is a strict SUBSET of the old one (every accepted match was already
 * a substring occurrence). So no ingredient newly matches a restriction, and NO MEAL
 * THAT WAS REFUSED BECOMES ALLOWED. Every removed match is a coincidental infix ceasing
 * to falsely restrict — proven term-by-term across the live corpus in §6.
 *
 * THE LAYERS
 *   1  THE DEFECT — asparagus no longer matches meat, by any path
 *   2  POSITIVE CONTROLS — real terms, plurals, diacritics, punctuation, compounds
 *   3  NEGATIVE CONTROLS — the coincidental infixes, and plant substitutes
 *   4  ALLERGEN CORRECTNESS — peanut≠tree nut, cornflour≠gluten; protection kept
 *   5  ONE OWNER — the library is unchanged; the fix lives only in the matcher
 *   6  NO FAIL-OPEN — new ⊆ old across the whole corpus; library self-test
 *   7  LIVE DATA — the 52 asparagus recipes are eligible; no labelled meal contradicts
 *
 * Run with: npm run test:surf1c2-canonical-restriction-matcher-boundary-safety
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { meals } from '../../shared/schema.js';
import {
  findRestrictionById,
  resolveIngredientRestrictions,
} from '../../shared/restrictions/restriction-resolver.js';
import { RESTRICTION_DEFINITIONS } from '../../shared/restrictions/restriction-library.js';
import { classifyDietLabels, shouldExcludeRecipe } from '../../shared/dietRules.js';

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

/** True when `ingredient` conflicts with restriction `id` through the canonical resolver. */
function hits(ingredient: string, id: string): boolean {
  const def = findRestrictionById(id);
  if (!def) throw new Error(`no restriction definition for "${id}"`);
  return resolveIngredientRestrictions(ingredient, [def]).length > 0;
}

// ─── The OLD matcher, reconstructed for the fail-open proof (§6) ──────────────
// A faithful copy of the pre-SURF1C2 resolver: raw forward substring for derived and
// hidden terms. Used ONLY to diff old vs new — never imported by anything shipping.

function normLike(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .trim()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ');
}
function isWordCharLike(ch: string | undefined): boolean {
  return ch !== undefined && /[a-z0-9]/.test(ch);
}
function oldWordBoundary(h: string, n: string): boolean {
  if (!n) return false;
  let from = 0;
  for (;;) {
    const i = h.indexOf(n, from);
    if (i === -1) return false;
    if (!isWordCharLike(h[i - 1]) && !isWordCharLike(h[i + n.length])) return true;
    from = i + 1;
  }
}
function oldHitsDefinition(ingredient: string, def: any): boolean {
  const ni = normLike(ingredient);
  if (def.excludedCompounds) {
    for (const c of def.excludedCompounds) if (ni.includes(normLike(c))) return false;
  }
  if (oldWordBoundary(ni, normLike(def.id))) return true;
  for (const a of def.aliases) if (oldWordBoundary(ni, normLike(a))) return true;
  for (const d of def.derivedIngredients) if (ni.includes(normLike(d))) return true; // raw substring
  for (const h of def.hiddenIngredients) if (ni.includes(normLike(h))) return true; // raw substring
  return false;
}

// ─── 1. The defect ────────────────────────────────────────────────────────────

function sec1_theDefect(): void {
  section('1  THE DEFECT — asparagus is not meat');

  assert(!hits('asparagus', 'meat'), '"asparagus" no longer matches meat ("ragu" ⊄ "asparagus")');
  assert(!hits('150g asparagus, chopped', 'meat'), 'a real cookbook line "150g asparagus, chopped" does not match meat');

  // And it never matched via any OTHER path — proving the meat verdict was solely the
  // ragu infix, so removing it leaves nothing that should have flagged asparagus.
  for (const id of ['fish', 'shellfish', 'dairy', 'eggs', 'honey', 'gluten']) {
    assert(!hits('asparagus, chopped', id), `"asparagus" matches no ${id} restriction either — it is a plant`);
  }

  // The gate and the classifier now agree it is vegan.
  const dish = { name: 'Asparagus & Pea Toast', ingredients: ['asparagus', 'peas', 'sourdough toast', 'olive oil'] };
  assert(!shouldExcludeRecipe(dish, { dietPattern: 'Vegan', dietRestrictions: [] }), 'an asparagus dish passes the Vegan gate');
  assert(classifyDietLabels(dish).labels.includes('vegan'), 'and the classifier now labels it vegan');
}

// ─── 2. Positive controls ─────────────────────────────────────────────────────

function sec2_positiveControls(): void {
  section('2  POSITIVE CONTROLS — real terms, plurals, diacritics, punctuation, compounds');

  const positives: Array<[string, string, string]> = [
    ['ragu', 'meat', 'the term itself, at a boundary'],
    ['beef ragu', 'meat', 'the term as a trailing word'],
    ['ragù', 'meat', 'diacritic folded to "ragu"'],
    ['sardine', 'fish', 'singular derived term'],
    ['sardines', 'fish', 'plural — term at word start, "-s" follows'],
    ['prawns', 'shellfish', 'plural'],
    ['eggs', 'eggs', 'plural'],
    ['pâté', 'meat', 'diacritic folded to "pate"'],
    ['beef, diced', 'meat', 'punctuation boundary (alias path)'],
    ['2 eggs, beaten', 'eggs', 'the commonest ingredient string on earth'],
    ['cheesecake', 'dairy', 'compound — the allergen leads the word'],
    ['cheeseburger', 'dairy', 'compound'],
    ['breaded plaice', 'gluten', 'compound — breaded means breadcrumbs'],
    ['natural yoghurt', 'dairy', 'trailing whole word'],
    ['pork sausages', 'meat', 'derived compound + plural'],
    ['smoked salmon', 'fish', 'trailing whole word'],
    ['almond butter', 'tree_nut', 'real tree-nut butter'],
  ];
  for (const [ing, id, why] of positives) {
    assert(hits(ing, id), `"${ing}" → ${id}  (${why})`, 'REGRESSION: a real match was lost');
  }
}

// ─── 3. Negative controls ─────────────────────────────────────────────────────

function sec3_negativeControls(): void {
  section('3  NEGATIVE CONTROLS — coincidental infixes, and plant substitutes');

  // The four named infixes: in each the restricted term sits AFTER a letter.
  const infixes: Array<[string, string, string]> = [
    ['asparagus', 'meat', '"ragu" is an infix'],
    ['chamomile tea', 'meat', '"ham" is an infix'],
    ['honeydew melon', 'honey', '"honey" leads but "honeydew" is one word — the alias path already rejects it'],
    ['butternut squash', 'tree_nut', '"nut" is an infix'],
    ['minute rice', 'peanut', '"nut" is an infix (pre-existing alias safety, still holds)'],
    ['savoy cabbage', 'soy', '"soy" is an infix (pre-existing alias safety, still holds)'],
  ];
  for (const [ing, id, why] of infixes) {
    assert(!hits(ing, id), `"${ing}" does NOT match ${id}  (${why})`, 'FALSE MATCH');
  }

  // Plant substitutes remain protected by the excludedCompounds early exit (unchanged).
  const substitutes: Array<[string, string]> = [
    ['vegan sausage', 'meat'],
    ['mushroom ragu', 'meat'],
    ['quorn mince', 'meat'],
    ['oat milk', 'dairy'],
    ['almond milk', 'dairy'],
    ['vegan bacon', 'meat'],
    ['meat-free mince', 'meat'],
  ];
  for (const [ing, id] of substitutes) {
    assert(!hits(ing, id), `plant substitute "${ing}" does NOT match ${id} — excludedCompounds early exit intact`);
  }
}

// ─── 4. Allergen correctness ──────────────────────────────────────────────────

function sec4_allergenCorrectness(): void {
  section('4  ALLERGEN CORRECTNESS — protection kept, false positives removed');

  // Peanut is a LEGUME, not a tree nut. "nut butter" (a tree_nut derived term) used to
  // match "peanut butter" by infix. The peanut restriction still protects it.
  assert(hits('peanut butter', 'peanut'), '"peanut butter" STILL matches peanut — protection kept');
  assert(!hits('peanut butter', 'tree_nut'), '"peanut butter" no longer matches tree_nut — peanut is a legume, not a tree nut');
  assert(hits('peanuts', 'peanut'), '"peanuts" still matches peanut');

  // The intended targets of "nut butter" — real tree-nut butters — are still caught,
  // via their specific nut names.
  for (const ing of ['almond butter', 'cashew butter', 'walnut butter', 'hazelnut butter']) {
    assert(hits(ing, 'tree_nut'), `real tree-nut butter "${ing}" still matches tree_nut`);
  }

  // UK cornflour is cornstarch — gluten-free. It used to match "flour" (a gluten derived
  // term) by infix. Every genuine wheat flour still matches.
  assert(!hits('cornflour', 'gluten'), '"cornflour" no longer matches gluten — UK cornflour is cornstarch (gluten-free)');
  for (const ing of ['plain flour', 'wheat flour', 'self-raising flour', 'flour', 'strong white flour']) {
    assert(hits(ing, 'gluten'), `genuine flour "${ing}" still matches gluten`);
  }
}

// ─── 5. One owner ─────────────────────────────────────────────────────────────

function sec5_oneOwner(): void {
  section('5  ONE OWNER — the library is untouched; the fix lives only in the matcher');

  const resolver = readFileSync(join(process.cwd(), 'shared/restrictions/restriction-resolver.ts'), 'utf8');
  const codeOnly = resolver.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  assert(
    /function boundaryAwareIncludes/.test(codeOnly),
    'the fix is a single boundary-aware matcher in the canonical resolver',
  );
  assert(
    !/asparagus|ragu/i.test(codeOnly),
    'the fix names no food — it is a general boundary rule, not an asparagus exception',
  );
  // The matcher must reach the library's derived/hidden fields through the boundary-aware
  // path, never raw substring.
  assert(
    /derivedIngredients[\s\S]{0,120}boundaryAwareIncludes/.test(codeOnly) &&
    /hiddenIngredients[\s\S]{0,120}boundaryAwareIncludes/.test(codeOnly),
    'derived and hidden ingredients are matched boundary-aware; excludedCompounds keeps its broad early exit',
  );

  // The library itself carries no new term, and specifically "ragu" was NOT relocated —
  // the fix is in the matcher, so the library needs no edit.
  const library = readFileSync(join(process.cwd(), 'shared/restrictions/restriction-library.ts'), 'utf8');
  assert(/'ragu'/.test(library), '"ragu" remains a hidden meat term — it was not moved or deleted; the matcher handles it correctly now');
}

// ─── 6. No fail-open ──────────────────────────────────────────────────────────

async function sec6_noFailOpen(): Promise<void> {
  section('6  NO FAIL-OPEN — new ⊆ old across the whole corpus; library self-test');

  // Every distinct ingredient line in every meal — system and user-owned — matched
  // against every restriction, old matcher vs new. The new matcher may only REMOVE
  // matches (coincidental infixes); it must never ADD one, and every removal must be a
  // real false positive, not lost protection.
  const rows = await db.selectDistinct({ ings: meals.ingredients }).from(meals);
  const corpusSet = new Set<string>();
  for (const r of rows) for (const ing of r.ings ?? []) corpusSet.add(String(ing));
  const corpus = Array.from(corpusSet);

  let added = 0;
  const removed: Array<{ ing: string; id: string }> = [];
  for (const ing of corpus) {
    for (const def of RESTRICTION_DEFINITIONS) {
      const oldHit = oldHitsDefinition(ing, def);
      const newHit = resolveIngredientRestrictions(ing, [def]).length > 0;
      if (newHit && !oldHit) added++;
      if (oldHit && !newHit) removed.push({ ing, id: def.id });
    }
  }
  note(`${corpus.length} distinct ingredient lines × ${RESTRICTION_DEFINITIONS.length} restrictions`);

  assert(added === 0, `the new matcher ADDS no match anywhere — a meal that was refused cannot become refused-differently (${added} added)`);

  // Every removed match must be a coincidental infix: the term does NOT appear at a word
  // start anywhere in the ingredient. If any removal were a genuine word-start match, it
  // would be lost protection — a fail-open. There must be none.
  const suspicious = removed.filter(({ ing, id }) => {
    const def = findRestrictionById(id)!;
    const ni = normLike(ing);
    const terms = [...def.derivedIngredients, ...def.hiddenIngredients].map(normLike);
    // Did any derived/hidden term appear at a WORD START in this ingredient? If so, the
    // new matcher should have KEPT it, and its removal would be a real loss.
    return terms.some((t) => {
      if (!t) return false;
      let from = 0;
      for (;;) {
        const i = ni.indexOf(t, from);
        if (i === -1) return false;
        if (!isWordCharLike(ni[i - 1])) return true; // term at a word start → should be kept
        from = i + 1;
      }
    });
  });
  assert(
    suspicious.length === 0,
    `every removed match is a coincidental infix — none was a word-start term (no lost protection)`,
    suspicious.slice(0, 5).map((s) => `"${s.ing}"⊘${s.id}`).join('; '),
  );
  note(`${removed.length} coincidental-infix matches removed (e.g. asparagus/meat, cornflour/gluten, peanut butter/tree_nut) — all fail-CLOSED corrections`);

  // Library self-test: every derived/hidden term still matches itself, and its "-s"
  // plural. This is the guarantee that "boundary-aware" did not quietly drop a real term.
  let selfFail = 0;
  let pluralFail = 0;
  for (const def of RESTRICTION_DEFINITIONS) {
    for (const term of [...def.derivedIngredients, ...def.hiddenIngredients]) {
      if (resolveIngredientRestrictions(term, [def]).length === 0) {
        selfFail++;
        note(`  SELF-FAIL: "${term}" no longer matches ${def.id}`);
      }
      const normTerm = normLike(term);
      if (!/\s/.test(normTerm)) {
        if (resolveIngredientRestrictions(term + 's', [def]).length === 0) {
          pluralFail++;
          note(`  PLURAL-FAIL: "${term}s" no longer matches ${def.id}`);
        }
      }
    }
  }
  assert(selfFail === 0, 'every derived/hidden term still matches ITSELF — no real term was dropped');
  assert(pluralFail === 0, 'every single-word derived/hidden term still matches its "-s" PLURAL');
}

// ─── 7. Live data ─────────────────────────────────────────────────────────────

async function sec7_liveData(): Promise<void> {
  section('7  LIVE DATA — asparagus recipes eligible; no labelled meal contradicts the gate');

  const system = await db
    .select({ name: meals.name, ingredients: meals.ingredients, dietTypes: meals.dietTypes, sourceType: meals.mealSourceType })
    .from(meals)
    .where(eq(meals.isSystemMeal, true));

  const asparagusRecipes = system.filter(
    (m) => m.sourceType === 'starter' && (m.ingredients ?? []).some((i) => /asparagus/i.test(i)),
  );
  note(`${asparagusRecipes.length} founding recipes contain asparagus`);
  assert(asparagusRecipes.length > 0, 'the asparagus recipes exist to be corrected');

  // Asparagus is no longer a disqualifier: not one asparagus ingredient LINE, on its own,
  // matches any animal restriction. (A recipe may still be non-vegetarian because of its
  // chicken — but asparagus is no longer the reason, which is the whole defect.)
  const animalRestrictions = ['meat', 'fish', 'shellfish', 'dairy', 'eggs', 'honey'];
  let asparagusLinesFlagged = 0;
  for (const m of asparagusRecipes) {
    for (const line of (m.ingredients ?? []).filter((i) => /asparagus/i.test(i))) {
      if (animalRestrictions.some((id) => hits(line, id))) asparagusLinesFlagged++;
    }
  }
  assert(asparagusLinesFlagged === 0, 'not one asparagus ingredient line matches any animal restriction — asparagus no longer disqualifies a recipe');

  const nowLabelled = asparagusRecipes.filter((m) => (m.dietTypes ?? []).length > 0).length;
  note(`${nowLabelled} of the ${asparagusRecipes.length} asparagus recipes now carry a proven diet label (was 0 before republish)`);
  assert(nowLabelled > 0, 'the republish gave the asparagus recipes the labels their ingredients earn');

  // The safety invariant that must never break: no vegan/vegetarian-labelled system meal
  // contradicts the canonical gate.
  let contradictions = 0;
  for (const m of system) {
    for (const label of m.dietTypes ?? []) {
      if (label !== 'vegan' && label !== 'vegetarian') continue;
      const pattern = label === 'vegan' ? 'Vegan' : 'Vegetarian';
      if (shouldExcludeRecipe({ name: m.name, ingredients: m.ingredients ?? [] }, { dietPattern: pattern, dietRestrictions: [] })) {
        contradictions++;
      }
    }
  }
  assert(contradictions === 0, `no vegan/vegetarian-labelled system meal contradicts the canonical gate (${system.length} meals checked)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n═══ SURF1C2 — Canonical Restriction Matcher Boundary Safety ═══');

  sec1_theDefect();
  sec2_positiveControls();
  sec3_negativeControls();
  sec4_allergenCorrectness();
  sec5_oneOwner();
  await sec6_noFailOpen();
  await sec7_liveData();

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SURF1C2: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(70));
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error('\nSuite crashed:', err);
  process.exit(1);
});
