/**
 * notice-engine.ts — EWX1 Living Companion Experience, Stage 1
 * =========================================================================
 * The Companion **Notice Engine** (EWX1) — ambient notices under the
 * Silence Rules.
 * Renamed from observation-engine.ts under OBS1 (2026-07-08) — the Observation Engine name now belongs to the platform telemetry service.
 *
 * "Notices should be generated from existing platform intelligence...
 *  Notices must never fabricate knowledge."
 *
 * This module contains NO new business logic and performs NO reasoning of
 * its own. It is a thin, pure ADAPTER that wraps facts already computed by
 * existing, unmodified owners into one common `Notice` shape, so the
 * Companion can voice them consistently (via behaviour-engine.ts's
 * `phraseNotice`) wherever it is present in the platform (Stage 7).
 *
 * EVERY fact a Notice carries traces to an existing owner:
 *   - nutrition-trend      → companion-growth.ts's `computeGrowthSignal`
 *                            (EWO2 Stage 7 — reads `storage.getUserHealthTrends`)
 *   - streak-milestone     → `storage.getUserStreak` (existing table, INT/streak
 *                            feature — read-only here, never written)
 *   - diversity-milestone  → `assembleNutritionCentre`'s `plantDiversity`
 *                            (WX8 — existing, all-time, household-owned count)
 *   - planner-gap / pantry-opportunity / shopping-opportunity
 *                          → the `opportunity-delivery` capability (OD1/FI4),
 *                            called through the SAME `intelligencePlatform.
 *                            handle()` path FI5's route already uses — every
 *                            field is a VERBATIM projection of what that
 *                            capability already produced. This module never
 *                            rewords or re-derives an opportunity's content.
 *                            COACH1: that projection now includes the
 *                            producer's `evidence` array, previously dropped,
 *                            and an opportunity that cites nothing is dropped
 *                            rather than surfaced uncited (Rule E1).
 *
 * COACH1 — every Notice additionally carries `source`, naming the existing owner its
 * fact was read from. This is provenance, not content: it adds no fact, no metric and
 * no judgement, and lets any surface answer "which owner said this?" for every notice
 * category rather than only for opportunities. The engine still concludes nothing.
 *   - seasonal-highlight   → `shared/seasonal/engine.ts`'s `seasonalStories()`
 *                            (WS11 — already read by the Home Intelligence and
 *                            Planner Intelligence Strip routes; the Companion
 *                            is its third consuming surface, IA2). This module
 *                            never calls `seasonalStories()` itself — the
 *                            caller (server/routes.ts) does, exactly as it
 *                            already does for the other four sources, and
 *                            hands this producer only the one already-chosen
 *                            headline string.
 *
 * HARD INVARIANT (mirrors EWO1 §5 / EWO2's Core Principle, extended to
 * notices): a Notice may summarise or select from data that
 * already exists. It may NEVER compute a new metric, invent a threshold that
 * implies more certainty than the underlying data supports, or claim a
 * "just happened" milestone the platform cannot actually date. Where the
 * underlying data is cumulative/all-time (diversity), the Notice is
 * phrased as a present-state fact, never as "you just achieved this".
 *
 * SILENCE RULES (Stage 6) live here too — `applySilenceRules` is a pure,
 * stateless filter (no new persisted state, no new table) that:
 *   - drops any notice whose underlying signal was thin/absent (never
 *     surfaces a guess)
 *   - only lets a milestone-shaped notice (streak/diversity) through
 *     when the number is a "notable" round figure — a stateless, honest
 *     heuristic for "worth mentioning", not a fabricated "you just crossed
 *     this" claim (this module cannot know exactly when a threshold was
 *     crossed without new persisted state — see SUGGESTIONS in the EWX1 doc)
 *   - caps the total number of notices returned per gather, so the
 *     Companion never reads as a notification feed
 *   - de-duplicates by id
 *
 * Run tests: npx tsx server/tests/test-intelligence-notice-engine.ts
 */

import type { UserHealthTrend, UserStreak } from "../../../shared/schema.js";
// ATTN1 — the one canonical Attention vocabulary. shared/attention is PURE and
// zero-I/O, so this import keeps the adapter's zero-dependency footprint on the
// platform's I/O modules intact (the rationale that used to justify a local
// `NoticePriority` union, now retired under Principle 8).
import { type AttentionLevel } from "../../../shared/attention/index.js";
// DEC1 — the one canonical Decision mechanics (same zero-I/O argument as the
// vocabulary above). The Silence Rules below stay this module's own governed
// seam (INT20) — they CONSUME the shared rank/dedupe mechanics; the local sort
// and dedupe they used to carry are retired (Principle 8).
import {
  dedupeById,
  orderByAttention,
  type EvidenceCitation,
} from "../../../shared/attention/decision.js";
import {
  computeGrowthSignal,
  toGrowthPhraseInputs,
  type GrowthSignal,
} from "./companion-growth.js";
import type { GrowthPhraseInputs } from "./personality-registry.js";

// ---------------------------------------------------------------------------
// Notice shape
// ---------------------------------------------------------------------------

/**
 * The closed set of notice categories (Stage 1 examples from the brief,
 * minus the ones with no existing, honest data source — see the EWX1 doc's
 * Trust Validation for which brief examples were NOT implemented and why).
 */
export type NoticeCategory =
  | "nutrition-trend"
  | "streak-milestone"
  | "diversity-milestone"
  | "planner-gap"
  | "pantry-opportunity"
  | "shopping-opportunity"
  | "seasonal-highlight"
  // PHASE5E (NTC-P4) — the eighth category. Named as the natural next source by the
  // Notice Engine Architecture §2.2 ("a CONFIRMED EL1 learning signal … enters through
  // the same shape — a registered capability (`evidence-learning`) read via the
  // platform, adapted verbatim — and only for signals with `status = confirmed`"), and
  // gated by its §8 rollout as NTC-P4. This workstream is that gate.
  //
  // It has a registered owner (the `evidence-learning` capability), which is the §9
  // condition on any new category: "any new notice category without a registered owner
  // behind it — stop."
  | "household-learning";


/**
 * COACH1 — one supporting fact, copied verbatim from the producing owner.
 * DEC1 — an alias of the one canonical `EvidenceCitation`
 * (shared/attention/decision.ts, pure `shared/` code — not an I/O dependency).
 * The local re-declaration this used to be, justified by the zero-dependency
 * footprint ATTN1's shared-module argument already dissolved, is retired
 * (Principle 8).
 */
export type NoticeEvidence = EvidenceCitation;

export interface Notice {
  readonly id: string;
  readonly category: NoticeCategory;
  readonly priority: AttentionLevel;
  /**
   * COACH1 — the named, existing owner this notice's fact was read from. Provenance,
   * never content: no notice can exist without one, so "which owner said this?" is
   * always answerable at the surface, for every category rather than only for
   * opportunities. This module never invents a source; each producer states its own.
   */
  readonly source: string;
  /**
   * The verified fact this notice carries, in the SAME shape the source
   * owner already produced it — never a value this module computed itself,
   * except `growth` (a straight pass of companion-growth.ts's own signal).
   */
  readonly fact:
    | { readonly kind: "growth"; readonly signal: GrowthSignal }
    | { readonly kind: "streak"; readonly currentStreak: number; readonly bestStreak: number }
    | { readonly kind: "diversity"; readonly plantCount: number }
    | {
        readonly kind: "opportunity";
        readonly explanation: string;
        readonly suggestedAction: string;
        /** COACH1 — the producer's own evidence, verbatim and in order. Never empty (see `noticeOpportunities`). */
        readonly evidence: readonly NoticeEvidence[];
      }
    | { readonly kind: "seasonal"; readonly headline: string }
    /**
     * PHASE5E (NTC-P4) — something the household has CONFIRMED about itself.
     *
     * Every field is EL1's, verbatim. `rationale` is the sentence EL1 already wrote to
     * explain itself (ET6 — "every understanding explains itself"); this engine does
     * not compose it, shorten it, or soften it. `evidenceCount` and `confidence` are
     * EL1's own, produced behind its ≥3-events / ≥0.7-consistency gates.
     *
     * The boundary that keeps this honest: **a notice never becomes a preference, and a
     * preference is only ever noticed once the household confirmed it.** A
     * `pending_confirmation` signal is a QUESTION for the household (it belongs on the
     * Profile's learning panel, where it can be answered) — never a notice. THA does
     * not tell a household what it has learned about them until they have agreed it is
     * true.
     */
    | {
        readonly kind: "learning";
        readonly rationale: string;
        readonly direction: "positive" | "negative";
        readonly confidence: "low" | "medium" | "high";
        readonly evidenceCount: number;
      };
}

/**
 * COACH1 — the named owners behind each notice category. Every string here is an
 * existing, registered owner that some producer below actually read; none is a
 * label invented for display.
 */
export const NOTICE_SOURCE = {
  healthTrends: "user_health_trends",
  streak: "user_streaks",
  nutritionCentre: "nutrition-centre",
  opportunityDelivery: "opportunity-delivery",
  seasonalStories: "seasonal-stories",
  /**
   * PHASE5E (NTC-P4) — the `evidence-learning` capability (EL1). The SAME source string
   * OD1's `withLearningEvidence` already cites when household learning moves an
   * opportunity's rank, so "which owner said this?" answers identically whether the
   * learning influenced a ranking or produced a notice of its own.
   */
  evidenceLearning: "household-learning",
} as const;

// ---------------------------------------------------------------------------
// Producers — one per existing data source, each a pure function over
// already-fetched rows (mirrors opportunity-engine.ts's own "pure reasoning
// core, thin I/O orchestrator" split so every rule here is unit-testable
// without a database).
// ---------------------------------------------------------------------------

/** Wraps companion-growth.ts's own signal — returns [] on the honest null (thin data). */
export function noticeNutritionTrend(trends: readonly UserHealthTrend[], now: Date = new Date()): Notice[] {
  const signal = computeGrowthSignal(trends, now);
  if (!signal) return [];
  return [
    {
      id: "nutrition-trend",
      category: "nutrition-trend",
      priority: "low",
      source: NOTICE_SOURCE.healthTrends,
      fact: { kind: "growth", signal },
    },
  ];
}

/**
 * A streak is "notable" (worth mentioning) only at a round multiple — a
 * stateless heuristic for what deserves a moment, not a persisted
 * "just crossed" detector (see module header). Zero/undefined streak is
 * silence, not a fabricated "starting from zero" notice.
 */
const STREAK_NOTABLE_MULTIPLE = 7;

export function noticeStreak(streak: UserStreak | undefined): Notice[] {
  if (!streak || streak.currentEliteStreak <= 0) return [];
  if (streak.currentEliteStreak % STREAK_NOTABLE_MULTIPLE !== 0) return [];
  return [
    {
      id: "streak-milestone",
      category: "streak-milestone",
      priority: "medium",
      source: NOTICE_SOURCE.streak,
      fact: {
        kind: "streak",
        currentStreak: streak.currentEliteStreak,
        bestStreak: streak.bestEliteStreak,
      },
    },
  ];
}

/** Same "notable round number" discipline as noticeStreak, applied to the household's all-time plant count. */
const DIVERSITY_NOTABLE_MULTIPLE = 10;

export function noticeDiversity(plantDiversity: number): Notice[] {
  if (plantDiversity <= 0) return [];
  if (plantDiversity % DIVERSITY_NOTABLE_MULTIPLE !== 0) return [];
  return [
    {
      id: "diversity-milestone",
      category: "diversity-milestone",
      priority: "low",
      source: NOTICE_SOURCE.nutritionCentre,
      fact: { kind: "diversity", plantCount: plantDiversity },
    },
  ];
}

/**
 * A single already-produced Food Opportunity (OD1's `DeliverableOpportunity`,
 * `server/intelligence/opportunity-delivery/framework.ts`) — the SAME shape
 * FI5's `/api/intelligence/food-opportunities` route already returns.
 * `domain` selects the Notice category — content is copied verbatim,
 * never reworded (Trust: "every opportunity's content is a verbatim
 * projection of what a registered producer capability already returned").
 * An unmapped domain is an honest no-op (filtered out), never a guess.
 *
 * COACH1 — `evidence` is optional on the INPUT only, because an upstream producer
 * that supplies none is a producer that has cited nothing. Such an opportunity is
 * dropped rather than surfaced uncited (see `noticeOpportunities`), so `evidence` is
 * required on the OUTPUT fact. That asymmetry is Rule E1 ("no citation, no card")
 * made structural at the coaching boundary.
 */
export interface OpportunityLike {
  readonly id: string;
  readonly domain: string;
  readonly priority: AttentionLevel;
  readonly explanation: string;
  readonly suggestedAction: string;
  readonly evidence?: readonly NoticeEvidence[];
}

const DOMAIN_TO_CATEGORY: Readonly<Record<string, NoticeCategory>> = {
  planner: "planner-gap",
  pantry: "pantry-opportunity",
  shopping: "shopping-opportunity",
};

/**
 * COACH1 changes this producer in exactly two ways, and adds no reasoning to it:
 *
 *  1. `evidence` is carried through, verbatim and in order. Before COACH1 this
 *     adapter copied `explanation` and `suggestedAction` and silently discarded the
 *     producer's `evidence` array, so no coaching notice could ever say where its
 *     claim came from. Carrying it is a wider verbatim projection, not a new fact —
 *     it makes the module header's existing promise true for the whole opportunity
 *     rather than for two of its three content fields.
 *
 *  2. An opportunity carrying NO evidence is dropped, exactly as an unmapped domain
 *     already is. Both are the same honest no-op: the engine surfaces what a named
 *     owner supplied, and stays silent otherwise. This is a filter, never a
 *     judgement — no metric, threshold, cluster or ranking is introduced (the
 *     Notice Engine's §9 stop rule), and no opportunity's content is examined.
 *
 * FI4's own generators each attach at least one evidence entry, so in production
 * this drop is unreachable. It exists so that a future producer cannot make the
 * platform assert something uncited merely by forgetting to cite it.
 */
export function noticeOpportunities(opportunities: readonly OpportunityLike[]): Notice[] {
  const result: Notice[] = [];
  for (const o of opportunities) {
    const category = DOMAIN_TO_CATEGORY[o.domain];
    if (!category) continue;

    const evidence = o.evidence ?? [];
    if (evidence.length === 0) continue; // Rule E1 — no citation, no card.

    result.push({
      id: `opportunity:${o.id}`,
      category,
      priority: o.priority,
      source: NOTICE_SOURCE.opportunityDelivery,
      fact: {
        kind: "opportunity",
        explanation: o.explanation,
        suggestedAction: o.suggestedAction,
        evidence,
      },
    });
  }
  return result;
}

/**
 * PHASE5E (NTC-P4) — one CONFIRMED household learning signal, as EL1 produced it.
 *
 * The shape this accepts is EL1's `HouseholdLearningSignal` narrowed to the fields a
 * notice carries. It is declared structurally (rather than importing the row type) for
 * the same reason `OpportunityLike` is: this module performs no I/O and must not depend
 * on a store's module graph.
 */
export interface ConfirmedLearningLike {
  readonly id: number;
  readonly domain: string;
  readonly subjectKey: string;
  readonly direction: "positive" | "negative";
  readonly confidence: "low" | "medium" | "high";
  readonly evidenceCount: number;
  readonly rationale: string;
  /** EL1's lifecycle status. Anything other than "confirmed" is dropped — see below. */
  readonly status: string;
}

/**
 * PHASE5E (NTC-P4) — adapt confirmed household learning into notices.
 *
 * This producer concludes NOTHING. It applies exactly two filters, and both are the
 * same honest no-op the other producers already make:
 *
 *   1. **Not confirmed → dropped.** The Notice Engine Architecture §2.2 is explicit:
 *      "only for signals with `status = confirmed`. A `pending_confirmation` signal is
 *      a question for the household, not a notice." The route asks EL1 for confirmed
 *      signals only; this filter is the structural guarantee that a future caller
 *      passing the wrong query cannot make THA announce a preference the household
 *      never agreed to. Belt and braces, deliberately — this is the one notice category
 *      that speaks about the household to the household, and getting it wrong is
 *      uniquely corrosive ("THA thinks we hate fish"; we never said that).
 *
 *   2. **No rationale → dropped.** Rule E1, "no citation, no card", enforced exactly as
 *      `noticeOpportunities` enforces it. EL1 always writes a rationale (ET6), so in
 *      production this is unreachable; it exists so a future change cannot make the
 *      platform assert something uncited merely by forgetting to cite it.
 *
 * No threshold is introduced here. EL1's gates (≥3 consistent events, ≥0.7 consistency,
 * a 90-day window, and the household's own explicit confirmation) already decided that
 * this is true. This module decides only that it is *sayable*.
 *
 * Priority is `low`, always. A confirmed preference is a calm, informational fact about
 * the household — never a demand for attention, and never (A2) a `critical`.
 */
export function noticeLearning(signals: readonly ConfirmedLearningLike[]): Notice[] {
  const result: Notice[] = [];
  for (const s of signals) {
    if (s.status !== "confirmed") continue;

    const rationale = s.rationale?.trim() ?? "";
    if (rationale.length === 0) continue; // Rule E1 — no citation, no card.

    result.push({
      id: `household-learning:${s.id}`,
      category: "household-learning",
      priority: "low",
      source: NOTICE_SOURCE.evidenceLearning,
      fact: {
        kind: "learning",
        rationale,
        direction: s.direction,
        confidence: s.confidence,
        evidenceCount: s.evidenceCount,
      },
    });
  }
  return result;
}

/**
 * Wraps a single already-chosen seasonal headline (WS11's `seasonalStories()`
 * — the SAME derivation `/api/home/intelligence` and
 * `/api/planner/weeks/:weekId/intelligence` already compute) into a
 * Notice. `headline` is `null` when the season has nothing worth
 * mentioning yet (WS11's own "not enough of a season yet — staying silent"
 * discipline) — an honest no-op, never a guess. This is a pure pass-through:
 * the caller derives the headline, this function only shapes it.
 */
export function noticeSeasonal(headline: string | null): Notice[] {
  if (!headline) return [];
  return [
    {
      id: "seasonal-highlight",
      category: "seasonal-highlight",
      priority: "low",
      source: NOTICE_SOURCE.seasonalStories,
      fact: { kind: "seasonal", headline },
    },
  ];
}

// ---------------------------------------------------------------------------
// Silence Rules (Stage 6) — a pure, stateless filter over an already-gathered
// list. See module header for what this can and cannot detect without new
// persisted state.
// ---------------------------------------------------------------------------

export const MAX_NOTICES_PER_MOMENT = 2;

/**
 * De-duplicates by id, ranks by attention (safety first, then actionable
 * gaps), and caps the total count. This is the ONLY place presentation
 * order/volume is decided — callers must never re-sort or re-slice a gathered
 * list themselves.
 *
 * DEC1 — the dedupe and the rank are the canonical shared mechanics
 * (shared/attention/decision.ts); the local copies this function used to carry
 * are retired, golden-identity tested byte-identical
 * (test-dec1-decision-engine.ts). The MAX_NOTICES_PER_MOMENT cap stays HERE,
 * deliberately: it is the presentation-edge attention budget (INT20), a
 * different budget from the Decision Engine's delivery limit, and it carries
 * no critical exemption — two criticals may legitimately consume it.
 *
 * ATTN1 invariant A3 — `critical` fills the attention budget FIRST: it is the
 * top rank, so no combination of `high` notices can consume the
 * MAX_NOTICES_PER_MOMENT budget ahead of a harm signal (closes ATTN1 finding
 * F5).
 */
export function applySilenceRules(
  notices: readonly Notice[],
  maxCount: number = MAX_NOTICES_PER_MOMENT,
): Notice[] {
  return orderByAttention(dedupeById(notices)).slice(0, maxCount);
}

// ---------------------------------------------------------------------------
// toGrowthPhraseInputs re-export — behaviour-engine.ts's phraseNotice
// needs this adapter for the "growth" fact kind without importing
// companion-growth.ts a second time under a different path.
// ---------------------------------------------------------------------------

export { toGrowthPhraseInputs };
export type { GrowthPhraseInputs };
