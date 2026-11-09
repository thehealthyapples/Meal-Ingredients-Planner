/**
 * The one environment owner (Experience Blueprint § 6.1; Adoption Register row 40).
 * HOMEEXT1 adds the owner-selected Home E3 front-garden threshold plate through this
 * file. Arrival and E2 windows keep their existing orchard assets. The earlier
 * OrchardWindow shape was retired when Home adopted HomeExteriorView.
 */
/** HOMEEXT1: the owner-selected Home E3 threshold plate. This module remains the
 * single environment mouth; the image is decorative and never carries text. */
export function HomeExteriorView() {
  return (
    <div className="home-exterior-view" aria-hidden data-testid="home-exterior-view">
      <img src="/images/home/home-front-garden-20261027.png" alt="" />
    </div>
  );
}

/** ARRIVAL's orchard — the full-bleed E3 beat. */
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

/**
 * EXPADOPT1 (2026-07-20) — THE E2 WINDOW, and the retirement of `OrchardOpenView`.
 *
 * TWO THINGS HAPPENED HERE, and they are the same thing.
 *
 * ── What was retired ──
 * `OrchardOpenView` and its three mask constants (`MASK_H`, `MASK_V`,
 * `MASK_BAND`) are DELETED. UX2 superseded that shape with `OrchardWindow` — the
 * real joinery Home renders today — and left the predecessor standing. It had
 * **zero consumers**: nothing in `client/src` imported it, and two of the three
 * live-looking reads of `--orchard-exposure-e3` were inside it, which made the
 * exposure scale look better adopted than it was. UI Principle 5 and GEA18 both
 * say the successor retires the predecessor in the same change; this is that
 * change, late.
 *
 * ── What was built ──
 * `OrchardRoomWindow` — the first consumer `--orchard-exposure-e2` has ever had.
 *
 * Blueprint § 5.1 assigns **E2 — the window** to five rooms: Cookbook, Pantry,
 * Nutrition, Diary and the Orchard. The implementation had all five at E1. So
 * the scale that Blueprint § 6.2 calls a "governed constant" was, in practice,
 * two levels wide — E3 at Home and arrival, nothing anywhere else — and
 * EXPGOV1 § I2 named the consequence exactly: the orchard was "reducible to a
 * few lines on the home page, which means it is not yet a fact of the site."
 *
 * GEA6 is the principle this discharges: *the orchard is a permanent fact of the
 * site, not a feature of a room. A room at E0 is shuttered, not relocated.* A
 * house where only one room has ever had a window is not a house with shutters.
 *
 * ── Why this is a window and NOT the wallpaper CONV1 BEH-7 retired ──
 * The distinction is precise and it is the whole of § 6.1's compliance:
 *
 *   • WALLPAPER is `fixed inset-0`, behind every room, uniformly, at one
 *     strength. That is what BEH-7 removed and what § 16 names an anti-pattern —
 *     "everywhere at once is nowhere in particular."
 *   • A WINDOW is a committed region, at the room's OWN governed exposure,
 *     absent entirely from the rooms whose exposure is E1 or E0.
 *
 * This renders nothing at all at E0/E1 — no element, no image, no request. Only
 * the five E2 rooms mount it, at 0.55 rather than E3's 0.90, in a band at the
 * top of the room that the content begins beneath. The exposure is a per-domain
 * constant (§ 6.2 rule 1) resolved from the token, never a per-surface choice.
 *
 * ── The laws it holds ──
 *   • ONE orchard (§ 6.1): the same `/orchard.webp` Home's window shows. This
 *     change does NOT converge arrival's pale `/orchard-bg.webp` — that
 *     two-asset split is reported as a remaining gap rather than quietly picked.
 *   • NEVER carries text (§ 6.1): the band is `absolute` at the top of the room
 *     with the content flowing beneath it on solid ground. No type sits on it.
 *   • NEVER animates (§ 6.1): still. No drift, no parallax, no ambience.
 *   • FRAMED BY COMPOSITION, never by a drawn frame (§ 6.2): it dissolves
 *     downward into the room rather than meeting an edge. The arch is Home's
 *     alone (§ 6.2 rule 4) and is not borrowed here.
 */

// The E2 band's fade. Vertical only: the band spans the room's width and the
// content begins beneath it, so no type is ever beside it to protect. It
// dissolves rather than stopping on a line — a view that stops on a line is a
// picture hanging on a wall, and the orchard is not a picture.
// EXP1 — the fade starts lower and holds more of the view: the approved North
// Star gives the room a real morning at its threshold, not a haze. The band
// still dissolves into the room rather than stopping on a line.
const MASK_E2 =
  "linear-gradient(180deg, #000 0%, #000 54%, rgba(0,0,0,0.5) 80%, transparent 100%)";

/**
 * Home's E3 view is `HomeExteriorView` above. This is every OTHER room's — the
 * framed, partial presence of Blueprint § 6.2's E2, in one committed region the
 * content deliberately does not cover.
 *
 * Renders `null` below E2, so E1 and E0 rooms cost a household nothing: no
 * element, no image request, no paint. "Shuttered, not relocated" (GEA6) is
 * expressed as the absence of the window, in the same house, from the same one
 * asset — not as a different room.
 *
 * ⚠️ IT WAS `absolute` FIRST, AND THE PICTURE IS WHAT CAUGHT IT.
 *
 * The first build laid the band `absolute inset-x-0 top-0 z-0` BEHIND the room's
 * content. Every measurement passed — the five E2 rooms reported `window=true`,
 * the E1 rooms `false`, the token resolved 0.55. The screenshot showed the
 * Cookbook's section label, "WHOLEFOOD SUGGESTIONS · 500", sitting directly on
 * the orchard with nothing beneath it.
 *
 * That is a straight violation of Blueprint § 6.1 — *"The orchard never carries
 * text. Any surface where type must sit legibly gets ground plane under that
 * type, without negotiation."* — and it is the same defect ODL2 § 3.5 rejected
 * EXP4's Studies B and C for. It was invisible to the probe because "is the
 * element present" and "is type sitting on it" are different questions, and only
 * the second one is the law.
 *
 * § 6.2's own words are the fix: E2 is *"a framed, partial presence in ONE
 * COMMITTED REGION THE CONTENT DELIBERATELY DOES NOT COVER."* Content that flows
 * over the band is content covering it. So the band is IN FLOW — a real block at
 * the top of `main` that occupies its own height and that the room begins
 * beneath. The region is committed because the layout commits it, not because a
 * z-index asked politely.
 */
export function OrchardRoomWindow({ exposure }: { exposure: "e0" | "e1" | "e2" }) {
  if (exposure !== "e2") return null;
  return (
    <div
      aria-hidden
      data-testid="room-orchard-window"
      data-orchard-exposure="e2"
      // EXP1 — the room now BEGINS at this band (nothing stands above it), so
      // the committed region grew to the North Star's proportion. Still in
      // flow, still one region the content deliberately does not cover.
      className="pointer-events-none relative shrink-0 w-full overflow-hidden
                 h-[clamp(180px,26vh,300px)]"
    >
      <img
        src="/orchard.webp"
        alt=""
        className="absolute inset-0 h-full w-full max-w-none object-cover
                   [object-position:50%_64%]"
        style={{
          opacity: "var(--orchard-exposure-e2)",
          WebkitMaskImage: MASK_E2,
          maskImage: MASK_E2,
        }}
      />
    </div>
  );
}


/* `OrchardOpenView`, `MASK_H`, `MASK_BAND` and `MASK_V` stood here until
 * EXPADOPT1 (2026-07-20) retired them — 176 lines with zero consumers, left
 * standing when UX2 superseded the shape with `OrchardWindow` above. See the
 * `OrchardRoomWindow` header for the reasoning. Recovery, if it is ever wanted:
 * `git show rollback/expadopt1-experience-constitution-adoption-20260720:client/src/components/layout/orchard-backdrop.tsx`
 */
