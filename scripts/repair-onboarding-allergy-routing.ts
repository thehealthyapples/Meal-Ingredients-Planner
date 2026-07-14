/**
 * SURF1B3 — live-data audit and repair: allergies stored only as soft exclusions.
 *
 *   npx tsx scripts/repair-onboarding-allergy-routing.ts            # audit (default, read-only)
 *   npx tsx scripts/repair-onboarding-allergy-routing.ts --apply    # repair, writing a manifest
 *   npx tsx scripts/repair-onboarding-allergy-routing.ts --revert <manifest>
 *
 * ── What it repairs ──────────────────────────────────────────────────────────
 * Onboarding wrote every declared allergy to `user_preferences.excluded_ingredients`
 * — a soft preference the meal safety gate never reads. Any household that declared
 * an allergy there, and never afterwards edited their Profile, carries a safety fact
 * in a preference field.
 *
 * ── The safe-to-promote criterion ────────────────────────────────────────────
 * Delegated *entirely* to `promoteSoftAllergies()` in `shared/onboarding-restrictions.ts`
 * — the same function the live onboarding write door uses. This script contains no rule
 * of its own, so the migration and the runtime cannot disagree about what an allergy is.
 * A value moves only when the canonical restriction library can enforce it and the
 * household's hard-restriction owner does not already hold it.
 *
 * `mushrooms` is not an allergy the library knows; it stays exactly where it is. That
 * is the point of the criterion, not a shortcoming of it.
 *
 * ── Idempotent · reversible · lossless ───────────────────────────────────────
 * · IDEMPOTENT — after a run, every promoted value is held by the hard owner, so the
 *   criterion no longer matches it. A second run is a no-op and says so.
 * · REVERSIBLE — every write records the user's exact before/after arrays in a manifest.
 *   `--revert` restores them verbatim, and refuses if a row has changed since.
 * · LOSSLESS — nothing is deleted. A promoted value MOVES from the soft list to the hard
 *   one; an unenforceable preference is never touched. Enforcement can only strengthen:
 *   the safety gate begins to see the allergen, the planner (which already treated the
 *   soft list as hard) sees the same set as before, and the Companion is told "never
 *   violate this" where it was told "try to avoid".
 */
import { pool } from "../server/db";
import { promoteSoftAllergies } from "../shared/onboarding-restrictions";
import { isEnforceableRestriction } from "../shared/restrictions/restriction-resolver";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { dirname } from "path";

interface UserRow {
  id: number;
  diet_restrictions: string[] | null;
  excluded_ingredients: string[] | null;
}

interface RepairRecord {
  userId: number;
  before: { dietRestrictions: string[]; excludedIngredients: string[] };
  after: { dietRestrictions: string[]; excludedIngredients: string[] };
  promoted: string[];
}

interface Manifest {
  workstream: "SURF1B3";
  appliedAt: string;
  repairs: RepairRecord[];
}

async function loadUsers(): Promise<UserRow[]> {
  const { rows } = await pool.query<UserRow>(`
    SELECT u.id, u.diet_restrictions, p.excluded_ingredients
    FROM users u
    LEFT JOIN user_preferences p ON p.user_id = u.id
    WHERE p.excluded_ingredients IS NOT NULL
      AND array_length(p.excluded_ingredients, 1) > 0
    ORDER BY u.id
  `);
  return rows;
}

/** The repair set. Pure — computed from the canonical routing rule, writes nothing. */
function planRepairs(rows: UserRow[]): RepairRecord[] {
  const repairs: RepairRecord[] = [];
  for (const row of rows) {
    const before = {
      dietRestrictions: row.diet_restrictions ?? [],
      excludedIngredients: row.excluded_ingredients ?? [],
    };
    const routing = promoteSoftAllergies({
      softExclusions: before.excludedIngredients,
      hardRestrictions: before.dietRestrictions,
    });
    if (routing.noop) continue;
    repairs.push({
      userId: row.id,
      before,
      after: {
        dietRestrictions: [...before.dietRestrictions, ...routing.promote],
        excludedIngredients: routing.remainingSoft,
      },
      promoted: routing.promote,
    });
  }
  return repairs;
}

async function audit(rows: UserRow[], repairs: RepairRecord[]) {
  console.log(`\n── SURF1B3 · live-data audit ────────────────────────────────────\n`);
  console.log(`  ${rows.length} user(s) carry any excluded ingredient.\n`);

  const distinct = new Map<string, number>();
  for (const r of rows) for (const v of r.excluded_ingredients ?? []) distinct.set(v, (distinct.get(v) ?? 0) + 1);

  console.log(`  distinct values in user_preferences.excluded_ingredients:`);
  for (const [v, n] of [...distinct.entries()].sort((a, b) => b[1] - a[1])) {
    const enforceable = isEnforceableRestriction(v);
    console.log(
      `    ${JSON.stringify(v).padEnd(14)} ×${String(n).padEnd(3)}` +
        `  ${enforceable ? "ENFORCEABLE — a safety fact" : "not enforceable — a preference, and it stays one"}`,
    );
  }

  console.log(`\n  ${repairs.length} user(s) hold an allergy ONLY as a soft exclusion.\n`);
  for (const r of repairs) {
    console.log(`    user ${r.userId}`);
    console.log(`      soft ${JSON.stringify(r.before.excludedIngredients)} → ${JSON.stringify(r.after.excludedIngredients)}`);
    console.log(`      hard ${JSON.stringify(r.before.dietRestrictions)} → ${JSON.stringify(r.after.dietRestrictions)}`);
  }
  if (repairs.length === 0) {
    console.log(`    Nothing to repair. Every enforceable value in the soft list is already`);
    console.log(`    held by its hard owner, and every value that is not is a genuine preference.\n`);
  }
}

async function apply(repairs: RepairRecord[]): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `scripts/data-repairs/surf1b3-onboarding-allergy-routing-${stamp}.json`;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const r of repairs) {
      await client.query(`UPDATE users SET diet_restrictions = $1 WHERE id = $2`, [
        r.after.dietRestrictions,
        r.userId,
      ]);
      await client.query(`UPDATE user_preferences SET excluded_ingredients = $1 WHERE user_id = $2`, [
        r.after.excludedIngredients,
        r.userId,
      ]);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  const manifest: Manifest = { workstream: "SURF1B3", appliedAt: new Date().toISOString(), repairs };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(manifest, null, 2));
  console.log(`\n  ✓ ${repairs.length} user(s) repaired. Manifest: ${path}`);
  console.log(`    Revert with: npx tsx scripts/repair-onboarding-allergy-routing.ts --revert ${path}\n`);
  return path;
}

async function revert(manifestPath: string) {
  const manifest: Manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  console.log(`\n── SURF1B3 · revert ${manifest.repairs.length} repair(s) from ${manifest.appliedAt} ──\n`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const r of manifest.repairs) {
      // Refuse to clobber a row that has moved on since the repair. A revert that
      // overwrites a household's later edit is a worse defect than the one it undoes.
      const { rows } = await client.query<UserRow>(
        `SELECT u.id, u.diet_restrictions, p.excluded_ingredients
           FROM users u LEFT JOIN user_preferences p ON p.user_id = u.id WHERE u.id = $1`,
        [r.userId],
      );
      const now = rows[0];
      const same =
        JSON.stringify(now?.diet_restrictions ?? []) === JSON.stringify(r.after.dietRestrictions) &&
        JSON.stringify(now?.excluded_ingredients ?? []) === JSON.stringify(r.after.excludedIngredients);
      if (!same) {
        console.log(`    user ${r.userId} — SKIPPED: the row has changed since the repair.`);
        continue;
      }
      await client.query(`UPDATE users SET diet_restrictions = $1 WHERE id = $2`, [
        r.before.dietRestrictions,
        r.userId,
      ]);
      await client.query(`UPDATE user_preferences SET excluded_ingredients = $1 WHERE user_id = $2`, [
        r.before.excludedIngredients,
        r.userId,
      ]);
      console.log(`    user ${r.userId} — reverted.`);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  console.log();
}

async function main() {
  const args = process.argv.slice(2);
  const revertIdx = args.indexOf("--revert");

  if (revertIdx !== -1) {
    const path = args[revertIdx + 1];
    if (!path) throw new Error("--revert requires a manifest path");
    await revert(path);
    await pool.end();
    return;
  }

  const rows = await loadUsers();
  const repairs = planRepairs(rows);
  await audit(rows, repairs);

  if (args.includes("--apply")) {
    if (repairs.length === 0) {
      console.log(`  --apply: nothing to do. No write was made, and no manifest written.\n`);
    } else {
      await apply(repairs);
    }
  } else if (repairs.length > 0) {
    console.log(`  Read-only. Re-run with --apply to repair.\n`);
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
