/**
 * test-trust1-o8-production-schema-protection.ts — TRUST1-O8
 * ==========================================================
 * THA had two owners of one schema, and only one of them was reviewed.
 *
 *   THE REVIEWED ONE   server/migrations/runner.ts — ordered, transactional, versioned, recorded
 *                      in `schema_migrations`, applied once at boot.
 *
 *   THE OTHER ONE      `drizzle-kit push --force` — a schema diff-and-sync with no review, no
 *                      transaction boundary, no version record, and an explicit `--force`. It ran
 *                      from `scripts/migrate-prod.sh` against the production DATABASE_URL, and it
 *                      ran automatically after EVERY GIT MERGE via `scripts/post-merge.sh` and
 *                      `.replit`'s `[postMerge]` hook.
 *
 * `push` reconciles the database to the code by DROPPING whatever the code does not mention. So a
 * git merge could destroy production data, and O8's coverage audit found that it very likely did:
 * `barcode_lookup_events` has existed in Postgres since April, is written to on every barcode scan,
 * and was never declared in `shared/schema.ts` — meaning every `push --force` since April was an
 * unattended offer to drop it and every row in it.
 *
 * ── WHAT THIS FILE DEFENDS ────────────────────────────────────────────────────────────────────────
 *
 * One rule: **a production schema changes in exactly one way — a reviewed migration appended to
 * `server/migrations/runner.ts`.** Nothing else may mutate a production schema.
 *
 * `push` is not deleted, because it cannot be: it is the only thing that can build the declarative
 * schema in `shared/schema.ts` from empty, which is what CI and a fresh dev database need. It
 * survives in exactly ONE file — `scripts/db/schema-push-guard.ts` — behind a gate that fails
 * closed and has no override for a managed host or for NODE_ENV=production.
 *
 * The tests below are in two halves, and both halves are necessary:
 *
 *   STATIC   the unsafe commands are gone from the merge path, the deploy path, and CI, and cannot
 *            reappear without failing this suite. This is a grep, and a grep is the right tool: the
 *            risk is a line of shell being pasted back in, not a subtle logic error.
 *
 *   LIVE     the guard actually refuses. A guard nobody executed is a comment. These call it.
 *
 * This suite touches no database and needs no DATABASE_URL. It is first in `npm test` because it is
 * the cheapest and it guards the most expensive mistake on the board.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertDisposableDatabase,
  UnsafeSchemaTargetError,
} from "../../scripts/db/schema-push-guard.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

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

function read(relPath: string): string {
  return readFileSync(resolve(REPO_ROOT, relPath), "utf8");
}

/**
 * Strip comment lines before grepping for a dangerous command.
 *
 * This matters more than it looks. Every file O8 touched EXPLAINS in a comment what it is no longer
 * allowed to do — `post-merge.sh` says "do not add db:push here", `runner.ts` mentions a constraint
 * once dropped by a push. A naive grep would flag all of that prose and the suite would be useless
 * theatre, so it would be deleted, and then nothing would guard the real thing.
 *
 * We test what EXECUTES, not what is written about.
 */
function executableLines(source: string): string {
  return source
    .split("\n")
    .filter(line => {
      const t = line.trim();
      if (t === "") return false;
      if (t.startsWith("#")) return false; // shell, YAML, TOML
      if (t.startsWith("//")) return false; // TS line comment
      if (t.startsWith("*") || t.startsWith("/*") || t.startsWith("*/")) return false; // TS block comment
      return true;
    })
    .join("\n");
}

/**
 * Does this file actually RUN a declarative schema push?
 *
 * The naive test — "does the text `drizzle-kit` appear?" — is useless, and failing it is what
 * taught us so: it flags package.json's own devDependency entry, drizzle.config.ts's import, and
 * every console.log that merely NAMES the command. A check that cries wolf on four innocent files
 * gets switched off, and then it guards nothing.
 *
 * So this matches the two shapes a push can actually take, and nothing else:
 *
 *   TS      it must shell out. Either the argv form — execFileSync("npx", ["drizzle-kit", "push"])
 *           — or an inline exec of a command string. A quoted "drizzle-kit" that is an IMPORT or a
 *           LOG LINE cannot execute anything and is not flagged.
 *
 *   OTHER   shell scripts, npm scripts, YAML and TOML spell the command literally, so match it
 *           literally. `"drizzle-kit": "^0.31.8"` in devDependencies has no ` push` after it and is
 *           correctly ignored; `"db:push": "drizzle-kit push"` is not.
 */
function invokesPush(relPath: string, source: string): boolean {
  const code = executableLines(source);

  if (relPath.endsWith(".ts")) {
    const argvForm = /\[\s*["'`]drizzle-kit["'`]/.test(code);
    const inlineExecForm = /exec\w*\(\s*["'`][^"'`\n]*drizzle-kit\s+push/.test(code);
    return argvForm || inlineExecForm;
  }

  return (
    /(?:^|[\s;&|"'`(])(?:npx\s+)?drizzle-kit\s+push/m.test(code) ||
    /npm\s+run\s+db:push/.test(code) ||
    /pnpm[^\n]*push-force/.test(code) // the other Drizzle stacks' spelling, for good measure
  );
}

async function main(): Promise<void> {
  console.log("\nTRUST1-O8 — production schema protection\n");

  // ── 0. The detector itself. ────────────────────────────────────────────────────────────────────
  // Everything in sections 1–4 is `!invokesPush(...)`. If invokesPush ever stopped matching, every
  // one of those checks would go green and the suite would report perfect safety while guarding
  // nothing — the exact failure mode of a grep-based test, and the reason they are so often worth
  // less than they look. So: prove it still bites, on the precise lines that were really there.
  console.log("The detector — it must still catch the commands that were actually in this repo");

  check(
    "catches the real post-merge.sh line (`npm run db:push`)",
    invokesPush("scripts/post-merge.sh", "#!/bin/bash\nset -e\nnpm install\nnpm run db:push\n"),
  );
  check(
    "catches the real migrate-prod.sh line (`npx drizzle-kit push --force`)",
    invokesPush("scripts/migrate-prod.sh", 'echo "pushing"\nnpx drizzle-kit push --force\n'),
  );
  check(
    "catches a package.json script that shells straight to drizzle-kit",
    invokesPush("package.json", '{ "scripts": { "db:push": "drizzle-kit push" } }'),
  );
  check(
    "catches the argv form in TypeScript (`execFileSync(\"npx\", [\"drizzle-kit\", \"push\"])`)",
    invokesPush("x.ts", 'execFileSync("npx", ["drizzle-kit", "push", "--force"], { cwd: R });'),
  );
  check(
    "catches an inline exec of the command string in TypeScript",
    invokesPush("x.ts", 'execSync("npx drizzle-kit push --force");'),
  );
  check(
    "does NOT flag a comment that merely names the command (or the suite gets deleted)",
    !invokesPush("x.ts", "// this column was dropped by a drizzle-kit push, hence the repair below"),
  );
  check(
    "does NOT flag package.json's devDependency on drizzle-kit",
    !invokesPush("package.json", '{ "devDependencies": { "drizzle-kit": "^0.31.8" } }'),
  );
  check(
    "does NOT flag drizzle.config.ts importing from the drizzle-kit package",
    !invokesPush("drizzle.config.ts", 'import { defineConfig } from "drizzle-kit";'),
  );

  // ── 1. The merge path. A git merge must never mutate a database. ───────────────────────────────
  console.log("The merge path — a git merge must never be able to mutate a database");

  const postMerge = read("scripts/post-merge.sh");
  check(
    "scripts/post-merge.sh does not run a schema push",
    !invokesPush("scripts/post-merge.sh", postMerge),
    "the post-merge hook is wired to .replit's [postMerge] and runs after EVERY merge",
  );
  check(
    "scripts/post-merge.sh does not shell out to psql or an ad-hoc DDL script either",
    !/psql|apply-.*\.ts|migrate/.test(executableLines(postMerge)),
  );

  const replit = read(".replit");
  check(
    ".replit runs no schema push anywhere (including [postMerge] and [deployment])",
    !invokesPush(".replit", replit),
  );
  check(
    ".replit's [postMerge] hook, if present, points only at the audited scripts/post-merge.sh",
    !/\[postMerge\]/.test(replit) || /path\s*=\s*"scripts\/post-merge\.sh"/.test(replit),
  );

  // ── 2. The deploy path. ────────────────────────────────────────────────────────────────────────
  console.log("\nThe deploy path — a deploy must not carry a schema mutation");

  check(
    "deploy.sh does not run a schema push",
    !invokesPush("deploy.sh", read("deploy.sh")),
  );
  check(
    "scripts/migrate-prod.sh is GONE — it ran `drizzle-kit push --force` at production",
    !existsSync(resolve(REPO_ROOT, "scripts/migrate-prod.sh")),
    "it was deleted by TRUST1-O8 and must not return; production migrations apply at boot",
  );
  check(
    "no CI workflow runs a raw drizzle-kit push (it must go through the guard)",
    !invokesPush(".github/workflows/ci.yml", read(".github/workflows/ci.yml")),
  );

  // ── 3. `drizzle-kit push` exists in exactly one file. ──────────────────────────────────────────
  console.log("\nOne mechanism — `drizzle-kit push` may be invoked from exactly one file");

  const GUARD = "scripts/db/schema-push-guard.ts";

  // Every file in the repository that could plausibly execute a push. Listed explicitly rather than
  // walked: a hardcoded list cannot be defeated by a new file in a directory the walker skipped,
  // and if someone adds a schema-mutating script they must also add it here — which is a code
  // review they cannot avoid.
  const EXECUTABLE_FILES = [
    "package.json",
    ".replit",
    "deploy.sh",
    "scripts/post-merge.sh",
    ".github/workflows/ci.yml",
    "scripts/ci/setup-test-database.ts",
    "scripts/ci/verify-schema-migration-coverage.ts",
    "server/migrations/runner.ts",
    "server/index.ts",
    "drizzle.config.ts",
    GUARD,
  ];

  const pushers = EXECUTABLE_FILES.filter(f => existsSync(resolve(REPO_ROOT, f)) && invokesPush(f, read(f)));

  check(
    `\`drizzle-kit push\` is invoked from exactly one file, and it is the guard`,
    pushers.length === 1 && pushers[0] === GUARD,
    `files invoking a push: ${pushers.length === 0 ? "(none — the guard itself should)" : pushers.join(", ")}`,
  );

  // package.json is the entry point everyone actually types. It must route through the guard.
  const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
  check(
    "`npm run db:push` routes through the guard, not straight at drizzle-kit",
    pkg.scripts["db:push"] === "tsx scripts/db/schema-push-guard.ts",
    `db:push is currently: ${pkg.scripts["db:push"]}`,
  );
  const rawPushScripts = Object.entries(pkg.scripts)
    .filter(([, body]) => /drizzle-kit\s+push/.test(body))
    .map(([name]) => name);
  check(
    "no npm script anywhere invokes drizzle-kit push directly",
    rawPushScripts.length === 0,
    `offending scripts: ${rawPushScripts.join(", ")}`,
  );

  // ── 4. Ad-hoc DDL scripts are gated. ───────────────────────────────────────────────────────────
  console.log("\nAd-hoc DDL — the scripts/apply-*.ts family cannot reach production");

  const AD_HOC_DDL = [
    "scripts/apply-canonical-tables.ts",
    "scripts/apply-companion-action-tables.ts",
    "scripts/apply-companion-goal-columns.ts",
    "scripts/apply-companion-guidance-tables.ts",
    "scripts/apply-knowledge-review-phase2-tables.ts",
    "scripts/apply-knowledge-review-phase3-columns.ts",
    "scripts/apply-knowledge-review-phase4-tables.ts",
    "scripts/apply-recipe-acquisition-columns.ts",
    "scripts/nk6o-add-family-column.ts",
  ];

  const ungated = AD_HOC_DDL.filter(f => existsSync(resolve(REPO_ROOT, f)) && !/guardAdHocDdl\(/.test(read(f)));
  check(
    `all ${AD_HOC_DDL.length} ad-hoc DDL scripts call guardAdHocDdl() before opening a pool`,
    ungated.length === 0,
    `ungated: ${ungated.join(", ")}`,
  );

  // ── 5. The canonical mechanism is still wired up. ──────────────────────────────────────────────
  // Removing the unsafe path is only half of convergence. If the safe path quietly stopped running,
  // O8 would have achieved nothing except a schema that never changes at all.
  console.log("\nThe canonical mechanism — the reviewed runner still applies migrations at boot");

  check(
    "server/index.ts calls runMigrations() at boot",
    /runMigrations\(\)/.test(executableLines(read("server/index.ts"))),
  );
  check(
    "server/migrations/runner.ts still exports runMigrations",
    /export\s+async\s+function\s+runMigrations/.test(read("server/migrations/runner.ts")),
  );
  check(
    "migrations are still recorded in schema_migrations (exactly-once is intact)",
    /INSERT INTO schema_migrations/.test(read("server/migrations/runner.ts")),
  );
  check(
    "each migration still runs inside a transaction",
    /"BEGIN"/.test(read("server/migrations/runner.ts")) && /"COMMIT"/.test(read("server/migrations/runner.ts")),
  );

  // ── 6. THE GUARD ACTUALLY REFUSES. ─────────────────────────────────────────────────────────────
  // Everything above is a grep. A grep proves the dangerous command is absent from a file; it does
  // not prove the replacement works. These execute the guard.
  console.log("\nThe guard itself — it must FAIL CLOSED, and it must not be overridable");

  function refuses(url: string | undefined, env: Record<string, string | undefined> = {}): boolean {
    const saved: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(env)) {
      saved[k] = process.env[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    try {
      assertDisposableDatabase(url, "test");
      return false; // it allowed the target
    } catch (err) {
      return err instanceof UnsafeSchemaTargetError;
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  }

  const NEON = "postgresql://u:p@ep-x-1.eu-west-2.aws.neon.tech/thadb?sslmode=require";
  const LOCAL = "postgres://postgres:postgres@localhost:5432/tha_ci";
  const UNKNOWN = "postgres://u:p@db.internal.example/thadb";
  const OVERRIDE = { ALLOW_SCHEMA_PUSH: "i-know-this-is-a-disposable-database" };

  check(
    "REFUSES a managed-provider host (neon.tech) — where production data lives",
    refuses(NEON, { NODE_ENV: "development" }),
  );
  check(
    "REFUSES a managed-provider host EVEN WITH the override set — there is no escape hatch",
    refuses(NEON, { NODE_ENV: "development", ...OVERRIDE }),
    "an override on the control between a typo and irreversible data loss is not a control",
  );
  check(
    "REFUSES when NODE_ENV=production, even for a localhost URL",
    refuses(LOCAL, { NODE_ENV: "production" }),
    "a schema push is not a deployment step, in any environment",
  );
  check(
    "REFUSES a missing DATABASE_URL",
    refuses(undefined, { NODE_ENV: "development" }),
  );
  check(
    "REFUSES an unparseable DATABASE_URL (it cannot prove the target is safe, so it says no)",
    refuses("not-a-connection-string", { NODE_ENV: "development" }),
  );
  check(
    "REFUSES an unrecognised remote host when the operator has not asserted it is disposable",
    refuses(UNKNOWN, { NODE_ENV: "development", ALLOW_SCHEMA_PUSH: undefined }),
  );
  check(
    "REFUSES an unrecognised host when the override phrase is merely truthy, not exact",
    refuses(UNKNOWN, { NODE_ENV: "development", ALLOW_SCHEMA_PUSH: "true" }),
    "`ALLOW_SCHEMA_PUSH=1` must not work — it is the kind of thing you set once and forget",
  );

  // …and it must still ALLOW the two legitimate targets, or CI and every dev cannot work.
  check(
    "ALLOWS localhost — CI's Postgres service container and a local dev database",
    !refuses(LOCAL, { NODE_ENV: "test" }),
  );
  check(
    "ALLOWS an unrecognised host when the operator states, exactly, that it is disposable",
    !refuses(UNKNOWN, { NODE_ENV: "development", ...OVERRIDE }),
  );

  // ── 7. The declarative schema declares everything the migrations create. ───────────────────────
  // A table drizzle finds in Postgres but NOT in shared/schema.ts is a table it offers to DROP.
  // This is the exact defect that exposed `barcode_lookup_events` for months. The push paths are
  // gone, but a dev push still exists — and, more importantly, this is the check that was missing.
  console.log("\nNo table is exposed to a DROP — everything a migration creates is declared");

  const schemaSrc = read("shared/schema.ts");
  const runnerSrc = read("server/migrations/runner.ts");

  // Array.from(..., mapFn) rather than [...spread]: tsconfig sets no `target`, so it defaults below
  // ES2015 and spreading an iterator needs --downlevelIteration. Array.from does not.
  const declared = new Set(
    Array.from(schemaSrc.matchAll(/pgTable\(\s*["'`]([A-Za-z0-9_]+)["'`]/g), m => m[1]),
  );
  const created = new Set(
    Array.from(
      runnerSrc.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?([A-Za-z0-9_]+)["'`]?/gi),
      m => m[1],
    ),
  );
  created.delete("schema_migrations"); // the runner's own bookkeeping; deliberately not in Drizzle

  const exposed = Array.from(created).filter(t => !declared.has(t)).sort();
  check(
    "every table created by a reviewed migration is declared in shared/schema.ts",
    exposed.length === 0,
    `exposed to a drizzle DROP: ${exposed.join(", ")}`,
  );

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
