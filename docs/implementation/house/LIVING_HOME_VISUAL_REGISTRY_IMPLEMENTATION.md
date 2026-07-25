# VISREG1 — Living Home Visual Registry — Implementation

**Document ID:** `VISREG1`
**Date:** 2026-07-25
**Status:** COMPLETE — governing architecture created · **no runtime behaviour changed**
**Rollback identifier:** `rollback/VISREG1-living-home-visual-registry-20260725` → `ec2014d7`
**Author of record:** Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow
**Governing document created:** [`docs/architecture/LIVING_HOME_VISUAL_REGISTRY.md`](../../architecture/LIVING_HOME_VISUAL_REGISTRY.md)
**Session record:** `.engineering/session/runs/VISREG1_Living_Home_Visual_Registry.md`

---

## Filing divergence — surfaced, not silently resolved

The mission specified `docs/implementation/LIVING_HOME_VISUAL_REGISTRY_IMPLEMENTATION.md` — a **folder root**, which `REPOSITORY_CONVENTIONS.md` § 2 forbids (*"loose files at its root"*) and `ENGINEERING_WORKFLOW.md` STEP 5 forbids by name (*"**Never** write a report to a folder root"*). It is mechanically enforced: `.engineering/scripts/repo-structure-verify.sh` check 3 fails when `docs/implementation/` holds any loose file other than `README.md`.

Filed at the governed workstream path for the **House** stream (`REPOSITORY_CONVENTIONS.md` § 4 — *the House experience: Home, Arrival, the North Star, the Orchard House, rooms, spatial experience, and the household interior design language*):

**`docs/implementation/house/LIVING_HOME_VISUAL_REGISTRY_IMPLEMENTATION.md`**

The governing document itself is at the mission-specified path exactly, because `docs/architecture/` is its correct home. The same divergence was surfaced and handled identically under `LARDER7` on 2026-07-25.

---

## ROLLBACK PROTECTION

| Field | Value |
|---|---|
| **Rollback identifier** | `rollback/VISREG1-living-home-visual-registry-20260725` |
| **Resolves to** | `ec2014d7a7d351f91111a0cb28e2673fd248a19e` |
| **Type** | Annotated tag |
| **Created** | **Before any file was written or changed** (STEP 1) |
| **Pre-task dirty-tree snapshot** | `1c2a4de440a6849289b5a5cfce082214f99dba82` (`git stash create`) |

The snapshot captures **tracked modifications only**. The working tree carried pre-existing `LARDER6` / category-first modifications and untracked files at session start; **none was touched by this work**, and untracked files are captured by neither the tag nor the snapshot. This is recorded rather than tidied, because tidying another workstream's tree inside this one would be exactly the silent scope widening the Scope Lock exists to prevent.

---

## REFERENCE DOCUMENTS READ

**Governing architecture** (Architecture Bootstrap, STEP 2 — `docs/architecture/README.md` read in full across both pages):

`ARCHITECTURE_PRINCIPLES.md` (all eight principles, in full) · `README.md` (the complete index and every descriptive paragraph) · `ENGINEERING_WORKFLOW.md` (STEP 5 mandatory sections, the Architecture Compliance Checklist, the AI Architecture Compliance block, the Experience & UI Governance block, the Implementation Completion Report) · `REPOSITORY_CONVENTIONS.md` (§ 1–§ 4) · `THA_CRAFTSMANSHIP_CONSTITUTION.md` § 9–§ 10 (the Completion Rule) · `LIVING_LARDER_ASSET_LIBRARY.md` (`ASSET1` — Purpose, the Library Principle, the 21-dimension Specification Frame, the Feeling Standard, the Canonical Style, the eight category headings, *How This Library Is Used*, The Permanent Promise) · `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (`LIVINGHOME2` — the three-register model, `ED1`–`ED12`, § 4.3's classification test, § 5.1 placement exclusions, § 9.10 the forgery, § 10.3 register requirements, § 10.4 phases) · `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (`LIVINGHOME1` § 10 asset governance) · `LIVING_HOME_DESIGN_CONSTITUTION.md` (`LHDC1` — all 23 section headings, § 19–§ 21) · `LIVING_LARDER_ARCHITECTURE.md` (`LARDER5`) · `HOME_OWNER_ARCHITECTURE.md` (`HOMEOWNER1`) · `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (`UIOWN1` — the assembly-document shape) · `CAPABILITY_BOUNDARY_ASSESSMENT.md` (`CAPBOUND1` — the Attribution Test, the Stop Test, `CB3`/`CB4`/`CB6`/`CB9`/`CB10`).

**Implementation architecture:** `docs/implementation/house/EXP3_LIVING_HOME_ASSET_SYSTEM.md` in full (the two-register instrument, the five layers, the composition system, the manifest, § 7.4's verifier checks, the seasonal double key, the artwork pipeline, the six phases, the three verdicts).

**Investigations:** `docs/investigations/house/LARDER7_LIVING_LARDER_VISUAL_CONCEPTS.md` § 3 (the three surfaced divergences, including § 3.3's four-entry contradiction).

**Live code and data, read directly — not inferred:**

- `docs/implementation/assets/house-asset-register.json` — 12 rows, their schema, citations and notes
- `client/src/components/layout/living-details-manifest.ts` (1,024 lines) — the header ownership declaration, `Realm`, `LivingDetailSpec`, the empty `livingDetailsManifest`, `JarApprovalStatus`, `JarAvailabilityState`, `JarVisualApproval`, `LarderAssetLifecycleState`, `deriveJarAvailability`, `promoteJarToCandidate`, `recordJarHomeOwnerApproval`, `applyJarChecksumDrift`, `LARDER_JAR_SHARED_SPEC`, `JAR_PROHIBITED_USES`, `canonicalFoodMappings`, `VISUAL_GAP_GREEN`, the produce register
- `client/src/lib/living-home/dressing-register.ts` — the header, `SeasonKey`, `RoomId`, `CommittedRegion`, the six item ids, the inexpressibility discipline
- `scripts/ci/verify-living-home-assets.ts` — its referenced paths and register owners
- The asset tree: 46 files under `client/src/assets/living-home/`; 23 under `attached_assets/THA_Living_Larder_Assets/`

---

## THE `CRAFT1` § 9 ADMISSION TEST — answered before writing, not after

`THA_CRAFTSMANSHIP_CONSTITUTION.md` § 9 closed architectural design work: *"New architecture should only be introduced if a genuine architectural conflict is discovered… Absent such a conflict, the answer to 'should we write new architecture for this?' is now, by default, **no**."*

This is the gate a request for new governing architecture must clear first, and it was answered **before a word of the registry was written**. Three findings, each a fact in this repository:

1. **Two governing owners in true contradiction** — four `ASSET1` entries (H1 pendant · H2 under-shelf · H8 flowers · I7 evening) that `LARDER5` and `LIVINGHOME2` forbade the day after they were written, recorded by `LARDER7` § 3.3 and unamended at either owner. `CRAFT1` § 9's stated admission condition, verbatim.
2. **A genuinely unowned concern** — interaction-state assets. `LARDER3` owns the behaviour, `LARDER5` the verbs, `UIA` the motion; **no document owns the visual states**, no register has a field for one, and no row exists for any.
3. **A scope conflict** — `ASSET1` declares itself *"subordinate to the Larder canon"* while its own *How This Library Is Used* item 5 makes it the specification owner for every future room's assets. Both cannot hold.

**Verdict: admissible.** Recorded in the governing document at § 2 with the same evidence, so the next reader can check the reasoning rather than trust it.

**What the test also produced — a finding that changed the document's shape.** The survey performed for it found that the visual layer is **not ungoverned**: three registers are live, 46 of 46 asset files are registered, and `verify:living-home-assets` passes **31/31**. Had that not been checked, this document would have been written as though it were filling a void, and it would have created a rival register out of a false premise. It was checked, and the registry is instead written as an **orthogonal kind axis** over an existing variance axis that it takes nothing from.

---

## CHANGES MADE

| # | File | Change |
|---|---|---|
| 1 | `docs/architecture/LIVING_HOME_VISUAL_REGISTRY.md` | **NEW** — the governing document (`VISREG1`) |
| 2 | `docs/implementation/house/LIVING_HOME_VISUAL_REGISTRY_IMPLEMENTATION.md` | **NEW** — this report |
| 3 | `docs/architecture/README.md` | **MODIFIED** — one table row + one descriptive paragraph in Experience Governance (mandatory: governing architecture must be indexed in its `README.md`; `INTA1` § 4.1's *invisible by navigation* defect) |
| 4 | `.engineering/session/runs/VISREG1_Living_Home_Visual_Registry.md` | **NEW** — session record |
| 5 | `.engineering/session/CURRENT.md` | **MODIFIED** — active-session dashboard row |

**No other file is touched.** No code, no schema, no migration, no token, no asset, no string, no route, no capability, no test, no register, no module.

### What the governing document contains

- **§ 0** Experience Constitution Check, answered before design began (8 dimensions)
- **§ 1** Mandate — the one sentence; the three things owned; the thirteen-row table of what is **not** owned, each cited to its owner
- **§ 2** The `CRAFT1` § 9 admission test with its three findings and the verified current-state survey
- **§ 3** The two axes — variance (`EXP3`'s) and kind (this document's) — and the Principle 2 scope test they pass; the `UIOWN1` precedent
- **§ 4** The five preserved principles, each stated as what it means for a visual asset
- **§ 5** The six canonical domains, each across the nine required dimensions
- **§ 6** The four mechanical boundary tests, including § 6.3 Living Asset vs Environmental Dressing
- **§ 7** The production lifecycle, its mapping onto live states, and the four required clarifications
- **§ 8** House-wide reuse, naming and approval
- **§ 9** How future rooms compose from the registry, with the per-room table
- **§ 10** The fourteen rules (`VR1`–`VR14`)
- **§ 11** Relationship to existing architecture — position, `ASSET1`, `EXP3`, `LHDC1`/`HOMEOWNER1`, `CRAFT1`
- **§ 12** Seven inherited open items, surfaced and unresolved
- **§ 13** What the document does not do — including its own disclosed enforcement gap
- **§ 14** Compliance

---

## ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  One asset entity, one id, one domain, one register, one file (VR1, VR11, VR12).
  Three id conventions are already live across the three registers; they are
  recorded as divergent and deliberately NOT retrofitted (VR13), because a rename
  is a checksum event that would invalidate recorded Home Owner approvals to gain
  a household nothing.

☑ One owner per fact
  The document owns exactly three things (§ 1.2) and cites everything else
  (§ 1.3). The two axes pass Principle 2's scope test explicitly: variance
  ("what makes it change?") and kind ("what kind of thing is it?") cannot
  disagree, because they are not answering the same question.

☑ No duplicate entities
  Nothing is created. No asset, register, module, record, schema, field or state
  is added. VR4 ("one subject, two assets" across registers) is not duplication —
  it is LIVINGHOME2 § 9.10's forgery made unforgeable at the file level, and its
  alternative is a classification that cannot be verified.

☑ No duplicate ownership
  ASSET1 keeps every one of its 21 specification dimensions; LHDC1 keeps the
  admission standard; LIVINGHOME2 keeps ED1–ED12 and its § 4.3 classification
  test (cited, never restated); EXP3 keeps every register shape; HOMEOWNER1 keeps
  approval; UIA keeps tokens, motion, state presentation and § 17 admission.
  Nothing is taken from any of them. § 11.3 states the direction explicitly: if a
  shape here and a shape in EXP3 disagree, EXP3 wins and this document is
  corrected.

☑ No duplicate state
  No state exists to duplicate. VR7 is explicit: no runtime state, field, module
  or register is introduced. The five lifecycle names are vocabulary over states
  that already execute — planned → candidate → approved, with availability
  DERIVED by deriveJarAvailability() and never stored as an independent fact.

☑ Extends existing architecture
  Extends EXP3's variance axis with an orthogonal kind axis; extends ASSET1's
  Larder-scoped specification frame to a house-wide ownership map without
  amending one byte of it; follows UIOWN1's assembly-document shape (own the map,
  cite everything else) exactly, and says so.

☑ Progressive enrichment where appropriate
  The lifecycle IS the enrichment chain for a knowledge-shaped entity:
  identity → specification → candidate bytes → recorded approval → production.
  Each stage renders honestly at the stage reached. This is not theoretical — 20
  of 27 Larder jar masters sit at Candidate today, visible in the register and
  absent from the product, which is enrichment behaving correctly.

☑ Knowledge domain compliance
  N/A — no knowledge domain is introduced or extended, and no §1.1 row is filled.
  VR3 is the explicit refusal to become one: an ingredient presentation asset
  DEPICTS and never STATES. Food identity stays Domain 2's, nutrition Domain 1's,
  allergens and freshness their owners'. The live jar records already carry
  canonicalFoodMappings and a prohibitedUses list containing
  "nutrition-quality-or-freshness-claim" — VR3 generalises that existing
  instrument rather than inventing a rule.

☑ Honest gaps over fabricated information
  Absence renders as absence (§ 4). Herbs and household plants have no canonical
  owner, so they have no lawful binding and therefore no lawful asset — stated
  plainly (§ 12.4) rather than solved by minting a domain in a document that is
  not its home. VISUAL_GAP_GREEN is cited as the existing gap instrument, not
  reinvented. All seven open items at § 12 are recorded unresolved.

☑ No permanent synchronisation bridge
  None. Nothing keeps two owners in sync; the two axes are independent and
  neither derives the other. Checksums are CI-time verification, not sync.

☑ Evolution over replacement
  Nothing is replaced, so no retirement plan is owed — stated as such rather than
  left implicit. § 7.4 restates nothing: it cites retire-on-introduction and
  names the nine predecessors already archived under it at
  docs/reference-assets/rejected/living-larder/.
```

---

## AI ARCHITECTURE COMPLIANCE

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------

No AI surface, capability, intent, prompt, Context View or Companion behaviour is
created, consumed, altered or designed. No runtime code reads this document, so it
cannot reach a language model as grounding; it composes no Context View (INT17
retains ownership of every byte the model reads) and adds no product knowledge a
Companion could speak.

✓ Uses the canonical Intelligence Platform ......... N/A — no AI surface touched
✓ Uses the Capability Registry ..................... N/A — none registered/consumed
✓ Uses the Intent Engine ........................... N/A — no intent involved
✓ Reuses existing business services ................ N/A — no service touched
✓ Does not create another assistant ................ CONFIRMED — none created
✓ Does not duplicate conversation state ............ CONFIRMED — none touched
✓ Uses registered capabilities only ................ N/A — none consumed
✓ Uses permission-aware access ..................... N/A — no access path exists
✓ Produces honest gaps rather than fabricated knowledge
    CONFIRMED — § 4 and § 12. A visual asset observes the way a window observes
    (GEA21); this document gives no image a voice, and GEA22 keeps interpretation
    the Companion's.
```

**No check fails. Nothing stops.**

---

## EXPERIENCE & UI GOVERNANCE COMPLIANCE

- **Experience Constitution Check (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 18.2)** — answered **first, and before design began**, at § 0 of the governing document, across all seven+one dimensions: hospitality · outcome · weight · voice · ownership · agency · restraint · layer. ✅
- **The per-implementation stack is deliberately not claimed.** This is a governance-only change: no pixel ships, no component changes, no surface is added. The UX Governance Checklist, the UI Governance Checklist, the Experience Review Questions, the Experience Test, the Blueprint Checks and the Design Character Check bind **each future asset admission at its own gate** — the only honest place a checklist about shipped pixels can pass. This follows `EXP3`'s recorded position for the identical situation rather than restating it.
- **Conflicts found during drafting were resolved in the governing architecture's favour and recorded, never legislated:** the four `ASSET1` entries (§ 12.1), the `ASSET1` scope claim (§ 12.2), the three id conventions (§ 12.3), the herb-owner gap (§ 12.4). None is amended.
- **`UIA` § 17** (one owner per visual concern · retire on introduction · admission with register entry) binds unchanged and is the mechanism `VR11`/`VR12` cite rather than duplicate.

---

## PRODUCT REGISTRY IMPACT

The test: **would a person's answer to "what is THA?" be different after this change?** **No.** No user-facing surface, capability, route, dialog, setting, claim or benefit exists, changes or retires. A household cannot perceive this change by any means.

- Registry affected: **NO**
- Entries created: **NONE**
- Entries updated: **NONE**
- Entries retired: **NONE**
- Any entry set to `public` or `household`: **N/A**
- Product knowledge written into a prompt, template or fallback string: **NO** (Rule `PKR27` — no prompt, template or string is touched)

---

## ADOPTION REGISTER IMPACT

The test: **does this change introduce, adopt or retire a client-side building block?** **No.** No component, hook, token, utility class or shared pattern is added, changed or retired.

- Register affected: **NO**
- Owners created / adopted: **NONE**
- Predecessors retired: **NONE**
- Rival ceilings raised: **NONE**
- Exemptions added: **NONE**
- `npm run adoption:check`: **run — 101 passed · 0 notices · 10 failed. The 10 failures are pre-existing and none is introduced by this change.** Reported honestly rather than as a PASS.

**The ten failures, and why they are not this change's:** one owner below its declared importer floor (`quantity-string`), one rival ceiling that has risen (`button-primitive` — 451 raw `<button>` elements against a ceiling of 442), one authored-but-unadopted owner (`tone`), and seven authored-but-unadopted orphan modules (`SpellSuggestions.tsx`, `UltraProcessedNoticeModal.tsx`, `food-knowledge-modal.tsx`, `whole-food-selector.tsx`, `food-confidence.ts`, `json-utils.ts`, `source-helpers.ts`). Every one is a **client-side** finding; this change adds, removes and modifies **zero** client-side files, which is proven mechanically by Manual Verification step 6 (`git diff` over `client/` is empty). All ten files are tracked and unmodified in the working tree, so the findings pre-date this session entirely.

**Why this is reported rather than fixed:** the `ADOPTION REGISTER COMPLIANCE` gate binds *"every implementation that adds, changes, or retires a client-side building block."* This implementation does none of those, so the gate does not bind it — and adopting or deleting seven unrelated modules inside a documentation change would be precisely the silent scope widening the Scope Lock exists to prevent. **The failures are recorded here so they are not lost**, and they are the adoption register doing its job: `UIA` § 17's *authored-but-unadopted must be impossible to hide.* They belong to their own act.

---

## DOMAIN IMPACT

No data domain is touched. No domain in the Source of Truth Register gains, loses or changes an owner. Domain 30 (pantry staples), Domain 2 (canonical food), Domain 1 (knowledge), Domain 11 (season) and Domain 15 (shopping) are all **cited** by the governing document and **read by none of it** — it contains no code.

---

## DEFINITION OF DONE

**What success looks like**
- `docs/architecture/LIVING_HOME_VISUAL_REGISTRY.md` exists, defining the Living Home Visual Registry as the single owner of the *kind* classification of every visual asset; the six canonical domains, each across all nine required dimensions; the four boundary tests including the explicit Living-Assets-versus-Environmental-Dressing distinction; the five-stage production lifecycle with its four clarifications; the future-rooms composition section; and the fourteen rules.
- It **extends** existing architecture and replaces none: `ASSET1`, `LHDC1`, `LIVINGHOME1`, `LIVINGHOME2`, `LARDER1`–`LARDER5`, `EXP3`, `UIA` and `HOMEOWNER1` are all byte-untouched.
- One entity · one owner · one source of truth · progressive enrichment · honest gaps are each preserved and stated (§ 4).
- The document is indexed in `docs/architecture/README.md`.
- Both files are committed with the rollback identifier reported.

**What must not break**
- **Nothing runtime.** No code, schema, migration, token, asset, string, route, capability, component or test changes.
- `npm run verify:living-home-assets` continues to pass **31/31**, unchanged.
- `.engineering/scripts/repo-structure-verify.sh` passes.
- Every cited owner remains byte-identical.
- Every asset file, register row, checksum and recorded Home Owner approval is untouched — in particular, **no approval is invalidated**, which a rename would have done (`VR13`).

**Manual test steps**
1. `git diff --stat <rollback>..HEAD` shows only `docs/` and `.engineering/session/` paths — no `client/`, `server/`, `shared/`, `scripts/`, `migrations/`.
2. `npm run verify:living-home-assets` → PASS, 31/31, identical to the pre-change run.
3. `bash .engineering/scripts/repo-structure-verify.sh` → PASS.
4. `git diff <rollback>..HEAD -- client/ server/ shared/ scripts/ migrations/` is **empty**.
5. Every file path and code symbol cited in the governing document's § 2.4 and § 7.2 exists in the tree as stated.

---

## DATA IMPACT

- **Reads existing data:** **NO** — documentation only. No query, no module, no runtime read path exists.
- **Writes new data:** **NO** — no schema, no table, no column, no migration, no household data of any kind.
- **Changes meaning of existing data:** **NO** — every register row, checksum, approval record and lifecycle state means exactly what it meant before. The registry *names* what already exists; it renames nothing and revalues nothing.
- **Requires backfill:** **NO** — and nothing could be backfilled, since no field is added.

---

## TRUST CHECK

- **Could this mislead the user?** **No.** No household can perceive this change by any route. Indirectly it reduces the risk of misleading: `VR3` states as law that a presentation asset depicts and never states, so a picture of a jar can never become the channel by which a household learns something about food that its owner did not say.
- **Could this fabricate certainty?** **No.** The document's § 2.4 survey is the opposite instinct: it went looking for an ungoverned visual layer, found a governed one passing 31/31 checks, and **recorded that finding against its own premise** rather than writing the document it had set out to write. Every asset count, register row, lifecycle state and check result in it was read from the live tree.
- **Is anything guessed but shown as real?** **No.** Every claim about the current state is cited to a file, a register row or a verifier output. The four things that are genuinely unknown — the herb owner, the `ASSET1` contradiction, `LARDER7`'s unruled concepts, `EXP3` Verdict 3 — are recorded **as unresolved open items** (§ 12) and not decided.
- **What happens if the system is wrong?** For this change: a documentation defect, corrected by amendment at its owner, with no runtime consequence and no household exposure. For the classification it establishes: a mis-domained asset surfaces at its next admission, where the domain owner and the register owner must both be named — the defect is caught where it is cheap.
- **No architectural duplication introduced:** **YES** (none).
- **No new source of truth created:** **YES** — the registry is the single owner of a classification **nobody previously held**, and owns no fact any existing owner holds. It classifies; it never authorises.
- **No runtime behaviour altered (governance-only work):** **YES** — verified mechanically, not asserted (Manual Verification steps 2–4).

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/VISREG1-living-home-visual-registry-20260725` → `ec2014d7`
- **Pre-task dirty-tree snapshot:** `1c2a4de4` (`git stash create`, tracked modifications only)

**Files modified**
```
docs/architecture/LIVING_HOME_VISUAL_REGISTRY.md                          (new)
docs/implementation/house/LIVING_HOME_VISUAL_REGISTRY_IMPLEMENTATION.md   (new)
docs/architecture/README.md                                               (index row + paragraph)
.engineering/session/runs/VISREG1_Living_Home_Visual_Registry.md           (new)
.engineering/session/CURRENT.md                                           (dashboard row)
```

**Rollback commands**
```bash
git rm docs/architecture/LIVING_HOME_VISUAL_REGISTRY.md
git rm docs/implementation/house/LIVING_HOME_VISUAL_REGISTRY_IMPLEMENTATION.md
git rm .engineering/session/runs/VISREG1_Living_Home_Visual_Registry.md
git checkout rollback/VISREG1-living-home-visual-registry-20260725 -- docs/architecture/README.md
git checkout rollback/VISREG1-living-home-visual-registry-20260725 -- .engineering/session/CURRENT.md
git commit -m "Rollback VISREG1 Living Home Visual Registry"
```

**Verification after rollback**
1. `git diff rollback/VISREG1-living-home-visual-registry-20260725 -- docs/ .engineering/` is empty.
2. `npm run verify:living-home-assets` → PASS 31/31 (it passed before and after; rollback cannot change it, because no runtime surface was ever touched).
3. No runtime surface exists to verify — which is itself the point.

---

## ARCHITECTURE CONVERGENCE STATUS

**Not applicable.** This is not a 🔴 RED architectural implementation: no domain is contested, no duplicate owner is created or resolved, no store is replaced, and no convergence is claimed. The registry **converges nothing** — it classifies. The one convergence it touches (the two-orchard item, § 12.5) is inherited from `LIVINGHOME1` § 10.2, carried forward unresolved, with no deadline added and no side taken.

---

## SCOPE LOCK

**Implemented scope**
- The governing document `docs/architecture/LIVING_HOME_VISUAL_REGISTRY.md`.
- This implementation report.
- The `docs/architecture/README.md` index entry (mandatory for governing architecture).
- The session record and dashboard row.

**Explicitly excluded scope — deliberately not attempted**
- **All production assets.** No artwork created, commissioned, approved, promoted, retired, renamed or moved.
- **All room redesign.** `LARDER7`'s five concepts are untouched and unruled; no concept is selected.
- **All React, CSS, components, runtime code, schema, migrations, tokens, strings, routes, capabilities and tests.**
- **All register, module and record migration.** The jar and produce records stay at `living-details-manifest.ts`, the dressing items at `dressing-register.ts`, the House rows in `house-asset-register.json` — deliberately, so no second owner comes into existence.
- **All amendments to any governing document.** Not one owner is edited. In particular `ASSET1`'s four contradicted entries and its scope-claim sentence are **left exactly as they are** for their own owner to amend.
- **All id renaming** (`VR13`) — excluded on reasoning, not omission: a rename invalidates recorded checksum-bound approvals.
- **Any new verifier or automated check** — the enforcement gap is disclosed in the document itself (§ 13) rather than closed by a check that could assert presence but never correctness.
- **The herb/household-plant canonical owner** — the need is declared; the domain is not minted here.

**Suggestions recorded, not taken**
1. The seven open items at § 12 each name a smallest next action; none is performed.
2. The two-orchard convergence (`EXP3` Phase 1) remains the highest-value asset task in the house and should precede any new visual work.
3. Once `LARDER7`'s concept ruling exists, the natural next act is per-domain specification for the chosen concept's cold storage and vessel family — in that order, per `LARDER4`'s layered order.
4. A future `ASSET1` amendment could scope its § *How This Library Is Used* item 5 to the Larder and route future rooms to their own specification scope. That is its owner's call.

---

## IMPLEMENTATION COMPLETION REPORT

*(`CAPABILITY_BOUNDARY_ASSESSMENT.md`, `CB1`–`CB12`)*

- **Architecture Complete: YES.** Every requirement of the mission is delivered and bound to a rule: the registry defined as single owner (§ 1.1, `VR1`); extends rather than replaces (§ 11, and every owner byte-untouched); the five principles preserved (§ 4); all six domains defined across all nine required dimensions (§ 5.1–§ 5.6); Living Assets explicitly distinguished from Environmental Dressing (§ 5.5 table + § 6.3, resting on `LIVINGHOME2` § 4.3's test, cited); the five-stage lifecycle (§ 7.1) with its live mapping (§ 7.2); all four clarifications as numbered rules (`VR8`–`VR11`); the future-rooms section (§ 9). The `CRAFT1` § 9 admission test was answered *before* drafting, with evidence.

- **Engineering Complete: YES — and deliberately empty.** No engineering was in scope; the correct engineering output is zero changed lines outside `docs/` and `.engineering/`, verified mechanically rather than asserted. Commands that ran: `npm run verify:living-home-assets` (31/31 PASS, before and after), `bash .engineering/scripts/repo-structure-verify.sh` (11 PASS / 0 FAIL — after the README index entry it initially and correctly failed on), `npm run adoption:check` (101 passed / 10 failed — **all ten pre-existing and client-side; none introduced here**, recorded in full under Adoption Register Impact rather than reported as a pass), `git diff` scoped to every runtime directory (empty). **Not run, and why:** the test suite, typecheck and build — no code path is reachable from a Markdown file, and claiming a green build as evidence for a documentation change would be evidence of nothing.

- **Interaction Complete: N/A.** No behaviour is promised, so none is reachable or unreachable. The document explicitly declares that no runtime code reads it and none may (§ 1.3, § 13).

- **Existing Assets Used** — consumed rather than recreated: the House Register (`house-asset-register.json`) · the Life Register and jar/produce records and lifecycle law (`living-details-manifest.ts`) · the Dressing Register (`dressing-register.ts`) · `verify:living-home-assets` · `VISUAL_GAP_GREEN` · the rejected-predecessor archive · `ASSET1`'s 21-dimension frame · `LHDC1`'s admission standard · `LIVINGHOME2` § 4.3's classification test · `HOMEOWNER1`'s checksum-bound approval instrument · `UIOWN1`'s assembly-document shape · `CB9`'s external-artefact rule. **Every one is cited and none is copied** — the restate-no-rule discipline `LIVINGHOME2` and `LHDC1` established.

- **New Assets Required: NONE.** This is a classification document; it requires no artwork to be complete, and creating any would have violated its own Scope Lock.

- **Remaining Gaps: NONE.**

  No boundary was met. Every item at § 12 of the governing document is an **inherited open decision belonging to another seat** (the Home Owner, or another document's owner), not a boundary this implementation ran into — and the distinction is `CB6`'s: a decision routed to its owner is not a gap, and filing it as one would misattribute somebody else's pending judgement to a limitation of the work.

  For completeness, the one item that could be mistaken for a Model Capability Gap is not one: the governing document requires **no image**, so no image-generation capability was needed and none was missing. (The concept boards `LARDER7` recommends remain that workstream's Model Capability Gap, recorded there, unchanged and not re-owned here.)

- **Stop Test: CONFIRMED.** No remaining work independent of any gap was left unattempted. All six domains, all nine dimensions each, all four boundary tests, the full lifecycle, the rules table, the compliance blocks, the README index entry and this report are complete. Nothing was deferred for convenience.

---

## MANUAL VERIFICATION

Performed for this change:

1. **`git status` confirmed before work.** Pre-existing `LARDER6`/category-first modifications and untracked files recorded and left untouched; branch `claude-work`; `HEAD` = `ec2014d7`; level with `origin/claude-work`.
2. **Rollback protection created before any file was written** — annotated tag verified to resolve to `ec2014d7`; dirty-tree snapshot `1c2a4de4` created and its identifier recorded.
3. **`npm run verify:living-home-assets` — PASS, 31 checks run, 31 passed, 0 failed**, run *before* drafting (to establish the true current state, § 2.4) and *after* (to prove nothing moved). Identical output.
4. **`bash .engineering/scripts/repo-structure-verify.sh` — 11 PASS · 0 FAIL**, confirming the filing divergence was resolved correctly and no loose file was written to any folder root. *Its first run FAILED* — `unindexed: LIVING_HOME_VISUAL_REGISTRY.md` — because governing architecture must be indexed in `docs/architecture/README.md`. The index entry was added and the check re-run green. Recorded rather than presented as a first-time pass: the verifier caught a real omission, which is the verifier working.
5. **`npm run adoption:check` — 101 passed · 0 notices · 10 failed.** All ten are pre-existing client-side findings, enumerated under Adoption Register Impact; none is introduced by this change, which touches no client file (proven by step 6). **Not reported as a pass.**
6. **`git diff <rollback>..HEAD -- client/ server/ shared/ scripts/ migrations/` — empty.** This is the mechanical proof behind the "no runtime behaviour changed" claim; it is not asserted from intent.
7. **Every factual claim about the live tree was read from the live tree**, not inferred from documentation — including the finding that contradicted this work's own starting premise (§ 2.4: the visual layer is already governed and every asset file is registered), which was recorded rather than quietly dropped.
8. **Every governing document named as byte-untouched was confirmed absent from the diff.**

---

## USER ACCEPTANCE EVIDENCE

**State: Waiting for User.** This is a governance deliverable; acceptance is the Home Owner's review.

**Nothing in it requires an aesthetic judgement to be correct** — it classifies and sequences; it does not decide how anything looks. But three decisions it deliberately did **not** take are now visible in one place, and each is the Home Owner's or another owner's:

1. **The `ASSET1` contradiction** (§ 12.1) — H1, H2, H8 and I7 versus `LARDER5`/`LIVINGHOME2`. Two governing owners disagree, on the record, since 2026-07-24. **Recommended smallest next action:** a ruling at `ASSET1`'s owner on all four at once, since they share one cause (the room's one-morning, one-light law arriving after the specification).
2. **`LARDER7`'s five concepts remain unruled** (§ 12.6) — and cold storage, the vessel family and every interaction asset are downstream of that ruling. **This is the single largest unblocker in the visual layer**: producing any of them first would produce the wrong ones.
3. **Herbs and household plants have no canonical owner** (§ 12.4) — which makes the North Star's sill herbs unbuildable, lawfully, today. `LARDER7` flagged the same item; this document states the consequence in registry terms.

**Also for review:** the `CRAFT1` § 9 admission argument (§ 2) — the reasoning is recorded rather than assumed, precisely so it can be rejected. If the Home Owner judges that the three findings do not meet `CRAFT1`'s bar, the correct outcome is to roll this document back and route the three findings to their owners as amendments instead. The rollback identifier above makes that a single command.

---

*Rollback identifier: `rollback/VISREG1-living-home-visual-registry-20260725` → `ec2014d7`*
*Author of record: Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow*
*Date: 2026-07-25*
*Document ID: `VISREG1`*
