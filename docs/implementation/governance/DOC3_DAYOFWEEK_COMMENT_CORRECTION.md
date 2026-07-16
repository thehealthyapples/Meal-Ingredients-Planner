# DOC3 — The False `dayOfWeek` Comment On The Fabricated-Date Line — Implementation

**Status:** IMPLEMENTED — comments only. **Zero executable change.**
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Workstream:** `DOC3_DayOfWeek_Comment_Correction`
**Authority:** [`CONV1 — Architecture Convergence Programme`](../../investigations/governance/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md) § Tier 1, item `DOC-3`; § 7 phase **P1 — Correct the canon**.
**Governing architecture read:** `docs/architecture/README.md` (Architecture Bootstrap, STEP 2), `ARCHITECTURE_PRINCIPLES.md`, `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (**Rule HT8**), `REPOSITORY_CONVENTIONS.md`.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| **Rollback ID** | `rollback/DOC3-dayofweek-comment-correction-20260716` → `7d1dd2ce` |
| Created | **Before any file was touched** (STEP 1) |
| **File snapshots** | `routes.ts`, `household-history.ts`, `world-fixtures.ts` copied to the session scratchpad **before each edit** |
| Working tree | Intentionally dirty — concurrent sessions (LIFE2, SEC4, TIME3, HOME3, NORTH1/2, EXPCOMP1/2, ORCH1, DOC2) hold uncommitted work. **No stash taken across the tree** |
| Files this workstream touched | **3 source files (comments only) + this report.** Nothing else |

> **Why snapshots as well as a tag.** The rollback tag points at committed `HEAD` (`7d1dd2ce`), but all three files carry **uncommitted** concurrent-session work (LIFE2's calorie-fabrication removal and SEC4's uplift provenance both sit in `routes.ts`). **The tag alone would not restore them** — a `git checkout <tag> -- server/routes.ts` would destroy another session's unmerged work. The per-file snapshots are the actual rollback path for this item, and they are also what proved the executable code unchanged (§ 4).

**To roll back:** restore the three comment lines listed in § 3 — or `cp` the `.DOC3-pre` snapshots back. **Do not `git checkout` the tag over these files.**

---

## 1. WHAT DOC-3 WAS

A **documentation convergence**: a comment asserting the **inverse of the platform's real key space**, sitting directly on the line that consumes it.

**Governing rule — `HT8`** (`THA_HOUSEHOLD_TIME_ARCHITECTURE.md:264`):

> *"`dayOfWeek` is `0 = Sunday`. The household week starts Monday. The stored numbering is **declared, never renumbered** — renumbering silently rotates every planner consumer by one day and no test would catch it."*

CONV1 rates it *"🟢 Low in itself; **it is the seed of two live defects**"* (`BEH-4`, `BEH-5`) and directs: *"Correct the comment. Out of band — do not sequence it behind Household Time."*

---

## 2. THE CITED LINE NUMBERS HAD DRIFTED — THE COMMENT WAS FOUND BY CONTENT

CONV1 cites `routes.ts:11371`, contradicted by `routes.ts:7431`. **Neither resolves today**: `:11371` is now a WS2 Pantry header and `:7431` is a `404` guard. `routes.ts` has been edited by concurrent sessions (LIFE2, SEC4) since CONV1 was written.

| CONV1 citation | Actual location today | Drift |
|---|---|---|
| `routes.ts:11371` — the false comment | **`routes.ts:11390`** | +19 |
| `routes.ts:7431` — the contradiction | **`routes.ts:7439-7440`** | +8 |

**Located by content, not by line number**, and every claim re-verified from the live tree. **This is the second consecutive CONV1 item whose citations had rotted** (`DOC-2` found `NK1:418`'s `§6.3` mis-cited, and `opportunity-engine.ts:82` cites two line numbers that no longer resolve — § 5.2). It is direct evidence for CONV1 § 8's proposed detection check, *"Every `file:line` citation in governing architecture resolves"* — and suggests its scope should include **source comments**, not only governing documents.

---

## 3. THE CORRECTION MADE

**One named site. Three corrected. One deliberately left.** Each correction is the same: the false convention clause replaced with the true one, anchored to its declaring rule. **Every other word of every comment is preserved verbatim.**

| # | File | Was | Now |
|---|---|---|---|
| 1 ★ | `server/routes.ts:11390` *(DOC-3's named site)* | `// dayOfWeek: 0 = Monday in plannerDays convention; shift so recent days are closer to now` | `// dayOfWeek: 0 = Sunday in plannerDays convention (Rule HT8); shift so recent days are closer to now` |
| 2 | `server/lib/household-history.ts:43` | **Byte-identical to site 1** | Same correction |
| 3 | `server/benchmark/world-fixtures.ts:83` | `/** 0 = Monday … 6 = Sunday (planner convention). */` | `/** 0 = Sunday … 6 = Saturday (planner convention, Rule HT8). */` |
| — | `server/intelligence/food-intelligence/opportunity-engine.ts:82` | `/** dayOfWeek: 0 = Monday — the existing planner convention … */` | **UNCHANGED — see § 5.1** |

**`Rule HT8` is cited, not restated.** The comment states the convention because that is the comment's job; it names the rule so the next reader can find the owner, and so nobody "resolves" the contradiction by renumbering — which `HT8` forbids precisely because *no test would catch it*.

### 3.1 Why sites 2 and 3 were corrected rather than reported

**`DOC-1` § 3.1 set the precedent — *"four sites were named, eight were corrected — reported, not hidden."*** Both are **the same defect, in the same class**, fixable **comment-only**:

- **Site 2 is a verbatim duplicate** of the named comment, on byte-identical arithmetic — `buildHouseholdHistory` exists twice, in `routes.ts` and in `lib/household-history.ts`. It is **live**: `intelligence/conversation/notice-gateway.ts:66` imports it. Correcting one copy and leaving its twin would have left DOC-3's exact false sentence in the tree, on a live path.
- **Site 3** documents the same key space on a fixture interface. Verified comment-only: `world-seeder.ts:397` matches `d.dayOfWeek === entry.dayOfWeek` with **no translation**, so a fixture's `0` seeds planner day `0` — Sunday. The comment was simply false.

---

## 4. VERIFICATION COMPLETED

### 4.1 The convention was proven from live code before a word was changed

**The mission supplies `0 = Sunday`, but a comment must match the platform, not just the canon.** Five independent confirmations, none inherited:

| # | Evidence | Finding |
|---|---|---|
| V1 | **Rule HT8** (`THA_HOUSEHOLD_TIME_ARCHITECTURE.md:264`) | `0 = Sunday`, declared, never renumbered |
| V2 | `routes.ts:7439-7440` — *"Template dayOfWeek 1-7 (Mon=1, Sun=7) → Planner dayOfWeek 0-6 (**Sun=0**, Mon=1, Sat=6)"*, `plannerDay = templateDay % 7` | Sunday (7) % 7 = **0** ✅ |
| V3 | `storage.ts:1832`, `:1863` — `const templateDay = day.dayOfWeek === 0 ? 7 : day.dayOfWeek` | Planner `0` → template `7` = **Sunday** ✅ |
| V4 | **`client/src/pages/weekly-planner-page.tsx:102`** — `DAY_NAMES = ["Sunday", "Monday", …]` | Index `0` renders **"Sunday"** — **user-visible, and decisive** ✅ |
| V5 | `storage.ts:1230` — `for (let d = 0; d < 7; d++)` | Days seeded `0…6`; `plannerDays` has no other key ✅ |

**The comment was the sole outlier**, contradicted by the canon, by a comment 3,950 lines above it in its own file, by the storage converters, and by what the household actually sees on screen.

### 4.2 Zero executable change — proved, not asserted

Each file was snapshotted **before** its edit. Comments and blank lines were then stripped from both versions and hashed:

| File | Result |
|---|---|
| `server/routes.ts` | ✅ **PASS** — executable code byte-identical |
| `server/lib/household-history.ts` | ✅ **PASS** — executable code byte-identical |
| `server/benchmark/world-fixtures.ts` | ✅ **PASS** — executable code byte-identical |

> This test matters more than usual here: `routes.ts`'s working-tree diff is large, but **none of it is this item's** — it is LIFE2's and SEC4's uncommitted work. The hash comparison isolates DOC-3's contribution from the concurrent sessions sharing the file, and shows it is exactly three comment lines.

### 4.3 Gates

| Gate | Result |
|---|---|
| **Typecheck** (`tsc --noEmit`) | ✅ **304 errors with my changes; 304 without** — measured by stashing the three files and re-running. **Identical.** None of the 304 is in a file this item touched; all are pre-existing `downlevelIteration`/handler errors from concurrent sessions |
| **False-claim sweep** (`server/`, `client/src`, `shared/`) | ✅ One `0 = Monday` claim remains — `opportunity-engine.ts:82`, **deliberately** (§ 5.1) |
| **Behavioural tests** | **Not run, and not applicable.** The change is three comments with a proven-zero executable diff. There is no code path to exercise — a passing test would evidence nothing about a comment |
| `repo-structure-verify.sh` | ✅ All `docs/` rules pass (root `stray:` fails are the same two pre-existing untracked files `DOC-2` reported; not this item's) |

---

## 5. WHAT THIS ITEM DELIBERATELY DID NOT DO

### 5.1 The fourth site — a live defect found, reported, and **not** fixed

**`server/intelligence/food-intelligence/opportunity-engine.ts:82` still says `0 = Monday`. That is deliberate, and it is the most important finding of this item.**

```ts
/** `dayOfWeek: 0 = Monday` — the existing planner convention (server/storage.ts:3222, server/routes.ts:10842), reused for display only, not redefined. */
const PLANNER_DAY_NAMES: readonly string[] = ["Monday", "Tuesday", … "Sunday"];
function dayName(dayOfWeek: number): string { return PLANNER_DAY_NAMES[((dayOfWeek % 7) + 7) % 7]; }
```

**This is not a documentation defect. The code implements the false belief.** The array is Monday-first, so `dayName(0)` returns **"Monday"** for a planner day that is **Sunday** — every day name this engine emits is shifted by one. It is **live and user-visible**, feeding household-facing text at `:226`, `:233`, `:235`:

> *"**Monday** in "Week 1" has no meals planned yet."* — said about a **Sunday**.

**Why it was left, on three independent grounds:**

1. **Correcting the comment alone would replace one false statement with another.** The comment would then claim `0 = Sunday` directly above an array where `0` is Monday — a *new* falsehood about the code it sits on, and a worse one, because it reads as verified.
2. **Correcting the array would change runtime behaviour** — the mission forbids it explicitly, and it would alter user-visible day names.
3. **It belongs to `BEH-4`.** It is not `BEH-4`'s cited site (`storage.ts:3345`) nor `BEH-5`'s (`stories/engine.ts:441`), but it is exactly what `BEH-4` calls a **backwards reader**, and `BEH-4`'s convergence strategy is *"Fix the four backwards readers now."* Fixing it here would be implementing `BEH-4` under a mandate that says **do not fix BEH-4**.

> **Recommendation for `BEH-4` (P3):** treat `opportunity-engine.ts:82-95` as a candidate backwards reader and **confirm whether it is among the four already counted, or a fifth**. CONV1's count of four is cited to `storage.ts`; this site is in a different module and its comment cites **two line numbers that no longer resolve** (`storage.ts:3222` is now a destructuring statement; `routes.ts:10842` is blank), so it may have been counted from stale evidence. **`BEH-4` must fix the array and its comment in the same change** — they are one defect, and `HT8` warns that renumbering instead of correcting the readers is the silent failure no test catches.

### 5.2 Other refusals

| Not done | Why |
|---|---|
| **Renumber the planner key space** | `HT8` — *"declared, never renumbered"*. Renumbering silently rotates every consumer by one day |
| **Fix `BEH-4` / `BEH-5`** | Explicitly out of scope. `BEH-5` is additionally gated on `SCH-2` — CONV1: *"fixing its timezone before the anchor would make a fabricated date precisely wrong"* |
| **Touch the `approxDate` fabricator** | It is the line the comment sits on, and it is `BEH-5`'s target — **not DOC-3's**. Corrected the description; left the fabrication |
| **De-duplicate `buildHouseholdHistory`** | It exists twice (`routes.ts` + `lib/household-history.ts`). A real finding, but **unrelated refactoring** — reported below, not done |
| **Re-author the benchmark fixtures** | § 5.3 |
| **Fix the 304 pre-existing typecheck errors** | Not this item's, and not this session's |

### 5.3 One consequence of site 3, stated plainly

The benchmark fixtures were **authored against the false comment**: `{ week: 1, dayOfWeek: 0, … "Spaghetti Bolognese" }` was written intending **Monday**, and seeds on **Sunday**. Correcting the comment does not move the data — it stops the file lying about where the data lands.

**The fixture values were deliberately not changed:** that would alter every benchmark world and its baselines, which is a behaviour change and squarely outside `DOC-3`. **Flagged for whoever owns the benchmark corpus** — the question *"were these meant to be Monday-first?"* is now visible instead of concealed, which is what correcting a seed comment is for.

### 5.4 Two structural findings, reported not acted on

1. **`buildHouseholdHistory` is duplicated byte-for-byte** across `routes.ts:11375+` and `lib/household-history.ts:30+`, including the false comment and the `approxDate` fabricator. Both are live. **This is a Principle 2 shape (one owner per fact) and a second copy of `BEH-5`'s fabricator** — `BEH-5` should be scoped to **both** copies, or it will fix one and leave the other.
2. **Comment citations rot silently.** `opportunity-engine.ts:82` cites two dead line numbers as its authority for a convention it then gets backwards. CONV1 § 8's proposed *"every `file:line` citation resolves"* check would have caught it — **if its scope included source comments.**

---

## 6. NEXT CONV1 ITEM

> ### **`DOC-4` — The Product Knowledge architecture says `docs/product/` does not exist; it holds 151 files**

**Why it is next.** CONV1 § 7 P1 (*"Correct the canon"* — docs only, *"free, and it unblocks Tier 2"*) sequences `DOC-1` · `DOC-2` · `DOC-3` · `DOC-4` · `OWN-5`. **`DOC-1`, `DOC-2` and `DOC-3` are now closed; `DOC-4` is next, then `OWN-5` closes P1.**

**What it is.** `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md:896-942` states *"`docs/product/` does not exist"*, *"no capability registered"*, and *"Current Convergence 0%"*. **All three are false** — 151 files, 154 entries, capability live. It is a **currency correction**: a domain's own architecture stale about the domain while the Register is right — *"a clean inversion of the document's own Rule PKR15"*, and exactly the `KC14` failure mode that document itself named. No dependencies; 🟢 low risk; docs-only.

> **Carry forward into `DOC-4`:** its line citations (`:896-942`) should be **verified by content before use** — CONV1's citations have now drifted on two consecutive items (§ 2).

**Then:** `OWN-5` completes P1. **`OWN-1` (P4) must not start until P1 lands** — CONV1: *"No implementer should start `OWN-1` against a canon holding four positions."*

**Separately, for P3:** `BEH-4` should absorb the `opportunity-engine.ts` finding in § 5.1 before it counts its backwards readers.

---

## 7. COMPLIANCE

- **Architecture Bootstrap (STEP 2):** `docs/architecture/README.md` read before any change.
- **STEP 1 — Rollback:** tag + per-file snapshots created **before any file was touched**; concurrent sessions' uncommitted work in all three files preserved intact.
- **Rule `HT8`:** obeyed exactly — the key space is **declared and cited, never renumbered**. No consumer was rotated.
- **Core Principle 6 (honest gaps over invented facts):** three comments that asserted the inverse of reality now state it; the one that could not be made true without changing behaviour is **reported, not quietly half-corrected**.
- **`REPOSITORY_CONVENTIONS.md`:** report filed under `docs/implementation/governance/` by workstream.
- **Experience & UI / Product Registry Compliance:** **not applicable** — no user-facing surface, client building block, or product-knowledge entry is created, changed, or retired by a comment correction with a zero executable diff.
- **Deviations:** two — the scope expansion (§ 3.1) and the refusal at site 4 (§ 5.1). **Both reported, neither silently applied.**

---

*Implementation completed: 2026-07-16*
*Rollback: `rollback/DOC3-dayofweek-comment-correction-20260716` → `7d1dd2ce`*
*Next CONV1 item: `DOC-4` — the Product Knowledge status block (P1)*
