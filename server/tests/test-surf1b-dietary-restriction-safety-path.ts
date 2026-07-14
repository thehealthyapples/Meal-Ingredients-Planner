/**
 * test-surf1b-dietary-restriction-safety-path.ts
 * ==============================================
 * SURF1B — the household dietary restriction safety path.
 *
 * DCA1 gap #1: `storage.ts` hardcoded the restriction field of the AI-facing
 * household context to an empty array, and 21 households carried live restrictions
 * the Companion had never once seen.
 *
 * The audit found the symptom. Tracing the chain found the disease, and it is worse:
 *
 *   THA accepts SEVEN declarable restrictions on the profile
 *   (Gluten-Free, Dairy-Free, Nuts, Eggs, Shellfish, Soy, Sesame) and routed them to
 *   `dietRules.shouldExcludeRecipe()`, which implements TWO of them. The canonical
 *   restriction library implements all seven — but was fed only from
 *   `household_eaters.hard_restrictions`, a mirror that is EMPTY for 10 of the 21.
 *
 * These tests are organised by the layer each defect lived in:
 *
 *   1. NEGATIVE CONTROL — proves the old path was blind. These assertions describe
 *      the DEFECT, not the fix, and they must keep passing forever: they pin what
 *      `dietRules` alone does and does not catch.
 *   2. ENFORCEMENT      — every one of the seven declarable restrictions now rejects
 *      a meal containing it. Five of these fail at 9d14d10d.
 *   3. MULTI-MEMBER     — another member's allergen binds the requester's meals, and
 *      a child with no account is a full member of the safety union.
 *   4. HARD vs PREFERENCE — a soft preference never becomes a hard gate, and a hard
 *      restriction never decays into a preference.
 *   5. FAIL-SAFE        — an unresolved context refuses every meal. "We could not
 *      find out" must never be served as "no restrictions".
 *   6. ONE ENGINE       — the resolver defines no keyword list of its own.
 *   7. LIVE (DB)        — the real 21 households, through the real code path.
 *
 * Run with: npx tsx server/tests/test-surf1b-dietary-restriction-safety-path.ts
 */

import {
  isMealSafeForHousehold,
  isSafetyGateActive,
  requireHardRestrictions,
  resolveHouseholdSafetyContext,
  HouseholdSafetyUnavailableError,
  type HouseholdSafetyContext,
  type SafetyCheckableMeal,
} from '../lib/household-dietary-safety.js';
import { shouldExcludeRecipe } from '../../shared/dietRules.js';
import { resolveActiveRestrictions } from '../../shared/restrictions/restriction-resolver.js';
import { readFileSync } from 'fs';
import { join } from 'path';

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

// ─── Context builders ────────────────────────────────────────────────────────

/** A resolved household. `hardRestrictions` are as the members declared them. */
function household(opts: {
  hardRestrictions?: string[];
  requesterDietPattern?: string | null;
  dietTypes?: string[];
  excludedIngredients?: string[];
  members?: HouseholdSafetyContext['members'];
}): HouseholdSafetyContext {
  const hard = opts.hardRestrictions ?? [];
  return {
    status: 'resolved',
    householdId: 1,
    requesterUserId: 1,
    requesterDietPattern: opts.requesterDietPattern ?? null,
    members: opts.members ?? [
      {
        userId: 1,
        displayName: 'Requester',
        hardRestrictions: hard,
        dietPattern: opts.requesterDietPattern ?? null,
        dietTypes: opts.dietTypes ?? [],
        excludedIngredients: opts.excludedIngredients ?? [],
      },
    ],
    hardRestrictions: hard,
    activeRestrictions: resolveActiveRestrictions(hard),
    dietPatterns: opts.requesterDietPattern ? [opts.requesterDietPattern] : [],
    preferences: {
      dietTypes: opts.dietTypes ?? [],
      excludedIngredients: opts.excludedIngredients ?? [],
    },
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

const meal = (name: string, ingredients: string[]): SafetyCheckableMeal => ({ name, ingredients });

async function run(): Promise<void> {
  console.log('SURF1B — Dietary Restriction Safety Path\n' + '='.repeat(60));

  // ═══════════════════════════════════════════════════════════════════════════
  section('1. NEGATIVE CONTROL — what the pre-SURF1B path could not see');
  // These assertions pin the DEFECT. dietRules was the only engine the profile's
  // restrictions ever reached, and it implements two of the seven THA accepts.
  // If any of these ever flips, dietRules has grown a second allergen engine and
  // the two owners have started to contest — which is what Principle 2 forbids.

  const satay = meal('Chicken Satay', ['chicken', 'peanut butter', 'soy sauce']);
  const satayText = 'chicken satay chicken peanut butter soy sauce';

  assert(
    shouldExcludeRecipe(satayText, { dietPattern: null, dietRestrictions: ['Nuts'] }) === false,
    'dietRules alone does NOT reject a peanut dish for a "Nuts" restriction',
    'this is the defect: the profile accepts "Nuts" and dietRules ignores it',
  );
  assert(
    shouldExcludeRecipe('prawn linguine prawns', { dietPattern: null, dietRestrictions: ['Shellfish'] }) === false,
    'dietRules alone does NOT reject prawns for a "Shellfish" restriction',
  );
  assert(
    shouldExcludeRecipe('hummus tahini chickpeas', { dietPattern: null, dietRestrictions: ['Sesame'] }) === false,
    'dietRules alone does NOT reject tahini for a "Sesame" restriction',
  );
  assert(
    shouldExcludeRecipe('spanish omelette eggs potato', { dietPattern: null, dietRestrictions: ['Eggs'] }) === false,
    'dietRules alone does NOT reject eggs for an "Eggs" restriction',
  );
  assert(
    shouldExcludeRecipe('tofu stir fry tofu', { dietPattern: null, dietRestrictions: ['Soy'] }) === false,
    'dietRules alone does NOT reject tofu for a "Soy" restriction',
  );

  // The two it DOES implement — proving dietRules is not simply inert.
  assert(
    shouldExcludeRecipe('pasta bake pasta flour', { dietPattern: null, dietRestrictions: ['Gluten-Free'] }) === true,
    'dietRules DOES reject gluten for "Gluten-Free" (2 of 7 implemented)',
  );
  assert(
    shouldExcludeRecipe('mac and cheese cheddar milk', { dietPattern: null, dietRestrictions: ['Dairy-Free'] }) === true,
    'dietRules DOES reject dairy for "Dairy-Free" (2 of 7 implemented)',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('2. ENFORCEMENT — all seven declarable restrictions now reject');
  // ALLOWED_DIET_RESTRICTIONS (routes.ts). Five of these seven fail at 9d14d10d.

  const SEVEN: Array<[string, SafetyCheckableMeal]> = [
    ['Gluten-Free', meal('Pasta Bake', ['pasta', 'flour', 'cheese'])],
    ['Dairy-Free', meal('Mac and Cheese', ['macaroni', 'cheddar', 'milk'])],
    ['Nuts', satay],
    ['Eggs', meal('Spanish Omelette', ['eggs', 'potato', 'onion'])],
    ['Shellfish', meal('Prawn Linguine', ['prawns', 'linguine', 'garlic'])],
    ['Soy', meal('Tofu Stir Fry', ['tofu', 'ginger', 'pak choi'])],
    ['Sesame', meal('Hummus Bowl', ['tahini', 'chickpeas', 'lemon'])],
  ];

  for (const [restriction, unsafeMeal] of SEVEN) {
    const ctx = household({ hardRestrictions: [restriction] });
    const verdict = isMealSafeForHousehold(unsafeMeal, ctx);
    assert(
      verdict.safe === false,
      `"${restriction}" rejects "${unsafeMeal.name}"`,
      `verdict was ${JSON.stringify(verdict)}`,
    );
  }

  // The canonical library's real depth — these are why it, and not a keyword list,
  // is the owner. Each is a hidden or derived ingredient, not a name match.
  const derived: Array<[string, SafetyCheckableMeal, string]> = [
    ['Gluten-Free', meal('Stir Fry', ['chicken', 'soy sauce']), 'soy sauce hides wheat'],
    ['Sesame', meal('Dressing Salad', ['tahini dressing', 'leaves']), 'tahini is derived from sesame'],
    ['Dairy-Free', meal('Curry', ['ghee', 'onion']), 'ghee is derived from dairy'],
    ['Nuts', meal('Pesto Pasta', ['pine nuts', 'basil']), 'legacy "Nuts" expands to peanut + tree_nut'],
  ];
  for (const [restriction, unsafeMeal, why] of derived) {
    const ctx = household({ hardRestrictions: [restriction] });
    assert(
      isMealSafeForHousehold(unsafeMeal, ctx).safe === false,
      `"${restriction}" rejects "${unsafeMeal.name}" — ${why}`,
    );
  }

  // And it does not over-reject: a plant milk is not dairy.
  assert(
    isMealSafeForHousehold(
      meal('Oat Latte Porridge', ['oat milk', 'oats']),
      household({ hardRestrictions: ['Dairy-Free'] }),
    ).safe === true,
    'oat milk is NOT rejected for "Dairy-Free" (excludedCompounds hold)',
  );
  assert(
    isMealSafeForHousehold(
      meal('Roast Chicken', ['chicken', 'carrots', 'rosemary']),
      household({ hardRestrictions: ['Nuts', 'Sesame', 'Shellfish'] }),
    ).safe === true,
    'a safe meal is still served to a household with three restrictions',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('3. MULTI-MEMBER HOUSEHOLDS — the union binds every meal');

  // Two adults. The REQUESTER has no restriction at all; their partner is allergic
  // to nuts. Before SURF1B the requester's planner and Companion saw nothing.
  const twoAdults = household({
    hardRestrictions: ['Nuts'],
    members: [
      { userId: 1, displayName: 'Colin', hardRestrictions: [], dietPattern: null, dietTypes: [], excludedIngredients: [] },
      { userId: 2, displayName: 'Sam', hardRestrictions: ['Nuts'], dietPattern: null, dietTypes: [], excludedIngredients: [] },
    ],
  });
  assert(
    isMealSafeForHousehold(satay, twoAdults).safe === false,
    "a partner's nut allergy rejects the requester's satay (requester declared nothing)",
  );

  // A child with no account. Their eater row is their canonical owner.
  const withChild = household({
    hardRestrictions: ['Sesame'],
    members: [
      { userId: 1, displayName: 'Colin', hardRestrictions: [], dietPattern: null, dietTypes: [], excludedIngredients: [] },
      { userId: null, displayName: 'Ella', hardRestrictions: ['Sesame'], dietPattern: null, dietTypes: [], excludedIngredients: [] },
    ],
  });
  assert(
    isMealSafeForHousehold(meal('Hummus Bowl', ['tahini', 'chickpeas']), withChild).safe === false,
    "a child's sesame allergy rejects a tahini meal (no account, eater row is the owner)",
  );

  // Conflicting requirements — restrictions STACK, they do not cancel.
  const conflicting = household({
    hardRestrictions: ['Gluten-Free', 'Shellfish'],
    members: [
      { userId: 1, displayName: 'A', hardRestrictions: ['Gluten-Free'], dietPattern: null, dietTypes: [], excludedIngredients: [] },
      { userId: 2, displayName: 'B', hardRestrictions: ['Shellfish'], dietPattern: null, dietTypes: [], excludedIngredients: [] },
    ],
  });
  assert(
    isMealSafeForHousehold(meal('Prawn Linguine', ['prawns', 'linguine']), conflicting).safe === false,
    'conflicting members stack: prawns rejected by B, pasta by A — linguine violates both',
  );
  assert(
    isMealSafeForHousehold(meal('Prawn Salad', ['prawns', 'leaves']), conflicting).safe === false,
    "conflicting members stack: B's shellfish rejects a meal A could eat",
  );
  assert(
    isMealSafeForHousehold(meal('Pasta Primavera', ['pasta', 'courgette']), conflicting).safe === false,
    "conflicting members stack: A's gluten rejects a meal B could eat",
  );
  assert(
    isMealSafeForHousehold(meal('Grilled Chicken Salad', ['chicken', 'leaves', 'olive oil']), conflicting).safe === true,
    'a meal safe for BOTH members is still served',
  );

  // The four live vegan/vegetarian households (users 181-184) carry BOTH a pattern
  // and the restrictions {meat, fish, dairy, eggs, honey}. Their pattern is stored
  // LOWER CASE, and `shouldExcludeRecipe` switches on "Vegan" — so before SURF1B it
  // fell through to `default: return false` and they were protected by neither:
  // "meat" has no canonical restriction definition, and "vegan" matched no case.
  const liveVegan = household({
    hardRestrictions: ['meat', 'fish', 'dairy', 'eggs', 'honey'],
    requesterDietPattern: 'vegan', // exactly as the database stores it
  });
  assert(
    isMealSafeForHousehold(meal('Beef Stew', ['beef', 'carrots']), liveVegan).safe === false,
    'a LOWER-CASE "vegan" pattern rejects beef — 4 live users were served meat before SURF1B',
  );
  assert(
    isMealSafeForHousehold(meal('Roast Chicken', ['chicken', 'thyme']), household({ requesterDietPattern: 'vegetarian' })).safe === false,
    'a LOWER-CASE "vegetarian" pattern rejects chicken',
  );
  assert(
    isMealSafeForHousehold(meal('Lentil Dhal', ['red lentils', 'cumin']), liveVegan).safe === true,
    'and a vegan meal is still served to them',
  );

  // The dairy/eggs half of that same declaration is caught by the canonical library,
  // independently of the pattern — belt and braces.
  assert(
    isMealSafeForHousehold(
      meal('Creamy Mash', ['potato', 'butter', 'milk']),
      household({ hardRestrictions: ['meat', 'fish', 'dairy', 'eggs', 'honey'] }),
    ).safe === false,
    'their "dairy" restriction rejects butter through the canonical library, with no pattern at all',
  );

  // GAP CLOSED BY SURF1B2 (2026-07-14).
  //
  // SURF1B pinned this as a KNOWN GAP: "meat", "fish" and "honey" had no canonical
  // restriction definition, so declared alone — without a diet pattern — they were
  // enforced only by the conservative substring fallback, which caught "meatball"
  // and not "beef". SURF1B could not close it: closing it meant authoring new
  // dietary knowledge, which that workstream was forbidden to do.
  //
  // The pin worked exactly as a pin should. It failed the day the gap closed, and it
  // is inverted here rather than deleted — the assertion now records that the
  // definitions exist, so nobody can remove them without this suite saying so.
  // Full coverage lives in test-surf1b2-dietary-restriction-knowledge.ts.
  const bareMeatOnly = household({ hardRestrictions: ['meat'] });
  assert(
    resolveActiveRestrictions(['meat']).length > 0,
    'GAP CLOSED (SURF1B2): "meat" NOW resolves to a canonical restriction definition',
  );
  assert(
    isMealSafeForHousehold(meal('Meatball Sub', ['meatballs', 'bread']), bareMeatOnly).safe === false,
    'a literal "meatball" is still caught for a bare "meat" restriction',
  );
  assert(
    isMealSafeForHousehold(meal('Beef Stew', ['beef shin', 'carrots']), bareMeatOnly).safe === false,
    'and BEEF is now caught too — the substring fallback never could (SURF1B2)',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('4. HARD vs PREFERENCE — the distinction must not blur');

  // A soft preference must NOT become a safety gate.
  const dislikesOlives = household({ hardRestrictions: [], excludedIngredients: ['olives'] });
  assert(
    isMealSafeForHousehold(meal('Greek Salad', ['olives', 'feta', 'tomato']), dislikesOlives).safe === true,
    'a soft excludedIngredient ("olives") does NOT make a meal unsafe — it is a preference',
  );
  assert(
    dislikesOlives.preferences.excludedIngredients.includes('olives') &&
      !dislikesOlives.hardRestrictions.includes('olives'),
    'the soft preference is carried, and carried SEPARATELY from hard restrictions',
  );

  // A hard restriction must NOT decay into a preference.
  const nutAllergy = household({ hardRestrictions: ['Nuts'] });
  assert(
    nutAllergy.hardRestrictions.includes('Nuts') && nutAllergy.preferences.excludedIngredients.length === 0,
    'a hard restriction is never filed as a preference',
  );
  assert(
    nutAllergy.activeRestrictions.map(r => r.id).sort().join(',') === 'peanut,tree_nut',
    '"Nuts" resolves through the canonical library to peanut + tree_nut',
  );
  assert(
    nutAllergy.activeRestrictions.every(r => r.tier === 'major_allergen'),
    'both resolve at the major_allergen tier',
  );

  // The requester's own diet pattern gates their meals; it is not unioned household-wide.
  const veganRequester = household({ hardRestrictions: [], requesterDietPattern: 'Vegan' });
  assert(
    isMealSafeForHousehold(meal('Beef Stew', ['beef', 'carrots']), veganRequester).safe === false,
    "the requester's own Vegan pattern rejects beef",
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('5. FAIL-SAFE — an unresolved context is not an unrestricted household');

  assert(
    isMealSafeForHousehold(meal('Anything At All', ['anything']), UNAVAILABLE).safe === false,
    'an UNAVAILABLE safety context refuses every meal',
  );
  assert(
    isMealSafeForHousehold(meal('Plain Rice', ['rice']), UNAVAILABLE).reason === 'safety-context-unavailable',
    'and says why — safety-context-unavailable',
  );
  assert(
    isSafetyGateActive(UNAVAILABLE) === true,
    'the gate is ACTIVE under an unresolved context — it must run, and refuse',
  );
  assert(
    isSafetyGateActive(household({ hardRestrictions: [] })) === false,
    'the gate is inactive for a genuinely unrestricted household (no cost paid)',
  );

  let threw = false;
  try {
    requireHardRestrictions(UNAVAILABLE);
  } catch (err) {
    threw = err instanceof HouseholdSafetyUnavailableError;
  }
  assert(threw, 'requireHardRestrictions THROWS rather than returning [] — a prompt builder cannot silently omit the restriction block');

  assert(
    requireHardRestrictions(household({ hardRestrictions: ['Nuts'] })).includes('Nuts'),
    'requireHardRestrictions returns the restrictions for a resolved household',
  );
  assert(
    requireHardRestrictions(household({ hardRestrictions: [] })).length === 0,
    'an empty array from a RESOLVED context means "declared none" — a fact, not a failure',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('6. ONE ENGINE — the resolver owns resolution, never rules');

  const resolverSource = readFileSync(
    join(process.cwd(), 'server/lib/household-dietary-safety.ts'),
    'utf-8',
  );
  // Scan CODE, not prose — the module's own doc comment names the library's contents,
  // and a check that cannot tell a comment from a keyword list is not a check.
  const resolverCode = resolverSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  // The resolver must not grow its own allergen vocabulary. If it does, THA has a
  // second dietary rules engine and the canonical library is no longer the owner.
  const FORBIDDEN_KEYWORDS = ['peanut', 'tahini', 'gluten', 'shellfish', 'prawn', 'cheddar', 'ghee'];
  const smuggled = FORBIDDEN_KEYWORDS.filter(k =>
    new RegExp(`['"\`]${k}['"\`]`, 'i').test(resolverCode),
  );
  assert(
    smuggled.length === 0,
    'the resolver defines NO food keyword of its own — it delegates every match',
    smuggled.length ? `smuggled: ${smuggled.join(', ')}` : undefined,
  );
  assert(
    resolverSource.includes('candidateHardExcluded') && resolverSource.includes('shouldExcludeRecipe'),
    'it reaches both existing engines — the restriction library and dietRules',
  );

  const storageSource = readFileSync(join(process.cwd(), 'server/storage.ts'), 'utf-8');
  assert(
    !/dietRestrictions:\s*\[\]/.test(storageSource),
    'storage.ts no longer hardcodes an empty restriction list (CPV1 hh-dropped-restrictions)',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('7. LIVE — the real households, through the real code path');

  let dbReached = false;
  try {
    const { db } = await import('../db.js');
    const { sql } = await import('drizzle-orm');

    const restricted = await db.execute(
      sql`SELECT id FROM users WHERE diet_restrictions IS NOT NULL AND cardinality(diet_restrictions) > 0 ORDER BY id`,
    );
    const rows = (restricted as unknown as { rows: Array<{ id: number }> }).rows ?? [];
    dbReached = true;

    console.log(`  … ${rows.length} users carry a live restriction`);
    assert(rows.length > 0, `the live restriction population is non-empty (${rows.length} users)`);

    let resolvedNonEmpty = 0;
    let resolvedAtAll = 0;
    for (const row of rows) {
      const ctx = await resolveHouseholdSafetyContext(row.id);
      if (ctx.status === 'resolved') resolvedAtAll++;
      if (ctx.hardRestrictions.length > 0) resolvedNonEmpty++;
    }

    assert(
      resolvedAtAll === rows.length,
      `every restricted user's safety context RESOLVES (${resolvedAtAll}/${rows.length})`,
    );
    assert(
      resolvedNonEmpty === rows.length,
      `every restricted user's context carries their restrictions (${resolvedNonEmpty}/${rows.length}) — was 0/${rows.length} before SURF1B`,
    );

    // The AI-facing context — the exact surface DCA1 named.
    const { storage } = await import('../storage.js');
    let aiCarriesRestrictions = 0;
    for (const row of rows) {
      const aiCtx = await storage.getHouseholdDietaryContext(row.id);
      if (aiCtx.aggregated.unionRestrictions.length > 0) aiCarriesRestrictions++;
    }
    assert(
      aiCarriesRestrictions === rows.length,
      `the AI-facing household context carries restrictions for all ${rows.length} — the DCA1 defect, closed`,
    );

    // An unrestricted household still resolves, and still says "none".
    const unrestricted = await db.execute(
      sql`SELECT id FROM users WHERE diet_restrictions IS NULL OR cardinality(diet_restrictions) = 0 ORDER BY id LIMIT 1`,
    );
    const uRows = (unrestricted as unknown as { rows: Array<{ id: number }> }).rows ?? [];
    if (uRows.length) {
      const ctx = await resolveHouseholdSafetyContext(uRows[0].id);
      assert(
        ctx.status === 'resolved',
        'an unrestricted household RESOLVES (it does not fail) — "none declared" is a fact',
      );
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
