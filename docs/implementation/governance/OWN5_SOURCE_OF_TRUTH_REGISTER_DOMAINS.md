# OWN-5 — Four Live Domains Had No Source of Truth Register Row — Implementation

**Status:** IMPLEMENTED — governing documentation only.
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Workstream:** `OWN5_Source_Of_Truth_Register_Domains`
**Authority:** [`CONV1 — Architecture Convergence Programme`](../../investigations/governance/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md) § Tier 1, item `OWN-5`; § 7 phase **P1 — Correct the canon**. **The final P1 item.**
**Governing architecture read:** `docs/architecture/README.md` (Architecture Bootstrap, STEP 2), `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Rules 1, 5, 8), `CANONICAL_PUBLICATION_ARCHITECTURE.md`, `THA_OBSERVATION_ENGINE_ARCHITECTURE.md`, `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`, `REPOSITORY_CONVENTIONS.md`.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| **Rollback ID** | `rollback/OWN5-source-of-truth-register-domains-20260716` → `7d1dd2ce` |
| **Stash** | `OWN5_ROLLBACK: pre-implementation dirty-tree snapshot 2026-07-16` (`stash@{0}`, re-applied — tree preserved) |
| Created | **Before any file was touched** (STEP 1) |
| Working tree | Intentionally dirty — concurrent sessions hold uncommitted work (87 entries; 19 modified tracked files, 578 insertions / 380 deletions). The stash was **immediately re-applied and the restoration verified byte-for-byte**, so no concurrent session's tree was destroyed |
| Files this workstream touched | **1 governing document + this report + 1 run file.** Nothing else |

**To roll back:** `git checkout rollback/OWN5-source-of-truth-register-domains-20260716 -- docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`

> **A caution for whoever rolls this back.** That tag points at `7d1dd2ce`, which is **before the `DOC-1` correction** to the same document — `DOC-1`'s work was uncommitted in the working tree when this item began. Checking the file out of the tag would silently revert `DOC-1` as well. **To reverse only `OWN-5`, delete the four Domain 30–33 entries, the Phase 1 note and inventory rows, and the four Appendix A rows** — this item's changes are **purely additive** (§ 4.3, V9) and are contiguous blocks.

---

## 1. WHAT OWN-5 WAS

**Register Rule 1** — *"Every major domain must declare a named source of truth"* — **breached by omission, four times.**

`OWN-5` is the third defect class CONV1 separates, and it is neither of the other two:

| Class | Shape | This item |
|---|---|---|
| *A law ahead of its platform* | The rule is right; the code has not caught up (`TIME3`, `OWN-4`) | **No** |
| *A false inventory* | The document asserts something untrue (`DOC-1`, `DOC-2`, `DOC-4`) | **No** |
| **An absent inventory** | **The document that owns ownership does not know the domain exists** | **Yes** |

The distinction is not academic. A false claim misleads a reader who finds it. **An absent one misleads a reader who goes looking and concludes there is nothing to find** — and then declares a second owner, in good faith, because the Register told them the domain was unclaimed.

**Nothing was created.** Every one of the four domains already had exactly one owner in live code. `OWN-5` transferred none, chose none, and invented none — it **wrote down the owners that already existed**. This is CONV1's principle `CP1`: *"Convergence restores; it never creates."* Register **Rule 8 was checked and not triggered**: no new table, file, or module stores anything as a result of this item.

---

## 2. DOCUMENTS UPDATED

| Document | Sites | Nature |
|---|---|---|
| [`docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](../../architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) | **3 blocks** — Phase 1 inventory (+ note, rows 28–33); Phase 2 declarations (Domains 30–33); Appendix A (4 rows) | Retrospective declaration of four live domains |

**One document. 134 insertions, 0 deletions** *(measured against this session's starting tree — see § 4.3, V9)*. No application code, no schema, no migration, no runtime behaviour, no other governing document.

### 2.1 Why only one document

The mission permitted *"related architecture documents **required** to establish canonical ownership."* **None were required, and the check was run rather than assumed** (§ 4.3, V10):

- **No architecture document carries a domain count** that Domains 30–33 make stale. `README.md:33`'s *"Domain 29 of the Source of Truth Register"* is Product Knowledge, and **remains correct** — the new rows are appended, so no existing domain was renumbered.
- **No code cites a Register domain number ≥ 30** — they did not exist to be cited.
- The `docs/architecture/README.md` Bootstrap already indexes the Register as governing. Nothing there became false.

---

## 3. THE FOUR DOMAINS DECLARED

| # | Domain | Source of truth declared | The fact that shaped the row |
|---|---|---|---|
| **30** | **Pantry State** | DB `user_pantry_items`, owned by `server/storage.ts` | **Scoped per-household on `household_id`** — `user_id` is the authoring member, *not* the access scope. And it **owns no food ageing whatsoever** |
| **31** | **Evidence & Learning (EL1)** | DB `household_evidence_events` + `household_learning_signals`, owned by `evidence-learning-store.ts` | The row **makes a claim shipped code has made since 2026-07-03 true for the first time** |
| **32** | **Platform Observations (OBS1)** | DB `platform_observations`, **sole-owned** by `observation-store.ts` | The only one of the four whose ownership claim **was already true and verified** |
| **33** | **Benchmark World** | `server/benchmark/world-fixtures.ts` + `docs/intelligence/benchmark/history/` | **Owns no table at all** — which corrects the finding that produced the item (§ 4.1) |

### 3.1 Domain 30 — the gap that is the point of the row

**The pantry has no concept of food ageing.** No expiry, no purchase date, no best-before, no shelf life. The only temporal column on `user_pantry_items` is `created_at` (`shared/schema.ts:1024`) — a row-insert timestamp. The `expiry_date` at `schema.ts:813` belongs to **`freezer_meals`**, a different table.

CONV1 states the consequence exactly: *"The domain most semantically entitled to expiry owns none."*

**The row records the gap and does not close it.** Adding a fact to a domain is a governed act under Rule 8; `OWN-5` is a declaration. But CONV1's sequencing claim is now discharged — *"a domain with no declared owner cannot be given a new fact"* — and **pantry freshness is unblocked**, independently of Household Time.

### 3.2 Domain 32 — the row whose value is that nothing reads it

Observations is the one domain here whose entire architecture depends on **nothing ever reading it back into behaviour** (`THA_OBSERVATION_ENGINE_ARCHITECTURE.md:182`). The row declares that prohibition alongside the owner, because a future reader finding a rich telemetry table and no stated prohibition would reasonably assume it was available to reason over. It is the rule `HT16` and Household Time § 8.1 both rest on.

---

## 4. VERIFICATION COMPLETED

### 4.1 The correction: **Benchmarks owns no table** — reported, not silently propagated

**`CPI1:173`, quoted verbatim by `CONV1` item `OWN-5`, states:**

> *"Three live, **table-owning**, runtime-read domains have no row at all: Benchmarks, Learning (EL1), and Observations (OBS1)."*

**Verified against live code: Benchmarks is not table-owning.**

| Method | Result |
|---|---|
| Enumerated **all 88 `pgTable` declarations** in `shared/schema.ts` | **None is benchmark-related** |
| Swept `server/benchmark/` and `server/tests/benchmark/` for `pgTable` | **Zero** |
| Swept both trees for `drizzle-orm/pg-core` imports | **Zero** |
| `world-fixtures.ts:32-35` self-declaration | *"This module is pure data + types. **No database imports**"* |

**The "no row at all" half of the finding was true. The "table-owning" half was not.**

**This is not pedantry — it changes what the row must say.** Declared as table-owning, Domain 33's source of truth would have been recorded as **a table that does not exist**. A reader looking for the ten Benchmark Households would have searched the database, found nothing, and been left exactly where the missing row left them. The real source of truth is an **authored TypeScript fixture** plus an **append-only directory of JSON on the filesystem** — which Rule 1 permits in as many words: *"a file path or DB table name."*

**Why the audit reached it:** the three domains were found together, by the same sweep, and share the same true property (no Register row) and two of three share a second (table-owning). The generalisation was one domain too wide. Benchmarks' only DB footprint — `benchmark-run` rows in `platform_observations` — is real, but that table is **Domain 32's**, and CPI1's own sweep would have surfaced it under Observations.

> **CPI1 and CONV1 are history and are not edited** (`REPOSITORY_CONVENTIONS.md` § 3 — investigations are point-in-time analysis). Their text stands. The correction of record is **Domain 33's entry and this section**, filed rather than propagated silently.

### 4.2 Two further corrections to inherited claims

**(a) Citation drift — `capability-registry.ts:725` → `:711`.** CPI1, CONV1 and `DOC4`'s handoff all cite `:725` for the *"SoT-registered under EL1"* assertion. **The `owner:` string is now at `:711`**; line 725 today is an unrelated `description:` field on the `administration` capability. The claim is real and was verified at its true location. *(This is the third P1 item to find a drifted citation — `DOC-2`'s `NK1:418` was mis-cited, `DOC-3`'s was off by 19 lines.)*

**(b) EL1's sole-ownership claim is false, not merely unregistered.** `evidence-learning-store.ts:4-7` asserts *"No other module reads or writes these tables directly."* **Seven sites contradict it** — recorded in full in Domain 31. The most significant is **`server/verification/publication-register.ts:1298`**, which reads `household_learning_signals` by raw SQL: **the verification platform bypasses the owner it verifies.**

This materially deepens the finding. CPI1 recorded EL1 as *"asserts SoT registration; is not registered"* — a **documentation** gap, closed by this item. It is also an **ownership** gap, which this item **does not** close, because closing it requires code.

> **Root cause recorded so the fix is not guessed:** `IEvidenceLearningStore` (`:106-127`) exposes **no delete or reset method**, so every fixture-reset path is forced out of contract by construction. And **no test asserts sole ownership** — the repo's tests assert only the narrower EL2 one-door rule (`test-learn1-household-learning.ts:511-524`) — which is why it drifted unobserved. **This is CP10 in miniature: a rule with no gate regressed, and nobody knew.**

### 4.3 Verified before assertion — claims re-derived from live code, not inherited

| # | Claim | Method | Result |
|---|---|---|---|
| V1 | Pantry has no Register row | Grep `user_pantry_items`/`pantry` in the Register | ✅ Zero — **the domain existed for the Register's whole life and was never in it** |
| V2 | Benchmarks / Learning / Observations have no row | Grep `benchmark`, `EL1`, `observation` in the Register | ✅ Zero, zero, and one **unrelated** hit (`:945`, a Decision Engine row) |
| V3 | `user_pantry_items` owns no ageing fact | Full column read (`schema.ts:1010-1025`) + repo sweep for `expir\|best_before\|use_by\|purchase\|shelf_life` | ✅ Only `created_at`. The sole `expiry_date` is `freezer_meals` (`:813`) |
| V4 | Pantry is household-scoped | `storage.ts:2134` read; unique index `runner.ts:834-836`; dropped per-user constraint `runner.ts:823` | ✅ `household_id` alone in the canonical predicate |
| V5 | **Benchmarks owns no table** | All 88 `pgTable` enumerated; both benchmark trees swept for `pgTable` + `pg-core` | ✅ **CPI1 corrected** (§ 4.1) |
| V6 | EL1's sole-ownership claim | Repo-wide sweep for both Drizzle symbols **and** raw table names | ❌ **False — 7 violating sites** (§ 4.2b) |
| V7 | OBS1's sole-ownership claim | Same method | ✅ **True** — zero access outside `observation-store.ts` |
| V8 | The EL1 assertion sites still exist | Read `evidence-learning-store.ts:1-10`, `capability-registry.ts:711` | ✅ Both live — **at `:711`, not `:725`** (§ 4.2a) |
| V9 | **Purely additive; nothing destroyed** | `git diff stash@{0} --numstat -- <register>` | ✅ **134 insertions, ZERO deletions.** *(The `git diff HEAD` figure of 234/30 includes `DOC-1`'s uncommitted work, which was in the tree before this session — the deletions are **not** this item's)* |
| V10 | No related architecture doc requires updating | Grep for domain counts across `docs/architecture/`; grep for `Domain 3[0-3]`/`SoT D3[0-9]` across `server/`, `shared/`, `client/` | ✅ None stale; no code cites the new numbers (§ 2.1) |
| V11 | No domain was renumbered | Rows appended at 30–33; Domains 1–29 untouched | ✅ Every existing citation (`SoT D14`, `Domain 29`, …) still resolves |
| V12 | Working tree preserved across the stash | `git status` + `git diff --stat` before/after | ✅ 19 modified, 578/380 — **identical**; untracked assets intact |

### 4.4 Gates

| Gate | Result |
|---|---|
| `repo-structure-verify.sh` — `docs/` rules | ✅ **PASS** — report filed under `docs/implementation/governance/` by workstream; no loose files, no duplicates |
| `repo-structure-verify.sh` — root | ⚠️ **PRE-EXISTING FAIL, not this item's** — `stray: .glibcheck.txt`, `stray: .libdirs_uxhome.txt`. Both untracked and present before this session. Not created, not touched, **not removed** — they belong to a concurrent session. *(Identical to `DOC-2` § 4.3 and `DOC-4`.)* |
| Application gates (typecheck / tests / `verify:publication`) | **Not applicable and not run** — this item changed prose in one Markdown file. No code path, no publication contract, and no runtime surface exists to exercise |

---

## 5. CONFIRMATION: PHASE P1 IS COMPLETE

**Confirmed. CONV1 § 7 phase **P1 — Correct the canon** bundles five items: `DOC-1` · `DOC-2` · `DOC-3` · `DOC-4` · `OWN-5`.**

| Item | Status |
|---|---|
| `DOC-1` — Diet ownership canon | ✅ Closed |
| `DOC-2` — NK1 asserted a stored age | ✅ Closed |
| `DOC-3` — the false `dayOfWeek` comment | ✅ Closed |
| `DOC-4` — Product Knowledge status | ✅ Closed |
| **`OWN-5` — the four missing domains** | ✅ **Closed by this item** |

**P1 is complete, and `OWN-1` is unblocked.** CONV1's gate on Tier 2 was: *"No implementer should start `OWN-1` against a canon holding four positions."* The canon no longer holds four positions on diet (`DOC-1`), claims no age it does not have (`DOC-2`), no longer contradicts itself on `dayOfWeek` (`DOC-3`), no longer denies the existence of a registry it built (`DOC-4`), and **no longer omits four of its own live domains** (`OWN-5`).

### 5.1 Ownership verified — the scope of this confirmation

**Every one of the four domains now declares a named source of truth, and each name was verified to exist:**

| Domain | Rule 1 satisfied by | Ownership claim status |
|---|---|---|
| 30 Pantry | `user_pantry_items` + `server/storage.ts` | Declared. **2 Rule 5 consumer defects recorded** |
| 31 Learning | 2 tables + `evidence-learning-store.ts` | Declared. **Sole-ownership claim false — 7 sites** |
| 32 Observations | `platform_observations` + `observation-store.ts` | Declared. **Verified true** |
| 33 Benchmark World | `world-fixtures.ts` + `docs/intelligence/benchmark/history/` | Declared. **Owns no table, and must not acquire one** |

**What this confirmation is not.** It is **not** a claim that the four domains are *converged* — Domains 30 and 31 carry live Rule 5 defects, recorded in their rows. **Declaring an owner and enforcing it are different acts**, and CONV1 is explicit (`CP10`): *"A convergence is finished when a gate can fail."* **No gate fails on the EL1 or pantry ownership defects today**, and `OWN-5` did not add one, because adding one is code.

The Register's **FINAL QUESTION** — *"Can THA truthfully state: 'Every core domain has a single source of truth'?"* — **still answers NO, correctly, and this item does not change that.** What changed is smaller and worth stating precisely: **the four domains are now in the argument.** Before this item they were not wrong in the Register; they were *absent from it*, which is the one state no audit can grade.

---

## 6. WHAT THIS ITEM DELIBERATELY DID NOT DO

### 6.1 The refusals

| Not done | Why |
|---|---|
| **Add pantry expiry / purchase date** | `OWN-5` is a declaration. Adding a fact is a governed act under **Rule 8** — and it is the *unblocked* work, not this work (§ 3.1) |
| **Fix EL1's seven sole-ownership violations** | Requires code. Explicitly forbidden by the mission. Filed as a follow-on (§ 6.2) |
| **Fix `product-event-logger.ts:112`'s wrong-scope pantry read** | Same — and it is a **live scope defect**, not a style issue. Filed (§ 6.2) |
| **Update `publication-register.ts:1289`'s now-stale known gap** | It is **application code**. It reads *"EL1 asserts SoT registration in shipped code, but the SoT Register holds no row for it"* — **which this item just made false.** Filed (§ 6.2) |
| **Correct the Observation Engine's thirteen-vs-fourteen kind drift** | A different governing document with a different owner — the line `DOC-2` drew for `NK2` and `DOC-4` for `PKCA`. Recorded in Domain 32; filed (§ 6.2) |
| **Renumber or reorder Domains 1–29** | Every `SoT D14`-style citation in code and docs would silently break. Appended instead (V11) |
| **Edit `CPI1` or `CONV1`** | Investigations are history and are never edited. Their claims are corrected **in this report** (§ 4.1, § 4.2) |
| **Update the Register's "27 domains" Definition of Done table** | **A different defect class, and pre-existing** — Domains 28 and 29 already broke it, in 2026-07-11/12, without correction. It is an accurate record of what the 2026-06-23 investigation *did*. Adopting a new defect class under a narrow mandate is the expansion `DOC-2` § 6.2 declined. Filed (§ 6.2) |
| **Remove the two stray root files** | Not this item's, and not this session's (§ 4.4) |

### 6.2 Follow-ons filed, so they are not rediscovered

**Recorded here rather than silently folded in — `PKR1` Risk R7: *discovery without transfer of ownership* is THA's most repeated failure.**

| # | Item | Class | Why it matters |
|---|---|---|---|
| **F1** | **EL1's sole-ownership claim is false — 7 direct-access sites** (§ 4.2b) | Code — 🔴 highest of these | The verifier itself (`publication-register.ts:1298`) is a violator. **Root cause: `IEvidenceLearningStore` has no reset method, so fixtures cannot comply; and no test asserts the rule.** The fix is a store method + a gate, not seven edits |
| **F2** | **`product-event-logger.ts:112` reads pantry directly, by `user_id`** | Code — 🟡 | Not merely a Rule 5 bypass: it counts **a member's** pantry where the canonical scope is **the household's**. A wrong number, not just a wrong path |
| **F3** | **`publication-register.ts:1289`'s known gap is now stale** | Code — 🟢 | *"the SoT Register holds no row for it"* — false as of this item. **Left deliberately: `OWN-5` changes no code.** A stale *closed* gap is the benign direction, but it is exactly the `KC14` currency failure |
| **F4** | **Observation Engine documents 13 kinds; code declares 14** (Domain 32) | Docs — 🟢 | `delivery-decision` (DEC1) is documented in the Decision Engine architecture instead. **The code is ahead of its document** — the inverse of `DOC-2`'s shape |
| **F5** | **The Register's Definition of Done still reads "27 domains"** | Docs — 🟢 | Pre-existing since Domain 28. Bundle with F4 as a `DOC`-class currency sweep |
| **F6** | **Appendix A never received Domains 28 or 29** | Docs — 🟢 | Found while adding rows 30–33: Preparation Knowledge and Product Knowledge are declared in Phase 2 but **absent from the quick reference**. Same currency class as F5 |

> **F1 and F2 together are the honest headline of this item.** `OWN-5` was scoped as *"documentation-only, and it unblocks a whole product area."* That is true. But declaring the owners **surfaced that two of the four are not actually sole-owned in code** — which the Register could not have told anyone while the rows did not exist. **The declaration did not create the defects; it made them visible.** That is what the row is for.

---

## 7. NEXT CONV1 ITEM

> ### **Tier 2 opens. `OWN-1` — the Household Person — is unblocked, and CONV1 gates it behind P1, which is now complete.**

**The programme's own sequencing (§ 7) puts the next work in two places, and they are not in conflict:**

| Next | What | Why |
|---|---|---|
| **`SEC-2` / `SEC-3`** | The latent security items | CONV1 § 8: *"They are still **first**, because they cost nothing to fix and their mask is not a control."* Graded **latent, not exploitable** (`CP11`) — masked by UTC containers, and **a mask is not a control** |
| **`OWN-1`** *(phase P4, ★ the largest)* | Retire the `users.dietPattern` / `dietRestrictions` shadow onto `household_eaters` | *"The largest convergence. It carries all the risk — the only one where a mistake reaches a plate."* **Requires P1**, which this item completes |

**A recommendation, not a decision.** `SEC-2`/`SEC-3` are cheap, out-of-band, and CONV1 puts them first explicitly. `OWN-1` is now *permitted* to start — the canon it would be implemented against is corrected — but it is P4, it depends on `WRITE-3` → `WRITE-2`, and it is the item CONV1 says carries all the risk. **P1 completing is what makes `OWN-1` legal to start; it is not what makes it next.**

**One item this unblocks that is not on the critical path:** **pantry freshness**. CONV1 graded `OWN-5` as blocking it *"independently of time"* — *"a domain with no declared owner cannot be given a new fact (Rule 8)."* Domain 30 now exists, and its row states the gap in terms an implementer can act on. Adding the fact remains a **governed act under Rule 8**, and Domain 30's row is where that check now starts.

---

## 8. COMPLIANCE

- **Architecture Bootstrap (STEP 2):** `docs/architecture/README.md` read before any change.
- **STEP 1 — Rollback:** created **before any file was touched**; identifier recorded above; concurrent trees preserved and **verified restored** (V12).
- **`REPOSITORY_CONVENTIONS.md`:** report filed under `docs/implementation/governance/` by workstream — `repo-structure-verify.sh` passes on every `docs/` rule.
- **Register Rule 1:** the item's entire content — four domains, four named sources of truth, each verified to exist.
- **Register Rule 8:** **checked and not triggered.** No new table, file, or module stores anything as a result of this item.
- **Core Principle 2 (one owner per fact):** **no second owner created.** Each row records the owner already in code. Where a domain's ownership is contested in practice (Domains 30, 31), the row **records the contest** rather than resolving it by decree.
- **Core Principle 6 (honest gaps over invented facts):** the pantry's absent food-ageing (§ 3.1), EL1's false sole-ownership (§ 4.2b), and Benchmarks owning no table (§ 4.1) are each recorded as they are. **`OWN-5` invented no owner to make a row look finished.**
- **CONV1 `CP1` (*convergence restores; it never creates*):** every row lands on a store already authoritative in code.
- **CONV1 `CP11` (*report the grade the evidence supports*):** § 4.1's correction, and § 5's refusal to call the four domains *converged* when two carry live defects and no gate fails on either.
- **Experience & UI Governance / Product Registry Compliance:** **not applicable** — no user-facing surface, no client building block, and no product-knowledge entry is created, changed, or retired by a declaration in an internal architecture document.
- **Deviations:** three — reported in § 4.1 and § 4.2, not silently applied.

---

*Implementation completed: 2026-07-16*
*Rollback: `rollback/OWN5-source-of-truth-register-domains-20260716` → `7d1dd2ce`*
*CONV1 phase **P1 — Correct the canon: COMPLETE** (`DOC-1` · `DOC-2` · `DOC-3` · `DOC-4` · `OWN-5`)*
*Next CONV1 item: `SEC-2`/`SEC-3` (cheap, out-of-band, CONV1 § 8 puts them first); `OWN-1` is now unblocked but is P4*
