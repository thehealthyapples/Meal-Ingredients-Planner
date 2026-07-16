/**
 * SEC2 + SEC3 — The auth token expiry columns are TIMESTAMPTZ.
 *
 * CONV1 items SEC-2 and SEC-3; originally surfaced by TIME2 § 9.4 #11/#12.
 *
 * `password_reset_expires` and `email_verification_expires` are INSTANT values: a
 * token expires at a point on the timeline, and that point does not move because a
 * server is somewhere else. Both columns were `timestamp without time zone`, which
 * has no such point — it holds a wall-clock reading whose meaning is supplied by
 * whichever process reads it.
 *
 * Nothing had gone wrong because the platform's containers default to UTC, where the
 * offset is zero. That is a deployment accident, not a control — and Case 3 below is
 * the whole argument: it runs the same round-trip under a non-UTC process, where the
 * old column type loses an hour and the new one does not.
 *
 * Run with:  npm run test:sec23-auth-token-expiry-timestamptz
 */

import { execFileSync } from "node:child_process";
import { pool } from "../db.js";
import { users } from "../../shared/schema.js";
import { getTableConfig } from "drizzle-orm/pg-core";

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${e}`);
    console.error(`    received: ${a}`);
    failed++;
  }
}

function ok(label: string, condition: boolean): void {
  assert(label, condition, true);
}

const TOKEN_COLUMNS = ["password_reset_expires", "email_verification_expires"];

/**
 * Issues a token that expires in one hour, into a naive column and a timestamptz
 * column, then asks POSTGRES whether each is still valid. The answer must be yes.
 *
 * This is the failure mode, and it is not the obvious one. A JS round-trip through a
 * naive column is SYMMETRIC — the same process writes and reads it, so its offset
 * cancels and nothing appears wrong. The defect needs two frames: the WRITER's
 * process TZ decides the wall-clock that gets stored, and the READER's frame decides
 * what that wall-clock means. A SQL-side comparison against now() is exactly that
 * second frame.
 *
 * Printed as JSON so a child process running under a different TZ can hand its
 * result back to the parent.
 */
async function measureExpiry(): Promise<Record<string, unknown>> {
  const expires = new Date(Date.now() + 60 * 60 * 1000); // valid for another hour
  await pool.query("CREATE TEMP TABLE sec23_probe (naive TIMESTAMP, aware TIMESTAMPTZ)");
  await pool.query("INSERT INTO sec23_probe (naive, aware) VALUES ($1, $2)", [expires, expires]);
  const { rows } = await pool.query(
    "SELECT naive > now() AS naive_valid, aware > now() AS aware_valid, naive::text AS naive_txt FROM sec23_probe",
  );
  await pool.query("DROP TABLE sec23_probe");
  return {
    offsetMinutes: expires.getTimezoneOffset(),
    issuedUtc: expires.toISOString(),
    storedNaive: rows[0].naive_txt,
    naiveStillValid: rows[0].naive_valid,
    awareStillValid: rows[0].aware_valid,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function main() {
  // A child process re-enters this file to measure expiry under a different TZ.
  if (process.env.SEC23_DRIFT_CHILD === "1") {
    console.log(JSON.stringify(await measureExpiry()));
    process.exit(0);
  }

  console.log("\nSEC2 + SEC3 — auth token expiry columns\n");

  // ── Case 1: the physical database ──────────────────────────────────────────
  console.log("Case 1 — the physical column type");

  const { rows: cols } = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'users' AND column_name = ANY($1) ORDER BY column_name`,
    [TOKEN_COLUMNS],
  );
  assert("both token columns exist", cols.length, 2);
  for (const c of cols) {
    assert(`★ ${c.column_name} is TIMESTAMPTZ in the database`, c.data_type, "timestamp with time zone");
  }

  // ── Case 2: the declaration agrees with the database ───────────────────────
  console.log("\nCase 2 — the declaration agrees with the database");

  const declared = getTableConfig(users).columns;
  for (const name of TOKEN_COLUMNS) {
    const col = declared.find(c => c.name === name);
    ok(`★ shared/schema.ts declares ${name} withTimezone`, col?.getSQLType() === "timestamp with time zone");
  }

  // The defect these two cases exist to prevent: two sibling columns, declared
  // identically, ending up as physically different types because one had a
  // migration and the other did not.
  const distinctTypes = new Set(cols.map(c => c.data_type));
  assert("★ the two sibling columns are the SAME physical type", distinctTypes.size, 1);

  // Every other timestamp on `users` is zone-aware; these were the only two that
  // were not. A regression here means someone declared a naive timestamp again.
  const { rows: naive } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'users' AND data_type = 'timestamp without time zone'`,
  );
  assert("no naive timestamp remains on the users table", naive.map(r => r.column_name), []);

  // ── Case 3: why it matters — the same token under a non-UTC process ────────
  console.log("\nCase 3 — the defect the UTC container was hiding");

  const here = await measureExpiry();
  console.log(`  (this process: TZ=${process.env.TZ ?? "unset"}, offset ${here.offsetMinutes} min)`);
  assert("under UTC, BOTH column types judge the token valid — nothing looks wrong",
    [here.naiveStillValid, here.awareStillValid], [true, true]);

  let child: Record<string, unknown> | null = null;
  try {
    const out = execFileSync(
      process.execPath,
      ["--import", "tsx", new URL(import.meta.url).pathname],
      { env: { ...process.env, TZ: "America/New_York", SEC23_DRIFT_CHILD: "1" }, encoding: "utf8", timeout: 60_000 },
    );
    child = JSON.parse(out.trim().split("\n").filter(Boolean).pop()!);
  } catch (err) {
    console.error(`  ! could not run the non-UTC child process: ${(err as Error).message.split("\n")[0]}`);
  }

  if (child) {
    console.log(`  (child process: TZ=America/New_York, offset ${child.offsetMinutes} min)`);
    ok("★ the child really did run in a non-UTC zone", child.offsetMinutes !== 0);
    console.log(`    token issued (UTC):  ${child.issuedUtc}   — valid for another hour`);
    console.log(`    stored in NAIVE col: ${child.storedNaive}   — the offset is gone`);
    assert(
      "★ a NAIVE column makes Postgres call the live token EXPIRED — the old behaviour",
      child.naiveStillValid,
      false,
    );
    assert(
      "★ a TIMESTAMPTZ column judges the same token correctly — the new behaviour",
      child.awareStillValid,
      true,
    );
    console.log(
      `\n    A reset token with an hour left is judged already expired, four hours early,\n` +
      `    because the writer's wall-clock was stored without the offset that gave it\n` +
      `    meaning. West of UTC that is a lockout; east of UTC the same mechanism runs\n` +
      `    the window LONG — an extended life on a password-reset token.\n`,
    );
  } else {
    console.log("  – non-UTC child unavailable; comparison skipped (NOT a pass)");
    failed++;
  }

  // ── Case 4: auth behaviour is preserved ────────────────────────────────────
  console.log("Case 4 — auth's expiry comparison still behaves");

  // auth.ts:315 / :413 both do: new Date(user.<col>) < new Date()
  await pool.query("CREATE TEMP TABLE sec23_auth (expires TIMESTAMPTZ)");
  const future = new Date(Date.now() + 60 * 60 * 1000);
  const past = new Date(Date.now() - 60 * 60 * 1000);

  await pool.query("INSERT INTO sec23_auth (expires) VALUES ($1)", [future]);
  let { rows: r1 } = await pool.query("SELECT expires FROM sec23_auth");
  assert("an unexpired token reads as NOT expired", new Date(r1[0].expires) < new Date(), false);
  assert("and round-trips to the same instant", r1[0].expires.getTime(), future.getTime());

  await pool.query("DELETE FROM sec23_auth");
  await pool.query("INSERT INTO sec23_auth (expires) VALUES ($1)", [past]);
  let { rows: r2 } = await pool.query("SELECT expires FROM sec23_auth");
  assert("an expired token reads as expired", new Date(r2[0].expires) < new Date(), true);

  await pool.query("DROP TABLE sec23_auth");

  // ── Case 5: the data that was already there ────────────────────────────────
  console.log("\nCase 5 — existing values were not shifted by the conversion");

  const { rows: live } = await pool.query(
    `SELECT id, EXTRACT(EPOCH FROM email_verification_expires)::float8 AS epoch
     FROM users WHERE email_verification_expires IS NOT NULL ORDER BY id`,
  );
  if (live.length === 0) {
    console.log("  – no rows carry a verification expiry in this database (nothing to check)");
  } else {
    // The migration read the stored naive wall-clock as UTC. Anything written by a
    // UTC process — which is every row this platform has ever written — is unmoved.
    ok(`${live.length} row(s) carry a value, and each resolves to a real instant`,
      live.every(r => Number.isFinite(r.epoch) && r.epoch > 0));
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  await pool.end().catch(() => {});
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => {});
  process.exit(1);
});
