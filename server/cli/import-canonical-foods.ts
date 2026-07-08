#!/usr/bin/env tsx

/**
 * CLI Command: Import canonical foods from v2.0-draft YAML files
 *
 * Usage:
 *   tsx server/cli/import-canonical-foods.ts <files...>
 *   npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/*.yaml
 *   npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/spinach.yaml --force-upsert
 */

import { glob } from "glob";
import { resolve } from "path";
import { importCanonicalFood, ImportResult } from "../lib/canonical-foods-importer";

interface CliOptions {
  forceUpsert?: boolean;
}

async function main() {
  const args = process.argv.slice(2);

  // Parse options
  const forceUpsert = args.includes("--force-upsert");
  const fileArgs = args.filter((arg) => !arg.startsWith("--"));

  // If no files specified, use default pattern
  let patterns = fileArgs.length > 0 ? fileArgs : ["docs/knowledge/canonical-foods/drafts/*.yaml"];

  // Expand glob patterns
  let filePaths: string[] = [];
  for (const pattern of patterns) {
    const resolved = resolve(pattern);
    try {
      const matches = await glob(resolved, { absolute: true });
      filePaths.push(...matches);
    } catch (error) {
      console.error(`❌ Error globbing pattern ${pattern}:`, error);
    }
  }

  // Remove duplicates
  filePaths = [...new Set(filePaths)];

  if (filePaths.length === 0) {
    console.log("No files found matching pattern(s)");
    process.exit(1);
  }

  console.log(`\n📦 Canonical Food Importer`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Files to import: ${filePaths.length}`);
  if (forceUpsert) {
    console.log(`Mode: FORCE UPSERT (will override existing foods)`);
  }
  console.log("");

  let totalSuccesses = 0;
  let totalPartials = 0;
  let totalFailures = 0;
  const results: ImportResult[] = [];

  // Import each file
  for (const filePath of filePaths) {
    try {
      const result = await importCanonicalFood(filePath, forceUpsert);
      results.push(result);

      if (result.success) {
        totalSuccesses++;
        console.log(`✅ ${result.fileName}`);
        console.log(`   → New rows: ${result.inserted.foods} food, ${result.inserted.nutrients} nutrients, ${result.inserted.benefits} benefits`);
        const nAlias = result.resolved.nutrients.filter((r) => r.via === "alias");
        const bAlias = result.resolved.benefits.filter((r) => r.via === "alias");
        console.log(
          `   ✓ Resolved: ${result.resolved.nutrients.length} nutrients (${nAlias.length} via alias), ` +
          `${result.resolved.benefits.length} benefits (${bAlias.length} via alias)`
        );
        if (nAlias.length > 0) {
          console.log(`      ↳ nutrient aliases: ${nAlias.map((r) => `${r.input}→${r.canonicalSlug}`).join(", ")}`);
        }
        if (bAlias.length > 0) {
          console.log(`      ↳ benefit aliases: ${bAlias.map((r) => `${r.input}→${r.canonicalSlug}`).join(", ")}`);
        }
        if (result.rejected.nutrients.length > 0) {
          console.log(`   ⊘ Rejected nutrients: ${result.rejected.nutrients.map((r) => r.input).join(", ")}`);
        }
        if (result.rejected.benefits.length > 0) {
          console.log(`   ⊘ Rejected benefits: ${result.rejected.benefits.map((r) => r.input).join(", ")}`);
        }
        if (result.warnings.length > 0) {
          console.log(`   ⚠️  Warnings: ${result.warnings.join("; ")}`);
        }
      } else if (result.partial) {
        // NK6O — food persisted but INCOMPLETE (a resolved target failed to bind).
        // Reported distinctly from both a clean success and a hard failure so a
        // dropped relationship is never masked as success.
        totalPartials++;
        console.log(`⚠️  PARTIAL ${result.fileName}`);
        console.log(`   Food: ${result.foodSlug || "(unknown)"}`);
        console.log(`   → New rows: ${result.inserted.foods} food, ${result.inserted.nutrients} nutrients, ${result.inserted.benefits} benefits`);
        if (result.dropped.nutrients.length > 0) {
          console.log(`   ✗ Dropped nutrients (missing canonical target): ${result.dropped.nutrients.join(", ")}`);
        }
        if (result.dropped.benefits.length > 0) {
          console.log(`   ✗ Dropped benefits (missing canonical target): ${result.dropped.benefits.join(", ")}`);
        }
        if (result.warnings.length > 0) {
          console.log(`   ⚠️  Warnings: ${result.warnings.join("; ")}`);
        }
      } else {
        totalFailures++;
        console.log(`❌ ${result.fileName}`);
        console.log(`   Food: ${result.foodSlug || "(unknown)"}`);
        console.log(`   Errors: ${result.errors.join("; ")}`);
      }
      console.log("");
    } catch (error) {
      totalFailures++;
      console.log(`❌ ${filePath}`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      console.log("");
    }
  }

  // Summary
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Summary:`);
  console.log(`  ✅ Successful: ${totalSuccesses}`);
  console.log(`  ⚠️  Partial (incomplete — target dropped): ${totalPartials}`);
  console.log(`  ❌ Failed: ${totalFailures}`);
  console.log(`  📊 Total: ${totalSuccesses + totalPartials + totalFailures}`);

  // Detailed summary
  if (results.length > 0) {
    const totalInserted = results.reduce(
      (acc, r) => ({
        foods: acc.foods + r.inserted.foods,
        nutrients: acc.nutrients + r.inserted.nutrients,
        benefits: acc.benefits + r.inserted.benefits,
      }),
      { foods: 0, nutrients: 0, benefits: 0 }
    );

    console.log(`\n  Rows inserted:`);
    console.log(`    🍽️  Foods: ${totalInserted.foods}`);
    console.log(`    🥗 Nutrients: ${totalInserted.nutrients}`);
    console.log(`    ❤️  Benefits: ${totalInserted.benefits}`);
  }

  console.log("");

  // Exit non-zero on hard failures OR partials — an incomplete import must not
  // pass silently as success (NK6O).
  process.exit(totalFailures > 0 || totalPartials > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
