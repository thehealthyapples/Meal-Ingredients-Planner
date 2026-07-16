# DOC2 — NK1 Asserted A Safety-Relevant Field Is Stored And Authoritative — Implementation

**Status:** IMPLEMENTED — governing documentation only.
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Workstream:** `DOC2_NK1_Canon_Correction`
**Authority:** [`CONV1 — Architecture Convergence Programme`](../../investigations/governance/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md) § Tier 1, item `DOC-2`; § 7 phase **P1 — Correct the canon**.
**Governing architecture read:** `docs/architecture/README.md` (Architecture Bootstrap, STEP 2), `ARCHITECTURE_PRINCIPLES.md`, `REPOSITORY_CONVENTIONS.md`, `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`, `NK1`, `NK2`.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| **Rollback ID** | `rollback/DOC2-nk1-canon-correction-20260716` → `7d1dd2ce` |
| **Stash** | `DOC2_ROLLBACK: pre-implementation dirty-tree snapshot 2026-07-16` (`stash@{0}`, re-applied — tree preserved) |
| Created | **Before any file was touched** (STEP 1) |
| Working tree | Intentionally dirty — concurrent sessions (TIME3, HOME3, NORTH1/2, EXPCOMP1/2, ORCH1, LIFE1/2, CONV1) hold uncommitted work. The stash was **immediately re-applied**, so no concurrent session's tree was destroyed |
| Files this workstream touched | **1 governing document + this report.** Nothing else |

**To roll back:** `git checkout rollback/DOC2-nk1-canon-correction-20260716 -- docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`

---

## 1. WHAT DOC-2 WAS, AND WHAT IT WAS NOT

`DOC-2` is a **documentation convergence**: a governing document was **factually wrong about the system it governs**.

**This was not a law ahead of its platform.** The distinction is the whole point of the item, and CONV1 classifies it as a defect class of its own:

> *"A law ahead of its platform costs nothing but patience. A false inventory costs trust the moment somebody believes it."*

The recent convergences all resolved as *"the law was right; the platform was behind it"* (TIME1 § 13, TIME3 § 18) or *"the canon is right; the render is wrong"* (NORTH2 § 1). **`NK1:139` was neither.** It did not under-claim and wait for the platform — it **over-claimed *authority* over a safety-relevant field that has never existed**.

**A correction, not an amendment. No rule changed, because no rule was wrong — the inventory was.**

---

## 2. DOCUMENTS UPDATED

| Document | Sites | Nature |
|---|---|---|
| [`docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`](../../architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md) | **4** — `:73`, `:139`, `:418`, `:535` | 3 false-inventory corrections + 1 citation resolution |

**One document. 22 insertions, 4 deletions.** No application code, no schema, no migration, no runtime behaviour, no other governing document.

Each correction follows the house style `DOC-1` established: the **original text is quoted and preserved inside the correction note**, so the error stays legible rather than being silently erased.

---

## 3. INACCURACIES CORRECTED

### 3.1 `NK1:73` — the Plane 2 scope claimed two facts, on two owners, that do not exist

| | |
|---|---|
| **Was** | *"\| **Eater Composition** \| Who eats, **age, stage** \| DB `household_eaters` + `household_members` \|"* |
| **Now** | *"\| **Eater Composition** \| Who eats \| DB `household_eaters` + `household_members` \|"* + correction note |

**Neither named owner holds either fact.** `household_eaters` (`shared/schema.ts:1158-1168`) is `id`, `householdId`, `displayName`, `userId`, `defaultDietTypes`, `hardRestrictions`. `household_members` (`shared/schema.ts:1141-1152`) is the membership record — `role`, `status`, `joinedAt`, `invitedByUserId`, `leftAt`.

### 3.2 `NK1:139` — a coverage audit asserted coverage of a fact never held, and graded it *Authoritative*

| | |
|---|---|
| **Was** | *"\| **Eater Composition** \| DB `household_eaters` \| Name, **age**, dietary restrictions \| **Authoritative** \|"* |
| **Now** | Coverage states only what the table holds; maturity qualified to **"Authoritative for the facts it stores"**; the absent facts moved to the **Gap** column, where they belong |

**The most dangerous of the three** — this is a table whose entire purpose is to state what coverage exists *today*, and it is the line CONV1 and LIFE1 both cite. The failure mode is asymmetric: an engineer writing a per-eater age *rule* finds the gap at implementation; an engineer writing a per-eater **safety** rule that *assumes* the column may not find it until it is live — because **the honest failure mode of a missing field is `undefined`, and `undefined` fails open.**

### 3.3 `NK1:535` — a launch criterion presented a per-eater age as settled design

| | |
|---|---|
| **Was** | *"- [ ] **Eater profile complete:** Name, **age**, hard restrictions, dietary pattern, goals (future) stored per eater"* |
| **Now** | The criterion no longer names an age + a note recording the gap **and explicitly declining to close it** |

**This site needed the most care, and it is the one where an over-eager correction would itself have become a defect.** Unlike `:73` and `:139`, this is an **unticked target**, not a present-tense claim — so it was not false in the same way. But it presented a per-eater age as a settled part of the launch profile, and could never have been ticked as written.

**The correction removes the word and decides nothing.** Deleting "age" records the platform as it is; it does **not** rule that THA may never hold an age. Whether THA should ever store one — and under what consent, retention and parental-authority model — **is not decided here, and is not decided anywhere in the canon today.** Ruling either way would have been this item authoring law it has no standing to write.

### 3.4 `NK1:418` — the canon's only per-child prohibition cited a section by number, with no document

| | |
|---|---|
| **Was** | *"every **§6.3** prohibition (no diagnosis, no dosing, no inferral, no per-child signals) covered by structural tests"* |
| **Now** | *"every prohibition of `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` **§ 6.3** (*What signals may never do* — …)"* + correction note |

**Resolved, not removed — and not invented.** See § 4.1: this is the one place this item corrects its own instructions.

---

## 4. VERIFICATION COMPLETED

### 4.1 The one place this item corrects `CONV1` and `LIFE1` — reported, not silently propagated

**`CONV1 DOC-2` and `LIFE1 § 4.1` both state that the `§6.3` prohibition points at a section that does not exist.** CONV1: *"the canon's only per-child prohibition cites a section that does not exist"*. LIFE1 § 4.1 is titled *"The prohibition that points at nothing"* and concludes the canon's sole position on per-child intelligence is *"don't — deferred to 2029, **with the reasoning missing**"*.

**Verified against the canon: this is not so. The section is real, and the reasoning is not missing.**

| Claim | Finding |
|---|---|
| *"NK1 has no numbered sections"* | ✅ **True.** Verified against the complete heading list — named headings throughout |
| *"§6.3 does not exist"* | ❌ **False.** [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md:225`](../../architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) is `### 6.3 What signals may never do` |
| *"the canon's only per-child prohibition"* | ❌ **False.** `:231` — *"Concern a child — signal integrations are adult-eater-only, **structurally**"* — is a live, owned prohibition |
| *"the reasoning missing"* | ❌ **False.** `§ 6.4` there is the regulatory posture (UK MHRA / EU MDR) the prohibition rests on |

**Why both investigations reached the wrong conclusion: the check was scoped to the wrong document.** LIFE1 verified — correctly and rigorously — that `6.3` occurs exactly once *inside NK1*, in the reference itself, and inferred from NK1's lack of numbered sections that the target did not exist. **The search never left the file.** But NK1 already cites this sibling architecture's `§6` in exactly this style elsewhere (`:155`), and that document's own Phase 4 row (`:298`) carries **the sentence `NK1:418` was copied from** — *"every §6.3 prohibition covered by structural tests"*. **The document name was dropped in the copy. The pointer was mis-cited, never orphaned.**

**This materially improves the finding.** LIFE1 recorded the platform's position on per-child intelligence as a **silence** — a prohibition with no reasoning, which it then deliberately declined to fill. It is not a silence: it is an **owned, reasoned, structural prohibition** in the Food Intelligence architecture. `DOC-2`'s convergence strategy offered *"resolve **or** remove"*; **resolve was available, and is strictly better than remove** — removal would have deleted the only pointer to a real safety rule.

**Nothing was invented.** No `§6.3` was created in NK1; no prohibition was written; the existing parenthetical gloss is preserved verbatim rather than expanded, because restating a rule creates a second owner of it. This item **cites** the owner and restates none of it.

> **The investigations are history and are not edited** (`REPOSITORY_CONVENTIONS.md` § 3 — investigations are point-in-time analysis). LIFE1 § 4.1 and CONV1 `DOC-2` keep their text; this report is the correction of record, and it is filed rather than propagated silently.

### 4.2 Verified before assertion — claims re-derived from live code, not inherited

| # | Claim | Method | Result |
|---|---|---|---|
| V1 | `household_eaters` has no age column | `shared/schema.ts:1158-1168` read in full | ✅ 6 columns; no age, no stage |
| V2 | *"there never has been"* | Original `CREATE TABLE`, `server/migrations/runner.ts:767` | ✅ Same six columns at creation — no age ever declared |
| V3 | `household_members` holds no age/stage either | `shared/schema.ts:1141-1152` | ✅ Membership record only — **`NK1:73` was wrong about *both* owners it named** |
| V4 | No code reads an eater age | Repo-wide grep across `client/src`, `server`, `shared` | ✅ Zero references — the false claim had **no live consumer** |
| V5 | The three named sites are the only ones | Repo-wide sweep of NK1 for `age`/`stage`/`child`/`birth` | ✅ Exactly `:73`, `:139`, `:535` — **CONV1's inventory was complete** |
| V6 | `§ 6.3` exists and carries all four prohibitions | `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md:225-231` read | ✅ All four present (§ 4.1) |
| V7 | No bare `§6.3` survives in NK1 | Post-edit grep | ✅ Every occurrence now names its document |
| V8 | Markdown tables intact | Pipe-count on `:73` (4-col) and `:141` (5-col) | ✅ Column counts preserved |
| V9 | No code, schema or behaviour touched | `git diff --stat` | ✅ **1 file: NK1. 22 insertions, 4 deletions** |

> **V5 is worth naming.** `DOC-1` found four sites named and **eight** requiring correction, and reported the expansion rather than hiding it. `DOC-2`'s named inventory proved **exactly complete** — three sites, three corrections. The programme's citation of this item was accurate.

### 4.3 Gates

| Gate | Result |
|---|---|
| `repo-structure-verify.sh` — `docs/` rules | ✅ **PASS** — implementation filed by workstream, no loose files, no duplicates |
| `repo-structure-verify.sh` — root | ⚠️ **PRE-EXISTING FAIL, not this item's** — `stray: .glibcheck.txt`, `stray: .libdirs_uxhome.txt`. Both untracked and **present in the working tree before this session began**. Not created, not touched, and **not removed** by `DOC-2` — they belong to a concurrent session |
| Application gates (typecheck / tests / `verify:publication`) | **Not applicable and not run** — this item changed prose in one Markdown file. No code path, no publication contract, and no runtime surface exists to exercise |

---

## 5. CONFIRMATION: THE CANON NOW REFLECTS THE CURRENT PLATFORM

**Confirmed, for the scope `DOC-2` defines.**

`NK1` no longer asserts that THA knows anyone's age.

- **It claims no fact the platform does not hold.** Every remaining occurrence of *age* in `NK1` is either a quotation of the original error inside a correction note, or an explicit statement that the fact is **absent** — recorded in the **Gap** column, which is what that column is for.
- **It over-claims no authority.** *Authoritative* now qualifies only the facts `household_eaters` actually stores.
- **Its per-child prohibition resolves.** A reader following `NK1:418` now arrives at a real, owned, reasoned section instead of nothing.
- **Its silence is honest.** The absence of an age is stated as a gap, and the question of whether one should ever exist is left open **and visibly open**.

**The specific harm `DOC-2` named is closed:** an engineer reading `NK1` today cannot come away believing a per-eater age is stored and authoritative, and so cannot write a safety rule against a column that does not exist — the failure whose honest mode is `undefined`, and `undefined` fails open.

**Scope of this confirmation.** It covers `NK1`'s inventory of the eater profile and its `§6.3` citation. It is **not** a statement that the whole of `NK1` is now accurate against the platform (see § 6.2), nor that the canon as a whole is converged — CONV1 tracks that, and `DOC-3`, `DOC-4` and `OWN-5` remain open in phase P1 alone.

---

## 6. WHAT THIS ITEM DELIBERATELY DID NOT DO

### 6.1 The refusals

| Not done | Why |
|---|---|
| **Add an age / DOB / life-stage column** | `DOC-2` is a documentation convergence. Adding the field would implement the very thing the document was wrong to claim |
| **Rule that THA must never store an age** | Equally a decision. The canon does not hold one; this item does not create one (§ 3.3) |
| **Write the `§6.3` prohibition into NK1** | Filling a silence — and a second owner of a rule that already has one. It is **cited**, not restated |
| **Implement `OWN-1`, or touch the Person family** | Out of scope; `OWN-1` is P4 and gated on all of P1 |
| **Edit `LIFE1` or `CONV1`** | Investigations are history and are never edited. Their § 4.1 / `DOC-2` claims are corrected **in this report** (§ 4.1) |
| **Change any application code, schema, or runtime behaviour** | Explicitly forbidden by the mission, and unnecessary: the false claim had zero live consumers (V4) |
| **Remove the two stray root files** | Not this item's, and not this item's session's (§ 4.3) |

### 6.2 One inaccuracy found and deliberately left — reported, not fixed

**`NK1`'s status block is stale.** It reads *"**Status:** Investigation and design (no implementation)"* and closes with *"For promotion to governance, see: docs/architecture/ (NK1 promotion)"* — while sitting **in** `docs/architecture/`, which `README.md:6` declares governing, having been promoted under `GOV2` (2026-07-07).

**Left untouched, deliberately:**

1. **It is a different defect class.** `DOC-2` is about NK1 being wrong about *the platform it governs*. This is NK1 being wrong about *its own governance status* — a promotion artefact, not a false inventory.
2. **It is systemic, not NK1's.** **`NK2` carries the identical block, verbatim.** `GOV2` promoted both and updated neither. Correcting NK1 alone would desynchronise a pair that is currently at least consistently wrong, and correcting NK2 is outside *"the NK1 documentation"*.
3. **The precedent points this way.** `DOC-1` expanded scope only where **the same defect** appeared at unnamed sites. Adopting a **new** defect class under a narrow mandate is not that.

> **Recommended as a `DOC` -class follow-on** (`NK1` + `NK2` status blocks, one item, docs-only). It is exactly the `KC14` currency failure `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` names, and the same shape as `DOC-4`. **Not silently folded in; filed here so it is not rediscovered a fourth time** (`PKR1` Risk R7).

---

## 7. NEXT CONV1 ITEM

> ### **`DOC-3` — The false `dayOfWeek` comment sits on the fabricated-date line**

**Why it is next.** CONV1 § 7 P1 (*"Correct the canon"* — *"free, and it unblocks Tier 2"*) bundles `DOC-1` · `DOC-2` · `DOC-3` · `DOC-4` · `OWN-5`. **`DOC-1` and `DOC-2` are now closed**; CONV1's order, restated by `DOC-1` § 8, puts **`DOC-3` next** — *"one comment, out of band"* — then `DOC-4` (the Product Knowledge status block), then `OWN-5`.

**What it is.** `server/routes.ts:11371` — `// dayOfWeek: 0 = Monday in plannerDays convention`. **False**: Rule `HT8` declares `0 = Sunday`, and `routes.ts:7431` contradicts the comment **in the same file**. It is one line, it has no dependencies, and CONV1 is explicit that it must **not** be sequenced behind Household Time (`OWN-4`) — the comment is wrong today regardless of when the module lands. Risk is low in itself, but CONV1 names it **the seed of two live defects** (`BEH-4`, `BEH-5`).

> **Note for `DOC-3`:** it is the one P1 item that edits **application code** (a comment). The mission constraint *"do not change application code"* was `DOC-2`-specific, not a standing rule.

**`OWN-1` must not start until P1 lands.** CONV1 § 7: *"No implementer should start `OWN-1` against a canon holding four positions."* The canon no longer holds four positions on diet (`DOC-1`), and no longer claims an age it does not have (`DOC-2`) — **but `DOC-3`, `DOC-4` and `OWN-5` remain open, and P1 is not complete.**

---

## 8. COMPLIANCE

- **Architecture Bootstrap (STEP 2):** `docs/architecture/README.md` read before any change.
- **STEP 1 — Rollback:** created **before any file was touched**; identifier recorded above; concurrent trees preserved.
- **`REPOSITORY_CONVENTIONS.md`:** report filed under `docs/implementation/governance/` by workstream — `repo-structure-verify.sh` passes on every `docs/` rule.
- **Core Principle 2 (one owner per fact):** no second owner created. `§ 6.3` is **cited**, never restated.
- **Core Principle 6 (honest gaps over invented facts):** this is the item's whole content — three invented facts replaced with the honest gap.
- **Experience & UI Governance / Product Registry Compliance:** **not applicable** — no user-facing surface, no client building block, and no product-knowledge entry is created, changed, or retired by a correction to an internal architecture document.
- **Deviations:** one — reported in § 4.1, not silently applied.

---

*Implementation completed: 2026-07-16*
*Rollback: `rollback/DOC2-nk1-canon-correction-20260716` → `7d1dd2ce`*
*Next CONV1 item: `DOC-3` — the false `dayOfWeek` comment (P1)*
