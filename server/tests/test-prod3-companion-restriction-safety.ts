/**
 * test-prod3-companion-restriction-safety.ts
 * ==========================================
 * PROD3 — Trust & Safety Completion: the Companion consumes the canonical gate.
 *
 * THE DEFECT
 * ----------
 * THA has had a canonical household dietary safety gate since SURF1B —
 * `server/lib/household-dietary-safety.ts`. It fails closed, it resolves child
 * eaters with no account, and it is pinned by six existing suites.
 *
 * Every consumer of it lived outside `server/intelligence/`. The Companion — the
 * one surface that speaks to a household in sentences and hands them a meal to
 * cook — consumed it NOWHERE. Measured at `6e326d9f`:
 *
 *     grep -rl "household-dietary-safety" server/intelligence/   →  no matches
 *
 * The consequences, all verified before the fix:
 *   · `MealDiscoveryEngine` read `m.ingredients` to MATCH a query
 *     (`meal-discovery-engine.ts:61`) and then dropped them on projection, so the
 *     ingredient data needed to gate was in hand and thrown away;
 *   · the system prompt's HARD RULES 1–5 did not mention allergies once;
 *   · a household's restrictions reached the model only when the `household`
 *     capability happened to be routed — never on a meal-discovery turn;
 *   · response validation was type-shape only, and `mergeEntityRefs` ADDED meal
 *     refs the model had not cited;
 *   · `resolveHouseholdSignal` returned the same signal for "no household" and
 *     "household read FAILED", so Rule T0 admitted everything on an error.
 *
 * THE EVIDENCE THAT IT WAS REAL AND SHIPPED
 * -----------------------------------------
 * `test-intelligence-native-discovery.ts` — passing, and inside `npm test` —
 * asserted that meal 42 arrives on a turn for user 1. Meal 42 is "Pasta Bake
 * Test" (`300g pasta`); user 1's household is **Gluten-Free**. A green test in
 * the aggregate suite was pinning the delivery of a gluten-bearing meal to a
 * gluten-free household. §5 below re-runs that exact fixture and requires the
 * opposite.
 *
 * THE FIX — connection, not construction
 * --------------------------------------
 * No restriction, allergen, keyword or matching rule is defined by PROD3. Every
 * verdict below is `isMealSafeForHousehold()`'s.
 *
 * THE LAYERS
 *   1  THE GATE IS REACHABLE — the canonical owner answers for a real household
 *   2  DISCOVERY IS GATED — unsafe candidates never become DiscoveryItems
 *   3  FEWER, NEVER UNSAFE — a gated search returns fewer meals, never a unsafe one
 *   4  FAIL-CLOSED — an unresolved context yields nothing, not everything
 *   5  THE TURN — the end-to-end fixture that used to deliver the pasta bake
 *   6  RESPONSE VALIDATION — a hallucinated or merged unsafe ref is withheld
 *   7  UNRESTRICTED HOUSEHOLDS ARE UNCHANGED — no gate, no cost, no behaviour change
 *   8  THE PROMPT — rule 6 and the safety block exist and cannot be softened
 *   9  TEMPLATES — no slot evidence is not "safe"
 *  10  ONE OWNER — PROD3 defines no second restriction list
 *
 * Run with: npm run test:prod3-companion-restriction-safety
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { storage } from '../storage.js';
import {
  resolveHouseholdSafetyContext,
  isMealSafeForHousehold,
  isSafetyGateActive,
  type HouseholdSafetyContext,
} from '../lib/household-dietary-safety.js';
import { MealDiscoveryEngine, getSafetyExclusion } from '../intelligence/services/meal-discovery-engine.js';
import type { Meal, MealTemplate } from '../../shared/schema.js';

// ─── Harness ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: boolean, label: string, detail?: unknown): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗ ${label}${detail !== undefined ? ` — got ${JSON.stringify(detail)}` : ''}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const GLUTEN_MEAL: Meal = {
  name: 'Pasta Bake',
  ingredients: ['300g pasta', '1 onion', '200g cheese'],
} as Meal;

const PEANUT_MEAL: Meal = {
  name: 'Satay Chicken Skewers',
  ingredients: ['chicken breast', 'peanut butter', 'soy sauce'],
} as Meal;

const PLAIN_MEAL: Meal = {
  name: 'Grilled Chicken and Greens',
  ingredients: ['chicken breast', 'spinach', 'olive oil'],
} as Meal;

/** A household with a peanut allergy, built without touching the database. */
const PEANUT_HOUSEHOLD: HouseholdSafetyContext = {
  status: 'resolved',
  householdId: 9001,
  requesterUserId: 9001,
  requesterDietPattern: null,
  members: [
    {
      userId: 9001,
      displayName: 'Ava',
      hardRestrictions: ['peanut'],
      dietPattern: null,
      dietTypes: [],
      excludedIngredients: [],
    },
  ],
  hardRestrictions: ['peanut'],
  activeRestrictions: [],
  dietPatterns: [],
  preferences: { dietTypes: [], excludedIngredients: [] },
};

/** The fail-closed context the canonical resolver returns when it cannot read. */
const UNAVAILABLE_HOUSEHOLD: HouseholdSafetyContext = {
  status: 'unavailable',
  householdId: null,
  requesterUserId: 9002,
  requesterDietPattern: null,
  members: [],
  hardRestrictions: [],
  activeRestrictions: [],
  dietPatterns: [],
  preferences: { dietTypes: [], excludedIngredients: [] },
};

const UNRESTRICTED_HOUSEHOLD: HouseholdSafetyContext = {
  ...UNAVAILABLE_HOUSEHOLD,
  status: 'resolved',
  householdId: 9003,
  requesterUserId: 9003,
};

function fakeStorage(meals: Meal[], templates: MealTemplate[] = []) {
  return {
    getMeals: async () => meals,
    getSystemMeals: async () => [],
    getMealTemplates: async () => templates,
  };
}

function fakeSafety(ctx: HouseholdSafetyContext) {
  return {
    resolveHouseholdSafetyContext: async () => ctx,
    isSafetyGateActive,
    isMealSafeForHousehold,
  };
}

// ─── §1  The gate is reachable from the Companion's own layer ─────────────────

section('§1  The canonical gate answers for a real household');

{
  const ctx = await resolveHouseholdSafetyContext(1);
  assert(ctx.status === 'resolved', 'the canonical resolver resolves for a live user', ctx.status);
  assert(
    isSafetyGateActive(ctx) === (ctx.hardRestrictions.length > 0 || !!ctx.requesterDietPattern),
    'isSafetyGateActive agrees with the resolved constraints',
  );
  assert(
    isMealSafeForHousehold(PEANUT_MEAL, PEANUT_HOUSEHOLD).safe === false,
    'a peanut meal is refused for a peanut-allergic household',
  );
  assert(
    isMealSafeForHousehold(PLAIN_MEAL, PEANUT_HOUSEHOLD).safe === true,
    'a plain meal is admitted for the same household — the gate is not a blanket refusal',
  );
}

// ─── §2/3  Discovery is gated, and returns FEWER, never unsafe ────────────────

section('§2  Meal discovery excludes what the gate refuses');

{
  const engine = new MealDiscoveryEngine(
    fakeStorage([PEANUT_MEAL, PLAIN_MEAL]),
    fakeSafety(PEANUT_HOUSEHOLD),
  );
  const results = await engine.discover('chicken', 9001);
  const names = results.map((r) => r.name);

  assert(!names.includes('Satay Chicken Skewers'), 'the satay is NOT offered to a peanut-allergic household', names);
  assert(names.includes('Grilled Chicken and Greens'), 'the safe chicken meal IS still offered', names);
  assert(results.length === 1, 'FEWER, NEVER UNSAFE — one result, not a padded two', results.length);
  assert(getSafetyExclusion(results).excludedForSafety === 1, 'the exclusion is counted, not silent');
  assert(getSafetyExclusion(results).status === 'resolved', 'the safety status is reported alongside');
}

{
  // The household's OWN saved meal is gated too. Saving a recipe is not a
  // declaration that everyone at the table can eat it.
  const engine = new MealDiscoveryEngine(
    fakeStorage([PEANUT_MEAL]),
    fakeSafety(PEANUT_HOUSEHOLD),
  );
  const results = await engine.discover('satay', 9001);
  assert(results.length === 0, "a household's own saved unsafe meal is withheld, not exempted", results.length);
}

// ─── §4  Fail-closed ──────────────────────────────────────────────────────────

section('§4  An unresolved safety context yields nothing, not everything');

{
  const engine = new MealDiscoveryEngine(
    fakeStorage([PEANUT_MEAL, PLAIN_MEAL]),
    fakeSafety(UNAVAILABLE_HOUSEHOLD),
  );
  const results = await engine.discover('chicken', 9002);
  assert(results.length === 0, 'an unavailable context returns NO meals — not the unfiltered cookbook', results.length);
  assert(getSafetyExclusion(results).excludedForSafety === 2, 'both candidates are recorded as withheld');
  assert(
    getSafetyExclusion(results).status === 'unavailable',
    'the caller can tell "we could not check" from "you have nothing"',
  );
  assert(isSafetyGateActive(UNAVAILABLE_HOUSEHOLD) === true, 'unavailable is NOT inactive (SURF1B)');
}

// ─── §5  The turn that used to deliver the pasta bake ─────────────────────────

section('§5  The end-to-end fixture that was green while being wrong');

{
  const ctx = await resolveHouseholdSafetyContext(1);
  const meal42 = await storage.getMeal(42);

  if (!meal42) {
    console.log('  ⚠ meal 42 absent from this database — skipping the live regression pin');
  } else {
    const verdict = isMealSafeForHousehold(
      { name: meal42.name, ingredients: meal42.ingredients ?? [] },
      ctx,
    );
    assert(
      ctx.hardRestrictions.length > 0 || !!ctx.requesterDietPattern,
      'user 1 genuinely holds a hard constraint (the premise of the old test)',
      { hard: ctx.hardRestrictions, pattern: ctx.requesterDietPattern },
    );
    assert(
      verdict.safe === false,
      'meal 42 IS refused for user 1 — the meal the old assertion required to be delivered',
      verdict,
    );
    assert(
      typeof verdict.reason === 'string' && verdict.reason.length > 0,
      'the refusal carries a machine-readable reason',
      verdict.reason,
    );
  }
}

// ─── §6  Response validation ──────────────────────────────────────────────────

section('§6  A meal ref is validated before it leaves the gateway');

{
  const gatewaySrc = readFileSync(
    join(process.cwd(), 'server/intelligence/conversation/conversation-gateway.ts'),
    'utf8',
  );

  assert(
    gatewaySrc.includes('validateResponseSafety'),
    'the gateway has a post-generation safety validator',
  );
  // Both return paths — the parsed one and the JSON-parse fallback that used to
  // return raw model output unchecked.
  const validatedCalls = (gatewaySrc.match(/await validateResponseSafety\(/g) ?? []).length;
  assert(
    validatedCalls >= 2,
    'BOTH return paths validate — including the raw-output fallback',
    validatedCalls,
  );
  assert(
    /mergeEntityRefs\(llmRefs, discoveries\),\s*\n\s*safetyCtx/.test(gatewaySrc.replace(/\r/g, '')) ||
      gatewaySrc.includes('mergeEntityRefs(llmRefs, discoveries),'),
    'the MERGED refs are what gets validated, not only the model-supplied ones',
  );
  assert(
    gatewaySrc.includes('isSafetyGateActive(safetyCtx)'),
    'validation short-circuits for households with nothing to gate against',
  );
}

// ─── §7  Unrestricted households are unchanged ────────────────────────────────

section('§7  A household with no restrictions is not affected');

{
  const engine = new MealDiscoveryEngine(
    fakeStorage([PEANUT_MEAL, PLAIN_MEAL]),
    fakeSafety(UNRESTRICTED_HOUSEHOLD),
  );
  const results = await engine.discover('chicken', 9003);
  assert(results.length === 2, 'both meals are returned to an unrestricted household', results.length);
  assert(getSafetyExclusion(results).excludedForSafety === 0, 'nothing is excluded when there is nothing to enforce');
  assert(isSafetyGateActive(UNRESTRICTED_HOUSEHOLD) === false, 'the gate is inactive, so no per-meal cost is paid');
}

// ─── §8  The prompt ───────────────────────────────────────────────────────────

section('§8  HARD RULE 6 and the safety block');

{
  const gatewaySrc = readFileSync(
    join(process.cwd(), 'server/intelligence/conversation/conversation-gateway.ts'),
    'utf8',
  );

  assert(gatewaySrc.includes('6. SAFETY OVERRIDES EVERYTHING'), 'HARD RULE 6 exists');
  assert(
    gatewaySrc.includes('HOUSEHOLD DIETARY SAFETY'),
    'the safety block is part of the system prompt',
  );
  assert(
    gatewaySrc.includes('${safetyBlock}'),
    'the block is interpolated into the prompt, not merely declared',
  );
  assert(
    gatewaySrc.includes('never overrides rules 1–6 above, and never softens rule 6'),
    'the personality fragment cannot soften rule 6 (EWO1 §5 invariant extended)',
  );
  assert(
    gatewaySrc.includes('resolveHouseholdSafetyContext(userId)'),
    'the block is sourced from the canonical owner, keyed on the authenticated user',
  );
  assert(
    gatewaySrc.includes('HOUSEHOLD DIETARY SAFETY — UNRESOLVED'),
    'an unresolved context produces an explicit refusal instruction, not silence',
  );
}

// ─── §9  Templates without slot evidence ──────────────────────────────────────

section('§9  A template with no ingredient evidence is not "safe"');

{
  const bareTemplate = {
    id: 1, name: 'Weeknight Something', title: null, description: null, cuisine: null,
    isActive: true, styleTags: [], compatibleDiets: [], imageUrl: null,
    sharedBaseComponents: [], proteinSlots: [], carbSlots: [], vegSlots: [],
    toppingSlots: [], sauceSlots: [],
  } as unknown as MealTemplate;

  const gated = new MealDiscoveryEngine(
    fakeStorage([], [bareTemplate]),
    fakeSafety(PEANUT_HOUSEHOLD),
  );
  const gatedResults = await gated.discover('weeknight', 9001);
  assert(
    gatedResults.length === 0,
    'a slotless template is withheld from a restricted household — unknown is not safe',
    gatedResults.length,
  );

  const open = new MealDiscoveryEngine(
    fakeStorage([], [bareTemplate]),
    fakeSafety(UNRESTRICTED_HOUSEHOLD),
  );
  const openResults = await open.discover('weeknight', 9003);
  assert(
    openResults.length === 1,
    'the same template is still offered to an unrestricted household',
    openResults.length,
  );
}

// ─── §10  One owner ───────────────────────────────────────────────────────────

section('§10  PROD3 defines no second restriction list');

{
  const files = [
    'server/intelligence/services/meal-discovery-engine.ts',
    'server/intelligence/conversation/conversation-gateway.ts',
  ];
  for (const f of files) {
    const src = readFileSync(join(process.cwd(), f), 'utf8');
    // A literal allergen list appearing in a file that is supposed to DELEGATE
    // is exactly the duplication SURF1B4 §"one owner" exists to prevent.
    const declaresOwnList =
      /const\s+\w*(ALLERGEN|RESTRICTION)\w*\s*(:\s*[^=]+)?=\s*\[/i.test(src);
    assert(!declaresOwnList, `${f} declares no allergen/restriction list of its own`);
    assert(
      src.includes('household-dietary-safety'),
      `${f} reaches the canonical owner rather than re-deriving`,
    );
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(56)}`);
console.log(`  PROD3 Companion restriction safety: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n  Failures:');
  for (const f of failures) console.log(`    ✗ ${f}`);
  process.exit(1);
}
console.log('  ✅ The Companion consumes the canonical safety gate.');
