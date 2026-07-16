/**
 * TRUST1-S10 — CI test-database setup
 * ===================================
 * Brings an EMPTY Postgres up to the schema the test suite expects, and fails loudly if it
 * cannot. 12 of the 65 suites in `npm test` need a database — and, importantly, that includes
 * ALL SIX TRUST1 security suites (S1, S2, S3, S3A, S5, S8/P8). Without a database, CI would
 * silently skip precisely the tests this programme exists to enforce.
 *
 * Two mechanisms build the schema, and both are needed. This script does not invent a third.
 *
 *   1. drizzle-kit push   — creates tables from shared/schema.ts (the declarative source).
 *   2. runMigrations()    — server/migrations/runner.ts, the ordered SQL migration list that
 *                           the server itself runs at startup (ALTER TABLEs, backfills).
 *                           This is the SAME function server/index.ts calls, imported, not
 *                           reimplemented — so a migration that would fail in production
 *                           fails here first.
 *
 * This script is for CI and local throwaway databases. It is NOT a production migration path.
 *
 * TRUST1-O8 UPDATE. S10 wrote its own denylist of managed hosts here, plus a
 * `CI_ALLOW_REMOTE_DB=i-know-what-i-am-doing` escape hatch. Both are gone. The check now lives in
 * ONE place — `scripts/db/schema-push-guard.ts`, the only module in the repository permitted to
 * invoke `drizzle-kit push` — and it fails closed with no override for a managed host. A second
 * copy of a safety check is a second thing to forget to update, and an escape hatch on the control
 * standing between a typo and irreversible data loss is not a control.
 */

import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { runGuardedSchemaPush, UnsafeSchemaTargetError } from "../db/schema-push-guard.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function die(message: string): never {
  console.error(`\n[ci:db] FAILED — ${message}\n`);
  process.exit(1);
}

// ── 1. Declarative schema ────────────────────────────────────────────────────
// The guard proves the target is disposable before a single DDL statement runs, and refuses
// outright if it cannot. CI's Postgres service container is on localhost, so it passes.
console.log("[ci:db] 1/4  drizzle-kit push  (tables from shared/schema.ts)");
try {
  runGuardedSchemaPush("build the CI test database (npm run ci:setup-db)");
} catch (err) {
  if (err instanceof UnsafeSchemaTargetError) {
    console.error(`\n${err.message}\n`);
    die("refusing to build a test database on top of a non-disposable one.");
  }
  die("drizzle-kit push failed. The schema in shared/schema.ts could not be applied.");
}

// ── 2. Ordered SQL migrations — the same ones the server runs at boot ────────
console.log("[ci:db] 2/4  runMigrations()  (server/migrations/runner.ts)");
try {
  const { runMigrations } = await import("../../server/migrations/runner.js");
  await runMigrations();
} catch (err) {
  console.error(err);
  die("runMigrations() failed. A migration that CI cannot apply is one production cannot apply either.");
}

// ── 3. Platform seeds — the ones `npm run seed:all` publishes ────────────────
// Imported from the same modules the declared seed runner imports, not reimplemented. If the
// server needs them to function, a test database needs them to be a fair test of the server.
//
// CONV1 WRITE-4: these used to be "the ones server/index.ts runs on every start". They are no
// longer run at boot by anything — that was an undeclared second publication mechanism — so this
// step is now what makes a test database resemble a provisioned one. The template backfill is
// gone from the list because it is retired outright: it authored a template per unlinked meal at
// boot, which is exactly the meals → meal_templates bridge Principle 7 forbids. Its rows were
// never fixtures the suite asserts on.
console.log("[ci:db] 3/4  platform seeds (ready meals, food + pantry knowledge)");
try {
  const { seedReadyMeals } = await import("../../server/lib/seed-ready-meals.js");
  const { seedFoodKnowledge } = await import("../../server/lib/seed-food-knowledge.js");
  const { seedPantryKnowledge } = await import("../../server/seeds/seed-pantry-knowledge.js");
  await seedReadyMeals();
  await seedFoodKnowledge();
  await seedPantryKnowledge();
} catch (err) {
  console.error(err);
  die("a platform seed failed.");
}

// ── 4. Reference-data seeds the TEST SUITE depends on ────────────────────────
// TEST FIXTURE — and the single most valuable thing this task discovered.
//
// `npm test` DOES NOT PASS on an empty database, and never has: `test:additives` does
// `SELECT ... FROM additives` and asserts on the rows, so on a fresh database it fails with
// "Detects E250 ❌ / Detects E252 ❌ / Detects E300 ❌" — not because detection is broken, but
// because the reference table is empty. Nobody knew, because nothing had ever run the suite
// against a database that wasn't the long-lived development one. That is precisely the class
// of hidden coupling a CI pipeline exists to expose, and it would have made the gate red on
// its first run with a failure that looks like a product bug and is not.
//
// Each seed below is idempotent and additive by its own contract, and each was added because a
// suite FAILED without it on an empty database — never speculatively.
//
//   additives   -> test:additives          ("Detects E250/E252/E300" — reads the additives table)
//   knowledge   -> test:knowledge-food-ownership  ("live=0 seed=610" — reads knowledge_* tables)
//   canonical   -> test:canonical-knowledge-binding / test:know4-graduated-food-reports
//
console.log("[ci:db] 4/4  reference seeds the TEST SUITE depends on");
//
// PUB1 — the `know1-residue` fixture is GONE, and this is where it used to be listed.
// It re-inserted the KNOW1 `plant-protein` defect into every CI database because two
// suites asserted the defect was still present: they tested that `reconcile` deactivates
// orphans, and a cleanup test needs dirt to clean. So CI supplied the dirt by keeping a
// known bug alive — the synchronisation bridge CPI1 §4.5 named.
//
// PUB1 published the knowledge registry and reconciled the residue away, and rewrote both
// suites to inject their own orphan inside a rolled-back transaction. The dirt is now the
// test's own, which is where a fixture belongs. Nothing here needs to reproduce a defect.
const REFERENCE_SEEDS: ReadonlyArray<readonly [string, string]> = [
  ["additives", "server/seeds/run-additives-seed.ts"],
  ["knowledge", "server/seeds/seed-knowledge-registry.ts"],
  ["canonical", "server/seeds/seed-canonical-food.ts"],
];

for (const [name, script] of REFERENCE_SEEDS) {
  console.log(`[ci:db]      seeding ${name}`);
  try {
    execFileSync("npx", ["tsx", script], { cwd: REPO_ROOT, stdio: "inherit", env: process.env });
  } catch {
    die(`the ${name} seed failed. The suite asserts against these rows and cannot pass without them.`);
  }
}

console.log("\n[ci:db] OK — schema, migrations, boot seeds and test fixtures are in place.");

// The pg pool opened by server/db.ts keeps the event loop alive; this script is a one-shot step.
process.exit(0);
