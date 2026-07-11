/**
 * TRUST1-O8 — Schema-to-migration coverage
 * ========================================
 * Answers one question, honestly: **can the reviewed migrations actually build this schema?**
 *
 * THA has two descriptions of its database and only one of them is reviewed:
 *
 *   1. `shared/schema.ts`            — the DECLARATIVE schema. Drizzle table definitions. This is
 *                                      what the application code reads and writes through, and it
 *                                      is the thing `drizzle-kit push` applies.
 *   2. `server/migrations/runner.ts` — the REVIEWED migration list. Ordered, transactional,
 *                                      recorded in `schema_migrations`, applied at boot. After
 *                                      TRUST1-O8 this is the ONLY mechanism that may touch a
 *                                      production schema.
 *
 * If (2) cannot produce (1), then some tables in production exist only because somebody once ran
 * `drizzle-kit push` — they have no migration, no review, and no reproducible provenance. You could
 * not rebuild the database from the repository, and a restore test (TRUST1-O5) would be restoring
 * a schema that no reviewed artefact describes.
 *
 * This script measures that gap and prints it. It does NOT fix it, and it does not pretend it is
 * absent.
 *
 * WHAT IT IS NOT
 * --------------
 * Table-level, not column-level. A table counted as "covered" may still have columns that were
 * added declaratively and never migrated (`runner.ts` contains several migrations that exist
 * precisely to repair that — see `2026-03-13_pantry_columns_fix`, whose comment reads "Add columns
 * that were added to the Drizzle schema without a migration"). So this number is an UPPER BOUND on
 * how good the coverage is. The true coverage is no better than what is printed here, and is
 * probably worse.
 *
 * Usage:
 *   npm run verify:schema-coverage            # report; always exits 0
 *   npm run verify:schema-coverage -- --strict # exit 1 if any declared table has no migration
 *
 * It touches no database and needs no DATABASE_URL. It reads two files.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const SCHEMA_FILE = resolve(REPO_ROOT, "shared/schema.ts");
const RUNNER_FILE = resolve(REPO_ROOT, "server/migrations/runner.ts");

/** Tables declared in the Drizzle schema: `pgTable("table_name", { ... })`. */
function declaredTables(): Set<string> {
  const src = readFileSync(SCHEMA_FILE, "utf8");
  const found = new Set<string>();
  for (const m of src.matchAll(/pgTable\(\s*["'`]([A-Za-z0-9_]+)["'`]/g)) {
    found.add(m[1]);
  }
  return found;
}

/** Tables created by a reviewed migration: `CREATE TABLE [IF NOT EXISTS] table_name`. */
function migratedTables(): Set<string> {
  const src = readFileSync(RUNNER_FILE, "utf8");
  const found = new Set<string>();
  for (const m of src.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?([A-Za-z0-9_]+)["'`]?/gi)) {
    found.add(m[1]);
  }
  return found;
}

const declared = declaredTables();
const migrated = migratedTables();

// `schema_migrations` is the runner's own bookkeeping table, created by its bootstrap rather than
// by a migration, and is deliberately absent from the Drizzle schema. It is not a gap.
migrated.delete("schema_migrations");

const uncovered = [...declared].filter(t => !migrated.has(t)).sort();
const orphaned = [...migrated].filter(t => !declared.has(t)).sort();

const coveredCount = declared.size - uncovered.length;
const pct = declared.size === 0 ? 0 : Math.round((coveredCount / declared.size) * 100);

console.log("");
console.log("TRUST1-O8 — Schema-to-migration coverage");
console.log("═".repeat(78));
console.log(`  Declared in shared/schema.ts .................. ${declared.size} tables`);
console.log(`  Created by a reviewed migration .............. ${coveredCount} tables`);
console.log(`  NOT created by any reviewed migration ........ ${uncovered.length} tables`);
console.log(`  Table-level coverage (UPPER BOUND) ........... ${pct}%`);
console.log("═".repeat(78));

if (uncovered.length > 0) {
  console.log("");
  console.log(`GAP — ${uncovered.length} declared tables have no CREATE TABLE in any reviewed migration.`);
  console.log("These exist in a database only because `drizzle-kit push` created them from");
  console.log("shared/schema.ts. They have no reviewed provenance and cannot be rebuilt from");
  console.log("server/migrations/runner.ts alone:");
  console.log("");
  for (const t of uncovered) console.log(`    - ${t}`);
}

if (orphaned.length > 0) {
  console.log("");
  console.log(`NOTE — ${orphaned.length} tables are created by a migration but are NOT declared in`);
  console.log("shared/schema.ts. A table that exists in Postgres but not in the Drizzle schema is a");
  console.log("table `drizzle-kit push` will offer to DROP:");
  console.log("");
  for (const t of orphaned) console.log(`    - ${t}`);
}

console.log("");
console.log("This is a table-level check. Columns added declaratively without a migration are NOT");
console.log("detected, so true coverage is no better than the figure above.");
console.log("");

const strict = process.argv.includes("--strict");
if (strict && uncovered.length > 0) {
  console.error(`FAIL (--strict): ${uncovered.length} declared tables have no reviewed migration.`);
  process.exit(1);
}

process.exit(0);
