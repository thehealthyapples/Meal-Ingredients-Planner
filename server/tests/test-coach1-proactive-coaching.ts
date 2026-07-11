/**
 * test-coach1-proactive-coaching.ts — COACH1 Proactive Coaching
 * ============================================================================
 * COACH1 adds no engine, no store, no capability, no verb and no migration. It
 * makes the platform's ALREADY-EXISTING proactive intelligence reachable,
 * evidence-backed, explainable and non-intrusive. This suite asserts exactly that,
 * and asserts the four things COACH1 must never have done.
 *
 * Coverage:
 *   §1  matchConfirmedUnderstanding / learningRankFor — LEARN1's semantics, intact
 *   §2  withLearningEvidence — household-pattern explainability (ET6), never authored
 *   §3  seenOpportunityIds — "seen" is `acknowledged`, and never `delivered`
 *   §4  prioritiseAndGroup — the seen key: below priority, below learning, above arrival
 *   §5  collectOpportunities — end-to-end: coaching is non-intrusive and self-explaining
 *   §6  noticeOpportunities — evidence carried verbatim; Rule E1 ("no citation, no card")
 *   §7  The Silence Rules and the notability gates — COACH1 moved no threshold
 *   §8  Structural — one proactive channel, no reasoning added, no second private path
 *
 * Every assertion is database-free.
 *
 * Run with: npx tsx server/tests/test-coach1-proactive-coaching.ts
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  collectOpportunities,
  prioritiseAndGroup,
  learningRankFor,
  matchConfirmedUnderstanding,
  withLearningEvidence,
  seenOpportunityIds,
  HOUSEHOLD_LEARNING_EVIDENCE_SOURCE,
  ACKNOWLEDGED_STATUS,
  type DeliverableOpportunity,
  type ExistingDeliveryRecord,
  type ConfirmedUnderstandingFetch,
  type OpportunityOutcomeReporter,
  type ProducerFetch,
} from "../intelligence/opportunity-delivery/framework.js";
import { InMemoryOpportunityDeliveryStore } from "../intelligence/opportunity-delivery/delivery-store.js";
import type { ConfirmedUnderstanding } from "../intelligence/evidence-learning/household-observation.js";
import {
  noticeOpportunities,
  noticeDiversity,
  noticeStreak,
  noticeSeasonal,
  applySilenceRules,
  MAX_NOTICES_PER_MOMENT,
  NOTICE_SOURCE,
  type OpportunityLike,
} from "../intelligence/conversation/notice-engine.js";
import type { IntentOutcome, IntentVerb, IntelligenceContext } from "../intelligence/types.js";

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
// Fixtures
// ---------------------------------------------------------------------------

function makeOpportunity(overrides: Partial<DeliverableOpportunity> = {}): DeliverableOpportunity {
  return {
    id: "food-intelligence:planner-empty-day:1",
    capabilityId: "food-intelligence",
    domain: "planner",
    type: "planner-empty-day",
    priority: "medium",
    explanation: "Wednesday has no meals planned yet.",
    evidence: [{ source: "planner-week", detail: "Week 3 has 1 of 7 day(s) with zero planner entries." }],
    suggestedAction: "Add a meal to Wednesday.",
    surface: "planner",
    ...overrides,
  };
}

function makeUnderstanding(overrides: Partial<ConfirmedUnderstanding> = {}): ConfirmedUnderstanding {
  return {
    domain: "planner",
    subjectType: "opportunity",
    subjectKey: "planner-empty-day",
    direction: "negative",
    confidence: "low",
    evidenceCount: 3,
    rationale: '3 of 3 recent outcomes for opportunity "planner-empty-day" were negative (planner).',
    ...overrides,
  };
}

const noUnderstanding: ConfirmedUnderstandingFetch = async () => [];
const noReporter: OpportunityOutcomeReporter = async () => ({ recorded: true });

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  // §1 — LEARN1's matching semantics, preserved verbatim by COACH1's refactor
  // -------------------------------------------------------------------------
  section("§1 matchConfirmedUnderstanding / learningRankFor — LEARN1's semantics intact");

  const negative = makeUnderstanding();
  const positive = makeUnderstanding({ direction: "positive", subjectKey: "pantry-item-unused-in-plan", domain: "pantry" });
  const both = [negative, positive];

  assert(matchConfirmedUnderstanding({ domain: "planner", type: "planner-empty-day" }, both) === negative, "matches on domain + type + subjectType");
  assert(matchConfirmedUnderstanding({ domain: "pantry", type: "pantry-item-unused-in-plan" }, both) === positive, "matches the second dimension independently");
  assert(matchConfirmedUnderstanding({ domain: "shopping", type: "planner-empty-day" }, both) === undefined, "a domain mismatch is a different subject, never coerced into a match");
  assert(matchConfirmedUnderstanding({ domain: "planner", type: "something-else" }, both) === undefined, "a type mismatch is a different subject");
  assert(
    matchConfirmedUnderstanding({ domain: "planner", type: "planner-empty-day" }, [makeUnderstanding({ subjectType: "meal" })]) === undefined,
    "a non-opportunity subjectType never matches an opportunity",
  );

  assert(learningRankFor({ domain: "planner", type: "planner-empty-day" }, both) === 1, "a confirmed negative demotes (+1)");
  assert(learningRankFor({ domain: "pantry", type: "pantry-item-unused-in-plan" }, both) === -1, "a confirmed positive promotes (-1)");
  assert(learningRankFor({ domain: "planner", type: "planner-empty-day" }, []) === 0, "nothing confirmed → rank 0, the honest gap and the common case");

  // -------------------------------------------------------------------------
  // §2 — withLearningEvidence: the household's pattern explains itself (ET6)
  // -------------------------------------------------------------------------
  section("§2 withLearningEvidence — household-pattern explainability, never authorship");

  const plain = makeOpportunity();

  assert(withLearningEvidence(plain, []) === plain, "no confirmed understanding → the SAME object, by identity (byte-for-byte pre-COACH1)");
  assert(
    withLearningEvidence(plain, [makeUnderstanding({ domain: "shopping" })]) === plain,
    "an unrelated confirmed understanding → the same object, untouched",
  );

  const explained = withLearningEvidence(plain, [negative]);
  assert(explained !== plain, "a matching confirmed understanding produces a new object (the input is never mutated)");
  assert(explained.evidence.length === plain.evidence.length + 1, "exactly ONE evidence entry is appended — never two, never a replacement");
  assert(explained.evidence[0] === plain.evidence[0], "the producer's own evidence is preserved verbatim, in order, as the prefix");

  const appended = explained.evidence[explained.evidence.length - 1]!;
  assert(appended.source === HOUSEHOLD_LEARNING_EVIDENCE_SOURCE, "the appended entry is attributed to `household-learning`, not to the producer");
  assert(appended.detail === negative.rationale, "the detail is EL1's rationale, copied verbatim — never reworded, never re-derived");

  assert(
    explained.explanation === plain.explanation &&
      explained.suggestedAction === plain.suggestedAction &&
      explained.priority === plain.priority &&
      explained.id === plain.id &&
      explained.type === plain.type &&
      explained.domain === plain.domain,
    "explanation, suggestedAction, priority, id, type and domain are all untouched — OD1 still authors no producer content",
  );

  // NK2 Rule P1 / EL2 §8 gate 3: learning re-weights and explains. It never authors.
  assert(plain.evidence.length === 1, "the original opportunity is not mutated in place");

  // -------------------------------------------------------------------------
  // §3 — "seen" is `acknowledged`, and deliberately never `delivered`
  // -------------------------------------------------------------------------
  section("§3 seenOpportunityIds — `acknowledged` is seen; `delivered` is not");

  assert(ACKNOWLEDGED_STATUS === "acknowledged", "the seen status is exactly `acknowledged`");

  const records = new Map<string, ExistingDeliveryRecord>([
    ["ack", { status: "acknowledged" }],
    ["del", { status: "delivered" }],
    ["dis", { status: "dismissed" }],
    ["acc", { status: "accepted" }],
  ]);
  const seen = seenOpportunityIds(records);
  assert(seen.has("ack"), "an acknowledged opportunity is seen");
  assert(
    !seen.has("del"),
    "a merely DELIVERED opportunity is NOT seen — collectOpportunities returns up to 10, the Silence Rules show 2; delivery is not sight",
  );
  assert(!seen.has("dis") && !seen.has("acc"), "terminal records are suppressed upstream and never counted as seen here");
  assert(seenOpportunityIds(new Map()).size === 0, "no records → nothing seen (the state every household starts in)");

  // -------------------------------------------------------------------------
  // §4 — the seen key sits below priority, below learning, above arrival order
  // -------------------------------------------------------------------------
  section("§4 prioritiseAndGroup — the `seen` sort key, and what it can never do");

  const a = makeOpportunity({ id: "a", type: "t-a", priority: "medium" });
  const b = makeOpportunity({ id: "b", type: "t-b", priority: "medium" });
  const c = makeOpportunity({ id: "c", type: "t-c", priority: "medium" });
  const trio = [a, b, c];

  assert(
    prioritiseAndGroup(trio).opportunities.map((o) => o.id).join(",") === "a,b,c",
    "nothing confirmed, nothing seen → arrival order, exactly as before COACH1 and before LEARN1",
  );

  const seenA = new Set(["a"]);
  assert(
    prioritiseAndGroup(trio, 10, [], seenA).opportunities.map((o) => o.id).join(",") === "b,c,a",
    "an acknowledged opportunity yields its place to ones the household has never been shown",
    prioritiseAndGroup(trio, 10, [], seenA).opportunities.map((o) => o.id).join(","),
  );

  // Priority dominates novelty — an acknowledged safety opportunity still leads.
  const safety = makeOpportunity({ id: "safety", domain: "shopping", type: "shopping-restriction-conflict", priority: "high" });
  const trivia = makeOpportunity({ id: "trivia", domain: "pantry", type: "pantry-item-unused-in-plan", priority: "low" });
  assert(
    prioritiseAndGroup([trivia, safety], 10, [], new Set(["safety"])).opportunities[0]!.id === "safety",
    "novelty can NEVER cross a priority tier — an acknowledged `high` still outranks an unseen `low`",
  );

  // Learning dominates novelty — a confirmed dislike sinks even when unseen.
  const dislikedUnseen = makeOpportunity({ id: "disliked", type: "planner-empty-day", priority: "medium" });
  const neutralSeen = makeOpportunity({ id: "neutral", type: "t-neutral", priority: "medium" });
  const ordered = prioritiseAndGroup([dislikedUnseen, neutralSeen], 10, [negative], new Set(["neutral"])).opportunities;
  assert(
    ordered.map((o) => o.id).join(",") === "neutral,disliked",
    '"this household confirmed it does not want this" outranks "this household has not seen this yet"',
    ordered.map((o) => o.id).join(","),
  );

  // The set is never changed — only its order.
  const before = prioritiseAndGroup(trio, 10, [], new Set()).opportunities.map((o) => o.id).sort().join(",");
  const after = prioritiseAndGroup(trio, 10, [negative], seenA).opportunities.map((o) => o.id).sort().join(",");
  assert(before === after, "re-weighting changes order, never the set: same ids, same count");

  // -------------------------------------------------------------------------
  // §5 — end to end: non-intrusive AND self-explaining
  // -------------------------------------------------------------------------
  section("§5 collectOpportunities — coaching that is non-intrusive and explains itself");

  function producerWith(raw: readonly Record<string, unknown>[]): ProducerFetch {
    return async (capabilityId: string, verb: IntentVerb, _context: IntelligenceContext): Promise<IntentOutcome> => ({
      status: "ok",
      capabilityId,
      verb,
      message: "ok",
      result: { opportunities: raw, trust: { householdAware: true }, source: "food-opportunity-engine" },
    });
  }

  const threeMedium = producerWith([
    { id: "e1", type: "planner-empty-day", owningDomain: "planner", priority: "medium", explanation: "Mon empty.", evidence: [{ source: "planner-week", detail: "d" }], suggestedAction: "Add a meal to Monday." },
    { id: "e2", type: "planner-empty-day", owningDomain: "planner", priority: "medium", explanation: "Tue empty.", evidence: [{ source: "planner-week", detail: "d" }], suggestedAction: "Add a meal to Tuesday." },
    { id: "e3", type: "planner-empty-day", owningDomain: "planner", priority: "medium", explanation: "Wed empty.", evidence: [{ source: "planner-week", detail: "d" }], suggestedAction: "Add a meal to Wednesday." },
  ]);

  {
    const store = new InMemoryOpportunityDeliveryStore();
    const deps = { store, fetchProducer: threeMedium, fetchConfirmedUnderstanding: noUnderstanding };

    const first = await collectOpportunities({ userId: 1 }, deps);
    assert(
      first.opportunities.map((o) => o.id).join(",") === "food-intelligence:e1,food-intelligence:e2,food-intelligence:e3",
      "first report: arrival order, nothing seen",
    );

    // The household acknowledges the first card. It should not lead the next moment.
    await store.updateStatus(1, "food-intelligence:e1", "acknowledged");

    const second = await collectOpportunities({ userId: 1 }, deps);
    assert(
      second.opportunities.map((o) => o.id).join(",") === "food-intelligence:e2,food-intelligence:e3,food-intelligence:e1",
      "after acknowledgement the seen card sinks within its tier — the household is shown something new",
      second.opportunities.map((o) => o.id).join(","),
    );
    assert(second.opportunities.length === 3, "the acknowledged opportunity is re-ordered, never removed — only `mutedOpportunityTypes` and dismissal can remove");
  }

  {
    // Household learning: a confirmed pattern attaches its own rationale, and only there.
    const store = new InMemoryOpportunityDeliveryStore();
    const twoDomains = producerWith([
      { id: "p1", type: "planner-empty-day", owningDomain: "planner", priority: "high", explanation: "Mon empty.", evidence: [{ source: "planner-week", detail: "d" }], suggestedAction: "Add a meal." },
      { id: "q1", type: "pantry-item-unused-in-plan", owningDomain: "pantry", priority: "high", explanation: "Kale unused.", evidence: [{ source: "pantry-items", detail: "d" }], suggestedAction: "Plan a meal with kale." },
    ]);
    const confirmed: ConfirmedUnderstandingFetch = async () => [negative];

    const bundle = await collectOpportunities({ userId: 2 }, { store, fetchProducer: twoDomains, fetchConfirmedUnderstanding: confirmed });

    const planner = bundle.opportunities.find((o) => o.domain === "planner")!;
    const pantry = bundle.opportunities.find((o) => o.domain === "pantry")!;

    assert(
      planner.evidence.some((e) => e.source === HOUSEHOLD_LEARNING_EVIDENCE_SOURCE && e.detail === negative.rationale),
      "the influenced opportunity carries the household's own confirmed rationale as evidence",
    );
    assert(
      !pantry.evidence.some((e) => e.source === HOUSEHOLD_LEARNING_EVIDENCE_SOURCE),
      "an opportunity the household has confirmed nothing about carries NO learning evidence — no fabricated influence",
    );
    assert(planner.evidence[0]!.source === "planner-week", "the producer's evidence stays first; the learning entry is appended, never prepended or substituted");
    assert(bundle.metadata.learning.influenced.includes(planner.id), "metadata.learning still names the moved id (LEARN1's audit record, unchanged)");
    assert(bundle.metadata.learning.confirmedUnderstandingCount === 1, "metadata.learning counts the household's confirmed understandings");

    // The grouped view and the flat list must carry the SAME, explained objects.
    assert(bundle.grouped["planner"]![0] === planner, "grouped view carries the identical explained object, not an unexplained copy");
  }

  {
    // Honest degrade: an unreachable evidence store explains nothing and reorders nothing.
    const store = new InMemoryOpportunityDeliveryStore();
    const exploding: ConfirmedUnderstandingFetch = async () => {
      throw new Error("evidence store offline");
    };
    const bundle = await collectOpportunities({ userId: 3 }, { store, fetchProducer: threeMedium, fetchConfirmedUnderstanding: exploding });
    assert(bundle.opportunities.length === 3, "an unreachable evidence store still delivers every opportunity");
    assert(
      bundle.opportunities.every((o) => !o.evidence.some((e) => e.source === HOUSEHOLD_LEARNING_EVIDENCE_SOURCE)),
      "an unreachable evidence store attaches no learning evidence — silence, never a guessed rationale",
    );
    assert(bundle.metadata.learning.influenced.length === 0, "nothing claimed as influenced when nothing could be read");
  }

  void noReporter; // resolveOpportunity's reporter seam is LEARN1's; COACH1 does not touch it.

  // -------------------------------------------------------------------------
  // §6 — the notice carries the evidence, and refuses to speak without it
  // -------------------------------------------------------------------------
  section("§6 noticeOpportunities — evidence carried verbatim; no citation, no card");

  {
    const withLearning: OpportunityLike[] = [
      {
        id: "food-intelligence:p1",
        domain: "planner",
        priority: "high",
        explanation: "Mon empty.",
        suggestedAction: "Add a meal.",
        evidence: [
          { source: "planner-week", detail: "Week 3 has 1 of 7 day(s) with zero planner entries." },
          { source: HOUSEHOLD_LEARNING_EVIDENCE_SOURCE, detail: negative.rationale },
        ],
      },
    ];
    const [notice] = noticeOpportunities(withLearning);
    assert(notice !== undefined && notice.fact.kind === "opportunity", "a cited opportunity becomes exactly one opportunity notice");

    if (notice && notice.fact.kind === "opportunity") {
      assert(notice.fact.evidence.length === 2, "both evidence entries reach the coaching surface");
      assert(notice.fact.evidence[0]!.source === "planner-week", "producer evidence first, in order");
      assert(
        notice.fact.evidence[1]!.source === HOUSEHOLD_LEARNING_EVIDENCE_SOURCE && notice.fact.evidence[1]!.detail === negative.rationale,
        "THE COACH1 CHAIN: confirmed household pattern → opportunity evidence → the notice a household actually reads",
      );
      assert(notice.fact.explanation === "Mon empty." && notice.fact.suggestedAction === "Add a meal.", "explanation and suggestedAction still verbatim — the engine rewords nothing");
    }
    assert(notice?.source === NOTICE_SOURCE.opportunityDelivery, "the notice names its owning capability");
  }

  assert(
    noticeOpportunities([{ id: "x", domain: "planner", priority: "high", explanation: "e", suggestedAction: "a" }]).length === 0,
    "Rule E1 — an opportunity with no evidence never becomes a coaching notice",
  );
  assert(
    noticeOpportunities([{ id: "x", domain: "planner", priority: "high", explanation: "e", suggestedAction: "a", evidence: [] }]).length === 0,
    "Rule E1 — an empty evidence array is no citation at all",
  );
  assert(
    noticeOpportunities([{ id: "x", domain: "future-domain", priority: "high", explanation: "e", suggestedAction: "a", evidence: [{ source: "s", detail: "d" }] }]).length === 0,
    "an unmapped domain is still dropped honestly, never guessed into a category",
  );

  // Every producer names an existing owner.
  assert(noticeDiversity(20)[0]?.source === NOTICE_SOURCE.nutritionCentre, "the plant-diversity notice names the nutrition centre as its owner");
  assert(noticeSeasonal("Autumn brings pumpkin.")[0]?.source === NOTICE_SOURCE.seasonalStories, "the seasonal notice names the seasonal stories engine");
  assert(
    noticeStreak({ currentEliteStreak: 14, bestEliteStreak: 20 } as never)[0]?.source === NOTICE_SOURCE.streak,
    "the streak notice names the streak table",
  );

  // -------------------------------------------------------------------------
  // §7 — COACH1 raised no cap and moved no notability threshold
  // -------------------------------------------------------------------------
  section("§7 The Silence Rules — COACH1 moved no threshold and raised no cap");

  assert(MAX_NOTICES_PER_MOMENT === 2, "the attention budget is still 2 notices per moment");
  assert(noticeDiversity(7).length === 0 && noticeDiversity(20).length === 1, "the diversity notability gate (×10) is unchanged");
  assert(noticeDiversity(0).length === 0, "zero plant diversity is silence, not a notice");

  {
    const cited = [{ source: "planner-week", detail: "d" }];
    const many = noticeOpportunities([
      { id: "1", domain: "pantry", priority: "low", explanation: "e", suggestedAction: "a", evidence: cited },
      { id: "2", domain: "planner", priority: "high", explanation: "e", suggestedAction: "a", evidence: cited },
      { id: "3", domain: "shopping", priority: "medium", explanation: "e", suggestedAction: "a", evidence: cited },
    ]);
    const surfaced = applySilenceRules(many);
    assert(surfaced.length === MAX_NOTICES_PER_MOMENT, "the cap still holds over evidence-carrying notices");
    assert(surfaced[0]!.id === "opportunity:2", "priority still orders the surfaced set");
    assert(
      surfaced.every((n) => n.fact.kind === "opportunity" && n.fact.evidence.length > 0),
      "every surfaced coaching notice is evidence-backed",
    );
  }

  // -------------------------------------------------------------------------
  // §8 — Structural: one channel, no new reasoning, no private path
  // -------------------------------------------------------------------------
  section("§8 Structural — one proactive channel, no reasoning added, no second path");

  const here = path.dirname(fileURLToPath(import.meta.url));
  const read = (rel: string): string => readFileSync(path.resolve(here, rel), "utf8");
  // Inspect CODE, not prose: every module below discusses these rules in its header.
  const stripComments = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  const routesCode = stripComments(read("../routes.ts"));
  const noticeCode = stripComments(read("../intelligence/conversation/notice-engine.ts"));
  const frameworkCode = stripComments(read("../intelligence/opportunity-delivery/framework.ts"));

  const countOf = (src: string, needle: string): number => src.split(needle).length - 1;

  // ONE ambient-notice channel (Notice Engine §9's first stop rule).
  assert(countOf(routesCode, "applySilenceRules(") === 1, "exactly one call site applies the Silence Rules — there is no second ambient-notice channel", String(countOf(routesCode, "applySilenceRules(")));
  assert(countOf(routesCode, '"/api/intelligence/companion/notices"') === 1, "the governed notices route is registered exactly once");

  // The route reaches opportunities only through the registered capability.
  assert(!routesCode.includes("opportunity-delivery/framework"), "routes.ts never imports the OD1 framework directly — it goes through the Intent Engine");
  assert(!routesCode.includes("opportunity-delivery/delivery-store"), "routes.ts never imports the delivery store — OD1 remains its table's sole owner");
  assert(routesCode.includes('capabilityId: "opportunity-delivery"'), "the route invokes the registered capability by id, on the ordinary platform path");

  // The Notice Engine stays a pure adapter: no I/O, no storage, no platform.
  const noticeImports = noticeCode.split("\n").filter((l) => /^\s*import\s+(?!type)/.test(l));
  assert(
    !noticeImports.some((l) => /storage|\/db|intelligence-platform|delivery-store/.test(l)),
    "notice-engine.ts imports no store, no database and no platform — it remains a pure adapter",
  );

  // COACH1 added no threshold, no ranking, no score to the engine.
  assert(noticeCode.includes("STREAK_NOTABLE_MULTIPLE = 7"), "the streak notability gate is still 7");
  assert(noticeCode.includes("DIVERSITY_NOTABLE_MULTIPLE = 10"), "the diversity notability gate is still 10");
  assert(noticeCode.includes("MAX_NOTICES_PER_MOMENT = 2"), "the per-moment cap was not raised as a fix");

  // OD1 authors exactly ONE evidence source, and it is not a producer's.
  assert(
    countOf(frameworkCode, "source: HOUSEHOLD_LEARNING_EVIDENCE_SOURCE") === 1,
    "the framework authors exactly one evidence entry, in exactly one place",
    String(countOf(frameworkCode, "source: HOUSEHOLD_LEARNING_EVIDENCE_SOURCE")),
  );
  assert(HOUSEHOLD_LEARNING_EVIDENCE_SOURCE === "household-learning", "that entry is attributed to household-learning, never to a producer");

  // Rule EL2 still holds: no private path to the evidence tables.
  assert(!frameworkCode.includes("evidence-learning-store"), "the framework still reaches evidence only through the one door (Rule EL2)");
  assert(
    !frameworkCode.includes("household_evidence_events") && !frameworkCode.includes("household_learning_signals"),
    "the framework still names neither evidence table in code",
  );

  // COACH1 wrote no preference (EL2 §8's third gate).
  assert(!frameworkCode.includes("mutedOpportunityTypes: ["), "COACH1 never writes mutedOpportunityTypes — muting remains the household's own act");

  console.log(`\n${"=".repeat(56)}`);
  console.log(`COACH1 Proactive Coaching: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
