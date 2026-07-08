#!/usr/bin/env tsx
/**
 * NK6O — targeted, governed re-bind of nutrient relationships for exactly the 11
 * Batch-006 legumes that NK6N imported with benefits but ZERO nutrients (the
 * `protein` canonical target was missing from `knowledge_nutrients`, so the old
 * all-or-nothing insert dropped each food's entire nutrient set).
 *
 * Guarantees (matching the NK6O task constraints):
 *   • Operates ONLY on the 11 allow-listed slugs below — nothing else.
 *   • NEVER creates or mutates a food identity (it binds nutrients only). Each
 *     food MUST already exist; a missing one is reported and skipped, never minted.
 *   • NO `--force-upsert`, NO broad re-import. Uses the hardened, row-resilient
 *     `bindFoodNutrients` (non-destructive `onConflictDoNothing`).
 *   • Resolves every nutrient term through the single GOV2 vocabulary resolver
 *     BEFORE binding (`plant-protein` → `protein` via alias).
 *
 * Usage:  tsx scripts/nk6o-rebind-legume-nutrients.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { parse as parseYaml } from "yaml";
import { eq } from "drizzle-orm";
import { db, pool } from "../server/db";
import { knowledgeFoods } from "@shared/schema";
import { resolveNutrientTerm } from "@shared/knowledge";
import {
  extractNutrients,
  collectResolved,
  bindFoodNutrients,
  type ResolvedTerm,
  type RejectedTerm,
} from "../server/lib/canonical-foods-importer";

const BATCH_DIR = "docs/knowledge/canonical-foods/drafts/batch-006-legumes-beans-pulses-soy-foods";

/** The exact 11 legumes to repair — no more, no fewer (NK6O §4). */
const LEGUMES = [
  "adzuki-beans",
  "brown-lentils",
  "chana-dal",
  "flageolet-beans",
  "green-split-peas",
  "lupin-beans",
  "marrowfat-peas",
  "mixed-beans",
  "mung-beans",
  "toor-dal",
  "yellow-split-peas",
] as const;

interface Row {
  slug: string;
  existed: boolean;
  inserted: number;
  alreadyPresent: number;
  bound: string[];
  dropped: string[];
  rejected: string[];
}

async function main() {
  console.log("\n🔧 NK6O — Re-bind Batch 006 legume nutrients (targeted, governed)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Foods: ${LEGUMES.length}  |  force-upsert: NO  |  identity writes: NONE\n`);

  const rows: Row[] = [];

  for (const slug of LEGUMES) {
    const row: Row = { slug, existed: false, inserted: 0, alreadyPresent: 0, bound: [], dropped: [], rejected: [] };

    // Guard 1 — the food identity MUST already exist. Never create it here.
    const existing = await db.query.knowledgeFoods.findFirst({ where: eq(knowledgeFoods.slug, slug) });
    if (!existing) {
      console.log(`❌ ${slug}: food identity not found — skipped (this script never mints foods)`);
      rows.push(row);
      continue;
    }
    row.existed = true;

    // Parse the draft and extract + resolve its declared nutrients (identical to
    // the importer's own resolution path — same helpers, same GOV2 resolver).
    const filePath = resolve(`${BATCH_DIR}/${slug}.yaml`);
    const draft = parseYaml(readFileSync(filePath, "utf-8")) as any;

    // Guard 2 — the draft's canonical_slug must match the allow-listed slug.
    if (draft?.record?.canonical_slug !== slug) {
      console.log(`❌ ${slug}: draft canonical_slug "${draft?.record?.canonical_slug}" ≠ expected — skipped`);
      rows.push(row);
      continue;
    }

    const nutrients = extractNutrients(draft);
    const resolutions = nutrients.map((n) => resolveNutrientTerm(n.term));
    const resolvedOut: ResolvedTerm[] = [];
    const rejectedOut: RejectedTerm[] = [];
    const bindings = collectResolved(resolutions, resolvedOut, rejectedOut);
    row.bound = bindings;
    row.rejected = rejectedOut.map((r) => r.input);

    // First-occurrence confidence per canonical slug (mirrors the importer).
    const confidence = new Map<string, string>();
    for (const n of nutrients) {
      const r = resolveNutrientTerm(n.term);
      if (r.resolved && r.canonicalSlug && !confidence.has(r.canonicalSlug)) {
        confidence.set(r.canonicalSlug, n.confidence);
      }
    }

    const outcome = await bindFoodNutrients(slug, bindings, confidence);
    row.inserted = outcome.inserted;
    row.alreadyPresent = outcome.alreadyPresent;
    row.dropped = outcome.dropped;

    const aliasNote = resolvedOut
      .filter((r) => r.via === "alias")
      .map((r) => `${r.input}→${r.canonicalSlug}`)
      .join(", ");
    console.log(
      `✅ ${slug}: +${outcome.inserted} bound` +
      (outcome.alreadyPresent ? `, ${outcome.alreadyPresent} already present` : "") +
      `  [${bindings.join(", ")}]` +
      (aliasNote ? `  (alias: ${aliasNote})` : "") +
      (row.dropped.length ? `  ✗ dropped: ${row.dropped.join(", ")}` : "") +
      (row.rejected.length ? `  ⊘ rejected: ${row.rejected.join(", ")}` : "")
    );
    rows.push(row);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalInserted = rows.reduce((a, r) => a + r.inserted, 0);
  const missing = rows.filter((r) => !r.existed).map((r) => r.slug);
  const withDrops = rows.filter((r) => r.dropped.length > 0).map((r) => r.slug);
  const withRejects = rows.filter((r) => r.rejected.length > 0).map((r) => r.slug);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Summary:");
  console.log(`  Foods processed : ${rows.filter((r) => r.existed).length}/${LEGUMES.length}`);
  console.log(`  Nutrient rows bound (new): ${totalInserted}`);
  console.log(`  Missing foods (skipped)  : ${missing.length ? missing.join(", ") : "none"}`);
  console.log(`  Foods with dropped targets: ${withDrops.length ? withDrops.join(", ") : "none"}`);
  console.log(`  Foods with rejected terms : ${withRejects.length ? withRejects.join(", ") : "none"}`);
  console.log("");

  await pool.end();

  // Non-zero exit if anything is incomplete — an unbound target must not pass silently.
  const clean = missing.length === 0 && withDrops.length === 0;
  process.exit(clean ? 0 : 1);
}

main().catch((err) => {
  console.error("NK6O re-bind failed:", err);
  process.exit(1);
});
