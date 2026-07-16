/**
 * shared/home/home-primary-action.ts — the canonical Home Primary Action Resolver (HOME2)
 * =======================================================================================
 * The ONE implementation of Home's single primary action — "the door" in prose,
 * never as an identifier (HOME2 §2.5: "door" is already taken twice in DEC1).
 * Designed by docs/investigations/ux/HOME2_CANONICAL_HOME_DECISION_MODEL.md §4,
 * which closes NORTH1 §8.3 (Home has no primary action) — a conformance defect
 * against Experience Principle 4, not an architecture gap. No amendment, no new
 * fact, no schema change, and no new service were required to build it.
 *
 * WHAT THIS IS: a pure, total, deterministic RESOLVER over a fixed four-tier
 * ladder of canonical household state. It is a REFERENCE MECHANICS module in the
 * exact class ATTN1 established beside it (Core Principle 5) and that
 * `shared/attention/decision.ts` occupies (DEC1 §4): not a store, not a service,
 * not a capability, not an engine. PURE AND ZERO-I/O by construction — no clock,
 * no randomness, no persistence, no learning. The caller assembles `HomeState`
 * from the existing owners' read layers; this module reads nothing itself
 * (Observation Engine §4 rule 4 — "pure modules never record; their callers do").
 *
 * WHAT THIS IS NOT — the duplicate-engine hazard, settled first (HOME2 §2):
 * this is NOT a second Decision Engine, and NOT a `DecisionEngine.decide()`
 * (DEC1 §8). Nothing calls it to rank candidates; it ranks nothing. The proof is
 * structural, not stylistic:
 *
 *   The Decision Engine's output may legitimately be empty.
 *   The Home Primary Action may never be.
 *   A total function cannot be implemented by a partial one.
 *
 * They answer different questions. DEC1/INT20 ask "which of the things THA has
 * NOTICED deserve attention now?" — THA's judgement, product-initiated, silence a
 * first-class outcome (INT20 §4). This asks "where is THIS HOUSEHOLD most likely
 * trying to go?" — the household's own state, person-initiated, never empty.
 * Experience Principle 4 makes the distinction decisive: "the primary action is
 * the person's most likely intent, not the product's most desired behaviour." A
 * door aimed by DEC1's top-ranked opportunity would, by construction, be the
 * product's most desired behaviour — INVERTING the principle the door exists to
 * satisfy. So this module is a PEER of the Decision Engine, on exactly the
 * footing DEC1 §6 already blesses for the Silence Rules ("consumers or peers of
 * the Decision Engine's mechanics, never subordinates"). It consumes DEC1's
 * already-governed output at the safety tier and never reaches around it to a
 * producer's internals or to raw tables (the pattern INT20 §5.2 blesses); it
 * re-ranks nothing (ATTN1 A1), absorbs no Selection (DEC1 §3.1), and adds no
 * suppress/rank/budget path. It owns one budget at its own seam — MAX_DOORS = 1 —
 * exactly as the Silence Rules own MAX_NOTICES_PER_MOMENT at theirs.
 *
 * THE CLASS IT BELONGS TO: the Behaviour Engine's `resolveBehaviour` (INT21 §2.4,
 * §4.1) — "total: every input — null, an unknown id, a malformed value — resolves
 * to a registered voice… never to silence or a crash." This is that shape applied
 * to destinations instead of voices.
 *
 * WHY IT IS CALM — a theorem of the construction, not a rule imposed on top:
 *
 *   The door changes when the household's state changes,
 *   and never when THA's opinion changes.
 *
 * The ladder is fixed, reads only canonical facts, reads no clock, and learns
 * nothing. Therefore the door can only move when a FACT moves — and every fact it
 * reads is one the household themselves moved (they planned a meal, they checked
 * off an item, they dismissed a safety notice). There is no mechanism by which THA
 * can change its mind. A ladder cannot oscillate (a tier fires or it doesn't);
 * there are no weights, so there is nothing to tune, so there is no drift.
 *
 * WHAT IT MAY NEVER READ: `platform_observations`. The Observation Engine §7 names
 * routing FIRST — "any behaviour that reads an observation — ROUTING, permissions,
 * confirmation tiers, phrasing, notices, learning — stop." Its operational test
 * binds this module by construction: `OBS_DISABLE_CAPTURE=1` must always be a
 * no-op functionally. If disabling telemetry changed which door Home shows, this
 * resolver would be illegally reading telemetry. Consequence, stated once so it is
 * not rediscovered as a "missed opportunity": there is no most-clicked door, no
 * effectiveness feedback loop, no learned weighting, and no A/B-tuned ladder — not
 * because it would be hard, but because it is forbidden, and because it is the
 * exact mechanism by which a calm door would become a reactive one.
 *
 * THE WORDS ARE NOT THIS MODULE'S. It returns a destination and a tier; it returns
 * no label, no reason, and no greeting. Every user-facing string is registry
 * content voiced at the one Behaviour Engine seam (INT21 §0: "no other component
 * may reword, relabel, reorder-for-tone, or restyle what the platform has already
 * decided to say"). Composition order is non-negotiable (INT21 §7.2): "selection,
 * then phrasing — in that order, with nothing in between." This module selects;
 * the Behaviour Engine says it; the voice may never retarget it.
 *
 * NO CLOCK — and THA has none to give it. The server has no timezone on any table,
 * no `Intl.` call, and the planner has no calendar date field at all (HOME2 §1,
 * §8.1; TIME1). `TRANSLATION1` Morning Rhythm §8 — "the one primary action is
 * re-aimed by relevance across the day" — is law and is currently UNIMPLEMENTABLE.
 * That is a platform gap, not an architecture defect: the law is right, the facts
 * are absent. This resolver is deliberately TOTAL WITHOUT a clock, so the door
 * works today and time refines it later rather than enabling it. Clock-freedom is
 * not a compromise here — a door that cannot read the hour cannot jitter with it.
 *
 * Run tests: npx tsx server/tests/test-home2-home-primary-action.ts
 */

import { isCritical, type AttentionLevel } from "../attention/index.js";
import { orderByAttention, clampLimit, type AttentionOrdered } from "../attention/decision.js";

// ---------------------------------------------------------------------------
// The destination vocabulary — carried, never invented
// ---------------------------------------------------------------------------

/**
 * A room of the house this resolver may send the household to, named by the
 * DOMAIN the producers already use (`FoodOpportunityDomain` — "planner" |
 * "pantry" | "shopping", server/intelligence/food-intelligence/opportunity-engine.ts:116,
 * reaching the bundle verbatim as `owningDomain` at framework.ts:268). The same
 * three keys `DOMAIN_SURFACE` maps at framework.ts:293 and `DOMAIN_LANDING` at
 * companion-card.ts:170 — this module invents no fourth vocabulary.
 *
 * A DOMAIN, DELIBERATELY NOT A ROUTE. HOME2 §4.1 words the output as "the
 * canonical route of an existing room", but the canonical route is not this
 * module's fact to state: `domainLandingPath()` is already "the single place
 * ref/domain → THA path is decided" (client/src/components/conversation/companion-card.ts:162,
 * :196). Naming `/planner` here would create the second owner Architecture
 * Principle 2 forbids — so the resolver returns the domain and the caller resolves
 * the route through the existing owner. HOME2 is an investigation, not law, and
 * says so itself (§12: "where it and any governing document disagree, this
 * document is the defect").
 */
export type HomeDestination = "planner" | "shopping" | "pantry";

/**
 * The closed set of domains the house has a room for. An unmapped domain is an
 * honest gap, never a guess — the same stance `selectSurface` takes one module
 * away (framework.ts:299) and Core Principle 6 requires ("honest gaps over
 * invented facts").
 */
const KNOWN_DESTINATIONS: ReadonlySet<string> = new Set<HomeDestination>(["planner", "shopping", "pantry"]);

function isHomeDestination(domain: string): domain is HomeDestination {
  return KNOWN_DESTINATIONS.has(domain);
}

// ---------------------------------------------------------------------------
// The inputs — a structural view of facts other owners hold
// ---------------------------------------------------------------------------

/**
 * The subject an opportunity concerns, carried verbatim from the producer that
 * already knew it. Structurally identical to OD1's `OpportunitySubject`
 * (framework.ts:135) BY DESIGN and not by import: `shared/` may not import from
 * `server/`, and a caller passes its `DeliverableOpportunity[]` straight in
 * because TypeScript's structural typing already makes them the same shape. The
 * resolver does not interpret, key on, rank by, or dereference this — it carries
 * it, exactly as the Decision Engine does (framework.ts:124).
 */
export interface HomeActionSubject {
  readonly entity: string;
  readonly id: number;
  readonly label: string;
}

/**
 * One already-delivered opportunity from the Decision Engine's governed output.
 * `DeliverableOpportunity` (framework.ts:142) structurally satisfies this, so
 * Tier 0 consumes DEC1's bundle AS-IS — inheriting muting, lifecycle suppression,
 * de-duplication and dismissal for free (HOME2 §4.3).
 */
export interface HomeCriticalCandidate extends AttentionOrdered {
  readonly id: string;
  readonly type: string;
  /** The producer's own owning domain — carried verbatim, never re-derived. */
  readonly domain: string;
  readonly priority: AttentionLevel;
  readonly subject?: HomeActionSubject;
}

/**
 * The shape of the household's current week. `null` when the planner could not be
 * read — which costs Tiers 1 and 2 and costs the floor nothing (HOME2 §7.2 case 3:
 * "the floor requires no successful read — it is unconditional. This is what
 * 'total' buys").
 *
 * `weekNumber` is `max(weekNumber)` — "the highest-numbered week the household has
 * created", NOT the current calendar week (HOME2 §1; TIME1 found it is in fact the
 * constant 6 for any household past first touch). The door therefore says "your
 * week", which is true of the week the household is working on; it never claims
 * "today", which THA cannot know (HOME2 §7.2 case 9).
 */
export interface HomeWeekState {
  readonly weekNumber: number;
  readonly hasEmptyDays: boolean;
}

/** The shopping trip's state. `null` when the list could not be read — Tier 2 then cannot fire. */
export interface HomeShoppingState {
  readonly uncheckedCount: number;
}

/**
 * Everything the resolver may read, assembled by the caller from the four owners
 * HOME2 §5 maps — and nothing else. The absent facts are absent on purpose: meal
 * preparation state, household goals, active journeys, pantry freshness, household
 * reminders and the clock DO NOT EXIST in THA (HOME2 §3, §8.4). Six of the ten
 * inputs the model was asked to consider are not facts THA owns, so the model reads
 * none of them. Each is a clean extension point — a new rung, once the fact has an
 * owner. The ladder was designed to be extended by governance, not by drift.
 */
export interface HomeState {
  /**
   * DEC1's delivered bundle (`OpportunityDeliveryBundle.opportunities`). Pass it
   * as-is; the resolver filters for `critical` itself using ATTN1's own predicate.
   *
   * An empty array deliberately CONFLATES "no criticals exist" with "the producers
   * could not be reached" (`trust.resolved: false`), and the conflation is the
   * governed behaviour, not an oversight: HOME2 §7.2 case 2 rules that Tiers 1–3 are
   * unaffected by a producer outage because they read state directly, and that Tier 0
   * simply becomes unavailable — "a safety door the platform cannot see is not
   * claimed" (Experience Architecture §14 — degrade gracefully, and honestly). The
   * resolver is given no `trust` flag because there is nothing honest it could do
   * with one: it cannot invent a safety door it cannot see, and the remaining tiers
   * are already correct without it.
   */
  readonly criticals: readonly HomeCriticalCandidate[];
  readonly week: HomeWeekState | null;
  readonly shopping: HomeShoppingState | null;
}

// ---------------------------------------------------------------------------
// The output
// ---------------------------------------------------------------------------

/** Which rung matched — the whole explanation. A tier is one sentence; a weighted sum would be archaeology (HOME2 §4.4). */
export type HomePrimaryActionTier = 0 | 1 | 2 | 3;

/**
 * Did a real fact aim this door, or did the floor fire?
 *
 * PROVENANCE, NEVER QUALITY — the INT21 §2.4 discipline reused in spirit:
 * "confidence is 1 when an explicit, recognised preference resolved and 0 when the
 * platform default was applied instead. There is no middle value, because there is
 * no middle knowledge." A resolver over a deterministic ladder has no honest
 * confidence in its own ladder; it only knows whether a signal fired or the floor did.
 */
export type HomeActionProvenance = "signal" | "floor";

/**
 * The one door. A DEPARTURE, never an operation: Home is read-only in spirit, and
 * "acting on something means moving to that thing's canonical place" (Experience
 * Architecture §4; HOME1 §7.1). This returns where to go and why; it never returns
 * something to be done at Home, and it must not become a fourth card (HOME2 §9.9;
 * UIA §5 — exactly one primary-styled action per surface).
 */
export interface HomePrimaryAction {
  readonly tier: HomePrimaryActionTier;
  readonly destination: HomeDestination;
  readonly subject?: HomeActionSubject;
  readonly provenance: HomeActionProvenance;
}

// ---------------------------------------------------------------------------
// The budget and the floor
// ---------------------------------------------------------------------------

/**
 * This module's one budget, owned at its own seam — exactly as the Silence Rules
 * own MAX_NOTICES_PER_MOMENT at theirs (HOME2 §2.4). Home has exactly one door:
 * never 0 (the floor guarantees it), never 2.
 */
export const MAX_DOORS = 1;

/**
 * The floor's destination. The floor is what makes the function total, and it is
 * HONEST, NOT FILLER: a household with a planned week, a clear list and no safety
 * issue is not shown a manufactured task — it is shown THEIR OWN WEEK, which is the
 * truthful answer to "what's next?" (Experience Architecture §4). That is the
 * distinction that matters: filler invents content to fill a space (forbidden —
 * Blueprint §12.1 rule 3; Experience Language Principle 8); a floor routes to
 * content that already exists.
 */
export const HOME_FLOOR_DESTINATION: HomeDestination = "planner";

// ---------------------------------------------------------------------------
// The resolver
// ---------------------------------------------------------------------------

/**
 * Resolve Home's single primary action from canonical household state.
 *
 * A LADDER, NOT A SCORE. First match wins. The tiers are a TOTAL ORDER, so two
 * tiers can never tie and a conflict is impossible by construction (HOME2 §7.1) —
 * there is no conflict-resolution algorithm here because there is nothing to
 * resolve. A weighted score was considered and refused on four counts (HOME2 §4.4):
 * it is a second ranking system (DEC1 §4 calls a module-local sort "an architecture
 * violation"); it oscillates near thresholds — the exact "reactive" failure to be
 * avoided; it cannot explain itself (NK2 H5 requires every guidance decision be
 * explainable); and it invites tuning, and tuning is drift.
 *
 * THE LADDER IS NOT AN INVENTED PRIORITY. It is the household's own sequence — the
 * path Experience Architecture §10 already describes from "what's for dinner this
 * week?" to resolution: you make sure it's safe, you plan, you shop. None of it is
 * THA's preference about what the household should care about.
 *
 *   Tier 0  Safety          a `critical` opportunity is live in DEC1's governed output
 *   Tier 1  Week unplanned  the current week has empty days            → Planner
 *   Tier 2  Trip pending    week full AND the list has unchecked items → Shopping
 *   Tier 3  The floor       always                                     → Planner
 *
 * Tier 1 before Tier 2 — PLAN BEFORE SHOP. If the week isn't planned the list is
 * incomplete, so shopping now means shopping wrong. The household's real sequence,
 * not a preference.
 *
 * TOTAL: every input — empty, broken, unresolved — yields exactly one action. If
 * every read failed and every list is empty, the floor fires. Never zero.
 */
export function resolveHomePrimaryAction(state: HomeState): HomePrimaryAction {
  // -- Tier 0: Safety -------------------------------------------------------
  //
  // Rule T0's additive face (shared/attention/index.ts:40-43): "never fail to
  // surface an unsafe thing the household already has." This is the one place the
  // product's judgement legitimately aims the door — and only because it isn't the
  // product's judgement: `shopping-restriction-conflict` says *the household's own
  // shopping list contains something unsafe for their own household member*. That
  // is a fact about their state, not an opinion about their priorities.
  //
  // Tier 0's legitimacy is exactly as strong as CRITICAL_TYPES' closedness and no
  // stronger (HOME2 §4.2). The allowlist has exactly one member today
  // (shared/attention/index.ts:89), is governance-gated, and throws on violation.
  // If it ever grows to admit something that is not Rule-T0-backed, Tier 0 becomes
  // a marketing channel at the threshold and this model becomes unsafe. Any future
  // CRITICAL_TYPES review must know Home's door is downstream of it.
  //
  // `isCritical` is ATTN1's vocabulary, never a local level check (A1: attention is
  // producer-assigned and never re-derived here). A critical whose domain the house
  // has no room for cannot be aimed at anything, so it does not fire: Tier 0
  // degrades silently and honestly, and a safety door the platform cannot see is
  // not claimed (HOME2 §7.2 case 2; Experience Architecture §14).
  const aimable = state.criticals.filter(
    (candidate) => isCritical(candidate.priority) && isHomeDestination(candidate.domain),
  );

  if (aimable.length > 0) {
    // The one genuine tie — two live criticals — resolved by REUSING the canonical
    // mechanics, not by writing new ones (HOME2 §7.1, §9.3). No tie-breakers are
    // passed deliberately: the learning and seen keys are the framework's and were
    // already applied to this bundle, so arrival order here IS DEC1's governed order
    // (framework.ts:662) and re-ordering with attention-first preserves it.
    const ordered = orderByAttention(aimable);
    const admitted = ordered.slice(0, clampLimit(MAX_DOORS));
    const top = admitted[0]!;

    return {
      tier: 0,
      // Carried verbatim from the producer's own `owningDomain` — no new vocabulary,
      // no entity mapping, nothing re-derived.
      destination: top.domain as HomeDestination,
      ...(top.subject ? { subject: top.subject } : {}),
      provenance: "signal",
    };
  }

  // -- Tier 1: the week is unplanned ---------------------------------------
  //
  // Read directly from the Planner's own read layer (SoT Domain 14). Multiple
  // readers of one table are explicitly OK provided none re-derives — Canonical
  // Publication Architecture, Variant 3.
  //
  // Muting deliberately does NOT reach here. `mutedOpportunityTypes` is keyed on
  // opportunity type and means "stop telling me about empty days" — it does not mean
  // "never send me to the Planner". A household that muted empty-day NOTICES still
  // needs a Planner DOOR when their week is empty. Routing a door through the mute
  // list would over-apply a rule beyond its scope (HOME2 §4.3, §7.2 case 7). This is
  // not a new rule; it is the existing rule's scope.
  if (state.week !== null && state.week.hasEmptyDays) {
    return { tier: 1, destination: "planner", provenance: "signal" };
  }

  // -- Tier 2: the trip is pending -----------------------------------------
  //
  // Requires the week to be READ AND FULL — not merely "not known to be empty". An
  // unreadable planner cannot satisfy "the week has no empty days", so it falls
  // through to the floor rather than guessing (Core Principle 6).
  if (state.week !== null && !state.week.hasEmptyDays && state.shopping !== null && state.shopping.uncheckedCount > 0) {
    return { tier: 2, destination: "shopping", provenance: "signal" };
  }

  // -- Tier 3: the floor ----------------------------------------------------
  //
  // Unconditional. Requires no successful read, no state, and no signal. This is
  // the line that makes the function total and the reason it can never be empty —
  // the `resolveBehaviour` fail-safe default applied to destinations (INT21 §4.1):
  // "never to silence or a crash."
  return { tier: 3, destination: HOME_FLOOR_DESTINATION, provenance: "floor" };
}
