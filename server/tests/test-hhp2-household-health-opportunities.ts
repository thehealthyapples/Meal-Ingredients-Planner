/**
 * HHP2 — Household Health Opportunity Platform
 * =============================================
 * Asserts that Household Health is a REGISTERED, CANONICAL opportunity producer on the
 * existing Decision Engine — and that becoming one added no second opportunity system,
 * no second scoring system, and no engine.
 *
 *   §1  Enrolment — `household-health` is registered in OPPORTUNITY_SOURCES, calls the
 *       `report` verb, and shares ONE adapter with food-intelligence (not a second one).
 *   §2  The capability — `report` delegates to HNP1 verbatim, resolves the caller's OWN
 *       household, gaps honestly, and treats an empty week as reached-and-offered-nothing
 *       rather than as an unreachable producer.
 *   §3  End-to-end through the REAL Decision Engine — a household health opportunity is
 *       collected, ranked, budgeted, persisted, surfaced and lifecycle-suppressed by the
 *       framework, with ZERO HHP2 code in that path.
 *   §4  Inherited governance, proven not asserted — muting, the delivery lifecycle, the
 *       attention budget, LEARN1's re-weight and the sealed DeliveryDecision all apply to
 *       the new producer because they are owned once, in the framework.
 *   §5  Boundaries — HHP2 writes no suppression/ranking/budget code, invents no score, and
 *       never emits `critical` (ATTN1 A2).
 *   §6  The Notice seam — the `nutrition` domain maps to a real category, so a delivered
 *       health opportunity actually reaches the household instead of being silently dropped.
 *
 * Run with: npx tsx server/tests/test-hhp2-household-health-opportunities.ts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { assertCriticalAllowed } from "../../shared/attention/index.js";
import {
  buildOpportunities,
  computeHouseholdNutritionScore,
  NUTRITION_OPPORTUNITY_TYPES,
  type HouseholdNutritionFacts,
} from "../../shared/nutrition/household-nutrition.js";
import { EMPTY_VARIETY_SCORE } from "../../shared/canonical/plant-classifier.js";
import { collectOpportunities, resolveOpportunity } from "../intelligence/opportunity-delivery/framework.js";
import { InMemoryOpportunityDeliveryStore } from "../intelligence/opportunity-delivery/delivery-store.js";
import { createHouseholdHealthReadHandler } from "../intelligence/handlers/household-health-handler.js";
import type { HouseholdHealthReadPort } from "../intelligence/handlers/household-health-read-port.js";
import {
  HOUSEHOLD_HEALTH_CAPABILITY_ID,
  HOUSEHOLD_HEALTH_EXECUTABLE_INTENTS,
} from "../intelligence/bindings/household-health.js";
import { noticeOpportunities } from "../intelligence/conversation/notice-engine.js";
import { NOTICE_SCOPE } from "../intelligence/conversation/notice-gateway.js";
import { CapabilityExecutionError, type IntentOutcome, type IntentVerb } from "../intelligence/types.js";

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

const HERE = path.dirname(fileURLToPath(import.meta.url));
function sourceOf(relative: string): string {
  return readFileSync(path.join(HERE, "..", relative), "utf8");
}

/**
 * The source with every comment removed.
 *
 * The §5 boundary scans below assert what a module DOES, and a module's prose is not what
 * it does. Scanning the raw source conflates the two: this file's own modules explain, in
 * their headers, that they hold "no rule, no threshold, no weight" — and a naive scan for
 * `threshold` then fails them for SAYING they own no threshold. Stripping comments first
 * makes the assertion mean what it claims to mean, and makes it strictly harder to pass:
 * a violation can no longer hide behind the word that describes it.
 */
function codeOf(relative: string): string {
  return sourceOf(relative)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

// ---------------------------------------------------------------------------
// Fixtures — a household whose week is genuinely weak on every HNP1 dimension,
// so `buildOpportunities` (HNP1's own core, untouched) emits real opportunities.
// ---------------------------------------------------------------------------

const WEAK_WEEK: HouseholdNutritionFacts = {
  weeklyPlantSlugs: ["carrot", "onion", "potato"], // 3 of 30 → plant-diversity gap
  weeklyVariety: { ...EMPTY_VARIETY_SCORE, vegetables: 3, total: 3 }, // 1 of 5 components → balance gap
  mealsPlanned: 3,
  daysWithMeals: 2, // 2 of 7 days → planning gap
  averageAppleRating: null,
  appleRatingSampleCount: 0,
  categoriesCovered: 2,
  categoriesTotal: 12,
  allTimePlantDiversity: 14,
  weekNumber: 7,
};

const WEAK_SCORE = computeHouseholdNutritionScore(WEAK_WEEK);
const WEAK_OPPORTUNITIES = buildOpportunities(WEAK_WEEK, WEAK_SCORE);

/** The HNP1 report shape the real port returns, built from HNP1's own core. */
function reportFor(facts: HouseholdNutritionFacts) {
  const score = computeHouseholdNutritionScore(facts);
  return {
    available: score.value !== null,
    score,
    weekly: null,
    insights: [],
    opportunities: buildOpportunities(facts, score),
    trust: { sources: ["planner", "plant-classifier"], unscoredDimensions: [] },
  };
}

/** An in-memory Household Health port — no DB, no platform. */
function portFor(
  facts: HouseholdNutritionFacts | null,
  opts: { householdResolves?: boolean } = {},
): HouseholdHealthReadPort {
  return {
    async getHouseholdForUser() {
      if (opts.householdResolves === false) throw new Error("no household");
      return 42;
    },
    async assembleHouseholdHealth() {
      if (!facts) {
        return {
          available: false,
          score: null,
          weekly: null,
          insights: [],
          opportunities: [],
          trust: { sources: [], unscoredDimensions: [] },
        };
      }
      return reportFor(facts);
    },
  };
}

const USER_CONTEXT = { role: "user" as const, userId: "1" };

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("1. ENROLMENT — a registered producer, not a new opportunity system");
  // -------------------------------------------------------------------------

  const framework = codeOf("intelligence/opportunity-delivery/framework.ts");

  assert(
    /"household-health":\s*\{\s*verb:\s*"report"/.test(framework),
    "`household-health` is enrolled in OPPORTUNITY_SOURCES, on the `report` verb (DEC1 §7 — the one enrolment door)",
  );
  assert(
    HOUSEHOLD_HEALTH_CAPABILITY_ID === "household-health" &&
      HOUSEHOLD_HEALTH_EXECUTABLE_INTENTS.includes("report" as IntentVerb),
    "the binding's capability id and `report` verb are the same two facts OPPORTUNITY_SOURCES keys on",
  );

  // The load-bearing claim of HHP2: ONE adapter, shared. Two producers, one shape.
  // `adaptSubject` is excluded by construction: it adapts a FIELD of an opportunity, not a
  // producer's report, so it is not a producer adapter and never was one.
  const producerAdapters = (framework.match(/function (adapt\w*)\(result: unknown\)/g) ?? []).map((m) =>
    m.replace(/function (\w+).*/, "$1"),
  );
  assert(
    producerAdapters.length === 1 && producerAdapters[0] === "adaptOpportunityReport",
    "exactly ONE producer adapter exists — the second producer reused it rather than adding its own",
    `found: ${producerAdapters.join(", ") || "none"}`,
  );
  assert(
    !/\badaptFoodIntelligence\b/.test(framework),
    "the food-specific adapter identifier is RETIRED, not left beside its generalisation (Principle 8)",
  );
  assert(
    (framework.match(/adapt:\s*adaptOpportunityReport/g) ?? []).length === 2,
    "both registered producers are adapted by that one shared function",
  );

  // -------------------------------------------------------------------------
  section("2. THE CAPABILITY — delegation, ownership scoping, honest gaps");
  // -------------------------------------------------------------------------

  const handler = createHouseholdHealthReadHandler(async () => portFor(WEAK_WEEK));

  const result = (await handler({ verb: "report", capabilityId: "household-health" }, USER_CONTEXT)) as {
    opportunities: readonly { id: string; type: string; owningDomain: string; explanation: string }[];
    score: { value: number | null } | null;
    source: string;
  };

  assert(
    result.opportunities.length === WEAK_OPPORTUNITIES.length && result.opportunities.length === 3,
    "`report` returns HNP1's opportunities — all three weak dimensions produced one each",
  );
  assert(
    result.opportunities.every(
      (o, i) => o.explanation === WEAK_OPPORTUNITIES[i].explanation && o.type === WEAK_OPPORTUNITIES[i].type,
    ),
    "every opportunity is HNP1's own, VERBATIM — HHP2 re-derives, rewords and re-ranks nothing",
  );
  assert(
    result.score?.value === WEAK_SCORE.value,
    "the score is HNP1's own — HHP2 computes no score of its own (no second scoring system)",
  );
  assert(result.source === "household-nutrition-platform", "the result names HNP1 as its owner");

  // Ownership scoping: the household is RESOLVED from the caller, never supplied.
  const handlerSource = codeOf("intelligence/handlers/household-health-handler.ts");
  assert(
    handlerSource.includes("requireUserId(context") && !/parameters.*householdId/.test(handlerSource),
    "the household is resolved from the caller's OWN authenticated id — there is no client-supplied household parameter",
  );

  // Anonymous caller → gap.
  let anonymousGapped = false;
  try {
    await handler({ verb: "report", capabilityId: "household-health" }, { role: "user" });
  } catch (err) {
    anonymousGapped = err instanceof CapabilityExecutionError;
  }
  assert(anonymousGapped, "an anonymous caller is an honest gap — never a fabricated household");

  // Unresolvable household → gap.
  const noHousehold = createHouseholdHealthReadHandler(async () =>
    portFor(WEAK_WEEK, { householdResolves: false }),
  );
  let householdGapped = false;
  try {
    await noHousehold({ verb: "report", capabilityId: "household-health" }, USER_CONTEXT);
  } catch (err) {
    householdGapped = err instanceof CapabilityExecutionError;
  }
  assert(householdGapped, "an unresolvable household is an honest gap — HHP2 will not invent one");

  // THE DISTINCTION THAT MATTERS TO THE SEALED DECISION: an empty week is NOT a gap.
  const emptyHandler = createHouseholdHealthReadHandler(async () => portFor(null));
  const emptyResult = (await emptyHandler(
    { verb: "report", capabilityId: "household-health" },
    USER_CONTEXT,
  )) as { opportunities: readonly unknown[]; trust: { available: boolean } };
  assert(
    emptyResult.opportunities.length === 0 && emptyResult.trust.available === false,
    "a household with no history returns OK-and-empty, not a throw — 'reached, offered nothing' is a true statement about a delivery moment; 'unreachable' would be a false one",
  );

  // A write verb is not executable.
  let writeRejected = false;
  try {
    await handler({ verb: "add", capabilityId: "household-health" }, USER_CONTEXT);
  } catch (err) {
    writeRejected = err instanceof CapabilityExecutionError;
  }
  assert(writeRejected, "Household Health is READ-ONLY — it never becomes a second owner of a business fact");

  // -------------------------------------------------------------------------
  section("3. END-TO-END — through the REAL Decision Engine, with zero HHP2 code in the path");
  // -------------------------------------------------------------------------

  /**
   * A producer fetch standing in for the real platform: `household-health` answers with
   * HNP1's report; `food-intelligence` is unreachable. This proves the household health
   * producer works through the framework's OWN fan-out, not a bespoke path.
   */
  const fetchProducer = async (capabilityId: string): Promise<IntentOutcome> => {
    if (capabilityId !== "household-health") {
      return { status: "gap", capabilityId, verb: "report", message: "not reachable in this test" } as IntentOutcome;
    }
    return {
      status: "ok",
      capabilityId,
      verb: "report",
      result: { opportunities: WEAK_OPPORTUNITIES },
    } as IntentOutcome;
  };

  const store = new InMemoryOpportunityDeliveryStore();
  const bundle = await collectOpportunities(
    { userId: 1 },
    { store, fetchProducer, fetchConfirmedUnderstanding: async () => [] },
  );

  assert(
    bundle.opportunities.length === 3,
    "the Decision Engine collected all three household health opportunities from the registered producer",
  );
  assert(
    bundle.opportunities.every((o) => o.capabilityId === "household-health"),
    "each carries its producing capability id",
  );
  assert(
    bundle.opportunities.every((o) => o.id.startsWith("household-health:")),
    "ids are namespaced by producer — two producers can never collide on an id",
  );
  assert(
    bundle.opportunities.every((o) => o.domain === "nutrition" && o.surface === "nutrition"),
    "the `nutrition` domain routes to the EXISTING `nutrition` ConversationSurface — an exact match, not a `floating` fallback",
  );
  assert(
    bundle.grouped.nutrition?.length === 3,
    "they group under their own owning domain",
  );
  assert(bundle.trust.resolved, "the bundle is resolved — a producer was genuinely reached");

  // Attention ordering is the framework's, applied to the new producer for free.
  assert(
    bundle.opportunities[0].priority === "medium" &&
      bundle.opportunities.slice(1).every((o) => o.priority === "low"),
    "the framework's attention sort ordered them (medium before low) — HHP2 wrote no sort",
  );

  // Rule E1 — every delivered opportunity cites an owner.
  assert(
    bundle.opportunities.every((o) => o.evidence.length > 0),
    "every delivered health opportunity carries a citation (Rule E1 — no citation, no card)",
  );

  // Persistence — the delivery lifecycle now covers household health.
  const persisted = await store.getRecords(
    1,
    bundle.opportunities.map((o) => o.id),
  );
  assert(
    persisted.size === 3,
    "the framework persisted a delivery record for each — household health now HAS a delivery lifecycle, which it never had before HHP2",
  );

  // -------------------------------------------------------------------------
  section("4. INHERITED GOVERNANCE — proven, not asserted");
  // -------------------------------------------------------------------------

  // (a) The sealed DeliveryDecision accounts for the new producer.
  const decision = bundle.decision;
  assert(
    !!decision && decision.producers.some((p) => p.capabilityId === "household-health" && p.offered === 3),
    "the sealed DeliveryDecision names `household-health` and what it offered — 'why didn't I see X?' is answerable for health too",
  );
  assert(
    !!decision && decision.delivered === 3 && decision.newlyPersisted === 3,
    "the decision's arithmetic covers the new producer's items exactly as it covers FI4's",
  );

  // (b) Muting — the household can silence a health opportunity TYPE.
  const mutingStore = new InMemoryOpportunityDeliveryStore();
  mutingStore.setMutedOpportunityTypes(1, [NUTRITION_OPPORTUNITY_TYPES.plantDiversity]);
  const muted = await collectOpportunities(
    { userId: 1 },
    { store: mutingStore, fetchProducer, fetchConfirmedUnderstanding: async () => [] },
  );
  assert(
    muted.opportunities.length === 2 &&
      !muted.opportunities.some((o) => o.type === NUTRITION_OPPORTUNITY_TYPES.plantDiversity),
    "`mutedOpportunityTypes` silences a household health type — the preference the household already had now reaches health, with no HHP2 code",
  );
  assert(
    muted.decision?.suppressedByMute === 1,
    "and the suppression is accounted to the mute rule in the sealed decision",
  );

  // (c) The budget — the framework's limit applies to the new producer.
  const budgetStore = new InMemoryOpportunityDeliveryStore();
  const budgeted = await collectOpportunities(
    { userId: 1, limit: 1 },
    { store: budgetStore, fetchProducer, fetchConfirmedUnderstanding: async () => [] },
  );
  assert(
    budgeted.opportunities.length === 1 && budgeted.decision?.suppressedByBudget === 2,
    "the delivery budget clamps health opportunities and accounts the remainder to the budget rule",
  );

  // (d) The lifecycle → Evidence loop. Dismissing a health opportunity suppresses it
  //     forever AND reports Evidence — the loop LEARN1/EL2 already owned, now closed for health.
  const evidenceEvents: { domain: string; subjectKey: string; outcomeType: string }[] = [];
  const target = bundle.opportunities[0].id;
  const resolution = await resolveOpportunity(1, target, "dismissed", store, async (input) => {
    evidenceEvents.push({
      domain: input.domain,
      subjectKey: input.subjectKey,
      outcomeType: input.outcomeType,
    });
    return { recorded: true } as never;
  });
  assert(resolution?.status === "dismissed", "a household health opportunity can be dismissed");
  assert(
    evidenceEvents.length === 1 &&
      evidenceEvents[0].domain === "nutrition" &&
      evidenceEvents[0].outcomeType === "opportunity_dismissed",
    "dismissing it emitted Evidence through EL2's one door — the Decision→Evidence loop is CLOSED for household health",
  );

  const afterDismiss = await collectOpportunities(
    { userId: 1 },
    { store, fetchProducer, fetchConfirmedUnderstanding: async () => [] },
  );
  assert(
    !afterDismiss.opportunities.some((o) => o.id === target) &&
      afterDismiss.decision?.suppressedByLifecycle === 1,
    "a dismissed health opportunity is never re-delivered, and is accounted to the lifecycle rule",
  );

  // (e) LEARN1 — a confirmed understanding re-weights health opportunities within their tier.
  const learningStore = new InMemoryOpportunityDeliveryStore();
  const learned = await collectOpportunities(
    { userId: 1 },
    {
      store: learningStore,
      fetchProducer,
      fetchConfirmedUnderstanding: async () => [
        {
          subjectType: "opportunity",
          domain: "nutrition",
          subjectKey: NUTRITION_OPPORTUNITY_TYPES.planning,
          direction: "positive",
          rationale: "You act on planning prompts.",
        } as never,
      ],
    },
  );
  const planningIndex = learned.opportunities.findIndex(
    (o) => o.type === NUTRITION_OPPORTUNITY_TYPES.planning,
  );
  const balanceIndex = learned.opportunities.findIndex(
    (o) => o.type === NUTRITION_OPPORTUNITY_TYPES.balance,
  );
  assert(
    planningIndex < balanceIndex,
    "a confirmed positive understanding promoted the planning opportunity ABOVE its same-tier peer (LEARN1, inherited)",
  );
  assert(
    learned.opportunities[planningIndex].evidence.some((e) => e.source === "household-learning"),
    "and COACH1 attached the household's own verbatim rationale, so the influence is visible rather than invisible",
  );
  assert(
    learned.opportunities[0].priority === "medium",
    "learning re-weighted WITHIN a tier and never across one — the `medium` still outranks every promoted `low` (Rule P1)",
  );

  // -------------------------------------------------------------------------
  section("5. BOUNDARIES — no new opportunity system, no new scoring, no engine");
  // -------------------------------------------------------------------------

  const hhp2Sources = [
    "intelligence/handlers/household-health-handler.ts",
    "intelligence/handlers/household-health-read-port.ts",
    "intelligence/bindings/household-health.ts",
  ];
  for (const rel of hhp2Sources) {
    const src = codeOf(rel);
    const name = rel.split("/").pop();
    assert(
      !/ATTENTION_RANK|\.sort\(|clampLimit|Math\.min\(Math\.max\(/.test(src),
      `${name} declares no ranking or budget of its own — the Decision Engine owns both`,
    );
    assert(
      !/mutedOpportunityTypes|insertDelivered|updateStatus/.test(src),
      `${name} declares no suppression or delivery lifecycle of its own — OD1 owns both`,
    );
    assert(
      !/WEIGHTS|threshold|score\s*=\s*\(|\* 0\.\d/.test(src),
      `${name} computes no score — HNP1's pure core owns the whole of it`,
    );
  }

  // ATTN1 A2 — a household health type can never be `critical`. This is the structural
  // defence against attention inflation, asserted at the producer boundary.
  let criticalRejected = false;
  try {
    assertCriticalAllowed(NUTRITION_OPPORTUNITY_TYPES.plantDiversity, "critical");
  } catch {
    criticalRejected = true;
  }
  assert(
    criticalRejected,
    "a household health opportunity may NEVER be `critical` — a quiet plant week is not a harm signal (ATTN1 A2, closed allowlist)",
  );
  assert(
    WEAK_OPPORTUNITIES.every((o) => o.priority !== "critical"),
    "and HNP1 emits none — the allowlist is never even approached",
  );

  // -------------------------------------------------------------------------
  section("6. THE NOTICE SEAM — delivered AND actually reachable by the household");
  // -------------------------------------------------------------------------

  const notices = noticeOpportunities(
    bundle.opportunities.map((o) => ({
      id: o.id,
      domain: o.domain,
      priority: o.priority,
      explanation: o.explanation,
      suggestedAction: o.suggestedAction,
      evidence: o.evidence,
    })),
  );
  assert(
    notices.length === 3 && notices.every((n) => n.category === "nutrition-opportunity"),
    "the `nutrition` domain maps to a real notice category — without this row every health opportunity would be delivered, budgeted, persisted, learned from, and then SILENTLY DROPPED one step before the household",
  );
  assert(
    notices.every((n) => n.source === "opportunity-delivery"),
    "and each names the Decision Engine as the owner it came through — not a bespoke health channel",
  );
  assert(
    (NOTICE_SCOPE.companion as readonly string[]).includes("nutrition-opportunity"),
    "the Companion's scope is a mouth for household health — the one thing the platform noticed about a household's health that it could not say before HHP2",
  );

  const gateway = codeOf("intelligence/conversation/notice-gateway.ts");
  assert(
    (gateway.match(/capabilityId:\s*"opportunity-delivery"/g) ?? []).length === 1,
    "the gateway still makes exactly ONE opportunity-delivery call — HHP2 added a category to the gate, not a second fetch that would re-rank and re-budget the same bundle",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(64)}`);
  console.log(`HHP2 Household Health Opportunity Platform: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
