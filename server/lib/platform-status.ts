/**
 * platform-status.ts — EWO-PRO1 Platform Resilience & Operations
 * ===============================================================
 * The ONE owner of the platform's operational self-description:
 *
 *   - the canonical environment-variable inventory (required / feature /
 *     integration) — previously declared inline in server/index.ts; moved
 *     here so the startup audit and the operations endpoint read one owner
 *     (SoT discipline applied to configuration facts),
 *   - the database reachability probe,
 *   - the assembled operations status the admin endpoint returns.
 *
 * HARD BOUNDARIES:
 *  - Reports PRESENCE of configuration only — never values, never keys,
 *    never connection strings.
 *  - No user data anywhere in any payload: process facts, dependency health
 *    (from platform-resilience.ts), and aggregate turn-outcome counts (from
 *    the PII-scrubbed durable sink) only.
 */

import { pool } from "../db.js";
import { APP_VERSION } from "../app-version.js";
import {
  getDependencyHealthReport,
  withTimeout,
  type DependencyHealth,
} from "./platform-resilience.js";

// ---------------------------------------------------------------------------
// Canonical environment inventory (one owner; consumed by startup + operations)
// ---------------------------------------------------------------------------

export interface EnvVarSpec {
  readonly key: string;
  readonly impact: string;
}

/** Keys that must be present for the server to function at all. */
export const REQUIRED_ENV: readonly EnvVarSpec[] = [
  { key: "DATABASE_URL",   impact: "database connection will fail" },
  { key: "SESSION_SECRET", impact: "user sessions will not work" },
];

/** Keys that enable specific features; absence degrades functionality but is not fatal. */
export const FEATURE_ENV: readonly EnvVarSpec[] = [
  { key: "OPENAI_API_KEY", impact: "AI scan/text-import falls back to heuristic parser" },
  { key: "SMTP_HOST",      impact: "email delivery will fail" },
];

/** Keys that activate optional data integrations. Absence simply disables the source. */
export const INTEGRATION_ENV: readonly EnvVarSpec[] = [
  { key: "WHISK_API_KEY",       impact: "Whisk recipe source disabled" },
  { key: "USDA_API_KEY",        impact: "USDA uses public DEMO_KEY (rate-limited)" },
  { key: "EDAMAM_APP_ID",       impact: "Edamam recipe source disabled" },
  { key: "EDAMAM_APP_KEY",      impact: "Edamam recipe source disabled" },
  { key: "SPOONACULAR_API_KEY", impact: "Spoonacular price lookup disabled" },
  { key: "THEMEALDB_API_KEY",   impact: "TheMealDB uses the shared test key (licensing gap in production)" },
];

/**
 * Startup audit — logs presence/absence of every inventoried key so production
 * misconfigurations surface immediately in server logs rather than failing
 * silently at request time. Returns the missing REQUIRED keys.
 */
export function auditStartupEnvironment(): string[] {
  const isProduction = process.env.NODE_ENV === "production";
  const missing: string[] = [];

  for (const { key, impact } of REQUIRED_ENV) {
    if (!process.env[key]) {
      missing.push(key);
      console.error(`[Startup] MISSING required env var: ${key} — ${impact}`);
    }
  }
  for (const { key, impact } of FEATURE_ENV) {
    if (!process.env[key]) {
      // In production, missing feature env vars are elevated to ERROR so they
      // surface prominently in log aggregators and alerting pipelines.
      const log = isProduction ? console.error : console.warn;
      log(`[Startup] ${isProduction ? "MISSING" : "Optional env var not set:"} ${key} — ${impact}`);
    } else {
      console.log(`[Startup] ${key} ✓`);
    }
  }
  for (const { key, impact } of INTEGRATION_ENV) {
    if (!process.env[key]) {
      console.warn(`[Startup] Integration not configured: ${key} — ${impact}`);
    } else {
      console.log(`[Startup] ${key} ✓`);
    }
  }
  if (missing.length === 0) {
    console.log("[Startup] All required env vars present");
  }
  return missing;
}

export interface EnvAvailability {
  readonly key: string;
  readonly present: boolean;
  readonly impactWhenAbsent: string;
}

/** Presence booleans only — never values. */
export function environmentAvailability(): {
  required: EnvAvailability[];
  features: EnvAvailability[];
  integrations: EnvAvailability[];
} {
  const check = (specs: readonly EnvVarSpec[]): EnvAvailability[] =>
    specs.map(({ key, impact }) => ({
      key,
      present: Boolean(process.env[key]),
      impactWhenAbsent: impact,
    }));
  return {
    required: check(REQUIRED_ENV),
    features: check(FEATURE_ENV),
    integrations: check(INTEGRATION_ENV),
  };
}

// ---------------------------------------------------------------------------
// Database probe
// ---------------------------------------------------------------------------

export interface DatabaseStatus {
  readonly ok: boolean;
  readonly latencyMs: number | null;
  /** Error message only — never a connection string. */
  readonly error: string | null;
}

/** A bounded `SELECT 1` — readiness must answer fast even when the DB is down. */
export async function checkDatabase(timeoutMs = 2_000): Promise<DatabaseStatus> {
  const startedAt = Date.now();
  try {
    await withTimeout("postgres", timeoutMs, () => pool.query("SELECT 1"));
    return { ok: true, latencyMs: Date.now() - startedAt, error: null };
  } catch (err) {
    return {
      ok: false,
      latencyMs: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Operations status (admin endpoint payload)
// ---------------------------------------------------------------------------

const processStartedAt = new Date();

export interface OperationsStatus {
  readonly service: {
    readonly version: string;
    readonly nodeVersion: string;
    readonly environment: string;
    readonly startedAt: string;
    readonly uptimeSeconds: number;
  };
  readonly memory: {
    readonly rssMb: number;
    readonly heapUsedMb: number;
    readonly heapTotalMb: number;
  };
  readonly database: DatabaseStatus;
  /** Circuit state + failure accounting for every outbound dependency called. */
  readonly dependencies: DependencyHealth[];
  /** Aggregate turn-outcome counts from the durable sink (PII-free by construction). */
  readonly turnOutcomes24h: unknown;
  readonly configuration: ReturnType<typeof environmentAvailability>;
}

export async function buildOperationsStatus(): Promise<OperationsStatus> {
  const memory = process.memoryUsage();
  const toMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

  const database = await checkDatabase();

  // The durable sink is optional evidence — an unreachable table must not
  // take the operations endpoint down with it.
  let turnOutcomes24h: unknown = null;
  try {
    const { turnOutcomeStore } = await import(
      "../intelligence/conversation/turn-outcome-store.js"
    );
    turnOutcomes24h = await turnOutcomeStore.countByStateSince(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );
  } catch (err) {
    turnOutcomes24h = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return {
    service: {
      version: APP_VERSION,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
      startedAt: processStartedAt.toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    },
    memory: {
      rssMb: toMb(memory.rss),
      heapUsedMb: toMb(memory.heapUsed),
      heapTotalMb: toMb(memory.heapTotal),
    },
    database,
    dependencies: getDependencyHealthReport(),
    turnOutcomes24h,
    configuration: environmentAvailability(),
  };
}
