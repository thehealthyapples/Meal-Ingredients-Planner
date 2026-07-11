/**
 * REL3 — Production Verification
 * ==============================
 * Answers one question about a live database, honestly: **is production actually the thing this
 * code expects it to be?**
 *
 * It is READ-ONLY. It opens a connection, runs SELECTs, and writes nothing — which is what makes
 * it safe to point at production, and the whole point: production does not get to mark its own
 * homework.
 *
 * THE DEFECT THIS SCRIPT WAS BUILT ON (and why REL3 exists)
 * --------------------------------------------------------
 * Until REL3 this file carried its own copy of the expected migration head, as a string literal:
 *
 *     const expectedHead = "2026-06-18_ws0_knowledge_registry";   // hand-updated. Never was.
 *
 * That literal was **20 migrations stale**. The consequences were not cosmetic:
 *
 *   - Against a *correctly migrated* production database it printed **FAIL** — so the one check
 *     that could have caught a real schema gap had been crying wolf for weeks, and a release
 *     operator's rational response was to ignore it.
 *   - Against a database *stuck 20 migrations back* it printed **PASS — "Schema at head"** —
 *     while `auth_rate_limits` (TRUST1-S5's shared rate-limit counter) and
 *     `meals_tha_original_source_key_uniq` (CBK1's canonical cookbook identity) were both absent.
 *     **A false PASS on a real production gap** is the failure this script exists to prevent, and
 *     it was the failure this script committed.
 *
 * The fix is not a fresher literal. It is **no literal**: the expected state is derived from
 * `server/migrations/runner.ts` — the canonical migration runner and the only sanctioned route to
 * a production schema (TRUST1-O8). This file therefore cannot go stale. It is not a second
 * migration owner: it applies nothing, records nothing, orders nothing. It reads the list and
 * compares.
 *
 * WHAT IT VERIFIES
 * ----------------
 *   1. MIGRATION STATE   — every reviewed migration is applied, and nothing else is. Derived,
 *                          set-based (not "is the newest row the one I hard-coded?"), so a
 *                          database missing a migration in the MIDDLE of the list fails too.
 *   2. COOKBOOK SEED     — delegated wholesale to `verifyCookbookSeed()` (CBK1). Its checks are
 *                          not restated here; there is one owner of "is the cookbook seeded?".
 *   3. TRUST1 CONTROLS   — the ones a database can actually witness (see the honest gap below).
 *   4. SCHEMA + DATA     — the release-critical tables, columns and invariants.
 *
 * THE HONEST GAP — what a database connection CANNOT tell you
 * -----------------------------------------------------------
 * Most TRUST1 controls are not observable from here and are **not claimed** by this script:
 * TRUST1-S1 (SESSION_SECRET fails closed), S2 (secure production cookies), S3/S3A (route guards
 * and IDOR), S8/P8 (log redaction) are environment and HTTP-layer facts. They are enforced by
 * their own suites in `npm test` and by a human in the Render dashboard. A PASS here says nothing
 * about them, and this script does not imply otherwise. What it *can* witness — the schema those
 * controls need in order to work at all — it witnesses.
 *
 * Usage:
 *   npm run verify:prod                                  # against DATABASE_URL
 *   DATABASE_URL="<prod neon url>" npm run verify:prod   # against production (read-only)
 *
 * Exit 0 = production matches this code. Exit 1 = it does not, and the reason is printed.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

import { expectedMigrationHead, MIGRATION_IDS } from "../server/migrations/runner.js";
import { classifyDatabaseTarget } from "./db/database-target.js";
import { verifyCookbookSeed } from "./ci/verify-cookbook-seed.js";

export interface Check {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
}

// ─── Migration state — a pure comparison, so it can be tested without a database ─────────────

export interface MigrationState {
  /** True only when every reviewed migration is applied and no unreviewed one is. */
  atHead: boolean;
  /** What this code expects — derived from the canonical runner, never hand-written. */
  expectedHead: string;
  /** The furthest point in the code's own order that the database has actually reached. */
  furthestApplied: string | null;
  /** In the code, not in the database. Production is BEHIND by these. */
  pending: string[];
  /** In the database, not in the code. Production is AHEAD — it ran code that no longer exists. */
  unknown: string[];
}

/**
 * Compare what a database has applied against what the code says exists.
 *
 * Set-based on purpose. The old check asked "is the newest `applied_at` row equal to a literal?",
 * which a database missing a migration in the middle of the list passes trivially. This asks the
 * question that actually matters — *is anything missing, anywhere* — and answers it in both
 * directions, because a database that is AHEAD of the code (it ran a build that was later rolled
 * back) is just as much a divergence as one that is behind, and rather more alarming.
 */
export function compareMigrationState(
  appliedIds: readonly string[],
  codeIds: readonly string[] = MIGRATION_IDS,
): MigrationState {
  const applied = new Set(appliedIds);
  const known = new Set(codeIds);

  const pending = codeIds.filter(id => !applied.has(id));
  const unknown = appliedIds.filter(id => !known.has(id));

  // The furthest point reached in the CODE's order — not the database's `applied_at` order, which
  // reflects when rows landed rather than where the schema actually is.
  let furthestApplied: string | null = null;
  for (const id of codeIds) {
    if (applied.has(id)) furthestApplied = id;
  }

  return {
    atHead: pending.length === 0 && unknown.length === 0,
    expectedHead: codeIds[codeIds.length - 1] ?? "(none)",
    furthestApplied,
    pending,
    unknown,
  };
}

/** Render at most `n` ids for an error message, telling the truth about how many were elided. */
function sample(ids: readonly string[], n = 5): string {
  const shown = ids.slice(0, n).join(", ");
  return ids.length > n ? `${shown}, … and ${ids.length - n} more` : shown;
}

// ─── The verification ────────────────────────────────────────────────────────────────────────

/**
 * Run every production check against an open pool and return the results.
 *
 * Exported so a test can drive the real checks rather than re-implement them — the same shape
 * `verifyCookbookSeed()` uses, and for the same reason: one owner of what "verified" means.
 */
export async function verifyProduction(pool: Pool): Promise<Check[]> {
  const results: Check[] = [];

  const pass = (name: string, detail: string) => results.push({ name, status: "PASS", detail });
  const fail = (name: string, detail: string) => results.push({ name, status: "FAIL", detail });
  const warn = (name: string, detail: string) => results.push({ name, status: "WARN", detail });

  /**
   * Run one check in isolation. A thrown error becomes that check's FAIL, not the whole script's.
   *
   * Before REL3 a single missing table (`SELECT … FROM planner_weeks` on a database where it does
   * not exist) aborted the run with "Verify script fatal error" and reported NOTHING about the
   * other twelve checks — the state you are most likely to be in on a fresh or broken production
   * database is precisely the state the script refused to describe.
   */
  const guard = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err: any) {
      fail(name, `Check could not run: ${err?.message ?? err}`);
    }
  };

  const tableExists = async (table: string): Promise<boolean> => {
    const { rows } = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
       ) AS exists`,
      [table],
    );
    return rows[0]?.exists === true;
  };

  const columnsOf = async (table: string): Promise<string[]> => {
    const { rows } = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    );
    return rows.map(r => r.column_name);
  };

  // ── 1. Schema migration state (derived from the canonical runner) ──────────────────────────
  await guard("Schema migration state", async () => {
    if (!(await tableExists("schema_migrations"))) {
      fail(
        "Schema migration state",
        "No `schema_migrations` table — the canonical migration runner has NEVER run against " +
          "this database. Whatever schema exists here was not built by a reviewed migration.",
      );
      return;
    }

    const { rows } = await pool.query<{ id: string }>(`SELECT id FROM schema_migrations`);
    const state = compareMigrationState(rows.map(r => r.id));

    // ── Is production missing anything this code needs? ──────────────────────────────────────
    // This is the FAIL. A migration in the code but not in the database means the tables, columns
    // and indexes that migration creates ARE NOT THERE, and the features that depend on them are
    // broken for households right now.
    if (state.pending.length === 0) {
      pass(
        "Schema migration state",
        `At head: ${state.expectedHead} (all ${MIGRATION_IDS.length} reviewed migrations applied)`,
      );
    } else {
      fail(
        "Schema migration state",
        `${state.pending.length} of ${MIGRATION_IDS.length} reviewed migration(s) are NOT applied — ` +
          `this database is BEHIND this code. Furthest applied: ${state.furthestApplied ?? "(none)"}; ` +
          `expected head: ${state.expectedHead}. Missing: ${sample(state.pending)}. ` +
          "The runner applies these at boot (server/index.ts) — deploying this commit should clear it.",
      );
    }

    // ── Does production carry history this code does not have? ───────────────────────────────
    // Deliberately a WARN, not a FAIL, and the distinction is the point. Nothing this code needs
    // is missing, so no feature is broken — but the database ran a build this commit does not
    // contain, and that is never nothing. It means either a migration was REMOVED from the
    // append-only list after it had been applied (the list's own header forbids exactly this), or
    // this database is genuinely ahead of the commit you are about to deploy.
    //
    // The verifier cannot tell those two apart, so it does not guess. It names the ids and makes
    // a human look. What it will not do is fail the release over an irreversible historical fact
    // nobody can safely undo — a gate that blocks every release forever is a gate that gets
    // bypassed, and then it is protecting nothing.
    if (state.unknown.length === 0) {
      pass(
        "Schema migration provenance",
        "Every applied migration is one this code contains — the database's history is accounted for",
      );
    } else {
      warn(
        "Schema migration provenance",
        `${state.unknown.length} migration(s) are recorded here but do NOT exist in this code: ` +
          `${sample(state.unknown)}. Either they were retired from the append-only list after being ` +
          "applied, or this database ran a newer build than the one you are deploying. " +
          "READ THIS — do not deploy over it until you know which.",
      );
    }
  });

  // ── 2. Cookbook seed (CBK1) — delegated, never restated ────────────────────────────────────
  // `verifyCookbookSeed()` is the single owner of "is the founding cookbook correctly seeded?".
  // REL1 Blocker 1 was a production database serving an EMPTY cookbook while this script said
  // PASS, because this script never asked. It asks now — by calling the owner, not by copying it.
  await guard("Cookbook seed", async () => {
    for (const c of await verifyCookbookSeed(pool)) {
      results.push({ name: `Cookbook — ${c.name}`, status: c.status, detail: c.detail });
    }
  });

  // ── 3. TRUST1 controls a database can witness ──────────────────────────────────────────────

  // TRUST1-S5 — the shared authentication rate-limit counter. THA runs multiple instances, so the
  // limit lives in Postgres rather than in a process. No table ⇒ no shared counter ⇒ the login
  // rate limit is not being enforced as configured, however green the S5 suite is in CI.
  await guard("TRUST1-S5 auth rate limiting", async () => {
    if (!(await tableExists("auth_rate_limits"))) {
      fail(
        "TRUST1-S5 auth rate limiting",
        "`auth_rate_limits` table missing — the shared rate-limit counter does not exist on this " +
          "database, so authentication rate limits are NOT enforced across instances " +
          "(migration 2026-07-11_trust1_s5_auth_rate_limits has not applied).",
      );
      return;
    }
    const cols = await columnsOf("auth_rate_limits");
    const missing = ["key", "hits", "expires_at"].filter(c => !cols.includes(c));
    if (missing.length === 0) {
      pass("TRUST1-S5 auth rate limiting", "Shared rate-limit counter present with its required columns");
    } else {
      fail("TRUST1-S5 auth rate limiting", `auth_rate_limits exists but is missing: ${missing.join(", ")}`);
    }
  });

  // CBK1 — canonical cookbook identity, enforced by the database rather than by the seeder's care.
  // Without this index a duplicate founding recipe is a silent, permanent, globally-visible defect
  // (system meals are shown to every household).
  await guard("CBK1 cookbook canonical identity", async () => {
    const { rows } = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_indexes
          WHERE schemaname = 'public' AND indexname = 'meals_tha_original_source_key_uniq'
       ) AS exists`,
    );
    if (rows[0]?.exists) {
      pass(
        "CBK1 cookbook canonical identity",
        "Unique index meals_tha_original_source_key_uniq present — a duplicate founding recipe is impossible",
      );
    } else {
      fail(
        "CBK1 cookbook canonical identity",
        "Unique index meals_tha_original_source_key_uniq MISSING — nothing prevents the same founding " +
          "recipe existing twice for every household (migration 2026-07-11_cbk1_cookbook_canonical_identity " +
          "has not applied).",
      );
    }
  });

  // ── 4. Release-critical schema ─────────────────────────────────────────────────────────────

  const requiredColumns: Array<{ label: string; table: string; columns: string[]; hint: string }> = [
    {
      label: "pantry_ingredient_knowledge schema",
      table: "pantry_ingredient_knowledge",
      columns: [
        "ingredient_key", "supports", "highlights", "why_it_matters", "good_to_know",
        "how_to_choose", "tags", "last_enriched_at", "enrichment_source", "enrichment_version",
        "is_locked", "created_at",
      ],
      hint: "migration 2026-04-18_pantry_ingredient_knowledge",
    },
    {
      label: "shopping_list resolution columns",
      table: "shopping_list",
      columns: [
        "original_text", "canonical_name", "subcategory", "resolution_state",
        "review_reason", "review_suggestions",
      ],
      hint: "migration 2026-04-12_item_resolution_layer",
    },
    {
      label: "planner_entries columns",
      table: "planner_entries",
      columns: ["position", "adaptation_result", "guest_eaters", "original_meal_id_before_variant"],
      hint: "migrations 2026-04-16 / 2026-04-23 / 2026-05-18",
    },
    {
      label: "meals variant columns",
      table: "meals",
      columns: ["is_household_safe_variant", "household_safe_for", "variant_kind", "show_in_cookbook"],
      hint: "migration 2026-05-18_variant_kind_cookbook_visibility",
    },
  ];

  for (const spec of requiredColumns) {
    await guard(spec.label, async () => {
      if (!(await tableExists(spec.table))) {
        fail(spec.label, `Table \`${spec.table}\` does not exist — ${spec.hint} has not applied`);
        return;
      }
      const cols = await columnsOf(spec.table);
      const missing = spec.columns.filter(c => !cols.includes(c));
      if (missing.length === 0) {
        pass(spec.label, `\`${spec.table}\`: all ${spec.columns.length} required columns present`);
      } else {
        fail(spec.label, `\`${spec.table}\` is missing: ${missing.join(", ")} — ${spec.hint} has not applied`);
      }
    });
  }

  const requiredTables: Array<{ label: string; table: string; hint: string }> = [
    { label: "week_provisioning_items table", table: "week_provisioning_items", hint: "migration 2026-05-20_add_week_provisioning_items" },
    { label: "shopping_fulfilment_memory table", table: "shopping_fulfilment_memory", hint: "migration 2026-05-22_add_shopping_fulfilment_memory" },
  ];

  for (const spec of requiredTables) {
    await guard(spec.label, async () => {
      if (await tableExists(spec.table)) {
        pass(spec.label, "Table exists");
      } else {
        fail(spec.label, `Table missing — ${spec.hint} has not applied`);
      }
    });
  }

  // ── 5. Release-critical data invariants ────────────────────────────────────────────────────
  //
  // These describe HOUSEHOLD data. On a database that has no households yet — a freshly created
  // production database, or CI — there is nothing for them to be true or false about, and the old
  // script reported the emptiness as a FAIL ("No planner_weeks rows found"). That is a false
  // alarm, and a verifier that cries wolf is a verifier people learn to ignore. So: they report
  // honestly against a populated database, and say plainly that they had nothing to check against
  // an empty one. Neither state is silently passed.

  // `realUsers` is null when the question could not be asked at all — an empty database has no
  // `users` table. That must be a reported FAIL like any other, NOT an exception: this query used
  // to sit outside the guard, and on a fresh database it killed the whole run with "fatal error"
  // and printed not one of the other twenty-three results. The state you are most likely to be in
  // when you need this script is the state it refused to describe.
  let realUsers: number | null = null;
  try {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users WHERE is_demo = false`,
    );
    realUsers = parseInt(rows[0]?.count ?? "0", 10);
  } catch (err: any) {
    fail(
      "Household data invariants",
      `Cannot read the \`users\` table (${err?.message ?? err}) — this database does not have the ` +
        "core schema. Every household-data check below is therefore unverifiable, not satisfied.",
    );
  }

  const populated = realUsers !== null && realUsers > 0;

  if (realUsers === 0) {
    warn(
      "Household data invariants",
      "This database has no non-demo users, so the household-data checks (planner weeks, shopping " +
        "list resolution, household membership) have nothing to verify. This is expected on a NEW " +
        "production database and in CI. It is NOT a pass — they are unverified, not satisfied.",
    );
  }

  await guard("planner_weeks.household_id", async () => {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM planner_weeks WHERE household_id IS NULL`,
    );
    const n = parseInt(rows[0]?.count ?? "0", 10);
    if (n === 0) {
      pass("planner_weeks.household_id", "No planner_weeks row has a NULL household_id");
    } else {
      fail(
        "planner_weeks.household_id",
        `${n} row(s) still have a NULL household_id — the planner week selector will be EMPTY for those households`,
      );
    }
  });

  await guard("planner_weeks count", async () => {
    const { rows } = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*) AS cnt FROM planner_weeks pw
        GROUP BY pw.household_id ORDER BY cnt DESC LIMIT 1`,
    );
    const maxWeeks = parseInt(rows[0]?.cnt ?? "0", 10);
    if (maxWeeks >= 6) {
      pass("planner_weeks count", `At least one household has ${maxWeeks} weeks`);
    } else if (maxWeeks > 0) {
      warn("planner_weeks count", `Max weeks for any household is ${maxWeeks} (6 expected)`);
    } else if (populated) {
      fail(
        "planner_weeks count",
        `No planner_weeks rows exist, but this database has ${realUsers} real user(s) — they have no planner`,
      );
    } else {
      warn("planner_weeks count", "No planner_weeks rows, and no users to own them (empty database)");
    }
  });

  await guard("planner_days (7 per week)", async () => {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM planner_weeks pw
        WHERE (SELECT COUNT(*) FROM planner_days pd WHERE pd.week_id = pw.id) <> 7`,
    );
    const bad = parseInt(rows[0]?.count ?? "0", 10);
    if (bad === 0) {
      pass("planner_days (7 per week)", "Every planner week has exactly 7 days");
    } else {
      fail(
        "planner_days (7 per week)",
        `${bad} planner_week(s) do not have 7 days — those households see an incomplete week grid`,
      );
    }
  });

  await guard("shopping_list.resolution_state", async () => {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM shopping_list WHERE resolution_state IS NULL`,
    );
    const n = parseInt(rows[0]?.count ?? "0", 10);
    if (n === 0) {
      pass("shopping_list.resolution_state", "No row has a NULL resolution_state");
    } else {
      fail(
        "shopping_list.resolution_state",
        `${n} row(s) have a NULL resolution_state — migration 2026-04-19_backfill_shopping_list_null_resolution_state has not applied`,
      );
    }
  });

  await guard("shopping_list backfill", async () => {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM shopping_list WHERE resolution_state = 'raw'`,
    );
    const n = parseInt(rows[0]?.count ?? "0", 10);
    if (n === 0) {
      pass("shopping_list backfill", "No item is left in the raw state");
    } else {
      warn(
        "shopping_list backfill",
        `${n} item(s) still in the raw state — run: npx tsx server/scripts/backfill-item-resolution.ts (RELEASE.md Step 4)`,
      );
    }
  });

  await guard("All users have an active household", async () => {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users u
        WHERE u.is_demo = false
          AND NOT EXISTS (
            SELECT 1 FROM household_members hm
             WHERE hm.user_id = u.id AND hm.status = 'active'
          )`,
    );
    const n = parseInt(rows[0]?.count ?? "0", 10);
    if (n === 0 && populated) {
      pass("All users have an active household", `All ${realUsers} non-demo user(s) have an active household`);
    } else if (n === 0) {
      warn("All users have an active household", "No non-demo users on this database — nothing to check");
    } else {
      fail(
        "All users have an active household",
        `${n} non-demo user(s) have no active household_members row — getHouseholdForUser() THROWS for them, ` +
          "so the app is broken for those households",
      );
    }
  });

  return results;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────────────────────

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("ERROR: DATABASE_URL is required");
    process.exit(1);
  }

  const target = classifyDatabaseTarget(url);

  // SSL for a managed provider (Neon requires it); none for a local/CI Postgres, which does not
  // offer it. Classification comes from the single owner of "what kind of database is this?"
  // (scripts/db/database-target.ts) rather than a second copy of the host rules here.
  const pool = new Pool({
    connectionString: url,
    ...(target.kind === "disposable" ? {} : { ssl: { rejectUnauthorized: false } }),
  });

  console.log("\n=== REL3 — Production Verification ===\n");
  console.log(`  Target:       ${target.redacted}  [${target.kind}]  (read-only)`);
  console.log(`  Expected head: ${expectedMigrationHead()}  (derived from server/migrations/runner.ts)\n`);

  verifyProduction(pool)
    .then(async results => {
      await pool.end();

      for (const r of results) {
        const icon = r.status === "PASS" ? "✓" : r.status === "WARN" ? "⚠" : "✗";
        console.log(`  ${icon} [${r.status}] ${r.name}`);
        if (r.status !== "PASS") console.log(`         ${r.detail}`);
      }

      const passed = results.filter(r => r.status === "PASS").length;
      const warned = results.filter(r => r.status === "WARN").length;
      const failed = results.filter(r => r.status === "FAIL").length;

      console.log(`\n  Total: ${passed} passed, ${warned} warned, ${failed} failed\n`);

      if (failed > 0) {
        console.error(
          "RESULT: FAIL — production does not match this code. Fix the items above before serving traffic.\n",
        );
        process.exit(1);
      }
      if (warned > 0) {
        console.log(
          "RESULT: WARN — no schema mismatch, but there are unverified or incomplete areas above. " +
            "Read them; do not assume they are green.\n",
        );
        process.exit(0);
      }
      console.log("RESULT: PASS — production matches this code.\n");
      process.exit(0);
    })
    .catch(async err => {
      await pool.end().catch(() => {});
      console.error("Verification fatal error:", err);
      process.exit(1);
    });
}
