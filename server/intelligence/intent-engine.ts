/**
 * THA Intent Engine — orchestration
 * =================================
 * Receives an interpreted, typed intent; locates the appropriate registered
 * capability; validates permissions; and (in future) invokes the owning business
 * service. It is an ORCHESTRATION LAYER ONLY.
 *
 * HARD RULE (TIP1 §5, Risk R4/R6): the Intent Engine never contains business rules.
 * It holds only schema + routing. All business validity and mutation is delegated to
 * the owning service via a bound CapabilityHandler. There is no freeform execution
 * and no path that calls a database directly.
 *
 * INT1 SCOPE: no handlers are bound, so invocation produces an HONEST GAP
 * ("not_executable") rather than a fabricated result (Principle 6, Risk R2).
 */

import type { CapabilityRegistry } from "./capability-registry.js";
import { canInvokeCapability, confirmationFor } from "./permissions.js";
import {
  CapabilityExecutionError,
  type Intent,
  type IntelligenceContext,
  type IntentOutcome,
} from "./types.js";
import { recordObservation } from "./observation/observation-engine.js";

export interface RouteOptions {
  /**
   * Whether the human has already confirmed a state-changing intent. The platform's
   * confirmation gate (TIP2 §5.1) is server-side; the caller asserts confirmation,
   * the engine decides whether confirmation was required.
   */
  readonly confirmed?: boolean;
  /**
   * OBS2 — correlation context for the capability-invocation observation this
   * route emits. TELEMETRY ONLY: nothing in the routing pipeline reads it, and
   * absent means the observation records without session/turn correlation
   * (exactly the pre-OBS2 behaviour). The conversation gateway passes its
   * thread id (sessionId), surface, and user-turn id (turnId) so the
   * Execution Timeline can place each invocation inside its turn.
   */
  readonly observation?: {
    readonly sessionId?: string;
    readonly surface?: string;
    readonly turnId?: string;
  };
}

/**
 * The Intent Engine. Stateless apart from its registry reference. Conversation,
 * memory, and history are explicitly OUT OF SCOPE (INT1 "Conversation") — the engine
 * holds none.
 */
export class IntentEngine {
  constructor(private readonly registry: CapabilityRegistry) {}

  /**
   * Route (and, where a handler is bound, execute) a typed intent.
   * Pipeline: LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND.
   *
   * OBS1: this is the platform's single capability-invocation choke point, so
   * it is the single capability-invocation capture point. Observation capture
   * is fire-and-forget and changes no outcome, no message, and no timing
   * visible to the caller.
   */
  async route(
    intent: Intent,
    context: IntelligenceContext,
    options: RouteOptions = {},
  ): Promise<IntentOutcome> {
    const started = Date.now();
    try {
      const outcome = await this.routeInner(intent, context, options);
      this.observe(intent, context, options, started, outcome.status);
      return outcome;
    } catch (err) {
      // Genuine fault propagating to the caller — observed as an error, rethrown unchanged.
      this.observe(intent, context, options, started, "error");
      throw err;
    }
  }

  /** Fire-and-forget observation of one routed intent (OBS1). Never throws. */
  private observe(
    intent: Intent,
    context: IntelligenceContext,
    options: RouteOptions,
    started: number,
    outcome: string,
  ): void {
    const userId = context.userId !== undefined ? Number(context.userId) : undefined;
    const base = {
      userId: Number.isInteger(userId) ? (userId as number) : undefined,
      capability: intent.capabilityId,
      verb: intent.verb,
      durationMs: Date.now() - started,
      outcome,
      // OBS2: caller-supplied correlation (telemetry only, absent when unrouted).
      sessionId: options.observation?.sessionId,
      surface: options.observation?.surface,
      turnId: options.observation?.turnId,
    };
    recordObservation({
      kind: "capability-invocation",
      severity:
        outcome === "error" ? "error"
        : outcome === "ok" || outcome === "confirmation_required" ? "info"
        : "warning",
      ...base,
    });
    // A confirmed invocation of a confirmation-gated intent is an explicit
    // manual override of the platform's default refusal — observed as its own
    // kind. Only counted when the tier genuinely required confirmation.
    if (options.confirmed === true && outcome === "ok") {
      const capability = this.registry.get(intent.capabilityId);
      const tier = capability ? confirmationFor(capability, intent.verb) : "none";
      if (tier !== "none") {
        recordObservation({
          kind: "manual-override",
          severity: "info",
          metadata: { confirmationTier: tier },
          ...base,
        });
      }
    }
  }

  private async routeInner(
    intent: Intent,
    context: IntelligenceContext,
    options: RouteOptions = {},
  ): Promise<IntentOutcome> {
    const { verb, capabilityId } = intent;

    // [1] LOCATE — find the registered capability (capability discovery).
    const capability = this.registry.get(capabilityId);
    if (!capability) {
      return {
        status: "unknown_capability",
        verb,
        message: `No registered capability "${capabilityId}". The Intelligence Platform only acts through registered capabilities.`,
      };
    }

    // [2] VALIDATE — closed allow-list: the verb must be a supported intent.
    if (!this.registry.supports(capabilityId, verb)) {
      const gap = this.registry.findGap(capabilityId, verb);
      if (gap) {
        return {
          status: "gap",
          capabilityId,
          verb,
          message: `Honest gap — "${verb}" on "${capability.displayName}" is not owned by any service yet: ${gap.reason}`,
        };
      }
      return {
        status: "unsupported_intent",
        capabilityId,
        verb,
        message: `Capability "${capability.displayName}" does not support intent "${verb}". No freeform execution is permitted.`,
      };
    }

    // [3] PERMISSION — server-side capability boundary (never prompt-based).
    const decision = canInvokeCapability(context, capability);
    if (!decision.allowed) {
      return { status: "denied", capabilityId, verb, message: decision.reason };
    }

    // [4] CONFIRM — deterministic, server-side confirmation gate.
    const confirmation = confirmationFor(capability, verb);
    if (confirmation !== "none" && !options.confirmed) {
      return {
        status: "confirmation_required",
        capabilityId,
        verb,
        confirmation,
        message: `Intent "${verb}" on "${capability.displayName}" requires ${confirmation} confirmation before it can be invoked.`,
      };
    }

    // [5] INVOKE — call the ONE bound handler, which delegates to the owning service.
    const handler = this.registry.getHandler(capabilityId);
    if (!handler) {
      // INT1 foundation state: registered but not yet executable. Honest gap.
      return {
        status: "not_executable",
        capabilityId,
        verb,
        confirmation,
        message: `Capability "${capability.displayName}" is registered but has no execution handler bound yet (platform foundation). Owning service: ${capability.owningService}.`,
      };
    }

    // [6] RESPOND — report the handler's (i.e. the owning service's) result honestly.
    // A handler delegates to the owning service. If that delegation produces an honest
    // non-result (a gap, an ownership denial), the handler throws a CapabilityExecutionError
    // and we surface it structurally — the platform never fabricates an "ok" (Risk R2).
    // Any other throw is a genuine fault and is allowed to propagate unchanged.
    try {
      const result = await handler(intent, context);
      return {
        status: "ok",
        capabilityId,
        verb,
        confirmation,
        message: `Invoked "${verb}" on "${capability.displayName}".`,
        result,
      };
    } catch (err) {
      if (err instanceof CapabilityExecutionError) {
        return {
          status: err.failureStatus,
          capabilityId,
          verb,
          confirmation,
          message: err.message,
        };
      }
      throw err;
    }
  }
}
