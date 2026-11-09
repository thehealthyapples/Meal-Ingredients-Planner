// EXP2 · Prototype D — QUIET INTELLIGENCE (DEVELOPMENT-ONLY EXPLORATION).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE QUESTION THIS PROTOTYPE ASKS: can intelligence feel naturally present
// without demanding attention?
//
// Its entire budget is spent on PRESENCE — and its boldest move is having no
// choreography at all. One gentle fade of the whole page (0.6s), then
// stillness. The thesis: the most convincing intelligence at the moment of
// arrival is not an animation, a typing indicator, or a performance — it is a
// room that has visibly ALREADY BEEN PREPARED:
//
//   • One quiet observation, already waiting. The Notice Engine's single most
//     relevant sentence (chosen server-side; voiced by the Behaviour Engine;
//     rendered verbatim) sits beneath the greeting like a note left on the
//     counter — attributed plainly to the companion, dismissible by simply not
//     reading it, demanding nothing. If there is no notice, there is no note:
//     silence is a first-class outcome, never padded (EXP §7 — honest absence).
//   • The primary action already knows today. "Plan today" vs "Open today's
//     plan" — the label follows the truth; the product has done the checking so
//     the person doesn't have to (Principle A: less to carry).
//   • The Companion arrives AFTER you do. The one FloatingAssistant is withheld
//     for a beat and then settles in quietly — present, clearly available, and
//     conspicuously not pouncing on entry (§5.7: it never pounces; it waits to
//     be addressed).
//
// What it deliberately refuses: any visual that says "intelligence is
// happening" (Principle 7 — the product never performs its own cleverness; §3 —
// intelligence faked with animation is a counterfeit).
//
// Shell: canonical, visible from frame one — byte-identical WorkspaceHeader.
// Disposition: see exp2-shared.tsx — ideas graduate; prototypes are deleted.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useWithholdCompanion } from "@/components/conversation/companion-context";
import { WorkspaceHeader } from "@/components/workspace-header";
import { MessageCircle } from "lucide-react";
import {
  useArrivalGate, useSceneHeight, useHomeData,
  HomeWorkspace, DashboardLink, todayLabel,
} from "./exp2-shared";

// ── The (almost) absence of choreography, in seconds ─────────────────────────
const T = {
  fadeDur: 0.6,      // one gentle fade of the whole page. That is all.
  companion: 1.5,    // the Companion settles in a beat AFTER the person lands
} as const;

const SESSION_KEY = "tha:exp2d-seen";

export default function ArrivalDQuietPage() {
  const arrival = useArrivalGate(SESSION_KEY);
  const isFull = arrival === "full";

  const d = useHomeData();
  const [settled, setSettled] = useState(!isFull);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const sceneH = useSceneHeight(workspaceRef);

  useWithholdCompanion(!settled);

  useEffect(() => {
    if (!isFull) return;
    const t = window.setTimeout(() => setSettled(true), T.companion * 1000);
    return () => clearTimeout(t);
  }, [isFull]);

  // The observation moves UP to sit with the greeting — so it must not also
  // render in the workspace's reminder slot. One sentence, one place.
  const workspaceData = { ...d, reminder: null };

  return (
    <div data-testid="arrival-d" data-arrival={arrival}>
      {/* The standard THA header — visible from the very first frame. */}
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      <motion.div
        ref={workspaceRef}
        className="relative z-[6] mx-auto w-full max-w-2xl px-4 sm:px-6 flex min-h-[100svh] flex-col justify-center py-10 sm:py-14"
        style={sceneH ? { minHeight: sceneH } : undefined}
        initial={isFull ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: T.fadeDur, ease: [0.4, 0, 0.2, 1] }}
        data-testid="arrival-d-workspace"
      >
        <header className="mb-6 sm:mb-8">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mb-1.5" data-testid="text-arrival-d-date">
            {todayLabel()}
          </p>
          <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground">
            Welcome home{d.name ? `, ${d.name}` : ""}.
          </h2>
        </header>

        {/* ── The note on the counter. Already written when you walk in — the
            whole of this prototype's intelligence, and it does not move. ── */}
        {d.reminder && (
          <div
            className="mb-7 sm:mb-9 flex items-start gap-3 border-l-2 border-primary/25 pl-4 py-0.5"
            data-testid="arrival-d-observation"
          >
            <MessageCircle className="h-4 w-4 text-primary/50 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1">
                From your companion
              </p>
              {/* The Behaviour Engine's sentence, rendered verbatim. Never reworded here. */}
              <p className="text-sm text-foreground/80 leading-relaxed" data-testid="text-arrival-d-observation">
                {d.reminder.text}
              </p>
            </div>
          </div>
        )}

        <HomeWorkspace data={workspaceData} prefix="d" />
        <DashboardLink prefix="d" />
      </motion.div>
    </div>
  );
}
