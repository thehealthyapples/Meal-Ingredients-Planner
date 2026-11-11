import { drizzle } from "drizzle-orm/node-postgres";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// The integrated-dev server must always use this repository's own .env. Otherwise an
// inherited DATABASE_URL silently wins and the same checkout can read/write a different
// database depending on which shell (or other project) launched it. Keep this scoped to
// development-server entry points; production, CI, tests and explicit database scripts
// retain their existing environment-provided behavior.
const launchedServerSource =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(dirname(fileURLToPath(import.meta.url)), "index.ts");
const isIntegratedDevServer =
  ["dev", "dev:reset"].includes(process.env.npm_lifecycle_event ?? "") ||
  (launchedServerSource && process.env.NODE_ENV !== "production");

if (isIntegratedDevServer) {
  process.env.NODE_ENV ??= "development";
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const repositoryEnvFile = resolve(repositoryRoot, ".env");
  // process.loadEnvFile does not replace existing environment values. Clear only this
  // connection setting so the repository-owned .env is the single source for dev DB use.
  delete process.env.DATABASE_URL;
  try {
    process.loadEnvFile(repositoryEnvFile);
  } catch (error) {
    throw new Error(
      `The integrated-dev server requires its repository .env at ${repositoryEnvFile}.`,
      { cause: error },
    );
  }
} else if (!process.env.DATABASE_URL) {
  // Standalone scripts/tests may load a cwd .env when no platform value was provided.
  // Production/CI normally inject DATABASE_URL and never need a local file.
  try {
    process.loadEnvFile();
  } catch {
    // No .env file at cwd — fall through to the explicit missing-value check below.
  }
}

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
