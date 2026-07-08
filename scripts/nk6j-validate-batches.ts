#!/usr/bin/env tsx
/**
 * NK6J — Read-only validation of Batch 001 & Batch 002 canonical food drafts.
 *
 * SAFETY: This harness performs ZERO writes. It replays the importer's EXACT
 * identity-reconciliation logic (server/lib/canonical-foods-importer.ts →
 * reconcileFoodIdentity / extractFoodIdentity) and the GOV2 vocabulary resolver,
 * plus a single read-only SELECT of existing knowledge_food slugs. It never calls
 * importCanonicalFood and never inserts/updates anything.
 *
 * Usage: tsx scripts/nk6j-validate-batches.ts <batchDir> [<batchDir> ...]
 */
import { readFileSync, readdirSync } from "fs";
import { join, basename } from "path";
import { parse as parseYaml } from "yaml";
import { db } from "../server/db";
import { resolveCanonicalFood } from "@shared/canonical";
import { resolveNutrientTerm, resolveBenefitTerm } from "@shared/knowledge";

// ── Faithful copies of the importer's private helpers (identity axis) ──────────

function extractFoodIdentity(draft: any) {
  const identity = draft.identity || {};
  const record = draft.record || {};
  return {
    slug: record.canonical_slug || "",
    name: record.display_name || "",
    aliases: identity.aliases || [],
  };
}

function reconcileFoodIdentity(foodIdentity: { slug: string; name: string; aliases: string[] }) {
  const isForeignIdentity = (res: ReturnType<typeof resolveCanonicalFood>): string | null =>
    res.matched && res.knowledgeFoodSlug && res.knowledgeFoodSlug !== foodIdentity.slug
      ? res.knowledgeFoodSlug
      : null;

  const identityCandidates: string[] = [
    foodIdentity.slug,
    foodIdentity.slug.replace(/-/g, " "),
    foodIdentity.name,
  ].filter((c) => typeof c === "string" && c.trim().length > 0);

  let block: { resolvedToSlug: string; matchedOn: string } | null = null;
  for (const candidate of identityCandidates) {
    const foreign = isForeignIdentity(resolveCanonicalFood(candidate));
    if (foreign) {
      block = { resolvedToSlug: foreign, matchedOn: candidate };
      break;
    }
  }

  const aliasOverlaps: Array<{ alias: string; resolvedToSlug: string }> = [];
  const seen = new Set<string>();
  for (const alias of Array.isArray(foodIdentity.aliases) ? foodIdentity.aliases : []) {
    if (typeof alias !== "string" || !alias.trim()) continue;
    const foreign = isForeignIdentity(resolveCanonicalFood(alias));
    if (foreign && foreign !== block?.resolvedToSlug && !seen.has(foreign)) {
      seen.add(foreign);
      aliasOverlaps.push({ alias, resolvedToSlug: foreign });
    }
  }
  return { block, aliasOverlaps };
}

function extractNutrients(draft: any): string[] {
  const notable = draft.nutrition_profile?.notable_nutrients || [];
  return notable.map((n: any) => String(n.nutrient || n.slug || ""));
}
function extractBenefits(draft: any): string[] {
  const benefitLanguage = draft.benefit_language || [];
  return benefitLanguage.map((b: any) => String(b.area || b.slug || ""));
}

// Files that are NOT food drafts and must never be imported.
const NON_DRAFT = (f: string) =>
  f === "manifest.yaml" ||
  f.toLowerCase() === "readme.md" ||
  f.toUpperCase().includes("PROMPT") ||
  !f.endsWith(".yaml");

type Classification =
  | "safe-new-import"
  | "existing-exact-identity"
  | "alias-resolved-merge-candidate"
  | "soft-overlap-review"
  | "blocked-conflict";

async function main() {
  const batchDirs = process.argv.slice(2);
  if (batchDirs.length === 0) {
    console.error("Usage: tsx scripts/nk6j-validate-batches.ts <batchDir> [...]");
    process.exit(1);
  }

  // READ-ONLY: pull the set of existing knowledge_food slugs once.
  const existingRows = await db.query.knowledgeFoods.findMany({ columns: { slug: true } });
  const existingSlugs = new Set(existingRows.map((r) => r.slug));
  console.log(`\n[read-only] existing knowledge_food identities in DB: ${existingSlugs.size}`);

  for (const dir of batchDirs) {
    const all = readdirSync(dir);
    const skipped = all.filter(NON_DRAFT);
    const drafts = all.filter((f) => !NON_DRAFT(f)).sort();

    console.log(`\n════════════════════════════════════════════════════════════`);
    console.log(`BATCH DIR: ${basename(dir)}`);
    console.log(`  draft yaml files: ${drafts.length}`);
    console.log(`  skipped (never imported): ${skipped.join(", ") || "(none)"}`);
    console.log(`────────────────────────────────────────────────────────────`);

    const buckets: Record<Classification, string[]> = {
      "safe-new-import": [],
      "existing-exact-identity": [],
      "alias-resolved-merge-candidate": [],
      "soft-overlap-review": [],
      "blocked-conflict": [],
    };

    for (const file of drafts) {
      const path = join(dir, file);
      let draft: any;
      try {
        draft = parseYaml(readFileSync(path, "utf-8"));
      } catch (e) {
        buckets["blocked-conflict"].push(`${file} (YAML parse error)`);
        console.log(`  ⛔ ${file}: BLOCKED — YAML parse error: ${(e as Error).message}`);
        continue;
      }

      const id = extractFoodIdentity(draft);
      if (!id.slug) {
        buckets["blocked-conflict"].push(`${file} (missing canonical_slug)`);
        console.log(`  ⛔ ${file}: BLOCKED — missing record.canonical_slug`);
        continue;
      }

      const recon = reconcileFoodIdentity(id);
      const nutRej = extractNutrients(draft).filter((t) => t && !resolveNutrientTerm(t).resolved);
      const benRej = extractBenefits(draft).filter((t) => t && !resolveBenefitTerm(t).resolved);
      const overlapStr = recon.aliasOverlaps.map((o) => `${o.alias}→${o.resolvedToSlug}`).join(", ");

      let cls: Classification;
      let detail = "";
      if (recon.block) {
        // Importer HARD BLOCK — own identity resolves to a different existing food.
        cls = "alias-resolved-merge-candidate";
        detail = `own identity "${recon.block.matchedOn}" → existing "${recon.block.resolvedToSlug}" (MERGE, not import)`;
      } else if (existingSlugs.has(id.slug)) {
        cls = "existing-exact-identity";
        detail = `slug "${id.slug}" already present (importer blocks without --force-upsert)`;
      } else if (recon.aliasOverlaps.length > 0) {
        cls = "soft-overlap-review";
        detail = `declared alias overlap: ${overlapStr}`;
      } else {
        cls = "safe-new-import";
        detail = `no identity collision; slug "${id.slug}" is new`;
      }

      // Attach vocabulary rejections as extra review context (never a blocker here).
      const vocab =
        nutRej.length || benRej.length
          ? ` [vocab rejects: ${[...nutRej.map((t) => "nutrient:" + t), ...benRej.map((t) => "benefit:" + t)].join(", ")}]`
          : "";

      buckets[cls].push(`${id.slug}${vocab ? " " + vocab : ""}`);
      const icon =
        cls === "safe-new-import" ? "🟢" :
        cls === "existing-exact-identity" ? "🔵" :
        cls === "soft-overlap-review" ? "🟡" :
        cls === "alias-resolved-merge-candidate" ? "🟠" : "⛔";
      console.log(`  ${icon} ${file} [${cls}] ${detail}${vocab}`);
    }

    console.log(`  ── summary for ${basename(dir)} ──`);
    for (const k of Object.keys(buckets) as Classification[]) {
      console.log(`     ${k}: ${buckets[k].length}`);
    }
  }

  console.log(`\n[read-only] validation complete. ZERO writes performed.\n`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
