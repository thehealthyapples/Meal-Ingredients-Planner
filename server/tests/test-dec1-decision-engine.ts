/**
 * test-dec1-decision-engine.ts (DEC1)
 * =====================================
 * Verifies the canonical Decision Engine — the DEC1 convergence of the
 * platform's triplicated Decision-stage mechanics into
 * `shared/attention/decision.ts`, the designation of OD1's framework as the
 * Decision Engine, and the sealed `DeliveryDecision` (the BEH1 pattern applied
 * to surfacing).
 *
 * Coverage:
 *   §1  The shared mechanics — orderByAttention (total order, stability,
 *       tie-breaker precedence), clampWithCriticalExemption (A3 exemption,
 *       [1, MAX] normalisation), dedupeById (first wins), and the one
 *       canonical EvidenceCitation (the three retired evidence types are
 *       compile-time-identical aliases of it).
 *   §2  GOLDEN IDENTITY — the frozen pre-DEC1 implementations of FI4's
 *       `prioritizeOpportunities`, OD1's `prioritiseAndGroup` and the Notice
 *       Engine's `applySilenceRules` are embedded here verbatim as oracles;
 *       across a seeded sweep of generated inputs (all four attention levels,
 *       criticals, learning ranks, seen sets, duplicate ids, limits from
 *       degenerate to beyond MAX) the converged implementations produce
 *       byte-identical output. Behaviour is unchanged BY PROOF, not intent.
 *   §3  Retirement (Principle 8) — grep-verified: no consumer module declares
 *       a local attention sort, clamp constant pair, or `{source, detail}`
 *       evidence interface any more.
 *   §4  Boundaries (DEC1 D5) — source-scan: the Decision Engine imports no
 *       domain Selection engine, no evidence gate, no permissions/confirmation
 *       module, no behaviour engine, no intent resolver.
 *   §5  The sealed DeliveryDecision — pure + deterministic (same inputs, same
 *       record, same reasoning sentences); the accounting matches what
 *       collectOpportunities actually did (mute / lifecycle / budget /
 *       learning / criticals / persistence); the capability handler records
 *       exactly one `delivery-decision` observation per report; the record
 *       never reaches the wire result; and NOTHING reads it back (source-scan:
 *       the framework never imports the Observation Engine, and the handler
 *       has no read API).
 *
 * Run with: npx tsx server/tests/test-dec1-decision-engine.ts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { ATTENTION_RANK, isCritical, type AttentionLevel } from "../../shared/attention/index.js";
import {
  orderByAttention,
  clampWithCriticalExemption,
  clampLimit,
  dedupeById,
  DELIVERY_DEFAULT_LIMIT,
  DELIVERY_MAX_LIMIT,
  type EvidenceCitation,
} from "../../shared/attention/decision.js";
import {
  prioritizeOpportunities,
  type FoodOpportunity,
  type FoodOpportunityEvidence,
} from "../intelligence/food-intelligence/opportunity-engine.js";
import {
  prioritiseAndGroup,
  collectOpportunities,
  sealDeliveryDecision,
  learningRankFor,
  type DeliverableOpportunity,
  type OpportunityEvidence,
  type DeliveryDecisionInput,
  type ConfirmedUnderstandingFetch,
} from "../intelligence/opportunity-delivery/framework.js";
import { InMemoryOpportunityDeliveryStore } from "../intelligence/opportunity-delivery/delivery-store.js";
import { applySilenceRules, type Notice, type NoticeEvidence } from "../intelligence/conversation/notice-engine.js";
import { createOpportunityDeliveryHandler } from "../intelligence/handlers/opportunity-delivery-handler.js";
import type { OpportunityDeliveryReadPort } from "../intelligence/handlers/opportunity-delivery-read-port.js";
import { OBSERVATION_KINDS, setObservationStore, recordObservation } from "../intelligence/observation/observation-engine.js";
import { InMemoryObservationStore } from "../intelligence/observation/observation-contract.js";
import type { ConfirmedUnderstanding } from "../intelligence/evidence-learning/household-observation.js";
import type { IntentOutcome, IntentVerb, IntelligenceContext, Intent } from "../intelligence/types.js";

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
// Compile-time half of §1: the three retired evidence types ARE the canonical
// citation — assignability in both directions. If any of them ever diverges,
// these lines stop compiling.
// ---------------------------------------------------------------------------
const _citation: EvidenceCitation = { source: "s", detail: "d" };
const _food: FoodOpportunityEvidence = _citation;
const _od1: OpportunityEvidence = _food;
const _notice: NoticeEvidence = _od1;
const _back: EvidenceCitation = _notice;
void _back;

// ---------------------------------------------------------------------------
// Deterministic pseudo-random input generation (seeded LCG — no Math.random,
// so a failure is reproducible byte-for-byte).
// ---------------------------------------------------------------------------

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const LEVELS: readonly AttentionLevel[] = ["critical", "high", "medium", "low"];

// ---------------------------------------------------------------------------
// §2 ORACLES — the pre-DEC1 implementations, frozen verbatim from the
// snapshot branch `snapshot/dec1-pre-implementation-20260709`. Do not edit:
// their entire value is that they are exactly what shipped before DEC1.
// ---------------------------------------------------------------------------

const LEGACY_DEFAULT_LIMIT = 10;
const LEGACY_MAX_LIMIT = 30;

/** FI4 opportunity-engine.ts `prioritizeOpportunities`, pre-DEC1. */
function legacyPrioritizeOpportunities(
  opportunities: readonly FoodOpportunity[],
  limit: number = LEGACY_DEFAULT_LIMIT,
): FoodOpportunity[] {
  const clampedLimit = Math.min(Math.max(limit, 1), LEGACY_MAX_LIMIT);
  const sorted = opportunities
    .map((opportunity, index) => ({ opportunity, index }))
    .sort((a, b) => {
      const rankDiff = ATTENTION_RANK[a.opportunity.priority] - ATTENTION_RANK[b.opportunity.priority];
      if (rankDiff !== 0) return rankDiff;
      return a.index - b.index;
    })
    .map(({ opportunity }) => opportunity);
  const critical = sorted.filter((o) => isCritical(o.priority));
  const rest = sorted.filter((o) => !isCritical(o.priority)).slice(0, clampedLimit);
  return [...critical, ...rest];
}

/** OD1 framework.ts `prioritiseAndGroup`, pre-DEC1 (learningRankFor imported — it was not changed by DEC1). */
function legacyPrioritiseAndGroup(
  opportunities: readonly DeliverableOpportunity[],
  limit: number = LEGACY_DEFAULT_LIMIT,
  understanding: readonly ConfirmedUnderstanding[] = [],
  seen: ReadonlySet<string> = new Set<string>(),
): { opportunities: readonly DeliverableOpportunity[]; grouped: Readonly<Record<string, readonly DeliverableOpportunity[]>> } {
  const clampedLimit = Math.min(Math.max(limit, 1), LEGACY_MAX_LIMIT);
  const sorted = opportunities
    .map((opportunity, index) => ({
      opportunity,
      index,
      learning: learningRankFor(opportunity, understanding),
      seen: seen.has(opportunity.id) ? 1 : 0,
    }))
    .sort((a, b) => {
      const rankDiff = ATTENTION_RANK[a.opportunity.priority] - ATTENTION_RANK[b.opportunity.priority];
      if (rankDiff !== 0) return rankDiff;
      const learningDiff = a.learning - b.learning;
      if (learningDiff !== 0) return learningDiff;
      const seenDiff = a.seen - b.seen;
      if (seenDiff !== 0) return seenDiff;
      return a.index - b.index;
    })
    .map(({ opportunity }) => opportunity);
  const critical = sorted.filter((o) => isCritical(o.priority));
  const rest = sorted.filter((o) => !isCritical(o.priority)).slice(0, clampedLimit);
  const prioritised = [...critical, ...rest];

  const grouped: Record<string, DeliverableOpportunity[]> = {};
  for (const opportunity of prioritised) {
    (grouped[opportunity.domain] ??= []).push(opportunity);
  }
  return { opportunities: prioritised, grouped };
}

/** Notice Engine `applySilenceRules`, pre-DEC1. */
function legacyApplySilenceRules(notices: readonly Notice[], maxCount = 2): Notice[] {
  const seen = new Set<string>();
  const deduped = notices.filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
  return deduped
    .slice()
    .sort((a, b) => ATTENTION_RANK[a.priority] - ATTENTION_RANK[b.priority])
    .slice(0, maxCount);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeDeliverable(overrides: Partial<DeliverableOpportunity> = {}): DeliverableOpportunity {
  return {
    id: "food-intelligence:planner-empty-day:1",
    capabilityId: "food-intelligence",
    domain: "planner",
    type: "planner-empty-day",
    priority: "medium",
    explanation: "test",
    evidence: [{ source: "planner-week", detail: "test" }],
    suggestedAction: "test",
    surface: "planner",
    ...overrides,
  };
}

const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function sourceOf(relative: string): string {
  return readFileSync(path.resolve(SOURCE_ROOT, relative), "utf8");
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("§1 orderByAttention — the one canonical stable multi-key sort");
  // -------------------------------------------------------------------------
  const mixed = [
    { id: "a", priority: "low" as const },
    { id: "b", priority: "critical" as const },
    { id: "c", priority: "medium" as const },
    { id: "d", priority: "high" as const },
    { id: "e", priority: "high" as const },
  ];
  assert(
    orderByAttention(mixed).map((i) => i.id).join(",") === "b,d,e,c,a",
    "sorts critical → high → medium → low, stable within a tier (d before e)",
  );
  const input = [...mixed];
  orderByAttention(input);
  assert(input.map((i) => i.id).join(",") === "a,b,c,d,e", "never mutates its input");
  assert(
    orderByAttention(mixed, [(i) => (i.id === "e" ? -1 : 0)]).map((i) => i.id).join(",") === "b,e,d,c,a",
    "a tie-breaker reorders WITHIN a tier only — e overtakes d but no high overtakes the critical",
  );
  assert(
    orderByAttention(mixed, [(i) => (i.priority === "low" ? -99 : 0)]).map((i) => i.id)[0] === "b",
    "no tie-breaker weight can move an item across an attention tier (attention is always the first key)",
  );

  section("§1 clampWithCriticalExemption + clampLimit — the one budget clamp");
  const tenHighOneCritical = orderByAttention([
    ...Array.from({ length: 10 }, (_, i) => ({ id: `h${i}`, priority: "high" as const })),
    { id: "crit", priority: "critical" as const },
  ]);
  const clamped = clampWithCriticalExemption(tenHighOneCritical, 5);
  assert(
    clamped.length === 6 && clamped[0].id === "crit",
    "every critical is admitted before the limit applies to the remainder (A3)",
    String(clamped.length),
  );
  assert(clampLimit(0) === 1 && clampLimit(-7) === 1, "a degenerate limit clamps up to 1 — a delivery of nothing is never a decision the limit makes silently");
  assert(clampLimit(999) === DELIVERY_MAX_LIMIT, "a limit beyond MAX clamps down to the one canonical maximum");
  assert(
    DELIVERY_DEFAULT_LIMIT === 10 && DELIVERY_MAX_LIMIT === 30,
    "the delivery budget pair is exactly the pre-DEC1 values (10/30) — convergence changed the owner, not the budget",
  );

  section("§1 dedupeById — first occurrence wins");
  const dupes = [
    { id: "x", priority: "low" as const },
    { id: "y", priority: "high" as const },
    { id: "x", priority: "critical" as const },
  ];
  const deduped = dedupeById(dupes);
  assert(
    deduped.length === 2 && deduped[0].priority === "low",
    "the FIRST occurrence survives — a later duplicate cannot replace it (byte-identical to the Silence Rules' own dedupe)",
  );

  // -------------------------------------------------------------------------
  section("§2 GOLDEN IDENTITY — FI4 prioritizeOpportunities ≡ its frozen pre-DEC1 oracle");
  // -------------------------------------------------------------------------
  const rng = makeRng(0xdec1);
  const LIMITS = [-3, 0, 1, 2, 5, 9, 10, 11, 29, 30, 31, 100];
  let fi4Identical = 0;
  let fi4Cases = 0;
  for (let round = 0; round < 60; round += 1) {
    const size = Math.floor(rng() * 24);
    const items: FoodOpportunity[] = Array.from({ length: size }, (_, i) => {
      const priority = LEVELS[Math.floor(rng() * 4)];
      return {
        id: `${priority === "critical" ? "shopping-restriction-conflict" : "planner-empty-day"}:${i}`,
        type: priority === "critical" ? ("shopping-restriction-conflict" as const) : ("planner-empty-day" as const),
        owningDomain: priority === "critical" ? ("shopping" as const) : ("planner" as const),
        priority,
        explanation: "x",
        evidence: [{ source: "s", detail: "d" }],
        suggestedAction: "x",
        // PHASE5E — inert for the golden-identity sweep (the Decision Engine's ordering
        // never reads `subject`, which is exactly the property this section proves), but
        // required by the producer's type.
        subject: {
          entity: priority === "critical" ? ("shopping-item" as const) : ("planner-day" as const),
          id: i,
          label: "x",
        },
      };
    });
    for (const limit of LIMITS) {
      fi4Cases += 1;
      const now = JSON.stringify(prioritizeOpportunities(items, limit).map((o) => o.id));
      const before = JSON.stringify(legacyPrioritizeOpportunities(items, limit).map((o) => o.id));
      if (now === before) fi4Identical += 1;
    }
    // The default-limit path too (the signature's default changed name, not value).
    fi4Cases += 1;
    if (
      JSON.stringify(prioritizeOpportunities(items).map((o) => o.id)) ===
      JSON.stringify(legacyPrioritizeOpportunities(items).map((o) => o.id))
    ) {
      fi4Identical += 1;
    }
  }
  assert(
    fi4Identical === fi4Cases,
    `byte-identical ordering and clamping across ${fi4Cases} generated cases (all levels, criticals, degenerate→beyond-MAX limits)`,
    `${fi4Identical}/${fi4Cases}`,
  );

  section("§2 GOLDEN IDENTITY — OD1 prioritiseAndGroup ≡ its frozen pre-DEC1 oracle");
  const DOMAINS = ["planner", "pantry", "shopping"] as const;
  const TYPES = ["planner-empty-day", "pantry-item-unused-in-plan", "shopping-restriction-conflict"] as const;
  let od1Identical = 0;
  let od1Cases = 0;
  for (let round = 0; round < 60; round += 1) {
    const size = Math.floor(rng() * 24);
    const items: DeliverableOpportunity[] = Array.from({ length: size }, (_, i) => {
      const critical = rng() < 0.15;
      const domainIndex = Math.floor(rng() * 3);
      return makeDeliverable({
        id: `food-intelligence:${TYPES[critical ? 2 : domainIndex]}:${i}`,
        domain: DOMAINS[critical ? 2 : domainIndex],
        type: TYPES[critical ? 2 : domainIndex],
        priority: critical ? "critical" : LEVELS[1 + Math.floor(rng() * 3)],
      });
    });
    // Learning: a random subset of (domain × type) dimensions confirmed either way.
    const understanding: ConfirmedUnderstanding[] = [];
    for (let d = 0; d < 3; d += 1) {
      if (rng() < 0.4) {
        understanding.push({
          subjectType: "opportunity",
          domain: DOMAINS[d],
          subjectKey: TYPES[d],
          direction: rng() < 0.5 ? "positive" : "negative",
          rationale: "r",
        } as unknown as ConfirmedUnderstanding);
      }
    }
    // Seen: a random subset of ids acknowledged.
    const seen = new Set(items.filter(() => rng() < 0.3).map((o) => o.id));
    for (const limit of LIMITS) {
      od1Cases += 1;
      const now = prioritiseAndGroup(items, limit, understanding, seen);
      const before = legacyPrioritiseAndGroup(items, limit, understanding, seen);
      if (
        JSON.stringify(now.opportunities.map((o) => o.id)) === JSON.stringify(before.opportunities.map((o) => o.id)) &&
        JSON.stringify(now.grouped) === JSON.stringify(before.grouped)
      ) {
        od1Identical += 1;
      }
    }
  }
  assert(
    od1Identical === od1Cases,
    `byte-identical ordering, clamping AND grouping across ${od1Cases} generated cases (learning ranks, seen sets, criticals, all limits)`,
    `${od1Identical}/${od1Cases}`,
  );

  section("§2 GOLDEN IDENTITY — Notice Engine applySilenceRules ≡ its frozen pre-DEC1 oracle");
  let noticeIdentical = 0;
  let noticeCases = 0;
  const CATEGORIES: readonly Notice["category"][] = ["planner-gap", "pantry-opportunity", "shopping-opportunity", "streak-milestone"];
  for (let round = 0; round < 120; round += 1) {
    const size = Math.floor(rng() * 12);
    const notices: Notice[] = Array.from({ length: size }, (_, i) => ({
      // Deliberate duplicate ids (~1 in 3) so the dedupe path is exercised.
      id: `n${Math.floor(rng() * Math.max(1, size * 0.7))}`,
      category: CATEGORIES[Math.floor(rng() * CATEGORIES.length)],
      priority: LEVELS[Math.floor(rng() * 4)],
      source: "opportunity-delivery",
      fact: { kind: "opportunity", explanation: `e${i}`, suggestedAction: "a", evidence: [{ source: "s", detail: "d" }] },
    }));
    for (const cap of [1, 2, 3, 5]) {
      noticeCases += 1;
      const now = JSON.stringify(applySilenceRules(notices, cap).map((n) => `${n.id}:${n.fact.kind === "opportunity" ? n.fact.explanation : ""}`));
      const before = JSON.stringify(legacyApplySilenceRules(notices, cap).map((n) => `${n.id}:${n.fact.kind === "opportunity" ? n.fact.explanation : ""}`));
      if (now === before) noticeIdentical += 1;
    }
  }
  assert(
    noticeIdentical === noticeCases,
    `byte-identical dedupe, ordering and cap across ${noticeCases} generated cases (duplicate ids, all levels, caps 1–5)`,
    `${noticeIdentical}/${noticeCases}`,
  );
  assert(
    applySilenceRules([
      { id: "c1", category: "shopping-opportunity", priority: "critical", source: "s", fact: { kind: "seasonal", headline: "x" } },
      { id: "c2", category: "shopping-opportunity", priority: "critical", source: "s", fact: { kind: "seasonal", headline: "y" } },
      { id: "h1", category: "planner-gap", priority: "high", source: "s", fact: { kind: "seasonal", headline: "z" } },
    ]).length === 2,
    "the notice cap carries NO critical exemption — deliberately: it is the Silence Rules' own presentation-edge budget (INT20), not the delivery budget",
  );

  // -------------------------------------------------------------------------
  section("§3 Retirement (Principle 8) — no local copy of the mechanics survives");
  // -------------------------------------------------------------------------
  const fi4Source = sourceOf("intelligence/food-intelligence/opportunity-engine.ts");
  const od1Source = sourceOf("intelligence/opportunity-delivery/framework.ts");
  const noticeSource = sourceOf("intelligence/conversation/notice-engine.ts");
  const consumers: Array<[string, string]> = [
    ["opportunity-engine.ts", fi4Source],
    ["framework.ts", od1Source],
    ["notice-engine.ts", noticeSource],
  ];
  for (const [name, source] of consumers) {
    assert(!source.includes("Math.min(Math.max("), `${name} declares no local limit clamp`);
    assert(!source.includes("ATTENTION_RANK["), `${name} declares no local attention sort (no direct rank indexing)`);
    assert(source.includes("shared/attention/decision.js"), `${name} imports the one canonical mechanics module`);
  }
  assert(
    !fi4Source.includes("interface FoodOpportunityEvidence") &&
      !od1Source.includes("interface OpportunityEvidence") &&
      !noticeSource.includes("interface NoticeEvidence"),
    "the three local {source, detail} evidence interfaces are retired — each name survives only as an alias of EvidenceCitation",
  );
  assert(
    !fi4Source.includes("_OPPORTUNITY_LIMIT =") && !/\bconst (DEFAULT|MAX)_LIMIT =/.test(od1Source),
    "the byte-identical clamp constant pairs are retired from both former owners",
  );

  // -------------------------------------------------------------------------
  section("§4 Boundaries (DEC1 D5) — what the Decision Engine must never absorb");
  // -------------------------------------------------------------------------
  const decisionSource = sourceOf("../shared/attention/decision.ts");
  assert(
    !/import .*(meal-scoring|smart-suggest|comparison-engine|household-meal-matcher|substitution-rules|recipe-swap)/.test(od1Source + decisionSource),
    "no domain Selection engine is imported — the Decision Engine orders producer output; it never ranks meals, compares products, or picks swaps",
  );
  assert(
    !/import .*knowledge\/evidence/.test(od1Source + decisionSource),
    "the evidence gate is never imported — it runs UPSTREAM; the engine orders only what the gate admitted and can never launder confidence (A5)",
  );
  assert(
    !/import .*permissions/.test(od1Source + decisionSource),
    "permissions/ConfirmationTier are never imported — a decision to surface never changes what may be acted on (A7)",
  );
  assert(
    !/import .*(behaviour-engine|personality-registry)/.test(od1Source + decisionSource),
    "the Behaviour Engine is never imported — voice is a downstream seam (INT21), untouched",
  );
  assert(
    !/import .*pattern-intent-resolver/.test(od1Source + decisionSource),
    "the intent resolver is never imported — routing confidence is a different decision family",
  );

  // -------------------------------------------------------------------------
  section("§5 sealDeliveryDecision — pure, deterministic, reproducible (BEH1 discipline)");
  // -------------------------------------------------------------------------
  const sealInput: DeliveryDecisionInput = {
    producers: [{ capabilityId: "food-intelligence", offered: 7 }],
    collected: 7,
    suppressedByMute: 1,
    suppressedByLifecycle: 2,
    suppressedByBudget: 1,
    requestedLimit: 3,
    criticalDelivered: 1,
    delivered: 4,
    newlyPersisted: 2,
    acknowledgedDelivered: 1,
    learning: { confirmedUnderstandingCount: 2, influenced: ["food-intelligence:planner-empty-day:1"] },
  };
  const sealedA = sealDeliveryDecision(sealInput);
  const sealedB = sealDeliveryDecision({ ...sealInput });
  assert(JSON.stringify(sealedA) === JSON.stringify(sealedB), "same inputs seal to the same decision, including the same reasoning sentences in the same order");
  assert(sealedA.appliedLimit === 3, "appliedLimit is the one canonical clamp of requestedLimit");
  assert(
    sealedA.orderingBasis.join("→") === "attention→learning→seen→arrival",
    "the ordering basis is stated exactly as prioritiseAndGroup applies it",
  );
  assert(
    sealedA.reasoning.length === 6 && sealedA.reasoning.every((s) => typeof s === "string" && s.length > 0),
    "the reasoning trail accounts for every stage: collection, mute, lifecycle, learning, budget, delivery",
    String(sealedA.reasoning.length),
  );
  assert(
    sealDeliveryDecision({ ...sealInput, requestedLimit: 999 }).appliedLimit === DELIVERY_MAX_LIMIT &&
      sealDeliveryDecision({ ...sealInput, requestedLimit: 999 }).reasoning.some((s) => s.includes("requested 999, clamped")),
    "a clamped limit is disclosed in the reasoning, never silently normalised",
  );
  const emptySeal = sealDeliveryDecision({
    ...sealInput,
    producers: [],
    collected: 0,
    suppressedByMute: 0,
    suppressedByLifecycle: 0,
    suppressedByBudget: 0,
    criticalDelivered: 0,
    delivered: 0,
    newlyPersisted: 0,
    acknowledgedDelivered: 0,
    learning: { confirmedUnderstandingCount: 0, influenced: [] },
  });
  assert(
    emptySeal.reasoning.length === 1 && emptySeal.reasoning[0].includes("honestly empty"),
    "the no-producer moment seals an honest statement, not an absence",
  );

  section("§5 The accounting matches what collectOpportunities actually did");
  const store = new InMemoryOpportunityDeliveryStore();
  const userId = 42;
  store.setMutedOpportunityTypes(userId, ["pantry-item-unused-in-plan"]);
  const producerItems = [
    // 1 critical (budget-exempt), 3 high (limit 2 will cut one), 1 muted-type low, 1 to pre-dismiss.
    { id: "shopping-restriction-conflict:1", type: "shopping-restriction-conflict", owningDomain: "shopping", priority: "critical", explanation: "x", evidence: [{ source: "s", detail: "d" }], suggestedAction: "x" },
    { id: "planner-empty-day:1", type: "planner-empty-day", owningDomain: "planner", priority: "high", explanation: "x", evidence: [{ source: "s", detail: "d" }], suggestedAction: "x" },
    { id: "planner-empty-day:2", type: "planner-empty-day", owningDomain: "planner", priority: "high", explanation: "x", evidence: [{ source: "s", detail: "d" }], suggestedAction: "x" },
    { id: "planner-empty-day:3", type: "planner-empty-day", owningDomain: "planner", priority: "high", explanation: "x", evidence: [{ source: "s", detail: "d" }], suggestedAction: "x" },
    { id: "pantry-item-unused-in-plan:1", type: "pantry-item-unused-in-plan", owningDomain: "pantry", priority: "low", explanation: "x", evidence: [{ source: "s", detail: "d" }], suggestedAction: "x" },
    { id: "planner-empty-day:4", type: "planner-empty-day", owningDomain: "planner", priority: "medium", explanation: "x", evidence: [{ source: "s", detail: "d" }], suggestedAction: "x" },
  ];
  const fetchProducer = async (capabilityId: string, verb: IntentVerb, _context: IntelligenceContext): Promise<IntentOutcome> => ({
    status: "ok",
    capabilityId,
    verb,
    message: "ok",
    result: { opportunities: producerItems },
  });
  const noUnderstanding: ConfirmedUnderstandingFetch = async () => [];
  // Pre-dismiss one high so the lifecycle suppression path is real.
  await collectOpportunities({ userId, limit: 30 }, { store, fetchProducer, fetchConfirmedUnderstanding: noUnderstanding });
  const { resolveOpportunity } = await import("../intelligence/opportunity-delivery/framework.js");
  await resolveOpportunity(userId, "food-intelligence:planner-empty-day:3", "dismissed", store, async () => ({}) as never);

  const bundle = await collectOpportunities({ userId, limit: 2 }, { store, fetchProducer, fetchConfirmedUnderstanding: noUnderstanding });
  const decision = bundle.decision;
  assert(decision !== undefined, "every delivery moment carries a sealed decision");
  if (decision) {
    assert(
      decision.producers.length === 1 && decision.producers[0].offered === 6 && decision.collected === 6,
      "per-producer accounting matches what the producer offered",
      JSON.stringify(decision.producers),
    );
    assert(decision.suppressedByMute === 1, "one opportunity suppressed by the household's own muted type", String(decision.suppressedByMute));
    assert(decision.suppressedByLifecycle === 1, "one opportunity suppressed as terminally resolved", String(decision.suppressedByLifecycle));
    assert(
      decision.suppressedByBudget === 1 && decision.appliedLimit === 2,
      "one eligible opportunity fell below the budget cut (limit 2 over: 2 high + 1 medium)",
      `budget=${decision.suppressedByBudget} applied=${decision.appliedLimit}`,
    );
    assert(
      decision.criticalDelivered === 1 && decision.delivered === 3 && bundle.opportunities.length === 3,
      "the critical rode the A3 exemption outside the budget: 1 critical + 2 within limit",
      `delivered=${decision.delivered}`,
    );
    assert(
      decision.delivered ===
        decision.collected - decision.suppressedByMute - decision.suppressedByLifecycle - decision.suppressedByBudget,
      "the suppression arithmetic is complete — every non-delivered opportunity is accounted to exactly one rule",
    );
    assert(decision.newlyPersisted === 0, "nothing re-persisted on a repeat delivery (rows already exist)");
  }

  section("§5 The handler records the decision once and never puts it on the wire");
  const observations = new InMemoryObservationStore();
  setObservationStore(observations);
  const fakePort: OpportunityDeliveryReadPort = {
    collectOpportunities: (request) =>
      collectOpportunities(request, { store, fetchProducer, fetchConfirmedUnderstanding: noUnderstanding }),
    resolveOpportunity: async () => null,
  };
  const handler = createOpportunityDeliveryHandler(async () => fakePort);
  const intent: Intent = { verb: "report", capabilityId: "opportunity-delivery", parameters: { limit: 2 } };
  const result = (await handler(intent, { role: "user", userId: String(userId) })) as Record<string, unknown>;
  // recordObservation is fire-and-forget — let its promise chain settle.
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  const recorded = observations.all().filter((o) => o.kind === "delivery-decision");
  assert(recorded.length === 1, "exactly ONE delivery-decision observation per report call", String(recorded.length));
  const meta = (recorded[0]?.metadata ?? {}) as Record<string, unknown>;
  assert(
    Array.isArray(meta.reasoning) && (meta.reasoning as unknown[]).length === 6 && recorded[0]?.outcome === "delivered",
    "the observation carries the full sealed record — counts, rules, reasoning — under outcome 'delivered'",
  );
  assert(
    !("decision" in result) && !("reasoning" in result) &&
      JSON.stringify(Object.keys(result).sort()) === JSON.stringify(["grouped", "opportunities", "source", "trust"]),
    "the wire result is byte-compatible with pre-DEC1: opportunities/grouped/trust/source only — the record is operator-facing telemetry, never user-facing content",
    Object.keys(result).join(","),
  );
  setObservationStore(null);

  section("§5 Nothing reads it back (the BEH1 non-negotiable)");
  assert(
    OBSERVATION_KINDS.includes("delivery-decision"),
    "delivery-decision is a first-class member of the closed observation taxonomy",
  );
  assert(
    !/import .*observation/.test(od1Source),
    "the Decision Engine never imports the Observation Engine — it seals; the capability handler records",
  );
  const handlerSource = sourceOf("intelligence/handlers/opportunity-delivery-handler.ts");
  assert(
    handlerSource.includes("recordObservation") &&
      !/listSince|summarize|getObservations/.test(handlerSource),
    "the handler records and has no read API — the record can influence nothing (telemetry is never an input to behaviour)",
  );
  void recordObservation; // imported to prove the seam exists; the assertion above is the source-scan

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`DEC1 Canonical Decision Engine: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
