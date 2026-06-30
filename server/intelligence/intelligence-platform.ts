/**
 * THA Intelligence Platform — canonical entry point
 * =================================================
 * The SINGLE orchestration point for THA intelligence (TIP1 §2). Everything that
 * is "the platform" is reached through here:
 *   • capability lookup / discovery   (Capability Registry)
 *   • intent routing                  (Intent Engine)
 *   • permission enforcement          (Permission Model, server-side)
 *   • orchestration & execution       (the route() pipeline)
 *
 * It DOES NOT and MUST NOT perform planner logic, shopping logic, nutrition
 * analysis, or profile management directly. Those remain owned by existing business
 * services; the platform only routes to them (TIP1 §2, Principles 2 & 7).
 *
 * INT1 SCOPE: foundation only. No user-facing AI behaviour. No Developer/User/Voice
 * assistant. No conversation/memory/history. No public AI endpoints. This is the
 * shared spine all future intelligence will be built on.
 */

import type { User } from "@shared/schema";
import { CapabilityRegistry } from "./capability-registry.js";
import { IntentEngine, type RouteOptions } from "./intent-engine.js";
import { resolveContext } from "./permissions.js";
import type {
  Capability,
  CapabilityHandler,
  IntelligenceContext,
  Intent,
  IntentOutcome,
} from "./types.js";

/**
 * The canonical Intelligence Platform. One instance is the single orchestration
 * point; constructing additional instances is supported only for tests/isolation.
 */
export class IntelligencePlatform {
  readonly registry: CapabilityRegistry;
  private readonly engine: IntentEngine;

  constructor(registry: CapabilityRegistry = new CapabilityRegistry()) {
    this.registry = registry;
    this.engine = new IntentEngine(registry);
  }

  // --- Permission-aware context -------------------------------------------

  /** Resolve who is acting, from the existing authenticated session user. */
  contextFor(user: User | null | undefined): IntelligenceContext {
    return resolveContext(user);
  }

  // --- Capability discovery -----------------------------------------------

  /** The full capability catalogue (future surfaces read this; it is derived). */
  listCapabilities(): Capability[] {
    return this.registry.list();
  }

  /** Look up a single capability by id. */
  getCapability(capabilityId: string): Capability | undefined {
    return this.registry.get(capabilityId);
  }

  // --- Future extension point ---------------------------------------------

  /**
   * Bind an execution handler for a capability (FUTURE workstreams only). The handler
   * is the single place that calls the owning business service; it must hold no
   * business logic of its own (TIP1 §5). INT1 binds none.
   */
  registerHandler(capabilityId: string, handler: CapabilityHandler): void {
    this.registry.bindHandler(capabilityId, handler);
  }

  // --- Orchestration / execution pipeline ---------------------------------

  /**
   * The single entry point for acting on an interpreted intent. Routes through the
   * full LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND pipeline and
   * always returns a structured, honest outcome (never a fabricated success).
   */
  handle(intent: Intent, context: IntelligenceContext, options?: RouteOptions): Promise<IntentOutcome> {
    return this.engine.route(intent, context, options);
  }
}

/**
 * The canonical singleton. Import this — do not construct a second platform in
 * production code. One canonical Intelligence Platform (INT1 Definition of Done).
 */
export const intelligencePlatform = new IntelligencePlatform();
