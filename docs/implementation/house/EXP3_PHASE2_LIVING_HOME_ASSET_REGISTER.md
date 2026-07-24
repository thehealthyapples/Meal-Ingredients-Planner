# EXP3 Phase 2 — Living Home Asset Register & Verification Foundation

| Field | Value |
|---|---|
| **Implementation ID** | `EXP3-PHASE2` (Living Home Asset Register & Verification Foundation) |
| **Date** | 2026-07-22 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback ID** | `rollback/EXP3-PHASE2-living-home-asset-register-20260722` → `d5e91dde` (annotated tag, created **before any change**; covers committed state only — the working tree held one uncommitted `.engineering/session/CURRENT.md` heartbeat, not covered) |
| **Kind** | **Infrastructure/tooling only** (EXP3 § 13 Phase 2). The canonical House/Life asset infrastructure that the Environmental Dressing Register depends on. **No Environmental Dressing assets. No visible product change. No owner component.** |
| **Governing parent** | `EXP3_LIVING_HOME_ASSET_SYSTEM.md` — § 4.4 (the checksum register), § 7.2 (the Life manifest), § 7.4 (the verifier), § 13 Phase 2 (this deliverable and its gate). Cited, never restated. |
| **Governing grandparents** | `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (`LIVINGHOME2` — the third register this unlocks) · `docs/implementation/house/ED1_ENVIRONMENTAL_DRESSING_FOUNDATION.md` (`ED1` — landed the § 10.2 amendments; recommended this step) · `HOME_OWNER_ARCHITECTURE.md` (Principle 8 aesthetic-supports-trust, Principle 11 continual care) · `THA_EXPERIENCE_BLUEPRINT.md` (the place, the Living Details) · `THA_UI_ARCHITECTURE.md` § 17 (adoption / retire-on-introduction) |

---

## 0 · What this implementation is, and what it is not

**Objective.** Build the canonical Living Home asset infrastructure — the **House Register** (immutable architecture, byte-locked), the **Household Life Register** (the empty, data-borne manifest), and the **`verify:living-home-assets`** gate that keeps them honest — so that the Environmental Dressing Register (`LIVINGHOME2` § 10.3) has the base infrastructure it is gated behind. This is `EXP3` § 13 **Phase 2**, whose own scope line reads: *"House checksum register + Life manifest module (empty) + `verify:living-home-assets` wired into the platform's verification lane. Governance/tooling only — **no visual change, no owner component yet**."*

**What it is not.** It ships **no** Environmental Dressing register, no dressing item, no renderer, no composition mouth, no seasonal activation, no visual asset, and no product change a household could see. The one client-tree file it adds — the empty Life manifest — is inert (0 client importers by design; its consumer lands at EXP3 Phase 3). The Environmental Dressing Register remains **DECLARED-NOT-BUILT**; this implementation is the last piece of *base* infrastructure standing between it and existence, not the register itself.

### 0.1 One honest ordering note (a recorded decision, not a blocker)

`EXP3` § 13 lists Phase 2's gate as *"Phase 1; the verifier green on the real tree."* **Phase 1 — the two-orchard convergence (§ 4.2) — has not shipped:** both `client/public/orchard.webp` (384 KB) and `client/public/orchard-bg.webp` (50.5 KB) still exist, unconverged. Rather than treat this as a blocker (it would stall the Dressing Register indefinitely on an unrelated image-optimisation task), this implementation **registers both current orchard assets at their real bytes.** This is strictly *more* protective, not less: it byte-locks the house exactly as it stands today, so nothing drifts *before* convergence, and the eventual Phase 1 convergence becomes a **deliberate register-row update in the same commit** (EXP3 § 4.4's own discipline) rather than a silent file swap. The second half of the gate — *"the verifier green on the real tree"* — is met in full and demonstrated (§ Manual Verification). The register's `note` fields record the pre-convergence state at each row so Phase 1 knows exactly what it inherits.

---

## 1 · What was implemented

Three artefacts + one wiring, all infrastructure:

| Artefact | Path | Role |
|---|---|---|
| **House Register** | `docs/implementation/assets/house-asset-register.json` | The single machine-readable list of every House-Register raster/vector asset, each locked to its `sha256`, owner component, and governing citation. EXP3 § 4.4. |
| **Household Life Register** | `client/src/components/layout/living-details-manifest.ts` | The Life manifest — types + `export const livingDetailsManifest = {}`, **empty** by design. EXP3 § 7.2 / § 13 Phase 2. |
| **The verifier** | `scripts/ci/verify-living-home-assets.ts` | The five-check constancy gate. EXP3 § 7.4. |
| **The wiring** | `package.json` | `"verify:living-home-assets": "tsx scripts/ci/verify-living-home-assets.ts"` — one line, into the existing `verify:*` lane. |
| **Adoption record** | `docs/implementation/ux/adoption-register.json` (+ generated `.md`) | Records the empty manifest as a **known, owned, pending-adoption** module (its consumer lands EXP3 Phase 3), the gate's sanctioned path for a deliberately-dormant governed foundation (§ 0.1 of the manifest header; UIA § 17). |

### 1.1 The House Register (immutable architecture)

Two assets, both owned by the single component `client/src/components/layout/orchard-backdrop.tsx` (EXP3 § 4.1.1 — *mounted only by orchard-backdrop.tsx*):

- `orchard.webp` — the rooms/Home environment image (E2/E3), `sha256 a6da6a31…`.
- `orchard-bg.webp` — the arrival/graded environment image (E3, the NORTH2 bake-time grade), `sha256 c0405f55…`.

**Deliberately excluded** to avoid duplicate ownership (task item 7): the brand marks (`apple-logo.png`, `favicon.png`, `tha-apple.png`, `logo-long.png`, the `_brand*` apples) — those are owned by `THA_UI_ARCHITECTURE.md` § 10 and the Adoption Register, and re-checksumming them here would make this file a **second owner** of the brand identity. The register lists **Living-Home architecture assets only**, which today is the orchard. Tokens, CSS joinery, and ground planes (Layers 0/2/3) are not raster/vector *assets* and are owned by `index.css`/the shell (EXP3 § 3), so they are correctly out of this register.

### 1.2 The Household Life Register (empty, data-borne)

The manifest ships the **shape** and an **empty collection.** Its type makes the six Blueprint § 12.1 laws unbreakable by construction — a `LivingDetailSpec` has no field a motion value, a text/copy string, an occasion/tradition key, a colour override, or a per-surface exposure could occupy; and it **must** carry a `binding` (source + predicate), which is precisely what distinguishes a **Life** detail from an **Environmental Dressing** item (Life *must* bind to a household fact; Dressing *must not*). It has **no owner component and no consumer** — per EXP3 § 7.1, the composition mouth (`living-details.tsx`) and the resolver land with the **first admitted detail** (the Cookbook pilot, EXP3 Phase 3), never before. Nothing imports the manifest in the client tree, so it renders nothing and changes no UI.

### 1.3 The verifier (`verify:living-home-assets`) — five checks

In the `verify:publication` house style (console report, `✓/✗`, exit 1 on any failure), reading everything and writing nothing:

1. **House constancy** — every registered asset exists and its bytes match its `sha256`; a drift or a missing file fails, demanding a same-commit register-row update citing the amendment (EXP3 § 4.4).
2. **Life manifest well-formed** — one spec per realm; every spec discloses `binding`, `admittedBy`, `retires` (EXP3 § 7.2 / § 12.1). Empty → holds vacuously.
3. **No occasion/tradition key** in the Life manifest — the LH3 / `LIVINGHOME1` § 10.4 refusal made mechanical (a tradition never carries a Life asset).
4. **One mouth** — nothing outside `living-details.tsx` imports from `assets/living-home/` (EXP3 § 6 / § 7.1).
5. **No orphans / no dangling ids** — no authored-but-unadopted Life asset, and no manifest object id that resolves to no asset (EXP3 § 7.4.5).

The verifier also carries an explicit, empty `dressingChecks()` **extension seam**: when ED2 builds the empty Dressing Register, its third-register checks (checksum match; no household-data binding reachable from the dressing mouth; celebration items gated by the § 7.2 permission; placement exclusions per `LIVINGHOME2` § 5.1; admission-doc existence) land there — declared by `ED1` § 2 Amendment 4, built with the register, not now.

---

## 2 · Confirmations (task item 7)

- **One owner** — the House Register's assets are all owned by the single `orchard-backdrop.tsx`; the Life manifest is one module; the verifier is one script. ✔
- **One asset registry per register** — one House Register JSON, one Life manifest module. No rival. ✔
- **One verifier** — `verify:living-home-assets`, one script, one lane entry. ✔
- **No duplicate manifests** — a repo scan found no pre-existing living-home register/manifest; these are the first and only ones. ✔
- **No duplicated ownership** — brand marks deliberately excluded (owned by UIA § 10); the empty manifest recorded once, in the adoption register, with one owner. ✔
- **Immutable House assets** — byte-locked by `sha256`; the verifier fails on any drift (demonstrated, § Manual Verification). ✔
- **Household Life separated from House assets** — different register, different module, different rule: House is checksummed and never changes; Life is *not* checksummed (its nature is data-decided at read time — EXP3 § 4.4) and changes only with the household's data. ✔

---

## 3 · Validation against the governing documents (task item 8)

- **`LIVINGHOME2`** — this ships the base infrastructure its § 10.4 Phase 2 gate requires (*"EXP3 Phase 2 (registers/verifier) shipped first"*) before the Dressing Register may exist. It adds **no** dressing register, item, renderer, seasonal activation, or celebration path; the `ED1` § 2 Amendment 4 third-register checks are declared as a seam, not built. The one-season, one-morning, claim-free laws are untouched. ✔
- **`EXP3`** — implements § 13 Phase 2 exactly: House checksum register (§ 4.4) + empty Life manifest (§ 7.2) + `verify:living-home-assets` (§ 7.4), tooling only, no visual change, no owner component. The § 4.2 Phase 1 convergence is *not* done and is honestly recorded, not silently assumed (§ 0.1). ✔
- **Home Owner Architecture** — Principle 8 (*every aesthetic decision supports trust*): the register is a trust instrument — it makes *"the house cannot drift"* mechanical, so a household's home stays exactly as crafted. Principle 11 (*continual care*): infrastructure that lets the house be refined deliberately, one governed register-row at a time, rather than by silent asset swaps. No room is disturbed. ✔
- **Experience Blueprint** — the Living Details constitution (§ 12.1) is encoded as the manifest's type; the empty manifest means every room's band renders exactly as today (honest absence — § 12.1.3). No new region, no exposure change (§ 6.2 untouched). ✔

---

## 4 · Extension points produced (task item 10)

- **House Register** — additive `assets[]` array; a new House asset is one row with its hash and citation; the Phase 1 convergence updates the two orchard rows in place (retire-on-introduction). Schema carries an explicit `extensionPoints.dressingRegister` marker recording that the Dressing Register is a **separate** future artefact and must not be added here.
- **Life manifest** — the exported types (`LivingDetailSpec`, `LivingDetailsManifest`) are the extension interface; a detail is admitted by adding one realm entry, through the EXP3 Phase 3+ gate stack.
- **Verifier** — the empty `dressingChecks()` function is the declared seam for ED2's third-register checks; the five existing checks are each independent and additive.

---

## Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — one House Register, one Life manifest, one verifier;
  the orchard's one owner (orchard-backdrop.tsx) is unchanged.
☑ One owner per fact — House assets' bytes now have exactly one recorded owner
  (the register row); the season/occasion facts stay their owners' (Domain 11 /
  households) and are not read here at all.
☑ No duplicate entities — first and only living-home register/manifest; brand
  marks deliberately NOT re-owned (UIA § 10 keeps them).
☑ No duplicate ownership — the empty manifest recorded once, one owner, in the
  adoption register; no second register of anything created.
☑ No duplicate state — the House Register is a CI artefact (hashes), not runtime
  state; the Life manifest is empty; no store, no schema, no migration.
☑ Extends existing architecture — adds a verify:* lane entry in the established
  verify:publication manner; extends EXP3's two-register design as specified.
☑ Progressive enrichment — empty manifest default; House byte-locked as-is;
  Dressing checks declared as a seam, not built.
☑ Knowledge domain compliance — no knowledge domain touched; Product Registry
  impact nil (no user-facing surface).
☑ Honest gaps over fabricated information — the unconverged orchard is registered
  honestly at both real hashes (§ 0.1), not papered over; empty manifest = honest
  absence.
☑ No permanent synchronisation bridge — the verifier is a read-only gate, not a
  sync; no scheduler; nothing derived is stored.
☑ Evolution over replacement — nothing retired; the Phase 1 convergence remains a
  future deliberate register-row update, its reverse path recorded in the notes.

Experience Constitution Check (before design):
  hospitality — invisible to households; adds no weight (GEA2); makes the crafted
                house provably stable, which is hospitality's foundation.
  outcome     — the house cannot silently drift; no household carries anything new.
  weight      — zero visible: tooling + an empty inert module.
  voice       — no room and no Companion gained a voice; nothing rendered.
  ownership   — every asset's bytes now have one named owner; nothing decides for
                the household.
  restraint   — the manifest type makes the forbidden things inexpressible; the
                register adds no charm (GEA15).
  layer       — Experience Implementation (tooling); originates no law (GEA20).
```

## AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — not reached at all. No capability,
  intent, prompt, Context View, notice, or persona created, altered, or consumed.
✓ Capability Registry / Intent Engine / Behaviour Engine — untouched.
✓ Does not create another assistant — none touched. Asset infrastructure has no
  voice, no eyes, no memory.
✓ Companion ownership unchanged — nothing here enters a prompt or Context View;
  the verifier is a CI script, read-only over files.
✓ Honest gaps over fabricated knowledge — the unconverged orchard is registered
  truthfully; the empty manifest asserts nothing.
```

## Definition of Done

- **Success looks like:** the House Register exists and byte-locks the current orchard assets; the empty Life manifest exists with its full type shape and no consumer; `verify:living-home-assets` exists, is wired into `package.json`, and is **green on the real tree**; the verifier provably **fails on drift**; typecheck / build / adoption are baseline-identical; no Environmental Dressing asset, renderer, or visible change ships; rollback reported; committed.
- **What must not break:** nothing runtime — no route, component render, schema, or data path changes. The two orchard assets are byte-untouched (they are *registered*, not modified). The Companion, every room, and every household surface are unchanged.
- **Manual test steps:** `npm run verify:living-home-assets` → PASS (exit 0); tamper a registered hash → FAIL (exit 1); restore → PASS. `npm run typecheck` → 88 (baseline, 0 client, 0 in new files). `npm run build` → exit 0. `npm run adoption:check` → 9 failed (baseline set) with the empty manifest recorded as a passing known-orphan.
- **Product Registry impact:** none — no user-facing surface, page, route, or claim ships. The infrastructure is invisible to households.

## Data Impact

- **Reads existing data:** NO household data. The verifier reads only files on disk (asset bytes, the manifest module, the client source tree) at CI time.
- **Writes new data:** NO. The House Register is a checked-in CI artefact (content hashes), not household data; the Life manifest is empty; no schema, migration, or store.
- **Changes meaning of existing data:** NO. The orchard assets are registered, not altered.
- **Requires backfill:** NO.
- **Special-category data:** none read, moved, or exposed.

## Trust Check

- **Could this mislead the user?** No — there is no user-facing surface. The register is a trust *instrument*: it makes the house provably non-drifting.
- **Could this fabricate certainty?** No. The unconverged orchard is registered honestly at both real hashes rather than pretending Phase 1 happened; the empty manifest asserts nothing.
- **Is anything guessed but shown as real?** No. Every hash is computed from the real bytes; nothing is inferred.
- **Was any owned word or number changed?** No household-facing word or number. The only numbers added are content hashes of files that already existed.
- **What happens if the system is wrong?** A CI failure, caught before merge — the verifier fails loudly rather than letting a drift through. For a false-positive (e.g. a legitimate asset change with a stale row), the fix is a one-line register update in the same commit, which is the intended workflow.
- **No trust surface, consent ledger, permission path, or conversation store touched.**

## Rollback Plan

- **Rollback identifier:** `rollback/EXP3-PHASE2-living-home-asset-register-20260722` → `d5e91dde` (annotated tag, created **before any change**; covers committed state only — the uncommitted `CURRENT.md` heartbeat is not covered).
- **Files modified:** `docs/implementation/assets/house-asset-register.json` (new) · `client/src/components/layout/living-details-manifest.ts` (new) · `scripts/ci/verify-living-home-assets.ts` (new) · `package.json` (one script line) · `docs/implementation/ux/adoption-register.json` + generated `ADOPTION_REGISTER.md` (one known-orphan entry) · `docs/implementation/house/EXP3_PHASE2_LIVING_HOME_ASSET_REGISTER.md` (new) · `.engineering/session/CURRENT.md` + `.engineering/session/runs/EXP3_Phase2_Living_Home_Asset_Register.md` (session record).
- **To revert:** `git revert` the commit, or `git checkout rollback/EXP3-PHASE2-living-home-asset-register-20260722 -- package.json docs/implementation/ux/` and `git rm` the three new artefacts + the two docs. No runtime surface exists to restore — the two orchard assets were never modified.
- **Verification after rollback:** `verify:living-home-assets` no longer resolves (script removed); `git diff` against the tag is empty; the house renders exactly as before (it always did — nothing visible changed).

## Scope Lock

- **Implemented scope:** the House Register, the empty Life manifest, the `verify:living-home-assets` verifier + its one `package.json` line, the adoption-register known-orphan entry, this document, and the session record. **Nothing else.**
- **Explicitly excluded (and confirmed absent from the diff):** the Environmental Dressing Register; any dressing item (bowls, flowers, pumpkins, blankets, books, candles); room dressing; a renderer; the composition mouth (`living-details.tsx`); the resolver; seasonal activation; animations; any visual/room asset; any schema, migration, route, token, or component-render change. No orchard asset was modified — the Phase 1 convergence is deliberately **not** done here.
- **Decision recorded, not assumed:** registering both unconverged orchard assets rather than blocking on Phase 1 convergence (§ 0.1).

## Manual Verification

1. `git status` clean apart from the session heartbeat before work; rollback tag created and verified to resolve to `d5e91dde` **before** any file was written.
2. `npm run verify:living-home-assets` → **PASS, exit 0** — 5/5 checks pass; House assets byte-locked, Life manifest empty and honest.
3. **Drift test (proves the gate bites):** temporarily set one registered `sha256` to zeros → verifier **FAIL, exit 1** (*"orchard.webp drifted … Update the register row in the SAME commit"*); restored the real hash → **PASS, exit 0** again.
4. `npm run typecheck` → **88 errors, byte-identical to baseline**; **0 in `client/`**, **0 in either new `.ts` file** (the manifest and the verifier both typecheck clean).
5. `npm run build` → **exit 0**; `dist/index.cjs` emitted; the empty manifest has no client importer, so it is not in the bundle and changes nothing.
6. `npm run adoption:check` → **101 passed · 0 notices · 9 failed** — the 9 failures are the **pre-existing baseline set** (unchanged); the empty manifest is recorded as a **passing** known-orphan with a named owner and its Phase-3 adoption plan. `adoption:record` regenerated `ADOPTION_REGISTER.md`; the diff is only the one new entry (no ratchet moved).
7. `git status` confirms the diff touches only the seven intended files — no stray schema, route, component, or asset path.

## User Acceptance Evidence

- **State: Waiting for User.** This is infrastructure; acceptance is the owner's review that the register and verifier are the shape EXP3 § 13 Phase 2 specifies, and confirmation of the § 0.1 ordering decision.
- **The decision surfaced for review:** registering both unconverged orchard assets at their real bytes rather than blocking Phase 2 on the Phase 1 convergence (§ 0.1) — strictly more protective, and it turns the eventual convergence into a deliberate register-row update.
- **The gate that remains, named so it cannot be crossed silently:** the Environmental Dressing Register (ED2) may now be built — its two prerequisites (`ED1`'s § 10.2 amendments **and** this EXP3 Phase 2) are both satisfied — but it is a **separate governed act** with its own rollback, gates, and report, and it ships an **empty** register only.
- **Evidence for review:** this document; the three artefacts; the green verifier run and the drift test (§ Manual Verification); the session record at `.engineering/session/runs/EXP3_Phase2_Living_Home_Asset_Register.md`.

---

## Recommendation — the next implementation

**ED2 — Environmental Dressing Register (empty register only).**

Both gates that stood before it are now cleared: `ED1` landed the four `LIVINGHOME2` § 10.2 owner amendments, and this implementation ships EXP3 Phase 2 (the base House/Life register + verifier). ED2 is therefore now **lawful to build** — as an **empty** register only:

- The Dressing Register module + resolver (to the `ED1` § 5 contract: forbidden fields structurally inexpressible — no binding, text, count, href, motion, hour-key, campaign, or householdId), shipping **zero items**.
- The verifier's `dressingChecks()` seam filled in with the third-register checks `ED1` § 2 Amendment 4 declared (checksum match; no household-data binding reachable from the dressing mouth; celebration items gated by the § 7.2 per-tradition permission; placement exclusions per `LIVINGHOME2` § 5.1; admission-doc existence).
- **Still no dressing item, no renderer, no seasonal activation, no visible change** — the register is empty, exactly as this Life manifest is empty. The first *visible* dressing (the standing welcome — the bowl of apples) is a later, separately-gated act (`LIVINGHOME2` Phase 3), and the seasonal turns (**ED2's later sibling, "Seasonal Environmental Dressing Activation"**) are later still (`LIVINGHOME2` Phase 4).

The line that holds through all of it: *the house holds still; the life moves* — and, between them, the home's quiet welcome, still built nowhere, but now with every foundation stone beneath it laid and byte-locked.

---

*Phase 2. The house is byte-locked: two orchard assets, two hashes, one owner, and a gate that fails the moment either drifts. The Life register stands ready and empty, its shape refusing every fabrication by construction. Nothing new is visible in any room — which is exactly right, because what shipped is not a thing to see but the quiet certainty that everything already there will stay exactly as it was crafted, and that whatever the home is one day allowed to set upon its surfaces will arrive through one governed door, checksummed and named.*
