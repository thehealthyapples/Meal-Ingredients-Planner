// WS0.10 — 50-food catalogue ingestion validation.
// Run with: npx tsx server/scripts/catalogue-ingestion-test.ts
import { ingestBatch } from "../../shared/catalogue/pipeline";
import { TEST_FOODS_50 } from "../../shared/catalogue/test-foods";

const report = ingestBatch(TEST_FOODS_50);

console.log("\n══════════════════════════════════════════════════════");
console.log("WS0.10 — Global Food Catalogue Ingestion Test");
console.log("══════════════════════════════════════════════════════\n");

console.log(`Total foods processed:    ${report.total}`);
console.log(`Matched existing:         ${report.matchedExisting}`);
console.log(`Create catalogue entries: ${report.createCatalogue}`);
console.log(`Review required:          ${report.reviewRequired}`);
console.log(`Skipped (not ingredient): ${report.skipped}`);
console.log("");
console.log(`High confidence:   ${report.highConfidence}`);
console.log(`Medium confidence: ${report.mediumConfidence}`);
console.log(`Low confidence:    ${report.lowConfidence}`);

console.log("\n──────────────────────────────────────────────────────");
console.log("MATCHED EXISTING (no new entry needed)");
console.log("──────────────────────────────────────────────────────");
for (const r of report.results.filter((r) => r.action === "matched_existing")) {
  console.log(`  ✓ FDC:${r.fdcId} "${r.usdaDescription}"`);
  console.log(`    → matched "${r.existingSlug}" via ${r.matchType}`);
}

console.log("\n──────────────────────────────────────────────────────");
console.log("NEW CATALOGUE ENTRIES (high/medium confidence)");
console.log("──────────────────────────────────────────────────────");
for (const r of report.results.filter((r) => r.action === "create_catalogue")) {
  const tier = r.confidence === "high" ? "HIGH" : "MED ";
  console.log(`  [${tier}] "${r.proposedName}" (${r.proposedSlug})`);
  console.log(`         category: ${r.thaCategory} / ${r.thaSubcategory ?? "—"}`);
  if (r.nutrients) {
    const n = r.nutrients;
    const parts = [];
    if (n.energyKcal !== undefined) parts.push(`${n.energyKcal}kcal`);
    if (n.proteinG !== undefined) parts.push(`${n.proteinG}g protein`);
    if (n.fibreG !== undefined) parts.push(`${n.fibreG}g fibre`);
    if (parts.length) console.log(`         nutrients: ${parts.join(", ")}`);
  }
}

console.log("\n──────────────────────────────────────────────────────");
console.log("REVIEW REQUIRED (low confidence)");
console.log("──────────────────────────────────────────────────────");
for (const r of report.results.filter((r) => r.action === "review_required")) {
  console.log(`  [LOW] "${r.usdaDescription}"`);
  console.log(`        proposed: "${r.proposedName}" → ${r.thaCategory ?? "no category"}`);
  console.log(`        issues:   ${r.reasons.filter((r) => r.includes("−") || r.includes("lost") || r.includes("unclear") || r.includes("required")).join("; ")}`);
}

console.log("\n──────────────────────────────────────────────────────");
console.log("SKIPPED");
console.log("──────────────────────────────────────────────────────");
for (const r of report.results.filter((r) => r.action === "skip")) {
  console.log(`  ✗ FDC:${r.fdcId} "${r.usdaDescription}"`);
  console.log(`    reason: ${r.reasons[0]}`);
}

console.log("\n══════════════════════════════════════════════════════");
console.log("TRUST CHECK");
console.log("══════════════════════════════════════════════════════");
const duplicateRisk = report.results.filter((r) =>
  r.action === "create_catalogue" &&
  report.results.some((other) =>
    other !== r &&
    other.action === "matched_existing" &&
    other.existingSlug === r.proposedSlug,
  ),
);
console.log(`Duplicate risk (new entry that should have matched): ${duplicateRisk.length}`);

const brandedSlipped = report.results.filter((r) =>
  r.action !== "skip" &&
  (r.usdaDescription.includes("Brand") || r.fdcId >= 999000),
);
console.log(`Branded products in catalogue (should be zero):      ${brandedSlipped.length}`);

const conflictingNutrition = report.results.filter((r) =>
  r.action === "matched_existing" && r.nutrients !== undefined,
);
console.log(`Matched entries attempting to write nutrients:        ${conflictingNutrition.length}`);

console.log("\n══════════════════════════════════════════════════════\n");
