/**
 * test-trust1-s8-p8-no-secret-disclosure.ts — TRUST1-S8 + TRUST1-P8
 * ==================================================================
 * S8 and P8 are ONE information-disclosure pathway with two halves, which is why they are tested
 * in one file:
 *
 *   1. `sanitizeUser` was a DENYLIST. It stripped `password`, `emailVerificationToken` and
 *      `emailVerificationExpires` — but not `passwordResetToken` / `passwordResetExpires`, which
 *      are columns on the very same `users` row. So `GET /api/user` returned a LIVE, single-use
 *      password-reset token to any client holding a session.                            (S8)
 *
 *   2. The request logger monkey-patched `res.json`, captured every response body, and appended it
 *      verbatim to the log line. So that reset token — and every weight, BMI, mood score, child's
 *      name and child's allergy the API has ever returned — was written in plaintext to stdout. (P8)
 *
 * Either fix alone leaves a real exposure. Fix only S8 and the log still carries every other
 * personal field. Fix only P8 and the token is still handed to the browser, the network tab, and
 * any proxy in between. **A reset token in a log is a password reset available to anyone who can
 * read logs** — so the two are closed together, and tested together.
 *
 * The proof runs at three levels, because each catches what the others cannot:
 *
 *   1. UNIT        — the serialiser is an allowlist, and is EXHAUSTIVE over the real `users` table.
 *   2. SOURCE      — no response-body capture has been reintroduced anywhere in `server/`.
 *   3. END-TO-END  — a REAL password reset is triggered against a REAL server, the REAL token is
 *                    read back out of the database, and we prove that exact string appears in
 *                    neither any API response nor any log line.
 *
 * The end-to-end check is the one that matters. A unit test proves the serialiser is correct; only
 * driving the actual reset flow proves the token that actually gets minted never actually escapes.
 *
 *   npm run test:trust1-s8-p8-no-secret-disclosure
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { getTableColumns } from "drizzle-orm";
import { eq } from "drizzle-orm";

import { db } from "../db.js";
import { users } from "../../shared/schema.js";
import {
  sanitizeUser,
  SAFE_USER_FIELDS,
  SECRET_USER_FIELDS,
} from "../lib/sanitizeUser.js";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SELF = "server/tests/test-trust1-s8-p8-no-secret-disclosure.ts";

/** Personal-data and credential field names that must never appear in a log line. */
const MUST_NEVER_BE_LOGGED = [
  "passwordResetToken",
  "passwordResetExpires",
  "emailVerificationToken",
  "weight",
  "bmi",
  "sleepHours",
  "mood",
  "allergy",
  "hardRestrictions",
];

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

/**
 * Ask the OS for a free ephemeral port, then release it and hand it to the server under test.
 *
 * The server needs a REAL port — the end-to-end proof is worthless without real HTTP. But it must
 * not be a *fixed* one: a hardcoded port collides with whatever else is listening, and on Replit it
 * is worse than that — the platform watches for new listening ports and rewrites `.replit` to add a
 * mapping for each one. A test that mutates tracked deployment config as a side effect of running
 * is a test that will one day be committed by `deploy.sh`'s `git add -A` (TRUST1-O7), by nobody,
 * on purpose, at no point. Ephemeral ports are in a range the platform does not map.
 */
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

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listSourceFiles(full));
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry)) out.push(full);
  }
  return out;
}

async function main(): Promise<void> {
  console.log("\nTRUST1-S8 + P8 — the reset token never leaves, and no response body is logged\n");

  // -------------------------------------------------------------------------
  // 1. S8 — the serialiser is an allowlist, and it is exhaustive
  // -------------------------------------------------------------------------

  console.log("1. sanitizeUser() is an allowlist over the real `users` table");

  // The exhaustiveness check. THIS is the assertion that stops the NEXT leak: add a column to
  // `users`, classify it in neither list, and this fails until somebody makes a decision about it.
  // The denylist failed precisely because a new column defaulted to VISIBLE. Here it defaults to
  // absent, and the absence is loud.
  const actualColumns = Object.keys(getTableColumns(users)).sort();
  const classified = [...SAFE_USER_FIELDS, ...SECRET_USER_FIELDS].sort();

  const unclassified = actualColumns.filter((c) => !classified.includes(c as never));
  const phantom = classified.filter((c) => !actualColumns.includes(c));

  check(
    `every column of \`users\` is classified as safe or secret (${actualColumns.length} columns)`,
    unclassified.length === 0,
    `UNCLASSIFIED: ${unclassified.join(", ")}\n      ` +
      `Add each to SAFE_USER_FIELDS or SECRET_USER_FIELDS in server/lib/sanitizeUser.ts. ` +
      `Until you do, it is withheld — which is the safe default, and this failure is the prompt.`,
  );

  check(
    "no classified field is a phantom (every listed field really exists on `users`)",
    phantom.length === 0,
    `listed but not on the table: ${phantom.join(", ")} — the classification is stale`,
  );

  check(
    "the two lists are disjoint — no field is both safe and secret",
    !SAFE_USER_FIELDS.some((f) => (SECRET_USER_FIELDS as readonly string[]).includes(f)),
  );

  // Build a full row with a sentinel in every secret field.
  const RESET_SENTINEL = "RESET-TOKEN-MUST-NEVER-LEAK-a1b2c3";
  const fullRow: Record<string, unknown> = {};
  for (const c of actualColumns) fullRow[c] = `value-of-${c}`;
  fullRow.id = 4242;
  fullRow.password = "SCRYPT-HASH-MUST-NEVER-LEAK";
  fullRow.passwordResetToken = RESET_SENTINEL;
  fullRow.emailVerificationToken = "VERIFY-TOKEN-MUST-NEVER-LEAK";

  const sanitised = sanitizeUser(fullRow as never)!;
  const sanitisedKeys = Object.keys(sanitised).sort();
  const serialised = JSON.stringify(sanitised);

  for (const secret of SECRET_USER_FIELDS) {
    check(
      `sanitizeUser strips \`${secret}\``,
      !(secret in (sanitised as Record<string, unknown>)),
    );
  }

  check(
    "the serialised output contains no reset-token value",
    !serialised.includes(RESET_SENTINEL),
    `the sentinel survived serialisation: ${serialised.slice(0, 200)}`,
  );

  check(
    "sanitizeUser returns EXACTLY the allowlist — no field it was not told about",
    sanitisedKeys.length === [...SAFE_USER_FIELDS].sort().length &&
      sanitisedKeys.every((k, i) => k === [...SAFE_USER_FIELDS].sort()[i]),
    `got: ${sanitisedKeys.join(", ")}`,
  );

  // Allowlist, not denylist: a field the serialiser has never heard of must be DROPPED, not passed
  // through. This is the behavioural difference between the two designs, and it is the whole fix.
  const withUnknownColumn = sanitizeUser({
    ...fullRow,
    someColumnAddedNextTuesday: "SHOULD-NOT-APPEAR",
  } as never)!;
  check(
    "a field the allowlist has never heard of is DROPPED, not passed through",
    !("someColumnAddedNextTuesday" in (withUnknownColumn as Record<string, unknown>)),
    "the serialiser is still behaving as a denylist — an unknown field survived",
  );

  check("sanitizeUser(null) is null", sanitizeUser(null) === null);

  check(
    "the product still works — safe fields are preserved",
    (sanitised as Record<string, unknown>).id === 4242 &&
      (sanitised as Record<string, unknown>).username === "value-of-username" &&
      "subscriptionTier" in (sanitised as Record<string, unknown>),
  );

  // -------------------------------------------------------------------------
  // 2. P8 — no response-body capture survives anywhere in the server
  // -------------------------------------------------------------------------

  console.log("\n2. No API response body is captured for logging, anywhere in `server/`");

  // The exact shape of the defect: reassigning res.json to capture the body, then stringifying it
  // into a log line. This is the pattern check that stops the NEXT reintroduction, not merely this
  // one — a developer who "helpfully" restores response logging to debug something trips it.
  const BODY_CAPTURE_PATTERNS: readonly [RegExp, string][] = [
    [/res\.json\s*=/, "reassigns res.json (the monkey-patch that captured every response body)"],
    [/capturedJsonResponse/, "the captured-body variable from the original defect"],
    [/logLine\s*\+=/, "appends to a log line (this is how the body got in)"],
  ];

  const captureHits: string[] = [];
  let filesScanned = 0;

  for (const file of listSourceFiles(join(REPO_ROOT, "server"))) {
    const rel = relative(REPO_ROOT, file);
    if (rel === SELF) continue; // this file names the patterns, by design
    filesScanned++;

    readFileSync(file, "utf-8")
      .split("\n")
      .forEach((line, idx) => {
        for (const [pattern, why] of BODY_CAPTURE_PATTERNS) {
          if (pattern.test(line)) captureHits.push(`${rel}:${idx + 1} — ${why}\n        ${line.trim()}`);
        }
      });
  }

  check(
    `scanned a non-trivial source surface (${filesScanned} files under server/)`,
    filesScanned > 100,
    `only ${filesScanned} files — the scan root is wrong, so a PASS here means nothing`,
  );

  check(
    "no response-body capture or body-append exists anywhere in server/",
    captureHits.length === 0,
    captureHits.join("\n      "),
  );

  // -------------------------------------------------------------------------
  // 3. END-TO-END — a real reset, a real token, a real server, a real log
  // -------------------------------------------------------------------------

  console.log("\n3. A real password reset leaks its token into neither a response nor a log");

  if (!process.env.DATABASE_URL) {
    console.warn(
      "  ! SKIPPED — no DATABASE_URL, so no real reset can be driven.\n" +
        "    These assertions did NOT run. This is not a pass. Run where a database is reachable.",
    );
  } else {
    const PORT = await freePort();
    const BASE = `http://127.0.0.1:${PORT}`;
    const username = `trust1-s8p8-${randomBytes(6).toString("hex")}@test.invalid`;
    const password = "correct-horse-battery-staple";

    // Create a throwaway user. It is deleted in the `finally` below, whatever happens.
    const scryptAsync = promisify(scrypt);
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const [created] = await db
      .insert(users)
      .values({
        username,
        password: `${buf.toString("hex")}.${salt}`,
        isBetaUser: true, // login is beta-gated outside production
        emailVerified: true,
      })
      .returning();

    let child: ChildProcess | undefined;
    let serverLog = "";

    try {
      // SMTP is deliberately unconfigured for this child: `setPasswordResetToken` runs BEFORE
      // `sendPasswordResetEmail`, so the token is still minted and stored — and no real email is
      // sent to anybody. A test must not have outward-facing side effects.
      const env: NodeJS.ProcessEnv = { ...process.env, PORT: String(PORT), NODE_ENV: "development" };
      delete env.SMTP_USER;
      delete env.SMTP_PASS;

      child = spawn("npx", ["tsx", "server/index.ts"], {
        cwd: REPO_ROOT,
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const listening = new Promise<boolean>((resolve) => {
        const onChunk = (b: Buffer) => {
          serverLog += b.toString();
          if (serverLog.includes(`serving on port ${PORT}`)) resolve(true);
        };
        child!.stdout!.on("data", onChunk);
        child!.stderr!.on("data", onChunk);
        setTimeout(() => resolve(false), 120_000);
      });

      const up = await listening;
      check("the server came up", up, `it never listened.\n      tail: ${serverLog.slice(-400)}`);

      if (up) {
        // ── Trigger a REAL password reset ────────────────────────────────────────────────────
        const forgotRes = await fetch(`${BASE}/api/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const forgotBody = await forgotRes.text();

        // Read the token that was actually minted. This is the real bearer credential.
        const [row] = await db.select().from(users).where(eq(users.id, created.id));
        const realToken = row?.passwordResetToken ?? "";

        check(
          "the reset actually happened — a real token was minted and stored",
          realToken.length >= 32,
          "no token in the DB, so everything below would be asserting nothing",
        );

        check(
          "the /api/forgot-password response does not contain the token",
          realToken.length > 0 && !forgotBody.includes(realToken),
          `body was: ${forgotBody}`,
        );

        // ── Log in and read the profile — the route that used to hand the token out ──────────
        const loginRes = await fetch(`${BASE}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const loginBody = await loginRes.text();
        const cookie = (loginRes.headers.get("set-cookie") ?? "").split(";")[0];

        check("the throwaway user can log in", loginRes.status === 200, `status ${loginRes.status}: ${loginBody}`);

        check(
          "the /api/login response does not contain the token",
          realToken.length > 0 && !loginBody.includes(realToken),
        );

        const userRes = await fetch(`${BASE}/api/user`, { headers: { cookie } });
        const userBody = await userRes.text();

        check("GET /api/user returns the profile", userRes.status === 200, `status ${userRes.status}`);

        // THE ASSERTION. Before S8 this response carried the live reset token.
        check(
          "GET /api/user does NOT contain the live reset token",
          realToken.length > 0 && !userBody.includes(realToken),
          `THE TOKEN LEAKED INTO THE RESPONSE.\n      body: ${userBody.slice(0, 400)}`,
        );

        for (const field of ["passwordResetToken", "passwordResetExpires", "password", "emailVerificationToken"]) {
          check(
            `GET /api/user carries no \`${field}\` field`,
            !userBody.includes(`"${field}"`),
            `body: ${userBody.slice(0, 400)}`,
          );
        }

        // ── The log ─────────────────────────────────────────────────────────────────────────
        await new Promise((r) => setTimeout(r, 500)); // let the finish handlers flush

        check(
          "the live reset token appears NOWHERE in the server log",
          realToken.length > 0 && !serverLog.includes(realToken),
          "THE TOKEN REACHED THE LOG — this is the compound S8+P8 defect, still open",
        );

        check(
          "no API response body was appended to any log line",
          !/ :: \{/.test(serverLog),
          `found a body-append. sample: ${(serverLog.match(/.* :: \{.*/) ?? [""])[0].slice(0, 200)}`,
        );

        for (const field of MUST_NEVER_BE_LOGGED) {
          check(`no \`${field}\` appears in the log`, !serverLog.includes(`"${field}"`));
        }

        // ── …and the log is still USEFUL. A silent log is not a fixed log. ──────────────────
        check(
          "logging remains operational — the request line is still emitted",
          /GET \/api\/user 200 in \d+ms/.test(serverLog),
          `expected an operational line for GET /api/user.\n      tail: ${serverLog.slice(-600)}`,
        );

        check(
          "the operational line carries method, path, status and duration",
          /POST \/api\/forgot-password 200 in \d+ms/.test(serverLog),
          `tail: ${serverLog.slice(-600)}`,
        );
      }
    } finally {
      child?.kill("SIGKILL");
      await db.delete(users).where(eq(users.id, created.id));
      console.log(`  · cleaned up throwaway user ${created.id}`);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
