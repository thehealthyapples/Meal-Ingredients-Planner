/**
 * test-intelligence-behaviour-decision.ts — BEH1
 * =================================================================
 * Tests for the Behaviour Engine's activated decision layer: voice
 * resolution and its provenance, the sealed decision and its
 * deterministic reasoning, the behaviour-decision capture seam, the
 * Observation Engine's behaviour analytics (including the feedback
 * join by turn correlation id), the Execution Timeline projection,
 * and the architectural boundaries the engine must never cross.
 *
 * DB-free by construction — pure functions over synthetic rows plus
 * the injected InMemoryObservationStore; server/db.ts is never loaded.
 *
 * Coverage:
 *   §1 resolveBehaviour — provenance, fail-safe default, overrides
 *   §2 sealBehaviourDecision — surfaces, outcomes, reasoning, determinism
 *   §3 the §5.2 acceptance criterion — same facts, different voice
 *   §4 the capture seam — behaviour-decision rows, OBS_DISABLE_CAPTURE
 *   §5 summarizeBehaviour — distribution, overrides, effectiveness, honest nulls
 *   §6 buildExecutionTimeline — decision projected; legacy turns still honest
 *   §7 boundaries — the engine records nothing, routes nothing, persists nothing
 *
 * Run: npx tsx server/tests/test-intelligence-behaviour-decision.ts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  resolveBehaviour,
  sealBehaviourDecision,
  describeBehaviourRegistry,
  BEHAVIOUR_SURFACES,
  BEHAVIOUR_OUTCOMES,
  PERSONALITY_IDS,
  DEFAULT_PERSONALITY_ID,
  type BehaviourSurface,
} from "../intelligence/conversation/behaviour-engine.js";
import {
  recordObservation,
  setObservationStore,
  summarizeBehaviour,
  type ObservationKind,
} from "../intelligence/observation/observation-engine.js";
import { InMemoryObservationStore } from "../intelligence/observation/observation-contract.js";
import { buildExecutionTimeline } from "../intelligence/observation/execution-timeline.js";
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

const T0 = new Date("2026-07-09T09:00:00.000Z").getTime();

let rowId = 1;
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
    sessionId: "s1",
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

/** A behaviour-decision row as the gateway records it. */
function decisionRow(opts: {
  turnId: string;
  personalityId: string;
  outcome: string;
  atMs?: number;
  confidence?: number;
  overrideApplied?: boolean;
  overrideReason?: string;
  requestedPersonality?: string | null;
  surfaces?: string[];
  sessionId?: string;
}): PlatformObservation {
  return row({
    kind: "behaviour-decision",
    atMs: opts.atMs,
    sessionId: opts.sessionId ?? "s1",
    outcome: opts.outcome,
    confidence: opts.confidence ?? 1,
    metadata: {
      turnId: opts.turnId,
      personalityId: opts.personalityId,
      personalityName: opts.personalityId,
      requestedPersonality: opts.requestedPersonality ?? opts.personalityId,
      overrideApplied: opts.overrideApplied ?? false,
      overrideReason: opts.overrideReason ?? "none",
      confidenceBasis: (opts.confidence ?? 1) === 1 ? "stored-preference" : "platform-default",
      surfaces: opts.surfaces ?? ["system-prompt-fragment"],
      reasoning: ["…"],
      fallbackState: null,
      guidanceCount: 0,
      notVoicedReason: null,
    },
  });
}

function feedbackRow(turnId: string | null, rating: "up" | "down", atMs = 0): PlatformObservation {
  return row({
    kind: "user-feedback",
    atMs,
    outcome: rating,
    metadata: turnId ? { turnId, reasonCode: "clarity" } : { reasonCode: "clarity" },
  });
}

async function main(): Promise<void> {
  // ---------------------------------------------------------------------------
  console.log("\n── §1 resolveBehaviour — provenance, fail-safe default, overrides ───────────");
  // ---------------------------------------------------------------------------

  {
    const r = resolveBehaviour("coach");
    assert(r.personalityId === "coach", "a recognised stored preference is applied verbatim");
    assert(r.requestedPersonality === "coach", "the requested voice is recorded as stored");
    assert(r.overrideApplied === false, "a recognised preference is not an override");
    assert(r.overrideReason === "none", "override reason is 'none' for a recognised preference");
    assert(r.confidence === 1, "provenance confidence is 1 for an explicit stored choice");
    assert(r.confidenceBasis === "stored-preference", "confidence basis names the stored preference");
  }

  {
    const r = resolveBehaviour(null);
    assert(r.personalityId === DEFAULT_PERSONALITY_ID, "a missing preference falls back to the platform default");
    assert(r.requestedPersonality === null, "a missing preference records no requested voice");
    assert(r.overrideApplied === true, "the fail-safe default is recorded as an override");
    assert(r.overrideReason === "no-stored-preference", "override reason distinguishes a missing preference");
    assert(r.confidence === 0, "provenance confidence is 0 when the voice was defaulted");
    assert(r.confidenceBasis === "platform-default", "confidence basis names the platform default");
  }

  {
    const r = resolveBehaviour("sarge");
    assert(r.personalityId === DEFAULT_PERSONALITY_ID, "an unrecognised preference normalises to the default voice");
    assert(r.requestedPersonality === "sarge", "the unrecognised value is preserved for the operator");
    assert(r.overrideReason === "unrecognised-preference", "override reason distinguishes an unrecognised value");
    assert(r.confidence === 0, "an unrecognised preference cannot claim provenance confidence");
  }

  {
    assert(resolveBehaviour("   ").overrideReason === "no-stored-preference", "a blank preference is treated as absent");
    assert(resolveBehaviour(undefined).personalityId === DEFAULT_PERSONALITY_ID, "undefined resolves to the default voice");
    assert(resolveBehaviour(42).personalityId === DEFAULT_PERSONALITY_ID, "a non-string preference resolves to the default voice");
    assert(resolveBehaviour({}).overrideApplied === true, "a malformed preference is an override, never a crash");
    // Total: every input resolves to a registered voice — there is no error state at the voice seam.
    assert(
      [null, undefined, "", "nope", 7, {}, []].every((v) => PERSONALITY_IDS.includes(resolveBehaviour(v).personalityId)),
      "resolveBehaviour is total — every input yields a registered personality",
    );
  }

  // ---------------------------------------------------------------------------
  console.log("\n── §2 sealBehaviourDecision — surfaces, outcomes, reasoning, determinism ─────");
  // ---------------------------------------------------------------------------

  const coach = resolveBehaviour("coach");

  {
    const d = sealBehaviourDecision({
      resolution: coach,
      outcome: "voiced",
      surfaces: ["guidance-voicing", "system-prompt-fragment"],
      guidanceCount: 3,
    });
    assert(d.personalityId === "coach", "the sealed decision carries the applied voice");
    assert(d.personalityName === "Coach", "the sealed decision resolves the display name from the one registry");
    assert(
      JSON.stringify(d.surfaces) === JSON.stringify(["system-prompt-fragment", "guidance-voicing"]),
      "surfaces are canonicalised to registry order, not caller order",
    );
    assert(d.guidanceCount === 3, "the guidance count is carried verbatim");
    assert(d.notVoicedReason === null, "a voiced decision carries no not-voiced reason");
    assert(
      d.reasoning.some((r) => r.includes("stored companionPersonality preference")),
      "reasoning states where the voice came from",
    );
    assert(
      d.reasoning.some((r) => r.includes("after the system prompt's five hard rules")),
      "reasoning states the fragment was appended after the hard rules",
    );
    assert(
      d.reasoning.some((r) => r.includes("3 already-eligible guidance suggestions")),
      "reasoning states how many already-eligible suggestions were reordered",
    );
    assert(
      d.reasoning.some((r) => r.includes("companion-guidance.ts owns eligibility")),
      "reasoning names the owner of eligibility rather than claiming it",
    );
  }

  {
    const d = sealBehaviourDecision({
      resolution: coach,
      outcome: "voiced",
      surfaces: ["system-prompt-fragment", "system-prompt-fragment"],
    });
    assert(d.surfaces.length === 1, "a repeated surface is deduplicated");
    assert(d.guidanceCount === 0, "an unstated guidance count defaults to 0, never null");
  }

  {
    const d = sealBehaviourDecision({
      resolution: coach,
      outcome: "voiced-fallback",
      surfaces: ["fallback-voicing"],
      fallbackState: "no-knowledge",
    });
    assert(d.fallbackState === "no-knowledge", "the voiced fallback state is carried");
    assert(
      d.reasoning.some((r) => r.includes("'no-knowledge' honest gap") && r.includes("turn-fallback.ts's — unchanged")),
      "reasoning voices the gap but names turn-fallback.ts as the owner of what it discloses",
    );
    assert(
      !d.reasoning.some((r) => r.includes("hard rules")),
      "a fallback turn makes no LLM call, so no tone-fragment reasoning is claimed",
    );
  }

  {
    const d = sealBehaviourDecision({
      resolution: coach,
      outcome: "not-voiced",
      surfaces: [],
      notVoicedReason: "escalation-copy-not-registry-owned",
    });
    assert(d.outcome === "not-voiced", "a turn no voice touched is recorded as not-voiced");
    assert(d.notVoicedReason === "escalation-copy-not-registry-owned", "the not-voiced reason is carried");
    assert(
      d.reasoning.some((r) => r.includes("platform-owned copy, not Personality Registry content")),
      "reasoning names the known debt rather than implying the voice ran",
    );
  }

  {
    const defaulted = sealBehaviourDecision({
      resolution: resolveBehaviour("sarge"),
      outcome: "voiced",
      surfaces: ["system-prompt-fragment"],
    });
    assert(
      defaulted.reasoning[0].includes("'sarge' is not a registered personality"),
      "an unrecognised preference is explained, naming the value that failed",
    );
    assert(
      defaulted.reasoning[0].includes("No error was surfaced to the user"),
      "reasoning records that the fail-safe default degraded silently, never to an error",
    );
  }

  {
    const input = { resolution: coach, outcome: "voiced" as const, surfaces: ["system-prompt-fragment" as BehaviourSurface] };
    const a = sealBehaviourDecision(input);
    const b = sealBehaviourDecision(input);
    assert(JSON.stringify(a) === JSON.stringify(b), "sealing is deterministic — same inputs, identical decision");
  }

  {
    const d = sealBehaviourDecision({ resolution: coach, outcome: "voiced", surfaces: [] });
    assert(
      d.reasoning.some((r) => r.includes("incomplete capture")),
      "a voiced outcome with no surface is flagged as an incomplete capture, not presented as voiced",
    );
  }

  // ---------------------------------------------------------------------------
  console.log("\n── §3 the §5.2 acceptance criterion — same facts, different voice ───────────");
  // ---------------------------------------------------------------------------

  {
    // For a FIXED interaction, switching the voice may change the applied
    // personality and the wording of the operator reasoning — and nothing else.
    const decisions = PERSONALITY_IDS.map((id) =>
      sealBehaviourDecision({
        resolution: resolveBehaviour(id),
        outcome: "voiced-fallback",
        surfaces: ["fallback-voicing", "guidance-voicing"],
        fallbackState: "no-results",
        guidanceCount: 2,
      }),
    );

    assert(decisions.every((d) => d.outcome === "voiced-fallback"), "the outcome is identical across all six voices");
    assert(
      decisions.every((d) => JSON.stringify(d.surfaces) === JSON.stringify(["fallback-voicing", "guidance-voicing"])),
      "the surfaces touched are identical across all six voices",
    );
    assert(decisions.every((d) => d.fallbackState === "no-results"), "the disclosed gap state is identical across all six voices");
    assert(decisions.every((d) => d.guidanceCount === 2), "the suggestion count is identical across all six voices");
    assert(decisions.every((d) => d.confidence === 1 && !d.overrideApplied), "provenance is identical across all six voices");
    assert(
      new Set(decisions.map((d) => d.personalityId)).size === PERSONALITY_IDS.length,
      "each voice is distinctly recorded — the applied personality is the only decision field that varies",
    );
    assert(
      decisions.every((d) => d.reasoning.length === decisions[0].reasoning.length),
      "every voice produces the same number of reasoning statements",
    );
  }

  {
    const registry = describeBehaviourRegistry();
    assert(registry.length === PERSONALITY_IDS.length, "the registry description covers exactly the closed voice set");
    assert(registry.filter((p) => p.isDefault).length === 1, "exactly one voice is the platform default");
    assert(
      registry.every((p) => Object.keys(p.behaviour).length === 12),
      "every voice exposes the 12-dimension behaviour profile",
    );
    assert(
      registry.every((p) => p.systemPromptFragment.length > 0 && p.description.length > 0),
      "every voice exposes its tone fragment and description for the Workbench",
    );
  }

  // ---------------------------------------------------------------------------
  console.log("\n── §4 the capture seam — behaviour-decision rows, OBS_DISABLE_CAPTURE ────────");
  // ---------------------------------------------------------------------------

  {
    const store = new InMemoryObservationStore();
    setObservationStore(store);

    const decision = sealBehaviourDecision({
      resolution: resolveBehaviour("chef"),
      outcome: "voiced",
      surfaces: ["system-prompt-fragment"],
    });
    recordObservation({
      kind: "behaviour-decision",
      outcome: decision.outcome,
      confidence: decision.confidence,
      sessionId: "s99",
      turnId: "t99",
      metadata: { personalityId: decision.personalityId, surfaces: decision.surfaces },
    });
    await settle();

    const rows = store.all().filter((r) => r.kind === "behaviour-decision");
    assert(rows.length === 1, "a behaviour decision is captured as one behaviour-decision observation");
    assert(rows[0].outcome === "voiced", "the decision outcome rides in the row's outcome column");
    assert(rows[0].confidence === 1, "the provenance confidence rides in the row's confidence column");
    assert((rows[0].metadata as any).turnId === "t99", "the decision joins its turn via the OBS2 correlation id");
    assert(rows[0].capability === null && rows[0].verb === null, "a behaviour decision names no capability — it never routes");

    process.env.OBS_DISABLE_CAPTURE = "1";
    recordObservation({ kind: "behaviour-decision", outcome: "voiced", sessionId: "s99" });
    await settle();
    delete process.env.OBS_DISABLE_CAPTURE;
    assert(
      store.all().filter((r) => r.kind === "behaviour-decision").length === 1,
      "OBS_DISABLE_CAPTURE=1 makes behaviour-decision capture a no-op",
    );

    setObservationStore(null);
  }

  // ---------------------------------------------------------------------------
  console.log("\n── §5 summarizeBehaviour — distribution, overrides, effectiveness ────────────");
  // ---------------------------------------------------------------------------

  {
    const rows: PlatformObservation[] = [
      decisionRow({ turnId: "t1", personalityId: "coach", outcome: "voiced", atMs: 0 }),
      decisionRow({ turnId: "t2", personalityId: "coach", outcome: "voiced-fallback", atMs: 1_000, surfaces: ["fallback-voicing"] }),
      decisionRow({ turnId: "t3", personalityId: "friend", outcome: "voiced", atMs: 2_000 }),
      decisionRow({
        turnId: "t4",
        personalityId: "companion",
        outcome: "not-voiced",
        atMs: 3_000,
        confidence: 0,
        overrideApplied: true,
        overrideReason: "unrecognised-preference",
        requestedPersonality: "sarge",
        surfaces: [],
      }),
      feedbackRow("t1", "up", 10_000),
      feedbackRow("t2", "down", 11_000),
      feedbackRow("t3", "up", 12_000),
      feedbackRow(null, "up", 13_000), // legacy: no turn correlation
      feedbackRow("t-unknown", "down", 14_000), // names a turn with no decision row
    ];

    const s = summarizeBehaviour(rows, 7);

    assert(s.decisions === 4, "every behaviour decision in the window is counted");
    assert(s.windowDays === 7, "the window is reported back honestly");
    assert(s.averageConfidence === 0.75, "average provenance confidence is the share applying an explicit preference");
    assert(s.overrideRate === 0.25, "the override rate counts the fail-safe defaults");

    const coachRow = s.byPersonality.find((p) => p.personalityId === "coach")!;
    assert(coachRow.decisions === 2, "decisions group by the applied voice");
    assert(coachRow.voiced === 1 && coachRow.voicedFallback === 1, "outcomes are counted per voice");
    assert(coachRow.helpful === 1 && coachRow.notHelpful === 1, "feedback joins its voice through the turn id");
    assert(coachRow.effectiveness === 0.5, "effectiveness is the helpful share of rated turns for that voice");
    assert(coachRow.ratedDecisions === 2, "a rated decision is counted once per turn");

    const companionRow = s.byPersonality.find((p) => p.personalityId === "companion")!;
    assert(companionRow.notVoiced === 1, "a not-voiced interaction is recorded, not hidden");
    assert(companionRow.effectiveness === null, "a voice with no ratings reports null effectiveness, never a fabricated 0");
    assert(companionRow.overrides === 1, "overrides are attributed to the voice that was actually applied");

    assert(s.overrides.total === 1, "the override total counts every fail-safe default");
    assert(s.overrides.byReason[0].reason === "unrecognised-preference", "overrides are grouped by their reason");
    assert(s.overrides.recent[0].requestedPersonality === "sarge", "the operator sees the value that failed to resolve");
    assert(s.overrides.recent[0].appliedPersonalityId === "companion", "the operator sees the voice applied instead");
    assert(s.overrides.recentLimit === 20, "the listing cap is disclosed rather than silently truncating");

    assert(s.effectiveness.helpful === 2 && s.effectiveness.notHelpful === 1, "window-level ratings are tallied");
    assert(s.effectiveness.rate === 0.667, "the window-level effectiveness rate is the helpful share");
    assert(s.effectiveness.ratedDecisions === 3, "rated decisions are counted once per turn");
    assert(
      s.effectiveness.unattributedFeedback === 2,
      "feedback that names no recorded decision is reported as unattributed, never guessed into a voice",
    );
    assert(
      s.effectiveness.note.includes("No component reads it") && s.correlationNote.includes("not reconstructed"),
      "the view states that effectiveness is operator-only and that pre-BEH1 turns are absent, not reconstructed",
    );

    const surfaces = new Map(s.bySurface.map((x) => [x.surface, x.count]));
    assert(surfaces.get("system-prompt-fragment") === 2, "surfaces are counted across decisions");
    assert(surfaces.get("fallback-voicing") === 1, "the fallback surface is counted separately");
    assert(s.byOutcome.some((o) => o.outcome === "not-voiced" && o.count === 1), "outcomes are distributed honestly");
    assert(s.byDay.length === 1 && s.byDay[0].decisions === 4 && s.byDay[0].overrides === 1, "decisions trend by day");
  }

  {
    const empty = summarizeBehaviour([], 7);
    assert(empty.decisions === 0, "an empty window reports zero decisions");
    assert(empty.averageConfidence === null, "an empty window reports null confidence, never 0");
    assert(empty.overrideRate === null, "an empty window reports null override rate, never 0");
    assert(empty.effectiveness.rate === null, "an empty window reports null effectiveness, never 0 or 100%");
    assert(empty.byPersonality.length === 0, "an empty window invents no voices");
  }

  {
    // A voice with decisions but no feedback must never be scored.
    const s = summarizeBehaviour([decisionRow({ turnId: "t1", personalityId: "teacher", outcome: "voiced" })], 7);
    assert(s.byPersonality[0].effectiveness === null, "an unrated voice is honestly unscored");
    assert(s.effectiveness.rate === null, "an unrated window is honestly unscored");
  }

  // ---------------------------------------------------------------------------
  console.log("\n── §6 buildExecutionTimeline — the decision, projected ───────────────────────");
  // ---------------------------------------------------------------------------

  {
    const rows: PlatformObservation[] = [
      row({ kind: "intent-resolution", atMs: 0, metadata: { turnId: "t1" }, intent: "meals:read", confidence: 0.9, outcome: "resolved" }),
      row({ kind: "response-generation", atMs: 200, metadata: { turnId: "t1", model: "gpt-x", personalityId: "coach" }, outcome: "ok" }),
      decisionRow({
        turnId: "t1",
        personalityId: "coach",
        outcome: "voiced",
        atMs: 210,
        surfaces: ["system-prompt-fragment", "guidance-voicing"],
      }),
    ];
    const timeline = buildExecutionTimeline(rows, "s1");
    const turn = timeline.turns[0];

    assert(turn.behaviour === "coach", "the applied voice is surfaced on the turn");
    assert(turn.behaviourDecision !== null, "the sealed decision is projected onto the turn");
    assert(turn.behaviourDecision!.confidence === 1, "the projected decision carries provenance confidence");
    assert(turn.behaviourDecision!.overrideApplied === false, "the projected decision carries the override flag");
    assert(
      JSON.stringify(turn.behaviourDecision!.surfaces) === JSON.stringify(["system-prompt-fragment", "guidance-voicing"]),
      "the projected decision carries the surfaces the voice touched",
    );
    assert(
      turn.events.some((e) => e.kind === "behaviour-decision" && e.stage === "Behaviour decided"),
      "the decision appears as a named stage in the execution flow",
    );
  }

  {
    // A pre-BEH1 turn: no decision row, but OBS2's personality crumb survives.
    const rows: PlatformObservation[] = [
      row({ kind: "intent-resolution", atMs: 0, metadata: { turnId: "t9" }, outcome: "resolved" }),
      row({ kind: "recovery", atMs: 100, metadata: { turnId: "t9", personalityId: "sergeant" }, outcome: "no-knowledge" }),
    ];
    const turn = buildExecutionTimeline(rows, "s1").turns[0];
    assert(turn.behaviourDecision === null, "a turn recorded before BEH1 has no decision — honestly null, never reconstructed");
    assert(turn.behaviour === "sergeant", "the legacy personality crumb is still surfaced for pre-BEH1 turns");
  }

  {
    const rows: PlatformObservation[] = [row({ kind: "intent-resolution", atMs: 0, metadata: { turnId: "t8" }, outcome: "resolved" })];
    const turn = buildExecutionTimeline(rows, "s1").turns[0];
    assert(turn.behaviour === null && turn.behaviourDecision === null, "a turn with no voice signal reports null, never a guessed default");
  }

  {
    // The decision must not carry the user's words — the privacy rule is absolute.
    const d = decisionRow({ turnId: "t1", personalityId: "coach", outcome: "voiced" });
    const serialised = JSON.stringify(d.metadata);
    assert(!serialised.includes("utterance") && !serialised.includes("text"), "a behaviour decision records no utterance or answer text");
  }

  // ---------------------------------------------------------------------------
  console.log("\n── §7 boundaries — the engine records, routes and persists nothing ───────────");
  // ---------------------------------------------------------------------------

  {
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(resolve(here, "../intelligence/conversation/behaviour-engine.ts"), "utf8");
    const imports = source
      .split("\n")
      .filter((line) => /^\s*import\s/.test(line) || /^\s*}\s*from\s+"/.test(line))
      .join("\n");

    assert(!source.includes("recordObservation"), "the Behaviour Engine never records an observation — its caller does");
    assert(!imports.includes("observation"), "the Behaviour Engine imports no Observation Engine module");
    assert(!imports.includes("capability-registry"), "the Behaviour Engine holds no reference to the Capability Registry");
    assert(!imports.includes("intent-engine"), "the Behaviour Engine holds no reference to the Intent Engine");
    assert(!imports.includes("conversation-store") && !imports.includes("storage"), "the Behaviour Engine persists nothing");
    assert(!/\bawait\b/.test(source) && !/\basync\b/.test(source), "every Behaviour Engine export is synchronous and pure — no I/O");
    assert(!source.includes("Date.now()") && !source.includes("Math.random"), "no clock and no randomness — phrasing stays deterministic");

    // The gateway is the capture point (Observation Engine §4 rule 4).
    const gateway = readFileSync(resolve(here, "../intelligence/conversation/conversation-gateway.ts"), "utf8");
    const captures = gateway.match(/kind: "behaviour-decision"/g) ?? [];
    assert(captures.length === 1, "the gateway has exactly one behaviour-decision capture point");
    const sealed = gateway.match(/recordBehaviourDecision\(\{/g) ?? [];
    assert(sealed.length === 5, "every one of the gateway's five exit paths records a behaviour decision");
  }

  {
    assert(BEHAVIOUR_SURFACES.length === 3, "the surface vocabulary is closed to the three live seams");
    assert(BEHAVIOUR_OUTCOMES.length === 4, "the outcome vocabulary is closed");
    assert(
      !BEHAVIOUR_SURFACES.some((s) => (s as string).includes("notice") || (s as string).includes("greeting")),
      "dormant seams claim no surface until their routes are wired (BEH-P1/BEH-P2)",
    );
  }

  // -------------------------------------------------------------------------
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ✗ ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Behaviour decision tests crashed:", err);
  process.exit(1);
});
