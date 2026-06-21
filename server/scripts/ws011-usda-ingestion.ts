// WS0.11 — Real USDA Ingestion Pilot.
//
// Drives the WS0.10 catalogue pipeline against a REAL USDA FoodData Central
// snapshot (500 ingredient-level foods, Foundation + SR Legacy). Produces a full
// trace + statistics for the investigation, and — with --write — populates the
// internal catalogue (tier='catalogue', status='draft'). No production exposure.
//
//   Analysis only:  npx tsx server/scripts/ws011-usda-ingestion.ts
//   Write to DB:    npx tsx server/scripts/ws011-usda-ingestion.ts --write
//   Rollback rows:  npx tsx server/scripts/ws011-usda-ingestion.ts --rollback
//
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ingestFood } from "../../shared/catalogue/pipeline";
import { resolveAlias } from "../../shared/catalogue/alias-resolver";
import { mapCategory } from "../../shared/catalogue/category-mapper";
import type { USDAFood, CatalogueIngestionResult } from "../../shared/catalogue/types";

const SNAPSHOT = join(import.meta.dirname, "../../data/usda-snapshot/ws011-usda-500.json");
const REPORT_OUT = join(import.meta.dirname, "../../data/usda-snapshot/ws011-ingestion-report.json");
const PILOT_SOURCE = "USDA FDC import (WS0.11 pilot)";

interface Snapshot {
  meta: Record<string, unknown>;
  foods: USDAFood[];
}

function loadSnapshot(): Snapshot {
  return JSON.parse(readFileSync(SNAPSHOT, "utf-8"));
}

interface EnrichedResult extends CatalogueIngestionResult {
  wasTranslated: boolean;
  translationFrom?: string;
  categoryConfidence: string;
}

function analyse(foods: USDAFood[]): EnrichedResult[] {
  return foods.map((food) => {
    const base = ingestFood(food);
    // Re-run alias + category as pure functions to capture richer reporting detail
    // the pipeline result doesn't surface (translation provenance, category confidence).
    const alias = resolveAlias(food.description);
    const cat = mapCategory(food.foodCategory?.description, alias.resolvedName, food.scientificName);
    return {
      ...base,
      wasTranslated: alias.wasTranslated,
      translationFrom: alias.wasTranslated ? food.description : undefined,
      categoryConfidence: cat.confidence,
    };
  });
}

function pct(n: number, total: number): string {
  return `${((n / total) * 100).toFixed(1)}%`;
}

function section(title: string) {
  console.log("\n" + "─".repeat(64));
  console.log(title);
  console.log("─".repeat(64));
}

function report(results: EnrichedResult[], meta: Record<string, unknown>) {
  const total = results.length;
  const byAction = (a: string) => results.filter((r) => r.action === a);
  const matched = byAction("matched_existing");
  const created = byAction("create_catalogue");
  const review = byAction("review_required");
  const skipped = byAction("skip");

  console.log("\n" + "═".repeat(64));
  console.log("WS0.11 — REAL USDA INGESTION PILOT");
  console.log("═".repeat(64));
  console.log(`Snapshot: ${meta.selected} foods (${meta.foundation_selected} Foundation + ${meta.sr_legacy_selected} SR Legacy)`);
  console.log(`Sources : ${JSON.stringify(meta.sources)}`);

  section("VALIDATION SUMMARY");
  console.log(`Total processed:        ${total}`);
  console.log(`Matched existing:       ${matched.length}  (${pct(matched.length, total)})`);
  console.log(`New catalogue (hi/med): ${created.length}  (${pct(created.length, total)})`);
  console.log(`Review required (low):  ${review.length}  (${pct(review.length, total)})`);
  console.log(`Skipped (in pipeline):  ${skipped.length}  (${pct(skipped.length, total)})`);
  console.log("");
  const hi = results.filter((r) => r.confidence === "high").length;
  const med = results.filter((r) => r.confidence === "medium").length;
  const lo = results.filter((r) => r.confidence === "low").length;
  console.log(`High confidence:   ${hi}  (${pct(hi, total)})`);
  console.log(`Medium confidence: ${med}  (${pct(med, total)})`);
  console.log(`Low confidence:    ${lo}  (${pct(lo, total)})`);

  section("ALIAS RESOLUTION");
  const translated = results.filter((r) => r.wasTranslated);
  console.log(`Foods needing US→UK translation: ${translated.length}  (${pct(translated.length, total)})`);
  console.log("Translations that fired:");
  for (const r of translated) {
    console.log(`   "${r.usdaDescription}" → "${r.proposedName ?? r.existingName}"`);
  }
  const byMatchType = (t: string) => matched.filter((r) => r.matchType === t).length;
  console.log("\nMatched-existing by axis:");
  console.log(`   slug:            ${byMatchType("slug")}`);
  console.log(`   alias:           ${byMatchType("alias")}`);
  console.log(`   scientific_name: ${byMatchType("scientific_name")}`);

  section("CATEGORY MAPPING");
  const catClean = created.concat(review).filter((r) => r.categoryConfidence === "mapped").length;
  const catKw = created.concat(review).filter((r) => r.categoryConfidence === "keyword_hint").length;
  const catAmbig = created.concat(review).filter((r) => r.categoryConfidence === "ambiguous").length;
  const nullSub = created.concat(review).filter((r) => !r.thaSubcategory).length;
  const other = created.concat(review).filter((r) => r.thaCategory === "Other").length;
  console.log(`New foods mapped cleanly (direct):   ${catClean}`);
  console.log(`New foods mapped via keyword hint:   ${catKw}`);
  console.log(`New foods ambiguous (review needed): ${catAmbig}`);
  console.log(`New foods with subcategory = null:   ${nullSub}`);
  console.log(`New foods landing in "Other":        ${other}`);
  const families: Record<string, number> = {};
  for (const r of created.concat(review)) {
    const k = `${r.thaCategory} / ${r.thaSubcategory ?? "—"}`;
    families[k] = (families[k] ?? 0) + 1;
  }
  console.log("\nFood families (new catalogue entries):");
  for (const [k, v] of Object.entries(families).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${String(v).padStart(4)}  ${k}`);
  }

  section("DEDUPLICATION");
  console.log(`Matched existing (no new row): ${matched.length}`);
  // slug collisions among proposed new entries
  const slugCounts: Record<string, number> = {};
  for (const r of created.concat(review)) {
    if (r.proposedSlug) slugCounts[r.proposedSlug] = (slugCounts[r.proposedSlug] ?? 0) + 1;
  }
  const collisions = Object.entries(slugCounts).filter(([, n]) => n > 1);
  console.log(`Within-batch slug collisions:  ${collisions.length}`);
  for (const [slug, n] of collisions) console.log(`   "${slug}" ×${n}`);
  // proposed slugs that equal an existing matched slug (should have matched but didn't)
  const matchedSlugs = new Set(matched.map((r) => r.existingSlug));
  const dupRisk = created.concat(review).filter((r) => r.proposedSlug && matchedSlugs.has(r.proposedSlug));
  console.log(`Duplicate risk (new vs matched slug): ${dupRisk.length}`);
  for (const r of dupRisk) console.log(`   "${r.proposedName}" (${r.proposedSlug})`);

  section("SAMPLE — MATCHED EXISTING (first 20)");
  for (const r of matched.slice(0, 20)) {
    console.log(`   ✓ "${r.usdaDescription}" → ${r.existingSlug} [${r.matchType}]`);
  }

  section("SAMPLE — NEW CATALOGUE, HIGH CONFIDENCE (first 20)");
  for (const r of created.filter((r) => r.confidence === "high").slice(0, 20)) {
    console.log(`   [HIGH] ${r.proposedName} (${r.proposedSlug}) — ${r.thaCategory}/${r.thaSubcategory ?? "—"}`);
  }

  section("SAMPLE — REVIEW REQUIRED, LOW CONFIDENCE (all)");
  for (const r of review) {
    console.log(`   [LOW]  ${r.proposedName} (${r.proposedSlug}) — ${r.thaCategory}/${r.thaSubcategory ?? "—"}`);
    console.log(`          ${r.reasons.filter((x) => x.includes("(-") || x.includes("lost") || x.includes("unclear")).join("; ")}`);
  }

  section("TRUST CHECK");
  const brandedSlipped = created.concat(review).filter((r) =>
    /®|™|baby food|infant|formula/i.test(r.usdaDescription),
  );
  console.log(`Branded/infant in catalogue (should be 0): ${brandedSlipped.length}`);
  const matchedWritingNutrients = matched.filter((r) => r.nutrients !== undefined);
  console.log(`Matched entries writing nutrients (0):     ${matchedWritingNutrients.length}`);
  console.log(`Duplicate risk (0 ideal):                  ${dupRisk.length}`);

  // Persist machine-readable report for the investigation doc.
  const out = {
    meta,
    summary: {
      total, matched: matched.length, created: created.length,
      review: review.length, skipped: skipped.length,
      high: hi, medium: med, low: lo,
      translated: translated.length,
      matchedByAxis: { slug: byMatchType("slug"), alias: byMatchType("alias"), scientific_name: byMatchType("scientific_name") },
      categoryCleanMapped: catClean, categoryKeyword: catKw, categoryAmbiguous: catAmbig,
      subcategoryNull: nullSub, categoryOther: other,
      slugCollisions: collisions.length, duplicateRisk: dupRisk.length,
      brandedSlipped: brandedSlipped.length,
    },
    families,
    translations: translated.map((r) => ({ from: r.usdaDescription, to: r.proposedName ?? r.existingName })),
    results,
  };
  writeFileSync(REPORT_OUT, JSON.stringify(out, null, 1));
  console.log(`\nMachine-readable report: ${REPORT_OUT}`);
  return out;
}

async function writeToDatabase(results: EnrichedResult[]) {
  const { db } = await import("../db");
  const { canonicalFoods } = await import("@shared/schema");
  const { sql } = await import("drizzle-orm");

  section("DATABASE WRITE — applying WS0.10 schema migration (idempotent)");
  await db.execute(sql`ALTER TABLE canonical_food ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'canonical'`);
  await db.execute(sql`ALTER TABLE canonical_food ADD COLUMN IF NOT EXISTS scientific_name text`);
  await db.execute(sql`ALTER TABLE canonical_food ADD COLUMN IF NOT EXISTS source_ref text`);
  await db.execute(sql`ALTER TABLE canonical_food ADD COLUMN IF NOT EXISTS confidence text`);
  console.log("Columns ensured: tier, scientific_name, source_ref, confidence");

  const toWrite = results.filter((r) => r.action === "create_catalogue" || r.action === "review_required");
  // De-duplicate slugs within the batch (keep first occurrence).
  const seen = new Set<string>();
  let inserted = 0, skippedCollision = 0;
  for (const r of toWrite) {
    if (!r.proposedSlug) continue;
    if (seen.has(r.proposedSlug)) { skippedCollision++; continue; }
    seen.add(r.proposedSlug);
    const res = await db.execute(sql`
      INSERT INTO canonical_food (slug, name, category, subcategory, status, source, tier, scientific_name, source_ref, confidence)
      VALUES (${r.proposedSlug}, ${r.proposedName ?? r.proposedSlug}, ${r.thaCategory ?? "Other"},
              ${r.thaSubcategory ?? null}, 'draft', ${PILOT_SOURCE}, 'catalogue',
              ${r.scientificName ?? null}, ${r.sourceRef ?? null}, ${r.confidence})
      ON CONFLICT (slug) DO NOTHING
      RETURNING id`);
    const n = ((res as any).rows ?? res).length;
    if (n > 0) inserted++; else skippedCollision++;
  }
  section("DATABASE WRITE — results");
  console.log(`Catalogue rows inserted:           ${inserted}`);
  console.log(`Skipped (slug already exists):     ${skippedCollision}`);

  // Verify isolation: no canonical rows touched.
  const canonCount = await db.execute(sql`SELECT COUNT(*)::int n FROM canonical_food WHERE tier='canonical'`);
  const catCount = await db.execute(sql`SELECT COUNT(*)::int n FROM canonical_food WHERE tier='catalogue'`);
  const nonDraft = await db.execute(sql`SELECT COUNT(*)::int n FROM canonical_food WHERE tier='catalogue' AND status<>'draft'`);
  console.log(`canonical_food tier='canonical':   ${(((canonCount as any).rows ?? canonCount)[0]).n}  (untouched)`);
  console.log(`canonical_food tier='catalogue':   ${(((catCount as any).rows ?? catCount)[0]).n}`);
  console.log(`catalogue rows NOT status='draft':  ${(((nonDraft as any).rows ?? nonDraft)[0]).n}  (must be 0)`);
}

async function rollback() {
  const { db } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const res = await db.execute(sql`DELETE FROM canonical_food WHERE tier='catalogue' AND source=${PILOT_SOURCE} RETURNING id`);
  const n = ((res as any).rows ?? res).length;
  console.log(`Rolled back: deleted ${n} WS0.11 pilot catalogue rows.`);
  console.log("Canonical foods, columns, and all production data preserved.");
}

async function main() {
  const mode = process.argv[2];
  if (mode === "--rollback") {
    await rollback();
    process.exit(0);
  }
  const snap = loadSnapshot();
  const results = analyse(snap.foods);
  report(results, snap.meta as Record<string, unknown>);
  if (mode === "--write") {
    await writeToDatabase(results);
  } else {
    console.log("\n(analysis only — pass --write to populate the internal catalogue)");
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
