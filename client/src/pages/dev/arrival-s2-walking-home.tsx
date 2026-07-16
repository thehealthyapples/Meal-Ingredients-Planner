// EXP3 · Synthesis S2 — WALKING HOME (DEVELOPMENT-ONLY SYNTHESIS PROTOTYPE).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE ONE ADDITIONAL IDEA THIS SYNTHESIS EXPLORES: the user gently walking into
// the orchard before reaching Home — "I'm arriving somewhere", never "I'm
// watching an animation".
//
// The hard constraint, honoured literally: THE ORCHARD NEVER PERFORMS. The
// trees do not move. Nature does not animate. Nothing translates, scales,
// sways, loops, or couples to the scroll. There is no parallax, no cinematic
// camera, no scroll-jacking, no theatrical effect. What moves instead is the
// PERSON — and a person's movement through a still place is felt as things
// being *passed*, not as things performing:
//
//   • Depth by COMPOSITION, not by motion. Three still planes: the near canopy
//     shade (soft, dark, over the top of the frame — you begin beneath the
//     boughs); the blurred glimpse of trees at the left and right edges (near
//     field, out of focus, framing the view BETWEEN them); and the orchard
//     backdrop itself (far field, crisp — the shared canvas every page lives
//     over, untouched). Near is blurred and dark; far is clear. That is
//     perspective, and none of it moves.
//   • Movement by PASSAGE. Each near plane DISSOLVES exactly once, nearest
//     first — the shade lifts, then the trees you were between clear from the
//     edges of vision — which is what walking forward past still things feels
//     like from inside. A dissolve is not a translation: at no point does a
//     tree change position, and there is no second pass.
//   • Warm morning light (B's one device, kept): a single wash from the upper
//     left settles into ordinary daylight as you come out into the open —
//     light meaning exactly one thing, once (Principle F).
//   • Home rises to meet you (B's furnish): as the walk completes, the
//     workspace settles into place as ONE piece. Then stillness, permanently.
//   • The Companion arrives after you (D): withheld until a beat after the
//     room has settled.
//
// Shell: canonical, visible from frame one — byte-identical WorkspaceHeader;
// the walk happens under the walls, never to them (Principle E). The shared
// orchard backdrop is composed over, never transformed, forked or restyled.
// Disposition: as EXP2's (see exp2-shared.tsx) — ideas graduate into the ONE
// adopted arrival; the synthesis prototypes are then DELETED with the rest.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useWithholdCompanion } from "@/components/conversation/companion-context";
import { WorkspaceHeader } from "@/components/workspace-header";
import {
  useArrivalGate, useSceneHeight, useHomeData,
  HomeWorkspace, DashboardLink, todayLabel,
} from "./exp2-shared";

// ── The walk, in seconds — staggered nearest-first, then stillness ───────────
// The stagger IS the sense of moving through space: what is nearest clears
// first. Each plane fades exactly once and never returns; nothing translates.
const T = {
  shadeFrom: 0.3, shadeDur: 2.1,   // the canopy shade lifts — you step out from beneath the boughs
  treesFrom: 0.7, treesDur: 2.3,   // the trees you passed between clear from the edges of vision
  lightFrom: 1.1, lightDur: 2.4,   // the morning wash settles into ordinary daylight
  furnish: 2.2, furnishDur: 1.5,   // Home rises to meet you, one piece (B)
  rest: 3.7,                       // still; nothing will ever move again
  settled: 4.9,                    // a beat later, the Companion may arrive (D)
} as const;

const SESSION_KEY = "tha:exp3s2-seen";

export default function ArrivalS2WalkingHomePage() {
  const arrival = useArrivalGate(SESSION_KEY);
  const isFull = arrival === "full";

  const d = useHomeData();
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
    <div data-testid="arrival-s2" data-arrival={arrival}>
      {/* The standard THA header — visible from the very first frame. The walk
          happens beneath the walls; it never touches them. */}
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      {/* ── NEAR: the canopy shade. A still, soft darkening over the top of the
          frame — standing beneath the boughs. It lifts once, first, because it
          is nearest. Beneath the header (z-40) and nav: shade lies on the room,
          not on its fittings. ── */}
      {isFull && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[3]"
          style={{
            background:
              "radial-gradient(120% 85% at 8% -10%, hsla(150, 35%, 16%, 0.42) 0%, transparent 60%)," +
              " radial-gradient(120% 85% at 92% -10%, hsla(150, 35%, 16%, 0.36) 0%, transparent 60%)",
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: T.shadeDur, delay: T.shadeFrom, ease: [0.4, 0, 0.2, 1] }}
          data-testid="arrival-s2-canopy-shade"
        />
      )}

      {/* ── NEAR-MID: the glimpse between apple trees. Two blurred, still
          masses at the edges of vision — near-field foliage, out of focus the
          way close things are when you look past them — framing the clear view
          of the orchard between. They never move; they clear, once, as you
          pass. ── */}
      {isFull && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[4] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: T.treesDur, delay: T.treesFrom, ease: [0.4, 0, 0.2, 1] }}
          data-testid="arrival-s2-tree-glimpses"
        >
          <div
            className="absolute -left-14 top-[-12%] h-[124%] w-80"
            style={{
              background:
                "radial-gradient(closest-side at 30% 30%, hsla(152, 32%, 20%, 0.66) 0%, transparent 74%)," +
                " radial-gradient(closest-side at 20% 75%, hsla(148, 30%, 22%, 0.52) 0%, transparent 72%)",
              filter: "blur(30px)",
            }}
          />
          <div
            className="absolute -right-14 top-[-12%] h-[124%] w-80"
            style={{
              background:
                "radial-gradient(closest-side at 70% 22%, hsla(152, 32%, 20%, 0.60) 0%, transparent 74%)," +
                " radial-gradient(closest-side at 80% 68%, hsla(148, 30%, 22%, 0.48) 0%, transparent 72%)",
              filter: "blur(30px)",
            }}
          />
        </motion.div>
      )}

      {/* ── FAR LIGHT: the morning wash (B's one device, unchanged in meaning).
          Warm light from the upper left settles into ordinary daylight as you
          come out into the open — welcome, said in light, exactly once. ── */}
      {isFull && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[5]"
          style={{
            background:
              "linear-gradient(135deg, hsla(42, 90%, 78%, 0.30) 0%, hsla(42, 80%, 84%, 0.16) 38%, hsla(42, 70%, 90%, 0.0) 72%)",
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: T.lightDur, delay: T.lightFrom, ease: [0.4, 0, 0.2, 1] }}
          data-testid="arrival-s2-morning-light"
        />
      )}

      {/* ── HOME. As the walk completes, the room rises to meet you as ONE
          piece (B's furnish) — a few pixels of downward settle, once. For the
          first breath the orchard, seen between the trees, IS the content. ── */}
      <motion.div
        ref={workspaceRef}
        className="relative z-[6] mx-auto w-full max-w-2xl px-4 sm:px-6 flex min-h-[100svh] flex-col justify-center py-10 sm:py-14"
        style={sceneH ? { minHeight: sceneH } : undefined}
        initial={isFull ? { opacity: 0, y: -10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: T.furnishDur, delay: T.furnish, ease: [0.22, 1, 0.36, 1] }}
        data-testid="arrival-s2-workspace"
      >
        <header className="mb-7 sm:mb-9">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mb-1.5" data-testid="text-arrival-s2-date">
            {todayLabel()}
          </p>
          <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground">
            Today
          </h2>
        </header>

        <HomeWorkspace data={d} prefix="s2" />
        <DashboardLink prefix="s2" />
      </motion.div>
    </div>
  );
}
