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
 * This script is for CI and local throwaway databases. It is NOT a production migration path:
 * production migration convergence is TRUST1-O8 (Phase 1), and `--force` here is safe only
 * because the target is a disposable, empty database that has never held a row of user data.
 */

import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function die(message: string): never {
  console.error(`\n[ci:db] FAILED — ${message}\n`);
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  die("DATABASE_URL is not set. CI must provide a throwaway database (a Postgres service container).");
}

// Refuse to run against anything that looks like a real database. This script pushes schema
// with --force; pointing it at production would be a data-loss event, and "it was obviously
// only ever meant for CI" is not a control.
const FORBIDDEN = ["neon.tech", "amazonaws.com", "render.com", "supabase"];
const hit = FORBIDDEN.find(h => url.includes(h));
if (hit && process.env.CI_ALLOW_REMOTE_DB !== "i-know-what-i-am-doing") {
  die(
    `DATABASE_URL points at a managed host (${hit}). This script runs \`drizzle-kit push --force\`\n` +
      `         and is only ever safe against a disposable, empty database.\n` +
      `         Refusing. This is TRUST1-O8 territory, not S10's.`,
  );
}

console.log("[ci:db] target:", url.replace(/:\/\/[^@]*@/, "://<redacted>@"));

// ── 1. Declarative schema ────────────────────────────────────────────────────
console.log("[ci:db] 1/2  drizzle-kit push  (tables from shared/schema.ts)");
try {
  execFileSync("npx", ["drizzle-kit", "push", "--force"], {
    cwd: REPO_ROOT,
    stdio: "inherit",
    env: process.env,
  });
} catch {
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

// ── 3. Boot-time seeds — the ones server/index.ts runs on every start ────────
// Imported from the same modules server/index.ts imports, not reimplemented. If the server
// needs them to function, a test database needs them to be a fair test of the server.
console.log("[ci:db] 3/4  boot-time seeds (template migration, ready meals, food + pantry knowledge)");
try {
  const { runTemplateMigration } = await import("../../server/template-migration.js");
  const { seedReadyMeals } = await import("../../server/lib/seed-ready-meals.js");
  const { seedFoodKnowledge } = await import("../../server/lib/seed-food-knowledge.js");
  const { seedPantryKnowledge } = await import("../../server/seeds/seed-pantry-knowledge.js");
  await runTemplateMigration();
  await seedReadyMeals();
  await seedFoodKnowledge();
  await seedPantryKnowledge();
} catch (err) {
  console.error(err);
  die("a boot-time seed failed.");
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
//   know1-residue -> test:know5-evidence-contract / test:knowledge-food-ownership
//                    Two suites REQUIRE the residue of KNOW1's historical bad import to exist,
//                    because they test that `reconcile` DEACTIVATES it. A cleanup test needs dirt
//                    to clean. The dev database supplies it by accident of history; a fresh one
//                    does not. See scripts/ci/seed-know1-residue.ts — it must run AFTER the
//                    knowledge seed, whose foods its rows point at.
const REFERENCE_SEEDS: ReadonlyArray<readonly [string, string]> = [
  ["additives", "server/seeds/run-additives-seed.ts"],
  ["knowledge", "server/seeds/seed-knowledge-registry.ts"],
  ["canonical", "server/seeds/seed-canonical-food.ts"],
  ["know1-residue (test fixture)", "scripts/ci/seed-know1-residue.ts"],
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
