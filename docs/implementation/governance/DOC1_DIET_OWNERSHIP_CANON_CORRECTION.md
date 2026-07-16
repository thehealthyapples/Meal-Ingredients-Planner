# DOC1 — The Canon Held Four Positions On Who Owns A Person's Diet — Implementation

**Status:** IMPLEMENTED — **governing documentation only.** CONV1 item `DOC-1` only. **No application code, no schema, no runtime behaviour changed.**
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Workstream:** `DOC1_Diet_Ownership_Canon_Correction`
**Authority:** [`CONV1 — The Architecture Convergence Programme`](../../investigations/governance/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md) § 1.3, § 3 (`DOC-1`, Tier 1), § 7 (P1 — *"Correct the canon"*). Source findings: [`PEOPLE1`](../../investigations/platform/PEOPLE1_HOUSEHOLD_PERSON_MODEL_INVESTIGATION.md) § 9.1 · [`CPI1`](../../investigations/platform/CPI1_CANONICAL_PUBLICATION_INTEGRITY_AUDIT.md) § 77, S2-4, § 263.
**Governing architecture read:** `docs/architecture/README.md` (Architecture Bootstrap, STEP 2), `ARCHITECTURE_PRINCIPLES.md` (Principles 1, 2, 5, 6, 7, 8), `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domains 7, 16, 27; Phases 3–5, 7; Appendix A), `capabilities/household.md`, `CANONICAL_PUBLICATION_ARCHITECTURE.md` (**CPuBA6**), `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`, `REPOSITORY_CONVENTIONS.md`, `ENGINEERING_WORKFLOW.md`.

---

## ROLLBACK PROTECTION

| | |
|---|---|
| **Rollback identifier** | **`rollback/DOC1-architecture-conflict-resolution-20260716`** → **`7d1dd2ce`** |
| **Type** | Annotated git tag (per `ENGINEERING_SESSION_RECOVERY_PROTOCOL.md` § 39) |
| **Working-tree backup** | `…/scratchpad/DOC1-pre-change-backup/` — pre-change copies of all three edited documents |

> **⚠️ Why a tag alone was insufficient, recorded because it will recur.** All three documents this
> item edits **already carried uncommitted changes** from earlier sessions (TIME3's Household Time
> rows in `ARCHITECTURE_PRINCIPLES.md` and the Register). A tag pins `HEAD`; it **cannot restore an
> uncommitted working tree**, so `git checkout <tag> -- <file>` would have silently discarded TIME3's
> unrelated, uncommitted work. The pre-change working-tree state of each file was therefore copied to
> the session scratchpad **before** the first edit. **To roll back this item: restore the three files
> from that backup, not from the tag.**

---

## 1. WHAT DOC-1 WAS, AND WHAT IT WAS NOT

**It was not a decision.** `ARCHITECTURE_PRINCIPLES.md` has named `household_eaters` the owner of a
person's diet facts since **2026-06-25**. `DOC-1` chose nothing, amended no rule, and created no
owner. **The rules were never wrong; the inventory was** — and this item corrected the inventory to
say what the senior document has said for three weeks.

CONV1 § 1.3's finding, restated once: the canon held **four positions across three documents**, and
the two most senior were **not disagreeing about the answer — they were describing different
questions.**

> **Principle 2 said the rival is `household_eaters`. Register Domain 7 said the rival is
> `user_preferences`. An engineer told to "resolve Domain 7" would read the Register, promote
> `user_preferences`, retire the `users` columns into it, mark the domain converged — and never touch
> `household_eaters` at all.** They would have converged onto the wrong owner, closed the ticket, and
> left Principle 2's actual violation entirely intact. **The contest was not unresolved. It was
> mis-specified, in the senior register.**

---

## 2. THE ONE CANONICAL POSITION NOW ESTABLISHED

Every corrected site now states this and nothing else:

| Claim | Status |
|---|---|
| **`household_eaters` is the owner of a person's diet facts** | ✅ Declared — `ARCHITECTURE_PRINCIPLES.md` Principle 2 (2026-06-25); Register Domains 7 + 16; `NK1` |
| **`users.dietPattern` / `users.dietRestrictions` are a redundant shadow of that owner** | ✅ Contested; **retire** under `OWN-1` |
| **Those columns are the *current live location* of adult diet data** | ✅ **A statement of fact, never of ownership** |
| **`user_preferences` is *not* a rival owner of diet** | ✅ Its diet overlap is a **Principle 7 bridge to delete**, never a promotion target |
| **Eater hard-restrictions vs week soft-diet are legitimately different facts** | ✅ Unchanged — scope test passes (Principle 2's own note) |
| **Retirement order: write door → read door → scaffolding** | ✅ Never the reverse. Retirement moves live allergens |

**The load-bearing distinction this item adds, and the reason the conflict survived six months:**

> **"Still the live path" and "the SoT" are not the same claim.** Register Phase 4 collapsed them —
> *"Retain … Mark them as the SoT until `user_preferences` is promoted"* — and that single collapse
> converted an accurate operational note (*don't drop these columns without a migration*) into a
> **ruling that contradicted Principle 2 outright**. A shadow is not promoted by being the only lit
> room.

---

## 3. ARCHITECTURE DOCUMENTS UPDATED

**Three documents. Eight sites. Zero rules changed.**

| # | Document | Site | Was | Now |
|---|---|---|---|---|
| 1 | `ARCHITECTURE_PRINCIPLES.md` | § 4 heading | **🟢 SAFE (lowest priority)** | **🟡 IMPORTANT** + evidence-based status block |
| 2 | `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` | **Domain 7** ★ | *"Contested … columns **vs `user_preferences` table**"* | **Owner: `household_eaters`**; live location recorded separately; wrong-rival note |
| 3 | " | **Phase 3, Duplication 4** ★ *(the root)* | Compared `users.diet*` **vs `user_preferences`**; *Conflict LOW / Launch GREEN* | Compares the **right pair**; 3 locations, 2 relationships; **Conflict HIGH / Launch YELLOW**; original preserved in `<details>` |
| 4 | " | **Phase 4 Retirement Register** ★ | *"**Retain** … Mark them as the SoT until `user_preferences` is promoted"* | **Retire → `household_eaters`**, with the CP2/CP3 ordering constraint |
| 5 | " | **Domain 27 (User Preferences)** | *"Contested columns … Contested — see Phase 3"* | **Authoritative for preferences; not authoritative for diet**; not contested |
| 6 | " | **Phase 5 consumers** | SoT declared as `users.diet*`; every consumer **YES**; bridge *"Not in conflict currently"* | SoT declared as **`household_eaters`**; verdicts inverted to **NO** with an explicit *not-a-work-queue* caveat |
| 7 | " | **Phase 7 launch risk** | *"users.dietPattern/dietRestrictions + user_preferences table \| 🟢 SAFE (for now)"* | Right pair named; **🟡 IMPORTANT** |
| 8 | " | **Appendix A** ★ | *"Dietary Preferences (user) \| DB `users.dietPattern` + `users.dietRestrictions`"* — unqualified | **DB `household_eaters`**, with the contest and live location declared |
| 9 | `capabilities/household.md` ★ | `eaters` scope + new **DIET OWNERSHIP** section | Read-time enrichment from `users.diet*` **stated as the contract** | Enrichment marked **known scaffolding over a Principle 2 violation**; precedence stated; four binding rules |

★ = named explicitly in CONV1's `DOC-1` convergence strategy.

### 3.1 Scope: four sites were named, eight were corrected — reported, not hidden

**CONV1's `DOC-1` named four sites** (Domain 7, Phase 4, Appendix A, `household.md`). **`WRITE-1`
routed a fifth** (`ARCHITECTURE_PRINCIPLES.md:192`'s grade — *"Correct with `DOC-1`"*). **Three more
were found stating the same conflict and were corrected:** Phase 3 Duplication 4, Domain 27, Phase 5.

**The justification is the mission's own standard — *"remove the conflicts"*.** Correcting Domain 7
while leaving Phase 3 still analysing the wrong pair, Phase 5 still marking the shadow-readers
compliant, and Phase 7 still grading it GREEN would have left the conflict standing in three places
and produced a register **freshly inconsistent with itself** — the precise defect `DOC-1` exists to
remove. **Phase 3 is the root**: Domain 7, Phase 4, Phase 5, Phase 7 and Appendix A all inherit its
comparison. Correcting the leaves and not the root would guarantee the error regrew.

**Two judgements are recorded here rather than buried, because a reviewer may overrule either:**

1. **Re-grading § 4's heading from 🟢 SAFE to 🟡 IMPORTANT.** CONV1 pointed at the *sentence*
   (`:192`), not the heading. But the heading is what deprioritised the item — and leaving **🟢 SAFE**
   above a body that now describes a **live split-brain** would have created a *new*
   document-contradicts-itself defect. **🟡 and not 🔴** is deliberate under **CP11** (*report the
   grade the evidence supports*): see § 5.2.
2. **Inverting Phase 5's verdicts to NO.** True against the declared owner, but a bare `NO` reads as
   *fix this now*, which would invert CP3 and discard live allergens. Each `NO` therefore carries the
   ordering constraint, and the table carries an explicit **"a `NO` here is not a defect to fix
   today … not a work queue"** preamble.

---

## 4. CONFLICTS RESOLVED

| # | Conflict | Resolution |
|---|---|---|
| **C1** | **Document ≠ document.** Principle 2 named the rival `household_eaters`; Register Domain 7 named it `user_preferences`. **The two were describing different questions** | Domain 7 now names `household_eaters`, citing Principle 2. `user_preferences` is explicitly recorded as **not a rival** |
| **C2** | **Document ≠ itself.** Register Domain 7 *"Contested"* vs Register Phase 4 *"Retain … the SoT"* | Phase 4 now reads **Retire → `household_eaters`**. The *live path* / *SoT* conflation is named as the cause |
| **C3** | **Register vs Principle 2.** Phase 4 declared the columns **the SoT**; Principle 2 declared them a shadow to retire | Resolved in the Principle's favour. **A register phase table cannot override a Principle** |
| **C4** | **Capability Card vs Principle 2.** `household.md` specified read-time enrichment from `users.diet*` **as the capability's contract** | Card corrected. Precedence stated: **a Capability Card cannot override a Principle; the Principles prevail and the card was the defect** (PEOPLE1 § 9.1's reasoning, applied) |
| **C5** | **Appendix A declared the shadow, unqualified** — the quick-reference most likely to be read alone | Now declares `household_eaters` with the contest and live location visible |
| **C6** | **The root mis-analysis.** Phase 3 audited the wrong pair and graded it LOW/GREEN; five downstream sites inherited it | Phase 3 corrected to the right pair; original preserved struck, so the error stays legible |
| **C7** | **A stale grade.** *"Currently no live split-brain, but risk is structural"* under a **🟢 SAFE** heading | Corrected with the precise, verified facts (§ 5.2) |
| **C8** | **A citation pointing at unrelated code.** `household.md` cited `routes.ts:8526–8541` as the enrichment mirror | **Those lines are now the CPV1 publication-integrity route.** Line-number citations removed in favour of behaviour + owner |

---

## 5. VERIFICATION COMPLETED

**Every claim written into a governing document was verified against the live code or the live
document first.** Nothing was inherited from CONV1, PEOPLE1 or CPI1 without checking — three of those
checks changed what was written.

### 5.1 Verified before assertion

| # | Claim | Method | Result |
|---|---|---|---|
| V1 | Register Domain 7 names `user_preferences` as the rival | Read live file | ✅ Confirmed verbatim |
| V2 | Phase 4 rules *"Retain … the SoT"* | Read live file | ✅ Confirmed verbatim |
| V3 | Appendix A declares the columns unqualified | Read live file | ✅ Confirmed verbatim |
| V4 | `household.md` specifies the enrichment as contract | Read live file | ✅ Confirmed at `:38-40` |
| V5 | Principle 2 names `household_eaters` throughout | Read live file `:38`, `:124`, `:190-196` | ✅ Confirmed — **already correct; not edited except the grade** |
| V6 | **The bridge exists and is one-way** | Read `server/routes.ts` profile write path | ✅ Fires **only** when `dietPattern` is written |
| V7 | **`PUT /api/user/preferences` does not write back** | Read the route handler | ✅ `upsertUserPreferences(…, parsed)` — **never touches `dietPattern`**. **Divergence is reachable** |
| V8 | The eater write door 403s adult rows | `grep` `server/routes.ts` | ✅ Confirmed — adult rows empty *by design* |
| V9 | **CPI1 S1-1 (allergens dropped from Companion context)** | `grep` `server/storage.ts` | 🔄 **CLOSED** — the hardcoded `dietRestrictions: []` is gone; `unionRestrictions` now reads `safety.hardRestrictions`. **§ 5.3** |
| V10 | `household.md`'s cited line numbers | Read `routes.ts:8526-8541` | 🔄 **STALE — worse than PEOPLE1 recorded.** Those lines are now the **CPV1 publication-integrity route**. Real sites: `:4770`, `:9034` |
| V11 | `NK1` states a diet owner | `grep` | ✅ **`household_eaters` — Authoritative.** **It agrees.** § 5.4 |
| V12 | README states a diet-ownership position | `grep` | ✅ **None** — nothing to correct |
| V13 | Remaining *"Contested — see Phase 3"* statuses | Traced each to its domain | ✅ Domain 6 (Dietary Rules) + Domain 18 (Nutrition Boost) — **different duplications, correctly untouched** |

### 5.2 The one place this item corrects CONV1 — reported, not silently propagated

**CONV1 `WRITE-1` states: *"`ARCHITECTURE_PRINCIPLES.md:192`'s grade is out of date … The
split-brain is live."*** That is imprecise about **which pair**, and propagating it unexamined would
have written a false statement into a Principle:

- **`:192`'s sentence is about `users.diet*` vs `household_eaters`** — and for *that* pair the claim
  *"no live split-brain"* **is still literally true**: adult eater rows are written empty and the
  eater write door 403s, so no divergent value is held.
- **`WRITE-1`'s live split-brain is `users.dietPattern` vs `user_preferences.dietTypes`** (V6/V7) — a
  **different pair**, also live, and on the diet **pattern** (a soft preference), **not** on
  `dietRestrictions` (the hard safety fact).

> **So `:192` was not *false*. It was *misleading*** — because the absence of divergence is
> **manufactured by locking the correct owner's write door**, and because the document was silent on a
> live split-brain existing on the same columns. **The correction says exactly that**, and does not
> claim the `household_eaters` pair is diverging when it is not.

**This is also why the regrade is 🟡 and not 🔴** (**CP11**): the plate-safety symptom is closed
(V9), the safety fact holds no divergent value, and the live divergence is a preference. It is
**not** 🟢, because the ownership is inverted and the retirement itself moves live allergens.

### 5.3 CPI1's proposed repair is superseded by this item — and CPI1 predicted it

`CPI1:263` proposed:

> *"The repair is bounded … the Register's Phase 4 already ruled 'Retain `users.dietPattern`/
> `users.dietRestrictions` — mark them as the SoT until `user_preferences` is promoted.' **If that
> ruling still stands**, the work is to make the code obey a decision that has already been taken."*

**That ruling no longer stands** — `DOC-1` corrected it (site 4). CPI1's hedge (*"if that ruling
still stands"*) was exactly right, and the answer is now recorded. **Any future work citing CPI1:263
must read Phase 4 as corrected**: the decision already taken was Principle 2's, not Phase 4's, and it
names `household_eaters`.

**CPI1:34 also traced a live safety defect to the Register's grade** — *"the direct product of a
dual-ownership split-brain the Source of Truth Register has carried as 'GREEN — low immediate risk'
since June."* **That grade is now corrected** (sites 3, 7). The defect itself (S1-1) is **closed**
(V9) and was **not** written into the register as live.

### 5.4 The canon agreed more than CONV1 counted

CONV1 § 1.3 tallied five positions across three documents. **`NK1` is a fourth governing document
that already named `household_eaters` Authoritative for dietary restrictions** (V11) and was never
counted. The corrected position therefore has **`ARCHITECTURE_PRINCIPLES.md` + `NK1` + Register
Domain 16** behind it, and only the corrected sites ever said otherwise. *(`NK1`'s separate defect —
claiming an `age` column that does not exist — is **`DOC-2`**, out of this item's scope and untouched.)*

### 5.5 Gates

| Gate | Result |
|---|---|
| `.engineering/scripts/repo-structure-verify.sh` | **PASS** on all filing checks. *(Pre-existing unrelated FAIL on `.glibcheck.txt` / `.libdirs_uxhome.txt` at root — untracked before this session; noted by ORCH1/PLAN1/COOK1/SHOP2/HOUSE4)* |
| Markdown validity | `<details>` open/close balanced 1:1 |
| Grade vocabulary consistency | Aligned to each section's own scale — Phase 3 uses `HIGH/MEDIUM/LOW` + `HIGH/YELLOW/GREEN`; Principles uses 🔴/🟡/🟢. **No new scale invented** |
| **Code / schema / runtime** | **UNTOUCHED — verified by `git diff`.** No file under `server/`, `client/`, `shared/` or any migration was modified by this item |

---

## 6. CONFIRMATION: THE GOVERNING ARCHITECTURE NOW PRESENTS ONE CANONICAL POSITION

**Confirmed.** Executed as a fresh read across every governing document that states an owner for a
person's diet:

| Document | Site | States |
|---|---|---|
| `ARCHITECTURE_PRINCIPLES.md` | § 4 | **`household_eaters`** |
| " | SoT table `:124` | **Contested — shadows `household_eaters`** *(already correct; untouched)* |
| Register | Domain 7 | **`household_eaters`** |
| " | Domain 16 | **`household_eaters`** — Authoritative *(already correct; untouched)* |
| " | Domain 27 | **Not authoritative for diet** → `household_eaters` |
| " | Phase 3 Dup. 4 | **`household_eaters` = THE OWNER** |
| " | Phase 4 | **Retire → `household_eaters`** |
| " | Phase 5 | SoT declared = **`household_eaters`** |
| " | Phase 7 | Shadowing **`household_eaters`** |
| " | Appendix A | **DB `household_eaters`** |
| `capabilities/household.md` | DIET OWNERSHIP | **`household_eaters`** |
| `NK1` | `:139-140` | **`household_eaters`** — Authoritative *(already correct; untouched)* |

> **Eleven sites across four governing documents. One owner named at every one. Zero name
> `user_preferences` as a rival, and zero name the `users.diet*` columns as the SoT.**

**And the four positions of CONV1 § 1.3 are closed:**

| CONV1 § 1.3 position | Status |
|---|---|
| 1. Principles — *"a redundant shadow; retire it"* | ✅ **Upheld — this is now the only position** |
| 2. Domain 7 — *"Contested … vs `user_preferences`"* | ✅ **Corrected — wrong rival removed** |
| 3. Phase 4 — *"Retain … the SoT"* | ✅ **Corrected — now Retire → `household_eaters`** |
| 4. Appendix A — the shadow, unqualified | ✅ **Corrected** |
| 5. `capabilities/household.md` — *"the design"* | ✅ **Corrected — named as scaffolding over a violation** |

**`OWN-1`'s CP4 precondition is satisfied.** An implementer beginning the Person convergence today
reads **one** instruction from every governing document: *the owner is `household_eaters`; the
`users.diet*` columns are a shadow to retire; move the write door first; `user_preferences` is not a
promotion target.* **`WRITE-2`'s `DOC-1` dependency is likewise cleared.**

---

## 7. WHAT THIS ITEM DELIBERATELY DID NOT DO

- **No application code.** No route, handler, service, component or test touched. **Verified by `git diff`.**
- **No schema.** No column, table, migration or type.
- **No runtime behaviour.** The bridge still runs; the 403 still stands; the read-time enrichment still fires. **`DOC-1` changes what the canon *says*, never what the platform *does*** — that is `OWN-1`.
- **`OWN-1` not implemented, begun, or designed.** This item is its precondition, not its first step.
- **`DOC-2` untouched** — `NK1`'s false `age`/Authoritative claims and the dangling `NK1:418` §6.3 pointer remain. Named, not fixed.
- **`DOC-3` / `DOC-4` untouched** — the false `dayOfWeek` comment and the stale Product Knowledge status block remain. CONV1 recommends bundling them with `DOC-1`; **this mission said `DOC-1` only, and that instruction was followed.**
- **No rule created or amended.** Every corrected site now *cites* Principle 2 rather than restating it. **If any statement written here is found to duplicate a rule owned elsewhere, the statement here is the defect.**
- **The section ordering in `ARCHITECTURE_PRINCIPLES.md` § "ordered by launch risk" not reordered** — the regrade makes that ordering stale; reordering four sections is not a documentation correction and is recorded rather than performed.
- **The errors were preserved, not erased.** Every corrected site records what it previously said. A register that silently rewrites its own history cannot be audited, and CONV1's § 8.2 measure depends on the record.

---

## 8. NEXT CONV1 ITEM

> ### **`DOC-2` — `NK1` asserts a safety-relevant field is stored and Authoritative; the column does not exist**

**Why it is next.** CONV1 § 7 P1 (*"Correct the canon"*) bundles `DOC-1` · `DOC-2` · `DOC-3` ·
`DOC-4` · `OWN-5` as one governance-correction phase — *"free, and it unblocks Tier 2"*. `DOC-1` is
now closed; **`DOC-2` is the only remaining Tier 1 item with a safety-relevant claim.** It has **no
dependencies**, and this item's V11 already touched `NK1:139` and confirmed the false claim is live:
*"Eater Composition | DB `household_eaters` | Name, **age**, dietary restrictions | **Authoritative**"*
— **there is no age column and there never has been.** `DOC-2` must also resolve the dangling
`NK1:418` §6.3 pointer — **without inventing the missing section.**

**Then, in CONV1's order:** `DOC-3` (one comment, out of band) · `DOC-4` (the Product Knowledge status
block) · `OWN-5`. **`OWN-1` must not start until P1 lands** — CONV1 § 7: *"No implementer should start
`OWN-1` against a canon holding four positions."* **That canon no longer holds four positions on
diet** — but `DOC-2`'s false inventory sits on the *same entity* `OWN-1` converges onto, and its
failure mode is `undefined` failing open.

---

## 9. COMPLIANCE

- **Architecture Bootstrap (STEP 2):** read before any change.
- **Principle 2 (one owner per fact):** the whole subject. **Upheld, not amended.**
- **Principle 7 (no permanent sync bridges):** the `user_preferences` mirror is named as a bridge to delete, never as a contest — closing the mis-specification.
- **Principle 6 (honest gaps over invented facts):** CPI1's S1-1 was verified **closed** (V9) rather than restated as live; the `household_eaters` pair is recorded as **non-divergent**, which is the truth, rather than as diverging because that would have been the more dramatic finding.
- **CPuBA6 (the Register must stay current):** the item's entire purpose.
- **CP1 (convergence restores, never creates):** zero new owners, zero new domains, zero new stores.
- **CP4 (correct the document before implementing against it):** `DOC-1` **is** CP4, executed.
- **CP11 (report the grade the evidence supports):** § 5.2 — 🟡 not 🔴, and CONV1's own imprecision corrected rather than propagated.
- **PEOPLE1 § 9.1's routing honoured:** *"the Principles prevail, and the card is the defect — a correction, not an amendment."* Performed exactly, by a governed act rather than by an investigation.
- **The mission's stop conditions:** honoured. **No application code. No schemas. No `OWN-1`. No runtime behaviour.**

---

*An implementation report for a **documentation-only** correction. It records a change to governing architecture; it is not itself governing. Where this report and a governing document disagree, **the governing document wins and this report is the defect**.*
*Rollback: `rollback/DOC1-architecture-conflict-resolution-20260716` → `7d1dd2ce`. **To revert, restore the three edited documents from the session scratchpad backup — not from the tag**, which cannot carry the uncommitted TIME3 work those files also hold (see ROLLBACK PROTECTION above).*
