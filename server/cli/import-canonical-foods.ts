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
        console.log(`   → Inserted: ${result.inserted.foods} food, ${result.inserted.nutrients} nutrients, ${result.inserted.benefits} benefits`);
        if (result.warnings.length > 0) {
          console.log(`   ⚠️  Warnings: ${result.warnings.join("; ")}`);
        }
        if (result.skipped.nutrients.length > 0) {
          console.log(`   ⊘ Skipped nutrients: ${result.skipped.nutrients.join(", ")}`);
        }
        if (result.skipped.benefits.length > 0) {
          console.log(`   ⊘ Skipped benefits: ${result.skipped.benefits.join(", ")}`);
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
  console.log(`  ❌ Failed: ${totalFailures}`);
  console.log(`  📊 Total: ${totalSuccesses + totalFailures}`);

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

  // Exit with appropriate code
  process.exit(totalFailures > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
