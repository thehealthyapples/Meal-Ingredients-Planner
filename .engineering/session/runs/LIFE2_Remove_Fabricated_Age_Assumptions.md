# LIFE2 — Remove Fabricated Age Assumptions — Session Record

**Session ID:** `LIFE2_Remove_Fabricated_Age_Assumptions`
**Started:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Objective:** Implement **LIFE1 Step 0 only** — remove the fabricated age assumptions and
restore honest behaviour. No Life Stage, no birth date, no schema change, no new
calculation, no inference.

---

## ROLLBACK

| Item | Value |
|---|---|
| **Rollback ID** | `rollback/LIFE2-remove-fabricated-age-assumptions-20260716` → `7d1dd2ce` |
| Created | **Before any file was touched** (STEP 1) |
| Working tree | Intentionally dirty — concurrent sessions hold uncommitted work. **No stash taken** |
| Files touched | **2 application files + 1 report.** Nothing else |
| Revert | `git checkout 7d1dd2ce -- server/routes.ts client/src/pages/profile-page.tsx` |

---

## STAGE

**Implementation Complete** → Waiting for User

---

## CHECKPOINTS

- [x] `docs/architecture/README.md` read (bootstrap, STEP 2)
- [x] LIFE1 read (`docs/investigations/platform/LIFE1_LIFE_STAGE_INTELLIGENCE.md`)
- [x] Git status confirmed (HEAD `7d1dd2ce`, branch `int1-intelligence-platform`, tree dirty with concurrent work)
- [x] Rollback protection created + reported
- [x] **Every consumer audited (8)** before any edit
- [x] Server producer fixed (`server/routes.ts`)
- [x] Client consumers fixed (`client/src/pages/profile-page.tsx`)
- [x] Typecheck: **304 before → 304 after**, measured by stashing only these 2 files. **Zero errors in either**
- [x] Tests: **843 passed, 0 failed** across 8 affected suites
- [x] **Driven end-to-end against a live server** (port 5099; the concurrent session's 5000 left untouched) — 4 cases
- [x] Companion verified truthful — **3 independent proofs**
- [x] Implementation report written
- [x] Structure gate: `docs/implementation/` **PASS**
- [ ] Committed — *not committed; tree shared with concurrent sessions*

---

## DEVIATIONS FROM MISSION (reported, not silently applied)

1. **Specified doc path violates governing architecture.** The mission specifies
   `docs/implementation/LIFE2_REMOVE_FABRICATED_AGE_ASSUMPTIONS.md` — a loose root file.
   `ENGINEERING_WORKFLOW.md` STEP 5 is explicit: *"**Never** write a report to a folder root."*
   `REPOSITORY_CONVENTIONS.md` §4 fixes the rule that decides the folder: *"a subject occupies
   the same-named folder whether it is an investigation or an implementation report."*
   **LIFE1 is `investigations/platform/` → LIFE2 is `implementation/platform/`.**
   Gate re-run after filing: **PASS**. Same deviation LIFE1 and TIME2 hit; resolved identically.
2. **Two extra edits beyond the two named constants — reported, and I judged them in scope.**
   The mission required THA to "respond truthfully". After the server fix, the radio labelled
   **"Auto calculate (recommended)"** would have calculated *nothing* — the fabrication surviving
   in the UI, and marked *recommended*. Relabelled **"No daily target"** / **"Set my own target"**.
   **No schema change**: `calorieMode` keeps its `auto`/`manual` values; only the labels changed,
   because only the labels were lying.
3. **`calculatedCalories` removed from the API rather than left permanently null.** Principle 8
   (*retire on introduction*): a field named `calculatedCalories` that can only ever be null is a
   claim about a calculation that no longer exists. All 4 consumers audited; `buildProfileResponse`
   is a non-exported closure, so no external consumer exists.

---

## WHAT CHANGED

**`server/routes.ts`** — the BMR block deleted:
`const bmr = 10 * weightKg + 6.25 * heightCm - 5 * 30 - 78;`
→ `calorieEstimate: { available: false, reason: "age-and-sex-unknown" }`, and
`dailyCalories` = **only** a target the household declared themselves (`manual` mode), else `null`.

**`client/src/pages/profile-page.tsx`** — the type, the false *"Calculated: N kcal based on your
weight, height, activity level and goal"* claim, and both radio labels.

---

## HEADLINE

> **`- 5 * 30 - 78` — an age hardcoded to 30, and the arithmetic midpoint of the male (+5) and
> female (−161) constants, a sex nobody is. A 180 cm / 80 kg household was shown 2,630 kcal and
> told it was "based on your weight, height, activity level and goal". It is gone, and THA says why.**

**Not a degradation — a removal.** Mifflin–St Jeor needs weight, height, **age**, **sex**. THA holds
the first two and LIFE1 § 12.4 defers both of the last two. The estimate is **impossible, for every
household, always** — so `calorieEstimate` states that rather than leaving a bare `null`, which reads
as *"not computed yet"*.

**The leak that had to be stopped:** `storage.ts:3405` seeds `calorieTarget: 2000` **alongside
`calorieMode: "auto"`**. Reporting the stored target regardless of mode would have shown every seeded
household **2,000 kcal they never chose** — one fabrication swapped for another. Verification Case C
exists solely to prove it does not leak. **It does not.**

**The Companion was never affected — by design, not luck.** `profile-read-handler.ts:15-20` refuses to
recompute *"the derived fields the route layer computes inline (BMI, calculated calories…)"*. Three
proofs: **structural** (`buildProfileResponse` is a non-exported closure; its only call sites are two
`res.json`), **by projection** (the Companion's view reads `calorieTarget`/`calorieMode` straight from
the owner's stored prefs), **by test** (INT12: 50/50 before and after). *The Intelligence Platform's
delegation-only boundary quarantined this defect from the one surface that speaks.*

---

## VERIFICATION (driven, not assumed)

Live server on **5099** with this code (5000 runs stale code — `tsx` does not hot-reload; the
concurrent session's server was left untouched).

| Case | State | Observed |
|---|---|---|
| **A** | height 180, weight 80, `auto` — **the exact state that fabricated** | `dailyCalories: null` · `calorieEstimate {available:false, reason:"age-and-sex-unknown"}` · `calculatedCalories` **absent** · `bmi: 24.7` intact ✅ |
| **B** | `manual`, target 2200 | `dailyCalories: 2200` — their own number ✅ |
| **C** | back to `auto`, stored 2200 remains | `dailyCalories: null` — **no leak** ✅ |
| **D** | no height/weight | `HTTP 200`, all-null, no throw ✅ |

**Tests: 843 passed, 0 failed** — INT12 profile 50 · dietary-title-safety 39 · context composition 166 ·
platform foundation 33 · INT13 household 51 · companion actions 62 · personality 323 · behaviour 119.
**Typecheck: 304 → 304** (identical baseline), **0 in the touched files**.

---

## GAPS AND FINDINGS — reported, not fixed

1. **⚠️ The rendered page was NOT observed.** Playwright is installed but Chromium cannot launch:
   `libglib-2.0.so.0` missing. (The root `.glibcheck.txt` / `.libdirs_uxhome.txt` strays are a
   **concurrent session diagnosing this same library**.) API behaviour is **observed fact**; the UI
   table is **read from the diff and type-checked**, not seen. Stated as `EXPCOMP2`'s precedent
   requires. A `data-testid="text-calorie-estimate-unavailable"` was added to close it later.
2. **BMI's category thresholds are adult-only** (`routes.ts:560-563`) — child/adolescent BMI uses
   age-and-sex percentile charts, never fixed bands. **The same class of defect as `- 5 * 30`, one
   order quieter**: it fabricates no number, it fabricates a **category boundary**. LIFE1 did not
   identify it. Belongs to LIFE1 Step 2.
3. **The manual input pre-fills `2000`** (`profile-page.tsx:1258`) — a UI default in an editable box,
   not a claim, only persisted on an explicit save. But a household that saves without editing gets a
   target **THA suggested**. Pre-existing.
4. **The Product Registry never describes the calorie settings** — `page-profile.md` omits them.
   A pre-existing completeness gap; recording it is the KC12 discipline.
5. **2 pre-existing `adoption:check` failures** (button ceiling 539>538; `HouseholdNutritionPanel`
   orphan) — the exact pair HOME3 recorded. **This change adds no button.** Not absorbed: raising a
   ceiling to make a gate pass is the dishonesty this workstream exists to remove.

---

## SCOPE LOCK — held

No Life Stage · no birth date · **no schema change, no migration, no column** · no new calculation ·
no inference · NK1's false claims **not** amended (LIFE1 Step 0a — an implementation must not amend
architecture as a side effect) · `*Count` retirement (Step 3) and the `kind` rename (Step 5) untouched.

---

## RECOMMENDED NEXT WORKSTREAM

> **`LIFE3` — LIFE1 Step 0a: correct `NK1`'s false inventory. Documentation only, no code.**

`NK1:73`, `:139`, `:535` state eater **age** is stored and **"Authoritative"**; the column does not
exist (`schema.ts:1158-1168`). `NK1:418`'s *"no per-child signals"* prohibition cites a **§6.3 that
does not exist** — NK1 has no numbered sections at all. It is the cheapest item in LIFE1's roadmap,
blocked by nothing, and it is a **governing document currently wrong about a safety-relevant field** —
which fails open, because the honest failure mode of a missing column is `undefined`.

**Do not proceed to Step 2 (the birth-date column).** LIFE1 § 12.1: children's personal data has no
governing owner anywhere in the canon. That question is a lawyer's, and unlike every other item it is
**not reversible by dropping a column.**

---

## NEXT ACTION

None — implementation complete and verified. Awaiting review.
