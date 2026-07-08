/**
 * KQ1D — Phase 2: apply the Knowledge Review Package import tables (idempotent).
 *
 * Used in place of interactive `drizzle-kit push` for the two new proposal-layer
 * tables. Pure CREATE TABLE / INDEX IF NOT EXISTS — touches nothing else and
 * changes no canonical table. The DDL mirrors the Drizzle definitions in
 * shared/schema.ts exactly, so a later `drizzle-kit push` is a no-op.
 *
 * Usage:  tsx scripts/apply-knowledge-review-phase2-tables.ts
 */
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const DDL = `
CREATE TABLE IF NOT EXISTS knowledge_review_batches (
  id serial PRIMARY KEY,
  direction text NOT NULL DEFAULT 'import',
  format text NOT NULL DEFAULT 'json',
  schema_version text,
  checksum text,
  exported_at timestamptz,
  reviewer_model text,
  source_filename text,
  item_count integer NOT NULL DEFAULT 0,
  proposal_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'imported',
  notes text,
  created_by_user_id integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_review_decisions (
  id serial PRIMARY KEY,
  batch_id integer NOT NULL REFERENCES knowledge_review_batches(id) ON DELETE CASCADE,
  term_id integer NOT NULL REFERENCES knowledge_review_queue(id) ON DELETE CASCADE,
  review_type text NOT NULL DEFAULT 'vocabulary',
  domain text,
  decision_type text NOT NULL,
  target_canonical_slug text,
  alias_string text,
  proposed_new_slug text,
  proposed_new_name text,
  proposed_new_description text,
  rationale text,
  confidence text,
  reviewer_model text,
  reviewer_notes text,
  original_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'proposed',
  approved_by_user_id integer REFERENCES users(id),
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_review_decision_batch
  ON knowledge_review_decisions (batch_id, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_review_decision_term
  ON knowledge_review_decisions (term_id);
`;

async function run() {
  await pool.query(DDL);
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_name IN ('knowledge_review_batches','knowledge_review_decisions')
     ORDER BY table_name`,
  );
  console.log("Phase 2 tables present:", rows.map((r) => r.table_name).join(", "));
  await pool.end();
}

run().catch((err) => {
  console.error("apply-knowledge-review-phase2-tables failed:", err);
  process.exit(1);
});
