/**
 * capability-probe.ts — BENCH2C Capability Utilisation observation seam
 * ======================================================================
 * Records, for every benchmark turn, EVERY capability the Intelligence Platform actually
 * invoked: which one, which verb, the honest outcome status, how long it took, and whether
 * it threw. It is the only place the benchmark can learn a capability's real execution time,
 * because the platform records none.
 *
 * ── Why this exists rather than a new platform field ──────────────────────────
 * `TurnResult` surfaces a single primary `outcome`. `conversation_turns.resolved_intent`
 * (INT39) persists the routed capability set and each one's `QueriedIntentStatus`, but no
 * timing, and it drops BASELINE (context-only) reads entirely. Adding `durationMs` to the
 * gateway would change a production write path for a benchmark's benefit. This module does
 * not: it wraps the platform's own public `handle()` — the single entry point every capability
 * invocation already funnels through (LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE) — and
 * observes it.
 *
 * ── What makes this safe ──────────────────────────────────────────────────────
 *  1. **Pure pass-through.** The wrapper awaits the original `handle`, returns its outcome
 *     object unchanged, and re-throws any error unchanged. No routing, permission,
 *     confirmation or result is altered. There is no behavioural change, only observation.
 *  2. **Scoped to one acting user.** A record is only taken when `context.userId` matches the
 *     benchmark's acting user. A concurrent real user's turn passes straight through and is
 *     never observed — the probe cannot see, delay, or record anyone else.
 *  3. **No persistent state, no duplicate log.** Records live in a per-run, in-memory buffer
 *     the benchmark owns and drains after each turn. Nothing is written to any store, and no
 *     existing platform log is duplicated — the platform has no capability log to duplicate.
 *  4. **Reference-counted install/uninstall.** The own-property shadow over the prototype
 *     method is removed when the last probe disposes, restoring the singleton exactly.
 *  5. **Never reaches past the seam.** It does not import a capability handler, the intent
 *     engine, the permission model, or the behaviour engine. It observes one public method.
 *
 * The benchmark still executes every question through `conversationGateway.processUserTurn`
 * and nothing else (README §1). This is an observer of that path, not a second one.
 */

import { intelligencePlatform } from "../../intelligence/intelligence-platform.js";

/** One observed capability invocation, exactly as the platform executed it. */
export interface CapabilityInvocation {
  readonly capabilityId: string;
  readonly verb: string;
  /** The platform's honest `IntentOutcome.status` (`ok`, `denied`, `gap`, `unsupported_intent`, …). */
  readonly status: string;
  /** True when the handler executed and returned a result (`status === "ok"`). */
  readonly ok: boolean;
  /** Wall-clock duration of the full LOCATE → … → INVOKE pipeline for this one capability, ms. */
  readonly durationMs: number;
  /** True when the handler threw rather than returning a structured outcome. */
  readonly threw: boolean;
  readonly errorMessage: string | null;
  /**
   * What this invocation contributed to the final answer. Filled in by `companion-turn.ts` by
   * joining against the turn's persisted `resolved_intent`; the probe alone cannot know whether
   * a capability's `ok` result actually reached the LLM's CONTEXT DATA block (an empty search
   * result is `ok` but contributes nothing). Left as `"unknown"` when no join source exists.
   */
  readonly contribution: CapabilityContribution;
  /**
   * True when this capability was NOT part of the turn's routed (non-baseline) set — i.e. the
   * resolver appends it as a context-only read on every turn, regardless of the utterance.
   * Baseline invocations never count as "understanding the question" (turn-fallback.ts).
   */
  readonly baseline: boolean;
}

/**
 * How an invocation fed the final answer. Mirrors `QueriedIntentStatus` (turn-fallback.ts) for
 * routed capabilities, with two additions the benchmark needs and the platform does not name.
 */
export type CapabilityContribution =
  /** Returned data that entered the LLM's CONTEXT DATA block — this capability grounded the answer. */
  | "grounding-data"
  /** Executed successfully but returned an empty search result. Reached, contributed nothing. */
  | "empty-result"
  /** An honest structured non-ok outcome (gap / denied / unsupported / not_executable). */
  | "no-knowledge"
  /** The handler threw; the gateway contained it so one failure could not abort the turn. */
  | "error"
  /** A baseline, context-only read the resolver appends regardless of the utterance. */
  | "context-only"
  /** The turn's `resolved_intent` was unreadable, so contribution could not be determined. */
  | "unknown";

/** The buffer one probe owns, drained per turn by its owner. */
interface ProbeBuffer {
  records: MutableInvocation[];
}

type MutableInvocation = {
  capabilityId: string;
  verb: string;
  status: string;
  ok: boolean;
  durationMs: number;
  threw: boolean;
  errorMessage: string | null;
  contribution: CapabilityContribution;
  baseline: boolean;
};

/** The handle a caller uses to drain and dispose its probe. Never shared. */
export interface CapabilityProbeHandle {
  /** Take and clear everything observed since the last drain. Turns run sequentially, so this is exactly one turn's worth. */
  drain(): CapabilityInvocation[];
  /** Remove this probe. Idempotent. Restores the platform singleton when the last probe leaves. */
  dispose(): void;
  /** False when the probe could not be installed (see `installCapabilityProbe`). */
  readonly active: boolean;
}

/**
 * The platform's own `handle()` signature, derived from the singleton rather than re-declared.
 * Deriving it here is deliberate: `RouteOptions` is declared in `intent-engine.ts`, and the
 * benchmark's import-surface constraint (AUTOMATION §2) forbids importing the intent engine.
 * `typeof` reaches only the public method, so the wrapper can never drift from what it wraps.
 */
type HandleFn = typeof intelligencePlatform.handle;

/** userId → buffer. A turn is only observed when its `context.userId` is a key here. */
const buffers = new Map<string, ProbeBuffer>();
let originalHandle: HandleFn | null = null;

function install(): void {
  if (originalHandle !== null) return; // already wrapped
  const platform = intelligencePlatform as unknown as { handle: HandleFn };
  const original = platform.handle.bind(intelligencePlatform) as HandleFn;
  originalHandle = original;

  // Own-property shadow over the prototype method. `defaultHandleIntent` in
  // conversation-gateway.ts resolves `intelligencePlatform.handle` at CALL time, so the
  // wrapper is picked up without the gateway knowing or caring.
  platform.handle = async (intent, context, options) => {
    const buffer = context.userId != null ? buffers.get(context.userId) : undefined;
    if (!buffer) return original(intent, context, options); // not us — untouched, unobserved

    const startedAt = Date.now();
    try {
      const outcome = await original(intent, context, options);
      buffer.records.push({
        capabilityId: outcome.capabilityId ?? intent.capabilityId,
        verb: String(outcome.verb ?? intent.verb),
        status: outcome.status,
        ok: outcome.status === "ok",
        durationMs: Date.now() - startedAt,
        threw: false,
        errorMessage: null,
        contribution: "unknown",
        baseline: false,
      });
      return outcome;
    } catch (err) {
      // The gateway contains handler throws so one capability cannot abort a turn. Record the
      // failure and re-throw UNCHANGED — the probe must never swallow or transform an error.
      buffer.records.push({
        capabilityId: intent.capabilityId,
        verb: String(intent.verb),
        status: "threw",
        ok: false,
        durationMs: Date.now() - startedAt,
        threw: true,
        errorMessage: err instanceof Error ? err.message : String(err),
        contribution: "error",
        baseline: false,
      });
      throw err;
    }
  };
}

function uninstallIfIdle(): void {
  if (buffers.size > 0 || originalHandle === null) return;
  delete (intelligencePlatform as unknown as { handle?: HandleFn }).handle; // reveal the prototype method again
  originalHandle = null;
}

/**
 * Install a capability probe scoped to one acting user.
 *
 * Returns an inactive handle (drains empty, dispose is a no-op) when `userId` is absent or a
 * probe is already installed for that user — the benchmark then reports `probeActive: false`
 * rather than silently presenting an empty utilisation table as "this run used no capabilities".
 */
export function installCapabilityProbe(userId: string | undefined): CapabilityProbeHandle {
  if (userId == null || buffers.has(userId)) {
    return { drain: () => [], dispose: () => {}, active: false };
  }

  const buffer: ProbeBuffer = { records: [] };
  buffers.set(userId, buffer);
  install();

  let disposed = false;
  return {
    active: true,
    drain(): CapabilityInvocation[] {
      const taken = buffer.records;
      buffer.records = [];
      return taken;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      buffers.delete(userId);
      uninstallIfIdle();
    },
  };
}

/** True when any probe is currently observing. Exported for tests and self-checks. */
export function isCapabilityProbeInstalled(): boolean {
  return originalHandle !== null;
}
