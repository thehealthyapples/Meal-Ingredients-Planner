/**
 * Opportunity Delivery Framework (OD1)
 * ====================================
 * The canonical, cross-cutting framework governing how Domain Intelligence
 * opportunities are prioritised, grouped, deduplicated, surface-selected and
 * delivered across the platform. It sits ABOVE any number of Domain Intelligence
 * "opportunity producers" — today exactly one, FI4's Food Opportunity Engine
 * (`food-intelligence`'s `report` verb) — and adds the governance FI4 explicitly
 * left out: cross-producer prioritise+group, duplicate-delivery prevention, a
 * deterministic delivery surface, and acknowledge/dismiss/accept.
 *
 * GOVERNING ARCHITECTURE: docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md
 * (capability/intent/permission model this framework reuses unchanged) and
 * docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md (the one existing
 * Domain Intelligence producer this framework fans out to today). This module owns
 * ZERO business-domain data (Rule FI1) and zero producer reasoning — every
 * opportunity's explanation/evidence/suggestedAction is a verbatim projection of
 * what the producing capability already returned via the ordinary, registered
 * Intent Engine path (`intelligencePlatform.handle()`); this framework never
 * re-derives or second-guesses a producer's own reasoning.
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

import type { IntentVerb, IntelligenceContext, IntentOutcome } from "../types.js";
import type { ConversationSurface } from "../conversation/conversation-store.js";
import type {
  IOpportunityDeliveryStore,
  OpportunityDeliveryStatus,
} from "./delivery-store.js";
import { isTerminalDeliveryStatus } from "./delivery-store.js";

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type OpportunityPriority = "high" | "medium" | "low";

export interface OpportunityEvidence {
  readonly source: string;
  readonly detail: string;
}

/** One opportunity ready for delivery — a generic envelope over any producer's own opportunity shape. */
export interface DeliverableOpportunity {
  /** Globally unique across producers: `${capabilityId}:${producer's own opportunity id}`. */
  readonly id: string;
  readonly capabilityId: string;
  readonly domain: string;
  readonly type: string;
  readonly priority: OpportunityPriority;
  readonly explanation: string;
  readonly evidence: readonly OpportunityEvidence[];
  readonly suggestedAction: string;
  readonly surface: ConversationSurface;
}

export interface OpportunityDeliveryTrust {
  /** True only when at least one producer capability was successfully reached this call. */
  readonly resolved: boolean;
}

export interface OpportunityDeliveryBundle {
  /** Flat, prioritised, capped list — the primary delivery shape. */
  readonly opportunities: readonly DeliverableOpportunity[];
  /** The same delivered set, partitioned by owning domain. */
  readonly grouped: Readonly<Record<string, readonly DeliverableOpportunity[]>>;
  readonly trust: OpportunityDeliveryTrust;
  readonly metadata: { readonly assembledAt: string; readonly sources: readonly string[] };
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
  readonly priority: OpportunityPriority;
  readonly explanation: string;
  readonly evidence: readonly OpportunityEvidence[];
  readonly suggestedAction: string;
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
    if (rec.priority !== "high" && rec.priority !== "medium" && rec.priority !== "low") continue;
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
};

/** An unmapped domain is an honest gap, never a guess — it falls back to the Companion's own floating surface. */
const FALLBACK_SURFACE: ConversationSurface = "floating";

export function selectSurface(domain: string): ConversationSurface {
  return DOMAIN_SURFACE[domain] ?? FALLBACK_SURFACE;
}

// ---------------------------------------------------------------------------
// Preference filtering — pure
// ---------------------------------------------------------------------------

/** Removes any opportunity whose `type` the caller has muted in their own preferences. */
export function filterMutedTypes(
  opportunities: readonly DeliverableOpportunity[],
  mutedTypes: readonly string[],
): DeliverableOpportunity[] {
  if (mutedTypes.length === 0) return [...opportunities];
  const muted = new Set(mutedTypes);
  return opportunities.filter((o) => !muted.has(o.type));
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

const PRIORITY_RANK: Readonly<Record<OpportunityPriority, number>> = { high: 0, medium: 1, low: 2 };

export interface PrioritisedOpportunities {
  readonly opportunities: readonly DeliverableOpportunity[];
  readonly grouped: Readonly<Record<string, readonly DeliverableOpportunity[]>>;
}

/**
 * Stable-sorts the MERGED, cross-producer opportunity list by priority (high ->
 * medium -> low), preserving arrival order within a tier (mirrors FI4's own
 * `prioritizeOpportunities`, extended to operate across producers rather than
 * within one), clamps to `limit`, then groups the surviving set by owning domain.
 * PURE — no I/O, no randomness, no clock reads.
 */
export function prioritiseAndGroup(
  opportunities: readonly DeliverableOpportunity[],
  limit: number = DEFAULT_LIMIT,
): PrioritisedOpportunities {
  const clampedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const prioritised = opportunities
    .map((opportunity, index) => ({ opportunity, index }))
    .sort((a, b) => {
      const rankDiff = PRIORITY_RANK[a.opportunity.priority] - PRIORITY_RANK[b.opportunity.priority];
      if (rankDiff !== 0) return rankDiff;
      return a.index - b.index;
    })
    .slice(0, clampedLimit)
    .map(({ opportunity }) => opportunity);

  const grouped: Record<string, DeliverableOpportunity[]> = {};
  for (const opportunity of prioritised) {
    (grouped[opportunity.domain] ??= []).push(opportunity);
  }

  return { opportunities: prioritised, grouped };
}

// ---------------------------------------------------------------------------
// I/O orchestration — fan out to producers, then call the pure core
// ---------------------------------------------------------------------------

/** Fetches one producer's raw platform outcome. Injectable so tests never touch the real platform/DB. */
export type ProducerFetch = (
  capabilityId: string,
  verb: IntentVerb,
  context: IntelligenceContext,
) => Promise<IntentOutcome>;

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
): Promise<IntentOutcome> {
  const { intelligencePlatform } = await import("../intelligence-platform.js");
  return intelligencePlatform.handle({ verb, capabilityId }, context);
}

async function collectFromProducers(
  context: IntelligenceContext,
  fetchProducer: ProducerFetch,
): Promise<{ opportunities: DeliverableOpportunity[]; sources: string[] }> {
  const opportunities: DeliverableOpportunity[] = [];
  const sources: string[] = [];

  for (const [capabilityId, source] of Object.entries(OPPORTUNITY_SOURCES)) {
    try {
      const outcome = await fetchProducer(capabilityId, source.verb, context);
      if (outcome.status !== "ok") continue; // honest degrade — this producer has nothing right now

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
        });
      }
      sources.push(capabilityId);
    } catch {
      // Honest degrade: one producer's failure never blocks the others (mirrors
      // opportunity-engine.ts's independent per-domain try/catch discipline).
    }
  }

  return { opportunities, sources };
}

function emptyBundle(now: Date): OpportunityDeliveryBundle {
  return {
    opportunities: [],
    grouped: {},
    trust: { resolved: false },
    metadata: { assembledAt: now.toISOString(), sources: [] },
  };
}

export interface CollectOpportunitiesDeps {
  readonly store: IOpportunityDeliveryStore;
  readonly fetchProducer?: ProducerFetch;
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
  if (request.userId == null) return emptyBundle(now);

  const userId = request.userId;
  const context: IntelligenceContext = { role: "user", userId: String(userId) };
  const fetchProducer = deps.fetchProducer ?? defaultProducerFetch;

  const { opportunities: collected, sources } = await collectFromProducers(context, fetchProducer);

  const mutedTypes = await deps.store.getMutedOpportunityTypes(userId);
  const afterMute = filterMutedTypes(collected, mutedTypes);

  const existing = await deps.store.getRecords(userId, afterMute.map((o) => o.id));
  const { deliverable, toInsert } = partitionForDelivery(afterMute, existing);

  const { opportunities: prioritised, grouped } = prioritiseAndGroup(deliverable, request.limit ?? DEFAULT_LIMIT);

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

  return {
    opportunities: prioritised,
    grouped,
    trust: { resolved: sources.length > 0 },
    metadata: { assembledAt: now.toISOString(), sources },
  };
}

/**
 * Acknowledge, dismiss, or accept a previously-delivered opportunity. Returns `null`
 * (an honest gap, for the handler to surface) when this user has no delivery record
 * for the given opportunity id — you cannot resolve what was never delivered.
 * Idempotent: re-resolving an already-terminal (dismissed/accepted) record returns
 * its existing, unchanged resolution (mirrors companion_action_proposals' idempotent
 * double-confirm precedent).
 */
export async function resolveOpportunity(
  userId: number,
  opportunityId: string,
  targetStatus: Exclude<OpportunityDeliveryStatus, "delivered">,
  store: IOpportunityDeliveryStore,
): Promise<OpportunityResolution | null> {
  const existing = await store.getRecord(userId, opportunityId);
  if (!existing) return null;

  const updated = isTerminalDeliveryStatus(existing.status as OpportunityDeliveryStatus)
    ? existing
    : await store.updateStatus(userId, opportunityId, targetStatus);

  return {
    opportunityId,
    status: updated.status as OpportunityDeliveryStatus,
    resolvedAt: updated.resolvedAt ? new Date(updated.resolvedAt).toISOString() : null,
  };
}
