// EXP2 · Prototype A — THE WELCOME (DEVELOPMENT-ONLY EXPLORATION).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE QUESTION THIS PROTOTYPE ASKS: can THA feel like somebody is welcoming you
// home?
//
// Its entire budget is spent on the GREETING — the handwriting, the timing, the
// breathing space, the pause. There is deliberately NO environment moment (no
// orchard emergence — that is Prototype B's question), NO sheen, NO glide, and
// no choreography after the words. The exploration is whether words, a hand,
// warmth of colour, and above all TIME are enough on their own to make arrival
// feel like being met at the door.
//
// What it explores beyond ARRIVAL1's welcome:
//   • The greeting follows the DAY — "Good morning / Good afternoon / Good
//     evening" in THA's hand, with the name beneath. A greeting that knows what
//     time it is feels like a person; "Welcome home" at 7am and 9pm alike feels
//     like a sign on a wall.
//   • The pause is LONGER and is the point. The greeting is held, whole and
//     unhurried, for a real emotional beat (~3.5s of stillness) before anything
//     else is allowed to happen. Principle C (arrival before work): the welcome
//     beat carries no task and demands nothing.
//   • The exit is a single slow crossfade — the words recede AS the room (the
//     ordinary workspace, canonical header already in place) comes through.
//     Nothing slides, nothing zooms; the hello simply gives way to the home.
//
// Shell: canonical. WorkspaceHeader byte-identical to the live Home's, mounted
// from the first frame beneath the cream. Navigation untouched. The Companion is
// the ONE FloatingAssistant (withheld until settled, never animated by us).
// Disposition: see exp2-shared.tsx — ideas graduate; prototypes are deleted.
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

// ── The welcome, in seconds ──────────────────────────────────────────────────
// Motion directs attention; it never gates use. Everything is in the DOM and
// interactive from the first frame; the sequence is choreography, not a queue.
const T = {
  hand: 0.7,        // the hand begins to write the time-of-day greeting
  name: 1.9,        // the name settles beneath it
  // — the emotional pause: the greeting stays whole, still, and unhurried —
  fade: 5.4,        // the crossfade begins: words recede, the home comes through
  fadeDur: 2.1,     //   long and gentle — a giving-way, never a cut
  settled: 7.6,     // the room is fully present; the Companion may arrive
} as const;

const SESSION_KEY = "tha:exp2a-seen";

/**
 * The greeting follows the day. Resolved once per mount.
 *
 * CONV1 P6 (Phase 3) — the private copy is RETIRED into `@/lib/greeting`
 * (architecture § 14, target 3: 4 → 1). It read `new Date().getHours()` with its
 * own 12/**18** boundary, while the two live surfaces used 12/**17** — a
 * divergence that would have shipped the day this prototype's idea graduated.
 * It is settled on the boundary the owner DECLARES: 17, what is already live.
 *
 * The zone is the declared default because a prototype has no household — this
 * file deliberately reads no data (see the header). That is the honest input, and
 * it means the only thing an idea has to change on graduation is to pass the real
 * household's zone. It no longer carries a clock of its own.
 */
function timeOfDayGreeting(): string {
  return householdGreeting(new Date(), DECLARED_DEFAULT_ZONE);
}

export default function ArrivalAWelcomePage() {
  const arrival = useArrivalGate(SESSION_KEY);
  const isFull = arrival === "full";
  useSignatureFont();

  const data = useHomeData();
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

  return (
    <div data-testid="arrival-a" data-arrival={arrival}>
      {/* The standard THA header — byte-identical to the live Home's. Mounted
          from the first frame, hidden under the cream, in place when it lifts. */}
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      {/* ── The cream field. It IS the welcome's whole environment: no orchard
          reveal here (Prototype B's question), just calm, warmth, and words.
          It gives way in one slow crossfade — z above header(40)/nav(50)/FAB(40)
          so the greeting truly has the room to itself. ── */}
      {isFull && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[60] bg-background"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: T.fadeDur, delay: T.fade, ease: [0.4, 0, 0.2, 1] }}
        />
      )}

      {/* ── The greeting itself. Held, whole, for a real pause; then it recedes
          with the cream in the same breath. The DOM reads as one ordinary
          sentence for a screen reader — the handwriting carries no information
          of its own. ── */}
      {isFull && (
        <motion.div
          aria-hidden={settled}
          className="pointer-events-none fixed inset-0 z-[61] flex flex-col items-center justify-center px-6 text-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: T.fadeDur, delay: T.fade, ease: [0.4, 0, 0.2, 1] }}
          data-testid="arrival-a-welcome"
        >
          <p>
            <motion.span
              className="block text-signature signature-ink text-[3rem] sm:text-[4.25rem] leading-none"
              style={{ color: "var(--primary-border)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: T.hand }}
              data-testid="text-arrival-a-greeting"
            >
              {greeting}
            </motion.span>
            {data.name && (
              <motion.span
                className="mt-4 block font-display text-[1.6rem] sm:text-3xl font-medium tracking-tight text-primary"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: T.name, ease: [0.22, 1, 0.36, 1] }}
                data-testid="text-arrival-a-name"
              >
                {data.name}
              </motion.span>
            )}
          </p>
        </motion.div>
      )}

      {/* ── The home the words give way to: the ordinary one-viewport workspace,
          already in place beneath the crossfade. Nothing in it animates. ── */}
      <div
        ref={workspaceRef}
        className="relative z-[6] mx-auto w-full max-w-2xl px-4 sm:px-6 flex min-h-[100svh] flex-col justify-center py-10 sm:py-14"
        style={sceneH ? { minHeight: sceneH } : undefined}
        data-testid="arrival-a-workspace"
      >
        <header className="mb-7 sm:mb-9">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mb-1.5" data-testid="text-arrival-a-date">
            {todayLabel()}
          </p>
          <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground">
            Today
          </h2>
        </header>

        <HomeWorkspace data={data} prefix="a" />
        <DashboardLink prefix="a" />
      </div>
    </div>
  );
}
