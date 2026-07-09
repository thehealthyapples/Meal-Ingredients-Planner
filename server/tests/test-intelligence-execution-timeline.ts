/**
 * test-intelligence-execution-timeline.ts — OBS2
 * =================================================================
 * Tests for the Execution Timeline: the turnId correlation seam on
 * recordObservation, exact and reconstructed turn grouping, every
 * per-turn projection the Behaviour Admin Workbench displays, the
 * session listing with its filters, and the CSV export.
 * DB-free by construction — pure functions over synthetic rows plus
 * the injected InMemoryObservationStore; server/db.ts is never loaded.
 *
 * Coverage:
 *   §1 recordObservation — turnId rides in the metadata bag
 *   §2 buildExecutionTimeline — exact grouping by metadata.turnId
 *   §3 buildExecutionTimeline — reconstructed grouping for legacy rows
 *   §4 turn projection — intent, capabilities, views, sources, behaviour,
 *      response, clarifications, recoveries, escalations, feedback, attention
 *   §5 timings — sincePreviousMs, wallClockMs, stageDurationTotalMs
 *   §6 session scoping — cross-session isolation, benchmark exclusion, privacy note
 *   §7 summarizeTimelineSessions — summaries, filters, ordering
 *   §8 timelineToCsv — shape, correlation column, escaping
 *
 * Run: npx tsx server/tests/test-intelligence-execution-timeline.ts
 */

import {
  recordObservation,
  setObservationStore,
  type ObservationKind,
} from "../intelligence/observation/observation-engine.js";
import { InMemoryObservationStore } from "../intelligence/observation/observation-contract.js";
import {
  buildExecutionTimeline,
  summarizeTimelineSessions,
  timelineToCsv,
  TIMELINE_PRIVACY_NOTE,
} from "../intelligence/observation/execution-timeline.js";
import type { PlatformObservation } from "../../shared/schema.js";

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
    console.log(`  ✗ ${label}`);
  }
}

/** Wait for the record seam's fire-and-forget promise chain to settle. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const T0 = new Date("2026-07-08T12:00:00.000Z").getTime();

let rowId = 1;
/** A full PlatformObservation row at T0 + atMs, for the pure projections. */
function row(
  partial: Partial<PlatformObservation> & { kind: ObservationKind; atMs?: number },
): PlatformObservation {
  const { atMs, ...rest } = partial;
  return {
    id: rowId++,
    observedAt: new Date(T0 + (atMs ?? 0)),
    severity: "info",
    outcome: null,
    userId: null,
    sessionId: null,
    surface: null,
    capability: null,
    verb: null,
    intent: null,
    contextView: null,
    confidence: null,
    durationMs: null,
    recoveryPath: null,
    metadata: {},
    ...rest,
  } as PlatformObservation;
}

/** One fully-instrumented successful turn in session `s`, correlated by turnId. */
function successfulTurn(sessionId: string, turnId: string, startMs: number, userId = 7): PlatformObservation[] {
  const m = { turnId };
  return [
    row({ kind: "intent-resolution", atMs: startMs, sessionId, userId, capability: "planner", verb: "read",
          intent: "planner:read", confidence: 0.92, durationMs: 12, outcome: "resolved", surface: "planner",
          metadata: { ...m, intentCount: 2, routedCount: 1 } }),
    row({ kind: "capability-invocation", atMs: startMs + 40, sessionId, userId, capability: "planner",
          verb: "read", intent: "planner:read", outcome: "ok", durationMs: 35, metadata: m }),
    row({ kind: "knowledge-retrieval", atMs: startMs + 90, sessionId, userId, outcome: "ok", durationMs: 48,
          metadata: { ...m, sources: ["planner", "profile"], queriedCount: 2 } }),
    row({ kind: "context-composition", atMs: startMs + 130, sessionId, userId, outcome: "ok", durationMs: 9,
          metadata: { ...m, views: ["planner:read", "profile:read"], budgetExceeded: false } }),
    row({ kind: "response-generation", atMs: startMs + 900, sessionId, userId, outcome: "ok", durationMs: 760,
          metadata: { ...m, model: "gpt-test", personalityId: "companion" } }),
  ];
}

async function main(): Promise<void> {
  // ── §1 recordObservation — turnId rides in the metadata bag ───────────────
  console.log("\n§1 recordObservation — turnId correlation");
  {
    const store = new InMemoryObservationStore();
    setObservationStore(store);

    recordObservation({ kind: "intent-resolution", turnId: "42", metadata: { intentCount: 1 } });
    recordObservation({ kind: "recovery", turnId: "43" });
    recordObservation({ kind: "clarification", metadata: { hasClarificationPrompt: true } });
    await settle();

    const rows = store.all();
    assert(rows.length === 3, "three observations recorded");
    assert(rows[0].metadata.turnId === "42", "turnId merged into metadata");
    assert(rows[0].metadata.intentCount === 1, "existing metadata preserved alongside turnId");
    assert(rows[1].metadata.turnId === "43", "turnId recorded when no other metadata given");
    assert(!("turnId" in rows[2].metadata), "no turnId key when none supplied");
    assert(!("turnId" in rows[0]), "turnId is not a column — metadata bag only");

    setObservationStore(null);
  }

  // ── §2 exact grouping by metadata.turnId ──────────────────────────────────
  console.log("\n§2 buildExecutionTimeline — exact grouping");
  {
    const rows = [
      ...successfulTurn("s1", "101", 0),
      ...successfulTurn("s1", "102", 5_000),
      // Later feedback on turn 101 — correlated exactly despite arriving last.
      row({ kind: "user-feedback", atMs: 60_000, sessionId: "s1", userId: 7, outcome: "down",
            metadata: { turnId: "101", reasonCode: "wrong-data", hasNote: true, conversationTurnId: 201 } }),
    ];
    const t = buildExecutionTimeline(rows, "s1");

    assert(t.turnCount === 2, "two turns reconstructed");
    assert(t.turns[0].turnId === "101" && t.turns[1].turnId === "102", "turns ordered chronologically");
    assert(t.turns.every((x) => x.correlation === "exact"), "turnId grouping is exact correlation");
    assert(t.turns[0].events.length === 6, "feedback event joins its own turn");
    assert(t.turns[0].feedback.length === 1 && t.turns[0].feedback[0].rating === "down",
      "feedback rating attached to the rated turn");
    assert(t.turns[0].feedback[0].reasonCode === "wrong-data", "feedback reason surfaced");
    assert(t.turns[1].feedback.length === 0, "feedback does not leak into other turns");
    assert(t.unassigned.length === 0, "nothing unassigned when correlation is complete");
  }

  // ── §3 reconstructed grouping for legacy (pre-OBS2) rows ──────────────────
  console.log("\n§3 buildExecutionTimeline — reconstructed grouping");
  {
    const rows = [
      // A write-intent escalation turn: no resolution ever ran.
      row({ kind: "escalation", atMs: 0, sessionId: "s2", outcome: "not_executable",
            recoveryPath: "manual-action-redirect" }),
      // Two legacy turns, boundary = intent-resolution.
      row({ kind: "intent-resolution", atMs: 1_000, sessionId: "s2", intent: "meals:read", outcome: "resolved" }),
      row({ kind: "response-generation", atMs: 1_800, sessionId: "s2", outcome: "ok" }),
      row({ kind: "intent-resolution", atMs: 9_000, sessionId: "s2", intent: "pantry:read", outcome: "resolved" }),
      row({ kind: "recovery", atMs: 9_500, sessionId: "s2", severity: "warning", outcome: "no-results",
            recoveryPath: "recovery-suggestions" }),
      // Legacy feedback without turnId: honestly unassignable.
      row({ kind: "user-feedback", atMs: 50_000, sessionId: "s2", outcome: "up",
            metadata: { conversationTurnId: 300 } }),
    ];
    const t = buildExecutionTimeline(rows, "s2");

    assert(t.turnCount === 3, "escalation cluster + two resolution-bounded turns");
    assert(t.turns.every((x) => x.correlation === "reconstructed"), "legacy turns marked reconstructed");
    assert(t.turns.every((x) => x.turnId === null), "reconstructed turns carry no turnId");
    assert(t.turns[0].escalations.length === 1, "leading escalation forms its own turn");
    assert(t.turns[1].intent === "meals:read" && t.turns[2].intent === "pantry:read",
      "each resolution starts a new turn");
    assert(t.unassigned.length === 1 && t.unassigned[0].kind === "user-feedback",
      "legacy feedback stays unassigned, never guessed into a turn");
  }

  // ── §4 turn projection fields ─────────────────────────────────────────────
  console.log("\n§4 turn projection — the Workbench display fields");
  {
    const clean = buildExecutionTimeline(successfulTurn("s3", "7", 0), "s3").turns[0];
    assert(clean.intent === "planner:read", "intent identified");
    assert(clean.intentConfidence === 0.92, "intent confidence");
    assert(clean.intentOutcome === "resolved", "intent outcome");
    assert(clean.capabilities.length === 1 && clean.capabilities[0].capability === "planner"
      && clean.capabilities[0].outcome === "ok", "capability selected with outcome");
    assert(clean.contextViews.join(",") === "planner:read,profile:read", "context views composed");
    assert(clean.knowledgeSources.join(",") === "planner,profile", "knowledge sources consulted");
    assert(clean.behaviour === "companion", "behaviour (personality) selected");
    assert(clean.responseGeneration?.outcome === "ok" && clean.responseGeneration?.model === "gpt-test",
      "companion response generated");
    assert(clean.userRequestRecorded === false, "user request honestly marked as not recorded");
    assert(clean.clarifications.length === 0 && clean.recoveries.length === 0 && clean.escalations.length === 0,
      "clean turn has no failure entries");
    assert(clean.attention === false, "clean turn does not demand attention");

    const fallbackRows = [
      row({ kind: "intent-resolution", atMs: 0, sessionId: "s4", intent: "meals:search", confidence: 0.4,
            outcome: "needs-clarification", metadata: { turnId: "9" } }),
      row({ kind: "clarification", atMs: 20, sessionId: "s4", severity: "warning", outcome: "needs-clarification",
            metadata: { turnId: "9", hasClarificationPrompt: true } }),
      row({ kind: "recovery", atMs: 60, sessionId: "s4", severity: "warning", outcome: "no-results",
            recoveryPath: "recovery-suggestions", metadata: { turnId: "9", personalityId: "coach" } }),
    ];
    const fallback = buildExecutionTimeline(fallbackRows, "s4").turns[0];
    assert(fallback.clarifications.length === 1 && fallback.clarifications[0].hasPrompt === true,
      "clarification recorded with prompt flag");
    assert(fallback.recoveries.length === 1 && fallback.recoveries[0].recoveryPath === "recovery-suggestions",
      "recovery action with its path");
    assert(fallback.behaviour === "coach", "behaviour read from the recovery voice on fallback turns");
    assert(fallback.responseGeneration === null, "no generation stage is an honest null");
    assert(fallback.attention === true, "clarification/recovery turn demands attention");
  }

  // ── §5 timings ────────────────────────────────────────────────────────────
  console.log("\n§5 timings — stage gaps and totals");
  {
    const t = buildExecutionTimeline([
      ...successfulTurn("s5", "11", 0),
      row({ kind: "user-feedback", atMs: 90_000, sessionId: "s5", outcome: "up", metadata: { turnId: "11" } }),
    ], "s5").turns[0];

    assert(t.events[0].sincePreviousMs === null, "first event has no predecessor gap");
    assert(t.events[1].sincePreviousMs === 40, "gap between stages measured");
    assert(t.events[4].sincePreviousMs === 770, "generation gap measured");
    assert(t.wallClockMs === 900 + 12, "wall clock spans the pipeline plus the first stage's own duration");
    assert(t.stageDurationTotalMs === 12 + 35 + 48 + 9 + 760, "stage durations summed");
    assert(new Date(t.endedAt).getTime() - new Date(t.startedAt).getTime() === 90_000,
      "turn start/end include the late feedback event");
  }

  // ── §6 session scoping ────────────────────────────────────────────────────
  console.log("\n§6 session scoping and privacy");
  {
    const rows = [
      ...successfulTurn("s6", "20", 0, 7),
      ...successfulTurn("other", "21", 0, 8),
      row({ kind: "benchmark-run", atMs: 100, sessionId: "s6", outcome: "ok", metadata: { runId: "s6" } }),
    ];
    const t = buildExecutionTimeline(rows, "s6");
    assert(t.turnCount === 1, "other sessions excluded");
    assert(t.turns[0].events.every((e) => e.sessionId === "s6"), "only the requested session's events");
    assert(t.turns[0].events.every((e) => e.kind !== "benchmark-run"), "benchmark runs excluded from timelines");
    assert(t.userIds.join(",") === "7", "session user ids collected");
    assert(t.privacyNote === TIMELINE_PRIVACY_NOTE, "privacy note travels with every timeline");

    const empty = buildExecutionTimeline(rows, "nope");
    assert(empty.turnCount === 0 && empty.startedAt === null, "unknown session is an honest empty timeline");
  }

  // ── §7 summarizeTimelineSessions ──────────────────────────────────────────
  console.log("\n§7 summarizeTimelineSessions — the picker");
  {
    const rows = [
      ...successfulTurn("sA", "30", 0, 7),
      ...successfulTurn("sB", "31", 10_000, 8),
      row({ kind: "recovery", atMs: 11_000, sessionId: "sB", severity: "warning", outcome: "no-results",
            recoveryPath: "honest-disclosure", metadata: { turnId: "31" } }),
      row({ kind: "user-feedback", atMs: 12_000, sessionId: "sB", outcome: "down",
            metadata: { turnId: "31", reasonCode: "unhelpful" } }),
      row({ kind: "benchmark-run", atMs: 0, sessionId: "bench-1", outcome: "ok" }),
      row({ kind: "recovery", atMs: 0, outcome: "internal-error" }), // no session — never listed
    ];

    const all = summarizeTimelineSessions(rows);
    assert(all.length === 2, "benchmark and sessionless rows excluded from the picker");
    assert(all[0].sessionId === "sB", "newest activity first");
    assert(all[0].turnCount === 1 && all[0].observationCount === 7, "session turn/observation counts");
    assert(all[0].recoveryCount === 1 && all[0].feedbackDown === 1 && all[0].attention === true,
      "failure signals surfaced on the session card");
    assert(all[1].attention === false, "clean session carries no attention flag");
    assert(all[1].capabilities.includes("planner") && all[1].intents.includes("planner:read"),
      "capabilities and intents listed");

    assert(summarizeTimelineSessions(rows, { userId: 7 }).map((s) => s.sessionId).join(",") === "sA",
      "user filter");
    assert(summarizeTimelineSessions(rows, { capability: "planner" }).length === 2, "capability filter matches");
    assert(summarizeTimelineSessions(rows, { capability: "shopping" }).length === 0, "capability filter excludes");
    assert(summarizeTimelineSessions(rows, { intent: "planner:read" }).length === 2, "intent filter");
    assert(summarizeTimelineSessions(rows, { sessionId: "sA" }).length === 1, "session filter");
  }

  // ── §8 timelineToCsv ──────────────────────────────────────────────────────
  console.log("\n§8 timelineToCsv — export shape");
  {
    const rows = [
      ...successfulTurn("s8", "40", 0),
      row({ kind: "user-feedback", atMs: 5_000, sessionId: "s8", outcome: "up",
            metadata: { conversationTurnId: 5, note: undefined } }),
    ];
    const csv = timelineToCsv(buildExecutionTimeline(rows, "s8"));
    const lines = csv.split("\n");

    assert(lines[0].startsWith("sessionId,turnId,turnCorrelation,observationId,observedAt,stage"),
      "CSV header names the correlation columns");
    assert(lines.length === 1 + 5 + 1, "one row per event plus header (unassigned included)");
    assert(lines[1].includes("s8,40,exact"), "turn events carry their turnId and correlation");
    assert(lines[6].includes(",unassigned,"), "unassigned events labelled");
    assert(lines[1].includes('"{""turnId"":""40""'), "metadata JSON is CSV-escaped");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ✗ ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
