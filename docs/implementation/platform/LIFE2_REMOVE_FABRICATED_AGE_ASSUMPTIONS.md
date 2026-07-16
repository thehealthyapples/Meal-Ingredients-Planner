# LIFE2 — Remove Fabricated Age Assumptions — Implementation

**Status:** IMPLEMENTED — application code. LIFE1 Step 0 only.
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Workstream:** `LIFE2_Remove_Fabricated_Age_Assumptions`
**Authority:** [`LIFE1 — Life Stage Intelligence`](../../investigations/platform/LIFE1_LIFE_STAGE_INTELLIGENCE.md) § 1, § 13 (Step 0), § 14 (retirement target #1).
**Governing architecture read:** `docs/architecture/README.md` (bootstrap), `ARCHITECTURE_PRINCIPLES.md`, `ENGINEERING_WORKFLOW.md`, `REPOSITORY_CONVENTIONS.md`, `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (D16/D27), `THA_EXPERIENCE_ARCHITECTURE.md` (§ 12–§ 14), `NK1`, `NK2`.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| **Rollback ID** | `rollback/LIFE2-remove-fabricated-age-assumptions-20260716` → `7d1dd2ce` |
| Created | **Before any file was touched** (STEP 1) |
| Working tree | Intentionally dirty — concurrent sessions (TIME3, HOME3, NORTH1/2, EXPCOMP1/2, ORCH1, LIFE1) hold uncommitted work. **No stash taken**: a stash would destroy their trees |
| Files this workstream touched | **2 application files + this report.** Nothing else |

---

## 1. WHAT WAS WRONG

`server/routes.ts:568`, inside `buildProfileResponse`:

```js
const bmr = 10 * weightKg + 6.25 * heightCm - 5 * 30 - 78;
```

Mifflin–St Jeor is `BMR = 10·weight + 6.25·height − 5·age + s`, where `s` is `+5` (male) or `−161` (female).

| Term | What it is | What it should have been |
|---|---|---|
| `- 5 * 30` | **Age hardcoded to 30** | The person's age — **THA holds none** |
| `- 78` | **The midpoint of `+5` and `−161`** — a sex nobody is | The person's sex — **THA holds none** |

The result became `calculatedCalories` → `dailyCalories` → the profile's `health` block, and was rendered to the household as *"Calculated: 2,630 kcal **based on your weight, height, activity level and goal**"* — a sentence that is **false by omission**: it was also based on an assumed age and an assumed sex, and it named neither.

**This is a Core Principle 6 violation** (*honest gaps over invented facts*), and it was the only live fabrication LIFE1's audit found.

---

## 2. WHAT CHANGED

### 2.1 `server/routes.ts` — the producer

The BMR block is **deleted**. It is replaced by an explicit honest gap:

```js
const calorieEstimate = {
  available: false as const,
  reason: "age-and-sex-unknown" as const,
};

const dailyCalories = prefs?.calorieMode === "manual"
  ? (prefs?.calorieTarget || null)
  : null;
```

`calculatedCalories` is **removed from the response**, not left permanently null (Principle 8 — *retire on introduction*; a field named `calculatedCalories` that can only ever be null is a claim about a calculation that no longer exists).

**Why this is a removal and not a degradation.** Mifflin–St Jeor needs **weight, height, age, sex**. THA stores the first two and holds neither of the last two — and LIFE1 § 12.4 defers **both** as facts deliberately not created. So the estimate is not *sometimes* unavailable; it is **impossible, for every household, always**. `calorieEstimate` states that explicitly rather than leaving a bare `null`, which is indistinguishable from *"not computed yet"*.

**The reason code is machine-readable, not prose.** The server emits `reason: "age-and-sex-unknown"` and **no user-facing sentence**. Every user-facing word stays in the client, because the words are INT21's and the Behaviour Engine's, never an API's — emitting prose here would be a second mouth.

### 2.2 `client/src/pages/profile-page.tsx` — the consumers

| Before | After | Why |
|---|---|---|
| `calculatedCalories: number \| null` | `calorieEstimate: { available: false; reason: "age-and-sex-unknown" }` | Type follows the contract |
| *"**Calculated:** 2,630 kcal based on your weight, height, activity level and goal."* | *"THA won't work a target out for you. Doing that honestly needs your age and sex, and THA doesn't hold either. Choose **Set my own target** if you'd like one."* | The claim was false. The replacement states the gap and offers the one honest way forward |
| Radio: **"Auto calculate (recommended)"** | Radio: **"No daily target"** | **A radio promising a calculation that no longer happens is the fabrication surviving in the UI** — and it was marked *recommended* |
| Radio: "Set manually" | Radio: **"Set my own target"** | Names what it does, in the household's terms (EXP ARCH § 13 — *honest verbs*) |

**The `auto` / `manual` stored values are unchanged.** `user_preferences.calorieMode` keeps its enum and its data — **no schema change**. Only the labels change, because only the labels were lying.

---

## 3. THE CONSUMER AUDIT

**Every consumer of the fabricated calculation, enumerated and confirmed.** *(The mission requires this; it is the whole safety argument for removing a field.)*

| # | Consumer | `file:line` | Before | After | Verdict |
|---|---|---|---|---|---|
| 1 | `dailyCalories` derivation | `routes.ts:579-581` | fell back to the fabrication | `null` unless the household declared a target | ✅ |
| 2 | `health` block emitter | `routes.ts:604` | emitted `calculatedCalories` | emits `calorieEstimate` | ✅ |
| 3 | `GET /api/profile` | `routes.ts:635` | returned the number | returns the honest gap | ✅ |
| 4 | `PUT /api/profile` (response) | `routes.ts:781` | returned the number | returns the honest gap | ✅ |
| 5 | `ProfileData` type | `profile-page.tsx:73` | `calculatedCalories` | `calorieEstimate` | ✅ |
| 6 | *"Calculated: N kcal"* | `profile-page.tsx:1371-1373` | rendered the number | renders the honest gap | ✅ |
| 7 | `HealthSnapshot` kcal tile | `profile-page.tsx:594,598` | rendered fabricated `dailyCalories` | `null` → `"-"` / `"Not set"` — **already null-safe, unchanged** | ✅ |
| 8 | **The Companion** | `profile-read-handler.ts` | **never received it** | unchanged | ✅ **§ 5** |

**Confirmed complete by grep after the change:**

```
grep -rn "calculatedCalories" --include=*.ts --include=*.tsx .   → NONE
grep -rn "6.25|- 5 \* 30|activityMultipliers|\bbmr\b" ...        → 1 hit, inside this change's own explanatory comment
```

**There was never a second implementation.** `6.25` and `bmr` occurred **once** in the entire codebase. This is the rare case where retiring a duplicate was unnecessary — there was one liar, not six.

---

## 4. DATA IMPACT

```
GOVERNANCE GATE
===============
Domain affected:         27 (User Preferences) — READ ONLY. Nothing written.
                         16 (Household Profiles) — untouched.
Declared SoT:            user_preferences (Domain 27) — unchanged, still authoritative.
New store created?       NO.
Existing store extended? NO.
Schema modified?         NO. No column added, altered, or dropped. No migration.
Data written?            NONE. This change writes nothing, ever.
Data deleted?            NONE.
Consumer created?        NO. Four existing consumers corrected.
New knowledge store?     NO (Register Rule 8 does not fire).
```

**The fabricated value was never persisted.** It existed only inside `buildProfileResponse` — a closure inside `registerRoutes`, **not exported** — and only ever in an HTTP response body. Verified:

```
grep -rn "calculatedCalories" server/storage.ts shared/schema.ts → NONE
```

**So there is no bad data to clean up.** Every household's stored `calorieTarget` is their own declared number and is untouched. **Nothing was corrupted by the fabrication, because the fabrication was computed fresh on every request and never written down.** That is the single luckiest fact in this workstream.

### 4.1 The leak that had to be prevented

`storage.ts:3405-3406` seeds **`calorieTarget: 2000` alongside `calorieMode: "auto"`**. A naive fix — reporting `calorieTarget` regardless of mode — would have shown every seeded household **2,000 kcal they never chose**, replacing one fabrication with another. The mode check is therefore load-bearing, and **Case C of the verification exists specifically to prove the 2,000 does not leak**.

---

## 5. TRUST CHECK

| Question | Answer |
|---|---|
| Does THA still state anything it cannot support? | **No** — for calories. The one remaining number, `dailyCalories`, is only ever the household's **own declared target** |
| Is any gap papered over? | **No.** The gap is stated in the API (`calorieEstimate.reason`) and in words on the page |
| Does the Companion receive fabricated values? | **No — and it never did.** § 5.1 |
| Is a claim made about age anywhere? | **No.** THA now holds no age and asserts none |
| Does the household lose anything real? | **They lose a number that was never theirs.** They keep every stored value and can set a real target in one click |
| Dark patterns? | **None.** The honest-gap copy names the alternative rather than hiding it |

### 5.1 The Companion — verified, not assumed

**The mission requires confirming the Companion receives truthful data. It does, and it always did — by design, not by luck.**

`server/intelligence/handlers/profile-read-handler.ts:15-20`:

> *"**DELEGATION ONLY.** All data comes from the owning service via the port. This file contains NO profile business rule and, **critically, NO recomputation of the derived fields the route layer computes inline (BMI, calculated calories, `hasPremiumAccess`)** — those are route-layer composition, not owner reads, so they are out of scope for a delegation-only binding."*

**Three independent proofs the Companion never touched the fabrication:**

1. **Structural** — `buildProfileResponse` is a closure inside `registerRoutes`, **never exported**. Its only two call sites are `res.json(...)` at `:635` and `:781`. The value could not physically reach the handler.
2. **By projection** — the Companion's profile view exposes `calorieTarget` (`:181`) and `calorieMode` (`:182`) — **read straight from the owner's stored prefs**, which are the household's own declared facts. No derived calorie field exists in the view.
3. **By test** — INT12's binding suite: **50 passed, 0 failed**, before and after.

> **The Intelligence Platform's delegation-only boundary quarantined this defect from the Companion for its entire life.** INT12 refused to recompute route-layer derivations, and in doing so accidentally refused to repeat a lie. **The architecture protected the Companion from the platform.**

---

## 6. ARCHITECTURE COMPLIANCE

| Check | Result |
|---|---|
| **Architecture Bootstrap read (STEP 2)** | ✅ Bootstrap + Household Time + SoT Register + Experience Architecture + NK1/NK2 |
| **Principle 1 — one canonical identity** | ✅ Untouched |
| **Principle 2 — one owner per fact** | ✅ `calorieTarget` stays Domain 27's. **No new owner. No fact moved** |
| **Principle 5 — vocabularies beside the spine** | n/a — no module added |
| **Principle 6 — honest gaps over invented facts** | ✅ **The whole content of this change.** An invented age and an invented sex are deleted; the gap is declared |
| **Principle 7 — no permanent sync bridge** | ✅ Nothing stored, nothing cached, nothing derived and persisted |
| **Principle 8 — retire on introduction** | ✅ `calculatedCalories` is **removed**, not deprecated. LIFE1 § 14 target #1: **1 → 0** |
| **Household Time — HT3/HT5/HT16** | ✅ **Not engaged.** This change reads no clock, derives no date, stores no derivation, infers nothing |
| **Register Rule 8** | ✅ **Not triggered** — no knowledge store |
| **Observation Engine § 7** | ✅ Nothing recorded, nothing read |
| **EXP ARCH § 12 — never fabricate** | ✅ The rule this change exists to satisfy |
| **EXP ARCH § 14 — degrade honestly** | ✅ *"the unavailable part says so plainly — it does not pretend emptiness"* — the honest-gap copy is exactly this |
| **EXP ARCH § 13 — honest verbs / one name per concept** | ✅ *"Auto calculate"* named a capability that does not exist; *"Set my own target"* says what it does |
| **NK2 — household-level unit** | ✅ Untouched. **No target invented** |
| **AI ARCHITECTURE COMPLIANCE** | ✅ **Not engaged** — no capability, prompt, Context View, or intent touched (§ 5.1) |
| **STEP 7 — Trust hard stops** | ✅ None triggered. No knowledge claim, no health claim, no bridge, no new client knowledge file |

### 6.1 Experience & UI Governance Compliance

**Engaged — this change alters user-facing copy.**

- **UX Governance Checklist** — the page's information architecture, primary action and progressive disclosure are unchanged; only two labels and one sentence changed. **No new surface, no new control, no new state.**
- **UI Governance Checklist** — **no visual law touched**: no colour, token, spacing, type scale, motion, or component. The honest-gap sentence reuses the existing `text-xs text-muted-foreground` treatment the block already used.
- **Experience Test** (Blueprint § 15.3) — *Which room?* Profile. *How should someone feel?* Told the truth, not managed. *What is the one thing it helps them do?* Set a target that is actually theirs.
- **Conflict resolution** — none arose; Experience and UI agree.

### 6.2 Architecture Convergence Status

**Not a 🔴 RED implementation.** No architectural domain is created, moved, or converged. This is a **🟢 defect fix within one existing owner's read path** — the removal of a fabrication from a route-layer composition. STEP 8 does not apply.

---

## 7. PRODUCT REGISTRY IMPACT

**Assessed against the live registry (`docs/product/` exists and is populated). Verdict: no entry is affected; none updated.**

| Entry | Bears on this change? | Action |
|---|---|---|
| `docs/product/structure/pages/page-profile.md` | **Describes the page in prose and never mentions calories, the auto-calculate mode, or the Health Snapshot.** Its three-group summary (Personal · Household · Settings & Support) remains true | **None — nothing in it became false** |
| `docs/product/intelligence/intelligence-capabilities/cap-profile.md` | Describes the Companion's profile read as *"a plain-language mirror of what the household told THA about itself"* — **which is exactly what it still is**, and is now more true than before | **None** |
| `docs/product/inventory/product.yaml` | One `calorie` hit: `adv-upf-lens` — *"Processing, not calories"*, a competitive-advantage message about UPF. **Unrelated** | **None** |

**Rule KC15 is satisfied by inspection, not by omission:** every registry entry that could have been made stale was read, and none makes a claim this change falsifies.

**Gap recorded, not filled:** the Profile page's **calorie settings are absent from the registry entirely** — `page-profile.md` does not enumerate them. This is a **registry completeness gap that pre-dates this change** and is not Step 0's to close; recording it is the KC12 discipline (*a declined discovery is recorded, or every future audit rediscovers it*). **`last_verified` was deliberately NOT bumped** — the entry names a human owner (Colin Clapson) and currency is that owner's attestation (Rule KC14), not a passing implementer's.

---

## 8. ADOPTION REGISTER IMPACT

**Not engaged. No client-side building block was created, adopted, or retired** — no component, hook, token, utility class, or shared pattern. Two `<span>` labels and one `<p>` changed inside an existing page component.

**`npm run adoption:check` → 64 passed · 0 notices · 2 failed.** Both failures are **pre-existing on this branch and untouched by LIFE2**, and are the exact pair `HOME3` recorded on 2026-07-16:

1. `[button-primitive]` raw `<button>` count **539 vs ceiling 538** — **this change adds no button**.
2. `[orphans]` `client/src/components/HouseholdNutritionPanel.tsx` — 0 importers. **Not this workstream's file.**

**Reported, not fixed, and not silently absorbed** — raising the ceiling to make a gate pass is the exact dishonesty this workstream exists to remove.

---

## 9. DOMAIN IMPACT

```
Domain affected:         27 (User Preferences) — read path only.
Ownership changed?       NO.
Facts created?           NO.
Facts removed?           NO — one FABRICATED DERIVATION removed. It was never a fact.
API contract changed?    YES — `health.calculatedCalories` (number|null) is replaced by
                         `health.calorieEstimate` ({available:false, reason}).
                         All four consumers audited and updated (§3). No external consumer
                         exists: `buildProfileResponse` is a non-exported closure.
```

---

## 10. DEFINITION OF DONE

| Requirement | Met |
|---|---|
| **The hardcoded age (30) is removed** | ✅ The whole BMR block is deleted. `grep` for `- 5 * 30` returns **only this change's own comment** |
| **The fabricated sex constant is removed** | ✅ `- 78` deleted with it |
| **No personalised calorie calculation without sufficient data** | ✅ **No personalised calorie calculation exists at all.** The data is insufficient for every household, always |
| **An explicit honest-gap response is returned** | ✅ `calorieEstimate: { available: false, reason: "age-and-sex-unknown" }`, plus honest words on the page |
| **All affected API responses remain valid and fail gracefully** | ✅ `GET`/`PUT /api/profile` → **HTTP 200** in all four observed states, including with no height/weight at all (§ 11 Case D) |
| **The Companion receives truthful data** | ✅ **Verified three ways** (§ 5.1). It never received the fabrication |
| **Every consumer audited and confirmed** | ✅ **8 consumers** enumerated, each checked (§ 3) |
| **Nothing else changed** | ✅ 2 application files. No schema, no migration, no Life Stage, no birth date, no new calculation, no inference |

**What must not break — and did not:**

| Suite | Result |
|---|---|
| INT12 Profile read-only binding | **50 passed, 0 failed** |
| Profile dietary title safety | **39 passed, 0 failed** |
| INT17/NCV1 context composition | **166 passed, 0 failed** |
| Intelligence Platform foundation | **33 passed, 0 failed** |
| INT13 Household read-only binding | **51 passed, 0 failed** |
| Companion actions | **62 passed, 0 failed** |
| Personality platform | **323 passed, 0 failed** |
| Behaviour decision | **119 passed, 0 failed** |
| **Total** | **843 passed, 0 failed** |

**Typecheck:** `npx tsc --noEmit` → **304 errors before this change, 304 after — identical**, and **zero** in either file this workstream touched. Measured by stashing *only these two files*, re-running, and restoring. The 304 are pre-existing branch debt (concurrent sessions' in-flight work); **this change contributes none of them.**

---

## 11. MANUAL VERIFICATION STEPS

**Performed against a live server running this code**, on port **5099** (the concurrent session's server on 5000 was left untouched — `tsx` does not hot-reload, so verifying against 5000 would have tested stale code).

```bash
PORT=5099 npm run dev
curl -c c.txt -X POST localhost:5099/api/demo/start -H 'Content-Type: application/json' -d '{}'
```

| Case | Setup | Expected | **Observed** |
|---|---|---|---|
| **A** | `PUT /api/profile` → `{preferences:{heightCm:180, weightKg:80, activityLevel:"moderate", goalType:"maintain", calorieMode:"auto"}}` — **the exact state that used to fabricate** | No number; an honest gap | `dailyCalories: null`, `calorieEstimate: {available:false, reason:"age-and-sex-unknown"}`, **`calculatedCalories` absent**. `bmi: 24.7` still present ✅ |
| **B** | `calorieMode:"manual"`, `calorieTarget:2200` | The household's own number | `dailyCalories: 2200` ✅ |
| **C** | Switch back to `calorieMode:"auto"` (stored 2200 remains) | **The stored target must NOT leak** | `dailyCalories: null` ✅ **no leak** |
| **D** | `heightCm:null, weightKg:null` | Graceful, valid | `HTTP 200`, all-null health block, no throw ✅ |

**The decisive comparison (Case A).** With height 180 cm and weight 80 kg:

```
OLD:  bmr = 10*80 + 6.25*180 - 5*30 - 78 = 1697  →  ×1.55  =  2630 kcal
      ...presented to the household as "based on your weight, height, activity level and goal"
NEW:  dailyCalories = null
      calorieEstimate = { available: false, reason: "age-and-sex-unknown" }
```

> **A number appeared for a 30-year-old of no sex. It is gone, and THA says why.**

**BMI is deliberately still computed** (Case A: `24.7 / "Healthy"`) — BMI is `weight / height²` and needs **no age and no sex**. Removing it would have been a regression, not an honesty gain. See § 12.1 for the age assumption BMI *does* carry, reported not fixed.

---

## 12. USER ACCEPTANCE EVIDENCE

**What a household will now experience on `/profile`:**

| Surface | Before | After |
|---|---|---|
| Health Snapshot → kcal/day tile | **2,630** · *"Target aligned"* — a number computed for a stranger | **"-"** · *"Not set"* — until they set one, and then it is theirs |
| Daily Calories → mode | ◉ **"Auto calculate (recommended)"** — recommending a fabrication | ◉ **"No daily target"** — accurate |
| Daily Calories → alternative | ○ "Set manually" | ○ **"Set my own target"** |
| Under the mode, in auto | *"**Calculated: 2,630 kcal** based on your weight, height, activity level and goal."* | *"THA won't work a target out for you. Doing that honestly needs your age and sex, and THA doesn't hold either. Choose **Set my own target** if you'd like one."* |

**The honest trade, stated plainly:** a household that previously saw a confident 2,630 kcal now sees `-`. **That is the point.** The number was never theirs; it was a stranger's, and it was presented as personalised. The replacement tells them what THA doesn't know and offers the one route to a number that is genuinely their own — one click, no new data demanded, no age asked for.

### 12.1 ⚠️ Evidence gap — stated, not glossed

> **The rendered page was NOT observed.** Browser automation is unavailable in this environment: Playwright is installed, but Chromium fails to launch — `error while loading shared libraries: libglib-2.0.so.0`. (The stray `.glibcheck.txt` / `.libdirs_uxhome.txt` files at the repo root are a **concurrent session diagnosing this same missing library**.)

**What that means, honestly:** the API behaviour above is **observed fact** — driven end-to-end against a live server and recorded in § 11. The UI table above is **read from the diff and type-checked**, not seen rendered. The JSX is valid (typecheck clean, zero errors in the file) and the conditional simplified from `mode === "auto" && profile.health.calculatedCalories && (…)` to `mode === "auto" && (…)`, which is strictly easier to satisfy — but **"it must render" is an inference, not an observation**, and it is recorded as such. This is `EXPCOMP2`'s precedent (*"the surface was never observed rendered"*), and the same standard is applied here rather than quietly claiming a verification that did not happen.

**To close it:** install the missing GLib runtime and re-run a Playwright capture against `/profile` with `calorieMode: "auto"`, asserting `data-testid="text-calorie-estimate-unavailable"` renders and that the string *"Auto calculate"* is absent from the page. A `data-testid` was added for exactly that purpose.

---

## 13. SCOPE LOCK

**LIFE1 Step 0 only. Everything below was in reach, deliberately untouched, and is reported rather than absorbed.**

| Not done | Why |
|---|---|
| **Life Stage** | Not Step 0. LIFE1 § 13 Steps 1–5 |
| **A birth date field** | **Explicitly forbidden by this mission** — and by LIFE1 § 12.1, which gates it behind a legal question about minors' personal data that no governing document answers |
| **Any schema change** | Forbidden. **No column added, altered, or dropped. No migration written.** `calorieMode` keeps its enum and its values |
| **Any new calculation** | Forbidden — and the point. **This change removes a calculation and adds none** |
| **Any age inference** | Forbidden three times over (`HT16`; OBS § 7; `NK1:418`). Nothing here reads behaviour |
| **Fixing `NK1`'s false "age / Authoritative" claims** | **LIFE1 Step 0a** — a separate act on a governing document. An implementation must not amend architecture as a side effect |
| **Retiring `user_preferences.*Count`** | LIFE1 Step 3 |
| **Renaming `kind: "user" \| "child"`** | LIFE1 Step 5 |
| **The 2 pre-existing `adoption:check` failures** | Not this workstream's (§ 8) |
| **The 304 pre-existing typecheck errors** | Not this workstream's (§ 10) |

### 13.1 Findings surfaced during implementation — reported, not fixed

**Two age assumptions LIFE1 did not identify.** Both were found by reading the code around the fix; **neither is Step 0**, and neither is silently changed.

1. **BMI's category thresholds are adult-only** — `routes.ts:560-563` applies the fixed adult bands (18.5 / 25 / 30). **Child and adolescent BMI is assessed against age-and-sex percentile charts, never fixed thresholds**, so `bmiCategory` silently assumes an adult. The exposure is genuinely narrow — `user_preferences` is keyed per **account holder**, and account holders are overwhelmingly adults — but **THA does not know that**, it assumes it. This is the *same class* of defect as `- 5 * 30`, one order of magnitude quieter: it fabricates no number, it fabricates a **category boundary**. It belongs to the same fact (LIFE1's birth date) and should be revisited at LIFE1 Step 2.
2. **The manual input pre-fills `2000`** — `profile-page.tsx:1258`, `useState(prefs.calorieTarget || 2000)`. It is a **UI default in an editable box**, not a claim, and it is only persisted if the household explicitly picks *Set my own target* and saves — so it is not a fabrication in the § 1 sense. But it is a number THA put in front of a household, and a household that saves without editing gets a target **THA suggested and they never chose**. Pre-existing; noted for the Profile's owner.

---

## 14. ROLLBACK PLAN

| Scope | Command |
|---|---|
| **This workstream, entirely** | `git checkout 7d1dd2ce -- server/routes.ts client/src/pages/profile-page.tsx` then delete this report |
| **Server only** | `git checkout 7d1dd2ce -- server/routes.ts` |
| **Client only** | `git checkout 7d1dd2ce -- client/src/pages/profile-page.tsx` |
| **Tag** | `rollback/LIFE2-remove-fabricated-age-assumptions-20260716` → `7d1dd2ce` |

**Reversibility properties:**

- **No data migration to reverse** — this change writes nothing and never did (§ 4).
- **No stored value changed** — every household's `calorieTarget` and `calorieMode` are byte-identical before and after.
- **Reverting is safe and total** — the two files return to HEAD and the fabricated number returns with them.
- **⚠️ Reverting restores a Core Principle 6 violation.** The rollback is mechanically clean and **ethically not**: it puts a stranger's calorie target back in front of every household. If this must be reverted, revert the **client** only (the copy) and leave the server honest — a `null` the UI handles as `"-"` is the safest intermediate state, and the client is already null-safe (§ 3, consumer 7).

---

## 15. THE CHANGE IN ONE PARAGRAPH

THA told every household how many calories to eat by pretending each of them was thirty years old and of no particular sex — `- 5 * 30 - 78`, two constants sitting unnamed in the middle of a Mifflin–St Jeor equation, producing 2,630 kcal for a 180 cm, 80 kg household and captioning it *"based on your weight, height, activity level and goal"*, a sentence that was false about itself. That block is now deleted. Nothing replaces it, because nothing honestly can: the equation needs four inputs and THA holds two, so this is not a degraded estimate but an impossible one, for every household, always — and the response says so in a machine-readable reason code rather than a bare `null` that would read as *not computed yet*. The only number THA will now report is one the household typed in themselves, and the seeded 2,000 that sits beside `auto` in the database is deliberately withheld, because replacing one fabrication with another would have been the easiest mistake available. The Companion never saw any of it: INT12's delegation-only boundary refused to recompute route-layer derivations, and so quarantined this defect from the one surface that speaks — the architecture protected the Companion from the platform. Four API states were driven against a live server and each behaved; 843 assertions still pass; the typecheck is identical to its baseline. What a household loses is a confident number that was a stranger's, and what they gain is a page that tells them what THA does not know and offers the one honest way to a number that is genuinely theirs. **The fix was a deletion, which is what LIFE1 said it would be: the honest answer to *how old are you* is that THA does not know, and shipping that sentence was the whole job.**

---

*Implementation report — LIFE1 Step 0. Subordinate to the governing architecture, which prevails in any conflict.*
*Rollback: `rollback/LIFE2-remove-fabricated-age-assumptions-20260716` → `7d1dd2ce`.*
