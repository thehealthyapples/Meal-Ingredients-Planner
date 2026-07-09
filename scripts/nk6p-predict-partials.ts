#!/usr/bin/env tsx
/**
 * NK6P — READ-ONLY partial-import predictor. Zero writes.
 * For every SAFE-NEW draft (identity resolver replayed) it resolves each
 * nutrient/benefit term through the GOV2 resolver, then checks whether the
 * resolved canonical slug actually EXISTS as a row in knowledge_nutrients /
 * knowledge_health_benefits. A resolved-but-missing target is exactly what the
 * NK6O importer would report as `partial`. Predicts this without writing.
 */
import { readFileSync, readdirSync } from "fs";
import { join, basename } from "path";
import { parse as parseYaml } from "yaml";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { resolveCanonicalFood } from "@shared/canonical";
import { resolveNutrientTerm, resolveBenefitTerm } from "@shared/knowledge";
import { extractNutrients } from "../server/lib/canonical-foods-gate";

function extractFoodIdentity(draft: any) {
  const identity = draft.identity || {};
  const record = draft.record || {};
  return { slug: record.canonical_slug || "", name: record.display_name || "", aliases: identity.aliases || [] };
}
function extractBenefits(draft: any): string[] {
  return (draft.benefit_language || []).map((b: any) => String(b.area || b.slug || ""));
}
function foreignBlock(id: { slug: string; name: string; aliases: string[] }): string | null {
  const isForeign = (res: any) => (res.matched && res.knowledgeFoodSlug && res.knowledgeFoodSlug !== id.slug ? res.knowledgeFoodSlug : null);
  for (const c of [id.slug, id.slug.replace(/-/g, " "), id.name].filter((c) => c && c.trim())) {
    const f = isForeign(resolveCanonicalFood(c));
    if (f) return f;
  }
  return null;
}
function aliasOverlap(id: { slug: string; name: string; aliases: string[] }, block: string | null): boolean {
  const isForeign = (res: any) => (res.matched && res.knowledgeFoodSlug && res.knowledgeFoodSlug !== id.slug ? res.knowledgeFoodSlug : null);
  for (const a of Array.isArray(id.aliases) ? id.aliases : []) {
    if (typeof a !== "string" || !a.trim()) continue;
    const f = isForeign(resolveCanonicalFood(a));
    if (f && f !== block) return true;
  }
  return false;
}
const NON_DRAFT = (f: string) => f === "manifest.yaml" || f.toLowerCase() === "readme.md" || f.toUpperCase().includes("PROMPT") || !f.endsWith(".yaml");

async function main() {
  const dirs = process.argv.slice(2);
  const nRows = await db.execute(sql`select slug from knowledge_nutrients`);
  const bRows = await db.execute(sql`select slug from knowledge_health_benefits`);
  const fRows = await db.execute(sql`select slug from knowledge_foods`);
  const nutrientSlugs = new Set((nRows.rows ?? nRows as any).map((r: any) => r.slug));
  const benefitSlugs = new Set((bRows.rows ?? bRows as any).map((r: any) => r.slug));
  const existingFoods = new Set((fRows.rows ?? fRows as any).map((r: any) => r.slug));

  const complete: string[] = [];
  const partial: Array<{ slug: string; missNut: string[]; missBen: string[]; batch: string }> = [];
  const missingNutTargets = new Map<string, number>();
  const missingBenTargets = new Map<string, number>();

  for (const dir of dirs) {
    const drafts = readdirSync(dir).filter((f) => !NON_DRAFT(f)).sort();
    for (const file of drafts) {
      const draft = parseYaml(readFileSync(join(dir, file), "utf-8"));
      const id = extractFoodIdentity(draft);
      if (!id.slug) continue;
      const block = foreignBlock(id);
      if (block) continue;                       // merge candidate
      if (existingFoods.has(id.slug)) continue;  // existing exact
      if (aliasOverlap(id, block)) continue;     // editorial review
      // SAFE-NEW: predict completeness
      const nutTerms = extractNutrients(draft).map((n: any) => n.term).filter(Boolean);
      const benTerms = extractBenefits(draft).filter(Boolean);
      const resolvedNut = [...new Set(nutTerms.map((t: string) => resolveNutrientTerm(t)).filter((r: any) => r.resolved && r.canonicalSlug).map((r: any) => r.canonicalSlug))];
      const resolvedBen = [...new Set(benTerms.map((t: string) => resolveBenefitTerm(t)).filter((r: any) => r.resolved && r.canonicalSlug).map((r: any) => r.canonicalSlug))];
      const missNut = resolvedNut.filter((s: string) => !nutrientSlugs.has(s));
      const missBen = resolvedBen.filter((s: string) => !benefitSlugs.has(s));
      if (missNut.length || missBen.length) {
        partial.push({ slug: id.slug, missNut, missBen, batch: basename(dir) });
        missNut.forEach((s: string) => missingNutTargets.set(s, (missingNutTargets.get(s) || 0) + 1));
        missBen.forEach((s: string) => missingBenTargets.set(s, (missingBenTargets.get(s) || 0) + 1));
      } else {
        complete.push(id.slug);
      }
    }
  }

  console.log(`\n=== NK6P PARTIAL PREDICTION (read-only) ===`);
  console.log(`safe-new total: ${complete.length + partial.length}`);
  console.log(`  would import COMPLETE: ${complete.length}`);
  console.log(`  would import PARTIAL:  ${partial.length}`);
  console.log(`\n--- missing NUTRIENT targets (resolved but absent from knowledge_nutrients) ---`);
  [...missingNutTargets.entries()].sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`  ${s}: affects ${c} food(s)`));
  console.log(`\n--- missing BENEFIT targets (resolved but absent from knowledge_health_benefits) ---`);
  [...missingBenTargets.entries()].sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`  ${s}: affects ${c} food(s)`));
  console.log(`\n--- foods that WOULD import partial (${partial.length}) ---`);
  partial.forEach((p) => console.log(`  ${p.slug} [${p.batch.replace(/^batch-\d+-/, '')}] missNut=[${p.missNut.join(",")}] missBen=[${p.missBen.join(",")}]`));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
