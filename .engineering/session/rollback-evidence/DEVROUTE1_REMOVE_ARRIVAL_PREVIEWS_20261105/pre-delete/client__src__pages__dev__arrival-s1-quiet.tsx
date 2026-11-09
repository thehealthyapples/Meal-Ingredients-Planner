// EXP3 · Synthesis S1 — QUIET ARRIVAL (DEVELOPMENT-ONLY SYNTHESIS PROTOTYPE).
//
// ─────────────────────────────────────────────────────────────────────────────
// NOT another independent experiment. This is the first of two SYNTHESIS
// candidates: the strongest discoveries of the five EXP2 explorations,
// deliberately combined into the calmest possible premium arrival. Nothing here
// is new; everything here already earned its place:
//
//   • From A — the HUMAN GREETING: the time-of-day greeting in THA's hand, the
//     name beneath, and the hold-then-recede discipline — at roughly HALF of
//     A's duration, exactly as EXP2's carry-forward asked (~2s of stillness,
//     not ~3.5: the principle is the hold, not the length).
//   • From B — the SHELL VISIBLE FROM FRAME ONE. No cream field, no curtain:
//     the walls and floor of the room (header, navigation, orchard backdrop)
//     are simply there, and the greeting happens INSIDE them (Principle 9 / E).
//   • From C — the REASSURANCE: "Today is planned." / "Today is open." is the
//     first line of the room the greeting gives way to — the most reassuring
//     fact reaching the person before any detail, said only once it is KNOWN.
//   • From D — the COMPANION ARRIVES AFTER YOU: the one FloatingAssistant is
//     withheld until a beat after the room has settled, then makes its own
//     quiet entrance. You arrive first; the intelligence joins you.
//   • From E — the RESTRAINT: everything else is refused. No light wash, no
//     sheen, no glide, no scale, no per-card choreography. Two beats total —
//     the greeting, then the room — and after that, permanent stillness.
//
// The experience should feel almost effortless: nothing attracts attention;
// the user simply feels welcomed (Principle H: if they notice the animation
// before the content, the animation has failed).
//
// Shell: canonical, visible from frame one — byte-identical WorkspaceHeader.
// Disposition: as EXP2's (see exp2-shared.tsx) — ideas graduate into the ONE
// adopted arrival; the synthesis prototypes are then DELETED with the rest.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { householdGreeting } from "@/lib/greeting";
import { DECLARED_DEFAULT_ZONE } from "@shared/time/household-time";
import { motion } from "framer-motion";
import { useWithholdCompanion } from "@/components/conversation/companion-context";
import { WorkspaceHeader } from "@/components/workspace-header";
import {
  useArrivalGate, useSignatureFont, useSceneHeight, useHomeData,
  HomeWorkspace, DashboardLink, todayLabel,
} from "./exp2-shared";

// ── The whole arrival, in seconds — two beats, then stillness ────────────────
// Motion directs attention; it never gates use. Everything is in the DOM and
// interactive from the first frame (the greeting overlay passes pointer events
// through); the sequence is choreography, never a queue.
const T = {
  hand: 0.4,        // the hand writes the time-of-day greeting
  name: 1.2,        // the name settles beneath it
  // — the held pause: ~2s of stillness, half of A's, per EXP2 §7 idea 5 —
  fade: 3.2,        // the one crossfade: words recede, the room comes through
  fadeDur: 1.4,     //   a giving-way, never a cut
  rest: 4.6,        // the room is fully present; nothing will move again
  settled: 5.8,     // a beat later, the Companion may arrive (D's manners)
} as const;

const SESSION_KEY = "tha:exp3s1-seen";

/**
 * The greeting follows the day (EXP2 A). Resolved once per mount.
 *
 * CONV1 P6 (Phase 3) — the private copy is RETIRED into `@/lib/greeting`
 * (architecture § 14, target 3: 4 → 1). It was the fourth copy, and its own note
 * recorded exactly why it existed: *"Local copy — EXP2's prototype files are under
 * their own review and stay byte-untouched."* That was a sound reason to avoid
 * importing from a prototype, and it is why the owner is not a prototype. The
 * boundary moves 18 → **17**, the one the owner declares and the live surfaces
 * already use. Both files now read the same rule without either importing the
 * other.
 *
 * The zone is the declared default because a prototype has no household (see
 * `arrival-a-welcome.tsx`).
 */
function timeOfDayGreeting(): string {
  return householdGreeting(new Date(), DECLARED_DEFAULT_ZONE);
}

export default function ArrivalS1QuietPage() {
  const arrival = useArrivalGate(SESSION_KEY);
  const isFull = arrival === "full";
  useSignatureFont();

  const d = useHomeData();
  const [greeting] = useState(timeOfDayGreeting);
  const [settled, setSettled] = useState(!isFull);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const sceneH = useSceneHeight(workspaceRef);

  useWithholdCompanion(!settled);

  useEffect(() => {
    if (!isFull) return;
    const t = window.setTimeout(() => setSettled(true), T.settled * 1000);
    return () => clearTimeout(t);
  }, [isFull]);

  // C's state sentence — said only once it is KNOWN. While the truth is still
  // loading there is quiet space, never a guess (Core Principle 6).
  const stateSentence = d.mealsSettled
    ? d.todaysMeals.length === 0
      ? "Today is open."
      : "Today is planned."
    : null;

  return (
    <div data-testid="arrival-s1" data-arrival={arrival}>
      {/* The standard THA header — visible from the very first frame. The walls
          of the room never assemble in front of you (B). */}
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      <div
        ref={workspaceRef}
        className="relative z-[6] mx-auto w-full max-w-2xl px-4 sm:px-6 flex min-h-[100svh] flex-col justify-center py-10 sm:py-14"
        style={sceneH ? { minHeight: sceneH } : undefined}
        data-testid="arrival-s1-scene"
      >
        {/* ── The greeting (A), spoken inside the visible shell (B). Held whole
            and still for ~2s, then it recedes in the same breath as the room
            comes through — one crossfade, in one place. The DOM reads as one
            ordinary sentence for a screen reader. ── */}
        {isFull && (
          <motion.div
            aria-hidden={settled}
            className="pointer-events-none absolute inset-0 z-[7] flex flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: T.fadeDur, delay: T.fade, ease: [0.4, 0, 0.2, 1] }}
            data-testid="arrival-s1-greeting"
          >
            <p>
              <motion.span
                className="block text-signature signature-ink text-[3rem] sm:text-[4rem] leading-none"
                style={{ color: "var(--primary-border)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: T.hand }}
                data-testid="text-arrival-s1-greeting"
              >
                {greeting}
              </motion.span>
              {d.name && (
                <motion.span
                  className="mt-4 block font-display text-[1.5rem] sm:text-[1.75rem] font-medium tracking-tight text-primary"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: T.name, ease: [0.22, 1, 0.36, 1] }}
                  data-testid="text-arrival-s1-name"
                >
                  {d.name}
                </motion.span>
              )}
            </p>
          </motion.div>
        )}

        {/* ── The room the words give way to. Its first line is C's reassurance;
            the rest is the ordinary parity workspace. It arrives as ONE piece,
            through the same crossfade the greeting leaves by — and then nothing
            in it ever moves again (E). ── */}
        <motion.div
          initial={isFull ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: T.fadeDur, delay: T.fade, ease: [0.4, 0, 0.2, 1] }}
          data-testid="arrival-s1-workspace"
        >
          <header className="mb-7 sm:mb-9">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mb-1.5" data-testid="text-arrival-s1-date">
              {todayLabel()}
            </p>
            <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground">
              Today
            </h2>
            {stateSentence && (
              <p className="mt-2 text-base sm:text-lg text-muted-foreground" data-testid="text-arrival-s1-state">
                {stateSentence}
              </p>
            )}
          </header>

          <HomeWorkspace data={d} prefix="s1" />
          <DashboardLink prefix="s1" />
        </motion.div>
      </div>
    </div>
  );
}
