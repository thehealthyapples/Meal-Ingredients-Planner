/**
 * THA Intelligence Platform — Permission Model
 * ============================================
 * Permission-aware access for the Intelligence Platform, from day one (INT1
 * "Permissions"). This layer EXTENDS the existing access.ts primitives — it does not
 * replace or duplicate them (Principle 8). Authority is always server-resolved; the
 * platform never trusts a role asserted by an LLM (TIP1 §6.2 boundaries 2 & 3).
 *
 * INT1 establishes the ARCHITECTURE only. No role-specific behaviour is implemented;
 * `developer` and `service` are modelled as additive future roles (TIP1 §6.3).
 */

import type { User } from "@shared/schema";
import { isAdmin, hasPremiumAccess } from "../lib/access.js";
import type {
  Capability,
  ConfirmationTier,
  IntelligenceContext,
  IntelligenceRole,
  IntentVerb,
  KnowledgeClass,
} from "./types.js";

/** Verbs that never mutate state and never publish externally (TIP2 §4). */
const READ_ONLY_VERBS: ReadonlySet<IntentVerb> = new Set<IntentVerb>([
  "read", "explain", "search", "recommend", "suggest", "report", "compare", "analyse", "optimise",
]);

/**
 * Resolve an IntelligenceContext from the existing authenticated session user.
 * Maps the live `users.role` enum to an IntelligenceRole via access.ts. `developer`
 * and `service` are NOT derivable from the current schema (no schema change in INT1),
 * so they are never produced here — they exist in the type model for future,
 * governed grants only.
 */
export function resolveContext(user: User | null | undefined): IntelligenceContext {
  const role: IntelligenceRole = isAdmin(user) ? "admin" : "user";
  return {
    role,
    userId: user?.id != null ? String(user.id) : undefined,
    premium: hasPremiumAccess(user),
  };
}

/** Does the caller's role meet a capability's minimum role requirement? */
export function roleMeetsMinimum(role: IntelligenceRole, minimum: IntelligenceRole): boolean {
  // `service` is an internal, fully-trusted platform role.
  if (role === "service") return true;
  switch (minimum) {
    case "user":
      return role === "user" || role === "admin" || role === "developer";
    case "admin":
      // admin and developer are DISTINCT profiles (TIP1 §6.3): developer-alone is not admin.
      return role === "admin";
    case "developer":
      return role === "developer";
    case "service":
      return false; // only `service` (handled above) satisfies service.
  }
}

/** Can the caller's role read a given knowledge class? (TIP1 §6.3 permission matrix). */
export function canAccessKnowledgeClass(role: IntelligenceRole, knowledgeClass: KnowledgeClass): boolean {
  if (role === "service") return true;
  switch (knowledgeClass) {
    case "public":
      return true;
    case "admin":
      return role === "admin";
    case "developer":
      return role === "developer";
  }
}

export interface PermissionDecision {
  readonly allowed: boolean;
  readonly reason: string;
}

/**
 * The server-side capability boundary (TIP1 §6.2 boundary 3). A capability is
 * permitted only if the caller meets BOTH the minimum role AND the knowledge-class
 * gate. Ownership-scoped checks (does the caller own the target rows?) are delegated
 * to the owning service at invoke time — the platform never re-implements them.
 */
export function canInvokeCapability(
  context: IntelligenceContext,
  capability: Capability,
): PermissionDecision {
  if (capability.availability === "never") {
    return { allowed: false, reason: `Capability "${capability.id}" must never be exposed to this plane.` };
  }
  if (!roleMeetsMinimum(context.role, capability.permissions.minimumRole)) {
    return {
      allowed: false,
      reason: `Role "${context.role}" does not meet minimum role "${capability.permissions.minimumRole}" for "${capability.id}".`,
    };
  }
  if (!canAccessKnowledgeClass(context.role, capability.permissions.knowledgeClass)) {
    return {
      allowed: false,
      reason: `Role "${context.role}" cannot access "${capability.permissions.knowledgeClass}"-class knowledge for "${capability.id}".`,
    };
  }
  return { allowed: true, reason: "permitted" };
}

/**
 * Deterministic confirmation tier for a (capability × verb) — server-side, NOT an
 * LLM judgement (TIP2 §5.1). Destructive and publishing verbs always confirm; all
 * admin (audited) mutations escalate to strong.
 */
export function confirmationFor(capability: Capability, verb: IntentVerb): ConfirmationTier {
  if (READ_ONLY_VERBS.has(verb)) return "none";

  let tier: ConfirmationTier;
  switch (verb) {
    case "add":
      tier = "light";
      break;
    case "move":
    case "replace":
    case "generate":
    case "import":
      tier = "required";
      break;
    case "delete":
    case "share":
    case "export":
    case "order":
    case "review":
    case "approve":
      tier = "strong";
      break;
    default:
      tier = "required";
  }

  // Any admin (audited) mutation is always strong confirmation (TIP2 §5.1).
  if (capability.permissions.audited) return "strong";
  return tier;
}
