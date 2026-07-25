# THA Living Home Visual Registry

**Document ID:** `VISREG1`
**Date:** 2026-07-25
**Status:** GOVERNING — the canonical owner of the *kind* classification of every visual asset in the Living Home · classification and lifecycle only; **no asset is created, approved, retired or moved by this document**
**Rollback identifier:** `rollback/VISREG1-living-home-visual-registry-20260725` → `ec2014d7`
**Author of record:** Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow
**Classification:** Experience Governance — the visual asset ownership map (an assembly document in the `UIOWN1` mould)
**Governing documents (read before this one):** [`GOVERNING_EXPERIENCE_ARCHITECTURE.md`](./GOVERNING_EXPERIENCE_ARCHITECTURE.md) · [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) · [`THA_EXPERIENCE_BLUEPRINT.md`](./THA_EXPERIENCE_BLUEPRINT.md) · [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) · [`LIVING_HOME_EXPERIENCE_ARCHITECTURE.md`](./LIVING_HOME_EXPERIENCE_ARCHITECTURE.md) · [`LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md`](./LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md) · [`LIVING_HOME_DESIGN_CONSTITUTION.md`](./LIVING_HOME_DESIGN_CONSTITUTION.md) · [`LIVING_LARDER_ASSET_LIBRARY.md`](./LIVING_LARDER_ASSET_LIBRARY.md) · [`LIVING_LARDER_ARCHITECTURE.md`](./LIVING_LARDER_ARCHITECTURE.md) · [`HOME_OWNER_ARCHITECTURE.md`](./HOME_OWNER_ARCHITECTURE.md) · [`THA_CRAFTSMANSHIP_CONSTITUTION.md`](./THA_CRAFTSMANSHIP_CONSTITUTION.md) · [`UI_CANONICAL_EXPERIENCE_OWNERSHIP.md`](./UI_CANONICAL_EXPERIENCE_OWNERSHIP.md) · [`CAPABILITY_BOUNDARY_ASSESSMENT.md`](./CAPABILITY_BOUNDARY_ASSESSMENT.md)
**Implementation architecture it governs (not law, and never overridden by it):** `docs/implementation/house/EXP3_LIVING_HOME_ASSET_SYSTEM.md`

---

## 0. Experience Constitution Check (§ 18.2 — answered before design began)

- **HOSPITALITY (§ 3.1)** — This document adds nothing to any working surface and removes nothing. Its effect on a household is indirect and singular: the house they return to next year is made of the same objects it is made of today, because every object now has one owner who is accountable for keeping it so. ✅
- **OUTCOME (§ 3.5)** — *The household feels at home.* A home is recognised by its things. The registry exists so that the same shelf, the same jar and the same bowl are the same shelf, jar and bowl in every room, for a decade. ✅
- **WEIGHT (GEA2)** — No pixel is added, no room is heavier, no surface gains a control. The registry's only mechanical effect is to make *silent additions* classifiable, which reduces the weight a future room can accumulate by accident. ✅
- **VOICE (GEA8/GEA9)** — No asset speaks and this document gives none a voice. Every classification below is silent about what any household should do. ✅
- **OWNERSHIP (§ 7.4, GEA21/GEA22)** — A visual asset observes the way a window observes: it shows what is there and has no view about it. Interpretation stays the Companion's; nothing here lets an image become an opinion. ✅
- **AGENCY (GEA23)** — Nothing decides for the household. The registry classifies files; the household's data decides which of them are ever seen, and the Home Owner decides which of them may exist at all. ✅
- **RESTRAINT (GEA11/GEA13/GEA15)** — The registry creates no asset. Its lifecycle exists mainly to *withhold*: today it is actively holding 20 of 27 Larder jar masters out of production for want of a recorded approval (§ 2.3), which is the restraint it is for. ✅
- **LAYER (GEA20)** — This is an **Experience Architecture**-altitude document beneath the Experience Constitution. It states an ownership map and originates no principle; where its ambition met a governing refusal, the refusal won and is recorded (§ 12). ✅

**Experience Test (Blueprint § 15.3)** — *Which room is this?* None; this document is not a surface. *How should someone feel?* Unchanged — no household perceives this document. *The one thing it helps them do?* Nothing directly; it protects the constancy of the house they already have.

---

## 1. Mandate

### 1.1 The one sentence

> **Every visual asset in the Living Home belongs to exactly one canonical domain, has exactly one owner, exists as exactly one file, and moves through exactly one lifecycle — and this document is the single owner of that classification.**

### 1.2 What this document owns — exactly three things, and nothing else

1. **The six canonical visual domains** (§ 5) — the *kind* axis of every visual asset, and for each domain its purpose, owner, consumers, reuse rules, naming rules, approval workflow, and its relationship to the existing Asset Library, to the Living Home Architecture, and to future production assets.
2. **The four boundary tests** (§ 6) — the mechanical questions that decide which domain an asset belongs to, including the one this document was explicitly asked to make unambiguous: **Living Assets versus Environmental Dressing** (§ 6.3).
3. **The production lifecycle vocabulary** (§ 7) — **Concept → Candidate → Approved → Production → Deprecated** — stated once, over the runtime states that already exist, introducing no new state to any module.

Everything else in this document is a **citation to its owner**. Where any owner below and this document appear to conflict, **the owner prevails and this document is corrected** — the two-axis position `THA_BRAND_CONSTITUTION.md` and `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` already hold.

### 1.3 What this document does not own

| Concern | Its owner — unchanged, uncited-by-restatement, byte-untouched |
|---|---|
| What an asset must **look and feel** like to be admitted | `LIVING_HOME_DESIGN_CONSTITUTION.md` (`LHDC1`) |
| The **specification** of every Larder object, across 21 dimensions | `LIVING_LARDER_ASSET_LIBRARY.md` (`ASSET1`) |
| The **room** each object stands in — shell, station point, plan, aperture, light | `LIVING_LARDER_ARCHITECTURE.md` (`LARDER5`) |
| The **interior** — wings, furniture-first model, product forms, availability language | `LIVING_LARDER_INTERIOR_ARCHITECTURE.md` (`LARDER2`) |
| **How an object behaves** when handled — the Object Constitution, `M1`–`M7`, `LIA1`–`LIA10` | `LIVING_LARDER_INTERACTION_CONSTITUTION.md` (`LARDER3`) |
| The **Environmental Dressing law** — `ED1`–`ED12`, placement exclusions, the celebration gate | `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (`LIVINGHOME2`) |
| The **three-register classification test** (binding present → Life; no binding → Dressing or House) | `LIVINGHOME2` § 4.3 |
| The **register files, manifest schema, verifier, layers 0–4, artwork pipeline** | `EXP3_LIVING_HOME_ASSET_SYSTEM.md` (implementation architecture) |
| **Colour, typography, spacing, motion, tokens, state presentation, one-owner-per-visual-concern, admission + Adoption Register** | `THA_UI_ARCHITECTURE.md` (`UIA2`) — in particular § 15, § 16, § 17 |
| The house's **one morning, one orchard, one season, Exposure Scale, Living Details library** | `THA_EXPERIENCE_BLUEPRINT.md` |
| **Final aesthetic approval** of any asset | `HOME_OWNER_ARCHITECTURE.md` (`HOMEOWNER1`) |
| The **standard of craft** and the **design method** | `THA_CRAFTSMANSHIP_CONSTITUTION.md` (`CRAFT1`) |
| **Food identity, nutrition, allergens, freshness** — everything an ingredient *is* | Domain 2 (Canonical Food) · Domain 1 (Knowledge) · their registers |
| **Which surface renders which fact** | `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (`UIOWN1`) |

This document **creates no** route, capability, entity, token, component, string, schema, migration, asset, or business logic, and **no runtime code reads it**.

---

## 2. Why this document exists — the `CRAFT1` § 9 admission test, answered before writing

`THA_CRAFTSMANSHIP_CONSTITUTION.md` § 9 closed architectural design work: *"New architecture should only be introduced if a genuine architectural conflict is discovered — a case the existing canon cannot resolve, or two owners in true contradiction… Absent such a conflict, the answer to 'should we write new architecture for this?' is now, by default, **no**."*

That test is answered here, with evidence, **before** the document proceeds. Three findings satisfy it; each is a fact in this repository, not an argument.

### 2.1 Finding 1 — two governing owners in true contradiction, recorded and unresolved

`LARDER7` § 3.3 (2026-07-25) records four `ASSET1` entries that `LARDER5` and `LIVINGHOME2` forbade **the day after they were written**, with no correction made at either owner:

| `ASSET1` entry | What now forbids it |
|---|---|
| **H1 — Pendant Light** | `LARDER5` § 8 — the room is lit *by one morning through one window and by nothing else*; § 5.3 — *never a stage* |
| **H2 — Under-Shelf Lighting** | Same; a second light source contradicts the one-sun law (Blueprint § 7) |
| **H8 — Seasonal Flowers** | `LIVINGHOME2` § 5.1 and `LARDER5` § 13 — Environmental Dressing is refused in this room |
| **I7 — Evening Warmth** | The one-morning law (Blueprint § 7); *time may aim words and doors, never light* (`HT13`) |

This is `CRAFT1` § 9's *two owners in true contradiction*, exactly. **This document does not resolve it** — resolution belongs to those owners and, on the aesthetic axis, to the Home Owner. It is carried forward at § 12.1 as an inherited open item. What the contradiction demonstrates is the *structural* fact this document addresses: an asset specification and a room architecture were able to disagree for two days without anything detecting it, because **no owner held the two together**.

### 2.2 Finding 2 — a genuinely unowned concern: interaction-state assets

`LARDER3` owns how an object *behaves* when handled. `LARDER5` owns the three verbs — *look · open · reach*. `THA_UI_ARCHITECTURE.md` owns motion and state *presentation* in the general interface.

**No document owns the visual assets of an object's states** — what a cupboard *looks like* open as against closed, what a jar looks like while being carried, what a shelf looks like where a jar has just left. The live registers have no field for one, and no register row exists for any. A concern that three documents each touch and none owns is the definition of unowned, and the canon's own method for it is fixed: *name the fact → find its owner → and if no owner exists, **STOP and declare one first*** (`UIOWN1`'s Ownership Decision Matrix, the `TIME3` precedent).

### 2.3 Finding 3 — a Larder-scoped document is the de facto owner of every future room's assets

`ASSET1` declares itself *"subordinate to the Larder canon."* Its own § *How This Library Is Used*, item 5, then says: *"If another room is added to the Living Home, its assets are specified in the same framework and added to this library."*

Those two sentences cannot both hold. A document subordinate to one room cannot be the specification owner for every other room, because every other room's North Star would then be subordinate to the Larder's. The scope needs an owner at the house altitude. That owner is this document — **and it does not take `ASSET1`'s specifications from it** (§ 5, § 11.2).

### 2.4 The verified current state — what is true today, 2026-07-25

Stated as evidence rather than impression. All of it was read from the live tree, and `npm run verify:living-home-assets` was run for this section.

**Three register owners exist and are live:**

| Register | Owner (one, canonical) | Holds today |
|---|---|---|
| **House** — never changes | `docs/implementation/assets/house-asset-register.json` | 12 rows: 2 orchard environment assets (pre-convergence), 10 Larder joinery masters |
| **Life** — the household's true data, data-borne or dead | `client/src/components/layout/living-details-manifest.ts` | Living Details manifest **deliberately empty**; 27 Larder jar records; 2 produce records; the Visual Gap Register |
| **Dressing** — the home quietly lives | `client/src/lib/living-home/dressing-register.ts` | 1 admitted item (the Standing Welcome bowl of apples); 6 asset files |

**46 files exist under `client/src/assets/living-home/`** — 10 joinery, 27 jars, 2 produce, 6 dressing, 1 README. **Every one of them is registered.** `verify:living-home-assets` reports **31 checks run — 31 passed, 0 failed**, and the honest summary it prints: *"the house is byte-locked; the Life register is honest and empty; the Dressing register is byte-locked and every admitted item is claim-free, still, and lawfully placed."*

**This matters, and it is stated plainly: the visual layer is not ungoverned, and this document must not pretend it is.** Registration, checksums, one-mouth enforcement, a lifecycle, a rejection archive and a Home Owner approval instrument all exist and all work. Of the 27 jar masters, **7 are approved and available; 20 are candidates held out of production** for want of a checksum-bound approval — the lifecycle doing its job, today, on real files.

What is missing is not registration. It is that **every one of those registers classifies an asset by *variance* — what makes it change — and nothing classifies it by *kind***. There is no answer, today, to *"who owns fridges?"* or *"which owner do I ask about a drag state?"*, and three separate id conventions are already in use across the three registers (`tha-larder-jar-<family>`, `larder-joinery-<subject>-<material>-<variant>`, `standing-welcome-bowl-of-apples`) because no rule ever spanned them.

**Verdict on the `CRAFT1` § 9 test: admissible.** One recorded contradiction between two governing owners, one unowned concern, one scope conflict. This document is written to the narrowest shape that closes them: an ownership map that assembles existing owners and takes nothing from any of them.

---

## 3. The two axes — and why this document is orthogonal to everything that exists

### 3.1 Variance and kind

Every visual asset in the Living Home now answers **two independent questions**, each with its own owner:

| Axis | The question | The answer set | Owner |
|---|---|---|---|
| **Variance** | *What makes this asset change?* | House (never) · Life (the household's data) · Dressing (the year) | `EXP3` § 1 / `LIVINGHOME2` § 4.3 — **not this document** |
| **Kind** | *What kind of thing is it, and who is accountable for it?* | Architectural · Furniture · Container · Ingredient Presentation · Living · Interaction | **This document, § 5** |

**`VR1` — Every visual asset carries exactly one register and exactly one domain.** Neither determines the other; neither may be inferred from the other; neither owner may state the other's answer.

This is the **scope test** of `ARCHITECTURE_PRINCIPLES.md` Principle 2, applied and passed: *can these two classifications legitimately disagree?* They cannot disagree at all, because they are not answering the same question. A Larder joinery shelf is **House** (its bytes never change) and **Architectural** (it is part of the room's fabric). A filled jar is **Life** (which jar you see is your pantry's fact) and **Ingredient Presentation**. A bowl of apples the *home* sets out is **Dressing** and **Living**. Three assets, six answers, no contest.

### 3.2 The precedent this document follows

This is the shape `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (`UIOWN1`) established for a different gap. THA held a map of *facts → stores* (the Source of Truth Register) and a map of *experience questions → documents* (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 17), and re-derived the middle mapping — *experiences → owners* — on every implementation until `UIOWN1` owned it.

The visual layer is in the same position one level down: it holds *assets → registers* (`EXP3`) and *objects → specifications* (`ASSET1`, `LHDC1`), and re-derives *assets → domain owners* on every implementation. This document owns that middle mapping and, like `UIOWN1`, is an **assembly document**: it owns its map and its lifecycle vocabulary, cites everything else, and restates nothing.

---

## 4. The five preserved principles

The mission requires these five to survive this document intact. Each is stated as what it means *for a visual asset*, with its owner cited — none is re-legislated here.

- **One entity.** One real-world object is one asset entity with one id, in one domain, in one register. *"The tall storage jar"* is one entity whether it stands in the Larder, in a future Kitchen, or in a Cookbook composition. (`ARCHITECTURE_PRINCIPLES.md` Principle 1; `ASSET1`'s *"one shelf, one jar, one basket — specified once, reused forever"*.)
- **One owner.** Every asset has exactly one accountable owner — the domain owner named in § 5 — and every *fact about* that asset has exactly one owner: its bytes are the register's, its specification `ASSET1`'s or its successor's, its look-and-feel standard `LHDC1`'s, its approval the Home Owner's. (Principle 2.)
- **One source of truth.** One file, one location, one register row, one mouth. A room never holds a copy (`VR7`; `EXP3` § 6, verifier check 4). A second file of the same object is not a variant — it is a duplicate, and the verifier already fails it.
- **Progressive enrichment.** An asset entity is enriched along the lifecycle — **identity → specification → candidate bytes → recorded approval → production consumption** — and every stage renders honestly at the stage it has reached. A candidate is *visible in the register and absent from the product*; that is enrichment behaving correctly, not incompleteness. (Principle 3; the live `deriveJarAvailability` is this rule already executing.)
- **Honest gaps.** A missing asset renders as absence, never as a substitute. An empty sill is a complete sill; a jar with no approved master is not quietly replaced by a similar one. Where a gap must be visible, it is *labelled as a gap* — the live `VISUAL_GAP_GREEN` is exactly this: one colour, one meaning, *"approved visual representation missing,"* on the fallback jar only, never a UI token. (Principle 6; `LIVINGHOME2` § 6 — dressing may never be positioned to cover honest absence.)

---

# THE SIX CANONICAL DOMAINS

Each domain below is defined across the nine required dimensions. Read `VR1` first: a domain answers *kind*, never *variance*.

---

## 5.1 Domain 1 — ARCHITECTURAL ASSETS

**Owns:** walls · flooring · ceilings (where applicable) · windows · doors · shelving · worktops · built-in furniture · architectural lighting · room shells.

**Purpose.** The fabric of the house — everything that would remain if every object were carried out of the room. These assets are what makes a room *a place* rather than a background, and their defining property is that **the household can never move them**: `LARDER5` fixes the shell, the station point, the aperture and the plan as permanently the house's, never themed, configured or preferred, *because a room that can be configured cannot be known by heart*.

**Ownership.** This registry owns the domain. Per-object specification remains `ASSET1`'s for the Larder (§ A JOINERY, § I ENVIRONMENTAL) and each future room's own North Star for its own shell. The **shell itself** — floor, back wall, returns, doorway, bounded top with no ceiling drawn — is `LARDER5`'s and is cited, never re-specified.

**Consumers.** The shell (`AppShell`, `RoomThreshold`) · each room surface · `orchard-backdrop.tsx` for the environment · no other importer, ever.

**Reuse rules.** Architectural assets are **shared by construction**: layers 0–3 belong to the shell and every room inherits them without asking (`EXP3` § 3). A room may never author its own wall, floor or light. Where a room genuinely needs a shell the house does not have, that is a **new room shell admitted at the house altitude**, never a local variant.

> **The rule that most distinguishes this domain: most architectural assets are not files.** `EXP3` § 4.1 adopts Home's window joinery as the house's law of craft — *architecture is drawn by the house's own hand (CSS and tokens) wherever possible, and is a raster asset only when it must be*. The orchard is a file because it must be. Mullions, a sill, a ground plane and a light wash are not. **`VR2` — an architectural asset is admitted as a file only after the house's own hand has been shown insufficient, and the admission states why.**

**Naming rules.** Id `<room>-architectural-<subject>[-<qualifier>]`; environment families keep their established form (`orchard-<width>.webp`). Live precedent: `orchard-environment-rooms`, `larder-joinery-floating-shelf-oak-wide`. See § 8.2 for why existing names are not retrofitted.

**Approval workflow.** Full lifecycle (§ 7). An architectural asset is **House-register class** in every case its bytes are constant — which is every case, since the shell never varies. Its approval is a Home Owner approval bound to the file checksum, and its bytes may change *only* in the same commit that updates its register row citing the governing amendment (`EXP3` § 4.4, live and enforced).

**Relationship to the existing Asset Library.** `ASSET1` § A (JOINERY) and § I (ENVIRONMENTAL) are the Larder's architectural specifications and **remain the specification owner unchanged**. This registry adds the domain and the accountability; it adds not one dimension to any of `ASSET1`'s twenty-one and removes none.

**Relationship to the Living Home Architecture.** Architectural assets *are* `EXP3` layers 0–3. The Exposure Scale, the one morning and the one orchard bind absolutely and are not restated. `LARDER5`'s `RC1`–`RC12` govern the Larder's composition and reach a future room **only through that room's own North Star and its own gates** — never automatically by being in this registry.

**Relationship to future production assets.** The highest-value outstanding item in this domain is not new: it is the **two-orchard convergence** (`LIVINGHOME1` § 10.2, `EXP3` § 4.2) — `/orchard.webp` and `/orchard-bg.webp` becoming one graded responsive family. This registry adds no deadline and takes no side; it records that the convergence is this domain's first obligation and that **no third orchard sibling may exist before it**.

---

## 5.2 Domain 2 — FURNITURE ASSETS

**Owns:** cupboards · pantry units · fridges · freezers · tables · seating · cabinetry.

**Purpose.** The objects that *stand in* a room rather than forming it. In the Living Home, furniture is not decoration — `LARDER5` makes furniture the room's **navigation**: the room contains no tabs, chips, filters, dropdowns or breadcrumbs, because each would be *a second, abstract copy of the room laid over the room*. A household reaches a thing by going to the piece of furniture it lives in. Furniture assets therefore carry a load no other domain carries: **they are the interface.**

**Ownership.** This registry owns the domain. Per-object specification is `ASSET1`'s (§ A JOINERY, § B COLD STORAGE) for the Larder; each future room's furniture is specified under the same twenty-one-dimension frame at the owner § 11.2 names.

**Consumers.** The room surface that holds the piece, through the one mouth for its register. Today: `client/src/pages/larder-room.tsx` for the ten registered joinery masters.

**Reuse rules.** **Furniture is fact-shaped, not room-shaped** (`EXP3` § 6, applied). A cupboard is one asset whether it stands in the Larder or in a future room; adding a room never duplicates a piece. Variants (a shelf short/medium/wide; a cupboard single/double) are **one family under one id family**, never separate entities that can drift into a second owner.

**Naming rules.** Id `<room>-<construction>-<subject>-<material>-<variant>` — the live joinery convention, unchanged: `larder-joinery-cupboard-oak-double`, `larder-joinery-drawer-unit-oak-shallow`. File `tha-` + id + extension.

**Approval workflow.** Full lifecycle (§ 7), Home Owner approval checksum-bound. Furniture is **House-register class where its bytes are constant** — which is the normal case, since `LARDER2`'s furniture-first model builds the furniture first and holds it still. A piece whose *appearance* varies with a household fact is not furniture varying; it is an **Interaction Asset** (§ 5.6) or an **Ingredient Presentation Asset** (§ 5.4) composed on top of constant furniture.

**Relationship to the existing Asset Library.** `ASSET1` § A and § B remain the specification owner. One boundary is named here because `ASSET1` and `LARDER5` sit either side of it: a **built-in** cupboard fixed to the shell is Architectural; a **freestanding** cupboard, a fridge, a freezer, a table or a chair is Furniture. § 6.1 makes the test mechanical.

**Relationship to the Living Home Architecture.** Furniture is `EXP3` layer 4's substrate in the Larder and has **no equivalent in any other room today** — `EXP3` Verdict 2 is explicit: *there is no furniture layer* in the general house, because a room may express character only through ground plane and light (Blueprint § 8.2). **That verdict stands and this registry does not touch it.** The Larder is a *room built as a room* under `LARDER5`; a future room gains furniture only by its own North Star arguing for it against Verdict 2, at Verdict 2's owner.

**Relationship to future production assets.** The cold pair (fridge, freezer) is specified at `ASSET1` § B and has **no approved master and no candidate file** today. `LARDER7`'s five concepts treat cold storage as one of the eight axes on which senior designers legitimately differ — from *no appliance ever visible* to *honest freestanding* to *translucent*. **No cold-storage asset should be produced until the Home Owner has ruled on a concept**, because the five answers are not variants of one object; they are five different objects.

---

## 5.3 Domain 3 — CONTAINER ASSETS

**Owns:** jars · tins · bottles · bowls · baskets · trays · crates · crockery.

**Purpose.** The vessels a household keeps things in — **empty, as themselves**. A container asset is the object a household would recognise picked up off a shelf with nothing in it. This domain exists separately from Ingredient Presentation for one reason, and it is a trust reason: **a vessel asserts nothing**. An empty jar is a true picture of an empty jar. The moment something is *in* it, the asset begins making a statement about a household's food, and a different set of rules must apply (§ 5.4).

**Ownership.** This registry owns the domain. Per-object specification is `ASSET1`'s § C (GLASS), § D (CERAMICS), § E (BASKETS), § F (FOOD STORAGE), § G (HOUSEHOLD).

**Consumers.** The one mouth of the room the vessel stands in. Today `client/src/pages/larder-room.tsx`, which the verifier enforces as the *only* file permitted to reference the Larder asset subtree.

**Reuse rules.** One vessel, one file, one id, reused across every room and every fill state. **A container asset is never duplicated to make a filled version** — the fill is composed, not baked, wherever the medium allows. Where a medium cannot compose (a raster master of a filled jar), the filled variant is an Ingredient Presentation asset in its own right, and it declares the container family it belongs to. The live jar family is exactly this shape: `tha-larder-jar-empty.png` is a **Container asset**; the 25 filled ingredient-family masters are **Ingredient Presentation assets** sharing one specification (`LARDER_JAR_SHARED_SPEC`).

**Naming rules.** Id `<room>-<vessel>-<form>[-<size>]`; live form `tha-larder-jar-<family>`. Vessel first, contents never — a container id may not name a food, because a container that names a food is not a container.

**Approval workflow.** Full lifecycle (§ 7). Register class is decided by the binding test, not by this domain: an empty vessel the room always shows is House; a vessel that appears because a household's fact says so is Life.

**Relationship to the existing Asset Library.** `ASSET1` § C–§ G remain the specification owner and are byte-untouched. This registry adds the domain boundary at § 6.2 and the rule that a vessel is specified **once** and reused across every fill state and every room — which `ASSET1`'s own Library Principle already states in its own words (*"Every jar should be the same jar"*) and which no owner previously enforced across rooms.

**Relationship to the Living Home Architecture.** Containers are the physical vocabulary `LARDER2`'s product-form philosophy reads: *the form is read, never counted — a jar tells its level, a tin tells its presence.* A container asset must therefore be **legible as a form at the room's fixed viewing angle** (`LARDER5`'s long-lens one-point elevation, *a jar never drawn in perspective*) or it is not usable however beautiful it is.

**Relationship to future production assets.** The live jar family is the only container family with any production asset at all. **Tins, bottles, bowls, baskets, trays, crates and crockery have zero candidates and zero approvals** — every one is specified at `ASSET1` and unbuilt. Their production is gated on the same Home Owner concept ruling as § 5.2: `LARDER7`'s jar/tin/label axis produced five materially different vessel families, and producing one before the ruling would be producing the wrong one.

---

## 5.4 Domain 4 — INGREDIENT PRESENTATION ASSETS

**Owns presentation only:** filled jars · produce presentation · pantry organisation · fridge presentation · freezer presentation · storage layouts.

> ### This domain owns no food knowledge. Not one fact.
>
> **`VR3` — An ingredient presentation asset depicts; it never states.** What a food *is* — its identity, its nutrition, its allergens, its freshness, its quality — belongs to Domain 2 (Canonical Food), Domain 1 (Knowledge) and their registers, and reaches a household through the surfaces those owners already speak from. A presentation asset resolves *against* Domain 2's canonical identity and asserts nothing beyond *"this is what this looks like on a shelf."*
>
> This is not a caution; it is already implemented and enforced. Every live jar record carries `canonicalFoodMappings` (its Domain 2 slugs) and a `prohibitedUses` list that includes, verbatim, **`nutrition-quality-or-freshness-claim`** and **`representation-of-any-food-outside-canonicalFoodMappings`**. This registry generalises that existing instrument to the whole domain rather than inventing a rule for it.

**Purpose.** To let a household read their own provisions **by looking** — `LARDER1`'s North Star, and `LARDER5` § 15.2's stated measure of whether the composition succeeded: *the majority of the room is answered by look.* A filled jar carries approximate availability at a glance and **never a quantity, never a form** (`LARDER1`).

**Ownership.** This registry owns the domain. Per-asset records and the lifecycle law live at their one existing owner, `client/src/components/layout/living-details-manifest.ts` — deliberately, so that no second register, verifier, approval log or state owner can come into existence. **This document does not move them and must never be read as moving them.**

**Consumers.** The one mouth for the room. Today: `client/src/pages/larder-room.tsx`, unlocked only by the 7 approved assets; the 20 candidates are unreferenceable and the verifier fails any reference to them.

**Reuse rules.** One asset per canonical food family, reused wherever that family appears, in every room. **An ingredient presentation asset is never room-specific** — the same brown rice is the same brown rice in the Larder, in a Cookbook composition and in a future Kitchen. Confusable families (`confusableWith` on the live records) must be visually distinguishable in the same rendering; two families that cannot be told apart at the room's viewing angle are one asset with a labelling problem, and the label belongs to the household, not the artwork.

**Naming rules.** Id `<room>-<vessel>-<canonical-family>`; live form `tha-larder-jar-<family>`. **The id names the food family, never a brand, never a product, never a quantity.**

**Approval workflow.** Full lifecycle (§ 7), and this is the domain where the lifecycle is currently doing visible work: **7 approved, 20 candidates held out of production.** Approval is checksum-bound; drift invalidates it and withdraws availability while preserving history (`applyJarChecksumDrift`). Because these assets depict a household's food, one additional standing condition applies and is cited, not created: an asset whose in-pixel content could be read as a claim about food is bound to the Home Owner's checksum-locked approval and **cannot be silently bypassed** — the verifier records this as a *disclosed honest automation gap* rather than pretending in-pixel wording review is mechanical.

**Relationship to the existing Asset Library.** `ASSET1` § C and § F specify the vessels; `LARDER2` § I.5 specifies where they stand. Neither is amended. This registry supplies what neither held: the statement that the *filled* asset is a distinct domain from the *vessel*, and that the distinction is a **trust** boundary rather than a filing one.

**Relationship to the Living Home Architecture.** These are **Life-register** assets by definition: which one a household sees is decided by their Domain 30 pantry facts at read time. The empty-house test therefore binds in full — an empty pantry shows an empty shelf, in every season, and nothing is placed there to cover it (`LIVINGHOME2` § 6).

**Relationship to future production assets.** Fridge, freezer and store-room presentation are specified nowhere in production terms and are **downstream of the § 5.2 cold-storage concept ruling**. Producing fridge presentation before the fridge is decided would be producing the contents of a cupboard whose door has not been designed.

---

## 5.5 Domain 5 — LIVING ASSETS

**Owns:** herbs · household plants · fruit bowls · **household-owned** seasonal items.

**Purpose.** The living things a household *keeps*. This is the warmest domain in the registry and the most dangerous, because every asset in it is one classification error away from becoming the thing the canon has refused four separate times: a prop — *fabricated feeling, forbidden by construction* (Blueprint § 12.1.2).

### The distinction this domain exists to make — Living Assets are not Environmental Dressing

The mission requires this stated explicitly. It is stated here in full, and the mechanical test it rests on is **cited, not restated**, because `LIVINGHOME2` § 4.3 already owns it.

| | **Living Asset** (this domain) | **Environmental Dressing** (`LIVINGHOME2`) |
|---|---|---|
| **Whose object is it?** | The **household's**. They keep it. | The **home's**. The house sets it out. |
| **Why does it appear?** | Because a canonical owner holds a true fact that says it exists | Because the year turned. It appears for everyone alike |
| **Data binding** | **Required.** No binding, no entry | **Forbidden.** A `binding` field on a dressing item is a build failure |
| **Register** | **Life** | **Dressing** |
| **Empty household** | **Vanishes.** The empty-house test binds in full | **Lawfully present** — that presence is the warmth a real home shows a family who has not unpacked |
| **Does it claim anything?** | Yes — *"you keep this"* — and must therefore be true | **Nothing.** It has zero information, so it has nothing to be wrong about |
| **Varies by** | The household's own facts | The season only (Domain 11, `HT17`) — never the hour, never the household |
| **Owner of the law** | This registry (kind) · `EXP3` (register) · the fact's canonical owner (truth) | `LIVINGHOME2` `ED1`–`ED12`, entirely |

**The test is not this document's and is not restated as a rival:** `LIVINGHOME2` § 4.3 — **a data binding present → Life; no binding → Dressing or House.** Classification is mechanical, an item may never migrate between registers silently, and reclassification is an admission event. `LIVINGHOME2` § 9.10 names the failure mode by name — **the forgery** — a dressing item quietly rebuilt as data-driven, or a Life detail quietly demoted to dressing.

Two consequences follow, and this registry states them because they are consequences of the *kind* axis rather than of the register axis:

- **`VR4` — One subject may exist in both domains, and it is two assets, never one file used twice.** A bowl of apples the home sets out (`standing-welcome-bowl-of-apples`, admitted, Dressing) and a household's own apples rendered from their pantry (Life) are **two entities with two ids, two admissions and two approvals.** Sharing one file would make the register classification unverifiable at the file level, which is precisely the forgery the verifier exists to catch. This is the **one exception to reuse** in this registry, and it is a trust exception, not a filing one.
- **`VR5` — The placement exclusions bind the kind axis too.** `LIVINGHOME2` § 5.1 forbids produce dressing in the Pantry/Larder room — because *there*, a home-owned apple would be read as a claim about the household's apples. A Living Asset is lawful in that room; a Dressing item of the same subject is not. Same picture, same shelf, different truth.

**Ownership.** This registry owns the domain. The **truth** of any Living Asset belongs to the canonical owner of the fact it renders — and this is where the domain's one live gap sits: **herbs and household plants have no canonical owner today.** `LARDER7` § 3.3 flagged it as the fifth, genuinely ambiguous case: the North Star shows herb pots on the sill, and under `LARDER5` § 13's test — *if the room put it there, it is refused; if the household keeps it, it belongs* — a herb pot is lawful **only** if a household's kept herbs are a real provision resolved from an owner. **This registry does not create that owner** (`TIME3` precedent: declare the need, do not mint the domain in a document that is not its home). Until an owner exists, a herb asset has no lawful binding and therefore no lawful entry — and saying so is the honest answer, not a blocker to route around.

**Consumers.** The one mouth for the register the asset lands in — `living-details.tsx` for Life (which lands with its first admitted detail, never before) and `dressing-layer.tsx` for Dressing.

**Reuse rules.** Fact-shaped, one file, shared across rooms — with `VR4`'s cross-register exception above. A seasonal variant family (early/late plums) is **one family under one id**, never separate ids.

**Naming rules.** Id `<subject>[-<variant>]` for house-wide living subjects; `<season>-<subject>` where the season is the item's own identity, which is the live Dressing convention (`spring-flowers`, `autumn-pumpkins`). A Living Asset id **never carries a household, a person, or an occasion** — the schema has no field for one and the verifier fails an occasion-shaped key anywhere in the manifest (`LH3` made mechanical).

**Approval workflow.** Full lifecycle (§ 7), and additionally: every object in this domain — in either register — is admitted against **`LHDC1`** in full, one at a time, never as a batch (`ED10`), with the with-and-without review and the Home Owner's recorded approval. `LHDC1` § 21's admission evidence list is the standard; this registry adds nothing to it.

**Relationship to the existing Asset Library.** `ASSET1` § H8 (Seasonal Flowers) is one of the four entries `LARDER5`/`LIVINGHOME2` now forbid in the Larder (§ 2.1). This registry **does not amend `ASSET1`** and takes no side; it records that H8's status is open at its owners and that no H8 production asset may be commissioned while it is.

**Relationship to the Living Home Architecture.** This domain is where `LIVINGHOME1`'s two registers and `LIVINGHOME2`'s third meet, and it is the only domain that spans two of them. The one-season and one-morning laws are absolute in both: *the passage of the year enters through the door as objects; it never enters through the window as weather* (`ED5`).

**Relationship to future production assets.** Six Dressing SVGs exist and are byte-locked; **one is admitted** (the Standing Welcome). The remaining five are registered, checksummed and not in production — the lifecycle holding them correctly. **No Living Asset in the Life register exists at all**, and none can until either a binding owner exists (herbs) or an existing owner's facts are bound (a household's fruit, via Domain 30).

---

## 5.6 Domain 6 — INTERACTION ASSETS

**Owns all visual interaction states:** open · closed · hover · drag · selected · highlighted · placement · removal · empty · full.

**Purpose.** To give an object's states a visible face. `LARDER3` states the constitution a household lives by — *a household never edits records, they handle their own provisions* — and `LARDER5` reduces the room to three verbs, *look · open · reach*. Those laws describe **behaviour**. Nothing until now owned what that behaviour **looks like**: the cupboard open as against closed, the jar lifted, the shelf where a jar has just been taken from. This is the unowned concern § 2.2 recorded, and it is the one domain in this registry that is genuinely new.

**The domain's internal split — and why it matters.** Interaction states divide cleanly by the binding test, and the division decides their register:

| Class | States | Register | Why |
|---|---|---|---|
| **Content states** — what is true of the household's things | `open` · `closed` · `empty` · `full` · `placement` · `removal` | **Life** | Each renders a household fact. `empty` and `full` *are* `LARDER2`'s availability language; they must be true or they are a lie about a family's food |
| **Input states** — what is true of the person's pointer right now | `hover` · `drag` · `selected` · `highlighted` | **House** | Constant for every household; carry no fact; identical for everyone; nothing to be wrong about |

**`VR6` — A content interaction state binds to a canonical owner or it does not exist. An input interaction state may never bind to one.** An input state that reads household data has become a claim; a content state that does not is a decoration pretending to be information.

**Three constraints this domain inherits, none of which it may relax:**

1. **Still by construction.** `EXP3` § 7.3 and § 12.1.5: the register schema has no motion field and reduced-motion needs no branch because there is nothing to reduce. **An interaction asset is a *state*, never an animation.** `open` and `closed` are two assets; the transition between them is **motion**, owned by `THA_UI_ARCHITECTURE.md`'s motion vocabulary, and is not an asset in this registry at all. § 6.4 makes the test mechanical.
2. **Never the only channel.** `EXP3` § 11 renders every House and Life visual `aria-hidden` with empty `alt`. An interaction state that carried meaning under that rule would be meaning delivered on a single visual channel, which `LARDER1` § 10 forbids. **The resolution, stated as a requirement rather than a hope: an interaction asset is always the *visible face* of a state whose authoritative expression is the room's own accessible state and text.** The asset may be removed entirely and nothing becomes unknowable. Any proposed interaction asset that fails this is refused at admission.
3. **Drag is an enhancement.** `LARDER1` is explicit: every drag outcome has a non-drag equivalent. A `drag` asset therefore may never be the mechanism by which an action becomes discoverable — it makes a possible action *feel* physical, and a household who never drags loses nothing.

**Ownership.** This registry owns the domain outright — it is the first domain here with no prior specification owner. **Per-state specification does not yet exist and is not created here** (§ 12.2): this document declares the domain and its laws; the specifications are written at `ASSET1`'s successor scope (§ 11.2) when a room needs them.

**Consumers.** The one mouth of the room whose object holds the state. No shared "interaction asset" component may exist — a state belongs to its object, and an abstracted state layer would be `LARDER5`'s *second, abstract copy of the room laid over the room*.

**Reuse rules.** **States are object-shaped, not room-shaped.** The open state of the oak double cupboard is one asset wherever that cupboard stands. A state may never be authored generically ("the open state") and applied across unlike objects — `LARDER3`'s Object Constitution requires each object to behave *as itself*, and a shared open-state asset would flatten five mechanisms into one.

**Naming rules.** Id `<object-id>--<state>`, the double hyphen marking a state of a named object rather than an object in its own right: `larder-joinery-cupboard-oak-double--open`. **A state id is never free-standing** — it must resolve to an existing registered object id, and one that does not is an orphan.

**Approval workflow.** Full lifecycle (§ 7), with one addition specific to this domain: an interaction asset is reviewed **in sequence with the state it succeeds and precedes**, never in isolation, because a state that is beautiful alone and wrong beside its neighbour has failed. `LARDER3`'s Movement Principles bind the review — *nothing teleports · nothing appears from nowhere · the room holds still · forgiving return · calm never celebratory · movement is a courtesy, never a requirement*.

**Relationship to the existing Asset Library.** `ASSET1` dimension 17 is **Animation** — *"how this asset behaves when acted upon — opening, sliding, lifting."* That dimension is the specification frame's existing hook for this domain and is **not amended**; this registry reads it as the specification input for a state asset and adds the classification, the register split and the three inherited constraints that `ASSET1` (written before `LARDER5` and before the dressing law) could not have stated.

**Relationship to the Living Home Architecture.** Content states are Life-register assets and inherit the empty-house test; input states are House-register and inherit byte-constancy. `EXP3` Verdict 2 is untouched — an interaction state is not a furniture layer, because it renders only on an object the room already lawfully holds.

**Relationship to future production assets.** **Zero interaction assets exist, in any register, in any state.** This domain is entirely unbuilt, and that is correct: `LARDER4`'s layered order is *architecture before implementation · furniture before products · room before interactions · objects before behaviours · behaviours before polish*. Interaction assets are fourth in a five-step order whose second step (furniture) is 10 of ~40 objects complete. **Producing them now would be building the polish of a room whose walls are not chosen** — and `LARDER7`'s five concepts remain unruled.

---

# 6. THE BOUNDARY TESTS

Each test is one mechanical question with one answer. A classification that needs an argument has not been made.

## 6.1 Architectural or Furniture?

> **Is it built into the shell, or does it stand in the room?**

Built in → **Architectural**. Stands in the room → **Furniture**. The test is **construction, never mobility**: `LARDER5`'s plan is permanent and a household moves nothing, so *"can it be moved?"* would classify everything as architectural and is the wrong question. A fitted in-frame run is architectural; a freestanding dresser of identical appearance is furniture. Where a room's own North Star has not yet said which its joinery is, **the classification waits for the North Star** rather than being guessed by the artwork.

## 6.2 Container or Ingredient Presentation?

> **Does it depict anything a household keeps?**

No — it is the vessel as itself → **Container**. Yes — a food is visible in it → **Ingredient Presentation**. The live family is the worked example: `tha-larder-jar-empty` is a Container; the 25 filled families are Ingredient Presentation on one shared specification. The boundary is a **trust** boundary: the moment a food is visible, `VR3` and the Domain 2 mapping bind, and the asset acquires something it can be wrong about.

## 6.3 Living Asset or Environmental Dressing?

> **Whose object is it — and does a canonical owner hold a true fact that says it exists?**

The household's, with a binding → **Living Asset**, Life register, empty-house test binds.
The home's, with no binding → **Environmental Dressing**, Dressing register, `LIVINGHOME2` governs entirely.

The mechanical form is `LIVINGHOME2` § 4.3's, cited: **a data binding present → Life; no binding → Dressing or House.** Neither may migrate silently; reclassification is an admission event; a `binding` field on a dressing item is a build failure. See § 5.5 for the full table, `VR4` (one subject, two assets) and `VR5` (placement exclusions bind here too).

## 6.4 Interaction Asset or Motion?

> **Could you photograph it?**

Yes — it is a state that exists at rest → **Interaction Asset** (this registry).
No — it exists only between two states → **Motion**, owned by `THA_UI_ARCHITECTURE.md`, not an asset and not in this registry.

Open is photographable. Closed is photographable. *Opening* is not. This test is why the register schema needs no motion field to keep motion out of it — motion cannot satisfy the entry condition.

---

# 7. THE PRODUCTION LIFECYCLE

## 7.1 The five stages

**Concept → Candidate → Approved → Production → Deprecated.**

| Stage | What is true | What exists | Who acts |
|---|---|---|---|
| **Concept** | A design intention, or a specification with no file yet | Concept artwork, a `LARDER7`-style board, or a specification entry. **Never a production path** | Creative Director · the specification owner |
| **Candidate** | A real file exists and is byte-locked to a checksum | The file, its register row, its checksum. **Unavailable to the product** | Whoever produced it |
| **Approved** | The Home Owner has approved **these exact bytes** | The recorded approval, bound to the checksum it approved | **Home Owner, and no one else** |
| **Production** | The asset is consumable by its one mouth | Availability, derived — never stored independently | Derived, not decided |
| **Deprecated** | The asset is out of the product forever | The archived file, its rejection or supersession record, its evidence | Whoever retires it, in the same change |

## 7.2 The mapping onto what is already live — **no new state is created**

`VR7` — **This document introduces no runtime state, no field, no module and no register.** The five names above are the *vocabulary* over states that already exist and already execute. Where the vocabulary and the live states do not line up exactly, that is stated rather than smoothed over:

| Registry stage | Live state today | Where it lives |
|---|---|---|
| **Concept** | `approvalStatus: "planned"` — specified, no file, `checksum: null` | `living-details-manifest.ts`; concept artwork lives outside every register, by design |
| **Candidate** | `approvalStatus: "candidate"` + a real `checksum` | `promoteJarToCandidate()` — throws unless the record is `planned` and a real checksum is supplied |
| **Approved** | `approvalStatus: "approved"` + `visualApproval` whose `approvedChecksum` equals the file's | `recordJarHomeOwnerApproval()` |
| **Production** | `availabilityState: "available"` — **derived, never stored as an independent fact** | `deriveJarAvailability()`; the verifier fails any drift between derivation and record |
| **Deprecated** | `"superseded"` · `"invalidated-by-checksum-drift"` · a `rejectionHistory` entry | `applyJarChecksumDrift()`; predecessors archived under `docs/reference-assets/rejected/living-larder/` |

**The one place the vocabulary is wider than the live states:** `planned` is a register row for a specified asset with no file. It sits *inside* Concept, and it is the only Concept-stage thing any register holds — deliberately, so a specified-but-unbuilt asset is **visible rather than forgotten**. Concept *artwork* is never a register row at any stage (§ 7.3).

**The lifecycle is not theoretical.** It is holding **20 of 27** Larder jar masters at Candidate today, unavailable and unreferenceable, because no checksum-bound approval exists for them. Seven are approved and in production. The Home Owner's approval is the only thing that moves an asset across that line.

## 7.3 The four clarifications the mission requires

- **`VR8` — Concept artwork is never a production asset.** A concept board, a mood image, a North Star reference and a design investigation's illustrations are **reference for a decision** and may never be admitted, checksummed, referenced by a mouth, or shipped. The live case is on record: `LARDER7`'s recommended next action is *five concept boards* explicitly qualified — *a board is a decision aid, never an admitted asset*. The approved Pantry North Star imagery is the same class: it *guides feeling and composition and is explicitly not a wireframe* (`LARDER5` § 17).
- **`VR9` — Generated imagery is reference only until it enters governance unchanged.** An externally produced artefact — from an image model or any other external capability — **enters through the existing asset governance entirely unchanged**: `ASSET1`'s specification, `LHDC1`'s admission standard, the candidate → checksum → recorded-approval lifecycle, and the Home Owner's final approval all apply in full. Naming an external producer states *who can make the file*; it is never a route around a gate (`CAPABILITY_BOUNDARY_ASSESSMENT.md` `CB9`, cited). Generated imagery that has not completed that path is Concept, whatever its quality.
- **`VR10` — Production requires explicit, recorded, checksum-bound approval.** An unrecorded approval is not an approval (`HOMEOWNER1`), and a checksum-free approval is an approval of nothing in particular. Approval attaches to **bytes**, not to an idea of an asset: if the file changes, the approval is invalidated and availability is withdrawn while the history is preserved. This is live behaviour, not aspiration.
- **`VR11` — Rooms consume registry assets; they never own copies.** One object, one file, one owner, imported only by the one mouth. No page, card or surface may import an asset directly, and the verifier fails the build if one does. A room that ships its own visual language is a defect regardless of its quality (`UIA` § 17, cited).

## 7.4 Deprecation is a change, not a deletion

An asset leaves production the way `ARCHITECTURE_PRINCIPLES.md` Principle 8 requires: the successor **names what it replaces in the same document**, states the retirement condition, and the predecessor is archived with its rejection record in the **same change**. Nine predecessors are archived today under `docs/reference-assets/rejected/living-larder/` with rejection records and no client reference — retire-on-introduction, already executing.

---

# 8. HOUSE-WIDE REUSE, NAMING AND APPROVAL

## 8.1 Reuse

- **`VR12` — Reuse is across rooms, never across registers.** One asset serves every room that needs it (`EXP3` § 6: objects are fact-shaped, not room-shaped). One asset **never** serves two registers — see `VR4`, and the forgery it prevents.
- A variant is a member of one family under one id family, never a sibling id.
- An asset with no consumer fails the gate by design: authoring a foundation and adopting it "later" is the exact failure `UIA` § 17 exists to end.

## 8.2 Naming

The canonical form, house-wide:

```
id        <scope>-<domain>-<subject>[-<qualifier>…]        e.g. larder-joinery-cupboard-oak-double
state id  <object-id>--<state>                              e.g. larder-joinery-cupboard-oak-double--open
filename  tha-<id>.<ext>                                    e.g. tha-larder-joinery-cupboard-oak-double.png
family    <family>-<variant>  under one id family           e.g. orchard-1920.webp
```

**`VR13` — This rule binds new assets. Existing registered assets are not renamed.** Three id conventions are live today (`tha-larder-jar-<family>` with the prefix in the id; `larder-joinery-…` without it; `standing-welcome-bowl-of-apples` with no scope) because no rule ever spanned the three registers. Retrofitting them would rewrite every checksum and every approval binding, invalidating recorded Home Owner approvals to gain a household exactly nothing. **A rename is a checksum event.** The divergence is recorded at § 12.3 as a known inconsistency, deliberately not corrected.

## 8.3 Approval

One authority, one instrument, no exceptions:

- **Final aesthetic approval is the Home Owner's** (`HOMEOWNER1`) — exercised **through** the governing documents, never around them. A decision that contradicts a governing rule is an amendment proposal to that rule's owner, never an exception.
- **Refusal needs no rule.** *It does not belong in this house* is a complete verdict. **Approval can never pass what a gate fails.**
- The approval binds a checksum, is recorded where the canon already records decisions, and is invalidated by drift.
- Every object admission also passes **`LHDC1`** in full, one at a time, with the with-and-without review — this registry adds not one criterion to `LHDC1` § 19's rejection criteria or § 21's evidence list.

---

# 9. HOW FUTURE ROOMS COMPOSE FROM THE REGISTRY

> **`VR14` — A room composes from the registry. It never creates a visual language.**

The Living Home is **one house, many places** (Blueprint): each domain is a room differentiated by purpose, light, material and one sign of life — *never by its own architecture, palette or theme*. A room that arrives with its own visual vocabulary has not been added to the house; it has been built next to it.

**What a new room does, in order:**

1. **Read its North Star** — what this room must become, and which canonical owner every fact renders from (`UIOWN1`).
2. **Take layers 0–3 from the shell** — canvas, light, orchard, framing, ground plane. It authors none of them. Its exposure is a governed constant it consumes.
3. **Spend its one Living Detail** — one per room, data-borne or dead, honest in absence, below the emphasis budget, still, admitted one at a time (Blueprint § 12.1). Most rooms have already spent theirs; the Orchard/Community room is the only room with a free slot.
4. **Compose from the six domains** — requesting existing assets by id. Where nothing exists, it specifies a new asset in the domain that owns it and takes it through the lifecycle. **It does not draw one locally.**
5. **Pass its own gates** — the Experience Constitution Check before design, then the full stack at admission.

**What a new room may not do:**

- Author a wall, a floor, a light or an orchard (§ 5.1; `EXP3` layers 0–3 are the shell's).
- Assume `LARDER5`'s `RC1`–`RC12` apply to it. They are **transferable, not inherited** — a room takes them through **its own North Star and its own gates**, deliberately, or it does not take them.
- Assume it may have furniture. `EXP3` Verdict 2 stands: *there is no furniture layer*, and the Larder is a room built as a room under `LARDER5`, not a precedent that travels by itself.
- Ship a second composition mouth, a second register, or a local copy of any asset.

**The specific rooms, as they stand today** — each cited to the owner that already decided it, so no future room re-asks:

| Room | Exposure | What it may compose | Note |
|---|---|---|---|
| **Home** | E3 (own window) | Layers 0–3 and its greeting | Home's sill stays architecture; a composition there was **refused** — trading the signature welcome for objects would be the worst swap in the house |
| **Larder / Pantry** | E2 | All six domains — the only room today with furniture and containers | Its own canon (`LARDER1`–`LARDER5`, `ASSET1`) governs; `LARDER7`'s concepts are unruled |
| **Cookbook** | E2 | Layers 0–3; the open-book detail is the **designated pilot** for the first Life composition | Retires *the well-thumbed page* in the same decision |
| **Planner · Shopping · Analyser · Household** | E1 | Layers 0–3 only | No composition, by `EXP3` § 5.1 — an object on a light wash is clutter, not life. **Zero environment bytes** is a shipped invariant |
| **Community / Orchard** | E2 | Layers 0–3; **the one free Living Detail slot** in the house | Its data owner must be settled first |
| **Companion** | presence | Nothing — **not a room** | The friend at the counter; a presence, not a place |
| **Admin** | E0 | **Nothing, ever** | Shuttered (`GEA6`) |

**The economics, stated honestly:** a room that composes from the registry adds **no new asset in the common case**. That is the registry's whole return — and it is also why the registry cannot be judged by how many assets it produces. `EXP3` said it first and it stays true: the value is *the governed path and the reuse machinery, not a wave of new charm* — a wave the law would refuse anyway.

---

# 10. THE RULES

| Rule | Statement |
|---|---|
| **`VR1`** | Every visual asset carries exactly one register (variance) and exactly one domain (kind). Neither may be inferred from, or stated by, the other's owner |
| **`VR2`** | An architectural asset is admitted as a **file** only after the house's own hand (CSS/tokens) has been shown insufficient, and the admission states why |
| **`VR3`** | An ingredient presentation asset **depicts; it never states**. Food identity, nutrition, allergens and freshness stay with their owners |
| **`VR4`** | One subject may exist in two domains, and it is **two assets, never one file used twice**. Reuse never crosses a register |
| **`VR5`** | `LIVINGHOME2`'s placement exclusions bind the kind axis: a Living Asset may be lawful in a room where a Dressing item of the same subject is not |
| **`VR6`** | A **content** interaction state binds to a canonical owner or it does not exist; an **input** interaction state may never bind to one |
| **`VR7`** | This document introduces **no runtime state, field, module or register**. The lifecycle is vocabulary over states that already execute |
| **`VR8`** | **Concept artwork is never a production asset** — never admitted, checksummed, referenced by a mouth, or shipped |
| **`VR9`** | **Generated imagery is reference only** until it has passed the existing governance entirely unchanged (`CB9`) |
| **`VR10`** | Production requires **explicit, recorded, checksum-bound** Home Owner approval. Approval attaches to bytes; drift invalidates it |
| **`VR11`** | **Rooms consume registry assets; they never own copies.** One object, one file, one owner, one mouth |
| **`VR12`** | Reuse is **across rooms, never across registers** |
| **`VR13`** | The naming rule binds **new** assets. Existing registered assets are not renamed — a rename is a checksum event |
| **`VR14`** | **A room composes from the registry. It never creates a visual language** |

---

# 11. RELATIONSHIP TO EXISTING ARCHITECTURE

## 11.1 Position

- **Subordinate to** `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (the Experience Constitution) and, through it, `THA_EXPERIENCE_ARCHITECTURE.md`, which prevails in any conflict.
- **A non-overriding sibling of** `THA_UI_ARCHITECTURE.md` (the binding look), `THA_EXPERIENCE_LANGUAGE.md` (the feeling), `THA_EXPERIENCE_BLUEPRINT.md` (the vision and the place) and `LIVING_HOME_DESIGN_CONSTITUTION.md` (the object admission standard). It owns its own question — *what kind of thing is this asset, who owns it, and what stage is it at?* — and never theirs.
- **Above no one.** It commands no room's North Star and amends no specification.
- **On any question of rule, the rule's owner prevails and this document is corrected.**

## 11.2 `ASSET1` — extended, never replaced

This is the relationship the mission asks about most directly, and it is stated precisely:

- `ASSET1` remains the **canonical specification owner** for every Larder object it specifies, across all twenty-one dimensions. **Not one dimension is added, removed, changed or moved.** Its Specification Frame, Feeling Standard, Canonical Style and category structure are byte-untouched.
- This registry adds the axis `ASSET1` never held: **which domain an object belongs to, house-wide, and who is accountable for it beyond the Larder.**
- `ASSET1`'s § *How This Library Is Used* item 5 — the sentence that made a Larder-subordinate document the specification owner for every future room (§ 2.3) — is **not amended here**. It is recorded at § 12.2 as an open item for its own owner, with the recommendation that future rooms' specifications be filed at their own room's scope under the same twenty-one-dimension frame, and that `ASSET1` remain what its own header says it is: *the Living Larder* asset specification library.
- **Nothing in `ASSET1` is retired by this document.** Principle 8 requires that a replacement name what it replaces; this registry replaces nothing, so it names nothing.

## 11.3 `EXP3` — governed, never overridden

`EXP3_LIVING_HOME_ASSET_SYSTEM.md` is **implementation architecture** and states plainly that it *creates no rule*. This registry is the governing document that its register shapes now serve, and the direction of authority is `GEA20`'s: **downward only.** This registry states the domains and the lifecycle vocabulary; `EXP3` and the modules beneath it own the *shapes* — the register files, the manifest schema, the verifier checks, the layers, the pipeline. **If any shape here and any shape there disagree, the shape's owner is `EXP3` and this document is corrected**, because a classification is law and a file format is not.

## 11.4 `LHDC1` and `HOMEOWNER1`

`LHDC1` owns *what an admitted object must look and feel like*; this registry owns *what kind of object it is and where it is in its life*. The two never touch: an asset passes `LHDC1` and is classified here, and neither result implies the other. Final aesthetic approval is `HOMEOWNER1`'s in every domain, without exception, and this registry can never authorise anything.

## 11.5 `CRAFT1`

The Completion Rule is answered at § 2 with evidence and admitted on it. This registry is written in `CRAFT1`'s own method — *architecture-first; existing implementation is reference material, never design authority* — and its § 2.4 current-state survey is deliberately a **reading of what is true**, never a ratification of it: nothing was classified the way it is merely because that is how it was built.

---

# 12. INHERITED OPEN ITEMS — surfaced, not resolved

Each item below is real, is not this document's to decide, and is recorded so the next reader does not rediscover it.

**12.1 `ASSET1` H1 · H2 · H8 · I7 versus `LARDER5` and `LIVINGHOME2`** (§ 2.1). Two governing owners in true contradiction, recorded by `LARDER7` § 3.3 and unamended at either owner. **Routed:** the rule question to `ASSET1`'s and `LARDER5`'s owners; the aesthetic question to the Home Owner. **This registry's only act** is to record that **no production asset may be commissioned for any of the four while the contradiction stands** — which follows from `VR10` without deciding anything.

**12.2 `ASSET1`'s house-wide scope claim** (§ 2.3, § 11.2). Recommendation recorded; the amendment belongs to `ASSET1`'s owner and is not made here.

**12.3 Three live id conventions across three registers** (§ 8.2). Recorded as a known inconsistency, deliberately not corrected — a rename would invalidate recorded Home Owner approvals to gain a household nothing (`VR13`).

**12.4 Herbs and household plants have no canonical owner** (§ 5.5). Until one exists, a herb asset has no lawful binding and therefore no lawful entry. This registry declares the need and **does not mint the domain** — that belongs to a document whose subject it is (`TIME3` precedent).

**12.5 The two-orchard convergence** (§ 5.1). Inherited from `LIVINGHOME1` § 10.2 and `EXP1` § 8.2, still open, still the highest-value asset task in the house. No deadline is added and no side is taken; no third sibling may exist before it.

**12.6 `LARDER7`'s five concepts are unruled** (§ 5.2, § 5.3, § 5.6). Cold storage, the vessel family and every interaction state are downstream of an aesthetic decision that is the Home Owner's. Producing them first would produce the wrong ones.

**12.7 `EXP3` Verdict 3 — illustration as medium.** Still the owner's, still defaulting to existing media, still gated on a recorded approval at the first admission that uses the illustrated track. This registry is lawful under either answer and adds no position, exactly as `EXP3` and `LHDC1` before it.

---

# 13. WHAT THIS DOCUMENT DOES NOT DO

- It **creates no production asset**, commissions none, and approves none.
- It **redesigns no room** and rules on none of `LARDER7`'s concepts.
- It **modifies no React, no CSS, no component, no runtime code, no schema, no migration, no token, no string, no route, no capability**.
- It **moves no register, no record and no module.** The jar and produce records stay at their one owner precisely so that no second owner comes into existence.
- It **amends no governing document.** Every owner named in § 1.3 is byte-untouched.
- It **resolves no open item** at § 12, and takes no side on any of them.
- It **adds no gate.** The Experience Constitution Check, the UX/UI Governance Checklists, the Experience Review Questions, the Blueprint Checks, the Design Character Check, the Adoption Register, the Product Registry and the Capability Boundary Assessment all bind exactly as their owners state.
- It **adds no automated check** — a disclosed enforcement gap in the Rule `KC8` sense, named on the day the standard is created rather than months after it starts costing something. A verifier could assert that every asset carries a domain; it could not assert the domain is the right one. The existing `verify:living-home-assets` continues to enforce everything it already enforces, unchanged.
- **No runtime code reads it**, and none may.

---

# 14. COMPLIANCE

Full compliance blocks — including the Definition of Done, Data Impact, Trust Check, Rollback Plan, Scope Lock, Manual Verification, User Acceptance Evidence and the Implementation Completion Report — are filed with the implementation report: `docs/implementation/house/LIVING_HOME_VISUAL_REGISTRY_IMPLEMENTATION.md`.

### Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity
  One asset entity, one id, one domain, one register, one file (VR1, VR11, VR12).
  The id conventions already live are recorded as divergent and deliberately not
  retrofitted (VR13) — a rename is a checksum event that would invalidate
  recorded approvals.

☑ One owner per fact
  Every fact cited to its owner (§ 1.3). This document owns exactly three things
  (§ 1.2). The two axes pass the scope test: variance and kind cannot disagree
  because they answer different questions (§ 3.1).

☑ No duplicate entities
  Nothing created. No asset, register, module, record, schema or state is added.
  VR4's "one subject, two assets" is not duplication — it is the register
  boundary made unforgeable, and its alternative is LIVINGHOME2 § 9.10's forgery.

☑ No duplicate ownership
  ASSET1 keeps every specification; LHDC1 keeps the admission standard;
  LIVINGHOME2 keeps ED1–ED12 and the classification test (cited, never restated);
  EXP3 keeps the register shapes; HOMEOWNER1 keeps approval; UIA keeps tokens,
  motion and admission. This document takes nothing from any of them.

☑ No duplicate state
  No state exists to duplicate. VR7: no runtime state, field, module or register
  is introduced; the lifecycle is vocabulary over states that already execute
  (planned → candidate → approved; availability derived, never stored).

☑ Extends existing architecture
  Extends EXP3's variance axis with an orthogonal kind axis; extends ASSET1's
  Larder specification frame to a house-wide ownership map without amending it;
  follows UIOWN1's assembly-document shape exactly.

☑ Progressive enrichment where appropriate
  The lifecycle IS the enrichment chain: identity → specification → candidate
  bytes → recorded approval → production. Each stage renders honestly at the
  stage reached; a candidate is visible in the register and absent from the
  product (20 of 27 jars, today).

☑ Knowledge domain compliance
  N/A — no knowledge domain is introduced or extended. VR3 is the explicit
  refusal to become one: an ingredient presentation asset depicts and never
  states; food identity stays Domain 2's and nutrition Domain 1's.

☑ Honest gaps over fabricated information
  Absence renders as absence (§ 4). Herbs have no owner and therefore no lawful
  asset, stated plainly (§ 12.4). VISUAL_GAP_GREEN — one colour, one meaning,
  "approved visual representation missing" — is cited as the existing instrument,
  not reinvented. Every open item at § 12 is recorded unresolved rather than
  papered over.

☑ No permanent synchronisation bridge
  None. Nothing here keeps two owners in sync; the two axes are independent and
  neither derives the other. Checksums are CI-time verification, not sync.

☑ Evolution over replacement
  Nothing is replaced, so nothing needs a retirement plan (Principle 8 satisfied
  vacuously and stated as such). § 7.4 restates the retire-on-introduction
  discipline for assets by citing it, and names the nine predecessors already
  archived under it.
```

### AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
No AI surface, capability, intent, prompt, Context View or Companion behaviour is
created, consumed, altered or designed here. No capability is registered and none
is invoked. This document is not read by any runtime code and therefore cannot
reach a model as grounding; it composes no Context View (INT17 keeps ownership of
every byte the model reads) and adds no knowledge a Companion could speak.

✓ Uses the canonical Intelligence Platform ......... N/A — no AI surface touched
✓ Uses the Capability Registry ..................... N/A — none registered
✓ Uses the Intent Engine ........................... N/A — no intent
✓ Reuses existing business services ................ N/A — no service touched
✓ Does not create another assistant ................ CONFIRMED — none created
✓ Does not duplicate conversation state ............ CONFIRMED — none touched
✓ Uses registered capabilities only ................ N/A — none consumed
✓ Uses permission-aware access ..................... N/A — no access path
✓ Produces honest gaps rather than fabricated knowledge
    CONFIRMED — § 4 and § 12; a visual asset observes the way a window observes
    (GEA21), and this document gives no image a voice.
```

### Experience & UI Governance Compliance

- **Experience Constitution Check** — § 0, answered in full **before design began**. ✅
- **Governance-only change; no pixel ships.** The per-implementation stack (UX Governance Checklist, UI Governance Checklist, Experience Review Questions, Experience Test, Blueprint Checks, Design Character Check) is **not claimed here** and binds each future admission at its own gate — the only honest place a checklist about shipped pixels can pass. This is `EXP3`'s recorded position and is followed rather than restated.
- **Conflicts found during drafting were resolved in the governing architecture's favour and recorded**, not legislated: the four `ASSET1` entries (§ 12.1), the `ASSET1` scope claim (§ 12.2), the id divergence (§ 12.3), the herb-owner gap (§ 12.4). None is amended here.
- **`UIA` § 17 (one owner per visual concern, retire on introduction, admission with register entry)** binds unchanged and is the mechanism `VR11` and `VR12` cite rather than duplicate.

---

*This registry creates no artwork, no code, no component, no register and no rule that any owner already holds. It creates one map — of what kind each thing in the house is, who is accountable for it, and where it stands in its life — so that a decade of rooms is furnished from one house's things rather than each room's own.*

---

**Document status: GOVERNING — classification and lifecycle only. Nothing built, nothing approved, nothing produced.**

*Rollback identifier: `rollback/VISREG1-living-home-visual-registry-20260725` → `ec2014d7`*
*Author of record: Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow*
*Classification: Experience Governance — the visual asset ownership map*
*Date: 2026-07-25*
*Document ID: `VISREG1`*
