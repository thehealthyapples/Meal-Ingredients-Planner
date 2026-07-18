/**
 * Opportunity Delivery Framework (OD1) — THE CANONICAL DECISION ENGINE (DEC1)
 * ===========================================================================
 * The canonical, cross-cutting framework governing how Domain Intelligence
 * opportunities are prioritised, grouped, deduplicated, surface-selected and
 * delivered across the platform. It sits ABOVE any number of Domain Intelligence
 * "opportunity producers" — today exactly one, FI4's Food Opportunity Engine
 * (`food-intelligence`'s `report` verb) — and adds the governance FI4 explicitly
 * left out: cross-producer prioritise+group, duplicate-delivery prevention, a
 * deterministic delivery surface, and acknowledge/dismiss/accept.
 *
 * DEC1 DESIGNATION (docs/architecture/THA_DECISION_ENGINE_ARCHITECTURE.md):
 * this framework IS the platform's Decision Engine — the named owner of the
 * DECISION stage of the Evidence → Attention → Decision → Action pipeline:
 * "which already-true, already-prioritised items surface NOW — where, in what
 * order, within what budget — and why did the rest not?" Any surface that
 * wants ambient surfacing enrols a producer in OPPORTUNITY_SOURCES below; none
 * builds its own suppress/rank/budget path. The pure mechanics it decides with
 * live once, in shared/attention/decision.ts, and every delivery moment seals
 * a {@link DeliveryDecision} (the BEH1 pattern — recorded as an observation by
 * the capability handler, projected for operators, and read back by NOTHING).
 * The engine's hard boundaries (DEC1 D5): it never absorbs domain Selection
 * (Planner scoring, COMP1 verdicts, substitution rules), never gates or
 * launders Evidence Confidence (A5), never re-derives Attention (A1), never
 * changes what may be ACTED on (ConfirmationTier — A7), never voices (INT21),
 * and never routes intent.
 *
 * GOVERNING ARCHITECTURE: docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md
 * (capability/intent/permission model this framework reuses unchanged) and
 * docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md (the one existing
 * Domain Intelligence producer this framework fans out to today). This module owns
 * ZERO business-domain data (Rule FI1) and zero producer reasoning — every
 * opportunity's explanation/suggestedAction is a verbatim projection of what the
 * producing capability already returned via the ordinary, registered Intent Engine
 * path (`intelligencePlatform.handle()`); this framework never re-derives or
 * second-guesses a producer's own reasoning.
 *
 * THE ONE EVIDENCE ENTRY THIS FRAMEWORK AUTHORS (COACH1). `explanation` and
 * `suggestedAction` remain untouched, and every evidence entry a producer supplied
 * is preserved verbatim and in order. To that array COACH1 appends AT MOST ONE
 * further entry, sourced `household-learning`, and ONLY for an opportunity whose
 * rank this framework actually moved using the household's own Confirmed
 * Understanding. Its `detail` is EL1's `rationale`, copied verbatim — this framework
 * neither writes nor rewords it. The entry exists because ET6 requires learning to
 * explain itself: before COACH1, a household's confirmed pattern silently reordered
 * advice and `metadata.learning.influenced` named the moved ids to no one who could
 * read them. An influence a household cannot see is not explainable, and this
 * framework's own influence is the one thing no producer can ever cite for it.
 *
 * WHAT THIS FRAMEWORK OWNS: the one new thing no producer has — the DELIVERY
 * lifecycle of an opportunity (delivered -> acknowledged -> dismissed/accepted),
 * persisted in `opportunity_deliveries` (see delivery-store.ts, the sole owner of
 * that table). Producer output itself is never persisted or copied — it is
 * recomputed fresh from the producer on every `report`, exactly as FI4 already
 * does; only the delivery metadata (which opportunity ids this user has already
 * seen/resolved) is stored.
 *
 * PRODUCER REGISTRATION: `OPPORTUNITY_SOURCES` below is the one place a Domain
 * Intelligence capability declares itself as an opportunity producer — a
 * capability id, the verb to call, and an `adapt()` function translating its
 * result into the generic `RawOpportunity` shape. Adding a second producer is a
 * one-line addition here, not a framework change (mirrors how opportunity-engine.ts
 * itself keeps its three generators in one owning module rather than the registry).
 *
 * TESTABILITY: `prioritiseAndGroup`, `selectSurface`, `filterMutedTypes` and
 * `partitionForDelivery` are PURE functions (no I/O) — fully unit-testable without
 * a database or a live platform. `collectOpportunities`/`resolveOpportunity` are the
 * thin I/O orchestration layer, with the producer fetch and the delivery store both
 * injectable (mirrors `resolvePort` factory-injection used by every other capability).
 */

import {
  type AttentionLevel,
  isAttentionLevel,
  isCritical,
  assertCriticalAllowed,
} from "../../../shared/attention/index.js";
// DEC1 — the one canonical Decision mechanics module. The local sort, the
// byte-identical clamp constant pair and the local evidence type this file
// used to declare are retired (Principle 8).
import {
  DELIVERY_DEFAULT_LIMIT,
  DELIVERY_MAX_LIMIT,
  clampLimit,
  clampWithCriticalExemption,
  orderByAttention,
  type EvidenceCitation,
} from "../../../shared/attention/decision.js";
import type { IntentVerb, IntelligenceContext, IntentOutcome } from "../types.js";
import type { ConversationSurface } from "../conversation/conversation-store.js";
import type {
  IOpportunityDeliveryStore,
  OpportunityDeliveryStatus,
} from "./delivery-store.js";
import { isTerminalDeliveryStatus } from "./delivery-store.js";
import { OPPORTUNITY_DELIVERY_CAPABILITY_ID } from "../bindings/opportunity-delivery.js";
import type {
  ConfirmedUnderstanding,
  HouseholdObservationInput,
  HouseholdObservationResult,
} from "../evidence-learning/household-observation.js";

// ---------------------------------------------------------------------------
// Limits — DEC1: the delivery budget pair lives once, in
// shared/attention/decision.ts (previously declared here byte-for-byte
// identically to FI4's copy).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

// ATTN1 — attention is the one canonical vocabulary in shared/attention. The
// module-local `OpportunityPriority` union this file used to declare is retired
// (Principle 8); DEC1 then retired the local sort/clamp mechanics the same way.

/** DEC1 — an alias of the one canonical `EvidenceCitation` (shared/attention/decision.ts); the local re-declaration is retired. */
export type OpportunityEvidence = EvidenceCitation;

/**
 * PHASE5E — the canonical entity an opportunity is about, carried VERBATIM from the
 * producer that already knew it (FI4's `FoodOpportunitySubject`).
 *
 * The Decision Engine does not interpret this, key on it, rank by it, or dereference
 * it. It carries it, exactly as it already carries `explanation` and `evidence` —
 * because the surface that renders an opportunity must be able to ask "explain THIS
 * one" without parsing the producer's prose to work out what "this one" is.
 *
 * `entity` is deliberately a plain `string` here and a closed union at the producer:
 * the engine owns no producer's entity vocabulary (DEC1 §3 — the engine never absorbs
 * Selection, and an entity taxonomy is the producer's, not the framework's).
 * `optional` because a future producer may have no single subject; a card without one
 * simply cannot be explained, which is an honest gap, not a defect.
 */
export interface OpportunitySubject {
  readonly entity: string;
  readonly id: number;
  readonly label: string;
}

/** One opportunity ready for delivery — a generic envelope over any producer's own opportunity shape. */
export interface DeliverableOpportunity {
  /** Globally unique across producers: `${capabilityId}:${producer's own opportunity id}`. */
  readonly id: string;
  readonly capabilityId: string;
  readonly domain: string;
  readonly type: string;
  readonly priority: AttentionLevel;
  readonly explanation: string;
  readonly evidence: readonly OpportunityEvidence[];
  readonly suggestedAction: string;
  readonly surface: ConversationSurface;
  /** PHASE5E — verbatim from the producer. Absent when the producer named none. */
  readonly subject?: OpportunitySubject;
}

export interface OpportunityDeliveryTrust {
  /** True only when at least one producer capability was successfully reached this call. */
  readonly resolved: boolean;
}

/**
 * What a household's Confirmed Understanding actually did to this bundle, so the
 * influence is auditable rather than invisible (ET6 — learning explains itself).
 * `influenced` lists the opportunity ids whose rank was moved, and is empty whenever
 * the household has confirmed nothing about the types on offer.
 */
export interface OpportunityLearningInfluence {
  readonly confirmedUnderstandingCount: number;
  readonly influenced: readonly string[];
}

export interface OpportunityDeliveryBundle {
  /** Flat, prioritised, capped list — the primary delivery shape. */
  readonly opportunities: readonly DeliverableOpportunity[];
  /** The same delivered set, partitioned by owning domain. */
  readonly grouped: Readonly<Record<string, readonly DeliverableOpportunity[]>>;
  readonly trust: OpportunityDeliveryTrust;
  readonly metadata: {
    readonly assembledAt: string;
    readonly sources: readonly string[];
    readonly learning: OpportunityLearningInfluence;
  };
  /**
   * DEC1 — the sealed record of this delivery moment (see `DeliveryDecision`).
   * `collectOpportunities` always seals one; the field is optional only so a
   * bundle assembled OUTSIDE the Decision Engine (an in-memory test port) is
   * not forced to fabricate a decision it never made. Operator-facing
   * telemetry, recorded by the capability handler — NEVER serialised onto the
   * wire result and never read back by anything.
   */
  readonly decision?: DeliveryDecision;
}

export interface OpportunityDeliveryRequest {
  /** The caller's own authenticated user id — never a client-supplied id. */
  readonly userId?: number;
  readonly limit?: number;
}

export interface OpportunityResolution {
  readonly opportunityId: string;
  readonly status: OpportunityDeliveryStatus;
  readonly resolvedAt: string | null;
}

// ---------------------------------------------------------------------------
// Producer registration — the ONE place a capability declares itself a producer
// ---------------------------------------------------------------------------

interface RawOpportunity {
  readonly id: string;
  readonly domain: string;
  readonly type: string;
  readonly priority: AttentionLevel;
  readonly explanation: string;
  readonly evidence: readonly OpportunityEvidence[];
  readonly suggestedAction: string;
  readonly subject?: OpportunitySubject;
}

/**
 * PHASE5E — validates a producer's subject without interpreting it. A malformed
 * subject is DROPPED (the opportunity still delivers, and simply cannot be explained)
 * rather than throwing: an opportunity is worth surfacing even if it cannot narrate
 * itself, and a producer's shape error must not silence a `critical` safety card.
 */
function adaptSubject(value: unknown): OpportunitySubject | undefined {
  if (!value || typeof value !== "object") return undefined;
  const s = value as Record<string, unknown>;
  if (typeof s.entity !== "string" || typeof s.label !== "string") return undefined;
  if (typeof s.id !== "number" || !Number.isFinite(s.id)) return undefined;
  return { entity: s.entity, id: s.id, label: s.label };
}

interface OpportunitySource {
  readonly verb: IntentVerb;
  readonly adapt: (result: unknown) => readonly RawOpportunity[];
}

/** Adapts FI4's `FoodOpportunityReportResult` shape into the generic `RawOpportunity` envelope. */
function adaptFoodIntelligence(result: unknown): readonly RawOpportunity[] {
  if (!result || typeof result !== "object") return [];
  const opportunities = (result as { opportunities?: unknown }).opportunities;
  if (!Array.isArray(opportunities)) return [];

  const raw: RawOpportunity[] = [];
  for (const o of opportunities) {
    if (!o || typeof o !== "object") continue;
    const rec = o as Record<string, unknown>;
    if (typeof rec.id !== "string" || typeof rec.owningDomain !== "string" || typeof rec.type !== "string") continue;
    if (!isAttentionLevel(rec.priority)) continue;
    // ATTN1 invariant A2 — `critical` is a closed allowlist. A producer that
    // emits it for a non-allowlisted type throws here (and its whole batch
    // honestly degrades via the per-producer catch): an inflated harm signal
    // must never surface, not even alongside legitimate opportunities.
    assertCriticalAllowed(rec.type, rec.priority);
    if (typeof rec.explanation !== "string" || typeof rec.suggestedAction !== "string") continue;

    const evidence: OpportunityEvidence[] = Array.isArray(rec.evidence)
      ? rec.evidence
          .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
          .map((e) => ({ source: String(e.source ?? ""), detail: String(e.detail ?? "") }))
      : [];

    raw.push({
      id: rec.id,
      domain: rec.owningDomain,
      type: rec.type,
      priority: rec.priority,
      explanation: rec.explanation,
      evidence,
      suggestedAction: rec.suggestedAction,
      subject: adaptSubject(rec.subject),
    });
  }
  return raw;
}

/**
 * The closed set of registered opportunity producers. Extending this map (Rule 8 —
 * evolution over replacement) is how a future Domain Intelligence capability becomes
 * a second producer without any change to the collection/prioritisation logic below.
 */
const OPPORTUNITY_SOURCES: Readonly<Record<string, OpportunitySource>> = {
  "food-intelligence": { verb: "report", adapt: adaptFoodIntelligence },
};

// ---------------------------------------------------------------------------
// Surface selection — pure, deterministic
// ---------------------------------------------------------------------------

const DOMAIN_SURFACE: Readonly<Record<string, ConversationSurface>> = {
  planner: "planner",
  pantry: "pantry",
  shopping: "shopping",
  // AFI4/CBK2 — the Cookbook domain routes to the EXISTING `meals` conversation surface.
  // No new surface is introduced: a question about a recipe belongs where recipes already
  // live.
  cookbook: "meals",
};

/** An unmapped domain is an honest gap, never a guess — it falls back to the Companion's own floating surface. */
const FALLBACK_SURFACE: ConversationSurface = "floating";

export function selectSurface(domain: string): ConversationSurface {
  return DOMAIN_SURFACE[domain] ?? FALLBACK_SURFACE;
}

// ---------------------------------------------------------------------------
// Preference filtering — pure
// ---------------------------------------------------------------------------

/**
 * Removes any opportunity whose `type` the caller has muted in their own preferences.
 *
 * ATTN1 invariant A3 — `critical` is exempt: a household may not blanket-silence a
 * harm signal. Muting is a blind, permanent, whole-class act; the informed,
 * per-instance `dismiss` of a specific critical opportunity remains fully available
 * (ids are item-scoped, so a recurrence on a new item re-surfaces). Muting remains
 * fully in force for every level below `critical` (invariant A4).
 */
export function filterMutedTypes(
  opportunities: readonly DeliverableOpportunity[],
  mutedTypes: readonly string[],
): DeliverableOpportunity[] {
  if (mutedTypes.length === 0) return [...opportunities];
  const muted = new Set(mutedTypes);
  return opportunities.filter((o) => isCritical(o.priority) || !muted.has(o.type));
}

// ---------------------------------------------------------------------------
// Household Learning (LEARN1) — the Evidence this framework reports, and the
// Confirmed Understanding it reads back
// ---------------------------------------------------------------------------

/**
 * The Evidence vocabulary this framework reports under. `subjectKey` is always the
 * opportunity's `type` — the stable grouping dimension a Pattern is detected over —
 * never the opportunity's own id, which is unique per instance and could therefore
 * never accumulate the MIN_EVIDENCE_COUNT events a Pattern requires.
 */
export const OPPORTUNITY_SUBJECT_TYPE = "opportunity";
export const OPPORTUNITY_ACCEPTED_OUTCOME = "opportunity_accepted";
export const OPPORTUNITY_DISMISSED_OUTCOME = "opportunity_dismissed";

/**
 * Only the two TERMINAL resolutions are Evidence. `acknowledged` is deliberately
 * absent: "seen" is not an opinion, and EL2 §5 requires the reporting domain to
 * supply a `direction` reflecting what it actually knows rather than a guessed
 * default. This framework knows that an accepted opportunity was wanted and a
 * dismissed one was not; it does not know what an acknowledged one means.
 */
const TERMINAL_OUTCOME: Readonly<
  Partial<Record<OpportunityDeliveryStatus, { readonly outcomeType: string; readonly direction: "positive" | "negative" }>>
> = {
  accepted: { outcomeType: OPPORTUNITY_ACCEPTED_OUTCOME, direction: "positive" },
  dismissed: { outcomeType: OPPORTUNITY_DISMISSED_OUTCOME, direction: "negative" },
};

/** Injectable so tests never reach the real platform. Production: the Rule EL2 one-door helper. */
export type OpportunityOutcomeReporter = (input: HouseholdObservationInput) => Promise<HouseholdObservationResult>;

/** Injectable so tests never reach the real platform. Production: the Rule EL2 one-door helper. */
export type ConfirmedUnderstandingFetch = (userId: number) => Promise<readonly ConfirmedUnderstanding[]>;

async function defaultOutcomeReporter(input: HouseholdObservationInput): Promise<HouseholdObservationResult> {
  const { recordHouseholdObservation } = await import("../evidence-learning/household-observation.js");
  return recordHouseholdObservation(input);
}

async function defaultConfirmedUnderstandingFetch(userId: number): Promise<readonly ConfirmedUnderstanding[]> {
  const { readConfirmedUnderstanding } = await import("../evidence-learning/household-observation.js");
  return readConfirmedUnderstanding(userId);
}

/**
 * How a household's Confirmed Understanding re-weights ONE opportunity:
 * `-1` promote, `0` no confirmed understanding, `+1` demote. PURE.
 *
 * `0` is the honest gap and by far the common case — a household whose behaviour on
 * this opportunity type is still unknown gets exactly the ordering it gets today.
 */
export type LearningRank = -1 | 0 | 1;

/**
 * The ONE Confirmed Understanding that speaks to this opportunity, or `undefined`
 * when the household's behaviour towards this (domain × type) is still unknown —
 * by far the common case. PURE.
 *
 * The dimension must match on all three axes, exactly as EL1 detected it. A
 * near-miss is not a weaker match, it is a different subject, so it is never
 * coerced into one.
 */
export function matchConfirmedUnderstanding(
  opportunity: Pick<DeliverableOpportunity, "domain" | "type">,
  understanding: readonly ConfirmedUnderstanding[],
): ConfirmedUnderstanding | undefined {
  for (const understood of understanding) {
    if (understood.subjectType !== OPPORTUNITY_SUBJECT_TYPE) continue;
    if (understood.domain !== opportunity.domain) continue;
    if (understood.subjectKey !== opportunity.type) continue;
    return understood;
  }
  return undefined;
}

export function learningRankFor(
  opportunity: Pick<DeliverableOpportunity, "domain" | "type">,
  understanding: readonly ConfirmedUnderstanding[],
): LearningRank {
  const understood = matchConfirmedUnderstanding(opportunity, understanding);
  if (!understood) return 0;
  return understood.direction === "positive" ? -1 : 1;
}

/**
 * COACH1 — the household-pattern coaching seam, and the single place this framework
 * authors an evidence entry of its own (see the module header for why it is allowed
 * to, and why nothing else here is).
 *
 * Appends one `household-learning` evidence entry naming EL1's verbatim `rationale`,
 * to exactly the opportunities whose rank a Confirmed Understanding actually moved.
 * PURE, and TOTAL in the only way that matters: an opportunity with no matching
 * Confirmed Understanding is returned **by identity**, not copied — so a household
 * that has confirmed nothing (the state every household starts in) gets byte-for-byte
 * the objects it got before COACH1.
 *
 * This re-weights and explains. It NEVER authors an opportunity, changes a priority,
 * or writes a preference — NK2 Rule P1 ("household learning never generates new
 * facts, only re-weights existing ones") and EL2 §8's third gate, both intact.
 */
export const HOUSEHOLD_LEARNING_EVIDENCE_SOURCE = "household-learning";

export function withLearningEvidence(
  opportunity: DeliverableOpportunity,
  understanding: readonly ConfirmedUnderstanding[],
): DeliverableOpportunity {
  const understood = matchConfirmedUnderstanding(opportunity, understanding);
  if (!understood) return opportunity;
  return {
    ...opportunity,
    evidence: [
      ...opportunity.evidence,
      { source: HOUSEHOLD_LEARNING_EVIDENCE_SOURCE, detail: understood.rationale },
    ],
  };
}

// ---------------------------------------------------------------------------
// Non-intrusive delivery (COACH1) — what the household has already seen
// ---------------------------------------------------------------------------

/**
 * "Seen" is `acknowledged` and ONLY `acknowledged` — the status a household reaches
 * by explicitly calling `review` on an opportunity. It is deliberately NOT
 * `delivered`.
 *
 * `delivered` means this framework placed the opportunity in a bundle. It does not
 * mean a human ever laid eyes on it: `collectOpportunities` returns up to `limit`
 * (default 10) opportunities, while the Companion's Silence Rules present at most
 * MAX_NOTICES_PER_MOMENT (2) of them. Treating `delivered` as "seen" would therefore
 * demote up to eight opportunities the household was never shown, on the strength of
 * a claim this framework cannot support.
 */
export const ACKNOWLEDGED_STATUS = "acknowledged";

/** The subset of ids this household has explicitly acknowledged. PURE. */
export function seenOpportunityIds(
  existingByOpportunityId: ReadonlyMap<string, ExistingDeliveryRecord>,
): Set<string> {
  const seen = new Set<string>();
  for (const [opportunityId, record] of Array.from(existingByOpportunityId.entries())) {
    if (record.status === ACKNOWLEDGED_STATUS) seen.add(opportunityId);
  }
  return seen;
}

// ---------------------------------------------------------------------------
// Duplicate-delivery prevention — pure partition
// ---------------------------------------------------------------------------

export interface ExistingDeliveryRecord {
  /** A plain `string` (not the narrow status union) so a raw DB row can be passed directly — see isTerminalDeliveryStatus. */
  readonly status: string;
}

export interface DeliveryPartition {
  /** Survives to the caller — everything not already terminally resolved. */
  readonly deliverable: readonly DeliverableOpportunity[];
  /** The subset of `deliverable` with no existing record yet — needs a first insert. */
  readonly toInsert: readonly DeliverableOpportunity[];
}

/**
 * Partitions candidate opportunities against existing delivery records for this
 * user. An opportunity already `dismissed` or `accepted` is suppressed entirely —
 * this IS "preventing duplicate delivery" for resolved opportunities. An opportunity
 * already `delivered`/`acknowledged` stays visible but is never re-inserted as a
 * second row — this IS "preventing duplicate delivery" for still-open opportunities.
 */
export function partitionForDelivery(
  candidates: readonly DeliverableOpportunity[],
  existingByOpportunityId: ReadonlyMap<string, ExistingDeliveryRecord>,
): DeliveryPartition {
  const deliverable: DeliverableOpportunity[] = [];
  const toInsert: DeliverableOpportunity[] = [];
  for (const candidate of candidates) {
    const existing = existingByOpportunityId.get(candidate.id);
    if (existing && isTerminalDeliveryStatus(existing.status)) continue;
    deliverable.push(candidate);
    if (!existing) toInsert.push(candidate);
  }
  return { deliverable, toInsert };
}

// ---------------------------------------------------------------------------
// Prioritisation + grouping — pure, deterministic, no re-derived score
// ---------------------------------------------------------------------------

export interface PrioritisedOpportunities {
  readonly opportunities: readonly DeliverableOpportunity[];
  readonly grouped: Readonly<Record<string, readonly DeliverableOpportunity[]>>;
}

/**
 * Stable-sorts the MERGED, cross-producer opportunity list by attention
 * (critical -> high -> medium -> low), preserving arrival order within a tier
 * (mirrors FI4's own `prioritizeOpportunities`, extended to operate across
 * producers rather than within one), clamps to `limit`, then groups the
 * surviving set by owning domain. PURE — no I/O, no randomness, no clock reads.
 *
 * DEC1 — the sort and the clamp are the canonical shared mechanics
 * (shared/attention/decision.ts); this framework contributes only the two sort
 * keys that are legitimately its own (LEARN1's learning rank, COACH1's seen
 * flag). Behaviour is golden-identity tested byte-identical
 * (test-dec1-decision-engine.ts).
 *
 * ATTN1 invariant A3 — `critical` is exempt from the clamp: every critical
 * opportunity is admitted before `limit` is applied to the remainder, so a harm
 * signal can never be silently dropped by a cap. And because attention is the
 * FIRST sort key, `critical` also sits above the `learning` and `seen` keys
 * below: an acknowledged critical still outranks an unseen `high` — safety is
 * now protected from its own former tier, not only from `medium` (closes ATTN1
 * finding F4).
 *
 * LEARN1 adds `understanding` as the sort's SECOND key, between priority and
 * arrival order. Two properties follow from that position, and both are asserted in
 * `test-learn1-household-learning.ts`:
 *
 *   1. Learning can never move an opportunity across a priority tier. Priority is
 *      compared first, so a demoted `high` still outranks every `medium`. A
 *      household's confirmed dislike re-orders advice; it never buries urgent advice
 *      beneath trivia.
 *   2. With no Confirmed Understanding — the state every household starts in, and the
 *      state every household stays in until it explicitly confirms a Pattern — every
 *      rank is `0` and this function returns exactly what it returned before LEARN1.
 *
 * The set itself is untouched: same opportunities, same ids, same priorities, same
 * count. Only the order within a tier changes, which is the whole of "re-weight,
 * never author" (NK2 Rule P1). Under a `limit` this ordering does decide which of the
 * eligible opportunities are delivered — that is what re-weighting is for, and it is
 * strictly weaker than the `mutedOpportunityTypes` preference, which removes a type
 * outright and remains the only mechanism that can — for every level below
 * `critical`, which is exempt from muting (ATTN1 invariant A3).
 *
 * COACH1 adds `seen` as the sort's THIRD key, below priority and below learning. It
 * is what makes proactive coaching non-intrusive: an opportunity this household has
 * explicitly acknowledged yields its place to one it has never been shown. Before
 * COACH1 the same two highest-priority opportunities were re-delivered on every
 * single `report` until dismissed, so a household that acknowledged advice without
 * resolving it saw that advice, and only that advice, forever.
 *
 * Its position below `learning` is deliberate: "this household confirmed it does not
 * want this kind of advice" is a stronger statement than "this household has not seen
 * this particular card yet", so a confirmed dislike still sinks even when unseen. Its
 * position below `priority` is load-bearing for the same reason learning's is — an
 * acknowledged `shopping-restriction-conflict` (a `critical`, since ATTN1) still
 * outranks every `high`, `medium` and `low`, so novelty can never bury a
 * safety-relevant opportunity beneath trivia — not even within its former tier.
 *
 * With no Confirmed Understanding and nothing acknowledged — the state every
 * household starts in — every rank is `0`, and this function returns exactly what it
 * returned before COACH1, and before LEARN1.
 */
export function prioritiseAndGroup(
  opportunities: readonly DeliverableOpportunity[],
  limit: number = DELIVERY_DEFAULT_LIMIT,
  understanding: readonly ConfirmedUnderstanding[] = [],
  seen: ReadonlySet<string> = new Set<string>(),
): PrioritisedOpportunities {
  const sorted = orderByAttention(opportunities, [
    (opportunity) => learningRankFor(opportunity, understanding),
    (opportunity) => (seen.has(opportunity.id) ? 1 : 0),
  ]);
  // A3 clamp exemption — admit every critical, apply `limit` to the rest.
  const prioritised = clampWithCriticalExemption(sorted, limit, DELIVERY_MAX_LIMIT);

  const grouped: Record<string, DeliverableOpportunity[]> = {};
  for (const opportunity of prioritised) {
    (grouped[opportunity.domain] ??= []).push(opportunity);
  }

  return { opportunities: prioritised, grouped };
}

// ---------------------------------------------------------------------------
// DEC1 — the sealed delivery decision (the BEH1 pattern, applied to surfacing)
// ---------------------------------------------------------------------------

/** What one reached producer offered this delivery moment. */
export interface ProducerContribution {
  readonly capabilityId: string;
  readonly offered: number;
}

/** What the caller observed the Decision stage do, closed by `sealDeliveryDecision`. */
export interface DeliveryDecisionInput {
  /** The producers actually reached this call (an unreachable producer honestly degrades and is absent). */
  readonly producers: readonly ProducerContribution[];
  /** Total opportunities offered across all reached producers, before any suppression. */
  readonly collected: number;
  /** Suppressed by the household's own mutedOpportunityTypes preference (critical exempt — A3). */
  readonly suppressedByMute: number;
  /** Suppressed because already terminally resolved (dismissed/accepted) — lifecycle, never re-delivered. */
  readonly suppressedByLifecycle: number;
  /** Suppressed by the delivery budget alone (eligible, ordered, below the cut). */
  readonly suppressedByBudget: number;
  /** The limit the caller asked for (after the framework's own default). */
  readonly requestedLimit: number;
  /** Criticals delivered — each admitted OUTSIDE the budget (A3 exemption). */
  readonly criticalDelivered: number;
  readonly delivered: number;
  /** Deliveries persisted for the first time this moment (ids this user had never been shown). */
  readonly newlyPersisted: number;
  /** Delivered items this household had already explicitly acknowledged (ordered after unseen peers — COACH1). */
  readonly acknowledgedDelivered: number;
  /** LEARN1 — what the household's Confirmed Understanding did to this bundle (already computed, copied verbatim). */
  readonly learning: OpportunityLearningInfluence;
}

/**
 * The sealed decision — the canonical record of ONE delivery moment: which
 * eligible facts surfaced, which did not, by which rule, and why. Mirrors
 * BEH1's `BehaviourDecision` exactly in discipline: sealed pure, recorded by
 * the capability handler as a `delivery-decision` observation, projected for
 * operators — and READ BACK BY NOTHING (Observation Engine §7: telemetry is
 * never an input to behaviour; NK2 — "learning must never be a hidden
 * decision-maker", and neither may the decision's own record).
 */
export interface DeliveryDecision extends DeliveryDecisionInput {
  /** `requestedLimit` normalised by the one canonical clamp rule into [1, DELIVERY_MAX_LIMIT]. */
  readonly appliedLimit: number;
  /** The fixed key order of the canonical sort — stated, never re-derived downstream. */
  readonly orderingBasis: readonly string[];
  /**
   * A deterministic, operator-facing explanation of this decision — never
   * shown to the user, never a Companion voice surface, and never carrying a
   * fact about the household beyond counts and rule names. Same inputs, same
   * sentences, every time (the BEH1 reproducibility discipline).
   */
  readonly reasoning: string[];
}

/** The canonical sort's key order, as `prioritiseAndGroup` applies it. */
const DELIVERY_ORDERING_BASIS: readonly string[] = ["attention", "learning", "seen", "arrival"];

function plural(count: number, singular: string, pluralWord?: string): string {
  return `${count} ${count === 1 ? singular : (pluralWord ?? `${singular}s`)}`;
}

/**
 * Explain a delivery decision. Every sentence states something the Decision
 * stage itself did — suppression accounting is stated even when zero, so an
 * operator reading "why didn't I see X?" gets a complete answer, not an
 * absence. Every sentence about what the stage did NOT do names the owner
 * that did (producers, the evidence gate, the Silence Rules, ConfirmationTier).
 */
function explainDeliveryDecision(input: DeliveryDecisionInput, appliedLimit: number): string[] {
  const reasoning: string[] = [];

  if (input.producers.length === 0) {
    reasoning.push(
      "No producer contributed this moment — the bundle is honestly empty. Nothing was suppressed by decision.",
    );
    return reasoning;
  }

  reasoning.push(
    `Collected ${plural(input.collected, "opportunity", "opportunities")} from ` +
      `${plural(input.producers.length, "reached producer")}: ` +
      input.producers.map((p) => `${p.capabilityId} (${p.offered})`).join(", ") +
      ". Every opportunity's content and attention level are the producer's own, verbatim (A1).",
  );
  reasoning.push(
    `Suppressed ${input.suppressedByMute} by the household's mutedOpportunityTypes preference ` +
      "(critical is exempt from muting — A3).",
  );
  reasoning.push(
    `Suppressed ${input.suppressedByLifecycle} already terminally resolved (dismissed/accepted) — ` +
      "a resolved opportunity is never re-delivered.",
  );
  reasoning.push(
    input.learning.confirmedUnderstandingCount === 0
      ? "No Confirmed Understanding — the household's own ordering is exactly what attention and arrival dictate (the honest default state)."
      : `The household's Confirmed Understanding (${input.learning.confirmedUnderstandingCount} confirmed) re-weighted ` +
          `${plural(input.learning.influenced.length, "opportunity", "opportunities")} within their attention tiers — ` +
          "re-weighting orders only; it never authors, removes, or crosses a tier (Rule P1).",
  );
  reasoning.push(
    `Applied the delivery budget of ${appliedLimit}` +
      (appliedLimit === input.requestedLimit ? "" : ` (requested ${input.requestedLimit}, clamped)`) +
      `: suppressed ${input.suppressedByBudget} eligible ${input.suppressedByBudget === 1 ? "opportunity" : "opportunities"} below the cut; ` +
      `${input.criticalDelivered} critical admitted outside the budget (A3 — a cap never drops a harm signal).`,
  );
  reasoning.push(
    `Delivered ${input.delivered} (${input.newlyPersisted} newly persisted as delivery records; ` +
      `${input.acknowledgedDelivered} previously acknowledged, ordered after unseen peers). ` +
      "What may be DONE about any of them is unchanged — ConfirmationTier governs acting (A7), " +
      "and presentation volume at the conversation edge remains the Silence Rules' own budget (INT20).",
  );

  return reasoning;
}

/**
 * Close the decision for this delivery moment. PURE: the same inputs always
 * seal to the same decision, including the same reasoning sentences in the
 * same order — so the record is reproducible and diffable (BEH1 discipline).
 * The Decision Engine seals; the capability handler records; nothing reads it
 * back.
 */
export function sealDeliveryDecision(input: DeliveryDecisionInput): DeliveryDecision {
  const appliedLimit = clampLimit(input.requestedLimit, DELIVERY_MAX_LIMIT);
  return {
    ...input,
    appliedLimit,
    orderingBasis: DELIVERY_ORDERING_BASIS,
    reasoning: explainDeliveryDecision(input, appliedLimit),
  };
}

// ---------------------------------------------------------------------------
// I/O orchestration — fan out to producers, then call the pure core
// ---------------------------------------------------------------------------

/**
 * Fetches one producer's raw platform outcome. Injectable so tests never touch the
 * real platform/DB.
 *
 * MAT1 — `parameters` is the fourth argument. It carries the CANDIDATE-SET request
 * described on {@link PRODUCER_CANDIDATE_LIMIT}; a fetch that ignores it still
 * compiles and still works, it simply offers whatever its own default was.
 */
export type ProducerFetch = (
  capabilityId: string,
  verb: IntentVerb,
  context: IntelligenceContext,
  parameters?: Readonly<Record<string, unknown>>,
) => Promise<IntentOutcome>;

/**
 * MAT1 (AFI_VERIFY1 §4.2) — how many candidates OD1 asks each producer for.
 *
 * This is the CANDIDATE set, not the DELIVERED set. They are different numbers and
 * conflating them was the defect: producers defaulted to `DELIVERY_DEFAULT_LIMIT`
 * (10) and clamped there, so the ~2/3 of a household's generated observations that
 * fell below that line were discarded INSIDE the producer — before this framework's
 * LEARN1 re-ranking and seen-suppression had ever seen them. A household's own
 * Confirmed Understanding could therefore never promote one, which is the entire
 * point of LEARN1. Empirically (AFI3_5, demo household 905) that starved the whole
 * Pantry surface: 30 observations generated, 10 survived the producer's clamp, and
 * 20 `pantry-item-unused-in-plan` candidates were unreachable by learning.
 *
 * Asking for `DELIVERY_MAX_LIMIT` restores them to ELIGIBILITY only — nothing about
 * what a household is finally shown changes here. `prioritiseAndGroup` still applies
 * the one household-facing clamp, at the delivery boundary that owns it, using the
 * caller's own `requestedLimit`. So this is a SEQUENCING correction, not a new
 * policy: the same shared DEC1 mechanics, now composed in the right order — rank
 * first with the household's learning, clamp once afterwards.
 *
 * It is deliberately the EXISTING canonical ceiling rather than a new constant. The
 * producer's own `prioritizeOpportunities` bound is unchanged and still holds at
 * `DELIVERY_MAX_LIMIT`, so this can never ask for an unbounded set.
 */
const PRODUCER_CANDIDATE_LIMIT = DELIVERY_MAX_LIMIT;

/**
 * Default production fetch — calls the canonical Intelligence Platform singleton.
 * DYNAMIC import: `intelligence-platform.ts` binds this framework's OWN capability
 * (via bindings/opportunity-delivery.ts), so a static top-level import here would be
 * circular. Deferring to call-time (after the whole module graph has finished
 * loading) is the same discipline every read-port in this codebase already uses to
 * avoid opening a database connection at import time — here it also avoids the cycle.
 */
async function defaultProducerFetch(
  capabilityId: string,
  verb: IntentVerb,
  context: IntelligenceContext,
  parameters?: Readonly<Record<string, unknown>>,
): Promise<IntentOutcome> {
  const { intelligencePlatform } = await import("../intelligence-platform.js");
  return intelligencePlatform.handle({ verb, capabilityId, parameters }, context);
}

async function collectFromProducers(
  context: IntelligenceContext,
  fetchProducer: ProducerFetch,
): Promise<{ opportunities: DeliverableOpportunity[]; sources: string[]; producers: ProducerContribution[] }> {
  const opportunities: DeliverableOpportunity[] = [];
  const sources: string[] = [];
  // DEC1 — per-producer accounting for the sealed decision. A reached producer
  // that offered nothing appears with `offered: 0`; an unreachable one is
  // honestly absent (it degraded — the decision never guesses what it had).
  const producers: ProducerContribution[] = [];

  for (const [capabilityId, source] of Object.entries(OPPORTUNITY_SOURCES)) {
    try {
      // MAT1 — ask for the CANDIDATE set, not the delivered set. See
      // PRODUCER_CANDIDATE_LIMIT: this is what lets LEARN1 below rank every
      // observation the household actually generated, rather than only the
      // top slice a producer happened to keep.
      const outcome = await fetchProducer(capabilityId, source.verb, context, {
        limit: PRODUCER_CANDIDATE_LIMIT,
      });
      if (outcome.status !== "ok") continue; // honest degrade — this producer has nothing right now

      let offered = 0;
      for (const raw of source.adapt(outcome.result)) {
        opportunities.push({
          id: `${capabilityId}:${raw.id}`,
          capabilityId,
          domain: raw.domain,
          type: raw.type,
          priority: raw.priority,
          explanation: raw.explanation,
          evidence: raw.evidence,
          suggestedAction: raw.suggestedAction,
          surface: selectSurface(raw.domain),
          subject: raw.subject,
        });
        offered += 1;
      }
      sources.push(capabilityId);
      producers.push({ capabilityId, offered });
    } catch {
      // Honest degrade: one producer's failure never blocks the others (mirrors
      // opportunity-engine.ts's independent per-domain try/catch discipline).
    }
  }

  return { opportunities, sources, producers };
}

const NO_LEARNING_INFLUENCE: OpportunityLearningInfluence = { confirmedUnderstandingCount: 0, influenced: [] };

function emptyBundle(now: Date, requestedLimit: number): OpportunityDeliveryBundle {
  return {
    opportunities: [],
    grouped: {},
    trust: { resolved: false },
    metadata: { assembledAt: now.toISOString(), sources: [], learning: NO_LEARNING_INFLUENCE },
    // Even the honest empty moment seals its decision — "nothing was suppressed
    // by decision" is a statement, not an absence (NK2 H5).
    decision: sealDeliveryDecision({
      producers: [],
      collected: 0,
      suppressedByMute: 0,
      suppressedByLifecycle: 0,
      suppressedByBudget: 0,
      requestedLimit,
      criticalDelivered: 0,
      delivered: 0,
      newlyPersisted: 0,
      acknowledgedDelivered: 0,
      learning: NO_LEARNING_INFLUENCE,
    }),
  };
}

export interface CollectOpportunitiesDeps {
  readonly store: IOpportunityDeliveryStore;
  readonly fetchProducer?: ProducerFetch;
  /** LEARN1 — reads the household's Confirmed Understanding. Omitted in production; injected by tests. */
  readonly fetchConfirmedUnderstanding?: ConfirmedUnderstandingFetch;
}

/**
 * Collect, dedupe, prioritise, group and (for newly-seen ids) persist the caller's
 * current opportunities across every registered producer. Always returns a complete
 * bundle — never throws. A caller with no user id yields an honest empty bundle;
 * every producer read degrades independently (progressive-enrichment discipline).
 */
export async function collectOpportunities(
  request: OpportunityDeliveryRequest,
  deps: CollectOpportunitiesDeps,
): Promise<OpportunityDeliveryBundle> {
  const now = new Date();
  const requestedLimit = request.limit ?? DELIVERY_DEFAULT_LIMIT;
  if (request.userId == null) return emptyBundle(now, requestedLimit);

  const userId = request.userId;
  const context: IntelligenceContext = { role: "user", userId: String(userId) };
  const fetchProducer = deps.fetchProducer ?? defaultProducerFetch;

  const { opportunities: collected, sources, producers } = await collectFromProducers(context, fetchProducer);

  const mutedTypes = await deps.store.getMutedOpportunityTypes(userId);
  const afterMute = filterMutedTypes(collected, mutedTypes);

  const existing = await deps.store.getRecords(userId, afterMute.map((o) => o.id));
  const { deliverable, toInsert } = partitionForDelivery(afterMute, existing);

  // LEARN1 — a household's own Confirmed Understanding re-weights the order of what
  // it is already eligible to be shown. An unreachable evidence store degrades to an
  // honest "nothing confirmed", which reorders nothing.
  const fetchUnderstanding = deps.fetchConfirmedUnderstanding ?? defaultConfirmedUnderstandingFetch;
  const understanding = await fetchUnderstanding(userId).catch((): readonly ConfirmedUnderstanding[] => []);

  // COACH1 — attach the household's own confirmed rationale to the advice it moved,
  // BEFORE prioritising, so the flat list and the grouped view carry the identical
  // objects. `withLearningEvidence` touches no field the sort reads (id, domain,
  // type, priority), so ordering is unchanged by the attachment itself.
  const explained = deliverable.map((o) => withLearningEvidence(o, understanding));

  const seenIds = seenOpportunityIds(existing);
  const { opportunities: prioritised, grouped } = prioritiseAndGroup(
    explained,
    requestedLimit,
    understanding,
    seenIds,
  );
  const influenced = prioritised.filter((o) => learningRankFor(o, understanding) !== 0).map((o) => o.id);

  const prioritisedIds = new Set(prioritised.map((o) => o.id));
  const toPersist = toInsert.filter((o) => prioritisedIds.has(o.id));
  if (toPersist.length > 0) {
    await deps.store.insertDelivered(
      toPersist.map((o) => ({
        userId,
        opportunityId: o.id,
        capabilityId: o.capabilityId,
        domain: o.domain,
        type: o.type,
        priority: o.priority,
        surface: o.surface,
      })),
    );
  }

  const learning: OpportunityLearningInfluence = {
    confirmedUnderstandingCount: understanding.length,
    influenced,
  };

  return {
    opportunities: prioritised,
    grouped,
    trust: { resolved: sources.length > 0 },
    metadata: {
      assembledAt: now.toISOString(),
      sources,
      learning,
    },
    // DEC1 — seal this delivery moment. Every count is the arithmetic of steps
    // already taken above; nothing is recomputed, guessed, or re-derived.
    decision: sealDeliveryDecision({
      producers,
      collected: collected.length,
      suppressedByMute: collected.length - afterMute.length,
      suppressedByLifecycle: afterMute.length - deliverable.length,
      suppressedByBudget: explained.length - prioritised.length,
      requestedLimit,
      criticalDelivered: prioritised.filter((o) => isCritical(o.priority)).length,
      delivered: prioritised.length,
      newlyPersisted: toPersist.length,
      acknowledgedDelivered: prioritised.filter((o) => seenIds.has(o.id)).length,
      learning,
    }),
  };
}

/**
 * Acknowledge, dismiss, or accept a previously-delivered opportunity. Returns `null`
 * (an honest gap, for the handler to surface) when this user has no delivery record
 * for the given opportunity id — you cannot resolve what was never delivered.
 * Idempotent: re-resolving an already-terminal (dismissed/accepted) record returns
 * its existing, unchanged resolution (mirrors companion_action_proposals' idempotent
 * double-confirm precedent).
 *
 * LEARN1 — this is the platform's first real Evidence reporter. A GENUINE transition
 * into a terminal status submits exactly one Evidence event through Rule EL2's one
 * door. Three conditions guard it, and each prevents a specific way the evidence log
 * could be corrupted into lying about a household:
 *
 *   • `transitioned` — an idempotent re-dismiss changes nothing, so it is not a
 *     second act of dismissal and must not become a second piece of Evidence.
 *     Without this, a client retry would inflate a household's apparent consistency.
 *   • a TERMINAL outcome — `acknowledged` means "seen", which is not an opinion.
 *   • the reporter never throws into the caller — resolving an opportunity is the
 *     user's action, and it succeeds or fails on its own terms. Evidence is a side
 *     effect of it, never a precondition for it.
 */
export async function resolveOpportunity(
  userId: number,
  opportunityId: string,
  targetStatus: Exclude<OpportunityDeliveryStatus, "delivered">,
  store: IOpportunityDeliveryStore,
  reportOutcome: OpportunityOutcomeReporter = defaultOutcomeReporter,
): Promise<OpportunityResolution | null> {
  const existing = await store.getRecord(userId, opportunityId);
  if (!existing) return null;

  const updated = isTerminalDeliveryStatus(existing.status as OpportunityDeliveryStatus)
    ? existing
    : await store.updateStatus(userId, opportunityId, targetStatus);

  const transitioned = updated.status !== existing.status;
  const outcome = TERMINAL_OUTCOME[updated.status as OpportunityDeliveryStatus];
  if (transitioned && outcome) {
    try {
      await reportOutcome({
        userId,
        domain: existing.domain,
        subjectType: OPPORTUNITY_SUBJECT_TYPE,
        subjectId: opportunityId,
        subjectKey: existing.type,
        outcomeType: outcome.outcomeType,
        direction: outcome.direction,
        context: {
          opportunityCapabilityId: existing.capabilityId,
          priority: existing.priority,
          surface: existing.surface,
        },
        sourceCapabilityId: OPPORTUNITY_DELIVERY_CAPABILITY_ID,
      });
    } catch {
      // The one-door helper is already total; this is the belt to its braces. A
      // reporter that somehow throws must still never fail the user's own action.
    }
  }

  return {
    opportunityId,
    status: updated.status as OpportunityDeliveryStatus,
    resolvedAt: updated.resolvedAt ? new Date(updated.resolvedAt).toISOString() : null,
  };
}
