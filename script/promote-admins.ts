import { Pool } from "pg";

const ADMIN_EMAILS = [
  "lindsayclapson@outlook.com",
  "colinclapson@hotmail.co.uk",
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  console.log("[promote-admins] Starting admin promotion script...");
  let promoted = 0;
  let notFound = 0;

  try {
    for (const email of ADMIN_EMAILS) {
      const { rows } = await client.query(
        "SELECT id, username, role FROM users WHERE LOWER(username) = LOWER($1)",
        [email]
      );

      if (rows.length === 0) {
        console.log(`[promote-admins] NOT FOUND: ${email} — no account exists yet`);
        notFound++;
        continue;
      }

      const user = rows[0];
      if (user.role === "admin") {
        console.log(`[promote-admins] ALREADY ADMIN: ${email} (id=${user.id})`);
        promoted++;
        continue;
      }

      await client.query(
        "UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = $1",
        [user.id]
      );
      console.log(`[promote-admins] PROMOTED: ${email} (id=${user.id}) → role=admin`);
      promoted++;
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`\n[promote-admins] Summary:`);
  console.log(`  Promoted/already admin: ${promoted}`);
  console.log(`  Not found (no account): ${notFound}`);

  if (notFound > 0) {
    console.log(`\n  Note: Re-run this script after those users register to grant them admin access.`);
  }
}

main().catch((err) => {
  console.error("[promote-admins] Fatal error:", err);
  process.exit(1);
});
