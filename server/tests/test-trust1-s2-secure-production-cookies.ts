/**
 * test-trust1-s2-secure-production-cookies.ts — TRUST1-S2
 * =======================================================
 * The session cookie IS the user's identity. Three flags protect it, and they are one protection,
 * not three:
 *
 *     httpOnly  — script cannot read it        (XSS cannot steal the session)
 *     sameSite  — another site cannot send it  (CSRF cannot ride the session)
 *     secure    — the network cannot see it    (interception cannot copy the session)
 *
 * The first two were already correct. `secure` was hardcoded off, so the cookie was transmitted in
 * plaintext on any request that reached the app over HTTP — on a deployment that sits behind a
 * TLS-terminating proxy, which is exactly the topology where a downgraded or misrouted request is
 * possible.
 *
 * ── THE TRAP THIS FILE EXISTS TO NAIL DOWN ────────────────────────────────────────────────────────
 *
 * `server/auth.ts` already had a constant called `isProduction`, and it is NOT an environment check:
 *
 *     NODE_ENV === "production" || ENABLE_REGISTRATION === "true"
 *
 * It gates the private-beta registration flow. Reusing it for the cookie would mark the cookie
 * `Secure` for any developer running locally with ENABLE_REGISTRATION=true — and `express-session`
 * REFUSES TO SEND a secure cookie over an insecure connection (`express-session/index.js:235`). No
 * `Set-Cookie` is emitted at all. `POST /api/login` returns **200 with a user object** and
 * establishes no session. A login that succeeds and does nothing, with nothing in the log to say why.
 *
 * So the assertions below are not symmetric box-ticking. The one that matters most is the one that
 * proves a NEGATIVE — that in local development with ENABLE_REGISTRATION=true the cookie is NOT
 * secure and the session STILL WORKS — because that is the regression a plausible implementation of
 * this task introduces.
 *
 * Three levels, each catching what the others cannot:
 *
 *   1. UNIT       — the policy is a function of NODE_ENV alone, across the whole env matrix.
 *   2. SOURCE     — the flag is computed, never hardcoded, and never wired to the overloaded constant.
 *   3. END-TO-END — a REAL login against a REAL server; the REAL `Set-Cookie` header is read off the
 *                   wire in development, in development with the trap set, and in production behind
 *                   the configured proxy.
 *
 * Level 3 is the one that matters. A flag set in source is a claim; a flag observed on an HTTP
 * response is a fact. Workstream V exists because those two things drift.
 *
 *   npm run test:trust1-s2-secure-production-cookies
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";

import { db } from "../db.js";
import { users } from "../../shared/schema.js";
import {
  isProductionDeployment,
  sessionCookieOptions,
  SESSION_MAX_AGE_MS,
} from "../auth.js";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

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

/** Ask the OS for a free ephemeral port. A fixed port collides, and on Replit it rewrites `.replit`. */
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

/** Run `fn` with a temporary environment, restoring whatever was there before — pass or throw. */
function withEnv(env: Record<string, string | undefined>, fn: () => void): void {
  const saved: Record<string, string | undefined> = {};
  for (const key of Object.keys(env)) saved[key] = process.env[key];
  try {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fn();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

/** The overloaded constant's actual predicate, reproduced so we can prove we did NOT reuse it. */
function overloadedIsProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.ENABLE_REGISTRATION === "true";
}

interface CookieFlags {
  raw: string;
  present: boolean;
  secure: boolean;
  httpOnly: boolean;
  sameSiteLax: boolean;
}

function parseSetCookie(header: string | null): CookieFlags {
  const raw = header ?? "";
  return {
    raw,
    present: /connect\.sid=/.test(raw),
    secure: /;\s*Secure/i.test(raw),
    httpOnly: /;\s*HttpOnly/i.test(raw),
    sameSiteLax: /;\s*SameSite=Lax/i.test(raw),
  };
}

// ---------------------------------------------------------------------------
// A real server, in a real environment, issuing a real cookie
// ---------------------------------------------------------------------------

interface LoginResult {
  status: number;
  cookie: CookieFlags;
  /** Does the session actually work? Re-read the profile with the cookie we were given. */
  sessionPersists: boolean;
}

/**
 * Boot the real `setupAuth()` in a child process with the given environment, log in for real, and
 * read the `Set-Cookie` header off the wire.
 *
 * `forwardedProto` simulates the TLS-terminating proxy the app actually sits behind
 * (`app.set("trust proxy", 1)` — Render terminates TLS and sets `X-Forwarded-Proto`). Passing it is
 * what makes the production case a real production case; withholding it is what proves the cookie
 * never travels in plaintext.
 */
async function loginAgainst(
  env: Record<string, string | undefined>,
  credentials: { username: string; password: string },
  forwardedProto?: string,
): Promise<LoginResult> {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;

  const childEnv: NodeJS.ProcessEnv = { ...process.env, PORT: String(port) };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete childEnv[key];
    else childEnv[key] = value;
  }

  let child: ChildProcess | undefined;
  let output = "";

  try {
    child = spawn("npx", ["tsx", "server/tests/support/trust1-s2-cookie-app.ts"], {
      cwd: REPO_ROOT,
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const up = await new Promise<boolean>((resolve) => {
      const onChunk = (b: Buffer) => {
        output += b.toString();
        if (output.includes(`cookie-app listening on port ${port}`)) resolve(true);
      };
      child!.stdout!.on("data", onChunk);
      child!.stderr!.on("data", onChunk);
      setTimeout(() => resolve(false), 120_000);
    });

    if (!up) {
      throw new Error(`the cookie-app never listened.\n      tail: ${output.slice(-500)}`);
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (forwardedProto) headers["X-Forwarded-Proto"] = forwardedProto;

    const res = await fetch(`${base}/api/login`, {
      method: "POST",
      headers,
      body: JSON.stringify(credentials),
    });

    const cookie = parseSetCookie(res.headers.get("set-cookie"));

    // Does the session actually WORK? This is the assertion the trap would fail: with a secure
    // cookie over plaintext, login returns 200 and the browser is handed nothing, so the very next
    // request is anonymous. A 200 is not a session.
    let sessionPersists = false;
    if (cookie.present) {
      const sid = cookie.raw.split(";")[0];
      const profileHeaders: Record<string, string> = { cookie: sid };
      if (forwardedProto) profileHeaders["X-Forwarded-Proto"] = forwardedProto;
      const profile = await fetch(`${base}/api/user`, { headers: profileHeaders });
      sessionPersists = profile.status === 200;
    }

    return { status: res.status, cookie, sessionPersists };
  } finally {
    child?.kill("SIGKILL");
  }
}

async function main(): Promise<void> {
  console.log("\nTRUST1-S2 — the session cookie is Secure in production, and only in production\n");

  // -------------------------------------------------------------------------
  // 1. UNIT — the policy is a function of NODE_ENV alone
  // -------------------------------------------------------------------------

  console.log("1. The cookie policy is keyed on NODE_ENV, and on nothing else");

  const MATRIX: {
    nodeEnv: string | undefined;
    enableRegistration: string | undefined;
    expectSecure: boolean;
    why: string;
  }[] = [
    { nodeEnv: "production", enableRegistration: undefined, expectSecure: true, why: "production" },
    { nodeEnv: "production", enableRegistration: "true", expectSecure: true, why: "production, registration open" },
    { nodeEnv: "production", enableRegistration: "false", expectSecure: true, why: "production, registration closed" },
    { nodeEnv: "development", enableRegistration: undefined, expectSecure: false, why: "local HTTP dev" },
    { nodeEnv: "development", enableRegistration: "true", expectSecure: false, why: "★ THE TRAP — local HTTP dev, registration enabled" },
    { nodeEnv: "test", enableRegistration: "true", expectSecure: false, why: "test runner" },
    { nodeEnv: undefined, enableRegistration: "true", expectSecure: false, why: "NODE_ENV unset" },
    { nodeEnv: undefined, enableRegistration: undefined, expectSecure: false, why: "nothing set at all" },
  ];

  for (const row of MATRIX) {
    withEnv({ NODE_ENV: row.nodeEnv, ENABLE_REGISTRATION: row.enableRegistration }, () => {
      const opts = sessionCookieOptions();

      check(
        `secure=${row.expectSecure} when NODE_ENV=${row.nodeEnv ?? "(unset)"} ` +
          `ENABLE_REGISTRATION=${row.enableRegistration ?? "(unset)"} — ${row.why}`,
        opts.secure === row.expectSecure,
        `got secure=${String(opts.secure)}`,
      );

      // The other two flags are preserved in EVERY environment. S2 must not disturb them.
      check(`  …and httpOnly is still true`, opts.httpOnly === true);
      check(`  …and sameSite is still "lax"`, opts.sameSite === "lax");
    });
  }

  // The assertion that proves we did not reuse the overloaded constant. There must EXIST an
  // environment where the old constant is true and the cookie is nevertheless not secure. If S2 had
  // reused `isProduction`, these two would be equal here and local dev login would be broken.
  console.log("\n   The divergence — where the overloaded constant and the deployment check disagree");

  withEnv({ NODE_ENV: "development", ENABLE_REGISTRATION: "true" }, () => {
    check(
      "the overloaded `isProduction` predicate is TRUE here (it keys on ENABLE_REGISTRATION)",
      overloadedIsProduction() === true,
    );
    check(
      "…and `isProductionDeployment()` is FALSE here — the two are NOT the same fact",
      isProductionDeployment() === false,
    );
    check(
      "…so the cookie is NOT secure, and local HTTP login is not broken",
      sessionCookieOptions().secure === false,
      "S2 has been wired to the registration flag. Local HTTP login is now silently broken.",
    );
  });

  check(
    "the session lifetime is unchanged by S2 (7 days)",
    SESSION_MAX_AGE_MS === 7 * 24 * 60 * 60 * 1000 &&
      sessionCookieOptions().maxAge === 7 * 24 * 60 * 60 * 1000,
  );

  // -------------------------------------------------------------------------
  // 2. SOURCE — the flag is computed, never hardcoded, never wired to the trap
  // -------------------------------------------------------------------------

  console.log("\n2. The flag is computed — not hardcoded, and not wired to the registration flag");

  // Interrogate the REAL runtime functions, not a regex over a file. `Function.prototype.toString()`
  // returns the actual body that will actually execute.
  check(
    "isProductionDeployment() reads NODE_ENV",
    isProductionDeployment.toString().includes("NODE_ENV"),
  );

  check(
    "isProductionDeployment() does NOT read ENABLE_REGISTRATION",
    !isProductionDeployment.toString().includes("ENABLE_REGISTRATION"),
    "the deployment check has been wired to the registration flag — this is the S2 trap, live",
  );

  check(
    "sessionCookieOptions() does NOT read ENABLE_REGISTRATION",
    !sessionCookieOptions.toString().includes("ENABLE_REGISTRATION"),
  );

  // And the file itself carries no literal flag. Exempting nothing, not even prose: a rule with a
  // comment exemption is a rule with a hole in it.
  const authSource = readFileSync(new URL("../auth.ts", import.meta.url), "utf-8");

  check(
    "server/auth.ts hardcodes no `secure` cookie value anywhere — it is always computed",
    !/secure:\s*(true|false)\b/.test(authSource),
    "a literal secure flag is back in auth.ts. It must be a function of the environment.",
  );

  check(
    "the session cookie still declares httpOnly and sameSite in source",
    /httpOnly:\s*true/.test(authSource) && /sameSite:\s*"lax"/.test(authSource),
  );

  // -------------------------------------------------------------------------
  // 3. END-TO-END — the real Set-Cookie header, off the wire
  // -------------------------------------------------------------------------

  console.log("\n3. The real `Set-Cookie` header, read off the wire from a real login");

  if (!process.env.DATABASE_URL) {
    console.warn(
      "  ! SKIPPED — no DATABASE_URL, so no real login can be driven.\n" +
        "    These assertions did NOT run. This is not a pass. Run where a database is reachable.",
    );
  } else {
    const username = `trust1-s2-${randomBytes(6).toString("hex")}@test.invalid`;
    const password = "correct-horse-battery-staple";

    const scryptAsync = promisify(scrypt);
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;

    // Both flags true so this user can log in under EVERY configuration below: dev login is
    // beta-gated (`!isProduction && !user.isBetaUser` → 403) and production login is
    // verification-gated (`isProduction && !user.emailVerified` → 403).
    const [created] = await db
      .insert(users)
      .values({
        username,
        password: `${buf.toString("hex")}.${salt}`,
        isBetaUser: true,
        emailVerified: true,
      })
      .returning();

    const credentials = { username, password };

    try {
      // ── A. Local development over plain HTTP ────────────────────────────────────────────────
      console.log("\n   A. Local development, plain HTTP");

      const dev = await loginAgainst({ NODE_ENV: "development", ENABLE_REGISTRATION: undefined }, credentials);

      check("login succeeds", dev.status === 200, `status ${dev.status}`);
      check("a session cookie is issued", dev.cookie.present, `Set-Cookie: ${dev.cookie.raw || "(none)"}`);
      check("the cookie is NOT Secure — it would be discarded over HTTP", !dev.cookie.secure, dev.cookie.raw);
      check("the cookie is HttpOnly", dev.cookie.httpOnly, dev.cookie.raw);
      check("the cookie is SameSite=Lax", dev.cookie.sameSiteLax, dev.cookie.raw);
      check("the session PERSISTS — GET /api/user with the cookie returns 200", dev.sessionPersists);

      // ── B. THE TRAP: local development with ENABLE_REGISTRATION=true ────────────────────────
      console.log("\n   B. ★ Local development with ENABLE_REGISTRATION=true — the regression this task can introduce");

      const trap = await loginAgainst({ NODE_ENV: "development", ENABLE_REGISTRATION: "true" }, credentials);

      check("login succeeds", trap.status === 200, `status ${trap.status}`);
      check(
        "a session cookie is STILL issued",
        trap.cookie.present,
        "NO Set-Cookie header. express-session refused to send a secure cookie over plaintext — " +
          "the S2 trap is live and local login is silently broken.",
      );
      check(
        "the cookie is STILL NOT Secure, despite ENABLE_REGISTRATION=true",
        !trap.cookie.secure,
        `Set-Cookie: ${trap.cookie.raw} — the cookie has been wired to the registration flag.`,
      );
      check("the cookie is HttpOnly", trap.cookie.httpOnly, trap.cookie.raw);
      check("the cookie is SameSite=Lax", trap.cookie.sameSiteLax, trap.cookie.raw);
      check(
        "the session PERSISTS — local HTTP development still works",
        trap.sessionPersists,
        "login returned 200 but established no session. This is exactly the trap's symptom.",
      );

      // ── C. Production, behind the TLS-terminating proxy ─────────────────────────────────────
      console.log("\n   C. Production, behind the configured proxy (X-Forwarded-Proto: https)");

      const prod = await loginAgainst(
        { NODE_ENV: "production", ENABLE_REGISTRATION: undefined },
        credentials,
        "https",
      );

      check("login succeeds", prod.status === 200, `status ${prod.status}`);
      check("a session cookie is issued", prod.cookie.present, `Set-Cookie: ${prod.cookie.raw || "(none)"}`);
      check(
        "the cookie IS Secure — this is the defect S2 closes",
        prod.cookie.secure,
        `Set-Cookie: ${prod.cookie.raw}`,
      );
      check("the cookie is HttpOnly", prod.cookie.httpOnly, prod.cookie.raw);
      check("the cookie is SameSite=Lax", prod.cookie.sameSiteLax, prod.cookie.raw);
      check(
        "the session PERSISTS — production login is not broken by the flag",
        prod.sessionPersists,
        "the secure cookie was issued but the session does not work — `trust proxy` may be misconfigured",
      );
      check(
        "all three flags are present together on one real header",
        prod.cookie.secure && prod.cookie.httpOnly && prod.cookie.sameSiteLax,
        `Set-Cookie: ${prod.cookie.raw}`,
      );

      // ── D. Production over plaintext: the cookie must NOT travel ────────────────────────────
      console.log("\n   D. Production, but the request somehow arrives over plaintext HTTP");

      const downgraded = await loginAgainst(
        { NODE_ENV: "production", ENABLE_REGISTRATION: undefined },
        credentials,
        // no X-Forwarded-Proto — as if a request bypassed or downgraded past the TLS terminator
      );

      check(
        "NO session cookie is issued over plaintext in production — it fails CLOSED",
        !downgraded.cookie.present,
        `a cookie was sent in the clear: ${downgraded.cookie.raw}`,
      );
      check(
        "…which is the whole point: the session cookie can no longer be observed on the network",
        !downgraded.cookie.secure && !downgraded.cookie.present,
      );
    } finally {
      await db.delete(users).where(eq(users.id, created.id));
      console.log(`\n  · cleaned up throwaway user ${created.id}`);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
