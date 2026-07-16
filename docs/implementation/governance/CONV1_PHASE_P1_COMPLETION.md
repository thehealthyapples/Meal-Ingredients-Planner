# CONV1 Phase P1 — Correct the Canon — Completion Milestone

**Status:** MILESTONE — a completion record for CONV1 phase **P1**. **Nothing implemented by this document.** No application code, no schema, no governing architecture changed.
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Workstream:** `CONV1_Phase_P1_Completion_Milestone`
**Authority:** [`CONV1 — The Architecture Convergence Programme`](../../investigations/governance/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md) § 7 — phase **P1 — Correct the canon** (`DOC-1` · `DOC-2` · `DOC-3` · `DOC-4` · `OWN-5`).
**Summarises:** [`DOC1`](./DOC1_DIET_OWNERSHIP_CANON_CORRECTION.md) · [`DOC2`](./DOC2_NK1_CANON_CORRECTION.md) · [`DOC3`](./DOC3_DAYOFWEEK_COMMENT_CORRECTION.md) · [`DOC4`](./DOC4_PRODUCT_KNOWLEDGE_STATUS_CORRECTION.md) · [`OWN5`](./OWN5_SOURCE_OF_TRUTH_REGISTER_DOMAINS.md)
**Governing architecture read:** `docs/architecture/README.md` (Architecture Bootstrap, STEP 2), `REPOSITORY_CONVENTIONS.md` (§ 2, § 3, § 4), `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `CANONICAL_PUBLICATION_ARCHITECTURE.md`, `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`, `ENGINEERING_WORKFLOW.md`.

---

## ROLLBACK PROTECTION

| | |
|---|---|
| **Rollback identifier** | **`rollback/CONV1-phase-p1-completion-milestone-20260716`** → **`7d1dd2ce`** |
| **Type** | Annotated git tag, created **before any file was written** (`ROLLBACK_PROTECTION_PROTOCOL.md` § 1–2) |
| **Working tree** | **Intentionally dirty** — 19 modified tracked files and ~50 untracked files from concurrent sessions (SEC1 · SEC4 · SEC23 · LIFE2 · DOC1–4 · OWN5 · TIME3 and the Orchard blueprints). **The tag pins `HEAD` and does not cover any of it** |
| **What this milestone touched** | **One new file: this report.** Nothing else — no existing file was modified, so the dirty tree is not at risk from it |

**To roll back: delete this file.** That is the whole reversal. A tag checkout is **neither needed nor safe** here — `7d1dd2ce` predates every uncommitted P0/P1 correction in the tree, and restoring from it would silently revert five completed workstreams. This milestone is purely additive by construction, precisely so that its rollback cannot endanger the work it describes.

---

## 0. ONE DEVIATION, REPORTED RATHER THAN SILENTLY APPLIED

**The mission specified `docs/milestones/CONV1_PHASE_P1_COMPLETION.md`. This document is filed at `docs/implementation/governance/CONV1_PHASE_P1_COMPLETION.md`, on the user's decision, after the conflict was put to them rather than resolved unilaterally.**

`docs/milestones/` does not exist, and `REPOSITORY_CONVENTIONS.md` (governing) does not own it:

- **§ 2** — the folder-ownership table lists exactly four homes under `docs/`: `architecture/`, `investigations/`, `implementation/`, `intelligence/`. `milestones/` is not among them.
- **§ 3** — *"If the document has a Rollback Identifier and a Changes Made section, it is an implementation report"* → `docs/implementation/<workstream>/`. This document has both.
- **§ 4** — *"Adding [a workstream folder] is a governance decision, not a filing convenience — if a report does not fit an existing folder, place it in the closest one rather than creating a folder of one."*
- **Precedent** — [`PHASE_C_MILESTONE_CHECKPOINTS.md`](./PHASE_C_MILESTONE_CHECKPOINTS.md) is a milestone document already filed in this exact folder. The class has a home.

**This is the sixth consecutive workstream in this programme to find the mission's specified path or citation at odds with the repository** — CONV1 § 0.1, TIME2 § 0.2, LIFE1 § 18, PEOPLE1 § 12, and `DOC-2`/`DOC-3`/`OWN-5`'s citation drift (§ 4.1 below).

**One honest distinction from CONV1 § 0.1, stated because it weakens the case rather than strengthens it.** CONV1's specified path would have **failed** `repo-structure-verify.sh:52-54`. `docs/milestones/` fails **no** mechanical gate — checks 3 and 5 inspect only `docs/implementation/`, `docs/investigations/` and `docs/session`. So this was a **convention** deviation, not a gate breach, and it was **not** the implementer's call to make: § 4 reserves it as a governance decision. It was therefore put to the user, who chose the governed path with the deviation recorded here.

> **Had `docs/milestones/` been created instead, `REPOSITORY_CONVENTIONS.md` § 2 would have become stale on the same day — a governing document falsely describing the repository. That is the exact defect class `DOC-4` had just finished correcting.** Filing a milestone by manufacturing a `DOC-4` is a poor way to celebrate closing one.

---

## 1. WHY CONV1 WAS CREATED

By 2026-07-16, THA had accumulated an extraordinary asset and a matching liability. Four investigations in three days — `PEOPLE1`, `LIFE1`/`LIFE2`, `TIME1`/`TIME2`/`TIME3`, `HOME3` — plus the platform-wide `CPI1` audit before them, had located essentially every divergence between the governing architecture and the implementation, with `file:line` citations. **Almost none of it was wired to anything that stops the drift.** The findings sat in prose, in documents that are history the moment they are written, each recommending work nobody owned.

CONV1 was created to end that: to census every divergence, classify it, sequence it, and hand the platform an order of execution instead of a reading list. It is a **programme, not law** — an investigation cannot govern (`docs/architecture/README.md:4`), and CONV1 § 0.2 refused the mission's word *"governing"* on exactly that ground.

**What it found sorts the whole backlog:**

> **THA's convergence problem is not that it does not know. It is that everything it knows is written in prose, and every gate it owns reads code.**

| Divergence class | Detectable mechanically? | Gate |
|---|---|---|
| Projection ≠ owner | ✅ Yes | `verify:publication` — **red** |
| Schema ≠ migration | ✅ Yes | `verify:schema-coverage` — **51%** |
| Authored ≠ adopted | ✅ Yes | `adoption:check` — 2 failures |
| **Document ≠ document** | ❌ **No. Nothing.** | **None exists** |
| **Document ≠ code** | ❌ **No. Nothing.** | **None exists** |

**Every 🔴 item in CONV1's backlog was produced by the two classes THA cannot detect.** Not one was found by a gate; every one was found by a human asking an investigation to go and look. And across **24 candidates spanning every major domain: zero new owners, zero new domains, zero new stores.** Every item returns a fact to a store the architecture already declared authoritative — which is why CONV1's verdict is not *"THA has an architecture problem"* but:

> **THA does not have an architecture problem. It has an obedience problem.**

---

## 2. WHAT PHASE P1 SET OUT TO ACHIEVE

CONV1 § 7 defines **P1 — Correct the canon** as five documentation items — `DOC-1` · `DOC-2` · `DOC-3` · `DOC-4` · `OWN-5` — with one gate (`repo-structure-verify.sh`) and one justification:

> **"Free, and it unblocks Tier 2. No implementer should start `OWN-1` against a canon holding four positions."**

**P1's purpose was never the documents.** It was **CP4** — *correct the document before implementing against it. Where two governing documents disagree, an implementer must not choose.* P1 exists because of **risk `R4`**, which CONV1 alone named:

> **An implementer told to "resolve Domain 7" would read the Register, promote `user_preferences`, retire the `users` columns into it, mark the domain converged — and never touch `household_eaters` at all.** They would converge onto the wrong owner, close the ticket, and leave Principle 2's actual violation intact. **The contest was not unresolved. It was mis-specified, in the senior register.**

P1 is therefore best understood as **the precondition of the largest convergence in the platform** (`OWN-1`, the Household Person — *"the only convergence where a mistake reaches a plate"*), delivered as prose because prose was what was wrong.

**It set out to change what the canon *says*, never what the platform *does*.** That boundary held: four of the five items touched no executable byte, and the fifth (`DOC-3`) proved a zero executable diff by hash.

---

## 3. WHAT WAS COMPLETED

**All five P1 items are closed.** Each was verified for this milestone against the live tree rather than accepted from its own report.

| Item | Subject | Delivered | Verified here |
|---|---|---|---|
| **`DOC-1`** ★ | The canon held **four positions** on who owns a person's diet, and the Register mis-named the rival | **3 documents, 8 sites, 0 rules changed** | ✅ Register `:192`/`:749` now name `household_eaters`; both former claims survive only inside explicit correction notes |
| **`DOC-2`** | `NK1` asserted a safety-relevant field (`age`) is stored and **Authoritative**; the column does not exist | **1 document, 4 sites** (22 insertions, 4 deletions) | ✅ *"Who eats, age, stage"* is gone from `NK1` |
| **`DOC-3`** | The false `dayOfWeek` comment sat on the fabricated-date line | **3 comment lines; zero executable change** | ✅ `routes.ts:11390` + `household-history.ts:43` read *"0 = Sunday … (Rule HT8)"* |
| **`DOC-4`** | The Product Knowledge architecture said `docs/product/` does not exist; it holds 151 files | **2 documents, 5 passages** | ✅ Corrected, including the Architecture Bootstrap (`README.md:33`) |
| **`OWN-5`** | Four live domains had **no Source of Truth Register row at all** | **1 document, 3 blocks; 134 insertions, 0 deletions** | ✅ Domains **30–33** present (Pantry · Learning · Observations · Benchmark World) |

**Independent confirmation for this milestone:**

```
All five reports ............... Status: IMPLEMENTED
DOC-3 fix live ................. routes.ts:11390 "0 = Sunday … (Rule HT8)"
DOC-2 false claim ............... GONE
OWN-5 Domains 30–33 ............. present in the Register
DOC-1 rival/SoT claims .......... survive only inside correction notes
```

**And P0 is complete too — which no P1 report records.** `SEC-1` (the departed-member feed), `SEC-4` (the unvalidated `ruleId`) and `SEC-2`/`SEC-3` (the auth-token timestamps) all closed **before** `DOC-1` began, filed at `docs/implementation/platform/`. **Tier 0 and Tier 1 are both shut.** This matters directly to § 8 — see § 4.6.

### 3.1 The scope pattern: named ≠ required

**Three of the five items corrected more sites than CONV1 named, and each reported the expansion rather than hiding it:**

| Item | Named | Corrected | Why |
|---|---|---|---|
| `DOC-1` | 4 sites | **8** | **The root was upstream of all four.** Phase 3 Duplication 4 audited the wrong pair and graded it LOW/GREEN; Domain 7, Phase 4, Phase 5, Phase 7 and Appendix A all *inherit* that comparison. **Correcting the leaves and not the root would guarantee the error regrew** |
| `DOC-2` | 3 sites | **3** | **Exactly complete.** The one item whose inventory needed no expansion |
| `DOC-3` | 1 site | **3** | Two byte-identical duplicates of the same false comment, one on a live path |
| `OWN-5` | 4 domains | **4** | But the *finding itself* needed correcting — § 4.4 |

> **`DOC-2` is the control.** It shows the expansions were not an implementer's appetite for scope: when the programme's inventory was right, the item matched it precisely.

---

## 4. KEY ARCHITECTURAL DISCOVERIES

### 4.1 Citation drift is systemic, and P1 measured it

**Three of five items found the programme's own citations rotted:**

| Item | CONV1 said | Reality |
|---|---|---|
| `DOC-2` | `NK1:418`'s `§6.3` points at nothing | **Mis-cited, not orphaned** — the document name had been dropped in a copy |
| `DOC-3` | `routes.ts:11371` | **`:11390`** — off by 19 |
| `OWN-5` | `capability-registry.ts:725` | **`:711`** — `:725` is now an unrelated `description:` field |
| `DOC-4` | `PKR:896-942` | ✅ **Resolved cleanly** — the only one |
| `DOC-1` | `household.md`'s `routes.ts:8526-8541` | **Those lines are now the CPV1 publication-integrity route** — the citation pointed at unrelated code |

**This is not clerical.** `DOC-1`'s stale citation had rotted so far it pointed at a *different subsystem*, and `household.md`'s line references were removed entirely in favour of behaviour + owner — because a line number is a claim with a short half-life. CONV1 § 8.2 already grades a citation-resolution check **"Low cost"**. **P1 is the evidence that it would fire on day one.**

### 4.2 The two senior documents were not disagreeing — they were answering different questions

`DOC-1`'s core finding, and the reason a three-week-old retirement order had not moved:

> **Principle 2 said the rival is `household_eaters`. Register Domain 7 said the rival is `user_preferences`.** Two governing documents, one subject, **and no shared question.**

And the mechanism that kept it alive is a distinction worth carrying into every future register entry:

> **"Still the live path" and "the SoT" are not the same claim.** Register Phase 4 collapsed them — *"Retain … Mark them as the SoT until `user_preferences` is promoted"* — converting an accurate operational note (*don't drop these columns without a migration*) into **a ruling that contradicted Principle 2 outright.** **A shadow is not promoted by being the only lit room.**

### 4.3 P1 corrected the programme that commissioned it — three times

**Each correction is filed in a report; no investigation was edited** (`REPOSITORY_CONVENTIONS.md` § 3 — investigations are history):

| # | Programme claim | P1's verdict |
|---|---|---|
| 1 | CONV1 `WRITE-1`: *"`ARCHITECTURE_PRINCIPLES.md:192`'s grade is out of date — the split-brain is live"* | **Imprecise about which pair.** `:192` concerns `users.diet*` vs `household_eaters`, where *"no live split-brain"* **is still literally true** (adult eater rows are empty; the write door 403s). The live split-brain is vs `user_preferences.dietTypes` — a *different pair*, on the diet **pattern** (a preference), not `dietRestrictions` (the safety fact). **`:192` was not false; it was misleading** — the absence of divergence is *manufactured by locking the correct owner's write door*. **Propagating CONV1 verbatim would have written a false statement into a Principle** |
| 2 | CONV1 + LIFE1: *"`NK1:418`'s §6.3 does not exist; the canon's only per-child prohibition cites a section that does not exist"* | **False.** `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md:225` **is** `### 6.3 What signals may never do`, with all four prohibitions and a UK MHRA / EU MDR regulatory posture at § 6.4. **LIFE1's check never left NK1.** The platform's position on per-child intelligence is **not a silence** — it is an owned, reasoned, structural prohibition. *"Resolve or remove"* was settled by **resolve**, and removal would have deleted the only pointer to a real safety rule |
| 3 | CPI1 `:173`, quoted by CONV1 `OWN-5`: *"three live, **table-owning**, runtime-read domains"* | **Benchmarks owns no table.** All 88 `pgTable` declarations enumerated; both benchmark trees swept for `pgTable` and `pg-core` — zero. Declared as table-owning, Domain 33's row would have **named a table that does not exist.** Its real SoT is an authored fixture + an append-only filesystem history store — which Rule 1 permits in as many words |

> **The generalisation was one domain too wide** (`OWN-5` § 4.1). Three domains found by one sweep shared one true property (no Register row); two of three shared a second (table-owning). **Nobody re-checked the third.**

### 4.4 Declaring an owner surfaces the defects the absence was hiding

`OWN-5` was scoped as *"documentation-only, and it unblocks a whole product area."* Both true. But writing the rows down **surfaced that two of the four are not actually sole-owned in code**:

- **EL1's sole-ownership claim is false, not merely unregistered.** `evidence-learning-store.ts:4-7` asserts *"No other module reads or writes these tables directly."* **Seven sites contradict it** — and the most significant is **`publication-register.ts:1298`**: **the verification platform bypasses the owner it verifies.**
- **Root cause, recorded so the fix is not guessed:** `IEvidenceLearningStore` exposes **no delete or reset method**, so every fixture-reset path is forced out of contract *by construction* — and **no test asserts the rule**. **This is CP10 in miniature: a rule with no gate regressed, and nobody knew.**

> **The declaration did not create the defects; it made them visible. That is what the row is for.** A false claim misleads a reader who finds it. **An absent one misleads a reader who goes looking and concludes there is nothing to find** — and then declares a second owner, in good faith, because the Register told them the domain was unclaimed.

### 4.5 A correction can arm the next risk

`DOC-4` retired the Product Knowledge architecture's Risk 1 (*"never populated"*) — and in doing so made **Risk 2 principal**: *"populated and never maintained."* **`DOC-4` is Risk 2's own first instance** — the status block it corrected had been false for five days, sitting inside the mandatory Architecture Bootstrap that every engineer reads first.

`DOC-4` also refused to invent a completeness percentage where the architecture demanded one, stating **coverage** (22 of 28 sections; four hold zero entries) instead:

> **A "79%" figure would assert a completeness THA cannot verify. Inventing it would reproduce `DOC-4`'s own defect in the act of fixing it.**

### 4.6 The programme's own sequencing note went stale inside a day

`OWN-5` § 7 — the final P1 report, written hours ago — recommends **`SEC-2`/`SEC-3` next**, citing CONV1 § 8: *"they are still first."* **`SEC-2`/`SEC-3` were already closed** by `SEC23`, **before `DOC-1` began.**

**Nobody erred.** `OWN-5` cited the programme accurately; the programme was written when Tier 0 was open. **The claim rotted between the writing and the reading** — which is precisely the failure mode P1 spent five items correcting, reproduced by P1's own closing report, in under a day. **It is the most compact argument in this document for § 9's central lesson.**

---

## 5. HOW TRUST, OWNERSHIP AND GOVERNANCE IMPROVED

### 5.1 Ownership — one owner, named at every site

**Diet ownership: 11 sites across 4 governing documents, one owner at every one.** Zero now name `user_preferences` as a rival; zero name the `users.diet*` columns as the SoT.

An implementer beginning the Person convergence today reads **one** instruction from every governing document: *the owner is `household_eaters`; the `users.diet*` columns are a shadow to retire; move the write door first; `user_preferences` is not a promotion target.*

**And the canon agreed more than CONV1 counted.** `NK1:139-140` already declared `household_eaters` **Authoritative** for dietary restrictions — a fourth governing document, never tallied. **The corrected position has the Principles, `NK1` and Register Domain 16 behind it; only the corrected sites ever said otherwise.**

**Register coverage: four live domains moved from absent to declared** (Pantry · Learning · Observations · Benchmark World). Purely additive — **134 insertions, zero deletions**, nothing renumbered, every existing `SoT D14`-style citation still resolves.

### 5.2 Trust — the canon no longer claims what the platform does not hold

| Improvement | Why it is a trust improvement |
|---|---|
| `NK1` no longer asserts a stored, **Authoritative** per-eater `age` | **The honest failure mode of a missing field is `undefined`, and `undefined` fails open.** An engineer can no longer write a *safety* rule against a column that has never existed |
| `NK1:418` now resolves to a real, owned, reasoned prohibition | The platform's position on per-child intelligence is **legible** instead of appearing to be a silence |
| The `dayOfWeek` convention is declared and cited at three sites | The comment that asserted the *inverse* of the real key space no longer sits on the line that consumes it |
| The Architecture Bootstrap no longer denies the existence of a registry THA built | `README.md:33` is the **first document every engineer reads**. It carried a false claim for five days |
| Pantry's **absent food ageing** is recorded as a gap, not filled | **Honest gaps over invented facts** (Principle 6). The domain most semantically entitled to expiry owns none, and now says so |

### 5.3 Governance — the discipline held under pressure

**Zero rules were created or amended across five items.** Every corrected site now *cites* its owner rather than restating it — restating a rule creates a second owner of it. **CP1 held: convergence restores; it never creates.** Register **Rule 8 was checked and not triggered** at every item: no new table, file, or module stores anything as a result of P1.

**Three refusals are worth naming, because each was the tempting shortcut:**

- **`DOC-3` found a fourth site and deliberately did not fix it.** `opportunity-engine.ts:82` is not merely a false comment — **the code implements the false belief**: `PLANNER_DAY_NAMES` is Monday-first, so `dayName(0)` returns *"Monday"* for a Sunday, live and user-visible. **Correcting the comment alone would have created a *new* falsehood**; correcting the array is a runtime change and belongs to `BEH-4`. **Reported for P3.**
- **`DOC-4` left `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md:414` carrying the same false claim** — *"the registry contains zero entries"* — because PKCA is **a different governing document with a different owner**. The same line `DOC-2` drew for `NK2` and `OWN-5` drew for the Observation Engine.
- **`OWN-5` left `publication-register.ts:1289`'s now-stale known gap in place** — *"the SoT Register holds no row for it"*, which `OWN-5` had just made false — **because it is application code, and `OWN-5` changes no code.**

**And the errors were preserved, not erased.** Every corrected site records what it previously said; Phase 3's original text is kept in a `<details>` block. **A register that silently rewrites its own history cannot be audited** — and CONV1 § 8.2's measure depends on the record.

---

## 6. REMAINING CONVERGENCE PHASES

**Closed: P0 · P1. Remaining: P2–P10, plus the legal gate.** Of CONV1's 24 items, **8 are closed** (`SEC-1`, `SEC-2`, `SEC-3`, `SEC-4`, `DOC-1`, `DOC-2`, `DOC-3`, `DOC-4` — with `OWN-5` the ninth), leaving **15 open**, seven of which are permanently correct as they stand.

| Phase | Contains | Status | Gate |
|---|---|---|---|
| ~~**P0** — Stop the bleeding~~ | `SEC-1` · `SEC-4` · `SEC-2`+`SEC-3` | ✅ **CLOSED** | Verified per item |
| ~~**P1** — Correct the canon~~ | `DOC-1` · `DOC-2` · `DOC-3` · `DOC-4` · `OWN-5` | ✅ **CLOSED — this milestone** | `repo-structure-verify.sh` |
| **P2** — Make the gate mean something | `WRITE-4` · `BEH-8` | ⬜ **Next** | `verify:publication` reds **6 → 4** |
| **P3** — Free renames and off-by-ones | `BEH-1` · `BEH-4` · `BEH-7` | ⬜ Open | `adoption:check`; Experience & UI gate |
| **P4** — The Household Person ★ | `WRITE-3` → `WRITE-2` → `OWN-1` → `READ-1`+`READ-2`+`WRITE-1` | ⬜ **Unblocked by P1** | Household Dietary Preference 🔴 → 🟢 |
| **P5** — Household Time: module + zone | `OWN-4` → `OWN-3` → `SCH-1` | ⬜ Open | `HT18` — no second implementation |
| **P6** — Household Time: T2/T3 | `READ-4` ★ → `BEH-6` ★ → `SCH-4` → greeting ×4 | ⬜ Open | Per-consumer |
| **P7** — The anchor ★ | `SCH-2` | ⬜ Open | Migration asserts **no back-fill** |
| **P8** — The T5 convergence | `READ-3` · `OWN-6` · `BEH-3` · `OWN-2` · `BEH-9` | ⬜ Requires P7 | Five current weeks → one |
| **P9** — Retire the fabricator | `BEH-5` | ⬜ Requires P7 | `approxDate` deleted |
| **P10** — The long game | `SCH-3` | ⬜ Open | `verify:schema-coverage` 51% → 100% |
| **P—** | `SEC-5` → a birth date → `BEH-2` | ⬜ **Behind the legal gate** | Legal / product review |

**Three facts about the remainder that the table cannot show:**

1. **`SEC-5` blocks nothing else.** Minors' personal data has no governing owner — *"not an engineering fix, a routing act."* Every step carrying live harm is on the near side of that gate.
2. **Seven items are permanently correct as they are** (`CP6`). Five domains **MUST NOT** consume household time — *a duration is not a date* — and that is **a verdict, not a backlog.** A sweep that "converges" them is a new defect wearing a canonical badge.
3. **P1 unblocked one item that is not on the critical path: pantry freshness.** Domain 30 now exists, so the Rule 8 check has somewhere to start.

---

## 7. READINESS FOR IMPLEMENTATION CONVERGENCE

### 7.1 The verdict

> **READY — with one material qualification that P1 itself created, and which is stated first because it is the honest headline.**

**Implementation convergence is unblocked.** CONV1's gate on Tier 2 was: *"No implementer should start `OWN-1` against a canon holding four positions."* The canon no longer holds four positions on diet (`DOC-1`), claims no age it does not have (`DOC-2`), no longer contradicts itself on `dayOfWeek` (`DOC-3`), no longer denies a registry it built (`DOC-4`), and no longer omits four of its own live domains (`OWN-5`). **`CP4` is discharged. `WRITE-2`'s and `OWN-1`'s `DOC-1` dependency is cleared.**

### 7.2 The qualification: P1 landed zero gates

**CP10 is CONV1's own standard:** *"A convergence is finished when a gate can fail. Prose cannot hold a convergence. If the item cannot end in a check, it will regress and nobody will know."*

> **P1 corrected 14+ sites across five governing documents, and not one of those corrections is defended by a gate. Every one could regrow tomorrow, silently.**

This is not a criticism of the items — they were scoped as documentation, correctly, and building a gate is code. It is the **precise, current shape of risk `R1`/`R2`**, and § 4.6 is the proof it is not hypothetical: **a P1 report's own sequencing claim went stale within a day.** CONV1 § 8.2 already names the three checks that would defend this work, and grades two of them **"Low cost"**:

| Check CONV1 names | Would have caught | CONV1's cost |
|---|---|---|
| Every Register domain names a source of truth that exists | **`OWN-5`** (4 missing domains); `OWN-4` | Low |
| Every `file:line` citation in governing architecture resolves | **`DOC-2`** · **`DOC-4`** · `DOC-1`'s rotted `household.md` reference | Low |
| No two governing documents name different owners for one domain | **`DOC-1` — the four-way conflict, on the day it was written** | Medium |

**All three remain unbuilt.** The fourth row of CONV1's own measure is still blank.

### 7.3 The measure — re-run for this milestone, not inherited

| Signal | CONV1 (2026-07-16, earlier) | **Now** | Δ |
|---|---|---|---|
| `verify:publication` | FAIL — 22 domains: 5 🟢 · 11 🟡 · **6 🔴**; 60 checks: **24 pass · 24 warn · 12 fail** | **FAIL** — 22 domains: 5 🟢 · 11 🟡 · **6 🔴**; 60 checks: **25 pass · 24 warn · 11 fail** | **1 check FAIL → PASS** |
| `verify:schema-coverage` | 51% — 45 of 91 tables | **51% — 45 of 91** | — |
| `adoption:check` | 64 pass, 2 fail | **64 pass, 2 fail** | — |
| **Governing-document coherence** | **UNMEASURED — no gate exists** | **UNMEASURED — no gate exists** | **—** |

**The six red domains today:** Meals · Meal Templates · Household Dietary Preference · Pantry · Nutrition — Boost/Uplift · Capability Registry.

**Read this table honestly.** P0 moved one check green. **P1 moved nothing on it, and could not have** — every P1 item lives in the one class the gate cannot read. **That is not P1 failing; it is P1's entire thesis, restated as a number.** The gate that checks whether the Register is right still cannot read the Register.

*(One observation, unclaimed: `verify:publication`'s § 4.4 register-drift check has moved `PASS` → `WARN` since CONV1 ran it, now reporting *"still marks Plant Diversity Contested (resolved by M4)"*. That is a hardcoded known-drift entry, **not** a detection of the document-vs-document class. CONV1's structural finding stands unchanged.)*

### 7.4 Readiness by workstream

| Next work | Ready? | Blocker |
|---|---|---|
| **P2** — `WRITE-4`, `BEH-8` | ✅ **Yes** | None. Both are pure deletions of parallel mechanisms |
| **P3** — `BEH-1`, `BEH-4`, `BEH-7` | ✅ Yes | None. `BEH-4` must first absorb `DOC-3`'s `opportunity-engine.ts:82` finding |
| **P4** — `OWN-1` ★ | ✅ **Legal to start** | **P1 discharged its precondition.** But it is P4, depends on `WRITE-3` → `WRITE-2`, and carries the programme's whole risk |
| **P5–P9** — Household Time | ✅ Yes for P5 | `OWN-4` has no dependencies; *"deleting one file reverts it"* |
| **P—** — `SEC-5` | ❌ **No** | Legal / product. **Not an engineering decision** |

> **P1 completing is what makes `OWN-1` *legal* to start. It is not what makes it *next*.**

---

## 8. RECOMMENDED EXECUTION ORDER FOR THE REMAINING BACKLOG

**A recommendation, not a decision.** CONV1 § 7 owns the phase order; this milestone re-states it against a tree where P0 and P1 are now closed, and flags the two places where the sequencing note has gone stale.

| # | Workstream | Why here | Cost |
|---|---|---|---|
| **1** | **P2 — `WRITE-4` + `BEH-8`** | **Addresses `R2` directly — the risk that is *already happening*.** *"A gate that is always red teaches everyone to ignore it."* Both items are **pure deletions of parallel mechanisms**, both are already-failing checks, and both sit on red domains. **The gate already fails on them: the check exists and is red.** *"A gate's value is the day it turns red, not the day it is written"* | Low |
| **2** | **The two "Low cost" coherence checks** (CONV1 § 8.2, Horizon 2) | **The strongest amendment this milestone proposes.** P1 just produced five items' worth of evidence that both would fire on day one (§ 4.1, § 7.2), and **P1's own corrections are currently undefended.** Landing them next converts P1 from prose into something that *can regress loudly*. **`CP10`, applied to P1 itself** | Low |
| **3** | **P3 — `BEH-1` · `BEH-4` · `BEH-7`** | Independent, low-risk, **user-visible**. `BEH-4` is *"the first thing a new household sees, and it is off by one."* **`BEH-4` must absorb `DOC-3` § 5.1's `opportunity-engine.ts` finding** and confirm whether it is a fifth backwards reader | Low |
| **4** | **`OWN-5` follow-on `F1` — EL1's seven ownership violations** | **`OWN-5` grades it the highest of its six follow-ons.** The verifier itself is a violator. **The fix is a store reset method + a gate, not seven edits** — root cause already established, so it will not need rediscovering | Medium |
| **5** | **P5 — `OWN-4` → `OWN-3` → `SCH-1`** | **`R1` is CONV1's highest and likeliest risk: the declared owner is never built**, and `TIME3` becomes *"a 21st time implementation with better manners."* `OWN-4` has **no dependencies** and is reverted by deleting one file. **`OWN-3` is the cheapest genuine ownership win in the programme** — it needs no zone and no anchor | Low |
| **6** | **P4 — The Household Person ★** | The largest convergence, and **the only one where a mistake reaches a plate.** Its precondition is discharged. **Order is not taste: `WRITE-3` → `WRITE-2` → `OWN-1` → scaffolding last** (`CP2`, `CP3`) | **High** |
| **7** | **P6 → P7 → P8 → P9** | CONV1's order, unchanged. `READ-4` first (one line, largest blast radius), `BEH-6` second (highest user harm). **`SCH-2` gates P8 and P9 absolutely** | High |
| **8** | **P10 — `SCH-3`** | The long game. *"Arguably the deepest structural defect in the platform"* — and **zero user impact, which is exactly why it has never been done** | High |
| **—** | **`SEC-5` → legal/product** | **Route it. Do not fill it.** It blocks only `BEH-2`. **Routing it costs an email and it has been open the whole programme** | Zero (engineering) |

### 8.1 Two corrections to the inherited sequencing

1. **`OWN-5` § 7's *"next: `SEC-2`/`SEC-3`"* is stale — they are done** (§ 4.6). Anyone starting from the final P1 report would begin work that closed hours earlier. **P2 is next, not Tier 0.**
2. **CONV1 § 7 sets P2's gate at reds 6 → 4, while its item entries name *three* red domains** across `WRITE-4` (*"two of the six red domains are this item"*) and `BEH-8` (*"one of the six red domains"*). **The current red list is consistent with either.** **P2 should resolve this by measurement, not by assumption** — and should report the number it actually reaches, because a phase that quietly under-delivers its own gate target is how `R2` renews itself.

### 8.2 The three orderings that are not negotiable

- **The scaffolding comes down last** (`CP2`, risk `R7`). `READ-1`, `READ-2` and `WRITE-1` look like obvious debt and are **the only things keeping adults' allergies visible while the fact sits in the wrong store. Delete them first and the platform forgets every adult's allergy.**
- **The write door moves before the read door** (`CP3`). Retiring a column before relocating its write **silently discards a household's declaration.**
- **`BEH-5` cannot precede `SCH-2`** (risk `R3`). Household time **cannot** repair Stories — *"Friday became curry night"* is not a mis-zoned date but a date that was never real. **Fixing its timezone first makes a fabricated date precisely wrong** — the worst outcome available.

---

## 9. LESSONS LEARNED — WHAT SHOULD BECOME ENDURING ENGINEERING PRACTICE

**These are P1's, drawn from what actually happened across five items. None is proposed as a new rule** — each either restates an existing owner's rule with fresh evidence, or is a working practice for `ENGINEERING_WORKFLOW.md` to own if it is adopted. **Proposing new architecture here would be this milestone authoring law, which it may not do.**

### L1 — Verify at source; never inherit a claim, however well cited

**The strongest lesson, and the one P1 proved five times.** Every item re-derived its claims from live code rather than from the investigation that reported them, **and it changed what was written in four of the five.** `DOC-1` found CPI1's S1-1 already **closed** and did not write it into the register as live. `DOC-2` found the *"orphaned"* pointer was **real**. `OWN-5` found Benchmarks **owns no table**. Had any of these been inherited, a governing document would now carry a false statement **installed by the act of correcting it.**

> **Reporting a fixed finding as live is the easiest error available** (CONV1 § 0.4), and an investigation's age is measured in days, not months.

### L2 — Cite the owner and the behaviour; a line number is a claim with a short half-life

**Three of five items found rotted citations; one pointed at an entirely different subsystem** (§ 4.1). `DOC-1`'s response is the practice: **it removed `household.md`'s line numbers in favour of behaviour + owner.** Where a line number is genuinely needed, **locate the target by content, not by number** — `DOC-3` did exactly that and found its site 19 lines from where the programme said it was.

### L3 — Correct the root, not the leaves — and prove which is which

`DOC-1` was handed four sites and found **all four inherited a fifth**: Phase 3's Duplication 4, which had audited the wrong pair and graded it LOW/GREEN. **Correcting the leaves would have guaranteed the error regrew.** The practice: when several documents state the same wrong thing, **ask which one the others copied** before correcting any.

### L4 — Report the scope expansion; never hide it, and never assume it

`DOC-1` (4→8), `DOC-3` (1→3) and `OWN-5` (corrected its own finding) each expanded and **reported the expansion with its justification against the mission's own standard.** `DOC-2` found its inventory exactly complete and expanded nothing. **The expansions were evidence-led, and the control case proves it** (§ 3.1).

### L5 — Preserve the error; a register that rewrites its own history cannot be audited

Every corrected site records what it previously said; Phase 3's original text survives in a `<details>` block. **This is what makes the next audit cheaper than the last one** — and CONV1 § 8.2's measure depends on the record existing.

### L6 — "Still the live path" and "the SoT" are different claims, and collapsing them is expensive

**One sentence conflating them kept a shadow alive for three weeks past its retirement order** (§ 4.2). The practice: when a register records that a store must not be dropped yet, **say that it must not be dropped yet.** Do not promote it to owner to express the caution. **A shadow is not promoted by being the only lit room.**

### L7 — Report the grade the evidence supports, not the grade the finding deserves (`CP11`)

`DOC-1` regraded 🟢 → 🟡 rather than 🔴 and **said why**: the plate-safety symptom was closed, the safety fact held no divergent value, and the live divergence was a preference. `OWN-5` refused to call four domains *converged* when two carry live defects and no gate fails on either. **A programme that inflates its own severities is a programme nobody sequences by** — and one that deflates them is worse.

### L8 — Refuse the adjacent fix, and file it where it will be found

`DOC-3` left a live user-visible mislabelling in place because **correcting the comment alone would have created a new falsehood**, and correcting the array was another item's work. `DOC-4` left PKCA's identical false claim to its own owner. `OWN-5` left `publication-register.ts:1289` stale because it is code. **All three filed the refusal as a named follow-on.** The discipline is not restraint for its own sake — **it is that `PKR1` Risk R7 (*discovery without transfer of ownership*) is THA's most repeated failure**, and an unfiled refusal is a rediscovery scheduled for later.

### L9 — Declaring an owner is a diagnostic, not just bookkeeping

`OWN-5` expected to write four rows and **found that two of the four domains are not sole-owned in code at all** — including one where the verifier bypasses the owner it verifies. **The declaration did not create the defects; it made them visible** (§ 4.4). **Expect a declaration to surface work. That is the row doing its job, and it is a reason to declare sooner, not later.**

### L10 — A correction with no gate is a correction with a half-life

**The lesson P1 is best placed to teach, because P1 is its own example.** `OWN-5` found EL1's rule had drifted precisely because **`IEvidenceLearningStore` made compliance impossible by construction and no test asserted it.** Then § 4.6 showed a P1 report's own sequencing claim going stale **within a day**. And § 7.2 records that **P1's fourteen corrections are defended by nothing.**

> **`CP10` is not advice about gates. It is a prediction about prose.** *"If the item cannot end in a check, it will regress and nobody will know."* **P1 could not end in a check — and that is the strongest argument available for building the two Low-cost coherence checks next** (§ 8, item 2), rather than trusting that five documents corrected once will stay corrected.

### L11 — When the mission conflicts with governing architecture, report it; when it conflicts with a *governance decision*, ask

**Six workstreams found the mission at odds with the repository.** CONV1 § 0.1's precedent — file at the governed path, report the deviation — is right where the specified path **fails a gate**. **This milestone hit a case that fails no gate but is reserved by `REPOSITORY_CONVENTIONS.md` § 4 as *"a governance decision"* — so it was put to the user instead of decided** (§ 0). The distinction worth keeping: **an implementer may resolve a conflict with a rule; they may not quietly make a decision the rules reserve for someone else.**

---

## 10. WHAT THIS MILESTONE DELIBERATELY DID NOT DO

| Not done | Why |
|---|---|
| **Implement anything** | It is a completion record. **Nothing was built, fixed, or migrated** |
| **Modify application code** | Verified: this document is the **only** file this workstream wrote |
| **Modify schemas** | None touched |
| **Change governing architecture** | **No document in `docs/architecture/` was edited.** § 9's lessons are proposed as practice, not decreed as law — **a milestone that amended the canon would be authoring architecture from an implementation report** |
| **Create `docs/milestones/`** | § 0 — a governance decision reserved by `REPOSITORY_CONVENTIONS.md` § 4, put to the user rather than taken |
| **Edit `CONV1`, `CPI1`, `PEOPLE1` or `LIFE1`** | **Investigations are history and are never edited** (`REPOSITORY_CONVENTIONS.md` § 3). Their claims are corrected **in the P1 reports** and summarised here (§ 4.3) |
| **Re-decide anything P1 decided** | The five reports' conclusions are **restated with attribution, never re-litigated** |
| **Fix `OWN-5`'s six follow-ons, or `DOC-3`'s site 4** | Each is filed and owned. **`F1` is recommended at § 8 rank 4**; `opportunity-engine.ts:82` is routed to `BEH-4` |
| **Declare P1's corrections "protected"** | They are not. **§ 7.2 says so plainly**, because the reassuring version would be false |
| **Remove the two stray root files** | `.glibcheck.txt` / `.libdirs_uxhome.txt` — untracked, pre-existing, **a concurrent session's**. Not this workstream's to delete |
| **Invent a convergence percentage** | **8 of 24 items closed is a count, not a completion figure** — seven of the remainder are *permanently correct as they are* (`CP6`), so a percentage would assert a denominator THA does not have. **`DOC-4` refused the same temptation** (§ 4.5) |

---

## 11. COMPLIANCE

- **Architecture Bootstrap (`docs/architecture/README.md`, STEP 2):** read before this milestone, together with `REPOSITORY_CONVENTIONS.md`, `ARCHITECTURE_PRINCIPLES.md`, the SoT Register, `CANONICAL_PUBLICATION_ARCHITECTURE.md`, `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` and `ENGINEERING_WORKFLOW.md`.
- **STEP 1 — Rollback:** created **before any file was written**; identifier recorded above; the dirty tree of nine concurrent sessions **untouched and unendangered** — this workstream wrote exactly one new file.
- **`REPOSITORY_CONVENTIONS.md` § 2/§ 3/§ 4:** the mission's specified path is not a governed home; filed under `docs/implementation/governance/` by workstream, **on the user's decision**, with the deviation reported (§ 0). `repo-structure-verify.sh` passes every `docs/` rule; the root FAIL is pre-existing (§ 10).
- **CP1 (*convergence restores; it never creates*):** upheld across all five P1 items — **zero new owners, zero new domains, zero new stores**; Register Rule 8 checked and not triggered at each.
- **CP4 (*correct the document before implementing against it*):** **P1 is CP4, executed.** Discharged for `OWN-1` and `WRITE-2` (§ 7.1).
- **CP10 (*a convergence is finished when a gate can fail*):** **applied to P1 itself, honestly** — P1 landed no gate, and § 7.2 records the consequence rather than obscuring it.
- **CP11 (*report the grade the evidence supports*):** § 7.3's measure was **re-run, not inherited**; § 7.1's readiness carries its qualification first; no completion percentage is invented (§ 10).
- **Core Principle 6 (*honest gaps over invented facts*):** § 4.6 records a P1 report's own claim going stale; § 7.2 states that P1's corrections are undefended; § 8.1 flags CONV1's own 6→4 / three-red discrepancy rather than picking the flattering reading.
- **`ENGINEERING_WORKFLOW.md` STEP 8 (Architecture Convergence Status):** **cited, never restated** (CONV1 § 7.1, risk `R11`). STEP 8 owns the per-implementation report; CONV1 owns the programme; **this milestone owns neither — it records the closure of one phase of it.**
- **Experience & UI Governance / Product Registry / Adoption Register Compliance:** **not applicable** — no user-facing surface, no client building block, no product-knowledge entry, and no owner created, adopted or retired by a completion record.
- **This document creates no rule and is not governing.** It is an implementation-class record. **Where it and any governing document disagree, the governing document wins and this document is the defect.**

---

*A completion milestone for CONV1 phase **P1 — Correct the canon** (`DOC-1` · `DOC-2` · `DOC-3` · `DOC-4` · `OWN-5`). It records what five workstreams did; it is not itself governing and decides nothing.*
*Rollback: `rollback/CONV1-phase-p1-completion-milestone-20260716` → `7d1dd2ce`. **To revert, delete this file** — do not check out the tag, which predates every uncommitted P0/P1 correction in the working tree.*
*Phase status: **P0 CLOSED · P1 CLOSED · P2 next.** `OWN-1` is unblocked and is P4.*
