# ED2 — Environmental Dressing Runtime

| Field | Value |
|---|---|
| **Implementation ID** | `ED2` (Environmental Dressing Runtime) |
| **Date** | 2026-07-22 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback ID** | `rollback/ED2-environmental-dressing-runtime-20260722` → `88cf6277` (annotated tag, created **before any change**; covers committed state only — the working tree held one uncommitted `.engineering/session/CURRENT.md` heartbeat, not covered) |
| **Kind** | **Runtime architecture / tooling only** (`LIVINGHOME2` § 10.4 Phase 2). The canonical Environmental Dressing runtime — register, loader, resolvers, renderer interface + shell, placement validation, admission hook, verifier integration — built to the `ED1` § 5–§ 7 contract. **The register is EMPTY. The renderer produces no visible output. No dressing appears anywhere.** |
| **Governing parent** | `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (`LIVINGHOME2`) — ED1–ED12, the § 4.3 classification test, the § 5.1 placement law, the § 7.2 celebration gate, and the § 10.3 register requirements. Cited, never restated. |
| **Governing grandparents** | `docs/implementation/house/ED1_ENVIRONMENTAL_DRESSING_FOUNDATION.md` (the § 5–§ 7 contract this builds; the four § 10.2 amendments) · `docs/implementation/house/EXP3_PHASE2_LIVING_HOME_ASSET_REGISTER.md` (the base House/Life register + verifier this extends; the `dressingChecks()` seam) · `EXP3_LIVING_HOME_ASSET_SYSTEM.md` (§ 7.4 the verifier, § 4.4 the checksum manner) · `HOME_OWNER_ARCHITECTURE.md` (the approval authority for every future item) · `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (HT13/HT14/HT17 — the season input, no scheduler) · `THA_UI_ARCHITECTURE.md` § 17 (retire-on-introduction; the mouth lands with its consumer) |

---

## 0 · What this implementation is, and what it is not

**Objective.** Build the canonical **Environmental Dressing Runtime** — the machinery of the third register (`LIVINGHOME2` § 0's middle row) — as code: **one register, one loader, one placement resolver, one runtime resolver, one renderer interface + shell, one placement-validation path, one admission hook, and the verifier's third-register checks.** It does this with the register **empty**, the renderer producing **no output**, and **not one byte of visible dressing** anywhere in the product.

**What it is.** This is `LIVINGHOME2` Phase 2 — *"the register + verifier extension per § 10.3, empty; tooling only; no visual change"* — realised as the runtime `ED1` § 4–§ 7 specified as DECLARED-NOT-BUILT. The forbidden things (a data binding, text, a count, a door, motion, an hour, a channel, a household id) are **inexpressible by type** and refused a second time at read time, so the empty shape into which a future item might one day be admitted cannot hold a claim.

**What it is not.** It is **not** the first dressing item, and **not** the DOM mouth. It builds no asset, admits no bowl of apples, mounts no React component into the app tree, and changes no room. The register ships **zero items** and resolves and renders to **nothing** in every room and every season — proven in CI.

### 0.1 Both Phase-2 gates were cleared before this work

`LIVINGHOME2` § 10.4 gates Phase 2 behind (a) the four § 10.2 owner amendments **and** (b) `EXP3` Phase 2 (base House/Life register + `verify:living-home-assets`). Both are landed and confirmed in the repository before this session began:

- `ED1` (`a9440761`) landed all four § 10.2 amendments in their owners' files (governance only).
- `EXP3 Phase 2` (`be7b8301`) shipped the House Register, the empty Life manifest, and `verify:living-home-assets` **with an intentionally-empty `dressingChecks()` extension seam** — and its own recommendation names *"ED2 — Environmental Dressing Register (empty register only)"* as now lawful to build.

ED2 fills exactly that seam. Nothing here re-opens or re-litigates a gate; the empty register is the whole and only scope.

### 0.2 One recorded decision — the visible mouth is DECLARED, not built here

`ED1` § 3 named two future locations: the register + resolver at `client/src/lib/living-home/dressing-register.ts`, and the DOM mouth at `client/src/components/layout/dressing-layer.tsx`. This implementation builds the **first** and deliberately **not** the second, for the reason `EXP3` Phase 2 declined to build the Life mouth (`living-details.tsx`): **EXP3 § 7.1 / UIA § 17 — an authored-but-unadopted mount is the exact failure those laws exist to end; the mouth lands with its first consumer.** ED2's renderer is therefore a **pure interface + shell** (a `DressingRenderPlan` producer that yields an empty plan), not a mounted component. The DOM-painting mouth lands with the first admitted item at **ED3 (the Standing Welcome)**. The pure runtime module is recorded as a known, owned, pending-adoption orphan in the Adoption Register — the sanctioned path (UIA § 17), and the exact `living-details-manifest.ts` precedent.

---

## 1 · The three-register model (cited, not restated)

`LIVINGHOME2` § 0 fixes the model this runtime serves. ED2 is the machinery of the **middle row, and only the middle row** — it never touches the House's bytes and never reads the household's data.

| Layer | One-line law | Owner |
|---|---|---|
| **House** | *Never changes.* | House Register (`docs/implementation/assets/house-asset-register.json`) |
| **Environmental Dressing** | *The home quietly lives.* | **The Dressing Register (this runtime)** |
| **Household Life** | *The household's true data.* | Life Register (`living-details-manifest.ts`) |

---

## 2 · What was implemented — the runtime, in one module + one verifier extension

All runtime code lives in **one pure module**, `client/src/lib/living-home/dressing-register.ts` (the `ED1` § 3 canonical location), imported only by the verifier. The single new client-tree artefact; no React, no asset, no DOM.

| # | Deliverable | Where | Shape |
|---|---|---|---|
| 1 | **Environmental Dressing Register** | `dressing-register.ts` § 3 | `dressingRegister: DressingRegistry = { items: [], checksum }` — **empty**, immutable, keyed only by season. |
| 2 | **Register loader** | § 4 `loadDressingRegister()` | The one door onto the register; returns a **frozen** view (the runtime cannot mutate what turns only between reviewed states — ED6). |
| 3 | **Placement resolver** | § 5 `resolvePlacement()` + `isPlacementRefused()` | Filters out items refused in a room by their `refusedRooms` (§ 5.1). |
| 4 | **Runtime resolver** | § 6 `resolveDressing()` | Pure, clock-free: an item is present iff season matches ∧ room not refused ∧ (celebration ⇒ occasion permitted). Fail-closed. |
| 5 | **Renderer interface** | § 7 `RendererRef`, `DressingRenderDescriptor`, `DressingRenderPlan` | Still image + declared strength + committed region. **No field for text, motion, or interaction.** |
| 6 | **Renderer shell** | § 7 `toRenderPlan()` | Maps resolved items → a plan of decorative still descriptors. For the empty register → **empty plan (no output)**. |
| 7 | **Placement validation** | § 8 `validatePlacement()` + `PLACEMENT_EXCLUSIONS` | Encodes the § 5.1 room-subject law (no produce in Pantry/Larder, no book in Cookbook, no meal in Planner) and checks an item's declared placement against it. |
| 8 | **Admission hook** | § 8 `assertAdmissible()` + `FORBIDDEN_DRESSING_KEYS` | The ED10 admission guard: requires id, admission doc, named ED8 purpose, valid Domain-11 season, fail-closed celebration gating, and **refuses every forbidden field** at read time. |
| 9 | **Checksum integration** | § 3 `canonicalizeItems()` + `DRESSING_REGISTER_CHECKSUM` | One canonicalisation, hashed once; the verifier recomputes and compares (the EXP3 § 4.4 manner, `sha256("[]")` for the empty register). |
| 10 | **Verifier integration** | `scripts/ci/verify-living-home-assets.ts` `dressingChecks()` | The declared seam, now filled with six third-register checks (§ 3 below), run inside `npm run verify:living-home-assets`. |

### 2.1 The forbidden things are inexpressible, then refused again

A `DressingItem` (§ 2, `dressing-register.ts`) has **no field** for a `binding`, `text`/`copy`, `count`/`status`, `href`/`onClick`, `motion`/`animation`, `hourKey`/`time`, `campaignId`/`event`, or `householdId`/`segment` (`ED1` § 5). Because JSON has no types, `FORBIDDEN_DRESSING_KEYS` refuses each a **second** time at read time — `assertAdmissible()` and the verifier scan the serialised register and fail on any hit. A `binding` here is the § 9.10 **forgery** (a binding is precisely what defines the *Life* register); the rest carry information, interaction, an hour, a channel, or a household — none of which dressing may hold. Demonstrated live (§ Manual Verification, steps 5–6): a crafted item carrying a `binding` and one carrying `text` are each refused.

---

## 3 · Verifier integration — the six third-register checks (`dressingChecks()`)

The seam `ED1` § 2 Amendment 4 / `EXP3` § 7.4 declared is now built. Each check is a **real gate** the moment ED3 admits the first item; several hold **vacuously** while the register is empty, and are labelled honestly as such.

| Check | What it proves | Empty-register outcome |
|---|---|---|
| **D1 — loads & checksum matches** | The register loads; `sha256(canonicalizeItems(items))` equals the declared checksum (EXP3 § 4.4). A future item change must recompute the checksum in the same commit. | PASS — `sha256("[]")` matches. |
| **D2 — no forbidden field reachable** | No `binding`, text, count, door, motion, hour, campaign, or household id anywhere in the serialised register (claim-free by construction, ED1 § 5). | PASS — vacuously true, and the check is live for any future item. |
| **D3 — admissible & celebration-gated** | Every item passes `assertAdmissible()` (named purpose, admission doc, valid season) and every celebration item is fail-closed on the § 7.2 permission. | PASS — vacuous. |
| **D4 — placement exclusions enforced (§ 5.1)** | `PLACEMENT_EXCLUSIONS` still encodes the pantry/cookbook/planner room-subject law, and every item's declared placement is lawful. | PASS — the law is encoded; no item to check. |
| **D5 — admission docs exist** | Every item's `admissionDocId` resolves to a file on disk (ED10 — no anonymous charm). | PASS — vacuous. |
| **D6 — empty resolves & renders to nothing** | `resolveDressing()` returns `[]` and `toRenderPlan()` yields 0 descriptors across 5 seasons × 5 rooms — **the runtime guarantee, run in CI.** | PASS — 0 resolved, 0 rendered. |
| **D7 — one mouth** | Only the (future, declared) `dressing-layer.tsx` may import the dressing asset dir; the dir is unbuilt, so any importer fails. | PASS — no importer. |

The existing five Life/House checks are unchanged in intent; one crude substring match (Check 4, the Life "one mouth" test) was tightened to match **quoted import/url references** rather than any mention, so a sibling module that names the asset dir in a comment is not a false positive. This is strictly **more precise** — it still catches every real import.

---

## 4 · The runtime has one of each (task item 7)

- **One owner** — the Dressing Register runtime is one module (`dressing-register.ts`); the law is `LIVINGHOME2`'s; the future items' approval is the Home Owner's (`HOMEOWNER1`). ✔
- **One register** — `dressingRegister`, a single immutable collection; no rival, no second store. ✔
- **One renderer** — one interface (`RendererRef`/`DressingRenderDescriptor`/`DressingRenderPlan`) and one shell (`toRenderPlan()`); the one DOM mouth is declared for ED3. ✔
- **One resolver** — one placement resolver (`resolvePlacement`) composed inside one runtime resolver (`resolveDressing`); no duplicated selection logic. ✔
- **One verification path** — `dressingChecks()` inside the single `verify:living-home-assets` gate; no second verifier. ✔

Season logic is **not** forked: the runtime holds no calendar or clock — it consumes the Domain-11 season key and matches on it (HT17). There is one season implementation in THA and this runtime is not a second (§ 6, `dressing-register.ts`).

---

## 5 · The register loads, resolves, and renders — to nothing (task item 8)

Demonstrated live (§ Manual Verification) and locked in CI by check D6:

- **Contains zero admitted items** — `loadDressingRegister().items.length === 0`.
- **Loads successfully** — returns a frozen registry; checksum matches (D1).
- **Resolves successfully** — `resolveDressing({room, season})` returns `[]` for all 25 room×season combinations (D6).
- **Renders successfully** — `toRenderPlan([])` returns `{ descriptors: [] }`; the renderer runs and paints nothing (D6).
- **Produces no visible output** — nothing imports the runtime in the client tree; the build bundle is unchanged; no room renders a dressing byte.

---

## 6 · Runtime guarantees validated (task item 10)

Each guarantee is enforced structurally (by the type) and again at read time (by `assertAdmissible`/`dressingChecks`):

| Guarantee | How it is guaranteed |
|---|---|
| **No household data binding possible** | No `binding` field on `DressingItem`; `FORBIDDEN_DRESSING_KEYS` refuses one at read time (the § 9.10 forgery). Demonstrated: a binding-carrying item is refused. |
| **No text rendering possible** | No `text`/`copy`/`label` field; refused at read time; the renderer descriptor has no text field. Demonstrated: a text-carrying item is refused. |
| **No interaction possible** | No `href`/`onClick` field; the renderer descriptor is `decorative: true` (aria-hidden, pointer-events-none at the mouth, ED7). |
| **No animation support** | No `motion`/`animation`/`transition` field; the renderer paints still images only. |
| **No time-of-day support** | The only axis is `SeasonKey` (Domain-11 vocabulary); no `hourKey`/`time`/`clock` field; the resolver is clock-free (HT13/HT14). |
| **No campaign support** | No `campaignId`/`event` field; refused at read time (ED11 — dressing is never a channel). |
| **No personalisation** | No `householdId`/`segment`/`variant`/`experiment` field; the resolver takes no household data; non-celebration dressing is identical for everyone (ED1). |
| **No runtime ownership duplication** | One register, one loader, one resolver, one renderer, one verification path (§ 4); season stays Domain 11's; occasions stay the household's. |

---

## 7 · What was NOT implemented (task item 11; `LIVINGHOME2` § 6, refused not deferred)

**Not one is created, drawn, registered, or rendered:** bowls · flowers · pumpkins · books · blankets · candles · fruit · seasonal assets · renderer output · visible dressing · room dressing · celebration dressing. The register is empty; the renderer yields an empty plan; the DOM mouth is unbuilt. The first *visible* item (the Standing Welcome) is **ED3**, a separately-gated act with its own rollback, admission brief, and Home Owner approval.

---

## Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — one home, one orchard, one Companion untouched; the
  Dressing runtime is one module, one register, one mouth (declared), one law.
☑ One owner per fact — season stays Domain 11's (HT17); occasions stay the
  household's (LH1); the register's items get exactly one owner (this runtime);
  the Home Owner holds each future item's approval (HOMEOWNER1).
☑ No duplicate entities — the register EXTENDS EXP3's register model as the third
  register EXP3/LIVINGHOME1 reserved space for; no rival store, schema, or verifier.
☑ No duplicate ownership — one register, one resolver, one renderer interface, one
  verification path; the § 5.1 placement law is encoded once and checked once.
☑ No duplicate state — the register is code + a CI checksum, not runtime state;
  the resolver is pure; presence resolves on read (HT14, no scheduler).
☑ Extends existing architecture — fills EXP3 Phase 2's declared dressingChecks()
  seam; adopts orchard-backdrop.tsx's decorative-declared manner for the renderer.
☑ Progressive enrichment — empty register default; renderer yields nothing; the
  DOM mouth and the first item are later, separately-gated acts.
☑ Knowledge domain compliance — no knowledge domain touched; Product Registry
  impact nil (no user-facing surface).
☑ Honest gaps over fabricated information — claim-free by type (ED3); the resolver
  never covers honest absence (ED1 § 4.1 invariant 6); empty renders nothing.
☑ No permanent synchronisation bridge — none; no scheduler; the celebration gate
  is a read-time, fail-closed permission check.
☑ Evolution over replacement — nothing retired; checksum recompute-in-same-commit
  makes a future item change a deliberate, reviewable act (EXP3 § 4.4).

Experience Constitution Check (before design):
  hospitality — the runtime's sole purpose is the home's future quiet welcome (ED8);
                it adds zero weight today (GEA2) — empty and invisible.
  outcome     — a governed home for warmth that cannot lie; no household carries anything.
  weight      — zero visible: pure logic + an empty register + a CI check.
  voice       — no room and no Companion gained a voice; dressing is beneath words (ED12).
  ownership   — nothing decides for the household; celebration is opt-in, fail-closed (GEA23).
  restraint   — the forbidden things are inexpressible by type, then refused again (GEA15).
  layer       — Experience Implementation (runtime/tooling); originates no law (GEA20).
```

## AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — not reached at all. No capability,
  intent, prompt, Context View, notice, or persona created, altered, or consumed.
✓ Capability Registry / Intent Engine / Behaviour Engine — untouched.
✓ Does not create another assistant — the runtime has no voice, no eyes, no memory
  (LIVINGHOME2 § 7.4).
✓ Companion ownership unchanged — dressing never enters a prompt, Context View,
  capability, notice, or story; the Companion never narrates it (ED12 — INT17's
  ownership of every byte the model reads is cited, untouched).
✓ Honest gaps over fabricated knowledge — a claim-free, empty runtime asserts
  nothing, so it has nothing to be wrong about (ED3).
```

## Definition of Done

- **Success looks like:** the Dressing Register runtime exists at `client/src/lib/living-home/dressing-register.ts` — register (empty) + loader + placement resolver + runtime resolver + renderer interface + shell + placement validation + admission hook + checksum — built to the `ED1` § 5–§ 7 contract with the forbidden fields structurally inexpressible; `dressingChecks()` in `verify:living-home-assets` verifies checksum, forbidden-field absence, admissibility, placement exclusions, admission-doc existence, and the empty-resolves-to-nothing guarantee; the register is **empty**, resolves and renders to **nothing**; typecheck holds at baseline with zero errors in the new files; build passes; adoption baseline unchanged (new module recorded as a passing known-orphan); rollback reported; committed.
- **What must not break:** nothing runtime — no route, component render, schema, or data path changes; nothing imports the runtime in the client tree, so no UI regression is possible. The House and Life registers, the orchard assets, every room, and the Companion are unchanged.
- **Manual test steps:** `npm run verify:living-home-assets` → PASS (12/12, incl. 6 dressing checks); `npm run typecheck` → 88 (baseline, 0 in new files); `npm run build` → exit 0; `npm run adoption:check` → 102 passed · 9 failed (pre-existing baseline; new module a passing known-orphan); runtime demo → 0 items resolved, 0 descriptors rendered, forbidden fields refused.
- **Product Registry impact:** none — no user-facing surface, page, route, or claim ships.

## Data Impact

- **Reads existing data:** NO household data. The runtime reads only the in-code register and the Domain-11 season key it is handed; the verifier reads files on disk at CI time.
- **Writes new data:** NO. The register is code + a CI checksum, not household data; no schema, migration, or store.
- **Changes meaning of existing data:** NO. The orchard assets and Life manifest are untouched.
- **Requires backfill:** NO — and the layer forbids inference by construction (ED2), so there is nothing a backfill could compute.
- **Special-category data:** none read, moved, or exposed. Celebration dressing (ED3+/Phase 5, not built) would render only inside the permitting household's experience, from declaration + explicit consent, fail-closed, and vanish with either in one act (LH7/LH11).

## Trust Check

- **Could this mislead the user?** No — there is no user-facing surface; nothing renders. The runtime's defining law is that it *cannot* make claims (ED3): a `DressingItem` carries zero information by type, and the one genuine mislead-risk (dressing read as household data) is closed three ways — the absent `binding` field, `FORBIDDEN_DRESSING_KEYS`, and the § 5.1 placement law.
- **Could this fabricate certainty?** No. The runtime asserts nothing; Life's honesty laws are untouched and outrank it; the resolver may never cover honest absence (ED1 § 4.1 invariant 6).
- **Is anything guessed but shown as real?** No. Nothing is inferred; the resolver is pure and clock-free; occasions are fail-closed on explicit permission.
- **Was any owned word or number changed?** No household-facing word or number. The only number added is `sha256("[]")`, the checksum of the empty register.
- **What happens if the system is wrong?** A CI failure caught before merge (a drifted checksum, a forbidden field, a non-empty resolve). For a future item: a wrong item traces to one registered state and one admission document, corrected in one place, having claimed nothing about anyone.
- **No trust surface, consent ledger, permission path, or conversation store touched.**

## Rollback Plan

- **Rollback identifier:** `rollback/ED2-environmental-dressing-runtime-20260722` → `88cf6277` (annotated tag, created **before any change**; the uncommitted `CURRENT.md` heartbeat is not covered).
- **Files modified:** `client/src/lib/living-home/dressing-register.ts` (new) · `scripts/ci/verify-living-home-assets.ts` (`dressingChecks()` + import + tightened Check 4) · `docs/implementation/ux/adoption-register.json` + generated `ADOPTION_REGISTER.md` (one known-orphan entry) · `docs/implementation/house/ED2_ENVIRONMENTAL_DRESSING_RUNTIME.md` (new) · `.engineering/session/CURRENT.md` + `.engineering/session/runs/ED2_Environmental_Dressing_Runtime.md` (session record).
- **To revert:** `git revert` the ED2 commit, or `git checkout rollback/ED2-environmental-dressing-runtime-20260722 -- scripts/ci/verify-living-home-assets.ts docs/implementation/ux/` and `git rm` the new module + this doc. No runtime surface exists to restore — nothing visible ever changed.
- **Verification after rollback:** `verify:living-home-assets` returns to its 5-check EXP3-Phase-2 form; `git diff` against the tag is empty; every room renders exactly as before (it always did).

## Scope Lock

- **Implemented scope:** the Dressing Register runtime module (empty register + loader + placement resolver + runtime resolver + renderer interface + shell + placement validation + admission hook + checksum); the verifier's `dressingChecks()`; the tightened Life "one mouth" check; the adoption known-orphan entry; this document; the session record. **Nothing else.**
- **Explicitly excluded (and confirmed absent from the diff):** every visible dressing item (bowls · flowers · pumpkins · books · blankets · candles · fruit · seasonal assets); the DOM mouth `dressing-layer.tsx`; renderer output; room dressing; celebration dressing; any asset, schema, migration, route, token, or component-render change. The DOM mouth and the first item are **ED3**, separately gated.
- **Decision recorded, not assumed (§ 0.2):** building the pure runtime now and deferring the DOM mouth to ED3 (its first consumer), per EXP3 § 7.1 / UIA § 17 — surfaced for the Home Owner.

## Manual Verification

Performed for this change:

1. `git status` clean apart from the session heartbeat before work; the rollback tag was created and verified to resolve to `88cf6277` **before** any file was written.
2. The mandated inputs were read in full (`docs/architecture/README.md`; `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md`; `EXP3_LIVING_HOME_ASSET_SYSTEM.md`; `ED1`; `EXP3_PHASE2_LIVING_HOME_ASSET_REGISTER.md`; `HOME_OWNER_ARCHITECTURE.md`), and the live code was inspected (the verifier, the Life manifest, the House Register, `orchard-backdrop.tsx`, the adoption gate) before writing.
3. `npm run verify:living-home-assets` → **PASS, 12/12** (5 House/Life checks unchanged + 6 dressing checks: checksum match, no forbidden field, admissible & gated, placement exclusions encoded, admission docs exist, empty resolves & renders to nothing, one mouth).
4. `npm run typecheck` → **88 errors, byte-identical to baseline**; **0 in `dressing-register.ts`, 0 in the verifier**.
5. `npm run build` → **exit 0** (`dist/index.cjs` emitted); the runtime has no client importer, so it is not in the bundle and changes nothing.
6. `npm run adoption:check` → **102 passed · 0 notices · 9 failed** — the 9 failures are the **pre-existing baseline set** (SpellSuggestions, UltraProcessedNoticeModal, food-knowledge-modal, whole-food-selector, food-confidence, json-utils, source-helpers, and two floors), unchanged; the new runtime module is recorded as a **passing** known-orphan with a named owner and its ED3 adoption plan. `adoption:record` regenerated `ADOPTION_REGISTER.md`; the diff is only the one new entry.
7. **Runtime demonstration** (tsx, in-workspace, then removed): `loadDressingRegister()` → 0 items, frozen; `resolveDressing()` across 25 room×season → 0 items; `toRenderPlan([])` → 0 descriptors; `sha256(canonicalizeItems(items))` == declared checksum; a crafted item carrying a `binding` → **refused** ("carries forbidden field matching \"binding\""); a crafted item carrying `text` → **refused**.
8. `git status` confirms the diff touches only the six intended files (two new, four modified) — no stray schema, route, component-render, or asset path; no visible dressing anywhere.

## User Acceptance Evidence

- **State: Waiting for User.** This is runtime/tooling infrastructure; acceptance is the Home Owner's review that the runtime is the shape `ED1` § 5–§ 7 and `LIVINGHOME2` § 10.3 specify, and confirmation of the § 0.2 decision.
- **The decision surfaced for review (§ 0.2):** building the pure runtime now and deferring the DOM mouth (`dressing-layer.tsx`) to ED3 — its first consumer — rather than mounting an authored-but-unadopted component now (EXP3 § 7.1 / UIA § 17). The pure module is recorded as a known-orphan exactly as `EXP3` Phase 2 recorded the empty Life manifest.
- **The gate that remains, named so it cannot be crossed silently:** ED3 (the Standing Welcome) may now be built — the empty runtime it needs exists — but the **first visible dressing item** is a separate governed act with its own rollback, admission brief under ED8, with-and-without review, and the Home Owner's approval (`HOMEOWNER1`). Nothing visible ships until then.
- **Evidence for review:** this document; the runtime module; the six green dressing checks and the runtime demonstration (§ Manual Verification); the session record at `.engineering/session/runs/ED2_Environmental_Dressing_Runtime.md`.

---

## Recommendation — the next implementation

**ED3 — Standing Welcome.**

The runtime is laid: one register (empty), one loader, one placement resolver, one runtime resolver, one renderer interface + shell, one placement-validation path, one admission hook, and one verification path — with the forbidden things inexpressible by type and refused again at read time. Every foundation stone beneath the home's quiet welcome is now placed and byte-locked, and the register resolves and renders to nothing, lawfully.

ED3 is `LIVINGHOME2` **Phase 3** — the first admitted item, candidate **the bowl of apples** (the home's year-round standing welcome). It is the moment the home first quietly lives, and it needs everything a visible item requires and this runtime deliberately did not ship:

- the DOM mouth `client/src/components/layout/dressing-layer.tsx` (still, `aria-hidden`, empty alt, `pointer-events-none` — the `orchard-backdrop.tsx` manner), mounted for the first time and adopting this runtime (which then leaves the known-orphan list);
- one still asset under `client/src/assets/living-home/dressing/`, admitted through the full ED10 pipeline: named, briefed under ED8's named-purpose test, placed under the § 5.1 law (refused in Pantry/Larder), reviewed with-and-without;
- the item's row added to the register with its checksum **recomputed in the same commit**, and its admission document written so `dressingChecks()` D5 passes;
- the **full experience gate stack** and the **Home Owner's approval** (`HOMEOWNER1` — *"is this beautiful enough for this house?"*), because ED3 is the first byte of visible dressing the product has ever shown.

Done in that order, ED3 is the moment a family opening THA finds a bowl of apples already on the counter — asking nothing, knowing nothing, meaning only: *you are welcome here.*

---

*The runtime is built and it shows nothing — which is exactly right. One register, empty; one resolver that returns nothing; one renderer that paints nothing; and a shape into which a claim, a word, an hour, or a channel cannot even be typed. When the home is finally allowed to keep a bowl of apples on the counter, there is now exactly one governed place that decides it, and it already knows how to refuse everything the bowl must never become.*
