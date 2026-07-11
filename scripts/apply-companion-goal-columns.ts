/**
 * INT39 — Apply Capability Guidance Registry & Goal Completion columns
 * (idempotent, additive DDL).
 *
 * Used in place of interactive `drizzle-kit push` for the new nullable
 * columns (drizzle-kit prompts create-vs-rename ambiguity, unsupported in
 * this environment — see scripts/apply-canonical-tables.ts /
 * scripts/apply-companion-guidance-tables.ts for the established precedent).
 * Pure ADD COLUMN IF NOT EXISTS — touches nothing else, no data loss, no
 * existing row is altered. The DDL mirrors the Drizzle definitions in
 * shared/schema.ts exactly.
 *
 * Usage:  tsx scripts/apply-companion-goal-columns.ts
 */
import pg from "pg";
import { guardAdHocDdl } from "./db/schema-push-guard.js";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

// TRUST1-O8 — ad-hoc DDL is not a reviewed migration. Refuse to run it against a
// production database. Schema changes reach production only via server/migrations/runner.ts.
guardAdHocDdl("run ad-hoc DDL (scripts/apply-companion-goal-columns.ts)");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const DDL = `
ALTER TABLE conversation_turns
  ADD COLUMN IF NOT EXISTS fallback_state text;

ALTER TABLE companion_guidance_events
  ADD COLUMN IF NOT EXISTS source_capability_id text,
  ADD COLUMN IF NOT EXISTS target_capability_id text,
  ADD COLUMN IF NOT EXISTS target_verb text;
`;

async function run() {
  await pool.query(DDL);
  const { rows } = await pool.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE (table_name = 'conversation_turns' AND column_name = 'fallback_state')
        OR (table_name = 'companion_guidance_events' AND column_name IN ('source_capability_id', 'target_capability_id', 'target_verb'))
     ORDER BY table_name, column_name`,
  );
  console.log("INT39 columns present:", rows.map((r) => `${r.table_name}.${r.column_name}`).join(", "));
  await pool.end();
}

run().catch((err) => {
  console.error("apply-companion-goal-columns failed:", err);
  process.exit(1);
});
