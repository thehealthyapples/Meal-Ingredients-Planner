/**
 * test-intent-nutrition-balance-route.ts
 * =========================================
 * "What nutrients are missing from a balanced diet this week?" (owner-reported,
 * 2026-11-11) had NO route at all — not even a wrong one. The real, diet-pattern-
 * independent `nutrition-balance-gap` opportunity (opportunity-engine.ts
 * `identifyNutritionBalanceOpportunities`) already exists and is already reachable
 * through `food-intelligence:report` — the SAME single path the existing uplift/
 * "make this meal healthier" matchers use (pattern-intent-resolver.ts
 * FOOD_INTELLIGENCE_MATCHERS) — it just needed a route for THIS phrasing, not a
 * second delivery path through `opportunity-delivery` (which deliberately carries
 * no resolver matcher of its own — the INT42 "one delivery path" invariant).
 *
 * These assertions are intentionally narrow, matching the existing matchers'
 * own discipline: a bare food-knowledge question or the planner's own "add more
 * vegetables" question must stay untouched.
 *
 *   npx tsx server/tests/test-intent-nutrition-balance-route.ts
 */

import { PatternIntentResolver } from "../intelligence/pattern-intent-resolver.js";
import type { IntentResolutionHints, ResolvedIntent } from "../intelligence/intent-resolver.js";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const resolver = new PatternIntentResolver();
const hints: IntentResolutionHints = { surface: "floating", temporalAnchor: "2026-11-11" };

function firstWith(results: ResolvedIntent[], cap: string): ResolvedIntent | undefined {
  return results.find((r) => r.capability === cap);
}

async function main(): Promise<void> {
  console.log("1. The reported utterance now routes to the real opportunity engine");
  {
    const results = await resolver.resolve("what nutrients are missing from a balanced diet this week", hints);
    const hit = firstWith(results, "food-intelligence");
    check("food-intelligence:report fires", hit?.verb === "report", JSON.stringify(hit));
    check("never opportunity-delivery (would reopen the single-delivery-path issue)", !firstWith(results, "opportunity-delivery"));
  }

  console.log("\n2. Near-variant phrasings also route");
  {
    const a = await resolver.resolve("is my diet balanced this week?", hints);
    check("'is my diet balanced this week?' routes", firstWith(a, "food-intelligence")?.verb === "report");

    const b = await resolver.resolve("what's my nutrition balance looking like?", hints);
    check("'nutrition balance' routes", firstWith(b, "food-intelligence")?.verb === "report");

    const c = await resolver.resolve("any nutrient gaps I should know about?", hints);
    check("'nutrient gaps' routes", firstWith(c, "food-intelligence")?.verb === "report");
  }

  console.log("\n3. Deliberately narrow — unrelated questions stay untouched");
  {
    const bareHealthy = await resolver.resolve("is white bread always bad for you?", hints);
    check("a bare food-knowledge question does not acquire this route", !firstWith(bareHealthy, "food-intelligence") || firstWith(bareHealthy, "food-intelligence")!.verb !== "report");

    const plannerAdd = await resolver.resolve("where can I add more vegetables this week?", hints);
    const plannerHit = firstWith(plannerAdd, "planner");
    check("'add more vegetables' (PL-028) keeps its own planner route, not this one",
      !firstWith(plannerAdd, "food-intelligence") && !!plannerHit);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
