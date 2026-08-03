# Living Home — Stage + Interactive Props Architecture (Model B)

**Date:** 2026-08-01 · **Risk:** 🔴 RED — canonical interaction architecture.
**Type:** Architectural investigation only. No implementation, no image generation, no runtime change, no code commit.
**Branch:** `feat/living-larder-authoritative` · **HEAD:** `e1b38dc8` · **Rollback:** `rollback/living-home-stage-props-investigation-base` → `e1b38dc8`.
**Governing sources read:** `docs/architecture/README.md` bootstrap; LHDC1 (`LIVING_HOME_DESIGN_CONSTITUTION.md`), LARDER1 (`LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`), ASSET1 (`LIVING_LARDER_ASSET_LIBRARY.md`), IMGDIR1 (`LIVING_LARDER_IMAGERY_DIRECTION_DECISION.md`), D-017/D-018 (`LIVING_LARDER_VISUAL_ACCEPTANCE_DECISIONS.md`), LIVINGHOME1/2 (`LIVING_HOME_EXPERIENCE_ARCHITECTURE.md`, `..._ENVIRONMENTAL_DRESSING_...`), EXP3 (`house-asset-register.json` / Life Register § J), CAPBOUND1.

## Headline

**Model B is not a new architecture — it is the canonical architecture THA already has, named.** The Living Home's existing **House (byte-constant) vs Life (data-borne)** distinction (LIVINGHOME1; EXP3 § 4.4) *is* Stage vs Interactive Props. LARDER1 already states the principle in one line: *"the furniture is constant; the household's REAL items decide what stands on it."* The running `/pantry` room built this session (photoreal room background + brass plaques + jar objects) is a working instance of Model B. **Recommendation: adopt Model B as the canonical interaction architecture for every Living Home room.**

## Architecture compliance (claim tags)

| Claim | Status | Evidence |
|---|---|---|
| One canonical Living Home | **Verified** | LIVINGHOME1 is the sole governing owner of the one constant home (GEA5, Blueprint § 6.1). |
| One canonical room owner | **Verified** | Each room's North Star owns its design (LARDER1 for the Larder); one room component renders it (`larder-plaque-room.tsx`). |
| One canonical interactive object owner | **Verified** | A prop = an approved **Life-class asset** (Life Register § J, `living-details-manifest.ts`) bound to one **Domain-30** record. Two facets, each singular. |
| One canonical Pantry state owner | **Verified** | Domain 30 — `user_pantry_items`, `server/storage.ts` the sole writer (LARDER1 § 2). |
| One canonical Shopping owner | **Verified** | Domain 15 — `/api/shopping-list`; adding never removes the staple (LARDER1 § 8). |
| One canonical asset register | **Verified (per class)** | By EXP3 § 4.4 there are exactly two registers **by asset class** — House Register (`house-asset-register.json`) for Stage/House assets, Life Register (§ J) for Prop/Life assets. Each is singular for its class; this is the design, not duplication. |
| No duplicated room state | **Verified** | The Stage is byte-constant (House Register); all state lives in Domain 30/15. The room holds none. |
| No duplicated interaction workflow | **Verified** | Every action (lift, drag, add-to-shopping, bin, move, low) routes through an existing Domain-30/15 owner (see `larder-room.tsx` mutations); drag always has a non-drag equivalent (LARDER1 § 10). |
| Existing architecture extended | **Verified** | Model B formalises the House/Life split as the interaction model; it adds no new domain, store or owner. |
| No duplicate conversation state | **Verified** | The Companion (TIP) owns no business facts and duplicates no product knowledge (PKR26–28); rooms observe, the Companion understands, the household decides. |
| No new AI platform | **Verified** | Asset generation reuses the existing OpenAI/Intelligence Platform config (CB9); no second platform. |

## Comparison of Models A, B, C

| | **Model A — Flat web app** | **Model B — Stage + Interactive Props** | **Model C — Full 3D / VR house** |
|---|---|---|---|
| Room | a photograph behind webpage chrome | a fixed, beautiful photoreal **stage** | a navigable 3D world (walls/rooms as geometry) |
| Interaction | controls/cards pasted over the photo | **objects** are live runtime props on the stage | physics/geometry objects in 3D space |
| Immersion | broken — reads as a dashboard | high — feels like your home | high, but uncanny/effortful |
| Complexity | low | **moderate** (2D assets + DOM props) | very high (engine, physics, assets, perf) |
| Governance fit | **rejected** by D-018 (webpage-over-room) | **matches** House/Life split, room-first contract | over-scoped; no governance calls for it |
| Asset cost | photos only | photoreal **stage + per-prop** assets | full 3D asset pipeline |
| Performance | trivial | light (one bg image + N small elements) | heavy (GPU, load, mobile cost) |
| Verdict | ❌ breaks immersion (D-018) | ✅ **canonical** | ❌ unnecessary complexity, misaligned |

## Recommendation

**Adopt Model B — Stage + Interactive Props — as the canonical Living Home interaction architecture.** It is the only model that is simultaneously (a) immersive, (b) already the architecture (House=Stage, Life=Props), (c) compliant with D-018's room-first contract and LARDER1, (d) achievable with 2D photoreal assets and DOM props — no 3D engine — and (e) additive to existing ownership (Domain 30/15/2, House/Life Registers). Model A is rejected (D-018). Model C is rejected (complexity/misalignment).

## Trade-offs

- **For:** immersion without 3D; reuses every existing owner and register; room-first (D-018); progressive-disclosure-friendly (room → shelf → jars → pick up); cheap runtime; honest-gap discipline already fits (a staple with no approved prop shows a chalk tag).
- **Against / risks:** every interactive object needs an **approved photoreal prop asset** (an asset-generation + Home-Owner-acceptance dependency); **"open" states** (fridge/freezer/cupboard doors) may need a second stage image (open interior) rather than a pure prop; the **Stage↔Prop boundary must be decided per object** (rule below); %-anchors need per-stage tuning against the served render.

**Stage↔Prop decision rule (canonical):** *if the household can pick it up, move, drag, open, close, place, remove, add to shopping, or discard it → it is a Prop (Life-class, data-borne). If it never changes → it is Stage (House-class, byte-constant).* A shelf is Stage; a jar on it is a Prop. A cupboard carcass is Stage; its door (openable) is a Prop.

## Canonical ownership

- **Living Home:** LIVINGHOME1. **Room/Stage:** the room's North Star (LARDER1…) + its room component.
- **Interactive object:** Life Register § J (asset bytes, checksum-approved) **×** Domain 30 (which props exist + their state).
- **Pantry state:** Domain 30. **Shopping:** Domain 15. **Food identity:** Domain 2 (Canonical Food).
- **Asset registers:** House Register (Stage) + Life Register (Props), verified by `verify:living-home-assets`.
- **Publication:** register entry + checksum-bound **Home Owner visual approval** (LHDC1 admission; CB9 for external artefacts).

## Definition of the Stage

The Stage is the **byte-constant environment** of a room: walls, floor, window, daylight, cabinetry, worktops, shelving, permanent architectural features. It is a **House-class asset** (House Register), rendered as a fixed full-bleed background. The Stage **holds no state, never responds to interaction, and never represents a household fact.** It provides atmosphere and defines the coordinate space and the named **anchor slots** where props sit. It is dominant (D-018 room-first).

## Definition of Interactive Props

A Prop is a **runtime object** that represents exactly one Domain-30/15 record as an **approved Life-class asset**. Props are the *only* interactive elements. Each prop: is liftable/draggable/openable per its type; routes **every** action through its owning domain; renders its **own contact shadow** (grounding); shows an **honest chalk-tag gap** where no approved asset exists (never a faked object). Props are placed on the Stage's anchor slots and seated on surface lines. Prop kinds: jars, tins, baskets, bowls, produce, herbs, bottles; doors (fridge/freezer/cupboard); the shopping basket; the waste bin.

## Per-room mapping (Stage vs Props)

| Room | Stage (fixed) | Interactive Props (alive) | Prop-asset status |
|---|---|---|---|
| **Living Larder** | room shell, walls, window, worktop, cabinetry, shelving | jars, produce, baskets, bottles, cupboard/drawer **doors** | jars ✓ approved (7); produce ✓ (2); baskets/doors ✗ gap |
| **Fridge** | fridge carcass + (open) interior shell | fridge **door**, dairy/proteins/leftovers items | ✗ no fridge stage or props exist |
| **Freezer** | freezer carcass + interior | freezer **door**, frozen items | ✗ gap |
| **Store Cupboard** | cupboard carcass + shelves | cupboard **door**, tins/packets/bottles | partial (tins/packets ✗) |
| **Cookbook** | the book room / reading surface | recipe **cards/books** (pick up, open) | ✗ (different asset class) |
| **Shopping** | the shopping surface / area | the **shopping basket** + items added/removed | ✗ basket gap |
| **Diary** | the diary surface | diary **entries/pages** | ✗ |
| **Future rooms** | that room's fixed environment | that room's movable objects | per-room |

*(Fridge/Freezer/cold-storage stages + doors, the shopping basket and waste bin, and produce baskets are all genuine missing assets — see Proof/Data impact.)*

## Define — the 17 architecture points

1. **Stage responsibilities:** render the fixed environment; own the coordinate space + named anchor slots; provide lighting/atmosphere; hold no state; be aria-hidden decoration.
2. **Interactive object responsibilities:** bind one Domain-30/15 record to one approved prop asset; be interactive per kind; route all actions through the owning domain; render own contact shadow; honest gap when no asset.
3. **Coordinate system:** **normalised stage-relative coordinates** — every anchor is a `%` of the Stage image (resolution-independent), so props reposition with the stage at any size. (The elevation's cm-true `--lvcm` remains valid for constructed stages; the photoreal stage uses `%`.) One system per stage, declared once.
4. **Positioning model:** props anchor to **named slots** (e.g. shelf regions) and **seat on a surface line** — the prop's opaque base aligns to the slot's surface Y; props never float.
5. **Responsive behaviour:** the Stage scales (`aspect-ratio` + `cover`); `%`-anchored props scale with it; mobile is the **same stage** through a narrower frame (or a stacked prop list on drill-down), never a different layout (LARDER1 mobile parity).
6. **Animation principles:** restrained, **household-caused only** (GEA14) — lift, open-reveal, drag; disabled under `prefers-reduced-motion`; state is always legible without motion (the confirmation is the state change).
7. **Contact shadows:** each prop carries its own soft contact shadow (baked into the asset or a CSS shadow) so it reads as resting on the surface; the Stage's shadows are static and baked.
8. **Drag behaviour:** pointer + touch (dnd-kit); drag a prop to a drop-zone (Shopping, Bin, another area); **every drag outcome has a non-drag equivalent** in the prop's menu (LARDER1 § 10; keyboard/tap/switch).
9. **Shopping workflow:** drag-to-Shopping / menu → **Domain 15** add; **never removes the staple** (LARDER1 § 8); reversible.
10. **Removal workflow:** drag-to-Bin / menu → **Domain 30 soft-delete**; reversible via Undo/restore; only the explicit *out of the larder* gesture retires a staple.
11. **Accessibility:** every prop is a real `button`; non-drag equivalents for all actions; ARIA labels carry name + status; the Stage is `aria-hidden`; visible focus; no colour-only status.
12. **Mobile interaction:** tap-first; drag via long-press; progressive disclosure (room → shelf page → jars) suits small screens; same stage, narrower frame.
13. **Performance:** Stage = one static image (cheap, cacheable); Props = lightweight PNGs/DOM nodes; **no 3D, no physics**; lazy-load props; the plaque room is one background + N small elements.
14. **Asset ownership:** Stage assets → House Register; Prop assets → Life Register § J (checksum-approved). External (OpenAI) assets enter via CB9 unchanged.
15. **Runtime ownership:** the room component owns Stage render + prop placement; Domain 30 owns prop existence/state; Domain 15 owns Shopping. No runtime code reads the architecture docs.
16. **Business ownership:** Domain 30 (staples), Domain 15 (shopping), Domain 2 (food identity). No new business owner.
17. **Canonical publication ownership:** an asset is *published* only when it is register-entered **and** carries a checksum-bound Home-Owner approval (LHDC1). The Home Owner owns final visual acceptance; implementers never assert it.

## Proof architecture (design only — DO NOT BUILD)

Smallest vertical proof of Model B: **one room · one shelf · five existing jars · lift · drag-to-Shopping · drag-to-Bin · return · desktop + mobile.**

- **Stage:** `orchard-workroom.png` (exists, House-class). **Shelf:** one anchor slot on that stage (exists — part of the stage). **Five jars:** five of the seven **approved** jars (exist, Life-class).
- **Interactions:** lift (hover/focus → translateY + shadow), drag a jar to a **Shopping drop-zone** (→ Domain 15 add, keeps staple) and to a **Bin drop-zone** (→ Domain 30 soft-delete), and **return** (Undo/restore); each with a keyboard/menu equivalent.
- **Missing-asset check (mandatory before any generation):** searched every repo/worktree under `C:\Users\Colin\The Healthy Apples\GitHub`. The **Stage, shelf and five jars all exist**. The **Shopping and Bin targets are interaction *drop-zones* (existing UI patterns), not photoreal props** — so **the proof needs NO new image and NO generation.** *(For the eventual full model, a photoreal **shopping-basket** prop, a **waste-bin** prop and a **produce basket** do not exist — the only basket PNG found is the superseded OpenAI batch-01 `tha-larder-basket-produce-willow.png`, already rejected. These are deferred gaps, to be produced only when those props ship, and only above the agreed OpenAI approval threshold with Home-Owner sign-off.)*

## Implementation roadmap (for approval — not started)

- **Phase 0:** adopt Model B (this decision).
- **Phase 1 — Vertical proof:** the one-room/one-shelf/five-jar proof above, using existing assets + drop-zones. No generation.
- **Phase 2 — Full Larder props:** all approved jars + produce as props; cupboard/drawer **doors** as openable props *iff* door assets exist (else honest-gap).
- **Phase 3 — Store Cupboard / Fridge / Freezer:** gated on each room's Stage + Prop assets (Home-Owner-approved generation batches).
- **Phase 4 — Cookbook / Shopping / Diary:** same Stage+Props model, per-room assets.

## Data impact

**None new.** Model B reuses Domain 30 (Pantry), Domain 15 (Shopping), Domain 2 (Food identity), and the House/Life Registers. No schema, migration, table, or new owner. Each prop maps 1:1 to an existing record; the Stage carries no data.

## Verification plan

`verify:living-home-assets` (Stage/Prop asset governance, one mouth, checksum binding); the D-018 **room-first contract** (Stage dominant, no dashboard); **Home-Owner visual acceptance** (LHDC1); interaction contracts (every drag has a non-drag equivalent; every action routes through Domain 30/15); "no new owner/register" check.

## Rollback plan

Investigation only — nothing to roll back but this document. Rollback point: `rollback/living-home-stage-props-investigation-base` → `e1b38dc8`. (The prior turn's uncommitted implementation is separate and untouched by this task.)

## User acceptance evidence

The running `/pantry` (this session) already demonstrates Model B: a fixed photoreal Stage with live brass-plaque + jar Props, drag/menu actions routed to Domain 30/15. **Action for the Home Owner:** read this document and confirm Model B as canonical (and the Stage↔Prop rule); then approve Phase 1 (the proof) which needs no generation.

## Trust check

- **Verified:** the ownership map, the House=Stage / Life=Props equivalence, and that the proof needs no new asset (all searched and present).
- **Highest-risk remaining claim — Inferred/Assumed:** that a **single fixed Stage image suffices for rooms with "open" states** (fridge/freezer/cupboard doors reveal a different interior). This likely needs either a second stage image (open interior) or a door-prop over a static interior — **not yet proven**, and dependent on assets that do not exist. Also **Assumed:** that North-Star-quality photoreal **prop** assets (baskets, bins, doors, produce range) can be produced for every interactive object — an asset-generation dependency, gated by the OpenAI approval threshold and Home-Owner acceptance. Neither blocks Model B's adoption or the (asset-complete) Phase-1 proof; both must be resolved before the fridge/freezer/shopping-basket rooms.
