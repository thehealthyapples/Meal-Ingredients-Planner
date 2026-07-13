/**
 * CPV1 — Canonical Publication Verification: type contracts.
 *
 * Every canonical domain in THA declares four things — its Canonical Owner,
 * its Authorised Writers, its Publication Path, and its Runtime Read Path —
 * and the verifier holds the declared state against the running platform.
 *
 * The seven laws under test are the platform laws from
 * docs/architecture/ARCHITECTURE_PRINCIPLES.md, as audited by CPI1
 * (docs/investigations/platform/CPI1_CANONICAL_PUBLICATION_INTEGRITY_AUDIT.md).
 * CPI1 findings are deliberately NOT fixed by this workstream — each one is
 * converted into an automated verification failure so it can never again be
 * true silently.
 */

/** The seven laws every canonical domain is verified against. */
export type PublicationLaw =
  | "one-owner"
  | "authorised-writers"
  | "approved-read-path"
  | "no-stale-projections"
  | "no-duplicate-runtime-identity"
  | "no-publication-drift"
  | "no-sync-bridges";

export const PUBLICATION_LAW_LABELS: Readonly<Record<PublicationLaw, string>> = {
  "one-owner": "One owner",
  "authorised-writers": "Authorised writers only",
  "approved-read-path": "Runtime reads the approved publication",
  "no-stale-projections": "No stale projections",
  "no-duplicate-runtime-identity": "No duplicate runtime identities",
  "no-publication-drift": "No publication drift",
  "no-sync-bridges": "No synchronisation bridges",
};

/**
 * The three publication variants CPI1 §1 confirmed as legitimate, plus
 * "platform" for runtime singletons whose publication is the module itself.
 */
export type DomainVariant = "knowledge" | "identity" | "transactional" | "platform";

export type CheckOutcome = "pass" | "warn" | "fail" | "skipped";

export type DomainStatus = "healthy" | "needs-attention" | "publication-failure";

/** What a single executed check reports. */
export interface CheckResult {
  id: string;
  law: PublicationLaw;
  title: string;
  outcome: CheckOutcome;
  /** Human-readable evidence: counts, file paths, ids — never an estimate. */
  detail: string;
  /** CPI1 finding this check automates (e.g. "S1-1", "§4.2"), if any. */
  cpi1?: string;
}

/** What a check's run() decides. The verifier maps it onto an outcome. */
export interface CheckEvaluation {
  violated: boolean;
  detail: string;
  /** True when the check could not run (e.g. no database); never a verdict. */
  skipped?: boolean;
}

export interface VerificationContext {
  /** Repo-root-relative source index: path → file content. */
  sources: ReadonlyMap<string, string>;
  /** Executes a read-only SQL query; throws if the database is unreachable. */
  query: (sql: string, params?: unknown[]) => Promise<Array<Record<string, unknown>>>;
}

export interface PublicationCheck {
  id: string;
  law: PublicationLaw;
  title: string;
  /** Outcome when the check finds a violation. Mirrors CPI1 severity. */
  severity: "fail" | "warn";
  cpi1?: string;
  run: (ctx: VerificationContext) => Promise<CheckEvaluation>;
}

/**
 * The declaration every canonical domain must make (the mission contract):
 * owner, writers, publication path, runtime read path — plus the executable
 * checks that hold the declaration against reality.
 */
export interface DomainDeclaration {
  id: string;
  name: string;
  variant: DomainVariant;
  canonicalOwner: string;
  authorisedWriters: string[];
  publicationPath: string;
  runtimeReadPath: string;
  /** SoT Register domain reference (e.g. "D2"), where one exists. */
  sotRegisterRef?: string;
  /**
   * CPI1 findings that are real but not yet automatable. Documented so the
   * dashboard renders them as honest gaps — they do not score.
   */
  knownGaps?: string[];
  checks: PublicationCheck[];
}

export interface DomainResult {
  id: string;
  name: string;
  variant: DomainVariant;
  canonicalOwner: string;
  authorisedWriters: string[];
  publicationPath: string;
  runtimeReadPath: string;
  sotRegisterRef?: string;
  knownGaps: string[];
  status: DomainStatus;
  checks: CheckResult[];
}

export interface PlatformVerificationReport {
  generatedAt: string;
  databaseAvailable: boolean;
  summary: {
    domains: number;
    healthy: number;
    needsAttention: number;
    publicationFailure: number;
    checksRun: number;
    passed: number;
    warned: number;
    failed: number;
    skipped: number;
  };
  domains: DomainResult[];
  /** Findings that belong to no single domain (CPI1 §4). */
  crossCutting: CheckResult[];
}
