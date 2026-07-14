/**
 * test-surf1b3-onboarding-allergy-safety-routing.ts
 * =================================================
 * SURF1B3 — routing onboarding allergies to the canonical hard-restriction owner.
 *
 * SURF1B restored the safety PATH. SURF1B2 completed the KNOWLEDGE. Both closed by
 * naming what they could not fix, and SURF1B2's second limitation was this:
 *
 *   "Onboarding files declared allergies as SOFT preferences. A household that
 *    declares a nut allergy during onboarding has it stored as 'try to avoid', not
 *    'must never be violated', and it does not enter the hard restriction union."
 *
 * The path was sound. The knowledge was complete. **The front door was posting the
 * letter to the wrong address.**
 *
 * The layers below are ordered by what each one protects:
 *
 *   1. NEGATIVE CONTROL — pins the DEFECT, not the fix. A soft exclusion is not a
 *                         safety gate and never was. These assertions state what the
 *                         old write path could not do, and must pass forever.
 *   2. ROUTING          — chips are hard; dislikes are soft; free text is asked of the
 *                         canonical library, value by value.
 *   3. VOCABULARY       — the trap that would have made the fix worse than the defect:
 *                         onboarding must write the vocabulary the profile owns, and
 *                         the profile door must accept everything onboarding can write.
 *   4. WRITE DOORS      — the routes actually call the router. Source-level, so the
 *                         doors cannot drift away from the functions under test.
 *   5. LEGACY CLIENTS   — a pre-SURF1B3 browser still files allergies as preferences.
 *                         The server door corrects them. Same function as the repair.
 *   6. END TO END (DB)  — a real user, a real write, the real resolver: a nut allergy
 *                         entered at onboarding reaches household safety resolution and
 *                         the AI context, and an unsafe meal is REFUSED.
 *   7. SEPARATION       — a mixed allergy + preference submission stays separated all
 *                         the way to the model. A dislike never becomes a gate.
 *   8. REJECTION        — THA does not store a restriction it cannot enforce.
 *   9. FAIL-CLOSED      — SURF1B's behaviour, unchanged. Nothing here weakens it.
 *  10. ONE ENGINE       — the router must never grow a food keyword of its own.
 *  11. LIVE DATA        — the real database: nothing duplicated, nothing lost.
 *
 * Run with: npx tsx server/tests/test-surf1b3-onboarding-allergy-safety-routing.ts
 */

import {
  routeOnboardingDietarySelections,
  promoteSoftAllergies,
  canonicaliseDeclaredRestriction,
  parseOtherRestrictionText,
  DECLARABLE_HARD_RESTRICTIONS,
  ONBOARDING_OTHER_VALUE,
} from '../../shared/onboarding-restrictions.js';
import {
  isEnforceableRestriction,
  unenforceableRestrictions,
} from '../../shared/restrictions/restriction-resolver.js';
import {
  isMealSafeForHousehold,
  isSafetyGateActive,
  resolveHouseholdSafetyContext,
  type HouseholdSafetyContext,
} from '../lib/household-dietary-safety.js';
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

/** A resolved single-member household, built by hand for the pure-gate assertions. */
function household(opts: {
  hard?: string[];
  soft?: string[];
  pattern?: string | null;
}): HouseholdSafetyContext {
  const hard = opts.hard ?? [];
  return {
    status: 'resolved',
    householdId: 1,
    requesterUserId: 1,
    requesterDietPattern: opts.pattern ?? null,
    members: [
      {
        userId: 1,
        displayName: 'Test',
        hardRestrictions: hard,
        dietPattern: opts.pattern ?? null,
        dietTypes: [],
        excludedIngredients: opts.soft ?? [],
      },
    ],
    hardRestrictions: hard,
    activeRestrictions: [] as any,
    dietPatterns: [opts.pattern ?? null],
    preferences: { dietTypes: [], excludedIngredients: opts.soft ?? [] },
  } as HouseholdSafetyContext;
}

/** Rebuild `activeRestrictions` the way the real resolver does. */
async function resolved(opts: { hard?: string[]; soft?: string[]; pattern?: string | null }) {
  const { resolveActiveRestrictions } = await import('../../shared/restrictions/restriction-resolver.js');
  const ctx = household(opts);
  (ctx as any).activeRestrictions = resolveActiveRestrictions(ctx.hardRestrictions);
  return ctx;
}

const SATAY = { name: 'Chicken Satay Skewers', ingredients: ['chicken thigh', 'peanut butter', 'soy sauce', 'lime'] };
const SAFE_MEAL = { name: 'Grilled Chicken Salad', ingredients: ['chicken breast', 'lettuce', 'tomato', 'olive oil'] };
const OLIVE_MEAL = { name: 'Greek Salad', ingredients: ['cucumber', 'tomato', 'kalamata olives', 'feta'] };
const MUSHROOM_MEAL = { name: 'Mushroom Risotto', ingredients: ['arborio rice', 'chestnut mushrooms', 'parmesan'] };

async function main() {
  console.log('\n═══ SURF1B3 — Onboarding Allergy Safety Routing ═══');

  // ═══════════════════════════════════════════════════════════════════════════
  section('1. NEGATIVE CONTROL — what the old write path could not do');
  //
  // These pin the DEFECT. They assert that a soft exclusion is not, and never was, a
  // safety gate — which is exactly why filing an allergy there was the bug. They must
  // keep passing forever: the day one of them fails, someone has quietly made
  // `excludedIngredients` a hard gate inside the canonical resolver, and the hard/soft
  // distinction SURF1B drew has collapsed.

  const oldWorld = await resolved({ hard: [], soft: ['nuts'] });
  assert(
    isMealSafeForHousehold(SATAY, oldWorld).safe,
    'a nut allergy stored ONLY as a soft exclusion does NOT stop a satay — the defect, pinned',
    'this must stay true: it is the definition of "soft"',
  );
  assert(
    oldWorld.hardRestrictions.length === 0,
    'a soft exclusion contributes NOTHING to the hard restriction union',
  );
  assert(
    !isSafetyGateActive(oldWorld),
    'the safety gate does not even ACTIVATE for a household whose only allergy is a soft exclusion',
  );

  // And the fix, stated as its mirror image.
  const newWorld = await resolved({ hard: ['Nuts'], soft: [] });
  assert(
    !isMealSafeForHousehold(SATAY, newWorld).safe,
    'the SAME allergy, routed to users.diet_restrictions, REFUSES the satay',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('2. ROUTING — chips are hard, dislikes are soft, free text is asked');

  const nutOnly = routeOnboardingDietarySelections({ allergies: ['Nuts'] });
  assert(
    nutOnly.hardRestrictions.includes('Nuts') && nutOnly.hardRestrictions.length === 1,
    'a nut allergy selected at onboarding becomes a HARD restriction',
  );
  assert(
    nutOnly.softExclusions.length === 0,
    '…and nothing lands in the soft preference list',
  );

  const allSeven = routeOnboardingDietarySelections({
    allergies: DECLARABLE_HARD_RESTRICTIONS.map(r => r.value),
  });
  assert(
    allSeven.hardRestrictions.length === DECLARABLE_HARD_RESTRICTIONS.length &&
      allSeven.softExclusions.length === 0,
    `all ${DECLARABLE_HARD_RESTRICTIONS.length} declarable chips route to HARD restrictions, none to soft`,
  );

  const dislike = routeOnboardingDietarySelections({ allergies: [], dislikes: ['olives'] });
  assert(
    dislike.softExclusions.includes('olives') && dislike.hardRestrictions.length === 0,
    'a dislike ("olives") remains a SOFT preference — it is never promoted',
  );

  const enforceableDislike = routeOnboardingDietarySelections({ allergies: [], dislikes: ['eggs'] });
  assert(
    enforceableDislike.softExclusions.includes('eggs') &&
      enforceableDislike.hardRestrictions.length === 0,
    'a dislike is not promoted even when it IS enforceable — "I don\'t like eggs" is not "eggs will hurt me"',
  );

  const freeTextKnown = routeOnboardingDietarySelections({
    allergies: [ONBOARDING_OTHER_VALUE],
    otherText: 'mustard',
  });
  assert(
    freeTextKnown.hardRestrictions.includes('mustard') && freeTextKnown.unenforceable.length === 0,
    'free-text "mustard" — enforceable by the library, chip-less in the UI — becomes a HARD restriction',
  );

  const freeTextUnknown = routeOnboardingDietarySelections({
    allergies: [ONBOARDING_OTHER_VALUE],
    otherText: 'mushrooms',
  });
  assert(
    freeTextUnknown.hardRestrictions.length === 0 &&
      freeTextUnknown.softExclusions.includes('mushrooms') &&
      freeTextUnknown.unenforceable.includes('mushrooms'),
    'free-text "mushrooms" — which the library cannot enforce — stays SOFT and is named back to the household',
  );

  assert(
    parseOtherRestrictionText('sesame, mustard and fish').length === 3,
    'free text is split into the individual things the household named ("sesame, mustard and fish" → 3)',
  );

  const mixedText = routeOnboardingDietarySelections({
    allergies: ['Nuts', ONBOARDING_OTHER_VALUE],
    otherText: 'mustard, mushrooms',
  });
  assert(
    mixedText.hardRestrictions.includes('Nuts') &&
      mixedText.hardRestrictions.includes('mustard') &&
      mixedText.softExclusions.includes('mushrooms') &&
      !mixedText.hardRestrictions.includes('mushrooms'),
    'one free-text box, split by the library: "mustard" is enforced, "mushrooms" is avoided',
  );

  const dupe = routeOnboardingDietarySelections({
    allergies: ['Dairy-Free', ONBOARDING_OTHER_VALUE],
    otherText: 'dairy',
  });
  assert(
    dupe.hardRestrictions.length === 1 && dupe.hardRestrictions[0] === 'Dairy-Free',
    'the Dairy chip AND typed "dairy" produce ONE restriction — deduplicated canonically, not textually',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('3. VOCABULARY — the trap that would have made the fix worse than the defect');
  //
  // Onboarding used to key its chips `nuts`/`dairy`/`gluten`; the profile keys its
  // chips `Nuts`/`Dairy-Free`/`Gluten-Free`. Routing the onboarding value verbatim into
  // `users.diet_restrictions` would have stored a restriction the profile page cannot
  // render as selected — and, under the profile's old seven-literal enum, could not
  // re-save without a 400. The household would have declared an allergy and then been
  // locked out of their own profile by it.

  for (const chip of DECLARABLE_HARD_RESTRICTIONS) {
    assert(
      isEnforceableRestriction(chip.value),
      `the "${chip.onboardingLabel}" chip resolves to an ENFORCEABLE canonical restriction ("${chip.value}")`,
    );
  }

  assert(
    canonicaliseDeclaredRestriction('dairy') === 'Dairy-Free' &&
      canonicaliseDeclaredRestriction('nuts') === 'Nuts' &&
      canonicaliseDeclaredRestriction('gluten') === 'Gluten-Free',
    'a legacy lower-cased value is rewritten into the vocabulary the profile owns — derived from the library, not from an alias table',
  );
  assert(
    canonicaliseDeclaredRestriction('mustard') === 'mustard',
    '…and an enforceable value THA offers no chip for is left exactly as declared',
  );

  const routesSource = readFileSync(join(process.cwd(), 'server/routes.ts'), 'utf-8');
  // Scan CODE, not prose. The retirement is recorded in a comment that necessarily names
  // the thing it retired, and a check that cannot tell the two apart would fail on the
  // very note explaining why it passes.
  const routesCode = routesSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  assert(
    !/ALLOWED_DIET_RESTRICTIONS/.test(routesCode),
    'the profile door\'s hand-written seven-literal enum is RETIRED — the last door that answered "can we enforce this?" from a list',
  );
  assert(
    /dietRestrictions:\s*hardRestrictionsSchema/.test(routesCode),
    'PUT /api/profile now validates dietRestrictions through the canonical library, like every other door since SURF1B2',
  );

  // Every value onboarding can now write must survive the household's next profile save.
  const writable = [
    ...DECLARABLE_HARD_RESTRICTIONS.map(r => r.value),
    'mustard', 'meat', 'fish', 'honey', 'coconut',
  ];
  assert(
    unenforceableRestrictions(writable).length === 0,
    'every value onboarding can route to the owner passes the profile write door — no household can be locked out of its own profile',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('4. WRITE DOORS — the routes call the router');

  assert(
    /promoteSoftAllergies/.test(routesCode),
    'POST /api/user/complete-onboarding routes soft allergy values through the canonical promoter',
  );
  assert(
    /profileUpdate\.dietRestrictions\s*=\s*hardRestrictions/.test(routesCode),
    '…and writes the result to users.diet_restrictions — the canonical hard-restriction owner',
  );

  const onboardingSource = readFileSync(join(process.cwd(), 'client/src/pages/onboarding-page.tsx'), 'utf-8');
  assert(
    /dietRestrictions:\s*routed\.hardRestrictions/.test(onboardingSource),
    'the onboarding client submits allergies as dietRestrictions (HARD), not as excludedIngredients',
  );
  assert(
    /excludedIngredients:\s*routed\.softExclusions/.test(onboardingSource),
    '…and submits only genuine preferences as excludedIngredients (SOFT) — the payload separates the two facts',
  );
  assert(
    /savedProfile\.dietRestrictions/.test(onboardingSource),
    'the onboarding form READS allergies back from the hard owner too — the read-side face of the same defect, closed',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('5. LEGACY CLIENTS — a cached browser cannot file an allergy as a preference');
  //
  // The client is not the enforcement point. A browser still running the pre-SURF1B3
  // bundle sends its allergy chips as soft exclusions, and would keep doing so for as
  // long as that tab stays open. The server door corrects it.

  const legacy = promoteSoftAllergies({
    softExclusions: ['nuts', 'dairy'],   // the old lower-cased onboarding chip values
    hardRestrictions: [],
  });
  assert(
    legacy.promote.includes('Nuts') && legacy.promote.includes('Dairy-Free'),
    'a pre-SURF1B3 payload\'s allergy chips are routed to the hard owner, in the canonical vocabulary',
  );
  assert(
    legacy.remainingSoft.length === 0,
    '…and MOVE out of the soft list — one fact, one owner, no duplicate',
  );

  const legacyMixed = promoteSoftAllergies({
    softExclusions: ['nuts', 'mushrooms'],
    hardRestrictions: [],
  });
  assert(
    legacyMixed.promote.includes('Nuts') && legacyMixed.remainingSoft.includes('mushrooms'),
    'a mixed legacy payload separates correctly: the allergy is promoted, the preference is preserved',
  );

  const alreadyHeld = promoteSoftAllergies({
    softExclusions: ['dairy'],
    hardRestrictions: ['Dairy-Free'],
  });
  assert(
    alreadyHeld.promote.length === 0,
    'a value the hard owner ALREADY holds is not promoted again — canonically compared, so "dairy" ≡ "Dairy-Free"',
  );

  const twice = promoteSoftAllergies({
    softExclusions: legacy.remainingSoft,
    hardRestrictions: legacy.promote,
  });
  assert(
    twice.noop,
    'the promotion is IDEMPOTENT — running it a second time is a no-op, so the repair can be re-run safely',
  );

  const nothing = promoteSoftAllergies({ softExclusions: ['mushrooms'], hardRestrictions: [] });
  assert(
    nothing.noop && nothing.remainingSoft.includes('mushrooms'),
    'a household with only preferences is left completely untouched',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('6. END TO END — a real user, a real write, the real resolver');

  let dbReached = false;
  let testUserId: number | null = null;
  try {
    const { storage } = await import('../storage.js');
    const { db } = await import('../db.js');
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`SELECT 1`);
    dbReached = true;

    // A brand-new household, exactly as registration creates one.
    const user = await storage.createUser({
      username: `surf1b3-test-${Date.now()}`,
      password: 'x'.repeat(40),
      email: `surf1b3-${Date.now()}@test.invalid`,
    } as any);
    testUserId = user.id;

    // The onboarding submission: a nut allergy, and a genuine dislike of mushrooms.
    // Routed exactly as the door routes it.
    const routed = routeOnboardingDietarySelections({
      allergies: ['Nuts', ONBOARDING_OTHER_VALUE],
      otherText: 'mushrooms',
    });
    await storage.updateUserProfile(user.id, { dietRestrictions: routed.hardRestrictions } as any);
    await storage.upsertUserPreferences(user.id, {
      excludedIngredients: routed.softExclusions,
    } as any);

    // → Household safety resolution
    const ctx = await resolveHouseholdSafetyContext(user.id);
    assert(ctx.status === 'resolved', 'the onboarded household\'s safety context RESOLVES');
    assert(
      ctx.hardRestrictions.includes('Nuts'),
      'the nut allergy entered at onboarding reaches HOUSEHOLD SAFETY RESOLUTION as a hard restriction',
    );
    assert(
      ctx.activeRestrictions.some(r => r.id === 'peanut') &&
        ctx.activeRestrictions.some(r => r.id === 'tree_nut'),
      '…and resolves through the canonical library to peanut + tree_nut',
    );
    assert(
      isSafetyGateActive(ctx),
      '…and the meal safety gate is ACTIVE for this household',
    );

    // → Recommendation gate
    assert(
      !isMealSafeForHousehold(SATAY, ctx).safe,
      'an UNSAFE meal (chicken satay — peanut butter) is REJECTED',
    );
    assert(
      isMealSafeForHousehold(SAFE_MEAL, ctx).safe,
      '…and a safe meal is still served — the gate does not over-reject',
    );

    // → AI context (INT17). The Companion must see the allergy as a hard restriction.
    const aiCtx: any = await storage.getHouseholdDietaryContext(user.id);
    assert(
      (aiCtx.aggregated?.unionRestrictions ?? []).includes('Nuts'),
      'the nut allergy reaches the AI-FACING HOUSEHOLD CONTEXT as a HARD restriction (unionRestrictions)',
    );
    assert(
      !(aiCtx.aggregated?.unionExclusions ?? []).includes('Nuts'),
      '…and is NOT filed under preferences, where the Companion would be told merely to "try to avoid" it',
    );

    // ═════════════════════════════════════════════════════════════════════════
    section('7. SEPARATION — the dislike, in the same submission, stays a preference');

    assert(
      (aiCtx.aggregated?.unionExclusions ?? []).includes('mushrooms'),
      'the mushroom dislike, submitted at the same moment, reaches the AI context as a SOFT preference',
    );
    assert(
      !ctx.hardRestrictions.includes('mushrooms'),
      '…and is absent from the hard restriction union — a preference is never a gate',
    );
    assert(
      isMealSafeForHousehold(MUSHROOM_MEAL, ctx).safe,
      '…so a mushroom risotto is NOT unsafe. It is merely not their favourite.',
    );
    assert(
      isMealSafeForHousehold(OLIVE_MEAL, ctx).safe,
      'and an unrelated meal is unaffected by either fact',
    );
    console.log(
      `  … one submission, two owners: hard=${JSON.stringify(ctx.hardRestrictions)} ` +
        `soft=${JSON.stringify(aiCtx.aggregated?.unionExclusions ?? [])}`,
    );
  } catch (err) {
    if (!dbReached) {
      console.log('  … database unreachable — END TO END section skipped');
    } else {
      console.error('  ✗ FAIL: END TO END section errored', err);
      failed++;
    }
  } finally {
    if (testUserId != null) {
      try {
        const { db } = await import('../db.js');
        const { sql } = await import('drizzle-orm');
        await db.execute(sql`DELETE FROM users WHERE id = ${testUserId}`);
      } catch { /* best effort — the row is inert either way */ }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  section('8. REJECTION — THA does not store a restriction it cannot enforce');

  assert(
    unenforceableRestrictions(['kiwi']).length === 1,
    'an unenforceable value ("kiwi") is rejected by the canonical write-door check',
  );
  assert(
    unenforceableRestrictions(['Nuts', 'kiwi', 'Sesame']).join() === 'kiwi',
    '…and the door names exactly which value it cannot enforce, not the whole submission',
  );

  const invalid = routeOnboardingDietarySelections({
    allergies: [ONBOARDING_OTHER_VALUE],
    otherText: 'kiwi',
  });
  assert(
    invalid.hardRestrictions.length === 0,
    'the router never routes an unenforceable value to the hard owner — the door would 400 on it, and the household would be locked out',
  );
  assert(
    invalid.unenforceable.includes('kiwi'),
    '…it reports it instead, so the household is TOLD rather than left to assume a guarantee that does not exist',
  );
  assert(
    invalid.softExclusions.includes('kiwi'),
    '…and nothing the household typed is discarded — it is still avoided where possible',
  );

  assert(
    /text-onboarding-unenforceable-allergy/.test(onboardingSource),
    'the onboarding screen SAYS SO — what the household is told and what THA stores come from the same routing call',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('9. FAIL-CLOSED — SURF1B\'s behaviour, unchanged');

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
    !isMealSafeForHousehold(SAFE_MEAL, unavailable).safe,
    'an unresolvable safety context still REFUSES every meal — SURF1B\'s fail-closed rule is untouched',
  );
  assert(
    isSafetyGateActive(unavailable),
    '…and the gate stays ACTIVE rather than short-circuiting into "everything is compliant"',
  );

  const empty = await resolved({ hard: [], soft: [] });
  assert(
    isMealSafeForHousehold(SAFE_MEAL, empty).safe,
    'an EMPTY restriction list from a RESOLVED context is still served as the fact it is — "none declared" ≠ "could not find out"',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('10. ONE ENGINE — the router owns routing, and owns nothing else');

  const routerSource = readFileSync(join(process.cwd(), 'shared/onboarding-restrictions.ts'), 'utf-8');
  // Scan CODE, not prose — the module's doc comment names the library's contents, and a
  // check that cannot tell a comment from a keyword list is not a check.
  const routerCode = routerSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  const FORBIDDEN = ['peanut', 'tahini', 'anchovy', 'prawn', 'cheddar', 'ghee', 'beef', 'gelatine'];
  const leaked = FORBIDDEN.filter(k => new RegExp(`\\b${k}`, 'i').test(routerCode));
  assert(
    leaked.length === 0,
    'the routing module contains NO food keyword of its own — it defines what is hard, never what is nuts',
    leaked.length ? `leaked: ${leaked.join(', ')}` : undefined,
  );
  assert(
    /restriction-resolver/.test(routerCode),
    '…every judgement of enforceability is delegated to the canonical restriction library',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('11. LIVE DATA — the real database: nothing duplicated, nothing lost');

  let liveReached = false;
  try {
    const { db } = await import('../db.js');
    const { sql } = await import('drizzle-orm');
    const result: any = await db.execute(sql`
      SELECT u.id, u.diet_restrictions, p.excluded_ingredients
      FROM users u
      LEFT JOIN user_preferences p ON p.user_id = u.id
      WHERE p.excluded_ingredients IS NOT NULL
        AND array_length(p.excluded_ingredients, 1) > 0
      ORDER BY u.id
    `);
    liveReached = true;
    const rows = (result.rows ?? result) as Array<{
      id: number;
      diet_restrictions: string[] | null;
      excluded_ingredients: string[] | null;
    }>;
    console.log(`  … ${rows.length} live user(s) carry an excluded ingredient`);

    // The audit that justifies the migration — or, here, justifies not needing one.
    const needingRepair = rows.filter(
      r =>
        !promoteSoftAllergies({
          softExclusions: r.excluded_ingredients ?? [],
          hardRestrictions: r.diet_restrictions ?? [],
        }).noop,
    );
    assert(
      needingRepair.length === 0,
      `NO live user holds an allergy ONLY as a soft exclusion (${rows.length} checked) — the repair set is empty, and this assertion is what proves it`,
      needingRepair.length ? `users: ${needingRepair.map(r => r.id).join(', ')}` : undefined,
    );

    // Genuine preferences survive. This is the assertion that would fail if the repair
    // criterion were ever loosened into "promote anything that looks like a food".
    const mushroomUsers = rows.filter(r => (r.excluded_ingredients ?? []).includes('mushrooms'));
    for (const r of mushroomUsers) {
      const plan = promoteSoftAllergies({
        softExclusions: r.excluded_ingredients ?? [],
        hardRestrictions: r.diet_restrictions ?? [],
      });
      assert(
        plan.remainingSoft.includes('mushrooms') && !plan.promote.includes('mushrooms'),
        `live user ${r.id}'s "mushrooms" preference is PRESERVED and never promoted to a hard restriction`,
      );
    }

    // Nothing is lost: every value in a soft list either stays there or moves to the
    // hard owner. No value may simply disappear.
    let lossless = true;
    for (const r of rows) {
      const before = r.excluded_ingredients ?? [];
      const plan = promoteSoftAllergies({
        softExclusions: before,
        hardRestrictions: r.diet_restrictions ?? [],
      });
      const accounted = new Set([...plan.remainingSoft, ...plan.promote.map(p => p.toLowerCase())]);
      for (const v of before) {
        // A value is accounted for if it stays soft, or if its canonical form was promoted.
        if (!plan.remainingSoft.includes(v) &&
            !plan.promote.some(p => canonicaliseDeclaredRestriction(v) === p)) {
          lossless = false;
        }
      }
      void accounted;
    }
    assert(lossless, 'every live soft value is either KEPT as a preference or MOVED to the hard owner — none is lost');

    // And no live restriction is duplicated across both owners by the repair.
    let noDupes = true;
    for (const r of rows) {
      const plan = promoteSoftAllergies({
        softExclusions: r.excluded_ingredients ?? [],
        hardRestrictions: r.diet_restrictions ?? [],
      });
      if (plan.promote.some(p => plan.remainingSoft.includes(p))) noDupes = false;
      if (new Set(plan.promote).size !== plan.promote.length) noDupes = false;
    }
    assert(noDupes, 'the repair never DUPLICATES a restriction — a promoted value leaves the soft list as it enters the hard one');
  } catch (err) {
    if (!liveReached) {
      console.log('  … database unreachable — LIVE DATA section skipped');
    } else {
      console.error('  ✗ FAIL: LIVE DATA section errored', err);
      failed++;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n═══ ${passed} passed, ${failed} failed ═══\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
