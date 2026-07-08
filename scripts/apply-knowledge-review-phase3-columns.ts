/**
 * KQ1E — Phase 3: apply the Consensus & Comparison column(s) (idempotent).
 *
 * Phase 3 (Consensus & Comparison) needs no new table — it reads the existing
 * proposal-layer rows and groups them by review item. It adds ONE additive,
 * nullable column to `knowledge_review_decisions`: `reviewer` (the human/agent
 * reviewer identity, distinct from `reviewer_model`), so the workspace can show
 * both side-by-side. Pure `ADD COLUMN IF NOT EXISTS` — touches nothing else and
 * changes no canonical table. Mirrors the Drizzle definition in
 * shared/schema.ts, so a later `drizzle-kit push` is a no-op.
 *
 * Usage:  tsx scripts/apply-knowledge-review-phase3-columns.ts
 */
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const DDL = `
ALTER TABLE knowledge_review_decisions
  ADD COLUMN IF NOT EXISTS reviewer text;
`;

async function run() {
  await pool.query(DDL);
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'knowledge_review_decisions' AND column_name = 'reviewer'`,
  );
  console.log("Phase 3 column present:", rows.length ? "reviewer" : "(missing!)");
  await pool.end();
}

run().catch((err) => {
  console.error("apply-knowledge-review-phase3-columns failed:", err);
  process.exit(1);
});
