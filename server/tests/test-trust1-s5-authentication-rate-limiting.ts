/**
 * test-trust1-s5-authentication-rate-limiting.ts — TRUST1-S5
 * ==========================================================
 * There was no rate limiting anywhere in THA. `POST /api/login` was an open, unthrottled,
 * unlimited-attempt oracle against every account on the platform, sitting on top of a six-character
 * password floor. An attacker needed a wordlist and patience, and nothing else.
 *
 * This suite proves the limits are REAL — not configured, real:
 *
 *   Level 1  policy   — the list of what is limited, and what is deliberately not.
 *   Level 2  store    — the fixed window, against a real Postgres, including its RESET.
 *   Level 3  wire     — two real households, a real attacker, a real server, real HTTP.
 *
 * The wire tests spoof the client IP with `X-Forwarded-For`, which works because
 * `app.set("trust proxy", 1)` is already set (server/auth.ts) — the same mechanism Render's TLS
 * terminator uses in production. That is what makes it possible to prove the two limiters
 * INDEPENDENTLY, which is the only way to know both exist:
 *
 *   • one IP, many usernames   → only the per-IP limiter can fire     (a credential-spraying attack)
 *   • one username, many IPs   → only the per-account limiter can fire (a botnet against one family)
 *
 * A suite that only ever hammers one IP with one username cannot tell those two apart, would pass
 * with the per-account limiter deleted, and would be worthless.
 *
 *   npm run test:trust1-s5-authentication-rate-limiting
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { inArray } from "drizzle-orm";

import { db, pool } from "../db.js";
import { runMigrations } from "../migrations/runner.js";
import { users } from "../../shared/schema.js";
import {
  AUTH_RATE_LIMIT_POLICIES,
  PostgresRateLimitStore,
  RATE_LIMITED_MESSAGE,
  rateLimitMode,
} from "../lib/auth-rate-limit.js";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? `\n      ${detail}` : ""}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

/** The five the mission names, plus the three added on repository evidence. */
const MISSION_ROUTES = [
  "/api/login",
  "/api/register",
  "/api/forgot-password",
  "/api/reset-password",
  "/api/resend-verification",
];
const EVIDENCE_ROUTES = ["/api/change-password", "/api/verify-email", "/api/demo/start"];

// ---------------------------------------------------------------------------
// 1. Policy — what is limited, and what must NOT be
// ---------------------------------------------------------------------------

function policyAudit(): void {
  section("1. Policy — the complete, enumerable list of what is limited");

  const authSrc = readFileSync(`${REPO_ROOT}/server/auth.ts`, "utf8");
  const routesSrc = readFileSync(`${REPO_ROOT}/server/routes.ts`, "utf8");

  for (const route of MISSION_ROUTES) {
    const policies = AUTH_RATE_LIMIT_POLICIES.filter((p) => p.route === route);
    check(`${route} — has a rate-limit policy (mission-required)`, policies.length > 0);
    check(
      `${route} — the limiter is actually MOUNTED on the route in server/auth.ts`,
      authSrc.includes(`authRateLimit("${route}")`),
      "a policy nobody mounts is a belief, not a control",
    );
  }

  for (const route of EVIDENCE_ROUTES) {
    check(
      `${route} — protected (added on repository evidence, recorded in the report)`,
      AUTH_RATE_LIMIT_POLICIES.some((p) => p.route === route) &&
        authSrc.includes(`authRateLimit("${route}")`),
    );
  }

  // Both limbs on login. The per-IP limiter alone is defeated by a botnet.
  check(
    "/api/login is limited per-IP AND per-account (a botnet defeats per-IP alone)",
    AUTH_RATE_LIMIT_POLICIES.some((p) => p.route === "/api/login" && p.scope === "ip") &&
      AUTH_RATE_LIMIT_POLICIES.some((p) => p.route === "/api/login" && p.scope === "account"),
  );

  // No Retry-After oracle: if a route's two limiters had different windows, the Retry-After value
  // would reveal WHICH limiter fired — and the account limiter firing is a fact about the account.
  const byRoute = new Map<string, number[]>();
  for (const p of AUTH_RATE_LIMIT_POLICIES) {
    byRoute.set(p.route, [...(byRoute.get(p.route) ?? []), p.windowMs]);
  }
  const unequal = Array.from(byRoute.entries()).filter(([, w]) => new Set(w).size > 1);
  check(
    "per-route, every policy shares ONE window — so Retry-After cannot reveal which limiter fired",
    unequal.length === 0,
    unequal.map(([r, w]) => `${r}: ${w.join(", ")}`).join(" | "),
  );

  // Refund is only sound where success is distinguishable from failure by status code.
  for (const id of ["forgot-password-ip", "forgot-password-account", "resend-verification-ip", "verify-email-ip"]) {
    const p = AUTH_RATE_LIMIT_POLICIES.find((x) => x.id === id)!;
    check(
      `${id} — does NOT refund on success (the route answers the same either way; a refund would refund everything)`,
      p.refundOnSuccess === false,
    );
  }
  check(
    "login-ip / login-account — DO refund on success (a household that logs in normally must not exhaust its own limit)",
    AUTH_RATE_LIMIT_POLICIES.find((p) => p.id === "login-ip")!.refundOnSuccess &&
      AUTH_RATE_LIMIT_POLICIES.find((p) => p.id === "login-account")!.refundOnSuccess,
  );

  // ── SCOPE LOCK: this is authentication rate limiting, not general API throttling ────────────────
  const limitedRoutes = new Set(AUTH_RATE_LIMIT_POLICIES.map((p) => p.route));
  const nonAuth = Array.from(limitedRoutes).filter(
    (r) => ![...MISSION_ROUTES, ...EVIDENCE_ROUTES].includes(r),
  );
  check(
    "NOT ONE unrelated API endpoint is rate-limited (no general throttling, no DDoS, no WAF)",
    nonAuth.length === 0,
    `these are out of scope and must not be limited: ${nonAuth.join(", ")}`,
  );
  check(
    "server/routes.ts mounts no rate limiter at all — the whole surface is untouched",
    !/authRateLimit\(|rateLimit\(/.test(routesSrc),
  );
  check(
    "/api/logout, /api/user and /api/config are deliberately NOT limited (they are not credential surfaces)",
    !limitedRoutes.has("/api/logout") && !limitedRoutes.has("/api/user") && !limitedRoutes.has("/api/config"),
  );

  // ── ONE framework, not two ─────────────────────────────────────────────────────────────────────
  const pkg = JSON.parse(readFileSync(`${REPO_ROOT}/package.json`, "utf8"));
  const deps = Object.keys(pkg.dependencies ?? {});
  const limiterDeps = deps.filter((d) => /rate-limit|ratelimit|slow-down|throttle|bottleneck/i.test(d));
  check(
    "exactly ONE rate-limiting framework is a dependency (no duplicate middleware)",
    limiterDeps.length === 1 && limiterDeps[0] === "express-rate-limit",
    `found: ${limiterDeps.join(", ") || "none"}`,
  );

  // ── The store is shared, not per-process ───────────────────────────────────────────────────────
  const store = new PostgresRateLimitStore("probe:");
  check(
    "the store is NOT an in-memory store — localKeys === false (Render autoscale runs N instances)",
    store.localKeys === false,
    "an in-memory limiter makes the real limit N × the configured one, and silently",
  );

  // ── Mode: production-safe by default ───────────────────────────────────────────────────────────
  const savedEnv = process.env.NODE_ENV;
  const savedMode = process.env.AUTH_RATE_LIMIT_MODE;
  try {
    process.env.NODE_ENV = "production";
    process.env.AUTH_RATE_LIMIT_MODE = "disabled";
    check(
      "PRODUCTION REFUSES to be disabled by an environment variable — it enforces anyway",
      rateLimitMode() === "enforce",
      "an env var that can remove an auth control from a live system is the TRUST1-S1 defect again",
    );

    process.env.AUTH_RATE_LIMIT_MODE = "log_only";
    check(
      "production DOES accept log_only (the Phase 0 plan requires an observation window)",
      rateLimitMode() === "log_only",
    );

    delete process.env.AUTH_RATE_LIMIT_MODE;
    check("production with nothing set → enforce", rateLimitMode() === "enforce");

    process.env.NODE_ENV = "development";
    check("development with nothing set → enforce (a control that is off in dev is never seen to fire)", rateLimitMode() === "enforce");

    process.env.AUTH_RATE_LIMIT_MODE = "disabled";
    check("development CAN disable it (development-friendly, by exception)", rateLimitMode() === "disabled");
  } finally {
    if (savedEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = savedEnv;
    if (savedMode === undefined) delete process.env.AUTH_RATE_LIMIT_MODE; else process.env.AUTH_RATE_LIMIT_MODE = savedMode;
  }
}

// ---------------------------------------------------------------------------
// 2. Store — the fixed window against a real Postgres, including its reset
// ---------------------------------------------------------------------------

async function storeAudit(): Promise<void> {
  section("2. The store — a real fixed window in a real Postgres, including its RESET");

  if (!process.env.DATABASE_URL) {
    console.warn("  ! SKIPPED — no DATABASE_URL. These assertions did NOT run. This is not a pass.");
    return;
  }

  // The counter table is created by the migration runner at server boot, exactly as it will be in
  // production. Run the same runner here rather than hand-creating the table — a test that builds its
  // own schema proves the test's idea of the table, not the one the server will actually get.
  await runMigrations();

  const { rows: tableRows } = await pool.query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_name = 'auth_rate_limits'`,
  );
  check("the migration creates the shared counter table", Number(tableRows[0].n) === 1);

  const store = new PostgresRateLimitStore(`s5-store-test-${randomBytes(4).toString("hex")}:`);
  const key = "k1";

  // A 2-second window, so the expiry is observable in a test rather than in fifteen minutes.
  store.init({ windowMs: 2_000 } as never);

  const first = await store.increment(key);
  check("first hit → 1", first.totalHits === 1, `got ${first.totalHits}`);

  const second = await store.increment(key);
  check("second hit → 2 (the counter accumulates)", second.totalHits === 2, `got ${second.totalHits}`);

  check(
    "the window has a real expiry in the future",
    second.resetTime instanceof Date && second.resetTime.getTime() > Date.now(),
  );

  await store.decrement(key);
  const afterRefund = await store.get(key);
  check("decrement refunds a hit (this is what makes a successful login cost nothing)", afterRefund?.totalHits === 1, `got ${afterRefund?.totalHits}`);

  // Two policies must never share a counter.
  const other = new PostgresRateLimitStore(`s5-other-${randomBytes(4).toString("hex")}:`);
  other.init({ windowMs: 2_000 } as never);
  const otherFirst = await other.increment(key);
  check("a different policy's prefix does NOT share the counter", otherFirst.totalHits === 1, `got ${otherFirst.totalHits}`);

  // ── THE RESET. Age the row past its expiry and increment again. ────────────────────────────────
  await pool.query(
    `UPDATE auth_rate_limits SET expires_at = NOW() - INTERVAL '1 second' WHERE key = $1`,
    [`${store.prefix}${key}`],
  );
  const afterExpiry = await store.increment(key);
  check(
    "WHEN THE WINDOW EXPIRES THE COUNTER RESETS TO 1 — it does not accumulate forever",
    afterExpiry.totalHits === 1,
    `got ${afterExpiry.totalHits} — an expired window that keeps counting is a permanent lockout`,
  );
  check(
    "…and a fresh window is opened, in the future",
    afterExpiry.resetTime instanceof Date && afterExpiry.resetTime.getTime() > Date.now(),
  );

  await store.resetKey(key);
  check("resetKey clears the counter", (await store.get(key)) === undefined);
  await other.resetKey(key);
}

// ---------------------------------------------------------------------------
// 3. Over the wire — a real server, a real attacker, real HTTP
// ---------------------------------------------------------------------------

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const addr = probe.address();
      const port = typeof addr === "object" && addr !== null ? addr.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function fetchResilient(url: string, init: RequestInit): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetch(url, { ...init, headers: { ...(init.headers as object), connection: "close" } });
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
  throw lastErr;
}

interface Attempt {
  status: number;
  retryAfter: string | null;
  body: string;
  cookie: string | null;
}

/**
 * `X-Forwarded-For` sets the client IP because `app.set("trust proxy", 1)` is already configured —
 * exactly as Render's TLS terminator does in production. It is what lets us drive the per-IP and
 * per-account limiters independently of one another.
 */
async function post(base: string, path: string, ip: string, body: unknown, cookie?: string): Promise<Attempt> {
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-Forwarded-For": ip };
  if (cookie) headers["cookie"] = cookie;
  const res = await fetchResilient(`${base}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const raw = res.headers.get("set-cookie");
  return {
    status: res.status,
    retryAfter: res.headers.get("retry-after"),
    body: await res.text(),
    cookie: raw ? raw.split(";")[0] : null,
  };
}

async function get(base: string, path: string, ip: string, cookie?: string): Promise<Attempt> {
  const headers: Record<string, string> = { "X-Forwarded-For": ip };
  if (cookie) headers["cookie"] = cookie;
  const res = await fetchResilient(`${base}${path}`, { method: "GET", headers });
  return { status: res.status, retryAfter: res.headers.get("retry-after"), body: await res.text(), cookie: null };
}

async function endToEnd(): Promise<void> {
  section("3. Over the wire — a real server, a real attacker, real HTTP");

  if (!process.env.DATABASE_URL) {
    console.warn("  ! SKIPPED — no DATABASE_URL. These assertions did NOT run. This is not a pass.");
    return;
  }

  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const stamp = randomBytes(6).toString("hex");
  const password = "correct-horse-battery-staple";
  const hashed = await hashPassword(password);

  const alice = `s5-alice-${stamp}@test.invalid`;
  const bob = `s5-bob-${stamp}@test.invalid`;

  const testStart = new Date();

  const [aliceRow] = await db
    .insert(users)
    .values({ username: alice, password: hashed, isBetaUser: true, emailVerified: true })
    .returning();
  const [bobRow] = await db
    .insert(users)
    .values({ username: bob, password: hashed, isBetaUser: true, emailVerified: true })
    .returning();

  let child: ChildProcess | undefined;
  let output = "";

  try {
    child = spawn("npx", ["tsx", "server/index.ts"], {
      cwd: REPO_ROOT,
      detached: true,
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: "development",
        SESSION_SECRET: randomBytes(32).toString("hex"),
        AUTH_RATE_LIMIT_MODE: "", // unset → enforce, which is the production-safe default
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const up = await new Promise<boolean>((resolve) => {
      const onChunk = (b: Buffer) => {
        output += b.toString();
        if (output.includes(`serving on port ${port}`)) resolve(true);
      };
      child!.stdout!.on("data", onChunk);
      child!.stderr!.on("data", onChunk);
      setTimeout(() => resolve(false), 240_000);
    });
    if (!up) throw new Error(`the server never listened.\n      tail: ${output.slice(-1200)}`);

    // ── NORMAL AUTHENTICATION STILL WORKS ────────────────────────────────────────────────────────
    console.log("\n  A household logging in normally:");

    const clean = "198.51.100.10";
    const ok = await post(base, "/api/login", clean, { username: alice, password });
    check("a correct password → 200 (normal authentication is untouched)", ok.status === 200, `got ${ok.status}`);
    check("…and it issues a session cookie", ok.cookie !== null);

    const aliceCookie = ok.cookie!;
    const me = await get(base, "/api/user", clean, aliceCookie);
    check("…and the session works", me.status === 200, `got ${me.status}`);

    // ── THE REFUND — the one failure this task must not ship is throttling a real household ──────
    //
    // 25 consecutive SUCCESSFUL logins from a single address. The per-IP limit is 20. Without
    // `skipSuccessfulRequests` the 21st would be a 429, and a busy household behind one NAT or CGNAT
    // egress address would be locked out of its own account by logging in correctly. This is the
    // sharpest possible test of the refund: it fails, loudly, the moment the refund is removed.
    console.log("\n  A busy household behind one address, logging in normally (the false-positive case):");

    const ipLimit = AUTH_RATE_LIMIT_POLICIES.find((p) => p.id === "login-ip")!.limit; // 20
    let goodLogins = 0;
    for (let i = 0; i < ipLimit + 5; i++) {
      const r = await post(base, "/api/login", clean, { username: alice, password });
      if (r.status === 200) goodLogins++;
    }
    check(
      `${ipLimit + 5} consecutive CORRECT logins from one IP → all ${ipLimit + 5} succeed, though the per-IP limit is ${ipLimit}`,
      goodLogins === ipLimit + 5,
      `${goodLogins}/${ipLimit + 5} succeeded — a successful login is consuming budget, so a household that logs in normally can lock itself out. That is the one failure this task must not ship.`,
    );

    // The plan's literal requirement: mistype twice, then get it right.
    await post(base, "/api/login", clean, { username: alice, password: "wrong-guess" });
    await post(base, "/api/login", clean, { username: alice, password: "wrong-again" });
    const afterTypos = await post(base, "/api/login", clean, { username: alice, password });
    check(
      "a household that mistypes twice and then succeeds is NOT locked out → 200",
      afterTypos.status === 200,
      `got ${afterTypos.status}`,
    );

    // ── PER-IP: one address, many usernames. Only the IP limiter can fire. ───────────────────────
    console.log("\n  An attacker spraying many usernames from one address (isolates the per-IP limit):");

    const sprayIp = "203.0.113.20";
    let firstIpBlock = -1;
    let ipBlocked: Attempt | undefined;
    for (let i = 1; i <= ipLimit + 4; i++) {
      const r = await post(base, "/api/login", sprayIp, { username: `victim-${i}-${stamp}@test.invalid`, password: "guess" });
      if (r.status === 429 && firstIpBlock === -1) { firstIpBlock = i; ipBlocked = r; }
    }
    check(
      `repeated failed logins from one IP → THROTTLED (429) — first blocked at attempt ${firstIpBlock} of ${ipLimit + 4}`,
      firstIpBlock === ipLimit + 1,
      `expected the block at attempt ${ipLimit + 1}; got ${firstIpBlock === -1 ? "NEVER BLOCKED" : firstIpBlock}`,
    );
    check("…the 429 carries a Retry-After header", ipBlocked?.retryAfter != null && Number(ipBlocked.retryAfter) > 0, `Retry-After: ${ipBlocked?.retryAfter}`);
    check(
      "…and Retry-After is within the configured window (it is a real deadline, not a guess)",
      Number(ipBlocked?.retryAfter) <= 15 * 60,
      `Retry-After: ${ipBlocked?.retryAfter}s, window: 900s`,
    );
    check(
      "…and the 429 body is the consistent one",
      ipBlocked !== undefined && JSON.parse(ipBlocked.body).message === RATE_LIMITED_MESSAGE,
      ipBlocked?.body,
    );

    // ── PER-ACCOUNT: one username, many addresses. Only the account limiter can fire. ────────────
    console.log("\n  A botnet attacking ONE household from many addresses (isolates the per-account limit):");

    const acctLimit = AUTH_RATE_LIMIT_POLICIES.find((p) => p.id === "login-account")!.limit; // 10
    let firstAcctBlock = -1;
    let acctBlocked: Attempt | undefined;
    for (let i = 1; i <= acctLimit + 3; i++) {
      // A DIFFERENT source address every time. No per-IP counter ever reaches two.
      const r = await post(base, "/api/login", `203.0.113.${100 + i}`, { username: bob, password: `guess-${i}` });
      if (r.status === 429 && firstAcctBlock === -1) { firstAcctBlock = i; acctBlocked = r; }
    }
    check(
      `failed logins DISTRIBUTED ACROSS ${acctLimit + 3} IPs against one account → still THROTTLED at attempt ${firstAcctBlock}`,
      firstAcctBlock === acctLimit + 1,
      firstAcctBlock === -1
        ? "NEVER BLOCKED — the per-account limiter does not exist, and a botnet defeats this control entirely"
        : `expected the block at attempt ${acctLimit + 1}; got ${firstAcctBlock}`,
    );

    // ── THE ANTI-ORACLE INVARIANT. This is the one that matters. ────────────────────────────────
    // Both of these are 429s from /api/login. One came from the per-IP limiter, one from the
    // per-account limiter. If they differ in ANY byte — message, Retry-After, key order — then a 429
    // tells an anonymous caller that the ACCOUNT limiter tripped, which is a fact about the account.
    // That is the enumeration oracle TRUST1-S3A closed on the meals routes, re-opened here.
    check(
      "the per-IP 429 and the per-ACCOUNT 429 on /api/login are BYTE-FOR-BYTE identical (a 429 never says which limiter fired)",
      ipBlocked !== undefined && acctBlocked !== undefined &&
        ipBlocked.body === acctBlocked.body &&
        ipBlocked.retryAfter === acctBlocked.retryAfter,
      `per-IP:      ${ipBlocked?.body} (Retry-After: ${ipBlocked?.retryAfter})\n      ` +
        `per-account: ${acctBlocked?.body} (Retry-After: ${acctBlocked?.retryAfter})`,
    );

    // The limiter runs IN FRONT of authentication — so even the RIGHT password is refused.
    const rightPwWhileLimited = await post(base, "/api/login", "203.0.113.250", { username: bob, password });
    check(
      "…and once limited, even the CORRECT password is refused (the limiter is genuinely in front of auth)",
      rightPwWhileLimited.status === 429,
      `got ${rightPwWhileLimited.status} — if this is 200 the limiter is being bypassed on success`,
    );

    // ── THE RESET. Age the windows and try again. ────────────────────────────────────────────────
    console.log("\n  Waiting out the retry window (simulated by ageing the counters past their expiry):");

    // Scoped to this run's own counters. An unscoped UPDATE here would age EVERY counter in the
    // database — including, on a shared database, the counters currently protecting real accounts.
    await pool.query(
      `UPDATE auth_rate_limits SET expires_at = NOW() - INTERVAL '1 second' WHERE created_at >= $1`,
      [testStart],
    );

    const afterWindow = await post(base, "/api/login", "203.0.113.250", { username: bob, password });
    check(
      "AFTER THE RETRY WINDOW ELAPSES, AUTHENTICATION WORKS AGAIN → 200",
      afterWindow.status === 200,
      `got ${afterWindow.status} — this is a backoff, not a lockout. A limit that never resets is a permanent denial of service against a real household.`,
    );

    const sprayAfter = await post(base, "/api/login", sprayIp, { username: alice, password });
    check("…and the previously-blocked IP is unblocked too", sprayAfter.status === 200, `got ${sprayAfter.status}`);

    // ── A SECOND ROUTE, AND THE MAIL BOMB ───────────────────────────────────────────────────────
    console.log("\n  /api/forgot-password — the per-account limit on a second route (a mail bomb):");

    const bombIp = "192.0.2.30";
    const target = `bomb-${stamp}@test.invalid`;
    const forgotLimit = AUTH_RATE_LIMIT_POLICIES.find((p) => p.id === "forgot-password-account")!.limit; // 3
    let firstForgotBlock = -1;
    let forgotBlocked: Attempt | undefined;
    for (let i = 1; i <= forgotLimit + 2; i++) {
      const r = await post(base, "/api/forgot-password", `192.0.2.${40 + i}`, { username: target });
      if (r.status === 429 && firstForgotBlock === -1) { firstForgotBlock = i; forgotBlocked = r; }
    }
    check(
      `one address cannot be mail-bombed from many IPs → throttled at attempt ${firstForgotBlock}`,
      firstForgotBlock === forgotLimit + 1,
      `expected ${forgotLimit + 1}, got ${firstForgotBlock === -1 ? "NEVER BLOCKED" : firstForgotBlock}`,
    );
    // ACROSS routes, Retry-After legitimately differs (15 min on login, 60 on forgot-password) and
    // that leaks nothing — the caller already knows which route they called. What must be identical
    // is the message and the shape, so a 429 never characterises the caller or the account.
    check(
      "…its 429 message and shape are identical to /api/login's (only the window differs, which the caller already knows)",
      forgotBlocked !== undefined && ipBlocked !== undefined &&
        JSON.parse(forgotBlocked.body).message === JSON.parse(ipBlocked.body).message &&
        JSON.parse(forgotBlocked.body).message === RATE_LIMITED_MESSAGE &&
        JSON.stringify(Object.keys(JSON.parse(forgotBlocked.body))) ===
          JSON.stringify(Object.keys(JSON.parse(ipBlocked.body))),
      `login: ${ipBlocked?.body}\n      forgot: ${forgotBlocked?.body}`,
    );

    // ── UNRELATED ROUTES ARE UNAFFECTED ─────────────────────────────────────────────────────────
    console.log("\n  Unrelated API routes — this is NOT general throttling:");

    let unrelatedBlocked = 0;
    let unrelatedRetryAfter = 0;
    for (let i = 0; i < 40; i++) {
      const r = await get(base, "/api/meal-templates", bombIp);
      if (r.status === 429) unrelatedBlocked++;
      if (r.retryAfter) unrelatedRetryAfter++;
    }
    check(
      "40 rapid hits on an unrelated API route (GET /api/meal-templates) → NEVER throttled",
      unrelatedBlocked === 0,
      `${unrelatedBlocked} of 40 were 429. General API throttling is explicitly out of scope for S5.`,
    );
    check("…and it carries no Retry-After header at all", unrelatedRetryAfter === 0);

    let configBlocked = 0;
    for (let i = 0; i < 30; i++) {
      const r = await get(base, "/api/config", bombIp);
      if (r.status === 429) configBlocked++;
    }
    check(
      "30 rapid hits on GET /api/config — an auth-adjacent route deliberately NOT limited → never throttled",
      configBlocked === 0,
      `${configBlocked} of 30 were 429 — the limiter has been over-applied`,
    );

    // ── AUTHENTICATED SESSIONS KEEP WORKING ─────────────────────────────────────────────────────
    console.log("\n  An established session, while the login limiter is exhausted:");

    // Exhaust the login limiter for a fresh IP, then prove Alice's live session is untouched.
    const siegeIp = "198.51.100.77";
    for (let i = 1; i <= 25; i++) {
      await post(base, "/api/login", siegeIp, { username: `siege-${i}-${stamp}@test.invalid`, password: "guess" });
    }
    const siege = await post(base, "/api/login", siegeIp, { username: alice, password });
    check("the login route is exhausted for that IP → 429", siege.status === 429, `got ${siege.status}`);

    let sessionOk = 0;
    for (let i = 0; i < 25; i++) {
      const r = await get(base, "/api/user", siegeIp, aliceCookie);
      if (r.status === 200) sessionOk++;
    }
    check(
      "…and Alice's ALREADY-ESTABLISHED session still works, 25/25, from that very same throttled IP",
      sessionOk === 25,
      `${sessionOk}/25 — rate limiting must never log a logged-in household out`,
    );

    // ── NO PERSONAL DATA IN THE COUNTER TABLE ───────────────────────────────────────────────────
    console.log("\n  The counter table — TRUST1-P8 discipline:");

    const { rows: keyRows } = await pool.query<{ key: string }>(
      `SELECT key FROM auth_rate_limits WHERE created_at >= $1`,
      [testStart],
    );
    check("the limiter actually wrote counters to the shared Postgres store", keyRows.length > 0, `${keyRows.length} rows`);

    const leaked = keyRows.filter(
      (r) =>
        r.key.includes(alice) ||
        r.key.includes(bob) ||
        r.key.includes(target) ||
        r.key.includes("@") ||
        r.key.includes("203.0.113") ||
        r.key.includes("198.51.100") ||
        r.key.includes("192.0.2"),
    );
    check(
      `NOT ONE of the ${keyRows.length} counter keys contains a plaintext email address or IP — every key is an HMAC`,
      leaked.length === 0,
      `${leaked.length} keys leaked personal data, e.g. ${leaked[0]?.key}`,
    );

    // ── AND THE LOG STAYS CLEAN (P8 still holds) ────────────────────────────────────────────────
    const logLeak = [alice, bob, target, "203.0.113.20", password].filter((needle) => output.includes(needle));
    check(
      "the server log carries no email address, no password and no IP from any of this (TRUST1-P8 holds)",
      logLeak.length === 0,
      `leaked into the log: ${logLeak.join(", ")}`,
    );
    check(
      "…and the 429s WERE logged, by policy id (an unobservable control is unoperable)",
      /\[TRUST1-S5\] 429 login-(ip|account)/.test(output),
    );
  } catch (err) {
    console.error(`\n  ! the test could not complete. Child process output:\n${output.slice(-2000)}`);
    throw err;
  } finally {
    if (child?.pid) {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }
    await pool.query(`DELETE FROM auth_rate_limits WHERE created_at >= $1`, [testStart]).catch(() => {});
    await db.delete(users).where(inArray(users.id, [aliceRow.id, bobRow.id])).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// 4. TWO INSTANCES, ONE DATABASE — the reason the store is Postgres
// ---------------------------------------------------------------------------

/**
 * THE ASSERTION THIS WHOLE DESIGN EXISTS FOR.
 *
 * THA deploys to Render `autoscale` — N instances behind a load balancer, sharing one database. The
 * default `express-rate-limit` store is in-memory and per-process, so on N instances the real limit
 * silently becomes N × the configured one, and it resets to zero whenever an instance recycles. Every
 * single-process test in section 3 would still pass. The number in the config file would be a belief.
 *
 * So this spawns TWO real servers on two ports against ONE Postgres — the actual autoscale topology —
 * and splits an attack across both. If the counter were per-process, neither instance would ever reach
 * the limit and the attack would sail through. It has to be caught by the pair, or the store is wrong.
 *
 * Both instances share a SESSION_SECRET, exactly as a real deployment must (the keys are HMAC'd under
 * it, and .env.example says so for the same reason the session cookie needs it).
 */
async function multiInstance(): Promise<void> {
  section("4. TWO INSTANCES, ONE DATABASE — the Render autoscale topology");

  if (!process.env.DATABASE_URL) {
    console.warn("  ! SKIPPED — no DATABASE_URL. These assertions did NOT run. This is not a pass.");
    return;
  }

  const stamp = randomBytes(6).toString("hex");
  const password = "correct-horse-battery-staple";
  const victim = `s5-multi-${stamp}@test.invalid`;
  const sharedSecret = randomBytes(32).toString("hex");
  const testStart = new Date();

  const [victimRow] = await db
    .insert(users)
    .values({ username: victim, password: await hashPassword(password), isBetaUser: true, emailVerified: true })
    .returning();

  const portA = await freePort();
  const portB = await freePort();
  const children: ChildProcess[] = [];
  let output = "";

  const boot = async (port: number): Promise<void> => {
    const child = spawn("npx", ["tsx", "server/index.ts"], {
      cwd: REPO_ROOT,
      detached: true,
      env: { ...process.env, PORT: String(port), NODE_ENV: "development", SESSION_SECRET: sharedSecret },
      stdio: ["ignore", "pipe", "pipe"],
    });
    children.push(child);
    const up = await new Promise<boolean>((resolve) => {
      const onChunk = (b: Buffer) => {
        output += b.toString();
        if (output.includes(`serving on port ${port}`)) resolve(true);
      };
      child.stdout!.on("data", onChunk);
      child.stderr!.on("data", onChunk);
      setTimeout(() => resolve(false), 240_000);
    });
    if (!up) throw new Error(`instance on :${port} never listened.\n      tail: ${output.slice(-1200)}`);
  };

  try {
    await boot(portA);
    await boot(portB);
    check("two independent server instances are running against one Postgres", true);

    const a = `http://127.0.0.1:${portA}`;
    const b = `http://127.0.0.1:${portB}`;
    const acctLimit = AUTH_RATE_LIMIT_POLICIES.find((p) => p.id === "login-account")!.limit; // 10

    // Alternate the attack between the two instances. Each instance sees only about half the
    // attempts — so an in-memory counter on either one never reaches the limit.
    let firstBlock = -1;
    let servedByA = 0;
    let servedByB = 0;
    for (let i = 1; i <= acctLimit + 3; i++) {
      const target = i % 2 === 0 ? a : b;
      if (i % 2 === 0) servedByA++; else servedByB++;
      const r = await post(target, "/api/login", `198.51.100.${150 + i}`, { username: victim, password: `guess-${i}` });
      if (r.status === 429 && firstBlock === -1) firstBlock = i;
    }

    check(
      `an attack SPLIT across two instances (${servedByA} hits on A, ${servedByB} on B) is still caught at attempt ${firstBlock}`,
      firstBlock === acctLimit + 1,
      firstBlock === -1
        ? `NEVER BLOCKED. Neither instance individually reached the limit of ${acctLimit}, and neither knew about the other. ` +
          `THIS IS EXACTLY WHAT AN IN-MEMORY STORE DOES ON RENDER AUTOSCALE — the configured limit becomes N × itself.`
        : `expected the block at attempt ${acctLimit + 1}; got ${firstBlock}`,
    );

    // And the block is honoured by BOTH instances — a counter one instance wrote, the other reads.
    const blockedOnA = await post(a, "/api/login", "198.51.100.240", { username: victim, password });
    const blockedOnB = await post(b, "/api/login", "198.51.100.241", { username: victim, password });
    check(
      "…and BOTH instances refuse the correct password (the counter one instance wrote, the other reads)",
      blockedOnA.status === 429 && blockedOnB.status === 429,
      `A → ${blockedOnA.status}, B → ${blockedOnB.status}`,
    );

    // The reset is shared too.
    // Scoped to this run's own counters. An unscoped UPDATE here would age EVERY counter in the
    // database — including, on a shared database, the counters currently protecting real accounts.
    await pool.query(
      `UPDATE auth_rate_limits SET expires_at = NOW() - INTERVAL '1 second' WHERE created_at >= $1`,
      [testStart],
    );
    const recoveredOnB = await post(b, "/api/login", "198.51.100.241", { username: victim, password });
    check(
      "…and when the window expires, the household recovers on BOTH instances → 200",
      recoveredOnB.status === 200,
      `got ${recoveredOnB.status}`,
    );
  } catch (err) {
    console.error(`\n  ! the test could not complete. Child output:\n${output.slice(-2000)}`);
    throw err;
  } finally {
    for (const child of children) {
      if (child.pid) {
        try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); }
      }
    }
    await pool.query(`DELETE FROM auth_rate_limits WHERE created_at >= $1`, [testStart]).catch(() => {});
    await db.delete(users).where(inArray(users.id, [victimRow.id])).catch(() => {});
  }
}

async function main(): Promise<void> {
  console.log("\nTRUST1-S5 — authentication is throttled, and a real household is not\n");

  policyAudit();
  await storeAudit();
  await endToEnd();
  await multiInstance();

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed\n`);
  await pool.end().catch(() => {});
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nTRUST1-S5 test crashed:", err);
  process.exit(1);
});
