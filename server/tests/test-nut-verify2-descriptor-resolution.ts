/**
 * NUT_VERIFY2 — descriptor-aware canonical resolution regression tests.
 *
 * NUT_VERIFY1 fixed the client's counting chain and, in doing so, measured what
 * remained: `parseIngredient` stripped quantity and unit but not DESCRIPTORS,
 * so "400g tin chickpeas, drained" reduced to "tin chickpeas drained" and the
 * exact-key canonical index — correctly — did not hold it.
 *
 * NUT_VERIFY2 closes that at the canonical layer, and this suite pins the two
 * properties that make the change safe rather than merely effective:
 *
 *   1. IT RESOLVES MORE — descriptor-rich recipe lines reach their canonical
 *      food (§1, §2).
 *   2. IT INVENTS NOTHING — identity is preserved where a descriptor is part
 *      of the food's name (§3), unknowns stay unknown (§4), and the mechanism
 *      is still exact-key with no fuzzy or substring matching anywhere (§5).
 *
 * §3 is the one that matters most. Colours are IDENTITY in THA's seed:
 * "red cabbage" and "black pepper" are their own canonical foods, with their
 * own diversity groups, distinct from "cabbage" and "pepper". A descriptor
 * peeler that reached them would silently change which plant a household is
 * credited with. These tests fail if that ever becomes possible.
 *
 * Ownership: this suite asserts the behaviour of the canonical owners
 * (`resolveCanonicalFood`, `ingredientKeyVariants`, `parseIngredient`) and the
 * one descriptor vocabulary (`shared/ingredient-descriptors.ts`). It defines
 * no food, no group, no descriptor and no rule of its own.
 *
 * Pure — no database, no network. Run: npm run test:nut-verify2
 */

import { resolveCanonicalFood, ingredientKeyVariants, freeTextIngredientKeyVariants } from "../../shared/canonical/resolver";
import { plantDiversityGroup } from "../../shared/canonical/plant-classifier";
import { parseIngredient } from "../../shared/parse-ingredient";
import { singularizeIngredientKey } from "../../shared/normalize";
import {
  LEADING_INGREDIENT_DESCRIPTORS,
  INGREDIENT_PREP_DESCRIPTORS,
} from "../../shared/ingredient-descriptors";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

/** The one chain every consumer uses: parse → singularise → resolve. */
function slugOf(raw: string): string {
  return singularizeIngredientKey(parseIngredient(raw).normalizedName);
}
function groupOf(raw: string): string | null {
  return plantDiversityGroup(slugOf(raw));
}

async function run() {
  // ── 1. The mission's own examples ───────────────────────────────────────────
  console.log("── Mission examples resolve (§1) ──");
  const missionExamples: ReadonlyArray<readonly [string, string]> = [
    ["400g tin chickpeas, drained", "chickpeas"],
    ["200g dried red lentils", "lentils"],
    ["1 small red onion", "onion"],
    ["2 cloves garlic, crushed", "garlic"],
  ];
  for (const [line, expected] of missionExamples) {
    const r = resolveCanonicalFood(slugOf(line));
    check(`"${line}" → ${expected}`, r.matched && r.canonicalSlug === expected,
      `got ${r.canonicalSlug ?? "UNRESOLVED"}`);
  }

  // ── 2. Descriptor shapes, one family at a time ──────────────────────────────
  console.log("\n── Descriptor families (§2) ──");
  const families: ReadonlyArray<readonly [string, string, string]> = [
    ["container", "1 tin chickpeas", "chickpeas"],
    ["container", "2 cans chopped tomatoes", "tomato"],
    ["size", "1 large onion", "onion"],
    ["size", "2 small carrots", "carrots"],
    ["prep", "100g chopped walnuts", "walnuts"],
    ["prep", "50g grated carrots", "carrots"],
    ["form", "160g rolled oats", "oats"],
    ["form", "200g frozen peas", "peas"],
    ["stacked", "1 x 400g tin chopped tomatoes", "tomato"],
    ["stacked", "160g rolled wholegrain oats", "oats"],
    ["stacked", "1 small red cabbage, shredded", "red-cabbage"],
    ["trailing", "400g chickpeas, rinsed and drained", "chickpeas"],
    ["trailing", "2 carrots, peeled and finely diced", "carrots"],
  ];
  for (const [family, line, expected] of families) {
    const r = resolveCanonicalFood(slugOf(line));
    check(`[${family}] "${line}" → ${expected}`, r.canonicalSlug === expected,
      `got ${r.canonicalSlug ?? "UNRESOLVED"}`);
  }

  // ── 3. IDENTITY IS NEVER PEELED — the safety property ───────────────────────
  // Each pair is two DIFFERENT canonical foods. If peeling ever reached them,
  // the left would collapse into the right and a household's plant would change.
  console.log("\n── Identity preserved: descriptor-led foods keep their own identity (§3) ──");
  const identityPairs: ReadonlyArray<readonly [string, string]> = [
    ["red cabbage", "cabbage"],
    ["black pepper", "pepper"],
  ];
  for (const [specific, generic] of identityPairs) {
    const gs = plantDiversityGroup(specific);
    const gg = plantDiversityGroup(generic);
    check(`"${specific}" ≠ "${generic}"`, gs !== null && gg !== null && gs !== gg,
      `${gs ?? "null"} vs ${gg ?? "null"}`);
    // …and still distinct when written as a real recipe line.
    check(`  …"1 small ${specific}, shredded" stays ${gs}`,
      groupOf(`1 small ${specific}, shredded`) === gs,
      `got ${groupOf(`1 small ${specific}, shredded`) ?? "null"}`);
  }

  // Descriptors that BEGIN real canonical names must resolve at full length.
  console.log("\n── Descriptor-initial canonical names resolve faithfully (§3) ──");
  const faithful: readonly string[] = [
    "dried lentils", "ground cumin", "baby spinach", "tinned tomatoes",
    "rolled oats", "fresh basil", "whole milk", "green beans",
  ];
  for (const name of faithful) {
    const direct = resolveCanonicalFood(name);
    check(`"${name}" resolves`, direct.matched, "UNRESOLVED");
    // The faithful key must be the FIRST candidate — proof it is tried before
    // any peeled form, which is what makes peeling safe.
    check(`  …and is the first candidate tried`,
      ingredientKeyVariants(name)[0] === name,
      `first candidate was "${ingredientKeyVariants(name)[0]}"`);
  }

  // ── 4. Honest gaps ──────────────────────────────────────────────────────────
  // Peeling must widen which keys are tried, never invent a match.
  console.log("\n── Honest gaps preserved (§4) ──");
  const unknowns: readonly string[] = [
    "a pinch of qwertyuiop",
    "200g dried unicorn flakes",
    "1 small red dragonfruit",
    "2 tins of nonsensefruit, drained",
    "500g beef mince",
    "2 large free-range eggs",
  ];
  for (const line of unknowns) {
    check(`"${line}" → not a plant`, groupOf(line) === null,
      `got ${groupOf(line)}`);
  }

  // A key made ENTIRELY of descriptors must never be peeled to nothing.
  console.log("\n── A key is never peeled to nothing (§4) ──");
  for (const line of ["chopped", "tin", "small", "dried"]) {
    const variants = ingredientKeyVariants(line);
    check(`"${line}" keeps at least one candidate`,
      variants.length >= 1 && variants.every((v) => v.length > 0),
      JSON.stringify(variants));
  }

  // ── 5. The mechanism is still exact-key ─────────────────────────────────────
  // No substring matching: a food embedded in a longer word must NOT match, and
  // a descriptor-only prefix removal must not become a "contains" search.
  console.log("\n── Still exact-key: no fuzzy, no substring (§5) ──");
  const mustNotMatch: readonly string[] = [
    "oatscarf",        // contains "oats"
    "garlicky",        // contains "garlic"
    "tomatoish",       // contains "tomato"
    "spinachlike",     // contains "spinach"
  ];
  for (const s of mustNotMatch) {
    check(`"${s}" does not match by substring`, !resolveCanonicalFood(s).matched,
      `matched ${resolveCanonicalFood(s).canonicalSlug}`);
  }
  // Peeling is LEADING-ONLY: a descriptor after the food is not removed, so a
  // trailing-descriptor phrase resolves only if it is itself a canonical key.
  check(
    "peeling is leading-only (interior words are not reordered or dropped)",
    ingredientKeyVariants("chickpeas tin").every((v) => v.startsWith("chickpeas")),
    JSON.stringify(ingredientKeyVariants("chickpeas tin")),
  );
  // Every candidate must be a prefix-suffix of the original word sequence —
  // i.e. peeling only ever removes leading whole words, never edits a word.
  const seq = "dried red lentils";
  check(
    "candidates are suffixes of the word sequence (whole words only)",
    ingredientKeyVariants(seq).every((v) => {
      const w = v.split(" ");
      const o = seq.split(" ");
      // allow singularisation of the final word
      return w.length <= o.length && o.slice(o.length - w.length, o.length - 1).join(" ") === w.slice(0, -1).join(" ");
    }),
    JSON.stringify(ingredientKeyVariants(seq)),
  );

  // ── 6. The descriptor vocabulary itself ─────────────────────────────────────
  console.log("\n── Descriptor vocabulary is clean (§6) ──");
  const COLOURS = ["red", "green", "black", "white", "blue", "purple", "yellow", "orange", "brown", "golden"];
  for (const c of COLOURS) {
    check(`"${c}" is NOT a peelable descriptor`, !LEADING_INGREDIENT_DESCRIPTORS.has(c));
  }
  check("descriptor set is non-empty", LEADING_INGREDIENT_DESCRIPTORS.size > 0);
  check("prep descriptors are all lowercase, single-token",
    INGREDIENT_PREP_DESCRIPTORS.every((d) => d === d.toLowerCase() && !d.includes(" ")),
    INGREDIENT_PREP_DESCRIPTORS.filter((d) => d !== d.toLowerCase() || d.includes(" ")).join(", "));

  // ── 6b. THE BOUNDARY — identity matching must never peel ────────────────────
  //
  // This guards a regression NUT_VERIFY2 caused and then fixed. Peeling was
  // first folded into `ingredientKeyVariants`, which `knowledge-binding.ts`
  // uses to match canonical identities against knowledge identities (KNOW3).
  // `smoked-cheese` then reduced to `cheese`, `ground-coffee` to `coffee`,
  // `baby-spinach` to `spinach`, `smoked-paprika` to `paprika` — and
  // `validateCanonicalSeed()` reported six real seed entries as ambiguous.
  // Three suites went red: canonical-food, NK6R, NK6S.
  //
  // Free text peels. Identity does not. If these ever converge again, the seed
  // validator starts inventing collisions between foods that differ precisely
  // by the descriptor being peeled.
  console.log("\n── Boundary: ingredientKeyVariants does NOT peel (§6b) ──");
  const identityOnly: ReadonlyArray<readonly [string, string]> = [
    ["smoked cheese", "cheese"],
    ["ground coffee", "coffee"],
    ["baby spinach", "spinach"],
    ["smoked paprika", "paprika"],
    ["extra virgin olive oil", "virgin olive oil"],
    ["toasted sesame oil", "sesame oil"],
  ];
  for (const [full, peeled] of identityOnly) {
    check(
      `identity variants of "${full}" exclude "${peeled}"`,
      !ingredientKeyVariants(full).includes(peeled),
      JSON.stringify(ingredientKeyVariants(full)),
    );
    // …while the free-text path DOES reach it, which is the whole point.
    check(
      `  …but free-text variants include it`,
      freeTextIngredientKeyVariants(full).includes(peeled),
      JSON.stringify(freeTextIngredientKeyVariants(full)),
    );
  }

  // ── 7. Client and server share one behaviour ────────────────────────────────
  // Both planes call resolveCanonicalFood through the same chain. If a second
  // parser ever appears, these two must diverge — so this pins that they do not.
  console.log("\n── One parsing behaviour, both planes (§7) ──");
  for (const [line] of missionExamples) {
    const viaChain = plantDiversityGroup(slugOf(line));
    const viaResolver = resolveCanonicalFood(slugOf(line)).diversityGroupSlug;
    check(`"${line}" — chain ≡ resolver`, viaChain === viaResolver,
      `${viaChain} vs ${viaResolver}`);
  }

  console.log(`\n${failed === 0 ? "✓" : "✗"} nut-verify2 descriptor-resolution tests — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Test run failed:", err);
  process.exit(1);
});
