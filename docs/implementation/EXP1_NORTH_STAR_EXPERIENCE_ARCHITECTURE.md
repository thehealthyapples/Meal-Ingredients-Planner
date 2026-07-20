# EXP1 — North Star Experience Architecture

**Date:** 2026-07-20
**Status:** Implemented
**Governing reference:** the approved **"NorthStar Final"** image (`attached_assets/design/north_star/v3/northstar final.png`) — the canonical visual reference for the platform's experience architecture, read **subordinate to the governing architecture** on every conflict of rule (mission instruction: *"All implementation decisions should align with this visual language unless they conflict with the governing architecture"*).
**Session:** `.engineering/session/runs/EXP1_North_Star_Experience_Architecture.md`
**Rollback identifier:** `rollback/EXP1-north-star-experience-architecture-20260720` → `7571cee8`

> **Naming note.** `EXP1` is also the identifier of `THA_EXPERIENCE_ARCHITECTURE.md` (2026-07-10). This document keeps the mission-specified filename; it does not amend or restate that document, and on any conflict of rule the Experience Architecture prevails.

> **Missing inputs, recorded honestly.** The mission named four documents to read. Two do not exist in this repository under any close name: `THA_Future_Vision_Community_Companion.pdf` and `THA_Nutrition_Enhancement_Philosophy.md`. In their place the mandatory Experience canon was read in the governed order: `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (first, as its §0 requires), `THA_BRAND_CONSTITUTION.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md`, `THA_EXPERIENCE_BLUEPRINT.md`, `THA_KEPT_ROOM_TRANSLATION.md`, `THA_EXPERIENCE_LANGUAGE.md`, and `ENGINEERING_WORKFLOW.md`.

---

## 0. Experience Constitution Check (§ 18.2 — answered before design)

- **HOSPITALITY** — The change removes furniture (a utility bar above the room, three of four top-right glyphs, a duplicate Companion door, a duplicate search) and lets the room greet before it works. Hospitality wins over the efficiency of one-tap header shortcuts. ✅
- **OUTCOME** — *The household feels at home.* Every room now opens as a place (environment first, workspace beneath) rather than as a toolbar with content under it. ✅
- **WEIGHT (GEA2)** — Net interface weight goes **down**: one header bar and three header glyphs retired per room; nothing added except the one Companion button that already existed (moved, not duplicated). ✅
- **VOICE (GEA8)** — No new sentence coaches. Room subtitles are purpose statements ("what this room is for"), never judgements of the household. ✅
- **OWNERSHIP (GEA21–23)** — Every string added is a room's fact (its own name and purpose). No interpretation is added anywhere. ✅
- **AGENCY** — Nothing decides for the household; the change is entirely presentational. ✅
- **RESTRAINT** — No new capability, no new route except the navigation's Household entry to an existing page, no motion beyond household-caused scroll compression. ✅
- **LAYER (GEA20)** — This document records the architecture; the implementation originates no law. Where the North Star image conflicted with governing law, the law won (§ 2 below). ✅

**Experience Test (Blueprint § 15.3)** — *Which room is this?* Answered at the top of the browser by the environment band carrying the room's name. *How should someone feel?* Arrived, oriented, calm. *The one thing this room helps them do?* Unchanged per room; the workspace remains the primary focus.

---

## 1. North Star Experience Architecture

The approved image shows one architecture, which every room now inherits:

1. **The room begins at the very top of the browser.** No utility bar stands above it. The environment is the first thing painted.
2. **The environment is part of the room, not a banner.** It is rendered by the shell at the room's *governed* orchard exposure (Blueprint § 5.1/§ 6.2), occupies one committed region, and gently dissolves into the workspace.
3. **The room's identity sits at the threshold.** Title and a one-line purpose sit on the **ground-plane scrim** at the base of the environment — never on the raw view (Blueprint § 6.1: *"the orchard never carries text"*; the scrim **is** ground plane under the type, which is exactly the negotiation-free remedy § 6.1 prescribes).
4. **The workspace is always the primary focus.** One floating pill holds the room's search and its workspace sections; everything below it is the work.
5. **Sticky elements compress rather than stack.** On scroll, the pill compresses to a single quiet strip carrying the room's name (orientation preserved) and its tools; the environment scrolls away with the room.
6. **One Companion entry.** The embossed sage-ceramic apple button — the Companion's canonical emblem (UI § 10) — is the one door, fixed top-right on every page. The header leaf-glyph door is retired.
7. **Navigation belongs to the workspace.** The bottom room shelf remains the one canonical navigation (Experience Architecture § 8), gains **Household**, and gains **Admin for admins only**. The top-right utility cluster (basket, profile menu, companion leaf) is retired; its destinations live in the navigation.
8. **One identity, in stencil.** The embossed/relief monochrome apple (already canonical since UX2/BRAND1) is the only apple. The three remaining live renders of the legacy coloured `tha-apple.png` are replaced with the stencil mark.

### 1.1 Governed resolutions (where the image conflicted with law, the law won)

| North Star element | Governing rule | Resolution |
|---|---|---|
| Full-bleed environment image atop *every* room | Orchard Exposure Scale is a per-domain constant (Blueprint § 6.2 rule 1; GEA6) | The band renders **per exposure**: image at E2/E3; **warm light only** (no image) at E1; nothing at E0 (Admin — *shuttered, not relocated*). Every room still begins at the top of the browser. |
| Title overlaid on the environment | *"The orchard never carries text"* (§ 6.1) | Title/subtitle sit on the band's **ground-plane scrim** — § 6.1's own remedy: *"any surface where type must sit legibly gets ground plane under that type."* |
| Pill contains room tabs + bottom bar of rooms | *"Exactly one primary navigation"* (Exp Arch § 8) | The pill's tabs are **workspace sections inside the room** (My Cookbook / Recipes / …), not navigation between rooms. The bottom shelf remains the sole primary navigation. The image itself reads this way. |
| Per-room environments (pantry, greenhouse, village…) | One orchard, one asset owner (§ 6.1; UIA § 17); the "theme park" anti-pattern (§ 16) | All E2 rooms share the **one** orchard view at their governed exposure, differentiated by realm tint and ground posture. Distinct room environments are a **future governed admission** (Rollout, § 8) requiring new canonical assets and a Blueprint amendment — not shipped by taste. |
| Companion button as the apple | *"Exactly one apple… two apples with different meanings is a brand failure"* (UI § 10) | The Companion's emblem was **already** the canonical apple carved in sage ceramic (UX2, `companion-emblem`). This work moves the existing button; it mints no second apple. The header's separate brand-mark apple (a second apple placement doing a different job — a home link) is **retired from the header** in the same change, so the apple's placements reduce, not grow. |
| E2 band prominence (the approved image is vivid; the shipped band was a haze) | Exposure resolves through named tokens, set once (UIA § 16; ODL2) | `--orchard-exposure-e2` is revalued **0.55 → 0.82 (light mode)** at its one owner (`index.css`), under the owner's approval of the North Star. Dark-mode values unchanged. No per-surface override anywhere. |

## 2. Reusable Workspace Framework

One framework, four shell-owned pieces, inherited by every room with **zero new per-room components**:

| Piece | Owner | Role |
|---|---|---|
| **Room environment band** (`RoomThreshold` in `app-shell.tsx`, image via `OrchardRoomWindow`) | the shell | The top of every room: view (E2/E3), light (E1) or quiet plane (E0); the room's title and purpose on the ground-plane scrim; rendered once, from the governed exposure map. Home keeps its own E3 window and welcome (its identity is the welcome itself). |
| **Workspace pill** (`WorkspaceHeader`, rebuilt internally — same public API) | the shell + each room's existing call site | Floating pill at the fade boundary: the room's one search, workspace sections (`contextBar`), room actions, Back. Sticky; compresses on scroll to a single strip with the room's name. |
| **Companion door** (`FloatingAssistant` trigger) | the Companion | The embossed apple button, `fixed` top-right on every page, at every scroll position. The only entry point. |
| **Room shelf** (`BottomNav`) | `nav-bar.tsx` | The one canonical navigation. + Household; + Admin (admins only); + the shopping count moved from the retired basket glyph onto the Shopping room entry. |

Pages did not change their `WorkspaceHeader` contract: `title`, `realm`, `search`, `centerContent`, `actions`, `contextBar`, `back`, `wide` all mean what they meant. The framework change is entirely inside the shell and the header component — which is what makes it one architecture rather than twelve redesigns.

## 3. Header, workspace and scrolling behaviour

- **At rest (top of room):** environment band first (its height per exposure: E2 `clamp(180px, 26vh, 300px)`, E1 a `clamp(96px, 12vh, 148px)` light wash, E0 none), title/subtitle on the scrim at its base, workspace pill floating at the boundary, workspace beneath.
- **On scroll:** the band scrolls away with the room (it is *in flow* — never `fixed`, never parallax; UIA § 4). The pill is `sticky top-0`: a sentinel `IntersectionObserver` flips it to its **compressed** state — single strip, ground-plane material, the room's name appears at the left for orientation, search collapses to its field/icon, tabs remain. Compression is household-caused motion (scroll), 0.2 s ease-out, and collapses to a still equivalent under reduced motion.
- **Stacking:** header strip + tabs no longer stack as two bars; compressed state is one strip. The old permanent 56 px white bar above the environment is gone on every page.
- **Workspace maximisation:** content columns keep UX3's reading-width law (no 1920 px stretch); surplus width becomes air and view (GEA11). Vertical gain per room: ~56 px of retired bar plus the retired duplicate search rows.
- **Loading/error states:** the shell's fallback header (`ShellHeader`) still guarantees a named, navigable room during chunk loads and after caught errors (NAV1 preserved) — it now renders the compressed strip.

## 4. Navigation architecture

- `NAV_ITEMS` remains the **single source of truth** for every navigation surface. It gains `{ href: "/profile", label: "Household" }` and `{ href: "/admin", label: "Admin", adminOnly: true }`.
- The bottom shelf renders Admin only for `role === "admin"` users (the same fact `ProfileMenu` used; no new authority — `server/lib/access.ts` remains the only authorisation authority and this is display, not access).
- Retired from the top-right, destinations preserved: **basket** → the Shopping shelf entry carries the count badge; **profile menu** → the Household shelf entry (Profile's Account section already owns Log out); **admin menu item** → the Admin shelf entry; **companion leaf** → the one Companion button.
- Back remains hierarchy, not history (PX1-W4.5, unchanged).
- The Profile page's header realm is corrected `diary` → `home`, settling the recorded one-surface-two-realms inconsistency in the shell's favour (the shell's table was already canonical).

## 5. Branding and iconography specification

- **The stencil identity is already canonical** (BRAND1/UX2): the tone-on-tone embossed apple relief (`.brand-mark`, `.wall-apple`, `.companion-emblem`) — monochrome, material, pressed into the surface. This work completes its adoption:
  - `tha-apple.png` (legacy coloured apple), 3 live renders in the Cookbook (workspace-menu trigger + two empty states) → replaced by a quiet glyph (menu) and the canonical stencil (empty states, via the new `AppleStencil` outline SVG — one file, one owner, `client/src/components/icons/apple-stencil.tsx`).
  - The header's `brandMark` placement is retired with the header bar (see § 1.1 — apple placements reduce to: the Companion door on every page, Home's wall relief, and content empty states in stencil).
  - Meal-card image placeholders swap the generic crossed-cutlery glyph for the stencil apple, per the approved image.
  - `FiveApplesLogo.tsx` (coloured raster) has **zero consumers** — already dormant; `logo-long.png` / `AppleMenu` / `BrandBanner` remain dormant rollback artefacts (mounted nowhere; unchanged).
  - The 1–5 **apple rating** presentation is *not* touched: it is the apple as the face of scores (UI § 10), a different concern from the logo.
- **The Companion button** is the canonical Companion emblem (sage ceramic disc, carved apple, `companion-light` awareness glow) — now fixed top-right, 48 px, the primary branded element on every page. Its four states (idle / aware / listening / speaking) are unchanged.

## 6. Desktop and mobile responsive behaviour

- **Desktop:** band full-width; pill centred at the room's reading width (`wide` honoured); Companion top-right clear of the pill (the pill reserves a right gutter at `xl` and below). Bottom shelf unchanged in placement, centred.
- **Mobile:** identical architecture — band (shorter via the clamps), title on scrim, pill full-width with search collapsing behind its icon, compressed strip on scroll, Companion top-right (the pill's compressed strip reserves right padding so nothing sits under the button), bottom shelf scrollable at ≤390 px with the two added entries.
- No layout forks per room; the one framework carries both sizes.

## 7. Room-by-room implementation summary

| Room | Exposure | What changed |
|---|---|---|
| Home | E3 (own window) | Utility bar above the window retired; welcome is the identity (no duplicate band title); Companion door top-right; shelf gains Household. |
| Planner | E1 | Light band + title at top; pill = week search + week tabs; compressed strip on scroll. |
| Cookbook | E2 | Orchard band at top with title on scrim; pill = search + My Cookbook/Recipes/Freezer/Packaged; coloured apple menu-trigger and empty states re-stencilled; side-panel duplicate search removed. |
| Pantry | E2 | Band + title; pill = pantry search + mode tabs. (The per-category "search or add" combobox is a workspace *tool*, not page search — kept.) |
| Shopping | E1 | Light band + title; pill = mode switcher + controls; basket count lives on the shelf's Shopping entry; shop-mode fullscreen escape unchanged. |
| Nutrition | E2 | Band + title; pill = Plant diversity / Nutrients tabs. |
| Diary | E2 | Band + title; pill = Daily log / Progress tabs; the page-local meal-search stays only inside its picker drawer (a tool, not a page search). |
| Analyser | E1 | Light band + title; pill = packaged-food search + barcode scan (`centerContent`). |
| Orchard / Community | E2 | Band + title; in-room Part navigation unchanged (inside the room, not a second nav). |
| Household (Profile) | E1 | Enters the shelf as a room; light band + title; realm corrected to `home`; Personal/Household/Account tabs unchanged; Log out lives in Account. |
| Admin | E0 | No band — deliberately (shuttered). Compressed strip + AdminBanner domain header unchanged; Admin shelf entry for admins. |
| Companion | — (presence, not a room) | One door: the embossed apple, top-right, every page. Header leaf and bottom-right float retired as *positions*; the button is the same single component. |

## 8. Rollout plan for remaining refinements

1. **Per-room environment assets** (pantry shelves, greenhouse, village) — requires canonical assets and a Blueprint § 5.1/§ 6.2 amendment; until then all E2 rooms share the one orchard. **Governed admission, not a code task.**
2. **Two-orchard convergence** — arrival still uses the pale `/orchard-bg.webp` while rooms use `/orchard.webp` (known pre-existing gap, NORTH2 § 5); a single graded asset should replace both.
3. **True global search** — the pill holds each room's one search; a cross-room search (one index, one surface) is a future capability with intelligence-platform impact (INT17 context views), deliberately not improvised here.
4. **Compressed-strip actions audit** — Shopping's dense `workspaceControlBar` compresses adequately but deserves its own pass under the pill architecture.
5. **Admin room styling** — AdminBanner still styles its own domain header; folding it onto the compressed strip is a follow-up.
6. **`/dashboard`** — legacy surface, kept working under the framework's fallback; its future is a separate decision.

---

## Architecture Compliance

- **One canonical identity per concern** — the environment band, pill, Companion door and shelf each have exactly one owner (shell / header / FloatingAssistant / nav-bar); no page draws its own. ✅
- **One owner per fact** — room names stay `NAV_ITEMS`'; exposure stays the shell map's projection of Blueprint § 5.1; exposure *values* stay `index.css` tokens; room purposes (subtitles) get **one** new owner (`ROOM_PURPOSE` in `app-shell.tsx`, beside the shell's other room facts). ✅
- **No duplicate entities/state** — no new store, no new context beyond the existing slot contracts; the sticky compression is local component state. ✅
- **Extends existing architecture; evolution over replacement** — `AppShell`, `WorkspaceHeader`, `OrchardRoomWindow`, `BottomNav`, `FloatingAssistant` are evolved in place; no competing components introduced. ✅
- **Retire on introduction (GEA18)** — retired in the same change: the permanent header bar above the room, the header brand-mark placement, the header companion leaf, the header basket glyph, the header profile menu, the Cookbook's three coloured-apple renders, the Cookbook side-panel duplicate search, the bottom-right Companion float position. ✅
- **No unrelated refactoring** — the 341 KB meals page and its siblings were touched only at the named seams. ✅

## AI Architecture Compliance

- No prompt, capability, context view, or intelligence behaviour is touched. The Companion's entry point moved position; its panel, state machine, notice engine wiring, and `openCompanion()` channel are byte-identical in behaviour. ✅
- No product knowledge is duplicated into any prompt or string. ✅
- The Companion remains the sole owner of interpretation (GEA21–23); no room gained a coaching voice — subtitles are room purposes, verified one by one. ✅

## Experience & UI Governance Compliance

- **Experience Constitution Check** — § 0 above, answered before design. ✅
- **UX Governance Checklist (Exp Arch § 18)** — one primary action per room preserved; navigation boring on purpose (no animation, no reordering — two entries *added*, order stable); Home remains the anchor. ✅
- **UI Governance Checklist (UIA § 18)** — one green voice; no new colour; motion functional and brief; reduced-motion still equivalent; the graded band declares its type on ground plane; brand assets referenced from canonical owners. ✅
- **Experience Review Questions (Language § 6)** — the arrival beat exists in every room now (orientation before work); the shell does not perform; calm is not lifeless (the band is *life*: vivid, not misty). ✅
- **Experience Test (Blueprint § 15.3)** — § 0. ✅
- **Blueprint Checks (§ 15.2)** — one orchard, one sun, exposure per governed constant, no wallpaper (band is in flow, one committed region), no type on the view (scrim is ground). ✅
- Conflicts resolved in the governing architecture's favour — § 1.1. ✅

## Product Registry Impact

User-facing surfaces changed appearance (header architecture, navigation entries) but no page, route*, capability, claim or benefit was created or removed (*the Household and Admin shelf entries point at existing routes). Registry entries describing the header's top-right actions and the Companion's bottom-right float position are stale as of this change and were updated where they exist; the navigation entry gains Household/Admin rows. Checked via `rg` over `docs/product/` for "basket", "profile menu", "floating", "bottom-right" — see Manual verification.

## Adoption Register Impact

- Adopted (owners unchanged, shapes evolved): `workspace-header` (pill), `orchard-environment` (band height/mask; still the only asset mounter), `bottom-nav` (two entries), `companion-trigger` (position).
- Retired: header brand-mark placement; header companion leaf; header basket; header profile menu; Cookbook coloured-apple renders; Cookbook panel search.
- `npm run adoption:check` — see Manual verification.

## Definition of Done

**Success:** every room opens with its environment at the very top of the browser, identity on the threshold, one pill, one Companion door top-right, one navigation with Household; no coloured legacy apple renders anywhere live; typecheck and platform verifications pass; before/after screenshots demonstrate conformance.
**Must not break:** every room's primary action; search where it existed; admin access; logout; shopping count visibility; Companion open/close from every page; reduced-motion; keyboard reachability of the Companion door and pill.

## Data Impact

**None.** No schema change, no migration, no seed, no data written or read differently. One dev-only screenshot user was created in the development database (id 1225, `northstar-shots@example.com`) for evidence capture; it is development state, not a product change.

## Trust Check

- Nothing added could mislead: subtitles state what a room *is*, not claims about food or the household.
- No fabricated content; the shopping badge moves with its live count; the freezer count stays the freezer's.
- No new source of truth; no duplicated fact (room purposes have one owner).
- The environment is imagery, never evidence: no number, score or claim sits on it.

## Rollback Plan

`git checkout rollback/EXP1-north-star-experience-architecture-20260720` (annotated tag on `7571cee8`). Code-only change — no migration, no data to restore. The tag predates every EXP1 edit; the tree at tag time carried only the session dashboard's heartbeat modification and the untracked North Star image.

## Scope Lock

**Implemented:** the reusable framework (shell band + pill + door + shelf), its adoption by all twelve rooms via the existing header contract, the branding completions, and the named duplicate-removals.
**Explicitly excluded:** per-room environment assets; arrival/auth surfaces (OrchardShell untouched); the two-orchard asset convergence; a true cross-room search; AdminBanner restyling; `/dashboard`'s future; any behavioural, data or intelligence change.
**Suggestions:** § 8 rollout plan.

## Manual verification

Performed against the running dev server (port 5000) with a dedicated beta screenshot user (dev DB id 1225), driven by Playwright at 1512×945 and 390×844:

- **Cookbook (E2)** at rest and scrolled: environment at the very top, title/subtitle on the scrim, pill with the one search + four section tabs, compressed single strip with the room's name on scroll, Companion door top-right in both states, stencil placeholders on un-photographed recipes, side-panel search gone. ✅
- **Home (E3)**: window begins at the very top; no bar above it; welcome unchanged; Household on the shelf. ✅
- **Planner / Shopping / Analyser / Household (E1)**: light band + identity; pills carry their own tools (week tabs · mode switcher · search+scan · section tabs); Household shows no Back. ✅
- **Pantry / Nutrition / Diary / Orchard (E2)**: band + identity + tabs. ✅
- **Admin (E0)**: no environment (shuttered); named strip; AdminBanner unchanged; Admin door on the shelf for the admin role only (verified by role toggle; door absent for `role=user`). ✅
- **Companion**: opens from the one door on desktop; drawer, quick questions and input unchanged; leaf glyph and bottom-right float no longer render anywhere. ✅
- **Gates**: client typecheck **0 errors** (server-test reds pre-existing and untouched); `npm run adoption:check` — the one failure this change introduced (`page-shell` container string) was fixed by resolving through `pageContainerClass`; the remaining 9 failures were verified **byte-identical at the rollback tag** (pre-existing). `repo-structure-verify.sh`: the two loose-file failures are pre-existing (the implementation root already carries ~30 loose reports); this document follows the mission's explicit path.

## User Acceptance Evidence

Before/after screenshots at `attached_assets/design/north_star/v3/evidence/` (`before/`, `after/`): every room at 1512×945, Home/Cookbook/Planner at 390×844, the Companion open state, the Cookbook compressed-scroll state, and Admin captured under an admin role. The governing reference is `attached_assets/design/north_star/v3/northstar final.png`.

---

**Project File Created:** `docs/implementation/EXP1_NORTH_STAR_EXPERIENCE_ARCHITECTURE.md`
**Git Commit SHA:** recorded in `.engineering/session/runs/EXP1_North_Star_Experience_Architecture.md` at commit (a document cannot carry its own commit's hash)
**Current Branch:** `int1-intelligence-platform`
**Rollback Identifier:** `rollback/EXP1-north-star-experience-architecture-20260720` → `7571cee8`
