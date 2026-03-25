/**
 * Idempotent additive seed runner.
 * Safe to run multiple times — existing rows are never overwritten.
 *
 * Usage:  npm run seed:additives
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";
import { ADDITIVES_SEED } from "./additives-seed.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function run() {
  console.log(`Seeding ${ADDITIVES_SEED.length} additives (ON CONFLICT DO NOTHING)...`);

  let inserted = 0;
  let skipped = 0;

  for (const row of ADDITIVES_SEED) {
    const result = await db.execute(sql`
      INSERT INTO additives (name, type, risk_level, description, is_regulatory)
      VALUES (${row.name}, ${row.type}, ${row.riskLevel}, ${row.description}, ${row.isRegulatory ?? false})
      ON CONFLICT (name) DO NOTHING
    `);
    const count = (result as any).rowCount ?? 0;
    if (count > 0) inserted++;
    else skipped++;
  }

  const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM additives`) as any;
  const count = countResult.rows?.[0]?.count ?? countResult[0]?.count ?? "?";

  console.log(`Done.`);
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Skipped  : ${skipped} (already existed)`);
  console.log(`  DB total : ${count} rows`);

  await pool.end();
}

run().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
