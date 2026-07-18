/**
 * NUT_VERIFY1 — plant diversity counting regression tests.
 *
 * These exist because of a specific, measured gap: BEFORE this suite, no test
 * anywhere passed a QUANTITY-PREFIXED ingredient string to the plant
 * classifier. `test-canonical-food.ts` exercised the resolver only with bare
 * names ("tomatoes", "fresh basil", "garbanzo beans"), all of which resolve —
 * so a client counter that fed it whole recipe lines ("400g tin chickpeas,
 * drained") passed every gate while counting 1 plant in a week containing 31.
 *
 * The two defects guarded here, both named by LAUNCH1 and both live until
 * NUT_VERIFY1, pushed the number in OPPOSITE directions:
 *
 *   1. UNDER-COUNT — the classifier was called on the raw recipe line.
 *      `resolveCanonicalFood` is EXACT-KEY, never substring
 *      (`shared/canonical/resolver.ts:10-11`), so a quantity prefix makes a
 *      real plant unresolvable and it silently reads as "not a plant".
 *
 *   2. OVER-COUNT — the counter deduped on the INGREDIENT slug. Source of
 *      Truth Register, Domain 4: "One diversity group = one plant … A counter
 *      that dedupes on the ingredient slug over-counts and is a defect
 *      (CPI1 S1-2)."
 *
 * Ownership: this suite asserts the BEHAVIOUR of the canonical owners
 * (`plantDiversityGroup`, `resolveCanonicalFood`, `parseIngredient`). It
 * defines no plant, no group and no counting rule of its own — a second
 * definition here would be the duplicate ownership the register forbids.
 *
 * Pure — no database, no network. Run: npm run test:nut-verify1
 */

import { plantDiversityGroup, isPlantIngredient } from "../../shared/canonical/plant-classifier";
import { parseIngredient } from "../../shared/parse-ingredient";
import { singularizeIngredientKey } from "../../shared/normalize";
import { normaliseForReuse } from "../../client/src/lib/ingredient-reuse";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

/**
 * The canonical chain every plant counter must use — identical to the server's
 * 30-plants counter and to `PlantDiversityReport`. Reproduced here (not
 * imported from a component) so the TEST pins the chain's behaviour rather
 * than trusting whichever caller it is checking.
 */
function slugOf(raw: string): string {
  return singularizeIngredientKey(parseIngredient(raw).normalizedName);
}

/**
 * Real recipe lines whose quantity/unit prefix `parseIngredient` fully removes,
 * leaving a key the canonical seed resolves. These are the lines NUT_VERIFY1
 * actually recovered: every one counted as ZERO before the fix.
 */
const RESOLVES_AFTER_PARSE: ReadonlyArray<readonly [string, string]> = [
  ["100g baby spinach", "spinach"],
  ["2 celery sticks, sliced", "celery"],
  ["2 raw beetroot, peeled and grated", "beetroot"],
  ["2 cloves garlic, crushed", "garlic"],
];

/**
 * CHARACTERISATION — the residual gap, recorded rather than hidden.
 *
 * `parseIngredient` removes quantity and unit but NOT descriptor words, so a
 * DESCRIPTOR left in front of the food still defeats the resolver's exact-key
 * rule: "400g tin chickpeas, drained" reduces to "tin chickpeas", which is not
 * a canonical key, while bare "chickpeas" resolves cleanly.
 *
 * These assert the CURRENT behaviour (still null) so the gap is measured and
 * cannot silently widen. **A failure here is good news** — it means the
 * resolution layer improved, and the entry should move to RESOLVES_AFTER_PARSE.
 *
 * This is NOT a client defect and is deliberately not fixed here: the server's
 * 30-plants counter uses the identical chain and loses exactly the same lines.
 * Closing it means either teaching the parser about descriptors or relaxing the
 * resolver's exact-key discipline (`shared/canonical/resolver.ts:10-11`) — an
 * architectural decision about a canonical owner, outside NUT_VERIFY1's scope.
 */
const BLOCKED_BY_DESCRIPTORS: ReadonlyArray<readonly [string, string, string]> = [
  ["400g tin chickpeas, drained", "chickpeas", "tin"],
  ["200g dried red lentils", "lentils", "dried red"],
  ["1 x 400g tin chopped tomatoes", "tomatoes", "tin chopped"],
  ["1 small red cabbage, shredded", "cabbage", "small red"],
  ["160g rolled wholegrain oats", "oats", "rolled wholegrain"],
  ["1 tbsp chopped walnuts, optional", "walnuts", "chopped"],
];

const REAL_RECIPE_LINES = RESOLVES_AFTER_PARSE;

async function run() {
  // ── 1. The under-count defect ───────────────────────────────────────────────
  // Each of these is unmistakably a plant. Before NUT_VERIFY1 every one of them
  // counted as zero.
  console.log("── Quantity-prefixed lines resolve to a plant (defect 1) ──");
  for (const [line, bare] of REAL_RECIPE_LINES) {
    const group = plantDiversityGroup(slugOf(line));
    check(
      `"${line}" → a diversity group`,
      group !== null,
      `got null; bare "${bare}" → ${plantDiversityGroup(bare) ?? "null"}`,
    );
  }

  // The regression in its sharpest form: parsing must not CHANGE the answer a
  // bare name already gave. If these ever disagree, the parser has broken the
  // resolver rather than fed it.
  console.log("\n── Parsed line agrees with the bare name ──");
  for (const [line, bare] of REAL_RECIPE_LINES) {
    const fromLine = plantDiversityGroup(slugOf(line));
    const fromBare = plantDiversityGroup(bare);
    check(
      `"${line}" ≡ "${bare}"`,
      fromLine !== null && fromLine === fromBare,
      `line=${fromLine ?? "null"} bare=${fromBare ?? "null"}`,
    );
  }

  // The defect in its purest form: parsing must strictly BEAT the raw line.
  // Before NUT_VERIFY1 the raw line was what got classified, and every one of
  // these returned null.
  console.log("\n── Parsed slug beats the raw line (the fixed defect) ──");
  for (const [line] of RESOLVES_AFTER_PARSE) {
    check(
      `"${line}" — raw null, parsed resolves`,
      plantDiversityGroup(line) === null && plantDiversityGroup(slugOf(line)) !== null,
      `raw=${plantDiversityGroup(line) ?? "null"} parsed=${plantDiversityGroup(slugOf(line)) ?? "null"}`,
    );
  }

  // ── 1b. The measured residual ───────────────────────────────────────────────
  console.log("\n── Descriptor-blocked lines (characterisation — failure here means IMPROVEMENT) ──");
  for (const [line, bare, descriptor] of BLOCKED_BY_DESCRIPTORS) {
    const got = plantDiversityGroup(slugOf(line));
    check(
      `"${line}" still blocked by "${descriptor}"`,
      got === null,
      `NOW RESOLVES to "${got}" — good: move this entry into RESOLVES_AFTER_PARSE`,
    );
    // The bare name must resolve, or the fixture is wrong rather than the code.
    check(`  …and bare "${bare}" does resolve`, plantDiversityGroup(bare) !== null);
  }

  // ── 2. The over-count defect ────────────────────────────────────────────────
  // One diversity group = one plant (SoT Domain 4). Distinct ingredient slugs
  // that share a group must collapse to ONE. Deduping on the slug would give 2+.
  console.log("\n── One group = one plant (defect 2) ──");
  // Bare names deliberately: this asserts DEDUPE semantics (one group = one
  // plant), not parsing. Mixing the two would let a parser gap masquerade as a
  // counting pass.
  const sameGroupPairs: ReadonlyArray<readonly [string, string]> = [
    ["kale", "cavolo nero"],
    ["tomatoes", "cherry tomatoes"],
  ];
  for (const [a, b] of sameGroupPairs) {
    const ga = plantDiversityGroup(slugOf(a));
    const gb = plantDiversityGroup(slugOf(b));
    if (ga === null || gb === null) {
      // Not a counting failure — one of the two simply is not in the seed.
      // Recorded as a skip rather than a false pass or a false alarm.
      console.log(`  – skipped "${a}" / "${b}" (${ga ?? "null"} / ${gb ?? "null"}) — not both in the canonical seed`);
      continue;
    }
    const counted = new Set([ga, gb]).size;
    check(`"${a}" + "${b}" count as 1 plant, not 2`, counted === 1, `groups: ${ga}, ${gb}`);
  }

  // A group set must never exceed the number of lines that produced it.
  console.log("\n── Counting is bounded and group-keyed ──");
  const groups = new Set<string>();
  for (const [line] of REAL_RECIPE_LINES) {
    const g = plantDiversityGroup(slugOf(line));
    if (g) groups.add(g);
  }
  check(
    "group count ≤ ingredient lines",
    groups.size <= REAL_RECIPE_LINES.length,
    `${groups.size} > ${REAL_RECIPE_LINES.length}`,
  );
  check(
    "every parseable line contributes a distinct plant",
    groups.size === REAL_RECIPE_LINES.length,
    `${groups.size} groups from ${REAL_RECIPE_LINES.length} lines`,
  );

  // ── 3. Honest absence ───────────────────────────────────────────────────────
  // The fix must not turn the classifier into a guesser. A non-plant stays a
  // non-plant, and an unknown stays unknown — never coerced into a plant.
  console.log("\n── Non-plants and unknowns are still not plants ──");
  const notPlants = [
    "500g beef mince",
    "2 large free-range eggs",
    "200ml whole milk",
    "1 tsp sea salt",
    "a pinch of qwertyuiop",
  ];
  for (const line of notPlants) {
    check(`"${line}" → not a plant`, plantDiversityGroup(slugOf(line)) === null);
  }

  // ── 4. The predicate and the group agree ────────────────────────────────────
  // `isPlantIngredient` gates the report's SECTIONING and `plantDiversityGroup`
  // its COUNT. Both were called on raw lines; both are now called on the slug.
  // If they ever disagree, an ingredient counts as a plant but is filed
  // elsewhere on screen (or the reverse) — the visible symptom D5 recorded.
  console.log("\n── Sectioning predicate agrees with the counter ──");
  for (const [line] of REAL_RECIPE_LINES) {
    const slug = slugOf(line);
    check(
      `"${line}" — predicate ≡ group`,
      isPlantIngredient(slug) === (plantDiversityGroup(slug) !== null),
      `isPlant=${isPlantIngredient(slug)} group=${plantDiversityGroup(slug) ?? "null"}`,
    );
  }

  // ── 5. The display name a household actually reads ──────────────────────────
  // Found by BROWSER verification, not by reading code: with the counting fix
  // in place, garlic finally reached the Plant Based table and rendered as
  // "Arlic". `stripForMatch`'s unit alternation had no trailing word boundary,
  // so "3 garlic cloves" matched "3 g" as *3 grams*. Pre-existing and invisible
  // for as long as garlic never reached that table.
  console.log("\n── Ingredient display keys are not eaten by the unit regex ──");
  const displayCases: ReadonlyArray<readonly [string, string]> = [
    ["3 garlic cloves, crushed", "garlic"],   // was "arlic"
    ["2 cloves garlic, crushed", "garlic"],   // was "s garlic"
    ["1 clove garlic", "garlic"],
    ["200g garlic", "garlic"],                // a REAL unit must still strip
    ["2 tsp ground ginger", "ginger"],
    ["100g lentils", "lentils"],
  ];
  for (const [raw, expected] of displayCases) {
    const got = normaliseForReuse(raw);
    check(`"${raw}" → "${expected}"`, got === expected, `got "${got}"`);
  }

  console.log(`\n${failed === 0 ? "✓" : "✗"} nut-verify1 plant-diversity tests — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Test run failed:", err);
  process.exit(1);
});
