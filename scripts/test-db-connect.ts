import { Pool } from "pg";
const p = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, ssl: { rejectUnauthorized: false } });
p.query("SELECT 1").then(() => { console.log("DB connected OK"); p.end(); }).catch(e => { console.error("DB error:", e.message); p.end(); });
