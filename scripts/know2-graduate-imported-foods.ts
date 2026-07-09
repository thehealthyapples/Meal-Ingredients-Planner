#!/usr/bin/env tsx
/**
 * KNOW2 — one-time graduation of the importer-written knowledge into the
 * canonical seed (`shared/knowledge/`).
 *
 * Before KNOW2, `knowledge_foods` had two writers: the declared owner
 * (`shared/knowledge/foods.ts` → `server/seeds/seed-knowledge-registry.ts`, per
 * SoT Register Domain 1) and the NK6D canonical foods importer (now the
 * write-free `server/lib/canonical-foods-gate.ts`), which inserted identities
 * straight into the published store. 346 of 610 live foods arrived that way and
 * were therefore invisible to the declared source of truth.
 *
 * This script promotes those rows into the canonical seed ONCE, so that from
 * here on a single `npm run seed:knowledge` reproduces the whole table.
 *
 * It is deliberately paranoid. Every emitted record is derived from the
 * checked-in YAML draft (the Candidate) and then asserted field-by-field
 * against the live published row (the truth we must not lose). A single
 * divergence aborts the emit — the generated dataset is only written when it is
 * provably equal to BOTH the draft corpus and the database.
 *
 * Usage:  tsx scripts/know2-graduate-imported-foods.ts [--emit]
 *         (without --emit it reports and writes nothing)
 */
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { parse as parseYaml } from "yaml";
import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";
import { EDITORIAL_FOOD_SEED } from "../shared/knowledge/foods";
import { resolveNutrientTerm, resolveBenefitTerm } from "@shared/knowledge";
import {
  extractFoodIdentity,
  extractNutrients,
  extractBenefits,
  collectResolved,
  mapConfidence,
  type ResolvedTerm,
  type RejectedTerm,
} from "../server/lib/canonical-foods-gate";

const DRAFT_ROOT = "docs/knowledge/canonical-foods/drafts";

/** Provenance the importer stamped on its relationship rows — and never on its identity rows. */
const DRAFT_SOURCE = "NK6 canonical food draft";

/**
 * Retired vocabulary (NK6M). `plant-protein` was removed from `NUTRIENT_SEED`
 * but survives as a `knowledge_nutrients` row plus 38 dangling relationship
 * rows (36 editorial + 2 importer-written). It cannot be graduated: the seed
 * validator rejects a link to a nutrient the seed does not define. The two
 * importer rows stay in the DB untouched — the seed never deletes — and join
 * KNOW1's documented residue rather than being silently resurrected here.
 */
const RETIRED_NUTRIENTS = new Set(["plant-protein"]);

/**
 * The importer set `description` from `classification.whole_food_status`, so all
 * 346 published rows carry the literal machine enum below in a display-copy
 * column that `/api/knowledge/foods` serves to the client. It is a
 * classification, not prose. Graduating it verbatim would write fabricated
 * display copy into the canonical seed, so it is withheld: the rows graduate
 * with `description: null` — a gap rendered as a gap (Principle 6).
 *
 * No prose is authored in its place. NK1's Domain 6 trust gate and STEP 7 make
 * unsourced knowledge copy a hard stop; the honest state is empty.
 */
const FABRICATED_DESCRIPTION = "whole_or_minimally_processed";

interface DraftFile { path: string; doc: any; }

function draftFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".yaml") && e.name !== "manifest.yaml" && !e.name.toUpperCase().includes("PROMPT")) out.push(p);
    }
  };
  walk(DRAFT_ROOT);
  return out.sort();
}

/** Index every draft by canonical slug. Ten slugs have two draft files (§ report). */
function draftsBySlug(): Map<string, DraftFile[]> {
  const bySlug = new Map<string, DraftFile[]>();
  for (const path of draftFiles()) {
    const doc = parseYaml(readFileSync(path, "utf-8")) as any;
    const slug = doc?.record?.canonical_slug;
    if (!slug) continue;
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), { path, doc }]);
  }
  return bySlug;
}

const arrEq = (a: unknown[], b: unknown[]) => JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

/** Derive the identity the importer would have written from this draft. */
function identityOf(doc: any) {
  const id = extractFoodIdentity(doc);
  return { slug: id.slug, name: id.name, category: id.category, description: id.description ?? null, aliases: id.aliases ?? [] };
}

/** Does this draft's derived identity equal the live published row? */
function identityMatches(doc: any, row: any): boolean {
  const y = identityOf(doc);
  return y.name === row.name && y.category === row.category
    && (y.description ?? null) === (row.description ?? null) && arrEq(y.aliases, row.aliases);
}

/** Derive the relationship rows the importer would have written from this draft. */
function relationshipsOf(doc: any) {
  const resolvedN: ResolvedTerm[] = [], rejectedN: RejectedTerm[] = [];
  const resolvedB: ResolvedTerm[] = [], rejectedB: RejectedTerm[] = [];
  const nutrients = extractNutrients(doc);
  const benefits = extractBenefits(doc);
  const nutrientBindings = collectResolved(nutrients.map((n) => resolveNutrientTerm(n.term)), resolvedN, rejectedN);
  const benefitBindings = collectResolved(benefits.map((b) => resolveBenefitTerm(b.term)), resolvedB, rejectedB);

  const confidence = new Map<string, string>();
  for (const n of nutrients) {
    const r = resolveNutrientTerm(n.term);
    if (r.resolved && r.canonicalSlug && !confidence.has(r.canonicalSlug)) confidence.set(r.canonicalSlug, mapConfidence(n.confidence));
  }
  return {
    nutrients: nutrientBindings.map((nutrientSlug, i) => ({ nutrientSlug, ranking: i, confidence: confidence.get(nutrientSlug) ?? "emerging" })),
    benefits: benefitBindings.map((benefitSlug, i) => ({ benefitSlug, ranking: i, evidenceStrength: "emerging" })),
  };
}

const ts = (v: unknown) => JSON.stringify(v);

async function main() {
  const emit = process.argv.includes("--emit");
  const ex = async (s: any) => { const r: any = await db.execute(s); return (r.rows ?? r) as any[]; };

  const editorial = new Set(EDITORIAL_FOOD_SEED.map((f) => f.slug));
  const foodRows = await ex(sql`select slug, name, category, description, aliases, source from knowledge_foods order by slug`);
  const fnRows = await ex(sql`select food_slug, nutrient_slug, confidence, ranking from knowledge_food_nutrients where source=${DRAFT_SOURCE} order by food_slug, ranking`);
  const fbRows = await ex(sql`select food_slug, benefit_slug, evidence_strength, ranking from knowledge_food_benefits where source=${DRAFT_SOURCE} order by food_slug, ranking`);

  const graduatedFoods = foodRows.filter((r) => !editorial.has(r.slug));
  console.log(`live knowledge_foods: ${foodRows.length}  |  editorial seed: ${editorial.size}  |  to graduate: ${graduatedFoods.length}`);
  console.log(`importer relationship rows: ${fnRows.length} nutrient, ${fbRows.length} benefit\n`);

  const bySlug = draftsBySlug();
  const problems: string[] = [];

  // ── Identities ────────────────────────────────────────────────────────────
  // Every graduated food must have a checked-in draft whose derived identity is
  // byte-equal to the published row. Where a slug has two drafts, the matching
  // one identifies which Candidate was actually promoted.
  const chosenDraft = new Map<string, string>();
  for (const row of graduatedFoods) {
    const candidates = bySlug.get(row.slug) ?? [];
    if (candidates.length === 0) { problems.push(`${row.slug}: published row has NO checked-in draft`); continue; }
    const match = candidates.find((c) => identityMatches(c.doc, row));
    if (!match) {
      const y = identityOf(candidates[0].doc);
      problems.push(`${row.slug}: no draft reproduces the published row — draft(${candidates[0].path}) name=${ts(y.name)} cat=${ts(y.category)} aliases=${ts(y.aliases)} vs db name=${ts(row.name)} cat=${ts(row.category)} aliases=${ts(row.aliases)}`);
      continue;
    }
    chosenDraft.set(row.slug, match.path);
    if (candidates.length > 1) console.log(`  dup-slug "${row.slug}" → promoted draft is ${match.path}`);
  }

  // ── Relationships ─────────────────────────────────────────────────────────
  // Derive from the promoted draft and assert equality with the published rows,
  // minus the retired-vocabulary links which cannot enter the seed.
  const fnByFood = new Map<string, any[]>();
  for (const r of fnRows) fnByFood.set(r.food_slug, [...(fnByFood.get(r.food_slug) ?? []), r]);
  const fbByFood = new Map<string, any[]>();
  for (const r of fbRows) fbByFood.set(r.food_slug, [...(fbByFood.get(r.food_slug) ?? []), r]);

  const emittedFn: Array<{ foodSlug: string; nutrientSlug: string; confidence: string; ranking: number }> = [];
  const emittedFb: Array<{ foodSlug: string; benefitSlug: string; evidenceStrength: string; ranking: number }> = [];
  const retired: string[] = [];
  /**
   * The published rows are NOT a pure function of today's drafts: the GOV2
   * vocabulary resolver has changed since the import (NK6M/NK6R), so a term that
   * once resolved to its own canonical slug may now collapse onto another, which
   * shifts the de-duplicated binding index that becomes `ranking`. The link
   * itself is still derivable from the draft — only its stored ordinal predates
   * the resolver change. We emit the PUBLISHED value (never re-derive it: that
   * would silently reorder live data) and report every drift below.
   */
  const drift: string[] = [];

  // Relationship rows exist for graduated foods AND for a handful of editorial
  // foods the importer reached with --force-upsert. Both must be graduated: the
  // seed is now the sole writer of these tables.
  const relFoods = new Set<string>([...fnByFood.keys(), ...fbByFood.keys()]);
  for (const foodSlug of [...relFoods].sort()) {
    // For an editorial food the importer touched, identity cannot pick the draft
    // (a later seed run reverted the importer's identity write). Choose the
    // candidate draft that actually derives the published links.
    const candidates = bySlug.get(foodSlug) ?? [];
    let draftPath = chosenDraft.get(foodSlug);
    if (!draftPath) {
      const wanted = new Set([
        ...(fnByFood.get(foodSlug) ?? []).filter((r) => !RETIRED_NUTRIENTS.has(r.nutrient_slug)).map((r) => `n:${r.nutrient_slug}`),
        ...(fbByFood.get(foodSlug) ?? []).map((r) => `b:${r.benefit_slug}`),
      ]);
      const covers = (c: DraftFile) => {
        const d = relationshipsOf(c.doc);
        const have = new Set([...d.nutrients.map((n) => `n:${n.nutrientSlug}`), ...d.benefits.map((b) => `b:${b.benefitSlug}`)]);
        return [...wanted].every((w) => have.has(w));
      };
      draftPath = candidates.find(covers)?.path;
      if (draftPath && candidates.length > 1) console.log(`  dup-slug "${foodSlug}" (editorial identity) → links derive from ${draftPath}`);
    }
    if (!draftPath) { problems.push(`${foodSlug}: has importer relationship rows but no draft derives them`); continue; }
    const doc = parseYaml(readFileSync(draftPath, "utf-8"));
    const derived = relationshipsOf(doc);

    for (const dbRow of fnByFood.get(foodSlug) ?? []) {
      if (RETIRED_NUTRIENTS.has(dbRow.nutrient_slug)) { retired.push(`${foodSlug}/${dbRow.nutrient_slug}`); continue; }
      const d = derived.nutrients.find((n) => n.nutrientSlug === dbRow.nutrient_slug);
      if (!d) { problems.push(`${foodSlug}: db nutrient "${dbRow.nutrient_slug}" not derivable from ${draftPath}`); continue; }
      if (d.confidence !== dbRow.confidence || d.ranking !== dbRow.ranking) {
        drift.push(`${foodSlug}/${dbRow.nutrient_slug}: draft now derives {conf:${d.confidence},rank:${d.ranking}}, published {conf:${dbRow.confidence},rank:${dbRow.ranking}} — published wins`);
      }
      emittedFn.push({ foodSlug, nutrientSlug: dbRow.nutrient_slug, confidence: dbRow.confidence, ranking: dbRow.ranking });
    }
    for (const dbRow of fbByFood.get(foodSlug) ?? []) {
      const d = derived.benefits.find((b) => b.benefitSlug === dbRow.benefit_slug);
      if (!d) { problems.push(`${foodSlug}: db benefit "${dbRow.benefit_slug}" not derivable from ${draftPath}`); continue; }
      if (d.evidenceStrength !== dbRow.evidence_strength || d.ranking !== dbRow.ranking) {
        drift.push(`${foodSlug}/${dbRow.benefit_slug}: draft now derives {ev:${d.evidenceStrength},rank:${d.ranking}}, published {ev:${dbRow.evidence_strength},rank:${dbRow.ranking}} — published wins`);
      }
      emittedFb.push({ foodSlug, benefitSlug: dbRow.benefit_slug, evidenceStrength: dbRow.evidence_strength, ranking: dbRow.ranking });
    }
  }

  const fabricated = graduatedFoods.filter((r) => r.description === FABRICATED_DESCRIPTION).length;
  const otherDescriptions = graduatedFoods.filter((r) => r.description && r.description !== FABRICATED_DESCRIPTION);
  console.log(`\ndescriptions withheld as honest gaps: ${fabricated}/${graduatedFoods.length} carry the enum "${FABRICATED_DESCRIPTION}"`);
  if (otherDescriptions.length) {
    problems.push(`${otherDescriptions.length} graduated food(s) carry a description that is NOT the known enum — review before withholding: ${otherDescriptions.slice(0, 5).map((r) => `${r.slug}=${ts(r.description)}`).join(", ")}`);
  }

  console.log(`\nretired-vocabulary links held back (not graduated): ${retired.length} → ${retired.join(", ") || "none"}`);
  console.log(`\nresolver drift (link derivable, ordinal/confidence predates a vocabulary change): ${drift.length}`);
  for (const d of drift.slice(0, 15)) console.log("  • " + d);
  if (drift.length > 15) console.log(`  … and ${drift.length - 15} more`);
  console.log(`\nemitting: ${chosenDraft.size} foods, ${emittedFn.length} nutrient links, ${emittedFb.length} benefit links`);

  if (problems.length) {
    console.error(`\n❌ ${problems.length} divergence(s) — refusing to emit:\n`);
    for (const p of problems.slice(0, 40)) console.error("  • " + p);
    if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
    await pool.end();
    process.exit(1);
  }
  if (graduatedFoods.length !== chosenDraft.size) {
    console.error(`\n❌ would graduate ${chosenDraft.size} of ${graduatedFoods.length} foods — refusing to emit`);
    await pool.end();
    process.exit(1);
  }
  console.log(
    `\n✅ every graduated identity is byte-equal to its draft and its live row; ` +
    `every graduated link is derivable from its draft (${drift.length} carry a pre-resolver-change ordinal, published value preserved).`,
  );

  if (!emit) { console.log("\n(dry run — pass --emit to write the generated datasets)"); await pool.end(); process.exit(0); }

  // ── Emit ──────────────────────────────────────────────────────────────────
  const header = (what: string) => `// GENERATED by scripts/know2-graduate-imported-foods.ts — DO NOT HAND-EDIT.
//
// KNOW2 — ${what}
//
// These rows were written into the published \`knowledge_*\` tables by the NK6D
// canonical foods importer, a second writer that KNOW2 retired (the module
// survives, stripped of every write, as \`server/lib/canonical-foods-gate.ts\`).
// They are promoted here so the declared source of truth (SoT Register Domain 1:
// \`shared/knowledge/\` → \`server/seeds/seed-knowledge-registry.ts\`) once again
// describes every live row.
//
// Provenance is honest: every record derives from an AI-authored draft under
// \`docs/knowledge/canonical-foods/drafts/\` (\`authored_by: ChatGPT for The Healthy
// Apples\`), not from human editorial authorship. They carry \`source:
// "${DRAFT_SOURCE}"\` and must never be relabelled "THA editorial".
//
// To promote further drafts, run the gate (\`npm run knowledge:graduate\`), review
// the records it emits, and append them here in a reviewed commit (Rule KC9 —
// automation authors candidates, a human publishes them).
`;

  const foodsOut = [
    header("graduated food identities (346), promoted from the NK6 canonical food drafts."),
    `//`,
    `// \`description\` is null on every row, deliberately. The importer wrote the`,
    `// classification enum "${FABRICATED_DESCRIPTION}" into this display-copy column`,
    `// and \`/api/knowledge/foods\` served it to the client. A machine enum is not a`,
    `// description; a gap renders as a gap (Principle 6). No prose is authored in its`,
    `// place — that would be an unsourced knowledge claim (NK1 Domain 6, STEP 7).`,
    ``,
    `import type { InsertKnowledgeFood } from "../schema";`,
    ``,
    `/** Stamped on every graduated row so its draft provenance survives in the DB. */`,
    `export const GRADUATED_FOOD_SOURCE = ${ts(DRAFT_SOURCE)};`,
    ``,
    `export const GRADUATED_FOOD_SEED: InsertKnowledgeFood[] = [`,
    ...graduatedFoods.map((r) => {
      const y = identityOf(bySlug.get(r.slug)!.find((c) => c.path === chosenDraft.get(r.slug))!.doc);
      // `description` is deliberately absent — see FABRICATED_DESCRIPTION.
      return `  { slug: ${ts(y.slug)}, name: ${ts(y.name)}, category: ${ts(y.category)},\n` +
             `    aliases: ${ts(y.aliases)}, description: null, source: GRADUATED_FOOD_SOURCE },`;
    }),
    `];`,
    ``,
  ].join("\n");

  const relsOut = [
    header(`graduated food→nutrient (${emittedFn.length}) and food→benefit (${emittedFb.length}) links.`),
    `//`,
    `// \`ranking\` and \`confidence\`/\`evidenceStrength\` are preserved verbatim from the`,
    `// published rows — renumbering them would silently change data. Links to retired`,
    `// vocabulary (\`plant-protein\`) are deliberately absent: the seed cannot reference`,
    `// a nutrient it does not define. Those DB rows are left untouched (the seed never`,
    `// deletes) and remain KNOW1's documented residue.`,
    ``,
    `import type { InsertKnowledgeFoodNutrient, InsertKnowledgeFoodBenefit } from "../schema";`,
    `import { GRADUATED_FOOD_SOURCE } from "./graduated-foods";`,
    ``,
    `export const GRADUATED_FOOD_NUTRIENTS: InsertKnowledgeFoodNutrient[] = [`,
    ...emittedFn.map((r) => `  { foodSlug: ${ts(r.foodSlug)}, nutrientSlug: ${ts(r.nutrientSlug)}, confidence: ${ts(r.confidence)}, ranking: ${r.ranking}, source: GRADUATED_FOOD_SOURCE },`),
    `];`,
    ``,
    `export const GRADUATED_FOOD_BENEFITS: InsertKnowledgeFoodBenefit[] = [`,
    ...emittedFb.map((r) => `  { foodSlug: ${ts(r.foodSlug)}, benefitSlug: ${ts(r.benefitSlug)}, evidenceStrength: ${ts(r.evidenceStrength)}, ranking: ${r.ranking}, source: GRADUATED_FOOD_SOURCE },`),
    `];`,
    ``,
  ].join("\n");

  writeFileSync("shared/knowledge/graduated-foods.ts", foodsOut);
  writeFileSync("shared/knowledge/graduated-relationships.ts", relsOut);
  console.log("\nwrote shared/knowledge/graduated-foods.ts");
  console.log("wrote shared/knowledge/graduated-relationships.ts");
  await pool.end();
  process.exit(0);
}

main();
