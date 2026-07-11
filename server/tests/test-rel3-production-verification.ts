/**
 * REL3 — Production Verification Convergence
 * ==========================================
 * Proves the properties `scripts/verify-prod.ts` must have to be trusted with the question it
 * answers: **is production actually the thing this code expects?**
 *
 * A verification script is a strange thing to test, because nobody notices when it is wrong. It
 * fails silently, in the safest-looking direction — it says PASS. That is exactly what happened:
 * the expected migration head was a hand-written string literal, `2026-06-18_ws0_knowledge_registry`,
 * and it went **20 migrations stale**. A production database stuck at that migration — with no
 * `auth_rate_limits` table (TRUST1-S5's shared rate-limit counter) and no
 * `meals_tha_original_source_key_uniq` index (CBK1's canonical cookbook identity) — was reported
 * by the release gate as **"Schema at head: PASS"**.
 *
 * So the central test here is not that the verifier passes. It is that **it fails when it should**:
 * the stale-database scenario below is the real historical defect, replayed, and it must now come
 * back FAIL. A gate that has never refused anything is a hope, not a control.
 *
 * The migration-state tests are PURE — they compare synthetic id sets and open no connection, so
 * the exact production gap that once slipped through is checkable in CI in milliseconds, without
 * anyone having to break a database to find out.
 *
 * Requires DATABASE_URL, as `npm test` already does (server/db.ts throws without it, and
 * test-trust1-s5-authentication-rate-limiting.ts imports it the same way). CI supplies an
 * ephemeral Postgres service container.
 *
 * Run with: npm run test:rel3-production-verification
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { MIGRATION_IDS, expectedMigrationHead } from "../migrations/runner.js";
import { compareMigrationState, verifyProduction, type Check } from "../../scripts/verify-prod.js";
import { classifyDatabaseTarget } from "../../scripts/db/database-target.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const VERIFY_PROD = resolve(REPO_ROOT, "scripts/verify-prod.ts");
const RUNNER = resolve(REPO_ROOT, "server/migrations/runner.ts");

/** The literal that was hard-coded, and stale, for 20 migrations. The defect, by name. */
const STALE_HEAD = "2026-06-18_ws0_knowledge_registry";

/** Two controls that a database stuck at STALE_HEAD would silently be missing. */
const TRUST1_S5_MIGRATION = "2026-07-11_trust1_s5_auth_rate_limits";
const CBK1_MIGRATION = "2026-07-11_cbk1_cookbook_canonical_identity";

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

async function main() {
  console.log("\n=== REL3 — Production Verification Convergence ===");

  const verifySrc = readFileSync(VERIFY_PROD, "utf8");
  const runnerSrc = readFileSync(RUNNER, "utf8");

  // The "no hard-coded head" assertions are about CODE, not prose. verify-prod.ts quotes the old
  // defective line verbatim in its header — documenting the defect is the opposite of committing
  // it, and a test that cannot tell the two apart would forbid explaining the bug it prevents.
  const verifyCode = verifySrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  // ───────────────────────────────────────────────────────────────────────────
  section("The expected head is DERIVED, and there is still exactly one migration owner");

  assert(
    !/expectedHead\s*=\s*["'`]/.test(verifyCode),
    "verify-prod.ts assigns no string literal as the expected migration head",
    "This is the defect verbatim: `const expectedHead = \"2026-06-18_ws0_knowledge_registry\"`. " +
      "A literal cannot be kept true; it can only be kept up to date, and it was not.",
  );
  assert(
    !verifyCode.includes(STALE_HEAD),
    "no migration-head literal survives anywhere in verify-prod.ts's executable code",
  );
  assert(
    /import\s*\{[^}]*expectedMigrationHead[^}]*\}\s*from\s*["'][^"']*migrations\/runner/.test(verifySrc),
    "verify-prod.ts imports the expected head from the canonical migration runner",
  );
  assert(
    /import\s*\{[^}]*MIGRATION_IDS[^}]*\}\s*from\s*["'][^"']*migrations\/runner/.test(verifySrc),
    "verify-prod.ts imports the full migration list from the canonical runner, not a copy of it",
  );

  // The requirement is a derived head, NOT a second migration system. If verify-prod.ts ever grows
  // its own list of migration ids, or learns to apply one, this is where we find out.
  assert(
    !/const\s+MIGRATIONS\s*[:=]/.test(verifyCode),
    "verify-prod.ts declares no migration list of its own — no second migration owner",
  );
  assert(
    !/INSERT\s+INTO\s+schema_migrations|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE/i.test(verifyCode),
    "verify-prod.ts writes no schema and records no migration — it is READ-ONLY",
    "Only server/migrations/runner.ts may touch a production schema (TRUST1-O8).",
  );

  assert(
    /export\s+const\s+MIGRATION_IDS/.test(runnerSrc) &&
      /export\s+function\s+expectedMigrationHead/.test(runnerSrc),
    "the canonical runner exports the accessors — the list stays where TRUST1-O8 and CBK1 read it",
  );
  assert(
    /const\s+expectedHead\s*=\s*expectedMigrationHead\(\)/.test(runnerSrc),
    "the runner's own parity log uses the SAME accessor — the runner and the verifier cannot disagree",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("The derived head is the real head");

  const head = expectedMigrationHead();

  assert(
    head === MIGRATION_IDS[MIGRATION_IDS.length - 1],
    "expectedMigrationHead() is the last entry in the append-only migration list",
    `Got "${head}".`,
  );
  assert(
    head !== STALE_HEAD,
    `the head has moved on from the stale literal (it is now "${head}", ${MIGRATION_IDS.length} migrations total)`,
  );
  assert(
    new Set(MIGRATION_IDS).size === MIGRATION_IDS.length,
    "every migration id is unique — the head is unambiguous",
  );
  assert(
    MIGRATION_IDS.includes(TRUST1_S5_MIGRATION) && MIGRATION_IDS.includes(CBK1_MIGRATION),
    "the TRUST1-S5 and CBK1 migrations are in the list the verifier now checks against",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("It fails honestly — the stale-production scenario, replayed");

  // THE REGRESSION TEST. This is the exact database the old script called "Schema at head: PASS".
  const staleIndex = MIGRATION_IDS.indexOf(STALE_HEAD);
  assert(staleIndex >= 0, `the historical stale head "${STALE_HEAD}" still exists in the list`);

  const staleDb = MIGRATION_IDS.slice(0, staleIndex + 1);
  const stale = compareMigrationState(staleDb);

  assert(
    !stale.atHead,
    "a production database stuck at the old hard-coded head is NOT at head (the false PASS is gone)",
    "This is the defect REL3 exists to close. If this assertion ever fails, the verifier is lying again.",
  );
  assert(
    stale.pending.includes(TRUST1_S5_MIGRATION),
    "the stale database is reported as missing TRUST1-S5's shared rate-limit counter",
  );
  assert(
    stale.pending.includes(CBK1_MIGRATION),
    "the stale database is reported as missing CBK1's canonical cookbook identity index",
  );
  assert(
    stale.pending.length === MIGRATION_IDS.length - staleDb.length && stale.pending.length > 0,
    `every unapplied migration is named, not just the newest (${stale.pending.length} pending)`,
  );
  assert(
    stale.furthestApplied === STALE_HEAD && stale.expectedHead === head,
    "the report states both where production actually is and where it should be",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("It fails honestly — the other real production gaps");

  const atHead = compareMigrationState([...MIGRATION_IDS]);
  assert(
    atHead.atHead && atHead.pending.length === 0 && atHead.unknown.length === 0,
    "a fully migrated database IS at head — the check still passes when it should",
  );

  const empty = compareMigrationState([]);
  assert(
    !empty.atHead && empty.pending.length === MIGRATION_IDS.length && empty.furthestApplied === null,
    "an empty database is not at head, and every migration is reported pending",
  );

  // The check the OLD comparison could never make. It asked "is the newest applied_at row equal to
  // my literal?" — so a database that had somehow applied the head but was missing a migration in
  // the MIDDLE of the list passed. A set comparison cannot be fooled that way.
  const holeIndex = Math.floor(MIGRATION_IDS.length / 2);
  const withHole = MIGRATION_IDS.filter((_, i) => i !== holeIndex);
  const holed = compareMigrationState(withHole);
  assert(
    !holed.atHead && holed.pending.length === 1 && holed.pending[0] === MIGRATION_IDS[holeIndex],
    "a database missing a migration in the MIDDLE of the list fails, even though it holds the head",
    "The old newest-row comparison passed this database. The set comparison names the hole.",
  );

  const ahead = compareMigrationState([...MIGRATION_IDS, "2027-01-01_migration_from_the_future"]);
  assert(
    !ahead.atHead && ahead.unknown.includes("2027-01-01_migration_from_the_future"),
    "a database AHEAD of this code is a divergence too — it ran a build this commit does not contain",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("The verifier asks about the Cookbook and the TRUST1 controls");

  assert(
    /verifyCookbookSeed/.test(verifySrc) &&
      /from\s+["'][^"']*verify-cookbook-seed/.test(verifySrc),
    "the cookbook check DELEGATES to CBK1's verifier — one owner of 'is the cookbook seeded?'",
    "REL1 Blocker 1 was production serving an EMPTY cookbook while verify-prod said PASS, " +
      "because verify-prod never asked.",
  );
  assert(
    !/EXPECTED_RECIPES|tha_original:/.test(verifySrc),
    "verify-prod.ts restates none of the cookbook's seeding rules — it calls the owner",
  );
  assert(
    verifySrc.includes("auth_rate_limits"),
    "the verifier checks TRUST1-S5's shared rate-limit counter exists on the database",
  );
  assert(
    verifySrc.includes("meals_tha_original_source_key_uniq"),
    "the verifier checks CBK1's canonical-identity index exists on the database",
  );
  // Honest gaps over fabrication: the controls a DB connection CANNOT witness must not be claimed.
  assert(
    /TRUST1-S1|SESSION_SECRET/.test(verifySrc) && /not\s+claimed|honest gap|HONEST GAP/i.test(verifySrc),
    "the verifier states plainly which TRUST1 controls it CANNOT witness, rather than implying a pass",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("Live database — the verifier reports reality, whatever reality is");

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("  (DATABASE_URL not set — skipping live checks)");
  } else {
    const target = classifyDatabaseTarget(url);
    const pool = new pg.Pool({
      connectionString: url,
      ...(target.kind === "disposable" ? {} : { ssl: { rejectUnauthorized: false } }),
    });

    try {
      const results: Check[] = await verifyProduction(pool);

      assert(results.length > 10, `the verifier ran and returned ${results.length} checks`);
      assert(
        results.every(r => r.status === "PASS" || r.status === "FAIL" || r.status === "WARN"),
        "every check reports a real status — none is silently absent",
      );

      const find = (needle: string) => results.filter(r => r.name.includes(needle));
      assert(find("Schema migration state").length === 1, "the schema migration state is checked");
      assert(find("Schema migration provenance").length === 1, "the schema migration provenance is checked");
      assert(find("Cookbook").length > 0, "the cookbook is checked (delegated to CBK1's verifier)");
      assert(find("TRUST1-S5").length === 1, "TRUST1-S5's rate-limit counter is checked");
      assert(find("CBK1 cookbook canonical identity").length === 1, "CBK1's identity index is checked");

      // ── The honesty invariants ───────────────────────────────────────────────
      // These do not assume this database is healthy. They assert the verifier's VERDICT matches
      // the database's actual STATE — which is the only property that makes a verifier worth
      // running. If the two ever disagree, the verifier is lying, in whichever direction.

      const { rows: applied } = await pool.query<{ id: string }>(
        `SELECT id FROM schema_migrations`,
      );
      const truth = compareMigrationState(applied.map(r => r.id));

      // Missing migrations are the FAIL: features that depend on them are broken.
      const migrationCheck = find("Schema migration state")[0];
      assert(
        (migrationCheck.status === "PASS") === (truth.pending.length === 0),
        `the migration verdict matches the database: reported ${migrationCheck.status}, actually ` +
          `${truth.pending.length} pending`,
        migrationCheck.detail,
      );
      assert(
        truth.pending.length === 0 || migrationCheck.status === "FAIL",
        "a database missing ANY reviewed migration is a FAIL — never a warning, never a pass",
      );

      // Unaccounted-for history is the WARN: nothing is missing, but the database ran a build
      // this commit does not contain. Surfaced loudly; not a release blocker.
      const provenanceCheck = find("Schema migration provenance")[0];
      assert(
        (provenanceCheck.status === "PASS") === (truth.unknown.length === 0),
        `the provenance verdict matches the database: reported ${provenanceCheck.status}, actually ` +
          `${truth.unknown.length} unknown`,
        provenanceCheck.detail,
      );

      const { rows: s5 } = await pool.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'auth_rate_limits'
         ) AS exists`,
      );
      const s5Check = find("TRUST1-S5")[0];
      assert(
        (s5Check.status === "PASS") === (s5[0].exists === true),
        "the TRUST1-S5 verdict matches whether auth_rate_limits actually exists",
        s5Check.detail,
      );

      const { rows: seeded } = await pool.query<{ n: string }>(
        `SELECT COUNT(*) AS n FROM meals
          WHERE is_system_meal = true AND acquisition_source_key LIKE 'tha_original:%'`,
      );
      const seededCount = parseInt(seeded[0].n, 10);
      const cookbookAllPass = find("Cookbook").every(c => c.status === "PASS");
      assert(
        cookbookAllPass === (seededCount === 500),
        `the cookbook verdict matches the database: ${seededCount} founding recipe(s) present, ` +
          `verifier says ${cookbookAllPass ? "PASS" : "FAIL"}`,
        "An empty cookbook must not pass. A complete one must not fail.",
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
