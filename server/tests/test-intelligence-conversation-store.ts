/**
 * test-intelligence-conversation-store.ts — INT18 Phase 0
 * =========================================================
 * Unit tests for ConversationStore using InMemoryConversationStore.
 * No database, no network, no migrations required.
 *
 * Covered:
 *   1. getOrCreateConversation — lazy create, idempotent, one-per-user
 *   2. openThread — creates active thread under a conversation
 *   3. getActiveThread — returns most-recent open thread; null when none
 *   4. closeThread — sets closedAt; idempotent
 *   5. appendTurn — persists turn with correct fields; pointer discipline
 *   6. getRecentTurns — bounded, oldest-first, respects limit
 *   7. getLastEntityRefs — returns most-recent non-empty refs; [] when none
 *   8. Pointer discipline — no business data in any turn JSONB column
 *
 * Run with: npx tsx server/tests/test-intelligence-conversation-store.ts
 */

import {
  InMemoryConversationStore,
  resetInMemoryIds,
  type EntityRef,
  type NewConversationTurn,
} from "../intelligence/conversation/conversation-store.js";

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTurn(
  overrides: Partial<NewConversationTurn> = {},
): NewConversationTurn {
  return {
    role: "user",
    surface: "floating",
    utterance: "What is in my planner this week?",
    ...overrides,
  };
}

/** Asserts that a JSONB-holding object contains no keys that look like
 *  business data rows — only IDs, slugs, status strings, and messages. */
function assertPointerDiscipline(
  obj: Record<string, unknown> | null | unknown,
  label: string,
): void {
  if (obj === null || obj === undefined) {
    assert(true, `${label} — null (no data stored)`);
    return;
  }
  // Reject any key whose value is itself an object with a 'name' and some
  // domain key — those look like inlined entity rows, not pointers.
  const suspicious = (o: unknown): boolean => {
    if (typeof o !== "object" || o === null) return false;
    const keys = Object.keys(o as object);
    return keys.includes("name") && keys.some(k => ["ingredients", "calories", "price"].includes(k));
  };
  assert(!suspicious(obj), `${label} — contains no inlined business entity rows`);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  resetInMemoryIds();
  const store = new InMemoryConversationStore();

  // ── 1. getOrCreateConversation ──────────────────────────────────────────
  section("getOrCreateConversation");

  const conv1 = await store.getOrCreateConversation(42);
  assert(typeof conv1.id === "number", "returns a conversation with numeric id");
  assert(conv1.userId === 42, "userId matches");
  assert(conv1.createdAt instanceof Date, "createdAt is a Date");
  assert(conv1.updatedAt instanceof Date, "updatedAt is a Date");

  const conv1Again = await store.getOrCreateConversation(42);
  assert(
    conv1Again.id === conv1.id,
    "second call for same user returns the same conversation (idempotent)",
    `got ids ${conv1Again.id} vs ${conv1.id}`,
  );

  const conv2 = await store.getOrCreateConversation(99);
  assert(conv2.id !== conv1.id, "different userId → different conversation");
  assert(conv2.userId === 99, "second conversation has correct userId");

  // ── 2. openThread ──────────────────────────────────────────────────────
  section("openThread");

  const thread1 = await store.openThread(conv1.id, "planner");
  assert(typeof thread1.id === "number", "openThread returns a thread with numeric id");
  assert(thread1.conversationId === conv1.id, "thread belongs to the correct conversation");
  assert(thread1.surface === "planner", "thread has correct surface");
  assert(thread1.closedAt === null, "new thread is open (closedAt = null)");
  assert(thread1.openedAt instanceof Date, "openedAt is a Date");

  const thread2 = await store.openThread(conv1.id, "shopping");
  assert(thread2.id !== thread1.id, "second openThread produces a distinct thread");
  assert(thread2.surface === "shopping", "second thread has its own surface");

  // ── 3. getActiveThread ─────────────────────────────────────────────────
  section("getActiveThread");

  const active = await store.getActiveThread(conv1.id);
  assert(active !== null, "getActiveThread returns a thread when one is open");
  assert(active!.closedAt === null, "active thread has closedAt = null");

  const conv3 = await store.getOrCreateConversation(77);
  const noActive = await store.getActiveThread(conv3.id);
  assert(noActive === null, "getActiveThread returns null when no thread exists for conversation");

  // ── 4. closeThread ─────────────────────────────────────────────────────
  section("closeThread");

  await store.closeThread(thread1.id);
  const afterClose = await store.getActiveThread(conv1.id);
  // thread2 is still open, so we expect it (not thread1)
  assert(
    afterClose !== null && afterClose.id === thread2.id,
    "after closing thread1, getActiveThread returns the other still-open thread",
    `got threadId ${afterClose?.id}, expected ${thread2.id}`,
  );

  // Idempotency: closing again must not throw or corrupt state
  await store.closeThread(thread1.id);
  const stillClosed = await store.getActiveThread(conv1.id);
  assert(
    stillClosed?.id === thread2.id,
    "closing an already-closed thread is idempotent",
  );

  // Close thread2 to test null case
  await store.closeThread(thread2.id);
  const nowNull = await store.getActiveThread(conv1.id);
  assert(nowNull === null, "getActiveThread returns null after all threads closed");

  // ── 5. appendTurn ──────────────────────────────────────────────────────
  section("appendTurn — persists turn fields correctly");

  // Open a fresh thread for turn tests
  const thread3 = await store.openThread(conv1.id, "floating");

  const userTurn = await store.appendTurn(
    thread3.id,
    makeTurn({
      role: "user",
      surface: "floating",
      utterance: "What is in my pantry?",
      entityRefs: [],
    }),
  );
  assert(typeof userTurn.id === "number", "appended turn has numeric id");
  assert(userTurn.threadId === thread3.id, "turn belongs to the correct thread");
  assert(userTurn.role === "user", "role is preserved");
  assert(userTurn.surface === "floating", "surface is preserved");
  assert(userTurn.utterance === "What is in my pantry?", "utterance is preserved");
  assert(userTurn.createdAt instanceof Date, "createdAt is a Date");
  assert(Array.isArray(userTurn.entityRefs), "entityRefs is an array");

  // Assistant turn with intent, context frame ref, entity refs, outcome ref
  const entityRefs: EntityRef[] = [
    { type: "meal", id: 42 },
    { type: "planner_week", id: 7 },
  ];
  const contextFrameRef = {
    activePlannerWeekId: 7,
    householdId: 3,
    selectedMealId: 42,
  };
  const resolvedIntent = { verb: "read", capabilityId: "planner" };
  const outcomeRef = {
    status: "ok",
    capabilityId: "planner",
    verb: "read",
    message: "Your planner for week 7 has 4 meals.",
  };

  const assistantTurn = await store.appendTurn(thread3.id, {
    role: "assistant",
    surface: "floating",
    utterance: "Your planner for week 7 has 4 meals.",
    resolvedIntent,
    contextFrameRef,
    entityRefs,
    outcomeRef,
  });
  assert(assistantTurn.role === "assistant", "assistant role preserved");
  assert(
    Array.isArray(assistantTurn.entityRefs) && (assistantTurn.entityRefs as EntityRef[]).length === 2,
    "entityRefs length matches",
  );
  const refs = assistantTurn.entityRefs as EntityRef[];
  assert(refs[0].type === "meal" && refs[0].id === 42, "first entityRef is {type:meal, id:42}");
  assert(refs[1].type === "planner_week" && refs[1].id === 7, "second entityRef is {type:planner_week, id:7}");

  // ── 6. Pointer discipline ───────────────────────────────────────────────
  section("Pointer discipline — JSONB columns hold IDs/pointers only");

  assertPointerDiscipline(assistantTurn.contextFrameRef, "contextFrameRef");
  assertPointerDiscipline(assistantTurn.resolvedIntent, "resolvedIntent");
  assertPointerDiscipline(assistantTurn.outcomeRef, "outcomeRef");

  // contextFrameRef must contain only IDs, not entity rows
  const cfr = assistantTurn.contextFrameRef as Record<string, unknown>;
  assert(
    typeof cfr.activePlannerWeekId === "number" && typeof cfr.householdId === "number",
    "contextFrameRef contains numeric IDs (pointers), not entity rows",
  );
  assert(
    !("meals" in cfr) && !("name" in cfr),
    "contextFrameRef contains no inlined business entity data",
  );

  // outcomeRef contains status + message only — no business rows
  const ocf = assistantTurn.outcomeRef as Record<string, unknown>;
  assert(typeof ocf.status === "string", "outcomeRef.status is a string");
  assert(typeof ocf.message === "string", "outcomeRef.message is a string");

  // System turn with null JSONB fields
  const systemTurn = await store.appendTurn(thread3.id, {
    role: "system",
    surface: "floating",
    utterance: "Conversation started.",
  });
  assert(systemTurn.resolvedIntent === null, "resolvedIntent defaults to null for system turns");
  assert(systemTurn.contextFrameRef === null, "contextFrameRef defaults to null for system turns");
  assert(systemTurn.outcomeRef === null, "outcomeRef defaults to null for system turns");
  assert(
    Array.isArray(systemTurn.entityRefs) && systemTurn.entityRefs.length === 0,
    "entityRefs defaults to [] for system turns",
  );

  // ── 7. getRecentTurns ──────────────────────────────────────────────────
  section("getRecentTurns — bounded, oldest-first");

  // At this point thread3 has: userTurn, assistantTurn, systemTurn (3 turns)
  const recent = await store.getRecentTurns(thread3.id);
  assert(recent.length === 3, "getRecentTurns returns all 3 turns", `got ${recent.length}`);
  assert(
    recent[0].id === userTurn.id,
    "turns are returned oldest-first",
    `first id: ${recent[0].id}, expected ${userTurn.id}`,
  );
  assert(
    recent[recent.length - 1].id === systemTurn.id,
    "last turn is the most-recently appended",
  );

  // Limit = 2 — should return only the two most recent, oldest-first
  const limited = await store.getRecentTurns(thread3.id, 2);
  assert(limited.length === 2, "limit=2 returns exactly 2 turns", `got ${limited.length}`);
  assert(
    limited[0].id === assistantTurn.id,
    "limited result starts with 2nd oldest (assistantTurn)",
    `got id ${limited[0].id}, expected ${assistantTurn.id}`,
  );
  assert(
    limited[1].id === systemTurn.id,
    "limited result ends with most-recent (systemTurn)",
    `got id ${limited[1].id}, expected ${systemTurn.id}`,
  );

  // Empty thread
  const thread4 = await store.openThread(conv1.id, "diary");
  const empty = await store.getRecentTurns(thread4.id);
  assert(empty.length === 0, "getRecentTurns returns [] for a thread with no turns");

  // ── 8. getLastEntityRefs ───────────────────────────────────────────────
  section("getLastEntityRefs — most-recent non-empty refs");

  // thread3: userTurn (refs=[]), assistantTurn (refs=[meal:42, week:7]), systemTurn (refs=[])
  const lastRefs = await store.getLastEntityRefs(thread3.id);
  assert(lastRefs.length === 2, "getLastEntityRefs returns the non-empty refs from the last turn that had them");
  assert(
    lastRefs[0].type === "meal" && lastRefs[0].id === 42,
    "first ref is {type:meal, id:42}",
  );
  assert(
    lastRefs[1].type === "planner_week" && lastRefs[1].id === 7,
    "second ref is {type:planner_week, id:7}",
  );

  // Append a turn with entity refs — getLastEntityRefs should now return those
  const newerRefs: EntityRef[] = [{ type: "shopping_list", id: 15 }];
  await store.appendTurn(thread3.id, {
    role: "assistant",
    surface: "shopping",
    utterance: "Your shopping list has 5 items.",
    entityRefs: newerRefs,
  });
  const updatedRefs = await store.getLastEntityRefs(thread3.id);
  assert(
    updatedRefs.length === 1 && updatedRefs[0].type === "shopping_list",
    "after appending a turn with newer refs, getLastEntityRefs returns those",
  );

  // Empty thread returns []
  const noRefs = await store.getLastEntityRefs(thread4.id);
  assert(noRefs.length === 0, "getLastEntityRefs returns [] for a thread with no entity refs");

  // Thread with only empty-refs turns also returns []
  const thread5 = await store.openThread(conv1.id, "nutrition");
  await store.appendTurn(thread5.id, makeTurn({ entityRefs: [] }));
  await store.appendTurn(thread5.id, makeTurn({ entityRefs: [] }));
  const emptyRefs = await store.getLastEntityRefs(thread5.id);
  assert(
    emptyRefs.length === 0,
    "getLastEntityRefs returns [] when all turns have empty entityRefs",
  );

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`INT18 Phase 0 — Conversation Store`);
  console.log(`Passed: ${passed}   Failed: ${failed}`);
  if (failed > 0) {
    console.error(`\n${failed} test(s) failed.`);
    process.exit(1);
  } else {
    console.log("\nAll tests passed ✓");
  }
}

main().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});
