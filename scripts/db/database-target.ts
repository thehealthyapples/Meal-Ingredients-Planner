/**
 * Database target classification — the single owner of "what kind of database is this?"
 * ====================================================================================
 * One question, asked by more than one guard: is the database behind `DATABASE_URL` a throwaway,
 * or is it where real households' data lives?
 *
 * Before CBK1 this fact had one owner (`schema-push-guard.ts`, TRUST1-O8) because only one caller
 * asked it. The canonical cookbook seeder (`scripts/import-tha-founding-cookbook-500.ts`) is the
 * second caller, and it must classify a target by exactly the same rules — a host that is too
 * dangerous for a schema push is the same host that must not be written to by accident.
 *
 * Copying the host lists into the seeder would have given one fact two owners, which is the thing
 * the architecture principles forbid outright. So the classification moved here and both guards
 * consume it. The *policies* stay with their guards, and they are deliberately different:
 *
 *   - `schema-push-guard.ts` refuses a managed host outright. There is no override, because a
 *     schema push can drop a column and the data in it.
 *   - the cookbook seeder ALLOWS a managed host, but only when the operator says `--production`
 *     out loud. Seeding is additive, idempotent and keyed on a canonical identity — it is a
 *     sanctioned release step, not an accident waiting to happen.
 *
 * This module classifies. It does not decide. It has no side effects, opens no connection, and
 * reads no environment variable — everything it needs arrives as an argument, so a caller can
 * unit-test it against any URL without owning a database.
 *
 * It FAILS CLOSED by construction: an unparseable URL, a missing URL and an unrecognised host are
 * three distinct answers, and none of them is "disposable". A caller that treats anything other
 * than an explicit `disposable` as safe has misread this module.
 */

/**
 * Hosts that are, by construction, throwaway: a loopback address, a CI service container, or the
 * Replit-managed development Postgres (`helium`). A database reachable only from inside the machine
 * that created it has never held a production row.
 */
export const DISPOSABLE_HOSTS: ReadonlyArray<string> = [
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "postgres", // the GitHub Actions Postgres service container, addressed by service name
  "helium", // Replit's local development Postgres
];

/**
 * Substrings that identify a managed database provider. A managed host is where real user data
 * lives. What a caller does about that is the caller's policy — this list only says where we are.
 */
export const MANAGED_PROVIDER_MARKERS: ReadonlyArray<string> = [
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

export type DatabaseTargetKind =
  /** No DATABASE_URL at all. */
  | "missing"
  /** Present, but not a parseable connection string, or carrying no host. */
  | "unparseable"
  /** A loopback / CI / Replit-local host. Safe to destroy. */
  | "disposable"
  /** A managed provider. This is where production data lives. */
  | "managed"
  /** A real host that is neither obviously disposable nor obviously managed. Unproven. */
  | "unrecognised";

export interface DatabaseTarget {
  kind: DatabaseTargetKind;
  /** Lowercased hostname, or null when it could not be determined. */
  host: string | null;
  /** The connection string with any credentials stripped — safe to log or put in an error. */
  redacted: string;
  /** For `managed`, the provider marker that matched (e.g. "neon.tech"). */
  marker?: string;
}

/** Strip credentials so a connection string can be logged or put in an error message. */
export function redactUrl(url: string): string {
  return url.replace(/:\/\/[^@]*@/, "://<redacted>@");
}

/**
 * Classify a connection string. Never throws; the failure cases are values, so a caller has to
 * handle them explicitly rather than catch them by accident.
 */
export function classifyDatabaseTarget(url: string | undefined | null): DatabaseTarget {
  if (!url) {
    return { kind: "missing", host: null, redacted: "(unset)" };
  }

  const redacted = redactUrl(url);

  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return { kind: "unparseable", host: null, redacted };
  }

  if (!host) {
    return { kind: "unparseable", host: null, redacted };
  }

  const marker = MANAGED_PROVIDER_MARKERS.find(m => host.includes(m));
  if (marker) {
    return { kind: "managed", host, redacted, marker };
  }

  if (DISPOSABLE_HOSTS.includes(host)) {
    return { kind: "disposable", host, redacted };
  }

  return { kind: "unrecognised", host, redacted };
}

/**
 * True when the target is one a reasonable person would call "production": a managed provider, or
 * a process that has declared itself production. Deliberately errs toward YES — `unrecognised` and
 * `unparseable` both count, because a guard that cannot prove a database is disposable must treat
 * it as if it were not.
 *
 * `nodeEnv` is passed in rather than read from `process.env` so this stays pure and testable.
 */
export function isProductionTarget(target: DatabaseTarget, nodeEnv: string | undefined): boolean {
  if (nodeEnv === "production") return true;
  return target.kind !== "disposable";
}
