# CONV1 Phase P4 — The Household Person

**Workstream:** `CONV1_Phase_P4_Household_Person`
**Date:** 2026-07-16
**Rollback identifier:** `rollback/CONV1-phase-p4-household-person-20260716` → `7d1dd2ce`
**Status:** ✅ **COMPLETE** — all six workstreams closed in the approved sequence. **The gate target is met: `verify:publication` — Household Dietary Preference 🔴 → 🟢.**

> **Scope.** CONV1 Phase **P4** only: `WRITE-3` → `WRITE-2` → `OWN-1` → `READ-1` + `READ-2` + `WRITE-1`.
> No unrelated refactoring. Implementation report — it creates no rule, and where it and any
> governing document disagree, **this document is the defect.**

---

## 0. THE HEADLINE

**A person's diet now has one owner, and it is the one the governing architecture named on
2026-06-25.** `household_eaters` owns every member's diet — the pattern stored in
`default_diet_types` as its canonical diet type, restrictions in `hard_restrictions` — for
account-holders and account-less members alike. The `users.dietPattern` / `users.dietRestrictions`
shadow is **dropped from the schema and from the physical database**, behind a migration gate that
refuses to drop if a single active member's diet fact is not already present on their eater row.
The three read-time enrichments, the five mapping copies, and the platform's only self-confessed
permanent synchronisation bridge are deleted. **Zero new owners, zero new domains, zero new
stores** — exactly as CONV1 § 1.4 predicted for every item in the census.

The ordering discipline held: the write door moved first (`WRITE-2`), the columns retired behind it
(`OWN-1`), and the scaffolding came down last (`READ-1`/`READ-2`/`WRITE-1`) — never the reverse
(CP2, CP3). The proof it mattered is executable: the OWN-1 migration's `DO $$` gate counted zero
unmigrated members before permitting the DROP, and the post-migration census shows **95 account
eater rows carrying the migrated diet facts, 0 active members without an eater row, 0 duplicate
rows, and the columns physically gone.**

---

## 1. WHAT WAS COMPLETED

| Workstream | Verdict | What actually changed |
|---|---|---|
| **`WRITE-3`** — sync race + missing constraint | ✅ **CLOSED** | Partial unique index `household_eaters(household_id, user_id) WHERE user_id IS NOT NULL` (schema + migration, with a dedupe-merge that repoints planner references before deleting duplicates). Eater creation moved to the **six** membership events (`createUser`, `createHouseholdForUser`, `createDemoUser`, `joinHousehold`, `leaveHousehold`, `removeHouseholdMember`), all inside the owning transaction. `syncMembersAsEaters` — the write inside `GET /api/household/eaters` — is **retired**; the GET is a pure read. Backfill migration guarantees every existing active member a row |
| **`WRITE-2`** — the write door (the hinge) | ✅ **CLOSED** | `storage.updatePersonDiet(userId, {dietPattern?, hardRestrictions?})` is the one write door for a person's own diet; `PUT /api/profile` and `POST /api/user/complete-onboarding` route through it (SURF1B3's allergy-routing door preserved intact). The eater PATCH **403 is lifted** — a household can correct any member's declared diets on the row that owns them. Copy migration unions every active member's `users.diet*` (+ `user_preferences.diet_types`) onto their eater row, **pattern head first** so the derived pattern equals the declared pattern — the safety gate could not weaken |
| **`OWN-1`** — retire the shadow columns | ✅ **CLOSED** | `diet_pattern` / `diet_restrictions` removed from `shared/schema.ts` and **dropped** by migration `2026-07-16_conv1_p4_retire_users_diet_columns` — gated by a `DO $$` assert that **refuses the drop** if any active member's restrictions are not a subset of (or pattern absent from) their eater row. Every reader moved: the canonical safety resolver, `buildProfileResponse`, the INT17 profile read handler/port (view shape unchanged, source corrected), recipe search's profile fallback, Smart Suggest's requester diet, `sanitizeUser`'s allowlist, the benchmark world-seeder, and the dev scripts |
| **`READ-1`** — the read-time enrichments | ✅ **CLOSED** | All three census enrichments deleted (routes eaters GET; `household-read-handler.ts` — `enrichEater(row, port)` is now the pure projection `toEaterView(row)`; the matcher's adult branch) **plus a fourth the census missed** (§ 4.1). Every eater — account-backed or not — is served from the stored row |
| **`READ-2`** — the five mapping copies | ✅ **CLOSED** | One owner: `shared/dietRules.ts` — which already owned the diet-pattern vocabulary — now exports `DIET_PATTERN_TO_DIET_TYPE`, `CANONICAL_DIET_TYPE_VALUES`, and the strict inverse `dietPatternFromDietTypes()`. The copies in `routes.ts`, `household-meal-matcher.ts`, `household-read-handler.ts`, `sim-slot-fill.ts` are deleted; the test copy died with the bridge test's rewrite. The mapping is bijective (`type = pattern.toLowerCase()` for all ten patterns), which is what lets the eater row own the pattern losslessly |
| **`WRITE-1`** — the Bridge | ✅ **CLOSED** | The self-declared `// Bridge: sync users.diet_pattern → user_preferences.diet_types` block (one-way, non-transactional, failure-swallowing — Principle 7's named shape) is **deleted**. `user_preferences.dietTypes` remains Domain 27's own soft-preference fact, written only by its own doors — per the DOC-1-corrected Register, it was never a rival owner |

---

## 2. THE MEASURE — re-run for this phase, never inherited (CP11)

| Signal | Baseline (measured at P4 start) | **After P4** | Δ |
|---|---|---|---|
| `verify:publication` — **Household Dietary Preference** | **🔴 publication failure** (`hh-sync-bridge` + `hh-contested-owner` failing) | **🟢 healthy — all four checks pass** | **★ the phase gate, met** |
| `verify:publication` — platform | 22 domains: 🟢5 · 🟡12 · 🔴5; 60 checks: 31 pass · 21 warn · 8 fail | 🟢6 · 🟡12 · **🔴4**; **34 pass · 20 warn · 6 fail** | **reds 5 → 4; fails 8 → 6** |
| **Live data census** (executed post-migration) | 21 households with a live restriction on the shadow | **columns dropped · 95 eater rows carry the migrated facts · 0 active members without an eater row · 0 duplicates · unique index live** | **not one allergen lost — asserted by the migration itself** |
| `verify:coherence` | PASS (Domain 6/18 corrected by a concurrent session) | **PASS** | 0 added |
| `npm run build` | passes | **passes** | — |
| `typecheck:ci` | 33 regressions (the 32 P2/P3 froze + 1 already present at HEAD `7d1dd2ce`, recorded after the baseline) | **33 — identical set** | **0 added by P4** (every P4-touched file compiles clean) |
| `adoption:check` | 2 pre-existing fails (`button-primitive` 539>538; `HouseholdNutritionPanel` orphan) | **identical 2 fails**, 1 notice (a `dark:` count fact drifted — concurrent sessions') | 0 added by P4 |
| Affected test suites | — | **see § 6** | — |

### 2.1 Verified end-to-end against the running application

Driven live, not reasoned (demo signup → the whole converged surface):

```
demo start        → user 767 created; eater row created AT the membership event (WRITE-3)
PUT /api/profile  {dietPattern: "Vegan", dietRestrictions: ["Gluten-Free"]}     (WRITE-2)
GET /api/profile  → dietPattern "Vegan", dietRestrictions ["Gluten-Free"]       (OWN-1 read)
GET /api/household/eaters → [("Demo User", "account", ["vegan"], ["Gluten-Free"])]  (READ-1: stored, not enriched)
PATCH /api/household/eaters/:id {hardRestrictions: ["Gluten-Free","nuts"]} → 200  (the lifted 403)
GET /api/profile  → dietRestrictions ["Gluten-Free","nuts"]
```

**The last line is the convergence in one exchange:** the household corrected a member's
restrictions on the eater row, and the member's own profile immediately reports it — one fact, one
owner, two doors that can no longer disagree.

---

## 3. THE MIGRATIONS (all three applied to the live database)

1. **`2026-07-16_conv1_p4_household_eaters_integrity`** (`WRITE-3`) — dedupe-merges duplicate
   `(household_id, user_id)` rows (planner entry/override references repointed to the keeper, diet
   arrays unioned, then duplicates deleted), creates the partial unique index, and backfills an
   eater row for every active member.
2. **`2026-07-16_conv1_p4_move_diet_to_household_eaters`** (`WRITE-2`) — for every ACTIVE
   membership: `default_diet_types := dedupe(pattern-head ∥ existing ∥ user_preferences.diet_types)`
   (first-occurrence order preserved; the pattern head first so derivation returns exactly the
   declared pattern), `hard_restrictions := dedupe(users.diet_restrictions ∥ existing)`. Departed
   memberships are deliberately NOT copied — a former household has no claim on a person's current
   declarations (SEC-1's posture).
3. **`2026-07-16_conv1_p4_retire_users_diet_columns`** (`OWN-1`) — a `DO $$` gate that **raises**
   (aborting the migration transaction, preserving the columns) if any active member's diet facts
   are missing from their eater row; then `DROP COLUMN`. It ran clean: zero unmigrated members.

⚠️ **Rollback note:** the migrations are applied. Reverting P4's code does **not** restore the
dropped columns — the facts live on `household_eaters` (nothing was lost; the union is a superset).
A code-only revert would fail to compile against the migrated database, deliberately: the schema
declaration and the physical database agree at every point (the SEC-2/SEC-3 lesson).

### 3.1 One behaviour the model change REQUIRED, stated as a decision

Post-P4, a person's declarations live on their eater row — so **they must travel when the person
moves household**, or a leaver/joiner's allergens would be silently discarded (the exact loss
PEOPLE1 § 9.2 forbids; pre-P4 the profile columns travelled implicitly). `ensureEaterForMemberTx`
therefore seeds a NEW eater row's diets from the person's previous household's row on
join/leave/removal. A **rejoin** keeps the original row and its declarations, unchanged. The
departed household's row is retained but never served (SEC-1's filter, untouched).

---

## 4. CORRECTIONS TO CONV1'S INVENTORY (verified at source)

1. **`READ-1` counted three enrichments; there were FOUR.** The census named `routes.ts:9038-9054`,
   `household-read-handler.ts:132-166`, `household-meal-matcher.ts:245-266` — and separately
   documented `routes.ts:4759-4784` (the Smart Suggest eater loop, deriving adult diet types from
   `user_preferences.dietTypes` → `users.dietPattern`) *as part of `OWN-1`'s evidence without listing
   it as a READ-1 target*. It is the same class and it read the retired columns; deleted with the
   other three.
2. **`READ-2` counted five copies; the live count for the mapping was five, but the census's fifth
   (`test-diet-reconciliation-bridge.ts`) died with the bridge it tested** — the rewritten ratchet
   imports the shared owner instead. A sixth *near*-copy exists in `client/src/lib/diets.ts`
   (`DIET_LABEL_LOOKUP`) — it is a **display-label** table, not the pattern→type mapping, and was
   left alone deliberately: collapsing a UI label table into a rules module would create coupling
   Register Rule 4 does not ask for.
3. **`WRITE-2`'s "the profile writes `users.diet*`" had TWO doors, not one.** The census named the
   profile save; onboarding (`POST /api/user/complete-onboarding`) also wrote the shadow columns —
   including SURF1B3's allergy-promotion routing. Both doors moved; SURF1B3's routing semantics are
   byte-preserved (the routed set now lands on the eater row).
4. **Every `file:line` in the Tier 2 items had rotted** (the P1–P3 pattern holds: paths first,
   counts next). The facts held at their new locations, with the two exceptions above.
5. **A live-data surprise the census could not have seen:** the SEC-1 fix (landed after the census)
   had already made `getHouseholdEaters` membership-filtered and the sync active-only — so
   `WRITE-3`'s "concurrent GETs can duplicate an adult" was real but its blast radius was already
   half-contained. The unique index closes it structurally either way.

---

## 5. GOVERNING DOCUMENTS — convergence recorded (corrections, not amendments)

Per CP4 and Register Rule 7 (**no ownership changed** — the platform converged ONTO the declared
owner, so no register re-declaration was needed; only status/inventory rows were corrected):

- **Source of Truth Register** — Domain 7 (Status → ✅ CONVERGED, live location = owner), Phase 3
  Duplication 4 (→ RESOLVED, resolution recorded above the preserved analysis), Phase 4 retirement
  row (→ ✅ RETIRED), Phase 5 consumer verdicts (five NO rows → YES with dates), Phase 7 priority
  list (#4 → RESOLVED), Appendix A (Dietary Preferences row → converged).
- **`ARCHITECTURE_PRINCIPLES.md`** — Principle 2's "Current violations" (the diet shadow removed,
  recorded as retired with date), the canonical-store table (Dietary Preferences → `household_eaters`,
  Authoritative), § 4 (→ ✅ CONVERGED with the resolution paragraph; analysis preserved as record).
- **`capabilities/household.md`** — the eaters scope now documents stored-row serving; the DOC-1
  "honest current state" table replaced with the converged state; binding rules updated (do not
  re-introduce an enrichment; the ratchet that catches it named).
- **`server/verification/publication-register.ts`** — domain 9's contract corrected to the
  converged owner; all four checks converted to **ratchets** (the shadow returning to the schema,
  the bridge string returning to routes, the `dietRestrictions: []` hardcode returning, an active
  member without an eater row). CPI1 back-references retained.

---

## 6. TEST SUITES — all affected suites green, run against the live migrated database

**26 suites run · 0 failures · ~1,940 assertions.** Ten test files converted to the converged
model; the conversions changed each test's *source of truth*, never what it proves — expected
values are unchanged throughout.

| Suite | Result | Conversion (if any) |
|---|---|---|
| `test-sec1-departed-member-eater-exposure` | **17/17** | `syncMembersAsEaters` calls removed (join creates the row); diet seeded via `updatePersonDiet`; "account untouched" became "**diet travels with her**" — after leaving, Alice's new household's eater row still declares Vegan + Nuts |
| `test-intelligence-household-binding` | **50/50** | Diets moved onto the in-memory eater rows (same expected values, now stored per `OWN-1`); the delegation assertion **inverted** — it now proves NO `getUser` call happens during an eaters read (`READ-1` as a test) |
| `test-intelligence-profile-binding` | **50/50** | Port fake implements `getPersonDiet`; view assertions unchanged |
| `test-surf1b3-onboarding-allergy-safety-routing` | **64/64** | The routing door writes `updatePersonDiet`; the source-level door assertion tracks the new write; live sweep re-pointed to eater rows |
| `test-surf1b4-canonical-diet-pattern-safety` | **316/316** | Final live sweep reads eater rows via `dietPatternFromDietTypes` — 17 live vegan/vegetarian households × 3,036 meals, **zero leaks** |
| `test-surf1b5-starter-meal-safety` | **84/84** | Sweep converted; one household pick disambiguated (a live vegan+allergen household correctly gets *fewer, never unsafe* starter meals) |
| `test-diet-reconciliation-bridge` | **21/21** | **Rewritten as the `WRITE-1` ratchet**: the bridge string must stay gone from routes.ts; `updatePersonDiet`→`getPersonDiet` round-trips (pattern head first, non-canonical `halal` preserved); `user_preferences.diet_types` untouched by a pattern write |
| `test-surf1b` / `test-surf1b2` | **54/54 · 173/173** | Raw-SQL sweeps of the dropped column rewritten against active-member eater rows |
| `test-intelligence-personality-platform` | **323/323** | Port fake gained `getPersonDiet` |
| `test-household-eater` · `test-guest-eater` | **13/13 · 17/17** | none needed |
| `test-smart-suggest-diet-pattern` · `test-dietary-trust-fix` · `test-planner-compliance-gate` · `test-plant-milk-vegan` · `test-keto-low-carb-dictionary` | **26 · 26 · 25 · 27 · 82 — all pass** | none needed (their `dietPattern` usages are view/context shapes, not the retired columns) |
| `test-surf1c1` · `test-surf1c2` | **81/81 · 65/65** | none needed |
| `test-intelligence-context-composition` · `test-nutrition-enrichment` | **166/166 · 22/22** | none needed |
| `test-intelligence-household-discovery-binding` · companion `-enrichment`/`-guidance` | **48 · 35 · 74 — all pass** | none needed |
| `test-benchmark-capability-utilisation` · `test-benchmark-routing-integrity` | **70/70 · 117/117** | none needed (fixtures' account diet now seeds eater rows via the seeder) |
| `diet-audit-matrix` · `dry-run-planner-compliance-cleanup` | clean | none needed |

`scripts/ci/setup-test-database.ts` verified free of retired-column references. **No production
defect surfaced by any suite.**

---

## 7. WHAT WAS REFUSED

- **Retiring `user_preferences.dietTypes`.** The DOC-1-corrected Register is explicit: it is
  Domain 27's own soft-preference fact, not a rival owner; only its diet-pattern MIRROR (the
  bridge) was debt. Deleting the column would have been an unordered retirement smuggled into P4.
- **Stripping historical canonical values out of `user_preferences.diet_types` data.** Bridge-written
  mirrors and genuinely-authored soft preferences are indistinguishable in the data; deleting them
  risks destroying a household's declaration to tidy a retired mechanism's residue. The copy
  migration unions them onto the eater row instead — a superset, never a loss.
- **Deriving a diet pattern for account-less eaters** in the safety resolver. They are never the
  requester, so no pattern of theirs gates anything; deriving one would be a behaviour change
  outside P4's scope. (`dietPattern: null` for them, exactly as before.)
- **Deleting the departed member's eater row on leave/removal** — retention is a data-protection
  decision this phase is not entitled to take (PEOPLE1 § 8.1's boundary; SEC-1's filter already
  closes the exposure).
- **`users.eatingSchedule`** — PEOPLE1 Step 8, not in P4. Untouched.
- **Renaming or "fixing" anything in the pre-existing typecheck/adoption debt** — none of it is
  P4's, and adopting it would make P4's own measure unreadable (the P2/P3 discipline).

## 7.1 New backlog raised by P4 (recorded, not smuggled in)

- **`roleMap.get(uid) ?? "member"`** in `household-discovery-engine.ts` (P3 § 4.1's find) remains —
  it concerns membership *role*, not diet, and stayed outside P4's six workstreams.
- **The client label table** (`client/src/lib/diets.ts` `DIET_LABEL_LOOKUP`) duplicates the
  pattern *spellings* for display. Harmless today; a candidate for deriving from
  `shared/dietRules.ts` in a UI pass.
- **`user_preferences.diet_types` residue**: rows still hold canonical values the bridge wrote.
  Nothing reads them as the pattern any more; they linger as soft-preference noise. A data-hygiene
  decision for Domain 27's owner, deliberately not taken here (§ 7).

---

## 8. THE REMAINING CONV1 BACKLOG

**Closed to date:** P0 (out-of-band security) · P1 (`DOC-1..4`·`OWN-5`) · P2 (`WRITE-4`·`BEH-8`) ·
P3 (`BEH-1`·`BEH-4`·`BEH-7`) · **P4 (`WRITE-3`·`WRITE-2`·`OWN-1`·`READ-1`·`READ-2`·`WRITE-1`)** —
**16 of 24 census items.**

| Phase | Contains | Status |
|---|---|---|
| **P5 — Household Time: the module and the zone** | `OWN-4` → `OWN-3` → `SCH-1` | **open — recommended next** |
| **P6 — Household Time: T2/T3** | `READ-4` ★ → `BEH-6` ★ → `SCH-4` → the greeting ×4 | open — needs P5 |
| **P7 — The anchor** ★ | `SCH-2` | open |
| **P8 — The T5 convergence** | `READ-3` · `OWN-6` · `BEH-3` · `OWN-2` · `BEH-9` | open — needs P7 |
| **P9 — Retire the fabricator** | `BEH-5` | open — needs `SCH-2` |
| **P10 — The long game** | `SCH-3` | open |
| **P—** | `SEC-5` → a birth date → `BEH-2` | **behind the legal gate** |

---

## 9. RECOMMENDED NEXT WORKSTREAM

> **P5 — Household Time: the module and the zone (`OWN-4` → `OWN-3` → `SCH-1`).**

It is the programme's own next phase and its risk register's top entry (`R1`: *"the declared owners
are never built"* — `shared/time/household-time.ts` has been law without code since 2026-07-16, and
every day it stays unbuilt the platform's twenty private clocks keep accruing consumers). It is
also the cheapest phase remaining: the module is pure, zero-I/O, reversible by deleting one file;
`OWN-3` (the season rule, three copies → one) needs no zone and no anchor; and `SCH-1` (the
nullable `households.timeZone` column) unblocks seven of the twelve time consumers — including the
two sharpest live defects queued for P6 (`READ-4`, the Companion's UTC today; `BEH-6`, the freezer
expiry that is wrong for hours every day).

**P4 has also just cleared P5's runway:** with the Household Person converged, Domain 16 is quiet —
`SCH-1` lands its column on an owner whose contract the publication gate now watches green.

---

*Rollback: `rollback/CONV1-phase-p4-household-person-20260716` → `7d1dd2ce`. **The tag is a marker,
not a restore point** — it predates every uncommitted correction in a tree dirty from many
concurrent sessions (one of which committed a preservation snapshot, `9900e405`, mid-phase), and a
tag checkout would destroy them. To roll back P4's CODE, revert the files listed in the run file
(`.engineering/session/runs/CONV1_Phase_P4_Household_Person.md`). To roll back P4's DATA: the
columns are dropped and their content lives on `household_eaters` as a superset — restoring the old
shape would itself be a migration, gated the same way.*
