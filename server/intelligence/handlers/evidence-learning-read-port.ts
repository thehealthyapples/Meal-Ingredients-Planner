/**
 * Evidence & Learning Read Port (EL1)
 * =====================================
 * The NARROW delegation surface the `evidence-learning` capability handler is
 * allowed to call. Forwards 1:1 to the EL1 framework (pattern detection +
 * orchestration) and store, plus the household-membership owner
 * (`server/lib/household.ts`) for authorization - exactly the same shape
 * every other capability's read port already uses (see
 * planner-read-port.ts, opportunity-delivery-read-port.ts). This port adds NO
 * reasoning of its own; it is a typed seam so that:
 *   - the handler delegates (never re-implements) evidence capture, pattern
 *     detection and confirmation, and
 *   - tests can inject an in-memory store to prove delegation without a live
 *     database.
 */

import type {
  DecideSignalInput,
  ListSignalsQuery,
  RecordOutcomeParams,
} from "./evidence-learning-handler.js";
import type {
  RecordOutcomeResult,
} from "../evidence-learning/framework.js";
import type { HouseholdLearningSignal } from "@shared/schema";

/** The read/write-but-ownership-scoped owning surface EL1's handler is allowed to call. */
export interface EvidenceLearningReadPort {
  /** Household-membership owner - resolves the caller's active household (authorization). */
  getHouseholdForUser(userId: number): Promise<number>;
  /** Appends one evidence event, then re-runs detection over its own dimension only. */
  recordOutcome(params: RecordOutcomeParams): Promise<RecordOutcomeResult>;
  /** Lists this household's learning signals (patterns), optionally filtered by domain/status. */
  listSignals(query: ListSignalsQuery): Promise<readonly HouseholdLearningSignal[]>;
  /** Confirms or declines a pending signal - ownership-checked against the caller's own household. */
  decideSignal(input: DecideSignalInput): Promise<HouseholdLearningSignal | null>;
}

/**
 * Build the production port over the real EL1 framework + database store.
 * DYNAMIC imports so constructing this port never opens a database
 * connection at module-load time - the same discipline every other
 * capability's production port uses.
 */
export async function createStoreEvidenceLearningReadPort(): Promise<EvidenceLearningReadPort> {
  const { getHouseholdForUser } = await import("../../lib/household.js");
  const { evidenceLearningStore } = await import("../evidence-learning/evidence-learning-store.js");
  const { recordOutcomeAndDetect, listHouseholdSignals, decideSignal } = await import(
    "../evidence-learning/framework.js"
  );

  return {
    getHouseholdForUser: (userId) => getHouseholdForUser(userId),
    recordOutcome: (params) => recordOutcomeAndDetect(params, evidenceLearningStore),
    listSignals: (query) => listHouseholdSignals(query, evidenceLearningStore),
    decideSignal: (input) => decideSignal(
      { id: input.id, decision: input.decision, userId: input.userId, notes: input.notes },
      input.householdId,
      evidenceLearningStore,
    ),
  };
}
