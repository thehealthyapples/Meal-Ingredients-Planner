/**
 * The orchard environment asset — the image itself, and its one canonical owner
 * (Blueprint §6.1, adoption register `orchard-environment`).
 *
 * This file owns the ASSET. It exposes exactly two shapes, because THA admits the
 * orchard in exactly two places, at the two exposures Blueprint §6.2 permits:
 *
 *   • <OrchardBackdrop />  — ARRIVAL, at E3. /auth and /onboarding (via
 *     orchard-shell.tsx) and the unauthenticated landing (home-page.tsx).
 *     §6.2 rule 3 permits arrival to stand at E3 for its beat.
 *   • <OrchardOpenView /> — HOME, at E3. §6.2 gives Home, and only Home, "the open
 *     view: the orchard visible as itself, generously; sparse content on its ground;
 *     the view IS part of the room's purpose."
 *
 * NORTH1 (2026-07-17) added the second shape. Until then this file said "a ROOM may
 * never mount this component", and that sentence was right about the SHAPE and wrong
 * about the ASSET. What §6.1 forbids is the wallpaper — `fixed inset-0` behind every
 * room, uniformly, at one strength, which is what CONV1 BEH-7 retired: "a backdrop
 * applied uniformly behind everything is the flattening the Place Principles forbid —
 * everywhere at once is nowhere in particular." It does not forbid Home the view its
 * own exposure level is defined by; refusing Home the image would make E3 undefinable
 * and leave the scale with three levels.
 *
 * So the open view is added HERE rather than in a second component. A second file
 * rendering /orchard-bg.webp would be a second owner of one visual concern, which
 * UIA §17 forbids — and the register row names this file as the owner. One asset, one
 * owner, two governed shapes.
 *
 * ODL2: the opacity was a hardcoded 0.90 here — a raw value in a surface, which
 * UIA §16 calls a defect. Both shapes now resolve --orchard-exposure-e3, whose value
 * IS 0.90, so arrival looks exactly as it did; what changed is that the number has one
 * home and a name.
 */

/** ARRIVAL's orchard — the full-bleed E3 beat. Unchanged since ODL2. */
export default function OrchardBackdrop() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <img
        src="/orchard-bg.webp"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          opacity: "var(--orchard-exposure-e3)",
        }}
      />
    </div>
  );
}

// The two masks that make the view a VIEW rather than a backdrop.
//
// Blueprint §6.2 asks for the orchard "framed by composition, never by a drawn frame",
// and §6.1 forbids it carrying text. Both are the same instruction here: the orchard
// occupies a region, and it dissolves — it never meets an edge, and it never reaches
// the ground the greeting and the counter stand on.
//
// They are applied to two NESTED elements rather than composited on one. `mask-composite`
// is the direct way to intersect two masks and is the less portable one; nesting composes
// them by construction, in every engine, with no vendor branch.
//
// HORIZONTAL — the room's own wall. Solid at the right, gone entirely before the
// greeting. This is what leaves the household's name standing on the warm canvas rather
// than on the landscape, and it is the whole of §6.1's compliance.
//
// The fade itself. Where it STARTS is the load-bearing part, and it is set in
// `OrchardOpenView` by the window's left edge rather than here — see the note there.
const MASK_H =
  "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.38) 9%, rgba(0,0,0,0.85) 17%, #000 26%, #000 100%)";

// The band's fade, for rooms too narrow to hold a window beside the greeting. Vertical
// only: the band spans the full width and the content begins beneath it, so no type is
// ever beside it to protect.
const MASK_BAND =
  "linear-gradient(180deg, #000 0%, #000 54%, rgba(0,0,0,0.5) 78%, transparent 100%)";

// VERTICAL — the sill, and the depth.
//
// The fade is long and low on purpose. A view that stops on a line is a picture hanging
// on a wall, and the orchard is not a picture (§6.2, "framed by composition, never by a
// drawn frame"). It also runs deliberately PAST the top of the counter, at a few percent,
// so the counter has a world behind it — the three grounds of Blueprint §8.1 (world
// behind · room in the middle · what floats), which is the whole reason the middle ground
// reads as a plane at all. A translucent counter over nothing is not a counter; it is the
// same cream, and it disappears.
//
// It is spent before the room tiles, and the only thing standing on it in that band is
// the glance — which is SOLID (--surface-primary). No type on this page ever has the
// image behind it (§6.1, without negotiation); what has the image behind it is the
// counter, and the counter carries no words.
const MASK_V =
  "linear-gradient(180deg, #000 0%, #000 46%, rgba(0,0,0,0.45) 72%, rgba(0,0,0,0.12) 88%, transparent 100%)";

/**
 * HOME's orchard — E3, the open view.
 *
 * Composed, not applied: it occupies the upper right of the room and dissolves toward
 * the left, where the household's name stands in the light, and toward the bottom,
 * where the counter begins. The morning is the asset's own — its sun sits left of
 * centre, which is why the view is positioned to keep it: cropped to the right, the
 * open view would be all trees and no light, and the room's one sun (Blueprint §7,
 * "the morning sun sits upper-left, forever") would be missing from the window it
 * comes through.
 *
 * Absolutely positioned inside the room, never `fixed`: the view belongs to Home and
 * scrolls with it. Fixed would make it wallpaper again, and it would also be the
 * parallax UIA §4 forbids outright.
 *
 * It is STILL. No drift, no sway, no ambience (§6.1: "the orchard never animates";
 * "place survives total stillness").
 */
export function OrchardOpenView() {
  return (
    <>
      {/* ── THE BAND ── below `lg`. A phone has no wall to put a window beside the
          greeting on: at 390px there is no "beside". Split there, the orchard either
          becomes a stripe too thin to read as a place, or it runs under the household's
          name — and it did exactly that before this was measured.

          So the narrow room takes its view over the counter instead of across it: the
          band spans the wall, the room begins beneath it, and the household looks out
          before they look down. Same asset, same E3, same one morning — a different
          wall. The exposure is a constant (§6.2 rule 1) and it is unchanged here; what
          adapts is the aperture's shape, which is composition, and composition is what a
          room does with the wall it has.

          This is deliberately NOT the render's answer. The North Star's own phone plate
          drops the orchard entirely and shows cream — which would leave Home at E1 on the
          device most households actually arrive on (PX1), and make E3 a thing only a
          desktop ever sees. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden
                   h-[clamp(190px,26vh,260px)] lg:hidden"
      >
        {/* The band's crop is its own, and it has to be: a window and a band are
            different shapes, and one crop cannot serve both. `cover` resolves the
            SHORTER dimension, so the wider and shorter the band gets, the harder it
            crops vertically — at 820×260 the window's 168% zoom left nothing in frame
            but magnified hillside, an abstract green wash with no horizon, no trees and
            nothing to recognise as a place. A phone's band is nearly square by
            comparison and holds the whole scene at that zoom, which is why it looked
            right and the tablet did not.
            So: the phone keeps the zoom and the sun just out of frame; from `sm` up the
            band unzooms to hold the whole width — sky, sun, hills and trees — because a
            long low band has room for the horizon and needs it. */}
        <img
          src="/orchard-bg.webp"
          alt=""
          className="absolute inset-y-0 right-0 h-full max-w-none object-cover
                     w-[168%] [object-position:100%_82%]
                     sm:w-full sm:[object-position:50%_72%]"
          style={{
            opacity: "var(--orchard-exposure-e3)",
            WebkitMaskImage: MASK_BAND,
            maskImage: MASK_BAND,
          }}
        />
      </div>

      {/* ── THE WINDOW ── `lg` and up, where there is a wall beside the greeting. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden overflow-hidden
                   lg:block lg:h-[clamp(460px,76vh,760px)]"
      >
      {/* The window's left edge, and the one number in this file that has to be RIGHT
          rather than merely nice.

          `max(700px, 44%)` is what makes §6.1 provable instead of lucky. The greeting is
          capped by `max-w-xl` (36rem = 576px) plus the container's padding (32px), so
          the longest household name in the world cannot push it past 608px. The image
          therefore begins at 700px — 92px of clear canvas past the worst case — at EVERY
          width from `lg` up, because the fixed term wins whenever the percentage would
          creep left. Above ~1590px the 44% takes over and the window simply grows, which
          is what a bigger wall should do with a view (HOUSE1 §19.3: the extra width of a
          large screen becomes air and view, never more widgets).

          The first attempt was a percentage alone — a 34% fade on a 72% window. It was
          correct at 1440, where it was designed and screenshotted, and at 768 it laid the
          orchard straight through the middle of "Welcome home,". Every gate was green.
          A percentage cannot express "clear of the words" because it does not know where
          the words end; `max()` does. */}
      <div
        className="absolute inset-y-0 right-0"
        style={{ left: "max(700px, 44%)", WebkitMaskImage: MASK_H, maskImage: MASK_H }}
      >
        <img
          src="/orchard-bg.webp"
          alt=""
          // Wider than the window and anchored to its right edge — so the window shows
          // the asset's right two-thirds, and the SUN falls just outside the frame.
          //
          // Two findings, both made by looking, neither visible to any gate:
          //
          // Anchored HIGH, the view was all sky: a warm haze with nothing in it, which
          // is the wallpaper §6.1 forbids arriving by the back door. So the band is
          // anchored low, where the asset keeps what makes an orchard an orchard — the
          // hills, the trees, the path between them. The orchard is LIFE (Experience
          // Language §3A.3), and the life in this asset is below its horizon.
          //
          // Centred, the sun sat in the middle of the window and blew it out: the room
          // was brightest where it was emptiest, and the eye went to a white patch
          // instead of to the household's name. Sliding it out of frame keeps the
          // morning — the sky still glows, the hills are still lit from the left, every
          // shadow in the room still agrees with it (§7) — and gives the light somewhere
          // to come FROM. You do not put the sun in the window. You put the orchard in
          // the window, and the sun is why you can see it.
          className="absolute inset-y-0 right-0 h-full max-w-none"
          style={{
            width: "168%",
            objectFit: "cover",
            // Low: the window sits at the eye line and holds the hills, the trees and
            // the path — not the sky above them. Sky is what a window has when there is
            // nothing to see out of it.
            objectPosition: "100% 82%",
            opacity: "var(--orchard-exposure-e3)",
            WebkitMaskImage: MASK_V,
            maskImage: MASK_V,
          }}
        />
      </div>
      </div>
    </>
  );
}
