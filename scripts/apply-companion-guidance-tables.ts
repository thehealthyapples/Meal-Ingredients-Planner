/**
 * INT38 — Apply Companion Guidance & Feedback tables (idempotent, additive DDL).
 *
 * Used in place of interactive `drizzle-kit push` for the two new tables
 * (drizzle-kit prompts create-vs-rename ambiguity, unsupported in this
 * environment — see scripts/apply-canonical-tables.ts for the established
 * precedent). Pure CREATE TABLE IF NOT EXISTS — touches nothing else. The DDL
 * mirrors the Drizzle definitions in shared/schema.ts exactly.
 *
 * Usage:  tsx scripts/apply-companion-guidance-tables.ts
 */
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const DDL = `
CREATE TABLE IF NOT EXISTS companion_response_feedback (
  id serial PRIMARY KEY,
  conversation_turn_id integer NOT NULL UNIQUE REFERENCES conversation_turns(id) ON DELETE CASCADE,
  rating text NOT NULL,
  reason_code text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companion_guidance_events (
  id serial PRIMARY KEY,
  conversation_turn_id integer NOT NULL REFERENCES conversation_turns(id) ON DELETE CASCADE,
  event_kind text NOT NULL,
  source_domain text NOT NULL,
  domain text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

async function run() {
  await pool.query(DDL);
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_name IN ('companion_response_feedback','companion_guidance_events')
     ORDER BY table_name`,
  );
  console.log("Companion guidance tables present:", rows.map((r) => r.table_name).join(", "));
  await pool.end();
}

run().catch((err) => {
  console.error("apply-companion-guidance-tables failed:", err);
  process.exit(1);
});
