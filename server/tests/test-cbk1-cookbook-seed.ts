/**
 * CBK1 — Canonical Production Cookbook Seeding
 * ============================================
 * Verifies the properties the founding-cookbook seeder must have for it to be trusted with a
 * production database.
 *
 * The seeder is the ONE mechanism that puts the 500 THA founding recipes into any THA database
 * (scripts/import-tha-founding-cookbook-500.ts). Before CBK1 it refused to run against production
 * at all, so a fresh production database served an empty Cookbook and nothing sanctioned could fill
 * it (REL1, Blocker 1). It may now seed production — but only deliberately. These tests are what
 * "deliberately" means, made checkable.
 *
 * The guard tests are PURE — they classify connection strings, open no connection, and are the
 * reason this file is safe to run in CI with no database. The live-DB section is skipped without
 * DATABASE_URL, per the convention in test-canonical-food.ts.
 *
 * Run with: npm run test:cbk1-cookbook-seed
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyDatabaseTarget,
  isProductionTarget,
} from "../../scripts/db/database-target.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SEEDER = resolve(REPO_ROOT, "scripts/import-tha-founding-cookbook-500.ts");
const SOURCE = resolve(
  REPO_ROOT,
  "data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json",
);

const EXPECTED_RECIPES = 500;

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}`);
    if (detail) console.error(`         ${detail}`);
  }
}

function section(name: string) {
  console.log(`\n── ${name} ──`);
}

const PROD_URL = "postgresql://u:p@ep-cool-frost-123.eu-west-2.aws.neon.tech/thaprod";
const DEV_URL = "postgresql://u:p@helium/tha";
const CI_URL = "postgresql://postgres:postgres@postgres:5432/tha_test";

async function main() {
  console.log("\n=== CBK1 — Canonical Production Cookbook Seeding ===");

  // ─────────────────────────────────────────────────────────────────────────
  section("The seed target is classified, and it fails closed");

  assert(
    classifyDatabaseTarget(PROD_URL).kind === "managed",
    "a Neon connection string is classified as a managed (production) host",
  );
  assert(
    classifyDatabaseTarget(DEV_URL).kind === "disposable" &&
      classifyDatabaseTarget(CI_URL).kind === "disposable",
    "the Replit dev database and the CI service container are classified as disposable",
  );
  assert(
    classifyDatabaseTarget(undefined).kind === "missing" &&
      classifyDatabaseTarget("not-a-url").kind === "unparseable",
    "a missing or unparseable DATABASE_URL is neither disposable nor silently accepted",
  );
  assert(
    !classifyDatabaseTarget(PROD_URL).redacted.includes("p@") &&
      classifyDatabaseTarget(PROD_URL).redacted.includes("<redacted>"),
    "credentials are stripped before a target is ever printed",
  );

  // This is the hole CBK1 closed. The old guard keyed on NODE_ENV alone — but the shape of a real
  // release command is `DATABASE_URL="<prod url>" npx tsx ...`, with NODE_ENV unset. Under the old
  // guard that seeded production silently.
  assert(
    isProductionTarget(classifyDatabaseTarget(PROD_URL), undefined),
    "a managed host is production EVEN WHEN NODE_ENV is unset (the hole the old guard had)",
  );
  assert(
    isProductionTarget(classifyDatabaseTarget(DEV_URL), "production"),
    "NODE_ENV=production makes even a disposable host production",
  );
  assert(
    !isProductionTarget(classifyDatabaseTarget(DEV_URL), "development"),
    "a disposable host in development is not production",
  );
  assert(
    isProductionTarget(classifyDatabaseTarget("not-a-url"), undefined) &&
      isProductionTarget(classifyDatabaseTarget("postgresql://u:p@db.acme.io/x"), undefined),
    "a host that cannot be PROVEN disposable is treated as production — the guard fails closed",
  );

  // ─────────────────────────────────────────────────────────────────────────
  section("There is exactly one cookbook seeding mechanism");

  const seeder = readFileSync(SEEDER, "utf8");

  assert(
    seeder.includes("storage.createMeal(SYSTEM_USER_ID, payload)"),
    "inserts go through the canonical write funnel storage.createMeal (RECIPE_ACQUISITION §5)",
    "A raw db.insert into meals would be a second write path for recipe content.",
  );
  assert(
    !/db\s*\n?\s*\.insert\(meals\)/.test(seeder),
    "the seeder contains no raw insert into the meals table",
  );
  assert(
    seeder.includes('acquisitionLane: "tha_library"') &&
      seeder.includes('acquisitionType: "authored"') &&
      seeder.includes("acquisitionSourceKey: r.import_key"),
    "every seeded row carries canonical provenance (lane, type, source key)",
  );

  // ─────────────────────────────────────────────────────────────────────────
  section("Production cannot be seeded, or wiped, by accident");

  assert(
    seeder.includes("assertSeedTargetAllowed"),
    "the seeder gates every run through a single target guard",
  );
  assert(
    /if \(!allowProduction\)/.test(seeder) && seeder.includes("--production"),
    "seeding a production target requires an explicit --production flag",
  );
  assert(
    /if \(mode === "rollback"\)[\s\S]{0,400}REFUSING TO ROLL BACK/.test(seeder),
    "--rollback is refused against a production target",
  );
  assert(
    seeder.includes("There is no override for this") &&
      seeder.includes("never wipe prod data"),
    "the rollback refusal states it has NO override — no flag can delete 500 live recipes",
  );
  assert(
    seeder.includes("dryRun") && seeder.includes("--dry-run"),
    "a dry run can preview a production seed without writing (RELEASE.md Step 4 precedent)",
  );

  // ─────────────────────────────────────────────────────────────────────────
  section("Categories are resolved by name, not by a guessed id");

  assert(
    seeder.includes("resolveCategoryIds") && seeder.includes("CATEGORY_NAMES"),
    "categories are resolved from meal_categories BY NAME at run time",
    "Hard-coded ids 1-4 are true of a dev database only by insertion-order accident. On a fresh " +
      "production database they would silently file recipes under the wrong category.",
  );
  assert(
    !/breakfast:\s*1/.test(seeder),
    "the old hard-coded category id map is gone",
  );
  assert(
    seeder.includes("required meal categories are missing"),
    "a missing category is a loud refusal, not a silent miscategorisation",
  );

  // ─────────────────────────────────────────────────────────────────────────
  section("The recipe source is intact and its identities are unique");

  assert(existsSync(SOURCE), "the committed cookbook source exists (REL1 tracked it)");

  const source = JSON.parse(readFileSync(SOURCE, "utf8"));
  const recipes: Array<{ import_key: string; recipe_name: string }> = source.recipes ?? [];

  assert(
    recipes.length === EXPECTED_RECIPES,
    `the source holds exactly ${EXPECTED_RECIPES} recipes`,
    `Found ${recipes.length}.`,
  );

  const keys = new Set(recipes.map(r => r.import_key));
  assert(
    keys.size === EXPECTED_RECIPES,
    "every recipe has a unique import_key — its canonical identity",
    `${EXPECTED_RECIPES - keys.size} duplicate key(s).`,
  );
  assert(
    recipes.every(r => r.import_key.startsWith("tha_original:")),
    "every import_key sits in the canonical tha_original: key space",
  );

  // ─────────────────────────────────────────────────────────────────────────
  section("Canonical identity is enforced by the database, not merely intended");

  const runner = readFileSync(resolve(REPO_ROOT, "server/migrations/runner.ts"), "utf8");
  assert(
    runner.includes("meals_tha_original_source_key_uniq"),
    "a unique index on the founding cookbook's key space is a reviewed migration",
    "Without it, 'no duplicates' is a property of the script's care, not of the data.",
  );
  assert(
    runner.includes("2026-07-11_cbk1_cookbook_canonical_identity"),
    "the migration is registered in the reviewed migration list (the only sanctioned schema route)",
  );

  // ─────────────────────────────────────────────────────────────────────────
  section("The release process documents the canonical mechanism");

  const release = readFileSync(resolve(REPO_ROOT, "RELEASE.md"), "utf8");
  assert(
    release.includes("seed:cookbook"),
    "RELEASE.md names the canonical seeding command",
  );
  assert(
    release.includes("verify:cookbook-seed"),
    "RELEASE.md names the verification gate that proves the seed worked",
  );
  assert(
    !release.includes("Importer refuses when `NODE_ENV=production`"),
    "RELEASE.md no longer claims the importer refuses production — that statement is now false",
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Live database checks. Skipped without DATABASE_URL (convention: test-canonical-food.ts).
  section("Live database — the cookbook is seeded, once");

  if (!process.env.DATABASE_URL) {
    console.log("  (DATABASE_URL not set — skipping live DB checks)");
  } else {
    const pg = await import("pg");
    const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });
    try {
      const { verifyCookbookSeed } = await import("../../scripts/ci/verify-cookbook-seed.js");
      const checks = await verifyCookbookSeed(pool);

      for (const c of checks) {
        assert(c.status === "PASS", `[seed] ${c.name}`, c.detail);
      }

      // The property a re-run must preserve, asserted directly against the rows rather than
      // inferred from the seeder's own summary output.
      const { rows } = await pool.query<{ n: string }>(
        `SELECT COUNT(*) AS n FROM (
           SELECT acquisition_source_key
             FROM meals
            WHERE is_system_meal = true AND acquisition_source_key LIKE 'tha_original:%'
            GROUP BY acquisition_source_key
           HAVING COUNT(*) > 1
         ) d`,
      );
      assert(
        parseInt(rows[0].n, 10) === 0,
        "[seed] re-running the seed created no duplicate recipe",
        `${rows[0].n} import key(s) appear more than once.`,
      );
    } finally {
      await pool.end();
    }
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
