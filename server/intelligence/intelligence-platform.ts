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
 *
 * INT2: the first live capability is bound on the canonical singleton — the read-only
 * Planner (see ./bindings/planner.ts). The platform still owns NO business logic; the
 * binding only routes read intents to the existing Planner owner.
 *
 * INT3: the second live capability is bound — the read-only Shopping binding (see
 * ./bindings/shopping.ts). It reuses the same Port → Handler → Binding pattern and routes
 * read intents to the existing Shopping owner; the platform still owns NO shopping logic.
 *
 * INT4: the third live capability is bound — the read-only Nutrition / Knowledge binding
 * (see ./bindings/nutrition-knowledge.ts). It reuses the same pattern and routes read
 * intents to the existing source-gated Nutrition / Knowledge owner; the platform still owns
 * NO nutrition logic, no health-claim logic and no knowledge store.
 *
 * INT8: the fourth live capability is bound — the read-only Pantry binding (see
 * ./bindings/pantry.ts). It reuses the same pattern and routes read intents to the existing
 * Pantry owner (storage.ts); the platform still owns NO pantry logic, no ingredient
 * knowledge and no pantry mutations.
 *
 * INT10: the fifth live capability is bound — the read-only Diary binding (see
 * ./bindings/diary.ts). It reuses the same pattern and routes read intents to the existing
 * Diary owner (storage.ts); the platform still owns NO diary logic, no wellness metrics
 * and no diary mutations.
 *
 * INT12: the sixth live capability is bound — the read-only Profile binding (see
 * ./bindings/profile.ts). It reuses the same pattern and routes read intents to the existing
 * Profile owner (storage.ts); the platform still owns NO profile logic and no preference
 * mutations.
 *
 * INT13: the seventh live capability is bound — the read-only Household binding (see
 * ./bindings/household.ts). It reuses the same pattern and routes read intents to the
 * existing Household owner (storage.ts + lib/household.ts); the platform still owns NO
 * household logic, no membership/eater mutations, and never surfaces the household's
 * inviteCode (join secret).
 *
 * INT14: the eighth live capability is bound — the read-only Partners binding (see
 * ./bindings/partners.ts). It reuses the same pattern and routes read intents to the
 * existing Partners owner (lib/supermarket-basket-service.ts), narrowly scoped to the
 * static retailer list; the platform still owns NO retailer logic, no price comparison,
 * and never fabricates a per-store price or recommendation.
 *
 * INT15: the ninth live capability is bound — the read-only Meals binding (see
 * ./bindings/meals.ts). It reuses the same pattern and routes read intents to the
 * existing Meals owner (storage.ts), scoped to list/summary/detail; the platform still
 * owns NO meal/recipe logic, no ranking, no nutrition, and replicates (never relaxes)
 * the existing route's ownership check for single-meal detail reads.
 *
 * INT25: the `search` verb is added to the Meals binding. It resolves the INT15 open
 * decision (unsafe `lookupMeals`) by filtering the caller's already-scoped `getMeals` +
 * `getSystemMeals` client-side — no new storage method, no schema change.
 *
 * INT16: the tenth live capability is bound — the read-only Templates binding (see
 * ./bindings/templates.ts). It reuses the same pattern and routes read intents to the
 * existing Templates owner (storage.ts), scoped to meal-templates (public shell
 * reference data) and plan-templates (own-data + published-global); the platform still
 * owns NO template/plan logic, resolves tier server-side from the caller's own premium
 * status (never a request parameter), and is STRICTER than the existing single-template
 * route by applying an owner/published/admin gate that route does not have.
 *
 * INT17: the eleventh live capability is bound — the read-only Analyser binding (see
 * ./bindings/analyser.ts). It reuses the same pattern and routes read intents to the
 * existing Analyser owner (storage.ts), scoped ONLY to the static additives reference
 * table; the platform still owns NO product-analysis/UPF logic and never fabricates a
 * UPF classification, health score, or NOVA group — those are pure computation over
 * caller-supplied text or a live, unstored OpenFoodFacts recompute, neither of which is
 * a safe stored read.
 */

import type { User } from "@shared/schema";
import { CapabilityRegistry } from "./capability-registry.js";
import { IntentEngine, type RouteOptions } from "./intent-engine.js";
import { resolveContext } from "./permissions.js";
import { bindPlannerReadCapability } from "./bindings/planner.js";
import { bindShoppingReadCapability } from "./bindings/shopping.js";
import { bindNutritionKnowledgeReadCapability } from "./bindings/nutrition-knowledge.js";
import { bindPantryReadCapability } from "./bindings/pantry.js";
import { bindDiaryReadCapability } from "./bindings/diary.js";
import { bindProfileReadCapability } from "./bindings/profile.js";
import { bindHouseholdReadCapability } from "./bindings/household.js";
import { bindPartnersReadCapability } from "./bindings/partners.js";
import { bindMealsReadCapability } from "./bindings/meals.js";
import { bindTemplatesReadCapability } from "./bindings/templates.js";
import { bindAnalyserReadCapability } from "./bindings/analyser.js";
import type {
  Capability,
  CapabilityHandler,
  IntelligenceContext,
  Intent,
  IntentOutcome,
  IntentVerb,
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

  /**
   * Capability discovery — only capabilities that have at least one executable intent.
   * Discovery surfaces that must not over-advertise functionality should call this
   * rather than listCapabilities() (INT6A).
   */
  listExecutableCapabilities(): Capability[] {
    return this.registry.listExecutable();
  }

  /** Look up a single capability by id. */
  getCapability(capabilityId: string): Capability | undefined {
    return this.registry.get(capabilityId);
  }

  /** True if the given verb is currently executable for the named capability. */
  canExecute(capabilityId: string, verb: IntentVerb): boolean {
    return this.registry.isExecutable(capabilityId, verb);
  }

  // --- Future extension point ---------------------------------------------

  /**
   * Bind an execution handler for a capability (FUTURE workstreams only). The handler
   * is the single place that calls the owning business service; it must hold no
   * business logic of its own (TIP1 §5). INT1 binds none.
   *
   * executableIntents declares exactly which verbs the handler will actually execute
   * (vs. returning honest gaps). Must be a subset of the capability's supportedIntents.
   * This keeps registry discovery truthful — discovery uses executableIntents, never
   * supportedIntents, to determine what the platform can currently do (INT6A).
   */
  registerHandler(
    capabilityId: string,
    handler: CapabilityHandler,
    executableIntents: readonly IntentVerb[] = [],
  ): void {
    this.registry.bindHandler(capabilityId, handler, executableIntents);
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
 *
 * INT2 activates the first live capability on it: the read-only Planner binding. INT3
 * activates the second: the read-only Shopping binding. INT4 activates the third: the
 * read-only Nutrition / Knowledge binding. INT8 activates the fourth: the read-only
 * Pantry binding. INT10 activates the fifth: the read-only Diary binding. INT12
 * activates the sixth: the read-only Profile binding. INT13 activates the seventh: the
 * read-only Household binding. INT14 activates the eighth: the read-only Partners
 * binding. INT15 activates the ninth: the read-only Meals binding. INT16 activates the
 * tenth: the read-only Templates binding. INT17 activates the eleventh: the read-only
 * Analyser binding, scoped only to the static additives reference table. All register
 * handlers whose owning-service imports are lazy, so constructing the singleton still
 * opens no database connection.
 */
export const intelligencePlatform = new IntelligencePlatform();
bindPlannerReadCapability(intelligencePlatform);
bindShoppingReadCapability(intelligencePlatform);
bindNutritionKnowledgeReadCapability(intelligencePlatform);
bindPantryReadCapability(intelligencePlatform);
bindDiaryReadCapability(intelligencePlatform);
bindProfileReadCapability(intelligencePlatform);
bindHouseholdReadCapability(intelligencePlatform);
bindPartnersReadCapability(intelligencePlatform);
bindMealsReadCapability(intelligencePlatform);
bindTemplatesReadCapability(intelligencePlatform);
bindAnalyserReadCapability(intelligencePlatform);
