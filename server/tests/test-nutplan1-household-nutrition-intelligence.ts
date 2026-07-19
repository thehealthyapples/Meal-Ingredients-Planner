/**
 * NUTPLAN1 — household nutrition intelligence regression tests.
 *
 * NUTPLAN1's mission word was *complete*, not *build*, so its first act was an
 * inventory. The inventory found that the two highest-value gaps were both cases
 * of a surface not reaching an owner THA already had — not of a missing owner.
 * This suite pins both, plus the measurement that made the second one a defect
 * rather than a preference.
 *
 *   §1 SAFETY — `POST /api/meals/smart-create-from-ingredients` reaches the
 *      canonical household dietary safety gate. It previously reached NO gate:
 *      `rankMealsByIngredients` has no dietary awareness of any kind and the only
 *      filter was a hardcoded drink-name regex. It is the sibling of
 *      `/api/suggest-from-ingredients`, which PROD6 closed — this one was simply
 *      never enumerated in PROD6's hand-maintained route list.
 *
 *   §2 BEHAVIOUR — the gate actually drops an unsafe meal for a restricted
 *      household, and fails closed on an unresolved one. A structural assertion
 *      that a symbol appears in a route body proves the call site exists, not
 *      that it refuses anything.
 *
 *   §3 ONE OWNER — the weekly plant count is derived by the SERVER and rendered
 *      by the client. The planner previously received `weeklyProgress.plantCount`
 *      and ignored it, recomputing with a rival dedup rule.
 *
 *   §4 THE MEASUREMENT — the two rules genuinely disagree, and the retired one
 *      over-counts. This is the section that stops §3 being re-litigated as a
 *      style choice: it reproduces the divergence from ordinary recipe lines.
 *
 * Ownership: this suite asserts the behaviour of existing canonical owners
 * (`household-dietary-safety.ts`, `plant-classifier.ts`) and the wiring of two
 * surfaces to them. It defines no restriction, no food, no group and no rule.
 *
 * No network. §1 and §3 read source text; §2 and §4 are pure.
 * Run: npm run test:nutplan1
 */

import { readFileSync } from "fs";
import { join } from "path";
import { isMealSafeForHousehold } from "../lib/household-dietary-safety";
import type { HouseholdSafetyContext } from "../lib/household-dietary-safety";
import { plantDiversityGroup, isPlantIngredient } from "../../shared/canonical/plant-classifier";
import { parseIngredient } from "../../shared/parse-ingredient";
import { singularizeIngredientKey } from "../../shared/normalize";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

const repoRoot = join(import.meta.dirname, "..", "..");
const read = (p: string) => readFileSync(join(repoRoot, p), "utf8");

/** Extract one route's body from routes.ts, up to the next route registration. */
function routeBody(source: string, signature: string): string {
  const start = source.indexOf(signature);
  if (start === -1) return "";
  const rest = source.slice(start + signature.length);
  const next = rest.search(/\n {2}app\.(post|get|put|patch|delete)\(/);
  return next === -1 ? rest : rest.slice(0, next);
}

/** The one chain every plant-count consumer uses: parse → singularise → group. */
function groupOf(raw: string): string | null {
  return plantDiversityGroup(singularizeIngredientKey(parseIngredient(raw).normalizedName));
}

async function run() {
  // ── 1. The route reaches the canonical gate ─────────────────────────────────
  console.log("\n── §1 Safety gate is wired (structural) ──");

  const routes = read("server/routes.ts");
  const body = routeBody(routes, 'app.post("/api/meals/smart-create-from-ingredients"');

  check("route is present", body.length > 0);
  check(
    "resolves the household safety context SERVER-SIDE",
    body.includes("resolveHouseholdSafetyContext(req.user!.id)"),
    "must never take the household from req.body",
  );
  check(
    "puts every candidate to isMealSafeForHousehold",
    body.includes("isMealSafeForHousehold"),
  );
  check(
    "fails closed on an unresolved household",
    body.includes("HOUSEHOLD_SAFETY_UNAVAILABLE"),
  );
  check(
    "never presents a filtered list as the whole answer",
    body.includes("withheldForSafety"),
    "PROD6's rule — a shortened list must say it was shortened",
  );

  // The gate must run BEFORE the response is built, not after.
  const gateAt = body.indexOf("isMealSafeForHousehold");
  const respondAt = body.indexOf("res.json({");
  check(
    "the gate runs before the response is assembled",
    gateAt !== -1 && respondAt !== -1 && gateAt < respondAt,
  );

  // ── 2. The gate actually refuses ────────────────────────────────────────────
  // A structural check proves the call exists. This proves it bites.
  console.log("\n── §2 Safety gate refuses (behavioural) ──");

  const peanutHousehold: HouseholdSafetyContext = {
    status: "resolved",
    hardRestrictions: ["peanut"],
    activeRestrictions: [{ id: "peanut" } as any],
    requesterDietPattern: null,
    members: [],
    softDietTypes: [],
    excludedIngredients: [],
  } as unknown as HouseholdSafetyContext;

  const satay = { name: "Chicken Satay", ingredients: ["chicken thighs", "peanut butter", "soy sauce"] };
  const roast = { name: "Roast Chicken", ingredients: ["chicken", "potatoes", "carrots"] };

  check(
    "a peanut household is refused a peanut meal",
    isMealSafeForHousehold(satay, peanutHousehold).safe === false,
  );
  check(
    "the same household is still offered a safe meal",
    isMealSafeForHousehold(roast, peanutHousehold).safe === true,
    "the gate must narrow the list, not empty it",
  );

  // Fail-closed: an unavailable context refuses EVERYTHING, including the meal
  // that is objectively safe. "We could not find out" is not "unrestricted".
  const unavailable = {
    status: "unavailable",
    hardRestrictions: [],
    activeRestrictions: [],
    requesterDietPattern: null,
  } as unknown as HouseholdSafetyContext;

  check(
    "an unresolved household is refused the unsafe meal",
    isMealSafeForHousehold(satay, unavailable).safe === false,
  );
  check(
    "an unresolved household is refused even a SAFE meal (fails closed)",
    isMealSafeForHousehold(roast, unavailable).safe === false,
    "this is the property that makes the 503 the correct response",
  );

  // ── 3. One owner for the weekly plant count ─────────────────────────────────
  console.log("\n── §3 Weekly plant count has one owner ──");

  const strip = read("client/src/components/PlannerIntelligenceStrip.tsx");
  const chips = read("client/src/components/nutrition-variety-chips.tsx");

  check(
    "the planner strip renders the SERVER's count",
    strip.includes("data?.weeklyProgress?.plantCount"),
  );
  check(
    "the planner strip no longer derives a plant count",
    !strip.includes("function computePlantCount"),
  );
  check(
    "the counter component receives the count as a prop",
    /plantCount:\s*number/.test(chips),
  );
  check(
    "the counter component no longer derives one",
    !chips.includes('from "@/lib/ingredient-reuse"'),
    "the retired rival dedup rule must not return (asserted on the IMPORT, "
      + "not on the prose — the file's comment names the retired rule on purpose)",
  );

  // Neither client file may reach for a plant classifier to COUNT with. The
  // per-meal variety score (`computeMealVariety`) is a different fact with a
  // different owner and legitimately stays.
  check(
    "the planner strip imports no plant classifier",
    !strip.includes("@shared/canonical/plant-classifier"),
  );

  // The server side of the same fact must still be the full canonical chain.
  //
  // NUTPLAN2 converged this: the route used to spell the parse → singularize →
  // plantDiversityGroup chain out inline, identically to /api/home/intelligence.
  // Both now delegate to `plantGroupsForIngredientLines`, so the assertion checks
  // BOTH ends — the route reaches the canonical helper, and the helper is the one
  // that dedups by diversity group. That is stronger than the inline check it
  // replaces, which could only ever see one of the two copies.
  const weekRoute = routeBody(routes, 'app.get("/api/planner/weeks/:weekId/intelligence"');
  check(
    "the week route counts plants through the canonical owner",
    weekRoute.includes("plantGroupsForIngredientLines") && weekRoute.includes("plantGroups.add"),
  );
  const homeRoute = routeBody(routes, 'app.get("/api/home/intelligence"');
  check(
    "the home route counts plants through the same owner (they cannot drift)",
    homeRoute.includes("plantGroupsForIngredientLines"),
  );
  const classifier = read("shared/canonical/plant-classifier.ts");
  check(
    "the canonical owner dedups by DIVERSITY GROUP, not by ingredient key",
    /export function plantGroupsForIngredientLines[\s\S]*?plantDiversityGroup\(slug\)[\s\S]*?groups\.add\(group\)/.test(
      classifier,
    ),
  );

  // ── 4. The rules genuinely disagree, and the retired one over-counts ────────
  // Reproduces the measurement that made §3 a defect rather than a preference.
  console.log("\n── §4 The measured divergence (why §3 matters) ──");

  // Ordinary lines from a real week. Under the canonical rule a red onion is an
  // onion; under the retired rule it was a second plant.
  const week = [
    "cherry tomatoes", "vine tomatoes", "400g tinned tomatoes",
    "red onion", "onion",
    "red pepper", "pepper",
  ];

  const groups = new Set<string>();
  for (const raw of week) {
    const g = groupOf(raw);
    if (g) groups.add(g);
  }

  check(
    "red onion and onion are ONE plant",
    groupOf("red onion") === groupOf("onion"),
    `${groupOf("red onion")} vs ${groupOf("onion")}`,
  );
  check(
    "red pepper and pepper are ONE plant",
    groupOf("red pepper") === groupOf("pepper"),
    `${groupOf("red pepper")} vs ${groupOf("pepper")}`,
  );
  check(
    "cherry and tinned tomatoes are ONE plant",
    groupOf("cherry tomatoes") === groupOf("400g tinned tomatoes") &&
      groupOf("cherry tomatoes") === "tomato",
  );

  // A KNOWN, MEASURED GAP, pinned rather than hidden (NUTPLAN1 §9 → NUTPLAN2 R1).
  // "vine" is not in the descriptor vocabulary, so "vine tomatoes" resolves to
  // NOTHING and contributes zero plants — an UNDER-count, the opposite direction
  // to the over-count §3 fixed. It is pinned here so the gap is visible in CI
  // rather than rediscovered. If this assertion starts failing, someone has fixed
  // it: that is good news — delete this check and close the roadmap item.
  check(
    "KNOWN GAP: 'vine tomatoes' still resolves to nothing",
    groupOf("vine tomatoes") === null,
    "if this now resolves, the descriptor vocabulary gained 'vine' — update NUTPLAN2 R1",
  );

  // NUT_VERIFY2's safety finding, re-pinned from this side: a colour that is part
  // of a food's IDENTITY must NOT collapse. If this ever fails, the peeler has
  // reached too far and households are being credited with the wrong plant.
  check(
    "black pepper is NOT the same plant as pepper (colour as identity)",
    groupOf("black pepper") !== groupOf("pepper"),
    `${groupOf("black pepper")} vs ${groupOf("pepper")}`,
  );

  // The whole point: the canonical rule counts FEWER plants than the retired one.
  // Seven lines → three plants (tomato, onion, pepper). The retired rule scored
  // these as six distinct keys, because it separated red onion from onion, red
  // pepper from pepper, and every tomato spelling from every other.
  check(
    "the canonical rule counts 3 distinct plants across these 7 lines",
    groups.size === 3,
    `got ${groups.size}: ${[...groups].sort().join(", ")}`,
  );

  // WHY the count must come from the server, stated as a property.
  //
  // NUT_VERIFY1's finding, pinned from this side: `isPlantIngredient` on a RAW
  // recipe line is unreliable — the canonical index is exact-key, never
  // substring, so a line carrying a quantity or an unknown descriptor reads as
  // "not a plant". The retired client rule called it on raw lines. The server
  // parses and singularises FIRST, which is exactly the difference.
  check(
    "raw-line classification is unreliable (why the client must not count)",
    isPlantIngredient("400g tinned tomatoes") === false &&
      groupOf("400g tinned tomatoes") === "tomato",
    "same food: raw says no, the canonical chain says tomato",
  );

  console.log(
    `\n${failed === 0 ? "✓" : "✗"} NUTPLAN1 household nutrition intelligence — ${passed} passed, ${failed} failed`,
  );
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Test run failed:", err);
  process.exit(1);
});
