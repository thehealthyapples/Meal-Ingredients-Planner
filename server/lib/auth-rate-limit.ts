/**
 * auth-rate-limit.ts — TRUST1-S5
 * ==============================
 * The ONE owner of every authentication rate limit in THA.
 *
 * Until this module existed there was no rate limiting anywhere in the platform — no
 * `express-rate-limit`, no equivalent, nothing. Combined with a six-character password floor
 * (`server/auth.ts`, three sites) and no lockout, `POST /api/login` was an open, unthrottled,
 * unlimited-attempt oracle against every account on the platform. An attacker did not need to be
 * sophisticated; they needed a wordlist and patience.
 *
 * Everything below is a decision, not a default. The ones that matter:
 *
 * ── 1. THE STORE IS POSTGRES, NOT MEMORY. This is the whole task. ────────────────────────────────
 *
 * THA deploys to Render `autoscale` (`.replit:32-34`) — **multiple instances**. `express-rate-limit`
 * ships a `MemoryStore` and it is the default, and it would have been wrong here in a way that looks
 * right: an in-memory counter is per-process, so with N instances behind the load balancer the real
 * limit is **N × the configured limit**, and it silently resets to zero every time an instance is
 * recycled. You would configure 10 and ship 40-that-sometimes-becomes-0, and every local test would
 * pass, and the number in the config file would be a belief rather than a limit.
 *
 * So the counter lives in Postgres, which every instance already shares (THA runs `connect-pg-simple`
 * on the same database for sessions). The configured limit is the actual limit, on any number of
 * instances. `localKeys = false` tells the library the same thing.
 *
 * The cost is one round trip per authentication attempt, against a database the request was about to
 * hit anyway. Authentication is a low-volume surface; this is not a hot path.
 *
 * ── 2. NO PLAINTEXT IP OR EMAIL IS EVER STORED. ──────────────────────────────────────────────────
 *
 * The obvious implementation keys the counter on the raw IP and the raw email address. That would
 * create a new, permanent, plaintext table of *who tried to log in, from where, and when* — which is
 * personal data under UK GDPR (an IP address is), and it would have been built by the same programme
 * that is removing personal data from the logs (`TRUST1-P8`). Building a privacy defect while closing
 * one is not a trade this programme makes.
 *
 * Every key is therefore an HMAC-SHA256 of `policy:value` under `SESSION_SECRET`, truncated. Not a
 * plain hash — an IPv4 space is 2^32 and a plain SHA-256 of it is reversible with a laptop and an
 * afternoon. The HMAC key makes the stored value non-reversible by anyone who does not already hold
 * the secret that signs every session cookie, at which point the rate-limit table is the least of it.
 *
 * A consequence, stated plainly: rotating `SESSION_SECRET` resets every counter. That is correct —
 * they are ephemeral operational state, not records — and it is a feature of the choice, not a cost.
 *
 * ── 3. BACKOFF, NOT LOCKOUT. ─────────────────────────────────────────────────────────────────────
 *
 * `TRUST1` §5.2 requires this to be a deliberate decision, and it is. There is **no account lockout**.
 * A lockout is a denial-of-service weapon pointed at any address an attacker knows: send N bad
 * passwords for a real user's email and that user cannot log in. Every limit here is a window that
 * *expires on its own*, so the worst an attacker can do to a household is delay them — never lock
 * them out, never require an administrator to let them back in.
 *
 * ── 4. A SUCCESSFUL LOGIN REFUNDS ITS HIT (`refundOnSuccess`). ───────────────────────────────────
 *
 * Only *failed* attempts are meant to consume budget on the credential-verifying routes. Without
 * this, a large household on one IP could exhaust the limit by logging in normally, and the control
 * would be punishing exactly the people it exists to protect. With it, the person who mistypes their
 * password twice and then gets it right consumes nothing.
 *
 * It is deliberately OFF for `forgot-password`, `resend-verification` and `verify-email`, and the
 * reason is worth stating: those routes **return the same status whether or not they succeeded** —
 * `forgot-password` always answers 200 with a fixed body precisely so that it cannot be used to
 * enumerate registered addresses. So "was this successful?" is unanswerable from the outside, and a
 * refund rule that cannot tell success from failure would refund *everything* and limit nothing.
 * The anti-enumeration property of those routes is the reason the refund cannot exist on them.
 *
 * ── 5. WITHIN A ROUTE, THE 429 IS BYTE-FOR-BYTE IDENTICAL. ──────────────────────────────────────
 *
 * The oracle to avoid is a 429 that says WHICH limiter fired. "The per-account limiter tripped" is a
 * fact about the account, and handing it to an anonymous caller is the same mistake `TRUST1-S3A`
 * closed on the meals routes when it made "not yours" and "not there" indistinguishable.
 *
 * So on any given route the per-IP and per-account limiters return the same message AND the same
 * `Retry-After` — which is only true because their windows are deliberately EQUAL (15 minutes on
 * login; 60 on forgot-password). A future edit that gives one of them a different window would start
 * leaking which one tripped, so a test asserts the windows are equal per route and fails the build.
 *
 * ACROSS routes the `Retry-After` does differ — 15 minutes on login, 60 on forgot-password — and that
 * is fine and not a leak: the caller already knows which route they called. The message string is
 * identical everywhere regardless.
 *
 * ── 6. THE STORE FAILS OPEN, AND THAT IS NOT A COMPROMISE. ──────────────────────────────────────
 *
 * `passOnStoreError: true`. If Postgres is unreachable, the limiter allows the request through and
 * logs it. This looks like a security hole and is not one: **every authentication route on this
 * surface reads the database to do its job**. `login` cannot verify a password without
 * `getUserByUsername`; `reset-password` cannot find a token. If the database is down, an attacker
 * cannot authenticate, cannot guess, and cannot learn anything — there is nothing to protect. Failing
 * closed would buy exactly no security and would add a new way for a database blip to take
 * authentication offline for real households.
 *
 * ── SCOPE ────────────────────────────────────────────────────────────────────────────────────────
 *
 * Authentication routes only. This is NOT general API throttling, NOT DDoS protection, and NOT a WAF
 * (`TRUST1-S10`, `V3`, `O7` and the general-throttling work are separate, later, and deliberately not
 * started here). Exactly the routes in AUTH_RATE_LIMIT_POLICIES below are limited, and a test fails
 * if a limiter appears anywhere else in the codebase.
 */

import { createHmac } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import {
  ipKeyGenerator,
  rateLimit,
  type ClientRateLimitInfo,
  type IncrementResponse,
  type Options,
  type Store,
} from "express-rate-limit";

import { pool } from "../db.js";
// One owner per fact. `isProductionDeployment()` is TRUST1-S2's, it reads NODE_ENV and nothing else,
// and it exists precisely because `server/auth.ts` also has a constant called `isProduction` that is
// NOT an environment check. Re-deriving the predicate here would recreate the exact confusion S2 was
// written to end. (This import closes a cycle — auth.ts → here → auth.ts — which is safe: it is a
// hoisted function declaration and it is only ever called inside a request, never at module load.)
import { isProductionDeployment } from "../auth.js";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// ---------------------------------------------------------------------------
// Mode — production-safe by default, development-friendly by exception
// ---------------------------------------------------------------------------

export type RateLimitMode = "enforce" | "log_only" | "disabled";

/**
 * `enforce` in every environment unless something explicitly says otherwise. A control that is off by
 * default in development is a control nobody ever sees fire until it fires in production.
 *
 * `log_only` counts and logs but does not block. The Phase 0 plan requires it: S5 is the one task in
 * the phase with a plausible false-positive cost to real households (an IP-only limit behind corporate
 * NAT or mobile CGNAT throttles legitimate families sharing an egress IP), and the mitigation is to
 * observe the real distribution of authentication attempts for a window before enforcing.
 *
 * `disabled` turns the limiter off entirely — and **production refuses it**. A production deployment
 * can be moved to `log_only` (that is an operational decision the plan asks for) and can be moved to
 * nothing weaker. An environment variable must not be able to silently remove an authentication
 * control from a live system; that is the shape of the defect TRUST1-S1 was written to close.
 */
export function rateLimitMode(): RateLimitMode {
  const raw = (process.env.AUTH_RATE_LIMIT_MODE ?? "").trim().toLowerCase();

  if (isProductionDeployment()) {
    return raw === "log_only" ? "log_only" : "enforce";
  }

  if (raw === "disabled") return "disabled";
  if (raw === "log_only") return "log_only";
  return "enforce";
}

// ---------------------------------------------------------------------------
// Key derivation — HMAC, never plaintext
// ---------------------------------------------------------------------------

function keySecret(): string {
  // TRUST1-S1 guarantees this: the server exits non-zero at boot without it. If it is somehow absent
  // here, refusing is right — a rate limiter that cannot key its counters is not a rate limiter.
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("[TRUST1-S5] SESSION_SECRET is required to derive rate-limit keys.");
  return secret;
}

/** One-way, non-reversible, and stable for the life of the current SESSION_SECRET. */
function derivedKey(policyId: string, value: string): string {
  return createHmac("sha256", keySecret())
    // NUL separator, written as an escape: it cannot occur in a policy id, an email address
    // or an IP, so "login-ip" + "1.2.3" can never collide with "login" + "ip\u00001.2.3".
    .update(`${policyId}\u0000${value}`)
    .digest("base64url")
    .slice(0, 32);
}

/** Normalises an email/username the same way the auth routes do, so the counter follows the account. */
function normaliseAccount(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

// ---------------------------------------------------------------------------
// The store — Postgres, shared by every instance
// ---------------------------------------------------------------------------

const PRUNE_INTERVAL_MS = 5 * MINUTE;

/**
 * A fixed-window counter in one atomic statement.
 *
 * The whole window lifecycle — first hit, subsequent hit, and *expiry reset* — is a single
 * `INSERT … ON CONFLICT DO UPDATE`. It has to be: two concurrent login attempts on the same key are
 * exactly the case a rate limiter exists to handle, and a read-then-write would let a burst of
 * parallel requests each read the same count and each decide it was under the limit.
 */
export class PostgresRateLimitStore implements Store {
  /** Counters are shared across instances. This is the property the whole design turns on. */
  readonly localKeys = false;
  readonly prefix: string;

  private windowMs = MINUTE;
  private static lastPruneAt = 0;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<IncrementResponse> {
    void this.pruneOccasionally();

    const { rows } = await pool.query<{ hits: number; expires_at: Date }>(
      `INSERT INTO auth_rate_limits (key, hits, expires_at)
            VALUES ($1, 1, NOW() + ($2::double precision * INTERVAL '1 millisecond'))
       ON CONFLICT (key) DO UPDATE SET
            hits = CASE WHEN auth_rate_limits.expires_at <= NOW()
                        THEN 1
                        ELSE auth_rate_limits.hits + 1 END,
            expires_at = CASE WHEN auth_rate_limits.expires_at <= NOW()
                        THEN NOW() + ($2::double precision * INTERVAL '1 millisecond')
                        ELSE auth_rate_limits.expires_at END
         RETURNING hits, expires_at`,
      [this.prefix + key, this.windowMs],
    );

    const row = rows[0];
    return { totalHits: row.hits, resetTime: new Date(row.expires_at) };
  }

  /**
   * Refund. Never allowed to reject: the library fires this from a detached `res.on("finish")`
   * promise, so a rejection here would surface as an unhandled rejection rather than a failed request.
   * A refund that does not happen costs a household one unit of budget; a crashed process costs
   * everyone the platform.
   */
  async decrement(key: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE auth_rate_limits
            SET hits = GREATEST(hits - 1, 0)
          WHERE key = $1 AND expires_at > NOW()`,
        [this.prefix + key],
      );
    } catch (err) {
      console.error("[TRUST1-S5] rate-limit refund failed (request already served):", (err as Error)?.message);
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      await pool.query(`DELETE FROM auth_rate_limits WHERE key = $1`, [this.prefix + key]);
    } catch (err) {
      console.error("[TRUST1-S5] rate-limit resetKey failed:", (err as Error)?.message);
    }
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    try {
      const { rows } = await pool.query<{ hits: number; expires_at: Date }>(
        `SELECT hits, expires_at FROM auth_rate_limits WHERE key = $1 AND expires_at > NOW()`,
        [this.prefix + key],
      );
      if (rows.length === 0) return undefined;
      return { totalHits: rows[0].hits, resetTime: new Date(rows[0].expires_at) };
    } catch {
      return undefined;
    }
  }

  /**
   * Expired counters are dead weight, and nothing else will ever delete them. Opportunistic and
   * best-effort: no timer to leak in a test, no scheduled job to own, and a failure here must never
   * affect the request that happened to trigger it.
   */
  private async pruneOccasionally(): Promise<void> {
    const now = Date.now();
    if (now - PostgresRateLimitStore.lastPruneAt < PRUNE_INTERVAL_MS) return;
    PostgresRateLimitStore.lastPruneAt = now;
    try {
      await pool.query(`DELETE FROM auth_rate_limits WHERE expires_at <= NOW() - INTERVAL '1 hour'`);
    } catch {
      /* best-effort */
    }
  }
}

// ---------------------------------------------------------------------------
// The policies — the complete, enumerable list of what is limited
// ---------------------------------------------------------------------------

export interface RateLimitPolicy {
  /** Stable id. Also the HMAC domain-separator and the store prefix, so counters never collide. */
  readonly id: string;
  /** The route this policy guards. */
  readonly route: string;
  readonly method: "POST" | "GET";
  /** `ip` — per source address. `account` — per submitted identifier. `principal` — per user id. */
  readonly scope: "ip" | "account" | "principal";
  readonly windowMs: number;
  readonly limit: number;
  /** Refund the hit if the request succeeded (2xx/3xx). Only sound where success is distinguishable. */
  readonly refundOnSuccess: boolean;
  /** For `account` scope: pull the identifier out of the request, or null to skip this policy. */
  readonly identify?: (req: Request) => string | null;
  readonly why: string;
}

/**
 * Every authentication rate limit in the platform. There is no other list, and nothing outside this
 * array is limited.
 *
 * Windows are EQUAL between the `ip` and `account` policy on any given route — see decision 5 above.
 * The test asserts it.
 */
export const AUTH_RATE_LIMIT_POLICIES: readonly RateLimitPolicy[] = [
  // ── POST /api/login — the open guessing oracle this task exists to close ────────────────────────
  {
    id: "login-ip",
    route: "/api/login",
    method: "POST",
    scope: "ip",
    windowMs: 15 * MINUTE,
    limit: 20,
    refundOnSuccess: true,
    why: "Caps password guessing from one source. Generous enough for a household — several people, several devices, the odd typo — because only FAILED attempts count against it.",
  },
  {
    id: "login-account",
    route: "/api/login",
    method: "POST",
    scope: "account",
    windowMs: 15 * MINUTE,
    limit: 10,
    refundOnSuccess: true,
    identify: (req) => normaliseAccount(req.body?.username),
    why: "The per-IP limit alone is defeated by an attacker with a botnet: spread the guesses across a thousand addresses and no single IP ever trips. This one follows the ACCOUNT, so a distributed attack on one household's email is throttled no matter where it comes from. It is a backoff, never a lockout (decision 3).",
  },

  // ── POST /api/register ─────────────────────────────────────────────────────────────────────────
  {
    id: "register-ip",
    route: "/api/register",
    method: "POST",
    scope: "ip",
    windowMs: HOUR,
    limit: 5,
    refundOnSuccess: false,
    why: "Account creation is a rare act for a real person and a cheap one for a script. Successful registrations are NOT refunded — five real accounts an hour from one address is already the abuse case, not the happy path.",
  },

  // ── POST /api/forgot-password — a mail bomb aimed at a household ───────────────────────────────
  {
    id: "forgot-password-ip",
    route: "/api/forgot-password",
    method: "POST",
    scope: "ip",
    windowMs: HOUR,
    limit: 10,
    refundOnSuccess: false,
    why: "Each call sends a real email to a real person. Unthrottled, this route is a free mailer.",
  },
  {
    id: "forgot-password-account",
    route: "/api/forgot-password",
    method: "POST",
    scope: "account",
    windowMs: HOUR,
    limit: 3,
    refundOnSuccess: false,
    identify: (req) => normaliseAccount(req.body?.username),
    why: "Stops one address being mail-bombed from many sources. Three reset emails an hour is more than any real person needs and far fewer than a harassment campaign wants.",
  },

  // ── POST /api/reset-password ───────────────────────────────────────────────────────────────────
  {
    id: "reset-password-ip",
    route: "/api/reset-password",
    method: "POST",
    scope: "ip",
    windowMs: HOUR,
    limit: 10,
    refundOnSuccess: true,
    why: "IP-only, and deliberately: the request carries a reset TOKEN and no account identifier, so there is nothing to key an account limit on. A per-token limit would be worthless — an attacker guessing tokens sends a DIFFERENT token every time, so every guess would land on a fresh counter. The per-IP limit is the only one that bites, and the token's own 32 bytes of entropy are what actually make guessing hopeless. Stated rather than papered over.",
  },

  // ── POST /api/resend-verification ──────────────────────────────────────────────────────────────
  {
    id: "resend-verification-ip",
    route: "/api/resend-verification",
    method: "POST",
    scope: "ip",
    windowMs: HOUR,
    limit: 10,
    refundOnSuccess: false,
    why: "Sends a real email. Same mail-bomb surface as forgot-password, and it was equally unthrottled.",
  },
  {
    id: "resend-verification-account",
    route: "/api/resend-verification",
    method: "POST",
    scope: "account",
    windowMs: HOUR,
    limit: 3,
    refundOnSuccess: false,
    identify: (req) => normaliseAccount(req.body?.email),
    why: "Per-address cap on verification mail. Note the field is `email` here and `username` on the two routes above — the same fact under two names, which is why `identify` is per-policy and not one shared guess.",
  },

  // ── POST /api/change-password — RECORDED ADDITION (not in the mission's named five) ────────────
  {
    id: "change-password-principal",
    route: "/api/change-password",
    method: "POST",
    scope: "principal",
    windowMs: 15 * MINUTE,
    limit: 10,
    refundOnSuccess: true,
    why: "ADDED ON REPOSITORY EVIDENCE, and named by the Phase 0 plan. The handler verifies `currentPassword` before it will change anything — which makes this a second credential-checking oracle, sitting behind a session, doing exactly what /api/login does. A stolen or borrowed session (an unlocked laptop) could be used to brute-force the account's real password at unlimited speed. Keyed on the USER, not the IP, because that is who the credential belongs to; falls back to IP for an unauthenticated caller, so hammering it without a session is throttled too.",
  },

  // ── GET /api/verify-email — RECORDED ADDITION ──────────────────────────────────────────────────
  {
    id: "verify-email-ip",
    route: "/api/verify-email",
    method: "GET",
    scope: "ip",
    windowMs: HOUR,
    limit: 30,
    refundOnSuccess: false,
    why: "ADDED ON REPOSITORY EVIDENCE. It consumes a token from the query string and was unthrottled. No refund is possible and the reason is instructive: the route answers 302 on success AND 302 on failure (it redirects to /auth?verified=1 or /auth?verify_error=…), so success is indistinguishable by status code and a refund rule would refund every failed guess. Set generously — a real person may click a link more than once — because the token's entropy, not this limit, is the actual defence.",
  },

  // ── POST /api/demo/start — RECORDED ADDITION ───────────────────────────────────────────────────
  {
    id: "demo-start-ip",
    route: "/api/demo/start",
    method: "POST",
    scope: "ip",
    windowMs: HOUR,
    limit: 5,
    refundOnSuccess: false,
    why: "ADDED ON REPOSITORY EVIDENCE. It is unauthenticated, it CREATES A REAL USER ROW, it seeds an entire demo dataset, and it logs the caller in — it is account creation and session establishment wearing a different name, and it was the cheapest way to fill the users table from outside. It lives in server/auth.ts and calls req.login, which is what makes it part of this surface rather than an unrelated API route.",
  },
];

// ---------------------------------------------------------------------------
// The 429 — one body, one shape, everywhere
// ---------------------------------------------------------------------------

/**
 * Identical for every policy and every route, deliberately. A 429 that said "too many attempts for
 * this account" would confirm the account exists; one that named the limiter would say whether the
 * IP or the address had tripped. Neither is a fact a caller is owed. This is the same discipline
 * TRUST1-S3A applied when it made "not yours" and "not there" indistinguishable.
 */
export const RATE_LIMITED_MESSAGE = "Too many attempts. Please wait and try again.";

function limitHandler(policy: RateLimitPolicy) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // `express-rate-limit` has already set Retry-After by the time a handler runs.
    const retryAfter = Number(res.getHeader("Retry-After")) || undefined;

    if (rateLimitMode() === "log_only") {
      // Observing, not blocking. The header must go too — a 200 carrying Retry-After is a lie.
      res.removeHeader("Retry-After");
      console.warn(
        `[TRUST1-S5] LOG-ONLY — would have limited ${policy.id} on ${policy.method} ${policy.route} ` +
          `(limit ${policy.limit}/${policy.windowMs / MINUTE}min, retry after ${retryAfter}s). Request allowed.`,
      );
      next();
      return;
    }

    // No IP, no email, no username, no key. The key is an HMAC and would be harmless, but a log line
    // is the last place to start relaxing about identifiers (TRUST1-P8).
    console.warn(
      `[TRUST1-S5] 429 ${policy.id} on ${policy.method} ${policy.route} (retry after ${retryAfter}s)`,
    );

    res.status(429).json({ message: RATE_LIMITED_MESSAGE, retryAfterSeconds: retryAfter });
  };
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

function createLimiter(policy: RateLimitPolicy): RequestHandler {
  return rateLimit({
    windowMs: policy.windowMs,
    limit: policy.limit,

    // Draft-7 `RateLimit` / `RateLimit-Policy`, plus the `Retry-After` the mission asks for. The
    // legacy `X-RateLimit-*` headers are off: they are superseded and they leak the same facts twice.
    standardHeaders: "draft-7",
    legacyHeaders: false,

    skipSuccessfulRequests: policy.refundOnSuccess,
    passOnStoreError: true, // decision 6 — the database is down; there is nothing left to protect
    store: new PostgresRateLimitStore(`${policy.id}:`),
    handler: limitHandler(policy),

    keyGenerator: (req: Request): string => {
      if (policy.scope === "account") {
        // `skip` below guarantees this is non-null by the time we get here.
        return derivedKey(policy.id, policy.identify!(req)!);
      }
      if (policy.scope === "principal" && req.isAuthenticated?.() && req.user) {
        return derivedKey(policy.id, `user:${(req.user as { id: number }).id}`);
      }
      // `ipKeyGenerator` folds IPv6 to a /56 — otherwise a single attacker with a routed IPv6 block
      // simply changes address on every request and no per-IP limit ever counts to two.
      return derivedKey(policy.id, ipKeyGenerator(req.ip ?? "unknown", 56));
    },

    skip: (req: Request): boolean => {
      if (rateLimitMode() === "disabled") return true;
      // No identifier submitted → nothing to count. The handler will reject the request on its own
      // merits (400/401), and inventing a key here would let a caller with no username share, and
      // exhaust, one counter with everybody else who also sent no username.
      if (policy.scope === "account" && policy.identify!(req) === null) return true;
      return false;
    },
  });
}

/** Built once, at module load. Construction touches no database. */
const LIMITERS_BY_ROUTE = new Map<string, RequestHandler[]>();
for (const policy of AUTH_RATE_LIMIT_POLICIES) {
  const existing = LIMITERS_BY_ROUTE.get(policy.route) ?? [];
  existing.push(createLimiter(policy));
  LIMITERS_BY_ROUTE.set(policy.route, existing);
}

/**
 * The middleware chain for one authentication route. Mount it in front of the handler.
 *
 * Throws on an unknown route rather than returning an empty chain — a typo here would silently mount
 * *no* rate limiting on an authentication endpoint and every test would still pass. Fail loud.
 */
export function authRateLimit(route: string): RequestHandler[] {
  const limiters = LIMITERS_BY_ROUTE.get(route);
  if (!limiters) {
    throw new Error(
      `[TRUST1-S5] No rate-limit policy for "${route}". ` +
        `Add one to AUTH_RATE_LIMIT_POLICIES — it is the single list of what is limited.`,
    );
  }
  return limiters;
}
