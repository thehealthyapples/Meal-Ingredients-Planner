// WS9 — Food Alternatives Engine: worked examples + trust validation.
// Run: tsx server/tests/test-alternatives-engine.ts
//
// Produces the eight worked examples the brief requires (chicken, milk, rice,
// greek yoghurt, bacon, pizza base, beef mince, tomato sauce), demonstrates the
// household-adaptation case (cooked breakfast / lasagne / pizza night), exercises
// the exclusion gate (vegan / dairy-free / gluten-free / keto), the lower-UPF and
// cuisine types, the "already fits → no change" affirming path, and the silence
// contract — then enforces the trust gate (no ranking / judgement language) as a
// hard gate. Writes a JSON report to data/ for preservation.

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  alternatives,
  formatAlternatives,
  assertTrustworthy,
  anchorKeys,
} from "../../shared/alternatives";
import type { AlternativesResult } from "../../shared/alternatives";

const line = "=".repeat(64);
let failures = 0;

function allOptions(r: AlternativesResult) {
  return r.sections.flatMap((s) => s.options);
}

function checkTrust(label: string, r: AlternativesResult) {
  try {
    assertTrustworthy(allOptions(r));
    console.log(`  ✓ trust check passed (${allOptions(r).length} options)`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${label}: ${(e as Error).message}`);
  }
}

function expect(label: string, cond: boolean) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.log(`  ✗ FAILED: ${label}`);
  }
}

const report: Record<string, unknown> = {};

// ── 1. The eight worked examples (no context — full possibilities) ─────────────

console.log("WS9 — Food Alternatives Engine\n");
console.log(line);
console.log("EIGHT WORKED EXAMPLES (no context — all possibilities)\n");

const WORKED = [
  "chicken", "milk", "rice", "greek-yoghurt",
  "bacon", "pizza-base", "beef-mince", "tomato-sauce",
];

for (const slug of WORKED) {
  const result = alternatives({ food: slug });
  console.log(formatAlternatives(result));
  checkTrust(slug, result);
  console.log(`  types: ${result.sections.map((s) => s.type).join(", ") || "(none)"}`);
  console.log();
  report[slug] = result;
}

// ── 2. The exclusion gate (context.diets) ──────────────────────────────────────

console.log(line);
console.log("EXCLUSION GATE — context narrows possibilities to what fits\n");

const veganChicken = alternatives({ food: "chicken", context: { diets: ["vegan"] } });
console.log(formatAlternatives(veganChicken));
checkTrust("chicken+vegan", veganChicken);
expect(
  "chicken+vegan drops turkey/pork (meat) and keeps only plant proteins",
  allOptions(veganChicken).every((o) => o.suitableFor.includes("vegan")),
);
report["chicken__vegan"] = veganChicken;
console.log();

const gfRice = alternatives({ food: "rice", context: { diets: ["gluten_free"] } });
expect(
  "rice+gluten_free drops bulgur wheat (contains gluten)",
  !allOptions(gfRice).some((o) => o.slug === "bulgur-wheat"),
);
report["rice__gluten_free"] = gfRice;

const ketoRice = alternatives({ food: "rice", context: { diets: ["keto"] } });
expect(
  "rice+keto surfaces cauliflower rice and nothing carb-heavy",
  allOptions(ketoRice).length > 0 &&
    allOptions(ketoRice).every((o) => o.suitableFor.includes("keto")),
);
report["rice__keto"] = ketoRice;

const dfYoghurt = alternatives({ food: "greek-yoghurt", context: { diets: ["dairy_free"] } });
expect(
  "greek-yoghurt+dairy_free keeps only dairy-free pots (drops skyr/kefir)",
  allOptions(dfYoghurt).every((o) => o.suitableFor.includes("dairy_free")),
);
report["greek-yoghurt__dairy_free"] = dfYoghurt;
console.log();

// ── 3. Lower-UPF preference & cuisine type ─────────────────────────────────────

console.log(line);
console.log("LOWER-UPF PREFERENCE + CUISINE TYPE\n");

const upfSauce = alternatives({ food: "processed-sauce", context: { preferLowerUpf: true } });
console.log(formatAlternatives(upfSauce));
checkTrust("processed-sauce+lowerUpf", upfSauce);
expect(
  "processed-sauce resolves via alias and shows only lower_upf",
  upfSauce.anchor?.slug === "tomato-sauce" &&
    upfSauce.sections.every((s) => s.type === "lower_upf"),
);
report["processed-sauce__lowerUpf"] = upfSauce;
console.log();

const basil = alternatives({ food: "basil" });
console.log(formatAlternatives(basil));
checkTrust("basil cuisine", basil);
expect(
  "basil offers cuisine alternatives (parsley/coriander/mint)",
  basil.sections.some((s) => s.type === "cuisine"),
);
const basilAsian = alternatives({ food: "basil", context: { cuisine: "Asian" } });
expect(
  "basil+cuisine=Asian narrows to coriander",
  allOptions(basilAsian).length === 1 && allOptions(basilAsian)[0].slug === "coriander",
);
report["basil"] = basil;
report["basil__asian"] = basilAsian;
console.log();

// ── 4. Household adaptation — the brief's three cases ───────────────────────────

console.log(line);
console.log("HOUSEHOLD ADAPTATION — one meal, different eaters\n");

// 4a. Lasagne night: family on beef, Lilly vegetarian.
const lasagne = alternatives({
  food: "beef-mince",
  context: { household: { eaters: [
    { name: "Family" },
    { name: "Lilly", diets: ["vegetarian"] },
  ] } },
});
console.log(formatAlternatives(lasagne));
expect(
  "lasagne: Family keeps beef mince (shared)",
  lasagne.adaptation?.members.find((m) => m.eater === "Family")?.shared === true,
);
expect(
  "lasagne: Lilly gets a vegetarian mince (not shared)",
  lasagne.adaptation?.members.find((m) => m.eater === "Lilly")?.shared === false &&
    lasagne.adaptation?.members.find((m) => m.eater === "Lilly")?.slug === "quorn-mince",
);
report["beef-mince__household"] = lasagne;
console.log();

// 4b. Pizza night: traditional / gluten-free / keto bases.
const pizza = alternatives({
  food: "pizza",
  context: { household: { eaters: [
    { name: "Parents" },
    { name: "Lilly", diets: ["gluten_free"] },
    { name: "Dad", diets: ["keto"] },
  ] } },
});
console.log(formatAlternatives(pizza));
expect(
  "pizza: Lilly gets the gluten-free base",
  pizza.adaptation?.members.find((m) => m.eater === "Lilly")?.slug === "gluten-free-base",
);
expect(
  "pizza: Dad gets the keto base",
  pizza.adaptation?.members.find((m) => m.eater === "Dad")?.slug === "keto-base",
);
report["pizza__household"] = pizza;
console.log();

// 4c. Cooked breakfast: bacon adapted for a vegetarian eater.
const breakfast = alternatives({
  food: "bacon",
  context: { household: { eaters: [
    { name: "Dad" },
    { name: "Lilly", diets: ["vegetarian"] },
  ] } },
});
console.log(formatAlternatives(breakfast));
expect(
  "breakfast: Lilly gets a vegetarian protein in the bacon slot",
  breakfast.adaptation?.members.find((m) => m.eater === "Lilly")?.shared === false,
);
report["bacon__household"] = breakfast;
console.log();

// ── 5. The "already fits" affirming path & silence contract ────────────────────

console.log(line);
console.log("ALREADY-FITS (no change needed) + SILENCE CONTRACT\n");

// Greek yoghurt is already vegetarian → a vegetarian eater keeps it (shared).
const yoghurtVeg = alternatives({
  food: "greek-yoghurt",
  context: { household: { eaters: [{ name: "Mum", diets: ["vegetarian"] }] } },
});
expect(
  "greek-yoghurt already suits a vegetarian → shared, no manufactured swap",
  yoghurtVeg.adaptation?.members[0].shared === true,
);
report["greek-yoghurt__already-fits"] = yoghurtVeg;

// Milk + lower-UPF → silence (plant milks are usually more processed; honest).
const milkUpf = alternatives({ food: "milk", context: { preferLowerUpf: true } });
expect(
  "milk + lower-UPF stays SILENT (no dishonest 'less processed milk' claim)",
  milkUpf.sections.length === 0,
);
report["milk__lowerUpf-silent"] = milkUpf;

// Unknown food → silent, never a guess.
const unknown = alternatives({ food: "definitely-not-a-food" });
expect(
  "unknown food → silent (anchor null, no sections)",
  unknown.anchor === null && unknown.sections.length === 0,
);

// Impossible diet combo → empty intersection → silence, not a forced compromise.
const impossible = alternatives({ food: "chicken", context: { diets: ["vegan", "keto"] } });
expect(
  "chicken + vegan&keto (empty intersection) → silent dietary section",
  !impossible.sections.some((s) => s.type === "dietary" && s.options.length > 0),
);
console.log();

// ── 6. Trust gate across EVERY anchor and option in the catalogue ──────────────

console.log(line);
console.log("TRUST GATE — every authored option, every anchor\n");

let totalOptions = 0;
for (const key of anchorKeys()) {
  const full = alternatives({ food: key });
  totalOptions += allOptions(full).length;
  try {
    assertTrustworthy(allOptions(full));
  } catch (e) {
    failures++;
    console.log(`  ✗ ${key}: ${(e as Error).message}`);
  }
}
expect(`all ${totalOptions} authored options across ${anchorKeys().length} anchors are trustworthy`, failures === 0);
console.log();

// ── 7. Persist report ──────────────────────────────────────────────────────────

const outDir = join(process.cwd(), "data", "alternatives");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "ws9-alternatives-report.json");
writeFileSync(
  outPath,
  JSON.stringify(
    {
      workstream: "WS9 — Food Alternatives Engine",
      generatedAt: new Date().toISOString(),
      anchors: anchorKeys(),
      totalOptions,
      examples: report,
    },
    null,
    2,
  ),
);
console.log(`Report written: ${outPath}`);

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${line}`);
if (failures === 0) {
  console.log("✓ WS9 — all worked examples, gates and trust checks passed.");
} else {
  console.log(`✗ WS9 — ${failures} check(s) failed.`);
  process.exit(1);
}
