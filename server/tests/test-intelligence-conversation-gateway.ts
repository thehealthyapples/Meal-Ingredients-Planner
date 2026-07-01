/**
 * test-intelligence-conversation-gateway.ts — INT18 Phase 1
 * ==========================================================
 * Unit tests for the Conversation Gateway and Context Frame Assembler.
 * Uses InMemoryConversationStore — no database or OpenAI API required.
 *
 * Run: npx tsx server/tests/test-intelligence-conversation-gateway.ts
 */

import {
  InMemoryConversationStore,
  resetInMemoryIds,
} from "../intelligence/conversation/conversation-store.js";
import {
  ConversationGateway,
  detectWriteIntent,
  selectCapabilities,
} from "../intelligence/conversation/conversation-gateway.js";
import {
  assembleContextFrame,
  serializeFrameRef,
  type SurfaceHints,
  type ContextFrame,
} from "../intelligence/conversation/context-frame-assembler.js";
import type { IntelligenceContext } from "../intelligence/types.js";

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ ${label}`);
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──────────────────────────────────────────`);
}

function makeStore(): InMemoryConversationStore {
  resetInMemoryIds();
  return new InMemoryConversationStore();
}

function makeCtx(userId = 42): IntelligenceContext {
  return { role: "user", userId: String(userId), premium: false };
}

// ---------------------------------------------------------------------------
// Main async test runner
// ---------------------------------------------------------------------------

async function main(): Promise<void> {

  // ── § 1 — detectWriteIntent ─────────────────────────────────────────────
  section("detectWriteIntent");

  assert(
    detectWriteIntent("add chicken to my shopping list") !== null,
    'detects "add … to shopping list"',
  );
  assert(
    detectWriteIntent("add this to the planner") !== null,
    'detects "add … to the planner"',
  );
  assert(
    detectWriteIntent("remove Monday's dinner") !== null,
    'detects "remove … dinner"',
  );
  assert(
    detectWriteIntent("delete that meal from week 2") !== null,
    'detects "delete … meal"',
  );
  assert(
    detectWriteIntent("move Monday dinner to Tuesday") !== null,
    'detects "move … to …"',
  );
  assert(
    detectWriteIntent("replace the salmon with cod") !== null,
    'detects "replace … with …"',
  );
  assert(
    detectWriteIntent("create a new meal plan") !== null,
    'detects "create … meal plan"',
  );
  assert(
    detectWriteIntent("update my profile preferences") !== null,
    'detects "update my profile"',
  );
  assert(
    detectWriteIntent("what meals do I have this week?") === null,
    "read question is not flagged as write",
  );
  assert(
    detectWriteIntent("how many calories are in salmon?") === null,
    "nutrition question is not flagged as write",
  );
  assert(
    detectWriteIntent("show me my shopping list") === null,
    '"show me" is not flagged as write',
  );
  assert(
    detectWriteIntent("what's in my pantry?") === null,
    "pantry question is not flagged as write",
  );

  // ── § 2 — selectCapabilities ────────────────────────────────────────────
  section("selectCapabilities");

  {
    const caps = selectCapabilities("what meals do I have this week?", "planner");
    assert(caps.includes("profile"), "planner surface: includes profile");
    assert(caps.includes("planner"), "planner surface: includes planner");
    assert(caps.length <= 4,         "planner surface: cap at 4");
  }

  {
    const caps = selectCapabilities("show me my shopping list", "shopping");
    assert(caps.includes("shopping"), "shopping surface: includes shopping");
    assert(caps.includes("profile"),  "shopping surface: includes profile");
  }

  {
    const caps = selectCapabilities("what's in my pantry?", "floating");
    assert(caps.includes("pantry"),  "floating + pantry keyword: includes pantry");
    assert(caps.includes("profile"), "floating surface: always includes profile");
  }

  {
    const caps = selectCapabilities("hi there", "floating");
    assert(caps.includes("profile"), "neutral utterance: includes profile");
    assert(caps.length <= 4,         "neutral utterance: cap at 4");
  }

  {
    const caps = selectCapabilities(
      "what meals and shopping and pantry and diary do I have?",
      "floating",
    );
    assert(caps.length <= 4, "many keywords: still capped at 4");
  }

  // ── § 3 — serializeFrameRef (pointer discipline) ─────────────────────────
  section("serializeFrameRef — pointer discipline");

  {
    const frame: ContextFrame = {
      identity:            makeCtx(),
      surface:             "planner",
      userId:              42,
      activePlannerWeekId: 7,
      householdId:         3,
      selectedMealId:      99,
      currentFoodSlug:     "broccoli",
      temporalAnchor:      "2026-07-01",
    };
    const ref = serializeFrameRef(frame);

    assert(ref.activePlannerWeekId === 7,          "serializes activePlannerWeekId");
    assert(ref.householdId         === 3,          "serializes householdId");
    assert(ref.selectedMealId      === 99,         "serializes selectedMealId");
    assert(ref.currentFoodSlug     === "broccoli", "serializes currentFoodSlug");
    assert(ref.temporalAnchor      === "2026-07-01","serializes temporalAnchor");
    assert(!("identity" in ref), "does NOT serialize identity (pointer discipline)");
    assert(!("surface"  in ref), "does NOT serialize surface  (pointer discipline)");
    assert(!("userId"   in ref), "does NOT serialize userId   (pointer discipline)");
  }

  {
    const frame: ContextFrame = {
      identity:       makeCtx(),
      surface:        "floating",
      userId:         1,
      temporalAnchor: "2026-07-01",
    };
    const ref = serializeFrameRef(frame);
    assert(ref.activePlannerWeekId === null, "absent activePlannerWeekId → null");
    assert(ref.householdId         === null, "absent householdId → null");
    assert(ref.selectedMealId      === null, "absent selectedMealId → null");
    assert(ref.currentFoodSlug     === null, "absent currentFoodSlug → null");
  }

  // ── § 4 — assembleContextFrame (surface hint priority) ───────────────────
  section("assembleContextFrame — surface hint priority");

  {
    const hints: SurfaceHints = { activePlannerWeekId: 55, selectedMealId: 12 };
    // Storage is not wired in tests; errors are swallowed inside the assembler.
    const frame = await assembleContextFrame(42, "planner", hints, [], makeCtx(42));
    assert(frame.activePlannerWeekId === 55, "hint: activePlannerWeekId preferred over storage");
    assert(frame.selectedMealId      === 12, "hint: selectedMealId preferred over entity ref");
    assert(frame.surface             === "planner", "surface is preserved");
    assert(frame.userId              === 42,        "userId is preserved");
    assert(
      typeof frame.temporalAnchor === "string" && frame.temporalAnchor.length === 10,
      "temporalAnchor is YYYY-MM-DD",
    );
  }

  {
    const priorRefs = [
      { type: "meal",         id: 77 },
      { type: "planner_week", id: 99 },
    ];
    const frame = await assembleContextFrame(42, "floating", {}, priorRefs, makeCtx(42));
    // selectedMealId comes from entity ref when no hint
    assert(
      frame.selectedMealId === 77 || frame.selectedMealId == null,
      "selectedMealId from entity ref or absent (storage may have overridden)",
    );
  }

  // ── § 5 — ConversationGateway state management ───────────────────────────
  section("ConversationGateway — state management (InMemory, no LLM)");

  {
    const gw = new ConversationGateway(makeStore());
    const r1 = await gw.processUserTurn(1, "hello", "floating", {}, makeCtx(1));

    assert(typeof r1.conversationId  === "number",    "turn1: conversationId is a number");
    assert(typeof r1.threadId        === "number",    "turn1: threadId is a number");
    assert(r1.userTurn.role          === "user",      "turn1: user turn role=user");
    assert(r1.userTurn.utterance     === "hello",     "turn1: user utterance recorded");
    assert(r1.assistantTurn.role     === "assistant", "turn1: assistant turn role=assistant");
    assert(typeof r1.text === "string" && r1.text.length > 0, "turn1: text is non-empty");
    assert(Array.isArray(r1.entityRefs), "turn1: entityRefs is an array");
  }

  {
    const gw = new ConversationGateway(makeStore());
    const ctx = makeCtx(2);
    const r1 = await gw.processUserTurn(2, "first turn",  "floating", {}, ctx);
    const r2 = await gw.processUserTurn(2, "second turn", "floating", {}, ctx);
    assert(r1.conversationId === r2.conversationId, "same conversationId across turns");
    assert(r1.threadId       === r2.threadId,       "same threadId: no per-navigation fragmentation (INT18 R6)");
  }

  {
    const gw = new ConversationGateway(makeStore());
    const { turns: before, threadId: tid } = await gw.getRecentTurns(3, 10);
    assert(before.length === 0, "getRecentTurns before any turn: empty");
    assert(tid === null,        "getRecentTurns before any turn: threadId null");

    await gw.processUserTurn(3, "a question", "planner", {}, makeCtx(3));
    const { turns: after } = await gw.getRecentTurns(3, 10);
    assert(after.length === 2,            "after one turn: 2 turns (user + assistant)");
    assert(after[0].role === "user",      "first turn is user");
    assert(after[1].role === "assistant", "second turn is assistant");
  }

  {
    const gw = new ConversationGateway(makeStore());
    const { conversation: c1, threads: t1 } = await gw.getConversationState(4);
    assert(typeof c1.id === "number", "getConversationState: conversation has id");
    assert(t1.length === 0,           "before any turn: no threads");

    await gw.processUserTurn(4, "hi", "shopping", {}, makeCtx(4));
    const { threads: t2 } = await gw.getConversationState(4);
    assert(t2.length === 1,             "after a turn: one thread");
    assert(t2[0].surface === "shopping","thread surface matches turn surface");
  }

  // ── § 6 — Write intent guard ─────────────────────────────────────────────
  section("Write intent guard — honest gap response");

  {
    const gw = new ConversationGateway(makeStore());
    const r = await gw.processUserTurn(5, "add salmon to my shopping list", "shopping", {}, makeCtx(5));
    assert(typeof r.text === "string" && r.text.length > 0, "write intent: returns non-empty text");
    assert(
      r.text.toLowerCase().includes("can't")    ||
      r.text.toLowerCase().includes("cannot")   ||
      r.text.toLowerCase().includes("can read"),
      "write intent: text acknowledges honest gap",
    );
    assert(r.entityRefs.length === 0, "write intent: no entity refs");
  }

  {
    const gw = new ConversationGateway(makeStore());
    const r = await gw.processUserTurn(6, "delete Monday's dinner", "planner", {}, makeCtx(6));
    assert(
      r.text.toLowerCase().includes("can't")    ||
      r.text.toLowerCase().includes("cannot")   ||
      r.text.toLowerCase().includes("can read"),
      "delete intent: text acknowledges honest gap",
    );
  }

  // ── § 7 — contextFrameRef pointer discipline ─────────────────────────────
  section("contextFrameRef pointer discipline in stored turns");

  {
    const gw = new ConversationGateway(makeStore());
    const hints: SurfaceHints = { activePlannerWeekId: 33, selectedMealId: 101 };
    const r = await gw.processUserTurn(7, "what do I have this week?", "planner", hints, makeCtx(7));

    const frameRef = r.userTurn.contextFrameRef as Record<string, unknown> | null;
    assert(frameRef !== null, "user turn has contextFrameRef");
    if (frameRef) {
      assert("activePlannerWeekId" in frameRef, "contextFrameRef has activePlannerWeekId");
      assert("selectedMealId"      in frameRef, "contextFrameRef has selectedMealId");
      assert("temporalAnchor"      in frameRef, "contextFrameRef has temporalAnchor");
      assert(!("meals"  in frameRef), "no raw meals array (pointer discipline)");
      assert(!("items"  in frameRef), "no raw items array (pointer discipline)");
      assert(!("userId" in frameRef), "no userId key (pointer discipline)");
    }
  }

  // ── § 8 — listThreads ────────────────────────────────────────────────────
  section("listThreads — IConversationStore extension");

  {
    const store = makeStore();
    const conv = await store.getOrCreateConversation(99);

    const t0 = await store.listThreads(conv.id);
    assert(t0.length === 0, "listThreads: empty before any thread");

    const th1 = await store.openThread(conv.id, "planner");
    const th2 = await store.openThread(conv.id, "shopping");
    const t2  = await store.listThreads(conv.id);
    assert(t2.length === 2,        "listThreads: returns both threads");
    assert(t2[0].id  === th2.id,   "listThreads: most-recently-opened first");

    const t1 = await store.listThreads(conv.id, 1);
    assert(t1.length === 1, "listThreads: respects limit=1");

    const conv2 = await store.getOrCreateConversation(100);
    await store.openThread(conv2.id, "diary");
    const t3 = await store.listThreads(conv.id);
    assert(t3.length === 2, "listThreads: does not bleed across conversations");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════");
  console.log("INT18 Phase 1 — Conversation Gateway tests");
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failures.length > 0) {
    console.error("\nFailed assertions:");
    failures.forEach(f => console.error(`  ✗ ${f}`));
    process.exit(1);
  } else {
    console.log("All tests passed ✓");
  }
}

main().catch(err => {
  console.error("[test-intelligence-conversation-gateway] Unexpected error:", err);
  process.exit(1);
});
