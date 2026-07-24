# LARDER_ASSET_GOVERNANCE_FOUNDATION — Living Larder Jar Asset Governance Foundation

**Status:** DELIVERED (governance only — no artwork, no runtime UI change)
**Date:** 2026-07-23
**Rollback identifier:** `rollback/larder-asset-governance-foundation-20260723` → `ee365a31`
**Report location:** `docs/implementation/pantry/LARDER_ASSET_GOVERNANCE_FOUNDATION.md`
**Commit hash:** `90778d47` (implementation); hash recorded in this follow-up commit per repo precedent (`a8b22162`)

## 1. Purpose

Establish the canonical governance, lifecycle and validation foundation for the
27 approved Living Larder jar assets — 25 ingredient visual families, one empty
shopping-state jar, one green visual-gap fallback jar — without creating any
artwork or changing any runtime UI. The existing **Life Register**
(`client/src/components/layout/living-details-manifest.ts`) is extended as the
single owner of physical, data-bound Living Home assets, and the existing
**Living Home verifier** (`scripts/ci/verify-living-home-assets.ts`) is
extended as the only verifier. No second register, verifier, approval log,
colour registry or state owner exists after this change.

## 2. Architecture documents read

Per the Architecture Bootstrap (`docs/architecture/README.md`, read first):

- `docs/architecture/README.md` (Bootstrap, both pages)
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (P1, P2, P6, P8; Governance Rules 1–3, 6, 8)
- `docs/architecture/REPOSITORY_CONVENTIONS.md` (§ 2–§ 5, § 7)
- `docs/architecture/ENGINEERING_WORKFLOW.md` (compliance checklist, DoD, rollback, commit steps)
- `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` (via Bootstrap; GEA13/GEA20 honoured — no design work performed, no upward-flowing rule)
- `docs/architecture/LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (LIVINGHOME1)
- `docs/architecture/LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (LIVINGHOME2)
- `docs/architecture/LIVING_HOME_DESIGN_CONSTITUTION.md` (LHDC1 — admission evidence + Home Owner approval recording)
- `docs/architecture/HOME_OWNER_ARCHITECTURE.md` (HOMEOWNER1 — approval mechanics: recorded, through the documents, never around them)
- `docs/architecture/LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md` (LARDER1 — Domain 2/15/30 ownership; never a quantity)
- `docs/architecture/LIVING_LARDER_ASSET_LIBRARY.md` (ASSET1 — one jar, specified once, reused forever; Home Owner approves, Designer holds spec custody)
- `docs/architecture/LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md` (LARDER4 — STOP-on-conflict; furniture before products; rejection criteria)
- `docs/implementation/house/EXP3_LIVING_HOME_ASSET_SYSTEM.md` (via register/verifier headers — the two-register model and § 4.4 checksum law)
- `.engineering/protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`
- Source-of-law code read in full: `living-details-manifest.ts`, `verify-living-home-assets.ts`, `dressing-register.ts`, `house-asset-register.json`

## 3. Architecture compliance

- **One canonical asset identity (P1):** each jar has one id (`tha-larder-jar-<family>`), one filename, one family; uniqueness verifier-enforced (J1).
- **One owner per fact (P2):** all shared jar facts (canvas, format, jar form, geometry, label rectangle, typography, fill law) live once on `LARDER_JAR_SHARED_SPEC`; every record references it — 27 copies of one geometry would be 27 rival owners. Availability has exactly one definition (`deriveJarAvailability`); stored state must match it (J2).
- **No duplicate entities/ownership/state:** the jar section joins the existing Life Register module; approval state and full history live inside it; the export manifests are declared **projections** of the register, never second owners.
- **Life Register as owner of physical, data-bound assets:** jars are Life-class by EXP3 § 4.4's own boundary — the House Register's header states *"Life assets are deliberately NOT listed here — what appears is decided by data at read time, not by their bytes."* Which jar a household sees is a Domain-30 fact at read time. The Living Details manifest, its one-per-realm law, its binding law and the occasion ban are **byte-untouched** in behaviour (`livingDetailsManifest` remains empty; verifier checks 2–5 unchanged in meaning).
- **One verifier:** `verify-living-home-assets.ts` extended with checks J1–J12; no new script. The jars subtree is carved out of the Life orphan/single-mouth checks exactly as the `dressing/` subtree precedent, and governed by its own stricter gates.
- **Progressive enrichment:** records begin `planned` with only what is honestly known; checksums, approvals and history are added as they become true, never fabricated.
- **Honest visual gaps (P6):** unmapped canonical foods are never guessed — they take the governed fallback jar and a Visual Gap record. The Visual Gap Register ships **empty** because no runtime Larder UI exists to encounter a gap; the fallback's contents are deliberately non-food so it can never be mistaken for a real ingredient.
- **Evolution over replacement / retire on introduction (P8):** the rejected predecessors are named, archived with evidence, and mechanically excluded (J12); the register records the predecessor reference on every jar record.
- **Static-register scale (Governance Rule 6):** the inventory is **closed at 27 by design** (J1 fails on 26 or 28); it is asset governance metadata in the exact manner of the 6-item dressing register, not a growing knowledge store.
- **Colour ownership:** `visual-gap-green` (#63A844) is an **artwork-content colour** — the fallback jar's pellet pigment, as the apples' red-green is the Dressing assets' pigment — with exactly one governed meaning ("approved visual representation missing"), applying only to the governed fallback asset. It is **not** a UI token; THA_UI_ARCHITECTURE.md § 7 is untouched, and promoting it to a token would require a UIA amendment first. It is one entry, not a colour registry (J10 fails on a second entry or second meaning).
- **GEA13 (never grade the household) / LARDER1 (never a quantity):** fill height is declared non-semantic in the shared spec; `household-quantity-representation` and `nutrition-quality-or-freshness-claim` are prohibited uses on every record; the forbidden-meanings list for visual-gap-green (quantity, nutrition, quality, freshness, availability, error, shopping-list state) is verifier-enforced.

**AI architecture compliance:** not applicable — no AI capability, prompt, model
read, or intelligence surface is touched.

**Experience/UI governance:** no UX, UI, frontend or visual behaviour changes —
this is governance metadata and CI verification only. No design was performed
(the artwork passes will run the Experience Constitution Check before design
begins). **Product Registry impact:** none — "what is THA?" answers identically.
**Adoption Register impact:** no component, hook, token, utility class or shared
runtime pattern added; the register extension has no client consumer (the CI
script importer is not a client consumer, per the dressing precedent).

## 4. STOP-condition review (all cleared)

1. *Ownership unclear?* No — jars are Life-class data-bound assets (EXP3 § 4.4 boundary above); Domain 2/15/30 business ownership untouched and cited.
2. *Second register/verifier/approval log/state owner required?* No — one module, one script, approval history inside the register, exports as projections.
3. *Conflict with governing architecture?* Four tensions found and resolved without amendment: (a) the Life Register's header scope was extended in the same change to name the jar section; (b) ASSET1's "one jar, reused forever" is **enforced** by the shared spec (25 families = one jar form, varying photorealistic contents), not contradicted; (c) visual-gap-green recorded as artwork-content colour, not a UI token; (d) ASSET1 carries no spec yet for the empty and fallback jars — recorded below as a prerequisite gap before those two records may reach `candidate`.
4. *Uncommitted work at risk?* No — pre-existing untracked work (screenshots, run files, LARDER docs) untouched; the two archived `.webp` files were untracked with zero source references, and their bytes were preserved exactly (checksums verified identical before and after the move).
5. *Archive path vs repository conventions?* `docs/reference-assets/` was **unowned, not conflicting**: no convention governs rejected-asset archiving, no mechanical gate rejects the path, and this approved work order names it explicitly. The directory is hereby established for that purpose; a REPOSITORY_CONVENTIONS amendment is recorded under SUGGESTION.

## 5. Files changed

| File | Change |
|---|---|
| `client/src/components/layout/living-details-manifest.ts` | Life Register extended: § J jar governance (types, shared spec, 27 planned records, colour governance, Visual Gap Register, lifecycle law, export contract); header scope amended |
| `scripts/ci/verify-living-home-assets.ts` | Verifier extended: J1–J12 + honest-gap disclosure; jars subtree carved out of Life orphan/single-mouth checks (dressing precedent); minimal deterministic PNG inspector (IHDR + full unfilter + alpha sampling) |
| `client/src/assets/living-home/larder/jars/README.md` | Governed asset directory established (empty of artwork, as the lifecycle requires) |
| `docs/reference-assets/rejected/living-larder/larder-counter.webp`, `larder-jars.webp` | Rejected predecessors archived (moved from `client/src/assets/larder/`, which is removed; bytes byte-identical) |
| `docs/reference-assets/rejected/living-larder/REJECTION_RECORD.md` | Original paths, checksums, rejection reasons, retirement dates, replacement families |
| `docs/implementation/pantry/LARDER_ASSET_GOVERNANCE_FOUNDATION.md` | This report |
| `.engineering/session/runs/LARDER_ASSET_GOVERNANCE_FOUNDATION.md`, `.engineering/session/CURRENT.md` | Session recovery tracking |

**Existing owners extended:** Life Register (asset governance records + colour
meaning + visual gaps + export contract) and Living Home verifier (validation).
**Planned asset count:** 27 (25 ingredient families + `tha-larder-jar-empty` +
`tha-larder-jar-fallback-green`), all `approvalStatus: planned`,
`availabilityState: unavailable`, `checksum: null`.

## 6. Verifier changes (J1–J12)

- **J1** closed 27-record inventory: the 25 approved families + empty + fallback, unique ids/filenames/families.
- **J2** record well-formedness: naming law, shared-spec reference, lifecycle-state consistency, curated-mapping law (ingredient jars must map; empty/fallback must not), stored availability ⇔ the one derived law.
- **J3** planned/candidate assets are always unavailable.
- **J4** missing files lawful **only** for planned records; candidate/approved files must exist; a file for a still-planned record fails; no stray files.
- **J5** PNG integrity on every present file: exact 512 × 768 (IHDR), 8-bit RGBA (colour type 6), non-interlaced, decoded-pixel verification of fully transparent corners, genuine non-vacuous alpha (opaque/checkerboard backgrounds fail on corner alpha), no label-like PNG text metadata.
- **J6** checksum-bound approval: approved bytes must hash to both the record checksum and the live approval's `approvedChecksum`; drift fails the gate with the correcting instruction (return to candidate, withdraw availability, preserve history, re-verify, re-approve).
- **J7** no client file may reference the jar directory except the one declared mouth (`client/src/pages/larder-room.tsx`), and even the mouth may not while 0 assets are approved — planned/candidate assets cannot reach runtime.
- **J8** export law proven over the real register **and** synthetic records: only checksum-bound approved assets are included; a forged (checksum-unbound) approval is excluded; an incomplete package can never report `complete`.
- **J9** lifecycle self-test executes the law: candidate promotion, refusal of an approval not bound to the candidate checksum, drift invalidation preserving the superseded approval in history.
- **J10** `visual-gap-green` single meaning, fallback-only scope, forbidden-meanings list intact — one governed colour entry, never a registry.
- **J11** Visual Gap Register well-formed (canonical food, governed fallback ref, ISO date, resolved ⇔ replacement recorded, replacement must be a registered asset).
- **J12** rejected predecessors: archived files + rejection record present, client tree clear, zero source references.
- **Honest gap disclosed by the verifier itself:** in-pixel baked-wording detection is not deterministically automatable without OCR; the automated gates cover PNG text metadata and the runtime-text law, and wording review is bound to the checksum-locked Home Owner approval, so it can never be silently bypassed. No fabricated verification is reported anywhere — absent files make J4–J6 explicitly "vacuous, arms on first candidate", never "verified".

## 7. Tests and verification commands

| Command | Result |
|---|---|
| `npm run verify:living-home-assets` | **PASS — 26/26** (14 pre-existing checks unchanged and green; 12 new jar checks green) |
| `npm run build` | **PASS** (vite client build ✓ — asset imports intact after removing `client/src/assets/larder/`) |
| `npx tsc --noEmit` (this change's files) | **Clean** — zero errors in `living-details-manifest.ts` / `verify-living-home-assets.ts` |
| `npm run typecheck:ci` | Fails on **16 pre-existing** regressions, all in `server/tests/*` (last touched commit `3430b1c1`, before this work; none in files this change touches) |
| `npm run adoption:check` | Fails on **10 pre-existing** orphan modules/ceilings (SpellSuggestions, UltraProcessedNoticeModal, …), none introduced or touched here |
| `.engineering/scripts/repo-structure-verify.sh` | Same **3 pre-existing** failures before and after (loose implementation/investigation files; 4 unindexed LARDER architecture docs); no new failure class introduced |

The jar lifecycle behaviour tests execute **inside the main verification gate**
(J8/J9 synthetic sweeps), so they run wherever `verify:living-home-assets`
runs — nothing is left outside the suite. The pre-existing typecheck/adoption/
structure failures are recorded as inherited engineering debt under SUGGESTION.

## 8. Manual verification and User Acceptance Evidence

**Starting point.** Life Register: `living-details-manifest.ts` — Living
Details manifest empty (unchanged); new § J holds the jar section. Verifier:
`verify-living-home-assets.ts` — previously 14 checks, now 26. Planned Larder
jar section: 27 records under § J, directory `client/src/assets/living-home/larder/jars/`
empty of artwork.

**User actions and observed behaviour** (all reproducible from the repo):

1. *Inspect one ingredient record* — `tha-larder-jar-rolled-oats`: family `rolled-oats`, curated mapping `["rolled oats"]`, category `breakfast`, confusable with `granola`, `planned` / `unavailable` / checksum `null`, predecessor reference to the archived `larder-jars.webp`, shared-spec reference for all geometry/label/typography.
2. *Inspect the empty shopping-state record* — `tha-larder-jar-empty`: maps to **no** canonical food, permitted `shopping-state-presentation`, prohibited from representing any specific food or quantity.
3. *Inspect the green fallback record* — `tha-larder-jar-fallback-green`: non-food geometric pellet contents in `#63A844`, permitted **only** as visual-gap presentation, maps to nothing.
4. *Simulate a candidate checksum* — J9 executes `promoteJarToCandidate(record, checksum)`: status `candidate`, availability remains `unavailable` ✓.
5. *Simulate Home Owner approval* — J9 executes `recordJarHomeOwnerApproval` with a checksum-bound approval → `approved` + `available`; an approval bound to a **different** checksum is **refused** ✓.
6. *Simulate file checksum drift* — J9 executes `applyJarChecksumDrift` → back to `candidate`, availability withdrawn, previous approval preserved in history as `invalidated-by-checksum-drift`, live approval cleared ✓. (For a real on-disk drift, J6 fails the gate with the correcting instruction.)
7. *Run the verifier* — `npm run verify:living-home-assets` → 26/26 PASS, with every vacuous check honestly labelled as vacuous-until-armed.
8. *Inspect approved-only export output* — `buildJarExportSet()` → `0 included / 27 excluded / complete: false` — the honest answer while nothing is approved; a synthetic forged approval is excluded (J8).

**Expected behaviour — all confirmed:** planned unavailable ✓ · candidate
unavailable ✓ · availability only via checksum-bound approval ✓ · drift removes
availability ✓ · fallback usage is recorded in the Visual Gap Register (shape +
J11 law in force; register honestly empty — no runtime encounters exist yet) ✓
· rejected predecessors cannot enter runtime or exports (J12 + J7/J8) ✓.

**Success criteria:** one canonical register ✓ (the Life Register) · one
canonical verifier ✓ (26 checks, one script) · no duplicate approval owner ✓
(approval + history inside the register) · no unapproved asset can reach
runtime or export ✓ (J7/J8, fail-closed) · all 27 planned identities traceable ✓
(J1 closed inventory).

**Regression checks:** existing Living Home assets still validate ✓ (House
byte-lock, Life manifest, Dressing D1–D8 all green, unchanged) · existing
runtime manifests remain valid ✓ · current asset imports still build ✓ (vite
build green; the archived files had zero imports) · no business data or Larder
UI behaviour changed ✓ (no server, schema, route or page file touched).

## 9. Data impact

- **Reads existing data:** repository governance and asset metadata only.
- **Writes new data:** governance metadata and planned asset records (source files only).
- **Changes meaning of existing data:** no.
- **Requires backfill:** no.
- **Business database writes:** none.

## 10. Trust check

Nothing this change ships can lie to a household: no runtime surface changed;
no asset can appear anywhere until automated verification **and** a
checksum-bound, recorded Home Owner approval exist; fill height is declared
non-semantic; the fallback jar is deliberately unmistakable for food; every
"cannot verify" is reported as a gap rather than a pass; and the rejection
evidence is preserved, not deleted.

## 11. Remaining honest gaps

1. **ASSET1 specifications for the empty jar and the fallback jar do not exist yet** (ASSET1 requires all 21 dimensions before rendering). Prerequisite before those two records may reach `candidate`; the 25 ingredient jars render under ASSET1's existing clamp-top jar family + the shared spec here.
2. **In-pixel baked-wording detection is not automated** (no OCR); bound to the checksum-locked Home Owner approval and disclosed by the verifier itself.
3. **The Visual Gap Register is empty by necessity** — no runtime Larder UI exists to encounter a gap; entries are added by commit when the presentation pass lands.
4. **`larder-room.tsx` is the declared mouth, not yet a consumer** — the runtime binding is a later, separately-approved pass; J7 currently refuses even the mouth while 0 assets are approved.

## 12. SUGGESTION (recorded, deliberately not implemented)

- Amend `REPOSITORY_CONVENTIONS.md` to own `docs/reference-assets/` (rejected/reference asset archiving rules) — the directory is now established in practice.
- Index the four unindexed `LIVING_LARDER_*` architecture documents in `docs/architecture/README.md` (pre-existing structure-verifier failure).
- Resolve the 16 pre-existing `server/tests/*` typecheck regressions and the 10 pre-existing adoption-register failures (inherited debt, untouched here).
- File the loose `docs/implementation/*.md` reports by workstream (pre-existing convention divergence; this report follows the task-mandated path and existing precedent).
- ASSET1 amendment to specify the empty and fallback jars (21 dimensions each) before their candidate stage.

## 13. Scope lock

Only the governance foundation was implemented. No artwork, no runtime Larder
UI behaviour, no standalone register, no second verifier, no colour registry,
no unrelated refactor, no business-data ownership change. The production ZIP
was **not** created (no artwork exists; the export contract is defined and
verifier-proven fail-closed instead).
