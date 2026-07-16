# DOC-5 — Source of Truth Register Path Corrections

**Workstream:** `DOC5_Source_Of_Truth_Path_Corrections`
**Date:** 2026-07-16
**Rollback identifier:** `rollback/DOC5-sot-register-path-corrections-20260716` → `7d1dd2ce`
**Status:** ✅ **COMPLETE** — `npm run verify:coherence` **2 fail → 0 fail, 0 warn**.

> **Scope.** The two defects `COH-1` fired on, and nothing else. **Governing documentation only:
> no code, no schema, no runtime, no ownership.** Implementation report — it creates no rule, and
> where it and any governing document disagree, **this document is the defect.**

---

## 0. THE HEADLINE

**The gate CONV1 Phase P2 shipped red is now green, and it went green because the defects were
fixed — not because the gate was lowered.** Coverage is **identical** either side of the change:
33 domains, 102 citations, 91 declared tables. Nothing stopped being checked.

Both defects were what P2 said they were: **factual path rot, zero ownership change.** Domain 6's
owner *is* `dietRules.ts` — only the path was wrong. Domain 18's rival *is* condemned — by this
document's own Phase 4, five sections below the row still calling it a live contestant.

**What P2 could not know, because its gate cannot see it: the defect had a third site.** Domain 6's
path is stated **twice** — in the domain row *and* in Appendix A — and `COH-1` reads only the first
(§ 4). Correcting the row alone would have left the Register contradicting itself, in the document
whose entire job is to hold one answer per fact.

---

## 1. WHAT CHANGED — one document, three rows

| Document | Row | Was | Now |
|---|---|---|---|
| `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` | **Domain 6** Authoritative Source | `server/lib/dietRules.ts` | **`shared/dietRules.ts`** |
| ″ | **Domain 18** Authoritative Source | *"Contested (`nutrition-benefit-library.ts` vs WS0)"* | **Contested — WS0 (`shared/knowledge/` → DB `knowledge_*`, read via `server/services/nutrition-knowledge-registry.ts`) vs a library absent from the tree** |
| ″ | **Appendix A** — Dietary Rules (pattern) | `server/lib/dietRules.ts` ← *duplicated in client* | **`shared/dietRules.ts`** — one module, imported by both planes |

Each carries a dated `Corrected` row and a `⚠️` note recording what was there, why it was wrong, and
**what was deliberately not touched**. **Both `Status` rows are byte-unchanged** (§ 5).

---

## 2. THE MEASURE — re-run here, never inherited (`CP11`)

| Signal | Before | After | Δ |
|---|---|---|---|
| **`verify:coherence`** | **2 failed, 0 warned** — `RESULT: FAIL` | **0 failed, 0 warned** — `RESULT: PASS` | ✅ **−2 fail** |
| `verify:coherence` — coverage | 33 domains · 102 citations · 91 tables | **33 · 102 · 91 — identical** | **none — the gate was not lowered** |
| `verify:publication` | 22: 🟢5 · 🟡12 · 🔴5 — 60: 31/21/8 | **identical** | — |
| `xc-register-currency` predicates | `188 foods` F · `239 entries` F · PlantDiv-Contested **T** | **identical** | — |
| `repo-structure-verify.sh` | fails on 2 root strays | **same 2** (`.glibcheck.txt`, `.libdirs_uxhome.txt`) | — **not mine** |

**The coverage row is the one that matters.** A `COH-1` row whose owner stops resolving does not fail
— it **warns** (*"names no checkable artefact — prose only"*). **0 warns proves both corrected rows
still declare a real, resolving owner**, rather than having been softened into prose the gate cannot
judge. That was the available cheat, and the gate reports it was not taken.

**The two strays are not this workstream's** — untracked, timestamped `18:52`, two hours before it
began; the same pair P2 recorded from a concurrent session.

---

## 3. THE TWO CORRECTIONS — verified at source, never inherited (`L1`)

### 3.1 Domain 6 — the owner never moved; the document did

`server/lib/dietRules.ts` **does not exist.** `shared/dietRules.ts` does, and it is the same module
owning the same fact:

| Claim | Evidence |
|---|---|
| The path is real | `shared/dietRules.ts` — present in the working tree **and at `HEAD`** |
| It is the live owner | `server/routes.ts:54`, `server/lib/smart-suggest-service.ts:13`, `server/lib/household-dietary-safety.ts:78`, `server/lib/external-meal-service.ts:5`, `server/lib/planner-compliance.ts` all `import … from "@shared/dietRules"` |
| Both planes read the one module | the **client** imports it too — `client/src/pages/meals-page.tsx:46` |
| Neither rival survives | `server/lib/dietRules.ts` ❌ · `client/src/lib/dietRules.ts` ❌ |

**This is not a new location — it is the location the architecture ordered.** Rule 4 (*"if a module
is needed in both server and client, it must be moved to `shared/` and imported from there"*) names
`client/src/lib/dietRules.ts` under **"Applies immediately to"**, and `ARCHITECTURE_PRINCIPLES.md`
§ M3 specifies the outcome exactly: *"Move to `shared/dietRules.ts`; delete both existing files;
update all imports."* **All three clauses are satisfied in the tree.**

> **M3 was done, and nobody came back to tell the Register.** The correction is not a decision about
> this domain; it is the Register catching up to an order it issued itself.

### 3.2 Domain 18 — a live contest against a file that does not exist

The row declared a contest between `nutrition-benefit-library.ts` and the WS0 Knowledge Registry.

| Claim | Evidence |
|---|---|
| The rival is gone | absent from the working tree **and from `HEAD`** |
| Nothing reads it | **zero consumers** of `getNutritionBenefit` / `BENEFIT_MAP` across `client/`, `server/`, `shared/` |
| **The Register already condemned it** | **Phase 4 Retirement Register**: *"`nutrition-benefit-library.ts` — **Retire**. Superseded by WS0 Knowledge Registry. Covers only 25 foods vs 188."* |
| The rule it died under | **Rule 6** — *"static client files are not knowledge stores … appropriate only during prototype phases"* |
| WS0 is real | `shared/knowledge/` (18 modules), `server/services/nutrition-knowledge-registry.ts`, and 10 `knowledge_*` tables in `shared/schema.ts` |

> **The Register was recording a live contest against a file its own retirement register had already
> condemned and the tree had already removed.** Five sections apart, in one document, contradicting
> itself — and no one noticed for months, because nothing could.

**The replacement wording was not invented.** Rule 1 demands *"a file path or DB table name — never a
vague description"* and offers its own example of an acceptable declaration:

> *"`shared/knowledge/` → DB `knowledge_*` tables, read via `nutrition-knowledge-registry.ts`"*

**That is verbatim the form now in the row.** When the document that owns ownership has already
written the sentence, the correction is to use it — not to compose a better one.

---

## 4. THE FINDING P2 COULD NOT HAVE MADE — the defect had a third site

**Domain 6's path is stated twice in this document**, and `COH-1` can only ever see one of them:

```
docs/…/REGISTER.md:178   ### Domain 6 → Authoritative Source     ← COH-1 reads this
docs/…/REGISTER.md:1081  APPENDIX A — QUICK REFERENCE            ← COH-1 is blind to this
                         | Dietary Rules (pattern) | `server/lib/dietRules.ts` ← duplicated in client |
```

`COH-1` parses `### Domain N:` blocks and, within each, the single `| Authoritative Source |` row.
**Appendix A is a table of authoritative sources that is not a domain block, so no part of the gate
looks at it.** It carried the identical dead path — **plus a second false claim the domain row did
not have**: *"← duplicated in client"*, describing a copy that no longer exists.

**Fixing only what the gate reported would have made the document worse in a specific way**: Domain 6
would say `shared/`, Appendix A would say `server/lib/`, and the Register would answer *"where does
this fact live?"* two ways — the precise failure it exists to prevent. **A green gate would have
certified it.**

**`DOC-1` had already established the remedy**: when it corrected Domain 7, it corrected **both** the
domain row and its Appendix A twin (`:1082`) in one act. `DOC-5` follows that precedent exactly.

> **A gate that reads one of two statements of a fact will always certify the half it cannot see.**
> This is `COH-1`'s real ceiling — narrower than the one P2 § 9 flagged (*"only the first artefact
> each row names"*), and worth more: the un-scanned Appendix is where the **second copy** of every
> path in this document lives. **Recommended as the first deepening of the check, now that it is
> green** — never before (`R2`).

---

## 5. WHAT `DOC-5` DELIBERATELY DID NOT DO

| Not done | Why |
|---|---|
| **Change either `Status` row** | **Both are stale, and both are ownership acts.** Domain 6's contest (`server/lib/` vs an identical client copy) ended when M3 deleted both files; Domain 18's rival is retired and unread. **But recording a contest as over is a governed decision, not a path correction** — and Domain 18's needs a live-consumer audit no missing file can substitute for. **Reported at the row, not decided there** (§ 7). |
| **Declare WS0 the authoritative owner of Domain 18** | The same act. The mission was explicit: *do not change ownership*. **The one thing a documentation correction must never do is quietly settle the question the document exists to hold open.** |
| **Edit Phases 3, 4, 5, 7, 8** | **They are history and plans, and they are correct as history.** Phase 3 records the duplication *as found*; Phase 5's M1/M3 record the migrations *as planned*. This document's own OWN-5 doctrine governs: *"CPI1 and CONV1 are history and are not edited (`REPOSITORY_CONVENTIONS.md` § 3); the correction of record is this row."* **Rewriting an audit to match today erases the evidence that the audit worked.** |
| **Fix `xc-register-currency`'s false positive** | It is a **code** change (§ 6). Out of a docs-only mission's scope. |
| **Touch Appendix A's Domain 18 row (`:1093`)** | *"CONTESTED: retire nutrition-benefit-library.ts → use WS0"* — stale in that the retirement is already done, but it **declares no false owner** and states the Register's unchanged position. Correcting it means resolving the contest. **Left, and reported.** |

---

## 6. A SECOND DEFECT, FOUND AND NOT FIXED — `xc-register-currency` is firing falsely

`verify:publication` warns, and warned before this change:

> ⚠ **The Source of Truth Register agrees with the owners it governs (CPI1 §4.4)** —
> *"The register that owns ownership is itself stale: **still marks Plant Diversity Contested
> (resolved by M4)**."*

**The Register does not mark Plant Diversity contested.** Domain 22's Status reads **"Authoritative —
published and verified"**, and Appendix A's Plant Diversity row is clean. The check is:

```js
if (/Plant Diversity[\s\S]{0,400}?Contested/.test(register))
    drift.push("still marks Plant Diversity Contested (resolved by M4)");
```

Located at source: it matches at **Appendix A `:1079`**, where *"Plant Diversity"* is followed —
**400 characters later, across four unrelated table rows** — by the *"Contested"* in **Domain 7's**
row, which is legitimately contested and which **`DOC-1` itself wrote**. The regex spans from one
domain's row into another's and reports the collision as drift.

> **`DOC-1` fixed a stale row and, in the same stroke, made a naive check report a lie about a
> different domain.** This is P2 § 3.5's *"a gate's prose rots exactly like a document's"* and § 3.6's
> *"naive source-text match"* — **at the same address**, in the layer built to detect rot.

**Not fixed here, and reported rather than worked around**: the remedy is to scope the regex to
Domain 22's block (a change to `server/verification/publication-register.ts`), which is code.
**`DOC-5` did not reword the Register to dodge it** — that would be writing prose to appease a broken
regex, which is P2 § 3.6's trap taken deliberately. The predicate was **`true` before and `true`
after** (§ 2): this workstream neither caused it nor conceals it.

---

## 7. ARCHITECTURE COMPLIANCE

- **Bootstrap (STEP 2):** `docs/architecture/README.md` read first, then `CONV1_PHASE_P2_COMPLETION.md`.
  `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Rules 1, 4, 6; Phases 3–8; Appendix A) and
  `ARCHITECTURE_PRINCIPLES.md` (§ M3, Principle 2) read where they bear.
- **Principle 2 (one owner per fact):** **strengthened, and by subtraction.** Zero owners added,
  moved, or removed. Domain 6 named a path that could not own anything; it now names the module that
  does. **The Appendix A correction is Principle 2 applied to the Register itself** — one fact, one
  answer, in one document (§ 4).
- **Register Rule 1:** both rows now name a file path that resolves, in the form Rule 1 blesses.
- **Rule 7 / Rule 8:** not engaged — **no store created, none retired, no domain converged.**
- **No code, no schema, no runtime:** the diff is **one `.md` file, three rows**. The only code that
  reads this file is the two gates, and **both were run** (§ 2). Every other mention in `server/` and
  `shared/` is a comment citation — verified, not assumed.
- **Product Registry:** no user-facing surface added, changed or retired. **No entry affected.**
- **Adoption Register:** no client-side building block touched. `adoption:check` untouched.
- **Experience & UI:** not user-facing. No component, token, colour, route or copy.
- **Verified against `HEAD`, not just a dirty tree:** the tree carries ~9 concurrent sessions'
  uncommitted work. All three cited owners (`shared/dietRules.ts`, `shared/knowledge/`,
  `server/services/nutrition-knowledge-registry.ts`) **exist at `HEAD` with no uncommitted
  modifications** — so these corrections hold on a clean checkout and depend on nobody else's session.

---

## 8. NEXT — recommended, not decided

| # | Workstream | Why here | Cost |
|---|---|---|---|
| **1** | **`COH-3` — wire `verify:coherence` into `release:check`** | **This is the item `DOC-5` exists to unblock.** P2 § 6.4 refused to wire a red gate (*"wiring in a red gate is how `R2` is manufactured, not cured"*) and said *"wiring follows the correction."* **The correction is done and the gate is green.** `release:check` currently runs `verify:deployment-config → verify:release-packaging → typecheck:ci → adoption:check → test → build` and **includes neither coherence gate**. A one-line `package.json` change — **but a code act, so not `DOC-5`'s.** ⚠️ **`typecheck:ci` has 32 pre-existing regressions (P2 § 2) and `verify:publication` is red on 5 domains** — coherence can be wired alone; **the other two cannot follow until their own corrections land.** | **Low** |
| **2** | **`DOC-6` — resolve the two stale `Status` rows** (Domain 6, Domain 18) | The evidence is assembled here (§ 3) and the act is small, but it is an **ownership decision** and needs its own deliberate authorisation. **Domain 6 is nearly free** — M3 is verifiably complete and both rivals are deleted. **Domain 18 needs a live-consumer audit**: proving WS0 *serves the boost display fact today* is a different question from proving its rival is gone. **Do not merge the two** — the second is where a wrong answer reaches a household. | **Low / Medium** |
| **3** | **Scope `xc-register-currency`'s regex to Domain 22** | § 6 — the check reports a fixed cause about the wrong domain. **A check that cries wolf is spent from the gate's credibility** (`R2`), and this one is currently miscounting a `DOC-1` success as drift. | **Low** |
| **4** | **Deepen `COH-1` to Appendix A** | § 4 — the gate is blind to the **second copy of every path in the document**. Now correct to deepen it: **it is green** (P2 § 9: *"the obvious place to deepen the check once it is green, never before"*). | **Low** |
| **5** | **P3 — `BEH-1` · `BEH-4` · `BEH-7`** | **CONV1's order, unchanged, and P2's own recommendation for what follows this item.** Independent, low-risk, user-visible. `BEH-4` *"is the first thing a new household sees, and it is off by one"*, and **must first absorb `DOC-3` § 5.1's `opportunity-engine.ts:82` finding**. | Low |

**P2's two non-negotiable orderings are untouched by this workstream:** the scaffolding still comes
down last (`R7`), and `BEH-5` still cannot precede `SCH-2` (`R3`).

---

## 9. ROLLBACK

**Identifier:** `rollback/DOC5-sot-register-path-corrections-20260716` → `7d1dd2ce`

> ⚠️ **The tag is a marker, not a restore point.** `7d1dd2ce` predates every uncommitted P0/P1/P2
> correction in a tree dirty from ~9 concurrent sessions. **A tag checkout would destroy them.** This
> is the same qualification the P1 milestone and P2 recorded, and it still holds.

**To roll back `DOC-5`, restore one file:**

| Action | Path |
|---|---|
| restore | `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — byte-exact pre-edit snapshot at `<scratchpad>/REGISTER.md.DOC5-pre` (md5 verified against the working copy **before** the first edit) |
| delete | this report · `.engineering/session/runs/DOC5_Source_Of_Truth_Path_Corrections.md` |

**Reverting restores two red `COH-1` findings and nothing else.** No code, schema, migration, or
runtime state is involved — **there is nothing else to undo.**

---

*Implementation report for CONV1 item `DOC-5`. It creates no rule and is not law. Subordinate to the
governing architecture, which prevails in any conflict.*
