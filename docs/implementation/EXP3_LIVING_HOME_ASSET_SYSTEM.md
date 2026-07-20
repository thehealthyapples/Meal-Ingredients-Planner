# EXP3 — Living Home Asset System

**Date:** 2026-07-20
**Status:** DESIGN — implementation architecture only; **nothing in this document is built**
**Governing reference:** `docs/architecture/LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (`LIVINGHOME1`) — *the house holds still; the life moves* — read under the Architecture Bootstrap order (`docs/architecture/README.md`)
**Session:** `.engineering/session/runs/EXP3_Living_Home_Asset_System.md`
**Rollback identifier:** `rollback/EXP3-living-home-asset-system-20260720` → `81934cdf`

> **Naming note.** `EXP3` is also the identifier of the arrival-synthesis prototypes (`docs/implementation/ux/EXP3_ARRIVAL_SYNTHESIS_PROTOTYPES.md`, 2026-07-15). This document keeps the mission-specified filename; the two workstreams are unrelated and neither amends the other.

---

## 0. Experience Constitution Check (§ 18.2 — answered before design)

- **HOSPITALITY** — The system's default output is *nothing*: every asset it may ever show is either the house's constant architecture or a truth from the household's own life, absent when the truth is absent. No efficiency is traded; nothing is added to any working surface. ✅
- **OUTCOME** — *The household feels at home.* The home stays recognisably the same place for a decade while their own life — their food in season, their used cookbook, their plans — shows through it truthfully. ✅
- **WEIGHT (GEA2)** — The design adds no interface weight: compositions live inside the environment band's already-committed region, below the emphasis budget, and E1/E0 rooms gain nothing at all. The verification design *removes* weight risk by making silent additions mechanically detectable. ✅
- **VOICE (GEA8/GEA9)** — Assets never speak. No composition carries text, status, or judgement; every fact a composition reflects is a room's fact, already stated as text by the room. ✅
- **OWNERSHIP (GEA21/GEA22)** — A composition observes the way a window observes: it shows what is there and has no view about it. Interpretation stays the Companion's; nothing here gives an image a voice. ✅
- **AGENCY (GEA23)** — Nothing decides for the household. What appears is a projection of what they already did (planned, stocked, cooked, declared); celebrations reach the visual layer only through choices the household made. ✅
- **RESTRAINT (GEA11/GEA13/GEA15)** — One detail per room stands (Blueprint § 12.1.1); most rooms have already spent it, and this document says so rather than designing around it. Silence (an empty sill) is first-class. ✅
- **LAYER (GEA20)** — This is an implementation-architecture document beneath `LIVINGHOME1` and the Experience canon. It originates no law; where the mission's ambition met a governing refusal, the refusal won and is recorded (§ 2.3, § 14). ✅

**Experience Test (Blueprint § 15.3)** — *Which room is this?* Unchanged: the band and threshold say it. *How should someone feel?* At home in a place that has visibly been lived in — by them. *The one thing the room helps them do?* Untouched; nothing here is functional.

---

## 1. Mission and the one distinction

Design the asset system that realises the Living Home: **the house architecturally constant; the life within it evolving naturally** through authentic household detail — flowers, books, mugs, seasonal produce, recipes, textiles — quietly reflecting the seasons, the household's rhythm, and their declared celebrations, without ever changing the canonical home or orchard.

The whole design reduces to one instrument, stated once and enforced mechanically throughout:

> **If it changes, it must be data. If it is not data, it must never change.**
>
> Every asset in the Living Home belongs to exactly one of two registers. The **House Register** holds the architecture — the one orchard, Home's window joinery, the tokens of light and ground. Its contents are byte-constant: they never vary by season, hour, household, or occasion, and changing one is an *architecture change*, made deliberately through governed amendment. The **Life Register** holds the living details — and nothing enters it without a **data binding**: a named canonical owner whose true facts decide, at read time, whether the asset appears at all. Life assets are *absent by default*; the house is complete without every one of them (Blueprint § 12.1.3, cited).

This is `LIVINGHOME1` § 3's principle made checkable at the asset layer. "Changing the home" becomes a reviewable diff in a checksum register (§ 4.4); "changing the life" becomes no diff at all — it is runtime data doing what data does. A pull request can now be told apart *mechanically*: one that touches the house must cite its amendment; one that adds life must show its binding.

### 1.1 What this document is, and is not

- It is the implementation architecture and phased rollout for the Living Home visual system: layers, owners, registers, the composition system, and the artwork pipeline. **It ships none of it** — every phase in § 13 is a separate governed act.
- It creates no rule. Every constraint below is a citation to its owner (`LIVINGHOME1` § 2.3's restate-no-rule discipline applies here identically); the only things owned here are the *implementation shapes* — the registers, the manifest, the resolver contract, the pipeline — none of which is law and all of which are corrected if any owner above them moves.

---

## 2. Governing inputs, and the three verdicts that shape the design

### 2.1 The laws this system implements (owners cited, not restated)

| Law | Owner | Consequence for the asset system |
|---|---|---|
| One home; one orchard; one season; one morning | GEA5/GEA6 · Blueprint § 6.1, § 7 | The House Register is byte-constant; no seasonal or hourly variant of any house asset can exist |
| Exposure is a governed per-domain constant, expressed as tokens | Blueprint § 6.2 · UIA § 16 · register rows 40–42 | The system adds no exposure mechanics; it composes inside what `ROOM_EXPOSURE` + `--orchard-exposure-*` already govern |
| The orchard never carries text, never animates, is never wallpaper | Blueprint § 6.1 | Compositions never carry text and are structurally still (§ 7.3); everything renders in the band's one committed region |
| Living Details: one per domain · data-borne or dead · honest in absence · below the emphasis budget · still · admitted one at a time | Blueprint § 12.1 | The manifest schema enforces all six laws by construction (§ 7) |
| Rooms express character through ground plane and light only; the middle ground is the only varying layer | Blueprint § 8.1–8.2 | **There is no furniture layer** (§ 2.3, verdict 2) |
| Time aims words and doors, never light; season has one owner; no scheduler | HT13/HT14/HT17 · `shared/seasonal/season-rule.ts` (Domain 11) | Seasonal selection resolves on read from Domain 11's answer; no asset carries its own calendar (§ 8) |
| A tradition never changes the house; no tradition ever carries an asset | LH3 · `LIVINGHOME1` § 10.4 | The manifest schema has no occasion key, and the verifier fails if one appears (§ 8.3) |
| No drawn ceramic, no skeuomorphic pot; materials are feelings, never literal pictures | Kept Room Translation § 4 (Handmade ceramics, facet 9) · Blueprint § 16 | Generic object illustration is refused; see verdict 3 |
| Graded surfaces declare a ceiling; imagery never carries unnamed meaning | UIA § 15 | Composition strength is a declared token ceiling; every reflected fact is also room text (§ 11) |
| One owner per visual concern; retire on introduction; admission with register entry | UIA § 17 · Blueprint § 18 | One component mouth for compositions; every admission carries its register row; foundations land with their first consumer |

### 2.2 The current state this design builds on (verified in code, 2026-07-20)

- **The shell is one house.** `AppShell` (`client/src/components/layout/app-shell.tsx`) renders every room's threshold from `ROOM_EXPOSURE` (realm-keyed, E2: cookbook/pantry/nutrition/diary/orchard · E1: planner/shopping/analyser/household/home-shell · E0: admin). `RoomThreshold` mounts `OrchardRoomWindow` at E2 only; E1 renders a light wash; E0 nothing. Home draws its own E3 `OrchardWindow` with CSS joinery (mullions, sill — `--sill-h`).
- **The orchard has one component owner and two assets.** `components/layout/orchard-backdrop.tsx` (Adoption Register row 40) is the only mounter; the assets are still split — arrival `/orchard-bg.webp` (50.5 KB, graded) vs Home/rooms `/orchard.webp` (384 KB) — the known open item `LIVINGHOME1` § 10.2 inherits from EXP1 § 8.2, with five `orchard-bg.webp` bypasses recorded open under register row 40.
- **Exposure values are tokens** at their one owner (`index.css`): light `e0 0 · e1 0 · e2 0.82 · e3 0.90`; dark `0 / 0 / 0.12 / 0.18`. *(Doc drift found and carried to Phase 2: the component comment and register row 41 still cite the pre-EXP1 `0.55` for E2; the CSS owner is 0.82.)*
- **The Living Details library is nearly fully spent.** Blueprint § 12.2 assigns each room's one detail, and all are live concepts (the greeting at Home; the sun on today; the well-thumbed page; the crossing-off; freshness honestly told; the garden filling in; yesterday's trace; where you left off; the family first-class; the Companion's beat). **The Orchard/Community room is the only room with no detail.**
- **Stillness and reduced-motion are already global** (`MotionConfig reducedMotion="user"`; the global reduced-motion CSS gate; `prefersReducedMotion()` in `lib/companion-delight.ts`).
- **No image pipeline exists**: Vite has no image plugin; grading is baked into assets at authoring time (the NORTH2 precedent); no preload or `fetchpriority` is set on any orchard asset today.

### 2.3 Three verdicts, reached before design (Bootstrap: conflicts stop here)

**Verdict 1 — "Authentic household objects" means objects THA truthfully knows.** The only authentic objects in this product are the ones the household's own data attests: their recipes, their planned meals, their pantry's contents, their people, their declared occasions. A generic mug, a generic vase of flowers, a generic textile is — by the canon's own definition — a painted prop: *"fabricated feeling, forbidden by construction"* (Blueprint § 12.1.2, cited). The mission's object list is therefore delivered as follows: **seasonal produce and recipes** bind to live canonical data and are designed in full below; **books** are the household's cookbook, which is real data; **mugs, flowers, and textiles** have no canonical data owner today, so they may not enter the Life Register — and they may not enter the House Register either, because a room may express its character only through ground plane and light (Blueprint § 8.2, cited), and the Kept Room Translation already translates ceramics, linen, and oak into *feeling carried by material tokens, never literal pictures* (§ 4, cited). Their warmth is already in the house — as `--ground-plane`, the linen tier, the plaster surface — where the canon put it.

**Verdict 2 — There is no furniture layer.** A constant painted still-life (the "set dressing" route to lived-in-ness) fails twice: it is a prop under § 12.1.2, and it differentiates a room by means the Blueprint closed (§ 4/§ 8.2 — purpose, light, material, one sign of life). The house's only literal "objects" remain architectural and already admitted: Home's window, mullions, and sill, drawn by CSS in the house's own hand. Lived-in-ness comes from the Life Register or it does not come.

**Verdict 3 — Illustration-as-medium is an owner decision, named and not assumed.** There is one genuinely open question the canon does not settle: when a Living Detail renders a *true* fact (the plums genuinely in this household's pantry, in season), may that truth be rendered as **commissioned still-life illustration**, or only in the product's existing media (content photography, type, material tokens)? § 12.1.2's prop ban names "drawn fruit" as its example — but as an example of *fabricated* feeling; the library's per-detail ceilings (e.g. Nutrition's "no leaf imagery") show imagery is decided per admission, not banned globally. This document **designs the system to be lawful under either answer**: the composition system, registers, bindings, and pipeline are identical; only the *rendering medium* of Life assets differs. The default (lawful today, no approval needed) is **existing media**. The illustrated track requires the owner's explicit approval recorded at the first admission that uses it — and that approval is the User Acceptance decision this document surfaces (§ 15, User Acceptance Evidence).

---

## 3. The layer model — five layers, five owners

Every pixel of the Living Home belongs to exactly one layer. Layers 0–3 are the house; only Layer 4 lives.

| # | Layer | Contents | Register | Owner (today → future) | Varies |
|---|---|---|---|---|---|
| 0 | **Canvas & light** | Warm canvas, `--light-*`, `--orchard-exposure-*`, ground/shadow/penumbra tokens | House | `index.css` (register rows 41–42) | Never (per-mode value sets only, UIA § 16) |
| 1 | **The orchard** | The one canonical environment asset | House | `orchard-backdrop.tsx` (row 40); asset converged in Phase 1 | Never |
| 2 | **Architectural framing** | Home's window joinery (mullions, sill), the E2 band + `MASK_E2`, the E1 light wash, the ground-plane scrim under the room's identity | House | `AppShell`/`RoomThreshold` + `orchard-backdrop.tsx` + `index.css` | Never |
| 3 | **Room ground** | The room's ground plane, posture (`ROOM_GROUND`), realm tint | House (per-room constant) | `AppShell` + `index.css` | Per room, by governed constant — never by time or data |
| 4 | **Living Details** | The room's one data-borne detail — including, where admitted, a threshold composition | **Life** | The composition owner component (§ 7.1) + each detail's existing owner | **Only with the household's data** |

Reuse is structural: layers 0–3 are shared by every room by construction (they are the shell's), and Layer 4's object assets are shared across rooms through the one object library (§ 6). No room owns an asset; rooms reference registers.

---

## 4. Shared architectural assets — the House Register

### 4.1 Contents at declaration

1. **The one orchard asset** — after Phase 1 convergence: a single canonical graded environment image, in responsive sizes, replacing both `/orchard.webp` and `/orchard-bg.webp`. One subject, one grade, one file family, mounted only by `orchard-backdrop.tsx`.
2. **Home's window joinery** — already CSS (`.home-window`, `.home-mullion`, `--sill-h`): the precedent this document adopts as law-of-craft: **architecture is drawn by the house's own hand (CSS/tokens) wherever possible, and is a raster asset only when it must be** (the orchard itself).
3. **The E2 band composition** — clamp heights, `MASK_E2`, object-position — and the E1 light wash. Already owned by the shell; recorded here as House so no phase mistakes them for something that may vary.
4. **The brand marks** — the stencil apple family (UIA § 10, already governed; listed for completeness, not re-owned).

### 4.2 The two-orchard convergence (Phase 1 — the system's prerequisite)

Inherited as the highest-value asset task (`LIVINGHOME1` § 12.1, EXP1 § 8.2). Specification:

- **One master asset** derived from the approved orchard subject, graded once at authoring time (bake-time grading, the NORTH2 precedent — no runtime filters), exported as a responsive family: 960 / 1440 / 1920 px wide, WebP (AVIF sibling optional), **≤ 150 KB at 1920** (the current 384 KB `/orchard.webp` fails any performance budget; the current 50.5 KB `/orchard-bg.webp` shows the target is realistic).
- **Every mount point resolves to the one family**: `OrchardBackdrop` (arrival E3), `OrchardWindow` (Home E3), `OrchardRoomWindow` (rooms E2) — differing only by the exposure token and crop each already owns. The five recorded `orchard-bg.webp` bypasses (register row 40) are migrated or explicitly exempted in the same change; the superseded file is **deleted** (retire-on-introduction, UIA § 17).
- Arrival's paler feel, if it must survive, is expressed as *exposure/scrim over the one asset*, never as a second asset — "what differs is how much orchard, never which orchard" (Blueprint § 6.1, cited).

### 4.3 What the House Register refuses, permanently

No seasonal variant, no hourly variant, no occasion variant, no per-room environment (refused at EXP1 § 1.1 and inherited: a future per-room-view proposal is one governed Blueprint admission covering all rooms at once, never nine taste decisions), no third orchard sibling before convergence (`LIVINGHOME1` § 10.2), no animated or parallax anything (Blueprint § 6.1; UIA § 4 "never becomes a scene").

### 4.4 The checksum register — constancy made mechanical

A small machine-readable register, proposed at `docs/implementation/assets/house-asset-register.json`, listing every House Register raster/vector asset with its content hash, owner component, and the governing citation under which it last changed. A verify script (Phase 2, § 7.4) fails when a house asset's bytes differ from its registered hash. The effect: **the house cannot drift.** An intentional architecture change updates the register row *in the same commit*, citing its amendment — the deliberate act the law requires, now enforced by CI rather than memory. Life assets are deliberately *not* checksummed: their whole nature is that what appears is decided by data at read time, not by their bytes.

---

## 5. Room-specific foreground compositions

A **threshold composition** is a Living Detail rendered in the room's environment band — on "the sill": the band's ground-plane scrim shelf, the one committed region the content already does not cover. It is not a new region, a new layer, or a new exposure; it is Layer 4 composing inside Layer 2.

### 5.1 Where compositions may exist at all

- **E2 rooms and Home (E3) only.** They alone have a view for life to sit against. E1 rooms' band is light, not place — an object floating on a light wash is clutter, not life — and E0 is shuttered. E1/E0 rooms keep their existing (non-band) Living Details and gain nothing. This also preserves the shipped invariant that E1/E0 rooms cost **zero** environment bytes (`OrchardRoomWindow` returns `null`).
- **One per room, and it is the room's *one* detail.** Blueprint § 12.1.1 is absolute: a threshold composition is not additional to the room's library detail — admitting one **retires the room's existing detail in the same decision**, and that cost is weighed per room below, honestly.

### 5.2 The room map — current detail, candidate composition, and the honest verdict

| Room | Exposure | Current detail (Blueprint § 12.2) | Threshold-composition candidate | Verdict |
|---|---|---|---|---|
| **Home** | E3 (own window) | The greeting in THA's hand | — | **Refused.** Home's one ornament is the greeting; trading the signature welcome for objects on a sill would be the worst swap in the house. Home's sill stays architecture. |
| **Cookbook** | E2 | The well-thumbed page | **The open book** — the household's most-cooked (or most recently cooked) recipe, as itself: its real title/image from the household's own cookbook data | **The pilot (Phase 3).** The swap is coherent: the same message — *this book is used* — carried by the household's actual page instead of generic surface warmth. Admission decides finally. |
| **Pantry** | E2 | Freshness, honestly told | **The season's shelf** — in-season items *actually in this household's pantry* (§ 8's double key) | **Candidate, cost flagged.** "Freshness, honestly told" is helpful, safety-adjacent warmth; the swap may rightly be refused at admission. Not pre-decided here. |
| **Nutrition** | E2 | The garden filling in | — | **Refused now.** The existing detail's own ceiling ("no leaf imagery, no streaks") signals how deliberately quiet this room's life was set. |
| **Diary** | E2 | Yesterday's trace | — | **Refused now.** The trace is the room's memory; nothing visual should compete with a person's own last words. |
| **Orchard / Community** | E2 | **— none (the one free slot)** | A community-grained detail, bound to the household's real participation | **Open.** The only room where a composition needs no retirement. Its definition is deferred to its own admission — not sketched here without its data owner settled. |
| Planner · Shopping · Analyser · Household | E1 | Their § 12.2 details | — | **No composition, by § 5.1.** Existing details stand untouched. |
| Admin | E0 | — | — | Nothing, ever (shuttered — GEA6). |
| Companion | presence | Arrives a beat after you | — | Not a room; untouched. |

The honest summary this table exists to state: **the Living Home is already mostly alive.** The library spent each room's one detail well; this system's near-term surface is one pilot (Cookbook), one flagged candidate (Pantry), and one free slot (Orchard room) — plus the celebration and seasonal life that flows through existing data surfaces without any new asset at all (§ 8.2). The system's value is the *governed path and the reuse machinery*, not a wave of new charm — a wave the law would refuse anyway (§ 12.1.6: never a batch).

### 5.3 Composition anatomy (binding on every admitted composition)

- Renders inside the band's committed region, anchored to the scrim line, **opposite the room's title** with a reserved gutter (mirroring the Companion-door gutter pattern) so identity type and life never contest space; never increases band height; never overlaps the workspace pill.
- Never carries text (Blueprint § 6.1); never carries status, count, or badge (GEA13); sits below the emphasis budget (§ 12.1.4); is removable with only "a slight cooling" — which admission verifies by reviewing the room with the composition off.
- Structurally still: the composition spec has no motion fields (§ 7.3).
- Its strength is capped by a declared token ceiling (§ 11), never tuned per surface.

---

## 6. Reusable asset layers — the object library

Life assets are shared, not per-room:

- **One object, one file, one owner.** Each Life asset (e.g. the rendering for "plums") lives once, at `client/src/assets/living-home/`, imported **only** by the composition owner component (§ 7.1) via the manifest — bundler-hashed, so caching is automatic and stale references impossible. No page, card, or surface may import a Life asset directly; the verifier (§ 7.4) fails the build if one does.
- **Objects are fact-shaped, not room-shaped.** "Plums" is one asset whether the fact surfaces in the Pantry's shelf or (some day) another admitted detail. Rooms reference object ids through their manifest entry; adding a room never duplicates an asset.
- **Media per Verdict 3:** in the default track, an "object" resolves to existing content media (the recipe's own image, the product's own photography) or to type and material tokens — zero new artwork. In the illustrated track (owner-approved), it resolves to a commissioned still asset from the pipeline (§ 12). The manifest shape is identical in both tracks; only the `media` field differs.
- **Variants are one family.** A seasonal object's variants (plums early/late) are files in one family under one id — never separate ids that could drift into a second owner.

---

## 7. The Living Details composition system

### 7.1 One mouth

One owner component — proposed `client/src/components/layout/living-details.tsx` — is the only code that renders threshold compositions, mounted by `RoomThreshold` beside the scrim. It lands **with its first consumer** (the Cookbook pilot, Phase 3), never before: an authored-but-unadopted foundation is the exact failure UIA § 17 prohibits. It follows `orchard-backdrop.tsx`'s established manner: `aria-hidden`, empty alt, `pointer-events-none`, in-flow, still.

### 7.2 The manifest — the Life Register itself

A single declarative module (proposed `client/src/components/layout/living-details-manifest.ts`), shaped so the six § 12.1 laws are unbreakable by construction:

```ts
// Indicative shape — finalised at Phase 2 with its verifier.
type Realm = "cookbook" | "pantry" | "orchard" | /* … the shell's realm ids */ string;

interface LivingDetailSpec {
  id: string;                    // one detail id, admitted by name (§ 12.1.6)
  admittedBy: string;            // the admission's document id — no anonymous charm
  retires: string | null;        // the predecessor detail retired in the same decision (§ 12.1.1)
  binding: {
    source: string;              // the canonical owner read (query key / module), named
    predicate: string;           // human-readable truth condition, e.g.
                                 // "household has ≥1 pantry item in season (Domain 11 ∩ pantry facts)"
  };
  objects: ObjectRef[];          // ids into the object library; each renders only if its fact holds
  ceiling: {                     // declared, never tuned (UIA § 15)
    maxObjects: number;          // and a smaller number at narrow widths (§ 9)
    strengthToken: string;       // the token capping visual strength
  };
  // Deliberately absent, forever: motion fields (§ 12.1.5), occasion/tradition keys (LH3, § 10.4),
  // text/copy fields (Blueprint § 6.1), colour overrides (UIA § 7), per-surface exposure (UIA § 16).
}

// The one-per-domain law as a type: a realm maps to at most ONE spec.
type LivingDetailsManifest = Partial<Record<Realm, LivingDetailSpec>>;
```

### 7.3 The resolver — pure, deterministic, honest

`resolveComposition(spec, facts) → RenderPlan | null`, with the contract:

- **Pure and clock-free.** Inputs are canonical facts handed in: the season answer from Domain 11 (whose input Household Time supplies — HT17), the room's already-fetched data. The resolver reads no clock, no `Math.random`, no locale — the same facts always yield the same sill, so the house feels *stable*, and season can never be derived twice (HT17).
- **Honest in absence.** Any unmet predicate → `null` → the band renders exactly as it does today. No placeholder, no empty-state nudge, no "add items to see your shelf". An empty sill is a complete sill.
- **Still by construction.** The `RenderPlan` contains geometry and asset refs only; there is no field a motion value could occupy. Reduced-motion needs no branch because there is nothing to reduce.
- **Deterministic selection.** Where facts exceed `maxObjects`, selection is by stable, stated ordering (e.g. most-recently-true first), never sampled.

### 7.4 Enforcement — `verify:living-home-assets` (Phase 2)

A verify script in the platform's existing gate manner (`verify:publication` precedent), failing loudly when:

1. a House Register asset's bytes differ from its registered hash without a same-commit register update (§ 4.4);
2. any manifest realm holds more than one spec, or a spec lacks `binding`, `admittedBy`, or `retires` disclosure;
3. any occasion/tradition-shaped key appears anywhere in the manifest (LH3 · `LIVINGHOME1` § 10.4 made mechanical);
4. any file outside the owner component imports from `assets/living-home/`;
5. an asset exists in `assets/living-home/` with no manifest reference (authored-but-unadopted, UIA § 17), or a manifest object id resolves to no asset.

---

## 8. Seasonal living details

### 8.1 The double key — the empty-house test, enforced

`LIVINGHOME1` § 5.2's rule of thumb is this system's hardest gate: *if a "seasonal" change would still be visible to a household whose planner, pantry, and diary were empty, it is dressing the house and is refused.* Therefore every seasonal Life asset is **double-keyed**:

> **season ∩ household fact.** The season rule (Domain 11 — the only lawful season answer, HT17) may *select and order* which of the household's true facts show; it may never *create* an appearance on its own. The plums appear because **your pantry holds plums** — the season decides only that, of everything you hold, the plums are what this month makes worth showing.

An empty house therefore shows an empty sill, in every season — which is the honest answer, and the proof the system is showing the life and not dressing the house.

### 8.2 The household's rhythm and celebrations — transitive only

- **Rhythm** reaches the visual layer through usage facts already owned: cook counts (the open book), pantry contents (the season's shelf), plan state. No new observation, no new store — bindings read what exists.
- **Celebrations reach assets only through food the household chose.** A tradition's whole expression is words, doors, and food (LH3, cited). If a household planned a birthday cake, the cake's recipe may appear exactly as any planned recipe may — because it is planned, never because a date approaches. There is **no occasion→asset mapping**, no themed variant, no festival still-life, at any participation rung, ever (`LIVINGHOME1` § 7.3, § 10.4, cited; verifier check 3). Future celebrations reach the home the way `LIVINGHOME1` built them to: the Notice Engine's words and the resolver's doors — mouths this asset system does not touch.

### 8.3 Permanent refusals (recorded so no phase re-asks)

Season-keyed house dressing (autumn leaves, snow, blossom — `EXP5` § 5.3/OHDB § 11 standing refusal); hour-keyed anything (NORTH2 § 3.5; HT13); occasion-keyed anything (LH3); weather; a "seasonal theme" toggle; any asset whose predicate is satisfiable by an empty household.

---

## 9. Responsive behaviour

- **The band is the contract.** Compositions live inside the existing clamps (E2 `clamp(180px, 26vh, 300px)`; Home's `--glass-h` family) and never alter them — no layout shift is possible because the region's size never depends on whether life renders (§ 10).
- **Deterministic simplification, not scaling clutter.** Each spec's ceiling declares its narrow-width object count (typically 1) and its cut order — the same priority order as § 7.3's selection. Below the house's established small-window threshold (the ≤ 520 px precedent Home's window already uses), a composition renders its single strongest object or nothing.
- **Gutters are reserved, not discovered:** title/scrim gutter on the identity side, Companion-door gutter top-right, pill boundary below — the composition's box is what remains, at every width, on both shipped viewports of record (1512×945, 390×844).
- **One framework, both sizes** (EXP1 § 6's law): no per-breakpoint composition variants, no mobile-only or desktop-only details.

## 10. Performance strategy

- **Budgets, declared as ceilings:** the canonical orchard ≤ 150 KB @ 1920 w with 960/1440 siblings (Phase 1); a Life object ≤ 8 KB (SVG, gzipped) or ≤ 24 KB (raster with alpha); a room's total Life payload ≤ 48 KB; the E1/E0 **zero-byte invariant preserved** — rooms without a view load no environment or life bytes at all.
- **Loading order serves arrival:** the band image is the LCP candidate on E2/E3 rooms — Phase 1 adds `<link rel="preload">`/`fetchpriority="high"` for the one orchard family (none exists today) and responsive `srcset` so mobile stops paying the desktop image. Life assets load after the view: `decoding="async"`, low priority; their absence until loaded is indistinguishable from honest absence, so there is no placeholder flash.
- **Caching for free:** Life assets are bundler-imported (content-hashed, immutable); the orchard family keeps stable public names with long-lived caching proposed at the server. No runtime image processing anywhere — grades are baked at authoring time (NORTH2 precedent).
- **Zero-cost stillness:** no canvas, no WebGL, no filters, no runtime compositing beyond static positioned images; compositions add no listeners (pointer-events-none) and no state beyond the resolver's pure output.

## 11. Accessibility

- **Decorative, declared:** every House and Life visual renders `aria-hidden` with empty `alt` and `pointer-events-none` (the `orchard-backdrop.tsx` manner, adopted as the system's standard). Nothing here is focusable, announced, or interactive.
- **Reflects, never informs:** UIA § 15's *imagery never carries unnamed meaning*, applied as a hard invariant — a composition may only render facts the room already states as text (the pantry lists the plums; the cookbook names the recipe). Removing every composition loses zero information, capability, or state. Admission review verifies each binding against this.
- **Type and contrast untouched:** compositions never carry text; the room's identity stays on the ground-plane scrim (Blueprint § 6.1's remedy, shipped in EXP1); the band remains a no-text graded surface governed by its **declared ceiling** — the exposure tokens plus each spec's `strengthToken` (UIA § 15's graded-surface law; `LIVINGHOME1` § 10.5).
- **Reduced motion and forced colors:** structural stillness means reduced-motion parity is identity (nothing to reduce, verified rather than assumed); under forced-colors/high-contrast modes compositions may vanish entirely — honest absence makes degradation graceful by design.
- **Zoom and reflow:** at 200 % text scaling the band and its life remain non-essential ornament; content reflows beneath exactly as today.
- **Both modes resolved:** any admitted Life asset must resolve in dark mode's value set (dark exposure tokens exist: e2 0.12 / e3 0.18) before adoption — a partially-resolved mode is not offered (UIA § 16; Blueprint § 18 open item 4 is inherited, not worsened).

## 12. Future artwork pipeline

How any new visual asset enters the Living Home, whichever track Verdict 3 resolves to:

1. **Brief** — every commission states: subject and its *data binding* (no binding, no brief — props cannot be commissioned); Calm Orchard palette (derived from the canonical asset — `scripts/extract-orchard-palette.ts` exists for exactly this); **one light, upper-left morning** — shadows must agree with the house's sun (UIA § 4); still; no text, no faces, no brand marks; warm, in-season, alive (Experience Language § 3A.3's orchard meaning).
2. **Formats & naming** — vector-first for objects (`ld-<object>[-<variant>].svg`), raster (WebP, alpha) only where vector cannot carry the medium; the orchard family `orchard-<width>.webp`. Sources (layered/master files) live under `attached_assets/design/living-home/`; published assets at their register's one location (§ 4.1 House / § 6 Life).
3. **Admission checklist per asset** (all must pass; any failure stops):
   - the six § 12.1 laws, checked one by one;
   - register classification — House (checksum row + amendment citation) or Life (manifest entry with binding);
   - UIA § 17 admission: concern named, conflict check passed, predecessor retired in the same change, Adoption Register row created;
   - a Blueprint § 12.2 library amendment for any new/retired detail (Blueprint § 18: admitted the way any governing rule is);
   - budgets (§ 10) and both-mode resolution (§ 11) verified;
   - evidence: screenshots at 1512×945 and 390×844, light and dark, with-and-without (the "slight cooling" review, § 5.3).
4. **Versioning** — an asset is corrected in place (one file, one owner), never siblinged; superseded assets are deleted in the same change. The verifier (§ 7.4) makes both mechanical.

## 13. Implementation phases

All phases are future work; **this document ships none of them.** Each is a separate governed act with its own rollback identifier, gates, and report. Phases 1–2 need no owner decision; Phase 3+ artwork medium waits on Verdict 3's answer.

| Phase | Scope | Gate it must clear first |
|---|---|---|
| **0 — This design** | Implementation architecture on record. **Complete on merge.** | — |
| **1 — One orchard** | Two-asset convergence per § 4.2: one graded responsive family, all mounts migrated, bypasses resolved, sibling deleted, preload/`fetchpriority` added, register row 40 updated. Also corrects the recorded 0.55/0.82 doc drift (§ 2.2). | UI Governance Checklist; adoption:check; before/after evidence at both viewports, light and dark |
| **2 — The registers** | House checksum register (§ 4.4) + Life manifest module (empty) + `verify:living-home-assets` (§ 7.4) wired into the platform's verification lane. Governance/tooling only — **no visual change, no owner component yet** (it lands with its first consumer). | Phase 1; the verifier green on the real tree |
| **3 — The pilot: Cookbook's open book** | First admitted composition (§ 5.2): owner component + manifest entry + binding to cookbook facts; **retires "the well-thumbed page" in the same decision**; Blueprint § 12.2 amendment; Adoption Register rows. Medium per Verdict 3's resolution. | Phase 2; full experience gate stack (Constitution Check → Experience Test → UX/UI checklists → Review Questions → Blueprint Checks → Design Character Check); owner approval of the swap |
| **4 — The season's shelf (Pantry)** | Double-keyed seasonal composition (§ 8.1) — *if* its swap survives admission (§ 5.2's flagged cost). | Phase 3 evidence reviewed; same gate stack; explicit freshness-detail retirement decision |
| **5 — The free slot (Orchard room)** | The one no-retirement room: define, bind, and admit its community-grained detail with its data owner settled first. | Its own admission; Register/community-domain governance |
| **6 — Constancy audit** | No build: run the verifier's full sweep, confirm no occasion key, no season-only predicate, no house drift; record the standing refusals (§ 8.3) as tested rather than remembered. | Phases above; report |

Deliberately **not** phased, because refused rather than deferred: everything in § 4.3 and § 8.3; a furniture layer (Verdict 2); compositions for E1/E0 rooms; any Home sill composition (§ 5.2); any second composition mouth.

---

## 14. Where this design deliberately stopped

1. **It did not design illustrated mugs, flowers, or textiles.** Verdict 1: no data owner, no entry — the canon's material vocabulary already carries their warmth. If the owner wants literal object artwork beyond data-borne facts, that is an amendment to Blueprint § 12.1.2 (and, for ceramics, the Kept Room Translation § 4), whose cost this document records and does not propose — the same STOP `LIVINGHOME1` § 13 recorded for the house's own seasons.
2. **It did not pre-approve any swap.** Every composition that displaces a library detail is decided at its own admission, with the "slight cooling" review done in both directions.
3. **It did not touch the Traditions & Celebrations roadmap.** `LIVINGHOME1` § 11's phases proceed independently; this system's only obligation to them is the occasion-key refusal it enforces (§ 7.4.3).
4. **It did not resolve dark mode** (Blueprint § 18 open item 4) — it only refuses to widen it (§ 11).

---

## 15. Compliance

### Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity
  Explain: One home, one orchard (converging two assets to one), one composition
  mouth, one manifest, one object library — each concern has exactly one owner.
☑ One owner per fact
  Explain: Every law cited to its owner (§ 2.1); this document owns only
  implementation shapes. Bindings READ canonical owners; nothing is re-derived
  (season only via Domain 11 — HT17).
☑ No duplicate entities
  Explain: Nothing created. Phase 1 REDUCES entities (two orchard assets → one);
  the manifest structurally prevents duplicate details per room.
☑ No duplicate ownership
  Explain: Exposure stays rows 40–42's; the shell stays the shell's; details keep
  their data owners. The registers classify, they never own facts.
☑ No duplicate state
  Explain: The resolver is pure; nothing derived is stored; compositions hold no
  state beyond render output.
☑ Extends existing architecture
  Explain: Builds inside RoomThreshold/OrchardRoomWindow/token owners shipped by
  EXP1/ODL2; adopts orchard-backdrop.tsx's manner as the standard.
☑ Progressive enrichment where appropriate
  Explain: Six additive phases, each separately gated; foundations land with
  their first consumer, never before.
☑ Knowledge domain compliance
  Explain: No knowledge domain touched; no registry entry affected until a
  user-facing phase ships (each phase carries its own impact section).
☑ Honest gaps over fabricated information
  Explain: The system's core: absent data renders absence (§ 7.3); props are
  refused by construction (Verdict 1); an empty house shows an empty sill (§ 8.1).
☑ No permanent synchronisation bridge
  Explain: None. Bindings resolve on read; no scheduler (HT14); checksums are
  CI-time verification, not sync.
☑ Evolution over replacement
  Explain: Retire-on-introduction is wired into the manifest itself (`retires`
  is a required disclosure) and the pipeline checklist.

If any item cannot be checked, implementation must stop and explain why.
```

### AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
No AI surface, capability, prompt, context view, or Companion behaviour is
touched or designed here. Compositions are rooms observing (GEA21 — a window,
not a voice); interpretation remains the Companion's through its existing
spine; celebrations reach the Companion only via LIVINGHOME1's phases, which
this document does not alter. No capability registered, none consumed.
```

### Experience & UI Governance Compliance

- **Experience Constitution Check** — § 0, answered before design. ✅
- This is a design document: the full per-implementation stack (UX Checklist, UI Checklist, Review Questions, Experience Test, Blueprint Checks, Design Character Check) is **not claimed here** — it binds each phase at its own admission (§ 13's gate column), which is the only honest place a checklist about shipped pixels can pass.
- Conflicts found during design were resolved in the governing architecture's favour and recorded as the three verdicts (§ 2.3) and the stops (§ 14).

### Product Registry Impact

None now — no user-facing surface ships. Phases 1 and 3+ each carry their own Product Registry Impact section (visual-appearance entries touching the environment band and Cookbook).

### Adoption Register Impact

None now. Future rows named so they cannot arrive silently: the converged orchard asset (row 40 update, Phase 1); `living-details` composition owner + manifest (new rows, Phase 3); per-detail admissions thereafter. The row-41 stale `0.55` correction is assigned to Phase 1.

### Definition of Done

- **What success looks like:** this document exists at `docs/implementation/EXP3_LIVING_HOME_ASSET_SYSTEM.md`, defines the two registers, the five layers, the composition system with its enforcement, the seasonal double key, responsive/performance/accessibility strategy, the artwork pipeline, and the six phases — and is committed and pushed with the rollback identifier reported.
- **What must not break:** nothing runtime — this change touches documentation and session files only; no code, schema, token, asset, string, route, capability, or test changes. The one-season and one-morning laws, the Exposure Scale, and every cited owner are byte-untouched.
- **Manual test steps:** `git diff --stat <rollback>..HEAD` shows only `docs/` and `.engineering/session/` paths; every file path cited in § 2.2 exists as stated.

### Data Impact

- **Reads existing data:** NO (document only). The designed system reads only existing canonical owners at its future phases.
- **Writes new data:** NO. (The future registers are code/CI artefacts, not household data.)
- **Changes meaning of existing data:** NO.
- **Requires backfill:** NO — and bindings forbid it by nature (facts resolve on read).

### Trust Check

- **Could this mislead the user?** No runtime change. The designed system's whole mechanism is anti-misleading: nothing may render that is not true of this household, and absence is always honest.
- **Could this fabricate certainty?** No. Props are refused by construction; the empty-house test (§ 8.1) is a hard gate; selection is deterministic, never sampled charm.
- **Is anything guessed but shown as real?** No — and the verifier (§ 7.4) makes several classes of future guessing build-failures.
- **What happens if the system is wrong?** For this change: a documentation defect, corrected by amendment. For the future system: a wrongly-shown object traces to a false fact at its canonical owner — the defect surfaces where it can be fixed once, never in the asset layer.
- **No architectural duplication introduced:** YES. **No new source of truth created:** YES (registers classify; owners own). **No runtime behaviour altered:** YES.

### Rollback Plan

- **Rollback identifier:** `rollback/EXP3-living-home-asset-system-20260720` → `81934cdf` (branch).
- **Files modified:** `docs/implementation/EXP3_LIVING_HOME_ASSET_SYSTEM.md` (new) · `.engineering/session/CURRENT.md` (session row) · `.engineering/session/runs/EXP3_Living_Home_Asset_System.md` (session record).
- **Rollback commands:**
  ```
  git checkout rollback/EXP3-living-home-asset-system-20260720 -- .engineering/session/CURRENT.md
  git rm docs/implementation/EXP3_LIVING_HOME_ASSET_SYSTEM.md
  git rm .engineering/session/runs/EXP3_Living_Home_Asset_System.md
  git commit -m "Rollback EXP3 Living Home Asset System"
  ```
- **Verification after rollback:** `git diff rollback/EXP3-living-home-asset-system-20260720 -- docs/ .engineering/` is empty; no runtime surface existed to verify.

### Scope Lock

- **Implemented scope:** this design document; its session record. Nothing else.
- **Explicitly excluded:** all code, assets, tokens, schema, scripts, register files, component changes, Blueprint/UIA/Translation amendments, Adoption Register rows, and every phase of § 13 — each a separate future act.
- **Suggestions recorded, not taken:** the Pantry and Orchard-room candidates (§ 5.2); the illustrated track (Verdict 3), which awaits the owner.

### Manual Verification

Performed for this change (documentation-only):

1. `git status` confirmed clean apart from the session heartbeat before work; rollback branch created and verified to resolve to `81934cdf` **before** any file was written.
2. Every § 2.2 code fact was taken from a fresh read of the live tree (component exports, token values, asset sizes, register rows) — including the 0.82/0.55 drift, reported rather than repeated.
3. `git diff --stat` at commit time confirmed the change touches only the three files named in the Rollback Plan.
4. No build, typecheck, or test surface is affected; none is claimed to have been re-run beyond confirming the diff contains no code path.

### User Acceptance Evidence

- **State: Waiting for User.** This is a design deliverable; acceptance is the owner's review of this document.
- **The one decision this document surfaces rather than assumes (Verdict 3):** when a Living Detail renders a *true* household fact, may it be rendered as **commissioned still-life illustration**, or only in the product's **existing media** (content photography, type, material tokens)? The system is designed to be lawful under either answer; the default requires no approval; the illustrated track requires the owner's explicit recorded approval at the first admission that uses it — because Blueprint § 12.1.2's "drawn fruit" example and the Kept Room Translation's ceramics clause sit close enough to it that assuming the answer would be legislating from an implementation document.
- Also for review: the three verdicts (§ 2.3), the per-room map and its honest costs (§ 5.2), and the phase order (Phase 1 convergence first — the house's one asset debt — before any new life).

---

*The house holds still because its every asset is registered, hashed, and owned; the life moves because nothing may appear on a sill that is not, today, true of this family — and when their table is empty, the home is not less finished. It is simply waiting, the way a real one does.*
