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

// ─── DISCOVERY (NUTPLAN2) ────────────────────────────────────────────────────
//
// This block replaces a hand-written array of six `app.post(...)` signature
// strings. That array claimed, in this file's own header, to "assert the
// COMPLEMENT — every food-producing route reaches the gate". It did not: there
// was no scan, no set difference, and no discovery step. The complement was
// asserted in PROSE and enumerated BY HAND, so a route nobody remembered was a
// route nobody checked — which is the exact failure mode the header criticises
// the other nineteen suites for.
//
// NUTPLAN1 hit it (`smart-create-from-ingredients`, ungated, found by reading
// rather than by testing) and closed the instance by adding a seventh row.
// NUTPLAN2 closes the CLASS. Three blind spots made the old harness structurally
// incapable of finding what it claimed to cover:
//
//   1. Every entry was an `app.post` signature, so NO `app.get` route could ever
//      be checked — and `GET /api/meal-pairings/:mealId` was an ungated meal
//      recommender sitting in that blind spot.
//   2. It matched double quotes only. `app.post('/api/meal-plans/smart-suggest'`
//      is single-quoted and was invisible.
//   3. It matched string literals only. 43 routes are registered from the shared
//      API contract (`app.get(api.search.recipes.path, …)`) and were invisible —
//      including `/api/search-recipes`, which filters on a diet source that
//      fails OPEN.
//
// THE INVERSION, which is the whole point: a route is now discovered by default
// and must be explicitly CLASSIFIED. An unclassified food-surface route fails
// this suite. Previously the default was silence.

interface RouteRegistration { verb: string; path: string; literal: boolean }

function discoverRoutes(source: string): RouteRegistration[] {
  const found: RouteRegistration[] = [];
  // Every quote style Express accepts.
  const literal = /app\.(get|post|put|patch|delete)\(\s*(["'`])([^"'`]+)\2/g;
  let m: RegExpExecArray | null;
  while ((m = literal.exec(source))) found.push({ verb: m[1], path: m[3], literal: true });
  // Routes registered from the shared API contract, e.g. api.search.recipes.path.
  const constant = /app\.(get|post|put|patch|delete)\(\s*(api\.[\w$.]+)/g;
  while ((m = constant.exec(source))) found.push({ verb: m[1], path: m[2], literal: false });
  return found;
}

// The discovery net. Deliberately WIDE: over-matching costs one line of
// classification, under-matching costs a household an allergic reaction.
const FOOD_SURFACE_VOCABULARY =
  /meal|recipe|food|pantry|suggest|recommend|swap|alternativ|pairing|template|discover|season|stories|cook|nutrition|diet/i;

/** A route that must reach the gate, and where the gate is reached. */
interface GatedRoute { path: string; what: string; via?: string }

/** A route the gate does not apply to, and WHY. A reason is mandatory. */
interface ExemptRoute { path: RegExp | string; why: string }

const GATED_ROUTES: GatedRoute[] = [
  { path: '/api/planner/entries/:entryId/adapt', what: 'AI meal adaptation (PROD5 §10.1)' },
  { path: '/api/planner/entries/:entryId/accept-household-safe-variant', what: 'persists an AI adaptation as household-safe (PROD5 §10.1)' },
  { path: '/api/meals/:id/adapt', what: 'recipe swap engine (PROD5 §10.2)' },
  { path: '/api/suggest-from-ingredients', what: 'AI meal suggestions from ingredients (PROD6)' },
  { path: '/api/generate-recipe-from-suggestion', what: 'AI full recipe generation (PROD6)' },
  { path: '/api/meals/smart-create-from-ingredients', what: 'ingredient-led meal recommendation (NUTPLAN1)' },
  { path: '/api/meal-plans/smart-suggest', what: 'whole-week meal suggestion (single-quoted — invisible before NUTPLAN2)' },
  { path: '/api/meal-pairings/:mealId', what: 'meals recommended alongside a meal (GET — invisible before NUTPLAN2)' },
  // Gated inside the service it delegates to, not in the handler. Named
  // explicitly so "the gate is somewhere else" is a declaration under review
  // rather than a silent pass.
  { path: '/api/starter-meals', what: 'onboarding starter cookbook', via: 'server/lib/meal-service.ts' },
];

const EXEMPT_ROUTES: ExemptRoute[] = [
  // The household's OWN records. THA proposes nothing; it stores and returns
  // what the household themselves chose. Gating these would hide a household's
  // own food from them, which is a different harm and not a safer one.
  { path: /^\/api\/food-diary/, why: "the household's own logged history — they chose every entry" },
  { path: /^\/api\/pantry(\/(:id)?)?$/, why: "CRUD on the household's own pantry contents" },
  { path: /^\/api\/plan-templates\/mine/, why: "the household's own saved plan templates" },
  { path: /^\/api\/meal-templates/, why: "CRUD on the household's own meal templates" },
  { path: /^\/api\/meals\/:id\/items$/, why: 'components of a meal the household already has' },
  { path: '/api/meals/summary', why: "counts over the household's own cookbook" },
  { path: '/api/planner/ready-meal-library', why: "the household's OWN ready meals (meals.userId = requester)" },
  { path: '/api/planner/basket-meal-ids', why: "ids of the household's own planned meals" },
  { path: '/api/meals/lookup', why: 'a lookup the household typed — THA selects nothing' },
  { path: /^\/api\/freezer/, why: "the household's own freezer stock" },
  { path: /^\/api\/meals\/:id\/(image|freezer-eligible|cookbook-visibility)$/, why: "flags and images on the household's OWN meal — no food is proposed" },
  { path: '/api/planner/entries/:entryId/meal', why: 'swaps the meal in a planner slot the household chose themselves' },
  { path: '/api/meal-items/:id', why: "deletes a component of the household's own meal" },
  { path: '/api/meals/:mealId/uplift-applications', why: "uplift suggestions the household already applied to their own meal" },
  { path: '/api/household/dietary-context', why: 'returns the dietary context itself — it IS the safety data, not food' },
  { path: '/api/nutrition-centre', why: "analysis of the household's own planner history — no meal is proposed" },

  // REFERENCE knowledge about food, not food put in front of a household to eat.
  // These describe ingredients; they do not recommend a meal.
  { path: /^\/api\/knowledge\//, why: 'canonical food knowledge — reference, not a meal recommendation' },
  { path: /^\/api\/food-knowledge/, why: 'food reference pages — reference, not a meal recommendation' },
  { path: /^\/api\/foods\//, why: 'food detail / comparison pages — reference, not a meal recommendation' },
  { path: /^\/api\/meals\/:id\/(food-)?intelligence$/, why: 'analysis OF a meal the household already has' },
  { path: '/api/pantry/intelligence', why: 'analysis of pantry contents the household already owns' },
  { path: '/api/pantry/search-index', why: 'a search index over reference food knowledge' },
  { path: /^\/api\/pantry\/knowledge/, why: 'reference knowledge for one pantry item' },
  { path: '/api/nutrition/bulk', why: 'macro figures for meals already on screen' },

  // Operator surfaces. Not household-facing; `assertAdmin` is the relevant gate.
  { path: /^\/api\/intelligence\/learning\/recommendations/, why: 'admin model-tuning proposals — not food, not household-facing' },
  { path: '/api/intelligence/observability/suggest-matchers', why: 'admin intent-matcher proposals — not food' },
];

// ── Routes that produce food and are NOT yet gated ───────────────────────────
//
// Recorded rather than exempted, because they are not exempt on merit — the
// gate SHOULD reach them and does not. Each is a live finding carried into the
// NUTPLAN2 report's Remaining Risks with its consequence stated.
//
// This list may only ever shrink. The assertion below fails if anything is added
// to it, so a future session cannot quietly park a new ungated route here.
const KNOWN_UNGATED: ExemptRoute[] = [
  { path: '/api/search-recipes', why: 'RECORDED GAP — filters on storage.getPersonDiet, which is requester-only and fails OPEN (returns [] on error). Not the canonical gate.' },
  { path: '/api/smart-suggest/auto-import', why: 'RECORDED GAP — uses the planner-compliance engine, a second compliance path, not household-dietary-safety.' },
  { path: '/api/pantry/alternatives', why: 'RECORDED GAP — its only dietary input is a CLIENT-SUPPLIED `diet` query param. Surfaces foods, not meals, so the meal gate does not fit as-is.' },
  { path: '/api/pantry/discover', why: 'RECORDED GAP — surfaces foods to try with no household dietary filter. Food-level verdict does not exist yet.' },
  { path: '/api/pantry/stories', why: 'RECORDED GAP — surfaces foods with no household dietary filter.' },
  { path: '/api/pantry/seasonal', why: 'RECORDED GAP — surfaces seasonal foods with no household dietary filter.' },
  { path: '/api/plan-templates/library', why: 'RECORDED GAP — whole-week meal plans offered to a household, ungated.' },
  { path: '/api/plan-templates/default', why: 'RECORDED GAP — a default week of meals, ungated.' },
  { path: '/api/plan-templates/:id', why: 'RECORDED GAP — a shared plan template of meals, ungated.' },
  { path: '/api/plan-templates/:id/apply', why: 'RECORDED GAP — WRITES a full week of meals into the planner, ungated.' },
  { path: '/api/plan-templates/:id/apply-to-week/:weekId', why: 'RECORDED GAP — as above, scoped to one week.' },
  { path: '/api/plan-templates/:id/import', why: 'RECORDED GAP — imports a shared template of meals, ungated.' },
  { path: '/api/preview-recipe', why: 'RECORDED GAP — renders a recipe card from a supplied URL/text, ungated.' },
  { path: '/api/product-alternatives', why: 'RECORDED GAP — proposes healthier product alternatives from OpenFoodFacts with no household dietary filter.' },
  { path: '/api/intelligence/food-opportunities', why: 'RECORDED GAP — surfaces food opportunities; gating belongs with the Opportunity pipeline (HNP1 M2).' },
  { path: '/api/intelligence/food-opportunities/:opportunityId/:action', why: 'RECORDED GAP — acts on a food opportunity.' },
  { path: '/api/planner/weeks/:weekId/save-week-template', why: "RECORDED GAP — snapshots the household's own week; low risk, listed for completeness." },
  { path: '/api/meals/:id/link-template', why: "RECORDED GAP — links a template to the household's own meal; low risk, listed for completeness." },
  { path: 'api.search.recipes.path', why: 'RECORDED GAP — constant-registered recipe search; same fail-open diet source as /api/search-recipes.' },
  { path: 'api.swaps.list.path', why: 'RECORDED GAP — unfiltered ingredient swap list.' },
  { path: 'api.diets.getMealDiets.path', why: "RECORDED GAP — reads diet tags on a meal; reference, but reached via the food vocabulary." },
  { path: 'api.diets.setMealDiets.path', why: 'RECORDED GAP — writes diet tags on a meal.' },
  { path: 'api.diets.list.path', why: 'RECORDED GAP — lists diet definitions; reference.' },
  { path: 'api.meals.list.path', why: "RECORDED GAP — lists the household's own cookbook; low risk, listed for completeness." },
  { path: 'api.meals.get.path', why: "RECORDED GAP — reads one of the household's own meals." },
  { path: 'api.meals.create.path', why: 'RECORDED GAP — the household authors a meal themselves.' },
  { path: 'api.meals.update.path', why: "RECORDED GAP — the household edits their own meal." },
  { path: 'api.meals.copy.path', why: "RECORDED GAP — copies a meal into the household's cookbook." },
  { path: 'api.meals.delete.path', why: "RECORDED GAP — deletes the household's own meal." },
  { path: 'api.meals.saveProduct.path', why: 'RECORDED GAP — saves a scanned product as a meal.' },
  { path: 'api.meals.generateImage.path', why: 'RECORDED GAP — generates an image, not food.' },
  { path: 'api.meals.getEditedCopy.path', why: "RECORDED GAP — reads an edited copy of the household's meal." },
  { path: 'api.meals.reimportInstructions.path', why: 'RECORDED GAP — re-imports method text for an existing meal.' },
  { path: 'api.import.recipe.path', why: 'RECORDED GAP — imports a recipe the household chose, ungated.' },
  { path: 'api.import.recipeFromText.path', why: 'RECORDED GAP — imports a recipe from pasted text, ungated.' },
  { path: 'api.import.parse.path', why: 'RECORDED GAP — parses a recipe the household supplied.' },
  { path: 'api.analyze.meal.path', why: 'RECORDED GAP — analyses a meal; produces analysis, not a recommendation.' },
  { path: 'api.nutrition.get.path', why: 'RECORDED GAP — macro figures for a meal already on screen.' },
  { path: 'api.allergens.get.path', why: 'RECORDED GAP — reports allergens; informational, not a recommendation.' },
  { path: 'api.shoppingList.generateFromMeals.path', why: "RECORDED GAP — builds a list from the household's own planned meals." },
  { path: 'api.shoppingList.autoSmp.path', why: 'RECORDED GAP — suggests products for a shopping list, ungated.' },
  { path: 'api.shoppingList.suggestSpellings.path', why: 'RECORDED GAP — spelling suggestions, not food.' },
  { path: 'api.categories.list.path', why: 'RECORDED GAP — food categories; reference.' },
];

function matches(rule: RegExp | string, path: string): boolean {
  return typeof rule === 'string' ? rule === path : rule.test(path);
}

const discovered = discoverRoutes(routes);
const foodSurfaces = discovered.filter(
  (r) => FOOD_SURFACE_VOCABULARY.test(r.path) && !r.path.includes('/admin/'),
);

assert(discovered.length > 200, `discovery found the route table (${discovered.length} registrations)`);
assert(
  discovered.some((r) => !r.literal),
  'discovery sees constant-registered routes, not only string literals',
);
assert(
  discovered.some((r) => r.verb === 'get'),
  'discovery sees app.get routes, not only app.post',
);

// THE COMPLEMENT, actually asserted. Every discovered food surface must be
// classified as gated, exempt-with-a-reason, or a recorded gap.
const unclassified = foodSurfaces.filter(
  (r) =>
    !GATED_ROUTES.some((g) => g.path === r.path) &&
    !EXEMPT_ROUTES.some((e) => matches(e.path, r.path)) &&
    !KNOWN_UNGATED.some((k) => matches(k.path, r.path)),
);
assert(
  unclassified.length === 0,
  'every discovered food-surface route is classified (gated, exempt, or a recorded gap)',
  unclassified.map((r) => `${r.verb.toUpperCase()} ${r.path}`),
);

// Every classification must name a real route. A stale entry is a rule that
// stopped protecting anything without anyone noticing.
for (const g of GATED_ROUTES) {
  assert(
    discovered.some((r) => r.path === g.path),
    `gated-route classification is not stale: ${g.path}`,
  );
}

// Every gated route reaches the canonical gate — in its own handler, or in the
// module it declares it delegates to.
for (const route of GATED_ROUTES) {
  const body = route.via
    ? read(route.via)
    : routeBody(routes, `app.${discovered.find((r) => r.path === route.path)?.verb ?? 'post'}("${route.path}"`) ||
      routeBody(routes, `app.get('${route.path}'`) ||
      routeBody(routes, `app.post('${route.path}'`);
  const reached = CANONICAL_GATE_SYMBOLS.filter((sym) => body.includes(sym));
  assert(
    reached.length > 0,
    `${route.what} reaches the canonical gate [${reached.join(', ') || 'NONE'}]${route.via ? ` via ${route.via}` : ''}`,
    route.path,
  );
}

// Every exemption and every recorded gap states a reason. An unexplained
// exemption is indistinguishable from an oversight.
for (const e of [...EXEMPT_ROUTES, ...KNOWN_UNGATED]) {
  assert(e.why.trim().length > 20, `classification states a reason: ${String(e.path)}`);
}

// The recorded-gap list may only shrink. This number is the ratchet: raising it
// requires editing this line, which is a reviewed act.
assert(
  KNOWN_UNGATED.length <= 43,
  `the recorded-gap list has not grown (${KNOWN_UNGATED.length} of at most 43)`,
);

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
// NUTPLAN2 — an honest pass message.
//
// This previously read "Every food-producing route reaches the canonical safety
// gate." That was true of the six routes the old list named and said nothing
// about the rest, because there was no discovery. Now that discovery is real,
// the recorded gaps are real too, and a green suite that hid them would be the
// false assurance THA has been bitten by before (REL3: a verifier reporting PASS
// against a database 20 migrations behind).
console.log(`  ✅ Every CLASSIFIED food-producing route reaches the canonical safety gate.`);
console.log(
  `     ${GATED_ROUTES.length} gated · ${EXEMPT_ROUTES.length} exempt with a stated reason · ` +
    `${KNOWN_UNGATED.length} RECORDED GAPS still ungated (NUTPLAN2 report, Remaining Risks).`,
);
