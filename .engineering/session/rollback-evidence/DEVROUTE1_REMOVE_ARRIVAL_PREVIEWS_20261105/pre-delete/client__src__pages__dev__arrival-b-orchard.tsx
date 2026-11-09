// EXP2 · Prototype B — THE ORCHARD (DEVELOPMENT-ONLY EXPLORATION).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE QUESTION THIS PROTOTYPE ASKS: can users feel they are entering a PLACE
// rather than opening software?
//
// Its entire budget is spent on the ENVIRONMENT. There is deliberately NO
// greeting text (Prototype A's question), no signature hand, no sheen. The
// exploration is whether place alone — the orchard, the light, the constancy of
// the walls — can carry the feeling of walking in.
//
// The interpretation:
//   • You are IN the orchard from the first frame. No cream field, no curtain:
//     the door is already open. The shell — header and navigation, the walls
//     and floor of the room (Principle 9 / E) — is fully visible from frame
//     one, because a place you trust never assembles its walls in front of you.
//   • For the first breath, the orchard IS the content: the workspace is not
//     yet present, and the shared backdrop every page lives over is, briefly,
//     the whole room.
//   • LIGHT carries the welcome (Principle F: light may mean welcome · warmth ·
//     calm · clarity · optimism — nothing else). A soft wash of warm morning
//     light lies over the canvas and slowly settles into ordinary daylight.
//     One meaning — "morning, you're welcome here" — then it is gone for good.
//   • The furniture settles. The workspace rises gently into place as ONE
//     piece — a room already prepared coming to meet you, not cards assembling
//     in sequence. A few pixels of travel, once, downward-to-rest; walking to
//     the table, not watching a build.
//
// Shell: canonical, visible from frame one — byte-identical WorkspaceHeader.
// Companion: the ONE FloatingAssistant, withheld only until the room settles.
// Disposition: see exp2-shared.tsx — ideas graduate; prototypes are deleted.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useWithholdCompanion } from "@/components/conversation/companion-context";
import { WorkspaceHeader } from "@/components/workspace-header";
import {
  useArrivalGate, useSceneHeight, useHomeData,
  HomeWorkspace, DashboardLink, todayLabel,
} from "./exp2-shared";

// ── Entering the orchard, in seconds ─────────────────────────────────────────
const T = {
  lightFrom: 0.4,    // the morning wash begins to settle into daylight
  lightDur: 2.4,     //   slow — light changes like weather, not like a switch
  furnish: 1.3,      // the workspace rises into place, one piece
  furnishDur: 1.5,   //   gentle: opacity + a few px of downward settle
  settled: 3.4,      // the room is still; the Companion may arrive
} as const;

const SESSION_KEY = "tha:exp2b-seen";

export default function ArrivalBOrchardPage() {
  const arrival = useArrivalGate(SESSION_KEY);
  const isFull = arrival === "full";

  const data = useHomeData();
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
    <div data-testid="arrival-b" data-arrival={arrival}>
      {/* The standard THA header — visible from the very first frame. The walls
          of the room never assemble in front of you. */}
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      {/* ── Morning light. A single warm wash over the whole canvas — beneath
          the header (z-40), nav (z-50) and Companion, because light lies on the
          room, not on the walls' fittings. It settles into ordinary daylight
          once and never returns: welcome, said in light, exactly once. ── */}
      {isFull && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[5]"
          style={{
            // Warm morning light from the upper left — the amber of early sun,
            // faint, over Calm Orchard's own canvas. A wash, never a spotlight.
            background:
              "linear-gradient(135deg, hsla(42, 90%, 78%, 0.30) 0%, hsla(42, 80%, 84%, 0.16) 38%, hsla(42, 70%, 90%, 0.0) 72%)",
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: T.lightDur, delay: T.lightFrom, ease: [0.4, 0, 0.2, 1] }}
          data-testid="arrival-b-morning-light"
        />
      )}

      {/* ── The room, furnishing itself once. The whole workspace rises as ONE
          piece — opacity with a few pixels of downward settle, then stillness.
          For the first ~1.3s the orchard backdrop is the entire content: you
          stand in the place before the work is in front of you. ── */}
      <motion.div
        ref={workspaceRef}
        className="relative z-[6] mx-auto w-full max-w-2xl px-4 sm:px-6 flex min-h-[100svh] flex-col justify-center py-10 sm:py-14"
        style={sceneH ? { minHeight: sceneH } : undefined}
        initial={isFull ? { opacity: 0, y: -10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: T.furnishDur, delay: T.furnish, ease: [0.22, 1, 0.36, 1] }}
        data-testid="arrival-b-workspace"
      >
        <header className="mb-7 sm:mb-9">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mb-1.5" data-testid="text-arrival-b-date">
            {todayLabel()}
          </p>
          <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground">
            Today
          </h2>
        </header>

        <HomeWorkspace data={data} prefix="b" />
        <DashboardLink prefix="b" />
      </motion.div>
    </div>
  );
}
