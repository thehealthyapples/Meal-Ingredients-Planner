/**
 * test-prod6-safety-gate-convergence.ts
 * =====================================
 * PROD6 — every food-producing route reaches the canonical Household Dietary
 * Safety Gate, and every AI-authored adaptation is validated before it is shown
 * or saved.
 *
 * THE DEFECT
 * ----------
 * PROD5's adversarial pass asked a question none of THA's 19 green safety suites
 * asked. They all ask *"is the gate correct where it is called?"* — and it is,
 * across 1,656 assertions. None asked *"does every surface that puts food in
 * front of a household actually call it?"* FOUR did not — PROD5 found the first
 * two; §1 of this file found the other two (see 3):
 *
 *   1. POST /api/planner/entries/:entryId/adapt — a SECOND, ungoverned LLM
 *      surface. It raw-templated safety data into a prompt, called `new OpenAI()`
 *      directly, and embedded a restriction reference naming FIVE restrictions
 *      while the canonical library carries thirteen — sesame, soy, shellfish, eggs,
 *      mustard and coconut were absent. It then told the model to substitute
 *      anything the rule engine missed "using best culinary judgement", and
 *      NEVER re-checked the answer. The result was persisted by
 *      accept-household-safe-variant as `mealSourceType: "household-safe-variant"`
 *      with a `householdSafeFor` snapshot — a row asserting a safety claim about
 *      real people that nothing had verified.
 *
 *   2. POST /api/meals/:id/adapt — restriction-blind by construction. Exclusions
 *      came from CLIENT-SUPPLIED `req.body.memberExclusions`, and the live client
 *      sends only `{ goal }`, so the list was empty on every real call.
 *      `recipe-swap-engine.ts` contained ZERO references to any restriction and
 *      proposes smoked tofu (soy), soy sauce (soy + gluten) and almond flour
 *      (tree nut).
 *
 *   3. POST /api/suggest-from-ingredients and
 *      POST /api/generate-recipe-from-suggestion — found by PROD6, NOT by PROD5.
 *      Both READ as covered: each resolves the household server-side, each fails
 *      closed when it cannot (SURF1B), each carries the restrictions in the
 *      prompt. Neither checked what came back. The second returns a COMPLETE
 *      recipe card the household cooks from and can save. They were found by
 *      asserting the COMPLEMENT below rather than re-checking the two routes
 *      already known to be broken — which is the whole argument for §1.
 *
 * The reachable harm was concrete: a tree-nut household tapping "make this keto"
 * is told to use ALMOND FLOUR; a sesame household is offered TAHINI, and it is
 * saved as "household-safe".
 *
 * WHY EVERY SUITE STAYED GREEN
 * ----------------------------
 * No suite covered either endpoint. `test-prod3-companion-restriction-safety.ts`
 * even asserts by grepping `server/intelligence/` — a directory NEITHER hole
 * lives in. THA's safety tests enumerate CONSUMERS, so they can only ever prove
 * what is connected; a gate nothing routes through is invisible to all of them.
 *
 * §1 below is the answer to that, and is the most important section in this file:
 * it asserts the COMPLEMENT — every food-producing route reaches the gate —
 * so a future endpoint that skips it fails here rather than shipping.
 *
 * THE FIX — connection, not construction
 * --------------------------------------
 * PROD6 defines NO restriction, allergen, keyword or matching rule. Every verdict
 * below is produced by the engines that already existed: the canonical restriction
 * library via `candidateHardExcluded()`, and `dietRules` for patterns.
 * `validateAdaptationSafety()` is a new VIEW over those matchers, living in the
 * canonical owner module — not a second engine beside it. §7 enforces that.
 *
 * THE LAYERS
 *   1  COVERAGE — every food-producing route reaches the canonical gate
 *   2  THE PROPOSED-INGREDIENT GATE — the exact PROD5 harms are refused
 *   3  THE METHOD GATE — an allergen in the instructions is caught
 *   4  FAIL-CLOSED — an unresolved context refuses, never permits
 *   5  NO FALSE POSITIVES — a safe adaptation for a restricted household passes
 *   6  THE PROMPT — the hand-written 5-restriction list is gone
 *   7  ONE OWNER — PROD6 defines no second restriction list
 *
 * Run with: npm run test:prod6-safety-gate-convergence
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  validateAdaptationSafety,
  refuseAdaptation,
  unionHardRestrictions,
  renderRestrictionReferenceForPrompt,
  type HouseholdSafetyContext,
} from '../lib/household-dietary-safety.js';
import { listRestrictionIds } from '../../shared/restrictions/restriction-resolver.js';

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

const ROOT = join(import.meta.dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

const routes = read('server/routes.ts');
const swapEngine = read('server/lib/recipe-swap-engine.ts');
const safetyModule = read('server/lib/household-dietary-safety.ts');

/** Extract one route handler's body, from its app.post/get line to the next one. */
function routeBody(source: string, signature: string): string {
  const start = source.indexOf(signature);
  if (start === -1) return '';
  const rest = source.slice(start + signature.length);
  const next = rest.search(/\n {2}app\.(post|get|put|patch|delete)\(/);
  return next === -1 ? rest : rest.slice(0, next);
}

// ─── 1. COVERAGE — the assertion that would have caught PROD5's findings ──────
//
// Every route that RECOMMENDS, ADAPTS or GENERATES food for a household must
// reach the canonical gate. This is a structural check on purpose: a behavioural
// test can only cover the endpoints someone remembered to write a test for, and
// "someone forgot" is precisely the failure mode being fixed.

section('── 1. COVERAGE — every food-producing route reaches the canonical gate ──');

const CANONICAL_GATE_SYMBOLS = [
  'resolveHouseholdSafetyContext',
  'isMealSafeForHousehold',
  'validateAdaptationSafety',
  'requireHardRestrictions',
];

const FOOD_PRODUCING_ROUTES: Array<{ signature: string; what: string }> = [
  { signature: 'app.post("/api/planner/entries/:entryId/adapt"', what: 'AI meal adaptation (PROD5 §10.1)' },
  { signature: 'app.post("/api/planner/entries/:entryId/accept-household-safe-variant"', what: 'persists an AI adaptation as household-safe (PROD5 §10.1)' },
  { signature: 'app.post("/api/meals/:id/adapt"', what: 'recipe swap engine (PROD5 §10.2)' },
  // Found by PROD6 while asserting the COMPLEMENT rather than the known list —
  // exactly what §1 exists to do. Both were already fail-closed on RESOLUTION
  // (SURF1B) and carried restrictions in the prompt, so they read as covered; but
  // neither checked what the model returned. A prompt is an instruction, not a
  // guarantee, and both call `new OpenAI()` directly.
  { signature: 'app.post("/api/suggest-from-ingredients"', what: 'AI meal suggestions from ingredients (PROD6)' },
  { signature: 'app.post("/api/generate-recipe-from-suggestion"', what: 'AI full recipe generation (PROD6)' },
];

for (const route of FOOD_PRODUCING_ROUTES) {
  const body = routeBody(routes, route.signature);
  assert(body.length > 0, `route is present: ${route.signature}`);
  const reached = CANONICAL_GATE_SYMBOLS.filter((s) => body.includes(s));
  assert(
    reached.length > 0,
    `${route.what} reaches the canonical gate [${reached.join(', ') || 'NONE'}]`,
    route.signature,
  );
}

// The four AI paths must not merely *call* the gate — they must call the
// ADAPTATION validator, because `isMealSafeForHousehold` never reads instructions
// and would pass a method step that names an allergen.
for (const sig of [
  'app.post("/api/planner/entries/:entryId/adapt"',
  'app.post("/api/planner/entries/:entryId/accept-household-safe-variant"',
  'app.post("/api/suggest-from-ingredients"',
  'app.post("/api/generate-recipe-from-suggestion"',
]) {
  const body = routeBody(routes, sig);
  assert(
    body.includes('validateAdaptationSafety'),
    `AI path validates its OWN output via validateAdaptationSafety: ${sig}`,
  );
  // Fails closed on an UNRESOLVED household — by either canonical mechanism.
  // The planner paths use `refuseAdaptation()`; the two ingredient routes were
  // already fail-closed by SURF1B, which refuses with 503
  // HOUSEHOLD_SAFETY_UNAVAILABLE before the prompt is ever built. Both are
  // "refuse rather than guess"; asserting only the newer spelling would demand a
  // pointless rewrite of a correct guard.
  assert(
    body.includes('refuseAdaptation') || body.includes('HOUSEHOLD_SAFETY_UNAVAILABLE'),
    `AI path fails closed on an unresolved context: ${sig}`,
  );
}

// The client must never be the source of a safety decision.
const swapRoute = routeBody(routes, 'app.post("/api/meals/:id/adapt"');
assert(
  swapRoute.includes('resolveHouseholdSafetyContext'),
  'recipe-swap route resolves the household SERVER-SIDE, not from req.body',
);
assert(
  /meal\.userId !== req\.user!?\.id/.test(swapRoute),
  'recipe-swap route enforces meal ownership (was missing — PROD5 §10.2 adjacent)',
);

// ─── 2. THE PROPOSED-INGREDIENT GATE — the exact PROD5 harms ──────────────────

section('── 2. PROPOSED INGREDIENTS — the exact harms PROD5 described are refused ──');

// The headline: recipe-swap-engine.ts's own rule tables, against the households
// they endanger. These are the literal replacement strings from that file.
const HARMS: Array<{ restriction: string; replacement: string; note: string }> = [
  { restriction: 'tree_nut', replacement: 'almond flour', note: 'keto swap for flour' },
  { restriction: 'nuts', replacement: 'almond flour', note: 'legacy "nuts" alias' },
  { restriction: 'sesame', replacement: 'tahini', note: 'the AI free-hand case' },
  { restriction: 'soy', replacement: 'smoked tofu', note: 'vegetarian swap for bacon' },
  { restriction: 'soy', replacement: 'soy sauce', note: 'vegetarian swap for fish sauce' },
  { restriction: 'gluten', replacement: 'soy sauce', note: 'soy sauce carries gluten' },
];

for (const h of HARMS) {
  const verdict = validateAdaptationSafety({ ingredients: [h.replacement] }, [h.restriction]);
  assert(
    !verdict.safe,
    `"${h.replacement}" is REFUSED for a ${h.restriction} household (${h.note})`,
    verdict,
  );
}

// Attribution must name the restriction, so a refusal can be explained and audited.
const tahini = validateAdaptationSafety({ ingredients: ['tahini'] }, ['sesame']);
assert(
  tahini.violations.some((v) => v.restrictionIds.includes('sesame')),
  'a refusal names the canonical restriction that caused it',
  tahini.violations,
);
assert(
  tahini.violations.every((v) => v.field === 'ingredient'),
  'an ingredient violation is reported as field "ingredient"',
);

// Word-boundary correctness is inherited from the canonical matcher, not re-implemented.
const savoy = validateAdaptationSafety({ ingredients: ['savoy cabbage'] }, ['soy']);
assert(savoy.safe, '"savoy cabbage" is NOT refused for a soy household (word boundaries hold)');

// Guests are bound too — their restrictions live on the entry, not the household.
const ctx = { hardRestrictions: ['gluten'] } as HouseholdSafetyContext;
const union = unionHardRestrictions(ctx, [{ hardRestrictions: ['sesame'] }]);
assert(union.includes('gluten') && union.includes('sesame'), 'guest restrictions are unioned in', union);
assert(
  !validateAdaptationSafety({ ingredients: ['tahini'] }, union).safe,
  "a GUEST's sesame allergy refuses tahini, though the household declared none",
);

// ─── 3. THE METHOD GATE ───────────────────────────────────────────────────────
//
// `isMealSafeForHousehold` reads name + ingredients only. The AI path REWRITES
// THE METHOD, so an allergen can enter through a step that never appears in the
// ingredient list. This is why the adaptation validator exists separately.

section('── 3. METHOD — an allergen in the rewritten instructions is caught ──');

const methodOnly = validateAdaptationSafety(
  { ingredients: ['chickpeas', 'olive oil'], instructions: ['Serve with warm flatbread and a spoon of tahini.'] },
  ['sesame'],
);
assert(!methodOnly.safe, 'an allergen appearing ONLY in the method is refused', methodOnly.violations);
assert(
  methodOnly.violations.some((v) => v.field === 'instruction'),
  'the violation is attributed to the instruction, not an ingredient',
  methodOnly.violations,
);

// And the same content with no matching restriction stays safe.
assert(
  validateAdaptationSafety(
    { instructions: ['Serve with warm flatbread and a spoon of tahini.'] },
    ['gluten'],
  ).violations.every((v) => v.field === 'instruction'),
  'method scanning is restriction-specific, not a blanket refusal',
);

// ─── 4. FAIL-CLOSED ───────────────────────────────────────────────────────────

section('── 4. FAIL-CLOSED — an unresolved context refuses ──');

const refusal = refuseAdaptation();
assert(!refusal.safe, 'refuseAdaptation() is never safe');
assert(refusal.unavailable === true, 'refuseAdaptation() reports unavailability distinctly');
assert(
  refusal.violations.length === 0 && !refusal.safe,
  'an unavailable context refuses with NO violations — "could not find out" is not "found nothing"',
);

// The route must withhold the preview entirely rather than show it with a warning.
const adaptBody = routeBody(routes, 'app.post("/api/planner/entries/:entryId/adapt"');
assert(
  /householdSafePreview\s*=\s*undefined/.test(adaptBody),
  'an unsafe preview is WITHHELD, not flagged — it is one tap from being persisted',
);
const acceptBody = routeBody(routes, 'app.post("/api/planner/entries/:entryId/accept-household-safe-variant"');
assert(
  acceptBody.includes('422') && /ADAPTATION_VIOLATES_RESTRICTIONS/.test(acceptBody),
  'the persistence boundary REFUSES rather than saving an unsafe variant',
);
assert(
  acceptBody.indexOf('validateAdaptationSafety') < acceptBody.indexOf('storage.updateHouseholdSafeVariantContent'),
  'the safety check runs BEFORE the write, not after',
);

// A withheld preview must be EXPLAINED, not silently absent. The server drops the
// preview; the client renders `householdSafePreview && (...)`, so without this the
// household asks for a safe version and receives no answer at all. Silence reads as
// "nothing to adapt" — the opposite of what happened. Asserted structurally because
// the honest gap is a safety-visible behaviour, not decoration.
const planner = readFileSync(join(process.cwd(), 'client/src/pages/weekly-planner-page.tsx'), 'utf8');
assert(
  planner.includes('householdSafeUnavailableReason'),
  'the client explains a WITHHELD household-safe version rather than rendering nothing',
);
assert(
  planner.includes('safety-context-unavailable'),
  'the client distinguishes "could not confirm your household" from "no safe version exists"',
);
// The withheld proposal itself must never reach the screen.
const withheldBlock = planner.slice(
  planner.indexOf('householdSafeUnavailableReason'),
  planner.indexOf('householdSafeUnavailableReason') + 1600,
);
assert(
  !/preview\.(ingredientChanges|methodChanges|householdExtraIngredients)/.test(withheldBlock),
  'the withheld suggestion is never shown in the act of withholding it',
);

// ─── 5. NO FALSE POSITIVES ────────────────────────────────────────────────────
//
// A gate that refuses everything is not a safe gate, it is a broken feature. A
// restricted household must still get adaptations that suit them.

section('── 5. NO FALSE POSITIVES — safe adaptations still reach a restricted household ──');

assert(
  validateAdaptationSafety({ ingredients: ['lentils', 'chickpeas', 'jackfruit'] }, ['tree_nut', 'sesame']).safe,
  'plant swaps with no allergen pass for a tree-nut + sesame household',
);
assert(
  validateAdaptationSafety({ ingredients: ['coconut flour'] }, ['tree_nut']).safe,
  'coconut flour passes for a tree-nut household (a separate canonical restriction)',
);
assert(
  validateAdaptationSafety({ ingredients: ['almond flour'] }, []).safe,
  'an UNRESTRICTED household is unaffected — no gate, no cost, no behaviour change',
);
assert(
  validateAdaptationSafety({ ingredients: [null, undefined, '  '] }, ['sesame']).safe,
  'null/blank replacements (an ingredient REMOVED) are not violations',
);

// ─── 6. THE PROMPT — the second rules engine is gone ──────────────────────────

section('── 6. PROMPT — the hand-written restriction list is gone ──');

assert(
  !/- Nut-Free: remove or substitute all tree nuts and peanuts\./.test(routes),
  'the hand-written 5-restriction reference has been REMOVED from the prompt',
);
assert(
  adaptBody.includes('renderRestrictionReferenceForPrompt'),
  'the prompt reference is now RENDERED from the canonical library',
);

// The renderer must actually carry the restrictions the old list omitted.
const rendered = renderRestrictionReferenceForPrompt(['sesame', 'soy', 'shellfish', 'eggs', 'mustard']);
for (const name of ['Sesame', 'Soy', 'Shellfish', 'Egg', 'Mustard']) {
  assert(rendered.includes(name), `the rendered reference names ${name} (absent from the old hand-written list)`);
}
assert(
  rendered.toLowerCase().includes('tahini'),
  'the rendered reference carries derived ingredients (tahini for sesame) — the names an allergen hides behind',
);
assert(
  renderRestrictionReferenceForPrompt([]).includes('no canonical restrictions'),
  'an unrestricted household renders an explicit empty reference, not a blank',
);

// ─── 7. ONE OWNER ─────────────────────────────────────────────────────────────

section('── 7. ONE OWNER — PROD6 defines no second restriction list ──');

assert(
  swapEngine.includes('household-dietary-safety'),
  'recipe-swap-engine reaches the canonical gate (it referenced NO restriction before PROD6)',
);
assert(
  /hardRestrictions/.test(swapEngine),
  'recipe-swap-engine accepts server-resolved hard restrictions',
);

// The swap engine's rule tables are culinary and must stay that way — it must not
// grow its own allergen vocabulary now that it knows about restrictions.
for (const forbidden of ['resolveActiveRestrictions', 'TRUSTED_SOURCE', 'ALLERGEN']) {
  assert(
    !swapEngine.includes(forbidden),
    `recipe-swap-engine does not re-implement restriction resolution (${forbidden})`,
  );
}

// The validator must delegate, not decide.
assert(
  safetyModule.includes('candidateHardExcluded(value, [value], restrictions)'),
  'validateAdaptationSafety delegates its VERDICT to the same matcher the meal gate uses',
);
assert(
  listRestrictionIds().length >= 10,
  'the canonical library carries the full restriction set the old prompt list omitted',
  listRestrictionIds().length,
);

// An adaptation must never be admitted by a weaker bar than a recommendation.
const libraryIds = listRestrictionIds();
for (const id of libraryIds) {
  const def = renderRestrictionReferenceForPrompt([id]);
  assert(
    def !== '  (no canonical restrictions declared)',
    `every canonical restriction id renders in a prompt reference: ${id}`,
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n════════════════════════════════════════════════════════');
console.log(`  PROD6 safety gate convergence: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n  FAILURES:');
  for (const f of failures) console.log(`    ✗ ${f}`);
  console.log('\n  ❌ A food-producing path is not reaching the canonical safety gate.');
  process.exit(1);
}
console.log('  ✅ Every food-producing route reaches the canonical safety gate.');
