/**
 * Generate the machine-readable Product Knowledge Registry inventory.
 *
 *   npx tsx scripts/build-product-inventory.ts
 *
 * docs/product/inventory/product.yaml  (AUTHORED — the single act of authorship)
 *   → docs/product/inventory/product.json  (GENERATED — never hand-edited)
 *
 * Rule PKR17: two forms, one truth, one act of authorship. Where they disagree,
 * the build is broken — not the reader's understanding.
 * Rule PKR21: the generated inventory is the ONLY form the Intelligence Platform
 * may ever read. Prose is for people; structure is for machines.
 *
 * Read-only with respect to the product: this script touches nothing outside
 * docs/product/inventory/.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = resolve(ROOT, "docs/product/inventory/product.yaml");
const OUT = resolve(ROOT, "docs/product/inventory/product.json");

const VISIBILITIES = ["public", "household", "admin", "developer"] as const;
type Visibility = (typeof VISIBILITIES)[number];

const doc = parse(readFileSync(SRC, "utf8")) as {
  schema_version: number;
  populated_by: string;
  populated_on: string;
  entries: Array<Record<string, unknown>>;
};

const entries = doc.entries ?? [];

// Rule PKR22 — visibility fails CLOSED. A missing or unrecognised label is
// never permission: it resolves to `developer`, the most restrictive tier, and
// is reported loudly rather than silently accepted.
let failedClosed = 0;
for (const e of entries) {
  const v = e.visibility as Visibility | undefined;
  if (!v || !VISIBILITIES.includes(v)) {
    console.error(
      `  FAIL-CLOSED  ${String(e.id)} has visibility ${JSON.stringify(v)} — coerced to "developer" and served to no one (Rule PKR22)`,
    );
    e.visibility = "developer";
    failedClosed++;
  }
}

const out = {
  schema_version: doc.schema_version,
  generated_from: "docs/product/inventory/product.yaml",
  generated_by: "scripts/build-product-inventory.ts",
  populated_by: doc.populated_by,
  populated_on: doc.populated_on,
  entry_count: entries.length,
  entries,
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");

console.log(`Generated ${OUT}`);
console.log(`  ${entries.length} entries`);
const bySection = entries.reduce<Record<string, number>>((acc, e) => {
  const s = String(e.section);
  acc[s] = (acc[s] ?? 0) + 1;
  return acc;
}, {});
for (const [section, count] of Object.entries(bySection).sort()) {
  console.log(`    ${section.padEnd(28)} ${count}`);
}
const byVis = entries.reduce<Record<string, number>>((acc, e) => {
  const v = String(e.visibility);
  acc[v] = (acc[v] ?? 0) + 1;
  return acc;
}, {});
console.log("  visibility:");
for (const v of VISIBILITIES) {
  if (byVis[v]) console.log(`    ${v.padEnd(28)} ${byVis[v]}`);
}
if (failedClosed > 0) {
  console.error(`\n${failedClosed} entr(ies) failed closed. Fix product.yaml.`);
  process.exit(1);
}
