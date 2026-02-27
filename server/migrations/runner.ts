/**
 * Migration Runner
 * ================
 * Applies ordered SQL migrations at server startup and tracks them in
 * the `schema_migrations` table so each migration runs exactly once.
 *
 * HOW TO ADD A NEW MIGRATION
 * ---------------------------
 * 1. Add a new entry to the MIGRATIONS array below (append to the END).
 * 2. Choose a unique id in the format:  YYYY-MM-DD_short_description
 *    Example: "2026-03-15_add_user_goals_column"
 * 3. Put all SQL for that migration in the `statements` array.
 *    Each string is executed as a separate statement inside a transaction.
 * 4. Use safe, idempotent SQL — prefer IF NOT EXISTS / IF EXISTS so the
 *    migration can be re-run safely if the transaction was partially applied.
 * 5. Commit and deploy — the runner applies it once and records it.
 * ---------------------------
 */

import { pool } from "../db";

interface Migration {
  id: string;
  statements: string[];
}

// ─── ORDERED MIGRATION LIST ──────────────────────────────────────────────────
// IMPORTANT: Never remove or reorder entries. Only append new ones at the end.
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATIONS: Migration[] = [
  {
    id: "2026-02-27_add_user_diet_fields",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_pattern TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_restrictions TEXT[]",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS eating_schedule TEXT",
    ],
  },

  {
    id: "2026-02-27_backfill_user_diet_fields",
    statements: [
      `UPDATE users u
       SET
         diet_pattern = CASE
           WHEN up.diet_types && ARRAY['vegan']                THEN 'Vegan'
           WHEN up.diet_types && ARRAY['vegetarian']           THEN 'Vegetarian'
           WHEN up.diet_types && ARRAY['mediterranean']        THEN 'Mediterranean'
           WHEN up.diet_types && ARRAY['dash']                 THEN 'DASH'
           WHEN up.diet_types && ARRAY['mind']                 THEN 'MIND'
           WHEN up.diet_types && ARRAY['flexitarian']          THEN 'Flexitarian'
           WHEN up.diet_types && ARRAY['keto']                 THEN 'Keto'
           WHEN up.diet_types && ARRAY['paleo']                THEN 'Paleo'
           WHEN up.diet_types && ARRAY['low-carb', 'atkins']  THEN 'Low-Carb'
           WHEN up.diet_types && ARRAY['carnivore']            THEN 'Carnivore'
           ELSE NULL
         END,
         diet_restrictions = ARRAY_REMOVE(
           ARRAY[
             CASE WHEN up.diet_types && ARRAY['gluten-free'] THEN 'Gluten-Free'::TEXT END,
             CASE WHEN up.diet_types && ARRAY['dairy-free']  THEN 'Dairy-Free'::TEXT END
           ],
           NULL
         )
       FROM user_preferences up
       WHERE up.user_id = u.id`,
    ],
  },

  // ← Add new migrations here, appended to the end
];

export interface MigrationResult {
  lastAppliedId: string | null;
  newlyApplied: number;
}

export async function runMigrations(): Promise<MigrationResult> {
  const client = await pool.connect();
  try {
    // Ensure the tracking table exists (safe to run every boot)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         TEXT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("[Migrations] schema_migrations table ready");

    // Load which migrations are already applied
    const { rows: applied } = await client.query<{ id: string }>(
      "SELECT id FROM schema_migrations"
    );
    const appliedIds = new Set(applied.map(r => r.id));

    const pending = MIGRATIONS.filter(m => !appliedIds.has(m.id));

    if (pending.length === 0) {
      console.log("[Migrations] Up to date — no pending migrations");
    } else {
      console.log(`[Migrations] ${pending.length} pending migration(s) to apply`);
    }

    for (const migration of pending) {
      console.log(`[Migrations] Applying "${migration.id}" …`);
      try {
        await client.query("BEGIN");

        for (const sql of migration.statements) {
          await client.query(sql);
        }

        await client.query(
          "INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
          [migration.id]
        );

        await client.query("COMMIT");
        console.log(`[Migrations] ✓ Applied "${migration.id}"`);
      } catch (err: any) {
        await client.query("ROLLBACK").catch(() => {});

        const isPermission =
          err?.code === "42501" || (err?.message ?? "").includes("permission denied");

        if (isPermission) {
          console.error(
            `[Migrations] ✗ PERMISSION DENIED on "${migration.id}". ` +
              "Your database user may lack ALTER TABLE privileges. " +
              "Run these statements manually on the production database:\n" +
              migration.statements.map(s => `  ${s};`).join("\n")
          );
        } else {
          console.error(
            `[Migrations] ✗ Failed on "${migration.id}":`,
            err?.message ?? err
          );
        }
        throw err; // Caller decides whether to fail fast or continue
      }
    }

    // Retrieve the most recently applied migration for health reporting
    const { rows: latest } = await client.query<{ id: string }>(
      "SELECT id FROM schema_migrations ORDER BY applied_at DESC, id DESC LIMIT 1"
    );

    return {
      lastAppliedId: latest[0]?.id ?? null,
      newlyApplied: pending.length,
    };
  } finally {
    client.release();
  }
}
