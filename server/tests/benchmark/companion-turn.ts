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
 */

import { conversationGateway } from "../../intelligence/conversation/conversation-gateway.js";
import { intelligencePlatform } from "../../intelligence/intelligence-platform.js";
import type { User } from "../../../shared/schema.js";
import type { CapturedTurn } from "./scorer.js";
import type { TurnRunner } from "./runner.js";

/**
 * Build a TurnRunner that executes each utterance through the one Companion seam as
 * the given acting user, on the "floating" surface (exactly the path a real user's
 * message takes). `personality` is the acting user's configured Companion voice,
 * resolved once by the caller and stamped on every captured turn for the personality
 * breakdown.
 */
export function makeCompanionTurnRunner(user: User, personality: string): TurnRunner {
  const ctx = intelligencePlatform.contextFor(user);
  return async (utterance: string): Promise<CapturedTurn> => {
    const startedAt = Date.now();
    try {
      const result = await conversationGateway.processUserTurn(
        user.id,
        utterance,
        "floating",
        {},
        ctx,
      );
      return {
        text: result.text ?? "",
        entityRefCount: result.entityRefs?.length ?? 0,
        outcomeStatus: result.outcome?.status ?? null,
        reachedCapability: result.outcome?.capabilityId ?? null,
        discoveryCount: result.discoveries?.length ?? 0,
        guidanceCount: result.guidance?.length ?? 0,
        guidanceKind: result.guidanceKind ?? null,
        enrichmentCount: result.enrichment?.length ?? 0,
        actionCount: result.actions?.length ?? 0,
        fallbackState: result.fallbackState ?? null,
        latencyMs: Date.now() - startedAt,
        error: null,
        personality,
      };
    } catch (err) {
      // A throw is a scored outcome: the platform failed to convert an internal
      // error into an honest gap (gate G5). Capture it, never crash the run.
      return {
        text: "",
        entityRefCount: 0,
        outcomeStatus: null,
        reachedCapability: null,
        discoveryCount: 0,
        guidanceCount: 0,
        guidanceKind: null,
        enrichmentCount: 0,
        actionCount: 0,
        fallbackState: "internal-error",
        latencyMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err),
        personality,
      };
    }
  };
}
