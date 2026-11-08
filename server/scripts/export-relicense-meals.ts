/**
 * Export 163 meals pending relicensing
 *
 * For reference and licensing negotiation
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import * as fs from "fs";

async function exportMeals() {
  console.log("\n=== EXPORTING MEALS PENDING RELICENSING ===\n");

  try {
    // Export BBC Good Food meals
    const bbcResult = await db.execute(sql`
      SELECT
        id,
        name,
        user_id,
        created_at,
        source_url,
        ingredients,
        instructions
      FROM meals
      WHERE acquisition_source_key = 'bbcgoodfood'
      ORDER BY id
    `);

    const bbcMeals = bbcResult.rows || [];

    // Export AllRecipes meals
    const arResult = await db.execute(sql`
      SELECT
        id,
        name,
        user_id,
        created_at,
        source_url,
        ingredients,
        instructions
      FROM meals
      WHERE acquisition_source_key = 'allrecipes'
      ORDER BY id
    `);

    const arMeals = arResult.rows || [];

    console.log(`BBC Good Food: ${bbcMeals.length} meals`);
    console.log(`AllRecipes: ${arMeals.length} meals`);
    console.log(`Total: ${bbcMeals.length + arMeals.length} meals\n`);

    // Generate audit report
    const report = {
      exportDate: new Date().toISOString(),
      relicensingStatus: "pending",
      summary: {
        totalMeals: bbcMeals.length + arMeals.length,
        bbcGoodFood: bbcMeals.length,
        allRecipes: arMeals.length,
      },
      bbcGoodFood: {
        publisher: "Immediate Media Company",
        source: "BBC Good Food",
        licensingPath: "Commercial syndication license (FS2 §3.1)",
        meals: bbcMeals.map((m: any) => ({
          id: m.id,
          name: m.name,
          userId: m.user_id,
          createdAt: m.created_at,
          sourceUrl: m.source_url || null,
        })),
      },
      allRecipes: {
        publisher: "Dotdash Meredith",
        source: "AllRecipes",
        licensingPath: "Commercial content license (FS2 §3.2)",
        meals: arMeals.map((m: any) => ({
          id: m.id,
          name: m.name,
          userId: m.user_id,
          createdAt: m.created_at,
          sourceUrl: m.source_url || null,
        })),
      },
      relicensingRoadmap: "docs/architecture/RECIPE_RELICENSING_ROADMAP.md",
      notes: [
        "All meals are user imports (acquisitionLane: personal_cookbook)",
        "All are historical (Feb-Jun 2026, no ongoing imports)",
        "27 meals actively used in household plans",
        "Marked for relicensing post-production revenue",
      ],
    };

    // Save as JSON
    const outputPath = "server/scripts/relicense-meals-audit.json";
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log(`Audit report saved: ${outputPath}\n`);
    console.log("Summary:");
    console.log(`  Total meals pending relicense: ${report.summary.totalMeals}`);
    console.log(`  BBC Good Food: ${report.summary.bbcGoodFood}`);
    console.log(`  AllRecipes: ${report.summary.allRecipes}\n`);

  } catch (error) {
    console.error("ERROR:", error);
    process.exit(1);
  }
}

exportMeals().finally(() => process.exit(0));
