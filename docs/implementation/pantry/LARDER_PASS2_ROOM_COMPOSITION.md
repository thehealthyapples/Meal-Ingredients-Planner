# LARDER Pass 2 — Room Composition (the Living Larder as one interior)

**Implementation ID:** `LARDER-PASS2`
**Date:** 2026-07-23
**Status:** IMPLEMENTED — Pass 2 only (interior composition; still no data, no interactions)
**Rollback identifier:** `rollback/larder-pass2-room-composition-20260723` → `d25f29a2` (annotated tag object `e93647ef`)
**Commit:** `555ceb8f` (§ 9)
**Author of record:** Colin Clapson (Home Owner) · implemented by Claude under the Engineering Workflow
**Governing architecture:** [`LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`](../../architecture/LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md) (`LARDER1`) · [`LIVING_LARDER_INTERIOR_ARCHITECTURE.md`](../../architecture/LIVING_LARDER_INTERIOR_ARCHITECTURE.md) (`LARDER2`) · [`LIVING_LARDER_INTERACTION_CONSTITUTION.md`](../../architecture/LIVING_LARDER_INTERACTION_CONSTITUTION.md) (`LARDER3`) · [`LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md`](../../architecture/LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md) (`LARDER4`, § 8 Pass 2) · [`THA_CRAFTSMANSHIP_CONSTITUTION.md`](../../architecture/THA_CRAFTSMANSHIP_CONSTITUTION.md) (`CRAFT1`)
**Predecessor:** [`LARDER_PASS1_ROOM_STRUCTURE.md`](./LARDER_PASS1_ROOM_STRUCTURE.md)

---

## 1. What this pass is

Pass 1 built the **furniture** of the Living Larder — every permanent element `LARDER2` § I.4 requires, honestly empty. It was complete and it was correct, and it read as **a furniture catalogue**: each piece floating alone on a plaster field, each with an upper-case nameplate beneath it, all of them left-aligned in wrapping rows with a dead third of the page to the right. It was a *diagram of a larder*, not a larder.

Pass 2 changes **nothing about what the room contains** and everything about **how it is composed**. This is `LARDER4` § 8's Pass 2 ("Furniture — a fully furnished room, still empty, that feels complete and ready to receive provisions"), read as the interior-composition work it is.

> **The test this pass was built against:** the room should resemble a photograph of a beautifully organised family pantry *before any products have been placed inside it* — never a furniture catalogue.

**Nothing was added and nothing was removed from the room's architecture.** The six wings, their order, and every furniture element are exactly as Pass 1 built them. What changed is where they stand, what they stand on, what they stand next to, and how large they are relative to one another.

## 2. Files changed

| File | Change | Why |
|---|---|---|
| `client/src/pages/larder-room.tsx` | recomposed | Furniture grouped into **runs** and **bays** (relationships) instead of a flat list of pieces; per-piece nameplates removed and replaced with accessible names; wing placement (`spanning` / `left` / `right` / `centre`) introduced. Same components, same furniture, same wings. |
| `client/src/pages/larder-room.css` | recomposed | The **ground plane**; the **proportion system** (`--s` / `--sp`); the relationships between abutting pieces; the placement rhythm; softened signage; mobile composition. |
| `scripts/capture-larder-pass2.ts` | **new** (dev tool) | Playwright capture of the composed room, alongside the existing `capture-larder-pass1.ts`. Touches no app code. |
| `docs/implementation/pantry/LARDER_PASS2_ROOM_COMPOSITION.md` | **new** | This report. |
| `docs/implementation/screenshots/LARDER_PASS2_*.png` | **new** | After evidence (§ 6). |

**No other application code is touched.** No server file, no schema, no Domain 30/15/2 code, no route, no shell file. The existing `/pantry` reconstruction is left entirely intact.

## 3. The composition decisions

Each decision below is reported rather than silently applied (`LARDER4` § 2).

### 3.1 The room was given a ground

The single largest cause of the catalogue feeling was that **the furniture was not standing on anything.** Every wing is now an **elevation**: the household is standing in front of a wall, and the furniture stands on the floor at its foot. Every piece in a wing shares one baseline; each run drops a soft contact shadow at its feet.

Empty wall is now *room*. It reads as air and light rather than as a gap where a piece is missing — which is exactly what `GEA11` ("surplus space becomes air and view") requires the empty space to feel like.

### 3.2 The ground is a shadow, not a band — and the wall is the room's own plaster

A first attempt drew each wing as a rounded panel with its own wall tone and a stone floor band. **It was rejected in build:** it reproduced the catalogue at a larger grain — six cards instead of eighteen — and the alternating wall/floor tones terraced the page into stripes.

What ships is the narrow version: the **wall is the room's own plaster** (the page itself — no panel is drawn at all), and the floor is stated only as **the shade a floor gathers at the foot of a wall**, soft on both sides of the line and fading away entirely below it. It runs to the **edges of the room**, not to the edges of a rectangle. The room is one continuous space with furniture standing in it.

### 3.3 Furniture was grouped into things that belong together

Eighteen isolated objects became **nine runs**. Every relationship below is one `LARDER2` already describes in words; this pass simply built it in space:

| Relationship | Why it is the true one |
|---|---|
| **Deep drawers beneath the working surface** — one piece of joinery | The surface you work on and the store directly beneath your hands. Two objects in Pass 1; one in a real larder. |
| **Spice rack hung on the wall above the working surface** | *"shallow, at eye level, by where the cooking happens"* (`LARDER2` § I.4/§ I.5-A5) — a sentence Pass 1 rendered as a floating strip elsewhere in the row. |
| **Bottle pull-out tucked against the working surface** | *"narrow, tall runs beside the working surfaces … reached without moving anything"* (`LARDER2` § I.4). It now stands just in front of the worktop edge, as a pull-out does. |
| **Fridge + freezer as one cold pair** | The Cool Store's cold keeping is one run of joinery, sharing a seam and a height — not two appliances parked apart. |
| **Breakfast shelf above the tea & coffee cupboard** | *"the breakfast station … the tea and coffee beside it"* (`LARDER2` § I.5-B1/B2) — one corner of the room, reached half-awake in a single turn. |
| **Pet corner low at the foot of the household cupboard** | *"kept in its own corner"* (`LARDER2` § I.5-E2) — a low unit tucked at the cupboard's base, quiet and out of the way. |
| **Seasonal shelf running straight on into the reserved bay** | One length of shelving, part of it kept in hand (`LARDER2` § I.9) — not a shelf and a separate empty rectangle beside it. |
| **Produce baskets nested and overlapping** | Baskets gather; they do not queue. Three sizes, overlapping, on the floor. |
| **Cool larder set just short of the cold store** | Produce lives near the cold keeping in a real kitchen — near it, never crowding it. |

### 3.4 The per-piece nameplates were removed

Pass 1 gave every piece an upper-case nameplate beneath it (`OPEN SHELVING`, `SPICE RACK`, `FRIDGE`…). **They were the catalogue's callouts** — the single most diagram-like element in the room, and the thing that made eighteen pieces read as eighteen catalogue entries. A real pantry does not label its own furniture; the wing's own quiet signage gives the sense of place, and the furniture speaks for itself.

**Nothing was lost for anyone.** In Pass 1 every furniture element was `aria-hidden`, so the nameplate was the *only* thing assistive technology could reach. Each piece now carries `role="img"` and an accessible name describing it as the physical thing it is — *"Working surface, with deep drawers beneath"*, *"Spice rack, on the wall above the working surface"* — which is what `LARDER1` § 10 asks for (*"roles and names that describe the physical arrangement truthfully"*). The change is a net improvement to the accessible reading of the room, not a trade against it.

### 3.5 A proportion system

Pass 1's sizes were per-piece `clamp()`s, so a fridge was barely taller than a cupboard and the spice rack was a thin strip. The room now has **one scale** (`--s` / `--sp`) and every height is stated in it:

- the dresser is the tallest thing in the room (360)
- the cold doors are head-high (316)
- the tall cupboards stand between (262)
- the bottle pull-outs are chest-high (214 / 186)
- the working surface is waist-high (116), and the pet corner is a low unit at the floor (78)

Because one scale governs all of them, **the proportions stay true at every width** — the room shrinks; it never re-proportions itself.

### 3.6 Visual hierarchy and the focal point

The room now has a clear order of weight:

1. **The Dry Store is the focal wall.** It is the only wing given the whole width, it carries the heaviest mass (the dresser), and it holds the room's **focal point** — the **working surface**: the lightest timber in the room, the emptiest wall above it, and the only piece framed on three sides (dresser to the left, pull-out to the right, spice rack above). The eye enters at the tall dresser where the morning falls, drops to the counter, and rises again at the overflow cupboard.
2. **The Cool Store** is the second beat — the tallest pair after the dresser.
3. **Hospitality** and **The Working House** are middle weights.
4. **The Daily Rhythm** is small and quiet.
5. **The Seasonal & Growing Room** is the lightest note in the room and closes it — low, wide, and mostly air, which is what it *is*.

### 3.7 A rhythm down the room, instead of a left-hand column

The wings no longer all start at the same left edge. They sit **spanning · left · right · left · right · centre**, each wing's signage moving with its own furniture. The eye travels down the room in a gentle zigzag; nothing reads as a list of rows, and no two consecutive wings are aligned the same way.

Spacing was made uneven for the same reason: the heart is given more air after it than the quieter wings are, so the room has a **rhythm rather than a metre**.

### 3.8 Signage was softened

The wing headings were a heading, a sentence, and a full-width hairline rule — a document section header. The rule is gone, the type is a step smaller and quieter, and the header aligns with its own composition. It now reads as the quiet signage of a well-kept pantry: enough to give a sense of place, never a form header.

### 3.9 Mobile is the same composition, not a different room

On a narrow wall the runs stack **down** the wall instead of across it, keeping their order and their grouping, each still standing on its own stretch of ground which still runs to the room's edges. Nothing is dropped, nothing regroups, and nothing becomes a list — `LARDER1` § 5's requirement that mobile be *the same visual Larder*, arranged tall.

## 4. Scope adherence — what was deliberately NOT done

Per the mission's Scope Lock:

- **No products**, and no placeholders pretending to be products. Furniture only.
- **No data binding.** The component issues no query and reads no Domain 30/15/2/11 state. It imports no data hook.
- **No interactions** — no drag-and-drop, no search, no shopping, no CRUD, no item menus, no controls of any kind.
- **No animation.** The room is still. There is no transition, no keyframe, and no hover state anywhere in the room; reduced-motion remains honoured.
- **No architectural change.** The six wings, their order, and every furniture element of `LARDER2` § I.4 are unchanged. No wing was added, split, merged, renamed or reordered.
- **No change of room ownership.** The shell still draws the room's identity and threshold (EXP1); the room originates nothing.
- **No new stored fact, no new owner, no new write path.** The Two-Layer Law holds trivially: Layer 1 (furniture) is all that exists.

## 5. Verification

| Confirmation (mission) | Result | Evidence |
|---|---|---|
| The room feels like one coherent interior | ✅ | One continuous plaster wall and one ground running to the room's edges; no panels, no cards, no bands (§ 3.1–3.2; screenshots § 6). |
| Furniture naturally belongs together | ✅ | Nine runs of pieces that touch, tuck, hang above, or nest — each relationship one `LARDER2` already describes (§ 3.3). |
| Visual hierarchy is established | ✅ | One scale governs every height; the room reads in five weights, heaviest to lightest (§ 3.5–3.6). |
| Focal points exist | ✅ | The Dry Store is the focal wall; the working surface is its still point, framed on three sides and lit (§ 3.6). |
| Empty space feels intentional | ✅ | The wall runs to the room's edges, so unoccupied wall is *room*. The reserved bay continues the seasonal shelf's own planks — space held open, not a gap (§ 3.1, § 3.3). |
| No products have been introduced | ✅ | No product, no placeholder, no invented produce. The prepared photographic assets remain unused (Pass 1 § 3.3 — they depict invented products; `LARDER2` § II.12 / `ED3` refuse them). |
| No interactions have been added | ✅ | No handler, no control, no hook, no drag target, no search, no menu anywhere in the component. |
| Architecture remains unchanged | ✅ | Same six wings in the same order, same furniture inventory, same route, same shell-owned identity. Governance files byte-untouched. |

**Against `LARDER1`:** the physical-room reading is stronger, not weaker — shelves, a working surface, a pull-out, baskets, drawers, cold doors, read as *a place*. Mobile parity holds (§ 3.9). No quantity, no time, no second owner: the room still reads and writes nothing at this pass. Accessible naming improved (§ 3.4, `LARDER1` § 10).
**Against `LARDER2`:** § I.3–I.5's wings unchanged; § I.4's furniture-first model unchanged; **§ I.4's own placement language now actually built** (spice rack at eye level where the cooking happens; the pull-out beside the working surface; the drawer read from above at the low, heavy end; baskets open and honest). § I.8's composed emptiness is stronger — empty space now reads as air in a room. § I.9's growth model reads as one run of shelving with room left in it.
**Against `LARDER3`:** the room holds still (`LIA5`) — nothing moves, because nothing acts. Every object has one home and is discovered there (`LIA4`); nothing teleports or appears, because nothing changes (`LIA2`/`LIA3`). No CRUD, no database concept, no modal, no card grid, no inventory management (§ 9.2, all six criteria clear).
**Against `LARDER4`:** Pass 2 of § 8 built in order — the room stood first (Pass 1), the furniture is now composed as the room's permanent structure, no data is bound (Pass 4), no interactions (Pass 5), no motion (Pass 6). `LO1`/`LO2` hold: each object is its own unit with its own presentation, and **no object is a generic card** — the pass's whole purpose was removing the last residue of catalogue from the room. No § 9 rejection criterion is met.

**Experience Constitution Check** (`GEA` § 18.2): **hospitality** — the room receives the household as a warm, kept pantry rather than a set of parts ✅ · **outcome** — *less to carry*: nothing to maintain, and the room is now read at a glance instead of scanned piece by piece ✅ · **weight** — a better-composed room is a *lighter* one; eighteen labelled objects became nine wordless groups ✅ · **voice** — the room reports its own structure and counsels nothing ✅ · **ownership / agency** — nothing decides for the household; nothing is even actionable ✅ · **restraint** — a whole layer of labels deleted, nothing added; surplus space is air; no score, rank or count ✅ · **layer** — the room originates no law; the shell owns identity; every design decision cites `LARDER2` ✅.

**Craftsmanship Standard** (`CRAFT1` § 3–§ 5): every detail intentional (proportion system, one light direction, one contact-shadow rule); **beautifully real** — timber, plaster, willow and warm ceramic, no fantasy, no gamification, no decoration for its own sake. **Quality Standard** (`CRAFT1` § 8): *"Would I happily spend time here?"* — the Home Owner's to answer; this pass exists because the honest answer to the Pass 1 room was *"not yet."*

**Data Impact.** Reads nothing. Writes nothing. Creates no table, column, migration, capability, route or write path. Changes no existing data meaning. Requires no backfill.

**Product Registry impact.** None. No surface, route, journey, capability, setting or claim is added, changed or retired — `/larder` remains the same room under construction that Pass 1 registered as a build state (§ 8, known issues).

**Adoption Register impact.** None. No shared component, hook, token or utility class is created, adopted or retired; every class introduced is namespaced `.lr-*` and local to this room's own stylesheet.

## 6. Before / after screenshots

Captured on the local dev server (`http://localhost:5000`, dev-world household), headless Chromium (Playwright). Full-page room shots; the shell's fixed-height scroller was unclipped **at capture time only** so the whole room fits one image (the app is untouched).

| | BEFORE (Pass 1 — the furnished room) | AFTER (Pass 2 — the composed room) |
|---|---|---|
| Desktop, daylight | `screenshots/LARDER_PASS1_desktop_light.png` | `screenshots/LARDER_PASS2_desktop_light.png` |
| Desktop, daylight — top framing | `screenshots/LARDER_PASS1_desktop_light_top.png` | `screenshots/LARDER_PASS2_desktop_light_top.png` |
| Desktop, night | `screenshots/LARDER_PASS1_desktop_dark.png` | `screenshots/LARDER_PASS2_desktop_dark.png` |
| Mobile, daylight | `screenshots/LARDER_PASS1_mobile_light.png` | `screenshots/LARDER_PASS2_mobile_light.png` |

The before shots show warm, correct furniture floating in labelled isolation. The after shots show one room: a wall, a floor, furniture standing on it in groups that belong together, and empty space that reads as air.

## 7. How to verify manually

1. Start the app: `npm run dev` (serves on `http://localhost:5000`).
2. Sign in (any household). Navigate to **`/larder`**.
3. Confirm the room reads as **one interior**:
   - Every wing has a **floor**; nothing floats. Furniture in a wing shares one baseline and drops a soft shadow at its feet.
   - The wall runs to the **edges of the room** — there are no panels, cards, or bands.
   - The **Dry Store** is the widest and heaviest wing; within it the **working surface** is the still point, with the **deep drawers in its base**, the **spice rack on the wall above it**, and the **bottle pull-out tucked against its side**.
   - **Fridge and freezer** stand as one pair; the **baskets** are nested and overlapping just short of them.
   - The **breakfast shelf** hangs above the **tea & coffee cupboard**; the **pet corner** is low at the foot of the household cupboard; the **seasonal shelf runs straight on into the reserved bay**.
   - The wings sit **spanning · left · right · left · right · centre** — no left-hand column.
   - **No nameplates** under the furniture, and **no products, counts, cards, controls or search** anywhere.
4. Confirm the empty room still feels warm and finished: empty shelves read as intentional, and unoccupied wall reads as air rather than a gap.
5. Toggle **dark mode**: the larder becomes a warm, candle-kept night room — never cold steel.
6. Resize to a narrow width: the same room, the same groups, stacking down the wall in the same order, each keeping its ground. Nothing becomes a list.
7. **Accessibility:** with a screen reader, each piece of furniture is announced as the physical thing it is (*"Working surface, with deep drawers beneath"*), inside a wing announced by name.
8. Confirm the existing room is untouched: `/pantry` still renders the prior interactive reconstruction, unchanged.
9. Typecheck: `npm run typecheck:ci` — the 16 reported regressions are **pre-existing** in `server/tests/*` and identical to the set Pass 1 recorded. This change adds **zero** new type errors, and touches no file that appears in the report.
10. Re-capture screenshots if desired: `npx tsx scripts/capture-larder-pass2.ts`.

## 8. Known issues / notes

- **`/pantry` and `/larder` both exist during the build.** Inherited from Pass 1 § 3.1 and unchanged: `/larder` is the room under construction; `/pantry` remains the reference reconstruction until the later passes complete, at which point `/pantry` is retired or redirected. A deliberate, reported build state — not a defect.
- **The wing signage remains.** The per-piece nameplates were removed (§ 3.4) but each wing keeps a quiet name and one sentence. This is a considered stop, not an oversight: in an *empty* room the signage is what gives a sense of place, and `LARDER2` § I.2 asks the room to be *recognised*. Whether the signage survives once real provisions populate the wings is a Pass 4 judgement, not this pass's.
- **The shell's threshold purpose reads "See what you keep."** That copy is the shell's owned room purpose (`ROOM_PURPOSE["/pantry"]`), not this pass's to change; left untouched.
- **Unused assets on disk:** the two `client/src/assets/larder/*.webp` files remain unreferenced (Pass 1 § 3.3 — they depict invented products and produce, which `LARDER2` § II.12 / `ED3` refuse). Left in place pending an owner decision on whether any non-product larder photography is wanted later.
- **16 pre-existing typecheck regressions** in `server/tests/*`, unchanged by this work (§ 7.9).
- **Not started:** Pass 3 (storage surfaces that open), Pass 4 (product population), Pass 5 (interactions), Pass 6 (motion and refinement). Deliberately out of scope. **Product population has not begun.**

## 9. Commit

**`555ceb8f55f3a67660298c2d4d67108af7539af8`** — *LARDER Pass 2 — compose the Living Larder as one interior.*

That commit carries the whole of this pass: the recomposed room, the capture harness, the screenshots, the session record, and this report. A commit cannot contain its own hash, so the hash above is written here by the one small follow-up commit that does nothing else.

---

*Pass 2 is complete: the same furniture, now standing in one room. The Larder no longer reads as a catalogue of the things a larder contains — it reads as a larder, waiting. The products still come later; the room they will come into is now composed to receive them.*
