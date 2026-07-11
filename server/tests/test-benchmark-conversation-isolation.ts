/**
 * test-benchmark-conversation-isolation.ts — BENCHINT2
 * =====================================================
 * Proves the fix for BENCHINT1 D1 — *the* finding that invalidated every historical benchmark
 * artefact — and proves it by first reproducing the defect it closes.
 *
 * ── THE DEFECT ──────────────────────────────────────────────────────────────────────────────
 * `processUserTurn` reuses the active conversation thread and opens a new one only when none
 * exists. Nothing in the benchmark closed the thread between questions, so a 100-question run was
 * a single 200-turn conversation. Question N was answered with questions N−5…N−1 sitting in its
 * system prompt as CONVERSATION HISTORY, and with question N−1's `entityRefs` available for
 * pronoun resolution. Scores were order-dependent and mutually contaminating; quick runs (one
 * question per category) and full runs contaminated *differently*, so the two modes were never
 * comparable to each other.
 *
 * ── THE FIX, AND WHY IT IS NOT A NEW PATHWAY ────────────────────────────────────────────────
 * `IConversationStore.openThread` has always documented: "Does NOT auto-close the previous thread
 * — call closeThread() explicitly." The benchmark now does exactly that around every question. The
 * gateway is untouched. No flag, no benchmark branch, no second execution path: closing a thread is
 * the ordinary production lifecycle, and `processUserTurn` responds to it the ordinary way, by
 * opening a fresh thread on the next turn.
 *
 * ── WHAT IS ASSERTED ────────────────────────────────────────────────────────────────────────
 * Sections 1 and 2 are behavioural, against the real `ConversationGateway` over an
 * `InMemoryConversationStore` (the same harness `test-intelligence-fallback.ts` uses). They assert
 * the LIFECYCLE CONTRACT the benchmark depends on — contaminating without the close, isolated with
 * it — so that a future change to the gateway's thread policy fails here rather than silently
 * restoring the defect.
 *
 * Section 3 asserts the benchmark's ONE-seam adapter still performs the close, and performs it in a
 * `finally`. A behavioural test of `makeCompanionTurnRunner` itself would need a live database and
 * a seeded user; reading its source is what makes "somebody deleted the isolation" a test failure
 * rather than a silently wrong score six months from now.
 *
 *   npm run test:benchmark-conversation-isolation
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ConversationGateway,
  type HandleIntentFn,
} from "../intelligence/conversation/conversation-gateway.js";
import {
  InMemoryConversationStore,
  resetInMemoryIds,
} from "../intelligence/conversation/conversation-store.js";
import type {
  IIntentResolver,
  ResolvedIntent,
} from "../intelligence/intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import type { IntelligenceContext } from "../intelligence/types.js";

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

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
function eq(name: string, actual: unknown, expected: unknown): void {
  check(name, Object.is(actual, expected), `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function section(title: string): void {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 74 - title.length))}`);
}

// ---------------------------------------------------------------------------
// Stubs — a recording LLM is the whole instrument: it sees exactly what the
// Companion was told about the conversation so far.
// ---------------------------------------------------------------------------

class RecordingLlm implements ILlmProvider {
  readonly modelName = "stub";
  readonly isAvailable = true;
  /** Every request, in order. `messages` is the literal prompt the gateway assembled. */
  readonly requests: LlmRequest[] = [];

  constructor(private readonly reply: string) {}

  async complete(request: LlmRequest): Promise<LlmResponse> {
    this.requests.push(request);
    return { content: this.reply, model: this.modelName };
  }
}

/** The gateway injects prior turns as a system message with this exact prefix. */
const HISTORY_PREFIX = "CONVERSATION HISTORY";

function historyOf(request: LlmRequest | undefined): string | null {
  const msg = request?.messages.find((m) => m.role === "system" && m.content.startsWith(HISTORY_PREFIX));
  return msg?.content ?? null;
}

const ROUTED_SEARCH: ResolvedIntent = {
  capability: "meals",
  verb: "search",
  parameters: { query: "pasta" },
  confidence: 0.9,
};

class StubResolver implements IIntentResolver {
  async resolve(): Promise<ResolvedIntent[]> {
    return [ROUTED_SEARCH];
  }
}

const stubHandle: HandleIntentFn = async (intent) => ({
  status: "ok",
  capabilityId: intent.capabilityId,
  verb: intent.verb,
  message: "ok",
  result: { meals: [{ id: 77, name: "Spaghetti Bolognese" }] },
});

/** The assistant reply carries an entityRef, so entityRef leakage is observable. */
const REPLY = JSON.stringify({ text: "You have Spaghetti Bolognese.", entityRefs: [{ type: "meal", id: 77 }] });

const CTX: IntelligenceContext = { role: "user", userId: "1", premium: false };
const USER_ID = 1;

function makeHarness() {
  resetInMemoryIds();
  const store = new InMemoryConversationStore();
  const llm = new RecordingLlm(REPLY);
  const gateway = new ConversationGateway(store, llm, new StubResolver(), stubHandle);
  return { store, llm, gateway };
}

// ---------------------------------------------------------------------------
// 1. The defect, reproduced. Without the close, question 2 sees question 1.
// ---------------------------------------------------------------------------

async function contaminationWithoutClose(): Promise<void> {
  section("1. WITHOUT closing the thread — the D1 contamination, reproduced");
  const { llm, gateway } = makeHarness();

  const q1 = await gateway.processUserTurn(USER_ID, "what pasta meals have I got", "floating", {}, CTX);
  const q2 = await gateway.processUserTurn(USER_ID, "how many calories is it", "floating", {}, CTX);

  eq("both questions share one conversation thread", q2.threadId, q1.threadId);
  check("question 1 was answered with no history (nothing preceded it)", historyOf(llm.requests[0]) === null);
  check(
    "question 2 was answered WITH question 1 in its prompt",
    (historyOf(llm.requests[1]) ?? "").includes("what pasta meals have I got"),
    "the contamination this test exists to prevent did not occur — has the gateway's thread policy changed?",
  );

  const inherited = await gateway["store"].getLastEntityRefs(q2.threadId);
  check("question 2 could resolve pronouns against question 1's entityRefs", inherited.length > 0);
}

// ---------------------------------------------------------------------------
// 2. The fix. Closing the active thread isolates the next question completely.
// ---------------------------------------------------------------------------

async function isolationWithClose(): Promise<void> {
  section("2. WITH the production close between questions — full isolation");
  const { store, llm, gateway } = makeHarness();

  const q1 = await gateway.processUserTurn(USER_ID, "what pasta meals have I got", "floating", {}, CTX);

  // The one line the benchmark adds. Nothing else changes.
  await store.closeThread(q1.threadId);

  const q2 = await gateway.processUserTurn(USER_ID, "how many calories is it", "floating", {}, CTX);

  check("question 2 opened a NEW thread", q2.threadId !== q1.threadId, `both were ${q2.threadId}`);
  eq("both threads belong to the same conversation (one user, one conversation)", q2.conversationId, q1.conversationId);
  check(
    "question 2 was answered with NO conversation history",
    historyOf(llm.requests[1]) === null,
    `history injected: ${JSON.stringify(historyOf(llm.requests[1]))}`,
  );

  const q1Turns = await store.getRecentTurns(q1.threadId, 20);
  const q2Turns = await store.getRecentTurns(q2.threadId, 20);
  eq("question 1's thread holds exactly its own user + assistant turn", q1Turns.length, 2);
  eq("question 2's thread holds exactly its own user + assistant turn", q2Turns.length, 2);

  // The entityRef guarantee, stated where it is actually observable.
  //
  // `getLastEntityRefs` returns the most recent NON-EMPTY refs in a thread, so reading it after a
  // turn always returns that turn's own refs — it can never show what the turn inherited. What the
  // turn inherited is fixed by the thread it opened in: the gateway reads `getLastEntityRefs` on
  // the thread BEFORE appending, so a thread whose first turn is question 2's own user turn had
  // nothing to inherit. That is the property asserted here, and it is exact.
  eq("question 2's thread begins with question 2's own turn — nothing preceded it", q2Turns[0].role, "user");
  eq("…and that turn is question 2 itself", q2Turns[0].utterance, "how many calories is it");
  check(
    "question 1's entityRefs still exist, but only inside question 1's now-closed thread",
    (await store.getLastEntityRefs(q1.threadId)).length > 0,
  );

  // The mechanism itself: a freshly opened thread has no entityRefs to inherit, full stop.
  const conversation = await store.getOrCreateConversation(USER_ID);
  const virginThread = await store.openThread(conversation.id, "floating");
  eq("a freshly opened thread inherits no entityRefs", (await store.getLastEntityRefs(virginThread.id)).length, 0);
  await store.closeThread(virginThread.id);

  // Closing is idempotent, and a closed thread is never revived.
  await store.closeThread(q1.threadId);
  await store.closeThread(q1.threadId);
  const q3 = await gateway.processUserTurn(USER_ID, "and the protein", "floating", {}, CTX);
  check("a third question reuses the still-open thread 2 when it was not closed", q3.threadId === q2.threadId);
}

// ---------------------------------------------------------------------------
// 3. The benchmark adapter still performs the close, in a `finally`.
// ---------------------------------------------------------------------------

function adapterStillIsolates(): void {
  section("3. The ONE-seam adapter (companion-turn.ts) still isolates every question");
  const src = readFileSync(fileURLToPath(new URL("./benchmark/companion-turn.ts", import.meta.url)), "utf-8");

  check("it reaches the production conversation lifecycle", src.includes("closeThread"));
  check("it closes the acting user's active thread", src.includes("closeActiveThread"));
  check(
    "the close runs in a `finally`, so a thrown question cannot contaminate the next one",
    /\}\s*finally\s*\{[\s\S]*closeActiveThread/.test(src),
  );
  check(
    "the pre-run close exists, so question 1 cannot inherit an operator's live conversation (D8)",
    /openingThreadClosed/.test(src),
  );
  check(
    "an isolation failure aborts rather than silently scoring contaminated turns",
    /conversation isolation failed/.test(src),
  );

  // BENCHINT4 (SH-042-A). The checks above prove the adapter CONTAINS the close. They cannot
  // prove it RAN: the artefact `2026-07-10T10-48-57Z__8e10ea3` was produced by a process where
  // it did not, and all 100 questions were answered in one 13,044-turn thread. Nothing noticed,
  // because nothing ever compared one question's thread id with the next. Now something does.
  check(
    "a reused conversation thread is detected, not assumed away",
    /threadsSeen/.test(src),
  );
  check(
    "…and it is raised as an isolation failure, not a question-level outcome",
    /throw new BenchmarkIsolationError/.test(src),
  );
  check(
    "…which escapes the per-question catch, so the run aborts instead of scoring the rest",
    /if \(err instanceof BenchmarkIsolationError\) throw err;/.test(src),
  );
  // The adapter's prose necessarily NAMES the flags it promises not to introduce, so scan the call
  // site rather than the file: `processUserTurn` must still receive exactly the five production
  // arguments — user id, utterance, a real surface, empty surface hints, and the platform context.
  const call = src.match(/processUserTurn\(([\s\S]*?)\);/)?.[1] ?? "";
  const args = call.split(",").map((a) => a.replace(/\/\/.*$/gm, "").trim()).filter(Boolean);
  eq("processUserTurn is still called with exactly five arguments", args.length, 5);
  eq("…on a real production surface", args[2], '"floating"');
  eq("…with empty surface hints, exactly as the production route sends", args[3], "{}");
  check("…and no benchmark flag among them", !args.some((a) => /benchmark/i.test(a)));
}

// ---------------------------------------------------------------------------

console.log("\nBENCHINT2 — benchmark conversation isolation (BENCHINT1 D1 + D8)");

(async () => {
  await contaminationWithoutClose();
  await isolationWithClose();
  adapterStillIsolates();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error("conversation-isolation test crashed:", err);
  process.exit(1);
});
