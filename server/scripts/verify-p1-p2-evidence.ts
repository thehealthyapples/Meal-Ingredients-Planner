/**
 * Independent verification of Priority 1 & 2 claimed database repairs
 * Run against live database to establish ground truth before correcting the report.
 */
import { db } from "../db";
import { sql } from "drizzle-orm";

async function verify() {
  console.log("=== PRIORITY 1 VERIFICATION: Meal Templates ===\n");

  const total = await db.execute(sql`SELECT COUNT(*) as count FROM meal_templates`);
  console.log("Total meal_templates:", (total.rows[0] as any).count);

  const specificIds = await db.execute(sql`SELECT id, name FROM meal_templates WHERE id IN (553, 583, 581)`);
  console.log("IDs 553,583,581 still present:", specificIds.rows.length, "rows");
  console.log(specificIds.rows);

  const backupExists = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'meal_templates_backup_2026_11_08'
    ) as exists
  `);
  console.log("Backup table exists:", (backupExists.rows[0] as any).exists);

  const dupes = await db.execute(sql`
    SELECT name, COUNT(*) as cnt FROM meal_templates GROUP BY name HAVING COUNT(*) > 1
  `);
  console.log("Remaining duplicate names:", dupes.rows.length);
  console.log(dupes.rows);

  console.log("\n=== PRIORITY 2 VERIFICATION: Provenance Backfill ===\n");

  const nullProv = await db.execute(sql`
    SELECT COUNT(*) as count FROM meals WHERE acquisition_type IS NULL OR acquisition_lane IS NULL
  `);
  console.log("Meals still with NULL acquisition fields:", (nullProv.rows[0] as any).count);

  const starterSample = await db.execute(sql`
    SELECT id, name, acquisition_lane, acquisition_type FROM meals WHERE id IN (4446, 4501, 4449)
  `);
  console.log("Sample starter meals (previously claimed backfilled):");
  console.log(starterSample.rows);
}

verify().catch((e) => { console.error("ERROR:", e); process.exit(1); }).finally(() => process.exit(0));
