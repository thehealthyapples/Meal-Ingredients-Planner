/**
 * test-profile-allergy-dietary-exclusion-labels.ts
 * =================================================
 * NSR1 follow-up (profile-label-vs-allergy trace, 2026-10-05) — BW03 (Vegetarian
 * Household) showed "meat, fish" under the Profile page's "Allergies & Intolerances"
 * heading, while the fixture's own authored intent states plainly: "No allergy
 * exists — the meat/fish exclusion is a diet, not an allergy" (BENCHMARK_HOUSEHOLD_
 * WORLD.md / world-fixtures.ts BW03 knownGaps).
 *
 * Trace result: the canonical restriction library (shared/restrictions/restriction-
 * library.ts) already tags every restriction a `tier` — `major_allergen` or
 * `additional_restriction` — and the server already trusts that tier for its own
 * safety wording (household-dietary-safety.ts:497, "MAJOR ALLERGEN" vs "restriction").
 * `meat`, `honey` and `coconut` are tiered `additional_restriction` with an explicit
 * "not an allergen" comment on each. `fish` is tiered `major_allergen` (a genuine
 * UK/EU statutory allergen in general) — the library has no way to know that THIS
 * household's `fish` entry came from a vegetarian diet pattern rather than a
 * declared allergy, because no provenance field exists on the stored value. So only
 * the tier-`additional_restriction` values can be safely relabelled; `fish` cannot,
 * and is correctly left under Allergies & Intolerances by `isDietaryExclusionOnly`
 * (client/src/lib/diets.ts).
 *
 * This test proves three things, all offline (no DB, no server, no browser):
 *   1. `isDietaryExclusionOnly` matches the canonical tier for the values this
 *      investigation actually found live (meat, honey, coconut vs fish, nuts, etc.),
 *      including BW03's exact pair.
 *   2. An unresolved/unknown value stays on the cautious (allergy) side — the
 *      function never guesses a value it cannot resolve into a non-allergen.
 *   3. The label split changes nothing about enforcement: `candidateHardExcluded`
 *      (the Smart Suggest hard-restriction gate) still excludes meat- and
 *      fish-containing candidates for BW03's exact restriction array, identically
 *      whether or not a value is shown under "Allergies & Intolerances" or "Other
 *      Dietary Restrictions" on the Profile page. The relabel is presentation-only.
 *
 * Run with: npx tsx server/tests/test-profile-allergy-dietary-exclusion-labels.ts
 */

import { isDietaryExclusionOnly } from "../../client/src/lib/diets";
import { candidateHardExcluded } from "../lib/smart-suggest-service.js";

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

// ─── 1. Values this investigation found live, against the canonical tier ───

section("1. additional_restriction tier → dietary exclusion only (not an allergy)");

assert(isDietaryExclusionOnly("meat") === true, '"meat" is tier additional_restriction → dietary exclusion only');
assert(isDietaryExclusionOnly("honey") === true, '"honey" is tier additional_restriction → dietary exclusion only');
assert(isDietaryExclusionOnly("coconut") === true, '"coconut" is tier additional_restriction → dietary exclusion only');

section("2. major_allergen tier → stays under Allergies & Intolerances");

assert(isDietaryExclusionOnly("fish") === false, '"fish" is tier major_allergen (UK/EU statutory allergen) → NOT reclassified, despite BW03 using it as a vegetarian exclusion');
assert(isDietaryExclusionOnly("Nuts") === false, '"Nuts" is tier major_allergen → stays an allergy');
assert(isDietaryExclusionOnly("Gluten-Free") === false, '"Gluten-Free" is tier major_allergen → stays an allergy');
assert(isDietaryExclusionOnly("Sesame") === false, '"Sesame" is tier major_allergen → stays an allergy');
assert(isDietaryExclusionOnly("Dairy-Free") === false, '"Dairy-Free" is tier major_allergen → stays an allergy');
assert(isDietaryExclusionOnly("Eggs") === false, '"Eggs" is tier major_allergen → stays an allergy');
assert(isDietaryExclusionOnly("Shellfish") === false, '"Shellfish" is tier major_allergen → stays an allergy');
assert(isDietaryExclusionOnly("Soy") === false, '"Soy" is tier major_allergen → stays an allergy');

section("3. Unresolved values stay on the cautious (allergy) side — never guessed");

assert(isDietaryExclusionOnly("kiwi") === false, 'unresolved "kiwi" is NOT reclassified — the library is silent on it, so it stays cautious');
assert(isDietaryExclusionOnly("") === false, "empty string is not reclassified");
assert(isDietaryExclusionOnly("mustard") === false, '"mustard" (enforceable substring-only, no canonical tier) is NOT reclassified');

section("4. BW03's exact fixture pair, together");

const bw03Restrictions = ["meat", "fish"]; // world-fixtures.ts BW03 eaters' hardRestrictions
const bw03DietaryExclusionsOnly = bw03Restrictions.filter(isDietaryExclusionOnly);
const bw03StillAllergySide = bw03Restrictions.filter((r) => !isDietaryExclusionOnly(r));
assert(
  bw03DietaryExclusionsOnly.length === 1 && bw03DietaryExclusionsOnly[0] === "meat",
  'Of BW03\'s ["meat","fish"], only "meat" moves to Other Dietary Restrictions',
);
assert(
  bw03StillAllergySide.length === 1 && bw03StillAllergySide[0] === "fish",
  '"fish" correctly remains under Allergies & Intolerances — the data model cannot prove it is not a declared allergy for this household',
);

section("5. Enforcement is unaffected — the relabel is presentation-only");

// A vegetarian household's hard restrictions, exactly as BW03's would be merged by
// the Smart Suggest route (server/routes.ts) regardless of how the Profile page
// labels them for display.
const bw03HardExcluded = ["meat", "fish"];

assert(
  candidateHardExcluded("Spaghetti Bolognese", ["beef mince", "spaghetti", "tinned tomatoes"], bw03HardExcluded) === true,
  "a beef (meat) dish is still hard-excluded — relabelling \"meat\" as a dietary exclusion does not weaken enforcement",
);
assert(
  candidateHardExcluded("Baked Sea Bass", ["sea bass", "lemon", "olive oil"], bw03HardExcluded) === true,
  "a fish dish is still hard-excluded — \"fish\" staying under Allergies & Intolerances changes nothing about enforcement either",
);
assert(
  candidateHardExcluded("Tarka Dal", ["red lentils", "turmeric", "cumin seeds", "garlic", "ghee", "coriander"], bw03HardExcluded) === false,
  "a genuinely vegetarian dish (BW03's own cookbook meal) is still NOT excluded",
);

console.log("\n" + "─".repeat(40));
console.log(`PROFILE ALLERGY/DIETARY-EXCLUSION LABEL TESTS: ${passed} passed, ${failed} failed`);
console.log("─".repeat(40));

if (failed > 0) {
  console.error("FAILED");
  process.exit(1);
} else {
  console.log("All tests passed.");
}
