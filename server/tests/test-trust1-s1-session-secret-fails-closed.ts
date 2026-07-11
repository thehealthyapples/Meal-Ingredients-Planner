/**
 * test-trust1-s1-session-secret-fails-closed.ts — TRUST1-S1
 * =========================================================
 * The session secret signs every session cookie, so it *is* the user's identity. Before TRUST1-S1
 * it fell back, whenever the environment variable was unset, to a literal committed to this
 * repository — and nothing acted on the absence: `server/index.ts` detected the missing variable,
 * logged it, pushed it into a `missing[]` array — and booted anyway.
 *
 * So a single unset environment variable silently downgraded the platform to a signing key that is
 * published in this repository, permanently, in every clone and fork. Anyone holding it could forge
 * a session cookie for any account, including an admin's. That is a total authentication bypass
 * gated on a configuration mistake, and a configuration mistake is not a safe thing to gate it on.
 *
 * This test asserts the fix in three independent ways, because each catches what the others cannot:
 *
 *   1. UNIT      — `requireSessionSecret()` refuses absence, emptiness, and the burned value.
 *   2. SOURCE    — the burned literal exists nowhere in any executable tree, and no
 *                  `SESSION_SECRET` fallback has been reintroduced anywhere.
 *   3. END-TO-END— the real server, spawned as a real child process, exits non-zero without the
 *                  variable and boots normally with it.
 *
 * The unit check proves the guard is correct. The source scan proves nobody has quietly added a
 * second, different fallback somewhere else — a behavioural test can only prove the branches it
 * thinks to exercise, and this defect is precisely a branch nobody thought about. The end-to-end
 * check proves the guard is actually WIRED IN: a correct function that no boot path calls is what
 * `platform-status.ts` already was, and it protected nobody for as long as nothing imported it.
 *
 * ── WHY THIS FILE NEVER CONTAINS THE BURNED STRING ──────────────────────────────────────────────
 * A test that greps for a secret by pasting the secret into itself has not removed the secret from
 * the repository — it has moved it. The needle is therefore reassembled from fragments at runtime,
 * and the assembly is verified against a SHA-256 digest before it is used. If someone mistypes a
 * fragment, the guard-on-the-guard below fails LOUDLY rather than scanning for a string that does
 * not exist and reporting a cheerful all-clear.
 *
 *   npm run test:trust1-s1-session-secret
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** Every tree that ships or runs. A fallback secret in any of these is executable. */
const SCANNED_TREES = ["server", "client", "shared", "scripts", "script"];

/** SHA-256 of the compromised literal that TRUST1-S1 removed from `server/auth.ts:41`. */
const BURNED_SESSION_SECRET_SHA256 =
  "73d30df8ac62143a2a5e3f39732f6938ff20defa9b66626262e1d309936ae140";

/** Reassembled at runtime so the literal itself is never written into this repository again. */
const BURNED_SESSION_SECRET = ["r3pl1t", "_s3cr3t", "_k3y_", "123456"].join("");

/** This test file is the one place the burned string may legitimately exist, in fragments. */
const SELF = "server/tests/test-trust1-s1-session-secret-fails-closed.ts";

/**
 * The exact shape of the defect: the environment variable, then `||` or `??`, then a default.
 * This is the pattern check that stops the NEXT fallback, not merely this one — a future developer
 * who "helpfully" restores a default to make a test pass trips it immediately.
 *
 * It exempts NOTHING, not even comments. A rule with a comment exemption is a rule with a hole in
 * it, and prose that reproduces the shape is prose that makes the rule unusable. Describe the
 * defect in words; never write it out.
 */
const FALLBACK_PATTERN = /SESSION_SECRET\s*(\|\||\?\?)/;

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

/** Assert that `fn` throws, and that its message says something a human can act on. */
function throws(fn: () => unknown): { threw: boolean; message: string } {
  try {
    fn();
    return { threw: false, message: "" };
  } catch (err) {
    return { threw: true, message: err instanceof Error ? err.message : String(err) };
  }
}

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs|json)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

interface BootResult {
  readonly exitCode: number | null;
  readonly output: string;
  readonly startedListening: boolean;
}

/** Spawn the real server as a real process and report what it actually did. */
function boot(env: NodeJS.ProcessEnv, timeoutMs = 90_000): Promise<BootResult> {
  return new Promise((resolve) => {
    const child = spawn("npx", ["tsx", "server/index.ts"], {
      cwd: REPO_ROOT,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let settled = false;

    const finish = (exitCode: number | null, startedListening: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      resolve({ exitCode, output, startedListening });
    };

    const onChunk = (buf: Buffer) => {
      output += buf.toString();
      // The success path never exits on its own — it listens forever. Stop as soon as it has.
      if (/serving on port/.test(output)) finish(null, true);
    };

    child.stdout.on("data", onChunk);
    child.stderr.on("data", onChunk);
    child.on("exit", (code) => finish(code, false));

    const timer = setTimeout(() => finish(null, false), timeoutMs);
  });
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("\nTRUST1-S1 — the session secret fails closed\n");

  // -------------------------------------------------------------------------
  // 0. Guard on the guard
  // -------------------------------------------------------------------------
  // If the fragments above are ever mistyped, every scan below would search for a string that does
  // not exist and pass triumphantly. Prove the needle is the right needle before using it.

  console.log("0. The needle is the burned secret");

  check(
    "the reassembled needle matches the recorded digest of the compromised literal",
    createHash("sha256").update(BURNED_SESSION_SECRET).digest("hex") === BURNED_SESSION_SECRET_SHA256,
    "the fragments no longer assemble to the burned secret — every scan below is now vacuous",
  );

  // -------------------------------------------------------------------------
  // 1. Unit — the guard itself
  // -------------------------------------------------------------------------

  console.log("\n1. requireSessionSecret() fails closed");

  // Imported dynamically: `server/auth.ts` reaches the DB pool through `./storage`, and the import
  // must therefore happen after we know DATABASE_URL is present (it does not connect, only construct).
  const { requireSessionSecret } = await import("../auth.js");

  const originalSecret = process.env.SESSION_SECRET;

  try {
    delete process.env.SESSION_SECRET;
    const unset = throws(() => requireSessionSecret());
    check("throws when SESSION_SECRET is unset", unset.threw);
    check(
      "the unset error names the variable and says how to generate one",
      unset.message.includes("SESSION_SECRET") && unset.message.includes("openssl rand"),
      `message was: ${JSON.stringify(unset.message)}`,
    );

    // `SESSION_SECRET= npm run dev` sets an EMPTY STRING, not an unset variable. The old fallback
    // treated both identically — as a cue to use the published key. So must this guard.
    process.env.SESSION_SECRET = "";
    check("throws when SESSION_SECRET is the empty string", throws(() => requireSessionSecret()).threw);

    process.env.SESSION_SECRET = "   ";
    check("throws when SESSION_SECRET is whitespace only", throws(() => requireSessionSecret()).threw);

    // Rotation, not deletion, is what actually closed this defect: the string is in this repository's
    // git history forever and cannot be unpublished. Refusing it at boot is what makes it burned.
    process.env.SESSION_SECRET = BURNED_SESSION_SECRET;
    const burned = throws(() => requireSessionSecret());
    check("throws when SESSION_SECRET is set to the burned, previously-hardcoded value", burned.threw);
    check(
      "the burned-value error tells the operator to rotate",
      burned.message.toLowerCase().includes("rotate"),
      `message was: ${JSON.stringify(burned.message)}`,
    );

    process.env.SESSION_SECRET = "a-perfectly-ordinary-high-entropy-secret-value";
    check(
      "returns the secret unchanged when it is properly set",
      requireSessionSecret() === "a-perfectly-ordinary-high-entropy-secret-value",
    );
  } finally {
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
  }

  // -------------------------------------------------------------------------
  // 2. Source — no fallback secret survives anywhere
  // -------------------------------------------------------------------------

  console.log("\n2. No hardcoded fallback secret remains in any executable tree");

  const burnedHits: string[] = [];
  const fallbackHits: string[] = [];
  let filesScanned = 0;

  for (const tree of SCANNED_TREES) {
    const root = join(REPO_ROOT, tree);
    if (!existsSync(root)) continue;

    for (const file of listSourceFiles(root)) {
      const rel = relative(REPO_ROOT, file);
      if (rel === SELF) continue; // this file holds the needle, in fragments, by design
      filesScanned++;

      const source = readFileSync(file, "utf-8");
      if (source.includes(BURNED_SESSION_SECRET)) burnedHits.push(rel);

      source.split("\n").forEach((line, idx) => {
        if (FALLBACK_PATTERN.test(line)) fallbackHits.push(`${rel}:${idx + 1}  ${line.trim()}`);
      });
    }
  }

  check(
    `scanned a non-trivial source surface (${filesScanned} files across ${SCANNED_TREES.join(", ")})`,
    filesScanned > 200,
    `only ${filesScanned} files found — the scan roots are probably wrong, so a PASS here means nothing`,
  );

  check(
    "the burned secret appears in no executable source file",
    burnedHits.length === 0,
    burnedHits.join("\n      "),
  );

  check(
    "no SESSION_SECRET fallback exists anywhere",
    fallbackHits.length === 0,
    fallbackHits.join("\n      "),
  );

  // -------------------------------------------------------------------------
  // 3. End-to-end — the guard is actually wired into the real boot path
  // -------------------------------------------------------------------------
  // A correct guard that no boot path calls protects nobody. `auditStartupEnvironment()` was already
  // written, already correct, and imported by nothing at all — which is exactly how this defect
  // survived. So: spawn the real server, as a real process, and watch what it actually does.

  console.log("\n3. The real server refuses to boot without SESSION_SECRET");

  // Absent SESSION_SECRET. DATABASE_URL is retained: it is separately required, and without it the
  // process would die on the database import before ever reaching the check under test.
  const envWithoutSecret = { ...process.env };
  delete envWithoutSecret.SESSION_SECRET;
  envWithoutSecret.PORT = "0";

  const withoutSecret = await boot(envWithoutSecret);

  check(
    "the server exits non-zero when SESSION_SECRET is absent",
    withoutSecret.exitCode !== 0 && withoutSecret.exitCode !== null,
    `exit code was ${withoutSecret.exitCode}; it must refuse to start.\n      output tail: ${withoutSecret.output.slice(-400)}`,
  );

  check(
    "it never begins listening without SESSION_SECRET",
    !withoutSecret.startedListening,
    "the server started serving traffic with no session secret — this is the defect S1 exists to close",
  );

  check(
    "the failure names SESSION_SECRET and is actionable",
    /SESSION_SECRET/.test(withoutSecret.output) && /\.env\.example|openssl rand/.test(withoutSecret.output),
    `output tail: ${withoutSecret.output.slice(-400)}`,
  );

  console.log("\n4. The real server boots normally with SESSION_SECRET");

  // The success path needs a reachable database — the server runs migrations and seeds before it
  // listens. Where there is no DATABASE_URL there is nothing to boot, and a test that quietly passed
  // in that case would be asserting nothing. Skip LOUDLY instead.
  if (!process.env.DATABASE_URL) {
    console.warn(
      "  ! SKIPPED — no DATABASE_URL in this environment, so the server cannot complete a boot.\n" +
        "    This assertion did NOT run. It is not a pass. Run it where a database is reachable.",
    );
  } else {
    const withSecret = await boot({
      ...process.env,
      SESSION_SECRET: "test-only-secret-that-has-never-been-committed",
      PORT: "0",
    });

    check(
      "the server starts and serves when SESSION_SECRET is present",
      withSecret.startedListening,
      `it never reached "serving on port".\n      exit code: ${withSecret.exitCode}\n      output tail: ${withSecret.output.slice(-600)}`,
    );

    check(
      "the startup audit confirms every required variable is present",
      /All required env vars present/.test(withSecret.output),
      `output tail: ${withSecret.output.slice(-400)}`,
    );

    check(
      "it does not exit on the session-secret guard",
      !/Missing required environment variable/.test(withSecret.output),
      `output tail: ${withSecret.output.slice(-400)}`,
    );
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
