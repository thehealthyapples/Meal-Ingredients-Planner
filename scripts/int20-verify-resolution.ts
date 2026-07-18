/**
 * int20-verify-resolution.ts — INT20 end-to-end verification
 * ===========================================================
 * Drives the REAL ConversationGateway turn pipeline with in-memory stores and
 * prints what a household would actually get back — the reply, the platform
 * outcome, and the Companion Action proposals persisted for the turn.
 *
 * Mirrors `scripts/comp-act2-verify-surfacing.ts`. Developer tooling: it opens
 * no network connection, writes to no real store, and executes no action —
 * proposals are created in the `proposed` state and never confirmed.
 *
 * Run: npx tsx scripts/int20-verify-resolution.ts
 */

import { ConversationGateway } from "../server/intelligence/conversation/conversation-gateway.js";
import { InMemoryConversationStore } from "../server/intelligence/conversation/conversation-store.js";
import { InMemoryCompanionActionStore } from "../server/intelligence/conversation/companion-action-store.js";
import type { IntelligenceContext } from "../server/intelligence/types.js";

const identity = (id: number): IntelligenceContext => ({ role: "user", userId: String(id) });

async function main(): Promise<void> {
  const gw = new ConversationGateway(
    new InMemoryConversationStore(),
    undefined,
    undefined,
    undefined,
    undefined,
    new InMemoryCompanionActionStore(),
  );

  const utterances: ReadonlyArray<readonly [string, string]> = [
    ["add salmon to my shopping list",        "bound verb, no ids needed → proposal"],
    ["remove milk from my shopping list",     "needs an id → resolved from the live list"],
    ["add bananas to my pantry",              "category required → clarification"],
    ["log porridge for breakfast",            "calendar-shaped → resolves against the anchor"],
    ["log tonight's dinner",                  "no food named → clarification"],
    ["add tuna spaghetti to Tuesday lunch",   "planner coordinates → resolved or asked"],
    ["add chilli to today's dinner",          "planner + calendar → must ask, never guess"],
    ["generate a meal plan for next week",    "unbound → unchanged read-only refusal"],
    ["what should I add to the pantry?",      "a question → not a command at all"],
  ];

  for (const [utterance, note] of utterances) {
    const r = await gw.processUserTurn(42, utterance, "shopping", {}, identity(42));
    const actions = (r as { actions?: Array<Record<string, unknown>> }).actions ?? [];
    console.log("\n──────────────────────────────────────────────────────────────");
    console.log(`SAID     : "${utterance}"`);
    console.log(`(expect) : ${note}`);
    console.log(`REPLY    : ${r.text}`);
    console.log(`OUTCOME  : ${r.outcome?.status ?? "(none)"}`);
    console.log(`ACTIONS  : ${actions.length}`);
    for (const a of actions) {
      console.log(`   → ${a.capabilityId}.${a.verb}  tier=${a.confirmationTier}  status=${a.status}`);
      console.log(`     params: ${JSON.stringify(a.parameters)}`);
    }
  }

  console.log("\n──────────────────────────────────────────────────────────────");
  console.log("Nothing above was executed: every proposal is in the `proposed` state.");
}

main().catch((err) => {
  console.error("[int20-verify-resolution] failed:", err);
  process.exit(1);
});
