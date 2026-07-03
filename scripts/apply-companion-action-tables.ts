/**
 * INT40 — Apply Companion Task Delegation & Assisted Actions table (idempotent,
 * additive DDL).
 *
 * Used in place of interactive `drizzle-kit push` for the new table (drizzle-kit
 * prompts create-vs-rename ambiguity, unsupported in this environment — see
 * scripts/apply-canonical-tables.ts for the established precedent, and
 * scripts/apply-companion-guidance-tables.ts for the INT38 companion-domain
 * precedent this mirrors). Pure CREATE TABLE IF NOT EXISTS — touches nothing
 * else. The DDL mirrors the Drizzle definition in shared/schema.ts exactly.
 *
 * Usage:  tsx scripts/apply-companion-action-tables.ts
 */
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const DDL = `
CREATE TABLE IF NOT EXISTS companion_action_proposals (
  id serial PRIMARY KEY,
  conversation_turn_id integer NOT NULL REFERENCES conversation_turns(id) ON DELETE CASCADE,
  workflow_id text NOT NULL,
  capability_id text NOT NULL,
  verb text NOT NULL,
  label text NOT NULL,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  confirmation_tier text NOT NULL,
  status text NOT NULL DEFAULT 'proposed',
  result_summary text,
  error_code text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS companion_action_proposals_workflow_id_idx
  ON companion_action_proposals (workflow_id);

CREATE INDEX IF NOT EXISTS companion_action_proposals_conversation_turn_id_idx
  ON companion_action_proposals (conversation_turn_id);
`;

async function run() {
  await pool.query(DDL);
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_name = 'companion_action_proposals'`,
  );
  console.log("Companion action table present:", rows.map((r) => r.table_name).join(", ") || "(none)");
  await pool.end();
}

run().catch((err) => {
  console.error("apply-companion-action-tables failed:", err);
  process.exit(1);
});
