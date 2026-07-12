// PHASE5D — Companion Context Channel.
//
// The CLIENT half of the TIP3 Context Frame (THA_AI_EXPERIENCE_AND_CONVERSATION_
// ARCHITECTURE.md Part 4 / §5.2). The server has always assembled a Context Frame
// on every turn — `context-frame-assembler.ts` is complete, correct and pointer-
// disciplined. What it could never do is populate the pointers that ONLY the UI
// knows: which planner week is on screen, which meal card is open, which food page
// is being read, which day and slot the household is looking at.
//
// The only client that talks to the gateway sent `surfaceHints: { currentPath }` —
// a field the route does not read. So every one of those pointers arrived empty, and
// the deixis TIP3 §5.3 exists to resolve ("move IT to next week", "add THIS to
// Saturday", "is IT good for sleep?") had nothing to point at. This module is the
// channel that carries them.
//
// IT IS NOT A STORE. This is the line TIP3 Risk R1 draws, and it is held here:
//
//   • It holds POINTER IDs only — never a planner row, a meal, a food, a list.
//   • Pages publish what they ALREADY own. The channel derives, resolves and
//     computes nothing: no "today", no "the active week", no day-name lookup.
//   • It is cleared on unmount, so a pointer can never outlive the view that
//     described it, and can never be read as truth about a screen nobody is on.
//   • The server RE-READS every pointer from its owning service before using it
//     (TIP3 §5.4). A hint is a statement about WHAT IS ON SCREEN. It is never a
//     statement about what is true — the owner remains the only authority on that.
//
// So the assistant is told where the household is looking. It is never told what
// it is looking at; it asks the owner, exactly as it did before.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ── Pointers ────────────────────────────────────────────────────────────────

/**
 * The pointer set the Conversation Gateway accepts. This mirrors `SurfaceHints`
 * in `server/intelligence/conversation/context-frame-assembler.ts` EXACTLY — it is
 * the same contract seen from the other side, and it is deliberately the whole
 * surface. A field that does not exist there must not be invented here; an
 * unrecognised hint is dropped by the route, which would make it a lie told
 * silently.
 *
 * Every field is an ID or a slug. Nothing here is business data.
 */
export interface CompanionSurfaceHints {
  /** The planner week currently displayed. */
  activePlannerWeekId?: number;
  /** The meal currently open (Cookbook meal detail, or a meal card in focus). */
  selectedMealId?: number;
  /** The food slug currently being read (food detail / nutrition). */
  currentFoodSlug?: string;
  /**
   * The specific planner day in view. Client-supplied ONLY — the platform never
   * resolves a day name or "today" to a dayId itself, and a Companion Action that
   * needs a day is not proposed without this (companion-actions.ts:103, an honest
   * gap by construction). Until PHASE5D nothing ever supplied it, so that action
   * could not be reached in production at all.
   */
  selectedPlannerDayId?: number;
  /** The meal slot in view alongside `selectedPlannerDayId`. */
  selectedMealSlot?: string;
}

interface CompanionContextValue {
  /** The pointers the mounted surface has published. Empty when it published none. */
  hints: CompanionSurfaceHints;
  publish: (hints: CompanionSurfaceHints) => void;
}

const CompanionContext = createContext<CompanionContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────────────

/**
 * Mounted once, inside the authenticated shell, wrapping BOTH the routed page
 * (which publishes) and the FloatingAssistant (which reads). One channel, one
 * assistant — never one per surface (TIP3 Part 1, Risk R2).
 */
export function CompanionContextProvider({ children }: { children: ReactNode }) {
  const [hints, setHints] = useState<CompanionSurfaceHints>({});

  const publish = useCallback((next: CompanionSurfaceHints) => {
    setHints(next);
  }, []);

  const value = useMemo<CompanionContextValue>(
    () => ({ hints, publish }),
    [hints, publish],
  );

  return (
    <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>
  );
}

function useCompanionContext(): CompanionContextValue | null {
  return useContext(CompanionContext);
}

// ── Publish (surfaces) ──────────────────────────────────────────────────────

/**
 * Publish the pointers this surface currently has on screen.
 *
 * Call it with what the page ALREADY holds — never with anything resolved, fetched
 * or computed for the Companion's benefit. Pass `undefined` for a pointer the
 * surface genuinely does not have; an absent pointer is an honest gap that the
 * server degrades around, and is always safer than a guessed one (a wrong pointer
 * is how "delete it" deletes the wrong thing — TIP3 Risk R6).
 *
 * Published on mount and whenever a pointer changes; cleared on unmount.
 */
export function usePublishCompanionContext(hints: CompanionSurfaceHints): void {
  const ctx = useCompanionContext();
  const publish = ctx?.publish;

  // Depend on the VALUES, not the object identity — callers pass an inline object
  // literal, which is a new reference on every render.
  const { activePlannerWeekId, selectedMealId, currentFoodSlug, selectedPlannerDayId, selectedMealSlot } = hints;

  useEffect(() => {
    if (!publish) return;
    publish({
      activePlannerWeekId,
      selectedMealId,
      currentFoodSlug,
      selectedPlannerDayId,
      selectedMealSlot,
    });
    // Clearing on unmount is what keeps this a channel and not a store: when the
    // household leaves the planner, the assistant stops being told a week is on
    // screen, because none is.
    return () => publish({});
  }, [publish, activePlannerWeekId, selectedMealId, currentFoodSlug, selectedPlannerDayId, selectedMealSlot]);
}

// ── Read (the one assistant) ────────────────────────────────────────────────

/** The pointers currently on screen. Read by the FloatingAssistant, by nothing else. */
export function useCompanionSurfaceHints(): CompanionSurfaceHints {
  return useCompanionContext()?.hints ?? {};
}

// ── Deliberately absent: an "ask the Companion about this card" channel ──────
//
// PHASE5D built one and removed it before shipping, because it had no honest
// consumer. A "Why this?" button on an ambient opportunity card can do one of two
// things today, and both are wrong:
//
//   • Answer about the DOMAIN. "Why are you suggesting this?" on the planner routes
//     to `planner.read` — a grounded answer about the week, presented under a button
//     that promised to explain THAT CARD. The household would believe the Companion
//     had justified the recommendation. It would not have. That is a trust defect,
//     and a confident wrong answer is the worst thing this product can produce.
//
//   • Answer about the OPPORTUNITY — which requires an `explain` intent on
//     `opportunity-delivery` (it supports report/review/approve/delete only) and a
//     structured subject on the payload (it carries prose: `explanation`,
//     `evidence`, `suggestedAction`, and no entity). Composing a question from that
//     prose means the presentation layer parsing intelligence it does not own; the
//     capability declines a resolver matcher deliberately (pattern-intent-resolver
//     .ts §"ONE DELIVERY PATH").
//
// So the affordance is a PHASE5E item with a named blocker, not a thing to
// improvise. The card already renders the Decision Engine's evidence verbatim under
// "Why" — that explanation is real, and it is the one we have.

