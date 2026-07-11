/**
 * shared/attention/decision.ts — the canonical THA Decision mechanics (DEC1)
 * ===========================================================================
 * The ONE implementation of the pure Decision-stage mechanics, established by
 * DEC1 (docs/architecture/THA_DECISION_ENGINE_ARCHITECTURE.md, promoted from
 * docs/investigations/intelligence/DEC1_CANONICAL_DECISION_ENGINE.md §3.2 D2). It replaces
 * the three byte-similar, module-local rank/clamp/dedupe/citation copies
 * previously declared in:
 *
 *   - server/intelligence/food-intelligence/opportunity-engine.ts
 *       (`prioritizeOpportunities`'s local sort + `DEFAULT/MAX_OPPORTUNITY_LIMIT`
 *        clamp pair + `FoodOpportunityEvidence`)
 *   - server/intelligence/opportunity-delivery/framework.ts
 *       (`prioritiseAndGroup`'s local sort + `DEFAULT/MAX_LIMIT` clamp pair +
 *        `OpportunityEvidence`)
 *   - server/intelligence/conversation/notice-engine.ts
 *       (`applySilenceRules`'s local dedupe + sort + `NoticeEvidence`)
 *
 * all retired under DEC1 (Principle 8 — retire on introduction). This module is
 * a REFERENCE MECHANICS module in the exact class ATTN1 established for the
 * vocabulary beside it (Core Principle 5): not a store, not a service, not a
 * capability. PURE AND ZERO-I/O by construction — no clock, no randomness, no
 * imports beyond the attention vocabulary itself — so importing it from the
 * Notice Engine does not violate that adapter's zero-dependency rationale,
 * by exactly the argument ATTN1 already banked: `shared/` pure code is not an
 * I/O dependency.
 *
 * WHAT THESE MECHANICS ARE (and are not): the Decision stage of the platform's
 * Evidence → Attention → Decision → Action pipeline orders and budgets
 * ALREADY-TRUE, ALREADY-PRIORITISED items. Nothing here derives an attention
 * level (producer-assigned, ATTN1 invariant A1), gates confidence (the
 * evidence gate in shared/knowledge/evidence.ts runs FIRST and is never
 * consulted here — A5), selects a domain winner (Planner scoring and COMP1's
 * verdict ladder are domain-owned Selection, never absorbed — DEC1 D5), or
 * changes what may be ACTED on (`ConfirmationTier` — A7). The functions are
 * deliberately parameterised only over things a caller already decided.
 */

import { ATTENTION_RANK, isCritical, type AttentionLevel } from "./index.js";

// ---------------------------------------------------------------------------
// The canonical evidence citation
// ---------------------------------------------------------------------------

/**
 * One supporting fact, copied verbatim from the owner that produced it — the
 * one canonical `{source, detail}` citation shape (Rule E1: no citation, no
 * card). Replaces the three structurally identical types this shape used to be
 * re-declared as (`FoodOpportunityEvidence`, `OpportunityEvidence`,
 * `NoticeEvidence`) — those names survive as aliases of this type at their
 * original export sites, so no consumer changes.
 */
export interface EvidenceCitation {
  readonly source: string;
  readonly detail: string;
}

// ---------------------------------------------------------------------------
// The canonical attention ordering
// ---------------------------------------------------------------------------

/** The one field every Decision-stage item must carry: a producer-assigned attention level (ATTN1 A1 — never re-derived here). */
export interface AttentionOrdered {
  readonly priority: AttentionLevel;
}

/**
 * One additional sort key, evaluated once per item before the sort. Lower
 * sorts first (mirrors ATTENTION_RANK's own convention). Callers use these for
 * the keys that are legitimately theirs — OD1 passes its LEARN1 learning rank
 * and COACH1 seen flag; FI4 and the Notice Engine pass none.
 */
export type AttentionTieBreaker<T> = (item: T, index: number) => number;

/**
 * The canonical stable multi-key attention sort: ATTENTION_RANK first
 * (critical → high → medium → low), then each supplied tie-breaker in order,
 * then arrival order — so items equal on every key keep the order their
 * producer emitted them in. PURE — no I/O, no randomness, no clock reads, and
 * the input array is never mutated.
 *
 * Attention is deliberately the FIRST key and cannot be displaced: no
 * tie-breaker (learning, novelty, or any future key) can move an item across
 * an attention tier — a confirmed dislike re-orders advice within its tier; it
 * never buries urgent advice beneath trivia (NK2 Rule P1, ATTN1 F4/F5).
 */
export function orderByAttention<T extends AttentionOrdered>(
  items: readonly T[],
  tieBreakers: readonly AttentionTieBreaker<T>[] = [],
): T[] {
  return items
    .map((item, index) => ({
      item,
      index,
      keys: tieBreakers.map((tieBreaker) => tieBreaker(item, index)),
    }))
    .sort((a, b) => {
      const rankDiff = ATTENTION_RANK[a.item.priority] - ATTENTION_RANK[b.item.priority];
      if (rankDiff !== 0) return rankDiff;
      for (let i = 0; i < a.keys.length; i += 1) {
        const keyDiff = a.keys[i] - b.keys[i];
        if (keyDiff !== 0) return keyDiff;
      }
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

// ---------------------------------------------------------------------------
// The canonical delivery budget clamp
// ---------------------------------------------------------------------------

/**
 * The one delivery budget constant pair (DEC1 D4 — the budget doctrine's
 * "ambient delivery" row). Previously declared byte-for-byte twice
 * (opportunity-engine.ts and framework.ts). Changing either value is a
 * reviewed budget decision, exactly as CRITICAL_TYPES membership is
 * (attention-inflation risk R1 has a budget-inflation twin). The Notice
 * Engine's MAX_NOTICES_PER_MOMENT is deliberately NOT here: the
 * presentation-edge attention budget is the Silence Rules' own governed seam
 * (INT20), and the Silence Rules are a CONSUMER of these mechanics, never a
 * subordinate of the Decision Engine.
 */
export const DELIVERY_DEFAULT_LIMIT = 10;
export const DELIVERY_MAX_LIMIT = 30;

/** The one limit-normalisation rule: a caller-supplied limit is honoured within [1, maxLimit]. */
export function clampLimit(limit: number, maxLimit: number = DELIVERY_MAX_LIMIT): number {
  return Math.min(Math.max(limit, 1), maxLimit);
}

/**
 * The canonical delivery clamp with ATTN1's invariant-A3 exemption: every
 * `critical` item is admitted BEFORE the limit is applied to the remainder, so
 * a harm signal can never be silently dropped by a cap. Expects an
 * already-ordered list (criticals sort first under {@link orderByAttention},
 * so the admitted criticals keep their position at the head). PURE.
 */
export function clampWithCriticalExemption<T extends AttentionOrdered>(
  ordered: readonly T[],
  limit: number,
  maxLimit: number = DELIVERY_MAX_LIMIT,
): T[] {
  const clampedLimit = clampLimit(limit, maxLimit);
  const critical: T[] = [];
  const rest: T[] = [];
  for (const item of ordered) {
    (isCritical(item.priority) ? critical : rest).push(item);
  }
  return [...critical, ...rest.slice(0, clampedLimit)];
}

// ---------------------------------------------------------------------------
// The canonical de-duplication
// ---------------------------------------------------------------------------

/** First occurrence wins; later duplicates are dropped. PURE; input never mutated. */
export function dedupeById<T extends { readonly id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
