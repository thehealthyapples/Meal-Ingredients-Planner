import pg from "pg";
import { guardAdHocDdl } from "./db/schema-push-guard.js";
const { Pool } = pg;

// TRUST1-O8 — ad-hoc DDL is not a reviewed migration. Refuse to run it against a
// production database. Schema changes reach production only via server/migrations/runner.ts.
guardAdHocDdl("run ad-hoc DDL (scripts/nk6o-add-family-column.ts)");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// NK6M: additive, nullable knowledge_nutrients.family column. Matches the drizzle
// schema (shared/schema.ts: family: text("family")). IF NOT EXISTS = idempotent.
// Applied surgically (not via full db:push) to avoid unrelated schema drift.
await pool.query(`ALTER TABLE knowledge_nutrients ADD COLUMN IF NOT EXISTS family text`);
const r = await pool.query(
  `select column_name, data_type, is_nullable from information_schema.columns
   where table_name='knowledge_nutrients' and column_name='family'`
);
console.log("Applied. family column:", r.rows[0]);
await pool.end();
