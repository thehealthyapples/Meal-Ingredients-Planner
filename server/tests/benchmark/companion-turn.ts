/**
 * companion-turn.ts — INTQ4 the ONE-seam adapter
 * ===============================================
 * The single place in the benchmark platform that touches the Companion. It wraps
 * `conversationGateway.processUserTurn` (README §1 — the one public seam) into a
 * `TurnRunner` the pure runner can call, and maps the full `TurnResult` down to the
 * `CapturedTurn` the scorer reads (EXECUTION_PROCESS §4.3). A thrown turn is itself
 * a scored outcome (an internal-error the platform failed to convert into an honest
 * gap), captured here rather than crashing the run.
 *
 * This module — and ONLY this module — imports the gateway. Nothing reaches past it
 * into a capability handler, the intent engine, the permission model, or the
 * behaviour engine (AUTOMATION §2 import-surface constraint).
 *
 * BENCHINT2 adds per-question conversation isolation (BENCHINT1 D1/D8). It introduces no
 * benchmark execution path: it drives the SAME thread lifecycle production already owns.
 * `IConversationStore.openThread` documents "Does NOT auto-close the previous thread — call
 * closeThread() explicitly", and `processUserTurn` opens a fresh thread whenever none is active.
 * Closing the active thread around each question therefore makes every benchmark question a
 * fresh conversation session, using only the production lifecycle, with no gateway change and
 * no `isBenchmark` flag anywhere in production code.
 *
 * BENCH2 adds two purely observational captures, both read-only and neither of which
 * changes a single line of Companion behaviour:
 *
 *  1. `invokedCapabilities` — the full routed capability set the gateway ALREADY persists
 *     on the assistant turn (`conversation_turns.resolved_intent`, INT39). Before BENCH2 the
 *     scorer saw only `TurnResult.outcome.capabilityId`, a single primary outcome, so a turn
 *     that reached the intended capability alongside a discovery sibling could be scored as a
 *     misroute — and a turn that reached nothing was indistinguishable from a turn whose
 *     capability does not exist.
 *  2. `llmProviderAvailable` — read from the same factory the gateway uses. With no provider
 *     the gateway short-circuits before the resolver runs (an undocumented early return), which
 *     the pre-BENCH2 scorer read as `success = true` for every question, scoring 71.25/100 with
 *     the LLM entirely absent (INTA1 §6.4). The benchmark now records this and blocks the run.
 */

import { conversationGateway } from "../../intelligence/conversation/conversation-gateway.js";
import { DatabaseConversationStore } from "../../intelligence/conversation/conversation-store.js";
import { createDefaultLlmProvider } from "../../intelligence/conversation/llm-provider.js";
import { intelligencePlatform } from "../../intelligence/intelligence-platform.js";
import {
  installCapabilityProbe,
  type CapabilityContribution,
  type CapabilityInvocation,
} from "./capability-probe.js";
import type { User } from "../../../shared/schema.js";
import type { CapturedTurn } from "./scorer.js";
import type { TurnRunner } from "./runner.js";
import type { InvokedCapabilitiesSource } from "./types.js";

/** The INT39 `resolvedIntent` payload the gateway persists on every assistant turn. */
interface ResolvedIntentPayload {
  capabilities?: Array<{ capabilityId?: unknown; status?: unknown }>;
}

/**
 * BENCH2C — map a routed capability's `QueriedIntentStatus` (turn-fallback.ts) onto what it
 * actually contributed to the answer. `ok-data` is the ONLY status whose payload reaches the
 * LLM's CONTEXT DATA block (`conversation-gateway.ts` builds `capData` from it); `ok-empty` is
 * a successful invocation of an empty search, which grounds nothing.
 */
const CONTRIBUTION_BY_QUERIED_STATUS: Readonly<Record<string, CapabilityContribution>> = {
  "ok-data": "grounding-data",
  "ok-empty": "empty-result",
  "no-knowledge": "no-knowledge",
  "error": "error",
};

/**
 * Read the routed capability set off the persisted assistant turn.
 *
 * Two spellings are checked deliberately. `DatabaseConversationStore.appendTurn` runs a raw
 * `INSERT … RETURNING *`, so the row it returns carries Postgres' own snake_case column names
 * (`resolved_intent`) even though it is typed as the camelCase `ConversationTurn`;
 * `InMemoryConversationStore` returns the camelCase object. Reading both is what makes this
 * observation correct against the production store AND the in-memory one — and returning
 * `"outcome-only"` when neither is present is what stops the benchmark from silently reporting
 * a narrower capability set as though it were complete.
 */
function readInvokedCapabilities(
  assistantTurn: unknown,
  reachedCapability: string | null,
): { capabilities: string[]; source: InvokedCapabilitiesSource; contributions: Map<string, CapabilityContribution> } {
  const turn = assistantTurn as Record<string, unknown> | null | undefined;
  const raw = (turn?.resolvedIntent ?? turn?.resolved_intent) as ResolvedIntentPayload | null | undefined;

  // The persisted routed set carries each capability's QueriedIntentStatus — the one signal that
  // says whether its result actually grounded the answer. Read it here, once, alongside the ids.
  const contributions = new Map<string, CapabilityContribution>();
  const fromTurn: string[] = [];
  for (const c of raw?.capabilities ?? []) {
    if (typeof c?.capabilityId !== "string" || c.capabilityId.length === 0) continue;
    fromTurn.push(c.capabilityId);
    const status = typeof c.status === "string" ? c.status : "";
    contributions.set(c.capabilityId, CONTRIBUTION_BY_QUERIED_STATUS[status] ?? "unknown");
  }

  if (fromTurn.length > 0) {
    // De-duplicate while preserving resolver order (highest confidence first).
    return { capabilities: Array.from(new Set(fromTurn)), source: "resolved-intent", contributions };
  }
  if (reachedCapability) {
    return { capabilities: [reachedCapability], source: "outcome-only", contributions };
  }
  return { capabilities: [], source: "none", contributions };
}

/**
 * BENCH2C — join what the probe SAW EXECUTE (capability, verb, outcome, duration) with what the
 * turn PERSISTED about each routed capability's contribution.
 *
 * A capability the probe observed but the routed set does not name is a BASELINE, context-only
 * read: the resolver appends it on every turn regardless of the utterance, and `resolvedIntent`
 * deliberately excludes it (turn-fallback.ts — baseline outcomes never count as "understanding
 * the question"). Naming it `context-only` is what stops the dashboard from either hiding it or
 * crediting it as a routed answer to the question.
 */
function joinContributions(
  observed: CapabilityInvocation[],
  contributions: Map<string, CapabilityContribution>,
  source: InvokedCapabilitiesSource,
): CapabilityInvocation[] {
  return observed.map((inv) => {
    if (inv.threw) return inv; // already `error`, and never in the routed set as anything else
    const routed = contributions.get(inv.capabilityId);
    if (routed !== undefined) return { ...inv, contribution: routed, baseline: false };
    // Not in the routed set. When the routed set was readable at all, that means baseline.
    // When it was not (`outcome-only` / `none`), we genuinely cannot tell — say so.
    return source === "resolved-intent"
      ? { ...inv, contribution: "context-only" as const, baseline: true }
      : { ...inv, contribution: "unknown" as const, baseline: false };
  });
}

/**
 * BENCHINT2 — the production conversation lifecycle, driven from outside.
 *
 * `DatabaseConversationStore` is stateless (it takes a client off the shared pool per call), which
 * is why `server/routes.ts` constructs it ad hoc in five places rather than passing a singleton.
 * Constructing one here reads and writes exactly the rows the gateway's own store does.
 */
const conversationStore = new DatabaseConversationStore();

/**
 * Close the acting user's active conversation thread, if one is open.
 *
 * Returns the closed thread id, or null when nothing was open. `closeThread` is idempotent, so a
 * double close is a no-op, and the next `processUserTurn` finds no active thread and opens a fresh
 * one — the ordinary production branch at `conversation-gateway.ts:1256-1258`.
 */
async function closeActiveThread(userId: number): Promise<number | null> {
  const conversation = await conversationStore.getOrCreateConversation(userId);
  const active = await conversationStore.getActiveThread(conversation.id);
  if (!active) return null;
  await conversationStore.closeThread(active.id);
  return active.id;
}

/**
 * A `TurnRunner` that also owns a BENCH2C capability probe.
 *
 * `dispose()` MUST be called when the run ends — `runner.ts` does so in a `finally`. Existing
 * callers that only ever invoke the function itself (`server/routes.ts`, `run-benchmark.ts`)
 * keep working unchanged: this is a callable function with two extra properties, not a new type.
 */
export interface BenchmarkTurnRunner extends TurnRunner {
  /** Remove the capability probe and restore the platform singleton. Idempotent. */
  dispose(): void;
  /** False when no probe could be installed (no acting user id, or one is already installed). */
  readonly probeActive: boolean;
}

/**
 * Build a TurnRunner that executes each utterance through the one Companion seam as
 * the given acting user, on the "floating" surface (exactly the path a real user's
 * message takes). `personality` is the acting user's configured Companion voice,
 * resolved once by the caller and stamped on every captured turn for the personality
 * breakdown.
 *
 * BENCH2C: a capability probe is installed for the acting user for the lifetime of this runner,
 * and drained after every turn. It observes the platform's own `handle()` and changes nothing.
 */
export function makeCompanionTurnRunner(user: User, personality: string): BenchmarkTurnRunner {
  const ctx = intelligencePlatform.contextFor(user);
  // Resolved once per run, not per turn: the factory reads OPENAI_API_KEY and constructs no
  // client (OpenAIProvider lazy-imports the SDK inside complete()). Pure, cheap, read-only.
  const llmProviderAvailable = createDefaultLlmProvider().isAvailable;
  const probe = installCapabilityProbe(ctx.userId);

  /**
   * BENCHINT2 (D8) — a `single-world` run acts as a real, logged-in operator whose Companion
   * thread may already be open, carrying their own last conversation. Close it once, before the
   * first question, so no benchmark question is ever answered with a non-benchmark turn in its
   * prompt window. Every subsequent question is isolated by the `finally` below.
   */
  let openingThreadClosed = false;

  const runTurn = async (utterance: string): Promise<CapturedTurn> => {
    if (!openingThreadClosed) {
      await closeActiveThread(user.id);
      openingThreadClosed = true;
    }

    const startedAt = Date.now();
    // Discard anything left over from a prior turn's teardown so a turn can never be credited
    // with another turn's invocations. Turns run strictly sequentially (runner.ts).
    probe.drain();
    try {
      const result = await conversationGateway.processUserTurn(
        user.id,
        utterance,
        "floating",
        {},
        ctx,
      );
      const reachedCapability = result.outcome?.capabilityId ?? null;
      const invoked = readInvokedCapabilities(result.assistantTurn, reachedCapability);
      return {
        threadId: result.threadId,
        text: result.text ?? "",
        entityRefCount: result.entityRefs?.length ?? 0,
        outcomeStatus: result.outcome?.status ?? null,
        reachedCapability,
        invokedCapabilities: invoked.capabilities,
        invokedCapabilitiesSource: invoked.source,
        capabilityInvocations: joinContributions(probe.drain(), invoked.contributions, invoked.source),
        capabilityProbeActive: probe.active,
        discoveryCount: result.discoveries?.length ?? 0,
        guidanceCount: result.guidance?.length ?? 0,
        guidanceKind: result.guidanceKind ?? null,
        enrichmentCount: result.enrichment?.length ?? 0,
        actionCount: result.actions?.length ?? 0,
        fallbackState: result.fallbackState ?? null,
        latencyMs: Date.now() - startedAt,
        error: null,
        personality,
        llmProviderAvailable,
      };
    } catch (err) {
      // A throw is a scored outcome: the platform failed to convert an internal
      // error into an honest gap (gate G5). Capture it, never crash the run.
      // Whatever the probe saw before the throw is still true, and is kept.
      return {
        threadId: null,
        text: "",
        entityRefCount: 0,
        outcomeStatus: null,
        reachedCapability: null,
        invokedCapabilities: [],
        invokedCapabilitiesSource: "none",
        capabilityInvocations: joinContributions(probe.drain(), new Map(), "none"),
        capabilityProbeActive: probe.active,
        discoveryCount: 0,
        guidanceCount: 0,
        guidanceKind: null,
        enrichmentCount: 0,
        actionCount: 0,
        fallbackState: "internal-error",
        latencyMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err),
        personality,
        llmProviderAvailable,
      };
    } finally {
      // BENCHINT2 (D1) — end this question's conversation session. The next question therefore
      // opens a fresh thread and is answered with an empty CONVERSATION HISTORY and no inherited
      // entityRefs, which is what EXECUTION_PROCESS §1 step 3a has always required. Runs both on
      // success and after a thrown turn, so one bad question cannot contaminate the next.
      //
      // A failure here is NOT swallowed. Silent failure would leave the thread open and quietly
      // restore cross-question contamination, producing a scored artefact that looks valid and is
      // not. An unclosable thread means the conversation store is unreachable, in which case the
      // run's remaining scores are worthless anyway — aborting is the honest outcome.
      try {
        await closeActiveThread(user.id);
      } catch (err) {
        throw new Error(
          "[Benchmark] conversation isolation failed — could not close the question's thread. " +
            "Aborting rather than scoring contaminated turns. Cause: " +
            (err instanceof Error ? err.message : String(err)),
        );
      }
    }
  };

  return Object.assign(runTurn, {
    dispose: () => probe.dispose(),
    probeActive: probe.active,
  });
}
