/**
 * TRUST1-O8 — Production Schema Protection
 * ========================================
 * This module is the ONLY place in the repository permitted to invoke `drizzle-kit push`,
 * and the only sanctioned way to run a declarative schema mutation at all.
 *
 * WHY IT EXISTS
 * -------------
 * THA had two owners of one schema. The disciplined one is `server/migrations/runner.ts`:
 * ordered, transactional, versioned, recorded in `schema_migrations`, applied at boot. The
 * other was `drizzle-kit push --force` — a schema diff-and-sync with no review, no transaction
 * boundary, no version record, and an explicit `--force` — which ran against the production
 * DATABASE_URL from `scripts/migrate-prod.sh`, and ran automatically after EVERY GIT MERGE via
 * `scripts/post-merge.sh` and `.replit`'s `[postMerge]` hook. `push` is entirely capable of
 * dropping a column, and thereby the data in it. A merge could destroy production data.
 *
 * Both of those paths are gone (TRUST1-O8). But `push` cannot simply be deleted: it is the only
 * thing that can build the declarative schema in `shared/schema.ts` from empty, which is exactly
 * what CI and a fresh dev database need. So it survives here, behind a gate.
 *
 * THE RULE THIS ENFORCES
 * ----------------------
 * Production schema changes happen in exactly ONE way: a reviewed migration appended to
 * `server/migrations/runner.ts`, applied by `runMigrations()` at boot. Nothing else may
 * mutate a production schema — and this module makes that structural rather than aspirational.
 *
 * It FAILS CLOSED. A database is refused unless it can be shown to be disposable. An unparseable
 * URL, an unrecognised host, a missing variable and a production NODE_ENV are all refusals — the
 * failure modes of this guard all point the same way, which is the only property that makes a
 * guard worth having.
 *
 * There is no override for a managed-provider host and none for NODE_ENV=production. An escape
 * hatch on the control that stands between a typo and irreversible data loss is not a control.
 */

import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Hosts that are, by construction, throwaway: a loopback address, a CI service container, or
 * the Replit-managed development Postgres (`helium`). A database reachable only from inside the
 * machine that created it has never held a production row.
 */
const DISPOSABLE_HOSTS: ReadonlyArray<string> = [
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "postgres", // the GitHub Actions Postgres service container, addressed by service name
  "helium", // Replit's local development Postgres
];

/**
 * Substrings that identify a managed database provider. A managed host is where real user data
 * lives, so `push` is refused against one unconditionally — there is deliberately no override.
 * If you believe you need to push a schema to a managed database, the thing you actually need is
 * a reviewed migration in `server/migrations/runner.ts`.
 */
const MANAGED_PROVIDER_MARKERS: ReadonlyArray<string> = [
  "neon.tech",
  "render.com",
  "amazonaws.com",
  "supabase.co",
  "supabase.com",
  "azure.com",
  "cloudsql",
  "digitalocean.com",
  "heroku",
  "planetscale",
];

/**
 * For a host that is neither obviously disposable nor obviously managed, the operator must say so
 * out loud. The phrase is deliberately a sentence and not a boolean: `ALLOW_SCHEMA_PUSH=1` is
 * something you set once and forget, and it must not be possible to forget this one.
 */
const OVERRIDE_ENV = "ALLOW_SCHEMA_PUSH";
const OVERRIDE_PHRASE = "i-know-this-is-a-disposable-database";

export class UnsafeSchemaTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeSchemaTargetError";
  }
}

/** Strip credentials so a connection string can be logged or put in an error message. */
export function redactUrl(url: string): string {
  return url.replace(/:\/\/[^@]*@/, "://<redacted>@");
}

/**
 * Throws unless `url` is a database it is safe to run a destructive, unreviewed schema mutation
 * against. Callers should not catch this — a refusal is the guard working.
 *
 * @param url     the connection string the caller is about to mutate
 * @param context what the caller is about to do, quoted back in the refusal message
 */
export function assertDisposableDatabase(url: string | undefined, context: string): void {
  // Explicitly typed as never-returning so TypeScript narrows `url` to `string` after the guard
  // clause below. Control-flow analysis only does that for a `const` with an explicit annotation —
  // without it, `new URL(url)` does not compile.
  const refuse: (reason: string, remedy: string) => never = (reason, remedy) => {
    throw new UnsafeSchemaTargetError(
      `TRUST1-O8 — REFUSING to ${context}.\n\n` +
        `  Reason: ${reason}\n\n` +
        `  ${remedy}\n\n` +
        `  Production schema changes have exactly one route: append a reviewed migration to\n` +
        `  server/migrations/runner.ts. It applies at boot, in a transaction, exactly once, and\n` +
        `  is recorded in schema_migrations. See MIGRATIONS.md.`,
    );
  };

  // 1. Production is never a valid target for a declarative push. No override, ever.
  if (process.env.NODE_ENV === "production") {
    refuse(
      "NODE_ENV is 'production'.",
      "There is no override for this. A schema push is not a deployment step.",
    );
  }

  if (!url) {
    refuse(
      "DATABASE_URL is not set.",
      "Point DATABASE_URL at a disposable database (a local Postgres or a CI service container).",
    );
  }

  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    // An unparseable URL is not a safe URL. Fail closed.
    return refuse(
      `DATABASE_URL is not a parseable connection string (${redactUrl(url)}).`,
      "This guard cannot prove the target is disposable, so it refuses.",
    );
  }

  if (!host) {
    refuse(
      `DATABASE_URL has no host (${redactUrl(url)}).`,
      "This guard cannot prove the target is disposable, so it refuses.",
    );
  }

  // 2. A managed provider is where real user data lives. No override, ever.
  const managed = MANAGED_PROVIDER_MARKERS.find(marker => host.includes(marker));
  if (managed) {
    refuse(
      `DATABASE_URL points at a managed database provider (${managed}) — host '${host}'.`,
      "A managed host is where production data lives. There is no override for this.",
    );
  }

  // 3. A loopback / CI / Replit-local host is disposable by construction. Allowed.
  if (DISPOSABLE_HOSTS.includes(host)) return;

  // 4. Anything else is unproven. The operator must assert disposability explicitly.
  if (process.env[OVERRIDE_ENV] === OVERRIDE_PHRASE) return;

  refuse(
    `DATABASE_URL points at '${host}', which this guard does not recognise as disposable.`,
    `If it genuinely is a throwaway database that has never held user data, say so explicitly:\n` +
      `    ${OVERRIDE_ENV}="${OVERRIDE_PHRASE}" <your command>`,
  );
}

/**
 * The gate for the `scripts/apply-*.ts` family — one-shot scripts that execute raw
 * `CREATE TABLE` / `ALTER TABLE` against `DATABASE_URL` directly.
 *
 * They were written as a *safer* alternative to `drizzle-kit push` (their own headers say so, and
 * relative to `push --force` they were right — they are additive and idempotent). But they are
 * still a schema mutation outside the reviewed migration list, and every one of them would have
 * run happily against production. They are historical, already applied, and kept for provenance;
 * this makes them structurally unable to touch a production database.
 *
 * Exits the process on refusal rather than throwing, so a one-shot script prints the reason
 * instead of a stack trace.
 */
export function guardAdHocDdl(context: string): void {
  try {
    assertDisposableDatabase(process.env.DATABASE_URL, context);
  } catch (err) {
    if (err instanceof UnsafeSchemaTargetError) {
      console.error(`\n${err.message}\n`);
      process.exit(1);
    }
    throw err;
  }
}

/**
 * The single sanctioned invocation of `drizzle-kit push` in this repository.
 *
 * Builds the declarative schema from `shared/schema.ts` — for CI and disposable development
 * databases ONLY. Guarded above; it cannot reach production.
 */
export function runGuardedSchemaPush(context = "push the declarative schema"): void {
  const url = process.env.DATABASE_URL;
  assertDisposableDatabase(url, context);

  console.log(`[schema-push] target: ${redactUrl(url!)}`);
  console.log("[schema-push] drizzle-kit push  (tables from shared/schema.ts)");

  execFileSync("npx", ["drizzle-kit", "push", "--force"], {
    cwd: REPO_ROOT,
    stdio: "inherit",
    env: process.env,
  });
}

// ── CLI: `npm run db:push` ───────────────────────────────────────────────────
// Only runs when this file is executed directly, so importing the guard never pushes anything.
const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    runGuardedSchemaPush("run `drizzle-kit push` (npm run db:push)");
    console.log("[schema-push] OK — declarative schema applied to the disposable database.");
  } catch (err) {
    if (err instanceof UnsafeSchemaTargetError) {
      console.error(`\n${err.message}\n`);
      process.exit(1);
    }
    throw err;
  }
}
