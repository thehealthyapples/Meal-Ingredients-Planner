# LARDER Pass 1 — Room Structure (the empty Living Larder)

**Implementation ID:** `LARDER-PASS1`
**Date:** 2026-07-22
**Status:** IMPLEMENTED — Pass 1 only (empty room; no data, no interactions)
**Rollback identifier:** `rollback/larder-pass1-room-structure-20260722` → `1e18f792` (annotated tag object `66162323`)
**Commit:** _see § Commit below_
**Author of record:** Colin Clapson (Home Owner) · implemented by Claude under the Engineering Workflow
**Governing architecture:** [`LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`](../architecture/LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md) (`LARDER1`) · [`LIVING_LARDER_INTERIOR_ARCHITECTURE.md`](../architecture/LIVING_LARDER_INTERIOR_ARCHITECTURE.md) (`LARDER2`) · [`LIVING_LARDER_INTERACTION_CONSTITUTION.md`](../architecture/LIVING_LARDER_INTERACTION_CONSTITUTION.md) (`LARDER3`) · [`LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md`](../architecture/LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md) (`LARDER4`, § 8 Pass 1)

---

## 1. What was built

The **permanent architecture of the Living Larder, built furniture-first and complete while empty** — Pass 1 of the six-pass build defined by `LARDER4` § 8. It is the room `LARDER2` designs, rendered as a real, warm, beautifully-organised family pantry that **holds no products, binds no data, and offers no interactions.**

If every pantry item disappeared, this is what remains — and it is already a room a household would happily spend time in (`CRAFT1` § 8).

- **Route:** `/larder` (new). Rendered by `client/src/pages/larder-room.tsx`, styled by `client/src/pages/larder-room.css`.
- **The six wings** (`LARDER2` § I.3/§ I.5), in the order a household moves through a kitchen:
  1. **The Dry Store** — open shelving · spice rack · oils & bottles run · working surface · deep drawer · overflow cupboard
  2. **The Daily Rhythm** — breakfast shelf · tea & coffee station
  3. **The Cool Store** — produce baskets · fridge · freezer
  4. **Hospitality** — hospitality cupboard · drinks
  5. **The Working House** — household cupboard · pet corner
  6. **The Seasonal & Growing Room** — seasonal shelf · reserved bay ("room to grow")
- **Every permanent furniture element required by the brief and `LARDER2` § I.4:** shelving ✓ · cupboards ✓ · drawers ✓ · fridge ✓ · freezer ✓ · working surface ✓ · baskets ✓ · reserved growth areas ✓. Each is a self-contained presentational unit (`LARDER4` § 5 — every object its own implementation unit) that **owns no fact and reads no data.**
- **Materials and light are the house's own,** mirroring `.home-room`: one morning sun, upper-left; warm plaster; oak darkened by years of the same morning; willow, warm-cream ceramic (never steel), matte metal. Warm in daylight and candle-kept at night (a `.dark` variant), so calm never becomes clinical or lifeless (Experience Language § 3A).
- **Empty is a designed state:** every shelf, niche, drawer and bay is *composed emptiness* — warm air and light, an open invitation — never a blank, an error, or a prompt to fill (`LARDER2` § I.8; Kept Room Translation § 4.3). The reserved bay is deliberately lighter and softer: space held open on purpose, the room's promise it will mature (`LARDER2` § I.9).

## 2. Files changed

| File | Change | Why |
|---|---|---|
| `client/src/pages/larder-room.tsx` | **new** | The empty room: six wings + permanent furniture, each furniture piece a pure presentational component. No data hooks, no interactions, no controls. |
| `client/src/pages/larder-room.css` | **new** | The room's materials, one-morning light, and furniture, namespaced `.lr-*`. Light + dark. Still by default; honours reduced-motion. |
| `client/src/App.tsx` | route added | Registers `/larder` (lazy) → the empty room. |
| `client/src/components/layout/app-shell.tsx` | one alias added | `ROOM_ALIASES["/larder"] = "/pantry"` so the shell draws `/larder` the same **Larder** identity, threshold and ground as the nav room — one owner of room identity (EXP1), never a second. |
| `scripts/capture-larder-pass1.ts` | **new** (dev tool) | Playwright capture of the empty room (desktop light/dark, mobile), consistent with the repo's other `capture-*.ts` harnesses. Touches no app code. |
| `docs/implementation/LARDER_PASS1_ROOM_STRUCTURE.md` | **new** | This report. |
| `docs/implementation/screenshots/LARDER_PASS1_*.png` | **new** | Before/after evidence (§ 6). |

**No application code beyond the above is touched.** No server file, no schema, no Domain 30/15/2 code, no route other than `/larder`, and the existing `/pantry` reconstruction is left **entirely intact**.

## 3. Key implementation decisions (reported, per `LARDER4` § 2 — never silently approximated)

1. **New route `/larder`; the `/pantry` reconstruction left untouched.** The existing `/pantry` room (the `LARDER` reconstruction, `a788d212`) already carries live interactions (Pass 5 work). Replacing it with an empty room would regress working functionality and is out of Pass 1 scope. So Pass 1 builds the room at its own future home — `/larder`, the Pantry→Larder rename `LARDER1` § 2 declares — and the later passes (data, interactions, motion) grow into it. Retiring `/pantry` and pointing the nav there is **deferred** to when the room is complete.
2. **Room identity is drawn by the shell, not the room.** An initial build gave the room its own title ("The Larder / Kept, and ready."). That duplicates what the shell's `RoomThreshold`/`ShellHeader` own for every room (EXP1: *"a room cannot be trusted to introduce itself differently per page"*) — a one-owner violation (`LARDER4` § 9 "breaks governing architecture"). It was removed; the `/larder` alias makes the shell name the room **Larder** and draw its threshold, exactly as it does for the nav room.
3. **The prepared photographic assets are NOT used.** `client/src/assets/larder/larder-jars.webp` and `larder-counter.webp` depict **invented products and produce** (labelled jars of oats/rice/lentils; a bowl of onions/garlic). `LARDER2` § II.12 / `ED3` forbid the room from dressing itself with produce or products it invented — *"if the room put it there, it is refused."* Dressing the empty room with them would also violate the Pass 1 rule *"no placeholders pretending to be products."* The room is therefore built from **honest CSS materials** (timber, plaster, light) instead. The assets remain unused on disk.

No architectural conflict was encountered; no STOP was required. Each decision above is an application of the governing rules, not a deviation from them.

## 4. Scope adherence — what was deliberately NOT done

Per the mission's Scope Lock and `LARDER4` § 8 (Pass 1 only):

- **No products, and no placeholders pretending to be products.** Furniture only.
- **No data binding.** The component issues no query and reads no Domain 30/15/2/11 state. It imports no data hook.
- **No interactions** — no drag-and-drop, no search, no shopping, no CRUD, no item menus, no controls of any kind. The room is a place, not a tool, at this pass.
- **No cards, tiles, inventory rows, or grids of pantry items.** The furniture is warm timber structure, never a card layout.
- **No companion behaviour, no motion.** Still by default (Kept Room Translation § 4.2); reduced-motion honoured.

## 5. Verification against LARDER1 / LARDER2 / LARDER3 / LARDER4

| Confirmation (mission) | Result | Evidence |
|---|---|---|
| The room exists independently of pantry contents | ✅ | The component renders no data and depends on none; the room is fully drawn with zero items. |
| Every permanent furniture element exists | ✅ | Shelving, cupboards, drawers, fridge, freezer, working surface, baskets, reserved bays — all present across the six wings (§ 1; screenshots § 6). |
| No pantry data is rendered | ✅ | No query, no Domain read, no item, no count, no status chip. |
| The room feels complete while empty | ✅ | Composed-emptiness shelves, warm light and materials, six organised wings; a room worth spending time in (`CRAFT1` § 8). See § 6. |
| No implementation shortcuts introduced | ✅ | No temporary UI, no CRUD, no placeholder products, no card grids; one-owner identity respected; typecheck clean (§ 7). |

**Against `LARDER1`:** the physical-room reading (shelves, jars-to-be, baskets, drawers, fridge, freezer) as a *place*; the Pantry→Larder label drawn by the shell; mobile parity (same room, arranged tall — `LARDER1` § 5). No quantity, no time, no second owner — the room reads and writes nothing at this pass.
**Against `LARDER2`:** the six-wing interior architecture and permanent-furniture-first model, built exactly as § I.3–I.5 lay it out; the growth model present as the reserved bay (§ I.9); empty-room warmth as a designed state (§ I.8). The Two-Layer Law holds trivially — Layer 1 (furniture) is all that exists; Layer 2 (contents) is untouched.
**Against `LARDER3`:** the room holds still (`LIA5`); nothing teleports, appears, or behaves like a spreadsheet because nothing acts at all; every furniture piece has one home. Interaction behaviour is a later pass and is correctly absent.
**Against `LARDER4`:** Pass 1 of § 8 built in order — room structure first, furniture as its own units (§ 3 `LI2`, § 5), no data bound (§ 6 discipline deferred to Pass 4), no interactions (§ 7 deferred to Pass 5), no motion (deferred to Pass 6). No § 9 rejection criterion is met.

**Experience Constitution Check** (`GEA` § 18.2): hospitality — the room receives the household with a warm, kept larder, not an audit ✅ · outcome — less to carry (nothing to maintain) ✅ · weight — an empty room that is lighter, not heavier ✅ · voice — the room reports its own structure and counsels nothing ✅ · ownership/agency — nothing decides for the household; nothing is even actionable yet ✅ · restraint — surplus space is air and light, no score/rank/count ✅ · layer — the room originates no law; the shell owns identity ✅.

## 6. Before / after screenshots

Captured on the local dev server (`http://localhost:5000`, dev-world household), headless Chromium (Playwright). Full-page room shots; the shell's fixed-height scroller was unclipped **at capture time only** so the whole room fits one image (the app is untouched).

- **BEFORE — the prior Larder presentation** (the `/pantry` reconstruction, populated): `screenshots/LARDER_PASS1_BEFORE_pantry_reference.png` (and the room baseline `screenshots/03_Larder.png`).
- **AFTER — the empty Living Larder room** (`/larder`):
  - Desktop, daylight — full room: `screenshots/LARDER_PASS1_desktop_light.png`
  - Desktop, daylight — top framing (shell threshold + Dry Store): `screenshots/LARDER_PASS1_desktop_light_top.png`
  - Desktop, night — full room: `screenshots/LARDER_PASS1_desktop_dark.png`
  - Mobile, daylight — full room: `screenshots/LARDER_PASS1_mobile_light.png`

The after shots show all six wings, every permanent furniture element, and an empty room that reads as a warm, organised family pantry — never inventory software.

## 7. How to verify manually

1. Start the app: `npm run dev` (serves on `http://localhost:5000`).
2. Sign in (any household). Navigate to **`/larder`**.
3. Confirm:
   - The shell names the room **Larder** at the threshold (over the orchard window).
   - Six wings appear in order: Dry Store → Daily Rhythm → Cool Store → Hospitality → Working House → Seasonal & Growing Room.
   - Each wing shows warm, **empty** furniture with quiet nameplates — and **no products, no counts, no cards, no controls, no search.**
   - The room feels complete and warm despite being empty; empty shelves read as intentional.
   - Toggle dark mode: the larder becomes a warm, candle-kept night room — never cold steel.
   - Resize to a narrow width: the same room stacks vertically, wings in the same order (mobile parity).
4. Confirm the existing room is untouched: `/pantry` still renders the prior interactive reconstruction, unchanged.
5. Typecheck: `npm run typecheck:ci` — the 16 reported regressions are **pre-existing** in `server/tests/*` (verified by stashing this change: 16 with and 16 without it). This change adds **zero** new type errors.
6. Re-capture screenshots if desired: `npx tsx scripts/capture-larder-pass1.ts`.

## 8. Known issues / notes

- **`/pantry` and `/larder` both exist during the build.** Intentional (§ 3.1): `/larder` is the empty room under construction; `/pantry` remains the reference reconstruction until the later passes complete, at which point `/pantry` is retired/redirected. Not a defect — a deliberate, reported build state.
- **The room shows generous empty space beside the furniture.** Intentional: the room breathes, and space is not filled simply because it exists (mission ROOM QUALITY; `GEA11`).
- **The shell's threshold purpose reads "See what you keep."** That copy is the shell's owned room purpose (`ROOM_PURPOSE["/pantry"]`), not this pass's to change; left untouched.
- **Unused assets on disk:** the two `client/src/assets/larder/*.webp` files are not referenced (§ 3.3). They are left in place (untracked) rather than deleted, pending an owner decision on whether any non-product larder photography is wanted later.
- **Not started:** Pass 2 and beyond (furniture refinement, storage surfaces, product population, interactions, motion). Deliberately out of scope.

---

*Pass 1 is complete: the room exists before a single pantry item does, and it is already a place a household would happily spend time in. The products come later; the room was here to receive them first.*
