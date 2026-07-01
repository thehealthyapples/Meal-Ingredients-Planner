/**
 * test-intelligence-registry-executability.ts (INT6A)
 * =====================================================
 * Verifies the Capability Registry Executability Hardening introduced in INT6A.
 * Proves that the registry accurately distinguishes registered capabilities from
 * executable capability intents, so discovery surfaces cannot over-advertise
 * functionality.
 *
 * Covered:
 *   1. Registered capabilities start with empty executableIntents (before binding).
 *   2. bindHandler() with an explicit executableIntents list updates the capability record.
 *   3. listExecutable() returns only capabilities with at least one executable intent.
 *   4. isExecutable() correctly discriminates executable vs non-executable verbs.
 *   5. Supported-but-not-executable intents remain in supportedIntents (truthful architecture).
 *   6. The canonical singleton reflects the eleven bound bindings (INT2/INT3/INT4/INT8/INT10/INT12/INT13/INT14/INT15/INT16/INT17).
 *   7. Unbound capabilities on the singleton have empty executableIntents.
 *   8. Discovery via listExecutableCapabilities() on the platform matches reality.
 *   9. canExecute() on the platform gives the correct per-verb answer.
 *
 * Run with: npx tsx server/tests/test-intelligence-registry-executability.ts
 */

import {
  CapabilityRegistry,
  IntelligencePlatform,
  intelligencePlatform,
  PLANNER_CAPABILITY_ID,
  PLANNER_EXECUTABLE_INTENTS,
  SHOPPING_CAPABILITY_ID,
  SHOPPING_EXECUTABLE_INTENTS,
  NUTRITION_KNOWLEDGE_CAPABILITY_ID,
  NUTRITION_KNOWLEDGE_EXECUTABLE_INTENTS,
  PANTRY_CAPABILITY_ID,
  PANTRY_EXECUTABLE_INTENTS,
  DIARY_CAPABILITY_ID,
  DIARY_EXECUTABLE_INTENTS,
  PROFILE_CAPABILITY_ID,
  PROFILE_EXECUTABLE_INTENTS,
  HOUSEHOLD_CAPABILITY_ID,
  HOUSEHOLD_EXECUTABLE_INTENTS,
  PARTNERS_CAPABILITY_ID,
  PARTNERS_EXECUTABLE_INTENTS,
  MEALS_CAPABILITY_ID,
  MEALS_EXECUTABLE_INTENTS,
  TEMPLATES_CAPABILITY_ID,
  TEMPLATES_EXECUTABLE_INTENTS,
  ANALYSER_CAPABILITY_ID,
  ANALYSER_EXECUTABLE_INTENTS,
} from "../intelligence/index.js";
import type { CapabilityHandler, IntentVerb } from "../intelligence/index.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ---------------------------------------------------------------------------
// A no-op handler used to test binding without invoking real services.
// ---------------------------------------------------------------------------

const noopHandler: CapabilityHandler = async () => ({ noop: true });

// ---------------------------------------------------------------------------
// 1. Fresh registry — all capabilities start with empty executableIntents
// ---------------------------------------------------------------------------

section("Fresh registry — executableIntents empty before binding");

const fresh = new CapabilityRegistry();
const allFresh = fresh.list();

assert(allFresh.length > 0, "seed loads capabilities");
assert(
  allFresh.every((c) => c.executableIntents.length === 0),
  "all capabilities have empty executableIntents before any handler is bound",
  allFresh.filter((c) => c.executableIntents.length > 0).map((c) => c.id).join(", "),
);
assert(
  fresh.listExecutable().length === 0,
  "listExecutable() returns empty list when no handlers are bound",
  String(fresh.listExecutable().length),
);

// ---------------------------------------------------------------------------
// 2. bindHandler() updates executableIntents on the capability record
// ---------------------------------------------------------------------------

section("bindHandler() updates executableIntents");

const reg = new CapabilityRegistry();

// Bind planner with declared executable intents.
reg.bindHandler("planner", noopHandler, ["read", "explain"]);

const plannerAfter = reg.get("planner")!;
assert(plannerAfter.availability === "available", "availability flips to 'available' after bind");
assert(
  plannerAfter.executableIntents.length === 2,
  "executableIntents has exactly 2 entries after planner bind",
  String(plannerAfter.executableIntents.length),
);
assert(
  plannerAfter.executableIntents.includes("read"),
  "planner executableIntents includes 'read'",
);
assert(
  plannerAfter.executableIntents.includes("explain"),
  "planner executableIntents includes 'explain'",
);

// Bind nutrition-knowledge with 3 executable intents.
reg.bindHandler("nutrition-knowledge", noopHandler, ["read", "search", "explain"]);
const nkAfter = reg.get("nutrition-knowledge")!;
assert(
  nkAfter.executableIntents.length === 3,
  "nutrition-knowledge executableIntents has 3 entries",
  String(nkAfter.executableIntents.length),
);
assert(nkAfter.executableIntents.includes("search"), "nutrition-knowledge executableIntents includes 'search'");

// Unbound capability (shopping) remains empty.
const shoppingUnbound = reg.get("shopping")!;
assert(
  shoppingUnbound.executableIntents.length === 0,
  "shopping (unbound) still has empty executableIntents",
);

// ---------------------------------------------------------------------------
// 3. listExecutable() reflects reality
// ---------------------------------------------------------------------------

section("listExecutable() returns only bound-and-declaring capabilities");

const execList = reg.listExecutable();
const execIds = execList.map((c) => c.id);

assert(
  execIds.includes("planner"),
  "listExecutable() includes planner (bound with executable intents)",
);
assert(
  execIds.includes("nutrition-knowledge"),
  "listExecutable() includes nutrition-knowledge (bound with executable intents)",
);
assert(
  !execIds.includes("shopping"),
  "listExecutable() does NOT include shopping (unbound)",
);
assert(
  !execIds.includes("meals"),
  "listExecutable() does NOT include meals (unbound)",
);
assert(
  execList.length === 2,
  "listExecutable() returns exactly 2 capabilities when 2 are bound with intents",
  String(execList.length),
);

// After binding shopping too:
reg.bindHandler("shopping", noopHandler, ["read", "explain"]);
assert(
  reg.listExecutable().length === 3,
  "listExecutable() grows to 3 after shopping is also bound",
  String(reg.listExecutable().length),
);

// ---------------------------------------------------------------------------
// 4. isExecutable() discriminates correctly
// ---------------------------------------------------------------------------

section("isExecutable() — per-verb discrimination");

assert(reg.isExecutable("planner", "read"), "planner 'read' is executable");
assert(reg.isExecutable("planner", "explain"), "planner 'explain' is executable");
assert(!reg.isExecutable("planner", "generate"), "planner 'generate' is NOT executable (no handler path)");
assert(!reg.isExecutable("planner", "add"), "planner 'add' is NOT executable");
assert(!reg.isExecutable("planner", "delete"), "planner 'delete' is NOT executable");
assert(!reg.isExecutable("planner", "move"), "planner 'move' is NOT executable");
assert(!reg.isExecutable("planner", "replace"), "planner 'replace' is NOT executable");

assert(reg.isExecutable("nutrition-knowledge", "search"), "nutrition-knowledge 'search' is executable");
assert(!reg.isExecutable("nutrition-knowledge", "analyse"), "nutrition-knowledge 'analyse' is NOT executable (gap in handler)");
assert(!reg.isExecutable("nutrition-knowledge", "compare"), "nutrition-knowledge 'compare' is NOT executable (gap in handler)");
assert(!reg.isExecutable("nutrition-knowledge", "report"), "nutrition-knowledge 'report' is NOT executable (gap in handler)");

assert(reg.isExecutable("shopping", "read"), "shopping 'read' is executable");
assert(!reg.isExecutable("shopping", "add"), "shopping 'add' is NOT executable");
assert(!reg.isExecutable("shopping", "delete"), "shopping 'delete' is NOT executable");
assert(!reg.isExecutable("shopping", "generate"), "shopping 'generate' is NOT executable");

// Unknown capability always returns false.
assert(!reg.isExecutable("nonexistent", "read"), "unknown capability → isExecutable = false");

// ---------------------------------------------------------------------------
// 5. supportedIntents remains intact (architecture-declared, independent of execution)
// ---------------------------------------------------------------------------

section("supportedIntents remains truthful and independent of executableIntents");

const planner = reg.get("planner")!;
const supportedButNotExecutable: IntentVerb[] = ["recommend", "generate", "add", "move", "replace", "delete", "import", "share"];
for (const verb of supportedButNotExecutable) {
  assert(
    planner.supportedIntents.includes(verb),
    `planner supportedIntents still contains '${verb}' (architecture-declared)`,
  );
  assert(
    !planner.executableIntents.includes(verb),
    `planner executableIntents does NOT contain '${verb}' (no handler path)`,
  );
}

const nk = reg.get("nutrition-knowledge")!;
for (const verb of ["analyse", "compare", "report"] as IntentVerb[]) {
  assert(nk.supportedIntents.includes(verb), `nutrition-knowledge supportedIntents still contains '${verb}'`);
  assert(!nk.executableIntents.includes(verb), `nutrition-knowledge executableIntents does NOT contain '${verb}'`);
}

// ---------------------------------------------------------------------------
// 6. Canonical singleton — four bindings (INT2/INT3/INT4/INT8) reflected correctly
// ---------------------------------------------------------------------------

section("Canonical singleton — INT2/INT3/INT4/INT8/INT10/INT12 bindings are truthful");

const singletonPlanner = intelligencePlatform.getCapability(PLANNER_CAPABILITY_ID)!;
assert(
  singletonPlanner.availability === "available",
  "singleton planner is 'available'",
);
assert(
  singletonPlanner.executableIntents.length === PLANNER_EXECUTABLE_INTENTS.length,
  `singleton planner has ${PLANNER_EXECUTABLE_INTENTS.length} executable intents`,
  String(singletonPlanner.executableIntents.length),
);
for (const verb of PLANNER_EXECUTABLE_INTENTS) {
  assert(
    singletonPlanner.executableIntents.includes(verb),
    `singleton planner executableIntents includes '${verb}'`,
  );
}

const singletonShopping = intelligencePlatform.getCapability(SHOPPING_CAPABILITY_ID)!;
assert(
  singletonShopping.availability === "available",
  "singleton shopping is 'available'",
);
assert(
  singletonShopping.executableIntents.length === SHOPPING_EXECUTABLE_INTENTS.length,
  `singleton shopping has ${SHOPPING_EXECUTABLE_INTENTS.length} executable intents`,
  String(singletonShopping.executableIntents.length),
);

const singletonNK = intelligencePlatform.getCapability(NUTRITION_KNOWLEDGE_CAPABILITY_ID)!;
assert(
  singletonNK.availability === "available",
  "singleton nutrition-knowledge is 'available'",
);
assert(
  singletonNK.executableIntents.length === NUTRITION_KNOWLEDGE_EXECUTABLE_INTENTS.length,
  `singleton nutrition-knowledge has ${NUTRITION_KNOWLEDGE_EXECUTABLE_INTENTS.length} executable intents`,
  String(singletonNK.executableIntents.length),
);
assert(
  singletonNK.executableIntents.includes("search"),
  "singleton nutrition-knowledge executableIntents includes 'search' (distinct from planner/shopping)",
);

const singletonPantry = intelligencePlatform.getCapability(PANTRY_CAPABILITY_ID)!;
assert(
  singletonPantry.availability === "available",
  "singleton pantry is 'available'",
);
assert(
  singletonPantry.executableIntents.length === PANTRY_EXECUTABLE_INTENTS.length,
  `singleton pantry has ${PANTRY_EXECUTABLE_INTENTS.length} executable intents`,
  String(singletonPantry.executableIntents.length),
);
for (const verb of PANTRY_EXECUTABLE_INTENTS) {
  assert(
    singletonPantry.executableIntents.includes(verb),
    `singleton pantry executableIntents includes '${verb}'`,
  );
}

const singletonDiary = intelligencePlatform.getCapability(DIARY_CAPABILITY_ID)!;
assert(
  singletonDiary.availability === "available",
  "singleton diary is 'available'",
);
assert(
  singletonDiary.executableIntents.length === DIARY_EXECUTABLE_INTENTS.length,
  `singleton diary has ${DIARY_EXECUTABLE_INTENTS.length} executable intents`,
  String(singletonDiary.executableIntents.length),
);
for (const verb of DIARY_EXECUTABLE_INTENTS) {
  assert(
    singletonDiary.executableIntents.includes(verb),
    `singleton diary executableIntents includes '${verb}'`,
  );
}

const singletonProfile = intelligencePlatform.getCapability(PROFILE_CAPABILITY_ID)!;
assert(
  singletonProfile.availability === "available",
  "singleton profile is 'available'",
);
assert(
  singletonProfile.executableIntents.length === PROFILE_EXECUTABLE_INTENTS.length,
  `singleton profile has ${PROFILE_EXECUTABLE_INTENTS.length} executable intents`,
  String(singletonProfile.executableIntents.length),
);
for (const verb of PROFILE_EXECUTABLE_INTENTS) {
  assert(
    singletonProfile.executableIntents.includes(verb),
    `singleton profile executableIntents includes '${verb}'`,
  );
}
assert(
  !singletonProfile.executableIntents.includes("explain") && !singletonProfile.executableIntents.includes("add"),
  "singleton profile executableIntents does NOT include 'explain' or 'add' (no live code path)",
);

const singletonHousehold = intelligencePlatform.getCapability(HOUSEHOLD_CAPABILITY_ID)!;
assert(
  singletonHousehold.availability === "available",
  "singleton household is 'available'",
);
assert(
  singletonHousehold.executableIntents.length === HOUSEHOLD_EXECUTABLE_INTENTS.length,
  `singleton household has ${HOUSEHOLD_EXECUTABLE_INTENTS.length} executable intents`,
  String(singletonHousehold.executableIntents.length),
);
for (const verb of HOUSEHOLD_EXECUTABLE_INTENTS) {
  assert(
    singletonHousehold.executableIntents.includes(verb),
    `singleton household executableIntents includes '${verb}'`,
  );
}
assert(
  !singletonHousehold.executableIntents.includes("explain") &&
    !singletonHousehold.executableIntents.includes("add") &&
    !singletonHousehold.executableIntents.includes("delete"),
  "singleton household executableIntents does NOT include 'explain', 'add' or 'delete' (no live code path)",
);

const singletonPartners = intelligencePlatform.getCapability(PARTNERS_CAPABILITY_ID)!;
assert(
  singletonPartners.availability === "available",
  "singleton partners is 'available'",
);
assert(
  singletonPartners.executableIntents.length === PARTNERS_EXECUTABLE_INTENTS.length,
  `singleton partners has ${PARTNERS_EXECUTABLE_INTENTS.length} executable intents`,
  String(singletonPartners.executableIntents.length),
);
for (const verb of PARTNERS_EXECUTABLE_INTENTS) {
  assert(
    singletonPartners.executableIntents.includes(verb),
    `singleton partners executableIntents includes '${verb}'`,
  );
}
assert(
  !singletonPartners.executableIntents.includes("explain") &&
    !singletonPartners.executableIntents.includes("recommend") &&
    !singletonPartners.executableIntents.includes("compare"),
  "singleton partners executableIntents does NOT include 'explain', 'recommend' or 'compare' (no safe grounded owner)",
);

const singletonMeals = intelligencePlatform.getCapability(MEALS_CAPABILITY_ID)!;
assert(
  singletonMeals.availability === "available",
  "singleton meals is 'available'",
);
assert(
  singletonMeals.executableIntents.length === MEALS_EXECUTABLE_INTENTS.length,
  `singleton meals has ${MEALS_EXECUTABLE_INTENTS.length} executable intents`,
  String(singletonMeals.executableIntents.length),
);
for (const verb of MEALS_EXECUTABLE_INTENTS) {
  assert(
    singletonMeals.executableIntents.includes(verb),
    `singleton meals executableIntents includes '${verb}'`,
  );
}
assert(
  !singletonMeals.executableIntents.includes("explain") &&
    !singletonMeals.executableIntents.includes("search") &&
    !singletonMeals.executableIntents.includes("recommend") &&
    !singletonMeals.executableIntents.includes("generate"),
  "singleton meals executableIntents does NOT include 'explain', 'search', 'recommend' or 'generate' (no safe grounded owner / no live code path)",
);

const singletonTemplates = intelligencePlatform.getCapability(TEMPLATES_CAPABILITY_ID)!;
assert(
  singletonTemplates.availability === "available",
  "singleton templates is 'available'",
);
assert(
  singletonTemplates.executableIntents.length === TEMPLATES_EXECUTABLE_INTENTS.length,
  `singleton templates has ${TEMPLATES_EXECUTABLE_INTENTS.length} executable intents`,
  String(singletonTemplates.executableIntents.length),
);
for (const verb of TEMPLATES_EXECUTABLE_INTENTS) {
  assert(
    singletonTemplates.executableIntents.includes(verb),
    `singleton templates executableIntents includes '${verb}'`,
  );
}
assert(
  !singletonTemplates.executableIntents.includes("explain") &&
    !singletonTemplates.executableIntents.includes("search") &&
    !singletonTemplates.executableIntents.includes("recommend") &&
    !singletonTemplates.executableIntents.includes("generate"),
  "singleton templates executableIntents does NOT include 'explain', 'search', 'recommend' or 'generate' (no safe grounded owner / no live code path)",
);

const singletonAnalyser = intelligencePlatform.getCapability(ANALYSER_CAPABILITY_ID)!;
assert(
  singletonAnalyser.availability === "available",
  "singleton analyser is 'available'",
);
assert(
  singletonAnalyser.executableIntents.length === ANALYSER_EXECUTABLE_INTENTS.length,
  `singleton analyser has ${ANALYSER_EXECUTABLE_INTENTS.length} executable intents`,
  String(singletonAnalyser.executableIntents.length),
);
for (const verb of ANALYSER_EXECUTABLE_INTENTS) {
  assert(
    singletonAnalyser.executableIntents.includes(verb),
    `singleton analyser executableIntents includes '${verb}'`,
  );
}
assert(
  !singletonAnalyser.executableIntents.includes("explain") &&
    !singletonAnalyser.executableIntents.includes("analyse") &&
    !singletonAnalyser.executableIntents.includes("report"),
  "singleton analyser executableIntents does NOT include 'explain', 'analyse' or 'report' (no safe grounded stored-read owner)",
);

// ---------------------------------------------------------------------------
// 7. Unbound capabilities on the singleton have empty executableIntents
// ---------------------------------------------------------------------------

section("Unbound singleton capabilities have empty executableIntents");

const unboundIds = ["administration"];
for (const id of unboundIds) {
  const cap = intelligencePlatform.getCapability(id);
  assert(cap !== undefined, `capability '${id}' is registered`);
  assert(
    cap!.executableIntents.length === 0,
    `'${id}' has empty executableIntents (not yet bound)`,
    String(cap!.executableIntents.length),
  );
}

// ---------------------------------------------------------------------------
// 8. listExecutableCapabilities() on the platform is truthful
// ---------------------------------------------------------------------------

section("listExecutableCapabilities() on IntelligencePlatform");

const execCapabilities = intelligencePlatform.listExecutableCapabilities();
const execCapIds = execCapabilities.map((c) => c.id);

assert(
  execCapIds.includes(PLANNER_CAPABILITY_ID),
  "listExecutableCapabilities() includes planner",
);
assert(
  execCapIds.includes(SHOPPING_CAPABILITY_ID),
  "listExecutableCapabilities() includes shopping",
);
assert(
  execCapIds.includes(NUTRITION_KNOWLEDGE_CAPABILITY_ID),
  "listExecutableCapabilities() includes nutrition-knowledge",
);
assert(
  execCapIds.includes(PANTRY_CAPABILITY_ID) &&
    execCapIds.includes(DIARY_CAPABILITY_ID) &&
    execCapIds.includes(PROFILE_CAPABILITY_ID) &&
    execCapIds.includes(HOUSEHOLD_CAPABILITY_ID) &&
    execCapIds.includes(PARTNERS_CAPABILITY_ID) &&
    execCapIds.includes(MEALS_CAPABILITY_ID) &&
    execCapIds.includes(TEMPLATES_CAPABILITY_ID) &&
    execCapIds.includes(ANALYSER_CAPABILITY_ID),
  "listExecutableCapabilities() includes pantry, diary, profile, household, partners, meals, templates and analyser",
);
assert(
  execCapabilities.length === 11,
  "listExecutableCapabilities() returns exactly 11 (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser) — scope lock (updated by INT17)",
  String(execCapabilities.length),
);
assert(
  !execCapIds.includes("administration"),
  "listExecutableCapabilities() does NOT include administration (unbound)",
);

// ---------------------------------------------------------------------------
// 9. canExecute() on IntelligencePlatform gives correct per-verb answers
// ---------------------------------------------------------------------------

section("canExecute() on IntelligencePlatform");

assert(intelligencePlatform.canExecute(PLANNER_CAPABILITY_ID, "read"), "platform.canExecute planner/read → true");
assert(intelligencePlatform.canExecute(PLANNER_CAPABILITY_ID, "explain"), "platform.canExecute planner/explain → true");
assert(!intelligencePlatform.canExecute(PLANNER_CAPABILITY_ID, "generate"), "platform.canExecute planner/generate → false");
assert(!intelligencePlatform.canExecute(PLANNER_CAPABILITY_ID, "delete"), "platform.canExecute planner/delete → false");

assert(intelligencePlatform.canExecute(NUTRITION_KNOWLEDGE_CAPABILITY_ID, "search"), "platform.canExecute nk/search → true");
assert(!intelligencePlatform.canExecute(NUTRITION_KNOWLEDGE_CAPABILITY_ID, "analyse"), "platform.canExecute nk/analyse → false");

assert(intelligencePlatform.canExecute(PARTNERS_CAPABILITY_ID, "read"), "platform.canExecute partners/read → true");
assert(!intelligencePlatform.canExecute(PARTNERS_CAPABILITY_ID, "compare"), "platform.canExecute partners/compare → false (no safe grounded owner)");

assert(intelligencePlatform.canExecute(MEALS_CAPABILITY_ID, "read"), "platform.canExecute meals/read → true");
assert(!intelligencePlatform.canExecute(MEALS_CAPABILITY_ID, "search"), "platform.canExecute meals/search → false (no safe grounded owner)");

assert(intelligencePlatform.canExecute(TEMPLATES_CAPABILITY_ID, "read"), "platform.canExecute templates/read → true");
assert(!intelligencePlatform.canExecute(TEMPLATES_CAPABILITY_ID, "search"), "platform.canExecute templates/search → false (no safe grounded owner)");

assert(intelligencePlatform.canExecute(ANALYSER_CAPABILITY_ID, "read"), "platform.canExecute analyser/read → true");
assert(!intelligencePlatform.canExecute(ANALYSER_CAPABILITY_ID, "analyse"), "platform.canExecute analyser/analyse → false (no safe grounded stored-read owner)");

assert(!intelligencePlatform.canExecute("administration", "read"), "platform.canExecute administration/read → false (unbound)");

// ---------------------------------------------------------------------------
// 10. bindHandler() with no executableIntents arg defaults to []
// ---------------------------------------------------------------------------

section("bindHandler() with no executableIntents defaults to empty list");

const regDefault = new CapabilityRegistry();
regDefault.bindHandler("planner", noopHandler); // no third arg
const plannerDefault = regDefault.get("planner")!;
assert(
  plannerDefault.availability === "available",
  "availability is 'available' even with no executableIntents declared",
);
assert(
  plannerDefault.executableIntents.length === 0,
  "executableIntents stays empty when not declared (conservative default)",
  String(plannerDefault.executableIntents.length),
);
assert(
  regDefault.listExecutable().length === 0,
  "listExecutable() is empty when handler bound with no declared intents",
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${"=".repeat(60)}`);
console.log(`INT6A Registry Executability: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
