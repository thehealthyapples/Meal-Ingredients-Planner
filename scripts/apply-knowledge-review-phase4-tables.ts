/**
 * KQ1F — Phase 4: apply the Publish / Release / Rollback / Audit tables (idempotent).
 *
 * Adds four additive tables — the governed alias overlay, rollback points,
 * Knowledge Releases, and the append-only audit log — plus the partial unique
 * index that keeps at most ONE active alias per (kind, alias) (GOV2 many-to-one).
 * Pure `CREATE TABLE / INDEX IF NOT EXISTS`; touches no `knowledge_*` entity or
 * vocabulary table. Mirrors the Drizzle defs in shared/schema.ts, so a later
 * `drizzle-kit push` is a no-op.
 *
 * Usage:  tsx scripts/apply-knowledge-review-phase4-tables.ts
 */
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const DDL = `
CREATE TABLE IF NOT EXISTS knowledge_vocabulary_aliases (
  id serial PRIMARY KEY,
  kind text NOT NULL,
  alias_normalised text NOT NULL,
  canonical_slug text NOT NULL,
  decision_id integer REFERENCES knowledge_review_decisions(id),
  release_id integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_knowledge_vocab_alias_active
  ON knowledge_vocabulary_aliases (kind, alias_normalised) WHERE is_active;

CREATE TABLE IF NOT EXISTS knowledge_rollback_points (
  id serial PRIMARY KEY,
  release_id integer,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

CREATE TABLE IF NOT EXISTS knowledge_releases (
  id serial PRIMARY KEY,
  published_at timestamptz NOT NULL DEFAULT now(),
  approved_by_user_id integer REFERENCES users(id),
  approved_by_user_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_by_user_id integer REFERENCES users(id),
  aliases_published integer NOT NULL DEFAULT 0,
  new_entities integer NOT NULL DEFAULT 0,
  updated_entities integer NOT NULL DEFAULT 0,
  rejected_proposals integer NOT NULL DEFAULT 0,
  deferred_proposals integer NOT NULL DEFAULT 0,
  linked_batch_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  linked_proposal_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  rollback_id integer,
  notes text,
  status text NOT NULL DEFAULT 'published',
  rolled_back_at timestamptz,
  rolled_back_by_user_id integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_review_audit (
  id serial PRIMARY KEY,
  entity text NOT NULL,
  entity_id integer,
  action text NOT NULL,
  actor_kind text NOT NULL DEFAULT 'human',
  actor_user_id integer REFERENCES users(id),
  release_id integer,
  before jsonb,
  after jsonb,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_review_audit_entity
  ON knowledge_review_audit (entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_review_audit_release
  ON knowledge_review_audit (release_id);
`;

async function run() {
  await pool.query(DDL);
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_name IN ('knowledge_vocabulary_aliases','knowledge_rollback_points','knowledge_releases','knowledge_review_audit')
     ORDER BY table_name`,
  );
  console.log("Phase 4 tables present:", rows.map((r) => r.table_name).join(", ") || "(none!)");
  await pool.end();
}

run().catch((err) => {
  console.error("apply-knowledge-review-phase4-tables failed:", err);
  process.exit(1);
});
