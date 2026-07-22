# ED1 — Environmental Dressing Foundation

| Field | Value |
|---|---|
| **Implementation ID** | `ED1` (Environmental Dressing Foundation) |
| **Date** | 2026-07-22 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback ID** | `rollback/ED1-environmental-dressing-foundation-20260722` → `94edc39a` (annotated tag, created **before any change**; covers committed state only — the working tree held one uncommitted `.engineering/session/CURRENT.md` heartbeat, not covered by the tag) |
| **Kind** | **Phase-1 governance + DECLARED-NOT-BUILT platform foundation.** Establishes ownership, registration, placement rules and rendering architecture only. **No code, no asset, no schema, no route, no token, no visible dressing.** |
| **Governing parent** | `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (`LIVINGHOME2`) — *the layer at which the home quietly lives*; the ED1–ED12 rules, the § 4.3 classification test, the § 7.2 celebration gate, the § 10.2 amendment list, and the § 10.3 register requirements are its, and are **cited, never restated**, here. |
| **Governing grandparents** | `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (`LIVINGHOME1` — the house holds still; the life moves) · `THA_EXPERIENCE_BLUEPRINT.md` (the place, the Living Details) · `EXP3_LIVING_HOME_ASSET_SYSTEM.md` (the two-register asset design ED1 extends) · `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (GEA1–GEA23) · `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (HT13–HT17, the season input) · `ARCHITECTURE_PRINCIPLES.md` (Principle 2 one-owner-per-fact; Principle 6 non-fabrication) |

---

## 0 · What this implementation is, and what it is not

**Objective.** Establish the canonical **Environmental Dressing Platform** — the single governed home for every future Living Home environmental dressing decision — as *architecture*: one owner, one registry, one placement discipline, one rendering pipeline, one lifecycle, one seasonal model, one set of visibility rules, one room-eligibility rule, one feature-registration path, and named extension points. It does this **without introducing one byte of visible dressing anywhere in the product.**

**What it is.** This is `LIVINGHOME2`'s **Phase 1** (the four owner amendments, landed in their owners' files — § 2) **plus a DECLARED-NOT-BUILT foundation specification** of the platform the amendments unlock (§ 4–§ 14). It is the *law and the shape*, written first, so that when the register is built (Phase 2, still gated) there is exactly one design for it to conform to and nothing rival can grow in the meantime — the `TIME3` / `LIVINGHOME1` / `LIVINGHOME2` precedent applied one layer deeper.

**What it is not.** It is **not** the register as code. It builds no TypeScript module, no manifest, no verifier, no component, no asset. `LIVINGHOME2` § 10.4 gates the register (Phase 2) behind (a) these Phase-1 amendments *and* (b) `EXP3`'s own Phase 2 (the base House/Life register + `verify:living-home-assets`) shipping first — **neither of which this implementation ships.** The interfaces below are **contracts, declared**, not files, built. The moment they become code is a separate governed act (Phase 2), with its own rollback, gates, and report.

### 0.1 The governance conflict this implementation surfaced and resolved

The brief, read literally, asked to *"implement the Environmental Dressing Registry, placement interfaces, renderer interfaces and extension points."* Building those **as code today** would jump two hard gates `LIVINGHOME2` names explicitly (§ 10.1 *"ships nothing"*; § 10.4 Phase 2 gate). The repository was probed and confirmed both gates shut: the four § 10.2 amendments had **not** landed (grep of the four owner files returned nothing), and `EXP3`'s base register/verifier **do not exist** in code (only `orchard-backdrop.tsx`, the House layer, is present). Under the Architecture Bootstrap's STOP discipline, the owner was asked, and chose the **compliant path: Phase-1 amendments + a DECLARED-NOT-BUILT foundation, zero code, zero dressing** — which is exactly the brief's own Scope Lock (*"No visible dressing is to appear anywhere in the application during this implementation"*). This document is that path executed. The register-as-code option remains available to the owner later, as Phase 2, once its gates pass.

---

## 1 · The three-register model (cited, not restated)

`LIVINGHOME2` § 0 fixes the model this platform serves. It is quoted once so the platform's boundaries are legible on this page; it is **owned there**.

| Layer | One-line law | Changes? | Speaks about the household? | Owner |
|---|---|---|---|---|
| **House** | *Never changes.* | Never — byte-constant, amended only deliberately | Never | House Register (`EXP3` § 4) |
| **Environmental Dressing** | *The home quietly lives.* | Only with the year, between registered states, identical for everyone | **Never** | **The Dressing Register (this platform)** |
| **Household Life** | *The household's true data.* | Only with the household's own data | Only truthfully, from a canonical owner | Life Register (`EXP3` § 7) |

The Environmental Dressing Platform is the machinery of the **middle row, and only the middle row.** It never touches the House's bytes and never reads the household's data.

---

## 2 · Phase 1 shipped — the four § 10.2 owner amendments (governance only)

`LIVINGHOME2` § 10.2 named four bounded amendments that must land **in their owners' own files** before any dressing may ship. All four are landed by this implementation, each a citation-based annotation that **preserves the original rule verbatim** and cites `ED1` / `LIVINGHOME2`. No rule was rewritten; each amendment *refines a word* or *scopes a gate* and records that the original purpose survives.

| # | Owner file · anchor | What the amendment does | Original purpose |
|---|---|---|---|
| 1 | `THA_EXPERIENCE_BLUEPRINT.md` § 12.1 item 2 (the prop ban) | Names a *prop* as a **claim without data**, and a registered dressing item as the distinct, lawful class of a **claim-free object of the home's hospitality**. | Untouched — no fake life, no fabricated household truth; binds the Life register in full. |
| 2 | `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 11 (seasonal dressing declined) | Annotates the standing refusal: declined **for the house** (one season, absolute); superseded **only for the registered dressing layer** — the year enters as objects through the door, never as weather on the orchard. | Untouched — the house never changes with the calendar. |
| 3 | `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` × 3: § 5.2 rule of thumb; LH3 + § 7.3 ladder; § 10.4 item 4 | (a) Two-register rule of thumb succeeded by the three-register test; (b) LH3 core kept, dressing permission added as a **separate per-tradition switch, OFF by default** (not a fourth rung — reasoning recorded, § 8 below); (c) *"no tradition carries an asset"* refined to *"no tradition changes the House, and reaches dressing only through the household's explicit permission."* | Untouched — a tradition never changes the House; the one-season law stands; nothing arrives by taste, default, or inference. |
| 4 | `EXP3_LIVING_HOME_ASSET_SYSTEM.md` × 4: two-register statement; § 7.4 verifier; § 8.1 empty-house test; § 8.3 refusals | Declares the **third (Dressing) register** between House and Life; scopes the **empty-house test to the Life register** (its design intent); adds the verifier's future **third-register checks**; annotates § 8.3 so house/hour/weather/theme refusals stand for every register while a claim-free registered object is the one lawful exception. | Untouched — *if it changes it must be data; if not data it must never change*, plus its one governed claim-free exception. |

**The § 10.2 discipline, honoured in both directions:** if the owner refuses any amendment at review, this document's dependent parts do not come into practical effect, and the refusal is recorded here (`LIVINGHOME2` § 10.2, cited). The amendments are documentation-only and reversible by the rollback plan (§ *Rollback Plan*).

---

## 3 · The canonical Environmental Dressing owner

**One owner, declared, built nowhere.**

- **Curation authority** (who decides *what dressing exists*): THA's design authority — the owner, through the admission pipeline (`LIVINGHOME2` § 3, ED10). Never runtime-generated, never third-party at runtime, never household-authored, never personalised, never per-household except by the single § 7.2 permission gate.
- **The register** (who owns *the items, as data-in-code*): the future **Dressing Register**, one module with **one component mouth**, checksummed like the House Register, with the **season key as its only axis of variation** (`LIVINGHOME2` § 3, § 10.3). Declared § 5 below; **DECLARED-NOT-BUILT.**
- **The season key** (who owns *when it turns*): `shared/seasonal/season-rule.ts` (Domain 11). The platform **consumes** its answer and derives nothing (**HT17**, cited). No dressing item carries its own calendar or clock.
- **The celebration permission** (who owns *whether an occasion may dress*): the future `household_traditions` domain (`LIVINGHOME1` § 7), read **read-only, as a permission and never as content** (§ 8 below).
- **The rules** (who owns *the law*): `LIVINGHOME2` (ED1–ED12). This foundation cites them; on any question of rule owned elsewhere, the owner prevails and this document is corrected.

**Proposed canonical location (declared, not created):** `client/src/lib/living-home/dressing-register.ts` (the register + resolver, pure), with the single mouth at `client/src/components/layout/dressing-layer.tsx` and items under `client/src/assets/living-home/dressing/`. These paths are a *declaration for Phase 2*, not files that exist. Their final placement is settled at the `EXP3` register update that owns the asset-system shape (`LIVINGHOME2` § 2.2 item 5).

---

## 4 · Platform architecture — the specification (DECLARED-NOT-BUILT)

Everything in § 4–§ 12 is an **interface contract and design rule**, not shipped code. Types are written in TypeScript shape for precision; they are the *contract Phase 2 must satisfy*, and are deliberately expressed so that the forbidden things (§ 11) are **structurally impossible to express**, not merely discouraged.

### 4.1 Design invariants (the whole platform in seven lines)

1. **Claim-free by type.** A dressing item cannot carry a data binding, text, a number, a door, or an interaction — the type has no field for any of them.
2. **One owner, one mouth.** Items live once and are referenced; one component renders them; nothing else imports them.
3. **Season is the only axis.** The only thing that may vary a dressing item's presence is the Domain-11 season key (plus the § 8 celebration permission).
4. **Resolve on read, no scheduler.** Presence is computed at render time from the season answer (HT14 — no scheduler, ever).
5. **Yields to the room.** Where dressing and household data contest a region, data wins; dressing yields, permanently.
6. **Present-for-empty, never covering-absence.** Dressing may be present for a household with no data (it claims nothing) but may never be positioned to make an absent-data surface look alive.
7. **Invisible to intelligence.** Dressing never enters a prompt, Context View, capability, notice, or story; the Companion never narrates it.

---

## 5 · The Environmental Dressing Registry (interface, declared)

The registry is the **single source of truth for what dressing exists.** One immutable, checksummed collection, identical for every household, keyed only by season.

```ts
// DECLARED-NOT-BUILT — the contract Phase 2 must satisfy. No such module exists today.

/** Domain-11 season vocabulary ONLY. No dates, no clocks, no hours (HT13/HT17). */
type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter' | 'year-round';

/** A reference to a household-declared occasion + its explicit dressing permission (§ 8). */
interface CelebrationBinding {
  readonly occasionRef: string;        // a declared tradition id (LIVINGHOME1 § 7) — a permission, never content
  readonly requiresDressingPermission: true; // structurally always true: no occasion dresses without leave
}

/** One admitted dressing item. Note what CANNOT be expressed here — that is the design. */
interface DressingItem {
  readonly id: string;
  readonly admissionDocId: string;     // ED10 — no anonymous charm; every item cites its admission
  readonly hospitalityPurpose: string; // ED8 — the named welcome/comfort/care/year's-passage; "it looks nice" is refused at review
  readonly season: SeasonKey;          // the ONLY axis of variation
  readonly celebration?: CelebrationBinding; // present only for § 8-gated items
  readonly placement: PlacementSpec;   // § 6 — where, and where it is refused
  readonly render: RendererRef;        // § 7 — how, still and wordless
  readonly strengthCeiling: StrengthToken; // ED7 — below the emphasis budget; never tuned per surface
  readonly checksum: string;           // constancy within a registered season state (§ 4.4 EXP3 manner)

  // Structurally ABSENT, and that absence IS the platform (LIVINGHOME2 § 10.3):
  //   • no `binding` field ....... a data binding defines the LIFE register — its presence here is the § 9.10 forgery
  //   • no `text` / `copy` ........ dressing is wordless (ED4/ED7)
  //   • no `count` / `status` ..... dressing carries zero information (ED4)
  //   • no `href` / `onClick` ..... dressing is not a door and not interactive (ED4)
  //   • no `motion` / `animation` . dressing is still (ED7)
  //   • no `hourKey` / `time` ..... no hour-of-day dressing, ever (ED6/HT13)
  //   • no `campaignId` / `event` . dressing is never a channel and never marks product events (ED11)
  //   • no `householdId`/`segment`  no per-household dressing, no variant, no experiment (ED1)
}

interface DressingRegistry {
  /** The whole immutable collection. Empty is a valid, lawful register (and is the state at Phase 2). */
  readonly items: ReadonlyArray<DressingItem>;
  /** Constancy proof — items are byte-constant WITHIN a registered season state (EXP3 § 4.4 manner). */
  readonly checksum: string;
}
```

**The registry ships empty.** At Phase 2 the register exists and holds **zero items** — tooling only, no visual change (`LIVINGHOME2` § 10.4 Phase 2; `EXP3` § 13 Phase 2 precedent: *"the manifest module (empty)"*). Items are admitted one at a time thereafter (Phases 3–5), each its own governed act.

---

## 6 · Placement architecture (interface, declared)

Placement answers *where a dressing item may render, and — as importantly — where it is refused.* Placement is **legibility, not layout**: an item is placed where it reads as *the home's warmth* and never as *this room's information* (`LIVINGHOME2` § 5.1).

```ts
// DECLARED-NOT-BUILT

/** Regions the house already commits (EXP3 § 5 band regions). Dressing adds NO new region. */
type CommittedRegion = string; // resolved from the asset system's existing band regions; never a new layer

interface PlacementSpec {
  readonly region: CommittedRegion;      // must be a region the house already owns — dressing adds none
  readonly refusedRooms: ReadonlyArray<RoomId>; // § 6.1 — rooms where THIS item would read as data
}
```

### 6.1 The placement law — dressing yields to the room's subject (`LIVINGHOME2` § 5.1, cited)

An item may not be placed where its context would turn it into a claim about the household:

- **No produce dressing in the Pantry/Larder room** — a bowl of apples there reads as *your* pantry (ED3).
- **No book dressing in the Cookbook room** — an unlabelled book there reads as *your* collection (ED3).
- **No meal-shaped dressing in the Planner** — reads as *your* plan.

The item may be perfectly lawful and admitted; the *placement* in that room is refused. The general form, enforced by the verifier (§ 12): in every room, dressing must be legible as the home's warmth, never as the room's data. Placement never alters a region's size, so **no layout shift is possible** — the region exists whether or not dressing renders (`EXP3` § 9, cited).

---

## 7 · Rendering pipeline (interface, declared)

Rendering is deliberately the thinnest possible layer: **one mouth, still images, declared decorative, no state.**

```ts
// DECLARED-NOT-BUILT

interface RendererRef {
  readonly assetId: string;      // a bundler-hashed still asset under assets/living-home/dressing/
  readonly strengthToken: StrengthToken; // ED7 ceiling; never tuned per surface (UIA § 15)
}

/** The single component mouth. Pseudocode of the contract, not a shipped component. */
function DressingLayer(props: { room: RoomId; season: SeasonKey; permittedOccasions: ReadonlySet<string> }) {
  // 1. resolve() is PURE: (registry, room, season, permittedOccasions) -> DressingItem[]
  // 2. render each as a still <img>: aria-hidden, alt="", pointer-events-none  (ED7; orchard-backdrop.tsx manner)
  // 3. NO listeners, NO state beyond the resolver's pure output, NO runtime compositing (EXP3 § 10 zero-cost stillness)
  // 4. E1/E0 zero-byte invariant: rooms without a view render and load NOTHING (EXP3 § 10, LIVINGHOME2 § 10.3)
}
```

**The rendering pipeline, in one line:** a pure resolver picks the items whose `season` matches and whose room is not in `refusedRooms` (and, for celebration items, whose occasion is in `permittedOccasions`), and the mouth paints them as still, wordless, decorative-declared images inside a region the house already owns. Removing the whole layer loses no information, capability, or state (ED4).

---

## 8 · Lifecycle & the celebration permission (declared)

### 8.1 Item lifecycle (ED10, cited)

Every item moves through one governed path, never a batch: **named → briefed under ED8 → registered (season key + checksum) → reviewed with-and-without → admitted → (later) retired deliberately.** *Removing* dressing is as legitimate an act of curation as adding it (`LIVINGHOME2` § 9.9). There is no "dressing pack", no seasonal "theme drop", no bulk import.

### 8.2 The celebration permission — a per-tradition switch, OFF by default

`LIVINGHOME2` § 7.2.2 reserved to the `LIVINGHOME1` amendment the decision of *whether* the dressing permission is a **fourth ladder rung** or a **separate per-tradition switch**. This implementation makes that decision (Amendment 3b, § 2) and records the reasoning for the owner's review:

> **Decision: a separate, per-tradition dressing switch — distinct from the participation ladder, OFF by default. Not a fourth rung.**
>
> **Why.** Dressing consent is categorically different from participation consent: it can render a household's belief **visually**, which engages LH7's Article 9 special-category care in a way that "the Companion may say a word" (Aware) or "the food may participate" (At the table) does not. A fourth rung would (a) imply dressing is *"more participation than At the table,"* entangling a visual-belief consent with the words/food ladder, and (b) change the **count** of the governed rungs, which LH2 fixes. A separate switch fails closed on its own axis, is added without renumbering anything governed, and disappears with the declaration or the permission in one act (LH11).

The switch, when on, grants only a **registered, universal** item (the one simple wreath, identical for everyone that permits it) bound to a **declared** occasion (LH1) — never themed per household, never generated, never escalating. Default is nothing; a household that declares nothing, or permits nothing, sees a home with no occasion in it, completely and honestly. **This is Phase 5, hard-blocked** behind `LIVINGHOME1` Phases 1–3 (declared traditions + the permission mechanism) and the LH7 privacy review.

---

## 9 · Seasonal model (declared)

- **One input, one owner.** The season is Domain 11's answer (`shared/seasonal/season-rule.ts`), whose *input* Household Time supplies and whose *answer* nothing else may derive (**HT17**). The platform holds **no** season logic of its own — it reads the key and matches on it. There is exactly one season implementation in THA, and this platform does not become a second.
- **The year turns slowly, never the hour.** A handful of registered states across the year (`spring` · `summer` · `autumn` · `winter` · `year-round`), each admitted deliberately — the quiet passage of the year, not an animation of it. **No hour-of-day dressing, ever** (ED6; HT13 stands absolutely); no weather; no randomness; no rotation-for-freshness. The same household opening THA twice in one week sees the same home.
- **Resolve on read.** Presence is computed at render time from the season answer — **no scheduler** (HT14; the BUS2A expire-on-read precedent, cited).

---

## 10 · Visibility rules & room eligibility (declared)

### 10.1 Visibility rules

1. **Everyone, identically.** Non-celebration dressing is shown identically to every household in the same season (ED1). No segment, no variant, no experiment.
2. **Celebration dressing is private.** A § 8 item renders only inside the permitting household's own signed-in experience, is never an input to anything, and disappears with the declaration or permission in one act (`LIVINGHOME2` § 7.2.4; LH7/LH11 privacy — celebration items are `visibility: household`, fail-closed).
3. **Present-for-empty, never covering-absence** (invariant 6, § 4.1).
4. **Beneath words** — invisible to the Companion and every data surface (ED12; § 13.4).

### 10.2 Room eligibility

- **A room is eligible only if it already commits a region** the house owns (an E2/E3 room with a band; `EXP3` § 5). Dressing adds no region and no exposure mechanics (Blueprint § 6.2 Exposure Scale untouched).
- **E1/E0 rooms gain nothing** — the zero-byte invariant is preserved: rooms without a view load and render no environment or dressing bytes at all (`EXP3` § 10; `LIVINGHOME2` § 10.3).
- **Within an eligible room**, an item is refused where the placement law (§ 6.1) says its context would make it read as that room's data.

---

## 11 · What the platform must never own or become

**Never owns** (structurally, by the absent fields of § 5):

- **Business data** — no plan, pantry, list, recipe, or any domain fact. No `binding` field exists to hold one.
- **User state** — no preference, history, session, or composition. Dressing reads no household data (ED2).
- **Nutrition** — no nutrient, plant count, or health fact. Ever.
- **Planning** — no meal, week, or schedule.
- **Companion behaviour** — no prompt, Context View, capability, notice, persona, or word. Dressing is beneath words (ED12); INT17's ownership of every byte the model reads is untouched.

**Never becomes** (ED4/ED11, cited):

- **Another feature** — it carries zero information and no interaction; removing it loses nothing.
- **Another dashboard** — no numbers, no status, no counts.
- **Another workflow** — no doors, no actions, no state.
- **Another data owner** — it creates no store; the one thing it references (registered items) is a code/CI artefact, not household data.

**Does not implement** (the brief's forbidden list, and `LIVINGHOME2` § 6, refused not deferred): bowls · flowers · blankets · books · fruit · candles · seasonal decorations · weather effects · animations · lighting · particles · room assets. **Not one is created, drawn, registered, or rendered by this implementation.** The platform is the empty, governed shape into which — much later, one governed act at a time, past two more gates — the *first* such object might one day be admitted; today there are none, and the registry is empty by design.

---

## 12 · Future extension points (declared)

Named so future work has one sanctioned seam each, and so nothing extends the platform by any other route:

| Extension point | What it admits | Gate |
|---|---|---|
| **New dressing item** | One admitted `DressingItem`, via the ED10 pipeline (named · ED8 brief · season key · checksum · with-and-without review). | Register built (Phase 2); full experience gate stack; item's admission doc. |
| **New season state** | Only the Domain-11 vocabulary changes the season set — never this platform. A new state is a Domain 11 act, consumed here. | Domain 11 governance; HT17. |
| **New celebration binding** | A `CelebrationBinding` for a declared occasion, reachable only behind the § 8 per-tradition permission. | `LIVINGHOME1` Phase 3+; § 7.2 permission; LH7 review. |
| **New eligible room** | A room becomes eligible when it commits a house region; eligibility is read from the asset system, not declared per item. | `EXP3` region governance; § 10.2. |
| **New renderer capability** | Bounded strictly by ED7 (still, wordless, decorative-declared). Motion, text, and interaction are **not** extension points — they are structurally excluded (§ 5). | None — these are permanent refusals, not seams. |
| **Verifier checks** | The third-register checks declared at `EXP3` § 7.4 (Amendment 4): checksum match; no household-data read reachable from the mouth; celebration items unreachable without permission; placement exclusions enforced; every item's admission doc exists. | Built with the register (Phase 2). |

**The one seam that does not exist:** there is deliberately **no** extension point for personalisation, a data binding, a channel, a product-event mark, motion, or text. Those are not "not yet built" — they are refused by construction, and the type system (§ 5) is written so a future author cannot express them without deleting a comment that says why they may not.

---

## 13 · Validation against the governing architecture

Confirmed against `LIVINGHOME2` and the platform canon:

- **One canonical owner** — the Dressing Register (declared § 3), one module, one mouth. ✔
- **One source of truth** — the registry (§ 5) is the single list of what dressing exists; season is Domain 11's; occasions are the household's. ✔
- **No duplicated environmental state** — no state is created; presence resolves on read from the season answer (HT14); nothing derived is stored. ✔
- **No duplicated placement logic** — one `PlacementSpec` shape and one placement law (§ 6.1, owned at `LIVINGHOME2` § 5.1), enforced in one verifier. ✔
- **No duplicated seasonal logic** — the platform holds **no** season logic; it consumes Domain 11 and derives nothing (HT17). THA's one season implementation is not forked. ✔
- **No duplicated rendering logic** — one component mouth (§ 7); items live once and are referenced, never copied per room (`LIVINGHOME2` § 10.3). ✔

### 13.1 Ownership boundary confirmation

Environmental Dressing **never** owns business data · **never** owns user state · **never** owns nutrition · **never** owns planning · **never** owns Companion behaviour (§ 11, structural). It **only enriches existing rooms** — it adds no room, no region, no navigation, no exposure mechanic (§ 10.2), and it never becomes another feature, dashboard, workflow, or data owner (§ 11). ✔

---

## Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity
  One home, one orchard, one Companion untouched. The new layer has one owner
  (the Dressing Register, declared not built) and one law (LIVINGHOME2).
☑ One owner per fact
  Season stays Domain 11's (HT17); occasions stay the household's (LH1); the
  registered dressing items get exactly one owner at Phase 2. Every § 2 amendment
  is a citation/refinement in the OWNER's own file — no rule re-owned here.
☑ No duplicate entities
  No entity created. The Dressing Register EXTENDS EXP3's register model
  (Amendment 4) rather than rivalling it. No module, schema, or store shipped.
☑ No duplicate ownership
  § 11 lists exactly what the platform never owns; the § 8.2 permission decision
  is made AT the owner (LIVINGHOME1 amendment), never as a second statement.
☑ No duplicate state
  No state created; the registry is a future code/CI artefact; season resolves on
  read (HT14); no scheduler.
☑ Extends existing architecture
  Extends the two-register model with the third register both LIVINGHOME1 and EXP3
  reserved space for; invents no rival layer.
☑ Progressive enrichment where appropriate
  Phase-gated and additive; empty register default; no celebration dressing
  without an explicit per-tradition opt-in (OFF by default).
☑ Knowledge domain compliance
  No knowledge domain touched; Product Registry impact nil (no user-facing surface).
☑ Honest gaps over fabricated information
  The layer is claim-free by type (ED3); dressing may never cover honest absence
  (§ 10.1.3); Life's empty-house test survives at full strength, scoped to Life
  (Amendment 4).
☑ No permanent synchronisation bridge
  None; no scheduler (HT14); the celebration gate is a read-time permission check.
☑ Evolution over replacement
  Nothing retired; every superseded wording is amended AT its owner with both-ways
  citations (§ 2), the reverse path recorded.

Experience Constitution Check (before design):
  hospitality — the platform's sole purpose is the home's quiet welcome (ED8);
                it adds no felt weight (GEA2) — it is invisible until an item ships.
  outcome     — a governed home for warmth that cannot lie; no household carries
                anything new.
  weight      — zero: no visible change, no code, an empty register.
  voice       — no room and no Companion gained a voice; dressing is beneath words
                (ED12; GEA8/GEA21).
  ownership   — every statement is a room's/owner's fact or this platform's rule;
                nothing decides for the household (GEA23); celebration is opt-in.
  restraint   — the platform IS restraint made structural: the forbidden things are
                inexpressible by type (§ 5), not merely discouraged (GEA15).
  layer       — Experience Implementation shape + Layer-2 amendments; originates no
                new law (GEA20) — it cites LIVINGHOME2 throughout.
```

## AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — not reached at all. No capability,
  intent, prompt, Context View, notice, or persona created, altered, or consumed.
✓ Capability Registry / Intent Engine / Behaviour Engine — untouched.
✓ Does not create another assistant — none touched; the platform has no voice,
  no eyes, and no memory (LIVINGHOME2 § 7.4).
✓ Companion ownership unchanged — the layer's one AI rule is EXCLUSION: dressing
  never enters a prompt, Context View, capability, notice, or story, and the
  Companion never narrates it (ED12 — INT17's ownership of every byte the model
  reads is cited, untouched).
✓ Honest gaps over fabricated knowledge — a claim-free layer asserts nothing, so
  it has nothing to be wrong about (ED3).
```

## Definition of Done

- **Success looks like:** the four § 10.2 owner amendments are landed in their owners' files (§ 2), each a citation-based refinement that restates no rule; `docs/implementation/ED1_ENVIRONMENTAL_DRESSING_FOUNDATION.md` exists and specifies the full platform (owner · registry · placement · rendering · lifecycle · seasonal · visibility · eligibility · registration · extension points) as DECLARED-NOT-BUILT; the platform is validated against the governing architecture (§ 13); no code, asset, schema, route, token, or visible dressing ships; rollback reported; committed.
- **What must not break:** nothing runtime — this change touches documentation and session files only. No register, verifier, component, or asset is created. The one-season and one-morning laws, the empty-house test's purpose, and the prop ban's purpose all survive verbatim in their owners (§ 2).
- **Manual test steps:** `git diff --stat <rollback-tag>..HEAD` shows only `docs/` and `.engineering/session/` paths; typecheck / build / adoption baseline-identical (no code path in the diff); the four amendments each read as an annotation that preserves the original sentence.
- **Product Registry impact:** none now (no user-facing surface ships); Phases 3–5 each carry their own Product Registry Impact section when a dressing item first becomes visible.

## Data Impact

- **Reads existing data:** NO (documentation only). The *future* platform reads only Domain 11's season answer and, at Phase 5, the household's dressing permission — read-only, as a gate.
- **Writes new data:** NO. The Dressing Register is a future code/CI artefact, not household data; the § 8 permission is a future fact of the *traditions* domain, owned there.
- **Changes meaning of existing data:** NO.
- **Requires backfill:** NO — and the layer forbids inference by construction (ED2), so there is nothing a backfill could ever compute.
- **Special-category data:** none read, moved, or exposed. Celebration dressing (Phase 5, not built) would render only inside the permitting household's experience, from declaration + explicit consent, and vanish with either in one act (LH7/LH11).

## Trust Check

- **Could this mislead the user?** No runtime change. The platform's defining law is that it *cannot* make claims (ED3): a dressing item carries zero information by type (§ 5), so it has nothing to be wrong about. The one genuine mislead-risk — dressing read as household data — is closed structurally (§ 6.1 placement law, § 10.1 register separation, the § 5 absent `binding` field).
- **Could this fabricate certainty?** No. Dressing asserts nothing; Household Life's honesty laws are untouched and explicitly outrank it (Amendment 4 scopes the empty-house test to Life); dressing may never stand in for absent data (§ 10.1.3).
- **Is anything guessed but shown as real?** No. Nothing is inferred, ever (ED2); occasions appear only by declaration plus explicit per-tradition permission (§ 8).
- **Was any owned word or number changed?** No. Each § 2 amendment adds an annotation and preserves the original rule verbatim.
- **What happens if the system is wrong?** For this change: a documentation defect, corrected by amendment. For the future platform: a wrong item is at worst a mistimed pumpkin — traceable to one registered state and one admission document, corrected in one place, having claimed nothing about anyone.
- **No trust surface, consent ledger, permission path, or conversation store touched.**

## Rollback Plan

- **Rollback identifier:** `rollback/ED1-environmental-dressing-foundation-20260722` → `94edc39a` (annotated tag, created **before any change**; covers committed state only — the working tree held one uncommitted `.engineering/session/CURRENT.md` heartbeat, not covered).
- **Files modified:** `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` · `docs/architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` · `docs/architecture/LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` · `docs/implementation/EXP3_LIVING_HOME_ASSET_SYSTEM.md` (the four Phase-1 amendments) · `docs/implementation/ED1_ENVIRONMENTAL_DRESSING_FOUNDATION.md` (new) · `.engineering/session/CURRENT.md` (dashboard row) · `.engineering/session/runs/ED1_Environmental_Dressing_Foundation.md` (session record).
- **To revert:** `git revert` the ED1 commit, or `git checkout rollback/ED1-environmental-dressing-foundation-20260722 -- <the four amended files>` and `git rm` the two new files. Each amendment is a single appended annotation; reverting restores the original governing text exactly.
- **Verification after rollback:** `git diff rollback/ED1-environmental-dressing-foundation-20260722 -- docs/ .engineering/` is empty; no runtime surface existed to verify.

## Scope Lock

- **Implemented scope:** the four § 10.2 owner amendments (governance only); this foundation document; the session record + dashboard row. **Nothing else.**
- **Explicitly excluded:** all code, schema, migrations, tokens, assets, strings, routes, capabilities, components, the register module, the verifier, and — deliberately — **every visible dressing item** (bowls, flowers, blankets, books, fruit, candles, seasonal decorations, weather effects, animations, lighting, particles, room assets: none created, registered, or rendered). The register-as-code (`LIVINGHOME2` Phase 2) is **not** shipped — it remains gated behind these amendments *and* `EXP3` Phase 2.
- **Decision recorded for review, not assumed:** the § 8.2 celebration-permission mechanism — resolved as a **separate per-tradition switch, OFF by default** (reasoning at § 8.2), surfaced for the owner's acceptance.
- **Suggestion recorded, not taken:** the Phase-3 pilot candidate (the bowl of apples) — named at `LIVINGHOME2` § 10.4, not built here.

## Manual Verification

Performed for this change (documentation-only):

1. `git status` confirmed clean apart from the session heartbeat before work; the rollback tag was created and verified to resolve to `94edc39a` **before** any file was written.
2. The mandated inputs were read (`docs/architecture/README.md`; `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` in full; `LIVING_HOME_PASS5_LIVING_CRAFTSMANSHIP.md`; the four owner files at their exact amendment anchors), and the Architecture Bootstrap conflict check was performed and resolved with the owner (§ 0.1) — the two shut gates (§ 10.2 amendments not landed; `EXP3` register/verifier absent) were confirmed by grep and file inspection before choosing the compliant path.
3. Each of the four amendments was verified to be an appended annotation that leaves the original governing sentence byte-for-byte intact and cites `ED1` / `LIVINGHOME2`.
4. `git diff --stat` at commit time confirmed the change touches only the seven files named in the Rollback Plan — all under `docs/` and `.engineering/session/`, with **no code, schema, asset, token, or route path** in the diff.
5. No build, typecheck, or test surface is affected; none is claimed to have been re-run beyond confirming the diff contains no code path. (The amendments are Markdown; no `.ts`, `.tsx`, `.json`, `.css`, or migration file was touched.)

## User Acceptance Evidence

- **State: Waiting for User.** This is a governing-Phase-1 + foundation deliverable; acceptance is the owner's review.
- **The decision this implementation records rather than assumes:** the § 8.2 celebration-permission mechanism (separate per-tradition switch vs fourth rung), which `LIVINGHOME2` § 7.2.2 explicitly reserved to the `LIVINGHOME1` amendment. Resolved here as a **separate switch, OFF by default**, with the reasoning at § 8.2 — surfaced for the owner to confirm or redirect.
- **The path this implementation chose rather than assumed:** the compliant Phase-1 + DECLARED-NOT-BUILT foundation (§ 0.1), selected by the owner over building the register as code, which would have jumped two hard gates.
- **The gate that remains, named so it cannot be crossed silently:** no dressing-register *code* may ship until (a) these four amendments pass the owner's review and (b) `EXP3` Phase 2 (the base House/Life register + `verify:living-home-assets`) ships. Both are separate governed acts.
- **Evidence for review:** this document; the four amendments in their owners' files (§ 2); the session record at `.engineering/session/runs/ED1_Environmental_Dressing_Foundation.md`; and `LIVINGHOME2` itself, whose Phase 0 this implementation carries into Phase 1.

---

## Recommendation — the next implementation

**ED2 — Seasonal Environmental Dressing Activation** is *not yet* the next lawful engineering step, and this recommendation names why, so ED2 is entered through the gate rather than around it.

The lawful order, from `LIVINGHOME2` § 10.4, is:

1. **Owner review of the four Phase-1 amendments (§ 2)** — the acceptance gate this deliverable waits on. Holding any amendment is a legitimate, recorded outcome.
2. **`EXP3` Phase 2** — the base House-checksum + Life-manifest register + `verify:living-home-assets`, which must ship *before* the Dressing Register can extend it.
3. **Dressing Register (Phase 2)** — the empty register + verifier third-register checks, built to the § 5 contract. Tooling only; no visual change.
4. **The standing welcome (Phase 3)** — the first admitted item (candidate: the bowl of apples), full admission pipeline.

**ED2 — Seasonal Environmental Dressing Activation** is the natural name for the work that first makes the year *visibly* turn (`LIVINGHOME2` Phase 4 — the season's turns admitted one at a time), and it is the right destination. But it sits **behind steps 1–3 above**: there is nothing seasonal to activate until the register exists and the standing welcome is admitted. The honest recommendation is therefore: **take the owner's decision on the § 2 amendments first; then ship `EXP3` Phase 2; then the empty Dressing Register (this platform, built); then the standing welcome; and only then ED2, which activates the seasonal turns on a platform that is already lawfully in place.** Done in that order, ED2 is the moment the home first shows a family that autumn has come — through a pumpkin by the door, never a leaf on the orchard.

---

*The platform is laid: one owner, one register, one mouth, one placement law, one season input, and a shape into which the forbidden things cannot even be typed. No bowl of apples sits on any counter yet — the registry is empty, and lawfully so. What this establishes is the quiet certainty that when the home is finally allowed to keep a bowl of apples on the counter and pumpkins by the door in October, there will be exactly one governed place that decides it, asking nothing of any household and claiming nothing about them.*
