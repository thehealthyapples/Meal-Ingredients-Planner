// WS8 — Food Discovery Engine: worked examples + trust validation.
// Run: tsx server/tests/test-discovery-engine.ts
//
// Produces the six worked examples the brief requires, demonstrates household
// context (broaden_horizons + cuisine), exercises seasonal discovery across all
// four UK seasons, and enforces the trust contract (no ranking / judgement
// language) as a hard gate. Writes a JSON report to data/ for preservation.

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  discover,
  formatDiscovery,
  assertTrustworthy,
  validateReason,
} from "../../shared/discovery";
import type { DiscoveryResult, UKSeason } from "../../shared/discovery";

const line = "=".repeat(64);
let failures = 0;

function allSuggestions(r: DiscoveryResult) {
  return r.sections.flatMap((s) => s.suggestions);
}

function checkTrust(label: string, r: DiscoveryResult) {
  try {
    assertTrustworthy(allSuggestions(r));
    console.log(`  ✓ trust check passed (${allSuggestions(r).length} suggestions)`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${label}: ${(e as Error).message}`);
  }
}

// ── 1. The six worked examples ────────────────────────────────────────────────

console.log("WS8 — Food Discovery Engine\n");
console.log(line);
console.log("SIX WORKED EXAMPLES (no household context)\n");

const WORKED = ["tomato", "chickpeas", "greek-yoghurt", "chicken", "pumpkin-seeds", "apple"];
const report: Record<string, unknown> = {};

for (const slug of WORKED) {
  // Fix the season so the worked examples are reproducible (summer).
  const result = discover({ food: slug, season: "summer" });
  console.log(formatDiscovery(result));
  checkTrust(slug, result);
  console.log(`  types: ${result.sections.map((s) => s.type).join(", ") || "(none)"}`);
  console.log();
  report[slug] = result;
}

// ── 2. Household context — broaden horizons ────────────────────────────────────

console.log(line);
console.log("HOUSEHOLD CONTEXT — broaden horizons\n");

const legumeHousehold = discover({
  household: { enjoys: ["chickpeas", "lentils", "butter-beans"] },
  types: ["broaden_horizons"],
  season: "summer",
});
console.log("Household enjoys: chickpeas, lentils, butter beans");
console.log(formatDiscovery(legumeHousehold));
checkTrust("legume-household", legumeHousehold);

// ── 3. Household context — cuisine exploration ─────────────────────────────────

console.log("\n" + line);
console.log("HOUSEHOLD CONTEXT — cuisine exploration\n");

const medHousehold = discover({
  household: { enjoys: ["chickpeas", "tomato", "extra-virgin-olive-oil", "olives"] },
  types: ["cuisine"],
  season: "summer",
});
console.log("Household enjoys: chickpeas, tomato, olive oil, olives");
console.log(formatDiscovery(medHousehold));
checkTrust("med-household", medHousehold);

// ── 4. Household familiarity ranking ───────────────────────────────────────────

console.log("\n" + line);
console.log("FAMILIARITY RANKING — aubergine before okra\n");

const familiarRank = discover({
  food: "tomato",
  household: { enjoys: ["pepper", "aubergine"] },
  types: ["similar"],
  season: "summer",
});
console.log("Anchor: tomato · household enjoys: pepper, aubergine");
console.log(formatDiscovery(familiarRank));
checkTrust("familiarity-rank", familiarRank);

// ── 5. Seasonal across all four UK seasons ─────────────────────────────────────

console.log("\n" + line);
console.log("SEASONAL EXPLORATION — all four UK seasons\n");

for (const season of ["spring", "summer", "autumn", "winter"] as UKSeason[]) {
  const r = discover({ season, types: ["seasonal"], limitPerType: 4 });
  const names = r.sections[0]?.suggestions.map((s) => s.name).join(", ") ?? "(none)";
  console.log(`  ${season}: ${names}`);
  checkTrust(`seasonal-${season}`, r);
}
report.seasonal = {
  spring: discover({ season: "spring", types: ["seasonal"], limitPerType: 8 }),
  summer: discover({ season: "summer", types: ["seasonal"], limitPerType: 8 }),
  autumn: discover({ season: "autumn", types: ["seasonal"], limitPerType: 8 }),
  winter: discover({ season: "winter", types: ["seasonal"], limitPerType: 8 }),
};

// ── 6. Empty-is-silent ─────────────────────────────────────────────────────────

console.log("\n" + line);
console.log("EMPTY-IS-SILENT — unknown food returns no sections\n");

const unknown = discover({ food: "definitely-not-a-real-food", season: "summer" });
console.log(`  sections returned: ${unknown.sections.length} (expected 0 or seasonal-only)`);
const unknownNonSeasonal = unknown.sections.filter((s) => s.type !== "seasonal");
if (unknownNonSeasonal.length === 0) {
  console.log("  ✓ no fabricated relationships for an unknown food");
} else {
  failures++;
  console.log("  ✗ unexpected sections for unknown food");
}

// ── 7. Trust guard negative test ───────────────────────────────────────────────

console.log("\n" + line);
console.log("TRUST GUARD — negative control\n");

const banned = [
  "This is a healthier choice.",
  "The best food for you.",
  "You should eat more of this.",
  "A nutritional upgrade.",
];
let caughtAll = true;
for (const phrase of banned) {
  const v = validateReason(phrase);
  if (v.length === 0) {
    caughtAll = false;
    failures++;
    console.log(`  ✗ failed to flag: "${phrase}"`);
  }
}
if (caughtAll) console.log(`  ✓ all ${banned.length} ranking/judgement phrases flagged`);

// Confirm no clean reason is falsely flagged.
const cleanSample = "A common Mediterranean ingredient, often cooked with tomatoes.";
if (validateReason(cleanSample).length === 0) {
  console.log("  ✓ clean reason not falsely flagged");
} else {
  failures++;
  console.log(`  ✗ clean reason falsely flagged: ${validateReason(cleanSample).join(", ")}`);
}

// ── Write report artifact ──────────────────────────────────────────────────────

const outDir = join(process.cwd(), "data", "discovery");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "ws8-discovery-report.json");
writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      note: "WS8 Food Discovery Engine — worked examples (season fixed to summer) and seasonal sets. Deterministic snapshot for preservation.",
      workedExamples: report,
    },
    null,
    2,
  ),
);
console.log(`\n${line}`);
console.log(`Report written: ${outPath}`);

// ── Summary ────────────────────────────────────────────────────────────────────

console.log("\n" + line);
if (failures === 0) {
  console.log("WS8 DISCOVERY ENGINE: ALL CHECKS PASSED ✓");
} else {
  console.log(`WS8 DISCOVERY ENGINE: ${failures} CHECK(S) FAILED ✗`);
  process.exitCode = 1;
}
