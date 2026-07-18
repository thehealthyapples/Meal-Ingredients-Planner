# P0 — Food Intelligence Recovery — Implementation

**Status:** Complete
**Date:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Source investigation:** `docs/investigations/intelligence/FI18_HOUSEHOLD_FOOD_INTELLIGENCE_EXPERIENCES.md` (P0.1–P0.5)
**Governing architecture:** `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` (§8 rollout gates, §9 stop rules) · `THA_DECISION_ENGINE_ARCHITECTURE.md` (DEC1 §7 — the one enrolment door) · `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (§13 corrected here) · `CANONICAL_PUBLICATION_ARCHITECTURE.md` (the verification gate)

**Mission:** repair the broken activation paths before any new intelligence work. Fix only verified defects. Add no capabilities, no features, no schemas, no ownership.

---

## ROLLBACK PROTECTION

**Rollback identifier: `rollback/P0-food-intelligence-recovery-20260717` → commit `10573dd20baa9497975c4ed05837b75162305410`**

```bash
git diff rollback/P0-food-intelligence-recovery-20260717   # inspect
git checkout rollback/P0-food-intelligence-recovery-20260717 -- .   # restore
```

**Working tree at start was intentionally dirty — NOT THIS SESSION'S.** Pre-existing uncommitted work from sibling sessions (NORTH3, NORTH4, CONV1 P10) was present and was **not touched, not committed, and not reverted**. The tag protects committed state only. Every "pre-existing" claim below was verified against a **clean `git worktree` at this tag**, never by mutating the dirty tree.

---

## THE HEADLINE

**The mission's own constraints forbade the mission's own instruction, and that is the finding.**

"Repair the Notice Gateway" and "repair the HHP2 activation path" both turned out to mean **build the feature**, not fix a defect:

| Path | What "repair" actually required | Verdict |
|---|---|---|
| **Notice Gateway** | It does not merely miss 3 imports. `NoticeCategory` is a **closed 8-category taxonomy**, and the gateway scopes **four categories that do not exist in it**. Repair = +4 categories, +3 producers, +3 `fact` kinds, +4 `phraseNotice` cases. **That is NTC-P2** — a separately-gated rollout (Notice Engine §8) — refused by §9: *"any new notice category without a registered owner behind it — **stop**."* | **RETIRED** |
| **HHP2** | `household-health` is in **no registry at all** (zero hits in `capability-registry.ts` AND `framework.ts`). Repair = **register a new capability** + **enrol a new producer**. | **RETIRED** |

Both were **retired, with the user's explicit approval**, because retirement is the only option inside the mandate. **Nothing was protecting either path:** the gateway had **zero runtime importers**, `bindHouseholdHealthCapability` was **never called**, and the panel at the consumer end has **zero importers**. **No user-facing behaviour changed. No household lost anything, because no household was receiving anything.**

Retirement is **not a verdict on the ideas**. NTC-P2 and HHP2 enrolment are both legitimate and both remain available — through their own gates, with the reviewed enrolment they skipped the first time.

---

## DEFECTS RESOLVED

### P0.1 — `notice-gateway.ts` could not load → **RETIRED**

Verified before acting:

```
SyntaxError: The requested module './notice-engine.js' does not provide an export named 'noticeCelebration'
```

`noticeCelebration`, `noticeFoodDiscovery`, `noticeHouseholdInsight` are imported; **none is exported**. Beyond FI18's finding, the module also scoped **four categories absent from the closed taxonomy** (`celebration`, `household-insight`, `food-discovery`, `nutrition-opportunity`) — so it was **3 typecheck regressions**, not just a runtime throw. Zero runtime importers.

**Deleted:** `server/intelligence/conversation/notice-gateway.ts`, `server/tests/test-intelligence-notice-convergence.ts`.
**`notice-engine.ts` is byte-untouched** and still loads and passes its own registered test. The engine was always fine; only its unreachable orchestrator was broken.

### P0.2 — HHP2 recorded "Complete", wired to nothing → **RETIRED**

Every FI18 claim re-measured and confirmed:

| Claim | Measured 2026-07-17 |
|---|---|
| Enrolled in `OPPORTUNITY_SOURCES` | **Zero** occurrences in `framework.ts`; map holds one entry (`food-intelligence`) |
| Capability registered | **Zero** occurrences in `capability-registry.ts` |
| Binding activated | `bindHouseholdHealthCapability` — **never called**; only its own definition |
| Tests prove it | Source-scan for text absent from the file; **crashes on import**; **not in `npm test`** |

**Deleted:** `bindings/household-health.ts`, `handlers/household-health-handler.ts`, `handlers/household-health-read-port.ts`, `test-hhp2-…ts`, `test-hhp3-…ts`.

### P0.3 — Tests that never run → **FIXED, AND FAR LARGER THAN RECORDED**

FI18 named **3** unregistered tests. The measured truth: **61 of 151 test files (40%) never ran.**

**Registered 51 passing orphans. The `npm test` chain grew 90 → 141 gates.**

**The most serious thing found today is in that list: dietary restriction and allergy SAFETY tests were sitting unregistered** —

- `test-restriction-safety.ts`
- `test-household-vegan-vegetarian-hard-enforcement.ts`
- `test-profile-dietary-title-safety.ts`
- `test-plant-milk-vegan.ts`
- `test-restriction-resolver.ts` · `test-dietary-trust-fix.ts`

These pass. They have always passed. **Nothing was checking that they still did.** On a platform whose Experience canon treats a restriction conflict as its only `critical`, safety gates that do not run are the defect that matters most in this report, and it was found only because P0.3 was measured rather than taken at face value.

#### …and registering them was NOT enough, because `npm test` was already RED

Registering a test into a chain that never reaches it changes nothing. **`npm test` was failing before this session started** — verified on a clean worktree at the rollback tag, not inferred.

**`npm test` is an `&&` chain. It died at link 9 of 141. 132 gates never executed.**
**Before this session it died at the same link: 81 of 90 never ran. The platform's effective test suite was EIGHT TESTS.**

The cause is this report's own defect class, one more time:

> **RM3 (2026-07-15) correctly retired the `/api/meal-template-products/:id` route** — the write surface of the duplicate ready-meal representation, no live consumer (RM1 §3.3, §8). **That legitimate retirement broke a stale text grep** in `test-trust1-s3a-meal-ownership-idor.ts`, which asserted `assertAdmin` on a route that no longer exists. **The 9th link went red, and every gate behind it stopped running — for two days, in silence**, because an `&&` chain that stops early exits non-zero exactly like a chain that ran and failed.

**This is the mechanism behind every other finding in this report.** HHP2 could be recorded "Complete" while wired to nothing, 61 tests could sit unregistered, and four workstreams could half-land — because *the suite that would have objected was not running.*

**Fixed** (`server/tests/test-trust1-s3a-meal-ownership-idor.ts`), and the fix is **provably security-neutral**:

- Both **live** routes keep their `assertAdmin` assertions, unweakened.
- The removed clause guarded a **retired route** — a route with no attack surface. Asserting its guard is not security; it is a grep outliving its subject.
- **A new assertion was ADDED**, so the retired route cannot silently return unguarded: `!/app\.delete\("\/api\/meal-template-products\/:id"(?!,\s*assertAdmin)/`. **Retirement is a state to hold, not a one-off.**
- The security property the file exists for — meal ownership, 404-never-403 — is **untouched**. Result: **25 passed, 0 failed** (was 23 passed, 1 failed).

**This was in scope because P0.3's deliverable is that the tests _execute_.** Registering 51 tests behind a permanently-red link 9 would have been a paper fix — the exact failure this report is about.

### P0.4 — The publication gate greped a module that could not load → **FIXED**

Worse than FI18 recorded. The `cn-undeclared-category` check greped `notice-gateway.ts` for a `cookbook-opportunity` category **that exists in neither file** — so it **passed vacuously, over a module that threw `SyntaxError` on import.** A green check verifying nothing, on top of a module that cannot run.

**This is CONV1 P10's finding at a second gate: _the gate is a text grep._**

- `canonicalOwner`: `"conversation-gateway.ts + notice-gateway.ts"` → `"conversation-gateway.ts"`
- `cn-undeclared-category`: **deleted, not replaced.** Its subject is retired and it verified nothing. Replacing it would have been new work.
- `knownGaps`: now **declares NTC-P2 unbuilt** instead of greping for an owner that does not exist.

**Companion / Notice verifies 🟢 with the correct owner.** It was green before too — the removed check was a `warn` returning `violated: false`, so **no verdict was masked**; the check count honestly drops 77 → 76.

### P0.5 — Food Intelligence Architecture §13 materially false → **CORRECTED**

§13 said *"No Food Intelligence Engine … exists yet"* and *"0% Domain Intelligence layer build-out"*, scheduling the engine as Phase 1 future work. **Verified against the code, not the report:** `server/intelligence/food-intelligence/engine.ts` (359 lines) opens by naming **that very document** as its governing architecture and stating *"This module **IS** the 'Domain Intelligence' layer named there (§2, §7.1)."*

**This document is mandatory Architecture Bootstrap reading.** Its falsehood was not cosmetic: it told every arriving workstream *"the engine is unbuilt"*, so the next step it implied was **build the engine** — while the engine sat built and merely unreachable. It is the `DOC-4`/`KC14` failure the Bootstrap README already records twice.

**Corrected: status only. No rule, phase gate, or ownership boundary was touched.** The §8 Phase 0 gate stands.

> **The one-sentence correction:** *THA did not fail to build its Domain Intelligence layer. It built it, did not connect it, and then wrote down that it had never been built.*

### Also corrected — two false claims in shipped source (discovered, not in FI18's P0 list)

**`shared/nutrition/household-nutrition.ts`** asserted *"HHP2 MADE THAT TRUE … it is registered in `OPPORTUNITY_SOURCES`"*. False.

The comment is worth quoting because it diagnoses its own failure mode and then commits it in the next paragraph:

> *"…the comment asserting it had shipped is exactly what stops the next reader from checking."*

**The same false claim was made twice, five months apart, each in the present tense** — HNP1 wrote it aspirationally, HHP2 wrote "HHP2 MADE THAT TRUE" and built none of it, **citing as proof a test that scanned for absent text, bypassed the unregistered registry, and never ran.** The full history is preserved in the corrected comment, because it is the whole lesson.

**`client/src/components/HouseholdNutritionPanel.tsx`** claimed the producer path *"is untouched and still receives every opportunity HNP1 composes."* False — there was no producer path. **HHP3 removed a live wire field in favour of a path that had never been connected, and cited the dead path as proof the removal was safe.**

**The HHP3 removal is left standing** — it is separately correct (the route *was* a Decision Engine bypass, DEC1 §3), and re-adding the field would rebuild the bypass rather than the producer. The honest state: **HNP1's opportunities reach no surface. A gap with a known door, not a regression to undo here.**

**Completion records corrected in place** (`HHP2_…md`, `HHP3_…md`) with the original text preserved unedited beneath, as evidence rather than status.

---

## FILES CHANGED

**Deleted (7)**
```
server/intelligence/conversation/notice-gateway.ts
server/intelligence/bindings/household-health.ts
server/intelligence/handlers/household-health-handler.ts
server/intelligence/handlers/household-health-read-port.ts
server/tests/test-intelligence-notice-convergence.ts
server/tests/test-hhp2-household-health-opportunities.ts
server/tests/test-hhp3-household-health-delivery-convergence.ts
```

**Modified (8)**
```
package.json                                              51 tests registered (90 → 141 gates)
server/tests/test-trust1-s3a-meal-ownership-idor.ts       stale grep on an RM3-retired route — the link-9
                                                          blocker that stopped 132 gates. Security-neutral;
                                                          a retirement-holds assertion ADDED
server/verification/publication-register.ts               P0.4 — owner corrected, vacuous check removed, gap declared
shared/nutrition/household-nutrition.ts                   false claim corrected (comment only)
client/src/components/HouseholdNutritionPanel.tsx         false claim corrected (comment only)
docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md   P0.5 — §13 status corrected
docs/implementation/health/HHP2_HOUSEHOLD_HEALTH_OPPORTUNITY_PLATFORM.md    "Complete" → retired
docs/implementation/health/HHP3_HOUSEHOLD_HEALTH_DELIVERY_CONVERGENCE.md    false premise recorded
```

**Net: 15 files · +297 / −2,092 lines.** A recovery that deletes ~1,800 net lines and adds no capability is the shape the mandate required.

**No schema change. No new capability. No new ownership. No new feature. No product behaviour change.**

---

## TWO DELIBERATE DEVIATIONS FROM THE APPROVED PLAN

All three surfaced *after* approval, and none is silent:

1. **`HouseholdNutritionPanel.tsx` was NOT deleted**, though the approved option named it. On inspection it is **HNP1's** panel, not part of the HHP2 *activation path* (registry → binding → handler → port → `OPPORTUNITY_SOURCES`), and it is the **only consumer of `/api/household-nutrition`** — deleting it orphans a live route that is HNP1's to decide about. Deleting it would have been scope creep against *"fix only the verified defects."* Its **verified defect was the false claim, which is corrected.** Its zero-importer status is reported below as a standing blocker.
2. **The three named P0.3 tests were deleted, not registered** — their subjects are retired, so there is nothing left to gate. The mission's *intent* (a gate that exists and never runs) was served far more broadly: **51 registrations**, including the safety gates above.
3. **A SECURITY test was edited** (`test-trust1-s3a-meal-ownership-idor.ts`) — an expansion beyond FI18's P0 list, and the one change in this session that could weaken a safety property, so it is flagged loudest. It was **required to deliver P0.3**: the mission says the tests must *execute*, and 132 gates could not. **It is provably security-neutral** — both live routes keep `assertAdmin`; the deleted clause guarded an **RM3-retired route**; and **a new assertion was added** so that route cannot silently return unguarded. **No security property was relaxed; one was added.** If a reviewer overturns exactly one change in this report, it should be this one — the evidence is in the file, at the assertion.

---

## TESTS EXECUTED

| Gate | Result |
|---|---|
| `npm run typecheck:ci` (baseline gate) | **32 → 27 regressions.** **Five removed, zero introduced** — verified against a clean worktree at the rollback tag. The 5 are exactly the deleted files (3 × `notice-gateway.ts`, 1 × each deleted test) |
| `npm run verify:publication` | **Runs. Companion / Notice 🟢**, owner corrected. 4 reds (Meals, Meal Templates, Pantry, Nutrition Boost/Uplift) **pre-existing and unrelated — no credit claimed** |
| `npm run adoption:check` | **2 failures, BOTH pre-existing** — reproduced on a clean worktree at the rollback tag. Neither is mine (I added no `<button>`; the panel orphan predates this session) |
| Orphan re-scan | **61 → 7 unregistered tests** |
| **`npm test` (141 gates)** | ✅ **EXIT 0 — 141 of 141 executed, all passed.** Before this session: **9 executed, then dead.** The suite went from an effective **8 tests to 141** |
| Spot-checks via npm | `test:restriction-safety` · `test:household-vegan-vegetarian-hard-enforcement` · `test:profile-dietary-title-safety` · `test:intelligence-notice-engine` — **all PASS** |

Every "pre-existing" claim was proven by **running the gate on a clean `git worktree` at the rollback tag** — never asserted, and never established by mutating the dirty tree that held sibling sessions' work.

---

## REMAINING BLOCKERS

### 1. 🔴 Seven orphaned tests still cannot be registered — four are the SAME defect as the Notice Gateway

`notice-gateway.ts` was **not unique**. It is one instance of a pattern: **a workstream whose test imports exports that were never written.**

| Test | Failure |
|---|---|
| `test-cbk2-intelligent-cookbook.ts` | `SyntaxError` — no export `generateRecipeExplanation` |
| `test-pantry1-intelligent-pantry.ts` | `SyntaxError` — no export `EMPTY_PANTRY_HOUSEHOLD_FACTS` |
| `test-plan2-planner-evolution.ts` | `SyntaxError` — no export `INTELLIGENCE_SHARE` |
| `test-shop1-intelligent-shopping.ts` | `SyntaxError` — no export `identifyShoppingHigherRatedProductOpportunities` |
| `test-food-report-adapter.ts` | **2 assertion failures** (103 pass) |
| `test-household-nutrition.ts` | **1 assertion failure** (62 pass) |
| `test-intelligence-capability-composition.ts` | **8 assertion failures** (15 pass) |

**CBK2, PANTRY1, PLAN2 and SHOP1 are half-landed exactly as NTC-P2 was.** The last three are **live regressions that were invisible because the tests never ran.** Each needs its own triage: fix the code, or retire the test with its subject. **Not fixable here** — each belongs to another workstream and none is a Food Intelligence P0.

### 2. 🔴 The server has no adoption register — this failure WILL recur

HHP2 is `PX1`/UIA §17's *authored-but-unadopted* failure **repeated on the server**, where the instrument that catches it does not exist. The client-side gate works: it independently flagged `HouseholdNutritionPanel.tsx` with zero importers, unprompted. **The server has no equivalent, which is why a capability could be authored, recorded "Complete", and wired to nothing for five days without a single gate objecting.** Until a server-side adoption gate exists, **nothing prevents the next HHP2.**

### 3. 🟠 Pre-existing gate failures (not this session's, not fixed here)

- `adoption:check` — raw `<button>` count 539 vs ceiling 538; `HouseholdNutritionPanel.tsx` unregistered orphan. **Both reproduce on the clean tree.** `adoption-register.json` is **dirty with a sibling session's uncommitted work**, so this session did not touch it.
- `verify:publication` — 4 pre-existing domain reds, unrelated to Food Intelligence.
- 27 pre-existing typecheck regressions against the recorded baseline.

### 4. 🟠 The Food Intelligence layer is still mute (unchanged by this recovery, by design)

FI18's Findings 3, 7 and 8 stand untouched — this was a **defect recovery, not a connection workstream**:

- `food-intelligence:recommend`/`:explain` — **built, no route, no resolver matcher** (FI18 QW4)
- `<AmbientIntelligence>` — **not mounted on Home**, which already fetches the data (FI18 QW1)
- **600 of 610 foods have no citable evidence context** — Rule E1 forecloses the card. **Editorial, not engineering.** The binding constraint on the whole domain, and no engineering substitutes for it.

---

## ARCHITECTURE COMPLIANCE

| Check | Result |
|---|---|
| Architecture Bootstrap read first (`docs/architecture/README.md`) | ✅ Before any change |
| Conflict with governing architecture → STOP and seek approval | ✅ **This is the report's headline.** Both "repairs" required forbidden work; both were **stopped and escalated before any code was touched**, and retired only on explicit approval |
| Notice Engine §9 — no new category without a registered owner | ✅ **Obeyed by retiring rather than repairing.** The taxonomy is untouched |
| Notice Engine §8 — NTC-P1…P6 separately gated | ✅ NTC-P2 left unbuilt and gated; its status now **declared** in the publication register |
| DEC1 §7 — the one enrolment door | ✅ No producer enrolled. `OPPORTUNITY_SOURCES` byte-untouched |
| Principle 2 — one owner per fact | ✅ No owner created. One removed from the publication register (it could not load) |
| Principle 8 — retire on introduction | ✅ **This change is entirely retirement.** Nothing introduced |
| CPuBA — the gate must verify reality | ✅ A **vacuous grep** removed; an **honest `knownGap`** declared in its place |
| No new capability · no new feature · no schema change · no new ownership | ✅ All four held. Zero schema files touched |
| Experience & UI Governance | ✅ **N/A — no user-facing behaviour changed.** Client edits are comment-only |
| Product Registry Compliance (KC15) | ✅ **N/A** — nothing user-facing added, changed or retired; the retired paths reached no household and appear in no registry entry |
| Adoption Register Compliance (UIA §17) | ✅ **N/A** — no client building block added, changed or retired (comment-only edit). Pre-existing failures reported, not absorbed; the sibling-dirty register was not touched |
| Repository Conventions | ✅ Report filed under `docs/implementation/intelligence/` per the mission |

---

## DEFINITION OF DONE

- [x] Architecture bootstrap read before any change
- [x] `git status` confirmed; **rollback tag created and resolved** before any edit
- [x] **Every FI18 P0 finding independently re-verified** — none taken on the report's word
- [x] **Conflict between mission and mandate identified, escalated, and approved before acting**
- [x] P0.1 — Notice Gateway retired; `notice-engine.ts` untouched and still passing
- [x] P0.2 — HHP2 activation path retired; completion records corrected
- [x] P0.3 — **51 tests registered (90 → 141)**; 7 unregisterable ones reported with causes
- [x] P0.4 — publication register corrected; vacuous check removed; gap declared
- [x] P0.5 — FI §13 corrected (status only; **no rule changed**)
- [x] Two false claims in shipped source corrected
- [x] **All repaired paths execute successfully** — see below
- [x] **Zero new typecheck regressions** (32 → 27), proven against a clean worktree
- [x] **Every "pre-existing" claim proven on a clean worktree**, never asserted
- [x] Sibling sessions' uncommitted work **untouched**
- [x] Deviations from the approved plan **declared, with reasons**
- [x] Remaining blockers reported **without minimisation**

**Verification of "all repaired paths execute successfully":**

| Path | Evidence |
|---|---|
| `notice-engine.ts` | Loads; `npm run test:intelligence-notice-engine` **PASS** |
| `publication-register.ts` | Loads; `verify:publication` runs; **Companion / Notice 🟢** |
| The 51 registered tests | **All executed inside the full `npm test` chain and passed** — confirmed reaching the end of the chain (`test:variety-surfacing`, the final link) |
| Retired modules | **Zero residual importers** in `server/`, `client/`, `shared/` |
| **The whole suite** | **`npm test` → EXIT 0 · 141/141 executed · 0 failed.** The single most important line in this report: **the gates run again** |

---

## THE LESSON WORTH KEEPING

Three separate instruments were **green over this rot for five days**:

1. A **completion record** said "Complete" — of a capability registered nowhere.
2. A **test** asserted the enrolment — by scanning for text that was not in the file, bypassing the registry it should have used, **and never running**.
3. A **publication gate** verified the module — by **greping it for a string absent from both files**, over a module that threw on import.

**Each instrument reported success by not looking.** The completion record stopped the reader, the test stopped the reviewer, the gate stopped the auditor — and every one of them was satisfied by a check that could not fail.

**A gate that cannot fail is not a gate. It is a decoration that costs more than no gate at all, because no gate at least admits it is absent.** That is CONV1 P10's finding — *the gate is a text grep* — recurring at two more gates, and it is the reason 40% of this platform's tests could stop running without anyone noticing.

The corrective is not more gates. It is that **every gate must be able to fail, and something must have watched it fail once.**
