/**
 * The orchard environment asset — the image itself, and its one canonical owner
 * (Blueprint §6.1, adoption register `orchard-environment`).
 *
 * This file owns the ASSET. It exposes exactly three shapes, one per exposure
 * level Blueprint §6.2 draws the orchard at:
 *
 *   • <OrchardBackdrop />   — ARRIVAL, at E3. /auth and /onboarding (via
 *     orchard-shell.tsx) and the unauthenticated landing (home-page.tsx).
 *     §6.2 rule 3 permits arrival to stand at E3 for its beat.
 *   • <OrchardWindow />     — HOME, at E3. §6.2 gives Home, and only Home, "the open
 *     view: the orchard visible as itself, generously; sparse content on its ground;
 *     the view IS part of the room's purpose." Real joinery — see its own header.
 *   • <OrchardRoomWindow /> — THE E2 ROOMS, at E2, and NOTHING at E1/E0. Added by
 *     EXPADOPT1; see its header for why a window is not the wallpaper BEH-7 retired.
 *
 * EXPADOPT1 corrected this list. It read "exactly two shapes" and named
 * `<OrchardOpenView />` as Home's — a shape UX2 had already superseded with
 * `OrchardWindow` and which had no consumers at all. The count was wrong in both
 * directions at once: it named a dead shape and omitted a live one.
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

/**
 * NORTH2 (2026-07-17) — THE GRADE IS IN THE ASSET, AND WHY IT HAD TO BE.
 *
 * The asset was pale. Laid at E3 behind a warm room it read as a haze — "like a
 * background image", which is what the brief refuses and what a view is not. So it is
 * graded: saturation 1.28, contrast 1.06, applied ONCE, at 1536×1024, and baked into
 * `/orchard-bg.webp` itself. Saturation puts the life back in the greens — the orchard
 * is LIFE (Experience Language §3A.3), and a desaturated orchard is the "gloomy, misty,
 * melancholy" §3A fixes it AGAINST by name. Contrast gives the hills their distance
 * back, which is what makes it a place rather than a wash. It adds no second light and
 * moves no sun: a grade changes how a negative is PRINTED, never where the morning
 * comes from, so every shadow in every room still agrees with the same upper-left sun
 * (Blueprint §7).
 *
 * ⚠️ IT WAS A CSS `filter:` FIRST, AND THAT WAS A LATENT SECOND ORCHARD.
 * The filter was applied here, to the three shapes this file owns, under a comment
 * asserting that one constant on every shape kept Blueprint §6.1's ONE orchard intact.
 * That assertion was false, and the picture is what proved it. **Five surfaces mounted
 * this asset WITHOUT this owner**, straight from `url('/orchard-bg.webp')`:
 *
 *     client/src/components/ui/dialog.tsx:48            ✅ CLOSED — UX3 (E0)
 *     client/src/pages/list-page.tsx:417                ✅ CLOSED — page deleted
 *     client/src/pages/shopping-list-page.tsx:3014      ✅ CLOSED — page deleted
 *     client/src/pages/onboarding-page.tsx:454          ✅ CLOSED — UX3 (ground, not a 2nd window)
 *     client/src/pages/shopping-workspace-page.tsx:2328 ✅ CLOSED — UX3 (E1)
 *
 * ✅ **ALL FIVE ARE NOW CLOSED, and this file is once again the only mounter of the
 * asset.** Two went when their pages were deleted; UX3 closed the remaining three
 * against the Blueprint's exposure scale rather than by deleting the picture and
 * hoping — a dialog is E0, Shopping is E1, and onboarding's card is the GROUND that
 * § 6.1 requires under type while the arrival's view stays behind it, owned here.
 * `grep -rn "orchard-bg.webp" client/src` now returns this file and comments only.
 *
 * A filter here would have graded arrival and Home and left those five ungraded — two
 * different orchards seen from one house, which is the same defect as two suns (§16)
 * wearing different clothes. Grading the ASSET makes §6.1 true BY CONSTRUCTION rather
 * than by discipline: every consumer gets the same morning whether it asks this file
 * for it or not, and no future bypass can fork it either. It also costs no runtime
 * filter, and it will not double-grade the real orchard photograph when it lands.
 *
 * The asset got SMALLER doing it — 56,986 → 51,722 bytes — so PX1-W3's performance
 * budget ("Make the Product Feel Instant") is improved, not spent.
 *
 * 🔴 THOSE FIVE BYPASSES WERE A REAL DEFECT AND NORTH2 DID NOT FIX THEM. This file's
 * header says "One asset, one owner, two governed shapes", and the adoption register's
 * `orchard-environment` row says "two permitted surfaces (arrival, and /home) ·
 * nothing else." **Both sentences were false** from before NORTH2 until UX3: there
 * were five more, one of which (`dialog.tsx`) put the orchard behind EVERY dialog in
 * the product. Fixing them is architecture, not art direction, and NORTH2 was scoped
 * to craft — so it reported them in docs/implementation/NORTH2_HOME_REFINEMENT.md §6
 * rather than quietly correcting or quietly ignoring them. **UX3 closed them**, and
 * both sentences are true for the first time.
 *
 * ⚠️ THE GRADE IS A CEILING, NOT A FIX. This asset is a pale watercolour of a MEADOW:
 * rolling hills, a path, a few generic horizon trees. No apple trees, no rows, no
 * blossom, no fruit — nothing that makes an orchard an orchard. Every copy in the
 * repository is byte-identical (md5 332f82…) and the shipped webp was visually
 * indistinguishable from the 2MB PNG it came from, so there was never a richer version
 * to restore. No grade adds a tree. This makes a weak asset carry as far as it can and
 * no further; the real fix is a new asset, specified in §5 of that report.
 */

/**
 * UX2 (2026-07-19) — HOME's orchard, seen THROUGH THE WINDOW.
 *
 * This REPLACES `OrchardArch`. ARRIVAL1 built NORTH5's plaster archway; NORTH4
 * Concept B superseded it, and `HOME_ARRIVAL_PRODUCTION_LOCK` § 2 fixed that
 * supersession as final — *a panoramic orchard behind full glass above, an oak
 * sill as the absolute boundary, a calm plaster room below.* This component is
 * the built form of that lock's glass.
 *
 * It is still a governed shape on the ONE owner (this file) — not a second
 * component and not a second `url(...)` bypass, which UIA §17 forbids and this
 * file's header names by count. The arch's shape is retired with it, so the
 * count does not grow.
 *
 * The window is REAL JOINERY, and that is the whole architectural claim: a head
 * reveal with wall thickness above the glass, jambs returning down each side,
 * and timber mullions holding three bays. Those are the CSS's (index.css, the
 * `.home-window` block); this component owns only the ASSET and its crop.
 *
 * THE CROP IS THE COMPLIANCE MECHANISM and must be preserved (NORTH4 § 7).
 * Anchored high (`50% 22%`) so the asset's sun-flare — upper-right — never sits
 * centre-frame against Blueprint § 7's one upper-left morning, and so the
 * skyline stays put when the glass shortens on a narrow screen: only the near
 * ground trims. The Arrival viewpoint is PERMANENT — the same familiar view
 * every morning; only how much of it is opened ever changes.
 *
 * The asset is the REAL orchard — /orchard.webp, from the canonical ORCHARD.png
 * (apple trees, blossom, the oak gate, the mown path). The pale /orchard-bg.webp
 * still stands at arrival and the five dialog surfaces; that two-orchards state
 * is the known tension ARRIVAL1 reported, and converging it remains out of
 * Home's scope.
 *
 * STILL — no drift, no sway (§6.1: "the orchard never animates").
 */
export function OrchardWindow() {
  return (
    <div className="home-window" aria-hidden data-testid="home-orchard-window">
      <img src="/orchard.webp" alt="" />
      {/* The mullions — timber holding the glass up, never lines drawn on a
          photo. Two on a wide wall (three bays), one from `900px` down. */}
      <div className="home-mullion home-mullion--one" />
      <div className="home-mullion home-mullion--two" />
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
const MASK_E2 =
  "linear-gradient(180deg, #000 0%, #000 46%, rgba(0,0,0,0.42) 74%, transparent 100%)";

/**
 * HOME's orchard is `OrchardWindow` above. This is every OTHER room's — the
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
      className="pointer-events-none relative shrink-0 w-full overflow-hidden
                 h-[clamp(96px,13vh,168px)]"
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
