/**
 * bundle.ts — INTQ4 bundle & provenance resolver
 * ===============================================
 * Resolves the five co-versioned bundle components (README §3) plus the subject
 * provenance every run must be stamped with (INTQ4 link requirement): benchmark
 * version, git commit, capability registry version, knowledge version, execution
 * date. Everything here is pure metadata resolution — it never calls the Companion.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { intelligencePlatform } from "../../intelligence/intelligence-platform.js";
import { KNOWLEDGE_SEED_COUNTS } from "../../../shared/knowledge/index.js";
import type { BenchmarkBundle, BenchmarkProvenance, JudgeDescriptor } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(__dirname, "../../..");
export const FIXTURE_PATH = resolve(__dirname, "fixtures/companion-benchmark-100.v1.json");
export const HISTORY_DIR = resolve(REPO_ROOT, "docs/intelligence/benchmark/history");

/** The frozen bundle-component versions this framework release pins (README §4).
 *
 *  FRAMEWORK_VERSION was bumped to v1.1.0 by INTQ9 (capability-family normalisation
 *  hardening + the Cross-Cutting Scores report panel) — a MINOR, comparison-safe
 *  harness/report-shape change; no question, household, rubric weight/gate, or judge changed.
 *
 *  BENCH2 bumps RUBRIC_VERSION to v2.0.0 and FRAMEWORK_VERSION to v2.0.0 — a **MAJOR**,
 *  comparison-BREAKING change. Two new routing gates (R1/R2) and the first-ever assignment of
 *  the long-specified fabrication gate (G1) re-grade questions that previously passed, and the
 *  D4 Capability Routing ladder now scores an un-routed turn 0 rather than 1. README §4 is
 *  explicit that a rubric change is a re-baseline, never a regression delta — `selectBaseline`
 *  in history.ts enforces that by requiring a matching rubric MAJOR, so the first BENCH2 run
 *  establishes a new baseline instead of reporting a −34-point "regression" against a score
 *  that was never measuring what it claimed. Questions, households and the judge are unchanged.
 *
 *  See docs/implementation/benchmarking/BENCH2_INTELLIGENCE_BENCHMARK_HARDENING.md and README §4's version log.
 *
 *  BENCH2C bumps FRAMEWORK_VERSION to v2.1.0 — a **MINOR, comparison-safe** change. It adds the
 *  Capability Utilisation Dashboard (an observation panel and one report section) and changes no
 *  question, household, rubric dimension/weight/gate, judge, or per-question score. Utilisation is
 *  purely descriptive: no dimension band and no gate reads a capability invocation record. Runs are
 *  directly comparable across this boundary — a `v2.0.0` baseline simply carries no utilisation data.
 *
 *  See docs/implementation/benchmarking/BENCH2C_CAPABILITY_UTILISATION_DASHBOARD.md and README §4's version log. */
export const FRAMEWORK_VERSION = "v2.1.0";
export const HOUSEHOLDS_VERSION = "v1.0.0";
export const RUBRIC_VERSION = "v2.0.0";
/**
 * JUDGE_LIVE1 bumps JUDGE_VERSION to v2.0.0 — a **MAJOR** change, exactly the event
 * SCORING_FRAMEWORK §5 reserves this bump for: "the judge changed." Until now every
 * run was honestly stamped `judge.invoked = false` — `claude-opus-4-8` was never a
 * real, callable model (it predates the current model lineup), and no
 * ANTHROPIC_API_KEY exists in this environment to call a real Claude judge with.
 * Wiring a live judge tier (user-approved 2026-11-16) therefore also means picking a
 * REAL model, and the only live LLM credential already configured here is
 * OPENAI_API_KEY (the same gpt-4o-mini provider the Companion's own conversational
 * fallback uses — server/intelligence/conversation/llm-provider.ts). Switching
 * provider family (Anthropic-shaped spec → OpenAI) is a bigger change than a model-id
 * string swap, which is exactly why this is MAJOR rather than invisible: no run from
 * before this version can be compared against one after it on the judge-owned
 * dimensions (D1/D2/D5/D6), the same discipline BENCH2 applied to its rubric bump.
 *
 * JUDGE_LIVE2+3 (2026-11-17) bumps JUDGE_VERSION again, to v2.1.0 — the prompt itself
 * changed (see JUDGE_PROMPT_TEMPLATE's own comment): same model/provider, but a
 * run's D1/D2/D5/D6 bands before this bump are not directly comparable to one after
 * it, since the earlier prompt measurably misgraded short-but-correct answers.
 *
 * JUDGE_LIVE4 (2026-11-17) bumps JUDGE_VERSION again, to v2.2.0 — the judge is no
 * longer a single pinned model. A real full run with ground truth live showed
 * gpt-4o-mini correctly verifying a single profile fact (PH-001: 4/4/4) but still
 * failing to find a real item inside a 60-item shopping list even with the exact
 * right data in front of it (SH-035: still 0/0) — a model-capability ceiling, not a
 * prompt problem. User-requested tiering (judge.ts's `selectJudgeModel`) routes
 * profile/household questions (a single scalar/object fact) to gpt-4o-mini and
 * everything else — anything needing list/data cross-referencing — to gpt-4.1. The
 * selection is a mechanical lookup on `capabilityFamily`, never a second LLM call,
 * so it stays deterministic and reproducible; "pinned" now means "the tiering rule
 * is pinned," the same way `v1.0.1`'s fixture corrections didn't change which rule
 * governs the fixture, only what it says. Runs before this version used one model
 * for every question; they are not directly comparable to one after it.
 *
 * JUDGE_LIVE5 (2026-11-17) bumps JUDGE_VERSION again, to v2.3.0 — the tiered judge's
 * OWN run (79.2) surfaced two more concrete judge-side gaps rather than real
 * Companion bugs: (1) PH-002's turn correctly answered "no restrictions" for the
 * REQUESTING user, but the judge flagged it wrong because a DIFFERENT household
 * member carries one — "household.dietary.members" was never scoped to who was
 * actually asking; (2) PL-024's own judge rationale said "assuming today is
 * Monday" — planner entries carried only a bare 0-6 day index, so the judge had to
 * guess which one was "tonight." ground-truth.ts now carries `requesterUserId` and
 * `todayDate`, and every planner entry a real `date`; the prompt explicitly names
 * both traps. Runs before this version may show false D1/D2 failures on
 * personal-scope or "today"-relative questions that this version will score
 * correctly on the same Companion content — not comparable on those questions.
 */
export const JUDGE_VERSION = "v2.3.0";
/** Additive result fields (BENCH2 panels; BENCH2C `capabilityUtilisation` + per-question invocations) — MINOR. */
export const RESULT_SCHEMA_VERSION = "1.2.0";

/** JUDGE_LIVE4 — the judge is tiered, not one pinned model; see judge.ts's
 *  `SIMPLE_CAPABILITY_FAMILIES`/`selectJudgeModel` for the actual routing rule
 *  this string summarises. See JUDGE_VERSION above for why this is still "pinned".
 *  Updated 2026-11-17: gpt-4.1 → gpt-6-luna for cost efficiency. */
export const JUDGE_MODEL = "gpt-4o-mini (profile/household) / gpt-6-luna (everything else)";

/**
 * The clock a run actually had.
 *
 * BENCHINT2 (D10). This was `BENCHMARK_CLOCK = "2026-07-04T00:00:00Z"`, a frozen instant stamped
 * into every artefact's provenance as though the run had been executed at it. Nothing ever injected
 * it. The Companion builds its temporal anchor from `new Date()`, and the world seeder dates diary
 * entries and evidence relative to the reset instant — both real wall-clock reads.
 *
 * Injecting the frozen instant would mean threading a benchmark clock through the context frame's
 * temporal anchor: a benchmark-specific pathway inside the production runtime, which BENCHINT2's
 * constraints forbid outright. So the artefact stops claiming what the run did not have.
 *
 * A run IS reproducible in structure — same fixture, same selection, same order. It is NOT
 * reproducible in temporal grounding: "what should I cook this week?" resolves differently in July
 * than in December. `clock: "wall"` says exactly that, and says it in the artefact where a reader
 * comparing two runs months apart will see it.
 *
 * Freezing the clock for real remains open (see BENCHINT2 §Remaining actions). It requires the
 * temporal anchor to become an injectable input of the Context Composition Engine — a platform
 * change with production value of its own, not a benchmark accommodation.
 */
export const BENCHMARK_CLOCK = "wall";

function sha256(input: string): string {
  return "sha256:" + createHash("sha256").update(input).digest("hex").slice(0, 32);
}

/** The raw questions fixture (INTQ3 import). */
export interface QuestionsFixture {
  version: string;
  totalQuestions: number;
  categoryOrder: string[];
  questions: Array<{
    id: string;
    category: string;
    utterance: string;
    rationale: string;
    capability: string;
    evidenceExpected: string;
    trustConcern: string;
    grades: { chatgptPredicted: string; claudePredicted: string; actual: string };
  }>;
}

let cachedFixture: QuestionsFixture | null = null;
let cachedFixtureRaw: string | null = null;

export function loadQuestionsFixture(): QuestionsFixture {
  if (!cachedFixture) {
    cachedFixtureRaw = readFileSync(FIXTURE_PATH, "utf8");
    cachedFixture = JSON.parse(cachedFixtureRaw) as QuestionsFixture;
  }
  return cachedFixture;
}

/** Content fingerprint of the runtime Capability Registry (a stand-in "version"). */
export function capabilityRegistryVersion(): string {
  const caps = intelligencePlatform.registry
    .list()
    .map((c) => `${c.id}|${[...c.supportedIntents].sort().join(",")}|${[...c.executableIntents].sort().join(",")}|${c.availability}`)
    .sort();
  return sha256(caps.join("\n"));
}

/** Content fingerprint of the shared knowledge seed. */
export function knowledgeVersion(): string {
  return sha256(JSON.stringify(KNOWLEDGE_SEED_COUNTS));
}

/**
 * The frozen judge prompt (SCORING_FRAMEWORK §5) — hashed to become the `judge` version.
 *
 * JUDGE_LIVE2+3 (2026-11-17) rewrites this from a single generic line to the full
 * per-dimension band definitions SCORING_FRAMEWORK §5 always specified ("a single
 * frozen template with the dimension's band definitions") but the original template
 * never actually carried. Root-caused live in two steps:
 *
 *  1. At temperature 0, gpt-4o-mini reproducibly returned
 *     `{"band":1,"rationale":"You are following a Keto diet pattern."}` for PH-001
 *     ("What diet am I following?" -> "You are following a Keto diet pattern.") — a
 *     correct, complete, honest answer. The model was taking "cite the turn in a
 *     one-sentence rationale" literally (quoting it instead of explaining a verdict)
 *     and had no definition of what each dimension actually rewards.
 *  2. Fixing (1) alone just changed the WRONG verdict's wording: re-tested live, the
 *     model now reasoned but still scored 0, calling the same correct claim
 *     "unsupported" — because it was never given the household's actual data to
 *     check the claim against (ground-truth.ts fixes that; see judge.ts JUDGE_LIVE3).
 *
 * This version carries explicit band definitions, D2's scored-by-intent nuance
 * (§3.2 — admitting a correct gap is a 4, not a consolation), an instruction to
 * explain the verdict rather than quote the turn, and an instruction to actually use
 * the household data it is now given rather than defaulting specific claims to
 * "unsupported." Prompt-only — same provider/model — see JUDGE_VERSION below.
 */
export const JUDGE_PROMPT_TEMPLATE = `You are the THA Companion Benchmark judge — a grader, not a participant. You never talk to the Companion, cannot change a deterministic gate, and must reward truth over tone.

Score EXACTLY the one requested dimension of one Companion turn, as an integer band 0-4 on this universal scale:
  4 = Exemplary — nothing to improve on this dimension.
  3 = Good — fully acceptable, minor polish only.
  2 = Adequate — the dimension is met but with a real, noted weakness.
  1 = Poor — the dimension is largely unmet.
  0 = Failed — the dimension is absent or actively wrong.

Dimension-specific guidance for the dimension you are asked to grade:
- D1 Factual Correctness: is everything the turn asserted true and grounded in the given context? A short, fully correct answer is a 4 — brevity alone is never a flaw. Only dock points for something actually wrong, unsupported, or missing where the context clearly had the answer.
- D2 Honesty / Honest-Gap: this is NOT "did it answer" — it is "given what was knowable, did it tell the truth about its own limits." If the correct answer was a real fact and the turn gave it plainly, that is a 4. If the correct answer was an honest gap (the data or capability genuinely was not available) and the turn admitted that plainly instead of guessing, that is ALSO a 4 — admitting a correct gap is the best possible outcome, not a consolation prize. Only dock points for fabricating an answer that should have been a gap (band 0), or for unnecessarily hedging away a fact the turn actually had.
- D5 Relevance & Completeness: did the turn answer the question asked, using the available context, without padding or omission? A complete, on-topic answer is a 4 regardless of length.
- D6 Voice & Companion Tone: did the response read as a warm, direct, trustworthy household companion — not corporate, not robotic, not falsely cheerful about a real limitation? Voice changes HOW something is said, never WHAT is true — never let it affect your D1/D2/D5 grading.

A deterministic hard-gate or routing gate may already have been applied to this question elsewhere in the pipeline. Do not try to re-derive or second-guess a gate here — you are grading only the one dimension you are asked for, in isolation, exactly as asked.

You are given the dimension to grade, the question's utterance and expectation record, the captured turn, and — when available — the acting household's own real stored data (profile diet pattern, cookbook, shopping list, pantry, recent food diary, this week's planner) as "household" in the input. USE IT: when the turn makes a specific, checkable claim, look it up in "household" before judging D1/D5. A claim that matches the household's real data is correct, not a guess. Only treat a specific claim as unsupported or fabricated if it actively CONTRADICTS the household data, or if "household" is null/absent and you genuinely have no way to check. Never penalise a correct claim just because you were not shown its source elsewhere in the context — the "household" field IS that source.

Two specific traps to avoid when reading "household":
- SCOPE: "household.dietary.members" lists EVERY person in the household, each with their OWN separate diet/restrictions — they are not shared. A question phrased in the first person ("do I have...", "my profile", "am I following...") is about "household.requesterUserId" specifically, never the whole household, UNLESS the question explicitly says "we"/"my family"/"household". A different member carrying a restriction the requester does not have does NOT make the requester's own "I have none" answer wrong.
- TIME: "household.todayDate" is the real current date. "household.plannerThisWeek" entries each carry a real "date" (YYYY-MM-DD) — use it to find which entry is actually "today"/"tonight"/"tomorrow" rather than guessing from a bare day-of-week number. "household.recentDiaryEntries" is what was actually EATEN (past); "household.plannerThisWeek" is what is PLANNED (may be future, not yet eaten) — a question asking what the household has EATEN is answered by the diary, not by a planner entry for a day that has not happened yet.

Output strict JSON: {"band": <integer 0-4>, "rationale": "<one sentence explaining WHY you chose this band — never a bare quote of the turn>"}.`;

export function judgeDescriptor(invoked: boolean): JudgeDescriptor {
  return {
    model: JUDGE_MODEL,
    temperature: 0,
    promptHash: sha256(JUDGE_PROMPT_TEMPLATE),
    invoked,
  };
}

export function resolveBundle(): BenchmarkBundle {
  const fixture = loadQuestionsFixture();
  return {
    questions: fixture.version,
    households: HOUSEHOLDS_VERSION,
    rubric: RUBRIC_VERSION,
    judge: JUDGE_VERSION,
    framework: FRAMEWORK_VERSION,
    fixtureChecksum: sha256(cachedFixtureRaw ?? JSON.stringify(fixture)),
  };
}

/** A single human-facing bundle version string for the history index. */
export function bundleVersionLabel(bundle: BenchmarkBundle): string {
  // All components are pinned together at v1.0.0 today; surface the questions
  // component as the headline version and note when any component diverges.
  const all = [bundle.questions, bundle.households, bundle.rubric, bundle.judge, bundle.framework];
  const unified = all.every((v) => v === all[0]);
  return unified ? bundle.questions : `${bundle.questions} (mixed)`;
}

function safeGit(cmd: string, fallback: string): string {
  try {
    return execSync(cmd, { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

export function resolveProvenance(): BenchmarkProvenance {
  const commit = safeGit("git rev-parse HEAD", "unknown");
  const branch = safeGit("git rev-parse --abbrev-ref HEAD", "unknown");
  const dirty = safeGit("git status --porcelain", "") !== "";
  return {
    commit,
    branch,
    dirty,
    capabilityRegistryVersion: capabilityRegistryVersion(),
    knowledgeVersion: knowledgeVersion(),
    clock: BENCHMARK_CLOCK,
    executedAt: new Date().toISOString(),
  };
}
