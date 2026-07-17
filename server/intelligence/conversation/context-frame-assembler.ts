/**
 * context-frame-assembler.ts — INT18 Phase 1
 * ============================================
 * Pure read function: assembles a ContextFrame from existing owner services for
 * each conversation turn. The frame holds POINTER IDs only — no business data
 * is stored here (TIP3 Risk R1 / INT18 §4.3).
 *
 * BOUNDARIES:
 *  - Read-only. No mutations, no writes to any table.
 *  - Pointer discipline enforced. Every field is an ID or primitive anchor — never
 *    an inline business row such as a PlannerEntry, ShoppingListItem, etc.
 *  - Storage calls are wrapped in try/catch so a failed owner read never prevents
 *    the turn from proceeding with partial context.
 *  - The assembled ContextFrame is consumed in-memory by the Conversation Gateway
 *    and discarded after the turn. It is never persisted verbatim (the gateway
 *    serialises only the IDs into `contextFrameRef` for the turn record).
 *
 * Run tests: npx tsx server/tests/test-intelligence-conversation-gateway.ts
 */

import { storage } from "../../storage.js";
import {
  DECLARED_DEFAULT_ZONE,
  formatCivilDate,
  householdToday,
  type IANAZone,
} from "../../../shared/time/household-time.js";
import type { IntelligenceContext } from "../types.js";
import type { ConversationSurface, EntityRef } from "./conversation-store.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Optional UI-layer hints supplied by the client about what is currently
 * visible on-screen. Used to anchor the context frame to the user's current
 * view. All fields are optional — the assembler degrades gracefully.
 *
 * Phase 1: client-supplied hints are TRUSTED for read-only context assembly
 * (INT18 OQ5). The server-side userId always comes from the authenticated
 * session and is never overridden by hints.
 */
export interface SurfaceHints {
  /** The planner week currently displayed in the UI, if any. */
  activePlannerWeekId?: number;
  /** The meal card the user has open or last interacted with, if any. */
  selectedMealId?: number;
  /** The food slug on the nutrition / analyser page, if any. */
  currentFoodSlug?: string;
  /**
   * INT40 — the specific planner day currently in view, if any (e.g. the user is
   * looking at Saturday of week 5 in the Planner UI). Client-supplied only, same
   * trust model as the other hints (INT18 OQ5) — the platform NEVER resolves "today"
   * or a day name to a dayId itself; a Companion Action that needs a day is only
   * proposed when this hint is present (honest gap otherwise, see companion-actions.ts).
   */
  selectedPlannerDayId?: number;
  /** INT40 — the meal slot in view alongside selectedPlannerDayId, if any ("breakfast" | "lunch" | "dinner" | "snacks"). */
  selectedMealSlot?: string;
  /**
   * PHASE5E — the ambient opportunity card the household explicitly asked about
   * ("Why this?"), if any. OD1's `DeliverableOpportunity.id`.
   *
   * Client-supplied ONLY, and — unlike every other hint here — it is never inferred
   * from a prior entity ref and never falls back to a stored record. There is no such
   * thing as "the opportunity they probably meant": a card is asked about because its
   * own button was pressed, or it is not asked about at all. Guessing one would
   * produce a confident explanation of a suggestion the household never questioned.
   */
  selectedOpportunityId?: string;
}

/**
 * The assembled context snapshot for one conversation turn.
 * All fields are IDs or primitives — never inline business rows.
 *
 * - `identity`            — the server-resolved IntelligenceContext (role, userId, premium).
 * - `surface`             — the UI surface the utterance originated from.
 * - `userId`              — typed as number; mirrors identity.userId (parsed).
 * - `activePlannerWeekId` — pointer to the planner week in scope, if determinable.
 * - `householdId`         — pointer to the household, if the user belongs to one.
 * - `selectedMealId`      — pointer to a meal currently in focus, if any.
 * - `currentFoodSlug`     — food slug for nutrition/analyser contexts, if any.
 * - `temporalAnchor`      — ISO date (YYYY-MM-DD): the HOUSEHOLD's today, derived by
 *                           `shared/time/household-time.ts` from the instant and the
 *                           household's zone (CONV1 P6 / READ-4). It is not UTC's today,
 *                           and it is not the device's. Where a household has stated no
 *                           zone the declared default resolves at read time (CP8) — the
 *                           row is never written to.
 * - `selectedPlannerDayId`/`selectedMealSlot` — INT40, client-supplied only (see SurfaceHints).
 */
export interface ContextFrame {
  readonly identity:              IntelligenceContext;
  readonly surface:               ConversationSurface;
  readonly userId:                number;
  readonly activePlannerWeekId?:  number;
  readonly householdId?:          number;
  readonly selectedMealId?:       number;
  readonly currentFoodSlug?:      string;
  readonly temporalAnchor:        string;
  readonly selectedPlannerDayId?: number;
  readonly selectedMealSlot?:     string;
  /** PHASE5E — pointer to the opportunity card explicitly asked about, if any (see SurfaceHints). */
  readonly selectedOpportunityId?: string;
}

// ---------------------------------------------------------------------------
// Assembler
// ---------------------------------------------------------------------------

/**
 * Assemble a ContextFrame for one conversation turn.
 *
 * Resolution order for each optional pointer:
 *   1. Explicit surfaceHint (UI layer's current view — trusted for Phase 1).
 *   2. Most recent matching entity ref from priorEntityRefs (pronoun resolution).
 *   3. Storage read of the user's first/only record (fallback).
 *
 * All storage reads are isolated in try/catch so a single owner failure does
 * not abort the turn.
 */
export async function assembleContextFrame(
  userId: number,
  surface: ConversationSurface,
  surfaceHints: SurfaceHints,
  priorEntityRefs: EntityRef[],
  identity: IntelligenceContext,
): Promise<ContextFrame> {
  // ── Household (pointer only) + the household's own clock ────────────────
  //
  // CONV1 P6 / READ-4: the zone is read HERE because the household is already
  // read here — the anchor used to be computed two lines above this call, in
  // UTC, while the fact that would have made it true was fetched immediately
  // below it and thrown away.
  //
  // `timeZone` does not break the pointer discipline (§ BOUNDARIES above): it is
  // a primitive anchor, not an inline business row, and it never reaches the
  // frame — only the civil date it resolves does. `temporalAnchor` was already
  // a declared primitive anchor.
  let householdId: number | undefined;
  let householdZone: IANAZone | undefined;
  try {
    const hh = await storage.getHouseholdByUser(userId);
    if (hh) {
      householdId = hh.household.id;
      householdZone = hh.household.timeZone ?? undefined;
    }
  } catch { /* non-critical — degrade gracefully */ }

  // ── The temporal anchor — the household's today, not UTC's ──────────────
  //
  // CONV1 P6 / READ-4. This line was
  //   `new Date().toISOString().slice(0, 10)`
  // whose own doc comment claimed it "grounds the LLM to today". It grounded the
  // LLM to UTC's today, and it is the single highest-leverage line in the
  // platform: it becomes `TODAY:` in the system prompt AND the diary day the
  // Companion reads and writes (pattern-intent-resolver.ts). A UK household
  // between 00:00–01:00 BST was told yesterday's date; a New York household
  // after ~19:00 local was told tomorrow's — and could log tonight's dinner into
  // tomorrow's diary.
  //
  // HT5 — `now` is a parameter to the owner; the instant enters in exactly one
  // place, here. HT12 — the device may supply the instant; it may never decide
  // the day, and it no longer does.
  //
  // The zone falls back to the DECLARED default (CP8): a household that has not
  // told THA where it lives holds NULL, and NULL means "THA has not been told" —
  // never a fabricated fact. Resolving the declared default AT READ TIME is what
  // keeps it out of the row (HT7). For every household today this yields
  // Europe/London, which is what makes this change safe: it is a strict
  // improvement on UTC for a UK product, and exact for any household that has
  // stated a zone.
  const temporalAnchor = formatCivilDate(
    householdToday(new Date(), householdZone ?? DECLARED_DEFAULT_ZONE),
  );

  // ── Active planner week (pointer only) ─────────────────────────────────
  let activePlannerWeekId: number | undefined;
  if (surfaceHints.activePlannerWeekId != null) {
    activePlannerWeekId = surfaceHints.activePlannerWeekId;
  } else {
    const weekRef = priorEntityRefs.find(r => r.type === "planner_week");
    if (weekRef != null) {
      activePlannerWeekId = Number(weekRef.id);
    } else {
      try {
        const weeks = await storage.getPlannerWeeks(userId);
        if (weeks.length > 0) activePlannerWeekId = weeks[0].id;
      } catch { /* non-critical */ }
    }
  }

  // ── Selected meal (pointer only) ────────────────────────────────────────
  let selectedMealId: number | undefined;
  if (surfaceHints.selectedMealId != null) {
    selectedMealId = surfaceHints.selectedMealId;
  } else {
    const mealRef = priorEntityRefs.find(r => r.type === "meal");
    if (mealRef != null) selectedMealId = Number(mealRef.id);
  }

  // ── Current food slug (pointer only) ────────────────────────────────────
  let currentFoodSlug: string | undefined;
  if (surfaceHints.currentFoodSlug != null) {
    currentFoodSlug = surfaceHints.currentFoodSlug;
  } else {
    const foodRef = priorEntityRefs.find(r => r.type === "food");
    if (foodRef != null) currentFoodSlug = String(foodRef.id);
  }

  return {
    identity,
    surface,
    userId,
    householdId,
    activePlannerWeekId,
    selectedMealId,
    currentFoodSlug,
    temporalAnchor,
    // INT40 — pass-through client hints only, never resolved/guessed here.
    selectedPlannerDayId: surfaceHints.selectedPlannerDayId,
    selectedMealSlot: surfaceHints.selectedMealSlot,
    // PHASE5E — pass-through only, and deliberately WITHOUT the prior-entity-ref
    // fallback the pointers above have. See SurfaceHints.
    selectedOpportunityId: surfaceHints.selectedOpportunityId,
  };
}

/**
 * Serialise the pointer-ID fields of a ContextFrame into the compact
 * `contextFrameRef` JSONB record stored on each ConversationTurn.
 * Only IDs and the temporal anchor are stored — never business data.
 */
export function serializeFrameRef(
  frame: ContextFrame,
): Record<string, unknown> {
  return {
    activePlannerWeekId: frame.activePlannerWeekId ?? null,
    householdId:         frame.householdId         ?? null,
    selectedMealId:      frame.selectedMealId       ?? null,
    currentFoodSlug:     frame.currentFoodSlug      ?? null,
    temporalAnchor:      frame.temporalAnchor,
    selectedPlannerDayId: frame.selectedPlannerDayId ?? null,
    selectedMealSlot:     frame.selectedMealSlot     ?? null,
    selectedOpportunityId: frame.selectedOpportunityId ?? null,
  };
}
