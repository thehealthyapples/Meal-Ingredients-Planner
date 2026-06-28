/**
 * One-shot dev script: reset password for the admin account.
 * Usage: npx tsx script/reset-admin-password.ts
 *
 * Uses the same scrypt-based hashPassword as server/auth.ts.
 * Only updates colinclapson@hotmail.co.uk; all other accounts are untouched.
 * Confirms the account is still admin, beta-enabled, and email-verified after.
 */
import { Pool } from "pg";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const TARGET_EMAIL = "colinclapson@hotmail.co.uk";
const NEW_PASSWORD = "AppleOrchard2026!";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT id, username, role, is_beta_user, email_verified
       FROM users WHERE LOWER(username) = LOWER($1)`,
      [TARGET_EMAIL]
    );

    if (rows.length === 0) {
      console.error(`[reset-admin-password] NOT FOUND: ${TARGET_EMAIL}`);
      process.exit(1);
    }

    const user = rows[0];
    console.log(`[reset-admin-password] Found user id=${user.id} role=${user.role} beta=${user.is_beta_user} verified=${user.email_verified}`);

    const hashed = await hashPassword(NEW_PASSWORD);
    await client.query(
      "UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2",
      [hashed, user.id]
    );

    // Re-fetch to confirm state
    const { rows: after } = await client.query(
      `SELECT role, is_beta_user, email_verified FROM users WHERE id = $1`,
      [user.id]
    );
    const u = after[0];
    console.log(`[reset-admin-password] Password updated.`);
    console.log(`  Account: ${TARGET_EMAIL}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Beta enabled: ${u.is_beta_user}`);
    console.log(`  Email verified: ${u.email_verified}`);
    console.log(`  Temporary password: ${NEW_PASSWORD}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[reset-admin-password] Fatal:", err);
  process.exit(1);
});
