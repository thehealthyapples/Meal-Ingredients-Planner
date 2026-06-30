/**
 * THA Intelligence Platform — public module surface
 * =================================================
 * The single import surface for the canonical Intelligence Platform foundation
 * (INT1). Import the singleton `intelligencePlatform` for orchestration; import the
 * types/classes for tests and future workstreams.
 *
 * This is INTERNAL platform infrastructure. It exposes NO HTTP endpoints and NO UI.
 * Wiring any route or surface to it is a future, governed workstream (INT2+).
 */

export {
  IntelligencePlatform,
  intelligencePlatform,
} from "./intelligence-platform.js";

export { CapabilityRegistry, type CapabilityGap } from "./capability-registry.js";
export { IntentEngine, type RouteOptions } from "./intent-engine.js";
export {
  resolveContext,
  canInvokeCapability,
  canAccessKnowledgeClass,
  roleMeetsMinimum,
  confirmationFor,
  type PermissionDecision,
} from "./permissions.js";

export type {
  Capability,
  CapabilityAvailability,
  CapabilityClass,
  CapabilityHandler,
  CapabilityPermissions,
  AiAccessPosture,
  ConfirmationTier,
  IntelligenceContext,
  IntelligenceRole,
  Intent,
  IntentOutcome,
  IntentOutcomeStatus,
  IntentVerb,
  KnowledgeClass,
} from "./types.js";
