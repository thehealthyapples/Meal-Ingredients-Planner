/**
 * CPV1 — Canonical Publication Verifier: the engine.
 *
 * Runs every declared domain's checks against the running platform and rolls
 * the results up into the platform verification report the Admin dashboard
 * and the CLI (scripts/ci/verify-canonical-publication.ts) both render.
 *
 * Read-only by construction: the only database access is through a SELECT
 * executor, and source evidence comes from an in-memory snapshot of the tree.
 *
 * Roll-up: any failed check → 🔴 publication-failure; any warned or skipped
 * check → 🟡 needs-attention; otherwise 🟢 healthy. A skipped check (e.g. the
 * database was unreachable) can never make a domain healthy by silence.
 */

import type {
  CheckResult,
  DomainDeclaration,
  DomainResult,
  DomainStatus,
  PlatformVerificationReport,
  PublicationCheck,
  VerificationContext,
} from "./publication-types";
import { buildSourceIndex } from "./publication-checks";
import { CANONICAL_PUBLICATION_REGISTER, CROSS_CUTTING_CHECKS } from "./publication-register";

async function runCheck(
  check: PublicationCheck,
  ctx: VerificationContext,
): Promise<CheckResult> {
  try {
    const evaluation = await check.run(ctx);
    const outcome = evaluation.skipped
      ? "skipped"
      : evaluation.violated
        ? check.severity
        : "pass";
    return {
      id: check.id,
      law: check.law,
      title: check.title,
      outcome,
      detail: evaluation.detail,
      cpi1: check.cpi1,
    };
  } catch (err) {
    return {
      id: check.id,
      law: check.law,
      title: check.title,
      outcome: "skipped",
      detail: `Check could not run: ${(err as Error).message}`,
      cpi1: check.cpi1,
    };
  }
}

function rollUp(checks: CheckResult[]): DomainStatus {
  if (checks.some((c) => c.outcome === "fail")) return "publication-failure";
  if (checks.some((c) => c.outcome === "warn" || c.outcome === "skipped")) {
    return "needs-attention";
  }
  return "healthy";
}

async function verifyDomain(
  declaration: DomainDeclaration,
  ctx: VerificationContext,
): Promise<DomainResult> {
  const checks: CheckResult[] = [];
  for (const check of declaration.checks) {
    checks.push(await runCheck(check, ctx));
  }
  return {
    id: declaration.id,
    name: declaration.name,
    variant: declaration.variant,
    canonicalOwner: declaration.canonicalOwner,
    authorisedWriters: declaration.authorisedWriters,
    publicationPath: declaration.publicationPath,
    runtimeReadPath: declaration.runtimeReadPath,
    sotRegisterRef: declaration.sotRegisterRef,
    knownGaps: declaration.knownGaps ?? [],
    status: rollUp(checks),
    checks,
  };
}

export async function runPublicationVerification(): Promise<PlatformVerificationReport> {
  const sources = buildSourceIndex(process.cwd());

  let databaseAvailable = true;
  let query: VerificationContext["query"];
  try {
    const { pool } = await import("../db");
    // One probe up front so 20 checks don't each wait out a dead connection.
    await pool.query("SELECT 1");
    query = async (sql, params) => {
      const result = await pool.query(sql, params as unknown[] | undefined);
      return result.rows as Array<Record<string, unknown>>;
    };
  } catch (err) {
    databaseAvailable = false;
    const reason = (err as Error).message;
    query = async () => {
      throw new Error(`database unavailable (${reason})`);
    };
  }

  const ctx: VerificationContext = { sources, query };

  const domains: DomainResult[] = [];
  for (const declaration of CANONICAL_PUBLICATION_REGISTER) {
    domains.push(await verifyDomain(declaration, ctx));
  }

  const crossCutting: CheckResult[] = [];
  for (const check of CROSS_CUTTING_CHECKS) {
    crossCutting.push(await runCheck(check, ctx));
  }

  const allChecks = [...domains.flatMap((d) => d.checks), ...crossCutting];
  return {
    generatedAt: new Date().toISOString(),
    databaseAvailable,
    summary: {
      domains: domains.length,
      healthy: domains.filter((d) => d.status === "healthy").length,
      needsAttention: domains.filter((d) => d.status === "needs-attention").length,
      publicationFailure: domains.filter((d) => d.status === "publication-failure").length,
      checksRun: allChecks.length,
      passed: allChecks.filter((c) => c.outcome === "pass").length,
      warned: allChecks.filter((c) => c.outcome === "warn").length,
      failed: allChecks.filter((c) => c.outcome === "fail").length,
      skipped: allChecks.filter((c) => c.outcome === "skipped").length,
    },
    domains,
    crossCutting,
  };
}
