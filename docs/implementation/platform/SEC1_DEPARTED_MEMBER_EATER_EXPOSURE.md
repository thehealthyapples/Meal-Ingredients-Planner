# SEC1 — Stop Serving a Departed Member's Live Account Data — Implementation

**Status:** IMPLEMENTED — application code. CONV1 item `SEC-1` only.
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Workstream:** `SEC1_Departed_Member_Eater_Exposure`
**Authority:** [`CONV1 — The Architecture Convergence Programme`](../../investigations/governance/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md) § 3 (`SEC-1`), § 5 (rank 1), § 7 (P0). Source finding: [`PEOPLE1`](../../investigations/platform/PEOPLE1_HOUSEHOLD_PERSON_MODEL_INVESTIGATION.md) § 8.1 (its § 10 Step 0, its § 10.2 recommended next workstream).
**Governing architecture read:** `docs/architecture/README.md` (bootstrap), `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (D16, D27), `CANONICAL_PUBLICATION_ARCHITECTURE.md` (CPuBA4), `REPOSITORY_CONVENTIONS.md`, `ENGINEERING_WORKFLOW.md` (STEP 8), `capabilities/household.md`, `THA_EXPERIENCE_ARCHITECTURE.md` § 12, `NK1` (`:448`).

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| **Rollback ID** | **`rollback/SEC1-departed-member-eater-exposure-20260716` → `7d1dd2ce`** |
| Created | **Before any file was touched** (`ROLLBACK_PROTECTION_PROTOCOL.md` § 1) |
| Annotated? | Yes (`-a`), resolved with `^{commit}` as § 2 requires |
| **What the tag does NOT cover** | **The working tree was already dirty when this began — 49 entries from ~20 concurrent sessions.** A tag protects **committed state only** (§ 3). **None of that work was authored here and none was touched.** |
| **No stash taken** | Deliberate. A stash would have destroyed the concurrent sessions' trees. LIFE2's precedent, applied |
| **Extra protection** | `server/storage.ts` — **the file this change edits — was CLEAN at HEAD**, so the tag is fully sufficient for it (§ 3: *"scope your change so the tag is sufficient"*). It was additionally copied outside the repo before editing |
| Files this workstream touched | **3.** Nothing else |

---

## 1. WHAT WAS WRONG

`server/storage.ts:2919` (at HEAD):

```js
async getHouseholdEaters(householdId: number): Promise<HouseholdEaterRow[]> {
  return db.select().from(householdEaters)
    .where(eq(householdEaters.householdId, householdId))    // ← householdId ONLY
    .orderBy(householdEaters.id);
}
```

**`householdId` only. No membership join. No status filter.** Combined with two other facts, that one `where` clause was a live data-protection defect:

1. **The row outlives the membership.** `leaveHousehold` (`storage.ts:2666-2724`) and `removeHouseholdMember` (`:2747-2798`) set `household_members.status` and **never reference `householdEaters`** — verified by reading both in full. The FK is `onDelete: "set null"` (`schema.ts:1163`), which fires on *user deletion*, not departure. So the orphaned row survives with its `userId` intact.
2. **For an adult, the eater row is an identity with no facts.** `routes.ts:9041` re-reads the linked account at read time:

```js
const userRow = await storage.getUser(eater.userId);
// → :9051  hardRestrictions = userRow?.dietRestrictions ?? []
```

> **So a stale row was not a stale record. It was a live feed of a former member's current profile — including their allergens, which are health data — served to a household they had left, indefinitely, and updating as they changed it.**

**PEOPLE1 § 8.1 named the causal chain precisely, and this workstream verified every link at source before changing anything.** The departure bug is a lifecycle gap that would exist under any ownership model; **the ownership inversion is what converts it from a stale record into a live feed.**

---

## 2. WHAT CHANGED

### 2.1 `server/storage.ts` — one function

`getHouseholdEaters` now returns children (`userId IS NULL`) plus adults who are **still active members**:

```js
const activeMemberUserIds = db
  .select({ userId: householdMembers.userId })
  .from(householdMembers)
  .where(and(
    eq(householdMembers.householdId, householdId),
    eq(householdMembers.status, "active"),
  ));

return db.select().from(householdEaters)
  .where(and(
    eq(householdEaters.householdId, householdId),
    or(
      isNull(householdEaters.userId),
      inArray(householdEaters.userId, activeMemberUserIds),
    ),
  ))
  .orderBy(householdEaters.id);
```

**This is not a new rule. It is the rule the write side already applies**, twenty lines above:

```js
/** Ensure every active household_member has a corresponding householdEaters row. */
async syncMembersAsEaters(householdId: number) {
  ...where(and(eq(householdMembers.householdId, householdId),
              eq(householdMembers.status, "active")));   // ← storage.ts:2897
```

> **`syncMembersAsEaters` only ever *creates* a row for an ACTIVE member. `getHouseholdEaters` returned rows for *any* member, active or not. The read and the write disagreed about who is at the table, and the read was the looser of the two. The fix is to make the read agree with the write that already existed.**

One `sql` statement, one round trip, atomic. No new dependency, no new import (`and`, `or`, `isNull`, `inArray` were already imported at `:5`).

### 2.2 Why this layer, and not the departure

**The alternative — reaping or severing the row at `leaveHousehold` — was considered and rejected on the merits, not for convenience.**

| Option | Verdict |
|---|---|
| **Null the `userId`** (sever) | **🔴 REFUSED — it trades a privacy defect for a safety defect.** `household-eater.ts:107` types an eater by `userId != null`, so nulling it flips the row to **`kind: "child"`**, lifts the `403` on `PATCH`, and — decisively — **`household-dietary-safety.ts:252-261` promotes the eater row to canonical owner of allergens it stores as `[]` by design.** The departed person would remain a named, plannable eater **with a silently empty restriction set.** This is **PEOPLE1 § 8.6's latent trap, triggered deliberately** |
| **Delete the row** (reap) | **🔴 REFUSED — destructive and out of scope.** `planner_entry_eaters.householdEaterId` references it; deleting destroys the household's own planner history. **And retention is a data-protection decision this layer is not entitled to take** — PEOPLE1 § 8.3 records that erasure has no path at all, and § 8.1 explicitly leaves it as *"a retention question worth answering"* |
| **Filter the read** | ✅ **ADOPTED.** Removes the exposure everywhere at once, decides no retention question, preserves referential integrity, and is reversible at one function |

> **CONV1 § 3 recommended the filter first, and the reason survived contact with the code: it removes an exposure rather than adding a claim.** The fix is **non-destructive by design** — proven in § 5, Case 1 and § 6.

### 2.3 One deliberate consequence: a rejoining member keeps everything

Because the row is filtered rather than deleted, and because `syncMembersAsEaters` checks `existingUserIds` against **all** rows (not just active ones), **a member who leaves and rejoins gets their original eater row back — same `id`, same planner history, no duplicate.** Asserted in § 5, Case 4.

**This is a genuine benefit of the filter, and it is the reason the two-query approach was not used:** had the sync consulted `getHouseholdEaters`, filtering would have made it re-insert a duplicate row for every departed member on every page load. **It does not — it queries the table directly (`:2899-2902`), so the sync is unaffected.** Verified.

---

## 3. THE CONSUMER AUDIT

**Every call site of `getHouseholdEaters`, enumerated and checked.** The fix is at the storage layer, so it changes all of them at once — which is the whole safety argument and requires each to be justified.

| # | Consumer | `file:line` | Effect | Verdict |
|---|---|---|---|---|
| 1 | **`GET /api/household/eaters`** — **the leak** | `routes.ts:9029` | Departed member no longer returned, so `:9041`'s `getUser` is never reached for them | ✅ **Closed** |
| 2 | **The Companion's `eaters` scope** | `household-read-handler.ts:221` (via `household-read-port.ts:63`) | Departed member no longer projected to the language model | ✅ **Closed — same defect, second mouth** |
| 3 | **Smart Suggest** | `routes.ts:4759` | Plans for active eaters only | ✅ Correct |
| 4 | **Meal tailoring** (`gpt-4o-mini`) | `routes.ts:9434` | Departed member no longer named to the model | ✅ **Closed** |
| 5 | **`HouseholdSafeFor` snapshot** | `routes.ts:10072` | New snapshots exclude departed members. **Existing persisted snapshots are historical and untouched** | ✅ Correct |
| 6 | **`PATCH` eater validation** | `routes.ts:9090` | A departed member's eater id is no longer addressable | ✅ Tightening |
| 7 | **Planner-entry eater validation** | `routes.ts:9159` | Assigning a planner entry to a departed member now returns **400** | ✅ **Tightening — see § 3.1** |
| 8 | **Week eater override validation** | `routes.ts:9311` | Setting a week override for a departed member now returns **400** | ✅ Tightening |
| 9 | **Planner-entry eaters — default fallback** | `routes.ts:9131` | The "no explicit selection → all household eaters" default is now correct | ✅ Correct |
| 10 | **Household discovery** | `household-discovery-engine.ts:69` | Departed member no longer discovered | ✅ Correct |
| 11 | **Food Intelligence** | `food-intelligence/engine.ts:266` | Reasons over active eaters only | ✅ Correct |
| 12 | **Benchmark seeder** | `world-seeder.ts:324`, `:582` | Reads immediately after `syncMembersAsEaters`; fixture eaters with an `accountKey` are active members, and account-less ones are children | ✅ **Unaffected — verified by reading `:315-345`** |
| 13 | **Development World import / reader** | `import-development-world.ts:526`, `:551`; `world-reader.ts:369` | Same pattern | ✅ Unaffected |
| 14 | **`sim-slot-fill.ts`** | `:58` | Dev script | ✅ Unaffected |

### 3.1 The behaviour change, stated plainly

**Consumers 6–8 are a tightening, and it is in the right direction:** a household can no longer assign a meal, a planner entry, or a week override to a person who has left. Previously they could, because the departed member was still offered in the list. **The client sources its eater list from consumer 1, so it will never send such an id** — the guards are defence in depth, not a path a user can reach.

### 3.2 The residue — reported, not hidden

**`getPlannerEntryEaters` (`storage.ts:2984`) is NOT affected by this fix**, and that is deliberate: it `innerJoin`s `householdEaters` directly rather than calling `getHouseholdEaters`.

**Consequence, stated honestly:** a departed member's **name** can still appear on a planner entry they were **explicitly assigned to before they left**.

**Why that is acceptable and in scope to leave:**

- **It is not a live account read.** `getPlannerEntryEaters` returns the **frozen** eater row — the `displayName` copied at insert, and `hardRestrictions` which for an adult is `[]` by design. **`getUser` is never called on this path** — verified at `routes.ts:9127-9134`, which does `res.json(rows.map(dbEaterToHouseholdEater))` with no enrichment.
- **It is the household's own planner history** — a record that this meal was planned for this person, when they lived there.
- **Removing it is the retention decision this workstream is explicitly not entitled to take** (§ 2.2).

> **The mission was to stop the live feed. The live feed is stopped. The frozen historical name is a different question, it is PEOPLE1 § 8.3's, and naming it is the honest close rather than quietly widening scope to cover it.**

---

## 4. DATA IMPACT

```
GOVERNANCE GATE
===============
Domain affected:         16 (Household Profiles) — READ PATH ONLY.
                         27 (User Preferences) — untouched.
Declared SoT:            households, household_members, household_eaters
                         (Domain 16) — unchanged, still authoritative.
Ownership changed?       NO. household_eaters remains the canonical owner of a
                         person-within-a-household (Register D16; Principle 1).
New store created?       NO.
Existing store extended? NO.
Schema modified?         NO. No column added, altered, or dropped. No migration.
Data written?            NONE. This change writes nothing, ever.
Data deleted?            NONE. No row is reaped, nulled, or rewritten.
Consumer created?        NO. Fourteen existing consumers corrected at one owner.
New write funnel?        NO (CPuBA4 — the funnel is untouched).
New knowledge store?     NO (Register Rule 8 does not fire).
```

**There is no bad data to clean up, and no migration to run.** The defect was a `WHERE` clause, not a value. Every `household_eaters` row in the database is byte-identical before and after — **including the orphaned ones, which is the point** (§ 2.2).

---

## 5. VERIFICATION — THE TEST SUITE

`server/tests/test-sec1-departed-member-eater-exposure.ts` — **17 assertions, driven through the real storage layer against the real database.**

> **Deliberately not mocked. The defect lived in a `WHERE` clause, and a mock of that clause would have asserted the bug.** `test-intelligence-household-binding.ts:156` mocks `getHouseholdEaters` — which is why its 51 assertions passed against the defect for its entire life.

```
SEC1 — departed member eater exposure

Case 1 — a member who leaves stops being served to the household
  ✓ while a member, Alice is an eater in Bob's household
  ✓ both members present
  ✓ the orphaned row still EXISTS in the table (not deleted)
  ✓ the orphaned row still carries Alice's userId (not severed to null)
  ✓ ★ after leaving, Alice is NOT served to Bob's household
  ✓ only Bob remains
  ✓ and Bob is still there
  ✓ Alice's own account is untouched — diet intact
  ✓ Alice's own account is untouched — allergens intact

Case 2 — children (userId = null) are unaffected
  ✓ a child with no account is served
  ✓ child keeps their own allergens
  ✓ household now shows Bob + child, and not Alice

Case 3 — removeHouseholdMember closes the same hole
  ✓ Carol is served while an active member
  ✓ ★ a REMOVED member is not served either

Case 4 — a rejoining member keeps their original eater row
  ✓ ★ Alice is served again after rejoining
  ✓ ★ and it is her ORIGINAL row — planner history survives, no duplicate
  ✓ exactly one row for Alice — the sync did not duplicate her

17 passed, 0 failed
```

### 5.1 ★ The test was proved to detect the defect

**A test that passes proves nothing unless it fails without the fix.** `server/storage.ts` was reverted to `7d1dd2ce` and the suite re-run:

```
  ✗ ★ after leaving, Alice is NOT served to Bob's household
  ✗ only Bob remains
  ✗ household now shows Bob + child, and not Alice
  ✗ ★ a REMOVED member is not served either
  13 passed, 4 failed
```

**Exactly the four leak assertions fail, and nothing else.** The fix was then restored and the suite returned to 17/0.

**Case 4 passes in both states** — confirming the rejoin path was already correct and this change did not break it.

### 5.2 Wired to a gate

Registered in `package.json` as `test:sec1-departed-member-eater-exposure` **and added to the aggregate `test` suite**, per CONV1's own **CP10** — *a convergence is finished when a gate can fail*. A security regression left out of the suite never runs again.

---

## 6. MANUAL VERIFICATION — DRIVEN AGAINST A LIVE SERVER

**Performed on port 5098.** The concurrent session's server on 5000 was left untouched (`tsx` does not hot-reload, so verifying against 5000 would have tested stale code — LIFE2's precedent).

Registration is closed (*"Private beta — registration is currently closed"*), so two `POST /api/demo/start` sessions were used.

| Step | Action | Observed |
|---|---|---|
| 1 | Bob + Alice created as demo users | ids 750, 751 |
| 2 | Alice: `PUT /api/profile` → `Vegan`, `["Nuts"]` | **200** |
| 3 | Alice joins Bob's household via invite | **200** |
| 4 | Bob: `GET /api/household/eaters` | Two eaters. **Alice's `['vegan']` / `['Nuts']` correctly visible — she is a member** |
| 5 | **Alice: `POST /api/household/leave`** | **200** |
| 6 | **Alice, now in her own home, changes her allergens → `Vegan`, `["Dairy","Eggs"]`** | **200** |
| 7 | **★ Bob: `GET /api/household/eaters`** | **1 row — Bob only.** `restrictions: []` |

```
  Alice post-departure allergens (Dairy/Eggs) visible to Bob: False
  >>> PASS — the live feed is closed
```

**And the raw table, checked directly afterwards:**

```
  raw household_eaters rows in Bob's household: 2
   - id=813 userId=750 name="Demo User"
   - id=814 userId=751 name="Demo User"     ← Alice's row: still present, userId intact

  Alice's row still present in the table:            true
  Alice's userId still intact (NOT severed to null): true
  >>> PASS — non-destructive: the row survives; only the READ is filtered
```

> **This is the whole change in one observation: Alice declared a new allergy in her own home after leaving, and it never reached the household she left — while her row, her id, and her planner history all survived untouched.**

**One honest note on method.** Step 6 first failed with **HTTP 400** on `dietPattern: "Pescatarian"` — **that was my error, not a platform defect**: the enum is `Mediterranean | DASH | MIND | Flexitarian | Vegetarian | Vegan | Keto | Low-Carb | Paleo | Carnivore`. Re-run with a valid value, it returned 200 and the demonstration completed. **Recorded because the first attempt did not prove what it appeared to**, and a verification that quietly drops a failed step is not a verification.

**Test data cleaned up afterwards:** 2 demo users, 3 households and their eaters removed. The 5098 server was stopped; **port 5000 confirmed still up and untouched.**

---

## 7. WHAT MUST NOT BREAK — AND DID NOT

| Suite | Result |
|---|---|
| **SEC1 (new)** | **17 passed, 0 failed** |
| INT13 Household read-only binding | **51 passed, 0 failed** |
| Household eater (unit) | **13 passed, 0 failed** |
| Guest eater | **17 passed, 0 failed** |
| SURF1A existing-data surfacing | **31 passed, 0 failed** |
| SURF1B dietary-restriction safety path | **54 passed, 0 failed** |
| SURF1B3 onboarding allergy routing | **64 passed, 0 failed** |
| SURF1B4 canonical diet-pattern safety | **315 passed, 0 failed** |
| SURF1B5 starter-meal safety | **84 passed, 0 failed** |
| Planner compliance | **25 passed, 0 failed** |
| INT12 Profile read-only binding | **50 passed, 0 failed** |
| Intelligence Platform foundation | **33 passed, 0 failed** |
| INT planner binding | **31 passed, 0 failed** |
| INT17/NCV1 context composition | **166 passed, 0 failed** |
| Companion actions | **62 passed, 0 failed** |
| RM4 planner ready-meal library | **21 passed, 0 failed** |
| Food Intelligence binding | **36 passed, 0 failed** |
| **Total** | **1,070 passed, 0 failed** |

**Typecheck:** `npx tsc --noEmit` → **304 errors before, 304 after — identical**, and **zero** in either file this workstream touched. The 304 are pre-existing branch debt from concurrent sessions' in-flight work; **this change contributes none.**

**`npm run verify:publication`:** **unchanged — 22 domains, 5 🟢 · 11 🟡 · 6 🔴; 60 checks, 24/24/12.** Correct: `SEC-1` is not a publication item, and a security fix that moved a publication number would mean it had done something it was not asked to do.

---

## 8. ARCHITECTURE COMPLIANCE

| Check | Result |
|---|---|
| **Architecture Bootstrap read (STEP 2)** | ✅ Bootstrap + Principles + SoT Register (D16/D27) + CPuBA + `capabilities/household.md` + Repository Conventions |
| **Principle 1 — one canonical identity** | ✅ Untouched. `household_eaters.id` remains the person's identity; **Case 4 proves it survives a departure and a rejoin** |
| **Principle 2 — one owner per fact** | ✅ **No fact moved and no owner created.** `household_eaters` remains Domain 16's, as the Register declares. **This change does not resolve the `users.diet*` inversion and does not pretend to** — it stops one consequence of it |
| **Principle 4 — one assembled model per entity** | ✅ Strengthened — the correction lands at the single owner, so all 14 consumers converge on it rather than each filtering |
| **Principle 6 — honest gaps over invented facts** | ✅ A departed member is now **absent**, which is the truth. Previously they were present and described with a stranger's live data |
| **Principle 7 — no permanent sync bridge** | ✅ Nothing stored, nothing cached, nothing derived and persisted |
| **Principle 8 — retire on introduction** | ✅ **Not engaged — nothing is superseded.** No store replaced, no predecessor left un-retired |
| **CPuBA4 — one write funnel** | ✅ **Not engaged — this change writes nothing.** The funnel is untouched |
| **Register Rule 7** | ✅ **No update required — this change alters no ownership.** It makes a read obey ownership the Register already declares |
| **Register Rule 8** | ✅ Not triggered — no knowledge store |
| **`EXP ARCH § 12` — no dark corners** | ✅ The rule this change exists to satisfy: *"Data belongs to the household… lets them correct or remove it"* |
| **`NK1:448` — household_eaters GDPR posture** | ✅ Upheld. Rectification still works; **erasure still has no path (PEOPLE1 § 8.3) — unchanged and reported, not silently claimed as fixed** |
| **Household Time — HT3/HT5/HT16** | ✅ **Not engaged.** No clock read, no date derived, no derivation stored, nothing inferred |
| **Observation Engine § 7** | ✅ Nothing recorded, nothing read. **`OBS_DISABLE_CAPTURE=1` remains a functional no-op** |
| **AI ARCHITECTURE COMPLIANCE** | ✅ **Not engaged as a design change** — no capability, intent, prompt or Context View was touched. The Companion's `eaters` scope is corrected **because it reads the fixed owner**, which is INT13's delegation-only boundary working as designed |
| **Experience & UI Governance** | ✅ **Not engaged — no user-facing copy, component, token, or surface changed.** No client file touched |
| **Adoption Register** | ✅ **Not engaged** — no client-side building block created, adopted, or retired |
| **Product Registry (KC15)** | ✅ **Assessed: no entry affected.** `docs/product/structure/pages/page-profile.md` and `cap-household` describe the household's own members; **none makes a claim this change falsifies** — a departed member was never a documented feature. **`last_verified` deliberately NOT bumped** — currency is the named owner's attestation (Rule KC14), not a passing implementer's |

### 8.1 Architecture Convergence Status (STEP 8)

**Engaged.** `SEC-1` is a security fix inside one owner's read path, but it is a CONV1 convergence item and the programme's § 7.1 boundary says STEP 8 owns the per-implementation report.

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:                      16 — Household Profiles (person-within-a-household)

Current Canonical Owner:     household_eaters
                             (SoT Register Domain 16; ARCHITECTURE_PRINCIPLES.md
                             Principle 1 — the eater is a named major entity)

Current Runtime Consumer(s): 14 — enumerated in full at §3.

Duplicate Owners Remaining:  users.dietPattern / users.dietRestrictions
                             (ARCHITECTURE_PRINCIPLES.md:38 — "same scope, must
                             always agree → redundant"). UNCHANGED by this work.

Duplicate State Remaining:   The three read-time enrichment paths with three
                             merge rules (CONV1 READ-1); the users→user_preferences
                             "Bridge" (CONV1 WRITE-1). UNCHANGED.

Duplicate Workflows Remaining: DIET_PATTERN_TO_DIET_TYPE ×5 (CONV1 READ-2). UNCHANGED.

Current Convergence (%):     Unknown — requires audit.
                             Stated as Unknown deliberately, per STEP 8's own rule
                             ("never invent a percentage"). This change converged
                             ZERO duplicate owners: it is a security fix within the
                             existing (wrong) ownership model, not a repair TO the
                             model. Claiming a convergence gain here would be false.

Target Convergence (%):      N/A for this workstream — see above.

Next Planned Milestone:      CONV1 DOC-1 (correct the four-way governing conflict),
                             then CONV1 WRITE-2 → OWN-1 (move the write door, retire
                             the users.diet* columns). Only those move the number.

Remaining Architectural Risks:
                             The ownership inversion that MADE this a live feed is
                             untouched (PEOPLE1 §3.2). This change removes the
                             exposure; it does not remove the cause. Also unchanged:
                             PEOPLE1 §8.6's onDelete:"set null" trap, §8.3's absent
                             erasure path, and §6.3's write-inside-a-GET race
                             (CONV1 WRITE-3).
```

> **Stated plainly: this is a bandage on a correct wound.** The exposure is gone. **The inversion that produced it is exactly as live as it was this morning**, and `OWN-1` is still the work.

---

## 9. SCOPE LOCK

**CONV1 `SEC-1` only. Everything below was in reach, deliberately untouched, and is reported rather than absorbed.**

| Not done | Why |
|---|---|
| **Retiring `users.dietPattern` / `dietRestrictions`** | **CONV1 `OWN-1`.** Blocked by `DOC-1` — the canon holds four positions on it |
| **Moving the eater write door / lifting the 403** | **CONV1 `WRITE-2`.** The hinge, and it carries all the risk |
| **Deleting the read-time enrichments or the Bridge** | **CONV1 `READ-1` / `WRITE-1`.** **CP2 — the scaffolding comes down LAST.** Deleting them now makes the platform forget every adult's allergy |
| **Reaping or severing the orphaned row** | § 2.2 — **refused on the merits.** Severing triggers PEOPLE1 § 8.6; deleting is a retention decision and breaks `planner_entry_eaters` |
| **An erasure path for `household_eaters`** | **PEOPLE1 § 8.3.** A distinct right, a distinct workstream, and a legal question |
| **The `(householdId, userId)` unique constraint** | **CONV1 `WRITE-3`.** A schema change; not this item |
| **`getPlannerEntryEaters`** | § 3.2 — **the frozen historical name is a different question**, and not a live feed |
| **Correcting `capabilities/household.md`** | **CONV1 `DOC-3` / `DOC-1`.** **An implementation must not amend governing architecture as a side effect** |
| **The 2 pre-existing `adoption:check` failures / 304 typecheck errors** | Not this workstream's (§ 7) |
| **The 6 red publication domains** | Not this item (§ 7) |

---

## 10. FILES CHANGED

| File | Change |
|---|---|
| **`server/storage.ts`** | `getHouseholdEaters` filters on active membership. **+34 / −1.** One function; nothing else in the file touched |
| **`server/tests/test-sec1-departed-member-eater-exposure.ts`** | **NEW.** 17 DB-backed assertions; proved to fail without the fix |
| **`package.json`** | **+2 lines** — the test script, and its entry in the aggregate `test` suite. *(File was already dirty from a concurrent session's `test:home2-home-primary-action`; that line was preserved and JSON validity re-verified)* |
| `docs/implementation/platform/SEC1_DEPARTED_MEMBER_EATER_EXPOSURE.md` | This report |

**No schema. No migration. No client file. No architecture document. No governing rule.**

---

## 11. ROLLBACK PLAN

| Scope | Command |
|---|---|
| **This workstream, entirely** | `git checkout 7d1dd2ce -- server/storage.ts package.json` then delete the test and this report |
| **The fix only** | `git checkout 7d1dd2ce -- server/storage.ts` |
| **Tag** | `rollback/SEC1-departed-member-eater-exposure-20260716` → `7d1dd2ce` |

> **⚠️ `git checkout 7d1dd2ce -- package.json` would also revert the concurrent session's `test:home2-home-primary-action` lines.** Prefer removing the two SEC1 lines by hand.

**Reversibility properties:**

- **No data migration to reverse** — this change writes nothing and never did (§ 4).
- **No stored value changed** — every `household_eaters` row is byte-identical, including the orphaned ones.
- **Reverting is mechanically clean and ethically not.** It restores a live disclosure of health data to a party with no relationship to the data subject. **If this must be reverted, revert it because the filter is wrong, not because the exposure was convenient.**

---

## 12. NEXT CONV1 ITEM

> **`SEC-4` — `/api/uplift/accept` accepts any rule id a caller invents, and stamps it as reviewed.**

CONV1 § 5 ranks it second, and nothing about this workstream changes that. It is Tier 0, blocked by nothing, and it is the last remaining item in the programme where a **live** trust defect is reachable through an ordinary production route: `routes.ts:11163` persists a caller-supplied `ruleId` with no validation against `UPLIFT_RULES`, every row is stamped `added_by: 'tha_uplift'`, and the publication gate found **8 live rows** citing `fallback-deterministic-boosts` — a rule identity that exists only in `client/src/pages/weekly-planner-page.tsx:337`.

**Do it in CONV1's stated order: validate server-side first, then delete the client constant.** Deleting the constant closes today's leak and leaves the endpoint accepting anything. **The endpoint is the defect; the client is only its first exploiter.**

`SEC-2` / `SEC-3` (the auth token timestamps) remain equally unblocked and are a single cheap change — but they are **latent**, masked by UTC containers, and `SEC-4` is live.

**And the standing recommendation from CONV1 § 7 is unchanged:** the largest item, `OWN-1`, must not start until **`DOC-1`** lands. **Nothing in this workstream moved that.**

---

## 13. THE CHANGE IN ONE PARAGRAPH

A person who left a household was still having their allergens read out of their live account and handed to the people they left — not once, but on every page load, updating as they changed them, because `getHouseholdEaters` filtered on `householdId` and nothing else while `leaveHousehold` never touched the eater table at all, and `routes.ts:9041` dutifully re-read the stranger's profile for every adult row it found. The fix is one `WHERE` clause: return children, plus adults who are still active members — which is not a new rule but the rule the write side had been applying twenty lines above the whole time, since `syncMembersAsEaters` only ever creates a row for an *active* member. **The read and the write disagreed about who was at the table, and the read was the looser of the two.** The row is not deleted and the `userId` is not nulled, and both refusals are load-bearing rather than lazy: nulling it would flip the person to a child by `household-eater.ts`'s rule and promote their eater row to canonical owner of allergens it stores as `[]` by design — quietly emptying a real person's restrictions while leaving them plannable, which is PEOPLE1 § 8.6's trap sprung on purpose — and deleting it would destroy planner history and take a retention decision this layer has no right to take. So the row survives, the exposure does not, and a member who rejoins gets their original id and their history back. It was driven end to end against a live server: Alice left, then declared a new dairy and egg allergy in her own home, and Bob's household never saw it — while her row sat in the table the whole time with her `userId` intact, which is the proof that the read was filtered and nothing was destroyed. The test was reverted against `7d1dd2ce` to confirm it fails without the fix, and exactly the four leak assertions failed and nothing else. **What this does not do is fix the reason it happened: a person's allergy still has two owners discriminated by whether they have a login, and the eater's own write door is still closed by a 403. This change removes an exposure. It does not remove the cause — `OWN-1` is still the work, and it still cannot start until the canon stops holding four opinions about it.**

---

*Implementation report — CONV1 item `SEC-1`. Subordinate to the governing architecture, which prevails in any conflict.*
*Rollback: `rollback/SEC1-departed-member-eater-exposure-20260716` → `7d1dd2ce`.*
