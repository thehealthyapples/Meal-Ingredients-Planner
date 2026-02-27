import { pool } from "../db";

export async function ensureUserDietColumns(): Promise<void> {
  const migrations = [
    {
      column: "diet_pattern",
      sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_pattern TEXT",
    },
    {
      column: "diet_restrictions",
      sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_restrictions TEXT[]",
    },
    {
      column: "eating_schedule",
      sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS eating_schedule TEXT",
    },
  ];

  const client = await pool.connect();
  try {
    for (const { column, sql } of migrations) {
      await client.query(sql);
      console.log(`[Migration] Column users.${column} — OK`);
    }
    console.log("[Migration] ensureUserDietColumns completed successfully");
  } catch (err: any) {
    const isPermissionError =
      err?.code === "42501" || err?.message?.includes("permission denied");

    if (isPermissionError) {
      console.error(
        "[Migration] PERMISSION DENIED — production DB schema is behind. " +
          "Run the following SQL manually on your production database:\n" +
          "  ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_pattern TEXT;\n" +
          "  ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_restrictions TEXT[];\n" +
          "  ALTER TABLE users ADD COLUMN IF NOT EXISTS eating_schedule TEXT;"
      );
    } else {
      console.error("[Migration] ensureUserDietColumns failed:", err?.message ?? err);
    }
    throw err;
  } finally {
    client.release();
  }
}
