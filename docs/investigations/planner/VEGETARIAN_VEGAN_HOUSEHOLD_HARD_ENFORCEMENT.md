# Vegetarian/Vegan Household Hard Enforcement

## Rollback Identifier

Tag: `rollback/pre-vegetarian-vegan-hard-enforcement`  
Points to commit: `74dd7e3` (checkpoint: pre-vegetarian-vegan-hard-enforcement rollback point)

Rollback procedure:
```
git checkout rollback/pre-vegetarian-vegan-hard-enforcement -- \
  server/lib/smart-suggest-service.ts \
  server/routes.ts
```
No data cleanup, migration rollback, or profile changes required.

---

## Problem Statement

Household eater Vegetarian/Vegan diet types previously entered `mergedDietTypes` (scoring influence only) but did NOT enter `candidateDietExcluded()`. A child or non-request-user adult household member with a Vegetarian or Vegan diet could silently receive chicken, fish, dairy, eggs, or honey in their shared plan.

The request-user's own `dietPattern` was already hard-enforced via `isDietExcluded`. The gap was purely for household eaters.

---

## Implementation Notes

### Approach

Introduced a new `householdStrictDiets?: string[]` field on `SmartSuggestSettings`. This carries Vegetarian and/or Vegan patterns sourced from household eaters (not the request user, whose `dietPattern` is already enforced). The service applies this as an additional independent hard exclusion gate, reusing the existing `candidateDietExcluded` / `shouldExcludeRecipe` engine — no new keyword dictionary.

Only Vegetarian and Vegan are hard-enforced. Mediterranean, DASH, MIND, Flexitarian, Keto, Low-Carb, Paleo, and Carnivore are not added to this path (as specified).

The Vegan-subsumes-Vegetarian deduplication ensures we never double-check what a more-restrictive diet already covers:
- Request user Vegan → householdStrictDiets can add nothing further
- Request user Vegetarian → Vegan still added from householdStrictDiets if any eater is Vegan

### Files Changed

| File | Change |
|------|--------|
| `server/lib/smart-suggest-service.ts` | Added `householdStrictDiets` to `SmartSuggestSettings`; added `isHouseholdStrictDietExcluded` predicate; applied to user meals loop, external candidates loop, and Tier-4 `selectShellRecoveryCandidate` call; updated `selectShellRecoveryCandidate` signature and body |
| `server/routes.ts` | Added `householdEaterStrictDiets` collection inside the eater loop; deduplication against request-user `dietPattern`; set `settings.householdStrictDiets` before `generateSmartSuggestion` call |
| `server/tests/test-household-vegan-vegetarian-hard-enforcement.ts` | New test file (31 assertions, all pass) |

### Exact Enforcement Path

**Candidate pool construction** (`generateSmartSuggestion`):
1. `isHardExcluded` — household hard restrictions
2. `isDietExcluded` — request-user `dietPattern` + `dietRestrictions` (existing)
3. `isHouseholdStrictDietExcluded` — **NEW** — `householdStrictDiets` from eaters

Both user-library meals and external API candidates go through all three gates.

**Tier-4 shell recovery** (`selectShellRecoveryCandidate`):
1. Slot fit check
2. `compatibility === 1` (zero diet conflicts from matcher)
3. Per-ingredient: `candidateHardExcluded` + `candidateDietExcluded` + **NEW** HSD check
4. Whole-shell: `candidateHardExcluded` + `candidateDietExcluded` + **NEW** HSD check

**Route assembly** (`routes.ts`):
- Inside the eater loop, after resolving `eaterDietTypes`, check for "vegan"/"vegetarian"
- Collect into `householdEaterStrictDiets` set
- After the loop: remove what's already covered by `settings.dietPattern`
- Assign remainder to `settings.householdStrictDiets`

---

## Tests Executed

File: `server/tests/test-household-vegan-vegetarian-hard-enforcement.ts`

| Test | Assertion | Result |
|------|-----------|--------|
| 1 | Child Vegetarian: chicken blocked from pool | PASS |
| 1 | Child Vegetarian: fish blocked from pool | PASS |
| 1 | Child Vegetarian: plan fills 7 slots | PASS |
| 1 | Child Vegetarian: no meat/fish in any served entry | PASS |
| 2 | Adult Vegetarian member: beef blocked | PASS |
| 2 | Adult Vegetarian member: fish blocked | PASS |
| 2 | Adult Vegetarian member: no meat/fish in any served entry | PASS |
| 3 | Child Vegan: chicken + dairy blocked | PASS |
| 3 | Child Vegan: eggs + dairy blocked | PASS |
| 3 | Child Vegan: honey blocked | PASS |
| 3 | Child Vegan: no animal products in any served entry | PASS |
| 4 | Adult Vegan member: lamb blocked | PASS |
| 4 | Adult Vegan member: prawns blocked | PASS |
| 4 | Adult Vegan member: dairy blocked | PASS |
| 4 | Adult Vegan member: no animal products in any served entry | PASS |
| 5 | Mixed omni+Veg: steak excluded | PASS |
| 5 | Mixed omni+Veg: tuna excluded | PASS |
| 5 | Mixed omni+Veg: vegetarian-safe meals remain | PASS |
| 6 | Mediterranean+Vegan: salmon excluded | PASS |
| 6 | Mediterranean+Vegan: feta excluded | PASS |
| 6 | Mediterranean+Vegan: plant-based meals remain | PASS |
| 7 | Coconut milk: NOT Vegan-excluded | PASS |
| 7 | Oat milk: NOT Vegan-excluded | PASS |
| 7 | Coconut cream: NOT Vegan-excluded | PASS |
| 7 | Dairy milk: STILL Vegan-excluded | PASS |
| 7 | Pool test: cheese pasta excluded | PASS |
| 7 | Pool test: plant milk meals survive | PASS |
| 8a | Tier-4 Vegetarian: chicken shell rejected | PASS |
| 8b | Tier-4 Vegan: fish + cheese shells rejected | PASS |
| 8c | Tier-4 no HSD: chicken shell passes (backward compat) | PASS |
| 8d | Tier-4 request-user Vegetarian via dietPattern | PASS |

All 31 assertions pass.

Existing tests also run clean:
- `test-smart-suggest-diet-pattern.ts`: 26/26
- `test-plant-milk-vegan.ts`: 27/27
- `test-slot-filling-recovery.ts`: 16/16
- `test-planner-compliance-gate.ts`: 25/25
- `test-keto-low-carb-dictionary.ts`: 80/80
- `test-smart-suggest-restrictions.ts`: 30/30

---

## Candidate Pool Impact

- Pools with no Vegetarian/Vegan household eaters: **zero change**
- Pools with a Vegetarian household eater: meat and fish excluded (dairy/eggs remain)
- Pools with a Vegan household eater: meat, fish, dairy, eggs, honey, gelatin excluded
- Plant milk phrases (coconut milk, oat milk, coconut cream, etc.) remain allowed for Vegan via the existing `PLANT_MILK_PHRASES` whitelist in `dietRules.ts`

If candidate pools shrink too far for a household, Tier-3 (repeat) and Tier-4 (shells) engage as before — both now also enforce the household strict diet rules.

---

## Scope Confirmation

- Schema changed: NO
- Migrations created: NO
- Profile UI changed: NO
- dietRules keyword dictionary changed: NO
- allergy/intolerance handling changed: NO
- Scoring weights changed: NO
- Shells seeded: NO
- Planner UX changed: NO
- Mediterranean/DASH/MIND/Flexitarian/Keto/Low-Carb/Paleo/Carnivore hard-enforced: NO (unchanged)

---

## Final Outcome

Vegetarian and Vegan household eater diet patterns are now hard-enforced in both the Smart Planner candidate pool and Tier-4 meal shell recovery. The implementation reuses the existing single-source-of-truth diet rules engine with no duplicated keyword logic.
