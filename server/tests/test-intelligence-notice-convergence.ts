/**
 * NTC-P2 — Notice Platform Convergence
 * =========================================================================
 * The Notice Engine Architecture §7.2 named three live, ungoverned notice channels and
 * §8 scheduled their convergence. These tests assert the convergence HELD — and, more
 * importantly, that it stays held: most of what follows is a structural assertion over
 * the source, because the failure this workstream fixes is not a wrong value, it is a
 * SECOND PLACE where a right value is computed. A unit test over a pure function cannot
 * see that. A test that reads the source can.
 *
 * The three channels:
 *   /api/home/intelligence                      → now a gateway consumer
 *   /api/planner/weeks/:weekId/intelligence     → now a gateway consumer
 *   the WX7 pantry-opportunities block          → now an owned module, not an "opportunity"
 *
 * Run: npx tsx server/tests/test-intelligence-notice-convergence.ts
 */

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import {
  applySilenceRules,
  noticeCelebration,
  noticeFoodDiscovery,
  noticeHouseholdInsight,
  MAX_NOTICES_PER_MOMENT,
  type Notice,
} from "../intelligence/conversation/notice-engine.js";
import { phraseNotice } from "../intelligence/conversation/behaviour-engine.js";
import { NOTICE_SCOPE, projectHouseholdFields } from "../intelligence/conversation/notice-gateway.js";
import { findMealUnlock } from "../lib/meal-unlock.js";

const here = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(resolve(here, p), "utf8");

let passed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failures.push(label);
    console.log(`  ✗ ${label}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
}

/**
 * Strip comments before asserting over source.
 *
 * This matters more than it looks. Every module in this pipeline DOCUMENTS the very
 * things it must not do — notice-engine.ts's header explains that the CALLER performs
 * `intelligencePlatform.handle()`; meal-unlock.ts explains at length why it is not a
 * `DeliverableOpportunity`. A structural test that searched the raw text would fail on
 * the prose and pass on the code, which is precisely backwards. These assertions are
 * about what the code DOES, so they read only code.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("//"))
    .join("\n");
}

const routes = read("../routes.ts");
const gateway = stripComments(read("../intelligence/conversation/notice-gateway.ts"));
const engine = stripComments(read("../intelligence/conversation/notice-engine.ts"));
const routeCode = stripComments(routes);

// ---------------------------------------------------------------------------
section("1. THE THREE BYPASS CHANNELS ARE CONVERGED");
// ---------------------------------------------------------------------------

// The two intelligence routes assemble nothing themselves any more. Before NTC-P2 they
// called the narrative engines DIRECTLY and shipped the result unguarded.
const homeRoute = routeCode.slice(
  routeCode.indexOf('app.get("/api/home/intelligence"'),
  routeCode.indexOf('app.get("/api/intelligence/companion/notices"'),
);
assert(homeRoute.length > 0, "the home + planner intelligence routes still exist");

assert(
  homeRoute.includes("gatherNotices(") && homeRoute.includes("NOTICE_SCOPE.household"),
  "/api/home + /api/planner obtain their notices from the ONE gateway",
);
assert(
  !homeRoute.includes("deriveHouseholdCompanionFields("),
  "neither route derives the household fields itself — the gateway owns that call",
);
for (const engineCall of ["stories(", "seasonalStories(", "discover("]) {
  assert(
    !homeRoute.includes(engineCall),
    `neither route calls ${engineCall.slice(0, -1)}() directly — the §7.2 bypass is closed`,
  );
}

// The whole file, not just those routes: no route anywhere may run the pipeline.
for (const forbidden of [
  "applySilenceRules(",
  "phraseNotice(",
  "noticeOpportunities(",
  "noticeSeasonal(",
  "noticeCelebration(",
  "noticeLearning(",
]) {
  assert(
    !routeCode.includes(forbidden),
    `routes.ts never calls ${forbidden.slice(0, -1)} — a route that can reach the engine can become a second one`,
  );
}

assert(
  !routeCode.includes("MAX_NOTICES_PER_MOMENT"),
  "no route holds the attention budget — the cap belongs to the engine alone (§6)",
);

// ---------------------------------------------------------------------------
section("2. THE DUPLICATE SEASONAL DERIVATION IS DEAD (§7.2's named duplication)");
// ---------------------------------------------------------------------------

// §7.2: the bypasses "re-surface the same seasonal headline the Notice Engine would."
// The rule — first card of `looking_ahead`, else `discoveries` — existed in TWO places.
const fields = read("../lib/household-companion-fields.ts");
const seasonalRule = /looking_ahead/g;

assert(
  (fields.match(seasonalRule) ?? []).length > 0,
  "household-companion-fields.ts owns the seasonal-headline derivation",
);
assert(
  (routeCode.match(seasonalRule) ?? []).length === 0,
  "routes.ts holds NO copy of the seasonal-headline rule — one derivation, one owner",
);
assert(
  (gateway.match(seasonalRule) ?? []).length === 0,
  "the gateway holds no copy of it either — it CALLS the owner, it does not reimplement it",
);

// ---------------------------------------------------------------------------
section("3. THE ENGINE IS STILL PURE — the gateway did not smuggle I/O into it");
// ---------------------------------------------------------------------------

// §5.2: the engine "receives plain data and stays a zero-I/O pure module". This is the
// single most important thing NTC-P2 could have broken, and the reason the orchestrator
// is a separate file rather than a set of methods on the engine.
for (const io of ["intelligencePlatform", "storage", "import(", "await "]) {
  assert(!engine.includes(io), `notice-engine.ts contains no ${io.trim()} — it remains zero-I/O`);
}
assert(
  !engine.includes("notice-gateway"),
  "the engine holds NO reference to its gateway — the dependency points one way only",
);

// ---------------------------------------------------------------------------
section("4. THE NEW NARRATIVE PRODUCERS ADD NO FACT AND NO WORD");
// ---------------------------------------------------------------------------

const HEADLINE = "Your household discovered aubergine this month.";

for (const [name, producer] of [
  ["celebration", noticeCelebration],
  ["household-insight", noticeHouseholdInsight],
  ["food-discovery", noticeFoodDiscovery],
] as const) {
  const [notice] = producer(HEADLINE);
  assert(notice.category === name, `${name} produces its own category`);
  assert(
    notice.fact.kind === "narrative" && notice.fact.headline === HEADLINE,
    `${name} carries its owner's headline VERBATIM — the engine composes nothing`,
  );
  assert(notice.priority === "low", `${name} is low priority — a calm fact is never a demand`);
  assert(notice.source.length > 0, `${name} names the owner its fact came from (provenance)`);

  // Honest silence: an owner with nothing to say produces no notice, never a stand-in.
  assert(producer(null).length === 0, `${name}: no headline → no notice (honest absence)`);
}

// The voice seam may PREFIX; it may never reword. This is §9's "any rewording of producer
// content before the Behaviour Engine's voice seam — stop", and it is the rule most
// easily broken by accident, because a nicer sentence always looks like an improvement.
for (const personality of ["companion", "friend", "coach", "chef", "teacher", "sergeant"] as const) {
  const [notice] = noticeCelebration(HEADLINE);
  const voiced = phraseNotice(notice, personality);
  assert(
    voiced.includes(HEADLINE),
    `phraseNotice(${personality}) carries the narrative headline VERBATIM — prefix, never reword`,
  );
}

// ---------------------------------------------------------------------------
section("5. THE CONVERGED SURFACES ARE UNDER THE ONE ATTENTION BUDGET");
// ---------------------------------------------------------------------------

// This is the whole point of the workstream: the Home card used to show FOUR unprompted
// rows unconditionally. It now shows at most MAX_NOTICES_PER_MOMENT, like everything else.
const allFour: Notice[] = [
  ...noticeCelebration("A celebration."),
  ...noticeFoodDiscovery("A discovery."),
  ...noticeHouseholdInsight("An insight."),
];
assert(allFour.length === 3, "three narrative notices gathered");
assert(
  applySilenceRules(allFour).length === MAX_NOTICES_PER_MOMENT,
  `the narrative surface is capped at ${MAX_NOTICES_PER_MOMENT} — the same budget every other notice pays`,
);

// The projection is a THIN one: it renders the VOICED sentence, and invents no field.
const bundle = {
  notices: applySilenceRules(allFour).map((n) => ({ ...n, text: `Voiced: ${(n.fact as { headline: string }).headline}` })),
  trust: { sources: [], gatheredCount: 3, cap: MAX_NOTICES_PER_MOMENT, personalityId: "companion" },
};
const projected = projectHouseholdFields(bundle);
const present = Object.values(projected).filter((v) => v !== null);
assert(
  present.length === MAX_NOTICES_PER_MOMENT,
  "the projection surfaces exactly what survived the budget — it never re-adds a dropped notice",
);
assert(
  present.every((v) => JSON.stringify(v).includes("Voiced:")),
  "every projected field carries the VOICED sentence, not the raw headline — these four facts now meet the voice",
);

// A notice the budget declined is `null`, indistinguishable in shape from one its owner
// never had. Both are honest silence — and `trust.gatheredCount` is what keeps them
// distinguishable to an auditor.
assert(
  bundle.trust.gatheredCount > bundle.notices.length,
  "the bundle reports what was OFFERED vs what was SHOWN — silence stays auditable",
);

// ---------------------------------------------------------------------------
section("6. SCOPES ARE A GATHER FILTER, NOT A SECOND ATTENTION BUDGET");
// ---------------------------------------------------------------------------

assert(
  NOTICE_SCOPE.household.length === 4 &&
    NOTICE_SCOPE.household.every((c) =>
      ["celebration", "seasonal-highlight", "food-discovery", "household-insight"].includes(c),
    ),
  "the household scope is exactly the four narrative categories the two surfaces render",
);
// HHP2 — 11 → 12: `nutrition-opportunity`, the household's own health opportunities, is the
// twelfth. The number is asserted rather than derived because `NoticeCategory` is a type
// union and cannot be enumerated at runtime; this assertion is therefore the ONLY thing that
// forces a new category to be a deliberate decision about the Companion's scope rather than
// an accident. Changing it without adding the category to NOTICE_SCOPE.companion is the
// failure it exists to catch.
assert(
  NOTICE_SCOPE.companion.length === 12,
  "the companion scope is every category — that surface is a mouth for anything noticed",
);
assert(
  !NOTICE_SCOPE.household.some((c) =>
    ["planner-gap", "pantry-opportunity", "shopping-opportunity"].includes(c),
  ),
  "the narrative surfaces do NOT render opportunities — AmbientIntelligence already does, on the same page",
);

// The structural guarantee that a scope cannot become a second budget: it is applied
// while GATHERING (an out-of-scope producer is never run), never as a slice afterwards.
const afterSilence = gateway.slice(gateway.indexOf("applySilenceRules(gathered)"));
for (const slicer of [".slice(", ".sort(", ".filter("]) {
  assert(
    !afterSilence.includes(slicer),
    `the gateway never calls ${slicer} on what the Silence Rules emitted — one budget, one owner (§6)`,
  );
}

// ---------------------------------------------------------------------------
section("7. THE WX7 PANTRY BLOCK — OWNED, CITED, AND NO LONGER AN 'OPPORTUNITY'");
// ---------------------------------------------------------------------------

assert(
  !routeCode.includes("unlock.get(") && !routeCode.includes("pantrySlugs"),
  "the unlock computation is GONE from routes.ts — the route is a consumer, not an engine",
);
assert(
  routeCode.includes("findMealUnlock("),
  "the pantry route calls the owned module",
);

const resolver = (name: string) => ({ canonicalSlug: name.toLowerCase(), canonicalName: name });
const pantry = [
  { displayName: "Tomato", ingredientKey: "tomato", isDeleted: false },
  { displayName: "Pasta", ingredientKey: "pasta", isDeleted: false },
];
const meals = [
  { name: "Pasta Arrabbiata", ingredients: ["Tomato", "Pasta", "Chilli"] },
  { name: "Tomato Salad", ingredients: ["Tomato", "Pasta", "Chilli"] },
  { name: "Plain Pasta", ingredients: ["Tomato", "Pasta"] },
];

const unlock = findMealUnlock("tomato", pantry, meals, resolver);
assert(unlock !== null, "an ingredient missing from exactly one slot is found");
assert(unlock!.ingredient === "Chilli", "it names the ONE ingredient the household lacks");
assert(unlock!.mealCount === 2, "it counts only meals missing EXACTLY that one ingredient");
assert(
  unlock!.text === "Adding Chilli would unlock 2 meals you already have the rest of.",
  "the SERVER composes the sentence — the client no longer writes prose about household data",
);
assert(
  unlock!.evidence.length >= 1 && unlock!.evidence.every((e) => e.source && e.detail),
  "the claim CITES what it counted (Rule E1 — no citation, no card)",
);

// Silence, not a stand-in: no meal supports the claim → the section disappears.
assert(
  findMealUnlock("tomato", pantry, [{ name: "Toast", ingredients: ["Bread"] }], resolver) === null,
  "no supporting meal → null (honest absence, never a fabricated unlock)",
);
assert(
  findMealUnlock("tomato", pantry, [], resolver) === null,
  "no meals at all → null",
);

// It must not impersonate an OD1 DeliverableOpportunity — that was the original defect.
// (Comments stripped: the module's header EXPLAINS why it is not one, at length.)
const unlockModule = stripComments(read("../lib/meal-unlock.ts"));
assert(
  !unlockModule.includes("DeliverableOpportunity") && !unlockModule.includes("owningDomain"),
  "the meal unlock shares no type with OD1 — and no longer claims to be an opportunity",
);
assert(
  read("../../client/src/components/PantryIntelligencePanel.tsx").includes("mealUnlock"),
  "the client renders `mealUnlock`, the fact's real name",
);

// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(60));
console.log(`  ${passed} passed, ${failures.length} failed`);
console.log("=".repeat(60));
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
