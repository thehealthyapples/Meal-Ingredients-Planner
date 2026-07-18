/**
 * The Developer Plane (ENGINT1)
 * =============================
 * The isolated Intelligence Platform instance on which Engineering Intelligence
 * — the `developer` capability — is reachable. It is the enforcement of
 * `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §7, in code.
 *
 * WHY THIS FILE EXISTS AT ALL. §7 is unambiguous: Developer Intelligence is
 * *"the same plane with the `developer` knowledge class and developer
 * capabilities unlocked, deployed in an isolated environment that user traffic
 * never reaches … It is *not* a more-permissive user assistant on the same
 * endpoint — sharing an endpoint would make boundary 2 a single
 * misclassification away from a leak. Same architecture, separate deployment."*
 * And §4.2 lists what a household must NEVER be shown: source code, file paths,
 * developer investigations, internal architecture, the unpublished roadmap —
 * which is a precise description of everything Engineering Intelligence reads.
 * Risk R1 rates a developer-class chunk reaching a user as 🔴 Critical.
 *
 * So this is the same architecture — the same `IntelligencePlatform`, the same
 * `CapabilityRegistry`, the same `IntentEngine`, the same Companion — in a
 * separate instance. One platform, one Companion, one registry: instantiated
 * twice, unlocked differently, and never joined.
 *
 * FOUR INDEPENDENT LOCKS, each sufficient alone. This is defence in depth
 * because a single misclassification is the whole of Risk R1:
 *
 *   1. SEED — the canonical user-facing seed keeps `developer` at
 *      `availability: "never"`. `permissions.ts` rejects "never" BEFORE any role
 *      check, so on the user plane the capability is unreachable by
 *      construction, not by policy.
 *   2. BINDING — the engineering handler is bound only to the platform this
 *      module builds. The user-facing singleton in `intelligence-platform.ts`
 *      never calls the binder, so it holds no handler to invoke.
 *   3. ROLE — `permissions.resolveContext()` cannot produce the `developer`
 *      role for a live session; it only ever yields `user` or `admin`. The
 *      developer context is constructible only here, in an env-gated module.
 *   4. ENVIRONMENT — every entry point below throws unless
 *      `THA_DEVELOPER_PLANE === "1"`, which is unset in production.
 *
 * WHAT THIS MODULE MUST NEVER DO. It must never be imported by `server/routes.ts`,
 * by any user-facing route, or by the Companion conversation gateway. There is no
 * HTTP surface here and none may be added without amending §7 first. Engineering
 * Intelligence answers a developer on a developer deployment; it does not answer
 * a household, and no flag flip should ever make it able to.
 */

import { CapabilityRegistry, developerPlaneSeed } from "./capability-registry.js";
import { IntelligencePlatform } from "./intelligence-platform.js";
import { bindEngineeringKnowledgeReadCapability } from "./bindings/engineering-knowledge.js";
import type { IntelligenceContext } from "./types.js";
import type { EngineeringKnowledgeReadPort } from "./handlers/engineering-knowledge-read-port.js";

/** The environment flag that unlocks the plane. Unset everywhere but a developer deployment. */
export const DEVELOPER_PLANE_ENV_FLAG = "THA_DEVELOPER_PLANE";

export function isDeveloperPlaneEnabled(): boolean {
  return process.env[DEVELOPER_PLANE_ENV_FLAG] === "1";
}

function assertDeveloperPlane(): void {
  if (isDeveloperPlaneEnabled()) return;
  throw new Error(
    "The developer plane is not enabled in this environment. Engineering Intelligence reads " +
      "developer-class knowledge — internal architecture, investigations, file paths and the unpublished " +
      "roadmap — which THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §4.2 forbids the user plane from ever " +
      `surfacing. Set ${DEVELOPER_PLANE_ENV_FLAG}=1 only on an isolated developer deployment that user ` +
      "traffic cannot reach (§7). This is not a permission check to be relaxed — it is a deployment " +
      "boundary.",
  );
}

let plane: IntelligencePlatform | null = null;

/**
 * The developer-plane Intelligence Platform. Built lazily, once, from the same
 * classes the user plane uses — the only difference is the seed, in which
 * `developer` is `registered` rather than `never`, and the binding that follows.
 *
 * Note what is NOT different: not the engine, not the permission model, not the
 * context composition, not the conversation gateway. A developer asking this
 * platform a question travels the identical pipeline a household does. That is
 * §7's *"same architecture, separate deployment"* held to literally, and it is
 * why Engineering Intelligence needed no second assistant.
 */
export function developerPlanePlatform(
  resolvePort?: () => Promise<EngineeringKnowledgeReadPort>,
): IntelligencePlatform {
  assertDeveloperPlane();

  if (!plane) {
    const built = new IntelligencePlatform(new CapabilityRegistry(developerPlaneSeed()));
    bindEngineeringKnowledgeReadCapability(built, resolvePort);
    plane = built;
  }
  return plane;
}

/**
 * A `developer`-role context. Constructible ONLY here, and only when the plane
 * is enabled — `permissions.resolveContext()` never produces this role from a
 * live session, so there is no path by which a household request acquires it.
 */
export function developerPlaneContext(userId?: string): IntelligenceContext {
  assertDeveloperPlane();
  return { role: "developer", userId, premium: false };
}

/** Test seam — drops the memoised plane so a test can rebuild it with a stub port. */
export function resetDeveloperPlane(): void {
  plane = null;
}
