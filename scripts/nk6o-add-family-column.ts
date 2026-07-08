import pg from "pg";
const { Pool } = pg;
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
