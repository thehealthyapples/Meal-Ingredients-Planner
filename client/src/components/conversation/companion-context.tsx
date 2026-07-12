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
  /**
   * PHASE5E — the ambient opportunity card the household is asking about
   * (OD1's `DeliverableOpportunity.id`).
   *
   * Unlike every other pointer here, this is NOT published by a page describing what is
   * on screen. It is attached to ONE question, by `askCompanion`, at the moment a
   * household presses a specific card's "Why this?" button — and it is gone as soon as
   * that question has been asked. Merely *looking* at a card never sets it.
   *
   * That distinction is load-bearing. A pointer that lingered would let a later,
   * unrelated "why?" ("why is this recipe so slow?") be answered about a card the
   * household had stopped thinking about — confidently, and about the wrong thing.
   */
  selectedOpportunityId?: string;
}

/**
 * PHASE5E — a question a surface is asking the Companion on the household's behalf.
 *
 * `utterance` is what the household will see in the thread, written by the surface that
 * knows what its own button promised. `hints` are the pointers that make it answerable.
 */
export interface CompanionAsk {
  readonly utterance: string;
  readonly hints?: CompanionSurfaceHints;
}

interface CompanionContextValue {
  /** The pointers the mounted surface has published. Empty when it published none. */
  hints: CompanionSurfaceHints;
  publish: (hints: CompanionSurfaceHints) => void;
  /** The pending question, if a surface has asked one. Consumed (and cleared) by the assistant. */
  ask: CompanionAsk | null;
  askCompanion: (ask: CompanionAsk) => void;
  clearAsk: () => void;
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
  const [ask, setAsk] = useState<CompanionAsk | null>(null);

  const publish = useCallback((next: CompanionSurfaceHints) => {
    setHints(next);
  }, []);

  // PHASE5E — a surface asks ONE question. The assistant consumes it and clears it, so a
  // question can never be asked twice, and a stale question can never be re-sent when the
  // panel is next opened.
  const askCompanion = useCallback((next: CompanionAsk) => {
    setAsk(next);
  }, []);

  const clearAsk = useCallback(() => {
    setAsk(null);
  }, []);

  const value = useMemo<CompanionContextValue>(
    () => ({ hints, publish, ask, askCompanion, clearAsk }),
    [hints, publish, ask, askCompanion, clearAsk],
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

// ── Ask (surfaces) — "ask the Companion about this card" ────────────────────
//
// PHASE5D BUILT THIS CHANNEL AND DELETED IT BEFORE SHIPPING. Its reasoning was right,
// and it is worth keeping, because it is the reason this version is safe:
//
//   A "Why this?" button on an ambient opportunity card could then do one of two things,
//   and both were wrong.
//
//     • Answer about the DOMAIN. "Why are you suggesting this?" on the planner routed to
//       `planner.read` — a grounded answer about the week, presented under a button that
//       promised to explain THAT CARD. The household would believe the Companion had
//       justified the recommendation. It would not have. That is a trust defect, and a
//       confident wrong answer is the worst thing this product can produce.
//
//     • Answer about the OPPORTUNITY — which required an `explain` intent on
//       `opportunity-delivery` (it supported report/review/approve/delete only) and a
//       structured subject on its payload (it carried prose and no entity). Composing a
//       question from that prose would have meant the presentation layer parsing
//       intelligence it does not own.
//
//   So PHASE5D withdrew the affordance and named the blockers rather than improvise.
//
// PHASE5E REMOVED BOTH BLOCKERS, which is what makes the channel honest now:
//
//   • `opportunity-delivery` now supports `explain` — a READ verb, bound to a handler
//     that narrates the evidence the Decision Engine ALREADY produced. It invents no
//     justification; OD1 has held one all along, and it was simply not addressable.
//   • Every opportunity now carries a structured `subject`, so nothing parses prose.
//   • The resolver short-circuits to `opportunity-delivery:explain` when — and ONLY
//     when — `selectedOpportunityId` is present AND the utterance is why-shaped. Nothing
//     else can co-fire, so the card asked about is the card answered about.
//   • An opportunity that is no longer being delivered (accepted, dismissed, or simply
//     no longer true) yields an HONEST GAP, never a stale justification for a card THA
//     would not raise today.
//
// This channel therefore carries a question, not an answer, and it never carries business
// data — the same discipline as the pointer channel above.

/**
 * Ask the one Companion a question, from a surface, on the household's behalf.
 *
 * The surface supplies the utterance (it knows what its own button promised) and the
 * pointers that make it answerable. The assistant opens, shows the question in the
 * thread as though the household had typed it — because they effectively did — and
 * answers it through the ordinary gateway. No second assistant, no bypass, no special
 * response path: it is one more turn.
 */
export function useAskCompanion(): (ask: CompanionAsk) => void {
  const ctx = useCompanionContext();
  const askCompanion = ctx?.askCompanion;
  return useCallback(
    (ask: CompanionAsk) => {
      askCompanion?.(ask);
    },
    [askCompanion],
  );
}

// ── Ask (the one assistant) ─────────────────────────────────────────────────

/** The pending question, if any. Read by the FloatingAssistant, by nothing else. */
export function usePendingAsk(): { ask: CompanionAsk | null; clearAsk: () => void } {
  const ctx = useCompanionContext();
  return {
    ask: ctx?.ask ?? null,
    clearAsk: ctx?.clearAsk ?? (() => {}),
  };
}

