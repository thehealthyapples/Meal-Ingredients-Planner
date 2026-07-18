import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Without a bound timeout a connection attempt against an unreachable
  // database hangs forever (pg's default is 0 — no timeout), so a request
  // waits indefinitely instead of failing and releasing the handler.
  connectionTimeoutMillis: 10_000,
});

/**
 * node-postgres emits 'error' on IDLE clients when the connection drops
 * underneath the pool (a database restart, a failover, an idle-timeout kill).
 * An 'error' event with no listener is an unhandled error event, which Node
 * escalates to an uncaught exception and the process EXITS.
 *
 * So the absence of these three lines meant any transient database blip took
 * the whole server down rather than retiring one pooled connection. The pool
 * itself recovers on its own — the listener exists so the process survives
 * long enough to let it.
 */
pool.on("error", (err) => {
  console.error("[db] idle client error — connection retired, pool continues:", err);
});

export const db = drizzle(pool, { schema });
