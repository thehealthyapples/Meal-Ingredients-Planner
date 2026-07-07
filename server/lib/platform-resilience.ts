/**
 * platform-resilience.ts — EWO-PRO1 Platform Resilience & Operations
 * ===================================================================
 * The ONE shared resilience mechanism for every outbound dependency call THA
 * makes (LLM provider, external recipe/nutrition APIs, price lookups, …).
 * Per the Platform Quality Architecture (§0, §3), resilience is a platform
 * responsibility owned once at the spine — no capability may invent its own
 * timeout, retry, or degradation policy beside this module.
 *
 * What it provides:
 *   - executeWithResilience(): bounded timeout + optional retry with
 *     exponential backoff + a per-dependency circuit breaker, in one call.
 *   - guardedFetch(): the same guarantees wrapped around fetch(), with the
 *     socket genuinely aborted on timeout (AbortSignal), not just abandoned.
 *   - getDependencyHealthReport(): the live operational state of every
 *     dependency the platform has called — circuit state, failure counts,
 *     last error, last latency — consumed by the admin operations endpoint.
 *
 * Circuit breaker model (per named dependency):
 *   closed → (N consecutive failures) → open → (cooldown elapses) →
 *   half-open (one probe call allowed) → success: closed / failure: open.
 *   While open, calls fail immediately with DependencyUnavailableError so a
 *   dead upstream degrades THA in milliseconds, not in stacked timeouts.
 *
 * HARD BOUNDARIES:
 *   - No storage reads/writes, no business logic, no knowledge of what any
 *     dependency returns. Pure execution discipline + in-process accounting.
 *   - The health report carries operational facts only (names, states,
 *     counts, error messages) — never request payloads, user data, or keys.
 *
 * Run tests: npx tsx server/tests/test-platform-resilience.ts
 */

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** The operation exceeded its declared time budget. */
export class TimeoutError extends Error {
  constructor(dependency: string, timeoutMs: number) {
    super(`${dependency} did not respond within ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

/** The dependency's circuit is open — the call was refused without executing. */
export class DependencyUnavailableError extends Error {
  constructor(dependency: string, retryAtIso: string) {
    super(`${dependency} is temporarily unavailable (circuit open; retry after ${retryAtIso})`);
    this.name = "DependencyUnavailableError";
  }
}

// ---------------------------------------------------------------------------
// Options & defaults
// ---------------------------------------------------------------------------

export interface ResilienceOptions {
  /** Time budget per attempt. Default 10s. */
  readonly timeoutMs?: number;
  /** Additional attempts after the first failure. Default 0 (no retry). */
  readonly retries?: number;
  /** Base backoff before a retry; doubles per attempt, with jitter. Default 250ms. */
  readonly retryDelayMs?: number;
  /** Consecutive failures that open this dependency's circuit. Default 5. */
  readonly circuitOpenThreshold?: number;
  /** How long an open circuit refuses calls before allowing a half-open probe. Default 30s. */
  readonly circuitCooldownMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_DELAY_MS = 250;

/** Consecutive failures that open a dependency's circuit. */
const CIRCUIT_OPEN_THRESHOLD = 5;
/** How long an open circuit refuses calls before allowing a half-open probe. */
const CIRCUIT_COOLDOWN_MS = 30_000;

// ---------------------------------------------------------------------------
// Per-dependency health accounting
// ---------------------------------------------------------------------------

export type CircuitState = "closed" | "open" | "half-open";

export interface DependencyHealth {
  readonly name: string;
  readonly circuitState: CircuitState;
  readonly consecutiveFailures: number;
  readonly totalCalls: number;
  readonly totalFailures: number;
  readonly totalTimeouts: number;
  readonly totalRefused: number;
  readonly lastSuccessAt: string | null;
  readonly lastFailureAt: string | null;
  /** Message only — never a payload. */
  readonly lastError: string | null;
  readonly lastLatencyMs: number | null;
}

interface DependencyRecord {
  name: string;
  circuitState: CircuitState;
  consecutiveFailures: number;
  /** Epoch ms when the circuit opened; null when not open. */
  openedAt: number | null;
  /** True while a half-open probe call is in flight (only one allowed). */
  probeInFlight: boolean;
  totalCalls: number;
  totalFailures: number;
  totalTimeouts: number;
  totalRefused: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  lastLatencyMs: number | null;
}

const dependencies = new Map<string, DependencyRecord>();

function getRecord(name: string): DependencyRecord {
  let record = dependencies.get(name);
  if (!record) {
    record = {
      name,
      circuitState: "closed",
      consecutiveFailures: 0,
      openedAt: null,
      probeInFlight: false,
      totalCalls: 0,
      totalFailures: 0,
      totalTimeouts: 0,
      totalRefused: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastError: null,
      lastLatencyMs: null,
    };
    dependencies.set(name, record);
  }
  return record;
}

function recordSuccess(record: DependencyRecord, latencyMs: number): void {
  record.consecutiveFailures = 0;
  record.openedAt = null;
  record.probeInFlight = false;
  if (record.circuitState !== "closed") {
    console.info(`[PlatformResilience] ${record.name} circuit closed (probe succeeded)`);
  }
  record.circuitState = "closed";
  record.lastSuccessAt = new Date().toISOString();
  record.lastLatencyMs = latencyMs;
}

function recordFailure(
  record: DependencyRecord,
  err: unknown,
  latencyMs: number,
  openThreshold: number,
): void {
  record.totalFailures += 1;
  if (err instanceof TimeoutError) record.totalTimeouts += 1;
  record.consecutiveFailures += 1;
  record.probeInFlight = false;
  record.lastFailureAt = new Date().toISOString();
  record.lastError = err instanceof Error ? err.message : String(err);
  record.lastLatencyMs = latencyMs;
  if (record.consecutiveFailures >= openThreshold || record.circuitState === "half-open") {
    if (record.circuitState !== "open") {
      console.warn(
        `[PlatformResilience] ${record.name} circuit OPEN after ${record.consecutiveFailures} consecutive failures ` +
          `(last: ${record.lastError})`,
      );
    }
    record.circuitState = "open";
    record.openedAt = Date.now();
  }
}

/**
 * Gate a call through the dependency's circuit. Returns normally when the
 * call may proceed; throws DependencyUnavailableError when refused.
 */
function admitThroughCircuit(record: DependencyRecord, cooldownMs: number): void {
  if (record.circuitState === "closed") return;
  const openedAt = record.openedAt ?? 0;
  const cooldownOver = Date.now() - openedAt >= cooldownMs;
  if (record.circuitState === "open" && cooldownOver && !record.probeInFlight) {
    record.circuitState = "half-open";
    record.probeInFlight = true;
    console.info(`[PlatformResilience] ${record.name} circuit half-open (allowing one probe)`);
    return;
  }
  if (record.circuitState === "half-open" && !record.probeInFlight) {
    record.probeInFlight = true;
    return;
  }
  record.totalRefused += 1;
  const retryAt = new Date(openedAt + cooldownMs).toISOString();
  throw new DependencyUnavailableError(record.name, retryAt);
}

// ---------------------------------------------------------------------------
// Timeout
// ---------------------------------------------------------------------------

/**
 * Race an operation against its time budget. The loser is abandoned (for
 * genuine socket cancellation use guardedFetch, whose AbortSignal reaches
 * the transport layer).
 */
export async function withTimeout<T>(
  dependency: string,
  timeoutMs: number,
  operation: () => Promise<T>,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new TimeoutError(dependency, timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// The core primitive
// ---------------------------------------------------------------------------

/**
 * Execute an outbound-dependency operation with the platform's uniform
 * resilience discipline: circuit-breaker admission, per-attempt timeout,
 * optional retry with exponential backoff + jitter, and health accounting.
 *
 * Every attempt's outcome feeds the dependency's health record, so the
 * operations endpoint reports what the platform actually experienced.
 */
export async function executeWithResilience<T>(
  dependency: string,
  operation: () => Promise<T>,
  options: ResilienceOptions = {},
): Promise<T> {
  const record = getRecord(dependency);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const attempts = 1 + Math.max(0, options.retries ?? 0);
  const baseDelay = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const openThreshold = options.circuitOpenThreshold ?? CIRCUIT_OPEN_THRESHOLD;
  const cooldownMs = options.circuitCooldownMs ?? CIRCUIT_COOLDOWN_MS;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    admitThroughCircuit(record, cooldownMs); // throws DependencyUnavailableError when refused
    record.totalCalls += 1;
    const startedAt = Date.now();
    try {
      const result = await withTimeout(dependency, timeoutMs, operation);
      recordSuccess(record, Date.now() - startedAt);
      return result;
    } catch (err) {
      recordFailure(record, err, Date.now() - startedAt, openThreshold);
      lastError = err;
      const retriesLeft = attempt < attempts && record.circuitState === "closed";
      if (!retriesLeft) break;
      const delay = baseDelay * 2 ** (attempt - 1) * (0.5 + Math.random() * 0.5);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// guardedFetch — resilient HTTP for external services
// ---------------------------------------------------------------------------

/**
 * fetch() with the platform's resilience discipline. The timeout is enforced
 * with an AbortSignal so the underlying socket is genuinely cancelled.
 * Non-2xx responses are returned (not thrown) — HTTP status semantics belong
 * to the caller; this layer owns reachability, latency, and degradation.
 */
export async function guardedFetch(
  dependency: string,
  url: string | URL,
  init: RequestInit = {},
  options: ResilienceOptions = {},
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return executeWithResilience(
    dependency,
    () => fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) }),
    { ...options, timeoutMs: timeoutMs + 500 }, // outer race slightly behind the socket abort
  );
}

// ---------------------------------------------------------------------------
// Operational reporting
// ---------------------------------------------------------------------------

/** The live health of every dependency called since process start. */
export function getDependencyHealthReport(): DependencyHealth[] {
  return Array.from(dependencies.values())
    .map((r) => ({
      name: r.name,
      circuitState: r.circuitState,
      consecutiveFailures: r.consecutiveFailures,
      totalCalls: r.totalCalls,
      totalFailures: r.totalFailures,
      totalTimeouts: r.totalTimeouts,
      totalRefused: r.totalRefused,
      lastSuccessAt: r.lastSuccessAt,
      lastFailureAt: r.lastFailureAt,
      lastError: r.lastError,
      lastLatencyMs: r.lastLatencyMs,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Test hook — clear all dependency accounting and circuit state. */
export function resetDependencyHealth(): void {
  dependencies.clear();
}
