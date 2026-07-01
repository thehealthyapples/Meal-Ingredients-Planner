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
 * - `temporalAnchor`      — ISO date (YYYY-MM-DD) of now; grounds the LLM to today.
 */
export interface ContextFrame {
  readonly identity:             IntelligenceContext;
  readonly surface:              ConversationSurface;
  readonly userId:               number;
  readonly activePlannerWeekId?: number;
  readonly householdId?:         number;
  readonly selectedMealId?:      number;
  readonly currentFoodSlug?:     string;
  readonly temporalAnchor:       string;
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
  const temporalAnchor = new Date().toISOString().slice(0, 10);

  // ── Household (pointer only) ────────────────────────────────────────────
  let householdId: number | undefined;
  try {
    const hh = await storage.getHouseholdByUser(userId);
    if (hh) householdId = hh.household.id;
  } catch { /* non-critical — degrade gracefully */ }

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
  };
}
