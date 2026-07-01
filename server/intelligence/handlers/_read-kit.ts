/**
 * Read Binding Kit (INT6B)
 * ========================
 * Shared infrastructure for read-only capability bindings. Contains ONLY common
 * plumbing: parameter coercion, authentication guards, honest-failure constructors,
 * and the read-only verb guard. Contains NO business logic, NO projections, NO
 * domain-specific behaviour — those remain explicit inside each capability handler.
 *
 * Rule: if it touches a domain concept (planner, shopping, nutrition, …) it does
 * NOT belong here. Add it to the specific handler instead.
 *
 * Governing architecture: TIP1 §5 (engine holds no business rules) · Principle 6
 * (honest gaps over fabricated results) · INT5 recommendation C5.
 */

import {
  CapabilityExecutionError,
  type IntelligenceContext,
  type Intent,
  type IntentVerb,
} from "../types.js";

// ---------------------------------------------------------------------------
// Parameter coercion
// ---------------------------------------------------------------------------

/**
 * Coerce a parameter to a positive integer, or undefined if absent/invalid.
 * Used by household-scoped handlers to parse ids and numbers from intent parameters.
 */
export function toInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return undefined;
}

// ---------------------------------------------------------------------------
// Honest-failure helpers
// ---------------------------------------------------------------------------

/** Construct an honest gap error (no answer for this request — not a fault). */
export const gap = (message: string): CapabilityExecutionError =>
  new CapabilityExecutionError("gap", message);

/** Construct an honest denied error (ownership or authentication check failed). */
export const denied = (message: string): CapabilityExecutionError =>
  new CapabilityExecutionError("denied", message);

// ---------------------------------------------------------------------------
// Authentication guard
// ---------------------------------------------------------------------------

/**
 * Require an authenticated, numeric user id from the server-resolved context.
 * Throws a structured `denied` error when the request is anonymous or the resolved
 * id is not a valid integer. The Intelligence Platform resolves identity server-side;
 * this guard is a structural check, never a prompt-level gate.
 *
 * @param capabilityName - Displayed in the denial message (e.g. "Planner", "Shopping").
 */
export function requireUserId(context: IntelligenceContext, capabilityName: string): number {
  const userId = toInt(context.userId);
  if (userId === undefined) {
    throw denied(
      `${capabilityName} access requires an authenticated user; the request has no resolved user. ` +
        `The Intelligence Platform never grants anonymous or cross-user ${capabilityName.toLowerCase()} access.`,
    );
  }
  return userId;
}

// ---------------------------------------------------------------------------
// Read-only verb guard
// ---------------------------------------------------------------------------

/**
 * Assert that the intent verb is one the read-only binding can execute. Throws an
 * honest `gap` error for any other verb, passing the unexecutable verb back on the
 * error so the engine can surface it in the outcome.
 *
 * This is a structural guard for the read-only binding contract — it does not
 * contain per-verb business reasoning. Capability-specific per-verb gap messages
 * (e.g. why "analyse" is a gap for nutrition-knowledge) remain explicit in the handler.
 *
 * @param executableVerbs - The verbs this binding actually handles (subset of supportedIntents).
 * @param capabilityName  - Displayed in the gap message (e.g. "Planner", "Shopping").
 */
export function readOnlyVerbGuard(
  intent: Intent,
  executableVerbs: ReadonlyArray<IntentVerb>,
  capabilityName: string,
): void {
  if (!executableVerbs.includes(intent.verb)) {
    throw new CapabilityExecutionError(
      "gap",
      `${capabilityName} is bound to the Intelligence Platform read-only: "${intent.verb}" is not executable via the platform. ` +
        `The ${capabilityName} service remains the sole owner of all ${capabilityName.toLowerCase()} write operations.`,
      intent.verb,
    );
  }
}
