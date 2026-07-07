/**
 * Uplift Read Port (INT42 — twenty-second live capability binding)
 * ====================================================================
 * The NARROW, read-only delegation surface the Uplift capability handler is
 * allowed to call. Every method here forwards 1:1 to an EXISTING owning
 * service — the Nutrition Uplift Engine (`server/lib/uplift-engine.ts`,
 * `server/lib/uplift-rules.ts` — SoT Domain 17, "Nutrition Boost (Uplift)")
 * and the Meals owner (`server/storage.ts`, SoT D12) for the single meal
 * being matched. This port adds NO matching logic of its own; the rule index
 * is built once and memoised, mirroring the EXACT pattern already used by
 * `server/lib/meal-intelligence-assembler.ts` and
 * `server/lib/food-intelligence-assembler.ts` for the same engine.
 *
 * Neither the engine nor this port owns any business-domain data — the rules
 * themselves remain owned by `uplift-rules.ts` (human-authored, `reviewedAt`-
 * gated), and the meal being matched remains owned by `storage.ts`. This port
 * only *reads* what both existing owners already expose.
 */

import { buildRuleIndex, matchUpliftRules } from "../../lib/uplift-engine.js";
import { UPLIFT_RULES } from "../../lib/uplift-rules.js";
import type { UpliftContext, UpliftMatchResult } from "../../lib/uplift-types.js";
import type { Meal } from "@shared/schema";

/**
 * The read-only owning-surface. `getMeal` forwards to the Meals owner
 * (NOT ownership-scoped by the owner — see `meals-read-port.ts`'s identical
 * note; the handler built on this port replicates the same ownership check).
 * `matchMeal` forwards to the Uplift Engine's own pure, deterministic matcher
 * — no I/O, no AI, sub-30ms (see `uplift-engine.ts` module header).
 */
export interface UpliftReadPort {
  getMeal(mealId: number): Promise<Meal | undefined>;
  matchMeal(ctx: UpliftContext): UpliftMatchResult[];
}

// Memoised once per process — identical discipline to meal-intelligence-assembler.ts
// and food-intelligence-assembler.ts's own `getRuleIndex()`. Rules without
// `reviewedAt` are excluded by the engine itself (the approval gate).
let _ruleIndex: ReturnType<typeof buildRuleIndex> | null = null;
function getRuleIndex(): ReturnType<typeof buildRuleIndex> {
  if (!_ruleIndex) _ruleIndex = buildRuleIndex(UPLIFT_RULES);
  return _ruleIndex;
}

/**
 * Build the production port over the real Meals owner and Uplift Engine.
 * The storage import is DYNAMIC so that loading the Intelligence Platform
 * module (and its tests) never opens a database connection at import time —
 * the owner is only touched on first invocation (mirrors every other
 * read port in this directory).
 */
export async function createEngineUpliftReadPort(): Promise<UpliftReadPort> {
  const { storage } = await import("../../storage.js");
  return {
    getMeal: (mealId) => storage.getMeal(mealId),
    matchMeal: (ctx) => matchUpliftRules(ctx, getRuleIndex()),
  };
}
