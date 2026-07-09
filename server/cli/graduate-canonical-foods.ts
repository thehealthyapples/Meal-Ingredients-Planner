#!/usr/bin/env tsx

/**
 * CLI Command: gate canonical food drafts and emit graduation records.
 *
 * Replaces `server/cli/import-canonical-foods.ts` (retired by KNOW2), which
 * wrote food identities straight into `knowledge_foods` — a second writer of a
 * table owned by `shared/knowledge/foods.ts` → `seed-knowledge-registry.ts`.
 *
 * This command writes nothing to the knowledge_* tables. It runs the gate over
 * each draft and prints, for every candidate that clears it, the exact records
 * to append to `shared/knowledge/graduated-foods.ts` and
 * `shared/knowledge/graduated-relationships.ts`. A human reviews that diff and
 * commits it; `npm run seed:knowledge` then publishes it.
 *
 * It does write one thing, to a different store with a different owner: every
 * unresolved nutrient/benefit term is recorded in the Knowledge Review Queue
 * (KQ1B, `knowledge_review_*`) so rejected vocabulary is queued rather than lost
 * (Rule KC2 — rejection is terminal, not silent).
 *
 * That review IS the promotion step. Rule KC9 — automation authors candidates,
 * never publishes them.
 *
 * Usage:
 *   npm run knowledge:graduate                       # all drafts
 *   npm run knowledge:graduate <files...>            # specific drafts
 *   npm run knowledge:graduate <files...> --out <f>  # also write records to <f>
 */

import { glob } from "glob";
import { resolve } from "path";
import { writeFileSync } from "fs";
import { gateCanonicalFood, type GateResult } from "../lib/canonical-foods-gate";

const ts = (v: unknown) => JSON.stringify(v);

async function main() {
  const args = process.argv.slice(2);

  const outIdx = args.indexOf("--out");
  const outPath = outIdx >= 0 ? args[outIdx + 1] : undefined;
  // Drop flags, and the value that follows `--out` — but only when `--out` is
  // actually present, or `outIdx + 1` is 0 and swallows the first draft path.
  const outValueIdx = outIdx >= 0 ? outIdx + 1 : -1;
  const fileArgs = args.filter((a, i) => !a.startsWith("--") && i !== outValueIdx);

  const patterns = fileArgs.length > 0 ? fileArgs : ["docs/knowledge/canonical-foods/drafts/**/*.yaml"];

  let filePaths: string[] = [];
  for (const pattern of patterns) {
    try {
      filePaths.push(...(await glob(resolve(pattern), { absolute: true })));
    } catch (error) {
      console.error(`❌ Error globbing pattern ${pattern}:`, error);
    }
  }
  filePaths = Array.from(new Set(filePaths)).filter((p) => !p.endsWith("manifest.yaml")).sort();

  if (filePaths.length === 0) {
    console.log("No files found matching pattern(s)");
    process.exit(1);
  }

  console.log(`\n🚪 Canonical Food Gate  (stage 2 of 4 — nothing is published here)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Drafts to gate: ${filePaths.length}\n`);

  const results: GateResult[] = [];
  for (const filePath of filePaths) {
    try {
      results.push(await gateCanonicalFood(filePath));
    } catch (error) {
      console.log(`❌ ${filePath}\n   Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  const promote = results.filter((r) => r.outcome === "promote");
  const existing = results.filter((r) => r.outcome === "existing");
  const blocked = results.filter((r) => r.outcome === "blocked");
  const invalid = results.filter((r) => r.outcome === "invalid");

  for (const r of promote) {
    const nAlias = r.resolved.nutrients.filter((x) => x.via === "alias");
    const bAlias = r.resolved.benefits.filter((x) => x.via === "alias");
    console.log(`🟢 PROMOTE  ${r.fileName}  →  ${r.record!.nutrients.length} nutrients, ${r.record!.benefits.length} benefits`);
    if (nAlias.length) console.log(`      ↳ nutrient aliases: ${nAlias.map((x) => `${x.input}→${x.canonicalSlug}`).join(", ")}`);
    if (bAlias.length) console.log(`      ↳ benefit aliases: ${bAlias.map((x) => `${x.input}→${x.canonicalSlug}`).join(", ")}`);
    if (r.rejected.nutrients.length) console.log(`      ⊘ rejected nutrients: ${r.rejected.nutrients.map((x) => x.input).join(", ")}`);
    if (r.rejected.benefits.length) console.log(`      ⊘ rejected benefits: ${r.rejected.benefits.map((x) => x.input).join(", ")}`);
    if (r.unbindable.nutrients.length || r.unbindable.benefits.length) {
      console.log(`      ✗ unbindable (seed the vocabulary first): ${[...r.unbindable.nutrients, ...r.unbindable.benefits].join(", ")}`);
    }
    // Soft signals — an alias overlapping a different identity is not a block, but
    // it is exactly what a human weighs before promoting. Swallowing it here would
    // hand the reviewer a clean-looking record with its caveats stripped off.
    if (r.identity.aliasOverlaps.length) {
      for (const o of r.identity.aliasOverlaps) {
        console.log(`      ⚠ alias "${o.alias}" also names existing "${o.resolvedToSlug}" — review scope before promoting`);
      }
    }
    // KNOW3 — the canonical half of the promotion. Omitting it orphans the two
    // identities from each other, and `npm run seed:canonical` will refuse.
    if (r.record!.canonicalBinding) {
      const b = r.record!.canonicalBinding;
      const target = b.varietySlug ? `variety "${b.varietySlug}"` : `canonical food "${b.canonicalFoodSlug}"`;
      console.log(`      🔗 binding owed: ${target} → knowledgeFoodSlug: "${b.knowledgeFoodSlug}"  (matched on "${b.matchedOn}")`);
    }
  }
  for (const r of existing) console.log(`🔵 EXISTING ${r.fileName}  →  the seed already owns "${r.foodSlug}"; a merge is a human decision`);
  for (const r of blocked) console.log(`⛔ BLOCKED  ${r.fileName}  →  ${r.errors.join("; ")}`);
  for (const r of invalid) console.log(`❌ INVALID  ${r.fileName}  →  ${r.errors.join("; ")}`);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  🟢 promote : ${promote.length}`);
  console.log(`  🔵 existing: ${existing.length}`);
  console.log(`  ⛔ blocked : ${blocked.length}`);
  console.log(`  ❌ invalid : ${invalid.length}`);
  console.log(`  Total      : ${results.length}`);

  if (promote.length === 0) {
    console.log(`\nNothing to promote. No file was written; no row was published.`);
    process.exit(0);
  }

  const foods = promote.map((r) => {
    const f = r.record!.food;
    return `  { slug: ${ts(f.slug)}, name: ${ts(f.name)}, category: ${ts(f.category)},\n` +
           `    aliases: ${ts(f.aliases)}, description: null, source: GRADUATED_FOOD_SOURCE },`;
  });
  const nutrients = promote.flatMap((r) => r.record!.nutrients.map((n) =>
    `  { foodSlug: ${ts(n.foodSlug)}, nutrientSlug: ${ts(n.nutrientSlug)}, confidence: ${ts(n.confidence)}, ranking: ${n.ranking}, source: GRADUATED_FOOD_SOURCE },`));
  const benefits = promote.flatMap((r) => r.record!.benefits.map((b) =>
    `  { foodSlug: ${ts(b.foodSlug)}, benefitSlug: ${ts(b.benefitSlug)}, evidenceStrength: ${ts(b.evidenceStrength)}, ranking: ${b.ranking}, source: GRADUATED_FOOD_SOURCE },`));

  // KNOW3 — canonical bindings owed by this batch. These are edits to an EXISTING
  // canonical food, not new rows: the reviewer sets the field in place.
  const bindings = promote
    .map((r) => r.record!.canonicalBinding)
    .filter((b): b is NonNullable<typeof b> => b !== null)
    .map((b) => `  // ${b.varietySlug ? `variety ${b.varietySlug} (of ${b.canonicalFoodSlug})` : `food ${b.canonicalFoodSlug}`}: knowledgeFoodSlug: ${ts(b.knowledgeFoodSlug)},`);

  const emitted = [
    `// ${promote.length} candidate(s) cleared the gate. Review, then append:`,
    ``,
    `// → shared/knowledge/graduated-foods.ts, into GRADUATED_FOOD_SEED`,
    ...foods,
    ``,
    `// → shared/knowledge/graduated-relationships.ts, into GRADUATED_FOOD_NUTRIENTS`,
    ...nutrients,
    ``,
    `// → shared/knowledge/graduated-relationships.ts, into GRADUATED_FOOD_BENEFITS`,
    ...benefits,
    ...(bindings.length
      ? [
          ``,
          `// → shared/canonical/foods.ts — set knowledgeFoodSlug on the EXISTING entry.`,
          `//   Same commit as the rows above; seed:canonical refuses without it.`,
          ...bindings,
        ]
      : []),
    ``,
  ].join("\n");

  console.log(`\n${emitted}`);
  if (outPath) {
    writeFileSync(outPath, emitted);
    console.log(`Wrote ${promote.length} record(s) to ${outPath}`);
  }
  console.log(
    `Nothing has been published. Commit the records above, run \`npm run seed:knowledge\`,\n` +
    `and the one writer will publish them.`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error("Gate failed:", error);
  process.exit(1);
});
