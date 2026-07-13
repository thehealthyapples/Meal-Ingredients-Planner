/**
 * CPV1 — Canonical Publication Verification: reusable check library.
 *
 * Three families of executable evidence, all read-only:
 *   1. Source checks — regex assertions over an indexed snapshot of the
 *      application source (server/, shared/, client/src/, scripts/).
 *   2. Writer census — every file that writes a given table, held against the
 *      domain's declared Authorised Writers.
 *   3. Database checks — live SELECT-only counts held against what the
 *      canonical owner declares. A check that cannot reach the database
 *      reports "skipped", never a verdict.
 */

import fs from "node:fs";
import path from "node:path";
import type {
  CheckEvaluation,
  PublicationCheck,
  PublicationLaw,
  VerificationContext,
} from "./publication-types";

// ── Source index ─────────────────────────────────────────────────────────────

const SCAN_ROOTS = ["server", "shared", "scripts", "client/src"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);
const EXCLUDED_DIRS = new Set(["node_modules", "dist", ".git", "coverage"]);
/**
 * The verifier must never count itself or the test harness as a runtime
 * writer: tests exercise tables deliberately, and this module quotes the
 * patterns it searches for. Reviewed migrations are the platform's sanctioned
 * DDL path and are censused by the migration-coverage check, not per domain.
 */
const CENSUS_EXCLUDED_PREFIXES = [
  "server/verification/",
  "server/tests/",
  "server/migrations/",
];

export function buildSourceIndex(repoRoot: string): Map<string, string> {
  const index = new Map<string, string>();
  const walk = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
        continue;
      }
      if (!SCAN_EXTENSIONS.has(path.extname(entry.name))) continue;
      const abs = path.join(dir, entry.name);
      const rel = path.relative(repoRoot, abs).split(path.sep).join("/");
      try {
        index.set(rel, fs.readFileSync(abs, "utf8"));
      } catch {
        // Unreadable file: leave it out rather than fail the whole sweep.
      }
    }
  };
  for (const root of SCAN_ROOTS) walk(path.join(repoRoot, root));
  return index;
}

// ── Check factories ──────────────────────────────────────────────────────────

interface BaseCheckSpec {
  id: string;
  law: PublicationLaw;
  title: string;
  severity: "fail" | "warn";
  cpi1?: string;
}

/**
 * Asserts a pattern is absent from (or present in) a single source file.
 * `expect: "absent"` — the pattern is a defect; matching it is a violation.
 * `expect: "present"` — the pattern is load-bearing; losing it is a violation.
 */
export function sourceCheck(
  spec: BaseCheckSpec & {
    file: string;
    pattern: RegExp;
    expect: "absent" | "present";
    violationDetail: string;
    passDetail: string;
  },
): PublicationCheck {
  return {
    ...spec,
    run: async (ctx) => {
      const content = ctx.sources.get(spec.file);
      if (content === undefined) {
        return spec.expect === "present"
          ? { violated: true, detail: `${spec.file} not found — ${spec.violationDetail}` }
          : { violated: false, detail: `${spec.file} not found; pattern cannot be present.` };
      }
      const matched = spec.pattern.test(content);
      const violated = spec.expect === "absent" ? matched : !matched;
      return { violated, detail: violated ? spec.violationDetail : spec.passDetail };
    },
  };
}

/** Asserts a file does not exist (e.g. a bridge artefact that should retire). */
export function fileAbsenceCheck(
  spec: BaseCheckSpec & { file: string; violationDetail: string },
): PublicationCheck {
  return {
    ...spec,
    run: async (ctx) => {
      const exists = ctx.sources.has(spec.file);
      return {
        violated: exists,
        detail: exists ? spec.violationDetail : `${spec.file} does not exist.`,
      };
    },
  };
}

/**
 * Writer census: finds every source file that writes the given table — via
 * the drizzle identifier (`.insert(meals)`, `.update(meals)`, `.delete(meals)`)
 * or raw SQL (`INSERT INTO meals`, `UPDATE meals SET`, `DELETE FROM meals`,
 * `ALTER TABLE meals`) — and holds the list against the declared Authorised
 * Writers. An empty diff passes; every unauthorised writer is named.
 */
export function writerCensusCheck(
  spec: BaseCheckSpec & {
    /** Drizzle export name in shared/schema.ts, e.g. "canonicalFoods". */
    schemaIdent: string;
    /** Raw SQL table name, e.g. "canonical_food". */
    tableName: string;
    /** Repo-relative paths (or path prefixes) authorised to write this table. */
    authorisedWriters: string[];
  },
): PublicationCheck {
  const drizzlePattern = new RegExp(
    `\\.(insert|update|delete)\\(\\s*${spec.schemaIdent}\\b`,
  );
  // UPDATE requires a following SET so prose like "update meals cache" in a
  // comment can never be counted as a writer.
  const rawPattern = new RegExp(
    `INSERT\\s+INTO\\s+${spec.tableName}\\b|UPDATE\\s+${spec.tableName}\\s+SET\\b|DELETE\\s+FROM\\s+${spec.tableName}\\b|ALTER\\s+TABLE\\s+${spec.tableName}\\b`,
    "i",
  );
  return {
    ...spec,
    run: async (ctx) => {
      const writers: string[] = [];
      for (const [file, content] of ctx.sources) {
        if (CENSUS_EXCLUDED_PREFIXES.some((p) => file.startsWith(p))) continue;
        if (drizzlePattern.test(content) || rawPattern.test(content)) writers.push(file);
      }
      const unauthorised = writers.filter(
        (file) => !spec.authorisedWriters.some((allowed) => file.startsWith(allowed)),
      );
      if (unauthorised.length > 0) {
        return {
          violated: true,
          detail:
            `${writers.length} writer(s) found for ${spec.tableName}; ` +
            `unauthorised: ${unauthorised.join(", ")} ` +
            `(authorised: ${spec.authorisedWriters.join(", ") || "none declared"})`,
        };
      }
      return {
        violated: false,
        detail: `${writers.length} writer(s) found for ${spec.tableName}, all within the declared authorised set.`,
      };
    },
  };
}

/**
 * Compares a live table row count against what the canonical owner publishes.
 * `tolerance: "exact"` — any difference is a violation (publication drift).
 * A WHERE clause may narrow the count (e.g. active rows only).
 */
export function seedCountCheck(
  spec: BaseCheckSpec & {
    tableName: string;
    expected: number;
    ownerLabel: string;
    where?: string;
  },
): PublicationCheck {
  return {
    ...spec,
    run: async (ctx) => {
      const rows = await ctx.query(
        `SELECT count(*)::int AS count FROM ${spec.tableName}${spec.where ? ` WHERE ${spec.where}` : ""}`,
      );
      const actual = Number(rows[0]?.count ?? 0);
      if (actual === spec.expected) {
        return {
          violated: false,
          detail: `${spec.ownerLabel} declares ${spec.expected}; ${spec.tableName} holds ${actual}. Exact.`,
        };
      }
      return {
        violated: true,
        detail:
          `${spec.ownerLabel} declares ${spec.expected}; ${spec.tableName} holds ${actual} ` +
          `(delta ${actual - spec.expected}).`,
      };
    },
  };
}

/** Arbitrary read-only SQL check with a custom evaluator. */
export function sqlCheck(
  spec: BaseCheckSpec & {
    sql: string;
    params?: unknown[];
    evaluate: (rows: Array<Record<string, unknown>>) => CheckEvaluation;
  },
): PublicationCheck {
  return {
    ...spec,
    run: async (ctx) => spec.evaluate(await ctx.query(spec.sql, spec.params)),
  };
}

/** Fully custom check (module-level comparisons, multi-source assertions). */
export function customCheck(
  spec: BaseCheckSpec & { run: (ctx: VerificationContext) => Promise<CheckEvaluation> },
): PublicationCheck {
  return spec;
}

// ── Shared source-parsing helpers ────────────────────────────────────────────

/**
 * Extracts the string keys of an object literal assigned to `constName` in the
 * given source content. Used to read declarations (e.g. CAPABILITY_DOMAIN)
 * without importing modules that boot the runtime as a side effect.
 */
export function parseObjectLiteralKeys(content: string, constName: string): string[] {
  const start = content.indexOf(`const ${constName}`);
  if (start === -1) return [];
  const open = content.indexOf("{", start);
  if (open === -1) return [];
  let depth = 0;
  let end = open;
  for (let i = open; i < content.length; i++) {
    if (content[i] === "{") depth++;
    if (content[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = content.slice(open + 1, end);
  const keys: string[] = [];
  const keyPattern = /^\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_-]+))\s*:/gm;
  let match: RegExpExecArray | null;
  while ((match = keyPattern.exec(body)) !== null) {
    keys.push(match[1] ?? match[2] ?? match[3]);
  }
  return keys;
}
