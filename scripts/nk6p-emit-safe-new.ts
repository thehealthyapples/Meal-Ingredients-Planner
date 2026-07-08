#!/usr/bin/env tsx
/** NK6P — emit absolute file paths of SAFE-NEW drafts only (read-only). */
import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { parse as parseYaml } from "yaml";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { resolveCanonicalFood } from "@shared/canonical";
const NON_DRAFT = (f: string) => f === "manifest.yaml" || f.toLowerCase() === "readme.md" || f.toUpperCase().includes("PROMPT") || !f.endsWith(".yaml");
function id(draft: any) { const i = draft.identity || {}, r = draft.record || {}; return { slug: r.canonical_slug || "", name: r.display_name || "", aliases: i.aliases || [] }; }
function block(x: any): string | null {
  const F = (res: any) => (res.matched && res.knowledgeFoodSlug && res.knowledgeFoodSlug !== x.slug ? res.knowledgeFoodSlug : null);
  for (const c of [x.slug, x.slug.replace(/-/g, " "), x.name].filter((c: any) => c && c.trim())) { const f = F(resolveCanonicalFood(c)); if (f) return f; } return null;
}
function overlap(x: any, b: string | null): boolean {
  const F = (res: any) => (res.matched && res.knowledgeFoodSlug && res.knowledgeFoodSlug !== x.slug ? res.knowledgeFoodSlug : null);
  for (const a of Array.isArray(x.aliases) ? x.aliases : []) { if (typeof a !== "string" || !a.trim()) continue; const f = F(resolveCanonicalFood(a)); if (f && f !== b) return true; } return false;
}
async function main() {
  const fRows = await db.execute(sql`select slug from knowledge_foods`);
  const existing = new Set((fRows.rows ?? fRows as any).map((r: any) => r.slug));
  const out: string[] = [];
  for (const dir of process.argv.slice(2)) {
    for (const file of readdirSync(dir).filter((f) => !NON_DRAFT(f)).sort()) {
      const x = id(parseYaml(readFileSync(join(dir, file), "utf-8")));
      if (!x.slug) continue;
      const b = block(x);
      if (b) continue;
      if (existing.has(x.slug)) continue;
      if (overlap(x, b)) continue;
      out.push(resolve(join(dir, file)));
    }
  }
  console.error(`safe-new files: ${out.length}`);
  console.log(out.join("\n"));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
